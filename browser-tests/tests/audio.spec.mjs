import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

test.setTimeout(120000);
const repoRoot = resolve('..');
const evidenceRoot = resolve(repoRoot, 'evidence/task-runs/P02-DOOM-P2-080');
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

async function waitFor(page, predicate, label, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  throw new Error(`${label} timed out`);
}

async function buttonProbe(page) {
  return page.evaluate(() => {
    const button = document.getElementById('start-doom');
    const rect = button.getBoundingClientRect();
    const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    const style = getComputedStyle(button);
    const stack = document.elementsFromPoint(center.x, center.y).map((element) => ({ id: element.id, tag: element.tagName, pointerEvents: getComputedStyle(element).pointerEvents, opacity: getComputedStyle(element).opacity }));
    return {
      doomMainStarted: Boolean(window.SFHS_AUDIO_PROBE?.mainStarted),
      audioContextExists: Boolean(window.Module?.SDL2?.audioContext),
      audioContextState: window.Module?.SDL2?.audioContext?.state || null,
      callbackCount: window.SFHS_AUDIO_PROBE?.callbacks || 0,
      button: {
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        pointerEvents: style.pointerEvents,
        position: style.position,
        zIndex: style.zIndex,
        disabled: button.disabled,
        hitTarget: document.elementFromPoint(center.x, center.y)?.id || '',
        stack,
      },
    };
  });
}

async function installEventDiagnostics(page) {
  await page.evaluate(() => {
    window.__sfhsAudioEvents = [];
    window.__sfhsKeyEvents = [];
    const types = ['pointerdown', 'pointerup', 'click', 'touchstart', 'mousedown', 'mouseup'];
    const record = (listener, event) => {
      const value = {
        listener,
        type: event.type,
        target: event.target?.id || event.target?.tagName || '',
        path: event.composedPath().map((item) => item?.id || item?.tagName || '').filter(Boolean),
        x: event.clientX,
        y: event.clientY,
        button: event.button,
        pointerType: event.pointerType || '',
        isTrusted: event.isTrusted,
        defaultPrevented: event.defaultPrevented,
      };
      window.__sfhsAudioEvents.push(value);
      window.recordSfhsAudioEvent(value);
    };
    for (const type of types) {
      document.addEventListener(type, (event) => record('document', event), true);
      window.addEventListener(type, (event) => record('window', event), true);
    }
    for (const type of ['keydown', 'keyup']) {
      document.addEventListener(type, (event) => window.__sfhsKeyEvents.push({ type, key: event.key, code: event.code, target: event.target?.id || '', isTrusted: event.isTrusted }), true);
    }
  });
}

test.beforeAll(async () => {
  mkdirSync(evidenceRoot, { recursive: true });
  for (const file of [readyFile, serverLog]) writeFileSync(file, '');
  server = spawn(process.env.PYTHON || 'python3', [resolve(repoRoot, 'tools/serve-wasm.py'), '--port', '0', '--ready-file', readyFile, '--log-file', serverLog], { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
  baseUrl = await waitForReady();
});

test.afterAll(async () => {
  if (!server) return;
  server.kill('SIGTERM');
  await new Promise((resolvePromise) => server.once('exit', resolvePromise));
});

for (const browserName of ['chromium', 'firefox']) {
  test(`user gesture engine audio path in ${browserName}`, async ({ playwright }) => {
    const browserServer = await playwright[browserName].launchServer({ headless: true });
    const browser = await playwright[browserName].connect({ wsEndpoint: browserServer.wsEndpoint() });
    const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
    const pageErrors = [];
    const consoleErrors = [];
    const hostEvents = [];
    let clickWatchdogTimedOut = false;
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    let preClick = null;
    let postClick = null;
    let afterFire = null;
    try {
      await page.goto(`${baseUrl}/phase2/?audio=1`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toHaveAttribute('data-sfhs-p2-runtime', 'ready', { timeout: 30000 });
      await expect(page.locator('body')).toHaveAttribute('data-sfhs-p2-data', 'loaded', { timeout: 30000 });
      await expect(page.locator('body')).toHaveAttribute('data-sfhs-p2-audio', 'ready', { timeout: 30000 });
      await expect(page.locator('#start-doom')).toHaveAttribute('data-sfhs-p2-audio-listener', 'ready');
      await page.exposeFunction('recordSfhsAudioEvent', (event) => hostEvents.push(event));
      await installEventDiagnostics(page);
      preClick = await buttonProbe(page);
      expect(preClick.doomMainStarted).toBe(false);
      expect(preClick.audioContextExists).toBe(false);
      expect(preClick.audioContextState).toBeNull();
      expect(preClick.callbackCount).toBe(0);
      expect(preClick.button.disabled).toBe(false);
      expect(preClick.button.hitTarget).toBe('start-doom');
      expect(preClick.button.stack[0].id).toBe('start-doom');
      const start = page.locator('#start-doom');
      await start.scrollIntoViewIfNeeded();
      await expect(start).toBeVisible();
      await expect(start).toBeEnabled();
      await expect.poll(async () => (await buttonProbe(page)).button.hitTarget).toBe('start-doom');
      let clickTimer;
      try {
        await Promise.race([
          start.click({ timeout: 10000 }),
          new Promise((_, reject) => { clickTimer = setTimeout(() => reject(new Error('bounded trusted Start click watchdog timed out')), 5000); }),
        ]);
      } catch (error) {
        clickWatchdogTimedOut = String(error).includes('bounded trusted Start click watchdog');
        throw error;
      } finally {
        clearTimeout(clickTimer);
      }
      await waitFor(page, async () => (await page.evaluate(() => window.SFHS_AUDIO_PROBE.mainStarted)) === true, 'Doom main start', 10000);
      await waitFor(page, async () => (await page.evaluate(() => window.SFHS_AUDIO_PROBE.probeAttached)) === true, 'SDL audio probe attach', 10000);
      await waitFor(page, async () => (await page.evaluate(() => window.Module.SDL2.audioContext.state)) === 'running', 'running AudioContext', 15000);
      await waitFor(page, async () => (await page.evaluate(() => window.SFHS_AUDIO_PROBE.callbacks)) >= 4, 'post-start audio callbacks', 15000);
      postClick = await buttonProbe(page);
      const events = await page.evaluate(() => window.__sfhsAudioEvents);
      const trustedStart = events.some((event) => event.type === 'click' && event.target === 'start-doom' && event.isTrusted === true);
      expect(trustedStart).toBe(true);
      expect(postClick.doomMainStarted).toBe(true);
      expect(postClick.audioContextExists).toBe(true);
      expect(postClick.audioContextState).toBe('running');
      expect(await page.evaluate(() => window.SFHS_AUDIO_PROBE.startClicks)).toBe(1);
      await page.locator('#canvas').focus();
      await page.keyboard.press('Enter');
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
      const callbacksBeforeFire = await page.evaluate(() => window.SFHS_AUDIO_PROBE.callbacks);
      await page.keyboard.down('Control');
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 1500));
      await page.keyboard.up('Control');
      await waitFor(page, async () => (await page.evaluate(() => window.SFHS_AUDIO_PROBE.callbacks)) > callbacksBeforeFire, 'post-fire audio callbacks', 15000);
      afterFire = await page.evaluate(() => ({ probe: { ...window.SFHS_AUDIO_PROBE }, keys: window.__sfhsKeyEvents }));
      if (browserName === 'chromium') expect(afterFire.probe.nonzeroPcmCallbacks).toBeGreaterThan(0);
      expect(afterFire.probe.callbacks).toBeGreaterThan(callbacksBeforeFire);
      expect(afterFire.probe.startClicks).toBe(1);
      expect(afterFire.probe.probeError).toBeNull();
      expect(pageErrors).toEqual([]);
      expect(consoleErrors.filter((message) => /fatal|abort|exception|uncaught|out of memory/i.test(message))).toEqual([]);
      await expect(start).toBeDisabled();
      expect(await page.evaluate(() => window.SFHS_AUDIO_PROBE.startClicks)).toBe(1);
      writeFileSync(resolve(evidenceRoot, `${browserName}.json`), JSON.stringify({ browser: browserName, preClick, postClick, afterFire, events, pageErrors, consoleErrors, clickPath: 'locator.click without force' }, null, 2));
    } finally {
      let events = hostEvents;
      let probe = null;
      let keys = [];
      if (!clickWatchdogTimedOut) {
        try { events = await page.evaluate(() => window.__sfhsAudioEvents || []); } catch {}
        try { probe = await page.evaluate(() => window.SFHS_AUDIO_PROBE ? ({ ...window.SFHS_AUDIO_PROBE }) : null); } catch {}
        try { keys = await page.evaluate(() => window.__sfhsKeyEvents || []); } catch {}
      }
      writeFileSync(resolve(evidenceRoot, `${browserName}.json`), JSON.stringify({ browser: browserName, preClick, postClick, afterFire, probe, keys, events, pageErrors, consoleErrors, clickPath: 'locator.click without force' }, null, 2));
      if (!clickWatchdogTimedOut) await browser.close().catch(() => {});
      browserServer.process().kill('SIGKILL');
    }
  });
}
