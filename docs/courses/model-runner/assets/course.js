const flows = [
 {title:'Scheduler：这轮算谁、算多少', text:'Scheduler 选择请求，决定每个请求本轮的 token 数和 KV block 分配，并把 connector 的本轮工作元数据放进 SchedulerOutput。它是执行计划；metadata 不是 KV 张量本身。', path:'vllm/vllm/v1/engine/core.py:600 · vllm/vllm/v1/core/sched/scheduler.py:1464'},
 {title:'Executor / Worker：把计划送到执行进程', text:'Executor 把工作分发给执行端，Worker 管理设备并选择 runner。普通生成模型走 MRV2 分支时，GPU Worker 构造 gpu/model_runner.py，Ascend Worker 构造 worker/v2/model_runner.py。图中合并画出这两层，实际跨进程细节后续展开。', path:'vllm/vllm/v1/worker/gpu_worker.py:466 · vllm-ascend/vllm_ascend/worker/worker.py:514'},
 {title:'MRV2：把计划组织成模型执行', text:'更新请求状态和 block tables，准备 input_ids、positions、slot mappings 与 attention metadata，安排前向或图执行。常规生成路径把执行结果暂存在 ExecuteModelState，供后续 sample_tokens 使用。', path:'vllm/vllm/v1/worker/gpu/model_runner.py:1563 · :1872 · :1896'},
 {title:'Model / Attention：真正计算', text:'模型层执行投影、Attention、MLP 等计算。Attention 根据 block table 与 slot mapping 读写已经分配好的 KV cache。MRV2 的 KV connector 适配层在前向附近协调传输；具体怎么搬 KV，由所选 connector 的 worker 实现。', path:'vllm/vllm/v1/worker/gpu/model_runner.py:1803 · vllm/vllm/v1/worker/gpu/kv_connector.py:60'},
 {title:'回报 Scheduler：进入下一轮', text:'常规生成路径经过 sample_tokens 生成输出，收集 KV connector 完成信息；EngineCore 再调用 update_from_output。Scheduler 据此更新请求，接下来的轮次才决定继续算谁。执行可能异步，函数返回与设备工作完成要分开看。', path:'vllm/vllm/v1/worker/gpu/model_runner.py:2054 · vllm/vllm/v1/engine/core.py:614'}
];
document.querySelectorAll('[data-flow]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-flow]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
 const item=flows[Number(button.dataset.flow)];
 document.querySelector('#flow-title').textContent=item.title;
 document.querySelector('#flow-text').textContent=item.text;
 document.querySelector('#flow-path').textContent=item.path;
}));
const quizData={
 q1:{answer:'B',correct:'对。先核对 Worker 的选择分支和实际 runner 类，才能确定这次执行走的是哪条实现。仅看路径包含 v1 无法判断 MRV1/MRV2。',incorrect:'先看“谁实例化了 runner”。v1 是引擎目录；MRV2 也在这个目录下。日志只能作为实际实例化情况的补充证据。'},
 q2:{answer:'C',correct:'对。metadata 是本轮协调工作的描述，KV cache 是设备中的实际缓存张量。要继续追 connector worker 的加载/传输路径。',incorrect:'区分控制信息和数据。SchedulerOutput 的 metadata 能描述块和请求，但它不是模型产生的 KV 张量。'},
 q3:{answer:'A',correct:'对。当前快照的零 token 分支调用 no_forward()，仍可驱动 connector 并收集回报。必须继续跟到 Scheduler 消费回报。',incorrect:'零 token 只表示本轮不需要模型前向。看 execute_model 的零 token 分支：它仍调用 kv_connector.no_forward()。'}
};
const attempts={};
document.querySelectorAll('[data-quiz]').forEach(quiz=>{
 const data=quizData[quiz.dataset.quiz];
 quiz.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{
  const id=quiz.dataset.quiz;const ok=button.dataset.answer===data.answer;
  attempts[id]??={first:ok,current:ok};attempts[id].current=ok;
  quiz.querySelectorAll('[data-answer]').forEach(other=>{other.classList.toggle('selected',other===button);other.setAttribute('aria-pressed',String(other===button));});
  const feedback=quiz.querySelector('.feedback');feedback.dataset.result=ok?'correct':'incorrect';feedback.textContent=ok?data.correct:data.incorrect;
  const values=Object.values(attempts);document.querySelector('#score').textContent=`已作答 ${values.length}/3 · 首次答对 ${values.filter(a=>a.first).length}/3 · 当前答对 ${values.filter(a=>a.current).length}/3`;
 }));
});
document.querySelector('#make-summary')?.addEventListener('click',()=>{
 const values=Object.values(attempts);
 const text=`MRV2 第一课反馈\n已作答：${values.length}/3；首次答对：${values.filter(a=>a.first).length}/3；当前答对：${values.filter(a=>a.current).length}/3。\n我的复述：${document.querySelector('#recall').value.trim()||'尚未填写'}\n我的问题：${document.querySelector('#questions').value.trim()||'暂无'}`;
 const output=document.querySelector('#summary');output.hidden=false;output.textContent=text;
});
