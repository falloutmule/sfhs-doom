# SFHS Doom evidence policy

**Task installed:** DOOM-P0-070
**Phase:** P00 governance
**Status:** Contract for future evidence; not a product, build, browser, or compatibility claim

## Purpose and labels

Evidence binds a reported result to the exact source, upstream base, inputs, commands, verification run, and produced file. A report may describe only what its evidence directly supports.

Use these labels consistently:

- `VERIFIED`: directly observed by a recorded command or an inspected file.
- `INFERRED`: a constrained conclusion drawn from verified evidence; show the reasoning.
- `PROPOSED`: a policy or future design choice, not an observed result.
- `UNTESTED`: not run, not selected, or not directly inspected.
- `BLOCKED`: cannot be accepted until the named external input or decision exists.

Do not turn `UNTESTED`, `PROPOSED`, or `BLOCKED` into `VERIFIED` through prose.

## Run IDs and directories

Every evidence-producing run receives a unique, stable run ID such as `P00-DOOM-P0-070-fixture-20260803T000000Z`. A run directory may contain:

```text
evidence/task-runs/<run-id>/
├── command-*.stdout.txt
├── command-*.stderr.txt
├── screenshots/
├── logs/
└── report.md
```

The repository-level directories are:

```text
evidence/manifests/       machine-readable evidence manifests
evidence/fixtures/        small open mechanism fixtures, never game artifacts
evidence/task-runs/       command outputs and run reports
evidence/phase-gates/     phase-level evidence packages
evidence/screenshots/     privacy-reviewed visual evidence
evidence/logs/            captured diagnostic logs
evidence/reports/         human-readable reports
```

Run IDs must not be reused for materially different inputs or source commits. A run directory is immutable after publication; corrections use a new run ID and explain the supersession.

## Command capture

Record the exact argument vector, repository-relative working directory, UTC start/build time, exit code, stdout path, and stderr path for every material command. Command metadata is declarative evidence: checkers must never execute command arrays from a manifest. Capture environment/toolchain versions separately and redact secrets before committing.

The manifest validator recomputes file size and SHA-256 from disk. A command result is not evidence of a file’s identity until the manifest hash and size match the file on disk.

## Artifact identity

SHA-256 is canonical for artifact identity. Each artifact record contains:

- repository-relative `path`;
- recomputed `size_bytes`;
- lowercase 64-character `sha256`;
- a short `kind` such as `text-fixture`, `wasm`, or `single-file-html`.

The manifest also records the source commit, selected upstream tag and commit, dirty flag, toolchains, input files/hashes, build ID/UTC, commands, verification run IDs, and result. The P00 fixture is intentionally a text file and proves only this mechanism.

Paths are repository-relative and may not be absolute, contain `..`, resolve through a symlink outside the repository, or silently refer to a different file. Commercial IWAD/PWAD bytes, proprietary lumps, private files, secrets, tokens, and screenshots exposing commercial data are never evidence artifacts.

## Privacy and screenshots

Screenshots and logs must be reviewed for credentials, personal information, local usernames, filesystem paths, network addresses, commercial game data, and proprietary content before commit. Redaction must be documented. A screenshot proves only the visible state at capture time; it does not prove smoothness, compatibility, source identity, or release readiness.

## Stale evidence

Evidence becomes stale when source commit, upstream base, toolchain, input hash, build flags, generated source, or artifact bytes change. Do not reuse a passing manifest after any such change. The manifest’s `source.dirty` value must describe the source state used to produce the artifact; a dirty source state is not release evidence unless the task explicitly requires it.

## Checker expectations

Checkers must reject missing or unknown critical fields, malformed commit/SHA-256 values, duplicate evidence paths or run IDs, missing files, repository escapes, wrong size/hash, and tampering. They must use standard-library or explicitly authorized tooling only, report nonzero on failure, and never repair the evidence they check. A successful checker run does not claim engine correctness, gameplay correctness, browser compatibility, or legal clearance.

## Commercial-data boundary

The engine-only edition accepts legally owned user data outside the repository. Commercial IWAD/PWAD/DeHackEd/demo bytes must not enter evidence directories, manifests, screenshots, reports, fixtures, or release artifacts. Hashes of external user-owned files may be recorded only when the relevant task authorizes it and the hash itself does not expose the file.

## P00 limitations

P00 does not build Chocolate Doom, select an Emscripten SDK, download Freedoom, run a browser/device test, or produce a release artifact. The fixture manifest is a mechanism proof, not evidence that the product builds or that any future artifact is distributable.
