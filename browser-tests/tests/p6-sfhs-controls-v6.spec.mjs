import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

const candidate = new URL('../../dist/sfhs-doom-android-sfhs-controls-v6.html', import.meta.url);

async function start(page) {
  test.skip(!existsSync(candidate), 'V6 artifact has not been built.');
  await page.setViewportSize({ width: 400, height: 844 });
  await page.goto(candidate.href, { waitUntil: 'load', timeout: 60000 });
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-runtime', 'ready', { timeout: 60000 });
  await page.getByRole('button', { name: 'Start Doom' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-main', 'started', { timeout: 15000 });
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().game?.active), { timeout: 15000 }).toBe(1);
}

async function pointer(page, selector, type, pointerId, x, y) {
  await page.locator(selector).evaluate((element, value) => element.dispatchEvent(new PointerEvent(value.type, {
    bubbles: true, cancelable: true, pointerType: 'touch', pointerId: value.pointerId,
    button: 0, buttons: value.type === 'pointerup' || value.type === 'pointercancel' ? 0 : 1,
    pressure: value.type === 'pointerup' || value.type === 'pointercancel' ? 0 : 0.5,
    clientX: value.x, clientY: value.y, screenX: value.x, screenY: value.y,
  })), { type, pointerId, x, y });
}

test('V6 mounts one shared runtime with calibrated full-width LOOK', async ({ page }) => {
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('request', request => { if (/^https?:/i.test(request.url())) requests.push(request.url()); });
  await start(page);
  const before = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot());
  expect(before.packageIdentity).toBe('@sfhs/mobile-controls@b02336c4');
  expect(before.controller.activePointers).toEqual([]);
  expect(await page.locator('[data-sfhs-control-id]').count()).toBe(9);
  expect(await page.locator('[data-mobile-action]').count()).toBe(0);
  const look = await page.locator('[data-sfhs-control-id="look"]').boundingBox();
  const fire = await page.locator('[data-sfhs-control-id="primary"]').boundingBox();
  const use = await page.locator('[data-sfhs-control-id="interact"]').boundingBox();
  expect(look.height).toBeGreaterThanOrEqual(60);
  expect(look.width).toBeGreaterThan(look.height * 2);
  expect(fire.y + fire.height).toBeLessThanOrEqual(look.y + 2);
  expect(use.y).toBeGreaterThanOrEqual(look.y + look.height - 2);
  await pointer(page, '[data-sfhs-control-id="look"]', 'pointerdown', 401, look.x, look.y + look.height / 2);
  await pointer(page, '[data-sfhs-control-id="look"]', 'pointermove', 401, look.x + look.width, look.y + look.height / 2);
  await page.waitForTimeout(100);
  await pointer(page, '[data-sfhs-control-id="look"]', 'pointerup', 401, look.x + look.width, look.y + look.height / 2);
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.lastNonzeroLookCount), { timeout: 10000 }).toBe(4096);
  const after = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot());
  expect(after.adapter.lastNonzeroLookNormalized).toBeCloseTo(1, 5);
  expect(after.adapter.lastNonzeroLookCount).toBe(4096);
  expect(after.game.angle).not.toBe(before.game.angle);
  expect(errors).toEqual([]); expect(requests).toEqual([]);
});

test('V6 routes shared MOVE, LOOK, FIRE, pulses, and lifecycle release through Doom', async ({ page }) => {
  await start(page);
  const rect = async id => page.locator(`[data-sfhs-control-id="${id}"]`).boundingBox();
  const move = await rect('move'), look = await rect('look'), fire = await rect('primary');
  const before = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot().game);
  await pointer(page, '[data-sfhs-control-id="move"]', 'pointerdown', 501, move.x + move.width / 2, move.y + move.height / 2);
  await pointer(page, '[data-sfhs-control-id="move"]', 'pointermove', 501, move.x + move.width / 2, move.y + move.height * .1);
  await pointer(page, '[data-sfhs-control-id="look"]', 'pointerdown', 502, look.x + 5, look.y + look.height / 2);
  await pointer(page, '[data-sfhs-control-id="primary"]', 'pointerdown', 503, fire.x + fire.width / 2, fire.y + fire.height / 2);
  await pointer(page, '[data-sfhs-control-id="look"]', 'pointermove', 502, look.x + 25, look.y + look.height / 2);
  await expect.poll(async () => page.evaluate((start) => { const game=window.SFHSDoomMobileControls.snapshot().game; return game.x !== start.x || game.y !== start.y; }, before), { timeout: 4000 }).toBeTruthy();
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.lastNonzeroLookCount), { timeout: 4000 }).not.toBe(0);
  await expect.poll(async () => page.evaluate((ammo) => window.SFHSDoomMobileControls.snapshot().game.ammo < ammo, before.ammo), { timeout: 4000 }).toBeTruthy();
  const during = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot());
  expect(during.input.consumer.mouse).toBeGreaterThan(0);
  await pointer(page, '[data-sfhs-control-id="move"]', 'pointerup', 501, move.x + move.width / 2, move.y + move.height * .1);
  await pointer(page, '[data-sfhs-control-id="look"]', 'pointerup', 502, look.x + 25, look.y + look.height / 2);
  await pointer(page, '[data-sfhs-control-id="primary"]', 'pointerup', 503, fire.x + fire.width / 2, fire.y + fire.height / 2);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().controller.activePointers.length), { timeout: 5000 }).toBe(0);
  const menu = await rect('menu');
  await pointer(page, '[data-sfhs-control-id="menu"]', 'pointerdown', 504, menu.x + 4, menu.y + 4);
  await pointer(page, '[data-sfhs-control-id="menu"]', 'pointerup', 504, menu.x + 4, menu.y + 4);
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.totalPulseCounts.menu), { timeout: 10000 }).toBeGreaterThan(0);
  const interact = await rect('interact'), modifier = await rect('modifier');
  const beforeUtility = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot().input.consumer.keydown);
  await pointer(page, '[data-sfhs-control-id="interact"]', 'pointerdown', 505, interact.x + 4, interact.y + 4);
  await pointer(page, '[data-sfhs-control-id="modifier"]', 'pointerdown', 506, modifier.x + 4, modifier.y + 4);
  await expect.poll(async () => page.evaluate((value) => window.SFHSDoomMobileControls.snapshot().input.consumer.keydown > value, beforeUtility), { timeout: 4000 }).toBeTruthy();
  await pointer(page, '[data-sfhs-control-id="interact"]', 'pointerup', 505, interact.x + 4, interact.y + 4);
  await pointer(page, '[data-sfhs-control-id="modifier"]', 'pointerup', 506, modifier.x + 4, modifier.y + 4);
});

test('V6 profile editor is shared and portrait layout remains contained', async ({ page }) => {
  test.skip(!existsSync(candidate), 'V6 artifact has not been built.');
  await page.setViewportSize({ width: 400, height: 844 });
  await page.goto(candidate.href, { waitUntil: 'load', timeout: 60000 });
  await page.getByRole('button', { name: 'Edit controls' }).click();
  await expect(page.locator('#edit-panel')).toHaveClass(/is-open/);
  await expect(page.locator('#sfhs-mobile-controls-root')).toHaveAttribute('data-editing', 'true');
  await page.locator('#look-sensitivity').fill('1.25');
  await page.getByRole('button', { name: 'Save layout' }).click();
  const profile = await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile());
  expect(profile.settings.relativeSensitivity).toBeCloseTo(1.25);
  expect(profile.schema).toBe('sfhs.mobile-controls-profile@1');
  for (const id of ['move', 'look', 'primary', 'interact', 'modifier']) {
    const box = await page.locator(`[data-sfhs-control-id="${id}"]`).boundingBox();
    expect(box.y).toBeGreaterThan(490);
    expect(box.y + box.height).toBeLessThan(770);
  }
});
