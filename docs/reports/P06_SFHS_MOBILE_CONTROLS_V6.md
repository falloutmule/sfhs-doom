# P6 V6 — Shared Controls and Division-Strip LOOK

## Outcome

`DOOM-P6-051` is **LOCAL/EMULATOR PASS**.  V6 is a local sibling candidate;
it has not been pushed, deployed, merged, tagged, or released.  Physical
Samsung acceptance remains pending.

## Frozen dependency and bundle

- Archive: `sfhs-mobile-controls-v1-accepted-b02336c.zip`
- Archive bytes: `52,596`
- Archive SHA-256:
  `f360fe5a9c80ffc78f2fc38ecd4fe22b149702d251ecf3f0fbeca20348123d25`
- Package head: `b02336c4de013a3fcd9bd900701867c7f99ffdd1`
- Implementation commit: `9af795fbf22b19e06724785517b97bb3d98c934a`
- Vendored boundary: `vendor/sfhs-mobile-controls-v1/` contains only package
  metadata, source, README, and the provenance manifest.  It contains no lab,
  SNC source, or DOM-interactive adapter.
- Bundler: the existing SFHS esbuild `0.28.1` toolchain.
- Bundle SHA-256:
  `2d8453442bd1ffce8f0a432c9c7c4ddf6a0ba29c6a3ce13ac668669c6579133f`
- Exact Windows-host invocation is recorded in the manifest.  It bundles
  `vendor/sfhs-mobile-controls-v1/src/index.ts` as browser IIFE global
  `SFHSMobileControls`, target `es2022`, then injects it into the shell before
  strict one-file packaging.

## Architecture proof

- DOM gameplay-control runtimes: **1** (`@sfhs/mobile-controls@b02336c4`).
- LOOK event-rate accumulation layers: **1** (the package `relative1d`
  output, drained by `controller.flush()` once per game tic).
- Authoritative consumer: `I_StartTic()` / Doom fixed tic, through the thin
  Emscripten adapter call.
- The adapter uses only a sub-count numeric conversion remainder.  It maps the
  generic controller outputs to ordinary configured Doom keys and `ev_mouse`;
  it has no browser timer and no direct gameplay mutation.
- V5's native pending LOOK accumulator and `sfhs_mobile_input_flush_look()`
  are removed.  Each nonzero V6 adapter flush posts one zero-initialized
  `ev_mouse` through the normal Doom event path.

## Geometry and calibration

Portrait LOOK is `relative1d` on X at normalized rectangle
`x=.52, y=.70, width=.43, height=.10`: at 400 CSS-pixel width it is 172 px
wide and about 84 px tall, with a thin horizontal rail.  FIRE is above it,
USE below it, and RUN is separate.  All nine generic controls remain inside
the controls region in the focused portrait and landscape checks.

At Chocolate Doom default `mouseSensitivity = 5`, the adapter keeps
`relativeSensitivity = 1.0` and maps a normalized full strip-width delta to
4096 mouse counts.  `G_Responder` keeps 4096 counts at default sensitivity;
the normal tic command multiplies it by 8, yielding 32768 tic angle units,
approximately 180 degrees of yaw.

## Verification

- Python V6 dependency/provenance and contract checks: `7 passed`.
- V6 browser controls/editor/LOOK checks: `3 passed`.
- Focused P6 browser selection: `24 passed`.
- P6 strict static candidate validation: PASS.
- No HTTP/HTTPS product request and no page error in the V6 browser gate.
- Protected P3 SHA-256 retained:
  `6737dbfc8c7909ea18a820de3cd6677654fab95277caf05eb9d660cb9235490e`.
- Protected V5 SHA-256 retained:
  `fa78944cd1482770dde9fde2192022b07991ca1942359de97d7557dc79333b7e`.

## Limits

Automated and emulator-style browser evidence cannot establish physical thumb
comfort or Samsung device acceptance.  The next action is one physical
Samsung V6 test; this result does not change P6-050 or P6-090.
