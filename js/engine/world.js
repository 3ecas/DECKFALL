'use strict';
// ===================== DUNGEONS: hex mazes with fog, an exit to find, danger that rises with every room, the keeper between them =====================
// A dungeon is an odd-r offset grid of pointy-top hexes: rooms (blobs) joined by corridors, everything else wall. G.round mirrors
// the current danger (dungeon number and rooms entered), so every formula that used to read the round still works.
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
};
const DUNGEON_W=24, DUNGEON_H=17, VISION=3, DUNGEON_STEP=2, BOSS_EVERY=3, BOSS_RAMP=5;   // grid, sight in hexes, danger added per dungeon, boss cadence, a boss fights at its dungeon base danger + BOSS_RAMP however deep its room
const TILE_ICON={chest:'📦',shrine:'⛩️',forge:'⚒️',camp:'🔥',trap:'❓',idol:'🗿',boost:'✨',exit:'🚪',entry:'🕳️',event:'❔',lair:'👑'};
const SENSE={beast:2,shadow:2,phys:1,light:1,fire:1,ice:1,water:1,poison:1,holy:1,grass:0,earth:0};   // how far a creature notices you (sight is 3)
// ---- hex math: odd-r offset coordinates, pointy tops. Directions in order E, NE, NW, W, SW, SE ----
const HEX_DIRS=[[[1,0],[0,-1],[-1,-1],[-1,0],[-1,1],[0,1]],[[1,0],[1,-1],[0,-1],[-1,0],[0,1],[1,1]]];
function hexNeighbors(c,r){ return HEX_DIRS[r&1].map(([dc,dr])=>[c+dc,r+dr]); }
function hexCube(c,r){ const x=c-((r-(r&1))>>1); return [x,-x-r,r]; }
function cubeRound(x,y,z){ let rx=Math.round(x),ry=Math.round(y),rz=Math.round(z); const dx=Math.abs(rx-x),dy=Math.abs(ry-y),dz=Math.abs(rz-z); if(dx>dy&&dx>dz) rx=-ry-rz; else if(dy>dz) ry=-rx-rz; else rz=-rx-ry; return [rx,ry,rz]; }
function cubeToOffset(x,y,z){ return [x+((z-(z&1))>>1),z]; }
function hexDist(c1,r1,c2,r2){ const a=hexCube(c1,r1), b=hexCube(c2,r2); return Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[2]-b[2])); }
function hexLine(c1,r1,c2,r2){ const a=hexCube(c1,r1), b=hexCube(c2,r2); const N=hexDist(c1,r1,c2,r2); const out=[]; for(let i=0;i<=N;i++){ const k=N?i/N:0; out.push(cubeToOffset(...cubeRound(a[0]+(b[0]-a[0])*k+1e-6,a[1]+(b[1]-a[1])*k+1e-6,a[2]+(b[2]-a[2])*k-2e-6))); } return out; }
function tileAt(c,r){ const D=G&&G.dungeon; if(!D||c<0||r<0||c>=D.w||r>=D.h) return null; return D.t[r*D.w+c]; }
function hereTile(){ return tileAt(G.pos.x,G.pos.y); }
function themeNow(){ return THEMES[G.dungeon?G.dungeon.theme:'warrens']; }
function dangerNow(){ const D=G.dungeon; return 1+DUNGEON_STEP*(D.n-1)+Math.max(0,D.entered-1); }
function isVisible(c,r){ return hexDist(c,r,G.pos.x,G.pos.y)<=VISION; }
function pickEnemyFor(T,d){ const ok=x=>!x.special&&x.min<=d+1; let pool=ENEMIES.filter(x=>ok(x)&&T.els.includes(x.el)); if(pool.length<2) pool=ENEMIES.filter(x=>ok(x)&&x.min>=d-14); if(!pool.length) pool=ENEMIES.filter(ok); return pick(pool).id; }
function bfsDist(D,c0,r0){ const dist=new Map(); const q=[[c0,r0]]; dist.set(r0*D.w+c0,0); while(q.length){ const [c,r]=q.shift(); const d=dist.get(r*D.w+c); for(const [nc,nr] of hexNeighbors(c,r)){ if(nc<0||nr<0||nc>=D.w||nr>=D.h) continue; const k=nr*D.w+nc; if(D.t[k].wall||dist.has(k)) continue; dist.set(k,d+1); q.push([nc,nr]); } } return dist; }
// ---- generation: room blobs, corridors along a spanning tree, an exit far from the entrance, contents by room ----
function genDungeon(n){
  const w=DUNGEON_W, h=DUNGEON_H; const prev=G.dungeon?G.dungeon.theme:null; const theme=pick(Object.keys(THEMES).filter(k=>k!==prev)); const T=THEMES[theme];
  const t=[]; for(let r=0;r<h;r++) for(let c=0;c<w;c++) t.push({x:c,y:r,wall:1,k:null,seen:0,room:-1});
  const D={w,h,t}; const at=(c,r)=>(c>=0&&r>=0&&c<w&&r<h)?t[r*w+c]:null;
  const rooms=[]; const want=rnd(8,13); let tries=0;
  while(rooms.length<want&&tries++<500){ const c=rnd(2,w-3), r=rnd(2,h-3); const rad=Math.random()<0.4?2:1; if(rooms.some(q=>hexDist(q.c,q.r,c,r)<rad+q.rad+2)) continue; rooms.push({id:rooms.length,c,r,rad,tiles:[]}); }
  for(const R of rooms) for(let r=R.r-R.rad;r<=R.r+R.rad;r++) for(let c=R.c-R.rad-1;c<=R.c+R.rad+1;c++){ const q=at(c,r); if(q&&hexDist(c,r,R.c,R.r)<=R.rad){ q.wall=0; q.room=R.id; R.tiles.push(q); } }
  const carve=(a,b)=>{ let c=a.c,r=a.r,guard=0; while((c!==b.c||r!==b.r)&&guard++<300){ const ns=hexNeighbors(c,r).filter(([x,y])=>at(x,y)); ns.sort((p,q)=>hexDist(p[0],p[1],b.c,b.r)-hexDist(q[0],q[1],b.c,b.r)); [c,r]=ns[0]; const q=at(c,r); if(q.wall){ q.wall=0; q.corr=1; } } };
  const linked=[rooms[0]]; const rest=rooms.slice(1);
  while(rest.length){ let bi=0,bj=0,bd=1e9; rest.forEach((R,i)=>linked.forEach((L,j)=>{ const d=hexDist(R.c,R.r,L.c,L.r); if(d<bd){ bd=d; bi=i; bj=j; } })); carve(linked[bj],rest[bi]); linked.push(rest.splice(bi,1)[0]); }
  for(let i=0;i<2&&rooms.length>3;i++){ const a=pick(rooms), b=pick(rooms); if(a!==b) carve(a,b); }   // a loop or two
  const entry=pick(rooms); const dist=bfsDist(D,entry.c,entry.r); let exitRoom=entry, far=-1; for(const R of rooms){ const d=dist.get(R.r*w+R.c); if(d!=null&&d>far){ far=d; exitRoom=R; } }
  at(entry.c,entry.r).k='entry'; const ex=at(exitRoom.c,exitRoom.r); ex.k='exit'; ex.exit=1;
  const boss=(n%BOSS_EVERY===0)?T.boss:null; if(boss){ ex.k='lair'; ex.boss=boss; ex.s=0; }
  for(const R of rooms){ if(R===entry) continue; const roomDist=dist.get(R.r*w+R.c)||1; const dng=1+DUNGEON_STEP*(n-1)+Math.min(4,Math.ceil(roomDist/5)); /* deeper rooms draw tougher species */ const cells=shuffle(R.tiles.filter(q=>!q.k)); const roll=Math.random();
    const place=(kind,extra)=>{ const q=cells.pop(); if(!q) return null; q.k=kind; Object.assign(q,extra||{}); return q; };
    const creature=elite=>{ const q=place(elite?'nest':'creature'); if(!q) return; q.e=pickEnemyFor(T,dng+(elite?2:0)); q.s=(n===1&&roomDist<=6)?0:(elite?1:(SENSE[ENEMY[q.e].el]||0)); };
    if(R===exitRoom){ if(!boss&&Math.random()<0.6) creature(false); continue; }
    if(roll<0.42){ creature(false); if(Math.random()<0.35) creature(false); if(Math.random()<0.4) place(pick(['chest','chest','boost','shrine'])); }
    else if(roll<0.55){ creature(true); place('chest'); }
    else if(roll<0.75){ place(pick(['chest','shrine','forge','camp','boost','idol','trap'])); if(Math.random()<0.3) creature(false); }
    else if(roll<0.92){ place('event',{ev:pick(Object.keys(EVENTS))}); }
  }
  for(const q of t){ if(q.wall||q.k||!q.corr) continue; const r=Math.random(); if(r<0.05){ q.k='creature'; q.e=pickEnemyFor(T,1+DUNGEON_STEP*(n-1)+2); q.s=1; } else if(r<0.08) q.k='trap'; }   // lurkers in the corridors
  let minX=w,maxX=0,minY=h,maxY=0; for(const q of t){ if(q.wall) continue; if(q.x<minX) minX=q.x; if(q.x>maxX) maxX=q.x; if(q.y<minY) minY=q.y; if(q.y>maxY) maxY=q.y; }   // the board is drawn cropped to the floor, one hex of rock around it
  G.dungeon={n,theme,w,h,t,entered:1,visited:[entry.id],rooms:rooms.length,bounds:{minX:Math.max(0,minX-1),maxX:Math.min(w-1,maxX+1),minY:Math.max(0,minY-1),maxY:Math.min(h-1,maxY+1)}}; G.pos={x:entry.c,y:entry.r}; G.round=dangerNow(); G.depth=Math.max(G.depth||0,n); reveal(); UI.mapKey=(UI.mapKey||0)+1; UI.walk=null;
}
// ---- fog: sight of 3 hexes that does not pass through walls; what you have seen stays on the map ----
function reveal(){ const {x:cx,y:cy}=G.pos; for(const t of G.dungeon.t){ if(hexDist(t.x,t.y,cx,cy)>VISION) continue; const line=hexLine(cx,cy,t.x,t.y); let ok=true; for(let i=1;i<line.length-1;i++){ const q=tileAt(line[i][0],line[i][1]); if(!q||q.wall){ ok=false; break; } } if(ok) t.seen=1; } }
function passable(t){ return !!t&&!t.wall; }
function blocks(t){ return !!t.k&&t.k!=='entry'; }   // anything on a hex stops a walk there; the entrance does not
function hotTiles(){ const hot=new Set(); const D=G.dungeon; for(const t of D.t){ if(!t.seen||(t.k!=='creature'&&t.k!=='nest')||!(t.s>0)) continue; for(const q of D.t){ if(!q.wall&&hexDist(q.x,q.y,t.x,t.y)<=t.s) hot.add(q.y*D.w+q.x); } } return hot; }
// ---- walking: click a known hex, the hero walks step by step through known floor, around anything that would stop it ----
function findPath(from,to,safe){
  const D=G.dungeon; const key=(x,y)=>y*D.w+x; const hot=safe?hotTiles():null; const prev=new Map(); const q=[[from.x,from.y]]; prev.set(key(from.x,from.y),null); let found=false;
  while(q.length){ const [x,y]=q.shift(); if(x===to.x&&y===to.y){ found=true; break; }
    for(const [nx,ny] of hexNeighbors(x,y)){ const t=tileAt(nx,ny); if(!passable(t)||!t.seen) continue; const dest=nx===to.x&&ny===to.y; if(blocks(t)&&!dest) continue; const k=key(nx,ny); if(prev.has(k)) continue; if(hot&&hot.has(k)&&!dest) continue; prev.set(k,key(x,y)); q.push([nx,ny]); } }
  if(!found) return null; const path=[]; let k=key(to.x,to.y); while(k!=null){ path.push({x:k%D.w,y:Math.floor(k/D.w)}); k=prev.get(k); } return path.reverse();
}
function walkTo(x,y){ if(!G||G.phase!=='map'||UI.busy) return; clearTimeout(UI.walkTimer); const t=tileAt(x,y); if(!passable(t)||!t.seen) return; if(x===G.pos.x&&y===G.pos.y){ if(blocks(t)) resolveTile(t); return; } const safe=findPath(G.pos,{x,y},true); const path=safe||findPath(G.pos,{x,y},false); if(!path){ toast('No known way there'); return; } UI.walkKnownHot=hotTiles().has(y*G.dungeon.w+x); UI.walk=path.slice(1); stepWalk(); }
function stepWalk(){ clearTimeout(UI.walkTimer); if(!G||G.phase!=='map'||!UI.walk||!UI.walk.length){ UI.walk=null; save(); return; } const n=UI.walk.shift(); if(!UI.walkKnownHot&&hotTiles().has(n.y*G.dungeon.w+n.x)){ UI.walk=null; toast('Something ahead has you in its sights. You stop.'); save(); return; } const stopped=moveTo(n.x,n.y); if(stopped||!UI.walk||!UI.walk.length){ UI.walk=null; save(); return; } UI.walkTimer=setTimeout(stepWalk,170); }
function moveStep(dir){ if(!G||G.phase!=='map'||UI.busy) return; clearTimeout(UI.walkTimer); UI.walk=null; const [dc,dr]=HEX_DIRS[G.pos.y&1][dir]; const t=tileAt(G.pos.x+dc,G.pos.y+dr); if(!passable(t)) return; moveTo(t.x,t.y); save(); }
// One step: the fog moves, a new room raises the danger, then whatever notices you or waits on the hex takes over. Returns true when the walk must stop.
function moveTo(x,y){
  G.pos={x,y}; G.time=(G.time||0)+1; const D=G.dungeon; const t=tileAt(x,y);
  if(t.room>=0&&!D.visited.includes(t.room)){ D.visited.push(t.room); D.entered++; G.round=dangerNow(); toast(`Room ${D.entered} · danger ${G.round}`); }
  reveal(); render();
  const hunter=detect(); if(hunter){ startCreatureFight(hunter,true); return true; }
  if(blocks(t)){ resolveTile(t); return true; }
  return false;
}
function detect(){ const {x:cx,y:cy}=G.pos; let best=null, bd=9; for(const t of G.dungeon.t){ if(t.k!=='creature'&&t.k!=='nest') continue; const d=hexDist(t.x,t.y,cx,cy); if(d>0&&(t.s||0)>=d&&d<bd){ bd=d; best=t; } } return best; }
function resolveTile(t){
  clearTimeout(UI.walkTimer); UI.walk=null;
  if(t.k==='creature'||t.k==='nest'||t.k==='lair') return startCreatureFight(t,false);
  if(t.k==='exit') return openKeeper();
  if(t.k==='event') return openEvent(t);
  if(t.k==='entry'||!t.k) return;
  const kind=t.k; t.k=null; t.done=true;   // finds are one-time
  openInterlude(kind);
}
function startCreatureFight(t,forced){ const o={tile:{x:t.x,y:t.y},forced:!!forced}; if(t.k==='lair'){ o.boss=true; o.bossId=t.boss; o.dangerBonus=(1+DUNGEON_STEP*(G.dungeon.n-1)+BOSS_RAMP)-G.round; } else { o.enemyId=t.e; if(t.k==='nest') o.elite=true; } startFight(o); }
function clearTile(pos){ const t=pos&&tileAt(pos.x,pos.y); if(!t) return; delete t.e; delete t.s; delete t.boss; t.k=t.exit?'exit':null; t.done=true; }   // a beaten boss leaves the exit open
function backToMap(){ clearTimeout(UI.timer); if(!G) return; G.phase='map'; G.inter=null; G.spoils=null; G.fight=null; G.shop=null; G.keeper=null; if(G.dungeon) G.round=dangerNow(); render(); save(); }
// ---- events: a room with a person or a thing that asks you something ----
const EVENTS={
  gambler:  {icon:'🎲', title:'A hooded gambler', text:'"Twenty gold says the next card I draw beats anything in your deck."', choices:[
    {t:'Take the bet · 20 gold', f(){ if(G.p.gold<20) return 'You cannot cover the bet.'; G.p.gold-=20; if(Math.random()<0.5){ const id=randomCardId('elite'); const res=addCard(id); return `You win: ${CARD[id].name}${res==='packed'?' goes into your pack':res==='evolved'?' evolves':''}.`; } return 'You lose. The gambler smiles and is gone.'; }},
    {t:'Walk on', f(){ return 'You keep your gold.'; }}]},
  altar:    {icon:'🩸', title:'A blood altar', text:'Old blood, older promises. It asks for a little of yours.', choices:[
    {t:'Offer blood · -10% Max HP, +1 Attack for good', f(){ const v=Math.max(1,Math.round(G.p.maxHp*0.1)); G.p.maxHp-=v; G.p.hp=Math.min(G.p.hp,G.p.maxHp); G.p.attack+=1; return `-${v} Max HP, +1 Attack.`; }},
    {t:'Offer blood · -10% Max HP, +1 Spell Power for good', f(){ const v=Math.max(1,Math.round(G.p.maxHp*0.1)); G.p.maxHp-=v; G.p.hp=Math.min(G.p.hp,G.p.maxHp); G.p.spell+=1; return `-${v} Max HP, +1 Spell Power.`; }},
    {t:'Leave it be', f(){ return 'The altar goes quiet.'; }}]},
  wanderer: {icon:'🧑‍🌾', title:'A wounded wanderer', text:'"Share a meal? I know a few tricks worth a story."', choices:[
    {t:'Share a meal · heal 30%', f(){ const h=heal(Math.round(G.p.maxHp*0.3)); return `You eat together. +${h} HP.`; }},
    {t:'Rob them · +gold, -5 Max HP', f(){ const g=goldReward()*2; G.p.gold+=g; G.p.maxHp=Math.max(5,G.p.maxHp-5); G.p.hp=Math.min(G.p.hp,G.p.maxHp); return `+${g} gold. Something in you is smaller now: -5 Max HP.`; }}]},
  well:     {icon:'🪣', title:'A whispering well', text:'Drop a coin, hear a secret.', choices:[
    {t:'Drop 10 gold', f(){ if(G.p.gold<10) return 'No coin to drop.'; G.p.gold-=10; const ex=G.dungeon.t.find(q=>q.exit); if(ex) ex.seen=1; return 'The well shows you the way out.'; }},
    {t:'Leave', f(){ return 'Silence.'; }}]},
};
function openEvent(t){ clearTimeout(UI.walkTimer); UI.walk=null; const ev=t.ev||pick(Object.keys(EVENTS)); t.k=null; t.done=true; G.inter={t:'event',ev,lines:[],cards:null,picked:false,boost:null,auto:false}; G.phase='interlude'; render(); save(); sfx('shrine'); }
function eventChoose(i){ const I=G.inter; if(!I||I.t!=='event'||I.picked) return; const ch=EVENTS[I.ev].choices[i]; if(!ch) return; const msg=ch.f(); I.picked=true; I.lines.push(msg); sfx('pick'); render(); save(); UI.timer=setTimeout(backToMap,2000); }
// ---- the keeper: between dungeons, one visit, each service once ----
function restCost(){ return 10+G.round*3; }
function removeCost(){ return 20+G.round*4; }
function cardPrice(id){ return Math.round(TIER[CARD[id].tier].price*0.6*(1+0.03*G.round)); }
function openKeeper(){ clearTimeout(UI.walkTimer); UI.walk=null; const purse=goldReward()*2; G.p.gold+=purse; G.keeper={n:G.dungeon.n,purse,used:{},offers:offerPool('shop',3),view:null,msg:null}; G.phase='keeper'; render(); save(); sfx('shop'); }
function keeperRest(){ const K=G.keeper; const p=G.p; if(!K||K.used.rest) return; if(p.hp>=p.maxHp){ toast('You are already rested'); return; } const c=restCost(); if(p.gold<c){ toast('Not enough gold'); return; } p.gold-=c; const h=heal(p.maxHp); K.used.rest=true; K.msg=`You sleep by the keeper's fire and wake with ${h} HP back.`; sfx('heal'); render(); save(); }
function keeperSmith(){ const K=G.keeper; if(!K||K.used.smith) return; openShop(); }
function keeperBuy(id){ const K=G.keeper; if(!K||K.used.buy||!K.offers.includes(id)) return; const c=cardPrice(id); if(G.p.gold<c){ toast('Not enough gold'); return; } G.p.gold-=c; const res=addCard(id); K.used.buy=true; K.msg=res==='evolved'?`${CARD[id].name} evolves to ${TIERS[curTier(id)]}.`:res==='packed'?`${CARD[id].name} goes into your pack: the deck is full.`:`${CARD[id].name} joins your deck.`; sfx('buy'); render(); save(); }
function keeperRemove(){ const K=G.keeper; if(!K||K.used.remove) return; if(G.p.deck.length<=DECK_MIN){ toast(`Keep at least ${DECK_MIN} cards`); return; } pickDeckCard(`Let a card go · the keeper pays ${removeCost()} gold`,id=>{ if(!kitRemove(id)){ toast('That card is in play as a passive'); render(); return; } removeCard(id); G.p.gold+=removeCost(); K.used.remove=true; K.msg=`${CARD[id].name} stays with the keeper. +${removeCost()} gold.`; sfx('coins'); render(); save(); }); }
function keeperDescend(){ if(!G.keeper) return; G.keeper=null; G.shop=null; genDungeon(G.dungeon.n+1); G.phase='map'; render(); save(); sfx('start'); }
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
