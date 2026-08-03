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
