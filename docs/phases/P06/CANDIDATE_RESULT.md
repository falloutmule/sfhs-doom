# P6 Android Candidate Result

`SFHS_DOOM_P6_ANDROID_CANDIDATE_GATE=PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING`

The local candidate is `dist/sfhs-doom-android.html`, 48,275,694 bytes,
SHA-256 `fb357e4276a019832a30ba0719a26b5ad815c7accb45ff46be8b302c7406c171`.
It is one HTML file with embedded Freedoom, the P6 portrait shell, touch
adapter, read-only minimap/HUD packet, and `HEAP32` runtime export.

Direct-file Chromium proof confirms `typeof Module.HEAP32 === 'object'`, a
readable state-packet version of 1, trusted Start/audio running, no page error,
and no HTTP/HTTPS requests. Physical Android acceptance remains P6-050.
