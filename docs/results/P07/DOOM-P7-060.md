# TASK RESULT

**Task:** DOOM-P7-060 — Add the P7-B local analyzer
**Status:** PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING
**Base commit:** `457df6c3a698c624b132536ab6862fac91c54c53`
**Result commit:** SELF
**Branch:** `codex/p7b-local-wad-inspection`

## Work performed

Forge V2 adds an embedded worker that identifies selected files by bytes,
computes SHA-256, parses WAD and ZIP structures with strict bounds and quotas,
extracts only safe ZIP entries for inspection, verifies CRC-32, records map and
feature signals, and emits a read-only `sfhs.doom-inspection@1` record.

The full-screen pre-launch Forge UI now offers a 44-pixel local WAD/ZIP picker
and a compact phone inspection card with exact identity, compatibility status,
target, recommended base/loading method, maps, archive sizes, evidence, privacy,
and expandable details. It uses text nodes only and internal scrolling.

Selected content is never uploaded, persisted, written to MEMFS, placed in a
recipe, or launched. P7-C retains authority for recipe construction and test
launch. Built-in Freedoom still follows the P7-A verified mount and one-main path.

## Changed files

- P7 Forge shell and new analyzer worker.
- Forge build, packer, and validator with V1/V2-aware identity protection.
- Focused P7-B browser tests and Forge Python contract extensions.
- Forge V2 generated artifact, workflow preparation, evidence, and P7 docs.

No native Doom, shared SFHS control, simulation, renderer, HUD, save/demo,
mobile-control persistence, or protected artifact source changed.

## Exact verification

- Official pinned build: PASS.
- Forge V2 full/thin validator: PASS.
- P7-B Playwright: 9/9 PASS.
- Combined P7-B/P7-A/V16 Playwright: 22/22 PASS.
- Forge plus applicable protected Python contracts: 58/58 PASS.
- Deterministic full-capsule rebuild: exact byte match.
- Workflow YAML, task/phase docs, manifest, static hygiene, and diff check: PASS.
- Forge V1 and V8–V16 protected hashes: unchanged.

## Acceptance mapping

- WAD: IWAD/PWAD header, byte count/hash, directory, lump count/ranges/overlap,
  map families, DEHACKED, namespaces, advanced/unsupported markers, and duplicate
  lump names are inspected.
- ZIP: central/local records, traversal/absolute paths, encryption, file count,
  methods, expansion quotas/ratios, CRC, nested archives, executable content,
  docs, duplicate paths, and stored/deflated entries are covered.
- Compatibility: likely compatible, manual recipe required, and unsupported by
  this engine are evidence-backed; no item is falsely marked phone-tested or
  verified compatible.
- Phone: 360×800 and 915×412 proofs show internal scrolling, safe touch targets,
  no whole-page scroll, and a visible compatibility result.
- Isolation: MEMFS and mount snapshots stay unchanged; main remains zero during
  inspection; thin inspection cannot satisfy the exact-base gate.

## Failures

An early visual proof showed the inspection card constrained to the 4:3 world
region. The pre-launch surface was changed to a full-viewport panel, and the
corrected portrait/landscape proofs pass. One combined command was invoked from
the browser-test directory, so its preliminary package steps reported wrong
paths; it still ran the browser lane against the prior candidate. The commands
were rerun from repository root and all final evidence uses the official build.
A Windows-Python reproduction preserved different line endings, while
PowerShell blocked `npx.ps1`; the byte proof was therefore rerun with the
official WSL packager and normalization step, and browser proof used `npx.cmd`.

## Evidence

- `test-results/P07/P7-B/portrait-wad-inspection.json`
- `test-results/P07/P7-B/portrait-wad-inspection.png`
- `test-results/P07/P7-B/portrait-zip-inspection.png`
- `test-results/P07/P7-B/landscape-inspection.json`
- `test-results/P07/P7-B/landscape-inspection.png`
- `test-results/P07/P7-B/deterministic-rebuild.html`
- `build/runtime/P07-forge-v2/product/`
- `evidence/manifests/P07/sfhs-doom-forge-v2.json`

## Current exact state

- Artifact: `dist/sfhs-doom-forge-v2.html`
- Bytes: 25,852,127
- SHA-256: `927d744c11c219dfbaffd8486f84cec77093cb626a35d389ad37d14aaf01326e`
- Thin proof: 11,360,527 bytes, SHA-256
  `e37c49d878768ef85f97ff806c34bdc7e432a5906eda35035c587db92856bfd5`
- Worktree target after commit: clean

## Limitations and blockers

P7-B does not launch imported content, build recipes, persist a library, inspect
recursive archives, support ZIP64/encrypted/multi-disk archives, or claim phone
performance. Remote publication was not authorized, so Pages remains exact
Forge V1. Physical Samsung acceptance remains pending.

## Next task

Authorize candidate publication if desired, then verify selection, long SHA
wrapping, WAD/ZIP inspection, scrolling, responsiveness, and built-in Play on
Samsung before starting P7-C.
