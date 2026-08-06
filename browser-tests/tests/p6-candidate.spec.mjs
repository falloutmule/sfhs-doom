import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

const candidateUrl = new URL('../../dist/sfhs-doom-android.html', import.meta.url).href;
const samsungRepairUrl = new URL('../../dist/sfhs-doom-android-samsung-repair.html', import.meta.url).href;
const hasSamsungRepair = existsSync(new URL('../../dist/sfhs-doom-android-samsung-repair.html', import.meta.url));

test('P6 Android candidate starts locally without HTTP requests or page errors', async ({ page }) => {
  const errors=[]; const requests=[];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('request', request => { if (/^https?:/i.test(request.url())) requests.push(request.url()); });
  await page.setViewportSize({ width: 400, height: 844 });
  await page.goto(candidateUrl, { waitUntil: 'load', timeout: 60000 });
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-runtime', 'ready', { timeout: 60000 });
  expect(await page.evaluate(() => typeof window.Module.HEAP32)).toBe('object');
  expect(await page.evaluate(() => { const pointer=window.Module.ccall('sfhs_mobile_state_snapshot', 'number', [], []); return [pointer, window.Module.HEAP32[pointer >> 2]]; })).toEqual([expect.any(Number), 1]);
  await page.getByRole('button', { name: 'Start Doom' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-main', 'started', { timeout: 15000 });
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_STATE.audioContextState), { timeout: 15000 }).toBe('running');
  await expect(page.locator('#minimap-canvas')).toBeVisible();
  expect(errors).toEqual([]); expect(requests).toEqual([]);
});

test('P6 Samsung repair candidate rejects an active black game canvas', async ({ page }) => {
  test.skip(!hasSamsungRepair, 'Samsung repair artifact has not been built in this checkout.');
  const errors=[]; const requests=[];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('request', request => { if (/^https?:/i.test(request.url())) requests.push(request.url()); });
  await page.setViewportSize({ width: 400, height: 844 });
  await page.goto(samsungRepairUrl, { waitUntil: 'load', timeout: 60000 });
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-runtime', 'ready', { timeout: 60000 });
  await page.getByRole('button', { name: 'Start Doom' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-main', 'started', { timeout: 15000 });
  await expect(page.getByRole('button', { name: 'Start Doom' })).toBeHidden();
  await expect(page.locator('#status')).toContainText('Doom running');
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_STATE.audioContextState), { timeout: 15000 }).toBe('running');
  await expect.poll(async () => page.evaluate(() => {
    const value=window.SFHS_P6_DIAGNOSTICS.snapshot();
    return Boolean(value.hudState?.active && value.hudState?.updates > 0 && value.logicalFramebuffer?.nonblackCount > 0 && value.canvas.visibleReadback?.supported && value.canvas.visibleReadback.nonblackCount > 0);
  }), { timeout: 15000 }).toBeTruthy();
  expect(errors).toEqual([]); expect(requests).toEqual([]);
});
