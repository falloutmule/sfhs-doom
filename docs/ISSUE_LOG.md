# Issue Log

**Document status:** P01 native-oracle issue register
**Date:** 2026-08-03

No product issue has yet been observed. This statement is not a build, runtime, compatibility, or acceptance result.

## Issue fields

Every issue entry must include:

| Field | Meaning |
|---|---|
| ID | Stable issue identifier |
| Status | Open, blocked, resolved, deferred, or rejected |
| Severity | Impact classification |
| Discovered | Date and task/evidence context |
| Environment | Relevant source, toolchain, browser, device, or artifact |
| Observed behavior | Exact factual observation |
| Expected behavior | Contract or acceptance requirement |
| Evidence | Repository-relative logs, screenshots, hashes, or commands |
| Owner | Responsible task or reviewer |
| Disposition | Decision and follow-up |

## Entries

| ID | Status | Severity | Discovered | Observed behavior | Evidence | Disposition |
|---|---|---|---|---|---|---|
| None recorded | N/A | N/A | 2026-08-02 P00-020 | No product issue has yet been observed. | Governance-only repository bootstrap; no runtime was executed. | Keep open for later evidence; do not infer PASS. |
| P1-ENV-001 | resolved | medium | 2026-08-03 P1-000 | The default Ubuntu 24.04.4 WSL2 distribution was available, with GCC/Python present but CMake, Ninja, pkg-config, SDL2 development packages, SDL2_mixer, and Xvfb absent from the initial inventory. | `docs/results/P01/DOOM-P1-010.md`; `evidence/logs/P01/P1-010/`. | The authorized packages were installed only inside the existing WSL distribution; the no-install doctor and toolchain tests pass. |
| P1-STATE-001 | resolved | high | 2026-08-03 P1-000 | tools/taskctl.py hard-coded docs/tasks/P00 and docs/results/P00, so exact taskctl validation initially rejected all correctly rooted P1 cards/results. | docs/results/P01/DOOM-P1-000.md; tools/taskctl.py; tests/test_taskctl.py. | User authorized a one-time P1-000 repair; phase-aware unique-card and matching-result resolution now validates mixed P00/P01 state. |
| P1-DOC-001 | resolved | high | 2026-08-03 P1-000 | The required no-argument tools/validate_project_docs.py command initially exited with an argparse error, while its explicit phase and gate-card rules remained hard-coded to P00. | docs/results/P01/DOOM-P1-000.md; tools/validate_project_docs.py; tests/test_project_docs.py. | User authorized a second narrow P1-000 repair; no-argument mixed-phase validation and conventional P## discovery now pass without weakening P00 checks. |
| P1-DEMO-001 | resolved | medium | 2026-08-03 P1-070 | Normal playback completed but the process waited indefinitely for an ENDOOM keypress, causing the first harness watchdog to classify a false playback stall. | `docs/reports/NATIVE_DEMO_BASELINE.md`; `docs/results/P01/DOOM-P1-070.md`. | Isolated test extra-config files set `show_endoom 0`; all 14 normal/strict and 7 timedemo cases pass without engine changes. |
| P1-ORACLE-001 | resolved | medium | 2026-08-03 P1-080 | Upstream executes the initial timedemo tic before entering its render loop, so no rendered tic-1 gameplay frame naturally exists. | `docs/reports/NATIVE_ORACLE_INSTRUMENTATION.md`; `src/doom/d_main.c`. | The observer reads the initialized authoritative logical buffer after upstream's first-tic call without inserting a draw. The limitation is explicit; later frames are post-draw. |
| P2-000-REVIEW-001 | resolved | low | 2026-08-04 P2-000 | The accepted P1 independent review was not yet represented in repository task state at the P2 branch boundary. | `docs/reviews/P01/DOOM-P1-090.md`; `docs/results/P01/DOOM-P1-090.md`. | Exact review bytes were decoded and SHA-256 verified; P1-090 is recorded PASS_WITH_RECORDED_LIMITATIONS without rewriting P1 evidence. |
