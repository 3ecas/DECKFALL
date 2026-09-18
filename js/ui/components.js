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
  if(t==='ult') return {big:`+${n(f[1])}`,unit:'ULT',text:'ultimate charge',short:`+${n(f[1])} Ultimate charge`};
  if(t==='selfDmg') return {big:`-${n(f[1])}`,unit:'HP',text:'you bleed',short:`Lose ${n(f[1])} HP`};
  if(t==='cleanse') return {big:'✚',unit:'CLEANSE',text:'remove your debuffs',short:'Remove your debuffs'};
  if(t==='stat') return {big:`+${n(f[2])}`,unit:STATNAMES[f[1]].toUpperCase(),text:'permanently',short:`+${n(f[2])} ${STATNAMES[f[1]]} permanently`};
  if(t==='passive'){ const P=PASSIVES[f[1]]; return {big:P.icon,unit:KIND_LABEL[P.kind].toUpperCase(),text:passiveText(f[1],v),short:P.name}; }
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
function cardParts(id,tier){
  const d=CARD[id]; const v=cardVals(id,tier); const base=cardVals(id,tierIdx(id)); const parts=d.fx.map(f=>fxPart(f,v,base,d));
  let main=parts[0]||(d.unplayable?{big:'☠',unit:'CURSE',text:'unplayable · clogs your hand'}:{big:'',unit:'',text:''});
  const extras=parts.slice(1).map(p=>p.short);
  if(d.type==='mecha'||d.type==='summon') extras.push('Takes a passive slot');
  if(d.type==='trap'&&d.fx[0]&&d.fx[0][0]==='passive') extras.push('Armed until an enemy attacks');
  if(d.retain) extras.push('Block carries over');
  if(d.exhaust) extras.push('Exhaust');
  if(d.consume) extras.push('Consumed when played');
  if(d.endTurnDmg) extras.push(`${d.endTurnDmg} damage at end of turn in hand`);
  return {main,extras};
}
function cardHTML(id,o){
  o=o||{}; const d=CARD[id]; const tier=o.tier!=null?o.tier:(G?curTier(id):tierIdx(id)); const tn=TIERS[tier]; const e=EL[d.el]; const cost=(d.type==='spell'||d.type==='summon')?d.cost:0; const paysMana=d.type==='spell'||d.type==='summon';
  const cls=['card','t-'+tn,'ty-'+d.type]; if(o.big) cls.push('big'); if(o.mode==='static') cls.push('static'); if(d.unplayable) cls.push('unplayable'); if(o.dim) cls.push('unaff'); if(o.enter) cls.push('enter');
  const evo=tier-tierIdx(id); const {main,extras}=cardParts(id,tier);
  return `<div class="${cls.join(' ')}" style="--el:${e.c};--tier:${TIER[tn].c}" ${o.act?`data-act="${o.act}"`:''} ${o.data||''} tabindex="0" title="${tn} ${TYPES[d.type]} · ${TYPE_DESC[d.type]}">
    <div class="ctop"><span class="ctypelbl">${TYPE_ICON[d.type]} ${TYPES[d.type]}</span>${paysMana?`<span class="cost" title="Mana cost">${cost}</span>`:`<span class="cost free" title="Free to play">free</span>`}</div>
    <div class="cname">${esc(d.name)}</div>
    <div class="cicon"><span>${d.icon}</span></div>
    <div class="cmeta"><span class="tier">${tn}${evo>0?` ▲${evo}`:''}</span><span class="cel">${e.i} ${e.n}</span></div>
    <div class="cinfo">${main.big!==''?`<div class="bignum">${main.big}<small>${main.unit}</small></div>`:''}<div class="ctext">${main.text}</div></div>
    ${extras.length?`<div class="cextra">${extras.map(x=>`<span>${x}</span>`).join('')}</div>`:''}
    ${o.price!=null?`<div class="price">${o.price} 🪙${o.priceTag||''}</div>`:''}
    ${o.tag?`<div class="price tagp">${o.tag}</div>`:''}
  </div>`;
}
function passivePlain(p){ return PASSIVES[p.pid].text.replace(/\{(\w+)\}/g,(m,k)=>p.v&&p.v[k]!=null?p.v[k]:'?'); }
function slotsHTML(){
  const F=G.fight; const max=PS('slots'); let h='';
  for(let i=0;i<max;i++){ const p=F.passives[i]; h+=p?`<div class="slot ${p.kind}" style="--el:${EL[p.el].c}" title="${esc(passivePlain(p))}"><span class="sic">${p.icon}</span><span class="snm">${esc(p.name)}</span><span class="skd">${KIND_LABEL[p.kind]}${p.kind==='trap'?' · armed':''}</span></div>`:`<div class="slot empty"><span class="skd">empty slot</span></div>`; }
  return `<span class="slotslbl">Passives</span>${h}`;
}
function enemyPassivesHTML(e){ return e.passives.map(p=>`<span class="epc ${p.kind}" title="${esc(passivePlain(p))}">${p.icon} ${esc(p.name)}</span>`).join(''); }
function enemyHTML(e,i){
  const F=G.fight; const sel=F.target===i&&e.alive; const ch=TYPE_CHART[e.el];
  const weak=ch.weak.map(x=>`<span title="Weak to ${EL[x].n} (2× damage)">${EL[x].i}</span>`).join('')||'—';
  const res=ch.resist.map(x=>`<span title="Resists ${EL[x].n} (½ damage)">${EL[x].i}</span>`).join('')||'—';
  const badge=e.boss?'<span class="badge boss">BOSS</span>':e.elite?'<span class="badge elite">ELITE</span>':'';
  return `<div class="enemy ${sel?'sel':''} ${e.alive?'':'dead'} ${e.boss?'isboss':''}" data-act="target" data-i="${i}" data-uid="${e.uid}" style="--el:${EL[e.el].c}" tabindex="0">
    <div class="ename"><span>${esc(e.name)}</span><span class="badges">${badge}<span class="badge el">${EL[e.el].i} ${EL[e.el].n}</span></span></div>
    <div class="eface"><span>${e.icon}</span></div>
    <div class="bar ehp"><i style="width:${e.hp/e.maxHp*100}%"></i><b class="num">${e.hp} / ${e.maxHp}</b></div>
    <div class="types"><span>Weak ${weak}</span><span>Resist ${res}</span></div>
    <div class="statuses">${enemyStatusesHTML(e)}</div>
    <div class="epassives">${enemyPassivesHTML(e)}</div>
    <div class="intent">${enemyIntentHTML(e)}</div>
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
function boostsHTML(){ return G.boosts.map(b=>`<span class="boost" title="${b.name}: ${b.rounds} round${b.rounds>1?'s':''} left">${b.icon} ${b.el?'+'+b.v+'% '+EL[b.el].n:'+'+b.v+' '+STATNAMES[b.stat]} <i>${b.rounds}</i></span>`).join(''); }
function hudHTML(){
  const p=G.p;
  return `<div class="hud">
    <div class="hud-l"><span class="round">Round ${G.round}</span><span class="gold num" id="goldv">${p.gold}</span></div>
    <div class="bars">
      <div class="bar hp" title="Health"><i style="width:${p.hp/p.maxHp*100}%"></i><b class="num">❤ ${p.hp} / ${p.maxHp}</b></div>
      <div class="bar xp" title="Experience"><i style="width:${p.xp/p.xpNext*100}%"></i><b class="num">Lv ${p.level}</b></div>
      <div class="bar ult" title="Ultimate: ${ULT[p.ult].name}"><i style="width:${p.ultCharge}%"></i><b class="num">${ULT[p.ult].icon} ${p.ultCharge}%</b></div>
    </div>
    <div class="boosts">${boostsHTML()}</div>
    <div class="tools"><button class="btn sm" data-act="modal" data-m="deck">Deck ${p.deck.length}</button><button class="btn sm" data-act="modal" data-m="stats">Stats</button><button class="btn sm" data-act="modal" data-m="chart">Types</button><button class="btn sm" data-act="modal" data-m="menu" aria-label="Menu">☰</button></div>
  </div>`;
}
function logHTML(){ return `<div class="log">${G.log.slice(-8).map(l=>`<div class="${l.c}">${esc(l.m)}</div>`).join('')}</div>`; }
function playerStatusesHTML(){
  const F=G.fight; const out=[];
  if(F.block) out.push(`<span class="st block" title="${ST.block.d}">🛡️ ${F.block}</span>`);
  for(const [k,v] of Object.entries(F.st)) out.push(`<span class="st ${k}" title="${ST[k].d}">${ST[k].i} ${v}</span>`);
  if(F.str) out.push(`<span class="st str" title="${ST.str.d}">💪 ${F.str}</span>`);
  if(F.spellT) out.push(`<span class="st" title="${ST.spellT.d}">🔮 ${F.spellT}</span>`);
  if(F.armorT) out.push(`<span class="st" title="Extra armor this fight">🪨 +${F.armorT}</span>`);
  if(F.thornsT) out.push(`<span class="st thorns" title="${ST.thornsT.d}">🌵 +${F.thornsT}</span>`);
  if(F.regen) out.push(`<span class="st regen" title="${ST.regen.d}">💚 ${F.regen}</span>`);
  if(F.critT) out.push(`<span class="st" title="${ST.critT.d}">🎯 +${F.critT}%</span>`);
  if(F.dodgeT) out.push(`<span class="st" title="${ST.dodgeT.d}">🌫️ +${F.dodgeT}%</span>`);
  for(const el in F.elBoost) out.push(`<span class="st" title="${EL[el].n} damage this fight">${EL[el].i} +${F.elBoost[el]}%</span>`);
  if(F.dodgeNext) out.push(`<span class="st" title="${ST.dodgeNext.d}">💨 Evasive</span>`);
  if(F.counterNext) out.push(`<span class="st" title="${ST.counterNext.d}">🗡️ Riposte${F.parry?' ×2':''}</span>`);
  return out.join('');
}
function playerHTML(){
  const F=G.fight; const p=G.p; const bonus=F.energyBonus+pSum('manaPerTurn')+pSum('sMana');
  return `<div class="player">
    <div class="mana" title="Mana: spells and summons cost Mana, everything else is free"><b>${F.energy}</b><small>/${PS('energyMax')+bonus}</small></div>
    <div class="pmid">
      <div class="pstats"><span>⚔️ <b>${PS('attack')+F.str+pSum('atkBonus')}</b></span><span>🔮 <b>${PS('spell')+F.spellT+pSum('spellBonus')}</b></span><span>🪨 <b>${PS('armor')+F.armorT}</b></span><span>💨 <b>${PS('dodge')+F.dodgeT}%</b></span><span>🗡️ <b>${PS('counter')}%</b></span><span>🎯 <b>${PS('crit')+F.critT}%</b></span>${PS('lifesteal')?`<span>🩸 <b>${PS('lifesteal')}%</b></span>`:''}${PS('thorns')+F.thornsT+pSum('thorns')?`<span>🌵 <b>${PS('thorns')+F.thornsT+pSum('thorns')}</b></span>`:''}</div>
      <div class="statuses pstatuses">${playerStatusesHTML()}</div>
    </div>
    <div class="pbtns">
      <button class="btn ultbtn ${p.ultCharge>=100?'ready':''}" data-act="ult" ${p.ultCharge<100||UI.busy?'disabled':''} title="${ULT[p.ult].desc}">${ULT[p.ult].icon} ${p.ultCharge>=100?'ULTIMATE':ULT[p.ult].name+' '+p.ultCharge+'%'}</button>
      <button class="btn primary endbtn" data-act="end" ${UI.busy?'disabled':''}>End Turn</button>
    </div>
  </div>`;
}
function handHTML(){
  const F=G.fight; const prev=UI.handUids; const uids=F.hand.map(c=>c.uid);
  const html=F.hand.map((inst,i)=>cardHTML(inst.id,{act:'play',data:`data-i="${i}" style="--i:${i}"`,dim:!canPlay(inst),enter:!prev.includes(inst.uid)})).join('');
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
function offerUltimates(cb){ UI.modal={type:'ults',cb}; render(); }
function deckSummary(){ const m=deckCounts(); return Object.keys(m).sort((a,b)=>curTier(b)-curTier(a)||CARD[a].cost-CARD[b].cost||a.localeCompare(b)).map(id=>({id,count:m[id]})); }
function modalHTML(){
  const m=UI.modal; if(!m) return '';
  let body='';
  if(m.type==='deck'){ body=`<h2>Your Deck · ${G.p.deck.length} cards</h2><p class="muted small">Getting a card you already own evolves it one tier. Gold numbers are evolved values.</p><div class="cardgrid">${deckSummary().map(x=>cardHTML(x.id,{mode:'static',tag:x.count>1?`×${x.count}`:null})).join('')}</div>`; }
  else if(m.type==='pick'){ body=`<h2>${esc(m.title)}</h2><div class="cardgrid">${deckSummary().map(x=>cardHTML(x.id,{act:'pick-card',data:`data-id="${x.id}"`,tag:m.labelFn?m.labelFn(x.id):(x.count>1?`×${x.count}`:null)})).join('')}</div>`; }
  else if(m.type==='ults'){ body=`<h2>Choose an Ultimate</h2><div class="upgrades">${ULTS.map(u=>`<div class="upg"><div class="uname">${u.icon} ${u.name} ${elPill(u.el)}</div><div class="udesc">${u.desc}</div><button class="btn sm ${u.id===G.p.ult?'':'primary'}" data-act="pick-ult" data-id="${u.id}">${u.id===G.p.ult?'Keep':'Choose'}</button></div>`).join('')}</div>`; }
  else if(m.type==='stats'){ const p=G.p; const rows=[['Level',p.level],['Max HP',p.maxHp],['Attack',PS('attack')],['Spell Power',PS('spell')],['Armor',PS('armor')],['Dodge',PS('dodge')+'%'],['Counter',PS('counter')+'%'],['Crit',PS('crit')+'%'],['Life Steal',PS('lifesteal')+'%'],['Thorns',PS('thorns')],['Regen',PS('regen')],['Ultimate Power',PS('ultPower')+'%'],['Luck',PS('luck')],['Mana per turn',PS('energyMax')],['Hand size',PS('handSize')],['Passive slots',PS('slots')],['Gold',p.gold],['Enemies slain',G.kills],['Bosses slain',G.bossesSlain],['Cards evolved',G.evolves]];
    body=`<h2>Stats</h2><table class="stats">${rows.map(r=>`<tr><td>${r[0]}</td><td class="num">${r[1]}</td></tr>`).join('')}</table>${G.boosts.length?`<h3>Active boosts</h3><div class="boosts">${boostsHTML()}</div>`:''}<h3>Ultimate</h3><div class="upgrades">${G.p.ults.map(id=>{const u=ULT[id];return `<div class="upg"><div class="uname">${u.icon} ${u.name} ${elPill(u.el)}</div><div class="udesc">${u.desc}</div><button class="btn sm" data-act="set-ult" data-id="${id}" ${id===G.p.ult?'disabled':''}>${id===G.p.ult?'Equipped':'Equip'}</button></div>`;}).join('')}</div>`; }
  else if(m.type==='chart'){ body=`<h2>Card types</h2><div class="typegrid">${Object.keys(TYPES).map(t=>`<div class="typerow ty-${t}"><span class="ctypelbl">${TYPE_ICON[t]} ${TYPES[t]}</span><span class="muted small">${TYPE_DESC[t]}</span></div>`).join('')}</div>
    <h2>Type Chart</h2><p class="muted small">Super effective hits deal <b>2×</b>, resisted hits <b>½</b>. Wet targets take +50% Lightning and Ice and half Fire. Attacks, summons and machines scale with Attack; spells with Spell Power.</p><div class="chart"><span class="h">Enemy</span><span class="h">Weak to (2×)</span><span class="h">Resists (½)</span>${Object.keys(TYPE_CHART).filter(k=>k!=='phys').map(k=>`${elPill(k)}<span>${TYPE_CHART[k].weak.map(x=>EL[x].i+' '+EL[x].n).join(', ')||'—'}</span><span>${TYPE_CHART[k].resist.map(x=>EL[x].i+' '+EL[x].n).join(', ')||'—'}</span>`).join('')}</div><h3>Card tiers</h3><div class="tierrow">${TIERS.map(t=>`<span class="tierchip" style="--tier:${TIER[t].c}">${t} ×${TIER[t].mult}</span>`).join('')}</div><h3>Status effects</h3><table class="stats">${Object.keys(ST).map(k=>`<tr><td>${ST[k].i} ${ST[k].n}</td><td class="left">${ST[k].d}</td></tr>`).join('')}</table>`; }
  else if(m.type==='help'){ body=helpHTML(); }
  else if(m.type==='menu'){ body=`<h2>Menu</h2><div class="choices"><button class="choice" data-act="modal" data-m="help">How to play</button><button class="choice" data-act="quit">Save and return to title<small>Your run is saved automatically after every step.</small></button>${m.confirm?`<button class="choice danger" data-act="abandon">Yes, abandon this run for good</button>`:`<button class="choice" data-act="abandon-ask">Abandon run<small>Permadeath applies: the run is deleted.</small></button>`}</div>`; }
  return `<div class="modal" data-act="close"><div class="box" data-act="noop">${body}<div class="row end"><button class="btn" data-act="close">Close</button></div></div></div>`;
}
function helpHTML(){ return `<h2>How to play</h2>
<p><b>Rounds.</b> Every round is a fight, then spoils, then something automatic on the road: a chest, a blessing that boosts you for a few rounds, a shrine, a forge, a trap, an ambush. Every fourth round a merchant appears with cards, attributes, an evolution forge and the Lucky Coin. Elites every fifth round, a boss every tenth.</p>
<p><b>Turns.</b> You draw a hand each turn. <b>Attacks, shields, skills, potions, machines and traps are free.</b> Spells and summons cost Mana. When nothing in your hand can be played, the turn ends by itself. End Turn lets every enemy act according to the intent shown on it.</p>
<p><b>Card face.</b> Top band: the type and its cost. Middle: name, icon, tier and element. The info box shows the main number (damage, block, heal, status). Lines underneath are extra effects. The whole card is coloured by its tier.</p>
<p><b>Tiers.</b> Basic cards do one plain thing. Common, uncommon, medium, good, great, rare, perfect and ultimate cards add effects and grow. Getting a card you already own <b>evolves</b> it one tier, multiplying its numbers. Some cards are born ultimate.</p>
<p><b>Passives.</b> Machines, summons and armed traps take one of your passive slots and stay for the fight. Machines give bonuses (double first attack, block per machine, damage per attack played). Summons act every turn. Traps spring on the next enemy attack. Enemies have passives too, and some can destroy yours. Sabotage, EMP and Pilfer destroy or steal theirs.</p>
<p><b>Elements.</b> Ten elements with combos: Fire burns and detonates, Ice chills, freezes and shatters, Lightning shocks and multi-hits, Water soaks, Grass grows, Poison stacks and doubles, Earth turns Block into damage, Shadow steals life, Holy heals and smites. Hit a weakness for <b>2×</b>. Open <b>Types</b> for the chart.</p>
<p><b>Death is final.</b> Enemies scale every round. When HP hits zero the run ends and you start over with basic cards.</p>
<p class="muted small">Keyboard: 1–9 plays a card, E ends the turn, U fires the Ultimate, Space continues, Esc closes windows.</p>`; }
