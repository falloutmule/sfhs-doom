# DOOM-P6-058 — Detach authentic HUD and add edge-to-edge fullscreen

**Intelligence:** LUNA-H
**Phase:** P06
**Status:** PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING
**Depends on:** DOOM-P6-051 and the accepted V9 publication baseline
**Branch:** `feature/p6-native-hud-fullscreen`
**Base:** `8d45af9e51573dd048f86f95b68a8f65670efae9`
**Parallel:** No; one source-modifying writer
**Remote authorization:** Read-only inspection only; no push, PR, merge, publish, deploy, release, or workflow dispatch

**Result:** `docs/results/P06/DOOM-P6-058.md`

## Goal

Build and prove the V10 Android portrait candidate with an edge-to-edge native
320×200 Doom world, a separate authentic native 320×32 status surface, trusted
gesture fullscreen entry, retained minimap, and unchanged shared SFHS controls.

## Allowed files/directories

- `web/p6/shell.html`
- `src/sfhs_mobile/sfhs_mobile_hud.c`
- `src/sfhs_mobile/sfhs_mobile_hud.h`
- `src/doom/st_stuff.c`
- `src/doom/st_stuff.h`
- `src/doom/am_map.c` (V10-only removal of the vanilla internal-status reservation)
- `src/doom/d_main.c`
- `src/doom/r_main.c`
- `src/i_video.c`
- `src/CMakeLists.txt`
- `tools/build-single-file.sh`
- `tools/validate-p6-mobile.py`
- `browser-tests/tests/p6-v10-native-hud-fullscreen.spec.mjs`
- current applicable `browser-tests/tests/*` only when a V10-specific support adjustment is required
- `tests/test_p6_mobile_contract.py` (V10 source-contract assertions)
- `.github/workflows/p6-candidate-pages.yml`
- `.agent/task-state.json` only if required to register/finish this card
- `docs/CURRENT_STATE.md`
- `docs/UPSTREAM_DELTA.md`
- `docs/COMPATIBILITY_MATRIX.md`
- `docs/tasks/P06/DOOM-P6-058.md`
- `docs/results/P06/DOOM-P6-058.md`
- `docs/reports/P06_V10_NATIVE_HUD_FULLSCREEN.md`
- `evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v10.json`
- `test-results/P06/P6-058/**` (ignored working proofs and backups)
- `dist/sfhs-doom-android-sfhs-controls-v10.html` (generated only)

One additional nearby Doom/source or browser-support file may be added only
when it is strictly required by this same two-surface architecture and is
recorded in the result. Shared SFHS core and the canonical
`@sfhs/mobile-controls` implementation are forbidden.

## Product and compatibility constraints

- Compile the behavior only for the Android detached-HUD build profile; it is
  inactive in native and protected P3 builds.
- Do not change Doom simulation, timing, RNG, saves, configuration format,
  demos, gameplay, renderer semantics, or mobile-control contracts.
- Do not persist the forced `screenblocks=11` value to native configuration.
- Preserve V8 and V9 bytes exactly.
- Use existing WAD status graphics and status code; no HTML HUD imitation,
  screenshot crop, commercial data, external runtime asset, service worker,
  orientation lock, or networking.
- Main logical canvas remains 320×200. Detached canvas remains 320×32.
- Internal status rendering is disabled in detached mode, including automap.
- Detached HUD is active only for `GS_LEVEL` with a live console player and
  remains active during automap, pause, and in-level menus.
- Fullscreen is requested directly from the trusted Start handler on an app
  root containing the world, lower shell, controls, and utility panels; Doom
  starts immediately without awaiting the fullscreen Promise.

## Architecture

1. Add `SFHS_MOBILE_DETACHED_HUD`, default OFF, and enable it only for the
   Android single-file profile.
2. Add a Doom-specific mobile HUD module that owns a 320×200 indexed scratch
   surface, the exact active 256-color RGBA palette, a 320×32 RGBA publication
   buffer, and a versioned read-only snapshot.
3. In `st_stuff.c`, perform a complete authentic status refresh into the
   scratch surface with all drawing targets and status flags restored, publish
   rows 168–199, and suppress the internal bar while detached mode is active.
4. Feed the gamma-adjusted active palette from `I_SetPalette` into the module.
5. Enforce effective full view (`screenblocks=11`, 320×200) after config load
   and on every requested view-size application only under the V10 flag.
6. Replace the HTML info strip with a 320×32 canvas reading the RGBA buffer via
   `HEAPU8`; redraw only on native update changes and pause work while hidden.
7. Rework portrait geometry to make the main world full viewport width at 8:5,
   compress/rebalance lower regions first, and place utility controls behind
   one lower settings affordance.

## Failure-mode audit

Actively guard Hermes modes **A, B, C, D, E, F, G, H, I, J, K, L, M, N, O,
P, Q, R, S, and T**. In particular: preserve the one-file deliverable; block
external assets and inline handlers/eval; keep rendering read-only with respect
to gameplay; prove native config/save/demo behavior unchanged; prevent viewport,
safe-area, gesture, stuck-input, multitouch, layout/editor, and modal traps;
keep proofs under the declared paths; and review the complete diff for scope
creep. No catalog mode is treated as N/A because this card touches the release
artifact, native drawing, mobile layout, lifecycle, input-adjacent UI, and test
harness together.

## Required verification

- Clean preflight and final Git/remote/PR inspection.
- Native debug build, existing native tests, and focused native oracle/demo
  parity command used by current repository conventions.
- Product build:
  `tools/build-single-file.sh --profile android --output dist/sfhs-doom-android-sfhs-controls-v10.html`.
- Oracle build to `test-results/P06/P6-058/sfhs-doom-v10-oracle.html`.
- Updated strict V10 static validator and source/static scans.
- Dedicated V10 Playwright gate covering 360×800, 400×844, and 800×360;
  fullscreen success/rejection/unsupported paths; 320×200 world; 320×32
  authentic HUD; FIRE-driven ammo/HUD change; automap without duplicate HUD;
  controls/editor/profile regressions; visibility lifecycle; renderer paths;
  file/HTTP hygiene; and screenshots.
- Protected V9 focused test against untouched V9 plus applicable P6 layout,
  shared-controls, move-axis, editor, boot/product, audio, and file smoke lanes.
- `git diff --check`, generated-artifact provenance review, V8/V9 hash proof,
  no commercial data, no escaped source map/wasm/external asset, and clean final
  worktree after commit.

## Acceptance

- V10 is a generated sibling artifact with consistent identity.
- Portrait world begins at x=0/y=0, fills viewport width within one pixel,
  preserves 8:5, and has no border, crop, internal bar, or side gap.
- Native snapshot proves enabled/active state, 320×32 RGBA publication,
  advancing updates, nonzero checksum/nonblank pixels, effective 320×200 view,
  screenblocks 11, and internal status inactive.
- Fullscreen rejection/absence never prevents exactly-once Doom startup.
- Minimap, shared controls, edit/save/cancel/import/export/reset, automatic and
  compatibility renderers, audio, visibility release, no-scroll, offline, and
  no-network contracts pass.
- Native builds and existing tests show no unguarded mobile symbol or native
  behavior change.
- Physical Samsung result is recorded truthfully; device absence yields
  `PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING` rather than a claimed device pass.

## Evidence output

- `test-results/P06/P6-058/`
- `evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v10.json`
- `docs/reports/P06_V10_NATIVE_HUD_FULLSCREEN.md`
- `docs/results/P06/DOOM-P6-058.md`

## Stop/block conditions

Stop only for an unknown dirty worktree, overlapping remote change, unavailable
frozen dependency/toolchain that cannot be restored normally, need to change
shared SFHS contracts or native simulation/save/demo compatibility, need for
commercial data or remote writes, or proof that palette-correct detached status
requires a materially different architecture. Ordinary build/test defects are
repaired and rerun continuously.

## Commit

`DOOM-P6-058 detach authentic HUD and add edge-to-edge fullscreen`

Commit only on PASS or `PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING`, with result
commit `SELF`, exact artifact identity, and an empty worktree afterward.
