import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
LOCK = json.loads((ROOT / "tools/freedoom-lock.json").read_text(encoding="utf-8"))
CACHE = ROOT / "vendor-cache/freedoom/0.13.0"
WSL_ROOT = "/mnt/c/Users/fallo/Documents/Single-File-Html/sfhs-doom"
COMMERCIAL_IWAD_BASENAMES = {"doom.wad", "doom2.wad", "tnt.wad", "plutonia.wad"}


def is_commercial_iwad_basename(candidate):
    return Path(candidate).name.lower() in COMMERCIAL_IWAD_BASENAMES


class FetchFreedoomTests(unittest.TestCase):
    def test_release_is_stable_and_official(self):
        release = LOCK["release"]
        self.assertEqual(release["tag"], "v0.13.0")
        self.assertFalse(release["draft"])
        self.assertFalse(release["prerelease"])
        self.assertEqual(release["commit_sha"], "cfb8644b1a8dc7d7d2177e6a892ccaa2922bdaae")
        self.assertTrue(LOCK["archive"]["url"].startswith("https://github.com/freedoom/freedoom/releases/download/"))

    def test_canonical_cached_files_match_lock(self):
        archive = CACHE / LOCK["archive"]["name"]
        self.assertEqual(archive.stat().st_size, LOCK["archive"]["size_bytes"])
        self.assertEqual(hashlib.sha256(archive.read_bytes()).hexdigest(), LOCK["archive"]["sha256"])
        for wad in LOCK["wads"]:
            path = CACHE / "data" / wad["name"]
            self.assertEqual(path.stat().st_size, wad["size_bytes"])
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), wad["sha256"])

    def test_verify_only_passes(self):
        result = self.run_verify()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("FREEDOOM_FETCH=PASS mode=verify", result.stdout)

    def run_verify(self):
        command = f"cd {WSL_ROOT} && bash tools/fetch-freedoom.sh --verify-only"
        return subprocess.run(["wsl.exe", "bash", "-lc", command], capture_output=True, text=True, check=False)

    def cache_snapshot(self):
        paths = [CACHE / LOCK["archive"]["name"], CACHE / "data" / "COPYING.txt"]
        paths.extend(CACHE / "data" / wad["name"] for wad in LOCK["wads"])
        return {path: (path.read_bytes(), path.stat().st_mtime_ns) for path in paths}

    def test_verify_only_is_read_only_for_manifests_cache_and_worktree(self):
        manifests = [ROOT / "evidence/manifests/P01" / f"{edition}-v0.13.0.json" for edition in ("freedoom-phase1", "freedoom-phase2")]
        before_manifests = {path: path.read_bytes() for path in manifests}
        before_cache = self.cache_snapshot()
        before_status = subprocess.check_output(["git", "status", "--porcelain=v1"], cwd=ROOT, text=True)
        result = self.run_verify()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(before_manifests, {path: path.read_bytes() for path in manifests})
        self.assertEqual(before_cache, self.cache_snapshot())
        after_status = subprocess.check_output(["git", "status", "--porcelain=v1"], cwd=ROOT, text=True)
        self.assertEqual(before_status, after_status)

    def test_tampered_copy_is_rejected(self):
        wad = LOCK["wads"][0]
        source = CACHE / "data" / wad["name"]
        with tempfile.TemporaryDirectory(prefix="freedoom-tamper-", dir="C:/tmp") as directory:
            target = Path(directory) / wad["name"]
            shutil.copyfile(source, target)
            with target.open("r+b") as stream:
                first = stream.read(1)
                stream.seek(0)
                stream.write(bytes([first[0] ^ 0x01]))
            wsl_path = "/mnt/c/" + target.as_posix()[3:]
            command = f"cd {WSL_ROOT} && bash tools/fetch-freedoom.sh --verify-file {wsl_path} {wad['sha256']}"
            result = subprocess.run(["wsl.exe", "bash", "-lc", command], capture_output=True, text=True, check=False)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("sha256 mismatch", result.stderr)

    def test_tampered_archive_is_rejected_without_manifest_repair(self):
        archive = CACHE / LOCK["archive"]["name"]
        manifests = [ROOT / "evidence/manifests/P01" / f"{edition}-v0.13.0.json" for edition in ("freedoom-phase1", "freedoom-phase2")]
        before = {path: path.read_bytes() for path in manifests}
        with tempfile.TemporaryDirectory(prefix="freedoom-archive-tamper-", dir="C:/tmp") as directory:
            target = Path(directory) / archive.name
            shutil.copyfile(archive, target)
            with target.open("r+b") as stream:
                first = stream.read(1)
                stream.seek(0)
                stream.write(bytes([first[0] ^ 0x01]))
            wsl_path = "/mnt/c/" + target.as_posix()[3:]
            command = f"cd {WSL_ROOT} && bash tools/fetch-freedoom.sh --verify-file {wsl_path} {LOCK['archive']['sha256']}"
            result = subprocess.run(["wsl.exe", "bash", "-lc", command], capture_output=True, text=True, check=False)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("sha256 mismatch", result.stderr)
        self.assertEqual(before, {path: path.read_bytes() for path in manifests})

    def test_freedoom_basenames_are_accepted(self):
        self.assertFalse(is_commercial_iwad_basename("freedoom1.wad"))
        self.assertFalse(is_commercial_iwad_basename("freedoom2.wad"))

    def test_actual_doom2_basename_is_rejected(self):
        self.assertTrue(is_commercial_iwad_basename("doom2.wad"))
        self.assertTrue(is_commercial_iwad_basename("C:/owned/doom2.wad"))
        self.assertFalse(is_commercial_iwad_basename("my-doom2.wad.backup"))

    def test_no_wad_or_archive_is_tracked(self):
        result = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True)
        tracked = [line.lower() for line in result.stdout.splitlines()]
        self.assertFalse(any(line.endswith((".wad", ".zip")) for line in tracked))

    def test_lock_contains_only_open_freedoom_editions(self):
        self.assertEqual([item["name"] for item in LOCK["wads"]], ["freedoom1.wad", "freedoom2.wad"])
        self.assertEqual(LOCK["license"]["spdx"], "BSD-3-Clause")


if __name__ == "__main__":
    unittest.main()
