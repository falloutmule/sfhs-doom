import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { analyzePngCoverage } from '../support/full-frame-coverage.mjs';

test.describe.configure({ mode: 'serial' });
test.setTimeout(120000);

const candidate = new URL('../../dist/sfhs-doom-android-sfhs-controls-v13.html', import.meta.url);
const evidenceBase = resolve('..', 'test-results', 'P06', 'P6-061');
const screenshotRoot = resolve(evidenceBase, 'screenshots');

function watchPage(page) {
  const pageErrors = [], consoleErrors = [], externalRequests = [], failedRequests = [];
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
    document.addEventListener('click', event => { window.__sfhsTrustedClick = event.isTrusted; setTimeout(() => { window.__sfhsTrustedClick = false; }, 0); }, true);
    if (mode === 'unsupported') {
      Object.defineProperty(Element.prototype, 'requestFullscreen', { configurable: true, value: undefined });
      return;
    }
    Object.defineProperty(Element.prototype, 'requestFullscreen', { configurable: true, value: function requestFullscreen() {
      window.__sfhsFullscreenCalls.push({ id: this.id, trustedClick: window.__sfhsTrustedClick, mainStartedAtCall: Boolean(window.SFHS_P6_STATE?.mainStarted) });
      if (mode === 'reject') return Promise.reject(new Error('V13_TEST_FULLSCREEN_REJECTED'));
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => this });
      queueMicrotask(() => document.dispatchEvent(new Event('fullscreenchange')));
      return new Promise(() => {});
    }});
  }, fullscreenMode);
}

async function open(page, viewport = { width: 400, height: 844 }, fullscreenMode = 'success') {
  test.skip(!existsSync(candidate), 'V13 artifact has not been built.');
  await installLifecycleProbe(page, fullscreenMode);
  await page.setViewportSize(viewport);
  await page.goto(candidate.href, { waitUntil: 'load', timeout: 60000 });
  await expect.poll(() => page.evaluate(() => Boolean(window.SFHSDoomMobileControls)), { timeout: 60000 }).toBeTruthy();
  await expect(page.locator('#sfhs-fullscreen-root')).toHaveAttribute('data-sfhs-fullscreen-app-root', 'v13');
}

async function start(page, renderer = 'auto') {
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-runtime', 'ready', { timeout: 60000 });
  await page.locator('#renderer-mode').selectOption(renderer);
  await page.getByRole('button', { name: 'Start Fullscreen' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-main', 'started', { timeout: 15000 });
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().game?.active), { timeout: 20000 }).toBe(1);
}

async function box(page, selector) {
  const value = await page.locator(selector).boundingBox();
  expect(value, `${selector} has geometry`).not.toBeNull();
  return value;
}

async function pointer(page, id, type, pointerId, x, y) {
  await page.locator(`[data-sfhs-control-id="${id}"]`).evaluate((element, value) => element.dispatchEvent(new PointerEvent(value.type, {
    bubbles: true, cancelable: true, pointerType: 'touch', pointerId: value.pointerId,
    button: 0, buttons: value.type === 'pointerup' || value.type === 'pointercancel' ? 0 : 1,
    pressure: value.type === 'pointerup' || value.type === 'pointercancel' ? 0 : .5,
    clientX: value.x, clientY: value.y, screenX: value.x, screenY: value.y,
  })), { type, pointerId, x, y });
}

async function tapLook(page, pointerId, dx = 0, dy = 0) {
  const look = await box(page, '[data-sfhs-control-id="look"]');
  const x = look.x + look.width / 2, y = look.y + look.height / 2;
  await pointer(page, 'look', 'pointerdown', pointerId, x, y);
  if (dx || dy) await pointer(page, 'look', 'pointermove', pointerId, x + dx, y + dy);
  await pointer(page, 'look', 'pointerup', pointerId, x + dx, y + dy);
}

async function waitForFullFrame(page) {
  let coverage;
  await expect.poll(async () => { coverage = analyzePngCoverage(await page.locator('#canvas').screenshot()); return coverage.pass; }, { timeout: 15000 }).toBeTruthy();
  return coverage;
}

test.beforeAll(() => { mkdirSync(screenshotRoot, { recursive: true }); });

for (const item of [
  { viewport: { width: 360, height: 800 }, renderer: 'auto', expected: [360, 270], name: '360-auto' },
  { viewport: { width: 576, height: 1280 }, renderer: 'auto', expected: [576, 432], name: '576-auto' },
  { viewport: { width: 400, height: 844 }, renderer: 'compatibility', expected: [400, 300], name: '400-compatibility' },
]) {
  test(`V13 preserves full-frame ${item.name} presentation`, async ({ page }) => {
    const hygiene = watchPage(page);
    await open(page, item.viewport);
    const before = await box(page, '#game-region');
    expect([Math.round(before.width), Math.round(before.height)]).toEqual(item.expected);
    await start(page, item.renderer);
    await expect.poll(() => page.evaluate(() => window.SFHS_WASM_TEST.presentationSnapshot().sdl?.presents || 0), { timeout: 10000 }).toBeGreaterThan(10);
    const coverage = await waitForFullFrame(page);
    const presentation = await page.evaluate(() => window.SFHS_WASM_TEST.presentationSnapshot());
    const hud = await page.evaluate(() => window.SFHS_WASM_TEST.nativeHudSnapshot());
    expect(presentation.canvasAttributeWidth).toBe(320); expect(presentation.canvasAttributeHeight).toBe(200);
    expect(presentation.sdl.outputWidth).toBe(320); expect(presentation.sdl.outputHeight).toBe(200);
    expect(hud).toEqual(expect.objectContaining({ width: 320, height: 32, effectiveWorldWidth: 320, effectiveWorldHeight: 200, effectiveScreenblocks: 11, internalStatusActive: 0 }));
    expect(coverage.pass).toBeTruthy();
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && scrollY === 0)).toBeTruthy();
    await page.screenshot({ path: resolve(screenshotRoot, `${item.name}.png`) });
    writeFileSync(resolve(evidenceBase, `${item.name}-proof.json`), JSON.stringify({ presentation, hud, coverage, hygiene }, null, 2) + '\n');
    expect(hygiene.pageErrors).toEqual([]); expect(hygiene.externalRequests).toEqual([]); expect(hygiene.failedRequests).toEqual([]);
  });
}

test('LOOK tap fires once, jitter fires, drag looks only, and timeout does not fire', async ({ page }) => {
  const hygiene = watchPage(page);
  await open(page); await start(page);
  await page.waitForTimeout(2500);
  const initial = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot());
  expect(initial.adapter.lookTapFire).toEqual(expect.objectContaining({ version: 1, maxDurationMs: 300, slopCssPx: 12, maxQueue: 4 }));

  await tapLook(page, 1301);
  await expect.poll(() => page.evaluate(value => window.SFHSDoomMobileControls.snapshot().game.ammo < value, initial.game.ammo), { timeout: 5000 }).toBeTruthy();
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.lookTapFire.releaseTics), { timeout: 5000 }).toBeGreaterThan(0);
  const afterTap = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot());
  expect(afterTap.adapter.lookTapFire.acceptedTaps).toBe(1);
  expect(afterTap.adapter.lookTapFire.pressTics).toBe(1);
  expect(afterTap.adapter.lastLookCount).toBe(0);
  expect(afterTap.input.heldMask).toBe(0);

  await page.waitForTimeout(450);
  await tapLook(page, 1302, 6, 6);
  await expect.poll(() => page.evaluate(value => window.SFHSDoomMobileControls.snapshot().game.ammo < value, afterTap.game.ammo), { timeout: 5000 }).toBeTruthy();
  const afterJitter = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot());
  expect(afterJitter.adapter.lookTapFire.acceptedTaps).toBe(2);
  expect(afterJitter.adapter.lookTapFire.lastMaxTravel).toBeLessThan(12);

  await page.waitForTimeout(450);
  const look = await box(page, '[data-sfhs-control-id="look"]');
  const x = look.x + look.width / 2, y = look.y + look.height / 2;
  const beforeDrag = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot());
  await pointer(page, 'look', 'pointerdown', 1303, x, y);
  await pointer(page, 'look', 'pointermove', 1303, x + 60, y);
  await pointer(page, 'look', 'pointerup', 1303, x + 60, y);
  await expect.poll(() => page.evaluate(value => window.SFHSDoomMobileControls.snapshot().game.angle !== value, beforeDrag.game.angle), { timeout: 5000 }).toBeTruthy();
  await page.waitForTimeout(450);
  const afterDrag = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot());
  expect(afterDrag.game.ammo).toBe(beforeDrag.game.ammo);
  expect(afterDrag.adapter.lookTapFire.acceptedTaps).toBe(2);
  expect(afterDrag.adapter.lookTapFire.lastCancelReason).toBe('movement');

  await pointer(page, 'look', 'pointerdown', 1304, x, y);
  await page.waitForTimeout(340);
  await pointer(page, 'look', 'pointerup', 1304, x, y);
  await page.waitForTimeout(300);
  const afterTimeout = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot());
  expect(afterTimeout.game.ammo).toBe(afterDrag.game.ammo);
  expect(afterTimeout.adapter.lookTapFire.lastCancelReason).toBe('timeout');
  expect(afterTimeout.adapter.lookTapFire.tracking).toBeFalsy();
  expect(afterTimeout.input.heldMask).toBe(0);
  writeFileSync(resolve(evidenceBase, 'look-tap-fire-proof.json'), JSON.stringify({ initial, afterTap, afterJitter, beforeDrag, afterDrag, afterTimeout, hygiene }, null, 2) + '\n');
  expect(hygiene.pageErrors).toEqual([]); expect(hygiene.externalRequests).toEqual([]); expect(hygiene.failedRequests).toEqual([]);
});

test('LOOK tap lifecycle cancellations never fire or leave input held', async ({ page }) => {
  await open(page); await start(page);
  const look = await box(page, '[data-sfhs-control-id="look"]');
  const x = look.x + look.width / 2, y = look.y + look.height / 2;
  const baselineAmmo = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot().game.ammo);
  const cancellations = [];
  for (const [pointerId, type, expected] of [[1401, 'pointercancel', 'pointercancel'], [1402, 'lostpointercapture', 'lost-capture']]) {
    await pointer(page, 'look', 'pointerdown', pointerId, x, y);
    await pointer(page, 'look', type, pointerId, x, y);
    const value = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.lookTapFire);
    expect(value.lastCancelReason).toBe(expected); expect(value.tracking).toBeFalsy(); cancellations.push({ type, value });
  }
  await pointer(page, 'look', 'pointerdown', 1405, x, y);
  expect((await page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.lookTapFire)).tracking).toBeTruthy();
  await page.getByRole('button', { name: 'Open settings' }).click(); await page.getByRole('button', { name: 'Edit controls' }).click();
  expect((await page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.lookTapFire)).lastCancelReason).toBe('edit-entry');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await pointer(page, 'look', 'pointerdown', 1403, x, y); await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  expect(['blur','shared-release']).toContain((await page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.lookTapFire)).lastCancelReason);
  await pointer(page, 'look', 'pointerdown', 1404, x, y); await page.evaluate(() => window.__setSfhsTestHidden(true));
  expect(['visibility-hidden','shared-release']).toContain((await page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.lookTapFire)).lastCancelReason);
  await page.evaluate(() => window.__setSfhsTestHidden(false));
  await pointer(page, 'look', 'pointerdown', 1406, x, y); await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  expect(['pagehide','shared-release']).toContain((await page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.lookTapFire)).lastCancelReason);
  await page.waitForTimeout(400);
  const final = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot());
  expect(final.game.ammo).toBe(baselineAmmo); expect(final.input.heldMask).toBe(0); expect(final.controller.activePointers).toEqual([]);
  writeFileSync(resolve(evidenceBase, 'look-tap-cancellation-proof.json'), JSON.stringify({ cancellations, final }, null, 2) + '\n');
});

test('rapid LOOK taps are separated, MOVE remains concurrent, and dedicated FIRE takes precedence', async ({ page }) => {
  await open(page); await start(page); await page.waitForTimeout(2500);
  const look = await box(page, '[data-sfhs-control-id="look"]'), move = await box(page, '[data-sfhs-control-id="move"]'), fire = await box(page, '[data-sfhs-control-id="primary"]');
  const lx=look.x+look.width/2,ly=look.y+look.height/2;
  await page.locator('[data-sfhs-control-id="look"]').evaluate((element, value) => {
    for(let index=0;index<5;index+=1){const id=1500+index;element.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:id,button:0,buttons:1,clientX:value.x,clientY:value.y}));element.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:id,button:0,buttons:0,clientX:value.x,clientY:value.y}));}
  }, {x:lx,y:ly});
  const queued = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.lookTapFire);
  expect(queued.queued).toBe(4); expect(queued.acceptedTaps).toBe(5); expect(queued.droppedTaps).toBe(1);
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.lookTapFire.pressTics), { timeout: 5000 }).toBeGreaterThanOrEqual(4);
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.lookTapFire.releaseTics), { timeout: 5000 }).toBeGreaterThanOrEqual(4);

  await page.waitForTimeout(450);
  const beforeMove = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot());
  await pointer(page,'move','pointerdown',1601,move.x+move.width/2,move.y+move.height/2);
  await pointer(page,'move','pointermove',1601,move.x+move.width/2,move.y+move.height*.1);
  await tapLook(page,1602);
  await expect.poll(() => page.evaluate(value => {const current=window.SFHSDoomMobileControls.snapshot();return current.game.x!==value.x||current.game.y!==value.y;}, beforeMove.game), { timeout:5000 }).toBeTruthy();
  await expect.poll(() => page.evaluate(value => window.SFHSDoomMobileControls.snapshot().game.ammo<value, beforeMove.game.ammo), { timeout:5000 }).toBeTruthy();
  await pointer(page,'move','pointerup',1601,move.x+move.width/2,move.y+move.height*.1);

  await page.evaluate(value=>{const look=document.querySelector('[data-sfhs-control-id="look"]'),primary=document.querySelector('[data-sfhs-control-id="primary"]'),id=1701;look.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:id,button:0,buttons:1,clientX:value.lx,clientY:value.ly}));look.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:id,button:0,buttons:0,clientX:value.lx,clientY:value.ly}));primary.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'touch',pointerId:1702,button:0,buttons:1,clientX:value.fx,clientY:value.fy}));},{lx,ly,fx:fire.x+fire.width/2,fy:fire.y+fire.height/2});
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.lookTapFire.lastCancelReason), { timeout:5000 }).toBe('dedicated-fire');
  await pointer(page,'primary','pointerup',1702,fire.x+fire.width/2,fire.y+fire.height/2);
  await page.waitForTimeout(500);
  const final=await page.evaluate(()=>window.SFHSDoomMobileControls.snapshot());
  expect(final.adapter.lookTapFire.queued).toBe(0); expect(final.adapter.lookTapFire.releaseTicPending).toBeFalsy(); expect(final.input.heldMask).toBe(0); expect(final.controller.activePointers).toEqual([]);
  writeFileSync(resolve(evidenceBase,'look-tap-queue-concurrency-proof.json'),JSON.stringify({queued,beforeMove,final},null,2)+'\n');
});

test('Touch Event fallback recognizes a LOOK tap', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'PointerEvent', { configurable: true, value: undefined }); });
  await open(page); await start(page); await page.waitForTimeout(2500);
  const before = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot());
  expect(before.controller.route).toBe('touch');
  await page.locator('[data-sfhs-control-id="look"]').evaluate(element => {
    const rect=element.getBoundingClientRect(),touch={identifier:1801,clientX:rect.x+rect.width/2,clientY:rect.y+rect.height/2};
    for(const type of ['touchstart','touchend']){const event=new Event(type,{bubbles:true,cancelable:true});Object.defineProperty(event,'changedTouches',{value:[touch]});element.dispatchEvent(event);}
  });
  await expect.poll(() => page.evaluate(value => window.SFHSDoomMobileControls.snapshot().game.ammo<value,before.game.ammo), {timeout:5000}).toBeTruthy();
  const after=await page.evaluate(()=>window.SFHSDoomMobileControls.snapshot());
  expect(after.adapter.lookTapFire.acceptedTaps).toBe(1); expect(after.adapter.lookTapFire.route).toBe('none'); expect(after.input.heldMask).toBe(0);
  writeFileSync(resolve(evidenceBase,'look-tap-touch-fallback-proof.json'),JSON.stringify({before,after},null,2)+'\n');
});

test('fullscreen rejection and unsupported paths still start exactly once', async ({ browser }) => {
  for (const mode of ['reject','unsupported']) {
    const page=await browser.newPage(); const hygiene=watchPage(page); await open(page,{width:400,height:844},mode); await start(page);
    const value=await page.evaluate(()=>({fullscreen:window.SFHS_WASM_TEST.fullscreenState(),calls:window.__sfhsFullscreenCalls,mainInvocations:window.SFHS_P6_STATE.mainInvocations}));
    expect(value.mainInvocations).toBe(1);
    if(mode==='reject')expect(value.fullscreen.rejected).toBeTruthy();else{expect(value.fullscreen.supported).toBeFalsy();expect(value.calls).toEqual([]);}
    expect(hygiene.pageErrors).toEqual([]); expect(hygiene.consoleErrors.filter(message=>/unhandled|uncaught/i.test(message))).toEqual([]);
    await page.close();
  }
});

test('landscape retains every required region and unchanged control profile', async ({ page }) => {
  await open(page,{width:800,height:360}); await start(page);
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&scrollY===0)).toBeTruthy();
  for(const selector of ['#game-region','#minimap-region','#control-deck','#doom-status-region']){const value=await box(page,selector);expect(value.x).toBeGreaterThanOrEqual(0);expect(value.y).toBeGreaterThanOrEqual(0);expect(value.x+value.width).toBeLessThanOrEqual(801);expect(value.y+value.height).toBeLessThanOrEqual(361);}
  const snapshot=await page.evaluate(()=>window.SFHSDoomMobileControls.snapshot());
  expect(snapshot.packageIdentity).toBe('@sfhs/mobile-controls@b02336c4'); expect(snapshot.controller.schema).toBe('sfhs.mobile-controls-state@1');
  expect(Object.keys(snapshot.controller.controls).sort()).toEqual(['interact','look','map','menu','modifier','move','primary','weapon-next','weapon-previous']);
  await page.screenshot({path:resolve(screenshotRoot,'800x360-landscape.png')});
});
