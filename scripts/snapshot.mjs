import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const workspace=process.argv[2];if(!workspace)throw Error('Usage: node scripts/snapshot.mjs <workspace>');
const defs={
'engine-order':['vllm','vllm/v1/engine/core.py',154,184],
'register':['vllm','vllm/model_executor/layers/attention/attention.py',438,449],
'layer-spec':['vllm','vllm/model_executor/layers/attention/attention.py',669,679],
'page':['vllm','vllm/v1/kv_cache_interface.py',544,561],
'collect':['vllm','vllm/v1/worker/gpu/attn_utils.py',139,155],
'groups':['vllm','vllm/v1/worker/gpu/attn_utils.py',235,266],
'coordinator':['vllm','vllm/v1/core/kv_cache_coordinator.py',157,173],
'uniform-group':['vllm','vllm/v1/core/kv_cache_planning.py',186,214],
'capacity':['vllm','vllm/v1/core/kv_cache_planning.py',632,640],
'descriptor':['vllm','vllm/v1/kv_cache_interface.py',1408,1430],
'allocate':['vllm','vllm/v1/worker/utils.py',564,602],
'views':['vllm','vllm/v1/kv_cache_interface.py',422,449],
'pool':['vllm','vllm/v1/core/block_pool.py',166,188],
'pool-free':['vllm','vllm/v1/core/block_pool.py',776,807],
'slots':['vllm','vllm/v1/worker/gpu/block_table.py',339,352],
'metadata':['vllm','vllm/v1/worker/gpu/attn_utils.py',570,594],
'ascend-patch':['vllm-ascend','vllm_ascend/patch/worker/patch_v2/patch_attn_utils.py',23,35],
'ascend-allocate':['vllm-ascend','vllm_ascend/worker/v2/attn_utils.py',1337,1362],
'executor':['vllm','vllm/v1/executor/abstract.py',156,160],
'get-layers':['vllm','vllm/config/vllm.py',3571,3593],
'memory':['vllm','vllm/v1/worker/gpu_worker.py',638,638],
'planning':['vllm','vllm/v1/core/kv_cache_planning.py',1481,1481],
};const revisions=Object.fromEntries(['vllm','vllm-ascend'].map(repo=>[repo,execFileSync('git',['-C',path.join(workspace,repo),'rev-parse','HEAD'],{encoding:'utf8'}).trim()]));
const entries={};for(const [id,[repo,file,start,end]] of Object.entries(defs)){const p=path.join(workspace,repo,file);const bytes=fs.readFileSync(p),lines=bytes.toString('utf8').split(/\r?\n/);const baseline=execFileSync('git',['-C',path.join(workspace,repo),'show',`${revisions[repo]}:${file}`],{encoding:'utf8',maxBuffer:8*1024*1024});if(baseline.replaceAll('\r\n','\n')!==bytes.toString('utf8').replaceAll('\r\n','\n'))throw Error('Uncommitted source differs: '+file);entries[id]={repo,file,start,end,commit:revisions[repo],sha256:createHash('sha256').update(bytes).digest('hex'),url:`https://github.com/Yuli-yx/${repo}/blob/${revisions[repo]}/${file}#L${start}-L${end}`,code:lines.slice(start-1,end).map((l,i)=>`${String(start+i).padStart(4)}  ${l}`).join('\n')};}fs.writeFileSync(path.join(root,'content','sources.json'),JSON.stringify({capturedAt:'2026-10-23',revisions,entries},null,2)+'\n');console.log(`Captured ${Object.keys(entries).length} source excerpts; selected files match commits.`);
