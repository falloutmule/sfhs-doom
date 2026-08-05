# P3 Clean Packaging Input Baseline

**Task:** DOOM-P3-010
**Source commit:** `fe813d24d721fcf3b3857502eb0562e94c392701`
**Toolchain:** Emscripten 6.0.5, pinned emsdk lock
**WAD:** Freedoom Phase 2 v0.13.0, SHA-256
`a8772e088847032510d97ba2312406a6998f21cbab44d4ff10696faa9c0ecd4b`

The phase2-debug and phase2-oracle inputs were built from empty ignored
`build/wasm/p3-input/` directories with the accepted P2 configure flags. Real
configure and build output is recorded under
`evidence/task-runs/P03-DOOM-P3-010/`. Both JavaScript and Wasm outputs exist;
the P3 input remains multi-file and contains no `SINGLE_FILE` marker.
