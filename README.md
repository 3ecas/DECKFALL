# Deckfall Endless

A turn-based deck-building roguelike that crawls through fogged hex dungeons. Runs in any browser and as a native macOS or Windows app. No installation, no dependencies. The design is in `DESIGN.md`.

## Play

- **macOS app:** double-click `dist/Deckfall Endless.app` (rebuild any time with `./mac/build.sh`).
- **Windows app:** double-click `dist/Deckfall Endless.exe` (rebuild any time with `win\build.cmd`; needs nothing but Windows). It opens the game in its own window through the Edge (or Chrome) engine that is already on the machine, with a private profile under `%LOCALAPPDATA%\Deckfall Endless` so saves persist and nothing signs in or syncs.
- **Any browser:** double-click `Play.command`, or open `index.html` directly.
- Keyboard: in a dungeon, click a hex to walk there (the path shows as you hover) or step with Q E A D Z C; Space acts on the hex you stand on. In a fight A / D move the highlight along your hand, W goes up to the enemies (A / D pick the target, S comes back), Space plays the highlighted card, Tab ends the turn, E toggles the passives drawer, 1–9 play a card directly. On every other screen W A S D move the highlight over the choices and Space picks it.
- Saves happen automatically after every step. Death deletes the save: permadeath.
- **Battle HUD as objects:** your stats and buffs are isolated icons with their number in the corner, and a stat only appears once it is on (no row of zeros); Block is a shield on the HP bar, Mana is an orb, blessings and creature statuses use the same icon-and-number objects, and the top bar's buttons are icons. Hover anything for the explanation.
- **Card Library** (main menu, or the in-run menu): every card you have discovered across runs, with filters by element, type, tier, Mana cost and a search box. Undiscovered cards stay hidden until you meet them on a run.

## How a run flows

You start with five basic cards at the entrance of a hex dungeon: rooms joined by corridors, dead ends, an exit to find. Click a hex to walk there; you see three hexes around you and walls block sight, so rooms reveal themselves as you step in. Every new room raises the danger for the rest of that dungeon, and each dungeon starts two danger above the last, so you loot deeper or leave while you can. Themes (Rat Warrens, Sunken Grotto, Ember Forge, Frost Halls, Bone Crypt, Fungal Garden, Storm Spire, Ash Pits, Drowned Sanctum, Hydra Marsh, Dragon Roost, Mind Vault, Windswept Peaks, Fighting Pits) decide the creatures and the boss. Creatures are visible before they see you: most fight only when you step onto them, some sense you from a hex or two (their reach is tinted red), and then there is no running; the auto-walk stops at the edge of a known reach. Rooms hold guards, nests, chests, shrines, forges, campfires, blessings, idols and people with offers: a gambler, a blood altar, a wounded wanderer, a whispering well, a cutpurse, bandits, a traveler, a peddler; some of those wait in corridors, and a bad answer can end in a fight. Dungeons start small (five or six rooms) and grow two rooms with every dungeon: once a dungeon outgrows the screen the hexes stop shrinking, the view follows you when you near its edge, and you can drag the map to look around. Every third dungeon a boss stands on the exit. Between dungeons the keeper rests you for gold, forges, sells one card, buys one, and holds your pack. Only in a fight does the view switch to the battle screen.

- **One long game:** your hand, your draw and discard piles, your Mana and your passives carry from fight to fight. A fight tops your hand up to five cards. Exhausted cards come back after the fight; enemy dispel knocks a passive out for that fight only.
- **One deck:** at most 20 cards travel with you. Anything more goes into your pack, and only the keeper lets you swap between deck and pack. The Deck button opens the manager: the carried twenty on top (with where each copy is: hand, draw pile, discard, in play), everything you own below, filtered by element, type, effect (damage, healing, block, buffs...), tier, cost, or a search.

- **Mana:** only spells and summons cost Mana. Attacks, shields, skills, potions, machines and traps are free. The first turn of every fight has 0 Mana; from the second turn on you gain 1 at the start of each turn (up to 10) and unspent Mana carries over. Cards and passives can add more. When nothing in hand can be played the turn ends by itself.
- **Passives:** machines (Mecha), summons and armed traps take a passive slot (3 to start, up to 5). Machines give standing bonuses, summons act every turn, traps spring on the next enemy attack. Enemies have passives too; Sabotage, EMP and Pilfer destroy or steal them, and some enemies dispel yours.
- **Tiers:** basic → common → uncommon → medium → good → great → rare → perfect → ultimate. Basic cards do exactly one plain thing (Strike: 3 damage). Getting a card you already own evolves it one tier and multiplies its numbers (an ultimate-evolved basic is 4.2× its base), and every tier adds at least +1 to each value, so an upgrade always shows a bigger number; Mana and draw grow exactly +1 per tier (a common Mana Potion gives 2), multi-hit cards gain a hit every two tiers, and self-damage never grows. The keeper's smith lays the whole deck out at once; hovering a card shows it upgraded, clicking it shows before and after side by side and asks before reforging, and the Deck button swaps cards in from the pack without leaving. The dwarven forge asks the same way. The card frame grows with the tier: a plain line on basic, rivets, a double line, corner brackets, a filigree line, gold on ultimate. Some cards are born ultimate.
- **Legendary cards (★):** a card with `legendary:1` in `cards.js` never sits in a normal offer pool. Every offer has a small chance to slip one into its last slot (`LEGEND_CHANCE` in `state.js`: about 1% after a fight, 20% in a boss's treasury, scaled up to full by round 12 and by Luck), the keeper sells it at 2.5× price, and finding it again evolves it like any card. It wears a gold frame and a holographic art panel. One exists so far: Dick, a free rare Physical attack, 44 damage through Block, 3 self-damage, Exhaust, and it says what it says when played.
- **Creature abilities:** each enemy and boss owns two or three abilities defined as real cards in `js/data/foecards.js` (`fc(owner, ...)`). It plays them between plain attacks, and when slain may drop one (30%, elites 60%, bosses always). Those cards never appear in offers: the creature is the only source. Fights are usually one creature; a second is rare and a third rarer.
- **Enemy natures:** every enemy fights by its element (`NATURE` in `js/data/enemies.js`): Physical crits, Beast enrages below half HP, Fire bursts into cinders when slain, Water regains HP while you are Wet, Ice grows frost armor, Lightning acts twice every third turn, Grass regrows, Poison has toxic blood, Earth wears stone skin, Shadow drains and fades, Holy wards itself and pierces Block, Dragon ignores your Armor and pays double gold, Psychic drains Mana with every hit, Flying dodges a fifth of your cards, Fighting punches back.
- **Elements:** fourteen elements with fifteen to twenty cards each and their own combos (burn/detonate, chill/freeze/shatter, shock/multi-hit, wet, growth/regen, poison stacking/doubling, block-to-damage, life steal, heal/smite, dragon claws/breath/scales, psychic pierce and Weak/Vulnerable, flying dodge and multi-hit, fighting strength and counters). Weakness hits deal 2×.
- **Decks (synergies):** every nature type is a deck. Any card belongs to its element's deck; most stand alone, and every element has a few synergy cards that read the rest: a Rat is more likely to poison for every Poison card played before it this turn, the Plague Rat calls two Poison cards from the draw pile, the Rat King lifts every Poison card for the fight, Plague Wave counts the Poison cards of the whole fight; Wolf and One-Two grow per Beast or Fighting card, Cross and Backstab hit again after a card of their element (⛓ combo), every element has a caller (Kata, Wyrm Call, Ember Call...) and most have a fight-long buff (Hymn, Dragon's Pride, Pack Howl). A creature's abilities belong to its element too, so slaying rats feeds a Poison deck. Card offers lean toward the elements you hold (and a little toward the dungeon theme's), so a deck assembles over a run. `js/data/decks.js` holds the synergy vocabulary and cards; the Types screen lists every deck's synergy cards.
- **Every run starts with five basic cards:** two Strikes, a random basic attack, a random basic spell and a Mana Potion, so openings differ. Each fight opens with five cards in hand; each turn you draw one more, or two if your hand is empty, and unplayed cards stay in your hand.

## Project layout

```
index.html              page shell, loads everything below in order
css/style.css           all styling and animations
js/data/elements.js     elements, type chart, tiers, status effects
js/data/cards.js        the card library + attribute upgrade data
js/data/passives.js     machines, summons and traps: what each does once it sits in a slot
js/data/enemies.js     68 enemies, 14 bosses, natures, enemy passives
js/data/foecards.js     every creature's own abilities as cards (played by the creature, dropped when it is slain)
js/data/decks.js       decks: every nature type is one; the synergy vocabulary and the synergy cards of each element
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

The face shows each effect as a figure: the number, the element or status icon and a short unit (4 ☠️ DMG), extras as pills, keywords as small lines; hovering a card gives the full explanation. Types: attack, spell, shield, skill, potion, mecha, summon, trap. Tier is 0 (basic) to 8 (ultimate). Effects: `dmg` (hits, aoe, pierce, ls, bv), `block`, `armor`, `se`, `ss`, `heal`, `healPct`, `draw`, `energy`, `maxEnergy`, `selfDmg`, `cleanse`, `stat`, `passive`, `special` (execute, stDmg, doubleSt, spread, blockDmg, playedDmg, elBoost, retaliation, snipe, parry, redraw, sabotage, emp, pilfer, pilferAll, mimic). Options: `exhaust`, `consume`, `retain`, `unplayable`, `endTurnDmg`. Descriptions are generated from the effects.

Deck synergies (`js/data/decks.js`; a card's deck is its element, `deckOf` in that file): `['dmg','dmg',{pp:'k'}]` adds `k` damage per deck card played earlier this turn; any effect with `{ifPack:1}` in its options is a combo that only fires after another deck card this turn (a ⛓ pill on the face); `['special','packStatus',{s:'poison',v:'v',base:20,per:30}]` is a base% chance (+per% per deck card played earlier this turn) to apply the status; `['special','tutor',{n:'n'}]` draws `n` random deck cards from the draw pile (then the discard) into the hand; `['special','packBuff',{v:'k'}]` gives every card of the deck +`k` damage for the rest of the fight; `['special','pack',{what:'dmg'|'block'|'heal'|'energy'|'draw',m:'m',scope:'turn'|'fight',aoe:1,pierce:1}]` gives `m` per deck card played earlier this turn or this fight. The fight keeps the counters (`deckTurn`, `deckFight`, `deckBuff` on `G.fight`); the HUD shows them as chips.

## Balance knobs

- Enemy scaling: `hpMult` / `atkMult` in `state.js`, driven by danger (`dangerNow` in `world.js`: 1 + 2 per dungeon + 1 per room entered). Bosses: `BOSSES` in `enemies.js` and their moves in `foecards.js`, all on the same proportions; a boss fights at its dungeon's base danger plus `BOSS_RAMP` (5), however deep its room. Dungeon growth (`dungeonSize`: rooms per dungeon and hexes per room), sight, danger per dungeon, boss cadence and the deck cap: the top of `world.js`. Hex size limits and the camera's edge margin: `hexMetrics` and `updateCamera` in `map.js`.
- Tier drop curve: `tierWeights` in `state.js`. Tier multipliers and unlock rounds: `TIER` in `elements.js`.
- Rewards and prices: `goldReward`, `xpReward`, `evolvePrice`. Campfire values: `CAMP` in `state.js`.
- Deck offers: `DECK_PULL` in `state.js` (share of offer slots that lean toward an element you hold: two points per card beyond the first of that element, 1.5 per element of the dungeon theme).
- Room contents (guards, nests, finds, events), corridor lurkers and road events: the room loop in `genDungeon` and `EVENTS` in `world.js`. Traps are gone; they paid too much gold.
