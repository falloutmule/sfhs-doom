#!/usr/bin/env bash
set -u

if [[ "${1:-}" != "--matrix" ]]; then
    echo "usage: bash tools/run-native-demo.sh --matrix" >&2
    exit 2
fi

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"
DEMO="$ROOT/tests/fixtures/open-demos/oracle.lmp"
IWAD="$ROOT/vendor-cache/freedoom/0.13.0/data/freedoom1.wad"
EVIDENCE="$ROOT/evidence/task-runs/P01-DOOM-P1-070/demo"

if [[ ! -f "$DEMO" || ! -f "$IWAD" ]]; then
    echo "RUN_NATIVE_DEMO=BLOCKED recording or pinned open IWAD is missing" >&2
    exit 1
fi

run_case() {
    local variant="$1" mode="$2" run="$3" demo_arg="$4" source="$5" timeout_loops="$6"
    local bin="$ROOT/build/native/$variant/src/chocolate-doom"
    local dir="$EVIDENCE/$source/$variant/$mode/run-$run"
    local stdout="$dir/stdout.txt" stderr="$dir/stderr.txt" result="$dir/result.json"
    local config="$ROOT/build/runtime/P01/P1-070/$source-$variant-$mode-$run.cfg"
    local extra_config="$ROOT/build/runtime/P01/P1-070/$source-$variant-$mode-$run-extra.cfg"
    local savedir="$ROOT/build/runtime/P01/P1-070/$source-$variant-$mode-$run"
    mkdir -p "$dir" "$savedir"
    printf 'show_endoom                   0\n' > "$extra_config"
    local strict_arg=()
    if [[ "$mode" == strict ]]; then strict_arg=(-strictdemos); fi
    local command_text="${bin#"$ROOT"} -iwad ${IWAD#"$ROOT"} ${strict_arg[*]} -playdemo $demo_arg -window -width 640 -height 400 -nosound -nomusic -extraconfig ${extra_config#"$ROOT"}"
    set +e
    xvfb-run -a bash -lc '
        out="$1"; err="$2"; loops="$3"; shift 3
        "$@" > "$out" 2> "$err" &
        pid=$!
        for i in $(seq 1 "$loops"); do
            if ! kill -0 "$pid" 2>/dev/null; then
                wait "$pid"; code=$?
                echo "GAME_EXIT=$code" >> "$out"
                exit 0
            fi
            sleep .1
        done
        kill "$pid" 2>/dev/null || true
        wait "$pid"
        echo "GAME_EXIT=124" >> "$out"
        exit 0
    ' _ "$stdout" "$stderr" "$timeout_loops" env SDL_AUDIODRIVER=dummy \
        HOME="/tmp/sfhs-p1-070-$source-$variant-$mode-$run" "$bin" -iwad "$IWAD" \
        "${strict_arg[@]}" -playdemo "$demo_arg" -window -width 640 -height 400 \
        -nosound -nomusic -config "$config" -extraconfig "$extra_config" -savedir "$savedir"
    set -e
    local exit_code=$(sed -n 's/^GAME_EXIT=//p' "$stdout" | tail -n 1)
    [[ -n "$exit_code" ]] || exit_code=124
    local expected=(0)
    local demo_option=()
    if [[ "$source" == project ]]; then demo_option=(--demo "$DEMO"); fi
    python3 "$ROOT/tools/demo-result.py" create --output "$result" --stdout "$stdout" --stderr "$stderr" \
        "${demo_option[@]}" --demo-source "$source" --variant "$variant" --mode "$mode" --run "$run" \
        --exit-code "$exit_code" --expected-exit "${expected[@]}" --command "$command_text" \
        --environment "SDL_AUDIODRIVER=dummy; show_endoom=0; explicit 640x400 window; isolated HOME and savedir; xvfb-run" >/dev/null
    return $?
}

failed=0
for source in project official-freedoom-demo1; do
    demo_arg="$DEMO"
    if [[ "$source" == official-freedoom-demo1 ]]; then demo_arg=DEMO1; fi
    for variant in debug release; do
        if [[ "$source" == official-freedoom-demo1 && "$variant" == debug ]]; then continue; fi
        for mode in normal strict; do
            runs=3
            if [[ "$source" == official-freedoom-demo1 ]]; then runs=1; fi
            for run in $(seq 1 "$runs"); do
                loops=600
                if [[ "$source" == official-freedoom-demo1 ]]; then loops=3600; fi
                if ! run_case "$variant" "$mode" "$run" "$demo_arg" "$source" "$loops"; then failed=1; fi
            done
        done
    done
done

python3 "$ROOT/tools/demo-result.py" aggregate --root "$EVIDENCE" --output "$EVIDENCE/matrix.json" >/dev/null || failed=1
if [[ "$failed" -ne 0 ]]; then
    echo "RUN_NATIVE_DEMO=FAIL matrix=$EVIDENCE/matrix.json" >&2
    exit 1
fi
echo "RUN_NATIVE_DEMO=PASS matrix=$EVIDENCE/matrix.json"
