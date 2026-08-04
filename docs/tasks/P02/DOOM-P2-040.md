## DOOM-P2-040 — Record first upstream wasm link probe

**Intelligence:** LUNA-H  
**Phase:** P02  
**Depends on:** DOOM-P2-030  
**Branch:** phase/p02-wasm-feasibility  
**Allowed files/directories:** .agent/task-state.json; docs/reports/WASM_UPSTREAM_LINK_PROBE.md; docs/results/P02/DOOM-P2-040.md; evidence/logs/P02/P2-040/**; evidence/task-runs/P02-DOOM-P2-040/**; tests/test_wasm_link_probe.py; tools/probe-wasm-link.sh  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Run the first unmodified-source multi-file Wasm link probe and precisely classify its result for the bounded P2-050 adapter boundary.

### Constraints

Do not patch source, replace SDL, redesign gameplay/renderer, use commercial data, or claim direct success without a local-server result.

### Work

Attempt the `chocolate-doom` link using verified open Freedoom Phase 2 data, capture all compile/link output, symbols, flags, file set, sizes, and local-server load, classify every issue, and write a precise P2-050 repair map. Do not patch source.

### Exact verification

    bash tools/probe-wasm-link.sh
    python -m unittest tests.test_wasm_link_probe
    python tools/taskctl.py validate

### Acceptance

Direct success or a fully captured bounded adapter failure passes; gameplay/renderer redesign, SDL replacement, or source/toolchain abandonment is an architecture blocker.

### Stop/block conditions

Stop as an architecture blocker if the failure exceeds P2-050’s adapter boundary or requires gameplay/renderer changes.

### Evidence output

`docs/reports/WASM_UPSTREAM_LINK_PROBE.md`; `evidence/logs/P02/P2-040/**`; `evidence/task-runs/P02-DOOM-P2-040/**`.

### Commit

DOOM-P2-040 record first upstream wasm link probe
