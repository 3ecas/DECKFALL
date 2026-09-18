// ---------- MACHINES (free, passive slot) ----------
c('m_piston','Piston Fist','mecha','phys',0,1,'🥊',{},[['passive','piston_fist']]);
c('m_repair','Repair Drone','mecha','holy',0,1,'🛠️',{h:3},[['passive','repair_drone']]);
c('m_aegis','Aegis Core','mecha','earth',0,2,'🛡️',{b:3},[['passive','aegis_core']]);
c('m_shock','Shock Coil','mecha','light',0,2,'🧲',{v:1},[['passive','shock_coil']]);
c('m_flame','Flame Engine','mecha','fire',0,2,'🔥',{v:1},[['passive','flame_engine']]);
c('m_gatling','Gatling Rig','mecha','phys',0,3,'🔫',{v:2},[['passive','gatling_rig']]);
c('m_cryo','Cryo Unit','mecha','ice',0,3,'❄️',{v:1},[['passive','cryo_unit']]);
c('m_reactor','Mana Reactor','mecha','light',0,3,'🔋',{e:1},[['passive','mana_reactor']]);
c('m_turret','Auto Turret','mecha','phys',0,4,'🎯',{v:6},[['passive','auto_turret']]);
c('m_thorn','Thorn Plating','mecha','grass',0,4,'🌵',{t:4},[['passive','thorn_plating']]);
c('m_overclock','Overclock','mecha','fire',0,5,'⚙️',{v:3},[['passive','overclock']]);
c('m_amplifier','Spell Amplifier','mecha','shadow',0,5,'🔮',{v:4},[['passive','spell_amplifier']]);
c('m_loader','Auto-Loader','mecha','phys',0,5,'📦',{d:1},[['passive','auto_loader']]);
c('m_siphon','Siphon Engine','mecha','shadow',0,6,'🩸',{v:25},[['passive','siphon_engine']]);
c('m_colossus','Colossus Frame','mecha','earth',0,7,'🦾',{v:50},[['passive','colossus_frame']]);
c('m_doomsday','Doomsday Device','mecha','shadow',0,8,'☢️',{v:15},[['passive','doomsday_device']]);
// ---------- SUMMONS (cost Mana, passive slot) ----------
c('s_wolf','Wolf Pup','summon','beast',1,1,'🐺',{v:3},[['passive','wolf_pup']]);
c('s_sprite','Healing Sprite','summon','holy',1,1,'🧚',{h:3},[['passive','sprite']]);
c('s_zombie','Zombie','summon','shadow',1,2,'🧟',{v:3,h:2},[['passive','zombie']]);
c('s_spiders','Spider Swarm','summon','poison',1,2,'🕷️',{v:2},[['passive','spider_swarm']]);
c('s_golem','Clay Golem','summon','earth',2,2,'🗿',{b:4},[['passive','clay_golem']]);
c('s_warrior','Warrior','summon','phys',2,3,'🛡️',{v:6},[['passive','warrior']]);
c('s_imp','Imp','summon','fire',1,3,'👹',{v:2},[['passive','imp']]);
c('s_ranger','Ranger','summon','phys',2,3,'🏹',{v:4},[['passive','ranger']]);
c('s_wisp','Mana Wisp','summon','light',1,4,'💠',{e:1},[['passive','mana_wisp']]);
c('s_bear','Bear','summon','beast',2,4,'🐻',{v:8},[['passive','bear']]);
c('s_knight','Knight','summon','holy',2,5,'⚜️',{v:7,b:4},[['passive','knight']]);
c('s_skeletons','Skeleton Horde','summon','shadow',2,5,'💀',{v:3,hits:3},[['passive','skeleton_horde']]);
c('s_ent','Ent','summon','grass',2,6,'🌳',{b:6,t:1},[['passive','ent']]);
c('s_valkyrie','Valkyrie','summon','holy',3,6,'😇',{v:8,h:4},[['passive','valkyrie']]);
c('s_phoenix','Phoenix','summon','fire',3,7,'🐦‍🔥',{v:8,h:5},[['passive','phoenix']]);
c('s_dragon','Dragon','summon','fire',3,8,'🐉',{v:16},[['passive','dragon']]);
// ---------- TRAPS & TRICKS (free) ----------
c('t_spike','Spike Trap','trap','phys',0,1,'🔩',{v:8},[['passive','spike_trap']]);
c('t_sleight','Sleight of Hand','trap','phys',0,1,'🃏',{n:2},[['special','redraw',{n:'n'}]]);
c('t_net','Net Trap','trap','grass',0,2,'🕸️',{w:2},[['passive','net_trap']]);
c('t_sabotage','Sabotage','trap','phys',0,2,'🔧',{},[['special','sabotage']]);
c('t_decoy','Decoy','trap','phys',0,2,'🎭',{},[['passive','decoy']]);
c('t_glue','Glue Trap','trap','poison',0,3,'🫠',{w:2},[['passive','glue_trap']]);
c('t_pilfer','Pilfer','trap','shadow',0,3,'🫳',{},[['special','pilfer']]);
c('t_mimic','Mimic Trick','trap','shadow',0,3,'🎩',{},[['special','mimic']]);
c('t_mirror','Mirror Trap','trap','ice',0,4,'🪞',{},[['passive','mirror_trap']]);
c('t_emp','EMP','trap','light',0,4,'📡',{},[['special','emp']]);
c('t_snare','Snare','trap','ice',0,5,'🪤',{},[['passive','snare']]);
c('t_bear','Bear Trap','trap','phys',0,5,'🦷',{v:20},[['passive','bear_trap']]);
c('t_explosive','Explosive Trap','trap','fire',0,6,'🧨',{v:24},[['passive','explosive_trap']]);
c('t_gambit',"Thief's Gambit",'trap','shadow',0,7,'🎲',{},[['special','pilferAll']]);
c('t_doom','Doom Trap','trap','shadow',0,8,'☠️',{v:45,w:3},[['passive','doom_trap']]);
// ---------- POTIONS ----------
c('mana_potion','Mana Potion','potion','phys',0,0,'🧪',{e:1},[['energy','e']],{exhaust:true});
c('potion_attack','Potion of Attack','potion','fire',0,1,'🧪',{v:3},[['ss','str','v']],{exhaust:true});
c('potion_defense','Potion of Defense','potion','earth',0,1,'🧪',{a:3},[['armor','a']],{exhaust:true});
c('potion_sorcery','Potion of Sorcery','potion','shadow',0,1,'🧪',{v:3},[['ss','spellT','v']],{exhaust:true});
c('healing_potion','Healing Potion','potion','holy',0,1,'🧪',{h:12},[['heal','h']],{exhaust:true});
c('potion_vigor','Potion of Vigor','potion','light',0,2,'🧪',{e:2},[['energy','e']],{exhaust:true});
c('potion_ultimate','Potion of Ultimate Power','potion','holy',0,2,'🧪',{u:50},[['ult','u']],{exhaust:true});
c('elixir','Elixir','potion','water',0,2,'⚗️',{h:8},[['cleanse'],['heal','h']],{exhaust:true});
c('potion_giant','Potion of the Giant','potion','earth',0,4,'🍶',{v:6},[['stat','maxHp','v']],{consume:true});
c('potion_might','Potion of Might','potion','fire',0,4,'🍶',{v:1},[['stat','attack','v']],{consume:true});
c('potion_wisdom','Potion of Wisdom','potion','ice',0,4,'🍶',{v:1},[['stat','spell','v']],{consume:true});
c('potion_fortune','Potion of Fortune','potion','holy',0,4,'🍀',{v:2},[['stat','luck','v']],{consume:true});
c('omnipotion','Omnipotion','potion','holy',0,7,'🏺',{v:1,k:1,h:5},[['stat','attack','v'],['stat','spell','k'],['stat','maxHp','h']],{consume:true});
// ---------- CURSES ----------
c('wound','Wound','curse','shadow',0,0,'🩹',{},[],{unplayable:true});
c('doom','Doom','curse','shadow',0,0,'💀',{},[],{unplayable:true,endTurnDmg:3});
const CARD = Object.fromEntries(CARDS.map(x=>[x.id,x]));

// ===================== ULTIMATES =====================
const ULTS = [
  {id:'bladestorm', name:'Blade Storm', icon:'🌪️', el:'phys', desc:'Deal 8 (+Attack) physical damage 5 times to random enemies.'},
  {id:'dragonbreath', name:"Dragon's Breath", icon:'🐉', el:'fire', desc:'Deal 30 (+Spell Power) fire damage to all enemies and apply 6 Burn.'},
  {id:'timestop', name:'Time Stop', icon:'⏳', el:'ice', desc:'Freeze all enemies, gain 2 Mana and draw 3 cards.'},
  {id:'divine', name:'Divine Restoration', icon:'🕊️', el:'holy', desc:'Heal 40% Max HP, remove your debuffs and gain 20 Block.'},
  {id:'thundergod', name:'Wrath of Storms', icon:'🌩️', el:'light', desc:'Deal 14 (+Spell Power) lightning damage 3 times to all enemies and apply 5 Shock.'},
  {id:'plaguelord', name:'Plague Lord', icon:'☣️', el:'poison', desc:'Apply 15 Poison and 3 Vulnerable to all enemies.'},
  {id:'avalanche', name:'Avalanche', icon:'🏔️', el:'ice', desc:'Deal 34 (+Spell Power) ice damage to all enemies and Freeze them.'},
  {id:'soulreaper', name:'Soul Reaper', icon:'💀', el:'shadow', desc:'Deal 45 (+Attack) shadow damage to one enemy and heal for all of it.'},
  {id:'tidal', name:'Tidal Judgment', icon:'🌊', el:'water', desc:'Deal 26 (+Spell Power) water damage to all enemies, apply 3 Wet and heal 15.'},
  {id:'earthfury', name:"Earth's Fury", icon:'🌋', el:'earth', desc:'Deal 40 (+Attack) earth damage to all enemies and apply 2 Weak.'},
  {id:'gaia', name:"Gaia's Wrath", icon:'🌳', el:'grass', desc:'Deal 30 (+Spell Power) grass damage to all enemies, gain 5 Regen, 4 Thorns and 3 Strength.'},
];
const ULT = Object.fromEntries(ULTS.map(u=>[u.id,u]));
// ===================== SHOP ATTRIBUTE UPGRADES =====================
const UPG = [
  {k:'maxHp', v:10, p:60, d:'More room for mistakes. Also heals 10.'},
  {k:'attack', v:2, p:80, d:'Every attack card, summon and machine hits harder.'},
  {k:'spell', v:2, p:80, d:'Every spell hits harder.'},
  {k:'armor', v:1, p:90, d:'Flat damage reduction on every hit you take.'},
  {k:'dodge', v:3, p:90, max:60, d:'Chance to avoid an attack entirely.'},
  {k:'counter', v:5, p:80, max:100, d:'Chance to strike back when attacked.'},
  {k:'crit', v:4, p:80, max:100, d:'Chance to deal 50% bonus damage.'},
  {k:'lifesteal', v:3, p:100, max:100, d:'Heal a share of every attack you land.'},
  {k:'thorns', v:2, p:70, d:'Attackers take damage when they hit you.'},
  {k:'ultPower', v:15, p:90, d:'Your Ultimate deals and heals more.'},
  {k:'luck', v:2, p:70, max:30, d:'Better odds at the coin and higher-tier cards everywhere.'},
  {k:'regen', v:1, p:110, d:'Heal at the start of every turn.'},
  {k:'slots', v:1, p:300, max:5, d:'One more passive slot for machines, summons and traps.'},
  {k:'energyMax', v:1, p:420, max:6, d:'One more Mana every turn.'},
  {k:'handSize', v:1, p:260, max:8, d:'Draw one more card every turn.'},
];
