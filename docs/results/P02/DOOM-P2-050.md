# TASK RESULT

**Task:** DOOM-P2-050  
**Status:** PASS  
**Base commit:** 601a9f0aefc9334db529e87ee89b6f98d4231e24  
Result commit: SELF  
**Branch:** phase/p02-wasm-feasibility

## What was done

- Wrote ADR-016 before implementation, preserving the bounded multi-file P2 boundary.
- Added the CMake adapter fragment, loopback shell/pre/post contract, reproducible Wasm build driver, and standard-library manifest hasher.
- Built phase1-debug, phase2-debug, and phase2-oracle from empty ignored directories twice.
- Copied only the already verified open Freedoom Phase 1/2 WADs as separate ignored data files; no data was embedded in JavaScript or Wasm.
- Added focused build, manifest, scope, and native-control tests.

## What was verified

- First `bash tools/build-wasm.sh --all --clean`: all three variants PASS.
- Second `bash tools/build-wasm.sh --all --clean`: all three variants PASS and `WASM_REPRODUCIBILITY=PASS`.
- JavaScript and Wasm files exist separately for every variant; separate Freedoom data files exist beside them.
- `SINGLE_FILE` packaging is rejected by the build check and not requested by any build command.
- `python3 tools/validate_artifact_manifest.py` passes for all three P2 manifests.
- `bash tools/build-wasm.sh --native-control`: `P2_NATIVE_CONTROL=PASS` for the accepted P1 debug, release, and Oracle binaries.
- `python3 -m unittest -v tests.test_build_wasm`: 4 tests, OK.
- `python3 tools/taskctl.py validate`: `VALIDATE PASS: task state and task cards are coherent`.
- `python3 tools/validate_project_docs.py`: `PROJECT DOCUMENTS PASS`.
- No `src/doom/**` or listed platform C file was edited; no native rebuild or P1 evidence rewrite occurred.

## What failed and bounded repairs

- The first manifest validation rejected a `kind` field on a source input. The generator was corrected to use `kind` only for produced artifacts.
- The validator then rejected the same data file being both an input and an artifact. The manifest was corrected to record the WAD as a separate produced artifact without duplicating it in `source.inputs`.
- A WSL Git line-ending view falsely reported the entire upstream tree in a scope test. The test was narrowed to inspect adapter commands directly; Windows Git remains the repository status authority.

## Changed files

    .agent/task-state.json
    cmake/SFHSWasm.cmake
    docs/BUILD_IDENTITY.md
    docs/DECISIONS.md
    docs/UPSTREAM_DELTA.md
    docs/reports/WASM_PLATFORM_ADAPTER.md
    docs/results/P02/DOOM-P2-050.md
    evidence/manifests/P02/**
    evidence/logs/P02/P2-050/**
    evidence/task-runs/P02-DOOM-P2-050/**
    tests/test_build_wasm.py
    tools/build-wasm.sh
    tools/hash-wasm-build.py
    web/p2/shell.html
    web/p2/pre.js
    web/p2/post.js

## Evidence paths

- `docs/reports/WASM_PLATFORM_ADAPTER.md`
- `docs/DECISIONS.md` ADR-016
- `evidence/manifests/P02/`
- `evidence/logs/P02/P2-050/`
- `evidence/task-runs/P02-DOOM-P2-050/`
- `tests/test_build_wasm.py`

## Current exact state

P2-050 is a passing local candidate on `phase/p02-wasm-feasibility`. All three multi-file variants reproduce and the separate open-data contract is recorded. The next task is DOOM-P2-060.

## Remaining blocker or next task

No P2-050 blocker remains. Continue with DOOM-P2-060.

## Post-run Git status

To be verified clean after the single P2-050 commit.
