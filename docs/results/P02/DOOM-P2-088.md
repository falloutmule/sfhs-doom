# TASK RESULT

**Task:** DOOM-P2-088
**Status:** PASS_WITH_RECORDED_LIMITATIONS
**Base commit:** 84ac4fdd1f31412368b314846fcbf30904bfa79a
Result commit: SELF
**Branch:** phase/p02-wasm-feasibility

## Acceptance decision

The focused P2 acceptance set passes. The complete global Python discovery
suite is preserved as diagnostic, non-blocking evidence and is not labeled
PASS. The final gate is:

`SFHS_DOOM_P2_WASM_FEASIBILITY_GATE=PASS_WITH_RECORDED_LIMITATIONS`

## Focused verification

- `python tools/validate_project_docs.py` — `PROJECT DOCUMENTS PASS`.
- `python tools/taskctl.py validate` — `VALIDATE PASS`.
- `python -m unittest tests.test_p2_gate` — 9 tests, OK.
- All three P2 artifact manifests validate; each declared configure/build log
  exists and was captured from the pinned local WSL toolchain.
- Existing P2-060 boot, P2-070 input, and P2-080 audio evidence passes: eight
  browser regression tests, with no page errors or failed requests.
- Existing P2-085 parity evidence passes: `NATIVE_WASM_COMPARE=PASS`, exact
  scalar state and raw indexed framebuffer equality, normalization `none`,
  and PWAD-order claim `excluded`.
- Branch, P1 ancestry, official upstream-only remotes, no commercial data,
  no external runtime requests, multi-file artifacts, and pending P2-090 are
  checked by `tools/verify-p2-gate.py`.

## Recorded global-suite limitation

The exact pre-repair run completed 131 tests with 13 failures and 5 errors;
the missing-manifest-log failure was then repaired by capturing real logs.
The exact post-repair run completed 131 tests with 12 failures and 5 errors.
The full output is preserved at:

- `evidence/task-runs/P02-DOOM-P2-088/full-unit-suite.txt`
- `evidence/task-runs/P02-DOOM-P2-088/full-unit-suite-exact.txt`

All exact test identifiers are listed in `docs/ISSUE_LOG.md`. Each is marked
`KNOWN_INFRASTRUCTURE_DEBT`, `NOT_PRODUCT_BEHAVIOR_EVIDENCE`, and
`DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR`. The categories are stale P1
branch/manifest/fixture assumptions, Windows-to-WSL path assumptions, and
outdated toolchain negative-fixture assumptions.

## Evidence

- `evidence/manifests/P02/`
- `evidence/task-runs/P02-DOOM-P2-088/manifest-phase*/`
- `evidence/task-runs/P02-DOOM-P2-060/`
- `evidence/task-runs/P02-DOOM-P2-070/`
- `evidence/task-runs/P02-DOOM-P2-080/`
- `evidence/task-runs/P02-DOOM-P2-085/`
- `evidence/phase-gates/P02/`

## Current exact state

P2-085 remains committed at `84ac4fdd1f31412368b314846fcbf30904bfa79a` until
this task's single commit. P2-090 remains pending and is not self-approved.
No remote or destructive action occurred.
