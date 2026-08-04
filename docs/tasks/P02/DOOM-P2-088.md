## DOOM-P2-088 — Assemble wasm feasibility phase gate

**Intelligence:** LUNA-M  
**Phase:** P02  
**Depends on:** DOOM-P2-085  
**Branch:** phase/p02-wasm-feasibility  
**Allowed files/directories:** .agent/task-state.json; docs/BUILD_IDENTITY.md; docs/COMPATIBILITY_MATRIX.md; docs/CURRENT_STATE.md; docs/ISSUE_LOG.md; docs/phases/P02/PHASE_RESULT.md; docs/reports/WASM_FEASIBILITY_BASELINE.md; docs/results/P02/DOOM-P2-088.md; evidence/manifests/P02/**; evidence/phase-gates/P02/**; evidence/reports/P02/**; evidence/logs/P02/P2-088/**; evidence/task-runs/P02-DOOM-P2-088/**; tests/test_p2_gate.py; tools/verify-p2-gate.py  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Assemble the complete read-only P2 feasibility gate and preserve the independent P2-090 boundary.

### Constraints

No remote action, commercial data, strict single-file packaging, P2-090 self-approval, destructive Git operation, or claim broader than evidence.

### Work

Reverify source, locks, browser environment, builds, browser lanes, audio, native controls, parity, all unit tests, task/document validation, and manifests. Record sizes, requests, timings, memory, Asyncify behavior, errors, unsupported APIs, and exact source/CMake/adapter inventory. Create manifests, review packet, phase result, summary, and gate validator; set P2-090 ready and pending.

### Acceptance amendment

The complete Python discovery suite is diagnostic and non-blocking for this
phase. Its complete 131-test output must be preserved, and every failure or
error must be listed in `docs/ISSUE_LOG.md` and the P2 phase result with the
classifications `KNOWN_INFRASTRUCTURE_DEBT`, `NOT_PRODUCT_BEHAVIOR_EVIDENCE`,
and `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR`. The global suite must not
be labeled PASS. Any focused P2 acceptance failure remains blocking.

The focused acceptance set is project-document validation, task-state
validation, all P2 artifact manifests, P2 gate regression tests, the eight
existing P2 browser regression tests, the existing P2 parity test,
`NATIVE_WASM_COMPARE=PASS`, exact Chromium/Firefox boot/input/audio evidence,
exact native/Wasm state and framebuffer parity, clean lineage/remotes, no
external runtime requests, no commercial data, no single-file packaging, and
DOOM-P2-090 pending.

### Exact verification

    python tools/verify-p2-gate.py
    python tools/taskctl.py validate
    python tools/validate_project_docs.py
    python -m unittest tests.test_p2_gate
    python tools/validate_artifact_manifest.py evidence/manifests/P02/phase1-debug.json
    python tools/validate_artifact_manifest.py evidence/manifests/P02/phase2-debug.json
    python tools/validate_artifact_manifest.py evidence/manifests/P02/phase2-oracle.json
    git branch --show-current
    git log --oneline 0c8e1288a23e7306fa5760c1aadbf54de8d0b85c..HEAD
    git diff --name-status 0c8e1288a23e7306fa5760c1aadbf54de8d0b85c..HEAD
    git status --short
    git remote -v

The global discovery command remains recorded diagnostically as:

    python -m unittest discover -s tests -p "test_*.py"

It is not a P2 gate condition. The final focused gate prints
`SFHS_DOOM_P2_WASM_FEASIBILITY_GATE=PASS_WITH_RECORDED_LIMITATIONS`.

### Acceptance

The eleven exact P2 builder commits exist; the focused P2 gate prints
`PASS_WITH_RECORDED_LIMITATIONS`; all required browser lanes and exact parity
pass; real gesture audio is evidenced; artifacts are multi-file; no external
requests or commercial data; and P2-090 remains pending.

### Stop/block conditions

Stop for missing manifests, failed subordinate gates, dirty tree, wrong locks, browser/parity failures, native drift, external requests, or P2-090 self-approval.

### Evidence output

`docs/phases/P02/PHASE_RESULT.md`; `docs/reports/WASM_FEASIBILITY_BASELINE.md`; `evidence/manifests/P02/**`; `evidence/phase-gates/P02/**`; `evidence/reports/P02/**`; `evidence/task-runs/P02-DOOM-P2-088/**`.

### Commit

DOOM-P2-088 assemble wasm feasibility phase gate
