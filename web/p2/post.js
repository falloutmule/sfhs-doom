(function () {
  'use strict';
  window.SFHS_P2_RUNTIME = Object.freeze({
    mode: 'loopback-multi-file',
    data: 'separate-open-freedoom-wad',
    singleFile: false,
    externalRequests: false,
  });
  const markCanvas = () => {
    const canvas = document.getElementById('canvas');
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      document.body.dataset.sfhsP2Canvas = 'ready';
    }
  };
  window.setInterval(markCanvas, 100);
  markCanvas();
  const query = new URLSearchParams(window.location.search);
  const audioMode = query.get('audio') === '1';
  const audioState = {
    mainStarted: false,
    startClicks: 0,
    preClickContextExists: false,
    preClickCallbackCount: 0,
    contextStateBeforeStart: null,
    contextStateAfterStart: null,
    callbacks: 0,
    nonzeroPcmCallbacks: 0,
    maxAbsPcm: 0,
    started: false,
    resumeError: null,
    probeReady: false,
    probeAttached: false,
    mainScheduled: false,
    probeError: null,
  };

  function installAudioProbe() {
    const sdl = window.Module && window.Module.SDL2;
    const context = sdl && sdl.audioContext;
    const node = sdl && sdl.audio && sdl.audio.scriptProcessorNode;
    if (!context || !node || typeof node.onaudioprocess !== 'function') {
      audioState.probeReady = true;
      window.SFHS_AUDIO_PROBE = audioState;
      document.body.dataset.sfhsP2Audio = 'ready';
      return true;
    }
    if (audioState.probeAttached) return true;
    audioState.contextStateBeforeStart = context.state;
    const original = node.onaudioprocess;
    node.onaudioprocess = function (event) {
      original.call(this, event);
      audioState.callbacks += 1;
      let maxAbs = 0;
      for (let channel = 0; channel < event.outputBuffer.numberOfChannels; channel += 1) {
        const data = event.outputBuffer.getChannelData(channel);
        for (let index = 0; index < data.length; index += 1) maxAbs = Math.max(maxAbs, Math.abs(data[index]));
      }
      audioState.maxAbsPcm = Math.max(audioState.maxAbsPcm, maxAbs);
      if (maxAbs > 0.0001) audioState.nonzeroPcmCallbacks += 1;
    };
    audioState.probeReady = true;
    audioState.probeAttached = true;
    window.SFHS_AUDIO_PROBE = audioState;
    document.body.dataset.sfhsP2Audio = 'ready';
    return true;
  }

  if (audioMode) {
    const start = document.getElementById('start-doom');
    const installWhenReady = window.setInterval(() => {
      if (document.body.dataset.sfhsP2Runtime !== 'ready') return;
      if (!installAudioProbe()) return;
      window.clearInterval(installWhenReady);
      start.hidden = false;
      start.dataset.sfhsP2AudioListener = 'ready';
      const startAudio = () => {
        if (audioState.started || audioState.mainScheduled) return;
        audioState.startClicks += 1;
        if (!window.Module || typeof window.Module.callMain !== 'function') {
          audioState.probeError = 'SFHS_P2_MAIN_ENTRYPOINT_UNAVAILABLE';
          document.body.dataset.sfhsP2Audio = 'failed';
          return;
        }
        audioState.mainScheduled = true;
        start.disabled = true;
        const mainRun = window.Module.callMain(window.Module.arguments);
        audioState.mainStarted = true;
        audioState.started = true;
        const attachProbe = window.setInterval(() => {
          if (installAudioProbe() && audioState.probeAttached) window.clearInterval(attachProbe);
        }, 25);
        const context = window.Module.SDL2 && window.Module.SDL2.audioContext;
        document.body.dataset.sfhsP2Audio = 'started';
        document.getElementById('canvas').focus();
        if (!context) {
          audioState.probeError = 'SFHS_AUDIO_CONTEXT_NOT_CREATED';
          return;
        }
        try {
          context.resume().then(() => {
            audioState.contextStateAfterStart = context.state;
          }).catch((error) => {
            audioState.resumeError = String(error);
            audioState.contextStateAfterStart = context.state;
          });
          if (mainRun && typeof mainRun.then === 'function') mainRun.catch((error) => { audioState.probeError = String(error); });
        } catch (error) {
          audioState.resumeError = String(error);
          audioState.contextStateAfterStart = context.state;
        }
      };
      start.onclick = startAudio;
    }, 50);
  } else {
    let mainStarted = false;
    const startMainWhenReady = window.setInterval(() => {
      if (mainStarted || document.body.dataset.sfhsP2Runtime !== 'ready' || document.body.dataset.sfhsP2Data !== 'loaded') return;
      if (!window.Module || typeof window.Module.callMain !== 'function') return;
      mainStarted = true;
      if (query.get('oracle') === '1' && window.Module.ENV) window.Module.ENV.SFHS_ORACLE_OUTPUT = '/oracle-output';
      document.body.dataset.sfhsP2Main = 'started';
      const mainRun = window.Module.callMain(window.Module.arguments);
      if (mainRun && typeof mainRun.then === 'function') {
        mainRun.catch((error) => { document.body.dataset.sfhsP2MainError = String(error); });
      }
      window.clearInterval(startMainWhenReady);
    }, 50);
    if (query.get('input') !== '1') {
      const pauseWhenReady = window.setInterval(() => {
        if (document.body.dataset.sfhsP2Main === 'started' && window.Module && typeof window.Module.pauseMainLoop === 'function') {
          window.Module.pauseMainLoop();
          window.clearInterval(pauseWhenReady);
          document.body.dataset.sfhsP2Loop = 'paused-after-proof';
        }
      }, 1000);
    }
  }
}());
