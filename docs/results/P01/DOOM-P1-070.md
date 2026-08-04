# TASK RESULT

Task: DOOM-P1-070
Status: PASS
Base commit: b06baf72a78539e5ebd130aba9cee0f159ca2f84
Result commit: SELF
Branch: phase/p01-native-oracle

## Work performed

- Added a common machine-readable demo result creator, normalizer, and matrix aggregator.
- Added bounded native recording, normal/strict playback, and timedemo runners using only the pinned ignored Freedoom cache and isolated runtime paths.
- Proved a fresh native one-tic recording reproduces the existing project-created, licensed, manifest-bound `oracle.lmp` fixture byte-for-byte rather than weakening the P1-060 fixture-set invariant.
- Captured repeated Debug/Release project-demo evidence and bounded official Freedoom DEMO1 evidence.
- Added regression tests and a provenance, identity, result, and limitation report.

## Verification

- `wsl.exe bash -lc 'cd "<repo>" && bash tools/record-native-demo.sh'`: PASS; normalized one tic, 18 bytes, SHA-256 `45f9177a339e21c8a6459dcf3d1d678e1cc777ddf71d7065c9e8f15fb5c58adb`; byte comparison with committed fixture passed; recording result PASS.
- `wsl.exe bash -lc 'cd "<repo>" && bash tools/run-native-demo.sh --matrix'`: PASS; 14/14 normal/strict results.
- `wsl.exe bash -lc 'cd "<repo>" && bash tools/run-native-timedemo.sh --matrix'`: PASS; 7/7 results; project end tic 1 across six Debug/Release repetitions; official DEMO1 end tic 7117.
- `python -m unittest tests.test_native_demo_harness`: PASS; 5 tests.
- `python tools/taskctl.py validate`: PASS.
- `python -m unittest tests.test_oracle_fixtures`: PASS; 7 tests, proving the prior fixture manifest and deterministic-generation invariant remain intact.

## Failures and corrections

An initial apparent normal-playback timeout occurred after demo completion because Chocolate Doom entered its interactive ENDOOM screen. The final isolated test extra configs set `show_endoom 0`, allowing deterministic post-playback termination without changing engine source or normal configuration.

An initial second demo fixture would have conflicted with the P1-060 exact fixture manifest. The final implementation instead records one native tic into evidence and requires it to reproduce the existing project-created demo fixture exactly. No committed P1-060 file was changed and unknown-fixture rejection remains intact.

## Changed files

- `.agent/task-state.json`
- `docs/reports/NATIVE_DEMO_BASELINE.md`
- `docs/results/P01/DOOM-P1-070.md`
- `evidence/task-runs/P01-DOOM-P1-070/**`
- `tests/test_native_demo_harness.py`
- `tools/demo-result.py`
- `tools/record-native-demo.sh`
- `tools/run-native-demo.sh`
- `tools/run-native-timedemo.sh`

## Acceptance mapping

- Project demo records deterministically: PASS by native recording, normalization, and byte equality.
- Normal and strict playback repeatedly complete: PASS in Debug and Release, three repetitions each.
- Timedemo has a stable end and Debug/Release agree: PASS at project tic 1 across six runs.
- Results are machine-readable: PASS through per-run JSON and aggregate matrices.
- Provenance and limitations documented: PASS in `docs/reports/NATIVE_DEMO_BASELINE.md`.
- No broad compatibility claim, engine redesign, remote action, commercial data, WebAssembly work, destructive Git action, or parent-workspace modification: PASS.

## Evidence paths

- `evidence/task-runs/P01-DOOM-P1-070/record/result.json`
- `evidence/task-runs/P01-DOOM-P1-070/record/raw-recording.lmp`
- `evidence/task-runs/P01-DOOM-P1-070/record/normalized-recording.lmp`
- `evidence/task-runs/P01-DOOM-P1-070/demo/matrix.json`
- `evidence/task-runs/P01-DOOM-P1-070/timedemo/matrix.json`
- `docs/reports/NATIVE_DEMO_BASELINE.md`

## Current exact state

The task is ready for final exact verification and its one required local commit on `phase/p01-native-oracle`. No remote action occurred. The worktree must be verified clean after commit.

## Remaining blockers and next task

No P1-070 blocker remains if the final exact verification passes. Continue immediately with DOOM-P1-080 after the single P1-070 commit.
