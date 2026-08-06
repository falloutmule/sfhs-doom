# P6 Android Candidate

**Status:** PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING

The P6 candidate rebuilt cleanly after adding `HEAP32` to the existing
Emscripten runtime-method list. Existing exports (`callMain`, `FS`, `ENV`) and
the exported main function remain intact. No C/gameplay/renderer/touch/minimap
semantic change was made for the repair.

Focused proof: six P6 contract tests, five portrait/editor layout tests, and
the direct-file candidate runtime test pass. The candidate exposes `HEAP32`,
reads the versioned state packet, starts audio from the trusted Start action,
and records no page error or HTTP/HTTPS request.

Protected P3 remains SHA-256
`6737dbfc8c7909ea18a820de3cd6677654fab95277caf05eb9d660cb9235490e`.
Physical Samsung acceptance remains required before any final product claim.
