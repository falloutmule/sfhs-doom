# SFHS Doom Current State

**Date:** 2026-08-09
**Phase:** P06 - Android portrait presentation and shared controls
**Current task:** DOOM-P6-060
**Current result commit:** SELF
**Branch:** `repair/p6-v12-physical-4x3`
**Base:** `3d939853968cd42322b5de0b19d7dfd5dd215500`

## Verified reality

- `origin/main` and the task base are the published V11 commit
  `3d939853968cd42322b5de0b19d7dfd5dd215500`.
- V8 remains exactly 48,328,131 bytes with SHA-256
  `b806eb9274ae46954ecdc54968735ca1ca94f3f062e3559c54c59b0e7f6ad912`.
- V9 remains exactly 48,328,267 bytes with SHA-256
  `be885e63be73232d30bb0f897a319baa380231ea56e3eaebea64b29c71c05111`.
- V10 remains exactly 48,341,427 bytes with SHA-256
  `73a29b3ef179239744785a9b3e9b995fab77b82ab6c33452ae143d57a0b9e8f7`.
- V11 is the new sibling at
  `dist/sfhs-doom-android-sfhs-controls-v11.html`: 48,343,387 bytes,
  SHA-256 `fac2b1f0637f25bab7a5f41b42115ff955c8e1bef11234876c0871232301b973`.
- V12 is the repair sibling at
  `dist/sfhs-doom-android-sfhs-controls-v12.html`: 48,344,370 bytes,
  SHA-256 `6b593fb3268b6fb1ca4cf5aa512c1f01e7c93ac51924964694e5ad712d7a7c24`.

## V12 product boundary

V12 repairs only V11's browser presentation ownership. V11's MutationObserver
fought SDL canvas sizing after startup and physically produced a cropped frame
plus a large bottom black band. V12 removes all backing-attribute restoration,
leaves the natural 320x200 canvas untouched through SDL initialization, and
activates one CSS transform afterward to fill the 4:3 region. The unchanged
logical and SDL output remain 320x200; the browser rectangles are 360x270,
400x300, and 576x432. No framebuffer, projection, FOV, screenblocks,
simulation, automap, menu, save, demo, native, or shared-SFHS source changed.

The accepted V11 edit mode still hides and suspends the minimap, places a compact editor form inside
that same grid region, and leaves the separate 320-pixel control deck exposed.
Save and Cancel restore the minimap. Drag, resize, settings, reset,
import/export, persistence schema/key, and
`@sfhs/mobile-controls@b02336c4` remain unchanged.

## Verification state

The exact product and oracle builds pass. The V12 static validator and manifest
pass. The focused V12 browser gate passes 10/10; protected/applicable P6 browser
regressions pass 23/23; Python control contracts pass 11/11; packaging/offline/
audio/manifest contracts pass 28/28; native demo/Wasm contracts pass 9/9; and a
fresh native Debug build completes with detached HUD OFF. CTest has no
registered tests and the executable reports Chocolate Doom 3.1.1. Evidence
proves native 320x200, authentic 320x32 HUD, full-height coverage in automatic
and compatibility renderers, editor zero-intersection, audio, direct `file://`,
no scroll, and empty page/network error arrays.

## Acceptance state

`PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING`. Physical Samsung evidence rejects V11:
at width 576 its 576x432 DOM region contained only about 576x286 of Doom pixels
and about 146 blank rows. V12's synthetic gate rejects that exact shape and its
live Chromium evidence covers 430/432 stable rows at 576px. The V11 editor
repair remains automated-only and must also be operated physically. No physical
V12 result is claimed.

## Next action

Publish the exact locally passing V12 candidate through the established Pages
workflow, then perform the supplied Samsung world-fill, controls, editor, and
speaker checklist.
