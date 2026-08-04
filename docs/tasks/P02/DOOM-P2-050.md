## DOOM-P2-050 — Add bounded wasm platform adapter and builds

**Intelligence:** LUNA-H  
**Phase:** P02  
**Depends on:** DOOM-P2-040  
**Branch:** phase/p02-wasm-feasibility  
**Allowed files/directories:** .agent/task-state.json; .gitignore; CMakeLists.txt; src/CMakeLists.txt; cmake/SFHSWasm.cmake; src/sfhs_wasm/**; web/p2/**; tools/build-wasm.sh; tools/hash-wasm-build.py; tests/test_build_wasm.py; docs/BUILD_IDENTITY.md; docs/DECISIONS.md; docs/UPSTREAM_DELTA.md; docs/reports/WASM_PLATFORM_ADAPTER.md; docs/results/P02/DOOM-P2-050.md; evidence/logs/P02/P2-050/**; evidence/manifests/P02/**; evidence/task-runs/P02-DOOM-P2-050/**; src/i_timer.c; src/i_system.c; src/i_video.c; src/i_input.c; src/i_sound.c; src/i_sdlsound.c; src/i_sdlmusic.c  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Implement the bounded browser/Wasm adapter and reproducible multi-file feasibility builds without gameplay, renderer, compatibility, or vanilla-limit changes.

### Constraints

Write the ADR first; use at most two existing CMake files and three existing platform C files, zero `src/doom/**` edits, and no single-file, thread, WebGPU, network, or commercial-data path.

### Work

Write an ADR first; repair only obsolete Emscripten branch flags; add adapter CMake/shell/pre/post code, delayed Start/callMain, Asyncify, MEMFS, preloaded open data, read-only test façade, build identity, and manifests. Build phase1-debug, phase2-debug, and phase2-oracle twice from empty directories. Existing platform C edits require P2-040 evidence and remain within the hard budget.

### Exact verification

    bash tools/build-wasm.sh --all --clean
    bash tools/build-wasm.sh --all --clean
    python -m unittest tests.test_build_wasm
    python tools/validate_artifact_manifest.py <each P2 build manifest>
    bash tools/build-native.sh --config all --clean-build-dir
    bash <P2 native-control wrapper>
    python tools/taskctl.py validate

### Acceptance

All three multi-file variants reproduce; separate Wasm/data files exist; no `SINGLE_FILE`; native controls remain green; edits stay within budget; Start delays main; runtime is loopback-only.

### Stop/block conditions

Stop for budget overflow, native regression, embedded artifacts, missing data/Wasm files, external runtime requests, or any gameplay/renderer/compatibility edit.

### Evidence output

`docs/reports/WASM_PLATFORM_ADAPTER.md`; `evidence/manifests/P02/**`; `evidence/logs/P02/P2-050/**`; `evidence/task-runs/P02-DOOM-P2-050/**`.

### Commit

DOOM-P2-050 add bounded wasm platform adapter and builds
