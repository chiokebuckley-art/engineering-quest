import type { MMProblem } from './generator';
import { placeParts } from './strategies';

/**
 * Error analysis. A wrong answer is a message: it usually says which mental step slipped. Classifying
 * it lets the Academy say something useful instead of "wrong", and lets the adaptive engine send the
 * learner back to the exact sub-skill that failed.
 */
export type ErrorKind =
  | 'place-value' | 'carry' | 'borrow' | 'lost-intermediate' | 'compensation-direction'
  | 'operation-confusion' | 'fact-error' | 'rounding' | 'reversed' | 'slip' | 'working-memory' | 'blank';

export const ERROR_LABEL: Record<ErrorKind, string> = {
  'place-value': 'Place-value slip',
  carry: 'Carry missed',
  borrow: 'Borrow flipped',
  'lost-intermediate': 'Stopped part-way',
  'compensation-direction': 'Compensation went the wrong way',
  'operation-confusion': 'Wrong operation',
  'fact-error': 'Fact slip',
  rounding: 'Rounded and forgot to adjust',
  reversed: 'Numbers the wrong way round',
  slip: 'Near miss',
  'working-memory': 'Lost the number',
  blank: 'No answer',
};

export interface Diagnosis {
  kind: ErrorKind;
  /** What to say to the learner: specific, short, and never scolding. */
  message: string;
  /** The sub-skill worth revisiting, if any. */
  reviewTag?: string;
}

const digitsOf = (n: number) => String(Math.abs(n)).split('').map(Number);

/** Column-wise addition with no carrying: 47 + 36 → "713". */
function noCarryAdd(a: number, b: number): number | null {
  const A = digitsOf(a).reverse(); const B = digitsOf(b).reverse();
  const n = Math.max(A.length, B.length);
  let out = '';
  for (let i = n - 1; i >= 0; i--) out += String((A[i] ?? 0) + (B[i] ?? 0));
  const v = Number(out);
  return Number.isFinite(v) ? v : null;
}

/** Column-wise subtraction always taking the smaller digit from the larger: 532 − 287 → 355. */
function smallerFromLarger(a: number, b: number): number | null {
  const A = digitsOf(a).reverse(); const B = digitsOf(b).reverse();
  const n = Math.max(A.length, B.length);
  let out = '';
  for (let i = n - 1; i >= 0; i--) out += String(Math.abs((A[i] ?? 0) - (B[i] ?? 0)));
  const v = Number(out);
  return Number.isFinite(v) ? v : null;
}

export function diagnose(p: MMProblem, givenRaw: string): Diagnosis {
  const given = Number(String(givenRaw).replace(/[^0-9-]/g, ''));
  const correct = p.answer;
  if (!String(givenRaw).trim() || !Number.isFinite(given)) {
    return { kind: 'blank', message: 'No answer went in. If the number slipped away mid-calculation, that is working memory, not maths: use the hint and say each step out loud.' };
  }
  const diff = given - correct;
  const steps = p.strategy.steps;

  // Stopped at an intermediate value the strategy actually produces.
  const mid = steps.slice(0, -1).map((s) => s.to);
  if (mid.includes(given)) {
    const at = steps.findIndex((s) => s.to === given);
    return { kind: 'lost-intermediate', message: `${given} is the total after "${steps[at].label}". You had it right, then stopped before the last step: ${steps[at + 1]?.label ?? 'the final hop'}.`, reviewTag: p.tag };
  }

  // Compensation run in the wrong direction: over-corrected by twice the adjustment.
  const adj = steps.find((s) => s.note?.includes('too many') || s.note?.includes('give it back') || s.note?.includes('take it back') || s.note?.includes('counted'));
  if (adj && adj.delta && Math.abs(diff) === Math.abs(2 * adj.delta)) {
    return { kind: 'compensation-direction', message: `You rounded well, then adjusted the wrong way. You changed the number by ${Math.abs(adj.delta)}, so the fix goes in the opposite direction: ${adj.label}.`, reviewTag: p.tag };
  }
  // Rounded and never adjusted at all.
  if (adj && adj.delta && diff === -adj.delta) {
    return { kind: 'rounding', message: `That is the answer before the adjustment. You rounded to a friendly number, so the last move is ${adj.label}.`, reviewTag: p.tag };
  }

  if (p.op === 'add') {
    const nc = noCarryAdd(p.a, p.b);
    if (nc !== null && given === nc && nc !== correct) {
      return { kind: 'carry', message: `You added each column but let a carry escape. ${p.a % 10} + ${p.b % 10} passes ten, and that extra ten belongs in the tens.`, reviewTag: 'add2-make10' };
    }
    if (given === p.a - p.b || given === p.b - p.a) {
      return { kind: 'operation-confusion', message: 'That is the difference, not the sum. The sign says add.', reviewTag: p.tag };
    }
  }
  if (p.op === 'sub') {
    const sl = smallerFromLarger(p.a, p.b);
    if (sl !== null && given === sl && sl !== correct) {
      return { kind: 'borrow', message: `In each column you took the smaller digit from the larger. Subtraction is not symmetric — try counting up from ${p.b} instead, which never needs a borrow.`, reviewTag: 'sub2-countup' };
    }
    if (given === p.a + p.b) {
      return { kind: 'operation-confusion', message: 'That is the sum. The sign says subtract.', reviewTag: p.tag };
    }
    if (given === p.b - p.a) {
      return { kind: 'reversed', message: `You worked ${p.b} − ${p.a}. Order matters in subtraction.`, reviewTag: p.tag };
    }
  }
  if (p.op === 'mul') {
    if (given === p.a + p.b) {
      return { kind: 'operation-confusion', message: 'That is the sum, not the product.', reviewTag: p.tag };
    }
    // One partial product wrong: the miss is a whole multiple of one factor.
    for (const f of [p.a, p.b]) {
      if (f > 1 && diff % f === 0 && Math.abs(diff / f) <= 10) {
        return { kind: 'fact-error', message: `You are out by ${Math.abs(diff / f)} × ${f}. One of the partial products slipped: check ${p.strategy.steps.map((s) => s.label).join(', then ')}.`, reviewTag: 'mul-facts' };
      }
    }
    // Forgot to scale a place-value part.
    const parts = placeParts(Math.max(p.a, p.b));
    const small = Math.min(p.a, p.b);
    if (parts.length > 1 && given === parts.map((x) => (x / 10 ** (String(x).length - 1)) * small).reduce((x, y) => x + y, 0)) {
      return { kind: 'place-value', message: 'You multiplied the digits but dropped their place value. The 2 in 23 is really 20, so its product is ten times bigger.', reviewTag: 'mm.place' };
    }
  }
  if (correct !== 0 && (given === correct * 10 || given * 10 === correct || given === correct * 100 || given * 100 === correct)) {
    return { kind: 'place-value', message: `The digits are right but the size is off by a factor of ten. Check which place each part belongs in.`, reviewTag: 'place-value' };
  }
  if (Math.abs(diff) <= 2) {
    return { kind: 'slip', message: `Out by ${Math.abs(diff)}. The method was right; the last hop was rushed.`, reviewTag: p.tag };
  }
  if (Math.abs(diff) === 10 || Math.abs(diff) === 100 || Math.abs(diff) === 20) {
    return { kind: 'carry', message: `Out by exactly ${Math.abs(diff)}, which is one whole ${Math.abs(diff) === 100 ? 'hundred' : 'ten'}. A carry or a ten-crossing went missing.`, reviewTag: p.tag };
  }
  return { kind: 'working-memory', message: `That one got away. Walk it again in chunks: ${p.strategy.steps.map((s) => s.label).join(' → ')}.`, reviewTag: p.tag };
}

/** The most common error kinds for a learner, worst first. */
export function topErrors(counts: Partial<Record<ErrorKind, number>>, n = 3): { kind: ErrorKind; count: number }[] {
  return (Object.entries(counts) as [ErrorKind, number][])
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([kind, count]) => ({ kind, count }));
}

/** One line of coaching for the learner's most common mistake. */
export function errorAdvice(kind: ErrorKind): string {
  switch (kind) {
    case 'carry': return 'Carries are slipping. Slow down at the moment the ones cross ten, and say the new ten out loud.';
    case 'borrow': return 'Borrowing is costing you. Count up from the smaller number instead: it never needs a borrow.';
    case 'lost-intermediate': return 'You are losing the number part-way. Say each running total aloud before adding the next chunk.';
    case 'compensation-direction': return 'Rounding is fine; the fix goes the other way. Added too much, take it back; took too much, give it back.';
    case 'place-value': return 'Watch place value: the 4 in 47 is 40, and its product or sum is ten times what the digit alone suggests.';
    case 'fact-error': return 'The strategy is sound but a table fact is shaky. A few minutes on facts will speed everything up.';
    case 'operation-confusion': return 'Read the sign before you start. Say "add" or "subtract" to yourself first.';
    case 'reversed': return 'Order matters in subtraction. The number you start from is the bigger one on the left.';
    case 'rounding': return 'You round well but forget the adjustment. Make the fix part of the same breath as the rounding.';
    case 'slip': return 'Accuracy is close. Give the final hop the same care as the first.';
    case 'blank': return 'When the number slips away, go back one scaffold level: seeing the chunks rebuilds the chain.';
    default: return 'Break the problem into smaller chunks and hold fewer numbers at once.';
  }
}
