# DOOM-P7-001 — Adopt Forge authority

**Status:** PASS  
**Phase:** P07-A  
**Branch:** `feature/p7a-forge-runtime`  
**Base:** `8e2c4be70ca16f7c0909cd67224b63679cfb2cad`

## Goal

Check in the supplied complete Forge specification, replace the obsolete
unexecuted audio phase with P7-A through P7-J, freeze the first-tranche task
graph, and record that V16 publication is intentionally combined with the Forge
preview publication.

## Allowed paths

- `docs/FORGE_SPEC.md`
- `docs/PROJECT_SPEC.md`
- `docs/phases/P07/**`
- `docs/tasks/P07/**`
- `docs/results/P07/**`
- `docs/CURRENT_STATE.md`
- ignored `test-results/P07/P7-A/**`

No source, generated artifact, native file, shared-control file, or protected
V8–V16 artifact may change in this card.

## Acceptance

The attached specification is byte-identical in the repository; governance is
internally consistent; all task IDs are unambiguous; `git diff --check` passes;
and protected artifact hashes remain exact.
