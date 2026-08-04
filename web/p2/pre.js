(function () {
  'use strict';
  const phase = window.SFHS_P2_PHASE || 'phase2';
  const wad = phase === 'phase1' ? 'freedoom1.wad' : 'freedoom2.wad';
  const wadUrl = `/p2-data/${wad}`;
  const query = new URLSearchParams(window.location.search);
  const menuOnly = query.get('menu') === '1';
  const audioMode = query.get('audio') === '1';
  const allowed = new URL('./', window.location.href).origin;
  window.SFHS_P2_MODULE = {
    canvas: document.getElementById('canvas'),
    arguments: menuOnly
      ? ['-iwad', wad, '-window', '-width', '640', '-height', '400', '-nosound', '-nomusic']
      : ['-iwad', wad, '-warp', '1', '1', '-skill', '3', '-window', '-width', '640', '-height', '400', ...(audioMode ? ['-nomusic'] : ['-nosound', '-nomusic'])],
    locateFile: (name) => new URL(`/engine/src/${name}`, window.location.origin).toString(),
    noInitialRun: audioMode,
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
