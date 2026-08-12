'use strict';

const LIMITS=Object.freeze({inputBytes:128*1024*1024,zipEntries:512,expandedBytes:256*1024*1024,entryBytes:128*1024*1024,expansionRatio:100,wadLumps:131072,reportedNames:96,reportedDuplicates:24,reportedSignals:32});
const EXECUTABLE_EXTENSIONS=new Set(['exe','com','bat','cmd','js','mjs','cjs','html','htm','svg','msi','scr','ps1','vbs','jar']);
const DOCUMENT_EXTENSIONS=new Set(['txt','md','nfo','rtf','pdf','doc','docx','html','htm']);
const NESTED_ARCHIVE_EXTENSIONS=new Set(['zip','7z','rar','tar','gz','bz2','xz']);
const ADVANCED_MARKERS=new Set(['BEHAVIOR','SCRIPTS','DECORATE','ZSCRIPT','MAPINFO','ZMAPINFO','TEXTMAP','ENDMAP','LOADACS','ANIMDEFS','SNDINFO','DECALDEF','GL_VERT','GL_SEGS','GL_SSECT','GL_NODES','ZNODES']);
const UNSUPPORTED_MAP_MARKERS=new Set(['BEHAVIOR','TEXTMAP','ENDMAP','ZNODES']);
const decoderUtf8=new TextDecoder('utf-8',{fatal:false}),decoderLegacy=new TextDecoder('windows-1252',{fatal:false});

class InspectionError extends Error{
  constructor(code,message,stage='inspect'){super(message);this.name='InspectionError';this.code=code;this.stage=stage;}
}

const viewOf=bytes=>new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
const u16=(view,at)=>view.getUint16(at,true);
const u32=(view,at)=>view.getUint32(at,true);
const extension=name=>{const leaf=name.split('/').pop()||'',at=leaf.lastIndexOf('.');return at<0?'':leaf.slice(at+1).toLowerCase();};
const cleanText=(value,max=160)=>String(value).replace(/[\u0000-\u001f\u007f]/g,'�').slice(0,max);
const cleanFilename=value=>cleanText(String(value).replaceAll('\\','/').split('/').pop()||'unnamed',120);
const hex=buffer=>Array.from(new Uint8Array(buffer),value=>value.toString(16).padStart(2,'0')).join('');
const sha256=async bytes=>hex(await crypto.subtle.digest('SHA-256',bytes));

function safeArchivePath(raw){
  const value=String(raw).replaceAll('\\','/');
  if(!value||value.includes('\0')||value.startsWith('/')||value.startsWith('//')||/^[a-z]:/i.test(value))throw new InspectionError('zip-path','Archive contains an absolute or empty path.','zip-directory');
  const parts=value.split('/');
  if(parts.some(part=>part==='..'||part==='.'))throw new InspectionError('zip-traversal','Archive path traversal is not allowed.','zip-directory');
  return cleanText(parts.filter(Boolean).join('/'),240);
}

function decodeZipName(bytes,utf8){return (utf8?decoderUtf8:decoderLegacy).decode(bytes);}

function crc32(bytes){
  let crc=0xffffffff;
  for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  return (crc^0xffffffff)>>>0;
}

function readLumpName(bytes,at){
  let end=at;while(end<at+8&&bytes[end]!==0)end+=1;
  return cleanText(decoderLegacy.decode(bytes.subarray(at,end)).toUpperCase(),8);
}

function wadCompatibility(wad){
  if(wad.unsupportedSignals.length)return{status:'unsupported-by-engine',label:'Unsupported by this engine',targetGame:wad.targetGame,recommendedBase:wad.recommendedBase,recommendedLoading:wad.loadingMethod,confidence:'high',evidence:[`Detected ${wad.unsupportedSignals.join(', ')}`,'Current profile is Chocolate Doom 3.1.1'],unsupportedSignals:wad.unsupportedSignals,manualOverride:false};
  if(wad.targetGame==='unknown'||wad.targetGame==='mixed')return{status:'manual-recipe-required',label:'Manual recipe required',targetGame:wad.targetGame,recommendedBase:'Choose after reviewing documentation',recommendedLoading:wad.loadingMethod,confidence:'medium',evidence:['No unambiguous Doom or Doom II map family was detected'],unsupportedSignals:[],manualOverride:false};
  return{status:'likely-compatible',label:'Likely compatible',targetGame:wad.targetGame,recommendedBase:wad.recommendedBase,recommendedLoading:wad.loadingMethod,confidence:'medium',evidence:['WAD directory is structurally valid','No definite advanced-port requirement was detected','A launch test has not been performed'],unsupportedSignals:[],manualOverride:false};
}

async function parseWad(bytes,name,knownHash=null){
  if(bytes.length<12)throw new InspectionError('wad-header','WAD header is truncated.','wad-header');
  const magic=decoderLegacy.decode(bytes.subarray(0,4));
  if(magic!=='IWAD'&&magic!=='PWAD')throw new InspectionError('wad-magic','File bytes do not begin with IWAD or PWAD.','identify');
  const view=viewOf(bytes),lumpCount=u32(view,4),directoryOffset=u32(view,8);
  if(lumpCount>LIMITS.wadLumps)throw new InspectionError('wad-lump-limit',`WAD declares more than ${LIMITS.wadLumps} lumps.`,'wad-directory');
  const directoryBytes=lumpCount*16,directoryEnd=directoryOffset+directoryBytes;
  if(!Number.isSafeInteger(directoryEnd)||directoryOffset<12||directoryEnd>bytes.length)throw new InspectionError('wad-directory-bounds','WAD lump directory is outside the file.','wad-directory');
  const names=[],ranges=[],counts=new Map();let embeddedDehacked=false,spriteNamespace=false,graphicsNamespace=false;
  for(let index=0;index<lumpCount;index++){
    const at=directoryOffset+index*16,position=u32(view,at),size=u32(view,at+4),end=position+size,nameValue=readLumpName(bytes,at+8);
    if(position>bytes.length||!Number.isSafeInteger(end)||end>bytes.length||size>0&&position<12)throw new InspectionError('wad-lump-bounds',`Lump ${index} (${nameValue||'unnamed'}) is outside the data region.`,'wad-directory');
    if(size>0&&position<directoryEnd&&end>directoryOffset)throw new InspectionError('wad-directory-overlap',`Lump ${index} (${nameValue||'unnamed'}) overlaps the WAD directory.`,'wad-directory');
    if(size>0)ranges.push({start:position,end,index,name:nameValue});
    names.push(nameValue);counts.set(nameValue,(counts.get(nameValue)||0)+1);
    if(nameValue==='DEHACKED')embeddedDehacked=true;
    if(['S_START','SS_START','S_END','SS_END'].includes(nameValue))spriteNamespace=true;
    if(['P_START','PP_START','P_END','PP_END','F_START','FF_START','F_END','FF_END'].includes(nameValue))graphicsNamespace=true;
  }
  ranges.sort((a,b)=>a.start-b.start||a.end-b.end);
  for(let index=1;index<ranges.length;index++)if(ranges[index].start<ranges[index-1].end)throw new InspectionError('wad-overlap',`Lumps ${ranges[index-1].name||ranges[index-1].index} and ${ranges[index].name||ranges[index].index} overlap.`,'wad-directory');
  const episodeMaps=[...new Set(names.filter(name=>/^E[1-9]M[1-9]$/.test(name)))],doom2Maps=[...new Set(names.filter(name=>/^MAP\d\d$/.test(name)))];
  const advancedSignals=[...new Set(names.filter(name=>ADVANCED_MARKERS.has(name)))].slice(0,LIMITS.reportedSignals);
  const unsupportedSignals=[...new Set(names.filter(name=>UNSUPPORTED_MAP_MARKERS.has(name)))].slice(0,LIMITS.reportedSignals);
  const duplicates=[...counts].filter(([,count])=>count>1).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,LIMITS.reportedDuplicates).map(([lump,count])=>({lump,count}));
  const targetGame=episodeMaps.length&&doom2Maps.length?'mixed':episodeMaps.length?'doom':doom2Maps.length?'doom2':'unknown';
  const recommendedBase=magic==='IWAD'?'This IWAD is a base':targetGame==='doom'?'Freedoom Phase 1':targetGame==='doom2'?'Freedoom Phase 2':'Choose a compatible IWAD';
  const loadingMethod=magic==='IWAD'?'IWAD base':'Ordinary PWAD (-file)';
  const result={name:cleanFilename(name),kind:magic,bytes:bytes.length,sha256:knownHash||await sha256(bytes),lumpCount,directoryOffset,directoryValid:true,maps:{episode:episodeMaps,doom2:doom2Maps,total:episodeMaps.length+doom2Maps.length},targetGame,embeddedDehacked,namespaces:{sprites:spriteNamespace,graphics:graphicsNamespace},advancedSignals,unsupportedSignals,duplicates,duplicateCount:[...counts.values()].filter(count=>count>1).length,loadingMethod,recommendedBase};
  result.compatibility=wadCompatibility(result);return result;
}

function findEocd(bytes){
  const view=viewOf(bytes),minimum=Math.max(0,bytes.length-65557);
  for(let at=bytes.length-22;at>=minimum;at--)if(u32(view,at)===0x06054b50&&at+22+u16(view,at+20)===bytes.length)return at;
  throw new InspectionError('zip-eocd','ZIP end-of-central-directory record is missing or invalid.','zip-directory');
}

async function inflateEntry(compressed,method){
  if(method===0)return compressed.slice();
  if(method!==8)throw new InspectionError('zip-method',`ZIP compression method ${method} is not supported.`,'zip-entry');
  if(typeof DecompressionStream!=='function')throw new InspectionError('zip-deflate-unsupported','This browser cannot inspect deflated ZIP entries.','zip-entry');
  let stream;try{stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));}catch(_){throw new InspectionError('zip-deflate-unsupported','This browser cannot inspect raw-deflate ZIP entries.','zip-entry');}
  try{return new Uint8Array(await new Response(stream).arrayBuffer());}catch(_){throw new InspectionError('zip-deflate','A ZIP entry could not be decompressed.','zip-entry');}
}

function zipCompatibility(wads,signals){
  const unsupported=[...new Set(wads.flatMap(wad=>wad.unsupportedSignals))];
  if(unsupported.length)return{status:'unsupported-by-engine',label:'Unsupported by this engine',targetGame:[...new Set(wads.map(wad=>wad.targetGame))].join(', ')||'unknown',recommendedBase:'Review unsupported signals',recommendedLoading:'Do not launch with this engine profile',confidence:'high',evidence:[`Detected ${unsupported.join(', ')}`],unsupportedSignals:unsupported,manualOverride:false};
  if(wads.length!==1||signals.length)return{status:'manual-recipe-required',label:'Manual recipe required',targetGame:[...new Set(wads.map(wad=>wad.targetGame))].join(', ')||'unknown',recommendedBase:wads.length===1?wads[0].recommendedBase:'Choose after reviewing package contents',recommendedLoading:wads.length===1?wads[0].loadingMethod:'Order package entries manually',confidence:'high',evidence:[wads.length===0?'No WAD payload was found':`${wads.length} WAD payloads require explicit ordering`,...signals],unsupportedSignals:[],manualOverride:false};
  return{...wads[0].compatibility,evidence:[...wads[0].compatibility.evidence,'ZIP contains one inspectable WAD']};
}

async function parseZip(bytes,name,knownHash=null){
  if(bytes.length<22)throw new InspectionError('zip-header','ZIP file is truncated.','zip-header');
  const view=viewOf(bytes),eocd=findEocd(bytes),disk=u16(view,eocd+4),centralDisk=u16(view,eocd+6),diskEntries=u16(view,eocd+8),entryCount=u16(view,eocd+10),centralSize=u32(view,eocd+12),centralOffset=u32(view,eocd+16);
  if(disk!==0||centralDisk!==0||diskEntries!==entryCount)throw new InspectionError('zip-multidisk','Multi-disk ZIP archives are not supported.','zip-directory');
  if(entryCount===0xffff||centralSize===0xffffffff||centralOffset===0xffffffff)throw new InspectionError('zip64','ZIP64 archives are not supported by this phone analyzer.','zip-directory');
  if(entryCount>LIMITS.zipEntries)throw new InspectionError('zip-file-count',`ZIP contains more than ${LIMITS.zipEntries} entries.`,'zip-directory');
  if(centralOffset+centralSize>eocd)throw new InspectionError('zip-central-bounds','ZIP central directory is outside the archive.','zip-directory');
  const entries=[],seenPaths=new Set(),duplicatePaths=[];let at=centralOffset,totalExpanded=0,totalCompressed=0;
  for(let index=0;index<entryCount;index++){
    if(at+46>centralOffset+centralSize||u32(view,at)!==0x02014b50)throw new InspectionError('zip-central-entry',`ZIP central entry ${index} is malformed.`,'zip-directory');
    const flags=u16(view,at+8),method=u16(view,at+10),crc=u32(view,at+16),compressedSize=u32(view,at+20),expandedSize=u32(view,at+24),nameLength=u16(view,at+28),extraLength=u16(view,at+30),commentLength=u16(view,at+32),localOffset=u32(view,at+42),end=at+46+nameLength+extraLength+commentLength;
    if(end>centralOffset+centralSize)throw new InspectionError('zip-central-bounds',`ZIP central entry ${index} exceeds its directory.`,'zip-directory');
    if(flags&1)throw new InspectionError('zip-encrypted','Encrypted ZIP entries are not supported.','zip-directory');
    if(compressedSize===0xffffffff||expandedSize===0xffffffff||localOffset===0xffffffff)throw new InspectionError('zip64','ZIP64 entries are not supported.','zip-directory');
    if(expandedSize>LIMITS.entryBytes)throw new InspectionError('zip-entry-size',`ZIP entry ${index} exceeds the per-file expansion limit.`,'zip-quota');
    if(expandedSize>0&&compressedSize===0)throw new InspectionError('zip-ratio',`ZIP entry ${index} has an invalid expansion ratio.`,'zip-quota');
    if(compressedSize>0&&expandedSize/compressedSize>LIMITS.expansionRatio)throw new InspectionError('zip-ratio',`ZIP entry ${index} exceeds the expansion-ratio limit.`,'zip-quota');
    totalExpanded+=expandedSize;totalCompressed+=compressedSize;
    if(totalExpanded>LIMITS.expandedBytes)throw new InspectionError('zip-expanded-size','ZIP exceeds the total expanded-byte limit.','zip-quota');
    const rawName=decodeZipName(bytes.subarray(at+46,at+46+nameLength),Boolean(flags&0x800)),path=safeArchivePath(rawName),directory=rawName.endsWith('/')||rawName.endsWith('\\');
    if(seenPaths.has(path)){duplicatePaths.push(path);}else seenPaths.add(path);
    entries.push({index,path,directory,flags,method,crc,compressedSize,expandedSize,localOffset,extension:extension(path)});at=end;
  }
  if(at!==centralOffset+centralSize)throw new InspectionError('zip-central-size','ZIP central-directory size does not match its entries.','zip-directory');
  if(totalExpanded/Math.max(bytes.length,1)>LIMITS.expansionRatio)throw new InspectionError('zip-total-ratio','ZIP exceeds the total expansion-ratio limit.','zip-quota');
  const wads=[],documents=[],ignored=[],nested=[],dataRanges=[];
  for(const entry of entries){
    if(entry.directory)continue;
    if(EXECUTABLE_EXTENSIONS.has(entry.extension)){ignored.push({path:entry.path,reason:'executable-content'});continue;}
    if(NESTED_ARCHIVE_EXTENSIONS.has(entry.extension)){nested.push(entry.path);ignored.push({path:entry.path,reason:'nested-archive'});continue;}
    if(DOCUMENT_EXTENSIONS.has(entry.extension))documents.push(entry.path);
    if(entry.method!==0&&entry.method!==8){ignored.push({path:entry.path,reason:`compression-method-${entry.method}`});continue;}
    if(entry.localOffset>=centralOffset||entry.localOffset+30>centralOffset||u32(view,entry.localOffset)!==0x04034b50)throw new InspectionError('zip-local-header',`ZIP local header for ${entry.path} is malformed.`,'zip-entry');
    const localFlags=u16(view,entry.localOffset+6),localMethod=u16(view,entry.localOffset+8),localNameLength=u16(view,entry.localOffset+26),localExtraLength=u16(view,entry.localOffset+28),dataStart=entry.localOffset+30+localNameLength+localExtraLength,dataEnd=dataStart+entry.compressedSize;
    if(localFlags!==entry.flags||localMethod!==entry.method||dataEnd>centralOffset)throw new InspectionError('zip-local-bounds',`ZIP data for ${entry.path} is inconsistent.`,'zip-entry');
    const localPath=safeArchivePath(decodeZipName(bytes.subarray(entry.localOffset+30,entry.localOffset+30+localNameLength),Boolean(localFlags&0x800)));
    if(localPath!==entry.path)throw new InspectionError('zip-name-mismatch',`ZIP local and central names differ for ${entry.path}.`,'zip-entry');
    if(dataRanges.some(range=>dataStart<range.end&&dataEnd>range.start))throw new InspectionError('zip-data-overlap',`ZIP data ranges overlap at ${entry.path}.`,'zip-entry');
    dataRanges.push({start:dataStart,end:dataEnd});
    const decoded=await inflateEntry(bytes.subarray(dataStart,dataEnd),entry.method);
    if(decoded.length!==entry.expandedSize)throw new InspectionError('zip-expanded-size',`Expanded size does not match for ${entry.path}.`,'zip-entry');
    if(crc32(decoded)!==entry.crc)throw new InspectionError('zip-crc',`CRC-32 does not match for ${entry.path}.`,'zip-entry');
    const magic=decoded.length>=4?decoderLegacy.decode(decoded.subarray(0,4)):'';
    if(magic==='IWAD'||magic==='PWAD')wads.push(await parseWad(decoded,entry.path));
  }
  const packageSignals=[];
  if(duplicatePaths.length)packageSignals.push('Duplicate archive paths');
  if(nested.length)packageSignals.push('Nested archives were not extracted');
  if(ignored.some(item=>item.reason.startsWith('compression-method-')))packageSignals.push('Unsupported compression methods were skipped');
  const compatibility=zipCompatibility(wads,packageSignals);
  return{kind:'ZIP',name:cleanFilename(name),bytes:bytes.length,sha256:knownHash||await sha256(bytes),archive:{entryCount,compressedBytes:totalCompressed,expandedBytes:totalExpanded,expansionRatio:Math.round(totalExpanded/Math.max(bytes.length,1)*100)/100,entries:entries.slice(0,LIMITS.reportedNames).map(entry=>({path:entry.path,compressedBytes:entry.compressedSize,expandedBytes:entry.expandedSize,method:entry.method,directory:entry.directory})),entriesTruncated:Math.max(0,entries.length-LIMITS.reportedNames),documents:documents.slice(0,24),nested:nested.slice(0,24),ignored:ignored.slice(0,24),duplicatePaths:duplicatePaths.slice(0,24)},wads,compatibility};
}

async function inspect(message){
  const started=performance.now(),name=cleanFilename(message.name),declaredSize=Number(message.size);
  if(!(message.bytes instanceof ArrayBuffer)||!Number.isSafeInteger(declaredSize)||declaredSize<0||declaredSize!==message.bytes.byteLength)throw new InspectionError('input-contract','Selected file bytes do not match the declared size.','read');
  if(declaredSize===0)throw new InspectionError('empty-file','The selected file is empty.','read');
  if(declaredSize>LIMITS.inputBytes)throw new InspectionError('input-size',`File exceeds the ${LIMITS.inputBytes/(1024*1024)} MiB inspection limit.`,'read');
  const bytes=new Uint8Array(message.bytes),identityHash=await sha256(bytes),magic=bytes.length>=4?decoderLegacy.decode(bytes.subarray(0,4)):'';
  let parsed;try{if(magic==='IWAD'||magic==='PWAD'){const wad=await parseWad(bytes,name,identityHash);parsed={kind:'WAD',name,bytes:bytes.length,sha256:wad.sha256,wads:[wad],compatibility:wad.compatibility};}else if(magic.startsWith('PK'))parsed=await parseZip(bytes,name,identityHash);else throw new InspectionError('unsupported-type','Selected bytes are neither a WAD nor a supported ZIP.','identify');}catch(error){error.sha256=identityHash;throw error;}
  return{schema:'sfhs.doom-inspection@1',privacy:'local-only-not-uploaded',permission:{status:'private-local-only',label:'Private/local only',evidence:'User-selected local file; redistribution permission is not established.'},source:{name,bytes:declaredSize,sha256:parsed.sha256,type:parsed.kind},wads:parsed.wads,archive:parsed.archive||null,compatibility:parsed.compatibility,limits:{...LIMITS},durationMs:Math.round((performance.now()-started)*100)/100,storedBytes:0,launchable:false};
}

self.addEventListener('message',async event=>{
  const id=event.data&&event.data.id;
  try{const result=await inspect(event.data||{});self.postMessage({id,ok:true,result});}
  catch(error){const known=error instanceof InspectionError;self.postMessage({id,ok:false,error:{schema:'sfhs.doom-inspection-error@1',code:known?error.code:'inspection-failed',stage:known?error.stage:'inspect',message:cleanText(error&&error.message||error,240),sha256:/^[a-f0-9]{64}$/.test(error&&error.sha256||'')?error.sha256:null,storedBytes:0,launchable:false}});}
});
