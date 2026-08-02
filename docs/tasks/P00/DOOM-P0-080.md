## DOOM-P0-080 — Produce the P00 phase candidate and one authorized draft PR

**Intelligence:** LUNA-L + HUMAN AUTHORIZATION  
**Phase:** P00  
**Depends on:** DOOM-P0-070  
**Branch:** `phase/p00-governance`  
**Allowed files/directories:** `docs/phases/P00/PHASE_RESULT.md`; `docs/CURRENT_STATE.md`; `docs/results/P00/DOOM-P0-080.md`; `evidence/phase-gates/P00/**`; `.agent/task-state.json`  
**Parallel:** No  
**Remote authorization:** REQUIRED; push this phase branch and create one draft PR only; no merge, force, release, issue creation, or other branch change

### Goal

Prove the complete serial P00 workflow, produce one phase result bound to actual branch/evidence, and expose the candidate in one draft PR for independent Sol review.

### Required human authorization

Do not start until the user supplies:

```text
Authorize DOOM-P0-080 to push branch phase/p00-governance to the already configured user-owned origin and create one draft PR targeting the repository default branch. Do not merge, force-push, alter other branches, or publish a release.
```

### Constraints

- Write remote must be user-owned, not official Chocolate Doom.
- No force push, merge, auto-merge, source modification, per-task PRs, or fake local PR substitute.
- P00 checks must pass before push.

### Work

1. Verify authorization, branch, clean tree, upstream base, user-owned origin, auth, and default target branch.
2. Start through `taskctl`.
3. Rerun all P00 checks.
4. Prove changed paths contain no engine/upstream build file.
5. Verify one coherent task commit for P0-010 through P0-070 with correct prefixes.
6. Create `docs/phases/P00/PHASE_RESULT.md` with `Candidate commit: SELF`, upstream base, task table, actual architecture, exact verification, zero engine delta, license/evidence summary, deviations/failures, exact state, remote authorization, proposed P01 assumptions without implementation.
7. Update `docs/CURRENT_STATE.md` to “P00 candidate ready for gate,” not accepted.
8. Write result, finish with `SELF`, commit:

```text
DOOM-P0-080 prepare P00 gate candidate and draft PR
```

9. Verify HEAD/clean state.
10. Push only `phase/p00-governance` without force.
11. Create exactly one draft PR targeting default branch titled:

```text
[P00] SFHS Doom governance and task infrastructure
```

12. PR body includes goal, base, head SHA, changed paths, exact checks, zero-engine-delta claim, limitations, phase-result path, request for P0-090 review.
13. Do not amend to add post-commit PR metadata; return PR JSON in the handoff.

### Exact verification

Before push:

```bash
python tools/validate_project_docs.py --all
python -m unittest discover -s tests -p 'test_*.py' -v
python tools/taskctl.py validate
python tools/validate_artifact_manifest.py evidence/manifests/fixture-artifact-manifest.json
git diff --name-only "$UPSTREAM_BASE_SHA"...HEAD
git log --format='%h %s' "$UPSTREAM_BASE_SHA"..HEAD
git status --short
```

After push/PR:

```bash
git rev-parse HEAD
git ls-remote --heads origin phase/p00-governance
gh pr view --json number,url,isDraft,state,baseRefName,headRefName,headRefOid,title
```

Required: draft/open, correct branch, remote head equals local HEAD, target is default branch, exactly one open P00 PR.

### Acceptance

All local checks pass, no engine changes, phase result exists but does not self-approve, one task commit, branch pushed without force, exactly one matching draft PR, local/remote head match, no merge/publication.

### Evidence output

- `docs/phases/P00/PHASE_RESULT.md`
- `docs/results/P00/DOOM-P0-080.md`
- full check output
- PR URL/number/head SHA and `gh pr view` JSON

### Stop/block conditions

Missing remote authority, bad/missing origin, auth failure, conflicting PR/branch, failing check, engine change, SHA mismatch, or force/history rewrite requirement.

### Commit

One local commit before push. No amend, merge, or force.
