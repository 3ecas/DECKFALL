'use strict';
// ===================== RUN STATE, ROUND FLOW, PROGRESSION, SAVE =====================
let G = null;                       // the whole run (serialisable)
const UI = {busy:false, modal:null, uid:1, handUids:[], fightKey:0, timer:null, screen:null, lib:{els:[],types:[],tiers:[],costs:[],q:'',undisc:false,sort:'tier'}};
const SAVE_KEY='deckfall4_save', BEST_KEY='deckfall3_best';   // v4: the climb; older saves (the hex dungeons) are not loaded
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
function save(){ if(!G) return; G.uid=UI.uid; store.set(SAVE_KEY, JSON.stringify(G)); }
function loadSave(){ try{ const s=store.get(SAVE_KEY); return s?JSON.parse(s):null; }catch(e){ return null; } }
function clearSave(){ store.del(SAVE_KEY); }
// ---- card discovery: every card that joined a deck or was offered on a run, kept across runs for the Card Library ----
const SEEN_KEY='deckfall_seen'; let SEEN=null;
function seenCards(){ if(!SEEN){ try{ const s=store.get(SEEN_KEY); SEEN=new Set(s?JSON.parse(s):[]); }catch(e){ SEEN=new Set(); } } return SEEN; }
function markSeen(ids){ const S=seenCards(); let changed=false; for(const id of [].concat(ids)){ if(CARD[id]&&!S.has(id)){ S.add(id); changed=true; } } if(changed) store.set(SEEN_KEY,JSON.stringify([...S])); }
function getBest(){ try{ const s=store.get(BEST_KEY); return s?JSON.parse(s):null; }catch(e){ return null; } }
function recordBest(){ const b=getBest()||{depth:0,round:0,lairs:0,level:1,time:0,kills:0,runs:0,won:0}; b.runs=(b.runs||0)+1; const r=G.rounds||0; if(r>(b.round||0)){ b.round=r; b.depth=G.depth||0; b.lairs=G.bossesSlain; b.level=G.p.level; b.time=G.time||0; b.kills=G.kills; } if(G.won) b.won=(b.won||0)+1; store.set(BEST_KEY, JSON.stringify(b)); return b; }   // the high score is the deepest round

// ---- the hero's few stats (Max HP, Armor, hand size, passive slots) with temporary boosts; powers and damage come from cards ----
function PS(k){ let v=G.p[k]||0; for(const b of G.boosts) if(b.stat===k) v+=b.v; return v; }
function elBoostPct(el){ let v=0; for(const b of G.boosts) if(b.el===el) v+=b.v; return v; }

// ---- new run: five basic cards of one nature type, so every run opens inside a deck (offers then lean toward the elements you hold) ----
function startingDeck(){
  const basics=el=>CARDS.filter(x=>x.tier==='basic'&&x.el===el&&!x.drop&&x.type!=='curse');
  const el=pick(Object.keys(EL).filter(k=>basics(k).some(x=>x.type==='attack')));   // every element has a free basic attack; Beast's is Claw
  const all=basics(el); const atk=all.filter(x=>x.type==='attack'); const rest=shuffle(all.filter(x=>x.type!=='attack'));
  const deck=[atk[0].id,atk[0].id]; if(atk[1]) deck.push(atk[1].id);   // two of the first attack, the second attack if there is one, then the element's spells, shields and skills
  for(const c of rest){ if(deck.length>=5) break; deck.push(c.id); }
  while(deck.length<5) deck.push(atk[deck.length%atk.length].id);
  return deck;
}
function newGame(){
  G={ phase:'descent', round:1, rounds:0, won:false, depth:0, time:0, kills:0, fights:0, bossesSlain:0, removes:0, evolves:0, turnsTotal:0, lastInter:null,
      p:{ hp:15,maxHp:15,level:1,xp:0,xpNext:40, armor:0,handSize:5,slots:3,
          gold:40, deck:startingDeck(), stash:[], evo:{}, bought:{} },
      boosts:[], fight:null, spoils:null, inter:null, shop:null, log:[] };
  kitInit(); genDungeon(1); markSeen(G.p.deck); sfx('start'); render(); save();   // the run opens at the top of the first dungeon: the descent screen, then its first fight
}
// ---- scaling & rewards ----
// Enemy curve by round (the fight number of the run; G.round mirrors it). Round 1 foes have 3-5 HP and 2 attack; the curve is tuned so the
// final boss at round 100 (FINAL_ROUND in world.js) is a long fight for a full deck, and it keeps climbing past it for the high score.
const MANA_CAP=10;   // the Mana bar has ten cells
// To the final boss the curve is quadratic; past round 100 enemy HP grows only linearly (fights stay finishable for an ultimate deck) while
// attack accelerates with the square of the round, so the endless climb ends in death rather than in a fight nobody can win.
const hpMult=s=>s<=100?0.18+0.045*(s-1)+0.0010*(s-1)*(s-1):hpMult(100)+0.16*(s-100);
const atkMult=s=>s<=100?0.35+0.055*(s-1)+0.0004*(s-1)*(s-1):atkMult(100)*(s/100)*(s/100);
function goldReward(){ return 12+4*G.round; }
function xpReward(){ return 12+4*G.round; }
function scaledPrice(base){ return Math.round(base*(1+0.03*G.round)); }
function gainXp(x){
  G.p.xp+=x; let ups=0;
  while(G.p.xp>=G.p.xpNext){ G.p.xp-=G.p.xpNext; G.p.level++; G.p.xpNext=Math.round(40+G.p.level*22); G.p.maxHp+=8; heal(Math.round(G.p.maxHp*.25)); ups++; }
  if(ups){ log(`Level up! You are level ${G.p.level}: +8 Max HP and a new card`,'good'); if(typeof banner==='function') banner(`Level ${G.p.level}!`,'gold'); setTimeout(()=>sfx('levelup'),700); }
  return ups;
}
function heal(n){ if(!G) return 0; const b=G.p.hp; G.p.hp=Math.min(G.p.maxHp,G.p.hp+Math.max(0,Math.round(n))); return G.p.hp-b; }
function log(msg,cls){ if(!G) return; G.log.push({m:msg,c:cls||''}); if(G.log.length>60) G.log.shift(); }

// ---- cards, tiers, evolution ----
function tierIdx(id){ return TIERS.indexOf(CARD[id].tier); }
function curTier(id){ return Math.min(8, tierIdx(id)+(G.p.evo[id]||0)); }
function canEvolve(id){ return CARD[id].type!=='curse'&&curTier(id)<8; }
function evolveCard(id,n){ const before=curTier(id); G.p.evo[id]=Math.min(8-tierIdx(id),(G.p.evo[id]||0)+(n||1)); if(curTier(id)>before) G.evolves++; return curTier(id)>before; }
// Values at a tier. Damage, block, heal, status and the other SCALE_KEYS: the base value times the tier ratio, and every tier above the card's own
// adds at least +1, so an upgrade always shows a bigger number. Mana (e), draw (d) and redraw (n): exactly +1 per tier. Hits: +1 every two tiers
// (the damage of each hit already grows). Self-damage (s) is a cost and stays where it is. Every card gets stronger with every tier.
function cardVals(id,tier){ const d=CARD[id]; const cur=tier!=null?tier:(G?curTier(id):tierIdx(id)); const b=tierIdx(id); const up=Math.max(0,cur-b); const v={};
  for(const k in d.n){ const base=d.n[k];
    if(SCALE_KEYS.includes(k)){ let x=Math.max(1,base); for(let t=b+1;t<=cur;t++) x=Math.max(x+1,Math.round(base*TIER[TIERS[t]].mult/TIER[d.tier].mult)); v[k]=x; }
    else if(k==='e'||k==='d'||k==='n') v[k]=base+up;
    else if(k==='hits') v[k]=base+Math.floor(up/2);
    else v[k]=base; }
  return v; }
function cardCost(id){ const d=CARD[id]; return (d.type==='spell'||d.type==='summon')?d.cost:0; }
// One deck of at most DECK_MAX cards travels with you; anything more waits in the pack until a town lets you swap. Curses always squeeze in.
function addCard(id){ markSeen(id); if(CARD[id].type==='curse'){ G.p.deck.push(id); kitAdd(id); return 'added'; } const owned=G.p.deck.includes(id)||(G.p.stash||[]).includes(id); if(owned&&canEvolve(id)){ evolveCard(id,1); return 'evolved'; } if(G.p.deck.length>=DECK_MAX){ (G.p.stash=G.p.stash||[]).push(id); return 'packed'; } G.p.deck.push(id); kitAdd(id); return owned?'copied':'added'; }
function removeCard(id){ const i=G.p.deck.indexOf(id); if(i>=0) G.p.deck.splice(i,1); if(!G.p.deck.includes(id)) delete G.p.evo[id]; }
function tierWeights(kind){
  const s=G.round; const shift={fight:0,elite:1,boss:2.2,chest:0.6,shop:0.4,treasury:2.6,idol:2}[kind]||0;
  const center=Math.min(8,s/8+shift); const w={};   // the tier ladder: ultimate offers become the norm around round 64, well before the final boss
  TIERS.forEach((t,i)=>{ const dist=i-center; w[t]=Math.exp(-Math.abs(dist)/1.4)*(dist>0?Math.pow(0.45,dist):1); if(i>0&&s<TIER[t].min-2-shift*4) w[t]*=0.04; });
  return w;
}
function randomCardId(kind,exclude,filter){ const tier=weightedPick(tierWeights(kind)); let pool=CARDS.filter(x=>x.tier===tier&&x.type!=='curse'&&!x.drop&&!x.legendary&&!(exclude||[]).includes(x.id)&&(!filter||filter(x))); if(!pool.length) pool=CARDS.filter(x=>x.type!=='curse'&&!x.drop&&!x.legendary&&!(exclude||[]).includes(x.id)); return pick(pool).id; }   // creature abilities (drop) only come from the creature
// Every nature type is a deck (js/data/decks.js) and decks assemble along the run: some offer slots lean toward the elements you already hold
// (two points per card beyond the first of that element) and a little toward the dungeon theme's elements.
const DECK_PULL=0.45;   // share of offer slots that lean toward a deck, when there is one to lean toward
function deckLean(){ const own={}; for(const id of [...G.p.deck,...(G.p.stash||[])]){ if(!CARD[id]||CARD[id].type==='curse') continue; const dk=deckOf(CARD[id]); own[dk]=(own[dk]||0)+1; } const w={}; for(const dk in own) if(own[dk]>1) w[dk]=(own[dk]-1)*2; const T=G.dungeon&&typeof THEMES!=='undefined'&&THEMES[G.dungeon.theme]; if(T) for(const dk of T.els) w[dk]=(w[dk]||0)+1.5; return w; }
function randomDeckCardId(kind,deck,exclude){ const pool=CARDS.filter(x=>deckOf(x)===deck&&x.type!=='curse'&&!x.drop&&!x.legendary&&!(exclude||[]).includes(x.id)); if(!pool.length) return null; const tw=tierWeights(kind); const w={}; for(const t in tw) if(pool.some(x=>x.tier===t)) w[t]=tw[t]; const tier=weightedPick(w); return pick(pool.filter(x=>x.tier===tier)).id; }
// Legendary cards (cards.js, {legendary:1}) never sit in a normal pool. Each offer has a small chance to slip one into its last slot:
// the base chance per offer kind, scaled up to full by round 12 and by Luck (+4% per point). A boss's treasury is the likeliest place.
const LEGEND_CHANCE={fight:0.012,elite:0.03,boss:0.06,chest:0.02,shop:0.025,treasury:0.2,idol:0.03};
function legendaryDrop(kind){ if(!G) return null; const L=CARDS.filter(x=>x.legendary); if(!L.length) return null; const p=(LEGEND_CHANCE[kind]||0.01)*Math.min(1,G.round/12); return Math.random()<p?pick(L).id:null; }
function offerPool(kind,n,filter){ const ids=[]; let guard=0; const lean=filter?{}:deckLean(); const any=Object.keys(lean).length>0; while(ids.length<n&&guard++<40){ let id=any&&Math.random()<DECK_PULL?randomDeckCardId(kind,weightedPick(lean),ids):null; if(!id) id=randomCardId(kind,ids,filter); if(!ids.includes(id)) ids.push(id); } if(!filter&&ids.length){ const lg=legendaryDrop(kind); if(lg&&!ids.includes(lg)) ids[ids.length-1]=lg; } markSeen(ids); return ids; }
function deckCounts(){ const m={}; for(const id of G.p.deck) m[id]=(m[id]||0)+1; return m; }

// ---- flow: a fight -> spoils -> an interlude (or the treasury, or the keeper at the bottom) -> the next fight (afterFight in world.js) ----
function spoilsContinue(){ clearTimeout(UI.timer); tickBoosts(); afterFight(); }   // boosts count down per fight
function pickInterlude(){ const w={}; for(const it of INTERLUDES){ if(it.t===G.lastInter) continue; if(it.t==='ambush'&&G.round<3) continue; if(it.t==='idol'&&G.round<4) continue; w[it.t]=it.w; } return weightedPick(w); }
function tickBoosts(){ for(const b of G.boosts) b.rounds--; G.boosts=G.boosts.filter(b=>b.rounds>0); }
function openInterlude(t){
  G.lastInter=t; G.inter={t,lines:[],cards:null,picked:false,boost:null,evolved:null,auto:true};
  const I=G.inter; const p=G.p;
  if(t==='shop'){ openShop(); return; }
  if(t==='event'){ openEvent(); return; }   // a person on the road (EVENTS in world.js)
  if(t==='chest'){
    const gold=goldReward()*rnd(2,4); p.gold+=gold; I.lines.push(`+${gold} gold`);
    const r=Math.random();
    if(r<0.35){ const id=forgeRandom(); if(id) I.lines.push(`${CARD[id].name} evolved to ${TIERS[curTier(id)]}`); else { p.gold+=gold; I.lines.push(`and another +${gold} gold`); } }
    else if(r<0.6){ const pot=pick(CARDS.filter(x=>x.type==='potion')).id; const res=addCard(pot); I.lines.push(res==='evolved'?`${CARD[pot].name} evolved to ${TIERS[curTier(pot)]}`:res==='packed'?`${CARD[pot].name} (into your pack: the deck is full)`:`${CARD[pot].name}`); }
    else if(r<0.85){ const k=pick(['maxHp','maxHp','armor']); const v=k==='maxHp'?8:1; p[k]+=v; if(k==='maxHp') p.hp+=v; I.lines.push(`+${v} ${STATNAMES[k]} permanently`); }
    else { const id=forgeRandom(); if(id) I.lines.push(`${CARD[id].name} evolved to ${TIERS[curTier(id)]}`); else { p.gold+=gold; I.lines.push(`and another +${gold} gold`); } }
  }
  else if(t==='boost'){ const active=G.boosts.map(b=>b.id); const b=pick(BOOSTS.filter(x=>!active.includes(x.id))); G.boosts.push({id:b.id,name:b.name,icon:b.icon,el:b.el,stat:b.stat,v:b.v,rounds:b.rounds+1}); I.boost=b.id; I.lines.push(`${b.name}: ${b.text} Lasts ${b.rounds} fights.`); }
  else if(t==='shrine'){ const h=heal(Math.round(p.maxHp*0.3)); I.lines.push(`Healed ${h}.`); }
  else if(t==='forge'){ if([...new Set(p.deck)].some(canEvolve)){ I.auto=false; I.lines.push('Pick one card. The smith reforges it one tier higher, free of charge.'); } else { p.gold+=60; I.lines.push('Nothing left to improve. The smith pays you 60 gold for the trouble.'); } }
  else if(t==='trap'){ const d=Math.max(1,Math.round(p.maxHp*0.1)); p.hp=Math.max(1,p.hp-d); const g=goldReward()*3; p.gold+=g; I.lines.push(`-${d} HP, +${g} gold.`); }
  else if(t==='idol'){ const id=randomCardId('idol'); addCard(id); addCard('doom'); I.lines.push(`You gain ${CARD[id].name} (${CARD[id].tier}). A Doom curse joins your deck.`); }
  else if(t==='camp'){ I.auto=false; I.lines.push(`Rest to heal ${CAMP.healPct}% of your Max HP, or train to raise your Max HP by ${campTough()} for good.`); }
  else if(t==='ambush'){ I.auto=true; }
  else if(t==='treasury'){ const gold=goldReward()*5; p.gold+=gold; I.lines.push(`+${gold} gold`); I.cards=offerPool('treasury',3); I.auto=false; I.lines.push('and a card that remembers its owner'); }
  G.phase='interlude'; render(); save(); sfx({chest:'chest',treasury:'chest',boost:'blessing',shrine:'shrine',forge:'forge',trap:'trapfall',idol:'idol',ambush:'ambush',camp:'shrine'}[t]||'click');
  if(t==='ambush'){ UI.timer=setTimeout(()=>{ startFight({elite:true,goldMult:2,ambush:true}); },1500); }
  else if(I.auto){ UI.timer=setTimeout(nextRound,3200); }
}
function forgePick(){ const I=G.inter; if(!I||I.t!=='forge'||I.picked) return; pickDeckCard('Choose a card to reforge',id=>{ if(!canEvolve(id)){ toast('Already ultimate'); render(); return; } I.pick=id; render(); save(); },id=>canEvolve(id)?`→ ${TIERS[curTier(id)+1]}`:'ultimate'); }   // shows it before and after first
function forgeBack(){ const I=G.inter; if(!I||I.t!=='forge'||I.picked) return; I.pick=null; render(); }
function forgeConfirm(){ const I=G.inter; if(!I||I.t!=='forge'||I.picked||!I.pick) return; const id=I.pick; evolveCard(id,1); I.picked=true; I.lines.push(`${CARD[id].name} is reforged into ${TIERS[curTier(id)]}.`); sfx('evolve'); render(); save(); UI.timer=setTimeout(nextRound,1800); }
const CAMP={healPct:40}; function campTough(){ return 6+Math.floor(G.round/4); }   // training is a flat gain that grows with the round (a percentage compounded into an exponential)
function campChoose(kind){ const I=G.inter; if(!I||I.t!=='camp'||I.picked) return; const p=G.p; if(kind==='tough'){ const v=campTough(); p.maxHp+=v; p.hp+=v; I.lines.push(`You train by the fire: +${v} Max HP, for good.`); sfx('levelup'); } else { const h=heal(Math.round(p.maxHp*CAMP.healPct/100)); I.lines.push(`You rest by the fire and heal ${h}.`); sfx('heal'); } I.picked=true; render(); save(); UI.timer=setTimeout(nextRound,1600); }
function forgeRandom(){ const ids=[...new Set(G.p.deck)].filter(canEvolve); if(!ids.length) return null; const id=pick(ids); evolveCard(id,1); return id; }
function interludePick(id){ const I=G.inter; if(!I||!I.cards||I.picked) return; sfx(G.p.deck.includes(id)&&canEvolve(id)?'evolve':'pick'); const res=addCard(id); I.picked=true; I.lines.push(res==='evolved'?`${CARD[id].name} evolves to ${TIERS[curTier(id)]}.`:res==='packed'?`${CARD[id].name} goes into your pack: the deck is full. Swap it in at a town.`:`${CARD[id].name} joins your deck.`); render(); save(); UI.timer=setTimeout(nextRound,1200); }
function interludeSkip(){ const I=G.inter; if(!I||I.picked) return; I.picked=true; I.lines.push('You take no card.'); render(); save(); UI.timer=setTimeout(nextRound,900); }
function interludeContinue(){ const I=G.inter; if(!I) return; if(I.cards&&!I.picked) return; if(I.t==='ambush') return; clearTimeout(UI.timer); nextRound(); }
function nextRound(){ clearTimeout(UI.timer); if(!G) return; G.inter=null; G.spoils=null; G.fight=null; G.shop=null; const D=G.dungeon; if(!D||D.step>=D.len) openKeeper(); else startEncounter(); }   // the climb goes on: the next planned fight, or the keeper at the bottom

// ---- blacksmith (at the keeper, between dungeons): upgrades a card you own for gold. ----
function openShop(){ G.shop={pick:null}; G.phase='shop'; render(); save(); sfx('shop'); }
function shopPick(id){ if(!G.shop||G.shop.used||!G.p.deck.includes(id)) return; if(!canEvolve(id)){ toast('Already ultimate'); return; } G.shop.pick=id; render(); save(); }   // show it before and after, then ask
function shopBack(){ if(!G.shop||G.shop.used) return; G.shop.pick=null; render(); }
function evolvePrice(id){ return Math.round(TIER[TIERS[Math.min(8,curTier(id)+1)]].price*0.7*(1+0.03*G.round)); }
function shopUpgrade(id){ if(!G.p.deck.includes(id)) return; if(G.shop&&G.shop.used){toast('The merchant only upgrades one card per visit');return;} if(!canEvolve(id)){toast('Already ultimate');return;} const c=evolvePrice(id); if(G.p.gold<c){toast('Not enough gold');return;} G.p.gold-=c; evolveCard(id,1); G.shop.used=CARD[id].name+' → '+TIERS[curTier(id)]; G.shop.pick=id; if(G.keeper) G.keeper.used.smith=true; toast(`${CARD[id].name} evolved to ${TIERS[curTier(id)]}`); sfx('evolve'); render(); save(); }   // one upgrade per visit

// ---- death ----
function gameOver(){ clearTimeout(UI.timer); sfx('defeat'); if(G.fight) G.fight.over=true; G.best=recordBest(); clearSave(); G.phase='gameover'; render(); }
