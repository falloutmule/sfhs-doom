## DOOM-P7-030 — Verify and mount declared payloads

**Intelligence:** CODEX
**Phase:** P07
**Status:** PASS
**Depends on:** DOOM-P7-020
**Branch:** `feature/p7a-forge-runtime`
**Allowed files/directories:** `web/p7/forge-shell.html`, `browser-tests/tests/p7a-forge-runtime.spec.mjs`, `test-results/P07/P7-A/**`
**Parallel:** No
**Remote authorization:** NONE

### Goal

Stream, verify, and mount the declared full or thin payload before launch.

### Context

Full uses browser gzip streaming; thin accepts only exact Freedoom Phase 2 selected locally.

### Constraints

Validate exact nested structures and finite sizes; incremental SHA-256; sequential MEMFS writes; remove partial files on all failures.

### Work

1. Validate the manifest and references.
2. Stream embedded or local bytes into a temporary MEMFS file.
3. Verify encoded/decoded size/hash and atomically rename.
4. Reject corruption and unsupported platforms without main.

### Exact verification

```text
Playwright P7-A full/thin plus bad schema/hash/order/duplicate/missing/corrupt/gzip/wrong-base cases.
```

### Acceptance

Exact data mounts; every tested failure is visible, recoverable, and leaves main count zero and no partial file.

### Evidence output

- `test-results/P07/P7-A/full-portrait-auto.json`
- `test-results/P07/P7-A/thin-exact-base.json`

### Stop/block conditions

Stop if verification requires full duplicate decoded buffers or if failure can launch.

### Commit

One focused implementation commit begins with `DOOM-P7-030`.
