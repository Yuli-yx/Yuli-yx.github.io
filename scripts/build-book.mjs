import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=path.join(root,'content/book'),out=path.join(root,'docs');
const read=p=>fs.readFileSync(path.join(src,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(out,p),s.replace(/[ \t]+$/gm,''));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const chapters=JSON.parse(read('curriculum.json')),sources=JSON.parse(read('model-sources.json'));
const annotations=JSON.parse(read('annotations.json'));
function annotated(id,code){const a=annotations[id];if(!a)return esc(code);let found=false;const result=code.split('\n').map(line=>{if(Number(line.trim().split(/\s+/)[0])===a.before_line){found=true;return `<span class="code-comment">      # [讲解补充] ${esc(a.text)}</span>\n${esc(line)}`;}return esc(line)}).join('\n');if(!found)throw Error('Annotation line missing: '+id);return result;}
function codeView(id,code){return `<p class="annotation-note">中文注释为本站讲解补充，不属于上游源码；数字仍为原始行号。</p><pre><code>${annotated(id,code)}</code></pre><details class="original-source"><summary>对照原始摘录（无讲解补充）</summary><pre><code>${esc(code)}</code></pre></details>`;}
const first=read('kv-cache.html');
const topicNav=first.match(/<div class="topic-label">[\s\S]*?<\/nav>/)[0].replace('href="kv-cache.html" class="selected-topic"','href="kv-outline.html" class="selected-topic"').replace('<small>第 1 章</small>','<small>已写 3 章</small>');
const community='<p class="community-link"><a href="contributing.html">共建说明：要求、计划与接续方法 →</a></p>';
const brand=first.match(/<a class="brand"[\s\S]*?<\/a>/)[0];
const toc=html=>[...html.matchAll(/<section id="([^"]+)"><h2>(.*?)<\/h2>/g)].map(m=>`<a href="#${m[1]}">${m[2]}</a>`).join('');
function outline(current){return `<details class="book-outline"><summary>本专题大纲 <span>16 章</span></summary><p><a href="kv-outline.html">查看完整目录与模型案例 →</a></p><ol>${chapters.map(c=>`<li><span>${c.id}</span><a href="${c.url||'kv-outline.html#chapter-'+c.id}"${c.id===current?' aria-current="page"':''}>${esc(c.title)}</a><small>${c.id===current?'本章':c.status}</small></li>`).join('')}</ol></details>`;}
function expand(html){return html.replace(/\{\{source:([\w-]+)\}\}/g,(_,id)=>{const s=sources[id];if(!s)throw Error('Missing source '+id);return `<details class="source" id="src-${id}"><summary><span>源码证据</span>${esc(s.title)}<small>${s.repo} · ${s.commit.slice(0,10)} · L${s.start}–${s.end}</small></summary><p><a href="${s.url}" target="_blank" rel="noopener">打开固定提交的完整文件 ↗</a><br><code>${esc(s.path)}</code></p>${codeView(id,s.code)}</details>`});}
function shell(title,id,body,description){const isOutline=id==='outline'||id==='guide';return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(description)}"><title>${esc(title)}｜推理系统源码读本</title><link rel="stylesheet" href="assets/book/styles.css"></head><body><a class="skip" href="#main">跳到正文</a><div id="progress"></div><button id="menu" aria-label="打开目录" aria-expanded="false">☰ 目录</button><aside class="sidebar">${brand}${topicNav}${community}<div class="book-label">KV CACHE 管理 / ${id==='guide'?'共建说明':isOutline?'专题目录':'第 '+id+' 章'}</div><div class="current-chapter"><strong>${esc(title)}</strong></div><nav aria-label="本章目录">${toc(body)}</nav>${outline(id)}</aside><div class="page"><header class="topbar"><span><a href="index.html">专题总览</a> / <a href="kv-outline.html">KV Cache 目录</a></span><button id="reading" aria-pressed="false">宽屏阅读</button></header><main id="main"><div class="eyebrow">${id==='guide'?'CONTRIBUTING / 写作与维护':isOutline?'KV CACHE / CONTENTS':'CHAPTER '+id}<span>源码 · 例子 · 计算过程</span></div><h1>${esc(title)}</h1><p class="dek">${esc(description)}</p>${isOutline?'':`<div class="version"><b>源码基线 / 2026.10.25</b><span>vLLM 2f1041e8dd · Ascend e07bf18b76</span><span>章节更新 / 2026.10.27</span></div>`}${expand(body)}<footer>${id==='02'?'<a href="kv-cache.html">← 第 1 章</a> · <a href="kv-model-path.html">第 3 章：从配置找到实现 →</a>':id==='03'?'<a href="kv-attention.html">← 第 2 章</a> · <a href="kv-outline.html#chapter-04">第 4 章规划 →</a>':'<a href="kv-cache.html">开始阅读第一章 →</a>'}<p><a href="kv-outline.html">KV Cache 完整目录</a> · <a href="THIRD_PARTY_NOTICES.txt">源码归属与许可</a> · <a href="articles.html">原文章索引</a></p></footer></main></div><script src="assets/book/reader.js"></script></body></html>`;}
let revisedFirst=first.replace(/<div class="topic-label">[\s\S]*?<\/nav>/,topicNav).replace(/<details class="book-outline">[\s\S]*?<\/details>/,outline('01'));
revisedFirst=revisedFirst.replace(topicNav,topicNav+community);
const firstSources=JSON.parse(read('sources.json'));
revisedFirst=revisedFirst.replace(/(<details class="source" id="src-([^"]+)">[\s\S]*?)<pre><code>[\s\S]*?<\/code><\/pre><\/details>/g,(_,prefix,id)=>prefix+codeView(id,firstSources[id].code)+'</details>');
write('kv-cache.html',revisedFirst);
write('contributing.html',shell('共建说明：要求、计划与接续方法','guide',read('contributing.html'),'把写作约定、待办章节和维护方法留在仓库中，让后来的贡献者能够接着写。'));
write('kv-attention.html',shell('Attention 结构决定缓存什么','02',read('chapters/02-attention.html'),'从历史 K/V 到压缩表示和递归状态，逐项说明缓存内容与容量公式为什么会变化。'));
write('kv-model-path.html',shell('从模型配置找到真实实现','03',read('chapters/03-model-path.html'),'沿 checkpoint、模型注册、层类型和 cache spec，找到当前平台真正使用的缓存实现。'));
let body='<div class="intro"><p>先学习共同对象和管理机制，再分别拆解真实模型，最后按同一请求和统计口径对照。已编写的 3 章可以直接阅读；其余 13 章列出了范围，正文尚待编写。</p><p>模型案例包括普通 GQA、Qwen3.5/3.6、Kimi K3、DeepSeek V4、GLM-5.3 和 GLM-5.3-Flash。每个案例都将固定 checkpoint 与源码版本，分别记录缓存内容、spec、tensor 布局及请求生命周期。</p></div>';
for(const [i,part] of [...new Set(chapters.map(c=>c.part))].entries()){body+=`<section id="part-${i+1}"><h2>${i+1}. ${part}</h2>`;for(const c of chapters.filter(c=>c.part===part)){body+=`<article class="chapter-entry" id="chapter-${c.id}"><div class="topic-heading"><span class="section-number">第 ${c.id} 章</span><span class="topic-status">${c.status}</span></div><h3>${c.url?`<a href="${c.url}">${esc(c.title)} →</a>`:esc(c.title)}</h3><p>${esc(c.scope)}</p></article>`;}body+='</section>';}
body+='<section id="case-method"><h2>5. 每个模型案例怎样展开？</h2><ol><li>列明 checkpoint、配置、两仓提交、dtype 与并行前提。</li><li>画出与缓存有关的层和组件，说明各自保存什么。</li><li>逐项记录 shape、dtype、产生者、消费者和更新时点。</li><li>从模块 spec 追到 backend 定制、cache group 和物理 view。</li><li>按元素、字节、block 与层数计算容量，区分三种统计口径。</li><li>跟踪 prefill、decode、恢复和结束时的状态变化。</li><li>说明该模型的边界条件，再与前一案例比较。</li></ol><p>KV Cache 专题负责说明模型保存什么、怎样管理；PCP/DCP、P/D 和 KV Pool 专题再解释这些对象如何分布、传输和共享。</p></section>';
write('kv-outline.html',shell('KV Cache 管理：章节与模型案例','outline',body,'16 章，按共同机制、真实模型和横向对照组织。'));
let home=read('index.html').replaceAll('href="kv-cache.html" >KV Cache 管理<small>第 1 章</small>','href="kv-outline.html" >KV Cache 管理<small>已写 3 章</small>').replace('已更新 · 第 1 章','已更新 · 第 1–3 章').replace('已完成第一章；本专题的 13 章大纲见正文左侧目录。','已编写第 1–3 章。后续按 Qwen3.5/3.6、Kimi K3、DSV4、GLM-5.3 和 GLM-5.3-Flash 等模型展开。<a href="kv-outline.html">查看 16 章目录 →</a>');
home=home.replace('</nav>','</nav>'+community);
write('index.html',home);
fs.mkdirSync(path.join(out,'assets/book'),{recursive:true});
for(const file of ['styles.css','app.js','reader.js','sources.json','model-sources.json','curriculum.json','annotations.json'])fs.copyFileSync(path.join(src,file),path.join(out,'assets/book',file));
console.log('Built KV cache curriculum: 16 chapters, 3 readable chapters, pinned source excerpts.');
