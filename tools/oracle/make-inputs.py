#!/usr/bin/env python3
"""Create deterministic ignored runtime inputs for the native oracle."""

from __future__ import annotations

import argparse
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)

    header = bytes([109, 2, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0])
    demo = header + bytes(140 * 4) + b"\x80"
    (args.output / "oracle-140.lmp").write_bytes(demo)
    (args.output / "oracle-effect.deh").write_text(
        "Patch File for DeHackEd v3.0\n\nAmmo 0\nMax ammo = 199\nPer ammo = 10\n",
        encoding="ascii",
    )
    (args.output / "extra.cfg").write_text(
        "show_endoom                   0\n",
        encoding="ascii",
    )
    print(f"ORACLE_INPUTS=PASS output={args.output} demo_tics=140")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
