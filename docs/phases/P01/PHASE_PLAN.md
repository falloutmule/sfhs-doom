# SFHS Doom — Frozen Phase P01 Plan

**Phase:** P01 — Native Chocolate Doom Oracle
**Status:** FROZEN FOR EXECUTION
**Planning authority:** docs/PROJECT_SPEC.md, root AGENTS.md, the accepted P1 execution packet, then the individual P1 task cards
**Accepted upstream:** Chocolate Doom chocolate-doom-3.1.1 at 410d96855b5df5410ff591a90efeafa889119224
**Starting commit:** 804ddb9ae855b65aeec922cd5f531c672b9b2c5f
**Phase branch:** phase/p01-native-oracle
**Remote boundary:** Local-only. No origin creation, push, PR, merge, tag, release, or publication.
**Status vocabulary:** VERIFIED, INFERRED, PROPOSED, UNTESTED, BLOCKED

## Goal

Create a trustworthy native Chocolate Doom oracle before WebAssembly work: pin the host/toolchain, build Debug/Release/Oracle variants, verify open Freedoom data and gameplay, establish deterministic fixtures and demo evidence, and produce a test-only state/logical-framebuffer comparison contract.

## Scope and non-goals

### In scope

- Existing default WSL2 Linux distribution and its directly inspected toolchain.
- CMake + Ninja native builds with the packet’s parity options.
- Official stable Freedoom release assets in an ignored cache only.
- Native smoke, fixture, demo, timedemo, state, and logical-framebuffer evidence.
- Narrow compile-time-gated test-only oracle instrumentation within the P1-080 edit budget.
- One local commit per passing builder task and a read-only Sol gate packet.

### Out of scope

- WebAssembly, Emscripten, browser shell, single-file packaging, multiplayer, or commercial Doom data.
- Windows-host package installation, Docker, a new WSL distribution, remote writes, release publication, or destructive Git operations.
- Any gameplay, renderer, timing, input, audio, save, or network redesign.
- Marking DOOM-P0-080, DOOM-P0-090, or DOOM-P1-090 complete without their actual gates.

## Source of truth

Workers read, in order:

    AGENTS.md
    docs/PROJECT_SPEC.md
    docs/CURRENT_STATE.md
    docs/phases/P01/PHASE_PLAN.md
    docs/tasks/P01/<TASK-ID>.md
    relevant source, tests, and official metadata

The attached P1 continuous execution packet is the frozen phase authority for task scope, exact commands, and stop conditions. docs/PROJECT_SPEC.md remains unchanged.

The user authorized a one-time P1-000 amendment allowing tools/taskctl.py and tests/test_taskctl.py to replace P00-only roots with phase-aware card/result resolution. This repair remains part of the single P1-000 commit.

The user then authorized a second narrow P1-000 amendment allowing tools/validate_project_docs.py and tests/test_project_docs.py to add phase-aware P## document validation and no-argument repository validation. This repair also remains part of the single P1-000 commit.

## Task graph

| Task | Intelligence | Dependency | Remote authorization | Done when |
|---|---|---|---|---|
| DOOM-P1-000 | LUNA-L | DOOM-P0-070 | NONE | Plan/cards installed and validated |
| DOOM-P1-010 | LUNA-M | DOOM-P1-000 | NONE | Existing WSL/toolchain is pinned and doctored |
| DOOM-P1-020 | LUNA-M | DOOM-P1-010 | NONE | Debug/Release builds and manifests pass twice |
| DOOM-P1-030 | LUNA-M | DOOM-P1-020 | NONE | Upstream test availability is truthfully recorded |
| DOOM-P1-040 | LUNA-L | DOOM-P1-030 | Read-only official release retrieval | Freedoom assets are cached and hash-verified |
| DOOM-P1-050 | LUNA-M | DOOM-P1-040 | NONE | Both Freedoom IWADs enter gameplay |
| DOOM-P1-060 | LUNA-M | DOOM-P1-050 | NONE | Open deterministic fixtures repeat and reject corruption |
| DOOM-P1-070 | LUNA-M | DOOM-P1-060 | NONE | Demo/strict-demo/timedemo matrix is machine-readable |
| DOOM-P1-080 | LUNA-H | DOOM-P1-070 | NONE | State/framebuffer oracle repeats and remains inert when disabled |
| DOOM-P1-085 | LUNA-L/M | DOOM-P1-080 | NONE | Native baseline and Sol gate packet validate |
| DOOM-P1-090 | SOL-GATE | DOOM-P1-085 | Read-only | Independent review only; never self-approved |

## Exact verification

Each task runs the exact commands in its card. The final phase command is:

    python tools/verify-p1-gate.py

It must print:

    SFHS_DOOM_P1_NATIVE_ORACLE_GATE=PASS

The final audit also captures branch, P0-070-to-HEAD commits, changed paths, clean status, and remotes.

## Evidence and result locations

Task results are under docs/results/P01/. Runtime logs and machine-readable evidence are under evidence/ using task-specific P01/P1-<task> run IDs. Native build outputs are ignored under build/native/**; Freedoom cache is ignored under vendor-cache/freedoom/**; runtime outputs are ignored under build/runtime/P01/**.

## Current state

- VERIFIED: the repository is on phase/p01-native-oracle at the P0-070 commit before P1-000 changes.
- VERIFIED: the pinned Chocolate Doom release/base and upstream-only remote policy remain unchanged.
- VERIFIED: default WSL2 is Ubuntu 24.04.4 LTS on x86_64; GCC 13.3.0 and Python 3.12.3 are present.
- VERIFIED: CMake, Ninja, pkg-config, SDL2 development packages, SDL2_mixer, and Xvfb were not found in the initial WSL inventory.
- UNTESTED: native build, Freedoom acquisition, gameplay, demos, and oracle behavior.
- DEFERRED: DOOM-P0-080 and DOOM-P0-090 remain pending; they are not silently completed by P1.

## Blockers and stop conditions

Stop with an evidence report for unrelated working-tree changes, wrong starting lineage, unavailable or credential-blocked WSL/package authority, ambiguous official data identity, commercial data, CMake inability requiring architecture change, native gameplay failure after bounded repair, nondeterministic demo/oracle evidence, source-edit budget overflow, any remote/destructive operation, or any need to modify docs/PROJECT_SPEC.md.

## Exit gate

P1 builder PASS requires one clean local commit for every task through DOOM-P1-085, native Debug/Release/Oracle artifacts and manifests, verified open Freedoom gameplay, truthful test/demo evidence, repeated deterministic state/frame hashes, instrumentation-off regression, fixture provenance, current-state/report binding, and SFHS_DOOM_P1_NATIVE_ORACLE_GATE=PASS. DOOM-P1-090 remains an independent Sol review.
