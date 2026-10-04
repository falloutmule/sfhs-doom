import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

test.setTimeout(180000);
const root = resolve('..'), artifact = resolve(root, 'dist', 'sfhs-doom-forge-v3.html');
const evidence = resolve(root, 'test-results', 'FORGE-COMPLETE', 'ui');
const wad = readFileSync(resolve(root, 'tests', 'fixtures', 'open-pwads', 'order-a.wad'));
const secondWad = readFileSync(resolve(root, 'tests', 'fixtures', 'open-pwads', 'order-b.wad'));
mkdirSync(evidence, { recursive: true });

async function open(page, path = artifact, viewport = { width: 360, height: 800 }) {
  expect(existsSync(path)).toBe(true);
  await page.context().setOffline(true);
  await page.addInitScript(() => Object.defineProperty(window, 'showSaveFilePicker', { configurable: true, value: undefined }));
  await page.setViewportSize(viewport);
  await page.goto(pathToFileURL(path).href, { waitUntil: 'load', timeout: 90000 });
  await expect.poll(() => page.evaluate(() => SFHSForgeApp.state.ready || document.getElementById('setup-status').textContent), { timeout: 90000 }).toBe(true);
}
function watch(page) {
  const state = { errors: [], requests: [] };
  page.on('pageerror', error => state.errors.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url())) state.requests.push(request.url()); });
  return state;
}
async function geometry(page) {
  return page.evaluate(() => {
    const card = document.getElementById('forge-start-card'), box = card.getBoundingClientRect();
    return { viewport: [innerWidth, innerHeight], page: [document.documentElement.scrollWidth, document.documentElement.scrollHeight], scroll: [scrollX, scrollY], card: { left: box.left, top: box.top, right: box.right, bottom: box.bottom, scrollWidth: card.scrollWidth, clientWidth: card.clientWidth, scrollHeight: card.scrollHeight, clientHeight: card.clientHeight, scrollTop: card.scrollTop } };
  });
}
function expectBounded(proof) {
  expect(proof.page[0]).toBeLessThanOrEqual(proof.viewport[0]); expect(proof.page[1]).toBeLessThanOrEqual(proof.viewport[1]); expect(proof.scroll).toEqual([0, 0]);
  expect(proof.card.left).toBeGreaterThanOrEqual(0); expect(proof.card.right).toBeLessThanOrEqual(proof.viewport[0] + 1); expect(proof.card.scrollWidth).toBeLessThanOrEqual(proof.card.clientWidth + 1);
}

for (const viewport of [{ width: 360, height: 800 }, { width: 915, height: 412 }]) test(`launcher workflows stay inside the viewport with readable wrapped hashes (${viewport.width}x${viewport.height})`, async ({ page }) => {
  const hygiene = watch(page); await open(page, artifact, viewport);
  const panels = {};
  for (const [tab, filename] of [['Games', 'games'], ['Recipe', 'recipe'], ['Build', 'build']]) {
    await page.getByRole('button', { name: tab, exact: true }).click(); panels[filename] = await geometry(page); expectBounded(panels[filename]);
    await page.screenshot({ path: resolve(evidence, `${viewport.width}x${viewport.height}-${filename}.png`) });
  }
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('#forge-inspect-file').setInputFiles({ name: 'long-identity.wad', mimeType: 'application/octet-stream', buffer: wad });
  await expect(page.locator('#inspection-card code')).toContainText('SHA-256');
  const hash = await page.locator('#inspection-card code').evaluate(node => {
    const range = document.createRange(); range.selectNodeContents(node); const box = node.getBoundingClientRect(), fragments = [...range.getClientRects()];
    return { text: node.textContent, width: box.width, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, fragments: fragments.map(rect => ({ left: rect.left, right: rect.right, top: rect.top })), parent: { left: node.parentElement.getBoundingClientRect().left, right: node.parentElement.getBoundingClientRect().right } };
  });
  expect(hash.text).toMatch(/SHA-256 [a-f0-9]{64}$/); expect(hash.scrollWidth).toBeLessThanOrEqual(hash.clientWidth + 1);
  for (const fragment of hash.fragments) { expect(fragment.left).toBeGreaterThanOrEqual(hash.parent.left); expect(fragment.right).toBeLessThanOrEqual(hash.parent.right + 1); }
  if (viewport.width === 360) expect(new Set(hash.fragments.map(rect => rect.top)).size).toBeGreaterThan(1);
  await page.locator('#inspection-card code').evaluate(node => node.scrollIntoView({ block: 'center' })); await page.screenshot({ path: resolve(evidence, `${viewport.width}x${viewport.height}-inspection.png`) });
  await page.locator('#forge-start-card').evaluate(node => { node.scrollTop = node.scrollHeight; });
  const scrolled = await geometry(page); expect(scrolled.card.scrollHeight).toBeGreaterThan(scrolled.card.clientHeight); expect(scrolled.card.scrollTop).toBeGreaterThan(0); expectBounded(scrolled);
  expect(hygiene).toEqual({ errors: [], requests: [] });
  writeFileSync(resolve(evidence, `${viewport.width}x${viewport.height}-layout.json`), JSON.stringify({ panels, hash, scrolled, hygiene }, null, 2));
});

test('capsule HTML import verifies bytes while hostile scripts and remote images remain inert', async ({ page }) => {
  const hygiene = watch(page); await open(page);
  const proof = await page.evaluate(async bytes => {
    const C = SFHSForgeCore, A = SFHSForgeApp, blob = new Blob([Uint8Array.from(bytes)]), { chunks, ...metadata } = await C.encodeBlob(blob);
    const payload = { ...metadata, id: metadata.decoded.sha256, filename: 'safe-import.wad', role: 'pwad', permission: 'redistributable', license: 'Synthetic open test fixture', storage: { kind: 'embedded-chunks' } };
    const recipe = { schema: 'sfhs.doom-recipe@1', id: 'hostile-capsule-test', title: 'Safe imported recipe', engine: 'chocolate-doom', family: 'doom2', base: null, files: [{ payloadId: payload.id, mode: 'file', enabled: true }], documentIds: [], warp: 'MAP01', skill: 3, options: {}, manualOverride: false }; recipe.saveNamespace = await C.recipeNamespace(recipe);
    const manifest = { schema: 'sfhs.doom-capsule@1', capsule: { id: 'hostile-capsule-test', name: 'Inert import fixture', version: 3, mode: 'thin', forge: true, private: false, buildProfile: 'FORGE-COMPLETE-1' }, payloads: [payload], recipes: [recipe], defaultRecipe: recipe.id, credits: [], networkPolicy: { default: 'offline' } };
    const html = '<!doctype html><html><body><script>window.__capsuleExecuted=true;<\/script><img src="https://unapproved.invalid/probe.png"><script src="https://unapproved.invalid/probe.js"><\/script><script id="sfhs-forge-manifest" type="application/json">' + JSON.stringify(manifest) + '<\/script>' + chunks.map((chunk, index) => '<script type="application/octet-stream" data-forge-payload="' + payload.id + '" data-chunk="' + index + '">' + chunk + '<\/script>').join('') + '</body></html>';
    await SFHSForgeTools.importFile(new File([html], 'untrusted-capsule.html', { type: 'text/html' }));
    const stored = await A.payloadBlob(payload.id);
    return { injected: window.__capsuleExecuted || false, hash: await C.hashBlob(stored), expected: payload.id, imported: A.state.recipes.some(r => r.id === recipe.id), suspiciousNodes: document.querySelectorAll('[src*="unapproved.invalid"]').length, report: document.getElementById('forge-message').textContent };
  }, [...wad]);
  expect(proof.injected).toBe(false); expect(proof.suspiciousNodes).toBe(0); expect(proof.imported).toBe(true); expect(proof.hash).toBe(proof.expected); expect(hygiene).toEqual({ errors: [], requests: [] });
  writeFileSync(resolve(evidence, 'inert-capsule-import.json'), JSON.stringify({ proof, hygiene }, null, 2));
});

test('exported mobile preferences take effect on the first open in a fresh offline browser context', async ({ page, browser }) => {
  await open(page);
  const expected = await page.evaluate(() => {
    const prefs = structuredClone(SFHS_WASM_TEST.mobileUiSnapshot().preferences);
    prefs.lookTapFire = { enabled: false, maxDurationMs: 180, slopCssPx: 7 }; prefs.panels.portrait.hudWidth = 0.75; prefs.panels.landscape.hudWidth = 0.55;
    SFHSForgePlayer.applyMobilePreferences(prefs); return SFHS_WASM_TEST.mobileUiSnapshot().preferences;
  });
  await page.getByRole('button', { name: 'Build', exact: true }).click();
  await page.locator('#build-title').fill('first-open-preferences'); await page.locator('#build-base').selectOption('leave');
  await page.locator('#build-forge').uncheck(); await page.locator('#build-mobile').check(); await page.locator('#build-controls').uncheck(); await page.locator('#build-saves').uncheck();
  const pending = page.waitForEvent('download', { timeout: 120000 });
  await page.locator('#build-export').click();
  const download = await pending, path = resolve(evidence, 'first-open-preferences.html'); await download.saveAs(path); expect(await download.failure()).toBeNull();
  const context = await browser.newContext({ offline: true }), reopened = await context.newPage(), hygiene = watch(reopened);
  try {
    await open(reopened, path);
    const proof = await reopened.evaluate(() => ({ snapshot: SFHS_WASM_TEST.mobileUiSnapshot(), persisted: JSON.parse(localStorage.getItem(SFHS_WASM_TEST.mobileUiSnapshot().storageKey)), storedManifest: JSON.parse(document.getElementById('sfhs-forge-manifest').textContent).preferences.mobileUi }));
    expect(proof.snapshot.preferences).toEqual(expected); expect(proof.persisted).toEqual(expected); expect(proof.storedManifest).toEqual(expected); expect(hygiene).toEqual({ errors: [], requests: [] });
    writeFileSync(resolve(evidence, 'first-open-preferences.json'), JSON.stringify({ expected, proof, hygiene }, null, 2));
  } finally { await context.close(); }
});

test('selecting a WAD and README together retains both identities and binds the notice to the recipe', async ({ page }) => {
  const hygiene = watch(page); await open(page);
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  const readme = 'SFHS synthetic fixture. You may distribute this package freely. Preserve this original notice.\n';
  await page.locator('#forge-inspect-file').setInputFiles([{ name: 'together.wad', mimeType: 'application/octet-stream', buffer: wad }, { name: 'README.txt', mimeType: 'text/plain', buffer: Buffer.from(readme) }]);
  await expect(page.locator('#forge-message')).toContainText('Selected files are ready together', { timeout: 30000 });
  await expect(page.locator('#inspection-card')).toContainText('Read original README.txt');
  await page.locator('#import-recipe').click();
  const proof = await page.evaluate(() => {
    const A = SFHSForgeApp, recipe = A.selected(); return { recipe, imported: A.state.imported.map(id => A.state.payloads.get(id)), inspection: A.inspection() };
  });
  expect(proof.imported).toHaveLength(2); expect(proof.recipe.files).toHaveLength(1); expect(proof.recipe.documentIds).toHaveLength(1);
  expect(proof.imported.map(item => item.role).sort()).toEqual(['document', 'pwad']); expect(proof.imported.every(item => item.permission === 'redistributable')).toBe(true);
  expect(proof.imported.find(item => item.role === 'document').readme).toBe(readme); expect(hygiene).toEqual({ errors: [], requests: [] });
  writeFileSync(resolve(evidence, 'multiselect-wad-readme.json'), JSON.stringify({ proof, hygiene }, null, 2));
});

test('memory-only storage preserves the imported draft on Return to Forge without a second engine invocation', async ({ page }) => {
  const hygiene = watch(page);
  await page.addInitScript(() => Object.defineProperty(window, 'indexedDB', { configurable: true, value: { open() { throw new DOMException('Synthetic storage unavailable', 'SecurityError'); } } }));
  await open(page);
  expect(await page.evaluate(() => SFHSForgeApp.state.storage)).toBe('memory-only');
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('#forge-inspect-file').setInputFiles({ name: 'preserve-me.wad', mimeType: 'application/octet-stream', buffer: wad });
  await expect(page.locator('#import-actions')).toBeVisible();
  const imported = await page.evaluate(() => [...SFHSForgeApp.state.imported]);
  await page.evaluate(() => { window.__sameMemorySession = true; SFHSForgeApp.selected().warp = 'MAP01'; });
  await page.locator('#start-doom').click();
  await expect.poll(() => page.evaluate(() => SFHSDoomMobileControls.snapshot().game?.active || SFHSForgeApp.state.error), { timeout: 60000 }).toBe(1);
  if (!await page.locator('#return-forge').isVisible()) await page.locator('#settings-toggle').click();
  await page.locator('#return-forge').click();
  await expect(page.locator('#forge-message')).toContainText('Your draft remains open');
  const proof = await page.evaluate(() => ({ sameSession: window.__sameMemorySession, imported: [...SFHSForgeApp.state.imported], names: [...SFHSForgeApp.state.payloads.values()].map(item => item.filename), mainInvocations: SFHS_WASM_TEST.forgeSnapshot().mainInvocations, buildVisible: !document.querySelector('[data-panel="build"]').hidden, message: document.getElementById('forge-message').textContent }));
  expect(proof.sameSession).toBe(true); expect(proof.imported).toEqual(imported); expect(proof.names).toContain('preserve-me.wad'); expect(proof.mainInvocations).toBe(1); expect(proof.buildVisible).toBe(true); expect(hygiene).toEqual({ errors: [], requests: [] });
  writeFileSync(resolve(evidence, 'memory-only-return.json'), JSON.stringify({ proof, hygiene }, null, 2));
});

test('recipe UI reorder and disable changes effective native argument order and save namespace', async ({ page }) => {
  await open(page); await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('#forge-inspect-file').setInputFiles([{ name: 'first.wad', mimeType: 'application/octet-stream', buffer: wad }, { name: 'second.wad', mimeType: 'application/octet-stream', buffer: secondWad }]);
  await expect(page.locator('#forge-message')).toContainText('Selected files are ready together'); await page.locator('#import-recipe').click();
  const initial = await page.evaluate(() => ({ recipe: structuredClone(SFHSForgeApp.selected()), args: SFHSForgeCore.recipeArgs(SFHSForgeApp.selected(), [...SFHSForgeApp.state.payloads.values()]) }));
  expect(initial.recipe.files).toHaveLength(2);
  await page.locator('#recipe-files article').first().getByRole('button', { name: '↓', exact: true }).click(); await page.locator('#recipe-save').click();
  const reordered = await page.evaluate(() => ({ recipe: structuredClone(SFHSForgeApp.selected()), args: SFHSForgeCore.recipeArgs(SFHSForgeApp.selected(), [...SFHSForgeApp.state.payloads.values()]) }));
  expect(reordered.recipe.files.map(file => file.payloadId)).toEqual(initial.recipe.files.map(file => file.payloadId).reverse()); expect(reordered.recipe.saveNamespace).not.toBe(initial.recipe.saveNamespace);
  const paths = args => args.slice(args.indexOf('-file') + 1, args.indexOf('-warp'));
  expect(paths(reordered.args)).toEqual(paths(initial.args).reverse()); expect(reordered.args.filter(arg => arg === '-file')).toHaveLength(1);
  await page.locator('#recipe-files article').first().locator('input[type="checkbox"]').uncheck(); await page.locator('#recipe-save').click();
  const disabled = await page.evaluate(() => ({ recipe: structuredClone(SFHSForgeApp.selected()), args: SFHSForgeCore.recipeArgs(SFHSForgeApp.selected(), [...SFHSForgeApp.state.payloads.values()]) }));
  expect(paths(disabled.args)).toHaveLength(1); expect(paths(disabled.args)[0]).toContain(initial.recipe.files[0].payloadId); expect(disabled.recipe.saveNamespace).not.toBe(reordered.recipe.saveNamespace);
  writeFileSync(resolve(evidence, 'recipe-reorder-disable.json'), JSON.stringify({ initial, reordered, disabled }, null, 2));
});

test('library backup preserves orphan and disabled kept payloads with aliases and source records on actual import', async ({ page, browser }) => {
  const hygiene = watch(page); await open(page);
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('#forge-inspect-file').setInputFiles({ name: 'orphan-library.wad', mimeType: 'application/octet-stream', buffer: wad });
  await expect(page.locator('#import-actions')).toBeVisible(); await page.locator('#import-library').click();
  await expect(page.locator('#content-library')).toContainText('orphan-library.wad');
  const orphanId = await page.evaluate(() => SFHSForgeApp.state.imported[0]);
  await page.locator('#forge-inspect-file').setInputFiles({ name: 'orphan-alias.wad', mimeType: 'application/octet-stream', buffer: wad });
  await expect(page.locator('#forge-message')).toContainText('Inspected orphan-alias.wad');
  await page.locator('#forge-inspect-file').setInputFiles({ name: 'disabled-kept.wad', mimeType: 'application/octet-stream', buffer: secondWad });
  await expect(page.locator('#forge-message')).toContainText('Inspected disabled-kept.wad'); await page.locator('#import-library').click();
  await page.locator('#content-library article').filter({ has: page.getByRole('heading', { name: 'disabled-kept.wad', exact: true }) }).getByRole('button', { name: 'Add to recipe', exact: true }).click();
  await page.locator('#recipe-files article').filter({ has: page.getByRole('heading', { name: 'disabled-kept.wad', exact: true }) }).locator('input[type="checkbox"]').uncheck(); await page.locator('#recipe-save').click();
  const before = await page.evaluate(async () => {
    const A = SFHSForgeApp, records = await Promise.all((await A.keys()).filter(key => String(key).startsWith('payload:')).map(key => A.get(key))), orphan = records.find(item => item.aliases.includes('orphan-library.wad')), disabled = records.find(item => item.aliases.includes('disabled-kept.wad'));
    return { id: orphan.payload.id, filename: orphan.payload.filename, keep: orphan.keep, aliases: orphan.aliases, sources: orphan.sources, disabled: { id: disabled.payload.id, keep: disabled.keep, references: A.state.recipes.flatMap(recipe => recipe.files.filter(file => file.payloadId === disabled.payload.id)) }, recipes: A.state.recipes.length, bases: A.state.recipes.map(recipe => recipe.base), used: A.state.recipes.some(recipe => recipe.base === orphan.payload.id || recipe.files.some(file => file.payloadId === orphan.payload.id) || recipe.documentIds?.includes(orphan.payload.id)) };
  });
  expect(before.id).toBe(orphanId); expect(before.keep).toBe(true); expect(before.used).toBe(false); expect(before.aliases).toHaveLength(2); expect(before.sources).toHaveLength(2); expect(before.disabled.keep).toBe(true); expect(before.disabled.references).toHaveLength(1); expect(before.disabled.references[0].enabled).toBe(false);
  await page.getByRole('button', { name: 'Build', exact: true }).click(); await page.locator('#build-base').selectOption('leave');
  await page.getByRole('button', { name: 'Storage', exact: true }).click();
  const pending = page.waitForEvent('download', { timeout: 120000 }); await page.locator('#library-backup').click();
  const download = await pending, path = resolve(evidence, 'orphan-library-backup.html'); await download.saveAs(path); expect(await download.failure()).toBeNull();
  const context = await browser.newContext({ offline: true }), reopened = await context.newPage(), offline = watch(reopened);
  try {
    await open(reopened, path);
    const restored = await reopened.evaluate(async ({ id, disabledId }) => {
      const A = SFHSForgeApp, manifest = JSON.parse(document.getElementById('sfhs-forge-manifest').textContent), payload = manifest.payloads.find(item => item.id === id), blob = await A.payloadBlob(id), disabledBlob = await A.payloadBlob(disabledId);
      return { payload, sha256: await SFHSForgeCore.hashBlob(blob), disabledSha256: await SFHSForgeCore.hashBlob(disabledBlob), recipe: manifest.recipes.find(recipe => recipe.files.some(file => file.payloadId === id)), disabledRecipe: manifest.recipes.find(recipe => recipe.files.some(file => file.payloadId === disabledId && file.enabled)), bases: manifest.payloads.filter(item => item.role === 'iwad').map(item => item.id), forge: manifest.capsule.forge, private: manifest.capsule.private, recipes: manifest.recipes.length };
    }, { id: before.id, disabledId: before.disabled.id });
    expect(restored.sha256).toBe(before.id); expect(restored.payload.filename).toBe(before.filename); expect(restored.payload.aliases).toEqual(before.aliases); expect(restored.recipe).toBeTruthy(); expect(restored.disabledSha256).toBe(before.disabled.id); expect(restored.disabledRecipe).toBeTruthy(); expect(restored.recipes).toBe(before.recipes + 2); expect(restored.forge).toBe(true); expect(restored.private).toBe(true); expect(restored.bases).toEqual(expect.arrayContaining(before.bases));
    const importContext = await browser.newContext({ offline: true }), importPage = await importContext.newPage(), importedHygiene = watch(importPage);
    let imported;
    try {
      await open(importPage); await importPage.getByRole('button', { name: 'Import', exact: true }).click(); await importPage.locator('#forge-inspect-file').setInputFiles(path);
      await expect(importPage.locator('#forge-message')).toContainText('Capsule content imported and verified', { timeout: 90000 });
      imported = await importPage.evaluate(async ({ id, disabledId }) => {
        const A = SFHSForgeApp, record = await A.get('payload:' + id), disabled = await A.get('payload:' + disabledId);
        return { aliases: record.aliases, sources: record.sources, keep: record.keep, sha256: await SFHSForgeCore.hashBlob(record.blob), disabledKeep: disabled.keep, disabledHash: await SFHSForgeCore.hashBlob(disabled.blob) };
      }, { id: before.id, disabledId: before.disabled.id });
      expect([...imported.aliases].sort()).toEqual([...before.aliases].sort()); expect(imported.sources).toEqual(expect.arrayContaining(before.sources)); expect(imported.keep).toBe(true); expect(imported.sha256).toBe(before.id); expect(imported.disabledKeep).toBe(true); expect(imported.disabledHash).toBe(before.disabled.id); expect(importedHygiene).toEqual({ errors: [], requests: [] });
    } finally { await importContext.close(); }
    expect(hygiene).toEqual({ errors: [], requests: [] }); expect(offline).toEqual({ errors: [], requests: [] });
    writeFileSync(resolve(evidence, 'orphan-library-backup.json'), JSON.stringify({ before, restored, imported, importedHygiene, hygiene, offline }, null, 2));
  } finally { await context.close(); }
});

test('loose WAD and advanced-engine README cannot reach native preparation even with manual override', async ({ page }) => {
  await open(page); await page.getByRole('button', { name: 'Import', exact: true }).click();
  const readme = 'Title: Unsupported loose package\nAdvanced engine required: GZDoom\nYou may distribute this package freely.\n';
  await page.locator('#forge-inspect-file').setInputFiles([{ name: 'advanced-readme.wad', mimeType: 'application/octet-stream', buffer: wad }, { name: 'README.txt', mimeType: 'text/plain', buffer: Buffer.from(readme) }]);
  await expect(page.locator('#forge-message')).toContainText('Selected files are ready together'); await page.locator('#import-recipe').click();
  const proof = await page.evaluate(async () => {
    const A = SFHSForgeApp; let prepares = 0, error = null;
    const original = SFHSForgePlayer; window.SFHSForgePlayer = { ...original, prepare: async () => { prepares++; throw new Error('Unexpected native preparation reached'); } };
    A.selected().manualOverride = true;
    try { await A.launch(); } catch (failure) { error = failure.message; } finally { window.SFHSForgePlayer = original; }
    return { compatibility: A.selected().compatibility, prepares, error, nativeInvocations: SFHS_WASM_TEST.forgeSnapshot().mainInvocations, inspection: A.inspection() };
  });
  writeFileSync(resolve(evidence, 'loose-advanced-readme.json'), JSON.stringify(proof, null, 2));
  expect(proof.compatibility.status).toBe('unsupported-by-engine'); expect(proof.prepares).toBe(0); expect(proof.error).toMatch(/unsupported.*GZDoom/i); expect(proof.nativeInvocations).toBe(0);
});

test('capsule import remaps colliding recipe save namespaces without overwriting existing saves', async ({ page }) => {
  const hygiene = watch(page); await open(page);
  const fixture = await page.evaluate(async () => {
    const A = SFHSForgeApp, C = SFHSForgeCore, original = structuredClone(A.selected()), recipe = structuredClone(original);
    recipe.base = null; recipe.files = []; recipe.documentIds = []; recipe.title = 'Imported saved collision'; recipe.saveNamespace = await C.recipeNamespace(recipe);
    const record = (namespace, value) => { const bytes = new TextEncoder().encode(value); return { namespace, filename: 'doomsav0.dsg', bytes: bytes.length, sha256: C.hashBytes(bytes), data: C.bytesToBase64(bytes) }; };
    const existingSave = record(original.saveNamespace, 'Synthetic pre-existing save namespace fixture'), importedSave = record(recipe.saveNamespace, 'Synthetic imported save namespace fixture');
    await A.put('saves:' + original.saveNamespace, [existingSave]);
    const manifest = structuredClone(A.state.manifest); manifest.capsule.id = 'saved-collision-fixture'; manifest.capsule.name = 'Saved collision fixture'; manifest.capsule.mode = 'thin'; manifest.payloads = []; manifest.recipes = [recipe]; manifest.defaultRecipe = recipe.id; manifest.saves = [importedSave]; delete manifest.preferences;
    C.validateManifest(manifest);
    const html = '<!doctype html><html><body><script id="sfhs-forge-manifest" type="application/json">' + JSON.stringify(manifest) + '<\/script></body></html>';
    return { html, original, existingSave, importedSave, importedRecipe: recipe, initialRecipes: A.state.recipes.length };
  });
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('#forge-inspect-file').setInputFiles({ name: 'saved-collision.html', mimeType: 'text/html', buffer: Buffer.from(fixture.html) });
  await expect(page.locator('#forge-message')).toContainText('Capsule content imported and verified', { timeout: 30000 });
  const proof = await page.evaluate(async originalId => {
    const A = SFHSForgeApp, imported = A.state.recipes.find(recipe => recipe.title === 'Imported saved collision'), original = A.state.recipes.find(recipe => recipe.id === originalId);
    return { imported, original, recipes: A.state.recipes.length, importedStored: await A.get('saves:' + imported.saveNamespace), importedLoaded: await A.loadSaves(imported), existing: await A.loadSaves(original) };
  }, fixture.original.id);
  writeFileSync(resolve(evidence, 'import-save-remap.json'), JSON.stringify({ fixture: { ...fixture, html: undefined }, proof, hygiene }, null, 2));
  expect(proof.recipes).toBe(fixture.initialRecipes + 1); expect(proof.imported.id).not.toBe(fixture.original.id); expect(proof.imported.saveNamespace).not.toBe(fixture.importedSave.namespace); expect(proof.original.saveNamespace).toBe(fixture.original.saveNamespace);
  const remappedSave = { ...fixture.importedSave, namespace: proof.imported.saveNamespace };
  expect(proof.importedStored).toEqual([remappedSave]); expect(proof.importedLoaded).toEqual([remappedSave]); expect(proof.existing).toEqual([fixture.existingSave]); expect(hygiene).toEqual({ errors: [], requests: [] });
});
