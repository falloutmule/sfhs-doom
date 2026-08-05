# SFHS Doom build identity contract

**Task installed:** DOOM-P0-070
**Phase:** P00
**Status:** Schema/field contract only; no engine or release build was run

Every future artifact report must carry a machine-readable identity containing the following fields. The canonical implementation is `evidence/manifests/artifact-manifest.schema.json`, and the standard-library checker is `tools/validate_artifact_manifest.py`.

## Required identity

| Field | Required meaning |
|---|---|
| `schema_version` | Integer version of the manifest contract. P00 uses `1`. |
| `manifest_type` | `artifact` for a file identity manifest. |
| `project` / `edition` | Project name and exact edition, such as engine-only or a pinned Freedoom edition. |
| `phase` / `task` | Phase and task that produced the evidence. |
| `source.commit` | Full 40-character lowercase Git commit used for the artifact source. |
| `source.upstream_tag` / `source.upstream_sha` | Selected upstream release tag and full source commit. |
| `source.dirty` | Whether source files were dirty at artifact production. A release build requires an explicit clean value. |
| `source.toolchains` | Name, exact version/identity, and official/source reference for every material toolchain. “Not run” is allowed only for the P00 mechanism fixture. |
| `source.inputs` | Repository-relative input paths with recomputed byte sizes and lowercase SHA-256 values. |
| `build.utc` / `build.id` | UTC build timestamp and unique run/build identity. |
| `build.commands` | Exact argument vectors, repository-relative working directories, exit codes, and stdout/stderr evidence paths. Command arrays are recorded, never executed by a checker. |
| `artifacts` | One or more repository-relative produced files with recomputed size, SHA-256, and kind. |
| `verification` | Unique run IDs, result (`PASS`, `FAIL`, or `BLOCKED`), and named checks. |
| `notes` | Limitations, exclusions, and interpretation boundaries. |

## Source identity policy

The upstream base is not the same as the current source commit. Both are required so that a future report can distinguish Chocolate Doom authority from SFHS changes. A manifest created from a dirty tree must say so. A later source or toolchain change invalidates prior artifact identity even when the output filename is unchanged.

## Toolchain and input policy

Pin toolchains by exact release/commit or an equivalent reproducible identity in the phase that selects them. Record official source URLs and licenses separately in the P00 licensing inventory. Record input hashes without embedding excluded commercial data. For generated output, record generated sources and packaging inputs needed to reproduce the bytes.

## Artifact policy

The artifact path must be repository-relative and remain inside the repository after resolution. The checker recomputes size and SHA-256 from disk; declared values are not trusted. A text fixture may validate the mechanism, but it must be labeled as a fixture and must not be described as an engine, Wasm, HTML, IWAD, or release artifact.

## Verification binding

Verification run IDs link the manifest to command stdout/stderr and reports. Reports must state what was actually checked and what was not. A passing manifest proves file identity and the declared checks only; it does not prove gameplay, compatibility, browser behavior, legal clearance, or release readiness.

## P00 fixture identity

The P00 fixture is bound to the clean DOOM-P0-060 base commit `53d903d0f368a251d0c4f110e384953c4a49b3c3`, upstream tag `chocolate-doom-3.1.1`, and upstream commit `410d96855b5df5410ff591a90efeafa889119224`. It is a small text mechanism fixture. It deliberately does not claim a product build, toolchain selection, game-data inclusion, or runtime verification.

## P01 native build identity

P01 manifests use the same schema with a conventional `P##` phase identifier whose numeric value must match the task ID. The native build identity includes the current source commit, pinned upstream tag/SHA, GCC/CMake/Ninja versions, CMake configuration, explicit optional-dependency controls, executable size and SHA-256, command logs, CMake cache, `file` output, and `ldd` output.

For P1-020, `source.dirty: false` means the upstream engine and build-system input paths were unchanged from the recorded source commit. In-task documentation, tests, tools, manifests, and logs do not alter the compiled source input. The build driver refuses substantive engine/build-system changes while tolerating Windows/WSL end-of-line normalization.

The canonical native parity options are:

    -DENABLE_SDL2_NET=OFF
    -DCMAKE_DISABLE_FIND_PACKAGE_FluidSynth=TRUE
    -DCMAKE_DISABLE_FIND_PACKAGE_SampleRate=TRUE
    -DCMAKE_DISABLE_FIND_PACKAGE_PNG=TRUE

`ldd` can still show FluidSynth and libsamplerate as transitive runtime dependencies of the Ubuntu SDL2_mixer package. That does not mean Chocolate Doom's optional direct CMake integrations were enabled; the CMake cache and link evidence distinguish those cases.

## P01 native-oracle phase-gate identity

P1-085 rebuilt all four native variants from clean ignored build directories at
committed builder head `ac9d51be7ec28162920212898ffec34b7315c913` using the
same dependency parity controls:

| Variant | Oracle gate | SHA-256 |
|---|---|---|
| Debug | OFF | `cb45217bd19d8895abd4402758f5a89fd1d972378bc86f94ce0f12f9d3434d71` |
| Release | OFF | `55d776c3e9d7905922852a84b1de568dd81e2b731a3918954964c2dabe9234fb` |
| Oracle | ON | `307cd26bbf33e98c666969630421fe77897e60ee8ff33fd410e1973b14502ef4` |
| Oracle-OFF control | OFF | `7f95111c049217c50c5f5d5599d8edf690b02dafb85808df8a996d9cef4d3460` |

The Release hash remains byte-identical to P1-020. Debug includes debug
information, so guarded source-line additions change its bytes even when
`SFHS_ORACLE_TEST=OFF`; this is not treated as behavioral drift. The separately
built Oracle-OFF process completed the same 140-tic demo and emitted no oracle
artifacts. Build-directory paths also distinguish Debug from Oracle-OFF bytes.

The comprehensive phase identity is
`evidence/manifests/P01/native-oracle-phase-manifest.json`. It binds executables,
open WADs, fixtures, demos, gameplay screenshots, state records, indexed frames,
run results, task-result hashes, upstream identity, and builder commits.

## P02 multi-file Wasm feasibility identity

P2-050 uses pinned Emscripten 6.0.5 and Playwright 1.61.1 to produce separate
JavaScript and Wasm files. Phase 1/2 open Freedoom WADs remain separate data
inputs under ignored local build directories. The three variant manifests are
under `evidence/manifests/P02/` and are validated by the same standard-library
manifest checker. `SINGLE_FILE` packaging is explicitly excluded from P2.

P2-080 preserves the multi-file boundary and adds only the browser startup
adapter needed after explicitly disabling automatic Emscripten invocation.
The final link vector is:

    -sASYNCIFY -sEXIT_RUNTIME=1 -sINVOKE_RUN=0
    -sEXPORTED_FUNCTIONS=_main
    -sEXPORTED_RUNTIME_METHODS=callMain,FS,ENV

The pinned Emscripten 6.0.5 output contains `Module['callMain']`. Audio mode
keeps main stopped until a trusted Start-button click calls `Module.callMain`
once; normal boot and input modes call the same exported entrypoint once after
the runtime and open WAD preload are ready. No shell-generated audio, embedded
Wasm/data, `SINGLE_FILE`, external request, or engine-source change is part of
this identity.

## P03 strict single-file candidate identity

P3-020 packages the accepted P2 build with Emscripten 6.0.5 using
`-sSINGLE_FILE=1` and `--embed-file` for the open Freedoom Phase 2 IWAD. The
product is exactly `dist/sfhs-doom-freedoom2.html`; its loader, Wasm module, and
WAD bytes are embedded in that one file. The committed candidate is 48,225,654
bytes with SHA-256
`6737dbfc8c7909ea18a820de3cd6677654fab95277caf05eb9d660cb9235490e`.

Two clean builds produced byte-identical HTML. The ignored Oracle-enabled
single-file variant under `build/runtime/P03/` is test evidence only and is not
the product. No C source, gameplay, renderer, SDL implementation, commercial
data, or runtime network dependency was added.
