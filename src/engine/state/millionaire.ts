import type { Difficulty, Question } from '../types';
import { createRng, type Rng } from '../rng';
import { wordProblem, type WordKind } from '../questions/wordproblems';

/**
 * MATH MILLIONAIRE — read the word problem, pick the setup that solves it.
 * Fifteen rungs, two safe havens, three lifelines. A wrong pick drops you to
 * the last safe haven; walking away banks what you have.
 */
export const LADDER = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];
/** Rungs (0-based) that are safe: lose above them and you keep this amount. */
export const SAFE = [4, 9];
export const MILL_KINDS: { id: WordKind; label: string }[] = [
  { id: 'mixed', label: 'All kinds' }, { id: 'add', label: 'Addition' }, { id: 'sub', label: 'Subtraction' }, { id: 'mult', label: 'Multiplication' }, { id: 'div', label: 'Division' }, { id: 'twostep', label: 'Two-step' },
];

export type Lifeline = 'fifty' | 'ask' | 'swap';

export interface MillionaireState {
  kind: WordKind;
  seed: number;
  /** 0-based rung of the current question. */
  level: number;
  question: Question;
  options: string[];
  /** Indices removed by 50:50. */
  removed: number[];
  lifelines: Record<Lifeline, boolean>;
  askShown: boolean;
  picked?: number;
  status: 'asking' | 'reveal' | 'won' | 'lost' | 'walked';
  /** Money the player leaves with (set when the game ends). */
  winnings: number;
  correct: number;
  results: { level: number; correct: boolean; timeMs: number; op: string }[];
  startedAt: number;
  questionStartedAt: number;
  swaps: number;
  newBest?: boolean;
}

export interface MillionaireRecord {
  best: number;
  games: number;
  wins: number;
  /** Highest rung reached (1-based, 0 = none). */
  bestRung: number;
}

/** Rung → question difficulty and kind. Two-step only shows up from rung 8 in mixed mode. */
function rungDifficulty(level: number): Difficulty {
  return level < 3 ? 1 : level < 6 ? 2 : level < 9 ? 3 : level < 12 ? 4 : 5;
}
function rungKind(kind: WordKind, level: number, rng: Rng): WordKind {
  if (kind !== 'mixed') return kind;
  if (level >= 12) return rng.chance(0.7) ? 'twostep' : 'mixed';
  if (level >= 8) return rng.chance(0.35) ? 'twostep' : 'mixed';
  return rng.pick(['add', 'sub', 'mult', 'div'] as const);
}

function draw(kind: WordKind, seed: number, level: number, swaps: number): { question: Question; options: string[] } {
  const rng = createRng((seed * 31 + level * 977 + swaps * 7919) >>> 0);
  const k = rungKind(kind, level, rng);
  let question = wordProblem(k, rungDifficulty(level), rng);
  // Mixed mode at low rungs must not be two-step (build() only does that at d>=4, but be safe).
  if (k === 'mixed' && level < 8 && question.word!.ops.length > 1) question = wordProblem(rng.pick(['add', 'sub', 'mult', 'div'] as const), rungDifficulty(level), rng);
  const w = question.word!;
  const options = rng.shuffle([w.layout, ...w.distractors.slice(0, 3)]);
  return { question, options };
}

export function startMillionaire(kind: WordKind, now = Date.now(), seed = Math.floor(Math.random() * 1e9)): MillionaireState {
  const { question, options } = draw(kind, seed, 0, 0);
  return {
    kind, seed, level: 0, question, options, removed: [], lifelines: { fifty: true, ask: true, swap: true }, askShown: false,
    status: 'asking', winnings: 0, correct: 0, results: [], startedAt: now, questionStartedAt: now, swaps: 0,
  };
}

export const correctIndex = (m: MillionaireState) => m.options.indexOf(m.question.word!.layout);

/** What the player keeps if they lose on the current rung. */
export function safeAmount(level: number): number {
  const safe = [...SAFE].reverse().find((s) => s < level);
  return safe === undefined ? 0 : LADDER[safe];
}

export function pickOption(m: MillionaireState, index: number, now = Date.now()): MillionaireState {
  if (m.status !== 'asking' || m.removed.includes(index) || index < 0 || index >= m.options.length) return m;
  const correct = index === correctIndex(m);
  const timeMs = Math.max(200, now - m.questionStartedAt);
  const results = [...m.results, { level: m.level, correct, timeMs, op: m.question.word!.op }];
  if (correct) {
    const won = m.level === LADDER.length - 1;
    return { ...m, picked: index, status: won ? 'won' : 'reveal', results, correct: m.correct + 1, winnings: won ? LADDER[m.level] : m.winnings };
  }
  return { ...m, picked: index, status: 'lost', results, winnings: safeAmount(m.level) };
}

/** Advance to the next rung after a correct reveal. */
export function nextRung(m: MillionaireState, now = Date.now()): MillionaireState {
  if (m.status !== 'reveal') return m;
  const level = m.level + 1;
  const { question, options } = draw(m.kind, m.seed, level, 0);
  return { ...m, level, question, options, removed: [], askShown: false, picked: undefined, status: 'asking', questionStartedAt: now, swaps: 0 };
}

export function walkAway(m: MillionaireState): MillionaireState {
  if (m.status !== 'asking') return m;
  return { ...m, status: 'walked', winnings: m.level > 0 ? LADDER[m.level - 1] : 0 };
}

export function useLifeline(m: MillionaireState, kind: Lifeline, now = Date.now()): MillionaireState {
  if (m.status !== 'asking' || !m.lifelines[kind]) return m;
  const lifelines = { ...m.lifelines, [kind]: false };
  if (kind === 'fifty') {
    const rng = createRng((m.seed + m.level * 13) >>> 0);
    const wrong = m.options.map((_, i) => i).filter((i) => i !== correctIndex(m) && !m.removed.includes(i));
    const removed = rng.shuffle(wrong).slice(0, 2);
    return { ...m, lifelines, removed: [...m.removed, ...removed] };
  }
  if (kind === 'ask') return { ...m, lifelines, askShown: true };
  const swaps = m.swaps + 1;
  const { question, options } = draw(m.kind, m.seed, m.level, swaps);
  return { ...m, lifelines, swaps, question, options, removed: [], askShown: false, questionStartedAt: now };
}

/** The guide's advice for the "Ask Vector" lifeline: the clue words and the detective question, not the answer. */
export function askAdvice(q: Question): string {
  const w = q.word!;
  const clues = w.clues.map((c) => `"${c}"`).join(' and ');
  if (w.ops.length > 1) return `Two steps hiding here. Look at ${clues}. First ask: are there equal groups? Then ask what happens to that total.`;
  const ask: Record<string, string> = {
    add: `I see ${clues}. Ask yourself: are amounts being put together into one total?`,
    sub: `I see ${clues}. Ask yourself: is something taken away or compared? The difference is the answer.`,
    mult: `I see ${clues}. Ask yourself: are these EQUAL groups, and do I want the total of all of them?`,
    div: `I see ${clues}. Ask yourself: is a total being split into equal groups?`,
  };
  return ask[w.op];
}

export const fmtMoney = (n: number) => `$${n.toLocaleString('en-US')}`;
