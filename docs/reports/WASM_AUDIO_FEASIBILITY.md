# P2 browser audio feasibility — pass

DOOM-P2-080 establishes the bounded multi-file browser engine-audio path.
The pinned Emscripten build explicitly exports `Module.callMain` and disables
automatic invocation. Normal boot/input lanes call the exported entrypoint
once after runtime and open-WAD preload readiness. Audio mode waits for a real
trusted Start-button click and calls the same entrypoint directly in that
handler.

## Startup and gesture evidence

Fresh Chromium and Firefox sessions recorded before Start:

- Doom main not started;
- no AudioContext existed;
- callback count was zero;
- the visible `#start-doom` button was enabled, visible, and the topmost
  `elementFromPoint` target at its center.

Normal Playwright locator interaction (`scrollIntoViewIfNeeded`, visible,
enabled, receiving-events checks, then `locator.click` without force) produced
trusted `pointerdown`, `pointerup`, `mousedown`, `mouseup`, and `click` events
targeting `#start-doom`. The handler invoked `Module.callMain` once and
disabled the button. Doom entered gameplay, the engine-created AudioContext
was running, and callback activity began only after Start.

Chromium recorded 867 callbacks, 125 nonzero PCM callbacks, and maximum PCM
absolute value `0.2509765625`. Firefox recorded 91 callbacks and 24 nonzero
callback buffers. Real trusted Enter and Control key events targeted the Doom
canvas. No shell oscillator, buffer source, synthetic PCM, or substitute audio
was created. The only console error was the known nonfatal
`emscripten_set_main_loop_timing` diagnostic; page errors and failed requests
were empty.

## Build boundary

The final link vector was:

    -sASYNCIFY -sEXIT_RUNTIME=1 -sINVOKE_RUN=0
    -sEXPORTED_FUNCTIONS=_main
    -sEXPORTED_RUNTIME_METHODS=callMain,FS,ENV

Emscripten 6.0.5 generated `Module['callMain']` in all three staged browser
builds. The output remains multi-file, uses separate open Freedoom data, and
contains no embedded Wasm/data or `SINGLE_FILE` packaging.

## Verification commands

- `python -m unittest tests.test_build_wasm tests.test_audio_probe_contract`:
  8 tests, OK.
- WSL `npx playwright test tests/boot.spec.mjs tests/input.spec.mjs
  --workers=1`: 6 passed.
- WSL `npx playwright test tests/audio.spec.mjs --workers=1`: 2 passed.

Evidence is preserved in `evidence/task-runs/P02-DOOM-P2-080/` and the three
P2 artifact manifests.
