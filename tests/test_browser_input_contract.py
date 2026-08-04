from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class BrowserInputContractTests(unittest.TestCase):
    def test_shell_is_focusable_and_input_is_bounded(self):
        shell = (ROOT / 'web/p2/shell.html').read_text(encoding='utf-8')
        pre = (ROOT / 'web/p2/pre.js').read_text(encoding='utf-8')
        self.assertIn('id="canvas"', shell)
        self.assertIn('tabindex="0"', shell)
        self.assertIn('id="outside-input"', shell)
        self.assertIn("new URLSearchParams(window.location.search).get('menu')", pre)
        self.assertIn("'-iwad', wad", pre)
        self.assertNotIn('Module._', pre)
        self.assertNotIn('FS.write', pre)

    def test_input_contract_has_no_global_pre_start_key_hijack(self):
        pre = (ROOT / 'web/p2/pre.js').read_text(encoding='utf-8')
        post = (ROOT / 'web/p2/post.js').read_text(encoding='utf-8')
        self.assertNotIn('addEventListener(\'keydown\'', pre)
        self.assertNotIn('addEventListener("keydown"', pre)
        self.assertNotIn('preventDefault', pre + post)
        self.assertNotIn('direct engine state', pre.lower() + post.lower())

    def test_diagnostic_uses_browser_screenshots_and_heartbeat(self):
        spec = (ROOT / 'browser-tests/tests/input.spec.mjs').read_text(encoding='utf-8')
        self.assertIn('recordSfhsHeartbeat', spec)
        self.assertIn('keyboard.down(\'ArrowUp\')', spec)
        self.assertIn('keyboard.up(\'ArrowUp\')', spec)
        self.assertIn("page.screenshot({ path: resolve(screenshotRoot, 'gameplay-arrowup-after.png') })", spec)
        self.assertNotIn('canvas.toDataURL', spec)
        self.assertNotIn('getImageData', spec)


if __name__ == '__main__':
    unittest.main()
