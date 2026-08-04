#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" != "--repeat" || "${2:-}" != "5" || $# -ne 2 ]]; then
    echo "usage: bash tools/run-native-p2-control.sh --repeat 5" >&2
    exit 2
fi

ROOT=$(cd "$(dirname "$0")/.." && pwd -P)
cd "$ROOT"
BIN="$ROOT/build/native/oracle/src/chocolate-doom"
IWAD="$ROOT/vendor-cache/freedoom/0.13.0/data/freedoom2.wad"
RUNTIME="$ROOT/build/runtime/P02/P2-085-native"
RUN_SET="$ROOT/evidence/task-runs/P02-DOOM-P2-085/native"

[[ -x "$BIN" && -f "$IWAD" ]] || {
    echo "RUN_NATIVE_P2_CONTROL=BLOCKED missing Oracle binary or open IWAD" >&2
    exit 1
}
case "$RUN_SET" in "$ROOT"/evidence/task-runs/P02-DOOM-P2-085/native) ;; *) exit 1 ;; esac
case "$RUNTIME" in "$ROOT"/build/runtime/P02/P2-085-native) ;; *) exit 1 ;; esac
rm -rf -- "$RUN_SET" "$RUNTIME"
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
    local command_text="build/native/oracle/src/chocolate-doom -iwad vendor-cache/freedoom/0.13.0/data/freedoom2.wad -timedemo build/runtime/P02/P2-085-native/oracle-140.lmp $*"
    set +e
    SFHS_ORACLE_OUTPUT="$run_dir" SDL_AUDIODRIVER=dummy HOME="/tmp/sfhs-p2-085-${scenario//\//-}" \
        timeout --kill-after=5s 20s xvfb-run -a "$BIN" -iwad "$IWAD" -timedemo "$DEMO" -window -width 640 -height 400 \
        -nosound -nomusic -config "$config" -extraconfig "$EXTRA" -savedir "$savedir" "$@" \
        >"$stdout" 2>"$stderr"
    local exit_code=$?
    set -e
    python3 - "$run_dir" "$stdout" "$stderr" "$scenario" "$exit_code" "$command_text" <<'PY'
import hashlib
import json
from pathlib import Path
import re
import sys

run_dir, stdout_path, stderr_path, scenario, exit_code, command = sys.argv[1:]
root = Path(run_dir)
states = []
failures = []
try:
    states = [json.loads(line) for line in (root / "state.jsonl").read_text().splitlines()]
except Exception as error:
    failures.append(f"state unreadable: {error}")
if [item.get("tic") for item in states] != [0, 1, 35, 70, 140] or not states or states[-1].get("final") is not True:
    failures.append("wrong state checkpoint sequence")
frames = []
for tic in (1, 35, 70, 140):
    path = root / f"frame-{tic:03d}.bin"
    if not path.is_file() or path.stat().st_size != 320 * 200:
        failures.append(f"missing or invalid frame {tic}")
    else:
        frames.append({"tic": tic, "size_bytes": path.stat().st_size, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
stdout = Path(stdout_path).read_text(errors="replace")
match = re.search(r"timed\s+(\d+)\s+gametics", stdout, re.IGNORECASE)
end_tic = int(match.group(1)) if match else None
if end_tic != 140:
    failures.append(f"timedemo did not reach tic 140: {end_tic}")
status = "PASS" if not failures else "FAIL"
result = {"schema_version": 1, "task": "DOOM-P2-085", "scenario": scenario, "status": status, "exit_code": int(exit_code), "termination": "watchdog-after-complete" if int(exit_code) == 124 else "process-exit", "end_tic": end_tic, "state": {"records": len(states)}, "frames": frames, "command": command, "failures": failures}
(root / "result.json").write_text(json.dumps(result, indent=2) + "\n")
print(f"NATIVE_P2_RUN={status} scenario={scenario} end_tic={end_tic} exit={exit_code}")
raise SystemExit(0 if not failures else 1)
PY
}

for run in 1 2 3 4 5; do
    run_oracle "baseline/run-$run"
done
run_oracle deh-effect -deh "$RUNTIME/oracle-effect.deh"
python3 - "$RUN_SET" <<'PY'
import json
from pathlib import Path
import sys

root = Path(sys.argv[1])
baseline = json.loads((root / "baseline/run-1/result.json").read_text())
base_states = (root / "baseline/run-1/state.jsonl").read_bytes()
base_frames = [item["sha256"] for item in baseline["frames"]]
failures = []
for index in range(1, 6):
    current = root / f"baseline/run-{index}"
    result = json.loads((current / "result.json").read_text())
    frames = [item["sha256"] for item in result["frames"]]
    if result.get("status") != "PASS" or (current / "state.jsonl").read_bytes() != base_states or frames != base_frames:
        failures.append(f"baseline/run-{index}")
effect = json.loads((root / "deh-effect/result.json").read_text())
if effect.get("status") != "PASS":
    failures.append("deh-effect")
summary = {"schema_version": 1, "task": "DOOM-P2-085", "status": "PASS" if not failures else "FAIL", "baseline_repetitions": 5, "failures": failures}
(root / "comparison.json").write_text(json.dumps(summary, indent=2) + "\n")
print(f"NATIVE_P2_CONTROL={summary['status']} run_set={root}")
raise SystemExit(0 if not failures else 1)
PY
echo "RUN_NATIVE_P2_CONTROL=PASS run_set=$RUN_SET"
