'use strict';
// ===================== SCREENS =====================
// The backdrop of a theme: its `art` file in img/bg if the theme names one (THEMES in world.js), else the vector scene img/bg/<theme>.svg.
function sceneFile(theme){ const T=THEMES[theme]||{}; return 'img/bg/'+(T.art||theme+'.svg'); }
function render(){
  const app=document.getElementById('app'); if(!app) return; if(typeof hideTip==='function') hideTip();
  { const sc=document.getElementById('scene'); if(sc){ const show=G&&G.dungeon&&G.phase!=='gameover'&&!UI.screen; const url=show?`url(${sceneFile(G.dungeon.theme)})`:''; if(sc.dataset.url!==url){ sc.dataset.url=url; if(url) sc.style.backgroundImage=url; sc.style.opacity=url?'1':'0'; } } }   // the dungeon's own backdrop behind everything while a run is on
  if(UI.screen==='library'){ app.innerHTML=libraryHTML()+modalHTML(); return; }
  if(UI.screen==='deck'&&G){ app.innerHTML=deckHTML()+modalHTML(); if(typeof afterRender==="function") afterRender(); return; }
  if(!G){ app.innerHTML=titleHTML()+modalHTML(); return; }
  if(G.phase==='battle'&&G.fight){ const cur=app.querySelector('#battle'); if(cur&&cur.dataset.key==String(G.fight.key)){ patchBattle(); const mm=app.querySelector('.modal'); if(mm) mm.remove(); app.insertAdjacentHTML('beforeend',modalHTML()); return; } }
  let html='';
  switch(G.phase){
    case 'battle': html=battleHTML(); break;
    case 'spoils': html=hudHTML()+spoilsHTML(); break;
    case 'interlude': html=hudHTML()+interludeHTML(); break;
    case 'shop': html=hudHTML()+shopHTML(); break;
    case 'descent': html=hudHTML()+descentHTML(); break;
    case 'keeper': html=hudHTML()+keeperHTML(); break;
    case 'gameover': html=gameoverHTML(); break;
    default: html=hudHTML();
  }
  app.innerHTML=html+modalHTML(); if(typeof afterRender==="function") afterRender();
  const lg=app.querySelector('.log'); if(lg) lg.scrollTop=lg.scrollHeight;
}
function patchBattle(){
  const F=G.fight; const app=document.getElementById('app');
  const hud=app.querySelector('.hud'); if(hud) hud.outerHTML=hudHTML({bars:false});
  F.enemies.forEach((e,i)=>{ const n=app.querySelector(`.enemy[data-uid="${e.uid}"]`); if(!n) return; n.classList.toggle('sel',F.target===i&&e.alive); n.classList.toggle('dead',!e.alive); const bar=n.querySelector('.ehp i'); if(bar) bar.style.width=(e.hp/e.maxHp*100)+'%'; const bt=n.querySelector('.ehp b'); if(bt) bt.textContent=`${e.hp} / ${e.maxHp}`; const st=n.querySelector('.statuses'); if(st) st.innerHTML=enemyStatusesHTML(e); const it=n.querySelector('.intent'); if(it) it.innerHTML=enemyIntentHTML(e); const ep=n.querySelector('.epassives'); if(ep) ep.innerHTML=enemyPassivesHTML(e); });
  const sl=app.querySelector('.slots'); if(sl) sl.innerHTML=slotsHTML();
  const lg=app.querySelector('.log'); if(lg){ lg.outerHTML=logHTML(); const l2=app.querySelector('.log'); l2.scrollTop=l2.scrollHeight; }
  const pl=app.querySelector('.player'); if(pl) pl.outerHTML=playerHTML();
  const hand=app.querySelector('.hand'); if(hand) hand.innerHTML=handHTML();
  const hb=app.querySelector('.handbar'); if(hb) hb.innerHTML=handbarHTML();
}
function titleHTML(){
  const s=loadSave(); if(s&&s.p&&s.p.deck) markSeen(s.p.deck); const best=getBest(); const seen=seenCards(); const total=CARDS.filter(c=>c.type!=='curse').length;
  const known=CARDS.filter(c=>seen.has(c.id)&&c.type!=='curse'); const fan=(known.length>=3?shuffle(known.slice()).slice(0,3):[CARD.strike,CARD.mana_potion,CARD.ember]).map(c=>c.id);
  return `<div class="center title">
    <div class="menu">
      <div class="menu-l">
        <div class="eyebrow">An endless deck-building roguelike</div>
        <div class="title-art"><span>Deckfall</span><span>Endless</span></div>
        <p class="title-sub">Five basic cards and a torch. Crawl through fogged dungeons, find the exit, choose your fights, loot, evolve, combo. Fourteen elements, nine tiers, dungeons without end. Die, and start over.</p>
        <div class="menu-btns">
          ${s?`<button class="btn primary big" data-act="continue">Continue · dungeon ${s.dungeon?s.dungeon.n:1}</button>`:''}
          <button class="btn ${s?'':'primary'} big" data-act="new">${s?'New run · deletes the save':'Begin a run'}</button>
          <button class="btn big" data-act="library">📚 Card Library <span class="mcount">${known.length} / ${total}</span></button>
          <button class="btn big ghost" data-act="modal" data-m="help">How to play</button>
        </div>
        ${best&&best.depth?`<div class="kv"><span>Deepest round <b>${best.round||0}</b></span><span>Dungeon <b>${best.depth}</b></span><span>Bosses <b>${best.lairs||0}</b></span><span>Level <b>${best.level}</b></span><span>Runs <b>${best.runs}</b></span>${best.won?`<span class="good">Final boss slain <b>${best.won}×</b></span>`:''}</div>`:''}
      </div>
      <div class="menu-r"><div class="fan3">${fan.map(id=>cardHTML(id,{mode:'static',tier:tierIdx(id),big:true,data:'data-fan="1"'})).join('')}</div></div>
    </div>
    <div class="muted small">${total} cards · ${Object.keys(EL).length-1} elements · ${TIERS.length} tiers · ${ENEMIES.length} enemies · ${BOSSES.length} bosses</div>
  </div>`;
}
// ---- Card Library: every card, revealed once discovered on a run; filters on the side ----
const LIB_COSTS=[['free','Free'],['0','0'],['1','1'],['2','2'],['3','3']];
const LIB_SORTS=[['tier','Tier'],['name','Name'],['el','Element'],['cost','Cost']];
function libCards(){
  const L=UI.lib; const seen=seenCards(); const q=L.q.trim().toLowerCase();
  const paysMana=c=>c.type==='spell'||c.type==='summon';
  let list=CARDS.filter(c=>c.type!=='curse'||seen.has(c.id));
  list=list.filter(c=>(L.undisc||seen.has(c.id))&&(!L.els.length||L.els.includes(c.el))&&(!L.types.length||L.types.includes(c.type))&&(!L.tiers.length||L.tiers.includes(c.tier))&&(!L.costs.length||L.costs.includes(paysMana(c)?String(c.cost):'free'))&&(!q||c.name.toLowerCase().includes(q)||EL[c.el].n.toLowerCase().includes(q)||TYPES[c.type].toLowerCase().includes(q)));
  const ti=c=>TIERS.indexOf(c.tier); const co=c=>paysMana(c)?c.cost:-1;
  const cmp={tier:(a,b)=>ti(a)-ti(b)||a.name.localeCompare(b.name), name:(a,b)=>a.name.localeCompare(b.name), el:(a,b)=>a.el.localeCompare(b.el)||ti(a)-ti(b)||a.name.localeCompare(b.name), cost:(a,b)=>co(a)-co(b)||ti(a)-ti(b)||a.name.localeCompare(b.name)}[L.sort]||((a,b)=>0);
  return list.sort(cmp);
}
function libraryGridHTML(){
  const seen=seenCards(); const list=libCards();
  if(!list.length) return `<div class="muted libempty">Nothing here yet. Cards appear once you find them on a run.</div>`;
  return list.map(c=>seen.has(c.id)?cardHTML(c.id,{mode:'static',tier:tierIdx(c.id)}):`<div class="card back static" title="Undiscovered · find it on a run"><div class="cname">? ? ?</div><div class="cart"><span>❔</span></div><div class="cbox"><div class="ctags"><span class="ctag">Undiscovered</span></div><div class="cdesc"><p class="cmain">Find it on a run</p></div></div></div>`).join('');
}
function libCountText(){ const seen=seenCards(); const total=CARDS.filter(c=>c.type!=='curse').length; const known=CARDS.filter(c=>seen.has(c.id)&&c.type!=='curse').length; return `${known} / ${total} discovered · ${libCards().length} shown`; }
function libraryHTML(){
  const L=UI.lib; const chip=(act,v,lbl,on,style)=>`<button class="fchip ${on?'on':''}" data-act="${act}" data-v="${v}" ${style?`style="${style}"`:''}>${lbl}</button>`;
  return `<div class="scene lib">
    <div class="row between libhead"><h2>📚 Card Library <span class="muted small" id="libcount">· ${libCountText()}</span></h2><div class="row"><input id="libq" type="search" placeholder="Search name, element, type" value="${esc(L.q)}" autocomplete="off"><button class="btn" data-act="lib-back">← Back</button></div></div>
    <div class="libbody">
      <aside class="libside">
        <div class="lf"><div class="lfl">Show</div><div class="lfc">${chip('lib-undisc','0','Discovered',!L.undisc)}${chip('lib-undisc','1','All · hidden as backs',L.undisc)}</div></div>
        <div class="lf"><div class="lfl">Element</div><div class="lfc">${Object.keys(EL).map(k=>chip('lib-el',k,`${EL[k].i} ${EL[k].n}`,L.els.includes(k),`--el:${EL[k].c}`)).join('')}</div></div>
        <div class="lf"><div class="lfl">Type</div><div class="lfc">${Object.keys(TYPES).map(k=>chip('lib-type',k,`${TYPE_ICON[k]} ${TYPES[k]}`,L.types.includes(k))).join('')}</div></div>
        <div class="lf"><div class="lfl">Tier</div><div class="lfc">${TIERS.map(t=>chip('lib-tier',t,t,L.tiers.includes(t),`--el:${TIER[t].c}`)).join('')}</div></div>
        <div class="lf"><div class="lfl">Mana cost</div><div class="lfc">${LIB_COSTS.map(([v,l])=>chip('lib-cost',v,l,L.costs.includes(v))).join('')}</div></div>
        <div class="lf"><div class="lfl">Sort by</div><div class="lfc">${LIB_SORTS.map(([v,l])=>chip('lib-sort',v,l,L.sort===v)).join('')}</div></div>
        <button class="btn sm ghost" data-act="lib-reset">Reset filters</button>
      </aside>
      <div class="libgrid">${libraryGridHTML()}</div>
    </div>
  </div>`;
}
function handbarHTML(){ const F=G.fight; const alive=F.enemies.filter(e=>e.alive).length; return `<span class="muted small">Turn ${F.turn} · tap an enemy to target it · ${alive} ${alive===1?'enemy':'enemies'} left</span><span class="piles"><span title="Draw pile"><i>🂠</i>Draw <b>${F.draw.length}</b></span><span title="Discard pile"><i>🗂️</i>Discard <b>${F.discard.length}</b></span><span title="Exhausted this fight"><i>💨</i>Exhaust <b>${F.exhaust.length}</b></span></span>`; }
function battleHTML(){
  const F=G.fight; UI.handUids=[];
  return `<div id="battle" data-key="${F.key}" class="battle">
    ${hudHTML({bars:false})}
    <div class="arena ${UI.intro?'intro':''}"><div class="field">${F.enemies.map((e,i)=>enemyHTML(e,i)).join('')}</div>${logHTML()}</div>
    <div class="handwrap"><div class="handbar">${handbarHTML()}</div><div class="hand">${handHTML()}</div></div>
    ${playerHTML()}
  </div>`;
}
// The top of a dungeon: its name, what lives there, the plan of the climb, and the way in.
function planStripHTML(D,big){ return `<span class="plan${big?' big':''}" title="The climb: ${D.len} fights${D.plan.includes('elite')?', an elite in the middle':''}, the boss at the bottom">${D.plan.map((k,i)=>`<i class="${i<D.step?'done':i===D.step?'now':''} ${k}" title="${k==='boss'?'Boss':k==='elite'?'Elite':'Fight'} ${i+1}">${PLAN_ICON[k]}</i>`).join('')}</span>`; }
function descentHTML(){
  const D=G.dungeon; const T=THEMES[D.theme]; const elite=D.plan.includes('elite'); const bossName=(BOSSES.find(b=>b.id===T.boss)||{}).name||'the boss'; const els=T.els.map(k=>EL[k].i+' '+EL[k].n).join(' and ');
  return `<div class="center scene descent k-${D.theme}" style="--th:${T.c}">
    <div class="eyebrow">Dungeon ${D.n} · rounds ${D.first} to ${D.first+D.len-1}</div>
    <div class="iart"><span class="ii">${T.i}</span></div>
    <h2 class="stitle pop">${esc(T.n)}</h2>
    <p class="itext">${D.len} fight${D.len>1?'s':''} down${elite?', an elite in the middle':''}, and ${esc(bossName)} at the bottom. Creatures of ${els}.</p>${D.final?`<p class="msg bad">The final boss waits at round ${FINAL_ROUND}. Past it, the climb is for the high score.</p>`:''}
    ${planStripHTML(D,true)}
    <div class="row center"><button class="btn primary big" data-act="enter">Enter →</button></div>
  </div>`;
}
function kitHTML(){
  const K=G.p.kit||newKit();
  const hand=K.hand.map(c=>cardHTML(c.id,{mode:'static'})).join('')||'<div class="muted small emptyhand">Your hand is empty. It refills when a fight starts.</div>';
  const pas=K.passives.map(p=>`<span class="pdi" style="--el:${EL[p.el].c}">${p.icon} ${esc(p.name)}</span>`).join('')||'<span class="muted small">none in play</span>';
  return `<div class="kit"><div class="kithand">${hand}</div><div class="kitside"><div><b>Hand</b> ${K.hand.length} · draw ${K.draw.length} · discard ${K.discard.length}</div><div><b>Mana</b> ${K.energy||0} / ${MANA_CAP}</div><div><b>Passives</b> ${K.passives.length} / ${PS('slots')}</div><div class="pd">${pas}</div></div></div>`;
}
// The keeper's hall: the keeper at his candle, four services as small cards (art tile, name plaque, dotted box), then the cards for sale.
function keeperHTML(){
  const K=G.keeper; if(!K) return '';
  const p=G.p; const T=themeNow(); const next=G.dungeon.n+1; const eliteNext=next%ELITE_EVERY===0;
  const owned=id=>p.deck.includes(id)||(p.stash||[]).includes(id);
  const offers=K.offers.map(id=>cardHTML(id,{act:K.used.buy?null:'keeper-buy',data:`data-id="${id}"`,price:cardPrice(id),tag:owned(id)?(canEvolve(id)?`Owned · evolve to ${TIERS[curTier(id)+1]}`:'Owned · copy'):null,dim:K.used.buy||p.gold<cardPrice(id)})).join('');
  const svc=(act,cls,icon,name,price,desc,used,disabled)=>`<button class="svc ${cls} ${used?'used':''}" data-act="${act}" ${disabled?'disabled':''}><span class="svart"><span>${icon}</span></span><span class="svname">${name}</span>${price?`<span class="svprice">${price}</span>`:''}<span class="svdesc">${desc}</span></button>`;
  return `<div class="scene keeper">
    <div class="eyebrow">After the ${esc(T.n)} · dungeon ${G.dungeon.n} · ${p.gold} gold</div>
    <div class="kart"><span>🕯️</span></div>
    <h2 class="stitle">The Keeper</h2>
    <p class="itext">${K.msg?esc(K.msg):`"You found the way out. Sit. Trade. Then down again." The keeper pays ${K.purse} gold for what you carried down.`}</p>
    <div class="ksvc">
      ${svc('keeper-rest','rest','🛏️','Rest',`${restCost()} gold`,K.used.rest?'Done for this visit.':p.hp>=p.maxHp?'You are already rested.':'Sleep by the fire and heal to full.',K.used.rest,K.used.rest||p.hp>=p.maxHp)}
      ${svc('keeper-smith','smith','⚒️','Blacksmith','',K.used.smith?'Done for this visit.':'Evolve one card one tier higher, for gold.',K.used.smith,K.used.smith)}
      ${svc('keeper-remove','remove','🕊️','Let a card go',`+${removeCost()} gold`,K.used.remove?'Done for this visit.':'The keeper takes one card off your hands.',K.used.remove,K.used.remove)}
      ${svc('keeper-pack','pack','📦','Pack',`${p.deck.length} / ${DECK_MAX} carried`,`${(p.stash||[]).length} in the pack. Swap cards between deck and pack.`,false,false)}
    </div>
    <div class="eyebrow">${K.used.buy?'Bought for this visit':'Buy one card'}</div>
    <div class="shopcards">${offers}</div>
    <button class="btn primary kdesc" data-act="keeper-descend">Descend to dungeon ${next} · ${dungeonLen(next)} fights${eliteNext?', an elite in the middle':''}, the boss at the bottom →</button>
  </div>`;
}
function spoilsHTML(){
  const r=G.spoils; const p=G.p; const done=spoilsDone(r);
  const title=r.final?'The bottom of the world':r.kind==='boss'?'Boss slain':r.kind==='elite'?'Elite slain':'Victory';
  const msgs=(r.msgs||(r.cardMsg?[r.cardMsg]:[])).map((m,i)=>`<p class="line" style="--i:${i}">${esc(m)}</p>`).join('');
  const levelPicks=(r.picks||0)-(r.bossPick?1:0); const lvlOfPick=p.level-levelPicks+1;
  return `<div class="center scene spoils k-${r.kind}">
    <div class="iart"><span class="ii">${r.kind==='boss'?'👑':r.kind==='elite'?'⭐':'🏆'}</span></div>
    <h2 class="stitle pop">${title}</h2>
    <div class="kv big"><span>🪙 <b class="countup" data-to="${r.gold}">0</b></span><span>XP <b class="countup" data-to="${r.xp}">0</b></span>${p.level>r.levelBefore?`<span class="good">Level <b>${p.level}</b>!</span>`:''}</div>
    <div class="muted small">Level ${p.level} · ${p.xp} / ${p.xpNext} XP · every level lets you choose a new card</div>
    ${msgs?`<div class="lines">${msgs}</div>`:''}
    ${!r.cardTaken&&r.cards?`<div class="eyebrow">${r.bossPick?'The boss drops a card':`Level ${lvlOfPick} · choose a new card`}</div><div class="cardgrid fan">${r.cards.map((id,i)=>cardHTML(id,{big:true,act:'spoils-card',data:`data-id="${id}" style="--i:${i}"`,enter:true,tag:p.deck.includes(id)?(canEvolve(id)?`Owned · evolve to ${TIERS[curTier(id)+1]}`:'Owned · copy'):null})).join('')}</div><button class="btn ghost sm" data-act="spoils-skip">Skip</button>`:''}
    ${r.cardTaken&&r.drop&&!r.dropTaken?`<div class="eyebrow">☠ ${esc(r.drop.from)} dropped one of its abilities</div><div class="cardgrid fan">${cardHTML(r.drop.id,{big:true,act:'spoils-drop',data:`data-id="${r.drop.id}" style="--i:0"`,enter:true,tag:p.deck.includes(r.drop.id)?(canEvolve(r.drop.id)?`Owned · evolve to ${TIERS[curTier(r.drop.id)+1]}`:'Owned · copy'):null})}</div><button class="btn ghost sm" data-act="spoils-drop-skip">Leave it</button>`:''}
    ${done?`<div class="autobar"><i></i></div><button class="btn sm ghost" data-act="spoils-next">Continue now</button>`:''}
  </div>`;
}
// A find, an event, the treasury: an art panel with the scene's icon (coloured by what it is), the title on a name plaque, the words in a dotted box, plaque buttons.
function interludeHTML(){
  const I=G.inter; const isEv=I.t==='event'; const T=isEv?(EVENTS[I.ev]||{icon:'❔',title:'...'}):(INTERLUDE_TEXT[I.t]||{icon:'❓',title:'...'}); const b=I.boost?BOOST[I.boost]:null;
  const waiting=(I.cards||((I.t==='forge'||I.t==='camp'||I.t==='event')&&!I.auto))&&!I.picked;
  const kind=isEv?I.ev:I.t; const icon=b?b.icon:T.icon; const title=b?b.name:T.title;
  return `<div class="center scene inter ${I.t} k-${kind}">
    <div class="eyebrow">${esc(themeNow().n)} · dungeon ${G.dungeon.n} · after fight ${Math.min(G.dungeon.len,G.dungeon.step)} of ${G.dungeon.len}</div>
    <div class="iart ${I.t==='chest'?'chest':''}"><span class="ii">${icon}</span></div>
    <h2 class="stitle pop">${esc(title)}</h2>
    ${T.text&&!b?`<p class="itext">${esc(T.text)}</p>`:''}
    ${I.lines.length?`<div class="lines">${I.lines.map((l,i)=>`<p class="line" style="--i:${i}">${esc(l)}</p>`).join('')}</div>`:''}
    ${I.cards&&!I.picked?`<div class="cardgrid fan">${I.cards.map((id,i)=>cardHTML(id,{big:true,act:'inter-card',data:`data-id="${id}" style="--i:${i}"`,enter:true,tag:G.p.deck.includes(id)?(canEvolve(id)?`Owned · evolve to ${TIERS[curTier(id)+1]}`:'Owned · copy'):null})).join('')}</div><button class="btn ghost sm" data-act="inter-skip">Take none</button>`:''}
    ${I.t==='forge'&&!I.auto&&!I.picked?(I.pick?`${upgradePairHTML(I.pick)}<div class="row center"><button class="btn primary" data-act="forge-confirm">⚒️ Reforge it</button><button class="btn ghost" data-act="forge-back">Choose another</button></div>`:`<div class="row center"><button class="btn primary" data-act="forge-pick">Choose a card to reforge</button><button class="btn ghost" data-act="inter-next">Leave the forge</button></div>`):''}
    ${I.t==='forge'&&I.picked&&I.pick?`<div class="pair"><div class="pc"><span class="plabel">Reforged · ${TIERS[curTier(I.pick)]}</span>${cardHTML(I.pick,{big:true,mode:'static'})}</div></div>`:''}
    ${isEv&&!I.picked?`<div class="choices">${EVENTS[I.ev].choices.map((c,i)=>`<button class="choice" data-act="event-choice" data-i="${i}">${esc(c.t)}</button>`).join('')}</div>`:''}
    ${I.t==='camp'&&!I.auto&&!I.picked?`<div class="choices two"><button class="choice" data-act="camp-rest">🛏️ Rest<small>Heal ${CAMP.healPct}% of your Max HP.</small></button><button class="choice" data-act="camp-tough">💪 Train<small>+${campTough()} Max HP, for good.</small></button></div>`:''}
    ${I.t==='ambush'?`<p class="msg bad">Prepare yourself.</p>`:waiting?'':`<div class="autobar ${I.picked?'fast':''}"><i></i></div><button class="btn sm ghost" data-act="inter-next">Continue now</button>`}
  </div>`;
}
// Before and after of an upgrade: the card as it is now and as it will be one tier up, side by side; the values that grow are marked.
function upgradePairHTML(id){ const cur=curTier(id), next=Math.min(8,cur+1); return `<div class="pair"><div class="pc"><span class="plabel">Now · ${TIERS[cur]}</span>${cardHTML(id,{big:true,mode:'static',tier:cur,vsTier:cur})}</div><span class="parrow">➜</span><div class="pc"><span class="plabel">After · ${TIERS[next]}</span>${cardHTML(id,{big:true,mode:'static',tier:next,vsTier:cur})}</div></div>`; }
function shopHTML(){
  const p=G.p; const S=G.shop; if(S.pick&&!S.used&&!p.deck.includes(S.pick)) S.pick=null; const pick=S.pick;   // the deck may have changed in the deck manager
  // Every card of the deck at once. Each sits under its upgraded self, which fades in on hover (or keyboard focus); clicking it asks to confirm.
  const grid=deckSummary().map(x=>{ const ok=canEvolve(x.id); if(!ok) return cardHTML(x.id,{mode:'static',tag:'Ultimate',dim:true}); const c=evolvePrice(x.id); const cur=curTier(x.id);
    return `<div class="upwrap ${p.gold<c?'poor':''}"><div class="cur">${cardHTML(x.id,{mode:'static',tier:cur,price:c,priceTag:` → ${TIERS[cur+1]}`})}</div><div class="nxt">${cardHTML(x.id,{act:'shop-pick',data:`data-id="${x.id}"`,tier:cur+1,vsTier:cur,price:c,priceTag:' · after'})}</div></div>`; }).join('');
  let body;
  if(S.used) body=`<div class="eyebrow">Done for this visit</div>${pick?`<div class="pair"><div class="pc"><span class="plabel">Reforged · ${TIERS[curTier(pick)]}</span>${cardHTML(pick,{big:true,mode:'static'})}</div></div>`:''}<p class="msg good">${esc(S.used)}. The smith gets back to work; come back in a while.</p>`;
  else if(pick){ const c=evolvePrice(pick); body=`<div class="eyebrow">${esc(CARD[pick].name)} · ${TIERS[curTier(pick)]} → ${TIERS[curTier(pick)+1]}</div>${upgradePairHTML(pick)}<div class="row center"><button class="btn primary" data-act="shop-confirm" data-id="${pick}" ${p.gold<c?'disabled':''}>⚒️ Reforge · ${c} gold</button><button class="btn ghost" data-act="shop-back">Choose another</button></div>${p.gold<c?'<p class="msg bad">Not enough gold.</p>':''}`; }
  else body=`<div class="eyebrow">Upgrade one card · hover a card to see it upgraded, click to reforge it${G.keeper?' · swap cards in and out through the Deck button':''}</div><div class="shopcards all">${grid}</div>`;
  return `<div class="scene shop">
    <div class="row between"><h2>⚒️ Blacksmith${G.keeper?" · the keeper's forge":''}</h2><button class="btn primary" data-act="shop-leave">${G.keeper?'Back to the keeper':'Back'} →</button></div>
    ${body}
  </div>`;
}
function gameoverHTML(){
  const b=G.best||getBest()||{};
  return `<div class="center scene">
    <div class="sicon"><span>💀</span></div>
    <h1 class="pop">You died</h1>
    <p class="muted">Round ${G.rounds||0}${G.won?' · the final boss slain':''} · Dungeon ${G.dungeon?G.dungeon.n:1} · ${G.fights||0} fights won · Level ${G.p.level} · ${G.kills} enemies slain · ${G.bossesSlain} lairs · ${G.p.deck.length} cards · ${G.evolves} evolutions</p>
    <p class="muted small">${G.fight&&G.fight.enemies?`Slain by ${esc(G.fight.enemies.filter(e=>e.alive).map(e=>e.name).join(' and ')||'your own recklessness')}.`:''} Permadeath: this run is gone.</p>
    ${b.round||b.depth?`<div class="kv"><span>Deepest round <b>${b.round||0}</b></span><span>Dungeon <b>${b.depth}</b></span><span>Runs <b>${b.runs}</b></span>${b.won?`<span class="good">Final boss slain <b>${b.won}×</b></span>`:''}</div>`:''}
    <div class="row center"><button class="btn primary big" data-act="new">Start over</button><button class="btn ghost" data-act="title">Title screen</button></div>
  </div>`;
}
