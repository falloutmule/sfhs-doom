#!/usr/bin/env python3
"""Compare repeated, PWAD-order, and DeHackEd native-oracle runs."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def load_run(path: Path) -> tuple[dict, list[dict]]:
    result = json.loads((path / "result.json").read_text(encoding="utf-8"))
    states = [json.loads(line) for line in (path / "state.jsonl").read_text(encoding="utf-8").splitlines()]
    return result, states


def signature(path: Path) -> tuple[list[dict], list[str]]:
    result, states = load_run(path)
    return states, [frame["sha256"] for frame in result["frames"]]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("run_set", type=Path)
    args = parser.parse_args()
    failures: list[str] = []

    baseline_paths = [args.run_set / f"baseline/run-{index}" for index in range(1, 6)]
    try:
        baseline = signature(baseline_paths[0])
        for path in baseline_paths:
            result, _ = load_run(path)
            if result.get("status") != "PASS" or signature(path) != baseline:
                failures.append(f"baseline mismatch: {path}")

        for name in ("order-ab", "order-ba"):
            path = args.run_set / name
            result, _ = load_run(path)
            if result.get("status") != "PASS" or signature(path) != baseline:
                failures.append(f"PWAD-order regression: {name}")

        effect_path = args.run_set / "deh-effect"
        effect_result, effect_states = load_run(effect_path)
        baseline_states, baseline_frames = baseline
        effect_frames = [frame["sha256"] for frame in effect_result["frames"]]
        if effect_result.get("status") != "PASS":
            failures.append("DeHackEd effect run failed")
        if effect_frames == baseline_frames:
            failures.append("DeHackEd max-ammo effect was not visible in the logical framebuffer")
        if [state.get("maxammo0") for state in baseline_states] != [200] * 5:
            failures.append("unexpected baseline maxammo0")
        if [state.get("maxammo0") for state in effect_states] != [199] * 5:
            failures.append("DeHackEd maxammo0 effect missing")
        stripped_baseline = [{k: v for k, v in state.items() if k != "maxammo0"} for state in baseline_states]
        stripped_effect = [{k: v for k, v in state.items() if k != "maxammo0"} for state in effect_states]
        if stripped_effect != stripped_baseline:
            failures.append("DeHackEd effect changed unrelated state")

        off = json.loads((args.run_set / "instrumentation-off/result.json").read_text(encoding="utf-8"))
        if off.get("status") != "PASS" or off.get("end_tic") != 140 or off.get("oracle_artifacts"):
            failures.append("instrumentation-off regression")
    except (OSError, UnicodeError, json.JSONDecodeError, KeyError, TypeError) as exc:
        failures.append(f"comparison input error: {exc}")

    summary = {
        "schema_version": 1,
        "task": "DOOM-P1-080",
        "status": "PASS" if not failures else "FAIL",
        "baseline_repetitions": 5,
        "state_checkpoints": [0, 1, 35, 70, 140],
        "frame_checkpoints": [1, 35, 70, 140],
        "failures": failures,
    }
    (args.run_set / "comparison.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(f"NATIVE_ORACLE_COMPARE={summary['status']} run_set={args.run_set}")
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
