# Native Oracle Toolchain

**Task:** DOOM-P1-010
**Status:** VERIFIED
**Source commit inspected:** 840fac0287f89810d346b72ac5977221fab97b57
**Pinned upstream base:** 410d96855b5df5410ff591a90efeafa889119224

## Host

| Field | Verified value |
|---|---|
| Windows WSL default distribution | Ubuntu |
| WSL generation | 2 |
| Distribution | Ubuntu 24.04.4 LTS (Noble Numbat) |
| Kernel | 6.6.87.2-microsoft-standard-WSL2 |
| Architecture | x86_64 / dpkg amd64 |
| Repository path | /mnt/c/Users/fallo/Documents/Single-File-Html/sfhs-doom |
| WSLg display | DISPLAY=:0; WAYLAND_DISPLAY=wayland-0 |
| Headless display | Xvfb package 2:21.1.12-1ubuntu1.6 |

The existing default Ubuntu distribution is the P1 native-oracle host. No new distribution, Docker environment, or Windows-host package manager was used.

## Pinned upstream requirements

Direct inspection of the pinned checkout found:

- CMake minimum 3.7.2.
- SDL2 minimum 2.0.14.
- SDL2_mixer minimum 2.0.2.
- SDL2_net is optional and controlled by ENABLE_SDL2_NET.
- SampleRate, PNG, and FluidSynth are optional discoveries.

## Tool and package identity

| Component | Version |
|---|---|
| GCC | 13.3.0 |
| GNU ld/binutils | 2.42 |
| CMake | 3.28.3 / package 3.28.3-1build7 |
| Ninja | 1.11.1 / package 1.11.1-2 |
| pkg-config | 1.8.1 / package 1.8.1-2build1 |
| Python | 3.12.3 |
| SDL2 | 2.30.0 / package 2.30.0+dfsg-1ubuntu3.1 |
| SDL2_mixer | 2.8.0 / package 2.8.0+dfsg-1build3 |
| Xvfb | package 2:21.1.12-1ubuntu1.6 |
| xauth | 1:1.1.2-1build1 |
| ImageMagick | 6.9.12-98 / package 8:6.9.12.98+dfsg1-5.2build2 |
| xdotool | 3.20160805.1 |
| curl | 8.5.0-2ubuntu10.11 |
| unzip | 6.0-28ubuntu4.1 |
| CA certificates | 20260601~24.04.1 |

SDL2 and SDL2_mixer exceed the pinned upstream minimums.

## Installation record

Already present before P1-010:

    build-essential python3 xauth curl unzip ca-certificates

Requested and installed through Ubuntu apt:

    cmake ninja-build pkg-config libsdl2-dev libsdl2-mixer-dev xvfb imagemagick xdotool

The initial noninteractive sudo attempt correctly failed because the default user required a password. The existing distribution’s standard WSL root launch was then directly verified and used for the same noninteractive apt command. No credential was requested, stored, or handled.

Ubuntu installed FluidSynth and libsamplerate development support transitively through libsdl2-mixer-dev. They were not requested as product features.

## Optional dependency parity policy

| Optional component | Observed host state | Canonical P1 build policy |
|---|---|---|
| SDL2_net | ABSENT | ENABLE_SDL2_NET=OFF |
| FluidSynth | PRESENT, 2.3.4, transitive | CMAKE_DISABLE_FIND_PACKAGE_FluidSynth=TRUE |
| SampleRate | PRESENT, 0.2.2, transitive | CMAKE_DISABLE_FIND_PACKAGE_SampleRate=TRUE |
| PNG | ABSENT through pkg-config | CMAKE_DISABLE_FIND_PACKAGE_PNG=TRUE |

Presence on the host does not authorize linkage. P1-020 must pass the explicit disable flags and capture the CMake cache/link dependencies.

## Environment and doctor contract

tools/native-env.sh:

- resolves the repository root from its own location;
- refuses invocation when the current directory is outside the repository;
- exports C.UTF-8 and UTC;
- defines build, runtime, evidence, and vendor-cache roots;
- prints source/upstream identity when executed;
- installs nothing and performs no network action.

tools/native-toolchain-doctor.sh:

- reports explicit PASS/FAIL for every required command and package;
- checks SDL minimum versions;
- records optional dependencies as ABSENT or PRESENT_DISABLED;
- has a forced-missing test hook for deterministic failure testing;
- installs nothing and performs no network action.

## Limitations

No native executable was configured, compiled, linked, or run in P1-010. Package availability is not build proof. P1-020 owns clean Debug/Release builds and exact linked-library evidence.
