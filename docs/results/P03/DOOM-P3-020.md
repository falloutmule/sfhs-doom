## DOOM-P3-020 result

Status: PASS  
Result commit: SELF

The strict offline single-file candidate was built twice from clean ignored P3
directories using pinned Emscripten 6.0.5. The build explicitly used
`-sSINGLE_FILE=1` and `--embed-file`. The product is the one tracked file
`dist/sfhs-doom-freedoom2.html`, with 48,225,654 bytes and SHA-256
`6737dbfc8c7909ea18a820de3cd6677654fab95277caf05eb9d660cb9235490e`.

Verification passed:

- `python tools/validate-single-file.py dist/sfhs-doom-freedoom2.html`
- `python -m unittest tests.test_single_file_build` — 5 tests
- `python tools/validate_artifact_manifest.py evidence/manifests/P03/sfhs-doom-freedoom2.json`
- second clean build exact artifact hash comparison — `P3_REPRODUCIBILITY=PASS`
- no sibling runtime file in `dist/`
- no C, gameplay, renderer, SDL, commercial-data, or remote change

The ignored Oracle-enabled single-file variant is reserved for P3-030
interaction evidence and is not the shipped product.
