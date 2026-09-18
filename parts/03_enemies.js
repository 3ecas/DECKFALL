// ===================== ENEMIES =====================
// e(id, name, icon, element, hp, attack, minStage, pattern, options)
// intents: A(m,hits) attack · D(v) block · B(v) strength · S(status,v) debuff player · AS(m,status,v) attack + debuff · H(pct) heal
const A=(m,hits)=>({t:'atk',m:m||1,hits:hits||1}), D=v=>({t:'def',v}), B=v=>({t:'buff',v}), S=(s,v)=>({t:'debuff',s,v}), AS=(m,s,v)=>({t:'atk',m,hits:1,s,v}), H=p=>({t:'heal',p});
const ENEMIES = [];
function e(id,name,icon,el,hp,atk,min,pat,o){ ENEMIES.push(Object.assign({id,name,icon,el,hp,atk,min,pat},o||{})); }
e('wolf','Wolf','🐺','beast',22,5,1,[A(1),A(1),A(.6,2)]);
e('giant_rat','Giant Rat','🐀','beast',16,4,1,[A(1),S('weak',1),A(1)]);
e('bandit','Bandit','🥷','phys',24,5,1,[A(1),D(5),A(.6,2)]);
e('crab','Rock Crab','🦀','water',28,4,1,[D(6),A(1),A(1.2)]);
e('venom_spider','Venom Spider','🕷️','poison',20,4,1,[AS(.8,'poison',3),A(1),AS(.8,'poison',3)]);
e('fire_imp','Fire Imp','👹','fire',18,5,2,[A(1),AS(.7,'burn',3),A(1)]);
e('water_sprite','Water Sprite','🧚','water',20,5,2,[A(1),H(.15),A(1)]);
e('rock_beetle','Rock Beetle','🪲','earth',30,4,2,[D(6),A(1),A(1)]);
e('slime','Toxic Slime','🟢','poison',26,3,2,[A(1),S('poison',3),A(1)]);
e('vampire_bat','Vampire Bat','🦇','shadow',17,4,2,[A(1),A(1),H(.2)],{ls:true});
e('frost_wisp','Frost Wisp','💠','ice',18,5,3,[AS(.8,'chill',1),A(1),AS(.8,'chill',1)]);
e('storm_hawk','Storm Hawk','🦅','light',20,6,3,[A(1),A(.5,2),AS(.8,'shock',2)]);
e('plague_rat','Plague Rat','🐀','poison',22,4,3,[AS(.8,'poison',4),A(1),A(.5,2)]);
e('bandit_archer','Bandit Archer','🏹','phys',22,6,3,[A(1),S('vuln',1),A(1.2)]);
e('bear','Cave Bear','🐻','beast',38,7,4,[A(1.2),A(1),D(5)]);
e('magma_slime','Magma Slime','🌋','fire',30,4,4,[A(1),D(6),AS(.9,'burn',2)]);
e('shade','Shade','👤','shadow',26,6,4,[A(1),S('weak',2),A(1.2)]);
e('zealot','Zealot','🧎','holy',30,6,5,[A(1),H(.15),A(1.2)]);
e('toxic_ooze','Toxic Ooze','🫠','poison',36,4,5,[AS(.8,'poison',4),D(6),S('weak',2)]);
e('ice_golem','Ice Golem','🗿','ice',44,6,6,[D(8),A(1.3),A(1)]);
e('stone_golem','Stone Golem','🗿','earth',55,6,6,[D(10),A(1.3),S('weak',1)]);
e('flame_knight','Flame Knight','🔥','fire',40,7,8,[A(1),D(8),A(1.3),B(2)]);
e('thunder_elemental','Thunder Elemental','⚡','light',40,7,8,[AS(.9,'shock',3),A(1.2),A(.5,3)]);
e('mercenary','Mercenary','🗡️','phys',44,8,9,[D(8),A(1.3),A(.5,2)]);
e('kraken_spawn','Kraken Spawn','🐙','water',48,7,10,[A(.6,3),D(8),A(1.3)]);
e('dire_wolf','Dire Wolf','🐺','beast',42,8,10,[A(.6,2),A(1.3),A(1)]);
e('basilisk','Basilisk','🦎','poison',46,7,10,[AS(.9,'poison',5),A(1.2),S('vuln',2)]);
e('paladin','Fallen Paladin','⚜️','holy',50,7,11,[D(10),A(1.2),H(.2),A(1)]);
e('necromancer','Necromancer','🧙','shadow',40,7,12,[S('vuln',2),A(1.3),H(.2),A(1)]);
e('yeti','Yeti','🦍','ice',52,8,12,[A(1.2),AS(.9,'chill',1),A(.6,2)]);
e('fire_elemental','Fire Elemental','🔥','fire',45,8,14,[AS(1,'burn',4),A(1.2),A(.5,3)]);
e('storm_mage','Storm Mage','🌩️','light',42,9,15,[S('vuln',2),A(1.3),AS(.9,'shock',3),B(2)]);
e('siren','Siren','🧜',  'water',44,8,16,[S('weak',2),A(1.2),H(.2),A(1)]);
e('wraith','Wraith','👻','shadow',48,9,16,[A(1.2),S('weak',2),A(.6,2)],{ls:true});
e('earth_titan','Earth Titan','🗿','earth',70,9,18,[A(1.2),D(12),A(1.5),S('vuln',2)]);
e('fallen_angel','Fallen Angel','😇','holy',60,9,18,[A(1.3),S('weak',2),H(.15),A(.6,2)]);
e('salamander','Salamander','🦎','fire',55,9,20,[A(1),AS(1,'burn',5),D(10),A(1.4)]);
e('frost_wraith','Frost Wraith','☃️','ice',50,9,20,[AS(.9,'chill',2),S('weak',2),A(1.4)]);
e('hydra','Hydra','🐉','poison',72,9,22,[A(.6,3),AS(1,'poison',6),H(.15),A(1.4)]);
e('chimera','Chimera','🦁','beast',68,10,22,[AS(1,'burn',4),A(1.3),A(.5,3)]);
e('demon','Demon','😈','shadow',70,10,24,[A(1.3),AS(1,'burn',4),B(3),A(1.5)]);
e('mimic','Mimic','🧰','phys',40,7,1,[A(1.2),D(6),A(.5,3)],{special:true});
const ENEMY = Object.fromEntries(ENEMIES.map(x=>[x.id,x]));
const BOSSES = [
  {id:'inferno_drake', name:'Inferno Drake', icon:'🐲', el:'fire', hp:140, atk:9, pat:[AS(1,'burn',5),D(12),A(.6,3),A(1.6)]},
  {id:'lich_king', name:'Lich King', icon:'👑', el:'shadow', hp:150, atk:9, pat:[S('vuln',2),A(1.3),H(.12),AS(1,'poison',5),A(1.5)], ls:true},
  {id:'frost_titan', name:'Frost Titan', icon:'🧊', el:'ice', hp:180, atk:10, pat:[D(15),A(1.4),AS(1,'chill',2),A(.6,3)]},
  {id:'storm_colossus', name:'Storm Colossus', icon:'🌩️', el:'light', hp:170, atk:11, pat:[AS(1,'shock',5),A(.5,4),B(3),A(1.6)]},
  {id:'hydra_matriarch', name:'Hydra Matriarch', icon:'🐉', el:'poison', hp:200, atk:10, pat:[A(.6,3),AS(1,'poison',8),H(.15),S('weak',2),A(1.5)]},
  {id:'leviathan', name:'Leviathan', icon:'🐋', el:'water', hp:210, atk:11, pat:[D(18),A(1.4),S('weak',2),A(.6,4)]},
  {id:'earthshaker', name:'Earthshaker', icon:'🌋', el:'earth', hp:230, atk:12, pat:[D(20),A(1.6),S('vuln',2),A(1.2)]},
  {id:'seraph', name:'Seraph of Judgment', icon:'😇', el:'holy', hp:200, atk:12, pat:[H(.15),A(1.4),S('weak',2),A(.5,4),B(3)]},
  {id:'chaos_beast', name:'Chaos Beast', icon:'👾', el:'beast', hp:220, atk:13, pat:[A(1.5),AS(1,'burn',5),A(.6,3),B(4)]},
];

// ===================== EVENTS, DEALS & PACTS =====================
// Each choice returns a result string, or null when it hands control to another screen (fight, gamble, card picker).
const EVENTS = [
 {id:'blood_altar', icon:'🩸', title:'Blood Altar', text:'A basalt altar hums with hunger. Old carvings promise power to those who bleed on it.', choices:[
   {label:'Offer blood', sub:'Lose 15% Max HP permanently. Gain +3 Attack.', fn:()=>{const l=Math.max(5,Math.round(G.p.maxHp*.15));G.p.maxHp-=l;G.p.hp=Math.min(G.p.hp,G.p.maxHp);G.p.attack+=3;return `The altar drinks deep. -${l} Max HP, +3 Attack.`;}},
   {label:'Offer spirit', sub:'Lose 15% Max HP permanently. Gain +3 Spell Power.', fn:()=>{const l=Math.max(5,Math.round(G.p.maxHp*.15));G.p.maxHp-=l;G.p.hp=Math.min(G.p.hp,G.p.maxHp);G.p.spell+=3;return `The altar drinks deep. -${l} Max HP, +3 Spell Power.`;}},
   {label:'Walk away', sub:'Nothing happens.', fn:()=>'You leave the altar untouched.'}]},
 {id:'alchemist', icon:'⚗️', title:'The Alchemist', text:'"Stats are just fluids in the right vessel," she says, tapping a vial. "I can move them. Some always spills."', choices:[
   {label:'Transmute Attack into Spell Power', sub:'Convert all Attack into Spell Power, losing 1 in the process.', cond:()=>G.p.attack>=2, fn:()=>{const a=G.p.attack;G.p.spell+=a-1;G.p.attack=0;return `${a} Attack became ${a-1} Spell Power.`;}},
   {label:'Transmute Spell Power into Attack', sub:'Convert all Spell Power into Attack, losing 1 in the process.', cond:()=>G.p.spell>=2, fn:()=>{const a=G.p.spell;G.p.attack+=a-1;G.p.spell=0;return `${a} Spell Power became ${a-1} Attack.`;}},
   {label:'Distill vitality', sub:'Lose 20 Max HP. Gain +2 Armor.', cond:()=>G.p.maxHp>40, fn:()=>{G.p.maxHp-=20;G.p.hp=Math.min(G.p.hp,G.p.maxHp);G.p.armor+=2;return 'Your flesh hardens. -20 Max HP, +2 Armor.';}},
   {label:'Decline', sub:'', fn:()=>'She shrugs and packs her vials.'}]},
 {id:'devils_pact', icon:'😈', title:"Devil's Pact", text:'A well-dressed figure with too many teeth offers a contract. The ink is still warm.', choices:[
   {label:'Sign for power', sub:'Gain a Legendary card. A Doom curse joins your deck.', fn:()=>{const id=randomCardId({legendary:100});addCard(id);addCard('doom');return `You gain ${CARD[id].name}. Doom slithers into your deck.`;}},
   {label:'Sign for gold', sub:'Gain gold worth eight fights. A Wound curse joins your deck.', fn:()=>{const g=goldReward()*8;G.p.gold+=g;addCard('wound');return `+${g} gold. A Wound festers in your deck.`;}},
   {label:'Refuse', sub:'', fn:()=>'The figure smiles. "Next time, then."'}]},
 {id:'shrine', icon:'⛩️', title:'Forgotten Shrine', text:'Moss covers a shrine to a god nobody remembers. The offering bowl is empty.', choices:[
   {label:'Pray', sub:'60% chance: heal 30% Max HP. Otherwise nothing.', fn:()=>{if(Math.random()<.6+G.p.luck/100){const h=heal(Math.round(G.p.maxHp*.3));return `Warmth floods you. Healed ${h}.`;}return 'Silence. The god does not answer.';}},
   {label:'Donate 40 gold', sub:'+2 Luck.', cond:()=>G.p.gold>=40, fn:()=>{G.p.gold-=40;G.p.luck+=2;return 'The coins vanish. You feel fortunate. +2 Luck.';}},
   {label:'Donate 90 gold', sub:'+8 Max HP and full heal.', cond:()=>G.p.gold>=90, fn:()=>{G.p.gold-=90;G.p.maxHp+=8;G.p.hp=G.p.maxHp;return 'Blessed. +8 Max HP, fully healed.';}},
   {label:'Leave', sub:'', fn:()=>'You move on.'}]},
 {id:'blacksmith', icon:'⚒️', title:'Traveling Blacksmith', text:'Sparks fly from a portable anvil. "Cards, blades, bones. I sharpen anything."', choices:[
   {label:'Sharpen a card', sub:()=>`Upgrade a card of your choice by 2 levels for ${scaledPrice(50)} gold.`, cond:()=>G.p.gold>=scaledPrice(50), fn:()=>{G.p.gold-=scaledPrice(50);pickDeckCard('Choose a card to sharpen (+2 levels)',id=>{levelCard(id,2);finishEvent(`${CARD[id].name} is now level ${G.p.cardLv[id]}.`);});return null;}},
   {label:'Reforge a card', sub:'Destroy a card of your choice. Receive a random Rare card.', fn:()=>{pickDeckCard('Choose a card to reforge',id=>{removeCard(id);const n=randomCardId({rare:100});addCard(n);finishEvent(`${CARD[id].name} melts down. ${CARD[n].name} is forged.`);});return null;}},
   {label:'Leave', sub:'', fn:()=>'The hammering fades behind you.'}]},
 {id:'merchant', icon:'🧳', title:'Wandering Merchant', text:'A hooded trader spreads a blanket. "Special deal, friend. One-time only."', choices:[
   {label:'Buy the mystery Rare', sub:()=>`A random Rare card for ${scaledPrice(70)} gold (half price).`, cond:()=>G.p.gold>=scaledPrice(70), fn:()=>{G.p.gold-=scaledPrice(70);const id=randomCardId({rare:100});addCard(id);return `You unwrap ${CARD[id].name}.`;}},
   {label:'Buy the potion crate', sub:()=>`Three random potions for ${scaledPrice(60)} gold.`, cond:()=>G.p.gold>=scaledPrice(60), fn:()=>{G.p.gold-=scaledPrice(60);const pots=CARDS.filter(x=>x.type==='potion'&&!x.consume);const got=[];for(let i=0;i<3;i++){const p=pots[Math.floor(Math.random()*pots.length)];addCard(p.id);got.push(p.name);}return `You receive: ${got.join(', ')}.`;}},
   {label:'Haggle', sub:'40% chance he gives you 60 gold to go away. 60% chance he leaves.', fn:()=>{if(Math.random()<.4+G.p.luck/100){G.p.gold+=60;return 'He sighs and pays you to leave. +60 gold.';}return 'He packs up and vanishes into the dark.';}}]},
 {id:'ambush', icon:'🗡️', title:'Ambush!', text:'Steel glints in the shadows. Bandits block both ends of the corridor.', choices:[
   {label:'Fight', sub:'An Elite battle with double gold.', fn:()=>{startFight({elite:true,goldMult:2});return null;}},
   {label:'Pay them off', sub:'Lose 25% of your gold.', cond:()=>G.p.gold>=20, fn:()=>{const l=Math.round(G.p.gold*.25);G.p.gold-=l;return `You toss them ${l} gold. They let you pass.`;}}]},
 {id:'fountain', icon:'⛲', title:'Fountain of Youth', text:'Clear water glows faintly. Coins glitter at the bottom, along with a few bones.', choices:[
   {label:'Drink', sub:'Fully heal, but lose 2 Luck.', fn:()=>{G.p.hp=G.p.maxHp;G.p.luck=Math.max(0,G.p.luck-2);return 'Fully healed. Fortune drains away with the water.';}},
   {label:'Bathe (40 gold)', sub:'+8 Max HP.', cond:()=>G.p.gold>=40, fn:()=>{G.p.gold-=40;G.p.maxHp+=8;G.p.hp+=8;return 'Your skin tingles. +8 Max HP.';}},
   {label:'Fish for coins', sub:'50%: +45 gold. 50%: something bites, lose 10% HP.', fn:()=>{if(Math.random()<.5+G.p.luck/100){G.p.gold+=45;return 'You scoop up 45 gold.';}const d=Math.round(G.p.maxHp*.1);G.p.hp=Math.max(1,G.p.hp-d);return `Something bites! -${d} HP.`;}}]},
 {id:'thorn_pact', icon:'🌵', title:'Pact of Thorns', text:'A bramble spirit wraps a vine around your arm. "Let me grow on you. I will bite whoever bites you."', choices:[
   {label:'Accept', sub:'+4 Thorns and +1 Armor. Lose 5 Dodge.', fn:()=>{G.p.thorns+=4;G.p.armor+=1;G.p.dodge=Math.max(0,G.p.dodge-5);return 'Vines knit into your armor. +4 Thorns, +1 Armor, -5 Dodge.';}},
   {label:'Refuse', sub:'', fn:()=>'The vines retreat.'}]},
 {id:'card_trader', icon:'🃏', title:'Card Trader', text:'A collector examines your deck through a jeweler\'s loupe. "I trade only for quality."', choices:[
   {label:'Trade your strongest card', sub:'Lose your highest-level card. Gain a Legendary card.', cond:()=>G.p.deck.length>5, fn:()=>{let best=G.p.deck[0];for(const id of G.p.deck)if((G.p.cardLv[id]||1)>(G.p.cardLv[best]||1))best=id;removeCard(best);const n=randomCardId({legendary:100});addCard(n);return `${CARD[best].name} leaves. ${CARD[n].name} arrives.`;}},
   {label:'Trade two random cards', sub:'Lose 2 random cards. Gain a Rare card.', cond:()=>G.p.deck.length>6, fn:()=>{const lost=[];for(let i=0;i<2;i++){const id=G.p.deck[Math.floor(Math.random()*G.p.deck.length)];removeCard(id);lost.push(CARD[id].name);}const n=randomCardId({rare:100});addCard(n);return `${lost.join(' and ')} traded for ${CARD[n].name}.`;}},
   {label:'Leave', sub:'', fn:()=>'He tips his hat.'}]},
 {id:'den', icon:'🎲', title:"Gambler's Den", text:'Dice rattle behind a curtain. A one-eyed dealer beckons.', choices:[
   {label:'Sit at the table', sub:'Play the Lucky Coin.', fn:()=>{goto('gamble');return null;}},
   {label:'Leave', sub:'', fn:()=>'You keep your gold in your pocket.'}]},
 {id:'camp', icon:'🏕️', title:'Abandoned Camp', text:'A cold firepit, a torn tent, a pack someone left in a hurry.', choices:[
   {label:'Rest', sub:'Heal 35% Max HP.', fn:()=>{const h=heal(Math.round(G.p.maxHp*.35));return `You sleep without dreams. Healed ${h}.`;}},
   {label:'Search the pack', sub:'65%: a chest. 35%: a trap, lose 12% HP.', fn:()=>{if(Math.random()<.65+G.p.luck/100){goto('chest');return null;}const d=Math.round(G.p.maxHp*.12);G.p.hp=Math.max(1,G.p.hp-d);return `A needle trap! -${d} HP.`;}}]},
 {id:'deck_spirit', icon:'🔮', title:'Spirit of the Deck', text:'Your cards float in the air, rearranging themselves. A voice asks what you wish to become.', choices:[
   {label:'Forget a card', sub:'Remove a card of your choice from your deck.', cond:()=>G.p.deck.length>5, fn:()=>{pickDeckCard('Choose a card to forget',id=>{removeCard(id);finishEvent(`${CARD[id].name} fades from memory.`);});return null;}},
   {label:'Echo a card (60 gold)', sub:'Add a copy of a card of your choice.', cond:()=>G.p.gold>=60, fn:()=>{G.p.gold-=60;pickDeckCard('Choose a card to echo',id=>{G.p.deck.push(id);finishEvent(`A second ${CARD[id].name} appears.`);});return null;}},
   {label:'Leave', sub:'', fn:()=>'The cards settle back into your hand.'}]},
 {id:'oracle', icon:'🔭', title:'The Oracle', text:'An old woman with clouded eyes sees the shape of your ending. "It can be changed."', choices:[
   {label:'Learn a new Ultimate', sub:'Lose 10% Max HP. Choose a new Ultimate.', fn:()=>{const l=Math.max(4,Math.round(G.p.maxHp*.1));G.p.maxHp-=l;G.p.hp=Math.min(G.p.hp,G.p.maxHp);offerUltimates(()=>finishEvent(`-${l} Max HP. Your Ultimate is now ${ULT[G.p.ult].name}.`));return null;}},
   {label:'Ask about the road ahead', sub:'Gain experience.', fn:()=>{const x=xpReward()*2;gainXp(x);return `You see the next hundred deaths. +${x} XP.`;}},
   {label:'Leave', sub:'', fn:()=>'She turns away.'}]},
 {id:'trainer', icon:'🥋', title:'Old Trainer', text:'A scarred veteran sizes you up. "Your stance is terrible. Spar with me."', choices:[
   {label:'Spar', sub:'Lose 10% HP. Gain a lot of experience.', fn:()=>{const d=Math.round(G.p.maxHp*.1);G.p.hp=Math.max(1,G.p.hp-d);const x=xpReward()*3;gainXp(x);return `Bruised but wiser. -${d} HP, +${x} XP.`;}},
   {label:'Watch and learn', sub:'+1 Attack.', fn:()=>{G.p.attack+=1;return 'You copy her footwork. +1 Attack.';}},
   {label:'Leave', sub:'', fn:()=>'She spits and goes back to her drills.'}]},
 {id:'cursed_chest', icon:'📦', title:'Cursed Chest', text:'A chest wrapped in chains. Something whispers from inside, counting gold.', choices:[
   {label:'Break the chains', sub:'Gain gold worth five fights. A Doom curse joins your deck.', fn:()=>{const g=goldReward()*5;G.p.gold+=g;addCard('doom');return `+${g} gold. Doom follows you.`;}},
   {label:'Leave it', sub:'', fn:()=>'The whispering stops when you look away.'}]},
 {id:'lightning_rod', icon:'🗼', title:'Lightning Rod', text:'A copper spire on a hill. Storm clouds gather the moment you approach.', choices:[
   {label:'Grab it', sub:'Lose 12% HP. +5 Dodge.', fn:()=>{const d=Math.round(G.p.maxHp*.12);G.p.hp=Math.max(1,G.p.hp-d);G.p.dodge+=5;return `Your reflexes crackle. -${d} HP, +5 Dodge.`;}},
   {label:'Ground yourself', sub:'Lose 12% HP. +8 Counter.', fn:()=>{const d=Math.round(G.p.maxHp*.12);G.p.hp=Math.max(1,G.p.hp-d);G.p.counter+=8;return `Your nerves snap tight. -${d} HP, +8 Counter.`;}},
   {label:'Leave', sub:'', fn:()=>'Thunder grumbles as you leave.'}]},
 {id:'library', icon:'📚', title:'Lost Library', text:'Shelves of waterlogged grimoires. One book is dry, warm, and open to a page meant for you.', choices:[
   {label:'Read the grimoire', sub:'Learn a random Rare spell.', fn:()=>{const pool=CARDS.filter(x=>x.type==='spell'&&x.rarity==='rare');const s=pool[Math.floor(Math.random()*pool.length)];addCard(s.id);return `You learn ${s.name}.`;}},
   {label:'Study the theory', sub:'+3 Spell Power, -1 Attack.', fn:()=>{G.p.spell+=3;G.p.attack=Math.max(0,G.p.attack-1);return 'Your mind sharpens as your arm softens. +3 Spell Power, -1 Attack.';}},
   {label:'Leave', sub:'', fn:()=>'The book closes itself.'}]},
 {id:'lodge', icon:'🦌', title:"Hunter's Lodge", text:'Trophies line the walls. A hunter cleans a bow that has killed things bigger than you.', choices:[
   {label:'Trade for a bow technique', sub:'Learn a random Rare Archer card.', fn:()=>{const pool=CARDS.filter(x=>x.type==='archer'&&x.rarity==='rare');const s=pool[Math.floor(Math.random()*pool.length)];addCard(s.id);return `You learn ${s.name}.`;}},
   {label:'Practice on the range', sub:'+6 Crit, -1 Armor.', fn:()=>{G.p.crit+=6;G.p.armor=Math.max(0,G.p.armor-1);return 'Your aim improves while your guard slips. +6 Crit, -1 Armor.';}},
   {label:'Leave', sub:'', fn:()=>'The hunter nods once.'}]},
 {id:'mirror', icon:'🪞', title:'Mirror of Exchange', text:'Your reflection moves a half-second late. It holds out a hand, palm up.', choices:[
   {label:'Swap Dodge for Counter', sub:'Turn all Dodge into Counter at 2:3.', cond:()=>G.p.dodge>=3, fn:()=>{const d=G.p.dodge;G.p.counter+=Math.round(d*1.5);G.p.dodge=0;return `${d} Dodge became ${Math.round(d*1.5)} Counter.`;}},
   {label:'Swap Counter for Dodge', sub:'Turn all Counter into Dodge at 3:2.', cond:()=>G.p.counter>=3, fn:()=>{const d=G.p.counter;G.p.dodge+=Math.round(d/1.5);G.p.counter=0;return `${d} Counter became ${Math.round(d/1.5)} Dodge.`;}},
   {label:'Swap Life Steal for Thorns', sub:'Every 3 Life Steal becomes 2 Thorns.', cond:()=>G.p.lifesteal>=3, fn:()=>{const d=G.p.lifesteal;G.p.thorns+=Math.round(d/1.5);G.p.lifesteal=0;return `${d} Life Steal became ${Math.round(d/1.5)} Thorns.`;}},
   {label:'Leave', sub:'', fn:()=>'Your reflection looks disappointed.'}]},
];
