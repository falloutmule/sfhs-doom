# P6 Portrait Shell and Control Editor

**Task:** DOOM-P6-010  
**Status:** PASS  
**Branch:** `phase/p06-android-portrait`

## Delivered boundary

`web/p6/shell.html` is the Android-profile shell source. It keeps a uniform
320 by 200 game canvas and provides a live-viewport portrait grid: game view,
separate minimap canvas, control deck, and information strip. Landscape uses a
functional game-plus-side-deck fallback.

The shell includes all nine required control surfaces and a distinct edit
mode. The profile is normalized to the control deck, versioned as v1, validated
on import, capped at 64 KiB, and stored under
`sfhsDoom.mobileControls.v1` when browser storage is available. The editor
supports drag, resize, opacity, look sensitivity, dead zone, standard, large,
left-handed, reset, export, import, and Save. Entering or leaving edit mode
emits `sfhs-mobile-release-input`; P6-020 will attach that event to the SDL
input bridge.

`tools/build-single-file.sh --profile android --output PATH` selects the P6
shell. It requires an explicit output and refuses the protected P3 artifact
path. The default P3 invocation remains the P3 profile and output path.

## Focused verification

- `python -m unittest tests.test_p6_mobile_contract` — 4 passed.
- `node node_modules/@playwright/test/cli.js test p6-layout.spec.mjs --workers=1 --timeout 30000` — 5 passed.
- Required CSS viewports passed: 360 by 800 portrait, 400 by 844 portrait, and
  800 by 360 landscape. Each kept all four regions visible without document
  scroll.
- Git Bash syntax-check passed. Its Android invocation without `--output`
  rejected as intended. The local WSL bash service is unavailable in this
  sandbox, so this task did not attempt a Wasm build; candidate construction is
  deferred to P6-040.
- Protected P3 artifact remains 48,225,654 bytes with SHA-256
  `6737dbfc8c7909ea18a820de3cd6677654fab95277caf05eb9d660cb9235490e`.

## Test budget

This task adds two focused test files and nine individual tests. The phase
budget remains within four new test files and 20 individual tests.

## Limitations and next seam

Controls are intentionally presentation/editor surfaces in this task; they do
not yet send engine input. The minimap and HUD canvases are placeholders until
the read-only P6-030 state bridge. P6-020 is the next task.
