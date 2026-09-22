# Deckfall: the dungeon redesign

The plan for turning Deckfall from a straight line of fights into dungeons you crawl. It is the reference for several
sessions of work; edit it freely. What is built already is marked in the stages at the end.

## The pitch

A hero with a deck climbs down through themed dungeons: a straight run of fights, an elite in the middle, a boss at the
bottom of every third, something that happens by itself after every fight, and the keeper between dungeons. What you
play persists: your hand, your piles, your Mana and the machines, summons and traps you have in play carry from fight
to fight, so a run is one long game where the build grows. The hero has almost no stats: Health and Armor, and
everything else comes from cards. The reference feeling is PokeRogue's climb (persistence, evolution, attrition, a shop
and people between fights) with Slay the Spire's table, without a party and without a map.

## Pillars

1. **The climb is the game.** Every step is a fight or its reward; the only choices between fights are the ones a find or a person asks.
2. **One long game.** Nothing resets between fights except Block, statuses and "this fight" buffs.
3. **Composition.** The board (today's passive slots) is where the run's identity lives: tribes, traits, placement. Decks
   (built, September 2026) are the first step: named groups of cards that read how many deck-mates were played before them.
4. **Growth you can feel.** Cards evolve, the board grows, danger rises with every room and every dungeon. Endless, readable.

## The dungeon

- **A plan, not a maze.** Dungeon n is `min(10, 6 + n)` fights in a row (`dungeonLen`): common creatures rolled up
  front with no repeats (an off-theme stranger before a repeat), an elite in the middle of every second dungeon, the
  boss last, always. The descent screen shows the plan; the HUD keeps it as a strip of icons.
- **The round is the fight count.** Everything scales by it: enemies (`hpMult`, `atkMult`, tuned for a long fight against
  the final boss at round 100 and a curve that keeps climbing past it), rewards, prices, card tiers (ultimate offers become the norm around round 64). A boss fights at its step (`BOSS_RAMP` is 0; bosses have twice a creature's base HP). Side fights do not count as rounds.
- **The final boss.** The Deckfall waits at round `FINAL_ROUND` (100); the dungeon that reaches it is cut to end there.
  Past it the climb goes on: the high score is the deepest round, and the title screen counts final bosses slain.
- **After every fight something comes by itself** (`afterFight`): a chest, a blessing, a shrine, a forge, a trap, an
  idol, an ambush or a person on the road (the events), weighted in `INTERLUDES`; every fourth fight a campfire; an
  elite leaves a chest; a boss its treasury. An ambush or a road fight is unplanned: it does not advance the plan.
- **Themes.** Rat Warrens (beast, poison), Sunken Grotto (water, lightning), Ember Forge (fire, earth), Frost Halls
  (ice, physical), Bone Crypt (shadow, holy), Fungal Garden (grass, poison), Storm Spire (lightning, earth), Ash Pits
  (earth, fire), Drowned Sanctum (holy, water), Hydra Marsh (poison, water), Dragon Roost (dragon, fire), Mind Vault
  (psychic, shadow), Windswept Peaks (flying, light), Fighting Pits (fighting, phys). A theme decides the creatures, the
  boss and the backdrop (`img/bg/<theme>.svg`). Consecutive dungeons never repeat a theme.
- **Endless.** Dungeons keep coming. Score is the deepest round.
- **The hex maze** (fog, rooms, corridors, sense ranges, walking) was built in September 2026 and cut the same month:
  walking was not fun for this game. Its code stays in git history (0.2.1 to 0.2.4).

## The keeper

Between dungeons, one screen: **rest** for gold (heal to full), the **blacksmith** (evolve one card), **buy** one of three
cards, **let go** of a card for gold, your **pack** (swap deck and pack), then **descend**. Each service once per visit.
Reaching the exit also pays a purse of gold.

## Persistence

Hand, draw pile, discard pile, exhaust pile, passives and Mana live on the run, not on the fight.

- A fight starts by topping the hand up to hand size, not by dealing a fresh one.
- Exhausted cards come back to the discard pile at the end of a fight (potions are still once per fight).
- A new card goes into your hand if there is room, else into the draw pile.
- Installed passives leave the deck while in play. Enemy dispel and sabotage knock a passive out for that fight (the
  card returns to the discard pile); they do not delete it.
- Mana carries over, capped at 10, and a fight's first turn still gives none, so you bank it between fights.
- **One deck of at most 20 cards** travels with you. Anything more goes into the pack, and only the keeper lets you swap
  (keep at least 5). The deck manager (the Deck button, or the keeper's Pack) shows the carried twenty on top, with where
  each copy is, and everything you own below with filters by element, type, effect, tier, cost and a search.
  Later: a wandering merchant or two inside dungeons.

## Decks (built)

Every nature type is a deck (`js/data/decks.js`, `deckOf` decides: a named sub-deck can come later). Any card belongs to its
element's deck; most stand alone, and each element has three to five synergy cards that read the rest through a few
primitives on top of the card vocabulary: damage per same-element card played earlier this turn (`pp`), a combo flag on any
effect (`ifPack`, only after another card of the element this turn), a rising chance to apply a status (`packStatus`), a
caller that pulls element-mates from the draw pile (`tutor`), a fight-long bonus for the whole element (`packBuff`) and a
payoff that counts the element's cards played this turn or this fight (`pack`). Creature abilities belong to their element
too, so the Rat Warrens feed a Poison deck. Offers lean toward the elements you hold and the theme's, so a deck assembles
over a run without a draft. Balance rule: a synergy card alone is a little weaker than a plain card of its tier; with two
element-mates before it, clearly stronger. Later: deck thresholds (four Poison cards played this fight: ...) and a board
tribe for each element.

## The board and compositions (stage two)

- Passive slots become positions: two rows of three, four unlocked at the start, more from bosses.
- Units (summons, machines) have HP and can die; the keeper and shrines heal them; the graveyard keeps the dead for
  revival effects. Front row takes enemy attacks first.
- Every unit and creature carries an element plus tags: tribes (Beast, Construct, Undead, Spirit, Dragon, Plant) and
  roles (Guardian, Striker, Caster, Support). Enemies field boards too (today's enemy passives).
- Traits are counted across your board with thresholds (Beast 2 / 4, Construct 2 / 4, ...) and element resonance
  (two Fire units: +25% fire). Adjacency bonuses on a few units make placement matter.
- Hand cards that read the board ("3 damage, +2 per Beast you control") are the combo payoffs.
- Dungeon themes act as field effects in fights ("Ember Forge: Fire units +2, Water units -1").

## Balance method

The curve (September 2026, immortal bot to round 1000): enemy HP and attack grow with the square of the round up to the final
boss at 100; past it HP grows linearly (an ultimate deck can still finish a fight) and attack with the square of the round, so
the endless climb kills rather than stalls. Card tiers reach ultimate around round 64. Max HP comes from levels (+8) and
campfires (a flat gain by round; the old +10% compounded to billions by round 900). The bot is a floor: it dies at the first
bosses about a quarter of the time and cannot beat the final boss in fewer than 20 turns; humans do better.

Every stage is measured with the bot in `tools/balance-sim.js` (whole runs through the real engine, hundreds in
seconds) before numbers are tuned. Bot win rates are a floor; humans do better. The linear-run tuning of the first boss
(about 40% bot win rate at danger 10) is the reference for what "a fair boss" looks like; every boss now sits on the
same proportions.

## Stages

1. **The climb** (built): dungeon plans, danger by fights and dungeons, themes and backdrops, finds and road events
   after every fight, bosses every third dungeon, the keeper, persistent hand, piles, passives and Mana, the deck cap
   and the pack. The hero keeps Health and Armor; powers come from cards. Health, Mana and Level are three orbs. A run opens with
   five basics of one element.
   **Decks** (built): every nature type is a deck, synergy cards for all fourteen, creature abilities in decks, element-leaning
   offers; the four newer natures (Dragon, Psychic, Flying, Fighting) with their cards, creatures, bosses and themes.
2. **Board**: positions, unit HP, tribes and traits, enemy boards, between-fight hand discard, theme field effects.
3. **Life below**: more events and people, keys and locked doors, wandering merchants, quests from the keeper,
   theme-flavoured card offers, secrets (the well is the first).
4. **Growth**: cards gain experience from play, roaming creatures, more themes and bosses.

## Decisions taken

Hero and deck, no party. A straight climb, no map (the hex maze was cut). No time clock: danger comes from fights and
dungeons. Few stats: Health and Armor on the hero, everything else from cards. Units die (stage two).
Six tribes at launch. Enemy dispel disables rather than destroys. One deck of 20, swaps only at the keeper.
Legendary cards live outside the tier ladder's offer pools: a flag on the card, a per-offer chance (`LEGEND_CHANCE`), no
new tier. The first one is a joke card, Dick, and the system is generic so the next one costs one line.
