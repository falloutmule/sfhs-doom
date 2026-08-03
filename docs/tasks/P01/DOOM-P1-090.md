## DOOM-P1-090 — Independent Sol gate

**Intelligence:** SOL-GATE
**Phase:** P01
**Depends on:** DOOM-P1-085
**Branch:** phase/p01-native-oracle
**Allowed files/directories:** read-only repository inspection; evidence/phase-gates/P01/SOL_GATE_PACKET.md review
**Parallel:** No
**Remote authorization:** Read-only

### Goal

Independently review the native-oracle phase without repairing or self-approving it.

### Constraints

- Luna must not mark this task done or award its own PASS.
- Do not repair source, evidence, task state, or remote state during review.

### Review duties

Inspect source/toolchain identity, tests, Freedoom gameplay, demo/timedemo stability, oracle digest inputs, logical framebuffer capture, instrumentation gating, fixtures, license provenance, phase reports, and claims/limitations. Rerun available validators read-only and return PASS, PASS_WITH_RECORDED_LIMITATIONS, REPAIR_REQUIRED, or ARCHITECTURE_BLOCKED.

### Exact verification

    python tools/verify-p1-gate.py
    python tools/taskctl.py validate
    git status --short
    git remote -v

### Gate acceptance

Only an independent Sol review can assign the verdict. A PASS authorizes P2 planning, not remote publication.

### Evidence output

- evidence/phase-gates/P01/SOL_GATE_PACKET.md

### Stop/block conditions

Candidate/evidence cannot be identified, base/head changes, evidence is missing, or independent checks cannot support a verdict.

### Commit

No Luna commit; read-only gate.
