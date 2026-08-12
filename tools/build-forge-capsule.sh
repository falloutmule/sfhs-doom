#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "$BASH_SOURCE")" && pwd -P)"
root="$(cd -- "$script_dir/.." && pwd -P)"
cd "$root"
source tools/wasm-env.sh >/dev/null

output=''
thin_output=''
oracle=0
capsule_version=2
while (($#)); do
  case "$1" in
    --output) output="$2"; shift 2 ;;
    --thin-output) thin_output="$2"; shift 2 ;;
    --oracle) oracle=1; shift ;;
    --capsule-version) capsule_version="$2"; shift 2 ;;
    *) echo 'usage: tools/build-forge-capsule.sh --capsule-version 2 --output PATH [--thin-output PATH] [--oracle]' >&2; exit 2 ;;
  esac
done
[[ -n "$output" ]] || { echo 'Forge build requires --output' >&2; exit 2; }
[[ "$capsule_version" == '2' ]] || { echo 'current Forge source supports capsule version 2 only' >&2; exit 2; }
[[ "$output" != "$root/dist/sfhs-doom-freedoom2.html" ]] || { echo 'Forge build refuses protected P3 output' >&2; exit 2; }
[[ "$output" != "$root/dist/sfhs-doom-forge-v1.html" && "$output" != 'dist/sfhs-doom-forge-v1.html' ]] || { echo 'Forge build refuses protected V1 output' >&2; exit 2; }

wad="$root/vendor-cache/freedoom/0.13.0/data/freedoom2.wad"
[[ -f "$wad" ]] || { echo "missing open Freedoom input: $wad" >&2; exit 1; }
sfhs_root="$(cd -- "$root/../.worktrees/sfhs-mobile-controls-v1" && pwd -P)"
esbuild="${SFHS_MOBILE_CONTROLS_ESBUILD:-$sfhs_root/node_modules/.bin/esbuild}"
[[ -x "$esbuild" ]] || { echo "missing frozen SFHS esbuild: $esbuild" >&2; exit 1; }

build_root="$root/build/wasm/p7-forge-v$capsule_version"
if ((oracle)); then build="$build_root/oracle"; name=oracle; else build="$build_root/product"; name=product; fi
case "$build" in "$build_root/product"|"$build_root/oracle") rm -rf -- "$build" ;; *) exit 2 ;; esac
run="$root/build/runtime/P07-forge-v$capsule_version/$name"
controls_bundle="$run/sfhs-mobile-controls-v1.iife.js"
controls_shell="$run/forge-shell-with-controls.html"
mkdir -p "$run"

if grep -qi microsoft /proc/version 2>/dev/null; then
  command -v cmd.exe >/dev/null || { echo 'WSL cannot reach pinned Windows esbuild' >&2; exit 1; }
  cmd.exe /d /c "$(wslpath -w "$esbuild.cmd") $(wslpath -w "$root/vendor/sfhs-mobile-controls-v1/src/index.ts") --bundle --platform=browser --format=iife --global-name=SFHSMobileControls --target=es2022 --outfile=$(wslpath -w "$controls_bundle")"
else
  "$esbuild" "$root/vendor/sfhs-mobile-controls-v1/src/index.ts" --bundle --platform=browser --format=iife --global-name=SFHSMobileControls --target=es2022 --outfile="$controls_bundle"
fi
sha256sum "$controls_bundle" >"$run/sfhs-mobile-controls-bundle.sha256"
python3 tools/inject-mobile-controls-bundle.py --shell web/p7/forge-shell.html --bundle "$controls_bundle" --output "$controls_shell"

oracle_flag=OFF; if ((oracle)); then oracle_flag=ON; fi
exports="['_main','_sfhs_mobile_input_version','_sfhs_mobile_input_set_held','_sfhs_mobile_input_pulse','_sfhs_mobile_input_post_look','_sfhs_mobile_input_release_all','_sfhs_mobile_input_debug_snapshot','_sfhs_mobile_game_input_debug_snapshot','_sfhs_mobile_state_snapshot','_sfhs_mobile_state_lines','_sfhs_mobile_video_probe','_sfhs_mobile_present_configure_renderer','_sfhs_mobile_present_debug_snapshot','_sfhs_mobile_hud_snapshot','_sfhs_mobile_hud_pixels']"
runtime_methods='callMain,ccall,cwrap,FS,ENV,HEAP32,HEAPU8'
flags="-sASYNCIFY -sEXIT_RUNTIME=1 -sINVOKE_RUN=0 -sEXPORTED_FUNCTIONS=$exports -sEXPORTED_RUNTIME_METHODS=$runtime_methods -sSINGLE_FILE=1"
configure=(emcmake cmake -C "$root/cmake/SFHSWasm.cmake" -S . -B "$build" -G Ninja
  -DCMAKE_BUILD_TYPE=Debug -DENABLE_SDL2_MIXER=ON -DENABLE_SDL2_NET=OFF -DCMAKE_C_COMPILER=emcc -DCMAKE_CXX_COMPILER=em++
  -DCMAKE_DISABLE_FIND_PACKAGE_FluidSynth=TRUE -DCMAKE_DISABLE_FIND_PACKAGE_SampleRate=TRUE -DCMAKE_DISABLE_FIND_PACKAGE_PNG=TRUE
  -DHAVE_DECL_STRCASECMP=1 -DHAVE_DECL_STRNCASECMP=1 -DHAVE_DIRENT_H=1
  "-DSFHS_ORACLE_TEST=$oracle_flag" -DSFHS_MOBILE_DETACHED_HUD=ON "-DCMAKE_EXE_LINKER_FLAGS=$flags")
printf '%q ' "${configure[@]}" >"$run/configure.argv.txt"; printf '\n' >>"$run/configure.argv.txt"
"${configure[@]}" >"$run/configure.stdout.txt" 2>"$run/configure.stderr.txt"
cmake --build "$build" --target chocolate-doom >"$run/build.stdout.txt" 2>"$run/build.stderr.txt"
js="$build/src/chocolate-doom.js"
[[ -f "$js" ]] || { echo "missing generated loader: $js" >&2; exit 1; }
grep -q -- '--embed-file' "$run/configure.argv.txt" && { echo 'FORGE_BUILD_FAIL embedded file flag present' >&2; exit 1; }
if grep -R --binary-files=without-match -q -- 'chocolate-doom.wasm' "$build/src"; then echo 'FORGE_BUILD_FAIL external Wasm reference' >&2; exit 1; fi

python3 tools/package-forge-capsule.py --shell "$controls_shell" --engine-js "$js" --analyzer-worker web/p7/forge-analyzer-worker.js --wad "$wad" --mode full --capsule-version "$capsule_version" --output "$output" >"$run/package-full.stdout.txt"
LC_ALL=C sed -i 's/[[:blank:]]\+$//' "$output"
sha256sum "$output" >"$run/artifact-full-sha256.txt"
if [[ -n "$thin_output" ]]; then
  python3 tools/package-forge-capsule.py --shell "$controls_shell" --engine-js "$js" --analyzer-worker web/p7/forge-analyzer-worker.js --wad "$wad" --mode thin --capsule-version "$capsule_version" --output "$thin_output" >"$run/package-thin.stdout.txt"
  LC_ALL=C sed -i 's/[[:blank:]]\+$//' "$thin_output"
  sha256sum "$thin_output" >"$run/artifact-thin-sha256.txt"
fi
printf '%s\n' "capsule_version=$capsule_version" 'SINGLE_FILE=1' 'embedded_engine_payload=0' 'payload_compression=gzip-9-mtime-0' 'payload_chunk_size=196608' 'local_analyzer_worker=embedded' "oracle=$oracle" >"$run/profile.txt"
echo "P7_FORGE_SINGLE_FILE=PASS output=$output"
