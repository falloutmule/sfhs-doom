from pathlib import Path
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = "tools/run-upstream-native-tests.sh"
WSL_ROOT = "/mnt/c/Users/fallo/Documents/Single-File-Html/sfhs-doom"


class UpstreamTestRunnerTests(unittest.TestCase):
    def classify(self, text, exit_code):
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".txt", dir="C:/tmp", delete=False) as stream:
            stream.write(text)
            path = Path(stream.name)
        try:
            wsl_path = "/mnt/c/" + path.as_posix()[3:]
            command = f"cd {WSL_ROOT} && bash {SCRIPT} --classify-ctest-output {wsl_path} {exit_code}"
            return subprocess.run(["wsl.exe", "bash", "-lc", command], capture_output=True, text=True, check=False)
        finally:
            path.unlink(missing_ok=True)

    def test_no_tests_fixture_is_not_present(self):
        result = self.classify("Test project fixture\nNo tests were found!!!\n", 0)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), "NOT_PRESENT")

    def test_populated_success_fixture_passes(self):
        result = self.classify("100% tests passed, 0 tests failed out of 2\n", 0)
        self.assertEqual(result.stdout.strip(), "PASS")

    def test_nonzero_fixture_fails(self):
        result = self.classify("1 test failed\n", 8)
        self.assertEqual(result.stdout.strip(), "FAIL")

    def test_script_records_all_truthful_classes(self):
        text = (ROOT / SCRIPT).read_text(encoding="utf-8")
        for classification in ("PASS", "FAIL", "NOT_PRESENT", "NOT_APPLICABLE", "BLOCKED"):
            self.assertIn(classification, text)

    def test_script_does_not_fetch_or_patch_upstream(self):
        text = (ROOT / SCRIPT).read_text(encoding="utf-8").lower()
        for forbidden in ("git submodule update", "git fetch", "curl ", "wget ", "git apply"):
            self.assertNotIn(forbidden, text)


if __name__ == "__main__":
    unittest.main()
