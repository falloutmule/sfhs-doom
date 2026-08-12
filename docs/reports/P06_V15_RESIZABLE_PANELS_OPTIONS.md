# P06 V15 Resizable Panels and Mobile Options Candidate

## Decision

`PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING` for DOOM-P6-063.

## Product change

V15 keeps V14's accepted world and control presentation while adding a separate
Doom-owned panel editor. In portrait the live minimap canvas remains full width
and its height is resizable. In landscape it remains in the safe left dock and
accepts bounded width and height changes. The detached status bar remains the
authentic native-rendered 320x32 canvas; V15 changes only its centered CSS width
and derives height at the locked 10:1 aspect ratio.

The editor releases input, keeps both touch-sized handles visible, and presents
a compact Save/Cancel/Defaults toolbar. Save is the only editor action that
persists. Cancel restores the exact baseline, and rotation safely cancels an
active edit. The shared control editor is separate and mutually exclusive.

LOOK tap-to-FIRE now exposes only enabled, 150-450 ms duration, and 6-24 CSS px
tolerance controls. Defaults are enabled, 300 ms, and 12 px. The gesture takes
a settings snapshot at start; changes safely cancel tracked and queued taps.
The fixed authoritative-tic press/release queue, dedicated FIRE precedence, and
shared LOOK drag route remain unchanged.

## Persistence boundary

The validated `sfhsDoom.mobileUi.v1` record uses schema
`sfhs.doom-mobile-ui@1`. Portrait and landscape panel values are independent.
Unknown keys, malformed structures, non-finite values, and unsupported schema
values fall back to defaults without writing storage. The shared
`sfhsDoom.mobileControls.v2` record and `sfhs.mobile-controls-state@1` schema are
unchanged.

## Settings cleanup

The menu is a compact accessible accordion with Play, Display layout, Touch
controls, LOOK tap fire, Control profile, and Advanced sections. It stays below
the world in portrait and in the safe left dock in landscape. Only the menu may
scroll; the page cannot. Import, export, resets, diagnostics, fullscreen, and
all prior tuning actions remain reachable without raw JSON on the main screen.

## Geometry proof

- 400x844 default portrait retains a 400x300 world, 400x183.984375 minimap,
  and centered 400x40 HUD presentation over the 320x32 backing.
- 800x360 automatic retains the complete centered 524.800048828125x328 world,
  with 0.000030517578125 px horizontal center error and centered 320x32 HUD.
- 915x412 retains a centered 608x380 complete world with zero horizontal error.
- Saved customized portrait and landscape fractions survive reload and rotation
  independently. Minimum/maximum clamps, exact Cancel, no-scroll, reachable
  handles, and zero required-control overlap pass in the focused gate.

## Verification

The focused V15 gate passes 8/8 over all required viewports, both renderers,
panel editing and persistence, LOOK option behavior, compact settings, editor
exclusivity, controls, audio, automap, file URL, lifecycle release, and browser
hygiene. The unchanged protected browser sweep passes 48/48 and applicable
Python contracts pass 52/52. Loopback boot/audio passes 3/3; direct-file trusted
audio/menu passes 1/1. A fresh native detached-HUD-OFF Debug build completes
163 targets and reports Chocolate Doom 3.1.1. No native or shared source changed.

The broad project-doc validator retains historical template failures and Firefox
is unavailable locally. Neither is a V15 product failure.

## Physical boundary

Automation cannot establish Samsung handle reach, native-pixel sharpness,
hands-on LOOK feel, rotation feel, control comfort, or speaker quality. Exact
published V15 requires the user's physical checklist before acceptance.
