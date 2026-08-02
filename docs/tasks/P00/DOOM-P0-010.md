## DOOM-P0-010 — Establish the clean Chocolate Doom repository base

**Intelligence:** LUNA-L  
**Phase:** P00  
**Depends on:** DOOM-P0-001  
**Branch:** create/use `phase/p00-governance`  
**Allowed files/directories:** Git metadata in the authorized workspace; `docs/bootstrap/REPOSITORY_BASELINE.md`; `docs/results/P00/DOOM-P0-010.md`  
**Parallel:** No  
**Remote authorization:** NONE; clone/fetch from official upstream is allowed, but remote creation, remote mutation, push, PR, and merge are forbidden

### Goal

Create a clean local working repository that descends from one unambiguous official Chocolate Doom stable release commit, without changing engine behavior.

### Context

This is the bootstrap exception. `AGENTS.md` and repository task cards do not exist yet. The attached accepted specification, this P00 plan, and this card are the authority.

### Constraints

- Work only in the user-authorized project workspace.
- Do not overwrite or absorb an unrelated repository.
- Do not destroy, stash, reset, clean, or restore unknown changes.
- Do not modify any upstream source or build file.
- Do not create a GitHub fork/repository, alter a remote, push, or open a PR.
- Do not choose an unreleased branch tip when an official stable release exists.
- If official release metadata is unavailable or ambiguous, block for Sol rather than guessing.

### Work

1. Record `pwd`, directory listing, Git presence, current branch/HEAD, remotes, and `git status --short` before making changes.
2. If the workspace contains unrelated files, unrelated Git history, or user changes, stop with a blocker.
3. If the workspace is empty and not a Git repository, clone the official Chocolate Doom repository into the current authorized directory.
4. Normalize remotes without changing remote URLs silently:
   - preserve a user-owned `origin` if already configured;
   - ensure official Chocolate Doom is available as `upstream`;
   - if `origin` points to official Chocolate Doom and no user-owned origin exists, rename it to `upstream` rather than inventing a user remote.
5. Fetch official tags and resolve the latest official non-draft, non-prerelease release tag using official release metadata. Record the tag, full commit SHA, release identifier, and exact resolution command.
6. If a pre-existing project base is already explicitly recorded and differs, block rather than rebasing it silently.
7. Create `phase/p00-governance` from the selected upstream commit.
8. Write `docs/bootstrap/REPOSITORY_BASELINE.md` containing official upstream URL, selected tag/SHA, selection method/time, branch/remote map, clean-state evidence, zero-engine-delta statement, and unverified items.
9. Write `docs/results/P00/DOOM-P0-010.md` using `Result commit: SELF`.
10. Commit only those two files with:

```text
DOOM-P0-010 establish clean upstream repository base
```

### Exact verification

```bash
test "$(git branch --show-current)" = "phase/p00-governance"
git rev-parse --verify HEAD
git rev-parse --verify "$UPSTREAM_BASE_SHA"
git merge-base --is-ancestor "$UPSTREAM_BASE_SHA" HEAD
git remote -v
git diff --name-only "$UPSTREAM_BASE_SHA"...HEAD
git status --short
```

The final diff from upstream base must list only:

```text
docs/bootstrap/REPOSITORY_BASELINE.md
docs/results/P00/DOOM-P0-010.md
```

### Acceptance

- Official upstream identity is directly verified.
- One stable release tag and full source commit are pinned.
- The phase branch descends from that exact commit.
- No engine or upstream build file differs from base.
- No remote write occurred.
- One coherent task commit exists and the worktree is clean.

### Evidence output

- `docs/bootstrap/REPOSITORY_BASELINE.md`
- `docs/results/P00/DOOM-P0-010.md`
- exact command output embedded in the result

### Stop/block conditions

Stop for nonempty unrelated workspace, dirty user work, official identity mismatch, ambiguous release metadata, unavailable verification network, divergent phase branch, or any required history/remote rewrite.

### Commit

One local commit only. No amend, push, force, or PR.
