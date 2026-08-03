#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
cd "$ROOT"

hash_file() { sha256sum "$1" | awk '{print $1}'; }
verify_file() {
    local path="$1" expected="$2"
    [[ -f "$path" ]] || { echo "missing file: $path" >&2; return 1; }
    local actual
    actual="$(hash_file "$path")"
    [[ "$actual" == "$expected" ]] || { echo "sha256 mismatch: $path expected=$expected actual=$actual" >&2; return 1; }
}

if [[ "${1:-}" == "--verify-file" ]]; then
    [[ $# -eq 3 ]] || { echo "usage: $0 --verify-file PATH SHA256" >&2; exit 2; }
    verify_file "$2" "$3"
    echo "VERIFY_FILE=PASS path=$2"
    exit 0
fi

MODE=fetch
if [[ "${1:-}" == "--verify-only" ]]; then
    MODE=verify
    shift
fi
[[ $# -eq 0 ]] || { echo "unknown argument: $1" >&2; exit 2; }

LOCK="tools/freedoom-lock.json"
VERSION="$(python3 -c 'import json; print(json.load(open("tools/freedoom-lock.json"))["release"]["tag"].lstrip("v"))')"
CACHE="$ROOT/vendor-cache/freedoom/$VERSION"
ARCHIVE_NAME="$(python3 -c 'import json; print(json.load(open("tools/freedoom-lock.json"))["archive"]["name"])')"
ARCHIVE="$CACHE/$ARCHIVE_NAME"
DATA="$CACHE/data"
ARCHIVE_URL="$(python3 -c 'import json; print(json.load(open("tools/freedoom-lock.json"))["archive"]["url"])')"
ARCHIVE_HASH="$(python3 -c 'import json; print(json.load(open("tools/freedoom-lock.json"))["archive"]["sha256"])')"

case "$CACHE" in "$ROOT"/vendor-cache/freedoom/*) ;; *) echo "unsafe cache path" >&2; exit 1 ;; esac
mkdir -p "$CACHE" evidence/logs/P01/P1-040 evidence/task-runs/P01-DOOM-P1-040 evidence/manifests/P01

if ! verify_file "$ARCHIVE" "$ARCHIVE_HASH" 2>/dev/null; then
    [[ "$MODE" == fetch ]] || { verify_file "$ARCHIVE" "$ARCHIVE_HASH"; exit 1; }
    rm -f -- "$ARCHIVE.part"
    curl --fail --location --proto '=https' --tlsv1.2 --output "$ARCHIVE.part" "$ARCHIVE_URL"
    verify_file "$ARCHIVE.part" "$ARCHIVE_HASH"
    [[ "$(stat -c '%s' "$ARCHIVE.part")" == "24143781" ]] || { echo "archive size mismatch" >&2; exit 1; }
    mv -- "$ARCHIVE.part" "$ARCHIVE"
fi

verify_file "$ARCHIVE" "$ARCHIVE_HASH"

if [[ "$MODE" == fetch ]]; then
    STAGING="$CACHE/data.tmp"
    case "$STAGING" in "$ROOT"/vendor-cache/freedoom/*/data.tmp) ;; *) echo "unsafe staging path" >&2; exit 1 ;; esac
    rm -rf -- "$STAGING"
    mkdir -p "$STAGING"
    python3 - "$ARCHIVE" "$STAGING" <<'PY'
import json
from pathlib import Path
import sys
import zipfile

archive, staging = Path(sys.argv[1]), Path(sys.argv[2])
lock = json.loads(Path("tools/freedoom-lock.json").read_text(encoding="utf-8"))
expected = [lock["license"]["archive_path"], *(item["archive_path"] for item in lock["wads"])]
with zipfile.ZipFile(archive) as source:
    names = set(source.namelist())
    missing = sorted(set(expected) - names)
    if missing:
        raise SystemExit("missing expected archive entries: " + ", ".join(missing))
    for archived_name in expected:
        target_name = "COPYING.txt" if archived_name.endswith("COPYING.txt") else Path(archived_name).name
        (staging / target_name).write_bytes(source.read(archived_name))
PY
    rm -rf -- "$DATA"
    mv -- "$STAGING" "$DATA"
fi

python3 - "$ARCHIVE" "$DATA" <<'PY'
import hashlib
import json
from pathlib import Path
import sys

archive, data_root = Path(sys.argv[1]), Path(sys.argv[2])
lock = json.loads(Path("tools/freedoom-lock.json").read_text(encoding="utf-8"))
checks = [(archive, lock["archive"]["size_bytes"], lock["archive"]["sha256"]), (data_root / "COPYING.txt", lock["license"]["size_bytes"], lock["license"]["sha256"])]
checks.extend((data_root / item["name"], item["size_bytes"], item["sha256"]) for item in lock["wads"])
for path, size, digest in checks:
    payload = path.read_bytes()
    actual = hashlib.sha256(payload).hexdigest()
    if len(payload) != size or actual != digest:
        raise SystemExit(f"identity mismatch: {path} size={len(payload)} sha256={actual}")
    print(f"VERIFIED path={path} size={size} sha256={digest}")
PY

SUMMARY="evidence/task-runs/P01-DOOM-P1-040/fetch.stdout.txt"
: >"evidence/task-runs/P01-DOOM-P1-040/fetch.stderr.txt"
{
    echo "release_id=139025240"
    echo "release_tag=v0.13.0"
    echo "release_commit=cfb8644b1a8dc7d7d2177e6a892ccaa2922bdaae"
    echo "archive_sha256=$ARCHIVE_HASH"
    for wad in freedoom1.wad freedoom2.wad; do sha256sum "$DATA/$wad"; done
    echo "mode=$MODE"
} >"$SUMMARY"

python3 - "$DATA" "$ARCHIVE" <<'PY'
import hashlib
import json
from pathlib import Path
import subprocess
import sys

root = Path.cwd()
data_root, archive = Path(sys.argv[1]), Path(sys.argv[2])
lock = json.loads((root / "tools/freedoom-lock.json").read_text(encoding="utf-8"))

def record(path, kind=None):
    payload = path.read_bytes()
    item = {"path": path.relative_to(root).as_posix(), "size_bytes": len(payload), "sha256": hashlib.sha256(payload).hexdigest()}
    if kind:
        item["kind"] = kind
    return item

for wad in lock["wads"]:
    path = data_root / wad["name"]
    manifest = {
        "schema_version": 1, "manifest_type": "artifact", "project": "sfhs-doom", "edition": wad["edition"], "phase": "P01", "task": "DOOM-P1-040",
        "source": {
            "commit": subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip(),
            "upstream_tag": "chocolate-doom-3.1.1", "upstream_sha": "410d96855b5df5410ff591a90efeafa889119224", "dirty": True,
            "toolchains": [{"name": "Freedoom release", "version": lock["release"]["tag"], "source": lock["release"]["html_url"]}],
            "inputs": [record(archive)],
        },
        "build": {"utc": lock["release"]["published_at"], "id": f"P01-DOOM-P1-040-{wad['edition']}-v0.13.0", "commands": [{"argv": ["bash", "tools/fetch-freedoom.sh"], "cwd": ".", "exit_code": 0, "stdout_path": "evidence/task-runs/P01-DOOM-P1-040/fetch.stdout.txt", "stderr_path": "evidence/task-runs/P01-DOOM-P1-040/fetch.stderr.txt"}]},
        "artifacts": [record(path, "open-freedoom-iwad")],
        "verification": {"run_ids": [f"P01-DOOM-P1-040-{wad['edition']}-v0.13.0"], "result": "PASS", "checks": ["official archive SHA-256", "expected-file-only extraction", "WAD byte size and SHA-256", "BSD-3-Clause license identity"]},
        "notes": ["Open Freedoom data only; no commercial Doom data was downloaded or inspected.", "WAD and archive bytes remain under ignored vendor-cache/freedoom/."],
    }
    target = root / "evidence/manifests/P01" / f"{wad['edition']}-v0.13.0.json"
    target.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
PY

echo "FREEDOOM_FETCH=PASS mode=$MODE cache=${CACHE#$ROOT/}"
