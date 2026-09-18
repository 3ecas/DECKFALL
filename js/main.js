'use strict';
// ===================== INPUT & BOOT =====================
function handle(act,t){
  switch(act){
    case 'noop': return;
    case 'new': clearTimeout(UI.timer); UI.modal=null; newGame(); render(); break;
    case 'continue': { const s=loadSave(); if(s){ G=s; UI.busy=false; UI.modal=null; UI.handUids=[]; markSeen(G.p.deck); if(G.phase==='battle'&&(!G.fight||G.fight.over)) nextRound(); else if(G.phase==='interlude'&&G.inter){ if(G.inter.t==='ambush'){ nextRound(); } else { render(); if(G.inter.auto&&!(G.inter.cards&&!G.inter.picked)) UI.timer=setTimeout(nextRound,2500); } } else if(G.phase==='spoils'&&G.spoils){ render(); spoilsMaybeContinue(); } else if(G.phase==='battle'&&G.fight.turn===0){ startPlayerTurn(); } else render(); } else render(); } break;   // a fight is saved before its first turn: start it on load
    case 'title': clearTimeout(UI.timer); G=null; UI.modal=null; render(); break;
    case 'library': clearTimeout(UI.timer); UI.modal=null; UI.screen='library'; if(G) markSeen(G.p.deck); render(); break;
    case 'lib-back': UI.screen=null; render(); break;
    case 'lib-el': case 'lib-type': case 'lib-tier': case 'lib-cost': { const key={'lib-el':'els','lib-type':'types','lib-tier':'tiers','lib-cost':'costs'}[act]; const arr=UI.lib[key]; const v=t.dataset.v; const i=arr.indexOf(v); if(i>=0) arr.splice(i,1); else arr.push(v); render(); } break;
    case 'lib-undisc': UI.lib.undisc=t.dataset.v==='1'; render(); break;
    case 'lib-sort': UI.lib.sort=t.dataset.v; render(); break;
    case 'lib-reset': UI.lib={els:[],types:[],tiers:[],costs:[],q:'',undisc:false,sort:'tier'}; render(); break;
    case 'target': { const i=+t.dataset.i; if(G.fight&&G.fight.enemies[i]&&G.fight.enemies[i].alive){ G.fight.target=i; render(); } } break;
    case 'play': playCard(+t.dataset.i); break;
    case 'end': endTurn(); break;
    case 'spoils-card': spoilsPickCard(t.dataset.id); break;
    case 'spoils-skip': spoilsSkipCard(); break;
    case 'spoils-ult': spoilsPickUlt(t.dataset.id||null); break;
    case 'spoils-next': if(spoilsDone(G.spoils)) spoilsContinue(); break;
    case 'spoils-drop': spoilsTakeDrop(); break;
    case 'spoils-drop-skip': spoilsSkipDrop(); break;
    case 'inter-card': interludePick(t.dataset.id); break;
    case 'inter-skip': interludeSkip(); break;
    case 'inter-next': interludeContinue(); break;
    case 'shop-upgrade': shopUpgrade(t.dataset.id); break;
    case 'shop-leave': nextRound(); break;
    case 'forge-pick': forgePick(); break;
    case 'camp-rest': campChoose('rest'); break;
    case 'camp-tough': campChoose('tough'); break;
    case 'modal': openModal(t.dataset.m); break;
    case 'close': closeModal(); break;
    case 'pick-card': { const m=UI.modal; UI.modal=null; if(m&&m.cb) m.cb(t.dataset.id); else render(); } break;
    case 'pick-ult': { const m=UI.modal; const id=t.dataset.id; if(!G.p.ults.includes(id)) G.p.ults.push(id); G.p.ult=id; UI.modal=null; if(m&&m.cb) m.cb(); else { render(); save(); } } break;
    case 'set-ult': { G.p.ult=t.dataset.id; render(); save(); } break;
    case 'abandon-ask': { UI.modal={type:'menu',confirm:true}; render(); } break;
    case 'abandon': { clearTimeout(UI.timer); recordBest(); clearSave(); G=null; UI.modal=null; render(); } break;
    case 'quit': { clearTimeout(UI.timer); save(); G=null; UI.modal=null; render(); } break;
    case 'sound': { SFX.toggle(); render(); } break;
    case 'passives': { const d=document.querySelector('.slots'); if(d) d.classList.toggle('open'); } break;
  }
}
document.addEventListener('click',e=>{ const t=e.target.closest('[data-act]'); if(!t) return; if(t.tagName==='BUTTON'&&t.disabled) return; if(t.tagName==='BUTTON'&&!['end','ult','sound','bet','double','cashout'].includes(t.dataset.act)) sfx('click'); handle(t.dataset.act,t); });
document.addEventListener('input',e=>{ if(e.target&&e.target.id==='libq'){ UI.lib.q=e.target.value; const g=document.querySelector('.libgrid'); if(g) g.innerHTML=libraryGridHTML(); const c=document.getElementById('libcount'); if(c) c.textContent='· '+libCountText(); } });
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&UI.modal){ closeModal(); return; }
  if(e.key==='Escape'&&UI.screen==='library'){ UI.screen=null; render(); return; }
  if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')) return;
  if(!G||UI.modal) return;
  if(G.phase==='battle'){
    if(e.key>='1'&&e.key<='9') playCard(parseInt(e.key,10)-1);
    else if(e.key==='e'||e.key==='E') endTurn();
  } else if(e.key===' '||e.key==='Enter'){
    if(G.phase==='interlude') interludeContinue();
    else if(G.phase==='spoils'&&spoilsDone(G.spoils)) spoilsContinue();
    e.preventDefault();
  }
});
function afterRender(){
  if(G&&G.phase==='spoils'&&G.spoils&&!G.spoils.counted){ G.spoils.counted=true; document.querySelectorAll('.countup').forEach(el=>FX.countUp(el,parseInt(el.dataset.to,10)||0,800)); }
  else document.querySelectorAll('.countup').forEach(el=>{ el.textContent=el.dataset.to; });
}
function boot(){
  const start=data=>{ try{ if(data&&data.G&&data.G.p){ G=data.G; UI.busy=false; } }catch(err){} render(); };
  try{ const hot=window.claude&&window.claude.hot; if(hot){ if(typeof hot.snapshot==='function') hot.snapshot(()=>({G})); if(typeof hot.ready==='function'){ hot.ready(start); return; } start(hot.data||null); return; } }catch(err){}
  start(null);
}
boot();
