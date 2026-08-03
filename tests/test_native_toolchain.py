import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def to_wsl_path(path):
    resolved = path.resolve()
    drive = resolved.drive.rstrip(":").lower()
    tail = "/".join(resolved.parts[1:])
    return f"/mnt/{drive}/{tail}"


class NativeToolchainTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.wsl_root = to_wsl_path(ROOT)

    def wsl(self, command):
        return subprocess.run(
            ["wsl.exe", "-d", "Ubuntu", "bash", "-lc", command],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

    def test_native_env_accepts_repository_and_prints_identity(self):
        result = self.wsl(f"cd '{self.wsl_root}' && bash tools/native-env.sh")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("NATIVE_ENV=PASS", result.stdout)
        self.assertIn(f"SFHS_REPO_ROOT={self.wsl_root}", result.stdout)
        self.assertIn("UPSTREAM_BASE=410d96855b5df5410ff591a90efeafa889119224", result.stdout)

    def test_native_env_rejects_invocation_outside_repository(self):
        result = self.wsl(f"cd /tmp && bash '{self.wsl_root}/tools/native-env.sh'")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("invoke from inside", result.stderr)

    def test_doctor_passes_without_installing(self):
        result = self.wsl(f"cd '{self.wsl_root}' && bash tools/native-toolchain-doctor.sh")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("NATIVE_TOOLCHAIN_DOCTOR=PASS", result.stdout)
        self.assertNotIn("apt-get", result.stdout + result.stderr)

    def test_doctor_failure_is_nonzero_and_explicit(self):
        result = self.wsl(
            f"cd '{self.wsl_root}' && "
            "SFHS_DOCTOR_FORCE_MISSING=cmake bash tools/native-toolchain-doctor.sh"
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("COMMAND cmake FAIL forced-missing", result.stdout)
        self.assertIn("NATIVE_TOOLCHAIN_DOCTOR=FAIL", result.stderr)

    def test_scripts_contain_no_installer_or_network_mutation(self):
        text = "\n".join(
            (ROOT / path).read_text(encoding="utf-8")
            for path in ("tools/native-env.sh", "tools/native-toolchain-doctor.sh")
        )
        for forbidden in ("apt-get", "apt ", "sudo ", "Invoke-WebRequest", "git fetch"):
            self.assertNotIn(forbidden, text)


if __name__ == "__main__":
    unittest.main()
