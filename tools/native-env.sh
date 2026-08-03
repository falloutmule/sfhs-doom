#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "$BASH_SOURCE")" && pwd -P)"
repo_root="$(cd -- "$script_dir/.." && pwd -P)"

if [[ ! -e "$repo_root/.git" || ! -f "$repo_root/CMakeLists.txt" ]]; then
    echo "NATIVE_ENV FAIL: script is not inside the SFHS Doom repository" >&2
    exit 2
fi

current_dir="$(pwd -P)"
case "$current_dir/" in
    "$repo_root/"*) ;;
    *)
        echo "NATIVE_ENV FAIL: invoke from inside $repo_root" >&2
        exit 2
        ;;
esac

export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export TZ=UTC
export SFHS_REPO_ROOT="$repo_root"
export SFHS_BUILD_ROOT="$repo_root/build"
export SFHS_NATIVE_BUILD_ROOT="$repo_root/build/native"
export SFHS_RUNTIME_ROOT="$repo_root/build/runtime"
export SFHS_EVIDENCE_ROOT="$repo_root/evidence"
export SFHS_VENDOR_CACHE="$repo_root/vendor-cache"

sfhs_native_identity() {
    echo "NATIVE_ENV=PASS"
    echo "SFHS_REPO_ROOT=$SFHS_REPO_ROOT"
    echo "SFHS_NATIVE_BUILD_ROOT=$SFHS_NATIVE_BUILD_ROOT"
    echo "SFHS_RUNTIME_ROOT=$SFHS_RUNTIME_ROOT"
    echo "SFHS_EVIDENCE_ROOT=$SFHS_EVIDENCE_ROOT"
    echo "SFHS_VENDOR_CACHE=$SFHS_VENDOR_CACHE"
    echo "LC_ALL=$LC_ALL"
    echo "TZ=$TZ"
    echo "SOURCE_COMMIT=$(git -C "$SFHS_REPO_ROOT" rev-parse HEAD)"
    echo "UPSTREAM_BASE=410d96855b5df5410ff591a90efeafa889119224"
}

if [[ "$BASH_SOURCE" == "$0" ]]; then
    sfhs_native_identity
fi
