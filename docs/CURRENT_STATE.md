# SFHS Doom Current State

**Date:** 2026-08-10
**Phase:** P06 - Android portrait presentation and shared controls
**Current task:** DOOM-P6-061
**Current result commit:** SELF
**Branch:** `feature/p6-v13-look-tap-fire`
**Base:** `181fa3a190afb8bc9d18e2216690686e0531c027`

## Verified reality

- `origin/main` and the task base are the published V12 commit
  `181fa3a190afb8bc9d18e2216690686e0531c027`.
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

## V13 product boundary

V13 adds a browser-shell-only short-tap recognizer to the existing LOOK
surface. A release within 300 ms and 12 CSS pixels queues one FIRE press across
one actually built Doom command tic; a drag remains LOOK-only. The queue cap is
four, dedicated FIRE takes precedence, and cancellation/lifecycle paths clear
pending input. Mouse, pen, Pointer Event touch, and the Touch Event fallback
are covered. The LOOK label and dedicated FIRE button remain unchanged.

No native, renderer, simulation, demo/save, shared-control, layout, editor,
profile, or persistence source changed. V12's full-frame 4:3 presentation,
native 320x200 world, screenblocks 11, detached authentic 320x32 HUD, minimap,
and unobstructed editor remain intact.

## Verification state

Product and oracle builds pass. Static and artifact-manifest validation pass.
The focused V13 browser gate passes 9/9; protected/applicable browser
regressions pass 33/33; Python control contracts pass 12/12;
packaging/offline/audio/manifest contracts pass 28/28; applicable native
demo/Wasm contracts pass 9/9; and a fresh native Debug build completes with
detached HUD OFF. Chromium loopback audio/boot passes 3/3 and direct `file://`
Chromium audio/menu passes. Evidence proves stationary and jitter taps consume
one round each, drag and timeout consume none, every tested terminal path has a
zero held mask, both renderers retain full-frame coverage, and focused page,
network, and request-failure arrays are empty.

## Acceptance state

`PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING`. V13 has not been operated on Samsung
Chrome. Desktop automation does not establish tap feel, accidental-shot rate,
hands-on editor behavior, or speaker audio, and no physical result is claimed.

## Next action

Publish and exact-hash-verify V13 through the established Pages workflow, then
perform Samsung LOOK tap/drag, concurrent MOVE, dedicated FIRE, editor, and
speaker acceptance.
