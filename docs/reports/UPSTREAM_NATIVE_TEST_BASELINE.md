# Upstream Native Test Baseline

**Task:** DOOM-P1-030
**Pinned upstream:** chocolate-doom-3.1.1 at 410d96855b5df5410ff591a90efeafa889119224
**Source commit:** 2376b4341d67e872222f7edc56dbcef6756bff37
**Status:** VERIFIED

## Direct inventory

| Surface | Classification | Direct evidence |
|---|---|---|
| CMake/CTest Debug | NOT_PRESENT | CTest exits 0 and reports `No tests were found` in the configured Debug tree. |
| CMake/CTest Release | NOT_PRESENT | CTest exits 0 and reports `No tests were found` in the configured Release tree. |
| Upstream `check-extern.sh` | PASS | The source-contained CI check exits 0 after wrapper-only CRLF stream normalization; the tracked script remains unchanged. |
| Debug executable `--version` | PASS | The P1-020 Debug executable exits 0 and identifies Chocolate Doom 3.1.1. |
| Release executable `--version` | PASS | The P1-020 Release executable exits 0 and identifies Chocolate Doom 3.1.1. |
| Autotools quickcheck suite | BLOCKED | Upstream records quickcheck as gitlink `ef816accb377a5be05c5debf096dd038eee98aa8`, but the clone did not initialize its content. Retrieval would require a prohibited remote action. |
| cppcheck workflow | NOT_APPLICABLE | Static analysis is not a native behavioral test, and cppcheck was not selected by P1-010. |
| cpp-linter workflow | NOT_APPLICABLE | Changed-lines lint is not a native behavioral test. |

## Inspected definitions

- No `enable_testing()`, `add_test()`, or equivalent CTest registration exists in the pinned CMake source.
- No source-contained Python or other unit-test suite is registered by the pinned checkout.
- Upstream CI’s test step configures through autotools and runs `make -C quickcheck check` against the built source port.
- The CMake build therefore has zero genuine registered tests; CTest’s successful exit is classified NOT_PRESENT rather than PASS.
- Upstream CI also runs build, packaging, static-analysis, lint, and extern checks. Those are separated from behavioral tests here.

## Coverage gaps

The available checkout does not provide an executable gameplay, demo, savegame, renderer, audio, input, or compatibility suite. The genuine quickcheck suite cannot be inspected or run without retrieving its uninitialized gitlink. Native build smoke proves startup/version identity only and is not gameplay proof.

## Evidence

- `evidence/logs/P01/P1-030/upstream-native-test-results.tsv`
- `evidence/task-runs/P01-DOOM-P1-030/`
- `.github/workflows/main.yml`
- `.github/workflows/cppcheck.yml`
- `.github/workflows/cpp-linter.yml`
- `.gitmodules`

No upstream source was patched, no submodule was fetched, and no missing test was reclassified as passing.
