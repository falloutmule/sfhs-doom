# SFHS Doom Current State

**Date:** 2026-08-11
**Phase:** P06 - Android portrait presentation and shared controls
**Current task:** DOOM-P6-063
**Current result commit:** SELF
**Branch:** `feature/p6-v15-resizable-panels-options`
**Base:** `00e6bd0841ce31e5de7351003014a82c76d41641`

## Verified reality

- `origin/main` and the task base are the exact published V14 commit
  `00e6bd0841ce31e5de7351003014a82c76d41641` at task start.
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
- V15: 48,372,203 bytes,
  `e9a8b904d9fe91c09c15e6303757a4e2fd8d4eb05f8c1ce1f79c6c94ac8b71db`.

## V15 product boundary

V15 adds a Doom-owned, orientation-specific display-layout editor for the real
minimap canvas and CSS-only presentation of the authentic detached HUD. The HUD
backing remains exactly 320x32 at a locked 10:1 ratio, centered above the safe
bottom inset. Minimap and HUD changes deterministically rebalance the existing
shell without changing world presentation or shrinking the shared control deck.

The independent `sfhsDoom.mobileUi.v1` record uses schema
`sfhs.doom-mobile-ui@1`. It owns validated panel fractions and bounded LOOK tap
options only. The accepted shared control package, `sfhsDoom.mobileControls.v2`
key, and `sfhs.mobile-controls-state@1` schema remain unchanged. V15 also
replaces the loose settings surface with compact accessible sections while
keeping control editing and panel editing separate and mutually exclusive.

No native, renderer, simulation, projection, demo/save, HUD extraction, Wasm
interface, or shared-SFHS source changed. Native world backing remains 320x200,
screenblocks remains 11, and the internal Doom status bar remains disabled.

## Verification state

Product and oracle builds pass. The focused V15 Playwright gate passes 8/8 over
360x800, 400x844, 800x360, and 915x412, automatic and compatibility renderers,
panel Save/Cancel/clamps/rotation isolation, LOOK option behavior and corrupt
storage recovery, settings/editor reachability, control regressions, file URL,
audio, and network/page hygiene. The unchanged protected browser sweep passes
48/48. Applicable Python contracts pass 52/52. Chromium loopback audio/boot
passes 3/3 and direct-file trusted audio/menu passes 1/1. A fresh native Debug
build with detached HUD OFF builds 163 targets and reports Chocolate Doom 3.1.1;
CTest has no registered tests.

The repository-wide project-doc validator still flags its pre-existing
historical task-template rules for P6-058 through P6-062 as well as this task;
it is not a V15 product gate. Firefox is unavailable locally. Existing native
demo/Wasm comparison contract evidence passes and no native source changed.

## Acceptance state

`PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING`. Desktop automation proves the bounded
browser-shell contract but cannot establish Samsung touch reach, visual
sharpness, hands-on LOOK feel, rotation feel, or speaker audio.

## Next action

Physically test the exact published V15 on Samsung Chrome: default portrait and
landscape, both resize handles and Save/Cancel, independent rotation layouts,
authentic HUD sharpness and centering, LOOK tap options and drag, dedicated FIRE,
settings/control editors, audio, and no page scrolling.
