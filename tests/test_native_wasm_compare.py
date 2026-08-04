"""Contract tests for exact P2 native/Wasm Oracle comparison."""

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
RUN_SET = ROOT / "evidence/task-runs/P02-DOOM-P2-085"
COMPARE = ROOT / "tools/compare-native-wasm.py"


def signature(path: Path) -> tuple[list[dict], list[str]]:
    states = [json.loads(line) for line in (path / "state.jsonl").read_text(encoding="utf-8").splitlines()]
    frames = [hashlib.sha256((path / name).read_bytes()).hexdigest() for name in ("frame-001.bin", "frame-035.bin", "frame-070.bin", "frame-140.bin")]
    return states, frames


class NativeWasmCompareTests(unittest.TestCase):
    def test_exact_cross_runtime_evidence_passes(self) -> None:
        summary = json.loads((RUN_SET / "comparison.json").read_text(encoding="utf-8"))
        self.assertEqual(summary["status"], "PASS")
        self.assertEqual(summary["normalization"], "none")
        self.assertEqual(summary["pwad_order_claim"], "excluded")
        native = signature(RUN_SET / "native/baseline/run-1")
        for browser, count in (("chromium", 5), ("firefox", 3)):
            for index in range(1, count + 1):
                self.assertEqual(signature(RUN_SET / f"wasm-{browser}/baseline/run-{index}"), native)

    def test_raw_frames_are_exactly_320_by_200(self) -> None:
        for path in RUN_SET.glob("**/frame-*.bin"):
            self.assertEqual(path.stat().st_size, 320 * 200, path)

    def test_tampered_browser_frame_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory(prefix="sfhs-p2-085-") as temporary:
            copy = Path(temporary) / "P02-DOOM-P2-085"
            shutil.copytree(RUN_SET, copy)
            frame = copy / "wasm-chromium/baseline/run-2/frame-035.bin"
            data = bytearray(frame.read_bytes())
            data[0] ^= 1
            frame.write_bytes(data)
            result = subprocess.run([sys.executable, str(COMPARE), str(copy)], cwd=ROOT, text=True, capture_output=True, check=False)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("NATIVE_WASM_COMPARE=FAIL", result.stdout)

    def test_runner_excludes_forbidden_claims_and_normalization(self) -> None:
        text = (COMPARE.read_text(encoding="utf-8") + (ROOT / "tools/run-wasm-oracle.mjs").read_text(encoding="utf-8")).lower()
        self.assertIn("normalization", text)
        self.assertIn("pwad_order_claim", text)
        self.assertNotIn("normalize", text.replace("normalization", ""))


if __name__ == "__main__":
    unittest.main()
