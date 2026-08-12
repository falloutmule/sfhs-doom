## DOOM-P7-000 — Freeze P7-A execution

**Intelligence:** CODEX
**Phase:** P07
**Status:** PASS
**Depends on:** DOOM-P6-064
**Branch:** `feature/p7a-forge-runtime`
**Allowed files/directories:** `docs/phases/P07/**`, `docs/tasks/P07/**`, `docs/results/P07/**`
**Parallel:** No
**Remote authorization:** NONE

### Goal

Freeze the bounded P7-A graph and protected V16 baseline.

### Context

The user selected P7-A Forge runtime and combined V16/Forge publication.

### Constraints

No product changes or remote actions.

### Work

1. Record scope, dependencies, paths, failure audit, evidence, and exit gate.

### Exact verification

```text
Validate the P7 phase tree and protected artifact identities.
```

### Acceptance

A fresh worker can execute P7-A without reopening product authority.

### Evidence output

- `docs/phases/P07/PHASE_PLAN.md`

### Stop/block conditions

Stop for ambiguous authority or overlap with native/shared work.

### Commit

Included in the governance commit beginning with `DOOM-P7-001`.
