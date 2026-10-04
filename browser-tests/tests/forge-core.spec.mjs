import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const source = readFileSync(new URL('../../web/forge/forge-core.js', import.meta.url), 'utf8');
const evidence = resolve('..', 'test-results', 'FORGE-COMPLETE', 'core');
mkdirSync(evidence, { recursive: true });

test.beforeEach(async ({ page }) => {
  await page.goto('about:blank');
  await page.addScriptTag({ content: source });
  await page.evaluate(() => {
    window.makePayload = async (value, filename = 'test.wad', role = 'iwad', compression = 'none', chunkSize = 5) => {
      const blob = new Blob([value]), result = await SFHSForgeCore.encodeBlob(blob, { compression, chunkSize });
      const { chunks, ...meta } = result;
      const payload = { id: meta.decoded.sha256, filename, role, ...meta, permission: 'redistributable', license: 'CC0 test fixture', source: 'synthetic test', storage: { kind: 'embedded-chunks' } };
      return { blob, chunks, payload };
    };
    window.makeRecipe = async (base, overrides = {}) => {
      const recipe = { schema: 'sfhs.doom-recipe@1', id: 'test', title: 'Test game', engine: 'chocolate-doom', base, family: 'doom2', files: [], documentIds: [], warp: 'MAP01', skill: 3, options: { nomonsters: false, fast: false, respawn: false }, manualOverride: false, embeddedDehacked: false, ...overrides };
      recipe.saveNamespace = await SFHSForgeCore.recipeNamespace(recipe); return recipe;
    };
    window.makeManifest = (payloads, recipes) => ({ schema: 'sfhs.doom-capsule@1', capsule: { id: 'fixture', name: 'Test capsule', version: 3, mode: recipes.length > 1 ? 'collection' : recipes[0].base === null ? 'thin' : 'full', forge: true, private: false, buildProfile: 'FORGE-COMPLETE-1' }, payloads, recipes, defaultRecipe: recipes[0].id, credits: ['Synthetic fixtures'], networkPolicy: { default: 'offline' } });
    window.payloadRoot = fixture => {
      const root = document.createElement('section');
      fixture.chunks.forEach((chunk, index) => { const node = document.createElement('script'); node.type = 'application/octet-stream'; node.dataset.forgePayload = fixture.payload.id; node.dataset.chunk = String(index); node.textContent = chunk; root.append(node); });
      return root;
    };
    window.errorCode = async callback => { try { await callback(); return null; } catch (error) { return typeof error.code === 'string' ? error.code : error.name; } };
  });
});

test('incremental hashes match Node SHA-256 at block boundaries and yield during large blobs', async ({ page }) => {
  const sizes = [0, 1, 55, 56, 63, 64, 65, 127, 128, 257, 1048579];
  const expected = sizes.map(size => createHash('sha256').update(Uint8Array.from({ length: size }, (_, i) => i % 251)).digest('hex'));
  const result = await page.evaluate(async sizes => {
    let ticks = 0; const timer = setInterval(() => ticks++, 0);
    const hashes = [];
    for (const size of sizes) hashes.push(await SFHSForgeCore.hashBlob(new Blob([Uint8Array.from({ length: size }, (_, i) => i % 251)])));
    clearInterval(timer); return { hashes, ticks };
  }, sizes);
  expect(result.hashes).toEqual(expected); expect(result.ticks).toBeGreaterThan(0);
});

test('launch recipes group native merge/file/deh flags once and enforce safe engine inputs', async ({ page }) => {
  const proof = await page.evaluate(async () => {
    const base = await makePayload('IWAD fixture', 'base.wad');
    const addon1 = await makePayload('PWAD one', 'same.wad', 'pwad');
    const addon2 = await makePayload('PWAD two', 'same.wad', 'pwad');
    const patch = await makePayload('Patch File for DeHackEd', 'change.deh', 'deh');
    const payloads = [base, addon1, addon2, patch].map(item => item.payload);
    const recipe = await makeRecipe(base.payload.id, { files: [{ payloadId: addon1.payload.id, mode: 'file', enabled: true }, { payloadId: addon2.payload.id, mode: 'merge', enabled: true }, { payloadId: patch.payload.id, mode: 'deh', enabled: true }], embeddedDehacked: true, options: { fast: true } });
    const args = SFHSForgeCore.recipeArgs(recipe, payloads);
    const invalid = [];
    for (const override of [{ args: ['-connect', 'example.com'] }, { warp: 'MAP01 -net' }, { base: null }, { options: { net: true } }, { files: [{ payloadId: addon1.payload.id, mode: 'deh', enabled: true }] }]) invalid.push(await errorCode(() => SFHSForgeCore.recipeArgs({ ...recipe, ...override }, payloads)));
    const doom = await makeRecipe(base.payload.id, { family: 'doom', warp: 'E2M4' });
    return { args, doom: SFHSForgeCore.recipeArgs(doom, payloads), effective: SFHSForgeCore.effectiveFiles(recipe).map(file => file.mode), invalid, names: [addon1, addon2].map(item => SFHSForgeCore.mountName(item.payload)) };
  });
  expect(proof.effective).toEqual(['merge', 'file', 'deh']);
  for (const flag of ['-merge', '-file', '-deh', '-dehlump']) expect(proof.args.filter(value => value === flag)).toHaveLength(1);
  expect(proof.args.indexOf('-merge')).toBeLessThan(proof.args.indexOf('-file'));
  expect(proof.doom.slice(proof.doom.indexOf('-warp'), proof.doom.indexOf('-warp') + 3)).toEqual(['-warp', '2', '4']);
  expect(proof.invalid).toEqual(['recipe-structure', 'recipe-warp', 'recipe-missing-base', 'recipe-options', 'recipe-load-mode']);
  expect(proof.names[0]).not.toEqual(proof.names[1]);
  writeFileSync(resolve(evidence, 'recipe.json'), JSON.stringify(proof, null, 2));
});

test('save namespaces isolate recipe identity, base, effective order and engine settings', async ({ page }) => {
  const proof = await page.evaluate(async () => {
    const id = 'a'.repeat(64), addon = 'b'.repeat(64), other = 'c'.repeat(64);
    const recipe = await makeRecipe(id, { files: [{ payloadId: addon, mode: 'file', enabled: true }, { payloadId: other, mode: 'file', enabled: true }] });
    const stable = await SFHSForgeCore.recipeNamespace({ ...recipe, title: 'Rename only' });
    const changed = await Promise.all([{ id: 'copy' }, { base: other }, { files: [...recipe.files].reverse() }, { skill: 4 }, { options: { fast: true } }, { embeddedDehacked: true }].map(change => SFHSForgeCore.recipeNamespace({ ...recipe, ...change })));
    return { original: recipe.saveNamespace, stable, changed };
  });
  expect(proof.stable).toBe(proof.original);
  expect(new Set([proof.original, ...proof.changed]).size).toBe(7);
});

test('known IWAD game families cannot be selected for an incompatible recipe', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const fixture = await makePayload('Doom episode base'); fixture.payload.inspection = { targetGame: 'doom' };
    const recipe = await makeRecipe(fixture.payload.id);
    const mismatch = await errorCode(() => SFHSForgeCore.recipeArgs(recipe, [fixture.payload]));
    recipe.family = 'doom'; recipe.warp = 'E1M1';
    return { mismatch, valid: SFHSForgeCore.recipeArgs(recipe, [fixture.payload]).includes('-iwad') };
  });
  expect(result).toEqual({ mismatch: 'recipe-base-family', valid: true });
});

test('plain and gzip chunks verify exact bytes, encoded hash, decoded hash and bounded output', async ({ page }) => {
  const proof = await page.evaluate(async () => {
    const results = [];
    for (const compression of ['none', 'gzip']) {
      const fixture = await makePayload('verified bytes '.repeat(2048), 'test.wad', 'iwad', compression, 1024);
      const decoded = await SFHSForgeCore.decodePayload(fixture.payload, payloadRoot(fixture));
      results.push({ compression, size: decoded.size, hash: await SFHSForgeCore.hashBlob(decoded), expected: fixture.payload.id });
    }
    const fixture = await makePayload('decompression overflow'.repeat(1000), 'test.wad', 'iwad', 'gzip');
    fixture.payload.decoded.bytes = 1;
    const overflow = await errorCode(() => SFHSForgeCore.decodePayload(fixture.payload, payloadRoot(fixture)));
    return { results, overflow };
  });
  for (const result of proof.results) expect(result.hash).toBe(result.expected);
  expect(proof.overflow).toBe('decoded-size-overflow');
});

test('8 MiB incompressible payloads round trip in chunks with progress and cancellation', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const input = new Uint8Array(8 * 1024 * 1024 + 1); let random = 7919;
    for (let i = 0; i < input.length; i++) { random ^= random << 13; random ^= random >>> 17; random ^= random << 5; input[i] = random; }
    const started = performance.now(), fixture = await makePayload(input, 'large.wad', 'iwad', 'gzip', 262144);
    let updates = 0;
    const output = await SFHSForgeCore.decodePayload(fixture.payload, payloadRoot(fixture), () => updates++);
    const controller = new AbortController();
    const cancelled = await errorCode(() => SFHSForgeCore.decodePayload(fixture.payload, payloadRoot(fixture), () => controller.abort(), controller.signal));
    const template = new Uint8Array(4 * 1024 * 1024); template.fill(97);
    const decodedTemplate = SFHSForgeCore.base64ToBytes(SFHSForgeCore.bytesToBase64(template));
    return { decoded: output.size, encoded: fixture.payload.encoded.bytes, chunks: fixture.payload.chunkCount, input: input.length, hash: await SFHSForgeCore.hashBlob(output), expected: fixture.payload.id, updates, cancelled, templateBytes: decodedTemplate.length, elapsedMs: performance.now() - started };
  });
  expect(result.decoded).toBe(result.input); expect(result.encoded).toBeGreaterThan(result.input * 0.95);
  expect(result.hash).toBe(result.expected); expect(result.updates).toBeGreaterThan(1); expect(result.chunks).toBeGreaterThan(30); expect(result.cancelled).toBe('AbortError'); expect(result.templateBytes).toBe(4 * 1024 * 1024);
  writeFileSync(resolve(evidence, 'large-payload.json'), JSON.stringify(result, null, 2));
});

test('verifier rejects missing, duplicated, reordered, corrupted and undeclared chunks', async ({ page }) => {
  const proof = await page.evaluate(async () => {
    const fixture = await makePayload('0123456789abcdef');
    const cases = {};
    const changed = async (name, mutate) => { const root = payloadRoot(fixture); mutate(root); cases[name] = await errorCode(() => SFHSForgeCore.decodePayload(fixture.payload, root)); };
    await changed('missing', root => root.firstChild.remove());
    await changed('duplicate', root => root.append(root.firstChild.cloneNode(true)));
    await changed('reordered', root => root.prepend(root.lastChild));
    await changed('corrupt', root => root.firstChild.textContent = 'QUFBQUE=');
    await changed('bad64', root => root.firstChild.textContent = '!!!!!!==');
    const recipe = await makeRecipe(fixture.payload.id), manifest = makeManifest([fixture.payload], [recipe]);
    const root = payloadRoot(fixture), extra = document.createElement('script'); extra.dataset.forgePayload = 'f'.repeat(64); root.append(extra);
    cases.undeclared = await errorCode(() => SFHSForgeCore.verifyCapsule(manifest, root));
    const gzip = await makePayload('hello gzip', 'compressed.wad', 'iwad', 'gzip');
    gzip.payload.id = 'a'.repeat(64); gzip.payload.decoded.sha256 = gzip.payload.id;
    cases.decodedHash = await errorCode(() => SFHSForgeCore.decodePayload(gzip.payload, payloadRoot(gzip)));
    return cases;
  });
  expect(proof).toEqual({ missing: 'payload-chunks', duplicate: 'payload-chunks', reordered: 'chunk-order', corrupt: 'encoded-hash', bad64: 'chunk-base64', undeclared: 'undeclared-payload', decodedHash: 'decoded-hash' });
  writeFileSync(resolve(evidence, 'adversarial-chunks.json'), JSON.stringify(proof, null, 2));
});

test('strict manifest validation rejects unsupported formats, duplicate identities and missing references', async ({ page }) => {
  const proof = await page.evaluate(async () => {
    const fixture = await makePayload('manifest fixture'), recipe = await makeRecipe(fixture.payload.id), manifest = makeManifest([fixture.payload], [recipe]);
    const failures = [];
    for (const mutate of [m => m.schema = 'unknown', m => m.payloads[0].compression = 'zstd', m => m.payloads.push(m.payloads[0]), m => m.payloads = [], m => m.defaultRecipe = 'unknown', m => m.recipes[0].options = { arbitrary: true }, m => m.payloads[0].filename = '../attack.wad', m => m.capsule.mode = 'thin', m => m.payloads[0].permission = 'unclear']) {
      const copy = structuredClone(manifest); mutate(copy); failures.push(await errorCode(() => SFHSForgeCore.validateManifest(copy)));
    }
    return failures;
  });
  expect(proof).toEqual(['manifest-schema', 'payload-compression', 'payload-duplicate', 'recipe-base', 'manifest-default-recipe', 'recipe-options', 'payload-filename', 'manifest-thin-base', 'manifest-private-marker']);
});

test('full, player, thin, replacement, private and deduplicated collection exports select exact payloads', async ({ page }) => {
  const proof = await page.evaluate(async source => {
    const template = '<!doctype html><html><body><!-- FORGE_MANIFEST --><!-- FORGE_PAYLOADS --><!-- FORGE_TEMPLATE --><script>' + source + '<\/script><!-- FORGE_TOOLS_START --><button id="forge-editor">Forge editor</button><!-- FORGE_TOOLS_END --><!-- FORGE_ENGINE --></body></html>';
    const base = await makePayload('open old base bytes', 'old.wad'), replacement = await makePayload('open new base bytes', 'new.wad'), addon = await makePayload('pwad bytes', 'add.wad', 'pwad');
    const payloads = new Map([base, replacement, addon].map(item => [item.payload.id, item.blob]));
    const recipe = await makeRecipe(base.payload.id, { files: [{ payloadId: addon.payload.id, mode: 'file', enabled: true }] });
    const manifest = makeManifest([base.payload, replacement.payload, addon.payload], [recipe]);
    const run = async (m, includeForge) => {
      const result = await SFHSForgeCore.exportCapsule({ manifest: m, payloads, template, includeForge, engineSource: 'window.testEngineLoads = (window.testEngineLoads || 0) + 1;' });
      const text = await result.blob.text(), doc = new DOMParser().parseFromString(text, 'text/html');
      const verified = await SFHSForgeCore.verifyCapsule(JSON.parse(doc.getElementById('sfhs-forge-manifest').textContent), doc);
      return { result, text, report: { ids: result.manifest.payloads.map(p => p.id), mode: result.manifest.capsule.mode, private: result.manifest.capsule.private, template: !!doc.getElementById('sfhs-forge-template'), editor: !!doc.getElementById('forge-editor'), engineCopies: doc.querySelectorAll('#sfhs-forge-engine').length, hash: await SFHSForgeCore.hashBlob(result.blob), declaredHash: result.sha256, verified: verified.report.verified } };
    };
    const full = await run(manifest, true), player = await run(manifest, false);
    const thinManifest = structuredClone(manifest); thinManifest.recipes[0].base = null;
    const thin = await run(thinManifest, false);
    const replaceManifest = structuredClone(manifest); replaceManifest.recipes[0].base = replacement.payload.id;
    const replace = await run(replaceManifest, true);
    const privateManifest = structuredClone(manifest); privateManifest.payloads[0].permission = 'private-local';
    const noConsent = await errorCode(() => run(privateManifest, true));
    privateManifest.capsule.private = true; const privateOutput = await run(privateManifest, true);
    const collectionManifest = structuredClone(manifest); collectionManifest.recipes.push(await makeRecipe(base.payload.id, { id: 'second' }));
    const collection = await run(collectionManifest, true);
    return { base: base.payload.id, replacement: replacement.payload.id, addon: addon.payload.id, full: full.report, player: player.report, thin: thin.report, replace: replace.report, private: privateOutput.report, noConsent, collection: collection.report };
  }, source);
  expect(proof.full.ids).toEqual([proof.base, proof.addon]);
  expect(proof.player.template).toBe(false); expect(proof.player.editor).toBe(false);
  expect(proof.full.template).toBe(true); expect(proof.full.editor).toBe(true);
  expect(proof.thin.ids).toEqual([proof.addon]); expect(proof.thin.mode).toBe('thin');
  expect(proof.replace.ids).toEqual([proof.replacement, proof.addon]);
  expect(proof.noConsent).toBe('export-private-consent'); expect(proof.private.private).toBe(true);
  expect(proof.collection.ids).toEqual([proof.base, proof.addon]); expect(proof.collection.mode).toBe('collection');
  for (const key of ['full', 'player', 'thin', 'replace', 'private', 'collection']) { expect(proof[key].hash).toBe(proof[key].declaredHash); expect(proof[key].engineCopies).toBe(1); expect(proof[key].verified).toBe(true); }
  writeFileSync(resolve(evidence, 'export-matrix.json'), JSON.stringify(proof, null, 2));
});

test('Forge A exports B, reopened B imports bytes and exports C with a carried executable template', async ({ page }) => {
  const requests = []; page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
  const initial = await page.evaluate(async source => {
    const template = '<!doctype html><html><body><!-- FORGE_MANIFEST --><!-- FORGE_PAYLOADS --><!-- FORGE_TEMPLATE --><script>' + source + '<\/script><!-- FORGE_TOOLS_START --><button id="forge-editor">Editor</button><!-- FORGE_TOOLS_END --><!-- FORGE_ENGINE --></body></html>';
    const base = await makePayload('recursive base fixture'), recipe = await makeRecipe(base.payload.id), manifest = makeManifest([base.payload], [recipe]);
    const output = await SFHSForgeCore.exportCapsule({ manifest, payloads: new Map([[base.payload.id, base.blob]]), template, engineSource: 'window.engineBoots = (window.engineBoots || 0) + 1;' });
    return output.blob.text();
  }, source);
  const bPath = resolve(evidence, 'recursive-b.html'); writeFileSync(bPath, initial);
  await page.goto(new URL(`file:///${bPath.replaceAll('\\', '/')}`).href);
  expect(await page.evaluate(() => window.engineBoots)).toBe(1);
  const c = await page.evaluate(async () => {
    const manifest = JSON.parse(document.getElementById('sfhs-forge-manifest').textContent);
    const verified = await SFHSForgeCore.verifyCapsule(manifest);
    const blob = new Blob(['new successor PWAD']), metadata = await SFHSForgeCore.encodeBlob(blob, { compression: 'gzip' });
    const { chunks, ...fields } = metadata;
    const payload = { ...fields, id: fields.decoded.sha256, filename: 'successor.wad', role: 'pwad', permission: 'redistributable', license: 'CC0 test', storage: { kind: 'embedded-chunks' } };
    manifest.payloads.push(payload); manifest.recipes[0].files.push({ payloadId: payload.id, mode: 'file', enabled: true }); verified.payloads.set(payload.id, blob);
    const result = await SFHSForgeCore.exportCapsule({ manifest, payloads: verified.payloads, template: SFHSForgeCore.getTemplate() });
    return { html: await result.blob.text(), hash: result.sha256, bytes: result.bytes };
  });
  const cPath = resolve(evidence, 'recursive-c.html'); writeFileSync(cPath, c.html);
  await page.goto(new URL(`file:///${cPath.replaceAll('\\', '/')}`).href);
  const report = await page.evaluate(async () => { const result = await SFHSForgeCore.verifyCapsule(JSON.parse(document.getElementById('sfhs-forge-manifest').textContent)); return { report: result.report, boots: window.engineBoots, template: SFHSForgeCore.getTemplate().includes('FORGE_ENGINE'), files: result.manifest.recipes[0].files.length }; });
  expect(report.report.payloads).toBe(2); expect(report.files).toBe(1); expect(report.boots).toBe(1); expect(report.template).toBe(true); expect(requests).toEqual([]);
  expect(createHash('sha256').update(c.html).digest('hex')).toBe(c.hash);
  writeFileSync(resolve(evidence, 'recursive-proof.json'), JSON.stringify({ ...report, bytes: c.bytes, sha256: c.hash, requests }, null, 2));
});

test('stream writer matches Blob output and cancellation never reports a successful artifact', async ({ page }) => {
  const proof = await page.evaluate(async () => {
    const fixture = await makePayload('stream fixture'), recipe = await makeRecipe(fixture.payload.id), manifest = makeManifest([fixture.payload], [recipe]);
    const args = { manifest, payloads: new Map([[fixture.payload.id, fixture.blob]]), template: '<!-- FORGE_MANIFEST --><!-- FORGE_PAYLOADS --><!-- FORGE_TEMPLATE --><!-- FORGE_ENGINE -->', engineSource: 'window.test = true;', includeForge: false };
    const blob = await SFHSForgeCore.exportCapsule(args), parts = []; let closed = false;
    const streamed = await SFHSForgeCore.exportCapsule({ ...args, writer: { write: async part => parts.push(part), close: async () => { closed = true; }, abort: async () => {} } });
    const cancelled = new AbortController(); cancelled.abort();
    const abort = await errorCode(() => SFHSForgeCore.exportCapsule({ ...args, signal: cancelled.signal }));
    let aborted = false;
    const writeFailure = await errorCode(() => SFHSForgeCore.exportCapsule({ ...args, writer: { write: async () => { throw new Error('disk full'); }, abort: async () => { aborted = true; } } }));
    return { same: blob.sha256 === streamed.sha256, streamedHash: await SFHSForgeCore.hashBlob(new Blob(parts)), expected: blob.sha256, bytes: streamed.bytes, expectedBytes: blob.bytes, closed, hasBlob: Object.hasOwn(streamed, 'blob'), abort, writeFailure, aborted };
  });
  expect(proof).toMatchObject({ same: true, closed: true, hasBlob: false, abort: 'AbortError', writeFailure: 'Error', aborted: true });
  expect(proof.streamedHash).toBe(proof.expected); expect(proof.bytes).toBe(proof.expectedBytes);
});

test('save import verifies hashes and rejects traversal or a different recipe namespace', async ({ page }) => {
  const proof = await page.evaluate(async () => {
    const fixture = await makePayload('save base'), recipe = await makeRecipe(fixture.payload.id);
    const bytes = new TextEncoder().encode('synthetic save');
    const save = { namespace: recipe.saveNamespace, filename: 'doomsav0.dsg', bytes: bytes.length, sha256: SFHSForgeCore.hashBytes(bytes), data: SFHSForgeCore.bytesToBase64(bytes) };
    const good = await SFHSForgeCore.verifySaves([save], [recipe]);
    const bad = [];
    for (const override of [{ filename: '../save.dsg' }, { namespace: 'forge-' + 'a'.repeat(64) }, { sha256: 'a'.repeat(64) }]) bad.push(await errorCode(() => SFHSForgeCore.verifySaves([{ ...save, ...override }], [recipe])));
    return { good, bad };
  });
  expect(proof).toEqual({ good: true, bad: ['save-filename', 'save-namespace', 'save-hash'] });
});

test('101 MiB payload exports more than 134 MiB through bounded writer chunks with independent digest verification', async ({ page }) => {
  test.setTimeout(300000);
  const proof = await page.evaluate(async () => {
    const C = SFHSForgeCore, shared = new Uint8Array(1024 * 1024);
    for (let i = 0; i < shared.length; i++) shared[i] = (i * 13 + (i >>> 11)) & 255;
    // Reuse one deterministic fixture chunk. Never build a fixture-sized JS array or output string.
    const blob = new Blob(Array(101).fill(shared)), identity = await C.hashBlob(blob), chunkSize = 262144;
    const payload = { id: identity, filename: 'large-export-fixture.bin', role: 'document', decoded: { bytes: blob.size, sha256: identity }, encoded: { bytes: blob.size, sha256: identity }, compression: 'none', encoding: 'base64', chunkSize, chunkCount: Math.ceil(blob.size / chunkSize), permission: 'redistributable', license: 'Generated deterministic test bytes', storage: { kind: 'embedded-chunks' } };
    const recipe = await makeRecipe(null, { documentIds: [identity] }), manifest = makeManifest([payload], [recipe]);
    const writerDigest = new C.IncrementalSha256(); let writerBytes = 0, writes = 0, maximumWriteBytes = 0, closed = false, ticks = 0, progressEvents = 0;
    const heapStart = performance.memory?.usedJSHeapSize ?? null; let maximumObservedHeap = heapStart, longestTickGapMs = 0, lastTick = performance.now();
    const timer = setInterval(() => { ticks++; const now = performance.now(); longestTickGapMs = Math.max(longestTickGapMs, now - lastTick); lastTick = now; const heap = performance.memory?.usedJSHeapSize; if (heap !== undefined) maximumObservedHeap = Math.max(maximumObservedHeap || 0, heap); }, 10);
    const start = performance.now(); let result;
    try {
      result = await C.exportCapsule({ manifest, payloads: new Map([[identity, blob]]), template: '<!doctype html><html><body><!-- FORGE_MANIFEST --><!-- FORGE_PAYLOADS --><!-- FORGE_TEMPLATE --><!-- FORGE_ENGINE --></body></html>', includeForge: false, engineSource: 'window.largeExportFixture = true;', progress: () => progressEvents++, writer: { write: async bytes => { maximumWriteBytes = Math.max(maximumWriteBytes, bytes.byteLength); writerBytes += bytes.byteLength; writes++; writerDigest.update(bytes); }, close: async () => { closed = true; }, abort: async () => {} } });
    } finally { clearInterval(timer); }
    return { fixtureBytes: blob.size, outputBytes: result.bytes, writerBytes, outputSha256: result.sha256, independentlyObservedSha256: writerDigest.hex(), writes, maximumWriteBytes, closed, returnedBlob: Object.hasOwn(result, 'blob'), responsivenessTicks: ticks, progressEvents, elapsedMs: performance.now() - start, longestObservedTickGapMs: longestTickGapMs, heapStart, maximumObservedHeap, heapEnd: performance.memory?.usedJSHeapSize ?? null, measurementScope: 'Desktop Chromium; JavaScript heap API excludes some Blob/native storage; this is not a phone capacity claim.' };
  });
  expect(proof.fixtureBytes).toBeGreaterThan(100 * 1024 * 1024); expect(proof.outputBytes).toBeGreaterThan(134 * 1024 * 1024);
  expect(proof.outputBytes).toBe(proof.writerBytes); expect(proof.outputSha256).toBe(proof.independentlyObservedSha256); expect(proof.maximumWriteBytes).toBeLessThanOrEqual(262144);
  expect(proof.closed).toBe(true); expect(proof.returnedBlob).toBe(false); expect(proof.writes).toBeGreaterThan(400); expect(proof.responsivenessTicks).toBeGreaterThan(100); expect(proof.progressEvents).toBeGreaterThan(400);
  writeFileSync(resolve(evidence, 'large-streamed-export.json'), JSON.stringify(proof, null, 2));
});
