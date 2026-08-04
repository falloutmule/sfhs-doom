import { test, expect, chromium, firefox } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const root = resolve(process.env.SFHS_WASM_SMOKE_ROOT || 'build/runtime/P02/P2-020');
let server;
let baseUrl;

test.beforeAll(async () => {
  server = createServer(async (request, response) => {
    const requested = request.url === '/' ? '/sdl-smoke.html' : request.url;
    const filePath = join(root, requested.replace(/^\/+/, ''));
    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end('forbidden');
      return;
    }
    try {
      const body = await readFile(filePath);
      const contentTypes = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm' };
      response.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end('not found');
    }
  });
  await new Promise((resolveReady) => server.listen(0, '127.0.0.1', resolveReady));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(async () => {
  await new Promise((resolveClosed) => server.close(resolveClosed));
});

test('SDL2 Wasm smoke loads in Chromium and Firefox', async () => {
  for (const [name, browserType] of [['chromium', chromium], ['firefox', firefox]]) {
    const browser = await browserType.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto(`${baseUrl}/sdl-smoke.html`, { waitUntil: 'load' });
    await expect(page.locator('body')).toHaveAttribute('data-sfhs-wasm-smoke', 'pass');
    await expect(page.locator('body')).toContainText('SFHS WASM SDL smoke PASS');
    expect(errors, `${name} page errors`).toEqual([]);
    await browser.close();
  }
});
