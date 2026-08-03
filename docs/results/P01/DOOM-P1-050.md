# TASK RESULT

**Task:** DOOM-P1-050
**Status:** PASS
**Base commit:** df474c7270ed193f3062e81f3febff2794e6d292
**Result commit:** SELF
**Branch:** phase/p01-native-oracle

## What was done

- Added bounded, isolated Xvfb gameplay capture for explicit Release executable, IWAD, warp, skill, config, save, home, display, and audio settings.
- Ran Freedoom Phase 1 E1M1 and Phase 2 MAP01 with SDL dummy audio for deterministic automation.
- Separately observed mixer setup using the real PulseAudio backend.
- Captured process lifecycle, argv, environment, IWAD detection, runtime writes, frame statistics, hashes, stdout, stderr, and screenshots.
- Directly inspected both frames and updated only the P1 compatibility rows.
- Repaired the bounded P1-040 verification interaction so `fetch-freedoom.sh --verify-only` performs no writes and validates existing manifests read-only.
- Restored both P1-040 manifests byte-for-byte from the committed P1-040 blobs and corrected the commercial-IWAD check to compare complete basenames.

## What was verified

- Phase 1 is detected as `Freedoom: Phase 1` and shows live E1M1 first-person gameplay.
- Phase 2 is detected as `Freedoom: Phase 2` and shows distinct live MAP01 first-person gameplay.
- Frames are 640x480, nonblank, high-color, and have distinct SHA-256 values.
- Both processes remained healthy at capture.
- Mixer setup was observed separately with PulseAudio.
- All runtime writes remained under each ignored isolated runtime home.
- Verify-only left tracked manifests, cached archive/WAD mtimes, and the pre-existing worktree status unchanged.

## What failed

An initial ad-hoc trial command timed out because shell background precedence launched the setup compound asynchronously, leaving the trial Xvfb and game processes alive. Their exact PIDs were inspected and terminated, and no tracked output resulted. The scoped capture script then ran both bounded cases successfully with cleanup traps. Before this task amendment, `--verify-only` also rewrote the two P1-040 manifests; the authorized repair removed that write path and restored the exact committed blobs.

## Changed files

    .agent/task-state.json
    docs/COMPATIBILITY_MATRIX.md
    docs/results/P01/DOOM-P1-050.md
    evidence/screenshots/P01/P1-050/**
    evidence/task-runs/P01-DOOM-P1-050/**
    tests/test_native_smoke.py
    tools/capture-native-frame.sh
    tools/fetch-freedoom.sh
    tools/run-native-smoke.sh
    tests/test_fetch_freedoom.py

## Commands and exact results

- `bash tools/run-native-smoke.sh --iwad phase1`: `NATIVE_SMOKE=PASS edition=phase1`.
- `bash tools/run-native-smoke.sh --iwad phase2`: `NATIVE_SMOKE=PASS edition=phase2`.
- Phase 1 frame: 640x480, standard deviation 0.115531, 10,547 colors.
- Phase 2 frame: 640x480, standard deviation 0.11137, 8,844 colors.
- `python -m unittest tests.test_native_smoke`: 5 tests, OK.
- `python -m unittest tests.test_fetch_freedoom tests.test_native_smoke`: 15 tests, OK.
- `bash tools/fetch-freedoom.sh --verify-only`: PASS with no manifest/cache/worktree writes.
- Manifest blob hashes: Phase 1 `91c947f9513554f151d7a10431cbbf3f455fb2a7`, Phase 2 `48e25be135e7768ddeea5b21549cfd488751ad05`, each equal to `HEAD:<path>`.
- Result commit: SELF is the containing-commit sentinel.

## Acceptance mapping

- Correct IWAD detection and requested level entry: PASS.
- Nonblank, level-specific gameplay evidence: PASS by direct visual inspection and frame metrics.
- Healthy bounded lifecycle: PASS.
- Isolated writes: PASS.
- Dummy automation and separate real mixer initialization: PASS.

## Evidence paths

- `evidence/screenshots/P01/P1-050/phase1-gameplay.png`
- `evidence/screenshots/P01/P1-050/phase2-gameplay.png`
- `evidence/task-runs/P01-DOOM-P1-050/phase1/`
- `evidence/task-runs/P01-DOOM-P1-050/phase2/`

## Current exact state

Both pinned open Freedoom editions enter distinct native gameplay using the P1-020 Release executable. No engine source changed.

## Known limitations

These are bounded boot/gameplay-entry smokes, not full playthrough, demo determinism, savegame, performance, or broad compatibility proof.

## Remaining blocker or next task

No blocker remains. Continue with DOOM-P1-060.

## Post-run Git status

To be verified clean after the single P1-050 commit.
