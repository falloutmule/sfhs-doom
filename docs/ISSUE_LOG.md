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
| P1-ENV-001 | open | medium | 2026-08-03 P1-000 | The default Ubuntu 24.04.4 WSL2 distribution is available, with GCC/Python present but CMake, Ninja, pkg-config, SDL2 development packages, SDL2_mixer, and Xvfb absent from the initial inventory. | P1-000 read-only host inventory; P1-010 owns package installation and verification. | Install only authorized missing WSL packages or block if package authority/credentials are unavailable. |
| P1-STATE-001 | resolved | high | 2026-08-03 P1-000 | tools/taskctl.py hard-coded docs/tasks/P00 and docs/results/P00, so exact taskctl validation initially rejected all correctly rooted P1 cards/results. | docs/results/P01/DOOM-P1-000.md; tools/taskctl.py; tests/test_taskctl.py. | User authorized a one-time P1-000 repair; phase-aware unique-card and matching-result resolution now validates mixed P00/P01 state. |
| P1-DOC-001 | resolved | high | 2026-08-03 P1-000 | The required no-argument tools/validate_project_docs.py command initially exited with an argparse error, while its explicit phase and gate-card rules remained hard-coded to P00. | docs/results/P01/DOOM-P1-000.md; tools/validate_project_docs.py; tests/test_project_docs.py. | User authorized a second narrow P1-000 repair; no-argument mixed-phase validation and conventional P## discovery now pass without weakening P00 checks. |
