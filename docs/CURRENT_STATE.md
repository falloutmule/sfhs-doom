# SFHS Doom Current State

**Date:** 2026-08-11
**Phase:** P06 - Android portrait presentation and shared controls
**Current task:** DOOM-P6-062
**Current result commit:** SELF
**Branch:** `feature/p6-v14-centered-landscape-controls`
**Base:** `b3fd3eae5b110935f221b8ad40f4ff7c99896168`

## Verified reality

- `origin/main` and the task base are the published V13 commit
  `b3fd3eae5b110935f221b8ad40f4ff7c99896168`.
- V8: 48,328,131 bytes,
  `b806eb9274ae46954ecdc54968735ca1ca94f3f062e3559c54c59b0e7f6ad912`.
- V9: 48,328,267 bytes,
  `be885e63be73232d30bb0f897a319baa380231ea56e3eaebea64b29c71c05111`.
- V10: 48,341,427 bytes,
  `73a29b3ef179239744785a9b3e9b995fab77b82ab6c33452ae143d57a0b9e8f7`.
- V11: 48,343,387 bytes,
  `fac2b1f0637f25bab7a5f41b42115ff955c8e1bef11234876c0871232301b973`.
- V12: 48,344,370 bytes,
  `6b593fb3268b6fb1ca4cf5aa512c1f01e7c93ac51924964694e5ad712d7a7c24`.
- V13: 48,351,620 bytes,
  `97236f045b87b9f1fd65f9bcc9cc5d22ee0f348aaef8421b53987f6dc33abff9`.
- V14: 48,352,772 bytes,
  `d3c72c6cd7fd26e96be2e4db324a03151194deea478b28776f486896519e2905`.

## V14 product boundary

V14 changes only landscape browser-shell composition. The complete 8:5 Doom
canvas and detached authentic HUD share the full safe viewport center line.
The minimap/editor-settings dock moves left while the editable control workspace
stays exposed on the right. Landscape resize handles stay inside their controls.
Save persists only the landscape profile; Cancel rolls back; rotation restores
the correct orientation-specific layout.

No native, renderer, simulation, demo/save, shared-control, profile-schema, or
persistence source changed. V13's portrait presentation and LOOK-tap-to-FIRE,
native 320x200 world, screenblocks 11, detached authentic 320x32 HUD, minimap,
and input lifecycle remain intact.

## Verification state

Product and oracle builds pass. Static and manifest validation pass. The focused
V14 browser gate passes 4/4; protected V13/V12 and applicable input regressions
pass 25/25; applicable Python contracts pass 50/50; Chromium loopback audio and
boot pass 3/3; Chromium direct `file://` trusted audio/menu passes; and a fresh
native Debug build completes with detached HUD OFF. Automatic 800x360 and
compatibility 915x412 evidence shows subpixel-zero canvas/HUD center offsets,
complete frame coverage, no scroll or external requests, and zero editor/control
intersection. Firefox is not installed and the historical Phase-3 movement
oracle remains stale; neither is a V14 gate.

## Acceptance state

`PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING`. V14 has not been operated on Samsung
Chrome. Desktop automation does not establish physical landscape centering,
hands-on drag/resize reach, rotation feel, or speaker audio.

## Next action

After separate remote authorization, publish and exact-hash-verify V14 through
the prepared Pages workflow, then perform Samsung landscape centering,
drag/resize Save/Cancel, portrait rotation, LOOK tap/drag, and speaker acceptance.
