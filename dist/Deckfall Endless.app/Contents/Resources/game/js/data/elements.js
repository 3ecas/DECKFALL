'use strict';
// ===================== ELEMENTS, TYPE CHART, TIERS, STATUSES =====================
const EL = {
  phys:  {n:'Physical',  i:'⚔️', c:'#cfd3dc'},
  beast: {n:'Beast',     i:'🐾', c:'#d8b48a'},
  fire:  {n:'Fire',      i:'🔥', c:'#ff7b3d'},
  water: {n:'Water',     i:'💧', c:'#47b6ff'},
  ice:   {n:'Ice',       i:'❄️', c:'#9ff0ff'},
  light: {n:'Lightning', i:'⚡', c:'#ffe14d'},
  grass: {n:'Grass',     i:'🌿', c:'#55d66b'},
  poison:{n:'Poison',    i:'☠️', c:'#c6f542'},
  earth: {n:'Earth',     i:'🪨', c:'#d9a066'},
  shadow:{n:'Shadow',    i:'🌑', c:'#9d8bff'},
  holy:  {n:'Holy',      i:'✨', c:'#fff1a8'},
  dragon:{n:'Dragon',    i:'🐉', c:'#ff4f5e'},
  psychic:{n:'Psychic',  i:'🔮', c:'#f562e8'},
  flying:{n:'Flying',    i:'🪽', c:'#5fd9c9'},
  fighting:{n:'Fighting', i:'🥊', c:'#c2703a'},
};
// Defender element -> what hits it for double (weak) and half (resist) damage.
const TYPE_CHART = {
  phys:  {weak:['fighting'],                        resist:[]},
  beast: {weak:['fire','light','dragon','flying'],  resist:['psychic']},
  fire:  {weak:['water','earth'],                   resist:['fire','ice','grass']},
  water: {weak:['light','grass'],                   resist:['water','fire','ice']},
  ice:   {weak:['fire','phys','fighting'],          resist:['ice','water','grass']},
  light: {weak:['earth','ice'],                     resist:['light','water','flying']},
  grass: {weak:['fire','ice','poison','flying'],    resist:['water','earth','light']},
  earth: {weak:['water','grass','ice','fighting'],  resist:['light','poison','phys','flying']},
  poison:{weak:['fire','holy','psychic'],           resist:['poison','grass','shadow','fighting']},
  shadow:{weak:['holy','fire','fighting'],          resist:['shadow','poison','ice','psychic']},
  holy:  {weak:['shadow','poison'],                 resist:['holy','fire','water','dragon','fighting']},
  dragon:{weak:['ice','dragon','holy'],             resist:['fire','water','grass','light']},
  psychic:{weak:['shadow','beast'],                 resist:['psychic','fighting']},
  flying:{weak:['light','ice'],                     resist:['grass','fighting','earth']},
  fighting:{weak:['flying','psychic','holy'],       resist:['shadow','earth','beast']},
};
// Card tiers, lowest to highest. Evolving a card moves it up one tier; values scale by mult.
const TIERS=['basic','common','uncommon','medium','good','great','rare','perfect','ultimate'];
const TIER={
  basic:    {c:'#9aa3b5', mult:1,    price:28,  min:1},
  common:   {c:'#a9c9a0', mult:1.25, price:45,  min:1},
  uncommon: {c:'#5fc98e', mult:1.5,  price:65,  min:3},
  medium:   {c:'#4fc9d6', mult:1.8,  price:90,  min:6},
  good:     {c:'#4f8ef7', mult:2.15, price:125, min:11},
  great:    {c:'#a86cff', mult:2.55, price:170, min:18},
  rare:     {c:'#ff8a3d', mult:3,    price:230, min:24},
  perfect:  {c:'#ff5fa8', mult:3.5,  price:320, min:35},
  ultimate: {c:'#ffd166', mult:4.2,  price:450, min:48},
};
const SCALE_KEYS=['dmg','b','a','h','v','k','t','u','r','w','m'];   // values that grow with the tier multiplier; Mana/draw/redraw grow +1 per tier, hits +1 per two tiers, self-damage stays (cardVals in state.js)
const ST = {
  burn:  {n:'Burn', i:'🔥', d:'Takes X fire damage at the start of its turn, then the stacks halve.'},
  poison:{n:'Poison', i:'☠️', d:'Takes X poison damage at the start of its turn, then loses 1 stack.'},
  chill: {n:'Chill', i:'❄️', d:'At 3 stacks (5 on bosses) the target is Frozen and skips its next turn.'},
  frozen:{n:'Frozen', i:'🧊', d:'Skips its next turn. Shatter cards deal double damage to it.'},
  shock: {n:'Shock', i:'⚡', d:'Every hit taken deals +X bonus damage, then loses 1 stack.'},
  wet:   {n:'Wet', i:'💧', d:'Takes 50% more Lightning and Ice damage, 50% less Fire. Fades 1 per turn.'},
  weak:  {n:'Weak', i:'🌀', d:'Deals 25% less damage. Fades 1 per turn.'},
  vuln:  {n:'Vulnerable', i:'💔', d:'Takes 50% more damage. Fades 1 per turn.'},
  str:   {n:'Strength', i:'💪', d:'+X damage on every attack this fight.'},
  spellT:{n:'Focus', i:'🔮', d:'+X spell damage this fight.'},
  thornsT:{n:'Thorns', i:'🌵', d:'Attackers take X damage when they hit you.'},
  regen: {n:'Regen', i:'💚', d:'Heal X at the start of your turn.'},
  critT: {n:'Keen', i:'🎯', d:'+X% critical chance this fight.'},
  dodgeT:{n:'Shadowed', i:'🌫️', d:'+X% dodge this fight.'},
  dodgeNext:{n:'Evasive', i:'💨', d:'Dodges the next attack.'},
  counterNext:{n:'Riposte', i:'🗡️', d:'Counters the next attack that lands.'},
  block: {n:'Block', i:'🛡️', d:'Absorbs damage until your next turn.'},
};
const STATNAMES = {mana:'Mana per turn', maxHp:'Max HP', attack:'Attack', spell:'Spell Power', armor:'Armor', dodge:'Dodge %', counter:'Counter %', crit:'Crit %', lifesteal:'Life Steal %', thorns:'Thorns', luck:'Luck', energyMax:'Mana', handSize:'Opening Hand', regen:'Regen', slots:'Passive Slots'};
const TYPES = {attack:'Attack', spell:'Spell', shield:'Shield', skill:'Skill', potion:'Potion', mecha:'Mecha', summon:'Summon', trap:'Trap', curse:'Curse'};
const TYPE_ICON = {attack:'⚔', spell:'✦', shield:'⛨', skill:'◈', potion:'⚗', mecha:'⚙', summon:'☗', trap:'⚠', curse:'☠'};
const TYPE_DESC = {attack:'Free to play. Strength adds to it.', spell:'Costs Mana. Focus adds to it.', shield:'Free. Block, armor, thorns.', skill:'Free. Mana, draws, buffs.', potion:'Free. One use per fight; some are consumed for permanent gains.', mecha:'Free. Goes into a passive slot and works every turn.', summon:'Costs Mana. A creature takes a passive slot and acts every turn.', trap:'Free. Tricks, thefts, and armed traps that spring on the next enemy attack.', curse:'Unplayable. Remove it at a merchant.'};
