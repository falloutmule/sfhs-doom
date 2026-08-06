# SFHS Doom decisions

## ADR-015 Android portrait-first presentation

The accepted Android product is portrait-first: a uniformly scaled Doom view,
simultaneous explored-line minimap, adjustable touch deck, and compact
read-only information strip remain visible together. Landscape remains a
functional fallback. This supersedes ADR-012's orientation preference only;
it does not alter the engine, launcher, persistence roadmap, or release
boundaries.

## P3-020 single-file packaging

The product boundary is one HTML file. Emscripten's `SINGLE_FILE=1` embeds the
Wasm module, and `--embed-file` embeds the open Freedoom Phase 2 IWAD. The
bounded inline-JavaScript packer inserts the generated loader into the checked
in P3 shell without changing its semantics. The trusted Start handler invokes
the exported `Module.callMain` once and does not await the long-running main
loop. An ignored Oracle build is retained only for P3-030 direct-file proof.
