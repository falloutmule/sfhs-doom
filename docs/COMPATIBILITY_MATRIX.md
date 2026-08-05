# Compatibility Matrix

**Document status:** P01 native and P02 loopback browser/parity rows verified; later runtime rows remain planning only
**Date:** 2026-08-04

Every runtime row remains `UNTESTED` until the named artifact, environment, and evidence are available.

| Runtime or target | Version/device | Scope | Status | Evidence |
|---|---|---|---|---|
| Native Chocolate Doom behavioral oracle | Chocolate Doom 3.1.1; Ubuntu 24.04.4 WSL2; Release artifact from P1-020 | Native build and open-data gameplay entry | VERIFIED | `docs/results/P01/DOOM-P1-020.md`; `evidence/task-runs/P01-DOOM-P1-050/` |
| Test-only native state/frame oracle | Chocolate Doom 3.1.1; `SFHS_ORACLE_TEST=ON`; Ubuntu 24.04.4 WSL2 | Initial/tic 1/35/70/140 scalar state and tic 1/35/70/140 320x200 indexed logical framebuffer under a generated 140-tic open demo | VERIFIED | `docs/reports/NATIVE_ORACLE_INSTRUMENTATION.md`; `evidence/task-runs/P01-DOOM-P1-080/oracle-run-set/` |
| Emscripten/WebAssembly build | Emscripten 6.0.5; P2-050 staged multi-file outputs | Multi-file Wasm engine build with separate open Freedoom data | VERIFIED | `docs/results/P02/DOOM-P2-050.md`; `evidence/manifests/P02/` |
| Desktop Chromium | Playwright 1.61.1; Chromium 1228; loopback | Phase 1 and Phase 2 real open-data gameplay boot | VERIFIED | `docs/results/P02/DOOM-P2-060.md`; `evidence/screenshots/P02/P2-060/` |
| Desktop Firefox | Playwright 1.61.1; Firefox 1532; loopback | Phase 2 real open-data gameplay boot | VERIFIED | `docs/results/P02/DOOM-P2-060.md`; `evidence/screenshots/P02/P2-060/` |
| Chromium/Wasm Oracle | Playwright 1.61.1; Chromium 1228; pinned WSL loopback | Five independent Phase 2 Oracle processes; exact scalar checkpoints and raw indexed frames against fresh native P2 control; DeHackEd effect | VERIFIED | `docs/results/P02/DOOM-P2-085.md`; `evidence/task-runs/P02-DOOM-P2-085/wasm-chromium/` |
| Firefox/Wasm Oracle | Playwright 1.61.1; Firefox 1532; pinned WSL loopback | Three independent Phase 2 Oracle processes; exact scalar checkpoints and raw indexed frames against fresh native P2 control; DeHackEd effect | VERIFIED | `docs/results/P02/DOOM-P2-085.md`; `evidence/task-runs/P02-DOOM-P2-085/wasm-firefox/` |
| Android Chrome on Samsung device | Exact model/version not recorded | Future physical mobile release gate | UNTESTED | None |
| iOS Safari | Version/device not recorded | Best-effort compatibility target | UNTESTED | None |
| Freedoom Phase 1 edition | Freedoom v0.13.0 `freedoom1.wad` | E1M1 skill 3 native gameplay entry with isolated config/save/home and dummy-audio automation; separate real mixer setup | VERIFIED | `evidence/screenshots/P01/P1-050/phase1-gameplay.png`; `evidence/task-runs/P01-DOOM-P1-050/phase1/` |
| Freedoom Phase 2 edition | Freedoom v0.13.0 `freedoom2.wad` | MAP01 skill 3 native gameplay entry with isolated config/save/home and dummy-audio automation; separate real mixer setup | VERIFIED | `evidence/screenshots/P01/P1-050/phase2-gameplay.png`; `evidence/task-runs/P01-DOOM-P1-050/phase2/` |

VERIFIED rows make only the stated native evidence claim. No browser, WebAssembly, mobile, physical-device, broad compatibility, or release-support claim follows from them.
## P3-030 direct-file result

Chromium direct-file gameplay/audio/input and Oracle movement proof pass. The
Firefox direct-file lane passes with a recorded limitation because the
engine-created AudioContext remains suspended after the trusted Start gesture
and bounded activation repair. See
`docs/reports/P03_OFFLINE_RUNTIME.md` and the P3-030 evidence directory.
