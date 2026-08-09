# Upstream Delta

**Current engine delta:** compile-time-gated P01 oracle observer plus the V10 Emscripten-only detached-HUD presentation path; V11 changes only browser-shell presentation and ordinary native builds remain behaviorally unchanged
**Upstream base:** Chocolate Doom `chocolate-doom-3.1.1` at `410d96855b5df5410ff591a90efeafa889119224`

P00 governance files do not alter engine behavior, native build behavior, or future Wasm behavior.

## Verified entries

| Task | Commit | Paths | Reason | Native effect | Wasm effect | Tests | Disposition |
|---|---|---|---|---|---|---|---|
| DOOM-P0-010 | `69375a29555d2523f8ae435900dc35245c9c0b58` | `docs/bootstrap/REPOSITORY_BASELINE.md`; `docs/results/P00/DOOM-P0-010.md` | Record clean upstream base and branch | None | None | Branch, ancestry, changed-path, remote, and clean-tree checks | Accepted P00 governance change |
| DOOM-P1-080 | `ac9d51be7ec28162920212898ffec34b7315c913` | `src/CMakeLists.txt`; `src/doom/d_main.c`; `src/doom/g_game.c`; `src/sfhs_oracle/**` | Emit deterministic test-only native logical-state and indexed-frame checkpoints | Active only with `SFHS_ORACLE_TEST=ON`; OFF build completes the same 140-tic demo and emits no oracle artifacts | Not selected or tested in P01 | Clean Oracle build; five repeated processes; PWAD order; DeHackEd effect; OFF regression; demo/timedemo regressions | Accepted P01 test-only observer |
| DOOM-P2-080 | `SELF` | `cmake/SFHSWasm.cmake`; `tools/build-wasm.sh`; `web/p2/pre.js`; `web/p2/post.js`; `web/p2/shell.html`; browser/audio contracts | Export Emscripten main entrypoint and establish a bounded multi-file browser audio startup path | Native source unchanged; native controls remain outside this adapter | `INVOKE_RUN=0`; exported `_main`, `callMain`, `FS`, and `ENV`; trusted Start gesture gates audio; normal browser lanes use the same exported entrypoint after preload | Emscripten 6.0.5 clean rebuild; generated-JS export check; 6 boot/input tests; 2 Chromium/Firefox audio tests; contract tests | Accepted P2 shell/build adapter |
| DOOM-P2-085 | `SELF` | `src/sfhs_oracle/sfhs_oracle.c`; `web/p2/pre.js`; `web/p2/post.js`; parity harnesses | Make the accepted test-only Oracle output portable to Wasm MEMFS and compare exact native/browser checkpoints | Native Oracle fields and meanings unchanged; native P2 control uses `freedoom2.wad` | Chromium 5-run and Firefox 3-run exact state/raw-frame parity; DeHackEd effect; no PWAD-order claim | Fresh native controls; WSL Chromium/Firefox Oracle runners; raw 320x200 comparison; parity Playwright test; tamper rejection unit test | Accepted browser-output portability and parity adapter |

## Future entry schema

Every future upstream delta must record:

| Task | Commit | Paths | Reason | Native effect | Wasm effect | Tests | Disposition |
|---|---|---|---|---|---|---|---|
| `<TASK-ID>` | `<SHA or SELF>` | `<repository-relative paths>` | `<why the delta is required>` | `<verified effect or none>` | `<verified effect or none>` | `<exact commands/results>` | `<accepted, rejected, or pending>` |

Engine-source or upstream-build changes were not permitted in P00. The P1-080
delta is compile-time gated, observes only, and is absent from ordinary builds.

The P2-080 delta contains no C, gameplay, renderer, SDL implementation, or
engine timing change. Its CMake/build changes are limited to the supported
Emscripten link exports and explicit compiler selection; browser shell changes
call the exported entrypoint without awaiting the long-running main loop.

## P3-020 packaging delta

P3-020 adds only the strict single-file CMake profile marker, packaging scripts,
an inline HTML shell, and static packaging validation. The source link remains
the accepted P2 Chocolate Doom target; `-sSINGLE_FILE=1` and `--embed-file` are
packaging flags, not engine behavior changes. The final product is a single
embedded HTML file and the Oracle-enabled packaging variant is ignored test
evidence. No C path changed.

## P6-020 mobile input delta

P6-020 adds an Emscripten-only `src/sfhs_mobile/sfhs_mobile_input` unit to the
existing Chocolate Doom executable target. It reads the already-configured
control bindings from `m_controls.h` and posts ordinary `ev_keydown`,
`ev_keyup`, and horizontal `ev_mouse` records through `D_PostEvent`. It does
not call a responder, mutate player/game structures, alter tic timing, or
change an existing Doom C source file. Native targets do not compile the unit.

## P6-030 mobile state delta

P6-030 adds a second Emscripten-only, static read-only packet. It copies only
player status and map lines marked `ML_MAPPED` while excluding `ML_DONTDRAW`.
It exports no entities, items, or simulation mutator and does not alter the
engine automap path.

## P6-058 detached native HUD and full-view delta

P6-058 adds `SFHS_MOBILE_DETACHED_HUD`, enabled only by the Android single-file
profile under Emscripten. When enabled, `R_SetViewSize` and its application seam
use screenblocks 11 without changing the persisted configuration value; the
automap uses the complete 320x200 logical surface; and SDL presentation uses the
raw 8:5 logical height without rewriting `aspect_ratio_correct`.

The existing Doom status implementation draws its original WAD graphics and
widgets into a Doom-owned 320x200 scratch buffer, restores the active video
target and private status flags, then publishes only rows 168-199 as a
palette-correct 320x32 RGBA snapshot. `I_SetPalette` supplies the exact active
gamma-adjusted PLAYPAL colors. Native builds do not compile this module or
define the flag; a clean Debug native link with the flag explicitly OFF passes.
No simulation, tic, RNG, save, demo, compatibility, or configuration-format
path changes.

## P6-059 4:3 presentation and editor-layout delta

P6-059 changes no C, CMake, native, Wasm interface, simulation, renderer, or
shared-SFHS source. The V11 shell keeps SDL's main canvas backing at 320x200 and
uses a CSS-only non-square-pixel transform to present portrait at 4:3. It also
moves the existing editor form into the minimap grid region during edit mode so
the separate control deck remains unobstructed. The detached native HUD remains
320x32 and the accepted mobile-controls package, profile schema, persistence
key, and input routing are unchanged.

## P2-050 multi-file Wasm boundary

The P2-040 unmodified Chocolate Doom target links directly under Emscripten
6.0.5 and emits `chocolate-doom.js` plus `chocolate-doom.wasm`. P2-050 keeps
that upstream source path intact and adds only the bounded multi-file build
orchestration, manifest hashing, and loopback shell contract. No `src/doom/**`
file, gameplay rule, renderer, commercial data, or single-file packaging path
is changed.
