# TASK RESULT

**Task:** DOOM-P1-020
**Status:** PASS
**Base commit:** a70068ffc8aac5a93ffe281461f2967bc7ff71d2
**Result commit:** SELF
**Branch:** phase/p01-native-oracle

## What was done

- Made the artifact manifest contract phase-aware under the authorized narrow amendment while preserving the P00 fixture contract and tamper checks.
- Added a guarded CMake + Ninja build driver for separate ignored Debug and Release directories.
- Pinned the optional dependency controls required by the P1-010 toolchain record.
- Added artifact hashing, build identity, manifest validation, argument rejection, guarded cleanup, and repeated-build tests.
- Rebuilt both configurations twice from empty directories and retained command, cache, executable, and dependency evidence for every successful run.

## What was verified

- Both Debug and Release builds succeeded twice from clean build directories.
- Both outputs are executable x86-64 Linux PIE ELF files.
- Debug SHA-256 repeated exactly: `a01002e005095444ada8eea8539882b158fdc0bd205fd26c67fdc944ceec7029` at 2,574,848 bytes.
- Release SHA-256 repeated exactly: `55d776c3e9d7905922852a84b1de568dd81e2b731a3918954964c2dabe9234fb` at 1,101,144 bytes.
- Stable source, upstream, toolchain, configuration, option, size, and hash identities match between rebuilds.
- The direct application linkage includes SDL2 and SDL2_mixer and excludes SDL2_net. FluidSynth and libsamplerate appear through the distribution SDL2_mixer dependency closure; their direct Chocolate Doom CMake integrations remained disabled.
- Four P01 build manifests validate and the existing P00 fixture remains valid.
- No engine or upstream build-system file changed.

## What failed

The first build launch was terminated by the command runner timeout while Ninja was active. A retry immediately afterward found a temporarily retained Debug build directory and safely refused cleanup. After direct process inspection confirmed no build process remained, the guarded cleanup and both required two-build passes succeeded. No source or tracked generated artifact was damaged.

## Changed files

    .agent/task-state.json
    docs/BUILD_IDENTITY.md
    docs/results/P01/DOOM-P1-020.md
    evidence/logs/P01/P1-020/**
    evidence/manifests/artifact-manifest.schema.json
    evidence/manifests/P01/**
    evidence/task-runs/P01-DOOM-P1-020/**
    tests/test_artifact_manifest.py
    tests/test_build_native.py
    tools/build-native.sh
    tools/hash-artifact.py
    tools/validate_artifact_manifest.py

## Commands and exact results

- `bash tools/build-native.sh --config all --clean-build-dir`: PASS twice after the bounded timeout recovery; each successful pass produced Debug and Release manifests.
- `file build/native/debug/**/chocolate-doom`: x86-64 PIE ELF, dynamically linked, debug_info, not stripped.
- `file build/native/release/**/chocolate-doom`: x86-64 PIE ELF, dynamically linked, not stripped.
- `ldd` for both executables: all dependencies resolved; SDL2 and SDL2_mixer present; SDL2_net absent.
- `python -m unittest tests.test_build_native`: 7 tests, OK.
- `python -m unittest tests.test_artifact_manifest`: 17 tests, OK.
- `python tools/validate_artifact_manifest.py <each build manifest>`: MANIFEST PASS.
- Result commit: SELF is the containing-commit sentinel.

## Acceptance mapping

- Debug and Release succeed twice: PASS.
- Executables exist and are executable: PASS.
- Manifests validate: PASS.
- Source and stable rebuild identity consistent: PASS.
- Rerun and cleanup are guarded and safe: PASS.
- No engine file changes: PASS.

## Evidence paths

- `evidence/manifests/P01/`
- `evidence/logs/P01/P1-020/`
- `evidence/task-runs/P01-DOOM-P1-020/`
- `docs/BUILD_IDENTITY.md`
- `tests/test_build_native.py`

## Current exact state

Native Debug and Release Chocolate Doom artifacts are VERIFIED at source commit `a70068ffc8aac5a93ffe281461f2967bc7ff71d2`. Build outputs remain ignored under `build/native/`; manifests and command evidence are tracked.

## Known limitations

This task proves native compilation and repeatable artifact identity only. It does not claim gameplay, data, demo, timedemo, audio, compatibility, or oracle behavior.

## Remaining blocker or next task

No P1-020 blocker remains. Continue with DOOM-P1-030.

## Post-run Git status

To be verified clean after the single P1-020 commit.
