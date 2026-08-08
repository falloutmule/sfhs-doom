## DOOM-P6-051 — Integrate SFHS Mobile Controls v1

**Intelligence:** LUNA-H  
**Phase:** P06  
**Status:** LOCAL/EMULATOR PASS  
**Depends on:** DOOM-P6-040  
**Branch:** `repair/p6-sfhs-mobile-controls-v6`  
**Allowed files/directories:** .agent/task-state.json; vendor/sfhs-mobile-controls-v1/**; web/p6/shell.html; src/sfhs_mobile/sfhs_mobile_input.c; src/sfhs_mobile/sfhs_mobile_input.h; src/i_video.c; tools/build-single-file.sh; tools/inject-mobile-controls-bundle.py; browser-tests/tests/p6-layout.spec.mjs; browser-tests/tests/p6-sfhs-controls-v6.spec.mjs; tests/test_p6_mobile_contract.py; tests/test_p6_sfhs_controls_v6.py; docs/tasks/P06/DOOM-P6-051.md; docs/results/P06/DOOM-P6-051.md; docs/reports/P06_SFHS_MOBILE_CONTROLS_V6.md; evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v6.json; evidence/logs/P06/P6-051/**; dist/sfhs-doom-android-sfhs-controls-v6.html  
**Parallel:** No  
**Remote authorization:** NONE  
**Base:** `2353154a279c9a24a61e150b0ebeaaa4f8cd29f1`

### Goal

Replace the P6 Doom-specific DOM gameplay-control runtime with the frozen,
renderer-neutral `@sfhs/mobile-controls` v1 package and build a local V6
single-file candidate.

### Constraints

- The accepted dependency is `sfhs-mobile-controls-v1-accepted-b02336c.zip`,
  52,596 bytes, SHA-256
  `f360fe5a9c80ffc78f2fc38ecd4fe22b149702d251ecf3f0fbeca20348123d25`.
- Preserve the P3 and V5 artifacts exactly; do not deploy or make any remote
  change.
- Use one DOM gameplay-control runtime and one relative LOOK event-rate
  accumulator: the shared controller, flushed at Doom's `I_StartTic()` seam.
- Keep `-nograbmouse`, ordinary configured Doom input semantics, the existing
  renderer, HUD, minimap, audio, and one-file/offline packaging.

### Acceptance

- V6 mounts the frozen control package as the only gameplay control runtime.
- `relativeSensitivity = 1.0` maps a declared full-width LOOK gesture to about
  180 degrees at Chocolate Doom's default `mouseSensitivity = 5`.
- Focused browser and contract checks cover input, lifecycle, editor/profile,
  layout, offline packaging, and protected artifact identity.

### Work

Vendor the accepted source-only package, bundle it as the sole DOM gameplay
control runtime, replace the old P6 control/editor/profile code, and map the
controller outputs to ordinary Doom keys and mouse input at `I_StartTic()`.

### Exact verification

Run the V6 provenance/contract checks, V6 browser controls test, bounded P6
browser selection, static candidate validator, project/task validation,
artifact-manifest validation, and protected P3/V5 hash checks.

### Evidence output

- `evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v6.json`
- `evidence/logs/P06/P6-051/`
- `docs/reports/P06_SFHS_MOBILE_CONTROLS_V6.md`

### Stop/block conditions

Stop if the frozen dependency identity differs, a protected artifact changes,
or a focused gate fails.

### Candidate

`dist/sfhs-doom-android-sfhs-controls-v6.html`

### Remote authorization

None. Physical Samsung acceptance remains a separate P6-050 gate.

### Commit

`DOOM-P6-051 integrate SFHS mobile controls V6`
