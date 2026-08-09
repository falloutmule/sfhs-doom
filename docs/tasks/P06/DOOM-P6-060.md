# DOOM-P6-060 — Repair physical 4:3 presentation ownership

**Intelligence:** CODEX
**Phase:** P06
**Status:** PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING
**Depends on:** DOOM-P6-059 and the published, physically failed V11 baseline
**Branch:** `repair/p6-v12-physical-4x3`
**Base:** `3d939853968cd42322b5de0b19d7dfd5dd215500`
**Parallel:** No; one source-modifying writer
**Remote authorization:** After the complete local V12 gate passes, publish only the exact V12 candidate through the existing main/Pages path.

**Result:** `docs/results/P06/DOOM-P6-060.md`

## Goal

Build and prove a bounded V12 repair that preserves the V10/V11 two-surface
handheld architecture while removing the competing JavaScript ownership of
the SDL/Emscripten canvas backing store. The unchanged logical 320x200 Doom
world must fill a 4:3 portrait CSS rectangle without the physical V11 crop or
bottom black band.

## Allowed files/directories

- `web/p6/shell.html`
- `tools/validate-p6-mobile.py`
- `browser-tests/tests/p6-v12-physical-4x3.spec.mjs`
- `browser-tests/support/full-frame-coverage.mjs`
- `tests/test_p6_mobile_contract.py`
- `.github/workflows/p6-candidate-pages.yml`
- `docs/CURRENT_STATE.md`
- `docs/UPSTREAM_DELTA.md`
- `docs/COMPATIBILITY_MATRIX.md`
- `docs/tasks/P06/DOOM-P6-060.md`
- `docs/results/P06/DOOM-P6-060.md`
- `docs/reports/P06_V12_PHYSICAL_4X3_REPAIR.md`
- `evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v12.json`
- `test-results/P06/P6-060/**` (ignored proofs and backups)
- `dist/sfhs-doom-android-sfhs-controls-v12.html` (generated only)

V8, V9, V10, and V11 artifacts are read-only. Doom engine sources,
`src/sfhs_mobile`, CMake, the shared SFHS core, and the canonical
`@sfhs/mobile-controls` package are forbidden.

## Product and compatibility constraints

- Preserve native `SCREENWIDTH=320`, `SCREENHEIGHT=200`, screenblocks 11,
  renderer projection/FOV, simulation, automap, saves, demos, menus, and input.
- Preserve the authentic detached 320x32 HUD and inactive internal status bar.
- Treat the logical Doom framebuffer, SDL/Emscripten presentation surface, and
  CSS display rectangle as distinct layers with one owner each.
- SDL/Emscripten owns canvas backing/output dimensions after startup.
- CSS owns the portrait 4:3 display rectangle: 360x270, 400x300, and 576x432.
- Remove V11's width/height MutationObserver. Keep SDL untransformed through
  initialization, then apply a CSS transform only after local evidence proves
  ordinary CSS width/height changes clip the compatibility renderer.
- Do not crop, clip, overscale, read back/copy the world canvas, or synthesize
  extra rows.
- Preserve the V11 editor implementation unchanged unless ordinary CSS sizing
  requires a directly related adjustment.

## Failure-mode audit

Actively guard Hermes modes **A, B, C, D, H, I, J, K, L, M, N, O, P, Q, S,
and T**. Mode I is the primary regression: tests must distinguish logical
320x200 state, runtime-owned canvas backing/output, and 4:3 CSS geometry, then
prove actual full-frame occupancy rather than geometry alone.

## Required verification

- Record V11 before/after-start canvas attribute, client, CSS, transform,
  game-region, MutationObserver restore count, and SDL output metadata.
- Add a reusable full-frame coverage analyzer and prove that a synthetic
  576x432 frame with only its upper 286 rows occupied is rejected while a
  correctly occupied frame passes.
- Focused V12 Playwright at 360x800, 400x844, and physical-like 576px width,
  with automatic and compatibility renderers, complete vertical/horizontal
  occupancy, no significant contiguous black band, no scroll, controls/HUD,
  native 320x200, detached 320x32 HUD, fullscreen/audio/file/network/error
  hygiene, editor non-occlusion, Save/Cancel/import/export/reset, automap, and
  landscape fallback.
- Protected V11, V10, and V9 tests remain targeted at their exact artifacts.
- Run applicable P6 browser/Python contracts, static validator, manifest
  validation, product and oracle builds, native Debug build/tests/version, and
  focused native demo/oracle compatibility proof.
- Run `git diff --check`, provenance/external-resource/commercial-data scans,
  and exact V8/V9/V10/V11 preservation hashes.

## Evidence output

- `test-results/P06/P6-060/`
- `evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v12.json`
- `docs/reports/P06_V12_PHYSICAL_4X3_REPAIR.md`
- `docs/results/P06/DOOM-P6-060.md`

## Acceptance and publication

Commit only when all local gates pass with status
`PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING`. Record exact V12 bytes and SHA-256,
clean worktree, and protected artifact hashes before remote mutation. Then use
the least-invasive established Pages path to publish exact V12 and verify the
live byte/hash identity. V12 remains physically unaccepted until the user runs
the separate Samsung checklist.

## Stop conditions

Stop only for unknown/conflicting work, overlapping remote changes, required
shared-SFHS or native simulation/projection work, an incompatible architecture,
commercial-data need, or authority beyond the bounded V12 Pages replacement.

## Commit

`DOOM-P6-060 repair physical 4:3 canvas presentation`
