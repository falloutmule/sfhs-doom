# TASK RESULT

**Task:** DOOM-P7-030 — Verify and mount declared payloads
**Status:** PASS
**Base:** `8e2c4be70ca16f7c0909cd67224b63679cfb2cad`
**Branch:** `feature/p7a-forge-runtime`

## Result

The browser validates every manifest layer, streams embedded gzip or a thin
local file, hashes bytes incrementally, writes sequentially to a temporary
MEMFS path, verifies exact encoded and decoded size/hash, and renames only after
success. Failure removes partial state and cannot invoke main.

## Verification

- Exact embedded and exact thin-base mounts pass.
- Bad schema, decoded hash, chunk order, duplicate chunk, missing chunk,
  corrupt chunk, wrong local base, and unsupported gzip all fail closed.
- Every rejection leaves `mainInvocations=0` and no mounted `freedoom2.wad`.
- The thin-only file picker is hidden in the full capsule and visible in thin.
