## DOOM-P7-020 — Package deterministic capsule payloads

**Intelligence:** CODEX
**Phase:** P07
**Status:** PASS
**Depends on:** DOOM-P7-010
**Branch:** `feature/p7a-forge-runtime`
**Allowed files/directories:** `tools/package-forge-capsule.py`, `tools/validate-forge-capsule.py`, `tests/test_p7_forge_contract.py`, `dist/sfhs-doom-forge-v1.html`, `test-results/P07/P7-A/**`
**Parallel:** No
**Remote authorization:** NONE

### Goal

Produce deterministic full and thin `sfhs.doom-capsule@1` artifacts.

### Context

The public manifest has seven exact top-level records and one P7-A payload/base/recipe.

### Constraints

Gzip level 9 uses timestamp zero; chunks are ordered non-executable text; thin carries no payload chunks.

### Work

1. Hash and gzip Freedoom deterministically.
2. Emit 196,608-byte compressed chunks and canonical manifest.
3. Validate full/thin structure and exact identities.

### Exact verification

```text
python tools/validate-forge-capsule.py ARTIFACT --mode full|thin
Repackage and compare exact bytes.
```

### Acceptance

Full and thin validate and same-environment repackaging is byte-identical.

### Evidence output

- `test-results/P07/P7-A/deterministic-rebuild.html`

### Stop/block conditions

Stop for non-determinism, manifest ambiguity, or commercial content.

### Commit

One focused implementation commit begins with `DOOM-P7-020`.
