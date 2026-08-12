## DOOM-P7-001 — Adopt Forge authority

**Intelligence:** CODEX
**Phase:** P07
**Status:** PASS
**Depends on:** DOOM-P7-000
**Branch:** `feature/p7a-forge-runtime`
**Allowed files/directories:** `docs/FORGE_SPEC.md`, `docs/PROJECT_SPEC.md`, `docs/CURRENT_STATE.md`, `docs/phases/P07/**`, `docs/tasks/P07/**`, `docs/results/P07/**`, `test-results/P07/P7-A/**`
**Parallel:** No
**Remote authorization:** NONE

### Goal

Adopt the supplied complete Forge specification and supersede the unexecuted P7 audio roadmap.

### Context

P6 already established accepted self-contained audio. The attached Forge specification defines P7-A through P7-J.

### Constraints

No source, workflow, generated artifact, native/shared file, or protected V8–V16 artifact changes.

### Work

1. Check in the supplied specification byte-for-byte.
2. Replace the obsolete P7 summary.
3. Freeze P7-A cards and publication boundary.

### Exact verification

```text
Compare attachment/repository SHA-256; git diff --check; verify V8–V16 hashes.
```

### Acceptance

Authority is exact and governance is internally consistent.

### Evidence output

- `docs/results/P07/DOOM-P7-001.md`

### Stop/block conditions

Stop for a spec hash mismatch or protected-byte mutation.

### Commit

One local commit only: `DOOM-P7-001 adopt Forge product authority`.
