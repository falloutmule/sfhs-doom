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

ADR-011 through ADR-014 are frozen as accepted product/workflow decisions. ADR-010 remains a reversible serial-execution default rather than an irreversible product constraint.
