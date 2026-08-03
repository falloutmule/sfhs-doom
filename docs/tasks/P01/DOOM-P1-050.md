## DOOM-P1-050 — Boot Freedoom Phase 1 and Phase 2 natively

**Intelligence:** LUNA-M
**Phase:** P01
**Depends on:** DOOM-P1-040
**Branch:** phase/p01-native-oracle
**Allowed files/directories:** .agent/task-state.json; docs/COMPATIBILITY_MATRIX.md; docs/results/P01/DOOM-P1-050.md; evidence/logs/P01/P1-050/**; evidence/screenshots/P01/P1-050/**; evidence/task-runs/P01-DOOM-P1-050/**; tests/test_native_smoke.py; tools/run-native-smoke.sh; tools/capture-native-frame.sh
**Parallel:** No
**Remote authorization:** NONE

### Goal

Prove the native executable reaches real gameplay with both open Freedoom IWADs.

### Constraints

- Use explicit Release executable, IWAD, warp, skill, isolated config/save paths, display, and timeout.
- Use SDL dummy audio for automation and separately record real mixer initialization.
- A title screen or black frame is not gameplay proof.

### Work

Implement isolated Phase 1 E1M1 and Phase 2 MAP01 smoke runs. Capture argv, environment, process lifecycle, game detection, gameplay frame, writes, stdout/stderr, and bounded timeout. Add negative tests and update only P1 compatibility rows.

### Exact verification

    wsl.exe bash -lc 'cd "<repo>" && bash tools/run-native-smoke.sh --iwad phase1'
    wsl.exe bash -lc 'cd "<repo>" && bash tools/run-native-smoke.sh --iwad phase2'
    python -m unittest tests.test_native_smoke
    python tools/taskctl.py validate

Inspect generated screenshots/frames directly.

### Acceptance

Both IWADs are correctly detected, enter the requested level, produce nonblank level-specific evidence, remain healthy, and write only inside isolated runtime paths.

### Evidence output

- docs/COMPATIBILITY_MATRIX.md
- evidence/screenshots/P01/P1-050/**
- evidence/task-runs/P01-DOOM-P1-050/**
- docs/results/P01/DOOM-P1-050.md

### Stop/block conditions

Native executable failure, incorrect IWAD detection, title-only/black capture, timeout, fatal runtime error, or required broad engine/input change.

### Commit

One local commit only: DOOM-P1-050 prove native Freedoom gameplay boots.
