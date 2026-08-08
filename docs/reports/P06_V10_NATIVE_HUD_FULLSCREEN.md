# P06 V10 Native HUD and Fullscreen Report

## Decision

`PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING` for DOOM-P6-058.

The approved two-surface design is implemented without changing shared SFHS
core or native Chocolate Doom behavior. The world and authentic status bar are
independent native-owned surfaces, not a crop or HTML recreation.

## Product proof

The native snapshot in `test-results/P06/P6-058/native-hud-proof.json` records
an active 320x32 RGBA surface, pitch 1280, screenblocks 11, effective world
320x200, internal status inactive, 10,240 nonblank/opaque pixels, and live
update/checksum changes. A real shared FIRE hold reduces pistol ammo from 50
to 49 while changing the native HUD checksum. Automap retains the detached HUD,
reports the internal bar inactive, and the captured 400x250 world bottom row is
blank rather than a stale or duplicated status strip.

The Start button requests fullscreen on `#sfhs-fullscreen-root` while the trusted
click is active and before main starts; Doom starts once without awaiting the
Promise. Success, rejection, and unsupported paths pass. SDL audio reaches
`running` from that gesture.

## Architecture audit

- Core loop: unchanged one-way input/action/simulation/render flow; HUD capture
  occurs in the existing status draw call and exports read-only pixels.
- State: no simulation mutator; only presentation metadata, scratch pixels, and
  palette state are new. Forced screenblocks/aspect choices are not persisted.
- Rendering: scratch target and private status flags are saved/restored; the
  main video buffer never receives detached pixels; automap owns all 200 rows.
- Timing: HUD browser work is requestAnimationFrame-driven, redraws only for a
  changed native counter, suspends while hidden, and resumes on visibility.
- Input: the accepted shared controls runtime, per-tic drain, active pointer
  release, profile schema/key, and LOOK calibration remain unchanged.
- Resize/orientation: portrait is exact full width at 8:5; lower regions absorb
  height pressure. Landscape remains a contained no-scroll fallback.
- Error handling: fullscreen rejection is caught without stopping startup;
  genuine engine errors remain console errors; the known Emscripten timing
  warning is retained as a warning. Focused evidence records empty page-error,
  console-error, external-request, and failed-request arrays.
- Debug/release boundary: browser HUD exports are read-only in the product;
  oracle-only behavior remains guarded by `SFHS_ORACLE_TEST`.

## Native boundary

With `SFHS_MOBILE_DETACHED_HUD=OFF`, the touched common C sources configure,
compile, and link as Chocolate Doom 3.1.1. No mobile HUD symbol reaches the
native executable, no native configuration field changes, and no simulation,
save, demo, or compatibility path was modified. Existing recorded demo and
native/Wasm parity contract tests remain 9/9 within the 30-test unit selection.

## Artifact and workflow

The official build script generated V10 at 48,341,427 bytes with SHA-256
`73a29b3ef179239744785a9b3e9b995fab77b82ab6c33452ae143d57a0b9e8f7`.
The local workflow verifies that exact candidate, retains exact V9 and V8 hash
checks, runs the V10 validator/focused browser gate, and would stage only exact
V10 bytes on a future authorized main push. It was not run or dispatched.

## Limitation

No physical Android device was connected. Desktop Chromium automation cannot
accept Samsung browser chrome, safe-area hardware, physical touch feel, speaker
output, or device-specific fullscreen behavior. Those claims remain pending.
