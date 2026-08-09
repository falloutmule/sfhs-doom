import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inflateSync } from 'node:zlib';

test.describe.configure({ mode: 'serial' });
test.setTimeout(120000);

const candidate = new URL('../../dist/sfhs-doom-android-sfhs-controls-v11.html', import.meta.url);
const evidenceRoot = resolve('..', 'test-results', 'P06', 'P6-059', 'screenshots');

function screenshotEdgePixels(png) {
  let offset = 8, width = 0, height = 0, colorType = 0;
  const compressed = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset); const type = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length); offset += 12 + length;
    if (type === 'IHDR') { width=data.readUInt32BE(0); height=data.readUInt32BE(4); expect(data[8]).toBe(8); colorType=data[9]; }
    if (type === 'IDAT') compressed.push(data);
    if (type === 'IEND') break;
  }
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  expect(channels, `supported screenshot PNG color type ${colorType}`).toBeGreaterThan(0);
  const packed=inflateSync(Buffer.concat(compressed)),stride=width*channels,raw=Buffer.alloc(stride*height);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  let source=0;
  for(let y=0;y<height;y+=1){const filter=packed[source++];for(let x=0;x<stride;x+=1){const value=packed[source++],left=x>=channels?raw[y*stride+x-channels]:0,up=y?raw[(y-1)*stride+x]:0,upperLeft=y&&x>=channels?raw[(y-1)*stride+x-channels]:0;let decoded=value;if(filter===1)decoded+=left;else if(filter===2)decoded+=up;else if(filter===3)decoded+=Math.floor((left+up)/2);else if(filter===4)decoded+=paeth(left,up,upperLeft);raw[y*stride+x]=decoded&255;}}
  const countColumn=x=>{let nonblack=0;for(let y=0;y<height;y+=1){const at=y*stride+x*channels;if(raw[at]||raw[at+1]||raw[at+2])nonblack+=1;}return nonblack;};
  const countRow=y=>{let nonblack=0;for(let x=0;x<width;x+=1){const at=y*stride+x*channels;if(raw[at]||raw[at+1]||raw[at+2])nonblack+=1;}return nonblack;};
  return { width, height, left:countColumn(0), right:countColumn(width-1), top:countRow(0), bottom:countRow(height-1) };
}

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
      if (mode === 'reject') return Promise.reject(new Error('V11_TEST_FULLSCREEN_REJECTED'));
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => this });
      queueMicrotask(() => document.dispatchEvent(new Event('fullscreenchange')));
      return new Promise(() => {});
    }});
  }, fullscreenMode);
}

async function open(page, viewport, fullscreenMode = 'success') {
  test.skip(!existsSync(candidate), 'V11 artifact has not been built.');
  await installLifecycleProbe(page, fullscreenMode);
  await page.setViewportSize(viewport);
  await page.goto(candidate.href, { waitUntil: 'load', timeout: 60000 });
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

test.beforeAll(() => mkdirSync(evidenceRoot, { recursive: true }));

for (const viewport of [
  { width: 360, height: 800, name: '360x800' },
  { width: 400, height: 844, name: '400x844' },
]) {
  test(`V11 ${viewport.name} portrait is aspect-correct and edge-to-edge before startup`, async ({ page }) => {
    await open(page, viewport);
    const root = await regionBox(page, '#sfhs-fullscreen-root');
    const game = await regionBox(page, '#game-region');
    const canvas = await regionBox(page, '#canvas');
    expect(root.x).toBeCloseTo(0, 0); expect(root.y).toBeCloseTo(0, 0);
    expect(game.x).toBeCloseTo(0, 0); expect(game.y).toBeCloseTo(0, 0);
    expect(game.width).toBeCloseTo(viewport.width, 0);
    expect(game.height).toBeCloseTo(viewport.width * 3 / 4, 0);
    expect(canvas).toEqual(expect.objectContaining({ x: game.x, y: game.y, width: game.width, height: game.height }));
    expect(await page.locator('#canvas').evaluate(element => [element.width, element.height, getComputedStyle(element).borderWidth])).toEqual([320, 200, '0px']);
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
      await page.waitForTimeout(300);
      await page.screenshot({ path: resolve(evidenceRoot, '360x800-active-gameplay.png') });
    }
  });
}

test('V11 trusted fullscreen drives the unchanged native surfaces and unobstructed editor', async ({ page }) => {
  const hygiene = watchPage(page);
  await open(page, { width: 400, height: 844 }, 'success');
  await start(page);
  expect(await page.locator('#canvas').evaluate(element => [element.width,element.height])).toEqual([320,200]);
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
  const worldEdges = screenshotEdgePixels(await page.locator('#canvas').screenshot());
  await page.screenshot({ path: resolve(evidenceRoot, '400x844-active-gameplay.png') });
  expect(worldEdges.width).toBe(400); expect(worldEdges.height).toBe(300);
  expect(worldEdges.left).toBeGreaterThan(40); expect(worldEdges.right).toBeGreaterThan(40);

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
  const automapPixels=screenshotEdgePixels(await page.locator('#canvas').screenshot());
  expect(automapPixels.bottom).toBeLessThan(40);
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
    worldEdges,
    fire: { before: beforeFire, after: afterFire },
    automapHud,
    automapPixels,
    portraitGeometry: { game400: { width: worldEdges.width, height: worldEdges.height }, game360: compactGame },
    editor: { editorBox, deckBox, overlapArea: intersectionArea(editorBox, deckBox), controls: editorControls, moveBefore, moveDragged, moveResized, lookBefore, lookResized, savedProfile },
    visibility: { callbacksBeforeHidden, resumedCallbacks: await page.evaluate(() => window.SFHS_P6_STATE.hudRafCallbacks) },
    hygiene,
  }, null, 2) + '\n');
  expect(hygiene.pageErrors).toEqual([]); expect(hygiene.externalRequests).toEqual([]); expect(hygiene.failedRequests).toEqual([]);
  expect(hygiene.consoleErrors.filter(message => /fatal|abort|uncaught|unhandled|out of memory/i.test(message))).toEqual([]);
});

test('V11 landscape fallback boots with every required region reachable', async ({ page }) => {
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
  expect(await page.locator('#canvas').evaluate(element => [element.width,element.height])).toEqual([320,200]);
  expect(await page.locator('#doom-status-canvas').evaluate(element => [element.width,element.height])).toEqual([320,32]);
  await page.waitForTimeout(300);
  await page.screenshot({ path: resolve(evidenceRoot, '800x360-landscape-fallback.png') });
  writeFileSync(resolve(evidenceRoot, '..', 'landscape-fallback-proof.json'), JSON.stringify({
    viewport: { width:800, height:360 },
    canvas: await page.locator('#canvas').evaluate(element => ({ backing:[element.width,element.height], rect:element.getBoundingClientRect().toJSON(), style:{ width:getComputedStyle(element).width, height:getComputedStyle(element).height } })),
    nativeHud: await page.evaluate(() => window.SFHS_WASM_TEST.nativeHudSnapshot()),
    hygiene,
  }, null, 2) + '\n');
  expect(hygiene.pageErrors).toEqual([]); expect(hygiene.externalRequests).toEqual([]); expect(hygiene.failedRequests).toEqual([]);
});

test('V11 fullscreen rejection is handled and Doom still starts exactly once', async ({ page }) => {
  const hygiene = watchPage(page);
  await open(page, { width: 400, height: 844 }, 'reject');
  await start(page);
  await expect.poll(() => page.evaluate(() => window.SFHS_WASM_TEST.fullscreenState().rejected), { timeout: 5000 }).toBeTruthy();
  const value = await page.evaluate(() => ({ fs: window.SFHS_WASM_TEST.fullscreenState(), calls: window.__sfhsFullscreenCalls, invocations: window.SFHS_P6_STATE.mainInvocations }));
  expect(value.invocations).toBe(1); expect(value.calls[0]).toEqual(expect.objectContaining({ id:'sfhs-fullscreen-root', trustedClick:true, mainStartedAtCall:false }));
  expect(value.fs.error).toContain('V11_TEST_FULLSCREEN_REJECTED');
  writeFileSync(resolve(evidenceRoot, '..', 'fullscreen-rejection-proof.json'), JSON.stringify({ value, hygiene }, null, 2) + '\n');
  expect(hygiene.pageErrors).toEqual([]); expect(hygiene.consoleErrors.filter(message => /unhandled|uncaught/i.test(message))).toEqual([]);
});

test('V11 starts without a Fullscreen API', async ({ page }) => {
  const hygiene = watchPage(page);
  await open(page, { width: 400, height: 844 }, 'unsupported');
  await start(page);
  const value = await page.evaluate(() => ({ fs: window.SFHS_WASM_TEST.fullscreenState(), calls: window.__sfhsFullscreenCalls, invocations: window.SFHS_P6_STATE.mainInvocations }));
  expect(value.invocations).toBe(1); expect(value.calls).toEqual([]); expect(value.fs.supported).toBeFalsy();
  writeFileSync(resolve(evidenceRoot, '..', 'fullscreen-unsupported-proof.json'), JSON.stringify({ value, hygiene }, null, 2) + '\n');
  expect(hygiene.pageErrors).toEqual([]);
});

test('V11 compatibility renderer boots with the detached native HUD', async ({ page }) => {
  const hygiene = watchPage(page);
  await open(page, { width: 400, height: 844 }, 'success');
  await start(page, 'compatibility');
  await expect.poll(() => page.evaluate(() => window.SFHS_WASM_TEST.nativeHudSnapshot()?.active), { timeout: 10000 }).toBe(1);
  const presentation = await page.evaluate(() => { const pointer=window.Module._sfhs_mobile_present_debug_snapshot()>>2,heap=window.Module.HEAP32;return{mode:heap[pointer+1],presents:heap[pointer+3],forceSoftware:heap[pointer+11],smooth:heap[pointer+12]}; });
  expect(presentation.mode).toBe(1); expect(presentation.forceSoftware).toBe(1); expect(presentation.smooth).toBe(0); expect(presentation.presents).toBeGreaterThan(0);
  writeFileSync(resolve(evidenceRoot, '..', 'compatibility-renderer-proof.json'), JSON.stringify({ presentation, hygiene }, null, 2) + '\n');
  await page.screenshot({ path: resolve(evidenceRoot, '400x844-compatibility-renderer.png') });
  expect(hygiene.pageErrors).toEqual([]); expect(hygiene.externalRequests).toEqual([]);
});
