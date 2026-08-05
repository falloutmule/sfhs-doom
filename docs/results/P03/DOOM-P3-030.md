## DOOM-P3-030 result

Status: PASS_WITH_RECORDED_LIMITATIONS  
Result commit: SELF

Direct-file Chromium acceptance passed, including trusted Start, running
engine audio with non-zero PCM, menu keyboard input, heartbeat, zero external
requests, and raw Oracle control/movement position difference at matching tic
35 checkpoints. Firefox direct-file startup and input passed, but its engine
AudioContext remained `suspended` after the trusted Start click despite active
audio callbacks. The authorized activation observer called `resume()` from the
trusted interaction task; Firefox still retained `suspended`. This is recorded
as the accepted browser limitation, with page errors empty and zero external
requests.

Evidence: `evidence/task-runs/P03-DOOM-P3-030/` and
`evidence/screenshots/P03/P3-030/`.
