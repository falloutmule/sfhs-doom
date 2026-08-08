# TASK RESULT

**Task:** DOOM-P6-051 — Shared controls and division-strip LOOK  
**Status:** LOCAL/EMULATOR PASS; physical Samsung acceptance pending  
**Base:** `2353154a279c9a24a61e150b0ebeaaa4f8cd29f1`  
**Result commit:** `SELF`  
**Branch:** `repair/p6-sfhs-mobile-controls-v6`

## Candidate

`dist/sfhs-doom-android-sfhs-controls-v6.html` is a strict offline single
HTML file:

```text
bytes:  48,327,079
sha256: 6b1e1b2a6929bc0b975d983265e7d2643b30f25866c2cc9414f9b32c58c5ca20
```

The candidate vendors the accepted package source only, bundles it as one IIFE
at build time, and contains no sibling runtime asset.

## Bounded implementation

- Replaced the custom P6 DOM pointer, layout editor, profile, presets, and
  LOOK runtime with one generic `@sfhs/mobile-controls` controller.
- New persistence key: `sfhsDoom.mobileControls.v2`; no V1 profile migration.
- Added generic IDs: `move`, `look`, `primary`, `interact`, `modifier`,
  `menu`, `map`, `weapon-previous`, and `weapon-next`.
- Kept `-nograbmouse`, rendering, canvas sizing, audio, HUD/minimap, normal
  configured Doom input, P3, V5, and the blocked P4 boundary unchanged.
- Added compact, read-only package/adapter/input/game proof rather than the
  retired V3–V5 diagnostic framework.

## Focused result

```text
P6 static single-file validator: PASS
Python V6 contract/provenance checks: 7 passed
V6 browser controls contract: 3 passed
Focused P6 browser selection: 24 passed
```

The browser proof covers normal key/mouse consumers, position change, LOOK
angle change, pistol ammo reduction, utility input dispatch, concurrent
MOVE+LOOK+FIRE, lifecycle release, generic profile editing, portrait and
landscape containment, zero external requests, and zero page errors.

See `docs/reports/P06_SFHS_MOBILE_CONTROLS_V6.md` and the corresponding
artifact manifest for package provenance, exact bundle invocation, calibration,
and protected-artifact checks.

No remote operation occurred.  Physical Samsung acceptance and DOOM-P6-090
remain pending.
