import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

const candidate = new URL('../../dist/sfhs-doom-android-samsung-input-v4.html', import.meta.url);
const candidateUrl = candidate.href;
const hasCandidate = existsSync(candidate);
const outcomeTimeout = 10000;

async function start(page) {
  test.skip(!hasCandidate, 'Samsung input V4 artifact has not been built in this checkout.');
  await page.setViewportSize({ width: 400, height: 844 });
  await page.goto(candidateUrl, { waitUntil: 'load', timeout: 60000 });
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-runtime', 'ready', { timeout: 60000 });
  await page.getByRole('button', { name: 'Start Doom' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-main', 'started', { timeout: 15000 });
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.readGameState()?.active), { timeout: 15000 }).toBe(1);
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_STATE.audioContextState), { timeout: 15000 }).toBe('running');
  const buildCalls = await page.evaluate(() => window.SFHS_P6_INPUT.consumerDebug().buildTiccmdCalls);
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.consumerDebug().buildTiccmdCalls), { timeout: 15000 }).toBeGreaterThan(buildCalls + 4);
  const stableBuildCalls = await page.evaluate(() => window.SFHS_P6_INPUT.consumerDebug().buildTiccmdCalls);
  await page.waitForTimeout(250);
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.consumerDebug().buildTiccmdCalls), { timeout: 15000 }).toBeGreaterThan(stableBuildCalls + 4);
}

async function dispatch(page, selector, type, options) {
  await page.locator(selector).evaluate((element, value) => {
    element.dispatchEvent(new PointerEvent(value.type, {
      bubbles: true,
      cancelable: true,
      pointerType: 'touch',
      button: 0,
      buttons: value.type === 'pointerup' || value.type === 'pointercancel' ? 0 : 1,
      pressure: value.type === 'pointerup' || value.type === 'pointercancel' ? 0 : 0.5,
      ...value.options,
    }));
  }, { type, options });
}

test('V4 launches mobile Doom with nograbmouse and reports no pointer lock', async ({ page }) => {
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('request', request => { if (/^https?:/i.test(request.url())) requests.push(request.url()); });
  await start(page);
  const value = await page.evaluate(() => ({ args: window.Module.arguments, diagnostics: window.SFHS_P6_DIAGNOSTICS.snapshot() }));
  expect(value.args).toContain('-nograbmouse');
  expect(value.args).not.toContain('-nomouse');
  expect(value.diagnostics.schema).toBe('sfhs-doom-samsung-diagnostics-v4');
  expect(value.diagnostics.build.id).toBe('P6-SAMSUNG-INPUT-V4');
  expect(value.diagnostics.pointerLock).toEqual({ active: false, elementId: null });
  expect(typeof value.diagnostics.documentHasFocus).toBe('boolean');
  expect(errors).toEqual([]);
  expect(requests).toEqual([]);
});

test('V4 always records real-coordinate MOVE outcome without opening the panel', async ({ page }) => {
  await start(page);
  await expect(page.locator('#input-test-panel')).toBeHidden();
  const rect = await page.locator('[data-control="move"]').boundingBox();
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height * 0.15;
  await dispatch(page, '[data-control="move"]', 'pointerdown', { pointerId: 401, clientX: x, clientY: y, screenX: x, screenY: y, pageX: x, pageY: y });
  await page.waitForTimeout(1200);
  await dispatch(page, '[data-control="move"]', 'pointerup', { pointerId: 401, clientX: x, clientY: y, screenX: x, screenY: y, pageX: x, pageY: y });
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.snapshot().telemetry.outcomes.move?.pass), { timeout: outcomeTimeout }).toBeTruthy();
  const snapshot = await page.evaluate(() => window.SFHS_P6_INPUT.snapshot());
  expect(snapshot.telemetry.outcomes.move.coordinateUsable).toBeTruthy();
  expect(snapshot.telemetry.outcomes.move.dx !== 0 || snapshot.telemetry.outcomes.move.dy !== 0).toBeTruthy();
  expect(snapshot.telemetry.events.some(event => event.control === 'move' && event.clientX === x && event.pressure === 0.5)).toBeTruthy();
  expect(snapshot.native.heldMask).toBe(0);
  console.log('SFHS_V4_MOVE=' + JSON.stringify(snapshot.telemetry.outcomes.move));
});

test('V4 always records real-coordinate LOOK outcome and keeps fractional accumulation', async ({ page }) => {
  await start(page);
  const rect = await page.locator('[data-control="look"]').boundingBox();
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  await dispatch(page, '[data-control="look"]', 'pointerdown', { pointerId: 402, clientX: x, clientY: y, screenX: x, screenY: y, pageX: x, pageY: y });
  for (let index = 1; index <= 8; index += 1) {
    await dispatch(page, '[data-control="look"]', 'pointermove', { pointerId: 402, clientX: x + index * 0.25, clientY: y, screenX: x + index * 0.25, screenY: y, pageX: x + index * 0.25, pageY: y, movementX: 0.25 });
  }
  for (let index = 1; index <= 10; index += 1) {
    await dispatch(page, '[data-control="look"]', 'pointermove', { pointerId: 402, clientX: x + 2 + index * 3, clientY: y, screenX: x + 2 + index * 3, screenY: y, pageX: x + 2 + index * 3, pageY: y, movementX: 3 });
  }
  await page.waitForTimeout(300);
  await dispatch(page, '[data-control="look"]', 'pointerup', { pointerId: 402, clientX: x + 32, clientY: y, screenX: x + 32, screenY: y, pageX: x + 32, pageY: y });
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.snapshot().telemetry.outcomes.look?.pass), { timeout: outcomeTimeout }).toBeTruthy();
  const snapshot = await page.evaluate(() => window.SFHS_P6_INPUT.snapshot());
  expect(snapshot.telemetry.outcomes.look.coordinateChanged).toBeTruthy();
  expect(snapshot.telemetry.outcomes.look.nativeAfter.postedMouse).toBeGreaterThan(snapshot.telemetry.outcomes.look.nativeBefore.postedMouse);
  expect(snapshot.telemetry.outcomes.look.consumerAfter.responderMouse).toBeGreaterThan(snapshot.telemetry.outcomes.look.consumerBefore.responderMouse);
  expect(snapshot.telemetry.outcomes.look.angleDelta).not.toBe(0);
  expect(snapshot.telemetry.events.some(event => event.operation === 'look_accumulate' && event.rawDeltaX === 0.25 && event.integerPosted === 0)).toBeTruthy();
  console.log('SFHS_V4_LOOK=' + JSON.stringify(snapshot.telemetry.outcomes.look));
});

test('V4 preserves coordinate-independent FIRE outcome', async ({ page }) => {
  await start(page);
  const rect = await page.locator('[data-control="fire"]').boundingBox();
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  await dispatch(page, '[data-control="fire"]', 'pointerdown', { pointerId: 403, clientX: 0, clientY: 0, screenX: 0, screenY: 0, pageX: 0, pageY: 0 });
  await page.waitForTimeout(500);
  await dispatch(page, '[data-control="fire"]', 'pointerup', { pointerId: 403, clientX: 0, clientY: 0, screenX: 0, screenY: 0, pageX: 0, pageY: 0 });
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.snapshot().telemetry.outcomes.fire?.pass), { timeout: outcomeTimeout }).toBeTruthy();
  const outcome = await page.evaluate(() => window.SFHS_P6_INPUT.snapshot().telemetry.outcomes.fire);
  expect(outcome.ammoDelta).toBeLessThan(0);
  expect(Number.isFinite(x + y)).toBeTruthy();
  console.log('SFHS_V4_FIRE=' + JSON.stringify(outcome));
});

test('V4 frozen zero coordinates cannot pass MOVE or LOOK', async ({ page }) => {
  await start(page);
  await dispatch(page, '[data-control="move"]', 'pointerdown', { pointerId: 404, clientX: 0, clientY: 0, movementX: 12, movementY: 12 });
  await page.waitForTimeout(300);
  await dispatch(page, '[data-control="move"]', 'pointerup', { pointerId: 404, clientX: 0, clientY: 0, movementX: 0, movementY: 0 });
  await dispatch(page, '[data-control="look"]', 'pointerdown', { pointerId: 405, clientX: 0, clientY: 0 });
  await dispatch(page, '[data-control="look"]', 'pointermove', { pointerId: 405, clientX: 0, clientY: 0, movementX: 20 });
  await dispatch(page, '[data-control="look"]', 'pointerup', { pointerId: 405, clientX: 0, clientY: 0 });
  await page.waitForTimeout(400);
  const outcomes = await page.evaluate(() => window.SFHS_P6_INPUT.snapshot().telemetry.outcomes);
  expect(outcomes.move.pass).toBeFalsy();
  expect(outcomes.move.coordinateUsable).toBeFalsy();
  expect(outcomes.look.pass).toBeFalsy();
  expect(outcomes.look.coordinateUsable).toBeFalsy();
  expect(outcomes.look.coordinateChanged).toBeFalsy();
});

test('V4 keeps pointer-capture failure nonfatal and releases all actions', async ({ page }) => {
  await start(page);
  await page.evaluate(() => { HTMLElement.prototype.setPointerCapture = () => { throw new DOMException('synthetic capture failure', 'InvalidStateError'); }; });
  const move = await page.locator('[data-control="move"]').boundingBox();
  const fire = await page.locator('[data-control="fire"]').boundingBox();
  await dispatch(page, '[data-control="move"]', 'pointerdown', { pointerId: 406, clientX: move.x + move.width / 2, clientY: move.y + move.height * 0.15 });
  await dispatch(page, '[data-control="fire"]', 'pointerdown', { pointerId: 407, clientX: fire.x + fire.width / 2, clientY: fire.y + fire.height / 2 });
  expect(await page.evaluate(() => window.SFHS_P6_INPUT.nativeDebug().heldMask)).not.toBe(0);
  await dispatch(page, '[data-control="move"]', 'pointercancel', { pointerId: 406, clientX: move.x + move.width / 2, clientY: move.y + move.height * 0.15 });
  await dispatch(page, '[data-control="fire"]', 'pointercancel', { pointerId: 407, clientX: fire.x + fire.width / 2, clientY: fire.y + fire.height / 2 });
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.nativeDebug().heldMask)).toBe(0);
  const capture = await page.evaluate(() => window.SFHS_P6_INPUT.snapshot().telemetry.lastPointerCapture);
  expect(capture.success).toBeFalsy();
  expect(capture.error).toContain('InvalidStateError');
});
