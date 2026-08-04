#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "$BASH_SOURCE")" && pwd -P)"
repo_root="$(cd -- "$script_dir/.." && pwd -P)"

if [[ ! -e "$repo_root/.git" || ! -f "$repo_root/CMakeLists.txt" ]]; then
    echo "WASM_ENV FAIL: not inside the SFHS Doom repository" >&2
    return 2 2>/dev/null || exit 2
fi

current_dir="$(pwd -P)"
case "$current_dir/" in
    "$repo_root/"*) ;;
    *)
        echo "WASM_ENV FAIL: invoke from inside $repo_root" >&2
        return 2 2>/dev/null || exit 2
        ;;
esac

export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export TZ=UTC
export SFHS_REPO_ROOT="$repo_root"
export SFHS_EMSDK_ROOT="$repo_root/toolchains/emsdk"
export SFHS_WASM_BUILD_ROOT="$repo_root/build/wasm"
export SFHS_WASM_RUNTIME_ROOT="$repo_root/build/runtime/P02"
export SFHS_WASM_EVIDENCE_ROOT="$repo_root/evidence"
export PLAYWRIGHT_BROWSERS_PATH="$repo_root/vendor-cache/playwright"

if [[ ! -f "$SFHS_EMSDK_ROOT/emsdk_env.sh" ]]; then
    echo "WASM_ENV FAIL: pinned emsdk environment is absent" >&2
    return 2 2>/dev/null || exit 2
fi

source "$SFHS_EMSDK_ROOT/emsdk_env.sh" >/dev/null
export EMCC=emcc
export WASM_CC=emcc
export WASM_CXX=em++

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
    echo "WASM_ENV=PASS"
    echo "SFHS_REPO_ROOT=$SFHS_REPO_ROOT"
    echo "SFHS_EMSDK_ROOT=$SFHS_EMSDK_ROOT"
    echo "SFHS_WASM_BUILD_ROOT=$SFHS_WASM_BUILD_ROOT"
    echo "SFHS_WASM_RUNTIME_ROOT=$SFHS_WASM_RUNTIME_ROOT"
    echo "PLAYWRIGHT_BROWSERS_PATH=$PLAYWRIGHT_BROWSERS_PATH"
    echo "SDK_NODE=$SFHS_EMSDK_ROOT/node/22.16.0_64bit/bin/node"
    echo "SOURCE_COMMIT=$(git -C "$SFHS_REPO_ROOT" rev-parse HEAD)"
fi
