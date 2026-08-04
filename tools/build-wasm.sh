#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "$BASH_SOURCE")" && pwd -P)"
root="$(cd -- "$script_dir/.." && pwd -P)"
cd "$root"
source tools/wasm-env.sh >/dev/null

mode='all'
clean=0
run_root="$root/evidence/task-runs/P02-DOOM-P2-050"
build_root="$root/build/wasm/P2-050"

usage() { echo 'usage: tools/build-wasm.sh --all [--clean] | --native-control'; }
while (($#)); do
    case "$1" in
        --all) mode='all'; shift ;;
        --clean|--clean-build-dir) clean=1; shift ;;
        --native-control) mode='native-control'; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "unknown argument: $1" >&2; usage >&2; exit 2 ;;
    esac
done

mkdir -p "$run_root" "$root/evidence/logs/P02/P2-050" "$root/evidence/manifests/P02"

if [[ "$mode" == 'native-control' ]]; then
    control_dir="$run_root/native-control"
    mkdir -p "$control_dir"
    for variant in debug release oracle; do
        case "$variant" in
            debug) binary="$root/build/native/debug/src/chocolate-doom" ;;
            release) binary="$root/build/native/release/src/chocolate-doom" ;;
            oracle) binary="$root/build/native/oracle/src/chocolate-doom" ;;
        esac
        [[ -x "$binary" ]] || { echo "P2_NATIVE_CONTROL=BLOCKED missing $variant binary" >&2; exit 1; }
        SDL_AUDIODRIVER=dummy HOME="/tmp/sfhs-p2-050-$variant" "$binary" -version >"$control_dir/$variant.stdout.txt" 2>"$control_dir/$variant.stderr.txt"
    done
    echo 'P2_NATIVE_CONTROL=PASS' | tee "$control_dir/result.txt"
    exit 0
fi

[[ "$mode" == 'all' ]] || { usage >&2; exit 2; }
if ((clean)); then
    case "$build_root" in
        "$root/build/wasm/P2-050") rm -rf -- "$build_root" ;;
        *) echo 'unsafe P2-050 build deletion refused' >&2; exit 2 ;;
    esac
fi
mkdir -p "$build_root"

run_number=1
if [[ -f "$run_root/run-counter.txt" ]]; then
    run_number=$(( $(<"$run_root/run-counter.txt") + 1 ))
fi
printf '%s\n' "$run_number" >"$run_root/run-counter.txt"
run_id="P02-DOOM-P2-050-run-$run_number"

for variant in phase1-debug phase2-debug phase2-oracle; do
    variant_dir="$build_root/$variant"
    variant_run="$run_root/run-$run_number/$variant"
    mkdir -p "$variant_run"
    case "$variant" in
        phase1-debug)
            wad_name='freedoom1.wad'
            oracle=0
            build_type='Debug'
            ;;
        phase2-debug)
            wad_name='freedoom2.wad'
            oracle=0
            build_type='Debug'
            ;;
        phase2-oracle)
            wad_name='freedoom2.wad'
            oracle=1
            build_type='Debug'
            ;;
    esac
    wad="$root/vendor-cache/freedoom/0.13.0/data/$wad_name"
    [[ -f "$wad" ]] || { echo "missing open Freedoom input: $wad" >&2; exit 1; }
    if ((oracle)); then oracle_flag='ON'; else oracle_flag='OFF'; fi
    configure=(emcmake cmake -C "$root/cmake/SFHSWasm.cmake" -S . -B "$variant_dir" -G Ninja
        "-DCMAKE_BUILD_TYPE=$build_type" -DENABLE_SDL2_MIXER=ON -DENABLE_SDL2_NET=OFF
        -DCMAKE_C_COMPILER=emcc -DCMAKE_CXX_COMPILER=em++
        -DCMAKE_DISABLE_FIND_PACKAGE_FluidSynth=TRUE -DCMAKE_DISABLE_FIND_PACKAGE_SampleRate=TRUE
        -DCMAKE_DISABLE_FIND_PACKAGE_PNG=TRUE "-DSFHS_ORACLE_TEST=$oracle_flag"
        '-DCMAKE_EXE_LINKER_FLAGS=-sASYNCIFY -sEXIT_RUNTIME=1 -sINVOKE_RUN=0 -sEXPORTED_FUNCTIONS=_main -sEXPORTED_RUNTIME_METHODS=callMain,FS,ENV')
    printf '%q ' "${configure[@]}" >"$variant_run/configure.argv.txt"
    printf '\n' >>"$variant_run/configure.argv.txt"
    "${configure[@]}" >"$variant_run/configure.stdout.txt" 2>"$variant_run/configure.stderr.txt"
    cmake --build "$variant_dir" --target chocolate-doom >"$variant_run/build.stdout.txt" 2>"$variant_run/build.stderr.txt"
    mkdir -p "$variant_dir/data"
    cp -- "$wad" "$variant_dir/data/$wad_name"
    if grep -R --binary-files=without-match -q 'SINGLE_FILE' "$variant_dir/src"; then
        echo "embedded SINGLE_FILE marker in $variant" >&2
        exit 1
    fi
    hash_args=()
    if ((oracle)); then hash_args+=(--oracle); fi
    python3 tools/hash-wasm-build.py --variant "$variant" --build-dir "$variant_dir" \
        --data "$variant_dir/data/$wad_name" --manifest "$root/evidence/manifests/P02/$variant.json" \
        --run-dir "$variant_run" --run-id "$run_id-$variant" "${hash_args[@]}" \
        >"$variant_run/manifest.stdout.txt"
    find "$variant_dir/src" -maxdepth 1 -type f \( -name 'chocolate-doom.js' -o -name 'chocolate-doom.wasm' \) -exec sha256sum {} \; | sort >"$variant_run/artifact-hashes.txt"
    echo "WASM_VARIANT=$variant PASS run=$run_number"
done

if ((run_number > 1)); then
    for variant in phase1-debug phase2-debug phase2-oracle; do
        old="$run_root/run-$((run_number - 1))/$variant/artifact-hashes.txt"
        new="$run_root/run-$run_number/$variant/artifact-hashes.txt"
        if [[ -f "$old" && -f "$new" ]]; then
            cmp "$old" "$new" || { echo "WASM_REPRODUCIBILITY=FAIL variant=$variant" >&2; exit 1; }
        fi
    done
fi

printf '%s\n' "run=$run_number" 'WASM_REPRODUCIBILITY=PASS' | tee "$run_root/run-$run_number/reproducibility.txt"
echo 'BUILD_WASM=PASS'
