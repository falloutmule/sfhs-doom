# DOOM-P7-010 — Build content-independent engine

**Status:** READY  
**Depends on:** DOOM-P7-001

Build a separate Forge profile from the V16 player without Emscripten
`--embed-file` content. Keep native/shared sources read-only. Engine runtime may
initialize, but `callMain` is gated behind verified content mounting.

**Allowed paths:** `web/p7/**`, `tools/build-forge-capsule.sh`, Forge-specific
tests/docs, ignored build/evidence output. P6 source and V8–V16 artifacts are
read-only.
