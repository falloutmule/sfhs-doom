# SFHS Doom — Frozen Phase P02 Plan

**Phase:** P02 — Multi-file WebAssembly feasibility and native/Wasm parity  
**Status:** FROZEN FOR EXECUTION  
**Planning authority:** `docs/PROJECT_SPEC.md`, root `AGENTS.md`, the P2 continuous Luna packet, then the individual P2 task cards  
**Accepted P1 HEAD:** `0c8e1288a23e7306fa5760c1aadbf54de8d0b85c`  
**Accepted upstream:** Chocolate Doom `chocolate-doom-3.1.1` at `410d96855b5df5410ff591a90efeafa889119224`  
**Phase branch:** `phase/p02-wasm-feasibility`  
**Remote boundary:** Local-only. No origin creation, push, PR, merge, tag, release, publication, or deployment.  
**Product boundary:** Multi-file browser proof only; strict single-file packaging begins in P3.

## Goal

Compile the accepted Chocolate Doom source and test oracle to multi-file WebAssembly, boot pinned open Freedoom through local Chromium and Firefox lanes, prove keyboard and user-gesture engine audio behavior, and compare selected browser state and raw logical framebuffer checkpoints with the accepted native P1 baseline.

## Scope and non-goals

P2 includes pinned Emscripten 6.0.5, SDL2/SDL2_mixer ports, Playwright 1.61.1 with Chromium and Firefox, loopback serving, a bounded browser/Wasm adapter, multi-file artifacts, browser boot/input/audio, and native/Wasm parity evidence.

P2 excludes commercial Doom data, mobile, persistence, local IWAD import, broad mod compatibility, networking, threads, WebGPU, service workers, multiplayer, strict single-file packaging, release publication, and completion of DOOM-P2-090.

## Task graph

| Task | Dependency | Completion condition |
|---|---|---|
| DOOM-P2-000 | P1-085 and accepted P1 review | P2 governance installed; P1-090 review recorded; branch created |
| DOOM-P2-010 | P2-000 | Emscripten/browser dependencies pinned, installed, and idempotent |
| DOOM-P2-020 | P2-010 | no-install doctor and SDL/browser smoke pass |
| DOOM-P2-030 | P2-020 | pinned upstream Emscripten configure boundary passes twice |
| DOOM-P2-040 | P2-030 | first multi-file link probe is captured and classified |
| DOOM-P2-050 | P2-040 | bounded adapter and three reproducible multi-file variants pass |
| DOOM-P2-060 | P2-050 | real Phase 1/2 gameplay boots in required browsers |
| DOOM-P2-070 | P2-060 | real browser keyboard semantics pass |
| DOOM-P2-080 | P2-070 | user-gesture engine audio path is evidenced |
| DOOM-P2-085 | P2-080 | native/Chromium/Firefox Oracle state and frame parity passes |
| DOOM-P2-088 | P2-085 | complete P2 feasibility gate passes |
| DOOM-P2-090 | P2-088 | independent Sol review only; not a builder task |

## Evidence and result locations

Task results are under `docs/results/P02/`. Phase evidence is under `evidence/` with P2 task-specific paths. Ignored toolchains, browser caches, builds, and Playwright outputs remain outside the product and are not distributed.

## Current state

P2 begins from the clean accepted P1 HEAD `0c8e1288a23e7306fa5760c1aadbf54de8d0b85c` with the official `upstream` remote only. The independent P1-090 review is recorded before toolchain or browser work. No P2 runtime artifact exists yet.

## Exact verification

The final phase command is `python tools/verify-p2-gate.py` and it must print `SFHS_DOOM_P2_WASM_FEASIBILITY_GATE=PASS`. The final audit also captures branch, P1-to-HEAD commit history, changed paths, clean status, task/document validators, browser tests, and remotes.

## Blockers and stop conditions

Stop with evidence for starting-state drift, unavailable pinned dependencies, unusable authorized WSL, required gameplay/renderer redesign, adapter-budget overflow, unresolved Chromium parity divergence, unresolved required Firefox divergence, commercial data, remote/destructive action, parent-workspace mutation, or any claim broader than the evidence.

## Exit gate

P2 builder PASS requires exactly eleven local builder commits through DOOM-P2-088, pinned tool identities, reproducible multi-file artifacts, required Chromium/Firefox boot/input/audio/parity evidence, exact accepted state/frame equality, no external runtime requests, no commercial data, a clean worktree, official upstream-only remotes, and DOOM-P2-090 pending and ready.
