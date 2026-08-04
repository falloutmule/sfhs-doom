import json
from pathlib import Path
import subprocess
import sys
import unittest


ROOT = Path(__file__).resolve().parents[1]
MANIFESTS = [
    ROOT / 'evidence/manifests/P02/phase1-debug.json',
    ROOT / 'evidence/manifests/P02/phase2-debug.json',
    ROOT / 'evidence/manifests/P02/phase2-oracle.json',
]


class BuildWasmTests(unittest.TestCase):
    def test_each_manifest_validates_and_has_separate_outputs(self):
        for manifest in MANIFESTS:
            result = subprocess.run(
                [sys.executable, str(ROOT / 'tools/validate_artifact_manifest.py'), str(manifest)],
                cwd=ROOT,
                text=True,
                capture_output=True,
                check=False,
            )
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            data = json.loads(manifest.read_text(encoding='utf-8'))
            paths = {item['path'] for item in data['artifacts']}
            self.assertTrue(any(path.endswith('.js') for path in paths))
            self.assertTrue(any(path.endswith('.wasm') for path in paths))
            self.assertTrue(any(path.endswith('.wad') for path in paths))
            self.assertNotIn('SINGLE_FILE', '\n'.join(data['notes']))

    def test_build_contract_is_multi_file_and_local_only(self):
        script = (ROOT / 'tools/build-wasm.sh').read_text(encoding='utf-8')
        shell = (ROOT / 'web/p2/shell.html').read_text(encoding='utf-8')
        post = (ROOT / 'web/p2/post.js').read_text(encoding='utf-8')
        self.assertIn('phase1-debug', script)
        self.assertIn('phase2-debug', script)
        self.assertIn('phase2-oracle', script)
        self.assertIn('SINGLE_FILE', script)
        self.assertIn('{{ENGINE_JS}}', shell)
        self.assertIn('singleFile: false', post)
        self.assertIn('externalRequests: false', post)
        self.assertNotIn('git push', script)
        self.assertNotIn('git fetch', script)

    def test_adapter_does_not_request_gameplay_or_renderer_source_edits(self):
        script = (ROOT / 'tools/build-wasm.sh').read_text(encoding='utf-8')
        self.assertNotIn('src/doom/', script)
        for source in ('i_timer.c', 'i_system.c', 'i_video.c', 'i_input.c', 'i_sound.c', 'i_sdlsound.c', 'i_sdlmusic.c'):
            self.assertNotIn(source, script)

    def test_repeatability_and_native_control_evidence(self):
        repeat = (ROOT / 'evidence/task-runs/P02-DOOM-P2-050/run-2/reproducibility.txt').read_text(encoding='utf-8')
        control = (ROOT / 'evidence/task-runs/P02-DOOM-P2-050/native-control/result.txt').read_text(encoding='utf-8')
        self.assertIn('WASM_REPRODUCIBILITY=PASS', repeat)
        self.assertIn('P2_NATIVE_CONTROL=PASS', control)


if __name__ == '__main__':
    unittest.main()
