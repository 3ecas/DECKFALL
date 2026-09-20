'use strict';
// ===================== UI COMPONENTS =====================
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function elPill(el){ const e=EL[el]; return `<span class="elpill" style="--el:${e.c}">${e.i} ${e.n}</span>`; }
const KIND_LABEL={mecha:'Machine',summon:'Summon',trap:'Trap'};
// One effect -> {big, unit, text, short}. big/unit/text feed the info box; short is the extra line.
function fxPart(f,v,base,d){
  const t=f[0]; const n=k=>v[k]>base[k]?`<i class="up">${v[k]}</i>`:`${v[k]}`; const elN=EL[d.el].n.toLowerCase();
  if(t==='dmg'){ const o=f[2]||{}; const hits=o.hits?(typeof o.hits==='string'?v[o.hits]:o.hits):1; const bits=[`${elN} damage`]; if(hits>1) bits[0]+=` × ${hits}`; if(o.aoe) bits.push('to all enemies'); if(o.pierce) bits.push('pierces Block'); if(o.bv) bits.push(`×2 vs ${ST[o.bv].n}`); if(o.ls) bits.push(`heals ${o.ls}%`); return {big:n(f[1]),unit:'DMG',text:bits.join(' · '),short:`${n(f[1])}${hits>1?'×'+hits:''} ${elN} dmg${o.aoe?' to all':''}${o.pierce?', pierces':''}${o.bv?', ×2 vs '+ST[o.bv].n:''}${o.ls?', heals '+o.ls+'%':''}`}; }
  if(t==='block') return {big:n(f[1]),unit:'BLOCK',text:'absorbs damage this turn',short:`Gain ${n(f[1])} Block`};
  if(t==='armor') return {big:`+${n(f[1])}`,unit:'ARMOR',text:'for this fight',short:`+${n(f[1])} Armor this fight`};
  if(t==='se'){ const o=f[3]||{}; const tg=o.aoe?'to all enemies':'to the target'; if(f[1]==='frozen') return {big:'❄',unit:'FREEZE',text:o.aoe?'all enemies skip a turn':'the target skips a turn',short:`Freeze ${o.aoe?'all enemies':'the target'}`}; return {big:n(f[2]),unit:ST[f[1]].n.toUpperCase(),text:tg,short:`Apply ${n(f[2])} ${ST[f[1]].n}${o.aoe?' to all':''}`}; }
  if(t==='ss'){ const s=f[1]; if(s==='dodgeNext') return {big:'💨',unit:'DODGE',text:'the next attack',short:'Dodge the next attack'}; if(s==='counterNext') return {big:'🗡',unit:'COUNTER',text:'the next attack',short:'Counter the next attack'}; const pct=(s==='critT'||s==='dodgeT')?'%':''; return {big:`+${n(f[2])}${pct}`,unit:ST[s].n.toUpperCase(),text:'this fight',short:`+${n(f[2])}${pct} ${ST[s].n} this fight`}; }
  if(t==='heal') return {big:n(f[1]),unit:'HEAL',text:'restore HP',short:`Heal ${n(f[1])}`};
  if(t==='healPct') return {big:`${n(f[1])}%`,unit:'HEAL',text:'of Max HP',short:`Heal ${n(f[1])}% Max HP`};
  if(t==='draw') return {big:n(f[1]),unit:'DRAW',text:'cards',short:`Draw ${n(f[1])}`};
  if(t==='energy') return {big:`+${n(f[1])}`,unit:'MANA',text:'this turn',short:`+${n(f[1])} Mana`};
  if(t==='maxEnergy') return {big:`+${n(f[1])}`,unit:'MANA',text:'every turn this fight',short:`+${n(f[1])} Mana every turn`};
  if(t==='selfDmg') return {big:`-${n(f[1])}`,unit:'HP',text:'you bleed',short:`Lose ${n(f[1])} HP`};
  if(t==='cleanse') return {big:'✚',unit:'CLEANSE',text:'remove your debuffs',short:'Remove your debuffs'};
  if(t==='stat') return {big:`+${n(f[2])}`,unit:STATNAMES[f[1]].toUpperCase(),text:'permanently',short:`+${n(f[2])} ${STATNAMES[f[1]]} permanently`};
  if(t==='passive'){ const P=PASSIVES[f[1]]; const txt=passiveText(f[1],v); return {big:P.icon,unit:KIND_LABEL[P.kind].toUpperCase(),text:txt,short:P.name,line:txt}; }
  if(t==='special'){ const s=f[1]; const p=f[2]||{}; const m=p.m?n(p.m):'';
    if(s==='execute') return {big:n('dmg'),unit:'DMG',text:`${elN} · ×2 below ${p.pct||30}% HP`,short:`${n('dmg')} dmg, ×2 below ${p.pct||30}% HP`};
    if(s==='snipe') return {big:n('dmg'),unit:'DMG',text:'pierces Block · +50% crit',short:`${n('dmg')} dmg, pierces, +50% crit`};
    if(s==='retaliation') return {big:`${m}×`,unit:'THORNS',text:'as physical damage',short:`${m}× Thorns as damage`};
    if(s==='stDmg') return {big:`${m}×`,unit:ST[p.s].n.toUpperCase(),text:`as ${elN} damage${p.aoe?' to all':''}${p.consume?' · consumes it':''}`,short:`${m}× ${ST[p.s].n} as damage`};
    if(s==='doubleSt') return {big:'×2',unit:ST[p.s].n.toUpperCase(),text:p.aoe?'on every enemy':'on the target',short:`Double ${ST[p.s].n}${p.aoe?' on all':''}`};
    if(s==='spread') return {big:'⇶',unit:'SPREAD',text:"the target's afflictions to all enemies",short:'Spread afflictions to all'};
    if(s==='blockDmg') return {big:`${m}×`,unit:'BLOCK',text:`as ${elN} damage`,short:`${m}× Block as damage`};
    if(s==='playedDmg') return {big:m,unit:'DMG',text:'per card played this turn',short:`${m} dmg per card played`};
    if(s==='elBoost') return {big:`+${n(p.v)}%`,unit:EL[p.el].n.toUpperCase(),text:'damage this fight',short:`+${n(p.v)}% ${EL[p.el].n} damage this fight`};
    if(s==='parry') return {big:'×2',unit:'COUNTER',text:'that counter hits twice as hard',short:'Counter deals double'};
    if(s==='redraw') return {big:n(p.n),unit:'REDRAW',text:'discard random cards, draw as many',short:`Discard ${n(p.n)}, draw ${n(p.n)}`};
    if(s==='sabotage') return {big:'✖',unit:'SABOTAGE',text:'destroy an enemy machine, summon or trap',short:'Destroy an enemy passive'};
    if(s==='emp') return {big:'✖✖',unit:'EMP',text:'destroy every enemy passive',short:'Destroy all enemy passives'};
    if(s==='pilfer') return {big:'☗',unit:'STEAL',text:'take an enemy passive for yourself',short:'Steal an enemy passive'};
    if(s==='pilferAll') return {big:'☗☗',unit:'STEAL',text:'take every enemy passive',short:'Steal all enemy passives'};
    if(s==='mimic') return {big:'🎩',unit:'CONJURE',text:"a card of the enemy's element into your hand",short:'Conjure an enemy-element card'}; }
  return {big:'?',unit:'',text:'',short:''};
}
function foeName(id){ const e=(typeof ENEMIES!=='undefined'&&ENEMIES.find(x=>x.id===id))||(typeof BOSSES!=='undefined'&&BOSSES.find(x=>x.id===id)); return e?e.name:id; }
function cardParts(id,tier){
  const d=CARD[id]; const v=cardVals(id,tier); const base=cardVals(id,tierIdx(id)); const parts=d.fx.map(f=>fxPart(f,v,base,d));
  let main=parts[0]||(d.unplayable?{big:'☠',unit:'CURSE',text:'unplayable · clogs your hand',short:'Unplayable · clogs your hand'}:{big:'',unit:'',text:'',short:''});
  main.line=main.line||main.short||main.text;   // the first description line on the card face
  const extras=parts.slice(1).map(p=>p.short);
  if(d.type==='mecha'||d.type==='summon') extras.push('Takes a passive slot');
  if(d.type==='trap'&&d.fx[0]&&d.fx[0][0]==='passive') extras.push('Armed until an enemy attacks');
  if(d.retain) extras.push('Block carries over');
  if(d.exhaust) extras.push('Exhaust');
  if(d.consume) extras.push('Consumed when played');
  if(d.endTurnDmg) extras.push(`${d.endTurnDmg} damage at end of turn in hand`);
  return {main,extras};
}
// Card face (see CARD REF.png): name box top-left, Mana cost top-right (nothing when the card is free), art panel, dotted info box
// with the element tag and the effect lines, evolution badge (▲n) bottom-left, card kind (attack, spell, trap…) bottom-right.
// The whole background is the tier colour.
function cardHTML(id,o){
  o=o||{}; const d=CARD[id]; const tier=o.tier!=null?o.tier:(G?curTier(id):tierIdx(id)); const tn=TIERS[tier]; const e=EL[d.el]; const paysMana=d.type==='spell'||d.type==='summon'; const cost=paysMana?d.cost:0;
  const cls=['card','t-'+tn,'ty-'+d.type,'el-'+d.el]; if(o.data&&o.data.includes('data-sel')) cls.push('sel'); if(o.data&&o.data.includes('data-fan')) cls.push('fanc'); if(o.big) cls.push('big'); if(o.mode==='static') cls.push('static'); if(d.unplayable) cls.push('unplayable'); if(o.dim) cls.push('unaff'); if(o.enter) cls.push('enter');
  const evo=tier-tierIdx(id); const {main,extras}=cardParts(id,tier);
  const nameCls=d.name.length>18?' xl':d.name.length>12?' long':'';
  const costBox=paysMana?`<div class="ccost" title="Mana cost"><b>${cost}</b></div>`:'';
  return `<div class="${cls.join(' ')}" style="--el:${e.c};--tier:${TIER[tn].c}" ${o.act?`data-act="${o.act}"`:''} ${o.data||''} data-card="${id}" data-tier="${tier}" tabindex="0">
    <div class="cname${nameCls}">${esc(d.name)}</div>
    ${costBox}
    <div class="cart"><span>${d.icon}</span></div>
    <div class="cbox">
      <div class="ctags"><span class="ctag" title="Element">${e.n}</span><span class="ctier" title="Tier">${tn}</span></div>
      <div class="cdesc"><p class="cmain">${main.line}</p>${extras.map(x=>`<p class="cext">${x}</p>`).join('')}</div>
    </div>
    ${evo>0?`<div class="cevo" title="Evolved ${evo} tier${evo>1?'s':''} above its base"><i></i>${evo}</div>`:''}
    <div class="ckind" title="${TYPES[d.type]} · ${TYPE_DESC[d.type]}">${TYPE_ICON[d.type]} ${TYPES[d.type]}</div>
    ${o.price!=null?`<div class="price">${o.price} 🪙${o.priceTag||''}</div>`:''}
    ${o.tag?`<div class="price tagp">${o.tag}</div>`:''}
  </div>`;
}
function passivePlain(p){ return PASSIVES[p.pid].text.replace(/\{(\w+)\}/g,(m,k)=>p.v&&p.v[k]!=null?p.v[k]:'?'); }
function slotsHTML(){
  // The passives drawer: a tab on top of the stats plaque (count plus icon and name of each passive); hovering or tapping it opens the cards above.
  const F=G.fight||G.p.kit||newKit(); const max=PS('slots'); const used=F.passives.filter(Boolean).length; let h='';
  for(let i=0;i<max;i++){ const p=F.passives[i]; h+=p?`<div class="slot ${p.kind}" style="--el:${EL[p.el].c}"><span class="sic">${p.icon}</span><span class="snm">${esc(p.name)}</span><span class="skd">${KIND_LABEL[p.kind]}${p.kind==='trap'?' · armed':''}</span><span class="stx">${esc(passivePlain(p))}</span></div>`:`<div class="slot empty"><span class="skd">empty slot</span></div>`; }
  const names=F.passives.filter(Boolean).map(p=>`<span class="pdi" style="--el:${EL[p.el].c}">${p.icon} ${esc(p.name)}</span>`).join('');
  return `<div class="pdtab"><span>☗ Passives</span><b>${used}/${max}</b>${names||'<span class="pdh">none in play</span>'}</div><div class="pcards">${h}</div>`;
}
function enemyPassivesHTML(e){ return e.passives.map(p=>`<span class="epc ${p.kind}" title="${esc(passivePlain(p))}">${p.icon} ${esc(p.name)}</span>`).join(''); }
// Enemies are cards too: same plaques, element art panel, HP ribbon where a price would sit, dotted box with intent, statuses and passives.
function enemyHTML(e,i){
  const F=G.fight; const sel=F.target===i&&e.alive; const ch=TYPE_CHART[e.el]; const el=EL[e.el];
  const weak=ch.weak.map(x=>`<span title="Weak to ${EL[x].n} (2× damage)">${EL[x].i}</span>`).join('')||'—';
  const res=ch.resist.map(x=>`<span title="Resists ${EL[x].n} (½ damage)">${EL[x].i}</span>`).join('')||'—';
  const rank=e.boss?'boss':e.elite?'elite':'foe'; const body={foe:'#aab4bf',elite:'#e2b45c',boss:'#e0667a'}[rank];
  const nameCls=e.name.length>18?' xl':e.name.length>12?' long':'';
  return `<div class="card enemy el-${e.el} r-${rank} ${sel?'sel':''} ${e.alive?'':'dead'} ${e.boss?'isboss':''}" data-act="target" data-i="${i}" data-uid="${e.uid}" style="--el:${el.c};--tier:${body}" tabindex="0">
    <div class="cname${nameCls}">${esc(e.name)}</div>
    <div class="ccost elv" title="Enemy level"><small>Lv</small><b>${e.lvl||G.round}</b></div>
    <div class="cart"><span>${e.icon}</span></div>
    <div class="bar ehp"><i style="width:${e.hp/e.maxHp*100}%"></i><b class="num">${e.hp} / ${e.maxHp}</b></div>
    <div class="cbox">
      <div class="ctags"><span class="ctag">${el.n}</span><span class="ctier">${e.boss?'Boss':e.elite?'Elite':''}</span></div>
      <div class="intent">${enemyIntentHTML(e)}</div>
      ${NATURE[e.el]?`<div class="etrait">${NATURE[e.el].icon} ${NATURE[e.el].name}${e.armor?` · ${e.armor} armor`:''}</div>`:''}
      <div class="statuses">${enemyStatusesHTML(e)}</div>
      <div class="epassives">${enemyPassivesHTML(e)}</div>
      <div class="ewr"><span class="weak">Weak ${weak}</span><span class="res">Res ${res}</span></div>
    </div>
    <div class="ckind">${e.boss?'☠ Boss':e.elite?'★ Elite':'⚔ Enemy'}</div>
  </div>`;
}
function enemyStatusesHTML(e){
  const sts=Object.entries(e.st).map(([k,v])=>`<span class="st ${k}" title="${ST[k].d}">${ST[k].i} ${k==='frozen'?'Frozen':v}</span>`).join('');
  const blk=e.block>0?`<span class="st block" title="Block absorbs damage this turn">🛡️ ${e.block}</span>`:'';
  const arm=e.armor>0?`<span class="st" title="Armor: flat damage reduction per hit">🪨 ${e.armor}</span>`:'';
  const th=e.thorns>0?`<span class="st thorns" title="Thorns: your attack cards cost you HP">🌵 ${e.thorns}</span>`:'';
  return blk+arm+th+sts;
}
function enemyIntentHTML(e){ const it=e.alive?intentInfo(e):{i:'💀',t:'Slain'}; return `<span>${it.i}</span><span>${it.t}</span>`; }
function boostsHTML(){ return G.boosts.map(b=>`<span class="boost" title="${b.name}: ${b.rounds} fight${b.rounds>1?'s':''} left">${b.icon} ${b.el?'+'+b.v+'% '+EL[b.el].n:'+'+b.v+' '+STATNAMES[b.stat]} <i>${b.rounds}</i></span>`).join(''); }
function gaugesHTML(){
  const p=G.p;
  return `<div class="bar hp" title="Health"><i style="width:${p.hp/p.maxHp*100}%"></i><b class="num">❤ ${p.hp} / ${p.maxHp}</b></div>
      <div class="bar xp" title="Experience: ${p.xp} / ${p.xpNext}"><i style="width:${p.xp/p.xpNext*100}%"></i><b class="num">Lv ${p.level}</b></div>`;
}
function hudHTML(o){
  o=o||{}; const p=G.p;
  return `<div class="hud">
    <div class="hud-l"><span class="round">${G.dungeon?`${themeNow().i} ${esc(themeNow().n)} · Dungeon ${G.dungeon.n} · Room ${G.dungeon.entered} · Danger ${G.round}`:`Round ${G.round}`}</span><span class="gold num" id="goldv">${p.gold}</span></div>
    ${o.bars===false?'':`<div class="bars">${gaugesHTML()}</div>`}
    <div class="boosts">${boostsHTML()}</div>
    <div class="tools"><button class="btn sm" data-act="deck" title="Your deck and your pack">Deck ${p.deck.length}</button><button class="btn sm" data-act="modal" data-m="stats">Stats</button><button class="btn sm" data-act="modal" data-m="chart">Types</button><button class="btn sm" data-act="sound" title="Sound on/off" aria-label="Sound">${SFX.enabled?'🔊':'🔇'}</button><button class="btn sm" data-act="modal" data-m="menu" aria-label="Menu">☰</button></div>
  </div>`;
}
function logHTML(){ return `<div class="log">${G.log.slice(-8).map(l=>`<div class="${l.c}">${esc(l.m)}</div>`).join('')}</div>`; }
function playerStatusesHTML(){
  // Only conditions that are not a base stat: the stat chips already show Block, Strength, Focus, Armor, Thorns, Crit, Dodge and Life Steal as current values.
  const F=G.fight; const out=[];
  for(const [k,v] of Object.entries(F.st)) out.push(`<span class="st ${k}" title="${ST[k].d}">${ST[k].i} ${v}</span>`);
  if(F.regen) out.push(`<span class="st regen" title="${ST.regen.d}">💚 ${F.regen}</span>`);
  for(const el in F.elBoost) out.push(`<span class="st" title="${EL[el].n} damage this fight">${EL[el].i} +${F.elBoost[el]}%</span>`);
  if(F.dodgeNext) out.push(`<span class="st" title="${ST.dodgeNext.d}">💨 Evasive</span>`);
  if(F.counterNext) out.push(`<span class="st" title="${ST.counterNext.d}">🗡️ Riposte${F.parry?' ×2':''}</span>`);
  return out.join('');
}
function playerHTML(){
  const F=G.fight; const p=G.p; const gain=1+F.energyBonus+pSum('manaPerTurn')+pSum('sMana'); const max=MANA_CAP;
  const stat=(i,v,l,t)=>`<span class="stat" title="${t}"><i>${i}</i><b>${v}</b><small>${l}</small></span>`;
  // The stat chips always show the current value, in-fight bonuses included (no separate icons for them).
  const armor=PS('armor')+F.armorT, block=F.block||0;
  const stats=[stat('⚔️',PS('attack')+F.str+pSum('atkBonus'),'Atk','Attack: added to every attack card, summon and machine (Strength included)'),stat('🔮',PS('spell')+F.spellT+pSum('spellBonus'),'Spell','Spell Power: added to every spell (Focus included)'),stat('🎯',(PS('crit')+F.critT)+'%','Crit','Critical chance: 50% bonus damage'),stat('🛡️',armor+block,'Armor',`Damage reduction you will receive: ${block} Block this turn (absorbs damage) + ${armor} Armor (off every hit)`),stat('💨',(PS('dodge')+F.dodgeT)+'%','Dodge','Dodge: chance to avoid an attack'),stat('🗡️',PS('counter')+'%','Counter','Counter: chance to strike back when hit'),stat('🩸',PS('lifesteal')+'%','Steal','Life steal: heal a share of every attack'),stat('🌵',PS('thorns')+F.thornsT+pSum('thorns'),'Thorns','Thorns: attackers take this much damage')];
  const cells=Array.from({length:MANA_CAP},(_,k)=>`<i class="mcell ${k<F.energy?'on':''}"></i>`).join('');
  const sts=playerStatusesHTML();
  return `<div class="player">
    <div class="slots" data-act="passives" title="Your machines, summons and armed traps · hover or tap to open">${slotsHTML()}</div>
    <div class="prow">
      <div class="pbars">${gaugesHTML()}</div><i class="pdiv"></i>
      <div class="pstats">${stats.join('')}</div>
    </div>
    ${sts?`<div class="statuses pstatuses">${sts}</div>`:''}
    <div class="manabar" title="Mana: spells and summons cost Mana, everything else is free. Your first turn of a fight has 0; from the second turn on you gain ${gain} at the start of each turn, up to ${max}, and unspent Mana carries over."><span class="mlbl">Mana</span><div class="mcells">${cells}</div><span class="mval num">${F.energy}<small>/${max}</small></span><button class="btn primary endbtn" data-act="end" ${UI.busy?'disabled':''}>End Turn</button></div>
  </div>`;
}
function handHTML(){
  const F=G.fight; const prev=UI.handUids; const uids=F.hand.map(c=>c.uid);
  if(UI.sel!=null&&UI.sel>=F.hand.length) UI.sel=F.hand.length?F.hand.length-1:null;
  const html=F.hand.map((inst,i)=>cardHTML(inst.id,{act:'play',data:`data-i="${i}" style="--i:${i}"${i===UI.sel?' data-sel="1"':''}`,dim:!canPlay(inst),enter:!prev.includes(inst.uid)})).join('');
  UI.handUids=uids;
  return html||'<div class="muted small emptyhand">No cards in hand.</div>';
}
// ---- floating text, toasts ----
function floatAt(rect,text,cls){ const fxl=document.getElementById('fx'); if(!fxl) return; const d=document.createElement('div'); d.className='float '+cls; d.textContent=text; d.style.left=(rect.left+rect.width/2+(Math.random()*30-15))+'px'; d.style.top=(rect.top+rect.height*0.35+(Math.random()*16-8))+'px'; fxl.appendChild(d); setTimeout(()=>d.remove(),1000); }
function floatE(e,text,cls){ const el=document.querySelector(`.enemy[data-uid="${e.uid}"]`); if(el) floatAt(el.getBoundingClientRect(),text,cls); }
function floatP(text,cls){ const el=document.querySelector('.player'); if(el) floatAt(el.getBoundingClientRect(),text,cls); }
function toast(msg){ const d=document.createElement('div'); d.className='toast'; d.textContent=msg; document.body.appendChild(d); setTimeout(()=>d.remove(),2200); }
// ---- modals ----
function openModal(m){ UI.modal={type:m}; render(); }
function closeModal(){ UI.modal=null; render(); }
function pickDeckCard(title,cb,labelFn){ UI.modal={type:'pick',title,cb,labelFn}; render(); }
function deckSummary(){ const m=deckCounts(); return Object.keys(m).sort((a,b)=>curTier(b)-curTier(a)||CARD[a].cost-CARD[b].cost||a.localeCompare(b)).map(id=>({id,count:m[id]})); }
function modalHTML(){
  const m=UI.modal; if(!m) return '';
  let body='';
  if(m.type==='deck'){ body=`<h2>Your Deck · ${G.p.deck.length} / ${DECK_MAX} cards</h2><p class="muted small">Getting a card you already own evolves it one tier. Gold numbers are evolved values.${G.p.stash&&G.p.stash.length?` 📦 Pack: ${G.p.stash.length} card${G.p.stash.length>1?'s':''} waiting; swap them in at a town.`:''}</p><div class="cardgrid">${deckSummary().map(x=>cardHTML(x.id,{mode:'static',tag:x.count>1?`×${x.count}`:null})).join('')}</div>`; }
  else if(m.type==='pick'){ body=`<h2>${esc(m.title)}</h2><div class="cardgrid">${deckSummary().map(x=>cardHTML(x.id,{act:'pick-card',data:`data-id="${x.id}"`,tag:m.labelFn?m.labelFn(x.id):(x.count>1?`×${x.count}`:null)})).join('')}</div>`; }
  else if(m.type==='stats'){ const p=G.p; const rows=[['Level',p.level],['Max HP',p.maxHp],['Attack',PS('attack')],['Spell Power',PS('spell')],['Armor',PS('armor')],['Dodge',PS('dodge')+'%'],['Counter',PS('counter')+'%'],['Crit',PS('crit')+'%'],['Life Steal',PS('lifesteal')+'%'],['Thorns',PS('thorns')],['Regen',PS('regen')],['Luck',PS('luck')],['Mana per turn','+1'],['Hand size',PS('handSize')],['Passive slots',PS('slots')],['Gold',p.gold],['Enemies slain',G.kills],['Bosses slain',G.bossesSlain],['Cards evolved',G.evolves]];
    body=`<h2>Stats</h2><table class="stats">${rows.map(r=>`<tr><td>${r[0]}</td><td class="num">${r[1]}</td></tr>`).join('')}</table>${G.boosts.length?`<h3>Active boosts</h3><div class="boosts">${boostsHTML()}</div>`:''}`; }
  else if(m.type==='chart'){ body=`<h2>Card types</h2><div class="typegrid">${Object.keys(TYPES).map(t=>`<div class="typerow ty-${t}"><span class="ctypelbl">${TYPE_ICON[t]} ${TYPES[t]}</span><span class="muted small">${TYPE_DESC[t]}</span></div>`).join('')}</div>
    <h2>Type Chart</h2><p class="muted small">Super effective hits deal <b>2×</b>, resisted hits <b>½</b>. Wet targets take +50% Lightning and Ice and half Fire. Attacks, summons and machines scale with Attack; spells with Spell Power.</p><div class="chart"><span class="h">Enemy</span><span class="h">Weak to (2×)</span><span class="h">Resists (½)</span>${Object.keys(TYPE_CHART).filter(k=>k!=='phys').map(k=>`${elPill(k)}<span>${TYPE_CHART[k].weak.map(x=>EL[x].i+' '+EL[x].n).join(', ')||'—'}</span><span>${TYPE_CHART[k].resist.map(x=>EL[x].i+' '+EL[x].n).join(', ')||'—'}</span>`).join('')}</div><h3>Enemy natures</h3><p class="muted small">Every enemy fights by its nature. The trait is written on its card.</p><table class="stats">${Object.keys(NATURE).map(k=>`<tr><td>${NATURE[k].icon} ${NATURE[k].name} <span class="muted">· ${EL[k].n}</span></td><td class="left">${NATURE[k].text}</td></tr>`).join('')}</table><h3>Card tiers</h3><div class="tierrow">${TIERS.map(t=>`<span class="tierchip" style="--tier:${TIER[t].c}">${t} ×${TIER[t].mult}</span>`).join('')}</div><h3>Status effects</h3><table class="stats">${Object.keys(ST).map(k=>`<tr><td>${ST[k].i} ${ST[k].n}</td><td class="left">${ST[k].d}</td></tr>`).join('')}</table>`; }
  else if(m.type==='help'){ body=helpHTML(); }
  else if(m.type==='menu'){ body=`<h2>Menu</h2><div class="choices"><button class="choice" data-act="library">📚 Card Library<small>Every card you have discovered so far.</small></button><button class="choice" data-act="modal" data-m="help">How to play</button><button class="choice" data-act="quit">Save and return to title<small>Your run is saved automatically after every step.</small></button>${m.confirm?`<button class="choice danger" data-act="abandon">Yes, abandon this run for good</button>`:`<button class="choice" data-act="abandon-ask">Abandon run<small>Permadeath applies: the run is deleted.</small></button>`}</div>`; }
  return `<div class="modal" data-act="close"><div class="box" data-act="noop">${body}<div class="row end"><button class="btn" data-act="close">Close</button></div></div></div>`;
}
function helpHTML(){ return `<h2>How to play</h2>
<p><b>Dungeons.</b> You descend through fogged hex dungeons: rooms joined by corridors, dead ends, and an exit you have to find. You see three hexes around you and walls block your sight, so a room reveals itself when you step in. Every new room you enter raises the danger for the rest of that dungeon, and each dungeon starts higher than the last, so loot deeper or leave while you can. Creatures are visible before they see you: most only fight when you step onto them, but some sense you from a hex or two away (their reach is tinted red), and then there is no running. Rooms hold guards, chests, shrines, forges, campfires, blessings, idols, traps and people with offers. Every third dungeon a boss stands on the exit: its card, its treasury, and one more passive slot. Between dungeons the keeper heals you for gold, forges, buys one card, takes one off your hands, and holds your pack.</p>
<p><b>One deck.</b> You carry one deck of at most twenty cards. New cards beyond that go into your pack, and only the keeper lets you swap cards between the deck and the pack.</p>
<p><b>New cards.</b> Fights give gold and XP. Every level you gain lets you choose one of three new cards; that is the only way new cards come to you, apart from bosses and the odd cursed idol. Taking a card you already own evolves it instead.</p>
<p><b>Turns.</b> Your hand, your piles, your Mana and your passives carry from fight to fight. A fight tops your hand up to five cards; at the start of each turn you draw one more, or two if your hand is empty. What you do not play stays in your hand, even between fights (curses rotate back into the deck). <b>Attacks, shields, skills, potions, machines and traps are free.</b> Spells and summons cost Mana, the blue bar under your hand: your first turn of a fight has 0, from the second turn on you gain 1 at the start of each turn (up to 10), and unspent Mana carries over. When nothing in your hand can be played, the turn ends by itself. End Turn lets every enemy act according to the intent shown on its card.</p>
<p><b>Card face.</b> Name top-left. Spells and summons show their Mana cost top-right; a card with no cost box is free to play. The picture in the middle. The dotted box shows the element, the tier and what the card does: the first line is the main effect, the lines underneath are extras. Bottom-right says what kind of card it is (attack, spell, shield, skill, potion, machine, summon, trap). The whole card is coloured by its tier, and a green ▲ badge bottom-left counts how many tiers it has evolved.</p>
<p><b>Tiers.</b> Basic cards do one plain thing. Common, uncommon, medium, good, great, rare, perfect and ultimate cards add effects and grow. Getting a card you already own <b>evolves</b> it one tier, multiplying its numbers. Some cards are born ultimate.</p>
<p><b>Passives.</b> Machines, summons and armed traps take one of your passive slots and stay in play from fight to fight, until they are dismantled, destroyed or replaced. Machines give bonuses (double first attack, block per machine, damage per attack played). Summons act every turn. Traps spring on the next enemy attack. Enemies have passives too, and some can destroy yours. Sabotage, EMP and Pilfer destroy or steal theirs. Yours are listed on the tab above the stats bar; hover or tap it to open the drawer and see their cards.</p>
<p><b>Elements.</b> Ten elements with combos: Fire burns and detonates, Ice chills, freezes and shatters, Lightning shocks and multi-hits, Water soaks, Grass grows, Poison stacks and doubles, Earth turns Block into damage, Shadow steals life, Holy heals and smites. Hit a weakness for <b>2×</b>. Enemies fight by their nature too: fire ones burn you, ice ones chill your Mana, shadow ones drain and fade, earth ones wear stone skin. Each trait is written on the enemy's card; open <b>Types</b> for the full list and the chart.</p>
<p><b>Creature abilities.</b> Every creature has its own moves, played between plain attacks and shown on its card as its next intent. Slay it and it may drop one of them: a real card for your deck, and the only way to get it.</p>
<p><b>Death is final.</b> Enemies scale with the dungeon you are in and the rooms you have entered. When HP hits zero the run ends and you start over with basic cards.</p>
$1In a dungeon, click a hex to walk there (the path shows as you hover) or step with Q E A D Z C; Space acts on your hex. in a fight, A and D (or the arrows) move the highlight along your hand, W jumps up to the enemies where A and D choose who to strike and S comes back down, Space plays the highlighted card, Tab ends the turn, E opens and closes the passives drawer, 1–9 play a card directly. Everywhere else, W A S D (or the arrows) move the highlight over the choices and Space picks it; Esc closes windows.</p>`; }
