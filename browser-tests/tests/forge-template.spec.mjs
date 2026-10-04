import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

test.setTimeout(180000);
const artifact = resolve('..', 'dist', 'sfhs-doom-forge-v3.html');
const evidence = resolve('..', 'test-results', 'FORGE-COMPLETE', 'template');
mkdirSync(evidence, { recursive: true });

test('real built capsule carries one bounded template and exports an engine-complete player without Forge blocks', async ({ page }) => {
  const requests = [], errors = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.context().setOffline(true);
  await page.goto(pathToFileURL(artifact).href, { waitUntil: 'load', timeout: 90000 });
  await expect.poll(() => page.evaluate(() => SFHSForgeApp.state.ready || document.getElementById('setup-status').textContent), { timeout: 90000 }).toBe(true);
  const proof = await page.evaluate(async () => {
    const C = SFHSForgeCore, template = C.getTemplate(), initial = JSON.parse(document.getElementById('sfhs-forge-manifest').textContent);
    const markers = Object.fromEntries(['MANIFEST', 'PAYLOADS', 'TEMPLATE', 'ENGINE'].map(name => [name, template.split('<!-- FORGE_' + name + ' -->').length - 1]));
    const manifest = structuredClone(initial); manifest.recipes = [manifest.recipes[0]]; manifest.recipes[0].base = null; manifest.recipes[0].files = []; manifest.recipes[0].documentIds = []; manifest.payloads = []; manifest.defaultRecipe = manifest.recipes[0].id; delete manifest.saves;
    const result = await C.exportCapsule({ manifest, payloads: new Map(), template, includeForge: false });
    const output = await result.blob.text(), doc = new DOMParser().parseFromString(output, 'text/html'), verified = await C.verifyCapsule(JSON.parse(doc.getElementById('sfhs-forge-manifest').textContent), doc);
    const engine = doc.getElementById('sfhs-forge-engine').textContent;
    const successor = await C.exportCapsule({ manifest, payloads: new Map(), template, includeForge: true });
    const successorDoc = new DOMParser().parseFromString(await successor.blob.text(), 'text/html');
    return { markers, sourceTemplateBytes: new TextEncoder().encode(template).length, outputBytes: result.bytes, hash: result.sha256, actualHash: await C.hashBlob(result.blob), editor: !!doc.getElementById('forge-inspect-file'), storedTemplate: !!doc.getElementById('sfhs-forge-template'), workers: doc.querySelectorAll('#sfhs-forge-import-worker').length, archive: !!doc.getElementById('sfhs-archive-catalog'), engineCopies: doc.querySelectorAll('#sfhs-forge-engine').length, engineUnchanged: engine === document.getElementById('sfhs-forge-engine').textContent, templateIncludesEngine: template.includes(engine), successorTemplateUnchanged: C.getTemplate(successorDoc) === template, successorEngineCopies: successorDoc.querySelectorAll('#sfhs-forge-engine').length, manifest: verified.manifest.capsule, report: verified.report, external: doc.querySelectorAll('script[src],link[rel="stylesheet"][href],iframe[src]').length };
  });
  expect(proof.markers).toEqual({ MANIFEST: 1, PAYLOADS: 1, TEMPLATE: 1, ENGINE: 1 });
  expect(proof.editor).toBe(false); expect(proof.storedTemplate).toBe(false); expect(proof.workers).toBe(0); expect(proof.archive).toBe(false);
  expect(proof.engineCopies).toBe(1); expect(proof.engineUnchanged).toBe(true); expect(proof.templateIncludesEngine).toBe(false); expect(proof.successorTemplateUnchanged).toBe(true); expect(proof.successorEngineCopies).toBe(1);
  expect(proof.manifest.mode).toBe('thin'); expect(proof.manifest.forge).toBe(false); expect(proof.hash).toBe(proof.actualHash); expect(proof.external).toBe(0); expect(requests).toEqual([]); expect(errors).toEqual([]);
  writeFileSync(resolve(evidence, 'integrated-player-template.json'), JSON.stringify({ ...proof, requests, errors }, null, 2));
});
