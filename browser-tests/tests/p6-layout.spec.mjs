import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

const shellFile = new URL('../../dist/sfhs-doom-android-sfhs-controls-v6.html', import.meta.url);
const shellUrl = shellFile.href;

async function openShell(page, viewport) {
  test.skip(!existsSync(shellFile), 'V6 artifact has not been built.');
  await page.setViewportSize(viewport);
  await page.goto(shellUrl, { waitUntil: 'load', timeout: 60000 });
  await expect.poll(() => page.evaluate(() => Boolean(window.SFHSDoomMobileControls)), { timeout: 60000 }).toBeTruthy();
  await expect(page.locator('#sfhs-shell')).toBeVisible();
}

for (const viewport of [
  { width: 360, height: 800, name: '360x800 portrait' },
  { width: 400, height: 844, name: '400x844 portrait' },
  { width: 800, height: 360, name: '800x360 landscape' },
]) {
  test(`${viewport.name} keeps the P6 shell regions in the viewport`, async ({ page }) => {
    await openShell(page, viewport);
    for (const selector of ['#game-region', '#minimap-region', '#control-deck', '#info-strip']) {
      const box = await page.locator(selector).boundingBox();
      expect(box, `${selector} has a box`).not.toBeNull();
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBeTruthy();
  });
}

test('editor drags and resizes a control without leaving edit mode', async ({ page }) => {
  await openShell(page, { width: 400, height: 844 });
  await page.getByRole('button', { name: 'Edit controls' }).click();
  const move = page.locator('[data-sfhs-control-id="move"]');
  const before = await move.boundingBox();
  await move.hover({ position: { x: before.width / 2, y: before.height / 2 } });
  await page.mouse.down(); await page.mouse.move(before.x + before.width / 2 + 20, before.y + before.height / 2 + 22); await page.mouse.up();
  const dragged = await move.boundingBox();
  expect(dragged.x).toBeGreaterThan(before.x + 10);
  const handle = move.locator('[data-sfhs-resize-handle]');
  const beforeResize = await move.boundingBox();
  await handle.hover(); await page.mouse.down(); await page.mouse.move(beforeResize.x + beforeResize.width + 18, beforeResize.y + beforeResize.height + 18); await page.mouse.up();
  const resized = await move.boundingBox();
  expect(resized.width).toBeGreaterThan(beforeResize.width);
  await expect(page.locator('#edit-panel')).toHaveClass(/is-open/);
});

test('mobile profile can be read and restored through its versioned contract', async ({ page }) => {
  await openShell(page, { width: 360, height: 800 });
  const before = await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile());
  const next = structuredClone(before); next.settings.opacity = 0.42; next.layouts.portrait.primary.x = 0.72;
  await page.evaluate((value) => window.SFHS_WASM_TEST.setMobileControlsProfile(value), next);
  const restored = await page.evaluate(() => window.SFHS_WASM_TEST.mobileControlsProfile());
  expect(restored.schema).toBe('sfhs.mobile-controls-profile@1');
  expect(restored.settings.opacity).toBe(0.42);
  expect(restored.layouts.portrait.primary.x).toBe(0.72);
});
