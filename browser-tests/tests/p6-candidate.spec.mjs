import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

const candidateUrl = new URL('../../dist/sfhs-doom-android.html', import.meta.url).href;
const samsungRepairUrl = new URL('../../dist/sfhs-doom-android-samsung-repair-v2.html', import.meta.url).href;
const hasSamsungRepair = existsSync(new URL('../../dist/sfhs-doom-android-samsung-repair-v2.html', import.meta.url));

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

test('P6 Samsung v2 candidate exports presentation and input diagnostics', async ({ page }) => {
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
    return Boolean(value.hudState?.active && value.hudState?.updates > 0 && value.logicalFramebuffer?.nonblackCount > 0 && value.presentation?.presents > 0 && value.canvas.visibleReadback?.supported && value.canvas.visibleReadback.nonblackCount > 0);
  }), { timeout: 15000 }).toBeTruthy();
  expect(await page.evaluate(() => typeof window.Module._sfhs_mobile_input_set_held)).toBe('function');
  expect(await page.evaluate(() => typeof window.Module._sfhs_mobile_present_debug_snapshot)).toBe('function');
  expect(errors).toEqual([]); expect(requests).toEqual([]);
});

test('P6 Samsung v2 touch bridge posts native SDL input and downloads a frozen diagnostic', async ({ page }) => {
  test.skip(!hasSamsungRepair, 'Samsung repair artifact has not been built in this checkout.');
  await page.setViewportSize({ width: 400, height: 844 });
  await page.goto(samsungRepairUrl, { waitUntil: 'load', timeout: 60000 });
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-runtime', 'ready', { timeout: 60000 });
  await page.getByRole('button', { name: 'Start Doom' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-main', 'started', { timeout: 15000 });
  await page.locator('[data-control="move"]').evaluate((element) => {
    const rect=element.getBoundingClientRect(), options={pointerId:71,pointerType:'touch',bubbles:true,clientX:rect.left+rect.width/2,clientY:rect.top+rect.height*.2};
    element.dispatchEvent(new PointerEvent('pointerdown', options));
    element.dispatchEvent(new PointerEvent('pointerup', options));
  });
  await page.getByRole('button', { name: 'FIRE' }).evaluate((element) => {
    element.dispatchEvent(new PointerEvent('pointerdown',{pointerId:72,pointerType:'touch',bubbles:true}));
    element.dispatchEvent(new PointerEvent('pointerup',{pointerId:72,pointerType:'touch',bubbles:true}));
  });
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.snapshot().native?.postedKeydown || 0), { timeout: 5000 }).toBeGreaterThan(0);
  const input=await page.evaluate(() => window.SFHS_P6_INPUT.snapshot());
  expect(input.native.heldMask).toBe(0);
  expect(input.native.setHeldCalls).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Diagnostics' }).evaluate(element => element.click());
  await page.getByRole('button', { name: 'Capture diagnostics' }).evaluate(element => element.click());
  expect(await page.locator('#diagnostics-json').inputValue()).toContain('"input"');
  const download=page.waitForEvent('download'); await page.getByRole('button', { name: 'Download JSON' }).evaluate(element => element.click());
  expect((await download).suggestedFilename()).toMatch(/^sfhs-doom-samsung-diagnostics-.*\.json$/);
});
