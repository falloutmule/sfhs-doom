## DOOM-P0-020 — Install the authoritative specification and governance documents

**Intelligence:** LUNA-L  
**Phase:** P00  
**Depends on:** DOOM-P0-010  
**Branch:** `phase/p00-governance`  
**Allowed files/directories:** `docs/PROJECT_SPEC.md`; `docs/DECISIONS.md`; `docs/CURRENT_STATE.md`; `docs/UPSTREAM_DELTA.md`; `docs/COMPATIBILITY_MATRIX.md`; `docs/ISSUE_LOG.md`; `docs/phases/P00/**`; `docs/tasks/P00/**`; `docs/results/P00/DOOM-P0-001.md`; `docs/results/P00/DOOM-P0-020.md`  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Install the accepted v1.0 specification and complete P00 repository memory so later workers do not depend on chat history.

### Context

Accepted specification SHA-256:

```text
05bba8c84cb3618882e334c406ddce67f3356154ebc41bb37f38d33de9c6fa6c
```

Do not paraphrase or redesign it during installation.

### Constraints

- Do not modify engine source, upstream build files, or upstream documentation.
- Do not silently “correct” or broaden the accepted specification.
- Preserve the exact accepted product boundary.
- Do not claim any build, toolchain, browser, content, or compatibility result that has not happened.
- Do not perform remote operations.

### Work

1. Verify branch, HEAD, clean tree, and DOOM-P0-010 result.
2. Install the supplied accepted file as `docs/PROJECT_SPEC.md`.
3. Install this plan as `docs/phases/P00/PHASE_PLAN.md` and split all P00 task cards into `docs/tasks/P00/DOOM-P0-*.md`.
4. Create `docs/DECISIONS.md` with the complete ADR table and explicit acceptance of ADR-011 through ADR-014 dated 2026-08-02. Preserve ADR-010 as reversible.
5. Create `docs/CURRENT_STATE.md` containing only verified reality: P0-001/P0-010 complete, upstream tag/SHA/branch, no builds, no commercial data, no remote action, next task P0-030.
6. Create `docs/UPSTREAM_DELTA.md` with zero engine delta and a future-entry schema: task, commit, paths, reason, native effect, Wasm effect, tests, disposition.
7. Create `docs/COMPATIBILITY_MATRIX.md` as a non-claiming skeleton. Mark every runtime row `UNTESTED`.
8. Create `docs/ISSUE_LOG.md` with issue fields and state that no product issue has yet been observed.
9. Create `docs/results/P00/DOOM-P0-001.md` and `docs/results/P00/DOOM-P0-020.md`; use `Result commit: SELF` for P0-020.
10. Commit:

```text
DOOM-P0-020 install authoritative project and phase documents
```

### Exact verification

```bash
python - <<'PY'
from pathlib import Path
import hashlib
p = Path('docs/PROJECT_SPEC.md')
assert p.exists()
assert hashlib.sha256(p.read_bytes()).hexdigest() == '05bba8c84cb3618882e334c406ddce67f3356154ebc41bb37f38d33de9c6fa6c'
required = [
 'docs/DECISIONS.md', 'docs/CURRENT_STATE.md', 'docs/UPSTREAM_DELTA.md',
 'docs/COMPATIBILITY_MATRIX.md', 'docs/ISSUE_LOG.md',
 'docs/phases/P00/PHASE_PLAN.md',
 *[f'docs/tasks/P00/DOOM-P0-{n}.md' for n in ('001','010','020','030','040','050','060','070','080','090')],
 'docs/results/P00/DOOM-P0-001.md', 'docs/results/P00/DOOM-P0-020.md',
]
for item in required:
    assert Path(item).is_file(), item
text = Path('docs/DECISIONS.md').read_text(encoding='utf-8')
for adr in ('ADR-011','ADR-012','ADR-013','ADR-014'):
    assert adr in text and 'Accepted' in text
print('P0_DOCUMENT_INSTALL PASS')
PY

git diff --name-only "$UPSTREAM_BASE_SHA"...HEAD
git status --short
```

### Acceptance

- Specification byte hash matches.
- All required P00 documents/cards exist.
- Accepted decisions are explicit.
- Current-state and compatibility docs make no untested success claims.
- Upstream engine delta remains zero.
- One local commit exists; no remote write occurred.

### Evidence output

- `docs/results/P00/DOOM-P0-020.md`
- installed authoritative documents

### Stop/block conditions

Stop for hash mismatch, missing baseline, existing user work that would be overwritten, card/spec conflict, or any engine-source modification.

### Commit

One local commit only. No amend or remote action.
