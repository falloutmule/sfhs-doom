import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

const candidate = new URL('../../dist/sfhs-doom-android-sfhs-controls-v8.html', import.meta.url);

async function open(page) {
  test.skip(!existsSync(candidate), 'V8 artifact has not been built.');
  await page.setViewportSize({ width: 400, height: 844 });
  await page.goto(candidate.href, { waitUntil: 'load', timeout: 60000 });
  await expect.poll(() => page.evaluate(() => Boolean(window.SFHSDoomMobileControls)), { timeout: 60000 }).toBeTruthy();
}

async function pointer(page, selector, type, pointerId, x, y) {
  await page.locator(selector).evaluate((element, value) => element.dispatchEvent(new PointerEvent(value.type, {
    bubbles: true, cancelable: true, pointerType: 'touch', pointerId: value.pointerId,
    button: 0, buttons: value.type === 'pointerup' || value.type === 'pointercancel' ? 0 : 1,
    pressure: value.type === 'pointerup' || value.type === 'pointercancel' ? 0 : 0.5,
    clientX: value.x, clientY: value.y, screenX: value.x, screenY: value.y,
  })), { type, pointerId, x, y });
}

test('V8 LOOK rail and shared editor make body drag and grip resize phone-usable', async ({ page }) => {
  await open(page);
  const look = page.locator('[data-sfhs-control-id="look"]');
  const fire = page.locator('[data-sfhs-control-id="primary"]');
  const use = page.locator('[data-sfhs-control-id="interact"]');
  const initial = await look.boundingBox();
  const fireRect = await fire.boundingBox();
  const useRect = await use.boundingBox();
  expect(initial.height).toBeGreaterThanOrEqual(60);
  expect(initial.height).toBeLessThanOrEqual(85);
  expect(await look.evaluate(element => getComputedStyle(element, '::before').height)).toBe('38px');
  expect(fireRect.y + fireRect.height).toBeLessThanOrEqual(initial.y + 2);
  expect(useRect.y).toBeGreaterThanOrEqual(initial.y + initial.height - 2);

  await page.getByRole('button', { name: 'Edit controls' }).click();
  const grip = look.locator('[data-sfhs-resize-handle]');
  const gripRect = await grip.boundingBox();
  expect(gripRect.width).toBeGreaterThanOrEqual(30);
  expect(gripRect.height).toBeGreaterThanOrEqual(30);

  await pointer(page, '[data-sfhs-control-id="look"]', 'pointerdown', 801, initial.x + initial.width / 2, initial.y + initial.height / 2);
  await expect.poll(() => look.evaluate(element => getComputedStyle(element).outlineWidth)).toBe('4px');
  await pointer(page, '[data-sfhs-control-id="look"]', 'pointermove', 801, initial.x + initial.width / 2 - 18, initial.y + initial.height / 2 - 12);
  await pointer(page, '[data-sfhs-control-id="look"]', 'pointerup', 801, initial.x + initial.width / 2 - 18, initial.y + initial.height / 2 - 12);
  const dragged = await look.boundingBox();
  expect(dragged.x).toBeLessThan(initial.x - 10);
  expect(dragged.y).toBeLessThan(initial.y - 8);

  const gripAfterDrag = await grip.boundingBox();
  const gripSelector = '[data-sfhs-control-id="look"] [data-sfhs-resize-handle]';
  await pointer(page, gripSelector, 'pointerdown', 802, gripAfterDrag.x + gripAfterDrag.width / 2, gripAfterDrag.y + gripAfterDrag.height / 2);
  await pointer(page, gripSelector, 'pointermove', 802, gripAfterDrag.x + gripAfterDrag.width / 2 + 28, gripAfterDrag.y + gripAfterDrag.height / 2 + 20);
  await pointer(page, gripSelector, 'pointerup', 802, gripAfterDrag.x + gripAfterDrag.width / 2 + 28, gripAfterDrag.y + gripAfterDrag.height / 2 + 20);
  const resized = await look.boundingBox();
  expect(resized.width).toBeGreaterThan(dragged.width + 20);
  expect(resized.height).toBeGreaterThan(dragged.height + 14);

  await page.getByRole('button', { name: 'Save layout' }).click();
  const saved = await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile().layouts.portrait.look);
  await page.reload({ waitUntil: 'load', timeout: 60000 });
  await expect.poll(() => page.evaluate(() => Boolean(window.SFHSDoomMobileControls)), { timeout: 60000 }).toBeTruthy();
  const reloaded = await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile().layouts.portrait.look);
  expect(reloaded).toEqual(saved);
});

test('V8 retains one shared runtime and full-width relative1d LOOK calibration', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Start Doom' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-main', 'started', { timeout: 15000 });
  expect(await page.locator('[data-sfhs-control-id]').count()).toBe(9);
  const look = await page.locator('[data-sfhs-control-id="look"]').boundingBox();
  await pointer(page, '[data-sfhs-control-id="look"]', 'pointerdown', 803, look.x, look.y + look.height / 2);
  await pointer(page, '[data-sfhs-control-id="look"]', 'pointermove', 803, look.x + look.width, look.y + look.height / 2);
  await page.waitForTimeout(100);
  await pointer(page, '[data-sfhs-control-id="look"]', 'pointerup', 803, look.x + look.width, look.y + look.height / 2);
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.lastNonzeroLookCount), { timeout: 10000 }).toBe(4096);
  const snapshot = await page.evaluate(() => window.SFHSDoomMobileControls.snapshot());
  expect(snapshot.adapter.lastNonzeroLookNormalized).toBeCloseTo(1, 5);
  expect(await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile().settings.relativeSensitivity)).toBe(1);
});
