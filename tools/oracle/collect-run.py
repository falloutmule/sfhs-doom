#!/usr/bin/env python3
"""Validate and bind one deterministic native-oracle process run."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess


EXPECTED_STATE_TICS = [0, 1, 35, 70, 140]
EXPECTED_FRAME_TICS = [1, 35, 70, 140]
TIMED_RE = re.compile(r"timed\s+(\d+)\s+gametics\s+in\s+(\d+)\s+realtics", re.IGNORECASE)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], text=True).strip()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--run-dir", type=Path, required=True)
    parser.add_argument("--binary", type=Path, required=True)
    parser.add_argument("--demo", type=Path, required=True)
    parser.add_argument("--stdout", type=Path, required=True)
    parser.add_argument("--stderr", type=Path, required=True)
    parser.add_argument("--scenario", required=True)
    parser.add_argument("--exit-code", type=int, required=True)
    parser.add_argument("--command", required=True)
    args = parser.parse_args()

    root = Path.cwd().resolve()
    state_path = args.run_dir / "state.jsonl"
    failures: list[str] = []
    try:
        states = [json.loads(line) for line in state_path.read_text(encoding="utf-8").splitlines()]
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        states = []
        failures.append(f"state unreadable: {exc}")
    if [record.get("tic") for record in states] != EXPECTED_STATE_TICS:
        failures.append("wrong state checkpoint sequence")
    if not states or states[-1].get("final") is not True:
        failures.append("missing final state checkpoint")

    frames = []
    for tic in EXPECTED_FRAME_TICS:
        path = args.run_dir / f"frame-{tic:03d}.bin"
        if not path.is_file() or path.stat().st_size != 320 * 200:
            failures.append(f"missing or invalid frame {tic}")
            continue
        frames.append({"tic": tic, "size_bytes": path.stat().st_size, "sha256": digest(path)})

    stdout = args.stdout.read_text(encoding="utf-8", errors="replace") if args.stdout.is_file() else ""
    timed = TIMED_RE.search(stdout)
    end_tic = int(timed.group(1)) if timed else None
    real_tics = int(timed.group(2)) if timed else None
    if args.exit_code != 255:
        failures.append(f"unexpected exit {args.exit_code}")
    if end_tic != 140:
        failures.append(f"unexpected timedemo end tic {end_tic}")

    binary = args.binary.resolve()
    build = {
        "schema_version": 1,
        "task": "DOOM-P1-080",
        "source_commit": git("rev-parse", "HEAD"),
        "upstream_tag": "chocolate-doom-3.1.1",
        "upstream_sha": "410d96855b5df5410ff591a90efeafa889119224",
        "configuration": "Oracle",
        "sfhs_oracle_test": True,
        "binary": {
            "path": binary.relative_to(root).as_posix(),
            "size_bytes": binary.stat().st_size,
            "sha256": digest(binary),
        },
        "command": args.command,
    }
    (args.run_dir / "build.json").write_text(json.dumps(build, indent=2) + "\n", encoding="utf-8")

    result = {
        "schema_version": 1,
        "task": "DOOM-P1-080",
        "scenario": args.scenario,
        "status": "PASS" if not failures else "FAIL",
        "exit_code": args.exit_code,
        "end_tic": end_tic,
        "real_tics": real_tics,
        "demo": {"size_bytes": args.demo.stat().st_size, "sha256": digest(args.demo)},
        "state": {"records": len(states), "sha256": digest(state_path) if state_path.is_file() else None},
        "frames": frames,
        "stdout_sha256": digest(args.stdout) if args.stdout.is_file() else None,
        "stderr_sha256": digest(args.stderr) if args.stderr.is_file() else None,
        "failures": failures,
        "limitations": [
            "Logical-state and indexed-frame checkpoints only; no universal compatibility claim.",
            "Real-tic throughput is host-dependent and excluded from deterministic comparison.",
        ],
    }
    (args.run_dir / "result.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"ORACLE_RUN={result['status']} scenario={args.scenario} end_tic={end_tic}")
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
