## DOOM-P7-060 — Add the P7-B local analyzer

**Intelligence:** CODEX
**Phase:** P07
**Status:** PASS
**Depends on:** DOOM-P7-050
**Branch:** `codex/p7b-local-wad-inspection`
**Allowed files/directories:** `web/p7/**`, `tools/build-forge-capsule.sh`, `tools/package-forge-capsule.py`, `tools/validate-forge-capsule.py`, `tests/test_p7_forge_contract.py`, `browser-tests/tests/p7b-local-analyzer.spec.mjs`, `.github/workflows/p6-candidate-pages.yml`, `dist/sfhs-doom-forge-v2.html`, `docs/phases/P07/PHASE_PLAN.md`, `docs/tasks/P07/DOOM-P7-060.md`, `docs/results/P07/DOOM-P7-060.md`, `docs/reports/P07_LOCAL_ANALYZER.md`, `docs/CURRENT_STATE.md`, `evidence/manifests/P07/**`, `test-results/P07/P7-B/**`
**Parallel:** No
**Remote authorization:** NONE

### Goal

Add local WAD/ZIP selection, SHA-256 identity, bounds-checked parsing,
compatibility signals, and a phone-ready inspection card to a distinct Forge V2
candidate while preserving Forge V1 and the V16 player.

### Context

P7-A published a verified content-independent engine and exact Freedoom capsule.
P7-B analyzes untrusted local content without upload, persistence, mounting, or
launching it. Recipe construction and arbitrary-content launch remain P7-C.

### Constraints

Treat every selected byte as untrusted. Use a worker, enforce input/file/expanded
size and count limits, reject ZIP traversal and malformed bounds, never execute
archive content, and never let inspection invoke main. Preserve the single-file
offline artifact, built-in Freedoom launch, V16 controls/HUD/audio/renderers, and
all protected V8–V16 and Forge V1 bytes.

### Work

1. Add an embedded analyzer worker and strict WAD/ZIP parser.
2. Hash input and extracted WADs with SHA-256 and classify bounded signals.
3. Present an accessible, internally scrollable phone inspection card.
4. Add synthetic, permissive-fixture, malformed, security, responsiveness, and
   P7-A parity tests.
5. Generate and validate `dist/sfhs-doom-forge-v2.html` officially.

### Exact verification

```text
tools/build-forge-capsule.sh --capsule-version 2 --output dist/sfhs-doom-forge-v2.html
python tools/validate-forge-capsule.py dist/sfhs-doom-forge-v2.html --mode full --capsule-version 2
python -m unittest tests.test_p7_forge_contract -v
Playwright P7-B analyzer and unchanged P7-A/V16 focused lanes
exact protected artifact hashes; deterministic rebuild; git diff --check
```

### Acceptance

Valid WAD/ZIP fixtures produce accurate local-only inspection records; malformed,
traversal, encrypted, oversized, and expansion-abuse inputs fail closed; the UI
is usable at 360×800 and 915×412; analysis cannot mount or launch selected bytes;
and built-in V16 play remains unchanged.

### Evidence output

- `test-results/P07/P7-B/**`
- `evidence/manifests/P07/sfhs-doom-forge-v2.json`
- `docs/results/P07/DOOM-P7-060.md`

### Stop/block conditions

Stop for required native/shared-control changes, arbitrary-file launch, external
runtime dependencies, commercial content, protected-byte drift, parser escape,
unbounded memory behavior, or authority beyond a focused local commit.

### Commit

One focused local implementation commit begins with `DOOM-P7-060`.
