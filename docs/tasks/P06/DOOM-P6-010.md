## DOOM-P6-010 — Add portrait shell and control editor

**Intelligence:** LUNA-M
**Phase:** P06
**Status:** PENDING
**Depends on:** DOOM-P6-000
**Branch:** phase/p06-android-portrait
**Allowed files/directories:** web/p6/**; tools/build-single-file.sh; browser-tests/tests/p6-layout.spec.mjs; tests/test_p6_mobile_contract.py; tests/fixtures/p6/**; docs/reports/P06_PORTRAIT_SHELL.md; docs/results/P06/DOOM-P6-010.md; .agent/task-state.json
**Parallel:** No
**Remote authorization:** NONE

### Goal

Add the portrait shell, editable normalized control profile, and landscape fallback.

### Constraints

No C, gameplay, renderer, P4-runtime, or protected-P3 artifact change.

### Work

Implement only the shell/editor/build-profile work frozen in P6 plan.

### Exact verification

Run the P6 layout and contract tests at 360×800, 400×844, and 800×360.

### Acceptance

All four portrait regions are visible without page scroll; edit/import/export is safe.

### Evidence output

- test-results/P06/P6-010/

### Stop/block conditions

Stop for C-source need, protected P3 change, or test-budget overflow.

### Commit

DOOM-P6-010 add portrait shell and control editor
