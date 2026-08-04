# Native oracle instrumentation

## Decision and scope

DOOM-P1-080 adds a test-only observer selected solely by the CMake option
`SFHS_ORACLE_TEST=ON`. The option defaults OFF. The implementation adds new
code under `src/sfhs_oracle/` and guarded calls in two existing Doom C files.
One existing CMake file is changed. This remains below the card budget of three
existing C files and three existing CMake files.

The observer activates only when the compiled Oracle executable receives an
explicit `SFHS_ORACLE_OUTPUT` directory. It reads state and framebuffer bytes;
it does not alter tic commands, gameplay state, RNG state, demo flow, timing,
rendering, or presentation. Ordinary Debug, Release, and separately rebuilt
OFF binaries contain no `SFHS_ORACLE_OUTPUT` string or observer object.

## Deterministic contract

The driver is a locally generated 574-byte, 140-tic zero-input Doom v1.9 demo
using E1M1 at skill 3. It is generated into ignored runtime storage and embeds
only project-generated demo command bytes. Freedoom Phase 1 v0.13.0 is the
external open IWAD input from the pinned ignored cache.

`state.jsonl` contains records at:

- initial post-level-load, pre-command state (tic 0);
- post-tic 1;
- post-tic 35;
- post-tic 70;
- post-tic 140, also marked final.

Each record contains only deterministic scalar fields: checkpoint/tic/final,
game state, episode/map/skill, player position and angle, health/armor/weapon,
kill/item/secret counters, deterministic level time and RNG index, and ammo
values. It excludes addresses, timestamps, paths, process identifiers,
wall-clock values, presentation data, and uninitialized bytes.

Each `frame-NNN.bin` contains exactly 64,000 bytes copied from Chocolate Doom's
authoritative 320x200 indexed `I_VideoBuffer` before presentation scaling. The
frame checkpoints are tics 1, 35, 70, and 140. Upstream executes tic 1 before
entering its render loop, so frame 1 truthfully records the initialized logical
buffer before the first gameplay draw; later checkpoints are post-draw logical
frames. The observer does not insert an extra render.

## Repetition results

Five fresh Oracle processes produced identical state bytes and frame hashes.
The baseline state JSONL SHA-256 is
`9bfd5c250847dab7f1cb8fb553bb0e7616ae9aa0f3bf11b25e72ee157a9414d2`.

| Tic | Frame SHA-256 |
|---:|---|
| 1 | `4f7988030a00d082fe445e00a2ac5dab502300ff1b80e8592dd569867b60ef74` |
| 35 | `07282cf2aee35810cd2e728fc42651bf6a2537ed8e8536feae3e92483ab467df` |
| 70 | `aaf9f842343a14be6359e9e9dd9dbe1a88ab94d413b7410f5224cd7d917ff239` |
| 140 | `5a7a42a0a0a99dc602f46bd4f3068f549e91017e7288ab39114e4742c9d1bb2f` |

Loading the project-created PWAD order fixtures as A/B and B/A produced the
same complete state and frame signatures as baseline. The generated DeHackEd
case changed clip maximum ammo from 200 to 199 at every state checkpoint and
changed the status-bar logical frames at tics 35, 70, and 140; all other state
fields remained identical. This proves both baseline and targeted effect
classification without claiming broad PWAD or DeHackEd compatibility.

## Instrumentation-off regression

A fresh Debug build configured with `SFHS_ORACLE_TEST=OFF` completed the same
generated timedemo at tic 140 with exit 255 and emitted no `state.jsonl` or
`frame-*.bin` artifact despite receiving `SFHS_ORACLE_OUTPUT`. Existing P1-020
Debug and Release binaries likewise contain no observer environment marker.
The P1-070 normal/strict and timedemo matrices are rerun by the exact card gate
to confirm demo behavior remains unchanged.

## Machine-readable evidence

- `evidence/task-runs/P01-DOOM-P1-080/oracle-run-set/comparison.json`
- `evidence/task-runs/P01-DOOM-P1-080/oracle-run-set/baseline/run-*/build.json`
- `evidence/task-runs/P01-DOOM-P1-080/oracle-run-set/baseline/run-*/state.jsonl`
- `evidence/task-runs/P01-DOOM-P1-080/oracle-run-set/baseline/run-*/frame-*.bin`
- `evidence/task-runs/P01-DOOM-P1-080/oracle-run-set/*/result.json`

## Limitations

This baseline covers one deterministic zero-input E1M1 demo, the named scalar
fields, and indexed logical frames in the recorded WSL native environment. It
does not establish universal demo, mod, commercial-data, platform, browser,
WebAssembly, display-presentation, audio, performance, or release compatibility.
Real-tic throughput is host-dependent and excluded from deterministic equality.
