# DOOM-P7-100 — Complete local Forge product

The user's complete-product handoff is the scope authority for this task. It supersedes earlier staged approval gates. Base: `d0953a12d45aa745ed18c245e45fc89f84416a39`. Branch: `codex/forge-complete-product`.

Implement the complete Forge workflow in product-owned sources, retaining the existing Chocolate Doom binary and V16 player. Allowed paths: new `web/forge/`, new Forge build/validation tooling, focused browser tests, documentation, evidence manifests, and a new generated V3 artifact. Existing player and Forge V1/V2 artifacts remain frozen. Independent module ownership may run in parallel; integration remains single-owner.

The new V3 output and catalog receive narrowly scoped `.gitattributes` entries
so Git checkout cannot rewrite their verified bytes. Historical output rules
remain untouched.

Local implementation, testing, repair, documentation, artifact generation, and a coherent local commit are authorized. Remote mutations are not authorized. Physical Samsung acceptance must remain pending until actually supplied.

Required evidence: local/ZIP ingest, real recipes, persistent library and independent saves, keep/replace/remove bases, consent-gated archive browsing, player/thin/collection/private exports, recursive Forge reopening, adversarial verification, preserved player controls/HUD/audio/renderers, file opening and offline requests. Proofs and backups go below ignored `test-results/P07/forge-complete/`.

Relevant failure modes: A–D (single-file/security/scope), F–H (storage/isolation/viewport), J–Q (mobile lifecycle and evidence), R–T (artifact hygiene/privacy/scope). Engine/render algorithms are unchanged; E/I remain protected by player regressions. No claim of complete physical acceptance from automated browser tests.
