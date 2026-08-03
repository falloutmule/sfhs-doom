# SFHS Doom Current State

**Date:** 2026-08-03
**Phase:** P01 — Native Chocolate Doom Oracle
**Current task:** DOOM-P1-000
**Current result commit:** SELF
**Branch:** phase/p01-native-oracle

## Verified reality

- P0-070 completed the evidence, build-identity, and artifact-manifest contract at commit 804ddb9ae855b65aeec922cd5f531c672b9b2c5f.
- The P1 branch was created from that exact P0-070 HEAD.
- The pinned Chocolate Doom release is chocolate-doom-3.1.1 at 410d96855b5df5410ff591a90efeafa889119224.
- The official upstream remote is named upstream; no user-owned origin exists.
- The default WSL2 distribution is Ubuntu 24.04.4 LTS on x86_64. GCC 13.3.0 and Python 3.12.3 were directly observed.
- Initial WSL inventory did not find CMake, Ninja, pkg-config, SDL2 development packages, SDL2_mixer, or Xvfb. P1-010 owns the authorized package installation and doctor evidence.
- No native build, Emscripten build, browser run, gameplay run, compatibility result, release artifact, or commercial game data has been produced or inspected.
- No remote creation, remote mutation, push, pull request, merge, publication, or release action has occurred.
- No engine source or upstream build file has been changed.

## Source-of-truth order

After P1-000, workers use:

    AGENTS.md
    docs/PROJECT_SPEC.md
    docs/CURRENT_STATE.md
    docs/phases/P01/PHASE_PLAN.md
    docs/tasks/P01/<TASK-ID>.md
    relevant source, tests, and official metadata

The accepted specification remains unchanged. The P1 packet and P1 phase plan are the temporary/current phase authority for P1 task execution.

## Deferred tasks

DOOM-P0-080 and DOOM-P0-090 remain pending/deferred. They are not completed by P1-000.

## Next task

DOOM-P1-010 pins and verifies the native WSL2 host/toolchain. Both narrow P1-000 governance-tool repairs were explicitly authorized and completed in the single P1-000 task.
