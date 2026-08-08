(() => {
  'use strict';

  // This probe is appended only to the disposable V8 resize-probe artifact.
  // It observes capture-phase Pointer Events and existing controller snapshots.
  const panel = document.createElement('pre');
  panel.id = 'sfhs-v8-resize-probe';
  panel.setAttribute('aria-label', 'V8 passive resize probe');
  panel.style.cssText = [
    'position:fixed', 'z-index:999', 'left:8px',
    'top:calc(env(safe-area-inset-top) + 88px)',
    'max-width:calc(100vw - 16px)', 'max-height:132px', 'overflow:hidden',
    'margin:0', 'padding:5px 6px', 'pointer-events:none',
    'background:rgb(5 12 18 / .88)', 'border:1px solid #e4c17c',
    'border-radius:3px', 'color:#fff0ca', 'font:9px/1.18 ui-monospace,Consolas,monospace',
    'white-space:pre-wrap'
  ].join(';');
  document.body.append(panel);

  const state = { down: null, moves: 0, lastMove: null, terminal: null, before: null, during: null };
  const round = value => typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
  const rect = element => {
    if (!(element instanceof Element)) return null;
    const value = element.getBoundingClientRect();
    return { x: round(value.x), y: round(value.y), width: round(value.width), height: round(value.height) };
  };
  const name = element => {
    if (!(element instanceof Element)) return null;
    const id = element.id ? `#${element.id}` : '';
    const control = element.closest('[data-sfhs-control-id]')?.getAttribute('data-sfhs-control-id');
    const handle = element.closest('[data-sfhs-resize-handle]') !== null;
    return `${element.tagName.toLowerCase()}${id}${control ? `[control=${control}]` : ''}${handle ? '[resize]' : ''}`;
  };
  const path = event => event.composedPath().slice(0, 6).map(value => value instanceof Element ? name(value) : String(value?.constructor?.name ?? value));
  const style = element => {
    if (!(element instanceof Element)) return null;
    const value = getComputedStyle(element);
    return { pointerEvents: value.pointerEvents, zIndex: value.zIndex, position: value.position, transform: value.transform, overflow: value.overflow, visibility: value.visibility, opacity: value.opacity };
  };
  const nearest = (element, selector) => element instanceof Element ? element.closest(selector) : null;
  const pointHandle = (x, y) => [...document.querySelectorAll('[data-sfhs-resize-handle]')].find(element => {
    const value = element.getBoundingClientRect();
    return x >= value.left && x <= value.right && y >= value.top && y <= value.bottom;
  }) ?? null;
  const snapshot = control => {
    const bridge = window.SFHSDoomMobileControls;
    const controller = bridge?.controller;
    const read = typeof controller?.read === 'function' ? controller.read() : null;
    const profile = typeof controller?.exportProfile === 'function' ? controller.exportProfile() : null;
    return {
      lifecycle: read?.lifecycle ?? null,
      route: read?.route ?? null,
      activePointers: read?.activePointers ?? [],
      editKind: 'NOT EXPOSED',
      geometry: control && profile ? profile.layouts?.[read?.orientation]?.[control] ?? null : null
    };
  };
  const render = () => {
    const value = state.down;
    if (value === null) {
      panel.textContent = 'V8 RESIZE PROBE — passive\nOpen Edit controls, then touch a visible resize grip.';
      return;
    }
    const owner = value.package.activePointers.map(entry => `${entry.controlId}:${entry.identifier}`).join(',') || 'none';
    panel.textContent = [
      'V8 RESIZE PROBE — passive capture observer',
      `DOWN id=${value.pointerId} type=${value.pointerType} trusted=${value.trusted} at ${value.clientX},${value.clientY}`,
      `target=${value.target} current=${value.currentTarget} hit=${value.hit} targetHandle=${value.targetHandle} hitHandle=${value.hitHandle}`,
      `control=${value.control ?? 'none'} owner=${owner} editKind=${value.package.editKind}`,
      `handle=${JSON.stringify(value.handleRect)} parent=${JSON.stringify(value.parentRect)}`,
      `hitStyle=${JSON.stringify(value.hitStyle)} handleStyle=${JSON.stringify(value.handleStyle)}`,
      `MOVE received=${state.moves > 0 ? 'YES' : 'NO'} count=${state.moves} last=${state.lastMove ? `${state.lastMove.clientX},${state.lastMove.clientY}` : '-'}`,
      `terminal=${state.terminal ?? '-'} before=${JSON.stringify(state.before)} during=${JSON.stringify(state.during)}`,
      `path=${value.path.join(' > ')}`
    ].join('\n');
  };
  const observeDown = event => {
    const controller = window.SFHSDoomMobileControls?.controller;
    if (controller?.read?.().lifecycle !== 'editing') return;
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const targetControl = nearest(event.target, '[data-sfhs-control-id]');
    const hitControl = nearest(hit, '[data-sfhs-control-id]');
    const control = targetControl?.getAttribute('data-sfhs-control-id') ?? hitControl?.getAttribute('data-sfhs-control-id') ?? null;
    const targetHandle = nearest(event.target, '[data-sfhs-resize-handle]');
    const hitHandle = nearest(hit, '[data-sfhs-resize-handle]');
    const handle = targetHandle ?? hitHandle ?? pointHandle(event.clientX, event.clientY) ?? targetControl?.querySelector('[data-sfhs-resize-handle]') ?? hitControl?.querySelector('[data-sfhs-resize-handle]') ?? null;
    const packageState = snapshot(control);
    state.down = {
      pointerId: event.pointerId, pointerType: event.pointerType, trusted: event.isTrusted,
      clientX: round(event.clientX), clientY: round(event.clientY),
      target: name(event.target), currentTarget: event.currentTarget === document ? 'document(capture)' : name(event.currentTarget), hit: name(hit), targetHandle: targetHandle !== null,
      hitHandle: hitHandle !== null, control, path: path(event),
      handleRect: rect(handle), parentRect: rect(handle?.closest('[data-sfhs-control-id]') ?? targetControl ?? hitControl),
      hitStyle: style(hit), handleStyle: style(handle), package: packageState
    };
    state.moves = 0; state.lastMove = null; state.terminal = null; state.before = packageState.geometry; state.during = packageState.geometry;
    render();
    // Capture-phase observation precedes the package's normal pointerdown
    // listener. Refresh after propagation so the displayed owner reflects
    // the real package result without invoking any package behavior.
    queueMicrotask(() => {
      if (state.down === null || state.down.pointerId !== event.pointerId) return;
      state.down.package = snapshot(control);
      state.during = state.down.package.geometry;
      render();
    });
  };
  const observeMove = event => {
    if (state.down === null || event.pointerId !== state.down.pointerId) return;
    state.moves += 1;
    const control = state.down.control;
    state.lastMove = { clientX: round(event.clientX), clientY: round(event.clientY), target: name(event.target), path: path(event) };
    state.during = snapshot(control).geometry;
    render();
  };
  const observeTerminal = event => {
    if (state.down === null || event.pointerId !== state.down.pointerId) return;
    state.terminal = event.type;
    state.during = snapshot(state.down.control).geometry;
    render();
  };
  document.addEventListener('pointerdown', observeDown, { capture: true, passive: true });
  document.addEventListener('pointermove', observeMove, { capture: true, passive: true });
  document.addEventListener('pointerup', observeTerminal, { capture: true, passive: true });
  document.addEventListener('pointercancel', observeTerminal, { capture: true, passive: true });
  document.addEventListener('lostpointercapture', observeTerminal, { capture: true, passive: true });
  render();
})();
