## DOOM-P1-080 — Add deterministic test-only state and framebuffer oracle

**Intelligence:** LUNA-H
**Phase:** P01
**Depends on:** DOOM-P1-070
**Branch:** phase/p01-native-oracle
**Allowed files/directories:** .agent/task-state.json; CMakeLists.txt; cmake/**; src/**; src/sfhs_oracle/**; tests/native/**; tools/oracle/**; docs/DECISIONS.md; docs/UPSTREAM_DELTA.md; docs/COMPATIBILITY_MATRIX.md; docs/reports/NATIVE_ORACLE_INSTRUMENTATION.md; docs/results/P01/DOOM-P1-080.md; evidence/logs/P01/P1-080/**; evidence/task-runs/P01-DOOM-P1-080/**; tests/test_native_oracle.py; tools/build-native.sh; tools/run-native-oracle.sh
**Parallel:** No
**Remote authorization:** NONE

### Goal

Add the smallest compile-time-gated observer that emits deterministic logical state and indexed framebuffer checkpoints for later native/Wasm comparison.

### Constraints

- Enable only with -DSFHS_ORACLE_TEST=ON; ordinary Debug/Release remain inert.
- New files belong under src/sfhs_oracle, tests/native, and tools/oracle.
- At most three existing C source files and three existing CMake files may be edited.
- Never include addresses, timestamps, paths, IDs, uninitialized bytes, or presentation-only state.
- Instrumentation observes only; it must not alter timing, state, demos, release semantics, or input.

### Work

Write the ADR before implementation. Capture selected post-tic state and the authoritative pre-scale logical framebuffer at initial gameplay, tic 1, 35, 70, 140, and final demo tic or documented shorter points. Emit build.json, state.jsonl, frame binaries, hashes, and result JSON under an explicitly supplied output directory. Prove five repetitions, fresh process launches, clean rebuild, instrumentation-off regression, PWAD order, and DeHackEd baseline/effect behavior.

### Exact verification

    wsl.exe bash -lc 'cd "<repo>" && bash tools/build-native.sh --config oracle --clean-build-dir'
    wsl.exe bash -lc 'cd "<repo>" && bash tools/run-native-oracle.sh --repeat 5'
    python -m unittest tests.test_native_oracle
    python tools/oracle/compare-runs.py <run-set>
    python tools/taskctl.py validate
    bash tools/run-native-demo.sh --matrix
    bash tools/run-native-timedemo.sh --matrix

### Acceptance

Oracle build succeeds; ordinary builds remain green; five state and framebuffer repetitions match across process/build reuse; demo completion is unchanged; order/DeHackEd fixtures behave as expected; source edit budget and gameplay invariance are documented.

### Evidence output

- docs/reports/NATIVE_ORACLE_INSTRUMENTATION.md
- evidence/task-runs/P01/P1-080/**
- build/runtime/<run-id>/oracle/**
- docs/results/P01/DOOM-P1-080.md

### Stop/block conditions

More than three existing C or three existing CMake files required, nondeterministic state/frame output, instrumentation-off regression, pointer/time-dependent digest fields, or source behavior change.

### Commit

One local commit only: DOOM-P1-080 add deterministic native oracle instrumentation.
