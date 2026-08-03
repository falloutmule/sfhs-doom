# SFHS Doom notice and attribution plan

**Task:** DOOM-P0-060
**Status:** P00 plan, not legal advice and not release clearance
**Authority:** selected Chocolate Doom 3.1.1 source, accepted project specification, and the directly inspected official sources listed in `THIRD_PARTY_INVENTORY.md`

## Distribution principles

- Treat the Chocolate Doom engine/source as GPLv2-or-later where the inspected source header grants that choice, while preserving the upstream `COPYING.md` Version 2 text and every applicable copyright/warranty notice.
- Do not use the engine license as a blanket license for Freedoom artwork, audio, levels, or other content. The Freedoom official site/manual identify modified BSD/BSD 3-Clause obligations, including notice, disclaimer, and no-endorsement conditions.
- Treat SDL2, SDL2_mixer, SDL2_net, libsamplerate, libpng, FluidSynth, and any codec or transitive dependency as separate components. A future build must record the exact package/version and carry the notice set for what it actually links or bundles.
- Treat Emscripten output as a generated work whose exact runtime contents must be inspected from a pinned build. Emscripten’s official license identifies MIT and University of Illinois/NCSA texts and a Node.js-derived portion; LLVM, Binaryen, Python, and other SDK contents have separate notices.
- Keep commercial IWAD/PWAD/DeHackEd/demo bytes outside the repository and all release artifacts. Compatibility with user-supplied data is not permission to redistribute it.
- Do not call a component “cleared” when its version, source, dependency closure, or license text is untested.

## Planned notice locations

| Component family | Planned notice/source location | Trigger | Owner/phase | Current state |
|---|---|---|---|---|
| Chocolate Doom engine | Source root `COPYING.md`, preserved source headers, release `NOTICE`/license screen, corresponding-source archive | Any source or binary distribution containing the engine or a derivative | P01+ | Verified base license; implementation not started |
| Upstream bundled finder modules | Preserve notices in source; list in third-party inventory | Any source archive containing the existing modules | P01+ | Verified text, SPDX identity not normalized |
| Freedoom Phase 1/2 | Separate content license/credit page in each edition and source/release bundle | Any embedded or redistributed Freedoom IWAD | P01/P02 | License family verified; release/hash untested |
| SDL2 family | Third-party notice bundle and source/package references | If native/Wasm package or generated artifact includes SDL2, mixer, or net | P01/P02 | zlib family verified; package closure untested |
| Optional audio/image libraries | Per-package notice entries with exact version and source URL | If a selected build links or bundles them | P01/P02 | Unpinned/untested |
| Emscripten/LLVM/Binaryen/Node/Python | Toolchain record plus generated-runtime notices where applicable; source archive for redistributed toolchain | Any toolchain redistribution or output containing their portions | P01/P02 | Official license families inspected; exact SDK not selected |
| SFHS bridge/launcher/build/test/docs | Project license file and source headers after legal review | First distributed project-owned source or artifact | P01+ | License is only proposed, not selected |
| Future open fixtures | Fixture-local attribution/license file plus manifest/hash | Any fixture is committed or embedded | P01/P02/P03 | No fixture is cleared or present |
| Commercial user data | No notice location because bytes are excluded; user-facing compatibility/legal-data instruction only | External local testing only | Later compatibility tasks | Excluded and unverified by policy |
| Trademarks/branding | Plain-text disclaimer in README, launcher license/help view, and release metadata after review | Use of DOOM/Chocolate Doom/Freedoom/SDL/Emscripten names | P01+ | Conservative wording proposed; legal review required |

## Source and corresponding-source package

Before any public release, the source bundle should contain:

1. The exact upstream base commit and tag record.
2. All SFHS source changes and build scripts needed to reproduce each supported artifact.
3. The exact Emscripten SDK/toolchain record and any toolchain notices required by redistribution.
4. The exact Freedoom release, source URL, hash, license, credit, and content edition mapping.
5. Dependency versions, official source URLs, license texts, and transitive notice records for the actual build.
6. The GPL license text, modified-file/date records, and any required interactive notice or license-screen path.
7. Artifact hashes and a clear statement that commercial game data is not included.

The corresponding-source package must not be replaced by a repository URL alone if the release depends on later local patches, generated source, vendored code, or a specific toolchain snapshot. The exact offer/location language is a release/legal-review item, not decided by P00.

## Required release review questions

- Does the final HTML contain Emscripten runtime code, Node-derived code, SDL code, or other third-party material that requires a notice inside the file or adjacent documentation?
- Does the selected Emscripten SDK include components whose licenses differ from the top-level Emscripten license?
- Which SDL2_mixer codecs are actually linked, and what notices do they add?
- Does FluidSynth remain optional, and what exact LGPL version/linking obligations apply to the selected release?
- Is the project-owned SFHS code licensed under a GPL-compatible license after legal review, and are engine modifications visibly marked?
- Does the proposed independent-project disclaimer avoid implying endorsement while still describing compatibility accurately?
- Are Freedoom notices and no-endorsement language visible in both bundled editions and their corresponding source releases?

## Prohibited shortcuts

Do not copy a generic “all rights reserved” notice into a GPL or BSD component, do not describe all content as GPL, do not omit transitive notices because a dependency is installed by a package manager, and do not treat a successful build as evidence of licensing permission.
