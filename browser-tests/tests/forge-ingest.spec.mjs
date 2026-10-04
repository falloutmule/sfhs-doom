import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import {deflateRawSync} from 'node:zlib';
import {readFileSync} from 'node:fs';

const workerSource=readFileSync(new URL('../../web/forge/forge-import-worker.js',import.meta.url),'utf8');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
function wad(lumps=[],magic='PWAD'){
  const directory=12+lumps.reduce((sum,lump)=>sum+(lump.data?.length||0),0),out=Buffer.alloc(directory+lumps.length*16);out.write(magic);out.writeUInt32LE(lumps.length,4);out.writeUInt32LE(directory,8);let at=12;
  lumps.forEach((lump,index)=>{const data=Buffer.from(lump.data||[]),entry=directory+index*16;out.writeUInt32LE(data.length?at:0,entry);out.writeUInt32LE(data.length,entry+4);out.write(lump.name.slice(0,8),entry+8);data.copy(out,at);at+=data.length;});return out;
}
function mapLumps(){return[{name:'MAP01'},...Object.entries({THINGS:10,LINEDEFS:14,SIDEDEFS:30,VERTEXES:4,SEGS:12,SSECTORS:4,NODES:28,SECTORS:26,REJECT:1,BLOCKMAP:8}).map(([name,size])=>({name,data:Buffer.alloc(size)}))];}
function zip(entries){
  const locals=[],centrals=[];let offset=0;
  for(const entry of entries){
    const name=Buffer.from(entry.name),data=Buffer.from(entry.data||[]),method=entry.method||0,compressed=entry.compressed||data,expanded=entry.expandedSize??data.length,flags=entry.flags||0,crc=entry.crc??crc32(data);
    const local=Buffer.alloc(30+name.length+compressed.length);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(flags,6);local.writeUInt16LE(method,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(expanded,22);local.writeUInt16LE(name.length,26);name.copy(local,30);compressed.copy(local,30+name.length);locals.push(local);
    const central=Buffer.alloc(46+name.length);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(flags,8);central.writeUInt16LE(method,10);central.writeUInt32LE(crc,16);central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(expanded,24);central.writeUInt16LE(name.length,28);central.writeUInt32LE(offset,42);name.copy(central,46);centrals.push(central);offset+=local.length;
  }
  const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(centrals.reduce((sum,value)=>sum+value.length,0),12);end.writeUInt32LE(offset,16);return Buffer.concat([...locals,...centrals,end]);
}
test.beforeEach(async({page})=>{
  await page.route('http://127.0.0.1/forge-ingest-test',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Forge ingest worker test</title>'}));
  await page.goto('http://127.0.0.1/forge-ingest-test');
  await page.evaluate(source=>{window.workerSource=source;},workerSource);
});
async function inspect(page,name,bytes){
  return page.evaluate(async({name,base64})=>{
    const bytes=Uint8Array.from(atob(base64),character=>character.charCodeAt(0)),url=URL.createObjectURL(new Blob([window.workerSource],{type:'text/javascript'})),worker=new Worker(url);
    try{return await new Promise((resolve,reject)=>{worker.onerror=event=>reject(new Error(event.message));worker.onmessage=event=>{const reply=event.data;for(const file of reply.files||[])file.bytes=Array.from(new Uint8Array(file.bytes));resolve(reply);};worker.postMessage({id:17,name,size:bytes.length,bytes:bytes.buffer,extract:true},[bytes.buffer]);});}finally{worker.terminate();URL.revokeObjectURL(url);}
  },{name,base64:bytes.toString('base64')});
}

test('content recognition extracts exact WAD, patch, README, and recipe bytes with explicit permission evidence',async({page})=>{
  const content=wad(mapLumps()),patch=Buffer.from('Patch File for DeHackEd v3.0\n\nThing 1\nHit points = 90\n'),readme=Buffer.from('Title: Synthetic test\nYou may distribute this WAD freely if this text is included.\nRequires support.wad\n'),recipe=Buffer.from(JSON.stringify({schema:'sfhs.doom-recipe@1',id:'fixture'}));
  const result=await inspect(page,'bundle.bin',zip([{name:'mods/level.data',data:content,method:8,compressed:deflateRawSync(content)},{name:'balance.data',data:patch},{name:'README.txt',data:readme},{name:'recipe.data',data:recipe},{name:'setup.exe',data:Buffer.from('MZunsafe')},{name:'nested.data',data:zip([])}]));
  expect(result.ok).toBe(true);expect(result.id).toBe(17);expect(result.files.map(file=>file.kind)).toEqual(['PWAD','DEH','TEXT','RECIPE']);
  for(const [index,bytes]of[content,patch,readme,recipe].entries()){expect(Buffer.from(result.files[index].bytes)).toEqual(bytes);expect(result.files[index].sha256).toBe(sha(bytes));expect(result.files[index].permission.status).toBe('redistribution-allowed');}
  expect(result.result.documents[0].text).toBe(readme.toString());expect(result.result.archive.documents).toEqual(['README.txt']);expect(result.result.archive.nested).toEqual(['nested.data']);expect(result.result.archive.ignored).toContainEqual({path:'setup.exe',reason:'executable-content'});expect(result.result.metadata.requiredFiles).toEqual(['Requires support.wad']);expect(result.result.wads[0].mapStructures[0]).toMatchObject({slot:'MAP01',format:'Doom',complete:true});expect(result.result.limitsPurpose).toContain('not measured phone capacity');
});

test('filenames and vague claims cannot grant permission; explicit prohibitions override grants',async({page})=>{
  const content=wad(mapLumps()),unknown=await inspect(page,'CC0-public-domain.wad',content);expect(unknown.files[0].permission.status).toBe('private-local-only');
  const vague=await inspect(page,'freely-distributable.txt',Buffer.from('This is an open community wad.'));expect(vague.result.permission.status).toBe('private-local-only');
  const denied=await inspect(page,'bundle.zip',zip([{name:'map.wad',data:content},{name:'license.txt',data:Buffer.from('You may distribute this WAD. You may not distribute this package commercially.')} ]));expect(denied.result.permission.status).toBe('redistribution-prohibited');expect(denied.files.every(file=>file.permission.status==='redistribution-prohibited')).toBe(true);
});

test('Chocolate-supported BEX string patches are distinguished from advanced or unenabled BEX',async({page})=>{
  const supported=Buffer.from('Patch File for DeHackEd v3.0\n# *allow-extended-strings*\n\n[STRINGS]\nHUSTR_1 = TEST MAP\n'),good=await inspect(page,'patch.bin',supported);expect(good.files[0].kind).toBe('BEX');expect(good.result.compatibility.status).toBe('likely-compatible');
  for(const text of['Patch File for DeHackEd v3.0\n\n[STRINGS]\nHUSTR_1 = TEST\n','Patch File for DeHackEd v3.0\n\n[CODEPTR]\nFRAME 1 = FirePistol\n','Patch File for DeHackEd v3.0\n\nFrame 2000\nDuration = 1\n']){const bad=await inspect(page,'patch.bex',Buffer.from(text));expect(bad.ok).toBe(true);expect(bad.result.compatibility.status).toBe('unsupported-by-engine');}
});

test('Boom, MBF, UDMF, embedded DeHackEd, and stated engine requirements are surfaced',async({page})=>{
  const boom=mapLumps();boom.find(lump=>lump.name==='LINEDEFS').data.writeUInt16LE(242,6);const b=await inspect(page,'boom.wad',wad(boom));expect(b.result.compatibility.status).toBe('unsupported-by-engine');expect(b.result.wads[0].unsupportedSignals).toContain('Extended linedef special 242');
  const mbf=mapLumps();mbf.find(lump=>lump.name==='THINGS').data.writeUInt16LE(888,6);const m=await inspect(page,'mbf.wad',wad(mbf));expect(m.result.wads[0].unsupportedSignals).toContain('MBF helper dog thing');
  const advanced=await inspect(page,'udmf.wad',wad([{name:'MAP01'},{name:'TEXTMAP',data:Buffer.from('namespace="ZDoom";')},{name:'ENDMAP'}]));expect(advanced.result.wads[0].mapStructures[0].format).toBe('UDMF');expect(advanced.result.compatibility.status).toBe('unsupported-by-engine');
  const embedded=await inspect(page,'embedded.wad',wad([...mapLumps(),{name:'DEHACKED',data:Buffer.from('Patch File for DeHackEd v3.0\n\nThing 1\nHit points = 90\n')}]));expect(embedded.result.wads[0].embeddedPatches[0].kind).toBe('DEH');expect(embedded.result.compatibility.status).toBe('likely-compatible');
  const metadata=await inspect(page,'engine.zip',zip([{name:'map.wad',data:wad(mapLumps())},{name:'README.txt',data:Buffer.from('Requires: GZDoom 4.0\n')} ]));expect(metadata.result.metadata.engineRequirements).toEqual(['Requires: GZDoom 4.0']);expect(metadata.result.compatibility.status).toBe('unsupported-by-engine');
});

test('map records require the vanilla directory order and intact record sizes',async({page})=>{
  const reordered=mapLumps();[reordered[1],reordered[2]]=[reordered[2],reordered[1]];
  const invalid=mapLumps();invalid.find(lump=>lump.name==='LINEDEFS').data=Buffer.alloc(15);
  for(const fixture of[wad([{name:'MAP01'}]),wad(reordered),wad(invalid)]){const result=await inspect(page,'map.wad',fixture);expect(result.ok).toBe(true);expect(result.result.compatibility.status).toBe('manual-recipe-required');expect(result.result.wads[0].mapStructures[0].complete).toBe(false);}
});

test('malformed archives fail closed including duplicate aliases and ignored executable headers',async({page})=>{
  const inner=wad(mapLumps()),duplicate=zip([{name:'same.wad',data:inner},{name:'SAME.WAD',data:inner}]),localMismatch=zip([{name:'map.wad',data:inner}]);localMismatch.writeUInt32LE(1,22);
  const skippedBad=zip([{name:'setup.exe',data:Buffer.from('MZbad')}]);skippedBad.writeUInt32LE(0x99994b50,0);
  const malformedDirectory=zip([{name:'map.wad',data:inner}]);malformedDirectory.writeUInt32LE(0x7fffffff,malformedDirectory.length-6);
  for(const [fixture,code]of[[duplicate,'zip-duplicate-path'],[zip([{name:'../escape.wad',data:inner}]),'zip-traversal'],[zip([{name:'C:/escape.wad',data:inner}]),'zip-path'],[localMismatch,'zip-local-mismatch'],[skippedBad,'zip-local-header'],[malformedDirectory,'zip-central-bounds'],[zip([{name:'locked.wad',data:inner,flags:1}]),'zip-encrypted']]){const result=await inspect(page,'bad.zip',fixture);expect(result.ok).toBe(false);expect(result.error.code).toBe(code);expect(result.error.sha256).toBe(sha(fixture));expect(result.files).toBeUndefined();}
});

test('actual decompression is stopped when central directory understates expanded bytes',async({page})=>{
  const payload=Buffer.alloc(2*1024*1024,0x41),compressed=deflateRawSync(payload),fixture=zip([{name:'bomb.txt',data:payload,method:8,compressed,expandedSize:1000}]),result=await inspect(page,'understated.zip',fixture);
  expect(result.ok).toBe(false);expect(result.error).toMatchObject({code:'zip-expanded-size',stage:'zip-quota'});
});

test('binary executables, executable documents, and unknown binary data are excluded',async({page})=>{
  for(const [name,bytes]of[['renamed.data',Buffer.from('MZexecutable')],['readme.txt',Buffer.from('<!doctype html><html><script>alert(1)</script></html>')],['run.js',Buffer.from('postMessage("unsafe")')],['binary.dat',Buffer.from([0,1,2,3,4])]]){const result=await inspect(page,name,bytes);expect(result.ok).toBe(false);expect(result.error.code).toBe('unsupported-type');}
});

test('terminated imports stay cancelled and a new worker can immediately accept another import',async({page})=>{
  const state=await page.evaluate(async()=>{
    const url=URL.createObjectURL(new Blob([window.workerSource],{type:'text/javascript'})),worker=new Worker(url),bytes=new Uint8Array(64*1024*1024);bytes.set([80,87,65,68]);new DataView(bytes.buffer).setUint32(8,12,true);let replies=0;worker.onmessage=()=>replies++;worker.postMessage({id:'cancel',name:'large.wad',size:bytes.length,bytes:bytes.buffer,extract:true},[bytes.buffer]);worker.terminate();URL.revokeObjectURL(url);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return{replies};
  });expect(state.replies).toBe(0);expect((await inspect(page,'next.wad',wad(mapLumps()))).ok).toBe(true);
});
