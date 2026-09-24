'use strict';
// ===================== UI COMPONENTS =====================
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function elPill(el){ const e=EL[el]; return `<span class="elpill" style="--el:${e.c}">${e.i} ${e.n}</span>`; }
const KIND_LABEL={mecha:'Machine',summon:'Summon',trap:'Trap'};
// One effect -> {big, unit, text, short}. big/unit/text feed the info box; short is the extra line.
// Icons for the figures on a card face. Elements and statuses share their glyphs; stats and plain effects have their own.
const STAT_ICON={mana:'🔷',maxHp:'❤️',attack:'⚔️',spell:'🔮',armor:'🛡️',dodge:'💨',counter:'🗡️',crit:'🎯',lifesteal:'🩸',thorns:'🌵',luck:'🍀',energyMax:'🔷',handSize:'🎴',regen:'💚',slots:'☗'};
const FIG_ICON={block:'🛡️',armor:'🛡️',heal:'❤️',draw:'🎴',mana:'🔷',hp:'🩸'};
// One effect -> one figure for the card face: a number, an icon and a short unit (4 ☠️ DMG), plus a modifier line when it matters (all enemies, pierces Block).
// `short` is the one-line text for tags and lists. The hover tooltip (tips.js) carries the full explanation.
function fxPart(f,v,base,d){
  const t=f[0]; const n=k=>v[k]>base[k]?`<i class="up">${v[k]}</i>`:`${v[k]}`; const el=EL[d.el]; const elN=el.n.toLowerCase(); const fig=(num,icon,unit,mod,short)=>({num,icon,unit,mod:mod||'',short}); const DK=DECKS[deckOf(d)]||{n:'deck',i:'🎴'};   // the card's deck is its nature; pmod: the short modifier a pill shows instead of the long one
  if(t==='dmg'){ const o=f[2]||{}; const hits=o.hits?(typeof o.hits==='string'?v[o.hits]:o.hits):1; const mods=[]; if(o.aoe) mods.push('all enemies'); if(o.pierce) mods.push('pierces Block'); if(o.bv) mods.push(`×2 vs ${ST[o.bv].i} ${ST[o.bv].n}`); if(o.ls) mods.push(`heals ${o.ls}%`); if(o.pp) mods.push(`+${n(o.pp)} per ${DK.i} played this turn`); const part=fig(`${n(f[1])}${hits>1?`<small>×${hits}</small>`:''}`,el.i,'dmg',mods.join(' · '),`${n(f[1])}${hits>1?'×'+hits:''} ${elN} dmg${o.aoe?' to all':''}${o.pierce?', pierces':''}${o.bv?', ×2 vs '+ST[o.bv].n:''}${o.ls?', heals '+o.ls+'%':''}${o.pp?', +'+n(o.pp)+' per '+DK.n+' card this turn':''}`); if(o.pp) part.pmod=`+${n(o.pp)}/${DK.i}`; return part; }
  if(t==='block') return fig(n(f[1]),FIG_ICON.block,'block','',`Gain ${n(f[1])} Block`);
  if(t==='armor') return fig(`+${n(f[1])}`,FIG_ICON.armor,'armor','this fight',`+${n(f[1])} Armor this fight`);
  if(t==='se'){ const o=f[3]||{}; if(f[1]==='frozen') return fig('',ST.frozen.i,'freeze',o.aoe?'all enemies skip a turn':'the target skips a turn',`Freeze ${o.aoe?'all enemies':'the target'}`); return fig(n(f[2]),ST[f[1]].i,ST[f[1]].n,o.aoe?'all enemies':'',`Apply ${n(f[2])} ${ST[f[1]].n}${o.aoe?' to all':''}`); }
  if(t==='ss'){ const s=f[1]; if(s==='dodgeNext') return fig('',ST.dodgeNext.i,'dodge','the next attack','Dodge the next attack'); if(s==='counterNext') return fig('',ST.counterNext.i,'counter','the next attack','Counter the next attack'); const pct=(s==='critT'||s==='dodgeT')?'%':''; return fig(`+${n(f[2])}${pct}`,ST[s].i,ST[s].n,'this fight',`+${n(f[2])}${pct} ${ST[s].n} this fight`); }
  if(t==='heal') return fig(n(f[1]),FIG_ICON.heal,'heal','',`Heal ${n(f[1])}`);
  if(t==='healPct') return fig(`${n(f[1])}%`,FIG_ICON.heal,'heal','of Max HP',`Heal ${n(f[1])}% Max HP`);
  if(t==='draw') return fig(n(f[1]),FIG_ICON.draw,'draw','',`Draw ${n(f[1])}`);
  if(t==='energy') return fig(`+${n(f[1])}`,FIG_ICON.mana,'mana','',`+${n(f[1])} Mana`);
  if(t==='maxEnergy') return fig(`+${n(f[1])}`,FIG_ICON.mana,'mana','every turn this fight',`+${n(f[1])} Mana every turn`);
  if(t==='selfDmg') return fig(`-${n(f[1])}`,FIG_ICON.hp,'hp','you bleed',`Lose ${n(f[1])} HP`);
  if(t==='cleanse') return fig('✚','','cleanse','remove your debuffs','Remove your debuffs');
  if(t==='stat') return fig(`+${n(f[2])}`,STAT_ICON[f[1]]||'',STATNAMES[f[1]],'for good',`+${n(f[2])} ${STATNAMES[f[1]]} permanently`);
  if(t==='passive'){ const P=PASSIVES[f[1]]; const txt=passiveText(f[1],v); return fig('',P.icon,KIND_LABEL[P.kind],txt,P.name); }
  if(t==='special'){ const s=f[1]; const p=f[2]||{}; const m=p.m?n(p.m):'';
    if(s==='execute') return fig(n('dmg'),el.i,'dmg',`×2 below ${p.pct||30}% HP`,`${n('dmg')} dmg, ×2 below ${p.pct||30}% HP`);
    if(s==='snipe') return fig(n('dmg'),el.i,'dmg','pierces Block · +50% crit',`${n('dmg')} dmg, pierces, +50% crit`);
    if(s==='retaliation') return fig(`${m}×`,STAT_ICON.thorns,'thorns','as physical damage',`${m}× Thorns as damage`);
    if(s==='stDmg') return fig(`${m}×`,ST[p.s].i,ST[p.s].n,`as ${elN} damage${p.aoe?' to all':''}${p.consume?' · consumes it':''}`,`${m}× ${ST[p.s].n} as damage`);
    if(s==='doubleSt') return fig('×2',ST[p.s].i,ST[p.s].n,p.aoe?'on every enemy':'on the target',`Double ${ST[p.s].n}${p.aoe?' on all':''}`);
    if(s==='spread') return fig('⇶','','spread',"the target's afflictions to all enemies",'Spread afflictions to all');
    if(s==='blockDmg') return fig(`${m}×`,FIG_ICON.block,'block',`as ${elN} damage`,`${m}× Block as damage`);
    if(s==='playedDmg') return fig(m,el.i,'dmg','per card played this turn',`${m} dmg per card played`);
    if(s==='elBoost') return fig(`+${n(p.v)}%`,EL[p.el].i,EL[p.el].n,'damage this fight',`+${n(p.v)}% ${EL[p.el].n} damage this fight`);
    if(s==='parry') return fig('×2',ST.counterNext.i,'counter','that counter hits twice as hard','Counter deals double');
    if(s==='redraw') return fig(n(p.n),'🔁','redraw','discard random cards, draw as many',`Discard ${n(p.n)}, draw ${n(p.n)}`);
    if(s==='sabotage') return fig('✖','','sabotage','destroy an enemy machine, summon or trap','Destroy an enemy passive');
    if(s==='emp') return fig('✖✖','','emp','destroy every enemy passive','Destroy all enemy passives');
    if(s==='pilfer') return fig('☗','','steal','take an enemy passive for yourself','Steal an enemy passive');
    if(s==='pilferAll') return fig('☗☗','','steal','take every enemy passive','Steal all enemy passives');
    if(s==='mimic') return fig('🎩','','conjure',"a card of the enemy's element into your hand",'Conjure an enemy-element card');
    // deck synergies (js/data/decks.js)
    if(s==='packStatus') return Object.assign(fig(n(p.v),ST[p.s].i,ST[p.s].n,`${p.base}% chance · +${p.per}% per ${DK.i} played this turn`,`${p.base}%+ chance of ${n(p.v)} ${ST[p.s].n}`),{pmod:`${p.base}%+${p.per}%/${DK.i}`});
    if(s==='tutor') return Object.assign(fig(n(p.n),DK.i,'call',`${DK.n} cards from your draw pile to your hand`,`Call ${n(p.n)} ${DK.n} card${(v[p.n]||1)>1?'s':''} to hand`),{pmod:'to hand'});
    if(s==='packBuff') return Object.assign(fig(`+${n(p.v)}`,DK.i,'dmg',`to every ${DK.n} card this fight`,`+${n(p.v)} dmg to ${DK.n} cards this fight`),{pmod:'this fight'});
    if(s==='pack'){ const what=p.what||'dmg'; const sc=p.scope==='fight'?'fight':'turn'; const icon={dmg:el.i,block:FIG_ICON.block,heal:FIG_ICON.heal,energy:FIG_ICON.mana,draw:FIG_ICON.draw}[what]; const unit={dmg:'dmg',block:'block',heal:'heal',energy:'mana',draw:'draw'}[what]; return Object.assign(fig(n(p.m),icon,unit,`per ${DK.i} played this ${sc}${p.aoe?' · all enemies':''}${p.pierce?' · pierces Block':''}`,`${n(p.m)} ${unit} per ${DK.n} card played this ${sc}${p.aoe?', to all':''}${p.pierce?', pierces':''}`),{pmod:`per ${DK.i}`}); } }
  return fig('?','','','','');
}
function foeName(id){ const e=(typeof ENEMIES!=='undefined'&&ENEMIES.find(x=>x.id===id))||(typeof BOSSES!=='undefined'&&BOSSES.find(x=>x.id===id)); return e?e.name:id; }
function cardParts(id,tier,vsTier){
  const d=CARD[id]; const v=cardVals(id,tier); const base=cardVals(id,vsTier!=null?vsTier:tierIdx(id)); const parts=d.fx.map(f=>fxPart(f,v,base,d)); const DK=DECKS[deckOf(d)];
  d.fx.forEach((f,i)=>{ if(fxOpts(f).ifPack&&parts[i]){ const p=parts[i]; p.combo=true; p.mod=[`combo · after another ${DK.i} this turn`,p.mod].filter(Boolean).join(' · '); p.short='Combo: '+p.short; } });   // a combo effect only fires after a deck-mate this turn
  const main=parts[0]||(d.unplayable?{num:'☠',icon:'',unit:'curse',mod:'unplayable · clogs your hand',short:'Unplayable · clogs your hand'}:{num:'',icon:'',unit:'',mod:'',short:''});
  const extras=parts.slice(1); const kws=[];
  if(d.type==='mecha'||d.type==='summon') kws.push('Takes a passive slot');
  if(d.type==='trap'&&d.fx[0]&&d.fx[0][0]==='passive') kws.push('Armed until an enemy attacks');
  if(d.retain) kws.push('Block carries over');
  if(d.exhaust) kws.push('Exhaust');
  if(d.consume) kws.push('Consumed when played');
  if(d.endTurnDmg) kws.push(`${d.endTurnDmg} damage at end of turn in hand`);
  return {main,extras,kws};
}
// The figure of an effect: <number> <icon> <unit>, then its modifier line. Extras render as compact pills of the same shape.
function figHTML(p){ return `<div class="cmain">${p.num?`<b class="cnum">${p.num}</b>`:''}${p.icon?`<span class="cico">${p.icon}</span>`:''}${p.unit?`<span class="cunit">${p.unit}</span>`:''}</div>${p.mod?`<div class="cmod">${p.mod}</div>`:''}`; }
function pillHTML(p){ const m=p.pmod||(p.mod&&p.mod.length<=12?p.mod:''); const mod=m?` · ${m}`:''; return `<span class="cx${p.combo?' combo':''}">${p.combo?'<i class="cb" title="Combo: only after another card of its deck this turn">⛓</i>':''}${p.num?`<b>${p.num}</b>`:''}${p.icon?`<i>${p.icon}</i>`:''}${p.unit||mod?`<small>${p.unit}${mod}</small>`:''}</span>`; }
// Card face (see CARD REF.png): name box top-left, Mana cost top-right (nothing when the card is free), art panel, dotted info box
// with the element tag and the effect lines, evolution badge (▲n) bottom-left, card kind (attack, spell, trap…) bottom-right.
// The whole background is the tier colour.
function cardHTML(id,o){
  o=o||{}; const d=CARD[id]; const tier=o.tier!=null?o.tier:(G?curTier(id):tierIdx(id)); const tn=TIERS[tier]; const e=EL[d.el]; const paysMana=d.type==='spell'||d.type==='summon'; const cost=paysMana?d.cost:0;
  const cls=['card','t-'+tn,'ty-'+d.type,'el-'+d.el]; if(o.data&&o.data.includes('data-sel')) cls.push('sel'); if(o.data&&o.data.includes('data-fan')) cls.push('fanc'); if(o.big) cls.push('big'); if(o.mode==='static') cls.push('static'); if(d.unplayable) cls.push('unplayable'); if(d.legendary) cls.push('legendary'); if(o.dim) cls.push('unaff'); if(o.enter) cls.push('enter');
  const evo=tier-tierIdx(id); const {main,extras,kws}=cardParts(id,tier,o.vsTier);
  const nameCls=d.name.length>18?' xl':d.name.length>12?' long':'';
  const costBox=paysMana?`<div class="ccost" title="Mana cost"><b>${cost}</b></div>`:'';
  return `<div class="${cls.join(' ')}" style="--el:${e.c};--tier:${TIER[tn].c}" ${o.act?`data-act="${o.act}"`:''} ${o.data||''} data-card="${id}" data-tier="${tier}" tabindex="0">
    <div class="cname${nameCls}">${esc(d.name)}</div>
    ${costBox}
    <div class="cart"><span>${d.icon}</span></div>
    <div class="cbox">
      <div class="ctags"><span class="ctag" title="Element">${e.i} ${e.n}</span><span class="ctier" title="${d.legendary?'Legendary · ':''}Tier">${d.legendary?'★ ':''}${tn}</span></div>
      ${figHTML(main)}
      ${extras.length?`<div class="cxs">${extras.map(pillHTML).join('')}</div>`:''}
      ${kws.map(k=>`<div class="ckw">${k}</div>`).join('')}
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
  const names=F.passives.filter(Boolean).map(p=>`<span class="pdi" style="--el:${EL[p.el].c}" title="${esc(p.name)} · ${esc(passivePlain(p))}"><i>${p.icon}</i><small>${esc(p.name)}</small></span>`).join('');
  return `<div class="pdtab"><span>☗ Passives</span><b>${used}/${max}</b>${names||'<span class="pdh">none in play</span>'}</div><div class="pcards">${h}</div>`;
}
function enemyPassivesHTML(e){ return e.passives.map(p=>`<span class="epc ${p.kind}" title="${esc(p.name)} · ${esc(passivePlain(p))}"><i>${p.icon}</i><small>${esc(p.name)}</small></span>`).join(''); }
function enemyHTML(e,i){
  const F=G.fight; const sel=F.target===i&&e.alive; const ch=TYPE_CHART[e.el]; const el=EL[e.el];
  const weak=ch.weak.map(x=>`<span title="Weak to ${EL[x].n} (2× damage)">${EL[x].i}</span>`).join('')||'—';
  const res=ch.resist.map(x=>`<span title="Resists ${EL[x].n} (½ damage)">${EL[x].i}</span>`).join('')||'—';
  const rank=e.boss?'boss':e.elite?'elite':'foe'; const body={foe:'#aab4bf',elite:'#e2b45c',boss:'#e0667a'}[rank];
  const nameCls=e.name.length>18?' xl':e.name.length>12?' long':'';
  return `<div class="card enemy el-${e.el} r-${rank} ${sel?'sel':''} ${e.alive?'':'dead'} ${e.boss?'isboss':''}" data-act="target" data-i="${i}" data-uid="${e.uid}" style="--el:${el.c};--tier:${body}" tabindex="0">
    <div class="cname${nameCls}">${esc(e.name)}</div>
    <div class="ccost enat" title="${el.n} nature${NATURE[e.el]?` · ${NATURE[e.el].name}`:''}"><span>${el.i}</span></div>
    <div class="cart"><span>${e.icon}</span></div>
    <div class="bar ehp"><i style="width:${e.hp/e.maxHp*100}%"></i><b class="num">${e.hp} / ${e.maxHp}</b></div>
    <div class="cbox">
      <div class="ctags"><span class="ctag">${el.n}</span><span class="ctier">${e.boss?'Boss':e.elite?'Elite':''}</span></div>
      <div class="intent">${enemyIntentHTML(e)}</div>
      <div class="emana">${enemyManaHTML(e)}</div>
      ${NATURE[e.el]?`<div class="etrait">${NATURE[e.el].icon} ${NATURE[e.el].name}${e.armor?` · ${e.armor} armor`:''}</div>`:''}
      <div class="statuses">${enemyStatusesHTML(e)}</div>
      <div class="epassives">${enemyPassivesHTML(e)}</div>
      <div class="ewr"><span class="weak">Weak ${weak}</span><span class="res">Res ${res}</span></div>
    </div>
    <div class="ccost elv" title="Enemy level"><small>Lv</small><b>${e.lvl||G.round}</b></div>
    <div class="ckind">${e.boss?'☠ Boss':e.elite?'★ Elite':'⚔ Enemy'}</div>
  </div>`;
}
// Statuses and defences as isolated objects: an icon with its number, no box. Only what is on shows.
function stHTML(cls,icon,val,title,style){ return `<span class="st ${cls}" title="${title}"${style?` style="${style}"`:''}><i>${icon}</i>${val!=null&&val!==''?`<b>${val}</b>`:''}</span>`; }
function enemyStatusesHTML(e){
  const sts=Object.entries(e.st).map(([k,v])=>stHTML(k,ST[k].i,k==='frozen'?null:v,`${ST[k].n}: ${ST[k].d}`)).join('');
  const blk=e.block>0?stHTML('block','🛡️',e.block,'Block: absorbs damage this turn'):'';
  const arm=e.armor>0?stHTML('armor','🪨',e.armor,'Armor: flat damage reduction on every hit'):'';
  const th=e.thorns>0?stHTML('thorns','🌵',e.thorns,'Thorns: your attack cards cost you HP'):'';
  return blk+arm+th+sts;
}
// the creature's Mana: one pip a turn, its ability when the bar is full
function enemyManaHTML(e){ const mv=e.moves||FOE_MOVES[e.id]||[]; if(!mv.length||!e.alive) return ''; const max=e.manaMax||3, m=Math.min(max,e.mana||0); const left=max-m; return `<span class="mcells" title="Mana: one pip a turn; when the bar is full it casts an ability instead of attacking">${Array.from({length:max},(_,i)=>`<i class="${i<m?'on':''}"></i>`).join('')}</span><small>${left<=1?'ability next turn':`ability in ${left} turns`}</small>`; }
function enemyIntentHTML(e){ const it=e.alive?intentInfo(e):{i:'💀',t:'Slain'}; return `<span>${it.i}</span><span>${it.t}</span>`; }
function boostsHTML(){ return G.boosts.map(b=>`<span class="boost" title="${b.name}: ${b.el?'+'+b.v+'% '+EL[b.el].n+' damage':'+'+b.v+' '+STATNAMES[b.stat]} · ${b.rounds} fight${b.rounds>1?'s':''} left"><i>${b.icon}</i><b>${b.rounds}</b></span>`).join(''); }
// The three vessels: Health, Mana and Level as liquid orbs (the only gauges the game shows). In a fight the Block shield hangs on the Health orb.
function orbHTML(cls,fill,num,sub,title,size){ return `<div class="orb ${cls}" style="--fill:${Math.max(0,Math.min(100,fill)).toFixed(1)}%;--sz:${size}px" title="${title}"><i class="liq"></i><b class="num">${num}</b><small>${sub}</small></div>`; }
function orbsHTML(o){
  o=o||{}; const p=G.p; const F=G.fight; const K=G.p.kit; const mana=F?F.energy:(K?K.energy||0:0); const sz=o.compact?[50,44,40]:[80,68,58]; const block=F&&F.block>0?F.block:0;
  return `<div class="orbs${o.compact?' compact':''}">
    <div class="orbwrap">${orbHTML('hp',p.hp/p.maxHp*100,p.hp,'/ '+p.maxHp,`Health: ${p.hp} of ${p.maxHp}`,sz[0])}${block?`<span class="blk" title="Block: absorbs ${block} damage this turn"><i>🛡️</i><b>${block}</b></span>`:''}</div>
    ${orbHTML('mana',mana/MANA_CAP*100,mana,'/ '+MANA_CAP,`Mana: ${mana} of ${MANA_CAP}. Spells and summons cost Mana; the first turn of a fight has 0, then +${1+PS('mana')} a turn, and unspent Mana carries over.`,sz[1])}
    ${orbHTML('xp',p.xp/p.xpNext*100,p.level,'level',`Level ${p.level} · ${p.xp} of ${p.xpNext} XP · every level: +8 Max HP and a new card`,sz[2])}
  </div>`;
}
function gaugesHTML(){ return orbsHTML({compact:true}); }
function hudHTML(o){
  o=o||{}; const p=G.p;
  return `<div class="hud">
    <div class="hud-l"><span class="round">${G.dungeon?`Round ${Math.min(roundNow(),G.dungeon.first+G.dungeon.len-1)} · ${themeNow().i} ${esc(themeNow().n)} · Dungeon ${G.dungeon.n} · Fight ${Math.min(G.dungeon.len,G.dungeon.step+1)} of ${G.dungeon.len}`:`Round ${G.round}`}</span>${G.dungeon?planStripHTML(G.dungeon):''}<span class="gold num" id="goldv">${p.gold}</span></div>
    ${o.bars===false?'':`<div class="bars">${gaugesHTML()}</div>`}
    <div class="boosts">${boostsHTML()}</div>
    <div class="tools">${toolsHTML()}</div>
  </div>`;
}
function toolsHTML(){ const p=G.p; const t=(act,extra,icon,label,title)=>`<button class="tool" data-act="${act}" ${extra} title="${title}" aria-label="${title}"><i>${icon}</i><small>${label}</small></button>`;
  return t('deck','',`🎴`,`Deck <b>${p.deck.length}</b>`,'Your deck and your pack')+t('modal','data-m="stats"','📜','Stats','Your stats')+t('modal','data-m="chart"','📖','Types','Elements, decks and the type chart')+t('sound','',SFX.enabled?'🔊':'🔇','Sound','Sound on/off')+t('modal','data-m="menu"','⚙️','Menu','Menu'); }
function logHTML(){ return `<div class="log">${G.log.slice(-8).map(l=>`<div class="${l.c}">${esc(l.m)}</div>`).join('')}</div>`; }
function playerStatusesHTML(){
  // Everything that changes how you fight, as icon-and-number objects: Armor, the powers cards gave you for this fight, then debuffs and the deck synergies. The tooltip explains each.
  const F=G.fight; const out=[];
  { const ar=PS('armor')+F.armorT; if(ar>0) out.push(stHTML('armor','🪨',ar,`Armor: every hit you take is reduced by ${ar}`)); }
  { const v=F.str+pSum('atkBonus'); if(v) out.push(stHTML('str','💪',v,`Strength: +${v} damage on every attack, summon and machine this fight`)); }
  { const v=F.spellT+pSum('spellBonus'); if(v) out.push(stHTML('spellT','🔮',v,`Focus: +${v} damage on every spell this fight`)); }
  if(F.critT) out.push(stHTML('critT','🎯',F.critT+'%',`Keen: ${F.critT}% chance of 50% bonus damage this fight`));
  if(F.dodgeT) out.push(stHTML('dodgeT','🌫️',F.dodgeT+'%',`Shadowed: ${F.dodgeT}% chance to dodge an attack this fight`));
  { const v=F.thornsT+pSum('thorns'); if(v>0) out.push(stHTML('thornsT','🌵',v,`Thorns: attackers take ${v} damage when they hit you`)); }
  { const v=pSum('lifesteal'); if(v>0) out.push(stHTML('ls','🩸',v+'%',`Life steal: your attacks heal you ${v}% of their damage`)); }
  for(const [k,v] of Object.entries(F.st)) out.push(stHTML(k,ST[k].i,k==='frozen'?null:v,`${ST[k].n}: ${ST[k].d}`));
  if(F.regen) out.push(stHTML('regen','💚',F.regen,`Regen: ${ST.regen.d}`));
  for(const el in F.elBoost) out.push(stHTML('elb',EL[el].i,'+'+F.elBoost[el]+'%',`${EL[el].n} damage +${F.elBoost[el]}% this fight`));
  { const M=packMaps(F); for(const dk in M.deckBuff){ if(M.deckBuff[dk]&&DECKS[dk]) out.push(stHTML('deckst',DECKS[dk].i,'+'+M.deckBuff[dk],`${DECKS[dk].n} deck: every ${DECKS[dk].n} card deals +${M.deckBuff[dk]} damage this fight`,`--deck:${DECKS[dk].c}`)); } for(const dk in M.deckTurn){ if(M.deckTurn[dk]&&DECKS[dk]) out.push(stHTML('deckst',`⛓`,M.deckTurn[dk],`${M.deckTurn[dk]} ${DECKS[dk].n} card${M.deckTurn[dk]>1?'s':''} played this turn: the next ${DECKS[dk].n} card reads them`,`--deck:${DECKS[dk].c}`)); } }   // deck synergies: the standing bonus and this turn's count
  if(F.dodgeNext) out.push(stHTML('dodgeNext','💨',null,`Evasive: ${ST.dodgeNext.d}`));
  if(F.counterNext) out.push(stHTML('counterNext','🗡️',F.parry?'×2':null,`Riposte: ${ST.counterNext.d}`));
  return out.join('');
}
function playerHTML(){
  const sts=playerStatusesHTML();
  return `<div class="player">
    <div class="slots" data-act="passives" title="Your machines, summons and armed traps · hover or tap to open">${slotsHTML()}</div>
    ${orbsHTML()}
    <div class="statuses pstatuses">${sts}</div>
    <button class="btn primary endbtn" data-act="end" ${UI.busy?'disabled':''}>End Turn</button>
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
  else if(m.type==='stats'){ const p=G.p; const rows=[['Level',p.level],['Max HP',p.maxHp],['Armor',PS('armor')],['Mana per turn','+'+(1+PS('mana'))],['Hand size',PS('handSize')],['Passive slots',PS('slots')],['Gold',p.gold],['Fights won',G.fights],['Enemies slain',G.kills],['Bosses slain',G.bossesSlain],['Cards evolved',G.evolves]];
    body=`<h2>Stats</h2><table class="stats">${rows.map(r=>`<tr><td>${r[0]}</td><td class="num">${r[1]}</td></tr>`).join('')}</table>${G.boosts.length?`<h3>Active boosts</h3><div class="boosts">${boostsHTML()}</div>`:''}`; }
  else if(m.type==='chart'){ body=`<h2>Card types</h2><div class="typegrid">${Object.keys(TYPES).map(t=>`<div class="typerow ty-${t}"><span class="ctypelbl">${TYPE_ICON[t]} ${TYPES[t]}</span><span class="muted small">${TYPE_DESC[t]}</span></div>`).join('')}</div>
    <h2>Decks</h2><p class="muted small">Every nature type is a deck: the cards of an element play together. Most cards stand alone; the synergy cards listed here count the cards of their element you played before them this turn or this fight, only <b>combo</b> (⛓) after another card of their element this turn, call element-mates from your draw pile, or lift every card of their element for the fight. Creature abilities belong to their element's deck too: slay the creature and it may drop one. Card offers lean toward the elements you hold.</p><div class="typegrid decks">${Object.keys(DECKS).map(k=>{ const D=DECKS[k]; const all=deckCards(k); const cs=synergyCards(k); return `<div class="typerow deckrow" style="--deck:${D.c}"><span class="ctypelbl">${D.i} ${esc(D.n)} <span class="muted small">· ${all.length} cards, ${cs.length} with synergy</span></span><span class="muted small">${esc(D.d)}</span><span class="small decklist">${cs.map(c=>`${c.icon} ${esc(c.name)}`).join(' · ')}</span></div>`; }).join('')}</div>
    <h2>Type Chart</h2><p class="muted small">Super effective hits deal <b>2×</b>, resisted hits <b>½</b>. Wet targets take +50% Lightning and Ice and half Fire. Strength adds to attacks, summons and machines, Focus to spells; both come from cards and last the fight.</p><div class="chart"><span class="h">Enemy</span><span class="h">Weak to (2×)</span><span class="h">Resists (½)</span>${Object.keys(TYPE_CHART).filter(k=>k!=='phys').map(k=>`${elPill(k)}<span>${TYPE_CHART[k].weak.map(x=>EL[x].i+' '+EL[x].n).join(', ')||'—'}</span><span>${TYPE_CHART[k].resist.map(x=>EL[x].i+' '+EL[x].n).join(', ')||'—'}</span>`).join('')}</div><h3>Enemy natures</h3><p class="muted small">Every enemy fights by its nature. The trait is written on its card.</p><table class="stats">${Object.keys(NATURE).map(k=>`<tr><td>${NATURE[k].icon} ${NATURE[k].name} <span class="muted">· ${EL[k].n}</span></td><td class="left">${NATURE[k].text}</td></tr>`).join('')}</table><h3>Card tiers</h3><div class="tierrow">${TIERS.map(t=>`<span class="tierchip" style="--tier:${TIER[t].c}">${t} ×${TIER[t].mult}</span>`).join('')}</div><h3>Status effects</h3><table class="stats">${Object.keys(ST).map(k=>`<tr><td>${ST[k].i} ${ST[k].n}</td><td class="left">${ST[k].d}</td></tr>`).join('')}</table>`; }
  else if(m.type==='help'){ body=helpHTML(); }
  else if(m.type==='menu'){ body=`<h2>Menu</h2><div class="choices"><button class="choice" data-act="library">📚 Card Library<small>Every card you have discovered so far.</small></button><button class="choice" data-act="modal" data-m="help">How to play</button><button class="choice" data-act="quit">Save and return to title<small>Your run is saved automatically after every step.</small></button>${m.confirm?`<button class="choice danger" data-act="abandon">Yes, abandon this run for good</button>`:`<button class="choice" data-act="abandon-ask">Abandon run<small>Permadeath applies: the run is deleted.</small></button>`}</div>`; }
  return `<div class="modal" data-act="close"><div class="box" data-act="noop">${body}<div class="row end"><button class="btn" data-act="close">Close</button></div></div></div>`;
}
function helpHTML(){ return `<h2>How to play</h2>
<p><b>Dungeons.</b> You descend through fogged hex dungeons: rooms joined by corridors, dead ends, and an exit you have to find. You see three hexes around you and walls block your sight, so a room reveals itself when you step in. Every new room you enter raises the danger for the rest of that dungeon, and each dungeon starts higher than the last, so loot deeper or leave while you can. Creatures are visible before they see you: most only fight when you step onto them, but some sense you from a hex or two away (their reach is tinted red), and then there is no running. Rooms hold guards, chests, shrines, forges, campfires, blessings, idols, traps and people with offers. Every third dungeon a boss stands on the exit: its card, its treasury, and one more passive slot. Between dungeons the keeper heals you for gold, forges, buys one card, takes one off your hands, and holds your pack.</p>
<p><b>One deck.</b> You carry one deck of at most twenty cards. New cards beyond that go into your pack, and only the keeper lets you swap cards between the deck and the pack.</p>
<p><b>New cards.</b> Fights give gold and XP. Every level you gain lets you choose one of three new cards; that is the only way new cards come to you, apart from bosses and the odd cursed idol. Taking a card you already own evolves it instead.</p>
<p><b>Turns.</b> Every fight opens with a fresh shuffle of your deck and a new hand of five; your Mana and your passives carry from fight to fight. Then at the start of each turn you draw one more, or two if your hand is empty. What you do not play stays in your hand, even between fights (curses rotate back into the deck). <b>Attacks, shields, skills, potions, machines and traps are free.</b> Spells and summons cost Mana, the blue bar under your hand: your first turn of a fight has 0, from the second turn on you gain 1 at the start of each turn (up to 10), and unspent Mana carries over. When nothing in your hand can be played, the turn ends by itself. End Turn lets every enemy act according to the intent shown on its card.</p>
<p><b>Card face.</b> Name top-left. Spells and summons show their Mana cost top-right; a card with no cost box is free to play. The picture in the middle. The dotted box shows the element, the tier and what the card does: the first line is the main effect, the lines underneath are extras. Bottom-right says what kind of card it is (attack, spell, shield, skill, potion, machine, summon, trap). The whole card is coloured by its tier, and a green ▲ badge bottom-left counts how many tiers it has evolved.</p>
<p><b>Tiers.</b> Basic cards do one plain thing. Common, uncommon, medium, good, great, rare, perfect and ultimate cards add effects and grow. Getting a card you already own <b>evolves</b> it one tier, multiplying its numbers. Some cards are born ultimate. <b>Legendary</b> cards (★, gold frame) never sit in a normal offer: one slips in on its own now and then, more often deep in a run, with Luck, and in a boss's treasury.</p>
<p><b>Passives.</b> Machines, summons and armed traps take one of your passive slots and stay in play from fight to fight, until they are dismantled, destroyed or replaced. Machines give bonuses (double first attack, block per machine, damage per attack played). Summons act every turn. Traps spring on the next enemy attack. Enemies have passives too, and some can destroy yours. Sabotage, EMP and Pilfer destroy or steal theirs. Yours are listed on the tab above the stats bar; hover or tap it to open the drawer and see their cards.</p>
<p><b>Elements.</b> Fourteen elements with combos: Fire burns and detonates, Ice chills, freezes and shatters, Lightning shocks and multi-hits, Water soaks, Grass grows, Poison stacks and doubles, Earth turns Block into damage, Shadow steals life, Holy heals and smites, Dragon claws and breathes fire behind hard scales, Psychic pierces Block and reads the enemy, Flying dodges and dives, Fighting strings blows together and counters. Hit a weakness for <b>2×</b>. Enemies fight by their nature too: fire ones burn you, ice ones chill your Mana, shadow ones drain and fade, earth ones wear stone skin, dragons ignore your Armor, minds drain your Mana, wings dodge a fifth of your cards, fighters punch back. Each trait is written on the enemy's card; open <b>Types</b> for the full list and the chart.</p>
<p><b>Decks.</b> Every nature type is a deck: the cards of an element play together. Most cards stand alone, and every element has a few synergy cards that read the rest: a Rat is more likely to poison for every Poison card you played before it this turn, a Wolf hits harder for every Beast card before it, a ⛓ combo line (Cross, Backstab, Black Death) only fires after another card of its element, callers (Plague Rat, Kata, Wyrm Call) pull element-mates from your draw pile, and the Rat King or a Hymn lifts every card of its element for the whole fight. Card offers lean toward the elements you hold, and a creature's abilities belong to its element too, so the rats of the Warrens feed a Poison deck. Open <b>Types</b> to see every deck and its synergy cards.</p>
<p><b>Creature abilities.</b> Every creature has its own moves. It gains one Mana a turn (the pips under its intent) and casts a move when it has three, bosses starting with one; the other turns it attacks plainly. Its next action shows on its card. Slay it and it may drop one of them: a real card for your deck, and the only way to get it.</p>
<p><b>Block and Armor</b> stop only direct hits: attack cards, spells and a creature's own blows. Poison, Burn, Thorns, traps, summons and machines ignore them, on both sides.</p>
<p><b>Death is final.</b> Enemies scale with the dungeon you are in and the rooms you have entered. When HP hits zero the run ends and you start over with basic cards.</p>
$1In a dungeon, click a hex to walk there (the path shows as you hover) or step with Q E A D Z C; Space acts on your hex. in a fight, A and D (or the arrows) move the highlight along your hand, W jumps up to the enemies where A and D choose who to strike and S comes back down, Space plays the highlighted card, Tab ends the turn, E opens and closes the passives drawer, 1–9 play a card directly. Everywhere else, W A S D (or the arrows) move the highlight over the choices and Space picks it; Esc closes windows.</p>`; }
