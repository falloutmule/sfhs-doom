from pathlib import Path
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'tools/configure-wasm.sh'


class ConfigureWasmTests(unittest.TestCase):
    def test_unknown_argument_is_rejected(self):
        result = subprocess.run(
            ['bash', str(SCRIPT), '--not-a-real-option'],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(result.returncode, 2)
        self.assertIn('unknown argument', result.stderr)

    def test_clean_scope_is_exact_and_source_is_not_touched(self):
        script = SCRIPT.read_text(encoding='utf-8')
        self.assertIn('build/wasm/upstream-configure', script)
        self.assertIn('rm -rf -- "$build_dir"', script)
        self.assertIn('-DENABLE_SDL2_MIXER=ON', script)
        self.assertIn('-DENABLE_SDL2_NET=OFF', script)
        self.assertIn('-DSFHS_ORACLE_TEST=OFF', script)
        self.assertNotIn('git checkout', script)
        self.assertNotIn('git reset', script)
        self.assertNotIn('src/', script)

    def test_configure_evidence_records_pinned_boundary(self):
        run_dir = ROOT / 'evidence/task-runs/P02-DOOM-P2-030'
        environment = (run_dir / 'configure-environment.txt').read_text(encoding='utf-8')
        argv = (run_dir / 'configure-argv.txt').read_text(encoding='utf-8')
        target = (run_dir / 'target-check.txt').read_text(encoding='utf-8')
        cache = (run_dir / 'cache-selected.txt').read_text(encoding='utf-8')
        self.assertIn('CC=emcc', environment)
        self.assertIn('SDL2_MIXER=ON', environment)
        self.assertIn('-DENABLE_SDL2_NET=OFF', argv)
        self.assertIn('TARGET chocolate-doom PASS', target)
        self.assertIn('EMSCRIPTEN', cache)


if __name__ == '__main__':
    unittest.main()
