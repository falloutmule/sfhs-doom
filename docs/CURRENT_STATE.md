# SFHS Doom Current State

**Date:** 2026-08-08
**Phase:** P06 - Android portrait shell, controls, minimap, and detached native HUD
**Current task:** DOOM-P6-058
**Current result commit:** SELF
**Branch:** `feature/p6-native-hud-fullscreen`
**Base:** `8d45af9e51573dd048f86f95b68a8f65670efae9`

## Verified reality

- `origin/main` and the task base are the published V9 commit
  `8d45af9e51573dd048f86f95b68a8f65670efae9`.
- Chocolate Doom remains pinned to `chocolate-doom-3.1.1` at
  `410d96855b5df5410ff591a90efeafa889119224`.
- V8 remains exactly 48,328,131 bytes with SHA-256
  `b806eb9274ae46954ecdc54968735ca1ca94f3f062e3559c54c59b0e7f6ad912`.
- V9 remains exactly 48,328,267 bytes with SHA-256
  `be885e63be73232d30bb0f897a319baa380231ea56e3eaebea64b29c71c05111`.
- V10 is the new sibling candidate at
  `dist/sfhs-doom-android-sfhs-controls-v10.html`: 48,341,427 bytes,
  SHA-256 `73a29b3ef179239744785a9b3e9b995fab77b82ab6c33452ae143d57a0b9e8f7`.
- No commercial game data, external runtime asset, service worker, shared SFHS
  core change, or remote write is part of V10.

## V10 product boundary

V10 uses the full logical 320x200 Doom framebuffer as the portrait world and
scales it to the complete viewport width at 8:5. The original Doom status code
renders its WAD-owned graphics and animated widgets into a private indexed
scratch surface; the active PLAYPAL palette converts rows 168-199 into a
read-only 320x32 RGBA snapshot for a separate bottom canvas. The internal bar
and its automap reservation remain disabled only in the compile-time-gated
Emscripten Android profile.

The Start Fullscreen gesture requests fullscreen on the root containing the
world, controls, settings, and diagnostics, then starts Doom immediately in the
same handler. Rejection and unsupported paths continue normally. The minimap,
shared `@sfhs/mobile-controls` runtime, persistence key, editor, import/export,
and compact V9 control floors remain intact.

## Verification state

The local product/oracle builds, V10 validator, 6-test focused V10 browser gate,
15-test applicable P6 regression gate, 30 Python `unittest` contracts, and a
native Debug build with `SFHS_MOBILE_DETACHED_HUD=OFF` pass. Native CTest reports
that this project defines no CTest tests; the executable reports Chocolate Doom
3.1.1. Direct `file://`, automatic and compatibility renderers, audio activation,
fullscreen success/rejection/unsupported paths, 320x200 world, 320x32 HUD,
automap no-duplicate behavior, controls, visibility lifecycle, and zero browser
errors/external requests are covered by the focused gate.

## Acceptance state

`PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING`. `adb devices -l` reported no attached
device, so no physical Android claim is made. No PR, push, merge, workflow run,
Pages mutation, publication, deployment, or release occurred.

## Next action

Run the V10 physical Samsung Chrome acceptance card, then use the prepared exact
V10 workflow in a separately authorized PR/merge and deployment sequence.
