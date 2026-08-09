# P06 V11 4:3 Presentation and Editor Repair Report

## Decision

`PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING` for DOOM-P6-059.

V11 preserves the accepted V10 two-surface architecture. It changes only the
browser presentation of the world and the placement/lifecycle of the existing
control editor.

## Presentation proof

The engine and main-canvas attributes remain 320x200. Portrait CSS presents
that surface at 4:3 without crop or letterbox: 360x270 and 400x300 evidence is
edge-to-edge at x=0/y=0. CSS scale variables perform the one non-square-pixel
correction. When SDL attempts to mirror the visual dimensions into canvas
attributes, a bounded MutationObserver restores 320x200; rendering continues
normally in automatic and compatibility modes. The engine snapshot still
reports effective 320x200, screenblocks 11, and no internal status bar.

The authentic WAD/status-code HUD path is untouched. Its browser backing stays
320x32, with 10,240 nonblank/opaque pixels and palette/update/checksum activity.
FIRE changes real ammo from 50 to 49 and changes the detached HUD checksum.
Automap retains the detached bar without enabling an internal copy.

## Editor proof

Normal mode retains world, minimap, controls, and HUD. Edit mode marks the
minimap region as editing, hides and suspends the minimap canvas, and exposes a
compact six-column editor grid there. The control deck remains a separate
320-pixel row.

At 400x844 the editor bottom is y=480 and the deck begins at y=484. Their
intersection is zero, and every declared control has zero intersection with the
editor. The focused test drags and resizes MOVE, resizes LOOK, persists Save,
modifies FIRE and verifies Cancel rollback, exports JSON, exercises Reset and
profile import, and verifies minimap updates resume after closing.

## Compatibility and scope audit

- Core loop, simulation, timing, RNG, saves, demos, projection, FOV, automap,
  menus, WAD graphics, and native configuration are unchanged.
- No C, CMake, Emscripten export, native interface, or shared-controls file is
  in the V11 diff.
- `@sfhs/mobile-controls@b02336c4`, `sfhsDoom.mobileControls.v2`, and profile
  schema `sfhs.mobile-controls-profile@1` are preserved.
- V8, V9, and V10 hashes remain exact. V10's unchanged focused gate passes.
- V11 is one HTML document with embedded open Freedoom input, no external Wasm,
  no runtime HTTP asset, no service worker, and no commercial WAD file.
- Native Debug builds with detached HUD OFF and reports Chocolate Doom 3.1.1.

## Browser and lifecycle proof

Seven V11 focused tests cover 360x800, 400x844, and 800x360; trusted fullscreen
ordering; rejection and unsupported fallback; exactly-once main; running audio;
automatic and compatibility renderers; direct-file startup; active native HUD;
gameplay controls; editor lifecycle; document visibility; no scroll; and empty
page-error, failed-request, and external-request arrays. Fifteen applicable
historical P6 browser tests and 48 applicable Python contracts also pass.

## Physical boundary

The user's V10 Samsung result accepted the game presentation and controls but
rejected editor usability because the settings modal obscured the controls.
V11 directly repairs that geometry and adds the requested 4:3 experiment, but
no V11 device was attached or run. Physical acceptance therefore remains
pending and is not inferred from Playwright.
