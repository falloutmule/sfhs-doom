from __future__ import annotations

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SHELL = (ROOT / 'web/p6/shell.html').read_text(encoding='utf-8')
BUILD = (ROOT / 'tools/build-single-file.sh').read_text(encoding='utf-8')
INPUT = (ROOT / 'src/sfhs_mobile/sfhs_mobile_input.c').read_text(encoding='utf-8')
INPUT_HEADER = (ROOT / 'src/sfhs_mobile/sfhs_mobile_input.h').read_text(encoding='utf-8')
VIDEO = (ROOT / 'src/i_video.c').read_text(encoding='utf-8')
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
        self.assertIn('EXPORTED_RUNTIME_METHODS=callMain,ccall,cwrap,FS,ENV,HEAP32', BUILD)
        self.assertIn("'_sfhs_mobile_input_set_held'", BUILD)
        self.assertIn("'_sfhs_mobile_present_debug_snapshot'", BUILD)
        self.assertIn("'-nograbmouse'", SHELL)
        self.assertNotIn("'-nomouse'", SHELL)
        p3_shell = (ROOT / 'web/p3/shell.html').read_text(encoding='utf-8')
        self.assertNotIn("'-nograbmouse'", p3_shell)

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
        self.assertIn('P6-SAMSUNG-LOOK-V5', SHELL)
        self.assertIn('SFHS_P6_DIAGNOSTICS', SHELL)

    def test_v3_look_accumulates_fractional_pointer_motion(self):
        self.assertIn('lookState.accumulator+=rawDelta*sensitivity', SHELL)
        self.assertIn('const whole=Math.trunc(lookState.accumulator)', SHELL)
        self.assertIn("typeof event.getCoalescedEvents==='function'", SHELL)
        self.assertNotIn('Math.round((event.clientX-element._sfhsLookX)', SHELL)
        self.assertIn('authoritativeForPhysicalVisibility:false', SHELL)

    def test_v5_records_pointer_state_and_always_collects_outcomes(self):
        self.assertIn("schema:'sfhs-doom-samsung-diagnostics-v5'", SHELL)
        self.assertIn('pointerLock:{active:!!locked', SHELL)
        self.assertIn('documentHasFocus:document.hasFocus()', SHELL)
        for field in ('screenX', 'screenY', 'pageX', 'pageY', 'movementX', 'movementY', 'buttons', 'pressure'):
            self.assertIn(field, SHELL)
        self.assertNotIn('if(!telemetry.testMode)return null', SHELL)
        self.assertIn('coordinateUsable:coordinateUsable(event,element)', SHELL)

    def test_v5_aggregates_mobile_look_once_per_platform_tic(self):
        self.assertIn('pending_look_x = SaturatingAdd(pending_look_x, relative_x);', INPUT)
        self.assertIn('int sfhs_mobile_input_flush_look(void)', INPUT)
        self.assertIn('sfhs_mobile_input_flush_look();', VIDEO)
        self.assertIn('sfhs_mobile_input_flush_look(void);', INPUT_HEADER)
        self.assertIn('look_units_accumulated', INPUT_HEADER)
        self.assertIn('look_flush_calls', INPUT_HEADER)
        self.assertIn('look_units_flushed', INPUT_HEADER)
        post_look = INPUT.split('SFHS_KEEP int sfhs_mobile_input_post_look', 1)[1].split('int sfhs_mobile_input_flush_look', 1)[0]
        self.assertNotIn('D_PostEvent', post_look)
        flush = INPUT.split('int sfhs_mobile_input_flush_look', 1)[1].split('SFHS_KEEP int sfhs_mobile_input_release_all', 1)[0]
        self.assertEqual(flush.count('D_PostEvent(&event);'), 1)
        self.assertNotIn('G_Responder', INPUT)
        self.assertIn('domLookSamples', SHELL)
        self.assertIn('lookUnitsFlushed', SHELL)
        self.assertIn('angleProducingTics', SHELL)

    def test_v2_input_bridge_has_direct_exports_and_read_only_telemetry(self):
        self.assertIn("window.Module['_'+name]", SHELL)
        self.assertIn('sfhs_mobile_input_debug_snapshot', INPUT)
        self.assertIn('sfhs_mobile_present_debug_snapshot', BUILD)
        self.assertNotIn('G_Responder', INPUT)
        self.assertNotIn('P_DamageMobj', INPUT)

    def test_samsung_repair_keeps_the_original_state_packet_layout(self):
        header = (ROOT / 'src/sfhs_mobile/sfhs_mobile_state.h').read_text(encoding='utf-8')
        self.assertIn('typedef struct { int32_t version, active, episode, map, x, y, angle, health, armor, armor_type, weapon, ammo, keys, line_count; } sfhs_mobile_state_t;', header)


if __name__ == '__main__':
    unittest.main()
