# DOOM-P6-064 — Repair mobile weapon cycling

**Intelligence:** CODEX
**Phase:** P06
**Status:** PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING
**Depends on:** DOOM-P6-063 and exact published V15 baseline
**Branch:** `repair/p6-v16-weapon-cycle`
**Base:** `0112ccd69d9bf0bf1dd9a90afb833fec6a819808`
**Parallel:** No; one source-modifying writer
**Remote authorization:** None. Produce a clean local repair commit only.

**Result:** `docs/results/P06/DOOM-P6-064.md`

## Goal

Create V16 that makes both existing WPN- and WPN+ touch buttons change the
actual ready weapon through Chocolate Doom's standard previous/next weapon
responder. Preserve all accepted V15 presentation, panel preferences, LOOK tap
options, settings, shared controls, native simulation, renderer, HUD, saves,
demos, audio, fullscreen, and lifecycle behavior.

## Root cause

The shared pulse controls fire correctly, but Chocolate Doom loads
`key_prevweapon=0` and `key_nextweapon=0` when no extra configuration exists.
`sfhs_mobile_input_pulse()` therefore returns `-2` and posts no Doom event. V15
tests proved controller pulse counts but did not assert a ready-weapon change.

## Allowed files/directories

- `web/p6/shell.html`
- `browser-tests/tests/p6-v16-weapon-cycle-repair.spec.mjs`
- `tests/test_p6_mobile_contract.py`
- `tools/validate-p6-mobile.py`
- `.github/workflows/p6-candidate-pages.yml` (identity preparation only)
- V16 task/result/report/current-state/compatibility/upstream documentation
- `evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v16.json`
- `test-results/P06/P6-064/**` (ignored)
- `dist/sfhs-doom-android-sfhs-controls-v16.html` (generated only)

V8 through V15 artifacts, native/engine source, shared SFHS source, and shared
profile/schema files are read-only.

## Repair contract

- Provide Doom's standard comma/period previous/next bindings through a private
  browser-owned extra-config file before `callMain`.
- Do not change `src/**`, the native responder, `G_NextWeapon`, the mobile input
  bridge, the shared control package, or any persisted browser profile schema.
- Continue routing both buttons through `sfhs_mobile_input_pulse()` and ordinary
  `D_PostEvent()` keydown/keyup events.
- Prove WPN- changes the initial pistol to fist and WPN+ changes fist back to
  pistol using the real read-only ready-weapon diagnostic.
- Prove each pulse posts one keydown and one keyup, leaves held mask zero, and
  leaves no active pointers.

## Required verification

- Official V16 product and oracle builds plus static validator.
- Focused V16 Playwright in portrait and landscape/direct-file routes.
- Unchanged V15 focused gate and applicable shared-controls/input regressions.
- Python mobile, single-file/offline, manifest, native-demo, and Wasm contracts.
- Exact V8-V15 protected hashes, no external assets, no commercial data, no
  eval/inline handlers, workflow YAML, and `git diff --check`.

## Acceptance

Local PASS requires real weapon-state transitions in both directions and no V15
regression. Physical Samsung verification remains required after separately
authorized publication.

## Commit

`DOOM-P6-064 repair mobile weapon cycling`
