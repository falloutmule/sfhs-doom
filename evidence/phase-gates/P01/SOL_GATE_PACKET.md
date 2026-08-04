# SOL gate packet — P01 native Chocolate Doom oracle

Reviewed base: `804ddb9ae855b65aeec922cd5f531c672b9b2c5f`
Builder head: `ac9d51be7ec28162920212898ffec34b7315c913`
Candidate commit: SELF
Branch: `phase/p01-native-oracle`
Independent review task: DOOM-P1-090 — PENDING

## Review boundary

This packet is assembled by DOOM-P1-085 for independent Sol review. It is not
an independent verdict and does not mark DOOM-P1-090 complete. The reviewer is
read-only and must not repair source, evidence, task state, or remotes while
assigning PASS, PASS_WITH_RECORDED_LIMITATIONS, REPAIR_REQUIRED, or
ARCHITECTURE_BLOCKED.

## Inspect first

1. `docs/phases/P01/PHASE_RESULT.md`
2. `docs/reports/NATIVE_ORACLE_BASELINE.md`
3. `evidence/manifests/P01/native-oracle-phase-manifest.json`
4. `docs/UPSTREAM_DELTA.md`
5. `docs/licenses/THIRD_PARTY_INVENTORY.md`
6. `evidence/task-runs/P01-DOOM-P1-070/`
7. `evidence/task-runs/P01-DOOM-P1-080/oracle-run-set/`

## Builder commit sequence

| Task | Commit |
|---|---|
| DOOM-P1-000 | `840fac0287f89810d346b72ac5977221fab97b57` |
| DOOM-P1-010 | `a70068ffc8aac5a93ffe281461f2967bc7ff71d2` |
| DOOM-P1-020 | `2376b4341d67e872222f7edc56dbcef6756bff37` |
| DOOM-P1-030 | `44cc36377e0db83709428cc8ec6f9c28d783fdb4` |
| DOOM-P1-040 | `df474c7270ed193f3062e81f3febff2794e6d292` |
| DOOM-P1-050 | `591a89eed883abc61ce32fac47b22503fea8091f` |
| DOOM-P1-060 | `b06baf72a78539e5ebd130aba9cee0f159ca2f84` |
| DOOM-P1-070 | `f888f68ea721e7b01fb54946a1bc723b3248b608` |
| DOOM-P1-080 | `ac9d51be7ec28162920212898ffec34b7315c913` |
| DOOM-P1-085 | `SELF` |

## Independent exact verification

    python tools/verify-p1-gate.py
    python tools/taskctl.py validate
    git status --short
    git remote -v

The first command must print `SFHS_DOOM_P1_NATIVE_ORACLE_GATE=PASS`; after the
P1-085 containing commit, status must be empty and only the official `upstream`
remote may exist.

## Required reviewer questions

- Do source, upstream, toolchain, open-data, executable, demo, fixture, state,
  and framebuffer identities recompute from the bound files?
- Does every P1 builder task have exactly one local commit and a PASS result?
- Is `SFHS_ORACLE_TEST` default OFF, absent from ordinary binaries, and inert in
  the separate OFF runtime result?
- Are Oracle digest fields free of pointers, host timing, paths, IDs,
  presentation-only state, and uninitialized bytes?
- Are fixture licensing/provenance boundaries explicit and limited to
  project-created fixture data?
- Are all claims bounded to the actually observed WSL native environment?
- Is DOOM-P1-090 still pending with no builder self-approval?

## Recorded limitations

No WebAssembly, browser, physical-device, commercial-data, universal mod/demo,
performance, packaging, or release claim is supported by P01. The tic-1 frame
is the initialized logical buffer before the first gameplay draw because the
upstream loop executes tic 1 before entering its render loop. Real-tic
throughput is excluded from deterministic comparison.
