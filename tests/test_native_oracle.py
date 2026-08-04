"""Regression tests for deterministic test-only native Oracle evidence."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
RUN_SET = ROOT / "evidence/task-runs/P01-DOOM-P1-080/oracle-run-set"
BASE = "f888f68ea721e7b01fb54946a1bc723b3248b608"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def load_states(path: Path) -> list[dict]:
    return [json.loads(line) for line in (path / "state.jsonl").read_text(encoding="utf-8").splitlines()]


def signature(path: Path) -> tuple[list[dict], list[str]]:
    result = load_json(path / "result.json")
    return load_states(path), [item["sha256"] for item in result["frames"]]


class NativeOracleTests(unittest.TestCase):
    def test_five_fresh_process_repetitions_are_identical(self) -> None:
        paths = [RUN_SET / f"baseline/run-{index}" for index in range(1, 6)]
        expected = signature(paths[0])
        for path in paths:
            result = load_json(path / "result.json")
            self.assertEqual(result["status"], "PASS")
            self.assertEqual(result["end_tic"], 140)
            self.assertEqual(signature(path), expected)
            self.assertTrue((path / "build.json").is_file())

    def test_state_and_frame_contract_is_exact_and_path_free(self) -> None:
        path = RUN_SET / "baseline/run-1"
        states = load_states(path)
        self.assertEqual([item["tic"] for item in states], [0, 1, 35, 70, 140])
        self.assertEqual(states[0]["checkpoint"], "initial")
        self.assertTrue(states[-1]["final"])
        forbidden_fields = {"address", "timestamp", "path", "process_id", "pid", "wall_clock", "realtics"}
        for state in states:
            self.assertTrue(forbidden_fields.isdisjoint(state))
            self.assertTrue(all(not isinstance(value, float) for value in state.values()))
        result = load_json(path / "result.json")
        self.assertEqual([frame["tic"] for frame in result["frames"]], [1, 35, 70, 140])
        for frame in result["frames"]:
            artifact = path / f"frame-{frame['tic']:03d}.bin"
            self.assertEqual(artifact.stat().st_size, 320 * 200)
            self.assertEqual(hashlib.sha256(artifact.read_bytes()).hexdigest(), frame["sha256"])

    def test_pwad_order_and_dehacked_effect_are_explicit(self) -> None:
        baseline_states, baseline_frames = signature(RUN_SET / "baseline/run-1")
        self.assertEqual(signature(RUN_SET / "order-ab"), (baseline_states, baseline_frames))
        self.assertEqual(signature(RUN_SET / "order-ba"), (baseline_states, baseline_frames))
        effect_states, effect_frames = signature(RUN_SET / "deh-effect")
        self.assertEqual([item["maxammo0"] for item in baseline_states], [200] * 5)
        self.assertEqual([item["maxammo0"] for item in effect_states], [199] * 5)
        self.assertNotEqual(effect_frames, baseline_frames)
        for baseline, effect in zip(baseline_states, effect_states, strict=True):
            self.assertEqual(
                {key: value for key, value in baseline.items() if key != "maxammo0"},
                {key: value for key, value in effect.items() if key != "maxammo0"},
            )

    def test_instrumentation_off_build_is_inert_and_demo_complete(self) -> None:
        result = load_json(RUN_SET / "instrumentation-off/result.json")
        self.assertEqual(result["status"], "PASS")
        self.assertEqual(result["end_tic"], 140)
        self.assertEqual(result["oracle_artifacts"], [])
        off_binary = ROOT / "build/native/oracle-off/src/chocolate-doom"
        debug_binary = ROOT / "build/native/debug/src/chocolate-doom"
        release_binary = ROOT / "build/native/release/src/chocolate-doom"
        for binary in (off_binary, debug_binary, release_binary):
            self.assertTrue(binary.is_file(), binary)
            self.assertNotIn(b"SFHS_ORACLE_OUTPUT", binary.read_bytes())

    def test_compile_gate_and_source_edit_budgets(self) -> None:
        cmake = (ROOT / "src/CMakeLists.txt").read_text(encoding="utf-8")
        self.assertIn('option(SFHS_ORACLE_TEST "Enable test-only deterministic native oracle" OFF)', cmake)
        self.assertIn("if(SFHS_ORACLE_TEST)", cmake)
        changed = subprocess.check_output(
            ["git", "diff", "--name-only", BASE, "--"],
            cwd=ROOT,
            text=True,
            stderr=subprocess.DEVNULL,
        ).splitlines()
        existing_c = {
            path for path in changed if path.endswith(".c") and not path.startswith("src/sfhs_oracle/")
        }
        existing_cmake = {
            path for path in changed if path == "CMakeLists.txt" or path.endswith("/CMakeLists.txt") or path.startswith("cmake/")
        }
        self.assertEqual(existing_c, {"src/doom/d_main.c", "src/doom/g_game.c"})
        self.assertEqual(existing_cmake, {"src/CMakeLists.txt"})
        for source in (ROOT / "src/doom/d_main.c", ROOT / "src/doom/g_game.c"):
            text = source.read_text(encoding="utf-8")
            self.assertIn("#ifdef SFHS_ORACLE_TEST", text)

    def test_comparison_rejects_tampered_state(self) -> None:
        with tempfile.TemporaryDirectory(prefix="sfhs-oracle-tamper-") as temporary:
            copy = Path(temporary) / "run-set"
            shutil.copytree(RUN_SET, copy)
            state = copy / "baseline/run-2/state.jsonl"
            state.write_text(state.read_text(encoding="utf-8").replace('"health":100', '"health":99', 1), encoding="utf-8")
            result = subprocess.run(
                [sys.executable, str(ROOT / "tools/oracle/compare-runs.py"), str(copy)],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("NATIVE_ORACLE_COMPARE=FAIL", result.stdout)

    def test_scripts_use_only_local_open_inputs(self) -> None:
        paths = [
            ROOT / "tools/run-native-oracle.sh",
            ROOT / "tools/oracle/make-inputs.py",
            ROOT / "tools/oracle/collect-run.py",
            ROOT / "tools/oracle/compare-runs.py",
        ]
        text = "\n".join(path.read_text(encoding="utf-8").lower() for path in paths)
        self.assertIn("vendor-cache/freedoom/0.13.0/data/freedoom1.wad", text)
        for forbidden in ("curl ", "wget ", "git fetch", "git push", "http://", "https://"):
            self.assertNotIn(forbidden, text)
        tokens = {token.strip("'\"()[]{};,:") for token in text.split()}
        self.assertTrue({"doom.wad", "doom2.wad", "tnt.wad", "plutonia.wad"}.isdisjoint(tokens))


if __name__ == "__main__":
    unittest.main()
