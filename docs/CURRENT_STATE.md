# SFHS Doom Current State

**Date:** 2026-08-02  
**Phase:** P00 — governance and repository bootstrap  
**Current task:** DOOM-P0-020  
**Current result commit:** SELF  
**Branch:** `phase/p00-governance`

## Verified reality

- DOOM-P0-001 is complete at the planning level: ADR-011 through ADR-014 were accepted on 2026-08-02.
- DOOM-P0-010 established the clean local repository from Chocolate Doom tag `chocolate-doom-3.1.1` at `410d96855b5df5410ff591a90efeafa889119224`.
- The official upstream remote is named `upstream`; no user-owned `origin` exists.
- DOOM-P0-020 installs the accepted specification, frozen P00 plan, P00 task cards, decision record, state/compatibility/issue documents, and its task results.
- No native build, Emscripten build, browser run, gameplay run, compatibility result, release artifact, or commercial game data has been produced or inspected.
- No remote creation, remote mutation, push, pull request, merge, publication, or release action has occurred.
- No engine source, upstream build file, or upstream documentation was changed by P00.

## Source-of-truth order

After DOOM-P0-030, workers use:

```text
AGENTS.md
-> docs/PROJECT_SPEC.md
-> docs/CURRENT_STATE.md
-> docs/phases/P00/PHASE_PLAN.md
-> docs/tasks/P00/<TASK-ID>.md
-> relevant files and tests
```

## Next task

DOOM-P0-030 installs the root `AGENTS.md` contract. It is the next task after this result.
