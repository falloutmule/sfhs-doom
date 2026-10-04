import {test,expect} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const root=resolve(import.meta.dirname,'../..');
const proofRoot=resolve(root,'test-results/forge-complete/archive');
const moduleSource=readFileSync(resolve(root,'web/forge/forge-archive.js'),'utf8');
const catalog=JSON.parse(readFileSync(resolve(root,'web/forge/archive-catalog.json'),'utf8'));
const entry=catalog.entries.find(item=>item.path==='levels/doom/s-u/uac_dead.zip');
test.beforeAll(()=>{
  mkdirSync(proofRoot,{recursive:true});
  const html='<!doctype html><meta charset="utf-8"><title>Forge archive adapter proof</title><script type="application/json" id="sfhs-archive-catalog">'+JSON.stringify(catalog).replaceAll('<','\\u003c')+'</script><script>'+moduleSource.replaceAll('</script','<\\/script')+'</script>';
  writeFileSync(resolve(proofRoot,'archive-adapter.html'),html);
});

test('file capsule loads full local catalog and searches with zero requests',async({page})=>{
  const requests=[],errors=[];page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(pathToFileURL(resolve(proofRoot,'archive-adapter.html')).href);
  const result=await page.evaluate(()=>({status:SFHSForgeArchive.status(),scythe:SFHSForgeArchive.search({title:'scythe',author:'erik',family:'doom2',permission:'redistributable'}).map(item=>item.path),unknown:SFHSForgeArchive.catalog.filter(item=>item.title===null).length}));
  expect(result.status.catalogCount).toBe(catalog.entries.length);expect(result.status.enabled).toBe(false);expect(result.scythe).toContain('levels/doom2/megawads/scythe.zip');expect(result.unknown).toBeGreaterThan(0);expect(requests).toEqual([]);expect(errors).toEqual([]);
  writeFileSync(resolve(proofRoot,'offline-catalog.json'),JSON.stringify({result,requests,errors},null,2));
});

test('consented browser download uses only selected declared URL',async({page})=>{
  const requests=[];page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});
  await page.route('https://youfailit.net/pub/idgames/**',route=>route.fulfill({status:200,contentType:'application/zip',headers:{'access-control-allow-origin':'*'},body:Buffer.alloc(entry.bytes)}));
  await page.goto(pathToFileURL(resolve(proofRoot,'archive-adapter.html')).href);
  const result=await page.evaluate(async path=>{const api=SFHSForgeArchive;api.enable();const download=await api.download(path);api.disable();return{bytes:download.bytes.length,source:download.source,status:api.status()};},entry.path);
  expect(result.bytes).toBe(entry.bytes);expect(requests).toEqual(['https://youfailit.net/pub/idgames/'+entry.path]);expect(result.status.enabled).toBe(false);expect(result.status.active).toBe(0);
  writeFileSync(resolve(proofRoot,'consent-download-controlled-response.json'),JSON.stringify({result,requests,controlledResponse:true},null,2));
});

test('live official mirror has explicit CORS or manual-import outcome',async({page})=>{
  test.skip(process.env.SFHS_ARCHIVE_LIVE!=='1','Live network verification is opt-in.');
  const requests=[],pageErrors=[],consoleErrors=[];page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url());});page.on('pageerror',error=>pageErrors.push(String(error)));page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
  await page.goto(pathToFileURL(resolve(proofRoot,'archive-adapter.html')).href);
  expect(requests).toEqual([]);
  const result=await page.evaluate(async path=>{const api=SFHSForgeArchive;api.enable();try{const result=await api.download(path);return{outcome:'downloaded',bytes:result.bytes.length,status:api.status()};}catch(error){return{outcome:'manual-import-required',code:error.code,message:error.message,manualUrl:error.manualUrl,status:api.status()};}finally{api.disable();}},entry.path);
  expect(requests).toEqual(['https://youfailit.net/pub/idgames/'+entry.path]);expect(pageErrors).toEqual([]);
  if(result.outcome==='downloaded')expect(result.bytes).toBe(entry.bytes);else{expect(result.code).toBe('archive-unavailable');expect(result.manualUrl).toBe(requests[0]);}
  writeFileSync(resolve(proofRoot,'live-official-mirror.json'),JSON.stringify({result,requests,pageErrors,consoleErrors},null,2));
});
