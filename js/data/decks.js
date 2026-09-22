'use strict';
// ===================== DECKS: every nature type is a deck =====================
// A card's deck is its element (deckOf is the one place that decides, so a named sub-deck can come later). Any card of an
// element belongs to that deck; the synergy cards below read how many cards of the same element you played before them,
// this turn or this fight. combat.js keeps the counters per fight: deckTurn, deckFight, and deckBuff (the deck's standing
// damage bonus). Creature abilities belong to their element's deck too, so slaying a rat feeds the Poison deck.
// The vocabulary, on top of cards.js:
//   ['dmg',key,{pp:key2}]                        +key2 damage for every deck card played earlier this turn
//   any effect with {...,ifPack:1}               a combo: the effect only fires if a deck card was played earlier this turn
//   ['special','packStatus',{s,v,base,per}]      base% (+per% per deck card played earlier this turn) chance to apply v of status s
//   ['special','tutor',{n}]                      draw n random deck cards from the draw pile (then the discard pile) into your hand
//   ['special','packBuff',{v}]                   every deck card you play for the rest of the fight deals +v damage
//   ['special','pack',{what,m,scope,aoe,pierce}] m for every deck card played earlier this turn|fight, as dmg|block|heal|energy|draw
const deckOf=d=>d.el;
const DECK_SYNERGY={
  phys:    'Tricks set up tricks: Guild cards strike twice, draw and pocket Mana when another Physical card came first this turn, and Heist hits once per card.',
  beast:   'The pack hunts together: Wolf and Pack Frenzy hit harder for every Beast card played before them this turn, and a howl carries the whole pack.',
  fire:    'Fire feeds fire: Stoker burns hotter for every Fire card before it, Blaze strikes once per card and burns after a combo, Ember Call brings more fuel.',
  water:   'The tide builds: Ripple grows with every Water card before it, Flood counts every Water card of the fight, Tide Call draws the next wave.',
  ice:     'Frost settles: Hoarfrost is more likely to Chill for every Ice card before it, Glacier walls up per card, Frost Call brings the cold.',
  light:   'Storms build: Static Charge Shocks more often with every Lightning card before it, Storm Crow and Tempest grow per card, Chain Reaction strikes once per card.',
  grass:   'Roots spread: Overgrow blocks per Grass card, Sapling and Thornwall combo after one, World Root counts the whole fight, Seed Call brings seeds.',
  poison:  'Rats. A Rat is more likely to poison for every Poison card played before it this turn, the Plague Rat calls two more, the Rat King feeds the nest, Plague Wave counts the fight.',
  earth:   'Stone piles up: Rumble grows per Earth card, Landslide strikes once per card and weakens after a combo, Stone Call brings more rock.',
  shadow:  'The dead march in step: Bone Shard shields after a Shadow card, Bone Wall blocks per card, Legion March strikes and feeds per card, Grave Call raises more.',
  holy:    'Voices join: Chant heals per Holy card, Crusade grows per card, a Hymn lifts every Holy card for the fight, Choir of Light counts the whole fight.',
  dragon:  "Wyrms gather: Hatchling bites harder per Dragon card, Dragon's Pride lifts every Dragon card for the fight, Wyrmstorm counts the whole fight, Wyrm Call brings kin.",
  psychic: 'Minds resonate: Mind Flay grows per Psychic card, Resonance refunds Mana per card, Overmind strikes once per card and marks after a combo, Mind Link reads two more.',
  flying:  'The flock wheels: Swift hits harder per Flying card, Slipstream draws per card, Murmuration strikes once per card and slips away after a combo, Flock Call gathers the flock.',
  fighting:'Strings of blows: Cross hits again after a Fighting card, One-Two grows per card, Finisher lands once per card, Grandmaster Form lifts every blow for the fight, Kata calls the next.',
};
const DECKS=Object.fromEntries(Object.keys(EL).map(k=>[k,{n:EL[k].n,i:EL[k].i,c:EL[k].c,d:DECK_SYNERGY[k]||''}]));
function fxOpts(f){ const o=f[f.length-1]; return (o&&typeof o==='object'&&!Array.isArray(o))?o:{}; }   // the options object of an effect, if it has one
function deckCards(deck){ return CARDS.filter(x=>deckOf(x)===deck); }
function isSynergyCard(d){ return d.fx.some(f=>fxOpts(f).ifPack||(f[0]==='dmg'&&f[2]&&f[2].pp)||(f[0]==='special'&&['packStatus','tutor','packBuff','pack'].includes(f[1]))); }
function synergyCards(deck){ return deckCards(deck).filter(isSynergyCard); }

// ---------- POISON ☠️ : the rats. The plague rat's swarm and Black Death learn to run with the pack ----------
CARD.f_swarm.n.k=1; CARD.f_swarm.fx=[['dmg','dmg',{hits:'hits',pp:'k'}]];                       // Rat Swarm: every bite grows with the Poison cards that came before it
CARD.black_death.fx.push(['special','doubleSt',{s:'poison',aoe:1,ifPack:1}]);                   // Black Death: after another Poison card, it doubles the Poison it finds on every enemy
c('rat','Rat','attack','poison',0,1,'🐀',{dmg:4,v:3},[['dmg','dmg'],['special','packStatus',{s:'poison',v:'v',base:20,per:30}]]);
c('rat_plague','Plague Rat','skill','poison',0,2,'🐁',{n:2},[['special','tutor',{n:'n'}]]);
c('rat_king','Rat King','attack','poison',0,3,'👑',{dmg:6,v:3,k:1},[['dmg','dmg'],['se','poison','v'],['special','packBuff',{v:'k'}]]);
c('plague_wave','Plague Wave','spell','poison',2,4,'🦠',{m:2,v:2},[['special','pack',{what:'dmg',m:'m',scope:'fight',aoe:1}],['se','poison','v',{aoe:1}]]);
// ---------- BEAST 🐾 : the wolves; the dire wolf's Pack Howl carries the pack ----------
CARD.f_pack_howl.fx=[['special','packBuff',{v:'v'}]];                                           // Pack Howl: +3 damage to every Beast card this fight (the dire wolf reads it as Strength)
c('pack_wolf','Wolf','attack','beast',0,1,'🐺',{dmg:4,k:2},[['dmg','dmg',{pp:'k'}]]);
c('alpha_wolf','Alpha Wolf','attack','beast',0,3,'🐕',{dmg:7,n:1},[['dmg','dmg'],['special','tutor',{n:'n'}]]);
c('moonlit_hunt','Moonlit Hunt','skill','beast',0,4,'🌙',{k:2,d:1},[['special','packBuff',{v:'k'}],['draw','d']]);
c('pack_frenzy','Pack Frenzy','attack','beast',0,5,'🩸',{m:5,v:2},[['special','pack',{what:'dmg',m:'m',scope:'turn'}],['ss','str','v',{ifPack:1}]]);
// ---------- FIRE 🔥 ----------
c('stoker','Stoker','attack','fire',0,1,'🔥',{dmg:4,k:2},[['dmg','dmg',{pp:'k'}]]);
c('ember_call','Ember Call','skill','fire',0,2,'🕯️',{n:2},[['special','tutor',{n:'n'}]]);
c('blaze','Blaze','spell','fire',2,4,'🔥',{m:4,v:2},[['special','pack',{what:'dmg',m:'m',scope:'turn'}],['se','burn','v',{ifPack:1}]]);
// ---------- WATER 💧 ----------
c('ripple','Ripple','spell','water',1,1,'💧',{dmg:4,k:2},[['dmg','dmg',{pp:'k'}]]);
c('tide_call','Tide Call','skill','water',0,2,'🐚',{n:2},[['special','tutor',{n:'n'}]]);
c('flood','Flood','spell','water',2,4,'🌊',{m:3,v:2},[['special','pack',{what:'dmg',m:'m',scope:'fight',aoe:1}],['se','wet','v',{aoe:1}]]);
// ---------- ICE ❄️ ----------
c('hoarfrost','Hoarfrost','spell','ice',1,1,'❄️',{dmg:4,v:1},[['dmg','dmg'],['special','packStatus',{s:'chill',v:'v',base:30,per:35}]]);
c('frost_call','Frost Call','skill','ice',0,2,'🌬️',{n:2},[['special','tutor',{n:'n'}]]);
c('glacier','Glacier','shield','ice',0,3,'🧊',{b:6,m:3},[['block','b'],['special','pack',{what:'block',m:'m',scope:'turn'}]]);
// ---------- LIGHTNING ⚡ ----------
c('static_charge','Static Charge','spell','light',1,1,'⚡',{dmg:5,v:2},[['dmg','dmg'],['special','packStatus',{s:'shock',v:'v',base:30,per:35}]]);
c('storm_crow','Storm Crow','attack','light',0,2,'🐦‍⬛',{dmg:3,hits:2,k:1},[['dmg','dmg',{hits:'hits',pp:'k'}]]);
c('call_thunder','Call Thunder','skill','light',0,3,'📯',{n:1,e:1},[['special','tutor',{n:'n'}],['energy','e']]);
c('chain_reaction','Chain Reaction','spell','light',2,4,'🔗',{m:5,v:2},[['special','pack',{what:'dmg',m:'m',scope:'turn'}],['se','shock','v',{ifPack:1}]]);
c('tempest','Tempest','spell','light',3,6,'🌪️',{dmg:12,k:4,v:3},[['dmg','dmg',{aoe:1,pp:'k'}],['se','shock','v',{aoe:1}]]);
// ---------- GRASS 🌿 ----------
c('sapling','Sapling','attack','grass',0,1,'🌱',{dmg:4,k:1},[['dmg','dmg'],['ss','regen','k',{ifPack:1}]]);
c('seed_call','Seed Call','skill','grass',0,2,'🌰',{n:2},[['special','tutor',{n:'n'}]]);
c('overgrow','Overgrow','shield','grass',0,3,'🌿',{b:5,m:3},[['block','b'],['special','pack',{what:'block',m:'m',scope:'turn'}]]);
c('thornwall','Thornwall','shield','grass',0,4,'🌵',{b:8,t:3,d:1},[['block','b'],['ss','thornsT','t'],['draw','d',{ifPack:1}]]);
c('world_root','World Root','spell','grass',2,5,'🌳',{m:4,h:8},[['special','pack',{what:'dmg',m:'m',scope:'fight'}],['heal','h']]);
// ---------- EARTH 🪨 ----------
c('rumble','Rumble','attack','earth',0,1,'🪨',{dmg:4,k:2},[['dmg','dmg',{pp:'k'}]]);
c('stone_call','Stone Call','skill','earth',0,2,'🗿',{n:2},[['special','tutor',{n:'n'}]]);
c('landslide','Landslide','spell','earth',2,4,'🏔️',{m:5,v:1},[['special','pack',{what:'dmg',m:'m',scope:'turn'}],['se','weak','v',{ifPack:1}]]);
// ---------- SHADOW 🌑 : the bone legion ----------
c('bone_shard','Bone Shard','attack','shadow',0,1,'🦴',{dmg:5,b:3},[['dmg','dmg'],['block','b',{ifPack:1}]]);
c('grave_call','Grave Call','skill','shadow',0,2,'⚰️',{n:2},[['special','tutor',{n:'n'}]]);
c('bone_wall','Bone Wall','shield','shadow',0,3,'🧱',{b:6,m:3},[['block','b'],['special','pack',{what:'block',m:'m',scope:'turn'}]]);
c('legion_march','Legion March','attack','shadow',0,5,'🪖',{m:4,h:3},[['special','pack',{what:'dmg',m:'m',scope:'turn',aoe:1}],['special','pack',{what:'heal',m:'h',scope:'turn'}]]);
// ---------- HOLY ✨ : the choir ----------
c('chant','Chant','skill','holy',0,1,'🎵',{h:3,m:2},[['heal','h'],['special','pack',{what:'heal',m:'m',scope:'turn'}]]);
c('litany','Litany','skill','holy',0,2,'📜',{n:2},[['special','tutor',{n:'n'}]]);
c('hymn','Hymn','skill','holy',0,3,'🎶',{k:2,h:4},[['special','packBuff',{v:'k'}],['heal','h']]);
c('crusade','Crusade','attack','holy',0,4,'⚔️',{dmg:10,k:3},[['dmg','dmg',{pp:'k'}]]);
c('choir_of_light','Choir of Light','spell','holy',3,6,'👼',{m:5,h:10},[['special','pack',{what:'dmg',m:'m',scope:'fight',aoe:1}],['heal','h']]);
// ---------- PHYSICAL ⚔️ : the thieves' guild ----------
c('cutpurse','Cutpurse','attack','phys',0,1,'🪙',{dmg:4,e:1},[['dmg','dmg'],['energy','e',{ifPack:1}]]);
c('backstab','Backstab','attack','phys',0,2,'🔪',{dmg:5},[['dmg','dmg'],['dmg','dmg',{ifPack:1}]]);
c('smoke_bomb','Smoke Bomb','trap','phys',0,2,'💨',{d:1},[['ss','dodgeNext',null],['draw','d',{ifPack:1}]]);
c('whistle','Whistle','skill','phys',0,2,'🎺',{n:2},[['special','tutor',{n:'n'}]]);
c('heist','Heist','attack','phys',0,5,'💰',{m:5,d:1},[['special','pack',{what:'dmg',m:'m',scope:'turn'}],['draw','d']]);
// ---------- DRAGON 🐉 ----------
c('hatchling','Hatchling','attack','dragon',0,1,'🐲',{dmg:4,k:2},[['dmg','dmg',{pp:'k'}]]);
c('wyrm_call','Wyrm Call','skill','dragon',0,2,'🐉',{n:2},[['special','tutor',{n:'n'}]]);
c('dragons_pride',"Dragon's Pride",'skill','dragon',0,3,'👑',{k:2,b:4},[['special','packBuff',{v:'k'}],['block','b']]);
c('wyrmstorm','Wyrmstorm','spell','dragon',3,5,'🌋',{m:3,v:2},[['special','pack',{what:'dmg',m:'m',scope:'fight',aoe:1}],['se','burn','v',{aoe:1}]]);
// ---------- PSYCHIC 🔮 ----------
c('mind_flay','Mind Flay','attack','psychic',0,1,'💭',{dmg:3,k:2},[['dmg','dmg',{pierce:1,pp:'k'}]]);
c('mind_link','Mind Link','skill','psychic',0,2,'🔗',{n:2},[['special','tutor',{n:'n'}]]);
c('resonance','Resonance','skill','psychic',0,3,'🔔',{m:1,d:1},[['special','pack',{what:'energy',m:'m',scope:'turn'}],['draw','d']]);
c('overmind','Overmind','spell','psychic',2,5,'🧠',{m:5,k:2},[['special','pack',{what:'dmg',m:'m',scope:'turn',pierce:1}],['se','vuln','k',{ifPack:1}]]);
// ---------- FLYING 🪽 ----------
c('swift','Swift','attack','flying',0,1,'🐦',{dmg:3,hits:2,k:1},[['dmg','dmg',{hits:'hits',pp:'k'}]]);
c('flock_call','Flock Call','skill','flying',0,2,'🪶',{n:2},[['special','tutor',{n:'n'}]]);
c('slipstream','Slipstream','skill','flying',0,3,'💨',{m:1},[['special','pack',{what:'draw',m:'m',scope:'turn'}],['ss','dodgeNext',null]]);
c('murmuration','Murmuration','attack','flying',0,5,'🌫️',{m:4},[['special','pack',{what:'dmg',m:'m',scope:'turn'}],['ss','dodgeNext',null,{ifPack:1}]]);
// ---------- FIGHTING 🥊 ----------
c('cross','Cross','attack','fighting',0,1,'👊',{dmg:4},[['dmg','dmg'],['dmg','dmg',{ifPack:1}]]);
c('one_two','One-Two','attack','fighting',0,2,'🥊',{dmg:3,k:3},[['dmg','dmg',{pp:'k'}]]);
c('kata','Kata','skill','fighting',0,2,'🥋',{n:2},[['special','tutor',{n:'n'}]]);
c('finisher','Finisher','attack','fighting',0,4,'💥',{m:6,v:2},[['special','pack',{what:'dmg',m:'m',scope:'turn'}],['se','vuln','v',{ifPack:1}]]);
c('grandmaster_form','Grandmaster Form','skill','fighting',0,5,'🧘',{k:3},[['special','packBuff',{v:'k'}],['ss','counterNext',null]]);
for(const x of CARDS) if(!CARD[x.id]) CARD[x.id]=x;
