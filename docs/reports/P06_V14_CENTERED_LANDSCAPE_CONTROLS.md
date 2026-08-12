# P06 V14 Centered Landscape Controls Candidate

## Decision

`PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING` for DOOM-P6-062.

## Product change

V14 changes only the landscape browser-shell composition. The complete 8:5
SDL presentation and detached authentic HUD now share the full safe landscape
viewport's center line. The minimap and compact editor-settings surface occupy
the left dock; the touch-control workspace remains exposed on the right. The
control deck is presentation-only and the shared control root still owns all
input, editing, profile validation, and persistence.

Landscape edit handles are kept inside their controls so they remain reachable
at phone heights. Dragging and resizing update only `layouts.landscape`.
Save persists that orientation, Cancel restores its baseline, and rotation
proves the portrait layout is unchanged. The shared package, profile schema,
storage key, declarations, input routing, and V13 LOOK-tap-to-FIRE recognizer
are unchanged.

## Geometry proof

- 800×360 automatic: game region 800×328; complete canvas 524.800×328;
  horizontal center error 0.00003 px; vertical center error 0 px; HUD center
  error 0 px; full-frame coverage passes.
- 915×412 compatibility: centered complete 8:5 frame and centered HUD; the
  same full-frame coverage and native-surface checks pass.
- Native/SDL diagnostics remain 320×200, screenblocks 11, internal status off,
  and detached HUD 320×32.
- Portrait remains 400×300 at 400×844 and LOOK tap still consumes one round.

## Editor proof

At 800×360 the editor-settings box is `167×142.1875` at `(4,4)` and the
control-deck box begins at x=592/y=151.1875. Their intersection is zero. Every
required control is visible and has zero intersection with editor settings.
MOVE drag, MOVE resize, and LOOK resize succeed; Save alters only landscape;
portrait → landscape rotation restores the saved positions; Cancel restores
the saved baseline; no pointer or held input remains.

## Verification

The focused V14 Playwright gate passes 4/4 over automatic and compatibility
renderers, 800×360 and 915×412 landscapes, portrait regression, audio startup,
full-frame screenshots, native HUD/world diagnostics, orientation isolation,
Save/Cancel persistence, no scroll, and network/page hygiene. Protected V13,
V12, shared-control, MOVE, and Samsung LOOK gates pass 25/25. Applicable Python
package/control/audio/native-demo/Wasm contracts pass 50/50. Chromium loopback
audio and phase 1/2 boot pass 3/3. A fresh native Debug build with detached HUD
OFF links and reports Chocolate Doom 3.1.1; CTest contains no registered tests.

The broader legacy sweep also encountered its documented environment limits:
Firefox 1532 is not installed, and the historical Phase-3 ArrowUp movement
oracle still reports unchanged coordinates. The Chromium direct-file trusted
audio/menu lane passes. Neither limitation intersects V14's browser-shell-only
change.

## Physical boundary

Desktop Chromium cannot establish Samsung landscape centering, touch reach,
hands-on drag/resize feel, or speaker behavior. Exact V14 must be published
only after separate authorization, then tested physically before acceptance.
