# P06 V13 LOOK Tap-to-Fire Candidate

## Decision

`PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING` for DOOM-P6-061.

## Product change

V13 adds one Doom-owned gesture recognizer beside the unchanged shared LOOK
control. A release within 300 ms and 12 CSS pixels queues FIRE; a drag continues
through the shared full-width relative LOOK path and does not fire. Pointer
Event mouse, pen, and touch share the same recognizer, with a Touch Event
fallback where Pointer Events are unavailable. The visible LOOK control and
the dedicated FIRE button are unchanged.

The recognizer observes capture-phase events without preventing, stopping, or
capturing them. It does not alter `@sfhs/mobile-controls@b02336c4`, its profile,
persistence key, ownership, editor, or layout. The queue is bounded at four.
Dedicated FIRE clears queued tap shots and remains authoritative.

## Authoritative pulse boundary

The first implementation released on the next `I_StartTic` callback. Focused
testing proved that Chocolate Doom may reject that build attempt when its
command buffer is already ahead, allowing the press and release to occur
without a built command tic. V13 now uses the existing read-only Emscripten
command-build diagnostic to keep FIRE down until exactly one `G_BuildTiccmd`
has completed, then emits a release before another queued pulse. Doom native
source, simulation, tic timing, input semantics, demos, and saves are unchanged.

Blur, hidden-document, pagehide, cancellation, capture loss, viewport change,
edit entry, reset, import, and shared-owner loss clear tracking and pending
input. A window blur is distinguished from an ordinary descendant focus blur,
so opening Settings follows the explicit edit-entry path. All tested terminal
states report a zero native held mask.

## Proof

The focused browser gate passes 9/9. Real Doom state changes from ammo 50 to 49
for a stationary tap and 49 to 48 for a 6-by-6-pixel jitter tap. A 60-pixel
drag changes player angle without consuming ammo; a 340 ms hold consumes no
ammo. Two accepted shots produce two press tics, two release tics, and end with
no held input. Rapid input respects the four-entry queue, MOVE remains
concurrent, and dedicated FIRE clears pending tap input.

V12 presentation is preserved: screenshots cover 360x270, 400x300
compatibility, and 576x432 automatic rectangles at 100% horizontal and vertical
span. Native diagnostics remain world 320x200, screenblocks 11, internal status
inactive, and detached HUD 320x32. Protected/applicable browser regressions pass
33/33; Python control contracts pass 12/12; packaging/offline/audio/manifest
contracts pass 28/28; native demo/Wasm comparison contracts pass 9/9; and a
fresh native Debug build links with the detached HUD option OFF.

## Physical boundary

Desktop Chromium cannot establish Samsung touch feel, accidental-fire rate, or
speaker behavior. V13 must therefore be tested from the exact Pages bytes on
Samsung Chrome: tap LOOK to fire, make small jitter taps, drag LOOK without a
shot, use MOVE and LOOK simultaneously, hold dedicated FIRE, enter and operate
the editor, and verify speaker audio.
