'use strict';
// ===================== SCREENS =====================
function render(){
  const app=document.getElementById('app'); if(!app) return;
  if(!G){ app.innerHTML=titleHTML()+modalHTML(); return; }
  if(G.phase==='battle'&&G.fight){ const cur=app.querySelector('#battle'); if(cur&&cur.dataset.key==String(G.fight.key)){ patchBattle(); const mm=app.querySelector('.modal'); if(mm) mm.remove(); app.insertAdjacentHTML('beforeend',modalHTML()); return; } }
  let html='';
  switch(G.phase){
    case 'battle': html=battleHTML(); break;
    case 'spoils': html=hudHTML()+spoilsHTML(); break;
    case 'interlude': html=hudHTML()+interludeHTML(); break;
    case 'shop': html=hudHTML()+shopHTML(); break;
    case 'gameover': html=gameoverHTML(); break;
    default: html=hudHTML();
  }
  app.innerHTML=html+modalHTML(); if(typeof afterRender==="function") afterRender();
  const lg=app.querySelector('.log'); if(lg) lg.scrollTop=lg.scrollHeight;
  if(G.shop&&G.shop.gamble&&G.shop.gamble.flipping) G.shop.gamble.flipping=false;
}
function patchBattle(){
  const F=G.fight; const app=document.getElementById('app');
  const hud=app.querySelector('.hud'); if(hud) hud.outerHTML=hudHTML();
  F.enemies.forEach((e,i)=>{ const n=app.querySelector(`.enemy[data-uid="${e.uid}"]`); if(!n) return; n.classList.toggle('sel',F.target===i&&e.alive); n.classList.toggle('dead',!e.alive); const bar=n.querySelector('.ehp i'); if(bar) bar.style.width=(e.hp/e.maxHp*100)+'%'; const bt=n.querySelector('.ehp b'); if(bt) bt.textContent=`${e.hp} / ${e.maxHp}`; const st=n.querySelector('.statuses'); if(st) st.innerHTML=enemyStatusesHTML(e); const it=n.querySelector('.intent'); if(it) it.innerHTML=enemyIntentHTML(e); const ep=n.querySelector('.epassives'); if(ep) ep.innerHTML=enemyPassivesHTML(e); });
  const sl=app.querySelector('.slots'); if(sl) sl.innerHTML=slotsHTML();
  const lg=app.querySelector('.log'); if(lg){ lg.outerHTML=logHTML(); const l2=app.querySelector('.log'); l2.scrollTop=l2.scrollHeight; }
  const pl=app.querySelector('.player'); if(pl) pl.outerHTML=playerHTML();
  const hand=app.querySelector('.hand'); if(hand) hand.innerHTML=handHTML();
  const hb=app.querySelector('.handbar'); if(hb) hb.innerHTML=handbarHTML();
}
function titleHTML(){
  const s=loadSave(); const best=getBest();
  return `<div class="center title">
    <div class="eyebrow">An endless deck-building roguelike</div>
    <div class="title-art"><span>Deckfall</span><span>Endless</span></div>
    <p class="title-sub">Start with basic cards. Fight, loot, evolve, combo. Ten elements, nine tiers, an endless climb. Die, and start over.</p>
    <div class="row center">
      ${s?`<button class="btn primary big" data-act="continue">Continue · Round ${s.round}</button>`:''}
      <button class="btn ${s?'':'primary'} big" data-act="new">${s?'New run (deletes save)':'Begin'}</button>
      <button class="btn ghost" data-act="modal" data-m="help">How to play</button>
    </div>
    ${best&&best.round?`<div class="kv"><span>Best round <b>${best.round}</b></span><span>Kills <b>${best.kills}</b></span><span>Level <b>${best.level}</b></span><span>Bosses <b>${best.bosses}</b></span><span>Runs <b>${best.runs}</b></span></div>`:''}
    <div class="muted small">${CARDS.filter(c=>c.type!=='curse').length} cards · ${Object.keys(EL).length-1} elements · ${TIERS.length} tiers · ${ENEMIES.length} enemies · ${BOSSES.length} bosses · ${ULTS.length} ultimates</div>
  </div>`;
}
function handbarHTML(){ const F=G.fight; const alive=F.enemies.filter(e=>e.alive).length; return `<span class="muted small">Turn ${F.turn} · tap an enemy to target it · ${alive} ${alive===1?'enemy':'enemies'} left</span><span class="piles"><span>Draw ${F.draw.length}</span><span>Discard ${F.discard.length}</span><span>Exhaust ${F.exhaust.length}</span></span>`; }
function battleHTML(){
  const F=G.fight; UI.handUids=[];
  return `<div id="battle" data-key="${F.key}" class="battle">
    ${hudHTML()}
    <div class="arena"><div class="field">${F.enemies.map((e,i)=>enemyHTML(e,i)).join('')}</div>${logHTML()}</div>
    ${playerHTML()}
    <div class="handwrap"><div class="handbar">${handbarHTML()}</div><div class="hand">${handHTML()}</div></div>
    <div class="slots" data-act="passives">${slotsHTML()}</div>
  </div>`;
}
function spoilsHTML(){
  const r=G.spoils; const done=r.cardTaken&&(!r.ultOffer||r.ultTaken);
  const title=r.kind==='boss'?'Boss slain':r.kind==='elite'?'Elite slain':'Victory';
  return `<div class="center scene">
    <h1 class="pop">${title}</h1>
    <div class="kv big"><span>🪙 <b class="countup" data-to="${r.gold}">0</b></span><span>XP <b class="countup" data-to="${r.xp}">0</b></span>${G.p.level>r.levelBefore?`<span class="good">Level <b>${G.p.level}</b>!</span>`:''}</div>
    ${r.cardTaken?`<p class="msg">${esc(r.cardMsg)}</p>`:`<div class="eyebrow">${r.kind==='boss'?'The boss drops a card':'Take a card'}</div><div class="cardgrid fan">${r.cards.map((id,i)=>cardHTML(id,{big:true,act:'spoils-card',data:`data-id="${id}" style="--i:${i}"`,enter:true,tag:G.p.deck.includes(id)?(canEvolve(id)?`Owned · evolve to ${TIERS[curTier(id)+1]}`:'Owned · copy'):null})).join('')}</div><button class="btn ghost sm" data-act="spoils-skip">Skip</button>`}
    ${r.ultOffer&&!r.ultTaken?`<div class="eyebrow">The boss's power is yours</div><div class="upgrades narrow">${r.ultOffer.map(id=>{const u=ULT[id];return `<div class="upg"><div class="uname">${u.icon} ${u.name} ${elPill(u.el)}</div><div class="udesc">${u.desc}</div><button class="btn sm primary" data-act="spoils-ult" data-id="${id}">Learn</button></div>`;}).join('')}</div><button class="btn ghost sm" data-act="spoils-ult">Keep ${ULT[G.p.ult].name}</button>`:''}
    ${r.ultTaken&&r.ultMsg?`<p class="msg">${esc(r.ultMsg)}</p>`:''}
    ${done?`<div class="autobar"><i></i></div><button class="btn sm ghost" data-act="spoils-next">Continue now</button>`:''}
  </div>`;
}
function interludeHTML(){
  const I=G.inter; const T=INTERLUDE_TEXT[I.t]||{icon:'❓',title:'...'}; const b=I.boost?BOOST[I.boost]:null;
  const waiting=I.cards&&!I.picked;
  return `<div class="center scene inter ${I.t}">
    <div class="eyebrow">Round ${G.round} · on the road</div>
    <div class="sicon ${I.t==='chest'?'chest':''}"><span>${b?b.icon:T.icon}</span></div>
    <h2 class="pop">${b?esc(b.name):esc(T.title)}</h2>
    ${T.text&&!b?`<p class="muted">${esc(T.text)}</p>`:''}
    <div class="lines">${I.lines.map((l,i)=>`<p class="line" style="--i:${i}">${esc(l)}</p>`).join('')}</div>
    ${I.cards&&!I.picked?`<div class="cardgrid fan">${I.cards.map((id,i)=>cardHTML(id,{big:true,act:'inter-card',data:`data-id="${id}" style="--i:${i}"`,enter:true,tag:G.p.deck.includes(id)?(canEvolve(id)?`Owned · evolve to ${TIERS[curTier(id)+1]}`:'Owned · copy'):null})).join('')}</div><button class="btn ghost sm" data-act="inter-skip">Take none</button>`:''}
    ${I.t==='ambush'?`<p class="msg bad">Prepare yourself.</p>`:waiting?'':`<div class="autobar ${I.picked?'fast':''}"><i></i></div><button class="btn sm ghost" data-act="inter-next">Continue now</button>`}
  </div>`;
}
function shopHTML(){
  const s=G.shop; const p=G.p; const tab=s.tab||'wares';
  const tabs=`<div class="tabs"><button class="tab ${tab==='wares'?'on':''}" data-act="shop-tab" data-t="wares">Cards</button><button class="tab ${tab==='attr'?'on':''}" data-act="shop-tab" data-t="attr">Attributes</button><button class="tab ${tab==='forge'?'on':''}" data-act="shop-tab" data-t="forge">Forge</button><button class="tab ${tab==='coin'?'on':''}" data-act="shop-tab" data-t="coin">Lucky Coin</button></div>`;
  let body='';
  if(tab==='wares') body=`<div class="eyebrow">Cards · buying an owned card evolves it</div><div class="shopcards">${s.cards.length?s.cards.map(id=>cardHTML(id,{act:'shop-card',data:`data-id="${id}"`,price:cardPrice(id),priceTag:p.deck.includes(id)?(canEvolve(id)?' · evolve':' · copy'):'',dim:p.gold<cardPrice(id)})).join(''):'<span class="muted">Sold out.</span>'}</div>
    <div class="eyebrow">Potions · 20% off</div><div class="shopcards">${s.pots.length?s.pots.map(id=>cardHTML(id,{act:'shop-pot',data:`data-id="${id}"`,price:Math.round(cardPrice(id)*0.8),priceTag:p.deck.includes(id)?' · evolve':'',dim:p.gold<Math.round(cardPrice(id)*0.8)})).join(''):'<span class="muted">Sold out.</span>'}</div>
    <div class="row"><button class="btn" data-act="shop-reroll" ${p.gold<shopRerollCost()?'disabled':''}>Reroll wares · ${shopRerollCost()} 🪙</button></div>`;
  else if(tab==='attr') body=`<div class="eyebrow">Attributes · permanent</div><div class="upgrades">${s.upg.map(k=>{const u=UPG.find(x=>x.k===k);const pr=upgPrice(u);return `<div class="upg"><div class="uname">${STATNAMES[k]} <span class="tag">now ${p[k]}${['dodge','counter','crit','lifesteal','ultPower'].includes(k)?'%':''}</span></div><div class="udesc">+${u.v} · ${u.d}</div><button class="btn sm ${p.gold>=pr?'primary':''}" data-act="shop-upg" data-k="${k}" ${p.gold<pr?'disabled':''}>Buy · ${pr} 🪙</button></div>`;}).join('')}</div>
    <div class="row"><button class="btn" data-act="shop-heal" ${p.gold<shopHealCost()||p.hp>=p.maxHp?'disabled':''}>Heal 30% · ${shopHealCost()} 🪙</button></div>`;
  else if(tab==='forge') body=`<div class="eyebrow">Forge</div><p class="muted">Evolve any card one tier. Price depends on the tier it becomes. Or pay to forget a card that no longer fits your plan.</p><div class="row"><button class="btn primary" data-act="shop-evolve">Evolve a card</button><button class="btn" data-act="shop-remove" ${p.gold<shopRemoveCost()?'disabled':''}>Remove a card · ${shopRemoveCost()} 🪙</button></div><div class="tierrow">${TIERS.map(t=>`<span class="tierchip" style="--tier:${TIER[t].c}">${t}</span>`).join('<span class="muted">→</span>')}</div>`;
  else body=gambleHTML();
  return `<div class="scene shop">
    <div class="row between"><h2>🏪 Merchant · Round ${G.round}</h2><button class="btn primary" data-act="shop-leave">Continue the climb →</button></div>
    ${tabs}<div class="shopbody">${body}</div>
  </div>`;
}
function gambleHTML(){
  const g=G.shop.gamble; const p=G.p; const ch=gambleChance();
  const coin=`<div class="coin ${g.flipping?'spin':''}">${g.last==='win'?'👑':g.last==='lose'?'💀':'🪙'}</div>`;
  let body='';
  if(g.phase!=='double'){
    body=`${g.phase==='lost'?`<p class="msg bad">Tails. You lose ${g.bet} gold${g.streak?' and the whole pot':''}.</p>`:g.phase==='done'?`<p class="msg good">You walk away with ${g.pot} gold.</p>`:''}
      <p class="muted">Bet gold. Heads doubles it, then you may double again and again. One tails and the whole pot is gone. Win chance <b>${ch}%</b>${PS('luck')?` (Luck ${PS('luck')})`:''}.</p>
      <div class="row center">${[10,25,50,100].map(v=>`<button class="btn" data-act="bet" data-v="${v}" ${p.gold<v?'disabled':''}>${v}</button>`).join('')}<button class="btn" data-act="bet" data-v="25%" ${p.gold<4?'disabled':''}>25%</button><button class="btn" data-act="bet" data-v="50%" ${p.gold<2?'disabled':''}>50%</button><button class="btn danger" data-act="bet" data-v="all" ${p.gold<1?'disabled':''}>All in (${p.gold})</button></div>
      <div class="row center"><label for="betInput" class="small muted">Custom</label><input id="betInput" type="number" min="1" max="${p.gold}" value="${Math.min(p.gold,20)}"><button class="btn" data-act="bet" data-v="custom" ${p.gold<1?'disabled':''}>Flip</button></div>`;
  } else {
    body=`<p class="msg good">Heads! ${g.streak?`Streak ${g.streak}.`:''}</p><div class="pot">Pot ${g.pot} 🪙</div>
      <p class="muted">Double to ${g.pot*2}? Win chance <b>${ch}%</b>. Lose and the pot, bet included, is gone.</p>
      <div class="row center"><button class="btn danger" data-act="double">Double up</button><button class="btn primary" data-act="cashout">Cash out ${g.pot}</button></div>`;
  }
  return `<div class="center">${coin}${body}</div>`;
}
function gameoverHTML(){
  const b=G.best||getBest()||{};
  return `<div class="center scene">
    <div class="sicon"><span>💀</span></div>
    <h1 class="pop">You died</h1>
    <p class="muted">Round ${G.round} · Level ${G.p.level} · ${G.kills} enemies slain · ${G.bossesSlain} bosses · ${G.p.deck.length} cards · ${G.evolves} evolutions</p>
    <p class="muted small">${G.fight&&G.fight.enemies?`Slain by ${esc(G.fight.enemies.filter(e=>e.alive).map(e=>e.name).join(' and ')||'your own recklessness')}.`:''} Permadeath: this run is gone.</p>
    ${b.round?`<div class="kv"><span>Best round <b>${b.round}</b></span><span>Runs <b>${b.runs}</b></span></div>`:''}
    <div class="row center"><button class="btn primary big" data-act="new">Start over</button><button class="btn ghost" data-act="title">Title screen</button></div>
  </div>`;
}
