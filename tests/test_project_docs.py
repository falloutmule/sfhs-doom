import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "tools"
sys.path.insert(0, str(TOOLS))

import validate_project_docs  # noqa: E402


VALID_TASK = """\
## DOOM-P0-999 — Fixture task

**Intelligence:** LUNA-L
**Phase:** P00
**Status:** PENDING
**Depends on:** none
**Branch:** phase/p00-governance
**Allowed files/directories:** docs/fixture.md
**Parallel:** No
**Remote authorization:** NONE

### Goal

Create a fixture.

### Constraints

Do not change source.

### Work

1. Inspect the fixture.

### Exact verification

```text
python verify.py
```

### Acceptance

The fixture passes.

### Evidence output

- docs/fixture.md

### Stop/block conditions

Stop on unknown changes.

### Commit

One local commit only.
"""


def valid_phase_plan(number):
    return f"""\
# Phase P{number:02d}

**Remote boundary:** NONE

## Goal

Validate a future phase fixture.

## Task graph

- DOOM-P{number}-000
- DOOM-P{number}-090

## Exact verification

Run the validator.

## Evidence and result locations

Use fixture paths.

## Current state

UNTESTED.

## Blockers and stop conditions

Stop on invalid structure.

## Exit gate

All documents validate.
"""


class ProjectDocumentContractTests(unittest.TestCase):
    def run_cli(self, *args):
        return subprocess.run(
            [sys.executable, str(TOOLS / "validate_project_docs.py"), *args],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

    def test_templates_validate(self):
        self.assertEqual(validate_project_docs.validate_templates(), [])

    def test_real_phase_and_cards_validate(self):
        self.assertEqual(validate_project_docs.validate_phase(ROOT / "docs/phases/P00/PHASE_PLAN.md"), [])
        self.assertEqual(validate_project_docs.validate_phase(ROOT / "docs/phases/P01/PHASE_PLAN.md"), [])
        expected_counts = {"P00": 10, "P01": 11}
        for phase, expected in expected_counts.items():
            cards = sorted((ROOT / "docs/tasks" / phase).glob("DOOM-P*-*.md"))
            self.assertEqual(len(cards), expected)
            for card in cards:
                with self.subTest(card=card.name):
                    self.assertEqual(validate_project_docs.validate_task(card), [])
        self.assertEqual(validate_project_docs.validate_phase_tree(ROOT), [])

    def test_all_selector_passes(self):
        result = self.run_cli("--all")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("PROJECT DOCUMENTS PASS", result.stdout)

    def test_no_argument_validation_passes(self):
        result = self.run_cli()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("PROJECT DOCUMENTS PASS", result.stdout)

    def test_future_phase_directory_is_discovered(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            phase_dir = root / "docs/phases/P02"
            task_dir = root / "docs/tasks/P02"
            phase_dir.mkdir(parents=True)
            task_dir.mkdir(parents=True)
            (phase_dir / "PHASE_PLAN.md").write_text(valid_phase_plan(2), encoding="utf-8")
            card = VALID_TASK.replace("DOOM-P0-999", "DOOM-P2-000")
            card = card.replace("**Phase:** P00", "**Phase:** P02")
            card = card.replace("phase/p00-governance", "phase/p02-fixture")
            (task_dir / "DOOM-P2-000.md").write_text(card, encoding="utf-8")
            self.assertEqual(validate_project_docs.validate_phase_tree(root), [])

    def test_duplicate_task_ids_across_phases_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for number in (2, 3):
                phase_dir = root / f"docs/phases/P{number:02d}"
                task_dir = root / f"docs/tasks/P{number:02d}"
                phase_dir.mkdir(parents=True)
                task_dir.mkdir(parents=True)
                (phase_dir / "PHASE_PLAN.md").write_text(valid_phase_plan(number), encoding="utf-8")
                card = VALID_TASK.replace("DOOM-P0-999", "DOOM-P2-000")
                card = card.replace("**Phase:** P00", f"**Phase:** P{number:02d}")
                card = card.replace("phase/p00-governance", f"phase/p{number:02d}-fixture")
                (task_dir / f"duplicate-{number}.md").write_text(card, encoding="utf-8")
            issues = validate_project_docs.validate_phase_tree(root)
            self.assertTrue(any("duplicate task ID DOOM-P2-000" in issue for issue in issues))

    def test_malformed_phase_directory_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "docs/phases/P2").mkdir(parents=True)
            (root / "docs/tasks/P2").mkdir(parents=True)
            issues = validate_project_docs.validate_phase_tree(root)
            self.assertTrue(any("malformed phase directory name" in issue for issue in issues))

    def test_valid_fixture_passes(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "DOOM-P0-999.md"
            path.write_text(VALID_TASK, encoding="utf-8")
            self.assertEqual(validate_project_docs.validate_task(path), [])

    def test_invalid_fixture_is_rejected_with_missing_field(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "bad.md"
            path.write_text("# incomplete\n", encoding="utf-8")
            result = self.run_cli("--task", str(path))
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("missing task heading", result.stderr)

    def test_missing_required_task_field_is_reported(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "DOOM-P0-999.md"
            path.write_text(VALID_TASK.replace("### Acceptance\n", "### Approval\n"), encoding="utf-8")
            issues = validate_project_docs.validate_task(path)
            self.assertTrue(any("### Acceptance" in issue for issue in issues))

    def test_selector_commands_pass(self):
        for args in (
            ("--templates",),
            ("--phase", "docs/phases/P00/PHASE_PLAN.md"),
        ):
            with self.subTest(args=args):
                result = self.run_cli(*args)
                self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
