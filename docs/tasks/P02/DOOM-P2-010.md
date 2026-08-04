## DOOM-P2-010 — Pin emscripten and browser test dependencies

**Intelligence:** LUNA-M  
**Phase:** P02  
**Depends on:** DOOM-P2-000  
**Branch:** phase/p02-wasm-feasibility  
**Allowed files/directories:** .agent/task-state.json; .gitignore; browser-tests/package.json; browser-tests/package-lock.json; browser-tests/playwright.config.mjs; docs/licenses/THIRD_PARTY_INVENTORY.md; docs/toolchains/WASM_TOOLCHAIN_LOCK.md; docs/results/P02/DOOM-P2-010.md; evidence/logs/P02/P2-010/**; evidence/task-runs/P02-DOOM-P2-010/**; tests/test_bootstrap_emsdk.py; tools/bootstrap-emsdk.sh; tools/emsdk-lock.json  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Install exact local Emscripten 6.0.5, SDL ports, Playwright 1.61.1, Chromium, and Firefox without global activation or remote repository mutation.

### Constraints

Use only packet-authorized ignored external state; never use a moving latest alias, global activation, Windows-host package mutation, or remote write.

### Work

Create strict locks; implement idempotent local bootstrap and verification; prebuild SDL2/SDL2_mixer; pin npm dependencies; install browser binaries and WSL dependencies; record identities; update inventory; add download-free fake-lock tests.

### Exact verification

    bash tools/bootstrap-emsdk.sh --verify
    source toolchains/emsdk/emsdk_env.sh
    emcc --version
    emcc -v
    em-config --show-ports
    embuilder build sdl2 sdl2_mixer
    node --version
    npm --version
    cd browser-tests && npm ci
    PLAYWRIGHT_BROWSERS_PATH=<locked-path> npx playwright --version
    PLAYWRIGHT_BROWSERS_PATH=<locked-path> npx playwright install --list
    python -m unittest tests.test_bootstrap_emsdk
    python tools/taskctl.py validate

Run bootstrap a second time and prove idempotence.

### Acceptance

Exact pins install; no latest/global activation occurs; Chromium and Firefox are available; the second bootstrap is stable; locks are unchanged; worktree is clean.

### Stop/block conditions

Stop for unavailable official packages, credentials, wrong SDK/browser identity, dirty emsdk state, unexpected downloads, or any global/remote mutation.

### Evidence output

`docs/toolchains/WASM_TOOLCHAIN_LOCK.md`; `evidence/logs/P02/P2-010/**`; `evidence/task-runs/P02-DOOM-P2-010/**`.

### Commit

DOOM-P2-010 pin emscripten and browser test dependencies
