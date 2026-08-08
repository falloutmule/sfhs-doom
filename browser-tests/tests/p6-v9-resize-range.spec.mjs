import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

const candidate = new URL('../../dist/sfhs-doom-android-sfhs-controls-v9.html', import.meta.url);

async function open(page) {
  test.skip(!existsSync(candidate), 'V9 artifact has not been built.');
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

async function shrinkToFloor(page, controlId, pointerId, dx, dy) {
  const control = page.locator(`[data-sfhs-control-id="${controlId}"]`);
  const grip = control.locator('[data-sfhs-resize-handle]');
  const rect = await grip.boundingBox();
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  await pointer(page, `[data-sfhs-control-id="${controlId}"] [data-sfhs-resize-handle]`, 'pointerdown', pointerId, x, y);
  await pointer(page, `[data-sfhs-control-id="${controlId}"] [data-sfhs-resize-handle]`, 'pointermove', pointerId, x + dx, y + dy);
  await pointer(page, `[data-sfhs-control-id="${controlId}"] [data-sfhs-resize-handle]`, 'pointerup', pointerId, x + dx, y + dy);
  return control;
}

test('V9 Doom-specific floors permit compact WPN controls and a thinner LOOK rail', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Edit controls' }).click();

  const look = page.locator('[data-sfhs-control-id="look"]');
  const beforeLookHeight = await look.evaluate(element => parseFloat(getComputedStyle(element, '::before').height));
  await shrinkToFloor(page, 'look', 901, 0, -120);
  const afterLookHeight = await look.evaluate(element => parseFloat(getComputedStyle(element, '::before').height));
  const lookRect = await look.boundingBox();
  expect(lookRect.height).toBeCloseTo(844 * .05, 0);
  expect(lookRect.height).toBeLessThan(844 * .08);
  expect(afterLookHeight).toBeLessThan(beforeLookHeight);

  for (const [id, pointerId] of [['weapon-previous', 902], ['weapon-next', 903]]) {
    const control = await shrinkToFloor(page, id, pointerId, -100, -100);
    const rect = await control.boundingBox();
    expect(rect.width).toBeCloseTo(400 * .06, 0);
    expect(rect.height).toBeCloseTo(844 * .05, 0);
    expect(rect.width).toBeLessThan(400 * .08);
    expect(rect.height).toBeLessThan(844 * .08);
  }

  await page.getByRole('button', { name: 'Save layout' }).click();
  const saved = await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile().layouts.portrait);
  await page.reload({ waitUntil: 'load', timeout: 60000 });
  const restored = await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile().layouts.portrait);
  expect(restored).toEqual(saved);
  await page.evaluate(() => window.SFHS_WASM_TEST.setMobileControlsProfile(window.SFHS_WASM_TEST.mobileControlsProfile()));
  const imported = await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile().layouts.portrait);
  expect(imported).toEqual(saved);
});

test('V9 preserves full-current-width LOOK calibration and product smoke', async ({ page }) => {
  const pageErrors = [];
  const httpRequests = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('request', request => {
    if (/^https?:/i.test(request.url())) httpRequests.push(request.url());
  });
  await open(page);
  await page.getByRole('button', { name: 'Start Doom' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-main', 'started', { timeout: 15000 });
  const look = await page.locator('[data-sfhs-control-id="look"]').boundingBox();
  await pointer(page, '[data-sfhs-control-id="look"]', 'pointerdown', 904, look.x, look.y + look.height / 2);
  await pointer(page, '[data-sfhs-control-id="look"]', 'pointermove', 904, look.x + look.width, look.y + look.height / 2);
  await page.waitForTimeout(100);
  await pointer(page, '[data-sfhs-control-id="look"]', 'pointerup', 904, look.x + look.width, look.y + look.height / 2);
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.lastNonzeroLookCount), { timeout: 10000 }).toBe(4096);
  expect(await page.evaluate(() => window.SFHSDoomMobileControls.snapshot().adapter.lastNonzeroLookNormalized)).toBeCloseTo(1, 5);
  expect(pageErrors).toEqual([]);
  expect(httpRequests).toEqual([]);
});
