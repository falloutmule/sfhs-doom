## DOOM-P1-040 — Fetch and verify pinned Freedoom data

**Intelligence:** LUNA-L
**Phase:** P01
**Depends on:** DOOM-P1-030
**Branch:** phase/p01-native-oracle
**Allowed files/directories:** .agent/task-state.json; .gitignore; docs/licenses/THIRD_PARTY_INVENTORY.md; docs/test-data/FREEDOOM_LOCK.md; docs/results/P01/DOOM-P1-040.md; evidence/logs/P01/P1-040/**; evidence/manifests/P01/**; evidence/task-runs/P01-DOOM-P1-040/**; tests/test_fetch_freedoom.py; tools/fetch-freedoom.sh; tools/freedoom-lock.json
**Parallel:** No
**Remote authorization:** Read-only official release retrieval only; no Git remote action

### Goal

Acquire legal open Freedoom Phase 1 and Phase 2 data reproducibly without committing archives or WAD bytes.

### Constraints

- Use official release metadata and assets only.
- Cache only under ignored vendor-cache/freedoom/**.
- Never download, inspect, copy, or commit commercial Doom data.

### Work

Resolve and pin the latest stable official Freedoom release, asset identity, archive/WAD hashes and sizes, release/license source. Implement lock-driven fetch, archive verification before extraction, expected-file-only extraction, WAD verification, --verify-only, safe cache recreation, manifests, and local tamper tests. Keep engine/content licensing distinct.

### Exact verification

    wsl.exe bash -lc 'cd "<repo>" && bash tools/fetch-freedoom.sh'
    wsl.exe bash -lc 'cd "<repo>" && bash tools/fetch-freedoom.sh --verify-only'
    python -m unittest tests.test_fetch_freedoom
    python tools/validate_artifact_manifest.py <freedoom1-manifest>
    python tools/validate_artifact_manifest.py <freedoom2-manifest>
    git status --short

Also tamper a copied fixture, not the canonical cache, and prove rejection.

### Acceptance

Both WADs are cached and hash-verified; official release is pinned; no WAD/archive is tracked; tampering fails closed; no commercial data exists.

### Evidence output

- docs/test-data/FREEDOOM_LOCK.md
- tools/freedoom-lock.json
- evidence/manifests/P01/**
- docs/results/P01/DOOM-P1-040.md

### Stop/block conditions

Official release identity or hashes cannot be established, download requires unapproved credentials, license is ambiguous, or commercial data appears.

### Commit

One local commit only: DOOM-P1-040 add pinned Freedoom acquisition and verification.
