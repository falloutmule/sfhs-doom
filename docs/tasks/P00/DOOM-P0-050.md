## DOOM-P0-050 — Implement the minimal local task-state helper

**Intelligence:** LUNA-M  
**Phase:** P00  
**Depends on:** DOOM-P0-040  
**Branch:** `phase/p00-governance`  
**Allowed files/directories:** `tools/taskctl.py`; `.agent/task-state.json`; `tests/test_taskctl.py`; `tests/fixtures/taskctl/**`; `docs/results/P00/DOOM-P0-050.md`  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Implement a small deterministic helper that shows, starts, finishes, blocks, validates, and reports task state without becoming an orchestrator or pretending tests passed.

### Constraints

- Python standard library only.
- No daemon, scheduler, model invocation, GitHub API, network, database, or background process.
- Task cards remain authoritative.
- Preserve unknown fields.
- Never run arbitrary commands from task data.
- Do not mark done unless dependencies are done, branch matches, result exists, and commit identity is supplied.
- Accept `SELF` as the exact pending-containing-commit sentinel.

### Work

Implement:

```text
python tools/taskctl.py status
python tools/taskctl.py show DOOM-Px-yyy
python tools/taskctl.py start DOOM-Px-yyy
python tools/taskctl.py finish DOOM-Px-yyy --commit <sha|SELF>
python tools/taskctl.py block DOOM-Px-yyy --report <path>
python tools/taskctl.py validate
python tools/taskctl.py verify-head DOOM-Px-yyy
```

Required behavior:

1. Read `.agent/task-state.json` and recorded task-card paths.
2. Validate unique IDs, known statuses, dependencies, acyclic graph, card existence, branch contract, result path.
3. Compute ready from dependencies while preserving explicit blocked state.
4. `show` prints status, dependencies, card, allowed paths, legal transitions.
5. `start` refuses wrong branch, unmet dependencies, invalid state, or dirty out-of-scope changes; records start time/base HEAD.
6. `finish` requires running state, result file, task-owned staged changes, and commit token; records done but does not create commit.
7. `block` requires a blocker report and never claims completion.
8. `verify-head` confirms HEAD subject begins with task ID and result exists; resolves `SELF` to HEAD.
9. Initialize real P00 state with P0-001 through P0-040 done, P0-050 completed via `SELF`, and later tasks pending/ready.
10. Use atomic state writes.
11. Add temporary-repository tests for lifecycle, unmet dependency, wrong branch, missing report, block, cycle, `SELF`, verify-head, dirty out-of-scope path.
12. Write result, run `finish ... --commit SELF`, commit:

```text
DOOM-P0-050 add bounded local task-state helper
```

Then run `verify-head`.

### Exact verification

```bash
python -m unittest -v tests/test_taskctl.py
python tools/taskctl.py validate
python tools/taskctl.py status
python tools/taskctl.py show DOOM-P0-060
python tools/taskctl.py verify-head DOOM-P0-050
git status --short
```

Tests must fail for cycle, wrong branch, missing result, invalid finish state, unknown task, invalid commit token, and dirty out-of-scope path.

### Acceptance

All commands work, real P00 state validates, `SELF` avoids amend/two commits, helper does not claim product correctness, one clean commit.

### Evidence output

- `docs/results/P00/DOOM-P0-050.md`
- unit-test and real-status output

### Stop/block conditions

Unsafe Git inspection, ambiguous allowed-path syntax, third-party dependency requirement, or unreconcilable earlier task history.

### Commit

One local commit only. No remote action.
