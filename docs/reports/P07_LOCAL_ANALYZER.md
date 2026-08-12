# P07-B Local Analyzer Guard Report

## Failure-mode audit

**Goal:** Safely inspect untrusted local WAD/ZIP files on a phone without upload or launch.
**Card:** DOOM-P7-060
**Repo:** sfhs-doom
**Baseline:** P7-A publication merge `457df6c3a698c624b132536ab6862fac91c54c53`
**Files touched:** P7 shell/analyzer/build/test/docs paths allowed by the card.

### Modes actively guarded

- **A, B, C:** Preserve one offline HTML with no runtime dependency, eval, or inline handlers.
- **D, T:** Separate P7-B source and one bounded card; no native/shared/gameplay changes.
- **F, G:** No new persistence and no analyzer test state left in production.
- **H, J, K, N, P:** Phone card uses safe-area-aware internal scrolling and cannot route gameplay input.
- **L, M:** Selecting/clearing files releases gameplay input; V16 concurrent controls remain protected.
- **Q, R, S:** Automated fixture/browser proof stays under ignored evidence; no paths/secrets in artifacts.

### P7-B parser-specific guards

- Bounds-check WAD headers, directory arithmetic, lump ranges, names, counts, and overlap.
- Validate ZIP EOCD/central/local records, paths, flags, methods, counts, sizes, ratios, CRC, and nesting.
- Ignore executable/archive-script content and never inject imported text into the DOM as HTML.
- Cap reported arrays and transfer selected bytes to a dedicated embedded worker.
- Keep analyzed bytes out of MEMFS, localStorage, capsule manifests, recipes, and `callMain`.

### Explicitly N/A

- **E:** Analyzer rendering does not access simulation state.
- **I:** No canvas/backing-store geometry changes are planned.
- **O:** Shared control profile and Doom UI preference schemas remain unchanged.

## WHAT WAS DONE

- Added the embedded `forge-analyzer-worker.js` with strict WAD/ZIP parsing,
  SHA-256 identity, CRC verification, quotas, and compatibility signals.
- Added the phone-first local picker and inspection card to Forge V2.
- Kept selected bytes inspection-only and kept P7-A built-in launch intact.
- Generated a distinct protected-successor candidate; Forge V1 was not edited.

## WHAT WAS VERIFIED

- Synthetic PWAD, open permissive PWAD, stored/deflated ZIP, README discovery,
  executable ignore, map families, DEHACKED, duplicates, and unsupported markers.
- WAD bounds/overlap and ZIP traversal, absolute path, encryption, count, ratio,
  nested archive, duplicate path, CRC, and compression guards.
- 16 MiB analysis continues animation frames in the main UI.
- Portrait 360×800 and landscape 915×412 inspection; no page scroll.
- Inspection leaves MEMFS/mount/main unchanged; built-in V16 launches once.
- P7-B 9/9, combined focused browser 22/22, protected Python 58/58.

## WHAT FAILED

The initial card was too constrained inside the 4:3 world region. Visual proof
caught it, the pre-launch Forge surface was promoted to the full safe viewport,
and the corrected screenshots and browser assertions pass. A preliminary
package command used the wrong working directory; it was rerun correctly and is
not used as final evidence. A Windows-Python determinism attempt preserved
different line endings, and PowerShell blocked `npx.ps1`; the final proof used
the official WSL packaging environment plus its normalization step and
`npx.cmd`, producing exact bytes and a passing 22-test browser run.

## CURRENT EXACT STATE

- Candidate BUILD_ID: `P7-FORGE-V2`
- Base: `457df6c3a698c624b132536ab6862fac91c54c53`
- Artifact: 25,852,127 bytes
- SHA-256: `927d744c11c219dfbaffd8486f84cec77093cb626a35d389ad37d14aaf01326e`
- Harness: P7-B 9/9; combined focused 22/22; protected Python 58/58

## REMAINING BLOCKERS

Remote publication is not authorized. Physical Samsung P7-B acceptance is
pending and is not claimed from Playwright.

## NEXT ACTIONABLE STEP

Authorize publication if desired, then perform the defined Samsung inspection
and responsiveness checklist.

## EVIDENCE

Raw proof is under `test-results/P07/P7-B/`; the committed identity record is
`evidence/manifests/P07/sfhs-doom-forge-v2.json`.

## GITHUB PAGES URL

- Current P7-A: https://falloutmule.github.io/sfhs-doom/forge/
- P7-B: local candidate only until publication is authorized.

**Result:** PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING
