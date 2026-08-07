# TASK RESULT

**Task:** DOOM-P6-048 — Samsung V5 LOOK rate repair  
**Status:** LOCAL CANDIDATE PASS; physical Samsung rate acceptance pending  
**Base:** `b6ce2862f827258b3b9f58c6a2d81188a6681856`  
**Result commit:** `SELF`  
**Branch:** `repair/p6-samsung-look-v5`

## Candidate

`dist/sfhs-doom-android-samsung-input-v5.html` is one offline HTML file:

```text
bytes:  48,327,803
sha256: fa78944cd1482770dde9fde2192022b07991ca1942359de97d7557dc79333b7e
```

The V4 candidate remains `48,323,709` bytes with SHA-256
`dff29abb293d0f373a696393537a2c2f88a8f116c751b2eff3cc9ebc8908b640`.
The protected P3 artifact remains `48,225,654` bytes with SHA-256
`6737dbfc8c7909ea18a820de3cd6677654fab95277caf05eb9d660cb9235490e`.

## Bounded repair

- The JavaScript fractional LOOK accumulator and V4 `-nograbmouse` launch
  property are preserved.
- `sfhs_mobile_input_post_look()` now saturating-accumulates horizontal
  movement instead of posting one event per DOM sample.
- The Emscripten `I_StartTic()` seam flushes pending movement once per Doom
  tic as one zero-initialized ordinary `ev_mouse` event.
- Lifecycle release clears pending movement, preventing a delayed turn after
  blur, visibility loss, or page exit.
- Diagnostics distinguish DOM samples, native units accumulated, flush calls,
  units flushed, posted mouse events, consumer events, angle-producing tics,
  and final angle delta.
- No default sensitivity, MOVE, FIRE, gameplay, renderer, HUD, minimap, audio,
  mobile state packet, or `G_Responder` behavior changed.

## Focused verification

```text
P6 Android static validation: PASS
Python mobile/manifest contracts: PASS
Focused P6/V3/V4/V5 Playwright: 21 passed
```

The decisive same-task regression dispatched twenty 2-pixel LOOK samples
before the browser yielded:

```text
DOM samples:             20
units accumulated:       40
units flushed:           40
ev_mouse posted:          1
consumer mouse events:    1
consumer last mouse X:   40
angle-producing tics:     1
angle: 0 -> -20,971,520
pending units afterward:  0
```

The V5 candidate also passed MOVE and FIRE outcome checks, returned its held
mask to zero, emitted no page error, and requested no external HTTP resource.

## Limitations and next gate

Automated evidence proves the lost intra-tic motion is repaired; it cannot
judge physical thumb feel. The default LOOK sensitivity remains unchanged as
required. One physical Samsung test must determine whether V5 turning rate is
acceptable before any sensitivity tuning or publication claim.

No push, pull request, merge, Pages deployment, or release occurred.
