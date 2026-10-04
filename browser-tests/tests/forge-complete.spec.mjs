import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

test.setTimeout(300000);
test.use({actionTimeout:20000});
const root=resolve('..'),artifact=resolve(root,'dist','sfhs-doom-forge-v3.html');
const evidence=resolve(root,'test-results','P07','forge-complete','integration');
const orderA=readFileSync(resolve(root,'tests','fixtures','open-pwads','order-a.wad'));
const orderB=readFileSync(resolve(root,'tests','fixtures','open-pwads','order-b.wad'));
const base2=resolve(root,'vendor-cache','freedoom','0.13.0','data','freedoom2.wad');
const base1=resolve(root,'vendor-cache','freedoom','0.13.0','data','freedoom1.wad');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const base2Hash=existsSync(base2)?sha(readFileSync(base2)):null;
function crc32(bytes){let crc=0xffffffff;for(const value of bytes){crc^=value;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function zip(entries){
  const parts=[],directory=[];let offset=0;
  for(const entry of entries){const name=Buffer.from(entry.name),bytes=Buffer.from(entry.bytes),crc=crc32(bytes),local=Buffer.alloc(30+name.length);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt32LE(crc,14);local.writeUInt32LE(bytes.length,18);local.writeUInt32LE(bytes.length,22);local.writeUInt16LE(name.length,26);name.copy(local,30);parts.push(local,bytes);const central=Buffer.alloc(46+name.length);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt32LE(crc,16);central.writeUInt32LE(bytes.length,20);central.writeUInt32LE(bytes.length,24);central.writeUInt16LE(name.length,28);central.writeUInt32LE(offset,42);name.copy(central,46);directory.push(central);offset+=local.length+bytes.length;}
  const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.reduce((sum,part)=>sum+part.length,0),12);end.writeUInt32LE(offset,16);return Buffer.concat([...parts,...directory,end]);
}
const permittedPackage=(name,bytes,extras=[])=>zip([{name,bytes},...extras,{name:'README.txt',bytes:Buffer.from('SFHS synthetic integration fixture. You may distribute this package freely. Preserve this notice. All fixture data was created for this project; no commercial game content is included.\n')}]);
function watch(page){const findings={pageErrors:[],consoleErrors:[],http:[],failed:[]};page.on('pageerror',error=>findings.pageErrors.push(String(error)));page.on('console',message=>{if(message.type()==='error')findings.consoleErrors.push(message.text());});page.on('request',request=>{if(/^https?:/.test(request.url()))findings.http.push(request.url());});page.on('requestfailed',request=>findings.failed.push(request.url()+' '+request.failure()?.errorText));return findings;}
function expectClean(findings){expect(findings.pageErrors).toEqual([]);expect(findings.http).toEqual([]);expect(findings.failed).toEqual([]);expect(findings.consoleErrors.filter(value=>/fatal|abort|uncaught|unhandled|out of memory|W_AddFile: couldn't open/i.test(value))).toEqual([]);}
async function open(page,file=artifact,{width=400,height=844,renderer='auto'}={}){
  expect(existsSync(file),`Built capsule must exist: ${file}`).toBe(true);
  await page.context().setOffline(true);
  await page.addInitScript(()=>{Object.defineProperty(Element.prototype,'requestFullscreen',{configurable:true,value(){return Promise.resolve();}});Object.defineProperty(window,'showSaveFilePicker',{configurable:true,value:undefined});});
  await page.setViewportSize({width,height});await page.goto(pathToFileURL(file).href,{waitUntil:'load',timeout:90000});
  await expect.poll(()=>page.evaluate(()=>window.SFHSForgeApp?.snapshot().ready||document.getElementById('setup-status')?.textContent),{timeout:90000}).toBe(true);
  await page.locator('#renderer-mode').selectOption(renderer);
}
async function snapshot(page){return page.evaluate(()=>window.SFHSForgeApp.snapshot());}
async function importRecipe(page,name,bytes,title){
  await page.getByRole('button',{name:'Import',exact:true}).click();
  await page.locator('#forge-inspect-file').setInputFiles({name,mimeType:'application/octet-stream',buffer:bytes});
  await expect(page.locator('#import-actions')).toBeVisible({timeout:60000});
  await page.locator('#import-recipe').click();
  await page.getByRole('button',{name:'Recipe',exact:true}).click();
  await page.locator('#recipe-title').fill(title);await page.locator('#recipe-warp').fill('MAP01');
  const advanced=page.locator('[data-panel="recipe"] details');if(!await advanced.evaluate(node=>node.open))await advanced.locator('summary').click();
  await page.locator('#recipe-override').check();await page.locator('#recipe-save').click();
  await expect.poll(()=>page.evaluate(()=>window.SFHSForgeApp.selected().title)).toBe(title);
  return page.evaluate(()=>structuredClone(window.SFHSForgeApp.selected()));
}
async function launch(page){
  await page.locator('#start-doom').click();
  await expect.poll(()=>page.evaluate(()=>window.SFHSDoomMobileControls?.snapshot().game?.active||window.SFHSForgeApp?.state.error),{timeout:60000}).toBe(1);
  await expect.poll(()=>page.evaluate(()=>window.Module?.SDL2?.audioContext?.state||null),{timeout:20000}).toBe('running');
  await expect.poll(()=>page.evaluate(()=>window.SFHSDoomMobileControls.snapshot().presentation.sdl?.presents||0),{timeout:20000}).toBeGreaterThan(3);
  return page.evaluate(()=>({player:window.SFHSForgePlayer.snapshot(),args:[...Module.arguments],game:window.SFHSDoomMobileControls.snapshot(),world:[canvas.width,canvas.height],hud:[document.getElementById('doom-status-canvas').width,document.getElementById('doom-status-canvas').height]}));
}
async function back(page){if(!await page.locator('#return-forge').isVisible())await page.locator('#settings-toggle').click();await Promise.all([page.waitForEvent('load',{timeout:90000}),page.locator('#return-forge').click()]);await expect.poll(()=>page.evaluate(()=>window.SFHSForgeApp?.snapshot().ready&&window.SFHS_WASM_TEST?.forgeSnapshot().mainInvocations===0),{timeout:90000}).toBe(true);}
async function tap(page,id,pointerId){const control=page.locator(`[data-sfhs-control-id="${id}"]`);for(const type of['pointerdown','pointerup'])await control.evaluate((node,{type,pointerId})=>{const box=node.getBoundingClientRect();node.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',pointerId,buttons:type==='pointerdown'?1:0,button:0,clientX:box.x+box.width/2,clientY:box.y+box.height/2}));},{type,pointerId});}
async function saveNative(page,label){
  await page.locator('#canvas').focus();await page.keyboard.press('F2',{delay:60});await page.keyboard.press('Enter',{delay:60});await page.keyboard.type(label,{delay:50});await page.keyboard.press('Enter',{delay:60});
  await expect.poll(()=>page.evaluate(()=>{const path=Module.arguments[Module.arguments.indexOf('-savedir')+1];try{return Module.FS.readdir(path).filter(name=>/\.dsg$/.test(name)).length;}catch(_){return 0;}}),{timeout:15000}).toBeGreaterThan(0);
  await page.evaluate(()=>window.SFHSForgeApp.saveNow());await expect.poll(()=>page.evaluate(async()=>(await window.SFHSForgeApp.loadSaves(window.SFHSForgeApp.selected())).length)).toBeGreaterThan(0);return page.evaluate(()=>window.SFHSForgeApp.loadSaves(window.SFHSForgeApp.selected()));
}
async function select(page,id){await page.evaluate(async id=>{const A=window.SFHSForgeApp;A.state.selected=id;await A.persist();A.render();A.tab('games');},id);}
async function exportCapsule(page,name,{forge=false,leave=false,saves=false,privateCapsule=false,ids}={}){
  if(ids)await page.evaluate(async ids=>{const A=window.SFHSForgeApp;A.state.build=ids;await A.persist();A.render();},ids);
  await page.getByRole('button',{name:'Build',exact:true}).click();await page.locator('#build-title').fill(name);await page.locator('#build-base').selectOption(leave?'leave':'keep');await page.locator('#build-forge').setChecked(forge);await page.locator('#build-saves').setChecked(saves);await page.locator('#build-private').setChecked(privateCapsule);
  const pending=page.waitForEvent('download',{timeout:180000});await page.locator('#build-export').click();const download=await pending,path=resolve(evidence,name+'.html');await download.saveAs(path);expect(await download.failure()).toBeNull();
  const text=readFileSync(path,'utf8'),match=[...text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].find(value=>/\bid="sfhs-forge-manifest"/.test(value[1]));expect(match,'Exported file has a manifest').toBeDefined();const manifest=JSON.parse(match[2]);return{path,text,manifest,sha256:sha(Buffer.from(text))};
}
async function verify(page){await page.getByRole('button',{name:'Verify',exact:true}).click();await page.locator('#verify-capsule').click();await expect(page.locator('#verify-report')).toContainText('Verification: PASS',{timeout:90000});return page.evaluate(()=>window.SFHSForgeApp.state.verification);}

test.beforeAll(()=>mkdirSync(evidence,{recursive:true}));

for(const mode of['auto','compatibility'])test(`preserved player runs offline with authentic HUD, audio and weapon buttons (${mode})`,async({page})=>{
  const findings=watch(page);await open(page,artifact,mode==='auto'?{renderer:mode}:{width:915,height:412,renderer:mode});
  const selected=await page.evaluate(()=>window.SFHSForgeApp.selected());if(!selected.warp)await page.evaluate(async()=>{const A=window.SFHSForgeApp;A.selected().warp='MAP01';await A.persist();});
  const proof=await launch(page);expect(proof.world).toEqual([320,200]);expect(proof.hud).toEqual([320,32]);expect(await page.evaluate(()=>window.SFHS_WASM_TEST.forgeSnapshot().mainInvocations)).toBe(1);expect(proof.game.game.weapon).toBe(1);
  await tap(page,'weapon-previous',881);await expect.poll(()=>page.evaluate(()=>window.SFHSDoomMobileControls.snapshot().game.weapon)).toBe(0);await tap(page,'weapon-next',882);await expect.poll(()=>page.evaluate(()=>window.SFHSDoomMobileControls.snapshot().game.weapon)).toBe(1);
  const layout=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,viewport:[innerWidth,innerHeight],held:window.SFHSDoomMobileControls.snapshot().input.heldMask}));expect(layout.width).toBeLessThanOrEqual(layout.viewport[0]);expect(layout.height).toBeLessThanOrEqual(layout.viewport[1]);expect(layout.held).toBe(0);
  await page.screenshot({path:resolve(evidence,`player-${mode}.png`)});expectClean(findings);writeFileSync(resolve(evidence,`player-${mode}.json`),JSON.stringify({proof,layout,findings},null,2));
});

test('ZIP and supported BEX become an exact native launch, persist, and export an offline player',async({page,browser})=>{
  const findings=watch(page);await open(page);
  const patch=Buffer.from('Patch File for DeHackEd v3.0\n# *allow-extended-strings*\n\n[STRINGS]\nHUSTR_1 = FORGE VERIFIED\n');
  const recipe=await importRecipe(page,'local-test.zip',permittedPackage('order-a.wad',orderA,[{name:'labels.bex',bytes:patch}]),'ZIP AND BEX TEST');
  const proof=await launch(page),paths=proof.args.filter(arg=>arg.endsWith('.wad')||arg.endsWith('.bex'));
  expect(proof.args).toContain('-file');expect(proof.args).toContain('-deh');expect(paths.some(path=>path.includes(sha(orderA)))).toBe(true);expect(paths.some(path=>path.includes(sha(patch)))).toBe(true);
  const mounted=await page.evaluate(async paths=>{const out={};for(const path of paths){const bytes=Module.FS.readFile(path);out[path]=await window.SFHSForgeCore.hashBlob(new Blob([bytes]));}return out;},paths);expect(Object.values(mounted)).toEqual(expect.arrayContaining([sha(orderA),sha(patch),base2Hash]));
  const saves=await saveNative(page,'FORGE ZIP');expect(saves.length).toBeGreaterThan(0);await back(page);expect((await snapshot(page)).recipes.find(item=>item.id===recipe.id).title).toBe('ZIP AND BEX TEST');
  const output=await exportCapsule(page,'zip-player',{ids:[recipe.id],saves:true});expect(output.manifest.capsule.forge).toBe(false);expect(output.text).not.toContain('id="forge-inspect-file"');expect(output.manifest.saves.length).toBeGreaterThan(0);
  const context=await browser.newContext({offline:true}),reopened=await context.newPage(),offline=watch(reopened);await open(reopened,output.path);await verify(reopened);const again=await launch(reopened);expect(again.args).toEqual(proof.args);const restored=await reopened.evaluate(()=>window.SFHSForgeApp.loadSaves(window.SFHSForgeApp.selected()));expect(restored).toEqual(saves);expectClean(offline);await context.close();expectClean(findings);writeFileSync(resolve(evidence,'zip-native-export.json'),JSON.stringify({proof,mounted,saves,output:{path:output.path,sha256:output.sha256,manifest:output.manifest},findings},null,2));
});

test('thin exports physically omit base bytes and accept a local matching replacement',async({page,browser})=>{
  await open(page);const recipe=await importRecipe(page,'addon.zip',permittedPackage('order-a.wad',orderA,[{name:'order-b.wad',bytes:orderB}]),'THIN TEST');await page.locator('#recipe-files article').filter({has:page.getByRole('heading',{name:'order-b.wad',exact:true})}).locator('input[type="checkbox"]').uncheck();const output=await exportCapsule(page,'thin-player',{ids:[recipe.id],leave:true});
  expect(output.manifest.payloads.some(item=>item.role==='iwad')).toBe(false);expect(output.manifest.recipes[0].base).toBeNull();expect(output.text).not.toContain(`data-forge-payload="${base2Hash}"`);expect(output.manifest.payloads.some(item=>item.id===sha(orderB))).toBe(false);
  const context=await browser.newContext({offline:true}),thin=await context.newPage(),findings=watch(thin);await open(thin,output.path);await expect(thin.locator('#thin-base-panel')).toBeVisible();await thin.locator('#forge-base-file').setInputFiles({name:'bad.wad',mimeType:'application/octet-stream',buffer:orderA});await expect(thin.locator('#forge-message')).toContainText('IWAD');expect(await thin.evaluate(()=>window.SFHS_WASM_TEST.forgeSnapshot().mainInvocations)).toBe(0);
  await thin.locator('#forge-base-file').setInputFiles(base2);await expect(thin.locator('#thin-base-panel')).toBeHidden();await launch(thin);expectClean(findings);await context.close();
});

test('replacing a base changes the exported bytes and omits the previous base',async({page,browser})=>{
  await open(page);await page.getByRole('button',{name:'Recipe',exact:true}).click();await page.locator('#recipe-family').selectOption('doom');await page.locator('#recipe-warp').fill('E1M1');await page.locator('#recipe-save').click();
  await page.locator('#forge-base-file').setInputFiles(base1);const replacementHash=sha(readFileSync(base1));await expect.poll(()=>page.evaluate(()=>window.SFHSForgeApp.selected().base)).toBe(replacementHash);
  const recipe=await page.evaluate(()=>structuredClone(window.SFHSForgeApp.selected())),output=await exportCapsule(page,'replacement-phase1',{ids:[recipe.id],privateCapsule:true});expect(output.manifest.payloads.filter(item=>item.role==='iwad').map(item=>item.id)).toEqual([replacementHash]);expect(output.text).not.toContain(`data-forge-payload="${base2Hash}"`);
  const context=await browser.newContext({offline:true}),replacement=await context.newPage();await open(replacement,output.path);await verify(replacement);const proof=await launch(replacement);expect(proof.args.some(value=>value.includes(replacementHash))).toBe(true);await context.close();
});

test('two recipes retain independent native saves and deduplicate their base in a collection',async({page,browser})=>{
  await open(page);const first=await importRecipe(page,'first.zip',permittedPackage('order-a.wad',orderA),'FIRST GAME');await launch(page);const firstSaves=await saveNative(page,'FIRST');await back(page);
  const second=await importRecipe(page,'second.zip',permittedPackage('order-b.wad',orderB),'SECOND GAME');expect(second.id).not.toBe(first.id);await launch(page);expect(await page.evaluate(()=>window.SFHSForgeApp.loadSaves(window.SFHSForgeApp.selected()))).toEqual([]);const secondSaves=await saveNative(page,'SECOND');expect(secondSaves[0].namespace).not.toBe(firstSaves[0].namespace);await back(page);await select(page,first.id);expect(await page.evaluate(()=>window.SFHSForgeApp.loadSaves(window.SFHSForgeApp.selected()))).toEqual(firstSaves);
  const output=await exportCapsule(page,'two-game-collection',{forge:true,saves:true,ids:[first.id,second.id]});expect(output.manifest.recipes).toHaveLength(2);expect(output.manifest.payloads.filter(item=>item.role==='iwad')).toHaveLength(1);expect(new Set(output.manifest.recipes.map(item=>item.saveNamespace)).size).toBe(2);
  const context=await browser.newContext({offline:true}),collection=await context.newPage();await open(collection,output.path);await verify(collection);for(const [id,saves]of[[first.id,firstSaves],[second.id,secondSaves]]){await select(collection,id);await launch(collection);expect(await collection.evaluate(()=>window.SFHSForgeApp.loadSaves(window.SFHSForgeApp.selected()))).toEqual(saves);await back(collection);}await context.close();writeFileSync(resolve(evidence,'collection-saves.json'),JSON.stringify({firstSaves,secondSaves,manifest:output.manifest},null,2));
});

test('Forge A exports B; reopened B ingests new content and exports a working Forge C',async({page,browser})=>{
  await open(page);const first=await importRecipe(page,'a.zip',permittedPackage('order-a.wad',orderA),'GENERATION A');const b=await exportCapsule(page,'generation-b',{forge:true,ids:[first.id]});
  const contextB=await browser.newContext({offline:true}),pageB=await contextB.newPage(),findingsB=watch(pageB);await open(pageB,b.path);expect(await pageB.evaluate(()=>typeof window.SFHSForgeTools.importFile)).toBe('function');const second=await importRecipe(pageB,'b.zip',permittedPackage('order-b.wad',orderB),'GENERATION B NEW CONTENT');const c=await exportCapsule(pageB,'generation-c',{forge:true,ids:[first.id,second.id]});expect(c.manifest.payloads.map(item=>item.id)).toEqual(expect.arrayContaining([sha(orderA),sha(orderB)]));expect(c.manifest.payloads.filter(item=>item.role==='iwad')).toHaveLength(1);expectClean(findingsB);
  const contextC=await browser.newContext({offline:true}),pageC=await contextC.newPage(),findingsC=watch(pageC);await open(pageC,c.path);await verify(pageC);await select(pageC,second.id);const proof=await launch(pageC);expect(proof.args.some(value=>value.includes(sha(orderB)))).toBe(true);await back(pageC);expect(await pageC.evaluate(()=>typeof window.SFHSForgeTools.exportBuild)).toBe('function');expectClean(findingsC);await contextB.close();await contextC.close();writeFileSync(resolve(evidence,'recursive-forge.json'),JSON.stringify({b:{sha256:b.sha256,manifest:b.manifest},c:{sha256:c.sha256,manifest:c.manifest},proof,findingsB,findingsC},null,2));
});

test('unverified local content exports only with explicit PRIVATE marking',async({page,browser})=>{
  await open(page);const recipe=await importRecipe(page,'private.wad',orderA,'PRIVATE LOCAL TEST');await page.evaluate(async id=>{const A=window.SFHSForgeApp;A.state.build=[id];await A.persist();A.render();},recipe.id);await page.getByRole('button',{name:'Build',exact:true}).click();await page.locator('#build-private').uncheck();await page.locator('#build-export').click();await expect(page.locator('#forge-message')).toContainText(/private|permission|redistribut/i);
  const output=await exportCapsule(page,'private-player',{privateCapsule:true,ids:[recipe.id]});expect(output.manifest.capsule.private).toBe(true);const context=await browser.newContext({offline:true}),privatePage=await context.newPage();await open(privatePage,output.path);await expect(privatePage.locator('#forge-summary')).toContainText('PRIVATE');await verify(privatePage);await context.close();
});

test('failed native startup exposes recovery and restores the draft without a second callMain',async({page})=>{
  const findings=watch(page);await open(page);const recipe=await importRecipe(page,'recovery.zip',permittedPackage('order-a.wad',orderA),'RECOVER THIS DRAFT');
  await page.evaluate(()=>{window.__failedMainCalls=0;Module.callMain=()=>{window.__failedMainCalls++;throw new Error('Synthetic native startup failure');};});
  await page.locator('#start-doom').click();await expect(page.locator('#forge-recover-engine')).toBeVisible();await expect(page.locator('#forge-message')).toContainText('Synthetic native startup failure');
  await expect.poll(()=>page.evaluate(()=>window.SFHSForgeApp.selected().launchTest?.status)).toBe('failed');
  const failed=await page.evaluate(()=>({calls:window.__failedMainCalls,mainInvocations:window.SFHS_WASM_TEST.forgeSnapshot().mainInvocations,recipe:structuredClone(window.SFHSForgeApp.selected())}));expect(failed.calls).toBe(1);expect(failed.mainInvocations).toBe(1);expect(failed.recipe.id).toBe(recipe.id);
  await Promise.all([page.waitForEvent('load',{timeout:90000}),page.locator('#forge-recover-engine').click()]);await expect.poll(()=>page.evaluate(()=>window.SFHSForgeApp?.state.ready),{timeout:90000}).toBe(true);
  await expect(page.locator('#forge-recover-engine')).toBeHidden();const restored=await page.evaluate(async()=>{const A=window.SFHSForgeApp,r=A.selected(),blob=await A.payloadBlob(r.files[0].payloadId);return{recipe:structuredClone(r),mountedHash:await A.C.hashBlob(blob),mainInvocations:window.SFHS_WASM_TEST.forgeSnapshot().mainInvocations};});
  expect(restored.recipe.id).toBe(recipe.id);expect(restored.recipe.title).toBe('RECOVER THIS DRAFT');expect(restored.mountedHash).toBe(sha(orderA));expect(restored.mainInvocations).toBe(0);expect(restored.recipe.launchTest).toMatchObject({status:'failed',saveNamespace:restored.recipe.saveNamespace,message:'Synthetic native startup failure'});expect(restored.recipe.lastPlayed).toBeUndefined();expectClean(findings);await page.screenshot({path:resolve(evidence,'native-failure-recovered.png')});writeFileSync(resolve(evidence,'native-failure-recovery.json'),JSON.stringify({failed,restored,findings},null,2));
});

test('native boot evidence is recorded per recipe inputs and associated with versioned content',async({page})=>{
  await open(page);const recipe=await importRecipe(page,'launch-proof.zip',permittedPackage('order-a.wad',orderA),'BOOT EVIDENCE');
  await page.evaluate(()=>{const original=Module.callMain;Module.callMain=function(...args){window.__atNativeStart=structuredClone(window.SFHSForgeApp.selected().launchTest);return original.apply(this,args);};});await launch(page);await expect.poll(()=>page.evaluate(()=>window.SFHSForgeApp.selected().launchTest?.status)).toBe('booted');
  await expect(page.locator('#start-doom')).toBeEnabled();
  const proof=await page.evaluate(async()=>{const A=window.SFHSForgeApp,r=A.selected();return{attempt:window.__atNativeStart,recipe:structuredClone(r),content:await A.get('payload:'+r.files[0].payloadId)};});expect(proof.attempt.status).toBe('attempted');expect(proof.recipe.launchTest).toMatchObject({status:'booted',mainInvocations:1,saveNamespace:proof.recipe.saveNamespace});expect(proof.recipe.launchTest.presents).toBeGreaterThan(0);expect(proof.content.schema).toBe('sfhs.doom-content@1');expect(proof.content.launchTests[proof.recipe.saveNamespace]).toEqual(proof.recipe.launchTest);expect(proof.recipe.compatibility.status).toBe(recipe.compatibility.status);
  const repeat=await page.evaluate(async()=>{const A=window.SFHSForgeApp;let error;try{await A.launch();}catch(failure){error=failure.message;}const r=A.selected();return{error,launchTest:structuredClone(r.launchTest),content:await A.get('payload:'+r.files[0].payloadId),mainInvocations:window.SFHS_WASM_TEST.forgeSnapshot().mainInvocations,recoveryVisible:!document.getElementById('forge-recover-engine').hidden};});expect(repeat.error).toContain('Return to Forge');expect(repeat.launchTest).toEqual(proof.recipe.launchTest);expect(repeat.content.launchTests[proof.recipe.saveNamespace]).toEqual(proof.recipe.launchTest);expect(repeat.mainInvocations).toBe(1);expect(repeat.recoveryVisible).toBe(false);
  await back(page);await page.getByRole('button',{name:'Recipe',exact:true}).click();await page.locator('#recipe-skill').selectOption('2');await page.locator('#recipe-save').click();const edited=await page.evaluate(()=>structuredClone(window.SFHSForgeApp.selected()));expect(edited.saveNamespace).not.toBe(proof.recipe.saveNamespace);expect(edited.launchTest.saveNamespace).toBe(proof.recipe.saveNamespace);writeFileSync(resolve(evidence,'native-launch-evidence.json'),JSON.stringify({attempt:proof.attempt,recipe:proof.recipe,contentSchema:proof.content.schema,contentTests:proof.content.launchTests,repeat,edited},null,2));
});

test('verifier rejects external CSS, responsive images and embedded media',async({page})=>{
  await open(page);await page.evaluate(()=>{
    const holder=document.createElement('div');holder.id='external-dependency-fixture';
    const style=document.createElement('style');style.textContent='@import "https://verify.invalid/import.css"; .verify-unused { background: url("https://verify.invalid/background.png"); }';holder.append(style);
    const inline=document.createElement('div');inline.style.backgroundImage='url("https://verify.invalid/inline.png")';holder.append(inline);
    for(const [tag,attribute,value]of[['img','srcset','data:image/png;base64,AA== 1x, https://verify.invalid/responsive.png 2x'],['source','src','https://verify.invalid/media.ogg'],['object','data','https://verify.invalid/object.pdf'],['embed','src','https://verify.invalid/plugin.bin']]){const node=document.createElement(tag);node.setAttribute(attribute,value);holder.append(node);}document.body.append(holder);
  });
  const rejected=await page.evaluate(()=>window.SFHSForgeApp.verify());expect(rejected.pass).toBe(false);const report=rejected.report.join('\n');for(const name of['import.css','background.png','inline.png','responsive.png','media.ogg','object.pdf','plugin.bin'])expect(report).toContain('https://verify.invalid/'+name);
  await page.evaluate(()=>document.getElementById('external-dependency-fixture').remove());const clean=await page.evaluate(()=>window.SFHSForgeApp.verify());expect(clean.pass).toBe(true);expect(clean.report.join('\n')).toContain('Payloads: 2');expect(clean.report.join('\n')).toContain('Catalog: ');writeFileSync(resolve(evidence,'external-dependency-verification.json'),JSON.stringify({rejected,clean},null,2));
});
