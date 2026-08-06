from __future__ import annotations

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SHELL = (ROOT / 'web/p6/shell.html').read_text(encoding='utf-8')
BUILD = (ROOT / 'tools/build-single-file.sh').read_text(encoding='utf-8')
INPUT = (ROOT / 'src/sfhs_mobile/sfhs_mobile_input.c').read_text(encoding='utf-8')
STATE = (ROOT / 'src/sfhs_mobile/sfhs_mobile_state.c').read_text(encoding='utf-8')


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
        self.assertIn('EXPORTED_RUNTIME_METHODS=callMain,FS,ENV,HEAP32', BUILD)

    def test_mobile_input_posts_standard_events_without_gameplay_calls(self):
        self.assertIn('D_PostEvent(&event);', INPUT)
        self.assertIn('key_up', INPUT)
        self.assertNotIn('G_Responder', INPUT)
        self.assertNotIn('player_t', INPUT)

    def test_mobile_state_exports_only_mapped_drawable_line_geometry(self):
        self.assertIn('ML_MAPPED', STATE)
        self.assertIn('ML_DONTDRAW', STATE)
        self.assertNotIn('thinkercap', STATE)
        self.assertNotIn('P_DamageMobj', STATE)
        self.assertNotIn('sfhs_mobile_state_write', STATE)

    def test_samsung_diagnostic_reads_the_existing_logical_framebuffer(self):
        self.assertIn('sfhs_mobile_video_probe', STATE)
        self.assertIn('I_VideoBuffer', STATE)
        self.assertNotIn('I_VideoBuffer[', STATE.split('sfhs_mobile_video_probe', 1)[1].replace('I_VideoBuffer[(', ''))
        self.assertIn('P6-SAMSUNG-BLACK-CANVAS-DIAG-1', SHELL)
        self.assertIn('SFHS_P6_DIAGNOSTICS', SHELL)

    def test_samsung_repair_keeps_the_original_state_packet_layout(self):
        header = (ROOT / 'src/sfhs_mobile/sfhs_mobile_state.h').read_text(encoding='utf-8')
        self.assertIn('typedef struct { int32_t version, active, episode, map, x, y, angle, health, armor, armor_type, weapon, ammo, keys, line_count; } sfhs_mobile_state_t;', header)


if __name__ == '__main__':
    unittest.main()
