## DOOM-P1-085 — Assemble the native-oracle baseline and phase gate

**Intelligence:** LUNA-L/M
**Phase:** P01
**Depends on:** DOOM-P1-080
**Branch:** phase/p01-native-oracle
**Allowed files/directories:** .agent/task-state.json; docs/BUILD_IDENTITY.md; docs/COMPATIBILITY_MATRIX.md; docs/CURRENT_STATE.md; docs/ISSUE_LOG.md; docs/phases/P01/PHASE_RESULT.md; docs/reports/NATIVE_ORACLE_BASELINE.md; docs/results/P01/DOOM-P1-085.md; evidence/phase-gates/P01/**; evidence/reports/P01/**; evidence/manifests/P01/**; evidence/logs/P01/P1-085/**; evidence/task-runs/P01-DOOM-P1-085/**; tests/test_p1_gate.py; tools/verify-p1-gate.py
**Parallel:** No
**Remote authorization:** NONE

### Goal

Bind source, host/toolchain, open data, commands, binaries, fixtures, demos, deterministic state/frame results, and limitations into one read-only P1 gate packet.

### Constraints

- No remote action and no P1-090 self-approval.
- Rebuild and rerun gates from clean ignored directories; never use destructive Git cleanup.
- Leave P1-090 ready, not done.

### Work

Reverify all prior task evidence; create manifests for executables, WADs, demos, fixtures, state, and frames; write the native baseline and phase result; implement the gate validator; create evidence/phase-gates/P01/SOL_GATE_PACKET.md; update current state and task readiness; leave P0-080/P0-090 deferred.

### Exact verification

    python tools/verify-p1-gate.py
    git branch --show-current
    git log --oneline --decorate 804ddb9ae855b65aeec922cd5f531c672b9b2c5f..HEAD
    git diff --name-only 804ddb9ae855b65aeec922cd5f531c672b9b2c5f..HEAD
    git status --short
    git remote -v

The gate must print SFHS_DOOM_P1_NATIVE_ORACLE_GATE=PASS.

### Acceptance

Every builder task P1-000 through P1-085 has exactly one local commit; all native/data/demo/oracle matrices and manifests pass; instrumentation-off behavior is consistent; the phase report and Sol packet bind the evidence; worktree is clean; P1-090 is ready.

### Evidence output

- docs/phases/P01/PHASE_RESULT.md
- docs/reports/NATIVE_ORACLE_BASELINE.md
- evidence/phase-gates/P01/SOL_GATE_PACKET.md
- evidence/manifests/P01/**
- docs/results/P01/DOOM-P1-085.md

### Stop/block conditions

Missing/inconsistent manifests, failed subordinate gate, source/data identity drift, missing deterministic matrix, dirty worktree, remote requirement, or any claim broader than evidence.

### Commit

One local commit only: DOOM-P1-085 assemble native oracle phase gate.
