## DOOM-P2-030 — Record upstream emscripten configure boundary

**Intelligence:** LUNA-M  
**Phase:** P02  
**Depends on:** DOOM-P2-020  
**Branch:** phase/p02-wasm-feasibility  
**Allowed files/directories:** .agent/task-state.json; docs/reports/WASM_UPSTREAM_CONFIGURE_PROBE.md; docs/results/P02/DOOM-P2-030.md; evidence/logs/P02/P2-030/**; evidence/task-runs/P02-DOOM-P2-030/**; tests/test_configure_wasm.py; tools/configure-wasm.sh  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Configure pinned Chocolate Doom under Emscripten twice without source edits or product claims.

### Constraints

Use the pinned environment and clean ignored build directories; do not edit source, package WADs, enable Oracle, or claim a product build.

### Work

Use the pinned environment, CMake/Ninja, SDL2_mixer ON, SDL2_net and direct optional integrations OFF, Oracle OFF, and no WAD packaging. Capture argv, environment, cache, Emscripten detection, targets, warnings, and output rules; add clean-directory and argument tests.

### Exact verification

    bash tools/configure-wasm.sh --clean
    cmake --build build/wasm/upstream-configure --target help
    python -m unittest tests.test_configure_wasm
    python tools/taskctl.py validate

Configure from empty directories twice.

### Acceptance

Configure succeeds twice; `chocolate-doom` exists; Emscripten, not host GCC, is selected; no source changes occur.

### Stop/block conditions

Stop if configure cannot succeed without source edits, selects host GCC, or requires an architecture change.

### Evidence output

`docs/reports/WASM_UPSTREAM_CONFIGURE_PROBE.md`; `evidence/logs/P02/P2-030/**`; `evidence/task-runs/P02-DOOM-P2-030/**`.

### Commit

DOOM-P2-030 record upstream emscripten configure boundary
