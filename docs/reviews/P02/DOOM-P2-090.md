# DOOM-P2-090 — Independent Read-Only Review

## Overall goal

Build a vanilla-compatible Doom browser port whose final canonical release is one offline-capable HTML file.

## Current goal

Independently review the completed P2 multi-file WebAssembly candidate and decide whether the project may begin P3 single-file packaging.

## Verdict

**PASS_WITH_RECORDED_LIMITATIONS**

P2 provides enough operational proof to begin P3. The review found no engine or architecture defect that requires redesign before packaging.

This verdict authorizes local P3 planning and implementation only. It does not authorize a remote, push, pull request, merge, publication, deployment, or release.

## Review input

- Bundle: `SFHS-DOOM-P2-REVIEW.zip`
- Bundle SHA-256: `3edf35d919178abd8bf0eec58beaa2cddc3fc120fa9f0fe62613a0c83ff4ae0b`
- ZIP entries: 170
- Reported final commit: `48b61cccea64ab2a4d29e3f293cbce142aee4de9`
- Reported branch: `phase/p02-wasm-feasibility`
- Reported upstream: Chocolate Doom `chocolate-doom-3.1.1` at `410d96855b5df5410ff591a90efeafa889119224`
- Reported remotes: official `upstream` only
- Reported worktree: clean
- Reported builder gate: `SFHS_DOOM_P2_WASM_FEASIBILITY_GATE=PASS_WITH_RECORDED_LIMITATIONS`

The compact bundle contains no `.git` directory or live repository connection. The final commit, clean worktree, exact commit count, and current remote/PR state are therefore builder-reported rather than independently recomputed from the bundle.

## What was directly reviewed

- P2 phase plan, phase result, and task results.
- Multi-file Wasm build driver and CMake adapter.
- Browser shell, preload/startup adapter, and audio probe.
- Chromium and Firefox boot, menu-input, audio, server, and parity JSON evidence.
- Native/Wasm comparison implementation.
- P1 Oracle portability change used for Wasm MEMFS.
- P2 focused gate and all nine gate regression tests.
- Full 131-test diagnostic output and the recorded infrastructure-debt classifications.
- Three P2 artifact manifests and their captured configure/build logs.
- Review-bundle structure and duplicate-entry identities.

## Findings

### 1. Upstream WebAssembly feasibility — PASS

The supplied results show that the pinned Chocolate Doom source configures and links under Emscripten 6.0.5. The first unmodified-source link probe reached a direct JavaScript/Wasm result without gameplay or renderer redesign.

The tracked adapter remains narrow:

- a P2 CMake flag fragment;
- build orchestration;
- a test browser shell;
- a test-only audio observer;
- one Emscripten-specific Oracle output-path fallback.

No P2 `src/doom/**` gameplay or renderer modification appears in the review bundle.

### 2. Multi-file artifact boundary — PASS

The three P2 manifests identify separate:

- JavaScript loader;
- Wasm module;
- open Freedoom WAD.

The recorded artifacts do not use `SINGLE_FILE`. The Phase 2 debug artifact is approximately:

- JavaScript: 394,428 bytes;
- Wasm: 9,478,472 bytes;
- Freedoom Phase 2 WAD: 28,787,748 bytes.

This establishes the input that P3 must package, not a final one-file artifact.

### 3. Browser boot — PASS from supplied evidence

The bundle records:

- Freedoom Phase 1 boot in Chromium;
- Freedoom Phase 2 boot in Chromium;
- Freedoom Phase 2 boot in Firefox.

The screenshots themselves are not present in the review ZIP, but the boot JSON contains distinct nonempty screenshot sizes and hashes, gameplay banner logs, empty page-error lists, and empty browser `requestfailed` lists.

### 4. Keyboard semantics — PASS_WITH_RECORDED_LIMITATION

The evidence supports:

- real Chromium and Firefox Doom-menu navigation;
- real canvas-targeted `ArrowUp` keydown and keyup;
- a browser heartbeat that continued after the held key;
- no page error during that diagnostic;
- trusted keyboard events reaching the canvas in the audio lane.

Direct gameplay movement remains unproven because the post-input Playwright screenshot timed out and the P2 interactive Oracle interface was unavailable. The P2-070 result records this honestly.

This does not block packaging, but P3 should add one simple observable movement or turn proof against the packaged one-file artifact.

### 5. Browser audio — PASS

The supplied Chromium and Firefox evidence shows:

- no Doom main invocation before Start;
- no pre-click AudioContext;
- zero pre-click callbacks;
- a normal trusted locator click reaching the visible Start button;
- `Module.callMain` invoked once;
- an engine-created AudioContext entering `running`;
- nonzero engine PCM callback evidence after Start;
- no page errors or failed requests in the audio evidence.

Recorded callback evidence:

- Chromium: 867 callbacks, 125 nonzero buffers, maximum absolute PCM `0.2509765625`;
- Firefox: 91 callbacks, 24 nonzero buffers, maximum absolute PCM `0.2509765625`.

The observer wraps the existing SDL2 WebAudio callback and does not create a shell oscillator or substitute sound source.

### 6. Native/Wasm parity — PASS from supplied hashes and state records

The comparison code performs direct equality without normalization.

The supplied evidence records:

- five native baseline runs;
- five Chromium baseline runs;
- three Firefox baseline runs;
- one native, Chromium, and Firefox DeHackEd effect run;
- state checkpoints at tics 0, 1, 35, 70, and 140;
- raw 320×200 indexed framebuffer checkpoints at tics 1, 35, 70, and 140.

The result JSON entries contain identical baseline state and frame hashes across native, Chromium, and Firefox. The DeHackEd run consistently changes `maxammo0` from 200 to 199 and changes the later frame hashes in all three lanes.

The raw frame files themselves are not included in this compact review ZIP, so their bytes could not be independently rehashed here. Their recorded hashes and the comparison logic are internally consistent.

### 7. Focused P2 gate — PASS, but narrower than its prose

The focused gate checks:

- branch and P1 ancestry;
- official upstream-only remote shape;
- P2 manifests;
- boot/input/audio evidence JSON;
- native/Wasm comparison result;
- task state;
- clean-worktree policy;
- P2-090 still pending.

The nine gate regression tests confirm rejection of missing manifests, failed browser/audio/parity evidence, external failed requests, dirty state, wrong identity, and premature P2-090 completion.

The gate does not itself prove every claim in the phase report. In particular, it does not independently verify:

- eleven exact P2 commit subjects;
- source-edit budgets;
- successful requests to an external origin;
- actual execution of all Playwright tests;
- raw frame bytes absent from the review bundle.

Those claims depend on the surrounding task evidence and builder report.

### 8. Global Python suite — RECORDED INFRASTRUCTURE DEBT

The exact diagnostic run records:

- 131 tests;
- 12 failures;
- 5 errors.

Most failures are consistent with infrastructure assumptions rather than observed Doom behavior:

- hard-coded `C:/tmp` paths inside WSL;
- duplicated `/mnt//mnt/c` path translation;
- P1 gate expecting the P1 branch;
- P1 fixture enumeration rejecting the new P2 SDL smoke fixture;
- stale native-manifest assumptions;
- outdated negative-fixture text expectations.

One failure is a stale P2 source-text assertion in `test_browser_input_contract`; it expects a literal expression that was refactored into an equivalent `query` variable. It should be repaired or removed before relying on the full suite again.

The full suite is not a PASS and must not be described as one.

## Recorded limitations and required P3 handling

### L1 — The review ZIP has duplicate names and does not preserve paths safely

The archive contains duplicate entry names, including:

- task cards and task results under the same `P02\DOOM-P2-*.md` names;
- both root and `src` CMake files as `CMakeLists.txt`;
- many repeated `result.json`, `state.jsonl`, `server.jsonl`, and command-log names.

It also stores Windows backslashes as literal ZIP-name characters. A normal extraction can overwrite or hide evidence.

P3 review packaging must preserve real repository-relative paths, reject duplicate archive names, and validate extraction on a non-Windows system.

### L2 — The compact review bundle omits visual and binary evidence

The bundle excludes:

- gameplay PNG screenshots;
- raw framebuffer files;
- Wasm and JavaScript artifacts;
- WADs;
- live Git metadata and commit log.

Excluding large WADs is appropriate, but a future review bundle should include screenshots, small state files, selected raw frames, request logs, and a commit/state report under unique paths.

### L3 — Direct gameplay movement remains unproven

Menu navigation and real key delivery pass. Direct movement or turning in gameplay does not yet have a completed visual or state proof.

P3 should prove one movement or turn operation after packaging. This should be a small product check, not a new testing framework.

### L4 — P2-088 manifests do not represent a fresh clean final-gate rebuild

The included P2-088 configure commands omit the full frozen flag vector, and the included build output says `ninja: no work to do.` The manifests therefore bind existing artifacts and real logs, but those particular commands are not a clean reproduction recipe by themselves.

Earlier P2 evidence records two clean reproducible builds and the complete build driver contains the required flags. Before P3 packages anything, it must run the existing full build command from empty ignored build directories and bind the exact resulting files.

### L5 — One local HTTP 404 and one known console diagnostic remain

The Firefox Oracle server log contains local `/favicon.ico` HTTP 404 responses. Playwright `requestfailed` does not classify ordinary HTTP 404 responses as transport failures.

The browser console also records the known nonfatal `emscripten_set_main_loop_timing` diagnostic.

Neither blocks P3 architecture, but the final single-file candidate should aim for:

- zero page errors;
- zero console errors;
- zero failed HTTP statuses;
- zero external requests.

### L6 — Historical identity wording remains

Some current documents still use `SELF` for P2-080/P2-085 or pre-commit wording. This does not change the runtime evidence, but P3 governance should resolve current identities without rewriting historical P2 result files.

## Independent gate answers

| Question | Answer |
|---|---|
| Pinned Emscripten toolchain? | PASS from lock/result evidence |
| Chocolate Doom source retained? | PASS from supplied delta and source review |
| Browser changes isolated? | PASS |
| Multi-file Wasm build exists? | PASS from manifests/results |
| Freedoom boots in Chromium and Firefox? | BUILDER-VERIFIED; screenshots omitted |
| Real menu keyboard input? | PASS |
| Direct gameplay movement? | NOT YET PROVEN |
| Real user-gesture engine audio? | PASS |
| Chromium exact state/frame parity? | BUILDER-VERIFIED and internally consistent |
| Firefox exact state/frame parity? | BUILDER-VERIFIED and internally consistent |
| PWAD-order parity? | EXCLUDED |
| External runtime origin? | None recorded |
| Zero HTTP errors? | NO; local favicon 404 appears in Firefox Oracle logs |
| Final clean rebuild at P2-088? | NO; existing build cache was reused |
| Ready to attempt P3 packaging? | YES |
| Ready for release? | NO |

## Current exact state

### Directly verified from the bundle

- Bundle SHA-256 and 170-entry inventory.
- P2 source/build adapter contents.
- P2 focused-gate implementation and regression tests.
- Internally consistent browser audio evidence.
- Internally consistent native/Chromium/Firefox state and frame-hash evidence.
- Full diagnostic-suite failure list.
- Review-bundle duplicate-name defect.
- No commercial WAD is present in the review bundle.

### Builder-reported, not independently recomputed from this ZIP

- Final commit `48b61cccea64ab2a4d29e3f293cbce142aee4de9`.
- Eleven exact P2 commits above P1.
- Live branch and clean worktree.
- Current remotes and absence of an open PR.
- Recomputed hashes of omitted Wasm, WAD, screenshot, and raw-frame files.
- Actual execution of the final focused gate after commit.

### Untested

- One-file HTML packaging.
- Offline `file://` behavior.
- local IWAD/PWAD/DEH import.
- persistence and save/config interchange.
- Android Chrome and touch controls.
- iOS Safari.
- commercial Doom data.
- broad mod compatibility.
- release readiness.

## Authorization boundary

This review authorizes a bounded local P3 phase that:

1. clean-rebuilds the accepted P2 multi-file artifacts;
2. packages those exact files into one HTML artifact;
3. preserves the engine and renderer unchanged;
4. proves offline startup, gameplay, trusted-start audio, and one simple gameplay movement/turn input;
5. verifies zero external requests and records any browser console limitation;
6. creates a path-safe, duplicate-free review bundle.

It does not authorize remote creation, push, pull request, merge, publication, deployment, or release.

## Next actionable step

Write a lean P3 continuous Luna phase focused on packaging the already-working P2 browser build into one HTML file, without expanding the compatibility or test matrix.
