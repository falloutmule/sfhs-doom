# TASK RESULT

**Task:** DOOM-P7-020 — Package deterministic capsule payloads
**Status:** PASS
**Base:** `8e2c4be70ca16f7c0909cd67224b63679cfb2cad`
**Branch:** `feature/p7a-forge-runtime`

## Result

Forge V1 uses the exact `sfhs.doom-capsule@1` manifest contract. The full
capsule stores the open Freedoom Phase 2 IWAD as 56 ordered, non-executable
base64 chunks of deterministic gzip data. The thin verification capsule stores
only the declared exact base identity and accepts a user-selected local file.

## Verification

- Full capsule: 25,819,800 bytes, SHA-256
  `9b4018515b416f6643058d85a04d7c49212f2ca664f50a9a1b3cc2d422d84754`.
- Thin proof capsule: 11,328,200 bytes, SHA-256
  `d60a6e8fa903bf3ae55f8dcfa22add6a366ff709f8b06ccaddfeabf9bd9e8ad0`.
- Freedoom input: 28,787,748 bytes, SHA-256
  `a8772e088847032510d97ba2312406a6998f21cbab44d4ff10696faa9c0ecd4b`.
- Full and thin static validators pass.
- A second same-environment package is byte-identical to the full artifact.
