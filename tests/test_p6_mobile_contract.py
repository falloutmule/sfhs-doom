from __future__ import annotations

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
SHELL = (ROOT / "web/p6/shell.html").read_text(encoding="utf-8")
BUILD = (ROOT / "tools/build-single-file.sh").read_text(encoding="utf-8")
INPUT = (ROOT / "src/sfhs_mobile/sfhs_mobile_input.c").read_text(encoding="utf-8")
HEADER = (ROOT / "src/sfhs_mobile/sfhs_mobile_input.h").read_text(encoding="utf-8")
STATE = (ROOT / "src/sfhs_mobile/sfhs_mobile_state.c").read_text(encoding="utf-8")


class P6MobileContractTests(unittest.TestCase):
    def test_v6_shell_uses_one_shared_runtime(self):
        self.assertIn("SFHSMobileControls.createMobileControls", SHELL)
        self.assertIn("sfhsDoom.mobileControls.v2", SHELL)
        self.assertIn("SFHS_MOBILE_CONTROLS_BUNDLE", SHELL)
        self.assertNotIn("data-mobile-action", SHELL)
        self.assertNotIn("processLook(event)", SHELL)
        self.assertNotIn("lookState.accumulator", SHELL)

    def test_v9_declares_doom_specific_resize_ranges_and_relative_look_rail(self):
        for control in ("move", "look", "primary", "interact", "modifier", "menu", "map", "weapon-previous", "weapon-next"):
            self.assertIn(f"id:'{control}'", SHELL)
        self.assertIn('data-sfhs-control-id="look"', SHELL)
        self.assertIn("top:27.5%; bottom:27.5%", SHELL)
        self.assertIn(".sfhs-mobile-control-resize { width:32px; height:32px", SHELL)
        self.assertIn('[data-editing="true"] .sfhs-mobile-control[data-control-active="true"]', SHELL)
        self.assertIn("lookCountsPerWidth = 4096", SHELL)
        self.assertIn("relativeSensitivity:1", SHELL)
        self.assertIn("id:'look',type:'relative1d',axis:'x',label:'LOOK',minWidth:.08,minHeight:.05", SHELL)
        self.assertIn("id:'primary',type:'hold',label:'FIRE',minWidth:.07,minHeight:.05", SHELL)
        for control in ("interact", "modifier", "menu", "map", "weapon-previous", "weapon-next"):
            self.assertIn(f"id:'{control}'", SHELL)
        self.assertEqual(SHELL.count("minWidth:.06,minHeight:.05"), 6)

    def test_shared_stick_uses_upward_cartesian_y_for_doom_forward(self):
        self.assertIn("setHeld(actions.forward,move.y > threshold)", SHELL)
        self.assertIn("setHeld(actions.backward,move.y < -threshold)", SHELL)

    def test_v6_keeps_mobile_launch_contract_and_single_file_bundle(self):
        self.assertIn("'-nograbmouse'", SHELL)
        self.assertNotIn("'-nomouse'", SHELL)
        self.assertIn("inject-mobile-controls-bundle.py", BUILD)
        self.assertIn("--global-name=SFHSMobileControls", BUILD)
        self.assertIn("--format=iife", BUILD)
        self.assertIn("EXPORTED_RUNTIME_METHODS=callMain,ccall,cwrap,FS,ENV,HEAP32", BUILD)

    def test_native_bridge_posts_only_standard_doom_events(self):
        self.assertIn("D_PostEvent(&event);", INPUT)
        self.assertIn("sfhs_mobile_input_flush_controls", INPUT)
        self.assertIn("SFHSMobileControlsFlush", INPUT)
        self.assertNotIn("pending_look_x", INPUT)
        self.assertNotIn("sfhs_mobile_input_flush_look", INPUT)
        self.assertNotIn("G_Responder", INPUT)
        self.assertNotIn("player_t", INPUT)
        self.assertIn("sfhs_mobile_input_flush_controls();", (ROOT / "src/i_video.c").read_text(encoding="utf-8"))
        self.assertNotIn("sfhs_mobile_input_flush_look", HEADER)

    def test_state_packet_remains_read_only_and_map_limited(self):
        self.assertIn("ML_MAPPED", STATE)
        self.assertIn("ML_DONTDRAW", STATE)
        self.assertNotIn("thinkercap", STATE)
        self.assertNotIn("P_DamageMobj", STATE)
        self.assertNotIn("sfhs_mobile_state_write", STATE)


if __name__ == "__main__":
    unittest.main()
