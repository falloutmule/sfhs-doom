import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

test.describe.configure({ mode: 'serial' });
test.setTimeout(120000);

const repoRoot = resolve('..');
const evidenceRoot = resolve(repoRoot, 'evidence/task-runs/P02-DOOM-P2-060');
const screenshotRoot = resolve(repoRoot, 'evidence/screenshots/P02/P2-060');
const readyFile = resolve(evidenceRoot, 'ready.json');
const serverLog = resolve(evidenceRoot, 'server.jsonl');
let server;
let baseUrl;
const screenshotHashes = {};

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

test.beforeAll(async () => {
  mkdirSync(evidenceRoot, { recursive: true });
  mkdirSync(screenshotRoot, { recursive: true });
  for (const file of [readyFile, serverLog]) {
    try { writeFileSync(file, ''); } catch {}
  }
  server = spawn(process.env.PYTHON || 'python3', [
    resolve(repoRoot, 'tools/serve-wasm.py'), '--port', '0',
    '--ready-file', readyFile, '--log-file', serverLog,
  ], { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
  const stdout = [];
  const stderr = [];
  server.stdout.on('data', (chunk) => stdout.push(String(chunk)));
  server.stderr.on('data', (chunk) => stderr.push(String(chunk)));
  baseUrl = await waitForReady();
  writeFileSync(resolve(evidenceRoot, 'server-startup.txt'), [...stdout, ...stderr].join(''));
});

test.afterAll(async () => {
  if (!server) return;
  server.kill('SIGTERM');
  await new Promise((resolvePromise) => server.once('exit', resolvePromise));
});

for (const [phase, browserName] of [
  ['phase1', 'chromium'],
  ['phase2', 'chromium'],
  ['phase2', 'firefox'],
]) {
  test(`${phase} gameplay boots in ${browserName}`, async ({ playwright }) => {
    const browserServer = await playwright[browserName].launchServer({ headless: true });
    const browser = await playwright[browserName].connect({ wsEndpoint: browserServer.wsEndpoint() });
    const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
    const consoleMessages = [];
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on('console', (message) => { consoleMessages.push(`${message.type()}: ${message.text()}`); if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    page.on('requestfailed', (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ''}`));
    const gameplayBanner = page.waitForEvent('console', {
      predicate: (message) => message.text().includes(`Freedoom: Phase ${phase === 'phase1' ? '1' : '2'}`),
      timeout: 60000,
    });
    await page.goto(`${baseUrl}/${phase}/`, { waitUntil: 'load' });
    await expect(page.locator('body')).toHaveAttribute('data-sfhs-p2-runtime', 'ready', { timeout: 30000 });
    await expect(page.locator('body')).toHaveAttribute('data-sfhs-p2-data', 'loaded', { timeout: 30000 });
    await gameplayBanner;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
    const screenshot = await page.screenshot({ path: resolve(screenshotRoot, `${phase}-${browserName}.png`) });
    const screenshotHash = createHash('sha256').update(screenshot).digest('hex');
    const screenshotState = { bytes: screenshot.length, uniqueBytes: new Set(screenshot).size, sha256: screenshotHash };
    screenshotHashes[`${phase}-${browserName}`] = screenshotHash;
    writeFileSync(resolve(evidenceRoot, `${phase}-${browserName}.json`), JSON.stringify({ screenshotState, consoleMessages, consoleErrors, pageErrors, failedRequests }, null, 2));
    expect(screenshotState.bytes, `${phase}/${browserName} screenshot bytes`).toBeGreaterThan(10000);
    expect(screenshotState.uniqueBytes, `${phase}/${browserName} screenshot entropy`).toBeGreaterThan(20);
    if (phase === 'phase2') expect(screenshotHash, `${phase}/${browserName} distinct from phase1`).not.toBe(screenshotHashes['phase1-chromium']);
    const fatalConsoleErrors = consoleErrors.filter((message) => /\b(fatal|abort|exception|uncaught|out of memory)\b/i.test(message));
    expect(fatalConsoleErrors, `${phase}/${browserName} fatal console errors`).toEqual([]);
    expect(pageErrors, `${phase}/${browserName} page errors`).toEqual([]);
    expect(failedRequests, `${phase}/${browserName} failed requests`).toEqual([]);
    // The Emscripten main loop can keep a renderer busy after gameplay is proven;
    // terminate only this per-test browser server after evidence is written.
    browserServer.process().kill('SIGKILL');
  });
}
