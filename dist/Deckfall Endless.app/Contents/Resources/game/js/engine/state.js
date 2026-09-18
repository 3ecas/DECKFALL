'use strict';
// ===================== RUN STATE, ROUND FLOW, PROGRESSION, SAVE =====================
let G = null;                       // the whole run (serialisable)
const UI = {busy:false, modal:null, uid:1, handUids:[], fightKey:0, timer:null};
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
function getBest(){ try{ const s=store.get(BEST_KEY); return s?JSON.parse(s):null; }catch(e){ return null; } }
function recordBest(){ const b=getBest()||{round:0,kills:0,level:1,bosses:0,runs:0}; b.runs=(b.runs||0)+1; if(G.round>b.round){ b.round=G.round; b.kills=G.kills; b.level=G.p.level; b.bosses=G.bossesSlain; } store.set(BEST_KEY, JSON.stringify(b)); return b; }

// ---- stats with temporary boosts ----
function PS(k){ let v=G.p[k]||0; for(const b of G.boosts) if(b.stat===k) v+=b.v; return v; }
function elBoostPct(el){ let v=0; for(const b of G.boosts) if(b.el===el) v+=b.v; return v; }

// ---- new run: always basic cards, with random element seeds so every run opens differently ----
function startingDeck(){
  const deck=['strike','strike','strike','strike','guard','guard','mana_potion'];
  const els=shuffle(['fire','water','ice','light','grass','poison','earth','shadow','holy']).slice(0,3);
  for(const el of els){ const pool=CARDS.filter(x=>x.tier==='basic'&&x.el===el&&x.fx.some(f=>f[0]==='dmg'||f[0]==='se')&&x.type!=='curse'); deck.push(pick(pool).id); }
  return deck;
}
function newGame(){
  G={ phase:'battle', round:1, kills:0, fights:0, bossesSlain:0, removes:0, evolves:0, turnsTotal:0, lastInter:null,
      p:{ hp:70,maxHp:70,level:1,xp:0,xpNext:40, attack:0,spell:0,armor:0,dodge:5,counter:10,crit:5,lifesteal:0,thorns:0,ultPower:100,luck:0,energyMax:3,handSize:5,regen:0,slots:3,
          gold:40, ultCharge:0, ult:'bladestorm', ults:['bladestorm'], deck:startingDeck(), evo:{}, bought:{} },
      boosts:[], fight:null, spoils:null, inter:null, shop:null, log:[] };
  sfx('start'); startRound();
}
// ---- scaling & rewards ----
const hpMult=s=>0.9*(1+0.16*s+0.006*s*s);
const atkMult=s=>1+0.09*s+0.0025*s*s;
function goldReward(){ return Math.round((12+4*G.round)*(1+PS('luck')/100)); }
function xpReward(){ return 12+4*G.round; }
function scaledPrice(base){ return Math.round(base*(1+0.03*G.round)); }
function gainXp(x){
  G.p.xp+=x; let ups=0;
  while(G.p.xp>=G.p.xpNext){ G.p.xp-=G.p.xpNext; G.p.level++; G.p.xpNext=Math.round(40+G.p.level*22); G.p.maxHp+=8; G.p.attack+=1; G.p.spell+=1; heal(Math.round(G.p.maxHp*.25)); ups++; }
  if(ups){ log(`Level up! You are level ${G.p.level}: +8 Max HP, +1 Attack, +1 Spell Power`,'good'); if(typeof banner==='function') banner(`Level ${G.p.level}!`,'gold'); setTimeout(()=>sfx('levelup'),700); }
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
function addCard(id){ if(CARD[id].type==='curse'){ G.p.deck.push(id); return 'added'; } if(G.p.deck.includes(id)){ if(canEvolve(id)){ evolveCard(id,1); return 'evolved'; } G.p.deck.push(id); return 'copied'; } G.p.deck.push(id); return 'added'; }
function removeCard(id){ const i=G.p.deck.indexOf(id); if(i>=0) G.p.deck.splice(i,1); if(!G.p.deck.includes(id)) delete G.p.evo[id]; }
function tierWeights(kind){
  const s=G.round; const shift={fight:0,elite:1,boss:2.2,chest:0.6,shop:0.4,treasury:2.6,idol:2}[kind]||0;
  const center=Math.min(8,s/5+shift+PS('luck')/40); const w={};
  TIERS.forEach((t,i)=>{ const dist=i-center; w[t]=Math.exp(-Math.abs(dist)/1.4)*(dist>0?Math.pow(0.45,dist):1); if(i>0&&s<TIER[t].min-2-shift*4) w[t]*=0.04; });
  return w;
}
function randomCardId(kind,exclude,filter){ const tier=weightedPick(tierWeights(kind)); let pool=CARDS.filter(x=>x.tier===tier&&x.type!=='curse'&&!(exclude||[]).includes(x.id)&&(!filter||filter(x))); if(!pool.length) pool=CARDS.filter(x=>x.type!=='curse'&&!(exclude||[]).includes(x.id)); return pick(pool).id; }
function offerPool(kind,n,filter){ const ids=[]; let guard=0; while(ids.length<n&&guard++<40){ const id=randomCardId(kind,ids,filter); if(!ids.includes(id)) ids.push(id); } return ids; }
function cardPrice(id){ const t=TIERS[curTier(id)]; const owned=G.p.deck.includes(id); return Math.round(TIER[owned?TIERS[Math.min(8,curTier(id)+1)]:t].price*(1+0.03*G.round)); }
function evolvePrice(id){ return Math.round(TIER[TIERS[Math.min(8,curTier(id)+1)]].price*0.7*(1+0.03*G.round)); }
function upgPrice(u){ const n=G.p.bought[u.k]||0; return Math.round(u.p*(1+0.32*n)*(1+0.025*G.round)); }
function deckCounts(){ const m={}; for(const id of G.p.deck) m[id]=(m[id]||0)+1; return m; }

// ---- round flow: battle -> spoils -> interlude (automatic) -> next round ----
function startRound(){ const r=G.round; const o=r%10===0?{boss:true}:r%5===0?{elite:true}:{}; startFight(o); }
function spoilsContinue(){
  clearTimeout(UI.timer); const o=(G.fight&&G.fight.o)||{};
  if(o.ambush||o.mimic){ nextRound(); return; }
  tickBoosts();
  if(o.boss) openInterlude('treasury'); else if(G.round%4===0) openInterlude('shop'); else openInterlude(pickInterlude());
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
    if(r<0.4){ I.cards=offerPool('chest',3); I.lines.push('and a card to choose'); I.auto=false; }
    else if(r<0.65){ const pot=pick(CARDS.filter(x=>x.type==='potion')).id; const res=addCard(pot); I.lines.push(res==='evolved'?`${CARD[pot].name} evolved to ${TIERS[curTier(pot)]}`:`${CARD[pot].name}`); }
    else if(r<0.85){ const stats=['maxHp','attack','spell','armor','dodge','counter','crit','luck']; const k=pick(stats); const v=k==='maxHp'?8:['dodge','counter','crit'].includes(k)?4:k==='luck'?2:1; p[k]+=v; if(k==='maxHp') p.hp+=v; I.lines.push(`+${v} ${STATNAMES[k]} permanently`); }
    else { const id=forgeRandom(); if(id) I.lines.push(`${CARD[id].name} evolved to ${TIERS[curTier(id)]}`); else { p.gold+=gold; I.lines.push(`and another +${gold} gold`); } }
  }
  else if(t==='boost'){ const active=G.boosts.map(b=>b.id); const b=pick(BOOSTS.filter(x=>!active.includes(x.id))); G.boosts.push({id:b.id,name:b.name,icon:b.icon,el:b.el,stat:b.stat,v:b.v,rounds:b.rounds+1}); if(b.charge){ p.ultCharge=100; } I.boost=b.id; I.lines.push(`${b.name}: ${b.text} Lasts ${b.rounds} rounds.`); }
  else if(t==='shrine'){ const h=heal(Math.round(p.maxHp*0.3)); I.lines.push(`Healed ${h}.`); }
  else if(t==='forge'){ const id=forgeRandom(); if(id) I.lines.push(`${CARD[id].name} is now ${TIERS[curTier(id)]}.`); else { p.gold+=60; I.lines.push('Nothing left to improve. The smith pays you 60 gold for the trouble.'); } }
  else if(t==='trap'){ const d=Math.max(1,Math.round(p.maxHp*0.1)); p.hp=Math.max(1,p.hp-d); const g=goldReward()*3; p.gold+=g; I.lines.push(`-${d} HP, +${g} gold.`); }
  else if(t==='idol'){ const id=randomCardId('idol'); addCard(id); addCard('doom'); I.lines.push(`You gain ${CARD[id].name} (${CARD[id].tier}). A Doom curse joins your deck.`); }
  else if(t==='ambush'){ I.auto=true; }
  else if(t==='treasury'){ const gold=goldReward()*5; p.gold+=gold; I.lines.push(`+${gold} gold`); I.cards=offerPool('treasury',3); I.auto=false; I.lines.push('and a card that remembers its owner'); }
  G.phase='interlude'; render(); save(); sfx({chest:'chest',treasury:'chest',boost:'blessing',shrine:'shrine',forge:'forge',trap:'trapfall',idol:'idol',ambush:'ambush'}[t]||'click');
  if(t==='ambush'){ UI.timer=setTimeout(()=>{ startFight({elite:true,goldMult:2,ambush:true}); },1500); }
  else if(I.auto){ UI.timer=setTimeout(nextRound,3200); }
}
function forgeRandom(){ const ids=[...new Set(G.p.deck)].filter(canEvolve); if(!ids.length) return null; const id=pick(ids); evolveCard(id,1); return id; }
function interludePick(id){ const I=G.inter; if(!I||!I.cards||I.picked) return; sfx(G.p.deck.includes(id)&&canEvolve(id)?'evolve':'pick'); const res=addCard(id); I.picked=true; I.lines.push(res==='evolved'?`${CARD[id].name} evolves to ${TIERS[curTier(id)]}.`:`${CARD[id].name} joins your deck.`); render(); save(); UI.timer=setTimeout(nextRound,1200); }
function interludeSkip(){ const I=G.inter; if(!I||I.picked) return; I.picked=true; I.lines.push('You take no card.'); render(); save(); UI.timer=setTimeout(nextRound,900); }
function interludeContinue(){ const I=G.inter; if(!I) return; if(I.cards&&!I.picked) return; if(I.t==='ambush') return; clearTimeout(UI.timer); nextRound(); }
function nextRound(){ clearTimeout(UI.timer); if(!G) return; G.round++; G.inter=null; G.spoils=null; G.fight=null; G.shop=null; startRound(); save(); }

// ---- shop (every 4th round) with the Lucky Coin table ----
function openShop(){
  const cards=offerPool('shop',5,x=>x.type!=='potion');
  const upg=shuffle(UPG.filter(u=>!(u.max&&G.p[u.k]>=u.max))).slice(0,4).map(u=>u.k);
  const pots=shuffle(CARDS.filter(x=>x.type==='potion').map(x=>x.id)).slice(0,3);
  G.shop={cards,upg,pots,rerolls:0,tab:'wares',gamble:{bet:0,pot:0,phase:'bet',streak:0,last:null,rounds:0}};
  G.phase='shop'; render(); save(); sfx('shop');
}
function shopBuyCard(id,fromPots){
  const price=fromPots?Math.round(cardPrice(id)*0.8):cardPrice(id); if(G.p.gold<price){toast('Not enough gold');return;}
  G.p.gold-=price; sfx('buy'); const r=addCard(id); if(r==='evolved') sfx('evolve'); toast(r==='evolved'?`${CARD[id].name} evolved to ${TIERS[curTier(id)]}`:r==='copied'?`Another ${CARD[id].name} (already ultimate)`:`${CARD[id].name} added`);
  const list=fromPots?G.shop.pots:G.shop.cards; if(r==='added') list.splice(list.indexOf(id),1);
  render(); save();
}
function shopBuyUpg(k){
  const u=UPG.find(x=>x.k===k); const price=upgPrice(u); if(G.p.gold<price){toast('Not enough gold');return;}
  if(u.max&&G.p[k]>=u.max){toast('Maxed out');return;}
  G.p.gold-=price; G.p[k]+=u.v; if(k==='maxHp') heal(10); G.p.bought[k]=(G.p.bought[k]||0)+1; toast(`+${u.v} ${STATNAMES[k]}`); sfx('buy'); render(); save();
}
function shopRemoveCost(){ return Math.round(55*(1+0.35*G.removes)*(1+0.02*G.round)); }
function shopRemove(){ const c=shopRemoveCost(); if(G.p.gold<c){toast('Not enough gold');return;} pickDeckCard('Choose a card to remove',id=>{ G.p.gold-=c; G.removes++; removeCard(id); toast(`${CARD[id].name} removed`); render(); save(); }); }
function shopEvolve(){ pickDeckCard('Choose a card to evolve',id=>{ if(!canEvolve(id)){toast('Already ultimate');render();return;} const c=evolvePrice(id); if(G.p.gold<c){toast(`Needs ${c} gold`);render();return;} G.p.gold-=c; evolveCard(id,1); toast(`${CARD[id].name} evolved to ${TIERS[curTier(id)]}`); sfx('evolve'); render(); save(); },id=>canEvolve(id)?`${evolvePrice(id)} 🪙 → ${TIERS[curTier(id)+1]}`:'max'); }
function shopHealCost(){ return Math.round(30*(1+0.03*G.round)); }
function shopHeal(){ const c=shopHealCost(); if(G.p.gold<c){toast('Not enough gold');return;} if(G.p.hp>=G.p.maxHp){toast('Already at full health');return;} G.p.gold-=c; const h=heal(Math.round(G.p.maxHp*0.3)); toast(`Healed ${h}`); sfx('heal'); render(); save(); }
function shopRerollCost(){ return 25+15*G.shop.rerolls; }
function shopReroll(){ const c=shopRerollCost(); if(G.p.gold<c){toast('Not enough gold');return;} G.p.gold-=c; G.shop.rerolls++; G.shop.cards=offerPool('shop',5,x=>x.type!=='potion'); G.shop.upg=shuffle(UPG.filter(u=>!(u.max&&G.p[u.k]>=u.max))).slice(0,4).map(u=>u.k); render(); save(); }
function gambleChance(){ const g=G.shop.gamble; const base=clamp(50+PS('luck')/2,50,62); return clamp(Math.round(base-6*g.streak),35,62); }
function gambleFlip(bet){
  const g=G.shop.gamble; if(g.phase==='double') return; bet=Math.floor(bet); if(bet<=0||bet>G.p.gold){toast('Bet what you have.');return;}
  G.p.gold-=bet; g.bet=bet; g.streak=0; g.rounds++; const win=Math.random()*100<gambleChance(); g.last=win?'win':'lose'; g.flipping=true; sfx('flip'); setTimeout(()=>sfx(win?'win':'lose'),800);
  if(win){ g.pot=bet*2; g.phase='double'; } else { g.pot=0; g.phase='lost'; } render(); save();
}
function gambleDouble(){ const g=G.shop.gamble; if(g.phase!=='double') return; g.streak++; const win=Math.random()*100<gambleChance(); g.last=win?'win':'lose'; g.flipping=true; sfx('flip'); setTimeout(()=>sfx(win?'win':'lose'),800); if(win) g.pot*=2; else { g.pot=0; g.phase='lost'; } render(); save(); }
function gambleCashOut(){ const g=G.shop.gamble; if(g.phase!=='double') return; G.p.gold+=g.pot; toast(`+${g.pot} gold`); sfx('coins'); g.phase='done'; render(); save(); }

// ---- death ----
function gameOver(){ clearTimeout(UI.timer); sfx('defeat'); if(G.fight) G.fight.over=true; G.best=recordBest(); clearSave(); G.phase='gameover'; render(); }
