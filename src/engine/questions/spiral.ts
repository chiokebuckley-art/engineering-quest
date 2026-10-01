import type { Difficulty, Question } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { pictureQuestion, num } from './picture';
import { lab, labn } from '../label';

/**
 * Spiral review: the mixed-skill questions that keep coming back on weekly practice sheets.
 *  powers    — multiply and divide by 10, 100, 1000 and powers written as 10³
 *  pvalue    — "the 2 here is 1/10 the value of the 2 there": place-value relationships
 *  areamodel — partial-quotient area models for long division
 *  whichexpr — pick the expression that equals a given product, using estimation and the ones digit
 *  interpret — division word problems where the remainder decides the answer
 */
export type SpiralKind = 'powers' | 'pvalue' | 'areamodel' | 'whichexpr' | 'interpret' | 'all';
export const SPIRAL_KINDS: { id: SpiralKind; label: string; short: string; desc: string }[] = [
  { id: 'all', label: 'Mixed spiral review', short: 'Mixed', desc: 'Everything below, shuffled, the way a weekly review sheet mixes it.' },
  { id: 'powers', label: 'Powers of ten', short: '×÷ 10s', desc: '10³ means 10 × 10 × 10. Multiplying shifts digits left, dividing shifts them right.' },
  { id: 'pvalue', label: 'Place-value relationships', short: 'Place value', desc: 'Each place is 10 times the one to its right and 1/10 of the one to its left.' },
  { id: 'areamodel', label: 'Division area models', short: 'Area model', desc: 'Partial quotients: take off easy chunks of the divisor until nothing is left.' },
  { id: 'whichexpr', label: 'Which expression equals it?', short: 'Which one', desc: 'Estimate first, then check the ones digit. No full multiplication needed.' },
  { id: 'interpret', label: 'What does the remainder mean?', short: 'Remainder', desc: 'Round up, round down, or use the remainder itself — the question decides.' },
];

const T = 'Spiral review';
const mk = (skill: string, sub: string, o: Parameters<typeof pictureQuestion>[4]) => pictureQuestion('spi', T, skill, sub, o);
const PLACES = ['thousands', 'hundreds', 'tens', 'ones', 'tenths', 'hundredths', 'thousandths'];
/** Round away binary noise so 71.4 × 10 is 714, not 713.9999999999999. */
const clean = (n: number) => Math.round(n * 1e6) / 1e6;

/* ---------------- powers of ten ---------------- */
export function powersQuestion(value: number, exp: number, op: 'mul' | 'div', style: 'power' | 'plain', d: Difficulty, skill = 'spiral.powers'): Question {
  const mult = 10 ** exp;
  const answer = clean(op === 'mul' ? value * mult : value / mult);
  const written = style === 'power' ? `10${['⁰', '¹', '²', '³', '⁴'][exp]}` : String(mult);
  const dirWord = op === 'mul' ? 'left' : 'right';
  return mk(skill, 'Powers of ten', {
    prompt: `What is ${num(value, 4)} ${op === 'mul' ? '×' : '÷'} ${written}?`,
    expression: `${num(value, 4)} ${op === 'mul' ? '×' : '÷'} ${written} = ?`,
    answer, unit: '', difficulty: d, decimal: true,
    hint: `${written} is ${exp} ${exp === 1 ? 'ten' : 'tens'} multiplied together, so every digit shifts ${exp} place${exp === 1 ? '' : 's'} to the ${dirWord}.`,
    steps: [
      style === 'power' ? `${written} means ${Array(exp).fill('10').join(' × ')} = ${mult}.` : `${mult} is 1 followed by ${exp} zero${exp === 1 ? '' : 's'}.`,
      `${op === 'mul' ? 'Multiplying' : 'Dividing'} by ${mult} moves every digit ${exp} place${exp === 1 ? '' : 's'} to the ${dirWord}; the decimal point stays where it is and the digits slide past it.`,
      `${num(value, 4)} → ${num(answer, 6)}.`,
      `Check the size: ${op === 'mul' ? 'multiplying by ten makes it bigger' : 'dividing by ten makes it smaller'}, and ${num(answer, 6)} ${op === 'mul' ? '>' : '<'} ${num(value, 4)}.`,
    ],
    visual: { type: 'pvchart', value: num(value, 4), shift: op === 'mul' ? exp : -exp },
  });
}

/* ---------------- place-value relationships ---------------- */
export function pvalueQuestion(source: string, digit: number, mode: 'value' | 'tenth' | 'pick', options: string[], answerIdx: number, d: Difficulty, skill = 'spiral.pvalue'): Question {
  const placeOf = (s: string, dg: number) => {
    const dot = s.indexOf('.');
    const i = s.indexOf(String(dg));
    const whole = dot === -1 ? s.length : dot;
    return i < whole ? whole - i - 1 : whole - i;
  };
  const p = placeOf(source, digit);
  const value = clean(digit * 10 ** p);
  const placeName = PLACES[3 - p] ?? 'that place';
  if (mode === 'value') {
    return mk(skill, 'Place-value relationships', {
      prompt: `In ${source}, what is the digit ${digit} worth?`,
      expression: `value of the ${digit} in ${source} = ?`, answer: value, unit: '', difficulty: d, decimal: true,
      hint: 'Name the place it sits in, then write that place value.',
      steps: [`The ${digit} sits in the ${placeName} place.`, `So it is worth ${lab(digit, 'digit')} × ${lab(num(10 ** p, 6), 'place value')} = ${lab(num(value, 6), 'what it is worth')}.`, `A digit's value is the digit times its place, never just the digit.`],
      visual: { type: 'pvchart', value: source, highlight: p },
    });
  }
  if (mode === 'tenth') {
    const tenth = clean(value / 10);
    return mk(skill, 'Place-value relationships', {
      prompt: `In ${source} the digit ${digit} is worth ${num(value, 6)}. What is 1/10 of that value?`,
      expression: `${num(value, 6)} ÷ 10 = ?`, answer: tenth, unit: '', difficulty: d, decimal: true,
      hint: 'One tenth of a place value is the next place to the right.',
      steps: [`${lab(num(value, 6), 'value now')} ÷ 10 = ${lab(num(tenth, 6), 'one tenth of it')}.`, `Each place is worth 1/10 of the place to its left, so the ${digit} would have to move one place right to be worth ${num(tenth, 6)}.`],
      visual: { type: 'pvchart', value: source, highlight: p, shift: -1 },
    });
  }
  return mk(skill, 'Place-value relationships', {
    prompt: `In ${source} the digit ${digit} is worth ${num(value, 6)}. In which of these numbers is the ${digit} worth 1/10 of that? Answer with the option number.\n${options.map((o, i) => `${i + 1}) ${o}`).join('   ')}`,
    expression: `1/10 of ${num(value, 6)} = ${num(value / 10, 6)} — which one?`, answer: answerIdx + 1, unit: '', difficulty: d,
    hint: `You are hunting for a ${digit} one place further right: worth ${num(value / 10, 6)}.`,
    steps: [`The ${digit} in ${source} is in the ${placeName} place, worth ${num(value, 6)}.`, `One tenth of that is ${num(value / 10, 6)}, which is the next place to the right.`, `Option ${answerIdx + 1}, ${options[answerIdx]}, has its ${digit} exactly there.`],
    visual: { type: 'options', items: options, note: `looking for a ${digit} worth ${num(value / 10, 6)}` },
  });
}

/* ---------------- division area models ---------------- */
export function areaModelQuestion(dividend: number, divisor: number, ask: 'blank' | 'quotient' | 'left', d: Difficulty, rng: Rng, skill = 'spiral.areamodel'): Question {
  // One friendly chunk per place of the quotient: 156 becomes 100 + 50 + 6, which is what an
  // area model actually looks like, and the strips always add back to the dividend exactly.
  const quotient = Math.floor(dividend / divisor);
  const rows = String(quotient).split('').map((ch, i, all) => Number(ch) * 10 ** (all.length - 1 - i))
    .filter((q) => q > 0)
    .map((q) => ({ q, product: divisor * q }));
  const blankIdx = rows.length ? rng.int(0, rows.length - 1) : 0;
  if (ask === 'blank') {
    const row = rows[blankIdx];
    return mk(skill, 'Division area models', {
      prompt: `An area model for ${dividend.toLocaleString('en-US')} ÷ ${divisor}. One product is missing. What goes in the blank?`,
      expression: `${divisor} × ${row.q} = ?`, answer: row.product, unit: '', difficulty: d,
      hint: `Each row is ${divisor} times the number beside it.`,
      steps: [`Every row of an area model is ${divisor} × (that row's partial quotient).`, `${lab(divisor, 'divisor')} × ${lab(row.q, 'partial quotient')} = ${lab(row.product, 'row product')}.`, `The rows add to the dividend: ${rows.map((r) => r.product).join(' + ')} = ${lab(dividend.toLocaleString('en-US'), 'dividend')}.`],
      visual: { type: 'areamodel', divisor, rows, blank: blankIdx },
    });
  }
  if (ask === 'left') {
    const upto = Math.max(1, rows.length - 1);
    const used = rows.slice(0, upto).reduce((a, r) => a + r.product, 0);
    return mk(skill, 'Division area models', {
      prompt: `Dividing ${dividend.toLocaleString('en-US')} ÷ ${divisor}, you have taken off ${rows.slice(0, upto).map((r) => `${divisor} × ${r.q}`).join(' and ')}. How much of the ${dividend.toLocaleString('en-US')} is left to divide?`,
      expression: `${dividend.toLocaleString('en-US')} − ${used.toLocaleString('en-US')} = ?`, answer: dividend - used, unit: '', difficulty: d,
      hint: 'Add the products you have used, then subtract from the dividend.',
      steps: [`Used so far: ${rows.slice(0, upto).map((r) => r.product).join(' + ')} = ${lab(used.toLocaleString('en-US'), 'used so far')}.`, `${lab(dividend.toLocaleString('en-US'), 'dividend')} − ${lab(used.toLocaleString('en-US'), 'used so far')} = ${lab(dividend - used, 'left to divide')}.`, `Keep taking off chunks of ${divisor} until nothing is left; the partial quotients add up to the answer.`],
      visual: { type: 'areamodel', divisor, rows: rows.slice(0, upto) },
    });
  }
  return mk(skill, 'Division area models', {
    prompt: `This area model divides ${dividend.toLocaleString('en-US')} by ${divisor}. What is the quotient?`,
    expression: `${rows.map((r) => r.q).join(' + ')} = ?`, answer: quotient, unit: '', difficulty: d,
    hint: 'The quotient is the sum of the partial quotients down the side.',
    steps: [`Each row takes off ${lab(divisor, 'divisor')} times its partial quotient: ${rows.map((r) => `${divisor} × ${r.q} = ${r.product}`).join(', ')}.`, `The products add to ${rows.map((r) => r.product).join(' + ')} = ${lab(dividend.toLocaleString('en-US'), 'dividend')}, the whole dividend.`, `So the quotient is the partial quotients added: ${rows.map((r) => r.q).join(' + ')} = ${lab(quotient, 'quotient')}.`],
    visual: { type: 'areamodel', divisor, rows, total: quotient },
  });
}

/* ---------------- which expression equals it ---------------- */
export function whichExprQuestion(a: number, b: number, d: Difficulty, rng: Rng, skill = 'spiral.whichexpr'): Question {
  // a × (b+1) and (a+1) × b are the same number when a equals b, which would give two right answers.
  if (a === b) b += 1;
  const product = a * b;
  const options = rng.shuffle([[a, b], [a, b + 1], [a + 1, b], [a + 1, b + 1]]);
  const idx = options.findIndex(([x, y]) => x * y === product);
  const labels = options.map(([x, y]) => `${x} × ${y}`);
  const ones = (product % 10);
  const winner = options[idx];
  const others = options.filter((_, i) => i !== idx);
  const byOnes = others.filter(([x, y]) => (x * y) % 10 !== ones).length;
  return mk(skill, 'Which expression equals it?', {
    prompt: `Which expression equals ${product.toLocaleString('en-US')}? Answer with the option number.\n${labels.map((l, i) => `${i + 1}) ${l}`).join('   ')}`,
    expression: `${product.toLocaleString('en-US')} = ?`, answer: idx + 1, unit: '', difficulty: d,
    hint: 'Do not multiply all four. Multiply the ones digits first and see which products can even end in the right digit.',
    steps: [
      `The target ends in ${ones}. Multiply just the ones digits of each option: ${options.map(([x, y]) => `${x % 10} × ${y % 10} ends in ${(x * y) % 10}`).join('; ')}.`,
      byOnes > 0 ? `That alone rules out ${byOnes} option${byOnes === 1 ? '' : 's'}.` : `Here every option ends in the right digit, so estimate instead.`,
      `Estimate: about ${lab(Math.round(a / 100) * 100 || a, 'first number rounded')} × ${lab(Math.round(b / 10) * 10, 'second number rounded')} ≈ ${lab(((Math.round(a / 100) * 100 || a) * Math.round(b / 10) * 10).toLocaleString('en-US'), 'estimate')}, which is the right size.`,
      `Check the survivor properly: ${winner[0]} × ${winner[1]} = ${product.toLocaleString('en-US')}. Option ${idx + 1}.`,
    ],
    visual: { type: 'options', items: labels, note: `target ${product.toLocaleString('en-US')} · ends in ${ones}` },
  });
}

/* ---------------- interpreting the remainder ---------------- */
/** Labels: the total, the size of one group, full groups (one, many), the remainder (one, many) and, for rounding up, the answer. */
interface RemLabels { total: string; per: string; q: [string, string]; r: [string, string]; up?: string }
const SCENARIOS: { story: (n: number, per: number) => string; mode: 'up' | 'down' | 'rem'; ask: string; labels: RemLabels }[] = [
  { story: (n, per) => `A novel is ${n} pages long. A student reads ${per} pages each day.`, mode: 'up', ask: 'How many days until the whole book is finished?', labels: { total: 'pages', per: 'pages per day', q: ['full day', 'full days'], r: ['page left', 'pages left'], up: 'days' } },
  { story: (n, per) => `${n} people are going on a trip. Each van holds ${per}.`, mode: 'up', ask: 'How many vans are needed so everyone goes?', labels: { total: 'people', per: 'people per van', q: ['full van', 'full vans'], r: ['person left', 'people left'], up: 'vans' } },
  { story: (n, per) => `A workshop has ${n} bolts. Each machine needs ${per} bolts.`, mode: 'down', ask: 'How many machines can be finished?', labels: { total: 'bolts', per: 'bolts per machine', q: ['machine', 'machines'], r: ['bolt left over', 'bolts left over'] } },
  { story: (n, per) => `${n} cm of ribbon is cut into ${per} cm pieces.`, mode: 'down', ask: 'How many whole pieces are there?', labels: { total: 'cm of ribbon', per: 'cm per piece', q: ['whole piece', 'whole pieces'], r: ['cm left over', 'cm left over'] } },
  { story: (n, per) => `${n} eggs are packed into boxes of ${per}.`, mode: 'rem', ask: 'How many eggs are left over?', labels: { total: 'eggs', per: 'eggs per box', q: ['full box', 'full boxes'], r: ['egg left over', 'eggs left over'] } },
];
export function interpretQuestion(total: number, per: number, which: number, d: Difficulty, skill = 'spiral.interpret'): Question {
  const sc = SCENARIOS[which % SCENARIOS.length];
  const q = Math.floor(total / per); const r = total % per;
  const answer = sc.mode === 'up' ? (r ? q + 1 : q) : sc.mode === 'down' ? q : r;
  const unit = sc.mode === 'rem' ? 'left over' : '';
  const L = sc.labels;
  const T = lab(total, L.total); const P = lab(per, L.per); const Q = labn(q, ...L.q); const R = labn(r, ...L.r);
  return mk(skill, 'What does the remainder mean?', {
    prompt: `${sc.story(total, per)} ${sc.ask}`,
    expression: `${total} ÷ ${per} = ?`, answer, unit, difficulty: d,
    hint: sc.mode === 'up' ? 'A part-full last one still counts.' : sc.mode === 'down' ? 'Only completed ones count.' : 'The answer is what is left over, not the quotient.',
    steps: [
      `${T} ÷ ${P} = ${Q} remainder ${R}.`,
      sc.mode === 'up'
        ? r ? `There are still ${R} after ${Q}, and they need one more, so the answer rounds up: ${q} + 1 = ${lab(q + 1, L.up ?? L.q[1])}.` : `It divides exactly, so ${lab(q, L.up ?? L.q[1])} is the answer with nothing left over.`
        : sc.mode === 'down'
          ? `Only whole ones count, so the leftover ${R} does not make another. The answer is ${Q}.`
          : `The question asks for the leftovers, not how many groups: the answer is the remainder, ${R}.`,
      `The division is the same every time; the question decides what to do with the remainder.`,
    ],
    visual: { type: 'card', title: 'Remainder', lines: [`${total} ÷ ${per} = ${q} r ${r}`, sc.mode === 'up' ? 'a part-full one still counts → round up' : sc.mode === 'down' ? 'only whole ones count → round down' : 'the answer is the remainder'] },
  });
}

export function spiralQuestion(kind: SpiralKind, d: Difficulty, rng: Rng, skillId?: string): Question {
  const k: Exclude<SpiralKind, 'all'> = kind === 'all' ? rng.pick(['powers', 'pvalue', 'areamodel', 'whichexpr', 'interpret'] as const) : kind;
  const sid = skillId ?? (kind === 'all' ? 'spiral' : `spiral.${k}`);
  if (k === 'powers') {
    const exp = d <= 2 ? 1 : d <= 4 ? rng.int(1, 2) : rng.int(1, 3);
    const op = rng.chance(0.5) ? 'mul' : 'div';
    const whole = rng.int(12, 999);
    const value = d <= 2 ? whole : rng.chance(0.5) ? whole : clean(whole / 10 ** rng.int(1, 2));
    return powersQuestion(value, exp, op, d <= 2 ? 'plain' : rng.chance(0.5) ? 'power' : 'plain', d, sid);
  }
  if (k === 'pvalue') {
    const digit = rng.int(1, 9);
    const mk2 = (place: number) => {
      // Build a number with `digit` sitting `place` steps from the ones column (negative = decimals).
      const digits = Array.from({ length: 5 }, () => rng.int(1, 9));
      const s = `${digits[0]}${digits[1]}.${digits[2]}${digits[3]}${digits[4]}`;
      const arr = s.split('');
      const idx = place >= 0 ? 1 - place : 2 + (-place);
      arr[idx] = String(digit);
      return arr.join('');
    };
    const src = mk2(rng.pick([-1, -1, 0, 1]));
    const mode = d <= 2 ? 'value' : d <= 4 ? rng.pick(['value', 'tenth'] as const) : 'pick';
    if (mode !== 'pick') return pvalueQuestion(src, digit, mode, [], 0, d, sid);
    const dot = src.indexOf('.');
    const i = src.indexOf(String(digit));
    const p = i < dot ? dot - i - 1 : dot - i;
    const target = p - 1; // one place further right
    const build = (place: number) => {
      const arr = `${rng.int(1, 9)}${rng.int(1, 9)}.${rng.int(1, 9)}${rng.int(1, 9)}${rng.int(1, 9)}`.split('');
      const idx = place >= 0 ? 1 - place : 2 + (-place);
      if (idx >= 0 && idx < arr.length && arr[idx] !== '.') arr[idx] = String(digit);
      return arr.join('');
    };
    const right = build(target);
    const wrongs = [build(target + 1), build(target + 2), build(target - 1)].filter((x) => x !== right);
    const options = rng.shuffle([right, ...wrongs.slice(0, 3)]);
    return pvalueQuestion(src, digit, 'pick', options, options.indexOf(right), d, sid);
  }
  if (k === 'areamodel') {
    const divisor = d <= 2 ? rng.int(3, 12) : d <= 4 ? rng.int(12, 40) : rng.int(21, 99);
    const quotient = d <= 2 ? rng.int(11, 60) : rng.int(60, 250);
    const ask = d <= 2 ? 'blank' : rng.pick(['blank', 'quotient', 'left'] as const);
    return areaModelQuestion(divisor * quotient, divisor, ask, d, rng, sid);
  }
  if (k === 'whichexpr') {
    const a = d <= 2 ? rng.int(21, 99) : rng.int(210, 899);
    const b = d <= 2 ? rng.int(11, 29) : rng.int(31, 79);
    return whichExprQuestion(a, b, d, rng, sid);
  }
  const per = d <= 2 ? rng.int(4, 12) : rng.int(12, 40);
  const total = per * rng.int(3, d <= 2 ? 12 : 30) + rng.int(1, per - 1);
  return interpretQuestion(total, per, rng.int(0, 4), d, sid);
}

export const genSpiral: Generator = (skillId, params, ctx) => spiralQuestion(String(params?.kind ?? 'all') as SpiralKind, ctx.difficulty, ctx.rng, skillId);
