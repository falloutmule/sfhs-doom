import hashlib
from pathlib import Path
import subprocess
import unittest


ROOT = Path(__file__).resolve().parents[1]
WSL_ROOT = "/mnt/c/Users/fallo/Documents/Single-File-Html/sfhs-doom"


class NativeSmokeTests(unittest.TestCase):
    def test_both_smoke_results_are_gameplay_evidence(self):
        hashes = []
        for edition, detection in (("phase1", "Freedoom: Phase 1"), ("phase2", "Freedoom: Phase 2")):
            evidence = ROOT / f"evidence/task-runs/P01-DOOM-P1-050/{edition}"
            screenshot = ROOT / f"evidence/screenshots/P01/P1-050/{edition}-gameplay.png"
            self.assertTrue(screenshot.is_file())
            self.assertGreater(screenshot.stat().st_size, 10_000)
            self.assertIn(detection, (evidence / "game.stdout.txt").read_text(encoding="utf-8"))
            result = (evidence / "result.txt").read_text(encoding="utf-8")
            self.assertIn("process_healthy_at_capture=true", result)
            self.assertIn("real_mixer_setup_observed=true", result)
            hashes.append(hashlib.sha256(screenshot.read_bytes()).hexdigest())
        self.assertNotEqual(hashes[0], hashes[1])

    def test_runtime_writes_are_isolated(self):
        for edition in ("phase1", "phase2"):
            writes = (ROOT / f"evidence/task-runs/P01-DOOM-P1-050/{edition}/runtime-writes.txt").read_text(encoding="utf-8").splitlines()
            self.assertTrue(writes)
            self.assertFalse(any(Path(item).is_absolute() or ".." in Path(item).parts for item in writes))

    def test_invalid_edition_is_rejected(self):
        command = f"cd {WSL_ROOT} && bash tools/run-native-smoke.sh --iwad invalid"
        result = subprocess.run(["wsl.exe", "bash", "-lc", command], capture_output=True, text=True, check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("unknown IWAD edition", result.stderr)

    def test_scripts_use_explicit_release_iwad_warp_skill_and_paths(self):
        text = (ROOT / "tools/capture-native-frame.sh").read_text(encoding="utf-8")
        for required in ("build/native/release/src/chocolate-doom", "-iwad", "-warp", "-skill", "-config", "-savedir", "SDL_AUDIODRIVER=dummy"):
            self.assertIn(required, text)

    def test_no_commercial_data_name_or_remote_action(self):
        text = ((ROOT / "tools/run-native-smoke.sh").read_text(encoding="utf-8") + (ROOT / "tools/capture-native-frame.sh").read_text(encoding="utf-8")).lower()
        commercial_names = {"doom.wad", "doom2.wad", "tnt.wad", "plutonia.wad"}
        wad_tokens = {token.strip("'\"()[]") for token in text.split() if token.lower().endswith(".wad")}
        self.assertFalse(commercial_names & wad_tokens)
        for forbidden in ("curl ", "wget ", "git fetch"):
            self.assertNotIn(forbidden, text)


if __name__ == "__main__":
    unittest.main()
