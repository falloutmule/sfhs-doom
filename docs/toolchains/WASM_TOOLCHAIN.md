# WebAssembly Toolchain Doctor

**Task:** DOOM-P2-020  
**Status:** VERIFIED LOCALLY

The P2 toolchain doctor is read-only with respect to installation and remote state. It resolves the pinned local emsdk installation from `tools/emsdk-lock.json`, checks Emscripten 6.0.5, SDK Node 22.16.0, Playwright 1.61.1, the required SDL ports, and the ignored Chromium/Firefox cache. It has deterministic forced-missing and forced-wrong-version test hooks.

The doctor then compiles `tests/fixtures/wasm/sdl-smoke.c` with the pinned SDL2 port into the ignored `build/runtime/P02/P2-020/` directory. The browser test serves that directory from a loopback-only Node HTTP server and exercises the generated artifact in both Chromium and Firefox.

## Verified identities

| Component | Exact identity |
|---|---|
| emsdk checkout | `9fcdf593953edfcddb297572d7f2177d336b0479` |
| Emscripten | `6.0.5` |
| SDK Node | `v22.16.0` |
| SDL port | `sdl2` |
| Playwright | `1.61.1` |
| Chromium cache | `chromium-1228` |
| Firefox cache | `firefox-1532` |
| Runtime server | `127.0.0.1` only |

No installation, package mutation, remote repository action, Chocolate Doom source change, or product-data download is performed by the doctor.
