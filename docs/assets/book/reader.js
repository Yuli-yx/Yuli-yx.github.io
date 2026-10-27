const $=s=>document.querySelector(s);
const menu=$('#menu'),sidebar=$('.sidebar');
menu.onclick=()=>{const open=sidebar.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'关闭目录':'☰ 目录'};
sidebar.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{sidebar.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='☰ 目录'}));
$('#reading').onclick=()=>{const wide=document.body.classList.toggle('wide');$('#reading').setAttribute('aria-pressed',String(wide));$('#reading').textContent=wide?'标准阅读':'宽屏阅读'};
const sections=[...document.querySelectorAll('main section')],links=[...document.querySelectorAll('nav[aria-label="本章目录"] a')];
function update(){const max=document.documentElement.scrollHeight-innerHeight;$('#progress').style.width=(max>0?Math.min(100,scrollY/max*100):0)+'%';let current=sections[0];for(const s of sections){if(s.getBoundingClientRect().top<160)current=s}for(const a of links){const active=current&&a.hash==='#'+current.id;a.classList.toggle('active',Boolean(active));if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')}}
addEventListener('scroll',update,{passive:true});addEventListener('resize',update);update();
function reveal(){const el=document.getElementById(location.hash.slice(1));if(el?.matches('details.source')){el.open=true;el.scrollIntoView({block:'start'})}}addEventListener('hashchange',reveal);reveal();
