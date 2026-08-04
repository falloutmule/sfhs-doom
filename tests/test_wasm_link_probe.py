from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class WasmLinkProbeTests(unittest.TestCase):
    def test_probe_is_unmodified_source_and_local_only(self):
        script = (ROOT / 'tools/probe-wasm-link.sh').read_text(encoding='utf-8')
        self.assertIn('cmake --build "$build_dir" --target chocolate-doom --verbose', script)
        self.assertIn('vendor-cache/freedoom/0.13.0/data/freedoom2.wad', script)
        self.assertIn('127.0.0.1', script)
        self.assertNotIn('git checkout', script)
        self.assertNotIn('git reset', script)
        self.assertNotIn('curl --fail --location', script)
        self.assertNotIn('git add src', script)
        self.assertNotIn('git commit', script)

    def test_probe_summary_is_captured_and_bounded(self):
        summary = (ROOT / 'evidence/task-runs/P02-DOOM-P2-040/probe-summary.txt').read_text(encoding='utf-8')
        self.assertRegex(summary, r'build_exit=[01]')
        self.assertRegex(summary, r'classification=(DIRECT_SUCCESS|BOUNDED_ADAPTER_FAILURE)')

    def test_required_probe_evidence_exists(self):
        run_dir = ROOT / 'evidence/task-runs/P02-DOOM-P2-040'
        for name in ('build.stdout.txt', 'build.stderr.txt', 'link-flags.txt', 'file-set.tsv', 'artifact-sha256.txt', 'undefined-symbols.txt', 'local-server-result.txt'):
            self.assertTrue((run_dir / name).is_file(), name)

    def test_no_commercial_data_is_claimed(self):
        report = (ROOT / 'docs/reports/WASM_UPSTREAM_LINK_PROBE.md').read_text(encoding='utf-8')
        self.assertNotIn('doom2.wad', report.lower())
        self.assertIn('Freedoom', report)


if __name__ == '__main__':
    unittest.main()
