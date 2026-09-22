'use strict';
// ===================== PASSIVES: machines, summons and armed traps =====================
// A passive card, once played, sits in a slot for the rest of the fight. Numbers come from the card's values (so evolution scales them).
// keys: firstAttackMult, healPerTurn(h), endBlockPerMecha(b), spellStatus/attackStatus (+v), endDmgPerAttack(v), manaPerTurn(e), endDmgRandom(v), thorns(t),
//       atkBonus(v), spellBonus(v), drawPerTurn(d), lifesteal(v), fullMechaMult(v%), endDmgAll(v),
//       summon: sAttack(v) sAll(v) sPierce sHeal(h) sBlock(b) sStatus(s,v) sMana(e) sThorns(t) hits
//       trap: tDmg(v) tNegate tAll(v) tReflect tStatus(s,w) tFreeze
const PASSIVES = {};
function pv(id,name,kind,el,icon,text,o){ PASSIVES[id]=Object.assign({id,name,kind,el,icon,text},o||{}); }
// --- machines ---
pv('piston_fist','Piston Fist','mecha','phys','🥊','Your first attack each turn deals double damage.',{firstAttackMult:2});
pv('repair_drone','Repair Drone','mecha','holy','🛠️','Start of turn: heal {h}.',{healPerTurn:'h'});
pv('aegis_core','Aegis Core','mecha','earth','🛡️','End of turn: gain {b} Block for each machine you control.',{endBlockPerMecha:'b'});
pv('shock_coil','Shock Coil','mecha','light','🧲','Your spells apply {v} Shock to their target.',{spellStatus:'shock',sv:'v'});
pv('flame_engine','Flame Engine','mecha','fire','🔥','Your attacks apply {v} Burn.',{attackStatus:'burn',sv:'v'});
pv('gatling_rig','Gatling Rig','mecha','phys','🔫','End of turn: deal {v} damage for each attack card you played this turn.',{endDmgPerAttack:'v'});
pv('cryo_unit','Cryo Unit','mecha','ice','❄️','Your spells apply {v} Chill.',{spellStatus:'chill',sv:'v'});
pv('mana_reactor','Mana Reactor','mecha','light','🔋','+{e} Mana at the start of each turn.',{manaPerTurn:'e'});
pv('auto_turret','Auto Turret','mecha','phys','🎯','End of turn: deal {v} damage to a random enemy.',{endDmgRandom:'v'});
pv('thorn_plating','Thorn Plating','mecha','grass','🌵','+{t} Thorns while installed.',{thorns:'t'});
pv('overclock','Overclock','mecha','fire','⚙️','Your attacks deal +{v} damage.',{atkBonus:'v'});
pv('spell_amplifier','Spell Amplifier','mecha','shadow','🔮','Your spells deal +{v} damage.',{spellBonus:'v'});
pv('auto_loader','Auto-Loader','mecha','phys','📦','Draw {d} extra card each turn.',{drawPerTurn:'d'});
pv('siphon_engine','Siphon Engine','mecha','shadow','🩸','Your attacks heal you for {v}% of their damage.',{lifesteal:'v'});
pv('colossus_frame','Colossus Frame','mecha','earth','🦾','+{v}% damage while you control 3 machines.',{fullMechaMult:'v'});
pv('doomsday_device','Doomsday Device','mecha','shadow','☢️','End of turn: deal {v} damage to all enemies.',{endDmgAll:'v'});
// --- summons ---
pv('wolf_pup','Wolf Pup','summon','beast','🐺','Each turn: attacks for {v}.',{sAttack:'v'});
pv('sprite','Healing Sprite','summon','holy','🧚','Each turn: heals you {h}.',{sHeal:'h'});
pv('zombie','Zombie','summon','shadow','🧟','Each turn: attacks for {v} and heals you {h}.',{sAttack:'v',sHeal:'h'});
pv('spider_swarm','Spider Swarm','summon','poison','🕷️','Each turn: applies {v} Poison.',{sStatus:'poison',sv:'v'});
pv('clay_golem','Clay Golem','summon','earth','🗿','Each turn: gives you {b} Block.',{sBlock:'b'});
pv('warrior','Warrior','summon','phys','🛡️','Each turn: attacks for {v}.',{sAttack:'v'});
pv('imp','Imp','summon','fire','👹','Each turn: applies {v} Burn.',{sStatus:'burn',sv:'v'});
pv('ranger','Ranger','summon','phys','🏹','Each turn: shoots a random enemy for {v}, ignoring Block.',{sAttack:'v',sPierce:1,sRandom:1});
pv('mana_wisp','Mana Wisp','summon','light','💠','Each turn: +{e} Mana.',{sMana:'e'});
pv('bear','Bear','summon','beast','🐻','Each turn: attacks for {v}.',{sAttack:'v'});
pv('knight','Knight','summon','holy','⚜️','Each turn: attacks for {v} and gives you {b} Block.',{sAttack:'v',sBlock:'b'});
pv('skeleton_horde','Skeleton Horde','summon','shadow','💀','Each turn: attacks for {v}, {hits} times.',{sAttack:'v',hits:'hits'});
pv('ent','Ent','summon','grass','🌳','Each turn: gives you {b} Block and {t} Thorns.',{sBlock:'b',sThorns:'t'});
pv('valkyrie','Valkyrie','summon','holy','😇','Each turn: attacks for {v} and heals you {h}.',{sAttack:'v',sHeal:'h'});
pv('phoenix','Phoenix','summon','fire','🐦‍🔥','Each turn: {v} fire damage to all enemies and heals you {h}.',{sAll:'v',sHeal:'h'});
pv('dragon','Dragon','summon','dragon','🐉','Each turn: {v} dragon damage to all enemies.',{sAll:'v'});
pv('psion','Psion','summon','psychic','🧿','Each turn: hits the target for {v}, ignoring Block.',{sAttack:'v',sPierce:1});
pv('falcon','Falcon','summon','flying','🦅','Each turn: attacks for {v}, twice.',{sAttack:'v',hits:2});
pv('disciple','Disciple','summon','fighting','🥋','Each turn: attacks for {v}, {hits} times.',{sAttack:'v',hits:'hits'});
// --- armed traps (spring on the next enemy attack against you) ---
pv('spike_trap','Spike Trap','trap','phys','🔩','Springs on the next attack: the attacker takes {v} damage.',{tDmg:'v'});
pv('net_trap','Net Trap','trap','grass','🕸️','Springs on the next attack: negates it and applies {w} Weak.',{tNegate:1,tStatus:'weak',sv:'w'});
pv('decoy','Decoy','trap','phys','🎭','Springs on the next attack: negates it.',{tNegate:1});
pv('glue_trap','Glue Trap','trap','poison','🫠','Springs on the next attack: negates it and applies {w} Vulnerable.',{tNegate:1,tStatus:'vuln',sv:'w'});
pv('mirror_trap','Mirror Trap','trap','ice','🪞','Springs on the next attack: negates it and reflects its damage.',{tNegate:1,tReflect:1});
pv('snare','Snare','trap','ice','🪤','Springs on the next attack: negates it and Freezes the attacker.',{tNegate:1,tFreeze:1});
pv('bear_trap','Bear Trap','trap','phys','🦷','Springs on the next attack: negates it and deals {v} damage.',{tNegate:1,tDmg:'v'});
pv('explosive_trap','Explosive Trap','trap','fire','🧨','Springs on the next attack: {v} fire damage to all enemies.',{tAll:'v'});
pv('doom_trap','Doom Trap','trap','shadow','☠️','Springs on the next attack: negates it, deals {v} damage and applies {w} Vulnerable.',{tNegate:1,tDmg:'v',tStatus:'vuln',sv:'w'});
function passiveText(pid,vals){ return PASSIVES[pid].text.replace(/\{(\w+)\}/g,(m,k)=>`<b>${vals&&vals[k]!=null?vals[k]:'?'}</b>`); }
