# Source Authority

## VERIFIED

- The authoritative editable source is `phase/p06-android-portrait` at `12537ce3d1d9f0106153377b76e9450a49cc074f`.
- The selected Android candidate is `dist/sfhs-doom-android.html`, 48,275,694 bytes, SHA-256 `fb357e4276a019832a30ba0719a26b5ad815c7accb45ff46be8b302c7406c171`.
- The candidate product build was recorded at `c16277b4291520e2d6579a6381b9602bbea24151`; the later authoritative source commit records only emulator evidence and current state.
- The protected P3 artifact is unchanged: 48,225,654 bytes, SHA-256 `6737dbfc8c7909ea18a820de3cd6677654fab95277caf05eb9d660cb9235490e`.

## REPORTED

- P6 candidate and emulator gate results are recorded in their phase documents and result records.

## INFERRED

- The difference from the candidate-result commit to the authoritative P6 head is documentation/evidence only; it does not change the selected artifact.

## PROPOSED

- GitHub Pages stages the verified candidate unchanged as `index.html`.

## UNTESTED

- Physical Samsung Galaxy S21 Ultra acceptance, speaker audibility, comfort, heat, battery, and device-specific performance.

## BLOCKED

- P4 local-file launcher work at `phase/p04-local-launcher` / `3de1cb2d038124895a8e6408d587461ad0a6f47` is `BLOCKED_ARCHITECTURE` and must not be merged or used as runtime authority.

## SUPERSEDED

- The P3 artifact remains preserved and verified, but P6 is the selected Android product candidate.
