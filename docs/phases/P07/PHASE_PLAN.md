# SFHS Doom — Phase P07 Forge Plan

**Phase:** P07 — WAD Forge and Doom Capsules
**Status:** P7-B LOCAL PASS
**Planning authority:** User-approved Forge specification and P7-A execution plan
**Accepted assumptions/ADRs:** `docs/FORGE_SPEC.md`; accepted V16 player baseline
**Remote boundary:** Push, PR, merge, and Pages publication are authorized only after every local P7-A gate passes.

## Goal

Deliver a Forge-capable runtime that separates the verified Doom engine from
game data, validates and mounts one declared Freedoom payload, and launches the
complete V16 player exactly once.

## Scope and non-goals

### In scope

Content-independent SINGLE_FILE Wasm; deterministic capsule manifest and gzip
chunks; full and thin payload routes; streaming SHA-256 verification and MEMFS
mount; V16 parity; exact tests, evidence, and dual-route Pages publication.

### Out of scope for P7-A

WAD/ZIP analysis, recipe authoring, libraries, archive browsing, successor
export, private capsules, recursive Forge, shared-control changes, and native
simulation/rendering changes.

### P7-B scope

P7-B adds local-only WAD/ZIP selection, worker-based hashing and safe parsing,
metadata and compatibility signals, and a phone-ready inspection card. It does
not persist, mount, launch, build a recipe from, or export selected content.

## Source of truth

Read `AGENTS.md`, `docs/FORGE_SPEC.md`, `docs/PROJECT_SPEC.md`,
`docs/CURRENT_STATE.md`, the P7 cards/results, the V16 result, P6 shell, Forge
shell/build/packer/validator/tests, and the Pages workflow in that order.

## Task graph

| Task | Intelligence | Dependency | Allowed paths | Remote authorization | Done when |
|---|---|---|---|---|---|
| DOOM-P7-000 | CODEX | V16 | P7 plans/cards/results | NONE | P7-A execution boundary is frozen. |
| DOOM-P7-001 | CODEX | P7-000 | Forge/project/current-state docs | NONE | Supplied Forge authority is adopted exactly. |
| DOOM-P7-010 | CODEX | P7-001 | `web/p7`, Forge build tools | NONE | Engine package has no embedded IWAD and cannot start early. |
| DOOM-P7-020 | CODEX | P7-010 | Forge packer/schema/tests/artifact | NONE | Full/thin manifests and deterministic chunks validate. |
| DOOM-P7-030 | CODEX | P7-020 | Forge shell/tests/evidence | NONE | Exact payload mounts; every corruption prevents launch. |
| DOOM-P7-040 | CODEX | P7-030 | Forge shell/tests/evidence | NONE | Complete V16 player launches once with parity. |
| DOOM-P7-050 | CODEX | P7-040 | tests/docs/manifests/workflow/artifact | P7-A branch, PR, main, and Pages operations after green local gates | Exact V16 root and Forge preview deploy and match live hashes. |
| DOOM-P7-060 | CODEX | P7-050 | P7 analyzer/shell/build/tests/docs | NONE | Local WAD/ZIP inspection is safe, accurate, responsive, and phone-ready. |
| DOOM-P7-090 | SOL-GATE | P7-050 | read-only repository/evidence | NONE | Independent review records a bounded verdict. |

## Exact verification

```text
python tools/validate-forge-capsule.py dist/sfhs-doom-forge-v1.html --mode full
python -m unittest tests.test_p7_forge_contract -v
Playwright P7-A full/thin/corruption and protected P6 regression lanes
exact V8–V16 and Forge byte/hash checks
git diff --check and workflow YAML parse
```

## Evidence and result locations

Committed results live in `docs/results/P07/` and the artifact manifest under
`evidence/manifests/P07/`. Raw builds, logs, screenshots, thin capsules, and
negative fixtures are ignored under `test-results/P07/P7-A/`.

## Current state

V16 remains byte-protected and is published exactly at the Pages root. Forge V1
is published exactly at `/forge/`. P7-A implementation, local verification, CI,
and byte-exact publication are complete. P7-B local analyzer implementation and
automated gates pass on `codex/p7b-local-wad-inspection`; publication authority
and physical Samsung acceptance remain pending.

## Blockers and stop conditions

Stop for native/shared-source changes, commercial content, protected artifact
mutation, unverified mount before launch, unexpected network, non-deterministic
packaging, failed required CI, live hash drift, or authority beyond the exact
P7-A remote boundary.

## Exit gate

Full and thin routes mount exact content and launch V16 once; corruption never
launches; protected regressions pass; exact root/preview Pages bytes match; and
status is `PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING` until Samsung verification.
