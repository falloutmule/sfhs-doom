#!/usr/bin/env python3
"""Create and aggregate machine-readable native demo results."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys


TIMED_RE = re.compile(r"timed\s+(\d+)\s+gametics\s+in\s+(\d+)\s+realtics", re.IGNORECASE)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def create_result(args: argparse.Namespace) -> int:
    stdout = read_text(args.stdout)
    stderr = read_text(args.stderr)
    combined = stdout + "\n" + stderr
    lower = combined.lower()
    timed = TIMED_RE.search(combined)
    if args.mode == "record":
        completed = bool(re.search(r"demo .* recorded", combined, re.IGNORECASE))
        completion = "recorded" if completed else "missing-record-marker"
    elif args.mode == "timedemo":
        completed = timed is not None
        completion = "timed" if completed else "missing-timedemo-marker"
    else:
        completed = args.exit_code == 0 and "playing demo" in lower
        completion = "playback-exit" if completed else "missing-playback-completion"
    desync = any(marker in lower for marker in ("desync", "consistency failure", "demo mismatch"))
    demo_hash = None
    demo_size = None
    demo_path_value = args.demo.as_posix() if args.demo else None
    if args.demo:
        demo_path = Path(args.demo)
        if demo_path.is_file():
            demo_hash = sha256(demo_path)
            demo_size = demo_path.stat().st_size
    expected = set(args.expected_exit)
    status = "PASS" if args.exit_code in expected and completed and not desync else "FAIL"
    result = {
        "schema_version": 1,
        "status": status,
        "task": "DOOM-P1-070",
        "variant": args.variant,
        "mode": args.mode,
        "run": args.run,
        "demo_source": args.demo_source,
        "demo_path": demo_path_value,
        "demo_size_bytes": demo_size,
        "demo_sha256": demo_hash,
        "stdout_sha256": sha256(args.stdout) if args.stdout.is_file() else None,
        "stderr_sha256": sha256(args.stderr) if args.stderr.is_file() else None,
        "exit_code": args.exit_code,
        "expected_exit_codes": sorted(expected),
        "completion": completion,
        "desync": desync,
        "end_tic": int(timed.group(1)) if timed else None,
        "real_tics": int(timed.group(2)) if timed else None,
        "stdout_path": args.stdout.as_posix(),
        "stderr_path": args.stderr.as_posix(),
        "command": args.invocation,
        "environment": args.environment,
        "limitations": [
            "This is bounded native command evidence, not a claim of universal vanilla demo compatibility.",
        ],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(f"DEMO_RESULT={status} path={args.output} completion={completion} end_tic={result['end_tic']}")
    return 0 if status == "PASS" else 1


def aggregate(args: argparse.Namespace) -> int:
    results = []
    for path in sorted(args.root.rglob("result.json")):
        try:
            results.append(json.loads(path.read_text(encoding="utf-8")))
        except (OSError, UnicodeError, json.JSONDecodeError):
            results.append({"status": "FAIL", "path": path.as_posix()})
    statuses = [item.get("status") for item in results]
    timed_by_source: dict[str, list[int]] = {}
    for item in results:
        if item.get("mode") == "timedemo" and isinstance(item.get("end_tic"), int):
            timed_by_source.setdefault(str(item.get("demo_source")), []).append(item["end_tic"])
    hashes = [item.get("demo_sha256") for item in results if item.get("demo_sha256")]
    summary = {
        "schema_version": 1,
        "task": "DOOM-P1-070",
        "status": "PASS" if results and all(status == "PASS" for status in statuses) else "FAIL",
        "result_count": len(results),
        "pass_count": sum(status == "PASS" for status in statuses),
        "variants": sorted({item.get("variant") for item in results}),
        "modes": sorted({item.get("mode") for item in results}),
        "all_demo_hashes_equal": len(set(hashes)) <= 1,
        "timedemo_end_tics_by_source": timed_by_source,
        "timedemo_end_tics_stable": bool(timed_by_source)
        and all(len(set(values)) == 1 for values in timed_by_source.values()),
        "results": results,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(f"DEMO_AGGREGATE={summary['status']} path={args.output} results={len(results)}")
    return 0 if summary["status"] == "PASS" else 1


def normalize_recording(args: argparse.Namespace) -> int:
    data = args.input.read_bytes()
    header_size = 13
    required_size = header_size + args.tics * 4 + 1
    if len(data) < required_size or data[-1] != 0x80:
        print("DEMO_NORMALIZE=FAIL invalid or too-short native recording", file=sys.stderr)
        return 1
    commands = data[header_size : header_size + args.tics * 4]
    if any(commands):
        print("DEMO_NORMALIZE=FAIL recording contains nonzero input commands", file=sys.stderr)
        return 1
    normalized = data[:header_size] + commands + b"\x80"
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(normalized)
    print(
        f"DEMO_NORMALIZE=PASS tics={args.tics} bytes={len(normalized)} "
        f"sha256={hashlib.sha256(normalized).hexdigest()}"
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    create = subparsers.add_parser("create")
    create.add_argument("--output", type=Path, required=True)
    create.add_argument("--stdout", type=Path, required=True)
    create.add_argument("--stderr", type=Path, required=True)
    create.add_argument("--demo", type=Path)
    create.add_argument("--demo-source", required=True)
    create.add_argument("--variant", required=True)
    create.add_argument("--mode", choices=("record", "normal", "strict", "timedemo"), required=True)
    create.add_argument("--run", required=True)
    create.add_argument("--exit-code", type=int, required=True)
    create.add_argument("--expected-exit", type=int, nargs="+", required=True)
    create.add_argument("--command", dest="invocation", required=True)
    create.add_argument("--environment", required=True)
    aggregate_parser = subparsers.add_parser("aggregate")
    aggregate_parser.add_argument("--root", type=Path, required=True)
    aggregate_parser.add_argument("--output", type=Path, required=True)
    normalize = subparsers.add_parser("normalize-recording")
    normalize.add_argument("--input", type=Path, required=True)
    normalize.add_argument("--output", type=Path, required=True)
    normalize.add_argument("--tics", type=int, default=64)
    args = parser.parse_args()
    if args.command == "create":
        return create_result(args)
    if args.command == "aggregate":
        return aggregate(args)
    return normalize_recording(args)


if __name__ == "__main__":
    raise SystemExit(main())
