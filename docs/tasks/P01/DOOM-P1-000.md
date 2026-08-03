## DOOM-P1-000 — Install and activate the P1 phase

**Intelligence:** LUNA-L
**Phase:** P01
**Depends on:** DOOM-P0-070
**Branch:** phase/p01-native-oracle
**Allowed files/directories:** .agent/task-state.json; docs/CURRENT_STATE.md; docs/ISSUE_LOG.md; docs/phases/P01/PHASE_PLAN.md; docs/tasks/P01/DOOM-P1-000.md; docs/tasks/P01/DOOM-P1-010.md; docs/tasks/P01/DOOM-P1-020.md; docs/tasks/P01/DOOM-P1-030.md; docs/tasks/P01/DOOM-P1-040.md; docs/tasks/P01/DOOM-P1-050.md; docs/tasks/P01/DOOM-P1-060.md; docs/tasks/P01/DOOM-P1-070.md; docs/tasks/P01/DOOM-P1-080.md; docs/tasks/P01/DOOM-P1-085.md; docs/tasks/P01/DOOM-P1-090.md; docs/results/P01/DOOM-P1-000.md; tools/taskctl.py; tests/test_taskctl.py; tools/validate_project_docs.py; tests/test_project_docs.py
**Parallel:** No
**Remote authorization:** NONE

### Goal

Materialize the frozen P1 phase and transition from P0 governance to local native-oracle engineering without changing the accepted specification or engine.

### Constraints

- Verify the exact P0-070 starting state before mutation.
- Keep P0-080 and P0-090 pending/deferred.
- Do not modify docs/PROJECT_SPEC.md, engine files, build files, or remotes.
- Runtime compatibility claims remain UNTESTED until directly proven.
- One-time user amendment authorizes tools/taskctl.py and tests/test_taskctl.py solely for phase-aware task/result resolution while preserving the CLI and P00 behavior.
- A second narrow user amendment authorizes tools/validate_project_docs.py and tests/test_project_docs.py solely for phase-aware project-document discovery and validation while preserving the P00 contract and CLI.

### Work

Install the phase plan, all eleven cards, task-state entries, current-state transition, and deferred P0 record. Confirm phase/p01-native-oracle is based directly on P0-070 and set P1-010 ready by dependency order. Write the result with Result commit: SELF.

### Exact verification

    git branch --show-current
    git status --short
    git remote -v
    git merge-base --is-ancestor 804ddb9ae855b65aeec922cd5f531c672b9b2c5f HEAD
    python tools/validate_project_docs.py
    python tools/taskctl.py validate
    python -m unittest tests.test_project_docs tests.test_taskctl

Additionally confirm all eleven P1 cards exist, P0-080/P0-090 are not done, P1-010 is ready, and no engine/build-system path changed.

### Acceptance

Branch, plan, cards, state, deferred-task record, exact dependency order, and clean one-commit result all pass. No remote action occurs.

### Evidence output

- docs/phases/P01/PHASE_PLAN.md
- docs/tasks/P01/DOOM-P1-*.md
- docs/results/P01/DOOM-P1-000.md

### Stop/block conditions

Any starting-state mismatch, unrelated change, missing P0-070 result, accepted-specification edit requirement, task-state inconsistency, or unauthorized remote/source change.

### Commit

One local commit only: DOOM-P1-000 install continuous native-oracle phase.
