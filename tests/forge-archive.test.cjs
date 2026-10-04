const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const {gzipSync}=require('node:zlib');
const {createHash}=require('node:crypto');
const source=fs.readFileSync(path.join(__dirname,'../web/forge/forge-archive.js'),'utf8');
const entries=[
  {path:'levels/doom2/a-c/one.zip',title:'One Moon',author:'Alice',bytes:4,date:'2001-01-01',family:'doom2',mapCount:1,type:'single-map',permission:'redistributable',compatibility:'likely-compatible'},
  {path:'levels/doom/megawads/two.zip',title:'Two Suns',author:'Bob',bytes:8,date:'2012-12-12',family:'doom',mapCount:27,type:'megawad',permission:'unclear',compatibility:'unknown'},
  {path:'levels/doom2/a-c/unknown.zip',title:null,author:null,bytes:4,date:'2020-02-02',family:'doom2',mapCount:null,permission:'unclear',compatibility:'unknown'},
];
function load(fetcher,overrides={}){let calls=[];const context={window:{},document:{getElementById:()=>({textContent:JSON.stringify({schema:'sfhs.doom-archive-catalog@1',generatedAt:'2026-10-04',entries})})},fetch:async(...args)=>{calls.push(args);return fetcher(...args);},URL,AbortController,TextDecoder,Blob,Uint8Array,...overrides};vm.runInNewContext(source,context);return{api:context.window.SFHSForgeArchive,calls};}
test('boot/search do not request network, metadata unknowns remain unknown',()=>{const{api,calls}=load(()=>{throw Error('unexpected')});assert.equal(api.status().enabled,false);assert.equal(api.search({author:'ali',family:'doom2',mapCount:1,permission:'redistributable'}).length,1);assert.equal(api.search({query:'unknown'})[0].title,null);assert.equal(api.search({favorite:true,favoriteIds:[entries[1].path]})[0].author,'Bob');assert.equal(api.search({downloaded:true,downloadedIds:[entries[0].path]}).length,1);assert.equal(api.search({year:2012}).length,1);assert.equal(api.search({sort:'newest',limit:1})[0].filename,'unknown.zip');assert.equal(calls.length,0);});
test('download/inspect refuse requests without session consent',async()=>{const{api,calls}=load(()=>new Response('test'));await assert.rejects(api.download(entries[0]),error=>error.code==='network-disabled'&&error.manualUrl.endsWith('/one.zip'));await assert.rejects(api.inspect(entries[0]),error=>error.code==='network-disabled');assert.equal(calls.length,0);});
test('consented selected package is credential-free and redirect-blocked',async()=>{const{api,calls}=load(()=>new Response(new Uint8Array([80,75,3,4]),{headers:{'content-length':'4'}}));api.enable();const result=await api.download(entries[0]);assert.equal(result.bytes.length,4);assert.equal(result.blob.size,4);assert.equal(calls.length,1);assert.equal(calls[0][0],'https://youfailit.net/pub/idgames/levels/doom2/a-c/one.zip');assert.equal(calls[0][1].credentials,'omit');assert.equal(calls[0][1].redirect,'error');assert.equal(calls[0][1].mode,'cors');assert.equal(calls[0][1].referrerPolicy,'no-referrer');assert.equal(api.status().requests[0].status,'complete');});
test('catalog identity prevents arbitrary path/URL requests',async()=>{const{api,calls}=load(()=>new Response('test'));api.enable();await assert.rejects(api.download({path:'https://evil.invalid/steal'}),error=>error.code==='archive-entry');await assert.rejects(api.download({path:'levels/doom2/../../evil.zip'}),error=>error.code==='archive-entry');assert.throws(()=>api.configure({mirrorId:'https://evil.invalid'}),error=>error.code==='archive-mirror');assert.equal(calls.length,0);});
test('CORS failure exposes real manual download without a proxy',async()=>{const{api,calls}=load(()=>{throw new TypeError('Failed to fetch')});api.enable();await assert.rejects(api.download(entries[0]),error=>error.code==='archive-unavailable'&&error.manualUrl.startsWith('https://youfailit.net/pub/idgames/'));assert.equal(calls.length,1);assert.equal(api.status().active,0);assert.equal(api.status().lastError.code,'archive-unavailable');});
test('disable cancels an in-flight request and future requests',async()=>{const{api,calls}=load((url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')))));api.enable();const pending=api.download(entries[0]);assert.equal(api.status().active,1);api.disable();await assert.rejects(pending,error=>error.code==='archive-cancelled');await assert.rejects(api.inspect(entries[0]),error=>error.code==='network-disabled');assert.equal(calls.length,1);assert.equal(api.status().active,0);});
test('size cap enforced before fetch and during response stream',async()=>{let{api,calls}=load(()=>new Response('12345678'));api.configure({maxDownloadBytes:3});api.enable();await assert.rejects(api.download(entries[0]),error=>error.code==='archive-size');assert.equal(calls.length,0);api.configure({maxDownloadBytes:6});await assert.rejects(api.download(entries[0]),error=>error.code==='archive-size');assert.equal(calls.length,1);});
test('stale index length does not claim a verified package',async()=>{const{api}=load(()=>new Response('short'));api.enable();await assert.rejects(api.download(entries[0]),error=>error.code==='archive-length');});
test('metadata reads only same-stem TXT and mirror switching is explicit',async()=>{const{api,calls}=load(()=>new Response('Title : One Moon'));api.enable();api.configure({mirrorId:'infania'});const value=await api.inspect(entries[0]);assert.equal(value.readme,'Title : One Moon');assert.equal(calls[0][0],'https://ftpmirror.infania.net/pub/idgames/levels/doom2/a-c/one.txt');});
test('malformed bundled catalog leaves offline browser available with exact error',()=>{const{api,calls}=load(()=>new Response('x'),{document:{getElementById:()=>({textContent:'{bad'})}});assert.equal(api.catalog.length,0);assert.ok(api.status().catalogError);assert.equal(calls.length,0);});
test('compressed catalog verifies decoded identity offline and rejects corrupt declarations',async()=>{
  const raw=Buffer.from(JSON.stringify({schema:'sfhs.doom-archive-catalog@1',entries}));
  const hash=createHash('sha256').update(raw).digest('hex');
  for(const [size,digest,valid] of [[raw.length,hash,true],[raw.length,'0'.repeat(64),false],[raw.length-1,hash,false]]){
    const node={textContent:gzipSync(raw).toString('base64'),dataset:{compression:'gzip',decodedBytes:String(size),sha256:digest}};
    const {api,calls}=load(()=>{throw Error('Unexpected network')},{document:{getElementById:()=>node},DecompressionStream,window:{SFHSForgeCore:{base64ToBytes:value=>new Uint8Array(Buffer.from(value,'base64')),hashBlob:async blob=>createHash('sha256').update(Buffer.from(await blob.arrayBuffer())).digest('hex')}}});
    await api.ready;
    assert.equal(api.catalog.length,valid?3:0);
    assert.equal(!!api.status().catalogError,!valid);
    assert.equal(calls.length,0);
  }
});
