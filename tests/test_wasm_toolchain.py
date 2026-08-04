import os
from pathlib import Path
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[1]


def run_doctor(**overrides):
    env = os.environ.copy()
    env.update(overrides)
    return subprocess.run(
        ['bash', 'tools/wasm-toolchain-doctor.sh'],
        cwd=ROOT,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )


class WasmToolchainContractTests(unittest.TestCase):
    def test_environment_and_doctor_are_no_install_scripts(self):
        env_script = (ROOT / 'tools/wasm-env.sh').read_text(encoding='utf-8')
        doctor = (ROOT / 'tools/wasm-toolchain-doctor.sh').read_text(encoding='utf-8')
        self.assertIn('source "$SFHS_EMSDK_ROOT/emsdk_env.sh"', env_script)
        self.assertIn('WASM_TOOLCHAIN_DOCTOR=PASS', doctor)
        self.assertNotIn('apt ', doctor)
        self.assertNotIn('git clone', doctor)
        self.assertNotIn('npm install', doctor)

    def test_forced_missing_dependency_is_rejected(self):
        result = run_doctor(SFHS_WASM_DOCTOR_FORCE_MISSING='emcc')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('COMMAND emcc FAIL forced-missing', result.stdout)
        self.assertIn('WASM_TOOLCHAIN_DOCTOR=FAIL', result.stderr)

    def test_forced_wrong_dependency_version_is_rejected(self):
        result = run_doctor(SFHS_WASM_DOCTOR_FORCE_WRONG_VERSION='emcc')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('VERSION emcc FAIL', result.stdout)
        self.assertIn('WASM_TOOLCHAIN_DOCTOR=FAIL', result.stderr)

    def test_smoke_source_and_browser_spec_are_pinned(self):
        source = (ROOT / 'tests/fixtures/wasm/sdl-smoke.c').read_text(encoding='utf-8')
        spec = (ROOT / 'browser-tests/tests/toolchain.spec.mjs').read_text(encoding='utf-8')
        self.assertIn('SDL_Init', source)
        self.assertIn('data-sfhs-wasm-smoke', source)
        self.assertIn('chromium', spec)
        self.assertIn('firefox', spec)
        self.assertIn('127.0.0.1', spec)


if __name__ == '__main__':
    unittest.main()
