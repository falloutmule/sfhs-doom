# SFHS Doom Current State

**Date:** 2026-08-12
**Phase:** P07-B - Local analyzer
**Current task:** DOOM-P7-060
**Current result commit:** SELF
**Branch:** `codex/p7b-local-wad-inspection`
**Base:** P7-A publication `457df6c3a698c624b132536ab6862fac91c54c53`

## Verified artifacts

- V8: 48,328,131 bytes,
  `b806eb9274ae46954ecdc54968735ca1ca94f3f062e3559c54c59b0e7f6ad912`.
- V9: 48,328,267 bytes,
  `be885e63be73232d30bb0f897a319baa380231ea56e3eaebea64b29c71c05111`.
- V10: 48,341,427 bytes,
  `73a29b3ef179239744785a9b3e9b995fab77b82ab6c33452ae143d57a0b9e8f7`.
- V11: 48,343,387 bytes,
  `fac2b1f0637f25bab7a5f41b42115ff955c8e1bef11234876c0871232301b973`.
- V12: 48,344,370 bytes,
  `6b593fb3268b6fb1ca4cf5aa512c1f01e7c93ac51924964694e5ad712d7a7c24`.
- V13: 48,351,620 bytes,
  `97236f045b87b9f1fd65f9bcc9cc5d22ee0f348aaef8421b53987f6dc33abff9`.
- V14: 48,352,772 bytes,
  `d3c72c6cd7fd26e96be2e4db324a03151194deea478b28776f486896519e2905`.
- V15: 48,372,203 bytes,
  `e9a8b904d9fe91c09c15e6303757a4e2fd8d4eb05f8c1ce1f79c6c94ac8b71db`.
- V16: 48,372,561 bytes,
  `bc52a371427575c0c17ee8061c6d4db3d8a7120da116072f9b604f8b08863de2`.
- Forge V1: 25,819,800 bytes,
  `9b4018515b416f6643058d85a04d7c49212f2ca664f50a9a1b3cc2d422d84754`.
- Forge V2 local candidate: 25,852,127 bytes,
  `927d744c11c219dfbaffd8486f84cec77093cb626a35d389ad37d14aaf01326e`.

## V16 repair

V15's WPN- and WPN+ shared pulse controls fired, but Chocolate Doom loaded
`key_prevweapon=0` and `key_nextweapon=0`. The existing native mobile bridge
therefore rejected both actions with `-2`, posted no event, and left the ready
weapon unchanged.

V16 supplies Chocolate Doom's standard comma/period bindings through an
ephemeral browser-owned extra-config file before `callMain`. The values are DOS
scancodes 51 and 52, which Chocolate Doom translates through its existing config
loader. The buttons continue through the shared pulse controller,
`sfhs_mobile_input_pulse`, ordinary `D_PostEvent` keydown/keyup events, Doom's
existing responder, and `G_NextWeapon`.

No native, engine, shared-control, renderer, simulation, save/demo, HUD,
presentation, or persistence source changed. V15 panel sizing, LOOK tap options,
settings, control layouts, native 320x200 world, and authentic 320x32 HUD remain
unchanged.

## Verification state

The focused V16 Playwright gate passes 2/2. In portrait/automatic and
landscape/compatibility, WPN- changes the actual ready weapon from pistol (1) to
fist (0), and WPN+ changes it back to pistol (1). Each UI pulse posts one
keydown and one keyup. The ending held mask and active pointer count are zero.

The combined focused/protected browser sweep passes 22/22, MOVE-axis regression
passes 1/1, and applicable Python contracts pass 53/53. Product and oracle
builds, static validation, YAML parsing, exact protected hashes, packaging
hygiene, and `git diff --check` pass. The initial sandboxed WSL start was denied;
the approved established-toolchain retry passed and produced the exact artifact.

## Acceptance and publication state

`PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING` for the published V16/Forge pair. The
user reported V15's defined physical presentation/options checklist PASS on
2026-08-12. The independently confirmed weapon-cycle defect is repaired in V16
and passes native-state browser proof but still needs one physical WPN−/WPN+
check. Public Pages now serves exact V16 at the root and Forge V1 at `/forge/`.

## P7-A Forge state

The supplied complete Forge specification is now the authoritative P7 plan.
The former unexecuted audio phase is superseded because P6 already established
and physically accepted the audio path; that behavior is protected as a Forge
regression. P7-A is bounded to a content-independent engine, deterministic
manifest/payload packaging, verified local mounting, exactly one launch, and
complete V16 player parity. Library, archive browser, analysis, recipe authoring,
and successor export remain later tranches.

The local Forge V1 candidate is complete at 25,819,800 bytes with SHA-256
`9b4018515b416f6643058d85a04d7c49212f2ca664f50a9a1b3cc2d422d84754`.
It builds a content-independent SINGLE_FILE engine, validates deterministic full
or thin capsule data, mounts only exact declared content, and launches the
complete V16 player exactly once. Focused Forge browser tests pass 11/11 and the
Forge contract tests pass 6/6. PR #14 and main workflow `31592468583` passed;
fresh live downloads match exact local V16 and Forge bytes. Physical Samsung
acceptance remains pending.

## P7-B local analyzer state

Forge V2 adds local WAD/ZIP selection and worker-owned inspection. It computes
exact SHA-256 identities, parses WAD directories/maps/feature signals, safely
parses stored or deflated ZIP entries with traversal/count/size/ratio/CRC and
nested/executable guards, and presents an accessible phone inspection card.

The inspection schema is read-only and ephemeral. Selected bytes are not
uploaded, persisted, mounted, added to a recipe, or launched. P7-C owns those
later operations. P7-B browser tests pass 9/9; the combined P7-B/P7-A/V16 lane
passes 22/22; applicable protected Python contracts pass 58/58; and deterministic
packaging reproduces exact Forge V2 bytes. Pages remains exact Forge V1 because
P7-B remote publication was not authorized.

## Next action

Authorize Forge V2 candidate publication if desired, then perform Samsung local
WAD/ZIP inspection and built-in player checks before P7-C recipe work.
