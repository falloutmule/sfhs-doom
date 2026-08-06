## DOOM-P6-020 — Add multi-touch Doom input adapter

**Intelligence:** LUNA-H
**Phase:** P06
**Status:** PENDING
**Depends on:** DOOM-P6-010
**Branch:** phase/p06-android-portrait
**Allowed files/directories:** src/CMakeLists.txt; src/sfhs_mobile/sfhs_mobile_input.c; src/sfhs_mobile/sfhs_mobile_input.h; web/p6/**; browser-tests/tests/p6-runtime.spec.mjs; tests/test_p6_mobile_contract.py; docs/UPSTREAM_DELTA.md; docs/results/P06/DOOM-P6-020.md; .agent/task-state.json
**Parallel:** No
**Remote authorization:** NONE

### Goal

Translate touch through `D_PostEvent` without gameplay mutation.

### Constraints

Only the stated Emscripten input seam is allowed; no responder or player-state calls.

### Work

Implement held/pulse actions, look, pointer ownership, and release-all cleanup.

### Exact verification

Run focused runtime, contract, and desktop-keyboard smoke checks.

### Acceptance

Move/turn/fire route simultaneously and no action remains held after cleanup.

### Evidence output

- test-results/P06/P6-020/

### Stop/block conditions

Stop before any existing Doom C edit or direct responder/gameplay call.

### Commit

DOOM-P6-020 add multi-touch Doom input adapter
