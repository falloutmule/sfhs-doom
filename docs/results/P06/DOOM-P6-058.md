# TASK RESULT

**Task:** DOOM-P6-058 - Detach authentic HUD and add edge-to-edge fullscreen
**Status:** PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING
**Base:** `8d45af9e51573dd048f86f95b68a8f65670efae9`
**Result commit:** `SELF`
**Branch:** `feature/p6-native-hud-fullscreen`

## Result

V10 is a strict offline sibling candidate with a complete native 320x200 world
surface and a separate authentic 320x32 Doom status surface. Portrait uses the
entire viewport width at the physical top/left/right edges; the lower minimap,
shared SFHS controls, settings/editor, and status surface compress into the
remaining height without narrowing the world.

```text
artifact: dist/sfhs-doom-android-sfhs-controls-v10.html
bytes:    48341427
sha256:   73a29b3ef179239744785a9b3e9b995fab77b82ab6c33452ae143d57a0b9e8f7
oracle:   test-results/P06/P6-058/sfhs-doom-v10-oracle.html
bytes:    48366669
sha256:   0cfa30b4cd37a9b6f7fe6b7c791f4e2b96d1d59ff36186167f25fb5b3fa96e56
```

V8 and V9 retain their protected bytes and hashes exactly.

## Architecture and changed behavior

- Added an Emscripten/Android-only `SFHS_MOBILE_DETACHED_HUD` build flag and a
  read-only versioned native snapshot plus RGBA pixel export.
- Reused `ST_drawWidgets` and WAD patches on a private 320x200 indexed scratch
  surface, restored the drawing target/status flags, and converted only the
  authentic final 32 rows with the exact current gamma-adjusted PLAYPAL palette.
- Forced the effective mobile view to screenblocks 11 at request and application
  seams without mutating the stored `screenblocks` configuration.
- Removed the 32-row automap reservation only for this detached mobile profile
  and used the uncorrected 320x200 SDL presentation height without persisting an
  aspect-ratio preference.
- Reworked the shell into one fullscreen root with a borderless 8:5 world,
  separate 10:1 HUD canvas, retained minimap/control deck, and one lower settings
  affordance for fullscreen re-entry, editing, profile actions, and diagnostics.
- Preserved `@sfhs/mobile-controls@b02336c4`, persistence key
  `sfhsDoom.mobileControls.v2`, input semantics, and V9 compact resize floors.

## Exact verification

- `tools/build-single-file.sh --profile android --output dist/sfhs-doom-android-sfhs-controls-v10.html` - PASS.
- `tools/build-single-file.sh --oracle --profile android --output test-results/P06/P6-058/sfhs-doom-v10-oracle.html` - PASS.
- `python tools/validate-p6-mobile.py dist/sfhs-doom-android-sfhs-controls-v10.html` - PASS, 48,341,427 bytes.
- `npm.cmd exec -- playwright test tests/p6-v10-native-hud-fullscreen.spec.mjs --workers=1` - 6 passed.
- Applicable P6 regression selection (V9 resize, layout, shared controls,
  movement axis, V8 editor, Samsung input V5) - 15 passed.
- Python `unittest` selection for P6, packaging/offline/audio, native demo, and
  native/Wasm parity contracts - 30 passed.
- Native Debug configure/build with `SFHS_MOBILE_DETACHED_HUD=OFF` - 163 build
  steps passed; `ctest` exited 0 and reported `No tests were found`; executable
  version check returned Chocolate Doom 3.1.1.
- `git diff --check` - PASS (Git emitted only the repository's line-ending
  conversion warnings).
- `adb devices -l` - no attached devices.

The focused browser gate proves 360x800 and 400x844 portrait geometry,
800x360 fallback, trusted fullscreen ordering, rejected/unsupported fullscreen
fallback, one `callMain`, running AudioContext, automatic and compatibility
renderers, nonblack edge pixels, snapshot version 1, screenblocks 11,
320x200 world, 320x32 RGBA HUD, internal bar false, real FIRE ammo 50 to 49
with checksum/update changes, MOVE/LOOK/pulses, automap HUD persistence without
a duplicate main-canvas bar, editor Save/Cancel/import/export/reset, hidden-page
suspension/resume, no scroll, no page/console errors, and no network/failed
requests.

## Failed attempts repaired

Ordinary implementation failures were repaired and rerun: an initial status
compile identifier, landscape viewport height, presentation snapshot indices,
SDL 4:3 pillarboxing, the automap's old status reservation, and classification
of Emscripten's nonfatal main-loop timing message. No verification failure
remains. A mistaken validator invocation from `browser-tests/` could not find
the repository-relative script; the same command from the repository root
passes and is the recorded gate.

## Evidence

- `test-results/P06/P6-058/native-hud-proof.json`
- `test-results/P06/P6-058/fullscreen-rejection-proof.json`
- `test-results/P06/P6-058/fullscreen-unsupported-proof.json`
- `test-results/P06/P6-058/compatibility-renderer-proof.json`
- `test-results/P06/P6-058/screenshots/400x844-before-start.png`
- `test-results/P06/P6-058/screenshots/400x844-active-gameplay.png`
- `test-results/P06/P6-058/screenshots/400x844-automap-detached-hud.png`
- `test-results/P06/P6-058/screenshots/360x800-active-gameplay.png`
- `test-results/P06/P6-058/screenshots/400x844-settings-open.png`
- `test-results/P06/P6-058/screenshots/800x360-landscape-fallback.png`
- `test-results/P06/P6-058/screenshots/400x844-compatibility-renderer.png`

## Limitations and next action

No Android device was attached, so fullscreen chrome, safe-area behavior,
touch feel, audio, and visible output are not physically accepted on Samsung.
This is not a local blocker. No remote action occurred. The next action is the
physical Samsung Chrome V10 acceptance gate before separately authorized PR,
merge, publication, or deployment work.
