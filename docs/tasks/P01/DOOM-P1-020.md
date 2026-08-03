## DOOM-P1-020 — Reproducible native Debug and Release builds

**Intelligence:** LUNA-M
**Phase:** P01
**Depends on:** DOOM-P1-010
**Branch:** phase/p01-native-oracle
**Allowed files/directories:** .agent/task-state.json; .gitignore; docs/BUILD_IDENTITY.md; docs/results/P01/DOOM-P1-020.md; evidence/logs/P01/P1-020/**; evidence/manifests/P01/**; evidence/task-runs/P01-DOOM-P1-020/**; tests/test_build_native.py; tools/build-native.sh; tools/hash-artifact.py
**Parallel:** No
**Remote authorization:** NONE

### Goal

Build native Debug and Release Chocolate Doom from separate ignored directories with declared identity and valid artifact manifests.

### Constraints

- CMake + Ninja and the packet’s parity options are canonical.
- Refuse dirty engine/build-system source, wrong repository, unknown configs, or failed toolchain doctor.
- Do not hand-edit upstream source or generated artifacts.

### Work

Implement tools/build-native.sh with --config debug|release|all, --clean-build-dir, and --print-identity. Capture configure/build commands, cache, compiler/linker, source/upstream identity, duration, executable path/size/hash, and dynamic dependencies. Add tests and manifests. Rebuild from empty ignored directories twice and compare identity fields.

### Exact verification

    wsl.exe bash -lc 'cd "<repo>" && bash tools/build-native.sh --config all --clean-build-dir'
    wsl.exe bash -lc 'cd "<repo>" && file build/native/debug/**/chocolate-doom'
    wsl.exe bash -lc 'cd "<repo>" && file build/native/release/**/chocolate-doom'
    wsl.exe bash -lc 'cd "<repo>" && ldd build/native/debug/**/chocolate-doom'
    wsl.exe bash -lc 'cd "<repo>" && ldd build/native/release/**/chocolate-doom'
    python -m unittest tests.test_build_native
    python tools/validate_artifact_manifest.py <debug-manifest>
    python tools/validate_artifact_manifest.py <release-manifest>
    python tools/taskctl.py validate

### Acceptance

Debug and Release succeed twice; executables exist and are executable; manifests validate; source identity is consistent; rerun is safe; no engine file changes.

### Evidence output

- evidence/manifests/P01/**
- evidence/logs/P01/P1-020/**
- docs/results/P01/DOOM-P1-020.md

### Stop/block conditions

Toolchain doctor failure, CMake target/configuration incompatibility, missing executable, identity mismatch, source change requirement, or unsafe build-directory deletion.

### Commit

One local commit only: DOOM-P1-020 add reproducible native debug and release builds.
