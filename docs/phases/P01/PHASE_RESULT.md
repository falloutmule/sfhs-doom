# PHASE RESULT

Phase: P01 — Native Chocolate Doom Oracle
Status: PASS — BUILDER CANDIDATE FOR INDEPENDENT REVIEW
Base commit: 804ddb9ae855b65aeec922cd5f531c672b9b2c5f
Candidate commit: SELF
Branch: phase/p01-native-oracle
Remote/PR authorization: NONE

## What was delivered

P01 establishes a bounded native Chocolate Doom oracle on the pinned Ubuntu
WSL2 host: toolchain identity, repeatable Debug/Release builds, truthful upstream
test availability, pinned open Freedoom data, gameplay evidence, deterministic
project fixtures, demo/strict/timedemo matrices, and a default-OFF test observer
for deterministic logical state and indexed framebuffer checkpoints.

## Builder verification

- Four variants rebuilt from clean ignored directories at committed P1-080 source.
- Pinned Freedoom archive/WAD identities and both gameplay lanes remain present.
- Project fixture generation, hashes, provenance, tamper rejection, and native probes pass.
- Demo matrix is 14/14 PASS; timedemo matrix is stable 7/7 PASS.
- Native Oracle comparison passes across five processes, both PWAD orders, and a targeted DeHackEd effect.
- Oracle-OFF completes the 140-tic demo and emits no observer artifacts.
- The comprehensive phase manifest recomputes every bound byte size and SHA-256.
- Project-document, task-state, artifact-manifest, fixture, and phase-gate validators pass.

## Task results

| Task | Status | Commit | Evidence |
|---|---|---|---|
| DOOM-P1-000 | PASS | `840fac0287f89810d346b72ac5977221fab97b57` | `docs/results/P01/DOOM-P1-000.md` |
| DOOM-P1-010 | PASS | `a70068ffc8aac5a93ffe281461f2967bc7ff71d2` | `docs/results/P01/DOOM-P1-010.md` |
| DOOM-P1-020 | PASS | `2376b4341d67e872222f7edc56dbcef6756bff37` | `docs/results/P01/DOOM-P1-020.md` |
| DOOM-P1-030 | PASS | `44cc36377e0db83709428cc8ec6f9c28d783fdb4` | `docs/results/P01/DOOM-P1-030.md` |
| DOOM-P1-040 | PASS | `df474c7270ed193f3062e81f3febff2794e6d292` | `docs/results/P01/DOOM-P1-040.md` |
| DOOM-P1-050 | PASS | `591a89eed883abc61ce32fac47b22503fea8091f` | `docs/results/P01/DOOM-P1-050.md` |
| DOOM-P1-060 | PASS | `b06baf72a78539e5ebd130aba9cee0f159ca2f84` | `docs/results/P01/DOOM-P1-060.md` |
| DOOM-P1-070 | PASS | `f888f68ea721e7b01fb54946a1bc723b3248b608` | `docs/results/P01/DOOM-P1-070.md` |
| DOOM-P1-080 | PASS | `ac9d51be7ec28162920212898ffec34b7315c913` | `docs/results/P01/DOOM-P1-080.md` |
| DOOM-P1-085 | PASS candidate | `SELF` | `docs/results/P01/DOOM-P1-085.md` |

## Scope and delta verdict

Each builder task has one coherent local commit. The only engine/build delta is
the P1-080 observer: two existing C files and one existing CMake file plus new
isolated sources. It is compiled only with `SFHS_ORACLE_TEST=ON`; the default is
OFF. No WebAssembly, browser, package, commercial-data, remote, parent-workspace,
or release action is part of this phase result.

## Evidence quality and limitations

The evidence is strong for the named native WSL artifacts, open inputs, bounded
gameplay lanes, fixture parsers, demo cases, and deterministic Oracle fields.
It does not prove universal vanilla/mod compatibility, commercial-data behavior,
other hosts, WebAssembly, browsers, mobile devices, presentation equivalence,
performance, packaging, or release readiness.

## Current exact state

The builder candidate is branch `phase/p01-native-oracle` with upstream-only
remote policy. `SELF` resolves to the single P1-085 containing commit after it
is created. The worktree must be clean and the gate rerun after that commit.

## Blockers and next phase

No builder blocker remains. DOOM-P1-090 is ready for independent read-only Sol
review and remains pending. Only that independent review may assign the phase
gate verdict; this builder result does not self-approve P2 or publication.
