# TASK RESULT

**Task:** DOOM-P2-040  
**Status:** PASS  
**Base commit:** e8a1f708bd4e367f06d4077b54406b1e8bfaf74b  
Result commit: SELF  
**Branch:** phase/p02-wasm-feasibility

## What was done

- Ran the first unmodified-source `chocolate-doom` multi-file Emscripten link probe from the P2-030 configure tree.
- Verified open Freedoom Phase 2 data read-only and captured the compiler/link, symbols, flags, files, sizes, hashes, and loopback response.
- Generated only an ignored HTML wrapper for the linker output because upstream CMake emitted JavaScript/Wasm without an HTML shell.
- Classified the result as `DIRECT_SUCCESS`; no P2-050 source adapter was needed by this probe.

## What was verified

- `build_exit=0` for `cmake --build build/wasm/upstream-configure --target chocolate-doom --verbose`.
- Emscripten compiler: 6.0.5.
- Generated artifacts: `src/chocolate-doom.js` and `src/chocolate-doom.wasm`.
- Loopback server: `127.0.0.1:18740`; wrapper response HTTP 200; `local_server_load=PASS`.
- Probe classification: `DIRECT_SUCCESS`.
- No commercial data was used; only the existing verified open Freedoom Phase 2 IWAD was inspected.
- `python3 -m unittest -v tests.test_wasm_link_probe`: 4 tests, OK.
- `python3 tools/taskctl.py validate`: `VALIDATE PASS: task state and task cards are coherent`.
- No source, CMake, gameplay, renderer, remote, or parent-workspace path changed.

## What failed and bounded repairs

- The initial probe found no upstream HTML shell, so it correctly refused a direct-success claim. A generated ignored probe wrapper was added to the probe’s local build output only.
- Ephemeral Python server-port discovery was buffered and produced no load result. The probe was corrected to use fixed loopback port 18740; the subsequent response was HTTP 200 and the classification became `DIRECT_SUCCESS`.
- One test initially rejected the generated `src/chocolate-doom.js` output path; its assertion was narrowed to actual source mutation commands. All four focused tests then passed.

## Changed files

    .agent/task-state.json
    docs/reports/WASM_UPSTREAM_LINK_PROBE.md
    docs/results/P02/DOOM-P2-040.md
    evidence/logs/P02/P2-040/**
    evidence/task-runs/P02-DOOM-P2-040/**
    tests/test_wasm_link_probe.py
    tools/probe-wasm-link.sh

## Exact commands and results

- `bash tools/probe-wasm-link.sh`: `PROBE_WASM_LINK=PASS classification=DIRECT_SUCCESS`.
- `python3 -m unittest -v tests.test_wasm_link_probe`: 4 tests, OK.
- `python3 tools/taskctl.py validate`: PASS.

## Evidence paths

- `docs/reports/WASM_UPSTREAM_LINK_PROBE.md`
- `evidence/logs/P02/P2-040/`
- `evidence/task-runs/P02-DOOM-P2-040/`
- `tests/test_wasm_link_probe.py`

## Current exact state

P2-040 is a passing local candidate on `phase/p02-wasm-feasibility`. The unmodified upstream link boundary is directly successful, with a local-server load record. The next task is DOOM-P2-050.

## Remaining blocker or next task

No P2-040 blocker remains. Continue with DOOM-P2-050.

## Post-run Git status

To be verified clean after the single P2-040 commit.
