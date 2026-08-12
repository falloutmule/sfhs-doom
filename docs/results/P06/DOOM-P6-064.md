# TASK RESULT

**Task:** DOOM-P6-064 - Repair mobile weapon cycling
**Status:** PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING
**Base:** `0112ccd69d9bf0bf1dd9a90afb833fec6a819808`
**Result commit:** `SELF`
**Branch:** `repair/p6-v16-weapon-cycle`

## Result

V16 repairs both mobile weapon-cycle buttons without changing native or shared
source. A private ephemeral extra-config supplies Chocolate Doom's standard
previous/next bindings before startup, allowing the existing mobile pulse bridge
and ordinary Doom key responder to process both actions.

```text
artifact: dist/sfhs-doom-android-sfhs-controls-v16.html
bytes:    48372561
sha256:   bc52a371427575c0c17ee8061c6d4db3d8a7120da116072f9b604f8b08863de2
oracle:   test-results/P06/P6-064/sfhs-doom-v16-oracle.html
bytes:    48397803
sha256:   40c69949f0a87c630f3dac15f726d9370ea0b18e1bb09fedb30a92899cb90c2a
```

V8 through V15 retain their exact protected sizes and hashes.

## Root cause and repair

V15 proved that the shared WPN controls generated pulse counts, but both native
weapon key variables were zero. `sfhs_mobile_input_pulse(9/10)` returned `-2`,
posted no Doom event, and never changed `readyweapon`.

V16 passes `-extraconfig /sfhs-doom-mobile-extra.cfg` and writes only:

```text
key_prevweapon 51
key_nextweapon 52
```

Chocolate Doom translates these standard DOS scancodes to comma and period.
No native responder, weapon selection, mobile bridge, shared runtime, or
persistence schema changed.

## Verification

- Official product and oracle builds: PASS.
- Static V16 single-file validator: PASS.
- Focused V16 Playwright: 2/2 passed.
- Combined V16/V15/V13/shared browser sweep: 22/22 passed.
- MOVE-axis regression: 1/1 passed.
- Applicable Python contracts: 53/53 passed.
- Workflow YAML parse and `git diff --check`: PASS.
- Browser evidence contains no fatal page/console error, external request,
  failed request, held input, or active pointer.

## Real weapon proof

Both portrait/automatic and landscape/compatibility prove:

- initial weapon: pistol (`1`);
- WPN- result: fist (`0`);
- WPN+ result: pistol (`1`);
- one controller pulse and one standard keydown/keyup per button;
- ammunition unchanged;
- ending held mask `0` and active pointers `0`.

## Failure classification

The first WSL build invocation was denied by the Windows sandbox before the
toolchain started. The approved retry passed. A combined verification command
initially invoked Python from `browser-tests/`; both checks were immediately
rerun from repository root and passed. The current Python 3.14 environment did
not contain PyYAML; the installed Python 3.11 environment parsed the workflow
successfully. These are environment/invocation failures, not product failures.

## Evidence

- `test-results/P06/P6-064/portrait-auto-weapon-cycle-proof.json`
- `test-results/P06/P6-064/landscape-compatibility-weapon-cycle-proof.json`
- `test-results/P06/P6-064/preflight-backup/shell.html`
- `evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v16.json`

## Limitations and next action

V16 is local and has not been published or physically tested. After explicit
remote authorization, publish exact V16 and confirm both buttons on Samsung.
