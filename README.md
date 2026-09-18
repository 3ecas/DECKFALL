# Deckfall Endless

A turn-based, endless deck-building roguelike. Runs in any browser and as a native macOS app. No installation, no dependencies.

## Play

- **macOS app:** double-click `dist/Deckfall Endless.app` (rebuild any time with `./mac/build.sh`).
- **Any browser:** double-click `Play.command`, or open `index.html` directly.
- Saves happen automatically after every step. Death deletes the save: permadeath.
- **Card Library** (main menu, or the in-run menu): every card you have discovered across runs, with filters by element, type, tier, Mana cost and a search box. Undiscovered cards stay hidden until you meet them on a run.

## How a run flows

Every round is a fight, then spoils (gold and XP), then something on the road, in a cycle of seven: rounds 1–3 and 5–6 end in a random encounter (a chest, a blessing that boosts an element or a stat for a few rounds, a shrine, a dwarven forge where you choose a card to evolve, a campfire, a trap, a cursed idol, an ambush), round 4 ends at a campfire (rest to heal 40% of Max HP, or train for +10% Max HP), round 7 at the merchant (upgrade a card for gold). Elites every fifth round, a boss every tenth: you pick one of the boss's cards, then another from its treasury. New cards otherwise come only from levelling up: one choice of three per level. Enemies start at level 1 with a handful of HP and scale every round.

- **Mana:** only spells and summons cost Mana. Attacks, shields, skills, potions, machines and traps are free. Many cards generate Mana or raise it for the fight. When nothing in hand can be played the turn ends by itself.
- **Passives:** machines (Mecha), summons and armed traps take a passive slot (3 to start, up to 5). Machines give standing bonuses, summons act every turn, traps spring on the next enemy attack. Enemies have passives too; Sabotage, EMP and Pilfer destroy or steal them, and some enemies dispel yours.
- **Tiers:** basic → common → uncommon → medium → good → great → rare → perfect → ultimate. Basic cards do exactly one plain thing (Strike: 3 damage). Getting a card you already own evolves it one tier and multiplies its numbers (an ultimate-evolved basic is 4.2× its base). Some cards are born ultimate.
- **Creature abilities:** each enemy and boss owns two or three abilities defined as real cards in `js/data/foecards.js` (`fc(owner, ...)`). It plays them between plain attacks, and when slain may drop one (30%, elites 60%, bosses always). Those cards never appear in offers: the creature is the only source. Fights are usually one creature; a second is rare and a third rarer.
- **Enemy natures:** every enemy fights by its element (`NATURE` in `js/data/enemies.js`): Physical crits, Beast enrages below half HP, Fire bursts into cinders when slain, Water regains HP while you are Wet, Ice grows frost armor, Lightning acts twice every third turn, Grass regrows, Poison has toxic blood, Earth wears stone skin, Shadow drains and fades, Holy wards itself and pierces Block.
- **Elements:** ten elements with about twenty cards each and their own combos (burn/detonate, chill/freeze/shatter, shock/multi-hit, wet, growth/regen, poison stacking/doubling, block-to-damage, life steal, heal/smite). Weakness hits deal 2×.
- **Every run starts with five basic cards:** two Strikes, a random basic attack, a random basic spell and a Mana Potion, so openings differ. Each fight opens with two cards in hand and you draw one more per turn; unplayed cards stay in your hand.

## Project layout

```
index.html              page shell, loads everything below in order
css/style.css           all styling and animations
js/data/elements.js     elements, type chart, tiers, status effects
js/data/cards.js        the card library (293 cards) + ultimates + attribute upgrades
js/data/passives.js     machines, summons and traps: what each does once it sits in a slot
js/data/enemies.js      52 enemies, 10 bosses, natures, enemy passives
js/data/foecards.js     every creature's own abilities as cards (played by the creature, dropped when it is slain)
js/data/interludes.js   boosts and the automatic between-round events
js/engine/state.js      run state, save/load, round flow, random encounters, shop, XP, tiers
js/engine/combat.js     turn-based combat: damage, elements, statuses, enemy AI, ultimates, spoils
js/ui/sound.js          procedural sound effects (Web Audio: layered noise, sub thumps, chimes, reverb); 🔊 button mutes
js/ui/fx.js             particles, ambient embers, card flights, banners, counters
js/ui/components.js     card/enemy rendering, HUD, floating numbers, modals, help
js/ui/screens.js        main menu, battle, spoils, interlude, merchant, card library, game over
js/main.js              click and keyboard handling, boot
mac/main.swift          native wrapper (WebKit window + save bridge)
mac/build.sh            builds the .app into ./dist
```

## Adding a card

One line in `js/data/cards.js`:

```js
c('frost_nova','Frost Nova','spell','ice',2,5,'❄️',{dmg:9,v:2},[['dmg','dmg',{aoe:1}],['se','chill','v',{aoe:1}]]);
//  id          name        type    el   cost tier icon values   effects (first effect = the main line on the card face, the rest = extra lines)
// A machine, summon or trap is a card whose effect is ['passive', id]; the id's behaviour lives in js/data/passives.js.
```

Types: attack, spell, shield, skill, potion, mecha, summon, trap. Tier is 0 (basic) to 8 (ultimate). Effects: `dmg` (hits, aoe, pierce, ls, bv), `block`, `armor`, `se`, `ss`, `heal`, `healPct`, `draw`, `energy`, `maxEnergy`, `ult`, `selfDmg`, `cleanse`, `stat`, `passive`, `special` (execute, stDmg, doubleSt, spread, blockDmg, playedDmg, elBoost, retaliation, snipe, parry, redraw, sabotage, emp, pilfer, pilferAll, mimic). Options: `exhaust`, `consume`, `retain`, `unplayable`, `endTurnDmg`. Descriptions are generated from the effects.

## Balance knobs

- Enemy scaling: `hpMult` / `atkMult` in `state.js`.
- Tier drop curve: `tierWeights` in `state.js`. Tier multipliers and unlock rounds: `TIER` in `elements.js`.
- Rewards and prices: `goldReward`, `xpReward`, `evolvePrice`. Campfire values: `CAMP` in `state.js`.
- Interlude odds: `INTERLUDES` in `interludes.js`.
