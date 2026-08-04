(function () {
  'use strict';
  const phase = window.SFHS_P2_PHASE || 'phase2';
  const wad = phase === 'phase1' ? 'freedoom1.wad' : 'freedoom2.wad';
  const wadUrl = `/p2-data/${wad}`;
  const query = new URLSearchParams(window.location.search);
  const menuOnly = query.get('menu') === '1';
  const audioMode = query.get('audio') === '1';
  const oracleMode = query.get('oracle') === '1';
  const dehMode = query.get('deh') === '1';
  const allowed = new URL('./', window.location.href).origin;
  const argumentsForMode = oracleMode
    ? ['-iwad', wad, '-timedemo', 'oracle-140.lmp', '-window', '-width', '640', '-height', '400', '-nosound', '-nomusic', '-config', 'oracle.cfg', '-extraconfig', 'extra.cfg', ...(dehMode ? ['-deh', 'oracle-effect.deh'] : [])]
    : menuOnly
      ? ['-iwad', wad, '-window', '-width', '640', '-height', '400', '-nosound', '-nomusic']
      : ['-iwad', wad, '-warp', '1', '1', '-skill', '3', '-window', '-width', '640', '-height', '400', ...(audioMode ? ['-nomusic'] : ['-nosound', '-nomusic'])];
  window.SFHS_P2_MODULE = {
    canvas: document.getElementById('canvas'),
    arguments: argumentsForMode,
    locateFile: (name) => new URL(`/engine/src/${name}`, window.location.origin).toString(),
    noInitialRun: audioMode,
    ENV: oracleMode ? { SFHS_ORACLE_OUTPUT: '/oracle-output' } : undefined,
    print: (text) => console.log(String(text)),
    printErr: (text) => console.error(String(text)),
    preRun: [function () {
      if (!window.FS || typeof window.FS.createPreloadedFile !== 'function') {
        throw new Error('SFHS_P2_PRELOAD_API_MISSING');
      }
      if (oracleMode) window.FS.mkdir('/oracle-output');
      const files = oracleMode
        ? [
            [wad, wadUrl],
            ['oracle-140.lmp', '/p2-data/oracle-140.lmp'],
            ['oracle.cfg', '/p2-data/oracle.cfg'],
            ['extra.cfg', '/p2-data/extra.cfg'],
            ...(dehMode ? [['oracle-effect.deh', '/p2-data/oracle-effect.deh']] : []),
          ]
        : [[wad, wadUrl]];
      let remaining = files.length;
      const loaded = () => {
        remaining -= 1;
        if (remaining === 0) document.body.dataset.sfhsP2Data = 'loaded';
      };
      for (const [name, url] of files) {
        window.FS.createPreloadedFile('/', name, url, true, false,
          loaded,
          () => { document.body.dataset.sfhsP2Data = 'failed'; });
      }
    }],
    onRuntimeInitialized: () => { document.body.dataset.sfhsP2Runtime = 'ready'; },
    sfhsAllowedOrigin: allowed,
  };
}());
