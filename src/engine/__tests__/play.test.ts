import { describe, it, expect, vi, afterEach } from 'vitest';
import { gameReducer, trainingFor, visitTab } from '../state/reducer';
import { initialState } from '../state/initialState';
import type { GameState } from '../state/types';
import { nextStep } from '../state/guide';
import { enemyById, ENEMIES, MINE_DEPTHS, FOREST_DEPTHS, depthDef } from '../combat/enemies';
import { startBattle, submitAnswer, advance, verbFor, numberChoices, plateChoices, plateValue, arrayGiven, phaseIndex, applySpecial, recover, askTip, powerStrike } from '../combat/CombatEngine';
import { tipFor, trick } from '../combat/tips';
import { REGIONS, regionById } from '../curriculum/regions';
import { generateFromSkills, checkAnswer } from '../questions';
import { pureMultQuestion } from '../questions/multiplication';
import { createRng } from '../rng';
import type { Question } from '../types';

const cfg = { damageBonusPercent: 0, hintCharges: 1, shield: 0, difficulty: 2 as const };
function newGame(): GameState {
  let s = gameReducer(initialState(), { type: 'NEW_GAME' });
  s = gameReducer(s, { type: 'SEEN_INTRO' });
  return gameReducer(s, { type: 'CREATE_CHARACTER', name: 'Kid', avatar: '/assets/characters/avatar-01.svg', specialization: 'undecided' });
}
const talked = () => { let s = newGame(); while (s.dialogue) s = gameReducer(s, { type: 'DIALOGUE_NEXT' }); return s; };
/** Answer the current battle question right, whatever the verb. */
const hit = (s: GameState) => gameReducer(s, { type: 'BATTLE_ANSWER', given: String(s.battle!.question.answer) });
const miss = (s: GameState) => gameReducer(s, { type: 'BATTLE_ANSWER', given: String(s.battle!.question.answer + 1) });
function winBattle(s: GameState): GameState {
  let guard = 0;
  while (s.battle && s.battle.status === 'active' && guard++ < 200) { s = hit(s); if (s.battle!.status === 'active') s = gameReducer(s, { type: 'BATTLE_NEXT' }); }
  return s;
}
afterEach(() => vi.useRealTimers());

describe('Onboarding: adventure first', () => {
  it('opens the mines after the first short conversation, with the first fight one tap away', () => {
    const s0 = newGame();
    expect(s0.dialogue!.lines.length).toBeLessThanOrEqual(2);
    const s = talked();
    expect(s.world.unlockedRegions).toContain('mines');
    expect(s.quests['q.into-the-mines'].status).toBe('active');
    const step = nextStep(s);
    expect(step.action).toMatchObject({ type: 'START_BATTLE', enemyId: 'ore-slime', regionId: 'mines', depth: 1 });
    // The lesson is still there, but optional: it does not gate anything.
    expect(s.quests['q.first-principles'].status).toBe('active');
    const b = gameReducer(s, step.action);
    expect(b.screen).toBe('battle');
    expect(b.battle!.enemyId).toBe('ore-slime');
  });

  it('a finished lesson offers one tap back into the quest', () => {
    let s = talked();
    s = gameReducer(s, { type: 'START_LESSON', lessonId: 'l.mult-intro' });
    let guard = 0;
    while (s.lesson && !s.lesson.done && guard++ < 100) s = s.lesson.question && !s.lesson.feedback ? gameReducer(s, { type: 'LESSON_ANSWER', given: String(s.lesson.question.answer) }) : gameReducer(s, { type: 'LESSON_NEXT' });
    expect(s.screen).toBe('lesson');
    expect(s.lesson!.done).toBe(true);
    expect(s.stats.lessonsCompleted).toContain('l.mult-intro');
    const cont = gameReducer(s, { type: 'LESSON_CONTINUE' });
    expect(cont.lesson).toBeNull();
    expect(cont.screen).toBe('battle'); // straight back into the Mines
    const more = gameReducer(s, { type: 'LESSON_NEXT' });
    expect(more.lesson).toBeNull();
    expect(more.screen).toBe('lessons');
  });
});

describe('Math as actions', () => {
  const ore = enemyById('ore-slime')!;
  it('Gallery 1 uses at least two non-typing verbs in its first three questions; bosses and previews are always typed', () => {
    let b = startBattle(ore, 'mines', {}, 100, createRng(1), cfg, 1);
    const verbs = [b.verb];
    for (let i = 0; i < 4; i++) { b = submitAnswer(b, ore, String(b.question.answer), {}, cfg, 100).battle; if (b.status !== 'active') break; b = advance(b, ore, {}, createRng(i + 2), cfg); verbs.push(b.verb); }
    expect(verbs.slice(0, 3).filter((v) => v !== 'type').length).toBeGreaterThanOrEqual(2);
    const dragon = enemyById('multiplication-dragon')!;
    expect(startBattle(dragon, 'forge', {}, 100, createRng(2), cfg).verb).toBe('type');
    expect(verbFor(1, 1, pureMultQuestion(3, 4, createRng(1)), true)).toBe('type');
  });

  it('choices always hold the answer once, plates hold exactly one right product, arrays must have the right shape', () => {
    for (let a = 1; a <= 12; a++) for (let c = 1; c <= 12; c++) {
      const q = pureMultQuestion(a, c, createRng(a * 13 + c));
      const ch = numberChoices(q, createRng(a + c));
      expect(ch).toHaveLength(4); expect(new Set(ch).size).toBe(4);
      expect(ch.filter((x) => Number(x) === q.answer)).toHaveLength(1);
      if (!/^(\d+) × (\d+) = \?$/.test(q.expression)) continue;
      const pl = plateChoices(q, createRng(a * c + 1));
      expect(pl).toHaveLength(4);
      expect(pl.filter((e) => plateValue(e) === q.answer)).toHaveLength(1);
      const [x, y] = q.expression.match(/\d+/g)!.map(Number);
      expect(checkAnswer(q, arrayGiven(q, x, y))).toBe(true);
      expect(checkAnswer(q, arrayGiven(q, y, x))).toBe(true);
      if (x * y === 12 && x !== 2 && y !== 2) expect(checkAnswer(q, arrayGiven(q, 2, 6))).toBe(false); // same dots, wrong shape
    }
  });

  it('building an array lands the blow but does not count as recall for mastery', () => {
    let s = talked();
    s = gameReducer(s, { type: 'START_BATTLE', enemyId: 'ore-slime', regionId: 'mines', depth: 1 });
    expect(s.battle!.verb).toBe('array');
    s = hit(s);
    expect(s.battle!.enemyHp).toBe(40);
    expect(s.stats.totalAnswered).toBe(0);
  });
});

describe('A miss is a choice', () => {
  const golem = enemyById('stone-golem')!;
  const q0 = (seed: number) => startBattle(golem, 'mines', {}, 100, createRng(seed), cfg, 4);
  it('helper = half damage with the picture shown; clean retry = full damage', () => {
    let b = submitAnswer(q0(1), golem, '-5', {}, cfg, 100).battle;
    expect(b.recovery).toBe('choose'); expect(b.hintShown).toBe(false);
    const h = recover(b, 'helper');
    expect(h.recovery).toBe('helper'); expect(h.question.visualFirst).toBe(true); expect(h.verb).toBe('type');
    const hb = submitAnswer(h, golem, String(h.question.answer), {}, cfg, 100);
    expect(hb.battle.enemyHp).toBe(golem.hp - 10); expect(hb.countsForMastery).toBe(false);
    b = submitAnswer(q0(2), golem, '-5', {}, cfg, 100).battle;
    const r = submitAnswer(recover(b, 'retry'), golem, String(b.question.answer), {}, cfg, 100);
    expect(r.battle.enemyHp).toBe(golem.hp - 20);
    expect(r.battle.streak).toBe(0);
  });

  it('"train it" leaves for Arcade practice on that exact fact, earns a shield, and comes back to the same gallery with it', () => {
    vi.useFakeTimers(); let now = 1_000_000; vi.setSystemTime(now);
    let s = talked();
    s = gameReducer(s, { type: 'START_BATTLE', enemyId: 'stone-golem', regionId: 'mines', depth: 4 });
    const fact = s.battle!.question.factId!;
    s = miss(s);
    s = gameReducer(s, { type: 'BATTLE_RECOVER', choice: 'train' });
    expect(s.battle).toBeNull();
    expect(s.screen).toBe('arcade');
    expect(s.arcade!.mode).toBe('practice');
    expect(s.arcade!.question.factId).toBe(fact);
    expect(s.world.pendingTraining).toMatchObject({ regionId: 'mines', depth: 4, enemyId: 'stone-golem' });
    for (let i = 0; i < 5; i++) { now += 3000; vi.setSystemTime(now); s = gameReducer(s, { type: 'ARCADE_ANSWER', given: String(s.arcade!.question.answer) }); s = gameReducer(s, { type: 'ARCADE_NEXT' }); }
    expect(s.world.buff).toMatchObject({ shield: 20 });
    expect(s.world.pendingTraining!.earned).toBe(true);
    s = gameReducer(s, { type: 'PLAY_RETURN' });
    expect(s.arcade).toBeNull();
    expect(s.battle!.enemyId).toBe('stone-golem');
    expect(s.battle!.shield).toBe(20);
    expect(s.battle!.buffUsed).toContain('Training shield');
    expect(s.world.buff).toBeNull(); // spent
  });

  it('any strong Arcade run earns a smaller training medal for the next fight', () => {
    vi.useFakeTimers(); let now = 2_000_000; vi.setSystemTime(now);
    let s = talked();
    s = gameReducer(s, { type: 'ARCADE_START', game: 'mult', mode: 'practice', selection: 'mult:7' });
    for (let i = 0; i < 10; i++) { now += 2000; vi.setSystemTime(now); s = gameReducer(s, { type: 'ARCADE_ANSWER', given: String(s.arcade!.question.answer) }); s = gameReducer(s, { type: 'ARCADE_NEXT' }); }
    expect(s.world.buff).toMatchObject({ shield: 12 });
    expect(s.arcade!.shieldEarned).toBe(true);
  });

  it('bosses keep exam rules: a miss shows the hint and a retry deals no damage', () => {
    const dragon = enemyById('multiplication-dragon')!;
    const b = submitAnswer(startBattle(dragon, 'forge', {}, 100, createRng(3), cfg), dragon, '-1', {}, cfg, 100).battle;
    expect(b.recovery).toBeUndefined(); expect(b.hintShown).toBe(true);
    const r = submitAnswer(advance(b, dragon, {}, createRng(4), cfg), dragon, String(b.question.answer), {}, cfg, 100);
    expect(r.battle.enemyHp).toBe(b.enemyHp);
  });

  it('trainingFor routes facts and skills to the right Arcade drill', () => {
    expect(trainingFor(pureMultQuestion(6, 7, createRng(1)))).toMatchObject({ game: 'mult', selection: 'mult:fact:6x7' });
    const frac = generateFromSkills(['precalc.frac.add'], {}, { rng: createRng(1), difficulty: 2 });
    expect(trainingFor(frac)).toMatchObject({ game: 'precalc', selection: 'precalc:frac.add' });
  });
});

describe('Tips, power strikes and routes', () => {
  it('three teachers, three kinds of help, and none of them says the answer', () => {
    for (let a = 2; a <= 12; a++) for (let c = 2; c <= 12; c++) {
      const q: Question = { ...pureMultQuestion(a, c, createRng(a * c)), expression: `${a} × ${c} = ?` };
      for (const npc of ['vector', 'ada', 'brick'] as const) {
        const t = tipFor(npc, q);
        expect(t.startsWith(npc === 'vector' ? 'Vector' : npc === 'ada' ? 'Ada' : 'Brick')).toBe(true);
        // The answer never appears as a result (after =, →, a colon or in a count list).
        expect(t, `${npc} ${a}×${c}: ${t}`).not.toMatch(new RegExp(`(=|→|:|,)\\s*${a * c}(?![0-9])`));
      }
    }
    expect(trick(7, 8)).toContain('×7 is ×5 plus ×2');
    const b = askTip(startBattle(enemyById('fire-beast')!, 'mines', {}, 100, createRng(9), cfg, 5), 'ada');
    expect(b.tip!.npc).toBe('ada'); expect(b.hintCharges).toBe(0); expect(b.hintsUsed).toBe(1);
    expect(askTip(b, 'brick')).toBe(b); // one tip per charge
  });

  it('a power strike lands the blow, earns no mastery, and queues the fact to come back', () => {
    vi.useFakeTimers(); vi.setSystemTime(3_000_000);
    let s = talked();
    s = gameReducer(s, { type: 'START_BATTLE', enemyId: 'fire-beast', regionId: 'mines', depth: 5 });
    const e0 = s.character!.energy; const q = s.battle!.question;
    s = gameReducer(s, { type: 'BATTLE_POWER' });
    expect(s.character!.energy).toBe(e0 - 10);
    expect(s.battle!.enemyHp).toBe(enemyById('fire-beast')!.hp - 20);
    expect(s.battle!.retryQueue.map((r) => r.id)).toContain(q.id);
    expect(s.stats.totalAnswered).toBe(0);
    expect(powerStrike(startBattle(enemyById('multiplication-dragon')!, 'forge', {}, 100, createRng(1), cfg), enemyById('multiplication-dragon')!).feedback).toBeUndefined();
  });

  it('quiet routes are short and hard, loud routes long and easy, and a fight can be won either way', () => {
    let s = talked();
    const quiet = gameReducer(s, { type: 'START_BATTLE', enemyId: 'tunnel-goblin', regionId: 'mines', depth: 2, route: 'quiet' });
    const loud = gameReducer(s, { type: 'START_BATTLE', enemyId: 'tunnel-goblin', regionId: 'mines', depth: 2, route: 'loud' });
    expect(quiet.battle!.enemyMaxHp).toBe(60); expect(loud.battle!.enemyMaxHp).toBe(140);
    expect(quiet.battle!.route).toBe('quiet');
    s = winBattle(loud);
    expect(s.battle!.status).toBe('victory');
  });
});

describe('The world reacts', () => {
  it('a gallery side objective is completed once and shows up in the village', () => {
    let s = talked();
    s = gameReducer(s, { type: 'START_BATTLE', enemyId: 'ore-slime', regionId: 'mines', depth: 1 });
    s = winBattle(s);
    expect(s.world.sideDone).toContain('mines:1');
    expect(s.world.lastChange!.text).toContain('Pip');
    s = gameReducer(s, { type: 'BATTLE_CLOSE' });
    s = gameReducer(s, { type: 'START_BATTLE', enemyId: 'ore-slime', regionId: 'mines', depth: 1 });
    s = winBattle(s);
    expect(s.world.depthCleared.mines).toBe(1);
    expect(s.world.lastChange!.text).toContain('lantern 1');
    expect(s.world.lastChange!.text).not.toContain('..');
    expect(s.world.sideDone!.filter((k) => k === 'mines:1')).toHaveLength(1);
  });

  it('a boss victory carries the core home for a seating ceremony', () => {
    let s = talked();
    s = { ...s, battle: { ...startBattle(enemyById('multiplication-dragon')!, 'forge', {}, 100, createRng(5), cfg), status: 'victory' }, screen: 'battle' };
    s = gameReducer(s, { type: 'BATTLE_CLOSE' });
    expect(s.world.currentRegion).toBe('village');
    expect(s.world.ceremony).toBe('multiplication-dragon');
    s = gameReducer(s, { type: 'CEREMONY_DONE' });
    expect(s.world.ceremony).toBeNull();
    expect(s.world.lastChange!.text).toContain('Power Core I');
  });
});

describe('Boss set-pieces', () => {
  it('the Dragon changes phase at two-thirds and one-third, and its specials teach order and splitting', () => {
    const dragon = enemyById('multiplication-dragon')!;
    expect(phaseIndex(dragon, 900, 900)).toBe(0); expect(phaseIndex(dragon, 580, 900)).toBe(1); expect(phaseIndex(dragon, 280, 900)).toBe(2);
    let b = startBattle(dragon, 'forge', {}, 100, createRng(4), cfg);
    const seen = new Set<string>(); let n = 0;
    while (b.status === 'active' && n++ < 80) {
      if (b.special) seen.add(b.special.kind);
      expect(b.verb).toBe('type');
      b = submitAnswer(b, dragon, String(b.question.answer), {}, cfg, 100).battle;
      if (b.status === 'active') b = advance(b, dragon, {}, createRng(n), cfg);
    }
    expect(b.status).toBe('victory');
    expect(seen).toEqual(new Set(['mirror', 'split']));
    expect(b.log.some((l) => l.text.includes('Phase 2 — Mirror Scales'))).toBe(true);
    expect(b.log.some((l) => l.text.includes('Phase 3 — Split Breath'))).toBe(true);
    const m = applySpecial(pureMultQuestion(7, 8, createRng(1)), 'mirror')!;
    expect(m.q.answer).toBe(56); expect(m.text).toContain('order never changes a product');
    expect(applySpecial({ ...pureMultQuestion(7, 8, createRng(1)), expression: '7 × 8 = ?' }, 'split')!.text).toContain('7 × 5 + 7 × 3');
  });

  it('the Fraction Hydra asks each head its own kind of fraction', () => {
    const hydra = enemyById('fraction-hydra')!;
    let b = startBattle(hydra, 'fraction-forest', {}, 100, createRng(2), cfg);
    const bySkill: Record<number, Set<string>> = { 0: new Set(), 1: new Set(), 2: new Set() };
    let n = 0;
    while (b.status === 'active' && n++ < 60) {
      bySkill[b.phase ?? 0].add(b.question.masterySkillId);
      b = submitAnswer(b, hydra, String(b.question.answer), {}, cfg, 100).battle;
      if (b.status === 'active') b = advance(b, hydra, {}, createRng(n), cfg);
    }
    expect(b.status).toBe('victory');
    expect([...bySkill[0]]).toEqual(['precalc.frac.add']);
    expect([...bySkill[1]]).toEqual(['precalc.frac.mul']);
  });
});

describe('The road to calculus', () => {
  it('Fraction Forest is a real, reachable region with three groves and a boss', () => {
    const r = regionById('fraction-forest')!;
    expect(r.implemented).toBe(true);
    expect(FOREST_DEPTHS).toHaveLength(3);
    expect(depthDef('fraction-forest', 2)!.enemyId).toBe('bramble-knight');
    let s = talked();
    s = gameReducer(s, { type: 'TRAVEL', regionId: 'fraction-forest' });
    expect(s.world.currentRegion).toBe('village'); // needs the mines first
  });

  it('every region still ahead has a scout that can actually ask questions', () => {
    for (const r of REGIONS.filter((x) => !x.implemented && x.id !== 'advanced-regions')) {
      const e = enemyById(`scout-${r.id}`);
      expect(e, r.id).toBeTruthy();
      for (let i = 0; i < 6; i++) {
        const q = generateFromSkills(e!.skills, {}, { rng: createRng(i), difficulty: 2 });
        expect(Number.isFinite(q.answer), `${r.id} ${q.expression}`).toBe(true);
      }
    }
  });

  it('a scouting fight is free, stays out of locked regions, and marks the region scouted', () => {
    let s = talked();
    const e0 = s.character!.energy;
    s = gameReducer(s, { type: 'START_BATTLE', enemyId: 'scout-trig-mountains', regionId: 'trig-mountains', preview: true });
    expect(s.character!.energy).toBe(e0);
    expect(s.battle!.preview).toBe(true);
    s = winBattle(s);
    expect(s.world.scouted).toContain('trig-mountains');
    s = gameReducer(s, { type: 'BATTLE_CLOSE' });
    expect(s.screen).toBe('map');
    expect(s.world.currentRegion).toBe('village');
  });

  it('every gallery on the way to the Dragon has a side objective', () => {
    expect(MINE_DEPTHS.every((d) => d.side)).toBe(true);
    expect(ENEMIES.filter((e) => e.isBoss).every((e) => e.bossRules)).toBe(true);
  });
});

describe('What do they open first?', () => {
  it('logs each visit\'s first destination once', () => {
    let s = talked();
    s = gameReducer(s, { type: 'NAVIGATE', screen: 'arcade' });
    s = gameReducer(s, { type: 'NAVIGATE', screen: 'lessons' });
    expect(s.stats.opens!.map((o) => o.tab)).toEqual(['arcade']);
    s = gameReducer(initialState(), { type: 'LOAD', state: s });
    s = gameReducer(s, { type: 'TRAVEL', regionId: 'mines' });
    expect(s.stats.opens!.map((o) => o.tab)).toEqual(['arcade', 'play']);
    expect(visitTab({ type: 'START_LESSON', lessonId: 'x' })).toBe('learn');
    expect(visitTab({ type: 'NAVIGATE', screen: 'settings' })).toBeNull();
  });
});

import { worldView } from '../state/world';
import { road, ROAD } from '../state/road';

describe('The world view and the road', () => {
  it('clearing Gallery 1 visibly changes the village', () => {
    let s = talked();
    const before = worldView(s);
    expect(before.lanterns).toBe(0); expect(before.houses).toBe(0);
    for (let i = 0; i < 2; i++) { s = gameReducer(s, { type: 'START_BATTLE', enemyId: 'ore-slime', regionId: 'mines', depth: 1 }); s = winBattle(s); s = gameReducer(s, { type: 'BATTLE_CLOSE' }); }
    const after = worldView(s);
    expect(after.lanterns).toBe(1); expect(after.houses).toBe(1); expect(after.pip).toBe(true);
    expect(after.score).toBeGreaterThan(before.score);
    expect(after.charge).toMatchObject({ label: expect.stringContaining('Power Core I'), done: 1, total: 8 });
  });

  it('the road runs from multiplication to calculus, with every milestone trainable today', () => {
    const s = talked();
    const ms = road(s);
    expect(ms.map((m) => m.id)).toEqual(ROAD.map((m) => m.id));
    expect(ms[0]).toMatchObject({ name: 'Multiplication Core', status: 'playable' });
    expect(ms.find((m) => m.id === 'div')!.status).toBe('locked'); // built, but behind the Dragon
    expect(ms.find((m) => m.id === 'div')!.unlockHint).toContain('Dragon');
    expect(['locked', 'playable']).toContain(ms.find((m) => m.id === 'frac')!.status);
    expect(ms.find((m) => m.id === 'calc')!.status).toBe('scout');
    for (const m of ms) {
      expect(m.skillMastery.length).toBeGreaterThan(0);
      if (m.status === 'scout') expect(m.scoutEnemy, m.id).toBeTruthy();
    }
    const done = road({ ...s, stats: { ...s.stats, bossesDefeated: ['multiplication-dragon'] } });
    expect(done[0].status).toBe('done');
  });

  it('in the forest, the guide points at the next grove and then the Hydra', () => {
    let s = talked();
    s = { ...s, world: { ...s.world, currentRegion: 'fraction-forest', unlockedRegions: [...s.world.unlockedRegions, 'fraction-forest'] }, quests: { ...s.quests, 'q.into-the-mines': { status: 'completed', progress: {} } } };
    expect(nextStep(s).action).toMatchObject({ type: 'START_BATTLE', enemyId: 'fraction-sprite', depth: 1 });
    s = { ...s, world: { ...s.world, depthCleared: { ...s.world.depthCleared, 'fraction-forest': 3 } } };
    expect(nextStep(s).action).toMatchObject({ type: 'START_BATTLE', enemyId: 'fraction-hydra' });
  });
});
