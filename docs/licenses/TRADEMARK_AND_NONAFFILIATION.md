# Trademark and non-affiliation policy

**Task:** DOOM-P0-060
**Status:** Conservative proposal; not legal advice and not permission to use any mark
**Release gate:** legal/brand review is required before public packaging or promotion

## Directly inspected facts

- The official [id Software site](https://www.idsoftware.com/) identifies `DOOM®` among id Software’s iconic brands and identifies id Software as part of ZeniMax Media Inc. This confirms the need to treat DOOM branding as third-party branding; it does not grant SFHS Doom permission to use it.
- The official [Chocolate Doom About page](https://www.chocolate-doom.org/wiki/index.php/About) describes Chocolate Doom as a conservative Doom source port and identifies its source as GNU GPL software.
- The official [Chocolate Doom Downloads page](https://www.chocolate-doom.org/wiki/index.php/Downloads) identifies the source code as GNU GPL v2. It does not provide an endorsement, sponsorship, or trademark license for downstream projects.
- The official [Freedoom About page](https://freedoom.github.io/about.html) describes Freedoom as a free replacement/content project and says to include its copyright statement and credit the project.
- The Freedoom manual reproduces a BSD 3-Clause no-endorsement condition: the Freedoom project/contributor names may not be used to endorse or promote derived products without specific prior written permission.
- No official source inspected for this task supplied a blanket “official,” “endorsed,” or “affiliated” designation for SFHS Doom. Absence of a grant is not a legal conclusion; it is a reason not to imply one.

## Proposed plain-text disclaimer

The following wording is a proposed release/UI policy, not a legal opinion and not a substitute for approval:

> SFHS Doom is an independent, unofficial project. It is not affiliated with, endorsed by, sponsored by, or approved by id Software, Bethesda, ZeniMax, Chocolate Doom, Freedoom, SDL, Emscripten, LLVM, Binaryen, or their respective contributors. DOOM, Chocolate Doom, Freedoom, SDL, Emscripten, LLVM, Binaryen, and related names and marks belong to their respective owners or projects. Compatibility references identify the software and data formats supported; they do not imply endorsement.

The exact list must be updated to match the final dependency set. The wording must not be used to claim ownership, permission, or a license that has not been granted.

## Naming and presentation rules

- Use “SFHS Doom” as the project name, not a name that suggests it is an official Chocolate Doom build or an id Software product.
- Use DOOM and Chocolate Doom only as truthful compatibility or lineage references; do not reproduce official logos, title treatments, character art, or packaging trade dress without separate review.
- Keep Freedoom editions visibly distinct from commercial Doom editions and preserve Freedoom credit/notice language.
- Do not describe a build as “official,” “authorized,” “endorsed,” or “the web version of Chocolate Doom.”
- Do not use third-party project names in a way that implies sponsorship or approval. The Freedoom BSD no-endorsement clause is an explicit example of why this matters.
- Keep engine license statements, content licenses, and trademark statements in separate sections so that GPL permission is not mistaken for content or branding permission.
- Ensure screenshots, launcher labels, metadata, and store/distribution descriptions follow the same independent-project wording.

## Questions requiring review

1. Is “SFHS Doom” and each planned edition name acceptable as a nominative compatibility reference in the target distribution channels?
2. Is the proposed disclaimer sufficient for the jurisdictions and channels in which the single-file artifacts will be distributed?
3. Should “Chocolate Doom” be mentioned in the product title, or only in a compatibility/lineage section?
4. Which official names, logos, icons, and screenshots, if any, are excluded from the final release by design?
5. Does each bundled Freedoom edition include exactly the required copyright, license, credit, and no-endorsement text from its pinned release?
6. Does any selected SDL, Emscripten, codec, or toolchain component add a separate trademark or attribution rule?

Until these questions are answered, the project may describe the inspected facts in engineering documentation but must not claim trademark clearance, sponsorship, or affiliation.

## Evidence and limitations

This P00 document records official-source observations and a conservative policy. It does not determine ownership, nominative-fair-use scope, endorsement, or distribution rights. A later release review must recheck official sources and the exact artifact contents because project pages, product names, and dependency sets can change.
