# P2 native/Wasm Oracle parity — pass

DOOM-P2-085 compares the same Chocolate Doom 3.1.1 source, phase-2 open
Freedoom v0.13.0 data, generated 140-tic demo, configuration, arguments,
checkpoint tics, DeHackEd fixture, accepted scalar fields, and raw indexed
320x200 frames.

## Results

- Fresh native P2 control: 5 independent baseline runs and one DeHackEd run;
  all reached tic 140 and produced the exact accepted checkpoint sequence.
- Chromium: 5 independent Oracle processes, all identical to one another and
  byte-for-byte equal to native.
- Firefox: 3 independent Oracle processes, all identical to one another and
  byte-for-byte equal to native.
- DeHackEd: `maxammo0` is 200 in baseline and 199 in the targeted effect run;
  the effect output matches native in both browsers.
- Raw frames: `frame-001.bin`, `frame-035.bin`, `frame-070.bin`, and
  `frame-140.bin` are each exactly 64,000 bytes and are compared by direct
  SHA-256 values. No normalization is performed.
- PWAD-order parity is explicitly excluded.

## Bounded repair evidence

The first browser Oracle attempt completed the real timedemo but produced no
MEMFS output because the native observer's environment lookup was not portable
to this Wasm runtime. The exact diagnostic recorded runtime/data/main ready,
an empty `/oracle-output` directory, and no page or failed-request errors. The
only source change was a browser-output portability fallback in
`src/sfhs_oracle/sfhs_oracle.c` that uses the already-created `/oracle-output`
MEMFS directory under Emscripten when the environment lookup is empty. The
Oracle Wasm variant was rebuilt with the pinned toolchain; fresh runs then
produced all required files.

The native WSL process emitted the complete tic-140 result but did not exit on
this host. The P2 native runner used a per-process watchdog and accepted only
when the real timedemo line and every exact state/frame artifact were present;
the termination mode is recorded as `watchdog-after-complete` in each native
result. No state or frame was synthesized.

## Evidence

- `evidence/task-runs/P02-DOOM-P2-085/native/`
- `evidence/task-runs/P02-DOOM-P2-085/wasm-chromium/`
- `evidence/task-runs/P02-DOOM-P2-085/wasm-firefox/`
- `evidence/task-runs/P02-DOOM-P2-085/comparison.json`
