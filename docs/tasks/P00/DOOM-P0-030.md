## DOOM-P0-030 — Install the root AGENTS.md contract

**Intelligence:** LUNA-L  
**Phase:** P00  
**Depends on:** DOOM-P0-020  
**Branch:** `phase/p00-governance`  
**Allowed files/directories:** `AGENTS.md`; `docs/results/P00/DOOM-P0-030.md`  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Create concise root instructions that let a fresh Codex/Luna thread identify the goal, source of truth, workflow, prohibited actions, verification duty, and blocker protocol without historical chat.

### Context

This task creates `AGENTS.md`; the Phase P00 plan and this card are the authority for this run.

### Constraints

- Keep it operational, not encyclopedic.
- Do not duplicate the whole specification.
- Do not weaken compatibility, evidence, Git safety, commercial-data, or remote rules.
- If a root `AGENTS.md` already exists and is not this project’s contract, block instead of overwriting it.

### Work

Create `AGENTS.md` with required headings:

1. Project goal
2. Current phase/current goal
3. Source-of-truth read order
4. Compatibility invariant
5. Task execution protocol
6. Allowed/forbidden Git operations
7. Commercial data/privacy rule
8. Build/test/evidence rule
9. Generated artifact rule
10. Issue/blocker protocol
11. Remote operation boundary
12. Required result/commit format

It must explicitly state Chocolate Doom is authoritative, no modernization/JS rewrite, one writer by default, read card first, edit only allowed paths, no commercial WAD bytes, no required runtime network dependency, no generated-dist editing, exact verification/evidence, unknown changes block, destructive Git operations forbidden, remote writes require exact authority, commit subject starts with task ID, and result uses `SELF`.

Write the result and commit:

```text
DOOM-P0-030 install repository agent contract
```

### Exact verification

```bash
python - <<'PY'
from pathlib import Path
p = Path('AGENTS.md')
assert p.is_file()
t = p.read_text(encoding='utf-8').lower()
required = [
 'project goal', 'current phase', 'source-of-truth', 'compatibility invariant',
 'task execution', 'git', 'commercial', 'evidence', 'generated', 'blocker',
 'remote', 'self', 'docs/project_spec.md', 'docs/current_state.md',
 'docs/phases/p00/phase_plan.md', 'docs/tasks/p00/'
]
missing = [x for x in required if x not in t]
assert not missing, missing
for forbidden in ('git reset --hard', 'git clean', 'force push'):
    assert forbidden in t, forbidden
print('AGENTS_CONTRACT PASS')
PY

git diff --name-only HEAD~1..HEAD
git status --short
```

The result must answer, from only `AGENTS.md` and this card: project, phase, conflict authority, whether engine may change, whether commercial data may be committed, whether push is allowed, permitted files, completion proof, blocker conditions, and `SELF` meaning.

### Acceptance

- All required sections exist.
- Fresh-context questions are unambiguous.
- No project scope/source changed.
- One local commit exists and tree is clean.

### Evidence output

- `AGENTS.md`
- `docs/results/P00/DOOM-P0-030.md`

### Stop/block conditions

Existing root instructions, material spec/plan conflict, or unresolved architecture needed to write the contract.

### Commit

One local commit only. No remote action.
