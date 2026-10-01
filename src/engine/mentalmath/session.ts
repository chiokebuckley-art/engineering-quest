import type { Rng } from '../rng';
import type { MMTag } from './curriculum';
import { MM_SKILLS, MM_WORLDS, mmSkill, mmWorld } from './curriculum';
import { generateSet, type MMLevel, type MMProblem } from './generator';
import { guidedSteps, strategiesFor, type GuidedStep, type Strategy, type StrategyId } from './strategies';
import { diagnose, type Diagnosis, type ErrorKind } from './errors';

/**
 * The training session: one pure state machine covering every mode in the Academy, from a first
 * demonstration through guided steps to a timed arena round. The reducer only feeds it actions.
 */
export type MMMode = 'learn' | 'guided' | 'independent' | 'speed' | 'mastery' | 'boss' | 'workout' | 'placement' | 'visualize' | 'choose' | 'free';

/**
 * Scaffolding ladder. The Academy drops a level only when the learner earns it and raises it back the
 * moment two answers in a row go wrong, so nobody grinds without support.
 */
export type MMScaffold = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const SCAFFOLD_NAMES: Record<MMScaffold, string> = {
  1: 'Watch it worked through',
  2: 'Type each step',
  3: 'Choose the route, then type the steps',
  4: 'Hint available',
  5: 'On your own',
  6: 'On the clock',
  7: 'Mixed problems',
};
export const SCAFFOLD_BLURB: Record<MMScaffold, string> = {
  1: 'The whole chain is animated first. Then you answer.',
  2: 'The chunks are given. You supply each running total.',
  3: 'You pick which mental route to take, then walk it.',
  4: 'No steps shown. A hint is one tap away.',
  5: 'Nothing but the problem.',
  6: 'A per-question clock. Accuracy still counts more.',
  7: 'Strategies shuffled, so you must recognise the shape.',
};

export interface MMResult {
  problemId: string; prompt: string; skillId: string; tag: MMTag;
  correct: boolean; timeMs: number; hints: number; scaffold: MMScaffold;
  given: string; answer: number; error?: ErrorKind; usedStrategy?: StrategyId;
}

export interface MMBoss { name: string; taunt: string; hp: number; maxHp: number; phase: number; phaseName: string; phases: { name: string; tags: MMTag[]; questions: number }[] }
export interface MMPlanItem { skillId: string; label: string; count: number; mode?: MMMode }

export interface MMSession {
  mode: MMMode;
  skillId: string;
  world: number;
  scaffold: MMScaffold;
  problems: MMProblem[];
  index: number;
  /** Guided practice: which intermediate step is being asked. */
  stepIndex: number;
  /** Scaffold 3 and choose mode: the route the learner picked. */
  chosen?: StrategyId;
  /** 'demo' shows the worked chain, 'ask' waits for input, 'feedback' shows the verdict. */
  phase: 'demo' | 'choose' | 'ask' | 'feedback' | 'done';
  given: string;
  feedback?: { correct: boolean; text: string; diag?: Diagnosis; stepOk?: boolean };
  results: MMResult[];
  hintsUsed: number;
  hintShown: boolean;
  /** "Show me another way": which alternative is being displayed. */
  altIndex: number;
  visualOn: boolean;
  startedAt: number;
  questionStartedAt: number;
  targetMs?: number;
  boss?: MMBoss;
  plan?: MMPlanItem[];
  planIndex: number;
  /** Placement: the ladder of skills still to probe, and the level reached. */
  placement?: { queue: string[]; passed: string[]; failed: string[] };
  /** Visualization trainer: how many chunks are still hidden. */
  reveal?: number;
  status: 'active' | 'finished';
  /** Session totals so the end report needs no recomputation. */
  streak: number;
  bestStreak: number;
}

export const SET_SIZE: Record<MMMode, number> = { learn: 3, guided: 6, independent: 10, speed: 10, mastery: 10, boss: 0, workout: 0, placement: 0, visualize: 5, choose: 6, free: 10 };

export interface StartOpts {
  mode: MMMode; skillId: string; scaffold?: MMScaffold; level?: MMLevel; targetMs?: number;
  plan?: MMPlanItem[]; count?: number; history?: string[]; now?: number;
}

/** Problems for a plan item or a skill. */
function problemsFor(skillId: string, level: MMLevel, count: number, rng: Rng, history: string[]): MMProblem[] {
  return generateSet(skillId, level, count, rng, history);
}

export function startSession(o: StartOpts, rng: Rng): MMSession {
  const now = o.now ?? Date.now();
  const sk = mmSkill(o.skillId);
  const world = sk?.world ?? 1;
  const level = (o.level ?? 2) as MMLevel;
  const scaffold: MMScaffold = o.scaffold ?? (o.mode === 'guided' ? 2 : o.mode === 'learn' ? 1 : o.mode === 'speed' ? 6 : 5);
  let problems: MMProblem[] = [];
  let boss: MMBoss | undefined;
  let placement: MMSession['placement'];

  if (o.mode === 'boss') {
    const w = mmWorld(world)!;
    const phases = w.boss.phases;
    problems = phases.flatMap((ph) => ph.tags.flatMap((tag, i) => {
      const per = Math.ceil(ph.questions / ph.tags.length);
      const skillForTag = MM_SKILLS.find((s) => s.tag === tag)?.id ?? o.skillId;
      return problemsFor(skillForTag, Math.min(5, level + 1) as MMLevel, i === ph.tags.length - 1 ? ph.questions - per * (ph.tags.length - 1) : per, rng, []);
    }));
    const hp = problems.length;
    boss = { name: w.boss.name, taunt: w.boss.taunt, hp, maxHp: hp, phase: 0, phaseName: phases[0].name, phases };
  } else if (o.mode === 'workout' && o.plan?.length) {
    problems = o.plan.flatMap((item) => problemsFor(item.skillId, level, item.count, rng, []));
  } else if (o.mode === 'placement') {
    const ladder = ['mm.make10', 'mm.add2.chunks', 'mm.add2.mixed', 'mm.sub2.mixed', 'mm.add3.chunks', 'mm.sub3.mixed', 'mm.mul.facts', 'mm.mul.2x1', 'mm.mul.2x2'];
    placement = { queue: ladder.slice(1), passed: [], failed: [] };
    problems = problemsFor(ladder[0], 2, 2, rng, []);
  } else {
    problems = problemsFor(o.skillId, level, o.count ?? SET_SIZE[o.mode], rng, o.history ?? []);
  }

  return {
    mode: o.mode, skillId: o.skillId, world, scaffold,
    problems, index: 0, stepIndex: 0,
    phase: o.mode === 'learn' || scaffold === 1 ? 'demo' : scaffold === 3 || o.mode === 'choose' ? 'choose' : 'ask',
    given: '', results: [], hintsUsed: 0, hintShown: false, altIndex: 0,
    visualOn: scaffold <= 4,
    startedAt: now, questionStartedAt: now,
    targetMs: o.targetMs ?? (o.mode === 'speed' ? (sk?.speedLadder[0] ?? 15) * 1000 : undefined),
    boss, plan: o.plan, planIndex: 0, placement,
    reveal: o.mode === 'visualize' ? 0 : undefined,
    status: 'active', streak: 0, bestStreak: 0,
  };
}

export const current = (s: MMSession): MMProblem | undefined => s.problems[s.index];
export const activeStrategy = (s: MMSession): Strategy => {
  const p = current(s);
  if (!p) return { id: 'place-chunks', name: '', when: '', why: '', steps: [], answer: 0, effort: 0, visual: { type: 'none' } };
  if (s.chosen && p.op !== 'none') {
    const alt = strategiesFor(p.op, p.a, p.b).find((x) => x.id === s.chosen);
    if (alt) return alt;
  }
  return p.strategy;
};
export const stepsOf = (s: MMSession): GuidedStep[] => guidedSteps(activeStrategy(s));
/** Guided modes ask for each intermediate; everything else asks only for the answer. */
export const asksSteps = (s: MMSession) => (s.scaffold === 2 || s.scaffold === 3) && s.mode !== 'speed' && s.mode !== 'mastery';

export function currentAsk(s: MMSession): { question: string; expect: number; isFinal: boolean } {
  const p = current(s);
  if (!p) return { question: '', expect: 0, isFinal: true };
  if (!asksSteps(s)) return { question: p.prompt, expect: p.answer, isFinal: true };
  const steps = stepsOf(s);
  const i = Math.min(s.stepIndex, steps.length - 1);
  return { question: steps[i].question, expect: steps[i].expect, isFinal: i === steps.length - 1 };
}

/** Accept an answer. Returns the next session state; the reducer records mastery from `justFinished`. */
export interface AnswerOutcome { session: MMSession; correct: boolean; finishedProblem?: MMResult; sessionDone: boolean }

export function answer(s: MMSession, given: string, now: number): AnswerOutcome {
  if (s.status !== 'active' || s.phase !== 'ask') return { session: s, correct: false, sessionDone: false };
  const p = current(s);
  if (!p) return { session: s, correct: false, sessionDone: false };
  const ask = currentAsk(s);
  const value = Number(String(given).replace(/[^0-9-]/g, ''));
  const correct = Number.isFinite(value) && value === ask.expect;

  // Mid-chain step: stay on the same problem.
  if (!ask.isFinal) {
    if (correct) {
      return { session: { ...s, stepIndex: s.stepIndex + 1, given: '', feedback: { correct: true, text: `${ask.question} = ${ask.expect}. Hold that.`, stepOk: true } }, correct: true, sessionDone: false };
    }
    const steps = stepsOf(s);
    return { session: { ...s, given: '', feedback: { correct: false, text: `Not quite: ${ask.question} = ${ask.expect}. ${steps[s.stepIndex]?.note ?? ''}`.trim(), stepOk: false } }, correct: false, sessionDone: false };
  }

  const timeMs = Math.max(250, now - s.questionStartedAt);
  const diag = correct ? undefined : diagnose(p, given);
  const result: MMResult = {
    problemId: p.id, prompt: p.prompt, skillId: p.skillId, tag: p.tag,
    correct, timeMs, hints: s.hintShown ? 1 : 0, scaffold: s.scaffold,
    given, answer: p.answer, error: diag?.kind, usedStrategy: s.chosen ?? p.strategy.id,
  };
  const streak = correct ? s.streak + 1 : 0;
  const onTime = !s.targetMs || timeMs <= s.targetMs;
  const text = correct
    ? s.targetMs
      ? `${(timeMs / 1000).toFixed(1)} s · ${onTime ? 'on the clock' : `over by ${((timeMs - s.targetMs) / 1000).toFixed(1)} s`}`
      : streak >= 5 ? `Right. ${streak} in a row.` : 'Right.'
    : diag!.message;

  let boss = s.boss;
  if (boss && correct) {
    const hp = Math.max(0, boss.hp - 1);
    const done = s.results.length + 1;
    let phase = boss.phase;
    let acc = 0;
    for (let i = 0; i < boss.phases.length; i++) { acc += boss.phases[i].questions; if (done >= acc && i + 1 < boss.phases.length) phase = i + 1; }
    boss = { ...boss, hp, phase, phaseName: boss.phases[phase].name };
  }

  const results = [...s.results, result];
  return {
    session: {
      ...s, results, streak, bestStreak: Math.max(s.bestStreak, streak), boss,
      phase: 'feedback', given: '', feedback: { correct, text, diag },
    },
    correct, finishedProblem: result, sessionDone: false,
  };
}

/** Move to the next problem (or finish). Adaptive scaffolding is applied here. */
export function next(s: MMSession, rng: Rng, now: number): MMSession {
  if (s.status !== 'active') return s;
  // A problem is only left behind once it has been answered, so nothing is silently skipped.
  if (s.phase !== 'feedback') return s;
  const last3 = s.results.slice(-3);
  const lastTwoWrong = last3.length >= 2 && last3.slice(-2).every((r) => !r.correct);
  const lastFourRight = s.results.slice(-4).length === 4 && s.results.slice(-4).every((r) => r.correct && r.hints === 0);
  let scaffold = s.scaffold;
  // Help is earned away and handed back: four clean answers move up the ladder, two misses drop a level.
  if (s.mode === 'guided' || s.mode === 'independent' || s.mode === 'free') {
    if (lastTwoWrong && scaffold > 1) scaffold = (scaffold - 1) as MMScaffold;
    else if (lastFourRight && scaffold < 5) scaffold = (scaffold + 1) as MMScaffold;
  }

  const index = s.index + 1;
  if (index >= s.problems.length) {
    // Placement keeps probing harder skills while the learner is passing.
    if (s.mode === 'placement' && s.placement) {
      const recent = s.results.slice(-2);
      const passed = recent.length === 2 && recent.every((r) => r.correct);
      const pl = { ...s.placement };
      const lastSkill = s.problems[s.problems.length - 1]?.skillId ?? '';
      if (passed) pl.passed = [...pl.passed, lastSkill]; else pl.failed = [...pl.failed, lastSkill];
      if (passed && pl.queue.length) {
        const nextSkill = pl.queue[0];
        pl.queue = pl.queue.slice(1);
        return { ...s, placement: pl, problems: [...s.problems, ...generateSet(nextSkill, 2, 2, rng, s.problems.map((p) => p.prompt))], index, stepIndex: 0, phase: 'ask', given: '', feedback: undefined, hintShown: false, altIndex: 0, questionStartedAt: now, scaffold };
      }
      return { ...s, placement: pl, status: 'finished', phase: 'done' };
    }
    return { ...s, status: 'finished', phase: 'done' };
  }
  return {
    ...s, index, stepIndex: 0, scaffold, chosen: undefined,
    phase: s.mode === 'learn' || scaffold === 1 ? 'demo' : scaffold === 3 || s.mode === 'choose' ? 'choose' : 'ask',
    given: '', feedback: undefined, hintShown: false, altIndex: 0,
    visualOn: s.visualOn && scaffold <= 5,
    questionStartedAt: now, reveal: s.mode === 'visualize' ? 0 : s.reveal,
  };
}

/** Leave the demonstration and start answering. */
export const beginAsk = (s: MMSession, now: number): MMSession => (s.phase === 'demo' || s.phase === 'choose' ? { ...s, phase: 'ask', questionStartedAt: now } : s);
export const chooseStrategy = (s: MMSession, id: StrategyId, now: number): MMSession => ({ ...s, chosen: id, phase: 'ask', stepIndex: 0, questionStartedAt: s.mode === 'choose' ? s.questionStartedAt : now });
export const showHint = (s: MMSession): MMSession => ({ ...s, hintShown: true, hintsUsed: s.hintsUsed + 1 });
export const anotherWay = (s: MMSession): MMSession => ({ ...s, altIndex: s.altIndex + 1 });
export const toggleVisual = (s: MMSession): MMSession => ({ ...s, visualOn: !s.visualOn });
export const revealMore = (s: MMSession): MMSession => ({ ...s, reveal: (s.reveal ?? 0) + 1 });
export const setScaffold = (s: MMSession, scaffold: MMScaffold): MMSession => ({
  ...s, scaffold, stepIndex: 0,
  phase: scaffold === 1 ? 'demo' : scaffold === 3 ? 'choose' : 'ask',
  visualOn: scaffold <= 4,
});

/** Session totals for the end-of-session report. */
export interface MMReport {
  solved: number; correct: number; accuracy: number; avgMs: number; bestStreak: number;
  skills: string[]; hints: number; onTime?: number;
  commonError?: ErrorKind; improvement?: string; recommend?: { skillId: string; why: string };
}

export function report(s: MMSession): MMReport {
  const solved = s.results.length;
  const correct = s.results.filter((r) => r.correct).length;
  const avgMs = solved ? Math.round(s.results.reduce((a, r) => a + r.timeMs, 0) / solved) : 0;
  const counts: Partial<Record<ErrorKind, number>> = {};
  for (const r of s.results) if (r.error) counts[r.error] = (counts[r.error] ?? 0) + 1;
  const commonError = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as ErrorKind | undefined);
  const skills = Array.from(new Set(s.results.map((r) => r.skillId)));
  const half = Math.floor(solved / 2);
  const firstHalf = s.results.slice(0, half); const secondHalf = s.results.slice(half);
  const improvement = half >= 2 && secondHalf.length >= 2
    ? (() => {
        const a1 = firstHalf.filter((r) => r.correct).length / firstHalf.length;
        const a2 = secondHalf.filter((r) => r.correct).length / secondHalf.length;
        const t1 = firstHalf.reduce((a, r) => a + r.timeMs, 0) / firstHalf.length;
        const t2 = secondHalf.reduce((a, r) => a + r.timeMs, 0) / secondHalf.length;
        if (a2 > a1 + 0.05) return `Accuracy rose from ${Math.round(a1 * 100)} % to ${Math.round(a2 * 100)} % during the session.`;
        if (t2 < t1 * 0.85) return `You sped up: ${(t1 / 1000).toFixed(1)} s early on, ${(t2 / 1000).toFixed(1)} s by the end.`;
        return 'Steady all the way through.';
      })()
    : undefined;
  const onTime = s.targetMs ? s.results.filter((r) => r.correct && r.timeMs <= s.targetMs!).length : undefined;
  return { solved, correct, accuracy: solved ? correct / solved : 0, avgMs, bestStreak: s.bestStreak, skills, hints: s.hintsUsed, commonError, improvement, onTime };
}

/** A mastery round passes at 90 % accuracy with no more than one hint. */
export const passedMastery = (s: MMSession) => {
  const r = report(s);
  return r.solved >= 8 && r.accuracy >= 0.9 && r.hints <= 1;
};

/** Boss defeated when every question in every phase is answered correctly. */
export const bossBeaten = (s: MMSession) => !!s.boss && s.boss.hp === 0;

export { MM_WORLDS, MM_SKILLS };
