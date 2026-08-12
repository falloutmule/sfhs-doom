import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

test.describe.configure({ mode:'serial' });
test.setTimeout(120000);

const candidate = new URL('../../dist/sfhs-doom-android-sfhs-controls-v16.html', import.meta.url);
const evidenceRoot = resolve('..','test-results','P06','P6-064');

function watchPage(page) {
  const pageErrors=[], consoleErrors=[], externalRequests=[], failedRequests=[];
  page.on('pageerror', error=>pageErrors.push(String(error)));
  page.on('console', message=>{ if(message.type()==='error') consoleErrors.push(message.text()); });
  page.on('request', request=>{ if(/^https?:/i.test(request.url())) externalRequests.push(request.url()); });
  page.on('requestfailed', request=>failedRequests.push(`${request.url()} ${request.failure()?.errorText||''}`));
  return { pageErrors,consoleErrors,externalRequests,failedRequests };
}

async function openAndStart(page, viewport, renderer) {
  test.skip(!existsSync(candidate),'V16 artifact has not been built.');
  await page.addInitScript(()=>Object.defineProperty(Element.prototype,'requestFullscreen',{configurable:true,value(){return Promise.resolve();}}));
  await page.setViewportSize(viewport);
  await page.goto(candidate.href,{waitUntil:'load',timeout:60000});
  await expect(page.locator('#sfhs-fullscreen-root')).toHaveAttribute('data-sfhs-fullscreen-app-root','v16');
  await expect(page.locator('body')).toHaveAttribute('data-sfhs-p6-runtime','ready',{timeout:60000});
  await expect.poll(()=>page.evaluate(()=>window.SFHSDoomMobileControls?.snapshot().weaponCycleConfig)).toBe('ready');
  await page.locator('#renderer-mode').selectOption(renderer);
  await page.getByRole('button',{name:'Start Fullscreen'}).click();
  await expect.poll(()=>page.evaluate(()=>window.SFHSDoomMobileControls?.snapshot().game?.active),{timeout:20000}).toBe(1);
  await expect.poll(()=>page.evaluate(()=>window.Module?.SDL2?.audioContext?.state||null),{timeout:15000}).toBe('running');
  await expect.poll(()=>page.evaluate(()=>window.SFHSDoomMobileControls.snapshot().game.weapon),{timeout:10000}).toBe(1);
  expect(await page.evaluate(()=>({world:[canvas.width,canvas.height],hud:[document.getElementById('doom-status-canvas').width,document.getElementById('doom-status-canvas').height],mainInvocations:window.SFHS_P6_STATE.mainInvocations}))).toEqual({world:[320,200],hud:[320,32],mainInvocations:1});
}

async function tapControl(page,id,pointerId) {
  const locator=page.locator(`[data-sfhs-control-id="${id}"]`),box=await locator.boundingBox();
  expect(box).not.toBeNull();
  const point={x:box.x+box.width/2,y:box.y+box.height/2};
  for(const type of ['pointerdown','pointerup']) await locator.evaluate((element,value)=>element.dispatchEvent(new PointerEvent(value.type,{bubbles:true,cancelable:true,pointerType:'touch',pointerId:value.pointerId,button:0,buttons:value.type==='pointerup'?0:1,clientX:value.x,clientY:value.y})),{type,pointerId,...point});
}

for(const item of [
  {name:'portrait-auto',viewport:{width:400,height:844},renderer:'auto'},
  {name:'landscape-compatibility',viewport:{width:915,height:412},renderer:'compatibility'},
]) test(`V16 WPN buttons change the real weapon (${item.name})`,async({page})=>{
  const hygiene=watchPage(page); await openAndStart(page,item.viewport,item.renderer);
  const before=await page.evaluate(()=>window.SFHSDoomMobileControls.snapshot());
  expect(await page.evaluate(()=>({previous:Module._sfhs_mobile_input_pulse(9),next:Module._sfhs_mobile_input_pulse(10)}))).toEqual({previous:1,next:1});
  const afterDirect=await page.evaluate(()=>window.SFHSDoomMobileControls.snapshot());
  expect(afterDirect.input.posted.keydown-before.input.posted.keydown).toBe(2);
  expect(afterDirect.input.posted.keyup-before.input.posted.keyup).toBe(2);
  await tapControl(page,'weapon-previous',6401);
  await expect.poll(()=>page.evaluate(()=>window.SFHSDoomMobileControls.snapshot().game.weapon),{timeout:10000}).toBe(0);
  const afterPrevious=await page.evaluate(()=>window.SFHSDoomMobileControls.snapshot());
  expect(afterPrevious.adapter.totalPulseCounts['weapon-previous']).toBeGreaterThan(before.adapter.totalPulseCounts['weapon-previous']);
  await tapControl(page,'weapon-next',6402);
  await expect.poll(()=>page.evaluate(()=>window.SFHSDoomMobileControls.snapshot().game.weapon),{timeout:10000}).toBe(1);
  const afterNext=await page.evaluate(()=>window.SFHSDoomMobileControls.snapshot());
  expect(afterNext.adapter.totalPulseCounts['weapon-next']).toBeGreaterThan(before.adapter.totalPulseCounts['weapon-next']);
  expect(afterNext.input.posted.keydown-afterPrevious.input.posted.keydown).toBe(1);
  expect(afterNext.input.posted.keyup-afterPrevious.input.posted.keyup).toBe(1);
  expect(afterNext.input.heldMask).toBe(0);
  expect(afterNext.controller.activePointers).toEqual([]);
  expect(afterNext.game.ammo).toBe(before.game.ammo);
  expect(hygiene.pageErrors).toEqual([]); expect(hygiene.externalRequests).toEqual([]); expect(hygiene.failedRequests).toEqual([]);
  expect(hygiene.consoleErrors.filter(value=>/fatal|abort|uncaught|unhandled|out of memory/i.test(value))).toEqual([]);
  writeFileSync(resolve(evidenceRoot,`${item.name}-weapon-cycle-proof.json`),JSON.stringify({before,afterDirect,afterPrevious,afterNext,hygiene},null,2));
});

test.beforeAll(()=>mkdirSync(evidenceRoot,{recursive:true}));
