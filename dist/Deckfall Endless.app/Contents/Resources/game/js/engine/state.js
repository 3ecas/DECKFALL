'use strict';
// ===================== RUN STATE, ROUND FLOW, PROGRESSION, SAVE =====================
let G = null;                       // the whole run (serialisable)
const UI = {busy:false, modal:null, uid:1, handUids:[], fightKey:0, timer:null, screen:null, lib:{els:[],types:[],tiers:[],costs:[],q:'',undisc:false,sort:'tier'}};
const SAVE_KEY='deckfall2_save', BEST_KEY='deckfall2_best';
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function weightedPick(w){let t=0;for(const k in w)t+=Math.max(0,w[k]);let r=Math.random()*t;for(const k in w){r-=Math.max(0,w[k]);if(r<=0)return k;}return Object.keys(w)[0];}
const store={
  get(k){try{if(window.__NATIVE_STORE__&&k in window.__NATIVE_STORE__)return window.__NATIVE_STORE__[k];}catch(e){}try{return localStorage.getItem(k);}catch(e){return null;}},
  set(k,v){try{localStorage.setItem(k,v);}catch(e){}try{if(window.__NATIVE_STORE__)window.__NATIVE_STORE__[k]=v;if(window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.store)window.webkit.messageHandlers.store.postMessage({key:k,value:v});}catch(e){}},
  del(k){try{localStorage.removeItem(k);}catch(e){}try{if(window.__NATIVE_STORE__)delete window.__NATIVE_STORE__[k];if(window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.store)window.webkit.messageHandlers.store.postMessage({key:k,value:null});}catch(e){}},
};
function save(){ if(!G) return; store.set(SAVE_KEY, JSON.stringify(G)); }
function loadSave(){ try{ const s=store.get(SAVE_KEY); return s?JSON.parse(s):null; }catch(e){ return null; } }
function clearSave(){ store.del(SAVE_KEY); }
// ---- card discovery: every card that joined a deck or was offered on a run, kept across runs for the Card Library ----
const SEEN_KEY='deckfall_seen'; let SEEN=null;
function seenCards(){ if(!SEEN){ try{ const s=store.get(SEEN_KEY); SEEN=new Set(s?JSON.parse(s):[]); }catch(e){ SEEN=new Set(); } } return SEEN; }
function markSeen(ids){ const S=seenCards(); let changed=false; for(const id of [].concat(ids)){ if(CARD[id]&&!S.has(id)){ S.add(id); changed=true; } } if(changed) store.set(SEEN_KEY,JSON.stringify([...S])); }
function getBest(){ try{ const s=store.get(BEST_KEY); return s?JSON.parse(s):null; }catch(e){ return null; } }
function recordBest(){ const b=getBest()||{round:0,kills:0,level:1,bosses:0,runs:0}; b.runs=(b.runs||0)+1; if(G.round>b.round){ b.round=G.round; b.kills=G.kills; b.level=G.p.level; b.bosses=G.bossesSlain; } store.set(BEST_KEY, JSON.stringify(b)); return b; }

// ---- stats with temporary boosts ----
function PS(k){ let v=G.p[k]||0; for(const b of G.boosts) if(b.stat===k) v+=b.v; return v; }
function elBoostPct(el){ let v=0; for(const b of G.boosts) if(b.el===el) v+=b.v; return v; }

// ---- new run: always basic cards, with random element seeds so every run opens differently ----
function startingDeck(){
  // Five basic cards: three attacks (two Strikes plus a random basic attack), one random basic spell, one Mana Potion.
  const basic=t=>CARDS.filter(x=>x.tier==='basic'&&x.type===t&&!x.drop);
  const atk=pick(basic('attack').filter(x=>x.id!=='strike'));
  const spell=pick(basic('spell').filter(x=>x.fx.some(f=>f[0]==='dmg'||f[0]==='se')));
  return ['strike','strike',atk.id,spell.id,'mana_potion'];
}
function newGame(){
  G={ phase:'battle', round:1, kills:0, fights:0, bossesSlain:0, removes:0, evolves:0, turnsTotal:0, lastInter:null,
      p:{ hp:15,maxHp:15,level:1,xp:0,xpNext:40, attack:0,spell:0,armor:0,dodge:0,counter:0,crit:0,lifesteal:0,thorns:0,ultPower:100,luck:0,energyMax:3,handSize:2,regen:0,slots:3,
          gold:40, ultCharge:0, ult:'bladestorm', ults:['bladestorm'], deck:startingDeck(), evo:{}, bought:{} },
      boosts:[], fight:null, spoils:null, inter:null, shop:null, log:[] };
  markSeen(G.p.deck); sfx('start'); startRound();
}
// ---- scaling & rewards ----
// Enemy curve: round 1 foes are level 1 (3-5 HP, 1 attack); growth is gentle early and keeps climbing forever.
const hpMult=s=>0.17+0.09*(s-1)+0.008*(s-1)*(s-1);
const atkMult=s=>0.25+0.07*(s-1)+0.004*(s-1)*(s-1);
function goldReward(){ return Math.round((12+4*G.round)*(1+PS('luck')/100)); }
function xpReward(){ return 12+4*G.round; }
function scaledPrice(base){ return Math.round(base*(1+0.03*G.round)); }
function gainXp(x){
  G.p.xp+=x; let ups=0;
  while(G.p.xp>=G.p.xpNext){ G.p.xp-=G.p.xpNext; G.p.level++; G.p.xpNext=Math.round(40+G.p.level*22); G.p.maxHp+=8; G.p.attack+=1; G.p.spell+=1; heal(Math.round(G.p.maxHp*.25)); ups++; }
  if(ups){ log(`Level up! You are level ${G.p.level}: +8 Max HP, +1 Attack, +1 Spell Power, and a new card`,'good'); if(typeof banner==='function') banner(`Level ${G.p.level}!`,'gold'); setTimeout(()=>sfx('levelup'),700); }
  return ups;
}
function heal(n){ if(!G) return 0; const b=G.p.hp; G.p.hp=Math.min(G.p.maxHp,G.p.hp+Math.max(0,Math.round(n))); return G.p.hp-b; }
function gainUlt(n){ G.p.ultCharge=clamp(G.p.ultCharge+n,0,100); }
function log(msg,cls){ if(!G) return; G.log.push({m:msg,c:cls||''}); if(G.log.length>60) G.log.shift(); }

// ---- cards, tiers, evolution ----
function tierIdx(id){ return TIERS.indexOf(CARD[id].tier); }
function curTier(id){ return Math.min(8, tierIdx(id)+(G.p.evo[id]||0)); }
function canEvolve(id){ return CARD[id].type!=='curse'&&curTier(id)<8; }
function evolveCard(id,n){ const before=curTier(id); G.p.evo[id]=Math.min(8-tierIdx(id),(G.p.evo[id]||0)+(n||1)); if(curTier(id)>before) G.evolves++; return curTier(id)>before; }
function cardVals(id,tier){ const d=CARD[id]; const cur=tier!=null?tier:(G?curTier(id):tierIdx(id)); const m=TIER[TIERS[cur]].mult/TIER[d.tier].mult; const v={}; for(const k in d.n) v[k]=SCALE_KEYS.includes(k)?Math.max(1,Math.round(d.n[k]*m)):d.n[k]; return v; }
function cardCost(id){ const d=CARD[id]; return (d.type==='spell'||d.type==='summon')?d.cost:0; }
function addCard(id){ markSeen(id); if(CARD[id].type==='curse'){ G.p.deck.push(id); return 'added'; } if(G.p.deck.includes(id)){ if(canEvolve(id)){ evolveCard(id,1); return 'evolved'; } G.p.deck.push(id); return 'copied'; } G.p.deck.push(id); return 'added'; }
function removeCard(id){ const i=G.p.deck.indexOf(id); if(i>=0) G.p.deck.splice(i,1); if(!G.p.deck.includes(id)) delete G.p.evo[id]; }
function tierWeights(kind){
  const s=G.round; const shift={fight:0,elite:1,boss:2.2,chest:0.6,shop:0.4,treasury:2.6,idol:2}[kind]||0;
  const center=Math.min(8,s/5+shift+PS('luck')/40); const w={};
  TIERS.forEach((t,i)=>{ const dist=i-center; w[t]=Math.exp(-Math.abs(dist)/1.4)*(dist>0?Math.pow(0.45,dist):1); if(i>0&&s<TIER[t].min-2-shift*4) w[t]*=0.04; });
  return w;
}
function randomCardId(kind,exclude,filter){ const tier=weightedPick(tierWeights(kind)); let pool=CARDS.filter(x=>x.tier===tier&&x.type!=='curse'&&!x.drop&&!(exclude||[]).includes(x.id)&&(!filter||filter(x))); if(!pool.length) pool=CARDS.filter(x=>x.type!=='curse'&&!x.drop&&!(exclude||[]).includes(x.id)); return pick(pool).id; }   // creature abilities (drop) only come from the creature
function offerPool(kind,n,filter){ const ids=[]; let guard=0; while(ids.length<n&&guard++<40){ const id=randomCardId(kind,ids,filter); if(!ids.includes(id)) ids.push(id); } markSeen(ids); return ids; }
function deckCounts(){ const m={}; for(const id of G.p.deck) m[id]=(m[id]||0)+1; return m; }

// ---- round flow: battle -> spoils -> interlude (automatic) -> next round ----
function startRound(){ const r=G.round; const o=r%10===0?{boss:true}:r%5===0?{elite:true}:{}; startFight(o); }
function spoilsContinue(){
  clearTimeout(UI.timer); const o=(G.fight&&G.fight.o)||{};
  if(o.ambush||o.mimic){ nextRound(); return; }
  tickBoosts();
  // Seven-round cycle: random encounters, a campfire on the 4th round, the merchant on the 7th. Bosses get their treasury.
  if(o.boss) openInterlude('treasury'); else if(G.round%7===0) openInterlude('shop'); else if(G.round%7===4) openInterlude('camp'); else openInterlude(pickInterlude());
}
function pickInterlude(){ const w={}; for(const it of INTERLUDES){ if(it.t===G.lastInter) continue; if(it.t==='ambush'&&G.round<3) continue; if(it.t==='idol'&&G.round<4) continue; w[it.t]=it.w; } return weightedPick(w); }
function tickBoosts(){ for(const b of G.boosts) b.rounds--; G.boosts=G.boosts.filter(b=>b.rounds>0); }
function openInterlude(t){
  G.lastInter=t; G.inter={t,lines:[],cards:null,picked:false,boost:null,evolved:null,auto:true};
  const I=G.inter; const p=G.p;
  if(t==='shop'){ openShop(); return; }
  if(t==='chest'){
    const gold=goldReward()*rnd(2,4); p.gold+=gold; I.lines.push(`+${gold} gold`);
    const r=Math.random();
    if(r<0.35){ const id=forgeRandom(); if(id) I.lines.push(`${CARD[id].name} evolved to ${TIERS[curTier(id)]}`); else { p.gold+=gold; I.lines.push(`and another +${gold} gold`); } }
    else if(r<0.6){ const pot=pick(CARDS.filter(x=>x.type==='potion')).id; const res=addCard(pot); I.lines.push(res==='evolved'?`${CARD[pot].name} evolved to ${TIERS[curTier(pot)]}`:`${CARD[pot].name}`); }
    else if(r<0.85){ const stats=['maxHp','attack','spell','armor','dodge','counter','crit','luck']; const k=pick(stats); const v=k==='maxHp'?8:['dodge','counter','crit'].includes(k)?4:k==='luck'?2:1; p[k]+=v; if(k==='maxHp') p.hp+=v; I.lines.push(`+${v} ${STATNAMES[k]} permanently`); }
    else { const id=forgeRandom(); if(id) I.lines.push(`${CARD[id].name} evolved to ${TIERS[curTier(id)]}`); else { p.gold+=gold; I.lines.push(`and another +${gold} gold`); } }
  }
  else if(t==='boost'){ const active=G.boosts.map(b=>b.id); const b=pick(BOOSTS.filter(x=>!active.includes(x.id))); G.boosts.push({id:b.id,name:b.name,icon:b.icon,el:b.el,stat:b.stat,v:b.v,rounds:b.rounds+1}); if(b.charge){ p.ultCharge=100; } I.boost=b.id; I.lines.push(`${b.name}: ${b.text} Lasts ${b.rounds} rounds.`); }
  else if(t==='shrine'){ const h=heal(Math.round(p.maxHp*0.3)); I.lines.push(`Healed ${h}.`); }
  else if(t==='forge'){ if([...new Set(p.deck)].some(canEvolve)){ I.auto=false; I.lines.push('Pick one card. The smith reforges it one tier higher, free of charge.'); } else { p.gold+=60; I.lines.push('Nothing left to improve. The smith pays you 60 gold for the trouble.'); } }
  else if(t==='trap'){ const d=Math.max(1,Math.round(p.maxHp*0.1)); p.hp=Math.max(1,p.hp-d); const g=goldReward()*3; p.gold+=g; I.lines.push(`-${d} HP, +${g} gold.`); }
  else if(t==='idol'){ const id=randomCardId('idol'); addCard(id); addCard('doom'); I.lines.push(`You gain ${CARD[id].name} (${CARD[id].tier}). A Doom curse joins your deck.`); }
  else if(t==='camp'){ I.auto=false; I.lines.push(`Rest to heal ${CAMP.healPct}% of your Max HP, or train to raise your Max HP by ${CAMP.toughPct}% for good.`); }
  else if(t==='ambush'){ I.auto=true; }
  else if(t==='treasury'){ const gold=goldReward()*5; p.gold+=gold; I.lines.push(`+${gold} gold`); I.cards=offerPool('treasury',3); I.auto=false; I.lines.push('and a card that remembers its owner'); }
  G.phase='interlude'; render(); save(); sfx({chest:'chest',treasury:'chest',boost:'blessing',shrine:'shrine',forge:'forge',trap:'trapfall',idol:'idol',ambush:'ambush',camp:'shrine'}[t]||'click');
  if(t==='ambush'){ UI.timer=setTimeout(()=>{ startFight({elite:true,goldMult:2,ambush:true}); },1500); }
  else if(I.auto){ UI.timer=setTimeout(nextRound,3200); }
}
function forgePick(){ const I=G.inter; if(!I||I.t!=='forge'||I.picked) return; pickDeckCard('Choose a card to reforge',id=>{ if(!canEvolve(id)){ toast('Already ultimate'); render(); return; } evolveCard(id,1); I.picked=true; I.lines.push(`${CARD[id].name} is reforged into ${TIERS[curTier(id)]}.`); sfx('evolve'); render(); save(); UI.timer=setTimeout(nextRound,1600); },id=>canEvolve(id)?`→ ${TIERS[curTier(id)+1]}`:'ultimate'); }
const CAMP={healPct:40,toughPct:10};
function campChoose(kind){ const I=G.inter; if(!I||I.t!=='camp'||I.picked) return; const p=G.p; if(kind==='tough'){ const v=Math.max(5,Math.round(p.maxHp*CAMP.toughPct/100)); p.maxHp+=v; p.hp+=v; I.lines.push(`You train by the fire: +${v} Max HP, for good.`); sfx('levelup'); } else { const h=heal(Math.round(p.maxHp*CAMP.healPct/100)); I.lines.push(`You rest by the fire and heal ${h}.`); sfx('heal'); } I.picked=true; render(); save(); UI.timer=setTimeout(nextRound,1600); }
function forgeRandom(){ const ids=[...new Set(G.p.deck)].filter(canEvolve); if(!ids.length) return null; const id=pick(ids); evolveCard(id,1); return id; }
function interludePick(id){ const I=G.inter; if(!I||!I.cards||I.picked) return; sfx(G.p.deck.includes(id)&&canEvolve(id)?'evolve':'pick'); const res=addCard(id); I.picked=true; I.lines.push(res==='evolved'?`${CARD[id].name} evolves to ${TIERS[curTier(id)]}.`:`${CARD[id].name} joins your deck.`); render(); save(); UI.timer=setTimeout(nextRound,1200); }
function interludeSkip(){ const I=G.inter; if(!I||I.picked) return; I.picked=true; I.lines.push('You take no card.'); render(); save(); UI.timer=setTimeout(nextRound,900); }
function interludeContinue(){ const I=G.inter; if(!I) return; if(I.cards&&!I.picked) return; if(I.t==='ambush') return; clearTimeout(UI.timer); nextRound(); }
function nextRound(){ clearTimeout(UI.timer); if(!G) return; G.round++; G.inter=null; G.spoils=null; G.fight=null; G.shop=null; startRound(); save(); }

// ---- merchant (every 7th round): upgrades a card you own for gold. New cards only come from levelling up. ----
function openShop(){ G.shop={}; G.phase='shop'; render(); save(); sfx('shop'); }
function evolvePrice(id){ return Math.round(TIER[TIERS[Math.min(8,curTier(id)+1)]].price*0.7*(1+0.03*G.round)); }
function shopUpgrade(id){ if(!G.p.deck.includes(id)) return; if(!canEvolve(id)){toast('Already ultimate');return;} const c=evolvePrice(id); if(G.p.gold<c){toast('Not enough gold');return;} G.p.gold-=c; evolveCard(id,1); toast(`${CARD[id].name} evolved to ${TIERS[curTier(id)]}`); sfx('evolve'); render(); save(); }

// ---- death ----
function gameOver(){ clearTimeout(UI.timer); sfx('defeat'); if(G.fight) G.fight.over=true; G.best=recordBest(); clearSave(); G.phase='gameover'; render(); }
