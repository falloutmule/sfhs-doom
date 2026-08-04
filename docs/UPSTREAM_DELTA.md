# Upstream Delta

**Current engine delta:** one compile-time-gated P01 test observer; ordinary builds remain behaviorally unchanged
**Upstream base:** Chocolate Doom `chocolate-doom-3.1.1` at `410d96855b5df5410ff591a90efeafa889119224`

P00 governance files do not alter engine behavior, native build behavior, or future Wasm behavior.

## Verified entries

| Task | Commit | Paths | Reason | Native effect | Wasm effect | Tests | Disposition |
|---|---|---|---|---|---|---|---|
| DOOM-P0-010 | `69375a29555d2523f8ae435900dc35245c9c0b58` | `docs/bootstrap/REPOSITORY_BASELINE.md`; `docs/results/P00/DOOM-P0-010.md` | Record clean upstream base and branch | None | None | Branch, ancestry, changed-path, remote, and clean-tree checks | Accepted P00 governance change |
| DOOM-P1-080 | `SELF` | `src/CMakeLists.txt`; `src/doom/d_main.c`; `src/doom/g_game.c`; `src/sfhs_oracle/**` | Emit deterministic test-only native logical-state and indexed-frame checkpoints | Active only with `SFHS_ORACLE_TEST=ON`; OFF build completes the same 140-tic demo and emits no oracle artifacts | Not selected or tested in P01 | Clean Oracle build; five repeated processes; PWAD order; DeHackEd effect; OFF regression; demo/timedemo regressions | Accepted P01 test-only observer pending containing commit |

## Future entry schema

Every future upstream delta must record:

| Task | Commit | Paths | Reason | Native effect | Wasm effect | Tests | Disposition |
|---|---|---|---|---|---|---|---|
| `<TASK-ID>` | `<SHA or SELF>` | `<repository-relative paths>` | `<why the delta is required>` | `<verified effect or none>` | `<verified effect or none>` | `<exact commands/results>` | `<accepted, rejected, or pending>` |

Engine-source or upstream-build changes were not permitted in P00. The P1-080
delta is compile-time gated, observes only, and is absent from ordinary builds.
