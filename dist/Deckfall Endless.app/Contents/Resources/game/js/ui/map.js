'use strict';
// ===================== DUNGEON, KEEPER & PACK SCREENS =====================
const FIND_NAME={chest:'A chest',shrine:'A shrine',forge:'A dwarven forge',camp:'A campfire',trap:'Something glints',idol:'A cursed idol',boost:'A blessing',exit:'The way out',entry:'The way you came in',event:'Someone, or something, waits here'};
// Hex width: a small dungeon fits the screen (hexes up to 64px); hexes never go below 44px, so a big dungeon overflows the view and the camera follows you. Pointy tops, odd rows shifted half a hex.
function hexMetrics(){ const D=G.dungeon; const B=D.bounds||{minX:0,maxX:D.w-1,minY:0,maxY:D.h-1}; const cols=B.maxX-B.minX+1, rows=B.maxY-B.minY+1; const availW=Math.min(innerWidth,1200)-40, availH=Math.max(220,innerHeight-310); const fit=Math.floor(Math.min(availW/(cols+0.5),availH/((0.75*rows+0.25)*1.1547))); const W=Math.max(44,Math.min(64,fit)); const H=Math.round(W*1.1547); return {W,H,ox:B.minX,oy:B.minY,boardW:Math.round((cols+0.5)*W),boardH:Math.round((0.75*rows+0.25)*H)}; }
function hexPos(c,r,m){ return {left:Math.round((c-m.ox)*m.W+((r&1)?m.W/2:0)),top:Math.round((r-m.oy)*m.H*0.75)}; }
function tileTitle(t){
  const bits=[]; if(t.wall) return 'Rock';
  if(t.k==='creature'||t.k==='nest'){ const e=ENEMY[t.e]; if(e) bits.push(`${t.k==='nest'?'Elite ':''}${e.name}${t.s?` · senses you ${t.s} hex${t.s>1?'es':''} away`:' · notices you only when you step in'}`); }
  else if(t.k==='lair'){ const b=BOSSES.find(x=>x.id===t.boss); bits.push(`${b?b.name:'A boss'} guards the way out`); }
  else if(t.k) bits.push(FIND_NAME[t.k]||'');
  else bits.push(t.room>=0?'Room floor':'Corridor');
  return bits.join(' · ');
}
function tileIcon(t){ if(t.k==='creature'||t.k==='nest') return ENEMY[t.e]?ENEMY[t.e].icon:'👾'; if(t.k==='lair'){ const b=BOSSES.find(x=>x.id===t.boss); return b?b.icon:'👑'; } return TILE_ICON[t.k]||''; }
function hexClass(t,hot){ const D=G.dungeon; return ['hex',t.wall?'wall':'floor',isVisible(t.x,t.y)?'vis':'mem',t.k||'',hot.has(t.y*D.w+t.x)?'hot':'',t.room>=0?'room':'corr'].filter(Boolean).join(' '); }
function hexHTML(t,m,hot){ const p=hexPos(t.x,t.y,m); const icon=t.wall?'':tileIcon(t); return `<div class="${hexClass(t,hot)}" data-act="${t.wall?'noop':'hex'}" data-x="${t.x}" data-y="${t.y}" style="left:${p.left}px;top:${p.top}px" title="${esc(tileTitle(t))}">${icon?`<span class="ti">${icon}</span>`:''}</div>`; }
function mapHintText(){ const D=G.dungeon; const T=THEMES[D.theme]; return `${T.i} ${esc(T.n)} · dungeon ${D.n} · room ${D.entered} of ${D.rooms} · danger ${G.round}`; }
function dungeonHTML(){
  const D=G.dungeon; const T=THEMES[D.theme]; const m=hexMetrics(); const hot=hotTiles(); let h='';
  for(const t of D.t) if(t.seen) h+=hexHTML(t,m,hot);
  const hp=hexPos(G.pos.x,G.pos.y,m); requestAnimationFrame(()=>updateCamera(true));
  return `<div class="mapwrap">
    <div class="mapview"><div class="board nocam" data-key="${UI.mapKey||0}" style="width:${m.boardW}px;height:${m.boardH}px;--hw:${m.W}px;--hh:${m.H}px;--bc:${T.c}">${h}<div class="hero" style="left:${hp.left}px;top:${hp.top}px">🧙</div></div></div>
    <div class="maphint"><span class="mh">${mapHintText()}</span><span>Click a hex to walk (the path shows as you hover) · Q E A D Z C step · Space acts on your hex · drag the map to look around · find the exit 🚪</span></div>
    ${kitHTML()}
  </div>`;
}
// Update the board in place, so the hero slides and nothing is rebuilt under the mouse. Returns false when a full render is needed.
function patchMap(){
  const board=document.querySelector('.board'); if(!board||board.dataset.key!==String(UI.mapKey||0)) return false;
  const D=G.dungeon; const m=hexMetrics(); const hot=hotTiles(); const have=new Map(); board.querySelectorAll('.hex').forEach(el=>have.set(el.dataset.x+','+el.dataset.y,el));
  for(const t of D.t){ if(!t.seen) continue; const el=have.get(t.x+','+t.y); if(!el){ board.insertAdjacentHTML('afterbegin',hexHTML(t,m,hot)); continue; }
    const cls=hexClass(t,hot); if(el.className!==cls) el.className=cls;
    const icon=t.wall?'':tileIcon(t); const cur=el.querySelector('.ti'); if((cur?cur.textContent:'')!==icon){ el.innerHTML=icon?`<span class="ti">${icon}</span>`:''; el.title=tileTitle(t); } }
  const hero=board.querySelector('.hero'); if(hero){ const hp=hexPos(G.pos.x,G.pos.y,m); hero.style.left=hp.left+'px'; hero.style.top=hp.top+'px'; } updateCamera(false);
  const hint=document.querySelector('.maphint .mh'); if(hint) hint.innerHTML=mapHintText();
  const kit=document.querySelector('.kit'); if(kit) kit.outerHTML=kitHTML();
  const hud=document.querySelector('.hud'); if(hud) hud.outerHTML=hudHTML();
  return true;
}
// The camera. A dungeon that fits sits centred in the view. A bigger one is a board sliding under the view: when you come within a hex and a half of an
// edge the view moves to put you in the middle, and you can drag it to look around (a real drag swallows the click that would have walked).
function updateCamera(instant){
  const view=document.querySelector('.mapview'); const board=view&&view.querySelector('.board'); if(!view||!board||!G||!G.dungeon||G.phase!=='map') return;
  const m=hexMetrics(); const vw=view.clientWidth, vh=view.clientHeight; const cam=UI.cam||(UI.cam={x:0,y:0,key:null});
  const fitX=m.boardW<=vw, fitY=m.boardH<=vh; const hp=hexPos(G.pos.x,G.pos.y,m); const cx=hp.left+m.W/2, cy=hp.top+m.H/2; const edge=m.W*1.6;
  if(cam.key!==(UI.mapKey||0)){ cam.key=UI.mapKey||0; cam.x=fitX?(vw-m.boardW)/2:clamp(vw/2-cx,vw-m.boardW,0); cam.y=fitY?(vh-m.boardH)/2:clamp(vh/2-cy,vh-m.boardH,0); instant=true; }
  if(fitX) cam.x=(vw-m.boardW)/2; else if(cx+cam.x<edge||cx+cam.x>vw-edge) cam.x=clamp(vw/2-cx,vw-m.boardW,0);
  if(fitY) cam.y=(vh-m.boardH)/2; else if(cy+cam.y<edge||cy+cam.y>vh-edge) cam.y=clamp(vh/2-cy,vh-m.boardH,0);
  board.classList.toggle('nocam',!!instant); board.style.transform=`translate(${Math.round(cam.x)}px,${Math.round(cam.y)}px)`; if(instant) requestAnimationFrame(()=>board.classList.remove('nocam'));
  view.classList.toggle('pan',!fitX||!fitY);
}
(function(){ let st=null;
  document.addEventListener('mousedown',e=>{ const v=e.target.closest&&e.target.closest('.mapview'); if(!v||!v.classList.contains('pan')||e.button!==0||!UI.cam) return; st={x:e.clientX,y:e.clientY,cx:UI.cam.x,cy:UI.cam.y,moved:false}; });
  document.addEventListener('mousemove',e=>{ if(!st) return; const dx=e.clientX-st.x, dy=e.clientY-st.y; if(!st.moved&&Math.hypot(dx,dy)<6) return; st.moved=true; const view=document.querySelector('.mapview'); const board=view&&view.querySelector('.board'); if(!board) return; const m=hexMetrics(); const vw=view.clientWidth, vh=view.clientHeight; UI.cam.x=m.boardW<=vw?(vw-m.boardW)/2:clamp(st.cx+dx,vw-m.boardW,0); UI.cam.y=m.boardH<=vh?(vh-m.boardH)/2:clamp(st.cy+dy,vh-m.boardH,0); board.classList.add('nocam'); view.classList.add('panning'); clearPreview(); board.style.transform=`translate(${Math.round(UI.cam.x)}px,${Math.round(UI.cam.y)}px)`; });
  document.addEventListener('mouseup',()=>{ if(!st) return; if(st.moved) UI.dragSuppress=Date.now(); st=null; const view=document.querySelector('.mapview'); if(view){ view.classList.remove('panning'); const b=view.querySelector('.board'); if(b) requestAnimationFrame(()=>b.classList.remove('nocam')); } });
})();
function previewPath(x,y){ document.querySelectorAll('.hex.path').forEach(e=>e.classList.remove('path')); if(!G||G.phase!=='map'||UI.walk) return; const t=tileAt(x,y); if(!passable(t)||!t.seen) return; const path=findPath(G.pos,{x,y},true)||findPath(G.pos,{x,y},false); if(!path) return; for(const p of path.slice(1)){ const el=document.querySelector(`.hex[data-x="${p.x}"][data-y="${p.y}"]`); if(el) el.classList.add('path'); } }
function clearPreview(){ document.querySelectorAll('.hex.path').forEach(e=>e.classList.remove('path')); }
function kitHTML(){
  const K=G.p.kit||newKit();
  const hand=K.hand.map(c=>cardHTML(c.id,{mode:'static'})).join('')||'<div class="muted small emptyhand">Your hand is empty. It refills when a fight starts.</div>';
  const pas=K.passives.map(p=>`<span class="pdi" style="--el:${EL[p.el].c}">${p.icon} ${esc(p.name)}</span>`).join('')||'<span class="muted small">none in play</span>';
  return `<div class="kit"><div class="kithand">${hand}</div><div class="kitside"><div><b>Hand</b> ${K.hand.length} · draw ${K.draw.length} · discard ${K.discard.length}</div><div><b>Mana</b> ${K.energy||0} / ${MANA_CAP}</div><div><b>Passives</b> ${K.passives.length} / ${PS('slots')}</div><div class="pd">${pas}</div></div></div>`;
}
function keeperHTML(){
  const K=G.keeper; if(!K) return '';
  const p=G.p; const T=themeNow(); const next=G.dungeon.n+1; const bossNext=next%BOSS_EVERY===0;
  const owned=id=>p.deck.includes(id)||(p.stash||[]).includes(id);
  const offers=K.offers.map(id=>cardHTML(id,{act:K.used.buy?null:'keeper-buy',data:`data-id="${id}"`,price:cardPrice(id),tag:owned(id)?(canEvolve(id)?`Owned · evolve to ${TIERS[curTier(id)+1]}`:'Owned · copy'):null,dim:K.used.buy||p.gold<cardPrice(id)})).join('');
  return `<div class="scene shop keeper">
    <div class="row between"><h2>🕯️ The Keeper · after the ${esc(T.n)}</h2><button class="btn primary" data-act="keeper-descend">Descend to dungeon ${next}${bossNext?' · a lair waits below':''} →</button></div>
    <p class="muted small">${K.msg?esc(K.msg):`"You found the way out. Sit. Trade. Then down again." The keeper pays ${K.purse} gold for the map you drew.`}</p>
    <div class="choices krow">
      <button class="choice" data-act="keeper-rest" ${K.used.rest||p.hp>=p.maxHp?'disabled':''}>🛏️ Rest · ${restCost()} gold<small>${K.used.rest?'Done for this visit.':p.hp>=p.maxHp?'You are already rested.':'Heal to full.'}</small></button>
      <button class="choice" data-act="keeper-smith" ${K.used.smith?'disabled':''}>⚒️ Blacksmith<small>${K.used.smith?'Done for this visit.':'Evolve one card, one tier higher, for gold.'}</small></button>
      <button class="choice" data-act="keeper-remove" ${K.used.remove?'disabled':''}>🕊️ Let a card go · +${removeCost()} gold<small>${K.used.remove?'Done for this visit.':'The keeper takes one card off your hands.'}</small></button>
      <button class="choice" data-act="keeper-pack">📦 Pack<small>Deck ${p.deck.length} / ${DECK_MAX} · pack ${(p.stash||[]).length}. Swap cards between them.</small></button>
    </div>
    <div class="eyebrow">${K.used.buy?'Bought for this visit':'Buy one card'}</div>
    <div class="shopcards">${offers}</div>
  </div>`;
}
