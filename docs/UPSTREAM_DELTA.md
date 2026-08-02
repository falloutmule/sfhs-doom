# Upstream Delta

**Current P00 engine delta:** zero  
**Upstream base:** Chocolate Doom `chocolate-doom-3.1.1` at `410d96855b5df5410ff591a90efeafa889119224`

P00 governance files do not alter engine behavior, native build behavior, or future Wasm behavior.

## Verified entries

| Task | Commit | Paths | Reason | Native effect | Wasm effect | Tests | Disposition |
|---|---|---|---|---|---|---|---|
| DOOM-P0-010 | `69375a29555d2523f8ae435900dc35245c9c0b58` | `docs/bootstrap/REPOSITORY_BASELINE.md`; `docs/results/P00/DOOM-P0-010.md` | Record clean upstream base and branch | None | None | Branch, ancestry, changed-path, remote, and clean-tree checks | Accepted P00 governance change |

## Future entry schema

Every future upstream delta must record:

| Task | Commit | Paths | Reason | Native effect | Wasm effect | Tests | Disposition |
|---|---|---|---|---|---|---|---|
| `<TASK-ID>` | `<SHA or SELF>` | `<repository-relative paths>` | `<why the delta is required>` | `<verified effect or none>` | `<verified effect or none>` | `<exact commands/results>` | `<accepted, rejected, or pending>` |

Engine-source or upstream-build changes are not permitted in P00.
