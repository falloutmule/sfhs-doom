## DOOM-P1-070 — Demo playback, recording, strict-demo, and timedemo harness

**Intelligence:** LUNA-M
**Phase:** P01
**Depends on:** DOOM-P1-060
**Branch:** phase/p01-native-oracle
**Allowed files/directories:** .agent/task-state.json; docs/reports/NATIVE_DEMO_BASELINE.md; docs/results/P01/DOOM-P1-070.md; evidence/logs/P01/P1-070/**; evidence/task-runs/P01-DOOM-P1-070/**; tests/fixtures/open-demos/**; tests/native/**; tests/test_native_demo_harness.py; tools/record-native-demo.sh; tools/run-native-demo.sh; tools/run-native-timedemo.sh; tools/demo-result.py
**Parallel:** No
**Remote authorization:** NONE

### Goal

Turn native demo playback, recording, strict-demo, and timedemo behavior into repeatable machine-readable evidence.

### Constraints

- Do not claim full vanilla demo compatibility from one open demo.
- Do not broaden the input subsystem if GUI automation is unreliable; stop after bounded evidence.
- Do not hide desync or non-repeatability.

### Work

Inspect command-line semantics and implement a common result runner. Exercise an official Freedoom demo normally, strictly, and as timedemo. Record one short project-owned demo with deterministic input, play it at least three times in Debug and Release, and capture identity, argv, environment, timings, exit/end tic, completion/desync classification, and hashes.

### Exact verification

    wsl.exe bash -lc 'cd "<repo>" && bash tools/record-native-demo.sh'
    wsl.exe bash -lc 'cd "<repo>" && bash tools/run-native-demo.sh --matrix'
    wsl.exe bash -lc 'cd "<repo>" && bash tools/run-native-timedemo.sh --matrix'
    python -m unittest tests.test_native_demo_harness
    python tools/taskctl.py validate

### Acceptance

Project demo records; normal and strict playback repeatedly complete; timedemo has a stable end; Debug/Release agree; results are machine-readable and provenance/limitations are documented.

### Evidence output

- docs/reports/NATIVE_DEMO_BASELINE.md
- tests/fixtures/open-demos/**
- evidence/task-runs/P01/P1-070/**
- docs/results/P01/DOOM-P1-070.md

### Stop/block conditions

No deterministic recording after bounded automation, hidden desync, unstable end tic, or requirement for broad input architecture changes.

### Commit

One local commit only: DOOM-P1-070 establish native demo and timedemo baseline.
