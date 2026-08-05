# SFHS Doom — Frozen Phase P03 Plan

**Phase:** P03 — Strict single-file offline packaging proof
**Status:** FROZEN FOR EXECUTION
**Authority:** accepted P2 result, P3 lean continuous Luna packet, and these task cards
**Accepted P2 HEAD:** `48b61cccea64ab2a4d29e3f293cbce142aee4de9`
**Branch:** `phase/p03-single-file`
**Upstream:** Chocolate Doom `chocolate-doom-3.1.1` at `410d96855b5df5410ff591a90efeafa889119224`
**Product:** one embedded Freedoom Phase 2 HTML artifact
**Remote boundary:** Local-only; no origin, push, PR, merge, tag, release, publication, or deployment.

## Goal

Create and prove one self-contained HTML artifact from the accepted P2 browser
build without changing engine behavior.

## Scope

P3 packages the accepted P2 browser build into one offline HTML file. It may
change packaging configuration, the P2 browser shell, packaging scripts,
focused P3 tests, and reports only. It does not change C, gameplay, renderer,
SDL engine behavior, compatibility rules, commercial data, remotes, or later
launcher/mobile/persistence work.

The historical global Python suite remains recorded P2 infrastructure debt and
is not run in P3.

## Task graph

| Task | Dependency | Completion |
|---|---|---|
| DOOM-P3-000 | P2-088 | P2 review recorded; branch and P3 governance installed |
| DOOM-P3-010 | P3-000 | clean P2 packaging inputs and manifests |
| DOOM-P3-020 | P3-010 | one strict single-file candidate and static validation |
| DOOM-P3-030 | P3-020 | direct-file Chromium/Firefox offline gameplay proof |
| DOOM-P3-040 | P3-030 | focused P3 gate and safe review bundle |
| DOOM-P3-090 | P3-040 | independent Sol review only; remains pending |

## Evidence and result locations

Task results are under `docs/results/P03/`; P3 manifests, logs, gate output,
and review materials are under `evidence/`. Ignored builds and browser caches
are not product inputs.

## Current state

P3 starts from P2 HEAD `48b61cccea64ab2a4d29e3f293cbce142aee4de9` on the new
`phase/p03-single-file` branch with P2-090 independently recorded and P3-090
pending.

## Exact verification

Run only the task-specific focused commands in each card and the final P3 gate.
Never run `python -m unittest discover`.

## Limits

P3 adds at most three test files and twelve test cases total. It does not run
`python -m unittest discover` and does not create a new parity matrix.

## Blockers and stop conditions

Stop for an unavoidable sibling runtime, external request, gameplay/audio/input
regression, C-source requirement, commercial data, remote action, or destructive
Git operation.

## Final gate

`SFHS_DOOM_P3_SINGLE_FILE_GATE=PASS_WITH_RECORDED_LIMITATIONS`

## Exit gate

Five exact P3 builder commits, one final HTML file, direct-file browser proof,
safe review bundle, clean worktree, official upstream-only remotes, and pending
P3-090 are required.
