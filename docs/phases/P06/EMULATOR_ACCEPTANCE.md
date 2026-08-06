# P6 Android Emulator Acceptance

`SFHS_DOOM_P6_ANDROID_EMULATOR_GATE=PASS_WITH_RECORDED_LIMITATIONS`

This is an Android Studio Emulator result only. It is not physical Samsung
acceptance, does not complete DOOM-P6-050, and does not affect DOOM-P6-090.

## Target and artifact

- AVD: `SFHS_Doom_Android15`; Pixel-class portrait profile, 1080 x 2400,
  420 dpi, 4096 MB RAM, automatic GPU/acceleration.
- System image: Android 15 / API 35 Google Play x86_64.
- Device reported by ADB: `emulator-5556` only; no physical ADB device was
  connected, paired, inspected, or modified.
- Chrome: `124.0.6367.219`.
- Candidate: `dist/sfhs-doom-android.html`, 48,275,694 bytes, SHA-256
  `fb357e4276a019832a30ba0719a26b5ad815c7accb45ff46be8b302c7406c171`.
- Protected P3 artifact was not modified.

The candidate was copied to `/sdcard/Download/sfhs-doom-android.html` and
opened through Android DocumentsUI into Chrome. Direct `file:///` access was
denied by Android scoped-storage policy, so the supported DocumentsUI handoff
was required; Chrome reported the resulting local `content://` document URI.

## Observed acceptance

- The portrait viewport was 412 x 811 CSS pixels with `scrollY = 0` and
  `scrollHeight = 811`. Game, minimap, control deck, and information strip
  occupied four visible regions from top to bottom.
- Trusted Start produced live first-person Freedoom gameplay. Chrome audio
  showed a started `AAudio` stream and the product AudioContext stayed
  `running`.
- The version-1 read-only state packet was read through `Module.HEAP32`.
  `typeof Module.HEAP32` was `object`; no state-packet write interface was
  exposed or used.
- Emulator DevTools `Input.dispatchTouchEvent` accepted simultaneous move,
  turn, and fire touches. The packet changed position and angle; ammo changed
  from 50 to 47 during the first sequence and to 41 during the soak. A
  move+run sequence, move+use sequence, and MENU/MAP/weapon pulse controls
  were also issued through the mobile input bridge.
- The separate minimap visibly tracked explored lines; the exported line count
  changed from 75 to 90. HUD health changed from 100 to 0 during ordinary
  gameplay and ammo/weapon fields remained live.
- Editor mode suspended game input. Drag and resize changed normalized control
  bounds; opacity changed to 0.77 and look sensitivity to 2.45. Export created
  `sfhs-doom-mobile-controls-v1.json`; reset restored defaults; importing that
  file restored the edited profile; saving and reloading preserved it.
- Backgrounding Chrome for 10 seconds and returning preserved the state packet,
  had audio `running`, and had no stuck input. Landscape fallback rendered and
  return to portrait was stable.
- Five 51-second active intervals (just over five minutes) completed with
  repeated multi-touch input. No abort, out-of-memory event, or product page
  error was observed.
- Final DevTools state had an empty product error list and
  `performance.getEntriesByType('resource')` was empty, so the candidate made
  no observable external page request.

## Evidence

Capture directory (local, untracked):
`C:\\tmp\\sfhs-doom-p6-emulator-20260806`.

Key captures:

- `p6-after-start.png` — live gameplay, minimap, controls, and HUD.
- `p6-editor-open.png` — visible editor and resize handles.
- `p6-landscape.png` — landscape fallback.
- `p6-resume.png` — post-background/resume state.
- `p6-five-minute-final.png` — final active-run state.

## Recorded limitations

- This AVD is not the user's Samsung hardware. P6-050 physical Samsung
  acceptance remains pending.
- Windows Hypervisor Platform was disabled, although a Windows hypervisor was
  present; the emulator used automatic acceleration. This is not a Samsung
  performance verdict.
- Direct ADB long swipes can trigger Chrome text-selection UI. CDP emulator
  touch events were used for the multi-touch acceptance sequences instead.
- Audible speaker output was not independently listened to; audio-path evidence
  is the started Android AAudio stream and running product AudioContext.
- Current-level visual feedback did not independently distinguish every
  MENU/MAP/weapon pulse, although those controls were issued through the
  bridge. Their focused candidate tests remain the primary mapping proof.
- Chrome emitted an unrelated image-thumbnail decode diagnostic after the
  DocumentsUI workflow. The candidate's product error list was empty and its
  resource-timing list was empty.
