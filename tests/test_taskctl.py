import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest


TASKCTL_PATH = Path(__file__).resolve().parents[1] / "tools" / "taskctl.py"
SPEC = importlib.util.spec_from_file_location("taskctl_under_test", TASKCTL_PATH)
assert SPEC is not None and SPEC.loader is not None
taskctl = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(taskctl)


class TaskCtlTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="taskctl-test-")
        self.root = Path(self.temp.name)
        self.ctl = taskctl.TaskCtl(self.root)
        self.ctl._git("init", "-q")
        self.ctl._git("checkout", "-q", "-b", "phase/p00-governance")
        self.ctl._git("config", "user.name", "taskctl test")
        self.ctl._git("config", "user.email", "taskctl-test@example.invalid")

    def tearDown(self):
        self.temp.cleanup()

    def phase(self, task_id):
        number = int(task_id.split("-")[1][1:])
        return f"P{number:02d}"

    def card(self, task_id, dependencies=None, branch="phase/p00-governance", allowed=None):
        dependencies = dependencies or []
        phase = self.phase(task_id)
        allowed = allowed or [".agent/task-state.json", "work.txt", f"docs/results/{phase}/{task_id}.md"]
        self.root.joinpath("docs/tasks", phase).mkdir(parents=True, exist_ok=True)
        dependency_text = ", ".join(dependencies) or "None"
        allowed_text = "; ".join(f"`{path}`" for path in allowed)
        self.root.joinpath("docs/tasks", phase, f"{task_id}.md").write_text(
            "\n".join(
                [
                    f"# {task_id} test card",
                    "",
                    f"**Branch:** `{branch}`",
                    f"**Depends on:** {dependency_text}",
                    f"**Allowed files/directories:** {allowed_text}",
                    "",
                ]
            ),
            encoding="utf-8",
        )

    def state_for(self, records, extra=None, branch="phase/p00-governance"):
        state = {
            "schema_version": 1,
            "branch": branch,
            "tasks": records,
        }
        if extra:
            state.update(extra)
        self.ctl._save(state)
        return state

    def record(self, task_id, status="pending", dependencies=None, branch="phase/p00-governance", allowed=None):
        dependencies = dependencies or []
        phase = self.phase(task_id)
        allowed = allowed or [".agent/task-state.json", "work.txt", f"docs/results/{phase}/{task_id}.md"]
        self.card(task_id, dependencies, branch, allowed)
        return {
            "id": task_id,
            "status": status,
            "card": f"docs/tasks/{phase}/{task_id}.md",
            "branch": branch,
            "dependencies": dependencies,
            "allowed_paths": allowed,
            "result": f"docs/results/{phase}/{task_id}.md",
            "commit": None,
        }

    def baseline(self, records):
        self.root.joinpath("README.md").write_text("temporary repository\n", encoding="utf-8")
        self.state_for(records)
        self.ctl._git("add", "-A")
        self.ctl._git("commit", "-qm", "temporary baseline")

    def stage(self, *paths):
        self.ctl._git("add", "--", *paths)

    def test_validate_ready_and_preserves_unknown_fields(self):
        first = self.record("DOOM-P0-001")
        second = self.record("DOOM-P0-002", dependencies=["DOOM-P0-001"])
        first["status"] = "done"
        first["commit"] = "EXTERNAL"
        second["mystery"] = {"keep": True}
        self.baseline([first, second])
        state = self.ctl.require_valid()
        self.assertTrue(self.ctl.ready(state["tasks"][1], self.ctl._task_map(state)))
        state["preserve_me"] = "yes"
        self.ctl._save(state)
        self.ctl.start("DOOM-P0-002")
        saved = json.loads(self.ctl.state_path.read_text(encoding="utf-8"))
        self.assertEqual(saved["preserve_me"], "yes")
        self.assertEqual(saved["tasks"][1]["mystery"], {"keep": True})

    def test_p01_task_validates_and_uses_matching_result_directory(self):
        record = self.record("DOOM-P1-010", branch="phase/p01-native-oracle")
        self.baseline([record])
        state = self.ctl.require_valid()
        card = self.ctl._card_for(state["tasks"][0])
        self.assertEqual(card["card"], "docs/tasks/P01/DOOM-P1-010.md")
        self.assertEqual(card["result"], "docs/results/P01/DOOM-P1-010.md")

    def test_mixed_p00_and_p01_state_validates(self):
        first = self.record("DOOM-P0-070", status="done")
        first["commit"] = "EXTERNAL"
        second = self.record(
            "DOOM-P1-000",
            dependencies=["DOOM-P0-070"],
            branch="phase/p01-native-oracle",
        )
        self.baseline([first, second])
        state = self.ctl.require_valid()
        self.assertTrue(self.ctl.ready(state["tasks"][1], self.ctl._task_map(state)))

    def test_duplicate_task_card_identity_is_rejected(self):
        record = self.record("DOOM-P0-001")
        duplicate = self.root / "docs/tasks/P01/duplicate.md"
        duplicate.parent.mkdir(parents=True, exist_ok=True)
        duplicate.write_text(
            "# DOOM-P0-001 duplicate card\n\n"
            "**Branch:** phase/p00-governance\n"
            "**Depends on:** None\n"
            "**Allowed files/directories:** work.txt\n",
            encoding="utf-8",
        )
        self.baseline([record])
        with self.assertRaisesRegex(taskctl.TaskCtlError, "duplicate task-card identity"):
            self.ctl.require_valid()

    def test_missing_task_card_is_rejected(self):
        record = self.record("DOOM-P1-010", branch="phase/p01-native-oracle")
        self.root.joinpath(record["card"]).unlink()
        self.state_for([record], branch="phase/p01-native-oracle")
        with self.assertRaisesRegex(taskctl.TaskCtlError, "task card is missing"):
            self.ctl.require_valid()

    def test_start_refuses_unmet_dependency(self):
        first = self.record("DOOM-P0-001")
        second = self.record("DOOM-P0-002", dependencies=["DOOM-P0-001"])
        self.baseline([first, second])
        with self.assertRaises(taskctl.TaskCtlError):
            self.ctl.start("DOOM-P0-002")

    def test_start_refuses_wrong_branch(self):
        record = self.record("DOOM-P0-001", branch="phase/p99-other")
        self.baseline([record])
        with self.assertRaisesRegex(taskctl.TaskCtlError, "wrong branch"):
            self.ctl.start("DOOM-P0-001")

    def test_start_refuses_dirty_out_of_scope_path(self):
        record = self.record("DOOM-P0-001", allowed=["work.txt", "docs/results/P00/DOOM-P0-001.md"])
        self.baseline([record])
        self.root.joinpath("outside.txt").write_text("unrelated\n", encoding="utf-8")
        with self.assertRaisesRegex(taskctl.TaskCtlError, "dirty out-of-scope"):
            self.ctl.start("DOOM-P0-001")

    def test_unknown_task_and_invalid_finish_state_fail(self):
        record = self.record("DOOM-P0-001")
        self.baseline([record])
        with self.assertRaisesRegex(taskctl.TaskCtlError, "unknown task"):
            self.ctl.print_show("DOOM-P0-999")
        self.root.joinpath("work.txt").write_text("change\n", encoding="utf-8")
        self.root.joinpath("docs/results/P00").mkdir(parents=True, exist_ok=True)
        self.root.joinpath("docs/results/P00/DOOM-P0-001.md").write_text("Result commit: SELF\n", encoding="utf-8")
        self.stage("work.txt", "docs/results/P00/DOOM-P0-001.md")
        with self.assertRaisesRegex(taskctl.TaskCtlError, "cannot finish"):
            self.ctl.finish("DOOM-P0-001", "SELF")

    def test_finish_requires_result(self):
        record = self.record("DOOM-P0-001", status="running")
        self.baseline([record])
        self.root.joinpath("work.txt").write_text("change\n", encoding="utf-8")
        self.stage("work.txt")
        with self.assertRaisesRegex(taskctl.TaskCtlError, "result file is missing"):
            self.ctl.finish("DOOM-P0-001", "SELF")

    def test_finish_rejects_invalid_token(self):
        record = self.record("DOOM-P0-001", status="running")
        self.baseline([record])
        self.root.joinpath("work.txt").write_text("change\n", encoding="utf-8")
        self.root.joinpath("docs/results/P00").mkdir(parents=True, exist_ok=True)
        self.root.joinpath("docs/results/P00/DOOM-P0-001.md").write_text("Result commit: SELF\n", encoding="utf-8")
        self.stage("work.txt", "docs/results/P00/DOOM-P0-001.md")
        with self.assertRaisesRegex(taskctl.TaskCtlError, "full 40-character SHA"):
            self.ctl.finish("DOOM-P0-001", "not-a-commit")

    def test_block_requires_report_and_preserves_blocked_state(self):
        record = self.record("DOOM-P0-001")
        self.baseline([record])
        with self.assertRaisesRegex(taskctl.TaskCtlError, "blocker report is missing"):
            self.ctl.block("DOOM-P0-001", "reports/missing.md")
        self.root.joinpath("reports").mkdir()
        self.root.joinpath("reports/blocker.md").write_text("external input required\n", encoding="utf-8")
        self.ctl.block("DOOM-P0-001", "reports/blocker.md")
        saved = json.loads(self.ctl.state_path.read_text(encoding="utf-8"))
        self.assertEqual(saved["tasks"][0]["status"], "blocked")
        self.assertFalse(self.ctl.ready(saved["tasks"][0], self.ctl._task_map(saved)))

    def test_cycle_is_rejected(self):
        first = self.record("DOOM-P0-001", dependencies=["DOOM-P0-002"])
        second = self.record("DOOM-P0-002", dependencies=["DOOM-P0-001"])
        self.baseline([first, second])
        with self.assertRaisesRegex(taskctl.TaskCtlError, "dependency cycle"):
            self.ctl.require_valid()

    def test_self_finish_and_verify_head(self):
        record = self.record("DOOM-P0-001")
        self.baseline([record])
        self.ctl.start("DOOM-P0-001")
        self.root.joinpath("work.txt").write_text("bounded change\n", encoding="utf-8")
        self.root.joinpath("docs/results/P00").mkdir(parents=True, exist_ok=True)
        self.root.joinpath("docs/results/P00/DOOM-P0-001.md").write_text("Result commit: SELF\n", encoding="utf-8")
        self.stage("work.txt", "docs/results/P00/DOOM-P0-001.md", ".agent/task-state.json")
        self.ctl.finish("DOOM-P0-001", "SELF")
        self.stage(".agent/task-state.json")
        self.ctl._git("commit", "-qm", "DOOM-P0-001 test task commit")
        self.ctl.verify_head("DOOM-P0-001")

    def test_p01_self_finish_and_verify_head(self):
        record = self.record("DOOM-P1-010", branch="phase/p01-native-oracle")
        self.baseline([record])
        self.ctl._git("checkout", "-q", "-b", "phase/p01-native-oracle")
        self.ctl.start("DOOM-P1-010")
        self.root.joinpath("work.txt").write_text("bounded P1 change\n", encoding="utf-8")
        result = self.root / "docs/results/P01/DOOM-P1-010.md"
        result.parent.mkdir(parents=True, exist_ok=True)
        result.write_text("Result commit: SELF\n", encoding="utf-8")
        self.stage("work.txt", "docs/results/P01/DOOM-P1-010.md", ".agent/task-state.json")
        self.ctl.finish("DOOM-P1-010", "SELF")
        self.stage(".agent/task-state.json")
        self.ctl._git("commit", "-qm", "DOOM-P1-010 test task commit")
        self.ctl.verify_head("DOOM-P1-010")


if __name__ == "__main__":
    unittest.main()
