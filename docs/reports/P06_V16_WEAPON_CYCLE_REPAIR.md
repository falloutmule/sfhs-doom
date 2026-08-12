# P06 V16 Weapon Cycle Repair

## Decision

`PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING` for DOOM-P6-064.

## What was repaired

The WPN- and WPN+ touch surfaces were healthy, but the ordinary Doom key
bindings behind them were both zero. This made the mobile bridge reject the
native pulse before `D_PostEvent`, so earlier pulse-count tests could pass while
the game weapon never changed.

V16 creates an ephemeral private extra-config before starting Doom. It provides
the standard comma and period bindings as Chocolate Doom config scancodes 51 and
52. The engine's existing config translation, responder, tic command generation,
weapon ownership rules, and selection order remain authoritative.

## Boundary

Only the P6 browser shell, V16 identities, generated artifact, focused test,
validator/contracts, workflow preparation, and documentation changed. No file
under `src/` or the shared controls package changed. No browser persistence key
or schema changed. The config exists only inside the artifact's runtime FS.

## Evidence

Portrait/automatic and landscape/compatibility each start with the pistol,
switch to fist through WPN-, then switch back to pistol through WPN+. Native
direct pulses return success instead of `-2`. UI pulses add exactly one keydown
and keyup, preserve ammunition, and finish with no held input or pointer owner.

The focused/protected browser set passes 22/22, MOVE regression passes 1/1, and
Python contracts pass 53/53. Product/oracle builds, static validation, workflow
syntax, protected hashes, and packaging hygiene pass.

## Physical boundary

V15's defined physical presentation/options checklist was user-reported PASS on
2026-08-12. V16's repaired buttons still require one Samsung verification after
separately authorized publication. Pages remains V15.
