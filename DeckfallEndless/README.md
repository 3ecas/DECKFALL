# Deckfall Endless

A turn-based, endless deck-building roguelike. Runs in any browser and as a native macOS app. No installation, no dependencies.

## Play

- **macOS app:** double-click `dist/Deckfall Endless.app` (rebuild any time with `./mac/build.sh`).
- **Any browser:** double-click `Play.command`, or open `index.html` directly.
- Saves happen automatically after every step. Death deletes the save: permadeath.

## How a run flows

Every round is a fight, then spoils (gold, XP, pick a card), then something automatic on the road: a chest, a blessing that boosts an element or a stat for a few rounds, a shrine, a forge that evolves a card, a trap, a cursed idol, an ambush. Every fourth round a merchant appears (cards, attributes, evolution forge, Lucky Coin). Elites every fifth round, a boss every tenth. Enemies scale every round.

- **Mana:** only spells and summons cost Mana. Attacks, shields, skills, potions, machines and traps are free. Many cards generate Mana or raise it for the fight. When nothing in hand can be played the turn ends by itself.
- **Passives:** machines (Mecha), summons and armed traps take a passive slot (3 to start, up to 5). Machines give standing bonuses, summons act every turn, traps spring on the next enemy attack. Enemies have passives too; Sabotage, EMP and Pilfer destroy or steal them, and some enemies dispel yours.
- **Tiers:** basic → common → uncommon → medium → good → great → rare → perfect → ultimate. Basic cards do exactly one plain thing (Strike: 3 damage). Getting a card you already own evolves it one tier and multiplies its numbers (an ultimate-evolved basic is 4.2× its base). Some cards are born ultimate.
- **Elements:** ten elements with about twenty cards each and their own combos (burn/detonate, chill/freeze/shatter, shock/multi-hit, wet, growth/regen, poison stacking/doubling, block-to-damage, life steal, heal/smite). Weakness hits deal 2×.
- **Every run starts with basic cards** plus three random basic element cards, so openings differ.

## Project layout

```
index.html              page shell, loads everything below in order
css/style.css           all styling and animations
js/data/elements.js     elements, type chart, tiers, status effects
js/data/cards.js        the card library (293 cards) + ultimates + attribute upgrades
js/data/passives.js     machines, summons and traps: what each does once it sits in a slot
js/data/enemies.js      52 enemies, 10 bosses, intent patterns, enemy passives
js/data/interludes.js   boosts and the automatic between-round events
js/engine/state.js      run state, save/load, round flow, interludes, shop, Lucky Coin, XP, tiers
js/engine/combat.js     turn-based combat: damage, elements, statuses, enemy AI, ultimates, spoils
js/ui/sound.js          procedural sound effects (Web Audio: layered noise, sub thumps, chimes, reverb); 🔊 button mutes
js/ui/fx.js             particles, ambient embers, card flights, banners, counters
js/ui/components.js     card/enemy rendering, HUD, floating numbers, modals, help
js/ui/screens.js        title, battle, spoils, interlude, merchant, game over
js/main.js              click and keyboard handling, boot
mac/main.swift          native wrapper (WebKit window + save bridge)
mac/build.sh            builds the .app into ./dist
```

## Adding a card

One line in `js/data/cards.js`:

```js
c('frost_nova','Frost Nova','spell','ice',2,5,'❄️',{dmg:9,v:2},[['dmg','dmg',{aoe:1}],['se','chill','v',{aoe:1}]]);
//  id          name        type    el   cost tier icon values   effects (first effect = the info box, the rest = extra lines)
// A machine, summon or trap is a card whose effect is ['passive', id]; the id's behaviour lives in js/data/passives.js.
```

Types: attack, spell, shield, skill, potion, mecha, summon, trap. Tier is 0 (basic) to 8 (ultimate). Effects: `dmg` (hits, aoe, pierce, ls, bv), `block`, `armor`, `se`, `ss`, `heal`, `healPct`, `draw`, `energy`, `maxEnergy`, `ult`, `selfDmg`, `cleanse`, `stat`, `passive`, `special` (execute, stDmg, doubleSt, spread, blockDmg, playedDmg, elBoost, retaliation, snipe, parry, redraw, sabotage, emp, pilfer, pilferAll, mimic). Options: `exhaust`, `consume`, `retain`, `unplayable`, `endTurnDmg`. Descriptions are generated from the effects.

## Balance knobs

- Enemy scaling: `hpMult` / `atkMult` in `state.js`.
- Tier drop curve: `tierWeights` in `state.js`. Tier multipliers and unlock rounds: `TIER` in `elements.js`.
- Rewards and prices: `goldReward`, `xpReward`, `cardPrice`, `evolvePrice`, `upgPrice`.
- Interlude odds: `INTERLUDES` in `interludes.js`.
