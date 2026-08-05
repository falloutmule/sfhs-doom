from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class SingleFileBuildTests(unittest.TestCase):
    def setUp(self):
        self.artifact = ROOT / 'dist/sfhs-doom-freedoom2.html'

    def test_artifact_validates(self):
        result = subprocess.run([sys.executable, str(ROOT / 'tools/validate-single-file.py'), str(self.artifact)], cwd=ROOT, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_no_sibling_runtime_files(self):
        suffixes = {'.js', '.wasm', '.data', '.wad', '.worker', '.mp3', '.ogg'}
        siblings = [path for path in self.artifact.parent.iterdir() if path.name != self.artifact.name and path.suffix.lower() in suffixes]
        self.assertEqual(siblings, [])

    def test_single_file_runtime_contract(self):
        text = self.artifact.read_text(encoding='utf-8')
        self.assertIn('P3-SINGLE_FILE-1', text)
        self.assertIn('SINGLE_FILE', text)
        self.assertIn('Module.callMain', text)
        self.assertNotIn('<script src=', text.lower())

    def test_missing_artifact_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run([sys.executable, str(ROOT / 'tools/validate-single-file.py'), str(Path(directory) / 'missing.html')], cwd=ROOT, text=True, capture_output=True)
            self.assertNotEqual(result.returncode, 0)

    def test_packaging_profile_does_not_use_preload_flag(self):
        text = (ROOT / 'tools/build-single-file.sh').read_text(encoding='utf-8')
        self.assertIn('-sSINGLE_FILE=1', text)
        self.assertIn('--embed-file', text)
        self.assertNotIn('--preload-file', text)


if __name__ == '__main__':
    unittest.main()
