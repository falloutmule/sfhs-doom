# Compatibility Matrix

**Document status:** P01 native rows verified; later runtime rows remain planning only
**Date:** 2026-08-03

Every runtime row remains `UNTESTED` until the named artifact, environment, and evidence are available.

| Runtime or target | Version/device | Scope | Status | Evidence |
|---|---|---|---|---|
| Native Chocolate Doom behavioral oracle | Chocolate Doom 3.1.1; Ubuntu 24.04.4 WSL2; Release artifact from P1-020 | Native build and open-data gameplay entry | VERIFIED | `docs/results/P01/DOOM-P1-020.md`; `evidence/task-runs/P01-DOOM-P1-050/` |
| Test-only native state/frame oracle | Chocolate Doom 3.1.1; `SFHS_ORACLE_TEST=ON`; Ubuntu 24.04.4 WSL2 | Initial/tic 1/35/70/140 scalar state and tic 1/35/70/140 320x200 indexed logical framebuffer under a generated 140-tic open demo | VERIFIED | `docs/reports/NATIVE_ORACLE_INSTRUMENTATION.md`; `evidence/task-runs/P01-DOOM-P1-080/oracle-run-set/` |
| Emscripten/WebAssembly build | SDK not selected; owned by P02 | Future Wasm engine build | UNTESTED | None |
| Desktop Chromium | Version not recorded | Future packaged artifact launch and gameplay checks | UNTESTED | None |
| Desktop Firefox | Version not recorded | Future packaged artifact launch and gameplay checks | UNTESTED | None |
| Android Chrome on Samsung device | Exact model/version not recorded | Future physical mobile release gate | UNTESTED | None |
| iOS Safari | Version/device not recorded | Best-effort compatibility target | UNTESTED | None |
| Freedoom Phase 1 edition | Freedoom v0.13.0 `freedoom1.wad` | E1M1 skill 3 native gameplay entry with isolated config/save/home and dummy-audio automation; separate real mixer setup | VERIFIED | `evidence/screenshots/P01/P1-050/phase1-gameplay.png`; `evidence/task-runs/P01-DOOM-P1-050/phase1/` |
| Freedoom Phase 2 edition | Freedoom v0.13.0 `freedoom2.wad` | MAP01 skill 3 native gameplay entry with isolated config/save/home and dummy-audio automation; separate real mixer setup | VERIFIED | `evidence/screenshots/P01/P1-050/phase2-gameplay.png`; `evidence/task-runs/P01-DOOM-P1-050/phase2/` |

VERIFIED rows make only the stated native evidence claim. No browser, WebAssembly, mobile, physical-device, broad compatibility, or release-support claim follows from them.
