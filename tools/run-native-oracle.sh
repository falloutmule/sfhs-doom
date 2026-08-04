#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" != "--repeat" || "${2:-}" != "5" || $# -ne 2 ]]; then
    echo "usage: bash tools/run-native-oracle.sh --repeat 5" >&2
    exit 2
fi

ROOT=$(cd "$(dirname "$0")/.." && pwd -P)
cd "$ROOT"

BIN="$ROOT/build/native/oracle/src/chocolate-doom"
IWAD="$ROOT/vendor-cache/freedoom/0.13.0/data/freedoom1.wad"
RUNTIME="$ROOT/build/runtime/P01/P1-080"
RUN_SET="$ROOT/evidence/task-runs/P01-DOOM-P1-080/oracle-run-set"
OFF_BUILD="$ROOT/build/native/oracle-off"
ORDER_A="$ROOT/tests/fixtures/open-pwads/order-a.wad"
ORDER_B="$ROOT/tests/fixtures/open-pwads/order-b.wad"

[[ -x "$BIN" && -f "$IWAD" && -f "$ORDER_A" && -f "$ORDER_B" ]] \
    || { echo "RUN_NATIVE_ORACLE=BLOCKED missing Oracle binary or pinned open inputs" >&2; exit 1; }

case "$RUN_SET" in "$ROOT"/evidence/task-runs/P01-DOOM-P1-080/oracle-run-set) ;; *) exit 1 ;; esac
case "$OFF_BUILD" in "$ROOT"/build/native/oracle-off) ;; *) exit 1 ;; esac
rm -rf -- "$RUN_SET" "$RUNTIME" "$OFF_BUILD"
mkdir -p "$RUN_SET" "$RUNTIME"
python3 tools/oracle/make-inputs.py --output "$RUNTIME"
DEMO="$RUNTIME/oracle-140.lmp"
EXTRA="$RUNTIME/extra.cfg"

run_oracle() {
    local scenario="$1"
    shift
    local run_dir="$RUN_SET/$scenario"
    local stdout="$run_dir/stdout.txt"
    local stderr="$run_dir/stderr.txt"
    local config="$RUNTIME/${scenario//\//-}.cfg"
    local savedir="$RUNTIME/${scenario//\//-}-save"
    mkdir -p "$run_dir" "$savedir"
    local command_text="build/native/oracle/src/chocolate-doom -iwad vendor-cache/freedoom/0.13.0/data/freedoom1.wad -timedemo build/runtime/P01/P1-080/oracle-140.lmp $*"
    set +e
    SFHS_ORACLE_OUTPUT="$run_dir" SDL_AUDIODRIVER=dummy HOME="/tmp/sfhs-p1-080-${scenario//\//-}" \
        xvfb-run -a "$BIN" -iwad "$IWAD" -timedemo "$DEMO" -window -width 640 -height 400 \
        -nosound -nomusic -config "$config" -extraconfig "$EXTRA" -savedir "$savedir" "$@" \
        >"$stdout" 2>"$stderr"
    local exit_code=$?
    set -e
    python3 tools/oracle/collect-run.py --run-dir "$run_dir" --binary "$BIN" --demo "$DEMO" \
        --stdout "$stdout" --stderr "$stderr" --scenario "$scenario" --exit-code "$exit_code" \
        --command "$command_text"
}

for run in 1 2 3 4 5; do
    run_oracle "baseline/run-$run"
done
run_oracle order-ab -file "$ORDER_A" "$ORDER_B"
run_oracle order-ba -file "$ORDER_B" "$ORDER_A"
run_oracle deh-effect -deh "$RUNTIME/oracle-effect.deh"

cmake -S . -B "$OFF_BUILD" -G Ninja -DCMAKE_BUILD_TYPE=Debug \
    -DENABLE_SDL2_NET=OFF -DCMAKE_DISABLE_FIND_PACKAGE_FluidSynth=TRUE \
    -DCMAKE_DISABLE_FIND_PACKAGE_SampleRate=TRUE -DCMAKE_DISABLE_FIND_PACKAGE_PNG=TRUE \
    -DSFHS_ORACLE_TEST=OFF >"$RUN_SET/instrumentation-off-configure.stdout.txt" \
    2>"$RUN_SET/instrumentation-off-configure.stderr.txt"
cmake --build "$OFF_BUILD" --target chocolate-doom \
    >"$RUN_SET/instrumentation-off-build.stdout.txt" 2>"$RUN_SET/instrumentation-off-build.stderr.txt"

OFF_DIR="$RUN_SET/instrumentation-off"
mkdir -p "$OFF_DIR" "$RUNTIME/off-save"
set +e
SFHS_ORACLE_OUTPUT="$OFF_DIR" SDL_AUDIODRIVER=dummy HOME=/tmp/sfhs-p1-080-off \
    xvfb-run -a "$OFF_BUILD/src/chocolate-doom" -iwad "$IWAD" -timedemo "$DEMO" \
    -window -width 640 -height 400 -nosound -nomusic -config "$RUNTIME/off.cfg" \
    -extraconfig "$EXTRA" -savedir "$RUNTIME/off-save" >"$OFF_DIR/stdout.txt" 2>"$OFF_DIR/stderr.txt"
off_exit=$?
set -e
python3 - "$OFF_DIR" "$off_exit" <<'PY'
import json
from pathlib import Path
import re
import sys

root = Path(sys.argv[1])
exit_code = int(sys.argv[2])
stdout = (root / "stdout.txt").read_text(encoding="utf-8", errors="replace")
match = re.search(r"timed\s+(\d+)\s+gametics", stdout, re.IGNORECASE)
end_tic = int(match.group(1)) if match else None
artifacts = sorted(path.name for path in root.glob("state.jsonl")) + sorted(path.name for path in root.glob("frame-*.bin"))
result = {"schema_version": 1, "task": "DOOM-P1-080", "status": "PASS" if exit_code == 255 and end_tic == 140 and not artifacts else "FAIL", "exit_code": exit_code, "end_tic": end_tic, "oracle_artifacts": artifacts}
(root / "result.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
if result["status"] != "PASS":
    raise SystemExit(1)
PY

python3 tools/oracle/compare-runs.py "$RUN_SET"
echo "RUN_NATIVE_ORACLE=PASS run_set=$RUN_SET"
