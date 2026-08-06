## DOOM-P6-030 — Add simultaneous minimap and mobile HUD

**Intelligence:** LUNA-H
**Phase:** P06
**Status:** PENDING
**Depends on:** DOOM-P6-020
**Branch:** phase/p06-android-portrait
**Allowed files/directories:** src/CMakeLists.txt; src/sfhs_mobile/sfhs_mobile_state.c; src/sfhs_mobile/sfhs_mobile_state.h; web/p6/**; browser-tests/tests/p6-runtime.spec.mjs; tests/test_p6_mobile_contract.py; docs/UPSTREAM_DELTA.md; docs/COMPATIBILITY_MATRIX.md; docs/results/P06/DOOM-P6-030.md; .agent/task-state.json
**Parallel:** No
**Remote authorization:** NONE

### Goal

Render read-only known geometry and player status alongside gameplay.

### Constraints

The state bridge is read-only and no existing Doom C file is authorized.

### Work

Add the versioned state packet, explored-line filtering, bounded polling, minimap, and HUD.

### Exact verification

Run focused state/runtime checks including hidden/resume timer ownership.

### Acceptance

No entity/unexplored geometry leaks and no existing Doom C edit is required.

### Evidence output

- test-results/P06/P6-030/

### Stop/block conditions

Stop before expanding the C seam or mutating game state from rendering.

### Commit

DOOM-P6-030 add simultaneous minimap and mobile HUD
