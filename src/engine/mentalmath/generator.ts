import type { Rng } from '../rng';
import type { MMTag } from './curriculum';
import { mmSkill } from './curriculum';
import { strategiesFor, strategyFor, type Op, type Strategy, type StrategyId, OP_SIGN, placeParts } from './strategies';
import { lab } from '../label';

/** The place-value part a number is: 300 → 'hundreds part'. */
const partName = (p: number) => (p >= 1000 ? 'thousands part' : p >= 100 ? 'hundreds part' : p >= 10 ? 'tens part' : 'ones part');

/**
 * Tagged problem generation. Every problem is built so that the strategy it is meant to train actually
 * applies to it, is checked against the strategy engine, and is de-duplicated against recent history so
 * a learner never sees the same numbers twice in a session.
 */
export interface MMProblem {
  id: string;
  skillId: string;
  tag: MMTag;
  op: Op | 'none';
  a: number;
  b: number;
  /** For multi-term problems such as friendly pairs. */
  c?: number;
  answer: number;
  /** How the problem reads, e.g. "347 + 286". */
  prompt: string;
  /** A short instruction when the prompt alone is not enough. */
  ask?: string;
  /** The strategy this problem is designed to train. */
  strategy: Strategy;
  /** Other valid routes, for "show me another way" and strategy choice. */
  alternatives: Strategy[];
  /** Digit count of the larger operand, used for working-memory pacing. */
  size: number;
}

let counter = 0;
const nextId = () => `mm-${Date.now().toString(36)}-${(counter++).toString(36)}`;

const pick = <T,>(rng: Rng, xs: readonly T[]): T => xs[Math.floor(rng.next() * xs.length)] ?? xs[0];
const int = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng.next() * (hi - lo + 1));

/**
 * Difficulty shapes the operand size within a tag, so a learner meets 47 + 20 before 47 + 26 and
 * 147 + 26 before 347 + 286. Never jump straight to the hardest shape.
 */
export type MMLevel = 1 | 2 | 3 | 4 | 5 | 6;

function make(skillId: string, tag: MMTag, op: Op, a: number, b: number, prefer?: StrategyId, ask?: string): MMProblem {
  const all = strategiesFor(op, a, b);
  const strategy = (prefer && all.find((s) => s.id === prefer)) || all[0];
  const answer = op === 'add' ? a + b : op === 'sub' ? a - b : a * b;
  return {
    id: nextId(), skillId, tag, op, a, b, answer,
    prompt: `${a} ${OP_SIGN[op]} ${b}`, ask,
    strategy, alternatives: all.filter((s) => s.id !== strategy.id),
    size: Math.max(String(a).length, String(b).length),
  };
}

/** A non-arithmetic prompt (place value, halving, expanded form) still carries a one-step "strategy". */
function fact(skillId: string, tag: MMTag, prompt: string, answer: number, note: string, ask?: string, source = 0): MMProblem {
  const strategy: Strategy = {
    id: 'place-chunks', name: 'Read the number', when: 'number sense', why: note,
    steps: [{ label: prompt, from: 0, to: answer, note }], answer, effort: 1,
    visual: { type: 'none' },
  };
  return { id: nextId(), skillId, tag, op: 'none', a: source, b: 0, answer, prompt, ask, strategy, alternatives: [], size: String(answer).length };
}


/** A three-term friendly-pair problem: pair the two that make a round hundred, then add the third. */
function friendly(skillId: string, tag: MMTag, a: number, c: number, b: number): MMProblem {
  const round = a + c;
  const base = make(skillId, tag, 'add', round, b, 'place-chunks');
  const steps = [
    { label: `${a} + ${c} = ${round}`, from: a, delta: c, to: round, note: 'these two make a round number' },
    ...base.strategy.steps,
  ];
  const strategy = {
    ...base.strategy,
    id: 'friendly-pair' as const,
    name: 'Friendly pair first',
    when: 'when two of the numbers make a round ten or hundred',
    why: `Addition can be reordered, so ${a} + ${c} = ${round} can be done first and the rest added to it.`,
    steps,
    answer: a + b + c,
    visual: { type: 'jumps' as const, from: a, jumps: steps.filter((x) => x.delta).map((x) => x.delta as number) },
  };
  return {
    ...base, a, b, c, answer: a + b + c, prompt: `${a} + ${b} + ${c}`,
    ask: 'Spot the pair that makes a round number first.',
    strategy, alternatives: [], size: Math.max(String(a).length, String(b).length, String(c).length),
  };
}

/* ------------------------------------------------------------------ */
/* per-tag builders                                                    */
/* ------------------------------------------------------------------ */

function buildWorld1(tag: MMTag, skillId: string, lvl: MMLevel, rng: Rng): MMProblem {
  switch (tag) {
    case 'place-value': {
      const n = lvl <= 2 ? int(rng, 10, 99) : lvl <= 4 ? int(rng, 100, 999) : int(rng, 1000, 9999);
      const digits = String(n).split('').map(Number);
      const i = int(rng, 0, digits.length - 1);
      const value = digits[i] * 10 ** (digits.length - 1 - i);
      const place = ['ones', 'tens', 'hundreds', 'thousands'][digits.length - 1 - i];
      const worth = place === 'ones' ? `so it is worth ${value}` : `so ${lab(digits[i], place)} = ${lab(value, 'ones')}`;
      return fact(skillId, tag, `${n}`, value, `The ${digits[i]} sits in the ${place} place, ${worth}.`, `What is the ${digits[i]} worth in ${n}?`, n);
    }
    case 'expanded': {
      const n = lvl <= 2 ? int(rng, 11, 99) : lvl <= 4 ? int(rng, 101, 999) : int(rng, 1001, 9999);
      const parts = placeParts(n);
      const target = pick(rng, parts);
      return fact(skillId, tag, `${n} = ${parts.map((p) => (p === target ? '?' : p)).join(' + ')}`, target, `${n} splits into ${parts.map((p) => lab(p, partName(p))).join(' + ')}.`, `What is the missing part?`, n);
    }
    case 'make-ten': {
      const a = int(rng, 1, 9);
      return make(skillId, tag, 'add', a, 10 - a, 'place-chunks', `What does ${a} need to make 10?`);
    }
    case 'make-hundred': {
      const a = lvl <= 2 ? int(rng, 1, 9) * 10 : int(rng, 11, 89);
      return make(skillId, tag, 'add', a, 100 - a, 'place-chunks', `What does ${a} need to make 100?`);
    }
    case 'complement': {
      const b = lvl <= 2 ? int(rng, 1, 9) * 10 : int(rng, 11, 99);
      return make(skillId, tag, 'sub', 100, b, 'count-up');
    }
    case 'double': {
      const n = lvl <= 1 ? int(rng, 2, 12) : lvl <= 2 ? int(rng, 10, 50) : lvl <= 4 ? int(rng, 20, 99) : pick(rng, [125, 150, 175, 250, 350, 425, 500]);
      return make(skillId, tag, 'add', n, n, 'near-double');
    }
    case 'halve': {
      const h = lvl <= 2 ? int(rng, 5, 25) : lvl <= 4 ? int(rng, 10, 99) : int(rng, 100, 500);
      return fact(skillId, tag, `half of ${h * 2}`, h, `Half of ${h * 2} is ${h}: halve the tens, halve the ones.`, `What is half of ${h * 2}?`, h * 2);
    }
    case 'times-ten': {
      const n = lvl <= 2 ? int(rng, 2, 99) : int(rng, 12, 999);
      const m = lvl <= 1 ? 10 : pick(rng, [10, 100, 1000]);
      return make(skillId, tag, 'mul', n, m, 'factor-split');
    }
    default: {
      const n = int(rng, 12, 99);
      const m = pick(rng, lvl <= 2 ? [5, 50] : [5, 25, 50]);
      return make(skillId, tag, 'mul', n, m, 'factor-split');
    }
  }
}

/** Two-digit addition operands shaped so the tagged strategy is the natural one. */
function buildAdd2(tag: MMTag, skillId: string, lvl: MMLevel, rng: Rng): MMProblem {
  const smallSecond = lvl <= 1;
  switch (tag) {
    case 'add2-make10': {
      const a = int(rng, 2, 8) * 10 + int(rng, 3, 9);
      const need = 10 - (a % 10);
      const b = int(rng, 1, Math.max(1, Math.floor((99 - a) / 10))) * 10 + int(rng, need, 9);
      return make(skillId, tag, 'add', a, b, 'make-ten');
    }
    case 'add2-compensate': {
      const b = pick(rng, lvl <= 2 ? [19, 29, 39] : [18, 19, 28, 29, 38, 39, 48, 49, 58, 59]);
      const a = int(rng, 11, Math.min(80, 120 - b));
      return make(skillId, tag, 'add', a, b, 'compensate');
    }
    case 'add2-double': {
      const a = lvl <= 2 ? int(rng, 11, 49) : int(rng, 20, 89);
      const b = a + pick(rng, [0, 1, 1, 2, -1]);
      return make(skillId, tag, 'add', a, Math.max(1, b), 'near-double');
    }
    case 'add2-friendly': {
      const a = lvl <= 2 ? int(rng, 2, 8) * 5 : int(rng, 15, 85);
      return friendly(skillId, tag, a, 100 - a, int(rng, 11, 89));
    }
    case 'add2-left': {
      const a = int(rng, 21, 89); const b = int(rng, 21, 89);
      return make(skillId, tag, 'add', a, b, 'left-to-right');
    }
    case 'add2-mixed': {
      const kinds: MMTag[] = ['add2-chunks', 'add2-make10', 'add2-compensate', 'add2-double'];
      return buildAdd2(pick(rng, kinds), skillId, lvl, rng);
    }
    default: {
      // add2-chunks: working-memory ladder — round second number, then simple, then crossing.
      const a = int(rng, lvl <= 1 ? 21 : 13, lvl <= 1 ? 59 : 89);
      const b = smallSecond ? int(rng, 1, 5) * 10 : lvl <= 2 ? int(rng, 1, 4) * 10 + int(rng, 1, Math.max(1, 9 - (a % 10))) : int(rng, 11, Math.min(89, 110 - a));
      return make(skillId, tag, 'add', a, Math.max(2, b), 'place-chunks');
    }
  }
}

function buildAdd3(tag: MMTag, skillId: string, lvl: MMLevel, rng: Rng): MMProblem {
  switch (tag) {
    case 'add3-compensate': {
      const b = pick(rng, [98, 197, 198, 199, 288, 289, 297, 298, 396, 397, 398, 399, 495, 498]);
      const a = int(rng, 110, 560);
      return make(skillId, tag, 'add', a, b, 'compensate');
    }
    case 'add3-friendly': {
      const a = pick(rng, [125, 150, 175, 225, 250, 275, 325, 340, 420]);
      const c = Math.ceil((a + 1) / 100) * 100 - a;
      return friendly(skillId, tag, a, c, int(rng, 12, 99));
    }
    case 'add3-mixed': {
      return buildAdd3(pick(rng, ['add3-chunks', 'add3-compensate'] as MMTag[]), skillId, lvl, rng);
    }
    default: {
      // Ladder: 147 + 26 → 347 + 126 → 347 + 286.
      const a = lvl <= 1 ? int(rng, 110, 199) : lvl <= 3 ? int(rng, 120, 499) : int(rng, 210, 799);
      const b = lvl <= 1 ? int(rng, 11, 89) : lvl <= 2 ? int(rng, 1, 3) * 100 + int(rng, 1, 30) : lvl <= 4 ? int(rng, 110, 299) : int(rng, 150, Math.max(160, 980 - a));
      return make(skillId, tag, 'add', a, b, 'place-chunks');
    }
  }
}

function buildSub2(tag: MMTag, skillId: string, lvl: MMLevel, rng: Rng): MMProblem {
  switch (tag) {
    case 'sub2-compensate': {
      const b = pick(rng, lvl <= 2 ? [19, 29, 39] : [18, 19, 28, 29, 38, 39, 48, 49, 58, 59]);
      const a = int(rng, b + 6, 99);
      return make(skillId, tag, 'sub', a, b, 'sub-compensate');
    }
    case 'sub2-countup': {
      const b = int(rng, 41, 89);
      const a = b + (lvl <= 2 ? int(rng, 2, 9) : int(rng, 3, 24));
      return make(skillId, tag, 'sub', Math.min(99, a), b, 'count-up');
    }
    case 'sub2-constant': {
      const b = int(rng, 3, 8) * 10 - pick(rng, [1, 2, 3]);
      const a = int(rng, b + 11, 99);
      return make(skillId, tag, 'sub', a, b, 'constant-difference');
    }
    case 'sub2-mixed': {
      return buildSub2(pick(rng, ['sub2-chunks', 'sub2-compensate', 'sub2-countup', 'sub2-constant'] as MMTag[]), skillId, lvl, rng);
    }
    default: {
      const a = int(rng, lvl <= 1 ? 40 : 35, 99);
      const b = lvl <= 1 ? int(rng, 1, Math.floor(a / 10) - 1) * 10 : lvl <= 3 ? int(rng, 1, Math.max(1, Math.floor(a / 10) - 1)) * 10 + int(rng, 1, Math.max(1, a % 10)) : int(rng, 12, a - 5);
      return make(skillId, tag, 'sub', a, Math.max(2, b), 'count-down');
    }
  }
}

function buildSub3(tag: MMTag, skillId: string, lvl: MMLevel, rng: Rng): MMProblem {
  switch (tag) {
    case 'sub3-compensate': {
      const b = pick(rng, [188, 189, 196, 197, 198, 199, 287, 288, 289, 296, 297, 298, 386, 387, 388, 396, 397, 398]);
      const a = int(rng, b + 20, 999);
      return make(skillId, tag, 'sub', a, b, 'sub-compensate');
    }
    case 'sub3-countup': {
      const b = int(rng, 380, 890);
      const a = b + (lvl <= 2 ? int(rng, 4, 20) : int(rng, 8, 40));
      return make(skillId, tag, 'sub', Math.min(999, a), b, 'count-up');
    }
    case 'sub3-mixed': {
      return buildSub3(pick(rng, ['sub3-chunks', 'sub3-compensate', 'sub3-countup'] as MMTag[]), skillId, lvl, rng);
    }
    default: {
      const a = lvl <= 1 ? int(rng, 250, 599) : int(rng, 320, 999);
      const b = lvl <= 1 ? int(rng, 1, 2) * 100 + int(rng, 1, 4) * 10 : lvl <= 3 ? int(rng, 110, Math.max(120, a - 100)) : int(rng, 120, a - 40);
      return make(skillId, tag, 'sub', a, Math.max(20, b), 'count-down');
    }
  }
}

function buildMul(tag: MMTag, skillId: string, lvl: MMLevel, rng: Rng): MMProblem {
  switch (tag) {
    case 'mul-facts': {
      const a = int(rng, lvl <= 2 ? 2 : 3, lvl <= 2 ? 9 : 12);
      const b = int(rng, lvl <= 2 ? 2 : 3, lvl <= 2 ? 9 : 12);
      return make(skillId, tag, 'mul', a, b, 'distribute');
    }
    case 'mul-distributive':
    case 'mul2x1': {
      const a = lvl <= 1 ? int(rng, 11, 29) : lvl <= 3 ? int(rng, 12, 59) : int(rng, 23, 98);
      const b = lvl <= 1 ? int(rng, 2, 5) : int(rng, 3, 9);
      return make(skillId, tag, 'mul', a, b, 'distribute');
    }
    case 'mul-by5': {
      const a = lvl <= 2 ? int(rng, 12, 60) : int(rng, 24, 480);
      return make(skillId, tag, 'mul', a, 5, 'factor-split');
    }
    case 'mul-by25': {
      const a = lvl <= 2 ? int(rng, 4, 20) * (rng.next() < 0.5 ? 1 : 2) : int(rng, 6, 48);
      return make(skillId, tag, 'mul', a, pick(rng, [25, 50]), 'factor-split');
    }
    case 'mul-doubling': {
      const a = lvl <= 2 ? int(rng, 12, 45) : int(rng, 23, 120);
      return make(skillId, tag, 'mul', a, pick(rng, lvl <= 2 ? [4] : [4, 8]), 'distribute');
    }
    case 'mul2x2': {
      const a = lvl <= 1 ? int(rng, 11, 19) : lvl <= 3 ? int(rng, 12, 39) : int(rng, 21, 89);
      const b = lvl <= 1 ? int(rng, 11, 15) : lvl <= 3 ? int(rng, 12, 25) : int(rng, 13, 49);
      return make(skillId, tag, 'mul', a, b, 'distribute-tens');
    }
    case 'mul-compensate': {
      const a = pick(rng, lvl <= 2 ? [9, 19, 29] : [18, 19, 29, 39, 49, 98, 99]);
      const b = lvl <= 2 ? int(rng, 4, 14) : int(rng, 6, 34);
      return make(skillId, tag, 'mul', a, b, 'mul-compensate');
    }
    case 'mul-doublehalf': {
      const a = pick(rng, [12, 14, 16, 18, 22, 24, 26, 28, 32, 36]);
      const b = pick(rng, lvl <= 2 ? [25, 50] : [25, 50, 15, 35, 45]);
      const p = make(skillId, tag, 'mul', a, b, 'double-half');
      return p.strategy.id === 'double-half' ? p : make(skillId, tag, 'mul', a, pick(rng, [25, 50]), 'double-half');
    }
    case 'mul-eleven': {
      const a = lvl <= 2 ? int(rng, 12, 45) : int(rng, 46, 98);
      return make(skillId, tag, 'mul', a, 11, 'times-eleven');
    }
    case 'mul-squares': {
      const mid = pick(rng, [20, 25, 30, 35, 40, 45, 50, 55, 60]);
      const d = pick(rng, lvl <= 2 ? [1] : [1, 2, 3]);
      return make(skillId, tag, 'mul', mid - d, mid + d, 'diff-squares');
    }
    case 'mul3x1': {
      const a = lvl <= 1 ? int(rng, 101, 249) : lvl <= 3 ? int(rng, 120, 499) : int(rng, 210, 899);
      const b = lvl <= 1 ? int(rng, 2, 4) : int(rng, 3, 9);
      return make(skillId, tag, 'mul', a, b, 'distribute');
    }
    case 'mul3x2': {
      const a = pick(rng, lvl <= 2 ? [100, 125, 200, 250] : [110, 120, 125, 150, 200, 220, 250, 300, 400, 500]);
      const b = lvl <= 2 ? pick(rng, [12, 14, 16, 20, 24]) : int(rng, 12, 48);
      return make(skillId, tag, 'mul', a, b, 'distribute-tens');
    }
    default: {
      const a = int(rng, 12, 40); const b = int(rng, 3, 9);
      return make(skillId, tag, 'mul', a, b, 'distribute');
    }
  }
}

const ADD2: MMTag[] = ['add2-chunks', 'add2-left', 'add2-make10', 'add2-compensate', 'add2-double', 'add2-friendly', 'add2-mixed'];
const ADD3: MMTag[] = ['add3-chunks', 'add3-compensate', 'add3-friendly', 'add3-mixed'];
const SUB2: MMTag[] = ['sub2-chunks', 'sub2-compensate', 'sub2-countup', 'sub2-constant', 'sub2-mixed'];
const SUB3: MMTag[] = ['sub3-chunks', 'sub3-compensate', 'sub3-countup', 'sub3-mixed'];
const MUL: MMTag[] = ['mul-facts', 'mul-distributive', 'mul-by5', 'mul-by25', 'mul-doubling', 'mul2x1', 'mul2x2', 'mul-compensate', 'mul-doublehalf', 'mul-eleven', 'mul-squares', 'mul3x1', 'mul3x2'];
const W1: MMTag[] = ['place-value', 'expanded', 'make-ten', 'make-hundred', 'complement', 'double', 'halve', 'times-ten', 'unit-relations'];

/** Generate one problem for a tag at a difficulty level. */
export function generateProblem(tag: MMTag, skillId: string, lvl: MMLevel, rng: Rng): MMProblem {
  if (tag === 'mixed-all' || tag === 'strategy-choice') {
    const pool: MMTag[] = ['add2-mixed', 'add3-mixed', 'sub2-mixed', 'sub3-mixed', 'mul2x1', 'mul2x2', 'mul3x1', 'mul-compensate', 'mul-by25'];
    const inner = pick(rng, lvl <= 2 ? pool.slice(0, 4) : pool);
    const p = generateProblem(inner, skillId, lvl, rng);
    return { ...p, tag, skillId };
  }
  const tagged = (p: MMProblem): MMProblem => ({ ...p, tag, skillId });
  if (W1.includes(tag)) return tagged(buildWorld1(tag, skillId, lvl, rng));
  if (ADD2.includes(tag)) return tagged(buildAdd2(tag, skillId, lvl, rng));
  if (ADD3.includes(tag)) return tagged(buildAdd3(tag, skillId, lvl, rng));
  if (SUB2.includes(tag)) return tagged(buildSub2(tag, skillId, lvl, rng));
  if (SUB3.includes(tag)) return tagged(buildSub3(tag, skillId, lvl, rng));
  if (MUL.includes(tag)) return tagged(buildMul(tag, skillId, lvl, rng));
  return tagged(buildAdd2('add2-chunks', skillId, lvl, rng));
}

/** Generate a problem for a skill, avoiding anything in `history` (prompt strings). */
export function generateForSkill(skillId: string, lvl: MMLevel, rng: Rng, history: string[] = []): MMProblem {
  const sk = mmSkill(skillId);
  const tag = sk?.tag ?? 'add2-chunks';
  for (let i = 0; i < 24; i++) {
    const p = generateProblem(tag, skillId, lvl, rng);
    if (!history.includes(p.prompt) && p.answer >= 0) return p;
  }
  return generateProblem(tag, skillId, lvl, rng);
}

/** A set of problems with no repeats, for a round. */
export function generateSet(skillId: string, lvl: MMLevel, count: number, rng: Rng, history: string[] = []): MMProblem[] {
  const seen = [...history];
  const out: MMProblem[] = [];
  for (let i = 0; i < count; i++) {
    const p = generateForSkill(skillId, lvl, rng, seen);
    seen.push(p.prompt);
    out.push(p);
  }
  return out;
}

/** Re-derive the taught strategy for a problem (used when a saved problem is rehydrated). */
export const problemStrategy = (p: MMProblem, prefer?: StrategyId): Strategy =>
  p.op === 'none' ? p.strategy : strategyFor(p.op, p.a, p.b, prefer ?? p.strategy.id);
