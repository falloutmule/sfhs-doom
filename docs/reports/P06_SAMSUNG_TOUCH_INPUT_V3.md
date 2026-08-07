# P6 Samsung Touch Input V3

## Result

`SFHS_DOOM_P6_SAMSUNG_INPUT_V3_GATE=PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING`

The physical Samsung game view is visible. Rendering, audio, minimap, HUD,
gameplay rules, and the state-packet layout were not changed by this repair.

The V2 physical diagnostic isolated LOOK at the browser/native boundary: 1,113
look calls produced zero posted mouse events. V3 retains fractional horizontal
motion across Pointer Events, consumes coalesced samples when available, and
posts only nonzero integral movement while retaining the fractional remainder.
Pointer-capture failure remains nonfatal.

## Physical outcome panel

The on-phone **Test controls** panel evaluates game outcomes rather than merely
producer counters:

- MOVE passes only when player x/y changes.
- LOOK passes only when a native mouse event is posted and player angle changes.
- FIRE passes only when ammunition decreases.
- Native Forward Test compares the browser pointer layer with the same bounded
  native held-forward bridge used by MOVE.

The diagnostic JSON includes raw coordinate type/finite status, previous X,
raw delta, sensitivity, accumulator before/after, integral movement posted,
coalesced sample count, native bridge counters, and a read-only responder/ticcmd
consumer probe. WebGL default-framebuffer readback is labeled non-authoritative
for physical visibility.

## Focused browser evidence

At 400 by 844 CSS pixels in Chromium mobile emulation:

- MOVE: x `-12582912 -> 13805`, y `-12582912 -> -12578362`, one native keydown,
  one native keyup, held mask `0`: PASS.
- LOOK: raw horizontal delta `30.00` CSS px, integral delta `30`, ten native
  mouse events, angle `0 -> -3145728`: PASS.
- FIRE: ammo `50 -> 49`, one native keydown: PASS.
- Fractional LOOK samples of `0.25` CSS px eventually posted nonzero motion.
- Synthetic `InvalidStateError` from `setPointerCapture()` did not stop MOVE,
  LOOK, or FIRE dispatch.
- Pointer cancellation returned the held mask to `0`.

The consumer probe also showed why early outcome checks initially appeared to
fail: during Doom's startup wipe, presentation frames advance but
`G_BuildTiccmd` is not called. Focused tests now wait for the first post-wipe
ticcmd build before measuring an input outcome. No gameplay repair was made.

## Exact candidate

- Source commit: `0b8bc1c64a73db032bdab26f97f8e914afbf9248`.
- Candidate: `dist/sfhs-doom-android-samsung-input-v3.html`.
- Bytes: `48,320,562`.
- SHA-256: `f4bb688392c9be95f2bed258ff31b203a11ee972290222c23aeaaac070e7a35f`.
- Published Android candidate remains unchanged: `48,275,694` bytes,
  `fb357e4276a019832a30ba0719a26b5ad815c7accb45ff46be8b302c7406c171`.
- Published Samsung V2 remains unchanged: `48,304,713` bytes,
  `0784085bbf8c0e72ded514bc5a41f803e166154bb2eb3a422e9b2668619fedd2`.
- Protected P3 remains unchanged: `48,225,654` bytes,
  `6737dbfc8c7909ea18a820de3cd6677654fab95277caf05eb9d660cb9235490e`.

## Verification

- Focused V3 Playwright: 5 passed.
- Repeated MOVE/LOOK outcome stability: 6 passed.
- Existing P6 candidate/layout Playwright: 8 passed.
- P6 mobile contract: 10 passed.
- P6 Android static validator: PASS.
- Project documents and task state: PASS.
- V3 audio running, HUD/minimap active, logical framebuffer nonblack,
  presentation advancing, zero page errors, and zero HTTP/HTTPS requests in the
  focused V3 run.

Android emulator V3 was not rerun. The prior V2 Android 15 emulator acceptance
remains regression context, not V3 acceptance. Physical Samsung MOVE, LOOK,
FIRE, multi-touch, and comfort remain pending until the user opens this exact
V3 artifact.
