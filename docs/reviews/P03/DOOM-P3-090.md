# DOOM-P3-090 — Independent Read-Only Review

## Overall goal

Deliver a vanilla-compatible Doom browser port whose canonical release can be distributed as one offline-capable HTML file.

## Current goal

Independently review the P3 single-file artifact and determine whether the project may begin the next bounded product phase.

## Verdict

**PASS_WITH_RECORDED_LIMITATIONS**

The P3 product is accepted as a real single-file packaging proof. The review found no engine, renderer, gameplay, or packaging architecture defect that requires redesign before the next phase.

This verdict authorizes local planning and implementation of the next bounded phase only. It does not authorize a remote, push, pull request, merge, publication, deployment, release, or commercial Doom-data use.

## Review input

- Bundle: `SFHS-DOOM-P3-REVIEW.zip`
- Bundle SHA-256: `bcb85152da6e77b1a373d0a531293c47d2327d84f930eb94255e88185a948854`
- Bundle size: `16,096,184` bytes
- ZIP entries: `55`
- Duplicate paths: `0`
- Unsafe/traversal paths: `0`
- Product: `dist/sfhs-doom-freedoom2.html`
- Product size: `48,225,654` bytes
- Product SHA-256: `6737dbfc8c7909ea18a820de3cd6677654fab95277caf05eb9d660cb9235490e`
- Builder-reported final branch: `phase/p03-single-file`
- Builder-reported final HEAD: `4fd982192b783bb55c48f6fe73e29e4515c09b2f`
- Pinned upstream: Chocolate Doom `chocolate-doom-3.1.1` at `410d96855b5df5410ff591a90efeafa889119224`

## What was independently verified

### 1. The product is one HTML file

The review ZIP contains exactly one product under `dist/`:

```text
dist/sfhs-doom-freedoom2.html
```

No sibling `.js`, `.wasm`, `.data`, WAD, worker, media, font, or stylesheet product file is present.

The HTML contains no external `<script src>`, stylesheet link, image source, or sibling Wasm/data reference.

### 2. The Wasm engine is genuinely embedded

The Emscripten loader contains the Wasm module as an inline binary string.

The embedded module was independently extracted from the HTML:

- extracted Wasm size: `38,278,805` bytes;
- magic/version: valid `\0asm` WebAssembly header;
- section walk: structurally complete to the exact end of the module;
- sections include a large data section containing the embedded game data.

This is stronger than merely finding the word `SINGLE_FILE` in the HTML.

### 3. The exact open Freedoom WAD is embedded

The embedded Wasm data was independently inspected for a structurally valid IWAD.

Extracted IWAD:

- signature: `IWAD`;
- lump count: `3,610`;
- size: `28,787,748` bytes;
- SHA-256: `a8772e088847032510d97ba2312406a6998f21cbab44d4ff10696faa9c0ecd4b`.

That hash exactly matches the P3 artifact manifest’s pinned Freedoom Phase 2 input.

No separate WAD is required by the final product.

### 4. Static single-file checks pass independently

The supplied static validator was rerun against the uploaded artifact and passed:

```text
SINGLE_FILE=PASS
```

Nine runnable focused contract/gate tests in the compact bundle also passed independently.

The three clean-input tests could not be rerun from the compact review ZIP because it intentionally excludes the ignored P3 input build directories.

### 5. Chromium runtime evidence is internally consistent

The supplied Chromium evidence records:

- no main invocation before Start;
- trusted pointerdown, pointerup, and click on `#start-doom`;
- one `Module.callMain` invocation;
- engine AudioContext `running`;
- `84` audio callbacks;
- `33` nonzero engine PCM callbacks;
- real trusted Escape, ArrowDown, ArrowUp, and Enter events targeted at the canvas;
- heartbeat advancement;
- empty page-error list;
- empty external-request list.

### 6. Movement proof is meaningful

The two fresh Chromium Oracle sessions compare the same checkpoint:

- tic: `35`;
- episode: `1`;
- map: `1`;
- skill: `2`.

Control:

```text
x = -12582912
y = -12582912
angle = 0
```

ArrowUp session:

```text
x = -580799
y = -11767237
angle = 46137344
```

The browser evidence records real trusted ArrowUp keydown and keyup events. The changed position and angle at the matching checkpoint provide a direct gameplay-input proof without engine-state injection.

### 7. Review ZIP path safety is repaired

Unlike the P2 review bundle, this archive:

- uses POSIX repository-relative paths;
- has no duplicate names;
- has no traversal paths;
- includes the final HTML artifact;
- excludes separate WAD, Wasm, and data files.

## Recorded limitations and inconsistencies

### L1 — The bundle is a pre-commit P3-040 candidate snapshot

`audit.txt` records:

```text
head=658d54731af873a0312ef86d7a0132621d29457a
status=<P3-040 candidate changes>
```

`commit-log.txt` contains P3-000 through P3-030 only. It does not contain the builder-reported final P3-040 commit `4fd982192b783bb55c48f6fe73e29e4515c09b2f`.

Therefore the uploaded bundle cannot independently prove:

- the final HEAD;
- five committed P3 tasks;
- final clean worktree;
- final post-commit remotes or PR state.

Those remain builder-reported.

This is an evidence-packaging issue, not a product-runtime failure. Future review bundles should be generated outside the repository after the final commit, or include a separately generated post-commit state report.

### L2 — The artifact manifest’s commit/dirty identity is inaccurate

The product manifest records:

```text
source.commit = 465384fbc9ab9f4d75b9151a74b6607327ae2103
source.dirty = false
```

However `465384...` is the P3-010 commit. The P3-020 packaging scripts, shell, and CMake changes used to create the artifact were not yet represented by that commit when the build occurred.

The manifest does bind the actual packaging inputs by individual SHA-256 values, and those files are present in the later P3 history, so the artifact remains technically identifiable. But the commit/dirty fields must not be treated as a truthful complete source identity.

Before any release, the build identity contract needs a candidate-tree hash or a post-source-commit build flow.

### L3 — The manifest command summary is not the exact configure command

The manifest’s displayed CMake `argv` lists Emscripten linker settings as direct CMake arguments. The actual build script passes them inside `CMAKE_EXE_LINKER_FLAGS`.

The included build script is sufficient to understand the real command, but the manifest should record the exact captured `configure.argv.txt` rather than a reconstructed summary.

The referenced P3-020 configure/build/package logs are not included in this compact review ZIP.

### L4 — Firefox audio documentation conflicts with the final JSON evidence

The P3 phase/runtime reports describe Firefox’s AudioContext as remaining `suspended`.

The included final `firefox-product.json` instead records:

```text
audioContextState = running
audioContext = running
audioCallbacks = 13
mainStarted = true
mainInvocations = 1
```

The Playwright test also requires a running context before continuing.

This suggests the bounded Firefox activation repair ultimately worked, while the prose report was not updated. The evidence is stronger than the stated limitation, but the contradiction must be reconciled before release claims.

### L5 — The prose movement coordinates are stale

`P03_OFFLINE_RUNTIME.md` lists a different control/movement coordinate pair from the final JSON files. Both pairs show movement, but the phase report should quote the exact committed evidence used by the final gate.

### L6 — Visual evidence is omitted

The repository change report says Chromium and Firefox screenshots were created, but the review ZIP does not include them.

The product HTML and runtime JSON were reviewed, but the gameplay screenshots could not be visually inspected from this bundle.

### L7 — Direct `file://` execution was not independently rerun in this environment

The review environment’s Chromium policy blocks local `file://` and loopback browser navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`. The uploaded direct-file runtime evidence could therefore be audited but not independently replayed here.

This limitation belongs to the review environment, not the artifact.

### L8 — One nonfatal Emscripten console diagnostic remains

Both browser evidence files record:

```text
emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a main loop does not exist!
```

No page error, abort, external request, or observed gameplay failure accompanies it. It remains a known runtime diagnostic to address before a polished release.

### L9 — The focused P3 gate is intentionally narrow

The P3 gate checks the single-file artifact, browser evidence, movement proof, branch/remotes/task state, and review archive. Its own regression test file contains only one direct archive-negative test.

That is consistent with the user-authorized lean phase, but it is not a complete release-quality regression suite.

## Independent gate answers

| Review question | Answer |
|---|---|
| Exactly one HTML product? | PASS |
| Embedded Wasm independently confirmed? | PASS |
| Embedded pinned Freedoom WAD independently confirmed? | PASS |
| Required sibling runtime file? | None found |
| Chromium trusted Start/audio/input evidence? | PASS from supplied evidence |
| Real movement proof? | PASS from matching Oracle checkpoints |
| HTTP/HTTPS request evidence? | None recorded |
| Page errors? | None recorded |
| Firefox startup/input? | PASS from supplied evidence |
| Firefox audio? | Final JSON says running; prose is stale |
| Gameplay/renderer/C-source packaging change? | None found in reviewed P3 delta |
| Review ZIP safe and duplicate-free? | PASS |
| Final P3 commit/worktree independently verified? | NO — bundle predates final commit |
| Artifact manifest commit identity exact? | NO — input hashes are stronger than its commit field |
| Ready for next bounded phase? | YES |
| Ready for public release? | NO |

## Current exact state

### Independently verified

- Review ZIP identity, size, entry count, uniqueness, and path safety.
- Final HTML identity, size, and SHA-256.
- One-file product boundary.
- Embedded structurally valid WebAssembly module.
- Embedded Freedoom Phase 2 WAD identity and SHA-256.
- Static packaging validator.
- Nine runnable focused tests.
- Internal consistency of Chromium audio/input and Oracle movement JSON.
- No commercial WAD included separately in the review ZIP.

### Builder-reported

- Final HEAD `4fd982192b783bb55c48f6fe73e29e4515c09b2f`.
- Five final P3 commits.
- Final clean worktree.
- Official upstream-only live remote state.
- Final post-commit focused gate execution.
- Direct `file://` runtime execution and screenshots.

### Untested or deferred

- Local user-selected IWAD/PWAD/DEH loading.
- Save/config persistence and interchange.
- Android Chrome and touch controls.
- iOS Safari.
- Broad mod and commercial Doom compatibility.
- Full release compliance and source bundle.
- Multiplayer.

## Authorization boundary

This review authorizes planning and local implementation of the next bounded product phase.

It does not authorize:

- creating an origin;
- pushing;
- opening or merging a pull request;
- publishing or deploying the HTML;
- issuing a release;
- using or distributing commercial Doom data.

Before release, the P3 manifest identity and stale Firefox/movement reports must be repaired in a separate bounded evidence/build-identity task.

## Next actionable step

Write a lean P4 continuous Luna phase focused on local user-provided IWAD/PWAD/DeHackEd/demo loading and launch arguments, while preserving the accepted one-file packaging and deferring the recorded P3 evidence-identity repair from product scope.
