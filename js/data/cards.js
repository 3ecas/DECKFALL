'use strict';
// ===================== CARD LIBRARY =====================
// c(id, name, type, element, cost, tier 0-8, icon, values, effects, options)
// types: attack (free, +Attack) spell (Mana, +Spell Power) shield skill potion (free) mecha trap (free, passive slot) summon (Mana, passive slot) curse
// effects: ['dmg',key,{hits,aoe,pierce,ls,bv:status}] ['block',key] ['armor',key] ['se',status,key,{aoe}] ['ss',status,key] ['heal',key] ['healPct',key]
//   ['draw',key] ['energy',key] ['maxEnergy',key] ['ult',key] ['selfDmg',key] ['cleanse'] ['stat',stat,key] ['passive',id]
//   ['special',name,{...}]  execute{pct} stDmg{s,m,consume,aoe} doubleSt{s,aoe} spread blockDmg{m} playedDmg{m} elBoost{el,v} retaliation{m} snipe parry redraw{n} sabotage emp pilfer pilferAll mimic
// Basic tier cards do exactly one plain thing. Extras start at common.
const CARDS = [];
function c(id,name,type,el,cost,tier,icon,n,fx,o){ CARDS.push(Object.assign({id,name,type,el,cost,tier:TIERS[tier],icon,n:n||{},fx:fx||[]},o||{})); }
// ---------- FIRE: burn, amplify, detonate ----------
c('ember','Ember','spell','fire',1,0,'🔥',{dmg:3},[['dmg','dmg']]);
c('kindle','Kindle','spell','fire',0,0,'🕯️',{v:2},[['se','burn','v']]);
c('torch_swing','Torch Swing','attack','fire',0,0,'🔥',{dmg:4},[['dmg','dmg']]);
c('fireball','Fireball','spell','fire',1,1,'☄️',{dmg:6},[['dmg','dmg']]);
c('fire_arrow','Fire Arrow','attack','fire',0,1,'🏹',{dmg:4,v:2},[['dmg','dmg'],['se','burn','v']]);
c('flame_ward','Flame Ward','shield','fire',0,1,'🛡️',{b:5,v:2},[['block','b'],['se','burn','v']]);
c('flame_blade','Flame Blade','attack','fire',0,2,'🗡️',{dmg:6,v:3},[['dmg','dmg'],['se','burn','v']]);
c('scorch','Scorch','spell','fire',1,2,'♨️',{dmg:5},[['dmg','dmg',{bv:'burn'}]]);
c('ember_rush','Ember Rush','skill','fire',0,2,'💫',{e:1,v:2},[['energy','e'],['se','burn','v']]);
c('flame_wave','Flame Wave','spell','fire',2,3,'🌊',{dmg:6,v:2},[['dmg','dmg',{aoe:1}],['se','burn','v',{aoe:1}]]);
c('detonate','Detonate','spell','fire',1,3,'💥',{m:2},[['special','stDmg',{s:'burn',m:'m',consume:1}]]);
c('pyromancy','Pyromancy','skill','fire',0,3,'🔮',{v:25},[['special','elBoost',{el:'fire',v:'v'}]]);
c('inferno','Inferno','spell','fire',2,4,'🔥',{dmg:9,v:3},[['dmg','dmg',{aoe:1}],['se','burn','v',{aoe:1}]]);
c('searing_strike','Searing Strike','attack','fire',0,4,'⚔️',{dmg:10},[['dmg','dmg',{bv:'burn'}]]);
c('meteor','Meteor','spell','fire',3,5,'☄️',{dmg:24},[['dmg','dmg']]);
c('wildfire','Wildfire','spell','fire',2,5,'🌋',{v:2},[['special','spread'],['se','burn','v',{aoe:1}]]);
c('phoenix_fire','Phoenix Fire','spell','fire',3,6,'🐦‍🔥',{dmg:18,h:10},[['dmg','dmg',{aoe:1}],['heal','h']]);
c('immolation','Immolation','spell','fire',2,6,'🕯️',{v:8,s:3},[['se','burn','v',{aoe:1}],['selfDmg','s']]);
c('sun_flare','Sun Flare','spell','fire',3,7,'☀️',{dmg:28,v:4,k:1},[['dmg','dmg',{aoe:1}],['se','burn','v',{aoe:1}],['se','vuln','k',{aoe:1}]]);
c('dragonfire','Dragonfire','spell','fire',3,8,'🐉',{dmg:18,hits:2,v:5},[['dmg','dmg',{hits:'hits',aoe:1}],['se','burn','v',{aoe:1}]]);
// ---------- WATER: wet, heal, flow ----------
c('splash','Splash','spell','water',1,0,'💧',{dmg:3},[['dmg','dmg']]);
c('soothing_mist','Soothing Mist','spell','water',1,0,'🌫️',{h:4},[['heal','h']]);
c('bubble','Bubble','shield','water',0,0,'🫧',{b:3},[['block','b']]);
c('water_jet','Water Jet','spell','water',1,1,'💦',{dmg:6,v:2},[['dmg','dmg'],['se','wet','v']]);
c('mana_spring','Mana Spring','skill','water',0,1,'⛲',{e:2},[['energy','e']]);
c('water_arrow','Water Arrow','attack','water',0,1,'🏹',{dmg:4,v:2},[['dmg','dmg'],['se','wet','v']]);
c('undertow','Undertow','spell','water',1,2,'🌀',{dmg:5},[['dmg','dmg',{bv:'wet'}]]);
c('tide_blade','Tide Blade','attack','water',0,2,'🗡️',{dmg:6,v:2},[['dmg','dmg'],['se','wet','v']]);
c('soak','Soak','spell','water',0,2,'🫗',{v:3},[['se','wet','v',{aoe:1}]]);
c('riptide','Riptide','spell','water',2,3,'🌊',{dmg:10,v:2},[['dmg','dmg'],['se','weak','v']]);
c('cleansing_rain','Cleansing Rain','spell','water',1,3,'🌧️',{h:6},[['cleanse'],['heal','h']]);
c('flow','Flow','skill','water',0,3,'〰️',{d:2},[['draw','d']]);
c('tidal_wave','Tidal Wave','spell','water',2,4,'🌊',{dmg:8,v:2},[['dmg','dmg',{aoe:1}],['se','wet','v',{aoe:1}]]);
c('mist_veil','Mist Veil','spell','water',1,4,'🌁',{b:5},[['ss','dodgeNext',null],['block','b']]);
c('whirlpool','Whirlpool','spell','water',2,5,'🌀',{dmg:8},[['dmg','dmg',{aoe:1,bv:'wet'}]]);
c('fountain_of_life','Fountain of Life','spell','water',2,5,'⛲',{r:3,h:8},[['ss','regen','r'],['heal','h']]);
c('tsunami','Tsunami','spell','water',3,6,'🌊',{dmg:20,v:3},[['dmg','dmg',{aoe:1}],['se','wet','v',{aoe:1}]]);
c('oceans_grace',"Ocean's Grace",'spell','water',2,6,'🐚',{h:14,b:10},[['heal','h'],['block','b']]);
c('maelstrom','Maelstrom','spell','water',3,7,'🌪️',{v:2,dmg:12,hits:2},[['se','wet','v',{aoe:1}],['dmg','dmg',{hits:'hits',aoe:1,bv:'wet'}]]);
c('leviathans_call',"Leviathan's Call",'spell','water',3,8,'🐋',{dmg:32,v:2,h:20},[['dmg','dmg',{aoe:1}],['se','weak','v',{aoe:1}],['heal','h']]);
// ---------- ICE: chill, freeze, shatter ----------
c('frost_shard','Frost Shard','spell','ice',1,0,'❄️',{dmg:3},[['dmg','dmg']]);
c('cold_snap','Cold Snap','spell','ice',0,0,'🌬️',{v:1},[['se','chill','v']]);
c('ice_wall','Ice Wall','shield','ice',0,0,'🧱',{b:4},[['block','b']]);
c('frost_bolt','Frost Bolt','spell','ice',1,1,'🧊',{dmg:6,v:1},[['dmg','dmg'],['se','chill','v']]);
c('ice_arrow','Ice Arrow','attack','ice',0,1,'🏹',{dmg:4,v:2},[['dmg','dmg'],['se','chill','v']]);
c('frost_blade','Frost Blade','attack','ice',0,1,'🗡️',{dmg:6,v:1},[['dmg','dmg'],['se','chill','v']]);
c('shatter','Shatter','spell','ice',1,2,'💎',{dmg:5},[['dmg','dmg',{bv:'frozen'}]]);
c('frostbite','Frostbite','spell','ice',1,2,'🥶',{v:2,k:1},[['se','chill','v'],['se','vuln','k']]);
c('ice_armor','Ice Armor','shield','ice',0,2,'🛡️',{b:6,t:1},[['block','b'],['ss','thornsT','t']]);
c('glacial_spike','Glacial Spike','spell','ice',2,3,'🗻',{dmg:13,v:2},[['dmg','dmg'],['se','chill','v']]);
c('blizzard','Blizzard','spell','ice',2,3,'🌨️',{dmg:5,v:2},[['dmg','dmg',{aoe:1}],['se','chill','v',{aoe:1}]]);
c('cold_focus','Cold Focus','skill','ice',0,3,'🔷',{e:2,v:1},[['energy','e'],['se','chill','v',{aoe:1}]]);
c('deep_freeze','Deep Freeze','spell','ice',2,4,'🧊',{dmg:4},[['dmg','dmg'],['se','frozen',null]]);
c('icicle_barrage','Icicle Barrage','spell','ice',2,4,'🔱',{dmg:4,hits:3},[['dmg','dmg',{hits:'hits'}]]);
c('avalanche','Avalanche','spell','ice',3,5,'🏔️',{dmg:16},[['dmg','dmg',{aoe:1,bv:'frozen'}]]);
c('permafrost','Permafrost','skill','ice',0,5,'🔮',{v:25,b:4},[['special','elBoost',{el:'ice',v:'v'}],['block','b']]);
c('absolute_zero','Absolute Zero','spell','ice',3,6,'❄️',{dmg:16},[['dmg','dmg',{aoe:1}],['se','frozen',null,{aoe:1}]]);
c('frozen_heart','Frozen Heart','shield','ice',0,6,'💙',{b:12},[['block','b']],{retain:true});
c('winters_grasp',"Winter's Grasp",'spell','ice',2,7,'🫳',{d:2},[['se','frozen',null,{aoe:1}],['draw','d']]);
c('eternal_winter','Eternal Winter','spell','ice',3,8,'☃️',{dmg:22,k:2},[['dmg','dmg',{aoe:1}],['se','frozen',null,{aoe:1}],['se','vuln','k',{aoe:1}]]);
// ---------- LIGHTNING: shock, multi-hit, mana ----------
c('spark','Spark','spell','light',0,0,'⚡',{dmg:2},[['dmg','dmg']]);
c('jolt','Jolt','spell','light',1,0,'🔌',{dmg:4},[['dmg','dmg']]);
c('static','Static','spell','light',1,0,'🌐',{v:3},[['se','shock','v']]);
c('lightning_arrow','Lightning Arrow','attack','light',0,1,'🏹',{dmg:4,v:3},[['dmg','dmg'],['se','shock','v']]);
c('storm_blade','Storm Blade','attack','light',0,1,'🗡️',{dmg:6,v:2},[['dmg','dmg'],['se','shock','v']]);
c('charge','Charge','skill','light',0,1,'🔋',{e:1,u:15},[['energy','e'],['ult','u']]);
c('chain_lightning','Chain Lightning','spell','light',2,2,'🔗',{dmg:5,v:2},[['dmg','dmg',{aoe:1}],['se','shock','v',{aoe:1}]]);
c('conduct','Conduct','spell','light',1,2,'🧲',{m:3},[['special','stDmg',{s:'shock',m:'m'}]]);
c('flicker','Flicker','spell','light',0,2,'✨',{dmg:2,hits:2},[['dmg','dmg',{hits:'hits'}]]);
c('thunderbolt','Thunderbolt','spell','light',2,3,'🌩️',{dmg:11,v:4},[['dmg','dmg'],['se','shock','v']]);
c('static_field','Static Field','spell','light',1,3,'🌐',{v:5},[['se','shock','v',{aoe:1}]]);
c('overcharge','Overcharge','skill','light',0,3,'🔋',{e:2},[['energy','e']],{exhaust:true});
c('volt_barrage','Volt Barrage','spell','light',2,4,'⚡',{dmg:3,hits:5},[['dmg','dmg',{hits:'hits'}]]);
c('storm_surge','Storm Surge','spell','light',2,4,'🌊',{m:4},[['special','playedDmg',{m:'m'}]]);
c('thunderstorm','Thunderstorm','spell','light',3,5,'⛈️',{dmg:7,hits:3},[['dmg','dmg',{hits:'hits',aoe:1}]]);
c('galvanize','Galvanize','skill','light',0,5,'🔮',{v:25,d:1},[['special','elBoost',{el:'light',v:'v'}],['draw','d']]);
c('storm_call','Storm Call','spell','light',3,6,'🌪️',{dmg:14,v:5},[['dmg','dmg',{aoe:1}],['se','shock','v',{aoe:1}]]);
c('arcane_battery','Arcane Battery','skill','light',0,6,'🔋',{e:1},[['maxEnergy','e']],{exhaust:true});
c('ride_the_lightning','Ride the Lightning','spell','light',2,7,'🏇',{dmg:9,hits:3,e:1},[['dmg','dmg',{hits:'hits'}],['energy','e']]);
c('thunder_god','Thunder God','spell','light',3,8,'🌩️',{dmg:11,hits:4,v:6},[['dmg','dmg',{hits:'hits',aoe:1}],['se','shock','v',{aoe:1}]]);
// ---------- GRASS: regen, thorns, growth ----------
c('herbal_salve','Herbal Salve','spell','grass',1,0,'🌿',{h:4},[['heal','h']]);
c('vine_lash','Vine Lash','spell','grass',1,0,'🌱',{dmg:3},[['dmg','dmg']]);
c('leaf_guard','Leaf Guard','shield','grass',0,0,'🍃',{b:4},[['block','b']]);
c('thorns','Thorns','skill','grass',0,1,'🌵',{t:3},[['ss','thornsT','t']]);
c('seed','Seed','spell','grass',0,1,'🌰',{r:2},[['ss','regen','r']]);
c('sprout_strike','Sprout Strike','attack','grass',0,1,'🌱',{dmg:4,v:1},[['dmg','dmg'],['ss','str','v']]);
c('leech_seed','Leech Seed','spell','grass',1,2,'🫘',{v:3,h:3},[['se','poison','v'],['heal','h']]);
c('bramble_coat','Bramble Coat','shield','grass',0,2,'🌿',{b:5,t:4},[['block','b'],['ss','thornsT','t']]);
c('photosynthesis','Photosynthesis','skill','grass',0,2,'☀️',{e:1,h:5},[['energy','e'],['heal','h']]);
c('overgrowth','Overgrowth','shield','grass',0,3,'🌳',{b:9,r:2},[['block','b'],['ss','regen','r']]);
c('entangle','Entangle','spell','grass',1,3,'🪢',{v:2,k:1},[['se','weak','v'],['se','vuln','k']]);
c('root_strike','Root Strike','spell','grass',2,3,'🌲',{dmg:10},[['dmg','dmg',{ls:50}]]);
c('natures_wrath',"Nature's Wrath",'spell','grass',2,4,'🍂',{dmg:8,v:1},[['dmg','dmg',{aoe:1}],['se','weak','v',{aoe:1}]]);
c('wild_growth','Wild Growth','skill','grass',0,4,'🌻',{v:3,r:2},[['ss','str','v'],['ss','regen','r']]);
c('forest_guardian','Forest Guardian','shield','grass',0,5,'🦌',{b:14,t:6},[['block','b'],['ss','thornsT','t']],{retain:true});
c('sap_flow','Sap Flow','skill','grass',0,5,'🍯',{e:1,r:1},[['maxEnergy','e'],['ss','regen','r']],{exhaust:true});
c('world_tree','World Tree','spell','grass',3,6,'🌳',{h:18,r:4,b:10},[['heal','h'],['ss','regen','r'],['block','b']]);
c('bloom','Bloom','spell','grass',2,6,'🌸',{dmg:15},[['dmg','dmg',{ls:50}]]);
c('gaias_embrace',"Gaia's Embrace",'skill','grass',0,7,'🌍',{v:4,r:4,t:4},[['ss','str','v'],['ss','regen','r'],['ss','thornsT','t']]);
c('verdant_apocalypse','Verdant Apocalypse','spell','grass',3,8,'🌋',{dmg:28,v:2,h:15},[['dmg','dmg',{aoe:1}],['se','weak','v',{aoe:1}],['heal','h']]);
// ---------- POISON: stacking, doubling, bursting ----------
c('venom_dart','Venom Dart','spell','poison',1,0,'🎯',{dmg:3},[['dmg','dmg']]);
c('toxic_spit','Toxic Spit','spell','poison',0,0,'🤢',{v:2},[['se','poison','v']]);
c('poison_arrow','Poison Arrow','attack','poison',0,0,'🏹',{dmg:4},[['dmg','dmg']]);
c('venom_blade','Venom Blade','attack','poison',0,1,'🗡️',{dmg:5,v:3},[['dmg','dmg'],['se','poison','v']]);
c('toxic_cloud','Toxic Cloud','spell','poison',1,1,'☁️',{v:3},[['se','poison','v',{aoe:1}]]);
c('corrosion','Corrosion','spell','poison',1,1,'🧫',{v:2,k:2},[['se','vuln','v'],['se','poison','k']]);
c('virulence','Virulence','spell','poison',1,2,'🧬',{},[['special','doubleSt',{s:'poison'}]]);
c('noxious_strike','Noxious Strike','attack','poison',0,2,'⚔️',{dmg:5},[['dmg','dmg',{bv:'poison'}]]);
c('adrenal_venom','Adrenal Venom','skill','poison',0,2,'💉',{e:1,v:2},[['energy','e'],['se','poison','v']]);
c('plague','Plague','spell','poison',2,3,'🦠',{v:6,w:1},[['se','poison','v',{aoe:1}],['se','weak','w',{aoe:1}]]);
c('toxic_burst','Toxic Burst','spell','poison',2,3,'💥',{m:2},[['special','stDmg',{s:'poison',m:'m'}]]);
c('venomous_coat','Venomous Coat','shield','poison',0,3,'🧥',{b:4,t:3},[['block','b'],['ss','thornsT','t']]);
c('miasma','Miasma','spell','poison',2,4,'🌫️',{v:4,k:1},[['se','poison','v',{aoe:1}],['se','vuln','k',{aoe:1}]]);
c('alchemists_fire',"Alchemist's Fire",'spell','poison',2,4,'⚗️',{dmg:7,v:4,k:2},[['dmg','dmg'],['se','poison','v'],['se','burn','k']]);
c('pandemic','Pandemic','spell','poison',2,5,'☣️',{},[['special','doubleSt',{s:'poison',aoe:1}]]);
c('blight','Blight','spell','poison',3,5,'🥀',{dmg:9,v:6},[['dmg','dmg',{aoe:1}],['se','poison','v',{aoe:1}]]);
c('black_death','Black Death','spell','poison',3,6,'🐀',{v:12,w:2},[['se','poison','v',{aoe:1}],['se','weak','w',{aoe:1}]]);
c('catalyst','Catalyst','spell','poison',2,6,'🧪',{m:3},[['special','stDmg',{s:'poison',m:'m'}]]);
c('plague_touch',"Plague Lord's Touch",'spell','poison',2,7,'🫵',{dmg:14,v:10,k:2},[['dmg','dmg'],['se','poison','v'],['se','vuln','k']]);
c('extinction','Extinction','spell','poison',3,8,'☠️',{dmg:18,v:12},[['dmg','dmg',{aoe:1}],['se','poison','v',{aoe:1}],['special','doubleSt',{s:'poison',aoe:1}]]);
// ---------- EARTH: block, armor, heavy hits ----------
c('rock_throw','Rock Throw','spell','earth',1,0,'🪨',{dmg:4},[['dmg','dmg']]);
c('stone_wall','Stone Wall','shield','earth',0,0,'🧱',{b:5},[['block','b']]);
c('pebble_volley','Pebble Volley','spell','earth',1,0,'🌑',{dmg:2,hits:2},[['dmg','dmg',{hits:'hits'}]]);
c('boulder','Boulder','spell','earth',2,1,'🪨',{dmg:12},[['dmg','dmg']]);
c('stone_skin','Stone Skin','shield','earth',0,1,'🗿',{b:4,a:1},[['block','b'],['armor','a']]);
c('tremor','Tremor','spell','earth',1,1,'〰️',{dmg:4},[['dmg','dmg',{aoe:1}]]);
c('bulwark_strike','Bulwark Strike','attack','earth',0,2,'🛡️',{m:1},[['special','blockDmg',{m:'m'}]]);
c('iron_skin','Iron Skin','shield','earth',0,2,'🦾',{a:3},[['armor','a']]);
c('sandstorm','Sandstorm','spell','earth',1,2,'🌪️',{v:2},[['se','weak','v',{aoe:1}]]);
c('earthquake','Earthquake','spell','earth',2,3,'🌋',{dmg:8,v:1},[['dmg','dmg',{aoe:1}],['se','weak','v',{aoe:1}]]);
c('fortress','Fortress','shield','earth',0,3,'🏰',{b:13},[['block','b']]);
c('ley_line','Ley Line','skill','earth',0,3,'🔷',{e:2,b:3},[['energy','e'],['block','b']]);
c('titan_slam','Titan Slam','attack','earth',0,4,'🏔️',{dmg:20},[['dmg','dmg']]);
c('granite_form','Granite Form','shield','earth',0,4,'🗿',{a:4,b:5},[['armor','a'],['block','b']]);
c('quake','Quake','spell','earth',3,5,'🏔️',{dmg:16,v:2},[['dmg','dmg',{aoe:1}],['se','weak','v',{aoe:1}]]);
c('bastion','Bastion','shield','earth',0,5,'🏯',{b:20},[['block','b']],{retain:true});
c('mountains_wrath',"Mountain's Wrath",'spell','earth',3,6,'⛰️',{dmg:28},[['dmg','dmg']]);
c('colossus','Colossus','attack','earth',0,6,'🗿',{m:2},[['special','blockDmg',{m:'m'}]]);
c('tectonic_shift','Tectonic Shift','spell','earth',3,7,'🌍',{dmg:22,k:2,b:10},[['dmg','dmg',{aoe:1}],['se','vuln','k',{aoe:1}],['block','b']]);
c('world_ender','World Ender','spell','earth',3,8,'💥',{dmg:38,v:3,k:3},[['dmg','dmg'],['se','weak','v'],['se','vuln','k']]);
// ---------- SHADOW: life steal, sacrifice, curses ----------
c('shadow_bolt','Shadow Bolt','spell','shadow',1,0,'🌑',{dmg:3},[['dmg','dmg']]);
c('umbral_cut','Umbral Cut','attack','shadow',0,0,'🗡️',{dmg:4},[['dmg','dmg']]);
c('gloom','Gloom','spell','shadow',0,0,'🌫️',{v:1},[['se','weak','v']]);
c('drain','Drain','attack','shadow',0,1,'🩸',{dmg:4},[['dmg','dmg',{ls:100}]]);
c('curse','Curse','spell','shadow',1,1,'📿',{v:2,k:2},[['se','weak','v'],['se','vuln','k']]);
c('dark_pact','Dark Pact','skill','shadow',0,1,'🕯️',{s:3,e:1},[['selfDmg','s'],['energy','e']]);
c('vampiric_touch','Vampiric Touch','spell','shadow',1,2,'🧛',{dmg:4},[['dmg','dmg',{aoe:1,ls:50}]]);
c('blood_pact','Blood Pact','skill','shadow',0,2,'🩸',{s:4,v:2},[['selfDmg','s'],['ss','str','v']]);
c('shadow_step','Shadow Step','skill','shadow',0,2,'👤',{},[['ss','dodgeNext',null]],{exhaust:true});
c('soul_drain','Soul Drain','spell','shadow',2,3,'👻',{dmg:9},[['dmg','dmg',{ls:100}]]);
c('reap','Reap','attack','shadow',0,3,'⚰️',{dmg:7},[['special','execute',{pct:50}]]);
c('dark_ritual','Dark Ritual','skill','shadow',0,3,'🔮',{s:5,e:2,d:1},[['selfDmg','s'],['energy','e'],['draw','d']]);
c('leech','Leech','spell','shadow',2,4,'🪱',{dmg:11},[['dmg','dmg',{ls:75}]]);
c('hex','Hex','spell','shadow',1,4,'🪬',{v:3,k:3,w:2},[['se','weak','v'],['se','vuln','k'],['se','poison','w']]);
c('soul_harvest','Soul Harvest','attack','shadow',0,5,'💀',{dmg:8,hits:2},[['dmg','dmg',{hits:'hits',ls:50}]]);
c('void_rift','Void Rift','spell','shadow',2,5,'🌌',{dmg:11,k:1},[['dmg','dmg',{aoe:1}],['se','vuln','k',{aoe:1}]]);
c('crimson_feast','Crimson Feast','spell','shadow',3,6,'🍷',{dmg:9,hits:3},[['dmg','dmg',{hits:'hits',aoe:1,ls:60}]]);
c('shadow_form','Shadow Form','skill','shadow',0,6,'🌫️',{v:15,k:2},[['ss','dodgeT','v'],['ss','str','k']]);
c('nightmare','Nightmare','spell','shadow',3,7,'😱',{dmg:20,v:2,k:2},[['dmg','dmg',{aoe:1,ls:40}],['se','weak','v',{aoe:1}],['se','vuln','k',{aoe:1}]]);
c('deaths_embrace',"Death's Embrace",'attack','shadow',0,8,'💀',{dmg:40,k:3},[['dmg','dmg',{ls:100}],['se','vuln','k']]);
// ---------- HOLY: heal, block, smite ----------
c('smite','Smite','spell','holy',1,0,'✨',{dmg:3},[['dmg','dmg']]);
c('minor_heal','Minor Heal','spell','holy',1,0,'💛',{h:5},[['heal','h']]);
c('ward','Ward','shield','holy',0,0,'🔆',{b:4},[['block','b']]);
c('holy_light','Holy Light','spell','holy',1,1,'🌟',{h:9},[['heal','h']]);
c('holy_blade','Holy Blade','attack','holy',0,1,'🗡️',{dmg:6,h:2},[['dmg','dmg'],['heal','h']]);
c('blessing','Blessing','spell','holy',1,1,'🙏',{r:2},[['ss','regen','r']]);
c('consecrate','Consecrate','spell','holy',2,2,'🕊️',{dmg:6,h:4},[['dmg','dmg',{aoe:1}],['heal','h']]);
c('purify','Purify','spell','holy',1,2,'💧',{b:5},[['cleanse'],['block','b']]);
c('radiance','Radiance','spell','holy',1,2,'🔆',{dmg:4,h:3},[['dmg','dmg',{aoe:1}],['heal','h']]);
c('divine_shield','Divine Shield','shield','holy',0,3,'🛡️',{b:9,h:4},[['block','b'],['heal','h']]);
c('judgment','Judgment','spell','holy',3,3,'⚖️',{dmg:20,h:6},[['dmg','dmg'],['heal','h']]);
c('divine_favor','Divine Favor','skill','holy',0,3,'🕯️',{e:2,h:3},[['energy','e'],['heal','h']]);
c('guardian_angel','Guardian Angel','shield','holy',0,4,'👼',{b:11,r:2},[['block','b'],['ss','regen','r']]);
c('holy_nova','Holy Nova','spell','holy',2,4,'💫',{dmg:9,h:8},[['dmg','dmg',{aoe:1}],['heal','h']]);
c('resurrection','Resurrection','spell','holy',1,5,'🕊️',{h:40},[['healPct','h'],['cleanse']],{exhaust:true});
c('aegis','Aegis','shield','holy',0,5,'🌞',{b:14,h:5},[['block','b'],['cleanse'],['heal','h']]);
c('wrath_of_heaven','Wrath of Heaven','spell','holy',3,6,'⚡',{dmg:26,k:2},[['dmg','dmg'],['se','vuln','k']]);
c('sanctuary','Sanctuary','shield','holy',0,6,'⛪',{b:16,r:3},[['block','b'],['ss','regen','r']],{retain:true});
c('archangels_grace',"Archangel's Grace",'spell','holy',3,7,'😇',{dmg:18,h:20},[['dmg','dmg',{aoe:1}],['heal','h'],['cleanse']]);
c('divine_judgment','Divine Judgment','spell','holy',3,8,'☀️',{dmg:30,h:20,k:2},[['dmg','dmg',{aoe:1}],['heal','h'],['se','vuln','k',{aoe:1}]]);
// ---------- NEUTRAL: attacks ----------
c('strike','Strike','attack','phys',0,0,'🗡️',{dmg:3},[['dmg','dmg']]);
c('arrow','Arrow','attack','phys',0,0,'🏹',{dmg:3},[['dmg','dmg',{pierce:1}]]);
c('double_slash','Double Slash','attack','phys',0,1,'🔪',{dmg:2,hits:2},[['dmg','dmg',{hits:'hits'}]]);
c('heavy_slash','Heavy Slash','attack','phys',0,1,'⚔️',{dmg:7},[['dmg','dmg']]);
c('cleave','Cleave','attack','phys',0,1,'🪓',{dmg:3},[['dmg','dmg',{aoe:1}]]);
c('riposte','Riposte','attack','phys',0,2,'🗡️',{dmg:5},[['dmg','dmg'],['ss','counterNext',null]]);
c('shatter_strike','Shatter Strike','attack','phys',0,2,'💥',{dmg:4,v:2},[['dmg','dmg'],['se','vuln','v']]);
c('crippling_blow','Crippling Blow','attack','phys',0,2,'🦵',{dmg:4,v:2},[['dmg','dmg'],['se','weak','v']]);
c('quick_draw','Quick Draw','attack','phys',0,2,'🎯',{dmg:3,d:1},[['dmg','dmg'],['draw','d']]);
c('whirlwind','Whirlwind','attack','phys',0,3,'🌪️',{dmg:6},[['dmg','dmg',{aoe:1}]]);
c('reckless_swing','Reckless Swing','attack','phys',0,3,'😤',{dmg:10,s:3},[['dmg','dmg'],['selfDmg','s']]);
c('piercing_shot','Piercing Shot','attack','phys',0,3,'➶',{dmg:7},[['dmg','dmg',{pierce:1}]]);
c('marked_shot','Marked Shot','attack','phys',0,3,'🔭',{dmg:3,v:2},[['dmg','dmg',{pierce:1}],['se','vuln','v']]);
c('executioner','Executioner','attack','phys',0,4,'⚰️',{dmg:9},[['special','execute',{pct:30}]]);
c('snipe','Snipe','attack','phys',0,4,'🔭',{dmg:12},[['special','snipe']]);
c('rain_of_arrows','Rain of Arrows','attack','phys',0,4,'🌧️',{dmg:5},[['dmg','dmg',{aoe:1}]]);
c('blade_dance','Blade Dance','attack','phys',0,5,'💃',{dmg:4,hits:4},[['dmg','dmg',{hits:'hits'}]]);
c('barrage','Barrage','attack','phys',0,5,'🏹',{dmg:3,hits:5},[['dmg','dmg',{hits:'hits'}]]);
c('explosive_shot','Explosive Shot','attack','phys',0,5,'🧨',{dmg:8,k:1},[['dmg','dmg',{aoe:1}],['se','vuln','k',{aoe:1}]]);
c('dragon_slayer','Dragon Slayer','attack','phys',0,6,'🐲',{dmg:16},[['dmg','dmg']]);
c('sword_of_legends','Sword of Legends','attack','phys',0,7,'🌟',{dmg:12,hits:2,d:1},[['dmg','dmg',{hits:'hits'}],['draw','d']]);
c('arrow_storm','Arrow Storm','attack','phys',0,7,'🌠',{dmg:4,hits:6},[['dmg','dmg',{hits:'hits',pierce:1}]]);
c('blade_of_eternity','Blade of Eternity','attack','phys',0,8,'⚔️',{dmg:18,hits:2,e:1,d:1},[['dmg','dmg',{hits:'hits'}],['energy','e'],['draw','d']]);
c('godslayer_bow','Godslayer Bow','attack','phys',0,8,'🏹',{dmg:22,hits:2,k:2},[['dmg','dmg',{hits:'hits',pierce:1}],['se','vuln','k']]);
// ---------- NEUTRAL: shields ----------
c('guard','Guard','shield','phys',0,0,'🛡️',{b:3},[['block','b']]);
c('shield_bash','Shield Bash','shield','phys',0,1,'🛡️',{b:4,dmg:3},[['block','b'],['dmg','dmg']]);
c('shield_wall','Shield Wall','shield','phys',0,1,'🧱',{b:8},[['block','b']]);
c('guard_stance','Guard Stance','shield','phys',0,2,'🧍',{b:4},[['block','b'],['ss','counterNext',null]]);
c('fortify','Fortify','shield','phys',0,2,'🏰',{a:2},[['armor','a']]);
c('spiked_shield','Spiked Shield','shield','phys',0,2,'🦔',{b:5,t:2},[['block','b'],['ss','thornsT','t']]);
c('reflect','Reflect','shield','phys',0,3,'🪞',{b:5,t:3},[['block','b'],['ss','thornsT','t']]);
c('bulwark','Bulwark','shield','phys',0,3,'🏯',{b:7,a:2},[['block','b'],['armor','a']]);
c('retaliation','Retaliation','attack','phys',0,4,'💢',{m:2},[['special','retaliation',{m:'m'}]]);
c('tower_shield','Tower Shield','shield','phys',0,5,'🛡️',{b:12},[['block','b']],{retain:true});
c('iron_maiden','Iron Maiden','shield','phys',0,5,'⚙️',{t:8},[['ss','thornsT','t']]);
c('immortal_bastion','Immortal Bastion','shield','phys',0,8,'🏰',{b:24,a:3},[['block','b'],['armor','a']],{retain:true});
// ---------- NEUTRAL: skills ----------
c('preparation','Preparation','skill','phys',0,0,'📜',{d:1},[['draw','d']]);
c('dodge_roll','Dodge Roll','skill','phys',0,1,'💨',{},[['ss','dodgeNext',null]]);
c('counter_stance','Counter Stance','skill','phys',0,1,'🗡️',{},[['ss','counterNext',null]]);
c('focus','Focus','skill','phys',0,1,'🔮',{v:2},[['ss','spellT','v']]);
c('battle_cry','Battle Cry','skill','phys',0,1,'📣',{v:2},[['ss','str','v']]);
c('insight','Insight','skill','phys',0,2,'👁️',{d:2},[['draw','d']]);
c('parry','Parry','skill','phys',0,2,'🤺',{b:3},[['block','b'],['ss','counterNext',null],['special','parry']]);
c('adrenaline','Adrenaline','skill','phys',0,2,'💉',{e:1,d:1},[['energy','e'],['draw','d']],{exhaust:true});
c('meditation','Meditation','skill','phys',0,2,'🧘',{u:25},[['ult','u']]);
c('rally','Rally','skill','phys',0,2,'🚩',{b:4,u:15},[['block','b'],['ult','u']]);
c('second_wind','Second Wind','skill','phys',0,3,'🌬️',{h:6,e:1},[['heal','h'],['energy','e']],{exhaust:true});
c('mana_crystal','Mana Crystal','skill','phys',0,4,'💎',{e:1},[['maxEnergy','e']],{exhaust:true});
c('war_drums','War Drums','skill','phys',0,4,'🥁',{v:3},[['ss','str','v'],['ss','spellT','v']]);
c('tactician','Tactician','skill','phys',0,5,'🧠',{d:3},[['draw','d']]);
c('time_warp','Time Warp','skill','phys',0,7,'⏳',{e:3,d:2},[['energy','e'],['draw','d']],{exhaust:true});
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
