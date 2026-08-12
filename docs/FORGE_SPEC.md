# SFHS Doom Forge — Complete Product and Technical Specification

## 1. Project status and authority

**Working product name:** SFHS Doom Forge
**Artifact concept:** Doom Capsule
**Project repository:** `falloutmule/sfhs-doom`
**Inherited product baseline:** SFHS Doom V15
**Baseline status:** PASS
**Primary target:** Android Chrome in portrait and landscape
**Distribution target:** One HTML file
**Default operating state:** Offline
**Next product phase:** P7 — WAD Forge and Doom Capsules

V15 is the accepted game-player foundation. This project does not reopen its controls, presentation, native HUD, renderer, minimap, fullscreen, audio, or mobile layout work unless Forge integration causes a direct regression.

The Forge work remains in the current product repository because WAD ingestion, Doom launch recipes, game-content packaging, and the resulting player experience are product behavior. Shared SFHS infrastructure should receive only capabilities that later prove genuinely reusable, such as generic binary-payload packaging or generic streamed single-file export.

---

## 2. Product vision

SFHS Doom Forge is a self-contained Doom player, library, archive browser, compatibility inspector, launcher, and single-file packager.

A user should be able to:

1. Open one HTML file.
2. Play its included game immediately.
3. Import a local WAD or ZIP without uploading it.
4. Optionally enable an online WAD archive browser.
5. Inspect the content and determine what base and loading method it needs.
6. Test the resulting game.
7. Decide whether the exported artifact should carry Freedoom, another permitted base, a private local IWAD, or no base.
8. Export a new, larger or smaller single HTML.
9. Open that successor artifact offline on a phone.
10. Continue evolving it when Forge tools are included.

The defining behavior is:

```text
SFHS Doom Forge
    + base game
    + WADs
    + patches
    + launch recipe
    ↓
new self-contained Doom HTML
```

The output may be:

* a single-game capsule;
* a multi-game collection;
* a thin capsule that asks for a base IWAD;
* a private capsule containing a user-supplied IWAD;
* or another Forge-capable capsule that can ingest more content and produce another successor.

---

## 3. Research basis

The `/idgames` archive is the primary historical source for Doom-engine community files. It has served Doom content since 1993. Gamers.org maintains the official archive, while the Doomworld interface is a community database frontend rather than the official mirror. Downloads should therefore come from the archive or an approved mirror, while Doomworld may be used for discovery metadata where technically appropriate.

Freedoom is the preferred redistributable default base. Phase 1 targets Ultimate Doom-style content and Phase 2 targets Doom II-style content. Freedoom permits redistribution and modification subject to retaining its license, making it suitable for public self-contained capsules.

Chocolate Doom already distinguishes ordinary PWAD loading from total-conversion merging and DeHackEd patch loading. Forge recipes must preserve those real engine distinctions rather than treating every WAD as a generic `-file` add-on.

Other long-running or historical discovery sources may become secondary providers. Doom Wad Station describes itself as established in 1998, while Wad Archive now operates as a large historical snapshot rather than an actively updated upload service. These sources are candidates for later provider adapters, not unverified dependencies of the initial implementation.

---

## 4. Core product principles

### 4.1 Artifact first

The useful result is a working HTML artifact, not a development project the user must assemble.

Every exported capsule must be directly openable and playable.

### 4.2 Offline by default

Opening Forge performs no unexpected network request.

Online browsing becomes available only after the user explicitly enables it.

An exported player capsule must make zero network requests unless its manifest explicitly declares a networked feature.

### 4.3 Local files remain local

A selected IWAD, PWAD, ZIP, DEH, BEX, save file, or configuration file is never uploaded merely because the user imports or plays it.

The browser archive may download content, but local content must not be sent back to the archive, GitHub, analytics, or any hidden service.

### 4.4 One engine start per page boot

The accepted engine lifecycle should remain simple:

* prepare recipe;
* mount content;
* invoke Doom once;
* play.

Changing recipes should use a controlled application reload rather than attempting unsafe repeated `callMain` re-entry.

### 4.5 Preserve Doom semantics

Forge generates real Chocolate Doom arguments and uses actual engine behavior.

It must not silently simulate:

* `-iwad`;
* `-file`;
* `-merge`;
* `-deh`;
* `-dehlump`;
* or other supported loading modes.

### 4.6 Rights are visible

Download availability is not treated as automatic permission to redistribute.

The product distinguishes playing locally from exporting a capsule intended for sharing.

### 4.7 Smallest proven architecture

The first complete production lane supports Doom and Doom II content that the current Chocolate Doom engine can actually run.

More advanced engines are separate later lanes, not excuses to block the complete Chocolate-compatible product.

---

## 5. Complete product surface

Forge has five top-level modes.

### Play

Launch the built-in default game or the currently selected recipe using the accepted V15 player presentation.

### Library

View locally stored bases, WADs, packages, recipes, saves, and exported capsule records.

### Browse

Search approved online archives after explicit network permission.

### Build

Choose a base, arrange add-ons and patches, inspect compatibility, test the recipe, and export a capsule.

### Verify

Inspect an existing Forge capsule, confirm hashes and manifest integrity, and report whether it is self-contained and offline-capable.

These modes may appear as a Forge home screen before Doom starts. Once gameplay starts, V15 remains the play interface. A return-to-Forge action may restart the page into Forge mode after confirming that the current session can be closed.

---

## 6. Supported content

### 6.1 Initial supported inputs

* `.wad`
* `.zip`
* `.deh`
* `.bex`, conditionally and only according to verified engine support
* `.lmp`, for explicitly supported demo use
* `.txt`
* common README filenames
* Forge recipe JSON
* Doom capsule HTML

### 6.2 Supported engine family

The first complete release supports:

* Doom;
* Ultimate Doom-style content;
* Doom II-style content;
* Freedoom Phase 1;
* Freedoom Phase 2;
* Chocolate Doom-compatible PWADs;
* compatible total conversions using real merge behavior;
* supported DeHackEd patches.

### 6.3 Detected but unsupported content

Forge must recognize and explain content that likely requires:

* Boom;
* MBF;
* MBF21;
* ZDoom;
* GZDoom;
* UDMF;
* ACS;
* Hexen-format Doom maps;
* DECORATE or equivalent advanced actor systems;
* freelook-dependent design;
* jumping or crouching;
* another game family;
* or another source port.

Unsupported content is not launched optimistically under Chocolate Doom.

The UI must say what signal caused the classification.

### 6.4 Future engine profiles

A future engine-profile phase may add separate proven runtimes for broader compatibility.

Each engine profile must have:

* its own source and license record;
* its own compiled runtime;
* its own compatibility classifier;
* its own loading contract;
* its own tests;
* and its own capsule identity.

Do not place multiple large engines into every capsule merely for theoretical compatibility.

---

## 7. Base-to-carry system

Every recipe and export has an explicit base policy.

### 7.1 Keep Freedoom Phase 2

Default for Doom II-compatible PWADs.

The exported capsule contains one copy of Freedoom Phase 2 plus the selected add-ons.

### 7.2 Use Freedoom Phase 1

Default for Doom or Ultimate Doom-compatible episode content.

### 7.3 Use another permitted open IWAD

The user may import or select another IWAD whose redistribution terms allow embedding.

The new base replaces Freedoom rather than being added redundantly.

### 7.4 Use a private local IWAD

The user may select a locally owned commercial or otherwise non-redistributable IWAD.

The file:

* stays on the device;
* is not uploaded;
* is labeled private;
* is never placed in the repository;
* is never published by the project;
* and cannot be described as a shareable capsule.

A locally exported private capsule may contain it at the user's direction, but Forge must mark the output as private and non-redistributable.

### 7.5 Carry no base

The exported thin capsule contains:

* engine;
* shell;
* selected PWADs and patches;
* recipe;
* metadata;
* licenses for the included components;

but no IWAD.

On first launch it asks the user to choose a compatible base.

The user may:

* select a base for the current session;
* store it locally for later use;
* or cancel without modifying the capsule.

### 7.6 Standalone replacement IWAD

A complete, permitted replacement IWAD or standalone total conversion may act as its own base.

### 7.7 Carry multiple open bases

A collection containing both Doom and Doom II recipes may embed both Freedoom Phase 1 and Phase 2.

The exporter deduplicates identical payloads by hash.

### 7.8 Leave current base behind

The Build screen must provide an explicit action:

```text
Base currently carried: Freedoom Phase 2

[ Keep ]
[ Replace ]
[ Leave Behind ]
```

Leaving a base behind is a deliberate export choice, not an accidental consequence of removing a file.

---

## 8. Local ingest workflow

### 8.1 Entry points

Users may import by:

* standard browser file input;
* drag and drop on desktop;
* device file picker when available;
* opening a Forge recipe;
* opening a compatible capsule;
* or selecting a downloaded archive from the browser.

### 8.2 Inspection sequence

For every imported item:

1. Read bytes locally.
2. Compute SHA-256.
3. Identify file type by bytes, not only extension.
4. Sanitize the filename and archive paths.
5. Extract supported files from ZIP packages.
6. Locate accompanying documentation.
7. Parse WAD structure.
8. Detect game family and map slots.
9. Detect engine-feature signals.
10. Parse known metadata fields.
11. Determine likely base.
12. Propose a launch mode.
13. Assign compatibility confidence.
14. Assign permission status.
15. Present the result before launch or export.

### 8.3 WAD inspection

The analyzer records at minimum:

* IWAD or PWAD header;
* exact byte length;
* SHA-256;
* lump count;
* lump directory validity;
* map names;
* Doom-style episode maps;
* Doom II-style map numbers;
* embedded `DEHACKED` lump;
* graphics and sprite namespaces;
* advanced-port marker lumps;
* unsupported map-format markers;
* malformed or overlapping directory entries;
* duplicate lump conditions relevant to load order.

### 8.4 ZIP inspection

The ZIP analyzer must:

* reject absolute paths;
* reject `..` traversal;
* reject dangerous nested extraction;
* enforce quota-aware expansion limits;
* report compressed and expanded size;
* ignore executable content;
* avoid executing archive scripts;
* preserve relevant README and license files;
* and allow the user to inspect included filenames.

### 8.5 Background processing

Hashing, ZIP extraction, WAD parsing, and large-file conversion should run in a worker where possible so the phone UI remains responsive.

A single-file artifact may create workers from its own embedded source.

---

## 9. Compatibility classifier

Every content item receives one of four statuses.

### Verified compatible

Strong structural evidence and a successful launch test confirm the recipe under the current engine profile.

### Likely compatible

No unsupported features were detected, but the recipe has not yet completed a successful launch test.

### Manual recipe required

The package contains multiple WADs, patches, or ambiguous instructions that require user confirmation.

### Unsupported by this engine

The analyzer detected a definite requirement beyond the current Chocolate Doom lane.

Each classification includes:

* target game;
* recommended base;
* recommended loading method;
* evidence;
* confidence;
* unsupported signals;
* and whether the user manually overrode the recommendation.

A manual override must remain visible in the recipe and capsule manifest.

---

## 10. Launch recipe system

A recipe is the authoritative description of how content runs.

### 10.1 Recipe contents

A recipe stores:

* recipe ID;
* title;
* engine profile;
* base reference;
* ordered content entries;
* loading mode for each entry;
* patch files;
* optional starting map;
* optional skill;
* optional additional verified argument;
* save namespace;
* compatibility result;
* permission result;
* source and credit records.

### 10.2 Loading modes

The initial recipe builder supports verified Chocolate Doom modes:

* IWAD base;
* ordinary PWAD file loading;
* DeuSF-style merge;
* verified NWT-style merge modes where needed;
* external DeHackEd patch;
* embedded DeHackEd lump;
* explicit map warp;
* supported demo launch.

### 10.3 Ordered content

Add-ons are displayed as an ordered stack.

The user may:

* enable or disable an entry;
* reorder entries;
* change a proposed loading mode;
* remove an entry;
* restore the analyzer's recommendation.

The generated command line is shown in readable form under Advanced settings.

### 10.4 Test recipe

Before export, **Test Game**:

1. stores the draft recipe;
2. stages its files;
3. reloads into player mode;
4. boots the engine once;
5. detects successful runtime initialization;
6. records launch errors;
7. lets the user play;
8. returns to Forge without losing the draft.

A failed test does not silently modify the recipe.

---

## 11. Local library

### 11.1 Library contents

The local library stores:

* content records;
* base IWAD records;
* original imported filenames;
* hashes;
* extracted runtime files;
* documentation;
* recipes;
* favorites;
* last-played timestamps;
* compatibility results;
* source records;
* permission records;
* capsule export records;
* game saves and configuration namespaces.

### 11.2 Storage

Use OPFS for large persistent binary content where available, with IndexedDB or an equivalent supported storage layer for metadata and fallback behavior.

OPFS is private to the origin, subject to browser storage quota, and deleted when the user clears site storage. Forge must therefore show storage use and provide explicit backup/export rather than implying the browser library is permanent archival storage.

### 11.3 Deduplication

Binary content is identified by SHA-256.

Importing the same bytes again reuses the existing payload while preserving any new filename or source alias.

### 11.4 Save isolation

Each recipe receives a save namespace derived from its recipe identity.

Changing WAD load order or base content creates a distinct namespace unless the user deliberately links it.

This prevents one WAD's saves from corrupting another WAD's save files.

### 11.5 Backup

The library can export:

* recipe JSON;
* content manifest;
* selected files;
* save bundle;
* or a complete portable Forge backup.

Saves are not embedded in a public capsule by default.

---

## 12. Opt-in online archive browser

### 12.1 Network consent

Before the first archive request:

```text
Enable online WAD browsing?

Forge is currently offline.

When enabled for this session, it may:
• download the archive catalog;
• retrieve metadata for items you open;
• download only the packages you select.

Local IWADs and WADs will not be uploaded.

[ Stay Offline ]
[ Enable This Session ]
[ Enable on This Device ]
```

The default is **Stay Offline**.

### 12.2 Network visibility

The UI shows:

* active provider;
* hostname;
* requested file;
* expected download size;
* current transfer progress;
* cancel action;
* whether the file will be temporary or added to the library.

### 12.3 Primary archive provider

The first production provider is `/idgames`.

The architecture separates:

* catalog authority;
* discovery UI;
* download mirror;
* local hash verification.

A compact SFHS catalog snapshot should be generated from available archive metadata and versioned independently. The browser downloads that snapshot after permission and caches it locally.

Selected ZIP packages should come from the official archive or a verified mirror, not from an arbitrary scraping proxy.

### 12.4 Catalog search

Search and filters include:

* title;
* author;
* filename;
* year;
* Doom or Doom II;
* single map;
* episode;
* megawad;
* total conversion;
* vanilla or Chocolate compatibility;
* advanced-port requirement;
* archive size;
* map count;
* permission status;
* latest;
* oldest;
* favorites;
* already downloaded.

### 12.5 Result card

Each result shows:

* title;
* author;
* date;
* target game;
* map count;
* stated engine requirement;
* size;
* source;
* compatibility estimate;
* permission state;
* original text metadata;
* expected capsule size;
* actions.

Actions:

```text
[ Inspect ]
[ Quick Play ]
[ Add to Library ]
[ Add to Build ]
[ Open Source Record ]
```

### 12.6 Quick Play

Quick Play:

* downloads to temporary local storage;
* analyzes the package;
* proposes a base and recipe;
* asks for confirmation;
* launches;
* does not permanently add content unless the user chooses Save to Library.

### 12.7 Provider failure

When a source does not permit direct browser fetching:

* browsing may remain built in;
* Download opens the source's normal user-visible download;
* the user imports the resulting file;
* Forge does not hide the failure behind an undeclared server proxy.

### 12.8 Secondary providers

Later evidence-backed adapters may cover:

* historical archive mirrors;
* Doom Wad Station;
* Wad Archive's preserved snapshot;
* creator-owned repositories;
* direct package URLs;
* curated SFHS-compatible catalogs.

Each provider must separately prove:

* stable metadata;
* permitted access;
* download behavior;
* CORS or explicit external-download behavior;
* source attribution;
* rights handling;
* and no hidden credential requirement.

---

## 13. Build screen

The Build screen has five ordered sections.

### Base

Choose what the capsule carries.

### Add-ons

Arrange WADs and patches in exact load order.

### Compatibility

Review detected requirements, warnings, and manual overrides.

### Test

Launch the exact proposed recipe.

### Export

Choose capsule type, privacy status, Forge-tools inclusion, filename, and save behavior.

A persistent size estimate shows:

```text
Runtime               31.4 MB
Forge tools             2.8 MB
Freedoom Phase 2       14.0 MB
Selected WADs           8.6 MB
Documentation           0.1 MB
Encoding overhead       2.2 MB
--------------------------------
Estimated artifact     59.1 MB
```

The estimate is updated when the base or content changes.

---

## 14. Capsule types

### 14.1 Player capsule

Contains:

* engine;
* V15-derived player UI;
* selected base if carried;
* selected WADs and patches;
* recipe;
* credits;
* integrity manifest.

It does not contain archive browsing or Forge editing tools.

This is the smallest normal distributable capsule.

### 14.2 Forge capsule

Contains the complete Forge toolchain.

It can:

* import more files;
* browse archives with permission;
* change recipes;
* and export a successor capsule.

### 14.3 Collection capsule

Contains multiple independent recipes.

It has a launcher screen showing each included game.

Shared engines, bases, and payloads are stored once and referenced by hash.

Each recipe has independent saves.

### 14.4 Thin capsule

Contains no base IWAD.

It prompts for one when launched.

### 14.5 Private capsule

May contain a local user-supplied base or content whose redistribution rights are not established.

It is labeled:

```text
PRIVATE LOCAL CAPSULE
Not verified for redistribution
Contains user-supplied content
```

### 14.6 Shareable capsule

Uses only content whose included rights and licenses permit redistribution.

It contains complete credits and source records.

---

## 15. Forge-capable runtime architecture

### 15.1 Critical foundation

The current fixed build embeds Freedoom as part of the generated Emscripten package.

That must change for Forge.

Freedoom and other game content must become removable payloads rather than inseparable compiled-engine data.

### 15.2 Runtime layers

The Forge artifact consists of:

```text
HTML shell
Forge/player application
Chocolate Doom JavaScript
Chocolate Doom WebAssembly
mobile controls
audio/runtime support
capsule manifest
binary payload blocks
license and provenance records
```

### 15.3 Content mounting

Before Doom starts:

1. Read capsule manifest.
2. Verify payload hashes.
3. Resolve required base.
4. Decompress supported payloads.
5. Mount files into the Emscripten filesystem.
6. generate exact command-line arguments;
7. invoke Doom once.

### 15.4 Payload identity

Each binary payload has:

* SHA-256;
* byte length;
* media type;
* compression method;
* role;
* original filename;
* storage location;
* permission classification.

### 15.5 Chunking

Large payloads are encoded in deterministic ordered chunks so the browser can:

* decode incrementally;
* verify incrementally;
* write incrementally;
* avoid constructing multiple full-size copies in memory.

The final exact chunk size should be selected by measured phone performance, not assumption.

### 15.6 Compression

WAD data should be compressed in the capsule using the smallest proven embedded decoder.

Imported ZIP packages may be retained in compressed form when that avoids redundant storage, provided:

* only approved runtime files are extracted;
* required documentation remains available;
* and executable content is never run.

### 15.7 No self-modification illusion

The active HTML does not overwrite itself.

Export creates a new successor file.

---

## 16. Successor HTML exporter

### 16.1 Export flow

1. Validate recipe.
2. Confirm base policy.
3. Confirm privacy and redistribution status.
4. Calculate required payloads.
5. Deduplicate payloads.
6. Generate capsule manifest.
7. Generate credits and licenses.
8. Encode payloads in deterministic order.
9. Stream the new HTML.
10. Save through a user-selected file handle when supported.
11. Fall back to a normal browser download when needed.
12. Reopen and verify the result.

Browser file pickers and writable file handles require explicit user selection and permission. Forge should use them where available while retaining a standard download path.

### 16.2 Export options

* Include Forge tools
* Include base
* Replace base
* Leave base behind
* Include multiple recipes
* Include saves
* Include control profile
* Include mobile UI settings
* Preserve source documentation
* Public/shareable label
* Private/local label

### 16.3 Defaults

Default export:

* player capsule;
* includes selected permitted base;
* includes source documentation;
* excludes saves;
* excludes private browser library data;
* excludes Forge tools;
* makes no network request.

### 16.4 Exact output report

After export:

```text
Capsule created

File:
my-doom-capsule.html

Bytes:
61,245,880

SHA-256:
...

Recipes:
1

Base:
Freedoom Phase 2

Offline:
Verified

Unexpected network requests:
0
```

### 16.5 Export integrity

The exporter verifies:

* manifest parses;
* every payload hash matches;
* every recipe dependency exists;
* required base is embedded or intentionally external;
* artifact contains one HTML document;
* no external runtime file is required;
* no undeclared network source exists.

### 16.6 Determinism

Deterministic export is a target, not an automatic claim.

Once proven, identical:

* runtime;
* payload bytes;
* options;
* recipe;
* ordering;
* compression implementation;

must produce identical HTML bytes.

Until cross-environment determinism is demonstrated, the verifier may claim integrity and reproducibility of content identity without claiming canonical artifact identity.

---

## 17. Capsule manifest

Use a versioned manifest such as:

`sfhs.doom-capsule@1`

The manifest includes:

### Capsule identity

* schema;
* capsule title;
* capsule mode;
* creation tool version;
* engine profile;
* runtime build identity;
* network policy.

### Payloads

* ID;
* role;
* filename;
* bytes;
* SHA-256;
* compression;
* permission status;
* license reference.

### Bases

* base ID;
* game family;
* embedded or external;
* private or redistributable;
* compatibility target.

### Recipes

* recipe ID;
* title;
* base;
* ordered content;
* launch modes;
* patches;
* starting map;
* save namespace.

### Credits

* authors;
* source;
* original metadata;
* license and permission text;
* project attribution.

### Verification

* manifest version;
* payload integrity results;
* offline declaration;
* expected external input.

The manifest must not contain a self-referential whole-artifact hash inside the artifact itself.

---

## 18. Content record

Use a local record such as:

`sfhs.doom-content@1`

Fields include:

* SHA-256 identity;
* names and aliases;
* source;
* source URL record;
* import date;
* original bytes;
* extracted files;
* IWAD or PWAD;
* game target;
* maps;
* compatibility signals;
* recommended recipe;
* test status;
* permissions;
* documentation;
* library state.

Filename is descriptive metadata, not identity.

---

## 19. Recipe record

Use:

`sfhs.doom-recipe@1`

Fields include:

* ID;
* title;
* engine profile;
* base reference;
* ordered entries;
* per-entry loading mode;
* command-line options;
* start map;
* skill;
* compatibility state;
* manual overrides;
* test status;
* save namespace;
* UI presentation name and icon.

Recipe identity is derived from meaningful launch inputs, not from mutable fields such as last-played time.

---

## 20. Rights and provenance system

### 20.1 Permission statuses

#### Redistributable

Clear permission supports electronic redistribution or an open license permits it.

#### Private/local only

The user supplied the file, or its permissions prohibit or do not establish redistribution.

#### Unclear

Metadata is missing, ambiguous, contradictory, or cannot be parsed confidently.

#### Prohibited from project distribution

Commercial IWADs, copied proprietary resources, or other content that cannot appear in repository artifacts or public test capsules.

### 20.2 Export behavior

Local play remains available for imported content unless the content is technically unsafe or incompatible.

Shareable export is enabled only when the selected payloads have a defensible redistributable status.

Private export remains clearly labeled.

### 20.3 Documentation

The original README or archive text is included where required.

Forge generates a combined Credits and Permissions page without replacing the original text.

### 20.4 Engine source obligations

Publicly distributed capsules include:

* Chocolate Doom license notice;
* exact source repository and commit reference;
* build identity;
* corresponding-source information;
* Freedoom license when embedded;
* licenses for embedded third-party libraries.

### 20.5 No automatic legal certainty

The permission parser assists organization.

It does not claim to provide legal advice or guarantee that an author's text is legally sufficient.

---

## 21. Privacy contract

Forge collects no analytics by default.

It uploads no local game files.

It does not send file hashes to remote services unless the user later authorizes a specific lookup feature.

Online browsing sends only requests needed for:

* catalog retrieval;
* item metadata;
* selected package downloads.

The user can view and clear:

* cached catalogs;
* downloaded WADs;
* local bases;
* recipes;
* saves;
* permissions;
* network consent.

---

## 22. Security contract

Treat every imported file as untrusted.

Required protections:

* strict ZIP path validation;
* quota-aware decompression;
* file-count limits;
* expansion-ratio limits;
* no recursive archive explosion;
* bounds-checked WAD parsing;
* no execution of `.exe`, `.bat`, `.cmd`, `.js`, `.html`, or archive scripts;
* no importing archive HTML into the application DOM;
* no arbitrary JavaScript evaluation;
* no implicit remote navigation;
* no filename-based trust;
* cryptographic hashing before storage and export;
* clear error state after malformed input.

A WAD may alter game content through the engine's supported format. It must not gain access to browser APIs or the Forge application.

---

## 23. Failure and recovery

### Import failure

Show:

* file;
* stage;
* reason;
* whether any bytes were stored;
* clear retry/remove action.

### Launch failure

Return to Forge with:

* recipe preserved;
* engine output;
* failing argument or file where identifiable;
* last successful stage;
* ability to change recipe.

### Export failure

Do not leave a partially labeled successful result.

If streaming output fails:

* close or discard partial output where the API permits;
* preserve the build draft;
* report bytes written and failure cause.

### Startup recovery

If an embedded capsule recipe cannot boot, offer:

* retry;
* verify;
* choose external base;
* return to capsule launcher;
* open diagnostics.

---

## 24. Phone-first user interface

### Forge home

Large actions:

```text
PLAY
LIBRARY
BROWSE WADS
BUILD CAPSULE
IMPORT FILE
```

### WAD cards

Readable on a portrait phone without horizontal scrolling.

### Build screen

Uses collapsible sections but keeps Base, Test, and Export visible.

### Player

Preserves the accepted V15 presentation and settings.

### Archive browser

Supports one-handed browsing and download cancellation.

### File operations

Every import or export action must clearly name:

* source;
* destination;
* size;
* privacy state.

### Accessibility

* semantic buttons;
* visible focus;
* sufficient touch targets;
* labels for status and compatibility;
* no meaning conveyed only by color;
* reduced-motion respect for Forge UI;
* no whole-page scrolling during active play.

---

## 25. Collection capsules

A collection capsule contains several independent Doom experiences.

### Launcher

Shows:

* title;
* author;
* base;
* map count;
* last played;
* compatibility badge.

### Shared payloads

Common bases and identical files are stored once.

### Recipe isolation

Each game has:

* its own recipe;
* save namespace;
* compatibility record;
* credits;
* optional control/UI profile.

### Mixed bases

A collection may:

* carry both Freedoom phases;
* carry one open base and ask for another;
* remain entirely thin;
* or remain private.

### Collection editing

Forge may:

* add a game;
* remove a game;
* reorder games;
* rename display titles;
* select the default launch;
* export the revised successor.

---

## 26. Recursive Forge behavior

A Forge capsule can ingest another WAD and create a successor.

Example:

```text
forge.html
+ episode-a.wad
→ forge-episode-a.html

forge-episode-a.html
+ music-patch.wad
→ forge-episode-a-music.html
```

Requirements:

* original payload hashes remain preserved;
* new payloads are added once;
* removed bases are truly omitted;
* manifest history records immediate parent identity where available;
* no claim of canonical ancestry is made without exact proof;
* the output is independently verifiable.

A player-only capsule does not expose Forge tools.

---

## 27. Curated compatibility catalog

After the archive browser is functional, SFHS may maintain a curated compatibility layer.

A curated record may state:

* analyzed;
* launched;
* completed boot;
* physical phone tested;
* known base;
* known launch recipe;
* permission status;
* artifact size.

Use badges such as:

```text
ANALYZED
BROWSER-BOOTED
PHONE-TESTED
REDISTRIBUTION VERIFIED
```

Do not collapse these into one vague "works" badge.

No WAD is marked phone-tested without actual phone evidence.

---

## 28. Verification system

### 28.1 Parser tests

Synthetic fixtures cover:

* valid IWAD;
* valid PWAD;
* Doom episode maps;
* Doom II maps;
* embedded DeHackEd;
* malformed directory;
* advanced-port markers;
* ZIP traversal;
* ZIP expansion abuse;
* duplicate content;
* corrupt payload.

### 28.2 Recipe tests

Prove correct generation for:

* Freedoom Phase 1 + PWAD;
* Freedoom Phase 2 + PWAD;
* merge-style total conversion;
* DEH patch;
* embedded DEHACKED;
* no-base capsule;
* private base;
* multiple ordered PWADs.

### 28.3 Round-trip tests

Required complete paths:

#### Local import round trip

```text
Import WAD
→ inspect
→ build
→ test
→ export
→ open exported file
→ play offline
```

#### Archive round trip

```text
Enable network
→ search
→ download
→ inspect
→ test
→ export
→ disable network
→ play exported file offline
```

#### Leave-base-behind round trip

```text
Start with Freedoom capsule
→ remove base
→ export thin capsule
→ open thin capsule
→ select base locally
→ play
```

#### Replace-base round trip

```text
Start with Freedoom Phase 2
→ replace with permitted IWAD
→ export
→ verify Freedoom bytes absent
→ play
```

#### Recursive round trip

```text
Export Forge capsule
→ open successor
→ import another WAD
→ export second successor
→ verify all selected content
```

#### Collection round trip

```text
Build two recipes
→ export collection
→ launch each
→ verify independent saves
```

### 28.4 Browser tests

Cover:

* Android portrait sizes;
* landscape;
* direct `file://`;
* hosted HTTPS;
* fullscreen;
* automatic renderer;
* compatibility renderer;
* audio;
* controls;
* Forge navigation;
* library storage;
* worker parsing;
* export;
* offline operation;
* no unexpected requests;
* no page or console errors.

### 28.5 Physical phone tests

Required on the Samsung:

* import local WAD;
* inspect package;
* test launch;
* browse archive after consent;
* download;
* build;
* export;
* open successor;
* verify offline;
* thin capsule base prompt;
* collection launcher;
* large-file responsiveness;
* touch controls;
* audio;
* save isolation.

Desktop Chromium evidence is not a substitute for this phone acceptance.

### 28.6 Artifact verification

Every exported capsule must support inspection of:

* one-file status;
* embedded payloads;
* missing external base;
* declared network policy;
* payload hashes;
* runtime build;
* licenses;
* recipe dependency completeness;
* unexpected external references.

---

## 29. Performance requirements

The application must not require the entire source artifact, every imported archive, every extracted file, and the full output artifact to exist as separate simultaneous in-memory copies.

Use streaming or chunked work for:

* hashing;
* extraction;
* payload encoding;
* export;
* verification.

Before a large operation:

* query available storage estimate where possible;
* show input and expected output size;
* refuse safely when storage is insufficient;
* preserve the draft.

Performance acceptance must use real WAD sizes on the target phone.

Do not publish a universal maximum size until measured.

---

## 30. Repository and artifact strategy

### Protected baseline

Keep V15 unchanged as the accepted player reference.

### Development artifact

Create a sibling Forge artifact, for example:

`dist/sfhs-doom-forge-v1.html`

### Development route

Use a separate testing route or exact file until Forge is accepted.

Do not replace the V15 production route merely because the first Forge tranche boots.

### Source organization

Expected product-owned areas:

* Forge shell and UI;
* content analyzer;
* recipe system;
* local library;
* archive catalog client;
* capsule packer;
* capsule verifier;
* engine staging adapter;
* tests;
* schemas;
* reports.

### Shared extraction

Only extract a generic SFHS component after at least two real consumers prove the same capability is needed.

Likely later candidates:

* generic chunked payload container;
* generic streamed HTML writer;
* generic binary manifest verifier.

---

## 31. Complete implementation sequence

The following phases are one continuous product program. Completion does not stop after local WAD import.

### P7-A — Forge-capable runtime

Deliver:

* content-independent engine package;
* removable Freedoom payload;
* manifest-driven mounting;
* V15 player parity;
* one engine invocation per boot.

Acceptance:

* built-in Freedoom plays identically;
* removing the payload produces a smaller thin artifact;
* native world, HUD, controls, audio, fullscreen, and saves remain correct.

### P7-B — Local analyzer

Deliver:

* WAD parser;
* ZIP parser;
* hashing;
* metadata extraction;
* compatibility signals;
* local import UI.

Acceptance:

* synthetic fixture suite;
* real permissive test WAD;
* malformed input rejection;
* phone responsiveness.

### P7-C — Recipe builder and launcher

Deliver:

* base selection;
* ordered add-ons;
* real loading modes;
* DeHackEd support;
* controlled reload into test play;
* save isolation.

Acceptance:

* all recipe types launch;
* failed recipe returns safely;
* generated arguments match engine contracts.

### P7-D — Successor exporter

Deliver:

* Player capsule;
* Forge capsule;
* thin capsule;
* private capsule;
* keep/replace/leave-base behavior;
* size estimate;
* streamed save;
* export report.

Acceptance:

* complete local round trips;
* output opens by `file://`;
* no unexpected network;
* previous base bytes demonstrably absent when removed.

### P7-E — Local library and collections

Deliver:

* OPFS/IndexedDB library;
* deduplication;
* recipes;
* independent saves;
* collection launcher;
* backup and clear-storage controls.

Acceptance:

* reload persistence;
* quota handling;
* collection capsule;
* orientation and phone usability.

### P7-F — Online archive browser

Deliver:

* explicit network consent;
* versioned `/idgames` catalog;
* search and filters;
* item inspection;
* package download;
* Quick Play;
* Add to Library;
* visible network log.

Acceptance:

* no network before consent;
* cancelable downloads;
* archive round trip;
* cached catalog;
* offline player export.

### P7-G — Rights and provenance

Deliver:

* metadata permission parser;
* public/private classification;
* combined credits;
* original documentation;
* source records;
* engine-source information.

Acceptance:

* unclear rights never mislabeled shareable;
* commercial bases remain private;
* public test capsules contain only permitted data.

### P7-H — Capsule verifier and integrity

Deliver:

* manifest inspector;
* payload hash verification;
* missing-base reporting;
* offline declaration inspection;
* export self-check;
* producer-neutral HTML smoke.

Acceptance:

* corruption is detected;
* undeclared external requests fail;
* exported artifacts boot from exact verified bytes.

### P7-I — Recursive Forge and final product integration

Deliver:

* successor Forge export;
* collection editing;
* parent-record history;
* final navigation;
* complete phone workflow.

Acceptance:

* Forge capsule creates another Forge capsule;
* successor remains functional and verifiable;
* no duplicate payloads;
* full physical Samsung acceptance.

### P7-J — Production transition

Only after all previous phases pass:

* independent review;
* exact artifact identity;
* Pages phone route;
* public documentation;
* merge under explicit authority;
* production route transition;
* release decision.

---

## 32. Later expansion lanes

These are beyond the complete Chocolate-compatible Forge release and do not block it.

### Additional Doom engine profiles

Potential support for Boom, MBF, MBF21, or other formats through separate proven runtimes.

### Other Doom-engine games

Heretic, Hexen, Strife, and free replacement-content lanes may be considered separately.

### Local map preview

Generate an automap-style preview from WAD geometry without starting the engine.

### Curated historical shelves

Examples:

* 1990s vanilla;
* single-map classics;
* megawads;
* Freedoom-compatible;
* phone-tested;
* permissively redistributable.

### Portable save capsules

Export saves as a separate small file or explicit optional capsule payload.

### Metadata-only sharing

Share recipes and hashes without redistributing protected WAD bytes.

---

## 33. Explicit non-goals

The complete initial project does not include:

* a Doom map editor;
* automatic WAD modification;
* cloud accounts;
* cloud save synchronization;
* hidden server-side WAD processing;
* automatic publication of generated capsules;
* automatic legal certification;
* hosting commercial IWADs;
* arbitrary GZDoom mod support;
* JavaScript replacement of the Doom engine;
* rewriting V15 controls or HUD without a Forge-caused defect;
* bundling every possible engine into one enormous default artifact.

---

## 34. Definition of complete

SFHS Doom Forge is complete when a user can perform this entire path on the Samsung phone:

1. Open one Forge HTML.
2. Play the included Freedoom game.
3. Return to Forge.
4. Import a local WAD.
5. See accurate inspection and compatibility information.
6. Select the correct base and load recipe.
7. Test the WAD.
8. Save it to the local library.
9. Enable online browsing.
10. Search `/idgames`.
11. Download another WAD.
12. Test it.
13. Build a two-game collection.
14. Choose whether to carry Freedoom.
15. Export a new single HTML.
16. Open that HTML directly.
17. Play both games offline.
18. Confirm independent saves.
19. Open a thin capsule and select a local base.
20. Open a Forge-capable successor.
21. Add another WAD.
22. Export another successor.
23. Verify all payload hashes.
24. Observe zero undeclared network requests.
25. Complete the workflow without a PC or development environment.

The final product promise is:

> **One Doom HTML can discover, absorb, organize, play, shed or replace its base game, and produce another working Doom HTML.**
