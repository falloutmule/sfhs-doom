# SFHS Doom WebAssembly Feasibility Baseline

This P2 baseline records multi-file Wasm feasibility only. The accepted
toolchain is Emscripten 6.0.5 from the repository lock and Playwright 1.61.1
with Chromium and Firefox. The three artifact manifests under
`evidence/manifests/P02/` validate and retain separate JavaScript, Wasm, and
open Freedoom data files.

P2-060, P2-070, and P2-080 provide exact browser boot, real keyboard, and
trusted engine-audio evidence. P2-085 provides exact native/Chromium/Firefox
Oracle scalar and raw indexed-frame parity with normalization disabled and
PWAD-order claims excluded. No external runtime request, commercial Doom data,
or `SINGLE_FILE` packaging is part of this baseline.

The full 131-test Python discovery run is preserved as diagnostic evidence,
not as a P2 PASS condition. It contains accepted cross-phase infrastructure
debt listed in `docs/ISSUE_LOG.md`; the focused P2 gate remains blocking for all
P2 evidence and prints
`SFHS_DOOM_P2_WASM_FEASIBILITY_GATE=PASS_WITH_RECORDED_LIMITATIONS`.
