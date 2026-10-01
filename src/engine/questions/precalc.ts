import type { Difficulty, Question } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { pictureQuestion, approx, num } from './picture';
import { lab } from '../label';

/**
 * Calculus prep: the algebra that sits directly beneath calculus, chemistry and engineering.
 *  frac.add   — add and subtract fractions with unlike denominators (find the common denominator)
 *  frac.mul   — multiply (cancel first) and divide (keep, change, flip) fractions
 *  neg        — signed numbers: subtracting a negative adds, two negatives multiply to a positive
 *  exp        — exponent rules: x³x² = x⁵, x⁷ ÷ x³ = x⁴, (x²)³ = x⁶, x⁰ = 1, x⁻² = 1/x²
 *  roots      — square and cube roots, roots of powers, simplifying √50 = 5√2
 *  rearrange  — solve a formula for one of its letters: PV = nRT ⇒ T = PV/(nR)
 *  evaluate   — use a rearranged formula with numbers, units included
 *  scinot     — scientific notation: writing, reading, multiplying and dividing powers of ten
 *  units      — unit conversions with prefixes, areas and rates: km/h → m/s
 *  func       — functions as machines: f(3), f(−2), g(f(2)), solve f(x) = k
 *  graph      — lines from points: slope, intercept, reading a value off the graph
 *  trig       — right-triangle trigonometry: SOH CAH TOA, finding a side, finding an angle
 */
export type PrecalcKind = 'frac.add' | 'frac.mul' | 'neg' | 'exp' | 'roots' | 'rearrange' | 'evaluate' | 'scinot' | 'units' | 'func' | 'graph' | 'trig' | 'all';
export const PRECALC_KINDS: { id: PrecalcKind; label: string; short: string; desc: string; stage: number }[] = [
  { id: 'all', label: 'Mixed calculus prep', short: 'Mixed', desc: 'Every topic, shuffled.', stage: 0 },
  { id: 'frac.add', label: 'Fractions: add and subtract', short: '½ + ⅓', desc: 'Find a common denominator, rewrite both, then add the tops. 1/2 + 1/3 = 5/6.', stage: 1 },
  { id: 'frac.mul', label: 'Fractions: multiply and divide', short: '½ × ⅓', desc: 'Multiply straight across (cancel first). To divide, keep, change, flip.', stage: 1 },
  { id: 'neg', label: 'Negative numbers', short: 'Negatives', desc: 'Subtracting a negative is adding. Two negatives multiply to a positive. −3 − (−8) = 5.', stage: 2 },
  { id: 'exp', label: 'Exponent rules', short: 'Exponents', desc: 'Same base: add the exponents to multiply, subtract to divide, multiply for a power of a power.', stage: 3 },
  { id: 'roots', label: 'Roots', short: 'Roots', desc: 'A root undoes a power. √144 = 12, ∛27 = 3, √(x⁶) = x³, √50 = 5√2.', stage: 3 },
  { id: 'rearrange', label: 'Rearranging equations', short: 'Rearrange', desc: 'Undo what is done to the letter you want, on both sides. PV = nRT ⇒ T = PV ÷ (nR).', stage: 4 },
  { id: 'evaluate', label: 'Using a formula', short: 'Formula', desc: 'Rearrange, substitute, calculate, and carry the unit.', stage: 4 },
  { id: 'scinot', label: 'Scientific notation', short: 'Sci. notation', desc: 'One digit before the point, times a power of ten. 32,000 = 3.2 × 10⁴.', stage: 5 },
  { id: 'units', label: 'Unit conversions', short: 'Units', desc: 'Multiply by a fraction equal to 1 and cancel the units. 72 km/h = 20 m/s.', stage: 5 },
  { id: 'func', label: 'Functions', short: 'f(x)', desc: 'A function is a machine: put x in, get f(x) out. f(x) = 3x − 2, so f(4) = 10.', stage: 6 },
  { id: 'graph', label: 'Lines and graphs', short: 'Graphs', desc: 'Slope is rise over run; the intercept is where the line crosses the y-axis.', stage: 6 },
  { id: 'trig', label: 'Trigonometry', short: 'Trig', desc: 'SOH CAH TOA: sin = opposite/hypotenuse, cos = adjacent/hypotenuse, tan = opposite/adjacent.', stage: 6 },
];

const T = 'Calculus prep';
const mk = (skill: string, sub: string, o: Parameters<typeof pictureQuestion>[4]) => pictureQuestion('pc', T, skill, sub, { ...o, prereq: o.prereq ?? ['div'] });
const labelOf = (k: Exclude<PrecalcKind, 'all'>) => PRECALC_KINDS.find((x) => x.id === k)!.label;

/* ---------------- fractions ---------------- */
export const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const lcm = (a: number, b: number) => (a * b) / gcd(a, b);
/** A fraction in lowest terms; the sign lives on the top. */
export function simplify(n: number, d: number): [number, number] {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  return [n / g, d / g];
}
/** Written as 5/6, −7/6, or a whole number when the bottom is 1. */
export function fracText(n: number, d: number): string {
  const [a, b] = simplify(n, d);
  if (b === 1) return String(a).replace('-', '−');
  return `${a}/${b}`.replace('-', '−');
}
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export const sup = (n: number): string => (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map((c) => SUP[Number(c)]).join('');
const neg = (n: number) => (n < 0 ? `(−${-n})` : String(n));
const signed = (n: number) => String(n).replace('-', '−');

export function fracAddQuestion(a: number, b: number, c: number, d: number, op: '+' | '−', diff: Difficulty, skill = 'precalc.frac.add'): Question {
  const L = lcm(b, d);
  const top = op === '+' ? a * (L / b) + c * (L / d) : a * (L / b) - c * (L / d);
  const [sn, sd] = simplify(top, L);
  const answer = sn / sd;
  const same = b === d;
  const steps = [
    same ? `The bottoms are already the same (${b}), so only the tops ${op === '+' ? 'add' : 'subtract'}.` : `The bottoms are different, so the pieces are different sizes. The smallest bottom both ${b} and ${d} go into is ${lab(L, 'common denominator')}.`,
    ...(same ? [] : [`Rewrite each fraction in ${L}ths: ${a}/${b} = ${a * (L / b)}/${L}, multiplying top and bottom by ${lab(L / b, 'scale factor')}; and ${c}/${d} = ${c * (L / d)}/${L}, by ${lab(L / d, 'scale factor')}.`]),
    `Now the tops: ${a * (L / b)} ${op} ${c * (L / d)} = ${lab(signed(top), 'new top')}, over ${lab(L, 'common denominator')}: ${fracText(top, L)}${gcd(top, L) > 1 && top !== 0 ? ` — simplify by ${lab(gcd(top, L), 'common factor')}: ${fracText(sn, sd)}` : ''}.`,
    ...(Math.abs(sn) > sd ? [`As a mixed number that is ${signed(Math.trunc(sn / sd))} ${fracText(Math.abs(sn) % sd, sd)}.`] : []),
    `Never add the bottoms: 1/2 + 1/3 is not 2/5. Half a pizza plus a third of a pizza is more than half, and 2/5 is less.`,
  ];
  return mk(skill, labelOf('frac.add'), {
    prompt: `Work out ${a}/${b} ${op} ${c}/${d}. Give the answer as a fraction in lowest terms.`,
    expression: `${a}/${b} ${op} ${c}/${d} = ?`, answer, difficulty: diff, fraction: true, negative: answer < 0, answerText: fracText(sn, sd),
    hint: same ? 'Same bottoms: work only with the tops.' : `Make the bottoms match first: what do ${b} and ${d} both go into?`,
    steps, visual: { type: 'fracbar', fracs: [{ n: a, d: b }, { n: c, d }], into: L, op },
  });
}

export function fracMulQuestion(a: number, b: number, c: number, d: number, op: '×' | '÷', diff: Difficulty, skill = 'precalc.frac.mul'): Question {
  const [n2, d2] = op === '×' ? [c, d] : [d, c];
  const [sn, sd] = simplify(a * n2, b * d2);
  const answer = sn / sd;
  const g1 = gcd(a, d2); const g2 = gcd(n2, b);
  const cancel = g1 > 1 || g2 > 1;
  const steps = op === '÷'
    ? [`Dividing by a fraction is multiplying by its flip: keep ${a}/${b}, change ÷ to ×, flip ${c}/${d} to ${d}/${c}.`, `${a}/${b} × ${d}/${c}: ${cancel ? `cancel first (${g1 > 1 ? `${a} and ${d2} share ${lab(g1, 'common factor')}` : ''}${g1 > 1 && g2 > 1 ? '; ' : ''}${g2 > 1 ? `${n2} and ${b} share ${lab(g2, 'common factor')}` : ''}), then ` : ''}multiply straight across: ${a * n2}/${b * d2} = ${fracText(sn, sd)}.`, `Why flipping works: "how many ${c}/${d}s fit in ${a}/${b}?" is the same as scaling ${a}/${b} by ${d}/${c}.`]
    : [`Multiply straight across: tops together, bottoms together. ${cancel ? `Cancel first to keep the numbers small: ${g1 > 1 ? `${a} and ${d} share ${lab(g1, 'common factor')}` : ''}${g1 > 1 && g2 > 1 ? '; ' : ''}${g2 > 1 ? `${c} and ${b} share ${lab(g2, 'common factor')}` : ''}.` : 'Nothing cancels here.'}`, `${a} × ${c} = ${lab(a * c, 'new top')}, ${b} × ${d} = ${lab(b * d, 'new bottom')}: ${fracText(sn, sd)}.`, `Multiplying by a fraction less than 1 makes things smaller: ${a}/${b} × ${c}/${d} is ${c}/${d} of ${a}/${b}.`];
  return mk(skill, labelOf('frac.mul'), {
    prompt: `Work out ${a}/${b} ${op} ${c}/${d}. Give the answer as a fraction in lowest terms.`,
    expression: `${a}/${b} ${op} ${c}/${d} = ?`, answer, difficulty: diff, fraction: true, answerText: fracText(sn, sd),
    hint: op === '÷' ? 'Keep, change, flip — then multiply across.' : 'Tops together, bottoms together. Cancel anything you can first.',
    steps, visual: { type: 'card', title: op === '÷' ? 'Keep · change · flip' : 'Straight across', lines: op === '÷' ? [`${a}/${b} ÷ ${c}/${d}`, `= ${a}/${b} × ${d}/${c}`, `= (${a} × ${d}) / (${b} × ${c})`] : [`${a}/${b} × ${c}/${d}`, `= (${a} × ${c}) / (${b} × ${d})`] },
  });
}

/* ---------------- negative numbers ---------------- */
export function negQuestion(a: number, b: number, op: '+' | '−' | '×' | '÷', diff: Difficulty, skill = 'precalc.neg'): Question {
  const answer = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b;
  const expr = `${signed(a)} ${op} ${neg(b)} = ?`;
  let steps: string[]; let visual: Question['visual'];
  if (op === '+' || op === '−') {
    const move = op === '+' ? b : -b;
    steps = [
      op === '−' && b < 0 ? `Subtracting a negative is the same as adding: ${signed(a)} − (−${-b}) = ${signed(a)} + ${-b}. Taking away a debt makes you richer.` : op === '+' && b < 0 ? `Adding a negative is the same as subtracting: ${signed(a)} + (−${-b}) = ${signed(a)} − ${-b}.` : `Start at ${signed(a)} on the number line.`,
      `Start at ${signed(a)} and move ${Math.abs(move)} to the ${move >= 0 ? 'right' : 'left'}: you land on ${signed(answer)}.`,
      `Check the sign: ${answer >= 0 ? 'you ended up at or above zero' : 'you ended up below zero'}, so the answer is ${answer >= 0 ? 'positive' : 'negative'}.`,
    ];
    visual = { type: 'jumps', from: a, jumps: [move] };
  } else {
    const sameSign = (a < 0) === (b < 0);
    steps = [
      `Do the sizes first: ${Math.abs(a)} ${op} ${Math.abs(b)} = ${lab(Math.abs(answer), 'size of the answer')}.`,
      `Then the sign: ${sameSign ? 'the two signs match, so the answer is positive' : 'the signs are different, so the answer is negative'}. Same signs → positive, different signs → negative.`,
      `${signed(a)} ${op} ${neg(b)} = ${signed(answer)}. Two negatives ${op === '×' ? 'multiplied' : 'divided'} give a positive; a negative times a positive stays negative.`,
    ];
    visual = { type: 'card', title: 'Sign rules', lines: ['(+)(+) = +   (−)(−) = +', '(+)(−) = −   (−)(+) = −', `${signed(a)} ${op} ${neg(b)} → ${sameSign ? 'same signs' : 'different signs'}`] };
  }
  return mk(skill, labelOf('neg'), {
    prompt: op === '−' && b < 0 ? `What is ${signed(a)} minus negative ${-b}?` : `Work out ${signed(a)} ${op} ${neg(b)}.`,
    expression: expr, answer, difficulty: diff, negative: true, answerText: signed(answer),
    hint: op === '−' && b < 0 ? 'Minus a negative is a plus.' : op === '+' || op === '−' ? 'Use the number line: right for adding, left for subtracting.' : 'Sizes first, then the sign: same signs positive, different signs negative.',
    steps, visual,
  });
}

/* ---------------- exponents ---------------- */
export function expQuestion(kind: 'mul' | 'div' | 'pow' | 'num' | 'zero' | 'negexp', p: number, q: number, diff: Difficulty, skill = 'precalc.exp'): Question {
  if (kind === 'mul') return mk(skill, labelOf('exp'), {
    prompt: `Simplify x${sup(p)} · x${sup(q)}. What is the exponent on x?`, expression: `x${sup(p)} · x${sup(q)} = x^?`, answer: p + q, difficulty: diff,
    hint: 'Same base multiplied: add the exponents.',
    steps: [`x${sup(p)} is ${p} x's multiplied together, x${sup(q)} is ${q} more. All together that is ${lab(p, 'first exponent')} + ${lab(q, 'second exponent')} = ${lab(p + q, 'new exponent')}: x${sup(p + q)}.`, `Rule: xᵃ · xᵇ = xᵃ⁺ᵇ. The base stays; only the exponents add.`, `Watch out: x${sup(p)} · x${sup(q)} is not x${sup(p * q)}. Multiplying exponents is for a power of a power.`],
    visual: { type: 'card', title: 'Same base, multiplied', lines: [`x${sup(p)} · x${sup(q)}`, `= (${Array(p).fill('x').join('·')}) · (${Array(q).fill('x').join('·')})`, `= x${sup(p + q)}`] },
  });
  if (kind === 'div') return mk(skill, labelOf('exp'), {
    prompt: `Simplify x${sup(p)} ÷ x${sup(q)}. What is the exponent on x?`, expression: `x${sup(p)} ÷ x${sup(q)} = x^?`, answer: p - q, difficulty: diff, negative: p < q,
    hint: 'Same base divided: subtract the exponents.',
    steps: [`${q} of the ${p} x's on top cancel with the ${q} on the bottom, leaving ${lab(p, 'top exponent')} − ${lab(q, 'bottom exponent')} = ${lab(signed(p - q), 'new exponent')}: x${sup(p - q)}.`, `Rule: xᵃ ÷ xᵇ = xᵃ⁻ᵇ.`, ...(p < q ? [`A negative exponent means the x's left over are on the bottom: x${sup(p - q)} = 1/x${sup(q - p)}.`] : [])],
    visual: { type: 'card', title: 'Same base, divided', lines: [`x${sup(p)} / x${sup(q)}`, `cancel ${q} pairs`, `= x${sup(p - q)}`] },
  });
  if (kind === 'pow') return mk(skill, labelOf('exp'), {
    prompt: `Simplify (x${sup(p)})${sup(q)}. What is the exponent on x?`, expression: `(x${sup(p)})${sup(q)} = x^?`, answer: p * q, difficulty: diff,
    hint: 'A power of a power: multiply the exponents.',
    steps: [`(x${sup(p)})${sup(q)} means x${sup(p)} written ${q} times and multiplied: ${Array(q).fill(`x${sup(p)}`).join(' · ')}.`, `Adding ${p} to itself ${q} times is ${lab(p, 'inner exponent')} × ${lab(q, 'outer exponent')} = ${lab(p * q, 'new exponent')}: x${sup(p * q)}.`, `Rule: (xᵃ)ᵇ = xᵃᵇ.`],
    visual: { type: 'card', title: 'Power of a power', lines: [`(x${sup(p)})${sup(q)}`, `= ${Array(q).fill(`x${sup(p)}`).join(' · ')}`, `= x${sup(p * q)}`] },
  });
  if (kind === 'zero') return mk(skill, labelOf('exp'), {
    prompt: `What is ${p}${sup(0)}?`, expression: `${p}⁰ = ?`, answer: 1, difficulty: diff,
    hint: 'Anything (except 0) to the power 0 is 1.',
    steps: [`${p}${sup(q)} ÷ ${p}${sup(q)} = 1, because anything divided by itself is 1.`, `By the division rule it is also ${p}${sup(q)}⁻${sup(q)} = ${p}⁰. So ${p}⁰ = 1.`, `Every non-zero number to the power 0 is 1.`],
    visual: { type: 'card', title: 'Why x⁰ = 1', lines: [`${p}${sup(q)} ÷ ${p}${sup(q)} = 1`, `${p}${sup(q)} ÷ ${p}${sup(q)} = ${p}${sup(0)}`, `so ${p}⁰ = 1`] },
  });
  if (kind === 'negexp') {
    const value = p ** q; const [n, d] = [1, value];
    return mk(skill, labelOf('exp'), {
      prompt: `What is ${p}${sup(-q)}? Give it as a fraction.`, expression: `${p}${sup(-q)} = ?`, answer: n / d, difficulty: diff, fraction: true, answerText: `1/${d}`,
      hint: 'A negative exponent flips the number underneath: x⁻ⁿ = 1/xⁿ.',
      steps: [`${p}${sup(-q)} = 1 / ${p}${sup(q)}. The minus sign in the exponent means "one over".`, `${p}${sup(q)} = ${value}, so ${p}${sup(-q)} = 1/${value}.`, `A negative exponent never makes a number negative — it makes it small.`],
      visual: { type: 'card', title: 'Negative exponent', lines: [`${p}${sup(-q)} = 1 / ${p}${sup(q)}`, `= 1 / ${value}`] },
    });
  }
  const value = p ** q;
  return mk(skill, labelOf('exp'), {
    prompt: `What is ${p}${sup(q)}?`, expression: `${p}${sup(q)} = ?`, answer: value, difficulty: diff,
    hint: `${p} multiplied by itself ${q} times.`,
    steps: [`${p}${sup(q)} uses ${lab(p, 'base')} as a factor ${lab(q, 'exponent')} times: ${Array(q).fill(p).join(' × ')}.`, `Build it up: ${Array.from({ length: q }, (_, i) => p ** (i + 1)).join(' → ')}.`, `So ${p}${sup(q)} = ${value}. (Not ${p} × ${q} = ${p * q}: the exponent counts factors, not addends.)`],
    visual: { type: 'card', title: 'A power is repeated multiplication', lines: [`${p}${sup(q)} = ${Array(q).fill(p).join(' × ')}`, `= ${value}`] },
  });
}

/* ---------------- roots ---------------- */
export function rootQuestion(kind: 'sqrt' | 'cbrt' | 'powroot' | 'simplify' | 'estimate', a: number, b: number, diff: Difficulty, skill = 'precalc.roots'): Question {
  if (kind === 'sqrt') return mk(skill, labelOf('roots'), {
    prompt: `What is √${a * a}?`, expression: `√${a * a} = ?`, answer: a, difficulty: diff,
    hint: 'Which number times itself gives this?',
    steps: [`A square root asks: what number, squared, gives ${a * a}?`, `${a} × ${a} = ${a * a}, so √${a * a} = ${a}.`, `Squaring and square-rooting undo each other: √(x²) = x for positive x.`],
    visual: { type: 'array', rows: Math.min(a, 12), cols: Math.min(a, 12) },
  });
  if (kind === 'cbrt') return mk(skill, labelOf('roots'), {
    prompt: `What is ∛${a ** 3}?`, expression: `∛${a ** 3} = ?`, answer: a, difficulty: diff,
    hint: 'Which number, cubed, gives this?',
    steps: [`A cube root asks: what number, used three times, gives ${a ** 3}?`, `${a} × ${a} × ${a} = ${a ** 3}, so ∛${a ** 3} = ${a}.`, `Cubes to know: 1, 8, 27, 64, 125, 216, 343, 512, 729, 1000.`],
    visual: { type: 'cubes', l: Math.min(a, 6), w: Math.min(a, 6), h: Math.min(a, 6) },
  });
  if (kind === 'powroot') return mk(skill, labelOf('roots'), {
    prompt: `Simplify √(x${sup(a)}). What is the exponent on x?`, expression: `√(x${sup(a)}) = x^?`, answer: a / 2, difficulty: diff,
    hint: 'A square root halves the exponent.',
    steps: [`√(x${sup(a)}) is the number that squares to x${sup(a)}. (x${sup(a / 2)})² = x${sup(a)}, so it is x${sup(a / 2)}.`, `A square root is the power ½: √(xᵃ) = xᵃ/² — halve the exponent.`, `A cube root is the power ⅓: divide the exponent by 3.`],
    visual: { type: 'card', title: 'Roots halve exponents', lines: [`√(x${sup(a)}) = (x${sup(a)})^½`, `= x${sup(a)}·½ = x${sup(a / 2)}`] },
  });
  if (kind === 'simplify') {
    // a is the perfect-square factor, b the leftover: √(a² · b) = a√b. Ask for the number in front.
    return mk(skill, labelOf('roots'), {
      prompt: `Simplify √${a * a * b}. It becomes a whole number times √${b}. What is that whole number?`, expression: `√${a * a * b} = ? √${b}`, answer: a, difficulty: diff,
      hint: `Find the biggest perfect square that divides ${a * a * b}.`,
      steps: [`Split ${a * a * b} into a perfect square times what is left: ${a * a * b} = ${lab(a * a, 'perfect square')} × ${lab(b, 'what is left')}.`, `√(${a * a} × ${b}) = √${a * a} × √${b} = ${a}√${b}.`, `√${b} cannot simplify further (no perfect square divides ${b}), so ${a}√${b} is the simplest form.`],
      visual: { type: 'card', title: 'Pull out the perfect square', lines: [`√${a * a * b} = √(${a * a} × ${b})`, `= √${a * a} × √${b}`, `= ${a}√${b}`] },
    });
  }
  const { answer, tolerance } = approx(Math.sqrt(a), 1);
  return mk(skill, labelOf('roots'), {
    prompt: `Estimate √${a} to one decimal place.`, expression: `√${a} ≈ ?`, answer, tolerance, difficulty: diff, decimal: true,
    hint: `Which two perfect squares is ${a} between?`,
    steps: [`${b}² = ${b * b} and ${b + 1}² = ${(b + 1) ** 2}, and ${a} is between them, so √${a} is between ${b} and ${b + 1}.`, `${a} is ${lab(a - b * b, 'distance above the lower square')} out of ${lab((b + 1) ** 2 - b * b, 'gap between the squares')}, so about ${b}.${Math.round((10 * (a - b * b)) / ((b + 1) ** 2 - b * b))}.`, `Check: ${answer}² ≈ ${num(answer * answer, 1)}. Close to ${a}, so √${a} ≈ ${answer}.`],
    visual: { type: 'numberline', step: 1, count: 12, max: 12 },
  });
}

/* ---------------- rearranging and using formulas ---------------- */
export interface Formula { name: string; eq: string; vars: string[]; solved: Record<string, string>; decoys: Record<string, string[]>; how: Record<string, string>; unit?: Record<string, string>; calc?: Record<string, (v: Record<string, number>) => number>; sample?: () => Record<string, number> }
export const FORMULAS: Formula[] = [
  { name: 'ideal gas law', eq: 'PV = nRT', vars: ['T', 'n', 'P', 'V'],
    solved: { T: 'T = PV / (nR)', n: 'n = PV / (RT)', P: 'P = nRT / V', V: 'V = nRT / P' },
    decoys: { T: ['T = nR / (PV)', 'T = PV − nR', 'T = PVnR'], n: ['n = RT / (PV)', 'n = PV − RT', 'n = PVRT'], P: ['P = V / (nRT)', 'P = nRT − V', 'P = nRTV'], V: ['V = P / (nRT)', 'V = nRT − P', 'V = nRTP'] },
    how: { T: 'T is multiplied by n and R. Divide both sides by nR.', n: 'n is multiplied by R and T. Divide both sides by RT.', P: 'P is multiplied by V. Divide both sides by V.', V: 'V is multiplied by P. Divide both sides by P.' },
    unit: { T: 'K', n: 'mol', P: 'kPa', V: 'L' }, calc: { T: (v) => (v.P * v.V) / (v.n * v.R), n: (v) => (v.P * v.V) / (v.R * v.T), P: (v) => (v.n * v.R * v.T) / v.V, V: (v) => (v.n * v.R * v.T) / v.P }, sample: () => ({ P: 100, V: 24.9, n: 1, R: 8.3, T: 300 }) },
  { name: "Ohm's law", eq: 'V = IR', vars: ['I', 'R'], solved: { I: 'I = V / R', R: 'R = V / I' }, decoys: { I: ['I = R / V', 'I = V − R', 'I = VR'], R: ['R = I / V', 'R = V − I', 'R = VI'] }, how: { I: 'I is multiplied by R. Divide both sides by R.', R: 'R is multiplied by I. Divide both sides by I.' }, unit: { I: 'A', R: 'Ω' }, calc: { I: (v) => v.V / v.R, R: (v) => v.V / v.I }, sample: () => ({ V: 12, I: 2, R: 6 }) },
  { name: "Newton's second law", eq: 'F = ma', vars: ['a', 'm'], solved: { a: 'a = F / m', m: 'm = F / a' }, decoys: { a: ['a = m / F', 'a = F − m', 'a = Fm'], m: ['m = a / F', 'm = F − a', 'm = Fa'] }, how: { a: 'a is multiplied by m. Divide both sides by m.', m: 'm is multiplied by a. Divide both sides by a.' }, unit: { a: 'm/s²', m: 'kg' }, calc: { a: (v) => v.F / v.m, m: (v) => v.F / v.a }, sample: () => ({ F: 60, m: 12, a: 5 }) },
  { name: 'distance = speed × time', eq: 'd = vt', vars: ['t', 'v'], solved: { t: 't = d / v', v: 'v = d / t' }, decoys: { t: ['t = v / d', 't = d − v', 't = dv'], v: ['v = t / d', 'v = d − t', 'v = dt'] }, how: { t: 't is multiplied by v. Divide both sides by v.', v: 'v is multiplied by t. Divide both sides by t.' }, unit: { t: 'h', v: 'km/h' }, calc: { t: (v) => v.d / v.v, v: (v) => v.d / v.t }, sample: () => ({ d: 180, v: 60, t: 3 }) },
  { name: 'density', eq: 'ρ = m / V', vars: ['m', 'V'], solved: { m: 'm = ρV', V: 'V = m / ρ' }, decoys: { m: ['m = ρ / V', 'm = V / ρ', 'm = ρ − V'], V: ['V = ρm', 'V = ρ / m', 'V = m − ρ'] }, how: { m: 'm is divided by V. Multiply both sides by V.', V: 'V is on the bottom. Multiply both sides by V, then divide both sides by ρ.' }, unit: { m: 'g', V: 'cm³' }, calc: { m: (v) => v.ρ * v.V, V: (v) => v.m / v.ρ }, sample: () => ({ ρ: 2.7, V: 20, m: 54 }) },
  { name: 'power', eq: 'P = W / t', vars: ['W', 't'], solved: { W: 'W = Pt', t: 't = W / P' }, decoys: { W: ['W = P / t', 'W = t / P', 'W = P + t'], t: ['t = PW', 't = P / W', 't = W − P'] }, how: { W: 'W is divided by t. Multiply both sides by t.', t: 't is on the bottom. Multiply both sides by t, then divide both sides by P.' }, unit: { W: 'J', t: 's' }, calc: { W: (v) => v.P * v.t, t: (v) => v.W / v.P }, sample: () => ({ P: 50, t: 12, W: 600 }) },
  { name: 'area of a triangle', eq: 'A = ½bh', vars: ['h', 'b'], solved: { h: 'h = 2A / b', b: 'b = 2A / h' }, decoys: { h: ['h = A / (2b)', 'h = 2Ab', 'h = A − ½b'], b: ['b = A / (2h)', 'b = 2Ah', 'b = A − ½h'] }, how: { h: 'h is multiplied by ½ and b. Multiply both sides by 2, then divide by b.', b: 'b is multiplied by ½ and h. Multiply both sides by 2, then divide by h.' }, unit: { h: 'cm', b: 'cm' }, calc: { h: (v) => (2 * v.A) / v.b, b: (v) => (2 * v.A) / v.h }, sample: () => ({ A: 24, b: 8, h: 6 }) },
  { name: 'motion', eq: 'v = u + at', vars: ['a', 't', 'u'], solved: { a: 'a = (v − u) / t', t: 't = (v − u) / a', u: 'u = v − at' }, decoys: { a: ['a = (v + u) / t', 'a = v / t − u', 'a = (u − v) / t'], t: ['t = (v + u) / a', 't = v / a − u', 't = (u − v) / a'], u: ['u = v + at', 'u = at − v', 'u = (v − a) / t'] }, how: { a: 'First subtract u from both sides: v − u = at. Then divide both sides by t.', t: 'First subtract u from both sides: v − u = at. Then divide both sides by a.', u: 'at is added to u. Subtract at from both sides.' }, unit: { a: 'm/s²', t: 's', u: 'm/s' }, calc: { a: (v) => (v.v - v.u) / v.t, t: (v) => (v.v - v.u) / v.a, u: (v) => v.v - v.a * v.t }, sample: () => ({ v: 30, u: 6, a: 4, t: 6 }) },
  { name: 'kinetic energy', eq: 'E = ½mv²', vars: ['m'], solved: { m: 'm = 2E / v²' }, decoys: { m: ['m = E / (2v²)', 'm = 2Ev²', 'm = √(2E / v)'] }, how: { m: 'm is multiplied by ½ and v². Multiply both sides by 2, then divide by v².' }, unit: { m: 'kg' }, calc: { m: (v) => (2 * v.E) / (v.v * v.v) }, sample: () => ({ E: 400, v: 10, m: 8 }) },
  { name: 'a straight line', eq: 'y = mx + b', vars: ['x', 'm'], solved: { x: 'x = (y − b) / m', m: 'm = (y − b) / x' }, decoys: { x: ['x = (y + b) / m', 'x = y / m − b', 'x = (b − y) / m'], m: ['m = (y + b) / x', 'm = y / x − b', 'm = (b − y) / x'] }, how: { x: 'First subtract b from both sides: y − b = mx. Then divide both sides by m.', m: 'First subtract b from both sides: y − b = mx. Then divide both sides by x.' }, unit: { x: '', m: '' }, calc: { x: (v) => (v.y - v.b) / v.m, m: (v) => (v.y - v.b) / v.x }, sample: () => ({ y: 11, b: 3, m: 2, x: 4 }) },
];

export function rearrangeQuestion(f: Formula, target: string, rng: Rng, diff: Difficulty, skill = 'precalc.rearrange'): Question {
  const right = f.solved[target];
  const options = rng.shuffle([right, ...f.decoys[target]]);
  const idx = options.indexOf(right);
  return mk(skill, labelOf('rearrange'), {
    prompt: `${f.name[0].toUpperCase()}${f.name.slice(1)}: ${f.eq}. Which line correctly makes ${target} the subject? Answer with the option number.\n${options.map((o, i) => `${i + 1}) ${o}`).join('   ')}`,
    expression: `${f.eq} ⇒ ${target} = ?`, answer: idx + 1, difficulty: diff,
    hint: `What is being done to ${target}? Undo it, on both sides.`,
    steps: [`Ask what is done to ${target} in ${f.eq}. ${f.how[target]}`, `Whatever you do to one side you do to the other, so the equation stays true.`, `That gives ${right}. Option ${idx + 1}.`, `Check with easy numbers: pick values that make ${f.eq} true and see that ${right} gives back ${target}.`],
    visual: { type: 'options', items: options, note: `${f.eq} · make ${target} the subject` },
  });
}

export function evaluateQuestion(f: Formula, target: string, values: Record<string, number>, diff: Difficulty, skill = 'precalc.evaluate'): Question {
  const raw = f.calc![target](values);
  const { answer, tolerance } = approx(raw, Number.isInteger(raw) ? 0 : 2);
  const unit = f.unit?.[target] ?? '';
  const known = Object.entries(values).filter(([k]) => k !== target).map(([k, v]) => `${k} = ${num(v, 3)}`).join(', ');
  return mk(skill, labelOf('evaluate'), {
    prompt: `${f.eq} (${f.name}). Given ${known}, find ${target}${unit ? ` in ${unit}` : ''}.`,
    expression: `${f.solved[target]} = ?`, answer, tolerance, unit, difficulty: diff, decimal: !Number.isInteger(answer),
    hint: `Rearrange first: ${f.solved[target]}. Then put the numbers in.`,
    steps: [`Rearrange: ${f.solved[target]}.`, `Substitute: ${f.solved[target].split(' = ')[1].replace(/[A-Za-zρ]/g, (ch) => (ch in values && ch !== target ? `(${num(values[ch], 3)})` : ch))}.`, `Calculate: ${target} = ${num(raw, 3)}${unit ? ` ${unit}` : ''}.`, `Carry the unit through: ${unit ? `the answer is in ${unit}, not just a number` : 'this one has no unit'}.`],
    visual: { type: 'card', title: f.eq, lines: [f.solved[target], known] },
  });
}

/* ---------------- scientific notation ---------------- */
export function sciQuestion(kind: 'toexp' | 'expand' | 'mul' | 'div', mant: number, exp: number, mant2 = 1, exp2 = 0, diff: Difficulty = 3, skill = 'precalc.scinot'): Question {
  const plain = (m: number, e: number) => num(m * 10 ** e, Math.max(0, 6 - e));
  if (kind === 'toexp') {
    const value = plain(mant, exp);
    return mk(skill, labelOf('scinot'), {
      prompt: `Write ${Number(value).toLocaleString('en-US', { maximumFractionDigits: 8 })} in scientific notation: ${num(mant, 3)} × 10 to what power?`, expression: `${Number(value).toLocaleString('en-US', { maximumFractionDigits: 8 })} = ${num(mant, 3)} × 10^?`, answer: exp, difficulty: diff, negative: exp < 0, answerText: signed(exp),
      hint: 'Move the point until one non-zero digit is in front; count the moves.',
      steps: [`Scientific notation keeps one non-zero digit before the point: ${num(mant, 3)}.`, `To get from ${num(mant, 3)} back to ${value} the point moves ${Math.abs(exp)} place${Math.abs(exp) === 1 ? '' : 's'} to the ${exp >= 0 ? 'right' : 'left'}, so the power is ${signed(exp)}.`, `${exp >= 0 ? 'A big number gets a positive power' : 'A small number (less than 1) gets a negative power'}: ${num(mant, 3)} × 10${sup(exp)}.`],
      visual: { type: 'pvchart', value, shift: -exp },
    });
  }
  if (kind === 'expand') {
    const value = mant * 10 ** exp;
    return mk(skill, labelOf('scinot'), {
      prompt: `Write ${num(mant, 3)} × 10${sup(exp)} as an ordinary number.`, expression: `${num(mant, 3)} × 10${sup(exp)} = ?`, answer: Number(plain(mant, exp)), difficulty: diff, decimal: exp < 0 || !Number.isInteger(value),
      hint: `10${sup(exp)} moves the point ${Math.abs(exp)} places ${exp >= 0 ? 'right' : 'left'}.`,
      steps: [`10${sup(exp)} is ${exp >= 0 ? `1 followed by ${exp} zeros` : `1 over 1 followed by ${-exp} zeros`}.`, `Multiplying by it slides every digit ${Math.abs(exp)} place${Math.abs(exp) === 1 ? '' : 's'} to the ${exp >= 0 ? 'left, so the number gets bigger' : 'right, so the number gets smaller'}; fill the gaps with zeros.`, `${num(mant, 3)} × 10${sup(exp)} = ${plain(mant, exp)}.`],
      visual: { type: 'pvchart', value: num(mant, 3), shift: exp },
    });
  }
  const m = kind === 'mul' ? mant * mant2 : mant / mant2; const e = kind === 'mul' ? exp + exp2 : exp - exp2;
  const norm = m >= 10 ? [m / 10, e + 1] : m < 1 ? [m * 10, e - 1] : [m, e];
  return mk(skill, labelOf('scinot'), {
    prompt: `Work out (${num(mant, 3)} × 10${sup(exp)}) ${kind === 'mul' ? '×' : '÷'} (${num(mant2, 3)} × 10${sup(exp2)}). The answer is ${num(norm[0], 3)} × 10 to what power?`,
    expression: `(${num(mant, 3)} × 10${sup(exp)}) ${kind === 'mul' ? '×' : '÷'} (${num(mant2, 3)} × 10${sup(exp2)}) = ${num(norm[0], 3)} × 10^?`, answer: norm[1], difficulty: diff, negative: norm[1] < 0, answerText: signed(norm[1]),
    hint: kind === 'mul' ? 'Multiply the front numbers; add the powers.' : 'Divide the front numbers; subtract the powers.',
    steps: [`Front numbers: ${lab(num(mant, 3), 'first front number')} ${kind === 'mul' ? '×' : '÷'} ${lab(num(mant2, 3), 'second front number')} = ${lab(num(m, 3), 'new front number')}.`, `Powers of ten: 10${sup(exp)} ${kind === 'mul' ? '×' : '÷'} 10${sup(exp2)} = 10${sup(e)} (${kind === 'mul' ? 'add' : 'subtract'} the exponents).`, ...(norm[1] !== e ? [`${num(m, 3)} is ${m >= 10 ? 'not under 10' : 'under 1'}, so re-normalise: ${num(m, 3)} × 10${sup(e)} = ${num(norm[0], 3)} × 10${sup(norm[1])}.`] : [`${num(m, 3)} already has one digit in front, so the answer is ${num(m, 3)} × 10${sup(e)}.`])],
    visual: { type: 'card', title: kind === 'mul' ? 'Multiply fronts, add powers' : 'Divide fronts, subtract powers', lines: [`(${num(mant, 3)} × 10${sup(exp)}) ${kind === 'mul' ? '×' : '÷'} (${num(mant2, 3)} × 10${sup(exp2)})`, `= ${num(m, 3)} × 10${sup(e)}`, ...(norm[1] !== e ? [`= ${num(norm[0], 3)} × 10${sup(norm[1])}`] : [])] },
  });
}

/* ---------------- unit conversions ---------------- */
export interface UnitConv { from: string; to: string; factor: number; why: string; dims?: 2 | 3; tier: 1 | 2 | 3 }
export const UNIT_CONVS: UnitConv[] = [
  { from: 'km', to: 'm', factor: 1000, why: 'kilo means a thousand', tier: 1 },
  { from: 'm', to: 'cm', factor: 100, why: 'centi means a hundredth: 100 cm in a metre', tier: 1 },
  { from: 'cm', to: 'mm', factor: 10, why: 'milli means a thousandth: 10 mm in a centimetre', tier: 1 },
  { from: 'kg', to: 'g', factor: 1000, why: 'kilo means a thousand', tier: 1 },
  { from: 'L', to: 'mL', factor: 1000, why: 'milli means a thousandth', tier: 1 },
  { from: 'h', to: 'min', factor: 60, why: '60 minutes in an hour', tier: 1 },
  { from: 'min', to: 's', factor: 60, why: '60 seconds in a minute', tier: 1 },
  { from: 'mm', to: 'm', factor: 1 / 1000, why: '1000 mm in a metre', tier: 2 },
  { from: 'g', to: 'kg', factor: 1 / 1000, why: '1000 g in a kilogram', tier: 2 },
  { from: 'mL', to: 'L', factor: 1 / 1000, why: '1000 mL in a litre', tier: 2 },
  { from: 'kPa', to: 'Pa', factor: 1000, why: 'kilo means a thousand', tier: 2 },
  { from: 'MPa', to: 'kPa', factor: 1000, why: 'mega is a thousand kilos', tier: 2 },
  { from: 'kW', to: 'W', factor: 1000, why: 'kilo means a thousand', tier: 2 },
  { from: 'h', to: 's', factor: 3600, why: '60 min × 60 s', tier: 2 },
  { from: 'mg', to: 'g', factor: 1 / 1000, why: '1000 mg in a gram', tier: 2 },
  { from: 'km/h', to: 'm/s', factor: 1 / 3.6, why: '1000 m in a km, 3600 s in an hour: ÷ 3.6', tier: 3 },
  { from: 'm/s', to: 'km/h', factor: 3.6, why: '× 3600 s/h, ÷ 1000 m/km: × 3.6', tier: 3 },
  { from: 'cm²', to: 'mm²', factor: 100, why: '10 mm each way, so 10 × 10 = 100 mm² in a cm²', dims: 2, tier: 3 },
  { from: 'm²', to: 'cm²', factor: 10_000, why: '100 cm each way, so 100 × 100', dims: 2, tier: 3 },
  { from: 'L', to: 'cm³', factor: 1000, why: '1 L = 1000 cm³ = 1000 mL', dims: 3, tier: 3 },
  { from: 'm³', to: 'L', factor: 1000, why: '1 m³ = 100 × 100 × 100 cm³ = 1,000,000 mL = 1000 L', dims: 3, tier: 3 },
];
export function unitQuestion(c: UnitConv, value: number, diff: Difficulty, skill = 'precalc.units'): Question {
  const raw = value * c.factor;
  const { answer, tolerance } = approx(raw, Number.isInteger(raw) ? 0 : 3);
  const factorText = c.factor >= 1 ? `× ${lab(num(c.factor, 3), `${c.to} per ${c.from}`)}` : `÷ ${lab(num(1 / c.factor, 3), `${c.from} per ${c.to}`)}`;
  return mk(skill, labelOf('units'), {
    prompt: `Convert ${num(value, 4)} ${c.from} to ${c.to}.`, expression: `${num(value, 4)} ${c.from} = ? ${c.to}`, answer, tolerance, unit: c.to, difficulty: diff, decimal: !Number.isInteger(answer),
    hint: `${c.why}. ${c.factor >= 1 ? 'Smaller unit, bigger number' : 'Bigger unit, smaller number'}.`,
    steps: [`Write the conversion as a fraction equal to 1 with the unit you want on top: ${c.factor >= 1 ? `(${num(c.factor, 3)} ${c.to} / 1 ${c.from})` : `(1 ${c.to} / ${num(1 / c.factor, 3)} ${c.from})`}. ${c.why}.`, `${num(value, 4)} ${c.from} × that fraction: the ${c.from} cancels, leaving ${c.to}.`, `${num(value, 4)} ${factorText} = ${num(raw, 4)} ${c.to}.`, ...(c.dims ? [`Area and volume units convert with the length factor ${c.dims === 2 ? 'squared' : 'cubed'}, never once.`] : []), `Sanity check: ${c.factor >= 1 ? `${c.to} is the smaller unit, so the number should be bigger` : `${c.to} is the bigger unit, so the number should be smaller`}, and it is.`],
    visual: { type: 'chain', start: `${num(value, 4)} ${c.from}`, factors: [c.factor >= 1 ? [`${num(c.factor, 3)} ${c.to}`, `1 ${c.from}`] : [`1 ${c.to}`, `${num(1 / c.factor, 3)} ${c.from}`]], result: `${num(raw, 4)} ${c.to}` },
  });
}

/* ---------------- functions ---------------- */
const lin = (a: number, b: number) => `${a === 1 ? '' : a === -1 ? '−' : signed(a)}x ${b < 0 ? '−' : '+'} ${Math.abs(b)}`;
export function funcQuestion(kind: 'linear' | 'quad' | 'compose' | 'solve', a: number, b: number, c: number, x: number, diff: Difficulty, skill = 'precalc.func'): Question {
  if (kind === 'linear') {
    const y = a * x + b;
    return mk(skill, labelOf('func'), {
      prompt: `f(x) = ${lin(a, b)}. What is f(${signed(x)})?`, expression: `f(${signed(x)}) = ?`, answer: y, difficulty: diff, negative: y < 0, answerText: signed(y),
      hint: 'Replace every x with the number, then work it out.',
      steps: [`f(x) is a machine: x goes in, ${lin(a, b)} comes out.`, `Put ${signed(x)} in for x: ${signed(a)} × ${neg(x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${signed(a * x)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${signed(y)}.`, `So f(${signed(x)}) = ${signed(y)}: the point (${signed(x)}, ${signed(y)}) is on the graph of f.`],
      visual: { type: 'card', title: `f(x) = ${lin(a, b)}`, lines: [`f(${signed(x)}) = ${signed(a)}(${signed(x)}) ${b < 0 ? '−' : '+'} ${Math.abs(b)}`, `= ${signed(y)}`] },
    });
  }
  if (kind === 'quad') {
    const y = a * x * x + b * x + c;
    const f = `${a === 1 ? '' : signed(a)}x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}`;
    return mk(skill, labelOf('func'), {
      prompt: `f(x) = ${f}. What is f(${signed(x)})?`, expression: `f(${signed(x)}) = ?`, answer: y, difficulty: diff, negative: y < 0, answerText: signed(y),
      hint: 'Square first (a negative squared is positive), then the rest.',
      steps: [`Substitute ${signed(x)} for every x: ${signed(a)}(${signed(x)})² ${b < 0 ? '−' : '+'} ${Math.abs(b)}(${signed(x)}) ${c < 0 ? '−' : '+'} ${Math.abs(c)}.`, `(${signed(x)})² = ${x * x}, so the first term is ${signed(a * x * x)}; the middle term is ${signed(b * x)}.`, `${signed(a * x * x)} ${b * x < 0 ? '−' : '+'} ${Math.abs(b * x)} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${signed(y)}.`],
      visual: { type: 'card', title: `f(x) = ${f}`, lines: [`f(${signed(x)}) = ${signed(a)}(${x * x}) ${b * x < 0 ? '−' : '+'} ${Math.abs(b * x)} ${c < 0 ? '−' : '+'} ${Math.abs(c)}`, `= ${signed(y)}`] },
    });
  }
  if (kind === 'compose') {
    const inner = c * x + 1; const y = a * inner + b; // g(x) = cx + 1
    return mk(skill, labelOf('func'), {
      prompt: `f(x) = ${lin(a, b)} and g(x) = ${lin(c, 1)}. What is f(g(${signed(x)}))?`, expression: `f(g(${signed(x)})) = ?`, answer: y, difficulty: diff, negative: y < 0, answerText: signed(y),
      hint: 'Inside first: work out g, then feed that into f.',
      steps: [`Start inside: g(${signed(x)}) = ${signed(c)}(${signed(x)}) + 1 = ${signed(inner)}.`, `Now feed that into f: f(${signed(inner)}) = ${signed(a)}(${signed(inner)}) ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${signed(y)}.`, `Two machines in a row: the output of g becomes the input of f.`],
      visual: { type: 'card', title: 'f(g(x)): inside first', lines: [`g(${signed(x)}) = ${signed(inner)}`, `f(${signed(inner)}) = ${signed(y)}`] },
    });
  }
  const k = a * x + b; // solve f(x) = k
  return mk(skill, labelOf('func'), {
    prompt: `f(x) = ${lin(a, b)}. For which x is f(x) = ${signed(k)}?`, expression: `${lin(a, b)} = ${signed(k)}, x = ?`, answer: x, difficulty: diff, negative: x < 0, answerText: signed(x),
    hint: 'Run the machine backwards: undo the + first, then the ×.',
    steps: [`Set the output equal to ${signed(k)}: ${lin(a, b)} = ${signed(k)}.`, `Undo the ${b < 0 ? '−' : '+'} ${Math.abs(b)}: ${signed(a)}x = ${signed(k - b)}.`, `Undo the × ${signed(a)}: x = ${signed(k - b)} ÷ ${neg(a)} = ${signed(x)}.`, `Check: f(${signed(x)}) = ${signed(a)}(${signed(x)}) ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${signed(k)}. ✓`],
    visual: { type: 'card', title: 'Run it backwards', lines: [`${lin(a, b)} = ${signed(k)}`, `${signed(a)}x = ${signed(k - b)}`, `x = ${signed(x)}`] },
  });
}

/* ---------------- lines and graphs ---------------- */
export function graphQuestion(kind: 'slope' | 'intercept' | 'value' | 'xint', m: number, b: number, x1: number, x2: number, xq: number, diff: Difficulty, skill = 'precalc.graph'): Question {
  const y1 = m * x1 + b; const y2 = m * x2 + b;
  const pts: [number, number][] = [[x1, y1], [x2, y2]];
  const rise = y2 - y1; const run = x2 - x1;
  const [sn, sd] = simplify(rise, run);
  const eq = `y = ${lin(m, b)}`;
  if (kind === 'slope') return mk(skill, labelOf('graph'), {
    prompt: `A line passes through (${signed(x1)}, ${signed(y1)}) and (${signed(x2)}, ${signed(y2)}). What is its slope?`, expression: `slope = rise / run = ?`, answer: m, difficulty: diff, fraction: !Number.isInteger(m), negative: m < 0, answerText: fracText(sn, sd),
    hint: 'Rise over run: the change in y divided by the change in x.',
    steps: [`Rise: from y = ${signed(y1)} to y = ${signed(y2)} is ${signed(rise)}.`, `Run: from x = ${signed(x1)} to x = ${signed(x2)} is ${signed(run)}.`, `Slope = rise ÷ run = ${lab(signed(rise), 'rise')} ÷ ${lab(signed(run), 'run')} = ${lab(fracText(sn, sd), 'slope')}.`, `${m > 0 ? 'Positive slope: the line climbs to the right' : m < 0 ? 'Negative slope: the line falls to the right' : 'Zero slope: flat'}. Every 1 step right, the line goes ${fracText(sn, sd)} up.`],
    visual: { type: 'grid', points: pts, line: { m, b } },
  });
  if (kind === 'intercept') return mk(skill, labelOf('graph'), {
    prompt: `A line with slope ${fracText(sn, sd)} passes through (${signed(x1)}, ${signed(y1)}). Where does it cross the y-axis (the y-intercept)?`, expression: `y = ${fracText(sn, sd)}x + b, b = ?`, answer: b, difficulty: diff, negative: b < 0, answerText: signed(b),
    hint: 'Put the point into y = mx + b and solve for b.',
    steps: [`The line is y = mx + b with m = ${fracText(sn, sd)}.`, `The point must fit: ${signed(y1)} = ${fracText(sn, sd)} × ${neg(x1)} + b, so ${signed(y1)} = ${signed(m * x1)} + b.`, `b = ${signed(y1)} − ${neg(m * x1)} = ${lab(signed(b), 'y-intercept')}. The line crosses the y-axis at (0, ${signed(b)}).`, `Equation: ${eq}.`],
    visual: { type: 'grid', points: [[x1, y1], [0, b]], line: { m, b } },
  });
  if (kind === 'value') {
    const yq = m * xq + b;
    return mk(skill, labelOf('graph'), {
      prompt: `The line ${eq}. What is y when x = ${signed(xq)}?`, expression: `${eq}, x = ${signed(xq)} → y = ?`, answer: yq, difficulty: diff, negative: yq < 0, answerText: signed(yq),
      hint: 'Substitute x, or walk along the line from the intercept.',
      steps: [`Start at the intercept (0, ${signed(b)}).`, `Each step right adds ${fracText(sn, sd)} to y. ${signed(xq)} steps: ${lab(signed(xq), 'steps right')} × ${lab(fracText(sn, sd), 'slope')} = ${lab(signed(m * xq), 'change in y')}.`, `y = ${lab(signed(b), 'intercept')} + ${neg(m * xq)} = ${signed(yq)}. The point (${signed(xq)}, ${signed(yq)}) is on the line.`],
      visual: { type: 'grid', points: [[0, b], [xq, yq]], line: { m, b }, markX: xq },
    });
  }
  const xi = -b / m; const [xn, xd] = simplify(-b, m);
  return mk(skill, labelOf('graph'), {
    prompt: `The line ${eq}. Where does it cross the x-axis? Give x.`, expression: `${eq}, y = 0 → x = ?`, answer: xi, difficulty: diff, fraction: !Number.isInteger(xi), negative: xi < 0, answerText: fracText(xn, xd),
    hint: 'On the x-axis, y = 0. Set y to 0 and solve.',
    steps: [`Crossing the x-axis means y = 0: 0 = ${lin(m, b)}.`, `Move the constant: ${signed(m)}x = ${signed(-b)}.`, `x = ${signed(-b)} ÷ ${neg(m)} = ${fracText(xn, xd)}. The x-intercept is (${fracText(xn, xd)}, 0).`],
    visual: { type: 'grid', points: [[0, b], [xi, 0]], line: { m, b } },
  });
}

/* ---------------- trigonometry ---------------- */
const TRIPLES: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20]];
const deg = (r: number) => (r * 180) / Math.PI; const rad = (d: number) => (d * Math.PI) / 180;
export function trigQuestion(kind: 'ratio' | 'side' | 'angle' | 'special', fn: 'sin' | 'cos' | 'tan', tri: [number, number, number], angle: number, diff: Difficulty, skill = 'precalc.trig'): Question {
  const [opp, adj, hyp] = tri;
  const names = { sin: 'opposite / hypotenuse', cos: 'adjacent / hypotenuse', tan: 'opposite / adjacent' };
  if (kind === 'ratio') {
    const [n, d] = fn === 'sin' ? [opp, hyp] : fn === 'cos' ? [adj, hyp] : [opp, adj];
    const [sn, sd] = simplify(n, d);
    return mk(skill, labelOf('trig'), {
      prompt: `In this right triangle, opposite θ is ${opp}, adjacent is ${adj}, hypotenuse is ${hyp}. What is ${fn} θ, as a fraction?`, expression: `${fn} θ = ?`, answer: sn / sd, difficulty: diff, fraction: true, answerText: fracText(sn, sd),
      hint: `SOH CAH TOA: ${fn} is ${names[fn]}.`,
      steps: [`Name the sides from θ: opposite (across from θ) = ${opp}, adjacent (next to θ, not the hypotenuse) = ${adj}, hypotenuse (across from the right angle, the longest) = ${hyp}.`, `${fn} θ = ${names[fn]} = ${lab(n, names[fn].split(' / ')[0])} ÷ ${lab(d, names[fn].split(' / ')[1])} = ${n}/${d}${gcd(n, d) > 1 ? ` = ${fracText(sn, sd)}` : ''}.`, `SOH CAH TOA: Sin = Opp/Hyp, Cos = Adj/Hyp, Tan = Opp/Adj.`],
      visual: { type: 'trirat', opp, adj, hyp, theta: '?' },
    });
  }
  if (kind === 'side') {
    // Given the angle and one side, find another.
    const known: 'hyp' | 'adj' = fn === 'tan' ? 'adj' : 'hyp';
    const knownLen = known === 'hyp' ? hyp : adj;
    const want = fn === 'cos' ? 'adj' : 'opp';
    const raw = fn === 'sin' ? knownLen * Math.sin(rad(angle)) : fn === 'cos' ? knownLen * Math.cos(rad(angle)) : knownLen * Math.tan(rad(angle));
    const { answer, tolerance } = approx(raw, 1);
    const ratio = num(fn === 'sin' ? Math.sin(rad(angle)) : fn === 'cos' ? Math.cos(rad(angle)) : Math.tan(rad(angle)), 3);
    return mk(skill, labelOf('trig'), {
      prompt: `θ = ${angle}° and the ${known === 'hyp' ? 'hypotenuse' : 'adjacent side'} is ${knownLen} m. Find the ${want === 'opp' ? 'opposite' : 'adjacent'} side to one decimal place.`, expression: `${want} = ${knownLen} × ${fn} ${angle}° = ?`, answer, tolerance, unit: 'm', difficulty: diff, decimal: true,
      hint: `Which ratio links ${want === 'opp' ? 'opposite' : 'adjacent'} and ${known === 'hyp' ? 'hypotenuse' : 'adjacent'}? ${fn.toUpperCase()}.`,
      steps: [`You know the ${known === 'hyp' ? 'hypotenuse' : 'adjacent'} and want the ${want === 'opp' ? 'opposite' : 'adjacent'}: that pair belongs to ${fn} (${names[fn]}).`, `${fn} ${angle}° = ${want} / ${knownLen}, so ${want} = ${knownLen} × ${fn} ${angle}°.`, `${fn} ${angle}° ≈ ${ratio}, so ${want} ≈ ${lab(knownLen, `${known === 'hyp' ? 'hypotenuse' : 'adjacent'}, m`)} × ${lab(ratio, `${fn} of the angle`)} = ${lab(num(raw, 1), `${want === 'opp' ? 'opposite' : 'adjacent'}, m`)}.`, `Check the size: ${want === 'opp' || fn === 'cos' ? `a side must be shorter than the hypotenuse` : 'the opposite side grows as the angle grows'}.`],
      visual: { type: 'trirat', opp: want === 'opp' ? '?' : opp, adj: known === 'adj' ? knownLen : want === 'adj' ? '?' : adj, hyp: known === 'hyp' ? knownLen : hyp, theta: angle },
    });
  }
  if (kind === 'angle') {
    const raw = deg(Math.atan2(opp, adj));
    const { answer } = approx(raw, 0);
    return mk(skill, labelOf('trig'), {
      prompt: `Opposite θ is ${opp} and adjacent is ${adj}. Find θ to the nearest degree.`, expression: `tan θ = ${opp}/${adj}, θ = ?`, answer, tolerance: 1, unit: '°', difficulty: diff,
      hint: 'tan θ = opposite / adjacent, then use tan⁻¹ (inverse tan) to get the angle.',
      steps: [`Opposite and adjacent are known: that is tan. tan θ = ${lab(opp, 'opposite')} ÷ ${lab(adj, 'adjacent')} = ${lab(num(opp / adj, 3), 'tan of the angle')}.`, `To get the angle from its tangent, use the inverse: θ = tan⁻¹(${num(opp / adj, 3)}) ≈ ${lab(`${num(raw, 1)}°`, 'angle')}.`, `Sense check: ${opp > adj ? 'opposite is longer than adjacent, so θ is more than 45°' : opp < adj ? 'opposite is shorter than adjacent, so θ is less than 45°' : 'opposite equals adjacent, so θ is exactly 45°'}.`],
      visual: { type: 'trirat', opp, adj, hyp: '?', theta: '?' },
    });
  }
  const table: Record<string, Record<number, [number, string]>> = { sin: { 0: [0, '0'], 30: [0.5, '1/2'], 45: [0.707, '√2/2 ≈ 0.707'], 60: [0.866, '√3/2 ≈ 0.866'], 90: [1, '1'] }, cos: { 0: [1, '1'], 30: [0.866, '√3/2 ≈ 0.866'], 45: [0.707, '√2/2 ≈ 0.707'], 60: [0.5, '1/2'], 90: [0, '0'] }, tan: { 0: [0, '0'], 30: [0.577, '√3/3 ≈ 0.577'], 45: [1, '1'], 60: [1.732, '√3 ≈ 1.732'] } };
  const [value, text] = table[fn][angle];
  return mk(skill, labelOf('trig'), {
    prompt: `What is ${fn} ${angle}°? (Give a decimal.)`, expression: `${fn} ${angle}° = ?`, answer: value, tolerance: 0.006, difficulty: diff, decimal: true, answerText: num(value, 3),
    hint: fn === 'sin' ? 'sin grows from 0 at 0° to 1 at 90°.' : fn === 'cos' ? 'cos falls from 1 at 0° to 0 at 90°.' : 'tan 45° = 1; smaller angles give less, bigger give more.',
    steps: [`The special angles come from two triangles: 30-60-90 (sides 1, √3, 2) and 45-45-90 (sides 1, 1, √2).`, `${fn} ${angle}° = ${text}.`, `Picture it: ${fn === 'sin' ? 'sin is the height of the point on a unit circle' : fn === 'cos' ? 'cos is how far across the point on a unit circle sits' : 'tan is the slope of the line at that angle'}, so ${fn} ${angle}° is ${value}.`],
    visual: { type: 'trirat', opp: angle === 30 ? 1 : angle === 60 ? '?' : angle === 45 ? 1 : '?', adj: angle === 30 ? '?' : angle === 60 ? 1 : angle === 45 ? 1 : '?', hyp: angle === 45 ? '?' : 2, theta: angle },
  });
}

/* ---------------- dispatcher ---------------- */
const KINDS: Exclude<PrecalcKind, 'all'>[] = ['frac.add', 'frac.mul', 'neg', 'exp', 'roots', 'rearrange', 'evaluate', 'scinot', 'units', 'func', 'graph', 'trig'];
export function precalcQuestion(kind: PrecalcKind, d: Difficulty, rng: Rng, skillId?: string): Question {
  const k = kind === 'all' ? rng.pick(KINDS) : kind;
  const sid = skillId ?? (kind === 'all' ? 'precalc' : `precalc.${k}`);
  const nz = (lo: number, hi: number) => { let v = 0; while (v === 0) v = rng.int(lo, hi); return v; };
  switch (k) {
    case 'frac.add': {
      const dens = d <= 2 ? [2, 3, 4, 6] : d <= 4 ? [2, 3, 4, 5, 6, 8, 10] : [3, 4, 5, 6, 7, 8, 9, 10, 12];
      // Givens in lowest terms, different bottoms past the first level, and never an answer of 0.
      for (let tries = 0; ; tries++) {
        const b = rng.pick(dens); let dd = rng.pick(dens);
        if (d >= 2 && b === dd) dd = rng.pick(dens.filter((x) => x !== b));
        const a = rng.int(1, b - 1); const c = rng.int(1, dd - 1);
        const op = d <= 1 ? '+' : rng.chance(0.5) ? '+' : '−';
        const zero = op === '−' && a * dd === c * b;
        if (tries < 20 && (gcd(a, b) !== 1 || gcd(c, dd) !== 1 || zero)) continue;
        return fracAddQuestion(a, b, c, dd, op, d, sid);
      }
    }
    case 'frac.mul': {
      const dens = d <= 2 ? [2, 3, 4, 5] : [2, 3, 4, 5, 6, 8, 9, 10];
      const b = rng.pick(dens); const dd = rng.pick(dens);
      const a = rng.int(1, d <= 2 ? b - 1 : b + 2); const c = rng.int(1, dd - 1);
      return fracMulQuestion(a, b, c, dd, d <= 2 ? '×' : rng.chance(0.5) ? '×' : '÷', d, sid);
    }
    case 'neg': {
      const range = d <= 2 ? 9 : d <= 4 ? 20 : 60;
      const op = d <= 1 ? rng.pick(['+', '−'] as const) : rng.pick(['+', '−', '−', '×', '÷'] as const);
      if (op === '÷') { const q = nz(-range / 4, range / 4); const b = nz(-9, 9); return negQuestion(q * b, b, '÷', d, sid); }
      if (op === '×') return negQuestion(nz(-12, 12), nz(-12, 12), '×', d, sid);
      const a = nz(-range, range); const b = op === '−' && rng.chance(0.6) ? -rng.int(1, range) : nz(-range, range);
      return negQuestion(a, b, op, d, sid);
    }
    case 'exp': {
      const kinds = d <= 2 ? ['num', 'mul', 'mul'] : d <= 4 ? ['mul', 'div', 'pow', 'num', 'zero'] : ['mul', 'div', 'pow', 'negexp', 'zero'];
      const kk = rng.pick(kinds) as Parameters<typeof expQuestion>[0];
      if (kk === 'num') return expQuestion('num', rng.pick(d <= 2 ? [2, 3, 10] : [2, 3, 4, 5, 10]), rng.int(2, d <= 2 ? 3 : 5), d, sid);
      if (kk === 'zero') return expQuestion('zero', rng.int(2, 99), rng.int(2, 5), d, sid);
      if (kk === 'negexp') return expQuestion('negexp', rng.pick([2, 3, 5, 10]), rng.int(1, 3), d, sid);
      const p = rng.int(1, d <= 2 ? 5 : 9); const q = rng.int(1, d <= 2 ? 5 : 9);
      if (kk === 'div') return expQuestion('div', d >= 5 ? p : Math.max(p, q), d >= 5 ? q : Math.min(p, q), d, sid);
      return expQuestion(kk, p, q, d, sid);
    }
    case 'roots': {
      const kinds = d <= 2 ? ['sqrt', 'sqrt', 'cbrt'] : d <= 4 ? ['sqrt', 'cbrt', 'powroot', 'estimate'] : ['powroot', 'simplify', 'estimate', 'cbrt'];
      const kk = rng.pick(kinds) as Parameters<typeof rootQuestion>[0];
      if (kk === 'sqrt') return rootQuestion('sqrt', rng.int(2, d <= 2 ? 12 : 20), 0, d, sid);
      if (kk === 'cbrt') return rootQuestion('cbrt', rng.int(2, d <= 2 ? 5 : 10), 0, d, sid);
      if (kk === 'powroot') return rootQuestion('powroot', rng.int(1, 6) * 2, 0, d, sid);
      if (kk === 'simplify') { const a = rng.pick([2, 3, 4, 5]); const b = rng.pick([2, 3, 5, 6, 7]); return rootQuestion('simplify', a, b, d, sid); }
      const b = rng.int(2, 9); const a = rng.int(b * b + 1, (b + 1) ** 2 - 1);
      return rootQuestion('estimate', a, b, d, sid);
    }
    case 'rearrange': {
      const pool = d <= 2 ? FORMULAS.filter((f) => ['V = IR', 'F = ma', 'd = vt'].includes(f.eq)) : d <= 4 ? FORMULAS.filter((f) => !['v = u + at', 'E = ½mv²', 'y = mx + b'].includes(f.eq)) : FORMULAS;
      const f = rng.pick(pool);
      return rearrangeQuestion(f, rng.pick(f.vars), rng, d, sid);
    }
    case 'evaluate': {
      const pool = d <= 2 ? FORMULAS.filter((f) => ['V = IR', 'F = ma', 'd = vt'].includes(f.eq)) : d <= 4 ? FORMULAS.filter((f) => !['PV = nRT', 'E = ½mv²'].includes(f.eq)) : FORMULAS;
      const f = rng.pick(pool); const target = rng.pick(f.vars);
      const base = f.sample!();
      // Scale the sample so the numbers vary but stay friendly.
      const scale = d <= 2 ? 1 : rng.pick([1, 2, 3, 0.5]);
      const values: Record<string, number> = {};
      for (const [key, v] of Object.entries(base)) values[key] = key === 'R' || key === 'ρ' ? v : (f.eq === 'PV = nRT' && key === 'T') || f.eq === 'v = u + at' || f.eq === 'y = mx + b' || f.eq === 'E = ½mv²' ? v : v * scale;
      // Keep the equation true after scaling: recompute the target from the others (the others are the givens).
      values[target] = f.calc![target](values);
      return evaluateQuestion(f, target, values, d, sid);
    }
    case 'scinot': {
      const kinds = d <= 2 ? ['toexp', 'expand'] : d <= 4 ? ['toexp', 'expand', 'mul'] : ['toexp', 'expand', 'mul', 'div'];
      const kk = rng.pick(kinds) as Parameters<typeof sciQuestion>[0];
      const mant = rng.int(1, 9) + (d <= 1 ? 0 : rng.int(0, 9) / 10);
      const exp = d <= 2 ? rng.int(1, 4) : d <= 4 ? rng.pick([-3, -2, -1, 1, 2, 3, 4, 5, 6]) : rng.pick([-6, -4, -3, -2, 2, 3, 5, 6, 8]);
      if (kk === 'toexp' || kk === 'expand') return sciQuestion(kk, mant, exp, 1, 0, d, sid);
      const m1 = rng.int(1, 4); const m2 = kk === 'mul' ? rng.int(1, 4) : rng.pick([1, 2, 4].filter((x) => m1 % x === 0));
      return sciQuestion(kk, m1, exp, m2, rng.int(1, 4) * (kk === 'div' && rng.chance(0.5) ? -1 : 1), d, sid);
    }
    case 'units': {
      const tier = d <= 2 ? 1 : d <= 4 ? 2 : 3;
      const c = rng.pick(UNIT_CONVS.filter((x) => x.tier <= tier && (tier === 1 || x.tier >= tier - 1)));
      const value = c.from === 'km/h' ? rng.pick([18, 36, 54, 72, 90, 108]) : c.from === 'm/s' ? rng.pick([5, 10, 15, 20, 25, 30]) : c.factor >= 1 ? (d <= 2 ? rng.int(1, 9) : rng.int(1, 40) / (rng.chance(0.4) ? 10 : 1)) : rng.int(1, 9) * rng.pick([1, 10, 100, 250, 500]);
      return unitQuestion(c, value, d, sid);
    }
    case 'func': {
      const kinds = d <= 2 ? ['linear', 'linear', 'solve'] : d <= 4 ? ['linear', 'quad', 'solve', 'compose'] : ['quad', 'compose', 'solve'];
      const kk = rng.pick(kinds) as Parameters<typeof funcQuestion>[0];
      const a = d <= 2 ? rng.int(1, 5) : nz(-6, 6); const b = d <= 2 ? rng.int(-5, 9) : nz(-12, 12); const c = nz(-3, 3);
      const x = d <= 2 ? rng.int(0, 6) : nz(-6, 8);
      return funcQuestion(kk, a, b, c, x, d, sid);
    }
    case 'graph': {
      const kinds = d <= 2 ? ['slope', 'value'] : d <= 4 ? ['slope', 'intercept', 'value'] : ['slope', 'intercept', 'value', 'xint'];
      const kk = rng.pick(kinds) as Parameters<typeof graphQuestion>[0];
      const m = d <= 2 ? rng.int(1, 3) : d <= 4 ? nz(-3, 3) : rng.pick([-2, -1, -0.5, 0.5, 1, 1.5, 2, 3]);
      const b = d <= 2 ? rng.int(0, 4) : nz(-5, 5);
      let x1 = rng.int(-4, 3); let x2 = x1 + rng.int(1, 4);
      if (!Number.isInteger(m)) { x1 = 2 * rng.int(-2, 1); x2 = x1 + 2 * rng.int(1, 2); }
      const xq = nz(-5, 5) * (Number.isInteger(m) ? 1 : 2);
      if (kk === 'xint' && (!Number.isInteger(-b / m) && d < 6)) return graphQuestion('value', m, b, x1, x2, xq, d, sid);
      return graphQuestion(kk, m, b, x1, x2, xq, d, sid);
    }
    default: {
      const kinds = d <= 2 ? ['ratio', 'special'] : d <= 4 ? ['ratio', 'side', 'special'] : ['side', 'angle', 'ratio'];
      const kk = rng.pick(kinds) as Parameters<typeof trigQuestion>[0];
      const fn = rng.pick(['sin', 'cos', 'tan'] as const);
      const tri = rng.pick(d <= 2 ? TRIPLES.slice(0, 3) : TRIPLES);
      if (kk === 'special') { const opts = fn === 'tan' ? [0, 30, 45, 60] : [0, 30, 45, 60, 90]; return trigQuestion('special', fn, tri, rng.pick(opts), d, sid); }
      if (kk === 'side') return trigQuestion('side', fn, [rng.int(3, 20), rng.int(3, 20), rng.int(5, 30)], rng.pick([20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]), d, sid);
      return trigQuestion(kk, fn, tri, 0, d, sid);
    }
  }
}

export const genPrecalc: Generator = (skillId, params, ctx) => precalcQuestion(String(params?.kind ?? 'all') as PrecalcKind, ctx.difficulty, ctx.rng, skillId);
