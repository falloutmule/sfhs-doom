# TASK RESULT

**Task:** DOOM-P1-010
**Status:** PASS
**Base commit:** 840fac0287f89810d346b72ac5977221fab97b57
**Result commit:** SELF
**Branch:** phase/p01-native-oracle

## What was done

- Inspected the existing default Ubuntu WSL2 distribution, kernel, architecture, path mapping, compiler, linker, build tools, SDL packages, display paths, and automation utilities.
- Installed only the eight missing requested packages inside the existing Ubuntu distribution.
- Recorded transitive optional dependencies separately from requested features.
- Added deterministic repository environment and no-install/no-network doctor scripts.
- Added path, success, forced-failure, and no-installer unit tests.
- Added ignored native/runtime/vendor-cache roots and exact host/toolchain evidence.

## What was verified

- Ubuntu 24.04.4 LTS runs as WSL2 on x86_64/amd64.
- GCC 13.3.0, GNU ld 2.42, CMake 3.28.3, Ninja 1.11.1, pkg-config 1.8.1, and Python 3.12.3 are available.
- SDL2 2.30.0 and SDL2_mixer 2.8.0 exceed upstream minimums.
- Xvfb, WSLg, xauth, ImageMagick, xdotool, curl, unzip, and CA certificates are available.
- The doctor reports every required command/package PASS.
- SDL2_net and libpng pkg-config identities are absent.
- FluidSynth 2.3.4 and SampleRate 0.2.2 are present transitively and explicitly marked PRESENT_DISABLED.
- The doctor performs no installation or network access.
- Five focused tests pass.

## What failed

The initial sudo -n installation attempt failed because the default WSL user requires a password. The existing distribution’s standard noninteractive root launch was directly verified and used successfully for the same authorized apt operation. No credential was requested or handled.

## Changed files

    .agent/task-state.json
    .gitignore
    docs/toolchains/NATIVE_TOOLCHAIN.md
    docs/results/P01/DOOM-P1-010.md
    evidence/logs/P01/P1-010/native-toolchain-doctor.txt
    evidence/logs/P01/P1-010/package-installation.txt
    evidence/task-runs/P01-DOOM-P1-010/doctor.stderr.txt
    evidence/task-runs/P01-DOOM-P1-010/doctor.stdout.txt
    evidence/task-runs/P01-DOOM-P1-010/host-inventory.stdout.txt
    evidence/task-runs/P01-DOOM-P1-010/tests.stdout.txt
    tests/test_native_toolchain.py
    tools/native-env.sh
    tools/native-toolchain-doctor.sh

## Commands and exact results

- wsl.exe --status: default Ubuntu, WSL version 2.
- wsl.exe --list --verbose: Ubuntu running as version 2.
- uname and os-release: Ubuntu 24.04.4 LTS, WSL2 kernel 6.6.87.2, x86_64.
- package install: first sudo -n attempt failed; verified WSL root invocation succeeded; apt exited 0.
- bash tools/native-toolchain-doctor.sh: NATIVE_TOOLCHAIN_DOCTOR=PASS.
- python -m unittest -v tests.test_native_toolchain: 5 tests, OK.
- Result commit: SELF is the containing-commit sentinel.

## Acceptance mapping

- Existing WSL2 distro selected and identified: PASS.
- Required tools and SDL minimums: PASS.
- Optional parity dependencies absent or explicitly disabled: PASS.
- Doctor no-install/no-network behavior: PASS.
- Exact install commands/package versions documented: PASS.
- No engine source changed: PASS.

## Evidence paths

- docs/toolchains/NATIVE_TOOLCHAIN.md
- evidence/logs/P01/P1-010/native-toolchain-doctor.txt
- evidence/logs/P01/P1-010/package-installation.txt
- evidence/task-runs/P01-DOOM-P1-010/
- tests/test_native_toolchain.py

## Current exact state

The native host/toolchain prerequisites are VERIFIED. Native compilation and runtime behavior remain UNTESTED until P1-020 and later tasks.

## Known limitations

Package/tool presence is not build proof. FluidSynth and SampleRate are installed transitively and must be disabled explicitly during every canonical P1 build.

## Remaining blocker or next task

No P1-010 blocker remains. Continue with DOOM-P1-020.

## Post-run Git status

Verified clean after the single P1-010 commit.
