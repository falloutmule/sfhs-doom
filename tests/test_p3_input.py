from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
_spec = importlib.util.spec_from_file_location("verify_p3_input", ROOT / "tools/verify-p3-input.py")
assert _spec and _spec.loader
_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_module)
require_input = _module.require_input
verify_wad_hash = _module.verify_wad_hash


class P3InputTests(unittest.TestCase):
    def test_missing_input_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(ValueError):
                require_input(Path(directory), "phase2-debug")

    def test_wrong_wad_hash_fails(self):
        wad = ROOT / "build/wasm/p3-input/phase2-debug/data/freedoom2.wad"
        with self.assertRaises(ValueError):
            verify_wad_hash(wad, "0" * 64)

    def test_valid_inputs_pass(self):
        result = subprocess.run([sys.executable, str(ROOT / "tools/verify-p3-input.py")], cwd=ROOT, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("P3_INPUT=PASS", result.stdout)


if __name__ == "__main__":
    unittest.main()
