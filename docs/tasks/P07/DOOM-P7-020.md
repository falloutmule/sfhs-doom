# DOOM-P7-020 — Package deterministic capsule payloads

**Status:** READY  
**Depends on:** DOOM-P7-010

Create the `sfhs.doom-capsule@1` manifest and deterministic gzip/base64 chunk
packer. Produce a committed full artifact and ignored thin artifact from the
same engine shell. Full payload chunks are ordered and non-executable; thin
capsules contain no payload chunks.

**Allowed paths:** Forge shell/build/packer/schema/tests/docs, full generated
Forge artifact, and ignored P7-A output only.
