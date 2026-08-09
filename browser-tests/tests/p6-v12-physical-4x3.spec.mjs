import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { analyzePngCoverage, analyzeRgbaCoverage } from '../support/full-frame-coverage.mjs';

test.describe.configure({ mode: 'serial' });
test.setTimeout(120000);

const candidate = new URL('../../dist/sfhs-doom-android-sfhs-controls-v12.html', import.meta.url);
const failedV11 = new URL('../../dist/sfhs-doom-android-sfhs-controls-v11.html', import.meta.url);
const evidenceBase = resolve('..', 'test-results', 'P06', 'P6-060');
const evidenceRoot = resolve(evidenceBase, 'screenshots');

function watchPage(page) {
  const pageErrors = [];
  const consoleErrors = [];
  const externalRequests = [];
  const failedRequests = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('request', request => { if (/^https?:/i.test(request.url())) externalRequests.push(request.url()); });
  page.on('requestfailed', request => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ''}`));
  return { pageErrors, consoleErrors, externalRequests, failedRequests };
}

async function installLifecycleProbe(page, fullscreenMode = 'success') {
  await page.addInitScript(mode => {
    window.__sfhsTestHidden = false;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__sfhsTestHidden });
    window.__setSfhsTestHidden = value => { window.__sfhsTestHidden = Boolean(value); document.dispatchEvent(new Event('visibilitychange')); };
    window.__sfhsTrustedClick = false;
    window.__sfhsFullscreenCalls = [];
    document.addEventListener('click', event => {
      window.__sfhsTrustedClick = event.isTrusted;
      setTimeout(() => { window.__sfhsTrustedClick = false; }, 0);
    }, true);
    if (mode === 'unsupported') {
      Object.defineProperty(Element.prototype, 'requestFullscreen', { configurable: true, value: undefined });
      return;
    }
    Object.defineProperty(Element.prototype, 'requestFullscreen', { configurable: true, value: function requestFullscreen() {
      window.__sfhsFullscreenCalls.push({ id: this.id, trustedClick: window.__sfhsTrustedClick, mainStartedAtCall: Boolean(window.SFHS_P6_STATE?.mainStarted) });
      if (mode === 'reject') return Promise.reject(new Error('V12_TEST_FULLSCREEN_REJECTED'));
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => this });
      queueMicrotask(() => document.dispatchEvent(new Event('fullscreenchange')));
      return new Promise(() => {});
    }});
  }, fullscreenMode);
}

async function open(page, viewport, fullscreenMode = 'success', artifact = candidate) {
  test.skip(!existsSync(artifact), 'Requested artifact has not been built.');
  await installLifecycleProbe(page, fullscreenMode);
  await page.setViewportSize(viewport);
  await page.goto(artifact.href, { waitUntil: 'load', timeout: 60000 });
  await expect.poll(() => page.evaluate(() => Boolean(window.SFHSDoomMobileControls)), { timeout: 60000 }).toBeTruthy();
  await expect(page.locator('#sfhs-fullscreen-root')).toBeVisible();
}

async function start(page, renderer = 'auto') {
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-runtime', 'ready', { timeout: 60000 });
  await page.locator('#renderer-mode').selectOption(renderer);
  await page.getByRole('button', { name: 'Start Fullscreen' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-main', 'started', { timeout: 15000 });
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().game?.active), { timeout: 20000 }).toBe(1);
}

async function pointer(page, id, type, pointerId, x, y) {
  await page.locator(`[data-sfhs-control-id="${id}"]`).evaluate((element, value) => element.dispatchEvent(new PointerEvent(value.type, {
    bubbles: true, cancelable: true, pointerType: 'touch', pointerId: value.pointerId,
    button: 0, buttons: value.type === 'pointerup' || value.type === 'pointercancel' ? 0 : 1,
    pressure: value.type === 'pointerup' || value.type === 'pointercancel' ? 0 : 0.5,
    clientX: value.x, clientY: value.y, screenX: value.x, screenY: value.y,
  })), { type, pointerId, x, y });
}

async function pointerSelector(page, selector, type, pointerId, x, y) {
  await page.locator(selector).evaluate((element, value) => element.dispatchEvent(new PointerEvent(value.type, {
    bubbles: true, cancelable: true, pointerType: 'touch', pointerId: value.pointerId,
    button: 0, buttons: value.type === 'pointerup' || value.type === 'pointercancel' ? 0 : 1,
    pressure: value.type === 'pointerup' || value.type === 'pointercancel' ? 0 : 0.5,
    clientX: value.x, clientY: value.y, screenX: value.x, screenY: value.y,
  })), { type, pointerId, x, y });
}

function intersectionArea(a, b) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height;
}

async function regionBox(page, selector) {
  const box = await page.locator(selector).boundingBox();
  expect(box, `${selector} has geometry`).not.toBeNull();
  return box;
}

async function waitForFullFrame(page, timeout = 15000) {
  let coverage = null;
  await expect.poll(async () => {
    coverage = analyzePngCoverage(await page.locator('#canvas').screenshot());
    return coverage.pass;
  }, { timeout, intervals: [250, 500, 750] }).toBeTruthy();
  return coverage;
}

test.beforeAll(() => mkdirSync(evidenceRoot, { recursive: true }));

function syntheticFrame(width, height, occupiedHeight) {
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < occupiedHeight; y += 1) for (let x = 0; x < width; x += 1) {
    const at = (y * width + x) * 4;
    data[at] = 40 + (x % 97); data[at + 1] = 28 + (y % 83); data[at + 2] = 20; data[at + 3] = 255;
  }
  return { width, height, channels: 4, data };
}

test('coverage analyzer rejects the physical V11 black band and accepts a complete frame', () => {
  const failed = analyzeRgbaCoverage(syntheticFrame(576, 432, 286));
  const complete = analyzeRgbaCoverage(syntheticFrame(576, 432, 432));
  expect(failed.pass).toBeFalsy();
  expect(failed.verticalSpanRatio).toBeLessThan(.67);
  expect(failed.longestBlankRows.length).toBe(146);
  expect(complete.pass).toBeTruthy();
  expect(complete.verticalSpanRatio).toBe(1);
  writeFileSync(resolve(evidenceBase, 'synthetic-coverage-proof.json'), JSON.stringify({ failed, complete }, null, 2) + '\n');
});

test('records the V11 competing canvas owners and rejects its reproduced incomplete frame', async ({ page }) => {
  await page.addInitScript(() => {
    window.__sfhsCanvasAttributeMutations = [];
    new MutationObserver(records => {
      for (const record of records) if (record.target?.id === 'canvas') {
        window.__sfhsCanvasAttributeMutations.push({
          attribute: record.attributeName,
          width: record.target.getAttribute('width'),
          height: record.target.getAttribute('height'),
        });
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['width', 'height'] });
  });
  await open(page, { width: 400, height: 844 }, 'success', failedV11);
  const before = await page.evaluate(() => {
    const canvas = document.getElementById('canvas'), game = document.getElementById('game-region');
    const canvasRect = canvas.getBoundingClientRect(), gameRect = game.getBoundingClientRect(), css = getComputedStyle(canvas);
    return { attributes: [canvas.width, canvas.height], client: [canvas.clientWidth, canvas.clientHeight], canvasRect: [canvasRect.width, canvasRect.height], gameRect: [gameRect.width, gameRect.height], css: [css.width, css.height, css.transform] };
  });
  await start(page);
  await expect.poll(() => page.evaluate(() => window.Module._sfhs_mobile_present_debug_snapshot && window.Module.HEAP32[(window.Module._sfhs_mobile_present_debug_snapshot() >> 2) + 3]), { timeout: 10000 }).toBeGreaterThan(10);
  await page.waitForTimeout(2500);
  const after = await page.evaluate(() => {
    const canvas = document.getElementById('canvas'), game = document.getElementById('game-region');
    const canvasRect = canvas.getBoundingClientRect(), gameRect = game.getBoundingClientRect(), css = getComputedStyle(canvas);
    const pointer = window.Module._sfhs_mobile_present_debug_snapshot() >> 2, heap = window.Module.HEAP32;
    return {
      attributes: [canvas.width, canvas.height], client: [canvas.clientWidth, canvas.clientHeight],
      canvasRect: [canvasRect.width, canvasRect.height], gameRect: [gameRect.width, gameRect.height],
      css: [css.width, css.height, css.transform], restores: window.SFHS_P6_STATE.worldBackingRestores,
      mutations: window.__sfhsCanvasAttributeMutations,
      sdl: { outputWidth: heap[pointer + 9], outputHeight: heap[pointer + 10], presents: heap[pointer + 3] },
    };
  });
  const coverage = analyzePngCoverage(await page.locator('#canvas').screenshot());
  writeFileSync(resolve(evidenceBase, 'v11-presentation-conflict.json'), JSON.stringify({ before, after, coverage }, null, 2) + '\n');
  expect(after.restores).toBeGreaterThan(0);
  expect(after.css[2]).not.toBe('none');
  expect(coverage.pass).toBeFalsy();
});

for (const viewport of [
  { width: 360, height: 800, name: '360x800' },
  { width: 400, height: 844, name: '400x844' },
]) {
  test(`V12 ${viewport.name} portrait is aspect-correct and edge-to-edge before startup`, async ({ page }) => {
    await open(page, viewport);
    const root = await regionBox(page, '#sfhs-fullscreen-root');
    const game = await regionBox(page, '#game-region');
    const canvas = await regionBox(page, '#canvas');
    expect(root.x).toBeCloseTo(0, 0); expect(root.y).toBeCloseTo(0, 0);
    expect(game.x).toBeCloseTo(0, 0); expect(game.y).toBeCloseTo(0, 0);
    expect(game.width).toBeCloseTo(viewport.width, 0);
    expect(game.height).toBeCloseTo(viewport.width * 3 / 4, 0);
    expect(canvas).toEqual(expect.objectContaining({ x: game.x, y: game.y, width: 320, height: 200 }));
    expect(await page.locator('#canvas').evaluate(element => [element.width, element.height, getComputedStyle(element).borderWidth, getComputedStyle(element).transform])).toEqual([320, 200, '0px', 'none']);
    const hud = await regionBox(page, '#doom-status-canvas');
    expect(await page.locator('#doom-status-canvas').evaluate(element => [element.width, element.height])).toEqual([320, 32]);
    expect(hud.y + hud.height).toBeLessThanOrEqual(viewport.height + 1);
    expect(await page.evaluate(() => ({ scrollY, scrollHeight: document.documentElement.scrollHeight, innerHeight }))).toEqual(expect.objectContaining({ scrollY: 0, scrollHeight: viewport.height, innerHeight: viewport.height }));
    for (const selector of ['#minimap-region', '#control-deck', '#doom-status-region']) {
      const box = await regionBox(page, selector); expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
    }
    if (viewport.width === 400) await page.screenshot({ path: resolve(evidenceRoot, '400x844-before-start.png') });
    else {
      await start(page);
      await expect.poll(() => page.evaluate(() => { const at=window.Module._sfhs_mobile_present_debug_snapshot()>>2;return window.Module.HEAP32[at+3]; }), { timeout: 10000 }).toBeGreaterThan(10);
      await expect.poll(() => page.evaluate(() => window.SFHS_P6_STATE.hudDraws), { timeout: 10000 }).toBeGreaterThan(0);
      const stableCoverage = await waitForFullFrame(page);
      const activeCanvas = await regionBox(page, '#canvas');
      expect(activeCanvas).toEqual(expect.objectContaining({ x: 0, y: 0, width: 360, height: 270 }));
      const worldPng = await page.locator('#canvas').screenshot({ path: resolve(evidenceRoot, '360x270-world.png') });
      const coverage = analyzePngCoverage(worldPng);
      writeFileSync(resolve(evidenceBase, '360x270-coverage-proof.json'), JSON.stringify({ stableCoverage, coverage }, null, 2) + '\n');
      expect(coverage.pass).toBeTruthy();
      await page.screenshot({ path: resolve(evidenceRoot, '360x800-active-gameplay.png') });
    }
  });
}

test('V12 576px physical-like portrait fills the complete 576x432 world rectangle', async ({ page }) => {
  const hygiene = watchPage(page);
  await open(page, { width: 576, height: 1280 }, 'success');
  await start(page);
  await expect.poll(() => page.evaluate(() => window.SFHS_WASM_TEST.presentationSnapshot().sdl?.presents || 0), { timeout: 10000 }).toBeGreaterThan(10);
  const stableCoverage = await waitForFullFrame(page);
  const game = await regionBox(page, '#game-region'), canvas = await regionBox(page, '#canvas');
  for (const box of [game, canvas]) {
    expect(box.x).toBeCloseTo(0, 0); expect(box.y).toBeCloseTo(0, 0);
    expect(box.width).toBeCloseTo(576, 0); expect(box.height).toBeCloseTo(432, 0);
  }
  const presentation = await page.evaluate(() => window.SFHS_WASM_TEST.presentationSnapshot());
  expect(presentation.transform).not.toBe('none');
  expect(presentation.canvasAttributeWidth).toBe(presentation.sdl.outputWidth);
  expect(presentation.canvasAttributeHeight).toBe(presentation.sdl.outputHeight);
  const coverage = analyzePngCoverage(await page.locator('#canvas').screenshot());
  expect(coverage.verticalSpanRatio).toBeGreaterThanOrEqual(.92);
  expect(coverage.longestBlankRows.length).toBeLessThanOrEqual(Math.floor(432 * .12));
  expect(coverage.pass).toBeTruthy();
  expect(await page.evaluate(() => ({ scrollY, scrollHeight: document.documentElement.scrollHeight, innerHeight }))).toEqual({ scrollY: 0, scrollHeight: 1280, innerHeight: 1280 });
  for (const selector of ['#minimap-region','#control-deck','#doom-status-region']) {
    const box = await regionBox(page, selector); expect(box.y + box.height).toBeLessThanOrEqual(1281);
  }
  await page.screenshot({ path: resolve(evidenceRoot, '576x1280-active-gameplay.png') });
  writeFileSync(resolve(evidenceBase, '576x1280-coverage-proof.json'), JSON.stringify({ game, canvas, presentation, stableCoverage, coverage, hygiene }, null, 2) + '\n');
  expect(hygiene.pageErrors).toEqual([]); expect(hygiene.externalRequests).toEqual([]); expect(hygiene.failedRequests).toEqual([]);
});

test('V12 trusted fullscreen drives full-frame presentation and the unchanged native surfaces/editor', async ({ page }) => {
  const hygiene = watchPage(page);
  await open(page, { width: 400, height: 844 }, 'success');
  await start(page);
  await expect.poll(() => page.evaluate(() => window.SFHS_WASM_TEST.presentationSnapshot().sdl?.presents || 0), { timeout: 10000 }).toBeGreaterThan(10);
  const presentationAutomatic = await page.evaluate(() => window.SFHS_WASM_TEST.presentationSnapshot());
  expect(presentationAutomatic).toEqual(expect.objectContaining({
    version: 1, canvasClientWidth: 320, canvasClientHeight: 200,
    canvasRectWidth: 400, canvasRectHeight: 300,
    gameRegionWidth: 400, gameRegionHeight: 300,
  }));
  expect(presentationAutomatic.transform).not.toBe('none');
  expect(presentationAutomatic.canvasAttributeWidth).toBe(presentationAutomatic.sdl.outputWidth);
  expect(presentationAutomatic.canvasAttributeHeight).toBe(presentationAutomatic.sdl.outputHeight);
  await expect.poll(() => page.evaluate(() => window.Module?.SDL2?.audioContext?.state || null), { timeout: 15000 }).toBe('running');
  const audioState = await page.evaluate(() => window.Module.SDL2.audioContext.state);
  await expect.poll(() => page.evaluate(() => window.SFHS_WASM_TEST.fullscreenState().active), { timeout: 5000 }).toBeTruthy();
  const fs = await page.evaluate(() => ({ calls: window.__sfhsFullscreenCalls, state: window.SFHS_WASM_TEST.fullscreenState(), mainInvocations: window.SFHS_P6_STATE.mainInvocations }));
  expect(fs.calls).toEqual([{ id: 'sfhs-fullscreen-root', trustedClick: true, mainStartedAtCall: false }]);
  expect(fs.mainInvocations).toBe(1); expect(fs.state.requested).toBeTruthy(); expect(fs.state.rejected).toBeFalsy();
  await expect(page.locator('#setup-overlay')).toBeHidden();
  await expect(page.locator('#settings-toggle')).toBeVisible();
  for (const selector of ['#renderer-selector', '#start-doom', '#setup-status']) await expect(page.locator(selector)).toBeHidden();
  expect(await page.locator('#info-strip').count()).toBe(0);

  await expect.poll(() => page.evaluate(() => window.SFHS_WASM_TEST.nativeHudSnapshot()?.updateCount || 0), { timeout: 15000 }).toBeGreaterThan(2);
  const nativeHud = await page.evaluate(() => window.SFHS_WASM_TEST.nativeHudSnapshot());
  expect(nativeHud).toEqual(expect.objectContaining({ version: 1, enabled: 1, active: 1, width: 320, height: 32, rgbaPitch: 1280, effectiveWorldWidth: 320, effectiveWorldHeight: 200, effectiveScreenblocks: 11, internalStatusActive: 0 }));
  expect(nativeHud.checksum).toBeGreaterThan(0); expect(nativeHud.nonblankCount).toBeGreaterThan(3000); expect(nativeHud.paletteUpdates).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_STATE.hudDraws), { timeout: 10000 }).toBeGreaterThan(0);
  const browserHud = await page.locator('#doom-status-canvas').evaluate(element => {
    const data = element.getContext('2d').getImageData(0, 0, 320, 32).data;
    let nontransparent = 0, nonblack = 0;
    for (let index = 0; index < data.length; index += 4) { if (data[index + 3]) nontransparent += 1; if (data[index] || data[index + 1] || data[index + 2]) nonblack += 1; }
    return { active: element.dataset.active, nontransparent, nonblack };
  });
  expect(browserHud.active).toBe('true'); expect(browserHud.nontransparent).toBe(320 * 32); expect(browserHud.nonblack).toBeGreaterThan(3000);
  const stableWorldCoverage = await waitForFullFrame(page);
  const worldCoverage = analyzePngCoverage(await page.locator('#canvas').screenshot());
  await page.screenshot({ path: resolve(evidenceRoot, '400x844-active-gameplay.png') });
  expect(worldCoverage.width).toBe(400); expect(worldCoverage.height).toBe(300);
  expect(worldCoverage.verticalSpanRatio).toBeGreaterThanOrEqual(.92);
  expect(worldCoverage.longestBlankRowsRatio).toBeLessThanOrEqual(.12);
  expect(worldCoverage.pass).toBeTruthy();

  const fire = await regionBox(page, '[data-sfhs-control-id="primary"]');
  const beforeFire = await page.evaluate(() => ({ game: window.SFHSDoomMobileControls.snapshot().game, hud: window.SFHS_WASM_TEST.nativeHudSnapshot() }));
  await pointer(page, 'primary', 'pointerdown', 1001, fire.x + fire.width / 2, fire.y + fire.height / 2);
  await expect.poll(() => page.evaluate(value => window.SFHSDoomMobileControls.snapshot().game.ammo < value, beforeFire.game.ammo), { timeout: 6000 }).toBeTruthy();
  await expect.poll(() => page.evaluate(value => window.SFHS_WASM_TEST.nativeHudSnapshot().checksum !== value, beforeFire.hud.checksum), { timeout: 6000 }).toBeTruthy();
  await pointer(page, 'primary', 'pointerup', 1001, fire.x + fire.width / 2, fire.y + fire.height / 2);
  const afterFire = await page.evaluate(() => ({ game: window.SFHSDoomMobileControls.snapshot().game, hud: window.SFHS_WASM_TEST.nativeHudSnapshot(), controller: window.SFHSDoomMobileControls.snapshot().controller }));
  expect(afterFire.game.ammo).toBeLessThan(beforeFire.game.ammo);
  expect(afterFire.hud.updateCount).toBeGreaterThan(beforeFire.hud.updateCount);
  expect(afterFire.hud.checksum).not.toBe(beforeFire.hud.checksum);
  expect(afterFire.controller.activePointers).toEqual([]);

  const move = await regionBox(page, '[data-sfhs-control-id="move"]');
  const look = await regionBox(page, '[data-sfhs-control-id="look"]');
  const beforeMove = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot().game);
  await pointer(page, 'move', 'pointerdown', 1002, move.x + move.width / 2, move.y + move.height / 2);
  await pointer(page, 'move', 'pointermove', 1002, move.x + move.width / 2, move.y + move.height * .1);
  await pointer(page, 'look', 'pointerdown', 1003, look.x, look.y + look.height / 2);
  await pointer(page, 'look', 'pointermove', 1003, look.x + look.width, look.y + look.height / 2);
  await expect.poll(() => page.evaluate(value => { const game=window.SFHSDoomMobileControls.snapshot().game;return game.x!==value.x||game.y!==value.y;}, beforeMove), { timeout: 5000 }).toBeTruthy();
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.lastNonzeroLookCount), { timeout: 5000 }).toBe(4096);
  await pointer(page, 'move', 'pointerup', 1002, move.x + move.width / 2, move.y + move.height * .1);
  await pointer(page, 'look', 'pointerup', 1003, look.x + look.width, look.y + look.height / 2);

  const map = await regionBox(page, '[data-sfhs-control-id="map"]');
  await pointer(page,'map','pointerdown',1004,map.x+map.width/2,map.y+map.height/2);
  await pointer(page,'map','pointerup',1004,map.x+map.width/2,map.y+map.height/2);
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.totalPulseCounts.map), { timeout: 5000 }).toBeGreaterThan(0);
  const automapHud = await page.evaluate(() => window.SFHS_WASM_TEST.nativeHudSnapshot());
  expect(automapHud.active).toBe(1); expect(automapHud.internalStatusActive).toBe(0);
  const automapCoverage=analyzePngCoverage(await page.locator('#canvas').screenshot());
  await page.screenshot({ path: resolve(evidenceRoot, '400x844-automap-detached-hud.png') });
  await pointer(page,'map','pointerdown',1014,map.x+map.width/2,map.y+map.height/2);
  await pointer(page,'map','pointerup',1014,map.x+map.width/2,map.y+map.height/2);
  for (const [id, pointerId] of [['menu',1005],['weapon-previous',1006],['weapon-next',1007]]) {
    const box = await regionBox(page, `[data-sfhs-control-id="${id}"]`);
    await pointer(page,id,'pointerdown',pointerId,box.x+box.width/2,box.y+box.height/2);
    await pointer(page,id,'pointerup',pointerId,box.x+box.width/2,box.y+box.height/2);
  }
  const menuClose = await regionBox(page, '[data-sfhs-control-id="menu"]');
  await pointer(page,'menu','pointerdown',1008,menuClose.x+menuClose.width/2,menuClose.y+menuClose.height/2);
  await pointer(page,'menu','pointerup',1008,menuClose.x+menuClose.width/2,menuClose.y+menuClose.height/2);
  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.locator('#utility-panel')).toHaveClass(/is-open/);
  const settingsBox = await regionBox(page, '#utility-panel');
  expect(settingsBox.y).toBeGreaterThanOrEqual(300);
  await page.screenshot({ path: resolve(evidenceRoot, '400x844-settings-open.png') });
  await page.getByRole('button', { name: 'Edit controls' }).click();
  await expect(page.locator('#edit-panel')).toHaveClass(/is-open/);
  await expect(page.locator('#minimap-region')).toHaveAttribute('data-editing', 'true');
  await expect(page.locator('#minimap-canvas')).toHaveCSS('visibility', 'hidden');
  expect(await page.evaluate(() => window.SFHSDoomMobileControls.snapshot().controller.activePointers)).toEqual([]);
  const editorBox = await regionBox(page, '#edit-panel');
  const deckBox = await regionBox(page, '#control-deck');
  expect(editorBox.y + editorBox.height).toBeLessThanOrEqual(deckBox.y + 1);
  expect(intersectionArea(editorBox, deckBox)).toBe(0);
  expect(intersectionArea(editorBox, deckBox) / (deckBox.width * deckBox.height)).toBeLessThan(.01);
  const editorControls = {};
  for (const id of ['move','primary','look','interact','modifier','menu','map','weapon-previous','weapon-next']) {
    const box = await regionBox(page, `[data-sfhs-control-id="${id}"]`);
    editorControls[id] = box;
    expect(box.x + box.width).toBeLessThanOrEqual(401);
    expect(box.y + box.height).toBeLessThanOrEqual(845);
    expect(intersectionArea(editorBox, box), `${id} is not covered by editor settings`).toBe(0);
    await expect(page.locator(`[data-sfhs-control-id="${id}"]`)).toBeVisible();
  }
  await page.screenshot({ path: resolve(evidenceRoot, '400x844-edit-mode.png') });
  const minimapUpdatesBeforeEditWait = await page.evaluate(() => window.SFHS_P6_STATE.minimapUpdates);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.SFHS_P6_STATE.minimapUpdates)).toBe(minimapUpdatesBeforeEditWait);
  const beforeProfile = await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile());

  const moveBefore = await regionBox(page, '[data-sfhs-control-id="move"]');
  await pointer(page, 'move', 'pointerdown', 1101, moveBefore.x + moveBefore.width / 2, moveBefore.y + moveBefore.height / 2);
  await pointer(page, 'move', 'pointermove', 1101, moveBefore.x + moveBefore.width / 2 + 14, moveBefore.y + moveBefore.height / 2 - 12);
  await pointer(page, 'move', 'pointerup', 1101, moveBefore.x + moveBefore.width / 2 + 14, moveBefore.y + moveBefore.height / 2 - 12);
  const moveDragged = await regionBox(page, '[data-sfhs-control-id="move"]');
  expect(moveDragged.x).toBeGreaterThan(moveBefore.x + 8);
  expect(moveDragged.y).toBeLessThan(moveBefore.y - 6);
  const moveGrip = await regionBox(page, '[data-sfhs-control-id="move"] [data-sfhs-resize-handle]');
  await pointerSelector(page, '[data-sfhs-control-id="move"] [data-sfhs-resize-handle]', 'pointerdown', 1102, moveGrip.x + moveGrip.width / 2, moveGrip.y + moveGrip.height / 2);
  await pointerSelector(page, '[data-sfhs-control-id="move"] [data-sfhs-resize-handle]', 'pointermove', 1102, moveGrip.x + moveGrip.width / 2 + 16, moveGrip.y + moveGrip.height / 2 + 16);
  await pointerSelector(page, '[data-sfhs-control-id="move"] [data-sfhs-resize-handle]', 'pointerup', 1102, moveGrip.x + moveGrip.width / 2 + 16, moveGrip.y + moveGrip.height / 2 + 16);
  const moveResized = await regionBox(page, '[data-sfhs-control-id="move"]');
  expect(moveResized.width).toBeGreaterThan(moveDragged.width + 8);
  expect(moveResized.height).toBeGreaterThan(moveDragged.height + 8);

  const lookBefore = await regionBox(page, '[data-sfhs-control-id="look"]');
  const lookGrip = await regionBox(page, '[data-sfhs-control-id="look"] [data-sfhs-resize-handle]');
  await pointerSelector(page, '[data-sfhs-control-id="look"] [data-sfhs-resize-handle]', 'pointerdown', 1103, lookGrip.x + lookGrip.width / 2, lookGrip.y + lookGrip.height / 2);
  await pointerSelector(page, '[data-sfhs-control-id="look"] [data-sfhs-resize-handle]', 'pointermove', 1103, lookGrip.x + lookGrip.width / 2 + 18, lookGrip.y + lookGrip.height / 2 + 12);
  await pointerSelector(page, '[data-sfhs-control-id="look"] [data-sfhs-resize-handle]', 'pointerup', 1103, lookGrip.x + lookGrip.width / 2 + 18, lookGrip.y + lookGrip.height / 2 + 12);
  const lookResized = await regionBox(page, '[data-sfhs-control-id="look"]');
  expect(lookResized.width).toBeGreaterThan(lookBefore.width + 10);
  expect(lookResized.height).toBeGreaterThan(lookBefore.height + 6);
  await page.locator('#control-opacity').fill('0.47');
  await page.getByRole('button', { name: 'Save layout' }).click();
  await expect(page.locator('#minimap-region')).toHaveAttribute('data-editing', 'false');
  const savedProfile = await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile());
  expect(savedProfile.settings.opacity).toBeCloseTo(.47);
  expect(savedProfile.layouts.portrait.move).not.toEqual(beforeProfile.layouts.portrait.move);
  expect(savedProfile.layouts.portrait.look).not.toEqual(beforeProfile.layouts.portrait.look);

  await page.getByRole('button', { name: 'Open settings' }).click(); await page.getByRole('button', { name: 'Edit controls' }).click();
  const fireEdit = await regionBox(page, '[data-sfhs-control-id="primary"]');
  await pointer(page, 'primary', 'pointerdown', 1104, fireEdit.x + fireEdit.width / 2, fireEdit.y + fireEdit.height / 2);
  await pointer(page, 'primary', 'pointermove', 1104, fireEdit.x + fireEdit.width / 2 - 18, fireEdit.y + fireEdit.height / 2);
  await pointer(page, 'primary', 'pointerup', 1104, fireEdit.x + fireEdit.width / 2 - 18, fireEdit.y + fireEdit.height / 2);
  expect((await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile())).layouts.portrait.primary).not.toEqual(savedProfile.layouts.portrait.primary);
  await page.getByRole('button', { name: 'Cancel' }).click();
  expect(await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile())).toEqual(savedProfile);
  await expect(page.locator('#minimap-canvas')).toHaveCSS('visibility', 'visible');
  await expect.poll(() => page.evaluate(value => window.SFHS_P6_STATE.minimapUpdates > value, minimapUpdatesBeforeEditWait), { timeout: 5000 }).toBeTruthy();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Open settings' }).click(); await page.getByRole('button', { name: 'Edit controls' }).click();
  await page.getByRole('button', { name: 'Export JSON' }).click(); await downloadPromise;
  await page.getByRole('button', { name: 'Reset' }).click();
  await page.evaluate(value => window.SFHS_WASM_TEST.setMobileControlsProfile(value), savedProfile);
  expect((await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile())).schema).toBe('sfhs.mobile-controls-profile@1');
  await page.getByRole('button', { name: 'Cancel' }).click();

  const callbacksBeforeHidden = await page.evaluate(() => window.SFHS_P6_STATE.hudRafCallbacks);
  await page.evaluate(() => window.__setSfhsTestHidden(true));
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_STATE.hudLoopSuspended)).toBeTruthy();
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.SFHS_P6_STATE.hudRafCallbacks)).toBeLessThanOrEqual(callbacksBeforeHidden + 1);
  await page.evaluate(() => window.__setSfhsTestHidden(false));
  await expect.poll(() => page.evaluate(startValue => window.SFHS_P6_STATE.hudRafCallbacks > startValue, callbacksBeforeHidden), { timeout: 5000 }).toBeTruthy();

  await page.setViewportSize({ width: 360, height: 800 });
  const compactGame = await regionBox(page, '#game-region');
  expect(compactGame.width).toBeCloseTo(360, 0); expect(compactGame.height).toBeCloseTo(270, 0);
  await page.setViewportSize({ width: 800, height: 360 });
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight && scrollY === 0)).toBeTruthy();
  for (const selector of ['#game-region','#minimap-region','#control-deck','#doom-status-region']) { const box=await regionBox(page,selector); expect(box.y+box.height).toBeLessThanOrEqual(361); }
  writeFileSync(resolve(evidenceRoot, '..', 'native-hud-proof.json'), JSON.stringify({
    fullscreen: fs,
    audioState,
    nativeHud,
    browserHud,
    presentationAutomatic,
    stableWorldCoverage,
    worldCoverage,
    fire: { before: beforeFire, after: afterFire },
    automapHud,
    automapCoverage,
    portraitGeometry: { game400: { width: worldCoverage.width, height: worldCoverage.height }, game360: compactGame },
    editor: { editorBox, deckBox, overlapArea: intersectionArea(editorBox, deckBox), controls: editorControls, moveBefore, moveDragged, moveResized, lookBefore, lookResized, savedProfile },
    visibility: { callbacksBeforeHidden, resumedCallbacks: await page.evaluate(() => window.SFHS_P6_STATE.hudRafCallbacks) },
    hygiene,
  }, null, 2) + '\n');
  expect(hygiene.pageErrors).toEqual([]); expect(hygiene.externalRequests).toEqual([]); expect(hygiene.failedRequests).toEqual([]);
  expect(hygiene.consoleErrors.filter(message => /fatal|abort|uncaught|unhandled|out of memory/i.test(message))).toEqual([]);
});

test('V12 landscape fallback boots with every required region reachable', async ({ page }) => {
  const hygiene = watchPage(page);
  await open(page, { width: 800, height: 360 }, 'success');
  await start(page);
  await expect.poll(() => page.evaluate(() => { const at=window.Module._sfhs_mobile_present_debug_snapshot()>>2;return window.Module.HEAP32[at+3]; }), { timeout: 10000 }).toBeGreaterThan(10);
  await expect.poll(() => page.evaluate(() => window.SFHS_WASM_TEST.nativeHudSnapshot()?.active), { timeout: 10000 }).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight && scrollY === 0)).toBeTruthy();
  for (const selector of ['#game-region','#minimap-region','#control-deck','#doom-status-region']) {
    const box=await regionBox(page,selector);
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x+box.width).toBeLessThanOrEqual(801); expect(box.y+box.height).toBeLessThanOrEqual(361);
  }
  expect(await page.locator('#doom-status-canvas').evaluate(element => [element.width,element.height])).toEqual([320,32]);
  await page.waitForTimeout(300);
  await page.screenshot({ path: resolve(evidenceRoot, '800x360-landscape-fallback.png') });
  writeFileSync(resolve(evidenceRoot, '..', 'landscape-fallback-proof.json'), JSON.stringify({
    viewport: { width:800, height:360 },
    presentation: await page.evaluate(() => window.SFHS_WASM_TEST.presentationSnapshot()),
    nativeHud: await page.evaluate(() => window.SFHS_WASM_TEST.nativeHudSnapshot()),
    hygiene,
  }, null, 2) + '\n');
  expect(hygiene.pageErrors).toEqual([]); expect(hygiene.externalRequests).toEqual([]); expect(hygiene.failedRequests).toEqual([]);
});

test('V12 fullscreen rejection is handled and Doom still starts exactly once', async ({ page }) => {
  const hygiene = watchPage(page);
  await open(page, { width: 400, height: 844 }, 'reject');
  await start(page);
  await expect.poll(() => page.evaluate(() => window.SFHS_WASM_TEST.fullscreenState().rejected), { timeout: 5000 }).toBeTruthy();
  const value = await page.evaluate(() => ({ fs: window.SFHS_WASM_TEST.fullscreenState(), calls: window.__sfhsFullscreenCalls, invocations: window.SFHS_P6_STATE.mainInvocations }));
  expect(value.invocations).toBe(1); expect(value.calls[0]).toEqual(expect.objectContaining({ id:'sfhs-fullscreen-root', trustedClick:true, mainStartedAtCall:false }));
  expect(value.fs.error).toContain('V12_TEST_FULLSCREEN_REJECTED');
  writeFileSync(resolve(evidenceRoot, '..', 'fullscreen-rejection-proof.json'), JSON.stringify({ value, hygiene }, null, 2) + '\n');
  expect(hygiene.pageErrors).toEqual([]); expect(hygiene.consoleErrors.filter(message => /unhandled|uncaught/i.test(message))).toEqual([]);
});

test('V12 starts without a Fullscreen API', async ({ page }) => {
  const hygiene = watchPage(page);
  await open(page, { width: 400, height: 844 }, 'unsupported');
  await start(page);
  const value = await page.evaluate(() => ({ fs: window.SFHS_WASM_TEST.fullscreenState(), calls: window.__sfhsFullscreenCalls, invocations: window.SFHS_P6_STATE.mainInvocations }));
  expect(value.invocations).toBe(1); expect(value.calls).toEqual([]); expect(value.fs.supported).toBeFalsy();
  writeFileSync(resolve(evidenceRoot, '..', 'fullscreen-unsupported-proof.json'), JSON.stringify({ value, hygiene }, null, 2) + '\n');
  expect(hygiene.pageErrors).toEqual([]);
});

test('V12 compatibility renderer boots with the detached native HUD and full-frame coverage', async ({ page }) => {
  const hygiene = watchPage(page);
  await open(page, { width: 400, height: 844 }, 'success');
  await start(page, 'compatibility');
  await expect.poll(() => page.evaluate(() => window.SFHS_WASM_TEST.nativeHudSnapshot()?.active), { timeout: 10000 }).toBe(1);
  const presentation = await page.evaluate(() => { const pointer=window.Module._sfhs_mobile_present_debug_snapshot()>>2,heap=window.Module.HEAP32;return{mode:heap[pointer+1],presents:heap[pointer+3],forceSoftware:heap[pointer+11],smooth:heap[pointer+12]}; });
  expect(presentation.mode).toBe(1); expect(presentation.forceSoftware).toBe(1); expect(presentation.smooth).toBe(0); expect(presentation.presents).toBeGreaterThan(0);
  const stableCoverage = await waitForFullFrame(page);
  const browserPresentation = await page.evaluate(() => window.SFHS_WASM_TEST.presentationSnapshot());
  const worldPng = await page.locator('#canvas').screenshot({ path: resolve(evidenceRoot, '400x300-compatibility-world.png') });
  const coverage = analyzePngCoverage(worldPng);
  expect(browserPresentation.transform).not.toBe('none');
  expect(browserPresentation.canvasAttributeWidth).toBe(browserPresentation.sdl.outputWidth);
  expect(browserPresentation.canvasAttributeHeight).toBe(browserPresentation.sdl.outputHeight);
  writeFileSync(resolve(evidenceRoot, '..', 'compatibility-renderer-proof.json'), JSON.stringify({ presentation, browserPresentation, stableCoverage, coverage, hygiene }, null, 2) + '\n');
  expect(coverage.pass).toBeTruthy();
  await page.screenshot({ path: resolve(evidenceRoot, '400x844-compatibility-renderer.png') });
  expect(hygiene.pageErrors).toEqual([]); expect(hygiene.externalRequests).toEqual([]);
});
