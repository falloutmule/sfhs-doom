#!/usr/bin/env python3
"""Build Forge V3 from protected player sources and the existing content-free engine."""
import argparse
import base64
import gzip
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / 'web' / 'forge'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def text(path):
    return path.read_text(encoding='utf-8')

def script(source, attrs=''):
    return '<script'+attrs+'>'+re.sub(r'</script', lambda match: '<\\/' + match.group()[2:], source, flags=re.IGNORECASE)+'</script>'

def namespace(r):
    effective = [f for mode in ['merge','file','deh'] for f in r['files'] if f['enabled'] and f['mode']==mode]
    inputs = dict(id=r['id'],engine=r['engine'],base=r['base'],family=r['family'],files=[[f['mode'],f['payloadId']] for f in effective],warp=r['warp'],skill=r['skill'],options=[[k,bool(r['options'].get(k))] for k in ['nomonsters','fast','respawn']],embeddedDehacked=bool(r.get('embeddedDehacked')))
    return 'forge-'+sha(json.dumps(inputs,separators=(',',':'),ensure_ascii=False).encode())

def build(output, engine_path, controls_path, check=False):
    protected = ROOT/'dist'/'sfhs-doom-forge-v2.html'
    if sha(protected.read_bytes()) != '927d744c11c219dfbaffd8486f84cec77093cb626a35d389ad37d14aaf01326e':
        raise ValueError('Protected V2 artifact identity changed')
    if output.resolve().name != 'sfhs-doom-forge-v3.html' and 'test-results' not in output.resolve().parts:
        raise ValueError('Only new V3 or ignored proof outputs are permitted')
    engine = text(engine_path)
    if 'function findWasmBinary()' not in engine or 'return binaryDecode(' not in engine:
        raise ValueError('Engine must carry single-file Wasm')
    shell = text(ROOT/'web'/'p7'/'forge-shell.html')
    start=shell.index('<div id="setup-overlay">');end=shell.index('</section></div>',start)+len('</section></div>')
    shell=shell[:start]+text(WEB/'launcher.html')+shell[end:]
    start=shell.index('      const shaConstants=');end=shell.index('      const forgeSnapshot=',start)
    shell=shell[:start]+text(WEB/'player-bridge.js')+'\n'+shell[end:]
    shell=shell.replace('P7-FORGE-V2','FORGE-COMPLETE-4').replace('P7-FORGE-RUNTIME-V2','FORGE-COMPLETE-4').replace('forge-v2','forge-v3').replace('Forge V2','Forge V3').replace('local-p7b-local-analyzer','d0953a12-forge-complete').replace('sfhs-doom-forge-v2.html','sfhs-doom-forge-v3.html')
    shell=shell.replace('</head>','<link rel="icon" href="data:,">\n<style>'+text(WEB/'forge.css')+'</style></head>')
    shell=shell.replace('<button id="fullscreen-action"','<button id="return-forge" type="button">Return to Forge / games</button><button id="fullscreen-action"')
    shell=shell.replace('<!-- SFHS_MOBILE_CONTROLS_BUNDLE -->',script(text(controls_path)))
    catalog=(WEB/'archive-catalog.json').read_bytes()
    catalog_tag=script(base64.b64encode(gzip.compress(catalog,compresslevel=9,mtime=0)).decode(),' id="sfhs-archive-catalog" type="application/octet-stream" data-compression="gzip" data-decoded-bytes="'+str(len(catalog))+'" data-sha256="'+sha(catalog)+'"')
    shell=shell.replace('<!-- SFHS_FORGE_ANALYZER_WORKER -->',script(text(WEB/'forge-core.js'))+'\n<!-- FORGE_TOOLS_START -->\n'+script(text(WEB/'forge-import-worker.js'),' id="sfhs-forge-import-worker" type="text/plain"')+'\n'+catalog_tag+'\n'+script(text(WEB/'forge-archive.js'))+'\n<!-- FORGE_TOOLS_END -->')
    shell=shell.replace('<!-- SFHS_FORGE_CAPSULE_PAYLOAD -->','<!-- FORGE_MANIFEST -->\n<!-- FORGE_PAYLOADS -->\n<!-- FORGE_TEMPLATE -->')
    shell=shell.replace('<!-- SFHS_P3_ENGINE_JS -->',script(text(WEB/'forge-app.js'))+'\n<!-- FORGE_TOOLS_START -->'+script(text(WEB/'forge-tools.js'))+'<!-- FORGE_TOOLS_END -->\n<!-- FORGE_ENGINE -->')
    payloads=[];recipes=[];chunks=[]
    notice=text(ROOT/'vendor-cache'/'freedoom'/'0.13.0'/'data'/'COPYING.txt')
    for phase in (2,1):
        name=f'freedoom{phase}.wad';wad=(ROOT/'vendor-cache'/'freedoom'/'0.13.0'/'data'/name).read_bytes();encoded=gzip.compress(wad,compresslevel=9,mtime=0);hash_=sha(wad);size=262144
        p=dict(id=hash_,filename=name,role='iwad',decoded=dict(bytes=len(wad),sha256=hash_),compression='gzip',encoding='base64',encoded=dict(bytes=len(encoded),sha256=sha(encoded)),chunkSize=size,chunkCount=(len(encoded)+size-1)//size,permission='redistributable',license=notice,source=dict(project='https://freedoom.github.io/',version='0.13.0'),storage=dict(kind='embedded-chunks'),inspection=dict(kind='IWAD',targetGame='doom2' if phase==2 else 'doom',compatibility=dict(status='likely-compatible',label='Open base · local engine test available',evidence=['Pinned Freedoom 0.13.0'])))
        payloads.append(p)
        r=dict(schema='sfhs.doom-recipe@1',id=f'freedoom-phase-{phase}',title=f'Freedoom Phase {phase}',engine='chocolate-doom',base=hash_,family='doom2' if phase==2 else 'doom',files=[],documentIds=[],warp='MAP01' if phase==2 else 'E1M1',skill=3,options={},saveNamespace='',manualOverride=False,embeddedDehacked=False,author='Freedoom contributors',mapCount=32 if phase==2 else 36)
        r['saveNamespace']=namespace(r);recipes.append(r)
        for index,offset in enumerate(range(0,len(encoded),size)):
            chunks.append(script(base64.b64encode(encoded[offset:offset+size]).decode(),' type="application/octet-stream" data-forge-payload="'+hash_+'" data-chunk="'+str(index)+'"'))
    manifest=dict(schema='sfhs.doom-capsule@1',capsule=dict(id='sfhs-doom-forge-v3',name='SFHS Doom Forge V3',version=3,mode='collection',forge=True,private=False,buildProfile='FORGE-COMPLETE-4'),payloads=payloads,recipes=recipes,defaultRecipe=recipes[0]['id'],credits=['Chocolate Doom contributors — GPL-2.0-or-later','Freedoom contributors — BSD-3-Clause','SFHS Doom / mobile controls contributors'],licenses=[text(ROOT/'COPYING.md'),notice],networkPolicy=dict(default='offline'))
    template=shell
    output_text=template.replace('<!-- FORGE_MANIFEST -->',script(json.dumps(manifest,ensure_ascii=False,separators=(',',':')),' id="sfhs-forge-manifest" type="application/json"')).replace('<!-- FORGE_PAYLOADS -->','\n'.join(chunks)).replace('<!-- FORGE_TEMPLATE -->',script(base64.b64encode(template.encode()).decode(),' id="sfhs-forge-template" type="text/plain"')).replace('<!-- FORGE_ENGINE -->',script(engine,' id="sfhs-forge-engine"'))
    data=output_text.encode()
    if check:
        if not output.exists() or output.read_bytes()!=data:raise ValueError('Build parity failed')
    else:
        output.parent.mkdir(parents=True,exist_ok=True);output.write_bytes(data)
        proof=ROOT/'test-results'/'P07'/'forge-complete'/'build.json';proof.parent.mkdir(parents=True,exist_ok=True);proof.write_text(json.dumps(dict(artifact=str(output.relative_to(ROOT)),bytes=len(data),sha256=sha(data),engineSha256=sha(engine.encode()),controlsSha256=sha(text(controls_path).encode()),buildId='FORGE-COMPLETE-4',payloads=[dict(filename=p['filename'],sha256=p['id'],bytes=p['decoded']['bytes']) for p in payloads]),indent=2)+'\n')
    print(json.dumps(dict(status='PASS',check=check,artifact=str(output),bytes=len(data),sha256=sha(data))))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,default=ROOT/'dist'/'sfhs-doom-forge-v3.html');p.add_argument('--engine-js',type=Path,default=ROOT/'build'/'wasm'/'p7-forge-v2'/'product'/'src'/'chocolate-doom.js');p.add_argument('--controls',type=Path,default=ROOT/'build'/'runtime'/'P07-forge-v2'/'product'/'sfhs-mobile-controls-v1.iife.js');p.add_argument('--check',action='store_true');a=p.parse_args();build(a.output,a.engine_js,a.controls,a.check)
