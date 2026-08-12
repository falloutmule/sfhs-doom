# DOOM-P7-030 — Verify and mount declared payloads

**Status:** READY  
**Depends on:** DOOM-P7-020

Validate the manifest, decode ordered chunks, stream gzip output into MEMFS,
and verify decoded bytes plus SHA-256 before launch. Thin mode accepts only an
exact locally selected Freedoom Phase 2 payload. All failures remove partial
files and leave the main invocation count at zero.

**Allowed paths:** Forge shell/runtime/tests/docs and ignored evidence only.
