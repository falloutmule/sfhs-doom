import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

test.describe.configure({mode:'serial'});
test.setTimeout(180000);

const full=new URL('../../dist/sfhs-doom-forge-v1.html',import.meta.url);
const thin=new URL('../../test-results/P07/P7-A/sfhs-doom-forge-v1-thin.html',import.meta.url);
const wad=resolve('..','vendor-cache','freedoom','0.13.0','data','freedoom2.wad');
const evidenceRoot=resolve('..','test-results','P07','P7-A');
const negativePath=resolve(evidenceRoot,'sfhs-doom-forge-v1-negative.html');
const negativeUrl=new URL(`file:///${negativePath.replaceAll('\\','/')}`);

function watchPage(page){
  const pageErrors=[],consoleErrors=[],externalRequests=[],failedRequests=[];
  page.on('pageerror',error=>pageErrors.push(String(error)));
  page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
  page.on('request',request=>{if(/^https?:/i.test(request.url()))externalRequests.push(request.url());});
  page.on('requestfailed',request=>failedRequests.push(`${request.url()} ${request.failure()?.errorText||''}`));
  return{pageErrors,consoleErrors,externalRequests,failedRequests};
}

async function openCapsule(page,url,viewport,renderer){
  await page.addInitScript(()=>Object.defineProperty(Element.prototype,'requestFullscreen',{configurable:true,value(){return Promise.resolve();}}));
  await page.setViewportSize(viewport);
  await page.goto(url.href,{waitUntil:'load',timeout:90000});
  await expect(page.locator('#sfhs-fullscreen-root')).toHaveAttribute('data-sfhs-fullscreen-app-root','forge-v1');
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p7-runtime','ready',{timeout:90000});
  await page.locator('#renderer-mode').selectOption(renderer);
}

async function expectReadyAndStart(page){
  await expect.poll(()=>page.evaluate(()=>window.SFHS_WASM_TEST?.forgeSnapshot()),{timeout:90000}).toMatchObject({schema:'sfhs.doom-capsule@1',manifestStatus:'valid',mountStage:'ready',decodedBytes:28787748,decodedSha256:'a8772e088847032510d97ba2312406a6998f21cbab44d4ff10696faa9c0ecd4b',mainInvocations:0});
  await page.getByRole('button',{name:'Play'}).click();
  await expect.poll(()=>page.evaluate(()=>window.SFHSDoomMobileControls?.snapshot().game?.active),{timeout:30000}).toBe(1);
  await expect.poll(()=>page.evaluate(()=>window.Module?.SDL2?.audioContext?.state||null),{timeout:20000}).toBe('running');
  const proof=await page.evaluate(()=>({forge:window.SFHS_WASM_TEST.forgeSnapshot(),snapshot:window.SFHSDoomMobileControls.snapshot(),world:[canvas.width,canvas.height],hud:[document.getElementById('doom-status-canvas').width,document.getElementById('doom-status-canvas').height],scroll:{x:scrollX,y:scrollY,width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,viewport:[innerWidth,innerHeight]}}));
  expect(proof.forge.mainInvocations).toBe(1);
  expect(proof.world).toEqual([320,200]);
  expect(proof.hud).toEqual([320,32]);
  expect(proof.scroll.x).toBe(0);expect(proof.scroll.y).toBe(0);
  expect(proof.scroll.width).toBeLessThanOrEqual(proof.scroll.viewport[0]);
  expect(proof.scroll.height).toBeLessThanOrEqual(proof.scroll.viewport[1]);
  return proof;
}

async function tapControl(page,id,pointerId){
  const locator=page.locator(`[data-sfhs-control-id="${id}"]`),box=await locator.boundingBox();
  expect(box).not.toBeNull();const point={x:box.x+box.width/2,y:box.y+box.height/2};
  for(const type of['pointerdown','pointerup'])await locator.evaluate((element,value)=>element.dispatchEvent(new PointerEvent(value.type,{bubbles:true,cancelable:true,pointerType:'touch',pointerId:value.pointerId,button:0,buttons:value.type==='pointerup'?0:1,clientX:value.x,clientY:value.y})),{type,pointerId,...point});
}

for(const route of[
  {name:'full-portrait-auto',url:full,viewport:{width:400,height:844},renderer:'auto'},
  {name:'full-landscape-compatibility',url:full,viewport:{width:915,height:412},renderer:'compatibility'},
])test(`${route.name} verifies, mounts, and preserves V16 player parity`,async({page})=>{
  test.skip(!existsSync(full),'Forge artifact not built');const hygiene=watchPage(page);
  await openCapsule(page,route.url,route.viewport,route.renderer);
  await expect.poll(()=>page.evaluate(()=>window.SFHS_WASM_TEST?.forgeSnapshot().mountStage),{timeout:90000}).toBe('ready');
  await expect(page.locator('#forge-base-picker')).toBeHidden();
  await page.screenshot({path:resolve(evidenceRoot,`${route.name}-ready.png`)});
  const proof=await expectReadyAndStart(page);
  expect(proof.forge.storageKind).toBe('embedded-chunks');expect(proof.forge.chunksRead).toBe(56);
  expect(proof.snapshot.weaponCycleConfig).toBe('ready');expect(proof.snapshot.game.weapon).toBe(1);
  await tapControl(page,'weapon-previous',7101);await expect.poll(()=>page.evaluate(()=>window.SFHSDoomMobileControls.snapshot().game.weapon)).toBe(0);
  await tapControl(page,'weapon-next',7102);await expect.poll(()=>page.evaluate(()=>window.SFHSDoomMobileControls.snapshot().game.weapon)).toBe(1);
  const ending=await page.evaluate(()=>window.SFHSDoomMobileControls.snapshot());
  expect(ending.input.heldMask).toBe(0);expect(ending.controller.activePointers).toEqual([]);
  await page.screenshot({path:resolve(evidenceRoot,`${route.name}-playing.png`)});
  expect(hygiene.pageErrors).toEqual([]);expect(hygiene.externalRequests).toEqual([]);expect(hygiene.failedRequests).toEqual([]);
  expect(hygiene.consoleErrors.filter(value=>/fatal|abort|uncaught|unhandled|out of memory/i.test(value))).toEqual([]);
  writeFileSync(resolve(evidenceRoot,`${route.name}.json`),JSON.stringify({proof,ending,hygiene},null,2));
});

test('thin capsule accepts only the exact local Freedoom base',async({page})=>{
  test.skip(!existsSync(thin)||!existsSync(wad),'thin artifact or WAD unavailable');const hygiene=watchPage(page);
  await openCapsule(page,thin,{width:400,height:844},'auto');
  await expect.poll(()=>page.evaluate(()=>window.SFHS_WASM_TEST.forgeSnapshot().mountStage)).toBe('awaiting-file');
  await expect(page.locator('#forge-base-picker')).toBeVisible();
  await page.locator('#forge-base-file').setInputFiles(wad);const proof=await expectReadyAndStart(page);
  expect(proof.forge.storageKind).toBe('external-file');expect(proof.forge.chunksExpected).toBe(0);
  expect(hygiene.pageErrors).toEqual([]);expect(hygiene.externalRequests).toEqual([]);expect(hygiene.failedRequests).toEqual([]);
  writeFileSync(resolve(evidenceRoot,'thin-exact-base.json'),JSON.stringify({proof,hygiene},null,2));
});

test('thin capsule rejects a wrong base without invoking main',async({page})=>{
  test.skip(!existsSync(thin),'thin artifact not built');
  await openCapsule(page,thin,{width:400,height:844},'auto');
  await page.locator('#forge-base-file').setInputFiles({name:'wrong.wad',mimeType:'application/octet-stream',buffer:Buffer.from('not a Doom WAD')});
  await expect.poll(()=>page.evaluate(()=>window.SFHS_WASM_TEST.forgeSnapshot())).toMatchObject({mountStage:'failed',mainInvocations:0});
  await expect(page.getByRole('button',{name:'Play'})).toBeHidden();
});

const mutations=[
  {name:'bad-schema',change:text=>text.replace('"schema": "sfhs.doom-capsule@1"','"schema": "sfhs.doom-capsule@0"')},
  {name:'bad-decoded-hash',change:text=>text.replace('a8772e088847032510d97ba2312406a6998f21cbab44d4ff10696faa9c0ecd4b','08772e088847032510d97ba2312406a6998f21cbab44d4ff10696faa9c0ecd4b')},
  {name:'reordered-chunk',change:text=>text.replace('data-sfhs-chunk-index="0"','data-sfhs-chunk-index="1"')},
  {name:'duplicate-chunk',change:text=>{const match=text.match(/<script type="application\/octet-stream" data-sfhs-payload-id="freedoom2-0\.13\.0" data-sfhs-chunk-index="0">[\s\S]*?<\/script>/);if(!match)throw new Error('chunk fixture missing');return text.replace(match[0],match[0]+'\n    '+match[0]);}},
  {name:'missing-chunk',change:text=>text.replace(/\s*<script type="application\/octet-stream" data-sfhs-payload-id="freedoom2-0\.13\.0" data-sfhs-chunk-index="55">[\s\S]*?<\/script>/,'')},
  {name:'corrupt-chunk',change:text=>text.replace('data-sfhs-chunk-index="0">H4sI','data-sfhs-chunk-index="0">I4sI')},
];

for(const mutation of mutations)test(`full capsule rejects ${mutation.name} without invoking main`,async({page})=>{
  test.skip(!existsSync(full),'Forge artifact not built');
  const changed=mutation.change(readFileSync(full,'utf8'));writeFileSync(negativePath,changed);
  await page.setViewportSize({width:400,height:844});await page.goto(negativeUrl.href,{waitUntil:'load',timeout:90000});
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p7-runtime','ready',{timeout:90000});
  await expect.poll(()=>page.evaluate(()=>window.SFHS_WASM_TEST.forgeSnapshot()),{timeout:90000}).toMatchObject({mountStage:'failed',mainInvocations:0});
  expect(await page.evaluate(()=>{try{Module.FS.stat('/freedoom2.wad');return true;}catch(_){return false;}})).toBe(false);
  await expect(page.getByRole('button',{name:'Play'})).toBeHidden();
});

test('full capsule rejects an unsupported gzip platform without invoking main',async({page})=>{
  test.skip(!existsSync(full),'Forge artifact not built');
  await page.addInitScript(()=>Object.defineProperty(window,'DecompressionStream',{configurable:true,value:undefined}));
  await page.setViewportSize({width:400,height:844});await page.goto(full.href,{waitUntil:'load',timeout:90000});
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p7-runtime','ready',{timeout:90000});
  await expect.poll(()=>page.evaluate(()=>window.SFHS_WASM_TEST.forgeSnapshot())).toMatchObject({mountStage:'failed',error:'Error: gzip-unsupported',mainInvocations:0});
  await expect(page.getByRole('button',{name:'Play'})).toBeHidden();
});

test.beforeAll(()=>mkdirSync(evidenceRoot,{recursive:true}));
