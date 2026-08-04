#!/usr/bin/env python3
"""Regression tests for the read-only P01 native-oracle phase gate."""

from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import unittest
from unittest import mock


ROOT = Path(__file__).resolve().parents[1]
GATE = ROOT / "tools/verify-p1-gate.py"
MANIFEST = ROOT / "evidence/manifests/P01/native-oracle-phase-manifest.json"
BASE_COMMIT = "804ddb9ae855b65aeec922cd5f531c672b9b2c5f"

GATE_SPEC = importlib.util.spec_from_file_location("sfhs_verify_p1_gate", GATE)
assert GATE_SPEC is not None and GATE_SPEC.loader is not None
GATE_MODULE = importlib.util.module_from_spec(GATE_SPEC)
GATE_SPEC.loader.exec_module(GATE_MODULE)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class P1GateTests(unittest.TestCase):
    def run_gate(self, manifest: Path = MANIFEST) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(GATE), "--manifest", str(manifest)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
            timeout=30,
        )

    def assert_manifest_rejected(self, mutate, reason: str) -> None:
        data = json.loads(MANIFEST.read_text(encoding="utf-8"))
        mutate(data)
        with mock.patch.object(GATE_MODULE, "load_json", return_value=data):
            with self.assertRaisesRegex(GATE_MODULE.GateError, reason):
                GATE_MODULE.verify_manifest(MANIFEST)

    def test_gate_passes_and_is_read_only(self) -> None:
        watched = [
            MANIFEST,
            ROOT / "evidence/task-runs/P01-DOOM-P1-080/oracle-run-set/comparison.json",
            ROOT / "evidence/phase-gates/P01/SOL_GATE_PACKET.md",
            ROOT / "evidence/reports/P01/native-oracle-summary.json",
        ]
        before_hashes = {path: sha256(path) for path in watched}
        before_status = subprocess.run(
            ["git", "status", "--porcelain=v1", "--untracked-files=all"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
        ).stdout
        result = self.run_gate()
        after_status = subprocess.run(
            ["git", "status", "--porcelain=v1", "--untracked-files=all"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
        ).stdout
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("SFHS_DOOM_P1_NATIVE_ORACLE_GATE=PASS", result.stdout)
        self.assertEqual(before_hashes, {path: sha256(path) for path in watched})
        self.assertEqual(before_status, after_status)

    def test_tampered_artifact_hash_is_rejected(self) -> None:
        self.assert_manifest_rejected(
            lambda data: data["artifacts"][0].__setitem__("sha256", "0" * 64),
            "artifact identity mismatch",
        )

    def test_missing_artifact_is_rejected(self) -> None:
        def mutate(data: dict) -> None:
            data["artifacts"][0]["path"] = "evidence/does-not-exist"

        self.assert_manifest_rejected(mutate, "artifact identity mismatch")

    def test_duplicate_task_identity_is_rejected(self) -> None:
        def mutate(data: dict) -> None:
            data["tasks"][1]["id"] = data["tasks"][0]["id"]

        self.assert_manifest_rejected(mutate, "task sequence mismatch")

    def test_builder_commit_sequence_is_exact_and_p1_090_is_absent(self) -> None:
        result = subprocess.run(
            ["git", "log", "--format=%s", f"{BASE_COMMIT}..HEAD"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
        subjects = result.stdout.splitlines()
        for number in ("000", "010", "020", "030", "040", "050", "060", "070", "080"):
            self.assertEqual(sum(subject.startswith(f"DOOM-P1-{number} ") for subject in subjects), 1)
        self.assertFalse(any(subject.startswith("DOOM-P1-090 ") for subject in subjects))

    def test_sol_packet_preserves_independent_review_boundary(self) -> None:
        packet = (ROOT / "evidence/phase-gates/P01/SOL_GATE_PACKET.md").read_text(encoding="utf-8")
        self.assertIn("Candidate commit: SELF", packet)
        self.assertIn("DOOM-P1-090", packet)
        self.assertIn("independent", packet.lower())

    def test_verify_path_has_no_network_or_remote_mutation(self) -> None:
        source = GATE.read_text(encoding="utf-8")
        for forbidden in ("git push", "git fetch", "git pull", "curl ", "wget ", "Invoke-WebRequest"):
            self.assertNotIn(forbidden, source)
        self.assertIn("if args.generate:", source)
        self.assertIn("generate_manifest(manifest)", source)


if __name__ == "__main__":
    unittest.main()
