import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const [ascend, upstream] = process.argv.slice(2);
if (!ascend || !upstream) throw Error('Usage: node scripts/snapshot-flash.mjs <ascend checkout> <upstream StoreLayout checkout>');
const roots = {ascend, upstream};
const commits = Object.fromEntries(Object.entries(roots).map(([k, cwd]) => [k, execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim()]));
const a='vllm_ascend/';
const pool=a+'distributed/kv_transfer/kv_pool/ascend_store/';
const pd=a+'distributed/kv_transfer/kv_p2p/pd_pool/';
const definitions=[
 ['layer-choice','ascend',a+'models/glm5next/model.py','        is_kda_layer = not is_mtp_layer',30],
 ['ring-capacity','ascend',a+'models/glm5next/kv_cache.py','def get_kpool_tail_ring_capacity',17],
 ['compressed-slot','ascend',a+'models/glm5next/kv_cache.py','def format_indexer_kpool_slot_mapping',23],
 ['ring-view','ascend',a+'models/glm5next/cache_views.py','def view_kpool_tail_cache',27],
 ['kda-shape','ascend',a+'models/glm5next/kda.py','    def get_state_shape(',21],
 ['kda-commit','ascend',a+'models/glm5next/kda.py','            if self.use_recoverssm:',19],
 ['old-key','ascend',pool+'metadata.py','    def to_string(self):',13],
 ['upstream-shard','upstream','vllm/distributed/kv_transfer/kv_connector/v1/mooncake/store/layout.py','class TPShardedStoreLayout',35],
 ['shared-key','ascend',pool+'shared_layout.py','    def key(self, shard:',13],
 ['shared-ranges','ascend',pool+'shared_layout.py','    def objects(',24],
 ['tail-key','ascend',pool+'shared_layout.py','    def partial_objects(',34],
 ['lookup','ascend',pool+'shared_transfer.py','    def lookup(self, token_len, hashes):',24],
 ['queue-submit','ascend',pool+'shared_transfer.py','    def save_layer(self, owner, extra_sessions=()):',32],
 ['queue-copy','ascend',pool+'layerwise/kv_transfer.py','        if isinstance(request, StoreLayerTask):',14],
 ['drain','ascend',pool+'kv_transfer.py','    def drain(self) -> None:',22],
 ['publish','ascend',pool+'shared_io.py','    def finish(self, session:',22],
 ['pd-match','ascend',pd+'scheduler.py','    def get_num_new_matched_tokens(',21],
 ['pd-handoff','ascend',pd+'scheduler.py','    def request_finished(',26],
 ['pd-load','ascend',pd+'worker.py','    def start_load(self, metadata):',25],
 ['state-snapshot','ascend',pool+'shared_layout.py','    def snapshot(self, block_id, digest, cache_tokens):',10],
 ['pin','ascend',pool+'pool_scheduler.py','    def touch_sending_mamba_blocks',30],
 ['draft','ascend',a+'worker/v2/attn_utils.py','    # Ascend reconstructs several specs above',8],
];
const entries={};
for(const [id,repo,file,needle,count] of definitions){
 const raw=fs.readFileSync(path.join(roots[repo],file),'utf8');
 const committed=execFileSync('git',['show',`${commits[repo]}:${file}`],{cwd:roots[repo],encoding:'utf8'});
 if(raw.replaceAll('\r\n','\n')!==committed.replaceAll('\r\n','\n'))throw Error('Uncommitted source '+file);
 const lines=raw.split(/\r?\n/),i=lines.findIndex(x=>x.includes(needle));if(i<0)throw Error('Missing '+id);
 const end=Math.min(i+count,lines.length),slug=repo==='ascend'?'Yuli-yx/vllm-ascend':'vllm-project/vllm';
 entries[id]={repo,file,commit:commits[repo],start:i+1,end,sha256:crypto.createHash('sha256').update(raw).digest('hex'),url:`https://github.com/${slug}/blob/${commits[repo]}/${file}#L${i+1}-L${end}`,code:lines.slice(i,end).join('\n')};
}
fs.writeFileSync(new URL('../content/flash-sources.json',import.meta.url),JSON.stringify({checked:'2026-11-05',commits,entries},null,2)+'\n');
console.log(`Pinned ${Object.keys(entries).length} Flash source excerpts.`);
