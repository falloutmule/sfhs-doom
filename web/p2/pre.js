(function () {
  'use strict';
  const allowed = new URL('./', window.location.href).origin;
  window.SFHS_P2_MODULE = {
    canvas: document.getElementById('canvas'),
    locateFile: (name) => new URL(name, window.location.href).toString(),
    print: (text) => console.log(String(text)),
    printErr: (text) => console.error(String(text)),
    onRuntimeInitialized: () => document.body.dataset.sfhsP2Runtime = 'ready',
    sfhsAllowedOrigin: allowed,
  };
}());
