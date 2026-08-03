#!/usr/bin/env bash
set -euo pipefail

[[ $# -eq 1 ]] || { echo "usage: $0 phase1|phase2" >&2; exit 2; }
EDITION="$1"
case "$EDITION" in
    phase1) WAD_NAME=freedoom1.wad; WARP=(1 1); DISPLAY_NUM=101 ;;
    phase2) WAD_NAME=freedoom2.wad; WARP=(1); DISPLAY_NUM=102 ;;
    *) echo "unknown IWAD edition: $EDITION" >&2; exit 2 ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
cd "$ROOT"

RUNTIME="$ROOT/build/runtime/P01/P1-050/$EDITION"
RUN_EVIDENCE="$ROOT/evidence/task-runs/P01-DOOM-P1-050/$EDITION"
SCREENSHOT="$ROOT/evidence/screenshots/P01/P1-050/${EDITION}-gameplay.png"
case "$RUNTIME" in "$ROOT"/build/runtime/P01/P1-050/*) ;; *) echo "unsafe runtime path" >&2; exit 1 ;; esac
rm -rf -- "$RUNTIME"
mkdir -p "$RUNTIME/home" "$RUN_EVIDENCE" "$(dirname "$SCREENSHOT")"

EXECUTABLE="$ROOT/build/native/release/src/chocolate-doom"
IWAD="$ROOT/vendor-cache/freedoom/0.13.0/data/$WAD_NAME"
[[ -x "$EXECUTABLE" ]] || { echo "native executable missing" >&2; exit 1; }
[[ -f "$IWAD" ]] || { echo "IWAD missing" >&2; exit 1; }

DISPLAY=":$DISPLAY_NUM"
export DISPLAY
Xvfb "$DISPLAY" -screen 0 640x480x24 >"$RUN_EVIDENCE/xvfb.stdout.txt" 2>"$RUN_EVIDENCE/xvfb.stderr.txt" &
XVFB_PID=$!
GAME_PID=""
cleanup() {
    if [[ -n "$GAME_PID" ]] && kill -0 "$GAME_PID" 2>/dev/null; then kill "$GAME_PID" 2>/dev/null || true; wait "$GAME_PID" 2>/dev/null || true; fi
    if kill -0 "$XVFB_PID" 2>/dev/null; then kill "$XVFB_PID" 2>/dev/null || true; wait "$XVFB_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT
sleep 1
kill -0 "$XVFB_PID" 2>/dev/null || { echo "Xvfb failed" >&2; exit 1; }

ARGV=("$EXECUTABLE" -iwad "$IWAD" -warp "${WARP[@]}" -skill 3 -window -width 640 -height 400 -config "$RUNTIME/default.cfg" -savedir "$RUNTIME")
printf '%q ' "${ARGV[@]}" >"$RUN_EVIDENCE/argv.txt"
printf '\n' >>"$RUN_EVIDENCE/argv.txt"
printf 'DISPLAY=%s\nSDL_AUDIODRIVER=dummy\nHOME=%s\n' "$DISPLAY" "$RUNTIME/home" >"$RUN_EVIDENCE/environment.txt"

HOME="$RUNTIME/home" SDL_AUDIODRIVER=dummy "${ARGV[@]}" >"$RUN_EVIDENCE/game.stdout.txt" 2>"$RUN_EVIDENCE/game.stderr.txt" &
GAME_PID=$!

for _ in $(seq 1 20); do
    kill -0 "$GAME_PID" 2>/dev/null || { echo "game exited before gameplay capture" >&2; cat "$RUN_EVIDENCE/game.stderr.txt" >&2; exit 1; }
    if grep -q "Freedoom: Phase" "$RUN_EVIDENCE/game.stdout.txt" && xdotool search --name 'Chocolate Doom' >/dev/null 2>&1; then
        break
    fi
    sleep 1
done
grep -q "Freedoom: Phase" "$RUN_EVIDENCE/game.stdout.txt" || { echo "IWAD detection missing" >&2; exit 1; }
sleep 4
kill -0 "$GAME_PID" 2>/dev/null || { echo "game unhealthy before capture" >&2; exit 1; }
import -display "$DISPLAY" -window root "$SCREENSHOT"

IDENTIFY="$(identify -format '%w %h %[fx:standard_deviation] %k' "$SCREENSHOT")"
read -r WIDTH HEIGHT DEVIATION COLORS <<<"$IDENTIFY"
[[ "$WIDTH" -eq 640 && "$HEIGHT" -eq 480 ]] || { echo "unexpected screenshot dimensions: $IDENTIFY" >&2; exit 1; }
python3 - "$DEVIATION" "$COLORS" <<'PY'
import sys
deviation = float(sys.argv[1])
colors = int(sys.argv[2])
if deviation < 0.05 or colors < 64:
    raise SystemExit(f"blank/low-information screenshot: deviation={deviation} colors={colors}")
PY

kill "$GAME_PID"
wait "$GAME_PID" 2>/dev/null || true
GAME_PID=""

# Separately prove that the system SDL audio backend reaches mixer setup.
HOME="$RUNTIME/home" SDL_AUDIODRIVER=pulseaudio "${ARGV[@]}" >"$RUN_EVIDENCE/real-audio.stdout.txt" 2>"$RUN_EVIDENCE/real-audio.stderr.txt" &
GAME_PID=$!
for _ in $(seq 1 12); do
    if grep -q "S_Init: Setting up sound" "$RUN_EVIDENCE/real-audio.stdout.txt"; then break; fi
    kill -0 "$GAME_PID" 2>/dev/null || break
    sleep 1
done
grep -q "S_Init: Setting up sound" "$RUN_EVIDENCE/real-audio.stdout.txt" || { echo "real mixer initialization not observed" >&2; exit 1; }
kill -0 "$GAME_PID" 2>/dev/null || { echo "real-audio probe exited during initialization" >&2; exit 1; }
kill "$GAME_PID"
wait "$GAME_PID" 2>/dev/null || true
GAME_PID=""

find "$RUNTIME" -type f -printf '%P\n' | sort >"$RUN_EVIDENCE/runtime-writes.txt"
sha256sum "$SCREENSHOT" >"$RUN_EVIDENCE/screenshot.sha256.txt"
printf 'edition=%s\niwad=%s\nwarp=%s\nwidth=%s\nheight=%s\nstandard_deviation=%s\ncolors=%s\nprocess_healthy_at_capture=true\nreal_mixer_setup_observed=true\n' \
    "$EDITION" "$WAD_NAME" "${WARP[*]}" "$WIDTH" "$HEIGHT" "$DEVIATION" "$COLORS" >"$RUN_EVIDENCE/result.txt"
echo "NATIVE_FRAME_CAPTURE=PASS edition=$EDITION screenshot=${SCREENSHOT#$ROOT/}"
