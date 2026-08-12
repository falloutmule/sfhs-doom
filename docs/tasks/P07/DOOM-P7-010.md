## DOOM-P7-010 — Build content-independent engine

**Intelligence:** CODEX
**Phase:** P07
**Status:** PASS
**Depends on:** DOOM-P7-001
**Branch:** `feature/p7a-forge-runtime`
**Allowed files/directories:** `web/p7/**`, `tools/build-forge-capsule.sh`, `tools/package-forge-capsule.py`, `test-results/P07/P7-A/**`
**Parallel:** No
**Remote authorization:** NONE

### Goal

Build the V16-derived product runtime without embedding an IWAD.

### Context

V16 uses SINGLE_FILE Emscripten plus `--embed-file`; Forge must keep SINGLE_FILE Wasm while removing game content.

### Constraints

P6, native, shared controls, and protected artifacts remain read-only. `callMain` cannot run before verified mount.

### Work

1. Add a separate P7 shell and build profile.
2. Compile with `INVOKE_RUN=0`, no embed/preload content flag.
3. Preserve mobile exports and detached HUD.

### Exact verification

```text
bash tools/build-forge-capsule.sh --output dist/sfhs-doom-forge-v1.html
Inspect configure argv for no embedded file flag and output for no external Wasm.
```

### Acceptance

The engine initializes without an IWAD and has zero main invocations before a verified mount.

### Evidence output

- `test-results/P07/P7-A/build/`

### Stop/block conditions

Stop if separation requires native/shared changes or an external runtime file.

### Commit

One focused implementation commit begins with `DOOM-P7-010`.
