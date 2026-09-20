# Deckfall Endless

A turn-based deck-building roguelike that crawls through fogged hex dungeons. Runs in any browser and as a native macOS or Windows app. No installation, no dependencies. The design is in `DESIGN.md`.

## Play

- **macOS app:** double-click `dist/Deckfall Endless.app` (rebuild any time with `./mac/build.sh`).
- **Windows app:** double-click `dist/Deckfall Endless.exe` (rebuild any time with `win\build.cmd`; needs nothing but Windows). It opens the game in its own window through the Edge (or Chrome) engine that is already on the machine, with a private profile under `%LOCALAPPDATA%\Deckfall Endless` so saves persist and nothing signs in or syncs.
- **Any browser:** double-click `Play.command`, or open `index.html` directly.
- Keyboard: in a dungeon, click a hex to walk there (the path shows as you hover) or step with Q E A D Z C; Space acts on the hex you stand on. In a fight A / D move the highlight along your hand, W goes up to the enemies (A / D pick the target, S comes back), Space plays the highlighted card, Tab ends the turn, E toggles the passives drawer, 1–9 play a card directly. On every other screen W A S D move the highlight over the choices and Space picks it.
- Saves happen automatically after every step. Death deletes the save: permadeath.
- **Card Library** (main menu, or the in-run menu): every card you have discovered across runs, with filters by element, type, tier, Mana cost and a search box. Undiscovered cards stay hidden until you meet them on a run.

## How a run flows

You start with five basic cards at the entrance of a hex dungeon: rooms joined by corridors, dead ends, an exit to find. Click a hex to walk there; you see three hexes around you and walls block sight, so rooms reveal themselves as you step in. Every new room raises the danger for the rest of that dungeon, and each dungeon starts two danger above the last, so you loot deeper or leave while you can. Themes (Rat Warrens, Sunken Grotto, Ember Forge, Frost Halls, Bone Crypt, Fungal Garden, Storm Spire, Ash Pits, Drowned Sanctum, Hydra Marsh) decide the creatures and the boss. Creatures are visible before they see you: most fight only when you step onto them, some sense you from a hex or two (their reach is tinted red), and then there is no running; the auto-walk stops at the edge of a known reach. Rooms hold guards, nests, chests, shrines, forges, campfires, blessings, idols, traps and people with offers. Every third dungeon a boss stands on the exit. Between dungeons the keeper rests you for gold, forges, sells one card, buys one, and holds your pack. Only in a fight does the view switch to the battle screen.

- **One long game:** your hand, your draw and discard piles, your Mana and your passives carry from fight to fight. A fight tops your hand up to five cards. Exhausted cards come back after the fight; enemy dispel knocks a passive out for that fight only.
- **One deck:** at most 20 cards travel with you. Anything more goes into your pack, and only the keeper lets you swap between deck and pack. The Deck button opens the manager: the carried twenty on top (with where each copy is: hand, draw pile, discard, in play), everything you own below, filtered by element, type, effect (damage, healing, block, buffs...), tier, cost, or a search.

- **Mana:** only spells and summons cost Mana. Attacks, shields, skills, potions, machines and traps are free. The first turn of every fight has 0 Mana; from the second turn on you gain 1 at the start of each turn (up to 10) and unspent Mana carries over. Cards and passives can add more. When nothing in hand can be played the turn ends by itself.
- **Passives:** machines (Mecha), summons and armed traps take a passive slot (3 to start, up to 5). Machines give standing bonuses, summons act every turn, traps spring on the next enemy attack. Enemies have passives too; Sabotage, EMP and Pilfer destroy or steal them, and some enemies dispel yours.
- **Tiers:** basic → common → uncommon → medium → good → great → rare → perfect → ultimate. Basic cards do exactly one plain thing (Strike: 3 damage). Getting a card you already own evolves it one tier and multiplies its numbers (an ultimate-evolved basic is 4.2× its base). Some cards are born ultimate.
- **Creature abilities:** each enemy and boss owns two or three abilities defined as real cards in `js/data/foecards.js` (`fc(owner, ...)`). It plays them between plain attacks, and when slain may drop one (30%, elites 60%, bosses always). Those cards never appear in offers: the creature is the only source. Fights are usually one creature; a second is rare and a third rarer.
- **Enemy natures:** every enemy fights by its element (`NATURE` in `js/data/enemies.js`): Physical crits, Beast enrages below half HP, Fire bursts into cinders when slain, Water regains HP while you are Wet, Ice grows frost armor, Lightning acts twice every third turn, Grass regrows, Poison has toxic blood, Earth wears stone skin, Shadow drains and fades, Holy wards itself and pierces Block.
- **Elements:** ten elements with about twenty cards each and their own combos (burn/detonate, chill/freeze/shatter, shock/multi-hit, wet, growth/regen, poison stacking/doubling, block-to-damage, life steal, heal/smite). Weakness hits deal 2×.
- **Every run starts with five basic cards:** two Strikes, a random basic attack, a random basic spell and a Mana Potion, so openings differ. Each fight opens with five cards in hand; each turn you draw one more, or two if your hand is empty, and unplayed cards stay in your hand.

## Project layout

```
index.html              page shell, loads everything below in order
css/style.css           all styling and animations
js/data/elements.js     elements, type chart, tiers, status effects
js/data/cards.js        the card library + attribute upgrade data
js/data/passives.js     machines, summons and traps: what each does once it sits in a slot
js/data/enemies.js      52 enemies, 10 bosses, natures, enemy passives
js/data/foecards.js     every creature's own abilities as cards (played by the creature, dropped when it is slain)
js/data/interludes.js   boosts and the automatic between-round events
js/engine/state.js      run state, save/load, spoils and interludes, blacksmith, XP, tiers
js/engine/world.js      dungeons: hex math, generation, fog with line of sight, walking, sense ranges, events, the keeper, the persistent kit and the pack
js/engine/combat.js     turn-based combat: damage, elements, statuses, enemy AI, spoils
js/ui/sound.js          procedural sound effects (Web Audio: layered noise, sub thumps, chimes, reverb); 🔊 button mutes
js/ui/fx.js             particles, ambient embers, card flights, banners, counters
js/ui/components.js     card/enemy rendering, HUD, floating numbers, modals, help
js/ui/map.js            the dungeon screen (drawn once, patched in place) and the keeper
js/ui/deck.js           the deck manager: the carried deck on top, everything owned below with filters; swaps at the keeper
js/ui/screens.js        main menu, battle, spoils, interlude, merchant, card library, game over
js/main.js              click and keyboard handling, boot
mac/main.swift          native wrapper (WebKit window + save bridge)
mac/build.sh            builds the .app into ./dist
win/Program.cs          Windows launcher: unpacks the embedded game and opens it in an Edge/Chrome app window with its own profile
win/build.ps1           builds the .exe into ./dist with the C# compiler that ships with Windows (win/build.cmd is the double-click wrapper)
win/makeicon.ps1        draws AppIcon.ico (same design as the macOS icon)
tools/balance-sim.js    bot that plays whole runs through the real engine, for measuring balance (usage in the file header)
```

## Adding a card

One line in `js/data/cards.js`:

```js
c('frost_nova','Frost Nova','spell','ice',2,5,'❄️',{dmg:9,v:2},[['dmg','dmg',{aoe:1}],['se','chill','v',{aoe:1}]]);
//  id          name        type    el   cost tier icon values   effects (first effect = the main line on the card face, the rest = extra lines)
// A machine, summon or trap is a card whose effect is ['passive', id]; the id's behaviour lives in js/data/passives.js.
```

Types: attack, spell, shield, skill, potion, mecha, summon, trap. Tier is 0 (basic) to 8 (ultimate). Effects: `dmg` (hits, aoe, pierce, ls, bv), `block`, `armor`, `se`, `ss`, `heal`, `healPct`, `draw`, `energy`, `maxEnergy`, `selfDmg`, `cleanse`, `stat`, `passive`, `special` (execute, stDmg, doubleSt, spread, blockDmg, playedDmg, elBoost, retaliation, snipe, parry, redraw, sabotage, emp, pilfer, pilferAll, mimic). Options: `exhaust`, `consume`, `retain`, `unplayable`, `endTurnDmg`. Descriptions are generated from the effects.

## Balance knobs

- Enemy scaling: `hpMult` / `atkMult` in `state.js`, driven by danger (`dangerNow` in `world.js`: 1 + 2 per dungeon + 1 per room entered). Bosses: `BOSSES` in `enemies.js` and their moves in `foecards.js`, all on the same proportions; a boss fights at its dungeon's base danger plus `BOSS_RAMP` (5), however deep its room. Grid size, sight, danger per dungeon, boss cadence and the deck cap: the constants at the top of `world.js`.
- Tier drop curve: `tierWeights` in `state.js`. Tier multipliers and unlock rounds: `TIER` in `elements.js`.
- Rewards and prices: `goldReward`, `xpReward`, `evolvePrice`. Campfire values: `CAMP` in `state.js`.
- Room contents (guards, nests, finds, events) and corridor lurkers: the room loop in `genDungeon` in `world.js`.
