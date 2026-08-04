#!/usr/bin/env python3
"""Verify the focused, limitation-aware P2 feasibility gate.

The complete cross-phase discovery suite is retained as diagnostic evidence;
this validator deliberately gates only the P2 acceptance evidence.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
P1_BASE = "0c8e1288a23e7306fa5760c1aadbf54de8d0b85c"
EXPECTED_BRANCH = "phase/p02-wasm-feasibility"
EXPECTED_REMOTE = "https://github.com/chocolate-doom/chocolate-doom.git"
MANIFESTS = [
    ROOT / "evidence/manifests/P02/phase1-debug.json",
    ROOT / "evidence/manifests/P02/phase2-debug.json",
    ROOT / "evidence/manifests/P02/phase2-oracle.json",
]
BOOT_RESULTS = [
    ROOT / "evidence/task-runs/P02-DOOM-P2-060/phase1-chromium.json",
    ROOT / "evidence/task-runs/P02-DOOM-P2-060/phase2-chromium.json",
    ROOT / "evidence/task-runs/P02-DOOM-P2-060/phase2-firefox.json",
]
INPUT_RESULTS = [
    ROOT / "evidence/task-runs/P02-DOOM-P2-070/menu-chromium.json",
    ROOT / "evidence/task-runs/P02-DOOM-P2-070/menu-firefox.json",
]
AUDIO_RESULTS = [
    ROOT / "evidence/task-runs/P02-DOOM-P2-080/chromium.json",
    ROOT / "evidence/task-runs/P02-DOOM-P2-080/firefox.json",
]


def read_json(path: Path) -> object:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"cannot read JSON evidence {path.relative_to(ROOT)}: {exc}") from exc


def browser_issues(data: object, label: str) -> list[str]:
    if not isinstance(data, dict):
        return [f"{label}: evidence is not an object"]
    issues: list[str] = []
    for key in ("pageErrors", "failedRequests", "errors"):
        values = data.get(key, [])
        if values:
            issues.append(f"{label}: {key} is non-empty")
    screenshot = data.get("screenshotState")
    if screenshot is not None and (not isinstance(screenshot, dict) or int(screenshot.get("bytes", 0)) <= 0):
        issues.append(f"{label}: boot screenshot is missing or empty")
    return issues


def audio_issues(data: object, label: str) -> list[str]:
    if not isinstance(data, dict):
        return [f"{label}: evidence is not an object"]
    issues = browser_issues(data, label)
    pre = data.get("preClick", {})
    post = data.get("postClick", {})
    probe = data.get("probe", {})
    if pre.get("doomMainStarted") is not False or pre.get("audioContextExists") is not False or pre.get("callbackCount") != 0:
        issues.append(f"{label}: pre-click invariant failed")
    if post.get("doomMainStarted") is not True or post.get("audioContextState") != "running":
        issues.append(f"{label}: trusted start did not produce running engine audio")
    if probe.get("mainStarted") is not True or int(probe.get("callbacks", 0)) <= 0 or int(probe.get("nonzeroPcmCallbacks", 0)) <= 0:
        issues.append(f"{label}: engine-produced audio evidence failed")
    if probe.get("startClicks") != 1:
        issues.append(f"{label}: start invocation count is not exactly one")
    return issues


def compare_issues(data: object) -> list[str]:
    if not isinstance(data, dict):
        return ["P2-085 comparison: evidence is not an object"]
    issues: list[str] = []
    if data.get("status") != "PASS":
        issues.append("P2-085 comparison: native/Wasm comparison did not pass")
    if data.get("normalization") != "none":
        issues.append("P2-085 comparison: normalization was used")
    if data.get("pwad_order_claim") != "excluded":
        issues.append("P2-085 comparison: PWAD-order claim was not excluded")
    if data.get("failures"):
        issues.append("P2-085 comparison: state or framebuffer mismatch")
    return issues


def request_issues(data: object, label: str = "browser") -> list[str]:
    if not isinstance(data, dict):
        return [f"{label}: evidence is not an object"]
    return [f"{label}: external or failed request recorded"] if data.get("failedRequests") else []


def manifest_issues(root: Path, manifest_path: Path) -> list[str]:
    try:
        sys.path.insert(0, str(root / "tools"))
        from validate_artifact_manifest import ManifestValidator, ManifestValidationError

        ManifestValidator(root).validate_file(manifest_path)
    except (OSError, ValueError, ManifestValidationError) as exc:
        return [f"manifest {manifest_path.name}: {exc}"]
    return []


def worktree_issues(lines: list[str], task_status: str) -> list[str]:
    if not lines:
        return []
    if task_status in {"running", "blocked"}:
        allowed_prefixes = (
            ".agent/task-state.json",
            "docs/",
            "docs/tasks/P02/DOOM-P2-088.md",
            "evidence/manifests/P02/",
            "evidence/phase-gates/P02/",
            "evidence/reports/P02/",
            "evidence/task-runs/P02-DOOM-P2-088/",
            "tests/test_p2_gate.py",
            "tools/verify-p2-gate.py",
        )
        unexpected = []
        for line in lines:
            path = line[2:].strip() if len(line) >= 3 else line.strip()
            if path not in allowed_prefixes and not path.startswith(allowed_prefixes[1:]):
                unexpected.append(line)
        return [f"unrelated working-tree change: {line}" for line in unexpected]
    return ["worktree is dirty after the P2 gate commit"]


def identity_issues(branch: str, ancestry: bool, remotes: list[str]) -> list[str]:
    issues: list[str] = []
    if branch != EXPECTED_BRANCH:
        issues.append(f"wrong branch: {branch}")
    if not ancestry:
        issues.append("P1 base is not an ancestor of HEAD")
    expected = [f"upstream\t{EXPECTED_REMOTE} (fetch)", f"upstream\t{EXPECTED_REMOTE} (push)"]
    if sorted(remotes) != sorted(expected) or any(line.startswith("origin\t") for line in remotes):
        issues.append("remote set is not official upstream only")
    return issues


def task_state_issues(state: object, require_done: bool) -> list[str]:
    if not isinstance(state, dict):
        return ["task state is not an object"]
    entries = {entry.get("id"): entry for entry in state.get("tasks", []) if isinstance(entry, dict)}
    issues: list[str] = []
    for task_id in ("DOOM-P2-080", "DOOM-P2-085"):
        if entries.get(task_id, {}).get("status") != "done":
            issues.append(f"{task_id} is not done")
    p2_088 = entries.get("DOOM-P2-088", {}).get("status")
    if require_done and p2_088 != "done":
        issues.append("DOOM-P2-088 is not done after commit")
    if not require_done and p2_088 not in {"running", "blocked", "done"}:
        issues.append("DOOM-P2-088 is not active")
    if entries.get("DOOM-P2-090", {}).get("status") != "pending":
        issues.append("DOOM-P2-090 is not pending")
    return issues


class GateValidator:
    def __init__(self, root: Path = ROOT) -> None:
        self.root = root
        self.issues: list[str] = []

    def git(self, *args: str) -> str:
        return subprocess.check_output(["git", *args], cwd=self.root, text=True, stderr=subprocess.STDOUT).strip()

    def run(self) -> list[str]:
        try:
            branch = self.git("branch", "--show-current")
            ancestry = subprocess.run(["git", "merge-base", "--is-ancestor", P1_BASE, "HEAD"], cwd=self.root).returncode == 0
            remotes = self.git("remote", "-v").splitlines()
            self.issues.extend(identity_issues(branch, ancestry, remotes))
        except (OSError, subprocess.CalledProcessError) as exc:
            self.issues.append(f"git identity check failed: {exc}")

        for manifest in MANIFESTS:
            self.issues.extend(manifest_issues(self.root, manifest))

        for path in BOOT_RESULTS:
            try:
                self.issues.extend(browser_issues(read_json(path), path.name))
            except ValueError as exc:
                self.issues.append(str(exc))
        for path in INPUT_RESULTS:
            try:
                self.issues.extend(browser_issues(read_json(path), path.name))
            except ValueError as exc:
                self.issues.append(str(exc))
        for path in AUDIO_RESULTS:
            try:
                self.issues.extend(audio_issues(read_json(path), path.name))
            except ValueError as exc:
                self.issues.append(str(exc))

        comparison = self.root / "evidence/task-runs/P02-DOOM-P2-085/comparison.json"
        try:
            self.issues.extend(compare_issues(read_json(comparison)))
        except ValueError as exc:
            self.issues.append(str(exc))

        global_suite = self.root / "evidence/task-runs/P02-DOOM-P2-088/full-unit-suite-exact.txt"
        if not global_suite.is_file():
            self.issues.append("global discovery output is missing (diagnostic evidence)")

        try:
            state = read_json(self.root / ".agent/task-state.json")
            status = next(item.get("status") for item in state["tasks"] if item.get("id") == "DOOM-P2-088")
            self.issues.extend(task_state_issues(state, status == "done"))
            self.issues.extend(worktree_issues(self.git("status", "--short").splitlines(), status))
        except (KeyError, StopIteration, ValueError, OSError, subprocess.CalledProcessError) as exc:
            self.issues.append(f"task/worktree check failed: {exc}")

        return self.issues


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify the focused P2 Wasm feasibility gate")
    parser.add_argument("--root", type=Path, default=ROOT)
    args = parser.parse_args()
    validator = GateValidator(args.root.resolve())
    issues = validator.run()
    if issues:
        for issue in issues:
            print(f"P2_GATE_FAIL: {issue}")
        print("SFHS_DOOM_P2_WASM_FEASIBILITY_GATE=FAIL")
        return 1
    print("GLOBAL_PYTHON_DISCOVERY=DIAGNOSTIC_NON_BLOCKING")
    print("SFHS_DOOM_P2_WASM_FEASIBILITY_GATE=PASS_WITH_RECORDED_LIMITATIONS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
