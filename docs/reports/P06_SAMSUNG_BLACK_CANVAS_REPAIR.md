# P6 Samsung Black-Canvas Repair

## Result

`P6_SAMSUNG_BLACK_CANVAS_DIAGNOSTIC=BOUNDARY_B_SDL_BROWSER_PRESENTATION`

The reported Samsung symptom is consistent with a live Doom simulation whose
logical framebuffer is nonblack while the browser-facing canvas collapses.
The repair diagnostic reproduced that boundary in focused mobile emulation:
the original presentation measured a 1 by 0 canvas backing store while its
read-only logical `I_VideoBuffer` probe reported 974 nonblack samples out of
1024.

The repair makes canvas layout independent of Emscripten's mutable backing
size using an 8:5 container-relative presentation box. In the repair candidate
at 400 by 844 CSS pixels, the canvas backing is 400 by 250 and its CSS box is
400 by 250. No Doom simulation, gameplay, map, HUD, control mapping, or
renderer algorithm was changed.

## Diagnostic and bounded fallback

The in-page **Diagnostics** panel is read-only and can copy JSON without
developer tools. It reports build and renderer mode, user agent, viewport,
canvas backing/CSS/computed state, context and WebGL details, context events,
frame count, logical framebuffer sample/checksum, visible readback when
available, page/engine errors, audio state, and HUD activity.

The pre-Start renderer selector defaults to **Auto**. **Software
compatibility** sets `SDL_RENDER_DRIVER=software` in the Emscripten environment
before `Module.callMain`. Pinned SDL2 2.32.10 defines that environment-backed
hint and names its software render driver `software`. This is a bounded
compatibility fallback; it does not replace Chocolate Doom's renderer.

## Exact candidate

- Source commit: `924f329a85dbf502ab96ee3f0a23a3b6bcb50fd2`.
- Candidate: `dist/sfhs-doom-android-samsung-repair.html`.
- Bytes: `48,283,802`.
- SHA-256: `a2def0b319c2558bca87da57b1436a87bf443b6f73b546442561d310b8ac8190`.
- Original published candidate is unchanged: `dist/sfhs-doom-android.html`,
  48,275,694 bytes, SHA-256
  `fb357e4276a019832a30ba0719a26b5ad815c7accb45ff46be8b302c7406c171`.

## Verification and limitation

Focused static validation, P6 contract checks, seven layout/candidate browser
checks, trusted Start/audio, zero-request/page-error checks, and protected P3
identity checks are required for this repair. The desktop mobile-emulation
diagnostic fixture is `evidence/reports/P06/P6-041-desktop-emulation-diagnostic.json`.

WebGL default-framebuffer readback can be zero after a non-preserved frame has
been discarded even when a prior bounded observation saw nonblack pixels. The
diagnostic records that value; it is not used as an unqualified physical visual
claim. The physical Samsung result remains untested until the user opens this
separate candidate and copies its diagnostic JSON.
