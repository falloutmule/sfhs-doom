import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { analyzePngCoverage } from '../support/full-frame-coverage.mjs';

test.describe.configure({ mode: 'serial' });
test.setTimeout(120000);

const candidate = new URL('../../dist/sfhs-doom-android-sfhs-controls-v14.html', import.meta.url);
const evidenceBase = resolve('..', 'test-results', 'P06', 'P6-062');
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

async function open(page, viewport = { width: 800, height: 360 }) {
  test.skip(!existsSync(candidate), 'V14 artifact has not been built.');
  await page.addInitScript(() => {
    window.__sfhsTrustedClick = false;
    document.addEventListener('click', event => { window.__sfhsTrustedClick = event.isTrusted; queueMicrotask(() => { window.__sfhsTrustedClick = false; }); }, true);
    Object.defineProperty(Element.prototype, 'requestFullscreen', { configurable: true, value: function requestFullscreen() {
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => this });
      queueMicrotask(() => document.dispatchEvent(new Event('fullscreenchange')));
      return new Promise(() => {});
    }});
  });
  await page.setViewportSize(viewport);
  await page.goto(candidate.href, { waitUntil: 'load', timeout: 60000 });
  await expect.poll(() => page.evaluate(() => Boolean(window.SFHSDoomMobileControls)), { timeout: 60000 }).toBeTruthy();
  await expect(page.locator('#sfhs-fullscreen-root')).toHaveAttribute('data-sfhs-fullscreen-app-root', 'v14');
}

async function start(page, renderer = 'auto') {
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-runtime', 'ready', { timeout: 60000 });
  await page.locator('#renderer-mode').selectOption(renderer);
  await page.getByRole('button', { name: 'Start Fullscreen' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-main', 'started', { timeout: 15000 });
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().game?.active), { timeout: 20000 }).toBe(1);
  await expect.poll(() => page.evaluate(() => window.Module?.SDL2?.audioContext?.state || null), { timeout:15000 }).toBe('running');
}

async function box(page, selector) {
  const value = await page.locator(selector).boundingBox();
  expect(value, `${selector} has geometry`).not.toBeNull();
  return value;
}

function intersectionArea(a, b) {
  return Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
    * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
}

async function pointerSelector(page, selector, type, pointerId, x, y) {
  await page.locator(selector).evaluate((element, value) => element.dispatchEvent(new PointerEvent(value.type, {
    bubbles:true, cancelable:true, pointerType:'touch', pointerId:value.pointerId,
    button:0, buttons:value.type === 'pointerup' ? 0 : 1,
    clientX:value.x, clientY:value.y, screenX:value.x, screenY:value.y,
  })), { type, pointerId, x, y });
}

async function drag(page, selector, pointerId, dx, dy) {
  const before = await box(page, selector);
  const x = before.x + before.width / 2, y = before.y + before.height / 2;
  await pointerSelector(page, selector, 'pointerdown', pointerId, x, y);
  await pointerSelector(page, selector, 'pointermove', pointerId, x + dx, y + dy);
  await pointerSelector(page, selector, 'pointerup', pointerId, x + dx, y + dy);
  return { before, after: await box(page, selector) };
}

async function resize(page, id, pointerId, dx, dy) {
  const selector = `[data-sfhs-control-id="${id}"] [data-sfhs-resize-handle]`;
  const before = await box(page, `[data-sfhs-control-id="${id}"]`);
  const grip = await box(page, selector), x = grip.x + grip.width / 2, y = grip.y + grip.height / 2;
  await pointerSelector(page, selector, 'pointerdown', pointerId, x, y);
  await pointerSelector(page, selector, 'pointermove', pointerId, x + dx, y + dy);
  await pointerSelector(page, selector, 'pointerup', pointerId, x + dx, y + dy);
  return { before, after: await box(page, `[data-sfhs-control-id="${id}"]`) };
}

test.beforeAll(() => mkdirSync(screenshotRoot, { recursive: true }));

for (const item of [
  { name:'800x360-auto', viewport:{ width:800, height:360 }, renderer:'auto' },
  { name:'915x412-compatibility', viewport:{ width:915, height:412 }, renderer:'compatibility' },
]) {
  test(`V14 centers the complete landscape frame and HUD (${item.name})`, async ({ page }) => {
    const hygiene = watchPage(page);
    await open(page, item.viewport); await start(page, item.renderer);
    await expect.poll(() => page.evaluate(() => window.SFHS_WASM_TEST.presentationSnapshot().sdl?.presents || 0), { timeout:10000 }).toBeGreaterThan(10);
    let coverage;
    await expect.poll(async () => { coverage = analyzePngCoverage(await page.locator('#canvas').screenshot()); return coverage.pass; }, { timeout:15000 }).toBeTruthy();
    const presentation = await page.evaluate(() => window.SFHS_WASM_TEST.presentationSnapshot());
    expect(presentation).toEqual(expect.objectContaining({ version:2, orientation:'landscape', canvasAttributeWidth:320, canvasAttributeHeight:200 }));
    expect(presentation.sdl).toEqual(expect.objectContaining({ outputWidth:320, outputHeight:200 }));
    expect(Math.abs(presentation.canvasCenterOffsetX)).toBeLessThanOrEqual(1);
    expect(Math.abs(presentation.canvasCenterOffsetY)).toBeLessThanOrEqual(1);
    expect(Math.abs(presentation.hudCenterOffsetX)).toBeLessThanOrEqual(1);
    expect(presentation.canvasRectWidth / presentation.canvasRectHeight).toBeCloseTo(8 / 5, 2);
    expect(coverage.pass).toBeTruthy();
    const hud = await page.evaluate(() => window.SFHS_WASM_TEST.nativeHudSnapshot());
    expect(hud).toEqual(expect.objectContaining({ width:320, height:32, effectiveWorldWidth:320, effectiveWorldHeight:200, effectiveScreenblocks:11, internalStatusActive:0 }));
    for (const selector of ['#game-region','#minimap-region','#control-deck','#doom-status-region', ...controlIds.map(id => `[data-sfhs-control-id="${id}"]`)]) {
      const value = await box(page, selector);
      expect(value.x).toBeGreaterThanOrEqual(-1); expect(value.y).toBeGreaterThanOrEqual(-1);
      expect(value.x + value.width).toBeLessThanOrEqual(item.viewport.width + 1);
      expect(value.y + value.height).toBeLessThanOrEqual(item.viewport.height + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && scrollY === 0)).toBeTruthy();
    await page.screenshot({ path:resolve(screenshotRoot, `${item.name}.png`) });
    writeFileSync(resolve(evidenceBase, `${item.name}-proof.json`), JSON.stringify({ presentation, coverage, hud, hygiene }, null, 2) + '\n');
    expect(hygiene.pageErrors).toEqual([]); expect(hygiene.externalRequests).toEqual([]); expect(hygiene.failedRequests).toEqual([]);
    expect(hygiene.consoleErrors.filter(value => /fatal|abort|uncaught|unhandled|out of memory/i.test(value))).toEqual([]);
  });
}

test('landscape editor exposes controls, saves only landscape, persists, and cancels', async ({ page }) => {
  const hygiene = watchPage(page);
  await open(page); await start(page);
  const beforeProfile = await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile());
  await page.getByRole('button', { name:'Open settings' }).click();
  await page.getByRole('button', { name:'Edit controls' }).click();
  await expect(page.locator('#edit-panel')).toHaveClass(/is-open/);
  await expect(page.locator('#minimap-canvas')).toHaveCSS('visibility', 'hidden');
  const editor = await box(page, '#edit-panel');
  const deck = await box(page, '#control-deck');
  expect(intersectionArea(editor, deck)).toBe(0);
  for (const id of controlIds) {
    const value = await box(page, `[data-sfhs-control-id="${id}"]`);
    expect(intersectionArea(editor, value), `${id} remains directly editable`).toBe(0);
    await expect(page.locator(`[data-sfhs-control-id="${id}"]`)).toBeVisible();
  }
  const moved = await drag(page, '[data-sfhs-control-id="move"]', 2101, 12, -8);
  expect(moved.after.x).toBeGreaterThan(moved.before.x + 6);
  const moveSized = await resize(page, 'move', 2102, 14, 12);
  expect(moveSized.after.width).toBeGreaterThan(moveSized.before.width + 8);
  const lookSized = await resize(page, 'look', 2103, 16, 10);
  expect(lookSized.after.width).toBeGreaterThan(lookSized.before.width + 8);
  await page.screenshot({ path:resolve(screenshotRoot, '800x360-edit-mode.png') });
  await page.getByRole('button', { name:'Save layout' }).click();
  const saved = await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile());
  expect(saved.layouts.portrait).toEqual(beforeProfile.layouts.portrait);
  expect(saved.layouts.landscape.move).not.toEqual(beforeProfile.layouts.landscape.move);
  expect(saved.layouts.landscape.look).not.toEqual(beforeProfile.layouts.landscape.look);
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('sfhsDoom.mobileControls.v2'))).layouts.landscape).toEqual(saved.layouts.landscape);

  await page.setViewportSize({ width:400, height:844 });
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().controller.orientation)).toBe('portrait');
  expect((await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile())).layouts.portrait).toEqual(beforeProfile.layouts.portrait);
  await page.setViewportSize({ width:800, height:360 });
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().controller.orientation)).toBe('landscape');
  const restoredMove = await box(page, '[data-sfhs-control-id="move"]');
  expect(restoredMove.x).toBeCloseTo(moved.after.x, -1);

  await page.getByRole('button', { name:'Open settings' }).click(); await page.getByRole('button', { name:'Edit controls' }).click();
  await drag(page, '[data-sfhs-control-id="primary"]', 2104, -18, 0);
  await page.getByRole('button', { name:'Cancel' }).click();
  expect(await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile())).toEqual(saved);
  await expect(page.locator('#minimap-canvas')).toHaveCSS('visibility', 'visible');
  expect(await page.evaluate(() => window.SFHSDoomMobileControls.snapshot().controller.activePointers)).toEqual([]);
  writeFileSync(resolve(evidenceBase, 'landscape-editor-proof.json'), JSON.stringify({ editor, deck, moved, moveSized, lookSized, beforeProfile, saved, hygiene }, null, 2) + '\n');
  expect(hygiene.pageErrors).toEqual([]); expect(hygiene.externalRequests).toEqual([]); expect(hygiene.failedRequests).toEqual([]);
});

test('portrait geometry and V13 LOOK tap-to-FIRE remain intact', async ({ page }) => {
  const hygiene = watchPage(page);
  await open(page, { width:400, height:844 }); await start(page);
  await page.waitForTimeout(2500);
  const game = await box(page, '#game-region');
  expect(game.x).toBeCloseTo(0, 0); expect(game.y).toBeCloseTo(0, 0);
  expect(game.width).toBeCloseTo(400, 0); expect(game.height).toBeCloseTo(300, 0);
  const before = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot());
  const look = await box(page, '[data-sfhs-control-id="look"]'), x=look.x+look.width/2, y=look.y+look.height/2;
  await pointerSelector(page, '[data-sfhs-control-id="look"]', 'pointerdown', 2201, x, y);
  await pointerSelector(page, '[data-sfhs-control-id="look"]', 'pointerup', 2201, x, y);
  await expect.poll(() => page.evaluate(value => window.SFHSDoomMobileControls.snapshot().game.ammo < value, before.game.ammo), { timeout:5000 }).toBeTruthy();
  const after = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot());
  expect(after.adapter.lookTapFire.acceptedTaps).toBeGreaterThan(before.adapter.lookTapFire.acceptedTaps);
  expect(after.input.heldMask).toBe(0); expect(after.controller.activePointers).toEqual([]);
  await page.screenshot({ path:resolve(screenshotRoot, '400x844-portrait-regression.png') });
  expect(hygiene.pageErrors).toEqual([]); expect(hygiene.externalRequests).toEqual([]); expect(hygiene.failedRequests).toEqual([]);
});
