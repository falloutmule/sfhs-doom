# SFHS Doom Repository Baseline

**Task:** DOOM-P0-010  
**Status:** PASS  
**Result commit:** SELF  
**Baseline recorded:** 2026-08-02  

## Authorized workspace and isolation

The authorized project workspace is:

```text
C:\Users\fallo\Documents\Single-File-Html\sfhs-doom
```

The target was absent before cloning. The parent workspace and its existing repositories were inspected read-only and were not used as the project workspace.

Initial target preflight output:

```text
PWD=C:\Users\fallo\Documents\Single-File-Html
TARGET=C:\Users\fallo\Documents\Single-File-Html\sfhs-doom
TARGET_EXISTS=NO
```

Existing parent repositories were left unchanged. Their initial status snapshot identified:

```text
single-file-html-software: codex/osf-grad-001-graduation-protocol-v1...origin/codex/osf-grad-001-graduation-protocol-v1
solidarity-not-charity-can-run: spike/low-block-raycaster...origin/spike/low-block-raycaster, with five existing untracked evidence files
solidarity-not-charity-can-run-private-archive-20260720: main...origin/main, with existing modified and untracked files
```

No parent repository was cloned into, initialized, cleaned, reset, stashed, restored, or otherwise modified.

## Official upstream identity

```text
Official upstream URL: https://github.com/chocolate-doom/chocolate-doom.git
Remote name in this repository: upstream
User-owned origin: absent
```

The fresh clone initially reported the official URL under `origin`. That local remote name was renamed to `upstream`; no user remote was created.

Final remote listing:

```text
upstream https://github.com/chocolate-doom/chocolate-doom.git (fetch)
upstream https://github.com/chocolate-doom/chocolate-doom.git (push)
```

## Stable release selection

Official GitHub release metadata was queried read-only at `2026-08-02T23:20:50.7312274Z`. The selector retained releases with `draft == false` and `prerelease == false`, then selected the newest `published_at` value.

Metadata command:

```powershell
$headers=@{Accept='application/vnd.github+json';'User-Agent'='Codex-DOOM-P0-010'}
$releases=Invoke-RestMethod -Uri 'https://api.github.com/repos/chocolate-doom/chocolate-doom/releases?per_page=100' -Headers $headers -Method Get
$stable=$releases | Where-Object { -not $_.draft -and -not $_.prerelease } | Sort-Object {[datetime]$_.published_at} -Descending | Select-Object -First 1
$stable | Select-Object id,tag_name,name,published_at,draft,prerelease,target_commitish,html_url | ConvertTo-Json -Compress
```

Metadata result:

```json
{"id":240385722,"tag_name":"chocolate-doom-3.1.1","name":"Chocolate Doom 3.1.1","published_at":"2025-08-16T17:23:36Z","draft":false,"prerelease":false,"target_commitish":"master","html_url":"https://github.com/chocolate-doom/chocolate-doom/releases/tag/chocolate-doom-3.1.1"}
```

Selected release:

```text
Tag: chocolate-doom-3.1.1
Full commit SHA: 410d96855b5df5410ff591a90efeafa889119224
Tag object type: commit
Commit subject: Release 3.1.1 (#1760)
```

The tag SHA was resolved locally with:

```text
git rev-parse refs/tags/chocolate-doom-3.1.1^{commit}
```

## Branch and ancestry

```text
Branch: phase/p00-governance
HEAD at baseline creation: 410d96855b5df5410ff591a90efeafa889119224
Upstream base SHA: 410d96855b5df5410ff591a90efeafa889119224
```

The phase branch was created directly from the selected release commit. No engine or upstream build file differs from that base before this task's documentation commit.

## Scope and unverified items

This bootstrap performed no engine build, native or Emscripten compilation, browser test, gameplay test, WAD/content download, or release packaging. No commercial IWAD, PWAD, DeHackEd patch, demo, screenshot, or proprietary lump was inspected or added.

Remote creation, remote mutation, push, PR creation, merge, publication, and release actions were not performed.

The only task changes are the two governance/result documents named in the task card. The result uses `SELF` because it is contained in the commit it reports; the final commit SHA is proven by post-commit verification and handoff.
