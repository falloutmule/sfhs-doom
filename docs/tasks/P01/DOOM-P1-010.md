## DOOM-P1-010 — Pin the native host and toolchain

**Intelligence:** LUNA-M
**Phase:** P01
**Depends on:** DOOM-P1-000
**Branch:** phase/p01-native-oracle
**Allowed files/directories:** .agent/task-state.json; .gitignore; docs/toolchains/NATIVE_TOOLCHAIN.md; docs/results/P01/DOOM-P1-010.md; evidence/logs/P01/P1-010/**; evidence/task-runs/P01-DOOM-P1-010/**; tests/test_native_toolchain.py; tools/native-env.sh; tools/native-toolchain-doctor.sh
**Parallel:** No
**Remote authorization:** NONE

### Goal

Record the existing default WSL2 host and install only the missing native build/test packages inside that distribution.

### Constraints

- Use the existing default WSL2 distribution only; no Docker, MSYS2, Windows-host install, or new distribution.
- Package installation is allowed only through the WSL package manager and must be documented.
- The doctor never installs or uses the network.
- Do not change engine source or build behavior.

### Work

Inspect WSL identity, path mapping, compiler/linker, CMake, Ninja, pkg-config, Python, SDL2, SDL2_mixer, Xvfb/WSLg, and automation tools. Inspect pinned CMake/SDL requirements. Install only missing authorized packages. Implement deterministic native-env.sh and PASS/FAIL native-toolchain-doctor.sh; add tests and record exact versions, package queries, optional dependency policy, and install commands.

### Exact verification

    wsl.exe --status
    wsl.exe --list --verbose
    wsl.exe bash -lc 'uname -a'
    wsl.exe bash -lc 'cat /etc/os-release'
    wsl.exe bash -lc 'cd "<translated-repo-path>" && bash tools/native-toolchain-doctor.sh'
    python -m unittest tests.test_native_toolchain
    python tools/taskctl.py validate

### Acceptance

One existing WSL2 distro is pinned; every required component reports PASS; SDL minimums are satisfied; optional parity dependencies are explicitly absent/disabled; no-install doctor and package evidence are complete.

### Evidence output

- docs/toolchains/NATIVE_TOOLCHAIN.md
- evidence/logs/P01/P1-010/**
- evidence/task-runs/P01-DOOM-P1-010/**
- docs/results/P01/DOOM-P1-010.md

### Stop/block conditions

No usable WSL2 distro, interactive credentials unavailable, package manager failure, missing SDL minimums, or any need for a host/new-distro/architecture substitution.

### Commit

One local commit only: DOOM-P1-010 pin native oracle host and toolchain.
