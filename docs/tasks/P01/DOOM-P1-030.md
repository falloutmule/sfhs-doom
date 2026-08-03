## DOOM-P1-030 — Establish the truthful upstream test baseline

**Intelligence:** LUNA-M
**Phase:** P01
**Depends on:** DOOM-P1-020
**Branch:** phase/p01-native-oracle
**Allowed files/directories:** .agent/task-state.json; docs/reports/UPSTREAM_NATIVE_TEST_BASELINE.md; docs/results/P01/DOOM-P1-030.md; evidence/logs/P01/P1-030/**; evidence/task-runs/P01-DOOM-P1-030/**; tests/test_upstream_test_runner.py; tools/run-upstream-native-tests.sh
**Parallel:** No
**Remote authorization:** NONE

### Goal

Determine what the pinned upstream actually tests without inventing a passing suite.

### Constraints

- Inspect CMake, CTest, autotools checks, CI definitions, and source-contained tests.
- Classify every result as PASS, FAIL, NOT_PRESENT, NOT_APPLICABLE, or BLOCKED.
- Never patch upstream to manufacture tests.

### Work

Implement a runner that executes every genuine available test, records no-tests as NOT_PRESENT, separates build smoke checks, captures exit codes/output, and documents coverage gaps. Add wrapper tests using fixtures/mocks.

### Exact verification

    wsl.exe bash -lc 'cd "<repo>" && bash tools/run-upstream-native-tests.sh'
    wsl.exe bash -lc 'cd "<repo>" && ctest --test-dir build/native/debug --output-on-failure'
    wsl.exe bash -lc 'cd "<repo>" && ctest --test-dir build/native/release --output-on-failure'
    python -m unittest tests.test_upstream_test_runner
    python tools/taskctl.py validate

### Acceptance

Actual test availability, every discovered result, failures, and coverage gaps are directly evidenced; native build smoke remains green.

### Evidence output

- docs/reports/UPSTREAM_NATIVE_TEST_BASELINE.md
- evidence/logs/P01/P1-030/**
- docs/results/P01/DOOM-P1-030.md

### Stop/block conditions

Unable to distinguish real upstream tests from project tests, inability to capture a failure truthfully, or any required upstream patch.

### Commit

One local commit only: DOOM-P1-030 record truthful upstream native test baseline.
