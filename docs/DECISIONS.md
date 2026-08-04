# SFHS Doom Decisions

**Document status:** Accepted decision record  
**Date:** 2026-08-02  
**Authority:** `docs/PROJECT_SPEC.md` and the frozen P00 planning packet

## ADR table

| ID | Decision | Status | Reason |
|---|---|---|---|
| ADR-001 | Use Chocolate Doom as the production engine core. | Accepted | Its explicit purpose is accurate DOS Doom behavior, including bugs, demos, configuration files, savegames, and retro input/display feel. |
| ADR-002 | Compile the C engine to WebAssembly with a pinned Emscripten SDK. | Accepted | This preserves mature engine behavior while allowing a browser release. |
| ADR-003 | Ship a strict one-file `index.html`, but develop from a normal source tree. | Accepted | Single-file output is a packaging target, not a source-authoring constraint. |
| ADR-004 | Produce an engine-only build plus separate Freedoom Phase 1 and Phase 2 builds. | Accepted | Users can load legally owned Doom data, while Freedoom provides complete freely redistributable playable editions. |
| ADR-005 | Preserve vanilla limits and intentional bugs by default. | Accepted | “Complete” means vanilla compatibility, not modernization. |
| ADR-006 | Defer multiplayer. | Accepted by user | Multiplayer transport would be a distinct browser-networking project and is not required for the first complete release. |
| ADR-007 | Use native Chocolate Doom at the same source commit as the behavioral oracle. | Accepted | Demo synchronization, save/config interchange, and internal hashes provide stronger proof than screenshots alone. |
| ADR-008 | Use ChatGPT Sol High for architecture, phase plans, blockers, and phase gates. | Accepted for this workflow | Sol is reserved for ambiguous and long-horizon reasoning. |
| ADR-009 | Use Luna for small, explicit implementation tasks in Codex. | Accepted for this workflow | Luna is suited to clear, repeatable work and is now substantially cheaper. |
| ADR-010 | Permit only one active source-modifying Luna worker per phase branch. | Proposed default | Serial execution minimizes merge conflicts and context handoffs. Read-only checking may run separately. |
| ADR-011 | Make Android Chrome on the user’s Samsung phone a release target. | Accepted by user — 2026-08-02 | SFHS is mobile-oriented and physical Android verification is a release requirement. |
| ADR-012 | Make landscape the primary mobile gameplay orientation; keep the launcher usable in portrait. | Accepted by user — 2026-08-02 | Doom’s corrected display is naturally 4:3 and touch FPS controls need horizontal room. Orientation lock remains optional, not required. |
| ADR-013 | Require desktop Chromium and Firefox; treat iOS Safari as best-effort, not a release gate. | Accepted by user — 2026-08-02 | This keeps the first complete release testable and low-cost while covering two browser engines and the user’s real phone. |
| ADR-014 | Do not require an offline AI model for the critical path. | Accepted by user — 2026-08-02 | Luna is the default implementation worker. Task cards remain model-neutral so a proven local model can later substitute for qualified low-risk tasks. |
| ADR-015 | Add a compile-time-gated native oracle that observes post-tic logical state and the pre-scale indexed framebuffer. | Accepted for P01 | Deterministic state and 320x200 indexed-frame evidence provides a native comparison contract while leaving ordinary builds and engine behavior unchanged. |

ADR-011 through ADR-014 are frozen as accepted product/workflow decisions. ADR-010 remains a reversible serial-execution default rather than an irreversible product constraint.

## ADR-015: deterministic test-only native oracle

**Decision:** Add new observer code under `src/sfhs_oracle/`, compiled only when
the CMake option `SFHS_ORACLE_TEST=ON` is selected. Two narrow Doom hooks call
the observer at post-tic state and logical 320x200 indexed-framebuffer capture
points before presentation scaling. The observer writes only when
an explicit `SFHS_ORACLE_OUTPUT` directory is supplied.

The state contract contains scalar gameplay values only: checkpoint tic,
episode/map/skill/state, player position and angle, health/armor/weapon, and
level counters. Frame artifacts contain exactly the authoritative indexed
`I_VideoBuffer` bytes. JSON records bind those bytes with SHA-256. Addresses,
timestamps, host paths, process IDs, wall-clock values, presentation buffers,
and uninitialized storage are excluded.

The deterministic driver is a project-generated 140-tic zero-input demo in an
ignored run directory. State checkpoints are initial gameplay plus post-tic 1,
35, 70, and 140. Frame checkpoints are tics 1, 35, 70, and 140; because
upstream executes tic 1 before entering its render loop, the tic-1 artifact is
the initialized logical buffer before the first gameplay draw. A final state
record aliases the observed terminal demo checkpoint; the
observer never changes tic commands, game state, timing, rendering, or demo
flow.

**Build boundary:** The option defaults OFF. Existing Debug and Release builds
receive neither the compile definition nor observer sources. The Oracle build
uses the same native dependency parity flags as P1-020 plus
`-DSFHS_ORACLE_TEST=ON`.

**Reversibility:** Removing the conditional source list and the two guarded
calls restores the upstream source path. No persistent format or production
behavior depends on this observer.
