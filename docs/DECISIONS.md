# SFHS Doom decisions

## P3-020 single-file packaging

The product boundary is one HTML file. Emscripten's `SINGLE_FILE=1` embeds the
Wasm module, and `--embed-file` embeds the open Freedoom Phase 2 IWAD. The
bounded inline-JavaScript packer inserts the generated loader into the checked
in P3 shell without changing its semantics. The trusted Start handler invokes
the exported `Module.callMain` once and does not await the long-running main
loop. An ignored Oracle build is retained only for P3-030 direct-file proof.
