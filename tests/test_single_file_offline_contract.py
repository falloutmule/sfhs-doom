from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class SingleFileOfflineContractTests(unittest.TestCase):
    def test_direct_file_harness_blocks_network_and_force_click(self):
        text = (ROOT / 'browser-tests/tests/single-file-offline.spec.mjs').read_text(encoding='utf-8')
        self.assertIn('pathToFileURL', text)
        self.assertIn("route.request().url()", text)
        self.assertIn('force: false', text)

    def test_product_is_single_file_input(self):
        artifact = ROOT / 'dist/sfhs-doom-freedoom2.html'
        self.assertTrue(artifact.is_file())
        self.assertGreater(artifact.stat().st_size, 100000)

    def test_no_server_is_used(self):
        text = (ROOT / 'browser-tests/tests/single-file-offline.spec.mjs').read_text(encoding='utf-8')
        self.assertNotIn('createServer', text)
        self.assertNotIn('serve-wasm', text)


if __name__ == '__main__':
    unittest.main()
