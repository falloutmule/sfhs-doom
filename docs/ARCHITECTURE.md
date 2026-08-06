# Architecture

## Product boundary

The canonical candidate is a generated strict single HTML file. It embeds the Emscripten Wasm runtime and open Freedoom Phase 2 data, and does not rely on sibling runtime files or network loading.

Chocolate Doom `3.1.1` at `410d96855b5df5410ff591a90efeafa889119224` is the pinned upstream engine. The local Emscripten lock is version 6.0.5. The Android shell lives under `web/p6/`; the narrow Emscripten-only mobile input/state adapters live under `src/sfhs_mobile/`.

The input adapter emits normal SDL input. The state adapter exposes a versioned read-only packet through the existing runtime exports; `HEAP32` is exported to allow JavaScript to read it. Neither adapter changes gameplay rules, renderer behavior, map semantics, or the packaging architecture.

## Pages deployment

The Pages workflow verifies the committed candidate hash, copies that exact file byte-for-byte into a clean Pages directory as `index.html`, verifies the staged hash again, and deploys only `index.html` plus `.nojekyll`. It does not rebuild or transform the 48 MB candidate in CI.
