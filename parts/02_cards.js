<script>
'use strict';
// ===================== ELEMENTS & TYPE CHART =====================
const EL = {
  phys:  {n:'Physical', i:'⚔️', c:'var(--el-phys)'},
  beast: {n:'Beast',    i:'🐾', c:'var(--el-phys)'},
  fire:  {n:'Fire',     i:'🔥', c:'var(--el-fire)'},
  water: {n:'Water',    i:'💧', c:'var(--el-water)'},
  ice:   {n:'Ice',      i:'❄️', c:'var(--el-ice)'},
  light: {n:'Lightning',i:'⚡', c:'var(--el-light)'},
  poison:{n:'Poison',   i:'☠️', c:'var(--el-poison)'},
  earth: {n:'Earth',    i:'🪨', c:'var(--el-earth)'},
  shadow:{n:'Shadow',   i:'🌑', c:'var(--el-shadow)'},
  holy:  {n:'Holy',     i:'✨', c:'var(--el-holy)'},
};
// Defender element -> what hits it for double (weak) and half (resist) damage.
const TYPE_CHART = {
  phys:  {weak:[],                 resist:[]},
  beast: {weak:['fire','light'],   resist:[]},
  fire:  {weak:['water','earth'],  resist:['fire','ice','poison']},
  water: {weak:['light','poison'], resist:['water','fire','ice']},
  ice:   {weak:['fire','phys'],    resist:['ice','water','poison']},
  light: {weak:['earth','ice'],    resist:['light','water']},
  earth: {weak:['water','ice'],    resist:['light','poison','phys']},
  poison:{weak:['fire','holy'],    resist:['poison','water','shadow']},
  shadow:{weak:['holy','fire'],    resist:['shadow','poison','ice']},
  holy:  {weak:['shadow','poison'],resist:['holy','fire','water']},
};
const ST = {
  burn:  {n:'Burn', i:'🔥', d:'Takes X fire damage at the start of its turn, then the stacks halve.'},
  poison:{n:'Poison', i:'☠️', d:'Takes X poison damage at the start of its turn, then loses 1 stack.'},
  chill: {n:'Chill', i:'❄️', d:'At 3 stacks (5 on bosses) the target is Frozen and skips its next turn.'},
  frozen:{n:'Frozen', i:'🧊', d:'Skips its next turn.'},
  shock: {n:'Shock', i:'⚡', d:'Every hit taken deals +X bonus damage, then loses 1 stack.'},
  wet:   {n:'Wet', i:'💧', d:'Takes 50% more Lightning and Ice damage, 50% less Fire damage. Fades 1 per turn.'},
  weak:  {n:'Weak', i:'🌀', d:'Deals 25% less damage. Fades 1 per turn.'},
  vuln:  {n:'Vulnerable', i:'💔', d:'Takes 50% more damage. Fades 1 per turn.'},
  str:   {n:'Strength', i:'💪', d:'+X damage on every attack this fight.'},
  spellT:{n:'Focus', i:'🔮', d:'+X spell damage this fight.'},
  thornsT:{n:'Thorns', i:'🌵', d:'Attackers take X damage when they hit you.'},
  regen: {n:'Regen', i:'💚', d:'Heal X at the start of your turn.'},
  critT: {n:'Keen', i:'🎯', d:'+X% critical chance this fight.'},
  dodgeNext:{n:'Evasive', i:'💨', d:'Dodges the next attack.'},
  counterNext:{n:'Riposte', i:'🗡️', d:'Counters the next attack that lands.'},
  block: {n:'Block', i:'🛡️', d:'Absorbs damage until your next turn.'},
};
const STATNAMES = {maxHp:'Max HP', attack:'Attack', spell:'Spell Power', armor:'Armor', dodge:'Dodge %', counter:'Counter %', crit:'Crit %', lifesteal:'Life Steal %', thorns:'Thorns', ultPower:'Ultimate Power %', luck:'Luck', energyMax:'Energy', handSize:'Hand Size', regen:'Regen'};
const TYPES = {sword:'Sword', archer:'Archer', shield:'Shield', thorns:'Thorns', potion:'Potion', spell:'Spell', skill:'Skill', blood:'Blood', curse:'Curse'};
const RARITY = {common:{p:45,c:'var(--r-common)'}, uncommon:{p:80,c:'var(--r-uncommon)'}, rare:{p:140,c:'var(--r-rare)'}, legendary:{p:260,c:'var(--r-legendary)'}};

// ===================== CARD LIBRARY =====================
// c(id, name, type, element, cost, rarity, icon, values, per-level gains, effects, options)
// effect grammar: ['dmg',key,{hits,aoe,pierce,ls}] ['block',key] ['armor',key] ['se',status,key,{aoe}] ['ss',status,key]
//   ['heal',key] ['healPct',key] ['draw',key] ['energy',key] ['ult',key] ['selfDmg',key] ['cleanse'] ['stat',stat,key] ['special',name]
const CARDS = [];
function c(id,name,type,el,cost,rarity,icon,n,up,fx,o){ CARDS.push(Object.assign({id,name,type,el,cost,rarity,icon,n:n||{},up:up||{},fx:fx||[]},o||{})); }
// --- Swords ---
c('strike','Strike','sword','phys',1,'common','🗡️',{dmg:6},{dmg:2},[['dmg','dmg']]);
c('heavy_slash','Heavy Slash','sword','phys',2,'common','⚔️',{dmg:13},{dmg:4},[['dmg','dmg']]);
c('double_slash','Double Slash','sword','phys',1,'common','🔪',{dmg:4,hits:2},{dmg:1},[['dmg','dmg',{hits:'hits'}]]);
c('lunge','Lunge','sword','phys',0,'common','🤺',{dmg:4},{dmg:2},[['dmg','dmg']]);
c('cleave','Cleave','sword','phys',1,'common','🪓',{dmg:5},{dmg:2},[['dmg','dmg',{aoe:1}]]);
c('whirlwind','Whirlwind','sword','phys',2,'uncommon','🌪️',{dmg:8},{dmg:3},[['dmg','dmg',{aoe:1}]]);
c('riposte','Riposte','sword','phys',1,'uncommon','🗡️',{dmg:7},{dmg:2},[['dmg','dmg'],['ss','counterNext',null]]);
c('shatter_strike','Shatter Strike','sword','phys',1,'uncommon','💥',{dmg:6,v:2},{dmg:2},[['dmg','dmg'],['se','vuln','v']]);
c('crippling_blow','Crippling Blow','sword','phys',1,'uncommon','🦵',{dmg:6,v:2},{dmg:2},[['dmg','dmg'],['se','weak','v']]);
c('bloodthirst','Bloodthirst','sword','phys',1,'uncommon','🩸',{dmg:7},{dmg:2},[['dmg','dmg',{ls:50}]]);
c('reckless_swing','Reckless Swing','sword','phys',1,'uncommon','😤',{dmg:12,s:3},{dmg:4},[['dmg','dmg'],['selfDmg','s']]);
c('executioner','Executioner','sword','phys',2,'rare','⚰️',{dmg:10},{dmg:3},[['special','execute']]);
c('blade_dance','Blade Dance','sword','phys',3,'rare','💃',{dmg:5,hits:4},{dmg:1},[['dmg','dmg',{hits:'hits'}]]);
c('dragon_slayer','Dragon Slayer','sword','phys',2,'rare','🐲',{dmg:18},{dmg:5},[['dmg','dmg']]);
c('flame_blade','Flame Blade','sword','fire',1,'common','🔥',{dmg:7,v:2},{dmg:2,v:1},[['dmg','dmg'],['se','burn','v']]);
c('frost_blade','Frost Blade','sword','ice',1,'common','❄️',{dmg:7,v:1},{dmg:2},[['dmg','dmg'],['se','chill','v']]);
c('storm_blade','Storm Blade','sword','light',1,'common','⚡',{dmg:7,v:2},{dmg:2,v:1},[['dmg','dmg'],['se','shock','v']]);
c('venom_blade','Venom Blade','sword','poison',1,'common','🐍',{dmg:6,v:3},{dmg:2,v:1},[['dmg','dmg'],['se','poison','v']]);
c('tide_blade','Tide Blade','sword','water',1,'common','🌊',{dmg:7,v:2},{dmg:2},[['dmg','dmg'],['se','wet','v']]);
c('shadow_edge','Shadow Edge','sword','shadow',1,'uncommon','🌑',{dmg:8},{dmg:2},[['dmg','dmg',{ls:30}]]);
c('holy_blade','Holy Blade','sword','holy',1,'uncommon','✨',{dmg:8,h:2},{dmg:2,h:1},[['dmg','dmg'],['heal','h']]);
c('earth_breaker','Earth Breaker','sword','earth',2,'uncommon','🪨',{dmg:12,v:1},{dmg:4},[['dmg','dmg'],['se','weak','v']]);
c('titan_slam','Titan Slam','sword','earth',3,'rare','🏔️',{dmg:24},{dmg:6},[['dmg','dmg']]);
c('sword_of_legends','Sword of Legends','sword','phys',2,'legendary','🌟',{dmg:14,hits:2,d:1},{dmg:3},[['dmg','dmg',{hits:'hits'}],['draw','d']]);
// --- Archer ---
c('arrow','Arrow','archer','phys',1,'common','🏹',{dmg:5},{dmg:2},[['dmg','dmg',{pierce:1}]]);
c('quick_draw','Quick Draw','archer','phys',0,'common','🎯',{dmg:3,d:1},{dmg:1},[['dmg','dmg'],['draw','d']]);
c('volley','Volley','archer','phys',2,'common','🏹',{dmg:3,hits:3},{dmg:1},[['dmg','dmg',{hits:'hits'}]]);
c('piercing_shot','Piercing Shot','archer','phys',1,'uncommon','➶',{dmg:8},{dmg:3},[['dmg','dmg',{pierce:1}]]);
c('marked_shot','Marked Shot','archer','phys',1,'uncommon','🔭',{dmg:4,v:2},{dmg:2},[['dmg','dmg'],['se','vuln','v']]);
c('hunters_mark','Hunter\'s Mark','archer','phys',0,'uncommon','🎯',{v:1},{},[['se','vuln','v'],['se','weak','v']]);
c('rain_of_arrows','Rain of Arrows','archer','phys',2,'uncommon','🌧️',{dmg:6},{dmg:2},[['dmg','dmg',{aoe:1}]]);
c('fire_arrow','Fire Arrow','archer','fire',1,'common','🔥',{dmg:5,v:3},{dmg:2,v:1},[['dmg','dmg'],['se','burn','v']]);
c('ice_arrow','Ice Arrow','archer','ice',1,'common','❄️',{dmg:5,v:2},{dmg:2},[['dmg','dmg'],['se','chill','v']]);
c('lightning_arrow','Lightning Arrow','archer','light',1,'common','⚡',{dmg:5,v:3},{dmg:2,v:1},[['dmg','dmg'],['se','shock','v']]);
c('poison_arrow','Poison Arrow','archer','poison',1,'common','☠️',{dmg:4,v:4},{dmg:1,v:2},[['dmg','dmg'],['se','poison','v']]);
c('water_arrow','Water Arrow','archer','water',1,'common','💧',{dmg:5,v:2},{dmg:2},[['dmg','dmg'],['se','wet','v']]);
c('explosive_arrow','Explosive Arrow','archer','fire',2,'uncommon','🧨',{dmg:9,v:2},{dmg:3,v:1},[['dmg','dmg',{aoe:1}],['se','burn','v',{aoe:1}]]);
c('eagle_eye','Eagle Eye','archer','phys',1,'uncommon','🦅',{v:15,d:1},{v:5},[['ss','critT','v'],['draw','d']]);
c('snipe','Snipe','archer','phys',2,'rare','🔭',{dmg:15},{dmg:4},[['special','snipe']]);
c('barrage','Barrage','archer','phys',3,'rare','🏹',{dmg:4,hits:5},{dmg:1},[['dmg','dmg',{hits:'hits'}]]);
c('arrow_storm','Arrow Storm','archer','phys',3,'legendary','🌠',{dmg:5,hits:6},{dmg:1},[['dmg','dmg',{hits:'hits',pierce:1}]]);
// --- Shields ---
c('block','Block','shield','phys',1,'common','🛡️',{b:6},{b:2},[['block','b']]);
c('deflect','Deflect','shield','phys',0,'common','🛡️',{b:3},{b:1},[['block','b']]);
c('shield_bash','Shield Bash','shield','phys',1,'common','🛡️',{b:5,dmg:5},{b:1,dmg:2},[['block','b'],['dmg','dmg']]);
c('shield_wall','Shield Wall','shield','phys',2,'common','🧱',{b:14},{b:4},[['block','b']]);
c('guard_stance','Guard Stance','shield','phys',1,'uncommon','🧍',{b:5},{b:2},[['block','b'],['ss','counterNext',null]]);
c('fortify','Fortify','shield','phys',1,'uncommon','🏰',{a:2},{a:1},[['armor','a']]);
c('bulwark','Bulwark','shield','phys',2,'uncommon','🏯',{b:8,a:2},{b:2,a:1},[['block','b'],['armor','a']]);
c('iron_skin','Iron Skin','shield','earth',2,'uncommon','🦾',{a:4},{a:1},[['armor','a']]);
c('reflect','Reflect','shield','phys',1,'uncommon','🪞',{b:6,t:3},{b:2,t:1},[['block','b'],['ss','thornsT','t']]);
c('ice_armor','Ice Armor','shield','ice',1,'uncommon','🧊',{b:7,t:1},{b:2,t:1},[['block','b'],['ss','thornsT','t']]);
c('stone_skin','Stone Skin','shield','earth',1,'uncommon','🪨',{b:5,a:1},{b:2},[['block','b'],['armor','a']]);
c('bastion','Bastion','shield','phys',3,'rare','🏰',{b:20},{b:6},[['block','b']]);
c('tower_shield','Tower Shield','shield','phys',2,'rare','🛡️',{b:12},{b:3},[['block','b']],{retain:true});
c('divine_shield','Divine Shield','shield','holy',2,'rare','🕊️',{b:10,h:4},{b:3,h:2},[['block','b'],['heal','h']]);
c('aegis','Aegis','shield','holy',2,'legendary','🌞',{b:15,h:5},{b:4,h:2},[['block','b'],['cleanse'],['heal','h']]);
// --- Thorns ---
c('thorns','Thorns','thorns','phys',1,'common','🌵',{t:3},{t:1},[['ss','thornsT','t']]);
c('spiked_shield','Spiked Shield','thorns','phys',1,'uncommon','🦔',{b:7,t:2},{b:2,t:1},[['block','b'],['ss','thornsT','t']]);
c('bramble_armor','Bramble Armor','thorns','poison',2,'uncommon','🌿',{b:5,t:5},{b:1,t:2},[['block','b'],['ss','thornsT','t']]);
c('iron_maiden','Iron Maiden','thorns','phys',2,'rare','⚙️',{t:8},{t:3},[['ss','thornsT','t']]);
c('retaliation','Retaliation','thorns','phys',1,'rare','💢',{m:2},{m:1},[['special','retaliation']]);
// --- Dodge & counter skills ---
c('dodge_roll','Dodge Roll','skill','phys',1,'common','💨',{d:1},{},[['ss','dodgeNext',null],['draw','d']]);
c('counter_stance','Counter Stance','skill','phys',1,'common','🗡️',{b:3},{b:2},[['ss','counterNext',null],['block','b']]);
c('shadow_step','Shadow Step','skill','shadow',0,'uncommon','👤',{},{},[['ss','dodgeNext',null]],{exhaust:true});
c('parry','Parry','skill','phys',1,'uncommon','🤺',{b:4},{b:2},[['block','b'],['ss','counterNext',null],['special','parry']]);
c('mist_veil','Mist Veil','spell','water',1,'uncommon','🌫️',{b:4},{b:2},[['ss','dodgeNext',null],['block','b']]);
// --- Potions ---
c('potion_attack','Potion of Attack','potion','fire',1,'common','🧪',{v:3},{v:1},[['ss','str','v']],{exhaust:true});
c('potion_defense','Potion of Defense','potion','earth',1,'common','🧪',{v:3},{v:1},[['armor','v']],{exhaust:true});
c('potion_spell','Potion of Sorcery','potion','shadow',1,'common','🧪',{v:3},{v:1},[['ss','spellT','v']],{exhaust:true});
c('potion_healing','Healing Potion','potion','holy',1,'common','🧪',{h:15},{h:5},[['heal','h']],{exhaust:true});
c('potion_energy','Potion of Vigor','potion','light',0,'uncommon','🧪',{e:2},{},[['energy','e']],{exhaust:true});
c('potion_ultimate','Potion of Ultimate Power','potion','holy',1,'uncommon','🧪',{u:50},{u:10},[['ult','u']],{exhaust:true});
c('elixir','Elixir','potion','water',1,'uncommon','⚗️',{h:8},{h:3},[['cleanse'],['heal','h']],{exhaust:true});
c('potion_giant','Potion of the Giant','potion','earth',0,'rare','🍶',{v:6},{},[['stat','maxHp','v']],{consume:true});
c('potion_might','Potion of Might','potion','fire',0,'rare','🍶',{v:1},{},[['stat','attack','v']],{consume:true});
c('potion_wisdom','Potion of Wisdom','potion','ice',0,'rare','🍶',{v:1},{},[['stat','spell','v']],{consume:true});
c('potion_luck','Potion of Fortune','potion','holy',0,'rare','🍀',{v:2},{},[['stat','luck','v']],{consume:true});
// --- Blood / life steal ---
c('drain_blade','Drain Blade','blood','shadow',1,'common','🩸',{dmg:6},{dmg:2},[['dmg','dmg',{ls:100}]]);
c('vampiric_touch','Vampiric Touch','blood','shadow',1,'uncommon','🧛',{dmg:5},{dmg:2},[['dmg','dmg',{aoe:1,ls:50}]]);
c('blood_pact','Blood Pact','blood','shadow',0,'uncommon','🩸',{s:4,v:2},{v:1},[['selfDmg','s'],['ss','str','v']]);
c('life_tap','Life Tap','blood','shadow',0,'uncommon','💉',{s:3,d:2,e:1},{},[['selfDmg','s'],['draw','d'],['energy','e']]);
c('leech','Leech','blood','shadow',2,'uncommon','🪱',{dmg:12},{dmg:4},[['dmg','dmg',{ls:75}]]);
c('soul_harvest','Soul Harvest','blood','shadow',2,'rare','💀',{dmg:9,hits:2},{dmg:3},[['dmg','dmg',{hits:'hits',ls:50}]]);
c('crimson_feast','Crimson Feast','blood','shadow',3,'legendary','🍷',{dmg:10,hits:3},{dmg:3},[['dmg','dmg',{hits:'hits',aoe:1,ls:60}]]);
// --- Fire spells ---
c('fireball','Fireball','spell','fire',1,'common','🔥',{dmg:8},{dmg:3},[['dmg','dmg']]);
c('ignite','Ignite','spell','fire',1,'common','🕯️',{v:5},{v:2},[['se','burn','v']]);
c('flame_wave','Flame Wave','spell','fire',2,'uncommon','🌊',{dmg:7,v:2},{dmg:2,v:1},[['dmg','dmg',{aoe:1}],['se','burn','v',{aoe:1}]]);
c('inferno','Inferno','spell','fire',2,'uncommon','🔥',{dmg:10,v:3},{dmg:3,v:1},[['dmg','dmg',{aoe:1}],['se','burn','v',{aoe:1}]]);
c('meteor','Meteor','spell','fire',3,'rare','☄️',{dmg:25},{dmg:7},[['dmg','dmg']]);
c('phoenix_fire','Phoenix Fire','spell','fire',3,'legendary','🐦‍🔥',{dmg:20,h:10},{dmg:5,h:3},[['dmg','dmg',{aoe:1}],['heal','h']]);
// --- Water spells ---
c('water_jet','Water Jet','spell','water',1,'common','💧',{dmg:7,v:2},{dmg:3},[['dmg','dmg'],['se','wet','v']]);
c('soak','Soak','spell','water',0,'common','🫧',{v:3,d:1},{v:1},[['se','wet','v'],['draw','d']]);
c('healing_spring','Healing Spring','spell','water',1,'common','⛲',{h:8},{h:3},[['heal','h']]);
c('tidal_wave','Tidal Wave','spell','water',2,'uncommon','🌊',{dmg:9,v:2},{dmg:3},[['dmg','dmg',{aoe:1}],['se','wet','v',{aoe:1}]]);
c('riptide','Riptide','spell','water',2,'uncommon','🌀',{dmg:11,v:2},{dmg:4},[['dmg','dmg'],['se','weak','v']]);
c('tsunami','Tsunami','spell','water',3,'rare','🌊',{dmg:22,v:3},{dmg:6},[['dmg','dmg',{aoe:1}],['se','wet','v',{aoe:1}]]);
// --- Ice spells ---
c('frost_bolt','Frost Bolt','spell','ice',1,'common','🧊',{dmg:7,v:1},{dmg:3},[['dmg','dmg'],['se','chill','v']]);
c('glacial_spike','Glacial Spike','spell','ice',2,'uncommon','🗻',{dmg:14,v:2},{dmg:4},[['dmg','dmg'],['se','chill','v']]);
c('blizzard','Blizzard','spell','ice',2,'uncommon','🌨️',{dmg:6,v:2},{dmg:2},[['dmg','dmg',{aoe:1}],['se','chill','v',{aoe:1}]]);
c('freeze','Freeze','spell','ice',2,'rare','🧊',{dmg:4},{dmg:3},[['dmg','dmg'],['se','frozen',null]]);
c('absolute_zero','Absolute Zero','spell','ice',3,'legendary','❄️',{dmg:18},{dmg:5},[['dmg','dmg',{aoe:1}],['se','frozen',null,{aoe:1}]]);
// --- Lightning spells ---
c('spark','Spark','spell','light',0,'common','⚡',{dmg:3,v:2},{dmg:1,v:1},[['dmg','dmg'],['se','shock','v']]);
c('chain_lightning','Chain Lightning','spell','light',2,'uncommon','🔗',{dmg:6,v:2},{dmg:2,v:1},[['dmg','dmg',{aoe:1}],['se','shock','v',{aoe:1}]]);
c('thunderbolt','Thunderbolt','spell','light',2,'uncommon','🌩️',{dmg:12,v:4},{dmg:4,v:1},[['dmg','dmg'],['se','shock','v']]);
c('static_field','Static Field','spell','light',1,'uncommon','🌐',{v:5},{v:2},[['se','shock','v',{aoe:1}]]);
c('overcharge','Overcharge','skill','light',1,'uncommon','🔋',{e:1,u:20},{u:5},[['energy','e'],['ult','u']]);
c('thunderstorm','Thunderstorm','spell','light',3,'rare','⛈️',{dmg:8,hits:3},{dmg:2},[['dmg','dmg',{hits:'hits',aoe:1}]]);
c('storm_call','Storm Call','spell','light',3,'legendary','🌪️',{dmg:15,v:5},{dmg:4,v:2},[['dmg','dmg',{aoe:1}],['se','shock','v',{aoe:1}]]);
// --- Poison spells ---
c('venom_strike','Venom Strike','spell','poison',1,'common','🐍',{dmg:4,v:4},{dmg:1,v:2},[['dmg','dmg'],['se','poison','v']]);
c('toxic_cloud','Toxic Cloud','spell','poison',1,'common','☁️',{v:3},{v:1},[['se','poison','v',{aoe:1}]]);
c('corrosion','Corrosion','spell','poison',1,'uncommon','🧫',{v:2,p:2},{p:1},[['se','vuln','v'],['se','poison','p']]);
c('plague','Plague','spell','poison',2,'rare','🦠',{v:6,w:1},{v:2},[['se','poison','v',{aoe:1}],['se','weak','w',{aoe:1}]]);
c('noxious_burst','Noxious Burst','spell','poison',2,'rare','💥',{m:2},{m:1},[['special','noxious']]);
c('pandemic','Pandemic','spell','poison',2,'legendary','☣️',{},{},[['special','pandemic']]);
// --- Earth spells ---
c('rock_throw','Rock Throw','spell','earth',1,'common','🪨',{dmg:8},{dmg:3},[['dmg','dmg']]);
c('earthquake','Earthquake','spell','earth',2,'uncommon','🌋',{dmg:9,v:1},{dmg:3},[['dmg','dmg',{aoe:1}],['se','weak','v',{aoe:1}]]);
c('boulder','Boulder','spell','earth',2,'uncommon','🪨',{dmg:15},{dmg:5},[['dmg','dmg']]);
c('quake','Quake','spell','earth',3,'rare','🏔️',{dmg:18,v:2},{dmg:5},[['dmg','dmg',{aoe:1}],['se','weak','v',{aoe:1}]]);
c('mountains_wrath','Mountain\'s Wrath','spell','earth',3,'legendary','⛰️',{dmg:30},{dmg:8},[['dmg','dmg']]);
// --- Shadow spells ---
c('shadow_bolt','Shadow Bolt','spell','shadow',1,'common','🌑',{dmg:8},{dmg:3},[['dmg','dmg',{ls:25}]]);
c('curse','Curse','spell','shadow',1,'uncommon','🕯️',{v:2},{v:1},[['se','weak','v'],['se','vuln','v']]);
c('soul_drain','Soul Drain','spell','shadow',2,'uncommon','👻',{dmg:10},{dmg:3},[['dmg','dmg',{ls:100}]]);
c('dark_ritual','Dark Ritual','skill','shadow',1,'uncommon','🔮',{s:5,e:2,d:1},{},[['selfDmg','s'],['energy','e'],['draw','d']]);
c('void_rift','Void Rift','spell','shadow',2,'rare','🌌',{dmg:12,v:1},{dmg:4},[['dmg','dmg',{aoe:1}],['se','vuln','v',{aoe:1}]]);
// --- Holy spells ---
c('smite','Smite','spell','holy',1,'common','✨',{dmg:8},{dmg:3},[['dmg','dmg']]);
c('holy_light','Holy Light','spell','holy',1,'common','🌟',{h:10},{h:4},[['heal','h']]);
c('consecrate','Consecrate','spell','holy',2,'uncommon','🕊️',{dmg:7,h:5},{dmg:2,h:2},[['dmg','dmg',{aoe:1}],['heal','h']]);
c('blessing','Blessing','spell','holy',1,'uncommon','🙏',{v:2,d:1},{v:1},[['ss','regen','v'],['draw','d']]);
c('judgment','Judgment','spell','holy',3,'rare','⚖️',{dmg:22,h:6},{dmg:6,h:2},[['dmg','dmg'],['heal','h']]);
c('resurrection','Resurrection','spell','holy',1,'legendary','🕊️',{h:40},{h:10},[['healPct','h'],['cleanse']],{exhaust:true});
// --- Skills ---
c('focus','Focus','skill','phys',1,'common','🔮',{v:2,d:1},{v:1},[['ss','spellT','v'],['draw','d']]);
c('battle_cry','Battle Cry','skill','phys',1,'common','📣',{v:2},{v:1},[['ss','str','v']]);
c('preparation','Preparation','skill','phys',0,'common','📜',{d:1,b:2},{b:1},[['draw','d'],['block','b']]);
c('insight','Insight','skill','phys',1,'common','👁️',{d:2},{},[['draw','d']]);
c('adrenaline','Adrenaline','skill','phys',0,'uncommon','💉',{e:1,d:1},{},[['energy','e'],['draw','d']],{exhaust:true});
c('meditation','Meditation','skill','holy',1,'uncommon','🧘',{u:25,b:3},{u:5,b:1},[['ult','u'],['block','b']]);
c('rally','Rally','skill','phys',1,'uncommon','🚩',{b:5,u:15},{b:2,u:5},[['block','b'],['ult','u']]);
c('second_wind','Second Wind','skill','phys',1,'uncommon','🌬️',{h:6,e:1},{h:2},[['heal','h'],['energy','e']],{exhaust:true});
c('war_drums','War Drums','skill','phys',2,'rare','🥁',{v:3},{v:1},[['ss','str','v'],['ss','spellT','v']]);
c('tactician','Tactician','skill','phys',1,'rare','🧠',{d:3},{},[['draw','d']]);
c('time_warp','Time Warp','skill','ice',2,'legendary','⏳',{e:3,d:2},{},[['energy','e'],['draw','d']],{exhaust:true});
// --- Curses (gained from pacts) ---
c('wound','Wound','curse','shadow',0,'common','🩹',{},{},[],{unplayable:true});
c('doom','Doom','curse','shadow',0,'common','💀',{s:3},{},[],{unplayable:true,endTurnDmg:3});
const CARD = Object.fromEntries(CARDS.map(x=>[x.id,x]));

// ===================== ULTIMATES =====================
const ULTS = [
  {id:'bladestorm', name:'Blade Storm', icon:'🌪️', el:'phys', desc:'Deal 8 (+Attack) physical damage 5 times to random enemies.'},
  {id:'dragonbreath', name:"Dragon's Breath", icon:'🐉', el:'fire', desc:'Deal 30 (+Spell Power) fire damage to all enemies and apply 6 Burn.'},
  {id:'timestop', name:'Time Stop', icon:'⏳', el:'ice', desc:'Freeze all enemies, gain 2 Energy and draw 3 cards.'},
  {id:'divine', name:'Divine Restoration', icon:'🕊️', el:'holy', desc:'Heal 40% Max HP, remove your debuffs and gain 20 Block.'},
  {id:'thundergod', name:'Wrath of Storms', icon:'🌩️', el:'light', desc:'Deal 14 (+Spell Power) lightning damage 3 times to all enemies and apply 5 Shock.'},
  {id:'plaguelord', name:'Plague Lord', icon:'☣️', el:'poison', desc:'Apply 15 Poison and 3 Vulnerable to all enemies.'},
  {id:'avalanche', name:'Avalanche', icon:'🏔️', el:'ice', desc:'Deal 34 (+Spell Power) ice damage to all enemies and Freeze them.'},
  {id:'soulreaper', name:'Soul Reaper', icon:'💀', el:'shadow', desc:'Deal 45 (+Attack) shadow damage to one enemy and heal for all of it.'},
  {id:'tidal', name:'Tidal Judgment', icon:'🌊', el:'water', desc:'Deal 26 (+Spell Power) water damage to all enemies, apply 3 Wet and heal 15.'},
  {id:'earthfury', name:"Earth's Fury", icon:'🌋', el:'earth', desc:'Deal 40 (+Attack) earth damage to all enemies and apply 2 Weak.'},
];
const ULT = Object.fromEntries(ULTS.map(u=>[u.id,u]));

// ===================== SHOP ATTRIBUTE UPGRADES =====================
const UPG = [
  {k:'maxHp', v:10, p:60, d:'More room for mistakes. Also heals 10.'},
  {k:'attack', v:2, p:80, d:'Every Sword, Archer, Thorns and Blood attack hits harder.'},
  {k:'spell', v:2, p:80, d:'Every Spell hits harder.'},
  {k:'armor', v:1, p:90, d:'Flat damage reduction on every hit you take.'},
  {k:'dodge', v:3, p:90, max:60, d:'Chance to avoid an attack entirely.'},
  {k:'counter', v:5, p:80, max:100, d:'Chance to strike back when attacked.'},
  {k:'crit', v:4, p:80, max:100, d:'Chance to deal 50% bonus damage.'},
  {k:'lifesteal', v:3, p:100, max:100, d:'Heal a share of every attack you land.'},
  {k:'thorns', v:2, p:70, d:'Attackers take damage when they hit you.'},
  {k:'ultPower', v:15, p:90, d:'Your Ultimate deals and heals more.'},
  {k:'luck', v:2, p:70, max:30, d:'Better odds at the tables and rarer cards in chests and shops.'},
  {k:'regen', v:1, p:110, d:'Heal at the start of every turn.'},
  {k:'energyMax', v:1, p:420, max:6, d:'One more card every turn.'},
  {k:'handSize', v:1, p:260, max:8, d:'Draw one more card every turn.'},
];
