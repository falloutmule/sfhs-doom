# DOOM-P1-090 — Independent Read-Only Review

## Overall goal

Establish a trustworthy native Chocolate Doom reference that can detect meaningful differences when the same source is compiled to WebAssembly.

## Current goal

Independently review the completed P1 builder candidate at `0c8e1288a23e7306fa5760c1aadbf54de8d0b85c`.

## Verdict

**PASS_WITH_RECORDED_LIMITATIONS**

P1 is sufficiently sound to begin Phase P2 WebAssembly work. This verdict does not approve publication, release, remote operations, or any broader compatibility claim.

## Review input

- Review bundle: `SFHS-DOOM-P1-REVIEW.zip`
- Bundle SHA-256: `eb2150c437a908d4f359ca6bd2391e0512c6f0afa410d778cfc95b0daa00e2f8`
- Files in bundle: 39
- Reported branch: `phase/p01-native-oracle`
- Reported HEAD: `0c8e1288a23e7306fa5760c1aadbf54de8d0b85c`
- Reported base: `804ddb9ae855b65aeec922cd5f531c672b9b2c5f`
- Reported upstream: Chocolate Doom `chocolate-doom-3.1.1` at `410d96855b5df5410ff591a90efeafa889119224`
- Reported worktree: clean
- Reported remotes: official `upstream` only
- Reported builder gate: `SFHS_DOOM_P1_NATIVE_ORACLE_GATE=PASS`

## What was reviewed

The review directly inspected:

- P1 phase plan and phase result;
- all ten P1 task-result documents;
- native-oracle baseline and compatibility documents;
- commit log and changed-file/diff statistics;
- comprehensive P1 phase manifest;
- P1 gate validator and all seven gate regression tests;
- all engine-source files included in the review bundle;
- the new Oracle implementation;
- the final branch/remotes/gate state report;
- the corresponding pinned upstream Chocolate Doom source around every existing-source hook.

## Findings

### 1. Repository and task lineage — PASS

The supplied commit log contains exactly one ordered builder commit for:

- DOOM-P1-000
- DOOM-P1-010
- DOOM-P1-020
- DOOM-P1-030
- DOOM-P1-040
- DOOM-P1-050
- DOOM-P1-060
- DOOM-P1-070
- DOOM-P1-080
- DOOM-P1-085

No P1-090 builder commit is present. The final state records a clean worktree and only the official Chocolate Doom `upstream` remote.

### 2. Upstream engine delta — PASS

The behavioral-source delta is narrow and test-only:

- one default-OFF CMake option;
- two guarded hooks in existing Doom C files;
- new isolated observer source/header files.

The hooks observe post-tic state and the indexed logical framebuffer. They do not inject input, advance additional tics, change random state, mutate game objects, alter rendering, or expose runtime mutation hooks.

The source-edit budget is respected: two existing C files and one existing CMake file.

### 3. Compile-time isolation — PASS

`SFHS_ORACLE_TEST` defaults to OFF. The observer source and definitions are added only when the option is enabled. The supplied result documents report a separately rebuilt Oracle-OFF control that completed the same 140-tic run and emitted no Oracle files.

### 4. Gate design — PASS

`tools/verify-p1-gate.py` is materially stronger than a simple “program launched” check. It verifies:

- branch, ancestry, remotes, task state, and commit subjects;
- clean post-commit state;
- exact result-document hashes;
- exact artifact sizes and SHA-256 values;
- repeated Debug and Release build identities;
- fixture validation;
- 14/14 demo results;
- stable 7/7 timedemo results;
- five deterministic Oracle processes;
- state and 320×200 indexed-frame hashes;
- instrumentation-OFF behavior;
- DeHackEd state isolation;
- native gameplay evidence markers.

The corrected gate tests now test manifest tampering in memory and no longer defeat themselves by dirtying the worktree.

### 5. Native oracle usefulness — PASS, bounded

The observer captures stable integer values including:

- tic and level time;
- episode, map, skill, and game state;
- player position and angle;
- health, armor, weapon, kills, items, and secrets;
- RNG index;
- ammo and maximum ammo;
- raw 320×200 indexed logical framebuffer bytes.

Together with demo completion and strict/timedemo evidence, this is sufficient for P2 to detect many real simulation and rendering regressions rather than merely detect whether a canvas appears.

### 6. Open-data boundary — PASS from supplied records

The task results consistently separate:

- Chocolate Doom source;
- ignored official Freedoom data;
- project-authored CC0 fixture data;
- excluded commercial Doom data.

No commercial data appears in the review bundle.

## Recorded limitations

### L1 — The review bundle is not self-contained

The comprehensive phase manifest binds 78 runtime artifacts, but none of those 78 files are included in this compact review ZIP. Missing review inputs include:

- native executables;
- Freedoom archive and WADs;
- gameplay screenshots;
- demo and timedemo matrices;
- Oracle state files;
- Oracle framebuffer files;
- Oracle run results;
- fixture data;
- build manifests.

Therefore this independent review could audit the validator, source, contracts, commit record, and result-document hashes, but could not independently recompute the 78 runtime artifact hashes or visually inspect the gameplay/frame evidence from the uploaded bundle.

The local builder gate reportedly did recompute those files and passed. Future phase-review bundles should include at least the small evidence files, matrices, screenshots, state files, and selected framebuffer files even when large WADs and executables remain excluded.

### L2 — PWAD ordering is not proven by P1

The P1-080 result says A/B and B/A produced identical complete Oracle signatures. That proves deterministic loading under both command lines, but it does **not** prove that the later-loaded fixture wins or that order is observable.

The P1 documents must not describe this as verified PWAD-order behavior. Treat PWAD ordering as `UNTESTED` until the P4/P8 order fixture exposes and checks the resolved duplicate lump or another unambiguous order-dependent result.

This limitation does not block P2’s initial native/Wasm simulation and framebuffer parity work.

### L3 — Oracle state coverage is deliberately narrow

The observer does not yet include a thinker/world-state digest, dynamic-sector digest, all ammo/power/key fields, or save/config hashes. The selected scalar state, demo results, and raw framebuffer checkpoints are meaningful for initial P2 comparison, but they are not the final P8 compatibility oracle.

P8 must harden coverage before any full vanilla-compatibility claim.

### L4 — Final current-state documents contain pre-commit wording

`docs/CURRENT_STATE.md`, `docs/UPSTREAM_DELTA.md`, and the Sol gate packet retain `SELF`, P1-085-current, or pre-packet builder-head wording. The final review-state file supplies the actual HEAD, so this is not an identity ambiguity for this review, but the first P2 governance commit should update the current task/phase wording without rewriting P1 evidence.

### L5 — Scope remains open-data native WSL only

P1 proves the recorded Ubuntu WSL/Freedoom lanes only. It does not prove:

- commercial Doom IWAD behavior;
- broad PWAD or DeHackEd compatibility;
- saves/config interchange;
- WebAssembly behavior;
- browser rendering or audio;
- Android behavior;
- single-file packaging;
- release readiness.

## Independent gate answers

| Review question | Answer |
|---|---|
| Correct pinned source and toolchain? | PASS from bound documents and validator design |
| Truthful upstream test coverage? | PASS; absence is represented rather than manufactured |
| Both Freedoom editions enter gameplay? | BUILDER-VERIFIED; evidence files absent from compact review ZIP |
| Demo and strict-demo useful? | PASS for bounded fixtures and official Freedoom DEMO1 |
| Timedemo stable? | BUILDER-VERIFIED 7/7 |
| Oracle deterministic? | BUILDER-VERIFIED five processes; validator logic is sound |
| Frame capture before host scaling? | PASS by source inspection of `I_VideoBuffer` capture |
| Instrumentation default OFF and inert? | PASS by source inspection and reported OFF control |
| DeHackEd fixture meaningful? | PASS; one intended field changes and frames respond |
| PWAD-order fixture meaningful? | NO; record as untested |
| Later Wasm comparison can fail meaningfully? | YES for demo, scalar state, RNG, and logical framebuffer |
| P1-090 self-approved by builder? | NO |
| Remote/publication action? | None reported |

## Exact state

### Verified by direct review

- Review ZIP SHA-256 and contents.
- Ten-task commit sequence recorded in the bundle.
- Final reported HEAD/branch/remotes/worktree state.
- Result-document hashes for P1-000 through P1-080 match the phase manifest.
- Oracle source is compile-time gated and read-only.
- Existing-source edit count stays inside the declared budget.
- Gate validator and regression tests are logically capable of rejecting the declared failures.
- Project claims are generally bounded to native WSL/Freedoom evidence.

### Builder-verified but not independently recomputed from this ZIP

- Executable hashes and sizes.
- WAD/archive hashes.
- Gameplay screenshot contents.
- Demo/timedemo matrix contents.
- Five-run state/frame equality.
- Oracle-OFF runtime result.
- Full post-commit test execution.

### Untested

- WebAssembly and browser behavior.
- Commercial Doom data.
- Broad mod behavior.
- Save/config parity.
- Mobile and single-file packaging.

## Blockers

No architecture blocker prevents Phase P2.

PWAD-order verification is not accepted, but it belongs to a later launcher/compatibility lane and does not block the first WebAssembly proof.

## Authorization boundary

This review authorizes **planning and local execution of Phase P2 only**.

It does not authorize:

- creation of an origin;
- push or pull request;
- merge;
- publication;
- release;
- deployment.

## Next actionable step

Create the complete P2 continuous Luna phase for:

1. pinned Emscripten toolchain;
2. multi-file Wasm build;
3. browser boot with pinned Freedoom;
4. the same demo/state/frame checkpoints compared against the accepted P1 native baseline;
5. no single-file packaging yet.
