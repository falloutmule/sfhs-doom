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
  if (new URLSearchParams(window.location.search).get('input') !== '1') {
    const pauseWhenReady = window.setInterval(() => {
      if (document.body.dataset.sfhsP2Runtime === 'ready' && window.Module && typeof window.Module.pauseMainLoop === 'function') {
        window.Module.pauseMainLoop();
        window.clearInterval(pauseWhenReady);
        document.body.dataset.sfhsP2Loop = 'paused-after-proof';
      }
    }, 1000);
  }
}());
