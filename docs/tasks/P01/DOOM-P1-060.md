## DOOM-P1-060 — Create open deterministic compatibility fixtures

**Intelligence:** LUNA-M
**Phase:** P01
**Depends on:** DOOM-P1-050
**Branch:** phase/p01-native-oracle
**Allowed files/directories:** .agent/task-state.json; docs/test-data/NATIVE_ORACLE_FIXTURES.md; docs/licenses/THIRD_PARTY_INVENTORY.md; docs/results/P01/DOOM-P1-060.md; evidence/logs/P01/P1-060/**; evidence/task-runs/P01-DOOM-P1-060/**; tests/fixtures/config/**; tests/fixtures/open-deh/**; tests/fixtures/open-demos/**; tests/fixtures/open-pwads/**; tests/fixtures/expected/**; tests/test_oracle_fixtures.py; tools/generate-oracle-fixtures.py; tools/verify-oracle-fixtures.py
**Parallel:** No
**Remote authorization:** NONE

### Goal

Create tiny project-owned config, PWAD-order, DeHackEd, and open-demo fixture contracts for native/Wasm comparison without commercial data.

### Constraints

- Fixtures must be open, readable, deterministic, and narrowly claimed.
- Never copy arbitrary third-party PWADs or commercial content.

### Work

Generate deterministic fixtures twice and compare hashes; validate WAD structure, DeHackEd acceptance, malformed copies, provenance, and expected behavior. Create order-a/order-b with one distinct lump and document that order behavior is the only claim.

### Exact verification

    python tools/generate-oracle-fixtures.py --output <temp-a>
    python tools/generate-oracle-fixtures.py --output <temp-b>
    python tools/verify-oracle-fixtures.py <temp-a>
    python tools/verify-oracle-fixtures.py <temp-b>
    python -m unittest tests.test_oracle_fixtures

Compare hashes and run the native parser/load checks for each fixture.

### Acceptance

Fixtures exist, repeat byte-identically, are license-clear, are accepted by native Chocolate Doom, and reject malformed copies.

### Evidence output

- docs/test-data/NATIVE_ORACLE_FIXTURES.md
- tests/fixtures/**
- evidence/task-runs/P01/P1-060/**
- docs/results/P01/DOOM-P1-060.md

### Stop/block conditions

Fixture license ambiguity, nondeterministic generation, parser incompatibility requiring engine redesign, or commercial/ambiguous content.

### Commit

One local commit only: DOOM-P1-060 add deterministic open compatibility fixtures.
