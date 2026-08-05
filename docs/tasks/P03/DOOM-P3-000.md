## DOOM-P3-000 — Install lean single-file packaging phase

**Intelligence:** LUNA-L  
**Phase:** P03  
**Depends on:** DOOM-P2-088  
**Branch:** phase/p03-single-file  
**Allowed files/directories:** .agent/task-state.json; docs/CURRENT_STATE.md; docs/ISSUE_LOG.md; docs/reviews/P02/DOOM-P2-090.md; docs/results/P02/DOOM-P2-090.md; docs/phases/P03/PHASE_PLAN.md; docs/tasks/P03/DOOM-P3-000.md; docs/tasks/P03/DOOM-P3-010.md; docs/tasks/P03/DOOM-P3-020.md; docs/tasks/P03/DOOM-P3-030.md; docs/tasks/P03/DOOM-P3-040.md; docs/tasks/P03/DOOM-P3-090.md; docs/results/P03/DOOM-P3-000.md
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Record the accepted P2-090 review, create the P3 branch, and install the
single-file packaging governance without changing P2 evidence.

### Exact verification

Verify the packet’s exact P2 HEAD, branch, clean status, upstream-only remotes,
P1 ancestry, P2 focused gate, review SHA-256, document validation, task
validation, and P2-090 HEAD/state. Do not run the global suite.

### Acceptance and commit

P2-090 is recorded `PASS_WITH_RECORDED_LIMITATIONS`; P3-010 is ready; no P2
runtime/evidence file changes. Commit:
`DOOM-P3-000 install lean single-file packaging phase`

### Constraints

No global suite, engine change, commercial data, remote action, or destructive
Git operation.

### Work

Verify the P2 boundary, decode and hash the authorized review appendix, record
P2-090, create the P3 branch, and install the phase plan/cards.

### Evidence output

`docs/reviews/P02/DOOM-P2-090.md`, `docs/results/P02/DOOM-P2-090.md`, and
`docs/results/P03/DOOM-P3-000.md`.

### Stop/block conditions

Stop for starting-state drift, review hash mismatch, unexpected paths, or any
remote/destructive action.

### Commit

`DOOM-P3-000 install lean single-file packaging phase`
