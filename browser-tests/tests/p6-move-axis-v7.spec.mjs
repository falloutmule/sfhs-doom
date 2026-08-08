import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

const candidate = new URL('../../dist/sfhs-doom-android-sfhs-controls-v7.html', import.meta.url);

async function dispatch(page, type, pointerId, x, y) {
  await page.locator('[data-sfhs-control-id="move"]').evaluate((element, value) => element.dispatchEvent(new PointerEvent(value.type, {
    bubbles: true, cancelable: true, pointerType: 'touch', pointerId: value.pointerId,
    button: 0, buttons: value.type === 'pointerup' ? 0 : 1,
    clientX: value.x, clientY: value.y,
  })), { type, pointerId, x, y });
}

test('V7 maps the lower move-pad half to actual Doom backward movement', async ({ page }) => {
  test.skip(!existsSync(candidate), 'V7 artifact has not been built.');
  await page.setViewportSize({ width: 400, height: 844 });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(candidate.href, { waitUntil: 'load', timeout: 60000 });
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-runtime', 'ready', { timeout: 60000 });
  await page.getByRole('button', { name: 'Start Doom' }).click();
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls?.snapshot().game?.active), { timeout: 15000 }).toBe(1);
  const move = await page.locator('[data-sfhs-control-id="move"]').boundingBox();
  const state = () => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().game);
  const beforeForward = await state();
  await dispatch(page, 'pointerdown', 701, move.x + move.width / 2, move.y + move.height / 2);
  await dispatch(page, 'pointermove', 701, move.x + move.width / 2, move.y + move.height * .1);
  await expect.poll(async () => (await state()).x > beforeForward.x, { timeout: 4000 }).toBeTruthy();
  await dispatch(page, 'pointerup', 701, move.x + move.width / 2, move.y + move.height * .1);
  await page.waitForTimeout(100);
  const beforeBackward = await state();
  await dispatch(page, 'pointerdown', 702, move.x + move.width / 2, move.y + move.height / 2);
  await dispatch(page, 'pointermove', 702, move.x + move.width / 2, move.y + move.height * .9);
  await expect.poll(async () => (await state()).x < beforeBackward.x, { timeout: 4000 }).toBeTruthy();
  await dispatch(page, 'pointerup', 702, move.x + move.width / 2, move.y + move.height * .9);
  await expect.poll(() => page.evaluate(() => window.SFHSDoomMobileControls.snapshot().controller.activePointers.length), { timeout: 4000 }).toBe(0);
  expect(errors).toEqual([]);
});
