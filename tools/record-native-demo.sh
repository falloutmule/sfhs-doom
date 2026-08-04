#!/usr/bin/env bash
set -u

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

BIN="$ROOT/build/native/release/src/chocolate-doom"
IWAD="$ROOT/vendor-cache/freedoom/0.13.0/data/freedoom1.wad"
DEMO="$ROOT/tests/fixtures/open-demos/oracle.lmp"
EVIDENCE="$ROOT/evidence/task-runs/P01-DOOM-P1-070/record"
RAW_DEMO="$EVIDENCE/raw-recording.lmp"
NORMALIZED_DEMO="$EVIDENCE/normalized-recording.lmp"
STDOUT="$EVIDENCE/record.stdout"
STDERR="$EVIDENCE/record.stderr"
RESULT="$EVIDENCE/result.json"

if [[ ! -x "$BIN" || ! -f "$IWAD" ]]; then
    echo "RECORD_NATIVE_DEMO=BLOCKED missing native release or pinned open IWAD" >&2
    exit 1
fi

mkdir -p "$EVIDENCE" "$ROOT/build/runtime/P01/P1-070/record"
rm -f "$RAW_DEMO" "$NORMALIZED_DEMO" "$STDOUT" "$STDERR" "$RESULT"

set +e
xvfb-run -a bash -lc '
    export SDL_AUDIODRIVER=dummy HOME=/tmp/sfhs-p1-070-record
    stdbuf -o0 "$1" -iwad "$2" -record "$3" -warp 1 1 -skill 3 -window -width 640 -height 400 -nosound -nomusic \
        -config "$4" -savedir "$5" > "$6" 2> "$7" &
    pid=$!
    windows=
    for i in $(seq 1 300); do
        if grep -q "ST_Init: Init status bar" "$6" 2>/dev/null; then
            windows=$(
                { xdotool search --name "Chocolate Doom" 2>/dev/null || true; \
                  xdotool search --class chocolate-doom 2>/dev/null || true; } | sort -u
            )
            [[ -n "$windows" ]] && break
        fi
        ! kill -0 "$pid" 2>/dev/null && break
        sleep .1
    done
    if [[ -z "$windows" ]]; then
        xwininfo -root -tree >> "$6" 2>&1 || true
    fi
    echo "WINDOWS=${windows//$'\n'/,}" >> "$6"
    if [[ -n "$windows" ]]; then
        sleep 3
        for attempt in $(seq 1 20); do
            ! kill -0 "$pid" 2>/dev/null && break
            windows=$(
                { xdotool search --name "Chocolate Doom" 2>/dev/null || true; \
                  xdotool search --class chocolate-doom 2>/dev/null || true; } | sort -u
            )
            for win in $windows; do
                xdotool windowfocus --sync "$win" >/dev/null 2>&1 || true
                xdotool key --clearmodifiers q >/dev/null 2>&1 || true
            done
            sleep .5
        done
    fi
    for i in $(seq 1 240); do
        if ! kill -0 "$pid" 2>/dev/null; then
            wait "$pid"
            code=$?
            echo "GAME_EXIT=$code" >> "$6"
            exit 0
        fi
        sleep .1
    done
    kill "$pid" 2>/dev/null || true
    wait "$pid"
    echo "GAME_EXIT=124" >> "$6"
    exit 0
' _ "$BIN" "$IWAD" "${RAW_DEMO%.lmp}" "$ROOT/build/runtime/P01/P1-070/record.cfg" \
    "$ROOT/build/runtime/P01/P1-070/record" "$STDOUT" "$STDERR"
runner=$?
set -e

exit_code=$(sed -n 's/^GAME_EXIT=//p' "$STDOUT" | tail -n 1)
if [[ -z "$exit_code" ]]; then
    exit_code=124
fi
if [[ ! -f "$RAW_DEMO" ]]; then
    echo "RECORD_NATIVE_DEMO=FAIL native recording was not produced" >&2
    exit 1
fi

python3 "$ROOT/tools/demo-result.py" normalize-recording \
    --input "$RAW_DEMO" --output "$NORMALIZED_DEMO" --tics 1

if ! cmp -s "$NORMALIZED_DEMO" "$DEMO"; then
    echo "RECORD_NATIVE_DEMO=FAIL normalized native recording differs from the committed project fixture" >&2
    exit 1
fi

python3 "$ROOT/tools/demo-result.py" create \
    --output "$RESULT" --stdout "$STDOUT" --stderr "$STDERR" --demo "$DEMO" \
    --demo-source "project-created:DOOM-P1-070" --variant release --mode record --run 1 \
    --exit-code "$exit_code" --expected-exit 255 \
    --command "-record ${RAW_DEMO#"$ROOT"/} at skill 3; normalize first zero-input tic and compare with ${DEMO#"$ROOT"/}" \
    --environment "SDL_AUDIODRIVER=dummy; isolated HOME and savedir; xvfb-run; readiness-bound xdotool q"
