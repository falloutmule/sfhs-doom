import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const core = readFileSync(new URL('../../web/forge/forge-core.js', import.meta.url), 'utf8');
const app = readFileSync(new URL('../../web/forge/forge-app.js', import.meta.url), 'utf8');
const launcher = readFileSync(new URL('../../web/forge/launcher.html', import.meta.url), 'utf8');
const evidence = resolve('..', 'test-results', 'FORGE-COMPLETE', 'storage');
mkdirSync(evidence, { recursive: true });

async function boot(page, seed = 'none') {
  await page.route('https://forge.test/', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' }));
  await page.goto('https://forge.test/');
  await page.addScriptTag({ content: core });
  await page.evaluate(async ({ launcher, seed }) => {
    document.body.innerHTML = launcher + '<button id="return-forge">Return</button>';
    const C = SFHSForgeCore, blob = new Blob(['synthetic stored base fixture']);
    const { chunks, ...encoded } = await C.encodeBlob(blob);
    const payload = { ...encoded, id: encoded.decoded.sha256, filename: 'base.wad', role: 'iwad', permission: 'redistributable', license: 'Synthetic CC0 fixture', storage: { kind: 'embedded-chunks' }, inspection: { targetGame: 'doom2' } };
    const recipe = { schema: 'sfhs.doom-recipe@1', id: 'test', title: 'Embedded recipe', engine: 'chocolate-doom', base: payload.id, family: 'doom2', files: [], documentIds: [], warp: 'MAP01', skill: 3, options: {}, manualOverride: false };
    recipe.saveNamespace = await C.recipeNamespace(recipe);
    const saveBytes = new TextEncoder().encode('synthetic save');
    const save = { namespace: recipe.saveNamespace, filename: 'doomsav0.dsg', bytes: saveBytes.length, sha256: C.hashBytes(saveBytes), data: C.bytesToBase64(saveBytes) };
    const manifest = { schema: 'sfhs.doom-capsule@1', capsule: { id: 'storage-test', name: 'Storage fixture', version: 3, mode: 'full', forge: false, private: false, buildProfile: 'FORGE-COMPLETE-1' }, payloads: [payload], recipes: [recipe], defaultRecipe: recipe.id, credits: [], networkPolicy: { default: 'offline' }, saves: [save] };
    const manifestNode = document.createElement('script'); manifestNode.id = 'sfhs-forge-manifest'; manifestNode.type = 'application/json'; manifestNode.textContent = JSON.stringify(manifest); document.body.append(manifestNode);
    chunks.forEach((chunk, index) => { const node = document.createElement('script'); node.type = 'application/octet-stream'; node.dataset.forgePayload = payload.id; node.dataset.chunk = String(index); node.textContent = chunk; document.body.append(node); });
    window.fixture = { blob, payload, recipe, manifest, save };
    if (seed !== 'none') {
      const db = await new Promise((resolve, reject) => { const request = indexedDB.open('sfhs-doom-forge-v3', 1); request.onupgradeneeded = () => request.result.createObjectStore('records'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
      const entries = [];
      if (seed === 'bad-metadata') {
        entries.push(['payload:' + payload.id, { payload: { ...payload, permission: 'private-local', filename: 'downgraded.wad' }, blob, aliases: ['downgraded.wad'], sources: [] }]);
        entries.push(['payload:' + 'a'.repeat(64), { payload, blob, aliases: [], sources: [] }]);
        entries.push(['workspace:storage-test', { schema: 1, recipes: [{ ...recipe, base: null, options: { unsupported: true } }], selected: recipe.id, build: [recipe.id] }]);
      } else if (seed === 'bad-bytes') entries.push(['payload:' + payload.id, { payload, blob: new Blob(['x'.repeat(blob.size)]), aliases: [], sources: [] }]);
      else if (seed === 'bad-saves') entries.push(['saves:' + recipe.saveNamespace, { corrupt: true }]);
      await new Promise((resolve, reject) => { const tx = db.transaction('records', 'readwrite'); for (const [key, value] of entries) tx.objectStore('records').put(value, key); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); }); db.close();
    }
    window.SFHS_P6_STATE = { mainStarted: false };
    window.SFHSForgePlayer = { ready: Promise.resolve() };
  }, { launcher, seed });
  await page.addScriptTag({ content: app });
  await page.evaluate(() => document.dispatchEvent(new Event('DOMContentLoaded')));
  await expect.poll(() => page.evaluate(() => SFHSForgeApp.state.ready || document.getElementById('setup-status').textContent)).toBe(true);
}

test('invalid payload and thin recipe metadata recover while embedded identity stays authoritative', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await boot(page, 'bad-metadata');
  const proof = await page.evaluate(async () => ({ payload: SFHSForgeApp.state.payloads.get(fixture.payload.id), recipe: SFHSForgeApp.selected(), keys: await SFHSForgeApp.keys(), warnings: SFHSForgeApp.state.warnings }));
  expect(proof.payload.permission).toBe('redistributable'); expect(proof.payload.filename).toBe('base.wad');
  expect(proof.recipe.base).toBe(proof.payload.id); expect(proof.recipe.options).toEqual({});
  expect(proof.keys.filter(key => key.startsWith('recovery:'))).toHaveLength(2); expect(proof.warnings).toHaveLength(2); expect(errors).toEqual([]);
  writeFileSync(resolve(evidence, 'metadata-recovery.json'), JSON.stringify(proof, null, 2));
});

test('clearing saves masks embedded defaults and persists across reopening the capsule', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(async () => (await SFHSForgeApp.loadSaves(SFHSForgeApp.selected())).length)).toBe(1);
  await page.evaluate(() => SFHSForgeApp.tab('storage'));
  await page.locator('#saves-clear').click();
  await expect(page.locator('#forge-message')).toContainText('Selected recipe saves cleared');
  expect(await page.evaluate(() => SFHSForgeApp.loadSaves(SFHSForgeApp.selected()))).toEqual([]);
  await boot(page);
  expect(await page.evaluate(() => SFHSForgeApp.loadSaves(SFHSForgeApp.selected()))).toEqual([]);
});

test('corrupt local bytes are quarantined and verified embedded bytes remain playable', async ({ page }) => {
  await boot(page, 'bad-bytes');
  const proof = await page.evaluate(async () => { const blob = await SFHSForgeApp.payloadBlob(fixture.payload.id); return { hash: await SFHSForgeCore.hashBlob(blob), expected: fixture.payload.id, keys: await SFHSForgeApp.keys(), warnings: SFHSForgeApp.state.warnings }; });
  expect(proof.hash).toBe(proof.expected); expect(proof.keys.filter(key => key.startsWith('recovery:'))).toHaveLength(1); expect(proof.warnings[0]).toContain('hash does not match');
});

test('payload writes reject wrong bytes and retain known license across deduplicated aliases', async ({ page }) => {
  await boot(page);
  const proof = await page.evaluate(async () => {
    const A = SFHSForgeApp; let rejected = false;
    try { await A.storePayload(fixture.payload, new Blob(['wrong'])); } catch (_) { rejected = true; }
    await A.storePayload({ ...fixture.payload, filename: 'alias.wad', permission: 'private-local' }, fixture.blob, true);
    return { rejected, stored: await A.get('payload:' + fixture.payload.id), count: (await A.keys()).filter(key => key.startsWith('payload:')).length };
  });
  expect(proof.rejected).toBe(true); expect(proof.count).toBe(1); expect(proof.stored.aliases).toContain('alias.wad'); expect(proof.stored.payload.permission).toBe('redistributable');
});

test('corrupt saves do not break startup or storage accounting and recover to the embedded backup', async ({ page }) => {
  await boot(page, 'bad-saves');
  const proof = await page.evaluate(async () => { const saves = await SFHSForgeApp.loadSaves(SFHSForgeApp.selected()); return { saves, keys: await SFHSForgeApp.keys(), usage: await SFHSForgeApp.storage() }; });
  expect(proof.saves).toHaveLength(1); expect(proof.keys.filter(key => key.startsWith('recovery:'))).toHaveLength(1); expect(Number.isFinite(proof.usage.saveBytes)).toBe(true);
});

test('concurrent launch requests cannot prepare or invoke the engine twice', async ({ page }) => {
  await boot(page);
  const proof = await page.evaluate(async () => {
    const A = SFHSForgeApp; let prepares = 0, starts = 0;
    SFHSForgePlayer.prepare = async () => { prepares++; await new Promise(resolve => setTimeout(resolve, 20)); };
    SFHSForgePlayer.start = () => { starts++; SFHS_P6_STATE.mainStarted = true; };
    SFHSForgePlayer.snapshot = () => ({ mountStage: prepares ? 'ready' : 'waiting', error: null });
    SFHSForgePlayer.showForge = () => {};
    window.SFHS_WASM_TEST = { forgeSnapshot: () => ({ mainInvocations: starts }) };
    window.SFHSDoomMobileControls = { snapshot: () => ({ presentation: { sdl: { presents: starts ? 1 : 0 } } }) };
    const results = await Promise.allSettled([A.launch(), A.launch()]);
    let repeat; try { await A.launch(); } catch (error) { repeat = error.message; }
    return { prepares, starts, results: results.map(result => ({ status: result.status, message: result.reason?.message })), repeat, selected: A.selected().id, launch: A.state.launch.id };
  });
  expect(proof.prepares).toBe(1); expect(proof.starts).toBe(1);
  expect(proof.results.map(result => result.status)).toEqual(['fulfilled', 'rejected']); expect(proof.results[1].message).toContain('already being prepared'); expect(proof.repeat).toContain('Return to Forge'); expect(proof.launch).toBe(proof.selected);
  writeFileSync(resolve(evidence, 'launch-concurrency.json'), JSON.stringify(proof, null, 2));
});

test('unsupported package and manual compatibility findings stop launch before native preparation', async ({ page }) => {
  await boot(page);
  const proof = await page.evaluate(async () => {
    const A = SFHSForgeApp; let prepares = 0;
    SFHSForgePlayer.prepare = async () => { prepares++; };
    const errors = [];
    for (const status of ['unsupported-by-engine', 'manual-recipe-required']) {
      A.selected().compatibility = { status, evidence: ['README requires an advanced engine'] };
      try { await A.launch(); } catch (error) { errors.push(error.message); }
    }
    delete A.selected().compatibility;
    A.state.payloads.get(fixture.payload.id).inspection.compatibility = { status: 'unsupported-by-engine', evidence: ['ZSCRIPT marker'] };
    try { await A.launch(); } catch (error) { errors.push(error.message); }
    return { prepares, errors, launch: A.state.launch, enabled: !document.getElementById('start-doom').disabled };
  });
  expect(proof.prepares).toBe(0); expect(proof.launch).toBeNull(); expect(proof.enabled).toBe(true);
  expect(proof.errors[0]).toContain('unsupported engine'); expect(proof.errors[1]).toContain('manual recipe'); expect(proof.errors[2]).toContain('ZSCRIPT marker');
});

test('quota failures and aborted IndexedDB transactions leave bytes unstored and expose recovery guidance', async ({ page }) => {
  await boot(page);
  const proof = await page.evaluate(async () => {
    const A = SFHSForgeApp, original = IDBObjectStore.prototype.put, failures = [];
    for (const mode of ['quota', 'abort']) {
      IDBObjectStore.prototype.put = function (value, key) {
        if (String(key).startsWith('payload:')) {
          if (mode === 'quota') throw new DOMException('Synthetic quota exhaustion', 'QuotaExceededError');
          const request = original.call(this, value, key); this.transaction.abort(); return request;
        }
        return original.call(this, value, key);
      };
      try { await A.storePayload(fixture.payload, fixture.blob, true); }
      catch (error) { A.fail(error); failures.push(error.message); }
      finally { IDBObjectStore.prototype.put = original; }
      if (await A.get('payload:' + fixture.payload.id) !== undefined) throw new Error('Failed transaction left a record behind');
      if (A.state.blobs.has(fixture.payload.id)) throw new Error('Failed store was exposed as committed content');
    }
    return { failures, keys: await A.keys(), status: document.getElementById('forge-message').textContent, payloadMetadataRetained: A.state.payloads.has(fixture.payload.id) };
  });
  expect(proof.failures[0]).toContain('QuotaExceededError'); expect(proof.failures[1]).toContain('Storage write failed');
  for (const message of proof.failures) { expect(message).toContain('Used'); expect(message).toContain('export a backup'); }
  expect(proof.keys.filter(key => key.startsWith('payload:'))).toEqual([]); expect(proof.payloadMetadataRetained).toBe(true); expect(proof.status).toContain('Storage write failed');
  writeFileSync(resolve(evidence, 'quota-abort.json'), JSON.stringify(proof, null, 2));
});
