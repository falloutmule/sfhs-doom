## DOOM-P6-040 — Build Android single-file candidate

**Intelligence:** LUNA-M
**Phase:** P06
**Status:** PENDING
**Depends on:** DOOM-P6-030
**Branch:** phase/p06-android-portrait
**Allowed files/directories:** dist/sfhs-doom-android.html; tools/validate-p6-mobile.py; tools/create-p6-review-bundle.py; browser-tests/tests/p6-candidate.spec.mjs; tests/test_p6_mobile_contract.py; docs/BUILD_IDENTITY.md; docs/CURRENT_STATE.md; docs/ISSUE_LOG.md; docs/phases/P06/**; docs/reports/P06_ANDROID_CANDIDATE.md; docs/results/P06/DOOM-P6-040.md; .agent/task-state.json
**Parallel:** No
**Remote authorization:** NONE

### Goal

Build and prove the final local Android candidate.

### Constraints

Do not alter the protected P3 artifact, run the historical suite, or perform remote work.

### Work

Run only the P6 focused gate, commit a truthful manifest, then create an external review bundle.

### Exact verification

Run P6 tests, static one-file/manifest checks, P3 identity check, and Git/remote status checks.

### Acceptance

Emit `SFHS_DOOM_P6_ANDROID_CANDIDATE_GATE=PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING`.

### Evidence output

- test-results/P06/P6-040/

### Stop/block conditions

Stop for any failed focused check; do not run the global suite.

### Commit

DOOM-P6-040 build Android single-file candidate
