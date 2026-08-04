# P2 Multi-File Wasm Platform Adapter

**Task:** DOOM-P2-050  
**Status:** VERIFIED PASS

P2-040 demonstrated that the accepted upstream Chocolate Doom target already
links directly with Emscripten. This task therefore keeps the adapter bounded:
the build driver selects pinned flags, copies open Freedoom data as a separate
file, records standard-library artifact manifests, and supplies a loopback-only
web shell with delayed runtime readiness. It does not change gameplay, renderer,
vanilla limits, SDL ports, or any `src/doom/**` file.

The three required variants are `phase1-debug`, `phase2-debug`, and
`phase2-oracle`. Each produces separate JavaScript/Wasm/data files and is built
twice from an empty ignored directory. Reproducibility is established by
comparing per-variant artifact SHA-256 records between runs.

The native-control wrapper checks the already accepted P1 debug, release, and
Oracle binaries with a no-data `-version` control invocation. It does not
rebuild native artifacts or rewrite P1 evidence.

Run 1 and run 2 each passed all three variants. The per-variant JavaScript and
Wasm hashes matched exactly, and the three P2 manifests validate against the
repository artifact contract.
