# SFHS Doom — Phase P07 Plan

**Phase:** P07 — WAD Forge and Doom Capsules  
**Current tranche:** P7-A — Forge-capable runtime  
**Status:** FROZEN FOR EXECUTION  
**Branch:** `feature/p7a-forge-runtime`  
**Base:** V16 repair `8e2c4be70ca16f7c0909cd67224b63679cfb2cad`

## Authority and product boundary

[`docs/FORGE_SPEC.md`](../../FORGE_SPEC.md) is the canonical complete Forge
specification. P7-A implements only the separable runtime and verified payload
mounting foundation. It does not present placeholder Library, Browse, Build, or
Verify product surfaces.

The committed V8–V16 artifacts are protected. The V16 player remains the
behavioral baseline: native 320×200 world, native 320×32 detached HUD, minimap,
controls, panel preferences, LOOK tap options, weapon-cycle repair, audio,
fullscreen, lifecycle, renderers, saves, demos, and one `callMain`.

## P7-A task graph

`DOOM-P7-001 -> DOOM-P7-010 -> DOOM-P7-020 -> DOOM-P7-030 -> DOOM-P7-040 -> DOOM-P7-050`.

| Task | Work | Acceptance |
|---|---|---|
| DOOM-P7-001 | Adopt Forge authority and freeze P7-A | Canonical spec, phase plan, cards, failure audit, and boundaries are committed. |
| DOOM-P7-010 | Build content-independent engine | Same product runtime builds without an embedded IWAD and does not start before a verified mount. |
| DOOM-P7-020 | Deterministic manifest/payload packer | Full and thin capsules have canonical manifests; full chunks deterministic gzip bytes. |
| DOOM-P7-030 | Verify and mount payload | Full chunks and a thin local file stream into MEMFS with exact byte/hash verification; every failure prevents start. |
| DOOM-P7-040 | Preserve V16 player parity | Verified payload launches exactly once into the complete V16 player; P7-A boot UI stays bounded and honest. |
| DOOM-P7-050 | Gate and publish | Exact artifacts and regressions pass, V16 becomes root Pages, Forge becomes `/forge/`, and both live hashes match. |

## Failure audit

P7-A explicitly covers: oversized artifact/memory pressure; corrupt, truncated,
missing, reordered, or duplicate chunks; bad schema/manifest/decoded hash;
unsupported gzip; interrupted thin-file reads; premature or repeated launch;
wrong base selection; partial MEMFS writes; direct-file restrictions; external
requests; renderer/input/HUD/audio regressions; stale identities; protected-byte
mutation; and deployment drift. A failed mount removes partial files, exposes a
recoverable error, and leaves main invocation count at zero.

## Exact artifacts

- Full committed capsule: `dist/sfhs-doom-forge-v1.html`.
- Thin run-local capsule: `test-results/P07/P7-A/sfhs-doom-forge-v1-thin.html`.
- Product root after publication: exact V16.
- Preview route after publication: exact full Forge capsule at `/forge/`.

## Exit state

Automated P7-A success is `PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING`. Samsung must
confirm mount time, player parity, WPN-/WPN+, controls, audio, orientation, and
no browser scrolling. Automated evidence cannot claim physical acceptance.
