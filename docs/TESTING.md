# Testing and Evidence

The public candidate is validated only through focused P6 gates; the historical global suite is intentionally outside this publication task.

## Focused checks

- static one-file, embedded-data, no-runtime-URL validation;
- mobile runtime/export contract, including `Module.HEAP32` and read-only state packet access;
- portrait/landscape shell and control-editor Playwright checks;
- candidate boot, trusted start, audio-path, minimap/HUD, page-error, and external-request Playwright checks;
- project-document, task-state, artifact-manifest, and protected P3 identity checks.

The P6 candidate result is in `docs/phases/P06/CANDIDATE_RESULT.md`; the emulator acceptance evidence and limitations are in `docs/phases/P06/EMULATOR_ACCEPTANCE.md`. A publication identity manifest is at `evidence/manifests/P06/sfhs-doom-android.json`.

## Scope limit

Passing automation and emulator evidence do not substitute for P6-050 physical Samsung acceptance. No acceptance claim extends beyond the recorded Android 15/API 35 Google Play x86_64 emulator and its Chrome version.
