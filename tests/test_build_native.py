import hashlib
import json
from pathlib import Path
import subprocess
import sys
import unittest


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_ROOT = ROOT / "evidence/manifests/P01"
BUILD_SCRIPT = ROOT / "tools/build-native.sh"


class NativeBuildTests(unittest.TestCase):
    def manifests(self, config):
        paths = sorted(MANIFEST_ROOT.glob(f"native-{config}-*.json"))
        self.assertGreaterEqual(len(paths), 2, f"two {config} manifests required")
        return paths

    def test_build_driver_prints_pinned_identity(self):
        command = "cd /mnt/c/Users/fallo/Documents/Single-File-Html/sfhs-doom && bash tools/build-native.sh --print-identity"
        result = subprocess.run(["wsl.exe", "bash", "-lc", command], cwd=ROOT, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("upstream_tag=chocolate-doom-3.1.1", result.stdout)
        self.assertIn("upstream_sha=410d96855b5df5410ff591a90efeafa889119224", result.stdout)
        self.assertIn("ENABLE_SDL2_NET=OFF", result.stdout)

    def test_unknown_configuration_is_rejected(self):
        command = "cd /mnt/c/Users/fallo/Documents/Single-File-Html/sfhs-doom && bash tools/build-native.sh --config invalid"
        result = subprocess.run(["wsl.exe", "bash", "-lc", command], cwd=ROOT, capture_output=True, text=True, check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("unknown config", result.stderr)

    def test_driver_has_guarded_cleanup_and_parity_flags(self):
        text = BUILD_SCRIPT.read_text(encoding="utf-8")
        self.assertIn('"$ROOT"/build/native/debug|"$ROOT"/build/native/release', text)
        for flag in (
            "-DENABLE_SDL2_NET=OFF",
            "-DCMAKE_DISABLE_FIND_PACKAGE_FluidSynth=TRUE",
            "-DCMAKE_DISABLE_FIND_PACKAGE_SampleRate=TRUE",
            "-DCMAKE_DISABLE_FIND_PACKAGE_PNG=TRUE",
        ):
            self.assertIn(flag, text)

    def test_two_clean_builds_have_equal_stable_identity(self):
        for config in ("debug", "release"):
            first_path, second_path = self.manifests(config)[-2:]
            first = json.loads(first_path.read_text(encoding="utf-8"))
            second = json.loads(second_path.read_text(encoding="utf-8"))
            first_stable = (
                first["source"],
                first["artifacts"][0]["size_bytes"],
                first["artifacts"][0]["sha256"],
                first["notes"][0],
                first["notes"][2],
            )
            second_stable = (
                second["source"],
                second["artifacts"][0]["size_bytes"],
                second["artifacts"][0]["sha256"],
                second["notes"][0],
                second["notes"][2],
            )
            self.assertEqual(first_stable, second_stable)

    def test_current_executables_match_latest_manifests(self):
        for config in ("debug", "release"):
            data = json.loads(self.manifests(config)[-1].read_text(encoding="utf-8"))
            artifact = data["artifacts"][0]
            path = ROOT / artifact["path"]
            self.assertTrue(path.is_file())
            payload = path.read_bytes()
            self.assertEqual(len(payload), artifact["size_bytes"])
            self.assertEqual(hashlib.sha256(payload).hexdigest(), artifact["sha256"])

    def test_all_manifests_validate(self):
        for config in ("debug", "release"):
            for manifest in self.manifests(config):
                result = subprocess.run(
                    [sys.executable, str(ROOT / "tools/validate_artifact_manifest.py"), str(manifest)],
                    cwd=ROOT,
                    capture_output=True,
                    text=True,
                    check=False,
                )
                self.assertEqual(result.returncode, 0, result.stderr)

    def test_hash_helper_matches_manifest(self):
        manifest = json.loads(self.manifests("release")[-1].read_text(encoding="utf-8"))
        artifact = manifest["artifacts"][0]
        result = subprocess.run(
            [sys.executable, str(ROOT / "tools/hash-artifact.py"), artifact["path"]],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        observed = json.loads(result.stdout)
        self.assertEqual(observed["size_bytes"], artifact["size_bytes"])
        self.assertEqual(observed["sha256"], artifact["sha256"])


if __name__ == "__main__":
    unittest.main()
