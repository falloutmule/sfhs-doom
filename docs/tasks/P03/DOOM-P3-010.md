## DOOM-P3-010 — Clean-rebuild single-file packaging inputs

**Intelligence:** LUNA-M  
**Phase:** P03  
**Depends on:** DOOM-P3-000  
**Branch:** phase/p03-single-file  
**Allowed files/directories:** .agent/task-state.json; docs/reports/P03_CLEAN_INPUT_BASELINE.md; docs/results/P03/DOOM-P3-010.md; evidence/logs/P03/P3-010/**; evidence/manifests/P03/p2-phase2-debug-input.json; evidence/manifests/P03/p2-phase2-oracle-input.json; evidence/task-runs/P03-DOOM-P3-010/**; tools/verify-p3-input.py; tests/test_p3_input.py
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Clean-rebuild only the accepted P2 Phase 2 debug and Oracle multi-file inputs
into ignored P3 directories, preserving source and P2 behavior.

### Acceptance and commit

Real compilation logs, valid input manifests, three focused tests, and the P2
focused gate pass. Commit:
`DOOM-P3-010 clean-rebuild single-file packaging inputs`

### Constraints

No source edits, broad parity rerun, global suite, network, commercial data,
or remote action.

### Work

Use the pinned WSL toolchain and existing P2 build profile to clean-build only
the Phase 2 debug and Oracle inputs, capturing real command logs and hashes.

### Exact verification

Run the two clean input builds, `python tools/verify-p3-input.py`, its focused
unit tests, the accepted P2 gate, and task validation.

### Evidence output

`docs/reports/P03_CLEAN_INPUT_BASELINE.md`, P3-010 manifests, and task-run logs.

### Stop/block conditions

Stop if clean compilation, input identity, or the accepted P2 gate fails.

### Commit

`DOOM-P3-010 clean-rebuild single-file packaging inputs`
