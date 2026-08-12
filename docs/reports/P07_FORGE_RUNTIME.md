# P07-A Forge Runtime Report

## Outcome

P7-A introduces a separate, content-independent Forge runtime and deterministic
capsule package without changing Doom simulation, native rendering, shared SFHS
controls, or protected V8–V16 artifacts. The release candidate is
`dist/sfhs-doom-forge-v1.html`.

## Architecture and persistence

The Emscripten engine remains a single-file Wasm package but starts with
`INVOKE_RUN=0` and no IWAD embedded by the linker. A strict
`sfhs.doom-capsule@1` manifest declares payload, base, recipe, credit, and
verification identities. The runtime streams, hashes, and mounts declared
content before generating recipe arguments and calling main exactly once.

Forge adds no persistence schema. Once launched, it uses the unchanged V16
control profile and Doom-owned mobile UI preference records.

## Exact artifact

- Path: `dist/sfhs-doom-forge-v1.html`
- Bytes: 25,819,800
- SHA-256: `9b4018515b416f6643058d85a04d7c49212f2ca664f50a9a1b3cc2d422d84754`
- Payload: Freedoom Phase 2 0.13.0, 28,787,748 decoded bytes
- Payload SHA-256:
  `a8772e088847032510d97ba2312406a6998f21cbab44d4ff10696faa9c0ecd4b`
- Compressed chunks: 56 at a declared 196,608-byte chunk size

## Verification

The strict static validator accepts full and thin variants, rejects contract
drift, and confirms one offline HTML document with no external Wasm, HTTP asset,
`eval`, or inline handler. Same-environment packaging reproduces exact bytes.

The focused Playwright lane passes 11/11: embedded portrait/automatic,
embedded landscape/compatibility, exact thin base, wrong thin base, and seven
manifest/payload/platform rejection cases. It also proves one main invocation,
320×200 world backing, 320×32 HUD backing, working native WPN−/WPN+ transitions,
running gesture-started audio, zero ending input, no scroll, no external request,
and no fatal browser error.

Applicable protected Python lanes pass 50/50. The native Debug build with
`SFHS_MOBILE_DETACHED_HUD=OFF` passes, as do existing native demo and native/Wasm
comparison tests.

## Historical lane notes

The broad protected browser run reached 45 of 55 tests before its local timeout;
covered V10–V14 and most V15 checks were passing. A smaller rerun passed 13 of
15; the two unavailable/obsolete historical checks were Firefox direct-file
(Firefox is not installed locally) and an old Chromium oracle ArrowUp comparison
whose fixture remained stationary in both states. A separate historical
audio/boot Chromium command timed out in the local loopback environment. Forge's
own browser lane directly proves audio running and direct-file offline launch.

The broad project-document validator retains pre-existing failures in historical
P6-058 through P6-064 card formatting. All new P7 phase and card-specific
document validations pass. None of these historical limitations altered the P7
candidate or protected bytes.

## Acceptance

Local and publication result: PASS. PR #14 merged as
`251d020c977369c379dfb180aed94bbbbab0083a`; main workflow `31592468583`
passed and deployed. Fresh downloads of the root and `/forge/` routes match the
exact V16 and Forge hashes respectively.

Final state remains `PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING` until the Forge
preview and repaired WPN−/WPN+ controls are checked on Samsung. Automated
browser evidence is not physical acceptance.
