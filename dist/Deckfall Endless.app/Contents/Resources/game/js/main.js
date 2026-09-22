'use strict';
// ===================== INPUT & BOOT =====================
function handle(act,t){
  switch(act){
    case 'noop': return;
    case 'new': clearTimeout(UI.timer); UI.modal=null; newGame(); render(); break;
    case 'continue': { const s=loadSave(); if(s){ G=s; UI.busy=false; UI.modal=null; UI.handUids=[]; UI.uid=Math.max(UI.uid,(G.uid||0)+1); markSeen(G.p.deck); if(G.phase==='battle'&&(!G.fight||G.fight.over)) nextRound(); else if(G.phase==='interlude'&&G.inter){ if(G.inter.t==='ambush'){ nextRound(); } else { render(); if(G.inter.auto&&!(G.inter.cards&&!G.inter.picked)) UI.timer=setTimeout(nextRound,2500); } } else if(G.phase==='spoils'&&G.spoils){ render(); spoilsMaybeContinue(); } else if(G.phase==='battle'&&G.fight.turn===0){ startPlayerTurn(); } else render(); } else render(); } break;   // a fight is saved before its first turn: start it on load
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
    case 'spoils-next': if(spoilsDone(G.spoils)) spoilsContinue(); break;
    case 'spoils-drop': spoilsTakeDrop(); break;
    case 'spoils-drop-skip': spoilsSkipDrop(); break;
    case 'inter-card': interludePick(t.dataset.id); break;
    case 'inter-skip': interludeSkip(); break;
    case 'inter-next': interludeContinue(); break;
    case 'shop-pick': shopPick(t.dataset.id); break;
    case 'shop-confirm': case 'shop-upgrade': shopUpgrade(t.dataset.id); break;
    case 'shop-back': shopBack(); break;
    case 'shop-leave': if(G.keeper){ G.shop=null; G.phase='keeper'; render(); save(); } else nextRound(); break;
    case 'enter': descentEnter(); break;
    case 'keeper-rest': keeperRest(); break;
    case 'keeper-smith': keeperSmith(); break;
    case 'keeper-buy': keeperBuy(t.dataset.id); break;
    case 'keeper-remove': keeperRemove(); break;
    case 'keeper-pack': case 'deck': UI.modal=null; UI.screen='deck'; render(); break;
    case 'deck-back': case 'pack-back': UI.screen=null; render(); break;
    case 'deck-out': if(dkCanSwap()) stashCard(t.dataset.id); break;
    case 'deck-in': if(dkCanSwap()) unstashCard(t.dataset.id); break;
    case 'dk-el': case 'dk-type': case 'dk-tier': case 'dk-cost': case 'dk-fx': { const key={'dk-el':'els','dk-type':'types','dk-tier':'tiers','dk-cost':'costs','dk-fx':'fx'}[act]; const arr=dkState()[key]; const v=t.dataset.v; const i=arr.indexOf(v); if(i>=0) arr.splice(i,1); else arr.push(v); render(); } break;
    case 'dk-sort': dkState().sort=t.dataset.v; render(); break;
    case 'dk-reset': UI.dk=null; render(); break;
    case 'keeper-descend': keeperDescend(); break;
    case 'event-choice': eventChoose(+t.dataset.i); break;
    case 'forge-pick': forgePick(); break;
    case 'forge-confirm': forgeConfirm(); break;
    case 'forge-back': forgeBack(); break;
    case 'camp-rest': campChoose('rest'); break;
    case 'camp-tough': campChoose('tough'); break;
    case 'modal': openModal(t.dataset.m); break;
    case 'close': closeModal(); break;
    case 'pick-card': { const m=UI.modal; UI.modal=null; if(m&&m.cb) m.cb(t.dataset.id); else render(); } break;
    case 'abandon-ask': { UI.modal={type:'menu',confirm:true}; render(); } break;
    case 'abandon': { clearTimeout(UI.timer); recordBest(); clearSave(); G=null; UI.modal=null; render(); } break;
    case 'quit': { clearTimeout(UI.timer); save(); G=null; UI.modal=null; render(); } break;
    case 'sound': { SFX.toggle(); render(); } break;
    case 'passives': { const d=document.querySelector('.slots'); if(d) d.classList.toggle('open'); } break;
  }
}
document.addEventListener('click',e=>{ const t=e.target.closest('[data-act]'); if(!t) return; if(t.tagName==='BUTTON'&&t.disabled) return; if(t.tagName==='BUTTON'&&!['end','ult','sound','bet','double','cashout'].includes(t.dataset.act)) sfx('click'); handle(t.dataset.act,t); });
document.addEventListener('input',e=>{ if(e.target&&e.target.id==='dkq'){ dkState().q=e.target.value; const g=document.querySelector('.dkall'); if(g) g.innerHTML=dkGridHTML(); return; } if(e.target&&e.target.id==='libq'){ UI.lib.q=e.target.value; const g=document.querySelector('.libgrid'); if(g) g.innerHTML=libraryGridHTML(); const c=document.getElementById('libcount'); if(c) c.textContent='· '+libCountText(); } });
// ---- keyboard focus for everything outside a fight: menus, spoils, road events, merchant, pick windows ----
function kbFoes(){ const F=G&&G.fight; if(!F) return; const t=F.enemies[F.target]; document.querySelectorAll('.card.enemy').forEach(c=>c.classList.toggle('kbf',UI.kbRow==='foes'&&!!t&&c.dataset.uid===String(t.uid))); }
function kbTargets(){ const root=document.querySelector('.modal .box')||document.getElementById('app'); if(!root) return []; return [...root.querySelectorAll('[data-act]')].filter(el=>!el.closest('.hud')&&!el.classList.contains('hex')&&!el.closest('.log')&&!el.disabled&&el.offsetParent!==null&&!el.classList.contains('modal')&&!['noop','close'].includes(el.dataset.act)); }
function kbKey(){ return `${G?G.phase:'title'}:${UI.modal?UI.modal.type:''}:${UI.screen||''}`; }
function kbApply(){ const els=kbTargets(); document.querySelectorAll('.kbf').forEach(x=>x.classList.remove('kbf')); if(UI.kbi==null||!els.length) return; if(UI.kbi>=els.length) UI.kbi=els.length-1; const el=els[UI.kbi]; el.classList.add('kbf'); try{ el.scrollIntoView({block:'nearest',inline:'nearest'}); }catch(err){} }
function kbMove(dir){
  const els=kbTargets(); if(!els.length) return; let i=UI.kbi; if(i==null||i>=els.length){ UI.kbi=0; kbApply(); return; }
  const cur=els[i].getBoundingClientRect(); const cx=(cur.left+cur.right)/2, cy=(cur.top+cur.bottom)/2; let best=-1, bd=Infinity;
  els.forEach((el,j)=>{ if(j===i) return; const r=el.getBoundingClientRect(); const dx=(r.left+r.right)/2-cx, dy=(r.top+r.bottom)/2-cy; const row=Math.abs(dy)<Math.max(40,cur.height*0.6); let ok=false, d=0;
    if(dir==='d'){ ok=dx>8&&row; d=dx+Math.abs(dy)*2; } else if(dir==='a'){ ok=dx<-8&&row; d=-dx+Math.abs(dy)*2; } else if(dir==='s'){ ok=dy>8; d=dy+Math.abs(dx)*0.5; } else { ok=dy<-8; d=-dy+Math.abs(dx)*0.5; }
    if(ok&&d<bd){ bd=d; best=j; } });
  if(best<0) best=(dir==='d'||dir==='s')?(i+1)%els.length:(i-1+els.length)%els.length;
  UI.kbi=best; kbApply();
}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&UI.modal){ closeModal(); return; }
  if(e.key==='Escape'&&UI.screen){ UI.screen=null; render(); return; }
  if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')) return;
  const isSpace=e.key===' '||e.key==='Spacebar'||e.code==='Space'; const k=e.key.toLowerCase();
  if(UI.screen) return;
  if(G&&G.phase==='battle'&&!UI.modal){
    const F=G.fight; const n=F&&F.hand?F.hand.length:0; const alive=F.enemies.map((x,i)=>x.alive?i:-1).filter(i=>i>=0);
    if(e.key>='1'&&e.key<='9') playCard(parseInt(e.key,10)-1);
    else if(k==='w'||e.key==='ArrowUp'){ e.preventDefault(); if(UI.kbRow!=='foes'&&alive.length){ UI.kbRow='foes'; if(!F.enemies[F.target]||!F.enemies[F.target].alive) F.target=alive[0]; kbFoes(); } }   // up to the enemies: pick who to strike
    else if(k==='s'||e.key==='ArrowDown'){ e.preventDefault(); if(UI.kbRow==='foes'){ UI.kbRow='hand'; kbFoes(); } }   // back down to the hand
    else if(k==='a'||k==='d'||e.key==='ArrowLeft'||e.key==='ArrowRight'){ e.preventDefault(); const dir=(k==='a'||e.key==='ArrowLeft')?-1:1;
      if(UI.kbRow==='foes'){ if(!alive.length) return; const pos=Math.max(0,alive.indexOf(F.target)); F.target=alive[(pos+dir+alive.length)%alive.length]; render(); kbFoes(); }
      else { if(!n) return; UI.sel=UI.sel==null?(dir<0?n-1:0):(UI.sel+dir+n)%n; document.querySelectorAll('.hand .card').forEach((c,i)=>c.classList.toggle('sel',i===UI.sel)); } }
    else if(isSpace||e.key==='Enter'){ e.preventDefault(); if(UI.kbRow==='foes'){ UI.kbRow='hand'; kbFoes(); return; } if(UI.sel!=null&&UI.sel<n) playCard(UI.sel); }
    else if(e.key==='Tab'){ e.preventDefault(); endTurn(); }
    else if(k==='e'){ const d=document.querySelector('.slots'); if(d) d.classList.toggle('open'); }
    return;
  }
  const dirs={a:'a',d:'d',w:'w',s:'s',arrowleft:'a',arrowright:'d',arrowup:'w',arrowdown:'s'};
  if(dirs[k]){ e.preventDefault(); kbMove(dirs[k]); return; }
  if(isSpace||e.key==='Enter'){ e.preventDefault(); const els=kbTargets(); if(UI.kbi!=null&&els[UI.kbi]){ els[UI.kbi].click(); return; } if(!G) return; if(G.phase==='interlude') interludeContinue(); else if(G.phase==='spoils'&&spoilsDone(G.spoils)) spoilsContinue(); else if(G.phase==='descent') descentEnter(); }
});
function afterRender(){
  { const key=kbKey(); if(UI.kbKey!==key){ UI.kbKey=key; UI.kbi=null; } kbApply(); }
  if(G&&G.phase==='spoils'&&G.spoils&&!G.spoils.counted){ G.spoils.counted=true; document.querySelectorAll('.countup').forEach(el=>FX.countUp(el,parseInt(el.dataset.to,10)||0,800)); }
  else document.querySelectorAll('.countup').forEach(el=>{ el.textContent=el.dataset.to; });
}
function boot(){
  const start=data=>{ try{ if(data&&data.G&&data.G.p){ G=data.G; UI.busy=false; } }catch(err){} render(); };
  try{ const hot=window.claude&&window.claude.hot; if(hot){ if(typeof hot.snapshot==='function') hot.snapshot(()=>({G})); if(typeof hot.ready==='function'){ hot.ready(start); return; } start(hot.data||null); return; } }catch(err){}
  start(null);
}
boot();
