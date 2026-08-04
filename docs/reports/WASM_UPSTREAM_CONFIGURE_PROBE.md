# Upstream Emscripten Configure Probe

**Task:** DOOM-P2-030  
**Status:** VERIFIED LOCALLY

The accepted Chocolate Doom source configures under the pinned Emscripten environment without editing source files or packaging any WAD. The probe uses CMake/Ninja with SDL2_mixer enabled, SDL2_net disabled, direct optional integrations disabled, and the SFHS Oracle disabled. It records the exact argv, environment, CMake cache selection, target help, warnings, and output rules under `evidence/task-runs/P02-DOOM-P2-030/`.

The configuration is intentionally a boundary probe only. It does not compile the Chocolate Doom product target and does not claim a working product build. The configure directory is ignored local state at `build/wasm/upstream-configure/` and is recreated from empty state for repeatability.

## Boundary settings

| Setting | Value |
|---|---|
| Compiler | pinned Emscripten `emcc` 6.0.5 |
| Generator | Ninja |
| SDL2_mixer | ON |
| SDL2_net | OFF |
| FluidSynth | disabled |
| SampleRate | disabled |
| PNG | disabled |
| SFHS Oracle | OFF |
| WAD packaging | none |

The target graph exposes `chocolate-doom`; the probe records that target without building it. No source or product behavior changes are part of this task.
