# SFHS Doom source-compliance checklist

**Task:** DOOM-P0-060
**Status:** P00 governance checklist; it does not certify a release
**Labels:** `VERIFIED` = directly inspected now; `INFERRED` = conservative classification from inspected text; `PROPOSED` = policy awaiting review; `UNTESTED` = not selected or exercised; `BLOCKED` = do not distribute until resolved.

## P00 evidence status

| Check | Evidence or required action | Status | Owner/phase |
|---|---|---|---|
| Upstream source identity | `docs/bootstrap/REPOSITORY_BASELINE.md` records Chocolate Doom 3.1.1 and commit `410d96855b5df5410ff591a90efeafa889119224` | VERIFIED | P0 |
| Engine license text | Local `COPYING.md` is GNU GPL Version 2; representative `src/doom/d_main.c` and `src/i_video.c` headers were inspected | VERIFIED | P0 |
| Engine license scope | Inventory only claims the inspected source/headers; perform a full file-level notice audit before release | UNTESTED | P01 |
| Modified-file notices | Any future SFHS engine-derived file must state that it was changed and include the change date | PROPOSED policy grounded in GPL Section 2(a) | P01+ |
| Corresponding source | Source release must include exact patches, build scripts, generated source, and applicable toolchain record | PROPOSED policy grounded in GPL Sections 1–3 | P01/P02/P03 |
| Upstream license delivery | Preserve `COPYING.md` and expose it from source/release/license UI as appropriate | VERIFIED requirement; release path untested | P01+ |
| Chocolate Doom bundled CMake notices | Preserve BSD 3-Clause-style finder-module text; do not guess an SPDX identifier | VERIFIED text; identifier mapping INFERRED | P01 |
| Freedoom content license | Official site/manual identify modified BSD/BSD 3-Clause terms, credit, notice, disclaimer, and no-endorsement condition | VERIFIED official text | P01/P02 |
| Freedoom version/hash | Select one official release for each edition and inspect its exact license/credits at that commit | UNTESTED | P01/P02 |
| SDL2 license | Official SDL repository identifies zlib; local build metadata exposes SDL2 >= 2.0.14 | VERIFIED family; version/package UNTESTED | P01/P02 |
| SDL2_mixer license | Official SDL_mixer repository identifies zlib; local build metadata exposes SDL2_mixer >= 2.0.2 | VERIFIED family; codec closure UNTESTED | P01/P02 |
| SDL2_net license | Official SDL_net repository identifies zlib; local build metadata exposes SDL2_net >= 2.0.0 | VERIFIED family; version/package UNTESTED | P01/P02 |
| Optional library notices | Inspect exact libsamplerate, libpng, FluidSynth versions and any transitive codecs before packaging | INFERRED/UNTESTED | P01/P02 |
| Emscripten output notices | Inspect generated JavaScript/Wasm and the pinned SDK; Emscripten officially identifies MIT, University of Illinois/NCSA, and Node-derived portions | VERIFIED family; emitted contents UNTESTED | P01/P02 |
| LLVM/Binaryen notices | Record Apache 2.0 with LLVM Exceptions for LLVM and Apache-2.0 for Binaryen when selected | VERIFIED official families; version/scope UNTESTED | P01/P02 |
| Python/Node toolchain notices | Record PSF Version 2 for Python and MIT for Node where redistributed or embedded | VERIFIED source texts; applicability UNTESTED | P01/P02 |
| SFHS project license | Select a GPL-compatible project license after legal review; do not infer one from Chocolate Doom | PROPOSED / QUESTION | P01 |
| Future fixtures | Inspect each open fixture’s source/license/hash; do not add bytes on the basis of a filename or reputation | UNTESTED | P01/P02/P03 |
| Commercial data | Never commit or embed commercial IWAD/PWAD/DeHackEd/demo bytes; local user-owned testing stays external | VERIFIED repository policy | All phases |
| Trademark/non-affiliation | Use conservative independent-project wording and obtain review for product-name/endorsement questions | PROPOSED / QUESTION | P01+ |
| Runtime network | Licensing inventory does not authorize downloads or runtime network access | VERIFIED project boundary | All phases |

## Pre-release gate

The release cannot be marked license-complete until every `UNTESTED`, `QUESTION`, and `BLOCKED` item affecting the actual artifact is resolved with a source URL, inspected license text, exact version/hash, notice location, and an owner decision. A later phase may narrow the dependency set, but it may not silently remove a notice duty.

### Source package gate

- [ ] Source archive contains the exact selected upstream source and all SFHS patches.
- [ ] Every modified upstream file has a prominent changed/date notice where required.
- [ ] `COPYING.md` or the equivalent GPL text is present and discoverable.
- [ ] Source archive includes build scripts, generated inputs, and the exact toolchain record.
- [ ] Every bundled third-party source has its original notice and license text.
- [ ] SPDX identifiers, if used, are backed by inspected license text rather than guessed from a package name.

### Binary/HTML gate

- [ ] Artifact manifest lists all embedded source-derived and third-party material.
- [ ] Generated JavaScript/Wasm/runtime files were inspected for third-party notices.
- [ ] SDL, codec, audio, image, and toolchain closure is version-pinned and notice-complete.
- [ ] Freedoom notices and credit are visible for each bundled content edition.
- [ ] No commercial IWAD/PWAD/DeHackEd/demo bytes, screenshots exposing proprietary data, or private data are present.
- [ ] Corresponding source location and offer language are reviewed for the actual distribution method.
- [ ] Trademark/non-affiliation text is reviewed and no third-party logo/endorsement is implied.

### Test/evidence gate

- [ ] License checks inspect bytes and source paths, not just filenames.
- [ ] External user-owned data is hashed without copying it into the repository.
- [ ] Evidence records exact commands, source commit, dependency versions, and release paths.
- [ ] A failed license check is reported as a blocker rather than repaired by broadening a license assumption.

## Explicit non-claims

P00 has not built native or Wasm code, selected an Emscripten SDK, selected Freedoom releases, downloaded dependencies, inspected a final HTML output, or provided legal advice. Passing this checklist’s structure is not a claim that the product is distributable.
