# SFHS Doom P03 Phase Result

**Status:** PASS_WITH_RECORDED_LIMITATIONS
**Gate:** `SFHS_DOOM_P3_SINGLE_FILE_GATE=PASS_WITH_RECORDED_LIMITATIONS`
**Branch:** `phase/p03-single-file`
**Base:** `48b61cccea64ab2a4d29e3f293cbce142aee4de9`
**Upstream:** `chocolate-doom-3.1.1` /
`410d96855b5df5410ff591a90efeafa889119224`

## Accepted focused evidence

- The final product is exactly `dist/sfhs-doom-freedoom2.html`, with embedded
  Wasm and open Freedoom Phase 2 data and no sibling runtime files.
- Chromium direct-file trusted Start, engine audio, menu keyboard input,
  heartbeat, and zero-request checks passed.
- Firefox direct-file startup, gameplay, keyboard input, heartbeat, callbacks,
  page-error, and zero-request checks passed. Its engine-created AudioContext
  remained suspended after the bounded trusted-task resume attempt; this is the
  recorded browser limitation accepted for P3.
- Fresh Chromium Oracle control and movement sessions reached matching tic-35
  episode/map/skill checkpoints with raw position differences.
- The accepted P2 focused gate is carried forward as
  `PASS_WITH_RECORDED_LIMITATIONS`; the historical P2 validator is branch-bound
  to P2 and is not rerun as a P3 product check.
- The review ZIP is POSIX-path, duplicate-free, traversal-safe, and excludes
  WAD, Wasm, data, and ignored runtime inputs.
- P3-090 remains pending for independent review.

The historical global Python discovery suite was not run in P3.
