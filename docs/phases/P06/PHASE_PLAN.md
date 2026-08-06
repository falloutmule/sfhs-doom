# SFHS Doom — Frozen Phase P06 Plan

**Phase:** P06 — Android portrait shell, controls, minimap, and HUD
**Status:** FROZEN FOR EXECUTION
**Branch:** `phase/p06-android-portrait`
**Base:** P3 final `4fd982192b783bb55c48f6fe73e29e4515c09b2f`
**Remote boundary:** Local-only; no origin, push, PR, merge, release, publication, or deployment.

## Goal

Create a strict one-file Android Freedoom candidate with a portrait-first game
view, simultaneous explored-line minimap, adjustable multi-touch controls,
and a read-only information strip.

## Task graph

`DOOM-P6-000 -> DOOM-P6-010 -> DOOM-P6-020 -> DOOM-P6-030 -> DOOM-P6-040 -> DOOM-P6-050 -> DOOM-P6-090`.

## Exact verification

Run only P6-focused unit/browser checks, static one-file validation, document
and task validation, protected-P3 identity checks, and one P3 desktop smoke.
Do not run the historical global suite.

## Evidence and result locations

Results are under `docs/results/P06/`. Raw P6 proofs, screenshots, backups,
and intermediate artifacts are ignored under `test-results/P06/`; the final
review bundle is external and path-safe.

## Current state

P3 is accepted with recorded limitations, P3-090 is independently recorded,
P4 is blocked and separate, and P5 persistence remains deferred.

## Blockers and stop conditions

Stop for any protected P3 hash change, P4 runtime reuse, required existing
Doom C edit, unexpected dirty work, external runtime request, a test-budget
overrun, or failed card acceptance.

## Exit gate

`SFHS_DOOM_P6_ANDROID_CANDIDATE_GATE=PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING`
after P6-040; physical acceptance is a separate P6-050 gate.

## Allowed paths

Each task card is authoritative; only one source-modifying worker acts at a time.

## Remote authorization

NONE.
