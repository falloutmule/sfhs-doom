# Native demo and timedemo baseline

## Scope and identity

This report records the bounded DOOM-P1-070 native demo baseline on branch
`phase/p01-native-oracle`, based on source commit
`b06baf72a78539e5ebd130aba9cee0f159ca2f84`.

- Debug executable SHA-256: `a01002e005095444ada8eea8539882b158fdc0bd205fd26c67fdc944ceec7029`
- Release executable SHA-256: `55d776c3e9d7905922852a84b1de568dd81e2b731a3918954964c2dabe9234fb`
- Open IWAD: Freedoom Phase 1 v0.13.0, 28,795,076 bytes, SHA-256 `7323bcc168c5a45ff10749b339960e98314740a734c30d4b9f3337001f9e703d`
- Project demo: `tests/fixtures/open-demos/oracle.lmp`, 18 bytes, SHA-256 `45f9177a339e21c8a6459dcf3d1d678e1cc777ddf71d7065c9e8f15fb5c58adb`

The project demo is the project-created, CC0-1.0 fixture whose complete
provenance is recorded by DOOM-P1-060 in
`tests/fixtures/expected/manifest.json`. That license applies only to the
identified fixture bytes and metadata, not Chocolate Doom, Freedoom, scripts,
or SFHS Doom as a whole.

## Recording proof

`tools/record-native-demo.sh` launched the Release build in an isolated Xvfb
display, HOME, savedir, and config, selected E1M1 at skill 3, waited for native
startup, and sent the bounded quit input. The native recording completed with
the expected exit 255 and recording marker. The harness normalized the first
one zero-input tic and required the result to equal the committed project demo
byte-for-byte. The comparison passed at 18 bytes and SHA-256
`45f9177a339e21c8a6459dcf3d1d678e1cc777ddf71d7065c9e8f15fb5c58adb`.

The raw and normalized recordings and machine-readable result are under
`evidence/task-runs/P01-DOOM-P1-070/record/`.

## Playback matrix

`tools/run-native-demo.sh --matrix` passed 14 of 14 cases:

- Project demo: Debug and Release, normal and `-strictdemos`, three fresh
  process repetitions per combination (12 cases).
- Official Freedoom Phase 1 embedded `DEMO1`: Release normal and strict
  playback, one case each (2 cases).

Every case exited through the expected playback path, reported no recognized
desync marker, and used isolated runtime paths. The post-demo ENDOOM screen was
disabled only through each run's isolated extra config (`show_endoom 0`) so the
process could terminate without an interactive keypress after playback. No
engine source or ordinary user configuration was changed.

## Timedemo matrix

`tools/run-native-timedemo.sh --matrix` passed 7 of 7 cases:

- Project demo: Debug and Release, three fresh process repetitions each. Every
  result ended at tic 1.
- Official Freedoom Phase 1 embedded `DEMO1`: one Release result ending at tic
  7117.

The aggregate result reports stable per-source end tics and Debug/Release
agreement for the project demo. Timing throughput is host-dependent and is not
used as a compatibility assertion.

## Limitations

This is bounded evidence for one tiny project-created demo and one official
Freedoom v0.13.0 demo under the recorded native environment. It does not prove
universal vanilla-demo compatibility, compatibility with commercial data,
cross-platform equivalence, or future WebAssembly behavior. Normal playback
does not expose an end tic, so completion is classified from the engine's
playback message, expected clean process exit, and absence of recognized desync
markers. The official demo has one timedemo repetition; stable repetition and
Debug/Release agreement claims apply to the project demo only.
