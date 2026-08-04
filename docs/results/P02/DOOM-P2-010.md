# TASK RESULT

**Task:** DOOM-P2-010  
**Status:** PASS  
**Base commit:** 5b331e708731de731ca63b0e6673b7dee9e6c3a9  
Result commit: SELF  
**Branch:** phase/p02-wasm-feasibility

## What was done

- Added exact local Emscripten and browser dependency locks.
- Installed and activated Emscripten SDK 6.0.5 from the pinned local emsdk checkout without global activation.
- Prebuilt the SDL2 and SDL2_mixer ports.
- Pinned Playwright 1.61.1 and installed Chromium and Firefox into the ignored repository-local browser cache.
- Added the idempotent bootstrap, contract tests, toolchain lock record, and task evidence.

## What was verified

- emsdk repository: `https://github.com/emscripten-core/emsdk.git`.
- emsdk checkout: `9fcdf593953edfcddb297572d7f2177d336b0479`.
- Emscripten SDK: `6.0.5`; locked release commit `dbd755b5da399329c2576f6e3dfa7f419f5d8409`.
- `emcc --version`: Emscripten 6.0.5.
- `emcc -v`: target `wasm32-unknown-emscripten`, installed from the pinned checkout.
- `embuilder build sdl2 sdl2_mixer`: both targets succeeded twice.
- SDK Node: `v22.16.0`; npm: `10.9.7`.
- Playwright: `1.61.1`; Chromium `1228` and Firefox `1532` are present in the locked cache.
- `npm ci`: 3 packages added, 4 audited, 0 vulnerabilities.
- `python3 -m unittest tests.test_bootstrap_emsdk`: 3 tests, OK.
- `python3 tools/taskctl.py validate`: `VALIDATE PASS: task state and task cards are coherent`.
- The second bootstrap skipped already-installed SDK components and completed successfully.
- The emsdk checkout is clean, detached at the exact locked commit, and retains only its official `origin`.

## What failed and bounded repairs

- The literal packet probe `em-config --show-ports` is unsupported by Emscripten 6.0.5; the command reports `Usage: em-config VAR_NAME`. Its output is preserved in `evidence/task-runs/P02-DOOM-P2-010/em-config-show-ports.txt`. The supported pinned-SDK port verification is `embuilder build sdl2 sdl2_mixer`, which passed twice.
- The first browser dependency attempt encountered the default WSL user’s noninteractive sudo requirement. The authorized existing WSL root launch installed the missing browser libraries; the successful root result is preserved in `evidence/task-runs/P02-DOOM-P2-010/playwright-deps-root.txt`.
- No repository remote, parent workspace, Windows package installation, or global emsdk activation occurred.

## Changed files

    .agent/task-state.json
    .gitignore
    browser-tests/package-lock.json
    browser-tests/package.json
    browser-tests/playwright.config.mjs
    docs/licenses/THIRD_PARTY_INVENTORY.md
    docs/results/P02/DOOM-P2-010.md
    docs/toolchains/WASM_TOOLCHAIN_LOCK.md
    evidence/task-runs/P02-DOOM-P2-010/
    tests/test_bootstrap_emsdk.py
    tools/bootstrap-emsdk.sh
    tools/emsdk-lock.json

## Evidence paths

- `docs/toolchains/WASM_TOOLCHAIN_LOCK.md`
- `tools/emsdk-lock.json`
- `evidence/task-runs/P02-DOOM-P2-010/`
- `evidence/logs/P02/P2-010/`
- `tests/test_bootstrap_emsdk.py`

## Current exact state

P2-010 is a passing local candidate on `phase/p02-wasm-feasibility`. The ignored SDK, browser cache, and Node modules are installed locally. The next task is DOOM-P2-020.

## Remaining blocker or next task

No P2-010 blocker remains. Continue with DOOM-P2-020.

## Post-run Git status

To be verified clean after the single P2-010 commit.
