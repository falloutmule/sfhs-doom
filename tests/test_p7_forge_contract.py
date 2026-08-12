import importlib.util
import json
from pathlib import Path
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
VALIDATOR_PATH = ROOT / "tools" / "validate-forge-capsule.py"
SPEC = importlib.util.spec_from_file_location("forge_validator", VALIDATOR_PATH)
assert SPEC is not None and SPEC.loader is not None
validator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(validator)


class ForgeSourceContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.shell = (ROOT / "web" / "p7" / "forge-shell.html").read_text(encoding="utf-8")
        cls.build = (ROOT / "tools" / "build-forge-capsule.sh").read_text(encoding="utf-8")
        cls.packer = (ROOT / "tools" / "package-forge-capsule.py").read_text(encoding="utf-8")
        cls.analyzer = (ROOT / "web" / "p7" / "forge-analyzer-worker.js").read_text(encoding="utf-8")

    def test_engine_profile_is_content_independent(self):
        self.assertNotIn("--embed-file $wad", self.build)
        self.assertIn("embedded file flag present", self.build)
        self.assertIn("-sINVOKE_RUN=0", self.build)
        self.assertIn("-sSINGLE_FILE=1", self.build)
        self.assertIn("noInitialRun:true", self.shell)

    def test_manifest_and_mount_gate_are_product_owned(self):
        for token in (
            "sfhs.doom-capsule@1", "readCapsuleManifest", "mountEmbedded",
            "mountExternal", "IncrementalSha256", "forge.mountStage!=='ready'",
            "mainInvocations", "DecompressionStream('gzip')",
        ):
            self.assertIn(token, self.shell)

    def test_p7b_analyzer_is_bounded_and_worker_owned(self):
        for token in (
            "sfhs.doom-inspection@1", "128*1024*1024", "zipEntries:512",
            "expandedBytes:256*1024*1024", "zip-traversal", "wad-directory-bounds",
            "wad-overlap", "zip-encrypted", "zip-ratio", "crypto.subtle.digest",
            "launchable:false", "storedBytes:0",
        ):
            self.assertIn(token, self.analyzer)
        for token in ("new Worker(url)", "forge-inspect-file", "inspection-card", "analyzerSnapshot"):
            self.assertIn(token, self.shell)

    def test_packer_is_deterministic_and_chunked(self):
        for token in ("compresslevel=9", "mtime=0", "196_608", "application/octet-stream"):
            self.assertIn(token, self.packer)

    def test_manifest_rejects_unknown_top_level_key(self):
        full = ROOT / "dist" / "sfhs-doom-forge-v1.html"
        if not full.exists():
            self.skipTest("Forge artifact not built")
        text = full.read_text(encoding="utf-8")
        changed = text.replace('"schema": "sfhs.doom-capsule@1",', '"schema": "sfhs.doom-capsule@1",\n  "unknown": true,', 1)
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "bad.html"
            path.write_text(changed, encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "schema/topology"):
                validator.validate(path)


class ForgeArtifactContractTests(unittest.TestCase):
    def test_v1_full_artifact_is_still_valid(self):
        path = ROOT / "dist" / "sfhs-doom-forge-v1.html"
        if not path.exists():
            self.skipTest("Forge artifact not built")
        result = validator.validate(path, "full", 1)
        self.assertEqual(result["chunks"], 56)

    def test_v2_full_artifact(self):
        path = ROOT / "dist" / "sfhs-doom-forge-v2.html"
        if not path.exists():
            self.skipTest("Forge V2 artifact not built")
        result = validator.validate(path, "full", 2)
        self.assertEqual(result["chunks"], 56)

    def test_v2_thin_artifact(self):
        path = ROOT / "test-results" / "P07" / "P7-B" / "sfhs-doom-forge-v2-thin.html"
        if not path.exists():
            self.skipTest("thin Forge artifact not built")
        result = validator.validate(path, "thin", 2)
        self.assertEqual(result["chunks"], 0)


if __name__ == "__main__":
    unittest.main()
