## DOOM-P3-040 — Assemble lean single-file phase gate

**Intelligence:** LUNA-M  
**Phase:** P03  
**Depends on:** DOOM-P3-030  
**Branch:** phase/p03-single-file  
**Allowed files/directories:** .agent/task-state.json; docs/BUILD_IDENTITY.md; docs/COMPATIBILITY_MATRIX.md; docs/CURRENT_STATE.md; docs/ISSUE_LOG.md; docs/phases/P03/PHASE_RESULT.md; docs/reports/P03_SINGLE_FILE_BASELINE.md; docs/results/P03/DOOM-P3-040.md; evidence/manifests/P03/**; evidence/phase-gates/P03/**; evidence/reports/P03/**; evidence/logs/P03/P3-040/**; evidence/task-runs/P03-DOOM-P3-040/**; tests/test_p3_gate.py; tools/verify-p3-gate.py; tools/create-p3-review-bundle.py; dist/sfhs-doom-freedoom2.html
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Assemble the focused P3 gate, final artifact identity, and path-safe review
bundle. Keep P3-090 pending.

### Acceptance and commit

The five P3 commits exist; direct-file offline gameplay, audio, menu input,
movement/turn, artifact, path-safety, P2 gate, clean-tree, and remote checks
pass. Final output:
`SFHS_DOOM_P3_SINGLE_FILE_GATE=PASS_WITH_RECORDED_LIMITATIONS`

Commit:
`DOOM-P3-040 assemble lean single-file phase gate`

### Constraints

Do not run the global suite, change engine behavior, perform remote action, or
mark P3-090 complete.

### Work

Run the final focused P3 checks, create the gate validator and phase result,
and create a POSIX-path duplicate-free review bundle without WAD or sibling
runtime files.

### Exact verification

Run the accepted P2 gate, P3 focused tests, single-file manifest validator,
offline Playwright test, document/task validation, and Git/remote/clean checks.

### Evidence output

`docs/phases/P03/PHASE_RESULT.md`, `evidence/phase-gates/P03/**`, and
`evidence/reports/P03/SFHS-DOOM-P3-REVIEW.zip`.

### Stop/block conditions

Stop for any focused gate failure, unsafe archive path, duplicate entry,
external request, dirty worktree, or P3-090 completion.

### Commit

`DOOM-P3-040 assemble lean single-file phase gate`
