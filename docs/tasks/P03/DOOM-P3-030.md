## DOOM-P3-030 — Prove single-file offline gameplay

**Intelligence:** LUNA-M/H  
**Phase:** P03  
**Depends on:** DOOM-P3-020  
**Branch:** phase/p03-single-file  
**Allowed files/directories:** .agent/task-state.json; browser-tests/tests/single-file-offline.spec.mjs; browser-tests/support/p3/**; tools/run-single-file-offline.mjs; tests/test_single_file_offline_contract.py; docs/COMPATIBILITY_MATRIX.md; docs/reports/P03_OFFLINE_RUNTIME.md; docs/results/P03/DOOM-P3-030.md; evidence/logs/P03/P3-030/**; evidence/screenshots/P03/P3-030/**; evidence/task-runs/P03-DOOM-P3-030/**; web/p3/shell.html; web/p2/shell.html; web/p2/pre.js; web/p2/post.js; web/p2/audio-probe.js; cmake/SFHSWasm.cmake; tools/build-single-file.sh; tools/build-wasm.sh
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Open only the renamed HTML file directly via `file://` in Chromium and
Firefox with HTTP/HTTPS blocked. Prove trusted Start, gameplay, engine audio,
menu input, heartbeat, and one real Oracle position/angle change without a new
engine hook.

### Acceptance and commit

At most four focused tests pass; no server, page errors, external requests, or
C-source changes. Commit:
`DOOM-P3-030 prove single-file offline gameplay`

### Constraints

Use direct `file://` only for acceptance; block HTTP/HTTPS; do not use a local
server or modify C source.

### Work

Copy and rename only the HTML file into an empty temporary directory, run the
bounded Chromium/Firefox tests, and record gameplay/audio/input/network logs.

### Exact verification

Run the focused Python contract, the single Playwright file, and task
validation. Do not repeat the P2 browser matrix.

### Evidence output

`docs/reports/P03_OFFLINE_RUNTIME.md`, screenshots, and P3-030 task-run logs.

### Stop/block conditions

Stop if direct-file startup, trusted audio, keyboard input, heartbeat, movement
proof, or zero-request validation fails.

### Commit

`DOOM-P3-030 prove single-file offline gameplay`
