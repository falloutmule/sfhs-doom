import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

const candidate = new URL('../../dist/sfhs-doom-android-samsung-input-v3.html', import.meta.url);
const candidateUrl = candidate.href;
const hasCandidate = existsSync(candidate);

async function start(page) {
  test.skip(!hasCandidate, 'Samsung input V3 artifact has not been built in this checkout.');
  await page.setViewportSize({ width: 400, height: 844 });
  await page.goto(candidateUrl, { waitUntil: 'load', timeout: 60000 });
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-runtime', 'ready', { timeout: 60000 });
  await page.getByRole('button', { name: 'Start Doom' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-main', 'started', { timeout: 15000 });
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.readGameState()?.active), { timeout: 15000 }).toBe(1);
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_STATE.audioContextState), { timeout: 15000 }).toBe('running');
  await expect.poll(() => page.evaluate(() => { const value=window.SFHS_P6_DIAGNOSTICS.snapshot();return Boolean(value.hudState?.updates>0&&value.logicalFramebuffer?.nonblackCount>0&&value.presentation?.presents>0); }), { timeout: 15000 }).toBeTruthy();
  const buildCalls = await page.evaluate(() => window.SFHS_P6_INPUT.consumerDebug().buildTiccmdCalls);
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.consumerDebug().buildTiccmdCalls), { timeout: 15000 }).toBeGreaterThan(buildCalls);
}

async function dispatch(page, selector, type, options) {
  await page.locator(selector).evaluate((element, value) => {
    element.dispatchEvent(new PointerEvent(value.type, { bubbles: true, cancelable: true, pointerType: 'touch', button: 0, buttons: value.type === 'pointerup' || value.type === 'pointercancel' ? 0 : 1, ...value.options }));
  }, { type, options });
}

test('V3 accumulates subpixel LOOK movement until a native mouse event is posted', async ({ page }) => {
  const errors=[];const requests=[];page.on('pageerror',error=>errors.push(String(error)));page.on('request',request=>{if(/^https?:/i.test(request.url()))requests.push(request.url());});
  await start(page);
  const rect = await page.locator('[data-control="look"]').boundingBox();
  const before = await page.evaluate(() => window.SFHS_P6_INPUT.nativeDebug().postedMouse);
  const x = rect.x + rect.width / 2, y = rect.y + rect.height / 2;
  await dispatch(page, '[data-control="look"]', 'pointerdown', { pointerId: 301, clientX: x, clientY: y });
  for (let index = 1; index <= 8; index += 1) {
    await dispatch(page, '[data-control="look"]', 'pointermove', { pointerId: 301, clientX: x + index * 0.25, clientY: y });
  }
  await dispatch(page, '[data-control="look"]', 'pointerup', { pointerId: 301, clientX: x + 2, clientY: y });
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.nativeDebug().postedMouse)).toBeGreaterThan(before);
  const events = await page.evaluate(() => window.SFHS_P6_INPUT.snapshot().telemetry.events.filter(value => value.operation === 'look_accumulate'));
  expect(events.some(value => value.rawDeltaX === 0.25 && value.integerPosted === 0)).toBeTruthy();
  expect(events.some(value => value.integerPosted !== 0)).toBeTruthy();
  expect(errors).toEqual([]);expect(requests).toEqual([]);
});

test('V3 treats pointer-capture failure as nonfatal for MOVE LOOK and FIRE', async ({ page }) => {
  await start(page);
  await page.locator('#input-test-toggle').evaluate(element => element.click());
  await page.evaluate(() => { HTMLElement.prototype.setPointerCapture = () => { throw new DOMException('synthetic capture failure', 'InvalidStateError'); }; });
  const move = await page.locator('[data-control="move"]').boundingBox();
  const look = await page.locator('[data-control="look"]').boundingBox();
  const fire = await page.locator('[data-control="fire"]').boundingBox();
  const before = await page.evaluate(() => window.SFHS_P6_INPUT.nativeDebug());
  await dispatch(page, '[data-control="move"]', 'pointerdown', { pointerId: 311, clientX: move.x + move.width / 2, clientY: move.y + move.height * 0.2 });
  await dispatch(page, '[data-control="move"]', 'pointerup', { pointerId: 311, clientX: move.x + move.width / 2, clientY: move.y + move.height * 0.2 });
  await dispatch(page, '[data-control="look"]', 'pointerdown', { pointerId: 312, clientX: look.x + look.width / 2, clientY: look.y + look.height / 2 });
  await dispatch(page, '[data-control="look"]', 'pointermove', { pointerId: 312, clientX: look.x + look.width / 2 + 12, clientY: look.y + look.height / 2 });
  await dispatch(page, '[data-control="look"]', 'pointerup', { pointerId: 312, clientX: look.x + look.width / 2 + 12, clientY: look.y + look.height / 2 });
  await dispatch(page, '[data-control="fire"]', 'pointerdown', { pointerId: 313, clientX: fire.x + fire.width / 2, clientY: fire.y + fire.height / 2 });
  await page.waitForTimeout(180);
  await dispatch(page, '[data-control="fire"]', 'pointerup', { pointerId: 313, clientX: fire.x + fire.width / 2, clientY: fire.y + fire.height / 2 });
  const after = await page.evaluate(() => window.SFHS_P6_INPUT.snapshot());
  expect(after.telemetry.lastPointerCapture.success).toBeFalsy();
  expect(after.telemetry.lastPointerCapture.error).toContain('InvalidStateError');
  expect(after.native.setHeldCalls).toBeGreaterThan(before.setHeldCalls);
  expect(after.native.postedMouse).toBeGreaterThan(before.postedMouse);
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.snapshot().telemetry.outcomes.fire?.pass), { timeout: 3000 }).toBeTruthy();
  console.log('SFHS_V3_FIRE=' + JSON.stringify(await page.evaluate(() => window.SFHS_P6_INPUT.snapshot().telemetry.outcomes.fire)));
});

test('V3 real PointerEvent MOVE changes player position', async ({ page }) => {
  await start(page);
  await page.locator('#input-test-toggle').evaluate(element => element.click());
  const rect = await page.locator('[data-control="move"]').boundingBox();
  const before = await page.evaluate(() => ({ state: window.SFHS_P6_INPUT.readGameState(), native: window.SFHS_P6_INPUT.nativeDebug(), consumer: window.SFHS_P6_INPUT.consumerDebug(), present: window.SFHS_P6_DIAGNOSTICS.snapshot().presentation }));
  const x = rect.x + rect.width / 2, y = rect.y + rect.height * 0.15;
  await dispatch(page, '[data-control="move"]', 'pointerdown', { pointerId: 321, clientX: x, clientY: y });
  await page.waitForTimeout(800);
  await dispatch(page, '[data-control="move"]', 'pointerup', { pointerId: 321, clientX: x, clientY: y });
  const after = await page.evaluate(() => ({ state: window.SFHS_P6_INPUT.readGameState(), native: window.SFHS_P6_INPUT.nativeDebug(), consumer: window.SFHS_P6_INPUT.consumerDebug(), present: window.SFHS_P6_DIAGNOSTICS.snapshot().presentation }));
  expect(after.state.x !== before.state.x || after.state.y !== before.state.y, JSON.stringify({ before, after })).toBeTruthy();
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.snapshot().telemetry.outcomes.move?.pass), { timeout: 3000 }).toBeTruthy();
  console.log('SFHS_V3_MOVE=' + JSON.stringify(await page.evaluate(() => window.SFHS_P6_INPUT.snapshot().telemetry.outcomes.move)));
});

test('V3 real PointerEvent LOOK posts mouse input and changes player angle', async ({ page }) => {
  await start(page);
  await page.locator('#input-test-toggle').evaluate(element => element.click());
  const rect = await page.locator('[data-control="look"]').boundingBox();
  const before = await page.evaluate(() => ({ state: window.SFHS_P6_INPUT.readGameState(), native: window.SFHS_P6_INPUT.nativeDebug(), consumer: window.SFHS_P6_INPUT.consumerDebug() }));
  const x = rect.x + rect.width / 2, y = rect.y + rect.height / 2;
  await dispatch(page, '[data-control="look"]', 'pointerdown', { pointerId: 331, clientX: x, clientY: y });
  for (let index = 1; index <= 10; index += 1) await dispatch(page, '[data-control="look"]', 'pointermove', { pointerId: 331, clientX: x + index * 3, clientY: y });
  await page.waitForTimeout(300);
  await dispatch(page, '[data-control="look"]', 'pointerup', { pointerId: 331, clientX: x + 30, clientY: y });
  const after = await page.evaluate(() => ({ state: window.SFHS_P6_INPUT.readGameState(), native: window.SFHS_P6_INPUT.nativeDebug(), consumer: window.SFHS_P6_INPUT.consumerDebug() }));
  expect(after.native.postedMouse).toBeGreaterThan(before.native.postedMouse);
  expect(after.state.angle, JSON.stringify({ before, after })).not.toBe(before.state.angle);
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.snapshot().telemetry.outcomes.look?.pass), { timeout: 3000 }).toBeTruthy();
  console.log('SFHS_V3_LOOK=' + JSON.stringify(await page.evaluate(() => window.SFHS_P6_INPUT.snapshot().telemetry.outcomes.look)));
});

test('V3 releases every held action after pointer cancellation', async ({ page }) => {
  await start(page);
  const move = await page.locator('[data-control="move"]').boundingBox();
  const fire = await page.locator('[data-control="fire"]').boundingBox();
  await dispatch(page, '[data-control="move"]', 'pointerdown', { pointerId: 341, clientX: move.x + move.width / 2, clientY: move.y + move.height * 0.15 });
  await dispatch(page, '[data-control="fire"]', 'pointerdown', { pointerId: 342, clientX: fire.x + fire.width / 2, clientY: fire.y + fire.height / 2 });
  expect(await page.evaluate(() => window.SFHS_P6_INPUT.nativeDebug().heldMask)).not.toBe(0);
  await dispatch(page, '[data-control="move"]', 'pointercancel', { pointerId: 341, clientX: move.x + move.width / 2, clientY: move.y + move.height * 0.15 });
  await dispatch(page, '[data-control="fire"]', 'pointercancel', { pointerId: 342, clientX: fire.x + fire.width / 2, clientY: fire.y + fire.height / 2 });
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.nativeDebug().heldMask)).toBe(0);
});
