#!/usr/bin/env bash
set -euo pipefail
script_dir="$(cd -- "$(dirname -- "$BASH_SOURCE")" && pwd -P)"
root="$(cd -- "$script_dir/.." && pwd -P)"
cd "$root"
source tools/wasm-env.sh >/dev/null
oracle=0; output="$root/dist/sfhs-doom-freedoom2.html"
while (($#)); do
  case "$1" in
    --oracle) oracle=1; shift ;;
    --output) output="$2"; shift 2 ;;
    *) echo 'usage: tools/build-single-file.sh [--oracle] [--output PATH]' >&2; exit 2 ;;
  esac
done
wad="$root/vendor-cache/freedoom/0.13.0/data/freedoom2.wad"
[[ -f "$wad" ]] || { echo "missing open Freedoom input: $wad" >&2; exit 1; }
if ((oracle)); then build="$root/build/wasm/p3-single-file/phase2-oracle"; name=oracle; else build="$root/build/wasm/p3-single-file/phase2-product"; name=product; fi
case "$build" in
  "$root/build/wasm/p3-single-file/phase2-product"|"$root/build/wasm/p3-single-file/phase2-oracle") rm -rf -- "$build" ;;
  *) echo 'unsafe P3 build deletion refused' >&2; exit 2 ;;
esac
run="$root/evidence/task-runs/P03-DOOM-P3-020/$name"; mkdir -p "$run"
oracle_flag=OFF; if ((oracle)); then oracle_flag=ON; fi
flags="-sASYNCIFY -sEXIT_RUNTIME=1 -sINVOKE_RUN=0 -sEXPORTED_FUNCTIONS=_main -sEXPORTED_RUNTIME_METHODS=callMain,FS,ENV -sSINGLE_FILE=1 --embed-file $wad@/freedoom2.wad"
configure=(emcmake cmake -C "$root/cmake/SFHSWasm.cmake" -S . -B "$build" -G Ninja
  -DCMAKE_BUILD_TYPE=Debug -DENABLE_SDL2_MIXER=ON -DENABLE_SDL2_NET=OFF -DCMAKE_C_COMPILER=emcc -DCMAKE_CXX_COMPILER=em++
  -DCMAKE_DISABLE_FIND_PACKAGE_FluidSynth=TRUE -DCMAKE_DISABLE_FIND_PACKAGE_SampleRate=TRUE -DCMAKE_DISABLE_FIND_PACKAGE_PNG=TRUE
  "-DSFHS_ORACLE_TEST=$oracle_flag" "-DCMAKE_EXE_LINKER_FLAGS=$flags")
printf '%q ' "${configure[@]}" >"$run/configure.argv.txt"; printf '\n' >>"$run/configure.argv.txt"
"${configure[@]}" >"$run/configure.stdout.txt" 2>"$run/configure.stderr.txt"
cmake --build "$build" --target chocolate-doom >"$run/build.stdout.txt" 2>"$run/build.stderr.txt"
js="$build/src/chocolate-doom.js"; [[ -f "$js" ]] || { echo "missing generated loader: $js" >&2; exit 1; }
if grep -R --binary-files=without-match -q -- 'chocolate-doom.wasm' "$build/src"; then echo 'P3_SINGLE_FILE=FAIL external Wasm reference' >&2; exit 1; fi
python3 tools/package-inline-js.py --shell web/p3/shell.html --engine-js "$js" --output "$output" >"$run/package.stdout.txt"
sha256sum "$output" >"$run/artifact-sha256.txt"
printf '%s\n' 'SINGLE_FILE=1' "--embed-file $wad@/freedoom2.wad" "oracle=$oracle" >"$run/profile.txt"
echo "P3_SINGLE_FILE=PASS output=$output"
