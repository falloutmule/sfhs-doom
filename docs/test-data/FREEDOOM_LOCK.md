# Freedoom Test-Data Lock

**Task:** DOOM-P1-040
**Status:** VERIFIED
**Release:** Freedoom 0.13.0 (`v0.13.0`)
**Official release ID:** 139025240
**Tag object:** 8cecc3642861dfb71839984c886d5576fa120d49
**Release commit:** cfb8644b1a8dc7d7d2177e6a892ccaa2922bdaae
**Published:** 2024-01-29T23:32:37Z

## Official identity

The latest official GitHub release metadata was inspected directly. Release `v0.13.0` is neither draft nor prerelease. The official release and checksum asset are:

- `https://github.com/freedoom/freedoom/releases/tag/v0.13.0`
- `https://github.com/freedoom/freedoom/releases/download/v0.13.0/freedoom-0.13.0-CHECKSUM`

| File | Bytes | SHA-256 |
|---|---:|---|
| freedoom-0.13.0.zip | 24,143,781 | 3f9b264f3e3ce503b4fb7f6bdcb1f419d93c7b546f4df3e874dd878db9688f59 |
| freedoom1.wad | 28,795,076 | 7323bcc168c5a45ff10749b339960e98314740a734c30d4b9f3337001f9e703d |
| freedoom2.wad | 28,787,748 | a8772e088847032510d97ba2312406a6998f21cbab44d4ff10696faa9c0ecd4b |
| COPYING.txt | 1,644 | 7c62f2c520769c798774f416637eec4921e5f0aafdac1245ae7c8a8cf65fe102 |

The archive checksum matches the official checksum asset. WAD and license identities were computed from the checksum-verified archive and are pinned in `tools/freedoom-lock.json`.

## License and separation

The release-local `COPYING.txt` directly states the three-clause redistribution, disclaimer, and no-endorsement terms identified as BSD-3-Clause. Freedoom content remains legally and technically distinct from the GPL-licensed Chocolate Doom engine. This record is evidence, not legal advice.

No commercial Doom data was downloaded, inspected, copied, hashed, or committed.

## Cache contract

The archive, extracted license, and the two expected WADs live only under ignored `vendor-cache/freedoom/0.13.0/`. The fetcher verifies the archive before expected-file-only extraction, validates every byte size and SHA-256, supports read-only verification, and recreates only the exact guarded version cache. WAD and archive bytes must never enter Git.
