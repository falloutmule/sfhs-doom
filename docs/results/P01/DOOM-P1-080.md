# TASK RESULT

Task: DOOM-P1-080
Status: PASS
Base commit: f888f68ea721e7b01fb54946a1bc723b3248b608
Result commit: SELF
Branch: phase/p01-native-oracle

## Work performed

- Recorded ADR-015 before implementation.
- Added a default-OFF `SFHS_ORACLE_TEST` CMake gate and isolated observer sources.
- Added two guarded existing-C hooks for initial/post-tic state and authoritative indexed-framebuffer capture.
- Added deterministic runtime input generation, per-run collection, SHA-256 manifests, repeated-run comparison, and tamper rejection.
- Added five fresh-process baselines, both PWAD orders, a targeted DeHackEd effect, and a separately rebuilt instrumentation-OFF regression.
- Documented source edit budget, contract, hashes, behavior, upstream delta, compatibility row, and limitations.

## Verification

- `wsl.exe bash -lc 'cd "<repo>" && bash tools/build-native.sh --config oracle --clean-build-dir'`: PASS; clean Oracle build and artifact manifest validation.
- `wsl.exe bash -lc 'cd "<repo>" && bash tools/run-native-oracle.sh --repeat 5'`: PASS; five identical baselines, both PWAD orders, targeted DeHackEd effect, and instrumentation-OFF regression.
- `python -m unittest tests.test_native_oracle`: PASS; 7 tests.
- `python tools/oracle/compare-runs.py <run-set>`: PASS.
- `python tools/taskctl.py validate`: PASS.
- `bash tools/run-native-demo.sh --matrix`: PASS; 14/14. The writer's nondeterministic heap-address output was restored exactly to the committed P1-070 blobs afterward, leaving no out-of-scope change.
- `bash tools/run-native-timedemo.sh --matrix`: PASS; 7/7 with stable end tics. The writer's host-dependent output was restored exactly to the committed P1-070 blobs afterward, leaving no out-of-scope change.

## Acceptance mapping

- Oracle build and default-OFF compile gate: PASS.
- Initial/tic 1/35/70/140/final deterministic state: PASS; final is tic 140.
- Tic 1/35/70/140 authoritative 320x200 indexed-frame artifacts: PASS.
- Five fresh-process state/frame repetitions match: PASS.
- Clean rebuild and build identity: PASS.
- Instrumentation-OFF demo completion and no-output regression: PASS.
- PWAD A/B versus B/A behavior: PASS, complete signatures identical.
- DeHackEd baseline/effect behavior: PASS, only `maxammo0` state changes and the status-bar frames reflect it.
- Existing C edit budget: 2 of 3; existing CMake edit budget: 1 of 3.
- No pointer, host-time, path, ID, uninitialized, or presentation-only digest fields: PASS.
- No remote, commercial-data, WebAssembly, package, parent-workspace, or destructive Git action: PASS.

## Changed files

- `.agent/task-state.json`
- `docs/DECISIONS.md`
- `docs/UPSTREAM_DELTA.md`
- `docs/COMPATIBILITY_MATRIX.md`
- `docs/reports/NATIVE_ORACLE_INSTRUMENTATION.md`
- `docs/results/P01/DOOM-P1-080.md`
- `evidence/logs/P01/P1-080/**`
- `evidence/task-runs/P01-DOOM-P1-080/**`
- `src/CMakeLists.txt`
- `src/doom/d_main.c`
- `src/doom/g_game.c`
- `src/sfhs_oracle/**`
- `tests/test_native_oracle.py`
- `tools/build-native.sh`
- `tools/run-native-oracle.sh`
- `tools/oracle/**`

## Failures and corrections

- The first build guard saw repository-wide WSL line-ending noise. It was corrected to identify substantive paths through line-ending-aware numstat while retaining exact-path rejection.
- The first Oracle link compiled hook files without the test definition because they belong to the `doom` static library. The same gated definition/include was applied to that target from the already modified parent CMake file.
- The first artifact run lacked frame tic 1 because upstream executes its initial tic before entering the render loop. A read-only capture was added immediately after that existing first-tic call; no extra draw or state mutation was introduced.
- The first comparison incorrectly expected DeHackEd max-ammo changes to leave the status bar identical. Final verification requires the targeted state change, no unrelated state change, and a corresponding logical-frame difference.

## Evidence and current state

Primary evidence is under `evidence/task-runs/P01-DOOM-P1-080/oracle-run-set/` and the final clean-build run directory under `evidence/task-runs/P01-DOOM-P1-080/`. The task remains uncommitted until every exact command passes. No remote action occurred.

## Remaining blockers and next task

No known implementation blocker remains. On complete exact verification, create the single P1-080 commit and continue immediately to DOOM-P1-085.
