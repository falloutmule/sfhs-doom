from __future__ import annotations

import hashlib
import json
from pathlib import Path
import unittest
import zipfile


ROOT = Path(__file__).resolve().parents[1]
ZIP = ROOT.parent / ".worktrees" / "sfhs-mobile-controls-v1" / "test-results" / "sfhs-mobile-controls-v1" / "sfhs-mobile-controls-v1-accepted-b02336c.zip"
VENDOR = ROOT / "vendor" / "sfhs-mobile-controls-v1"


class SfhsControlsV6DependencyTests(unittest.TestCase):
    def test_frozen_dependency_identity_and_selected_source(self):
        self.assertEqual(ZIP.stat().st_size, 52596)
        self.assertEqual(hashlib.sha256(ZIP.read_bytes()).hexdigest(), "f360fe5a9c80ffc78f2fc38ecd4fe22b149702d251ecf3f0fbeca20348123d25")
        manifest = json.loads((VENDOR / "handoff-manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["head"], "b02336c4de013a3fcd9bd900701867c7f99ffdd1")
        self.assertEqual(manifest["implementationCommit"], "9af795fbf22b19e06724785517b97bb3d98c934a")
        with zipfile.ZipFile(ZIP) as archive:
            for relative in ("package.json", "README.md", "src/index.ts", "src/profile.ts", "src/runtime.ts", "src/types.ts"):
                member = "package/packages/mobile-controls/" + relative
                self.assertEqual(archive.read(member), (VENDOR / relative).read_bytes())

    def test_protected_artifacts_remain_exact(self):
        expected = {
            "dist/sfhs-doom-freedoom2.html": "6737dbfc8c7909ea18a820de3cd6677654fab95277caf05eb9d660cb9235490e",
            "dist/sfhs-doom-android-samsung-input-v5.html": "fa78944cd1482770dde9fde2192022b07991ca1942359de97d7557dc79333b7e",
        }
        for relative, digest in expected.items():
            self.assertEqual(hashlib.sha256((ROOT / relative).read_bytes()).hexdigest(), digest)


if __name__ == "__main__":
    unittest.main()
