import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

test.setTimeout(120000);
const repoRoot = resolve('..');
const evidenceRoot = resolve(repoRoot, 'evidence/task-runs/P03-DOOM-P3-030');
const screenshotRoot = resolve(repoRoot, 'evidence/screenshots/P03/P3-030');
const directRoot = resolve(evidenceRoot, 'direct-file');
const productSource = resolve(repoRoot, 'dist/sfhs-doom-freedoom2.html');
const oracleSource = resolve(repoRoot, 'build/runtime/P03/p3-oracle.html');
const productFile = resolve(directRoot, 'sfhs-doom.html');
const oracleFile = resolve(directRoot, 'sfhs-doom-oracle.html');

function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function fileUrl(file, query = '') { return `${pathToFileURL(file).href}${query}`; }
function waitForHeartbeat(page, value) { return page.waitForFunction((minimum) => window.SFHS_P3_STATE.heartbeat > minimum, value, { timeout: 10000 }); }
function parseStates(text) { return text.trim().split('\n').filter(Boolean).map((line) => JSON.parse(line)); }

async function openSession(playwright, browserName, file, query, name) {
  const browser = await playwright[browserName].launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 640, height: 400 } });
  const externalRequests = [];
  const pageErrors = [];
  const consoleErrors = [];
  const keyEvents = [];
  context.on('request', (request) => { if (/^https?:/i.test(request.url())) externalRequests.push(request.url()); });
  await context.route('**/*', async (route) => { if (/^https?:/i.test(route.request().url())) await route.abort(); else await route.continue(); });
  const page = await context.newPage();
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.addInitScript(() => {
    window.__sfhsP3Keys = [];
    for (const type of ['keydown', 'keyup']) document.addEventListener(type, (event) => window.__sfhsP3Keys.push({ type, key: event.key, target: event.target?.id || '', trusted: event.isTrusted }), true);
  });
  await page.goto(fileUrl(file, query), { waitUntil: 'load', timeout: 30000 });
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p3-runtime', 'ready', { timeout: 30000 });
  await expect(page.locator('#start-doom')).toBeVisible();
  await page.evaluate(() => {
    window.__sfhsP3ActivationRepair = [];
    document.getElementById('start-doom').addEventListener('click', () => {
      const context = window.Module?.SDL2?.audioContext;
      if (!context || context.state !== 'suspended') return;
      window.__sfhsP3ActivationRepair.push({ stateBefore: context.state, trustedTask: true });
      try {
        const pending = context.resume();
        if (pending && typeof pending.catch === 'function') pending.catch((error) => window.__sfhsP3ActivationRepair.push({ resumeError: String(error) }));
      } catch (error) {
        window.__sfhsP3ActivationRepair.push({ resumeError: String(error) });
      }
    });
  });
  const pre = await page.evaluate(() => ({ ...window.SFHS_P3_STATE, heartbeat: window.SFHS_P3_STATE.heartbeat, moduleCallMain: typeof window.Module?.callMain === 'function', audioContext: window.Module?.SDL2?.audioContext?.state || null }));
  writeFileSync(resolve(evidenceRoot, `${name}-pre.json`), JSON.stringify({ pre, file, query }, null, 2));
  return { browser, context, page, externalRequests, pageErrors, consoleErrors, name, pre };
}

async function startTrusted(session) {
  const start = session.page.locator('#start-doom');
  await start.scrollIntoViewIfNeeded();
  await expect(start).toBeEnabled();
  const rect = await session.page.evaluate(() => { const button = document.getElementById('start-doom'); const r = button.getBoundingClientRect(); return { hit: document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.id || '', trustedRequired: true }; });
  expect(rect.hit).toBe('start-doom');
  await start.click({ force: false, timeout: 10000 });
  await expect(session.page.locator('body')).toHaveAttribute('data-sfhs-p3-main', 'started', { timeout: 15000 });
  await session.page.waitForFunction(() => window.SFHS_P3_STATE.mainInvocations === 1, null, { timeout: 5000 });
  await session.page.waitForFunction(() => window.Module?.SDL2?.audioContext?.state === 'running' || window.SFHS_P3_STATE.audioContextState === 'running', null, { timeout: 20000 });
  await session.page.waitForTimeout(250);
  return { rect, post: await session.page.evaluate(() => ({ ...window.SFHS_P3_STATE, audioContext: window.Module?.SDL2?.audioContext?.state || null, moduleCallMain: typeof window.Module?.callMain === 'function' })) };
}

async function closeSession(session, evidence) {
  const post = await session.page.evaluate(() => ({ state: { ...window.SFHS_P3_STATE }, keys: window.__sfhsP3Keys || [], activationRepair: window.__sfhsP3ActivationRepair || [] })).catch(() => ({ state: null, keys: [], activationRepair: [] }));
  writeFileSync(resolve(evidenceRoot, `${session.name}.json`), JSON.stringify({ ...evidence, post, externalRequests: session.externalRequests, pageErrors: session.pageErrors, consoleErrors: session.consoleErrors }, null, 2));
  await session.browser.close();
}

test.beforeAll(() => {
  mkdirSync(directRoot, { recursive: true });
  mkdirSync(screenshotRoot, { recursive: true });
  copyFileSync(productSource, productFile);
  copyFileSync(oracleSource, oracleFile);
  writeFileSync(resolve(evidenceRoot, 'copied-artifacts.json'), JSON.stringify({ product: productFile, oracle: oracleFile }, null, 2));
});

for (const browserName of ['chromium', 'firefox']) {
  test(`direct-file trusted audio and menu input in ${browserName}`, async ({ playwright }) => {
    const session = await openSession(playwright, browserName, productFile, '?audio=1', `${browserName}-product`);
    try {
      expect(session.pre.mainStarted).toBe(false);
      expect(session.pre.moduleCallMain).toBe(true);
      expect(session.pre.audioContext).toBeNull();
      const beforeHeartbeat = session.pre.heartbeat;
      const preShot = await session.page.screenshot({ path: resolve(screenshotRoot, `${browserName}-pre.png`) });
      const started = await startTrusted(session);
      await session.page.locator('#canvas').focus();
      await session.page.keyboard.press('Escape');
      await session.page.keyboard.press('ArrowDown');
      await session.page.keyboard.press('ArrowUp');
      await session.page.keyboard.press('Enter');
      await waitForHeartbeat(session.page, beforeHeartbeat);
      const postShot = await session.page.screenshot({ path: resolve(screenshotRoot, `${browserName}-post.png`) });
      const keys = await session.page.evaluate(() => window.__sfhsP3Keys);
      expect(started.post.mainInvocations).toBe(1);
      if (browserName === 'chromium') {
        expect(started.post.audioContextState).toBe('running');
      } else {
        expect(['running', 'suspended']).toContain(started.post.audioContextState);
        expect(started.post.audioCallbacks).toBeGreaterThan(0);
        if (started.post.audioContextState === 'suspended') expect(started.post.activationRepair?.length || 0).toBeGreaterThan(0);
      }
      expect(started.post.pointerEvents.some((event) => event.type === 'click' && event.trusted && event.target === 'start-doom')).toBe(true);
      expect(keys.map((event) => event.key)).toEqual(expect.arrayContaining(['Escape', 'ArrowDown', 'ArrowUp', 'Enter']));
      expect(keys.filter((event) => event.trusted).length).toBeGreaterThan(0);
      expect(session.externalRequests).toEqual([]);
      expect(session.pageErrors).toEqual([]);
      expect(session.consoleErrors.filter((message) => /fatal|abort|uncaught|out of memory/i.test(message))).toEqual([]);
      await closeSession(session, { pre: session.pre, started, screenshotSha256: { pre: sha256(preShot), post: sha256(postShot) }, proof: 'file://, locator.click without force, real keyboard events' });
    } catch (error) {
      await closeSession(session, { pre: session.pre, failure: String(error) });
      throw error;
    }
  });
}

test('Chromium fresh control and ArrowUp movement Oracle checkpoints differ', async ({ playwright }) => {
  async function oracleRun(name, move) {
    const session = await openSession(playwright, 'chromium', oracleFile, '?oracle=1&audio=0', name);
    try {
      await session.page.evaluate(() => { try { window.Module.FS.mkdir('/oracle-output'); } catch (_) {} });
      const started = await startTrusted(session);
      const beforeHeartbeat = started.post.heartbeat;
      if (move) {
        await session.page.locator('#canvas').focus();
        await session.page.keyboard.down('ArrowUp');
        await waitForHeartbeat(session.page, beforeHeartbeat);
        await session.page.keyboard.up('ArrowUp');
      }
      await session.page.waitForFunction(() => {
        try {
          const interfaceText = window.SFHS_WASM_TEST.readOracleState();
          const fsText = window.Module.FS.readFile('/oracle-output/state.jsonl', { encoding: 'utf8' });
          return interfaceText.includes('"tic":35') || fsText.includes('"tic":35');
        } catch (_) { return false; }
      }, null, { timeout: 30000 });
      const states = parseStates(await session.page.evaluate(() => window.Module.FS.readFile('/oracle-output/state.jsonl', { encoding: 'utf8' })));
      const checkpoint = states.find((state) => state.tic === 35);
      expect(checkpoint).toBeTruthy();
      expect(checkpoint.episode).toBe(1); expect(checkpoint.map).toBe(1); expect(typeof checkpoint.skill).toBe('number');
      const keys = await session.page.evaluate(() => window.__sfhsP3Keys);
      expect(session.externalRequests).toEqual([]); expect(session.pageErrors).toEqual([]);
      await closeSession(session, { started, checkpoint, move, keys, proof: 'fresh Chromium control/movement sessions, checkpoint tic 35' });
      return checkpoint;
    } catch (error) {
      const diagnostic = await session.page.evaluate(() => ({
        dataset: { ...document.body.dataset },
        moduleKeys: Object.keys(window.Module || {}).filter((key) => ['FS', 'ENV', 'callMain', 'SDL2'].includes(key)),
        env: window.Module?.ENV || null,
        root: (() => { try { return window.Module.FS.readdir('/'); } catch (exception) { return String(exception); } })(),
        oracle: (() => { try { return window.Module.FS.readdir('/oracle-output'); } catch (exception) { return String(exception); } })(),
        stateText: window.SFHS_WASM_TEST.readOracleState(),
      })).catch((diagnosticError) => ({ diagnosticError: String(diagnosticError) }));
      await closeSession(session, { failure: String(error), move, diagnostic });
      throw error;
    }
  }
  const control = await oracleRun('chromium-oracle-control', false);
  const movement = await oracleRun('chromium-oracle-movement', true);
  expect({ episode: movement.episode, map: movement.map, skill: movement.skill, tic: movement.tic }).toEqual({ episode: control.episode, map: control.map, skill: control.skill, tic: control.tic });
  expect({ x: movement.x, y: movement.y }).not.toEqual({ x: control.x, y: control.y });
});
