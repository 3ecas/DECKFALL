# Deckfall: the dungeon redesign

The plan for turning Deckfall from a straight line of fights into dungeons you crawl. It is the reference for several
sessions of work; edit it freely. What is built already is marked in the stages at the end.

## The pitch

A hero with a deck descends through randomly generated hex dungeons. Each dungeon is fogged: rooms joined by corridors,
dead ends, and an exit you have to find. Every room you enter raises the danger for the rest of that dungeon, so you
choose between looting deeper and leaving while you still can. Creatures live in the rooms; you see them before they see
you, and you choose your fights. Between dungeons the keeper heals you, forges, sells and buys. What you play persists:
your hand, your piles, your Mana and the machines, summons and traps you have in play carry from fight to fight, so a
run is one long game where the build grows. Fights use the battle view; every other moment is the dungeon map.
The reference feeling is PokeRogue's climb (persistence, evolution, attrition, a shop and people between fights) in a
dungeon crawl, without a Pokemon-style party and without a Slay the Spire route.

## Pillars

1. **Exploration over fighting.** The dungeon is the game. Fights are chosen, guarded rewards, or the price of carelessness.
2. **One long game.** Nothing resets between fights except Block, statuses and "this fight" buffs.
3. **Composition.** The board (today's passive slots) is where the run's identity lives: tribes, traits, placement.
4. **Growth you can feel.** Cards evolve, the board grows, danger rises with every room and every dungeon. Endless, readable.

## The dungeon

- **A hex maze on one screen.** Pointy-top hexes, roughly 24 by 17, that always fit the screen: the map never scrolls,
  nothing moves under the mouse. Rooms are blobs of 7 to 19 hexes, joined by corridors in a spanning tree plus a loop
  or two. Walls are solid; sight (3 hexes) does not pass through them, so a room reveals itself when you step in.
- **Click a hex to walk there;** the path shows while you hover. Q E A D Z C step one hex. Space acts on your hex.
  The walk stops at the edge of a known creature's sense range unless you clicked inside it on purpose.
- **Find the exit.** The exit is placed in the room farthest, by walking, from where you come in. It is hidden until
  you see it (a whispering well can show it to you). Stepping on it takes you to the keeper.
- **Danger by rooms and dungeons.** Danger = 1 + 2 x (dungeon - 1) + rooms entered - 1. Everything that used to read
  "round" reads that instead, so scaling, rewards and tiers all follow it. Dungeon 1 runs from danger 1 to about 8.
- **Themes.** Rat Warrens (beast, poison), Sunken Grotto (water, lightning), Ember Forge (fire, earth), Frost Halls
  (ice, physical), Bone Crypt (shadow, holy), Fungal Garden (grass, poison), Storm Spire (lightning, earth), Ash Pits
  (earth, fire), Drowned Sanctum (holy, water), Hydra Marsh (poison, water). A theme decides the creatures, the boss
  and, later, the cards and events. Consecutive dungeons never repeat a theme.
- **Rooms hold things.** Guards (one or two creatures, sometimes with a chest behind them), a nest (an elite and a
  chest), a find (chest, shrine, forge, campfire, blessing, idol, trap), an event (a gambler, a blood altar, a wounded
  wanderer, a whispering well), or nothing. Corridors hide the odd lurker or trap.
- **Sense ranges.** Beasts and shadow creatures notice you from 2 hexes, most others from 1, plants and stone from 0.
  Sight is 3, so a creature is always seen a step before it can sense you. Zones show tinted on the map. In the first
  dungeon the rooms near the entrance are timid (no sense). Once a creature has you, there is no fleeing.
- **A boss every third dungeon,** standing on the exit. It fights at its dungeon's base danger plus five, however deep
  its room, so the room ramp never makes a boss unfair. Beat it for its card, the treasury and one more passive slot.
- **Endless.** Dungeons keep coming, each starting two danger above the last. Score is the deepest dungeon and room.

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

Every stage is measured with the bot in `tools/balance-sim.js` (whole runs through the real engine, hundreds in
seconds) before numbers are tuned. Bot win rates are a floor; humans do better. The linear-run tuning of the first boss
(about 40% bot win rate at danger 10) is the reference for what "a fair boss" looks like; every boss now sits on the
same proportions.

## Stages

1. **Dungeons** (built): hex mazes with rooms and corridors, fog with line of sight, click and key movement on a
   fixed screen, the exit, danger by rooms and dungeons, themes, guards, nests, finds, four events, sense ranges,
   bosses every third dungeon, the keeper, persistent hand, piles, passives and Mana, the deck cap and the pack.
2. **Board**: positions, unit HP, tribes and traits, enemy boards, between-fight hand discard, theme field effects.
3. **Life below**: more events and people, keys and locked doors, wandering merchants, quests from the keeper,
   theme-flavoured card offers, secrets (the well is the first).
4. **Growth**: cards gain experience from play, roaming creatures, more themes and bosses.

## Decisions taken

Hero and deck, no party. Hex grid, whole dungeon on one screen. Sight 3, sense at most 2. Creatures visible and
avoidable, forced fights only by sense. No time clock: danger comes from rooms and dungeons. Units die (stage two).
Six tribes at launch. Enemy dispel disables rather than destroys. One deck of 20, swaps only at the keeper.
