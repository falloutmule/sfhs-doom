## DOOM-P7-050 — Gate and publish P7-A

**Intelligence:** CODEX
**Phase:** P07
**Status:** RUNNING
**Depends on:** DOOM-P7-040
**Branch:** `feature/p7a-forge-runtime`
**Allowed files/directories:** `.github/workflows/p6-candidate-pages.yml`, `browser-tests/tests/p7a-forge-runtime.spec.mjs`, `tests/test_p7_forge_contract.py`, `tools/validate-forge-capsule.py`, `evidence/manifests/P07/**`, `docs/results/P07/**`, `docs/CURRENT_STATE.md`, `dist/sfhs-doom-forge-v1.html`, `test-results/P07/P7-A/**`
**Parallel:** No
**Remote authorization:** Push focused branch, open PR, merge after green gate, publish exact V16 root and Forge `/forge/`, and verify live hashes.

### Goal

Complete local/CI gates and publish exact dual-route candidates.

### Context

Pages is V15; V16 publication was intentionally deferred and is combined with the Forge preview operation.

### Constraints

No tags/releases, force push, unrelated cleanup, or merge on failed CI. Forge remains physically pending.

### Work

1. Run exact/static/browser/native/package gates.
2. Record manifest/results and commit cleanly.
3. Push, PR, wait for green CI, merge minimally, and wait for Pages.
4. Download and hash both live routes.

### Exact verification

```text
Exact local hash checks; git diff --check; YAML parse; PR check; live download byte/hash comparison.
```

### Acceptance

All required gates pass and both live routes exactly match committed artifacts.

### Evidence output

- `evidence/manifests/P07/sfhs-doom-forge-v1.json`
- `docs/results/P07/DOOM-P7-050.md`

### Stop/block conditions

Stop before merge for failed required CI, unexpected remote work, protected drift, or publication hash mismatch.

### Commit

One focused final implementation commit begins with `DOOM-P7-050`.
