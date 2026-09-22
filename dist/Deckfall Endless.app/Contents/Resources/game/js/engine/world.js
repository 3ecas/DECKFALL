'use strict';
// ===================== THE CLIMB: dungeons as a straight run of fights, the keeper between them =====================
// A dungeon is a plan of encounters: common fights, an elite in the middle of every second dungeon, and the boss last, always.
// Its creatures are rolled when the dungeon is made: never the same one twice in a row, an off-theme creature before a repeat.
// After every fight an interlude comes by itself (a find, a blessing, a person on the road, a campfire every fourth fight);
// after the last one the keeper. The round is the fight number of the run (G.round mirrors it; unplanned fights do not count): everything scales by it.
const THEMES={
  warrens: {n:'Rat Warrens',     i:'🐀', els:['beast','poison'],  c:'#4a3a2a', boss:'chaos_beast'},
  grotto:  {n:'Sunken Grotto',   i:'🌊', els:['water','light'],   c:'#1e4f70', boss:'leviathan'},
  forge:   {n:'Ember Forge',     i:'🌋', els:['fire','earth'],    c:'#5c2a1c', boss:'inferno_drake'},
  halls:   {n:'Frost Halls',     i:'❄️', els:['ice','phys'],      c:'#3d4d68', boss:'frost_titan'},
  crypt:   {n:'Bone Crypt',      i:'💀', els:['shadow','holy'],   c:'#3a2a52', boss:'lich_king'},
  garden:  {n:'Fungal Garden',   i:'🍄', els:['grass','poison'],  c:'#2b4a38', boss:'elder_treant'},
  spire:   {n:'Storm Spire',     i:'⛈️', els:['light','earth'],   c:'#4a4630', boss:'storm_colossus'},
  pits:    {n:'Ash Pits',        i:'🏜️', els:['earth','fire'],    c:'#6a4a26', boss:'earthshaker'},
  sanctum: {n:'Drowned Sanctum', i:'⛪', els:['holy','water'],    c:'#5a5040', boss:'seraph'},
  marsh:   {n:'Hydra Marsh',     i:'🐊', els:['poison','water'],  c:'#2e4a3a', boss:'hydra_matriarch'},
  roost:   {n:'Dragon Roost',    i:'🐉', els:['dragon','fire'],   c:'#5a1e2e', boss:'elder_wyrm'},
  vault:   {n:'Mind Vault',      i:'🔮', els:['psychic','shadow'],c:'#3c1f5a', boss:'archmind'},
  peaks:   {n:'Windswept Peaks', i:'🪽', els:['flying','light'],  c:'#2f4a5c', boss:'roc'},
  arena:   {n:'Fighting Pits',   i:'🥊', els:['fighting','phys'], c:'#5a3a22', boss:'grandmaster'},
};
// Offers inside a theme lean a little toward its elements (deckLean in state.js): every nature type is a deck (js/data/decks.js).
// A theme's backdrop is img/bg/<theme>.svg; to use a picture instead, put it in img/bg and name it on the theme: art:'forge.png'.
const BOSS_RAMP=0, ELITE_EVERY=2, FINAL_ROUND=100, FINAL_BOSS='deckfall';   // a boss fights BOSS_RAMP rounds above its step; an elite in the middle of every ELITE_EVERY-th dungeon; the final boss waits at round FINAL_ROUND, after which the climb is for the high score
function dungeonLen(n){ return Math.min(10,6+n); }   // fights per dungeon: seven in the first, one more with every dungeon, ten at most (bosses at rounds 7, 15, 24, 34, ... and the final one at 100)
const PLAN_ICON={fight:'⚔️',elite:'⭐',boss:'👑'};
function themeNow(){ return THEMES[G.dungeon?G.dungeon.theme:'warrens']; }
function roundNow(){ const D=G.dungeon; return D?D.first+D.step:1; }
function dangerNow(){ return roundNow(); }   // danger is the round
function planCreature(T,danger,avoid){
  const ok=x=>!x.special&&x.min<=danger&&x.min>=Math.min(danger,24)-14;   // the earliest species retire; from round 24 on every later one stays in the pool
  let pool=ENEMIES.filter(x=>ok(x)&&T.els.includes(x.el)&&!avoid.includes(x.id));   // the theme's creatures, minus the recent ones
  if(!pool.length) pool=ENEMIES.filter(x=>ok(x)&&!avoid.includes(x.id));             // a stranger rather than a repeat
  if(!pool.length) pool=ENEMIES.filter(x=>!x.special&&x.min<=danger);
  return pick(pool).id;
}
function genDungeon(n){
  const prev=G.dungeon?G.dungeon.theme:null; const theme=pick(Object.keys(THEMES).filter(k=>k!==prev)); const T=THEMES[theme]; let len=dungeonLen(n);
  const first=(G.rounds||0)+1; let final=false; if(!G.won&&first<=FINAL_ROUND&&first+len-1>=FINAL_ROUND){ len=FINAL_ROUND-first+1; final=true; }   // the dungeon that reaches round FINAL_ROUND ends there, on the final boss
  const plan=Array.from({length:len},()=>'fight'); if(n%ELITE_EVERY===0&&len>2) plan[Math.floor((len-1)/2)]='elite'; plan[len-1]='boss';
  const foes=[];
  for(let i=0;i<len;i++) foes.push(plan[i]==='boss'?(final?FINAL_BOSS:T.boss):planCreature(T,first+i+(plan[i]==='elite'?1:0),foes.slice(-3)));
  G.dungeon={n,theme,len,first,step:0,plan,foes,final}; G.round=dangerNow(); G.depth=Math.max(G.depth||0,n);
}
function openDescent(){ G.phase='descent'; G.inter=null; G.spoils=null; G.fight=null; G.shop=null; G.keeper=null; render(); save(); sfx('start'); }
function descentEnter(){ if(!G||G.phase!=='descent') return; startEncounter(); }
// the next planned encounter: the creature rolled for this step, the elite, or the boss at the bottom (fighting BOSS_RAMP above its step)
function startEncounter(){
  const D=G.dungeon; const kind=D.plan[D.step]||'fight'; G.round=dangerNow(); const id=D.foes&&D.foes[D.step];
  if(kind==='boss') startFight({boss:true,bossId:id||THEMES[D.theme].boss,dangerBonus:BOSS_RAMP,planned:true,final:!!D.final});
  else startFight({elite:kind==='elite',enemyId:id,planned:true});
}
// after the spoils: a planned fight advances the plan; then the treasury (boss), the keeper (bottom), an interlude, or straight on after an unplanned fight
function afterFight(){
  const D=G.dungeon; const o=(G.fight&&G.fight.o)||{}; G.time=(G.time||0)+1;
  if(o.planned){ D.step++; G.rounds=(G.rounds||0)+1; } G.round=dangerNow(); G.fight=null; G.spoils=null;
  if(o.boss){ openInterlude('treasury'); return; }
  if(D.step>=D.len){ openKeeper(); return; }
  if(!o.planned){ startEncounter(); return; }
  if(o.elite){ openInterlude('chest'); return; }   // a nest: the elite guarded a chest
  openInterlude(G.fights%4===0?'camp':pickInterlude());
}
// ---- events: a room with a person or a thing that asks you something ----
const EVENTS={
  gambler:  {icon:'🎲', title:'A hooded gambler', text:'"Twenty gold says the next card I draw beats anything in your deck."', choices:[
    {t:'Take the bet · 20 gold', f(){ if(G.p.gold<20) return 'You cannot cover the bet.'; G.p.gold-=20; if(Math.random()<0.5){ const id=randomCardId('elite'); const res=addCard(id); return `You win: ${CARD[id].name}${res==='packed'?' goes into your pack':res==='evolved'?' evolves':''}.`; } return 'You lose. The gambler smiles and is gone.'; }},
    {t:'Walk on', f(){ return 'You keep your gold.'; }}]},
  altar:    {icon:'🩸', title:'A blood altar', text:'Old blood, older promises. It asks for a little of yours.', choices:[
    {t:'Offer blood · -10% Max HP, +1 Armor for good', f(){ const v=Math.max(1,Math.round(G.p.maxHp*0.1)); G.p.maxHp-=v; G.p.hp=Math.min(G.p.hp,G.p.maxHp); G.p.armor+=1; return `-${v} Max HP, +1 Armor.`; }},
    {t:'Offer blood · -10% Max HP, a card evolves', f(){ const v=Math.max(1,Math.round(G.p.maxHp*0.1)); G.p.maxHp-=v; G.p.hp=Math.min(G.p.hp,G.p.maxHp); const id=forgeRandom(); return id?`-${v} Max HP. ${CARD[id].name} evolves to ${TIERS[curTier(id)]}.`:`-${v} Max HP. Nothing left to evolve; the altar keeps the blood.`; }},
    {t:'Leave it be', f(){ return 'The altar goes quiet.'; }}]},
  wanderer: {icon:'🧑‍🌾', title:'A wounded wanderer', text:'"Share a meal? I know a few tricks worth a story."', choices:[
    {t:'Share a meal · heal 30%', f(){ const h=heal(Math.round(G.p.maxHp*0.3)); return `You eat together. +${h} HP.`; }},
    {t:'Rob them · +gold, -5 Max HP', f(){ const g=goldReward()*2; G.p.gold+=g; G.p.maxHp=Math.max(5,G.p.maxHp-5); G.p.hp=Math.min(G.p.hp,G.p.maxHp); return `+${g} gold. Something in you is smaller now: -5 Max HP.`; }}]},
  well:     {icon:'🪣', title:'A whispering well', text:'Drop a coin, hear a secret.', choices:[
    {t:'Drop 10 gold', f(){ if(G.p.gold<10) return 'No coin to drop.'; G.p.gold-=10; const h=heal(Math.round(G.p.maxHp*0.2)); const g=rnd(15,40); G.p.gold+=g; return `The water is sweet: +${h} HP. Something glints at the bottom: +${g} gold.`; }},
    {t:'Leave', f(){ return 'Silence.'; }}]},
  // people on the road: a choice may end in a fight ({msg, fight}) instead of a line
  thief:    {icon:'🪙', title:'A cutpurse', text:'A shape brushes past you in the dark. Your purse is lighter.', choices:[
    {t:'Give chase · fight for it', f(){ const g=Math.max(10,Math.round(G.p.gold*0.25)); G.p.gold=Math.max(0,G.p.gold-g); return {msg:`-${g} gold. You corner the thief in a dead end.`,fight:{enemyId:'bandit',goldMult:3,ambush:true}}; }},
    {t:'Let it go', f(){ const g=Math.max(10,Math.round(G.p.gold*0.25)); G.p.gold=Math.max(0,G.p.gold-g); return `-${g} gold. Some fights are not worth it.`; }}]},
  bandits:  {icon:'🗡️', title:'Bandits on the road', text:'"Your gold or your blood." The one who talks has a scar for every word.', choices:[
    {t:'Pay the toll · 30% of your gold', f(){ const g=Math.round(G.p.gold*0.3); G.p.gold-=g; return `-${g} gold. They let you pass.`; }},
    {t:'Fight', f(){ return {msg:'Steel answers steel.',fight:{enemyId:'bandit',elite:true,goldMult:2,ambush:true}}; }}]},
  traveler: {icon:'🧳', title:'A traveler', text:'"Going down? Then take something for the road."', choices:[
    {t:'Take the card', f(){ const id=randomCardId('chest'); const res=addCard(id); return `${CARD[id].name}${res==='evolved'?' evolves':res==='packed'?' goes into your pack':' joins your deck'}.`; }},
    {t:'Take the bread · heal 25%', f(){ const h=heal(Math.round(G.p.maxHp*0.25)); return `+${h} HP. Good bread.`; }},
    {t:'Take the coin', f(){ const g=goldReward()*2; G.p.gold+=g; return `+${g} gold.`; }}]},
  peddler:  {icon:'🛒', title:'A peddler', text:'A cart of odd things. "Everything cheap, nothing guaranteed."', choices:[
    {t:'A card · 25 gold', f(){ if(G.p.gold<25) return 'Not enough gold.'; G.p.gold-=25; const id=randomCardId('shop'); const res=addCard(id); return `${CARD[id].name}${res==='evolved'?' evolves':res==='packed'?' goes into your pack':' joins your deck'}.`; }},
    {t:'A potion · 15 gold', f(){ if(G.p.gold<15) return 'Not enough gold.'; G.p.gold-=15; const id=pick(CARDS.filter(x=>x.type==='potion'&&!x.drop)).id; const res=addCard(id); return `${CARD[id].name}${res==='evolved'?' evolves':res==='packed'?' goes into your pack':' joins your deck'}.`; }},
    {t:'Walk on', f(){ return 'The cart rattles away.'; }}]},
};
function openEvent(ev){ ev=ev||pick(Object.keys(EVENTS)); G.lastInter='event'; G.inter={t:'event',ev,lines:[],cards:null,picked:false,boost:null,auto:false}; G.phase='interlude'; render(); save(); sfx('shrine'); }
function eventChoose(i){ const I=G.inter; if(!I||I.t!=='event'||I.picked) return; const ch=EVENTS[I.ev].choices[i]; if(!ch) return; const r=ch.f(); const msg=typeof r==='string'?r:r.msg; I.picked=true; I.lines.push(msg); sfx('pick'); render(); save(); if(r&&r.fight) UI.timer=setTimeout(()=>startFight(r.fight),1400); else UI.timer=setTimeout(nextRound,2000); }
// ---- the keeper: between dungeons, one visit, each service once ----
function restCost(){ return 10+G.round*3; }
function removeCost(){ return 20+G.round*4; }
function cardPrice(id){ return Math.round(TIER[CARD[id].tier].price*0.6*(1+0.03*G.round)*(CARD[id].legendary?2.5:1)); }   // a legendary costs 2.5×
function openKeeper(){ clearTimeout(UI.timer); const purse=goldReward()*2; G.p.gold+=purse; G.keeper={n:G.dungeon.n,purse,used:{},offers:offerPool('shop',3),view:null,msg:null}; G.phase='keeper'; render(); save(); sfx('shop'); }
function keeperRest(){ const K=G.keeper; const p=G.p; if(!K||K.used.rest) return; if(p.hp>=p.maxHp){ toast('You are already rested'); return; } const c=restCost(); if(p.gold<c){ toast('Not enough gold'); return; } p.gold-=c; const h=heal(p.maxHp); K.used.rest=true; K.msg=`You sleep by the keeper's fire and wake with ${h} HP back.`; sfx('heal'); render(); save(); }
function keeperSmith(){ const K=G.keeper; if(!K||K.used.smith) return; openShop(); }
function keeperBuy(id){ const K=G.keeper; if(!K||K.used.buy||!K.offers.includes(id)) return; const c=cardPrice(id); if(G.p.gold<c){ toast('Not enough gold'); return; } G.p.gold-=c; const res=addCard(id); K.used.buy=true; K.msg=res==='evolved'?`${CARD[id].name} evolves to ${TIERS[curTier(id)]}.`:res==='packed'?`${CARD[id].name} goes into your pack: the deck is full.`:`${CARD[id].name} joins your deck.`; sfx('buy'); render(); save(); }
function keeperRemove(){ const K=G.keeper; if(!K||K.used.remove) return; if(G.p.deck.length<=DECK_MIN){ toast(`Keep at least ${DECK_MIN} cards`); return; } pickDeckCard(`Let a card go · the keeper pays ${removeCost()} gold`,id=>{ if(!kitRemove(id)){ toast('That card is in play as a passive'); render(); return; } removeCard(id); G.p.gold+=removeCost(); K.used.remove=true; K.msg=`${CARD[id].name} stays with the keeper. +${removeCost()} gold.`; sfx('coins'); render(); save(); }); }
function keeperDescend(){ if(!G.keeper) return; G.keeper=null; G.shop=null; genDungeon(G.dungeon.n+1); openDescent(); }
// ---- the kit: hand, piles, passives and Mana live on the run and carry from fight to fight ----
function newKit(){ return {hand:[],draw:[],discard:[],exhaust:[],passives:[],energy:0}; }
function kitInit(){ const K=G.p.kit=newKit(); K.draw=shuffle(G.p.deck.map(id=>({uid:UI.uid++,id}))); kitTopUp(); }
function drawFrom(P,n){ for(let i=0;i<n;i++){ if(P.hand.length>=10) break; if(!P.draw.length){ if(!P.discard.length) break; P.draw=shuffle(P.discard); P.discard=[]; } P.hand.push(P.draw.pop()); } }
function kitTopUp(){ const K=G.p.kit; if(K) drawFrom(K,Math.max(0,PS('handSize')-K.hand.length)); }
function kitAdd(id){ const K=G.p.kit; if(!K) return; const inst={uid:UI.uid++,id}; if(K.hand.length<PS('handSize')) K.hand.push(inst); else K.draw.splice(rnd(0,K.draw.length),0,inst); }   // a new card goes to your hand if there is room, else somewhere in the draw pile
function kitRemove(id){ const K=G.p.kit; if(!K) return false; for(const pile of [K.hand,K.draw,K.discard,K.exhaust]){ const i=pile.findIndex(c=>c.id===id); if(i>=0){ pile.splice(i,1); return true; } } return false; }   // one copy that is not in play
// ---- the pack: one deck of at most DECK_MAX cards travels; the rest waits in the pack, and only the keeper lets you swap ----
const DECK_MAX=20, DECK_MIN=5;
function stashCard(id){ G.p.stash=G.p.stash||[]; if(G.p.deck.length<=DECK_MIN){ toast(`Keep at least ${DECK_MIN} cards in your deck`); return; } if(!kitRemove(id)){ toast('That card is in play as a passive; it stays until the passive is gone'); return; } const di=G.p.deck.indexOf(id); if(di>=0) G.p.deck.splice(di,1); G.p.stash.push(id); sfx('pick'); render(); save(); }
function unstashCard(id){ G.p.stash=G.p.stash||[]; if(G.p.deck.length>=DECK_MAX){ toast(`Your deck holds ${DECK_MAX} cards at most`); return; } const i=G.p.stash.indexOf(id); if(i<0) return; G.p.stash.splice(i,1); G.p.deck.push(id); kitAdd(id); sfx('pick'); render(); save(); }
