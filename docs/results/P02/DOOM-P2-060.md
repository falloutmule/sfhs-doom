# TASK RESULT

**Task:** DOOM-P2-060  
**Status:** PASS  
**Base commit:** 7defabe24f9e55607c2d54ce74c3fa9bc5320275  
Result commit: SELF  
**Branch:** phase/p02-wasm-feasibility

## What was done

- Added the standard-library-only loopback server at `tools/serve-wasm.py`.
- Served the staged P2-050 multi-file engine outputs and the existing open Freedoom Phase 1 and Phase 2 WADs with explicit Wasm, JavaScript, HTML, and WAD MIME handling.
- Added traversal rejection, request JSONL logging, loopback health handling, optional favicon handling, ready-file startup, and clean signal/file shutdown.
- Updated the bounded P2 browser shell to preload the phase-specific open WAD, enter E1M1/MAP01 gameplay, and preserve the multi-file/no-external-request contract.
- Added the Playwright boot lane for Phase 1 Chromium, Phase 2 Chromium, and Phase 2 Firefox, with gameplay-banner, screenshot, request, page-error, and shutdown evidence.
- Added the loopback server unit test and recorded the P2 compatibility rows.

## Exact verification

    python -m unittest tests.test_wasm_server
    .\browser-tests\... npx playwright test tests/boot.spec.mjs --workers=1
    python tools/taskctl.py validate

The exact required browser command was run from WSL with the already-installed ignored cache selected via `PLAYWRIGHT_BROWSERS_PATH=/mnt/c/Users/fallo/Documents/Single-File-Html/sfhs-doom/vendor-cache/playwright`; no browser download occurred.

Results:

- Server unit test: `Ran 1 test ... OK`.
- Playwright: `3 passed`; Phase 1 Chromium, Phase 2 Chromium, and Phase 2 Firefox.
- Task validation: `VALIDATE PASS: task state and task cards are coherent`.

## Acceptance evidence

- Phase 1 Chromium emitted `Freedoom: Phase 1`, loaded `freedoom1.wad`, and captured a nonblank screenshot: 213071 bytes, SHA-256 `8d856bfcef4db3120c77a0a0e6883378ecc2e32ce327b738d0f5a67ec166ec7c`.
- Phase 2 Chromium emitted `Freedoom: Phase 2`, loaded `freedoom2.wad`, and captured a nonblank screenshot: 145757 bytes, SHA-256 `dbb1e95290fa4780f3684fa0eb81758075ae1365a841a9bf657a5d5ee426cbf1`.
- Phase 2 Firefox emitted `Freedoom: Phase 2`, loaded `freedoom2.wad`, and captured a nonblank screenshot: 106985 bytes, SHA-256 `362bbfa214d2a0837ac15bea3c6278dc1e7946cfac8c175de6df2bba1b217118`.
- The three screenshot hashes are distinct.
- Request logs contain only loopback-served shell/assets/engine/Wasm/WAD resources plus the browser’s optional `/favicon.ico` request, answered locally with HTTP 204; no external requests or failed requests were recorded.
- Browser evidence contains no page errors or fatal console errors. The known nonfatal Emscripten timing diagnostic and Freedoom dehacked warning are preserved in the evidence logs.
- The server log ends with `{"clean": true, "event": "shutdown"}`.

## Evidence paths

- `evidence/screenshots/P02/P2-060/`
- `evidence/task-runs/P02-DOOM-P2-060/server.jsonl`
- `evidence/task-runs/P02-DOOM-P2-060/phase1-chromium.json`
- `evidence/task-runs/P02-DOOM-P2-060/phase2-chromium.json`
- `evidence/task-runs/P02-DOOM-P2-060/phase2-firefox.json`
- `tests/test_wasm_server.py`
- `browser-tests/tests/boot.spec.mjs`

## What failed and bounded repairs

- The first sandbox WSL launch returned the known `Wsl/Service/CreateInstance/E_ACCESSDENIED`; the authorized host-execution rerun succeeded.
- The existing repository-local pinned browser cache was selected explicitly because the active WSL user cache was empty; no dependency was downloaded or changed.
- Bounded shell/server repairs corrected the engine resource route, Emscripten Wasm locate path, ready-file race, browser optional favicon request, WebGL screenshot evidence, warning-versus-fatal classification, and per-test browser cleanup. No C, CMake, engine, commercial-data, remote, or parent-workspace action occurred.

## Current exact state

DOOM-P2-060 passes its exact verification and is ready for its single local commit. The next task is DOOM-P2-070.

## Post-run Git status

To be verified clean after the single DOOM-P2-060 commit.
