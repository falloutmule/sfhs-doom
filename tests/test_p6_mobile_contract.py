from __future__ import annotations

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
SHELL = (ROOT / "web/p6/shell.html").read_text(encoding="utf-8")
BUILD = (ROOT / "tools/build-single-file.sh").read_text(encoding="utf-8")
INPUT = (ROOT / "src/sfhs_mobile/sfhs_mobile_input.c").read_text(encoding="utf-8")
HEADER = (ROOT / "src/sfhs_mobile/sfhs_mobile_input.h").read_text(encoding="utf-8")
STATE = (ROOT / "src/sfhs_mobile/sfhs_mobile_state.c").read_text(encoding="utf-8")
HUD = (ROOT / "src/sfhs_mobile/sfhs_mobile_hud.c").read_text(encoding="utf-8")
HUD_HEADER = (ROOT / "src/sfhs_mobile/sfhs_mobile_hud.h").read_text(encoding="utf-8")


class P6MobileContractTests(unittest.TestCase):
    def test_v6_shell_uses_one_shared_runtime(self):
        self.assertIn("SFHSMobileControls.createMobileControls", SHELL)
        self.assertIn("sfhsDoom.mobileControls.v2", SHELL)
        self.assertIn("SFHS_MOBILE_CONTROLS_BUNDLE", SHELL)
        self.assertNotIn("data-mobile-action", SHELL)
        self.assertNotIn("processLook(event)", SHELL)
        self.assertNotIn("lookState.accumulator", SHELL)

    def test_v13_retains_doom_specific_resize_ranges_and_relative_look_rail(self):
        for control in ("move", "look", "primary", "interact", "modifier", "menu", "map", "weapon-previous", "weapon-next"):
            self.assertIn(f"id:'{control}'", SHELL)
        self.assertIn('data-sfhs-control-id="look"', SHELL)
        self.assertIn("top:27.5%; bottom:27.5%", SHELL)
        self.assertIn(".sfhs-mobile-control-resize { width:32px; height:32px", SHELL)
        self.assertIn('[data-editing="true"] .sfhs-mobile-control[data-control-active="true"]', SHELL)
        self.assertIn("lookCountsPerWidth=4096", SHELL)
        self.assertIn("relativeSensitivity:1", SHELL)
        self.assertIn("id:'look',type:'relative1d',axis:'x',label:'LOOK',minWidth:.08,minHeight:.05", SHELL)
        self.assertIn("id:'primary',type:'hold',label:'FIRE',minWidth:.07,minHeight:.05", SHELL)
        for control in ("interact", "modifier", "menu", "map", "weapon-previous", "weapon-next"):
            self.assertIn(f"id:'{control}'", SHELL)
        self.assertEqual(SHELL.count("minWidth:.06,minHeight:.05"), 6)

    def test_shared_stick_uses_upward_cartesian_y_for_doom_forward(self):
        self.assertIn("setHeld(actions.forward,move.y>threshold)", SHELL)
        self.assertIn("setHeld(actions.backward,move.y< -threshold)", SHELL)

    def test_v13_keeps_mobile_launch_contract_and_single_file_bundle(self):
        self.assertIn("'-nograbmouse'", SHELL)
        self.assertNotIn("'-nomouse'", SHELL)
        self.assertIn("inject-mobile-controls-bundle.py", BUILD)
        self.assertIn("--global-name=SFHSMobileControls", BUILD)
        self.assertIn("--format=iife", BUILD)
        self.assertIn("runtime_methods='callMain,ccall,cwrap,FS,ENV,HEAP32'", BUILD)
        self.assertIn('runtime_methods="$runtime_methods,HEAPU8"', BUILD)
        self.assertIn("_sfhs_mobile_hud_snapshot", BUILD)
        self.assertIn("_sfhs_mobile_hud_pixels", BUILD)

    def test_v13_detached_hud_contract_is_read_only_and_fixed_size(self):
        self.assertIn("#define SFHS_MOBILE_HUD_WIDTH 320", HUD_HEADER)
        self.assertIn("#define SFHS_MOBILE_HUD_HEIGHT 32", HUD_HEADER)
        self.assertIn("const sfhs_mobile_hud_snapshot_t *sfhs_mobile_hud_snapshot", HUD_HEADER)
        self.assertIn("const uint8_t *sfhs_mobile_hud_pixels", HUD_HEADER)
        self.assertIn("SFHS_MOBILE_HUD_WIDTH * 4", HUD)
        self.assertIn('id="doom-status-canvas" width="320" height="32"', SHELL)
        self.assertIn('id="sfhs-fullscreen-root"', SHELL)
        self.assertNotIn('id="info-strip"', SHELL)

    def test_v13_gives_sdl_backing_ownership_and_keeps_compact_editor_region(self):
        self.assertIn("--world-height:75vw", SHELL)
        self.assertIn("#game-region { position:relative; width:100%; height:var(--world-height)", SHELL)
        self.assertIn("#canvas { position:absolute; left:0; top:0; display:block; width:320px; height:200px", SHELL)
        self.assertIn("#canvas { aspect-ratio:8/5; }", SHELL)
        self.assertIn('id="canvas" width="320" height="200"', SHELL)
        self.assertIn("--world-scale-x", SHELL)
        self.assertIn("syncWorldScale()", SHELL)
        self.assertIn("document.body.dataset.sfhsP6Presentation='active'", SHELL)
        self.assertIn("presentationSnapshot", SHELL)
        self.assertIn("canvasAttributeWidth", SHELL)
        self.assertIn("gameRegionHeight", SHELL)
        self.assertNotIn("MutationObserver(restoreWorldBacking)", SHELL)
        self.assertNotIn("worldCanvas.width!==320||worldCanvas.height!==200", SHELL)
        self.assertIn('--control-deck-height:320px', SHELL)
        minimap_start = SHELL.index('<section id="minimap-region"')
        minimap_end = SHELL.index('</section>', minimap_start)
        editor_at = SHELL.index('<form id="edit-panel"')
        self.assertLess(minimap_start, editor_at)
        self.assertLess(editor_at, minimap_end)
        self.assertIn("minimapRegion.dataset.editing=String(editing)", SHELL)
        self.assertIn("document.body.dataset.sfhsP6Editing=String(editing)", SHELL)
        self.assertIn("document.body.dataset.sfhsP6Editing==='true'", SHELL)
        for control in ("profile-reset", "profile-export", "profile-import", "edit-cancel", "edit-save"):
            self.assertIn(f'id="{control}"', SHELL)

    def test_v13_look_tap_fire_is_product_owned_bounded_and_tic_drained(self):
        self.assertIn("maxDurationMs:300", SHELL)
        self.assertIn("slopCssPx:12", SHELL)
        self.assertIn("maxQueue:4", SHELL)
        self.assertIn("minPressBuildTics:1", SHELL)
        self.assertIn("nativeBuildTicCount", SHELL)
        self.assertIn("function installLookTapFire()", SHELL)
        self.assertIn("function drainLookTapFire(dedicatedPressed)", SHELL)
        self.assertIn("lookTapFire:lookTapFireSnapshot()", SHELL)
        self.assertIn("clearLookTapFire('edit-entry')", SHELL)
        self.assertIn("clearLookTapFire('visibility-hidden')", SHELL)
        self.assertIn("clearLookTapFire('profile-import')", SHELL)
        self.assertIn("clearLookTapFire('profile-reset')", SHELL)
        self.assertIn("if(event.target===window)clearLookTapFire('blur')", SHELL)
        self.assertNotIn("lookTapFire", (ROOT / "vendor/sfhs-mobile-controls-v1/src/runtime.ts").read_text(encoding="utf-8"))

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
