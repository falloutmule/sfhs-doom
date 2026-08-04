## DOOM-P2-000 — Install continuous Wasm feasibility phase

**Intelligence:** LUNA-L  
**Phase:** P02  
**Depends on:** DOOM-P1-085  
**Branch:** phase/p02-wasm-feasibility  
**Allowed files/directories:** .agent/task-state.json; docs/CURRENT_STATE.md; docs/ISSUE_LOG.md; docs/UPSTREAM_DELTA.md; docs/reviews/P01/DOOM-P1-090.md; docs/results/P01/DOOM-P1-090.md; docs/phases/P02/PHASE_PLAN.md; docs/tasks/P02/**; docs/results/P02/DOOM-P2-000.md  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Install the frozen P2 governance boundary and record the independent P1 review without changing P1 evidence or engine/build files.

### Constraints

No remote, engine, build, P1 evidence, parent-workspace, destructive Git, commercial-data, or strict single-file action.

### Work

Verify the exact P1 starting state and gate; decode Appendix A; verify its SHA-256; record and complete P1-090; create the P2 branch; install the P2 plan and twelve task cards; update current-state governance and the stale P1-080 upstream-delta reference; set P2-010 ready.

### Exact verification

    git branch --show-current
    git status --short
    git remote -v
    git merge-base --is-ancestor 0c8e1288a23e7306fa5760c1aadbf54de8d0b85c HEAD
    python tools/verify-p1-gate.py
    python tools/validate_project_docs.py
    python tools/taskctl.py validate
    python -m unittest tests.test_project_docs tests.test_taskctl
    python tools/taskctl.py verify-head DOOM-P1-090

### Acceptance

P1 gate remains PASS; review SHA is exact; P1-090 is done; P2-010 is ready; only allowed paths changed; no engine/build file or remote changed.

### Stop/block conditions

Stop for starting-state drift, review hash mismatch, unexpected paths, or any required history/remote/source mutation.

### Evidence output

`docs/reviews/P01/DOOM-P1-090.md`; `docs/results/P01/DOOM-P1-090.md`; `docs/phases/P02/PHASE_PLAN.md`; `docs/tasks/P02/**`; `docs/results/P02/DOOM-P2-000.md`.

### Commit

DOOM-P2-000 install continuous wasm feasibility phase
