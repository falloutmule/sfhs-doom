# DOOM-P6-062 — Center landscape presentation and expose editable controls

**Intelligence:** CODEX
**Phase:** P06
**Status:** PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING
**Depends on:** DOOM-P6-061 and exact V13 baseline
**Branch:** `feature/p6-v14-centered-landscape-controls`
**Base:** `b3fd3eae5b110935f221b8ad40f4ff7c99896168`
**Parallel:** No; one source-modifying writer
**Remote authorization:** None. Prepare V14 locally; do not push, merge, or publish without a separate authorization.

**Result:** `docs/results/P06/DOOM-P6-062.md`

## Goal

Create a bounded V14 candidate that centers the existing complete Doom world and
detached HUD in landscape and makes the active landscape control layout
directly adjustable. Preserve the accepted V13 portrait presentation,
LOOK-tap-to-FIRE behavior, native 320×200 world, detached 320×32 HUD, minimap,
profile schema/key, shared-control package, and native compatibility.

## Allowed files/directories

- `web/p6/shell.html`
- `browser-tests/tests/p6-v14-centered-landscape-controls.spec.mjs`
- `tools/validate-p6-mobile.py`
- `tests/test_p6_mobile_contract.py`
- `.github/workflows/p6-candidate-pages.yml`
- `docs/CURRENT_STATE.md`
- `docs/UPSTREAM_DELTA.md`
- `docs/COMPATIBILITY_MATRIX.md`
- `docs/tasks/P06/DOOM-P6-062.md`
- `docs/results/P06/DOOM-P6-062.md`
- `docs/reports/P06_V14_CENTERED_LANDSCAPE_CONTROLS.md`
- `evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v14.json`
- `test-results/P06/P6-062/**` (ignored backup and evidence)
- `dist/sfhs-doom-android-sfhs-controls-v14.html` (generated only)

V8 through V13 artifacts, Doom/native sources, `src/sfhs_mobile`, CMake, shared
SFHS core, and `vendor/sfhs-mobile-controls-v1` are read-only.

## Behavior contract

- In landscape, center the complete 8:5 presentation canvas in the full
  application viewport rather than the former left 74% column.
- Keep the world uncropped and preserve its SDL-owned backing plus native
  320×200 diagnostic contract.
- Center the detached authentic HUD on the same landscape axis.
- Retain a reachable minimap and settings affordance without page scrolling.
- Keep every landscape control visible and directly editable while the compact
  editor settings occupy a region that does not obscure the control workspace.
- Dragging/resizing in landscape changes only `layouts.landscape`; the portrait
  layout remains byte-for-byte equivalent in the exported profile.
- Save persists the landscape layout; Cancel restores its edit baseline; rotate
  portrait → landscape restores the saved orientation-specific positions.
- Preserve the persistence key `sfhsDoom.mobileControls.v2`, schema
  `sfhs.mobile-controls-state@1`, and package identity
  `@sfhs/mobile-controls@b02336c4`.
- Preserve V13 LOOK-tap-to-FIRE, dedicated FIRE, MOVE/LOOK calibration, all
  pulses/holds, fullscreen/audio lifecycle, HUD, automap, and visibility safety.

## Failure-mode audit

Actively guard Hermes modes **A, B, C, D, H, I, J, K, L, M, N, O, P, Q, S,
and T**. Modes H/J/N/O/P are primary: orientation changes must not clip or
shift the centered presentation, settings must remain reachable, edit controls
must not be covered, and orientation-specific Save/Cancel/persistence must not
leak into portrait or leave held input.

## Required verification

- Focused V14 Playwright coverage at 800×360 and a Samsung-like landscape
  viewport for centered game/HUD geometry, no scroll, reachable minimap/HUD,
  complete control containment, and automatic/compatibility renderers.
- Landscape edit-mode proof for non-occlusion, MOVE drag, MOVE/LOOK resize,
  Save persistence, Cancel rollback, reset/import/export preservation, and
  portrait-layout isolation across orientation changes.
- V13 portrait and LOOK-tap-to-FIRE regression unchanged against protected V13.
- Product and oracle builds through `tools/build-single-file.sh`, static/mobile
  validators, exact one-document/offline packaging, browser smoke/audio/file
  lanes, and applicable native/demo contracts.
- Exact V8–V13 byte/hash preservation, `git diff --check`, commercial-data and
  external-resource audit, generated provenance, and clean committed state.

## Acceptance

Commit as `PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING` after local gates pass.
Physical Samsung landscape centering and editor usability remain pending until
the exact V14 candidate is separately authorized and published for review.

## Commit

`DOOM-P6-062 center landscape and expose adjustable controls`
