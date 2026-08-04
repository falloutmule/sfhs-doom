# SFHS Doom P02 Phase Result

**Status:** PASS_WITH_RECORDED_LIMITATIONS
**Gate:** `SFHS_DOOM_P2_WASM_FEASIBILITY_GATE=PASS_WITH_RECORDED_LIMITATIONS`
**Branch:** `phase/p02-wasm-feasibility`
**P2-085 base:** `84ac4fdd1f31412368b314846fcbf30904bfa79a`
**Selected upstream:** `chocolate-doom-3.1.1` /
`410d96855b5df5410ff591a90efeafa889119224`

## Accepted focused evidence

- Project documents and task state validate.
- All three P2 artifact manifests validate, including real configure/build
  command logs captured under `evidence/task-runs/P02-DOOM-P2-088/`.
- The existing eight P2 browser regression tests and the P2 parity test passed.
- `NATIVE_WASM_COMPARE=PASS`; scalar state and raw indexed framebuffer parity
  are exact at the recorded checkpoints with no normalization and no PWAD-order
  claim.
- Chromium and Firefox boot, input, and user-gesture engine-audio evidence
  passed; no page errors, failed requests, commercial data, or single-file
  packaging were accepted.
- P2-090 remains pending and reserved for independent review.

## Diagnostic limitation

The preserved complete WSL global discovery run executed 131 tests and reported
12 failures and 5 errors after manifest repair; the earlier pre-repair run
reported 13 failures and 5 errors. Every exact identifier and the required
infrastructure classifications are recorded in `docs/ISSUE_LOG.md`. The global
suite is diagnostic and non-blocking for P2; no global-suite PASS claim is made.

Evidence: `evidence/task-runs/P02-DOOM-P2-088/full-unit-suite.txt`,
`evidence/task-runs/P02-DOOM-P2-088/full-unit-suite-exact.txt`,
`evidence/task-runs/P02-DOOM-P2-088/manifest-phase*/`, and
`evidence/phase-gates/P02/`.
