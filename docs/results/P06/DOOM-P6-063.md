# TASK RESULT

**Task:** DOOM-P6-063 - Add resizable panels and clean mobile settings
**Status:** PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING
**Base:** `00e6bd0841ce31e5de7351003014a82c76d41641`
**Result commit:** `SELF`
**Branch:** `feature/p6-v15-resizable-panels-options`

## Result

V15 adds an independent display-layout editor for the real minimap canvas and
the CSS presentation of the authentic detached HUD, bounded user LOOK
tap-to-FIRE options, and a compact sectioned settings menu. Native Doom and the
shared SFHS control package are unchanged.

```text
artifact: dist/sfhs-doom-android-sfhs-controls-v15.html
bytes:    48372203
sha256:   e9a8b904d9fe91c09c15e6303757a4e2fd8d4eb05f8c1ce1f79c6c94ac8b71db
oracle:   test-results/P06/P6-063/sfhs-doom-v15-oracle.html
bytes:    48397445
sha256:   b3f5d2dc1d4ac3d1f7cb9d915c3608adf5aa9ec108c1c727109a58c36c4dcefb
```

V8 through V14 retain their exact protected sizes and hashes.

## Architecture and persistence

- `sfhsDoom.mobileUi.v1` with schema `sfhs.doom-mobile-ui@1` owns only
  orientation-specific panel fractions and bounded LOOK tap settings.
- Loaded records require the exact supported structure; every number is finite
  and clamped. Corrupt or unknown data falls back to defaults without rewriting
  storage. A read-only diagnostic/test snapshot exposes the active result.
- Panel Save persists; Cancel and orientation cancellation restore the exact
  baseline without storage mutation. Control edit and panel edit cannot overlap.
- Minimap backing remains a live canvas. HUD backing remains 320x32; only its
  centered, bottom-anchored CSS width changes and height follows 10:1.
- LOOK settings are sampled at gesture start. Option commits cancel tracking,
  queued tap work, and any tap-owned FIRE press. Dedicated FIRE priority and the
  fixed four-entry authoritative-tic queue remain internal and unchanged.

## Exact verification

- Official product and oracle builds plus V15 validator: PASS.
- Focused V15 Playwright: 8/8 passed.
- Protected V14/V13/V12/V10/V9/shared/MOVE/Samsung browser sweep: 48/48.
- Applicable Python mobile/package/audio/offline/native-demo/Wasm/manifest
  contracts: 52/52.
- Chromium loopback audio/boot: 3/3; direct `file://` audio/menu: 1/1.
- Fresh native Debug build with `SFHS_MOBILE_DETACHED_HUD=OFF`: 163 targets
  built; Chocolate Doom 3.1.1; CTest has no registered tests.
- Static packaging, protected hashes, YAML parse, generated identity,
  `git diff --check`, and network/page/console hygiene: PASS.

## Geometry and behavior proof

- 400x844 default portrait: world 400x300; minimap 400x183.984375; HUD CSS
  400x40; HUD backing 320x32.
- 800x360 default landscape: world 524.800048828125x328; horizontal center
  error 0.000030517578125 px; HUD 320x32 CSS and centered.
- 915x412: world 608x380 with zero horizontal center error.
- Portrait clamps prove a 240 px minimap maximum in the tested geometry and a
  240 px HUD minimum; saved and cancelled values behave independently.
- Rotation restores exact portrait values, then exact landscape values. Active
  edit rotation cancels safely without corrupting storage.
- Disabled LOOK tap consumes no ammunition; enabled tap does. A 220 ms gesture
  fails at 150 ms and passes at 300 ms. Ten-pixel jitter is LOOK-only at 6 px
  and fires at 16 px. Corrupt storage restores 300 ms/12 px/enabled defaults.
- Dedicated FIRE with concurrent MOVE remains correct, and ending held mask and
  active pointer counts are zero.

## Classified limitations

The broad project-doc validator still reports its known historical
task-template expectations for P6-058 through P6-062 and also P6-063. Firefox is
not installed. Existing native demo/Wasm comparison contract tests pass, and no
native source changed, so these are recorded limitations rather than V15 gates.

## Evidence

- `test-results/P06/P6-063/portrait-panel-resize-proof.json`
- `test-results/P06/P6-063/orientation-panel-isolation-proof.json`
- `test-results/P06/P6-063/look-tap-options-proof.json`
- `test-results/P06/P6-063/settings-controls-regression-proof.json`
- `test-results/P06/P6-063/screenshots/`
- `evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v15.json`

## Physical boundary and next action

V15 has not been physically accepted on Samsung Chrome. Test the exact Pages
bytes on the target device before changing this result state.
