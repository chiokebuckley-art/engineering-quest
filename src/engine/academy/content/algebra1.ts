/**
 * The Algebra 1 Academy: multi-step equations and formulas, inequalities, slope and lines, functions,
 * systems, exponent rules, polynomials, factoring and a first look at quadratics, then the Mastery
 * Trial. Every chapter teaches with a model first (balance, number line, plot, table), names the
 * misconception it hunts, and asks with distractors built from the real mistakes.
 */
import type { Visual } from '../../types';
import { defineAcademy, type ChapterSpec } from '../defs';
import type { Fn } from '../fn';
import type { PlotLayers } from '../types';
import {
  academySkill, mkq, typed, choose, model, ask, wave, times, mixOf, conceptFrom, oneOf, rint, pick, rnz,
  fmt, fmtSigned, coefTerm, polyStr, fracStr, gcd, simplify, nearMisses, type Rng, type AskStep, type Question,
} from '../kit';
import { lab, labn } from '../../label';

const ID = 'algebra1';
const S = (key: string) => academySkill(ID, key);

/* ================================================================================================
 * Formatting helpers
 * ============================================================================================== */
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
/** Superscript exponent ('' for 1): sup(2) → '²', sup(-3) → '⁻³'. */
const sup = (n: number) => (n === 1 ? '' : String(n).replace('-', '⁻').replace(/\d/g, (d) => SUP[Number(d)]));
/** c·v^p: mono(3, 2) → '3x²', mono(-1, 3) → '−x³', mono(5, 0) → '5'. */
const mono = (c: number, p: number, v = 'x') => (p === 0 ? fmt(c) : `${c === 1 ? '' : c === -1 ? '−' : fmt(c)}${v}${sup(p)}`);
/** a·v + b without '1x', '0x' or '+ −3'. */
const lin = (a: number, b: number, v = 'x') => (a === 0 ? fmt(b) : b === 0 ? coefTerm(a, v) : `${coefTerm(a, v)} ${fmtSigned(b)}`);
/** A number in parentheses when negative, for products: par(-3) → '(−3)'. */
const par = (n: number) => (n < 0 ? `(${fmt(n)})` : fmt(n));
/** (n/d)·v reduced: '3x', '−x', '(1/2)x', '−(2/3)x'. */
const fracTerm = (n: number, d: number, v = 'x') => { const [p, q] = simplify(n, d); return q === 1 ? coefTerm(p, v) : `${p < 0 ? '−' : ''}(${Math.abs(p)}/${q})${v}`; };
/** 'y = (n/d)x + b'. */
const yEq = (n: number, d: number, b: number) => { const [p] = simplify(n, d); if (p === 0) return `y = ${fmt(b)}`; const t = fracTerm(n, d); return b === 0 ? `y = ${t}` : `y = ${t} ${fmtSigned(b)}`; };
const P = (x: number, y: number) => `(${fmt(x)}, ${fmt(y)})`;
const xeq = (v: number, name = 'x') => `${name} = ${fmt(v)}`;
const lineFn = (m: number, b: number): Fn => ({ kind: 'poly', c: [b, m] });
const plotV = (range: [number, number, number, number], layers: PlotLayers): Visual => ({ type: 'plot', range, layers });
const card = (title: string, lines: string[]): Visual => ({ type: 'card', title, lines });
const R6: [number, number, number, number] = [-6, 6, -6, 6];
const LETTERS = ['A', 'B', 'C', 'D'];

/** Pick-the-picture with options lettered in the order they are shown. */
function pickLettered(rng: Rng, q: Question, visuals: Visual[], rightIndex: number, noun = 'Graph'): AskStep {
  const order = rng.shuffle(visuals.map((_, i) => i));
  const options = order.map((i, k) => ({ visual: visuals[i], label: `${noun} ${LETTERS[k]}` }));
  const right = options[order.indexOf(rightIndex)].label;
  return ask({ ...q, answerText: right }, 'pickmodel', { options, accept: [right] });
}
/** Pad a wrong list with near-miss numbers formatted by `f` until there are enough candidates. */
function padWrongs(rng: Rng, right: number, wrongs: string[], f: (v: number) => string, rightText: string): string[] {
  const out = wrongs.filter((w) => w !== rightText);
  for (const v of nearMisses(rng, right, 4, 6)) { if (out.length >= 5) break; const t = f(Number(v.replace('−', '-'))); if (t !== rightText && !out.includes(t)) out.push(t); }
  return out;
}

/** Worked lines for a·v + b = c·v + d (integers, a ≠ c): gather v on one side, undo the constant, divide. */
function solveLines(a: number, b: number, c: number, d: number, v = 'x'): string[] {
  const out: string[] = [];
  const moveX = (k: number) => (k > 0 ? `Subtract ${coefTerm(k, v)} from both sides` : `Add ${coefTerm(-k, v)} to both sides`);
  const moveK = (k: number) => (k > 0 ? `Subtract ${fmt(k)} from both sides` : `Add ${fmt(-k)} to both sides`);
  let K: number; let B: number; let D: number; let flip = false;
  if (c === 0) { K = a; B = b; D = d; }
  else if (a > c) { out.push(`${moveX(c)}: ${lin(a - c, b, v)} = ${fmt(d)}.`); K = a - c; B = b; D = d; }
  else { out.push(`${moveX(a)}: ${fmt(b)} = ${lin(c - a, d, v)}.`); K = c - a; B = d; D = b; flip = true; }
  const x = (D - B) / K;
  if (B !== 0) out.push(`${moveK(B)}: ${flip ? `${fmt(D - B)} = ${coefTerm(K, v)}` : `${coefTerm(K, v)} = ${fmt(D - B)}`}.`);
  if (K !== 1) out.push(`Divide both sides by ${fmt(K)}: ${v} = ${fmt(x)}.`);
  else if (B === 0) out.push(`So ${v} = ${fmt(x)}.`);
  return out;
}

/* ================================================================================================
 * 1. Multi-step equations (balance)
 * ============================================================================================== */
const K1 = 'equations';
const FRAMES1 = ['Two pumps must push equal pressure.', 'Two cables must carry equal load.', 'Both tanks must read the same level.', 'The two gear trains must turn equally.'];

function bothSidesParams(rng: Rng) {
  const x = rnz(rng, -6, 6);
  // Either x-coefficient may be negative (Pre-Algebra only had positive ones); keep a ≠ c and the numbers small.
  let a = 5; let c = 2;
  for (let g = 0; g < 30; g++) { a = rnz(rng, -5, 7); c = rnz(rng, -5, 6); if (a !== c && Math.abs(a - c) <= 6 && (a < 0 || c < 0 || rng.next() < 0.4)) break; }
  if (a === c) c = a - 1;
  const b = rint(rng, -9, 9); const d = (a - c) * x + b;
  return { x, a, b, c, d };
}

function balanceTwoSidesStep(rng: Rng): AskStep {
  const { x, a, b, c, d } = bothSidesParams(rng);
  const q = mkq(S(K1), 'both-sides', {
    prompt: `${pick(rng, FRAMES1)} Balance the scale to find x.`,
    expression: `${lin(a, b)} = ${lin(c, d)}`,
    answer: x,
    hint: 'Clear the x-term from one pan by adding or subtracting it on BOTH pans, so x is on one side only.',
    steps: [...solveLines(a, b, c, d), `Check: both sides equal ${fmt(a * x + b)}.`],
    app: 'Balancing two sides is how engineers find the setting where two systems match.',
  });
  return model(q, { kind: 'balance', a, b, c, d }, [String(x)], 'Do the same move to both pans until x stands alone.');
}

function keepBalanceStep(rng: Rng): AskStep {
  const x = rint(rng, 1, 8); const c = rint(rng, 2, 4); const a = c + rint(rng, 1, 4); const b = rint(rng, 1, 9); const d = (a - c) * x + b;
  const right = `Subtract ${c}x from both pans`;
  const q = mkq(S(K1), 'keep-balance', {
    prompt: 'The scale must stay level. Which move keeps it balanced?',
    expression: `${lin(a, b)} = ${lin(c, d)}`,
    answer: 0,
    hint: 'A balance stays level only if both pans get exactly the same change.',
    steps: [`Whatever you do to one side, do to the other: subtract ${c}x from both.`, `${lin(a - c, b)} = ${fmt(d)}, so x = ${fmt(x)}.`],
    visual: { type: 'balance', left: lin(a, b), right: lin(c, d), unknown: 'x' },
  });
  return choose(rng, q, right, [`Subtract ${c}x from left pan only`, `Subtract ${b} left, add ${b} right`, `Divide left pan only by ${a}`]);
}

function whichSolutionStep(rng: Rng): AskStep {
  const x = rnz(rng, -6, 6); const c = rint(rng, 1, 4); const a = c + rint(rng, 1, 3); const b = rnz(rng, -9, 9); const d = (a - c) * x + b;
  const wr: number[] = [];
  if ((d + b) % (a - c) === 0) wr.push((d + b) / (a - c));      // moved the constant without changing its sign
  if ((d - b) % (a + c) === 0) wr.push((d - b) / (a + c));      // added the x-terms instead of subtracting
  wr.push(-x);
  const right = xeq(x);
  const q = mkq(S(K1), 'which-solution', {
    prompt: 'Which value of x balances the scale?',
    expression: `${lin(a, b)} = ${lin(c, d)}`,
    answer: x,
    answerText: right,
    hint: 'Gather the x-terms on one side, then undo the constant. Check by substituting.',
    steps: [...solveLines(a, b, c, d), `Check: ${a}(${fmt(x)}) ${fmtSigned(b)} = ${fmt(a * x + b)} and ${c === 1 ? '' : c}(${fmt(x)}) ${fmtSigned(d)} = ${fmt(c * x + d)}.`],
  });
  return choose(rng, q, right, padWrongs(rng, x, wr.map((v) => xeq(v)), (v) => xeq(v), right));
}

function distParams(rng: Rng) {
  const x = rnz(rng, -5, 5); const k = pick(rng, [2, 3, 4, 5, -2, -3]); const p = rnz(rng, -5, 5);
  let c = pick(rng, [0, 1, 2, -1]); if (c === k) c = 0;
  const d = (k - c) * x + k * p;
  return { x, k, p, c, d };
}

function solveTypedStep(rng: Rng): AskStep {
  const { x, k, p, c, d } = distParams(rng);
  const q = mkq(S(K1), 'multi-step', {
    prompt: 'Solve for x.',
    expression: `${fmt(k)}(${lin(1, p)}) = ${lin(c, d)}`,
    answer: x,
    hint: 'Distribute first (the outside number multiplies both terms), then balance.',
    steps: [`Distribute: ${lin(k, k * p)} = ${lin(c, d)}.`, ...solveLines(k, k * p, c, d)],
  });
  return typed(q);
}

function distributeBalanceStep(rng: Rng): AskStep {
  const { x, k, p, c, d } = distParams(rng);
  const q = mkq(S(K1), 'distribute-balance', {
    prompt: 'Distribute, then balance to find x.',
    expression: `${fmt(k)}(${lin(1, p)}) = ${lin(c, d)}`,
    answer: x,
    hint: `${fmt(k)} multiplies BOTH terms inside the bracket, sign included.`,
    steps: [`Distribute: ${fmt(k)} × x = ${coefTerm(k, 'x')} and ${fmt(k)} × ${par(p)} = ${fmt(k * p)}, so ${lin(k, k * p)} = ${lin(c, d)}.`, ...solveLines(k, k * p, c, d)],
  });
  return model(q, { kind: 'balance', a: k, b: k * p, c, d, label: `Distributed: ${lin(k, k * p)} = ${lin(c, d)}` }, [String(x)], 'The scale shows the distributed equation. Balance it until x stands alone.');
}

function distributeFirstStep(rng: Rng): AskStep {
  const k = pick(rng, [2, 3, 4, 5, -2, -3, -4]); const m = pick(rng, [1, 1, 2, 3]); const p = rnz(rng, -6, 6);
  const right = lin(k * m, k * p);
  const q = mkq(S(K1), 'distribute', {
    prompt: 'Expand the bracket before you balance.',
    expression: `${fmt(k)}(${lin(m, p)})`,
    answer: 0,
    hint: 'The number outside multiplies EVERY term inside, sign included.',
    steps: [`${fmt(k)} × ${coefTerm(m, 'x')} = ${coefTerm(k * m, 'x')} and ${fmt(k)} × ${par(p)} = ${fmt(k * p)}.`, `So ${fmt(k)}(${lin(m, p)}) = ${right}.`],
  });
  return choose(rng, q, right, [lin(k * m, p), lin(k * m, -k * p), lin(m, k * p), lin(k * m, k + p)]);
}

function tankMeetStep(rng: Rng): AskStep {
  const t = rint(rng, 2, 12); const r1 = rint(rng, 2, 5); const r2 = r1 + rint(rng, 1, 4); const s2 = 5 * rint(rng, 1, 6); const s1 = s2 + (r2 - r1) * t;
  const q = mkq(S(K1), 'tank-meet', {
    prompt: `Tank A holds ${s1} L and gains ${r1} L/min. Tank B holds ${s2} L and gains ${r2} L/min. When are they level?`,
    expression: `A: ${s1} L, +${r1} L/min  ·  B: ${s2} L, +${r2} L/min`,
    answer: t, unit: 'min',
    hint: 'Write each level as start + rate × time, then set the two levels equal.',
    steps: [`A = ${lab(s1, 'L at start')} + ${lab(r1, 'L per min')} × t (min). B = ${lab(s2, 'L at start')} + ${lab(r2, 'L per min')} × t.`, `Level means equal: ${s1} + ${r1}t = ${s2} + ${r2}t.`, `Subtract ${r1}t: ${s1} = ${lin(r2 - r1, s2, 't')}, where ${lab(r2 - r1, 'L per min')} is how fast B catches up.`, `Subtract ${lab(s2, 'L, B at start')}: ${lab(s1 - s2, 'L head start of A')} = ${coefTerm(r2 - r1, 't')}.`, `t = ${lab(s1 - s2, 'L head start')} ÷ ${lab(r2 - r1, 'L per min catch-up')} = ${lab(t, 'minutes')}.`],
  });
  return typed(q);
}

function craneRentalStep(rng: Rng): AskStep {
  const H = rint(rng, 2, 10); const h2 = pick(rng, [10, 15, 20, 25]); const h1 = h2 + pick(rng, [5, 10, 15]); const f1 = pick(rng, [20, 40, 60]); const f2 = f1 + (h1 - h2) * H;
  const q = mkq(S(K1), 'crane-rental', {
    prompt: `Crane A costs $${f1} plus $${h1} per hour. Crane B costs $${f2} plus $${h2} per hour. After how many hours do they cost the same?`,
    expression: `A: $${f1} + $${h1}/h  ·  B: $${f2} + $${h2}/h`,
    answer: H, unit: 'h',
    hint: 'Each cost is fee + rate × hours. Set the two costs equal and balance.',
    steps: [`A = ${lab(f1, 'dollars fee')} + ${lab(h1, 'dollars per hour')} × h (hours). B = ${lab(f2, 'dollars fee')} + ${lab(h2, 'dollars per hour')} × h.`, `Same cost: ${f1} + ${h1}h = ${f2} + ${h2}h.`, `Subtract ${h2}h: ${lab(f1, 'fee A')} + ${h1 - h2}h = ${lab(f2, 'fee B')}, where ${lab(h1 - h2, 'dollars per hour')} is A's extra rate.`, `Subtract ${lab(f1, 'fee A')}: ${h1 - h2}h = ${lab(f2 - f1, 'dollars fee gap')}.`, `h = ${lab(f2 - f1, 'fee gap')} ÷ ${lab(h1 - h2, 'extra dollars per hour')} = ${lab(H, 'hours')}.`],
  });
  return typed(q);
}

/** k1(x + p) ± e·x = k2(x + q): brackets on both sides and like terms to combine; either net x-coefficient may be negative. */
function multiStepParams(rng: Rng) {
  for (let g = 0; g < 80; g++) {
    const x = rnz(rng, -5, 5); const k1 = pick(rng, [2, 3, 4, -2, -3]); const p = rnz(rng, -5, 5); const e = pick(rng, [1, 2, 3, -1, -2]);
    const k2 = pick(rng, [2, 3, 4, -2]); const a = k1 + e; const b = k1 * p;
    if (a === 0 || a === k2) continue;
    const num = (a - k2) * x + b; if (num % k2 !== 0) continue;
    const q = num / k2; if (q === 0 || Math.abs(q) > 9) continue;
    return { x, k1, p, e, k2, q, a, b, c: k2, d: k2 * q };
  }
  return { x: 8, k1: 3, p: -2, e: 1, k2: 2, q: 5, a: 4, b: -6, c: 2, d: 10 };
}
const multiText = (k1: number, p: number, e: number, k2: number, q: number) => `${fmt(k1)}(${lin(1, p)}) ${e < 0 ? '−' : '+'} ${coefTerm(Math.abs(e), 'x')} = ${fmt(k2)}(${lin(1, q)})`;

function multiStepBalanceStep(rng: Rng): AskStep {
  const { x, k1, p, e, k2, q: qq, a, b, c, d } = multiStepParams(rng);
  const q = mkq(S(K1), 'multi-step-balance', {
    prompt: 'The pump rule has brackets on both sides. Tidy each side, then balance to find x.',
    expression: multiText(k1, p, e, k2, qq),
    answer: x,
    hint: 'Distribute on each side, then combine the x-terms on the left. Only then start balancing.',
    steps: [`Distribute: ${lin(k1, k1 * p)} ${e < 0 ? '−' : '+'} ${coefTerm(Math.abs(e), 'x')} = ${lin(k2, k2 * qq)}.`, `Combine like terms: ${lin(a, b)} = ${lin(c, d)}.`, ...solveLines(a, b, c, d), `Check: both sides equal ${fmt(a * x + b)}.`],
  });
  return model(q, { kind: 'balance', a, b, c, d, label: `Tidied: ${lin(a, b)} = ${lin(c, d)}` }, [String(x)], 'The scale shows each side distributed and combined. Balance it until x stands alone.');
}

function multiStepTypedStep(rng: Rng): AskStep {
  const { x, k1, p, e, k2, q: qq, a, b, c, d } = multiStepParams(rng);
  return typed(mkq(S(K1), 'multi-step-typed', {
    prompt: 'Solve for x.',
    expression: multiText(k1, p, e, k2, qq),
    answer: x,
    hint: 'Distribute both brackets, combine like terms on each side, then gather x on one side.',
    steps: [`Distribute: ${lin(k1, k1 * p)} ${e < 0 ? '−' : '+'} ${coefTerm(Math.abs(e), 'x')} = ${lin(k2, k2 * qq)}.`, `Combine like terms: ${lin(a, b)} = ${lin(c, d)}.`, ...solveLines(a, b, c, d)],
  }));
}

/** (n/dn)x + b = c·x + e: clear the fraction first by multiplying EVERY term by dn. */
function fracCoefStep(rng: Rng): AskStep {
  let n = 1; let dn = 2; let b = 3; let c = 1; let e = -1; let x = 8;
  for (let g = 0; g < 40; g++) {
    dn = pick(rng, [2, 3, 4]); n = dn === 3 ? pick(rng, [1, 2]) : dn === 4 ? pick(rng, [1, 3]) : 1;
    x = dn * rnz(rng, -3, 3); b = rnz(rng, -8, 8); c = pick(rng, [1, 2, -1]);
    e = (n * x) / dn + b - c * x;
    if (e !== 0 && Math.abs(e) <= 20) break;
  }
  const q = mkq(S(K1), 'fraction-coefficient', {
    prompt: 'Solve for x. Clear the fraction first.',
    expression: `${fracTerm(n, dn)} ${fmtSigned(b)} = ${lin(c, e)}`,
    answer: x,
    hint: `Multiply EVERY term on both sides by ${dn}, so no fractions are left. Then balance as usual.`,
    steps: [`Multiply every term by ${lab(dn, 'denominator')}: ${lin(n, dn * b)} = ${lin(dn * c, dn * e)}.`, ...solveLines(n, dn * b, dn * c, dn * e), `Check: both sides equal ${fmt((n * x) / dn + b)}.`],
  });
  return typed(q);
}

/** The x-terms cancel: a false statement left means no solution; a true one means every x works. */
function sameCoefStep(rng: Rng): AskStep {
  const none = rng.next() < 0.5; const k = pick(rng, [2, 3, 4, 5]); const p = rnz(rng, -6, 6);
  const shift = none ? pick(rng, [-3, -2, -1, 1, 2, 3]) : 0;
  const bracket = rng.next() < 0.6;
  let expr: string; let lhs: [number, number]; let rhs: [number, number]; let first: string;
  if (bracket) {
    lhs = [k, k * p]; rhs = [k, k * p + shift];
    expr = `${fmt(k)}(${lin(1, p)}) = ${lin(k, k * p + shift)}`;
    first = `Distribute: ${lin(k, k * p)} = ${lin(k, k * p + shift)}.`;
  } else {
    const a1 = k + rint(rng, 1, 3); const a2 = a1 - k; const b1 = k * p;
    lhs = [k, b1]; rhs = [k, b1 + shift];
    expr = `${lin(a1, b1)} − ${coefTerm(a2, 'x')} = ${lin(k, b1 + shift)}`;
    first = `Combine like terms: ${coefTerm(a1, 'x')} − ${coefTerm(a2, 'x')} = ${coefTerm(k, 'x')}, so ${lin(k, b1)} = ${lin(k, b1 + shift)}.`;
  }
  const noneT = 'No solution'; const allT = 'Every x is a solution';
  const right = none ? noneT : allT;
  const q = mkq(S(K1), 'how-many-solutions', {
    prompt: 'Solve. How many values of x balance the scale?',
    expression: expr,
    answer: 0,
    hint: 'Tidy both sides, then take the x-term off both pans. Look at what is left: is it true or false?',
    steps: [first, `Subtract ${coefTerm(k, 'x')} from both sides: ${fmt(lhs[1])} = ${fmt(rhs[1])}.`, none ? `${fmt(lhs[1])} = ${fmt(rhs[1])} is false whatever x is, so no x works: no solution.` : `${fmt(lhs[1])} = ${fmt(rhs[1])} is true whatever x is, so every x works: infinitely many solutions.`],
  });
  return choose(rng, q, right, [none ? allT : noneT, 'Only x = 0', `Only x = ${fmt(Math.abs(shift) || 1)}`]);
}

/* ================================================================================================
 * 2. Literal equations and formulas
 * ============================================================================================== */
const K2 = 'formulas';
interface Rearr { f: string; target: string; right: string; wrongs: string[]; steps: string[] }
const REARRANGE: Rearr[] = [
  { f: 'V = IR', target: 'I', right: 'I = V/R', wrongs: ['I = VR', 'I = R/V', 'I = V − R'], steps: ['R multiplies I, so divide both sides by R.', 'I = V/R.'] },
  { f: 'V = IR', target: 'R', right: 'R = V/I', wrongs: ['R = VI', 'R = I/V', 'R = V − I'], steps: ['I multiplies R, so divide both sides by I.', 'R = V/I.'] },
  { f: 'd = rt', target: 't', right: 't = d/r', wrongs: ['t = dr', 't = r/d', 't = d − r'], steps: ['r multiplies t, so divide both sides by r.', 't = d/r.'] },
  { f: 'F = ma', target: 'a', right: 'a = F/m', wrongs: ['a = Fm', 'a = m/F', 'a = F − m'], steps: ['m multiplies a, so divide both sides by m.', 'a = F/m.'] },
  { f: 'P = 2l + 2w', target: 'l', right: 'l = (P − 2w)/2', wrongs: ['l = P/2 − 2w', 'l = (P + 2w)/2', 'l = 2(P − 2w)'], steps: ['Subtract 2w from both sides: P − 2w = 2l.', 'Divide the WHOLE side by 2: l = (P − 2w)/2.'] },
  { f: 'P = 2l + 2w', target: 'w', right: 'w = (P − 2l)/2', wrongs: ['w = P/2 − 2l', 'w = (P + 2l)/2', 'w = 2(P − 2l)'], steps: ['Subtract 2l from both sides: P − 2l = 2w.', 'Divide the WHOLE side by 2: w = (P − 2l)/2.'] },
  { f: 'v = u + at', target: 'a', right: 'a = (v − u)/t', wrongs: ['a = v/t − u', 'a = (v + u)/t', 'a = t(v − u)'], steps: ['Subtract u from both sides: v − u = at.', 'Divide both sides by t: a = (v − u)/t.'] },
  { f: 'y = mx + b', target: 'x', right: 'x = (y − b)/m', wrongs: ['x = y/m − b', 'x = (y + b)/m', 'x = m(y − b)'], steps: ['Subtract b from both sides: y − b = mx.', 'Divide both sides by m: x = (y − b)/m.'] },
  { f: 'P = IV', target: 'V', right: 'V = P/I', wrongs: ['V = PI', 'V = I/P', 'V = P − I'], steps: ['I multiplies V, so divide both sides by I.', 'V = P/I.'] },
  { f: 'C = 2πr', target: 'r', right: 'r = C/(2π)', wrongs: ['r = 2πC', 'r = 2π/C', 'r = C − 2π'], steps: ['2π multiplies r, so divide both sides by 2π.', 'r = C/(2π).'] },
  { f: 'Q = mcΔT', target: 'ΔT', right: 'ΔT = Q/(mc)', wrongs: ['ΔT = Qmc', 'ΔT = mc/Q', 'ΔT = Q − mc'], steps: ['m and c multiply ΔT, so divide both sides by mc.', 'ΔT = Q/(mc).'] },
];

function rearrangeStep(rng: Rng): AskStep {
  const r = pick(rng, REARRANGE);
  const q = mkq(S(K2), 'rearrange', {
    prompt: `Rearrange the formula to get ${r.target} alone.`,
    expression: `${r.f}   ${r.target} = ?`,
    answer: 0,
    hint: 'Treat the other letters like numbers. Undo + and − first, then × and ÷, always to the WHOLE side.',
    steps: r.steps,
    app: 'Engineers rearrange one formula many ways instead of memorising each version.',
  });
  return choose(rng, q, r.right, r.wrongs);
}

function formulaPlugStep(rng: Rng): AskStep {
  const kind = rint(rng, 0, 5);
  let o: { prompt: string; expression: string; answer: number; unit: string; hint: string; steps: string[] };
  if (kind === 0) { const I = rint(rng, 2, 6); const R = rint(rng, 2, 12); const V = I * R; o = { prompt: `A lamp runs on ${V} V and draws ${I} A. Find its resistance.`, expression: 'V = IR,  R = ?', answer: R, unit: 'Ω', hint: 'Get R alone first: I multiplies R, so divide by I.', steps: ['R = V/I.', `R = ${lab(V, 'volts')} ÷ ${lab(I, 'amps')} = ${lab(R, 'ohms')}.`] }; }
  else if (kind === 1) { const I = rint(rng, 2, 8); const R = rint(rng, 2, 9); const V = I * R; o = { prompt: `A heater has resistance ${R} Ω on a ${V} V line. What current flows?`, expression: 'V = IR,  I = ?', answer: I, unit: 'A', hint: 'Get I alone first: R multiplies I, so divide by R.', steps: ['I = V/R.', `I = ${lab(V, 'volts')} ÷ ${lab(R, 'ohms')} = ${lab(I, 'amps')}.`] }; }
  else if (kind === 2) { const r = pick(rng, [40, 45, 50, 60, 80]); const t = rint(rng, 2, 6); const d = r * t; o = { prompt: `A barge travels ${d} km at ${r} km/h. How many hours does it take?`, expression: 'd = rt,  t = ?', answer: t, unit: 'h', hint: 'Get t alone first: r multiplies t, so divide by r.', steps: ['t = d/r.', `t = ${lab(d, 'km')} ÷ ${lab(r, 'km per hour')} = ${lab(t, 'hours')}.`] }; }
  else if (kind === 3) { const m = rint(rng, 2, 12); const a = rint(rng, 2, 8); const F = m * a; o = { prompt: `A ${m} kg cart is pushed with ${F} N. Find its acceleration.`, expression: 'F = ma,  a = ?', answer: a, unit: 'm/s²', hint: 'Get a alone first: m multiplies a, so divide by m.', steps: ['a = F/m.', `a = ${lab(F, 'newtons')} ÷ ${lab(m, 'kg')} = ${lab(a, 'm/s²')}.`] }; }
  else if (kind === 4) { const w = rint(rng, 3, 12); const l = w + rint(rng, 1, 10); const Pm = 2 * l + 2 * w; o = { prompt: `A fence around a rectangular pad uses ${Pm} m. The pad is ${w} m wide. How long is it?`, expression: 'P = 2l + 2w,  l = ?', answer: l, unit: 'm', hint: 'Subtract 2w first, then divide the whole side by 2.', steps: ['l = (P − 2w)/2.', `l = (${lab(Pm, 'm of fence')} − ${lab(2 * w, 'm, both widths')}) ÷ 2 = ${lab(Pm - 2 * w, 'm, both lengths')} ÷ 2 = ${lab(l, 'length in m')}.`] }; }
  else { const u = rint(rng, 1, 10); const a = rint(rng, 2, 5); const t = rint(rng, 2, 8); const v = u + a * t; o = { prompt: `A cart speeds up from ${u} m/s to ${v} m/s in ${t} s. Find its acceleration.`, expression: 'v = u + at,  a = ?', answer: a, unit: 'm/s²', hint: 'Subtract u first, then divide by t.', steps: ['a = (v − u)/t.', `a = (${lab(v, 'final m/s')} − ${lab(u, 'start m/s')}) ÷ ${lab(t, 'seconds')} = ${lab(v - u, 'm/s gained')} ÷ ${lab(t, 'seconds')} = ${lab(a, 'm/s²')}.`] }; }
  return typed(mkq(S(K2), 'plug', { ...o, app: 'Rearrange first, then plug in: fewer arithmetic slips.' }));
}

function formulaTableStep(rng: Rng): AskStep {
  const ohm = rng.next() < 0.5;
  const rows: (number | null)[][] = []; const ans: number[] = [];
  for (let i = 0; i < 3; i++) {
    if (ohm) { const I = rint(rng, 2, 5); const R = rint(rng, 2, 10); rows.push([I * R, I, null]); ans.push(R); }
    else { const r = pick(rng, [20, 30, 40, 50, 60]); const t = rint(rng, 2, 5); rows.push([r * t, r, null]); ans.push(t); }
  }
  const q = mkq(S(K2), 'formula-table', {
    prompt: ohm ? "Volt's test bench: fill the resistance column." : 'The barge log is missing the travel times. Fill them in.',
    expression: ohm ? 'V = IR,  so R = V/I' : 'd = rt,  so t = d/r',
    answer: ans[0],
    hint: ohm ? 'Divide each voltage by its current.' : 'Divide each distance by its speed.',
    steps: [ohm ? 'Rearranged: R = V/I.' : 'Rearranged: t = d/r.', ...rows.map((r, i) => (ohm ? `${lab(r[0]!, 'volts')} ÷ ${lab(r[1]!, 'amps')} = ${lab(ans[i], 'ohms')}` : `${lab(r[0]!, 'km')} ÷ ${lab(r[1]!, 'km per hour')} = ${lab(ans[i], 'hours')}`))],
  });
  return model(q, { kind: 'table', cols: ohm ? ['V (volts)', 'I (amps)', 'R (ohms)'] : ['d (km)', 'r (km/h)', 't (h)'], rows, label: ohm ? 'R = V/I' : 't = d/r' }, [ans.join(',')], 'Fill each blank using the rearranged formula.');
}

function formulaBalanceStep(rng: Rng): AskStep {
  const kind = rint(rng, 0, 3);
  let spec: { a: number; b: number; d: number; v: string; prompt: string; expr: string; ans: number; unit: string; steps: string[] };
  if (kind === 0) { const w = rint(rng, 2, 9); const l = w + rint(rng, 1, 8); const Pm = 2 * l + 2 * w; spec = { a: 2, b: 2 * w, d: Pm, v: 'l', prompt: `P = 2l + 2w. A frame has perimeter ${Pm} cm and width ${w} cm. Balance to find l.`, expr: `2l + ${2 * w} = ${Pm}`, ans: l, unit: 'cm',
    steps: [`Subtract ${lab(2 * w, 'cm, both widths')} from both sides: 2l = ${lab(Pm - 2 * w, 'cm, both lengths')}.`, `Divide both sides by 2 (lengths): l = ${lab(l, 'length in cm')}.`] }; }
  else if (kind === 1) { const u = rint(rng, 1, 9); const t = rint(rng, 2, 6); const acc = rint(rng, 2, 5); const v = u + acc * t; spec = { a: t, b: u, d: v, v: 'a', prompt: `v = u + at with u = ${u} m/s, t = ${t} s and v = ${v} m/s. Balance to find a.`, expr: `${u} + ${t}a = ${v}`, ans: acc, unit: 'm/s²',
    steps: [`Subtract ${lab(u, 'start m/s')} from both sides: ${t}a = ${lab(v - u, 'm/s gained')}.`, `Divide both sides by ${lab(t, 'seconds')}: a = ${lab(acc, 'm/s²')}.`] }; }
  else if (kind === 2) { const m = rint(rng, 2, 9); const acc = rint(rng, 2, 9); spec = { a: m, b: 0, d: m * acc, v: 'a', prompt: `F = ma. A ${m} kg load feels ${m * acc} N. Balance to find a.`, expr: `${m}a = ${m * acc}`, ans: acc, unit: 'm/s²',
    steps: [`Divide both sides by ${lab(m, 'kg')}: a = ${lab(m * acc, 'newtons')} ÷ ${lab(m, 'kg')} = ${lab(acc, 'm/s²')}.`] }; }
  else { const I = rint(rng, 2, 6); const R = rint(rng, 2, 12); spec = { a: I, b: 0, d: I * R, v: 'R', prompt: `V = IR. ${I} A flows on a ${I * R} V line. Balance to find R.`, expr: `${I}R = ${I * R}`, ans: R, unit: 'Ω',
    steps: [`Divide both sides by ${lab(I, 'amps')}: R = ${lab(I * R, 'volts')} ÷ ${lab(I, 'amps')} = ${lab(R, 'ohms')}.`] }; }
  const q = mkq(S(K2), 'formula-balance', {
    prompt: spec.prompt, expression: spec.expr, answer: spec.ans, unit: spec.unit,
    hint: 'A formula is an equation: undo the addition first, then the multiplication, on both sides.',
    steps: spec.steps,
  });
  return model(q, { kind: 'balance', a: spec.a, b: spec.b, c: 0, d: spec.d, variable: spec.v }, [String(spec.ans)], `Balance until ${spec.v} stands alone.`);
}

function fixErrorStep(rng: Rng): AskStep {
  const k = rint(rng, 0, 2);
  const v = [
    { who: 'Rita', f: 'P = 2l + 2w', wrote: 'l = P/2 − 2w', right: 'She divided only P by 2', wrongs: ['She should multiply by 2', 'She should add 2w', 'Nothing: it is correct'], fix: 'Subtract 2w, then divide ALL of P − 2w by 2: l = (P − 2w)/2.' },
    { who: 'Kai', f: 'V = IR', wrote: 'R = V − I', right: 'He must divide by I', wrongs: ['He should add I', 'He should multiply by I', 'Nothing: it is correct'], fix: 'I multiplies R, so undo it by dividing: R = V/I.' },
    { who: 'Sam', f: 'd = rt', wrote: 't = r/d', right: 'The fraction is upside down', wrongs: ['It should be t = dr', 'It should be t = d − r', 'Nothing: it is correct'], fix: 'Divide both sides by r: t = d/r, not r/d.' },
  ][k];
  const q = mkq(S(K2), 'fix-error', {
    prompt: `${v.who} solved ${v.f} and wrote ${v.wrote}. What went wrong?`,
    expression: `${v.f}  →  ${v.wrote} ?`,
    answer: 0,
    hint: 'Put small numbers into both versions and see if they agree.',
    steps: [v.fix],
  });
  return choose(rng, q, v.right, v.wrongs);
}

function tempStep(rng: Rng): AskStep {
  const C = pick(rng, [-40, -10, 0, 10, 20, 25, 30, 35, 40, 100]); const F = (9 * C) / 5 + 32;
  const q = mkq(S(K2), 'temperature', {
    prompt: `The reactor log reads ${fmt(F)} °F. Rearrange F = (9/5)C + 32 to find C.`,
    expression: 'F = (9/5)C + 32,  C = ?',
    answer: C, unit: '°C',
    hint: 'Undo the + 32 first, then undo × 9/5 by multiplying by 5/9.',
    steps: ['C = (5/9)(F − 32).', `C = (5/9)(${lab(fmt(F), 'degrees F')} − ${lab(32, 'freezing point in F')}) = (5/9)(${lab(fmt(F - 32), 'F degrees above freezing')}) = ${lab(fmt(C), 'degrees C')}.`],
  });
  return typed(q);
}

function densityStep(rng: Rng): AskStep {
  const rho = pick(rng, [2, 3, 7, 8]); const V = rint(rng, 5, 20);
  const q = mkq(S(K2), 'density', {
    prompt: `A metal part has density ${rho} g/cm³ and volume ${V} cm³. Use ρ = m/V to find its mass.`,
    expression: 'ρ = m/V,  m = ?',
    answer: rho * V, unit: 'g',
    hint: 'V divides m, so multiply both sides by V to get m alone.',
    steps: ['m = ρV.', `m = ${lab(rho, 'g per cm³')} × ${lab(V, 'cm³')} = ${lab(rho * V, 'grams')}.`],
  });
  return typed(q);
}

/* ================================================================================================
 * 3. Inequalities
 * ============================================================================================== */
const K3 = 'inequalities';
const FLIP: Record<string, string> = { '<': '>', '>': '<', '≤': '≥', '≥': '≤' };
const IOPS = ['<', '≤', '>', '≥'];
interface Ineq { a: number; b: number; c: number; op: string; k: number; sol: string; text: string }
function ineqParams(rng: Rng, neg?: boolean): Ineq {
  const isNeg = neg ?? rng.next() < 0.6;
  const a = isNeg ? -rint(rng, 2, 5) : rint(rng, 2, 5); const k = rnz(rng, -6, 6); const b = rnz(rng, -9, 9); const op = pick(rng, IOPS); const c = a * k + b;
  return { a, b, c, op, k, sol: a < 0 ? FLIP[op] : op, text: `${lin(a, b)} ${op} ${fmt(c)}` };
}
function ineqLines(i: Ineq): string[] {
  const out: string[] = [];
  out.push(`${i.b > 0 ? `Subtract ${fmt(i.b)} from` : `Add ${fmt(-i.b)} to`} both sides: ${coefTerm(i.a, 'x')} ${i.op} ${fmt(i.c - i.b)}.`);
  out.push(i.a < 0 ? `Divide by ${fmt(i.a)}. Dividing by a negative flips the sign: x ${i.sol} ${fmt(i.k)}.` : `Divide by ${fmt(i.a)} (positive, so the sign stays): x ${i.sol} ${fmt(i.k)}.`);
  return out;
}
/** The integer answer to "smallest/largest integer that works". */
const edgeInt = (i: Ineq) => (i.sol === '>' ? i.k + 1 : i.sol === '<' ? i.k - 1 : i.k);

function flipStep(rng: Rng): AskStep {
  const i = ineqParams(rng, rng.next() < 0.8);
  const right = `x ${i.sol} ${fmt(i.k)}`;
  const q = mkq(S(K3), 'flip', {
    prompt: 'The coolant reading must stay in range. Solve for x.',
    expression: i.text,
    answer: 0,
    hint: i.a < 0 ? 'Undo the constant, then divide. Think about what dividing by a negative does to the order.' : 'Undo the constant, then divide both sides.',
    steps: ineqLines(i),
  });
  return choose(rng, q, right, [`x ${FLIP[i.sol]} ${fmt(i.k)}`, `x ${i.sol} ${fmt(-i.k)}`, `x ${i.sol} ${fmt(i.c - i.b)}`, `x ${FLIP[i.sol]} ${fmt(-i.k)}`]);
}

function edgeNumberlineStep(rng: Rng): AskStep {
  const i = ineqParams(rng);
  const e = edgeInt(i); const small = i.sol === '>' || i.sol === '≥';
  const q = mkq(S(K3), 'edge-integer', {
    prompt: `Solve, then tap the ${small ? 'smallest' : 'largest'} integer that works.`,
    expression: i.text,
    answer: e,
    hint: 'Solve first. Then ask: is the boundary itself allowed (≤, ≥) or not (<, >)?',
    steps: [...ineqLines(i), i.sol === '≥' || i.sol === '≤' ? `${fmt(i.k)} itself is allowed, so the answer is ${fmt(e)}.` : `${fmt(i.k)} itself is not allowed, so the ${small ? 'smallest' : 'largest'} integer is ${fmt(e)}.`],
  });
  return model(q, { kind: 'numberline', start: 0, min: -10, max: 10, label: `Tap the ${small ? 'smallest' : 'largest'} integer that works` }, [String(e)], `Solve, then tap the ${small ? 'smallest' : 'largest'} integer solution.`);
}

function largestIntegerStep(rng: Rng): AskStep {
  const i = ineqParams(rng);
  const e = edgeInt(i); const small = i.sol === '>' || i.sol === '≥';
  const q = mkq(S(K3), 'edge-typed', {
    prompt: `What is the ${small ? 'smallest' : 'largest'} integer x that works?`,
    expression: i.text,
    answer: e,
    hint: 'Solve first, then decide if the boundary itself is allowed.',
    steps: [...ineqLines(i), `So the ${small ? 'smallest' : 'largest'} integer is ${fmt(e)}.`],
  });
  return typed(q);
}

const rayV = (k: number, dir: 'left' | 'right', open: boolean): Visual => ({ type: 'numline', min: -8, max: 8, step: 1, ray: { from: k, dir, open } });
function ineqGraphPickStep(rng: Rng, solve = false): AskStep {
  const i = ineqParams(rng, solve ? true : rng.next() < 0.3);
  const dir: 'left' | 'right' = i.sol === '>' || i.sol === '≥' ? 'right' : 'left'; const open = i.sol === '<' || i.sol === '>';
  const other = dir === 'right' ? 'left' : 'right';
  const vis = [rayV(i.k, dir, open), rayV(i.k, dir, !open), rayV(i.k, other, open), rayV(i.k, other, !open)];
  const q = mkq(S(K3), 'graph-ineq', {
    prompt: solve ? 'Solve, then pick the number line that shows every solution.' : 'Pick the number line that shows every solution.',
    expression: solve ? i.text : `x ${i.sol} ${fmt(i.k)}`,
    answer: 0,
    hint: 'Open dot: the boundary is not included (< or >). Closed dot: it is (≤ or ≥). Then shade the side that works.',
    steps: [...(solve ? ineqLines(i) : []), `x ${i.sol} ${fmt(i.k)}: ${open ? 'open' : 'closed'} dot at ${fmt(i.k)}, shaded to the ${dir}.`],
  });
  return pickLettered(rng, q, vis, 0, 'Line');
}

function compoundParams(rng: Rng) {
  const a = pick(rng, [2, 3]); const lo = rint(rng, -5, 2); const hi = lo + rint(rng, 2, 5); const b = rnz(rng, -6, 6);
  const lop = pick(rng, ['<', '≤']); const rop = pick(rng, ['<', '≤']);
  return { a, lo, hi, b, lop, rop, L: a * lo + b, R: a * hi + b };
}
function compoundStep(rng: Rng): AskStep {
  const { a, lo, hi, b, lop, rop, L, R } = compoundParams(rng);
  const right = `${fmt(lo)} ${lop} x ${rop} ${fmt(hi)}`;
  const wr = [`${fmt(L - b)} ${lop} x ${rop} ${fmt(R - b)}`, `${fmt(lo)} ${lop === '<' ? '≤' : '<'} x ${rop === '<' ? '≤' : '<'} ${fmt(hi)}`, `x < ${fmt(lo)} or x > ${fmt(hi)}`];
  if ((L + b) % a === 0 && (R + b) % a === 0) wr.push(`${fmt((L + b) / a)} ${lop} x ${rop} ${fmt((R + b) / a)}`);
  const q = mkq(S(K3), 'compound', {
    prompt: 'The sensor must stay in its safe band. Solve for x.',
    expression: `${fmt(L)} ${lop} ${lin(a, b)} ${rop} ${fmt(R)}`,
    answer: 0,
    hint: 'Do the same move to all THREE parts: the left end, the middle and the right end.',
    steps: [`${b > 0 ? `Subtract ${b} from` : `Add ${-b} to`} all three parts: ${fmt(L - b)} ${lop} ${a}x ${rop} ${fmt(R - b)}.`, `Divide all three parts by ${a}: ${right}.`],
  });
  return choose(rng, q, right, wr);
}

function compoundPickStep(rng: Rng): AskStep {
  const { lo, hi, lop, rop } = compoundParams(rng);
  const oL = lop === '<'; const oR = rop === '<';
  const seg = (l: boolean, r: boolean): Visual => ({ type: 'numline', min: -8, max: 8, step: 1, segment: { from: lo, to: hi, openLeft: l, openRight: r } });
  const vis = [seg(oL, oR), seg(!oL, !oR), oL === oR ? seg(oL, !oR) : seg(!oL, oR), rayV(lo, 'right', oL)];
  const q = mkq(S(K3), 'compound-graph', {
    prompt: 'Which number line shows the safe band?',
    expression: `${fmt(lo)} ${lop} x ${rop} ${fmt(hi)}`,
    answer: 0,
    hint: 'Both conditions at once: a piece between two ends. Check each end: open for <, closed for ≤.',
    steps: [`x is between ${fmt(lo)} and ${fmt(hi)}: a segment, not a ray.`, `${oL ? 'Open' : 'Closed'} dot at ${fmt(lo)}, ${oR ? 'open' : 'closed'} dot at ${fmt(hi)}.`],
  });
  return pickLettered(rng, q, vis, 0, 'Line');
}

/** An OR compound: a·x + b below one value OR above another. Two rays pointing away from each other. */
function orCompoundStep(rng: Rng): AskStep {
  const { a, lo, hi, b, L, R } = compoundParams(rng);
  const lop = pick(rng, ['<', '≤']); const rop = FLIP[pick(rng, ['<', '≤'])];
  const right = `x ${lop} ${fmt(lo)} or x ${rop} ${fmt(hi)}`;
  const q = mkq(S(K3), 'or-compound', {
    prompt: 'The alarm sounds when the reading is too low OR too high. Solve for x.',
    expression: `${lin(a, b)} ${lop} ${fmt(L)}  or  ${lin(a, b)} ${rop} ${fmt(R)}`,
    answer: 0,
    hint: 'Solve each piece on its own, the same way. OR means either piece is enough.',
    steps: [`Left piece: ${coefTerm(a, 'x')} ${lop} ${fmt(L - b)}, so x ${lop} ${fmt(lo)}.`, `Right piece: ${coefTerm(a, 'x')} ${rop} ${fmt(R - b)}, so x ${rop} ${fmt(hi)}.`, `${right}: two rays pointing away from each other, not a band.`],
  });
  return choose(rng, q, right, [`${fmt(lo)} ${lop} x ${FLIP[rop]} ${fmt(hi)}`, `x ${FLIP[lop]} ${fmt(lo)} or x ${FLIP[rop]} ${fmt(hi)}`, `x ${lop} ${fmt(L - b)} or x ${rop} ${fmt(R - b)}`]);
}

function ineqTestPointStep(rng: Rng): AskStep {
  const i = ineqParams(rng, true);
  const up = i.sol === '>' || i.sol === '≥'; const strict = i.sol === '<' || i.sol === '>'; const s = up ? 1 : -1;
  const right = fmt(i.k + s * rint(rng, 1, 3));
  const wr = [fmt(i.k - s), fmt(i.k - 3 * s), strict ? fmt(i.k) : fmt(i.k - 5 * s)];
  const q = mkq(S(K3), 'test-point', {
    prompt: 'Which gauge reading x makes this true?',
    expression: i.text,
    answer: Number(right.replace('−', '-')),
    answerText: right,
    hint: 'Solve it first (watch the sign when dividing by a negative), or substitute each value and check.',
    steps: [...ineqLines(i), `Only ${right} is ${strict ? '' : 'at or '}${up ? 'above' : 'below'} ${fmt(i.k)}.`],
  });
  return choose(rng, q, right, wr);
}

/** k(x + p) op e·x + f with e > k: after gathering, the x-coefficient is negative, so the sign flips when dividing. */
function ineqBothParams(rng: Rng) {
  const K = rnz(rng, -6, 6); const k = pick(rng, [2, 3, 4]); const t = rint(rng, 1, 4); const e = k + t; const p = rnz(rng, -5, 5); const op = pick(rng, IOPS);
  const f = k * p - t * K;
  return { K, k, t, e, p, op, f, sol: FLIP[op] };
}

function ineqBothSidesStep(rng: Rng): AskStep {
  const { K, k, t, e, p, op, f, sol } = ineqBothParams(rng);
  const right = `x ${sol} ${fmt(K)}`;
  const q = mkq(S(K3), 'both-sides', {
    prompt: 'The interlock limit has x on both sides. Solve for x.',
    expression: `${fmt(k)}(${lin(1, p)}) ${op} ${lin(e, f)}`,
    answer: 0,
    hint: 'Distribute, gather the x-terms on the left, then undo the constant. Watch the sign of the x-coefficient before you divide.',
    steps: [`Distribute: ${lin(k, k * p)} ${op} ${lin(e, f)}.`, `Subtract ${coefTerm(e, 'x')} from both sides: ${lin(-t, k * p)} ${op} ${fmt(f)}. Subtracting from both sides never flips the sign.`, `${k * p > 0 ? `Subtract ${fmt(k * p)} from` : `Add ${fmt(-k * p)} to`} both sides: ${coefTerm(-t, 'x')} ${op} ${fmt(f - k * p)}.`, `Divide by ${fmt(-t)}, a negative, so flip the sign: x ${sol} ${fmt(K)}.`],
  });
  return choose(rng, q, right, [`x ${op} ${fmt(K)}`, `x ${sol} ${fmt(-K)}`, `x ${op} ${fmt(-K)}`, `x ${sol} ${fmt(f - k * p)}`]);
}

/** −x/d + b op c: multiplying both sides by −d flips the sign. */
function ineqMultNegStep(rng: Rng): AskStep {
  const d = pick(rng, [2, 3, 4]); const m = rnz(rng, -4, 4); const b = rnz(rng, -6, 6); const op = pick(rng, IOPS);
  const c = m + b; const K = -d * m; const sol = FLIP[op];
  const right = `x ${sol} ${fmt(K)}`;
  const q = mkq(S(K3), 'multiply-negative', {
    prompt: 'Solve the gain limit for x.',
    expression: `−x/${d} ${fmtSigned(b)} ${op} ${fmt(c)}`,
    answer: 0,
    hint: `Undo the constant first. Then undo "÷ (−${d})" by multiplying both sides by −${d}. What does multiplying by a negative do to the order?`,
    steps: [`${b > 0 ? `Subtract ${b} from` : `Add ${-b} to`} both sides: −x/${d} ${op} ${fmt(m)}.`, `Multiply both sides by −${d}, a negative, so flip the sign: x ${sol} ${fmt(K)}.`],
  });
  return choose(rng, q, right, [`x ${op} ${fmt(K)}`, `x ${sol} ${fmt(-K)}`, `x ${op} ${fmt(-K)}`]);
}

/** 'v ≤ num ÷ den ≈ 9.77' (or '= 9' when it divides exactly), never rounding up past the next whole number. */
function quotBound(v: string, num: number, den: number, numL: string, denL: string, outL: string): string {
  const N = lab(num, numL); const D = lab(den, denL);
  if (num % den === 0) return `${v} ≤ ${N} ÷ ${D} = ${lab(num / den, outL)}`;
  const whole = Math.floor(num / den);
  for (const dp of [2, 3, 4]) { const r = Math.round((num / den) * 10 ** dp) / 10 ** dp; if (r < whole + 1) return `${v} ≤ ${N} ÷ ${D} ≈ ${lab(fmt(r), outL)}`; }
  return `${v} ≤ ${N} ÷ ${D}`;
}

function ineqWordStep(rng: Rng): AskStep {
  const n = rint(rng, 4, 15); const w = pick(rng, [120, 150, 180, 250]); const h = pick(rng, [100, 200, 300]); const M = h + w * n + rint(rng, 0, w - 1);
  const q = mkq(S(K3), 'crane-limit', {
    prompt: `A crane lifts at most ${M} kg. Its hook weighs ${h} kg and each beam ${w} kg. How many beams can it lift at once?`,
    expression: `hook ${h} kg  ·  beam ${w} kg each  ·  limit ${M} kg`,
    answer: n, unit: 'beams',
    hint: 'The hook plus all the beams must be at most the limit. Solve for the number of beams, then think about whole beams.',
    steps: [`Hook + n beams ≤ limit: ${lab(h, 'kg hook')} + ${lab(w, 'kg per beam')} × n (beams) ≤ ${lab(M, 'kg limit')}.`, `Subtract ${lab(h, 'kg hook')}: ${w}n ≤ ${lab(M - h, 'kg left for beams')}.`, `${quotBound('n', M - h, w, 'kg left', 'kg per beam', 'beams')}. Beams come whole, so round DOWN: at most ${lab(n, 'beams')}.`],
  });
  return typed(q);
}

function budgetStep(rng: Rng): AskStep {
  const n = rint(rng, 3, 12); const r = pick(rng, [15, 20, 25, 40]); const f = pick(rng, [30, 50, 80]); const B = f + r * n + rint(rng, 0, r - 1);
  const q = mkq(S(K3), 'budget', {
    prompt: `A pump rental costs $${f} plus $${r} per hour. The budget is $${B}. How many whole hours can you rent it?`,
    expression: `fee $${f}  ·  $${r} per hour  ·  budget $${B}`,
    answer: n, unit: 'h',
    hint: 'The cost (fee plus hourly charge) must be at most the budget. Solve for the hours and round DOWN to a whole hour.',
    steps: [`Cost ≤ budget: ${lab(f, 'dollars fee')} + ${lab(r, 'dollars per hour')} × h (hours) ≤ ${lab(B, 'dollars budget')}.`, `Subtract ${lab(f, 'dollars fee')}: ${r}h ≤ ${lab(B - f, 'dollars for hours')}.`, `${quotBound('h', B - f, r, 'dollars for hours', 'dollars per hour', 'hours')}. Round DOWN to stay in budget: ${lab(n, 'whole hours')}.`],
  });
  return typed(q);
}

/* ================================================================================================
 * 4. Slope as a rate of change
 * ============================================================================================== */
const K4 = 'slope';
function slopePts(rng: Rng) {
  const run = rint(rng, 1, 4); let rise = rnz(rng, -6, 6); if (Math.abs(rise) === run) rise += rise > 0 ? 1 : -1;
  const x1 = rint(rng, -5, 5 - run); const y1 = rint(rng, Math.max(-6, -6 - rise), Math.min(6, 6 - rise));
  const swap = rng.next() < 0.4;
  const A: [number, number] = swap ? [x1 + run, y1 + rise] : [x1, y1]; const B: [number, number] = swap ? [x1, y1] : [x1 + run, y1 + rise];
  return { A, B, rise, run };
}
function slopeLines(A: [number, number], B: [number, number]): string[] {
  const dy = B[1] - A[1]; const dx = B[0] - A[0];
  const raw = `${fmt(dy)}/${par(dx)}`; const red = fracStr(dy, dx);
  return [`Slope = (y₂ − y₁)/(x₂ − x₁), same order top and bottom.`, `(${fmt(B[1])} − ${par(A[1])})/(${fmt(B[0])} − ${par(A[0])}) = ${raw}${raw === red ? '' : ` = ${red}`}.`];
}
const twoPtV = (A: [number, number], B: [number, number]): Visual => plotV(R6, { points: [{ x: A[0], y: A[1], label: 'A' }, { x: B[0], y: B[1], label: 'B' }], segments: [{ a: A, b: B, color: 'teal' }] });

function slopeTypedStep(rng: Rng): AskStep {
  const { A, B, rise, run } = slopePts(rng);
  const q = mkq(S(K4), 'two-points', {
    prompt: `A rail runs from A${P(A[0], A[1])} to B${P(B[0], B[1])}. Find its slope.`,
    expression: 'm = rise / run',
    answer: rise / run, fraction: rise % run !== 0, answerText: fracStr(rise, run),
    hint: 'Rise is the change in y, run is the change in x. Subtract in the same order.',
    steps: slopeLines(A, B), visual: twoPtV(A, B),
    app: 'Slope is grade on a road, pitch on a roof and rate on a meter.',
  });
  return typed(q);
}

function slopeChooseStep(rng: Rng): AskStep {
  const { A, B, rise, run } = slopePts(rng);
  const right = fracStr(rise, run);
  const q = mkq(S(K4), 'slope-choose', {
    prompt: 'Find the slope of the rail through A and B.',
    expression: `A${P(A[0], A[1])},  B${P(B[0], B[1])}`,
    answer: rise / run, answerText: right,
    hint: 'Rise over run: change in y on top, change in x on the bottom.',
    steps: slopeLines(A, B), visual: twoPtV(A, B),
  });
  return choose(rng, q, right, [fracStr(run, rise), fracStr(-rise, run), fracStr(-run, rise)]);
}

/** Slope read off the grid: two marked dots, no coordinates in the text, so the player counts rise and run. */
function slopeFromGraphStep(rng: Rng): AskStep {
  let s = slopePts(rng);
  for (let g = 0; g < 20 && s.run < 2; g++) s = slopePts(rng);
  if (s.run < 2) s = { A: [-2, -1], B: [1, 3], rise: 4, run: 3 };
  const { A, B, rise, run } = s;
  const right = fracStr(rise, run);
  const q = mkq(S(K4), 'slope-graph', {
    prompt: 'Count rise over run between the two dots on the rail. What is its slope?',
    expression: 'm = rise / run',
    answer: rise / run, answerText: right,
    hint: 'Start at the left dot. Count squares across to the right dot (run), then up or down (rise). Down is negative.',
    steps: [`From the left dot to the right dot: ${lab(run, 'run, squares across')} and ${lab(Math.abs(rise), `rise, squares ${rise > 0 ? 'up' : 'down'}`)}.`, `Slope = rise/run = ${fmt(rise)}/${run}${fracStr(rise, run) === `${fmt(rise)}/${run}` ? '' : ` = ${right}`}.`],
    visual: plotV(R6, { points: [{ x: A[0], y: A[1] }, { x: B[0], y: B[1] }], segments: [{ a: A, b: B, color: 'teal' }] }),
  });
  return choose(rng, q, right, [fracStr(run, rise), fracStr(-rise, run), fmt(rise), fracStr(-run, rise)]);
}

function slopeDrawStep(rng: Rng): AskStep {
  const [p, qd] = pick(rng, [[1, 1], [2, 1], [3, 1], [-1, 1], [-2, 1], [-3, 1], [1, 2], [-1, 2], [2, 3], [-2, 3], [3, 2], [-3, 2]] as [number, number][]);
  const x0 = rint(rng, -5, 5 - qd); const y0 = rint(rng, Math.max(-5, -5 - p), Math.min(5, 5 - p));
  const m = p / qd; const b = y0 - m * x0;
  const q = mkq(S(K4), 'draw-slope', {
    prompt: `Lay a rail through P with slope ${fracStr(p, qd)}.`,
    expression: `P${P(x0, y0)},  m = ${fracStr(p, qd)}`,
    answer: m,
    hint: `Slope ${fracStr(p, qd)} means: go ${qd} right, then ${Math.abs(p)} ${p > 0 ? 'up' : 'down'}.`,
    steps: [`From P${P(x0, y0)} go ${qd} right and ${Math.abs(p)} ${p > 0 ? 'up' : 'down'}: ${P(x0 + qd, y0 + p)}.`, 'P and that point lie on the rail; so does every point you reach by repeating the step.'],
  });
  return model(q, { kind: 'plot', range: R6, count: 2, label: `Slope ${fracStr(p, qd)} through P`, layers: { points: [{ x: x0, y: y0, label: 'P' }] } }, undefined, 'Tap two points on the rail (P can be one of them).', { rule: { kind: 'on-line', m, b } });
}

function rateTableStep(rng: Rng): AskStep {
  const m = pick(rng, [-6, -5, -4, -3, 3, 4, 5, 6]); const step = pick(rng, [1, 2]); const b = m < 0 ? rint(rng, 40, 60) : rint(rng, 5, 20);
  const ts = [0, step, 2 * step, 3 * step]; const vs = ts.map((t) => b + m * t);
  const q = mkq(S(K4), 'rate-table', {
    prompt: m < 0 ? 'The tank drains at a constant rate. Fill in the missing levels.' : 'The tank fills at a constant rate. Fill in the missing levels.',
    expression: `${step === 1 ? 'Each minute' : `Every ${step} minutes`}: the same change`,
    answer: vs[2],
    hint: 'Find the change between the first two rows. A constant rate means the same change every row.',
    steps: [`From ${lab(vs[0], 'litres')} to ${lab(vs[1], 'litres')} is a change of ${lab(fmt(m * step), 'litres')} every ${step} min (rate ${lab(fmt(m), 'L per min')}).`, `${lab(vs[1], 'litres')} ${fmtSigned(m * step)} (L per row) = ${lab(vs[2], 'litres')}, then ${lab(vs[2], 'litres')} ${fmtSigned(m * step)} (L per row) = ${lab(vs[3], 'litres')}.`],
  });
  return model(q, { kind: 'table', cols: ['t (min)', 'V (L)'], rows: [[ts[0], vs[0]], [ts[1], vs[1]], [ts[2], null], [ts[3], null]], label: 'Constant rate' }, [`${vs[2]},${vs[3]}`], 'Fill the two missing levels.');
}

function slopeFromTableStep(rng: Rng): AskStep {
  // m = ±1 would make run/rise equal rise/run, so the run-over-rise distractor would be the right answer.
  const m = pick(rng, [-4, -3, -2, 2, 3, 4]); const dx = pick(rng, [2, 3]); const x0 = rint(rng, -2, 2); const y0 = rint(rng, -5, 5);
  const xs = [0, 1, 2, 3].map((i) => x0 + i * dx); const ys = xs.map((x) => y0 + m * (x - x0));
  const right = fmt(m);
  const q = mkq(S(K4), 'slope-table', {
    prompt: 'The sensor log changes at a constant rate. What is the slope?',
    expression: 'Slope from a table',
    answer: m, answerText: right,
    hint: 'Change in y divided by change in x. Look at how far x jumps each row.',
    steps: [`y changes by ${fmt(m * dx)} each row while x changes by ${dx}.`, `Slope = ${fmt(m * dx)}/${dx} = ${fmt(m)}.`],
    visual: card('Sensor log', [`x:  ${xs.map(fmt).join(',  ')}`, `y:  ${ys.map(fmt).join(',  ')}`]),
  });
  return choose(rng, q, right, [fmt(m * dx), fracStr(dx, m * dx), fmt(-m)]);
}

function slopeKindPickStep(rng: Rng): AskStep {
  const m = pick(rng, [2, 3, -2, -3, 1, -1]); const b = rint(rng, -2, 2); const c = rnz(rng, -3, 3); const kind = rint(rng, 0, 2);
  const R: [number, number, number, number] = [-5, 5, -5, 5];
  const vis: Visual[] = [plotV(R, { fns: [{ fn: lineFn(m, b), color: 'teal' }] }), plotV(R, { fns: [{ fn: lineFn(-m, b), color: 'teal' }] }), plotV(R, { fns: [{ fn: lineFn(0, c), color: 'teal' }] }), plotV(R, { segments: [{ a: [c, -5], b: [c, 5], color: 'teal' }] })];
  const want = kind === 0 ? `slope ${fmt(m)}` : kind === 1 ? 'slope 0' : 'a slope that is not defined';
  const q = mkq(S(K4), 'slope-kind', {
    prompt: `Which rail has ${want}?`,
    expression: kind === 0 ? `m = ${fmt(m)}` : kind === 1 ? 'm = 0' : 'm not defined',
    answer: 0,
    hint: 'Uphill left to right is positive, downhill is negative. Flat has no rise; vertical has no run, and you cannot divide by 0.',
    steps: [kind === 0 ? `Slope ${fmt(m)} ${m > 0 ? 'rises' : 'falls'} ${Math.abs(m)} for every 1 step right.` : kind === 1 ? 'A flat line has rise 0: slope 0/run = 0.' : 'A vertical line has run 0, and rise/0 is not defined.'],
  });
  return pickLettered(rng, q, vis, kind === 0 ? 0 : kind === 1 ? 2 : 3, 'Rail');
}

function rateOfChangeStep(rng: Rng): AskStep {
  const m = pick(rng, [-8, -6, -5, -4, -3, 3, 4, 5, 6]); const t1 = rint(rng, 1, 4); const t2 = t1 + pick(rng, [2, 3, 4, 5]); const v1 = m < 0 ? rint(rng, 60, 90) : rint(rng, 10, 30); const v2 = v1 + m * (t2 - t1);
  const q = mkq(S(K4), 'rate-word', {
    prompt: `At ${t1} min a tank holds ${v1} L. At ${t2} min it holds ${v2} L. What is the rate of change?`,
    expression: 'rate = Δ volume / Δ time',
    answer: m, unit: 'L/min',
    hint: 'Change in volume over change in time. A falling level gives a negative rate.',
    steps: [`Δ volume = ${lab(v2, 'L later')} − ${lab(v1, 'L earlier')} = ${lab(fmt(v2 - v1), 'L change')}; Δ time = ${lab(t2, 'min')} − ${lab(t1, 'min')} = ${lab(t2 - t1, 'min')}.`, `Rate = ${lab(fmt(v2 - v1), 'L change')} ÷ ${lab(t2 - t1, 'min')} = ${lab(fmt(m), 'L per min')}.`],
  });
  return typed(q);
}

function gradeStep(rng: Rng): AskStep {
  const run = pick(rng, [4, 8, 10, 12, 20]); const g = pick(rng, [0.25, 0.5, 0.125, 0.75]); const rise = run * g;
  const q = mkq(S(K4), 'ramp-grade', {
    prompt: `A loading ramp rises ${fmt(rise)} m over a run of ${run} m. What is its slope as a decimal?`,
    expression: 'slope = rise / run',
    answer: g,
    hint: 'Divide the rise by the run.',
    steps: [`${lab(fmt(rise), 'm rise')} ÷ ${lab(run, 'm run')} = ${lab(fmt(g), 'slope')}.`],
    visual: { type: 'slope', rise, run, unit: 'm' },
  });
  return typed(q);
}

/* ================================================================================================
 * 5. Graphing lines
 * ============================================================================================== */
const K5 = 'lines';
const SLOPES: [number, number][] = [[1, 1], [2, 1], [3, 1], [-1, 1], [-2, 1], [-3, 1], [1, 2], [-1, 2], [2, 3], [-2, 3], [3, 2], [-3, 2]];
const latticeOn = (m: number, b: number, R: [number, number, number, number] = R6) => { let n = 0; for (let x = R[0]; x <= R[1]; x++) { const y = m * x + b; if (Math.abs(y - Math.round(y)) < 1e-9 && y >= R[2] && y <= R[3]) n++; } return n; };
const icpt = (k: number, v: string, C: number, val: number) => (k === 1 ? `${v} = ${fmt(val)}` : `${coefTerm(k, v)} = ${fmt(C)}, so ${v} = ${fmt(val)}`);
const stdForm = (A: number, B: number, C: number) => `${coefTerm(A, 'x')} ${B < 0 ? '−' : '+'} ${coefTerm(Math.abs(B), 'y')} = ${fmt(C)}`;

function graphLineStep(rng: Rng): AskStep {
  let p = 1; let qd = 1; let b = 0;
  for (let g = 0; g < 20; g++) { [p, qd] = pick(rng, SLOPES); b = rint(rng, -3, 3); if (latticeOn(p / qd, b) >= 2) break; }
  const q = mkq(S(K5), 'graph-line', {
    prompt: 'Lay the rail for this equation.',
    expression: yEq(p, qd, b),
    answer: p / qd,
    hint: 'b is where the line crosses the y-axis. From there, the slope says how far to go right and up or down.',
    steps: [`Start at the y-intercept (0, ${fmt(b)}).`, `Slope ${fracStr(p, qd)}: ${qd} right, ${Math.abs(p)} ${p > 0 ? 'up' : 'down'}, to ${P(qd, b + p)}.`, 'Any two points on the line work.'],
  });
  return model(q, { kind: 'plot', range: R6, count: 2, label: yEq(p, qd, b) }, undefined, 'Tap two points on the line.', { rule: { kind: 'on-line', m: p / qd, b } });
}

function stdParams(rng: Rng) {
  const X = rnz(rng, -6, 6); let Y = rnz(rng, -6, 6); if (Math.abs(X) === 1 && Math.abs(Y) === 1) Y = 3;
  const L = (Math.abs(X) * Math.abs(Y)) / gcd(X, Y);
  let A = L / X; let B = L / Y; let C = L; if (A < 0) { A = -A; B = -B; C = -C; }
  return { X, Y, A, B, C };
}

function interceptTapStep(rng: Rng): AskStep {
  const { X, Y, A, B, C } = stdParams(rng); const xi = rng.next() < 0.5;
  const q = mkq(S(K5), 'intercept', {
    prompt: `Tap the ${xi ? 'x' : 'y'}-intercept of the rail.`,
    expression: stdForm(A, B, C),
    answer: xi ? X : Y,
    hint: xi ? 'On the x-axis, y = 0. Put y = 0 and solve for x.' : 'On the y-axis, x = 0. Put x = 0 and solve for y.',
    steps: xi ? [`Set y = 0: ${icpt(A, 'x', C, X)}.`, `The x-intercept is ${P(X, 0)}.`] : [`Set x = 0: ${icpt(B, 'y', C, Y)}.`, `The y-intercept is ${P(0, Y)}.`],
  });
  return model(q, { kind: 'plot', range: R6, count: 1, label: `${xi ? 'x' : 'y'}-intercept of ${stdForm(A, B, C)}` }, [xi ? `${X},0` : `0,${Y}`], `Tap the ${xi ? 'x' : 'y'}-intercept.`);
}

function interceptTypedStep(rng: Rng): AskStep {
  const { X, Y, A, B, C } = stdParams(rng); const xi = rng.next() < 0.5;
  return typed(mkq(S(K5), 'intercept-typed', {
    prompt: `Find the ${xi ? 'x' : 'y'}-intercept of the line.`,
    expression: stdForm(A, B, C),
    answer: xi ? X : Y,
    hint: xi ? 'Put y = 0 and solve.' : 'Put x = 0 and solve.',
    steps: xi ? [`Set y = 0: ${icpt(A, 'x', C, X)}.`] : [`Set x = 0: ${icpt(B, 'y', C, Y)}.`],
  }));
}

function interceptsBothStep(rng: Rng): AskStep {
  const { X, Y, A, B, C } = stdParams(rng);
  const q = mkq(S(K5), 'intercepts', {
    prompt: 'Standard form is quickest to graph by its intercepts. Tap both.',
    expression: stdForm(A, B, C),
    answer: X,
    hint: 'Cover up the y-term (y = 0) to find x; cover up the x-term (x = 0) to find y.',
    steps: [`y = 0: ${icpt(A, 'x', C, X)}. Point ${P(X, 0)}.`, `x = 0: ${icpt(B, 'y', C, Y)}. Point ${P(0, Y)}.`],
  });
  return model(q, { kind: 'plot', range: R6, count: 2, label: stdForm(A, B, C) }, undefined, 'Tap the x-intercept and the y-intercept.', { rule: { kind: 'set', items: [`${X},0`, `0,${Y}`] } });
}

/** Point-slope form; a slope of 1 or −1 is written without the 1: 'y − 2 = (x + 3)', 'y + 1 = −(x − 2)'. */
const psForm = (m: string, x1: number, y1: number) => `y ${fmtSigned(-y1)} = ${m === '1' ? '' : m === '−1' ? '−' : m}(x ${fmtSigned(-x1)})`;
const mParen = (p: number, q: number) => { const [a, b] = simplify(p, q); return b === 1 ? fmt(a) : `${a < 0 ? '−' : ''}(${Math.abs(a)}/${b})`; };
function pointSlopeReadStep(rng: Rng): AskStep {
  const x1 = rnz(rng, -5, 5); const y1 = rnz(rng, -5, 5); const m = pick(rng, [2, 3, 4, -2, -3, -4]);
  const right = P(x1, y1);
  const q = mkq(S(K5), 'point-slope-read', {
    prompt: 'This rail is in point-slope form. Which point does it name?',
    expression: psForm(fmt(m), x1, y1),
    answer: 0,
    hint: 'Point-slope form is y − y₁ = m(x − x₁). Match the signs carefully: x + 2 is x − (−2).',
    steps: [`y − y₁ = m(x − x₁) with ${x1 < 0 ? `x + ${-x1} = x − (${fmt(x1)})` : `x − ${x1}`} and ${y1 < 0 ? `y + ${-y1} = y − (${fmt(y1)})` : `y − ${y1}`}.`, `So the point is ${right} and the slope is ${fmt(m)}.`],
  });
  return choose(rng, q, right, [P(-x1, y1), P(x1, -y1), P(-x1, -y1)]);
}

function pointSlopePlotStep(rng: Rng): AskStep {
  let p = 1; let qd = 1; let x1 = 0; let y1 = 0;
  for (let g = 0; g < 30; g++) { [p, qd] = pick(rng, SLOPES); x1 = rnz(rng, -4, 4); y1 = rnz(rng, -4, 4); const fw = Math.abs(x1 + qd) <= 6 && Math.abs(y1 + p) <= 6; const bw = Math.abs(x1 - qd) <= 6 && Math.abs(y1 - p) <= 6; if ((fw || bw) && latticeOn(p / qd, y1 - (p / qd) * x1) >= 2) break; }
  const m = p / qd; const ms = mParen(p, qd);
  const st = Math.abs(x1 + qd) <= 6 && Math.abs(y1 + p) <= 6 ? 1 : -1; // step the way that stays on the [−6, 6] grid
  const q = mkq(S(K5), 'point-slope-graph', {
    prompt: 'Graph the rail from its point-slope form.',
    expression: psForm(ms, x1, y1),
    answer: m,
    hint: 'Read the point (x₁, y₁) with the signs flipped from the brackets, then step by the slope.',
    steps: [`Point ${P(x1, y1)}, slope ${ms}.`, `Step ${qd} ${st > 0 ? 'right' : 'left'} and ${Math.abs(p)} ${st * p > 0 ? 'up' : 'down'}: ${P(x1 + st * qd, y1 + st * p)}.`],
  });
  return model(q, { kind: 'plot', range: R6, count: 2, label: psForm(ms, x1, y1) }, undefined, 'Tap two points on the line.', { rule: { kind: 'on-line', m, b: y1 - m * x1 } });
}

function whichEquationStep(rng: Rng): AskStep {
  const m = rnz(rng, -3, 3); let b = rnz(rng, -4, 4); if (b === m) b = m > 0 ? -b - 1 : 4;
  const right = yEq(m, 1, b);
  const q = mkq(S(K5), 'match-equation', {
    prompt: 'Which equation matches the rail on the graph?',
    expression: 'y = mx + b',
    answer: 0,
    hint: 'Read b where the line crosses the y-axis. Then count rise over run for m, and check uphill or downhill.',
    steps: [`It crosses the y-axis at (0, ${fmt(b)}), so b = ${fmt(b)}.`, `It ${m > 0 ? 'rises' : 'falls'} ${Math.abs(m)} for each 1 right, so m = ${fmt(m)}: ${right}.`],
    visual: plotV(R6, { fns: [{ fn: lineFn(m, b), color: 'teal' }], points: [{ x: 0, y: b }] }),
  });
  return choose(rng, q, right, [yEq(b, 1, m), yEq(-m, 1, b), yEq(m, 1, -b)]);
}

function standardToSlopeStep(rng: Rng): AskStep {
  const B = pick(rng, [2, 3, 4, -2]); let A = rnz(rng, -5, 5); if (A % B === 0) A += 1; if (A === 0) A = 1; const b0 = rnz(rng, -4, 4); const C = B * b0;
  const right = yEq(-A, B, b0);
  const q = mkq(S(K5), 'standard-to-slope', {
    prompt: 'Rewrite the rail in slope-intercept form.',
    expression: stdForm(A, B, C),
    answer: 0,
    hint: 'Get the y-term alone (move the x-term, changing its sign), then divide EVERY term by the y-coefficient.',
    steps: [`${A > 0 ? 'Subtract' : 'Add'} ${coefTerm(Math.abs(A), 'x')} ${A > 0 ? 'from' : 'to'} both sides: ${coefTerm(B, 'y')} = ${lin(-A, C)}.`, `Divide every term by ${fmt(B)}: ${right}.`],
  });
  return choose(rng, q, right, [yEq(A, B, b0), yEq(-A, 1, C), yEq(-A, B, C)]);
}

function lineGraphPickStep(rng: Rng): AskStep {
  // |m| ≥ 2: with m = ±1 the "b on the x-axis" line y = m(x − b) coincides with another option.
  const m = pick(rng, [2, 3, -2, -3]); const b = rnz(rng, -3, 3); const R: [number, number, number, number] = [-5, 5, -5, 5];
  const v = (mm: number, bb: number) => plotV(R, { fns: [{ fn: lineFn(mm, bb), color: 'teal' }] });
  const q = mkq(S(K5), 'pick-graph', {
    prompt: 'Which graph shows this rail?',
    expression: yEq(m, 1, b),
    answer: 0,
    hint: 'Check two things: where it crosses the y-axis (b) and whether it goes up or down to the right (sign of m).',
    steps: [`b = ${fmt(b)}: it crosses the y-axis at (0, ${fmt(b)}). b sits on the y-axis at (0, ${fmt(b)}), not on the x-axis at (${fmt(b)}, 0).`, `m = ${fmt(m)}: ${m > 0 ? 'uphill' : 'downhill'} to the right, ${Math.abs(m)} per step.`],
  });
  // Options: right; slope sign flipped; b sign flipped; b plotted on the x-axis (slope m through (b, 0)).
  return pickLettered(rng, q, [v(m, b), v(-m, b), v(m, -b), v(m, -m * b)], 0);
}

function spoolStep(rng: Rng): AskStep {
  const r = pick(rng, [4, 5, 6, 8, 10]); const t = rint(rng, 4, 12); const L = r * t;
  const q = mkq(S(K5), 'spool', {
    prompt: `A cable spool holds ${L} m and unwinds ${r} m per minute: L = ${L} − ${r}t. When is it empty?`,
    expression: `0 = ${L} − ${r}t`,
    answer: t, unit: 'min',
    hint: 'Empty means L = 0: this is the t-intercept of the line.',
    steps: [`Set L (m left) = 0: ${lab(r, 'm per min')} × t (min) = ${lab(L, 'm on the spool')}.`, `t = ${lab(L, 'metres')} ÷ ${lab(r, 'm per min')} = ${lab(t, 'min')}.`],
  });
  return typed(q);
}

function costLineStep(rng: Rng): AskStep {
  const F = pick(rng, [20, 30, 45, 50]); const r = pick(rng, [8, 12, 15, 25]);
  const right = `C = ${r}h + ${F}`;
  const q = mkq(S(K5), 'cost-line', {
    prompt: `A drill rents for $${F} up front plus $${r} per hour. Which equation gives the cost C after h hours?`,
    expression: 'C = m·h + b',
    answer: 0,
    hint: 'The rate per hour is the slope; the one-time fee is the starting value (the intercept).',
    steps: [`Slope = $${r} per hour; intercept = $${F}, the cost at h = 0.`, `C (dollars) = ${lab(r, 'dollars per hour')} × h (hours) + ${lab(F, 'fee')}: ${right}.`],
  });
  return choose(rng, q, right, [`C = ${F}h + ${r}`, `C = ${r + F}h`, `C = ${r}(h + ${F})`]);
}

/* ================================================================================================
 * 6. Functions
 * ============================================================================================== */
const K6 = 'functions';
interface FnP { c: number[]; text: string; at: (x: number) => number; sub: (x: number) => string }
function fnParams(rng: Rng, quad = rng.next() < 0.4): FnP {
  if (quad) {
    const a = pick(rng, [1, 1, 2, -1]); const b = rint(rng, -4, 4); const c = rint(rng, -6, 6);
    const at = (x: number) => a * x * x + b * x + c;
    const sub = (x: number) => { const t = [`${a === 1 ? '' : a === -1 ? '−' : fmt(a)}(${fmt(x)})²`]; if (b) t.push(`${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}(${fmt(x)})`); if (c) t.push(fmtSigned(c)); return t.join(' '); };
    return { c: [c, b, a], text: polyStr([c, b, a]), at, sub };
  }
  const m = rnz(rng, -5, 5); const b = rint(rng, -8, 8);
  return { c: [b, m], text: lin(m, b), at: (x) => m * x + b, sub: (x) => `${m === 1 ? '' : m === -1 ? '−' : fmt(m)}(${fmt(x)})${b ? ` ${fmtSigned(b)}` : ''}` };
}

function evalFnStep(rng: Rng): AskStep {
  const f = fnParams(rng); const k = rnz(rng, -4, 4);
  return typed(mkq(S(K6), 'evaluate', {
    prompt: `The gear controller runs f(x) = ${f.text}. Find f(${fmt(k)}).`,
    expression: `f(${fmt(k)}) = ?`,
    answer: f.at(k),
    hint: `f(${fmt(k)}) means: put ${fmt(k)} in for every x. It is not f times ${fmt(k)}.`,
    steps: [`Replace every x with ${par(k)}.`, `f(${fmt(k)}) = ${f.sub(k)} = ${fmt(f.at(k))}.`],
  }));
}

function evalChooseStep(rng: Rng): AskStep {
  const f = fnParams(rng, true); const k = -rint(rng, 1, 4);
  const right = fmt(f.at(k)); const [c, b, a] = f.c;
  const q = mkq(S(K6), 'evaluate-choose', {
    prompt: `f(x) = ${f.text}. What is f(${fmt(k)})?`,
    expression: `f(${fmt(k)}) = ?`,
    answer: f.at(k), answerText: right,
    hint: `Put ${par(k)} in for x, brackets and all. A negative number squared is positive.`,
    steps: [`f(${fmt(k)}) = ${f.sub(k)}.`, `(${fmt(k)})² = ${k * k}, so this is ${[fmt(a * k * k), ...(b ? [fmtSigned(b * k)] : []), ...(c ? [fmtSigned(c)] : [])].join(' ')} = ${right}.`],
  });
  // Real slips first (sign of the square, sign of b·k, squaring a too, dropping c's sign); the rest are fallbacks
  // for when b = 0, c = 0 or a = 1 makes a slip land on the right value. choose() keeps the first 3 distinct.
  const slips = [-a * k * k + b * k + c, a * k * k - b * k + c, a * a * k * k + b * k + c, a * k * k + b * k - c, a * 2 * k + b * k + c, -a * k * k - b * k + c, -a * k * k + b * k - c, -a * k * k - b * k - c];
  return choose(rng, q, right, padWrongs(rng, f.at(k), [...new Set(slips.filter((v) => v !== f.at(k)).map(fmt))], fmt, right));
}

/** What f(4) = 11 means: an input and its output, not a product. */
function fnMeaningStep(rng: Rng): AskStep {
  const k = rint(rng, 2, 9); let v = rint(rng, 3, 20); if (v === k) v += 3;
  const who = pick(rng, ["Volt's signal log", "Newton's gear log", 'The pump controller']);
  const right = `Input ${k} gives output ${v}`;
  const q = mkq(S(K6), 'notation-meaning', {
    prompt: `${who} says f(${k}) = ${v}. What does that mean?`,
    expression: `f(${k}) = ${v}`,
    answer: 0,
    hint: 'In f(x), the number in the brackets is what goes IN to the machine. The value after = is what comes OUT.',
    steps: [`f(${k}) means "the output of f when the input is ${k}".`, `So f(${k}) = ${v} says: put ${lab(k, 'input')} in, get ${lab(v, 'output')} out. It is not f times ${k}.`],
  });
  return choose(rng, q, right, [`f times ${k} is ${v}`, `Input ${v} gives output ${k}`, `f is ${v} − ${k} = ${fmt(v - k)}`]);
}

function fnTableStep(rng: Rng): AskStep {
  const f = fnParams(rng); const xs = rng.shuffle([-2, -1, 0, 1, 2, 3]).slice(0, 3).sort((p, q) => p - q);
  const ys = xs.map(f.at);
  const q = mkq(S(K6), 'fn-table', {
    prompt: `Run the machine f(x) = ${f.text}. Fill in the outputs.`,
    expression: `f(x) = ${f.text}`,
    answer: ys[0],
    hint: 'Each input goes into the rule once. Brackets around negative inputs.',
    steps: xs.map((x, i) => `f(${fmt(x)}) = ${f.sub(x)} = ${fmt(ys[i])}`),
  });
  return model(q, { kind: 'table', cols: ['x (input)', 'f(x) (output)'], rows: xs.map((x) => [x, null]), label: `f(x) = ${f.text}` }, [ys.join(',')], 'Fill each output.');
}

function isFunctionStep(rng: Rng): AskStep {
  const kind = rint(rng, 0, 2); // 0: repeated input (not a function), 1: repeated output (function), 2: all distinct
  const xs = rng.shuffle([-3, -2, -1, 0, 1, 2, 3, 4]).slice(0, 4); const ys = rng.shuffle([-4, -2, 0, 1, 3, 5, 6, 8]).slice(0, 4);
  if (kind === 0) xs[3] = xs[1];
  if (kind === 1) ys[3] = ys[1];
  const pairs = xs.map((x, i) => P(x, ys[i])).join(', ');
  const yes = 'Yes, it is a function'; const noIn = 'No: an input has two outputs'; const noOut = 'No: two inputs share an output';
  const right = kind === 0 ? noIn : yes;
  const q = mkq(S(K6), 'is-function', {
    prompt: 'A sensor logs (input, output) pairs. Is this a function?',
    expression: `{ ${pairs} }`,
    answer: 0,
    hint: 'A function gives each INPUT exactly one output. Look for an input (first number) that appears twice.',
    steps: kind === 0 ? [`Input ${fmt(xs[1])} appears with two different outputs, ${fmt(ys[1])} and ${fmt(ys[3])}.`, 'So it is not a function.'] : kind === 1 ? [`Every input appears once. Output ${fmt(ys[1])} repeats, and that is allowed.`, 'So it is a function.'] : ['Every input appears once with one output.', 'So it is a function.'],
  });
  return choose(rng, q, right, [yes, noIn, noOut]);
}

function vltPickStep(rng: Rng): AskStep {
  const R: [number, number, number, number] = [-5, 5, -5, 5]; const h = rint(rng, -4, -1); const k = rint(rng, -1, 1);
  const T = 'teal' as const;
  const vis: Visual[] = [
    rng.next() < 0.5 ? plotV(R, { fns: [{ fn: { kind: 'sqrt', a: 2, h, k }, color: T }, { fn: { kind: 'sqrt', a: -2, h, k }, color: T }] }) : plotV(R, { segments: [{ a: [h + 3, -5], b: [h + 3, 5], color: T }] }),
    plotV(R, { fns: [{ fn: { kind: 'poly', c: [rint(rng, -3, 0), 0, 1] }, color: T }] }),
    plotV(R, { fns: [{ fn: { kind: 'abs', a: pick(rng, [1, -1]), h: rint(rng, -2, 2), k: rint(rng, -1, 1) }, color: T }] }),
    plotV(R, { fns: [{ fn: lineFn(pick(rng, [2, -1, 0.5]), rint(rng, -2, 2)), color: T }] }),
  ];
  const q = mkq(S(K6), 'vertical-line', {
    prompt: 'Which graph is NOT a function?',
    expression: 'Vertical line test',
    answer: 0,
    hint: 'Slide a vertical line across each graph. If it ever hits the graph twice, one input has two outputs.',
    steps: ['A vertical line hits that graph in two places (or along a whole stretch), so one input has more than one output.', 'Every other graph passes: each vertical line hits it once.'],
  });
  return pickLettered(rng, q, vis, 0);
}

function domainRangeStep(rng: Rng): AskStep {
  let x1 = 0; let x2 = 0; let y1 = 0; let y2 = 0;
  for (let g = 0; g < 30; g++) { x1 = rint(rng, -5, 0); x2 = x1 + rint(rng, 2, 6); y1 = rint(rng, -4, 4); y2 = rint(rng, -4, 4); if (y1 !== y2 && !(Math.min(y1, y2) === x1 && Math.max(y1, y2) === x2)) break; }
  const lo = Math.min(y1, y2); const hi = Math.max(y1, y2); const askD = rng.next() < 0.5;
  const dom = `${fmt(x1)} ≤ x ≤ ${fmt(x2)}`; const ran = `${fmt(lo)} ≤ y ≤ ${fmt(hi)}`;
  const right = askD ? dom : ran;
  const m = (y2 - y1) / (x2 - x1);
  const q = mkq(S(K6), 'domain-range', {
    prompt: `The gauge graph runs between its two end dots. What is its ${askD ? 'domain' : 'range'}?`,
    expression: askD ? 'Domain = the inputs (x)' : 'Range = the outputs (y)',
    answer: 0,
    hint: askD ? 'Domain: read left to right along the x-axis, from the leftmost point to the rightmost.' : 'Range: read bottom to top along the y-axis, from the lowest point to the highest.',
    steps: [`The graph runs from x = ${fmt(x1)} to x = ${fmt(x2)}, and its heights go from y = ${fmt(lo)} to y = ${fmt(hi)}.`, `${askD ? 'Domain' : 'Range'}: ${right}. The end dots are filled, so the ends are included.`],
    visual: plotV(R6, { fns: [{ fn: lineFn(m, y1 - m * x1), from: x1, to: x2, color: 'teal' }], points: [{ x: x1, y: y1 }, { x: x2, y: y2 }] }),
  });
  return choose(rng, q, right, askD ? [ran, `${fmt(lo)} ≤ x ≤ ${fmt(hi)}`, `${fmt(x1)} < x < ${fmt(x2)}`] : [dom, `${fmt(x1)} ≤ y ≤ ${fmt(x2)}`, `${fmt(lo)} < y < ${fmt(hi)}`]);
}

function fnPlotPointStep(rng: Rng): AskStep {
  let m = 1; let b = 0; let k = 0;
  for (let g = 0; g < 30; g++) { m = rnz(rng, -3, 3); b = rint(rng, -4, 4); k = rint(rng, -4, 4); if (Math.abs(m * k + b) <= 6) break; }
  const y = m * k + b;
  const q = mkq(S(K6), 'plot-output', {
    prompt: `f(x) = ${lin(m, b)}. Plot the point (${fmt(k)}, f(${fmt(k)})).`,
    expression: `f(${fmt(k)}) = ?`,
    answer: y,
    hint: `Work out f(${fmt(k)}) first; it is the height of the point above x = ${fmt(k)}.`,
    steps: [`f(${fmt(k)}) = ${m === 1 ? '' : m === -1 ? '−' : fmt(m)}(${fmt(k)})${b ? ` ${fmtSigned(b)}` : ''} = ${fmt(y)}.`, `Plot ${P(k, y)}.`],
  });
  return model(q, { kind: 'plot', range: R6, count: 1, label: `f(x) = ${lin(m, b)}` }, [`${k},${y}`], `Tap the point (${fmt(k)}, f(${fmt(k)})).`);
}

function solveForInputStep(rng: Rng): AskStep {
  const m = pick(rng, [2, 3, 4, 5, -2, -3]); const b = rnz(rng, -9, 9); const x = rnz(rng, -5, 6); const out = m * x + b;
  const right = xeq(x);
  const wr = [xeq(m * out + b), xeq(out)];
  if ((out + b) % m === 0) wr.push(xeq((out + b) / m));
  const q = mkq(S(K6), 'solve-input', {
    prompt: `f(x) = ${lin(m, b)}. Which input gives an output of ${fmt(out)}?`,
    expression: `f(x) = ${fmt(out)}`,
    answer: x, answerText: right,
    hint: 'This time the OUTPUT is known. Set the rule equal to it and solve for x.',
    steps: [`${lin(m, b)} = ${fmt(out)}.`, ...solveLines(m, b, 0, out)],
  });
  return choose(rng, q, right, padWrongs(rng, x, wr, (v) => xeq(v), right));
}

function pumpFnStep(rng: Rng): AskStep {
  const r = pick(rng, [8, 12, 15, 20]); const s = pick(rng, [20, 30, 50]); const t = rint(rng, 2, 9); const solve = rng.next() < 0.5;
  const q = mkq(S(K6), 'pump-fn', {
    prompt: solve ? `A pump's tank holds V(t) = ${r}t + ${s} L after t minutes. When does it hold ${r * t + s} L?` : `A pump's tank holds V(t) = ${r}t + ${s} liters after t minutes. Find V(${t}).`,
    expression: solve ? `V(t) = ${r * t + s}` : `V(${t}) = ?`,
    answer: solve ? t : r * t + s, unit: solve ? 'min' : 'L',
    hint: solve ? 'The output is known: set the rule equal to it and solve.' : 'Put the input into the rule.',
    steps: solve ? [`${lab(r, 'L per min')} × t (min) + ${lab(s, 'L at start')} = ${lab(r * t + s, 'litres')}.`, `${r}t = ${lab(r * t, 'L pumped')}, so t = ${lab(r * t, 'L pumped')} ÷ ${lab(r, 'L per min')} = ${lab(t, 'min')}.`] : [`V(${t}) = ${lab(r, 'L per min')} × ${lab(t, 'min')} + ${lab(s, 'L at start')} = ${lab(r * t + s, 'litres')}.`],
  });
  return typed(q);
}

/* ================================================================================================
 * 7. Systems of linear equations
 * ============================================================================================== */
const K7 = 'systems';
function sysParams(rng: Rng) {
  let x0 = 0; let y0 = 0; let m1 = 1; let m2 = 2;
  for (let g = 0; g < 30; g++) {
    x0 = rint(rng, -4, 4); y0 = rint(rng, -4, 4); m1 = rnz(rng, -3, 3); m2 = rnz(rng, -3, 3);
    if (m1 !== m2 && (x0 !== 0 || y0 !== 0) && Math.abs(y0 - m1 * x0) <= 8 && Math.abs(y0 - m2 * x0) <= 8) break;
  }
  if (m1 === m2) m2 = -m1;
  return { x0, y0, m1, m2, b1: y0 - m1 * x0, b2: y0 - m2 * x0 };
}

type SysP = ReturnType<typeof sysParams>;
function systemPlotStep(rng: Rng, drawn = true, sp: SysP = sysParams(rng)): AskStep {
  const { x0, y0, m1, m2, b1, b2 } = sp;
  const q = mkq(S(K7), drawn ? 'graph-system' : 'solve-graph', {
    prompt: drawn ? 'Two rails cross. Tap the one point that lies on both.' : 'Graph both rails in your head (or on paper) and tap where they meet.',
    expression: `${yEq(m1, 1, b1)}  and  ${yEq(m2, 1, b2)}`,
    answer: x0,
    hint: drawn ? 'The solution is the crossing point: it makes BOTH equations true.' : 'Set the two right-hand sides equal to find x, then find y.',
    steps: ['The solution of a system is the point on both lines.', `${lin(m1, b1)} = ${lin(m2, b2)} gives x = ${fmt(x0)}.`, `y = ${fmt(y0)}, so the solution is ${P(x0, y0)}.`],
  });
  return model(q, { kind: 'plot', range: R6, count: 1, label: drawn ? 'Where do they cross?' : `${yEq(m1, 1, b1)} and ${yEq(m2, 1, b2)}`, layers: drawn ? { fns: [{ fn: lineFn(m1, b1), color: 'teal' }, { fn: lineFn(m2, b2), color: 'orange' }] } : undefined }, [`${x0},${y0}`], 'Tap the solution point.');
}

/** Solve by graphing, done by the player: rail 1 is drawn, they lay rail 2 from its equation. */
function systemLayStep(rng: Rng, sp: SysP = sysParams(rng)): AskStep {
  const { x0, y0, m1, m2, b1, b2 } = sp;
  const st = x0 + 1 <= 6 && Math.abs(y0 + m2) <= 6 ? 1 : -1; // a neighbour of the crossing that is on the grid
  const q = mkq(S(K7), 'lay-second-line', {
    prompt: `Rail 1 is drawn. Lay rail 2, ${yEq(m2, 1, b2)}, on the same grid.`,
    expression: `${yEq(m1, 1, b1)}  and  ${yEq(m2, 1, b2)}`,
    answer: m2,
    hint: 'Pick an x, work out y from the rule, and tap that point. Then step by the slope (1 across, m up or down) for a second point. If b is off the grid, start from another x.',
    steps: [`${yEq(m2, 1, b2)}: slope ${fmt(m2)}, y-intercept ${fmt(b2)}.`, `At x = ${fmt(x0)}, y = ${fmt(y0)}; one step ${st > 0 ? 'right' : 'left'} gives ${P(x0 + st, y0 + st * m2)}. Both lie on rail 2.`, `Where it crosses rail 1 is the solution, ${P(x0, y0)}.`],
  });
  return model(q, { kind: 'plot', range: R6, count: 2, label: `Lay rail 2: ${yEq(m2, 1, b2)}`, layers: { fns: [{ fn: lineFn(m1, b1), color: 'teal', label: 'rail 1' }] } }, undefined, 'Tap two points on rail 2.', { rule: { kind: 'on-line', m: m2, b: b2 } });
}
/** Lay rail 2, then tap where the two rails cross: both asks share one system. */
function graphSystemPair(rng: Rng): AskStep[] {
  let sp = sysParams(rng);
  for (let g = 0; g < 20 && latticeOn(sp.m2, sp.b2) < 2; g++) sp = sysParams(rng);
  return [systemLayStep(rng, sp), systemPlotStep(rng, true, sp)];
}

function subParams(rng: Rng) {
  const x0 = rnz(rng, -5, 5); const y0 = rint(rng, -5, 5); const m = rnz(rng, -3, 3); const b = y0 - m * x0;
  let a = rnz(rng, -4, 4); const c = pick(rng, [2, 3, 4, -2, -3]); if (a + c * m === 0) a += 1; if (a === 0) a = 1;
  return { x0, y0, m, b, a, c, d: a * x0 + c * y0 };
}
const subText = (a: number, c: number, m: number, b: number, d: number) => `${coefTerm(a, 'x')} ${c < 0 ? '−' : '+'} ${Math.abs(c)}(${lin(m, b)}) = ${fmt(d)}`;
type SubP = ReturnType<typeof subParams>;

/** The substitution itself, before any balancing: swap y for its whole expression, in brackets. */
function substitutionSetupStep(rng: Rng, sp: SubP = subParams(rng)): AskStep {
  const { m, b, a, c, d } = sp;
  const right = subText(a, c, m, b, d);
  const sg = (n: number) => (n < 0 ? '−' : '+');
  const wr = [
    `${coefTerm(a, 'x')} ${sg(c * m)} ${coefTerm(Math.abs(c * m), 'x')} ${fmtSigned(b)} = ${fmt(d)}`,          // bracket dropped: only m·x multiplied
    `${a === 1 ? '' : a === -1 ? '−' : fmt(a)}(${lin(m, b)}) ${sg(c)} ${coefTerm(Math.abs(c), 'y')} = ${fmt(d)}`, // replaced x instead of y
    `${coefTerm(a, 'x')} ${sg(c)} ${coefTerm(Math.abs(c), 'y')} ${fmtSigned(b)} = ${fmt(d)}`,                    // tacked b on instead of replacing y
    `${coefTerm(a, 'x')} ${sg(-c)} ${Math.abs(c)}(${lin(m, b)}) = ${fmt(d)}`,                                     // lost the sign of y's coefficient
  ];
  const q = mkq(S(K7), 'substitution-setup', {
    prompt: `Substitute y = ${lin(m, b)} into the other rule. Which equation do you get?`,
    expression: `${stdForm(a, c, d)},  y = ${lin(m, b)}`,
    answer: 0,
    hint: 'Replace the letter y, and only y, with its whole expression, in brackets. Keep the number that multiplied y.',
    steps: [`y is ${lin(m, b)}, so ${coefTerm(c, 'y')} becomes ${fmt(c)}(${lin(m, b)}).`, `${right}.`],
  });
  return choose(rng, q, right, wr);
}
/** Pick the substituted equation, then balance it: both asks share one system (b ≠ 0 so a dropped bracket is a real slip). */
function substitutionPair(rng: Rng): AskStep[] {
  let sp = subParams(rng);
  for (let g = 0; g < 20 && sp.b === 0; g++) sp = subParams(rng);
  return [substitutionSetupStep(rng, sp), substitutionBalanceStep(rng, sp)];
}

function substitutionBalanceStep(rng: Rng, sp: SubP = subParams(rng)): AskStep {
  const { x0, y0, m, b, a, c, d } = sp;
  const A = a + c * m; const B = c * b;
  const q = mkq(S(K7), 'substitution', {
    prompt: `Substitute y = ${lin(m, b)} into the second rule, then balance to find x.`,
    expression: `${stdForm(a, c, d)},  y = ${lin(m, b)}`,
    answer: x0,
    hint: 'Swap y for its expression (in brackets), distribute, combine the x-terms, then balance.',
    steps: [`Replace y: ${subText(a, c, m, b, d)}.`, `Distribute and combine: ${lin(A, B)} = ${fmt(d)}.`, ...solveLines(A, B, 0, d), `Then y = ${lin(m, b)} = ${fmt(y0)}.`],
  });
  return model(q, { kind: 'balance', a: A, b: B, c: 0, d, label: `After substituting: ${lin(A, B)} = ${fmt(d)}` }, [String(x0)], 'The scale shows the substituted equation. Balance until x stands alone.');
}

function substitutionTypedStep(rng: Rng): AskStep {
  const { x0, y0, m, b, a, c, d } = subParams(rng);
  const A = a + c * m; const B = c * b;
  return typed(mkq(S(K7), 'substitution-y', {
    prompt: 'Solve the system by substitution. What is y?',
    expression: `y = ${lin(m, b)},  ${stdForm(a, c, d)}`,
    answer: y0,
    hint: 'Put the first rule into the second, solve for x, then go back for y.',
    steps: [`${subText(a, c, m, b, d)}.`, `${lin(A, B)} = ${fmt(d)}, so x = ${fmt(x0)}.`, `y = ${lin(m, b).replace(/x/g, `(${fmt(x0)})`)} = ${fmt(y0)}.`],
  }));
}

function elimParams(rng: Rng) {
  const x0 = rnz(rng, -5, 5); const y0 = rnz(rng, -5, 5); const a1 = rint(rng, 1, 5); let a2 = rint(rng, 1, 5); if (a1 === a2) a2 = a1 === 5 ? 4 : a1 + 1; const k = rint(rng, 1, 4);
  return { x0, y0, a1, a2, k, c1: a1 * x0 + k * y0, c2: a2 * x0 - k * y0 };
}
const xy = (a: number, b: number, c: number) => `${coefTerm(a, 'x')} ${b < 0 ? '−' : '+'} ${coefTerm(Math.abs(b), 'y')} = ${fmt(c)}`;

function eliminationChooseStep(rng: Rng): AskStep {
  const { a1, a2, k, c1, c2 } = elimParams(rng);
  const right = `${coefTerm(a1 + a2, 'x')} = ${fmt(c1 + c2)}`;
  const q = mkq(S(K7), 'elimination-add', {
    prompt: 'Add the two equations. What is left?',
    expression: `${xy(a1, k, c1)}   and   ${xy(a2, -k, c2)}`,
    answer: 0,
    hint: `${coefTerm(k, 'y')} and ${coefTerm(-k, 'y')} are opposites. Add the left sides together and the right sides together.`,
    steps: [`x-terms: ${coefTerm(a1, 'x')} + ${coefTerm(a2, 'x')} = ${coefTerm(a1 + a2, 'x')}. y-terms: ${coefTerm(k, 'y')} + (${coefTerm(-k, 'y')}) = 0.`, `Right sides: ${fmt(c1)} + ${par(c2)} = ${fmt(c1 + c2)}. So ${right}.`],
  });
  return choose(rng, q, right, [xy(a1 + a2, 2 * k, c1 + c2), `${coefTerm(a1 + a2, 'x')} = ${fmt(c1 - c2)}`, `${coefTerm(a1 - a2, 'x')} = ${fmt(c1 - c2)}`, `${coefTerm(a1 - a2, 'x')} = ${fmt(c1 + c2)}`, `${coefTerm(a1 + a2, 'x')} = ${fmt(-(c1 + c2))}`]);
}

function eliminationTypedStep(rng: Rng): AskStep {
  const { x0, y0, a1, a2, k, c1, c2 } = elimParams(rng); const askY = rng.next() < 0.5;
  return typed(mkq(S(K7), 'elimination', {
    prompt: `Solve by elimination. What is ${askY ? 'y' : 'x'}?`,
    expression: `${xy(a1, k, c1)},  ${xy(a2, -k, c2)}`,
    answer: askY ? y0 : x0,
    hint: 'The y-terms are opposites, so adding the equations wipes out y.',
    steps: [`Add: ${coefTerm(a1 + a2, 'x')} = ${fmt(c1 + c2)}, so x = ${fmt(x0)}.`, `Back into the first: ${a1 === 1 ? '' : a1}(${fmt(x0)}) + ${coefTerm(k, 'y')} = ${fmt(c1)}, so ${k === 1 ? `y = ${fmt(y0)}` : `${coefTerm(k, 'y')} = ${fmt(c1 - a1 * x0)} and y = ${fmt(y0)}`}.`],
  }));
}

/**
 * Elimination when nothing cancels yet. scale: A1·x + t·s·y = C1 and A2·x + s·y = C2 (multiply the second by −t, then add).
 * sub: equal y-coefficients, A1·x + B·y = C1 and A2·x + B·y = C2 (subtract the second from the first).
 */
function elimPlanParams(rng: Rng, sub = rng.next() < 0.35) {
  const x0 = rnz(rng, -4, 4); const y0 = rnz(rng, -4, 4);
  const t = sub ? 1 : pick(rng, [2, 3]); const s = sub ? pick(rng, [2, 3, 4]) : pick(rng, [1, 1, 2]);
  const A2 = rint(rng, 1, 4); let A1 = rint(rng, 1, 5); if (A1 === t * A2) A1 = t * A2 + 1;
  const B1 = t * s; const B2 = s;
  return { sub, x0, y0, t, A1, B1, C1: A1 * x0 + B1 * y0, A2, B2, C2: A2 * x0 + B2 * y0, mult: sub ? -1 : -t };
}
type ElimP = ReturnType<typeof elimPlanParams>;
const elimExpr = (e: ElimP) => `${xy(e.A1, e.B1, e.C1)}   and   ${xy(e.A2, e.B2, e.C2)}`;
function elimPlanLines(e: ElimP): string[] {
  const X = e.A1 + e.mult * e.A2; const R = e.C1 + e.mult * e.C2;
  return [
    e.sub ? `The y-terms are equal (${coefTerm(e.B1, 'y')} and ${coefTerm(e.B2, 'y')}), so subtract the second equation from the first.` : `${coefTerm(e.B1, 'y')} and ${coefTerm(e.B2, 'y')} do not cancel yet. Multiply the second by ${fmt(e.mult)}: ${xy(e.mult * e.A2, e.mult * e.B2, e.mult * e.C2)}.`,
    `${e.sub ? 'Subtract' : 'Add'}: ${coefTerm(X, 'x')} = ${fmt(R)}${X === 1 ? '' : `, so x = ${fmt(e.x0)}`}.`,
    `Back into the second: ${e.A2 === 1 ? '' : e.A2}(${fmt(e.x0)}) + ${coefTerm(e.B2, 'y')} = ${fmt(e.C2)}, so y = ${fmt(e.y0)}.`,
  ];
}

function eliminationPlanStep(rng: Rng, e: ElimP = elimPlanParams(rng)): AskStep {
  const right = e.sub ? 'Subtract the second from the first' : `Multiply the second by −${e.t}, then add`;
  const wrongs = e.sub
    ? ['Add them as they are', `Multiply the second by ${e.B2}, then add`, `Subtract ${e.B2} from the second only`]
    : ['Add them as they are', `Multiply the second by ${e.t}, then add`, `Subtract ${e.t} from the second only`];
  const q = mkq(S(K7), 'elimination-plan', {
    prompt: 'Which move eliminates y?',
    expression: elimExpr(e),
    answer: 0,
    hint: 'Adding only wipes out y when the y-terms are opposites. What would make them opposites, or equal so you can subtract?',
    steps: [...elimPlanLines(e).slice(0, 2)],
  });
  return choose(rng, q, right, wrongs);
}

function eliminationScaledStep(rng: Rng, e: ElimP = elimPlanParams(rng)): AskStep {
  const askY = rng.next() < 0.4;
  return typed(mkq(S(K7), 'elimination-scaled', {
    prompt: `Solve by elimination. What is ${askY ? 'y' : 'x'}?`,
    expression: elimExpr(e),
    answer: askY ? e.y0 : e.x0,
    hint: e.sub ? 'The y-terms are equal: subtract one equation from the other.' : 'Scale the second equation so its y-term is the opposite of the first, then add.',
    steps: elimPlanLines(e),
  }));
}
/** Plan the elimination, then carry it out on the same system. */
function eliminationPair(rng: Rng): AskStep[] {
  const e = elimPlanParams(rng);
  return [eliminationPlanStep(rng, e), eliminationScaledStep(rng, e)];
}

function howManyStep(rng: Rng): AskStep {
  const kind = rint(rng, 0, 2); // 0 one, 1 none, 2 infinitely many
  const m = pick(rng, [1, 2, 3, -1, -2, -3]); const b = rnz(rng, -5, 5); const kk = pick(rng, [2, 3]);
  let m2 = m; let b2 = b;
  if (kind === 0) { m2 = m === 2 ? -1 : 2; let x0 = rnz(rng, -3, 3); b2 = b + (m - m2) * x0; if (b2 === 0 && b === 0) { x0 += 1; b2 = b + (m - m2) * x0; } }
  if (kind === 1) b2 = b + pick(rng, [2, 3, -2, -4]);
  let A = -kk * m2; let B = kk; let C = kk * b2; if (A < 0) { A = -A; B = -B; C = -C; }
  const one = 'Exactly one solution'; const none = 'No solution'; const inf = 'Infinitely many solutions';
  const right = [one, none, inf][kind];
  const q = mkq(S(K7), 'how-many', {
    prompt: 'How many points do these two rails share?',
    expression: `${yEq(m, 1, b)}  and  ${xy(A, B, C)}`,
    answer: 0,
    hint: 'Rewrite the second rule as y = mx + b. Compare the slopes, then the intercepts.',
    steps: [`The second rule is ${yEq(m2, 1, b2)}.`, kind === 0 ? 'Different slopes: the lines cross exactly once.' : kind === 1 ? 'Same slope, different intercept: parallel lines never meet. No solution (not "zero").' : 'Same slope AND same intercept: it is the same line, so every point on it works.'],
  });
  return choose(rng, q, right, [one, none, inf, 'One solution: x = 0']);
}

function checkPointStep(rng: Rng): AskStep {
  const { x0, y0, m1, m2, b1, b2 } = sysParams(rng);
  const right = P(x0, y0);
  const q = mkq(S(K7), 'check-point', {
    prompt: 'Which point solves BOTH equations?',
    expression: `${yEq(m1, 1, b1)}  and  ${yEq(m2, 1, b2)}`,
    answer: 0,
    hint: 'Substitute each point into both equations. It must make both true, not just one.',
    steps: [`${P(x0, y0)}: ${fmt(m1 * x0 + b1)} = ${fmt(y0)} ✓ and ${fmt(m2 * x0 + b2)} = ${fmt(y0)} ✓.`, 'The other points each fail at least one equation.'],
  });
  return choose(rng, q, right, [P(x0 + 1, y0 + m1), P(x0 + 1, y0 + m2), x0 !== y0 ? P(y0, x0) : P(x0, -y0 - 1), P(x0 - 1, y0 - m1), P(x0 - 1, y0 - m2)]);
}

function pumpMixStep(rng: Rng): AskStep {
  const big = pick(rng, [30, 40, 50]); const small = pick(rng, [10, 20]); const x = rint(rng, 1, 6); const y = rint(rng, 1, 6); const n = x + y; const T = big * x + small * y;
  const q = mkq(S(K7), 'pump-mix', {
    prompt: `${n} pumps run together: big ones move ${big} L/min, small ones ${small} L/min. Together they move ${T} L/min. How many are big?`,
    expression: `${n} pumps  ·  ${big} or ${small} L/min each  ·  ${T} L/min total`,
    answer: x,
    hint: 'Two unknowns need two facts: one about how many pumps, one about the total flow. Then substitute.',
    steps: [`Count: b (big pumps) + s (small pumps) = ${lab(n, 'pumps')}. Flow: ${lab(big, 'L per min, big')} × b + ${lab(small, 'L per min, small')} × s = ${lab(T, 'L per min in all')}.`, `s = ${n} − b.`, `${big}b + ${small}(${n} − b) = ${T} → ${big - small}b + ${lab(small * n, 'L per min if all were small')} = ${T}.`, `${big - small}b = ${lab(T - small * n, 'extra L per min')}, so b = ${labn(x, 'big pump', 'big pumps')}.`],
  });
  return typed(q);
}

function cableCutStep(rng: Rng): AskStep {
  const s = rint(rng, 3, 12); const d = rint(rng, 2, 8); const L = 2 * s + d;
  const q = mkq(S(K7), 'cable-cut', {
    prompt: `A cable ${L} m long is cut into two pieces. One piece is ${d} m longer than the other. How long is the longer piece?`,
    expression: `${L} m cable  ·  two pieces  ·  one is ${d} m longer`,
    answer: s + d, unit: 'm',
    hint: 'Call the shorter piece b. The longer piece is b plus the difference, and the two pieces add up to the whole cable.',
    steps: [`Longer a, shorter b: a + b = ${lab(L, 'm of cable')} and a = b + ${lab(d, 'm extra')}.`, `(b + ${d}) + b = ${L} → 2b + ${lab(d, 'm extra')} = ${lab(L, 'm of cable')}.`, `2b = ${lab(L - d, 'm, two short pieces')}, b = ${lab(s, 'm, shorter piece')}.`, `a = ${lab(s, 'm, shorter piece')} + ${lab(d, 'm extra')} = ${lab(s + d, 'm, longer piece')}.`],
  });
  return typed(q);
}

/** Setting up the system is the hard part: pick the pair of equations that models the pumps. */
function pumpModelStep(rng: Rng): AskStep {
  const big = pick(rng, [30, 40, 50]); const small = pick(rng, [10, 20]); const x = rint(rng, 1, 6); const y = rint(rng, 1, 6); const n = x + y; const T = big * x + small * y;
  const right = `b + s = ${n},  ${big}b + ${small}s = ${T}`;
  const q = mkq(S(K7), 'pump-model', {
    prompt: `${n} pumps run together. Big ones move ${big} L/min, small ones ${small} L/min, ${T} L/min in all. Which system models it (b big, s small)?`,
    expression: 'Which pair of equations?',
    answer: 0,
    hint: 'One equation counts pumps. The other adds up flow: each pump count times its own rate.',
    steps: [`Count: b (big pumps) + s (small pumps) = ${lab(n, 'pumps')}.`, `Flow: ${lab(big, 'L per min, big')} × b + ${lab(small, 'L per min, small')} × s = ${lab(T, 'L per min in all')}, so ${big}b + ${small}s = ${T}.`],
  });
  return choose(rng, q, right, [`b + s = ${T},  ${big}b + ${small}s = ${n}`, `b + s = ${n},  ${small}b + ${big}s = ${T}`, `b + s = ${n},  ${big + small}(b + s) = ${T}`]);
}

/** 'start + rate·t' in story order: startRate(50, −4) → '50 − 4t'. */
const startRate = (st: number, r: number) => `${st} ${r < 0 ? '−' : '+'} ${coefTerm(Math.abs(r), 't')}`;
/** Mastery Trial transfer: two tanks given only as tables. Find each rate (slope), write both lines, find when they match (system). */
function pumpTablesStep(rng: Rng): AskStep {
  let rA = 3; let rB = 6; let s1 = 50; let s2 = 20; let T = 10;
  for (let g = 0; g < 40; g++) {
    rA = pick(rng, [-5, -4, -3, 2, 3, 4]); rB = rA + rint(rng, 2, 5); if (rB === 0) rB += 1;
    T = rint(rng, 5, 12); s2 = 5 * rint(rng, 2, 8); s1 = s2 + (rB - rA) * T;
    if (s2 + 4 * rB > 0 && s2 + rB * T >= 5 && s1 <= 150) break;
  }
  const row = (s: number, r: number) => [0, 2, 4].map((t) => fmt(s + r * t)).join(',  ');
  const q = mkq(S(K7), 'tank-tables', {
    prompt: 'Both tanks change at steady rates. From the log, when will they hold the same amount?',
    expression: 'Find each rate, then when they match',
    answer: T, unit: 'min',
    hint: 'Each rate is the change per minute (watch the time step). Write each tank as start + rate × t, then set them equal.',
    steps: [`Tank A: ${lab(fmt(2 * rA), 'L change')} ÷ ${lab(2, 'min')} = ${lab(fmt(rA), 'L per min')}, and it starts at ${lab(s1, 'litres')}, so A = ${startRate(s1, rA)}.`, `Tank B: ${lab(fmt(2 * rB), 'L change')} ÷ ${lab(2, 'min')} = ${lab(fmt(rB), 'L per min')}, and it starts at ${lab(s2, 'litres')}, so B = ${startRate(s2, rB)}.`, `Set them equal: ${startRate(s1, rA)} = ${startRate(s2, rB)}.`, `${rA > 0 ? `Subtract ${coefTerm(rA, 't')} from` : `Add ${coefTerm(-rA, 't')} to`} both sides: ${s1} = ${lin(rB - rA, s2, 't')}, where ${lab(rB - rA, 'L per min')} is how fast B gains on A.`, `Subtract ${lab(s2, 'litres, B at the start')}: ${lab(s1 - s2, 'litres apart at the start')} = ${coefTerm(rB - rA, 't')}.`, `Divide both sides by ${lab(rB - rA, 'L per min')}: t = ${lab(T, 'minutes')}.`, `Check: both hold ${lab(fmt(s1 + rA * T), 'litres')} at t = ${lab(T, 'min')}.`],
    visual: card('Tank log', ['t (min):  0,  2,  4', `Tank A (L):  ${row(s1, rA)}`, `Tank B (L):  ${row(s2, rB)}`]),
  });
  return typed(q);
}

/* ================================================================================================
 * 8. Exponent rules
 * ============================================================================================== */
const K8 = 'exponents';
function productRuleStep(rng: Rng): AskStep {
  const c1 = rint(rng, 2, 5); let c2 = rint(rng, 2, 5); if (c1 === 2 && c2 === 2) c2 = 3; const p = rint(rng, 2, 6); let qd = rint(rng, 2, 5); if (p === 2 && qd === 2) qd = 3;
  const right = mono(c1 * c2, p + qd);
  const q = mkq(S(K8), 'product-rule', {
    prompt: `A panel is ${mono(c1, p)} by ${mono(c2, qd)} units. Simplify its area.`,
    expression: `${mono(c1, p)} · ${mono(c2, qd)}`,
    answer: 0,
    hint: 'Multiply the numbers. For the x-parts, count the x factors: same base, so ADD the exponents.',
    steps: [`Numbers: ${c1} × ${c2} = ${c1 * c2}.`, `x${sup(p)} · x${sup(qd)} has ${p} + ${qd} = ${p + qd} factors of x: x${sup(p + qd)}.`, `So ${right}.`],
  });
  return choose(rng, q, right, [mono(c1 + c2, p + qd), mono(c1 * c2, p * qd), mono(c1 + c2, p * qd)]);
}

function powerRuleStep(rng: Rng): AskStep {
  // Avoid c = n = 2 (c·n = cⁿ) and p = n = 2 (p + n = p·n): there the wrong rule gives the right answer.
  const n = pick(rng, [2, 3]); const c = n === 2 ? pick(rng, [3, 4, 5]) : pick(rng, [2, 3]); const p = n === 2 ? rint(rng, 3, 4) : rint(rng, 2, 4);
  const right = mono(c ** n, p * n);
  const q = mkq(S(K8), 'power-rule', {
    prompt: 'Simplify the power of a power.',
    expression: `(${mono(c, p)})${sup(n)}`,
    answer: 0,
    hint: `The outside exponent applies to EVERYTHING inside: the ${c} and the x${sup(p)}.`,
    steps: [`(${mono(c, p)})${sup(n)} = ${Array(n).fill(mono(c, p)).join(' · ')}.`, `${c}${sup(n)} = ${c ** n}, and x${sup(p)} ${n} times is x${sup(p * n)} (multiply the exponents).`, `So ${right}.`],
  });
  return choose(rng, q, right, [mono(c, p * n), mono(c ** n, p + n), mono(c * n, p * n), mono(c ** n, p), mono(c * n, p + n)]);
}

function quotientRuleStep(rng: Rng): AskStep {
  // c2 = k = 2 would make c1 − c2 equal k, so the subtract-the-numbers slip would give the right answer.
  const c2 = rint(rng, 2, 4); const k = c2 === 2 ? rint(rng, 3, 5) : rint(rng, 2, 5); const c1 = c2 * k; const p = rint(rng, 5, 9); const qd = rint(rng, 2, p - 2);
  const right = mono(k, p - qd);
  const wr = [mono(k, p + qd), mono(c1 - c2, p - qd)]; if (p % qd === 0) wr.push(mono(k, p / qd)); else wr.push(mono(c1 - c2, p + qd));
  wr.push(mono(c1, p - qd), mono(k, p * qd));
  const q = mkq(S(K8), 'quotient-rule', {
    prompt: 'Simplify the quotient.',
    expression: `${mono(c1, p)} ÷ ${mono(c2, qd)}`,
    answer: 0,
    hint: 'Divide the numbers. For the x-parts, cancel matching factors: SUBTRACT the exponents.',
    steps: [`Numbers: ${c1} ÷ ${c2} = ${k}.`, `x${sup(p)} ÷ x${sup(qd)}: ${qd} factors cancel, leaving x${sup(p - qd)}.`, `So ${right}.`],
  });
  return choose(rng, q, right, wr);
}

function zeroNegChooseStep(rng: Rng): AskStep {
  const b = pick(rng, [2, 3, 4, 5, 10]); const zero = rng.next() < 0.3; const n = zero ? 0 : b === 10 ? rint(rng, 1, 3) : b >= 4 ? rint(rng, 1, 2) : rint(rng, 1, 3);
  const bn = b ** n; const right = zero ? '1' : `1/${bn}`;
  const q = mkq(S(K8), 'zero-negative', {
    prompt: 'The gauge dial reads this power. What value is that?',
    expression: `${b}${zero ? '⁰' : sup(-n)}`,
    answer: zero ? 1 : 1 / bn, answerText: right,
    hint: zero ? `Walk down the powers: ${b}³, ${b}², ${b}¹, … each step divides by ${b}. Or work out ${b}³ ÷ ${b}³ two ways: by the quotient rule and by cancelling.` : 'A negative exponent means "one over", not a negative number.',
    steps: zero ? [`${b}⁰ = ${b}³ ÷ ${b}³ = 1.`, 'Any non-zero number to the power 0 is 1, not 0.'] : n === 1 ? [`${b}⁻¹ = 1/${b}: one over, not negative.`] : [`${b}${sup(-n)} = 1/${b}${sup(n)}.`, `${b}${sup(n)} = ${bn}, so ${b}${sup(-n)} = ${right}.`],
  });
  // For n = 1, −bⁿ and −b·n are the same slip, so −1/bⁿ (a negative fraction) is the fallback.
  return choose(rng, q, right, zero ? ['0', fmt(b), `1/${b}`] : [`−${bn}`, `−${b * n}`, fmt(bn), `−1/${bn}`]);
}

function negExpTypedStep(rng: Rng): AskStep {
  const b = pick(rng, [2, 3, 4, 5, 10]); const n = b === 2 ? rint(rng, 1, 4) : rint(rng, 1, 2); const bn = b ** n;
  return typed(mkq(S(K8), 'negative-typed', {
    prompt: 'Write the value as a fraction.',
    expression: `${b}${sup(-n)} = ?`,
    answer: 1 / bn, fraction: true, answerText: `1/${bn}`,
    hint: 'Negative exponent: flip it to the bottom and make the exponent positive.',
    steps: [n === 1 ? `${b}⁻¹ = 1/${b}.` : `${b}${sup(-n)} = 1/${b}${sup(n)} = 1/${bn}.`],
  }));
}

function exponentTableStep(rng: Rng): AskStep {
  const b = pick(rng, [2, 4, 5, 10, 3]);
  const accept = [`1,1/${b},1/${b * b}`];
  if (b !== 3) accept.push(`1,${fmt(1 / b)},${fmt(1 / (b * b))}`);
  const q = mkq(S(K8), 'exponent-table', {
    prompt: `Each step down the table divides by ${b}. Keep the pattern going past zero.`,
    expression: `${b}¹, ${b}⁰, ${b}⁻¹, ${b}⁻²`,
    answer: 1,
    hint: `Start from ${b}¹ = ${b} and divide by ${b} each row.`,
    steps: [`${b} ÷ ${b} = 1, so ${b}⁰ = 1.`, `1 ÷ ${b} = 1/${b}, so ${b}⁻¹ = 1/${b}.`, `1/${b} ÷ ${b} = 1/${b * b}, so ${b}⁻² = 1/${b * b}.`],
  });
  return model(q, { kind: 'table', cols: ['n', `${b}ⁿ`], rows: [[1, b], [0, null], [-1, null], [-2, null]], label: `Divide by ${b} each row` }, accept, 'Fill the blanks (fractions like 1/4 are fine).');
}

function powerModelStep(rng: Rng): AskStep {
  const b = pick(rng, [2, 3, 5, 10]); const kind = rint(rng, 0, 2);
  let p = 0; let qd = 0; let ans = 0; let expr = '';
  if (kind === 0) { p = rint(rng, 2, 5); qd = rint(rng, 2, 4); ans = p + qd; expr = `${b}${sup(p)} · ${b}${sup(qd)}`; }
  else if (kind === 1) { p = rint(rng, 2, 4); qd = rint(rng, 2, 3); ans = p * qd; expr = `(${b}${sup(p)})${sup(qd)}`; }
  else { p = rint(rng, 5, 9); qd = rint(rng, 2, p - 2); ans = p - qd; expr = `${b}${sup(p)} ÷ ${b}${sup(qd)}`; }
  const exps = [...new Set([ans, p + qd, p * qd, Math.abs(p - qd), p, qd, ans + 1, ans - 1].filter((e) => e >= 1 && e <= 12))].sort((x, y) => x - y);
  const q = mkq(S(K8), 'power-tower', {
    prompt: 'Rebuild it as ONE power on the tower.',
    expression: expr,
    answer: b ** ans,
    hint: kind === 0 ? 'Multiplying the same base: add the exponents.' : kind === 1 ? 'A power of a power: multiply the exponents.' : 'Dividing the same base: subtract the exponents.',
    steps: [kind === 0 ? `${p} + ${qd} = ${ans}.` : kind === 1 ? `${p} × ${qd} = ${ans}.` : `${p} − ${qd} = ${ans}.`, `So ${expr} = ${b}${sup(ans)}.`],
  });
  return model(q, { kind: 'power', bases: [2, 3, 5, 10], exps }, [`${b}^${ans}`], 'Pick the base and the exponent.');
}

function exponentTypedStep(rng: Rng): AskStep {
  const kind = rint(rng, 0, 2); const p = rint(rng, 2, 7); const qd = rint(rng, 2, 5);
  const [expr, ans, why] = kind === 0 ? [`x${sup(p)} · x${sup(qd)}`, p + qd, `add: ${p} + ${qd}`] : kind === 1 ? [`(x${sup(p)})${sup(qd)}`, p * qd, `multiply: ${p} × ${qd}`] : [`x${sup(p + qd)} ÷ x${sup(qd)}`, p, `subtract: ${p + qd} − ${qd}`];
  return typed(mkq(S(K8), 'exponent-typed', {
    prompt: 'Write it as a single power of x. Type the exponent.',
    expression: `${expr} = x^?`,
    answer: ans,
    hint: 'Product: add. Power of a power: multiply. Quotient: subtract.',
    steps: [`Exponents ${why} = ${ans}.`],
  }));
}

function sciStep(rng: Rng): AskStep {
  const a = pick(rng, [2, 3, 4]); const b = pick(rng, [2, 2, 1.5]); const m = rint(rng, 2, 8); const n = rint(rng, 2, 8);
  const q = mkq(S(K8), 'scientific', {
    prompt: `A chip does ${a} × 10${sup(m)} operations per second for ${fmt(b)} × 10${sup(n)} seconds. Total = ${fmt(a * b)} × 10^?`,
    expression: `(${a} × 10${sup(m)})(${fmt(b)} × 10${sup(n)})`,
    answer: m + n,
    hint: 'Multiply the front numbers; multiply the powers of ten by adding their exponents.',
    steps: [`${lab(a, 'from the rate')} × ${lab(fmt(b), 'from the time')} = ${lab(fmt(a * b), 'front number')}.`, `10${sup(m)} · 10${sup(n)} = 10${sup(m + n)}.`, `Exponent: ${m + n}.`],
  });
  return typed(q);
}

function memoryStep(rng: Rng): AskStep {
  const r = rint(rng, 3, 8); const c = rint(rng, 4, 10);
  return typed(mkq(S(K8), 'memory-bank', {
    prompt: `A memory bank has 2${sup(r)} rows, each with 2${sup(c)} cells. How many cells, as a power of 2? Type the exponent.`,
    expression: `2${sup(r)} · 2${sup(c)} = 2^?`,
    answer: r + c,
    hint: 'Rows times cells per row. Same base: add the exponents.',
    steps: [`2${sup(r)} rows × 2${sup(c)} cells per row = 2${sup(r + c)} cells.`, `Exponent: ${r} + ${c} = ${r + c}.`],
  }));
}

/* ================================================================================================
 * 9. Polynomials
 * ============================================================================================== */
const K9 = 'polynomials';
const polyParams = (rng: Rng) => [rnz(rng, -9, 9), rnz(rng, -6, 6), rnz(rng, -5, 6)];

function polyTableStep(rng: Rng): AskStep {
  const A = polyParams(rng); const B = polyParams(rng); const sub = rng.next() < 0.5;
  const R = A.map((a, i) => (sub ? a - B[i] : a + B[i]));
  const q = mkq(S(K9), sub ? 'subtract-table' : 'add-table', {
    prompt: `Combine like terms, column by column. ${sub ? 'Subtracting Q flips the sign of EVERY term of Q.' : ''}`.trim(),
    expression: `(${polyStr(A)}) ${sub ? '−' : '+'} (${polyStr(B)})`,
    answer: R[2],
    hint: 'Only like terms combine: x² with x², x with x, numbers with numbers.',
    steps: [`x²: ${fmt(A[2])} ${sub ? '−' : '+'} ${par(B[2])} = ${fmt(R[2])}.  x: ${fmt(A[1])} ${sub ? '−' : '+'} ${par(B[1])} = ${fmt(R[1])}.  number: ${fmt(A[0])} ${sub ? '−' : '+'} ${par(B[0])} = ${fmt(R[0])}.`, `Result: ${polyStr(R)}.`],
  });
  return model(q, { kind: 'table', cols: ['x²', 'x', 'number'], rowLabels: ['P', 'Q', sub ? 'P − Q' : 'P + Q'], rows: [[A[2], A[1], A[0]], [B[2], B[1], B[0]], [null, null, null]], label: 'Coefficients' }, [`${R[2]},${R[1]},${R[0]}`], `Fill the ${sub ? 'P − Q' : 'P + Q'} row.`);
}

function subPolyStep(rng: Rng): AskStep {
  const A = polyParams(rng); const B = polyParams(rng);
  const right = polyStr(A.map((a, i) => a - B[i]));
  const q = mkq(S(K9), 'subtract', {
    prompt: 'Subtract the second load profile from the first.',
    expression: `(${polyStr(A)}) − (${polyStr(B)})`,
    answer: 0,
    hint: 'The minus sign in front of the bracket changes the sign of EVERY term inside it.',
    steps: [`−(${polyStr(B)}) = ${polyStr(B.map((b) => -b))}.`, `Add like terms: ${right}.`],
  });
  return choose(rng, q, right, [polyStr([A[0] + B[0], A[1] + B[1], A[2] - B[2]]), polyStr(A.map((a, i) => a + B[i])), polyStr([A[0] + B[0], A[1] - B[1], A[2] - B[2]])]);
}

function likeTermsStep(rng: Rng): AskStep {
  const a = rint(rng, 2, 6); const b = rint(rng, 2, 7); const c = rint(rng, 1, 5); let d = rnz(rng, -4, 4); if (b + d === 0) d += 1;
  const right = polyStr([0, b + d, a + c]);
  const q = mkq(S(K9), 'like-terms', {
    prompt: 'Simplify by combining like terms.',
    expression: `${mono(a, 2)} + ${mono(b, 1)} + ${mono(c, 2)} ${d < 0 ? '−' : '+'} ${mono(Math.abs(d), 1)}`,
    answer: 0,
    hint: 'x² terms combine only with x² terms, and x terms only with x terms. The exponents never change when you add.',
    steps: [`x² terms: ${a} + ${c} = ${a + c}.  x terms: ${b} ${fmtSigned(d)} = ${fmt(b + d)}.`, `So ${right}.`],
  });
  return choose(rng, q, right, [mono(a + b + c + d, 2), `${mono(a + c, 4)} ${b + d < 0 ? '−' : '+'} ${mono(Math.abs(b + d), 2)}`, mono(a + b + c + d, 3)]);
}

/** Area model for (a·x + side)(x + top). `pieces` labels [x², top-right, bottom-left, bottom-right]; '?' when omitted. */
function areaVis(top: string, side: string, a: number, pieces: [string, string, string, string] = [a === 1 ? 'x²' : `${a}x²`, '?', '?', '?']): Visual {
  const W1 = 4; const W2 = 1.6; const H1 = a === 1 ? 4 : 5; const H2 = 1.6;
  return {
    type: 'geo', items: [
      { t: 'poly', pts: [[0, H2], [W1, H2], [W1, H2 + H1], [0, H2 + H1]], fill: 'rgba(45,212,191,0.25)' },
      { t: 'poly', pts: [[W1, H2], [W1 + W2, H2], [W1 + W2, H2 + H1], [W1, H2 + H1]], fill: 'rgba(249,115,22,0.25)' },
      { t: 'poly', pts: [[0, 0], [W1, 0], [W1, H2], [0, H2]], fill: 'rgba(249,115,22,0.25)' },
      { t: 'poly', pts: [[W1, 0], [W1 + W2, 0], [W1 + W2, H2], [W1, H2]], fill: 'rgba(244,114,182,0.25)' },
      { t: 'text', p: [W1 / 2, H2 + H1 + 0.6], text: 'x' }, { t: 'text', p: [W1 + W2 / 2, H2 + H1 + 0.6], text: top },
      { t: 'text', p: [-0.7, H2 + H1 / 2], text: a === 1 ? 'x' : `${a}x` }, { t: 'text', p: [-0.7, H2 / 2], text: side },
      { t: 'text', p: [W1 / 2, H2 + H1 / 2], text: pieces[0] }, { t: 'text', p: [W1 + W2 / 2, H2 + H1 / 2], text: pieces[1] },
      { t: 'text', p: [W1 / 2, H2 / 2], text: pieces[2] }, { t: 'text', p: [W1 + W2 / 2, H2 / 2], text: pieces[3] },
    ],
  };
}

/** (a·x + p)(x + q) */
function areaParams(rng: Rng) { return { a: pick(rng, [1, 1, 2, 3]), p: rnz(rng, -5, 6), qd: rnz(rng, -5, 6) }; }
type AreaP = ReturnType<typeof areaParams>;
const areaPieces = ({ a, p, qd }: AreaP): [string, string, string, string] => [mono(a, 2), coefTerm(a * qd, 'x'), coefTerm(p, 'x'), fmt(p * qd)];

/** Build the four pieces of the area model: each cell is its row times its column. */
function areaModelStep(rng: Rng, ap: AreaP = areaParams(rng)): AskStep {
  const { a, p, qd } = ap; const [sq, tr, bl, br] = areaPieces(ap);
  const q = mkq(S(K9), 'area-model', {
    prompt: 'Build the area model: fill each piece as row × column.',
    expression: `(${lin(a, p)})(${lin(1, qd)})`,
    answer: a * qd,
    hint: 'Each piece is its row times its column, signs included. Type only the number in front: x² → 1, 2x² → 2, −3x → −3.',
    steps: [`${mono(a, 1)} · x = ${sq}; ${mono(a, 1)} · ${par(qd)} = ${tr}; ${par(p)} · x = ${bl}; ${par(p)} · ${par(qd)} = ${br}.`, `Pieces: ${sq}, ${tr}, ${bl} and ${br}. Add like terms: ${polyStr([p * qd, a * qd + p, a])}.`],
  });
  return model(q, { kind: 'table', cols: ['x', fmt(qd)], rowLabels: [mono(a, 1), fmt(p)], rows: [[null, null], [null, null]], label: `(${lin(a, p)})(${lin(1, qd)}): each piece = row × column` }, [`${a},${a * qd},${p},${p * qd}`], 'Fill each piece with its number: the x² piece, the two x-pieces and the number piece.');
}

/** Add the pieces: the two x-pieces are like terms. */
function areaCombineStep(rng: Rng, ap: AreaP = areaParams(rng)): AskStep {
  const { a, p, qd } = ap; const mid = a * qd + p; const con = p * qd;
  const q = mkq(S(K9), 'area-combine', {
    prompt: 'Now add the pieces. Combine like terms.',
    expression: `(${lin(a, p)})(${lin(1, qd)})`,
    answer: mid,
    hint: 'The two x-pieces are like terms: add them. The x² piece and the number piece stay as they are.',
    steps: [`Pieces: ${areaPieces(ap).join(', ')}.`, `x-pieces: ${fmt(a * qd)} ${fmtSigned(p)} = ${fmt(mid)}.`, `So ${polyStr([con, mid, a])}.`],
    visual: areaVis(fmt(qd), fmt(p), a, areaPieces(ap)),
  });
  return model(q, { kind: 'table', cols: ['x²', 'x', 'number'], rows: [[null, null, null]], label: `(${lin(a, p)})(${lin(1, qd)}) = __x² + __x + __` }, [`${a},${mid},${con}`], 'Enter the coefficients of the product.');
}
/** Build the pieces, then combine them: both asks share one product. */
function areaPair(rng: Rng): AskStep[] { const ap = areaParams(rng); return [areaModelStep(rng, ap), areaCombineStep(rng, ap)]; }

function foilChooseStep(rng: Rng): AskStep {
  const sq = rng.next() < 0.4; const p = rnz(rng, -6, 6); const qd = sq ? p : rnz(rng, -6, 6);
  const right = polyStr([p * qd, p + qd, 1]);
  const wr = sq ? [polyStr([p * p, 0, 1]), polyStr([p * p, p, 1]), polyStr([2 * p, 2 * p, 1]), polyStr([p * p, -2 * p, 1])] : [polyStr([p * qd, 0, 1]), polyStr([p + qd, p * qd, 1]), polyStr([-p * qd, p + qd, 1]), polyStr([p * qd, p - qd, 1]), polyStr([p * qd, -(p + qd), 1])];
  const q = mkq(S(K9), sq ? 'square-binomial' : 'binomial', {
    prompt: sq ? 'Square the binomial.' : 'Multiply the binomials.',
    expression: sq ? `(${lin(1, p)})²` : `(${lin(1, p)})(${lin(1, qd)})`,
    answer: 0,
    hint: sq ? `(x ${fmtSigned(p)})² means (x ${fmtSigned(p)})(x ${fmtSigned(p)}): four pieces, not two.` : 'Every term in the first bracket multiplies every term in the second: four pieces.',
    steps: [`x·x = x², x·${par(qd)} = ${coefTerm(qd, 'x')}, ${par(p)}·x = ${coefTerm(p, 'x')}, ${par(p)}·${par(qd)} = ${fmt(p * qd)}.`, `Combine: ${right}.`],
  });
  return choose(rng, q, right, wr);
}

function distributeMonoStep(rng: Rng): AskStep {
  const c = pick(rng, [2, 3, 4, -2, -3]); const A = [rnz(rng, -6, 6), rnz(rng, -5, 5), rint(rng, 1, 4)];
  const right = polyStr([0, c * A[0], c * A[1], c * A[2]]);
  const q = mkq(S(K9), 'monomial', {
    prompt: 'Distribute the monomial.',
    expression: `${mono(c, 1)}(${polyStr(A)})`,
    answer: 0,
    hint: `${mono(c, 1)} multiplies EVERY term. Multiply the numbers, and add 1 to each power of x.`,
    steps: [`${mono(c, 1)} · ${mono(A[2], 2)} = ${mono(c * A[2], 3)}; ${mono(c, 1)} · ${mono(A[1], 1)} = ${mono(c * A[1], 2)}; ${mono(c, 1)} · ${par(A[0])} = ${mono(c * A[0], 1)}.`, `So ${right}.`],
  });
  return choose(rng, q, right, [polyStr([A[0], A[1], 0, c * A[2]]), polyStr([c * A[0], c * A[1], 0, c * A[2]]), polyStr([0, c + A[0], c + A[1], c + A[2]]), polyStr([c * A[0], c * A[1], c * A[2]])]); // last: did not raise the powers (fallback when c + Aᵢ = c·Aᵢ)
}

function productCoefStep(rng: Rng): AskStep {
  const p = rnz(rng, -7, 7); const qd = rnz(rng, -7, 7); const askMid = rng.next() < 0.5;
  return typed(mkq(S(K9), 'product-coef', {
    prompt: `(${lin(1, p)})(${lin(1, qd)}) = x² + bx + c. What is ${askMid ? 'b' : 'c'}?`,
    expression: `${askMid ? 'b' : 'c'} = ?`,
    answer: askMid ? p + qd : p * qd,
    hint: askMid ? 'The x-term comes from the two outer-inner pieces: add them.' : 'The number term is the two numbers multiplied.',
    steps: [askMid ? `x-pieces: ${coefTerm(qd, 'x')} and ${coefTerm(p, 'x')}, so b = ${fmt(p)} + ${par(qd)} = ${fmt(p + qd)}.` : `c = ${par(p)} × ${par(qd)} = ${fmt(p * qd)}.`],
  }));
}

function borderStep(rng: Rng): AskStep {
  const w = rint(rng, 1, 4);
  const right = polyStr([4 * w * w, 4 * w, 1]);
  const q = mkq(S(K9), 'frame', {
    prompt: `A square plate of side x cm gets a frame ${w} cm wide on every side. What is the total area?`,
    expression: `plate side x cm  ·  frame ${w} cm wide`,
    answer: 0,
    hint: 'Sketch it: the frame sits on BOTH sides of the plate, left and right. Write the new side length, then square the whole binomial.',
    steps: [`Side = x (plate side) + ${lab(w, 'cm frame, left')} + ${lab(w, 'cm frame, right')} = x + ${lab(2 * w, 'cm of frame')}, because the frame is on both sides.`, `(x + ${2 * w})² = x² + ${4 * w}x + ${4 * w * w}, in cm².`],
  });
  // Slips: squared only the ends; frame counted once, (x + w)²; 4w for 4w² (equals the answer when w = 1); middle term not doubled.
  return choose(rng, q, right, [polyStr([4 * w * w, 0, 1]), polyStr([w * w, 2 * w, 1]), polyStr([4 * w, 4 * w, 1]), polyStr([4 * w * w, 2 * w, 1])]);
}

function tankBaseStep(rng: Rng): AskStep {
  const a = rint(rng, 2, 7); let b = rint(rng, 1, 5); if (b === a) b = a - 1;
  const right = polyStr([-a * b, a - b, 1]);
  const q = mkq(S(K9), 'tank-base', {
    prompt: `A tank base is (x + ${a}) m long and (x − ${b}) m wide. Which expression is its area?`,
    expression: `(x + ${a})(x − ${b})`,
    answer: 0,
    hint: 'Area = length × width. Multiply every term by every term, signs included.',
    steps: [`Area = length × width = (x + ${a})(x − ${b}): x² − ${coefTerm(b, 'x')} + ${a}x − ${a * b}.`, `= ${right}, in m².`],
  });
  return choose(rng, q, right, [polyStr([-a * b, 0, 1]), polyStr([a * b, a - b, 1]), polyStr([-a * b, a + b, 1])]);
}

/* ================================================================================================
 * 10. Factoring
 * ============================================================================================== */
const K10 = 'factoring';
const bin = (r: number, v = 'x') => `(${v} ${fmtSigned(r)})`;

/** g·x^qd·(a·x^(p−qd) ± b) with gcd(a, b) = 1, so the GCF is exactly g·x^qd. */
function gcfParams(rng: Rng) {
  const g = pick(rng, [2, 3, 4, 5, 6]); let a = rint(rng, 1, 5); let b = rnz(rng, -5, 5); if (gcd(a, b) !== 1) { a = 1; } if (Math.abs(b) === a && a !== 1) b = b > 0 ? 1 : -1;
  const p = rint(rng, 2, 4); const qd = rint(rng, 1, p - 1);
  return { g, a, b, p, qd, A: g * a, B: g * b };
}
type GcfP = ReturnType<typeof gcfParams>;

/** Find the GCF piece by piece: greatest common number, lowest shared power of x. */
function gcfTableStep(rng: Rng, gp: GcfP = gcfParams(rng)): AskStep {
  const { g, p, qd, A, B } = gp;
  const q = mkq(S(K10), 'gcf-table', {
    prompt: `Find the greatest common factor of ${mono(A, p)} ${B < 0 ? '−' : '+'} ${mono(Math.abs(B), qd)}.`,
    expression: `${mono(A, p)} ${B < 0 ? '−' : '+'} ${mono(Math.abs(B), qd)}`,
    answer: g,
    hint: 'Numbers: the biggest number that divides both. Powers: the smaller power, since both terms have at least that many x factors.',
    steps: [`Numbers: ${A} and ${Math.abs(B)} share ${g} as their greatest common factor.`, `Powers: x${sup(p)} and x${sup(qd)} both contain x${sup(qd)}.`, `GCF = ${mono(g, qd)}.`],
  });
  return model(q, { kind: 'table', cols: ['number', 'power of x'], rowLabels: [mono(A, p), mono(Math.abs(B), qd), 'GCF'], rows: [[A, p], [Math.abs(B), qd], [null, null]], label: 'Each term: its number and its power of x' }, [`${g},${qd}`], 'Fill the GCF row: the greatest common number and the lowest power of x.');
}

function gcfStep(rng: Rng, gp: GcfP = gcfParams(rng)): AskStep {
  const { g, a, b, p, qd, A, B } = gp; const sg = b < 0 ? '−' : '+';
  const right = `${mono(g, qd)}(${mono(a, p - qd)} ${sg} ${Math.abs(b)})`;
  const q = mkq(S(K10), 'gcf', {
    prompt: 'Pull out the GREATEST common factor.',
    expression: `${mono(A, p)} ${sg} ${mono(Math.abs(B), qd)}`,
    answer: 0,
    hint: 'Take the biggest number that divides both coefficients AND the lowest power of x they share. Check by distributing back.',
    steps: [`Numbers: gcd(${A}, ${Math.abs(B)}) = ${g}. Powers: both have at least x${sup(qd)}.`, `GCF = ${mono(g, qd)}. Divide each term by it: ${mono(a, p - qd)} and ${fmt(b)}.`, `So ${right}.`],
  });
  return choose(rng, q, right, [`${g}(${mono(a, p)} ${sg} ${mono(Math.abs(b), qd)})`, `${mono(g, qd)}(${mono(a, p)} ${sg} ${mono(Math.abs(b), qd)})`, `${mono(g, qd)}(${mono(a, p - qd)} ${sg} ${Math.abs(B)})`]);
}
/** Find the GCF, then factor it out: both asks share one expression. */
function gcfPair(rng: Rng): AskStep[] { const gp = gcfParams(rng); return [gcfTableStep(rng, gp), gcfStep(rng, gp)]; }

function trinParams(rng: Rng) {
  let r = 1; let s = 2;
  for (let g = 0; g < 30; g++) { r = rnz(rng, -7, 7); s = rnz(rng, -7, 7); if (r !== s && r !== -s && Math.abs(r * s) <= 42) break; }
  if (r === s || r === -s) { r = 2; s = 5; }
  return { r, s, b: r + s, c: r * s };
}

type TrinP = ReturnType<typeof trinParams>;
function trinomialStep(rng: Rng, t: TrinP = trinParams(rng)): AskStep {
  const { r, s, b, c } = t;
  const right = `${bin(r)}${bin(s)}`;
  const wr = [`${bin(-r)}${bin(-s)}`, `${bin(r)}${bin(-s)}`];
  // Compare factor pairs as unordered pairs, so (x + 1)(x + 7) never sits beside (x + 7)(x + 1).
  const key = (m: number, n: number) => `${Math.min(m, n)},${Math.max(m, n)}`;
  const used = new Set([key(r, s), key(-r, -s), key(r, -s)]);
  for (let u = 1; u <= Math.abs(c); u++) { if (c % u) continue; for (const [m, n] of [[u, c / u], [-u, -c / u]]) { if (m + n !== b && !used.has(key(m, n))) { used.add(key(m, n)); wr.push(`${bin(m)}${bin(n)}`); break; } } if (wr.length >= 3) break; }
  // Small c has few factor pairs: fall back on copying b and c straight into the brackets.
  for (const [m, n] of [[b, c], [-b, c], [-b, -c], [b, -c]]) { if (wr.length >= 3) break; if (m * n !== c || m + n !== b) { if (!used.has(key(m, n))) { used.add(key(m, n)); wr.push(`${bin(m)}${bin(n)}`); } } }
  const q = mkq(S(K10), 'trinomial', {
    prompt: 'Factor the trinomial.',
    expression: polyStr([c, b, 1]),
    answer: 0,
    hint: `Find two numbers that MULTIPLY to ${fmt(c)} and ADD to ${fmt(b)}. Watch the signs.`,
    steps: [`${fmt(r)} × ${par(s)} = ${fmt(c)} and ${fmt(r)} + ${par(s)} = ${fmt(b)}.`, `So ${polyStr([c, b, 1])} = ${right}.`],
  });
  return choose(rng, q, right, wr);
}

/** Factor pairs of c with the signs that can work (same sign as b when c > 0, opposite signs when c < 0): at most 4, always including r, s. */
function factorPairRows({ r, s, b, c }: TrinP): [number, number][] {
  const all: [number, number][] = []; const C = Math.abs(c);
  for (let u = 1; u * u <= C; u++) {
    if (C % u) continue;
    if (c > 0) { const sg = b > 0 ? 1 : -1; all.push([sg * u, sg * (C / u)]); }
    else { all.push([u, -C / u]); if (u !== C / u) all.push([-u, C / u]); }
  }
  const at = all.findIndex(([m, n]) => (m === r && n === s) || (m === s && n === r));
  if (at < 0) return [[r, s]];
  const from = Math.max(0, Math.min(at - 1, all.length - 4));
  return all.slice(from, from + 4);
}

/** The teach card's method as a build: list the factor pairs of c, add each pair, find the one that makes b. */
function factorSumsStep(rng: Rng, t: TrinP = trinParams(rng)): AskStep {
  const { r, s, b, c } = t; const rows = factorPairRows(t);
  const q = mkq(S(K10), 'factor-pair', {
    prompt: `To factor ${polyStr([c, b, 1])}, add each factor pair of ${fmt(c)}. Which pair makes ${fmt(b)}?`,
    expression: `m × n = ${fmt(c)},  m + n = ${fmt(b)}`,
    answer: b,
    hint: `Every row already multiplies to ${fmt(c)}. Add the two numbers in each row, signs included.`,
    steps: [rows.map(([m, n]) => `${fmt(m)} + ${par(n)} = ${fmt(m + n)}`).join(';  ') + '.', `Only ${fmt(r)} and ${fmt(s)} add to ${fmt(b)}, so ${polyStr([c, b, 1])} = ${bin(r)}${bin(s)}.`],
  });
  return model(q, { kind: 'table', cols: ['m', 'n', 'm + n'], rows: rows.map(([m, n]) => [m, n, null]), label: `Factor pairs of ${fmt(c)}: which adds to ${fmt(b)}?` }, [rows.map(([m, n]) => m + n).join(',')], 'Fill in each sum m + n.');
}
/** Add the pairs, then pick the factored form: both asks share one trinomial. */
function factorPair(rng: Rng): AskStep[] { const t = trinParams(rng); return [factorSumsStep(rng, t), trinomialStep(rng, t)]; }

function factorMissingStep(rng: Rng): AskStep {
  const { r, s, b, c } = trinParams(rng);
  return typed(mkq(S(K10), 'factor-missing', {
    prompt: 'One factor is known. Find the missing number.',
    expression: `${polyStr([c, b, 1])} = ${bin(r)}(x + ?)`,
    answer: s,
    hint: `The two numbers multiply to ${fmt(c)} and add to ${fmt(b)}.`,
    steps: [`${fmt(r)} × ? = ${fmt(c)}, so ? = ${fmt(s)}.`, `Check the sum: ${fmt(r)} + ${par(s)} = ${fmt(b)}.`],
  }));
}

function diffSquaresStep(rng: Rng): AskStep {
  // gcd(a, k) = 1, or the product is not fully factored: 4x² − 16 is 4(x + 2)(x − 2), not (2x + 4)(2x − 4).
  const a = pick(rng, [1, 1, 2, 3]); let k = rint(rng, 1, 9);
  for (let g = 0; g < 20 && gcd(a, k) !== 1; g++) k = rint(rng, 1, 9);
  if (gcd(a, k) !== 1) k = 1;
  const right = `(${lin(a, k)})(${lin(a, -k)})`;
  const q = mkq(S(K10), 'difference-squares', {
    prompt: 'Factor the difference of two squares.',
    expression: `${mono(a * a, 2)} − ${k * k}`,
    answer: 0,
    hint: 'a² − b² = (a + b)(a − b). What is squared to give each term?',
    steps: [`${mono(a * a, 2)} = (${coefTerm(a, 'x')})² and ${k * k} = ${k}².`, `So it is ${right}.`],
  });
  return choose(rng, q, right, [`(${lin(a, -k)})²`, `(${lin(a, k)})²`, a === 1 ? 'It does not factor' : `(x + ${k})(x − ${k})`]);
}

function whichDiffSquaresStep(rng: Rng): AskStep {
  const k = rint(rng, 2, 9); const n = pick(rng, [2, 3, 5, 6, 7, 8, 10, 12, 15, 18, 20]);
  const right = `x² − ${k * k}`;
  const q = mkq(S(K10), 'which-difference', {
    prompt: 'Which one factors as a difference of two squares?',
    expression: 'a² − b² = (a + b)(a − b)',
    answer: 0,
    hint: 'It must be a DIFFERENCE (minus), and both parts must be perfect squares.',
    steps: [`${right} = (x + ${k})(x − ${k}).`, `x² + ${k * k} is a sum; ${n} is not a perfect square, so x² − ${n} is not a difference of two whole-number squares; x² − ${2 * k}x + ${k * k} has three terms.`],
  });
  return choose(rng, q, right, [`x² + ${k * k}`, `x² − ${n}`, `x² − ${2 * k}x + ${k * k}`]);
}

function panelFactorStep(rng: Rng): AskStep {
  const { r, s, b, c } = trinParams(rng);
  const right = lin(1, s);
  const q = mkq(S(K10), 'panel-length', {
    prompt: `A panel's area is ${polyStr([c, b, 1])}. Its width is ${lin(1, r)}. What is its length?`,
    expression: `${polyStr([c, b, 1])} = ${bin(r)}(?)`,
    answer: 0,
    hint: 'Area = width × length: factor the area and match one factor to the width.',
    steps: [`${polyStr([c, b, 1])} = ${bin(r)}${bin(s)}.`, `So the length is ${right}.`],
  });
  return choose(rng, q, right, [lin(1, -s), lin(1, c), lin(1, b + r), lin(1, b), lin(1, -r)]);
}

function holeStep(rng: Rng): AskStep {
  const k = rint(rng, 2, 9);
  const right = `(x + ${k})(x − ${k})`;
  const q = mkq(S(K10), 'plate-hole', {
    prompt: `A square plate of side x has a square hole of side ${k} cut from it. The area left is x² − ${k * k}. Factor it.`,
    expression: `x² − ${k * k}`,
    answer: 0,
    hint: 'Big square minus small square: a difference of squares.',
    steps: [`The hole is ${k} × ${k} = ${lab(k * k, 'hole area')}, so x² − ${k * k} = x² − ${k}².`, `x² − ${k}² = ${right}.`],
  });
  return choose(rng, q, right, [`(x − ${k})²`, `(x + ${k})²`, `(x − ${k * k})(x + 1)`]);
}

/* ================================================================================================
 * 11. Quadratics by factoring
 * ============================================================================================== */
const K11 = 'quadratics';
const rootsText = (a: number, b: number) => { const [lo, hi] = a <= b ? [a, b] : [b, a]; return lo === hi ? `x = ${fmt(lo)}` : `x = ${fmt(lo)} or x = ${fmt(hi)}`; };
/** Two distinct roots in −5..5 (not opposites, so there is always an x-term). `nonzero` also rules out a root at 0. */
function rootParams(rng: Rng, nonzero = false) {
  let r1 = 1; let r2 = 2;
  for (let g = 0; g < 40; g++) { r1 = rint(rng, -5, 5); r2 = rint(rng, -5, 5); if (r1 !== r2 && r1 !== -r2 && Math.abs(r1 * r2) <= 20 && (!nonzero || (r1 !== 0 && r2 !== 0))) break; }
  if (r1 === r2 || r1 === -r2) { r1 = -2; r2 = 3; }
  return { r1, r2, c: [r1 * r2, -(r1 + r2), 1] };
}

function zeroProductStep(rng: Rng): AskStep {
  const { r1: n1, r2: n2 } = rootParams(rng, true);
  const right = rootsText(n1, n2);
  const q = mkq(S(K11), 'zero-product', {
    prompt: 'The product is zero. Solve.',
    expression: `${bin(-n1)}${bin(-n2)} = 0`,
    answer: 0,
    hint: 'If A · B = 0, then A = 0 or B = 0. Set each factor to zero and solve it.',
    steps: [`x ${fmtSigned(-n1)} = 0 gives x = ${fmt(n1)}; x ${fmtSigned(-n2)} = 0 gives x = ${fmt(n2)}.`, `${right}.`],
  });
  return choose(rng, q, right, [rootsText(-n1, -n2), rootsText(-n1, n2), rootsText(n1, -n2)]);
}

function rootsPlotStep(rng: Rng, drawn = false): AskStep {
  const { r1, r2, c } = rootParams(rng);
  const q = mkq(S(K11), drawn ? 'read-roots' : 'roots-plot', {
    prompt: drawn ? 'Tap both places where the parabola meets the x-axis.' : 'Factor, then tap both x-intercepts of the parabola.',
    expression: `y = ${polyStr(c)}`,
    answer: Math.max(r1, r2),
    hint: 'x-intercepts are where y = 0. Factor the quadratic and use the zero-product property.',
    steps: [`0 = ${polyStr(c)} = ${r1 === 0 ? 'x' : bin(-r1)}${r2 === 0 ? 'x' : bin(-r2)}.`, `${rootsText(r1, r2)}, so the intercepts are ${P(Math.min(r1, r2), 0)} and ${P(Math.max(r1, r2), 0)}.`],
  });
  return model(q, { kind: 'plot', range: [-6, 6, -8, 8], count: 2, label: `y = ${polyStr(c)}`, layers: drawn ? { fns: [{ fn: { kind: 'poly', c }, color: 'teal' }] } : undefined }, undefined, 'Tap both x-intercepts.', { rule: { kind: 'set', items: [`${r1},0`, `${r2},0`] } });
}

function largerRootStep(rng: Rng): AskStep {
  const { r1, r2, c } = rootParams(rng); const big = rng.next() < 0.5;
  return typed(mkq(S(K11), 'root-typed', {
    prompt: `Solve by factoring. Type the ${big ? 'larger' : 'smaller'} root.`,
    expression: `${polyStr(c)} = 0`,
    answer: big ? Math.max(r1, r2) : Math.min(r1, r2),
    hint: 'Factor into two brackets, then set each bracket to zero.',
    steps: [`${polyStr(c)} = ${r1 === 0 ? 'x' : bin(-r1)}${r2 === 0 ? 'x' : bin(-r2)}.`, `${rootsText(r1, r2)}.`],
  }));
}

function setZeroStep(rng: Rng): AskStep {
  let r1 = 0; let r2 = 0; let a = 0; let b = 0; let k = 0;
  for (let g = 0; g < 40; g++) { r1 = rnz(rng, -5, 5); r2 = rnz(rng, -5, 5); a = rnz(rng, -4, 5); b = a - (r1 + r2); k = -a * b - r1 * r2; if (r1 !== r2 && b !== 0 && k !== 0) break; }
  if (b === 0 || k === 0 || r1 === r2) { r1 = 3; r2 = -2; a = 2; b = a - 1; k = -a * b - r1 * r2; }
  const right = k > 0 ? `Expand, subtract ${k} from both sides` : `Expand, add ${-k} to both sides`;
  const q = mkq(S(K11), 'set-zero', {
    prompt: 'The product equals a number that is NOT zero. What is the right first move?',
    expression: `${bin(-a)}${bin(b)} = ${fmt(k)}`,
    answer: 0,
    hint: 'The zero-product property needs a 0 on one side. If A · B = 6, A and B could be 2 and 3, or 1 and 6…',
    steps: [`Expand: ${polyStr([-a * b, b - a, 1])} = ${fmt(k)}.`, `Get 0 on one side: ${polyStr([r1 * r2, -(r1 + r2), 1])} = 0.`, `Factor: ${bin(-r1)}${bin(-r2)} = 0, so ${rootsText(r1, r2)}.`],
  });
  return choose(rng, q, right, [`Set each factor equal to ${fmt(k)}`, 'Set each factor equal to 0', 'Square-root both sides']);
}

function commonFactorQuadStep(rng: Rng): AskStep {
  const m = pick(rng, [1, 1, 2, 3]); const k = rnz(rng, -8, 8);
  const right = rootsText(0, k);
  const q = mkq(S(K11), 'common-factor', {
    prompt: 'Solve. Careful: do not divide by x.',
    expression: `${mono(m, 2)} = ${mono(m * k, 1)}`,
    answer: 0,
    hint: 'Move everything to one side and factor out x. Dividing by x throws away a solution.',
    steps: [`${mono(m, 2)} ${m * k < 0 ? '+' : '−'} ${mono(Math.abs(m * k), 1)} = 0.`, `${mono(m, 1)}(x ${fmtSigned(-k)}) = 0.`, `${right}.`],
  });
  return choose(rng, q, right, [xeq(k), 'x = 0', rootsText(0, -k)]);
}

function parabolaPickStep(rng: Rng): AskStep {
  // Non-zero roots: with a root at 0 the "one sign flipped" graph equals the right one (r2 = 0) or the "both flipped" one (r1 = 0).
  const { r1, r2, c } = rootParams(rng, true); const R: [number, number, number, number] = [-6, 6, -8, 8];
  const pv = (cc: number[]) => plotV(R, { fns: [{ fn: { kind: 'poly', c: cc }, color: 'teal' }] });
  // Options: right; both root signs flipped; opens downward; only the second root's sign flipped.
  const neg = [r1 * r2, r1 + r2, 1]; const down = c.map((v) => -v); const one = [r1 * -r2, -(r1 - r2), 1];
  const q = mkq(S(K11), 'pick-parabola', {
    prompt: 'Which graph shows this parabola?',
    expression: `y = ${r1 === 0 ? 'x' : bin(-r1)}${r2 === 0 ? 'x' : bin(-r2)}`,
    answer: 0,
    hint: 'Find where y = 0 from each factor. A positive x² opens upward.',
    steps: [`y = 0 when ${rootsText(r1, r2)}: it crosses at those x-values.`, 'The x² coefficient is +1, so it opens upward.'],
  });
  return pickLettered(rng, q, [pv(c), pv(neg), pv(down), pv(one)], 0);
}

function projectileStep(rng: Rng): AskStep {
  const v = pick(rng, [10, 15, 20, 25, 30]);
  const q = mkq(S(K11), 'projectile', {
    prompt: `Newton's test ball's height is h = −5t² + ${v}t metres. When does it land (h = 0, t > 0)?`,
    expression: `−5t² + ${v}t = 0`,
    answer: v / 5, unit: 's',
    hint: 'Factor out t. One solution is the launch; the other is the landing.',
    steps: [`Set h (height in m) = 0 and factor out t (seconds): t(−5t + ${v}) = 0.`, `t = 0 (launch) or −5t + ${v} = 0, so t = ${v} ÷ 5 = ${lab(v / 5, 'landing time in s')}.`],
  });
  return typed(q);
}

function padStep(rng: Rng): AskStep {
  const w = rint(rng, 3, 9); const d = rint(rng, 1, 5); const A = w * (w + d);
  const q = mkq(S(K11), 'pad-area', {
    prompt: `A crane pad is ${d} m longer than it is wide. Its area is ${A} m². How wide is it?`,
    expression: `${d} m longer than wide  ·  area ${A} m²`,
    answer: w, unit: 'm',
    hint: 'Call the width w and write the length using w. Width × length is the area; get 0 on one side and factor. A width cannot be negative.',
    steps: [`Width w (m), length w + ${lab(d, 'm longer')}: w(w + ${d}) = ${lab(A, 'area in m²')}.`, `w² + ${coefTerm(d, 'w')} − ${lab(A, 'area in m²')} = 0.`, `(w − ${w})(w + ${w + d}) = 0.`, `w = ${lab(w, 'width in m')}; the other root, −${w + d}, is not a length.`],
  });
  return typed(q);
}

/** Mastery Trial transfer: a height formula (Ch. 2), set equal to a target (Ch. 1), get 0 and factor (Ch. 10–11). */
function ballHeightStep(rng: Rng): AskStep {
  const r1 = rint(rng, 1, 3); const r2 = r1 + rint(rng, 1, 3); const v = 5 * (r1 + r2); const H = 5 * r1 * r2;
  const q = mkq(S(K11), 'ball-height', {
    prompt: `A test ball's height is h = −5t² + ${v}t metres after t seconds. When does it FIRST reach ${H} m?`,
    expression: `h = −5t² + ${v}t,  target ${H} m`,
    answer: r1, unit: 's',
    hint: 'Set the height equal to the target, get 0 on one side, and make the t² coefficient a friendly number before factoring.',
    steps: [`Set h = ${lab(H, 'target height in m')}: −5t² + ${v}t = ${H}.`, `Get 0 on one side: 5t² − ${v}t + ${H} = 0. Divide every term by 5: ${polyStr([r1 * r2, -(r1 + r2), 1], 't')} = 0.`, `Factor: (t − ${r1})(t − ${r2}) = 0, so t = ${labn(r1, 'second', 'seconds')} or t = ${labn(r2, 'second', 'seconds')}.`, `It first reaches ${H} m on the way up, at t = ${r1} s (and again on the way down at ${r2} s).`],
  });
  return typed(q);
}

/* ================================================================================================
 * Chapters
 * ============================================================================================== */
const CHAPTERS: ChapterSpec[] = [
  {
    key: K1, title: 'Multi-Step Equations', wing: 'foundry', wingName: 'Foundry Balance Hall',
    goal: 'Solve multi-step equations (brackets on both sides, like terms to combine, negative and fraction coefficients) by doing the same move to both sides of a balance; spot equations with no solution or every x as a solution; check by substituting.',
    misconception: 'Doing a move to one side only; "moving" a term across without changing its sign; distributing to the first term in a bracket only.',
    teach: [
      { title: 'An equation is a balance', text: 'Both pans weigh the same. Any move you make to one pan you must make to the other, or it tips. Undo + and − first, then × and ÷, until x stands alone.', steps: ['On the pans: 3x + 4 = 19.', 'Take 4 off both pans: 3x + 4 − 4 = 19 − 4, so 3x = 15.', 'Split both pans into 3 equal shares: 15 ÷ 3 = 5, so x = 5.', 'Check on the left pan: 3 × 5 + 4 = 19. Level.'], next: 'Try x = 4 on the left pan: what does 3x + 4 weigh, and which way does the balance tip?', model: { kind: 'balance', a: 3, b: 4, c: 0, d: 19 } },
      { title: 'x on both sides', text: 'Take the smaller x-term off both pans first. 5x + 3 = 2x + 12: subtract 2x from both, 3x + 3 = 12, subtract 3, 3x = 9, so x = 3. Check: 5(3) + 3 = 18 and 2(3) + 12 = 18. If the x-terms cancel and a false statement like 6 = 5 is left, no x works; if a true one like 6 = 6 is left, every x works.', visual: card('5x + 3 = 2x + 12', ['− 2x both sides:  3x + 3 = 12', '− 3 both sides:  3x = 9', '÷ 3 both sides:  x = 3']) },
      { title: 'Brackets first', text: 'A number in front of a bracket multiplies EVERY term inside: a(b + c) = ab + ac. Watch the signs: a negative times a negative is positive. Distribute first, then balance.', steps: ['−2 × x = −2x and −2 × (−3) = +6, so −2(x − 3) = −2x + 6.', 'Not −2x − 3 (the −3 was never multiplied) and not −2x − 6 (the sign slipped).', 'Test with x = 5: −2(5 − 3) = −2 × 2 = −4, and −2 × 5 + 6 = −10 + 6 = −4. They agree.', 'Then balance: −2(x − 3) = 10 becomes −2x + 6 = 10, so −2x = 4 and x = 4 ÷ (−2) = −2.'], visual: card('−2(x − 3)', ['−2 × x = −2x', '−2 × (−3) = +6', '= −2x + 6']) },
    ],
    quests: [
      { id: 'aq.alg1.equations.balance-pumps', name: 'The Balance Pumps', giver: 'ada', guided: true, hook: 'Ada: "Two pumps feed one main, and they fight unless their pressures match. Balance each equation, both pans every time."', change: 'The twin pumps hum in step; the main stops shuddering.',
        waves: [wave('Balance both pans', mixOf([balanceTwoSidesStep, multiStepBalanceStep, multiStepBalanceStep])), wave('Keep it level', mixOf([keepBalanceStep, whichSolutionStep, fracCoefStep])), wave('Brackets first', mixOf([distributeFirstStep, distributeBalanceStep, sameCoefStep]))] },
      { id: 'aq.alg1.equations.pressure-match', name: 'Pressure Match', giver: 'catalyst', hook: 'Dr. Catalyst: "My reactor valves are written with brackets. Distribute carefully: one dropped sign and the pressure spikes."', change: 'The reactor valves seal at matched pressure.',
        waves: [wave('Brackets', mixOf([distributeFirstStep, distributeBalanceStep, multiStepBalanceStep])), wave('Both sides', mixOf([balanceTwoSidesStep, sameCoefStep, multiStepTypedStep])), wave('Seal the valves', mixOf([fracCoefStep, multiStepBalanceStep, solveTypedStep]))] },
    ],
    concept: conceptFrom([multiStepBalanceStep, keepBalanceStep, sameCoefStep, distributeBalanceStep, whichSolutionStep]),
    transfer: oneOf([tankMeetStep, craneRentalStep]),
    practice: (rng) => multiStepTypedStep(rng).question,
  },
  {
    key: K2, title: 'Formulas & Literal Equations', wing: 'foundry', wingName: 'Foundry Formula Bench',
    goal: 'Rearrange engineering formulas (V = IR, d = rt, F = ma, P = 2l + 2w) to get any letter alone, then plug in numbers.',
    misconception: 'Treating letters as different from numbers; dividing only part of a side (l = P/2 − 2w); turning a fraction upside down.',
    teach: [
      { title: 'Letters are numbers in disguise', text: 'In V = IR, I multiplies R. To get R alone, undo the multiply: divide both sides by I. R = V/I. The same moves as the balance, just with letters.', steps: ['The circuit shows V = 12 volts and I = 3 amps; R is unknown.', 'V = IR becomes 12 (volts) = 3 (amps) × R (ohms).', 'Divide both sides by 3 (amps): 12 (volts) ÷ 3 (amps) = 4 (ohms), so R = 4 ohms.', 'Same move with letters: R = V/I.'], visual: { type: 'circuit', v: 12, i: 3, r: 4, ask: 'r' } },
      { title: 'Undo in reverse order', text: 'P = 2l + 2w. To free l: subtract 2w first, then divide the WHOLE side by 2. l = (P − 2w)/2. Dividing only the P is the classic slip.', steps: ['A frame with P = 34 (perimeter) and w = 5 (width).', '34 (perimeter) = 2l + 2 × 5 (width), so the pans read 2l + 10 (both widths) = 34 (perimeter).', 'Subtract 2w first: 34 (perimeter) − 10 (both widths) = 24 (both lengths), so 2l = 24.', 'Then halve the WHOLE side: 24 (both lengths) ÷ 2 = 12 (length), so l = 12.', 'Check: 2 × 12 (length) + 2 × 5 (width) = 24 + 10 = 34 (perimeter).'], next: 'Free w instead from P = 2l + 2w. Which do you undo first, the + 2l or the × 2?', model: { kind: 'balance', a: 2, b: 10, c: 0, d: 34, variable: 'l' } },
      { title: 'Check with numbers', text: 'Not sure a rearrangement is right? Put in easy numbers. V = 12 (volts) and I = 3 (amps) give R = 12/3 = 4 (ohms), and 3 (amps) × 4 (ohms) = 12 (volts). It checks.', steps: ['Rearranged: R = V/I. Pick easy numbers, V = 12 (volts) and I = 3 (amps).', '12 (volts) ÷ 3 (amps) = 4 (ohms), so R = 4.', 'Put it back into V = IR: 3 (amps) × 4 (ohms) = 12 (volts), which is V. It checks.', 'A wrong rearrangement, R = V × I, gives 12 (volts) × 3 (amps) = 36 (wrong R), and 3 (amps) × 36 (wrong R) = 108 (volts), not 12: caught.'], visual: card('R = V/I', ['V = 12, I = 3', 'R = 12/3 = 4', 'check: I × R = 3 × 4 = 12']) },
    ],
    quests: [
      { id: 'aq.alg1.formulas.ohms-bench', name: "Ohm's Workbench", giver: 'volt', guided: true, hook: 'Volt: "The bench has one formula, V = IR, and three unknowns. Learn to free any letter and the whole panel is yours."', change: 'The test bench panel lights, every meter labelled.',
        waves: [wave('Get it alone', times(3, rearrangeStep)), wave('Balance a formula', times(2, formulaBalanceStep)), wave('Fill the log', mixOf([formulaTableStep, formulaPlugStep, fixErrorStep]))] },
      { id: 'aq.alg1.formulas.formula-press', name: 'The Formula Press', giver: 'newton', hook: 'Newton: "Force, speed, fences, carts. Rearrange first, plug in second, and show me where the others slipped."', change: 'The formula press stamps clean, correct blueprints.',
        waves: [wave('Plug and solve', mixOf([formulaPlugStep, formulaPlugStep, formulaBalanceStep])), wave('Spot the slip', mixOf([fixErrorStep, rearrangeStep, rearrangeStep])), wave('Tables', mixOf([formulaTableStep, formulaBalanceStep, formulaPlugStep]))] },
    ],
    concept: conceptFrom([formulaBalanceStep, formulaTableStep, fixErrorStep, rearrangeStep]),
    transfer: oneOf([tempStep, densityStep]),
    practice: (rng) => formulaPlugStep(rng).question,
  },
  {
    key: K3, title: 'Inequalities', wing: 'foundry', wingName: 'Foundry Safety Interlocks',
    goal: 'Solve multi-step inequalities (brackets, x on both sides), flip the sign when multiplying or dividing by a negative, solve AND and OR compound inequalities and graph solutions on a number line.',
    misconception: 'Forgetting to flip the sign when dividing by a negative; mixing up open and closed dots; shading outside a compound "and" band.',
    teach: [
      { title: 'A balance that tips', text: 'An inequality is a tipped balance. Add or subtract the same amount on both sides and it tips the same way. 2x + 3 > 9 becomes 2x > 6, so x > 3.', steps: ['2x + 3 > 9', 'Take 3 off both sides: 9 − 3 = 6, so 2x > 6.', 'Halve both sides: 6 ÷ 2 = 3, so x > 3.', 'On the line: 3 itself fails, since 2 × 3 + 3 = 9 is not more than 9, so the dot at 3 is open and the ray points right.'], next: 'Test x = 0 in 2x + 3 > 9. True or false? Is 0 on the ray?', visual: rayV(3, 'right', true) },
      { title: 'Negatives flip the order', text: '2 < 5, but multiply both by −1 and −2 > −5. So when you multiply or divide by a negative, flip the sign: −3x ≤ 12 becomes x ≥ −4.', steps: ['On the line, 2 is left of 5: 2 < 5.', 'Multiply both by −1: 2 × (−1) = −2 and 5 × (−1) = −5.', 'Now −2 is right of −5, so −2 > −5: the order flipped.', '−3x ≤ 12: divide both sides by −3 and flip the sign. 12 ÷ (−3) = −4, so x ≥ −4.'], visual: { type: 'numline', min: -8, max: 8, step: 1, points: [{ x: -5, label: '−5' }, { x: -2, label: '−2' }, { x: 2, label: '2' }, { x: 5, label: '5' }] } },
      { title: 'Dots and bands', text: 'Open dot: the end is NOT included (< or >). Closed dot: it is (≤ or ≥). A compound inequality like −2 ≤ x < 3 is both at once: a band between two ends. OR means either piece works: x < −2 or x > 3 is two rays pointing away from each other.', steps: ['Solve −4 ≤ 2x < 6: halve all three parts. −4 ÷ 2 = −2 and 6 ÷ 2 = 3, so −2 ≤ x < 3.', '2 × (−2) = −4 is allowed by ≤, so −2 gets a closed dot.', '2 × 3 = 6 is not allowed by <, so 3 gets an open dot.', 'Every x between them is in: the band on the line.'], visual: { type: 'numline', min: -8, max: 8, step: 1, segment: { from: -2, to: 3, openLeft: false, openRight: true } } },
    ],
    quests: [
      { id: 'aq.alg1.inequalities.coolant-limits', name: 'Coolant Limits', giver: 'catalyst', guided: true, hook: 'Dr. Catalyst: "The coolant alarm trips on a range, not a number. Solve each limit and show me exactly which readings are safe."', change: 'The coolant alarms trip only when they should.',
        waves: [wave('Find the edge', times(3, edgeNumberlineStep)), wave('Flip or not', mixOf([flipStep, flipStep, (r) => ineqGraphPickStep(r)])), wave('Safe band', mixOf([compoundStep, compoundPickStep]))] },
      { id: 'aq.alg1.inequalities.interlock', name: 'The Safety Interlock', giver: 'volt', hook: 'Volt: "The interlock opens only inside the band. Negative gains everywhere, so watch your signs."', change: 'The interlock clicks shut; the line is safe to work on.',
        waves: [wave('Test the readings', mixOf([ineqMultNegStep, ineqTestPointStep, edgeNumberlineStep])), wave('Both sides', mixOf([ineqBothSidesStep, (r) => ineqGraphPickStep(r, true), edgeNumberlineStep])), wave('Bands and alarms', mixOf([compoundStep, orCompoundStep, edgeNumberlineStep]))] },
    ],
    concept: conceptFrom([edgeNumberlineStep, ineqBothSidesStep, ineqMultNegStep, compoundPickStep, (r) => ineqGraphPickStep(r, true)]),
    transfer: oneOf([ineqWordStep, budgetStep]),
    practice: (rng) => largestIntegerStep(rng).question,
  },
  {
    key: K4, title: 'Slope & Rate of Change', wing: 'rails', wingName: 'Rail Yard Grades',
    goal: 'Find slope as rise over run from two points, a table and a graph; read it as a rate of change with units; know zero and undefined slope.',
    misconception: 'Run over rise; subtracting in a different order on top and bottom; using the change in y without dividing by the change in x; calling a flat line "undefined".',
    teach: [
      { title: 'Rise over run', text: 'Slope is how much y changes for each 1 step in x. From (−1, −2) to (2, 4): rise 6, run 3, so the slope is 6 (rise) ÷ 3 (run) = 2 (slope). Two up for every one across.', next: 'Another point on the same rail is (1, 2). What is the slope from A to it?', visual: plotV(R6, { points: [{ x: -1, y: -2, label: 'A' }, { x: 2, y: 4, label: 'B' }], segments: [{ a: [-1, -2], b: [2, -2], dashed: true, label: 'run 3' }, { a: [2, -2], b: [2, 4], dashed: true, label: 'rise 6' }, { a: [-1, -2], b: [2, 4], color: 'teal' }] }) },
      { title: 'Same order, top and bottom', text: 'm = (y₂ − y₁)/(x₂ − x₁). Start both subtractions from the same point. Mix the order and the sign flips. A table works the same way: change in y over change in x, even when x jumps by 2.', steps: ['From (0, 50) to (2, 42): 42 (litres) − 50 (litres) = −8 (L change) over 2 (min) − 0 (min) = 2 (min), so −8/2 = −4 (L per min).', 'Both from the other end: (50 − 42)/(0 − 2) = 8/(−2) = −4 (L per min). Same slope.', 'Mixed order: (42 − 50)/(0 − 2) = −8/(−2) = 4 (wrong rate). Wrong sign: the tank is draining, not filling.', 'In the table, each 2-minute row changes V by 2 (min) × (−4 (L per min)) = −8 (litres).'], model: { kind: 'table', cols: ['t (min)', 'V (L)'], rows: [[0, 50], [2, 42], [4, null], [6, null]], label: 'Constant rate: fill the blanks' } },
      { title: 'Flat and vertical', text: 'A flat rail has no rise: slope 0. A vertical rail has no run, and you cannot divide by 0, so its slope is not defined (often called undefined). Uphill left to right is positive, downhill negative.', steps: ['Flat rail y = 2, through (−3, 2) and (1, 2):', '(2 − 2)/(1 − (−3)) = 0/4 = 0, so the slope is 0.', 'Vertical rail x = −2, through (−2, −4) and (−2, 3):', '(3 − (−4))/(−2 − (−2)) = 7/0, and you cannot divide by 0: not defined.'], visual: plotV([-5, 5, -5, 5], { fns: [{ fn: lineFn(0, 2), color: 'teal', label: 'm = 0' }], segments: [{ a: [-2, -5], b: [-2, 5], color: 'orange', label: 'not defined' }] }) },
    ],
    quests: [
      { id: 'aq.alg1.slope.rail-grades', name: 'Rail Grades', giver: 'ada', guided: true, hook: 'Ada: "The ore rails climb the hill in straight runs. Every run needs its grade stamped, rise over run, or the carts roll back."', change: 'Grade plates are bolted to every rail run.',
        waves: [wave('Lay the grade', times(3, slopeDrawStep)), wave('Read the grade', mixOf([slopeFromGraphStep, slopeTypedStep, slopeKindPickStep])), wave('Constant rate', mixOf([rateTableStep, slopeFromTableStep, slopeChooseStep]))] },
      { id: 'aq.alg1.slope.drain-rates', name: 'Drain Rates', giver: 'brick', hook: 'Brick: "The mine sumps drain at steady rates. Tables, graphs, two readings: I want the rate from all of them, sign and units."', change: 'The sump gauges show live drain rates.',
        waves: [wave('Tables', mixOf([rateTableStep, slopeFromTableStep, rateTableStep])), wave('Two readings', mixOf([slopeTypedStep, slopeChooseStep, slopeDrawStep])), wave('Flat or steep', mixOf([slopeKindPickStep, slopeDrawStep, slopeTypedStep]))] },
    ],
    concept: conceptFrom([slopeDrawStep, slopeFromGraphStep, slopeKindPickStep, rateTableStep]),
    transfer: oneOf([rateOfChangeStep, gradeStep]),
    practice: (rng) => slopeTypedStep(rng).question,
  },
  {
    key: K5, title: 'Graphing Lines', wing: 'rails', wingName: 'Rail Yard Layout',
    goal: 'Graph lines from slope-intercept, point-slope and standard form; find x- and y-intercepts; move between the forms.',
    misconception: 'Plotting b on the x-axis; reading y − 2 = 3(x + 1) as the point (1, 2); forgetting to divide every term when solving for y.',
    teach: [
      { title: 'Slope-intercept: y = mx + b', text: 'b is where the line crosses the y-axis, at (0, b): on the y-axis x = 0, so y = m·0 + b = b. From there, the slope m tells you the step: y = 2x − 3 starts at (0, −3) and goes 1 right, 2 up.', steps: ['y = 2x − 3 at x = 0: 2 × 0 − 3 = −3, the start (0, −3).', 'One step right, x = 1: 2 × 1 − 3 = −1, so (1, −1), 2 up.', 'Another step, x = 2: 2 × 2 − 3 = 1, so (2, 1). Those are the three dots.'], next: 'From (2, 1), take one more step: 1 right and 2 up. Which point do you land on?', visual: plotV(R6, { fns: [{ fn: lineFn(2, -3), color: 'teal', label: 'y = 2x − 3' }], points: [{ x: 0, y: -3, label: '(0, −3)' }, { x: 1, y: -1 }, { x: 2, y: 1 }] }) },
      { title: 'Point-slope: y − y₁ = m(x − x₁)', text: 'It names one point and the slope. Why: the slope from (x₁, y₁) to any point (x, y) on the line is (y − y₁)/(x − x₁) = m; multiply both sides by (x − x₁). The signs in the brackets are the opposite of the point: y − 2 = 3(x + 1) passes through (−1, 2), because x + 1 is x − (−1).', steps: ['Check (−1, 2) in y − 2 = 3(x + 1): 2 − 2 = 3 × (−1 + 1) = 0. Both sides 0.', 'Expand: y − 2 = 3x + 3, so y = 3x + 5: the line drawn.'], visual: plotV(R6, { fns: [{ fn: lineFn(3, 5), color: 'teal' }], points: [{ x: -1, y: 2, label: '(−1, 2)' }] }) },
      { title: 'Standard form: Ax + By = C', text: 'Fastest by intercepts. 2x + 3y = 6: set y = 0 to get x = 3; set x = 0 to get y = 2. Plot (3, 0) and (0, 2) and join them.', steps: ['y = 0: 2x + 3 × 0 = 6, so 2x = 6 and x = 6 ÷ 2 = 3.', 'x = 0: 2 × 0 + 3y = 6, so y = 6 ÷ 3 = 2.', 'Plot (3, 0) and (0, 2): the two intercepts.'], model: { kind: 'plot', range: R6, count: 2, label: '2x + 3y = 6: tap both intercepts' } },
    ],
    quests: [
      { id: 'aq.alg1.lines.rail-layout', name: 'The Rail Layout', giver: 'ada', guided: true, hook: 'Ada: "The surveyor left equations instead of drawings. Lay each rail on the grid, and mind where it crosses the axes."', change: 'New rails fan out across the yard, each on its surveyed line.',
        waves: [wave('Lay the rails', times(3, graphLineStep)), wave('Where it crosses', mixOf([interceptTapStep, interceptsBothStep, interceptTypedStep])), wave('Read the plans', mixOf([pointSlopeReadStep, whichEquationStep]))] },
      { id: 'aq.alg1.lines.switchyard', name: 'The Switchyard', giver: 'vector', hook: 'Vector: "Three forms, one line. A true engineer moves between them without losing a sign."', change: 'The switchyard points throw cleanly between every line.',
        waves: [wave('Point and slope', mixOf([pointSlopePlotStep, pointSlopeReadStep, pointSlopePlotStep])), wave('Change the form', mixOf([standardToSlopeStep, interceptsBothStep, lineGraphPickStep])), wave('Match the rail', mixOf([whichEquationStep, graphLineStep, standardToSlopeStep]))] },
    ],
    concept: conceptFrom([graphLineStep, interceptsBothStep, pointSlopeReadStep, lineGraphPickStep]),
    transfer: oneOf([spoolStep, costLineStep]),
    practice: (rng) => interceptTypedStep(rng).question,
  },
  {
    key: K6, title: 'Functions', wing: 'rails', wingName: 'Signal Tower Machines',
    goal: 'Use function notation, fill input-output tables, tell a function from a non-function (vertical line test), and read domain and range.',
    misconception: 'Reading f(3) as f times 3; thinking two inputs may not share an output; swapping domain and range.',
    teach: [
      { title: 'A machine with one output', text: 'A function takes each input to exactly ONE output. f(x) = 2x + 3 is the rule; f(4) means "put 4 in": 2(4) + 3 = 11 (output). It is not f times 4.', next: 'Put −1 into the machine. What is f(−1)?', model: { kind: 'table', cols: ['x (input)', 'f(x) (output)'], rows: [[0, 3], [1, 5], [4, null]], label: 'f(x) = 2x + 3' } },
      { title: 'The vertical line test', text: 'Slide a vertical line across a graph. If it ever hits twice, one input has two outputs: not a function. Two inputs sharing an output is fine, like a parabola.', steps: ['The drawn curve is two branches, y = 2√(x + 3) and y = −2√(x + 3).', '2√(1 + 3) = 2 × 2 = 4, so at x = 1 the top branch is at y = 4.', '−2√(1 + 3) = −2 × 2 = −4, so the bottom branch is at y = −4.', 'One input, 1, has two outputs, 4 and −4: not a function.', 'Compare y = x²: 2² = 4 and (−2)² = 4. Two inputs, one output: still a function.'], visual: plotV([-5, 5, -5, 5], { fns: [{ fn: { kind: 'sqrt', a: 2, h: -3 }, color: 'teal' }, { fn: { kind: 'sqrt', a: -2, h: -3 }, color: 'teal' }], vlines: [{ x: 1, label: 'hits twice' }] }) },
      { title: 'Domain and range', text: 'Domain: the inputs, read along the x-axis. Range: the outputs, read up the y-axis. A graph from (−2, 1) to (4, 5) has domain −2 ≤ x ≤ 4 and range 1 ≤ y ≤ 5.', steps: ['Left end x = −2, right end x = 4: domain −2 ≤ x ≤ 4.', 'Lowest y = 1, highest y = 5: range 1 ≤ y ≤ 5.', 'The segment is y = (2/3)x + 7/3.', '(2/3) × 4 + 7/3 = 8/3 + 7/3 = 15/3 = 5: at x = 4 the output is 5, the top of the range.'], visual: plotV(R6, { fns: [{ fn: lineFn(2 / 3, 1 + 4 / 3), from: -2, to: 4, color: 'teal' }], points: [{ x: -2, y: 1 }, { x: 4, y: 5 }] }) },
    ],
    quests: [
      { id: 'aq.alg1.functions.signal-machines', name: 'The Signal Machines', giver: 'volt', guided: true, hook: 'Volt: "Each signal box is a machine: one input, one output, every time. Feed them, and throw out any box that gives two answers."', change: 'The signal tower answers every input with one clean output.',
        waves: [wave('Feed the machine', mixOf([fnMeaningStep, fnTableStep, fnPlotPointStep])), wave('One output each', mixOf([isFunctionStep, vltPickStep, isFunctionStep])), wave('Inputs and outputs', mixOf([domainRangeStep, evalFnStep, fnTableStep]))] },
      { id: 'aq.alg1.functions.controller', name: 'The Gear Controller', giver: 'newton', hook: 'Newton: "The controller runs on f(x). Sometimes I know the input, sometimes the output. Work it both ways."', change: 'The gear controller runs smoothly in both directions.',
        waves: [wave('Evaluate', mixOf([evalChooseStep, evalFnStep, fnPlotPointStep])), wave('Work backward', mixOf([solveForInputStep, fnTableStep, solveForInputStep])), wave('Test the graphs', mixOf([vltPickStep, domainRangeStep, fnPlotPointStep]))] },
    ],
    concept: conceptFrom([fnTableStep, fnMeaningStep, vltPickStep, domainRangeStep, isFunctionStep]),
    transfer: pumpFnStep,
    practice: (rng) => evalFnStep(rng).question,
  },

  {
    key: K7, title: 'Systems of Equations', wing: 'junction', wingName: 'Systems Junction',
    goal: 'Solve a system of two linear equations by graphing, substitution and elimination, and tell when there is one solution, none, or infinitely many.',
    misconception: 'A point on one line counts as a solution; adding equations when the terms do not cancel; reading parallel lines as "the solution is 0".',
    teach: [
      { title: 'Two rules at once', text: 'A system asks for a point that obeys BOTH rules. On a graph, that is where the lines cross. y = x + 1 and y = −x + 5 meet at (2, 3): check 3 = 2 + 1 and 3 = −2 + 5.', steps: ['Where they meet, the two y values are equal: x + 1 = −x + 5.', 'Add x to both sides: 2x + 1 = 5, so 2x = 4 and x = 4 ÷ 2 = 2.', 'Then y = x + 1 gives 2 + 1 = 3: the crossing (2, 3) on the graph.', 'Check the orange line: −2 + 5 = 3. Both rules hold.'], next: 'The point (1, 2) is on the teal line. Is it on the orange line y = −x + 5 too?', visual: plotV(R6, { fns: [{ fn: lineFn(1, 1), color: 'teal', label: 'y = x + 1' }, { fn: lineFn(-1, 5), color: 'orange', label: 'y = −x + 5' }], points: [{ x: 2, y: 3, label: '(2, 3)' }] }) },
      { title: 'Substitution and elimination', text: 'Substitution: if y = 2x + 1, replace y in the other equation with (2x + 1): one unknown left. Elimination: each equation is a balance, and adding equal amounts to both pans keeps it level, so you may add one equation to the other. When the y-terms are opposites (+3y and −3y), y vanishes. If they are not, multiply an equation first: x + y = 5 times −3 gives −3x − 3y = −15.', steps: ['Add the equations: (2x + 3y) + (4x − 3y) = 12 + 6, so 6x = 18.', '18 ÷ 6 = 3, so x = 3.', 'Put x = 3 back: 2 × 3 + 3y = 12, so 3y = 6 and y = 2.', 'Check the other one: 4 × 3 − 3 × 2 = 12 − 6 = 6.'], visual: card('Elimination', ['  2x + 3y = 12', '+ 4x − 3y = 6', '  6x      = 18  →  x = 3']) },
      { title: 'None or infinitely many', text: 'Parallel lines (same slope, different intercept) never meet: no solution. Two equations for the same line share every point: infinitely many. It is the balance-hall rule again: when x cancels, 6 = 5 means no solution and 6 = 6 means every point works. Rewrite as y = mx + b to compare.', steps: ['Teal y = 2x + 1, orange y = 2x − 3: same slope 2, intercepts 1 and −3.', 'Set them equal: 2x + 1 = 2x − 3. Take 2x off both: 1 = −3, false. No solution.', 'Same line twice: 2y = 4x + 2 halves to y = 2x + 1. Setting 2x + 1 = 2x + 1 leaves 1 = 1: every point works.'], visual: plotV(R6, { fns: [{ fn: lineFn(2, 1), color: 'teal' }, { fn: lineFn(2, -3), color: 'orange' }] }) },
    ],
    quests: [
      { id: 'aq.alg1.systems.junction-signals', name: 'Junction Signals', giver: 'volt', guided: true, hook: 'Volt: "Two supply lines, one junction. The junction only switches at the exact point both lines agree on. Find it."', change: 'The junction signal switches on cue.',
        waves: [wave('Where they cross', (r) => [...graphSystemPair(r), systemPlotStep(r)]), wave('Substitute', (r) => [...substitutionPair(r), checkPointStep(r)]), wave('Eliminate', mixOf([eliminationChooseStep, eliminationPlanStep, howManyStep]))] },
      { id: 'aq.alg1.systems.crossing-rails', name: 'Crossing Rails', giver: 'vector', hook: 'Vector: "Some rails cross once, some run side by side forever, some are the same rail twice. Tell me which, then solve."', change: 'Every crossing in the junction is mapped and signalled.',
        waves: [wave('Eliminate', (r) => [...eliminationPair(r), eliminationPlanStep(r)]), wave('How many?', mixOf([howManyStep, howManyStep, (r) => systemPlotStep(r, false)])), wave('Prove it', (r) => [checkPointStep(r), substitutionTypedStep(r), ...graphSystemPair(r)])] },
    ],
    concept: conceptFrom([(r) => systemPlotStep(r), systemLayStep, substitutionBalanceStep, eliminationPlanStep, howManyStep, checkPointStep]),
    transfer: oneOf([pumpMixStep, cableCutStep, pumpModelStep]),
    practice: (rng) => eliminationTypedStep(rng).question,
  },
  {
    key: K8, title: 'Exponent Rules', wing: 'tower', wingName: 'Tower Power Gauges',
    goal: 'Use the product, quotient and power rules by counting factors, and explain why x⁰ = 1 and x⁻ⁿ = 1/xⁿ.',
    misconception: 'x³ · x⁴ = x¹² (multiplying exponents); (2x³)² = 2x⁶ (forgetting the coefficient); x⁰ = 0; 2⁻³ = −8.',
    teach: [
      { title: 'Count the factors', text: 'x³ · x⁴ = (x·x·x)(x·x·x·x): seven x factors, so x⁷. Same base multiplied: ADD the exponents. (x³)² is x³ · x³ = x⁶: a power of a power MULTIPLIES.', steps: ['2³ × 2⁴ = (2 × 2 × 2) × (2 × 2 × 2 × 2) = 8 × 16 = 128.', 'That is seven 2s: 3 + 4 = 7, and 2⁷ = 128.', '(2³)² = 2³ × 2³ = 8 × 8 = 64 = 2⁶, since 3 × 2 = 6.', 'On the tower: base 2, exponent 7 reads 128.'], next: 'What single power is 2⁵ × 2⁷? Set it on the tower.', model: { kind: 'power', bases: [2, 3, 5, 10], exps: [5, 7, 12] } },
      { title: 'Dividing cancels', text: 'x⁷ ÷ x³: three x factors cancel top and bottom, leaving x⁴. Same base divided: SUBTRACT the exponents.', steps: ['2⁷ ÷ 2³ = 128 ÷ 8 = 16.', '16 = 2⁴, and 7 − 3 = 4: subtract the exponents.', 'On the card: seven x factors over three, three pairs cancel, four are left: x⁴.'], visual: card('x⁷ ÷ x³', ['x·x·x·x·x·x·x', '÷ x·x·x', '= x⁴  (7 − 3)']) },
      { title: 'Zero and negative exponents', text: 'Walk down the powers of 2, dividing by 2 each step: 8, 4, 2, 1, 1/2, 1/4. So 2⁰ = 1 and 2⁻² = 1/4. A negative exponent means "one over", never a negative number.', model: { kind: 'table', cols: ['n', '2ⁿ'], rows: [[2, 4], [1, 2], [0, null], [-1, null]], label: 'Divide by 2 each row' } },
    ],
    quests: [
      { id: 'aq.alg1.exponents.power-gauges', name: 'The Power Gauges', giver: 'brick', guided: true, hook: 'Brick: "The tower gauges read in powers. Stack them right: add, multiply or subtract, and never guess which."', change: 'The tower gauges read true, from tiny to huge.',
        waves: [wave('Stack the tower', times(3, powerModelStep)), wave('Same base', mixOf([productRuleStep, quotientRuleStep, exponentTypedStep])), wave('Below zero', mixOf([exponentTableStep, zeroNegChooseStep]))] },
      { id: 'aq.alg1.exponents.magnitude', name: 'Magnitude Control', giver: 'catalyst', hook: 'Dr. Catalyst: "My reactions span from billionths to billions. Powers of ten, negative exponents, powers of powers: all of it."', change: 'The lab dials read cleanly across every magnitude.',
        waves: [wave('Powers of powers', mixOf([powerRuleStep, powerModelStep, productRuleStep])), wave('Negative and zero', mixOf([zeroNegChooseStep, negExpTypedStep, exponentTableStep])), wave('Mixed rules', mixOf([quotientRuleStep, powerModelStep, powerRuleStep]))] },
    ],
    concept: conceptFrom([powerModelStep, exponentTableStep, productRuleStep, zeroNegChooseStep]),
    transfer: oneOf([sciStep, memoryStep]),
    practice: (rng) => exponentTypedStep(rng).question,
  },
  {
    key: K9, title: 'Polynomials', wing: 'tower', wingName: 'Tower Load Floors',
    goal: 'Add and subtract polynomials by combining like terms, and multiply them with the area model and the distributive property.',
    misconception: 'Combining unlike terms (3x² + 2x = 5x³); subtracting only the first term of a bracket; (x + 3)² = x² + 9.',
    teach: [
      { title: 'Like terms only', text: 'Like terms have the same variable to the same power. 3x² + 5x² = 8x², but 3x² + 5x cannot combine: they are different kinds of piece, like beams and bolts. Adding never changes an exponent.', visual: card('Like terms', ['3x² + 5x² = 8x²', '4x − x = 3x', '3x² + 5x stays as it is']) },
      { title: 'Subtracting a bracket', text: '(5x² + 2x − 1) − (2x² − 3x + 4): the minus flips EVERY sign in the second bracket: 5x² + 2x − 1 − 2x² + 3x − 4 = 3x² + 5x − 5.', model: { kind: 'table', cols: ['x²', 'x', 'number'], rowLabels: ['P', 'Q', 'P − Q'], rows: [[5, 2, -1], [2, -3, 4], [null, null, null]], label: 'Subtract column by column' } },
      { title: 'The area model', text: 'To multiply two brackets, make them the sides of a rectangle. Each piece is one term times one term, and the product is all the pieces added. Four pieces, every time.', steps: ['(x + 3)(x + 2): across x and 2, down x and 3.', 'Pieces: x·x = x², 2·x = 2x, 3·x = 3x and 3 (down) × 2 (across) = 6 (number piece).', 'Add them: x² + 2x + 3x + 6 = x² + 5x + 6.', '13 × 12 = 156 and 100 + 50 + 6 = 156: with x = 10 both sides agree.', 'So (x + 3)² has TWO 3x pieces: x² + 6x + 9, not x² + 9.'], next: 'Draw (x + 4)(x + 1) as four pieces. What are they, and what do they add to?', visual: areaVis('2', '3', 1, ['x²', '2x', '3x', '6']) },
    ],
    quests: [
      { id: 'aq.alg1.polynomials.load-floors', name: 'The Load Floors', giver: 'ada', guided: true, hook: 'Ada: "Each tower floor has a load written as a polynomial. Combine the floors, like with like, and multiply the panels by area."', change: 'The tower floors are rated and safe to stack.',
        waves: [wave('Combine the floors', times(3, polyTableStep)), wave('Like with like', mixOf([likeTermsStep, subPolyStep, polyTableStep])), wave('Panels by area', (r) => [...areaPair(r), foilChooseStep(r)])] },
      { id: 'aq.alg1.polynomials.panel-press', name: 'The Panel Press', giver: 'newton', hook: 'Newton: "Every panel is length times width, and both are polynomials. Four pieces, every time, and mind the square."', change: 'The panel press stamps perfect plates.',
        waves: [wave('Area pieces', (r) => [...areaPair(r), distributeMonoStep(r)]), wave('Squares and products', mixOf([foilChooseStep, productCoefStep, foilChooseStep])), wave('Floors again', mixOf([subPolyStep, polyTableStep, areaModelStep]))] },
    ],
    concept: conceptFrom([polyTableStep, areaModelStep, foilChooseStep, subPolyStep]),
    transfer: oneOf([borderStep, tankBaseStep]),
    practice: (rng) => productCoefStep(rng).question,
  },
  {
    key: K10, title: 'Factoring', wing: 'tower', wingName: 'Tower Panel Splitter',
    goal: 'Factor out the greatest common factor, factor x² + bx + c by finding two numbers, and factor a difference of squares; check every factoring by multiplying back.',
    misconception: 'Pulling out a common factor that is not the greatest; sign errors in x² + bx + c; thinking x² + 9 factors like x² − 9.',
    teach: [
      { title: 'Factoring undoes multiplying', text: '6x² + 9x: both terms share 3 and x. Pull out 3x: 3x(2x + 3). Multiply back to check: 3x · 2x + 3x · 3 = 6x² + 9x.', visual: card('6x² + 9x', ['GCF = 3x', '6x² ÷ 3x = 2x,  9x ÷ 3x = 3', '= 3x(2x + 3)']) },
      { title: 'Two numbers', text: 'Why two numbers: (x + m)(x + n) = x² + mx + nx + mn = x² + (m + n)x + mn. So x² + 7x + 12 needs m × n = 12 and m + n = 7. Pairs of 12: 1·12, 2·6, 3·4. Only 3 + 4 = 7, so (x + 3)(x + 4). If c is negative, the two numbers have opposite signs.', model: { kind: 'table', cols: ['m', 'n', 'm + n'], rows: [[1, 12, null], [2, 6, null], [3, 4, null]], label: 'Factor pairs of 12: which adds to 7?' } },
      { title: 'Difference of squares', text: 'a² − b² = (a + b)(a − b): x² − 25 = (x + 5)(x − 5). In the area model the 5x and −5x pieces cancel, leaving x² − 25. A SUM like x² + 25 does not factor this way.', steps: ['(x + 5)(x − 5): pieces x², −5x, 5x and 5 (down) × (−5 (across)) = −25 (number piece).', '−5x + 5x = 0, so the middle pieces cancel: x² − 25.', '7² − 25 = 49 − 25 = 24 and (7 + 5)(7 − 5) = 12 × 2 = 24: with x = 7 both agree.'], next: 'Factor x² − 49 the same way. What is b?', visual: areaVis('−5', '5', 1, ['x²', '−5x', '5x', '−25']) },
    ],
    quests: [
      { id: 'aq.alg1.factoring.panel-splitter', name: 'The Panel Splitter', giver: 'brick', guided: true, hook: 'Brick: "Every big panel here was made by multiplying two smaller ones. Split them back apart, and check your cut by multiplying."', change: 'The splitter cuts every panel into its true factors.',
        waves: [wave('Find the pair', (r) => [...factorPair(r), factorSumsStep(r)]), wave('Split it', (r) => [...gcfPair(r), factorMissingStep(r)]), wave('Squares', mixOf([diffSquaresStep, whichDiffSquaresStep]))] },
      { id: 'aq.alg1.factoring.cut-plates', name: 'Cut Plates', giver: 'ada', hook: 'Ada: "Plates with holes, panels with unknown sides. Factor, and tell me the pieces."', change: 'The plate racks are sorted by their factors.',
        waves: [wave('Common factors', (r) => [...gcfPair(r), gcfStep(r)]), wave('Trinomials', (r) => [...factorPair(r), factorSumsStep(r)]), wave('Squares and sums', mixOf([whichDiffSquaresStep, diffSquaresStep, factorMissingStep]))] },
    ],
    concept: conceptFrom([factorSumsStep, gcfTableStep, whichDiffSquaresStep, trinomialStep]),
    transfer: oneOf([panelFactorStep, holeStep]),
    practice: (rng) => factorMissingStep(rng).question,
  },
  {
    key: K11, title: 'Quadratics by Factoring', wing: 'tower', wingName: 'Tower Arc Launcher',
    goal: 'Solve quadratic equations by factoring with the zero-product property, and connect the roots to the x-intercepts of the parabola.',
    misconception: 'Using the zero-product property when the product is not zero; flipping the signs of the roots; dividing by x and losing the root x = 0.',
    teach: [
      { title: 'The zero-product property', text: 'If A · B = 0, then A = 0 or B = 0: nothing else multiplies to zero. So (x − 2)(x + 3) = 0 gives x = 2 or x = −3. Note the signs: x + 3 = 0 means x = −3.', next: 'Solve (x − 4)(x + 1) = 0 in your head. Which two x values work?', visual: card('(x − 2)(x + 3) = 0', ['x − 2 = 0  →  x = 2', 'x + 3 = 0  →  x = −3']) },
      { title: 'Get a zero first', text: 'To solve x² − x = 6, move the 6: x² − x − 6 = 0. Factor: (x − 3)(x + 2) = 0, so x = 3 or x = −2. And x² = 5x becomes x(x − 5) = 0: x = 0 is a root too, so never divide by x.', visual: card('x² − x = 6', ['x² − x − 6 = 0', '(x − 3)(x + 2) = 0', 'x = 3 or x = −2']) },
      { title: 'Roots on the graph', text: 'The solutions of x² − x − 6 = 0 are where y = x² − x − 6 crosses the x-axis: at −2 and 3. Factoring finds the crossing points exactly.', model: { kind: 'plot', range: [-6, 6, -8, 8], count: 2, label: 'Tap where y = x² − x − 6 meets the x-axis', layers: { fns: [{ fn: { kind: 'poly', c: [-6, -1, 1] }, color: 'teal' }] } } },
    ],
    quests: [
      { id: 'aq.alg1.quadratics.arc-launcher', name: 'The Arc Launcher', giver: 'newton', guided: true, hook: 'Newton: "Every arc from the launcher is a parabola. Find where each one lands on the ground line, exactly, by factoring."', change: 'The launcher arcs land on their marks.',
        waves: [wave('Where it lands', times(3, (r) => rootsPlotStep(r, true))), wave('Zero product', mixOf([zeroProductStep, largerRootStep, commonFactorQuadStep])), wave('Match the arc', mixOf([parabolaPickStep, rootsPlotStep]))] },
      { id: 'aq.alg1.quadratics.ground-line', name: 'The Ground Line', giver: 'vector', hook: 'Vector: "No graphs drawn this time. Factor, find the roots, and put them on the ground line yourself."', change: 'The tower beacon traces perfect arcs across the city.',
        waves: [wave('Get a zero', mixOf([setZeroStep, commonFactorQuadStep, zeroProductStep])), wave('Roots on the axis', mixOf([rootsPlotStep, rootsPlotStep, parabolaPickStep])), wave('Solve it', mixOf([largerRootStep, setZeroStep, rootsPlotStep]))] },
    ],
    concept: conceptFrom([(r) => rootsPlotStep(r, true), zeroProductStep, parabolaPickStep, commonFactorQuadStep]),
    transfer: oneOf([projectileStep, padStep]),
    practice: (rng) => largerRootStep(rng).question,
  },
  {
    key: 'trial', title: 'Mastery Trial', wing: 'core', wingName: 'The Linear Core',
    goal: 'Prove Algebra 1 under trial rules: equations and inequalities, lines and functions, systems and exponents, polynomials and quadratics, and new problems.',
    misconception: 'Treating the forms as separate tricks; they are one idea: keep both sides equal and track every sign.',
    teach: [
      { title: 'Trial rules', text: 'Five phases, about twenty-five tasks across the whole academy, 80% to pass. Every chapter must be mastered first. Build with the models; check every answer by substituting.', visual: card('The Mastery Trial', ['Equations & inequalities', 'Slope, lines & functions', 'Systems & exponents', 'Polynomials & quadratics', 'Transfer']) },
    ],
    quests: [
      { id: 'aq.alg1.trial.rehearsal', name: 'Trial Rehearsal', giver: 'vector', guided: true, hook: 'Vector: "The Linear Core wakes for graduates only. A rehearsal first: same shape, no stakes."', change: 'The Linear Core chamber doors unseal.',
        waves: [wave('Equations and lines', mixOf([multiStepBalanceStep, ineqBothSidesStep, graphLineStep, fnTableStep])), wave('Systems and polynomials', mixOf([(r) => systemPlotStep(r), productRuleStep, areaModelStep, rootsPlotStep]))] },
      { id: 'aq.alg1.trial.keeper', name: 'The Core Keeper', giver: 'brick', hook: 'Brick: "The Keeper asks real problems from anywhere in the city. No hints about which chapter they came from."', change: 'The Keeper steps aside; the Core is in reach.',
        waves: [wave('Anything', mixOf([tankMeetStep, ineqWordStep, rateOfChangeStep, fnPlotPointStep])), wave('Anywhere', mixOf([pumpMixStep, (r) => systemPlotStep(r, false), borderStep, projectileStep]))] },
    ],
    concept: conceptFrom([multiStepBalanceStep, graphLineStep, (r) => systemPlotStep(r), rootsPlotStep]),
    transfer: oneOf([tankMeetStep, pumpMixStep, spoolStep]),
  },
];

export const ALGEBRA1 = defineAcademy({
  id: ID,
  name: 'Algebra 1 Academy',
  short: 'Algebra 1',
  tier: 'High School',
  blurb: 'Linear equations, inequalities, graphs, functions and polynomials.',
  icon: 'book',
  home: 'algebra-city',
  wings: {
    foundry: { name: 'Equation Foundry', icon: 'anvil' },
    rails: { name: 'Graph Rail Yard', icon: 'bridge' },
    junction: { name: 'Systems Junction', icon: 'circuit' },
    tower: { name: 'Polynomial Tower', icon: 'factory' },
    core: { name: 'The Linear Core', icon: 'reactor' },
  },
  chapters: CHAPTERS,
  trial: (rng) => [
    { name: 'Equations & inequalities', items: [multiStepBalanceStep(rng), sameCoefStep(rng), rearrangeStep(rng), formulaPlugStep(rng), ineqBothSidesStep(rng), compoundPickStep(rng)] },
    { name: 'Slope, lines & functions', items: [slopeTypedStep(rng), graphLineStep(rng), interceptsBothStep(rng), fnTableStep(rng), vltPickStep(rng), domainRangeStep(rng)] },
    { name: 'Systems & exponents', items: [systemLayStep(rng), eliminationPlanStep(rng), howManyStep(rng), productRuleStep(rng), zeroNegChooseStep(rng)] },
    { name: 'Polynomials & quadratics', items: [subPolyStep(rng), areaModelStep(rng), trinomialStep(rng), diffSquaresStep(rng), rootsPlotStep(rng), commonFactorQuadStep(rng)] },
    // Transfer: situations no chapter, quest or pool uses, each mixing chapters (tables → rates → system; formula → quadratic).
    { name: 'Transfer', items: [pumpTablesStep(rng), ballHeightStep(rng)] },
  ],
  trialIntro: 'The Mastery Trial of the Algebra 1 Academy. Five phases across the whole academy, 80% to pass. The Linear Core is listening.',
  coreName: 'The Linear Core',
  coreLine: 'Balances, rails, junctions and arcs, all in one engine. The Linear Core spins up, every rail in Algebra City lights along its line, and the road to the Geometry Academy opens.',
  coreColor: '#60a5fa',
  title: 'Algebra Adept',
});
