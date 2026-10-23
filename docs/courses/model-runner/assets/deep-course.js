document.querySelectorAll('[data-check]').forEach(box=>{
 box.querySelectorAll('[data-choice]').forEach(button=>button.addEventListener('click',()=>{
  box.querySelectorAll('[data-choice]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
  const ok=button.dataset.choice===box.dataset.correct;
  const feedback=box.querySelector('[data-feedback]');
  feedback.textContent=(ok?'对。':'再想一步。')+(ok?box.dataset.explain:box.dataset.hint);
  feedback.dataset.result=ok?'correct':'incorrect';
 }));
});
const scenarios=[
 {label:'初始：A、B、C 都活跃',old:['A','B','C','—'],rows:['—','C','B','A'],batch:['A','B','C'],mapping:[3,2,1],explain:'设容量为 4，MRV2 的 free_indices 初始为 [0,1,2,3]。按 A、B、C 顺序 add_request()，pop() 得到状态行 3、2、1。左边 MRV1 用连续 batch 行；右边 MRV2 用独立状态槽。这里的 batch 顺序是教学指定的可行顺序，不表示所有 attention 后端都固定使用它。'},
 {label:'B 完成：只回收它的槽',old:['A','C','—','—'],rows:['—','C','—','A'],batch:['A','C'],mapping:[3,1],explain:'MRV1 删除 B 后有空洞；condense() 可把 C 从 batch 行 2 搬到行 1，并维护关联状态。MRV2 remove_request(B) 回收状态行 2，A 仍在 3，C 仍在 1。每轮用于计算的 block table 等输入仍需要 gather。'},
 {label:'本轮顺序变为 C、A',old:['C','A','—','—'],rows:['—','C','—','A'],batch:['C','A'],mapping:[1,3],explain:'本轮顺序变化时，MRV1 的输入 batch 状态随重排维护；MRV2 的持久状态行不因本轮顺序而移动，只令 idx_mapping = [1,3]。所有按持久请求保存的状态，都必须通过正确映射取用。'},
 {label:'D 加入：复用空闲行 2',old:['C','A','D','—'],rows:['—','C','D','A'],batch:['C','A','D'],mapping:[1,3,2],explain:'B 回收后 free_indices 包含行 2，D 加入可复用该行。持久槽没有“永远属于某个 request_id”的承诺：只在该次活跃生命周期内稳定。抢占或显式重建状态后，恢复请求需要重新加入。'}
];
const demo=document.querySelector('[data-slot-demo]');
if(demo){
 const draw=index=>{
  const s=scenarios[index];
  demo.querySelector('[data-old-rows]').innerHTML=s.old.map((r,i)=>`<div class="state-row"><span>batch ${i}</span><strong>${r}</strong></div>`).join('');
  demo.querySelector('[data-new-rows]').innerHTML=s.rows.map((r,i)=>`<div class="state-row"><span>state ${i}</span><strong>${r}</strong></div>`).join('');
  demo.querySelector('[data-map-result]').textContent=`本轮 req_ids = [${s.batch.join(', ')}]\nidx_mapping = [${s.mapping.join(', ')}]\nbatch_idx  →  req_state_idx\n${s.mapping.map((v,i)=>`${i}          →  ${v} (${s.batch[i]})`).join('\n')}`;
  demo.querySelector('[data-demo-explain]').textContent=s.explain;
  demo.querySelectorAll('[data-scenario]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.scenario)===index)));
 };
 demo.querySelectorAll('[data-scenario]').forEach(b=>b.addEventListener('click',()=>draw(Number(b.dataset.scenario))));draw(0);
}
const walk=document.querySelector('[data-input-walk]');
if(walk){
 const stages=[
  ['01 · 选请求并排序','req_ids = [C, A]\nidx_mapping = [1, 3]\nnum_scheduled_tokens = [1, 2]','无投机、decode_query_len=1。C 每轮一个 Decode token，A 本轮处理两个 Prefill token；当前 sort_batch_req_ids 会把 C 放在前面。batch 行 0 访问持久行 1。'],
  ['02 · 拼接本轮 token','query_start_loc = [0, 1, 3]\nC 的区间 [0,1)\nA 的区间 [1,3)','这是每个请求本轮 token 在扁平输入数组中的起止边界。query_start_loc 不是总序列长度；相邻元素之差才是该请求本轮 query token 数。'],
  ['03 · 算 positions 和 seq_lens','num_computed_tokens = [5, 2]  // 按 batch 顺序取出\npositions = [5, 2, 3]\nseq_lens = [6, 4]','对每个请求：position = 已计算 token 数 + 请求内本轮偏移；seq_len = 已计算 token 数 + 本轮 query 长度。positions 是每 token 一项，seq_lens 是每请求一项。'],
  ['04 · 填 input_ids','C: last_sampled_tokens[state 1] = 205\nA: all_token_ids[state 3][2:4] = [103,104]\ninput_ids = [205, 103, 104]','Prefill 的输入来自已有 token 序列；Decode 的本轮输入通常来自上一步设备侧保存的采样结果。本轮将要采样的新 token 此时还不存在。'],
  ['05 · 映射 KV slot 与 logits 行','slot_mapping = [45, 82, 83]\nlogits_indices = [0, 2]\n有效 hidden_states 行数 = 3','在本例的普通 Attention 单组缓存下：slot = block_id × 4 + block 内偏移。C 的 position 5 对应 block 11、偏移 1，即 45；A 的 2、3 对应 block 20，即 82、83。只为每个请求选择末端 hidden state 算常规生成 logits。']
 ];
 const draw=index=>{const s=stages[index];walk.querySelector('[data-walk-title]').textContent=s[0];walk.querySelector('[data-walk-values]').textContent=s[1];walk.querySelector('[data-walk-explain]').textContent=s[2];walk.querySelectorAll('[data-walk-stage]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.walkStage)===index)));};
 walk.querySelectorAll('[data-walk-stage]').forEach(b=>b.addEventListener('click',()=>draw(Number(b.dataset.walkStage))));draw(0);
}
