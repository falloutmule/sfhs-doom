import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
VALIDATOR_PATH = ROOT / "tools" / "validate_artifact_manifest.py"
MANIFEST_PATH = ROOT / "evidence/manifests/fixture-artifact-manifest.json"
SPEC = importlib.util.spec_from_file_location("artifact_manifest_validator", VALIDATOR_PATH)
assert SPEC is not None and SPEC.loader is not None
validator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(validator)


class ArtifactManifestTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.valid = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        cls.checker = validator.ManifestValidator(ROOT)

    def write_temp_manifest(self, data, directory):
        path = Path(directory) / "manifest.json"
        path.write_text(json.dumps(data), encoding="utf-8")
        return path

    def assert_invalid(self, data, message):
        with tempfile.TemporaryDirectory(prefix="artifact-manifest-test-") as directory:
            path = self.write_temp_manifest(data, directory)
            with self.assertRaisesRegex(validator.ManifestValidationError, message):
                self.checker.validate_file(path)

    def test_valid_fixture_passes(self):
        self.checker.validate_file(MANIFEST_PATH)

    def test_missing_critical_field_rejected(self):
        data = copy.deepcopy(self.valid)
        del data["source"]
        self.assert_invalid(data, "missing required field: source")

    def test_unknown_critical_field_rejected(self):
        data = copy.deepcopy(self.valid)
        data["unexpected"] = True
        self.assert_invalid(data, "unknown fields: unexpected")

    def test_absolute_path_rejected(self):
        data = copy.deepcopy(self.valid)
        data["artifacts"][0]["path"] = "C:/outside/artifact.txt"
        self.assert_invalid(data, "repository-relative")

    def test_escaping_path_rejected(self):
        data = copy.deepcopy(self.valid)
        data["source"]["inputs"][0]["path"] = "../../outside.txt"
        self.assert_invalid(data, "may not escape")

    def test_malformed_sha_rejected(self):
        data = copy.deepcopy(self.valid)
        data["source"]["upstream_sha"] = "not-a-sha"
        self.assert_invalid(data, "40-character commit SHA")

    def test_wrong_size_rejected(self):
        data = copy.deepcopy(self.valid)
        data["artifacts"][0]["size_bytes"] += 1
        self.assert_invalid(data, "size_bytes does not match disk")

    def test_wrong_hash_rejected(self):
        data = copy.deepcopy(self.valid)
        data["artifacts"][0]["sha256"] = "0" * 64
        self.assert_invalid(data, "sha256 does not match disk")

    def test_duplicate_artifact_path_rejected(self):
        data = copy.deepcopy(self.valid)
        data["artifacts"].append(copy.deepcopy(data["artifacts"][0]))
        self.assert_invalid(data, "duplicate evidence path")

    def test_missing_file_rejected(self):
        data = copy.deepcopy(self.valid)
        data["artifacts"][0]["path"] = "evidence/fixtures/does-not-exist.txt"
        self.assert_invalid(data, "file is missing")

    def test_duplicate_run_id_rejected(self):
        data = copy.deepcopy(self.valid)
        data["verification"]["run_ids"].append(data["verification"]["run_ids"][0])
        self.assert_invalid(data, "run_ids must be unique")

    def test_command_metadata_is_not_executed(self):
        data = copy.deepcopy(self.valid)
        data["build"]["commands"][0]["argv"] = [sys.executable, "-c", "raise SystemExit(99)"]
        self.checker.validate_data(data)

    def test_cli_rejects_tampered_manifest(self):
        data = copy.deepcopy(self.valid)
        data["artifacts"][0]["sha256"] = "0" * 64
        with tempfile.TemporaryDirectory(prefix="artifact-manifest-cli-") as directory:
            path = self.write_temp_manifest(data, directory)
            result = subprocess.run(
                [sys.executable, str(VALIDATOR_PATH), str(path)],
                capture_output=True,
                text=True,
                check=False,
            )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("sha256", result.stderr)


if __name__ == "__main__":
    unittest.main()
