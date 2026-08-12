# SFHS Doom — Complete Vanilla-Compatible Single-File HTML Project Specification

> **Current implementation note (2026-08-06):** This is the long-horizon planning specification. Its historical bootstrap and future-phase passages do not override the verified P6 candidate records. For current product authority, acceptance, publication status, and next work, use `docs/SOURCE_AUTHORITY.md`, `docs/PROJECT-STATUS.md`, and `docs/ROADMAP.md`.

**Document status:** Accepted authoritative project specification v1.0  
**Date:** 2026-08-02  
**Decision freeze:** ADR-011 through ADR-014 accepted by the user on 2026-08-02  
**Working project name:** `sfhs-doom`  
**Product boundary:** Complete single-player vanilla-compatible Doom source port for a strict single-file HTML release  
**Primary planning model:** GPT-5.6 Sol, High reasoning, in the ChatGPT app  
**Primary implementation model:** GPT-5.6 Luna in Codex  
**Multiplayer:** Explicitly deferred to a future project phase

---

# Overall goal

Create a complete, legally distributable, vanilla-compatible Doom engine whose canonical release is one offline-capable `index.html` file.

The engine must preserve the behavior and compatibility goals of Chocolate Doom rather than merely resemble Doom. It must load legally owned Doom IWADs, ordered PWADs, DeHackEd patches, demos, configurations, and savegames; run all single-player campaign systems; provide desktop and Android controls; produce audio; work without runtime network access; and include complete source, licensing, reproducible build instructions, tests, evidence, and hashes.

# Current goal

Establish the complete project contract and a low-cost execution workflow in which:

1. ChatGPT Sol High designs and reviews long-horizon phases.
2. Luna executes small, bounded repository tasks in Codex.
3. The repository carries almost all context, so handoffs are normally one sentence plus a task ID.
4. Deterministic tests and a native Chocolate Doom oracle replace repeated expensive model review.

# Plain-language summary

We are not asking Luna to “make Doom” in one giant run. Sol designs the road and freezes one phase at a time. Luna receives one small card, changes one bounded part, runs exact tests, commits it, and records evidence. At the end of a phase, Sol reviews one result file and the phase branch instead of reading dozens of chat transcripts.

The engine itself will not be rewritten as a JavaScript raycaster. A historically accurate Doom port will be compiled to WebAssembly and wrapped in an SFHS browser shell. The source remains readable and split into files; only the release is collapsed into one HTML file.

---

# 1. Decision register

| ID | Decision | Status | Reason |
|---|---|---|---|
| ADR-001 | Use Chocolate Doom as the production engine core. | Accepted | Its explicit purpose is accurate DOS Doom behavior, including bugs, demos, configuration files, savegames, and retro input/display feel. |
| ADR-002 | Compile the C engine to WebAssembly with a pinned Emscripten SDK. | Accepted | This preserves mature engine behavior while allowing a browser release. |
| ADR-003 | Ship a strict one-file `index.html`, but develop from a normal source tree. | Accepted | Single-file output is a packaging target, not a source-authoring constraint. |
| ADR-004 | Produce an engine-only build plus separate Freedoom Phase 1 and Phase 2 builds. | Accepted | Users can load legally owned Doom data, while Freedoom provides complete freely redistributable playable editions. |
| ADR-005 | Preserve vanilla limits and intentional bugs by default. | Accepted | “Complete” means vanilla compatibility, not modernization. |
| ADR-006 | Defer multiplayer. | Accepted by user | Multiplayer transport would be a distinct browser-networking project and is not required for the first complete release. |
| ADR-007 | Use native Chocolate Doom at the same source commit as the behavioral oracle. | Accepted | Demo synchronization, save/config interchange, and internal hashes provide stronger proof than screenshots alone. |
| ADR-008 | Use ChatGPT Sol High for architecture, phase plans, blockers, and phase gates. | Accepted for this workflow | Sol is reserved for ambiguous and long-horizon reasoning. |
| ADR-009 | Use Luna for small, explicit implementation tasks in Codex. | Accepted for this workflow | Luna is suited to clear, repeatable work and is now substantially cheaper. |
| ADR-010 | Permit only one active source-modifying Luna worker per phase branch. | Proposed default | Serial execution minimizes merge conflicts and context handoffs. Read-only checking may run separately. |
| ADR-011 | Make Android Chrome on the user’s Samsung phone a release target. | Accepted by user — 2026-08-02 | SFHS is mobile-oriented and physical Android verification is a release requirement. |
| ADR-012 | Make landscape the primary mobile gameplay orientation; keep the launcher usable in portrait. | Accepted by user — 2026-08-02 | Doom’s corrected display is naturally 4:3 and touch FPS controls need horizontal room. Orientation lock remains optional, not required. |
| ADR-013 | Require desktop Chromium and Firefox; treat iOS Safari as best-effort, not a release gate. | Accepted by user — 2026-08-02 | This keeps the first complete release testable and low-cost while covering two browser engines and the user’s real phone. |
| ADR-014 | Do not require an offline AI model for the critical path. | Accepted by user — 2026-08-02 | Luna is the default implementation worker. Task cards remain model-neutral so a proven local model can later substitute for qualified low-risk tasks. |
| ADR-015 | Make the Android product portrait-first with a simultaneous minimap, adjustable touch controls, and read-only mobile HUD; retain landscape as a functional fallback. | Accepted by user — 2026-08-05 | This supersedes ADR-012's landscape-first presentation decision only. |

ADR-011, ADR-013, and ADR-014 remain frozen. ADR-015 supersedes ADR-012 only for Android presentation. ADR-010 remains a reversible serial-execution default rather than an irreversible product constraint.

---

# 2. Product definition

## 2.1 Product identity

`SFHS Doom` is a browser packaging and platform port of Chocolate Doom focused on strict single-file distribution.

It is not a new Doom-like game, a high-resolution source port, a custom raycaster, a Doom engine reimplementation in JavaScript, or a GZDoom replacement.

## 2.2 Required release editions

### A. Engine-only edition

Canonical filename:

```text
sfhs-doom-engine.html
```

The file contains the full engine and launcher but no commercial game data. The user selects:

- one supported IWAD;
- zero or more ordered PWADs;
- zero or more DeHackEd patches;
- optional demo input;
- supported launch options.

### B. Freedoom Phase 1 edition

Canonical filename:

```text
sfhs-freedoom-phase1.html
```

The file embeds the pinned Freedoom Phase 1 IWAD and launches without external files.

### C. Freedoom Phase 2 edition

Canonical filename:

```text
sfhs-freedoom-phase2.html
```

The file embeds the pinned Freedoom Phase 2 IWAD and launches without external files.

## 2.3 Required source and evidence deliverables

```text
source repository
source release archive
pinned upstream record
pinned toolchain record
license and notice bundle
build instructions
compatibility report
test report
mobile verification report
artifact manifest
SHA-256 checksums
three canonical HTML artifacts
```

## 2.4 User experience

A user should be able to download one HTML file, open it, press Start, and play the bundled Freedoom edition without a server or internet connection.

For the engine-only edition, the user should be able to open the file, select local WAD/DEH/demo files, review the final launch configuration, press Start, and play without those files being uploaded anywhere.

## 2.5 Definition of “complete”

The first release is complete only when all applicable items below are operational and verified:

- vanilla Doom gameplay simulation;
- software-rendered walls, flats, skies, sprites, masked textures, palette effects, and screen wipes;
- all standard weapons, ammo, inventory, actors, projectiles, hitscan, damage, armor, pickups, keys, and powerups;
- monster states, infighting, line-of-sight, pathing, attacks, deaths, and boss behavior;
- collision, doors, lifts, stairs, crushers, teleporters, exits, damaging floors, light changes, scrolling, and supported linedef/sector specials;
- menus, options, pause, messages, status bar, intermissions, finales, cast sequence, automap, and cheats;
- supported IWAD detection and game-mode selection;
- `-file`, `-merge`, `-deh`, demo playback, demo recording, strict demo behavior, timedemo behavior, warp, skill, fast, respawn, nomonsters, and other supported non-network launch options;
- DOS-compatible demo, configuration, and savegame behavior within Chocolate Doom’s stated compatibility target;
- sound effects and music without required external runtime assets;
- desktop keyboard/mouse controls;
- Android multi-touch controls;
- save/load persistence when hosted;
- explicit save/config export and import fallback for local-file use;
- no required runtime network requests;
- reproducible one-file packaging;
- complete licensing and corresponding source availability.

## 2.6 Explicit non-goals

The following are outside the first complete release:

- multiplayer, co-op, deathmatch, matchmaking, signaling, WebSockets, or WebRTC;
- Boom, MBF, MBF21, ZDoom, GZDoom, ACS, DECORATE, ZScript, UDMF, or limit-removing compatibility;
- high-resolution internal rendering;
- freelook, jumping, crouching, dynamic lights, shaders, models, voxels, texture filtering, or uncapped modern gameplay;
- Heretic, Hexen, Strife, Chex Quest, or other Chocolate Doom game families;
- a WAD editor, map editor, launcher backend, account system, cloud save, telemetry, advertising, or analytics;
- installable PWA packaging in the strict one-file target;
- bundling original commercial Doom IWADs;
- rewriting Doom around the project’s existing DDA raycaster;
- AI inference inside the released game.

---

# 3. Research basis and architecture rationale

## 3.1 Why Chocolate Doom

Chocolate Doom explicitly aims to reproduce the original DOS versions, including intentional bugs, compatible demo/config/save files, and the original feel. That is nearly identical to this project’s acceptance contract.

The port must therefore preserve Chocolate Doom’s simulation and renderer as the authority. Browser changes should be confined to platform adaptation, packaging, file access, input translation, audio output, persistence, and presentation scaling.

## 3.2 Why Emscripten/WebAssembly

Emscripten compiles C/C++ to WebAssembly and provides browser support for SDL-class applications. Its single-file setting can inline the WebAssembly payload, and its file-packaging system can embed Freedoom data into the generated virtual filesystem.

The exact flags are not declared proven until Phase 2 and Phase 3 run them against the pinned toolchain. The architectural requirement is stable even if the precise flags change:

```text
one HTML file
+ embedded Wasm
+ embedded shell CSS/JS
+ optionally embedded IWAD
+ no runtime fetches
```

## 3.3 Why not a custom JavaScript raycaster

Doom does not use the same orthogonal-grid DDA architecture as the project’s custom SFHS raycaster. Doom depends on arbitrary linedefs, sectors, BSP traversal, subsectors, wall segments, visplanes, masked columns, and a 35 Hz deterministic game simulation.

The uploaded raycasting and SFHS manuals remain valuable for:

- mobile viewport handling;
- Pointer Events and multi-touch discipline;
- audio unlock behavior;
- local-file storage fallback;
- debug overlays;
- screenshot and no-network testing;
- AI-safe module boundaries;
- split-source-to-single-file packaging;
- evidence format.

They are not the renderer implementation plan for this project.

## 3.4 Reference-only ports

`doomgeneric` is useful as a minimal example of isolating platform callbacks and as evidence that an Emscripten path is possible. It is not the production compatibility base.

Existing browser ports of Chocolate Doom are useful implementation references, but the project must independently pin, inspect, license, build, and verify its own source rather than importing an opaque prebuilt artifact.

## 3.5 Strict one-file does not mean monolithic source

The readable source is authoritative. The single-file HTML is generated.

Agents must never edit the canonical release file as the normal development path. This follows the established SFHS guidance: named modules, explicit ownership, versioned persistence, deterministic tests, and a final bundling step are safer than editing a packed monolith.

---

# 4. Compatibility contract

## 4.1 Supported engine lineage

The compatibility authority is the selected Chocolate Doom commit and its documented Doom compatibility behavior.

The intended commercial-data matrix is:

| Data family | Required behavior | Data handling |
|---|---|---|
| Doom shareware | Detect and run | User-supplied unless a separate legal review authorizes a fixture |
| Registered Doom | Detect and run | User-supplied only |
| The Ultimate Doom | Detect and run | User-supplied only |
| Doom II | Detect and run | User-supplied only |
| Final Doom: TNT | Detect and run | User-supplied only |
| Final Doom: Plutonia | Detect and run | User-supplied only |
| Freedoom Phase 1 | Detect, embed, and run | Pinned freely redistributable fixture |
| Freedoom Phase 2 | Detect, embed, and run | Pinned freely redistributable fixture |

A complete commercial matrix requires access to legally obtained IWADs for local verification. Their hashes and test results may be recorded; their bytes must not enter the repository, reports, screenshots that expose proprietary lumps, or release bundles.

## 4.2 PWAD behavior

The launcher must preserve ordering. Reordering loaded WADs can change lump override behavior and is therefore a correctness issue.

Required operations:

- add one or more PWADs;
- reorder them explicitly;
- remove an entry;
- show filename, byte size, and local hash;
- pass the order to the engine unchanged;
- support `-file` behavior;
- support in-memory `-merge` behavior for compatible total conversions;
- preserve selected files only in memory unless the user explicitly chooses a browser-persistence feature later.

## 4.3 DeHackEd behavior

Required operations:

- select one or more `.deh` or supported patch files;
- preserve order;
- pass them through Chocolate Doom’s existing DeHackEd path;
- report parse or compatibility errors without crashing the launcher;
- test at least one open fixture that alters visible gameplay state.

## 4.4 Demo behavior

Required operations:

- import and play `.lmp` files;
- record demos;
- download recorded demos from the browser;
- run strict demo mode where supported;
- run timedemo mode;
- detect and report desynchronization or abnormal termination;
- compare native and Wasm execution using the same engine commit, data hashes, config, and arguments.

## 4.5 Save and configuration behavior

The browser build must preserve upstream file formats rather than inventing replacement gameplay saves.

Required directions:

```text
native Chocolate Doom save -> browser load
browser save -> native Chocolate Doom load
native default.cfg -> browser load
browser default.cfg -> native Chocolate Doom load
```

Extra browser metadata lives outside the vanilla files.

## 4.6 Vanilla limits and bugs

Default behavior must not silently lift limits, fix known vanilla quirks, alter RNG, change actor order, replace timing, change collision, or modernize gameplay.

Any browser-only convenience must remain outside simulation semantics. Examples:

- scaling the final framebuffer is allowed;
- adding a touch button that emits an existing key/action is allowed;
- changing weapon spread to improve touch controls is forbidden;
- pausing when the page is hidden is allowed for ordinary play;
- advancing hidden-tab gameplay with a large catch-up delta is forbidden;
- replacing vanilla save files with a custom save model is forbidden.

## 4.7 Display contract

- Preserve the engine’s original logical software framebuffer.
- Preserve indexed palette behavior and palette flashes.
- Default to nearest-neighbor presentation.
- Default to corrected 4:3 presentation of the 320×200 logical image.
- Letterbox or pillarbox rather than crop gameplay.
- UI overlays may occupy browser space outside the corrected gameplay area.
- Browser scaling may not change the internal simulation or framebuffer hash.

---

# 5. Technical architecture

## 5.1 Repository strategy

Create a fork of the selected Chocolate Doom repository rather than hiding it behind a binary dependency or submodule.

The fork records:

```text
upstream remote
upstream base commit
SFHS patch series
pinned Emscripten SDK
pinned Freedoom release and hashes
pinned browser-test dependencies
```

All SFHS-specific changes should be recognizable and documented in `docs/UPSTREAM_DELTA.md`.

## 5.2 Proposed repository layout

```text
sfhs-doom/
├── AGENTS.md
├── README.md
├── LICENSES/
│   ├── chocolate-doom-gpl.txt
│   ├── freedoom-license.txt
│   ├── emscripten-notices.txt
│   └── THIRD_PARTY_NOTICES.md
├── .agent/
│   └── PLANS.md
├── cmake/
├── data/
├── opl/
├── pcsound/
├── src/
│   ├── doom/
│   ├── i_*.c
│   └── sfhs/
│       ├── sfhs_bridge.c
│       ├── sfhs_bridge.h
│       ├── sfhs_files.c
│       ├── sfhs_input.c
│       ├── sfhs_test_hooks.c
│       └── sfhs_test_hooks.h
├── web/
│   ├── shell.html
│   ├── shell.css
│   ├── launcher.js
│   ├── runtime-bridge.js
│   ├── touch-controls.js
│   ├── persistence.js
│   ├── test-hooks.js
│   └── licenses-ui.js
├── tools/
│   ├── bootstrap-toolchain.sh
│   ├── toolchain-doctor.sh
│   ├── build-native.sh
│   ├── build-wasm-debug.sh
│   ├── build-single-file.sh
│   ├── fetch-freedoom.sh
│   ├── artifact-manifest.py
│   ├── taskctl.py
│   └── compare-oracle.py
├── tests/
│   ├── fixtures/
│   │   ├── open-demos/
│   │   ├── open-pwads/
│   │   └── open-deh/
│   ├── native/
│   ├── wasm/
│   ├── browser/
│   ├── compatibility/
│   └── mobile/
├── docs/
│   ├── PROJECT_SPEC.md
│   ├── CURRENT_STATE.md
│   ├── DECISIONS.md
│   ├── UPSTREAM_DELTA.md
│   ├── COMPATIBILITY_MATRIX.md
│   ├── ISSUE_LOG.md
│   ├── phases/
│   │   └── P00 ... P10/
│   ├── tasks/
│   │   └── P00 ... P10/
│   ├── results/
│   └── evidence/
├── build/
│   ├── native/              # ignored
│   └── wasm/                # ignored
├── vendor-cache/            # ignored
└── dist/
    ├── sfhs-doom-engine.html
    ├── sfhs-freedoom-phase1.html
    ├── sfhs-freedoom-phase2.html
    ├── SHA256SUMS
    └── release-manifest.json
```

Generated output is never the editable authority.

## 5.3 Upstream boundary

The project should minimize changes to gameplay and rendering source.

Preferred change order:

1. Build-system additions.
2. Platform abstraction implementation.
3. Browser bridge.
4. Test-only instrumentation behind a compile flag.
5. Only then, narrowly justified upstream-source patches.

Every gameplay-adjacent patch must include:

- exact need;
- native behavior before and after;
- Wasm behavior before and after;
- demo or state-hash evidence;
- explanation of why the patch does not change vanilla semantics.

## 5.4 Native oracle build

The native build and Wasm build must use the same source commit and compile-time compatibility configuration.

The native oracle produces:

- upstream test results;
- demo run status;
- timedemo output;
- stable simulation hash at selected tics;
- internal framebuffer hash at selected tics;
- save/config fixture outputs.

Address-dependent memory must never be included in a deterministic hash.

## 5.5 WebAssembly build

Preferred first attempt:

```text
upstream CMake
-> emcmake/emmake or equivalent pinned Emscripten flow
-> SDL2 browser port
-> debug multi-file build
-> strict single-file build
```

If upstream CMake cannot produce a maintainable build, Phase 2 may adopt the upstream autotools flow. The change must be recorded as an ADR, not improvised inside a worker task.

Initial constraints:

- single-threaded;
- no pthread requirement;
- no COOP/COEP headers;
- no service worker;
- no remote CDN;
- no runtime fetch;
- no custom worker architecture unless performance evidence later requires it.

## 5.6 Controlled boot

The engine must not enter `main()` before the launcher has completed data setup.

Boot sequence:

```text
HTML and launcher initialize
-> user gesture unlocks audio
-> bundled IWAD is mounted OR local files are selected
-> launcher validates file set and arguments
-> files are written into the Emscripten virtual filesystem
-> persistence mount is prepared where available
-> final argv is shown/recorded
-> engine main is invoked
-> browser shell switches to gameplay mode
```

The exact Emscripten mechanism may use controlled invocation, modularized output, or an equivalent pinned method. The invariant is more important than a guessed flag.

## 5.7 Browser file model

### Runtime data

- Bundled Freedoom data is embedded at build time.
- User-selected IWAD/PWAD/DEH/demo files enter through the File API.
- Files remain local to the browser process.
- No upload endpoint exists.

### Persistent engine files

A dedicated virtual directory stores:

```text
default.cfg
chocolate-doom.cfg
savegames
demo recordings
browser metadata
```

When hosted on an origin with usable IndexedDB, the directory is synchronized through an Emscripten-compatible persistent filesystem.

When opened through `file://`, persistence is best-effort. The required fallback is explicit export/import.

### Portable profile format

Use a transparent, versioned JSON container rather than inventing another compressed binary dependency:

```json
{
  "format": "sfhs-doom-profile",
  "version": 1,
  "engineCommit": "...",
  "createdAt": "...",
  "files": [
    {
      "path": "default.cfg",
      "sha256": "...",
      "base64": "..."
    }
  ]
}
```

The profile must not include IWAD/PWAD data unless a future explicitly authorized feature is added.

## 5.8 Video path

The engine renders through its existing software path. Browser presentation may use the SDL/Emscripten canvas backend, but the authoritative image for parity tests is the engine’s logical framebuffer before browser scaling.

Required browser behaviors:

- correct 4:3 presentation;
- nearest-neighbor scaling;
- resize without state reset;
- fullscreen as a user-gesture enhancement;
- pseudo-fullscreen fallback;
- safe-area-aware overlay layout;
- no viewport jump that changes input mapping;
- debug display of CSS size, backing size, DPR, logical size, and active scaling rectangle.

## 5.9 Timing and lifecycle

- Preserve Doom’s 35 Hz game-tic model.
- Do not replace simulation with arbitrary browser delta time.
- Use the browser main-loop integration required by Emscripten without changing game semantics.
- On `visibilitychange` to hidden, ordinary play pauses or suspends safely.
- On resume, the engine must not process one giant accumulated delta.
- Timedemo and deterministic test modes run only while the page is foregrounded.

## 5.10 Input architecture

Raw browser input must be translated into the engine’s existing event/input model.

### Desktop required

- keyboard;
- relative mouse look through pointer lock;
- mouse buttons;
- pointer-lock release and reacquisition;
- browser-shortcut conflict handling;
- remappable bindings through the existing config path where practical.

### Android required under the proposed mobile assumption

- left movement pad;
- right drag-to-turn region;
- fire button;
- use button;
- run button or latch;
- previous/next weapon controls;
- automap;
- pause/menu;
- multi-touch pointer ownership;
- `pointercancel` cleanup;
- safe-area clearance;
- no browser scroll/zoom theft on the gameplay surface.

Touch control code emits existing Doom actions. It must not alter weapon behavior, aim, speed, damage, RNG, or collision.

### Not initially required

- gamepad;
- gyroscope aim;
- haptics;
- accessibility aim assist.

These may be future additive tasks only after the complete release.

## 5.11 Audio architecture

The release must not require a downloaded soundfont, external MIDI service, media server, or CDN.

Preferred path:

- existing Doom SFX through the SDL/browser audio backend;
- Chocolate Doom’s software OPL emulation for music;
- one browser audio-unlock gate attached directly to Start;
- master, music, and SFX volume controls wired to durable config;
- safe suspend/resume behavior.

If the preferred backend fails, Phase 7 must diagnose and choose a source-compatible browser audio adapter. Shipping silent is not an acceptable “fallback” for a complete release.

## 5.12 Launcher architecture

The launcher is an SFHS browser shell, not a replacement game menu.

Required panels:

1. Edition and data selection.
2. Ordered PWAD list.
3. Ordered DeHackEd list.
4. Demo input/recording options.
5. Common launch options.
6. Advanced supported-arguments field.
7. Final argv preview.
8. Persistence import/export.
9. Controls and mobile-layout help.
10. Licenses, version, source commit, and artifact hash.
11. Error details and recovery.

The launcher disappears or collapses after the engine begins, but remains reachable through an explicit quit/restart path.

## 5.13 No-network invariant

After the HTML file is available locally or served, the game must not require any external request.

Browser tests must fail on requests outside the current origin, `data:`, and `blob:` where those schemes are intentionally used.

The release contains no:

- analytics;
- update checker;
- remote font;
- remote soundfont;
- remote WAD;
- CDN library;
- external image;
- telemetry beacon.

## 5.14 Build variants

```text
native-debug
native-release
wasm-debug-multifile
wasm-release-engine-singlefile
wasm-release-freedoom1-singlefile
wasm-release-freedoom2-singlefile
```

The multi-file Wasm build exists for debugging only. It is not a shipping substitute.

## 5.15 Build metadata

Every HTML artifact must expose, both in a visible About panel and machine-readable test hook:

```text
project version
source commit
upstream base commit
Emscripten version
Freedoom version/hash where bundled
build ID
build timestamp or reproducible epoch
artifact byte size
artifact SHA-256
```

## 5.16 Reproducibility

The project should aim for byte-identical output from a clean clone using the pinned toolchain.

Required measures:

- fixed toolchain versions;
- fixed dependency hashes;
- stable file ordering;
- no random build IDs;
- controlled timestamps through `SOURCE_DATE_EPOCH` or equivalent;
- clean-clone rebuild test;
- comparison of generated hashes.

A failure to achieve byte identity must be reported precisely. It cannot be silently relabeled “reproducible” merely because both artifacts boot.

---

# 6. Browser UI and interaction specification

## 6.1 Initial screen

The first screen must show:

- product title and edition;
- Start or Choose Game Data action;
- concise local-file privacy statement;
- sound-unlock explanation;
- controls link;
- license/source link inside the file;
- build identity.

## 6.2 Engine-only flow

```text
Open HTML
-> Select IWAD
-> Optional PWAD/DEH/demo selection
-> Review detected game and ordered files
-> Choose common options
-> Review final argv
-> Start
```

Errors must identify the exact file and reason. “Failed to load” alone is insufficient.

## 6.3 Bundled Freedoom flow

```text
Open HTML
-> Start Freedoom
-> Optional advanced launcher
-> Play
```

The first path should remain one tap/click after the page is ready.

## 6.4 Gameplay layout

Desktop:

- centered corrected gameplay rectangle;
- black letterbox/pillarbox area;
- pointer lock on click or explicit capture button;
- small optional overlay for fullscreen, pause, and help.

Android landscape:

- gameplay area maximized without cropping;
- controls over or beside non-critical screen regions;
- safe-area padding;
- opacity setting;
- left-handed layout option;
- rotate prompt rather than hard orientation dependency.

## 6.5 Error recovery

Recoverable errors return to the launcher without requiring a page reload where possible.

Required examples:

- missing IWAD;
- unsupported file type;
- corrupt WAD header;
- failed DEH parse;
- failed persistent filesystem sync;
- audio initialization failure;
- engine abort with captured message;
- insufficient memory;
- incompatible imported profile version.

## 6.6 Accessibility and usability

- DOM buttons must be focusable and labeled.
- The launcher must work with keyboard alone.
- Controls must have visible focus states.
- Touch targets must be large and separated.
- Reduced-overlay-opacity and reduced-screen-flash settings should be considered, but may not alter internal palette behavior used for compatibility tests.
- Browser zoom remains available on text-heavy launcher/help screens; gesture suppression is limited to the active gameplay surface.

---

# 7. Licensing, content, and source obligations

## 7.1 Engine license

Chocolate Doom is GPL-licensed. The project must distribute the corresponding modified source, build scripts, and notices in a form that permits rebuilding the released binary/Wasm.

To reduce license ambiguity, new engine bridge and launcher code should use a GPL-compatible license, preferably the same GPL version policy as the selected upstream source unless a legal review chooses otherwise.

## 7.2 Game data

Original Doom commercial IWADs are not included.

The engine-only artifact asks the user to supply files they are legally entitled to use.

## 7.3 Freedoom

Freedoom is content, not the engine. Its pinned license and notices must remain distinct in the release and source tree.

The build script may download a pinned official release during the build, verify its cryptographic hash, and embed it. Runtime download is forbidden.

## 7.4 Trademark clarity

Release documentation must state that the project is an independent source-port packaging project and is not affiliated with or endorsed by the current Doom rights holder.

## 7.5 Source availability

Each public binary release must be paired with one of:

- a source tag in the public repository plus exact rebuild instructions; and
- a downloadable corresponding-source archive.

The release manifest binds each HTML artifact to the source commit and toolchain lock.

---

# 8. Verification strategy

## 8.1 Verification hierarchy

From strongest to weakest:

1. Native/Wasm deterministic equivalence.
2. Demo synchronization and completion.
3. Cross-loadable saves/configurations.
4. Internal framebuffer hash at fixed tics.
5. Automated browser behavior and no-network tests.
6. Browser screenshots.
7. Human visual and control review.

A nonblank canvas is not proof of compatibility.

## 8.2 Native oracle fixtures

Open fixtures stored in the repository may include:

- Freedoom Phase 1 and Phase 2 hashes, fetched at build/test time;
- project-recorded Freedoom demos;
- small openly licensed PWADs created for tests;
- openly licensed DeHackEd fixtures;
- deterministic config files;
- expected state and framebuffer hashes.

Commercial test fixtures remain local and hash-referenced only.

## 8.3 Test-only instrumentation

Under a compile-time test flag, expose stable values such as:

```text
gametic
leveltime
game episode/map/skill
player position/angle/health/armor/ammo
RNG indices or stable RNG state
active thinker count by stable category
selected world-state checksum
logical framebuffer checksum
save/config file hashes
```

Do not hash pointer addresses, allocator layout, timestamps, browser event IDs, or other platform-dependent values.

Release builds must not expose dangerous mutation hooks.

## 8.4 Browser test façade

A debug build may expose:

```js
window.__SFHS_DOOM_TEST__ = {
  getBuildInfo(),
  getEngineState(),
  getFrameHash(),
  getViewportState(),
  getAudioState(),
  getFsState(),
  injectKey(),
  stepUntilTic(),
  exportProfile(),
  listExternalRequests()
};
```

The façade is stable enough for tests but not allowed to replace user-facing behavior.

## 8.5 Automated browser gates

At minimum:

- HTML loads;
- launcher renders;
- Start works;
- audio unlock reaches a running or valid browser state;
- Freedoom boots;
- engine-only local file import boots;
- keyboard input reaches the engine;
- pointer lock succeeds or reports a supported fallback;
- save/load round trip succeeds;
- profile export/import succeeds;
- viewport resize preserves state;
- page hide/resume does not jump simulation;
- no console errors;
- no uncaught page errors;
- no unexpected external requests;
- deterministic screenshot fixtures match within declared policy;
- artifact metadata matches the file under test.

## 8.6 Native/Wasm compatibility gates

Required comparisons:

| Area | Proof |
|---|---|
| Demo playback | Same demo completes without desync on native and Wasm |
| Timedemo | Both reach expected end tic and report valid timing |
| Simulation | Stable state hashes match at selected tics |
| Rendering | Internal framebuffer hashes match at selected tics, or every documented platform difference is reviewed |
| Save | Native and browser load each other’s save fixture |
| Config | Native and browser read each other’s `default.cfg` |
| PWAD order | Observable fixture result changes correctly with order and matches native |
| DeHackEd | Open patch produces the same visible/game-state result |
| Merge | Open fixture matches native `-merge` behavior |

## 8.7 Physical Android gate

Required on the user’s Samsung phone:

1. Open bundled Freedoom file or immutable preview.
2. Start audio with one gesture.
3. Enter gameplay in landscape.
4. Move and turn simultaneously.
5. Hold movement while pressing fire and use.
6. Drag outside each touch zone.
7. Trigger or simulate `pointercancel` and verify zero stuck inputs.
8. Show/hide browser chrome.
9. Enter/exit fullscreen where available.
10. Rotate away and back.
11. Background the app and return.
12. Save, reload, and resume.
13. Export and re-import a profile.
14. Play for at least ten continuous minutes while observing frame pacing, heat, audio, and control drift.

Evidence:

```text
device model
Android version
Chrome version
build ID
artifact SHA-256
steps
expected
observed
screenshots/video
console errors where available
PASS/FAIL
```

## 8.8 Evidence paths

Durable reviewed evidence:

```text
docs/evidence/Pxx/<task-or-gate>/
```

Large generated run output, ignored from source control unless promoted:

```text
test-results/<run-id>/
```

Every accepted gate references exact paths and hashes.

## 8.9 Phase verdicts

```text
PASS
FAIL — REPAIRABLE
FAIL — ARCHITECTURAL
BLOCKED — EXTERNAL INPUT REQUIRED
```

A checker does not silently repair. Repair work becomes a new bounded task.

---

# 9. Sol High and Luna operating model

## 9.1 Model roles

### ChatGPT Sol High — architecture authority

Use Sol High for:

- the complete project specification;
- phase design;
- architecture decisions;
- decomposition into Luna-sized cards;
- compatibility-contract interpretation;
- ambiguous compiler/behavioral blockers after bounded evidence exists;
- phase-gate review;
- final-release review.

Do not use Sol High for:

- routine file creation;
- ordinary compiler-warning fixes;
- repeating an already explicit task;
- running every test after every commit;
- restating full repository history.

### Luna in Codex — implementation worker

Use Luna for:

- bounded source changes;
- build-system edits;
- deterministic scripts;
- fixture creation;
- browser shell implementation;
- focused test creation;
- running builds and tests;
- repairing a specific observed failure;
- writing task result reports;
- committing one coherent change.

Luna must not make a new architecture decision merely because a task is inconvenient.

### Human authority

The user retains authority over:

- scope changes;
- changes to accepted platform decisions;
- visual and touch-control acceptance;
- use of commercial IWADs for local validation;
- public release and deployment;
- multiplayer authorization.

## 9.2 Intelligence labels

| Label | Model/effort | Typical work |
|---|---|---|
| `LUNA-L` | Luna low/medium | docs, data tables, deterministic scripts, task infrastructure, simple UI wiring |
| `LUNA-M` | Luna medium | bounded C/JS bridge, build fixes with clear errors, test harness work |
| `LUNA-H` | Luna high | difficult but bounded Wasm, timing, audio, or compatibility defect with a reproducible case |
| `SOL-H` | Sol High | architecture, phase plans, ambiguous root-cause reasoning, compatibility interpretation |
| `SOL-GATE` | Sol High read/review | phase and final gate; no implementation |
| `HUMAN` | user/device/legal input | visual verdict, device test, commercial fixture access, release decision |

Use the lowest level that reliably completes the task. Do not cycle an unchanged task through models without new evidence.

## 9.3 Two-loop workflow

```text
LONG-HORIZON LOOP — Sol High
project contract
-> phase plan
-> Luna task cards
-> architecture freeze
-> phase gate
-> next phase

EXECUTION LOOP — Luna
read task ID
-> inspect repository reality
-> implement bounded change
-> run exact tests
-> write result
-> commit
-> advance queue
```

## 9.4 Shared memory hierarchy

The repository, not chat history, is the source of truth.

Read order:

```text
AGENTS.md
-> docs/PROJECT_SPEC.md
-> docs/CURRENT_STATE.md
-> docs/phases/Pxx/PHASE_PLAN.md
-> docs/tasks/Pxx/TASK-ID.md
-> relevant code/tests only
```

A task must not require a worker to read every prior task result.

## 9.5 Minimal Luna handoff

Normal prompt:

```text
Execute DOOM-P03-040 in the current phase branch. Follow AGENTS.md and the task card. Stay within scope, run the exact verification, commit only on pass, and write the required result. Stop with an evidenced blocker rather than redesigning.
```

The task ID is the handoff. The task card contains the rest.

## 9.6 Minimal Sol handoff

At a phase boundary, Luna creates:

```text
docs/phases/Pxx/PHASE_RESULT.md
```

Normal Sol prompt with GitHub access:

```text
Review Phase P03 on the phase branch against docs/PROJECT_SPEC.md and docs/phases/P03/PHASE_RESULT.md. Inspect the actual diff and evidence. Return a gate verdict. On PASS, author the next phase plan and task cards; do not implement.
```

Without direct repository access, the only routine manual handoff is the phase-result file plus the commit range. Individual Luna transcripts are not pasted.

## 9.7 Task-size contract

A Luna task should normally have:

- one observable behavior;
- one primary subsystem;
- one commit;
- one result report;
- one exact verification command or small command set;
- explicit allowed files or directories;
- explicit non-goals;
- a target execution window of roughly 30–120 minutes;
- no unresolved architecture question.

Typical change size is one to five files, but build-system or generated-fixture tasks may legitimately touch more when the card lists them.

Split a task when it combines any two of:

- toolchain setup;
- engine behavior;
- browser UI;
- persistence;
- audio;
- compatibility diagnosis;
- release packaging.

## 9.8 Stop and escalate rules

Luna stops and writes a blocker when:

- the task requires changing an accepted ADR;
- the current repository state differs materially from the card;
- unrelated user work would be overwritten;
- a required legal fixture is unavailable;
- the observed bug cannot be reproduced;
- two bounded repair attempts fail without new evidence;
- completion would require broad gameplay changes;
- the declared tests are absent or invalid;
- the task would have to silently expand scope;
- native and Wasm behavior disagree and the cause is ambiguous.

Blocker format:

```text
exact failing component
exact observed behavior
base and current commit
exact command
full error/log path
changed files and partial state
what was ruled out
whether the branch remains safe
exact decision or input required
```

## 9.9 Phase-gate frequency

Sol should review once per phase, not once per task.

Extra Sol review is justified only by:

- an architectural blocker;
- a compatibility divergence;
- a proposed scope change;
- a licensing decision;
- repeated Luna failure with new evidence.

## 9.10 Independent checking

Routine deterministic checks run in each task.

An independent model check is required only for:

- Phase 2 feasibility;
- Phase 3 strict single-file proof;
- Phase 8 compatibility gate;
- Phase 10 final release.

The checker must be read-only. A separate Luna thread may perform a low-cost precheck, but Sol issues the authoritative phase verdict.

## 9.11 Parallelism policy

Default:

```text
source-modifying workers: 1
read-only checker/research worker: optional 1
```

Parallel source work is permitted only after Sol explicitly proves non-overlapping files and interfaces. Avoiding merge work is cheaper than maximizing nominal concurrency.

---

# 10. Repository governance and handoff files

## 10.1 `AGENTS.md` required contents

```text
project goal and non-goals
source-of-truth document order
upstream compatibility invariant
allowed build/test commands
one-task/one-commit rule
no commercial WAD rule
no external runtime dependency rule
no editing generated dist files
stop/block conditions
result report requirement
git safety rules
```

## 10.2 `.agent/PLANS.md` required contents

- phase-plan template;
- requirement that phases remain self-contained;
- requirement to repeat assumptions relied upon;
- phase exit evidence;
- rule that a plan is updated when reality changes;
- no implementation inside a planning-only run.

## 10.3 Task card template

```md
# DOOM-Px-yyy — Task title

**Intelligence:** LUNA-L | LUNA-M | LUNA-H | SOL-H | HUMAN  
**Phase:** Pxx  
**Depends on:** task IDs  
**Branch:** phase branch  
**Allowed files/directories:** explicit list  
**Parallel:** No unless explicitly stated

## Goal
One observable result.

## Context
Only the context not already stable in PROJECT_SPEC or PHASE_PLAN.

## Constraints
Hard boundaries and non-goals.

## Work
Concrete operations.

## Exact verification
Commands, fixture, expected exit/result.

## Acceptance
Binary conditions.

## Evidence output
Exact paths.

## Stop/block conditions
Specific reasons to stop rather than improvise.

## Commit
Required message prefix and post-commit clean-state rule.
```

## 10.4 Task result template

```md
# TASK RESULT

**Task:** DOOM-Px-yyy  
**Status:** PASS | BLOCKED | FAIL  
**Base commit:**  
**Result commit:**  
**Branch:**

## What was done

## What was verified

## What failed

## Changed files

## Commands and exact results

## Acceptance mapping

## Evidence paths

## Current exact state

## Known limitations

## Remaining blocker or next task

## Post-run git status
```

## 10.5 Phase result template

```md
# PHASE RESULT — Pxx

**Verdict requested:** PASS | FAIL — REPAIRABLE | FAIL — ARCHITECTURAL  
**Base commit:**  
**Candidate commit:**  
**Task range:**

## Goal and achieved boundary

## Completed task table

## Actual architecture after the phase

## Verification summary

## Compatibility impact

## Artifact/evidence manifest

## Deviations from phase plan

## Failures and repairs

## Open issues

## Exact current state

## Proposed next-phase assumptions
```

## 10.6 `taskctl.py`

Phase 0 creates a deliberately small local task helper.

Required commands:

```text
python tools/taskctl.py status
python tools/taskctl.py show DOOM-Px-yyy
python tools/taskctl.py start DOOM-Px-yyy
python tools/taskctl.py finish DOOM-Px-yyy --commit <sha>
python tools/taskctl.py block DOOM-Px-yyy --report <path>
```

It verifies dependency state, task existence, branch, and report presence. It does not pretend to prove code correctness.

## 10.7 Git policy

- `main` contains only accepted phase gates.
- One branch per phase: `phase/pNN-name`.
- Luna tasks commit serially to the phase branch.
- One draft PR per phase, not one PR per tiny task.
- Commit subject begins with task ID.
- Do not force-push after evidence records a commit.
- Do not rewrite accepted phase history.
- Do not use `git reset --hard`, `git clean`, broad restore, destructive checkout, broad stash, amend, or force push without explicit authorization.
- Unknown user changes are a blocker, not collateral damage.

## 10.8 Issue log

Every observed issue is either:

- repaired in the current task and documented;
- recorded in `docs/ISSUE_LOG.md` with evidence and owner phase;
- elevated as a blocker.

No hidden TODO is allowed to stand in for an issue record.

---

# 11. Cost-control policy

## 11.1 Model spending

Use Luna for the majority of implementation work. Reserve Sol High for phase design, ambiguous blockers, and gates.

Expected model-call shape:

```text
one Sol planning session per phase
5–10 Luna task runs per phase
one compact Sol phase review
```

Do not send the entire repository or every historical result back through Sol. Sol reads the current phase branch and one phase-result file.

## 11.2 Local execution

Builds, tests, hashes, screenshots, and compatibility comparisons run locally whenever practical.

GitHub Actions policy:

- no full CI on every Luna commit;
- focused lightweight checks may run on phase PRs;
- heavy browser/compatibility matrix runs manually or on phase-gate dispatch;
- final clean-clone/release CI runs only for release candidates.

This protects limited Actions usage and avoids paying to repeat local evidence.

## 11.3 Offline-model fallback

Tasks tagged `LUNA-L` may later be assigned to a local model after it passes a qualification suite containing:

- task-scope obedience;
- clean git behavior;
- exact-command execution;
- report-schema compliance;
- simple build-script task;
- test-fixture task;
- refusal to invent success.

The local model is never assigned compatibility, timing, audio, or release tasks merely to save money until it has demonstrated those capabilities.

## 11.4 Toolchain cost

The engine, compiler, Freedoom data, test runner, and local server can all be open source. The project should require no paid runtime service.

## 11.5 Complexity budget

Do not add custom compression, workers, PWA files, cloud persistence, or a JavaScript rewrite before evidence proves they are needed.

The first single-file artifact may be large. Size is measured in Phase 3. Optimization follows measurement rather than assumption.

---

# 12. Execution roadmap

The complete roadmap contains eleven active phases, P0 through P10. P11 is reserved for future multiplayer.

The exact implementation details of later cards may be refined by Sol after earlier phases reveal runtime reality, but their product boundary and gate remain fixed by this specification.

---

## Phase P0 — Governance, scope, upstream, and task infrastructure

**Goal:** Create a safe repository and freeze the project contract before implementation.

**Exit gate:** A clean fork exists; upstream/toolchain/content choices are recorded; task machinery works; no engine behavior has been changed.

| Task | Intelligence | Work | Done when |
|---|---|---|---|
| DOOM-P0-001 | SOL-H | Record the user’s acceptance of ADR-011 through ADR-014; freeze the project contract, targets, and non-goals; author the repository-ready Phase P0 plan and Luna cards. | Acceptance is recorded in the v1.0 specification and Phase P0 planning packet. |
| DOOM-P0-010 | LUNA-L | Create the Chocolate Doom fork/working repository structure without modifying engine behavior. | Repository tree exists; upstream remote/base are recorded; clean status. |
| DOOM-P0-020 | LUNA-L | Install this specification as `docs/PROJECT_SPEC.md` and create `docs/CURRENT_STATE.md`, `UPSTREAM_DELTA.md`, `COMPATIBILITY_MATRIX.md`, and `ISSUE_LOG.md`. | All documents exist with valid headers and source-of-truth order. |
| DOOM-P0-030 | LUNA-L | Author root `AGENTS.md` from the governance contract. | A fresh Codex thread can identify allowed scope, commands, and stop rules from the file alone. |
| DOOM-P0-040 | LUNA-L | Author `.agent/PLANS.md`, phase-plan template, task template, result template, and phase-result template. | Templates validate against the required fields. |
| DOOM-P0-050 | LUNA-M | Implement minimal `tools/taskctl.py` and task-state data. | Start/show/finish/block/status operations work on fixture tasks without touching source. |
| DOOM-P0-060 | LUNA-L | Create license inventory and third-party notice plan. | Engine, Freedoom, Emscripten/SDL, new code, and trademark notice requirements are mapped. |
| DOOM-P0-070 | LUNA-L | Define evidence directories, manifest schema, build identity schema, and hash policy. | A fixture artifact manifest validates and binds source commit to SHA-256. |
| DOOM-P0-080 | LUNA-L | Create one draft phase PR and confirm serial task commit workflow. | Task fixture commit and result are visible in the phase PR; no per-task PR required. |
| DOOM-P0-090 | SOL-GATE | Inspect actual repository and governance files. | PASS only if a new Luna task can begin from one sentence plus task ID. |

---

## Phase P1 — Native Chocolate Doom oracle

**Goal:** Prove the selected upstream source builds and behaves correctly before browser changes.

**Exit gate:** A pinned native build, open data fixtures, demo/timedemo baseline, and reproducible evidence exist.

| Task | Intelligence | Work | Done when |
|---|---|---|---|
| DOOM-P1-010 | LUNA-M | Inspect upstream build paths and pin native prerequisites. Prefer supported CMake; record fallback. | Toolchain lock and exact install/build commands exist. |
| DOOM-P1-020 | LUNA-M | Implement `tools/build-native.sh` for clean debug and release builds. | Both builds succeed from a clean tree and identify the same source commit. |
| DOOM-P1-030 | LUNA-M | Run upstream test suite and capture exact baseline. | Tests pass or every upstream failure is evidenced and dispositioned. |
| DOOM-P1-040 | LUNA-L | Implement `tools/fetch-freedoom.sh` for a pinned official release with hash verification. | Phase 1 and Phase 2 data are fetched into ignored cache and hashes match. |
| DOOM-P1-050 | LUNA-M | Boot Freedoom Phase 1 and Phase 2 natively and record game detection. | Both reach gameplay with clean logs. |
| DOOM-P1-060 | LUNA-M | Create a small open compatibility fixture set: deterministic configs, PWAD, DEH, and recorded Freedoom demos. | Fixtures are licensed, documented, and reproducible. |
| DOOM-P1-070 | LUNA-M | Establish demo playback, recording, strict demo, and timedemo command captures. | Native commands complete and produce machine-readable result files. |
| DOOM-P1-080 | LUNA-H | Add the smallest test-only stable state/framebuffer hash hooks or an equivalent non-invasive oracle interface. | Repeated native runs produce identical selected hashes. |
| DOOM-P1-085 | LUNA-L | Write native-oracle baseline report and artifact manifest. | Report binds source, toolchain, data hashes, commands, and results. |
| DOOM-P1-090 | SOL-GATE | Review oracle quality and gameplay-invariance risk. | PASS only if later Wasm comparisons can fail meaningfully rather than merely boot. |

---

## Phase P2 — Multi-file WebAssembly feasibility spike

**Goal:** Prove the pinned source can run in a browser before solving strict one-file packaging.

**Exit gate:** A debug multi-file Wasm build boots Freedoom with video, keyboard, and at least a viable audio device path; blockers are characterized.

| Task | Intelligence | Work | Done when |
|---|---|---|---|
| DOOM-P2-010 | LUNA-M | Pin Emscripten SDK and browser build dependencies. | Bootstrap is repeatable and reports exact versions. |
| DOOM-P2-020 | LUNA-M | Implement `tools/toolchain-doctor.sh` for compiler, CMake/autotools, SDL, Node/test runner, browser, and Python dependencies. | Doctor returns clear PASS/FAIL with no silent assumptions. |
| DOOM-P2-030 | LUNA-M | Configure upstream for Emscripten without SFHS feature additions. | Configure/generate stage succeeds or a precise unsupported boundary is reported. |
| DOOM-P2-040 | LUNA-H | Produce the first multi-file Wasm executable. | Link succeeds and generated files load through a local server. |
| DOOM-P2-050 | LUNA-H | Repair only the first required platform abstraction boundary. | Patch is isolated, documented in `UPSTREAM_DELTA.md`, and native tests remain green. |
| DOOM-P2-060 | LUNA-M | Boot a cached Freedoom IWAD in the browser. | Title/gameplay canvas appears; game mode is correctly detected. |
| DOOM-P2-070 | LUNA-M | Wire keyboard input and confirm engine events. | Player/menu responds through existing input semantics. |
| DOOM-P2-080 | LUNA-H | Establish an audio device and emit at least one real engine SFX/music diagnostic path. | Browser audio backend initializes after gesture; remaining music work is explicitly scoped. |
| DOOM-P2-085 | LUNA-M | Compare selected native/Wasm state and framebuffer checkpoints. | Initial parity results exist; every difference is classified. |
| DOOM-P2-088 | LUNA-L | Record size, startup time, memory, unsupported API, and patch inventory. | Feasibility report is complete. |
| DOOM-P2-090 | SOL-GATE | Decide whether the architecture is sound and freeze the platform adapter seam. | PASS, repair plan, or evidenced architectural failure. |

---

## Phase P3 — Strict single-file SFHS packaging

**Goal:** Generate one HTML file containing the engine and, for bundled editions, the IWAD.

**Exit gate:** Three one-file candidates exist; bundled editions boot under local file and localhost; no external requests occur.

| Task | Intelligence | Work | Done when |
|---|---|---|---|
| DOOM-P3-010 | LUNA-L | Create custom readable `web/shell.html` and CSS with launcher/game/error/about states. | Shell renders independently with no external assets. |
| DOOM-P3-020 | LUNA-M | Add controlled Emscripten single-file build for the engine payload. | One HTML contains JS and Wasm; no separate Wasm file is needed. |
| DOOM-P3-030 | LUNA-M | Embed Freedoom Phase 1 through the virtual filesystem. | One HTML boots Phase 1 without file selection or network. |
| DOOM-P3-040 | LUNA-M | Embed Freedoom Phase 2 through the same generalized path. | One HTML boots Phase 2; no Phase-1-specific branch exists. |
| DOOM-P3-050 | LUNA-M | Produce engine-only one-file artifact that waits for local data. | Launcher boots cleanly without an IWAD and does not enter engine main prematurely. |
| DOOM-P3-060 | LUNA-M | Add Playwright no-console/no-page-error/no-external-request smoke tests. | Tests fail on any external request and pass on all three candidates. |
| DOOM-P3-070 | LUNA-L | Inject machine-readable and visible build metadata. | Displayed metadata matches generated manifest and actual artifact hash. |
| DOOM-P3-080 | LUNA-M | Test `file://` and localhost boot behavior. | Bundled editions boot in both; engine-only launcher remains usable; storage differences are reported. |
| DOOM-P3-085 | LUNA-L | Measure exact bytes, startup time, memory, and base64/package overhead. | Report contains measured values; no premature compression is added. |
| DOOM-P3-090 | SOL-GATE | Review exact bytes, network trace, source parity, and generalized build path. | PASS only if the strict one-file contract is genuinely met. |

---

## Phase P4 — IWAD, PWAD, DeHackEd, demo, and argument launcher

**Goal:** Make the engine-only artifact a complete local-file launcher.

**Exit gate:** A user can select data, preserve file order, launch supported options, and recover from invalid input.

| Task | Intelligence | Work | Done when |
|---|---|---|---|
| DOOM-P4-010 | LUNA-L | Implement IWAD picker and selected-file summary. | Filename, size, and local hash display; no upload occurs. |
| DOOM-P4-020 | LUNA-M | Implement local File API to Emscripten FS bridge before main invocation. | Selected IWAD is available at the exact engine path and launches. |
| DOOM-P4-030 | LUNA-M | Detect supported IWAD families through existing engine logic or validated preflight metadata. | Detected mode agrees with native Chocolate Doom. |
| DOOM-P4-040 | LUNA-L | Implement ordered PWAD list UI with add/remove/reorder. | Final visible order is stable and serializable for the launch session. |
| DOOM-P4-050 | LUNA-M | Bridge ordered PWADs to `-file`. | Open override fixture matches native behavior in both orders. |
| DOOM-P4-060 | LUNA-L | Implement ordered DeHackEd selection UI. | Multiple patches can be ordered and removed. |
| DOOM-P4-070 | LUNA-M | Bridge DeHackEd files and validate open fixture. | Browser and native produce matching patched state. |
| DOOM-P4-080 | LUNA-M | Add `-merge` mode and open total-conversion-style fixture. | In-memory merge result matches native. |
| DOOM-P4-090 | LUNA-M | Add demo import, record option, and recorded-demo download. | Imported demo plays; recorded demo downloads and plays natively. |
| DOOM-P4-100 | LUNA-L | Add common options and an advanced supported-arguments field with final argv preview. | Warp, skill, fast, respawn, nomonsters, strict demo, and timedemo paths are testable. |
| DOOM-P4-110 | LUNA-M | Implement input validation and recoverable error UI. | Invalid files/options identify exact cause and return safely to launcher. |
| DOOM-P4-120 | LUNA-M | Run engine-only end-to-end launcher matrix. | IWAD/PWAD/DEH/demo combinations pass with no external requests. |
| DOOM-P4-130 | SOL-GATE | Review launcher semantics against native command behavior. | PASS only if the UI is a faithful front end, not a competing rules layer. |

---

## Phase P5 — Configuration, savegames, and portable persistence

**Goal:** Preserve upstream files while making browser persistence dependable and portable.

**Exit gate:** Saves/config work when hosted, export/import works everywhere, and native/browser interchange is verified.

| Task | Intelligence | Work | Done when |
|---|---|---|---|
| DOOM-P5-010 | LUNA-M | Define virtual persistent directory and browser metadata separation. | Engine files and browser-only data cannot overwrite each other accidentally. |
| DOOM-P5-020 | LUNA-H | Mount and synchronize a persistent Emscripten-compatible filesystem on supported origins. | Config/save survive reload on localhost/HTTPS test origin. |
| DOOM-P5-030 | LUNA-M | Wire engine config load and flush checkpoints. | Settings persist and generated files retain upstream format. |
| DOOM-P5-040 | LUNA-M | Wire savegame flush after save operations and safe lifecycle checkpoints. | Saves survive reload without relying on `unload`. |
| DOOM-P5-050 | LUNA-L | Implement versioned profile export JSON with per-file hashes. | Export contains only allowed files and validates against schema. |
| DOOM-P5-060 | LUNA-M | Implement profile import, validation, preview, and conflict handling. | Valid profile restores; corrupt or future version fails safely. |
| DOOM-P5-070 | LUNA-M | Verify native save -> browser load. | Browser reaches the exact saved map/player state. |
| DOOM-P5-080 | LUNA-M | Verify browser save -> native load. | Native build loads without conversion or corruption. |
| DOOM-P5-090 | LUNA-M | Verify bidirectional `default.cfg` behavior. | Key bindings/settings round-trip within upstream compatibility. |
| DOOM-P5-100 | LUNA-L | Add explicit local-file persistence warning and export/import recovery path. | `file://` remains usable even when browser storage is unavailable. |
| DOOM-P5-110 | SOL-GATE | Review format preservation, failure handling, and privacy. | PASS only if custom browser metadata has not replaced vanilla files. |

---

## Phase P6 — Android portrait shell, controls, minimap, and HUD

**Goal:** Produce a strict one-file Freedoom Android candidate that is portrait-first, playable with simultaneous touch controls, and leaves Chocolate Doom simulation and rendering authoritative.

**Exit gate:** P6-040 passes focused desktop/mobile-emulation checks and P6-050 records physical Samsung acceptance. P5 persistence remains a separate deferred phase.

| Task | Intelligence | Work | Done when |
|---|---|---|---|
| DOOM-P6-000 | LUNA-L | Install the P6 branch, review record, corrected ADR, and cards from P3. | P4 remains blocked/separate; P6-010 is ready. |
| DOOM-P6-010 | LUNA-M | Add portrait shell and profile editor. | Four regions, safe viewport, layouts, and import/export work. |
| DOOM-P6-020 | LUNA-H | Add multi-touch input through the normal engine event queue. | Move/turn/actions and cleanup work without gameplay mutation. |
| DOOM-P6-030 | LUNA-H | Add read-only state bridge, minimap, and HUD. | Known geometry and live player status render at bounded rate. |
| DOOM-P6-040 | LUNA-M | Build the Android one-file candidate and focused bundle. | Candidate gate passes with physical acceptance pending. |
| DOOM-P6-050 | LUNA-M/HUMAN | Run the real Samsung acceptance route. | Physical gate passes with recorded limitations. |
| DOOM-P6-090 | SOL-GATE | Independently review P6. | Verdict is recorded without a builder commit. |

---

## Phase P7 — WAD Forge and Doom Capsules

**Authority:** [`docs/FORGE_SPEC.md`](FORGE_SPEC.md) is the complete product and
technical specification for P7. If this summary conflicts with that document,
the Forge specification controls.

**Goal:** Separate the verified Doom player runtime from game data, verify and
mount declared binary payloads locally, and progressively deliver a phone-first
Forge that can inspect, organize, launch, and export self-contained capsules.

The former unexecuted P7 audio roadmap is superseded. P6 established and
accepted the self-contained SFX/music, trusted-gesture unlock, and lifecycle
behavior; Forge must preserve those accepted paths as regressions.

**Exit gate:** P7-J completes the physical Samsung workflow and production
transition defined by the Forge specification. P7-A is a bounded first tranche
and does not imply completion of library, archive, analysis, or export features.

| Tranche | Work | Done when |
|---|---|---|
| P7-A | Forge-capable runtime | Content-independent engine, removable Freedoom payload, manifest-driven verified mount, V16 player parity, and exactly one launch. |
| P7-B | Local analyzer | Local WAD/ZIP inspection identifies payload structure and compatibility without upload. |
| P7-C | Recipe builder and launcher | Base, PWAD, merge, and DeHackEd recipes produce exact engine arguments and safe test play. |
| P7-D | Successor exporter | Player, Forge, thin, and private capsules round-trip locally and open by `file://`. |
| P7-E | Local library and collections | Local persistence, deduplication, recipes, collections, independent saves, and recovery controls work. |
| P7-F | Online archive browser | Explicit-consent `/idgames` discovery and cancelable download work with an offline export path. |
| P7-G | Rights and provenance | Permission, privacy, source, license, and combined-credit records are accurate and conservative. |
| P7-H | Capsule verifier and integrity | Corruption, missing bases, undeclared network, and producer-neutral boot failures are detected. |
| P7-I | Recursive Forge and integration | A Forge capsule produces a verified Forge successor and passes the complete phone workflow. |
| P7-J | Production transition | Independent review, exact identity, public documentation, Pages route transition, and release decision complete. |

---

## Phase P8 — Vanilla compatibility and parity matrix

**Goal:** Prove the browser port retains the selected Chocolate Doom behavior across the full single-player contract.

**Exit gate:** Open fixtures pass automatically, commercial IWAD matrix is locally exercised where data is available, and all divergences are resolved or explicitly block release.

| Task | Intelligence | Work | Done when |
|---|---|---|---|
| DOOM-P8-001 | SOL-H | Freeze the final compatibility matrix, fixture hashes, selected checkpoints, and acceptable platform-only differences. | Matrix is executable and has binary verdict rules. |
| DOOM-P8-010 | LUNA-H | Harden simulation hash hook and compare repeated native/Wasm runs. | Stable checkpoints match on open demo fixtures. |
| DOOM-P8-020 | LUNA-H | Harden logical framebuffer hash hook. | Selected frames match or exact presentation-independent differences are explained and accepted. |
| DOOM-P8-030 | LUNA-M | Build automated demo playback parity harness. | Every open demo completes at expected tic on both builds. |
| DOOM-P8-040 | LUNA-M | Build demo recording round-trip harness. | Browser-recorded demo plays natively and native-recorded demo plays in browser. |
| DOOM-P8-050 | LUNA-M | Execute config compatibility matrix. | Required native/browser directions pass. |
| DOOM-P8-060 | LUNA-M | Execute savegame compatibility matrix across representative maps/states. | Required native/browser directions pass without conversion. |
| DOOM-P8-070 | LUNA-M | Execute PWAD ordering, DeHackEd, and merge fixture matrix. | Browser results match native. |
| DOOM-P8-080 | LUNA-M | Exercise menus, setup-relevant options, pause, messages, automap, cheats, intermission, finale, and cast sequence. | Each item has route, expected result, and evidence. |
| DOOM-P8-090 | LUNA-M | Exercise weapons, actors, pickups, powerups, keys, bosses, line specials, sector effects, teleporters, crushers, lifts, stairs, and exits through authored fixtures or campaign routes. | Coverage map is complete; no item passes from inference. |
| DOOM-P8-100 | LUNA-M | Run Freedoom Phase 1 and Phase 2 campaign progression smoke routes. | Episode/map transitions, saves, intermissions, and endings function. |
| DOOM-P8-110 | HUMAN/LUNA-M | Run legally owned Doom/Ultimate/Doom II/Final Doom local matrix without copying data into the repo. | Hash-referenced results exist for every available IWAD; unavailable legal input is explicitly marked. |
| DOOM-P8-120 | LUNA-H | Investigate each native/Wasm divergence as a separate repair card. | No unresolved behavioral divergence remains hidden in aggregate results. |
| DOOM-P8-130 | SOL-GATE | Perform read-only compatibility review of source diff, oracle, matrix, and unresolved data gaps. | PASS, repairable fail, architectural fail, or external-input blocker. |

---

## Phase P9 — Browser hardening, malformed input, performance, and long-session stability

**Goal:** Make the verified engine dependable under real browser conditions and measure its release envelope.

**Exit gate:** Target browsers and Samsung sustain gameplay, file errors fail safely, memory/startup limits are known, and no new compatibility divergence appears.

| Task | Intelligence | Work | Done when |
|---|---|---|---|
| DOOM-P9-010 | LUNA-M | Run desktop Chromium browser matrix. | Launcher, engine, audio, persistence, fullscreen, and tests pass on pinned/current target. |
| DOOM-P9-020 | LUNA-M | Run desktop Firefox matrix. | Required features pass or exact browser-specific limitations are dispositioned. |
| DOOM-P9-030 | LUNA-M | Produce immutable Samsung test build and metadata. | Public/local route serves exact hashed bytes. |
| DOOM-P9-040 | LUNA-M/HUMAN | Run rotation, browser chrome, fullscreen, touch, background, resume, and save routes on Samsung. | Physical evidence passes. |
| DOOM-P9-050 | LUNA-M | Measure startup time, peak memory, steady memory, frame pacing, and timedemo results for all editions. | Baselines are recorded on desktop and Samsung. |
| DOOM-P9-060 | LUNA-H | Test large legal/open WAD stacks and memory growth behavior. | Supported envelope is documented; failure is recoverable rather than a silent hang. |
| DOOM-P9-070 | LUNA-M | Add malformed/truncated WAD, DEH, demo, and profile tests. | Launcher or engine reports failure without persistent corruption or browser lockup. |
| DOOM-P9-080 | LUNA-M | Run 30-minute automated/observed soak and repeated launch/restart cycles. | No progressive memory, audio, input, or persistence failure. |
| DOOM-P9-090 | LUNA-H | Optimize only measured bottlenecks without changing internal simulation/render hashes. | Improvement is evidenced; compatibility suite remains green. |
| DOOM-P9-100 | SOL-GATE | Review target matrix, performance envelope, and optimization safety. | PASS only if release limits are explicit and target devices remain operational. |

---

## Phase P10 — Reproducible release, source compliance, and final acceptance

**Goal:** Produce and verify the complete public release package.

**Exit gate:** Clean-clone rebuild produces the canonical artifacts; licenses/source/evidence are complete; user accepts the release; no automatic multiplayer work begins.

| Task | Intelligence | Work | Done when |
|---|---|---|---|
| DOOM-P10-010 | LUNA-L | Generate canonical engine-only artifact. | Artifact passes full applicable suite and manifest. |
| DOOM-P10-020 | LUNA-L | Generate canonical Freedoom Phase 1 artifact. | Artifact passes full applicable suite and manifest. |
| DOOM-P10-030 | LUNA-L | Generate canonical Freedoom Phase 2 artifact. | Artifact passes full applicable suite and manifest. |
| DOOM-P10-040 | LUNA-L | Generate SHA256SUMS and release manifest binding every artifact to source/toolchain/data. | Independent hash verification passes. |
| DOOM-P10-050 | LUNA-L | Complete in-file About/Licenses/Source panel and external source notice bundle. | Required notices are visible and complete. |
| DOOM-P10-060 | LUNA-M | Rebuild from a fresh clone and empty caches using documented commands. | Clean-clone build succeeds without undeclared local state. |
| DOOM-P10-070 | LUNA-M | Compare clean-clone artifact bytes to candidate. | Byte-identical PASS or exact reproducibility blocker with differing byte evidence. |
| DOOM-P10-080 | LUNA-M | Run final no-network, browser, oracle, save/config, demo, and compatibility gates on exact artifacts. | Test report references canonical SHA-256 values. |
| DOOM-P10-090 | LUNA-L | Write user guide, data-import guide, controls, storage caveats, compatibility boundary, and issue list. | A new user can launch without developer knowledge. |
| DOOM-P10-100 | LUNA-L | Produce corresponding-source archive and verify it contains everything needed to rebuild. | Archive hash and rebuild instructions are validated. |
| DOOM-P10-110 | SOL-GATE | Perform final read-only source, compatibility, evidence, licensing, and artifact review. | Final verdict is explicit and grounded in exact bytes. |
| DOOM-P10-120 | HUMAN | Run final desktop and Samsung acceptance and authorize or reject publication. | User returns ACCEPT, REPAIR, or REJECT. |
| DOOM-P10-130 | LUNA-L | Publish only after explicit authorization and verify deployed bytes against canonical hashes. | HTTP 200 is accompanied by exact-byte parity; source release is available. |

---

## Phase P11 — Future multiplayer project

P11 is a reserved label only. It does not begin automatically.

A future multiplayer specification would need to decide:

- authoritative vs lockstep model;
- WebSocket vs WebRTC transport;
- lobby/signaling requirements;
- demo/netgame determinism;
- NAT and hosting model;
- co-op/deathmatch UI;
- save/resume semantics;
- single-file client versus necessary server component.

Those decisions are deliberately absent from the current implementation cards.

---

# 13. Risk register

| Risk | Likelihood | Impact | Prevention | Trigger for Sol review |
|---|---:|---:|---|---|
| Emscripten/SDL build incompatibility | Medium | High | Multi-file feasibility before shell work; pin toolchain; isolate patch seam | Two bounded Luna attempts fail or require broad upstream changes |
| Demo desynchronization | Medium | Critical | Same source commit; stable hash hooks; one divergence per repair card | Any native/Wasm state mismatch |
| Browser audio backend mismatch | Medium | High | Gesture unlock; software OPL; focused lifecycle phase | SFX/music cannot share a stable backend without architecture change |
| Local-file persistence inconsistency | High | Medium | Hosted persistence plus mandatory profile export/import | Export/import cannot preserve upstream files |
| Single-file artifact too large | Medium | Medium | Measure before optimizing; engine-only edition; pinned content | Artifact exceeds chosen host/browser limit or startup becomes unacceptable |
| Commercial IWAD verification unavailable | Medium | High for claim breadth | Local hash-only test process; request lawful fixtures from user | P8 cannot exercise a required IWAD family |
| Browser lifecycle causes timing jump | Medium | High | Pause/suspend and no catch-up delta; deterministic tests | Hidden/resume changes simulation or demo state |
| Touch controls become gameplay assistance | Medium | High | Translate only existing events; compare simulation | Any touch-only change alters internal state beyond user input timing |
| Upstream patch drift | Medium | Medium | `UPSTREAM_DELTA.md`; minimal patch series; phase gates | Patch enters gameplay/render code without parity proof |
| Luna silently broadens a task | Medium | High | Allowed files, non-goals, stop conditions, serial branch | Diff exceeds task boundary or introduces new architecture |
| Expensive model overuse | Medium | Medium | Sol only at gates/blockers; repository handoff; Luna default | Sol asked to repair routine tasks or reread all history |
| GitHub Actions exhaustion | High given current usage concerns | Medium | Local tests; phase-only CI; manual heavy workflows | Per-commit heavy CI is introduced |
| GPL/source-release omission | Low | Critical | License inventory and release gate | Binary release candidate lacks corresponding source binding |
| Malformed WAD crashes browser | Medium | Medium | Negative fixtures; recovery UI; browser sandbox | Hang, persistent corruption, or unrecoverable abort |
| Reproducible build fails | Medium | Medium | Locked versions and timestamps; clean-clone test | Candidate bytes differ without explained cause |

---

# 14. Completion criteria

The project is complete only when all of the following are verified against exact source and artifact hashes.

## Engine

- Chocolate Doom-derived single-player engine runs in WebAssembly.
- Native and Wasm use the same accepted source commit.
- No unresolved behavioral divergence remains in the accepted matrix.
- Vanilla limits and intentional behavior remain default.

## Content and launcher

- Engine-only local IWAD launch works.
- Ordered PWAD and DeHackEd loading works.
- Demo import, playback, recording, and download work.
- Freedoom Phase 1 and Phase 2 each boot from one HTML file.

## Persistence

- Hosted config and save persistence works.
- Profile export/import works under hosted and local-file conditions.
- Native/browser save and config interchange pass.

## Controls and platform

- Desktop keyboard and mouse are operational.
- Target Samsung touch controls are operational and physically verified.
- Resize, fullscreen fallback, background, and resume are operational.

## Audio

- SFX and music work after a user gesture.
- No runtime soundfont or network dependency exists.
- Background/resume does not duplicate or permanently silence audio.

## Packaging

- Each canonical product is exactly one HTML file.
- No required runtime external request occurs.
- Artifact metadata and SHA-256 are correct.
- Clean-clone build is verified.

## Legal and source

- No commercial IWAD is distributed.
- Engine and content notices are present.
- Corresponding modified source and build scripts are available.
- Source release is cryptographically bound to artifacts.

## Evidence

- Native oracle report passes.
- Browser automation passes.
- Compatibility matrix passes or accurately records a user-owned-data blocker before any broad claim.
- Physical device acceptance passes where required.
- Final Sol checker returns PASS.
- User returns ACCEPT.

---

# 15. Current exact state

## Verified

- A mature historically accurate engine core exists in Chocolate Doom.
- Chocolate Doom explicitly targets DOS behavior, intentional bugs, demo/config/save compatibility, and retro feel.
- Emscripten supports compiling C/C++ and SDL-class applications to WebAssembly.
- Emscripten documents single-file and embedded-file mechanisms suitable for a one-HTML target.
- Freedoom supplies complete freely distributable Doom-compatible content and current project guidance emphasizes vanilla compatibility through Chocolate Doom testing.
- OpenAI currently positions Sol for complex/detail-oriented work and Luna for clear, repeatable work; Luna’s price/usage cost was recently reduced substantially.
- OpenAI documents `AGENTS.md` and `PLANS.md`/ExecPlans as durable mechanisms for repository instructions and long-running work.
- The uploaded SFHS manuals support split-source development, generated one-file release, named ownership boundaries, no-network tests, mobile viewport discipline, versioned persistence, and evidence-first verification.

## Proposed but untested

- The selected current Chocolate Doom source will compile cleanly with the selected current Emscripten SDK.
- Software OPL will work through the chosen browser audio path without a specialized adapter.
- Strict one-file artifacts will remain within acceptable browser/host size and startup limits.
- Byte-identical reproducible output can be achieved with the final toolchain.
- Android touch controls can be added without platform-specific timing defects.
- The complete native/Wasm demo and framebuffer parity matrix will pass without gameplay-source changes.

## Work not yet performed

- No repository has been created for this project.
- No upstream commit or Emscripten version has been pinned.
- No native or Wasm build has been run.
- No HTML artifact has been generated.
- No commercial IWAD has been requested or inspected.
- No source, release, preview, or production system has been changed.

## Current blocker

There is no technical blocker yet because execution has not started. The platform/model assumptions are accepted. The next action is repository bootstrap through DOOM-P0-010; remote creation, push, or draft-PR work still requires explicit authorization when reached.

---

# 16. First actionable step

DOOM-P0-001 is complete at the planning level: ADR-011 through ADR-014 are accepted and the Phase P0 planning packet has been authored. No repository files have yet been installed.

The first Codex/Luna run uses the bootstrap packet because `AGENTS.md` and repository task cards do not exist until Phase P0 creates them:

```text
Execute DOOM-P0-010 from the attached SFHS Doom Phase P0 bootstrap packet in the authorized project workspace. Perform no remote creation, push, or PR action. Stop on any unsafe repository condition.
```

After DOOM-P0-030 installs `AGENTS.md`, ordinary Luna handoffs reduce to one sentence plus a task ID.

---

# 17. Research sources

## Official OpenAI

- OpenAI, “Advancing the price-performance frontier with GPT-5.6.”
  - https://openai.com/index/advancing-the-price-performance-frontier-with-gpt-5-6/
- OpenAI Developers, “Codex models.”
  - https://developers.openai.com/codex/models
- OpenAI Developers, “Custom instructions with AGENTS.md.”
  - https://developers.openai.com/codex/agent-configuration/agents-md
- OpenAI Developers, “Using PLANS.md for multi-hour problem solving.”
  - https://developers.openai.com/cookbook/articles/codex_exec_plans
- OpenAI Help, “GPT-5.6 in ChatGPT.”
  - https://help.openai.com/en/articles/20001354-gpt-56-in-chatgpt

## Engine, content, and toolchain

- Chocolate Doom official repository.
  - https://github.com/chocolate-doom/chocolate-doom
- Freedoom official repository.
  - https://github.com/freedoom/freedoom
- Emscripten compiler settings, including `SINGLE_FILE`.
  - https://emscripten.org/docs/tools_reference/settings_reference.html
- Emscripten file packaging.
  - https://emscripten.org/docs/porting/files/packaging_files.html
- doomgeneric reference port.
  - https://github.com/ozkl/doomgeneric

## Local SFHS research inputs

- `html raycasting.md`
- `Single-File HTML5 Game Research Guide.pdf`
- `# Single-File HTML5 Game Field Manual.pdf`
- `canvas 2d engine.md`

These local manuals inform the browser shell, mobile behavior, AI-safe editing, testing, evidence, and one-file packaging rules. They do not replace Chocolate Doom’s BSP renderer or simulation architecture.
