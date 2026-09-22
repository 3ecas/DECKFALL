// ===================== BALANCE SIMULATOR =====================
// A greedy bot that plays whole runs through the real engine (newGame, the dungeons, playCard, endTurn, spoils, events,
// the keeper), with the UI silenced and every delay removed, so hundreds of runs take seconds. Nothing here touches the game.
//
// How to use: serve the folder over http (any static server; file:// blocks script injection), open index.html in a
// browser, then paste this file into the developer console (or add it as a <script> after main.js). Then:
//   SIM.start(100, {maxDungeon:9})                   // 100 runs, each until death or the ninth dungeon
//   SIM.summary()                                     // dungeons reached, deaths by danger, fights by danger, lairs, ...
//   SIM.variant({hp:45, atk:6, buffet:3, breath:8, burn:3, block:8, thorns:2})   // retune the Inferno Drake in memory
//   await SIM.compare({a:{hp:45,atk:6}, b:{hp:60,atk:7}}, 100, {maxDungeon:9})   // several tunings side by side
//   SIM.deathLogs(5, 3)                               // the last log lines of three runs that died at danger 5
// Reload the page to get the real numbers back. The bot is a weak player (it loses fights a human would win), so read
// its results as a floor, not as what a human gets.
(function(){
  if (window.SIM) { console.log('SIM already installed'); return; }
  // ---- instant timers (with real cancellation) so engine sleeps and walks cost nothing ----
  const pending = new Map(); let nextId = 1;
  const ch = new MessageChannel();
  ch.port1.onmessage = ev => { const fn = pending.get(ev.data); if (fn) { pending.delete(ev.data); try { fn(); } catch (e) { console.error('timer error', e); } } };
  window.setTimeout = (fn, ms, ...args) => { const id = nextId++; pending.set(id, () => fn(...args)); ch.port2.postMessage(id); return id; };
  window.clearTimeout = id => { pending.delete(id); };
  const tick = () => new Promise(r => window.setTimeout(r, 0));
  // ---- silence the UI and persistence ----
  render = () => {}; sfx = () => {}; floatP = () => {}; floatE = () => {}; toast = () => {}; banner = () => {};
  save = () => {}; clearSave = () => {}; recordBest = () => null; markSeen = () => {};
  for (const k of Object.keys(FX)) if (typeof FX[k] === 'function') FX[k] = () => {};
  pickDeckCard = (title, cb) => { UI.modal = { type: 'pick', cb }; };
  autoEndCheck = () => {};

  // ---- card valuation (picks, forge and blacksmith choices, pack swaps, play order) ----
  function cardValue(id) {
    const d = CARD[id]; if (!d) return -100;
    if (d.type === 'curse') return -30;
    const v = cardVals(id); const atkStat = G ? PS('attack') : 0, spStat = G ? PS('spell') : 0;
    let s = 0;
    for (const f of d.fx) {
      const t = f[0];
      if (t === 'dmg') { const o = f[2] || {}; const hits = o.hits ? (typeof o.hits === 'string' ? v[o.hits] : o.hits) : 1; const per = (v[f[1]] || 0) + (d.type === 'attack' ? atkStat : d.type === 'spell' ? spStat : 0); s += per * hits * (o.aoe ? 1.25 : 1) + (o.pierce ? 2 : 0) + (o.ls ? per * hits * (o.ls / 100) * 0.5 : 0) + (o.bv ? 3 : 0); }
      else if (t === 'se') { const val = f[2] ? v[f[2]] : 1; const w = { burn: 1.6, poison: 2.2, vuln: 4, weak: 3, shock: 2, chill: 2.5, wet: 1, frozen: 8 }[f[1]] || 1; s += val * w * ((f[3] && f[3].aoe) ? 1.2 : 1); }
      else if (t === 'block') s += (v[f[1]] || 0) * 0.9;
      else if (t === 'armor') s += (v[f[1]] || 0) * 4;
      else if (t === 'heal') s += (v[f[1]] || 0) * 0.8;
      else if (t === 'healPct') s += (G ? G.p.maxHp : 40) * (v[f[1]] || 0) / 100 * 0.8;
      else if (t === 'draw') s += (v[f[1]] || 0) * 4;
      else if (t === 'energy') s += (v[f[1]] || 0) * 3;
      else if (t === 'maxEnergy') s += (v[f[1]] || 0) * 10;
      else if (t === 'ss') { const val = f[2] ? v[f[2]] : 1; const flat = ['dodgeNext', 'counterNext'].includes(f[1]); s += ({ str: 3.5, spellT: 2.5, regen: 4, thornsT: 1.5, critT: 0.3, dodgeT: 0.4, dodgeNext: 5, counterNext: 3 }[f[1]] || 1) * (flat ? 1 : val); }
      else if (t === 'selfDmg') s -= (v[f[1]] || 0) * 1.2;
      else if (t === 'cleanse') s += 3;
      else if (t === 'stat') s += (v[f[2]] || 0) * (f[1] === 'maxHp' ? 1.5 : 8);
      else if (t === 'passive') { const p = PASSIVES[f[1]]; s += 8 + (p && p.kind === 'trap' ? 4 : 6) + Object.values(v).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0); }
      else if (t === 'special') { const p = f[2] || {}; const m = p.m ? v[p.m] : 1; s += ({ execute: (v.dmg || 0) * 1.3 + atkStat, snipe: (v.dmg || 0) * 1.2 + atkStat, stDmg: m * 5, doubleSt: 8, spread: 3, blockDmg: m * 6, playedDmg: m * 6, elBoost: (v[p.v] || 0) / 4, retaliation: m * 3, parry: 4, redraw: 3, sabotage: 4, emp: 5, pilfer: 6, pilferAll: 8, mimic: 6, packStatus: (v[p.v] || 1) * 1.5, tutor: (v[p.n] || 1) * 4, packBuff: (v[p.v] || 1) * 4, pack: (v[p.m] || 1) * 4 })[f[1]] || 3; }
    }
    if (d.exhaust) s *= 0.75;
    s -= cardCost(id) * 2;
    return s;
  }
  function calcDmgEst(base, kind, el, e, o) {
    const F = G.fight; let d = base + (kind === 'phys' ? PS('attack') + F.str + pSum('atkBonus') : PS('spell') + F.spellT + pSum('spellBonus'));
    if (F.st.weak) d *= 0.75; d *= 1 + (elBoostPct(el) + (F.elBoost[el] || 0)) / 100;
    let mult = typeMult(el, e.el); if (e.st.wet) { if (el === 'light' || el === 'ice') mult *= 1.5; if (el === 'fire') mult *= 0.5; } if (e.st.vuln) mult *= 1.5; if (o.bv && e.st[o.bv]) mult *= (o.bvm || 2);
    return Math.round(d * mult);
  }
  function estDmg(id, e) {
    const d = CARD[id]; const v = cardVals(id); let total = 0; const kind = d.type === 'spell' ? 'spell' : 'phys';
    for (const f of d.fx) {
      if (f[0] === 'dmg') { const o = f[2] || {}; const hits = o.hits ? (typeof o.hits === 'string' ? v[o.hits] : o.hits) : 1; total += Math.max(0, calcDmgEst(v[f[1]] + (o.pp ? (v[o.pp] || 0) * packCount(deckOf(d), 'turn') : 0), kind, d.el, e, o) - (o.pierce ? 0 : e.armor)) * hits; }
      else if (f[0] === 'special') { const p = f[2] || {}; if (f[1] === 'execute') total += calcDmgEst(v.dmg, kind, d.el, e, {}) * (e.hp / e.maxHp < (p.pct || 30) / 100 ? 2 : 1); else if (f[1] === 'snipe') total += calcDmgEst(v.dmg, kind, d.el, e, {}); else if (f[1] === 'stDmg') total += (e.st[p.s] || 0) * (v[p.m] || 1); else if (f[1] === 'blockDmg') total += G.fight.block * (v[p.m] || 1); else if (f[1] === 'playedDmg') total += G.fight.played * (v[p.m] || 1); else if (f[1] === 'pack' && (p.what || 'dmg') === 'dmg') total += (v[p.m] || 1) * packCount(deckOf(d), p.scope || 'turn'); }
    }
    return total;
  }
  // ---- one player turn: greedy but not brainless ----
  async function playTurn() {
    const F = G.fight; let guard = 0;
    while (!F.over && G.phase === 'battle' && guard++ < 40) {
      const alive = F.enemies.filter(e => e.alive); if (!alive.length) break;
      const tgt = alive.reduce((a, b) => (a.hp + a.block) <= (b.hp + b.block) ? a : b); F.target = F.enemies.indexOf(tgt);
      const hand = F.hand.map((inst, i) => ({ inst, i, d: CARD[inst.id] })).filter(x => canPlay(x.inst));
      if (!hand.length) break;
      const hpFrac = G.p.hp / G.p.maxHp;
      const isHeal = d => d.fx.some(f => f[0] === 'heal' || f[0] === 'healPct') && !d.fx.some(f => f[0] === 'dmg');
      let pick = null;
      const setup = hand.filter(x => x.d.fx.some(f => f[0] === 'se' && f[1] === 'vuln') && !tgt.st.vuln); if (setup.length) pick = setup[0];
      if (!pick) { const needMana = F.hand.some(inst => CARD[inst.id].type === 'spell' && cardCost(inst.id) > F.energy); const gen = hand.filter(x => x.d.type !== 'spell' && x.d.fx.some(f => f[0] === 'energy' || f[0] === 'draw' || f[0] === 'maxEnergy')); if (gen.length && (needMana || F.hand.length >= 8)) pick = gen[0]; }
      if (!pick) { const heals = hand.filter(x => isHeal(x.d)); if (heals.length && hpFrac < 0.6) pick = heals[0]; }
      if (!pick) { const dmgs = hand.map(x => ({ x, e: estDmg(x.inst.id, tgt) })).filter(y => y.e > 0).sort((a, b) => b.e - a.e); if (dmgs.length) pick = dmgs[0].x; }
      if (!pick) { const others = hand.filter(x => !isHeal(x.d) || hpFrac < 0.95).filter(x => !(x.d.fx.some(f => f[0] === 'energy') && x.d.fx.length === 1 && F.hand.length < 8)); if (others.length) pick = others.sort((a, b) => cardValue(b.inst.id) - cardValue(a.inst.id))[0]; }
      if (!pick) break;
      const idx = F.hand.indexOf(pick.inst); if (idx < 0) break;
      await playCard(idx);
      if (G.phase !== 'battle' || F.over) return;
    }
    if (G.phase === 'battle' && !F.over) await endTurn();
  }
  // ---- exploring a dungeon: score every known hex, walk to the best, otherwise push the fog back, otherwise leave ----
  function frontier(t) { for (const [x, y] of hexNeighbors(t.x, t.y)) { const n = tileAt(x, y); if (n && !n.seen) return true; } return false; }
  function tileScore(t) {
    const p = G.p; const hpFrac = p.hp / p.maxHp; const lvl = p.level; const dng = G.round; const dist = hexDist(t.x, t.y, G.pos.x, G.pos.y); let v = 0;
    if (t.k === 'chest') v = 30; else if (t.k === 'shrine') v = hpFrac < 0.8 ? 35 : 5; else if (t.k === 'boost') v = 20; else if (t.k === 'forge') v = 25; else if (t.k === 'camp') v = hpFrac < 0.7 ? 30 : 12; else if (t.k === 'trap') v = 8; else if (t.k === 'idol') v = -5; else if (t.k === 'event') v = 15;
    else if (t.k === 'creature') v = hpFrac > 0.45 ? 20 - Math.max(0, dng - lvl - 2) * 6 : -20;
    else if (t.k === 'nest') v = (hpFrac > 0.7 && lvl >= dng - 1) ? 18 - Math.max(0, dng - lvl) * 6 : -30;
    else if (t.k === 'lair') v = (hpFrac > 0.8 && lvl >= dng) ? 25 : -50;
    else if (t.k === 'exit') v = 6 + G.dungeon.entered * 3 + (hpFrac < 0.5 ? 25 : 0);
    return v - dist * 1.2;
  }
  function explore() {
    if (UI.walk && UI.walk.length) return true;   // a walk in progress is progress
    const D = G.dungeon; const hot = hotTiles(); const tiles = D.t.filter(t => t.seen && !t.wall && t.k && t.k !== 'entry' && !S.skip.has(t)); let best = null, bs = 0;
    for (const t of tiles) { const s = tileScore(t); if (s > bs) { bs = s; best = t; } }
    if (best) { walkTo(best.x, best.y); if (!UI.walk) S.skip.add(best); return true; }
    const pool = D.t.filter(t => t.seen && !t.wall && !t.k && frontier(t) && !S.skip.has(t) && !hot.has(t.y * D.w + t.x));
    if (pool.length) { pool.sort((a, b) => hexDist(a.x, a.y, G.pos.x, G.pos.y) - hexDist(b.x, b.y, G.pos.x, G.pos.y)); walkTo(pool[0].x, pool[0].y); if (!UI.walk) S.skip.add(pool[0]); return true; }
    const out = D.t.find(t => t.seen && (t.k === 'exit' || t.k === 'lair')); if (out && !S.skip.has(out)) { walkTo(out.x, out.y); if (!UI.walk) S.skip.add(out); return true; }
    const foes = D.t.filter(t => t.seen && (t.k === 'creature' || t.k === 'nest' || t.k === 'lair') && !S.skip.has(t)).sort((a, b) => hexDist(a.x, a.y, G.pos.x, G.pos.y) - hexDist(b.x, b.y, G.pos.x, G.pos.y));   // nothing else left: fight whatever blocks the way
    if (foes.length) { walkTo(foes[0].x, foes[0].y); if (!UI.walk) S.skip.add(foes[0]); return true; }
    return false;
  }
  function atKeeper() {
    const p = G.p; const K = G.keeper; if (!K) return;
    if (!K.used.rest && p.hp < p.maxHp * 0.75 && p.gold >= restCost()) keeperRest();
    const stash = (p.stash || []).slice().sort((a, b) => cardValue(b) - cardValue(a));
    for (const id of stash) { const worst = [...new Set(p.deck)].filter(x => !(p.kit.passives || []).some(q => q.inst && q.inst.id === x)).sort((a, b) => cardValue(a) - cardValue(b))[0]; if (p.deck.length < DECK_MAX) unstashCard(id); else if (worst && cardValue(id) > cardValue(worst) + 3) { stashCard(worst); unstashCard(id); } }
    if (!K.used.buy) { const best = K.offers.slice().sort((a, b) => cardValue(b) - cardValue(a))[0]; if (best && p.gold >= cardPrice(best) + restCost()) keeperBuy(best); }
    if (!K.used.smith) { const ids = [...new Set(p.deck)].filter(canEvolve).filter(id => p.gold >= evolvePrice(id)); if (ids.length) { keeperSmith(); if (G.phase === 'shop') { shopUpgrade(ids.sort((a, b) => cardValue(b) - cardValue(a))[0]); G.shop = null; G.phase = 'keeper'; } } }
    keeperDescend();
  }
  // ---- one full run ----
  async function runOne(opts) {
    opts = opts || {}; const maxDungeon = opts.maxDungeon || 9; const maxSteps = opts.maxSteps || 3000;
    const rec = { fights: [], boss: null, lairs: 0, diedDanger: null, result: null, error: null };
    clearTimeout(UI.timer); clearTimeout(UI.walkTimer); UI.walk = null; UI.busy = false; UI.modal = null; S.skip = new Set();
    newGame();
    let guard = 0, lastKey = null, stuck = 0, lastTime = -1, lastDungeon = 0;
    try {
      while (guard++ < 80000) {
        if (!G) break;
        if (G.dungeon && G.dungeon.n !== lastDungeon) { lastDungeon = G.dungeon.n; S.skip = new Set(); }
        if (G.phase === 'gameover') { rec.diedDanger = G.round; rec.diedDungeon = G.dungeon.n; rec.result = 'died'; rec.lastLog = G.log.slice(-10).map(l => l.m); break; }
        if (G.phase === 'battle') {
          const F = G.fight; if (!F || F.over) { await tick(); continue; }
          if (F.key !== lastKey) { lastKey = F.key; const e0 = F.enemies[0]; rec.fights.push({ danger: G.round, dungeon: G.dungeon.n, kind: F.o.boss ? 'boss' : F.o.elite ? 'elite' : 'fight', forced: !!F.o.forced, ids: F.enemies.map(e => e.id).join('+'), hp0: G.p.hp, maxHp: G.p.maxHp, ehp: F.enemies.reduce((a, e) => a + e.maxHp, 0), eatk: e0.atk, turns: 0, level: G.p.level }); if (F.o.boss) rec.boss = rec.fights[rec.fights.length - 1]; }
          rec.fights[rec.fights.length - 1].turns = F.turn;
          if (F.turn > 80) { rec.result = 'stalemate'; break; }
          await playTurn(); continue;
        }
        const last = rec.fights[rec.fights.length - 1]; if (last && last.hp1 == null) { last.hp1 = G.p.hp; last.won = true; if (last.kind === 'boss') rec.lairs++; S.skip = new Set(); }
        if (G.phase === 'spoils') {
          const r = G.spoils;
          if (!r.cardTaken && r.cards) { const best = r.cards.slice().sort((a, b) => cardValue(b) - cardValue(a))[0]; spoilsPickCard(best); }
          else if (r.drop && !r.dropTaken) { if (cardValue(r.drop.id) > 0) spoilsTakeDrop(); else spoilsSkipDrop(); }
          else if (spoilsDone(r)) spoilsMaybeContinue();
          await tick(); continue;
        }
        if (G.phase === 'interlude') {
          const I = G.inter;
          if (I && !I.picked) {
            if (I.t === 'event') eventChoose(0);
            else if (I.t === 'forge' && !I.auto) { forgePick(); const m = UI.modal; if (m && m.cb) { UI.modal = null; const ids = [...new Set(G.p.deck)].filter(canEvolve); const best = ids.sort((a, b) => cardValue(b) - cardValue(a))[0]; m.cb(best); } }
            else if (I.t === 'camp') campChoose(G.p.hp < G.p.maxHp * 0.65 ? 'rest' : 'tough');
            else if (I.t === 'treasury' && I.cards) { const best = I.cards.slice().sort((a, b) => cardValue(b) - cardValue(a))[0]; interludePick(best); }
          }
          await tick(); continue;
        }
        if (G.phase === 'shop') { const ids = [...new Set(G.p.deck)].filter(canEvolve).filter(id => G.p.gold >= evolvePrice(id)); if (ids.length) shopUpgrade(ids.sort((a, b) => cardValue(b) - cardValue(a))[0]); if (G.keeper) { G.shop = null; G.phase = 'keeper'; } else backToMap(); await tick(); continue; }
        if (G.phase === 'keeper') { if (G.dungeon.n >= maxDungeon) { rec.result = 'survived'; break; } atKeeper(); await tick(); continue; }
        if (G.phase === 'map') {
          if ((G.time || 0) >= maxSteps) { rec.result = 'survived'; break; }
          if (G.time === lastTime) { if (++stuck > 300) { rec.result = 'stuck'; break; } } else { stuck = 0; lastTime = G.time; }
          if (G.dungeon.entered !== S.lastRoom) { S.lastRoom = G.dungeon.entered; S.skip = new Set(); } if (!explore()) { stuck += 50; }
          await tick(); continue;
        }
        await tick();
      }
    } catch (e) { rec.error = String(e && e.stack || e); console.error(e); }
    const lastF = rec.fights[rec.fights.length - 1];
    if (lastF && lastF.hp1 == null) { lastF.hp1 = G ? G.p.hp : 0; lastF.won = rec.result !== 'died'; if (rec.result === 'died' && G && G.fight) lastF.ehpLeft = G.fight.enemies.filter(e => e.alive).reduce((a, e) => a + e.hp, 0); }
    rec.level = G ? G.p.level : null; rec.maxHp = G ? G.p.maxHp : null; rec.deck = G ? G.p.deck.slice() : null; rec.dungeon = G && G.dungeon ? G.dungeon.n : null; rec.rooms = G && G.dungeon ? G.dungeon.entered : null; rec.time = G ? G.time : null; rec.kills = G ? G.kills : null;
    return rec;
  }
  const S = window.SIM = { results: [], running: false, label: 'base', skip: new Set(), cardValue, estDmg, runOne, tick, explore, tileScore };
  S.reset = label => { S.results = []; S.label = label || 'base'; };
  S.start = async function (n, opts) { S.running = true; const t0 = performance.now(); for (let i = 0; i < n; i++) { const r = await runOne(opts); r.label = S.label; S.results.push(r); } S.running = false; S.ms = performance.now() - t0; return S.summary(); };
  S.summary = function (label) {
    const rs = S.results.filter(r => !label || r.label === label); const n = rs.length; if (!n) return 'no runs';
    const avg = a => a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : null;
    const deaths = {}; for (const r of rs) if (r.result === 'died') deaths[r.diedDanger] = (deaths[r.diedDanger] || 0) + 1;
    const dungeons = {}; for (const r of rs) dungeons[r.dungeon] = (dungeons[r.dungeon] || 0) + 1;
    const results = {}; for (const r of rs) results[r.result] = (results[r.result] || 0) + 1;
    const fights = rs.flatMap(r => r.fights.filter(f => f.hp1 != null));
    const byDanger = {}; for (const f of fights) { const k = Math.min(24, f.danger); const b = byDanger[k] = byDanger[k] || { n: 0, won: 0, turns: 0, hpLost: 0 }; b.n++; if (f.won) b.won++; b.turns += f.turns; b.hpLost += f.hp0 - f.hp1; }
    for (const k in byDanger) { const b = byDanger[k]; byDanger[k] = `${b.n} fights · win ${(b.won / b.n).toFixed(2)} · ${(b.turns / b.n).toFixed(1)} turns · -${(b.hpLost / b.n).toFixed(1)} hp`; }
    const lairFights = fights.filter(f => f.kind === 'boss');
    return {
      label: label || S.label, runs: n, errors: rs.filter(r => r.error).length, results,
      dungeonReached: avg(rs.map(r => r.dungeon || 0)), dungeonsReachedCount: dungeons, rooms: avg(rs.map(r => r.rooms || 0)), steps: avg(rs.map(r => r.time || 0)), level: avg(rs.map(r => r.level || 0)), kills: avg(rs.map(r => r.kills || 0)), lairsCleared: avg(rs.map(r => r.lairs || 0)),
      deathsByDanger: deaths, fightsByDanger: byDanger,
      lairs: { fights: lairFights.length, wins: lairFights.filter(f => f.won).length, avgDanger: avg(lairFights.map(f => f.danger)), avgLevel: avg(lairFights.map(f => f.level)) },
      forcedShare: fights.length ? +(fights.filter(f => f.forced).length / fights.length).toFixed(2) : null,
      ms: Math.round(S.ms || 0),
    };
  };
  S.variant = function (v) {
    const b = BOSSES[0];
    if (v.hp) b.hp = v.hp; if (v.atk) b.atk = v.atk;
    if (v.buffet) CARD.f_wing_buffet.n.dmg = v.buffet;
    if (v.breath) CARD.f_dragon_breath.n.dmg = v.breath; if (v.burn) CARD.f_dragon_breath.n.v = v.burn;
    if (v.block) CARD.f_molten_scales.n.b = v.block; if (v.thorns) CARD.f_molten_scales.n.t = v.thorns;
    if (v.patch) v.patch();
    return { hp: b.hp, atk: b.atk };
  };
  S.compare = async function (variants, n, opts) { const out = []; for (const [label, v] of Object.entries(variants)) { S.variant(v); S.reset(label); await S.start(n, opts); out.push(Object.assign({ label }, S.summary())); } return out; };
  S.deathLogs = function (danger, k) { return S.results.filter(r => r.result === 'died' && r.diedDanger === danger).slice(0, k || 3).map(r => ({ fight: r.fights[r.fights.length - 1], log: r.lastLog })); };
  console.log('SIM installed');
})();
