# Issue Log

**Document status:** P01 native-oracle issue register
**Date:** 2026-08-03

No product issue has yet been observed. This statement is not a build, runtime, compatibility, or acceptance result.

## Issue fields

Every issue entry must include:

| Field | Meaning |
|---|---|
| ID | Stable issue identifier |
| Status | Open, blocked, resolved, deferred, or rejected |
| Severity | Impact classification |
| Discovered | Date and task/evidence context |
| Environment | Relevant source, toolchain, browser, device, or artifact |
| Observed behavior | Exact factual observation |
| Expected behavior | Contract or acceptance requirement |
| Evidence | Repository-relative logs, screenshots, hashes, or commands |
| Owner | Responsible task or reviewer |
| Disposition | Decision and follow-up |

## Entries

| ID | Status | Severity | Discovered | Observed behavior | Evidence | Disposition |
|---|---|---|---|---|---|---|
| None recorded | N/A | N/A | 2026-08-02 P00-020 | No product issue has yet been observed. | Governance-only repository bootstrap; no runtime was executed. | Keep open for later evidence; do not infer PASS. |
| P1-ENV-001 | resolved | medium | 2026-08-03 P1-000 | The default Ubuntu 24.04.4 WSL2 distribution was available, with GCC/Python present but CMake, Ninja, pkg-config, SDL2 development packages, SDL2_mixer, and Xvfb absent from the initial inventory. | `docs/results/P01/DOOM-P1-010.md`; `evidence/logs/P01/P1-010/`. | The authorized packages were installed only inside the existing WSL distribution; the no-install doctor and toolchain tests pass. |
| P1-STATE-001 | resolved | high | 2026-08-03 P1-000 | tools/taskctl.py hard-coded docs/tasks/P00 and docs/results/P00, so exact taskctl validation initially rejected all correctly rooted P1 cards/results. | docs/results/P01/DOOM-P1-000.md; tools/taskctl.py; tests/test_taskctl.py. | User authorized a one-time P1-000 repair; phase-aware unique-card and matching-result resolution now validates mixed P00/P01 state. |
| P1-DOC-001 | resolved | high | 2026-08-03 P1-000 | The required no-argument tools/validate_project_docs.py command initially exited with an argparse error, while its explicit phase and gate-card rules remained hard-coded to P00. | docs/results/P01/DOOM-P1-000.md; tools/validate_project_docs.py; tests/test_project_docs.py. | User authorized a second narrow P1-000 repair; no-argument mixed-phase validation and conventional P## discovery now pass without weakening P00 checks. |
| P1-DEMO-001 | resolved | medium | 2026-08-03 P1-070 | Normal playback completed but the process waited indefinitely for an ENDOOM keypress, causing the first harness watchdog to classify a false playback stall. | `docs/reports/NATIVE_DEMO_BASELINE.md`; `docs/results/P01/DOOM-P1-070.md`. | Isolated test extra-config files set `show_endoom 0`; all 14 normal/strict and 7 timedemo cases pass without engine changes. |
| P1-ORACLE-001 | resolved | medium | 2026-08-03 P1-080 | Upstream executes the initial timedemo tic before entering its render loop, so no rendered tic-1 gameplay frame naturally exists. | `docs/reports/NATIVE_ORACLE_INSTRUMENTATION.md`; `src/doom/d_main.c`. | The observer reads the initialized authoritative logical buffer after upstream's first-tic call without inserting a draw. The limitation is explicit; later frames are post-draw. |
| P2-000-REVIEW-001 | resolved | low | 2026-08-04 P2-000 | The accepted P1 independent review was not yet represented in repository task state at the P2 branch boundary. | `docs/reviews/P01/DOOM-P1-090.md`; `docs/results/P01/DOOM-P1-090.md`. | Exact review bytes were decoded and SHA-256 verified; P1-090 is recorded PASS_WITH_RECORDED_LIMITATIONS without rewriting P1 evidence. |

## P2-088 diagnostic global-suite limitations

The preserved WSL discovery run in
`evidence/task-runs/P02-DOOM-P2-088/full-unit-suite-exact.txt` ran 131 tests
and reported 12 failures and 5 errors after the P2 manifest command logs were
captured. The earlier pre-repair run in
`evidence/task-runs/P02-DOOM-P2-088/full-unit-suite.txt` recorded 13 failures
and 5 errors; its additional failure was the now-repaired missing-manifest-log
case. These are diagnostic cross-phase infrastructure findings, not a P2
product result. Each identifier is recorded below with all three required
classifications.

| Exact test identifier | Result | Classification | Evidence/disposition |
|---|---|---|---|
| `test_fetch_freedoom.FetchFreedoomTests.test_tampered_archive_is_rejected_without_manifest_repair` | ERROR | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | WSL cannot create the existing Windows `C:/tmp` fixture path; defer path-portability repair. |
| `test_fetch_freedoom.FetchFreedoomTests.test_tampered_copy_is_rejected` | ERROR | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | Same WSL `C:/tmp` fixture-path assumption. |
| `test_upstream_test_runner.UpstreamTestRunnerTests.test_no_tests_fixture_is_not_present` | ERROR | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | Same WSL `C:/tmp` fixture-path assumption. |
| `test_upstream_test_runner.UpstreamTestRunnerTests.test_nonzero_fixture_fails` | ERROR | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | Same WSL `C:/tmp` fixture-path assumption. |
| `test_upstream_test_runner.UpstreamTestRunnerTests.test_populated_success_fixture_passes` | ERROR | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | Same WSL `C:/tmp` fixture-path assumption. |
| `test_browser_input_contract.BrowserInputContractTests.test_shell_is_focusable_and_input_is_bounded` | FAIL | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | Stale literal-source assertion against the already accepted P2 shell implementation. |
| `test_build_native.NativeBuildTests.test_all_manifests_validate` | FAIL | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | Stale native-manifest byte expectation outside P2 scope. |
| `test_build_native.NativeBuildTests.test_current_executables_match_latest_manifests` | FAIL | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | Stale native-manifest executable-byte expectation outside P2 scope. |
| `test_build_wasm.BuildWasmTests.test_each_manifest_validates_and_has_separate_outputs` | FAIL (pre-repair only) | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | P2-088 captured the three real missing command logs; focused manifest validation now passes. |
| `test_fetch_freedoom.FetchFreedoomTests.test_no_wad_or_archive_is_tracked` | FAIL | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | Cross-phase tracked-data expectation conflicts with the accepted open-data evidence boundary. |
| `test_native_oracle.NativeOracleTests.test_compile_gate_and_source_edit_budgets` | FAIL | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | P1 source-budget assertion does not understand later P2 source history. |
| `test_native_toolchain.NativeToolchainTests.test_doctor_failure_is_nonzero_and_explicit` | FAIL | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | Outdated native-toolchain negative-fixture output assumption. |
| `test_native_toolchain.NativeToolchainTests.test_doctor_passes_without_installing` | FAIL | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | Windows-to-WSL `/mnt//mnt/c` path translation assumption. |
| `test_native_toolchain.NativeToolchainTests.test_native_env_accepts_repository_and_prints_identity` | FAIL | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | Windows-to-WSL `/mnt//mnt/c` path translation assumption. |
| `test_native_toolchain.NativeToolchainTests.test_native_env_rejects_invocation_outside_repository` | FAIL | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | Windows-to-WSL `/mnt//mnt/c` path translation assumption. |
| `test_oracle_fixtures.OracleFixtureTests.test_canonical_fixture_set_verifies` | FAIL | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | Older P1 fixture contract rejects the P2 SDL smoke fixture. |
| `test_oracle_fixtures.OracleFixtureTests.test_generation_is_deterministic_and_verifies` | FAIL | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | Same cross-phase fixture-set assumption. |
| `test_p1_gate.P1GateTests.test_gate_passes_and_is_read_only` | FAIL | `KNOWN_INFRASTRUCTURE_DEBT`; `NOT_PRODUCT_BEHAVIOR_EVIDENCE`; `DEFERRED_TO_SEPARATE_CROSS_PHASE_TEST_REPAIR` | P1 gate is intentionally hard-coded to the P1 branch and is not P2 evidence. |
