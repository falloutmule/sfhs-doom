from __future__ import annotations

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SHELL = (ROOT / 'web/p6/shell.html').read_text(encoding='utf-8')
BUILD = (ROOT / 'tools/build-single-file.sh').read_text(encoding='utf-8')


class P6MobileContractTests(unittest.TestCase):
    def test_portrait_shell_declares_the_android_profile(self):
        self.assertIn('P6-ANDROID-PORTRAIT-1', SHELL)
        self.assertIn('grid-template-rows:minmax(0,41fr) minmax(0,17fr) minmax(0,33fr)', SHELL)

    def test_all_required_touch_control_names_are_present(self):
        for control in ('move', 'look', 'fire', 'use', 'run', 'menu', 'map', 'weaponPrevious', 'weaponNext'):
            self.assertIn(f'data-control="{control}"', SHELL)

    def test_editor_profile_is_versioned_and_bounded(self):
        self.assertIn("const PROFILE_KEY = 'sfhsDoom.mobileControls.v1'", SHELL)
        self.assertIn('const MAX_PROFILE_BYTES = 65536;', SHELL)
        self.assertIn("['opacity', .25, .9]", SHELL)
        self.assertIn("['lookSensitivity', .25, 3]", SHELL)
        self.assertIn("['moveDeadZone', .1, .45]", SHELL)

    def test_android_build_requires_explicit_non_p3_output(self):
        self.assertIn('Android profile requires an explicit --output path', BUILD)
        self.assertIn('Android profile refuses the protected P3 output path', BUILD)
        self.assertIn('shell="$root/web/p6/shell.html"', BUILD)


if __name__ == '__main__':
    unittest.main()
