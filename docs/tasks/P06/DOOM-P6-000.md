## DOOM-P6-000 — Install Android portrait phase

**Intelligence:** LUNA-L
**Phase:** P06
**Status:** PENDING
**Depends on:** DOOM-P3-090
**Branch:** phase/p06-android-portrait
**Allowed files/directories:** .agent/task-state.json; docs/PROJECT_SPEC.md; docs/DECISIONS.md; docs/CURRENT_STATE.md; docs/ISSUE_LOG.md; docs/blocked/P04_LOCAL_LAUNCHER.md; docs/reviews/P03/DOOM-P3-090.md; docs/results/P03/DOOM-P3-090.md; docs/phases/P06/**; docs/tasks/P06/**; docs/results/P06/**
**Parallel:** No
**Remote authorization:** NONE

### Goal

Install P6 directly from protected P3, preserving P4 as blocked and P5 as deferred.

### Context

P3 is independently accepted with recorded limitations. P4's full tip is
`3de1cb2d038124895a8e6408d587461ad0a6f47b`; the packet omitted its final hex digit.

### Constraints

No engine, runtime, artifact, remote, P4-runtime, or P5-persistence change.

### Work

Verify P4 bundle/P3 identity, record the exact P3 review, install ADR-015 and
P6 governance, and mark P6-010 ready without editing taskctl.

### Exact verification

```text
python tools/validate_project_docs.py
python tools/taskctl.py validate
python -m unittest tests.test_taskctl
```

### Acceptance

P6 is based on P3, P4 remains blocked, P5 remains deferred, and P6-010 is ready.

### Evidence output

- docs/results/P06/DOOM-P6-000.md

### Stop/block conditions

Stop for P3/P4 hash drift, review mismatch, unexpected dirty work, or remote action.

### Commit

DOOM-P6-000 install Android portrait phase
