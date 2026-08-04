(function () {
  'use strict';
  const phase = window.SFHS_P2_PHASE || 'phase2';
  const wad = phase === 'phase1' ? 'freedoom1.wad' : 'freedoom2.wad';
  const wadUrl = `/p2-data/${wad}`;
  const allowed = new URL('./', window.location.href).origin;
  window.SFHS_P2_MODULE = {
    canvas: document.getElementById('canvas'),
    arguments: ['-iwad', wad, '-warp', '1', '1', '-skill', '3', '-window', '-width', '640', '-height', '400', '-nosound', '-nomusic'],
    locateFile: (name) => new URL(`/engine/src/${name}`, window.location.origin).toString(),
    print: (text) => console.log(String(text)),
    printErr: (text) => console.error(String(text)),
    preRun: [function () {
      if (!window.FS || typeof window.FS.createPreloadedFile !== 'function') {
        throw new Error('SFHS_P2_PRELOAD_API_MISSING');
      }
      window.FS.createPreloadedFile('/', wad, wadUrl, true, false,
        () => { document.body.dataset.sfhsP2Data = 'loaded'; },
        () => { document.body.dataset.sfhsP2Data = 'failed'; });
    }],
    onRuntimeInitialized: () => { document.body.dataset.sfhsP2Runtime = 'ready'; },
    sfhsAllowedOrigin: allowed,
  };
}());
