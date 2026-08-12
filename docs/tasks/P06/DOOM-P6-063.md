# DOOM-P6-063 — Add resizable panels and clean mobile settings

**Intelligence:** CODEX
**Phase:** P06
**Status:** PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING
**Depends on:** DOOM-P6-062 and exact published V14 baseline
**Branch:** `feature/p6-v15-resizable-panels-options`
**Base:** `00e6bd0841ce31e5de7351003014a82c76d41641`
**Parallel:** No; one source-modifying writer
**Remote authorization:** After every local V15 gate passes, push the focused
branch and perform only the minimum PR/main/Pages operation needed to publish
exact V15 for Samsung testing.

**Result:** `docs/results/P06/DOOM-P6-063.md`

## Goal

Create V15 with a Doom-owned panel-layout editor for the real minimap canvas
and CSS presentation of the authentic 320×32 HUD, safe user settings for LOOK
tap-to-FIRE, and a compact sectioned settings menu. Preserve V14 world,
controls, shared profile, native HUD, rendering, simulation, demo/save, audio,
fullscreen, automap, and lifecycle behavior.

## Allowed files/directories

- `web/p6/shell.html`
- `browser-tests/tests/p6-v15-resizable-panels-options.spec.mjs`
- `tests/test_p6_mobile_contract.py`
- `tools/validate-p6-mobile.py`
- `.github/workflows/p6-candidate-pages.yml`
- `docs/CURRENT_STATE.md`
- `docs/UPSTREAM_DELTA.md`
- `docs/COMPATIBILITY_MATRIX.md`
- `docs/tasks/P06/DOOM-P6-063.md`
- `docs/results/P06/DOOM-P6-063.md`
- `docs/reports/P06_V15_RESIZABLE_PANELS_OPTIONS.md`
- `evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v15.json`
- `test-results/P06/P6-063/**` (ignored backup and evidence)
- `dist/sfhs-doom-android-sfhs-controls-v15.html` (generated only)

V8 through V14 artifacts, Doom/native sources, `src/sfhs_mobile`, CMake,
shared SFHS core, and `vendor/sfhs-mobile-controls-v1` are read-only.

## Behavior contract

- Persist validated Doom UI preferences only under `sfhsDoom.mobileUi.v1`
  with schema `sfhs.doom-mobile-ui@1`; never alter the shared control key or
  schema.
- Keep portrait/landscape minimap and HUD presentation values independent,
  finite, clamped, no-scroll, and non-overlapping with required controls.
- Panel edit releases input, is mutually exclusive with control edit, keeps
  the real minimap visible, exposes reachable minimap/HUD handles plus compact
  Save/Cancel/Reset actions, persists only on Save, and restores exactly on
  Cancel or unsafe orientation change.
- Keep HUD backing exactly 320×32 and CSS aspect exactly 10:1; only CSS width
  changes, with bottom centering and reserved-height rebalancing.
- LOOK tap options are enabled by default at 300 ms/12 CSS px, bounded to
  150–450 ms and 6–24 px, sampled at gesture start, and cancel tracking/queued
  work on every committed change. The four-entry queue and authoritative
  press/release tic logic remain fixed internal details.
- Replace the loose settings buttons with compact accessible Play, Display
  layout, Touch controls, LOOK tap fire, Control profile, and Advanced
  sections. Whole-page scrolling remains forbidden; menu-only scrolling is
  allowed.

## Failure-mode audit

Actively guard Hermes modes **A–T** except gameplay-save migration **F** is
limited to proving the independent UI key cannot alter native save files.
Primary modes are **F, H, I, J, K, L, M, N, O, P, and Q**: validated UI
storage, safe rotation, fixed native backings, no gesture theft or stuck input,
default layout parity, editor exclusivity, exact Cancel rollback, corrupt-data
recovery, menu escape/focus safety, and evidence-backed publication.

## Required verification

- Build product and oracle artifacts through `tools/build-single-file.sh`.
- Run the focused V15 Playwright gate across 360×800, 400×844, 800×360, and
  915×412; automatic/compatibility renderers; resize Save/Cancel/clamps;
  orientation independence; LOOK settings behavior/persistence/corrupt data;
  settings/editor reachability; regressions; screenshots; and browser hygiene.
- Run unchanged protected V14, V13, V12 and applicable V10/V9/shared-controls,
  MOVE, Samsung LOOK, boot/audio, direct-file, offline, native demo/Wasm,
  manifest, and native detached-HUD-OFF lanes.
- Verify exact V8–V14 hashes, one-document/offline packaging, no external
  assets, no eval/inline handlers, no commercial data, workflow YAML, exact
  V15 identity, `git diff --check`, and a clean committed tree.

## Acceptance and publication

Commit as `PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING` only after all applicable
local gates pass. Push the focused branch, open the minimum PR, wait for the
candidate gate, merge only on success, wait for Pages, and prove live bytes and
SHA-256 equal the local V15 artifact. Do not claim physical acceptance.

## Commit

`DOOM-P6-063 add resizable panels and clean mobile settings`
