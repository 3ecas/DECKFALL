'use strict';
// ===================== INTERLUDES: what happens between rounds (never optional) =====================
// Boosts last a number of fights. Element boosts raise that element's damage; Stoneskin adds Armor, Vigor adds Mana per turn.
const BOOSTS = [
  {id:'b_fire', name:'Ember Blessing', icon:'🔥', el:'fire', v:35, rounds:3, text:'A warm wind at your back. Fire cards deal +35% damage.'},
  {id:'b_water', name:'Tide Favor', icon:'💧', el:'water', v:35, rounds:3, text:'The current runs with you. Water cards deal +35% damage.'},
  {id:'b_ice', name:'Frost Pact', icon:'❄️', el:'ice', v:35, rounds:3, text:'Your breath turns to crystal. Ice cards deal +35% damage.'},
  {id:'b_light', name:'Storm Sign', icon:'⚡', el:'light', v:35, rounds:3, text:'Static hums in your fingertips. Lightning cards deal +35% damage.'},
  {id:'b_grass', name:'Verdant Blessing', icon:'🌿', el:'grass', v:35, rounds:3, text:'Roots part for you. Grass cards deal +35% damage.'},
  {id:'b_poison', name:'Venom Kiss', icon:'☠️', el:'poison', v:35, rounds:3, text:'Your blood turns black and eager. Poison cards deal +35% damage.'},
  {id:'b_earth', name:'Mountain Oath', icon:'🪨', el:'earth', v:35, rounds:3, text:'The ground remembers your steps. Earth cards deal +35% damage.'},
  {id:'b_shadow', name:'Umbral Mark', icon:'🌑', el:'shadow', v:35, rounds:3, text:'Your shadow walks ahead of you. Shadow cards deal +35% damage.'},
  {id:'b_holy', name:'Halo', icon:'✨', el:'holy', v:35, rounds:3, text:'A light no torch can make. Holy cards deal +35% damage.'},
  {id:'b_phys', name:'Whetstone', icon:'⚔️', el:'phys', v:30, rounds:3, text:'Every edge you carry sings. Physical cards deal +30% damage.'},
  {id:'b_beast', name:'Wild Heart', icon:'🐾', el:'beast', v:35, rounds:3, text:'Something in you bares its teeth. Beast cards deal +35% damage.'},
  {id:'b_dragon', name:'Wyrm Blood', icon:'🐉', el:'dragon', v:35, rounds:3, text:'Old fire wakes in your veins. Dragon cards deal +35% damage.'},
  {id:'b_psychic', name:'Third Eye', icon:'🔮', el:'psychic', v:35, rounds:3, text:'You see the blow before it lands. Psychic cards deal +35% damage.'},
  {id:'b_flying', name:'Tailwind', icon:'🪽', el:'flying', v:35, rounds:3, text:'The wind is at your back. Flying cards deal +35% damage.'},
  {id:'b_fighting', name:'Iron Fist', icon:'🥊', el:'fighting', v:35, rounds:3, text:'Your knuckles remember every wall. Fighting cards deal +35% damage.'},
  {id:'s_armor', name:'Stoneskin', icon:'🛡️', stat:'armor', v:2, rounds:3, text:'Your skin sets like mortar. +2 Armor.'},
  {id:'s_energy', name:'Vigor', icon:'🔋', stat:'mana', v:1, rounds:2, text:'Your heart beats twice as fast. +1 Mana per turn.'},
];
const BOOST = Object.fromEntries(BOOSTS.map(b=>[b.id,b]));
// What comes by itself after a fight, with weights (afterFight in world.js): every fourth fight a campfire instead, an elite leaves a chest, a boss its treasury.
const INTERLUDES = [
  {t:'chest', w:30}, {t:'boost', w:34}, {t:'shrine', w:10}, {t:'forge', w:14}, {t:'camp', w:5}, {t:'trap', w:5}, {t:'idol', w:4}, {t:'ambush', w:6}, {t:'event', w:16},
];
const INTERLUDE_TEXT = {
  chest:  {icon:'📦', title:'A chest in the rubble'},
  boost:  {icon:'✨', title:'A blessing'},
  shrine: {icon:'⛩️', title:'A forgotten shrine', text:'Moss covers a shrine to a god nobody remembers. Warmth floods your wounds.'},
  forge:  {icon:'⚒️', title:'A dwarven forge', text:'The coals are still hot. Choose a card and the smith reforges it into something better.'},
  trap:   {icon:'🕳️', title:'A trap!', text:'The floor gives way. You land on something soft, and something shiny.'},
  idol:   {icon:'🗿', title:'A cursed idol', text:'It offers power. It does not ask.'},
  ambush: {icon:'🗡️', title:'Ambush!', text:'Steel glints in the shadows. No way around it.'},
  camp:   {icon:'🔥', title:'A campfire', text:'Embers crackle in a ring of stones. Sit a while.'},
  treasury:{icon:'👑', title:"The boss's treasury", text:'Behind the corpse: gold, and a card that remembers its owner.'},
  shop:   {icon:'🏪', title:'A merchant'},
};
