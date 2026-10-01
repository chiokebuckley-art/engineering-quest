import type { Visual } from '../types';
import { lab } from '../label';

/**
 * The mental-strategy engine.
 *
 * Every strategy is generated from the numbers themselves, never hard-coded per problem, and every
 * strategy carries the full chain of intermediate values a learner would hold in their head. The
 * `effort` score estimates how much work a strategy costs mentally, which drives "which way would you
 * solve it?" and the ordering of "show me another way".
 */
export type Op = 'add' | 'sub' | 'mul';
export const OP_SIGN: Record<Op, string> = { add: '+', sub: '−', mul: '×' };

export type StrategyId =
  // addition
  | 'place-chunks' | 'left-to-right' | 'make-ten' | 'compensate' | 'near-double' | 'friendly-pair'
  // subtraction
  | 'count-down' | 'sub-compensate' | 'count-up' | 'constant-difference'
  // multiplication
  | 'distribute' | 'distribute-tens' | 'mul-compensate' | 'double-half' | 'times-eleven' | 'diff-squares' | 'factor-split';

export interface StrategyStep {
  /** What the learner says in their head, e.g. "347 + 200". */
  label: string;
  /** Running total before this step (for the workspace animation). */
  from: number;
  /** The change applied, when the step is a jump on the number line. */
  delta?: number;
  /** Running total after this step: the number to hold. */
  to: number;
  /** Why this step, in one short sentence. */
  note?: string;
  /** A retrieved fact or a final assembly of parts already in hand: barely any mental cost. */
  cheap?: boolean;
}

export interface Strategy {
  id: StrategyId;
  name: string;
  /** One sentence on when this strategy is the right pick. */
  when: string;
  /** Why it is mathematically valid. */
  why: string;
  steps: StrategyStep[];
  answer: number;
  /** Lower is mentally easier. Drives strategy-choice coaching. */
  effort: number;
  visual: Visual;
}

export const STRATEGY_NAMES: Record<StrategyId, string> = {
  'place-chunks': 'Add in place-value chunks',
  'left-to-right': 'Left to right',
  'make-ten': 'Make a ten',
  compensate: 'Round and compensate',
  'near-double': 'Near double',
  'friendly-pair': 'Friendly pair first',
  'count-down': 'Count down in chunks',
  'sub-compensate': 'Round and adjust',
  'count-up': 'Count up (difference)',
  'constant-difference': 'Constant difference',
  distribute: 'Break apart (distributive)',
  'distribute-tens': 'Split both numbers',
  'mul-compensate': 'Round and take back',
  'double-half': 'Double and halve',
  'times-eleven': 'The ×11 shortcut',
  'diff-squares': 'Difference of squares',
  'factor-split': 'Split into factors',
};

/* ------------------------------------------------------------------ */
/* effort model                                                        */
/* ------------------------------------------------------------------ */

const ones = (n: number) => Math.abs(n) % 10;
const tensDigit = (n: number) => Math.floor(Math.abs(n) / 10) % 10;
const isRound100 = (n: number) => n !== 0 && Math.abs(n) % 100 === 0;
const isRound10 = (n: number) => n !== 0 && Math.abs(n) % 10 === 0;

/** What one step costs mentally: round numbers are cheap, crossing a ten costs extra, big holds cost extra. */
function stepCost(s: StrategyStep): number {
  if (s.cheap) return 0.6;
  const d = Math.abs(s.delta ?? 0);
  let c = 1;
  if (s.delta === undefined) c = 0.25; // assembling parts already held
  else if (d === 0) c = 0.6;
  else if (d <= 3) c = 0.7; // a tiny hop is almost free
  else if (isRound100(d)) c = 0.9;
  else if (isRound10(d)) c = 1.1;
  else if (d < 10) c = 1.2;
  else c = isRound10(s.from) || isRound100(s.from) ? 1.3 : 2.4; // the landing pad matters as much as the jump
  // Crossing a ten is the classic stumble — unless the step lands exactly on the ten, which is the point of it.
  if (d > 0 && d < 10 && !isRound10(s.to) && Math.floor(s.from / 10) !== Math.floor(s.to / 10)) c += 0.45;
  // Holding an awkward intermediate costs a little.
  if (s.delta !== undefined && !isRound10(s.to)) c += 0.15;
  if (Math.abs(s.to) >= 1000) c += 0.2;
  return c;
}
function effortOf(steps: StrategyStep[], base = 0): number {
  // A chain that overshoots and corrects costs a little extra: the correction is where learners slip.
  const correction = steps.some((s) => s.note?.includes('too many') || s.note?.includes('give it back') || s.note?.includes('take it back')) ? 0.45 : 0;
  return Math.round((base + correction + steps.reduce((a, s) => a + stepCost(s), 0)) * 100) / 100;
}

/* ------------------------------------------------------------------ */
/* visuals                                                             */
/* ------------------------------------------------------------------ */

/** A number line with one hop per step, which is how the workspace animates a chain. */
function jumpsVisual(steps: StrategyStep[]): Visual {
  const hops = steps.filter((s) => s.delta !== undefined && s.delta !== 0).map((s) => s.delta as number);
  if (!hops.length || steps.length === 0) return { type: 'none' };
  return { type: 'jumps', from: steps[0].from, jumps: hops };
}

/* ------------------------------------------------------------------ */
/* addition                                                            */
/* ------------------------------------------------------------------ */

/** Split a number into its place-value parts, biggest first: 286 → [200, 80, 6]. */
export function placeParts(n: number): number[] {
  const out: number[] = [];
  let mag = 1;
  while (mag * 10 <= Math.abs(n)) mag *= 10;
  let rest = Math.abs(n);
  while (mag >= 1) {
    const part = Math.floor(rest / mag) * mag;
    if (part) out.push(part);
    rest -= part;
    mag /= 10;
  }
  return out.length ? out : [0];
}

function addPlaceChunks(a: number, b: number): Strategy {
  const parts = placeParts(b);
  let run = a;
  const steps: StrategyStep[] = parts.map((p) => {
    const from = run; run += p;
    return { label: `${from} + ${p}`, from, delta: p, to: run, note: p >= 100 ? 'hundreds first' : p >= 10 ? 'then the tens' : 'then the ones' };
  });
  return {
    id: 'place-chunks', name: STRATEGY_NAMES['place-chunks'],
    when: 'always works: the safe default for any addition',
    why: `${b} is ${parts.join(' + ')}, so adding it is the same as adding each part in turn.`,
    steps, answer: a + b, effort: effortOf(steps), visual: jumpsVisual(steps),
  };
}

function addLeftToRight(a: number, b: number): Strategy {
  const pa = placeParts(a); const pb = placeParts(b);
  const n = Math.max(pa.length, pb.length);
  const steps: StrategyStep[] = [];
  let run = 0;
  const A = Array.from({ length: n }, (_, i) => pa[pa.length - n + i] ?? 0);
  const B = Array.from({ length: n }, (_, i) => pb[pb.length - n + i] ?? 0);
  for (let i = 0; i < n; i++) {
    const sum = A[i] + B[i];
    const from = run; run += sum;
    steps.push({ label: `${A[i]} + ${B[i]} = ${sum}`, from, delta: sum, to: run, note: i === 0 ? 'the big parts first' : 'add this place, keep the running total' });
  }
  return {
    id: 'left-to-right', name: STRATEGY_NAMES['left-to-right'],
    when: 'good when both numbers split cleanly and you like keeping one running total',
    why: 'Addition can be regrouped freely, so the hundreds, tens and ones can each be added on their own and the parts recombined.',
    steps, answer: a + b, effort: effortOf(steps, 0.4), visual: jumpsVisual(steps),
  };
}

function addMakeTen(a: number, b: number): Strategy | null {
  const need = (10 - ones(a)) % 10;
  if (need === 0 || need > b) return null;
  const rest = b - need;
  const mid = a + need;
  const steps: StrategyStep[] = [
    { label: `${a} + ${need}`, from: a, delta: need, to: mid, note: `${a} needs ${lab(need, 'partner to make ten')} to reach the round ${mid}` },
    { label: `${mid} + ${rest}`, from: mid, delta: rest, to: mid + rest, note: `${b} − ${need} = ${lab(rest, 'left to add')}` },
  ];
  return {
    id: 'make-ten', name: STRATEGY_NAMES['make-ten'],
    when: 'when the ones digits add to 10 or more: slide up to the round number first',
    why: `Moving ${need} from ${b} to ${a} does not change the total, and ${mid} is easier to work from.`,
    steps, answer: a + b, effort: effortOf(steps, -0.9), visual: jumpsVisual(steps),
  };
}

function addCompensate(a: number, b: number): Strategy | null {
  // Round whichever addend sits closest below a round ten or hundred.
  const nearUp = (n: number) => {
    const upTen = (10 - ones(n)) % 10;
    const upHun = (100 - (n % 100)) % 100;
    if (n >= 100 && upHun > 0 && upHun <= 15) return upHun;
    if (upTen > 0 && upTen <= 3) return upTen;
    return 0;
  };
  const upA = nearUp(a); const upB = nearUp(b);
  if (!upA && !upB) return null;
  // Round the one needing the smaller correction; ties go to the second number.
  const roundA = !!upA && (!upB || upA < upB);
  const up = roundA ? upA : upB;
  const x = roundA ? a : b;
  const keep = roundA ? b : a;
  const rounded = x + up;
  const mid = keep + rounded;
  if (roundA) {
    const stepsA: StrategyStep[] = [
      { label: `${rounded} + ${keep}`, from: rounded, delta: keep, to: mid, note: `${x} is almost ${rounded}` },
      { label: `${mid} − ${up}`, from: mid, delta: -up, to: mid - up, note: `you added ${lab(up, 'extra')} too many, so take it back` },
    ];
    return {
      id: 'compensate', name: STRATEGY_NAMES.compensate,
      when: 'when a number is just under a round ten or hundred',
      why: `${a} + ${b} = (${rounded} − ${up}) + ${keep}, and starting from the round ${rounded} is easy.`,
      steps: stepsA, answer: a + b, effort: effortOf(stepsA, -0.5), visual: jumpsVisual(stepsA),
    };
  }
  const steps: StrategyStep[] = [
    { label: `${a} + ${rounded}`, from: a, delta: rounded, to: mid, note: `${b} is almost ${rounded}` },
    { label: `${mid} − ${up}`, from: mid, delta: -up, to: mid - up, note: `you added ${lab(up, 'extra')} too many, so take it back` },
  ];
  return {
    id: 'compensate', name: STRATEGY_NAMES.compensate,
    when: 'when a number is just under a round ten or hundred',
    why: `${a} + ${b} = ${a} + (${rounded} − ${up}), and adding the round ${rounded} is easy.`,
    steps, answer: a + b, effort: effortOf(steps, -0.5), visual: jumpsVisual(steps),
  };
}

function addNearDouble(a: number, b: number): Strategy | null {
  const diff = b - a;
  if (Math.abs(diff) > 2) return null;
  const dbl = a * 2;
  const steps: StrategyStep[] = [
    { label: `${a} + ${a}`, from: a, delta: a, to: dbl, note: 'doubles are fast', cheap: true },
  ];
  if (diff !== 0) steps.push({ label: `${dbl} ${diff > 0 ? '+' : '−'} ${Math.abs(diff)}`, from: dbl, delta: diff, to: dbl + diff, note: `${b} is ${Math.abs(diff)} ${diff > 0 ? 'more' : 'less'} than ${a}` });
  return {
    id: 'near-double', name: STRATEGY_NAMES['near-double'],
    when: 'when the two numbers are within 2 of each other',
    why: `${b} = ${a} ${diff >= 0 ? '+' : '−'} ${Math.abs(diff)}, so the sum is the double plus that little bit.`,
    steps, answer: a + b, effort: effortOf(steps, -0.6), visual: jumpsVisual(steps),
  };
}

/* ------------------------------------------------------------------ */
/* subtraction                                                         */
/* ------------------------------------------------------------------ */

function subCountDown(a: number, b: number): Strategy {
  const parts = placeParts(b);
  let run = a;
  const steps: StrategyStep[] = parts.map((p) => {
    const from = run; run -= p;
    return { label: `${from} − ${p}`, from, delta: -p, to: run, note: p >= 100 ? 'hundreds first' : p >= 10 ? 'then the tens' : 'then the ones' };
  });
  return {
    id: 'count-down', name: STRATEGY_NAMES['count-down'],
    when: 'always works: take away the big parts first, then the small ones',
    why: `${b} is ${parts.join(' + ')}, so taking it away is the same as taking away each part in turn.`,
    steps, answer: a - b, effort: effortOf(steps), visual: jumpsVisual(steps),
  };
}

function subCompensate(a: number, b: number): Strategy | null {
  const upTen = (10 - ones(b)) % 10;
  const upHun = (100 - (b % 100)) % 100;
  let up = 0;
  if (b >= 100 && upHun > 0 && upHun <= 15) up = upHun;
  else if (upTen > 0 && upTen <= 3) up = upTen;
  if (!up) return null;
  const rounded = b + up;
  const mid = a - rounded;
  const steps: StrategyStep[] = [
    { label: `${a} − ${rounded}`, from: a, delta: -rounded, to: mid, note: `${b} is almost ${rounded}` },
    { label: `${mid} + ${up}`, from: mid, delta: up, to: mid + up, note: `you took ${lab(up, 'extra')} too many, so give it back` },
  ];
  return {
    id: 'sub-compensate', name: STRATEGY_NAMES['sub-compensate'],
    when: 'when the number you subtract is just under a round ten or hundred',
    why: `${a} − ${b} = ${a} − ${rounded} + ${up}: take away the round number, then hand back what you overtook.`,
    steps, answer: a - b, effort: effortOf(steps, -0.5), visual: jumpsVisual(steps),
  };
}

function subCountUp(a: number, b: number): Strategy {
  const steps: StrategyStep[] = [];
  let run = b;
  const toTen = (10 - ones(b)) % 10;
  // Only hop up to the next ten when it is on the way: 41 → 43 is one short hop, never 41 → 50 and back.
  if (toTen && run + toTen <= a) { steps.push({ label: `${run} → ${run + toTen}`, from: run, delta: toTen, to: run + toTen, note: 'up to the next ten' }); run += toTen; }
  const toHundred = (100 - (run % 100)) % 100;
  if (toHundred && run + toHundred <= a) { steps.push({ label: `${run} → ${run + toHundred}`, from: run, delta: toHundred, to: run + toHundred, note: 'up to the next hundred' }); run += toHundred; }
  const bigJump = Math.floor((a - run) / 100) * 100;
  if (bigJump) { steps.push({ label: `${run} → ${run + bigJump}`, from: run, delta: bigJump, to: run + bigJump, note: 'whole hundreds' }); run += bigJump; }
  const tenJump = Math.floor((a - run) / 10) * 10;
  if (tenJump) { steps.push({ label: `${run} → ${run + tenJump}`, from: run, delta: tenJump, to: run + tenJump, note: 'whole tens' }); run += tenJump; }
  if (a - run) steps.push({ label: `${run} → ${a}`, from: run, delta: a - run, to: a, note: 'and the last bit' });
  const hops = steps.map((s) => s.delta as number);
  // The answer is the distance walked, so the chain closes by adding the hops.
  steps.push({ label: `${hops.join(' + ')}`, from: a, to: a - b, note: 'the distance you walked is the answer' });
  return {
    id: 'count-up', name: STRATEGY_NAMES['count-up'],
    when: 'when the two numbers are close, or a borrow would be messy',
    why: `A difference is the distance between the numbers, so counting up from ${b} to ${a} gives the same answer: ${hops.join(' + ')} = ${a - b}.`,
    steps, answer: a - b, effort: effortOf(steps, 0.2), visual: jumpsVisual(steps),
  };
}

function subConstantDifference(a: number, b: number): Strategy | null {
  const up = (10 - ones(b)) % 10;
  if (!up || up > 4) return null;
  const a2 = a + up; const b2 = b + up;
  const steps: StrategyStep[] = [
    { label: `both + ${up}`, from: a, delta: up, to: a2, note: `${a} − ${b} becomes ${a2} − ${b2}` },
    { label: `${a2} − ${b2}`, from: a2, delta: -b2, to: a2 - b2, note: `${b2} is round, so this is easy` },
  ];
  return {
    id: 'constant-difference', name: STRATEGY_NAMES['constant-difference'],
    when: 'when adding a little to both numbers makes the subtracted one round',
    why: `Sliding both numbers up the line by ${up} keeps the gap between them identical, so ${a} − ${b} = ${a2} − ${b2}.`,
    steps, answer: a - b, effort: effortOf(steps, -0.4), visual: { type: 'jumps', from: b, jumps: [a - b] },
  };
}

/* ------------------------------------------------------------------ */
/* multiplication                                                      */
/* ------------------------------------------------------------------ */

function mulDistribute(a: number, b: number): Strategy {
  // Split the larger-place number by place value and multiply each part by the other.
  const [big, small] = a >= b ? [a, b] : [b, a];
  const parts = placeParts(big);
  let run = 0;
  const steps: StrategyStep[] = [];
  parts.forEach((p, i) => {
    const prod = p * small;
    const from = run; run += prod;
    steps.push({ label: `${p} × ${small} = ${prod}`, from, delta: prod, to: run, note: i === 0 ? 'the big part first' : 'add it on' });
  });
  return {
    id: 'distribute', name: STRATEGY_NAMES.distribute,
    when: 'the workhorse: break the bigger number into place-value parts',
    why: `The distributive property: (${parts.join(' + ')}) × ${small} = ${parts.map((p) => `${p} × ${small}`).join(' + ')}.`,
    steps, answer: a * b, effort: effortOf(steps, 0.6), visual: { type: 'bar', bars: [{ label: `${small} ×`, parts: parts.map((p) => p * small) }], whole: a * b },
  };
}

function mulDistributeTens(a: number, b: number): Strategy | null {
  if (b < 10 || a < 10) return null;
  const bt = Math.floor(b / 10) * 10; const bo = b % 10;
  if (!bo) return null;
  const p1 = a * bt; const p2 = a * bo;
  const steps: StrategyStep[] = [
    { label: `${a} × ${bt} = ${p1}`, from: 0, delta: p1, to: p1, note: `${a} × ${bt / 10} then × 10` },
    { label: `${a} × ${bo} = ${p2}`, from: p1, delta: p2, to: p1 + p2, note: 'the ones part' },
  ];
  return {
    id: 'distribute-tens', name: STRATEGY_NAMES['distribute-tens'],
    when: 'two-digit × two-digit: split the second number into tens and ones',
    why: `${a} × ${b} = ${a} × (${bt} + ${bo}) = ${p1} + ${p2}.`,
    steps, answer: a * b, effort: effortOf(steps, 0.9), visual: { type: 'bar', bars: [{ label: `${a} ×`, parts: [p1, p2] }], whole: a * b },
  };
}

function mulCompensate(a: number, b: number): Strategy | null {
  const near = (n: number) => { const upTen = (10 - ones(n)) % 10; const upHun = (100 - (n % 100)) % 100; if (n >= 100 && upHun > 0 && upHun <= 5) return upHun; if (upTen > 0 && upTen <= 2) return upTen; return 0; };
  const upA = near(a); const upB = near(b);
  const [x, y, up] = upB && (!upA || upB <= upA) ? [b, a, upB] : upA ? [a, b, upA] : [0, 0, 0];
  if (!up) return null;
  const rounded = x + up; const full = rounded * y; const back = up * y;
  const steps: StrategyStep[] = [
    { label: `${rounded} × ${y} = ${full}`, from: 0, delta: full, to: full, note: `${x} is almost ${rounded}` },
    { label: `${full} − ${back}`, from: full, delta: -back, to: full - back, note: `you counted ${up} extra ${y}${up > 1 ? 's' : ''}: ${up} × ${y} = ${lab(back, 'amount to take back')}` },
  ];
  return {
    id: 'mul-compensate', name: STRATEGY_NAMES['mul-compensate'],
    when: 'when one number is just under a round ten or hundred',
    why: `${x} × ${y} = (${rounded} − ${up}) × ${y} = ${full} − ${back}.`,
    steps, answer: a * b, effort: effortOf(steps, 0.3), visual: { type: 'bar', bars: [{ label: `${rounded} × ${y}`, parts: [full - back, back] }], whole: full },
  };
}

function mulDoubleHalf(a: number, b: number): Strategy | null {
  const even = a % 2 === 0 ? a : b % 2 === 0 ? b : 0;
  if (!even) return null;
  const other = even === a ? b : a;
  const half = even / 2; const dbl = other * 2;
  // Only worth it when it lands on a friendly number (round ten/hundred or a small single digit).
  const friendly = (n: number) => n % 100 === 0 || n % 10 === 0 || n < 10;
  if (!friendly(dbl) && !friendly(half)) return null;
  if (half < 2) return null;
  const steps: StrategyStep[] = [
    { label: `halve ${even} → ${half}, double ${other} → ${dbl}`, from: 0, delta: 0, to: 0, note: 'one number halves, the other doubles' },
    { label: `${half} × ${dbl} = ${half * dbl}`, from: 0, delta: half * dbl, to: half * dbl, note: 'a much friendlier product' },
  ];
  return {
    id: 'double-half', name: STRATEGY_NAMES['double-half'],
    when: 'when halving one number makes the other land on something round',
    why: `Halving one factor and doubling the other leaves the product unchanged, because ÷2 and ×2 cancel.`,
    steps, answer: a * b, effort: effortOf(steps, 0.1), visual: { type: 'bar', bars: [{ label: `${even} × ${other}`, parts: [even * other] }, { label: `${half} × ${dbl}`, parts: [half * dbl] }] },
  };
}

function mulElevens(a: number, b: number): Strategy | null {
  const n = a === 11 ? b : b === 11 ? a : 0;
  if (!n || n < 10 || n > 99) return null;
  const t = Math.floor(n / 10); const o = n % 10; const mid = t + o;
  const steps: StrategyStep[] = mid < 10
    ? [{ label: `${t} _ ${o} with ${t} + ${o} = ${mid} in the middle`, from: 0, delta: n * 11, to: n * 11, note: 'split the digits, drop the sum between them' }]
    : [
        { label: `${t} + ${o} = ${mid}`, from: 0, delta: 0, to: 0, note: 'the middle digit overflows' },
        { label: `carry the 1: ${t + 1} ${mid - 10} ${o}`, from: 0, delta: n * 11, to: n * 11, note: 'add the carry to the left digit' },
      ];
  return {
    id: 'times-eleven', name: STRATEGY_NAMES['times-eleven'],
    when: 'only for × 11 with a two-digit number',
    why: `× 11 is × 10 + × 1, so ${n} × 11 = ${n * 10} + ${n}. Writing the digits with their sum between them is just that addition done in place.`,
    steps, answer: n * 11, effort: 1.6, visual: { type: 'bar', bars: [{ label: `${n} × 11`, parts: [n * 10, n] }], whole: n * 11 },
  };
}

function mulDiffSquares(a: number, b: number): Strategy | null {
  if ((a + b) % 2 !== 0) return null;
  const mid = (a + b) / 2; const d = Math.abs(mid - a);
  if (d === 0 || d > 3 || mid % 5 !== 0) return null;
  const steps: StrategyStep[] = [
    { label: `${mid}² = ${mid * mid}`, from: 0, delta: mid * mid, to: mid * mid, note: `both numbers sit ${d} from ${mid}` },
    { label: `− ${d}² = ${d * d}`, from: mid * mid, delta: -(d * d), to: mid * mid - d * d, note: 'take off the square of the gap' },
  ];
  return {
    id: 'diff-squares', name: STRATEGY_NAMES['diff-squares'],
    when: 'when both numbers sit the same small distance either side of a round number',
    why: `(${mid} − ${d})(${mid} + ${d}) = ${mid}² − ${d}², because the two cross terms cancel.`,
    steps, answer: a * b, effort: 2.2, visual: { type: 'bar', bars: [{ label: `${mid}²`, parts: [mid * mid - d * d, d * d] }] },
  };
}

function mulFactorSplit(a: number, b: number): Strategy | null {
  // e.g. 24 × 25 → 24 × 100 ÷ 4 for ×25, or ×50 as half of ×100, or ×5 as half of ×10.
  const table: Record<number, { via: number; div: number }> = { 5: { via: 10, div: 2 }, 50: { via: 100, div: 2 }, 25: { via: 100, div: 4 }, 500: { via: 1000, div: 2 }, 250: { via: 1000, div: 4 } };
  const key = table[a] ? a : table[b] ? b : 0;
  if (!key) return null;
  const other = key === a ? b : a;
  const { via, div } = table[key];
  const big = other * via;
  if (big % div !== 0) return null;
  const steps: StrategyStep[] = [
    { label: `${other} × ${via} = ${big}`, from: 0, delta: big, to: big, note: `× ${via} just shifts the digits` },
    { label: `${big} ÷ ${div} = ${big / div}`, from: big, delta: big / div - big, to: big / div, note: `${key} is ${via} ÷ ${div}` },
  ];
  return {
    id: 'factor-split', name: STRATEGY_NAMES['factor-split'],
    when: `for × 5, × 25, × 50 and friends`,
    why: `${key} = ${via} ÷ ${div}, so × ${key} is × ${via} then ÷ ${div}.`,
    steps, answer: a * b, effort: effortOf(steps, 0.2), visual: { type: 'bar', bars: [{ label: `${other} × ${via}`, parts: [big] }, { label: `÷ ${div}`, parts: [big / div] }] },
  };
}

/* ------------------------------------------------------------------ */
/* public API                                                          */
/* ------------------------------------------------------------------ */

/** Every mentally sensible strategy for a problem, easiest first. Never empty. */
export function strategiesFor(op: Op, a: number, b: number): Strategy[] {
  const out: (Strategy | null)[] = [];
  if (op === 'add') {
    out.push(addPlaceChunks(a, b), addLeftToRight(a, b), addMakeTen(a, b), addCompensate(a, b), addNearDouble(a, b));
  } else if (op === 'sub') {
    out.push(subCountDown(a, b), subCompensate(a, b), subConstantDifference(a, b));
    // Counting up is only sensible when the gap is small or a borrow is needed.
    if (a - b <= 30 || ones(a) < ones(b) || tensDigit(a) < tensDigit(b)) out.push(subCountUp(a, b));
  } else {
    out.push(mulDistribute(a, b), mulDistributeTens(a, b), mulCompensate(a, b), mulDoubleHalf(a, b), mulElevens(a, b), mulDiffSquares(a, b), mulFactorSplit(a, b));
  }
  const list = out.filter((s): s is Strategy => !!s);
  const expected = op === 'add' ? a + b : op === 'sub' ? a - b : a * b;
  // A strategy that does not reach the right answer is a bug, never shown to a learner.
  const valid = list.filter((s) => s.answer === expected && s.steps[s.steps.length - 1]?.to === expected);
  const seen = new Set<string>();
  const unique = valid.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
  unique.sort((x, y) => x.effort - y.effort);
  return unique.length ? unique : [op === 'sub' ? subCountDown(a, b) : op === 'mul' ? mulDistribute(a, b) : addPlaceChunks(a, b)];
}

/** The strategy this problem is designed to teach, if it applies; otherwise the easiest one. */
export function strategyFor(op: Op, a: number, b: number, prefer?: StrategyId): Strategy {
  const all = strategiesFor(op, a, b);
  return (prefer && all.find((s) => s.id === prefer)) || all[0];
}

/**
 * One step as a line of worked text. The number held after the step is labelled (running total, or the answer on the
 * last step); a step that already states its own result ("20 × 7 = 140") shows the new running total after an arrow,
 * so a partial product is never written equal to the running total. Descriptive steps ("halve 16 → 8, …") stand alone.
 */
export function stepText(x: StrategyStep, isLast: boolean): string {
  const role = isLast ? 'answer' : 'running total';
  let body: string;
  const eq = x.label.indexOf('=');
  if ((x.delta === 0 && x.to === 0) || !/^[−\-\d]/.test(x.label)) body = x.label;
  else if (eq > 0) body = Number(x.label.slice(eq + 1).replace(/[^\d.]/g, '')) === Math.abs(x.to) ? x.label : `${x.label} → ${lab(x.to, role)}`;
  else if (x.label.includes('→') && x.delta !== undefined) body = `${x.label}: ${lab(x.delta, 'hop')}`;
  else body = `${x.label} = ${lab(x.to, role)}`;
  return x.note ? `${body} — ${x.note}` : body;
}

/** Human-readable full explanation, generated from the steps. */
export function explain(s: Strategy, op: Op, a: number, b: number): string[] {
  const head = `${a} ${OP_SIGN[op]} ${b} — ${s.name.toLowerCase()}.`;
  const shown = s.steps.filter((x) => x.delta !== 0 || x.note);
  const body = shown.map((x, i) => `${stepText(x, i === shown.length - 1)}.`);
  return [head, ...body, `So ${a} ${OP_SIGN[op]} ${b} = ${s.answer}.`, s.why];
}

/** Which of these strategies is cognitively easiest here, and why, for strategy-choice coaching. */
export function coachChoice(op: Op, a: number, b: number): { best: Strategy; others: Strategy[]; reason: string } {
  const all = strategiesFor(op, a, b);
  const best = all[0];
  const others = all.slice(1);
  const gap = others.length ? Math.round((others[0].effort - best.effort) * 10) / 10 : 0;
  const reason = others.length === 0
    ? `${best.name} is the only sensible route here.`
    : gap < 0.35
      ? `${best.name} and ${others[0].name.toLowerCase()} are about equally easy here — either is a good choice.`
      : `${best.name} is easiest here: ${best.when}. It holds ${best.steps.length} number${best.steps.length === 1 ? '' : 's'} where ${others[0].name.toLowerCase()} makes you hold more.`;
  return { best, others, reason };
}

/* ------------------------------------------------------------------ */
/* guided practice                                                     */
/* ------------------------------------------------------------------ */

export interface GuidedStep { question: string; expect: number; note?: string }
const SIMPLE = /^[\d\s×+−\-÷*]+$/;

/**
 * The chain of intermediate answers a learner types during guided practice. A step that states a
 * partial product ("20 × 7 = 140") asks for the product and then for the new running total, so the
 * learner practises holding the number as well as computing it.
 */
export function guidedSteps(s: Strategy): GuidedStep[] {
  const out: GuidedStep[] = [];
  for (const st of s.steps) {
    if ((st.delta === undefined || st.delta === 0) && st.to === st.from) continue;
    const eq = st.label.indexOf('=');
    if (eq > 0 && SIMPLE.test(st.label.slice(0, eq))) {
      const lhs = st.label.slice(0, eq).trim();
      const rhs = Number(st.label.slice(eq + 1).replace(/[^0-9-]/g, ''));
      if (Number.isFinite(rhs)) {
        out.push({ question: lhs, expect: rhs, note: st.note });
        if (st.from !== 0 && st.to !== rhs) out.push({ question: `${st.from} + ${rhs}`, expect: st.to, note: 'add it to what you are holding' });
        continue;
      }
    }
    out.push({ question: st.label, expect: st.to, note: st.note });
  }
  if (!out.length || out[out.length - 1].expect !== s.answer) out.push({ question: 'and the total', expect: s.answer });
  return out;
}
