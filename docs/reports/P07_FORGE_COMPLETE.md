# Forge V3 local implementation and acceptance report

**Local result: PASS. Full product acceptance: PENDING physical Samsung evidence.**

The objective is the complete SFHS Doom Forge handoff, including local authoring,
independent saves, collections, recursive exports and a usable phone archive
workflow. The current local candidate extends Forge V2 through those authoring
and packaging surfaces. Physical Samsung acceptance, including the permitted
archive download/import/play fallback, remains pending. Direct live in-app
Quick Play is blocked by the measured mirrors' CORS policy. Do not describe this candidate as the
finished complete product on the basis of automated tests alone.

## Repository and artifact record

Current goal: deliver the fully implemented, locally verified handoff on an isolated
local branch. Result commit: **SELF** (the commit containing this report).
All locally authorized implementation, repair, documentation and packaging work is
complete. Publication and physical acceptance are separate outstanding actions.

| Field | Current report value |
| --- | --- |
| Repository | `falloutmule/sfhs-doom` |
| Expected handoff base | `d0953a12d45aa745ed18c245e45fc89f84416a39` |
| Verified base / branch / final HEAD | `d0953a12d45aa745ed18c245e45fc89f84416a39` / `codex/forge-complete-product` / SELF |
| Remote main / PR state | `d0953a12d45aa745ed18c245e45fc89f84416a39`; final read-only check confirms no open PRs; no PR created |
| Remotes | origin: `https://github.com/falloutmule/sfhs-doom.git`; upstream: `https://github.com/chocolate-doom/chocolate-doom.git` |
| Final worktree state | Clean after the single local SELF commit |
| Candidate | `dist/sfhs-doom-forge-v3.html` |
| Build identity | `FORGE-COMPLETE-4` |
| Final bytes / SHA-256 | 46,612,505 / `f73ec894d15ef6fa39282fb406f510a5e5ee09e2d87c89d0dad264905a4a0a33` |
| Static artifact validation | PASS; exact rebuild parity and every embedded payload/catalog identity checked |
| Local commit | SELF; `DOOM-P7-100` implementation/result commit |
| Published baseline | Pages workflow `31598943730` succeeded at `d0953a12`; existing [site](https://falloutmule.github.io/sfhs-doom/) unchanged |
| V3 publication | Not authorized by the handoff; local candidate only |
| Samsung verdict | Pending; no physical acceptance claimed |

## Implemented behavior

- Worker-based local WAD/ZIP/DEH/supported-BEX/text ingestion, safe capsule-data
  import and evidence-backed compatibility/permission inspection.
- Persistent SHA-256-deduplicated library records, aliases, recipes, favorites,
  recent-play information, storage accounting and recoverable corrupt records.
- Versioned content records and native launch evidence associated with the
  tested recipe inputs; failed startup diagnostics remain available for repair.
- Real native IWAD, grouped merge/file/deh, embedded DEHACKED, map/skill and
  supported-option recipes; one engine invocation per page lifetime.
- Freedoom Phase 1/2 bases, local private bases, explicit base replacement and
  omission, recipe-specific save namespaces and checked save backups.
- Ordered/default collection selection and exact payload selection for player,
  Forge, thin, collection and explicitly PRIVATE exports.
- Reusable successor templates, one carried engine, bounded chunk processing,
  progress/cancellation, writer output and Blob-download fallback.
- Capsule verification, retained player controls/HUD/minimap/renderers/audio,
  and an offline-default archive adapter with visible session consent.
- PRIVATE library backup covers kept loose and disabled-only payloads; capsule
  import restores aliases/source records and remaps carried saves on recipe ID
  collisions. Memory-only return preserves the draft for backup before reopening.

User workflows, commands and operating limitations are documented in
[`../FORGE_WORKSTATION.md`](../FORGE_WORKSTATION.md).

## Commands and evidence ownership

Run the final source/artifact gate from the repository root:

```powershell
npm.cmd run build
npm.cmd run build:check
npm.cmd run validate:forge
npm.cmd run test:forge
node --test tests/forge-archive.test.cjs
python -m unittest discover -s tests -p test_forge_archive.py
```

The browser gate uses `browser-tests/forge.config.mjs`. Run the optional live
archive probe with `SFHS_ARCHIVE_LIVE=1`; it makes one declared selected-package
request and records the actual download or CORS/manual-import outcome.
Final Forge suite: **55/55 PASS**, 2 workers, zero skipped,
`test-results/P07/forge-complete/accepted-browser.json`. The browser command used
`--config=forge.config.mjs --workers=2 --reporter=line,json`, `SFHS_ARCHIVE_LIVE=1`,
and workspace-local `TEMP`/`TMP` for Windows download staging.
Protected V16/Forge V1/V2 browser tests: **22/22 PASS**. Protected Python
contracts: **24/24 PASS** (P7: 8, P6 mobile: 13, shared controls: 3).

The following proof map distinguishes focused source harnesses from actual built
HTML integration. Every listed lane passed in the final suite; template, UI and
complete tests opened the exact final artifact and its actual downloaded successors.

| Handoff requirement | Owning proof | Evidence/result location |
| --- | --- | --- |
| WAD/ZIP/DEH/BEX recognition, permissions, map records, malformed and executable input | `browser-tests/tests/forge-ingest.spec.mjs` | Final Playwright results/traces |
| Cancellation and actual ZIP expansion bounds | `forge-ingest.spec.mjs` | Final Playwright results/traces |
| Native argument semantics, Doom/Doom II bases, safe options | `forge-core.spec.mjs` | `test-results/FORGE-COMPLETE/core/recipe.json` |
| Namespace changes for recipe/base/order/settings | `forge-core.spec.mjs` | Final Playwright results |
| Large chunk processing, hashing and cancellation | `forge-core.spec.mjs` | `test-results/FORGE-COMPLETE/core/large-payload.json` |
| Missing/duplicate/reordered/corrupt/undeclared chunks, invalid compression/manifests | `forge-core.spec.mjs` | `test-results/FORGE-COMPLETE/core/adversarial-chunks.json` |
| Full/player/thin/private/replacement/collection payload selection | `forge-core.spec.mjs` | `test-results/FORGE-COMPLETE/core/export-matrix.json` |
| Writer/Blob equivalence, aborted writes, checked save import | `forge-core.spec.mjs` | Final Playwright results |
| Standalone player omits Forge tools; template does not carry stale payloads or duplicate engine | `forge-template.spec.mjs` | `test-results/FORGE-COMPLETE/template/integrated-player-template.json` |
| Corrupt metadata/bytes/saves, deduplication and quota/transaction failure | `forge-storage.spec.mjs` | `test-results/FORGE-COMPLETE/storage/` |
| Concurrent launch guard; incompatible package stops before native preparation | `forge-storage.spec.mjs` | `storage/launch-concurrency.json` and final Playwright results |
| Versioned content and namespace-specific native boot evidence; failed startup recovery | `forge-complete.spec.mjs` | `integration/native-launch-evidence.json`, `integration/native-failure-recovery.json` |
| Actual automatic/compatibility player, native HUD, audio, controls and weapon buttons | `forge-complete.spec.mjs` | `test-results/P07/forge-complete/integration/player-{auto,compatibility}.{json,png}` |
| ZIP → exact native mount/launch → exported offline player | `forge-complete.spec.mjs` | `integration/zip-native-export.json` and generated HTML |
| Thin-base omission and local-base prompt; replacement base absence/presence | `forge-complete.spec.mjs` | Final integration results and generated HTML manifests |
| Two played recipes, independent native saves and deduplicated collection | `forge-complete.spec.mjs` | `integration/collection-saves.json` and collection HTML |
| Reopened Forge A → B → C, new import and native play | `forge-complete.spec.mjs` | `integration/recursive-forge.json` and successor HTML |
| Explicit PRIVATE output for unverified local content | `forge-complete.spec.mjs` | Final integration results and private fixture HTML |
| Offline catalog, request consent, allowlist/cancellation/size failures | `tests/forge-archive.test.cjs`, `forge-archive.spec.mjs` | `test-results/forge-complete/archive/` |
| Durable metadata parsing and unknown/permission handling | `tests/test_forge_archive.py` | Unit-test result |
| Artifact byte parity and full embedded payload identities | Build/validator commands above | `test-results/P07/forge-complete/build.json` and final validator output |
| Phone-sized layouts, hash wrapping, first-open preferences and inert imported HTML | `forge-ui.spec.mjs` | `test-results/FORGE-COMPLETE/ui/` screenshots and JSON |
| Loose WAD/README restrictions, orphan/disabled backup and colliding saved recipes | `forge-ui.spec.mjs` | `ui/loose-advanced-readme.json`, `ui/orphan-library-backup.json` and final browser results |

Common Playwright failure artifacts are under
`test-results/P07/forge-complete/accepted-browser/`. Evidence paths are deliberately
reported as they exist; differently capitalized proof directories are not
interchangeable on Linux.

## Archive verification and operating limits

The metadata snapshot has 14,970 package filenames from the official-mirror
`fullsort.gz`, with archive dates, sizes and relative paths. All 14,970 same-stem
TXT endpoints were attempted, with 14,841 original TXT responses and 129 HTTP 404
responses. Bounded extraction produced 13,590 package titles, 13,200 authors and
9,312 map counts. Unknown or nonstandard fields stay unknown. The indexed scope
is Doom/Doom II level packages plus themes; it does not include every utility or
other game in `/idgames`.

The final snapshot was generated at `2026-10-04T04:38:56.155460+00:00` from the
verified local cache. Raw JSON is 15,114,177 bytes with SHA-256
`2b796eb28670f3dd3c4b778e29d9eb5a974a4ef6a53ea0f85db40d1891bcb7fc`;
gzip is 2,097,388 bytes before base64. Capsules carry the compressed catalog with
decoded-size and hash checks. Structured fields, limited permission evidence,
URLs and original TXT hashes are tracked; raw TXT responses are only in ignored
`test-results/forge-catalog/metadata-cache/`.

The updater's `--enrich-all` path uses at most four concurrent credential-free
requests for same-stem TXT only, resumes valid cached identities, bounds response
size and timeout, and honors Retry-After. Persistent 429/503 or 401/403 stops the
run without switching mirrors. The run completed without such a block and
downloaded no WAD/ZIP payloads. Proof logs are
`test-results/forge-catalog/enrich-all.log`, `enrich-final.log` and
`enrich-final-cache.log`; the last reprocessed the entire cache without network.
Its 129 unavailable-cache records correspond to the 404s in the two live logs.

Observed archive checks completed independently of the final product gate:

- Archive adapter Node tests: **11/11 PASS**, including compressed catalog
  integrity/corruption handling.
- Metadata updater Python tests: **14/14 PASS**, including full-run concurrency,
  cache reuse, unknowns, bounded extraction, script-safe data, and rate limiting.
- Chromium archive adapter `file://` tests: **3/3 PASS**, including the opt-in live
  request outcome, rerun in the final 55-test gate with the complete catalog.
- `offline-catalog.json`: no network requests while loading/searching the local
  catalog; no page errors.
- `consent-download-controlled-response.json`: selected declared URL only, using
  a controlled server response. This proves adapter mechanics, not live mirror
  interoperability.
- `live-official-mirror.json`: exactly one real request to
  `https://youfailit.net/pub/idgames/levels/doom/s-u/uac_dead.zip`; CORS blocks the
  response because the server supplies no `Access-Control-Allow-Origin`. No page
  exception; expected CORS console errors are recorded. The result is
  **manual-import-required**, not a successful archive Quick Play.

Read-only probes also found absent CORS headers on actual package endpoints at
the other official mirrors checked. The production fallback is a normal browser
download followed by local import. There is no undeclared proxy, local-content
upload or security-policy bypass. Handoff section 13 explicitly permits normal
download plus local import when CORS blocks direct access. That fallback is
implemented within the authorized scope. Direct live in-app Quick Play remains
unavailable/unproved; physical acceptance of the full download/import/play
workflow is pending.

Primary evidence sources are the [official mirror list](https://www.gamers.org/pub/idgames/README),
[archive submission rules](https://www.gamers.org/pub/idgames/README.INCOMING),
[original TXT template](https://www.gamers.org/pub/idgames/UPLTEMPL.TXT) and
[archive legal policy](https://www.gamers.org/pub/idgames/README.legal). File-level
permission records remain separate from the archive's hosting policy.

## Engine provenance and protected outputs

V3 reuses the content-independent Emscripten engine built for Forge V2, together
with the frozen mobile-controls bundle and preserved player integration. It does
not replace the native engine with JavaScript. The builder records input hashes;
the final normalized engine SHA-256 is `aa05a7a57ef54d2a5b5cc043e30b62ddc65b2146f2d6b4444e8887648596b2b9` and the
controls SHA-256 is `2d8453442bd1ffce8f0a432c9c7c4ddf6a0ba29c6a3ce13ac668669c6579133f`. These are unchanged inputs.

A fresh native build **PASS** and strict `-playdemo` execution of the CC0 one-tic
oracle **PASS** (exit 0) were recorded at
`test-results/P07/forge-complete/native-build.log` and `native-playdemo.log`.
This bounded demo smoke is not a claim about a broad demo compatibility corpus.
The separate one-tic `-timedemo` diagnostic exited 1 and reported infinite FPS;
it is not counted as PASS or as a meaningful performance measurement. The
packaged Emscripten engine remains the verified existing V2 engine cache.

Executed in the established WSL/Linux toolchain from this repository:

```bash
cmake --build build/native/p6-063-debug-off --target chocolate-doom
SDL_AUDIODRIVER=dummy timeout 30s xvfb-run -a \
  build/native/p6-063-debug-off/src/chocolate-doom \
  -iwad vendor-cache/freedoom/0.13.0/data/freedoom1.wad \
  -playdemo tests/fixtures/open-demos/oracle.lmp -strictdemos \
  -window -width 320 -height 200 -nosound -nomusic \
  -config test-results/P07/forge-complete/native.cfg \
  -extraconfig test-results/P07/forge-complete/native-extra.cfg \
  -savedir test-results/P07/forge-complete/native-save
```

Protected Forge identities recorded by the existing manifests:

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `dist/sfhs-doom-forge-v1.html` | 25,819,800 | `9b4018515b416f6643058d85a04d7c49212f2ca664f50a9a1b3cc2d422d84754` |
| `dist/sfhs-doom-forge-v2.html` | 25,852,127 | `927d744c11c219dfbaffd8486f84cec77093cb626a35d389ad37d14aaf01326e` |

Sources: `evidence/manifests/P07/sfhs-doom-forge-v{1,2}.json`. The V3 builder
checks the protected V2 identity before packaging. All **11** V8–V16 and Forge
V1/V2 artifacts were freshly rehashed and match their recorded bytes and SHA-256:
`test-results/P07/forge-complete/protected-artifacts.json`. Protected browser
contracts also passed 22/22; no protected source or artifact was changed.

## Remaining acceptance and operational limits

- **Physical Samsung:** pending for all newly introduced workflows, real export
  sizes, direct opening/reopening, controls, rotation, fullscreen and audio.
- **Live archive:** official-mirror CORS prevents automatic in-app download in
  the measured environment; the specified normal download/import fallback is
  available. Missing or nonstandard original metadata remains unknown.
- **Storage:** IndexedDB availability, quota and eviction depend on origin and
  browser. Memory-only return preserves the session draft, but manual reload or
  close is not durable. Pagehide persistence is best effort; use explicit return
  and exported backups before reopening to switch games.
- **Export capacity:** chunked/writer tests establish the measured cases only.
  Blob fallback still requires memory; no universal phone size claim is made.
- **Compatibility:** advanced source-port content remains unsupported. BEX
  support is a verified subset, not generic Boom/MBF/GZDoom support.
- **Publication:** no push, PR, merge, Pages change, deployment or release is
  authorized by the handoff. Existing published versions are not implicitly
  replaced by this local candidate.

The full objective cannot receive **PASS complete** until the required physical
acceptance evidence exists. All available local integration checks are complete;
the next acceptance action is a physical Samsung exercise of the exact locally
verified candidate, including the specified archive fallback and realistic
export/reopen workflows.

## Exact exported proof artifacts

All paths below are under `test-results/P07/forge-complete/integration/`; they
contain only open or project-created test content. These exact saved files were
reopened in fresh offline browser contexts and independently byte-validated.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `generation-b.html` | 36,852,454 | `cb9b4ad400b57593377d4b5afa882f23e112160277368aba197c2c938bb2fa77` |
| `generation-c.html` | 36,855,223 | `542717ac855cbfe36610845a86bdbaf827cf39f693b90278b4faeaffee5c62b1` |
| `private-player.html` | 29,833,315 | `dfeb17093f256141df6bfd8c1afbe0afbdf721afa977ddb32c0ffc475ef6328e` |
| `replacement-phase1.html` | 28,967,096 | `dbaf29eca0dd360bc5603e2545a02e0c3894f299eb1a8df27ada847f24354f25` |
| `thin-player.html` | 14,940,347 | `b582054d3a86fb9baffa3be8758f7b83c89087c440ac5a7be90b996e7aa55752` |
| `two-game-collection.html` | 36,991,859 | `47d2fd08111a2175aa6e143542034f57b6e2a6d7609e905e751a2c4b11c3b6af` |
| `zip-player.html` | 29,905,092 | `c1b2a1b21242efb1bc3fb0454a05400c2d48fc49c79626e14d2d144c9317c5d5` |

Full inventory: `test-results/P07/forge-complete/final-export-inventory.json`.

## Responsiveness, network and repaired failures

The writer test exported a 105,906,176-byte payload into a 141,272,453-byte HTML
with writes bounded to 262,144 bytes, independent matching SHA-256, progress and
responsive timer ticks. It retained no output Blob on the writer path. Exact
desktop timing and coarse JavaScript heap readings are recorded in
`test-results/FORGE-COMPLETE/core/large-streamed-export.json`; heap readings do not
include native/Blob backing storage and are not Samsung capacity measurements.

Ordinary playback and exported capsules produced zero HTTP requests, page
exceptions or fatal console errors. Only consented selected archive requests
occurred in network tests. Expected CORS console errors and deliberately injected
launch/dependency failures are retained separately; they are not hidden as clean
playback evidence. Portrait/landscape screenshots and preference/backup/import
proofs are in `test-results/FORGE-COMPLETE/ui/`.

Repairs during integration included preserved native viewport flags, first-open
preferences, loose-file README restrictions, library orphan/disabled-file backups,
alias/source restoration, save-namespace remapping, launch recovery and scoped
launch evidence, and external CSS/media dependency detection. An intermediate
concurrency unit mock lacked the newly required native-boot evidence; its mock was
corrected while retaining all one-invocation assertions. The final suite passes.
Windows sandbox download staging required workspace-local TEMP/TMP. Build parity
caught a stale intermediate output after a diagnostics edit; the final uniquely
identified candidate was rebuilt and rechecked. The one-tic timedemo exit 1 is
recorded at `test-results/P07/forge-complete/native-demo.log`, not counted as PASS.
