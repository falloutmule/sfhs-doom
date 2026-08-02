## DOOM-P0-040 — Install planning, task, result, and blocker templates

**Intelligence:** LUNA-L  
**Phase:** P00  
**Depends on:** DOOM-P0-030  
**Branch:** `phase/p00-governance`  
**Allowed files/directories:** `.agent/PLANS.md`; `docs/templates/**`; `tools/validate_project_docs.py`; `tests/test_project_docs.py`; `docs/results/P00/DOOM-P0-040.md`  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Create stable, machine-checkable Markdown contracts for phase plans, task cards, task results, phase results, blockers, and gate verdicts.

### Constraints

- Python standard library only.
- Validation checks structure; it does not prove implementation correctness.
- Templates remain readable Markdown.
- Do not weaken cards to satisfy the validator.
- Do not touch engine source.

### Work

1. Create `.agent/PLANS.md` covering Sol plan ownership, self-contained phases, repeated assumptions/ADRs, exit evidence, update-on-reality-change, planning-only no implementation, and checker no-repair.
2. Create:
   - `docs/templates/PHASE_PLAN.md`
   - `docs/templates/TASK.md`
   - `docs/templates/TASK_RESULT.md`
   - `docs/templates/PHASE_RESULT.md`
   - `docs/templates/BLOCKER.md`
   - `docs/templates/GATE_VERDICT.md`
3. Include intelligence, dependency, allowed-path, remote-authorization, exact-verification, acceptance, evidence, blocker, commit, and current-state fields where applicable.
4. Document `SELF` in result templates.
5. Implement `tools/validate_project_docs.py` supporting `--templates`, `--task <path>`, `--phase <path>`, and `--all`.
6. Validator returns nonzero with precise missing-field messages.
7. Add valid/invalid temporary-fixture tests.
8. Write result and commit:

```text
DOOM-P0-040 add planning and evidence document contracts
```

### Exact verification

```bash
python tools/validate_project_docs.py --templates
python tools/validate_project_docs.py --phase docs/phases/P00/PHASE_PLAN.md
for f in docs/tasks/P00/DOOM-P0-*.md; do python tools/validate_project_docs.py --task "$f"; done
python -m unittest -v tests/test_project_docs.py
python - <<'PY'
import subprocess, tempfile
from pathlib import Path
with tempfile.TemporaryDirectory() as d:
    p = Path(d) / 'bad.md'
    p.write_text('# incomplete\n', encoding='utf-8')
    r = subprocess.run(['python','tools/validate_project_docs.py','--task',str(p)])
    assert r.returncode != 0
print('INVALID_FIXTURE_REJECTED PASS')
PY

git status --short
```

### Acceptance

All templates/cards validate, invalid fixture fails usefully, standard library only, one clean commit, no source change.

### Evidence output

- validator output
- `docs/results/P00/DOOM-P0-040.md`

### Stop/block conditions

Incompatible existing schema, accepted card semantics would need changing, or a third-party dependency appears necessary.

### Commit

One local commit only. No remote action.
