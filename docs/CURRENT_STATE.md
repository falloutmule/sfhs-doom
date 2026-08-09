# SFHS Doom Current State

**Date:** 2026-08-08
**Phase:** P06 - Android portrait presentation and shared controls
**Current task:** DOOM-P6-059
**Current result commit:** SELF
**Branch:** `repair/p6-v11-4x3-editor`
**Base:** `1fdd2b0778e883e8f8dd99dd89b8821dccd8a9e7`

## Verified reality

- `origin/main` and the task base are the published V10 commit
  `1fdd2b0778e883e8f8dd99dd89b8821dccd8a9e7`.
- V8 remains exactly 48,328,131 bytes with SHA-256
  `b806eb9274ae46954ecdc54968735ca1ca94f3f062e3559c54c59b0e7f6ad912`.
- V9 remains exactly 48,328,267 bytes with SHA-256
  `be885e63be73232d30bb0f897a319baa380231ea56e3eaebea64b29c71c05111`.
- V10 remains exactly 48,341,427 bytes with SHA-256
  `73a29b3ef179239744785a9b3e9b995fab77b82ab6c33452ae143d57a0b9e8f7`.
- V11 is the new sibling at
  `dist/sfhs-doom-android-sfhs-controls-v11.html`: 48,343,387 bytes,
  SHA-256 `fac2b1f0637f25bab7a5f41b42115ff955c8e1bef11234876c0871232301b973`.

## V11 product boundary

V11 makes exactly two product changes over V10. Portrait visually stretches
the unchanged 320x200 engine canvas to classic aspect-correct 4:3: 360x270 at
360 CSS pixels and 400x300 at 400 CSS pixels. A bounded attribute observer
restores SDL's canvas attributes to 320x200 while CSS transforms only the
presentation; no framebuffer, projection, FOV, screenblocks, simulation,
automap, menu, save, demo, or native source changed. Landscape retains an 8:5
fit and now avoids the inherited auto-size canvas collapse.

Edit mode hides and suspends the minimap, places a compact editor form inside
that same grid region, and leaves the separate 320-pixel control deck exposed.
Save and Cancel restore the minimap. Drag, resize, settings, reset,
import/export, persistence schema/key, and
`@sfhs/mobile-controls@b02336c4` remain unchanged.

## Verification state

The exact product and oracle builds pass. The V11 static validator passes. The
focused V11 browser gate passes 7/7; protected V10 passes its unchanged 6/6
gate; applicable historical P6 regressions pass 15/15; applicable Python
contracts pass 48/48; and the native Debug build completes with the detached
HUD flag OFF. CTest has no registered tests and the executable reports
Chocolate Doom 3.1.1. Evidence proves active 320x200 canvas backing and native
view, 400x300/360x270 CSS geometry, the authentic 320x32 HUD, zero editor/deck
intersection, live controls, audio, automap, automatic/compatibility renderers,
direct `file://`, no scroll, and empty page/network failure arrays.

## Acceptance state

`PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING`. User-provided Samsung V10 evidence
accepted fullscreen, edge-to-edge rendering, detached HUD, minimap, gameplay,
and general controls, but rejected the obscured V10 editor. V11 repairs that
defect and introduces the 4:3 experiment; neither change has yet been operated
on Samsung Chrome. `adb devices -l` found no attached device during this task.
No push, PR, merge, workflow dispatch, Pages mutation, publication, deployment,
or release occurred.

## Next action

Review and operate the local V11 candidate on the intended Samsung in Chrome,
including the compact editor and 4:3 world, before any separately authorized
remote publication work.
