# TASK RESULT

**Task:** DOOM-P1-060
**Status:** PASS
**Base commit:** 591a89eed883abc61ce32fac47b22503fea8091f
Result commit: SELF
**Branch:** phase/p01-native-oracle

## What was done

- Created tiny deterministic project-owned config, DeHackEd, recorded-demo, and
  PWAD-order fixtures under `tests/fixtures/`.
- Added a generated fixture manifest with per-file purpose, originating task,
  generator command, byte size, SHA-256, `CC0-1.0`, provenance confirmation,
  and explicit false third-party/commercial-data confirmations.
- Added the bounded fixture README and CC0 notice. The dedication applies only
  to the identified project-created fixture data and metadata; the Chocolate
  Doom source, Freedoom content, commercial material, scripts, and overall SFHS
  project remain outside that dedication.
- Added deterministic generation, manifest, structural, provenance, tamper,
  licensing-boundary, and native-evidence regression tests.
- Updated the third-party inventory with the direct P1-060 fixture decision.

## What was verified

- The canonical fixture set and two independently generated copies verified with
  `tools/verify-oracle-fixtures.py`.
- Generated copies matched each other and the canonical fixture bytes exactly.
- The verifier rejects tampered WAD bytes, incomplete provenance, Freedoom and
  commercial IWAD basenames, and software-script paths.
- Every committed fixture entry has an explicit purpose, origin, generator,
  size, SHA-256, `CC0-1.0`, and complete negative third-party/commercial
  confirmations.
- Native parser/load evidence exists for `order-a`, `order-b`, and `demo`.
  Each captured stdout contains the expected DeHackEd parser warning, each
  stderr is empty, and the probes used isolated runtime directories and the
  already pinned ignored Freedoom IWAD cache as external test input.
- `python tools/taskctl.py validate`: PASS.
- `python tools/validate_project_docs.py`: PASS.

## What failed

The separate broad cross-phase regression command reached 49 passing tests but
timed out in an existing WSL-backed native/Freedoom lane without an assertion
failure. The focused P1-060 suite and the task-card verification passed; no
tracked or untracked repository path was created by that timeout beyond the
already captured P1-060 evidence.

## Exact commands and results

    python tools/generate-oracle-fixtures.py --output tests/fixtures
    GENERATE_ORACLE_FIXTURES=PASS

    python tools/generate-oracle-fixtures.py --output C:\Users\fallo\AppData\Local\Temp\sfhs-p1-060-a
    GENERATE_ORACLE_FIXTURES=PASS

    python tools/generate-oracle-fixtures.py --output C:\Users\fallo\AppData\Local\Temp\sfhs-p1-060-b
    GENERATE_ORACLE_FIXTURES=PASS

    python tools/verify-oracle-fixtures.py tests/fixtures
    ORACLE_FIXTURES PASS

    python tools/verify-oracle-fixtures.py C:\Users\fallo\AppData\Local\Temp\sfhs-p1-060-a
    ORACLE_FIXTURES PASS

    python tools/verify-oracle-fixtures.py C:\Users\fallo\AppData\Local\Temp\sfhs-p1-060-b
    ORACLE_FIXTURES PASS

    python -m unittest tests.test_oracle_fixtures
    Ran 7 tests ... OK

    TEMP_A_EQUALS_TEMP_B=True
    TEMP_A_EQUALS_CANONICAL=True

## Acceptance mapping

- Deterministic generation: PASS.
- Explicit, bounded CC0-1.0 fixture licensing and provenance: PASS.
- No Freedoom, commercial, third-party, or software-script CC0 assignment:
  PASS.
- Malformed/tampered fixture rejection: PASS.
- Native Chocolate Doom parser/load probes for every fixture class: PASS by
  captured evidence.
- No network, remote, engine, build-system, package, commercial-data, or
  parent-workspace action: PASS.

## Evidence paths

- `tests/fixtures/expected/manifest.json`
- `tests/fixtures/README.md`
- `tests/fixtures/CC0-1.0.txt`
- `evidence/task-runs/P01-DOOM-P1-060/native/order-a.stdout`
- `evidence/task-runs/P01-DOOM-P1-060/native/order-a.stderr`
- `evidence/task-runs/P01-DOOM-P1-060/native/order-b.stdout`
- `evidence/task-runs/P01-DOOM-P1-060/native/order-b.stderr`
- `evidence/task-runs/P01-DOOM-P1-060/native/demo.stdout`
- `evidence/task-runs/P01-DOOM-P1-060/native/demo.stderr`

## Current exact state

The branch is `phase/p01-native-oracle`, based on P1-050 commit
`591a89eed883abc61ce32fac47b22503fea8091f`, with only the P1-060 task state,
fixture implementation, fixture data/metadata, documentation, tests, and
evidence pending the one required commit.

## Remaining blocker or next task

No P1-060 acceptance blocker remains. Continue with DOOM-P1-070 after the
single required P1-060 commit.

## Post-run Git status

To be verified clean after the single P1-060 commit.
