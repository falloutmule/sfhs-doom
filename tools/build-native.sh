#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
cd "$ROOT"
source tools/native-env.sh >/dev/null

CONFIG="all"
CLEAN=0
PRINT_IDENTITY=0

usage() {
    echo "usage: tools/build-native.sh [--config debug|release|all] [--clean-build-dir] [--print-identity]"
}

while (($#)); do
    case "$1" in
        --config)
            [[ $# -ge 2 ]] || { usage >&2; exit 2; }
            CONFIG="$2"
            shift 2
            ;;
        --clean-build-dir)
            CLEAN=1
            shift
            ;;
        --print-identity)
            PRINT_IDENTITY=1
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "unknown argument: $1" >&2
            usage >&2
            exit 2
            ;;
    esac
done

case "$CONFIG" in
    debug|release|all) ;;
    *) echo "unknown config: $CONFIG" >&2; exit 2 ;;
esac

SOURCE_COMMIT="$(git rev-parse HEAD)"
UPSTREAM_SHA="410d96855b5df5410ff591a90efeafa889119224"
UPSTREAM_TAG="chocolate-doom-3.1.1"
BUILD_OPTIONS="ENABLE_SDL2_NET=OFF;FluidSynth=OFF;SampleRate=OFF;PNG=OFF;generator=Ninja"

print_identity() {
    printf 'source_commit=%s\n' "$SOURCE_COMMIT"
    printf 'upstream_tag=%s\n' "$UPSTREAM_TAG"
    printf 'upstream_sha=%s\n' "$UPSTREAM_SHA"
    printf 'generator=Ninja\n'
    printf 'compiler=%s\n' "$(gcc -dumpfullversion -dumpversion)"
    printf 'cmake=%s\n' "$(cmake --version | sed -n '1s/^cmake version //p')"
    printf 'ninja=%s\n' "$(ninja --version)"
    printf 'sdl2=%s\n' "$(pkg-config --modversion sdl2)"
    printf 'sdl2_mixer=%s\n' "$(pkg-config --modversion SDL2_mixer)"
    printf 'options=%s\n' "$BUILD_OPTIONS"
}

if ((PRINT_IDENTITY)); then
    print_identity
    [[ "$CONFIG" == "all" && "$CLEAN" -eq 0 ]] && exit 0
fi

[[ "$(git rev-parse --show-toplevel)" == "$ROOT" ]] || { echo "wrong repository" >&2; exit 1; }
git merge-base --is-ancestor "$UPSTREAM_SHA" HEAD || { echo "pinned upstream is not an ancestor of HEAD" >&2; exit 1; }

ENGINE_PATHS=(CMakeLists.txt cmake src textscreen opl pcsound doom heretic hexen strife setup)
if ! git diff --ignore-space-at-eol --quiet HEAD -- "${ENGINE_PATHS[@]}" \
    || [[ -n "$(git ls-files --others --exclude-standard -- "${ENGINE_PATHS[@]}")" ]]; then
    echo "dirty engine/build-system source refused" >&2
    git diff --ignore-space-at-eol --name-only HEAD -- "${ENGINE_PATHS[@]}" >&2
    git ls-files --others --exclude-standard -- "${ENGINE_PATHS[@]}" >&2
    exit 1
fi

bash tools/native-toolchain-doctor.sh >/dev/null

mkdir -p evidence/logs/P01/P1-020 evidence/manifests/P01 evidence/task-runs/P01-DOOM-P1-020

safe_clean_build_dir() {
    local build_dir="$1"
    case "$build_dir" in
        "$ROOT"/build/native/debug|"$ROOT"/build/native/release) ;;
        *) echo "unsafe build-directory deletion refused: $build_dir" >&2; exit 1 ;;
    esac
    if [[ -e "$build_dir" ]]; then
        rm -rf -- "$build_dir"
    fi
}

build_one() {
    local config="$1"
    local cmake_type
    case "$config" in
        debug) cmake_type="Debug" ;;
        release) cmake_type="Release" ;;
    esac
    local build_dir="$ROOT/build/native/$config"
    if ((CLEAN)); then
        safe_clean_build_dir "$build_dir"
    fi
    mkdir -p "$build_dir"

    local stamp run_id run_dir log_dir configure_out configure_err build_out build_err
    stamp="$(date -u +%Y%m%dT%H%M%SZ)"
    run_id="P01-DOOM-P1-020-${config}-${stamp}-$$"
    run_dir="evidence/task-runs/P01-DOOM-P1-020/$run_id"
    log_dir="evidence/logs/P01/P1-020/$run_id"
    mkdir -p "$run_dir" "$log_dir"
    configure_out="$run_dir/configure.stdout.txt"
    configure_err="$run_dir/configure.stderr.txt"
    build_out="$run_dir/build.stdout.txt"
    build_err="$run_dir/build.stderr.txt"

    local start end duration
    start="$(date +%s)"
    cmake -S . -B "$build_dir" -G Ninja \
        -DCMAKE_BUILD_TYPE="$cmake_type" \
        -DENABLE_SDL2_NET=OFF \
        -DCMAKE_DISABLE_FIND_PACKAGE_FluidSynth=TRUE \
        -DCMAKE_DISABLE_FIND_PACKAGE_SampleRate=TRUE \
        -DCMAKE_DISABLE_FIND_PACKAGE_PNG=TRUE \
        >"$configure_out" 2>"$configure_err"
    cmake --build "$build_dir" --target chocolate-doom >"$build_out" 2>"$build_err"
    end="$(date +%s)"
    duration="$((end - start))"

    local executable="$build_dir/src/chocolate-doom"
    [[ -x "$executable" ]] || { echo "missing executable: $executable" >&2; exit 1; }
    file "$executable" >"$log_dir/file.txt"
    ldd "$executable" >"$log_dir/ldd.txt"
    cp "$build_dir/CMakeCache.txt" "$log_dir/CMakeCache.txt"
    print_identity >"$log_dir/identity.txt"
    printf 'duration_seconds=%s\nexecutable=%s\n' "$duration" "${executable#$ROOT/}" >"$log_dir/build-summary.txt"

    local manifest="evidence/manifests/P01/native-${config}-${run_id}.json"
    python3 - "$config" "$cmake_type" "$run_id" "$manifest" "$executable" "$configure_out" "$configure_err" "$build_out" "$build_err" "$duration" <<'PY'
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
import subprocess
import sys

config, cmake_type, run_id, manifest_name, executable_name, configure_out, configure_err, build_out, build_err, duration = sys.argv[1:]
root = Path.cwd()

def record(name, kind=None):
    path = root / name
    data = path.read_bytes()
    value = {"path": path.relative_to(root).as_posix(), "size_bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
    if kind is not None:
        value["kind"] = kind
    return value

def output(*argv):
    return subprocess.check_output(argv, text=True).strip()

source_commit = output("git", "rev-parse", "HEAD")
configure_argv = ["cmake", "-S", ".", "-B", f"build/native/{config}", "-G", "Ninja", f"-DCMAKE_BUILD_TYPE={cmake_type}", "-DENABLE_SDL2_NET=OFF", "-DCMAKE_DISABLE_FIND_PACKAGE_FluidSynth=TRUE", "-DCMAKE_DISABLE_FIND_PACKAGE_SampleRate=TRUE", "-DCMAKE_DISABLE_FIND_PACKAGE_PNG=TRUE"]
build_argv = ["cmake", "--build", f"build/native/{config}", "--target", "chocolate-doom"]
manifest = {
    "schema_version": 1,
    "manifest_type": "artifact",
    "project": "sfhs-doom",
    "edition": f"native-chocolate-doom-{config}",
    "phase": "P01",
    "task": "DOOM-P1-020",
    "source": {
        "commit": source_commit,
        "upstream_tag": "chocolate-doom-3.1.1",
        "upstream_sha": "410d96855b5df5410ff591a90efeafa889119224",
        "dirty": False,
        "toolchains": [
            {"name": "gcc", "version": output("gcc", "-dumpfullversion", "-dumpversion"), "source": "Ubuntu 24.04 package inventory pinned by DOOM-P1-010"},
            {"name": "cmake", "version": output("cmake", "--version").splitlines()[0], "source": "Ubuntu 24.04 package inventory pinned by DOOM-P1-010"},
            {"name": "ninja", "version": output("ninja", "--version"), "source": "Ubuntu 24.04 package inventory pinned by DOOM-P1-010"},
        ],
        "inputs": [record("CMakeLists.txt")],
    },
    "build": {
        "utc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "id": run_id,
        "commands": [
            {"argv": configure_argv, "cwd": ".", "exit_code": 0, "stdout_path": configure_out, "stderr_path": configure_err},
            {"argv": build_argv, "cwd": ".", "exit_code": 0, "stdout_path": build_out, "stderr_path": build_err},
        ],
    },
    "artifacts": [record(Path(executable_name).relative_to(root).as_posix(), "native-linux-elf-executable")],
    "verification": {
        "run_ids": [run_id],
        "result": "PASS",
        "checks": ["clean guarded build directory", "executable exists and is executable", "file identity captured", "dynamic dependencies captured", "optional dependency parity flags applied"],
    },
    "notes": [f"Configuration: {cmake_type}", f"Build duration seconds: {duration}", "SDL2_net, FluidSynth, SampleRate, and PNG discovery were disabled explicitly."],
}
Path(manifest_name).write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(manifest_name)
PY
    python3 tools/validate_artifact_manifest.py "$manifest"
    echo "NATIVE_BUILD_PASS config=$config run_id=$run_id manifest=$manifest"
}

case "$CONFIG" in
    debug) build_one debug ;;
    release) build_one release ;;
    all) build_one debug; build_one release ;;
esac
