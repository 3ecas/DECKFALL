'use strict';
// ===================== DUNGEON, KEEPER & PACK SCREENS =====================
const FIND_NAME={chest:'A chest',shrine:'A shrine',forge:'A dwarven forge',camp:'A campfire',trap:'Something glints',idol:'A cursed idol',boost:'A blessing',exit:'The way out',entry:'The way you came in',event:'Someone, or something, waits here'};
// Hex width: a small dungeon fits the screen (hexes up to 64px); hexes never go below 44px, so a big dungeon overflows the view and the camera follows you. Pointy tops, odd rows shifted half a hex.
function hexMetrics(){ const D=G.dungeon; const B=D.bounds||{minX:0,maxX:D.w-1,minY:0,maxY:D.h-1}; const cols=B.maxX-B.minX+1, rows=B.maxY-B.minY+1; const availW=innerWidth-120, availH=Math.max(220,innerHeight-200); const fit=Math.floor(Math.min(availW/(cols+0.5),availH/((0.75*rows+0.25)*1.1547))); const W=Math.max(44,Math.min(64,fit)); const H=Math.round(W*1.1547); return {W,H,ox:B.minX,oy:B.minY,boardW:Math.round((cols+0.5)*W),boardH:Math.round((0.75*rows+0.25)*H)}; }
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
function mapSubText(){ const D=G.dungeon; return `Dungeon ${D.n} · Room ${D.entered} of ${D.rooms}`; }
function mapStatusHTML(){ return `<div class="bars">${gaugesHTML()}</div><span class="gold num">${G.p.gold}</span>`; }
// The dungeon fills the screen. Over it: the dungeon's name and the room in the middle of the top edge, the tools top-right, life, level and gold bottom-left.
function dungeonHTML(){
  const D=G.dungeon; const T=THEMES[D.theme]; const m=hexMetrics(); const hot=hotTiles(); let h='';
  for(const t of D.t) if(t.seen) h+=hexHTML(t,m,hot);
  const hp=hexPos(G.pos.x,G.pos.y,m); requestAnimationFrame(()=>updateCamera(true));
  return `<div class="mapwrap">
    <div class="mapview"><div class="board nocam" data-key="${UI.mapKey||0}" style="width:${m.boardW}px;height:${m.boardH}px;--hw:${m.W}px;--hh:${m.H}px;--bc:${T.c}">${h}<div class="hero" style="left:${hp.left}px;top:${hp.top}px">🧙</div></div></div>
    <div class="maptitle"><div class="mtn">${T.i} ${esc(T.n)}</div><div class="mts">${mapSubText()}</div></div>
    <div class="maptools">${toolsHTML()}</div>
    <div class="mapstatus">${mapStatusHTML()}</div>
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
  const sub=document.querySelector('.maptitle .mts'); if(sub) sub.textContent=mapSubText();
  const st=document.querySelector('.mapstatus'); if(st) st.innerHTML=mapStatusHTML();
  const tools=document.querySelector('.maptools'); if(tools) tools.innerHTML=toolsHTML();
  return true;
}
// The camera. The view keeps a margin on every side (more under the title and above the status) so the dungeon never sits against the screen's edge.
// A dungeon that fits inside the margins is centred. A bigger one slides: when you come within about two hexes of a margin the view moves to put
// you in the middle, and you can drag it, but never past the margins (a real drag swallows the click that would have walked).
const CAM_PAD={l:56,r:56,t:100,b:80};
// The part of the board you have seen, in board pixels: the camera never lets it leave the margins, so what you can see never sits against the screen's edge.
function seenBox(m){ const D=G.dungeon; let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9; for(const t of D.t){ if(!t.seen) continue; const p=hexPos(t.x,t.y,m); if(p.left<x1) x1=p.left; if(p.top<y1) y1=p.top; if(p.left+m.W>x2) x2=p.left+m.W; if(p.top+m.H>y2) y2=p.top+m.H; } if(x1>x2){ x1=0; y1=0; x2=m.boardW; y2=m.boardH; } return {x1,y1,x2,y2}; }
function camLimits(m,vw,vh){ const P=CAM_PAD; const fitX=m.boardW<=vw-P.l-P.r, fitY=m.boardH<=vh-P.t-P.b; const S=seenBox(m); const ax=P.l-S.x1, bx=vw-P.r-S.x2, ay=P.t-S.y1, by=vh-P.b-S.y2;
  return {fitX,fitY,x:v=>fitX?(vw-m.boardW)/2:clamp(v,Math.min(ax,bx),Math.max(ax,bx)),y:v=>fitY?(vh-m.boardH)/2:clamp(v,Math.min(ay,by),Math.max(ay,by))}; }
function updateCamera(instant){
  const view=document.querySelector('.mapview'); const board=view&&view.querySelector('.board'); if(!view||!board||!G||!G.dungeon||G.phase!=='map') return;
  const m=hexMetrics(); const vw=view.clientWidth, vh=view.clientHeight; const cam=UI.cam||(UI.cam={x:0,y:0,key:null}); const L=camLimits(m,vw,vh); const P=CAM_PAD;
  const hp=hexPos(G.pos.x,G.pos.y,m); const cx=hp.left+m.W/2, cy=hp.top+m.H/2; const ex=m.W*2.2, ey=m.H*1.8;
  if(cam.key!==(UI.mapKey||0)){ cam.key=UI.mapKey||0; cam.x=L.x(vw/2-cx); cam.y=L.y(vh/2-cy); instant=true; }
  if(L.fitX) cam.x=L.x(0); else if(cx+cam.x<P.l+ex||cx+cam.x>vw-P.r-ex) cam.x=L.x(vw/2-cx);
  if(L.fitY) cam.y=L.y(0); else if(cy+cam.y<P.t+ey||cy+cam.y>vh-P.b-ey) cam.y=L.y(vh/2-cy);
  board.classList.toggle('nocam',!!instant); board.style.transform=`translate(${Math.round(cam.x)}px,${Math.round(cam.y)}px)`; if(instant) requestAnimationFrame(()=>board.classList.remove('nocam'));
  view.classList.toggle('pan',!L.fitX||!L.fitY);
}
(function(){ let st=null;
  document.addEventListener('mousedown',e=>{ const v=e.target.closest&&e.target.closest('.mapview'); if(!v||!v.classList.contains('pan')||e.button!==0||!UI.cam) return; st={x:e.clientX,y:e.clientY,cx:UI.cam.x,cy:UI.cam.y,moved:false}; });
  document.addEventListener('mousemove',e=>{ if(!st) return; const dx=e.clientX-st.x, dy=e.clientY-st.y; if(!st.moved&&Math.hypot(dx,dy)<6) return; st.moved=true; const view=document.querySelector('.mapview'); const board=view&&view.querySelector('.board'); if(!board) return; const m=hexMetrics(); const L=camLimits(m,view.clientWidth,view.clientHeight); UI.cam.x=L.x(st.cx+dx); UI.cam.y=L.y(st.cy+dy); board.classList.add('nocam'); view.classList.add('panning'); clearPreview(); board.style.transform=`translate(${Math.round(UI.cam.x)}px,${Math.round(UI.cam.y)}px)`; });
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
// The keeper's hall: the keeper at his candle, four services as small cards (art tile, name plaque, dotted box), then the cards for sale.
function keeperHTML(){
  const K=G.keeper; if(!K) return '';
  const p=G.p; const T=themeNow(); const next=G.dungeon.n+1; const bossNext=next%BOSS_EVERY===0;
  const owned=id=>p.deck.includes(id)||(p.stash||[]).includes(id);
  const offers=K.offers.map(id=>cardHTML(id,{act:K.used.buy?null:'keeper-buy',data:`data-id="${id}"`,price:cardPrice(id),tag:owned(id)?(canEvolve(id)?`Owned · evolve to ${TIERS[curTier(id)+1]}`:'Owned · copy'):null,dim:K.used.buy||p.gold<cardPrice(id)})).join('');
  const svc=(act,cls,icon,name,price,desc,used,disabled)=>`<button class="svc ${cls} ${used?'used':''}" data-act="${act}" ${disabled?'disabled':''}><span class="svart"><span>${icon}</span></span><span class="svname">${name}</span>${price?`<span class="svprice">${price}</span>`:''}<span class="svdesc">${desc}</span></button>`;
  return `<div class="scene keeper">
    <div class="eyebrow">After the ${esc(T.n)} · dungeon ${G.dungeon.n} · ${p.gold} gold</div>
    <div class="kart"><span>🕯️</span></div>
    <h2 class="stitle">The Keeper</h2>
    <p class="itext">${K.msg?esc(K.msg):`"You found the way out. Sit. Trade. Then down again." The keeper pays ${K.purse} gold for the map you drew.`}</p>
    <div class="ksvc">
      ${svc('keeper-rest','rest','🛏️','Rest',`${restCost()} gold`,K.used.rest?'Done for this visit.':p.hp>=p.maxHp?'You are already rested.':'Sleep by the fire and heal to full.',K.used.rest,K.used.rest||p.hp>=p.maxHp)}
      ${svc('keeper-smith','smith','⚒️','Blacksmith','',K.used.smith?'Done for this visit.':'Evolve one card one tier higher, for gold.',K.used.smith,K.used.smith)}
      ${svc('keeper-remove','remove','🕊️','Let a card go',`+${removeCost()} gold`,K.used.remove?'Done for this visit.':'The keeper takes one card off your hands.',K.used.remove,K.used.remove)}
      ${svc('keeper-pack','pack','📦','Pack',`${p.deck.length} / ${DECK_MAX} carried`,`${(p.stash||[]).length} in the pack. Swap cards between deck and pack.`,false,false)}
    </div>
    <div class="eyebrow">${K.used.buy?'Bought for this visit':'Buy one card'}</div>
    <div class="shopcards">${offers}</div>
    <button class="btn primary kdesc" data-act="keeper-descend">Descend to dungeon ${next}${bossNext?' · a lair waits below':''} →</button>
  </div>`;
}
