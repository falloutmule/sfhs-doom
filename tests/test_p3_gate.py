from __future__ import annotations
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('verify_p3_gate', ROOT / 'tools/verify-p3-gate.py')
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC); SPEC.loader.exec_module(MODULE)

class P3GateTests(unittest.TestCase):
    def test_archive_path_safety_rejects_missing_bundle(self):
        self.assertTrue(MODULE.archive_issues(ROOT / 'evidence/reports/P03/missing-review.zip'))

if __name__ == '__main__': unittest.main()
