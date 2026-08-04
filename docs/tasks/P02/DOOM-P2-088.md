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

### Exact verification

    python tools/verify-p2-gate.py
    python tools/taskctl.py validate
    python tools/validate_project_docs.py
    python -m unittest discover -s tests -p "test_*.py"
    cd browser-tests && npx playwright test --workers=1
    git branch --show-current
    git log --oneline 0c8e1288a23e7306fa5760c1aadbf54de8d0b85c..HEAD
    git diff --name-status 0c8e1288a23e7306fa5760c1aadbf54de8d0b85c..HEAD
    git status --short
    git remote -v

### Acceptance

Eleven exact P2 builder commits exist; the P2 gate prints PASS; all required browser lanes and exact parity pass; real gesture audio is evidenced; artifacts are multi-file; no external requests or commercial data; P2-090 remains pending.

### Stop/block conditions

Stop for missing manifests, failed subordinate gates, dirty tree, wrong locks, browser/parity failures, native drift, external requests, or P2-090 self-approval.

### Evidence output

`docs/phases/P02/PHASE_RESULT.md`; `docs/reports/WASM_FEASIBILITY_BASELINE.md`; `evidence/manifests/P02/**`; `evidence/phase-gates/P02/**`; `evidence/reports/P02/**`; `evidence/task-runs/P02-DOOM-P2-088/**`.

### Commit

DOOM-P2-088 assemble wasm feasibility phase gate
