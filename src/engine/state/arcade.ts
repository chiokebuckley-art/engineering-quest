import type { ArcadeGame, ArcadeMode, ArcadeState } from './types';
import { ARCADE_ACADEMY_KINDS } from '../academy/generator';
import type { FactId, MasteryRecord, Question, SkillId } from '../types';
import { createRng, type Rng } from '../rng';
import { generateFromSkills, generateQuestion, questionForFact, answerLabel } from '../questions';
import { pureMultQuestion } from '../questions/multiplication';
import { bondQuestion } from '../questions/bonds';
import { oneStepQuestion, evaluateQuestion } from '../questions/algebra';
import { bondFacts, tableFacts, parseMultFact, parseBondFact, parseDivFact, divisionTableFacts } from '../curriculum/facts';
import { TABLE_ORDER } from '../curriculum/skills';
import { genAdd, genSub } from '../questions/arithmetic';
import { pureDivQuestion } from '../questions/division';
import { wordProblem, type WordKind } from '../questions/wordproblems';
import { trickQuestion, TRICK_KINDS, type TrickKind } from '../questions/tricks';
import { mentalQuestion, MENTAL_KINDS, type MentalKind } from '../questions/mental';
import { volumeQuestion, VOLUME_KINDS, type VolumeKind } from '../questions/volume';
import { measureQuestion, MEASURE_KINDS, type MeasureKind } from '../questions/measure';
import { PICTURE_GAMES } from '../questions/games';
import { mentalArcadeQuestion, MM_ARCADE_GROUPS } from '../questions/mentalmath';
import { chapterForSkill } from '../academy/registry';

export const BLITZ_MS = 60_000;
export const BLITZ_OPTIONS_MS = [30_000, 60_000, 90_000, 120_000];
/** A conquer answer must land within this time to count. */
export const CONQUER_MS = 5_000;
export const CONQUER_REPS_SINGLE = 5;
/** Conquer length for games without a fixed fact list. */
export const CONQUER_POOL = 12;

export interface Selection {
  game: ArcadeGame; key: string; label: string; skillIds: SkillId[];
  /** Fact pool (empty for open-ended games such as addition or algebra). */
  facts: FactId[]; factId?: FactId;
  /** Difficulty for open-ended generators. */
  difficulty: 1 | 2 | 3 | 4 | 5 | 6;
}

const ALL_MULT = () => Array.from(new Set(TABLE_ORDER.flatMap((n) => tableFacts(n))));
const ALL_DIV = () => [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].flatMap((d) => divisionTableFacts(d));

/**
 * Parse a selection key into skills and fact pool. A key may end in `@d1`…`@d6` to fix the difficulty of open-ended
 * generators (the Contest Path grade caps use this: `pattern:shapes@d2`); the suffix stays part of the key, so bests
 * and conquests are kept per difficulty.
 */
export function parseSelection(game: ArcadeGame, key: string): Selection {
  const dm = /@d([1-6])$/.exec(key);
  if (dm) { const base = parseSelectionBase(game, key.slice(0, dm.index)); return { ...base, key: `${base.key}@d${dm[1]}`, difficulty: Number(dm[1]) as Selection['difficulty'] }; }
  return parseSelectionBase(game, key);
}
function parseSelectionBase(game: ArcadeGame, key: string): Selection {
  const body = key.replace(/^[a-z]+:/, '');
  if (game === 'academy') {
    // academy:<academyId>.<chapterKey> — practise one academy chapter.
    const [aid, ck] = body.split('.');
    const skill = `acad.${aid}.${ck}`; const found = chapterForSkill(skill);
    return { game, key: `academy:${aid}.${ck}`, label: found ? `${found.academy.short}: ${found.chapter.title}` : 'Academy practice', skillIds: [skill], facts: [], difficulty: 3 };
  }
  if (game === 'frac' || game === 'ratio') {
    const kinds = ARCADE_ACADEMY_KINDS[game];
    const k = kinds.some((x) => x.id === body) ? body : 'all';
    const name = game === 'frac' ? 'Fractions' : 'Ratios';
    return { game, key: `${game}:${k}`, label: k === 'all' ? `${name}: every kind` : `${name}: ${kinds.find((x) => x.id === k)!.label.toLowerCase()}`, skillIds: [k === 'all' ? game : `${game}.${k}`], facts: [], difficulty: 3 };
  }
  if (game === 'bonds') {
    const t = Number(body || 10);
    return { game, key: `bonds:${t}`, label: `Make ${t}`, skillIds: [`bonds.${t}`], facts: bondFacts(t), difficulty: 2 };
  }
  if (game === 'div') {
    if (body === 'all' || body === '') return { game, key: 'div:all', label: 'All division facts', skillIds: ['div'], facts: ALL_DIV(), difficulty: 2 };
    const ds = body.split(',').map(Number).filter((n) => n >= 2 && n <= 12);
    return { game, key: `div:${ds.join(',')}`, label: ds.map((d) => `÷${d}`).join(' '), skillIds: ds.map((d) => `div.${d}`), facts: ds.flatMap((d) => divisionTableFacts(d)), difficulty: 2 };
  }
  if (game === 'add' || game === 'sub') {
    const max = Number(body) === 20 ? 20 : Number(body) === 100 ? 100 : Number(body) === 1000 ? 1000 : 20;
    const difficulty = (max === 20 ? 2 : max === 100 ? 4 : 5) as Selection['difficulty'];
    const skill = game === 'add' ? 'add.basic' : 'sub.basic';
    return { game, key: `${game}:${max}`, label: `${game === 'add' ? 'Add' : 'Subtract'} to ${max}`, skillIds: [skill], facts: [], difficulty };
  }
  if (game === 'alg') {
    if (body === 'evaluate') return { game, key: 'alg:evaluate', label: 'Evaluate expressions', skillIds: ['prealg.expressions'], facts: [], difficulty: 3 };
    if (body === 'onestep') return { game, key: 'alg:onestep', label: 'One-step equations', skillIds: ['prealg.equations'], facts: [], difficulty: 3 };
    return { game, key: 'alg:all', label: 'Pre-algebra mix', skillIds: ['prealg.expressions', 'prealg.equations'], facts: [], difficulty: 3 };
  }
  if (game === 'word') {
    const kinds: WordKind[] = ['add', 'sub', 'mult', 'div', 'twostep', 'mixed'];
    const k = (kinds.includes(body as WordKind) ? body : 'mixed') as WordKind;
    const labels: Record<WordKind, string> = { add: 'Addition stories', sub: 'Subtraction stories', mult: 'Multiplication stories', div: 'Division stories', twostep: 'Two-step stories', mixed: 'Mixed word problems' };
    return { game, key: `word:${k}`, label: labels[k], skillIds: [k === 'mixed' ? 'word' : `word.${k}`], facts: [], difficulty: k === 'twostep' ? 4 : 2 };
  }
  if (game === 'tricks') {
    const k = (TRICK_KINDS.some((t) => t.id === body) ? body : 'all') as TrickKind;
    const skill = k === 'all' ? 'tricks' : `trick.${k}`;
    return { game, key: `tricks:${k}`, label: TRICK_KINDS.find((t) => t.id === k)!.label, skillIds: [skill], facts: [], difficulty: 3 };
  }
  if (game === 'mental') {
    const k = (MENTAL_KINDS.some((t) => t.id === body) ? body : 'all') as MentalKind;
    return { game, key: `mental:${k}`, label: `Mental: ${MENTAL_KINDS.find((t) => t.id === k)!.label.toLowerCase()}`, skillIds: [k === 'all' ? 'mental' : `mental.${k}`], facts: [], difficulty: 2 };
  }
  if (game === 'volume') {
    const k = (VOLUME_KINDS.some((t) => t.id === body) ? body : 'all') as VolumeKind;
    return { game, key: `volume:${k}`, label: `Volume: ${VOLUME_KINDS.find((t) => t.id === k)!.label.toLowerCase()}`, skillIds: [k === 'all' ? 'volume' : `volume.${k}`], facts: [], difficulty: 2 };
  }
  if (game === 'measure') {
    const k = (MEASURE_KINDS.some((t) => t.id === body) ? body : 'all') as MeasureKind;
    return { game, key: `measure:${k}`, label: `Measuring: ${MEASURE_KINDS.find((t) => t.id === k)!.label.toLowerCase()}`, skillIds: [k === 'all' ? 'measure' : `measure.${k}`], facts: [], difficulty: 2 };
  }
  if (game === 'mm') {
    const k = MM_ARCADE_GROUPS.some((g) => g.id === body) ? body : 'all';
    return { game, key: `mm:${k}`, label: `Mental: ${MM_ARCADE_GROUPS.find((g) => g.id === k)!.label.toLowerCase()}`, skillIds: [k === 'all' ? 'mm' : `mm.${k}`], facts: [], difficulty: 3 };
  }
  const pg = PICTURE_GAMES[game];
  if (pg) {
    const k = pg.kinds.some((t) => t.id === body) ? body : 'all';
    return { game, key: `${game}:${k}`, label: `${pg.label}: ${pg.kinds.find((t) => t.id === k)!.label.toLowerCase()}`, skillIds: [k === 'all' ? pg.skill : `${pg.skill}.${k}`], facts: [], difficulty: 2 };
  }
  if (game === 'mixed') {
    return { game, key: 'mixed:all', label: 'Everything mixed', skillIds: ['mult', 'div', 'add.basic', 'sub.basic', 'bonds.10', 'bonds.100', 'prealg.expressions', 'prealg.equations'], facts: [], difficulty: 3 };
  }
  // multiplication
  if (body.startsWith('fact:')) {
    const f = body.slice(5); const m = /^(\d+)x(\d+)$/.exec(f)!;
    const a = Number(m[1]); const b = Number(m[2]);
    const fid = `fact:mult:${Math.min(a, b)}x${Math.max(a, b)}`;
    return { game: 'mult', key: `mult:fact:${Math.min(a, b)}x${Math.max(a, b)}`, label: `${a} × ${b}`, skillIds: [`mult.${Math.min(a, b)}`], facts: [fid], factId: fid, difficulty: 2 };
  }
  if (body === 'all' || body === '') return { game: 'mult', key: 'mult:all', label: 'All tables', skillIds: ['mult'], facts: ALL_MULT(), difficulty: 2 };
  const tables = body.split(',').map(Number).filter((n) => n >= 1 && n <= 12);
  return { game: 'mult', key: `mult:${tables.join(',')}`, label: tables.map((t) => `×${t}`).join(' '), skillIds: tables.map((t) => `mult.${t}`), facts: Array.from(new Set(tables.flatMap((t) => tableFacts(t)))), difficulty: 2 };
}

/** A question for a fact id, deterministic given the rng. */
function questionFromFact(fid: FactId, rng: Rng): Question | undefined {
  const m = parseMultFact(fid);
  if (m) return pureMultQuestion(m.a, m.b, rng);
  const d = parseDivFact(fid);
  if (d) return pureDivQuestion(d.dividend, d.divisor);
  const b = parseBondFact(fid);
  if (b) { const part = rng.chance(0.5) ? b.part : b.total - b.part; return bondQuestion(part, b.total, `bonds.${b.total}`, rng.int(0, 2) as 0 | 1 | 2, true); }
  return undefined;
}
/** Open-ended question (add/sub/alg/mixed) from a seeded rng. */
function openQuestion(withDifficulty: Selection, rng: Rng): Question {
  // The kind is read from the key, so drop any @dN difficulty suffix first.
  const sel = { ...withDifficulty, key: withDifficulty.key.replace(/@d[1-6]$/, '') };
  const ctx = { rng, difficulty: sel.difficulty, mastery: {}, recentFacts: [], now: 0 };
  if (sel.game === 'mental') return mentalQuestion(sel.key.slice(7) as MentalKind, sel.difficulty, rng, sel.skillIds[0]);
  if (sel.game === 'volume') return volumeQuestion(sel.key.slice(7) as VolumeKind, sel.difficulty, rng, sel.skillIds[0]);
  if (sel.game === 'measure') return measureQuestion(sel.key.slice(8) as MeasureKind, sel.difficulty, rng, sel.skillIds[0]);
  if (sel.game === 'mm') return mentalArcadeQuestion(sel.key.slice(3), sel.difficulty, rng);
  const pg = PICTURE_GAMES[sel.game];
  if (pg) return pg.question(sel.key.slice(sel.game.length + 1), sel.difficulty, rng, sel.skillIds[0]);
  if (sel.game === 'tricks') return trickQuestion(sel.key.slice(7) as TrickKind, sel.difficulty, rng, sel.skillIds[0]);
  if (sel.game === 'word') return wordProblem(sel.key.slice(5) as WordKind, sel.difficulty, rng, sel.skillIds[0]);
  if (sel.game === 'add') return genAdd('add.basic', undefined, ctx);
  if (sel.game === 'sub') return genSub('sub.basic', undefined, ctx);
  if (sel.game === 'alg') {
    const pick = sel.key === 'alg:evaluate' ? 'e' : sel.key === 'alg:onestep' ? 'o' : rng.pick(['e', 'o']);
    if (pick === 'e') { const a = rng.int(1, 6); const x = rng.int(1, 9); const b = rng.int(0, 20); return evaluateQuestion(a, b, x, '+', rng); }
    const kind = rng.pick(['add', 'sub', 'mul', 'div'] as const);
    const x = kind === 'div' ? rng.int(2, 9) * rng.int(2, 9) : rng.int(1, 12);
    const k = kind === 'div' ? rng.pick([2, 3, 4, 5, 6, 7, 8, 9].filter((c) => x % c === 0)) : rng.int(1, 12);
    return oneStepQuestion(kind, x, k, rng);
  }
  // Fractions, ratios and academy chapters are skills with their own generator: seeded rounds (friends, Conquer) use it too.
  if (sel.game === 'frac' || sel.game === 'ratio' || sel.game === 'academy') return generateQuestion(sel.skillIds[0], {}, { rng, difficulty: sel.difficulty });
  // mixed: pick a sub-game uniformly
  const sub = rng.pick(['mult', 'div', 'add', 'sub', 'bonds', 'alg'] as const);
  if (sub === 'mult') { const f = parseMultFact(rng.pick(ALL_MULT()))!; return pureMultQuestion(f.a, f.b, rng); }
  if (sub === 'div') return questionFromFact(rng.pick(ALL_DIV()), rng)!;
  if (sub === 'bonds') { const t = rng.pick([10, 100]); const f = parseBondFact(rng.pick(bondFacts(t)))!; return bondQuestion(rng.chance(0.5) ? f.part : t - f.part, t, `bonds.${t}`, rng.int(0, 2) as 0 | 1 | 2, true); }
  return openQuestion({ ...sel, game: sub, key: sub === 'alg' ? 'alg:all' : `${sub}:100`, difficulty: sub === 'alg' ? 3 : 4 }, rng);
}

/** Seeded, mastery-independent draw so every player in a versus round sees the same questions. */
export function drawSeeded(sel: Selection, seed: number, index: number): Question {
  const rng = createRng((seed * 7919 + index * 104729) >>> 0);
  if (!sel.facts.length) return openQuestion(sel, rng);
  const pool = sel.facts;
  let fid = rng.pick(pool);
  if (pool.length > 1 && index > 0) {
    const prevRng = createRng((seed * 7919 + (index - 1) * 104729) >>> 0);
    if (prevRng.pick(pool) === fid) fid = rng.pick(pool);
  }
  return questionFromFact(fid, rng) ?? openQuestion(sel, rng);
}

function draw(sel: Selection, mastery: Record<string, MasteryRecord>, rng: Rng, recent: FactId[], forced?: FactId): Question {
  const target = forced ?? sel.factId;
  if (target) {
    if (target.startsWith('q:')) return drawSeeded(sel, Number(target.split(':')[1]), Number(target.split(':')[2]));
    const q = questionForFact(target, mastery, { rng, recentFacts: [] });
    if (q) return q;
  }
  // Mental Math Blitz groups (mm:add, mm:sub...) are not skills of their own: they draw through their own picker.
  if (sel.game === 'mixed' || sel.game === 'mm') return openQuestion(sel, rng);
  if (!sel.facts.length && sel.skillIds.length === 1) return generateQuestion(sel.skillIds[0], mastery, { rng, difficulty: sel.difficulty, recentFacts: recent });
  return generateFromSkills(sel.skillIds, mastery, { rng, difficulty: sel.difficulty, recentFacts: recent });
}

export interface StartOpts { seed?: number; versus?: boolean; startAt?: number; durationMs?: number; reward?: 'gears'; targetMs?: number }
export const SPEED_SET_SIZE = 20;
export const GEARS_PER_CORRECT = 5;
export const GEARS_PER_STAR = 20;

export function startArcade(game: ArcadeGame, mode: ArcadeMode, key: string, mastery: Record<string, MasteryRecord>, now = Date.now(), rng = createRng(), opts: StartOpts = {}): ArcadeState {
  const sel = parseSelection(game, key);
  const runSeed = opts.seed ?? Math.floor(rng.next() * 1e9);
  let remaining: FactId[] = [];
  if (mode === 'conquer') {
    // Single fact: beat it five times. Bonds: each pair both ways round. Tables: every fact once.
    // Open-ended games: a fixed seeded set of CONQUER_POOL questions.
    if (sel.factId) remaining = Array.from({ length: CONQUER_REPS_SINGLE }, () => sel.factId!);
    else if (!sel.facts.length) remaining = Array.from({ length: CONQUER_POOL }, (_, i) => `q:${runSeed}:${i}`);
    else remaining = rng.shuffle(game === 'bonds' ? [...sel.facts, ...sel.facts] : sel.facts);
  }
  const question = opts.seed !== undefined ? drawSeeded(sel, opts.seed, 0) : draw(sel, mastery, rng, [], mode === 'conquer' ? remaining[0] : undefined);
  const start = opts.startAt ?? now;
  const durationMs = opts.durationMs ?? BLITZ_MS;
  return {
    game, mode, selection: sel.key, question, questionStartedAt: start, startedAt: start,
    deadlineAt: mode === 'blitz' ? start + durationMs : undefined,
    attempts: 0, results: [], remaining, conquered: [], score: 0, combo: 0, bestCombo: 0, showExplanation: false, status: 'active',
    seed: opts.seed, questionIndex: 0, versus: opts.versus, durationMs, runSeed, reward: opts.reward,
    targetMs: mode === 'speed' ? opts.targetMs ?? 5000 : undefined, setSize: mode === 'speed' ? SPEED_SET_SIZE : undefined,
  };
}

export interface ArcadeAnswerOutcome { state: ArcadeState; correct: boolean; countsForMastery: boolean; timeMs: number; points: number; conqueredFact?: FactId }

export function arcadeAnswer(a: ArcadeState, correct: boolean, now = Date.now()): ArcadeAnswerOutcome {
  const timeMs = Math.max(200, now - a.questionStartedAt);
  const first = a.attempts === 0;
  const next: ArcadeState = { ...a, attempts: a.attempts + 1, results: [...a.results], conquered: [...a.conquered], remaining: [...a.remaining] };
  let points = 0;
  let conqueredFact: FactId | undefined;
  if (first) next.results.push({ factId: a.question.factId, correct, timeMs });
  // Harder question types get a little longer to count as "conquered".
  const limit = CONQUER_MS + (a.game === 'academy' ? 30_000 : a.game === 'word' ? 25_000 : a.game === 'tricks' ? 10_000 : a.game === 'mental' ? 3_000 : PICTURE_GAMES[a.game] ? 30_000 : a.game === 'mm' ? 10_000 : a.game === 'alg' || a.game === 'mixed' ? 4000 : a.game === 'add' || a.game === 'sub' ? 2000 : 0);
  if (correct) {
    if (first) {
      next.combo += 1;
      next.bestCombo = Math.max(next.bestCombo, next.combo);
      const fast = a.mode === 'speed' && a.targetMs ? timeMs <= a.targetMs : timeMs < 3000;
      points = a.mode === 'speed' ? (fast ? 10 + Math.min(10, next.combo) * 2 : 2) : 10 + (fast ? 5 : 0) + Math.min(10, next.combo) * 2;
      if (a.mode === 'speed' && !fast) next.combo = 0;
      next.score += points;
      if (a.mode === 'conquer') {
        const fid = a.remaining[0];
        if (timeMs <= limit && fid) { next.remaining.shift(); next.conquered.push(fid); conqueredFact = fid; }
        else if (fid) { next.remaining.shift(); next.remaining.push(fid); }
      }
    }
    next.feedback = { correct: true, text: a.mode === 'speed' && a.targetMs ? `${(timeMs / 1000).toFixed(1)} s · ${timeMs <= a.targetMs ? `on the clock, +${points}` : `over by ${((timeMs - a.targetMs) / 1000).toFixed(1)} s`}` : first ? (next.combo >= 5 ? `+${points} · combo ×${next.combo}!` : `+${points}`) : 'Got it.' };
  } else {
    if (first) {
      next.combo = 0;
      if (a.mode === 'conquer') { const fid = next.remaining.shift(); if (fid) next.remaining.push(fid); }
    }
    next.feedback = { correct: false, text: a.mode === 'speed' ? `${(timeMs / 1000).toFixed(1)} s · Answer: ${answerLabel(a.question)}${a.question.unit ? ' ' + a.question.unit : ''}.` : first ? `Not yet. ${a.question.hint}` : `Answer: ${answerLabel(a.question)}. ${a.question.solutionSteps.join(' ')}` };
  }
  if (a.mode === 'conquer' && next.remaining.length === 0) next.status = 'finished';
  if (a.mode === 'speed' && a.setSize && next.results.length >= a.setSize) next.status = 'finished';
  return { state: next, correct, countsForMastery: first, timeMs, points, conqueredFact };
}

export function arcadeNext(a: ArcadeState, mastery: Record<string, MasteryRecord>, now = Date.now(), rng = createRng()): ArcadeState {
  if (a.status !== 'active') return a;
  if (a.feedback && !a.feedback.correct && a.attempts < 2 && a.mode !== 'blitz' && a.mode !== 'speed') return { ...a, feedback: undefined, questionStartedAt: now, showExplanation: false };
  if (a.mode === 'blitz' && a.deadlineAt && now >= a.deadlineAt) return { ...a, status: 'finished', feedback: undefined };
  const sel = parseSelection(a.game, a.selection);
  const recent = [a.question.factId ?? ''].filter(Boolean);
  const questionIndex = a.questionIndex + 1;
  const question = a.seed !== undefined ? drawSeeded(sel, a.seed, questionIndex) : draw(sel, mastery, rng, recent, a.mode === 'conquer' ? a.remaining[0] : undefined);
  return { ...a, question, questionIndex, questionStartedAt: now, attempts: 0, feedback: undefined, showExplanation: false };
}

/** Stars scale with the blitz length: 15/25/35 correct per 60 s. */
export function blitzStars(correct: number, durationMs = BLITZ_MS, game: ArcadeGame = 'mult'): number {
  const f = durationMs / BLITZ_MS;
  // Word problems take reading time: 4/6/9 per minute.
  if (game === 'word') return correct >= 9 * f ? 3 : correct >= 6 * f ? 2 : correct >= 4 * f ? 1 : 0;
  // Tricks need a few seconds of thinking each: 8/12/18 per minute.
  if (game === 'tricks') return correct >= 18 * f ? 3 : correct >= 12 * f ? 2 : correct >= 8 * f ? 1 : 0;
  // Volume: every question is a picture to read. 4/7/10 per minute.
  // Mental arithmetic in the head: 6/10/15 per minute.
  if (game === 'mm') return correct >= 15 * f ? 3 : correct >= 10 * f ? 2 : correct >= 6 * f ? 1 : 0;
  if (PICTURE_GAMES[game] || game === 'academy') return correct >= 10 * f ? 3 : correct >= 7 * f ? 2 : correct >= 4 * f ? 1 : 0;
  // Two-digit mental sums: 12/20/28 per minute.
  if (game === 'mental') return correct >= 28 * f ? 3 : correct >= 20 * f ? 2 : correct >= 12 * f ? 1 : 0;
  return correct >= 35 * f ? 3 : correct >= 25 * f ? 2 : correct >= 15 * f ? 1 : 0;
}

export function selectionTitle(game: ArcadeGame, key: string): string {
  return parseSelection(game, key).label;
}

export const bestKey = (selection: string, durationMs: number) => `${selection}@${durationMs / 1000}`;

export { parseMultFact };
