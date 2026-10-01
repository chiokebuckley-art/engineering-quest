import type { Question } from '../types';
import { parseDivFact, parseMultFact } from '../curriculum/facts';

export type TipNpc = 'vector' | 'ada' | 'brick';

/** The two factors a question is really about, when it is a times-table fact. */
export function factorsOf(q: Question): [number, number] | null {
  const m = q.factId ? parseMultFact(q.factId) : null;
  if (m) {
    const e = /^(\d+) × (\d+)/.exec(q.expression);
    return e ? [Number(e[1]), Number(e[2])] : [m.a, m.b];
  }
  const d = q.factId ? parseDivFact(q.factId) : null;
  if (d) return [d.divisor, d.dividend / d.divisor];
  return null;
}

/** A trick for one table, in Ada's voice: every table has a shortcut built from easier ones. It stops one step short of the answer. */
export function trick(a: number, b: number): string {
  const [t, n] = [2, 4, 5, 9, 10, 11, 12, 1].includes(a) || ![2, 4, 5, 9, 10, 11, 12, 1].includes(b) ? [a, b] : [b, a];
  switch (t) {
    case 1: return `Anything times 1 stays exactly the same.`;
    case 2: return `×2 is doubling: ${n} + ${n} = ?`;
    case 3: return `×3 is double plus one more: ${2 * n} + ${n} = ?`;
    case 4: return `×4 is double, then double again: ${n} → ${2 * n} → ?`;
    case 5: return `×5 is half of ×10: ${n} × 10 = ${n * 10}, so half of ${n * 10} = ?`;
    case 6: return `×6 is ×5 plus one more group: ${5 * n} + ${n} = ?`;
    case 7: return `×7 is ×5 plus ×2: ${5 * n} + ${2 * n} = ?`;
    case 8: return `×8 is doubling three times: ${n} → ${2 * n} → ${4 * n} → ?`;
    case 9: return `×9 is ×10 minus one group: ${10 * n} − ${n} = ?`;
    case 10: return `×10: write ${n}, then put a zero on the end.`;
    case 11: return n < 10 ? `×11 on a single digit: write the digit twice.` : `×11 is ×10 plus one more group: ${10 * n} + ${n} = ?`;
    case 12: return `×12 is ×10 plus ×2: ${10 * n} + ${2 * n} = ?`;
    default: return `Split it into tens and ones, multiply each, then add.`;
  }
}

/**
 * Three ways to be helped, three teachers: Vector explains what the numbers mean (equal groups),
 * Ada gives the shortcut, Brick counts it out loud. None of them just says the answer.
 */
export function tipFor(npc: TipNpc, q: Question): string {
  const f = factorsOf(q);
  const isDiv = !!q.factId?.startsWith('fact:div:');
  if (!f) {
    if (npc === 'vector') return `Vector: ${q.hint}`;
    if (npc === 'ada') return `Ada: ${q.solutionSteps[0] ?? q.hint}`;
    return `Brick: Slow down, read it twice, then do one small step at a time. ${q.hint}`;
  }
  const [a, b] = f;
  if (isDiv) {
    const total = a * b;
    if (npc === 'vector') return `Vector: ${total} ÷ ${a} asks "how many in each of ${a} equal groups?" Picture ${a} rows sharing ${total} dots.`;
    if (npc === 'ada') return `Ada: Run it backwards. ${a} × what = ${total}? Division is multiplication in reverse.`;
    const steps = Array.from({ length: Math.min(b - 1, 4) }, (_, i) => a * (i + 1));
    return `Brick: Count by ${a}s until you reach ${total}, and count how many steps${steps.length ? `: ${steps.join(', ')}…` : '.'}`;
  }
  if (npc === 'vector') return `Vector: ${a} × ${b} means ${a} groups of ${b}. Picture ${a} rows with ${b} in each row.`;
  if (npc === 'ada') return `Ada: ${trick(a, b)}`;
  const step = Math.max(a, b); const times = Math.min(a, b);
  // Count out loud, but stop before the last count: the learner says the answer.
  const counts = Array.from({ length: Math.min(times - 1, 4) }, (_, i) => step * (i + 1));
  return counts.length ? `Brick: Skip-count by ${step}s, ${times} times: ${counts.join(', ')}, … say the next one${times - 1 > 4 ? 's' : ''}.` : `Brick: One group of ${step} is just ${step}.`;
}
