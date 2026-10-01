import type { Difficulty, Question, Visual } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { nextQuestionId } from './context';
import { lab } from '../label';

/**
 * Mental addition and subtraction of two-digit numbers, taught as moves:
 *  tens      — add or subtract 10 and multiples of 10 (only the tens digit changes)
 *  next10    — how far to the next ten (58 needs 2)
 *  split     — break the second number into tens and ones (43 + 25 → 43 + 20 + 5)
 *  round     — round and compensate (47 + 38 → 47 + 40 − 2; 68 − 29 → 68 − 30 + 1)
 *  make10    — make a ten by moving some across (58 + 27 → 60 + 25)
 *  distance  — subtract by counting up (83 − 47: 3 + 30 + 3)
 *  all       — mixed two-digit sums and differences; the explanation picks the best move
 */
export type MentalKind = 'tens' | 'next10' | 'split' | 'round' | 'make10' | 'distance' | 'all';
export const MENTAL_KINDS: { id: MentalKind; label: string; short: string }[] = [
  { id: 'all', label: 'Mixed two-digit', short: 'Mixed' },
  { id: 'tens', label: 'Add / subtract tens', short: '±10s' },
  { id: 'next10', label: 'Distance to next 10', short: 'Next 10' },
  { id: 'split', label: 'Break apart', short: 'Break apart' },
  { id: 'round', label: 'Round & compensate', short: 'Round' },
  { id: 'make10', label: 'Make a ten', short: 'Make 10' },
  { id: 'distance', label: 'Count the distance', short: 'Distance' },
];

export type Strategy = 'Tens first' | 'Next ten' | 'Break apart' | 'Round & compensate' | 'Make a ten' | 'Count the distance';

interface Worked { strategy: Strategy; steps: string[]; visual: Visual; when: string }

const jumps = (from: number, hops: number[]): Visual => ({ type: 'jumps', from, jumps: hops });
const tens = (n: number) => Math.floor(n / 10) * 10;
const ones = (n: number) => n % 10;

/** The best mental move for a + b, with the worked steps. */
export function workAdd(a: number, b: number): Worked {
  const sum = a + b;
  if (ones(b) === 0) return { strategy: 'Tens first', when: 'the number you add is a whole number of tens', steps: [`Only the tens change: ${a} + ${b} → ${tens(a) / 10} tens + ${b / 10} tens.`, `${a} + ${b} = ${sum}.`], visual: jumps(a, [b]) };
  if (ones(b) >= 8) { const r = tens(b) + 10; const back = r - b; return { strategy: 'Round & compensate', when: 'a number ends in 8 or 9, so it is almost a ten', steps: [`${b} is almost ${r}. Add ${r} instead: ${a} + ${r} = ${a + r}.`, `You added ${lab(back, 'extra')} too many. Take it back: ${lab(a + r, 'running total')} − ${lab(back, 'extra')} = ${lab(sum, 'sum')}.`], visual: jumps(a, [r, -back]) }; }
  if (ones(a) + ones(b) >= 10 && ones(a) !== 0) { const need = 10 - ones(a); const rest = b - need; return { strategy: 'Make a ten', when: 'the ones digits add to 10 or more', steps: [`${a} needs ${lab(need, 'partner to make ten')} to reach ${a + need}. Take ${need} from ${b}: ${b} − ${need} = ${lab(rest, 'left to add')}.`, `${a} + ${need} = ${lab(a + need, 'round ten')}, then ${a + need} + ${lab(rest, 'left to add')} = ${lab(sum, 'sum')}.`], visual: jumps(a, [need, rest]) }; }
  return { strategy: 'Break apart', when: 'the ones digits do not cross a ten', steps: [`Break ${lab(b, 'the number we split')} into ${lab(tens(b), 'tens part')} and ${lab(ones(b), 'ones part')}.`, `${a} + ${tens(b)} = ${lab(a + tens(b), 'running total')}, then ${a + tens(b)} + ${ones(b)} = ${lab(sum, 'sum')}.`], visual: jumps(a, [tens(b), ones(b)]) };
}

/** The best mental move for a − b (a > b), with the worked steps. */
export function workSub(a: number, b: number): Worked {
  const diff = a - b;
  if (ones(b) === 0) return { strategy: 'Tens first', when: 'the number you subtract is a whole number of tens', steps: [`Only the tens change: ${a} − ${b} → ${tens(a) / 10} tens − ${b / 10} tens.`, `${a} − ${b} = ${diff}.`], visual: jumps(a, [-b]) };
  if (ones(b) >= 8) { const r = tens(b) + 10; const back = r - b; return { strategy: 'Round & compensate', when: 'the number you subtract ends in 8 or 9', steps: [`${b} is almost ${r}. Subtract ${r} instead: ${a} − ${r} = ${a - r}.`, `You took ${lab(back, 'extra')} too many. Give it back: ${lab(a - r, 'running total')} + ${lab(back, 'extra')} = ${lab(diff, 'difference')}.`], visual: jumps(a, [-r, back]) }; }
  if (ones(a) < ones(b)) {
    const toTen = 10 - ones(b); const mid = b + toTen; const tensHop = tens(a) - mid; const last = a - tens(a);
    const hops = [toTen, tensHop, last].filter((h) => h !== 0);
    return { strategy: 'Count the distance', when: 'you would have to borrow', steps: [`How far is ${b} from ${a}? ${b} → ${mid} is ${lab(toTen, 'hop to the next ten')}.`, ...[[tensHop ? `${mid} → ${tens(a)} is ${lab(tensHop, 'tens hop')}.` : '', last ? `${tens(a)} → ${a} is ${lab(last, 'last hop')}.` : ''].filter(Boolean).join(' ')].filter(Boolean), `Add the hops: ${[toTen, tensHop, last].filter((h) => h !== 0).join(' + ')} = ${lab(diff, 'distance')}.`], visual: jumps(b, hops) };
  }
  return { strategy: 'Break apart', when: 'no borrowing is needed', steps: [`Break ${lab(b, 'the number we split')} into ${lab(tens(b), 'tens part')} and ${lab(ones(b), 'ones part')}.`, `${a} − ${tens(b)} = ${lab(a - tens(b), 'running total')}, then ${a - tens(b)} − ${ones(b)} = ${lab(diff, 'difference')}.`], visual: jumps(a, [-tens(b), -ones(b)]) };
}

function make(skillId: string, expression: string, answer: number, difficulty: Difficulty, w: Worked, hint: string): Question {
  return {
    id: nextQuestionId('mental'), masterySkillId: skillId, topic: 'Mental addition & subtraction', subtopic: w.strategy, difficulty, mode: 'pure',
    prompt: '', expression, answer, hint, solutionSteps: [`Best move: ${w.strategy}, because ${w.when}.`, ...w.steps],
    explanation: [`Best move: ${w.strategy}, because ${w.when}.`, ...w.steps], visual: w.visual, prerequisites: ['add.basic', 'sub.basic'],
    engineeringApplication: 'Engineers add and subtract in their heads all day: totals, differences, tolerances, change.',
  };
}

const HINTS: Record<Strategy, string> = {
  'Tens first': 'Only the tens digit changes.',
  'Next ten': 'What does the ones digit need to make 10?',
  'Break apart': 'Add or subtract the tens first, then the ones.',
  'Round & compensate': 'Use the nearby ten, then fix it by 1 or 2.',
  'Make a ten': 'Give the first number what it needs to reach the next ten.',
  'Count the distance': 'Count up from the smaller number: to the next ten, then tens, then the rest.',
};

export function mentalQuestion(kind: MentalKind, difficulty: Difficulty, rng: Rng, skillId?: string): Question {
  const k: Exclude<MentalKind, 'all'> = kind === 'all' ? rng.pick(['tens', 'split', 'round', 'make10', 'distance', 'split', 'make10'] as const) : kind;
  const sid = skillId ?? (kind === 'all' ? 'mental' : `mental.${k}`);
  if (k === 'tens') {
    const a = rng.int(11, 89); const step = difficulty <= 1 ? 10 : rng.int(1, 5) * 10;
    const add = rng.chance(0.5) && a + step <= 120;
    const b = add ? step : Math.min(step, tens(a) - (ones(a) === 0 ? 10 : 0) || 10);
    if (add) return make(sid, `${a} + ${b} = ?`, a + b, difficulty, workAdd(a, b), HINTS['Tens first']);
    const sub = b >= a ? 10 : b;
    return make(sid, `${a} − ${sub} = ?`, a - sub, difficulty, workSub(a, sub), HINTS['Tens first']);
  }
  if (k === 'next10') {
    const a = rng.int(11, 99); const n = ones(a) === 0 ? a - rng.int(1, 9) : a; const next = tens(n) + 10;
    const w: Worked = { strategy: 'Next ten', when: 'you want to jump to the next ten', steps: [`${n} sits between ${tens(n)} and ${next}.`, `The ones digit ${ones(n)} needs ${lab(10 - ones(n), 'partner to make ten')} to make 10, so ${n} needs ${lab(next - n, 'jump to the next ten')} to reach ${next}.`], visual: jumps(n, [next - n]) };
    return make(sid, `${n} + ? = ${next}`, next - n, difficulty, w, HINTS['Next ten']);
  }
  if (k === 'split') {
    if (rng.chance(0.5)) { const a = rng.int(12, 78); const oa = ones(a); const b = rng.int(1, Math.floor((99 - a) / 10)) * 10 + rng.int(1, Math.min(9, 9 - oa) || 1); return make(sid, `${a} + ${b} = ?`, a + b, difficulty, workAdd(a, b), HINTS['Break apart']); }
    const a = rng.int(35, 99); const b = rng.int(1, Math.floor(a / 10) - 1) * 10 + rng.int(1, Math.max(1, ones(a)));
    return make(sid, `${a} − ${b} = ?`, a - b, difficulty, workSub(a, b), HINTS['Break apart']);
  }
  if (k === 'round') {
    const nearly = [18, 19, 28, 29, 38, 39, 48, 49, ...(difficulty >= 3 ? [58, 59, 68, 69] : [])];
    if (rng.chance(0.5)) { const b = rng.pick(nearly); const a = rng.int(12, Math.min(75, 120 - b)); return make(sid, `${a} + ${b} = ?`, a + b, difficulty, workAdd(a, b), HINTS['Round & compensate']); }
    const b = rng.pick(nearly); const a = rng.int(b + 11, 99);
    return make(sid, `${a} − ${b} = ?`, a - b, difficulty, workSub(a, b), HINTS['Round & compensate']);
  }
  if (k === 'make10') {
    const a = rng.int(2, 8) * 10 + rng.int(3, 7); const ob = rng.int(10 - ones(a), 7); const b = rng.int(1, Math.floor((115 - a) / 10)) * 10 + ob;
    return make(sid, `${a} + ${b} = ?`, a + b, difficulty, workAdd(a, b), HINTS['Make a ten']);
  }
  // distance: subtraction that would need a borrow
  const a = rng.int(4, 9) * 10 + rng.int(0, 6); const b = rng.int(1, Math.floor(a / 10) - 2) * 10 + rng.int(ones(a) + 1, 7);
  return make(sid, `${a} − ${b} = ?`, a - b, difficulty, workSub(a, b), HINTS['Count the distance']);
}

/** Generator: params.kind = tens | next10 | split | round | make10 | distance | all. */
export const genMental: Generator = (skillId, params, ctx) => mentalQuestion(String(params?.kind ?? 'all') as MentalKind, ctx.difficulty, ctx.rng, skillId);
