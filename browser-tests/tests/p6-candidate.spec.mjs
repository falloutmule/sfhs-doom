import { test, expect } from '@playwright/test';

const candidateUrl = new URL('../../dist/sfhs-doom-android.html', import.meta.url).href;

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
