import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { chromium, firefox } from '../browser-tests/node_modules/playwright/index.mjs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const BUILD = resolve(ROOT, 'build/wasm/P2-050/phase2-oracle');
const EVIDENCE = resolve(ROOT, 'evidence/task-runs/P02-DOOM-P2-085');
const RUNTIME = resolve(ROOT, 'build/runtime/P01/P1-080');
const DEMO = resolve(RUNTIME, 'oracle-140.lmp');
const EFFECT = resolve(RUNTIME, 'oracle-effect.deh');
const EXTRA = resolve(RUNTIME, 'extra.cfg');
const CONFIG = resolve(ROOT, 'tests/fixtures/config/oracle.cfg');

function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function contentType(path) {
  return { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.wasm': 'application/wasm', '.wad': 'application/octet-stream', '.lmp': 'application/octet-stream', '.deh': 'text/plain; charset=utf-8', '.cfg': 'text/plain; charset=utf-8' }[extname(path)] || 'application/octet-stream';
}

function startServer(logs) {
  const shell = readFileSync(resolve(ROOT, 'web/p2/shell.html'), 'utf8').replace('{{PHASE}}', 'phase2');
  const files = {
    '/p2/pre.js': resolve(ROOT, 'web/p2/pre.js'),
    '/p2/post.js': resolve(ROOT, 'web/p2/post.js'),
    '/engine/src/chocolate-doom.js': resolve(BUILD, 'src/chocolate-doom.js'),
    '/engine/src/chocolate-doom.wasm': resolve(BUILD, 'src/chocolate-doom.wasm'),
    '/p2-data/freedoom2.wad': resolve(BUILD, 'data/freedoom2.wad'),
    '/p2-data/oracle-140.lmp': DEMO,
    '/p2-data/oracle-effect.deh': EFFECT,
    '/p2-data/extra.cfg': EXTRA,
    '/p2-data/oracle.cfg': CONFIG,
  };
  const server = createServer((request, response) => {
    const path = new URL(request.url, 'http://127.0.0.1').pathname;
    if (path === '/oracle/' || path === '/oracle/index.html') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(shell);
      logs.push({ path, status: 200, kind: 'shell' });
      return;
    }
    const file = files[path];
    if (!file) {
      response.writeHead(404);
      response.end();
      logs.push({ path, status: 404 });
      return;
    }
    try {
      const body = readFileSync(file);
      response.writeHead(200, { 'Content-Type': contentType(file), 'Content-Length': body.length });
      response.end(body);
      logs.push({ path, status: 200, bytes: body.length });
    } catch (error) {
      response.writeHead(404);
      response.end();
      logs.push({ path, status: 404, error: String(error) });
    }
  });
  return new Promise((resolveServer) => server.listen(0, '127.0.0.1', () => resolveServer(server)));
}

function waitForOutput(page, timeoutMs = 60000) {
  const started = Date.now();
  return new Promise((resolveResult, reject) => {
    const timer = setInterval(async () => {
      if (Date.now() - started > timeoutMs) {
        clearInterval(timer);
        page.evaluate(() => ({
          body: document.body.dataset,
          moduleKeys: window.Module ? Object.keys(window.Module).filter((key) => ['callMain', 'FS', 'ENV', 'arguments', 'noInitialRun'].includes(key)) : [],
          envValue: window.Module && window.Module.ENV ? window.Module.ENV.SFHS_ORACLE_OUTPUT : null,
          root: window.FS ? window.FS.readdir('/') : [],
          oracle: window.FS ? (() => { try { return window.FS.readdir('/oracle-output'); } catch (error) { return String(error); } })() : null,
        })).then((diagnostic) => reject(new Error(`oracle MEMFS output timeout: ${JSON.stringify(diagnostic)}`))).catch((error) => reject(error));
        return;
      }
      try {
        const result = await page.evaluate(() => {
          if (!window.FS || typeof window.FS.readdir !== 'function' || typeof window.FS.readFile !== 'function') return { ready: false };
          let names;
          try { names = window.FS.readdir('/oracle-output'); } catch { return { ready: false }; }
          const required = ['state.jsonl', 'frame-001.bin', 'frame-035.bin', 'frame-070.bin', 'frame-140.bin'];
          if (!required.every((name) => names.includes(name))) return { ready: false, names };
          const files = Object.fromEntries(required.map((name) => [name, Array.from(window.FS.readFile(`/oracle-output/${name}`))]));
          return { ready: true, files };
        });
        if (result.ready) {
          clearInterval(timer);
          resolveResult(result.files);
        }
      } catch (error) {
        clearInterval(timer);
        reject(error);
      }
    }, 100);
  });
}

async function runOne(browserName, runDirectory, deh, baseUrl) {
  mkdirSync(runDirectory, { recursive: true });
  const browserType = browserName === 'chromium' ? chromium : firefox;
  const browser = await browserType.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text() }));
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('requestfailed', (request) => failedRequests.push(`${request.url()} ${request.failure()?.errorText || ''}`));
  try {
    await page.goto(`${baseUrl}/oracle/?oracle=1&input=1${deh ? '&deh=1' : ''}`, { waitUntil: 'load', timeout: 30000 });
    await page.locator('body').waitFor({ state: 'visible', timeout: 30000 });
    await page.waitForFunction(() => document.body.dataset.sfhsP2Runtime === 'ready', null, { timeout: 30000 });
    await page.waitForFunction(() => document.body.dataset.sfhsP2Data === 'loaded', null, { timeout: 30000 });
    await page.waitForFunction(() => document.body.dataset.sfhsP2Main === 'started', null, { timeout: 30000 });
    let files;
    try {
      files = await waitForOutput(page);
    } catch (error) {
      writeFileSync(resolve(runDirectory, 'diagnostic.json'), `${JSON.stringify({ error: String(error), console: consoleMessages, page_errors: pageErrors, failed_requests: failedRequests }, null, 2)}\n`);
      throw error;
    }
    for (const [name, values] of Object.entries(files)) {
      const bytes = Buffer.from(values);
      writeFileSync(resolve(runDirectory, name), bytes);
    }
    const result = {
      schema_version: 1,
      task: 'DOOM-P2-085',
      browser: browserName,
      status: pageErrors.length === 0 && failedRequests.length === 0 ? 'PASS' : 'FAIL',
      deh,
      files: Object.fromEntries(Object.entries(files).map(([name, values]) => [name, { size_bytes: values.length, sha256: hash(Buffer.from(values)) }])),
      console: consoleMessages,
      page_errors: pageErrors,
      failed_requests: failedRequests,
    };
    writeFileSync(resolve(runDirectory, 'result.json'), `${JSON.stringify(result, null, 2)}\n`);
    if (result.status !== 'PASS') throw new Error(`browser evidence failed for ${browserName}: ${JSON.stringify(result)}`);
  } finally {
    await browser.close().catch(() => {});
  }
}

async function main() {
  const args = process.argv.slice(2);
  const browserName = args[args.indexOf('--browser') + 1];
  const repeat = Number(args[args.indexOf('--repeat') + 1]);
  if (!['chromium', 'firefox'].includes(browserName) || !Number.isInteger(repeat) || repeat < 1) throw new Error('usage: node tools/run-wasm-oracle.mjs --browser chromium|firefox --repeat N');
  mkdirSync(EVIDENCE, { recursive: true });
  const logs = [];
  const server = await startServer(logs);
  const address = server.address();
  const baseUrl = `http://${address.address}:${address.port}`;
  const root = resolve(EVIDENCE, `wasm-${browserName}`);
  try {
    for (let index = 1; index <= repeat; index += 1) await runOne(browserName, resolve(root, `baseline/run-${index}`), false, baseUrl);
    await runOne(browserName, resolve(root, 'deh-effect'), true, baseUrl);
    writeFileSync(resolve(root, 'summary.json'), `${JSON.stringify({ task: 'DOOM-P2-085', browser: browserName, repeat, status: 'PASS', base_url: baseUrl }, null, 2)}\n`);
    writeFileSync(resolve(EVIDENCE, `${browserName}-server.json`), `${JSON.stringify(logs, null, 2)}\n`);
    console.log(`WASM_ORACLE=PASS browser=${browserName} repeat=${repeat}`);
  } finally {
    await new Promise((resolveClose) => server.close(resolveClose));
  }
}

main().catch((error) => { console.error(`WASM_ORACLE=FAIL ${error.stack || error}`); process.exitCode = 1; });
