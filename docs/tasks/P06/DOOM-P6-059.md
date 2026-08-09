# DOOM-P6-059 — Add 4:3 portrait presentation and repair control editor

**Intelligence:** CODEX
**Phase:** P06
**Status:** PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING
**Depends on:** DOOM-P6-058 and the published V10 baseline
**Branch:** `repair/p6-v11-4x3-editor`
**Base:** `1fdd2b0778e883e8f8dd99dd89b8821dccd8a9e7`
**Parallel:** No; one source-modifying writer
**Remote authorization:** Read-only inspection only; no push, PR, merge, publish, deploy, release, or workflow dispatch

**Result:** `docs/results/P06/DOOM-P6-059.md`

## Goal

Build and prove a bounded V11 Android portrait candidate with exactly two
product repairs: aspect-correct 4:3 CSS presentation of the unchanged native
320×200 world, and a compact control editor occupying the minimap region so
the complete touch-control deck remains directly visible and editable.

## Allowed files/directories

- `web/p6/shell.html`
- `tools/validate-p6-mobile.py`
- `browser-tests/tests/p6-v11-4x3-editor.spec.mjs`
- `tests/test_p6_mobile_contract.py` (current-shell V11 contract assertions)
- `.github/workflows/p6-candidate-pages.yml`
- `docs/CURRENT_STATE.md`
- `docs/UPSTREAM_DELTA.md`
- `docs/COMPATIBILITY_MATRIX.md`
- `docs/tasks/P06/DOOM-P6-059.md`
- `docs/results/P06/DOOM-P6-059.md`
- `docs/reports/P06_V11_4X3_EDITOR_REPAIR.md`
- `evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v11.json`
- `test-results/P06/P6-059/**` (ignored working proofs and backups)
- `dist/sfhs-doom-android-sfhs-controls-v11.html` (generated only)

The protected V8, V9, and V10 artifacts are read-only. Doom engine sources,
`src/sfhs_mobile`, the shared SFHS core, and the canonical
`@sfhs/mobile-controls` package are forbidden in this repair.

## Product and compatibility constraints

- Keep the engine framebuffer, SDL backing canvas, and native world at 320×200.
- Keep the authentic detached HUD at 320×32 and preserve its V10 native path.
- Apply classic 4:3 aspect correction once, in portrait CSS only: 360×270 at a
  360-pixel viewport and 400×300 at a 400-pixel viewport.
- Do not change projection, FOV, screenblocks, rendering, simulation, timing,
  input semantics, automap, menus, saves, demos, configuration, or WAD data.
- Preserve edge-to-edge x=0/y=0 presentation, no scroll, no border, no crop,
  no letterbox, no internal status bar, and no double aspect correction.
- Preserve touch target sizes and compact V9/V10 floors; fund the taller world
  from minimap space before reducing the control deck. Do not remove minimap.
- During edit mode, suspend/hide minimap presentation and place the complete
  existing editor settings in that region without intersecting the control
  deck. Save and Cancel restore normal minimap presentation.
- Preserve drag, resize, selection, reset, import, export, profile schema,
  persistence key, input release, and shared package identity.

## Architecture

1. Change only the portrait world CSS box from 8:5 to 4:3 while leaving the
   320×200 canvas attributes and V10 SDL raw-pixel sizing path untouched.
2. Reserve a stable portrait control-deck row and allow the minimap row to
   absorb the added world height.
3. Nest a compact editor form in the minimap region. In edit mode, mark that
   region as editing, hide/suspend the minimap, expose the form, and leave the
   separate control deck unobstructed.
4. Restore minimap state on Save and Cancel without changing controller or
   persistence contracts.
5. Generate V11 only through the official single-file build path.

## Failure-mode audit

Actively guard Hermes modes **A, B, C, D, H, I, J, K, L, M, N, O, P, Q, S,
and T**. Preserve one-file/offline packaging; prohibit external assets, eval,
inline handlers, and scope creep; prove viewport/safe-area/no-scroll behavior;
retain trusted gestures, stuck-input release, multitouch routing, reachable
editor controls, modal escape, deterministic proof paths, and honest physical
acceptance reporting.

## Required verification

- Clean preflight and final Git/remote/PR inspection.
- Product build to
  `dist/sfhs-doom-android-sfhs-controls-v11.html` and oracle build under
  `test-results/P06/P6-059/`.
- Focused V11 Playwright gate at 360×800, 400×844, and 800×360 covering exact
  geometry, unchanged backing dimensions/native HUD snapshot, minimap/control
  reachability, editor non-occlusion, MOVE/LOOK resize, Save persistence,
  Cancel rollback, minimap restoration, automap, both renderers, audio,
  file/offline/network/console hygiene, and required screenshots.
- Protected V10 focused gate unchanged, protected V9 resize-range gate, current
  shared-control/editor/movement/LOOK/boot/audio/file lanes, static validator,
  manifest validation, native debug build/tests, and focused demo/oracle gate.
- `git diff --check`, source/static scans, generated provenance, no external
  resource or commercial data, and exact V8/V9/V10 byte/hash preservation.

## Acceptance

- V11 is a generated sibling with consistent identity.
- Portrait geometry is 360×270 and 400×300 within one pixel while canvas
  backing remains 320×200, native view remains 320×200/screenblocks 11, and
  detached HUD remains 320×32 with no duplicate internal bar.
- The compact editor is wholly outside the control deck, does not cover a
  majority or any required editable control, and retains all editor behavior.
- Normal mode restores a visible minimap; control deck, HUD, and page remain in
  the viewport without whole-page scrolling.
- V10 remains exact and its unchanged focused test passes.
- Result is `PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING` until Samsung Chrome V11 is
  physically viewed and operated.

## Evidence output

- `test-results/P06/P6-059/`
- `evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v11.json`
- `docs/reports/P06_V11_4X3_EDITOR_REPAIR.md`
- `docs/results/P06/DOOM-P6-059.md`

## Stop/block conditions

Stop only for an unknown/conflicting worktree or history, overlapping remote
change, required shared-SFHS or native-engine change, materially different
architecture/product decision, commercial-data need, or remote-write need.
Ordinary implementation, build, or test failures are diagnosed and repaired.

## Commit

`DOOM-P6-059 add 4:3 portrait presentation and repair control editor`

Commit only on `PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING`, with result commit
`SELF`, exact artifact identity, and an empty worktree afterward.
