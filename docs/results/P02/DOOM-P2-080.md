# TASK RESULT

**Task:** DOOM-P2-080
**Status:** PASS
**Base commit:** 342a1418b993f2dad0666f79244198bf6c026ffa
Result commit: SELF
**Branch:** phase/p02-wasm-feasibility

## What was done

- Added the supported Emscripten link settings `INVOKE_RUN=0`, exported
  `_main`, and runtime methods `callMain,FS,ENV`, while preserving
  `ASYNCIFY` and `EXIT_RUNTIME=1`.
- Selected `emcc` and `em++` explicitly for the pinned Emscripten CMake
  configure path and rebuilt the three multi-file Wasm variants from the
  clean ignored P2-050 build directories.
- Replaced the unavailable automatic-run assumption with a shell adapter that
  calls exported `Module.callMain(Module.arguments)` once after normal runtime
  and WAD preload readiness. Audio mode calls it exactly once directly from
  the trusted Start-button handler and attaches only rejection handling to a
  returned Promise.
- Preserved the real SDL2 WebAudio callback path. No shell oscillator, buffer
  source, synthetic PCM, C, gameplay, renderer, timing, SDL implementation,
  or engine change was made.

## What was verified

- Pinned toolchain: Emscripten 6.0.5, identity
  `1db513782be24469589d7cb8a1f1834e9a33f271`.
- Final link command recorded in `evidence/task-runs/P02-DOOM-P2-080/`:
  `-sASYNCIFY -sEXIT_RUNTIME=1 -sINVOKE_RUN=0 -sEXPORTED_FUNCTIONS=_main -sEXPORTED_RUNTIME_METHODS=callMain,FS,ENV`.
- Generated JavaScript for `phase1-debug`, `phase2-debug`, and `phase2-oracle`
  contains `Module['callMain']`.
- `python -m unittest tests.test_build_wasm tests.test_audio_probe_contract`:
  8 tests, OK.
- In the pinned WSL environment,
  `npx playwright test tests/boot.spec.mjs tests/input.spec.mjs --workers=1`:
  6 passed.
- In the pinned WSL environment,
  `npx playwright test tests/audio.spec.mjs --workers=1`: 2 passed.
- Audio pre-click invariant passed in Chromium and Firefox: main not started,
  no AudioContext, zero callbacks, and the visible Start button was the
  topmost hit target.
- Trusted pointer/click events reached `#start-doom`; main started once;
  context became running; Chromium recorded 125 nonzero PCM callbacks and
  Firefox recorded 24 nonzero callback buffers in the fresh run. Real Enter
  and Control key events were trusted and targeted to the Doom canvas.
- Page errors and failed requests were empty. The sole console diagnostic was
  the known nonfatal Emscripten main-loop timing message.

## What failed

- The first Windows-host rerun used the test default `python3`, which is not
  installed on Windows, and then could not launch the pinned Linux Firefox
  cache. This was an environment invocation failure, not a repository or
  browser-lane result. The exact tests passed under the existing pinned WSL
  environment with `python3`.

## Evidence

- `docs/reports/WASM_AUDIO_FEASIBILITY.md`
- `evidence/task-runs/P02-DOOM-P2-080/chromium.json`
- `evidence/task-runs/P02-DOOM-P2-080/firefox.json`
- `evidence/task-runs/P02-DOOM-P2-080/`
- `evidence/manifests/P02/phase1-debug.json`
- `evidence/manifests/P02/phase2-debug.json`
- `evidence/manifests/P02/phase2-oracle.json`

## Current exact state

P2-080 passes its bounded build, shell, boot, input, and browser audio
acceptance on `phase/p02-wasm-feasibility`. `Result commit: SELF` will resolve
to the single task commit.

## Remaining blocker or next task

No P2-080 blocker remains. Continue with DOOM-P2-085.

## Post-run Git status

To be verified clean after the single P2-080 commit.
