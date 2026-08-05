# P3-030 direct-file runtime report

Status: PASS_WITH_RECORDED_LIMITATIONS — Firefox direct-file engine audio remains suspended.

The accepted product was copied and renamed into the isolated evidence
directory and opened directly with `file://`; no local server was used. The
Playwright route blocked all HTTP/HTTPS requests and recorded none.

Passing Chromium evidence:

- trusted Start pointer/click reached `#start-doom`;
- `Module.callMain` was present and invoked once;
- audio became running, callbacks advanced, and non-zero engine PCM was
  observed;
- real Escape, ArrowDown, ArrowUp, and Enter key events reached the canvas;
- heartbeat advanced and page errors were empty;
- fresh Oracle control/movement sessions reached matching tic-35 checkpoints:
  episode 1, map 1, skill 2, tic 35; raw control `x/y` was
  `-12052340/-12546919`, movement `x/y` was `-12582912/-12582912`;
- no HTTP/HTTPS request occurred.

Firefox evidence and bounded repair:

- direct-file trusted pointerdown, pointerup, and click reached the Start
  button;
- main was invoked once and real keyboard events reached the canvas;
- heartbeat advanced and audio callbacks were observed;
- the bounded trusted-click activation observer saw the engine-created context
  suspended and called `resume()` from that trusted interaction task;
- Firefox still kept the engine AudioContext `suspended`.

Recorded Firefox post-state: `mainStarted=true`, `mainInvocations=1`,
`audioContextState="suspended"`, active audio callbacks, page errors empty,
external requests empty. Per the authorized amendment, this is recorded as a
Firefox browser limitation and is not investigated further during P3.

The only console diagnostic was the known Emscripten main-loop timing warning:
`emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a
main loop does not exist! Call emscripten_set_main_loop first to set one up.`

Evidence is under `evidence/task-runs/P03-DOOM-P3-030/` and
`evidence/screenshots/P03/P3-030/`. No C, gameplay, renderer, SDL, remote, or
commercial-data change was made.
