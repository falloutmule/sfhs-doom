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
        cards = sorted((ROOT / "docs/tasks/P00").glob("DOOM-P0-*.md"))
        self.assertEqual(len(cards), 10)
        for card in cards:
            with self.subTest(card=card.name):
                self.assertEqual(validate_project_docs.validate_task(card), [])

    def test_all_selector_passes(self):
        result = self.run_cli("--all")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("PROJECT DOCUMENTS PASS", result.stdout)

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
