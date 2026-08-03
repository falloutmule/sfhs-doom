#!/usr/bin/env python3
"""Verify deterministic project-owned native-oracle fixtures."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct


class FixtureError(Exception):
    pass


REQUIRED_ITEM_FIELDS = {
    "path",
    "purpose",
    "originating_task",
    "generator_command",
    "size_bytes",
    "sha256",
    "spdx_identifier",
    "contains_third_party_material",
    "contains_commercial_game_data",
    "provenance_confirmed",
}
FORBIDDEN_SCRIPT_SUFFIXES = {".py", ".sh", ".c", ".h", ".cmake"}
FORBIDDEN_COMMERCIAL_BASENAMES = {"doom.wad", "doom2.wad", "tnt.wad", "plutonia.wad"}


def verify_wad(path: Path, expected_marker: bytes) -> None:
    data = path.read_bytes()
    if len(data) < 12 or data[:4] != b"PWAD":
        raise FixtureError(f"invalid PWAD header: {path}")
    count, directory_offset = struct.unpack_from("<II", data, 4)
    if count != 2 or directory_offset + count * 16 > len(data):
        raise FixtureError(f"invalid PWAD directory: {path}")
    names = []
    for index in range(count):
        offset, size, raw_name = struct.unpack_from("<II8s", data, directory_offset + index * 16)
        if offset + size > directory_offset:
            raise FixtureError(f"PWAD lump overlaps directory: {path}")
        names.append(raw_name.rstrip(b"\0"))
    if names != [b"ORCLCOM", expected_marker]:
        raise FixtureError(f"unexpected lump order: {path}")


def verify(root: Path) -> None:
    manifest_path = root / "expected/manifest.json"
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise FixtureError(f"cannot read manifest: {exc}") from exc
    if not isinstance(manifest, dict):
        raise FixtureError("fixture manifest is not an object")
    if (
        manifest.get("schema_version") != 1
        or manifest.get("fixture_set") != "sfhs-native-oracle-v1"
        or manifest.get("fixture_data_license") != "CC0-1.0"
        or manifest.get("provenance_confirmed") is not True
    ):
        raise FixtureError("wrong fixture manifest identity")
    items = manifest.get("files")
    if not isinstance(items, list) or not items:
        raise FixtureError("fixture manifest has no file entries")
    expected_paths = set()
    for item in items:
        if not isinstance(item, dict) or set(item) != REQUIRED_ITEM_FIELDS:
            raise FixtureError("incomplete fixture provenance")
        relative = item["path"]
        if not isinstance(relative, str) or not relative or Path(relative).is_absolute() or ".." in Path(relative).parts:
            raise FixtureError(f"invalid fixture path: {relative!r}")
        if relative in expected_paths:
            raise FixtureError(f"duplicate fixture path: {relative}")
        expected_paths.add(relative)
        basename = Path(relative).name.lower()
        if basename.endswith(tuple(FORBIDDEN_SCRIPT_SUFFIXES)):
            raise FixtureError(f"software script cannot be CC0 fixture data: {relative}")
        if "freedoom" in basename or basename in FORBIDDEN_COMMERCIAL_BASENAMES:
            raise FixtureError(f"forbidden game-data basename: {relative}")
        if item["originating_task"] != "DOOM-P1-060" or item["spdx_identifier"] != "CC0-1.0":
            raise FixtureError(f"incomplete fixture provenance: {relative}")
        if item["provenance_confirmed"] is not True:
            raise FixtureError(f"unconfirmed fixture provenance: {relative}")
        if item["contains_third_party_material"] is not False or item["contains_commercial_game_data"] is not False:
            raise FixtureError(f"third-party or commercial material marked CC0: {relative}")
        if not isinstance(item["purpose"], str) or not item["purpose"].strip() or not isinstance(item["generator_command"], str) or not item["generator_command"].strip():
            raise FixtureError(f"incomplete fixture provenance: {relative}")
    actual_paths = {path.relative_to(root).as_posix() for path in root.rglob("*") if path.is_file() and path.name != "manifest.json"}
    if actual_paths != expected_paths:
        raise FixtureError(f"unexpected fixture paths: {sorted(actual_paths ^ expected_paths)}")
    readme = (root / "README.md").read_text(encoding="utf-8")
    if "CC0-1.0" not in readme or "does not apply to Chocolate Doom" not in readme:
        raise FixtureError("fixture README lacks license boundary")
    if not (root / "CC0-1.0.txt").read_text(encoding="utf-8").startswith("SPDX-License-Identifier: CC0-1.0\n"):
        raise FixtureError("fixture CC0 notice is missing SPDX identifier")
    for item in items:
        path = root / item["path"]
        data = path.read_bytes()
        if len(data) != item["size_bytes"] or hashlib.sha256(data).hexdigest() != item["sha256"]:
            raise FixtureError(f"fixture hash mismatch: {item['path']}")
    if (root / "config/oracle.cfg").read_text(encoding="utf-8") != "mouse_sensitivity 5\nshow_messages 1\n":
        raise FixtureError("invalid config fixture")
    if not (root / "open-deh/oracle.deh").read_bytes().startswith(b"Patch File for DeHackEd v3.0\n"):
        raise FixtureError("invalid DeHackEd fixture")
    demo = (root / "open-demos/oracle.lmp").read_bytes()
    if len(demo) != 18 or demo[0] != 109 or demo[-1] != 0x80:
        raise FixtureError("invalid demo fixture")
    verify_wad(root / "open-pwads/order-a.wad", b"ORCLA")
    verify_wad(root / "open-pwads/order-b.wad", b"ORCLB")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    args = parser.parse_args()
    try:
        verify(args.root.resolve())
    except (FixtureError, OSError, UnicodeError, ValueError, struct.error) as exc:
        print(f"ORACLE_FIXTURES INVALID: {exc}")
        return 1
    print(f"ORACLE_FIXTURES PASS: {args.root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
