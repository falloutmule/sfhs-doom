from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
import sys
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
_spec = importlib.util.spec_from_file_location("verify_p2_gate", ROOT / "tools/verify-p2-gate.py")
assert _spec and _spec.loader
gate = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(gate)


class P2GateRegressionTests(unittest.TestCase):
    def test_missing_manifest_command_log_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest = root / "manifest.json"
            manifest.write_text('{"schema_version": 1}', encoding="utf-8")
            self.assertTrue(gate.manifest_issues(root, manifest))

    def test_failed_browser_boot_fails(self):
        self.assertTrue(gate.browser_issues({"pageErrors": ["boot"]}, "boot"))

    def test_failed_audio_fails(self):
        self.assertTrue(gate.audio_issues({"preClick": {"doomMainStarted": False, "audioContextExists": False, "callbackCount": 0}, "postClick": {"doomMainStarted": True, "audioContextState": "running"}, "probe": {"mainStarted": True, "callbacks": 0, "nonzeroPcmCallbacks": 0, "startClicks": 1}}, "audio"))

    def test_failed_native_wasm_comparison_fails(self):
        self.assertTrue(gate.compare_issues({"status": "FAIL", "normalization": "none", "pwad_order_claim": "excluded", "failures": []}))

    def test_state_or_frame_mismatch_fails(self):
        self.assertTrue(gate.compare_issues({"status": "PASS", "normalization": "none", "pwad_order_claim": "excluded", "failures": ["frame 35"]}))

    def test_external_requests_fail(self):
        self.assertTrue(gate.request_issues({"failedRequests": ["https://example.invalid"]}))

    def test_dirty_worktree_fails_after_commit(self):
        self.assertTrue(gate.worktree_issues([" M unrelated.txt"], "done"))

    def test_wrong_branch_or_ancestry_fails(self):
        issues = gate.identity_issues("phase/other", False, [])
        self.assertGreaterEqual(len(issues), 2)

    def test_p2_090_complete_fails(self):
        state = {"tasks": [{"id": "DOOM-P2-080", "status": "done"}, {"id": "DOOM-P2-085", "status": "done"}, {"id": "DOOM-P2-088", "status": "done"}, {"id": "DOOM-P2-090", "status": "done"}]}
        self.assertTrue(gate.task_state_issues(state, True))


if __name__ == "__main__":
    unittest.main()
