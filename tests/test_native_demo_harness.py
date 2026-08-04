"""Regression tests for the native demo and timedemo evidence harness."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
TOOL = ROOT / "tools/demo-result.py"
EVIDENCE = ROOT / "evidence/task-runs/P01-DOOM-P1-070"
DEMO = ROOT / "tests/fixtures/open-demos/oracle.lmp"
DEMO_SHA256 = "45f9177a339e21c8a6459dcf3d1d678e1cc777ddf71d7065c9e8f15fb5c58adb"


class NativeDemoHarnessTests(unittest.TestCase):
    def load(self, relative: str) -> dict:
        return json.loads((EVIDENCE / relative).read_text(encoding="utf-8"))

    def test_native_recording_reproduces_manifest_bound_project_demo(self) -> None:
        normalized = EVIDENCE / "record/normalized-recording.lmp"
        self.assertEqual(DEMO.read_bytes(), normalized.read_bytes())
        self.assertEqual(len(DEMO.read_bytes()), 18)
        self.assertEqual(hashlib.sha256(DEMO.read_bytes()).hexdigest(), DEMO_SHA256)
        self.assertEqual(DEMO.read_bytes()[0], 109)
        self.assertEqual(DEMO.read_bytes()[-1], 0x80)
        result = self.load("record/result.json")
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["completion"], "recorded")
        self.assertEqual(result["exit_code"], 255)
        self.assertFalse(result["desync"])
        self.assertEqual(result["demo_sha256"], DEMO_SHA256)

    def test_normal_and_strict_matrix_has_all_required_repetitions(self) -> None:
        matrix = self.load("demo/matrix.json")
        self.assertEqual(matrix["status"], "PASS")
        self.assertEqual((matrix["result_count"], matrix["pass_count"]), (14, 14))
        self.assertTrue(all(item["status"] == "PASS" and not item["desync"] for item in matrix["results"]))
        project = {
            (item["variant"], item["mode"], int(item["run"]))
            for item in matrix["results"]
            if item["demo_source"] == "project"
        }
        expected = {
            (variant, mode, run)
            for variant in ("debug", "release")
            for mode in ("normal", "strict")
            for run in range(1, 4)
        }
        self.assertEqual(project, expected)
        self.assertTrue(
            all(
                item["demo_sha256"] == DEMO_SHA256
                for item in matrix["results"]
                if item["demo_source"] == "project"
            )
        )
        official = {
            (item["variant"], item["mode"], int(item["run"]))
            for item in matrix["results"]
            if item["demo_source"] == "official-freedoom-demo1"
        }
        self.assertEqual(official, {("release", "normal", 1), ("release", "strict", 1)})

    def test_timedemo_matrix_is_stable_and_debug_release_agree(self) -> None:
        matrix = self.load("timedemo/matrix.json")
        self.assertEqual(matrix["status"], "PASS")
        self.assertEqual((matrix["result_count"], matrix["pass_count"]), (7, 7))
        self.assertTrue(matrix["timedemo_end_tics_stable"])
        self.assertEqual(matrix["timedemo_end_tics_by_source"]["project"], [1] * 6)
        self.assertEqual(matrix["timedemo_end_tics_by_source"]["official-freedoom-demo1"], [7117])
        project = [item for item in matrix["results"] if item["demo_source"] == "project"]
        self.assertEqual({item["variant"] for item in project}, {"debug", "release"})
        self.assertEqual({item["end_tic"] for item in project}, {1})
        self.assertTrue(all(item["completion"] == "timed" and not item["desync"] for item in matrix["results"]))

    def test_normalizer_rejects_nonzero_input_and_result_rejects_desync(self) -> None:
        with tempfile.TemporaryDirectory(prefix="sfhs-demo-harness-") as temporary:
            root = Path(temporary)
            bad_demo = root / "bad.lmp"
            bad_demo.write_bytes(DEMO.read_bytes()[:13] + b"\x01\x00\x00\x00\x80")
            normalized = subprocess.run(
                [sys.executable, str(TOOL), "normalize-recording", "--input", str(bad_demo), "--output", str(root / "out.lmp"), "--tics", "1"],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )
            self.assertNotEqual(normalized.returncode, 0)
            self.assertIn("nonzero input", normalized.stderr)

            stdout = root / "stdout.txt"
            stderr = root / "stderr.txt"
            stdout.write_text("Playing demo demo.lmp\nGAME_EXIT=0\n", encoding="utf-8")
            stderr.write_text("demo desync\n", encoding="utf-8")
            result_path = root / "result.json"
            result = subprocess.run(
                [
                    sys.executable,
                    str(TOOL),
                    "create",
                    "--output",
                    str(result_path),
                    "--stdout",
                    str(stdout),
                    "--stderr",
                    str(stderr),
                    "--demo",
                    str(DEMO),
                    "--demo-source",
                    "project",
                    "--variant",
                    "debug",
                    "--mode",
                    "normal",
                    "--run",
                    "1",
                    "--exit-code",
                    "0",
                    "--expected-exit",
                    "0",
                    "--command",
                    "bounded test",
                    "--environment",
                    "isolated",
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(json.loads(result_path.read_text(encoding="utf-8"))["status"], "FAIL")

    def test_scripts_are_bounded_to_open_local_inputs(self) -> None:
        scripts = "\n".join(
            (ROOT / path).read_text(encoding="utf-8").lower()
            for path in (
                "tools/record-native-demo.sh",
                "tools/run-native-demo.sh",
                "tools/run-native-timedemo.sh",
            )
        )
        self.assertIn("vendor-cache/freedoom/0.13.0/data/freedoom1.wad", scripts)
        self.assertIn("tests/fixtures/open-demos/oracle.lmp", scripts)
        for forbidden in ("curl ", "wget ", "git fetch", "git push", "http://", "https://"):
            self.assertNotIn(forbidden, scripts)
        tokens = {token.strip("'\"()[]{};,:") for token in scripts.split()}
        self.assertTrue({"doom.wad", "doom2.wad", "tnt.wad", "plutonia.wad"}.isdisjoint(tokens))


if __name__ == "__main__":
    unittest.main()
