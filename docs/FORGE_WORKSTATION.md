# SFHS Doom Forge V3 workstation

Forge V3 adds local content authoring, a library, real Chocolate Doom recipes,
collections and recursive single-HTML exports to the existing player. The local
candidate is `dist/sfhs-doom-forge-v3.html`. Earlier Forge and player artifacts
remain historical outputs; edit `web/forge/` and build rather than editing HTML
in `dist/`.

This is a locally implemented candidate, not a declaration that the complete
handoff has passed. Physical Samsung acceptance is pending. Current official
archive mirrors also block direct browser reads through CORS, so archive play
uses the normal download/import fallback authorized by the handoff. The exact
candidate identity and final evidence belong in
[`reports/P07_FORGE_COMPLETE.md`](reports/P07_FORGE_COMPLETE.md).

## Use the single HTML

Open the HTML in a browser. A development server is not required. Browsers and
phone file managers differ in whether they open local HTML as an interactive
page; use an actual browser when the file manager only previews source.

**Games** starts with Freedoom Phase 2 for Doom II content and Freedoom Phase 1
for Doom content. Choose a game and **Play selected game**. Automatic and
Compatibility renderer choices use the preserved player. Its detached native
HUD, minimap, audio, controls, control editor, panel sizes, fullscreen and LOOK
tap-to-FIRE settings remain available in the player menu.

Use the Doom menu to save or load a game. **Return to Forge / games** flushes
saves and normally returns through a page reload. In memory-only mode it keeps
the draft open and directs you to export a backup before reopening. Each page runs the engine once;
switching recipes creates a fresh engine lifetime. Imported content and recipes
are restored from browser storage when persistence is available. A launch
failure keeps the recipe and reports the engine diagnostic for repair. Recorded
launch evidence is tied to the exact recipe input namespace: a native boot is
evidence of that boot, not certification that every map in the package works.

## Import, inspect and organize

In **Import**, select a WAD, ZIP, DeHackEd patch, supported BEX text, text/readme,
recipe JSON or Forge V3 capsule HTML. Recognition uses content bytes. ZIP
extraction and WAD inspection run in an embedded worker, with cancellation and
bounds on size, entry count and expansion. Paths, duplicate entries, malformed
directories and executable content are checked. Imported HTML is read as capsule
data; its scripts and markup are not executed.

Review the type, map slots, target game, suggested base, compatibility reasons,
permission evidence and SHA-256. Unsupported port features cannot be enabled by
a manual override. BEX support is limited to the subset actually understood by
the Chocolate Doom lane; a `.bex` extension does not make a patch supported.

- **Add to recipe** constructs a recipe from the inspected content.
- **Test Game** constructs and launches the inspected recipe.
- **Add to library** keeps the payloads in the local content library.
- The library can add stored content to the selected recipe or remove an unused
  local copy. Content referenced by a recipe must first be removed from that
  recipe.

Identical payload bytes use one SHA-256 identity. Aliases can record different
filenames without storing duplicate bytes. Importing a Forge V3 HTML verifies
its declared payloads and recipes without executing the imported application.
Recipe JSON references payload identities; it does not contain the missing WADs
by itself.
Capsule imports restore carried aliases and source records. Carried saves are
verified and remapped to the imported recipe's namespace if its ID collides
with an existing recipe.

## Build a real recipe

**Recipe** controls the title, Doom/Doom II family, base, enabled files, loading
mode, file order, starting map and skill. Use `MAP01` for Doom II or `E1M1` for
Doom, or leave the optional start map empty. Supported advanced switches are
No monsters, Fast monsters and Respawn.

Each add-on has its actual loading semantics: ordinary `-file`, sprite/flat
merge `-merge`, or `-deh` for a supported patch. Embedded PWAD `DEHACKED` data
requires the native `-dehlump` behavior. Chocolate Doom loads merge files before
ordinary PWADs and then external patches; order is preserved within each mode.
The **Advanced** command shows the effective arguments instead of promising an
arbitrary interleaving the engine does not implement. **Recommendation** restores
the inferred mode for a file.

Save, duplicate or delete a recipe from this panel. A duplicate gets its own
identity and save namespace. The namespace also depends on the base, effective
file order and relevant engine settings. Cosmetic title changes preserve it;
material changes isolate incompatible saves. Keep the old recipe when you want
to retain convenient access to its previous saves.

## Keep, replace or omit the base

**Keep base** retains the selected base for an export whose Build policy keeps
bases. Select another stored IWAD or **Replace from local file** to change it.
Known Doom/Doom II family mismatches are rejected.

**Leave base behind** removes the selected recipe's base. The Build panel can
also omit every selected recipe's base. The resulting thin game asks for a local
compatible IWAD before launch. Export selects only referenced payloads, so an
unused old base is absent from both the manifest and the payload chunks; it is
not merely hidden in the UI.

Freedoom's included permission notice is preserved. An unknown local IWAD is
marked private by default. Imported commercial/private IWADs remain local; do
not commit them or include them in public project artifacts. Public export is
blocked when any carried payload has private or unclear permission. Explicit
**Create PRIVATE capsule** produces a marked local file. Playability and an
archive listing are not redistribution permission.

## Export players, thin games, collections and successors

In **Games**, add recipes to the build. In **Build**, select the games, arrange
their order and set the default game. Shared payloads are carried once. Choose a
title and base policy, then select the optional carried saves, controls and
mobile UI preferences.

- Leave **Include Forge tools** off for a smaller player capsule. Authoring
  scripts, the import worker, catalog and successor template are omitted.
- Enable it for a Forge successor that can import additional content and export
  again.
- Select multiple recipes for a collection, with independent save namespaces.
- Omit bases for a thin capsule or thin collection.

**Export single HTML** writes through the browser's file writer when available;
otherwise it creates a downloadable Blob. Progress and cancellation are exposed.
The fallback still uses browser memory, so a successful small export is not a
claim about every large WAD on every phone. Original selected documents, notices
and credits travel with their content.

Reopen the saved file, run **Verify**, and play it with networking disabled. A
Forge successor carries a clean reusable application template and one engine;
it does not serialize the live, mutated page or nest the entire previous
capsule. Repeating the process should produce Forge A → B → C without inherited
unused base bytes.

## Verify and protect local storage

**Verify** checks the manifest, payload identities, encoded and decoded hashes,
chunk order/counts, recipe references, base requirements, save records and
carried permissions. A thin capsule reports the remaining local-base requirement.
The external-runtime-dependency check complements the browser network tests; it
is not a legal certification or a physical phone performance result.

**Storage** reports unique local payload bytes, save bytes and the browser's
origin usage/quota when available. Use it to request persistent storage, export
or import the selected game's saves, clear those saves, or back up the library
as a PRIVATE Forge capsule. Save imports verify hashes and the selected recipe
namespace. Library backup also carries kept loose payloads and files referenced
only by disabled recipe entries, using backup recipes where needed. Reimport
restores their aliases and source records.

IndexedDB stores payload Blobs and metadata. Storage is tied to the browser
profile and origin/local-file environment. Moving the HTML, using another browser,
private browsing, clearing site data or storage eviction can change availability.
When IndexedDB is unavailable, Forge reports **memory-only** mode: export before
closing or reloading; session memory is not durable storage. Browser persistence
permission is a request, not a guarantee. Quota and corrupt-record errors are
reported; corrupted records are quarantined where possible while verified
embedded content remains recoverable.

## Archive browsing and privacy

Opening Forge makes no archive request. The bundled catalog can be searched
locally. **Enable this session** allows only declared mirror metadata/download
requests. **Stay offline** revokes permission and aborts active requests;
**Cancel request** cancels the current operation. Permission is not silently
remembered. No local content, hashes, saves or library records are uploaded.

The current catalog contains **14,970 package filenames** derived from the
official-mirror `fullsort.gz` index. Every entry's same-stem TXT was attempted:
**14,841 original TXT files** supply structured metadata, including **13,590
titles**, **13,200 authors** and **9,312 map counts**. The other 129 TXT endpoints
returned 404. Filename search covers the complete indexed scope; title, author
and other filters match only known fields. Nonstandard or absent metadata remains
unknown. Archive dates are not necessarily original release dates. The scope is
Doom/Doom II level packages plus themes, not every game and utility in `/idgames`.

The catalog is bundled as gzip/base64 data. It is decoded locally with byte-size
and SHA-256 checks before use; search needs no server or undocumented API.
Tracked metadata contains bounded fields and permission excerpts, source URLs
and original TXT hashes. Full original TXT bytes stay in the developer's ignored
cache, rather than being copied into every capsule.

Direct GET probes found no `Access-Control-Allow-Origin` header on the official
mirrors checked. A real Chromium `file://` request to the selected New York mirror
confirmed the CORS block. When Inspect or Quick Play cannot fetch, Forge offers
**Open archive download**. Save that ZIP with the browser, return to **Import**,
and choose it locally. The handoff explicitly permits this fallback; direct
in-app Quick Play remains unavailable in the measured environment. The physical
phone download/import/play round trip still needs acceptance. No proxy, JSONP,
external script or CORS bypass is used.

The [official mirror list](https://www.gamers.org/pub/idgames/README) recommends
mirrors for downloads. The [upload rules](https://www.gamers.org/pub/idgames/README.INCOMING)
require a same-named TXT alongside and inside each ZIP; its
[metadata template](https://www.gamers.org/pub/idgames/UPLTEMPL.TXT) includes target,
engine requirements and permission terms. Preserve each package's original
terms; the [archive policy](https://www.gamers.org/pub/idgames/README.legal) is not
a replacement for reviewing its content-specific grant.

## Build and verify from source

Run from the `sfhs-doom` repository in PowerShell:

```powershell
npm.cmd run build
npm.cmd run build:check
npm.cmd run validate:forge
npm.cmd run test:forge
node --test tests/forge-archive.test.cjs
python -m unittest discover -s tests -p test_forge_archive.py
```

`build` creates only the new V3 artifact; `build:check` rebuilds in memory and
requires an exact byte match. The builder combines `web/forge/` with the preserved
V2/V16 player source, the content-independent cached Emscripten engine and the
frozen mobile-controls bundle. The build proof records artifact, engine and
control-bundle hashes at `test-results/P07/forge-complete/build.json`.

Default cached inputs are:

```text
build/wasm/p7-forge-v2/product/src/chocolate-doom.js
build/runtime/P07-forge-v2/product/sfhs-mobile-controls-v1.iife.js
vendor-cache/freedoom/0.13.0/data/freedoom1.wad
vendor-cache/freedoom/0.13.0/data/freedoom2.wad
vendor-cache/freedoom/0.13.0/data/COPYING.txt
```

To rebuild the engine cache with the pinned Emscripten/toolchain environment,
run the existing build script from a working WSL/Linux repository environment.
Write its capsule to ignored proof output, never over a protected V1/V2 artifact:

```bash
bash tools/build-forge-capsule.sh --capsule-version 2 \
  --output test-results/P07/forge-complete/rebuilt-engine-proof.html
```

Then rerun the V3 build, parity check and browser tests. The V3 builder also
accepts `--engine-js PATH`, `--controls PATH` and `--output PATH` for explicit
inputs/proof outputs. Engine-cache provenance and fresh native checks are
reported separately; see the result report for the precise native/demo evidence.

To refresh only public archive metadata:

```powershell
python tools/update-forge-catalog.py --enrich-all --workers 4 --output web/forge/archive-catalog.json
# Reparse the verified ignored cache without networking:
python tools/update-forge-catalog.py --enrich-all --cache-only --output web/forge/archive-catalog.json
```

This explicit development command reads the durable index and same-stem TXT
metadata only. At most four credential-free requests run concurrently; the
resumable cache stays under ignored `test-results/forge-catalog/metadata-cache/`.
Responses have byte and time limits. Rate-limit responses honor Retry-After and
persistent denial stops the run; no alternate mirror is tried to bypass it.
`--refresh-cache` explicitly refetches otherwise valid cached metadata. No WAD/ZIP
payload is downloaded by the updater. End users do not run it. A new catalog
changes the next built artifact's identity.

The dedicated Playwright configuration is `browser-tests/forge.config.mjs`.
For the opt-in live mirror check, set `SFHS_ARCHIVE_LIVE=1`. If using the ordinary
Playwright configuration on Windows, set `PLAYWRIGHT_BROWSERS_PATH` to the actual
installed browser cache rather than the repository's Linux browser cache.

## Acceptance and publication

Local implementation, testing, documentation and artifact generation are
authorized. This handoff does not authorize pushing, opening a PR, merging,
changing Pages, publishing or releasing. No V3 publication follows from a local
build command.

The Samsung check must cover local WAD/ZIP selection, inspection scrolling,
recipes, base replacement/thin prompts, saves, exports and reopening, recursive
successors, controls, audio, fullscreen, rotation and realistic content sizes.
Desktop Chromium evidence does not replace those verdicts. Include the normal
archive download/import/play fallback in that physical round trip, with the
known direct-CORS and metadata limitations recorded in the result report.
