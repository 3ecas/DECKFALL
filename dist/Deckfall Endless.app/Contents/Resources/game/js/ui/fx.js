'use strict';
// ===================== VISUAL EFFECTS: particles, ambient embers, card flights, banners =====================
const FX=(()=>{
  const cv=document.getElementById('bg'); const ctx=cv?cv.getContext('2d'):null; let W=0,H=0; const parts=[]; const ambient=[];
  const reduced=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize(){ if(!cv) return; W=cv.width=innerWidth; H=cv.height=innerHeight; }
  addEventListener('resize',resize); resize();
  for(let i=0;i<46;i++) ambient.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*2+0.6,s:Math.random()*0.35+0.08,a:Math.random()*0.5+0.15,c:['#f2c069','#5de0d2','#9d8bff','#ff7b3d'][i%4],ph:Math.random()*6});
  function burst(x,y,color,n,opts){ if(reduced) return; for(let i=0;i<(n||18);i++){ const a=Math.random()*Math.PI*2, sp=((opts&&opts.speed)||1)*(2+Math.random()*4); parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,life:1,decay:0.02+Math.random()*0.03,r:2+Math.random()*3,c:color,g:0.15}); } }
  function loop(){ if(!ctx) return; ctx.clearRect(0,0,W,H);
    for(const p of ambient){ p.y-=p.s; if(p.y<-5){ p.y=H+5; p.x=Math.random()*W; } ctx.globalAlpha=p.a*(0.55+0.45*Math.sin(Date.now()/900+p.ph)); ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }
    for(let i=parts.length-1;i>=0;i--){ const p=parts[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.life-=p.decay; if(p.life<=0){ parts.splice(i,1); continue; } ctx.globalAlpha=p.life; ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*p.life,0,Math.PI*2); ctx.fill(); }
    ctx.globalAlpha=1; requestAnimationFrame(loop); }
  if(!reduced) requestAnimationFrame(loop); else if(ctx){ ctx.clearRect(0,0,W,H); }
  const q=s=>document.querySelector(s); const layer=()=>document.getElementById('fx');
  function enemyNode(e){ return q(`.enemy[data-uid="${e.uid}"]`); }
  function enemyRect(e){ const n=enemyNode(e); return n?n.getBoundingClientRect():null; }
  function pulse(n,cls){ if(!n) return; n.classList.remove(cls); void n.offsetWidth; n.classList.add(cls); }
  function hit(e,el){ const r=enemyRect(e); if(!r) return; burst(r.left+r.width/2,r.top+r.height*0.4,(EL[el]||EL.phys).c,16); pulse(enemyNode(e),'hit'); }
  function playerHit(){ pulse(q('.player'),'hit'); pulse(q('#app'),'hurt'); }
  function lunge(e){ pulse(enemyNode(e),'lunge'); }
  function death(e){ const n=enemyNode(e); if(!n) return; n.classList.add('dying'); const r=n.getBoundingClientRect(); burst(r.left+r.width/2,r.top+r.height/2,'#ffffff',30,{speed:1.6}); }
  function playCard(idx,target){
    const c=q(`.hand .card[data-i="${idx}"]`); if(!c) return; const r=c.getBoundingClientRect();
    const ghost=c.cloneNode(true); ghost.classList.add('ghost'); ghost.style.left=r.left+'px'; ghost.style.top=r.top+'px'; ghost.style.width=r.width+'px'; ghost.style.height=r.height+'px'; layer().appendChild(ghost);
    let tx=innerWidth/2-r.width/2, ty=innerHeight*0.3; const tr=target?enemyRect(target):null; if(tr){ tx=tr.left+tr.width/2-r.width/2; ty=tr.top+tr.height/2-r.height/2; }
    const a=ghost.animate([{transform:'translate(0,0) scale(1) rotate(0deg)',opacity:1},{transform:`translate(${tx-r.left}px,${ty-r.top}px) scale(0.55) rotate(${tr?-8:0}deg)`,opacity:0.1}],{duration:reduced?1:330,easing:'cubic-bezier(.2,.7,.3,1)'});
    a.onfinish=()=>ghost.remove(); c.style.visibility='hidden';
  }
  function banner(text,cls){ const l=layer(); if(!l) return; const d=document.createElement('div'); d.className='banner '+(cls||''); d.textContent=text; l.appendChild(d); setTimeout(()=>d.remove(),1700); }
  function flash(cls){ const l=layer(); if(!l) return; const d=document.createElement('div'); d.className='flash '+(cls||''); l.appendChild(d); setTimeout(()=>d.remove(),800); }
  function countUp(el,to,ms){ if(!el) return; const from=parseInt(el.textContent,10)||0; const t0=performance.now(); const step=t=>{ const k=Math.min(1,(t-t0)/(ms||600)); el.textContent=Math.round(from+(to-from)*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
  return {burst,hit,playerHit,lunge,death,playCard,banner,flash,enemyRect,countUp,reduced};
})();
function banner(t,c){ FX.banner(t,c); }
