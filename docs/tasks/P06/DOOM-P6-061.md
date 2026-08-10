# DOOM-P6-061 — Add LOOK tap-to-fire candidate

**Intelligence:** CODEX
**Phase:** P06
**Status:** PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING
**Depends on:** DOOM-P6-060 and exact published V12 baseline
**Branch:** `feature/p6-v13-look-tap-fire`
**Base:** `181fa3a190afb8bc9d18e2216690686e0531c027`
**Parallel:** No; one source-modifying writer
**Remote authorization:** After every local V13 gate passes, publish only exact V13 through the established main/Pages workflow.

**Result:** `docs/results/P06/DOOM-P6-061.md`

## Goal

Add a Doom-specific tap recognizer to the existing LOOK surface. A short,
low-movement LOOK tap queues one authoritative Doom FIRE press/release while a
drag remains LOOK-only. Keep the dedicated FIRE control and every V12 layout,
presentation, HUD, editor, native, profile, and shared-control contract.

## Allowed files/directories

- `web/p6/shell.html`
- `browser-tests/tests/p6-v13-look-tap-fire.spec.mjs`
- `tools/validate-p6-mobile.py`
- `tests/test_p6_mobile_contract.py`
- `.github/workflows/p6-candidate-pages.yml`
- `docs/CURRENT_STATE.md`
- `docs/UPSTREAM_DELTA.md`
- `docs/COMPATIBILITY_MATRIX.md`
- `docs/tasks/P06/DOOM-P6-061.md`
- `docs/results/P06/DOOM-P6-061.md`
- `docs/reports/P06_V13_LOOK_TAP_FIRE.md`
- `evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v13.json`
- `test-results/P06/P6-061/**` (ignored backup and evidence)
- `dist/sfhs-doom-android-sfhs-controls-v13.html` (generated only)

V8 through V12 artifacts, Doom/native sources, `src/sfhs_mobile`, CMake, shared
SFHS core, and `vendor/sfhs-mobile-controls-v1` are read-only.

## Behavior contract

- Accept one tap on release when duration is at most 300 ms and maximum travel
  from the start is at most 12 CSS pixels.
- Apply to primary mouse, pen, Pointer Event touch, and the existing Touch Event
  fallback.
- Ignore gestures before Doom starts or outside the mounted gameplay lifecycle.
- Cancel without firing on excess travel, timeout, pointer/touch cancellation,
  early capture loss, blur, hidden document, pagehide, edit entry, import,
  reset, or controller release.
- Queue no more than four taps. Drain each as one authoritative FIRE tic and at
  least one release tic before the next pulse.
- Dedicated FIRE takes precedence and clears pending LOOK-tap pulses so no
  delayed extra shot occurs.
- The recognizer observes the shared route but never changes its capture,
  `preventDefault`, stop-propagation, ownership, profile, or persistence logic.
- Keep the visible LOOK label and dedicated FIRE button unchanged.
- Expose only read-only tap diagnostics through the existing adapter snapshot.

## Failure-mode audit

Actively guard Hermes modes **A, B, C, D, K, L, M, N, O, P, Q, S, and T**.
Modes L/M/P are primary: no stuck FIRE, MOVE/LOOK pointer interference, tap
leakage under editing or lifecycle cancellation, or delayed queued input.

## Required verification

- Focused V13 browser gate for accepted tap, jitter, drag rejection, timeout,
  pointercancel, capture loss, blur, visibility, pagehide, edit entry, rapid
  pulses, MOVE concurrency, dedicated FIRE precedence, native ammo/HUD change,
  and empty held state afterward.
- Preserve V12 4:3/full-frame automatic and compatibility coverage at 360x800,
  400x844, 576px physical-like width, and landscape fallback.
- Run protected V12/V11/V10/V9 tests unchanged plus applicable shared controls,
  MOVE, Samsung LOOK, editor, audio, offline, package, and native gates.
- Build product and oracle artifacts through `tools/build-single-file.sh`.
- Validate exact one-document packaging, no external assets/Wasm, manifest,
  protected hashes, `git diff --check`, secrets/commercial-data scope, and clean
  committed state.

## Acceptance and publication

Commit with `PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING` only after all local gates
pass. Then fast-forward exact V13 through the established Pages workflow, wait
for verification and deployment, hash the live bytes, and return for Samsung
tap/drag/editor/audio acceptance.

## Commit

`DOOM-P6-061 add LOOK tap-to-fire candidate`
