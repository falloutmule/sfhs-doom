import json
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SERVER = ROOT / "tools" / "serve-wasm.py"


class WasmServerTests(unittest.TestCase):
    def test_loopback_routes_mime_traversal_and_clean_shutdown(self):
        with tempfile.TemporaryDirectory() as temp:
            temp_path = Path(temp)
            ready = temp_path / "ready.json"
            log = temp_path / "server.jsonl"
            shutdown = temp_path / "shutdown"
            process = subprocess.Popen(
                [sys.executable, str(SERVER), "--port", "0", "--ready-file", str(ready), "--log-file", str(log), "--shutdown-file", str(shutdown)],
                cwd=ROOT,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            try:
                deadline = time.time() + 10
                while time.time() < deadline and not ready.exists():
                    time.sleep(0.05)
                self.assertTrue(ready.exists())
                address = json.loads(ready.read_text())
                base = f"http://127.0.0.1:{address['port']}"
                health = urllib.request.urlopen(base + "/health", timeout=3)
                self.assertEqual(health.status, 200)
                wasm = urllib.request.urlopen(base + "/phase1/src/chocolate-doom.wasm", timeout=3)
                self.assertEqual(wasm.headers.get_content_type(), "application/wasm")
                with self.assertRaises(urllib.error.HTTPError) as traversal:
                    urllib.request.urlopen(base + "/phase1/src/../CMakeCache.txt", timeout=3)
                self.assertEqual(traversal.exception.code, 403)
            finally:
                shutdown.write_text("stop\n")
                process.wait(timeout=10)
                if process.stdout:
                    process.stdout.close()
                if process.stderr:
                    process.stderr.close()
            self.assertEqual(process.returncode, 0)
            records = [json.loads(line) for line in log.read_text().splitlines()]
            self.assertTrue(any(record.get("event") == "shutdown" and record.get("clean") for record in records))


if __name__ == "__main__":
    unittest.main()
