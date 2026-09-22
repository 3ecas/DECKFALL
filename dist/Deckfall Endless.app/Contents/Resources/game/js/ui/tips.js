'use strict';
// ===================== TOOLTIPS: hover a card (yours, an offer, an enemy) for a plain-words explanation =====================
const TIP=(()=>{
  let el=null, timer=null;
  function node(){ if(!el){ el=document.createElement('div'); el.className='tip'; document.body.appendChild(el); } return el; }
  const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
  const elName=k=>EL[k]?EL[k].n:k;
  const strongVs=el=>Object.keys(TYPE_CHART).filter(k=>TYPE_CHART[k].weak.includes(el)).map(elName);
  const resistedBy=el=>Object.keys(TYPE_CHART).filter(k=>TYPE_CHART[k].resist.includes(el)).map(elName);
  // One effect -> one sentence. foe=true reads it from an enemy's point of view (its damage lands on you, its buffs on it).
  function explain(f,v,d,foe){
    const t=f[0]; const n=k=>`<b>${v[k]!=null?v[k]:'?'}</b>`; const you=foe?'it':'you'; const your=foe?'its':'your'; const tgt=foe?'you':'the target'; const el=elName(d.el).toLowerCase(); const DK=DECKS[deckOf(d)]||{n:'deck',i:'🎴'};
    if(t==='dmg'){ const o=f[2]||{}; const hits=o.hits?(typeof o.hits==='string'?v[o.hits]:o.hits):1; let s=`Deals ${n(f[1])} ${el} damage${hits>1?` <b>${hits} times</b>`:''} to ${o.aoe&&!foe?'every enemy':tgt}`; const ex=[]; if(o.pierce) ex.push('ignores Block'); if(o.ls) ex.push(`heals ${you} for ${o.ls}% of the damage`); if(o.pp&&!foe) ex.push(`+${n(o.pp)} for every ${DK.n} card you played earlier this turn`); if(o.bv) ex.push(`double damage if the target is ${ST[o.bv].n}`); if(ex.length) s+=' · '+ex.join(' · '); s+='.'; if(!foe&&d.el!=='phys'){ const sv=strongVs(d.el), rb=resistedBy(d.el); if(sv.length) s+=` <span class="sub">2× against ${sv.join(', ')}.</span>`; if(rb.length) s+=` <span class="sub">Halved by ${rb.join(', ')}.</span>`; } return s; }
    if(t==='block') return `${cap(you)} gain${foe?'s':''} ${n(f[1])} Block: it absorbs damage until ${your} next turn.`;
    if(t==='armor') return `+${n(f[1])} Armor for the rest of the fight: every hit ${you} take${foe?'s':''} is reduced by that much.`;
    if(t==='se'){ const o=f[3]||{}; const s=f[1]; if(s==='frozen') return foe?'Chills you: 1 less Mana next turn.':`Freezes ${o.aoe?'every enemy':'the target'}: it skips its next turn, and Shatter cards deal double to it.`; return `Applies ${n(f[2])} ${ST[s].n} to ${o.aoe&&!foe?'every enemy':tgt}: <span class="sub">${ST[s].d}</span>`; }
    if(t==='ss'){ const s=f[1]; if(s==='dodgeNext') return `${cap(you)} dodge${foe?'s':''} the next attack completely.`; if(s==='counterNext') return `${cap(you)} counter${foe?'s':''} the next attack that lands.`; const pct=(s==='critT'||s==='dodgeT')?'%':''; return `+${n(f[2])}${pct} ${ST[s].n} for this fight: <span class="sub">${ST[s].d}</span>`; }
    if(t==='heal') return `Heals ${you} for ${n(f[1])}.`;
    if(t==='healPct') return `Heals ${you} for ${n(f[1])}% of ${your} Max HP.`;
    if(t==='draw') return `Draw ${n(f[1])} card${(v[f[1]]||0)>1?'s':''}.`;
    if(t==='energy') return `+${n(f[1])} Mana this turn.`;
    if(t==='maxEnergy') return `+${n(f[1])} Mana every turn for the rest of the fight.`;
    if(t==='selfDmg') return `${cap(you)} lose${foe?'s':''} ${n(f[1])} HP.`;
    if(t==='cleanse') return `Removes ${your} debuffs (Burn, Poison, Chill, Shock, Wet, Weak, Vulnerable).`;
    if(t==='stat') return `+${n(f[2])} ${STATNAMES[f[1]]}, permanently.`;
    if(t==='passive'){ const P=PASSIVES[f[1]]; if(!P) return ''; return `${foe?'Summons':'Puts'} <b>${P.name}</b> (${KIND_LABEL[P.kind]}) ${foe?'at its side':'into one of your passive slots'}: ${passiveText(f[1],v)}`; }
    if(t==='special'){ const s=f[1]; const p=f[2]||{}; const m=p.m?n(p.m):'';
      const map={execute:`Deals ${n('dmg')} ${el} damage, doubled if the target is below ${p.pct||30}% HP.`, snipe:`Deals ${n('dmg')} ${el} damage, ignores Block and has +50% crit chance.`, retaliation:`Deals ${m}× ${your} Thorns as physical damage.`, stDmg:`Deals ${m}× the target's ${p.s?ST[p.s].n:''} stacks as ${el} damage${p.consume?', consuming them':''}.`, doubleSt:`Doubles the ${p.s?ST[p.s].n:''} on ${p.aoe?'every enemy':'the target'}.`, spread:"Copies the target's afflictions onto every enemy.", blockDmg:`Deals ${m}× ${your} current Block as ${el} damage.`, playedDmg:`Deals ${m} damage for every card played this turn.`, elBoost:`+${n(p.v)}% ${elName(p.el)} damage for this fight.`, parry:'Your next counter hits twice as hard.', redraw:`Discard ${n(p.n)} random cards and draw as many.`, sabotage:'Destroys one enemy machine, summon or trap.', emp:'Destroys every enemy passive.', pilfer:'Steals an enemy passive for yourself.', pilferAll:'Steals every enemy passive.', mimic:"Conjures a card of the enemy's element into your hand for this turn.",
        packStatus:`${p.base}% chance to apply ${n(p.v)} ${p.s?ST[p.s].n:''} to ${tgt}, +${p.per}% for every ${DK.n} card ${you} played earlier this turn${p.s&&!foe?`: <span class="sub">${ST[p.s].d}</span>`:''}`,
        tutor:`Draws ${n(p.n)} random ${DK.n} card${(v[p.n]||1)>1?'s':''} from ${your} draw pile into ${your} hand (from the discard pile if the draw pile has none).`,
        packBuff:foe?`Gains ${n(p.v)} Strength.`:`Every ${DK.n} card you play for the rest of this fight deals +${n(p.v)} damage.`,
        pack:(()=>{ const sc=p.scope==='fight'?'fight':'turn'; const per=`for every ${DK.n} card you played earlier this ${sc}`; const w=p.what||'dmg'; return w==='dmg'?`Deals ${n(p.m)} ${el} damage ${p.aoe?'to every enemy':'to '+tgt} ${per}${p.pierce?', ignoring Block':''}.`:w==='block'?`Gain ${n(p.m)} Block ${per}.`:w==='heal'?`Heals you ${n(p.m)} ${per}.`:w==='energy'?`+${n(p.m)} Mana ${per}.`:`Draw ${n(p.m)} ${per}.`; })()};
      return map[s]||''; }
    return '';
  }
  function keywords(d){ const k=[]; if(d.legendary) k.push('<b>★ Legendary</b>: never in a normal offer. One slips in on its own now and then, more often the deeper you are, the luckier you are, and in a boss\'s treasury. Finding it again evolves it.'); if(d.exhaust) k.push('<b>Exhaust</b>: after you play it, it is gone for the rest of the fight.'); if(d.consume) k.push('<b>Consumed</b>: used up for good when played; what it gives is permanent.'); if(d.retain) k.push('<b>Retain</b>: the Block it gives carries over to your next turn.'); if(d.unplayable) k.push('<b>Unplayable</b>: it clogs your hand; remove it at a merchant.'); if(d.endTurnDmg) k.push(`Deals <b>${d.endTurnDmg}</b> damage to you at the end of every turn it sits in your hand.`); return k; }
  function cardTip(id,tier){
    const d=CARD[id]; if(!d) return ''; tier=tier!=null?tier:(G?curTier(id):tierIdx(id)); const v=cardVals(id,tier); const tn=TIERS[tier]; const paysMana=d.type==='spell'||d.type==='summon';
    const DK=DECKS[deckOf(d)]; const lines=d.fx.map(f=>{ let s=explain(f,v,d,false); if(s&&fxOpts(f).ifPack) s=`<b>⛓ Combo</b> · only if you played another ${DK?DK.n:'deck'} card earlier this turn: ${s}`; return s; }).filter(Boolean); const kw=keywords(d);
    return `<h4>${d.icon} ${esc(d.name)}</h4><div class="sub">${cap(tn)} ${TYPES[d.type]} · ${elName(d.el)} · ${paysMana?`costs <b>${d.cost}</b> Mana`:'free to play'}${d.drop?` · ability of the ${esc(foeName(d.drop))}`:''}</div><div class="sub">${TYPE_DESC[d.type]}</div>${DK?`<div class="sub deckline"><b>${DK.i} ${esc(DK.n)} deck</b> · ${esc(DK.d)}</div>`:''}${lines.length||kw.length?`<ul>${lines.map(l=>`<li>${l}</li>`).join('')}${kw.map(l=>`<li>${l}</li>`).join('')}</ul>`:''}`;
  }
  function enemyTip(e){
    const N=NATURE[e.el]; const ch=TYPE_CHART[e.el]||{weak:[],resist:[]}; const it=e.pat[e.pi%e.pat.length]; let next='';
    if(e.alive){ if(it.t==='move'&&CARD[it.id]){ const d=CARD[it.id]; const v=cardVals(it.id,tierIdx(it.id)); const sc=e.atkScale; const vv={}; for(const k in v) vv[k]=['hits','e','d'].includes(k)?v[k]:Math.max(1,Math.round(v[k]*sc)); next=`<b>${d.icon} ${esc(d.name)}</b><ul>${d.fx.map(f=>explain(f,vv,d,true)).filter(Boolean).map(l=>`<li>${l}</li>`).join('')}</ul>`; } else next=`<b>${intentInfo(e).t.replace(/<[^>]+>/g,'')}</b>`; }
    const moves=(FOE_MOVES[e.id]||[]).map(id=>CARD[id]).filter(Boolean);
    return `<h4>${e.icon} ${esc(e.name)} <span class="sub">Lv ${e.lvl||G.round} · ${elName(e.el)}</span></h4>${N?`<div><span class="k">${N.icon} ${N.name}</span> · ${N.text}</div>`:''}<div class="sub">Weak to ${ch.weak.length?ch.weak.map(elName).join(', ')+' (takes 2×)':'nothing'} · resists ${ch.resist.length?ch.resist.map(elName).join(', ')+' (takes ½)':'nothing'}.</div>${next?`<div class="nx"><span class="k">Next:</span> ${next}</div>`:''}${moves.length?`<div class="sub">Abilities: ${moves.map(m=>m.icon+' '+esc(m.name)).join(' · ')} · slay it and it may drop one.</div>`:''}`;
  }
  function show(target,html){ const t=node(); t.innerHTML=html; t.classList.add('on'); const r=target.getBoundingClientRect(); const w=Math.min(320,innerWidth-16); t.style.maxWidth=w+'px'; const h=t.offsetHeight; let x=r.right+10; if(x+w>innerWidth-8) x=r.left-w-10; if(x<8) x=8; let y=r.top; if(y+h>innerHeight-8) y=Math.max(8,innerHeight-8-h); t.style.left=x+'px'; t.style.top=y+'px'; }
  function hide(){ clearTimeout(timer); if(el) el.classList.remove('on'); }
  document.addEventListener('mouseover',ev=>{ if(UI.screen==='deck') return; const c=ev.target.closest&&ev.target.closest('.card'); if(!c||c.classList.contains('ghost')||c.classList.contains('back')||c.classList.contains('fanc')) return; clearTimeout(timer); timer=setTimeout(()=>{ let html=''; if(c.classList.contains('enemy')){ const e=G&&G.fight&&G.fight.enemies.find(x=>String(x.uid)===c.dataset.uid); if(e) html=enemyTip(e); } else if(c.dataset.card){ html=cardTip(c.dataset.card,c.dataset.tier!=null?+c.dataset.tier:null); } if(html) show(c,html); },140); });
  document.addEventListener('mouseout',ev=>{ const c=ev.target.closest&&ev.target.closest('.card'); if(!c) return; const to=ev.relatedTarget; if(to&&c.contains(to)) return; hide(); });
  document.addEventListener('mousedown',hide); document.addEventListener('keydown',hide); addEventListener('scroll',hide,true);
  return {hide,cardTip,enemyTip};
})();
function hideTip(){ TIP.hide(); }
