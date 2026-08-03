#!/usr/bin/env python3
"""Small, local task-state helper for the SFHS Doom governance workflow.

The helper deliberately handles task metadata and repository checks only.  It
does not execute commands described by task data and it has no network or
background-process behavior.
"""

from __future__ import annotations

import argparse
import datetime as _datetime
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
STATE_RELATIVE = Path(".agent/task-state.json")
TASKS_ROOT = Path("docs/tasks")
RESULTS_ROOT = Path("docs/results")
KNOWN_STATUSES = {"pending", "running", "done", "blocked", "failed"}
COMMIT_SELF = "SELF"
TASK_ID_PATTERN = re.compile(r"DOOM-P\d+-\d{3}")
TASK_HEADING_PATTERN = re.compile(r"^#+\s+(DOOM-P\d+-\d{3})\b", re.MULTILINE)
PHASE_DIRECTORY_PATTERN = re.compile(r"P\d{2}")
SHA_PATTERN = re.compile(r"[0-9a-fA-F]{40}")


class TaskCtlError(Exception):
    """A user-facing taskctl error."""


def _utc_now() -> str:
    return _datetime.datetime.now(_datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _clean_markdown_value(value: str) -> str:
    return value.strip().strip("`").strip()


def _path_string(path: Path) -> str:
    return path.as_posix()


def _is_within(relative: str, allowed: Iterable[str]) -> bool:
    candidate = relative.replace("\\", "/").lstrip("./")
    for raw in allowed:
        rule = raw.replace("\\", "/").strip().lstrip("./")
        if rule.endswith("/**"):
            prefix = rule[:-3].rstrip("/")
            if candidate == prefix or candidate.startswith(prefix + "/"):
                return True
        elif candidate == rule:
            return True
    return False


def _safe_relative_path(root: Path, value: str) -> str:
    """Return a normalized repo-relative path, rejecting escapes."""

    candidate = Path(value)
    if candidate.is_absolute():
        try:
            candidate = candidate.resolve().relative_to(root.resolve())
        except ValueError as exc:
            raise TaskCtlError(f"path is outside repository: {value}") from exc
    normalized = candidate.as_posix()
    if normalized == "." or normalized.startswith("../") or normalized == "..":
        raise TaskCtlError(f"path is outside repository: {value}")
    return normalized


def _field(text: str, label: str) -> str:
    match = re.search(rf"^\*\*{re.escape(label)}:\*\*\s*(.+)$", text, re.MULTILINE)
    return match.group(1).strip() if match else ""


def _phase_directory(task_id: str) -> str:
    match = re.fullmatch(r"DOOM-P(\d+)-\d{3}", task_id)
    if match is None:
        raise TaskCtlError(f"invalid task ID: {task_id}")
    return f"P{int(match.group(1)):02d}"


def _result_path(task_id: str) -> str:
    return _path_string(RESULTS_ROOT / _phase_directory(task_id) / f"{task_id}.md")


def _discover_card(root: Path, task_id: str) -> tuple[str, str]:
    tasks_root = root / TASKS_ROOT
    expected_phase = _phase_directory(task_id)
    matches: list[tuple[Path, str]] = []
    if tasks_root.is_dir():
        for phase_dir in sorted(tasks_root.iterdir()):
            if not phase_dir.is_dir() or not PHASE_DIRECTORY_PATTERN.fullmatch(phase_dir.name):
                continue
            for card_path in sorted(phase_dir.glob("*.md")):
                try:
                    text = card_path.read_text(encoding="utf-8")
                except OSError as exc:
                    raise TaskCtlError(f"cannot read task card {_path_string(card_path.relative_to(root))}: {exc}") from exc
                heading = TASK_HEADING_PATTERN.search(text)
                if heading is not None and heading.group(1) == task_id:
                    matches.append((card_path, text))
    if not matches:
        expected = _path_string(TASKS_ROOT / expected_phase / f"{task_id}.md")
        raise TaskCtlError(f"task card is missing: {expected}")
    if len(matches) > 1:
        paths = ", ".join(_path_string(path.relative_to(root)) for path, _ in matches)
        raise TaskCtlError(f"duplicate task-card identity {task_id}: {paths}")
    card_path, text = matches[0]
    if card_path.parent.name != expected_phase:
        actual = _path_string(card_path.relative_to(root))
        raise TaskCtlError(f"task card is in the wrong phase directory: {actual}; expected {expected_phase}")
    return _path_string(card_path.relative_to(root)), text


def _parse_card(root: Path, task_id: str, card_value: str | None = None) -> dict[str, Any]:
    card_rel, text = _discover_card(root, task_id)
    if card_value is not None:
        recorded_rel = _safe_relative_path(root, card_value)
        if recorded_rel != card_rel:
            raise TaskCtlError(f"recorded card path {recorded_rel} does not match discovered card {card_rel}")

    heading = TASK_HEADING_PATTERN.search(text)
    card_id = heading.group(1) if heading else ""
    branch_raw = _field(text, "Branch")
    branch_match = re.search(r"(phase/p\d{2}-[a-z0-9-]+)", branch_raw, re.IGNORECASE)
    branch = branch_match.group(1) if branch_match else branch_raw.strip().strip("`")
    dependency_raw = _field(text, "Depends on")
    dependencies = re.findall(r"DOOM-P\d+-\d{3}", dependency_raw)
    allowed_raw = _field(text, "Allowed files/directories")
    allowed: list[str] = []
    if allowed_raw:
        for item in allowed_raw.split(";"):
            cleaned = _clean_markdown_value(item.rstrip("."))
            if cleaned:
                allowed.append(cleaned)
    return {
        "id": card_id,
        "card": card_rel,
        "branch_raw": branch_raw,
        "branch": branch,
        "dependencies": dependencies,
        "allowed_paths": allowed,
        "result": _result_path(task_id),
    }


def _branch_matches(actual: str, contract: str) -> bool:
    if not contract or "none yet" in contract.lower():
        return True
    return actual == contract or contract.lower() == actual.lower()


class TaskCtl:
    def __init__(self, root: Path):
        self.root = root.resolve()
        self.state_path = self.root / STATE_RELATIVE

    def _git(self, *args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
        command = [
            "git",
            "-c",
            f"safe.directory={self.root.as_posix()}",
            "-C",
            str(self.root),
            *args,
        ]
        result = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", errors="replace")
        if check and result.returncode != 0:
            detail = result.stderr.strip() or result.stdout.strip() or "git command failed"
            raise TaskCtlError(detail)
        return result

    def _load(self) -> dict[str, Any]:
        if not self.state_path.is_file():
            raise TaskCtlError(f"state file is missing: {_path_string(STATE_RELATIVE)}")
        try:
            value = json.loads(self.state_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise TaskCtlError(f"cannot read state file: {exc}") from exc
        if not isinstance(value, dict):
            raise TaskCtlError("state file must contain a JSON object")
        return value

    def _save(self, state: dict[str, Any]) -> None:
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        temporary_name: str | None = None
        try:
            with tempfile.NamedTemporaryFile(
                mode="w",
                encoding="utf-8",
                dir=self.state_path.parent,
                prefix=f".{self.state_path.name}.",
                suffix=".tmp",
                delete=False,
            ) as temporary:
                temporary_name = temporary.name
                json.dump(state, temporary, indent=2, sort_keys=False)
                temporary.write("\n")
                temporary.flush()
                os.fsync(temporary.fileno())
            os.replace(temporary_name, self.state_path)
            temporary_name = None
        finally:
            if temporary_name:
                try:
                    os.unlink(temporary_name)
                except FileNotFoundError:
                    pass

    def _tasks(self, state: dict[str, Any]) -> list[dict[str, Any]]:
        tasks = state.get("tasks")
        if not isinstance(tasks, list):
            raise TaskCtlError("state field 'tasks' must be a list")
        return tasks

    def _task_map(self, state: dict[str, Any]) -> dict[str, dict[str, Any]]:
        tasks = self._tasks(state)
        result: dict[str, dict[str, Any]] = {}
        for task in tasks:
            if isinstance(task, dict) and isinstance(task.get("id"), str):
                result.setdefault(task["id"], task)
        return result

    def _get_task(self, state: dict[str, Any], task_id: str) -> dict[str, Any]:
        matches = [task for task in self._tasks(state) if isinstance(task, dict) and task.get("id") == task_id]
        if not matches:
            raise TaskCtlError(f"unknown task: {task_id}")
        if len(matches) != 1:
            raise TaskCtlError(f"task ID is not unique: {task_id}")
        return matches[0]

    def _card_for(self, task: dict[str, Any]) -> dict[str, Any]:
        task_id = task.get("id")
        if not isinstance(task_id, str):
            raise TaskCtlError("task record has no string id")
        return _parse_card(self.root, task_id, task.get("card"))

    def _status_paths(self) -> list[str]:
        output = self._git("status", "--porcelain=v1", "--untracked-files=all").stdout
        paths: list[str] = []
        for line in output.splitlines():
            if not line:
                continue
            path = line[3:] if len(line) >= 3 else line
            if " -> " in path:
                path = path.rsplit(" -> ", 1)[1]
            paths.append(path.replace("\\", "/"))
        return paths

    def _staged_paths(self) -> list[str]:
        output = self._git("diff", "--cached", "--name-only").stdout
        return [line.replace("\\", "/") for line in output.splitlines() if line]

    def _current_branch(self) -> str:
        result = self._git("branch", "--show-current")
        return result.stdout.strip()

    def _head(self) -> str:
        return self._git("rev-parse", "HEAD").stdout.strip()

    def _head_subject(self) -> str:
        return self._git("log", "-1", "--format=%s").stdout.strip()

    def validate(self, state: dict[str, Any] | None = None) -> list[str]:
        state = state if state is not None else self._load()
        issues: list[str] = []
        tasks_value = state.get("tasks")
        if not isinstance(tasks_value, list):
            return ["state field 'tasks' must be a list"]
        seen: set[str] = set()
        parsed: dict[str, dict[str, Any]] = {}
        cards: dict[str, dict[str, Any]] = {}
        for index, task in enumerate(tasks_value):
            if not isinstance(task, dict):
                issues.append(f"task entry {index} is not an object")
                continue
            task_id = task.get("id")
            if not isinstance(task_id, str) or not TASK_ID_PATTERN.fullmatch(task_id):
                issues.append(f"task entry {index} has invalid id")
                continue
            if task_id in seen:
                issues.append(f"duplicate task ID: {task_id}")
            seen.add(task_id)
            parsed[task_id] = task
            status = task.get("status")
            if status not in KNOWN_STATUSES:
                issues.append(f"{task_id}: unknown status {status!r}")
            card_value = task.get("card")
            if not isinstance(card_value, str):
                issues.append(f"{task_id}: card path is missing")
                continue
            try:
                card = _parse_card(self.root, task_id, card_value)
                cards[task_id] = card
            except TaskCtlError as exc:
                issues.append(f"{task_id}: {exc}")
                continue
            if card["id"] != task_id:
                issues.append(f"{task_id}: card heading ID is {card['id']!r}")
            dependencies = task.get("dependencies")
            if not isinstance(dependencies, list) or any(not isinstance(dep, str) for dep in dependencies):
                issues.append(f"{task_id}: dependencies must be a list of task IDs")
            elif dependencies != card["dependencies"]:
                issues.append(f"{task_id}: dependencies do not match task card")
            if task.get("result") != card["result"]:
                issues.append(f"{task_id}: result path does not match task card contract")
            allowed = task.get("allowed_paths")
            if not isinstance(allowed, list) or any(not isinstance(path, str) for path in allowed):
                issues.append(f"{task_id}: allowed_paths must be a list of paths")
            elif allowed != card["allowed_paths"]:
                issues.append(f"{task_id}: allowed_paths do not match task card")
            state_branch = task.get("branch", state.get("branch"))
            if not isinstance(state_branch, str):
                issues.append(f"{task_id}: branch contract is missing")
            elif card["branch"] and card["branch"] != "none yet" and not _branch_matches(state_branch, card["branch"]):
                issues.append(f"{task_id}: branch contract does not match task card")

        if not isinstance(state.get("schema_version"), int):
            issues.append("schema_version must be an integer")
        for task_id, task in parsed.items():
            dependencies = task.get("dependencies", [])
            if isinstance(dependencies, list):
                for dependency in dependencies:
                    if dependency not in parsed:
                        issues.append(f"{task_id}: unknown dependency {dependency}")

        visiting: set[str] = set()
        visited: set[str] = set()

        def visit(task_id: str) -> None:
            if task_id in visiting:
                issues.append(f"dependency cycle includes {task_id}")
                return
            if task_id in visited or task_id not in parsed:
                return
            visiting.add(task_id)
            dependencies = parsed[task_id].get("dependencies", [])
            if isinstance(dependencies, list):
                for dependency in dependencies:
                    if isinstance(dependency, str):
                        visit(dependency)
            visiting.remove(task_id)
            visited.add(task_id)

        for task_id in parsed:
            visit(task_id)

        for task_id, task in parsed.items():
            status = task.get("status")
            dependencies = task.get("dependencies", [])
            if status == "done" and isinstance(dependencies, list):
                for dependency in dependencies:
                    dependency_task = parsed.get(dependency)
                    if dependency_task and dependency_task.get("status") != "done":
                        issues.append(f"{task_id}: done task has unfinished dependency {dependency}")
        return sorted(set(issues))

    def require_valid(self, state: dict[str, Any] | None = None) -> dict[str, Any]:
        state = state if state is not None else self._load()
        issues = self.validate(state)
        if issues:
            raise TaskCtlError("invalid task state:\n" + "\n".join(f"- {issue}" for issue in issues))
        return state

    def ready(self, task: dict[str, Any], task_map: dict[str, dict[str, Any]]) -> bool:
        if task.get("status") != "pending":
            return False
        return all(task_map.get(dep, {}).get("status") == "done" for dep in task.get("dependencies", []))

    def start(self, task_id: str) -> None:
        state = self.require_valid()
        task = self._get_task(state, task_id)
        card = self._card_for(task)
        actual_branch = self._current_branch()
        expected_branch = task.get("branch", state.get("branch", card["branch"]))
        if isinstance(expected_branch, str) and not _branch_matches(actual_branch, expected_branch):
            raise TaskCtlError(f"wrong branch: expected {expected_branch}, got {actual_branch}")
        task_map = self._task_map(state)
        if task.get("status") != "pending":
            raise TaskCtlError(f"cannot start {task_id} from status {task.get('status')!r}")
        unmet = [dep for dep in task.get("dependencies", []) if task_map.get(dep, {}).get("status") != "done"]
        if unmet:
            raise TaskCtlError(f"unmet dependencies for {task_id}: {', '.join(unmet)}")
        dirty = self._status_paths()
        if any(not _is_within(path, card["allowed_paths"]) for path in dirty):
            outside = [path for path in dirty if not _is_within(path, card["allowed_paths"])]
            raise TaskCtlError("dirty out-of-scope paths: " + ", ".join(outside))
        task["status"] = "running"
        task["started_at"] = _utc_now()
        task["base_head"] = self._head()
        self._save(state)
        print(f"START PASS: {task_id} running at {task['base_head']}")

    def finish(self, task_id: str, commit: str) -> None:
        if commit != COMMIT_SELF and not SHA_PATTERN.fullmatch(commit):
            raise TaskCtlError("commit must be a full 40-character SHA or SELF")
        state = self.require_valid()
        task = self._get_task(state, task_id)
        card = self._card_for(task)
        if task.get("status") != "running":
            raise TaskCtlError(f"cannot finish {task_id} from status {task.get('status')!r}")
        actual_branch = self._current_branch()
        expected_branch = task.get("branch", state.get("branch", card["branch"]))
        if isinstance(expected_branch, str) and not _branch_matches(actual_branch, expected_branch):
            raise TaskCtlError(f"wrong branch: expected {expected_branch}, got {actual_branch}")
        task_map = self._task_map(state)
        unmet = [dep for dep in task.get("dependencies", []) if task_map.get(dep, {}).get("status") != "done"]
        if unmet:
            raise TaskCtlError(f"unmet dependencies for {task_id}: {', '.join(unmet)}")
        result_rel = task.get("result")
        if not isinstance(result_rel, str):
            raise TaskCtlError(f"{task_id} has no result path")
        result_path = self.root / Path(result_rel)
        if not result_path.is_file():
            raise TaskCtlError(f"result file is missing: {result_rel}")
        if commit == COMMIT_SELF:
            result_text = result_path.read_text(encoding="utf-8")
            if "Result commit: SELF" not in result_text:
                raise TaskCtlError("SELF finish requires 'Result commit: SELF' in the result")
        staged = self._staged_paths()
        if not staged:
            raise TaskCtlError("finish requires staged task-owned changes")
        outside = [path for path in staged if not _is_within(path, card["allowed_paths"])]
        if outside:
            raise TaskCtlError("staged out-of-scope paths: " + ", ".join(outside))
        task["status"] = "done"
        task["commit"] = commit
        task["finished_at"] = _utc_now()
        self._save(state)
        print(f"FINISH PASS: {task_id} done with {commit}")

    def block(self, task_id: str, report: str) -> None:
        state = self.require_valid()
        task = self._get_task(state, task_id)
        if task.get("status") not in {"pending", "running"}:
            raise TaskCtlError(f"cannot block {task_id} from status {task.get('status')!r}")
        report_rel = _safe_relative_path(self.root, report)
        report_path = self.root / Path(report_rel)
        if not report_path.is_file():
            raise TaskCtlError(f"blocker report is missing: {report_rel}")
        task["status"] = "blocked"
        task["blocker_report"] = report_rel
        task["blocked_at"] = _utc_now()
        self._save(state)
        print(f"BLOCK PASS: {task_id} blocked; report {report_rel}")

    def verify_head(self, task_id: str) -> None:
        state = self.require_valid()
        task = self._get_task(state, task_id)
        if task.get("status") != "done":
            raise TaskCtlError(f"{task_id} is not done")
        result_rel = task.get("result")
        if not isinstance(result_rel, str) or not (self.root / Path(result_rel)).is_file():
            raise TaskCtlError(f"result file is missing: {result_rel}")
        subject = self._head_subject()
        if not subject.startswith(task_id):
            raise TaskCtlError(f"HEAD subject does not begin with {task_id}: {subject!r}")
        token = task.get("commit")
        if not isinstance(token, str) or (token != COMMIT_SELF and not SHA_PATTERN.fullmatch(token)):
            raise TaskCtlError(f"{task_id} has no valid recorded commit identity")
        head = self._head()
        resolved = head if token == COMMIT_SELF else token
        print(f"VERIFY-HEAD PASS: {task_id} HEAD={head} recorded={token} resolved={resolved}")

    def print_status(self) -> None:
        state = self.require_valid()
        task_map = self._task_map(state)
        print("ID             STATUS   READY  DEPENDENCIES")
        print("-------------  -------  -----  ------------")
        for task in self._tasks(state):
            task_id = task["id"]
            dependencies = ",".join(task.get("dependencies", [])) or "-"
            readiness = "yes" if self.ready(task, task_map) else "no"
            print(f"{task_id:<13}  {task.get('status', ''):<7}  {readiness:<5}  {dependencies}")

    def print_show(self, task_id: str) -> None:
        state = self.require_valid()
        task = self._get_task(state, task_id)
        card = self._card_for(task)
        task_map = self._task_map(state)
        print(f"id: {task_id}")
        print(f"status: {task.get('status')}")
        print(f"ready: {'yes' if self.ready(task, task_map) else 'no'}")
        print(f"dependencies: {', '.join(task.get('dependencies', [])) or '-'}")
        print(f"card: {task.get('card')}")
        print(f"branch: {task.get('branch', state.get('branch', card['branch']))}")
        print(f"allowed paths: {', '.join(task.get('allowed_paths', [])) or '-'}")
        print(f"result: {task.get('result')}")
        print("legal transitions: pending -> start; running -> finish|block; blocked -> external resolution")


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Local SFHS Doom task-state helper")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("status")
    show = subparsers.add_parser("show")
    show.add_argument("task_id")
    start = subparsers.add_parser("start")
    start.add_argument("task_id")
    finish = subparsers.add_parser("finish")
    finish.add_argument("task_id")
    finish.add_argument("--commit", required=True)
    block = subparsers.add_parser("block")
    block.add_argument("task_id")
    block.add_argument("--report", required=True)
    subparsers.add_parser("validate")
    verify = subparsers.add_parser("verify-head")
    verify.add_argument("task_id")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    taskctl = TaskCtl(ROOT)
    try:
        if args.command == "status":
            taskctl.print_status()
        elif args.command == "show":
            taskctl.print_show(args.task_id)
        elif args.command == "start":
            taskctl.start(args.task_id)
        elif args.command == "finish":
            taskctl.finish(args.task_id, args.commit)
        elif args.command == "block":
            taskctl.block(args.task_id, args.report)
        elif args.command == "validate":
            taskctl.require_valid()
            print("VALIDATE PASS: task state and task cards are coherent")
        elif args.command == "verify-head":
            taskctl.verify_head(args.task_id)
        return 0
    except (TaskCtlError, OSError, UnicodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
