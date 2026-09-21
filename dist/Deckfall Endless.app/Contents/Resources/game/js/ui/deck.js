'use strict';
// ===================== DECK MANAGER: filters on the side, the twenty you carry on top, everything you own below =====================
// Opens from the Deck button anywhere and from the keeper's Pack. Swapping between deck and pack (click, or drag and drop) only
// works at the keeper; everywhere else the screen is for looking. Hovering a card shows a large copy of it beside the cursor.
const DK_FX=[['damage','Damage'],['healing','Healing'],['defense','Block & armor'],['debuff','Debuffs'],['buff','Buffs'],['mana','Mana & draw'],['passive','Passives'],['trick','Tricks']];
function cardFxTags(id){
  const d=CARD[id]; const s=new Set();
  for(const f of d.fx){ const t=f[0];
    if(t==='dmg') s.add('damage'); else if(t==='heal'||t==='healPct') s.add('healing'); else if(t==='block'||t==='armor') s.add('defense'); else if(t==='se') s.add('debuff'); else if(t==='ss'||t==='stat') s.add('buff');
    else if(t==='draw'||t==='energy'||t==='maxEnergy') s.add('mana'); else if(t==='passive') s.add('passive');
    else if(t==='special'){ if(['execute','snipe','stDmg','blockDmg','playedDmg','retaliation'].includes(f[1])) s.add('damage'); else if(f[1]==='elBoost'||f[1]==='parry') s.add('buff'); else s.add('trick'); } }
  return s;
}
function dkState(){ return UI.dk||(UI.dk={els:[],types:[],tiers:[],costs:[],fx:[],q:'',sort:'tier'}); }
function dkCanSwap(){ return !!G&&G.phase==='keeper'; }
// id -> where each copy of it is right now (hand, draw pile, discard, exhausted, in play)
function dkLocations(){ const P=G.fight||G.p.kit||newKit(); const m={}; const add=(id,l)=>{ (m[id]=m[id]||[]).push(l); }; for(const c of P.hand) add(c.id,'in hand'); for(const c of P.draw) add(c.id,'draw pile'); for(const c of P.discard) add(c.id,'discard'); for(const c of P.exhaust) add(c.id,'exhausted'); for(const p of P.passives) if(p.inst) add(p.inst.id,'in play'); return m; }
function dkCounts(){ const counts={}; for(const id of G.p.deck) (counts[id]=counts[id]||{d:0,s:0}).d++; for(const id of (G.p.stash||[])) (counts[id]=counts[id]||{d:0,s:0}).s++; return counts; }
function dkFilter(list){
  const L=dkState(); const q=L.q.trim().toLowerCase(); const paysMana=c=>c.type==='spell'||c.type==='summon';
  return list.filter(c=>(!L.els.length||L.els.includes(c.el))&&(!L.types.length||L.types.includes(c.type))&&(!L.tiers.length||L.tiers.includes(TIERS[curTier(c.id)]))&&(!L.costs.length||L.costs.includes(paysMana(c)?String(c.cost):'free'))&&(!L.fx.length||[...cardFxTags(c.id)].some(t=>L.fx.includes(t)))&&(!q||c.name.toLowerCase().includes(q)||EL[c.el].n.toLowerCase().includes(q)||TYPES[c.type].toLowerCase().includes(q)));
}
function dkSort(list){ const L=dkState(); const ti=c=>curTier(c.id); const co=c=>(c.type==='spell'||c.type==='summon')?c.cost:-1; const cmp={tier:(a,b)=>ti(b)-ti(a)||a.name.localeCompare(b.name), name:(a,b)=>a.name.localeCompare(b.name), el:(a,b)=>a.el.localeCompare(b.el)||ti(b)-ti(a)||a.name.localeCompare(b.name), cost:(a,b)=>co(a)-co(b)||ti(b)-ti(a)||a.name.localeCompare(b.name)}[L.sort]||(()=>0); return list.sort(cmp); }
function dkShown(){ const counts=dkCounts(); return {counts,list:dkSort(dkFilter(Object.keys(counts).map(id=>CARD[id]))),owned:Object.keys(counts).length}; }
function dkGridHTML(){
  const swap=dkCanSwap(); const {counts,list}=dkShown();
  return list.map(c=>{ const k=counts[c.id]; const tag=`${k.d?`deck ×${k.d}`:''}${k.d&&k.s?' · ':''}${k.s?`pack ×${k.s}`:''}`; const drag=swap&&k.s; return cardHTML(c.id,{act:drag?'deck-in':'noop',data:`data-id="${c.id}"${drag?' draggable="true" data-drag="pack"':''}`,tag,dim:!k.s}); }).join('')||'<div class="muted libempty">No card matches these filters.</div>';
}
function dkCountText(){ const {list,owned}=dkShown(); return `${list.length} of ${owned} shown`; }
function deckHTML(){
  const p=G.p; const L=dkState(); const swap=dkCanSwap(); const stash=p.stash||[]; const loc=dkLocations(); const used={};
  const carried=p.deck.slice().sort((a,b)=>curTier(b)-curTier(a)||a.localeCompare(b)).map(id=>{ const i=used[id]||0; used[id]=i+1; const where=(loc[id]||[])[i]||''; return cardHTML(id,{act:swap?'deck-out':'noop',data:`data-id="${id}"${swap?' draggable="true" data-drag="deck"':''}`,tag:where||null,dim:where==='in play'}); }).join('');
  const slots=Array.from({length:Math.max(0,DECK_MAX-p.deck.length)},()=>'<div class="card slot" title="An empty slot in your deck"><span>+</span></div>').join('');
  const chip=(act,v,lbl,on,style)=>`<button class="fchip ${on?'on':''}" data-act="${act}" data-v="${v}" ${style?`style="${style}"`:''}>${lbl}</button>`;
  const group=(label,html)=>`<div class="lf"><div class="lfl">${label}</div><div class="lfc">${html}</div></div>`;
  return `<div class="scene dk">
    <div class="row between dkhead"><h2>🎴 Your deck <span class="muted small">· ${p.deck.length} / ${DECK_MAX} carried · ${stash.length} in the pack</span></h2><div class="row"><span class="muted small dkhint">${swap?'Drag cards between deck and pack (drop on a card to replace it), or click them. Hover to read.':'Swap cards at the keeper. Here you can look; hover a card to read it.'}</span><button class="btn" data-act="deck-back">← Back</button></div></div>
    <div class="dkbody">
      <aside class="dkside">
        <div class="lf"><div class="lfl">Search</div><input id="dkq" type="search" placeholder="Name, element, type" value="${esc(L.q)}" autocomplete="off"></div>
        ${group('Element',Object.keys(EL).map(k=>chip('dk-el',k,`${EL[k].i} ${EL[k].n}`,L.els.includes(k),`--el:${EL[k].c}`)).join(''))}
        ${group('Type',Object.keys(TYPES).filter(t=>t!=='curse').map(k=>chip('dk-type',k,`${TYPE_ICON[k]} ${TYPES[k]}`,L.types.includes(k))).join(''))}
        ${group('Effect',DK_FX.map(([v,l])=>chip('dk-fx',v,l,L.fx.includes(v))).join(''))}
        ${group('Tier',TIERS.map(t=>chip('dk-tier',t,t,L.tiers.includes(t),`--el:${TIER[t].c}`)).join(''))}
        ${group('Mana cost',LIB_COSTS.map(([v,l])=>chip('dk-cost',v,v==='free'?'Free':l,L.costs.includes(v))).join(''))}
        ${group('Sort by',LIB_SORTS.map(([v,l])=>chip('dk-sort',v,l,L.sort===v)).join(''))}
        <button class="btn sm ghost" data-act="dk-reset">Reset filters</button>
      </aside>
      <div class="dkmain">
        <div class="eyebrow">Carried · ${p.deck.length} / ${DECK_MAX}${swap?'':' · where each copy is right now'}</div>
        <div class="dkdeck">${carried}${slots}</div>
        <div class="eyebrow">Everything you own · <span id="dkcount">${dkCountText()}</span></div>
        <div class="dkall">${dkGridHTML()}</div>
      </div>
    </div>
  </div>`;
}
// Swap one carried card for one packed card in a single move (a drop onto a card when the deck is full).
function dkReplace(outId,inId){ if(!kitRemove(outId)){ toast('That card is in play as a passive; it stays until the passive is gone'); return; } const di=G.p.deck.indexOf(outId); if(di>=0) G.p.deck.splice(di,1); (G.p.stash=G.p.stash||[]).push(outId); const si=G.p.stash.indexOf(inId); if(si>=0){ G.p.stash.splice(si,1); G.p.deck.push(inId); kitAdd(inId); } sfx('pick'); render(); save(); }
// ---- hover zoom: a large copy of the card beside the cursor, never clipped by the scrolling lists ----
function dkZoomShow(card){
  let z=document.getElementById('dkzoom'); if(!z){ z=document.createElement('div'); z.id='dkzoom'; document.body.appendChild(z); }
  const clone=card.cloneNode(true); clone.classList.remove('unaff','sel','kbf','dragging','over','enter'); clone.classList.add('static'); clone.removeAttribute('data-act'); clone.removeAttribute('draggable'); clone.removeAttribute('title'); z.innerHTML=''; z.appendChild(clone);
  const r=card.getBoundingClientRect(); const W=Math.min(230,innerWidth-24), H=Math.round(W*1.5); let left=r.right+14; if(left+W>innerWidth-8) left=r.left-W-14; if(left<8) left=Math.max(8,innerWidth-W-8); const top=Math.min(Math.max(8,r.top+r.height/2-H/2),Math.max(8,innerHeight-H-8));
  z.style.left=left+'px'; z.style.top=top+'px'; z.style.width=W+'px'; z.classList.add('on');
}
function dkZoomHide(){ const z=document.getElementById('dkzoom'); if(z) z.classList.remove('on'); }
document.addEventListener('mouseover',e=>{ if(UI.screen!=='deck') return; const c=e.target.closest&&e.target.closest('.dk .card'); if(!c||c.classList.contains('slot')||DK_DRAG) return; dkZoomShow(c); });
document.addEventListener('mouseout',e=>{ if(UI.screen!=='deck') return; const c=e.target.closest&&e.target.closest('.dk .card'); if(!c) return; const to=e.relatedTarget; if(to&&c.contains(to)) return; dkZoomHide(); });
document.addEventListener('mousedown',dkZoomHide); addEventListener('scroll',dkZoomHide,true);
// ---- drag and drop: pack cards up into the deck, deck cards down into the pack ----
let DK_DRAG=null;
document.addEventListener('dragstart',e=>{ const c=e.target.closest&&e.target.closest('.card[data-drag]'); if(!c) return; if(!dkCanSwap()){ e.preventDefault(); return; } dkZoomHide(); DK_DRAG={from:c.dataset.drag,id:c.dataset.id}; c.classList.add('dragging'); try{ e.dataTransfer.setData('text/plain',c.dataset.id); e.dataTransfer.effectAllowed='move'; }catch(err){} });
document.addEventListener('dragend',()=>{ DK_DRAG=null; document.querySelectorAll('.dragging,.over').forEach(x=>x.classList.remove('dragging','over')); });
document.addEventListener('dragover',e=>{ if(!DK_DRAG) return; const z=e.target.closest&&e.target.closest('.dkdeck, .dkall'); if(!z) return; const ok=(DK_DRAG.from==='pack'&&z.classList.contains('dkdeck'))||(DK_DRAG.from==='deck'&&z.classList.contains('dkall')); if(!ok) return; e.preventDefault(); try{ e.dataTransfer.dropEffect='move'; }catch(err){} document.querySelectorAll('.over').forEach(x=>x.classList.remove('over')); const card=DK_DRAG.from==='pack'?e.target.closest('.dkdeck .card:not(.slot)'):null; (card||z).classList.add('over'); });
document.addEventListener('drop',e=>{ if(!DK_DRAG) return; const z=e.target.closest&&e.target.closest('.dkdeck, .dkall'); if(!z) return; e.preventDefault(); const d=DK_DRAG; DK_DRAG=null; document.querySelectorAll('.dragging,.over').forEach(x=>x.classList.remove('dragging','over')); if(!dkCanSwap()) return;
  if(d.from==='pack'&&z.classList.contains('dkdeck')){ const onCard=e.target.closest('.dkdeck .card:not(.slot)'); if(onCard&&G.p.deck.length>=DECK_MAX) dkReplace(onCard.dataset.id,d.id); else unstashCard(d.id); }
  else if(d.from==='deck'&&z.classList.contains('dkall')) stashCard(d.id); });
