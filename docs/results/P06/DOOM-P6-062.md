# TASK RESULT

**Task:** DOOM-P6-062 - Center landscape presentation and expose adjustable controls
**Status:** PASS_WITH_PHYSICAL_ACCEPTANCE_PENDING
**Base:** `b3fd3eae5b110935f221b8ad40f4ff7c99896168`
**Result commit:** `SELF`
**Branch:** `feature/p6-v14-centered-landscape-controls`

## Result

V14 centers the complete landscape Doom presentation and authentic HUD on the
full safe viewport while moving the minimap/editor dock to the left and leaving
the editable controls exposed on the right. Landscape drag/resize, Save,
Cancel, persistence, and rotation isolation pass without changing portrait or
the shared package.

```text
artifact: dist/sfhs-doom-android-sfhs-controls-v14.html
bytes:    48352772
sha256:   d3c72c6cd7fd26e96be2e4db324a03151194deea478b28776f486896519e2905
oracle:   test-results/P06/P6-062/sfhs-doom-v14-oracle.html
bytes:    48378014
sha256:   de3368a193c1aa7fb8079579cac673d985f6e3a4ce9c3e7aff8fb9612928fa61
```

V8 through V13 retain their exact protected sizes and hashes.

## Exact verification

- Product and oracle `tools/build-single-file.sh` builds: PASS.
- `python tools/validate-p6-mobile.py ...v14.html`: PASS, 48,352,772 bytes.
- V14 focused Playwright: 4/4 passed.
- Protected V13/V12 plus applicable shared controls/MOVE/Samsung LOOK: 25/25.
- Applicable Python package/control/audio/native-demo/Wasm contracts: 50/50.
- Chromium loopback audio and phase 1/2 boot: 3/3 passed with documented
  Windows Python path; Chromium direct-file trusted audio/menu: PASS.
- Fresh native Debug configure/build with `ENABLE_SDL2_NET=OFF` and
  `SFHS_MOBILE_DETACHED_HUD=OFF`: PASS; CTest has no registered tests;
  executable reports Chocolate Doom 3.1.1.
- `git diff --check`, exact candidate identity, offline/static packaging,
  external-resource audit, and protected hashes: PASS.

## Geometry and editor proof

- 800×360 auto: game region 800×328; canvas 524.800×328; canvas center error
  0.00003 px horizontal/0 px vertical; HUD center error 0 px.
- 915×412 compatibility: centered full-frame coverage passes.
- Native world remains 320×200, screenblocks 11, internal status inactive;
  detached HUD remains 320×32.
- Editor/deck overlap at 800×360: 0 px²; every editable control/editor overlap:
  0 px².
- MOVE drag and resize plus LOOK resize pass. Save changes only landscape,
  rotation restores it, Cancel rolls back, and portrait profile is unchanged.
- 400×844 portrait remains 400×300; V13 LOOK tap-to-FIRE still changes real
  ammo and releases all input.

## Classified failures

The first portrait regression tap ran before the established deterministic
start state; adding the same 2.5-second readiness wait used by V13 fixed it.
A broad legacy run initially could not spawn its Python loopback server inside
the sandbox; the documented Windows Python retry passed all three Chromium
audio/boot tests. Firefox is not installed, and the old Phase-3 ArrowUp
movement oracle remains stale. These are recorded limitations, not V14 gates.

## Evidence

- `test-results/P06/P6-062/800x360-auto-proof.json`
- `test-results/P06/P6-062/915x412-compatibility-proof.json`
- `test-results/P06/P6-062/landscape-editor-proof.json`
- `test-results/P06/P6-062/screenshots/`
- `evidence/manifests/P06/sfhs-doom-android-sfhs-controls-v14.json`

## Limitation and next action

V14 has not been operated on Samsung Chrome and no remote publication was
authorized for this task. After explicit authorization, publish exact V14 and
physically verify landscape centering, control drag/resize Save/Cancel,
portrait rotation, LOOK tap/drag, and speaker audio.
