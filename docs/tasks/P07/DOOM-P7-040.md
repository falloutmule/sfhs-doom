## DOOM-P7-040 — Preserve V16 player parity

**Intelligence:** CODEX
**Phase:** P07
**Status:** PASS
**Depends on:** DOOM-P7-030
**Branch:** `feature/p7a-forge-runtime`
**Allowed files/directories:** `web/p7/forge-shell.html`, `browser-tests/tests/p7a-forge-runtime.spec.mjs`, `test-results/P07/P7-A/**`
**Parallel:** No
**Remote authorization:** NONE

### Goal

Launch verified content exactly once into the complete V16 player.

### Context

V16 provides accepted player geometry, controls, settings, audio, HUD/minimap, renderer, lifecycle, and weapon repair.

### Constraints

No fake later-tranche surfaces, second main call, new persistence schema, or behavior change.

### Work

1. Generate exact recipe arguments after mount.
2. Expose bounded boot/status/base/Play/diagnostic UI.
3. Run automatic/compatibility and V16 protected regressions.

### Exact verification

```text
Playwright P7-A portrait/landscape full and thin parity plus P6 protected browser lanes.
```

### Acceptance

World/HUD backings, controls, WPN cycling, audio, renderers, no-scroll, direct file, and ending input state match V16.

### Evidence output

- `test-results/P07/P7-A/full-landscape-compatibility.json`

### Stop/block conditions

Stop for any V16 regression, external request, console/page failure, or repeated main call.

### Commit

One focused implementation commit begins with `DOOM-P7-040`.
