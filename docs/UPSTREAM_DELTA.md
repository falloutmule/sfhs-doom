# Upstream Delta

**Current engine delta:** one compile-time-gated P01 test observer; ordinary builds remain behaviorally unchanged
**Upstream base:** Chocolate Doom `chocolate-doom-3.1.1` at `410d96855b5df5410ff591a90efeafa889119224`

P00 governance files do not alter engine behavior, native build behavior, or future Wasm behavior.

## Verified entries

| Task | Commit | Paths | Reason | Native effect | Wasm effect | Tests | Disposition |
|---|---|---|---|---|---|---|---|
| DOOM-P0-010 | `69375a29555d2523f8ae435900dc35245c9c0b58` | `docs/bootstrap/REPOSITORY_BASELINE.md`; `docs/results/P00/DOOM-P0-010.md` | Record clean upstream base and branch | None | None | Branch, ancestry, changed-path, remote, and clean-tree checks | Accepted P00 governance change |
| DOOM-P1-080 | `ac9d51be7ec28162920212898ffec34b7315c913` | `src/CMakeLists.txt`; `src/doom/d_main.c`; `src/doom/g_game.c`; `src/sfhs_oracle/**` | Emit deterministic test-only native logical-state and indexed-frame checkpoints | Active only with `SFHS_ORACLE_TEST=ON`; OFF build completes the same 140-tic demo and emits no oracle artifacts | Not selected or tested in P01 | Clean Oracle build; five repeated processes; PWAD order; DeHackEd effect; OFF regression; demo/timedemo regressions | Accepted P01 test-only observer |
| DOOM-P2-080 | `SELF` | `cmake/SFHSWasm.cmake`; `tools/build-wasm.sh`; `web/p2/pre.js`; `web/p2/post.js`; `web/p2/shell.html`; browser/audio contracts | Export Emscripten main entrypoint and establish a bounded multi-file browser audio startup path | Native source unchanged; native controls remain outside this adapter | `INVOKE_RUN=0`; exported `_main`, `callMain`, `FS`, and `ENV`; trusted Start gesture gates audio; normal browser lanes use the same exported entrypoint after preload | Emscripten 6.0.5 clean rebuild; generated-JS export check; 6 boot/input tests; 2 Chromium/Firefox audio tests; contract tests | Accepted P2 shell/build adapter |

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

## P2-050 multi-file Wasm boundary

The P2-040 unmodified Chocolate Doom target links directly under Emscripten
6.0.5 and emits `chocolate-doom.js` plus `chocolate-doom.wasm`. P2-050 keeps
that upstream source path intact and adds only the bounded multi-file build
orchestration, manifest hashing, and loopback shell contract. No `src/doom/**`
file, gameplay rule, renderer, commercial data, or single-file packaging path
is changed.
