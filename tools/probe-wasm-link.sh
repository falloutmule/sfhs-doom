#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "$BASH_SOURCE")" && pwd -P)"
repo_root="$(cd -- "$script_dir/.." && pwd -P)"
cd "$repo_root"
source tools/wasm-env.sh >/dev/null

build_dir="$repo_root/build/wasm/upstream-configure"
run_dir="$repo_root/evidence/task-runs/P02-DOOM-P2-040"
log_dir="$repo_root/evidence/logs/P02/P2-040"
mkdir -p "$run_dir" "$log_dir"

iwad="$repo_root/vendor-cache/freedoom/0.13.0/data/freedoom2.wad"
[[ -f "$iwad" ]] || { echo 'PROBE_WASM_LINK=BLOCKED missing verified Freedoom Phase 2 IWAD' >&2; exit 1; }
bash tools/fetch-freedoom.sh --verify-only >"$run_dir/freedoom-verify.stdout.txt" 2>"$run_dir/freedoom-verify.stderr.txt"

[[ -f "$build_dir/CMakeCache.txt" ]] || { echo 'PROBE_WASM_LINK=BLOCKED missing P2-030 configure tree' >&2; exit 1; }
printf '%s\n' "SOURCE_COMMIT=$(git rev-parse HEAD)" "IWAD=$iwad" "BUILD_DIR=${build_dir#$repo_root/}" "TARGET=chocolate-doom" "COMPILER=emcc" | tee "$run_dir/probe-environment.txt"
emcc --version | tee "$run_dir/emcc-version.txt"
emcc -v 2>"$run_dir/emcc-verbose.txt" || true
wasm-ld --version >"$run_dir/wasm-ld-version.txt" 2>&1 || true

set +e
cmake --build "$build_dir" --target chocolate-doom --verbose >"$run_dir/build.stdout.txt" 2>"$run_dir/build.stderr.txt"
build_status=$?
set -e
printf 'build_exit=%s\n' "$build_status" | tee "$run_dir/build-status.txt"

find "$build_dir" -type f -printf '%P\t%s\n' 2>/dev/null | sort >"$run_dir/file-set.tsv"
grep -E -- '-s |emcc|em\+\+|wasm-ld|chocolate-doom' "$run_dir/build.stdout.txt" "$run_dir/build.stderr.txt" >"$run_dir/link-flags.txt" || true
find "$build_dir" -type f \( -name '*.o' -o -name '*.a' -o -name '*.wasm' -o -name '*.js' \) -printf '%p\n' | sort >"$run_dir/link-artifacts.txt"
while IFS= read -r artifact; do
    [[ -f "$artifact" ]] && sha256sum "$artifact"
done <"$run_dir/link-artifacts.txt" >"$run_dir/artifact-sha256.txt"
find "$build_dir" -type f -name '*.o' -print0 | xargs -0 -r llvm-nm --undefined-only >"$run_dir/undefined-symbols.txt" 2>"$run_dir/undefined-symbols.stderr.txt" || true

html_file="$(find "$build_dir" -type f -name 'chocolate-doom.html' -print -quit)"
if [[ -z "$html_file" && -f "$build_dir/src/chocolate-doom.js" && -f "$build_dir/src/chocolate-doom.wasm" ]]; then
    html_file="$build_dir/probe-shell.html"
    cat >"$html_file" <<'HTML'
<!doctype html><meta charset="utf-8"><title>SFHS upstream Wasm link probe</title>
<canvas id="canvas" width="640" height="400"></canvas>
<script>var Module={canvas:document.getElementById('canvas')};</script>
<script src="src/chocolate-doom.js"></script>
HTML
fi
if [[ -n "$html_file" && -f "$html_file" ]]; then
    printf 'html=%s\n' "$html_file" >"$run_dir/local-server-result.txt"
    server_port=18740
    python3 -m http.server "$server_port" --bind 127.0.0.1 --directory "$(dirname "$html_file")" >"$run_dir/local-server.stdout.txt" 2>&1 &
    server_pid=$!
    trap 'kill "$server_pid" 2>/dev/null || true' EXIT
    sleep 1
    if [[ -n "$server_port" ]] && curl --fail --silent --show-error "http://127.0.0.1:$server_port/$(basename "$html_file")" >"$run_dir/local-server-load.html"; then
        echo 'local_server_load=PASS' >>"$run_dir/local-server-result.txt"
    else
        echo 'local_server_load=FAIL' >>"$run_dir/local-server-result.txt"
    fi
else
    printf '%s\n' 'html=NONE' 'local_server_load=NOT_AVAILABLE' >"$run_dir/local-server-result.txt"
fi

if [[ "$build_status" -eq 0 ]]; then
    if grep -q 'local_server_load=PASS' "$run_dir/local-server-result.txt"; then
        classification='DIRECT_SUCCESS'
    else
        classification='UNRESOLVED_NO_LOCAL_SERVER_RESULT'
    fi
else
    if grep -Eiq 'i_(system|video|input|sound|sdlsound|sdlmusic)|SDL|emscripten|wasm|undefined reference|not declared' "$run_dir/build.stdout.txt" "$run_dir/build.stderr.txt"; then
        classification='BOUNDED_ADAPTER_FAILURE'
    else
        classification='ARCHITECTURE_BLOCKER_UNCLASSIFIED_FAILURE'
    fi
fi
printf '%s\n' "build_exit=$build_status" "classification=$classification" | tee "$run_dir/probe-summary.txt" "$log_dir/probe-summary.txt"
case "$classification" in
    DIRECT_SUCCESS|BOUNDED_ADAPTER_FAILURE)
        echo "PROBE_WASM_LINK=PASS classification=$classification" ;;
    *)
        echo "PROBE_WASM_LINK=BLOCKED classification=$classification" >&2
        exit 1 ;;
esac
