#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "$BASH_SOURCE")" && pwd -P)"
repo_root="$(cd -- "$script_dir/.." && pwd -P)"
cd "$repo_root"
source tools/wasm-env.sh >/dev/null

build_dir="$repo_root/build/wasm/upstream-configure"
run_dir="$repo_root/evidence/task-runs/P02-DOOM-P2-030"
log_dir="$repo_root/evidence/logs/P02/P2-030"
clean=0

usage() {
    echo "usage: tools/configure-wasm.sh [--clean]"
}

while (($#)); do
    case "$1" in
        --clean) clean=1; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "unknown argument: $1" >&2; usage >&2; exit 2 ;;
    esac
done

mkdir -p "$run_dir" "$log_dir"
if ((clean)); then
    case "$build_dir" in
        "$repo_root/build/wasm/upstream-configure") rm -rf -- "$build_dir" ;;
        *) echo "unsafe configure build directory refused" >&2; exit 2 ;;
    esac
fi
mkdir -p "$build_dir"

configure_args=(
    -S .
    -B "$build_dir"
    -G Ninja
    -DCMAKE_BUILD_TYPE=Debug
    -DENABLE_SDL2_MIXER=ON
    -DENABLE_SDL2_NET=OFF
    -DCMAKE_DISABLE_FIND_PACKAGE_FluidSynth=TRUE
    -DCMAKE_DISABLE_FIND_PACKAGE_SampleRate=TRUE
    -DCMAKE_DISABLE_FIND_PACKAGE_PNG=TRUE
    -DSFHS_ORACLE_TEST=OFF
)
printf '%q ' emcmake cmake "${configure_args[@]}" | tee "$run_dir/configure-argv.txt"
printf '\n' >> "$run_dir/configure-argv.txt"
printf '%s\n' "SOURCE_COMMIT=$(git rev-parse HEAD)" "BUILD_DIR=${build_dir#$repo_root/}" "CC=$EMCC" "SDL2_MIXER=ON" "SDL2_NET=OFF" "ORACLE=OFF" | tee "$run_dir/configure-environment.txt"

emcmake cmake "${configure_args[@]}" >"$run_dir/configure.stdout.txt" 2>"$run_dir/configure.stderr.txt"
cp "$build_dir/CMakeCache.txt" "$run_dir/CMakeCache.txt"
cmake --build "$build_dir" --target help >"$run_dir/target-help.txt" 2>"$run_dir/target-help.stderr.txt"
grep -E 'CMAKE_(C|SYSTEM_NAME|TOOLCHAIN_FILE)|EMSCRIPTEN|SDL2|SDL2_MIXER|SFHS_ORACLE' "$build_dir/CMakeCache.txt" >"$run_dir/cache-selected.txt" || true
grep -Ei 'warning|error' "$run_dir/configure.stdout.txt" "$run_dir/configure.stderr.txt" >"$run_dir/configure-warnings.txt" || true
if grep -q 'chocolate-doom' "$run_dir/target-help.txt"; then
    echo 'TARGET chocolate-doom PASS' | tee "$run_dir/target-check.txt"
else
    echo 'TARGET chocolate-doom FAIL' | tee "$run_dir/target-check.txt" >&2
    exit 1
fi
printf '%s\n' "configure_exit=0" "target_help_exit=0" "compiler=emcc" "toolchain=$(grep -E '^CMAKE_TOOLCHAIN_FILE:FILEPATH=' "$build_dir/CMakeCache.txt" || true)" "emscripten=$(grep -E 'EMSCRIPTEN|CMAKE_SYSTEM_NAME:INTERNAL=' "$build_dir/CMakeCache.txt" || true)" | tee "$log_dir/result.txt"
echo 'CONFIGURE_WASM=PASS'
