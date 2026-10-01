import type { Rng } from '../rng';
import type { Question, SkillId } from '../types';
import { nextQuestionId } from '../questions/context';
import type { GroupId, Level, RentCalc } from './board';

/**
 * Questions for Engine City Tycoon, built by hand so each colour group asks exactly its region's maths at the
 * chosen level. Answers are checked by the app's checkAnswer, and the player's answers feed mastery and the
 * Notebook like any other practice.
 */

interface Made { skill: SkillId; expr: string; answer: number; steps: string[]; prompt?: string; text?: string; frac?: boolean; dec?: boolean; neg?: boolean; hint?: string; unit?: string }

function q(topic: string, m: Made, difficulty: 1 | 2 | 3 | 4 | 5 | 6): Question {
  return {
    id: nextQuestionId('tycoon'), masterySkillId: m.skill, topic: 'Engine City Tycoon', subtopic: topic, difficulty, mode: m.prompt ? 'applied' : 'pure',
    prompt: m.prompt ?? 'Work it out.', expression: m.expr, answer: m.answer, answerText: m.text, unit: m.unit,
    allowFraction: m.frac, allowDecimal: m.dec || m.frac, allowNegative: m.neg,
    hint: m.hint ?? m.steps[0] ?? '', solutionSteps: m.steps, explanation: m.steps, visual: { type: 'none' }, prerequisites: [],
  };
}
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const fracText = (n: number, d: number) => { const g = gcd(n, d); return d / g === 1 ? `${n / g}` : `${n / g}/${d / g}`; };
const round2 = (x: number) => Math.round(x * 100) / 100;

type Gen = (r: Rng, hard: boolean) => Made;

const JUNIOR: Record<GroupId, Gen> = {
  brown: (r, h) => { const a = r.int(2, h ? 15 : 10), b = r.int(2, h ? 15 : 9); return { skill: 'add.basic', expr: `${a} + ${b} = ?`, answer: a + b, steps: [`Start at ${a} and count on ${b}: ${a + b}.`] }; },
  lblue: (r, h) => { const a = r.int(11, h ? 35 : 25), b = r.int(3, h ? 15 : 9); return { skill: 'add.basic', expr: `${a} + ${b} = ?`, answer: a + b, steps: [`${a} + ${b}: add the ones, then the tens.`, `= ${a + b}`] }; },
  pink: (r, h) => { const a = r.int(h ? 30 : 20, 50), b = r.int(3, h ? 19 : 9); return { skill: 'sub.basic', expr: `${a} − ${b} = ?`, answer: a - b, steps: [`Count back ${b} from ${a}: ${a - b}.`] }; },
  orange: (r, h) => { if (r.chance(0.5)) { const a = r.int(6, h ? 45 : 25); return { skill: 'add.basic', expr: `Double ${a} = ?`, answer: 2 * a, steps: [`Double means add it to itself: ${a} + ${a} = ${2 * a}.`] }; } const a = 2 * r.int(4, h ? 30 : 15); return { skill: 'num.sense', expr: `Half of ${a} = ?`, answer: a / 2, steps: [`Half means split into 2 equal parts: ${a} ÷ 2 = ${a / 2}.`] }; },
  red: (r, h) => { const a = r.int(21, h ? 68 : 55), b = r.int(12, h ? 31 : 25); return { skill: 'add.basic', expr: `${a} + ${b} = ?`, answer: a + b, steps: [`Tens: ${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10} = ${(Math.floor(a / 10) + Math.floor(b / 10)) * 10}.`, `Ones: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}.`, `Together: ${a + b}.`] }; },
  yellow: (r, h) => { const a = r.int(50, 99), b = r.int(12, h ? 48 : 30); return { skill: 'sub.basic', expr: `${a} − ${b} = ?`, answer: a - b, steps: [`Take away the tens, then the ones.`, `${a} − ${b} = ${a - b}.`] }; },
  green: (r, h) => { const t = r.int(2, 8), o = r.int(0, 9); if (h) return { skill: 'num.sense', expr: `${t} tens and ${o + 10} ones = ?`, answer: t * 10 + o + 10, steps: [`${o + 10} ones is 1 ten and ${o} ones.`, `So it is ${t + 1} tens and ${o} ones: ${(t + 1) * 10} (tens) + ${o} (ones) = ${t * 10 + o + 10}.`] }; return { skill: 'num.sense', expr: `${t} tens and ${o} ones = ?`, answer: t * 10 + o, steps: [`${t} tens is ${t * 10}.`, `${t * 10} (tens) + ${o} (ones) = ${t * 10 + o}.`] }; },
  dblue: (r, h) => { const k = r.pick(h ? [2, 5, 10, 3] : [2, 5, 10]); const n = r.int(2, h ? 12 : 10); return { skill: 'mult', expr: `${n} × ${k} = ?`, answer: n * k, steps: [`Count in ${k}s, ${n} times: ${Array.from({ length: n }, (_, i) => (i + 1) * k).join(', ')}.`] }; },
};

const EXPLORER: Record<GroupId, Gen> = {
  brown: (r, h) => { if (r.chance(0.5)) { const a = r.int(h ? 150 : 40, h ? 700 : 400), b = r.int(h ? 120 : 20, h ? 290 : 99); return { skill: 'add.basic', expr: `${a} + ${b} = ?`, answer: a + b, steps: [`Add hundreds, tens and ones.`, `${a} + ${b} = ${a + b}.`] }; } const a = r.int(h ? 400 : 100, h ? 900 : 300), b = r.int(h ? 150 : 20, h ? 390 : 99); return { skill: 'sub.basic', expr: `${a} − ${b} = ?`, answer: a - b, steps: [`Subtract hundreds, tens and ones, exchanging where needed.`, `${a} − ${b} = ${a - b}.`] }; },
  lblue: (r, h) => { const a = r.int(h ? 6 : 2, h ? 12 : 9), b = r.int(h ? 6 : 2, h ? 12 : 10); return { skill: 'mult', expr: `${a} × ${b} = ?`, answer: a * b, steps: [`${a} groups of ${b}: ${a} × ${b} = ${a * b}.`] }; },
  pink: (r, h) => { const d = r.int(3, h ? 9 : 6), qn = r.int(h ? 6 : 3, h ? 15 : 9), rem = r.int(1, d - 1); const n = d * qn + rem; return { skill: 'div', expr: `${n} ÷ ${d} = ? remainder ${rem}`, answer: qn, prompt: `How many whole ${d}s fit into ${n}? (The remainder is ${rem}.)`, steps: [`${d} × ${qn} = ${d * qn}.`, `${n} − ${d * qn} = ${rem} left over.`, `So ${n} ÷ ${d} = ${qn} remainder ${rem}.`] }; },
  orange: (r, h) => { const [n, d] = r.pick(h ? [[2, 3], [3, 4], [2, 5], [3, 5], [5, 6]] : [[1, 2], [1, 3], [1, 4], [3, 4], [2, 3]]); const k = r.int(2, h ? 12 : 8); const total = d * k; return { skill: 'frac', expr: `${n}/${d} of ${total} = ?`, answer: n * k, steps: [`Find 1/${d} first: ${total} ÷ ${d} = ${k}.`, `Then ${n} of those: ${n} × ${k} = ${n * k}.`] }; },
  red: (r, h) => { if (r.chance(0.5)) { const p = r.pick(h ? [20, 25, 75, 30] : [10, 50, 25]); const base = p === 25 || p === 75 ? 4 * r.int(3, 30) : 10 * r.int(2, 30); return { skill: 'percent', expr: `${p}% of ${base} = ?`, answer: (p * base) / 100, steps: [p === 50 ? `50% is a half: ${base} ÷ 2.` : p % 25 === 0 ? `25% is a quarter: ${base} ÷ 4 = ${base / 4}.` : `10% is ${base} ÷ 10 = ${base / 10}.`, `${p}% of ${base} = ${(p * base) / 100}.`] }; } const a = round2(r.int(1, 9) / 10 + r.int(0, 3)), b = round2(r.int(1, 9) / (h ? 100 : 10) + r.int(0, 2)); return { skill: 'decimals', expr: `${a} + ${b} = ?`, answer: round2(a + b), dec: true, steps: [`Line up the decimal points and add.`, `${a} + ${b} = ${round2(a + b)}.`] }; },
  yellow: (r, h) => { const a = r.int(1, 5), b = r.int(a + 1, 9); const k = r.int(2, h ? 12 : 6); if (r.chance(0.5)) return { skill: 'ratio', expr: `${a} : ${b} = ${a * k} : ?`, answer: b * k, steps: [`${a} became ${a * k}: that is × ${k}.`, `So ${b} × ${k} = ${b * k}.`] }; const km = r.pick([2, 5, 10]); const cm = r.int(3, h ? 15 : 9); return { skill: 'ratio', expr: `1 cm on the map = ${km} km. ${cm} cm = ? km`, answer: km * cm, unit: 'km', steps: [`Each centimetre on the map is ${km} km for real.`, `${cm} (map cm) × ${km} (km per map cm) = ${km * cm} (real km).`] }; },
  green: (r, h) => { const x = r.int(2, h ? 20 : 12); if (r.chance(0.5)) { const a = r.int(3, h ? 30 : 15); return { skill: 'prealg.equations', expr: `x + ${a} = ${x + a}. x = ?`, answer: x, steps: [`Take ${a} from both sides.`, `x = ${x + a} − ${a} = ${x}.`] }; } const a = r.int(2, h ? 9 : 6); return { skill: 'prealg.equations', expr: `${a}x = ${a * x}. x = ?`, answer: x, steps: [`${a}x means ${a} × x. Divide both sides by ${a}.`, `x = ${a * x} ÷ ${a} = ${x}.`] }; },
  dblue: (r, h) => { const n = r.int(h ? 7 : 2, h ? 15 : 10); return r.chance(0.5) ? { skill: 'exponents', expr: `${n}² = ?`, answer: n * n, steps: [`${n}² means ${n} × ${n} = ${n * n}.`] } : { skill: 'exponents', expr: `√${n * n} = ?`, answer: n, steps: [`Which number times itself makes ${n * n}? ${n} × ${n} = ${n * n}.`] }; },
};

const TYCOON: Record<GroupId, Gen> = {
  brown: (r, h) => { if (r.chance(0.5)) { const a = r.int(-15, 10), b = r.int(h ? -30 : 5, h ? -5 : 25); return { skill: 'neg.numbers', expr: `${a} − ${b < 0 ? `(${b})` : b} = ?`, answer: a - b, neg: true, steps: [b < 0 ? `Taking away a negative is the same as adding: ${a} + ${-b}.` : `Move ${b} to the left of ${a} on the number line.`, `= ${a - b}.`] }; } const a = r.int(2, 9), b = r.int(2, 9), c = r.int(2, h ? 12 : 9); return { skill: 'order.ops', expr: `${a} + ${b} × ${c} = ?`, answer: a + b * c, steps: [`Multiply before adding: ${b} × ${c} = ${b * c}.`, `${a} + ${b * c} = ${a + b * c}.`] }; },
  lblue: (r, h) => { const a = r.int(12, h ? 49 : 25), b = r.int(h ? 11 : 3, h ? 29 : 9); return { skill: 'mult', expr: `${a} × ${b} = ?`, answer: a * b, steps: [`Split ${a} into ${Math.floor(a / 10) * 10} and ${a % 10}.`, `${Math.floor(a / 10) * 10} × ${b} = ${Math.floor(a / 10) * 10 * b}; ${a % 10} × ${b} = ${(a % 10) * b}.`, `Add: ${a * b}.`] }; },
  pink: (r, h) => { const d = r.int(3, h ? 12 : 8), qn = r.int(h ? 40 : 12, h ? 150 : 60); return { skill: 'div', expr: `${d * qn} ÷ ${d} = ?`, answer: qn, steps: [`Divide in chunks: how many ${d}s in ${d * qn}?`, `${d} × ${qn} = ${d * qn}, so the answer is ${qn}.`] }; },
  orange: (r, h) => { const [a, b, c, d] = r.pick(h ? [[2, 3, 3, 4], [3, 4, 5, 6], [3, 8, 1, 6], [2, 5, 1, 3], [5, 6, 1, 4]] : [[1, 2, 1, 3], [1, 2, 1, 4], [1, 3, 1, 6], [2, 5, 1, 2], [1, 4, 1, 3]]); const den = (b * d) / gcd(b, d); const n = a * (den / b) + c * (den / d); return { skill: 'frac', expr: `${a}/${b} + ${c}/${d} = ?`, answer: n / den, text: fracText(n, den), frac: true, steps: [`Use a common denominator: ${den}.`, `${a}/${b} = ${a * (den / b)}/${den} and ${c}/${d} = ${c * (den / d)}/${den}.`, `${a * (den / b)}/${den} + ${c * (den / d)}/${den} = ${n}/${den}${fracText(n, den) !== `${n}/${den}` ? ` = ${fracText(n, den)}` : ''}.`] }; },
  red: (r, h) => { const base = 10 * r.int(4, 30); const p = r.pick(h ? [15, 20, 25, 30, 40] : [10, 20, 50]); const up = r.chance(0.5); const res = up ? base * (1 + p / 100) : base * (1 - p / 100); return { skill: 'percent', expr: `${base} ${up ? 'increased' : 'decreased'} by ${p}% = ?`, answer: round2(res), dec: true, steps: [`${p}% of ${base} = ${(p * base) / 100}.`, `${base} ${up ? '+' : '−'} ${(p * base) / 100} = ${round2(res)}.`] }; },
  yellow: (r, h) => { const a = r.int(1, 4), b = r.int(a + 1, 7); const k = r.int(2, h ? 20 : 10); const total = (a + b) * k; return { skill: 'ratio', expr: `Share ${total} in the ratio ${a} : ${b}. The bigger share = ?`, answer: b * k, steps: [`Total parts: ${a} (smaller share parts) + ${b} (bigger share parts) = ${a + b} (total parts).`, `One part: ${total} (amount shared) ÷ ${a + b} (total parts) = ${k} (one part).`, `Bigger share: ${b} (bigger share parts) × ${k} (one part) = ${b * k} (bigger share).`] }; },
  green: (r, h) => { const x = r.int(h ? -6 : 2, h ? 15 : 12) || 3; const a = r.int(2, h ? 9 : 5), b = r.int(1, 20); return { skill: 'prealg.equations', expr: `${a}x + ${b} = ${a * x + b}. x = ?`, answer: x, neg: x < 0, steps: [`Take ${b} from both sides: ${a}x = ${a * x}.`, `Divide by ${a}: x = ${x}.`] }; },
  dblue: (r, h) => { if (!h && r.chance(0.6)) { const [a, b, c] = r.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]]); return { skill: 'geo.pythagoras', expr: `Right triangle, legs ${a} and ${b}. Longest side = ?`, answer: c, steps: [`a² + b² = c²: ${a * a} (first leg²) + ${b * b} (second leg²) = ${c * c} (longest side²).`, `c = √${c * c} = ${c} (longest side).`] }; } const [expr, ans, text] = r.pick([['sin 30° = ?', 0.5, '1/2'], ['cos 60° = ?', 0.5, '1/2'], ['tan 45° = ?', 1, '1'], ['sin 90° = ?', 1, '1'], ['cos 0° = ?', 1, '1']] as const); return { skill: 'trig.ratios', expr, answer: ans, text, frac: true, steps: [`${expr.replace(' = ?', '')} = ${text}. Picture the special triangle: ${expr.startsWith('tan') ? 'the 45° triangle has equal legs, so opposite ÷ adjacent = 1' : 'in the 30-60-90 triangle the side opposite 30° is half the hypotenuse'}.`] }; },
};

const BANK: Record<Level, Record<GroupId, Gen>> = { junior: JUNIOR, explorer: EXPLORER, tycoon: TYCOON };

/** The question that buys a street (hard = the harder one that builds a workshop). */
export function streetQuestion(level: Level, group: GroupId, rng: Rng, hard = false, where = ''): Question {
  const m = BANK[level][group](rng, hard);
  const lvl = level === 'junior' ? 1 : level === 'explorer' ? 3 : 5;
  return q(where || group, { ...m, prompt: m.prompt ?? (hard ? `Build a workshop${where ? ` on ${where}` : ''}: answer this harder question.` : `Buy ${where || 'this street'}: answer the question.`) }, (Math.min(6, lvl + (hard ? 1 : 0)) as 1 | 2 | 3 | 4 | 5 | 6));
}

/** A payment the player works out: rent, tax or a card. */
export function moneyQuestion(title: string, calc: RentCalc, prompt: string, skill: SkillId = 'mult'): Question {
  return q(title, { skill, expr: `${calc.expr} = ?`, answer: calc.amount, unit: 'gears', prompt, steps: calc.steps }, 3);
}

/** A choice question (estimation cards): the answer is the index of the right choice, checked by the screen. */
export interface ChoiceQ { prompt: string; choices: string[]; answer: number; why: string }
