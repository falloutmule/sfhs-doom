from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class AudioProbeContractTests(unittest.TestCase):
    def test_audio_mode_uses_real_engine_audio_and_keeps_music_explicit(self):
        pre = (ROOT / "web/p2/pre.js").read_text(encoding="utf-8")
        self.assertIn("audioMode", pre)
        self.assertIn("noInitialRun: audioMode", pre)
        self.assertIn("'-nomusic'", pre)
        self.assertIn("'-nosound', '-nomusic'", pre)
        self.assertNotIn("AudioBuffer", pre)

    def test_start_control_is_user_gesture_boundary(self):
        shell = (ROOT / "web/p2/shell.html").read_text(encoding="utf-8")
        post = (ROOT / "web/p2/post.js").read_text(encoding="utf-8")
        self.assertIn('id="start-doom"', shell)
        self.assertIn("start.onclick", post)
        self.assertIn("Module.callMain(window.Module.arguments)", post)
        self.assertNotIn("ccall('main'", post)
        self.assertIn("context.resume()", post)
        self.assertNotIn("resumeMainLoop", post)

    def test_probe_observes_existing_sdl_callback_without_synthetic_audio(self):
        probe = (ROOT / "web/p2/audio-probe.js").read_text(encoding="utf-8")
        post = (ROOT / "web/p2/post.js").read_text(encoding="utf-8")
        self.assertIn("existing SDL2 WebAudio ScriptProcessorNode", probe)
        self.assertIn("onaudioprocess", post)
        self.assertIn("getChannelData", post)
        for forbidden in ("createOscillator", "createBufferSource", "new Audio(", "AudioBuffer"):
            self.assertNotIn(forbidden, probe)
            self.assertNotIn(forbidden, post)


if __name__ == "__main__":
    unittest.main()
