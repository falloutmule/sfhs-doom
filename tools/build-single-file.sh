#!/usr/bin/env bash
set -euo pipefail
script_dir="$(cd -- "$(dirname -- "$BASH_SOURCE")" && pwd -P)"
root="$(cd -- "$script_dir/.." && pwd -P)"
cd "$root"
source tools/wasm-env.sh >/dev/null
oracle=0; profile=p3; output=''; output_explicit=0
while (($#)); do
  case "$1" in
    --oracle) oracle=1; shift ;;
    --profile) profile="$2"; shift 2 ;;
    --output) output="$2"; output_explicit=1; shift 2 ;;
    *) echo 'usage: tools/build-single-file.sh [--oracle] [--profile p3|android] [--output PATH]' >&2; exit 2 ;;
  esac
done
case "$profile" in
  p3) shell="$root/web/p3/shell.html"; output="${output:-$root/dist/sfhs-doom-freedoom2.html}"; build_root="$root/build/wasm/p3-single-file"; run_root="$root/evidence/task-runs/P03-DOOM-P3-020"; profile_label=P3_SINGLE_FILE ;;
  android)
    ((output_explicit)) || { echo 'Android profile requires an explicit --output path' >&2; exit 2; }
    [[ "$output" != "$root/dist/sfhs-doom-freedoom2.html" ]] || { echo 'Android profile refuses the protected P3 output path' >&2; exit 2; }
    shell="$root/web/p6/shell.html"; build_root="$root/build/wasm/p6-android"; run_root="$root/build/runtime/P06-build"; profile_label=P6_ANDROID_SINGLE_FILE ;;
  *) echo "unknown build profile: $profile" >&2; exit 2 ;;
esac
wad="$root/vendor-cache/freedoom/0.13.0/data/freedoom2.wad"
[[ -f "$wad" ]] || { echo "missing open Freedoom input: $wad" >&2; exit 1; }
if ((oracle)); then build="$build_root/phase2-oracle"; name=oracle; else build="$build_root/phase2-product"; name=product; fi
case "$build" in
  "$build_root/phase2-product"|"$build_root/phase2-oracle") rm -rf -- "$build" ;;
  *) echo 'unsafe profile build deletion refused' >&2; exit 2 ;;
esac
run="$run_root/$name"; mkdir -p "$run"
oracle_flag=OFF; if ((oracle)); then oracle_flag=ON; fi
exports="['_main','_sfhs_mobile_input_version','_sfhs_mobile_input_set_held','_sfhs_mobile_input_pulse','_sfhs_mobile_input_post_look','_sfhs_mobile_input_release_all','_sfhs_mobile_input_debug_snapshot','_sfhs_mobile_game_input_debug_snapshot','_sfhs_mobile_state_snapshot','_sfhs_mobile_state_lines','_sfhs_mobile_video_probe','_sfhs_mobile_present_configure_renderer','_sfhs_mobile_present_debug_snapshot']"
flags="-sASYNCIFY -sEXIT_RUNTIME=1 -sINVOKE_RUN=0 -sEXPORTED_FUNCTIONS=$exports -sEXPORTED_RUNTIME_METHODS=callMain,ccall,cwrap,FS,ENV,HEAP32 -sSINGLE_FILE=1 --embed-file $wad@/freedoom2.wad"
configure=(emcmake cmake -C "$root/cmake/SFHSWasm.cmake" -S . -B "$build" -G Ninja
  -DCMAKE_BUILD_TYPE=Debug -DENABLE_SDL2_MIXER=ON -DENABLE_SDL2_NET=OFF -DCMAKE_C_COMPILER=emcc -DCMAKE_CXX_COMPILER=em++
  -DCMAKE_DISABLE_FIND_PACKAGE_FluidSynth=TRUE -DCMAKE_DISABLE_FIND_PACKAGE_SampleRate=TRUE -DCMAKE_DISABLE_FIND_PACKAGE_PNG=TRUE
  -DHAVE_DECL_STRCASECMP=1 -DHAVE_DECL_STRNCASECMP=1 -DHAVE_DIRENT_H=1
  "-DSFHS_ORACLE_TEST=$oracle_flag" "-DCMAKE_EXE_LINKER_FLAGS=$flags")
printf '%q ' "${configure[@]}" >"$run/configure.argv.txt"; printf '\n' >>"$run/configure.argv.txt"
"${configure[@]}" >"$run/configure.stdout.txt" 2>"$run/configure.stderr.txt"
cmake --build "$build" --target chocolate-doom >"$run/build.stdout.txt" 2>"$run/build.stderr.txt"
js="$build/src/chocolate-doom.js"; [[ -f "$js" ]] || { echo "missing generated loader: $js" >&2; exit 1; }
if grep -R --binary-files=without-match -q -- 'chocolate-doom.wasm' "$build/src"; then echo "$profile_label=FAIL external Wasm reference" >&2; exit 1; fi
python3 tools/package-inline-js.py --shell "$shell" --engine-js "$js" --output "$output" >"$run/package.stdout.txt"
sha256sum "$output" >"$run/artifact-sha256.txt"
printf '%s\n' 'SINGLE_FILE=1' "--embed-file $wad@/freedoom2.wad" "oracle=$oracle" "profile=$profile" >"$run/profile.txt"
echo "$profile_label=PASS output=$output"
