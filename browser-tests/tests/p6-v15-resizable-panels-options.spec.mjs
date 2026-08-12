import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { analyzePngCoverage } from '../support/full-frame-coverage.mjs';

test.describe.configure({ mode: 'serial' });
test.setTimeout(120000);

const candidate = new URL('../../dist/sfhs-doom-android-sfhs-controls-v15.html', import.meta.url);
const evidenceBase = resolve('..', 'test-results', 'P06', 'P6-063');
const screenshotRoot = resolve(evidenceBase, 'screenshots');
const controlIds = ['move','primary','look','interact','modifier','menu','map','weapon-previous','weapon-next'];

function watchPage(page) {
  const pageErrors = [], consoleErrors = [], externalRequests = [], failedRequests = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('request', request => { if (/^https?:/i.test(request.url())) externalRequests.push(request.url()); });
  page.on('requestfailed', request => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ''}`));
  return { pageErrors, consoleErrors, externalRequests, failedRequests };
}

async function open(page, viewport = { width: 400, height: 844 }) {
  test.skip(!existsSync(candidate), 'V15 artifact has not been built.');
  await page.addInitScript(() => {
    window.__sfhsTestHidden = false;
    Object.defineProperty(document, 'hidden', { configurable:true, get:() => window.__sfhsTestHidden });
    window.__setSfhsTestHidden = value => { window.__sfhsTestHidden = Boolean(value); document.dispatchEvent(new Event('visibilitychange')); };
    Object.defineProperty(Element.prototype, 'requestFullscreen', { configurable:true, value:function requestFullscreen() {
      Object.defineProperty(document, 'fullscreenElement', { configurable:true, get:() => this });
      queueMicrotask(() => document.dispatchEvent(new Event('fullscreenchange')));
      return new Promise(() => {});
    }});
  });
  await page.setViewportSize(viewport);
  await page.goto(candidate.href, { waitUntil:'load', timeout:60000 });
  await expect.poll(() => page.evaluate(() => Boolean(window.SFHSDoomMobileControls)), { timeout:60000 }).toBeTruthy();
  await expect(page.locator('#sfhs-fullscreen-root')).toHaveAttribute('data-sfhs-fullscreen-app-root', 'v15');
}

async function start(page, renderer = 'auto') {
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-runtime', 'ready', { timeout:60000 });
  await page.locator('#renderer-mode').selectOption(renderer);
  await page.getByRole('button', { name:'Start Fullscreen' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-main', 'started', { timeout:15000 });
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().game?.active), { timeout:20000 }).toBe(1);
  await expect.poll(() => page.evaluate(() => window.Module?.SDL2?.audioContext?.state || null), { timeout:15000 }).toBe('running');
}

async function box(page, selector) {
  const value = await page.locator(selector).boundingBox();
  expect(value, `${selector} has geometry`).not.toBeNull();
  return value;
}

async function pointerSelector(page, selector, type, pointerId, x, y) {
  await page.locator(selector).evaluate((element, value) => element.dispatchEvent(new PointerEvent(value.type, {
    bubbles:true, cancelable:true, pointerType:'touch', pointerId:value.pointerId, button:0,
    buttons:value.type === 'pointerup' || value.type === 'pointercancel' ? 0 : 1,
    clientX:value.x, clientY:value.y, screenX:value.x, screenY:value.y,
  })), { type, pointerId, x, y });
}

async function dragHandle(page, selector, pointerId, dx, dy) {
  const grip = await box(page, selector), x = grip.x + grip.width / 2, y = grip.y + grip.height / 2;
  await pointerSelector(page, selector, 'pointerdown', pointerId, x, y);
  await pointerSelector(page, selector, 'pointermove', pointerId, x + dx, y + dy);
  await pointerSelector(page, selector, 'pointerup', pointerId, x + dx, y + dy);
}

async function pointerControl(page, id, type, pointerId, x, y) {
  return pointerSelector(page, `[data-sfhs-control-id="${id}"]`, type, pointerId, x, y);
}

async function tapLook(page, pointerId, { dx = 0, dy = 0, hold = 0 } = {}) {
  const look = await box(page, '[data-sfhs-control-id="look"]'), x = look.x + look.width / 2, y = look.y + look.height / 2;
  await pointerControl(page, 'look', 'pointerdown', pointerId, x, y);
  if (dx || dy) await pointerControl(page, 'look', 'pointermove', pointerId, x + dx, y + dy);
  if (hold) await page.waitForTimeout(hold);
  await pointerControl(page, 'look', 'pointerup', pointerId, x + dx, y + dy);
}

async function setRange(page, selector, value) {
  await page.locator(selector).evaluate((element, next) => {
    element.value = String(next);
    element.dispatchEvent(new Event('input', { bubbles:true }));
    element.dispatchEvent(new Event('change', { bubbles:true }));
  }, value);
}

async function openSettings(page) { await page.getByRole('button', { name:'Open settings' }).click(); await expect(page.locator('#utility-panel')).toHaveClass(/is-open/); }
async function beginPanelEdit(page) { await openSettings(page); await page.getByRole('button', { name:'Resize panels' }).click(); await expect(page.locator('#panel-edit-toolbar')).toHaveClass(/is-open/); }

function assertHygiene(hygiene) {
  expect(hygiene.pageErrors).toEqual([]); expect(hygiene.externalRequests).toEqual([]); expect(hygiene.failedRequests).toEqual([]);
  expect(hygiene.consoleErrors.filter(value => /fatal|abort|uncaught|unhandled|out of memory/i.test(value))).toEqual([]);
}

test.beforeAll(() => mkdirSync(screenshotRoot, { recursive:true }));

for (const item of [
  { name:'360x800-default-portrait', viewport:{ width:360, height:800 }, renderer:'auto', expectedWorld:[360,270] },
  { name:'400x844-default-portrait', viewport:{ width:400, height:844 }, renderer:'compatibility', expectedWorld:[400,300] },
]) test(`V15 preserves V14 portrait defaults (${item.name})`, async ({ page }) => {
  const hygiene = watchPage(page); await open(page, item.viewport); await start(page, item.renderer);
  await expect.poll(() => page.evaluate(() => window.SFHS_WASM_TEST.nativeHudSnapshot()?.effectiveWorldWidth || 0), { timeout:10000 }).toBe(320);
  const game = await box(page, '#game-region'), minimap = await box(page, '#minimap-region'), hudCss = await box(page, '#doom-status-canvas');
  expect([Math.round(game.width),Math.round(game.height)]).toEqual(item.expectedWorld);
  expect(minimap.width).toBeCloseTo(item.viewport.width, 0); expect(minimap.height).toBeGreaterThanOrEqual(72);
  expect(hudCss.width / hudCss.height).toBeCloseTo(10, 2); expect(hudCss.width).toBeCloseTo(item.viewport.width, 0);
  const presentation = await page.evaluate(() => window.SFHS_WASM_TEST.presentationSnapshot());
  const hud = await page.evaluate(() => window.SFHS_WASM_TEST.nativeHudSnapshot());
  const ui = await page.evaluate(() => window.SFHS_WASM_TEST.mobileUiSnapshot());
  expect(presentation).toEqual(expect.objectContaining({ version:3, orientation:'portrait', canvasAttributeWidth:320, canvasAttributeHeight:200, hudBackingWidth:320, hudBackingHeight:32 }));
  expect(hud).toEqual(expect.objectContaining({ width:320, height:32, effectiveWorldWidth:320, effectiveWorldHeight:200, effectiveScreenblocks:11, internalStatusActive:0 }));
  expect(ui).toEqual(expect.objectContaining({ schema:'sfhs.doom-mobile-ui@1', storageKey:'sfhsDoom.mobileUi.v1', customized:false }));
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && scrollY === 0)).toBeTruthy();
  await page.screenshot({ path:resolve(screenshotRoot, `${item.name}.png`) });
  writeFileSync(resolve(evidenceBase, `${item.name}.json`), JSON.stringify({ presentation, hud, ui, hygiene }, null, 2) + '\n');
  assertHygiene(hygiene);
});

for (const item of [
  { name:'800x360-default-landscape', viewport:{ width:800, height:360 }, renderer:'auto' },
  { name:'915x412-default-landscape', viewport:{ width:915, height:412 }, renderer:'compatibility' },
]) test(`V15 preserves centered V14 landscape defaults (${item.name})`, async ({ page }) => {
  const hygiene = watchPage(page); await open(page, item.viewport); await start(page, item.renderer);
  await expect.poll(() => page.evaluate(() => window.SFHS_WASM_TEST.nativeHudSnapshot()?.effectiveWorldWidth || 0), { timeout:10000 }).toBe(320);
  let coverage; await expect.poll(async () => { coverage = analyzePngCoverage(await page.locator('#canvas').screenshot()); return coverage.pass; }, { timeout:15000 }).toBeTruthy();
  const presentation = await page.evaluate(() => window.SFHS_WASM_TEST.presentationSnapshot());
  expect(Math.abs(presentation.canvasCenterOffsetX)).toBeLessThanOrEqual(1); expect(Math.abs(presentation.canvasCenterOffsetY)).toBeLessThanOrEqual(1); expect(Math.abs(presentation.hudCenterOffsetX)).toBeLessThanOrEqual(1);
  expect(presentation.canvasRectWidth / presentation.canvasRectHeight).toBeCloseTo(8 / 5, 2); expect(presentation.hudCssWidth / presentation.hudCssHeight).toBeCloseTo(10, 2);
  for (const selector of ['#game-region','#minimap-region','#control-deck','#doom-status-region', ...controlIds.map(id => `[data-sfhs-control-id="${id}"]`)]) {
    const value = await box(page, selector); expect(value.x).toBeGreaterThanOrEqual(-1); expect(value.y).toBeGreaterThanOrEqual(-1); expect(value.x + value.width).toBeLessThanOrEqual(item.viewport.width + 1); expect(value.y + value.height).toBeLessThanOrEqual(item.viewport.height + 1);
  }
  await page.screenshot({ path:resolve(screenshotRoot, `${item.name}.png`) });
  writeFileSync(resolve(evidenceBase, `${item.name}.json`), JSON.stringify({ presentation, coverage, hygiene }, null, 2) + '\n'); assertHygiene(hygiene);
});

test('portrait minimap and authentic HUD resize with Save, Cancel, clamps, and reload persistence', async ({ page }) => {
  const hygiene = watchPage(page); await open(page); await start(page); const initial = await page.evaluate(() => window.SFHS_WASM_TEST.mobileUiSnapshot());
  await beginPanelEdit(page); await expect(page.locator('#minimap-canvas')).toBeVisible(); await expect(page.locator('#minimap-resize-handle')).toBeVisible(); await expect(page.locator('#hud-resize-handle')).toBeVisible();
  await page.screenshot({ path:resolve(screenshotRoot, '400x844-panel-resize-mode.png') });
  const beforeMini = await box(page, '#minimap-region'), beforeHud = await box(page, '#doom-status-canvas'), beforeControls = await page.evaluate(ids => Object.fromEntries(ids.map(id => { const rect=document.querySelector(`[data-sfhs-control-id="${id}"]`).getBoundingClientRect(); return [id,{x:rect.x,y:rect.y,width:rect.width,height:rect.height}]; })), controlIds);
  await dragHandle(page, '#minimap-resize-handle', 6301, 0, -55); await dragHandle(page, '#hud-resize-handle', 6302, -90, 0);
  const smallerMini = await box(page, '#minimap-region'), smallerHud = await box(page, '#doom-status-canvas');
  expect(smallerMini.height).toBeLessThan(beforeMini.height - 30); expect(smallerHud.width).toBeLessThan(beforeHud.width - 60); expect(smallerHud.width / smallerHud.height).toBeCloseTo(10, 2);
  expect(await page.evaluate(ids => Object.fromEntries(ids.map(id => { const rect=document.querySelector(`[data-sfhs-control-id="${id}"]`).getBoundingClientRect(); return [id,{x:rect.x,y:rect.y,width:rect.width,height:rect.height}]; })), controlIds)).toEqual(beforeControls);
  expect(await page.evaluate(() => window.SFHS_WASM_TEST.nativeHudSnapshot())).toEqual(expect.objectContaining({ width:320, height:32 }));
  await page.screenshot({ path:resolve(screenshotRoot, '400x844-smaller-minimap-hud.png') });
  await page.getByRole('button', { name:'Save', exact:true }).click(); await expect(page.locator('#minimap-resize-handle')).toBeHidden();
  const saved = await page.evaluate(() => window.SFHS_WASM_TEST.mobileUiSnapshot()); expect(saved.customized).toBeTruthy();
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('sfhsDoom.mobileUi.v1')))).toEqual(saved.preferences);
  await page.reload({ waitUntil:'load' }); await expect.poll(() => page.evaluate(() => Boolean(window.SFHS_WASM_TEST))).toBeTruthy();
  expect((await page.evaluate(() => window.SFHS_WASM_TEST.mobileUiSnapshot())).preferences).toEqual(saved.preferences);
  await start(page); await beginPanelEdit(page); await dragHandle(page, '#minimap-resize-handle', 6303, 0, 5000); await dragHandle(page, '#hud-resize-handle', 6304, -5000, 0);
  const clamped = await page.evaluate(() => window.SFHS_WASM_TEST.presentationSnapshot()); expect(clamped.minimapCssHeight).toBeGreaterThanOrEqual(71); expect(clamped.hudCssWidth).toBeGreaterThanOrEqual(239);
  await page.getByRole('button', { name:'Cancel', exact:true }).click(); const cancelled = await page.evaluate(() => window.SFHS_WASM_TEST.mobileUiSnapshot()); expect(cancelled.preferences).toEqual(saved.preferences);
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('sfhsDoom.mobileUi.v1')))).toEqual(saved.preferences);
  writeFileSync(resolve(evidenceBase, 'portrait-panel-resize-proof.json'), JSON.stringify({ initial, saved, clamped, cancelled, hygiene }, null, 2) + '\n'); assertHygiene(hygiene);
});

test('portrait and landscape panel layouts remain independent through rotation and active edit cancels safely', async ({ page }) => {
  await open(page); await start(page); await beginPanelEdit(page); await dragHandle(page, '#minimap-resize-handle', 6401, 0, -35); await page.getByRole('button', { name:'Save', exact:true }).click();
  const portrait = await page.evaluate(() => window.SFHS_WASM_TEST.mobileUiSnapshot().preferences.panels.portrait);
  await page.setViewportSize({ width:915, height:412 }); await expect.poll(() => page.evaluate(() => window.SFHS_WASM_TEST.mobileUiSnapshot().orientation)).toBe('landscape');
  await beginPanelEdit(page); await page.screenshot({ path:resolve(screenshotRoot, '800x360-panel-resize-mode.png') }); await dragHandle(page, '#minimap-resize-handle', 6402, 45, 20); await dragHandle(page, '#hud-resize-handle', 6403, 100, 0); await page.getByRole('button', { name:'Save', exact:true }).click();
  const landscape = await page.evaluate(() => window.SFHS_WASM_TEST.mobileUiSnapshot().preferences.panels.landscape); await page.screenshot({ path:resolve(screenshotRoot, '915x412-customized-landscape.png') });
  await page.setViewportSize({ width:400, height:844 }); await expect.poll(() => page.evaluate(() => window.SFHS_WASM_TEST.mobileUiSnapshot().orientation)).toBe('portrait'); expect(await page.evaluate(() => window.SFHS_WASM_TEST.mobileUiSnapshot().preferences.panels.portrait)).toEqual(portrait);
  await page.setViewportSize({ width:915, height:412 }); await expect.poll(() => page.evaluate(() => window.SFHS_WASM_TEST.mobileUiSnapshot().orientation)).toBe('landscape'); expect(await page.evaluate(() => window.SFHS_WASM_TEST.mobileUiSnapshot().preferences.panels.landscape)).toEqual(landscape);
  await beginPanelEdit(page); await dragHandle(page, '#minimap-resize-handle', 6404, -20, -10); await page.setViewportSize({ width:400, height:844 }); await expect.poll(() => page.evaluate(() => window.SFHS_WASM_TEST.mobileUiSnapshot().panelEdit.lifecycle)).toBe('idle'); expect(await page.evaluate(() => window.SFHS_WASM_TEST.mobileUiSnapshot().panelEdit.lastCancelReason)).toBe('orientation-change');
  const final = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot()); expect(final.input.heldMask).toBe(0); expect(final.controller.activePointers).toEqual([]);
  writeFileSync(resolve(evidenceBase, 'orientation-panel-isolation-proof.json'), JSON.stringify({ portrait, landscape, final }, null, 2) + '\n');
});

test('LOOK tap settings control firing, duration, tolerance, persistence, and corrupt recovery', async ({ page }) => {
  const hygiene = watchPage(page); await open(page); await start(page); await page.waitForTimeout(2500); await openSettings(page);
  await page.locator('#look-tap-enabled').uncheck(); await page.getByRole('button', { name:'Close settings' }).click(); const disabledBefore = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot()); await tapLook(page, 6501); await page.waitForTimeout(450); const disabledAfter = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot()); expect(disabledAfter.game.ammo).toBe(disabledBefore.game.ammo); expect(disabledAfter.adapter.lookTapFire.lastCancelReason).toBe('disabled');
  await openSettings(page); await page.locator('#look-tap-enabled').check(); await setRange(page, '#look-tap-duration', 150); await page.getByRole('button', { name:'Close settings' }).click(); const shortBefore = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot()); await tapLook(page, 6502, { hold:220 }); await page.waitForTimeout(300); expect((await page.evaluate(() => window.SFHSDoomMobileControls.snapshot())).game.ammo).toBe(shortBefore.game.ammo);
  await openSettings(page); await setRange(page, '#look-tap-duration', 300); await page.getByRole('button', { name:'Close settings' }).click(); await tapLook(page, 6503, { hold:220 }); await expect.poll(() => page.evaluate(value => window.SFHSDoomMobileControls.snapshot().game.ammo < value, shortBefore.game.ammo), { timeout:5000 }).toBeTruthy();
  await page.waitForTimeout(450); await openSettings(page); await setRange(page, '#look-tap-tolerance', 6); await page.getByRole('button', { name:'Close settings' }).click(); const tightBefore = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot()); await tapLook(page, 6504, { dx:10 }); await page.waitForTimeout(450); const tightAfter = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot()); expect(tightAfter.game.ammo).toBe(tightBefore.game.ammo); expect(tightAfter.game.angle).not.toBe(tightBefore.game.angle); expect(tightAfter.adapter.lookTapFire.lastCancelReason).toBe('movement');
  await openSettings(page); await setRange(page, '#look-tap-tolerance', 16); await page.getByRole('button', { name:'Close settings' }).click(); await tapLook(page, 6505, { dx:10 }); await expect.poll(() => page.evaluate(value => window.SFHSDoomMobileControls.snapshot().game.ammo < value, tightAfter.game.ammo), { timeout:5000 }).toBeTruthy();
  const persisted = await page.evaluate(() => window.SFHS_WASM_TEST.mobileUiSnapshot().preferences); await page.reload({ waitUntil:'load' }); await expect.poll(() => page.evaluate(() => Boolean(window.SFHS_WASM_TEST))).toBeTruthy(); expect(await page.evaluate(() => window.SFHS_WASM_TEST.mobileUiSnapshot().preferences)).toEqual(persisted);
  await page.evaluate(() => localStorage.setItem('sfhsDoom.mobileUi.v1', '{"schema":"wrong","panels":{"portrait":{"minimapHeight":null}}}')); await page.reload({ waitUntil:'load' }); await expect.poll(() => page.evaluate(() => Boolean(window.SFHS_WASM_TEST))).toBeTruthy(); const corrupt = await page.evaluate(() => window.SFHS_WASM_TEST.mobileUiSnapshot()); expect(corrupt.storageStatus).toBe('invalid-defaults'); expect(corrupt.preferences.lookTapFire).toEqual({ enabled:true, maxDurationMs:300, slopCssPx:12 });
  await start(page); await openSettings(page); await page.screenshot({ path:resolve(screenshotRoot, 'look-tap-options.png') }); writeFileSync(resolve(evidenceBase, 'look-tap-options-proof.json'), JSON.stringify({ disabledBefore, disabledAfter, shortBefore, tightBefore, tightAfter, persisted, corrupt, hygiene }, null, 2) + '\n'); assertHygiene(hygiene);
});

test('clean settings, editor exclusivity, diagnostics, MOVE, dedicated FIRE, and authentic HUD remain correct', async ({ page }) => {
  const hygiene = watchPage(page); await open(page, { width:800, height:360 }); await start(page); await page.waitForTimeout(2500); await openSettings(page);
  for (const name of ['Play','Display layout','Touch controls','LOOK tap fire','Control profile','Advanced']) await expect(page.getByText(name, { exact:true })).toBeVisible();
  const utility = await box(page, '#utility-panel'), minimap = await box(page, '#minimap-region'); expect(utility.x).toBeLessThanOrEqual(minimap.x + minimap.width + 1); await page.screenshot({ path:resolve(screenshotRoot, 'cleaned-settings-menu.png') }); expect(await page.evaluate(() => { const panel=document.getElementById('utility-panel'); panel.scrollTop=panel.scrollHeight; return panel.scrollHeight>panel.clientHeight&&panel.scrollTop>0; })).toBeTruthy();
  await page.getByText('Touch controls', { exact:true }).click(); await page.getByRole('button', { name:'Edit controls' }).click(); await expect(page.locator('#edit-panel')).toHaveClass(/is-open/); await expect(page.locator('#panel-edit-toolbar')).not.toHaveClass(/is-open/); await page.getByRole('button', { name:'Cancel', exact:true }).click();
  await openSettings(page); await page.getByText('Advanced', { exact:true }).click(); await page.getByRole('button', { name:'Diagnostics' }).click(); await expect(page.locator('#diagnostic-output')).toContainText('sfhs.doom-mobile-ui@1'); await page.getByRole('button', { name:'Close', exact:true }).click();
  const move = await box(page, '[data-sfhs-control-id="move"]'), fire = await box(page, '[data-sfhs-control-id="primary"]'), before = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot());
  await pointerControl(page,'move','pointerdown',6601,move.x+move.width/2,move.y+move.height/2); await pointerControl(page,'move','pointermove',6601,move.x+move.width/2,move.y+move.height*.1); await pointerControl(page,'primary','pointerdown',6602,fire.x+fire.width/2,fire.y+fire.height/2);
  await expect.poll(() => page.evaluate(value => { const now=window.SFHSDoomMobileControls.snapshot(); return now.game.ammo<value.ammo&&(now.game.x!==value.x||now.game.y!==value.y); }, before.game), { timeout:5000 }).toBeTruthy();
  await pointerControl(page,'primary','pointerup',6602,fire.x+fire.width/2,fire.y+fire.height/2); await pointerControl(page,'move','pointerup',6601,move.x+move.width/2,move.y+move.height*.1); await page.waitForTimeout(300);
  const final = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot()); expect(final.input.heldMask).toBe(0); expect(final.controller.activePointers).toEqual([]); expect(final.hud).toEqual(expect.objectContaining({ width:320, height:32, internalStatusActive:0 })); expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && scrollY === 0)).toBeTruthy();
  await beginPanelEdit(page); await dragHandle(page, '#hud-resize-handle', 6603, 90, 0); await page.getByRole('button', { name:'Save', exact:true }).click(); const resizedHud = await box(page, '#doom-status-canvas'); expect(resizedHud.width).toBeGreaterThan(350); expect(resizedHud.width / resizedHud.height).toBeCloseTo(10, 2);
  const map = await box(page, '[data-sfhs-control-id="map"]'); await pointerControl(page,'map','pointerdown',6604,map.x+map.width/2,map.y+map.height/2); await pointerControl(page,'map','pointerup',6604,map.x+map.width/2,map.y+map.height/2); await page.waitForTimeout(300);
  await page.screenshot({ path:resolve(screenshotRoot, 'automap-resized-authentic-hud.png') }); writeFileSync(resolve(evidenceBase, 'settings-controls-regression-proof.json'), JSON.stringify({ utility, minimap, before, final, hygiene }, null, 2) + '\n'); assertHygiene(hygiene);
});
