#!/usr/bin/env python3
"""Compare native and browser MEMFS Oracle output without normalization."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


FRAME_NAMES = ["frame-001.bin", "frame-035.bin", "frame-070.bin", "frame-140.bin"]


def load_states(path: Path) -> list[dict]:
    return [json.loads(line) for line in (path / "state.jsonl").read_text(encoding="utf-8").splitlines()]


def signature(path: Path) -> tuple[list[dict], dict[str, str]]:
    states = load_states(path)
    frames = {}
    for name in FRAME_NAMES:
        data = (path / name).read_bytes()
        if len(data) != 320 * 200:
            raise ValueError(f"{path}/{name} is not a raw 320x200 indexed frame")
        frames[name] = hashlib.sha256(data).hexdigest()
    return states, frames


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("run_set", type=Path)
    args = parser.parse_args()
    root = args.run_set.resolve()
    failures: list[str] = []
    try:
        native = signature(root / "native/baseline/run-1")
        for index in range(1, 6):
            if signature(root / f"native/baseline/run-{index}") != native:
                failures.append(f"native baseline mismatch run-{index}")
        for browser, count in (("chromium", 5), ("firefox", 3)):
            first = signature(root / f"wasm-{browser}/baseline/run-1")
            for index in range(1, count + 1):
                current = signature(root / f"wasm-{browser}/baseline/run-{index}")
                if current != first:
                    failures.append(f"{browser} repeat mismatch run-{index}")
                if current != native:
                    failures.append(f"{browser} versus native mismatch run-{index}")
        native_deh = signature(root / "native/deh-effect")
        if native_deh[0] == native[0] or native_deh[1] == native[1]:
            failures.append("native DeHackEd effect did not change the intended output")
        for browser in ("chromium", "firefox"):
            wasm_deh = signature(root / f"wasm-{browser}/deh-effect")
            if wasm_deh[0] != native_deh[0] or wasm_deh[1] != native_deh[1]:
                failures.append(f"{browser} DeHackEd output differs from native")
            if [item.get("maxammo0") for item in load_states(root / f"wasm-{browser}/deh-effect")] != [199] * 5:
                failures.append(f"{browser} DeHackEd maxammo0 effect missing")
        if [item.get("maxammo0") for item in load_states(root / "native/baseline/run-1")] != [200] * 5:
            failures.append("native baseline maxammo0 is not 200")
    except (OSError, UnicodeError, json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
        failures.append(f"comparison input error: {exc}")
    summary = {
        "schema_version": 1,
        "task": "DOOM-P2-085",
        "status": "PASS" if not failures else "FAIL",
        "state_checkpoints": [0, 1, 35, 70, 140],
        "frame_checkpoints": [1, 35, 70, 140],
        "normalization": "none",
        "pwad_order_claim": "excluded",
        "failures": failures,
    }
    root.mkdir(parents=True, exist_ok=True)
    (root / "comparison.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(f"NATIVE_WASM_COMPARE={summary['status']} run_set={root}")
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
