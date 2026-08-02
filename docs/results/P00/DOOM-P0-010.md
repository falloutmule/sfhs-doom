# TASK RESULT

**Task:** DOOM-P0-010  
**Status:** PASS  
**Base commit:** 410d96855b5df5410ff591a90efeafa889119224  
**Result commit:** SELF  
**Branch:** phase/p00-governance  

## What was done

- Verified the authorized `sfhs-doom` target was absent before cloning.
- Cloned official Chocolate Doom from `https://github.com/chocolate-doom/chocolate-doom.git`.
- Resolved the latest official non-draft, non-prerelease release as `chocolate-doom-3.1.1`.
- Resolved the release tag to `410d96855b5df5410ff591a90efeafa889119224`.
- Renamed the fresh clone's official `origin` to `upstream` and created no user remote.
- Created `phase/p00-governance` directly from the selected release commit.
- Added only the permitted repository baseline and task result documents.

## What was verified

- The target was absent and non-Git before cloning.
- The official upstream URL is exact and is the only configured remote under the name `upstream`.
- Official metadata selected release ID `240385722`, tag `chocolate-doom-3.1.1`, published `2025-08-16T17:23:36Z`, with `draft=false` and `prerelease=false`.
- The selected full release SHA is `410d96855b5df5410ff591a90efeafa889119224`.
- The active branch is `phase/p00-governance`.
- The selected release commit is the branch base and is an ancestor of the final task commit.
- The final diff from the selected base contains only the two permitted files.
- The final worktree is clean after the single task commit.
- Parent workspace repositories were not modified.

## What failed

The first clone attempt was blocked by the sandbox network policy:

```text
fatal: unable to access 'https://github.com/chocolate-doom/chocolate-doom.git/': Failed to connect to github.com port 443 after 76 ms: Could not connect to server
```

A read-only check confirmed the target remained absent after that failed attempt. The explicitly authorized upstream clone then succeeded with network escalation. No remote write occurred.

## Changed files

```text
docs/bootstrap/REPOSITORY_BASELINE.md
docs/results/P00/DOOM-P0-010.md
```

## Commands and exact results

Official metadata result:

```json
{"id":240385722,"tag_name":"chocolate-doom-3.1.1","name":"Chocolate Doom 3.1.1","published_at":"2025-08-16T17:23:36Z","draft":false,"prerelease":false,"target_commitish":"master","html_url":"https://github.com/chocolate-doom/chocolate-doom/releases/tag/chocolate-doom-3.1.1"}
```

Tag resolution:

```text
TAG=chocolate-doom-3.1.1
SHA=410d96855b5df5410ff591a90efeafa889119224
TAG_OBJECT=commit
SHA_SUBJECT=Release 3.1.1 (#1760)
```

Pre-commit branch and remote check:

```text
BRANCH=phase/p00-governance
HEAD=410d96855b5df5410ff591a90efeafa889119224
## phase/p00-governance
upstream https://github.com/chocolate-doom/chocolate-doom.git (fetch)
upstream https://github.com/chocolate-doom/chocolate-doom.git (push)
```

Post-commit verification is reported in the task handoff because this result intentionally uses `Result commit: SELF` and is not amended after commit.

## Acceptance mapping

- Official upstream identity: verified from the fresh clone URL and final `upstream` remote.
- Stable release pin: verified from official release metadata and local tag resolution.
- Branch ancestry: verified against the full selected release SHA.
- Zero engine delta: final changed-file list is limited to the two permitted documentation files.
- Remote safety: no user `origin`, push, PR, merge, publication, or release action.
- One coherent task commit: verified by final log and head checks.
- Clean worktree: verified after commit.

## Evidence paths

- `docs/bootstrap/REPOSITORY_BASELINE.md`
- `docs/results/P00/DOOM-P0-010.md`

## Current exact state

The isolated repository is based on Chocolate Doom release `chocolate-doom-3.1.1` at `410d96855b5df5410ff591a90efeafa889119224`, on branch `phase/p00-governance`, with one local DOOM-P0-010 commit above that base and no user remote.

## Known limitations

No engine build, browser verification, gameplay/content verification, or release packaging was performed because those are outside DOOM-P0-010.

## Remaining blocker or next task

No DOOM-P0-010 blocker remains. The next task is DOOM-P0-020, subject to its separate authorization and scope.

## Post-run git status

The final post-commit status, exact task commit SHA, ancestry check, log, and changed-file listing are returned in the execution handoff without modifying this self-referential result.
