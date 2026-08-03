#!/usr/bin/env python3
"""Generate tiny project-owned deterministic native-oracle fixtures."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import struct


README = """# SFHS Doom native-oracle fixtures

The fixture data under this directory was created entirely by SFHS Doom for DOOM-P1-060.
The identified fixture data and metadata are dedicated under SPDX license `CC0-1.0`.
This applies only to these project-created config, PWAD, DeHackEd, demo, expected,
README, and license-notice files. It does not apply to Chocolate Doom, Freedoom,
commercial Doom material, third-party material, Python/shell/test/build scripts, or
the SFHS Doom project as a whole. No fixture contains copied or extracted game data.

Complete path, purpose, originating task, generator command, byte size, SHA-256,
license, and provenance are recorded in `expected/manifest.json`.
"""

CC0_NOTICE = """SPDX-License-Identifier: CC0-1.0

This CC0-1.0 dedication applies only to the project-created fixture data and
metadata identified by tests/fixtures/expected/manifest.json. It does not apply
to Chocolate Doom, Freedoom, commercial Doom material, third-party material,
software scripts, the overall project, or any file not listed in that manifest.

The CC0-1.0 legal code is available from Creative Commons:
https://creativecommons.org/publicdomain/zero/1.0/
"""

METADATA = {
    "config/oracle.cfg": "Deterministic configuration input for native-oracle startup.",
    "open-deh/oracle.deh": "Minimal DeHackEd parser input for the native-oracle probe.",
    "open-demos/oracle.lmp": "Project-recorded deterministic demo input containing only generated commands.",
    "open-pwads/order-a.wad": "Minimal project-created PWAD with a deterministic first lump order.",
    "open-pwads/order-b.wad": "Minimal project-created PWAD with a deterministic second lump order.",
    "README.md": "License and provenance notice for the project-created fixture set.",
    "CC0-1.0.txt": "SPDX license notice for the identified project-created fixture set.",
}


def write_wad(path: Path, marker: bytes) -> None:
    lumps = [(b"ORCLCOM", b"SFHS-ORACLE-COMMON\0"), (marker, b"SFHS-ORACLE-ORDER\0")]
    payload = bytearray()
    directory = bytearray()
    offset = 12
    for name, data in lumps:
        payload.extend(data)
        directory.extend(struct.pack("<II8s", offset, len(data), name.ljust(8, b"\0")[:8]))
        offset += len(data)
    path.write_bytes(b"PWAD" + struct.pack("<II", len(lumps), offset) + payload + directory)


def build_files(root: Path) -> list[Path]:
    files = {
        Path("config/oracle.cfg"): b"mouse_sensitivity 5\nshow_messages 1\n",
        Path("open-deh/oracle.deh"): b"Patch File for DeHackEd v3.0\n",
        Path("open-demos/oracle.lmp"): bytes([109, 2, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0x80]),
        Path("README.md"): README.encode("utf-8"),
        Path("CC0-1.0.txt"): CC0_NOTICE.encode("utf-8"),
    }
    for relative, data in files.items():
        target = root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    for relative, marker in ((Path("open-pwads/order-a.wad"), b"ORCLA"), (Path("open-pwads/order-b.wad"), b"ORCLB")):
        target = root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        write_wad(target, marker)
        files[relative] = target.read_bytes()
    expected = []
    for relative in sorted(files):
        data = (root / relative).read_bytes()
        expected.append({
            "path": relative.as_posix(),
            "purpose": METADATA[relative.as_posix()],
            "originating_task": "DOOM-P1-060",
            "generator_command": "python tools/generate-oracle-fixtures.py --output <fixture-output>",
            "size_bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
            "spdx_identifier": "CC0-1.0",
            "contains_third_party_material": False,
            "contains_commercial_game_data": False,
            "provenance_confirmed": True,
        })
    expected_path = root / "expected/manifest.json"
    expected_path.parent.mkdir(parents=True, exist_ok=True)
    expected_path.write_text(json.dumps({
        "schema_version": 1,
        "fixture_set": "sfhs-native-oracle-v1",
        "fixture_data_license": "CC0-1.0",
        "provenance_confirmed": True,
        "files": expected,
    }, indent=2) + "\n", encoding="utf-8")
    return [root / item["path"] for item in expected]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    root = args.output.resolve()
    root.mkdir(parents=True, exist_ok=True)
    build_files(root)
    print(f"GENERATE_ORACLE_FIXTURES=PASS output={root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
