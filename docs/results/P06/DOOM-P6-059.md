# TASK RESULT

**Task:** DOOM-P6-059 - Add 4:3 portrait presentation and repair control editor
**Status:** PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING
**Base:** `1fdd2b0778e883e8f8dd99dd89b8821dccd8a9e7`
**Result commit:** `SELF`
**Branch:** `repair/p6-v11-4x3-editor`

## Result

V11 is a strict offline sibling candidate with two bounded product changes.
Portrait now presents the unchanged 320x200 Doom canvas at classic 4:3, and
edit mode replaces the minimap with compact settings rather than covering the
touch controls.

```text
artifact: dist/sfhs-doom-android-sfhs-controls-v11.html
bytes:    48343387
sha256:   fac2b1f0637f25bab7a5f41b42115ff955c8e1bef11234876c0871232301b973
oracle:   test-results/P06/P6-059/sfhs-doom-v11-oracle.html
bytes:    48368629
sha256:   e3abd6092c6f35739c1595c4805d7b991c19c1b12e6bc956eab4eb3359d2096b
```

V8, V9, and V10 retain their exact protected bytes and hashes.

## Architecture and changed behavior

- Portrait world geometry is `75vw`: 360x270 and 400x300 in the focused
  viewports, with x=0/y=0 and no side gap, border, crop, or page scroll.
- The engine canvas retains 320x200 attributes during active play. CSS keeps a
  fixed 320x200 layout surface and applies explicit nonuniform scale factors;
  a bounded attribute observer restores SDL's attempted CSS-size write. This
  applies classic non-square-pixel correction once without engine changes.
- Landscape retains an 8:5 fit and explicit dimensions, avoiding V10's
  headless auto-size collapse while remaining a secondary fallback.
- A 320-pixel portrait control-deck row is reserved. The minimap absorbs the
  taller-world cost and remains present in normal mode.
- The existing editor form is nested and clipped inside the minimap region.
  Edit mode hides/suspends the minimap; Save or Cancel restores it. All nine
  controls and their resize handles remain directly exposed.
- Reset, export, import, Cancel, Save, Opacity, LOOK sensitivity, MOVE dead
  zone, profile schema/key, package identity, and control semantics are intact.
- No C, CMake, Doom, detached-HUD, native, shared SFHS, or commercial-data path
  changed.

## Exact verification

- `bash tools/build-single-file.sh --profile android --output dist/sfhs-doom-android-sfhs-controls-v11.html` - PASS.
- `bash tools/build-single-file.sh --oracle --profile android --output test-results/P06/P6-059/sfhs-doom-v11-oracle.html` - PASS.
- `python tools/validate-p6-mobile.py dist/sfhs-doom-android-sfhs-controls-v11.html` - PASS, 48,343,387 bytes.
- `python tools/validate_artifact_manifest.py evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v11.json` - PASS.
- `npm.cmd exec playwright test tests/p6-v11-4x3-editor.spec.mjs -- --workers=1` - 7 passed.
- `npm.cmd exec playwright test tests/p6-v10-native-hud-fullscreen.spec.mjs -- --workers=1` - 6 passed against untouched V10.
- Applicable historical P6 browser selection (V9 resize, V6 layout/shared
  controls, V7 movement, V8 editor, Samsung LOOK V5) - 15 passed.
- `python -m unittest tests.test_p6_mobile_contract tests.test_p6_sfhs_controls_v6` - 11 passed.
- Packaging/offline/audio/manifest Python selection - 28 passed.
- Native demo/Wasm comparison contracts - 9 passed.
- Native configure with Debug, `ENABLE_SDL2_NET=OFF`, and
  `SFHS_MOBILE_DETACHED_HUD=OFF` - PASS; native build completed all targets;
  CTest exited 0 with `No tests were found`; version is Chocolate Doom 3.1.1.
- `git diff --check` - PASS with checkout line-ending warnings only.
- `adb devices -l` - no attached device.

The focused gate records one trusted fullscreen call before main, one main
invocation, running AudioContext, automatic and compatibility renderer frames,
direct `file://` operation, no external or failed requests, no page errors,
fullscreen rejection/unsupported fallback, authentic HUD activity, FIRE ammo
and checksum changes, MOVE/LOOK/pulses, automap with internal status inactive,
visibility lifecycle, and a live landscape fallback.

## Geometry and editor proof

`test-results/P06/P6-059/native-hud-proof.json` records 400x300 and 360x270
world rectangles. The live native snapshot reports screenblocks 11, effective
world 320x200, HUD 320x32, RGBA pitch 1280, 10,240 nonblank pixels, and internal
status inactive. Browser canvas attributes are asserted as 320x200 after Doom
starts.

At 400x844 the editor occupies `(4,305,392,175)` and the control deck occupies
`(0,484,400,320)`, producing exactly zero intersection area. The proof records
visible geometry for MOVE, FIRE, LOOK, USE, RUN, MENU, MAP, WPN-, and WPN+;
MOVE drag/resize and LOOK resize; saved profile changes; Cancel rollback; and
minimap update suspension/restoration.

## Failed attempts repaired or classified

- The first product build could not clear a stale NTFS build directory through
  WSL. Only the verified generated `build/wasm/p6-android/phase2-product`
  directory was removed, and the rebuild passed.
- Initial landscape evidence exposed V10's inherited `width:auto;height:auto`
  canvas collapse. Explicit 8:5 fit dimensions repaired the fallback.
- Initial fixed CSS geometry still let SDL replace the canvas attributes with
  400x300. The bounded attribute observer restored 320x200 while retaining
  normal rendering; all focused paths were rerun.
- A fresh native configure initially omitted the repository's established
  `ENABLE_SDL2_NET=OFF` option and failed generation for missing SDL2_net. The
  corrected configure, build, CTest, and version checks pass.
- An intentionally broad 62-test historical Python sweep reported 59 passes
  and three stale P1 fixture/source-budget failures. Those tests already reject
  accepted V10 mobile sources and the existing SDL smoke fixture, so they are
  not current P6 gates. The applicable 48 tests were rerun separately and pass.

## Evidence

- `test-results/P06/P6-059/native-hud-proof.json`
- `test-results/P06/P6-059/fullscreen-rejection-proof.json`
- `test-results/P06/P6-059/fullscreen-unsupported-proof.json`
- `test-results/P06/P6-059/compatibility-renderer-proof.json`
- `test-results/P06/P6-059/landscape-fallback-proof.json`
- `test-results/P06/P6-059/screenshots/400x844-before-start.png`
- `test-results/P06/P6-059/screenshots/400x844-active-gameplay.png`
- `test-results/P06/P6-059/screenshots/400x844-automap-detached-hud.png`
- `test-results/P06/P6-059/screenshots/360x800-active-gameplay.png`
- `test-results/P06/P6-059/screenshots/400x844-edit-mode.png`
- `test-results/P06/P6-059/screenshots/400x844-settings-open.png`
- `test-results/P06/P6-059/screenshots/800x360-landscape-fallback.png`
- `test-results/P06/P6-059/screenshots/400x844-compatibility-renderer.png`
- `evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v11.json`

## Limitations and next action

No V11 run occurred on a physical Android device. Desktop Chromium cannot
accept Samsung browser chrome, safe areas, physical touch/edit ergonomics,
speaker output, or the new 4:3 visual preference. No remote action occurred.
The next action is Samsung Chrome V11 review and hands-on editor acceptance.
