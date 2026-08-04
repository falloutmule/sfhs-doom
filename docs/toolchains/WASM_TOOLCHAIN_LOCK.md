# P2 WebAssembly Toolchain Lock

**Task:** DOOM-P2-010  
**Status:** PINNED FOR LOCAL INSTALLATION

| Component | Exact identity |
|---|---|
| emsdk repository | `https://github.com/emscripten-core/emsdk.git` |
| emsdk repository commit | `9fcdf593953edfcddb297572d7f2177d336b0479` |
| Emscripten SDK | `6.0.5` |
| Emscripten release commit | `dbd755b5da399329c2576f6e3dfa7f419f5d8409` |
| SDL ports | `sdl2`, `sdl2_mixer` |
| Playwright | `@playwright/test 1.61.1` |
| Browser lanes | Chromium and Firefox only |

The emsdk checkout is local and detached at the exact repository commit. SDK activation is local-only and never uses `--permanent` or a moving alias. Browser binaries are test-only ignored state under `vendor-cache/playwright/`.
