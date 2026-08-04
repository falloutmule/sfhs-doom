## DOOM-P2-020 — Add wasm toolchain and browser doctor

**Intelligence:** LUNA-M  
**Phase:** P02  
**Depends on:** DOOM-P2-010  
**Branch:** phase/p02-wasm-feasibility  
**Allowed files/directories:** .agent/task-state.json; docs/toolchains/WASM_TOOLCHAIN.md; docs/results/P02/DOOM-P2-020.md; evidence/logs/P02/P2-020/**; evidence/task-runs/P02-DOOM-P2-020/**; tests/fixtures/wasm/sdl-smoke.c; tests/test_wasm_toolchain.py; tools/wasm-env.sh; tools/wasm-toolchain-doctor.sh; browser-tests/tests/toolchain.spec.mjs  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Provide a no-install doctor and prove a trivial SDL2 Wasm artifact loads in both required desktop browsers.

### Constraints

The doctor must not install or repair; smoke output is ignored; no Chocolate Doom source or product behavior may change.

### Work

Implement pinned environment resolution and checks for WSL, compilers, LLVM/Binaryen, build tools, caches, SDL ports, Playwright, browsers, and loopback; compile and serve an SDL smoke artifact; add negative tests for missing/wrong dependencies.

### Exact verification

    bash tools/wasm-toolchain-doctor.sh
    python -m unittest tests.test_wasm_toolchain
    cd browser-tests && npx playwright test tests/toolchain.spec.mjs --workers=1
    python tools/taskctl.py validate

### Acceptance

Doctor passes without network; SDL Wasm loads in Chromium and Firefox; browser runner and exact versions are recorded; no Chocolate Doom source changes.

### Stop/block conditions

Stop for missing pinned tools, unavailable browsers, external requests, fatal page errors, or any required source/toolchain redesign.

### Evidence output

`docs/toolchains/WASM_TOOLCHAIN.md`; `evidence/logs/P02/P2-020/**`; `evidence/task-runs/P02-DOOM-P2-020/**`.

### Commit

DOOM-P2-020 add wasm toolchain and browser doctor
