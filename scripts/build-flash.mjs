import fs from 'node:fs';
import path from 'node:path';
export function buildFlash({root,head,foot,write,esc}){
 const sources=JSON.parse(fs.readFileSync(path.join(root,'content/flash-sources.json'),'utf8'));
 const chapters=[['flash-model','模型与本地 Cache','先认清哪些内容必须恢复，再讨论怎么跨节点共享。'],['flash-pool','池化对象与逐层传输','从本地 rank 的缓存，走向按内容和兼容布局寻址的共享对象。'],['flash-pd','PD 交接与生命周期','用一个 800-token 请求，把控制、数据和完成通知连成闭环。']];
 for(const [slug,title,lead] of chapters){
  let article=fs.readFileSync(path.join(root,`content/${slug}.html`),'utf8');
  const toc=[...article.matchAll(/<section id="([^"]+)"><h2>([^<]+)<\/h2>/g)];
  article=article.replace(/\{\{source:([\w-]+)\}\}/g,(_,id)=>{const s=sources.entries[id];if(!s)throw Error('Missing Flash source '+id);return `<details class="code-source"><summary>展开源码 · ${esc(s.file)}:${s.start}–${s.end}</summary><pre><code>${esc(s.code)}</code></pre><div class="source-meta">${s.repo} @ ${s.commit.slice(0,12)} · <a href="${s.url}">固定版本源码 ↗</a></div></details>`;});
  article=article.replaceAll('<table>','<div class="table-scroll"><table>').replaceAll('</table>','</table></div>');
  const nav=`<nav class="flash-chapters" aria-label="专题章节">${chapters.map(([s,t],i)=>`<a ${s===slug?'aria-current="page"':''} href="${s}.html"><small>第 ${i+1} 篇</small>${t}</a>`).join('')}</nav>`;
  const header=head('GLM-5.3-Flash · '+title,'../').replace('</head>','<link rel="stylesheet" href="../assets/flash.css"><script src="../assets/flash.js" defer></script></head>');
  write(`notes/${slug}.html`,header+`<div class="layout"><aside class="toc" aria-label="文章目录"><strong>本篇目录</strong>${toc.map(m=>`<a href="#${m[1]}">${m[2]}</a>`).join('')}<a href="../index.html">← 专题总览</a></aside><main class="doc flash"><div class="kicker">适配实录 / GLM-5.3-FLASH × ASCEND STORE</div><h1>${title}</h1><p class="lead">${lead}</p>${nav}<div class="flash-version"><b>可评审实现，不等于生产支持</b><p>源码：Ascend <code>${sources.commits.ascend.slice(0,12)}</code>；上游 StoreLayout <code>${sources.commits.upstream.slice(0,12)}</code>。核对日期 ${sources.checked}。<a href="https://github.com/vllm-project/vllm-ascend/pull/21000">Draft PR #21000 ↗</a></p><p>范围：Flash BF16、同构 TP8/EP8、MRV2 eager、PP=PCP=DCP=1、P/D 相同 MTP 数。旧同步实现已有模型实验；新异步写入已过 261 项远端 CPU 回归，尚未完成新一轮 NPU 模型与性能验收。</p></div>${article}${nav}</main></div>`+foot('../'));
 }
}
