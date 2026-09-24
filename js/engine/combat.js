'use strict';
// ===================== COMBAT ENGINE (turn-based; spells & summons cost Mana, everything else is free) =====================
const fx=()=>(typeof FX!=='undefined'?FX:null);
function typeMult(atkEl,defEl){ const c=TYPE_CHART[defEl]; if(!c) return 1; if(c.weak.includes(atkEl)) return 2; if(c.resist.includes(atkEl)) return 0.5; return 1; }
// ---- passives ----
function passiveCardFor(pid){ return CARDS.find(x=>x.fx.some(f=>f[0]==='passive'&&f[1]===pid)); }
function pv_(p,k){ const def=PASSIVES[p.pid]; const ref=def[k]; if(ref==null) return null; return typeof ref==='string'?(p.v[ref]!=null?p.v[ref]:0):ref; }
function mkPassive(pid,vals,inst,owner){ const d=PASSIVES[pid]; return {uid:UI.uid++,pid,name:d.name,icon:d.icon,kind:d.kind,el:d.el,v:vals,inst:inst||null,owner}; }
function addEnemyPassive(e,pid){ if(!PASSIVES[pid]||e.passives.length>=3) return; const card=passiveCardFor(pid); const base=card?cardVals(card.id,tierIdx(card.id)):{}; const v={}; const sc=Math.max(1,e.atkScale*0.7); for(const k in base) v[k]=['hits','e','d'].includes(k)?base[k]:Math.max(1,Math.round(base[k]*sc)); const p=mkPassive(pid,v,null,'e'); e.passives.push(p); if(pv_(p,'thorns')) e.thorns+=pv_(p,'thorns'); return p; }
function pSum(k){ let t=0; for(const p of G.fight.passives){ const x=pv_(p,k); if(typeof x==='number') t+=x; } return t; }
function hasP(k){ return G.fight.passives.some(p=>pv_(p,k)!=null); }
function mechaCount(list){ return list.filter(p=>p.kind==='mecha').length; }
function removePassive(list,p,reason){ const i=list.indexOf(p); if(i<0) return; list.splice(i,1); if(p.owner==='p'&&p.inst){ if(reason==='destroyed'||reason==='sprung') G.fight.exhaust.push(p.inst); else G.fight.discard.push(p.inst); } if(p.owner==='e'&&pv_(p,'thorns')){ const e=G.fight.enemies.find(x=>x.passives.includes(p)||x.passives===list); if(e) e.thorns=Math.max(0,e.thorns-pv_(p,'thorns')); } }
function playPassive(inst,pid){ const F=G.fight; const max=PS('slots'); if(F.passives.length>=max){ const old=F.passives[0]; removePassive(F.passives,old,'replaced'); log(`${old.name} is dismantled to make room`,'bad'); } const p=mkPassive(pid,cardVals(inst.id),inst,'p'); F.passives.push(p); inst.inPlay=true; log(`${p.name} enters play (${p.kind})`,'good'); floatP(`${p.icon} ${p.name}`,'mana'); sfx('passive',{kind:p.kind}); }
function stealPassive(e,p){ const F=G.fight; const i=e.passives.indexOf(p); if(i<0) return; e.passives.splice(i,1); if(pv_(p,'thorns')) e.thorns=Math.max(0,e.thorns-pv_(p,'thorns')); if(F.passives.length>=PS('slots')){ const old=F.passives[0]; removePassive(F.passives,old,'replaced'); log(`${old.name} is dismantled to make room`,'bad'); } p.owner='p'; p.inst=null; F.passives.push(p); log(`You steal ${p.name} from ${e.name}!`,'se'); floatE(e,`${p.icon} stolen!`,'se'); sfx('steal'); }
// ---- setup ----
const FOE_MANA=3;   // a creature gains 1 Mana a turn and casts one of its abilities when it has this many (bosses start with 1); plain attacks in between, so no shell is raised every turn
// what a creature will do next: its next ability if its Mana fills on its coming turn, else a plain attack (creatures without abilities keep their old pattern)
function nextAction(e){ const mv=e.moves||FOE_MOVES[e.id]||[]; if(!mv.length) return e.pat[e.pi%e.pat.length]; return (e.mana||0)+1>=(e.manaMax||FOE_MANA)?{t:'move',id:mv[(e.mi||0)%mv.length]}:A(e.boss?1.2:1); }
function mkEnemy(def,o){
  const s=G.round; const hm=hpMult(s)*(o.scale||1)*(o.elite?1.6:1); const am=atkMult(s)*(o.elite?1.25:1);
  const hp=Math.round(def.hp*hm), atk=Math.round(def.atk*am);
  const e={uid:UI.uid++, id:def.id, name:(o.elite?'Elite ':'')+def.name, icon:def.icon, el:def.el, lvl:s+(o.boss?5:o.elite?2:0), hp, maxHp:hp, atk, block:0, armor:Math.floor(s/16)+(o.boss?1:0)+(o.final?1:0), thorns:def.thorns?Math.round(def.thorns*am*0.6):0, st:{}, pat:def.pat||[A(1)], pi:0, regen:0, elite:!!o.elite, boss:!!o.boss, ls:!!def.ls, atkScale:am, alive:true, passives:[]};
  const mv=(def.moves||FOE_MOVES[def.id]||[]); e.moves=mv; e.mana=o.boss?1:0; e.manaMax=FOE_MANA; e.mi=0; if(mv.length){ const M=id=>({t:'move',id}); e.pat=o.boss?[M(mv[0]),A(1.2),M(mv[1]||mv[0]),A(1.2),M(mv[2]||mv[0])]:[A(1),M(mv[0]),A(1),M(mv[1]||mv[0])].concat(mv[2]?[M(mv[2])]:[]); }   // kept as a fallback for creatures without abilities; with abilities, nextAction decides by Mana
  if(e.el==='earth') e.armor+=1+Math.floor(s/12);           // Stoneskin
  if(e.el==='shadow'){ e.ls=true; e.evade=15; }             // Drain
  if(e.el==='phys') e.crit=20;                              // Precision
  if(e.el==='beast') e.enrage=1.4;                          // Frenzy
  if(e.el==='flying') e.fly=20;                             // Wings: a fifth of your cards miss it
  if(!o.boss) e.pi=rnd(0,e.pat.length-1);
  for(const pid of (def.passives||[])) addEnemyPassive(e,pid);
  return e;
}
function pickEnemies(o){
  const s=G.round;
  if(o.boss){ const b=(o.bossId&&BOSSES.find(x=>x.id===o.bossId))||BOSSES[(Math.round(s/10)-1+BOSSES.length)%BOSSES.length]; return [mkEnemy(b,{boss:true})]; }
  if(o.mimic) return [mkEnemy(ENEMY.mimic,{elite:true})];
  const B=G.dungeon?themeNow():null;   // companions come from the dungeon's theme
  let pool=ENEMIES.filter(x=>!x.special&&x.min<=s&&x.min>=Math.min(s,24)-14&&(!B||B.els.includes(x.el))); if(pool.length<2) pool=ENEMIES.filter(x=>!x.special&&x.min<=s&&x.min>=Math.min(s,24)-14); if(pool.length<2) pool=ENEMIES.filter(x=>!x.special&&x.min<=s);
  let count=1; const r=Math.random();
  if(!o.elite){ if(s>=20&&r<0.08) count=3; else if(s>=8&&r<0.16) count=2; }   // fewer, stronger foes: a second creature is rare, a third rarer
  const list=[]; for(let i=0;i<count;i++){ const fresh=pool.filter(x=>!list.some(y=>y.id===x.id)); const def=(i===0&&o.enemyId&&ENEMY[o.enemyId])?ENEMY[o.enemyId]:pick(fresh.length?fresh:pool); list.push(mkEnemy(def,{elite:o.elite,scale:count===1?1:count===2?0.66:0.52})); }
  return list;
}
function startFight(o){
  clearTimeout(UI.timer); clearTimeout(UI.autoTimer);
  if(o.dangerBonus) G.round+=o.dangerBonus;   // a boss fights at its dungeon's base danger plus BOSS_RAMP, whatever the climb says
  const enemies=pickEnemies(o);
    // every fight opens with a fresh shuffle: hand, draw, discard and exhaust go back together and a new hand is dealt on turn 1; passives in play and Mana carry over
  const K=G.p.kit||(G.p.kit=newKit()); K.draw=shuffle([...K.hand,...K.draw,...K.discard,...K.exhaust].filter(c=>!c.temp)); K.hand=[]; K.discard=[]; K.exhaust=[]; if(!K.draw.length) K.draw=shuffle(G.p.deck.map(id=>({uid:UI.uid++,id})));
  G.fight={key:UI.fightKey++, enemies, turn:0, energy:K.energy||0, energyBonus:0, hand:K.hand, draw:K.draw, discard:K.discard, exhaust:K.exhaust, passives:K.passives, block:0, st:{}, str:0, spellT:0, thornsT:0, critT:0, armorT:0, regen:0, dodgeT:0, elBoost:{}, deckTurn:{}, deckFight:{}, deckBuff:{}, dodgeNext:false, counterNext:false, parry:false, retain:false, target:0, played:0, turnAttacks:0, o, over:false};
  G.log=[]; log(o.final?`THE FINAL BOSS: ${enemies[0].name} waits at the bottom of the world.`:o.boss?`BOSS: ${enemies[0].name} guards its lair!`:o.forced?`${enemies[0].name} has caught your scent. There is no running.`:o.elite?`An elite ${enemies[0].name} appears!`:`${enemies.map(e=>e.name).join(' and ')} appear${enemies.length>1?'':'s'}!`, (o.boss||o.forced)?'bad':'');
  G.phase='battle'; G.spoils=null; G.inter=null; G.shop=null; UI.handUids=[]; UI.sel=null; UI.kbRow='hand'; save();
  UI.intro=true; clearTimeout(UI.introTimer); UI.introTimer=setTimeout(()=>{ UI.intro=false; const a=document.querySelector('.arena'); if(a) a.classList.remove('intro'); },1500);   // the creature steps in first; its details are revealed when the fight starts
  const f=fx(); if(f) setTimeout(()=>f.banner(o.final?`The final boss: ${enemies[0].name}`:o.boss?`Boss: ${enemies[0].name}`:o.forced?`Ambush! ${enemies[0].name}`:o.elite?`Elite: ${enemies[0].name}`:`${enemies[0].name}`, o.boss?'boss':(o.elite||o.forced)?'elite':''),50); sfx(o.boss?'boss':o.forced?'ambush':o.elite?'elite':'battle');
  startPlayerTurn();
}
function startPlayerTurn(){
  const F=G.fight; if(F.over) return; F.turn++; G.turnsTotal++;
  // Mana: the first turn of every fight starts at 0; from the second turn on you gain 1 (plus any per-turn bonuses), up to MANA_CAP, and unspent Mana carries over.
  if(F.turn>1){ const gain=1+PS('mana')+F.energyBonus+pSum('manaPerTurn')+pSum('sMana'); if(F.st.chill){ delete F.st.chill; log('Chilled: no Mana gained this turn','bad'); } else F.energy=Math.min(MANA_CAP,F.energy+gain); } else if(F.st.chill) delete F.st.chill;
  F.played=0; F.turnAttacks=0; F.deckTurn={}; if(!F.retain) F.block=0; F.retain=false; F.dodgeNext=false; F.counterNext=false; F.parry=false;
  const rg=F.regen+pSum('healPerTurn')+pSum('sHeal'); if(rg>0){ const h=heal(rg); if(h) log(`Regen and allies heal ${h}`,'good'); }
  if(F.st.poison){ dmgPlayerRaw(F.st.poison,'Poison'); F.st.poison--; if(F.st.poison<=0) delete F.st.poison; }
  if(F.st.burn&&G.p.hp>0){ dmgPlayerRaw(F.st.burn,'Burn'); F.st.burn=Math.floor(F.st.burn/2); if(F.st.burn<=0) delete F.st.burn; }
  if(checkDeath()) return;
  const before=F.hand.length; draw((F.turn===1?Math.max(0,PS('handSize')-F.hand.length):(F.hand.length===0?2:1))+pSum('drawPerTurn')); sfx('draw',{n:F.hand.length-before});   // deal a full hand on turn 1, then one card a turn (two if your hand is empty); unplayed cards stay in hand until the fight ends
  render(); autoEndCheck();
}
function draw(n){ drawFrom(G.fight,n); }
// ---- decks (synergy groups, js/data/decks.js): per fight, how many cards of each deck you played this turn and this fight, and each deck's standing damage bonus ----
function packMaps(F){ F.deckTurn=F.deckTurn||{}; F.deckFight=F.deckFight||{}; F.deckBuff=F.deckBuff||{}; return F; }
function packCount(deck,scope){ if(!deck||!G||!G.fight) return 0; const F=packMaps(G.fight); return (scope==='fight'?F.deckFight:F.deckTurn)[deck]||0; }
function addBlock(n){ const F=G.fight; F.block+=n; floatP(`🛡️ +${n}`,'block'); log(`You gain ${n} Block`); sfx('block'); const f=fx(); if(f) f.player('phys',1); }
function needsTarget(d){ return d.fx.some(f=>(f[0]==='dmg'&&!(f[2]&&f[2].aoe))||(f[0]==='se'&&!(f[3]&&f[3].aoe))||(f[0]==='special'&&['execute','snipe','retaliation','stDmg','doubleSt','spread','blockDmg','playedDmg','sabotage','pilfer','mimic','packStatus'].includes(f[1])&&!(f[2]&&f[2].aoe))||(f[0]==='special'&&f[1]==='pack'&&(f[2]||{}).what==='dmg'&&!(f[2]&&f[2].aoe))); }
function canPlay(inst){ const F=G.fight; const d=CARD[inst.id]; return !d.unplayable&&F.energy>=cardCost(inst.id); }
function autoEndCheck(){
  clearTimeout(UI.autoTimer); const F=G.fight; if(!F||F.over||UI.busy) return;
  if(F.hand.some(canPlay)) return;
  UI.autoTimer=setTimeout(()=>{ const F2=G.fight; if(!F2||F2.over||UI.busy||G.phase!=='battle') return; if(F2.hand.some(canPlay)) return; toast(F2.hand.length?'Nothing left to play. Ending turn.':'Hand empty. Ending turn.'); endTurn(); },900);
}
async function playCard(idx){
  const F=G.fight; if(!F||F.over||UI.busy) return; const inst=F.hand[idx]; if(!inst) return; const d=CARD[inst.id]; const cost=cardCost(inst.id);
  if(d.unplayable){ toast('Curses cannot be played. Remove them at a merchant.'); return; }
  if(F.energy<cost){ toast('Not enough Mana'); return; }
  clearTimeout(UI.autoTimer);
  let target=null;
  if(needsTarget(d)){ target=F.enemies[F.target]; if(!target||!target.alive){ target=F.enemies.find(e=>e.alive); F.target=F.enemies.indexOf(target); } }
  UI.busy=true; sfx('play',{type:d.type,el:d.el}); const f=fx(); if(f){ f.playCard(idx,target); await sleep(200); }
  F.energy-=cost; F.hand.splice(idx,1); F.played++; if(d.type==='attack') F.turnAttacks++;
  log(`You play ${d.name}${curTier(inst.id)>tierIdx(inst.id)?' ('+TIERS[curTier(inst.id)]+')':''}`);
  if(d.quip){ log(`${d.name}: ${d.quip}`,'good'); floatP(d.quip,'se'); }   // a card with something to say says it
  try{ await runEffects(d,cardVals(inst.id),target,inst); }catch(err){ console.error(err); }
  { const dk=deckOf(d); const M=packMaps(F); M.deckTurn[dk]=(M.deckTurn[dk]||0)+1; M.deckFight[dk]=(M.deckFight[dk]||0)+1; }   // counted after its effects: a card reads the cards of its nature that came before it
  if(inst.inPlay){ /* sits in a passive slot */ }
  else if(inst.temp){ log(`${d.name} fades away`); }
  else if(d.consume){ removeCard(inst.id); log(`${d.name} is consumed for good.`,'good'); }
  else if(d.exhaust) F.exhaust.push(inst); else F.discard.push(inst);
  if(d.retain) F.retain=true;
  UI.busy=false;
  await afterAction();
}
async function runEffects(d,v,target,inst){
  const F=G.fight; const alive=()=>F.enemies.filter(e=>e.alive); const src=d.name; const kind=d.type==='spell'?'spell':'phys';
  const dk=deckOf(d); const DK=DECKS[dk]; let comboed=false;
  for(const f of d.fx){
    const t=f[0]; const op=fxOpts(f);
    if(op.ifPack){ if(!packCount(deckOf(d),'turn')){ log(`${src}'s combo needs another ${DK?DK.n:'deck'} card played first this turn`); continue; } if(!comboed){ comboed=true; log(`${src} combos with your ${DK?DK.n:'deck'} cards!`,'se'); floatP(`${DK?DK.i:'⛓'} Combo!`,'se'); } }   // a combo effect only fires after a deck-mate this turn
    if(t==='dmg'){ const o=f[2]||{}; const hits=o.hits?(typeof o.hits==='string'?v[o.hits]:o.hits):1; const base=v[f[1]]+(o.pp?(v[o.pp]||0)*packCount(deckOf(d),'turn'):0);
      for(let h=0;h<hits;h++){ const ts=o.aoe?alive():[target].filter(e=>e&&e.alive); if(!ts.length) break; for(const e of ts) hitEnemy(e,base,{kind,el:d.el,pierce:o.pierce,ls:o.ls,bv:o.bv,bvm:o.bvm,src,deck:deckOf(d),isAttack:d.type==='attack',isSpell:d.type==='spell'}); if(hits>1){ render(); await sleep(150); } } }
    else if(t==='block') addBlock(v[f[1]]);
    else if(t==='armor'){ F.armorT+=v[f[1]]; log(`+${v[f[1]]} Armor for this fight`,'good'); }
    else if(t==='se'){ const o=f[3]||{}; const val=f[2]?v[f[2]]:1; const ts=o.aoe?alive():[target].filter(e=>e&&e.alive); for(const e of ts) applyStatusEnemy(e,f[1],val); }
    else if(t==='ss') applySelf(f[1],f[2]?v[f[2]]:1);
    else if(t==='heal'){ const h=heal(v[f[1]]); floatP(`+${h}`,'heal'); log(`${src} heals ${h}`,'good'); sfx('heal'); { const x=fx(); if(x) x.player(d.el==='holy'?'holy':d.el,1); } }
    else if(t==='healPct'){ const h=heal(Math.round(G.p.maxHp*v[f[1]]/100)); floatP(`+${h}`,'heal'); log(`${src} heals ${h}`,'good'); sfx('heal'); { const x=fx(); if(x) x.player('holy',1); } }
    else if(t==='draw') draw(v[f[1]]);
    else if(t==='energy'){ F.energy=Math.min(MANA_CAP,F.energy+v[f[1]]); log(`+${v[f[1]]} Mana`,'good'); floatP(`+${v[f[1]]} Mana`,'mana'); sfx('mana'); }
    else if(t==='maxEnergy'){ F.energyBonus+=v[f[1]]; F.energy=Math.min(MANA_CAP,F.energy+v[f[1]]); log(`+${v[f[1]]} Mana every turn this fight`,'good'); }
    else if(t==='selfDmg') dmgPlayerRaw(v[f[1]],src);
    else if(t==='cleanse'){ for(const k of ['burn','poison','weak','vuln','chill','shock']) delete F.st[k]; log('Your debuffs are removed','good'); }
    else if(t==='stat'){ G.p[f[1]]+=v[f[2]]; if(f[1]==='maxHp') G.p.hp+=v[f[2]]; log(`Permanently +${v[f[2]]} ${STATNAMES[f[1]]}!`,'good'); }
    else if(t==='passive') playPassive(inst,f[1]);
    else if(t==='special') await special(f[1],f[2]||{},d,v,target,kind);
  }
  render();
}
async function special(name,p,d,v,target,kind){
  const F=G.fight; const alive=()=>F.enemies.filter(e=>e.alive); const m=p.m?v[p.m]:1; const o=(x)=>Object.assign({kind,el:d.el,src:d.name,deck:deckOf(d),isAttack:d.type==='attack',isSpell:d.type==='spell'},x||{}); const DK=DECKS[deckOf(d)]||{n:'deck',i:'🎴'};
  if(name==='execute'){ if(!target||!target.alive) return; const low=target.hp/target.maxHp<(p.pct||30)/100; hitEnemy(target,v.dmg*(low?2:1),o()); if(low) log('Execute! Double damage','se'); }
  else if(name==='snipe'){ if(target&&target.alive) hitEnemy(target,v.dmg,o({pierce:1,critBonus:50})); }
  else if(name==='retaliation'){ if(target&&target.alive) hitEnemy(target,(F.thornsT+pSum('thorns'))*m,o({el:'phys'})); }
  else if(name==='stDmg'){ const ts=p.aoe?alive():[target].filter(e=>e&&e.alive); for(const e of ts){ const st=e.st[p.s]||0; if(!st){ log(`${e.name} has no ${ST[p.s].n}`); continue; } hitEnemy(e,st*m,o({kind:'spell'})); if(p.consume) delete e.st[p.s]; } }
  else if(name==='doubleSt'){ const ts=p.aoe?alive():[target].filter(e=>e&&e.alive); for(const e of ts) if(e.st[p.s]){ e.st[p.s]*=2; log(`${e.name}'s ${ST[p.s].n} doubles to ${e.st[p.s]}`,'se'); floatE(e,`${ST[p.s].i} ×2`,'se'); } }
  else if(name==='spread'){ if(!target||!target.alive) return; for(const e of alive()){ if(e===target) continue; for(const s of ['burn','poison','shock','chill','wet']) if(target.st[s]) e.st[s]=Math.max(e.st[s]||0,target.st[s]); } log(`${target.name}'s afflictions spread to every enemy`,'se'); }
  else if(name==='blockDmg'){ if(target&&target.alive) hitEnemy(target,F.block*m,o()); }
  else if(name==='playedDmg'){ if(target&&target.alive) hitEnemy(target,F.played*m,o()); }
  else if(name==='elBoost'){ F.elBoost[p.el]=(F.elBoost[p.el]||0)+v[p.v]; log(`${EL[p.el].n} cards deal +${v[p.v]}% this fight`,'good'); }
  else if(name==='parry'){ F.parry=true; }
  else if(name==='redraw'){ const n=v[p.n]||2; let k=0; for(let i=0;i<n&&F.hand.length;i++){ const j=Math.floor(Math.random()*F.hand.length); const c=F.hand.splice(j,1)[0]; F.discard.push(c); k++; } draw(n); log(`Discarded ${k}, drew ${n}`,'good'); }
  else if(name==='sabotage'){ const e=(target&&target.alive&&target.passives.length)?target:alive().find(x=>x.passives.length); if(!e){ log('No enemy passive to sabotage'); return; } const px=pick(e.passives); removePassive(e.passives,px,'destroyed'); log(`${px.name} is destroyed!`,'se'); floatE(e,`${px.icon} destroyed`,'se'); sfx('break'); }
  else if(name==='emp'){ let n=0; for(const e of alive()) while(e.passives.length){ removePassive(e.passives,e.passives[0],'destroyed'); n++; } log(n?`EMP destroys ${n} enemy passive${n>1?'s':''}!`:'EMP finds nothing to destroy',n?'se':''); if(n) sfx('break'); }
  else if(name==='pilfer'){ const e=(target&&target.alive&&target.passives.length)?target:alive().find(x=>x.passives.length); if(!e){ log('Nothing to steal'); return; } stealPassive(e,pick(e.passives)); }
  else if(name==='pilferAll'){ let n=0; for(const e of alive()) while(e.passives.length&&n<PS('slots')){ stealPassive(e,e.passives[0]); n++; } if(!n) log('Nothing to steal'); }
  else if(name==='mimic'){ const e=target&&target.alive?target:alive()[0]; if(!e) return; let el=e.el; if(el==='beast'||el==='phys') el=pick(Object.keys(EL).filter(k=>k!=='beast'&&k!=='phys')); const id=randomCardId('fight',[],x=>x.el===el&&x.type!=='curse'); F.hand.push({uid:UI.uid++,id,temp:true}); log(`You conjure ${CARD[id].name} from ${e.name}'s essence`,'se'); }
  // ---- deck synergies (js/data/decks.js) ----
  else if(name==='packStatus'){ if(!target||!target.alive) return; const cnt=packCount(deckOf(d),'turn'); const chance=Math.min(100,(p.base||0)+(p.per||0)*cnt); const val=v[p.v]||1;
    if(Math.random()*100<chance){ applyStatusEnemy(target,p.s,val); log(`${d.name}'s ${ST[p.s].n} takes hold (${chance}% with ${cnt} ${DK.n} card${cnt===1?'':'s'} before it)`,'se'); }
    else { log(`${d.name} rolls ${chance}% for ${ST[p.s].n}: nothing`); floatE(target,`${ST[p.s].i} miss`,'miss'); } }
  else if(name==='tutor'){ const want=v[p.n]||1; const got=[]; for(const pile of [F.draw,F.discard]){ while(got.length<want&&F.hand.length+got.length<10){ const idx=pile.map((c,i)=>deckOf(CARD[c.id])===deckOf(d)?i:-1).filter(i=>i>=0); if(!idx.length) break; got.push(pile.splice(pick(idx),1)[0]); } }
    for(const c of got) F.hand.push(c); if(got.length){ log(`${d.name} calls ${got.map(c=>CARD[c.id].name).join(', ')} to your hand`,'good'); sfx('draw',{n:got.length}); } else log(`${d.name} calls, but no ${DK.n} card answers`); }
  else if(name==='packBuff'){ const M=packMaps(F); const x=v[p.v]||1; M.deckBuff[deckOf(d)]=(M.deckBuff[deckOf(d)]||0)+x; log(`${DK.n} cards deal +${x} damage for the rest of the fight (now +${M.deckBuff[deckOf(d)]})`,'good'); floatP(`${DK.i} +${x} dmg`,'mana'); }
  else if(name==='pack'){ const cnt=packCount(deckOf(d),p.scope||'turn'); const amt=(v[p.m]||1)*cnt; const what=p.what||'dmg'; if(!cnt){ log(`${d.name}: no ${DK.n} card ${p.scope==='fight'?'played yet this fight':'came before it this turn'}`); return; }
    log(`${d.name} counts ${cnt} ${DK.n} card${cnt===1?'':'s'} this ${p.scope==='fight'?'fight':'turn'}`,'se');
    if(what==='dmg'){ const ts=p.aoe?alive():[target].filter(e=>e&&e.alive); for(const e of ts) hitEnemy(e,amt,o({pierce:p.pierce})); }
    else if(what==='block') addBlock(amt); else if(what==='heal'){ const h=heal(amt); floatP(`+${h}`,'heal'); log(`${d.name} heals ${h}`,'good'); sfx('heal'); }
    else if(what==='energy'){ F.energy=Math.min(MANA_CAP,F.energy+amt); log(`+${amt} Mana`,'good'); floatP(`+${amt} Mana`,'mana'); sfx('mana'); } else if(what==='draw') draw(amt); }
}
function calcDmg(base,kind,el,e,o){
  o=o||{}; const F=G.fight;
  let d=base+(o.noStat?0:(kind==='phys'?F.str+pSum('atkBonus'):F.spellT+pSum('spellBonus')));   // no base stats: Strength and Focus come from cards
  if(o.deck&&F.deckBuff&&F.deckBuff[o.deck]) d+=F.deckBuff[o.deck];   // the deck's standing bonus (Rat King, Hymn, Moonlit Hunt...)
  if(F.st.weak) d*=0.75;
  d*=1+(elBoostPct(el)+(F.elBoost[el]||0))/100;
  if(o.isAttack&&F.turnAttacks===1&&hasP('firstAttackMult')) d*=2;
  if(hasP('fullMechaMult')&&mechaCount(F.passives)>=3) d*=1+pSum('fullMechaMult')/100;
  let mult=typeMult(el,e.el); const se=mult>1, res=mult<1;
  if(e.st.wet){ if(el==='light'||el==='ice') mult*=1.5; if(el==='fire') mult*=0.5; }
  if(e.st.vuln) mult*=1.5;
  if(o.bv&&e.st[o.bv]) mult*=(o.bvm||2);
  d*=mult;
  const crit=Math.random()*100<(F.critT+(o.critBonus||0)); if(crit) d*=1.5;
  return {d:Math.max(0,Math.round(d)),se,res,crit,combo:!!(o.bv&&e.st[o.bv])};
}
function hitEnemy(e,base,o){
  if(!e||!e.alive) return 0;
  if(e.evade&&o.isAttack&&Math.random()*100<e.evade){ log(`${e.name} fades from your attack`,'bad'); floatE(e,'Fade','miss'); sfx('dodge'); return 0; }   // Drain: shadow enemies slip attack cards
  if(e.dodgeNext&&!o.summon){ e.dodgeNext=false; log(`${e.name} evades your ${o.src||'attack'}`,'bad'); floatE(e,'Evaded','miss'); sfx('dodge'); return 0; }
  if(e.fly&&!o.summon&&Math.random()*100<e.fly){ log(`${e.name} swoops out of the way of your ${o.src||'attack'}`,'bad'); floatE(e,'Swoop','miss'); sfx('dodge'); return 0; }   // Wings
  if(e.el==='poison'&&o.isAttack&&!o.summon){ applyStatusPlayer('poison',1); }   // Toxic Blood
  const F=G.fight; const r=calcDmg(base,o.kind,o.el,e,o);
  const dealt=damageEnemy(e,r.d,{pierce:o.pierce,el:o.el}); sfx('hit',{el:o.el,se:r.se,crit:r.crit});
  const ls=(o.ls||0)+(o.isAttack?pSum('lifesteal'):0); if(ls>0&&dealt>0){ const h=heal(Math.max(1,Math.round(dealt*ls/100))); if(h>0) floatP(`+${h}`,'heal'); }
  if(o.kind==='phys'&&!o.summon&&e.thorns>0&&e.alive){ G.p.hp-=e.thorns; floatP(`-${e.thorns} thorns`,'dmg'); log(`${e.name}'s thorns deal ${e.thorns} to you`,'bad'); }
  if(e.alive){ for(const p of F.passives){ const s=o.isAttack?pv_(p,'attackStatus'):o.isSpell?pv_(p,'spellStatus'):null; if(s) applyStatusEnemy(e,s,pv_(p,'sv')||1); } }
  if(e.alive&&e.counterNext&&!o.summon){ e.counterNext=false; const c=Math.max(1,Math.round(e.atk*0.8)); dmgPlayerRaw(c,`${e.name}'s riposte`); }
  if(e.el==='fighting'&&o.isAttack&&!o.summon&&e.alive&&G.p.hp>0&&Math.random()<0.3){ dmgPlayerRaw(Math.max(1,Math.round(e.atk*0.5)),`${e.name}'s counter punch`); }   // Counter
  let tag=r.se?' SUPER EFFECTIVE!':r.res?' (resisted)':''; if(r.combo) tag+=' COMBO!'; if(r.crit) tag+=' CRIT!';
  floatE(e,r.se||r.combo?`${dealt}!`:`${dealt}`,r.se||r.combo?'se':'dmg');
  log(`${o.src||'You'} hit${o.src?'s':''} ${e.name} for ${dealt} ${EL[o.el].n.toLowerCase()}${tag}`,r.se||r.combo?'se':'');
  return dealt;
}
function damageEnemy(e,amount,o){
  o=o||{}; let dmg=amount;
  if(!o.pierce&&e.block>0){ const b=Math.min(e.block,dmg); e.block-=b; dmg-=b; if(b) floatE(e,`🛡️${b}`,'block'); }
  if(!o.pierce&&dmg>0) dmg=Math.max(0,dmg-(e.armor||0));
  e.hp-=dmg;
  if(dmg>0&&e.st.shock>0){ const x=e.st.shock; e.hp-=x; dmg+=x; e.st.shock--; if(e.st.shock<=0) delete e.st.shock; log(`Shock adds ${x} damage`); }
  const f=fx(); if(f) f.hit(e,o.el||'phys');
  if(e.hp<=0){ e.hp=0; e.alive=false; G.kills++; log(`${e.name} is slain!`,'good'); if(f) f.death(e); sfx('death'); if(e.el==='fire'&&G.p.hp>0){ const c=Math.min(Math.max(1,e.lvl||1),G.p.hp-1); if(c>0){ dmgPlayerRaw(c,`${e.name}'s cinders`); if(f) f.player('fire',2); } } }   // Cinder: the burst hurts but never kills; it leaves you at 1 HP at worst
  return dmg;
}
function damageEnemyRaw(e,amount,el,src){ if(!e.alive) return; const d=Math.max(0,Math.round(amount)); e.hp-=d; floatE(e,`${d}`,'dmg'); log(`${src} deals ${d} to ${e.name}`); const f=fx(); if(f) f.hit(e,el); sfx('tick',{el}); if(e.hp<=0){ e.hp=0; e.alive=false; G.kills++; log(`${e.name} is slain!`,'good'); if(f) f.death(e); sfx('death'); } }
function applyStatusEnemy(e,s,val){ { const f=fx(); if(f&&e&&e.alive) f.status(e,s); }
  if(!e.alive) return;
  if(s==='frozen'){ e.st.frozen=1; log(`${e.name} is Frozen and will skip its turn!`,'se'); floatE(e,'Frozen!','se'); sfx('freeze'); return; }
  e.st[s]=(e.st[s]||0)+val; sfx('status',{s});
  if(s==='chill'){ const th=e.boss?5:3; if(e.st.chill>=th){ delete e.st.chill; e.st.frozen=1; log(`${e.name} freezes solid!`,'se'); floatE(e,'Frozen!','se'); sfx('freeze'); return; } }
  log(`${e.name} gains ${val} ${ST[s].n}`);
}
function applySelf(s,val){ const F=G.fight;
  if(s==='dodgeNext') F.dodgeNext=true; else if(s==='counterNext') F.counterNext=true; else if(s==='str') F.str+=val; else if(s==='spellT') F.spellT+=val; else if(s==='thornsT') F.thornsT+=val; else if(s==='regen') F.regen+=val; else if(s==='critT') F.critT+=val; else if(s==='dodgeT') F.dodgeT+=val;
  log(`You gain ${['dodgeNext','counterNext'].includes(s)?'':val+' '}${ST[s].n}`,'good');
}
function applyStatusPlayer(s,val){ const F=G.fight; if(s==='chill'){ F.st.chill=1; } else F.st[s]=(F.st[s]||0)+val; log(`You are afflicted with ${val} ${ST[s].n}`,'bad'); }
function scaledDebuff(s,v,e){ return (s==='burn'||s==='poison')?Math.max(1,Math.round(v*(0.6+e.atkScale*0.4))):v; }
function dmgPlayerRaw(n,src){ n=Math.max(0,Math.round(n)); G.p.hp-=n; floatP(`-${n}`,'dmg'); log(`${src} deals ${n} damage to you`,'bad'); const f=fx(); if(f&&n>0) f.playerHit(); }
function checkDeath(){ if(G.p.hp<=0){ G.p.hp=0; gameOver(); return true; } return false; }
async function afterAction(){
  const F=G.fight; if(!F||F.over) return;
  if(checkDeath()) return;
  if(F.enemies.every(e=>!e.alive)){ render(); await sleep(500); winFight(); return; }
  render(); autoEndCheck();
}
function intentInfo(e){
  const it=nextAction(e); const F=G.fight;
  if(e.st.frozen) return {i:'🧊',t:'Frozen: skips turn'};
  const enraged=e.enrage&&e.hp<e.maxHp*0.5; const surge=e.el==='light'&&F&&F.turn%3===0;
  const hint=`${e.crit?' · may crit':''}${enraged?' · enraged':''}${surge?' · acts twice':''}`;
  const scale=base=>{ let d=base+(e.st.str||0)+enemyAtkBonus(e); if(e.st.weak) d*=0.75; if(enraged) d*=e.enrage; if(F&&F.st.vuln) d*=1.5; return Math.round(d); };
  if(it.t==='atk'){ const d=scale(e.atk*(it.m||1)); return {i:'⚔️',t:`Attack <b>${d}</b>${(it.hits||1)>1?` ×${it.hits}`:''}${it.s?` + ${ST[it.s].i}${ST[it.s].n}`:''}${hint}`}; }
  if(it.t==='move'){ const d=CARD[it.id]; if(!d) return {i:'?',t:'...'}; const v=cardVals(it.id,tierIdx(it.id)); const sc=e.atkScale; const bits=[];
    for(const fxn of d.fx.slice(0,3)){ const t=fxn[0];
      if(t==='dmg'){ const o=fxn[2]||{}; const hits=o.hits?(typeof o.hits==='string'?v[o.hits]:o.hits):1; bits.push(`<b>${scale(Math.max(1,Math.round(v[fxn[1]]*sc)))}</b>${hits>1?` ×${hits}`:''}${o.pierce?' pierce':''}`); }
      else if(t==='se'){ const st=fxn[1]==='frozen'?'chill':fxn[1]; bits.push(`${ST[st].i}${st==='chill'?'':scaledDebuff(st,v[fxn[2]]||1,e)}`); }
      else if(t==='block') bits.push(`🛡️${Math.round(Math.max(1,Math.round(v[fxn[1]]*sc))*(e.el==='earth'?1.5:1))}`);
      else if(t==='heal') bits.push(`💚${Math.max(1,Math.round(v[fxn[1]]*sc))}`); else if(t==='healPct') bits.push(`💚${Math.round(e.maxHp*(v[fxn[1]]||10)/100)}`);
      else if(t==='ss') bits.push(fxn[1]==='dodgeNext'?'💨 evasive':fxn[1]==='counterNext'?'🗡️ riposte':fxn[1]==='regen'?'💚 regen':fxn[1]==='thornsT'?'🌵 thorns':'💪 strength');
      else if(t==='passive') bits.push(`☗ ${PASSIVES[fxn[1]]?PASSIVES[fxn[1]].name:'ally'}`); else if(t==='armor') bits.push('🪨 armor'); else if(t==='cleanse') bits.push('✚ cleanse'); else if(t==='special') bits.push(fxn[1]==='packBuff'?'💪 strength':'✦'); }
    return {i:d.icon,t:`<b>${esc(d.name)}</b> · ${bits.join(' + ')}${hint}`}; }
  if(it.t==='def') return {i:'🛡️',t:`Block <b>${Math.round(it.v*e.atkScale)}</b>`};
  if(it.t==='buff') return {i:'💪',t:'Gains Strength'};
  if(it.t==='debuff') return {i:ST[it.s].i,t:`Inflicts ${it.v} ${ST[it.s].n}`};
  if(it.t==='heal') return {i:'💚',t:`Heals ${Math.round(e.maxHp*it.p)}`};
  if(it.t==='dispel') return {i:'🚫',t:'Destroys one of your passives'};
  if(it.t==='summon') return {i:'☗',t:`Summons ${PASSIVES[it.id]?PASSIVES[it.id].name:'an ally'}`};
  return {i:'?',t:'...'};
}
function enemyAtkBonus(e){ let t=0; for(const p of e.passives){ const x=pv_(p,'atkBonus'); if(x) t+=x; } return t; }
async function passivesEndTurn(){
  const F=G.fight; const alive=()=>F.enemies.filter(e=>e.alive); const tgt=()=>(F.enemies[F.target]&&F.enemies[F.target].alive)?F.enemies[F.target]:alive()[0];
  for(const p of F.passives.slice()){
    if(!alive().length) break;
    const o=(x)=>Object.assign({kind:'phys',el:p.el==='beast'?'phys':p.el,src:p.name,noStat:true,summon:true,pierce:true},x||{});   // passive damage ignores Block and Armor: only direct hits are stopped by them
    const sa=pv_(p,'sAttack'); if(sa){ const hits=pv_(p,'hits')||1; for(let h=0;h<hits;h++){ const e=pv_(p,'sRandom')?pick(alive()):tgt(); if(!e) break; hitEnemy(e,sa,o()); } }
    const sall=pv_(p,'sAll'); if(sall) for(const e of alive()) hitEnemy(e,sall,o());
    const ss=pv_(p,'sStatus'); if(ss){ const e=tgt(); if(e) applyStatusEnemy(e,ss,pv_(p,'sv')||1); }
    const sb=pv_(p,'sBlock'); if(sb) addBlock(sb);
    const sth=pv_(p,'sThorns'); if(sth){ F.thornsT+=sth; log(`${p.name} grows ${sth} Thorns`,'good'); }
    const eb=pv_(p,'endBlockPerMecha'); if(eb) addBlock(eb*mechaCount(F.passives));
    const ea=pv_(p,'endDmgPerAttack'); if(ea&&F.turnAttacks){ const e=tgt(); if(e) hitEnemy(e,ea*F.turnAttacks,o()); }
    const er=pv_(p,'endDmgRandom'); if(er){ const e=pick(alive()); if(e) hitEnemy(e,er,o()); }
    const eall=pv_(p,'endDmgAll'); if(eall) for(const e of alive()) hitEnemy(e,eall,o());
    render(); await sleep(160);
  }
}
async function endTurn(){
  const F=G.fight; if(!F||F.over||UI.busy) return; UI.busy=true; clearTimeout(UI.autoTimer);
  for(const inst of F.hand){ const d=CARD[inst.id]; if(d.endTurnDmg) dmgPlayerRaw(d.endTurnDmg,d.name); }
  { const keep=[]; for(const inst of F.hand){ if(inst.temp) continue; if(CARD[inst.id].unplayable) F.discard.push(inst); else keep.push(inst); } F.hand=keep; }   // hand persists; curses rotate back into the deck, conjured cards fade
  for(const k of ['weak','vuln','wet']) if(F.st[k]){ F.st[k]--; if(F.st[k]<=0) delete F.st[k]; }
  if(checkDeath()){ UI.busy=false; return; }
  render();
  if(F.passives.length){ await passivesEndTurn(); if(F.enemies.every(e=>!e.alive)){ UI.busy=false; await sleep(400); winFight(); return; } }
  const f=fx(); if(f) f.banner('Enemy turn','dim'); sfx('enemyturn'); await sleep(500);
  for(const e of F.enemies){ if(!e.alive) continue; e.block=0; await enemyAct(e); if(G.p.hp<=0){ checkDeath(); UI.busy=false; return; } render(); await sleep(420); }   // Block resets when the enemy acts again, so what it braces now protects it through your turn
  for(const e of F.enemies){ if(!e.alive) continue; for(const k of ['weak','vuln','wet']) if(e.st[k]){ e.st[k]--; if(e.st[k]<=0) delete e.st[k]; } }
  UI.busy=false;
  if(F.enemies.every(e=>!e.alive)){ winFight(); return; }
  startPlayerTurn();
}
async function enemyPassives(e){
  const F=G.fight;
  for(const p of e.passives.slice()){
    if(!e.alive||G.p.hp<=0) return;
    const sa=pv_(p,'sAttack')||pv_(p,'sAll'); if(sa){ const hits=pv_(p,'hits')||1; for(let h=0;h<hits;h++){ await enemyHitPlayer(e,sa,{src:p.name,icon:p.icon,indirect:true}); if(G.p.hp<=0) return; } }
    const ss=pv_(p,'sStatus'); if(ss){ applyStatusPlayer(ss,pv_(p,'sv')||1); floatP(`${ST[ss].i} ${ST[ss].n}`,'dmg'); }
    const sb=pv_(p,'sBlock')||(pv_(p,'endBlockPerMecha')?pv_(p,'endBlockPerMecha')*mechaCount(e.passives):0); if(sb){ e.block+=sb; log(`${p.name} shields ${e.name}: +${sb} Block`); floatE(e,`🛡️${sb}`,'block'); }
    const sh=pv_(p,'sHeal')||pv_(p,'healPerTurn'); if(sh){ e.hp=Math.min(e.maxHp,e.hp+sh); log(`${p.name} heals ${e.name} ${sh}`,'bad'); floatE(e,`+${sh}`,'heal'); }
    const ed=pv_(p,'endDmgRandom')||pv_(p,'endDmgAll'); if(ed){ await enemyHitPlayer(e,ed,{src:p.name,icon:p.icon,indirect:true}); if(G.p.hp<=0) return; }
    render(); await sleep(180);
  }
}
async function enemyAct(e){
  if(e.st.poison){ const x=e.st.poison; damageEnemyRaw(e,Math.round(x*typeMult('poison',e.el)),'poison','Poison'); e.st.poison--; if(e.st.poison<=0) delete e.st.poison; if(!e.alive) return; }
  if(e.st.burn){ const x=e.st.burn; damageEnemyRaw(e,Math.round(x*typeMult('fire',e.el)),'fire','Burn'); e.st.burn=Math.floor(x/2); if(e.st.burn<=0) delete e.st.burn; if(!e.alive) return; }
  if(e.st.frozen){ delete e.st.frozen; log(`${e.name} is frozen and skips its turn`,'good'); floatE(e,'Frozen','block'); render(); await sleep(300); return; }
  // nature traits at the start of its turn
  if(e.el==='grass'&&!e.st.burn&&e.hp<e.maxHp){ const h=Math.max(1,Math.round(e.maxHp*0.05)); e.hp=Math.min(e.maxHp,e.hp+h); log(`${e.name} regrows ${h}`,'bad'); floatE(e,`+${h}`,'heal'); }
  if(e.el==='holy'){ const k=['poison','burn','chill','shock','wet','weak','vuln'].find(x=>e.st[x]); if(k){ delete e.st[k]; log(`${e.name} wards off ${ST[k].n}`,'bad'); floatE(e,'✨ Ward','block'); } }
  if(e.el==='ice'){ const b=Math.max(1,Math.round((e.lvl||1)/3)); e.block+=b; log(`${e.name} grows frost armor: +${b} Block`); }   // a third of its level a turn: frost, not a wall
  if(e.el==='water'&&G.fight.st.wet&&e.hp<e.maxHp){ const h=Math.max(1,Math.round(e.maxHp*0.06)); e.hp=Math.min(e.maxHp,e.hp+h); log(`${e.name} rides the tide: +${h}`,'bad'); floatE(e,`+${h}`,'heal'); }
  if(e.regen>0&&e.hp<e.maxHp){ const h=Math.min(e.regen,e.maxHp-e.hp); e.hp+=h; log(`${e.name} regenerates ${h}`,'bad'); floatE(e,`+${h}`,'heal'); }
  if(e.passives.length){ await enemyPassives(e); if(G.p.hp<=0||!e.alive) return; }
  const f=fx(); const F=G.fight; let it; const mv=e.moves||FOE_MOVES[e.id]||[];
  if(mv.length){ e.mana=(e.mana||0)+1; if(e.mana>=(e.manaMax||FOE_MANA)){ it={t:'move',id:mv[(e.mi||0)%mv.length]}; e.mi=(e.mi||0)+1; e.mana=0; } else it=A(e.boss?1.2:1); }   // one Mana a turn; the ability when it is full
  else { it=e.pat[e.pi%e.pat.length]; e.pi++; }
  if(it.t==='move'){ await runEnemyMove(e,it.id); if(e.el==='light'&&F.turn%3===0&&e.alive&&G.p.hp>0){ log(`${e.name} surges and acts again!`,'bad'); render(); await sleep(350); await enemyBasicAttack(e,A(e.boss?1.2:1)); } }
  else if(it.t==='atk'){ await enemyBasicAttack(e,it); if(e.el==='light'&&F.turn%3===0&&e.alive&&G.p.hp>0){ log(`${e.name} surges and acts again!`,'bad'); render(); await sleep(350); await enemyBasicAttack(e,A(e.boss?1.2:1)); } }
  else if(it.t==='def'){ const b=Math.round(it.v*e.atkScale*(e.el==='earth'?1.5:1)); e.block+=b; log(`${e.name} braces: +${b} Block`); floatE(e,`🛡️${b}`,'block'); sfx('eblock'); }
  else if(it.t==='buff'){ const v=Math.max(1,Math.round(it.v*e.atkScale*0.5)); e.st.str=(e.st.str||0)+v; log(`${e.name} gains ${v} Strength`,'bad'); floatE(e,`💪+${v}`,'se'); sfx('ebuff'); }
  else if(it.t==='debuff'){ applyStatusPlayer(it.s,scaledDebuff(it.s,it.v,e)); floatP(`${ST[it.s].i} ${ST[it.s].n}`,'dmg'); sfx('debuff'); }
  else if(it.t==='heal'){ const h=Math.round(e.maxHp*it.p); e.hp=Math.min(e.maxHp,e.hp+h); log(`${e.name} heals ${h}`,'bad'); floatE(e,`+${h}`,'heal'); sfx('eheal'); }
  else if(it.t==='dispel'){ if(F.passives.length){ const p=pick(F.passives); removePassive(F.passives,p,'destroyed'); log(`${e.name} destroys your ${p.name}!`,'bad'); floatP(`${p.icon} destroyed`,'dmg'); sfx('break'); } else log(`${e.name} finds nothing to dispel`); }
  else if(it.t==='summon'){ const p=addEnemyPassive(e,it.id); if(p){ log(`${e.name} summons ${p.name}!`,'bad'); floatE(e,`${p.icon} ${p.name}`,'se'); sfx('passive',{kind:'summon'}); } else log(`${e.name} tries to summon, but its ranks are full`); }
}
function enemyDmg(e,base){ let d=base+(e.st.str||0)+enemyAtkBonus(e); if(e.st.weak) d*=0.75; if(e.enrage&&e.hp<e.maxHp*0.5) d*=e.enrage; let crit=false; if(e.crit&&Math.random()*100<e.crit){ d*=1.5; crit=true; } return {d:Math.max(0,Math.round(d)),crit}; }
async function enemyBasicAttack(e,it){ const f=fx(); for(let h=0;h<(it.hits||1);h++){ if(f){ f.lunge(e); await sleep(160); } const {d,crit}=enemyDmg(e,e.atk*(it.m||1)); await enemyHitPlayer(e,d,{src:e.name+(crit?' (critical)':''),counter:true,drain:e.ls,radiant:e.el==='holy'}); if(G.p.hp<=0||!e.alive) return; if((it.hits||1)>1){ render(); await sleep(220); } } }
// An enemy plays one of its ability cards: the card's effects, read from its point of view (damage and statuses land on you, buffs and heals on it).
async function runEnemyMove(e,id){
  const d=CARD[id]; if(!d) return; const F=G.fight; const v=cardVals(id,tierIdx(id)); const f=fx(); const sc=e.atkScale; const num=k=>Math.max(1,Math.round((v[k]||1)*sc));
  log(`${e.name} uses ${d.name}!`,'bad'); floatE(e,`${d.icon} ${d.name}`,'se'); sfx('play',{type:d.type,el:d.el}); render(); await sleep(260);
  const strike=async(base,o)=>{ const {d:dm,crit}=enemyDmg(e,base); const hit=await enemyHitPlayer(e,dm,Object.assign({src:`${e.name}'s ${d.name}`+(crit?' (critical)':''),counter:true,drain:e.ls,radiant:e.el==='holy',el:d.el},o||{})); return hit; };
  for(const fxn of d.fx){ if(!e.alive||G.p.hp<=0) return; const t=fxn[0];
    if(t==='dmg'){ const o=fxn[2]||{}; const hits=o.hits?(typeof o.hits==='string'?v[o.hits]:o.hits):1; let base=num(fxn[1]); if(o.bv&&F.st[o.bv]) base*=2;
      for(let h=0;h<hits;h++){ if(f){ f.lunge(e); await sleep(140); } await strike(base,{drain:e.ls||!!o.ls,pierce:!!o.pierce}); if(G.p.hp<=0||!e.alive) return; if(hits>1){ render(); await sleep(200); } } }
    else if(t==='se'){ const st=fxn[1]==='frozen'?'chill':fxn[1]; applyStatusPlayer(st,scaledDebuff(st,v[fxn[2]]||1,e)); floatP(`${ST[st].i} ${ST[st].n}`,'dmg'); }
    else if(t==='ss'){ const st=fxn[1]; const val=v[fxn[2]]||1; if(st==='str'){ const x=Math.max(1,Math.round(val*Math.max(0.5,sc*0.5))); e.st.str=(e.st.str||0)+x; floatE(e,`💪+${x}`,'se'); } else if(st==='thornsT'){ const x=Math.max(1,Math.round(val*sc)); e.thorns+=x; floatE(e,`🌵+${x}`,'se'); } else if(st==='regen'){ e.regen+=num(fxn[2]); floatE(e,'💚 Regen','heal'); } else if(st==='dodgeNext'){ e.dodgeNext=true; floatE(e,'💨 Evasive','block'); } else if(st==='counterNext'){ e.counterNext=true; floatE(e,'🗡️ Riposte','block'); } else if(st==='critT'){ e.crit=(e.crit||0)+val; } else if(st==='dodgeT'){ e.evade=(e.evade||0)+val; } log(`${e.name} gains ${ST[st]?ST[st].n:st}`,'bad'); }
    else if(t==='block'){ const b=Math.round(num(fxn[1])*(e.el==='earth'?1.5:1)); e.block+=b; log(`${e.name} braces: +${b} Block`); floatE(e,`🛡️${b}`,'block'); sfx('eblock'); }
    else if(t==='armor'){ const a=v[fxn[1]]||1; e.armor+=a; log(`${e.name} hardens: +${a} Armor`,'bad'); }
    else if(t==='heal'){ const h=Math.min(num(fxn[1]),e.maxHp-e.hp); if(h>0){ e.hp+=h; log(`${e.name} heals ${h}`,'bad'); floatE(e,`+${h}`,'heal'); sfx('eheal'); } }
    else if(t==='healPct'){ const h=Math.min(Math.round(e.maxHp*(v[fxn[1]]||10)/100),e.maxHp-e.hp); if(h>0){ e.hp+=h; log(`${e.name} heals ${h}`,'bad'); floatE(e,`+${h}`,'heal'); sfx('eheal'); } }
    else if(t==='selfDmg'){ const x=v[fxn[1]]||1; e.hp-=x; floatE(e,`-${x}`,'dmg'); if(e.hp<=0){ e.hp=0; e.alive=false; G.kills++; log(`${e.name} is consumed by its own power!`,'good'); if(f) f.death(e); } }
    else if(t==='cleanse'){ for(const k of ['poison','burn','chill','shock','wet','weak','vuln','frozen']) delete e.st[k]; log(`${e.name} is cleansed`,'bad'); }
    else if(t==='passive'){ const p=addEnemyPassive(e,fxn[1]); if(p){ log(`${e.name} summons ${p.name}!`,'bad'); floatE(e,`${p.icon} ${p.name}`,'se'); sfx('passive',{kind:p.kind}); } }
    else if(t==='special'){ const sp=fxn[1]; const o=fxn[2]||{};
      if(sp==='sabotage'||sp==='emp'){ const list=sp==='emp'?F.passives.slice():(F.passives.length?[pick(F.passives)]:[]); for(const pp of list){ removePassive(F.passives,pp,'destroyed'); log(`${e.name} destroys your ${pp.name}!`,'bad'); } }
      else if(sp==='pilfer'||sp==='pilferAll'){ for(const pp of (sp==='pilferAll'?F.passives.slice():(F.passives.length?[pick(F.passives)]:[]))){ removePassive(F.passives,pp,'destroyed'); addEnemyPassive(e,pp.pid); log(`${e.name} steals your ${pp.name}!`,'bad'); } }
      else if(sp==='stDmg'){ const stk=F.st[o.s]||0; if(stk){ if(o.consume) delete F.st[o.s]; await strike(Math.round(stk*(v[o.m]||2))); } }
      else if(sp==='doubleSt'){ if(F.st[o.s]) F.st[o.s]*=2; }
      else if(sp==='execute'){ await strike(num('dmg')*(G.p.hp<G.p.maxHp*((o.pct||30)/100)?2:1)); }
      else if(sp==='snipe'){ await strike(num('dmg'),{pierce:true}); }
      else if(sp==='blockDmg'){ if(e.block>0) await strike(Math.round(e.block*(v[o.m]||1))); }
      else if(sp==='retaliation'){ if(e.thorns>0) await strike(Math.round(e.thorns*(v[o.m]||1))); }
      else if(sp==='packBuff'){ const x=Math.max(1,Math.round((v[o.v]||1)*Math.max(0.5,sc*0.5))); e.st.str=(e.st.str||0)+x; floatE(e,`💪+${x}`,'se'); log(`${e.name} gains ${x} Strength`,'bad'); }   // a creature's pack howl is plain Strength for it
    }
    render(); await sleep(120); }
}
// Every enemy-side hit on you goes through here: armed traps, dodge, block, armor, thorns, counters.
async function enemyHitPlayer(e,d,o){
  const F=G.fight; o=o||{}; if(F.st.vuln) d=Math.round(d*1.5);
  const trap=F.passives.find(p=>p.kind==='trap');
  if(trap){ removePassive(F.passives,trap,'sprung'); log(`${trap.name} springs!`,'se'); floatP(`${trap.icon} ${trap.name}!`,'se'); sfx('trap');
    const td=pv_(trap,'tDmg'); if(td) damageEnemyRaw(e,td,trap.el,trap.name);
    const ta=pv_(trap,'tAll'); if(ta) for(const x of F.enemies.filter(z=>z.alive)) damageEnemyRaw(x,ta,trap.el,trap.name);
    if(pv_(trap,'tReflect')&&e.alive) damageEnemyRaw(e,d,'phys','Reflected damage');
    const ts=pv_(trap,'tStatus'); if(ts&&e.alive) applyStatusEnemy(e,ts,pv_(trap,'sv')||1);
    if(pv_(trap,'tFreeze')&&e.alive) applyStatusEnemy(e,'frozen',1);
    render(); await sleep(300);
    if(pv_(trap,'tNegate')){ log(`${o.src||e.name}'s attack is negated`,'good'); return false; }
  }
  if(Math.random()*100<(F.dodgeNext?100:F.dodgeT)){ F.dodgeNext=false; log(`You dodge ${o.src||e.name}'s attack!`,'good'); floatP('Dodge!','miss'); sfx('dodge'); if(o.counter&&e.alive&&(F.counterNext||Math.random()*100<30)) await counterAttack(e); return false; }
  if(F.st.wet&&(e.el==='light'||e.el==='ice')) d=Math.round(d*1.5);   // Wet: lightning and ice bite harder
  if(F.st.shock){ d+=F.st.shock; log(`Shock adds ${F.st.shock} damage`,'bad'); F.st.shock--; if(F.st.shock<=0) delete F.st.shock; }
  let blocked=0; if(F.block>0&&!o.pierce&&!o.indirect){ const usable=o.radiant?Math.ceil(F.block/2):F.block; blocked=Math.min(usable,d); F.block-=blocked; d-=blocked; if(o.radiant&&blocked<d+blocked) log('Radiant: the blow passes part of your Block','bad'); } else if(o.pierce&&F.block>0) log('The blow pierces your Block','bad');
  if(d>0&&!o.indirect){ const ar=PS('armor')+F.armorT; if(e.el==='dragon'&&ar>0) log(`Tyrant: ${e.name}'s blow ignores your Armor`,'bad'); else d=Math.max(0,d-ar); }   // indirect damage (an enemy's summons and machines) ignores Block and Armor, like Poison and Burn do
  G.p.hp-=d;
  if(d>0&&e.el==='psychic'&&F.energy>0){ F.energy--; log(`${e.name} drains 1 Mana`,'bad'); floatP('-1 Mana','dmg'); }   // Mind Drain const f=fx(); if(f&&d>0){ f.playerHit(); if(o.el) f.player(o.el,0); }
  if(d>0){ floatP(`-${d}`,'dmg'); sfx('hurt'); } else { floatP('Blocked','block'); sfx('blocked'); }
  log(`${o.src||e.name} hits you for ${d}${blocked?` (${blocked} blocked)`:''}`,'bad');
  const th=F.thornsT+pSum('thorns'); if(th>0&&e.alive) damageEnemyRaw(e,th,'phys','Thorns');
  if(o.drain&&d>0&&e.alive){ const h=Math.round(d*0.5); e.hp=Math.min(e.maxHp,e.hp+h); log(`${e.name} drains ${h} HP`,'bad'); }
  if(o.counter&&G.p.hp>0&&e.alive&&F.counterNext) await counterAttack(e);
  return true;
}
async function counterAttack(e){
  const F=G.fight; const mult=F.parry?2:1; F.counterNext=false; F.parry=false;
  const r=calcDmg(4+Math.floor(G.round/6),'phys','phys',e,{}); const dealt=damageEnemy(e,r.d*mult,{el:'phys'});
  floatE(e,`Counter ${dealt}`,'se'); log(`Counter attack! ${dealt} damage to ${e.name}`,'good'); sfx('counter'); render(); await sleep(200);
}
function winFight(){
  const F=G.fight; if(!F||F.over) return; F.over=true; clearTimeout(UI.autoTimer); const o=F.o||{};
  const mult=(o.boss?4:o.elite?2:1)*(o.goldMult||1)*(F.enemies.some(x=>x.el==='dragon')?2:1);   // a dragon's hoard
  const gold=Math.round(goldReward()*mult*(0.85+Math.random()*0.3)); const xp=Math.round(xpReward()*(o.boss?4:o.elite?2:1));
  G.p.gold+=gold; G.fights++; if(o.boss) G.bossesSlain++; if(o.final){ G.won=true; G.wonRound=G.round; }
  const kind=o.boss?'boss':(o.elite||o.mimic)?'elite':'fight';
  const levelBefore=G.p.level; sfx('victory'); const ups=gainXp(xp);
  // a slain creature may drop one of its own ability cards: bosses always, elites often, the rest sometimes
  let drop=null; { const dead=F.enemies.filter(x=>!x.alive&&(FOE_MOVES[x.id]||[]).length); if(dead.length){ const x=dead.find(z=>z.boss)||dead.find(z=>z.elite)||pick(dead); const chance=x.boss?1:x.elite?0.6:0.3; if(Math.random()<chance){ const id=pick(FOE_MOVES[x.id]); drop={id,from:x.name}; markSeen(id); } } }
  const picks=(o.boss?1:0)+ups;   // one pick per level gained, plus the boss's own card
  G.spoils={gold,xp,kind,final:!!o.final,levelBefore,picks,bossPick:!!o.boss,cards:picks?offerPool(o.boss?'boss':kind,3):null,cardTaken:picks===0,msgs:o.final?['The Deckfall is dead. The bottom of the world is yours, and the climb goes on: every round from here is high score.']:[],drop,dropTaken:!drop};
  // the kit goes back to the run: exhausted cards return to the discard pile, conjured cards fade, a boss grants a slot
  F.discard.push(...F.exhaust); F.exhaust.length=0; F.hand=F.hand.filter(c=>!c.temp);
  G.p.kit={hand:F.hand,draw:F.draw,discard:F.discard,exhaust:F.exhaust,passives:F.passives,energy:F.energy};
  if(o.boss&&G.p.slots<5){ G.p.slots++; G.spoils.msgs.push(`The lair falls silent. You feel room for one more passive: ${G.p.slots} slots.`); }
  G.phase='spoils'; render(); save(); spoilsMaybeContinue();   // nothing to pick or take? the road continues by itself
}
function spoilsDone(r){ return !!r&&r.cardTaken&&(!r.drop||r.dropTaken); }
function spoilsMaybeContinue(){ const r=G.spoils; if(spoilsDone(r)){ clearTimeout(UI.timer); UI.timer=setTimeout(spoilsContinue,1000); } }
function spoilsTakeDrop(){ const r=G.spoils; if(!r||!r.drop||r.dropTaken) return; const id=r.drop.id; sfx(G.p.deck.includes(id)&&canEvolve(id)?'evolve':'pick'); const res=addCard(id); r.msgs=r.msgs||[]; r.msgs.push(res==='evolved'?`${CARD[id].name} evolves to ${TIERS[curTier(id)]}`:res==='packed'?`${CARD[id].name}, taken from ${r.drop.from}, goes into your pack: the deck is full`:`${CARD[id].name}, taken from ${r.drop.from}, joins your deck`); r.dropTaken=true; render(); save(); spoilsMaybeContinue(); }
function spoilsSkipDrop(){ const r=G.spoils; if(!r||!r.drop||r.dropTaken) return; r.dropTaken=true; r.msgs=r.msgs||[]; r.msgs.push(`You leave ${CARD[r.drop.id].name} behind.`); render(); save(); spoilsMaybeContinue(); }
function spoilsPickCard(id){ const r=G.spoils; if(!r||r.cardTaken||!r.cards||!r.cards.includes(id)) return; sfx(G.p.deck.includes(id)&&canEvolve(id)?'evolve':'pick'); const res=addCard(id); r.msgs=r.msgs||[]; r.msgs.push(res==='evolved'?`${CARD[id].name} evolves to ${TIERS[curTier(id)]}`:res==='copied'?`Another ${CARD[id].name} joins your deck`:res==='packed'?`${CARD[id].name} goes into your pack: the deck is full. Swap it in at a town`:`${CARD[id].name} joins your deck`); r.picks=(r.picks||1)-1; r.bossPick=false; if(r.picks>0) r.cards=offerPool(r.kind==='boss'?'elite':r.kind,3); else { r.cards=null; r.cardTaken=true; } render(); save(); spoilsMaybeContinue(); }
function spoilsSkipCard(){ const r=G.spoils; if(!r||r.cardTaken) return; r.picks=0; r.cards=null; r.bossPick=false; r.cardTaken=true; r.msgs=r.msgs||[]; r.msgs.push('You take no card.'); render(); save(); spoilsMaybeContinue(); }
