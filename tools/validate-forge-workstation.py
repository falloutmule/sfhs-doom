#!/usr/bin/env python3
"""Independent byte verification of a generated Forge/player/collection capsule."""
import argparse
import base64
import gzip
import hashlib
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def digest(data):return hashlib.sha256(data).hexdigest()

def validate(path):
    raw=path.read_bytes();html=raw.decode('utf-8')
    scripts=re.findall(r'<script\b([^>]*)>(.*?)</script>',html,re.S|re.I)
    matches=[body for attrs,body in scripts if re.search(r'\bid="sfhs-forge-manifest"',attrs)]
    assert len(matches)==1,'one manifest required'
    m=json.loads(matches[0]);assert m['schema']=='sfhs.doom-capsule@1' and m['capsule']['version']==3
    assert m['networkPolicy']=={'default':'offline'}
    assert not re.search(r'<(?:script|iframe|img|audio|video)\b[^>]*\bsrc\s*=',html,re.I),'external runtime source'
    assert not re.search(r'<link\b[^>]*\brel=["\']stylesheet',html,re.I),'external stylesheet'
    ids=set();inventory=[];count=0
    for p in m['payloads']:
        assert re.fullmatch('[a-f0-9]{64}',p['id']) and p['id'] not in ids,'duplicate/invalid payload'
        ids.add(p['id'])
        blocks=[(re.search(r'data-chunk="(\d+)"',attrs)[1],body) for attrs,body in scripts if 'data-forge-payload="'+p['id']+'"' in attrs]
        assert len(blocks)==p['chunkCount'],'missing chunk '+p['filename']
        assert [int(i) for i,_ in blocks]==list(range(p['chunkCount'])),'chunk order '+p['filename']
        encoded=b''.join(base64.b64decode(x,validate=True) for _,x in blocks)
        assert len(encoded)==p['encoded']['bytes'] and digest(encoded)==p['encoded']['sha256'],'encoded hash '+p['filename']
        assert p['compression'] in ('none','gzip'),'unsupported compression'
        data=gzip.decompress(encoded) if p['compression']=='gzip' else encoded
        assert len(data)==p['decoded']['bytes'] and digest(data)==p['decoded']['sha256']==p['id'],'decoded hash '+p['filename']
        inventory.append(dict(filename=p['filename'],sha256=p['id'],bytes=len(data),permission=p['permission']));count+=len(blocks)
    assert sum('data-forge-payload=' in attrs for attrs,_ in scripts)==count,'undeclared chunks'
    recipe_ids=set()
    for r in m['recipes']:
        assert r['id'] not in recipe_ids,'duplicate recipe';recipe_ids.add(r['id'])
        assert r['schema']=='sfhs.doom-recipe@1' and r['engine']=='chocolate-doom'
        assert r['base'] is None or r['base'] in ids,'missing base'
        assert all(f['payloadId'] in ids and f['mode'] in ('file','merge','deh') for f in r['files']),'missing recipe file'
        assert all(x in ids for x in r.get('documentIds',[])),'missing document'
        assert re.fullmatch('forge-[a-f0-9]{64}',r['saveNamespace']),'save namespace'
    assert m['defaultRecipe'] in recipe_ids
    assert m['capsule']['private'] or all(p['permission']=='redistributable' for p in m['payloads']),'public permissions'
    if m['capsule']['forge']:
        catalogs=[(attrs,body) for attrs,body in scripts if 'id="sfhs-archive-catalog"' in attrs]
        assert len(catalogs)==1,'missing archive catalog'
        attrs,body=catalogs[0]
        catalog=gzip.decompress(base64.b64decode(body,validate=True))
        assert len(catalog)==int(re.search(r'data-decoded-bytes="(\d+)"',attrs)[1]),'catalog byte count'
        assert digest(catalog)==re.search(r'data-sha256="([a-f0-9]{64})"',attrs)[1],'catalog hash'
        assert json.loads(catalog)['schema']=='sfhs.doom-archive-catalog@1','catalog schema'
        template=[body for attrs,body in scripts if 'id="sfhs-forge-template"' in attrs]
        assert len(template)==1,'missing successor source'
        source=base64.b64decode(template[0],validate=True).decode('utf-8')
        assert source.count('<!-- FORGE_ENGINE -->')==1 and source.count('<!-- FORGE_PAYLOADS -->')==1
        assert not re.search(r'<script type="application/octet-stream" data-forge-payload="[a-f0-9]{64}"',source),'carried payload bytes in template'
    else:
        assert not any('id="sfhs-forge-template"' in attrs for attrs,_ in scripts),'player contains editor template'
        assert not any('id="sfhs-forge-import-worker"' in attrs for attrs,_ in scripts),'player contains import worker'
        assert not any('id="sfhs-archive-catalog"' in attrs for attrs,_ in scripts),'player contains archive catalog'
    return dict(status='PASS',artifact=str(path),bytes=len(raw),sha256=digest(raw),recipes=len(m['recipes']),payloads=inventory,forge=m['capsule']['forge'],private=m['capsule']['private'])

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('path',type=Path,nargs='?',default=ROOT/'dist'/'sfhs-doom-forge-v3.html');p.add_argument('--output',type=Path);a=p.parse_args();result=validate(a.path);serialized=json.dumps(result,indent=2);print(serialized)
    if a.output:a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(serialized+'\n',encoding='utf-8')
