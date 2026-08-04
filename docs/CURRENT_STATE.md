# SFHS Doom Current State

**Date:** 2026-08-03
**Phase:** P01 — Native Chocolate Doom Oracle
**Current task:** DOOM-P1-085
**Current result commit:** SELF
**Branch:** phase/p01-native-oracle

## Verified reality

- P0-070 completed the evidence, build-identity, and artifact-manifest contract at commit 804ddb9ae855b65aeec922cd5f531c672b9b2c5f.
- The P1 branch was created from that exact P0-070 HEAD.
- The pinned Chocolate Doom release is chocolate-doom-3.1.1 at 410d96855b5df5410ff591a90efeafa889119224.
- The official upstream remote is named upstream; no user-owned origin exists.
- The default WSL2 distribution is Ubuntu 24.04.4 LTS on x86_64. GCC 13.3.0 and Python 3.12.3 were directly observed.
- The P1-010 native toolchain is installed and directly verified in the existing WSL2 distribution.
- Native Debug, Release, Oracle, and Oracle-OFF builds pass from clean ignored directories. The P1-085 rebuild identities are bound in `docs/BUILD_IDENTITY.md` and the phase manifest.
- Freedoom v0.13.0 Phase 1 and Phase 2 assets are pinned in an ignored cache; both entered native gameplay with captured evidence. No commercial game data was downloaded or inspected.
- Project-created fixtures verify deterministically with complete bounded CC0-1.0 provenance. Normal/strict demo playback and timedemo matrices pass.
- The compile-time-gated native Oracle produces identical scalar-state and 320x200 indexed-frame checkpoints across five processes. The OFF control emits no oracle artifacts.
- No Emscripten build, browser run, mobile-device run, single-file artifact, or release artifact exists in P01.
- No remote creation, remote mutation, push, pull request, merge, publication, or release action has occurred.
- The only engine/build delta is the default-OFF P1-080 test observer recorded in `docs/UPSTREAM_DELTA.md`; ordinary Release behavior remains outside the observer path.

## Source-of-truth order

After P1-000, workers use:

    AGENTS.md
    docs/PROJECT_SPEC.md
    docs/CURRENT_STATE.md
    docs/phases/P01/PHASE_PLAN.md
    docs/tasks/P01/<TASK-ID>.md
    relevant source, tests, and official metadata

The accepted specification remains unchanged. The P1 packet and P1 phase plan are the temporary/current phase authority for P1 task execution.

## Deferred and independent tasks

DOOM-P0-080 and DOOM-P0-090 remain pending/deferred. They are not completed by P1-000.

DOOM-P1-090 remains pending and ready for an independent read-only Sol review.
P1-085 does not self-award that verdict and does not authorize P2 implementation,
remote publication, or release work.

## Next task

Commit the passing DOOM-P1-085 gate packet once, verify a clean worktree, rerun
`python tools/verify-p1-gate.py`, and hand the repository to independent
DOOM-P1-090 review. Do not mark P1-090 complete in the builder run.
