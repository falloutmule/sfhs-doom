# TASK RESULT

**Task:** DOOM-P6-060 - Repair physical 4:3 presentation ownership
**Status:** PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING
**Base:** `3d939853968cd42322b5de0b19d7dfd5dd215500`
**Result commit:** `SELF`
**Branch:** `repair/p6-v12-physical-4x3`

## Result

V12 preserves the V10/V11 two-surface handheld and repairs V11's competing
canvas owners. SDL initializes and owns its 320x200 output; JavaScript no
longer observes or rewrites canvas width/height attributes. After Doom starts,
CSS presents the complete frame in the 4:3 region. The V11 editor layout is
unchanged.

```text
artifact: dist/sfhs-doom-android-sfhs-controls-v12.html
bytes:    48344370
sha256:   6b593fb3268b6fb1ca4cf5aa512c1f01e7c93ac51924964694e5ad712d7a7c24
oracle:   test-results/P06/P6-060/sfhs-doom-v12-oracle.html
bytes:    48369612
sha256:   7f0498df9e38b3e146f359a84c1691c39e8d13ff13055da000623227ea04620b
```

V8, V9, V10, and V11 retain their exact protected hashes.

## Root cause and repair

V11 initialized a 320x200 canvas, allowed SDL to configure it, then used a
MutationObserver to force SDL's width/height changes back to 320x200 while an
independent transform scaled the element. Instrumented V11 startup records the
attribute mutation to 400x300, one forced restoration, an SDL 400x300 output,
and a persistent 38-row blank band in a 400x300 screenshot. That reproduces the
same class as the physical 146-row band at 576x432.

Ordinary post-start `width:100%;height:100%` CSS was also tested and rejected
because the compatibility renderer clipped the world. The bounded repair keeps
the natural 320x200 layout/backing/output through `callMain`, then applies one
post-start CSS transform. At 576px the transform is 1.8x2.16, yielding a
576x432 rectangle with 430/432 stable occupied rows and no material blank band.

## Exact verification

- Product and oracle `tools/build-single-file.sh` builds: PASS.
- `python tools/validate-p6-mobile.py ...v12.html`: PASS, 48,344,370 bytes.
- Artifact-manifest validator: PASS.
- V12 focused Playwright: 10/10 passed.
- Protected V11/V10/V9 plus applicable P6 browser regressions: 23/23 passed.
- Mobile/control Python contracts: 11/11 passed.
- Packaging/offline/audio/manifest Python contracts: 28/28 passed.
- Native demo/Wasm comparison contracts: 9/9 passed.
- Fresh native Debug configure/build with `ENABLE_SDL2_NET=OFF` and
  `SFHS_MOBILE_DETACHED_HUD=OFF`: PASS; CTest found no registered tests;
  executable reports Chocolate Doom 3.1.1.
- `git diff --check`, single-file/static, external-resource, commercial-data,
  and protected-hash checks: PASS.

The focused gate covers direct `file://` boot, one trusted fullscreen request,
one main invocation, running audio, rejection/unsupported fallback, automatic
and compatibility renderers, MOVE/LOOK/FIRE/USE/RUN/MENU/MAP/WPN-/WPN+,
automap, detached HUD, editor Save/Cancel/import/export/reset, visibility,
landscape, no scroll, and empty page/console/network error arrays.

## Full-frame and native proof

- Synthetic 576x432 upper-286-row fixture: rejected, 66.20% occupied span and
  a 146-row terminal blank band.
- Synthetic complete 576x432 fixture: passed, 100% span.
- Live 360x270: 269/270 stable rows (99.63%); live frame reaches 270/270.
- Live automatic 400x300: 300/300 stable rows.
- Live compatibility 400x300: 300/300 stable rows.
- Live physical-like 576x432: 430/432 stable rows (99.54%); live frame reaches
  432/432.
- Native snapshot: effective world 320x200, screenblocks 11, internal status 0;
  detached RGBA HUD 320x32, pitch 1280, 10,240 nonblank pixels.

## Classified failures

The exploratory ordinary CSS-size implementations clipped or letterboxed one
renderer and were discarded before the final build. A broad 16-test historical
fixture sweep produced 14 passes and two known stale oracle-fixture failures
because `tests/fixtures/wasm/sdl-smoke.c` is absent from the old canonical
fixture manifest; the applicable native demo/Wasm selection was rerun and
passes 9/9. No product, focused, packaging, native-build, or applicable
regression gate failed in the final state.

## Evidence

- `test-results/P06/P6-060/v11-presentation-conflict.json`
- `test-results/P06/P6-060/synthetic-coverage-proof.json`
- `test-results/P06/P6-060/360x270-coverage-proof.json`
- `test-results/P06/P6-060/576x1280-coverage-proof.json`
- `test-results/P06/P6-060/native-hud-proof.json`
- `test-results/P06/P6-060/compatibility-renderer-proof.json`
- `test-results/P06/P6-060/screenshots/`
- `evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v12.json`

## Limitation and next action

V12 has not been operated on Samsung Chrome. The editor remains automated-only
and no physical audio result is claimed. After the exact V12 Pages candidate is
published and hash-verified, the next action is the user's 15-step Samsung
world-fill/editor/control/speaker acceptance checklist.
