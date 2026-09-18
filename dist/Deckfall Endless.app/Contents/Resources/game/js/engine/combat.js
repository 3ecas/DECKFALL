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
function mkEnemy(def,o){
  const s=G.round; const hm=hpMult(s)*(o.scale||1)*(o.elite?1.6:1); const am=atkMult(s)*(o.elite?1.25:1);
  const hp=Math.round(def.hp*hm), atk=Math.round(def.atk*am);
  const e={uid:UI.uid++, id:def.id, name:(o.elite?'Elite ':'')+def.name, icon:def.icon, el:def.el, hp, maxHp:hp, atk, block:0, armor:Math.floor(s/10)+(o.boss?1:0), thorns:def.thorns?Math.round(def.thorns*am*0.6):0, st:{}, pat:def.pat, pi:o.boss?0:rnd(0,def.pat.length-1), elite:!!o.elite, boss:!!o.boss, ls:!!def.ls, atkScale:am, alive:true, passives:[]};
  for(const pid of (def.passives||[])) addEnemyPassive(e,pid);
  return e;
}
function pickEnemies(o){
  const s=G.round;
  if(o.boss){ const b=BOSSES[(Math.round(s/10)-1)%BOSSES.length]; return [mkEnemy(b,{boss:true})]; }
  if(o.mimic) return [mkEnemy(ENEMY.mimic,{elite:true})];
  let pool=ENEMIES.filter(x=>!x.special&&x.min<=s&&x.min>=s-14); if(pool.length<4) pool=ENEMIES.filter(x=>!x.special&&x.min<=s);
  let count=1; const r=Math.random();
  if(!o.elite){ if(s>=12&&r<0.14) count=3; else if(s>=3&&r<0.34) count=2; }
  const list=[]; for(let i=0;i<count;i++) list.push(mkEnemy(pick(pool),{elite:o.elite,scale:count===1?1:count===2?0.66:0.52}));
  return list;
}
function startFight(o){
  clearTimeout(UI.timer); clearTimeout(UI.autoTimer);
  const enemies=pickEnemies(o);
  const drawPile=shuffle(G.p.deck.map(id=>({uid:UI.uid++,id})));
  G.fight={key:UI.fightKey++, enemies, turn:0, energy:0, energyBonus:0, hand:[], draw:drawPile, discard:[], exhaust:[], passives:[], block:0, st:{}, str:0, spellT:0, thornsT:0, critT:0, armorT:0, regen:0, dodgeT:0, elBoost:{}, dodgeNext:false, counterNext:false, parry:false, retain:false, target:0, played:0, turnAttacks:0, o, over:false};
  G.log=[]; log(o.boss?`BOSS: ${enemies[0].name} blocks the way!`:o.elite?`An elite ${enemies[0].name} appears!`:`${enemies.map(e=>e.name).join(' and ')} appear${enemies.length>1?'':'s'}!`, o.boss?'bad':'');
  G.phase='battle'; G.spoils=null; G.inter=null; G.shop=null; UI.handUids=[]; save();
  const f=fx(); if(f) setTimeout(()=>f.banner(o.boss?`Boss: ${enemies[0].name}`:o.elite?`Elite: ${enemies[0].name}`:`Round ${G.round}`, o.boss?'boss':o.elite?'elite':''),50); sfx(o.boss?'boss':o.elite?'elite':'battle');
  startPlayerTurn();
}
function startPlayerTurn(){
  const F=G.fight; if(F.over) return; F.turn++; G.turnsTotal++;
  F.energy=PS('energyMax')+F.energyBonus+pSum('manaPerTurn')+pSum('sMana'); if(F.st.chill){ F.energy=Math.max(1,F.energy-1); delete F.st.chill; log('Chilled: 1 less Mana this turn','bad'); }
  F.played=0; F.turnAttacks=0; if(!F.retain) F.block=0; F.retain=false; F.dodgeNext=false; F.counterNext=false; F.parry=false;
  const rg=PS('regen')+F.regen+pSum('healPerTurn')+pSum('sHeal'); if(rg>0){ const h=heal(rg); if(h) log(`Regen and allies heal ${h}`,'good'); }
  if(F.st.poison){ dmgPlayerRaw(F.st.poison,'Poison'); F.st.poison--; if(F.st.poison<=0) delete F.st.poison; }
  if(F.st.burn&&G.p.hp>0){ dmgPlayerRaw(F.st.burn,'Burn'); F.st.burn=Math.floor(F.st.burn/2); if(F.st.burn<=0) delete F.st.burn; }
  if(checkDeath()) return;
  const before=F.hand.length; draw(PS('handSize')+pSum('drawPerTurn')); sfx('draw',{n:F.hand.length-before});
  render(); autoEndCheck();
}
function draw(n){ const F=G.fight; for(let i=0;i<n;i++){ if(F.hand.length>=10) break; if(!F.draw.length){ if(!F.discard.length) break; F.draw=shuffle(F.discard); F.discard=[]; } F.hand.push(F.draw.pop()); } }
function addBlock(n){ const F=G.fight; F.block+=n; floatP(`🛡️ +${n}`,'block'); log(`You gain ${n} Block`); sfx('block'); }
function needsTarget(d){ return d.fx.some(f=>(f[0]==='dmg'&&!(f[2]&&f[2].aoe))||(f[0]==='se'&&!(f[3]&&f[3].aoe))||(f[0]==='special'&&['execute','snipe','retaliation','stDmg','doubleSt','spread','blockDmg','playedDmg','sabotage','pilfer','mimic'].includes(f[1])&&!(f[2]&&f[2].aoe))); }
function canPlay(inst){ const F=G.fight; const d=CARD[inst.id]; return !d.unplayable&&F.energy>=cardCost(inst.id); }
function autoEndCheck(){
  clearTimeout(UI.autoTimer); const F=G.fight; if(!F||F.over||UI.busy) return;
  if(F.hand.some(canPlay)||G.p.ultCharge>=100) return;
  UI.autoTimer=setTimeout(()=>{ const F2=G.fight; if(!F2||F2.over||UI.busy||G.phase!=='battle') return; if(F2.hand.some(canPlay)||G.p.ultCharge>=100) return; toast(F2.hand.length?'Nothing left to play. Ending turn.':'Hand empty. Ending turn.'); endTurn(); },900);
}
async function playCard(idx){
  const F=G.fight; if(!F||F.over||UI.busy) return; const inst=F.hand[idx]; if(!inst) return; const d=CARD[inst.id]; const cost=cardCost(inst.id);
  if(d.unplayable){ toast('Curses cannot be played. Remove them at a merchant.'); return; }
  if(F.energy<cost){ toast('Not enough Mana'); return; }
  clearTimeout(UI.autoTimer);
  let target=null;
  if(needsTarget(d)){ target=F.enemies[F.target]; if(!target||!target.alive){ target=F.enemies.find(e=>e.alive); F.target=F.enemies.indexOf(target); } }
  UI.busy=true; sfx('play',{type:d.type,el:d.el}); const f=fx(); if(f){ f.playCard(idx,target); await sleep(200); }
  F.energy-=cost; F.hand.splice(idx,1); F.played++; if(d.type==='attack') F.turnAttacks++; gainUlt(8);
  log(`You play ${d.name}${curTier(inst.id)>tierIdx(inst.id)?' ('+TIERS[curTier(inst.id)]+')':''}`);
  try{ await runEffects(d,cardVals(inst.id),target,inst); }catch(err){ console.error(err); }
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
  for(const f of d.fx){
    const t=f[0];
    if(t==='dmg'){ const o=f[2]||{}; const hits=o.hits?(typeof o.hits==='string'?v[o.hits]:o.hits):1;
      for(let h=0;h<hits;h++){ const ts=o.aoe?alive():[target].filter(e=>e&&e.alive); if(!ts.length) break; for(const e of ts) hitEnemy(e,v[f[1]],{kind,el:d.el,pierce:o.pierce,ls:o.ls,bv:o.bv,bvm:o.bvm,src,isAttack:d.type==='attack',isSpell:d.type==='spell'}); if(hits>1){ render(); await sleep(150); } } }
    else if(t==='block') addBlock(v[f[1]]);
    else if(t==='armor'){ F.armorT+=v[f[1]]; log(`+${v[f[1]]} Armor for this fight`,'good'); }
    else if(t==='se'){ const o=f[3]||{}; const val=f[2]?v[f[2]]:1; const ts=o.aoe?alive():[target].filter(e=>e&&e.alive); for(const e of ts) applyStatusEnemy(e,f[1],val); }
    else if(t==='ss') applySelf(f[1],f[2]?v[f[2]]:1);
    else if(t==='heal'){ const h=heal(v[f[1]]); floatP(`+${h}`,'heal'); log(`${src} heals ${h}`,'good'); sfx('heal'); }
    else if(t==='healPct'){ const h=heal(Math.round(G.p.maxHp*v[f[1]]/100)); floatP(`+${h}`,'heal'); log(`${src} heals ${h}`,'good'); sfx('heal'); }
    else if(t==='draw') draw(v[f[1]]);
    else if(t==='energy'){ F.energy+=v[f[1]]; log(`+${v[f[1]]} Mana`,'good'); floatP(`+${v[f[1]]} Mana`,'mana'); sfx('mana'); }
    else if(t==='maxEnergy'){ F.energyBonus+=v[f[1]]; F.energy+=v[f[1]]; log(`+${v[f[1]]} Mana every turn this fight`,'good'); }
    else if(t==='ult'){ gainUlt(v[f[1]]); log(`+${v[f[1]]} Ultimate charge`,'good'); }
    else if(t==='selfDmg') dmgPlayerRaw(v[f[1]],src);
    else if(t==='cleanse'){ for(const k of ['burn','poison','weak','vuln','chill','shock']) delete F.st[k]; log('Your debuffs are removed','good'); }
    else if(t==='stat'){ G.p[f[1]]+=v[f[2]]; if(f[1]==='maxHp') G.p.hp+=v[f[2]]; log(`Permanently +${v[f[2]]} ${STATNAMES[f[1]]}!`,'good'); }
    else if(t==='passive') playPassive(inst,f[1]);
    else if(t==='special') await special(f[1],f[2]||{},d,v,target,kind);
  }
  render();
}
async function special(name,p,d,v,target,kind){
  const F=G.fight; const alive=()=>F.enemies.filter(e=>e.alive); const m=p.m?v[p.m]:1; const o=(x)=>Object.assign({kind,el:d.el,src:d.name,isAttack:d.type==='attack',isSpell:d.type==='spell'},x||{});
  if(name==='execute'){ if(!target||!target.alive) return; const low=target.hp/target.maxHp<(p.pct||30)/100; hitEnemy(target,v.dmg*(low?2:1),o()); if(low) log('Execute! Double damage','se'); }
  else if(name==='snipe'){ if(target&&target.alive) hitEnemy(target,v.dmg,o({pierce:1,critBonus:50})); }
  else if(name==='retaliation'){ if(target&&target.alive) hitEnemy(target,(PS('thorns')+F.thornsT+pSum('thorns'))*m,o({el:'phys'})); }
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
  else if(name==='mimic'){ const e=target&&target.alive?target:alive()[0]; if(!e) return; let el=e.el; if(el==='beast'||el==='phys') el=pick(['fire','water','ice','light','grass','poison','earth','shadow','holy']); const id=randomCardId('fight',[],x=>x.el===el&&x.type!=='curse'); F.hand.push({uid:UI.uid++,id,temp:true}); log(`You conjure ${CARD[id].name} from ${e.name}'s essence`,'se'); }
}
function calcDmg(base,kind,el,e,o){
  o=o||{}; const F=G.fight;
  let d=base+(o.noStat?0:(kind==='phys'?PS('attack')+F.str+pSum('atkBonus'):PS('spell')+F.spellT+pSum('spellBonus')));
  if(F.st.weak) d*=0.75;
  d*=1+(elBoostPct(el)+(F.elBoost[el]||0))/100;
  if(o.isAttack&&F.turnAttacks===1&&hasP('firstAttackMult')) d*=2;
  if(hasP('fullMechaMult')&&mechaCount(F.passives)>=3) d*=1+pSum('fullMechaMult')/100;
  let mult=typeMult(el,e.el); const se=mult>1, res=mult<1;
  if(e.st.wet){ if(el==='light'||el==='ice') mult*=1.5; if(el==='fire') mult*=0.5; }
  if(e.st.vuln) mult*=1.5;
  if(o.bv&&e.st[o.bv]) mult*=(o.bvm||2);
  d*=mult;
  const crit=Math.random()*100<(PS('crit')+F.critT+(o.critBonus||0)); if(crit) d*=1.5;
  return {d:Math.max(0,Math.round(d)),se,res,crit,combo:!!(o.bv&&e.st[o.bv])};
}
function hitEnemy(e,base,o){
  if(!e||!e.alive) return 0;
  const F=G.fight; const r=calcDmg(base,o.kind,o.el,e,o);
  const dealt=damageEnemy(e,r.d,{pierce:o.pierce,el:o.el}); sfx('hit',{el:o.el,se:r.se,crit:r.crit});
  const ls=(o.ls||0)+PS('lifesteal')+(o.isAttack?pSum('lifesteal'):0); if(ls>0&&dealt>0){ const h=heal(Math.max(1,Math.round(dealt*ls/100))); if(h>0) floatP(`+${h}`,'heal'); }
  if(o.kind==='phys'&&!o.summon&&e.thorns>0&&e.alive){ G.p.hp-=e.thorns; floatP(`-${e.thorns} thorns`,'dmg'); log(`${e.name}'s thorns deal ${e.thorns} to you`,'bad'); }
  if(e.alive){ for(const p of F.passives){ const s=o.isAttack?pv_(p,'attackStatus'):o.isSpell?pv_(p,'spellStatus'):null; if(s) applyStatusEnemy(e,s,pv_(p,'sv')||1); } }
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
  gainUlt(2); const f=fx(); if(f) f.hit(e,o.el||'phys');
  if(e.hp<=0){ e.hp=0; e.alive=false; G.kills++; gainUlt(15); log(`${e.name} is slain!`,'good'); if(f) f.death(e); sfx('death'); }
  return dmg;
}
function damageEnemyRaw(e,amount,el,src){ if(!e.alive) return; const d=Math.max(0,Math.round(amount)); e.hp-=d; floatE(e,`${d}`,'dmg'); log(`${src} deals ${d} to ${e.name}`); const f=fx(); if(f) f.hit(e,el); sfx('tick',{el}); if(e.hp<=0){ e.hp=0; e.alive=false; G.kills++; gainUlt(15); log(`${e.name} is slain!`,'good'); if(f) f.death(e); sfx('death'); } }
function applyStatusEnemy(e,s,val){
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
  const it=e.pat[e.pi%e.pat.length]; const F=G.fight;
  if(e.st.frozen) return {i:'🧊',t:'Frozen: skips turn'};
  if(it.t==='atk'){ let d=(e.atk+(e.st.str||0)+enemyAtkBonus(e))*it.m; if(e.st.weak) d*=0.75; if(F&&F.st.vuln) d*=1.5; d=Math.round(d); return {i:'⚔️',t:`Attack <b>${d}</b>${it.hits>1?` ×${it.hits}`:''}${it.s?` + ${ST[it.s].i}${ST[it.s].n}`:''}`}; }
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
  const half=Math.floor(PS('attack')/2);
  for(const p of F.passives.slice()){
    if(!alive().length) break;
    const o=(x)=>Object.assign({kind:'phys',el:p.el==='beast'?'phys':p.el,src:p.name,noStat:true,summon:true},x||{});
    const sa=pv_(p,'sAttack'); if(sa){ const hits=pv_(p,'hits')||1; for(let h=0;h<hits;h++){ const e=pv_(p,'sRandom')?pick(alive()):tgt(); if(!e) break; hitEnemy(e,sa+half,o({pierce:pv_(p,'sPierce')})); } }
    const sall=pv_(p,'sAll'); if(sall) for(const e of alive()) hitEnemy(e,sall+half,o());
    const ss=pv_(p,'sStatus'); if(ss){ const e=tgt(); if(e) applyStatusEnemy(e,ss,pv_(p,'sv')||1); }
    const sb=pv_(p,'sBlock'); if(sb) addBlock(sb);
    const sth=pv_(p,'sThorns'); if(sth){ F.thornsT+=sth; log(`${p.name} grows ${sth} Thorns`,'good'); }
    const eb=pv_(p,'endBlockPerMecha'); if(eb) addBlock(eb*mechaCount(F.passives));
    const ea=pv_(p,'endDmgPerAttack'); if(ea&&F.turnAttacks){ const e=tgt(); if(e) hitEnemy(e,ea*F.turnAttacks+half,o()); }
    const er=pv_(p,'endDmgRandom'); if(er){ const e=pick(alive()); if(e) hitEnemy(e,er+half,o()); }
    const eall=pv_(p,'endDmgAll'); if(eall) for(const e of alive()) hitEnemy(e,eall+half,o());
    render(); await sleep(160);
  }
}
async function endTurn(){
  const F=G.fight; if(!F||F.over||UI.busy) return; UI.busy=true; clearTimeout(UI.autoTimer);
  for(const inst of F.hand){ const d=CARD[inst.id]; if(d.endTurnDmg) dmgPlayerRaw(d.endTurnDmg,d.name); }
  F.discard.push(...F.hand.filter(c=>!c.temp)); F.hand=[];
  for(const k of ['weak','vuln']) if(F.st[k]){ F.st[k]--; if(F.st[k]<=0) delete F.st[k]; }
  if(checkDeath()){ UI.busy=false; return; }
  render();
  if(F.passives.length){ await passivesEndTurn(); if(F.enemies.every(e=>!e.alive)){ UI.busy=false; await sleep(400); winFight(); return; } }
  const f=fx(); if(f) f.banner('Enemy turn','dim'); sfx('enemyturn'); await sleep(500);
  for(const e of F.enemies){ if(!e.alive) continue; await enemyAct(e); if(G.p.hp<=0){ checkDeath(); UI.busy=false; return; } render(); await sleep(420); }
  for(const e of F.enemies){ if(!e.alive) continue; for(const k of ['weak','vuln','wet']) if(e.st[k]){ e.st[k]--; if(e.st[k]<=0) delete e.st[k]; } e.block=0; }
  UI.busy=false;
  if(F.enemies.every(e=>!e.alive)){ winFight(); return; }
  startPlayerTurn();
}
async function enemyPassives(e){
  const F=G.fight;
  for(const p of e.passives.slice()){
    if(!e.alive||G.p.hp<=0) return;
    const sa=pv_(p,'sAttack')||pv_(p,'sAll'); if(sa){ const hits=pv_(p,'hits')||1; for(let h=0;h<hits;h++){ await enemyHitPlayer(e,sa,{src:p.name,icon:p.icon}); if(G.p.hp<=0) return; } }
    const ss=pv_(p,'sStatus'); if(ss){ applyStatusPlayer(ss,pv_(p,'sv')||1); floatP(`${ST[ss].i} ${ST[ss].n}`,'dmg'); }
    const sb=pv_(p,'sBlock')||(pv_(p,'endBlockPerMecha')?pv_(p,'endBlockPerMecha')*mechaCount(e.passives):0); if(sb){ e.block+=sb; log(`${p.name} shields ${e.name}: +${sb} Block`); floatE(e,`🛡️${sb}`,'block'); }
    const sh=pv_(p,'sHeal')||pv_(p,'healPerTurn'); if(sh){ e.hp=Math.min(e.maxHp,e.hp+sh); log(`${p.name} heals ${e.name} ${sh}`,'bad'); floatE(e,`+${sh}`,'heal'); }
    const ed=pv_(p,'endDmgRandom')||pv_(p,'endDmgAll'); if(ed){ await enemyHitPlayer(e,ed,{src:p.name,icon:p.icon}); if(G.p.hp<=0) return; }
    render(); await sleep(180);
  }
}
async function enemyAct(e){
  if(e.st.poison){ const x=e.st.poison; damageEnemyRaw(e,Math.round(x*typeMult('poison',e.el)),'poison','Poison'); e.st.poison--; if(e.st.poison<=0) delete e.st.poison; if(!e.alive) return; }
  if(e.st.burn){ const x=e.st.burn; damageEnemyRaw(e,Math.round(x*typeMult('fire',e.el)),'fire','Burn'); e.st.burn=Math.floor(x/2); if(e.st.burn<=0) delete e.st.burn; if(!e.alive) return; }
  if(e.st.frozen){ delete e.st.frozen; log(`${e.name} is frozen and skips its turn`,'good'); floatE(e,'Frozen','block'); render(); await sleep(300); return; }
  if(e.passives.length){ await enemyPassives(e); if(G.p.hp<=0||!e.alive) return; }
  const it=e.pat[e.pi%e.pat.length]; e.pi++; const f=fx(); const F=G.fight;
  if(it.t==='atk'){ let landed=false; for(let h=0;h<it.hits;h++){ if(f){ f.lunge(e); await sleep(160); } let d=(e.atk+(e.st.str||0)+enemyAtkBonus(e))*it.m; if(e.st.weak) d*=0.75; if(await enemyHitPlayer(e,Math.round(d),{src:e.name,counter:true,drain:e.ls})) landed=true; if(G.p.hp<=0||!e.alive) return; if(it.hits>1){ render(); await sleep(220); } } if(it.s&&landed) applyStatusPlayer(it.s,scaledDebuff(it.s,it.v,e)); }
  else if(it.t==='def'){ const b=Math.round(it.v*e.atkScale); e.block+=b; log(`${e.name} braces: +${b} Block`); floatE(e,`🛡️${b}`,'block'); sfx('eblock'); }
  else if(it.t==='buff'){ const v=Math.max(1,Math.round(it.v*e.atkScale*0.5)); e.st.str=(e.st.str||0)+v; log(`${e.name} gains ${v} Strength`,'bad'); floatE(e,`💪+${v}`,'se'); sfx('ebuff'); }
  else if(it.t==='debuff'){ applyStatusPlayer(it.s,scaledDebuff(it.s,it.v,e)); floatP(`${ST[it.s].i} ${ST[it.s].n}`,'dmg'); sfx('debuff'); }
  else if(it.t==='heal'){ const h=Math.round(e.maxHp*it.p); e.hp=Math.min(e.maxHp,e.hp+h); log(`${e.name} heals ${h}`,'bad'); floatE(e,`+${h}`,'heal'); sfx('eheal'); }
  else if(it.t==='dispel'){ if(F.passives.length){ const p=pick(F.passives); removePassive(F.passives,p,'destroyed'); log(`${e.name} destroys your ${p.name}!`,'bad'); floatP(`${p.icon} destroyed`,'dmg'); sfx('break'); } else log(`${e.name} finds nothing to dispel`); }
  else if(it.t==='summon'){ const p=addEnemyPassive(e,it.id); if(p){ log(`${e.name} summons ${p.name}!`,'bad'); floatE(e,`${p.icon} ${p.name}`,'se'); sfx('passive',{kind:'summon'}); } else log(`${e.name} tries to summon, but its ranks are full`); }
}
// Every enemy-side hit on you goes through here: armed traps, dodge, block, armor, thorns, counters.
async function enemyHitPlayer(e,d,o){
  const F=G.fight; o=o||{}; if(F.st.vuln) d=Math.round(d*1.5);
  const trap=F.passives.find(p=>p.kind==='trap');
  if(trap){ removePassive(F.passives,trap,'sprung'); log(`${trap.name} springs!`,'se'); floatP(`${trap.icon} ${trap.name}!`,'se'); sfx('trap');
    const td=pv_(trap,'tDmg'); if(td) damageEnemyRaw(e,td+Math.floor(PS('attack')/2),trap.el,trap.name);
    const ta=pv_(trap,'tAll'); if(ta) for(const x of F.enemies.filter(z=>z.alive)) damageEnemyRaw(x,ta+Math.floor(PS('attack')/2),trap.el,trap.name);
    if(pv_(trap,'tReflect')&&e.alive) damageEnemyRaw(e,d,'phys','Reflected damage');
    const ts=pv_(trap,'tStatus'); if(ts&&e.alive) applyStatusEnemy(e,ts,pv_(trap,'sv')||1);
    if(pv_(trap,'tFreeze')&&e.alive) applyStatusEnemy(e,'frozen',1);
    render(); await sleep(300);
    if(pv_(trap,'tNegate')){ log(`${o.src||e.name}'s attack is negated`,'good'); return false; }
  }
  if(Math.random()*100<(F.dodgeNext?100:PS('dodge')+F.dodgeT)){ F.dodgeNext=false; log(`You dodge ${o.src||e.name}'s attack!`,'good'); floatP('Dodge!','miss'); gainUlt(5); sfx('dodge'); if(o.counter&&e.alive&&(F.counterNext||Math.random()*100<PS('counter')+30)) await counterAttack(e); return false; }
  let blocked=0; if(F.block>0){ blocked=Math.min(F.block,d); F.block-=blocked; d-=blocked; }
  if(d>0) d=Math.max(0,d-(PS('armor')+F.armorT));
  G.p.hp-=d; gainUlt(8); const f=fx(); if(f&&d>0) f.playerHit();
  if(d>0){ floatP(`-${d}`,'dmg'); sfx('hurt'); } else { floatP('Blocked','block'); sfx('blocked'); }
  log(`${o.src||e.name} hits you for ${d}${blocked?` (${blocked} blocked)`:''}`,'bad');
  const th=PS('thorns')+F.thornsT+pSum('thorns'); if(th>0&&e.alive) damageEnemyRaw(e,th,'phys','Thorns');
  if(o.drain&&d>0&&e.alive){ const h=Math.round(d*0.5); e.hp=Math.min(e.maxHp,e.hp+h); log(`${e.name} drains ${h} HP`,'bad'); }
  if(o.counter&&G.p.hp>0&&e.alive&&(F.counterNext||Math.random()*100<PS('counter'))) await counterAttack(e);
  return true;
}
async function counterAttack(e){
  const F=G.fight; const mult=F.parry?2:1; F.counterNext=false; F.parry=false;
  const r=calcDmg(4+Math.floor(G.round/6),'phys','phys',e,{}); const dealt=damageEnemy(e,r.d*mult,{el:'phys'});
  floatE(e,`Counter ${dealt}`,'se'); log(`Counter attack! ${dealt} damage to ${e.name}`,'good'); sfx('counter'); render(); await sleep(200);
}
async function useUltimate(){
  const F=G.fight; if(!F||F.over||UI.busy||G.p.ultCharge<100) return; UI.busy=true; G.p.ultCharge=0; clearTimeout(UI.autoTimer);
  const u=ULT[G.p.ult]; const pw=PS('ultPower')/100; log(`ULTIMATE: ${u.name}!`,'se'); sfx('ultimate'); const f=fx(); if(f){ f.flash('ult'); f.banner(`${u.icon} ${u.name}`,'ult'); await sleep(1100); }
  const alive=()=>F.enemies.filter(e=>e.alive); const tgt=()=>(F.enemies[F.target]&&F.enemies[F.target].alive)?F.enemies[F.target]:alive()[0];
  const o=(kind,el,ls)=>({kind,el,ls,src:u.name});
  switch(u.id){
    case 'bladestorm': for(let i=0;i<5;i++){ const a=alive(); if(!a.length) break; hitEnemy(pick(a),Math.round(8*pw),o('phys','phys')); render(); await sleep(130); } break;
    case 'dragonbreath': for(const e of alive()){ hitEnemy(e,Math.round(30*pw),o('spell','fire')); if(e.alive) applyStatusEnemy(e,'burn',Math.round(6*pw)); } break;
    case 'timestop': for(const e of alive()) applyStatusEnemy(e,'frozen',1); F.energy+=2; draw(3); break;
    case 'divine': { const h=heal(Math.round(G.p.maxHp*0.4*pw)); floatP(`+${h}`,'heal'); for(const k of ['burn','poison','weak','vuln','chill','shock']) delete F.st[k]; addBlock(Math.round(20*pw)); } break;
    case 'thundergod': for(let h=0;h<3;h++){ for(const e of alive()) hitEnemy(e,Math.round(14*pw),o('spell','light')); render(); await sleep(130); } for(const e of alive()) applyStatusEnemy(e,'shock',Math.round(5*pw)); break;
    case 'plaguelord': for(const e of alive()){ applyStatusEnemy(e,'poison',Math.round(15*pw)); applyStatusEnemy(e,'vuln',3); } break;
    case 'avalanche': for(const e of alive()){ hitEnemy(e,Math.round(34*pw),o('spell','ice')); if(e.alive) applyStatusEnemy(e,'frozen',1); } break;
    case 'soulreaper': { const e=tgt(); if(e) hitEnemy(e,Math.round(45*pw),o('phys','shadow',100)); } break;
    case 'tidal': for(const e of alive()){ hitEnemy(e,Math.round(26*pw),o('spell','water')); if(e.alive) applyStatusEnemy(e,'wet',3); } { const h=heal(Math.round(15*pw)); floatP(`+${h}`,'heal'); } break;
    case 'earthfury': for(const e of alive()){ hitEnemy(e,Math.round(40*pw),o('phys','earth')); if(e.alive) applyStatusEnemy(e,'weak',2); } break;
    case 'gaia': for(const e of alive()) hitEnemy(e,Math.round(30*pw),o('spell','grass')); applySelf('regen',Math.round(5*pw)); applySelf('thornsT',Math.round(4*pw)); applySelf('str',Math.round(3*pw)); break;
  }
  UI.busy=false; await afterAction();
}
function winFight(){
  const F=G.fight; if(!F||F.over) return; F.over=true; clearTimeout(UI.autoTimer); const o=F.o||{};
  const mult=(o.boss?4:o.elite?2:1)*(o.goldMult||1);
  const gold=Math.round(goldReward()*mult*(0.85+Math.random()*0.3)); const xp=Math.round(xpReward()*(o.boss?4:o.elite?2:1));
  G.p.gold+=gold; G.fights++; if(o.boss) G.bossesSlain++;
  const kind=o.boss?'boss':(o.elite||o.mimic)?'elite':'fight';
  let ultOffer=null; if(o.boss){ const notOwned=ULTS.filter(u=>!G.p.ults.includes(u.id)); if(notOwned.length) ultOffer=shuffle(notOwned.slice()).slice(0,2).map(u=>u.id); }
  G.spoils={gold,xp,cards:offerPool(kind,3),kind,ultOffer,cardTaken:false,ultTaken:false,levelBefore:G.p.level};
  sfx('victory'); gainXp(xp);
  G.phase='spoils'; render(); save();
}
function spoilsMaybeContinue(){ const r=G.spoils; if(r.cardTaken&&(!r.ultOffer||r.ultTaken)){ clearTimeout(UI.timer); UI.timer=setTimeout(spoilsContinue,1000); } }
function spoilsPickCard(id){ const r=G.spoils; if(!r||r.cardTaken) return; sfx(G.p.deck.includes(id)&&canEvolve(id)?'evolve':'pick'); const res=addCard(id); r.cardTaken=true; r.cardMsg=res==='evolved'?`${CARD[id].name} evolves to ${TIERS[curTier(id)]}`:res==='copied'?`Another ${CARD[id].name} joins your deck`:`${CARD[id].name} joins your deck`; render(); save(); spoilsMaybeContinue(); }
function spoilsSkipCard(){ const r=G.spoils; if(!r||r.cardTaken) return; r.cardTaken=true; r.cardMsg='You take no card.'; render(); save(); spoilsMaybeContinue(); }
function spoilsPickUlt(id){ const r=G.spoils; if(!r||r.ultTaken) return; r.ultTaken=true; if(id){ G.p.ults.push(id); G.p.ult=id; r.ultMsg=`${ULT[id].name} is now your Ultimate.`; } else r.ultMsg=`You keep ${ULT[G.p.ult].name}.`; render(); save(); spoilsMaybeContinue(); }
