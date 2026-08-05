# P4 local launcher disposition

**Status:** `BLOCKED_ARCHITECTURE`

P4 remains on `phase/p04-local-launcher` at
`3de1cb2d038124895a8e6408d587461ad0a6f47b`. It is not merged into P6 and no
runtime, launcher, or `callMain` takeover code may be copied from it.

The external preservation bundle is `SFHS-DOOM-P4-BLOCKED`; its report, patch,
and untracked-file archive hashes were verified during DOOM-P6-000. The only
P4 use permitted in P6 is this disposition record and the exact P3 review
record already checked by SHA-256.
