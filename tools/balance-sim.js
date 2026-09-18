// ===================== BALANCE SIMULATOR =====================
// A greedy bot that plays whole runs through the real engine (newGame, playCard, endTurn, spoils, interludes, shop), with the
// UI silenced and every animation delay removed, so hundreds of runs take seconds. Nothing here touches the game's own files.
//
// How to use: serve the folder over http (any static server; file:// blocks script injection), open index.html in a browser,
// then paste this file into the developer console (or add it as a <script> after main.js). Then:
//   SIM.start(200, {stopAfterBoss:true})            // play 200 runs up to and including the round-10 boss
//   SIM.summary()                                    // reach rate, boss win rate, fight lengths, deaths by round, ...
//   SIM.variant({hp:45, atk:6, buffet:3, breath:8, burn:3, block:8, thorns:2})   // retune the first boss in memory
//   await SIM.compare({a:{hp:45,atk:6}, b:{hp:60,atk:7}}, 200, {stopAfterBoss:true})   // several tunings side by side
//   SIM.deathLogs(8, 3)                              // the last log lines of three runs that died at round 8
// Reload the page to get the real numbers back. The bot is a weak player (it loses about one ordinary round-9 fight in six),
// so read its win rates as a floor, not as what a human gets.
(function(){
  if (window.SIM) { console.log('SIM already installed'); return; }
  // ---- instant timers (with real cancellation) so engine sleeps cost nothing ----
  const _setTimeout = window.setTimeout.bind(window);
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

  // ---- card valuation (used for picks, forge/shop choices and play order) ----
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
      else if (t === 'special') { const p = f[2] || {}; const m = p.m ? v[p.m] : 1; s += ({ execute: (v.dmg || 0) * 1.3 + atkStat, snipe: (v.dmg || 0) * 1.2 + atkStat, stDmg: m * 5, doubleSt: 8, spread: 3, blockDmg: m * 6, playedDmg: m * 6, elBoost: (v[p.v] || 0) / 4, retaliation: m * 3, parry: 4, redraw: 3, sabotage: 4, emp: 5, pilfer: 6, pilferAll: 8, mimic: 6 })[f[1]] || 3; }
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
      if (f[0] === 'dmg') { const o = f[2] || {}; const hits = o.hits ? (typeof o.hits === 'string' ? v[o.hits] : o.hits) : 1; total += Math.max(0, calcDmgEst(v[f[1]], kind, d.el, e, o) - (o.pierce ? 0 : e.armor)) * hits; }
      else if (f[0] === 'special') { const p = f[2] || {}; if (f[1] === 'execute') total += calcDmgEst(v.dmg, kind, d.el, e, {}) * (e.hp / e.maxHp < (p.pct || 30) / 100 ? 2 : 1); else if (f[1] === 'snipe') total += calcDmgEst(v.dmg, kind, d.el, e, {}); else if (f[1] === 'stDmg') total += (e.st[p.s] || 0) * (v[p.m] || 1); else if (f[1] === 'blockDmg') total += G.fight.block * (v[p.m] || 1); else if (f[1] === 'playedDmg') total += G.fight.played * (v[p.m] || 1); }
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
  // ---- one full run ----
  async function runOne(opts) {
    opts = opts || {}; const maxRound = opts.maxRound || 12;
    const rec = { fights: [], boss: null, diedRound: null, result: null, error: null };
    clearTimeout(UI.timer); UI.busy = false; UI.modal = null;
    newGame();
    let guard = 0, lastKey = null;
    try {
      while (guard++ < 20000) {
        if (!G) break;
        if (G.round > maxRound) { rec.result = 'survived'; break; }
        if (G.phase === 'gameover') { rec.diedRound = G.round; rec.result = 'died'; rec.lastLog = G.log.slice(-10).map(l => l.m); break; }
        if (G.phase === 'battle') {
          const F = G.fight; if (!F || F.over) { await tick(); continue; }
          if (F.turn > 80) { rec.result = 'stalemate'; break; }   // the bot can get stuck against a foe it cannot out-damage
          if (F.key !== lastKey) { lastKey = F.key; const e0 = F.enemies[0]; rec.fights.push({ round: G.round, kind: F.o.boss ? 'boss' : F.o.elite ? 'elite' : 'fight', n: F.enemies.length, ids: F.enemies.map(e => e.id).join("+"), hp0: G.p.hp, maxHp: G.p.maxHp, ehp: F.enemies.reduce((a, e) => a + e.maxHp, 0), eatk: e0.atk, turns: 0, level: G.p.level }); if (F.o.boss) rec.boss = rec.fights[rec.fights.length - 1]; }
          rec.fights[rec.fights.length - 1].turns = F.turn;
          await playTurn(); continue;
        }
        const last = rec.fights[rec.fights.length - 1]; if (last && last.hp1 == null && G.phase !== 'battle') { last.hp1 = G.p.hp; last.won = true; }
        if (G.phase === 'spoils') {
          const r = G.spoils;
          if (r.kind === 'boss' && opts.stopAfterBoss) { rec.result = 'boss_won'; break; }
          if (!r.cardTaken && r.cards) { const best = r.cards.slice().sort((a, b) => cardValue(b) - cardValue(a))[0]; spoilsPickCard(best); }
          else if (r.drop && !r.dropTaken) { if (cardValue(r.drop.id) > 0) spoilsTakeDrop(); else spoilsSkipDrop(); }
          else if (spoilsDone(r)) spoilsMaybeContinue();
          await tick(); continue;
        }
        if (G.phase === 'interlude') {
          const I = G.inter;
          if (I && !I.picked) {
            if (I.t === 'forge' && !I.auto) { forgePick(); const m = UI.modal; if (m && m.cb) { UI.modal = null; const ids = [...new Set(G.p.deck)].filter(canEvolve); const best = ids.sort((a, b) => cardValue(b) - cardValue(a))[0]; m.cb(best); } }
            else if (I.t === 'camp') campChoose(G.p.hp < G.p.maxHp * 0.65 ? 'rest' : 'tough');
            else if (I.t === 'treasury' && I.cards) { const best = I.cards.slice().sort((a, b) => cardValue(b) - cardValue(a))[0]; interludePick(best); }
          }
          await tick(); continue;
        }
        if (G.phase === 'shop') {
          if (!G.shop.used) { const ids = [...new Set(G.p.deck)].filter(canEvolve).filter(id => G.p.gold >= evolvePrice(id)); if (ids.length) shopUpgrade(ids.sort((a, b) => cardValue(b) - cardValue(a))[0]); }
          nextRound(); await tick(); continue;
        }
        await tick();
      }
    } catch (e) { rec.error = String(e && e.stack || e); console.error(e); }
    const lastF = rec.fights[rec.fights.length - 1];
    if (lastF && lastF.hp1 == null) { lastF.hp1 = G ? G.p.hp : 0; lastF.won = rec.result !== 'died'; if (rec.result === 'died' && G && G.fight) lastF.ehpLeft = G.fight.enemies.filter(e => e.alive).reduce((a, e) => a + e.hp, 0); }
    rec.level = G ? G.p.level : null; rec.maxHp = G ? G.p.maxHp : null; rec.attack = G ? G.p.attack : null; rec.deck = G ? G.p.deck.slice() : null; rec.finalRound = G ? G.round : null;
    return rec;
  }
  const S = window.SIM = { results: [], running: false, label: 'base', cardValue, estDmg, runOne, tick };
  S.reset = label => { S.results = []; S.label = label || 'base'; };
  S.start = async function (n, opts) { S.running = true; const t0 = performance.now(); for (let i = 0; i < n; i++) { const r = await runOne(opts); r.label = S.label; S.results.push(r); } S.running = false; S.ms = performance.now() - t0; return S.summary(); };
  S.summary = function (label) {
    const rs = S.results.filter(r => !label || r.label === label); const n = rs.length; if (!n) return 'no runs';
    const avg = a => a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : null;
    const deaths = {}; for (const r of rs) if (r.result === 'died') deaths[r.diedRound] = (deaths[r.diedRound] || 0) + 1;
    const reached = rs.filter(r => r.boss); const won = reached.filter(r => r.boss.won);
    const lost = reached.filter(r => !r.boss.won);
    const reg = rs.flatMap(r => r.fights.filter(f => f.kind === 'fight' && f.round >= 8 && f.round <= 9 && f.hp1 != null));
    const elite5 = rs.flatMap(r => r.fights.filter(f => f.kind === 'elite' && f.round === 5 && f.hp1 != null));
    return {
      label: label || S.label, runs: n, errors: rs.filter(r => r.error).length,
      deathsByRound: deaths,
      reachedBoss: reached.length, bossWins: won.length, killedBossButDiedToCinders: lost.filter(r => r.boss.ehpLeft === 0).length, bossWinRate: reached.length ? +(won.length / reached.length).toFixed(2) : null,
      bossFight: { turnsWon: avg(won.map(r => r.boss.turns)), turnsLost: avg(lost.map(r => r.boss.turns)), hpBefore: avg(reached.map(r => r.boss.hp0)), maxHp: avg(reached.map(r => r.boss.maxHp)), level: avg(reached.map(r => r.boss.level)), hpAfterWin: avg(won.map(r => r.boss.hp1)), bossHpLeftWhenLost: avg(lost.map(r => r.boss.ehpLeft)), bossHp: avg(reached.map(r => r.boss.ehp)), bossAtk: avg(reached.map(r => r.boss.eatk)) },
      regularR8to9: { fights: reg.length, winRate: reg.length ? +(reg.filter(f => f.won).length / reg.length).toFixed(2) : null, avgTurns: avg(reg.map(f => f.turns)), avgHpLost: avg(reg.map(f => f.hp0 - f.hp1)), avgEnemyHp: avg(reg.map(f => f.ehp)) },
      eliteR5: { fights: elite5.length, winRate: elite5.length ? +(elite5.filter(f => f.won).length / elite5.length).toFixed(2) : null, avgTurns: avg(elite5.map(f => f.turns)), avgHpLost: avg(elite5.map(f => f.hp0 - f.hp1)) },
      ms: Math.round(S.ms || 0),
    };
  };
  console.log('SIM installed');
})();

SIM.variant = function (v) {
  const b = BOSSES[0];
  if (v.hp) b.hp = v.hp; if (v.atk) b.atk = v.atk;
  if (v.buffet) CARD.f_wing_buffet.n.dmg = v.buffet;
  if (v.breath) CARD.f_dragon_breath.n.dmg = v.breath; if (v.burn) CARD.f_dragon_breath.n.v = v.burn;
  if (v.block) CARD.f_molten_scales.n.b = v.block; if (v.thorns) CARD.f_molten_scales.n.t = v.thorns;
  if (v.patch) v.patch();
  return { hp: b.hp, atk: b.atk, buffet: CARD.f_wing_buffet.n.dmg, breath: CARD.f_dragon_breath.n.dmg, burn: CARD.f_dragon_breath.n.v, block: CARD.f_molten_scales.n.b, thorns: CARD.f_molten_scales.n.t };
};
SIM.compare = async function (variants, n, opts) {
  const out = [];
  for (const [label, v] of Object.entries(variants)) {
    const applied = SIM.variant(v); SIM.reset(label); await SIM.start(n, opts); const s = SIM.summary();
    out.push({ label, applied, reached: s.reachedBoss, wins: s.bossWins, winRate: s.bossWinRate, cinderDeaths: s.killedBossButDiedToCinders, turnsWon: s.bossFight.turnsWon, turnsLost: s.bossFight.turnsLost, hpAfterWin: s.bossFight.hpAfterWin, bossHpLeft: s.bossFight.bossHpLeftWhenLost, bossHp: s.bossFight.bossHp, bossAtk: s.bossFight.bossAtk, hpBefore: s.bossFight.hpBefore, deaths: s.deathsByRound });
  }
  return out;
};
SIM.deathLogs = function (round, k) { return SIM.results.filter(r => r.result === 'died' && r.diedRound === round).slice(0, k || 3).map(r => ({ fight: r.fights[r.fights.length - 1], log: r.lastLog })); };
console.log('SIM extras installed');
