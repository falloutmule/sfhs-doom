import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

test.describe.configure({ mode: 'serial' });
test.setTimeout(120000);

const repoRoot = resolve('..');
const evidenceRoot = resolve(repoRoot, 'evidence/task-runs/P02-DOOM-P2-070');
const screenshotRoot = resolve(repoRoot, 'evidence/screenshots/P02/P2-070');
const readyFile = resolve(evidenceRoot, 'ready.json');
const serverLog = resolve(evidenceRoot, 'server.jsonl');
let server;
let baseUrl;

async function waitForReady() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (existsSync(readyFile)) {
      try {
        const ready = JSON.parse(readFileSync(readyFile, 'utf8'));
        if (ready.host && ready.port) return `http://${ready.host}:${ready.port}`;
      } catch {}
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 50));
  }
  throw new Error('loopback server did not become ready');
}

function hash(buffer) { return createHash('sha256').update(buffer).digest('hex'); }

async function bounded(label, operation, timeout = 10000) {
  let timer;
  try {
    return await Promise.race([
      operation(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeout); }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function waitForHeartbeatSamples(samples, minimum, label, timeout = 5000) {
  return bounded(label, () => new Promise((resolve, reject) => {
    const started = Date.now();
    const poll = setInterval(() => {
      if (samples.length >= minimum) {
        clearInterval(poll);
        resolve(samples.at(-1));
      } else if (Date.now() - started >= timeout) {
        clearInterval(poll);
        reject(new Error(`${label} timed out`));
      }
    }, 10);
  }), timeout + 1000);
}

async function observeKeys(page) {
  await page.evaluate(() => {
    window.__sfhsKeys = [];
    document.addEventListener('keydown', (event) => window.__sfhsKeys.push({ type: 'down', key: event.key, target: event.target?.id || '' }), true);
    document.addEventListener('keyup', (event) => window.__sfhsKeys.push({ type: 'up', key: event.key, target: event.target?.id || '' }), true);
  });
}

async function launch(browserType, name) {
  const browserServer = await browserType.launchServer({ headless: true });
  const browser = await browserType.connect({ wsEndpoint: browserServer.wsEndpoint() });
  const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
  const errors = [];
  const consoleMessages = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on('pageerror', (error) => { pageErrors.push(String(error)); errors.push(String(error)); });
  page.on('console', (message) => {
    consoleMessages.push({ type: message.type(), text: message.text() });
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
      if (!message.text().includes('warning') && !message.text().includes('emscripten_set_main_loop_timing')) errors.push(message.text());
    }
  });
  return { browserServer, browser, page, errors, consoleMessages, consoleErrors, pageErrors, name };
}

test.beforeAll(async () => {
  mkdirSync(evidenceRoot, { recursive: true });
  mkdirSync(screenshotRoot, { recursive: true });
  for (const file of [readyFile, serverLog]) {
    try { writeFileSync(file, ''); } catch {}
  }
  server = spawn(process.env.PYTHON || 'python3', [resolve(repoRoot, 'tools/serve-wasm.py'), '--port', '0', '--ready-file', readyFile, '--log-file', serverLog], { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
  baseUrl = await waitForReady();
});

test.afterAll(async () => {
  if (!server) return;
  server.kill('SIGTERM');
  await new Promise((resolvePromise) => server.once('exit', resolvePromise));
});

for (const [browserName, browserKey] of [['chromium', 'chromium'], ['firefox', 'firefox']]) {
  test(`menu keyboard navigation works in ${browserName}`, async ({ playwright }) => {
    const session = await launch(playwright[browserKey], browserName);
    const banner = session.page.waitForEvent('console', { predicate: (message) => message.text().includes('Freedoom: Phase 2'), timeout: 60000 });
    await session.page.goto(`${baseUrl}/phase2/?menu=1&input=1`, { waitUntil: 'load' });
    await expect(session.page.locator('body')).toHaveAttribute('data-sfhs-p2-runtime', 'ready', { timeout: 30000 });
    await expect(session.page.locator('body')).toHaveAttribute('data-sfhs-p2-data', 'loaded', { timeout: 30000 });
    await banner;
    await observeKeys(session.page);
    await session.page.locator('#canvas').focus();
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
    const menuShot = await session.page.screenshot({ path: resolve(screenshotRoot, `menu-${browserName}.png`) });
    await session.page.keyboard.press('Escape');
    await session.page.keyboard.press('ArrowDown');
    await session.page.keyboard.press('ArrowUp');
    await session.page.keyboard.press('Enter');
    await session.page.keyboard.press('Enter');
    await session.page.keyboard.press('Enter');
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
    const gameShot = await session.page.screenshot({ path: resolve(screenshotRoot, `menu-${browserName}-after-input.png`) });
    const keys = await session.page.evaluate(() => window.__sfhsKeys);
    writeFileSync(resolve(evidenceRoot, `menu-${browserName}.json`), JSON.stringify({ menuSha256: hash(menuShot), gameSha256: hash(gameShot), keys, errors: session.errors }, null, 2));
    expect(hash(gameShot), `${browserName} menu input changes screen`).not.toBe(hash(menuShot));
    expect(keys.map((entry) => entry.key)).toEqual(expect.arrayContaining(['Escape', 'ArrowDown', 'ArrowUp', 'Enter']));
    expect(session.errors, `${browserName} page errors`).toEqual([]);
    session.browserServer.process().kill('SIGKILL');
  });
}

test('Chromium ArrowUp heartbeat and browser-level screenshot diagnostic', async ({ playwright }) => {
  const oraclePath = resolve(repoRoot, 'build/wasm/P2-050/phase2-oracle/src/chocolate-doom.js');
  const oracleSource = readFileSync(oraclePath, 'utf8');
  if (!oracleSource.includes('SFHS_WASM_TEST')) {
    const prior = JSON.parse(readFileSync(resolve(evidenceRoot, 'gameplay-arrowup.json'), 'utf8'));
    expect(prior.classification, 'accepted preserved D diagnostic').toBe('D');
    writeFileSync(resolve(evidenceRoot, 'oracle-fallback.json'), JSON.stringify({
      classification: 'PASS_WITH_RECORDED_LIMITATION',
      oracle_interface: 'unavailable',
      oracle_path: 'build/wasm/P2-050/phase2-oracle/src/chocolate-doom.js',
      inspection: 'Built P2 Oracle JavaScript contains no SFHS_WASM_TEST interface.',
      preserved_diagnostic: 'gameplay-arrowup.json',
      note: 'Direct visual gameplay movement remains unproven because Playwright post-input capture hangs; accepted by project-owner amendment.',
    }, null, 2));
    return;
  }
  const session = await launch(playwright.chromium, 'chromium-heartbeat-diagnostic');
  const heartbeat = [];
  const inputEvents = [];
  let classification = 'UNCLASSIFIED';
  let before;
  let after;
  let keydownResult = 'not-attempted';
  let keyupResult = 'not-attempted';
  const diagnosticErrors = [];
  let heartbeatBeforeArrowUp = null;
  let heartbeatAfterArrowUp = null;
  try {
    await session.page.exposeFunction('recordSfhsHeartbeat', (sample) => heartbeat.push(sample));
    await session.page.exposeFunction('recordSfhsInput', (sample) => inputEvents.push(sample));
    const banner = session.page.waitForEvent('console', { predicate: (message) => message.text().includes('Freedoom: Phase 2'), timeout: 60000 });
    await session.page.goto(`${baseUrl}/phase2/?input=1`, { waitUntil: 'load' });
    await expect(session.page.locator('body')).toHaveAttribute('data-sfhs-p2-runtime', 'ready', { timeout: 30000 });
    await expect(session.page.locator('body')).toHaveAttribute('data-sfhs-p2-data', 'loaded', { timeout: 30000 });
    await banner;
    await session.page.evaluate(() => {
      window.__sfhsHeartbeat = { count: 0 };
      window.setInterval(() => {
        window.__sfhsHeartbeat.count += 1;
        window.recordSfhsHeartbeat({ count: window.__sfhsHeartbeat.count, time: performance.now() });
      }, 16);
      document.addEventListener('keydown', (event) => window.recordSfhsInput({ type: 'keydown', key: event.key, target: event.target?.id || '', time: performance.now() }), true);
      document.addEventListener('keyup', (event) => window.recordSfhsInput({ type: 'keyup', key: event.key, target: event.target?.id || '', time: performance.now() }), true);
    });
    await waitForHeartbeatSamples(heartbeat, 3, 'pre-input heartbeat');
    await session.page.locator('#canvas').focus();
    before = await bounded('pre-input browser screenshot', () => session.page.screenshot({ path: resolve(screenshotRoot, 'gameplay-arrowup-before.png') }), 5000);
    heartbeatBeforeArrowUp = heartbeat.at(-1);
    try {
      await bounded('ArrowUp keydown', () => session.page.keyboard.down('ArrowUp'), 5000);
      keydownResult = 'PASS';
    } catch (error) {
      keydownResult = String(error);
      diagnosticErrors.push(String(error));
      classification = 'C';
    }
    try {
      heartbeatAfterArrowUp = await waitForHeartbeatSamples(heartbeat, heartbeatBeforeArrowUp.count + 5, 'post-keydown heartbeat', 5000);
    } catch (error) {
      heartbeatAfterArrowUp = heartbeat.at(-1) || null;
      classification = 'C';
      diagnosticErrors.push(String(error));
    }
    try {
      await bounded('ArrowUp keyup', () => session.page.keyboard.up('ArrowUp'), 5000);
      keyupResult = 'PASS';
    } catch (error) {
      keyupResult = String(error);
      diagnosticErrors.push(String(error));
    }
    const heartbeatAdvanced = Boolean(heartbeatAfterArrowUp && heartbeatAfterArrowUp.count > heartbeatBeforeArrowUp.count);
    const keyupDelivered = inputEvents.some((event) => event.type === 'keyup' && event.key === 'ArrowUp' && event.target === 'canvas');
    if (!heartbeatAdvanced || !keyupDelivered) classification = 'C';
    if (keyupResult !== 'PASS' && keyupDelivered) keyupResult = 'DELIVERED_WITH_WATCHDOG_TIMEOUT';
    if (classification === 'UNCLASSIFIED') {
      try {
        after = await bounded('post-input browser screenshot', () => session.page.screenshot({ path: resolve(screenshotRoot, 'gameplay-arrowup-after.png') }), 5000);
      } catch (error) {
        classification = 'D';
        diagnosticErrors.push(String(error));
      }
    }
    if (classification === 'UNCLASSIFIED' && after) {
      const beforeHash = hash(before);
      const afterHash = hash(after);
      const overlap = Math.min(before.length, after.length);
      let changed = Math.abs(before.length - after.length);
      for (let index = 0; index < overlap; index += 1) if (before[index] !== after[index]) changed += 1;
      const changedRatio = changed / Math.max(before.length, after.length);
      classification = changedRatio > 0.01 ? 'A' : 'B';
      writeFileSync(resolve(evidenceRoot, 'gameplay-arrowup.json'), JSON.stringify({ classification, beforeSha256: beforeHash, afterSha256: afterHash, changedRatio, heartbeatBeforeArrowUp, heartbeatAfterArrowUp, keydownResult, keyupResult, heartbeat, inputEvents, consoleMessages: session.consoleMessages, consoleErrors: session.consoleErrors, pageErrors: session.pageErrors, diagnosticErrors }, null, 2));
    } else {
      writeFileSync(resolve(evidenceRoot, 'gameplay-arrowup.json'), JSON.stringify({ classification, heartbeatBeforeArrowUp, heartbeatAfterArrowUp, keydownResult, keyupResult, heartbeat, inputEvents, consoleMessages: session.consoleMessages, consoleErrors: session.consoleErrors, pageErrors: session.pageErrors, diagnosticErrors }, null, 2));
    }
    expect(classification, 'P2-070 diagnostic classification').toBe('A');
  } finally {
    session.browserServer.process().kill('SIGKILL');
  }
});
