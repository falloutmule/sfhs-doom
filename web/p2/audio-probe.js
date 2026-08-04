/*
 * P2 audio probe contract: the live implementation is installed by post.js
 * after SDL2 creates its existing WebAudio ScriptProcessorNode. This file is
 * intentionally data-free and documents the observation boundary for tests.
 */
(function () {
  'use strict';
  window.SFHS_AUDIO_PROBE_CONTRACT = Object.freeze({
    source: 'existing SDL2 WebAudio ScriptProcessorNode',
    requiresUserGesture: true,
    observesEnginePcm: true,
    syntheticAudio: false,
  });
}());
