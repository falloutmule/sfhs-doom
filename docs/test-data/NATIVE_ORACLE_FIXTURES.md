# Native-oracle fixture contract

DOOM-P1-060 creates a small deterministic fixture set entirely from scratch for
native compatibility probes. The authoritative inventory is
`tests/fixtures/expected/manifest.json`; it records each path, purpose,
originating task, generator command, byte size, SHA-256, SPDX identifier, and
the direct provenance confirmations.

The listed fixture bytes and fixture metadata are project-created and carry
`CC0-1.0`. That dedication is limited to the identified files under
`tests/fixtures/**`. It does not apply to Chocolate Doom, Freedoom, commercial
Doom material, any other third-party material, Python/shell/test/build scripts,
or the SFHS Doom project as a whole. The project software license remains
unselected. No fixture contains copied or extracted game data.

## Fixture inventory

| Path | Purpose |
|---|---|
| `config/oracle.cfg` | Deterministic configuration input |
| `open-deh/oracle.deh` | Minimal DeHackEd parser input |
| `open-demos/oracle.lmp` | Project-recorded input/demo command bytes only |
| `open-pwads/order-a.wad` | Minimal project-created PWAD, order A |
| `open-pwads/order-b.wad` | Minimal project-created PWAD, order B |
| `expected/manifest.json` | Fixture metadata and provenance manifest |
| `README.md` | Fixture license boundary and provenance notice |
| `CC0-1.0.txt` | SPDX CC0-1.0 notice for the identified fixture set |

The PWADs contain only the generated `ORCLCOM`, `ORCLA`, and `ORCLB` marker
lumps. The demo contains only project-generated input bytes and does not embed
WAD lumps, artwork, maps, audio, text, or other third-party material.

## Reproducibility and native probes

Generate two independent copies and verify both with:

```text
python tools/generate-oracle-fixtures.py --output <temp-a>
python tools/generate-oracle-fixtures.py --output <temp-b>
python tools/verify-oracle-fixtures.py <temp-a>
python tools/verify-oracle-fixtures.py <temp-b>
python -m unittest tests.test_oracle_fixtures
```

The native parser/load probes use the local Chocolate Doom release build with
the already pinned, ignored Freedoom cache as the required external IWAD. They
load each project-created PWAD, DeHackEd input, and recorded demo in isolated
runtime directories. The captured stdout/stderr evidence is under
`evidence/task-runs/P01-DOOM-P1-060/native/`.

Malformed hashes, WAD structure, forbidden game-data basenames, software-script
paths, and incomplete or uncertain provenance are rejected by
`tools/verify-oracle-fixtures.py`.
