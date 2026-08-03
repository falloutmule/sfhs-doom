#!/usr/bin/env python3
"""Print a stable JSON identity for one repository artifact."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def artifact_record(path: Path, kind: str) -> dict[str, object]:
    resolved = path.resolve()
    try:
        relative = resolved.relative_to(ROOT).as_posix()
    except ValueError as exc:
        raise ValueError(f"artifact is outside repository: {path}") from exc
    if not resolved.is_file():
        raise ValueError(f"artifact is missing: {relative}")
    digest = hashlib.sha256()
    size = 0
    with resolved.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            size += len(chunk)
            digest.update(chunk)
    return {"path": relative, "size_bytes": size, "sha256": digest.hexdigest(), "kind": kind}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", type=Path)
    parser.add_argument("--kind", default="native-executable")
    args = parser.parse_args()
    try:
        record = artifact_record(args.path, args.kind)
    except ValueError as exc:
        parser.error(str(exc))
    print(json.dumps(record, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
