# P01 native-oracle baseline

## Bound identities

- Upstream: Chocolate Doom `chocolate-doom-3.1.1` at `410d96855b5df5410ff591a90efeafa889119224`.
- P01 base: `804ddb9ae855b65aeec922cd5f531c672b9b2c5f`.
- Committed builder head before this packet: `ac9d51be7ec28162920212898ffec34b7315c913`.
- Branch: `phase/p01-native-oracle`.
- Host: Ubuntu 24.04.4 LTS under WSL2 x86_64; GCC 13.3.0; CMake 3.28.3; Ninja 1.11.1; SDL2 2.30.0; SDL2_mixer 2.8.0.
- Open data: Freedoom v0.13.0 only; no commercial Doom data.

The comprehensive byte inventory is
`evidence/manifests/P01/native-oracle-phase-manifest.json`.

## Clean P1-085 rebuilds

| Variant | Gate | SHA-256 | Result |
|---|---|---|---|
| Debug | OFF | `cb45217bd19d8895abd4402758f5a89fd1d972378bc86f94ce0f12f9d3434d71` | PASS |
| Release | OFF | `55d776c3e9d7905922852a84b1de568dd81e2b731a3918954964c2dabe9234fb` | PASS; matches P1-020 |
| Oracle | ON | `307cd26bbf33e98c666969630421fe77897e60ee8ff33fd410e1973b14502ef4` | PASS |
| Oracle-OFF | OFF | `7f95111c049217c50c5f5d5599d8edf690b02dafb85808df8a996d9cef4d3460` | PASS |

Exact configure/build/hash logs are under
`evidence/task-runs/P01-DOOM-P1-085/rebuild/`.

## Open data and gameplay

- Freedoom release archive SHA-256: `3f9b264f3e3ce503b4fb7f6bdcb1f419d93c7b546f4df3e874dd878db9688f59`.
- Phase 1 WAD SHA-256: `7323bcc168c5a45ff10749b339960e98314740a734c30d4b9f3337001f9e703d`.
- Phase 2 WAD identity is bound by its P1-040 manifest and the phase manifest.
- Both editions entered gameplay with separate screenshots, healthy process evidence, isolated writes, and real mixer setup observation.

## Fixtures and demos

The P1-060 fixture manifest binds every project-created fixture with purpose,
generator, size, SHA-256, provenance, and bounded CC0-1.0 assignment. Generation
is deterministic; tampered bytes, incomplete provenance, commercial/Freedoom
basenames, and scripts marked as fixture data are rejected.

The manifest-bound project demo SHA-256 is
`45f9177a339e21c8a6459dcf3d1d678e1cc777ddf71d7065c9e8f15fb5c58adb`.
P1-070 normal/strict playback passes 14/14 bounded cases. Timedemo passes 7/7;
the project end tic is stable across Debug/Release and the official Freedoom
DEMO1 result ends at tic 7117.

## Deterministic Oracle

Five fresh Oracle processes produced identical initial/tic 1/35/70/140 state
and tic 1/35/70/140 indexed logical-frame signatures. Baseline state SHA-256 is
`9bfd5c250847dab7f1cb8fb553bb0e7616ae9aa0f3bf11b25e72ee157a9414d2`.
Both PWAD orders equal baseline. The generated DeHackEd case changes only the
expected maximum-ammo state field and corresponding status-bar frames.

Oracle-OFF reaches demo tic 140 and emits no state/frame files. Addresses,
timestamps, paths, process identifiers, wall-clock throughput, presentation
buffers, and uninitialized data are excluded from deterministic Oracle fields.

## Verification boundary

This packet proves only the recorded native WSL baseline. It makes no
WebAssembly, browser, Android, iOS, commercial-data, broad mod, performance,
single-file packaging, release, or publication claim. P1-090 remains an
independent read-only review; this packet is its input, not its verdict.
