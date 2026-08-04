# TASK RESULT

**Task:** DOOM-P2-085
**Status:** PASS
**Base commit:** 4632d98adcab0b88c4ebb9d0973698ed2125fa76
Result commit: SELF
**Branch:** phase/p02-wasm-feasibility

## What was done

- Added the P2 native control runner, Wasm Oracle runner, exact raw-state/frame
  comparator, parity contract tests, and bounded Playwright parity test.
- Added only the permitted Emscripten/Oracle output portability fallback:
  under Emscripten, the accepted observer uses the already-created
  `/oracle-output` MEMFS directory when its environment lookup is empty.
- Used phase-2 `freedoom2.wad` consistently in native and Wasm runs.
- Preserved accepted scalar field meanings, checkpoint sequence, and raw frame
  bytes. No `src/doom/**` edit, normalization, PWAD-order claim, or
  engine/gameplay redesign was made.

## What was verified

- `bash tools/run-native-p2-control.sh --repeat 5`: 5 baseline runs plus the
  targeted DeHackEd run passed; each reached tic 140 with all five state and
  four raw-frame checkpoints. Host watchdog termination after the real
  timedemo result is recorded in each `result.json`.
- `node tools/run-wasm-oracle.mjs --browser chromium --repeat 5`:
  `WASM_ORACLE=PASS`.
- `node tools/run-wasm-oracle.mjs --browser firefox --repeat 3`:
  `WASM_ORACLE=PASS`.
- `python tools/compare-native-wasm.py evidence/task-runs/P02-DOOM-P2-085`:
  `NATIVE_WASM_COMPARE=PASS`.
- `python -m unittest tests.test_native_wasm_compare`: 4 tests, OK,
  including tampered-frame rejection.
- `cd browser-tests && npx playwright test tests/parity.spec.mjs --workers=1`:
  1 passed.
- `python tools/taskctl.py validate`: PASS.

## What failed

- The first browser Oracle attempt had empty MEMFS output despite a completed
  real timedemo. The bounded diagnostic showed runtime/data/main ready,
  `/oracle-output` empty, no page errors, and no failed requests. The
  authorized browser-output portability fallback repaired this without
  changing Oracle fields or engine semantics.
- The first native control attempt exceeded its outer watchdog after producing
  run-1 artifacts. The bounded per-process watchdog was added to the new
  runner; subsequent fresh controls passed with complete artifacts and an
  explicit watchdog termination record.

## Evidence

- `docs/reports/NATIVE_WASM_PARITY.md`
- `evidence/task-runs/P02-DOOM-P2-085/native/`
- `evidence/task-runs/P02-DOOM-P2-085/wasm-chromium/`
- `evidence/task-runs/P02-DOOM-P2-085/wasm-firefox/`
- `evidence/task-runs/P02-DOOM-P2-085/comparison.json`

## Current exact state

P2-085 passes exact native/Chromium/Firefox state and raw-frame parity on
`phase/p02-wasm-feasibility`. `Result commit: SELF` will resolve to the
single task commit.

## Remaining blocker or next task

No P2-085 blocker remains. Continue with DOOM-P2-088.

## Post-run Git status

To be verified clean after the single P2-085 commit.
