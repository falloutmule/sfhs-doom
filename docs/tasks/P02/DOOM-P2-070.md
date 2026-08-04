## DOOM-P2-070 — Prove browser keyboard input semantics

**Intelligence:** LUNA-M  
**Phase:** P02  
**Depends on:** DOOM-P2-060  
**Branch:** phase/p02-wasm-feasibility  
**Allowed files/directories:** .agent/task-state.json; browser-tests/tests/input.spec.mjs; browser-tests/support/**; web/p2/shell.html; web/p2/pre.js; web/p2/post.js; docs/results/P02/DOOM-P2-070.md; evidence/logs/P02/P2-070/**; evidence/screenshots/P02/P2-070/**; evidence/task-runs/P02-DOOM-P2-070/**; tests/test_browser_input_contract.py  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Prove real browser keyboard events reach Doom without direct engine-state injection or global pre-start key hijacking.

### Constraints

Use real browser keyboard events only; no C/CMake edits, direct C calls, global pre-start hijacking, or synthetic gameplay state.

### Work

Focus the canvas after Start; prove menu Escape/arrow/return behavior in both browsers; prove Chromium movement, turning, and fire responses; record hashes/screenshots and key cleanup after focus loss; verify typing outside started canvas does not control Doom.

### Exact verification

    python -m unittest tests.test_browser_input_contract
    cd browser-tests && npx playwright test tests/input.spec.mjs --workers=1
    python tools/taskctl.py validate

### Acceptance

Menu and Chromium gameplay responses pass; events are real browser keyboard events; no stuck keys or direct state injection; shell behavior remains bounded to focus/start.

### Stop/block conditions

Stop for stuck keys, direct state injection, focus leakage, missing real menu/gameplay response, or any required engine edit.

### Evidence output

`evidence/screenshots/P02/P2-070/**`; `evidence/logs/P02/P2-070/**`; `evidence/task-runs/P02-DOOM-P2-070/**`.

### Commit

DOOM-P2-070 prove browser keyboard input semantics

### Owner-authorized acceptance amendment — 2026-08-04

Classification D from the bounded heartbeat and browser-level screenshot diagnostic is accepted as a browser/test-capture limitation. The heartbeat advanced from 19 to 90, real canvas-targeted ArrowUp keydown and keyup were observed, Chromium and Firefox menu navigation passed, page errors were empty, and pre-input gameplay was captured.

The already-built `phase2-oracle` artifact was inspected read-only for `window.SFHS_WASM_TEST`. The interface is absent. Exposing it would require an unauthorized engine or build change, so P2-070 may finish as `PASS_WITH_RECORDED_LIMITATION` based on the preserved D diagnostic and menu/input evidence. Direct visual gameplay movement remains unproven because the Playwright post-input capture hangs. Do not investigate or repair browser screenshots further under this task.
