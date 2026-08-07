# P6 Samsung Coordinate/Pointer-Lock V4

## Result

`SFHS_DOOM_P6_SAMSUNG_INPUT_V4_GATE=PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING`

V4 applies one browser/mobile launch change: Chocolate Doom receives its
existing `-nograbmouse` option. The pinned source confirms that this causes
`MouseShouldBeGrabbed()` to return false in windowed mode before
`SDL_SetRelativeMouseMode(true)` can be selected by the normal cursor/grab
path. V4 does not use `-nomouse`.

No C source, gameplay, renderer, touch mapping, audio, HUD, minimap, state
packet, or packaging architecture was changed. The physical game view remains
classified as visible by the user's observation.

## V3 lineage reconciliation

The V3 diagnostic string `9cd60f6d...+local-v3` described the working-tree
delta built on commit `9cd60f6d`. That exact functional delta and its V3
artifact were committed as `0b8bc1c64a73db032bdab26f97f8e914afbf9248`.
Evidence and Pages staging followed in `52199e62` and `292d9f16`. No V3 work
was missing or discarded.

V4 follows the same embedded build-identity convention:
`292d9f16...+local-v4`. The exact committed V4 source and artifact are in
`7f0d7527a9424b2b8835ead12eedc0ffacd5c7fa`.

## Root-cause boundary

Before V4, the physical Samsung V3 report showed trusted touch Pointer Events
with finite `clientX=0` and `clientY=0`. V3 did not record
`document.pointerLockElement`, so physical pointer-lock state cannot be
reconstructed from that JSON.

V4 now records:

- document pointer-lock active state and element id;
- document focus state;
- client, screen, and page coordinates;
- relative movement, buttons, and pressure;
- the same fields on sampled/coalesced LOOK events.

Chromium mobile emulation with the exact V4 artifact reported
`pointerLock.active=false`, `elementId=null`, and real nonzero control
coordinates. This supports the hypothesis but does not prove the physical
Samsung root cause until the user exports one V4 diagnostic.

## Automatic physical outcome probes

MOVE, LOOK, and FIRE probes now collect continuously. **Test controls** only
shows or hides the result panel.

- MOVE passes only with usable coordinates and an actual x/y change.
- LOOK passes only with usable changing coordinates, posted native mouse
  input, consumer mouse input, and an angle change.
- FIRE remains coordinate-independent and passes only when ammunition drops.
- A frozen `0,0` fixture is explicitly rejected for MOVE and LOOK even if
  relative movement fields or downstream key activity exist.

## Focused V4 evidence

At 400 by 844 CSS pixels in Chromium:

- pointer lock: inactive, element id `null`;
- MOVE: client `(90, 622.16015625)`, x `-12582912 -> 13805`,
  y `-12582912 -> -12578362`, `cmdForwardNonzero +29`, held mask `0`: PASS;
- LOOK: client X started at `310`, raw delta `32`, integral units `32`,
  native mouse `+12`, consumer mouse `+12`, angle `0 -> -3670016`: PASS;
- FIRE: ammo `50 -> 49`, keydown `+1`: PASS;
- frozen zero-coordinate MOVE and LOOK fixture: correctly FAIL;
- pointer-capture `InvalidStateError`: nonfatal;
- pointer cancellation: held mask returned to `0`.

Six V4 Playwright tests, thirteen existing P6/V3 Playwright tests, and twenty-
eight focused Python contract/manifest tests passed. Static single-file
validation, project-document validation, task-state validation, and artifact
manifest validation passed.

## Artifact identity

- Source/artifact commit: `7f0d7527a9424b2b8835ead12eedc0ffacd5c7fa`.
- Candidate: `dist/sfhs-doom-android-samsung-input-v4.html`.
- Bytes: `48,323,709`.
- SHA-256: `dff29abb293d0f373a696393537a2c2f88a8f116c751b2eff3cc9ebc8908b640`.
- V3 remains `48,320,562` bytes,
  `f4bb688392c9be95f2bed258ff31b203a11ee972290222c23aeaaac070e7a35f`.
- Published Android base remains `48,275,694` bytes,
  `fb357e4276a019832a30ba0719a26b5ad815c7accb45ff46be8b302c7406c171`.
- Protected P3 remains `48,225,654` bytes,
  `6737dbfc8c7909ea18a820de3cd6677654fab95277caf05eb9d660cb9235490e`.

## Failure-mode audit

- A/B deliverable and dependency drift: guarded by one-file/static validation.
- D/T unrelated change and overreach: guarded by the shell/test-only source
  diff and unchanged C/render/gameplay files.
- K/M browser gesture and multi-touch conflict: guarded by `-nograbmouse`,
  nonfatal capture behavior, and unchanged per-pointer ownership.
- L stuck input: guarded by pointer-cancel held-mask proof.
- Q proofless success: guarded by recorded browser, static, hash, and manifest
  evidence.

## What failed

No focused automated gate failed. Physical Samsung V4 coordinate restoration
and MOVE/LOOK outcome remain untested because V4 was not published under this
handoff.

## Next action

After separate publication authorization, deploy this exact V4 hash and run the
one-minute Samsung MOVE, LOOK, FIRE, and diagnostic-export test.
