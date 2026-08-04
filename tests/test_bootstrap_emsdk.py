import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class EmsdkBootstrapContractTests(unittest.TestCase):
    def test_lock_is_exact_and_has_no_moving_alias(self):
        lock = json.loads((ROOT / 'tools/emsdk-lock.json').read_text(encoding='utf-8'))
        self.assertEqual(lock['repository'], 'https://github.com/emscripten-core/emsdk.git')
        self.assertEqual(lock['repository_commit'], '9fcdf593953edfcddb297572d7f2177d336b0479')
        self.assertEqual(lock['sdk_version'], '6.0.5')
        self.assertEqual(lock['emscripten_release_commit'], 'dbd755b5da399329c2576f6e3dfa7f419f5d8409')
        self.assertFalse(lock['moving_aliases_allowed'])
        self.assertEqual(lock['ports'], ['sdl2', 'sdl2_mixer'])

    def test_bootstrap_is_local_and_pinned(self):
        script = (ROOT / 'tools/bootstrap-emsdk.sh').read_text(encoding='utf-8')
        self.assertIn('git clone "$EMSDK_REPOSITORY" "$EMSDK_DIR"', script)
        self.assertIn('git -C "$EMSDK_DIR" checkout --detach "$EMSDK_COMMIT"', script)
        self.assertIn('./emsdk install "$SDK_VERSION"', script)
        self.assertIn('./emsdk activate "$SDK_VERSION"', script)
        self.assertIn('embuilder build sdl2 sdl2_mixer', script)
        self.assertNotIn('--permanent', script)
        self.assertNotIn('latest', script.lower())
        self.assertIn('PLAYWRIGHT_BROWSERS_PATH', script)

    def test_unit_contract_is_local_only(self):
        self.assertTrue((ROOT / 'tools/emsdk-lock.json').is_file())
        self.assertTrue((ROOT / 'browser-tests/package.json').is_file())


if __name__ == '__main__':
    unittest.main()
