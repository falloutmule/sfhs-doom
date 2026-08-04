# First Upstream Wasm Link Probe

**Task:** DOOM-P2-040  
**Status:** VERIFIED DIRECT_SUCCESS

This report records the first unmodified-source `chocolate-doom` link attempt from the P2-030 Emscripten configure tree. The only IWAD inspected by the probe is the accepted open Freedoom Phase 2 WAD from ignored local P1 state; no commercial data is used. No source, CMake, renderer, gameplay, or SDL replacement is permitted here.

The probe captured the full compiler/link output, Emscripten and wasm-ld identities, flags, undefined symbols, file set, artifact hashes, and a loopback server load result. The unmodified target classified as `DIRECT_SUCCESS`; the generated JavaScript/Wasm pair loaded with HTTP 200 from `127.0.0.1`.

## P2-050 repair boundary

If the unmodified link fails within the accepted boundary, P2-050 may touch only its listed platform adapter, CMake, shell, and web-shell paths. It may not rewrite gameplay, renderer, WAD handling, SDL ports, source architecture, or the upstream base. Any failure outside those paths is an architecture blocker and must not be normalized into a PASS.

## Evidence

All probe output is under `evidence/task-runs/P02-DOOM-P2-040/` and the compact classification is mirrored under `evidence/logs/P02/P2-040/`. The result remains a link-probe classification, not a gameplay or product-behavior claim.
