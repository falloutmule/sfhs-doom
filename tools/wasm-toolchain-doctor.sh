#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "$BASH_SOURCE")" && pwd -P)"
source "$script_dir/wasm-env.sh"

failures=0

check_command() {
    local command_name="$1"
    if [[ "${SFHS_WASM_DOCTOR_FORCE_MISSING:-}" == "$command_name" ]]; then
        echo "COMMAND $command_name FAIL forced-missing"
        failures=$((failures + 1))
    elif command_path="$(command -v "$command_name" 2>/dev/null)"; then
        echo "COMMAND $command_name PASS $command_path"
    else
        echo "COMMAND $command_name FAIL missing"
        failures=$((failures + 1))
    fi
}

check_exact_version() {
    local label="$1"
    local actual="$2"
    local expected="$3"
    if [[ "${SFHS_WASM_DOCTOR_FORCE_WRONG_VERSION:-}" == "$label" ]]; then
        actual="wrong-version"
    fi
    if [[ "$actual" == "$expected" ]]; then
        echo "VERSION $label PASS $actual"
    else
        echo "VERSION $label FAIL actual=$actual expected=$expected"
        failures=$((failures + 1))
    fi
}

for command_name in bash emcc em++ node npm cmake ninja python3; do
    check_command "$command_name"
done

emcc_version="$(emcc --version | sed -n '1p' || true)"
check_exact_version emcc "$emcc_version" 'emcc (Emscripten gcc/clang-like replacement + linker emulating GNU ld) 6.0.5 (1db513782be24469589d7cb8a1f1834e9a33f271)'
node_version="$("$SFHS_EMSDK_ROOT/node/22.16.0_64bit/bin/node" --version 2>/dev/null || true)"
check_exact_version node "$node_version" 'v22.16.0'
playwright_version="$(PLAYWRIGHT_BROWSERS_PATH="$PLAYWRIGHT_BROWSERS_PATH" npx --prefix "$SFHS_REPO_ROOT/browser-tests" playwright --version 2>/dev/null || true)"
check_exact_version playwright "$playwright_version" 'Version 1.61.1'

if [[ ! -x "$SFHS_EMSDK_ROOT/upstream/emscripten/emcc" ]]; then
    echo "PIN emscripten FAIL missing pinned compiler"
    failures=$((failures + 1))
else
    echo "PIN emscripten PASS sdk=6.0.5"
fi

for browser_dir in "$PLAYWRIGHT_BROWSERS_PATH/chromium-1228" "$PLAYWRIGHT_BROWSERS_PATH/firefox-1532"; do
    if [[ -d "$browser_dir" ]]; then
        echo "BROWSER_CACHE $(basename "$browser_dir") PASS $browser_dir"
    else
        echo "BROWSER_CACHE $(basename "$browser_dir") FAIL missing"
        failures=$((failures + 1))
    fi
done

if [[ "$failures" -ne 0 ]]; then
    echo "WASM_TOOLCHAIN_DOCTOR=FAIL failures=$failures" >&2
    exit 1
fi

mkdir -p "$SFHS_WASM_RUNTIME_ROOT/P2-020"
smoke_root="$SFHS_WASM_RUNTIME_ROOT/P2-020"
emcc "$SFHS_REPO_ROOT/tests/fixtures/wasm/sdl-smoke.c" \
    -O2 \
    -s USE_SDL=2 \
    -s WASM=1 \
    -s ENVIRONMENT=web \
    -s EXIT_RUNTIME=1 \
    -o "$smoke_root/sdl-smoke.js" 2>&1 | tee "$SFHS_REPO_ROOT/evidence/logs/P02/P2-020/emcc-sdl-smoke.txt"

cat > "$smoke_root/sdl-smoke.html" <<'HTML'
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>SFHS SDL smoke</title></head>
<body><canvas id="canvas" width="64" height="64"></canvas>
<script>var Module = {canvas: document.getElementById('canvas')};</script>
<script src="sdl-smoke.js"></script>
</body>
</html>
HTML

sha256sum "$smoke_root/sdl-smoke.js" "$smoke_root/sdl-smoke.wasm" | tee "$SFHS_REPO_ROOT/evidence/task-runs/P02-DOOM-P2-020/sdl-smoke-sha256.txt"
printf '%s\n' "SMOKE_ROOT=$smoke_root" "SMOKE_HTML=$smoke_root/sdl-smoke.html" | tee "$SFHS_REPO_ROOT/evidence/task-runs/P02-DOOM-P2-020/smoke-artifact.txt"
echo "WASM_TOOLCHAIN_DOCTOR=PASS"
