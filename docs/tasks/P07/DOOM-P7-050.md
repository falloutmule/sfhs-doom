# DOOM-P7-050 — Gate and publish P7-A

**Status:** READY  
**Depends on:** DOOM-P7-040

Run exact capsule, failure-mode, V16 parity, protected regression, native,
offline, and static gates. After the PR gate passes, publish exact V16 at the
root Pages route and exact full Forge V1 at `/forge/`; download both and prove
byte count and SHA-256. Final status remains physical acceptance pending.

**Allowed paths:** focused tests/validators/manifests/reports/current state,
Pages workflow, full Forge artifact, and ignored evidence.
