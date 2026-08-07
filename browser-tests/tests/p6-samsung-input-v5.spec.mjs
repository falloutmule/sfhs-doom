import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

const candidate = new URL('../../dist/sfhs-doom-android-samsung-input-v5.html', import.meta.url);
const candidateUrl = candidate.href;
const hasCandidate = existsSync(candidate);

async function start(page) {
  test.skip(!hasCandidate, 'Samsung LOOK V5 artifact has not been built in this checkout.');
  await page.setViewportSize({ width: 400, height: 844 });
  await page.goto(candidateUrl, { waitUntil: 'load', timeout: 60000 });
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-runtime', 'ready', { timeout: 60000 });
  await page.getByRole('button', { name: 'Start Doom' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-main', 'started', { timeout: 15000 });
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.readGameState()?.active), { timeout: 15000 }).toBe(1);
  const buildCalls = await page.evaluate(() => window.SFHS_P6_INPUT.consumerDebug().buildTiccmdCalls);
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.consumerDebug().buildTiccmdCalls), { timeout: 15000 }).toBeGreaterThan(buildCalls + 4);
}

function delta(after, before, key) {
  return after[key] - before[key];
}

test('V5 aggregates a same-task LOOK burst into one full-delta ev_mouse', async ({ page }) => {
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('request', request => { if (/^https?:/i.test(request.url())) requests.push(request.url()); });
  await start(page);

  const rect = await page.locator('[data-control="look"]').boundingBox();
  const before = await page.evaluate(() => ({
    native: window.SFHS_P6_INPUT.nativeDebug(),
    consumer: window.SFHS_P6_INPUT.consumerDebug(),
    game: window.SFHS_P6_INPUT.readGameState(),
  }));

  await page.locator('[data-control="look"]').evaluate((element, value) => {
    const send = (type, clientX, movementX, buttons) => element.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerType: 'touch',
      pointerId: 501,
      button: 0,
      buttons,
      pressure: buttons ? 0.5 : 0,
      clientX,
      clientY: value.y,
      screenX: clientX,
      screenY: value.y,
      movementX,
      movementY: 0,
    }));
    send('pointerdown', value.x, 0, 1);
    for (let index = 1; index <= 20; index += 1) send('pointermove', value.x + index * 2, 2, 1);
    send('pointerup', value.x + 40, 0, 0);
  }, { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });

  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.nativeDebug().postedMouse), { timeout: 10000 }).toBeGreaterThan(before.native.postedMouse);
  await expect.poll(() => page.evaluate(value => window.SFHS_P6_INPUT.readGameState().angle !== value, before.game.angle), { timeout: 10000 }).toBeTruthy();
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.snapshot().telemetry.outcomes.look?.pass), { timeout: 10000 }).toBeTruthy();

  const after = await page.evaluate(() => ({
    native: window.SFHS_P6_INPUT.nativeDebug(),
    consumer: window.SFHS_P6_INPUT.consumerDebug(),
    game: window.SFHS_P6_INPUT.readGameState(),
    outcome: window.SFHS_P6_INPUT.snapshot().telemetry.outcomes.look,
    diagnostics: window.SFHS_P6_DIAGNOSTICS.snapshot(),
    args: window.Module.arguments,
  }));

  expect(after.args).toContain('-nograbmouse');
  expect(after.diagnostics.schema).toBe('sfhs-doom-samsung-diagnostics-v5');
  expect(after.diagnostics.build.id).toBe('P6-SAMSUNG-LOOK-V5');
  expect(after.diagnostics.pointerLock.active).toBeFalsy();
  expect(delta(after.native, before.native, 'lookCalls')).toBe(20);
  expect(delta(after.native, before.native, 'lookUnitsAccumulated')).toBe(40);
  expect(delta(after.native, before.native, 'lookUnitsFlushed')).toBe(40);
  expect(delta(after.native, before.native, 'postedMouse')).toBe(1);
  expect(delta(after.consumer, before.consumer, 'responderMouse')).toBe(1);
  expect(after.consumer.lastMouseX).toBe(40);
  expect(delta(after.consumer, before.consumer, 'cmdAngleNonzero')).toBe(1);
  expect(after.game.angle).not.toBe(before.game.angle);
  expect(after.outcome.domLookSamples).toBe(20);
  expect(after.outcome.lookUnitsFlushed).toBe(40);
  expect(after.outcome.mouseEventsPosted).toBe(1);
  expect(after.outcome.angleProducingTics).toBe(1);
  expect(errors).toEqual([]);
  expect(requests).toEqual([]);
  console.log('SFHS_V5_LOOK=' + JSON.stringify({ before, after }));
});

test('V5 preserves MOVE and FIRE outcomes', async ({ page }) => {
  await start(page);
  const move = await page.locator('[data-control="move"]').boundingBox();
  const fire = await page.locator('[data-control="fire"]').boundingBox();
  const dispatch = async (selector, type, pointerId, clientX, clientY) => page.locator(selector).evaluate((element, value) => {
    element.dispatchEvent(new PointerEvent(value.type, {
      bubbles: true,
      cancelable: true,
      pointerType: 'touch',
      pointerId: value.pointerId,
      button: 0,
      buttons: value.type === 'pointerup' ? 0 : 1,
      pressure: value.type === 'pointerup' ? 0 : 0.5,
      clientX: value.clientX,
      clientY: value.clientY,
    }));
  }, { type, pointerId, clientX, clientY });

  await dispatch('[data-control="move"]', 'pointerdown', 502, move.x + move.width / 2, move.y + move.height * 0.15);
  await page.waitForTimeout(800);
  await dispatch('[data-control="move"]', 'pointerup', 502, move.x + move.width / 2, move.y + move.height * 0.15);
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.snapshot().telemetry.outcomes.move?.pass), { timeout: 10000 }).toBeTruthy();

  await dispatch('[data-control="fire"]', 'pointerdown', 503, fire.x + fire.width / 2, fire.y + fire.height / 2);
  await page.waitForTimeout(500);
  await dispatch('[data-control="fire"]', 'pointerup', 503, fire.x + fire.width / 2, fire.y + fire.height / 2);
  await expect.poll(() => page.evaluate(() => window.SFHS_P6_INPUT.snapshot().telemetry.outcomes.fire?.pass), { timeout: 10000 }).toBeTruthy();

  const snapshot = await page.evaluate(() => window.SFHS_P6_INPUT.snapshot());
  expect(snapshot.native.heldMask).toBe(0);
  expect(snapshot.telemetry.outcomes.move.pass).toBeTruthy();
  expect(snapshot.telemetry.outcomes.fire.pass).toBeTruthy();
});
