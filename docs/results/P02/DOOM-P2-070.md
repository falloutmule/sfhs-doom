# TASK RESULT

**Task:** DOOM-P2-070  
**Status:** PASS_WITH_RECORDED_LIMITATION  
**Base commit:** ce107d936109154fe66a91fa722376760e7e452f  
Result commit: SELF  
**Branch:** phase/p02-wasm-feasibility

## What was verified

- `python -m unittest tests.test_browser_input_contract`: 3 tests, OK.
- `npx playwright test tests/input.spec.mjs --workers=1`: menu navigation passed in Chromium and Firefox; the accepted fallback check passed without rerunning screenshot capture.
- `python tools/taskctl.py validate`: to be verified before commit.
- Existing P2-060 gameplay boot evidence remains valid.
- No direct engine calls, Oracle-state mutation, canvas readback, remote action, commercial data, engine/build change, or parent-workspace change occurred.

## Accepted limitation

The preserved D diagnostic recorded:

- Heartbeat count advancing from 19 to 90 after ArrowUp.
- Real canvas-targeted ArrowUp keydown and keyup.
- Empty page-error list.
- Chromium and Firefox menu keyboard navigation passing.
- Pre-input gameplay screenshot captured.
- Bounded Playwright post-input screenshot timeout.

The built `build/wasm/P2-050/phase2-oracle/src/chocolate-doom.js` was inspected read-only and contains no `SFHS_WASM_TEST` interface. Using Oracle state for interactive movement proof would therefore require an unauthorized engine/build change. Per the owner-authorized amendment, P2-070 passes with the limitation that direct visual gameplay movement remains unproven because Playwright post-input capture hangs.

## Evidence

- `evidence/task-runs/P02-DOOM-P2-070/gameplay-arrowup.json`
- `evidence/task-runs/P02-DOOM-P2-070/oracle-fallback.json`
- `evidence/task-runs/P02-DOOM-P2-070/menu-chromium.json`
- `evidence/task-runs/P02-DOOM-P2-070/menu-firefox.json`
- `evidence/screenshots/P02/P2-070/gameplay-arrowup-before.png`
- `evidence/screenshots/P02/P2-070/menu-chromium.png`
- `evidence/screenshots/P02/P2-070/menu-chromium-after-input.png`
- `evidence/screenshots/P02/P2-070/menu-firefox.png`
- `evidence/screenshots/P02/P2-070/menu-firefox-after-input.png`

## Current exact state

P2-070 is ready to finish and commit once the complete task verification and changed-path checks pass. DOOM-P2-080 through DOOM-P2-088 remain pending.
