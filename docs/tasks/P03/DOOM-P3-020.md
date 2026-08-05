## DOOM-P3-020 — Build strict offline single-file candidate

**Intelligence:** LUNA-H  
**Phase:** P03  
**Depends on:** DOOM-P3-010  
**Branch:** phase/p03-single-file  
**Allowed files/directories:** .agent/task-state.json; .gitignore; cmake/SFHSWasm.cmake; tools/build-wasm.sh; tools/build-single-file.sh; tools/package-inline-js.py; tools/validate-single-file.py; web/p3/shell.html; tests/test_single_file_build.py; docs/BUILD_IDENTITY.md; docs/DECISIONS.md; docs/UPSTREAM_DELTA.md; docs/reports/P03_SINGLE_FILE_BUILD.md; docs/results/P03/DOOM-P3-020.md; evidence/logs/P03/P3-020/**; evidence/manifests/P03/sfhs-doom-freedoom2.json; evidence/task-runs/P03-DOOM-P3-020/**; dist/sfhs-doom-freedoom2.html
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Build the P2-derived strict single-file artifact using `-sSINGLE_FILE=1` and
`--embed-file`, with delayed main, trusted Start, existing shell/audio paths,
and no C-source changes. Use the bounded inline-JavaScript fallback only when
the direct custom-shell route requires it.

### Acceptance and commit

Two clean builds, one staged HTML only, static validator pass, embedded Wasm
and WAD identity, no sibling runtime dependency. Commit:
`DOOM-P3-020 build strict offline single-file candidate`

### Constraints

No C source, gameplay, renderer, SDL, compatibility, or sibling runtime
dependency is permitted.

### Work

Build the named P3 profile twice from empty ignored directories, validate the
single-file output, and record exact command and artifact identity.

### Exact verification

Run both clean single-file builds, the static validator, focused build tests,
artifact manifest validation, and task validation.

### Evidence output

`docs/reports/P03_SINGLE_FILE_BUILD.md`, the P3 candidate manifest, and P3-020
build logs.

### Stop/block conditions

Stop if direct packaging needs an unbounded fallback, a sibling file, or a C
source change.

### Commit

`DOOM-P3-020 build strict offline single-file candidate`
