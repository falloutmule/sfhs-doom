## DOOM-P2-060 — Prove browser Freedoom gameplay boots

**Intelligence:** LUNA-M  
**Phase:** P02  
**Depends on:** DOOM-P2-050  
**Branch:** phase/p02-wasm-feasibility  
**Allowed files/directories:** .agent/task-state.json; browser-tests/tests/boot.spec.mjs; browser-tests/support/**; tools/serve-wasm.py; tests/test_wasm_server.py; docs/COMPATIBILITY_MATRIX.md; docs/results/P02/DOOM-P2-060.md; evidence/logs/P02/P2-060/**; evidence/screenshots/P02/P2-060/**; evidence/task-runs/P02-DOOM-P2-060/**; web/p2/shell.html; web/p2/pre.js; web/p2/post.js  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Prove real Phase 1 and Phase 2 Freedoom gameplay boots in required desktop browser lanes through a loopback-only server.

### Constraints

Use only staged multi-file artifacts and open Freedoom data; shell repairs are limited to boot/status/focus; no C/CMake, commercial-data, external-request, or gameplay-substitute action.

### Work

Implement an ephemeral loopback server with correct Wasm MIME, request logging, traversal rejection, and clean shutdown. Boot Phase 1 in Chromium and Phase 2 in Chromium and Firefox; capture gameplay screenshots, errors, requests, output, and timings. Shell repairs are limited to boot/status/focus; no C/CMake edits.

### Exact verification

    python -m unittest tests.test_wasm_server
    cd browser-tests && npx playwright test tests/boot.spec.mjs --workers=1
    python tools/taskctl.py validate

### Acceptance

Both editions enter real gameplay in Chromium; Phase 2 does so in Firefox; screenshots are nonblank/distinct; no fatal errors or external requests; staged resources load; server shuts down cleanly.

### Stop/block conditions

Stop for black/menu-only evidence, fatal browser errors, external requests, missing resources, or server cleanup failure.

### Evidence output

`evidence/screenshots/P02/P2-060/**`; `evidence/logs/P02/P2-060/**`; `evidence/task-runs/P02-DOOM-P2-060/**`.

### Commit

DOOM-P2-060 prove browser Freedoom gameplay boots
