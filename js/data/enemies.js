'use strict';
// ===================== ENEMIES =====================
// e(id, name, icon, element, hp, attack, minRound, pattern, options)
// intents: A(m,hits) attack · D(v) block · B(v) strength · S(status,v) debuff player · AS(m,status,v) attack + debuff · H(pct) heal · X() destroy one of your passives · SU(id) summon
// options: passives:[ids] start with machines/summons in play · thorns · ls (life steal)
const A=(m,hits)=>({t:'atk',m:m||1,hits:hits||1}), D=v=>({t:'def',v}), B=v=>({t:'buff',v}), S=(s,v)=>({t:'debuff',s,v}), AS=(m,s,v)=>({t:'atk',m,hits:1,s,v}), H=p=>({t:'heal',p}), X=()=>({t:'dispel'}), SU=id=>({t:'summon',id});
const ENEMIES = [];
function e(id,name,icon,el,hp,atk,min,pat,o){ ENEMIES.push(Object.assign({id,name,icon,el,hp,atk,min,pat},o||{})); }
e('wolf','Wolf','🐺','beast',22,5,1,[A(1),A(1),A(.6,2)]);
e('giant_rat','Giant Rat','🐀','beast',16,4,1,[A(1),S('weak',1),A(1)]);
e('bandit','Bandit','🥷','phys',24,5,1,[A(1),D(5),A(.6,2)]);
e('crab','Rock Crab','🦀','water',28,4,1,[D(6),A(1),A(1.2)]);
e('sprout_fiend','Sprout Fiend','🌱','grass',20,4,1,[A(1),S('weak',1),A(1)]);
e('venom_spider','Venom Spider','🕷️','poison',20,4,1,[AS(.8,'poison',3),A(1),AS(.8,'poison',3)]);
e('fire_imp','Fire Imp','👹','fire',18,5,2,[A(1),AS(.7,'burn',3),A(1)]);
e('water_sprite','Water Sprite','🧚','water',20,5,2,[A(1),H(.15),A(1)]);
e('rock_beetle','Rock Beetle','🪲','earth',30,4,2,[D(6),A(1),A(1)]);
e('slime','Toxic Slime','🟢','poison',26,3,2,[A(1),S('poison',3),A(1)]);
e('vampire_bat','Vampire Bat','🦇','shadow',17,4,2,[A(1),A(1),H(.2)],{ls:true});
e('frost_wisp','Frost Wisp','💠','ice',18,5,3,[AS(.8,'chill',1),A(1),AS(.8,'chill',1)]);
e('storm_hawk','Storm Hawk','🦅','light',20,6,3,[A(1),A(.5,2),AS(.8,'shock',2)]);
e('mandrake','Mandrake','🥬','grass',26,5,3,[AS(.8,'poison',3),H(.15),A(1)]);
e('plague_rat','Plague Rat','🐀','poison',22,4,3,[AS(.8,'poison',4),A(1),A(.5,2)]);
e('bandit_archer','Bandit Archer','🏹','phys',22,6,3,[A(1),S('vuln',1),A(1.2)]);
e('bear','Cave Bear','🐻','beast',38,7,4,[A(1.2),A(1),D(5)]);
e('magma_slime','Magma Slime','🌋','fire',30,4,4,[A(1),D(6),AS(.9,'burn',2)]);
e('shade','Shade','👤','shadow',26,6,4,[A(1),S('weak',2),A(1.2)]);
e('zealot','Zealot','🧎','holy',30,6,5,[A(1),H(.15),A(1.2)]);
e('toxic_ooze','Toxic Ooze','🫠','poison',36,4,5,[AS(.8,'poison',4),D(6),S('weak',2)]);
e('thorn_beast','Thorn Beast','🦔','grass',36,6,6,[D(6),A(1.2),A(1)],{thorns:2});
e('ice_golem','Ice Golem','🗿','ice',44,6,6,[D(8),A(1.3),A(1)]);
e('stone_golem','Stone Golem','🗿','earth',55,6,6,[D(10),A(1.3),S('weak',1)]);
e('flame_knight','Flame Knight','🔥','fire',40,7,8,[A(1),D(8),A(1.3),B(2)]);
e('thunder_elemental','Thunder Elemental','⚡','light',40,7,8,[AS(.9,'shock',3),A(1.2),A(.5,3)]);
e('mercenary','Mercenary','🗡️','phys',44,8,9,[D(8),A(1.3),A(.5,2)]);
e('kraken_spawn','Kraken Spawn','🐙','water',48,7,10,[A(.6,3),D(8),A(1.3)]);
e('dire_wolf','Dire Wolf','🐺','beast',42,8,10,[A(.6,2),A(1.3),A(1)]);
e('basilisk','Basilisk','🦎','poison',46,7,10,[AS(.9,'poison',5),A(1.2),S('vuln',2)]);
e('paladin','Fallen Paladin','⚜️','holy',50,7,11,[D(10),A(1.2),H(.2),A(1)]);
e('treant','Treant','🌳','grass',60,7,12,[D(10),A(1.3),H(.2),A(1)],{thorns:3,passives:['spider_swarm']});
e('necromancer','Necromancer','🧙','shadow',40,7,12,[S('vuln',2),A(1.3),X(),SU('zombie'),A(1)],{passives:['zombie']});
e('yeti','Yeti','🦍','ice',52,8,12,[A(1.2),AS(.9,'chill',1),A(.6,2)]);
e('fire_elemental','Fire Elemental','🔥','fire',45,8,14,[AS(1,'burn',4),A(1.2),A(.5,3)]);
e('storm_mage','Storm Mage','🌩️','light',42,9,15,[S('vuln',2),A(1.3),X(),AS(.9,'shock',3),B(2)],{passives:['mana_reactor']});
e('siren','Siren','🧜','water',44,8,16,[S('weak',2),A(1.2),X(),H(.2),A(1)]);
e('wraith','Wraith','👻','shadow',48,9,16,[A(1.2),S('weak',2),X(),A(.6,2)],{ls:true});
e('earth_titan','Earth Titan','🗿','earth',70,9,18,[A(1.2),D(12),A(1.5),S('vuln',2)]);
e('fallen_angel','Fallen Angel','😇','holy',60,9,18,[A(1.3),S('weak',2),X(),H(.15),A(.6,2)],{passives:['sprite']});
e('salamander','Salamander','🦎','fire',55,9,20,[A(1),AS(1,'burn',5),D(10),A(1.4)]);
e('frost_wraith','Frost Wraith','☃️','ice',50,9,20,[AS(.9,'chill',2),S('weak',2),A(1.4)]);
e('forest_wyrm','Forest Wyrm','🐉','grass',66,9,20,[A(.6,3),AS(1,'poison',5),H(.15),A(1.4)]);
e('hydra','Hydra','🐉','poison',72,9,22,[A(.6,3),AS(1,'poison',6),H(.15),A(1.4)]);
e('chimera','Chimera','🦁','beast',68,10,22,[AS(1,'burn',4),A(1.3),A(.5,3)]);
e('demon','Demon','😈','shadow',70,10,24,[A(1.3),AS(1,'burn',4),B(3),A(1.5)]);
e('tinkerer','Tinkerer','🧑‍🔧','phys',34,5,5,[D(6),A(1),A(1.2)],{passives:['auto_turret']});
e('beastmaster','Beastmaster','🪓','beast',40,6,7,[A(1),SU('wolf_pup'),A(1.2),D(5)],{passives:['wolf_pup']});
e('warlock','Warlock','🧙‍♂️','shadow',38,6,9,[AS(.9,'burn',3),SU('imp'),A(1.2),X()],{passives:['imp']});
e('golemancer','Golemancer','🧱','earth',52,7,14,[D(8),A(1.3),SU('clay_golem'),A(1)],{passives:['clay_golem']});
e('war_engineer','War Engineer','🤖','light',56,9,19,[A(1.2),X(),A(.6,2),D(10)],{passives:['overclock','repair_drone']});
e('mimic','Mimic','🧰','phys',40,7,1,[A(1.2),D(6),A(.5,3)],{special:true});
const ENEMY = Object.fromEntries(ENEMIES.map(x=>[x.id,x]));
const BOSSES = [
  {id:'inferno_drake', name:'Inferno Drake', icon:'🐲', el:'fire', hp:140, atk:9, pat:[AS(1,'burn',5),D(12),A(.6,3),A(1.6)]},
  {id:'lich_king', name:'Lich King', icon:'👑', el:'shadow', hp:150, atk:9, pat:[S('vuln',2),A(1.3),X(),SU('skeleton_horde'),AS(1,'poison',5),A(1.5)], ls:true, passives:['skeleton_horde']},
  {id:'frost_titan', name:'Frost Titan', icon:'🧊', el:'ice', hp:180, atk:10, pat:[D(15),A(1.4),AS(1,'chill',2),A(.6,3)]},
  {id:'storm_colossus', name:'Storm Colossus', icon:'🌩️', el:'light', hp:170, atk:11, pat:[AS(1,'shock',5),A(.5,4),X(),B(3),A(1.6)], passives:['aegis_core']},
  {id:'elder_treant', name:'Elder Treant', icon:'🌳', el:'grass', hp:190, atk:10, pat:[D(16),A(1.4),H(.15),SU('ent'),AS(1,'poison',6),A(.6,3)], thorns:4, passives:['ent']},
  {id:'hydra_matriarch', name:'Hydra Matriarch', icon:'🐉', el:'poison', hp:200, atk:10, pat:[A(.6,3),AS(1,'poison',8),H(.15),S('weak',2),A(1.5)]},
  {id:'leviathan', name:'Leviathan', icon:'🐋', el:'water', hp:210, atk:11, pat:[D(18),A(1.4),S('weak',2),A(.6,4)]},
  {id:'earthshaker', name:'Earthshaker', icon:'🌋', el:'earth', hp:230, atk:12, pat:[D(20),A(1.6),S('vuln',2),X(),A(1.2)], passives:['clay_golem']},
  {id:'seraph', name:'Seraph of Judgment', icon:'😇', el:'holy', hp:200, atk:12, pat:[H(.15),A(1.4),X(),S('weak',2),A(.5,4),B(3)], passives:['valkyrie']},
  {id:'chaos_beast', name:'Chaos Beast', icon:'👾', el:'beast', hp:220, atk:13, pat:[A(1.5),AS(1,'burn',5),SU('bear'),A(.6,3),B(4)], passives:['bear']},
];
