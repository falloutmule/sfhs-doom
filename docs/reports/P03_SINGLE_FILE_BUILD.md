# P3-020 strict single-file build report

Status: PASS

The pinned Emscripten 6.0.5 toolchain built the product twice from the accepted
P3-010 source boundary. Both runs used `-sSINGLE_FILE=1` and `--embed-file` for
the cached open Freedoom Phase 2 IWAD. The final product is:

`dist/sfhs-doom-freedoom2.html`

Size: 48,225,654 bytes  
SHA-256: `6737dbfc8c7909ea18a820de3cd6677654fab95277caf05eb9d660cb9235490e`

The second clean build matched the first byte-for-byte. Static validation,
five focused unit tests, and the artifact manifest validator passed. The
product directory contains no sibling JavaScript, Wasm, data, WAD, worker, or
media runtime file. The Oracle-enabled single-file build is ignored evidence
under `build/runtime/P03/p3-oracle.html` and is not the product.

Evidence:

- `evidence/task-runs/P03-DOOM-P3-020/product/`
- `evidence/manifests/P03/sfhs-doom-freedoom2.json`
- `tools/validate-single-file.py`
