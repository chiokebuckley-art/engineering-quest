import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';
import { strategiesFor, strategyFor, guidedSteps, coachChoice, placeParts, explain, type Op } from '../mentalmath/strategies';
import { generateProblem, generateForSkill, generateSet, type MMLevel } from '../mentalmath/generator';
import { MM_SKILLS, MM_WORLDS, MM_LESSONS, mmSkill, skillsInWorld } from '../mentalmath/curriculum';
import { diagnose } from '../mentalmath/errors';
import * as MM from '../mentalmath/session';
import { initialMental, applyResult, applySession, buildWorkout, recommend, skillState, worldUnlocked, dashboard, placementResult } from '../mentalmath/progress';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';
import type { GameState } from '../state/types';
import { skillById } from '../curriculum/skills';
import { checkAnswer } from '../questions';
import { questionFromProblem, mentalArcadeQuestion } from '../questions/mentalmath';
import { parseSelection, drawSeeded, blitzStars } from '../state/arcade';
import { ACHIEVEMENTS } from '../progression/achievements';


/** Play one whole problem the way the screen does: choose a route if asked, walk every step, then advance. */
function play(s: MM.MMSession, correct: boolean, t: number, rng = createRng(99)): MM.MMSession {
  let cur = s;
  if (cur.phase === 'choose') cur = MM.chooseStrategy(cur, MM.activeStrategy(cur).id, t);
  if (cur.phase === 'demo') cur = MM.beginAsk(cur, t);
  let guard = 0;
  while (cur.phase === 'ask' && guard++ < 12) {
    const ask = MM.currentAsk(cur);
    const give = correct || !ask.isFinal ? ask.expect : ask.expect + 3;
    cur = MM.answer(cur, String(give), t).session;
  }
  return MM.next(cur, rng, t);
}

const fresh = (): GameState => ({
  ...initialState(), screen: 'mental',
  character: { name: 'T', avatar: 'avatar-01', level: 1, xp: 0, hp: 100, maxHp: 100, energy: 50, maxEnergy: 50, specialization: 'mechanical', intelligence: 1, engineeringSkill: 1, createdAt: 0, title: 'Apprentice' } as unknown as GameState['character'],
});

describe('Mental math: strategy engine arithmetic', () => {
  it('never produces a strategy whose steps disagree with the real answer', () => {
    // A maths program must never teach a wrong answer: check every strategy over a wide sweep.
    let checked = 0;
    for (let a = 1; a <= 120; a++) {
      for (let b = 1; b <= 120; b++) {
        for (const op of ['add', 'sub', 'mul'] as Op[]) {
          if (op === 'sub' && b > a) continue;
          const truth = op === 'add' ? a + b : op === 'sub' ? a - b : a * b;
          for (const s of strategiesFor(op, a, b)) {
            expect(s.answer, `${a} ${op} ${b} via ${s.id}`).toBe(truth);
            expect(s.steps.length, `${a} ${op} ${b} via ${s.id} has no steps`).toBeGreaterThan(0);
            expect(s.steps[s.steps.length - 1].to, `${a} ${op} ${b} via ${s.id} final step`).toBe(truth);
            // Every chain step must actually follow from the previous running total.
            for (const st of s.steps) if (st.delta !== undefined) expect(st.from + st.delta, `${a} ${op} ${b} via ${s.id}: ${st.label}`).toBe(st.to);
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(50_000);
  });

  it('checks three-digit chains, including the worked examples from the curriculum', () => {
    for (const [a, b, op, want] of [[347, 286, 'add', 633], [398, 247, 'add', 645], [623, 287, 'sub', 336], [503, 487, 'sub', 16], [532, 211, 'sub', 321], [326, 4, 'mul', 1304], [125, 24, 'mul', 3000], [23, 17, 'mul', 391], [19, 24, 'mul', 456], [16, 25, 'mul', 400], [49, 51, 'mul', 2499], [32, 11, 'mul', 352], [17, 6, 'mul', 102]] as [number, number, Op, number][]) {
      for (const s of strategiesFor(op, a, b)) expect(s.answer, `${a} ${op} ${b} via ${s.id}`).toBe(want);
    }
    for (let a = 100; a <= 999; a += 7) for (let b = 100; b <= 999; b += 11) {
      for (const s of strategiesFor('add', a, b)) expect(s.answer).toBe(a + b);
      if (a > b) for (const s of strategiesFor('sub', a, b)) expect(s.answer).toBe(a - b);
    }
  });

  it('produces the specific chains the curriculum promises', () => {
    const chunks = strategyFor('add', 347, 286, 'place-chunks');
    expect(chunks.steps.map((s) => s.to)).toEqual([547, 627, 633]);
    const comp = strategyFor('add', 58, 39, 'compensate');
    expect(comp.steps.map((s) => s.to)).toEqual([98, 97]);
    const mk = strategyFor('add', 48, 27, 'make-ten');
    expect(mk.steps.map((s) => s.to)).toEqual([50, 75]);
    const cd = strategyFor('sub', 74, 32, 'count-down');
    expect(cd.steps.map((s) => s.to)).toEqual([44, 42]);
    const sc = strategyFor('sub', 74, 29, 'sub-compensate');
    expect(sc.steps.map((s) => s.to)).toEqual([44, 45]);
    const const_ = strategyFor('sub', 83, 48, 'constant-difference');
    expect(const_.steps.map((s) => s.to)).toEqual([85, 35]);
    const up = strategyFor('sub', 503, 487, 'count-up');
    expect(up.answer).toBe(16);
    // Counting up never hops past the target: 43 − 41 is one hop of 2, and every hop moves forward.
    const close = strategiesFor('sub', 43, 41).find((x) => x.id === 'count-up')!;
    expect(close.steps[0].label).toBe('41 → 43');
    for (let a = 12; a <= 999; a += 7) for (const b of [a - 1, a - 2, a - 9, a - 11, Math.floor(a / 2)]) {
      const c = strategiesFor('sub', a, b).find((x) => x.id === 'count-up');
      if (c) for (const st of c.steps.slice(0, -1)) expect(st.to! > st.from! && st.to! <= a, `${a} − ${b}: ${st.label}`).toBe(true);
    }
    const dist = strategyFor('mul', 23, 7, 'distribute');
    expect(dist.steps.map((s) => s.to)).toEqual([140, 161]);
    const dh = strategyFor('mul', 16, 25, 'double-half');
    expect(dh.id).toBe('double-half'); expect(dh.answer).toBe(400);
    const eleven = strategyFor('mul', 57, 11, 'times-eleven');
    expect(eleven.answer).toBe(627); expect(eleven.steps.some((s) => s.note?.includes('carry') || s.label.includes('carry'))).toBe(true);
  });

  it('ranks the cognitively easier route first and explains why', () => {
    // The coach must prefer a route that lands on a round number over plain chunking.
    const friendly = ['compensate', 'make-ten', 'near-double', 'friendly-pair'];
    const c = coachChoice('add', 99, 47);
    expect(friendly).toContain(c.best.id);
    expect(c.others.map((x) => x.id)).toContain('place-chunks');
    expect(c.reason.length).toBeGreaterThan(20);
    expect(friendly).toContain(coachChoice('add', 48, 27).best.id);
    // Chunking by place value is always on the menu as the safe default, whatever wins.
    for (const [a, b] of [[47, 36], [99, 47], [48, 27], [347, 286]]) {
      expect(strategiesFor('add', a, b).map((x) => x.id)).toContain('place-chunks');
    }
    // Close numbers must never be ranked as a borrow-style count-down.
    for (const [a, b] of [[72, 68], [503, 487], [61, 58]]) {
      const c = coachChoice('sub', a, b);
      expect(['count-up', 'constant-difference', 'sub-compensate'], `${a} − ${b} chose ${c.best.id}`).toContain(c.best.id);
      expect(strategiesFor('sub', a, b).map((x) => x.id)).toContain('count-up');
    }
    expect(coachChoice('sub', 874, 342).best.id).toBe('count-down');
    // Rounding 99 up to 100 must be on the menu, exactly as a learner would do it.
    const comp99 = strategiesFor('add', 99, 47).find((x) => x.id === 'compensate')!;
    expect(comp99.steps[0].to).toBe(146 + 1);
    // Splitting a number into place parts is exact.
    expect(placeParts(347)).toEqual([300, 40, 7]);
    expect(placeParts(906)).toEqual([900, 6]);
    expect(explain(strategyFor('add', 347, 286, 'place-chunks'), 'add', 347, 286).join(' ')).toContain('633');
  });

  it('turns every strategy into a guided chain that ends on the answer', () => {
    const rng = createRng(4);
    for (let i = 0; i < 400; i++) {
      const op = (['add', 'sub', 'mul'] as Op[])[i % 3];
      const a = 2 + Math.floor(rng.next() * 400);
      const b = 2 + Math.floor(rng.next() * (op === 'mul' ? 40 : 300));
      if (op === 'sub' && b >= a) continue;
      for (const s of strategiesFor(op, a, b)) {
        const g = guidedSteps(s);
        expect(g.length, `${a} ${op} ${b} ${s.id}`).toBeGreaterThan(0);
        expect(g[g.length - 1].expect, `${a} ${op} ${b} ${s.id}`).toBe(s.answer);
        for (const st of g) expect(Number.isFinite(st.expect)).toBe(true);
      }
    }
  });
});

describe('Mental math: problem generation', () => {
  it('generates correct, tagged, in-range problems for every skill at every level', () => {
    const rng = createRng(11);
    for (const sk of MM_SKILLS) {
      for (let lvl = 1 as MMLevel; lvl <= 6; lvl = (lvl + 1) as MMLevel) {
        for (let i = 0; i < 12; i++) {
          const p = generateForSkill(sk.id, lvl, rng);
          const truth = p.c !== undefined ? p.a + p.b + p.c : p.op === 'add' ? p.a + p.b : p.op === 'sub' ? p.a - p.b : p.op === 'mul' ? p.a * p.b : p.answer;
          expect(p.answer, `${sk.id} lvl${lvl}: ${p.prompt}`).toBe(truth);
          expect(p.answer, `${sk.id}: ${p.prompt}`).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(p.answer)).toBe(true);
          expect(p.strategy.answer, `${sk.id}: ${p.prompt} strategy`).toBe(p.answer);
          expect(p.tag).toBe(sk.tag);
          expect(p.prompt.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('makes the tagged strategy actually apply to its problems', () => {
    const rng = createRng(21);
    const want: [string, string][] = [
      ['mm.add2.make10', 'make-ten'], ['mm.add2.comp', 'compensate'], ['mm.add2.double', 'near-double'],
      ['mm.add3.comp', 'compensate'], ['mm.sub2.comp', 'sub-compensate'], ['mm.sub2.countup', 'count-up'],
      ['mm.sub2.constant', 'constant-difference'], ['mm.sub3.comp', 'sub-compensate'], ['mm.mul.comp', 'mul-compensate'],
      ['mm.mul.11', 'times-eleven'], ['mm.mul.squares', 'diff-squares'], ['mm.mul.by5', 'factor-split'], ['mm.mul.dh', 'double-half'],
    ];
    for (const [skillId, strat] of want) {
      let hits = 0;
      for (let i = 0; i < 30; i++) if (generateForSkill(skillId, 3, rng).strategy.id === strat) hits++;
      expect(hits, `${skillId} should mostly teach ${strat}`).toBeGreaterThanOrEqual(27);
    }
  });

  it('avoids repeats inside a set and honours the working-memory ladder', () => {
    const rng = createRng(5);
    const set = generateSet('mm.add3.chunks', 4, 10, rng);
    expect(new Set(set.map((p) => p.prompt)).size).toBe(10);
    const easy = generateSet('mm.add3.chunks', 1, 12, createRng(6));
    const hard = generateSet('mm.add3.chunks', 5, 12, createRng(6));
    const avg = (xs: typeof easy) => xs.reduce((a, p) => a + p.b, 0) / xs.length;
    expect(avg(easy)).toBeLessThan(avg(hard));
  });
});

describe('Mental math: error analysis', () => {
  it('names the mistake instead of just saying wrong', () => {
    const rng = createRng(3);
    const p = generateProblem('add3-chunks', 'mm.add3.chunks', 4, rng);
    const mid = p.strategy.steps[0].to;
    expect(diagnose(p, String(mid)).kind).toBe('lost-intermediate');
    expect(diagnose(p, '').kind).toBe('blank');
    const comp = generateProblem('add2-compensate', 'mm.add2.comp', 3, createRng(9));
    const adj = comp.strategy.steps.find((s) => s.note?.includes('too many'))!;
    expect(diagnose(comp, String(comp.answer + 2 * Math.abs(adj.delta!))).kind).toBe('compensation-direction');
    expect(diagnose(comp, String(comp.answer + Math.abs(adj.delta!))).kind).toBe('lost-intermediate');
    expect(diagnose(p, String(p.answer + 1)).kind).toBe('slip');
    // 532 − 287 answered by taking the smaller digit from the larger in each column.
    const sub = { ...generateProblem('sub3-chunks', 'mm.sub3.chunks', 3, createRng(2)), a: 532, b: 287, answer: 245, prompt: '532 − 287', op: 'sub' as const };
    expect(diagnose(sub, '355').kind).toBe('borrow');
    expect(diagnose(sub, '819').kind).toBe('operation-confusion');
    const add = { ...sub, op: 'add' as const, answer: 819, prompt: '532 + 287' };
    expect(diagnose(add, '719').kind).toBe('carry');
    const mul = { ...sub, op: 'mul' as const, a: 23, b: 7, answer: 161, prompt: '23 × 7', strategy: strategyFor('mul', 23, 7, 'distribute') };
    expect(diagnose(mul, '140').kind).toBe('lost-intermediate');
    expect(diagnose(mul, '154').kind).toBe('fact-error');
  });
});

describe('Mental math: session and mastery', () => {
  it('walks scaffolded guided practice one intermediate step at a time', () => {
    const rng = createRng(7);
    let s = MM.startSession({ mode: 'guided', skillId: 'mm.add3.chunks', scaffold: 2, level: 4, now: 0 }, rng);
    expect(s.phase).toBe('ask');
    const steps = MM.stepsOf(s);
    expect(steps.length).toBeGreaterThan(1);
    // Wrong intermediate keeps the learner on the same step.
    let out = MM.answer(s, String(steps[0].expect + 1), 1000);
    expect(out.correct).toBe(false); expect(out.session.stepIndex).toBe(0); expect(out.session.results).toHaveLength(0);
    s = out.session;
    for (let i = 0; i < steps.length; i++) {
      out = MM.answer(s, String(MM.currentAsk(s).expect), 1000 + i * 500);
      s = out.session;
    }
    expect(s.results).toHaveLength(1);
    expect(s.results[0].correct).toBe(true);
    expect(s.phase).toBe('feedback');
  });

  it('removes scaffolding after four clean answers and hands it back after two misses', () => {
    const rng = createRng(8);
    let s = MM.startSession({ mode: 'independent', skillId: 'mm.add2.chunks', scaffold: 3, level: 2, now: 0 }, rng);
    let t = 0;
    const answerAll = (correct: boolean, n: number) => {
      for (let i = 0; i < n; i++) {
        t += 1000;
        s = play(s, correct, t);
      }
    };
    answerAll(true, 4);
    expect(s.scaffold, 'four clean answers should remove a level of help').toBeGreaterThan(3);
    const before = s.scaffold;
    answerAll(false, 2);
    expect(s.scaffold, 'two misses should hand help back').toBeLessThan(before);
  });

  it('runs a boss with phases and only falls when every question lands', () => {
    const rng = createRng(12);
    let s = MM.startSession({ mode: 'boss', skillId: 'mm.add2.mixed', level: 3, now: 0 }, rng);
    expect(s.boss).toBeTruthy();
    expect(s.problems.length).toBe(s.boss!.maxHp);
    let t = 0;
    while (s.status === 'active') { t += 800; s = play(s, true, t, rng); }
    expect(MM.bossBeaten(s)).toBe(true);
    expect(MM.report(s).accuracy).toBe(1);
  });

  it('adapts the placement challenge upward while the learner keeps passing', () => {
    const rng = createRng(13);
    let s = MM.startSession({ mode: 'placement', skillId: 'mm.make10', level: 2, now: 0 }, rng);
    let t = 0; let guard = 0;
    while (s.status === 'active' && guard++ < 60) { t += 700; s = play(s, true, t, rng); }
    expect(s.placement!.passed.length).toBeGreaterThan(3);
    const r = placementResult(s.placement!.passed);
    expect(r.worlds).toBeGreaterThan(1);
    expect(mmSkill(r.startSkill)).toBeTruthy();
  });

  it('reports the session honestly', () => {
    const rng = createRng(14);
    let s = MM.startSession({ mode: 'independent', skillId: 'mm.add2.chunks', scaffold: 5, level: 2, count: 4, now: 0 }, rng);
    let t = 0;
    for (let i = 0; i < 4; i++) { t += 2000; s = play(s, i !== 0, t, rng); }
    const rep = MM.report(s);
    expect(rep.solved).toBe(4); expect(rep.correct).toBe(3);
    expect(rep.accuracy).toBeCloseTo(0.75, 5);
    expect(rep.avgMs).toBeGreaterThan(0);
    expect(rep.commonError).toBeTruthy();
    expect(MM.passedMastery(s)).toBe(false);
  });
});

describe('Mental math: progress, adaptivity and integration', () => {
  it('unlocks worlds in order and recommends the weakest open skill', () => {
    let m = initialMental();
    expect(worldUnlocked(m, {}, 1)).toBe(true);
    expect(worldUnlocked(m, {}, 3)).toBe(false);
    expect(skillState(m, {}, 'mm.add3.chunks')).toBe('locked');
    const mastery: Record<string, { mastery: number }> = {};
    for (const sk of skillsInWorld(1)) mastery[sk.id] = { mastery: 80 };
    expect(worldUnlocked(m, mastery, 2)).toBe(true);
    for (const sk of skillsInWorld(2)) mastery[sk.id] = { mastery: 80 };
    expect(worldUnlocked(m, mastery, 3)).toBe(true);
    mastery['mm.add3.chunks'] = { mastery: 20 };
    m = applyResult(m, { problemId: 'x', prompt: '1+1', skillId: 'mm.add3.chunks', tag: 'add3-chunks', correct: false, timeMs: 9000, hints: 1, scaffold: 4, given: '3', answer: 2, error: 'carry' }, 1000);
    m = applyResult(m, { problemId: 'y', prompt: '1+1', skillId: 'mm.add3.chunks', tag: 'add3-chunks', correct: true, timeMs: 5000, hints: 0, scaffold: 4, given: '2', answer: 2 }, 2000);
    m = applyResult(m, { problemId: 'z', prompt: '1+1', skillId: 'mm.add3.chunks', tag: 'add3-chunks', correct: true, timeMs: 5000, hints: 0, scaffold: 4, given: '2', answer: 2 }, 3000);
    m = applyResult(m, { problemId: 'w', prompt: '1+1', skillId: 'mm.add3.chunks', tag: 'add3-chunks', correct: true, timeMs: 5000, hints: 0, scaffold: 4, given: '2', answer: 2 }, 4000);
    expect(m.skills['mm.add3.chunks'].attempts).toBe(4);
    expect(m.errors.carry).toBe(1);
    expect(recommend(m, mastery, 5000).skillId).toBe('mm.add3.chunks');
    // A spaced review becomes due and takes priority.
    expect(recommend(m, mastery, 4000 + 40 * 60_000).skillId).toBe('mm.add3.chunks');
    const d = dashboard(m, mastery);
    expect(d.solved).toBe(4); expect(d.accuracy).toBeCloseTo(0.75, 5);
    expect(d.weakest).toBeTruthy();
  });

  it('builds a personalised daily workout from the learner\'s own data', () => {
    const mastery: Record<string, { mastery: number }> = {};
    for (const sk of MM_SKILLS) mastery[sk.id] = { mastery: sk.op === 'sub' ? 25 : 80 };
    const plan = buildWorkout(initialMental(), mastery, Date.now());
    expect(plan.length).toBeGreaterThanOrEqual(4);
    expect(plan.some((b) => mmSkill(b.skillId)?.op === 'sub')).toBe(true);
    expect(plan.some((b) => b.mode === 'speed')).toBe(true);
    expect(plan.every((b) => mmSkill(b.skillId))).toBe(true);
  });

  it('is registered in the wider game: skills, generator, arcade, achievements', () => {
    for (const sk of MM_SKILLS) {
      const registered = skillById(sk.id);
      expect(registered, sk.id).toBeTruthy();
      expect(registered!.generator).toBe('mentalmath');
      expect(registered!.targetTimeMs).toBe(sk.targetMs);
      expect(MM_LESSONS[sk.id] || sk.world >= 9, `${sk.id} lesson`).toBeTruthy();
    }
    expect(MM_WORLDS).toHaveLength(10);
    const q = questionFromProblem(generateForSkill('mm.add3.chunks', 4, createRng(1)));
    expect(checkAnswer(q, String(q.answer))).toBe(true);
    expect(q.masterySkillId).toBe('mm.add3.chunks');
    expect(q.explanation.length).toBeGreaterThan(2);
    const mq = mentalArcadeQuestion('mul', 3, createRng(2));
    expect(mq.topic).toBe('Mental math');
    const sel = parseSelection('mm', 'mm:add');
    expect(sel.key).toBe('mm:add');
    expect(drawSeeded(sel, 5, 0).answer).toBe(drawSeeded(sel, 5, 0).answer);
    expect(blitzStars(15, 60_000, 'mm')).toBe(3);
    for (const id of ['mm-make10', 'mm-add3', 'mm-mul', 'mm-boss', 'mm-master', 'mm-1000', 'mm-speed']) {
      expect(ACHIEVEMENTS.some((a) => a.id === id), id).toBe(true);
    }
  });

  it('runs end to end through the reducer and stores progress on the learner', () => {
    let s = fresh();
    s = gameReducer(s, { type: 'MM_START', mode: 'independent', skillId: 'mm.add2.chunks', scaffold: 5, level: 2 });
    expect(s.mm).toBeTruthy(); expect(s.screen).toBe('mental');
    const total = s.mm!.problems.length;
    let guard = 0;
    while (s.mm!.status === 'active' && guard++ < 200) {
      if (s.mm!.phase === 'choose') { s = gameReducer(s, { type: 'MM_CHOOSE', strategy: MM.activeStrategy(s.mm!).id }); continue; }
      if (s.mm!.phase === 'demo') { s = gameReducer(s, { type: 'MM_BEGIN' }); continue; }
      if (s.mm!.phase === 'feedback') { s = gameReducer(s, { type: 'MM_NEXT' }); continue; }
      const ask = MM.currentAsk(s.mm!);
      const wrong = s.mm!.index === 0 && ask.isFinal;
      s = gameReducer(s, { type: 'MM_ANSWER', given: String(wrong ? ask.expect + 5 : ask.expect) });
    }
    expect(s.mm!.status).toBe('finished');
    // Core mastery, the answer log, the notebook and the academy record all saw it.
    expect(s.mastery['mm.add2.chunks']).toBeTruthy();
    expect(s.mastery['mm.add2.chunks'].attempts).toBe(total);
    expect(s.stats.mental.records.totalSolved).toBe(total);
    expect(s.stats.mental.records.totalCorrect).toBe(total - 1);
    expect(s.stats.mental.skills['mm.add2.chunks'].attempts).toBe(total);
    expect(s.stats.mental.sessions).toHaveLength(1);
    expect(s.answers.length).toBe(total);
    expect(s.notebook.length).toBe(1);
    expect(s.stats.totalAnswered).toBe(total);
    expect(s.character!.xp).toBeGreaterThan(0);
    s = gameReducer(s, { type: 'MM_EXIT' });
    expect(s.mm).toBeNull();
    // A fresh profile starts clean, and an old save without the academy still loads.
    const legacy = gameReducer(fresh(), { type: 'LOAD', state: { ...fresh(), stats: { ...fresh().stats, mental: undefined as never } } });
    expect(legacy.stats.mental.records.totalSolved).toBe(0);
    expect(legacy.stats.mental.skills).toEqual({});
  });

  it('starts a workout and a boss from the reducer', () => {
    let s = fresh();
    for (const sk of MM_SKILLS.slice(0, 12)) s = { ...s, mastery: { ...s.mastery, [sk.id]: { ...(s.mastery[sk.id] ?? {}), id: sk.id, mastery: 80, attempts: 8, correct: 8, streak: 8, bestStreak: 8, history: [1], times: [3000], avgTimeMs: 3000, lastPracticedAt: 0, firstPracticedAt: 0, srs: { stage: 1, dueAt: 0, lastReviewedAt: 0 } } as never } };
    s = gameReducer(s, { type: 'MM_WORKOUT' });
    expect(s.mm!.mode).toBe('workout');
    expect(s.mm!.problems.length).toBeGreaterThan(20);
    s = gameReducer(s, { type: 'MM_EXIT' });
    s = gameReducer(s, { type: 'MM_BOSS', world: 1 });
    expect(s.mm!.boss!.name).toBe(MM_WORLDS[0].boss.name);
    expect(s.mm!.problems.length).toBeGreaterThan(10);
  });

  it('tracks the speed ladder only when accuracy and the clock are both met', () => {
    const sk = mmSkill('mm.add2.chunks')!;
    const results = Array.from({ length: 10 }, (_, i) => ({ problemId: `p${i}`, prompt: '1+1', skillId: sk.id, tag: sk.tag, correct: true, timeMs: 4000, hints: 0, scaffold: 6 as const, given: '2', answer: 2 }));
    const passed = applySession(initialMental(), { skillId: sk.id, mode: 'speed', results, bestStreak: 10, passedMastery: false, targetMs: sk.speedLadder[0] * 1000, now: 1 });
    expect(passed.skills[sk.id].speedStep).toBe(1);
    const slow = applySession(initialMental(), { skillId: sk.id, mode: 'speed', results: results.map((r) => ({ ...r, timeMs: 30_000 })), bestStreak: 10, passedMastery: false, targetMs: sk.speedLadder[0] * 1000, now: 1 });
    expect(slow.skills[sk.id].speedStep).toBe(0);
    expect(passed.records.perfectRounds).toBe(1);
    expect(passed.records.fastestTenMs).toBe(40_000);
  });
});
