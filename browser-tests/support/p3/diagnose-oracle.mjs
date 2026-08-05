import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';

const file = '/mnt/c/Users/fallo/Documents/Single-File-Html/sfhs-doom/evidence/task-runs/P03-DOOM-P3-030/direct-file/sfhs-doom-oracle.html';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
const errors = [];
page.on('pageerror', (error) => errors.push(String(error)));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
await page.goto(`${pathToFileURL(file).href}?oracle=1&audio=0`, { waitUntil: 'load' });
await page.waitForFunction(() => document.body.dataset.sfhsP3Runtime === 'ready');
await page.evaluate(() => { try { window.Module.FS.mkdir('/oracle-output'); } catch (_) {} });
await page.locator('#start-doom').click();
await page.waitForFunction(() => document.body.dataset.sfhsP3Main === 'started');
await new Promise((resolve) => setTimeout(resolve, 3000));
const diagnostic = await page.evaluate(() => {
  const fs = window.Module.FS;
  const raw = fs.readFile('/oracle-output/state.jsonl');
  const encoded = fs.readFile('/oracle-output/state.jsonl', { encoding: 'utf8' });
  return {
    state: { ...window.SFHS_P3_STATE },
    root: fs.readdir('/'),
    oracle: fs.readdir('/oracle-output'),
    stat: fs.stat('/oracle-output/state.jsonl'),
    rawType: Object.prototype.toString.call(raw),
    rawLength: raw.length,
    encodedType: typeof encoded,
    encodedLength: encoded.length,
    encodedPrefix: typeof encoded === 'string' ? encoded.slice(0, 300) : Array.from(encoded.slice(0, 32)),
    interfaceLength: window.SFHS_WASM_TEST.readOracleState().length,
  };
});
console.log(JSON.stringify({ diagnostic, errors }, null, 2));
await browser.close();
