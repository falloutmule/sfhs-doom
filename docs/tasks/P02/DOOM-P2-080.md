## DOOM-P2-080 — Establish browser engine audio path

**Intelligence:** LUNA-H  
**Phase:** P02  
**Depends on:** DOOM-P2-070  
**Branch:** phase/p02-wasm-feasibility  
**Allowed files/directories:** .agent/task-state.json; browser-tests/tests/audio.spec.mjs; browser-tests/support/**; web/p2/audio-probe.js; web/p2/shell.html; web/p2/pre.js; web/p2/post.js; src/sfhs_wasm/**; docs/COMPATIBILITY_MATRIX.md; docs/DECISIONS.md; docs/UPSTREAM_DELTA.md; docs/reports/WASM_AUDIO_FEASIBILITY.md; docs/results/P02/DOOM-P2-080.md; evidence/logs/P02/P2-080/**; evidence/task-runs/P02-DOOM-P2-080/**; tests/test_audio_probe_contract.py; src/i_sound.c; src/i_sdlsound.c; src/i_sdlmusic.c  
**Parallel:** No  
**Remote authorization:** NONE

### Goal

Establish a genuine user-gesture-gated browser engine audio path without synthetic samples or gameplay/content edits.

### Constraints

Never generate or write substitute audio samples, resume before Start, add synthetic sources, or edit gameplay/content; one existing audio platform file is conditional maximum.

### Work

Observe pre-start AudioContext state; Start Doom from the button; verify running context; trigger real engine SFX with fire; capture nonzero engine PCM in Chromium and callback/context activity in Firefox; characterize music limits. Any existing audio platform edit is conditional, maximum one file, and requires native controls.

### Exact verification

    python -m unittest tests.test_audio_probe_contract
    cd browser-tests && npx playwright test tests/audio.spec.mjs --workers=1
    cd browser-tests && npx playwright test tests/boot.spec.mjs tests/input.spec.mjs --workers=1
    python tools/taskctl.py validate

### Acceptance

Chromium gesture audio and nonzero engine SFX pass; Firefox callback path passes; no fake shell audio; music limitations are explicit; native behavior remains green.

### Stop/block conditions

Stop for fake/synthetic audio evidence, absent engine callback activity, native regression, or a required gameplay/content redesign.

### Evidence output

`docs/reports/WASM_AUDIO_FEASIBILITY.md`; `evidence/logs/P02/P2-080/**`; `evidence/task-runs/P02-DOOM-P2-080/**`.

### Commit

DOOM-P2-080 establish browser engine audio path
