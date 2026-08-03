"""Regression tests for the deterministic project-owned oracle fixtures."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
GENERATOR = ROOT / "tools/generate-oracle-fixtures.py"
VERIFIER = ROOT / "tools/verify-oracle-fixtures.py"
CANONICAL = ROOT / "tests/fixtures"


def fixture_hashes(root: Path) -> dict[str, str]:
    return {
        path.relative_to(root).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in sorted(root.rglob("*"))
        if path.is_file() and path.name != "manifest.json"
    }


def run_verifier(root: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(VERIFIER), str(root)],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )


class OracleFixtureTests(unittest.TestCase):
    def generate(self, output: Path) -> None:
        result = subprocess.run(
            [sys.executable, str(GENERATOR), "--output", str(output)],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_canonical_fixture_set_verifies(self) -> None:
        result = run_verifier(CANONICAL)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_generation_is_deterministic_and_verifies(self) -> None:
        with tempfile.TemporaryDirectory(prefix="sfhs-oracle-") as temporary:
            root = Path(temporary)
            first = root / "first"
            second = root / "second"
            self.generate(first)
            self.generate(second)
            for fixture_root in (first, second):
                result = run_verifier(fixture_root)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertEqual(fixture_hashes(first), fixture_hashes(second))
            self.assertEqual(fixture_hashes(first), fixture_hashes(CANONICAL))

    def test_tampered_wad_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory(prefix="sfhs-oracle-tampered-") as temporary:
            fixture_root = Path(temporary) / "fixtures"
            self.generate(fixture_root)
            wad = fixture_root / "open-pwads/order-a.wad"
            wad.write_bytes(wad.read_bytes()[:-1] + b"X")
            result = run_verifier(fixture_root)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("INVALID", result.stdout)

    def test_incomplete_provenance_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory(prefix="sfhs-oracle-provenance-") as temporary:
            fixture_root = Path(temporary) / "fixtures"
            self.generate(fixture_root)
            manifest_path = fixture_root / "expected/manifest.json"
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            del manifest["files"][0]["spdx_identifier"]
            manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
            result = run_verifier(fixture_root)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("INVALID", result.stdout)

    def test_forbidden_game_data_and_scripts_are_rejected_as_cc0(self) -> None:
        with tempfile.TemporaryDirectory(prefix="sfhs-oracle-boundary-") as temporary:
            fixture_root = Path(temporary) / "fixtures"
            self.generate(fixture_root)
            manifest_path = fixture_root / "expected/manifest.json"
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            for forbidden_name in ("freedoom2.wad", "doom2.wad", "oracle.py"):
                candidate = Path(temporary) / forbidden_name
                shutil.copyfile(fixture_root / "config/oracle.cfg", candidate)
                item = manifest["files"][1]
                old_path = fixture_root / item["path"]
                old_path.unlink()
                item["path"] = forbidden_name
                manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
                result = run_verifier(fixture_root)
                self.assertNotEqual(result.returncode, 0, forbidden_name)
                self.assertIn("INVALID", result.stdout)
                candidate.unlink()
                item["path"] = "config/oracle.cfg"
                (fixture_root / item["path"]).write_bytes(b"mouse_sensitivity 5\nshow_messages 1\n")

    def test_committed_fixture_provenance_is_explicit_and_scripts_are_not_cc0(self) -> None:
        manifest = json.loads((CANONICAL / "expected/manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["fixture_data_license"], "CC0-1.0")
        for item in manifest["files"]:
            self.assertEqual(item["spdx_identifier"], "CC0-1.0")
            self.assertEqual(item["originating_task"], "DOOM-P1-060")
            self.assertTrue(item["purpose"])
            self.assertTrue(item["generator_command"])
            self.assertTrue(item["provenance_confirmed"])
            self.assertFalse(item["contains_third_party_material"])
            self.assertFalse(item["contains_commercial_game_data"])
            self.assertNotIn("freedoom", Path(item["path"]).name.lower())
            self.assertNotIn(Path(item["path"]).name.lower(), {"doom.wad", "doom2.wad", "tnt.wad", "plutonia.wad"})
            self.assertFalse(Path(item["path"]).suffix.lower() in {".py", ".sh", ".c", ".h", ".cmake"})
        for script in (GENERATOR, VERIFIER, ROOT / "tests/test_oracle_fixtures.py"):
            source = script.read_text(encoding="utf-8").lstrip()
            self.assertFalse(source.startswith("SPDX-License-Identifier: CC0-1.0"))

    def test_native_load_probe_evidence_is_present(self) -> None:
        evidence_root = ROOT / "evidence/task-runs/P01-DOOM-P1-060/native"
        for name in ("order-a", "order-b", "demo"):
            stdout = evidence_root / f"{name}.stdout"
            stderr = evidence_root / f"{name}.stderr"
            self.assertTrue(stdout.is_file(), stdout)
            self.assertTrue(stderr.is_file(), stderr)
            self.assertIn("DEHACKED", stdout.read_text(encoding="utf-8"))
            self.assertEqual(stderr.read_text(encoding="utf-8"), "")


if __name__ == "__main__":
    unittest.main()
