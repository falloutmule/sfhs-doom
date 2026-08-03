# Evidence tree

This tree contains governance evidence and later phase evidence packages. It is not a game-data directory and must never contain commercial IWAD/PWAD bytes, DeHackEd patches, proprietary lumps, secrets, or private screenshots.

## Directories

- `manifests/` — machine-readable artifact identity manifests and schemas.
- `fixtures/` — small open text fixtures that prove evidence machinery; not product artifacts.
- `task-runs/` — immutable run IDs with command output, logs, and reports.
- `phase-gates/` — phase-level evidence packages.
- `screenshots/` — privacy-reviewed visual evidence only.
- `logs/` — captured logs with secrets and personal data removed.
- `reports/` — human-readable evidence reports.

Every manifest is validated against the repository-relative path, source identity, command capture, SHA-256, byte-size, duplicate, and tamper rules in `tools/validate_artifact_manifest.py`.
