## DOOM-P2-085 — Compare native and wasm Oracle checkpoints

**Intelligence:** LUNA-H  
**Phase:** P02  
**Depends on:** DOOM-P2-080  
**Branch:** phase/p02-wasm-feasibility  
**Allowed files/directories:** .agent/task-state.json; browser-tests/tests/parity.spec.mjs; browser-tests/support/**; web/p2/**; src/sfhs_oracle/sfhs_oracle.c; src/sfhs_oracle/sfhs_oracle.h; tools/run-wasm-oracle.mjs; tools/run-native-p2-control.sh; tools/compare-native-wasm.py; tests/test_native_wasm_compare.py; docs/COMPATIBILITY_MATRIX.md; docs/UPSTREAM_DELTA.md; docs/reports/NATIVE_WASM_PARITY.md; docs/results/P02/DOOM-P2-085.md; evidence/logs/P02/P2-085/**; evidence/task-runs/P02-DOOM-P2-085/**  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Compare the same accepted source, open data, configuration, demo, DeHackEd fixture, arguments, checkpoint tics, scalar fields, and raw 320×200 indexed frames across native, Chromium, and Firefox.

### Constraints

Do not change accepted Oracle fields or meanings, edit `src/doom/**`, normalize differences, claim PWAD-order parity, or compare timing/heap/address artifacts.

### Work

Run a fresh native P2 control; run five independent Chromium and three Firefox Oracle processes; extract state and frames from MEMFS; compare repeated runs and all lanes exactly; run targeted DeHackEd parity; classify differences before repair. Exclude timing, heap layout, addresses, and PWAD-order claims. No `src/doom/**` edits or observer semantic changes.

### Exact verification

    bash tools/run-native-p2-control.sh
    node tools/run-wasm-oracle.mjs --browser chromium --repeat 5
    node tools/run-wasm-oracle.mjs --browser firefox --repeat 3
    python tools/compare-native-wasm.py <P2 run set>
    python -m unittest tests.test_native_wasm_compare
    cd browser-tests && npx playwright test tests/parity.spec.mjs --workers=1
    python tools/taskctl.py validate

### Acceptance

Fresh native controls equal P1; Chromium five-run and Firefox three-run sets are stable and exactly native-equal for accepted state/frame fields; DeHackEd effect matches; no normalization or PWAD-order claim. Any unresolved Chromium divergence blocks; Firefox divergence cannot be a full PASS.

### Stop/block conditions

Stop for unresolved Chromium divergence, unresolved required Firefox divergence, observer semantic changes, actual state/frame normalization, or any source edit outside the adapter boundary.

### Evidence output

`docs/reports/NATIVE_WASM_PARITY.md`; `evidence/logs/P02/P2-085/**`; `evidence/task-runs/P02-DOOM-P2-085/**`.

### Commit

DOOM-P2-085 compare native and wasm oracle checkpoints
