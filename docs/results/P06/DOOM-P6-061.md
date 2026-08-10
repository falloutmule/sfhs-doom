# TASK RESULT

**Task:** DOOM-P6-061 - Add LOOK tap-to-fire candidate
**Status:** PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING
**Base:** `181fa3a190afb8bc9d18e2216690686e0531c027`
**Result commit:** `SELF`
**Branch:** `feature/p6-v13-look-tap-fire`

## Result

V13 preserves the complete V12 two-surface, full-frame 4:3 handheld and adds a
Doom-specific short-tap recognizer to LOOK. A tap of at most 300 ms and at most
12 CSS pixels queues one built-command FIRE tic; a drag remains LOOK-only.
The existing FIRE button, shared package, profile schema/key, editor, minimap,
HUD, browser presentation, and all native source remain unchanged.

```text
artifact: dist/sfhs-doom-android-sfhs-controls-v13.html
bytes:    48351620
sha256:   97236f045b87b9f1fd65f9bcc9cc5d22ee0f348aaef8421b53987f6dc33abff9
oracle:   test-results/P06/P6-061/sfhs-doom-v13-oracle.html
bytes:    48376862
sha256:   574947e88ceba108d0447754701c1c92589ce790b7fa710ca1d32cbe7c1516d6
```

V8 through V12 retain their exact protected sizes and hashes.

## Exact verification

- Product and oracle `tools/build-single-file.sh` builds: PASS.
- `python tools/validate-p6-mobile.py ...v13.html`: PASS, 48,351,620 bytes.
- Artifact-manifest validator: PASS.
- V13 focused Playwright: 9/9 passed.
- Protected V12/V11/V10/V9/V8 plus applicable P6 browser regressions: 33/33 passed.
- Mobile/control Python contracts: 12/12 passed.
- Packaging/offline/audio/manifest Python contracts: 28/28 passed.
- Applicable native demo/Wasm comparison contracts: 9/9 passed.
- Legacy Chromium loopback audio/boot regressions: 3/3 passed when the installed
  Windows Python was explicitly selected; direct `file://` Chromium audio/menu
  regression: PASS.
- Fresh native Debug configure/build with `ENABLE_SDL2_NET=OFF` and
  `SFHS_MOBILE_DETACHED_HUD=OFF`: PASS; CTest found no registered tests;
  executable reports Chocolate Doom 3.1.1.
- `git diff --check`, single-file/static, external-resource, commercial-data,
  workflow exact-byte, and protected-hash checks: PASS.

The focused gate covers automatic and compatibility renderers; 360x800,
400x844, 576x1280, and 800x360; fullscreen success/rejection/unsupported;
real ammo and angle changes; jitter, drag, timeout, cancellation, capture loss,
blur, visibility, pagehide, edit entry, rapid queueing, MOVE concurrency,
dedicated FIRE precedence, Pointer and Touch Event routes, no scroll, and empty
page/network failure arrays.

## Gesture proof

- Stationary tap: ammo 50 -> 49; one press and one release tic.
- 6x6-pixel jitter tap: ammo 49 -> 48.
- 60-pixel drag: angle changes; ammo remains 48.
- 340 ms hold: rejected as timeout; ammo remains 48.
- End state: held mask 0, no active shared pointer.
- Queue cap: four; fifth same-task tap is dropped.
- Dedicated FIRE: pending LOOK-tap work is cleared with no delayed shot.

## Preserved presentation/native proof

- 360x270 automatic frame: 100% vertical and horizontal occupied span.
- 400x300 compatibility frame: 100% vertical and horizontal occupied span.
- 576x432 automatic frame: 100% vertical and horizontal occupied span.
- Native snapshot: effective world 320x200, screenblocks 11, internal status 0.
- Detached RGBA HUD: 320x32, unchanged.

## Classified failures

Early focused runs exposed two ordinary implementation issues that were fixed:
release tied to a rejected pre-build tic attempt, and a capture blur handler
that also observed descendant focus changes. Final focused and regression gates
pass.

A broad historical browser sweep also attempted Firefox without its installed
browser binary and an old Phase 3 Oracle movement lane that still reports
unchanged coordinates. Those are not V13 artifacts or gates. The applicable
Chromium direct-file/audio/boot lanes pass. The broad native-oracle source-budget
test remains stale because it expects only the original P1 source set; the
applicable demo/Wasm selection passes 9/9.

## Evidence

- `test-results/P06/P6-061/look-tap-fire-proof.json`
- `test-results/P06/P6-061/look-tap-cancellation-proof.json`
- `test-results/P06/P6-061/look-tap-queue-concurrency-proof.json`
- `test-results/P06/P6-061/look-tap-touch-fallback-proof.json`
- `test-results/P06/P6-061/360-auto-proof.json`
- `test-results/P06/P6-061/400-compatibility-proof.json`
- `test-results/P06/P6-061/576-auto-proof.json`
- `test-results/P06/P6-061/screenshots/`
- `evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v13.json`

## Limitation and next action

V13 has not been operated on Samsung Chrome. No physical tap/drag/editor/audio
result is claimed. After the exact V13 Pages candidate is published and
hash-verified, the next action is the user's Samsung LOOK tap, LOOK drag,
concurrent MOVE, dedicated FIRE, editor, and speaker acceptance check.
