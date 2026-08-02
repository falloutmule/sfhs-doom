## DOOM-P0-090 — Independent Sol gate for Phase P00

**Intelligence:** SOL-GATE  
**Phase:** P00  
**Depends on:** DOOM-P0-080  
**Branch:** review `phase/p00-governance` and its draft PR  
**Allowed files/directories:** read-only repository/PR inspection; gate-verdict Markdown output outside branch unless separately authorized  
**Parallel:** No source modification  
**Remote authorization:** read-only

### Goal

Determine whether P00 actually created a safe minimal-handoff repository with zero engine behavior change.

### Inputs

`docs/PROJECT_SPEC.md`, `AGENTS.md`, `CURRENT_STATE`, P00 plan/result/cards/results, upstream base, draft PR, deterministic outputs, task state, licensing, evidence, manifest.

### Review duties

1. Inspect actual PR diff/commit range.
2. Confirm official stable upstream base ancestry.
3. Confirm no engine/source/build behavior file changed.
4. Read `AGENTS.md` as a fresh worker and test the one-sentence handoff claim.
5. Inspect cards for bounded scope, exact verification, stop conditions, remote policy.
6. Verify `SELF` works without amend/metadata-only second commits.
7. Rerun or inspect document validator, taskctl tests/state, manifest validator/tamper rejection, Git state, and PR identity.
8. Inspect conservative license/source mapping.
9. Confirm `CURRENT_STATE.md` makes no untested build/compatibility claims.
10. Confirm phase result records deviations and does not self-approve.
11. Do not repair.

### Exact verification

```bash
python tools/validate_project_docs.py --all
python -m unittest discover -s tests -p 'test_*.py' -v
python tools/taskctl.py validate
python tools/taskctl.py status
python tools/validate_artifact_manifest.py evidence/manifests/fixture-artifact-manifest.json
git diff --name-status "$UPSTREAM_BASE_SHA"...HEAD
git log --format='%H %s' "$UPSTREAM_BASE_SHA"..HEAD
git status --short
gh pr view --json number,url,isDraft,state,baseRefName,headRefName,headRefOid,title
```

If direct execution is unavailable, label checks “not independently rerun”; do not promote them to verified.

### Gate acceptance

PASS only if upstream base proven, all changes are governance/tooling/evidence only, minimal handoff works, cards validate, taskctl is operational but not fake proof, licenses mapped conservatively, manifest detects tampering, Git/remote safety followed, one draft PR matches candidate, current-state matches reality, and no P00 blocker remains.

### Verdict format

```md
# GATE VERDICT — DOOM-P0-090

**Verdict:** PASS | FAIL — REPAIRABLE | FAIL — ARCHITECTURAL | BLOCKED — EXTERNAL INPUT REQUIRED
**Reviewed base:**
**Reviewed candidate:**
**Draft PR:**

## What was inspected
## What was independently verified
## Findings
## Scope and engine-delta verdict
## Evidence quality verdict
## Minimal-handoff test
## Required repairs or blocker
## Exact current state
## Next action
```

On repairable failure, propose one repair card per finding; do not implement. On PASS, author exact P01 plan/cards; do not begin native build work.

### Stop/block conditions

PR/candidate cannot be identified, base/head changes during review, evidence missing, or checker access cannot support PASS.

### Commit

None. Read-only Sol gate.

---

# 12. Required result format for Luna tasks

```md
# TASK RESULT

**Task:** DOOM-Px-yyy
**Status:** PASS | BLOCKED | FAIL
**Base commit:**
**Result commit:** SELF | actual prior commit | EXTERNAL
**Branch:**

## What was done
## What was verified
## What failed
## Changed files
## Commands and exact results
## Acceptance mapping
## Evidence paths
## Current exact state
## Known limitations
## Remaining blocker or next task
## Post-run git status
```

A blocker must include exact component, exact observed behavior, base/current commit, exact command, full log path, changed/partial state, what was ruled out, branch safety, and exact input/decision required.
