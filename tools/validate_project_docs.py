#!/usr/bin/env python3
"""Validate the machine-readable Markdown contracts used by SFHS Doom."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "docs" / "templates"
PHASES_ROOT = Path("docs/phases")
TASKS_ROOT = Path("docs/tasks")
PHASE_DIRECTORY_RE = re.compile(r"P\d{2}")
TASK_ID_RE = re.compile(r"^##\s+(DOOM-P(\d+)-\d{3})\b", re.MULTILINE)


class ValidationFailure(Exception):
    """Raised when one or more document contract checks fail."""


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise ValidationFailure(f"{path}: file does not exist") from exc
    except UnicodeDecodeError as exc:
        raise ValidationFailure(f"{path}: is not valid UTF-8") from exc


def missing_markers(path: Path, text: str, markers: list[str]) -> list[str]:
    return [marker for marker in markers if marker.lower() not in text.lower()]


def require_file(path: Path, issues: list[str]) -> str:
    if not path.is_file():
        issues.append(f"{path}: missing file")
        return ""
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        issues.append(f"{path}: invalid UTF-8")
        return ""


def phase_directory_for_task(task_id: str) -> str:
    match = re.fullmatch(r"DOOM-P(\d+)-\d{3}", task_id)
    if match is None:
        raise ValidationFailure(f"invalid task ID: {task_id}")
    return f"P{int(match.group(1)):02d}"


def discover_phase_directories(root: Path, relative: Path, issues: list[str]) -> dict[str, Path]:
    base = root / relative
    if not base.is_dir():
        issues.append(f"{base}: missing directory")
        return {}
    discovered: dict[str, Path] = {}
    for child in sorted(base.iterdir()):
        if not child.is_dir():
            continue
        if not PHASE_DIRECTORY_RE.fullmatch(child.name):
            issues.append(f"{child}: malformed phase directory name")
            continue
        discovered[child.name] = child
    return discovered


def validate_plans_contract() -> list[str]:
    path = ROOT / ".agent" / "PLANS.md"
    issues: list[str] = []
    text = require_file(path, issues)
    markers = [
        "Sol plan ownership",
        "Self-contained phases",
        "Repeated assumptions and ADRs",
        "Exit evidence",
        "Update on reality change",
        "Planning-only means no implementation",
        "Checker no-repair",
    ]
    for marker in missing_markers(path, text, markers):
        issues.append(f"{path}: missing marker {marker!r}")
    return issues


TEMPLATE_MARKERS = {
    "PHASE_PLAN.md": [
        "## Goal",
        "## Task graph",
        "## Exact verification",
        "## Evidence and result locations",
        "## Current state",
        "## Blockers and stop conditions",
        "## Exit gate",
        "Allowed paths",
        "Remote authorization",
    ],
    "TASK.md": [
        "**Intelligence:**",
        "**Depends on:**",
        "**Allowed files/directories:**",
        "**Remote authorization:**",
        "### Exact verification",
        "### Acceptance",
        "### Evidence output",
        "### Stop/block conditions",
        "### Commit",
    ],
    "TASK_RESULT.md": [
        "# TASK RESULT",
        "**Base commit:**",
        "**Result commit:** SELF",
        "## What was done",
        "## What was verified",
        "## What failed",
        "## Changed files",
        "## Commands and exact results",
        "## Acceptance mapping",
        "## Evidence paths",
        "## Current exact state",
        "## Remaining blocker or next task",
    ],
    "PHASE_RESULT.md": [
        "# PHASE RESULT",
        "**Base commit:**",
        "**Candidate commit:** SELF",
        "## What was delivered",
        "## What was independently verified",
        "## Task results",
        "## Scope and delta verdict",
        "## Evidence quality and limitations",
        "## Current exact state",
        "## Blockers and next phase",
    ],
    "BLOCKER.md": [
        "# BLOCKER",
        "**Base commit:**",
        "## Exact blocker",
        "## Command and observed output",
        "## Changed or partial state",
        "## What was ruled out",
        "## Evidence paths",
        "## Decision required",
        "## Current exact state",
    ],
    "GATE_VERDICT.md": [
        "# GATE VERDICT",
        "**Verdict:**",
        "## What was inspected",
        "## What was independently verified",
        "## Findings",
        "## Scope and engine-delta verdict",
        "## Evidence quality verdict",
        "## Minimal-handoff test",
        "## Required repairs or blocker",
        "## Exact current state",
        "## Next action",
    ],
}


def validate_templates() -> list[str]:
    issues = validate_plans_contract()
    for name, markers in TEMPLATE_MARKERS.items():
        path = TEMPLATES / name
        text = require_file(path, issues)
        for marker in missing_markers(path, text, markers):
            issues.append(f"{path}: missing marker {marker!r}")
    return issues


def validate_phase(path: Path) -> list[str]:
    issues: list[str] = []
    text = require_file(path, issues)
    phase_name = path.parent.name
    if not PHASE_DIRECTORY_RE.fullmatch(phase_name):
        issues.append(f"{path.parent}: malformed phase directory name")
        return issues
    phase_number = int(phase_name[1:])
    if phase_number == 0:
        markers = [
            "Task graph",
            "Task cards",
            "Required result format",
            "Exit gate",
            "DOOM-P0-001",
            "DOOM-P0-090",
            "Remote operations:",
            "05bba8c84cb3618882e334c406ddce67f3356154ebc41bb37f38d33de9c6fa6c",
        ]
    else:
        markers = [
            "## Goal",
            "## Task graph",
            "## Exact verification",
            "## Evidence and result locations",
            "## Current state",
            "## Blockers and stop conditions",
            "## Exit gate",
            f"DOOM-P{phase_number}-000",
            f"DOOM-P{phase_number}-090",
            "Remote boundary:",
        ]
    for marker in missing_markers(path, text, markers):
        issues.append(f"{path}: missing marker {marker!r}")
    return issues


def validate_task(path: Path) -> list[str]:
    issues: list[str] = []
    text = require_file(path, issues)
    if not text:
        return issues

    match = TASK_ID_RE.search(text)
    if match is None:
        issues.append(f"{path}: missing task heading with an ID")
        task_id = ""
    else:
        task_id = match.group(1)
        expected_phase = phase_directory_for_task(task_id)
        if PHASE_DIRECTORY_RE.fullmatch(path.parent.name) and path.parent.name != expected_phase:
            issues.append(f"{path}: task ID belongs in {expected_phase}, not {path.parent.name}")
        expected_name = f"{task_id}.md"
        if path.name != expected_name:
            issues.append(f"{path}: filename does not match task heading {task_id}")

    common_markers = [
        "**Intelligence:**",
        "**Phase:**",
        "**Depends on:**",
        "**Branch:**",
        "**Allowed files/directories:**",
        "**Parallel:**",
        "### Goal",
        "### Commit",
    ]
    for marker in missing_markers(path, text, common_markers):
        issues.append(f"{path}: missing marker {marker!r}")

    is_gate = bool(re.fullmatch(r"DOOM-P\d+-090", task_id))
    if is_gate:
        if "### Review duties" not in text:
            issues.append(f"{path}: missing marker '### Review duties'")
        if "### Gate acceptance" not in text:
            issues.append(f"{path}: missing marker '### Gate acceptance'")
    else:
        if "### Acceptance" not in text:
            issues.append(f"{path}: missing marker '### Acceptance'")
        if "### Evidence output" not in text:
            issues.append(f"{path}: missing marker '### Evidence output'")

    if is_gate:
        has_work = "### Review duties" in text
    else:
        has_work = "### Work" in text or "### Work completed" in text
    if not has_work:
        issues.append(f"{path}: missing work section")
    if "### Exact verification" not in text and "### Verification" not in text:
        issues.append(f"{path}: missing verification section")

    # P0-001 is the planning-only exception and predates the repository task
    # contract. Later cards must state these operational boundaries explicitly.
    if task_id != "DOOM-P0-001" and not is_gate:
        for marker in (
            "**Remote authorization:**",
            "### Constraints",
            "### Stop/block conditions",
        ):
            if marker.lower() not in text.lower():
                issues.append(f"{path}: missing marker {marker!r}")
    return issues


def validate_phase_tree(root: Path = ROOT) -> list[str]:
    issues: list[str] = []
    phase_dirs = discover_phase_directories(root, PHASES_ROOT, issues)
    task_dirs = discover_phase_directories(root, TASKS_ROOT, issues)
    phase_names = sorted(set(phase_dirs) | set(task_dirs))
    seen_tasks: dict[str, Path] = {}

    for phase_name in phase_names:
        phase_dir = phase_dirs.get(phase_name)
        task_dir = task_dirs.get(phase_name)
        if phase_dir is None:
            issues.append(f"{root / PHASES_ROOT / phase_name}: missing matching phase directory")
        else:
            phase_plan = phase_dir / "PHASE_PLAN.md"
            issues.extend(validate_phase(phase_plan))
        if task_dir is None:
            issues.append(f"{root / TASKS_ROOT / phase_name}: missing matching task directory")
            continue
        task_paths = sorted(task_dir.glob("*.md"))
        if not task_paths:
            issues.append(f"{task_dir}: no task cards found")
        for path in task_paths:
            issues.extend(validate_task(path))
            try:
                text = path.read_text(encoding="utf-8")
            except (OSError, UnicodeDecodeError):
                continue
            match = TASK_ID_RE.search(text)
            if match is None:
                continue
            task_id = match.group(1)
            prior = seen_tasks.get(task_id)
            if prior is not None:
                issues.append(f"duplicate task ID {task_id}: {prior} and {path}")
            else:
                seen_tasks[task_id] = path
    return sorted(set(issues))


def validate_all() -> list[str]:
    issues = validate_templates()
    issues.extend(validate_phase_tree(ROOT))
    return issues


def report(issues: list[str]) -> int:
    if issues:
        for issue in issues:
            print(f"VALIDATION FAILED: {issue}", file=sys.stderr)
        return 1
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    selection = parser.add_mutually_exclusive_group(required=False)
    selection.add_argument("--templates", action="store_true", help="validate planning templates")
    selection.add_argument("--task", type=Path, help="validate one task card")
    selection.add_argument("--phase", type=Path, help="validate one phase plan")
    selection.add_argument("--all", action="store_true", help="validate templates and every discovered phase/card tree")
    args = parser.parse_args(argv)

    if args.templates:
        issues = validate_templates()
        if not issues:
            print("TEMPLATES PASS")
    elif args.task:
        issues = validate_task(args.task.resolve())
        if not issues:
            print(f"TASK PASS: {args.task}")
    elif args.phase:
        issues = validate_phase(args.phase.resolve())
        if not issues:
            print(f"PHASE PASS: {args.phase}")
    else:
        issues = validate_all()
        if not issues:
            print("PROJECT DOCUMENTS PASS")
    return report(issues)


if __name__ == "__main__":
    raise SystemExit(main())
