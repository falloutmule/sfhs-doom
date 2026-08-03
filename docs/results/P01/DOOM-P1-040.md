# TASK RESULT

**Task:** DOOM-P1-040
**Status:** PASS
**Base commit:** 44cc36377e0db83709428cc8ec6f9c28d783fdb4
**Result commit:** SELF
**Branch:** phase/p01-native-oracle

## What was done

- Resolved the latest stable release from official Freedoom GitHub metadata.
- Verified the annotated tag object, full release commit, release asset, and official checksum asset.
- Downloaded only the official combined Freedoom archive into the ignored cache.
- Implemented lock-driven verification, expected-file-only extraction, safe cache recreation, read-only verification, P01 manifests, and tamper rejection.
- Directly inspected and pinned the release-local BSD-3-Clause license text.

## What was verified

- Release `v0.13.0`, ID `139025240`, is non-draft and non-prerelease.
- Official archive SHA-256 is `3f9b264f3e3ce503b4fb7f6bdcb1f419d93c7b546f4df3e874dd878db9688f59`.
- Freedoom Phase 1 and Phase 2 WAD sizes/hashes match the lock.
- Fetch and verify-only modes pass.
- A one-byte-tampered copied WAD is rejected.
- No WAD or archive is tracked; no commercial data was accessed.

## What failed

No acceptance check failed. PowerShell initially rendered the checksum asset as byte values; the same official bytes were decoded and the archive itself independently matched the declared SHA-256.

## Changed files

    .agent/task-state.json
    docs/licenses/THIRD_PARTY_INVENTORY.md
    docs/test-data/FREEDOOM_LOCK.md
    docs/results/P01/DOOM-P1-040.md
    evidence/manifests/P01/freedoom-phase1-v0.13.0.json
    evidence/manifests/P01/freedoom-phase2-v0.13.0.json
    evidence/task-runs/P01-DOOM-P1-040/**
    tests/test_fetch_freedoom.py
    tools/fetch-freedoom.sh
    tools/freedoom-lock.json

## Commands and exact results

- Official release API: ID 139025240, v0.13.0, draft false, prerelease false, published 2024-01-29T23:32:37Z.
- `bash tools/fetch-freedoom.sh`: `FREEDOOM_FETCH=PASS mode=fetch`.
- `bash tools/fetch-freedoom.sh --verify-only`: `FREEDOOM_FETCH=PASS mode=verify`.
- `python -m unittest tests.test_fetch_freedoom`: 6 tests, OK, including copied-fixture tamper rejection.
- Manifest validator for both edition manifests: MANIFEST PASS.
- Result commit: SELF is the containing-commit sentinel.

## Acceptance mapping

- Both WADs cached and hash-verified: PASS.
- Official stable release pinned: PASS.
- Archive verified before expected-only extraction: PASS.
- Tampering fails closed: PASS.
- No WAD/archive tracked and no commercial data: PASS.

## Evidence paths

- `docs/test-data/FREEDOOM_LOCK.md`
- `tools/freedoom-lock.json`
- `evidence/manifests/P01/freedoom-phase1-v0.13.0.json`
- `evidence/manifests/P01/freedoom-phase2-v0.13.0.json`
- `evidence/task-runs/P01-DOOM-P1-040/`

## Current exact state

Both open Freedoom WADs and their archive/license are verified in ignored `vendor-cache/freedoom/0.13.0/`. Only lock, documentation, tests, manifests, and small command evidence are tracked.

## Known limitations

Acquisition and identity do not prove gameplay. P1-050 owns native gameplay smoke.

## Remaining blocker or next task

No blocker remains. Continue with DOOM-P1-050.

## Post-run Git status

To be verified clean after the single P1-040 commit.
