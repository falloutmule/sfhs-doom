# TASK RESULT

**Task:** DOOM-P2-020  
**Status:** PASS  
**Base commit:** 8d815ac8c59b7e651fb273404fc2591135547e07  
Result commit: SELF  
**Branch:** phase/p02-wasm-feasibility

## What was done

- Added a pinned, no-install Wasm environment resolver and toolchain doctor.
- Added a deterministic SDL2 smoke fixture and ignored multi-file Wasm output.
- Added loopback-only serving and a Playwright test that exercises the smoke artifact in Chromium and Firefox.
- Added forced-missing and forced-wrong-version negative contract tests.

## What was verified

- `bash tools/wasm-toolchain-doctor.sh`: `WASM_TOOLCHAIN_DOCTOR=PASS`.
- Emscripten: 6.0.5, exact compiler identity recorded.
- SDK Node: v22.16.0.
- Playwright: Version 1.61.1.
- Chromium cache: chromium-1228; Firefox cache: firefox-1532.
- SDL2 smoke JavaScript SHA-256: `23f2887725886ece61da9aff7f79a465d344a22a5865c172def624a7ea443f08`.
- SDL2 smoke Wasm SHA-256: `144f4a471286617fdd94923cf2051021aab8c8b17d7c5f9f2abf19d9d8a539ce`.
- The second doctor run reproduced both artifact hashes exactly.
- `python3 -m unittest -v tests.test_wasm_toolchain`: 4 tests, OK, including missing and wrong-version rejection.
- `npx playwright test tests/toolchain.spec.mjs --workers=1`: 1 test passed; Chromium and Firefox both loaded the SDL2 Wasm smoke artifact with no page errors.
- `python3 tools/taskctl.py validate`: `VALIDATE PASS: task state and task cards are coherent`.

## What failed

- The first normalized hash comparison differed only in absolute versus relative filenames; the two SHA-256 values were identical. A path-independent repeatability record was then captured as `HASH_REPRODUCTION=PASS`.
- No dependency installation, network access, Chocolate Doom source change, commercial data, remote action, or parent-workspace mutation occurred.

## Changed files

    .agent/task-state.json
    browser-tests/tests/toolchain.spec.mjs
    docs/toolchains/WASM_TOOLCHAIN.md
    docs/results/P02/DOOM-P2-020.md
    evidence/logs/P02/P2-020/**
    evidence/task-runs/P02-DOOM-P2-020/**
    tests/fixtures/wasm/sdl-smoke.c
    tests/test_wasm_toolchain.py
    tools/wasm-env.sh
    tools/wasm-toolchain-doctor.sh

## Exact commands and results

- `bash -n tools/wasm-env.sh tools/wasm-toolchain-doctor.sh`: PASS.
- `bash tools/wasm-toolchain-doctor.sh`: PASS twice.
- `python3 -m unittest -v tests.test_wasm_toolchain`: 4 tests, OK.
- `cd browser-tests && npx playwright test tests/toolchain.spec.mjs --workers=1`: 1 passed in 5.1 seconds.
- `python3 tools/taskctl.py validate`: PASS.

## Evidence paths

- `docs/toolchains/WASM_TOOLCHAIN.md`
- `evidence/logs/P02/P2-020/`
- `evidence/task-runs/P02-DOOM-P2-020/`
- `tests/fixtures/wasm/sdl-smoke.c`
- `browser-tests/tests/toolchain.spec.mjs`

## Current exact state

P2-020 is a passing local candidate on `phase/p02-wasm-feasibility`. The pinned toolchain and browser smoke proof are available in ignored local state. The next task is DOOM-P2-030.

## Remaining blocker or next task

No P2-020 blocker remains. Continue with DOOM-P2-030.

## Post-run Git status

To be verified clean after the single P2-020 commit.
