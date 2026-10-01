/**
 * The Calculus Academy (Advanced: AP Calculus AB/BC, first-year college). Limits and continuity, the
 * derivative as a limit of secant slopes, the rules, the chain rule and implicit differentiation,
 * transcendental derivatives, motion, related rates and optimisation, curve sketching,
 * antiderivatives and Riemann sums, the Fundamental Theorem with u-substitution, area and volume,
 * and infinite series. Symbolic derivatives and antiderivatives are chosen (their distractors are
 * the classic mistakes); typed answers are always numbers. See ../CONTENT_GUIDE.md.
 */
import { defineAcademy, type ChapterSpec } from '../defs';
import type { PlotLayers } from '../types';
import {
  academySkill, mkq, ask, typed, choose, model, wave, mixOf, conceptFrom, oneOf, rint, pick, rnz, fmt, fmtSigned, coefTerm, polyStr,
  fracStr, simplify, type Rng, type AskStep, type Fn, type Question, type Visual,
} from '../kit';
import { lab, labn } from '../../label';

const ID = 'calculus';
const S = (key: string) => academySkill(ID, key);

/* ------------------------------------------------------------------ */
/* formatting helpers                                                  */
/* ------------------------------------------------------------------ */
const SUPMAP: Record<string, string> = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻', '−': '⁻', '+': '⁺', x: 'ˣ', n: 'ⁿ', t: 'ᵗ', k: 'ᵏ', '(': '⁽', ')': '⁾' };
const SUBMAP: Record<string, string> = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', '-': '₋', '−': '₋' };
const supS = (s: string) => s.split('').map((ch) => SUPMAP[ch] ?? ch).join('');
const subS = (s: string) => s.split('').map((ch) => SUBMAP[ch] ?? ch).join('');
/** Exponent superscript; 1 prints nothing. */
const sup = (k: number) => (k === 1 ? '' : supS(String(k)));
/** x to a power: xp(1) = 'x', xp(3) = 'x³'. */
const xp = (n: number, v = 'x') => (n === 0 ? '1' : `${v}${sup(n)}`);
/** a·xⁿ: mono(3, 2) = '3x²', mono(−1, 3) = '−x³', mono(5, 0) = '5'. */
const mono = (a: number, n: number, v = 'x') => (n === 0 ? fmt(a) : coefTerm(a, xp(n, v)));
/** A fractional coefficient in front of a body: (3/4)x⁴, or 2x⁴ when it is whole. */
const fcoef = (n: number, d: number, body: string) => { const [p, q] = simplify(n, d); return q === 1 ? coefTerm(p, body) : `${p < 0 ? '−' : ''}(${Math.abs(p)}/${q})${body}`; };
const P = (c: number[], v = 'x') => polyStr(c, v);
const pfn = (c: number[]): Fn => ({ kind: 'poly', c });
const pev = (c: number[], x: number) => c.reduceRight((s, k) => s * x + k, 0);
const dpoly = (c: number[]) => c.slice(1).map((a, i) => a * (i + 1));
/** y = mx + b as text (integer m). */
const lineStr = (m: number, b: number) => (m === 0 ? fmt(b) : `${coefTerm(m, 'x')}${b ? ` ${fmtSigned(b)}` : ''}`);
/** e to the kx: e²ˣ, e⁻ˣ. */
const ekx = (k: number, v = 'x') => `e${supS(k === 1 ? v : k === -1 ? `-${v}` : `${k}${v}`)}`;
/** ∫ with limits: ∫₀². */
const intS = (a: number, b: number) => `∫${subS(String(a))}${supS(String(b))}`;
/** A multiple of π: piStr(81, 2) = '81π/2', piStr(1, 1) = 'π'. */
const piStr = (n: number, d: number) => { const [p, q] = simplify(n, d); const top = p === 1 ? 'π' : p === -1 ? '−π' : `${fmt(p)}π`; return q === 1 ? top : `${top}/${q}`; };
const round4 = (n: number) => Math.round(n * 1e4) / 1e4;
/** A number in a product: negatives get brackets, 3·(−4). */
const par = (n: number) => (n < 0 ? `(${fmt(n)})` : fmt(n));
/** x − a as text: 'x' when a is 0. */
const xMinus = (a: number, v = 'x') => (a === 0 ? v : `${v} ${fmtSigned(-a)}`);
/** A coefficient in front of a bracket: 1 → '', −1 → '−'. */
const lead = (m: number) => (m === 1 ? '' : m === -1 ? '−' : fmt(m));
/** Point-slope form y − f(a) = m(x − a), tidy. */
const pointSlope = (m: number, a: number, fa: number) => `${fa === 0 ? 'y' : `y ${fmtSigned(-fa)}`} = ${m === 0 ? '0' : `${lead(m)}(${xMinus(a)})`}`;
/** a(x − r1)(x − r2), with a bare x first when a root is 0. */
const factored = (a: number, r1: number, r2: number) => { const rs = [r1, r2].sort((p, q) => (p === 0 ? -1 : q === 0 ? 1 : 0)); return `${lead(a)}${rs.map((r) => (r === 0 ? 'x' : `(${xMinus(r)})`)).join('')}`; };
const plotV = (range: [number, number, number, number], layers: PlotLayers): Visual => ({ type: 'plot', range, layers });
const card = (title: string, lines: string[]): Visual => ({ type: 'card', title, lines });

/** Typed-answer fields for the fraction n/d. */
function fans(n: number, d: number) {
  const [a, b] = simplify(n, d);
  return { answer: a / b, fraction: b !== 1 ? true : undefined, answerText: b !== 1 ? fracStr(a, b) : undefined, negative: a < 0 ? true : undefined };
}
/** The strings a player might type into a table cell for n/d: '3/2' and '1.5' (when it terminates). */
function forms(n: number, d: number): string[] {
  const [a, b] = simplify(n, d);
  if (b === 1) return [String(a)];
  const out = [`${a}/${b}`]; let r = b; while (r % 2 === 0) r /= 2; while (r % 5 === 0) r /= 5;
  if (r === 1) out.push(String(round4(a / b)));
  return out;
}
/** Every combination of per-blank forms, joined with commas. */
const joinForms = (parts: string[][]): string[] => parts.reduce<string[]>((acc, p) => acc.flatMap((x) => p.map((y) => (x ? `${x},${y}` : y))), ['']);

/** Pick-the-graph with options lettered A–D in the order they are shown. */
function pickLettered(rng: Rng, q: Question, opts: { visual: Visual; right?: boolean }[]): AskStep {
  const sh = rng.shuffle(opts);
  const options = sh.map((o, i) => ({ visual: o.visual, label: `Graph ${'ABCD'[i]}` }));
  const right = options[sh.findIndex((o) => o.right)].label;
  return ask({ ...q, answerText: right }, 'pickmodel', { options, accept: [right] });
}

/* ================================================================== */
/* 1. Limits & continuity                                              */
/* ================================================================== */
const K1 = 'limits';

/** f(x) = (x − a)(x + m)/(x − a): a removable hole at x = a, limit a + m. */
function hole(rng: Rng) {
  const a = pick(rng, [1, 2, 3, -1, -2]);
  const m = pick(rng, [-4, -3, -2, -1, 1, 2, 3, 4].filter((v) => v !== -a));
  const num = [-a * m, m - a, 1]; const den = [-a, 1];
  return { a, m, L: a + m, numS: P(num), denS: P(den), restS: P([m, 1]), fn: { kind: 'rational', num, den } as Fn };
}

function limitTableStep(rng: Rng): AskStep {
  const h = hole(rng); const { a, L } = h;
  const q = mkq(S(K1), 'numerical limit', {
    prompt: `Vector's gauge formula f(x) = (${h.numS})/(${h.denS}) divides by zero at x = ${fmt(a)}. Where are its readings heading?`,
    expression: `lim x→${fmt(a)} f(x) = ?`, answer: L,
    hint: `Ignore x = ${fmt(a)} itself. Watch the f(x) column as x closes in from both sides.`,
    steps: [`From both sides the readings close in on ${fmt(L)}, so the limit is ${fmt(L)}, even though f(${fmt(a)}) does not exist.`, `Algebra agrees: ${h.numS} = (${h.denS})(${h.restS}), so f(x) = ${h.restS} for x ≠ ${fmt(a)}, and ${fmt(a)} ${fmtSigned(h.m)} = ${fmt(L)}.`],
    visual: plotV([a - 4, a + 4, L - 5, L + 5], { fns: [{ fn: h.fn }], points: [{ x: a, y: L, open: true }] }),
  });
  return model(q, { kind: 'table', cols: ['x', 'f(x)'], rows: [[a - 0.1, L - 0.1], [a - 0.01, L - 0.01], [a + 0.01, L + 0.01], [`→ ${fmt(a)}`, null]], label: `f(x) = (${h.numS})/(${h.denS})` }, [String(L)], `Fill the last row: the value f(x) approaches as x → ${fmt(a)}.`);
}

function factorLimitQ(rng: Rng): Question {
  const h = hole(rng);
  return mkq(S(K1), 'factor and cancel', {
    prompt: `Vector's flow meter reads 0/0 at x = ${fmt(h.a)}. Factor, cancel, then substitute to find the true reading.`,
    expression: `lim x→${fmt(h.a)} (${h.numS})/(${h.denS})`, answer: h.L,
    hint: `Factor the top: one of its factors is (${h.denS}).`,
    steps: [`Factor: ${h.numS} = (${h.denS})(${h.restS}).`, `Cancel (${h.denS}): for x ≠ ${fmt(h.a)} the function is just ${h.restS}.`, `Substitute x = ${fmt(h.a)}: ${fmt(h.a)} ${fmtSigned(h.m)} = ${lab(fmt(h.L), 'true reading')}.`],
    visual: plotV([h.a - 4, h.a + 4, h.L - 5, h.L + 5], { fns: [{ fn: h.fn }], points: [{ x: h.a, y: h.L, open: true }] }),
    app: 'Sensors and controllers divide by quantities that pass through zero; limits say what the reading really is.',
  });
}
const factorLimitStep = (rng: Rng) => typed(factorLimitQ(rng));

function factorChooseStep(rng: Rng): AskStep {
  const h = hole(rng);
  const q = mkq(S(K1), '0/0 is a clue', {
    prompt: `Ada plugs x = ${fmt(h.a)} into (${h.numS})/(${h.denS}) and gets 0/0. What is the limit?`,
    expression: `lim x→${fmt(h.a)} (${h.numS})/(${h.denS})`, answer: h.L,
    hint: '0/0 does not mean 0 and does not mean "no limit". It means a common factor is hiding.',
    steps: [`0/0 is a signal to simplify: ${h.numS} = (${h.denS})(${h.restS}).`, `After cancelling, substitute: ${fmt(h.a)} ${fmtSigned(h.m)} = ${fmt(h.L)}.`],
    visual: card('0/0 at x = ' + fmt(h.a), [`top: ${h.numS}`, `bottom: ${h.denS}`]),
  });
  return choose(rng, q, fmt(h.L), ['0', 'Does not exist', fmt(h.a - h.m), fmt(h.a)]);
}

/**
 * A jump at x = a: left piece heads to Lm, right piece heads to Lp. The filled dot f(a) sits on the
 * left end, the right end, or off both pieces, so "the limit is f(a)" is never a safe guess.
 */
function jump(rng: Rng) {
  const a = rint(rng, -1, 2); const Lm = rint(rng, -4, 4); let Lp = rint(rng, -4, 4); if (Lp === Lm) Lp = Lm > 0 ? Lm - 3 : Lm + 3;
  const p = rint(rng, -1, 1); const r = rint(rng, -1, 1);
  const where = pick(rng, ['left', 'right', 'off'] as const);
  const offs = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].filter((v) => v !== Lm && v !== Lp && 2 * v !== Lm + Lp);
  const fa = where === 'left' ? Lm : where === 'right' ? Lp : pick(rng, offs);
  const points: NonNullable<PlotLayers['points']> = [];
  if (fa !== Lm) points.push({ x: a, y: Lm, open: true });
  if (fa !== Lp) points.push({ x: a, y: Lp, open: true });
  points.push({ x: a, y: fa });
  const layers: PlotLayers = { fns: [{ fn: pfn([Lm - p * a, p]), to: a, color: 'teal' }, { fn: pfn([Lp - r * a, r]), from: a, color: 'teal' }], points };
  return { a, Lm, Lp, fa, layers, range: [a - 4, a + 4, -7, 7] as [number, number, number, number] };
}

function oneSidedPlotStep(rng: Rng): AskStep {
  const j = jump(rng); const left = rng.next() < 0.5; const target = left ? j.Lm : j.Lp;
  const q = mkq(S(K1), 'one-sided limits', {
    prompt: `The valve pressure jumps at x = ${fmt(j.a)}. Which point does the graph head to as x → ${fmt(j.a)}${left ? '⁻ (from the left)' : '⁺ (from the right)'}?`,
    expression: `lim x→${fmt(j.a)}${left ? '⁻' : '⁺'} f(x)`, answer: target,
    hint: `Trace the ${left ? 'left' : 'right'} piece toward x = ${fmt(j.a)}. The filled dot is f(${fmt(j.a)}), which may not be where the ${left ? 'left' : 'right'} piece goes.`,
    steps: [`Follow only the piece ${left ? 'to the left of' : 'to the right of'} x = ${fmt(j.a)}.`, `It heads to height ${fmt(target)}, so the limit is ${fmt(target)}: tap (${fmt(j.a)}, ${fmt(target)}).`],
    visual: plotV(j.range, j.layers),
  });
  return model(q, { kind: 'plot', range: j.range, count: 1, label: 'f near the jump', layers: j.layers }, [`${j.a},${target}`], `Tap the point the ${left ? 'left' : 'right'} piece approaches.`);
}

function limitExistsChoose(rng: Rng): AskStep {
  if (rng.next() < 0.5) {
    const j = jump(rng);
    const q = mkq(S(K1), 'does the limit exist', {
      prompt: `The graph jumps at x = ${fmt(j.a)}. What is the two-sided limit there?`, expression: `lim x→${fmt(j.a)} f(x)`, answer: 0,
      hint: 'A two-sided limit exists only when the left and right pieces head to the same height.',
      steps: [`From the left f heads to ${fmt(j.Lm)}; from the right to ${fmt(j.Lp)}.`, 'They differ, so the two-sided limit does not exist, whatever f(a) is.'],
      visual: plotV(j.range, j.layers),
    });
    const wrongs = [`${fmt(j.fa)}, the value f(${fmt(j.a)})`, ...(j.fa !== j.Lm ? [`${fmt(j.Lm)}, from the left`] : []), ...(j.fa !== j.Lp ? [`${fmt(j.Lp)}, from the right`] : []), fracStr(j.Lm + j.Lp, 2) + ', the average'];
    return choose(rng, q, 'Does not exist: the sides disagree', wrongs);
  }
  const a = rint(rng, -1, 2); const L = rint(rng, -3, 3); let fa = rint(rng, -4, 4); if (fa === L) fa = L > 0 ? L - 3 : L + 3; const p = rnz(rng, -1, 1);
  const layers: PlotLayers = { fns: [{ fn: pfn([L - p * a, p]) }], points: [{ x: a, y: L, open: true }, { x: a, y: fa }] };
  const q = mkq(S(K1), 'does the limit exist', {
    prompt: `The curve has a hole at x = ${fmt(a)}, and f(${fmt(a)}) = ${fmt(fa)} sits off the curve. What is the limit?`, expression: `lim x→${fmt(a)} f(x)`, answer: L,
    hint: 'A limit only cares about the values near x = a, never the value at a.',
    steps: [`From both sides the curve heads to ${fmt(L)}.`, `So the limit is ${fmt(L)}. The stray point f(${fmt(a)}) = ${fmt(fa)} does not change it.`],
    visual: plotV([a - 4, a + 4, -6, 6], layers),
  });
  return choose(rng, q, fmt(L), [fmt(fa), 'Does not exist: there is a hole', `${fmt(fa)} from one side, ${fmt(L)} from the other`]);
}

function infinityChoose(rng: Rng): AskStep {
  const kind = pick(rng, ['same', 'lower', 'higher'] as const);
  const p = pick(rng, [2, 3, 4, 6]); const d = pick(rng, [1, 2, 3]); const qq = rint(rng, 1, 5); const s = rint(rng, 1, 9); const e = rint(rng, 1, 5);
  const GROWS = 'Grows without bound (no limit)';
  let num: number[]; let den: number[]; let right: string; let wrongs: string[]; let why: string;
  if (kind === 'same') { num = [s, qq, p]; den = [e, 0, d]; right = fracStr(p, d); wrongs = ['0', GROWS, fracStr(s, e), fracStr(s + qq + p, e + d), fracStr(p, e), fracStr(s, d)]; why = `Top and bottom are both degree 2: the limit is the ratio of leading coefficients, ${p}/${d}${right === `${p}/${d}` ? '' : ` = ${right}`}.`; }

  else if (kind === 'lower') { const t = qq === d ? d + 1 : qq; num = [s, t]; den = [e, 0, d]; right = '0'; wrongs = [fracStr(t, d), GROWS, fracStr(s, e), '1']; why = 'The bottom has the higher degree, so it outgrows the top: the ratio shrinks to 0.'; }
  else { const t = qq === p ? 1 : qq; num = [s, 0, p]; den = [e, t]; right = GROWS; wrongs = [fracStr(p, t), '0', fracStr(s, e), '1', fracStr(p, e)]; why = 'The top has the higher degree, so the ratio grows without bound: no finite limit.'; }
  const q = mkq(S(K1), 'limits at infinity', {
    prompt: "Newton's drag model runs for a long time. What happens to the ratio as x → ∞?",
    expression: `lim x→∞ (${P(num)})/(${P(den)})`, answer: 0,
    hint: 'For huge x only the highest power on top and on the bottom matter. Compare degrees.',
    steps: [why, 'Plugging in x = 0 (the constant terms) tells you about x near 0, not about x → ∞.'],
    visual: card('For huge x', [`top ≈ ${mono(num[num.length - 1], num.length - 1)}`, `bottom ≈ ${mono(den[den.length - 1], den.length - 1)}`]),
  });
  return choose(rng, q, right, wrongs);
}

/** Typed limit at infinity: same degree top and bottom, so the answer is the ratio of leading coefficients. */
function infinityTypedQ(rng: Rng): Question {
  const [p, d] = pick(rng, [[3, 2], [6, 4], [5, 2], [2, 5], [9, 6], [4, 8], [3, 4], [7, 2]] as [number, number][]);
  const n = pick(rng, [1, 2, 3]); const tb = rnz(rng, -9, 9); const bb = rint(rng, 1, 9); const tl = rint(rng, -5, 5);
  const num = n === 1 ? [tb, p] : [tb, tl, ...Array(n - 2).fill(0), p]; const den = [bb, ...Array(n - 1).fill(0), d];
  return mkq(S(K1), 'limits at infinity', {
    prompt: `Volt's amplifier gain is G(x) = (${P(num)})/(${P(den)}). What gain does it level off at as x → ∞?`,
    expression: `lim x→∞ G(x) = ?`, ...fans(p, d),
    hint: `Divide top and bottom by x${sup(n)}: every lower power of x shrinks to 0.`,
    steps: [`Divide top and bottom by x${sup(n)}: (${fmt(p)} + terms → 0)/(${fmt(d)} + terms → 0).`, `The limit is ${p}/${d}${fracStr(p, d) === `${p}/${d}` ? '' : ` = ${fracStr(p, d)}`}, the ratio of the leading coefficients.`],
    visual: card('For huge x', [`top ≈ ${mono(p, n)}`, `bottom ≈ ${mono(d, n)}`]),
  });
}
const infinityTypedStep = (rng: Rng) => typed(infinityTypedQ(rng));

/** (√(x + k²) − k)/x → 1/(2k): 0/0 cleared by the conjugate, not by factoring. */
function rationalizeLimitQ(rng: Rng): Question {
  const k = pick(rng, [1, 2, 3, 4, 5]); const k2 = k * k;
  return mkq(S(K1), 'rationalise 0/0', {
    prompt: `Ada's level sensor reads g(x) = (√(x + ${k2}) − ${k})/x, which is 0/0 at x = 0. Nothing factors. Find the limit.`,
    expression: `lim x→0 (√(x + ${k2}) − ${k})/x = ?`, ...fans(1, 2 * k),
    hint: `Multiply top and bottom by the conjugate √(x + ${k2}) + ${k}. What happens to the top?`,
    steps: [`Top × conjugate: (√(x + ${k2}) − ${k})(√(x + ${k2}) + ${k}) = (x + ${k2}) − ${k2} = x.`, `So g(x) = x/[x(√(x + ${k2}) + ${k})] = 1/(√(x + ${k2}) + ${k}) for x ≠ 0.`, `Substitute x = 0: 1/(${k} + ${k}) = ${fracStr(1, 2 * k)}.`],
    visual: card('Conjugate trick', ['(√A − B)(√A + B) = A − B²', 'the root disappears from the top']),
    app: 'Sensor formulas with square roots often read 0/0 at the calibration point.',
  });
}
const rationalizeLimitStep = (rng: Rng) => typed(rationalizeLimitQ(rng));

/** Brick's two rails: f(x) = kx + b for x < a and mx + d for x ≥ a. */
function continuityTableStep(rng: Rng): AskStep {
  const a = pick(rng, [2, 3, -2, 4]); const k = rnz(rng, -4, 5); const b = rint(rng, -5, 5); const m = rint(rng, -3, 3);
  const d = k * a + b - m * a; const target = m * a + d;
  const leftS = b ? `kx ${fmtSigned(b)}` : 'kx';
  const q = mkq(S(K1), 'continuity', {
    prompt: `Brick joins two rails: f(x) = ${leftS} for x < ${fmt(a)}, and f(x) = ${P([d, m])} for x ≥ ${fmt(a)}. Find k so there is no jump.`,
    expression: 'k = ?', answer: k,
    hint: `Continuous at x = ${fmt(a)} means the left piece must head to the height the right piece has there.`,
    steps: [`Right piece at x = ${fmt(a)}: ${m ? `${m === 1 ? fmt(a) : m === -1 ? `−${par(a)}` : `${fmt(m)}·${par(a)}`}${d ? ` ${fmtSigned(d)}` : ''} = ` : ''}${lab(fmt(target), 'height at the join')}. Left piece heads to ${fmt(a)}k${b ? ` ${fmtSigned(b)}` : ''}.`, b ? `${fmt(a)}k ${fmtSigned(b)} = ${fmt(target)}, so ${fmt(a)}k = ${fmt(target - b)} and k = ${fmt(k)}.` : `${fmt(a)}k = ${fmt(target)}, so k = ${fmt(target)}/${par(a)} = ${fmt(k)}.`],
    visual: card('No jump at x = ' + fmt(a), ['left limit = f(a) = right limit']),
  });
  return model(q, { kind: 'table', cols: ['step', 'value'], rows: [[`right piece at x = ${fmt(a)}`, null], [`${fmt(a)}k must equal`, null], ['k', null]], label: `left: ${leftS}, right: ${P([d, m])}` }, [`${target},${target - b},${k}`], `Fill the right piece's height at x = ${fmt(a)}, what ${fmt(a)}k must be, then k.`);
}

function discontinuityChoose(rng: Rng): AskStep {
  const kind = pick(rng, ['hole', 'jump', 'asym', 'none'] as const);
  const a = rint(rng, -1, 2); let layers: PlotLayers; let right: string;
  if (kind === 'hole') { const L = rint(rng, -2, 3); layers = { fns: [{ fn: pfn([L - a, 1]) }], points: [{ x: a, y: L, open: true }] }; right = 'Removable (a hole)'; }
  else if (kind === 'jump') { const j = jump(rng); return finish(j.a, j.layers, 'Jump'); }
  else if (kind === 'asym') { layers = { fns: [{ fn: { kind: 'rational', num: [1], den: [-a, 1] } }] }; right = 'Infinite (asymptote)'; }
  else { const c = rint(rng, -2, 2); layers = { fns: [{ fn: pfn([c, 0, 0.5]) }], points: [{ x: a, y: c + 0.5 * a * a }] }; right = 'None: continuous'; }
  return finish(a, layers, right);
  function finish(x0: number, lay: PlotLayers, r: string): AskStep {
    const q = mkq(S(K1), 'types of discontinuity', {
      prompt: `Volt inspects the circuit trace at x = ${fmt(x0)}. What kind of break is there?`, expression: `f near x = ${fmt(x0)}`, answer: 0,
      hint: 'Continuous at a: f(a) exists, the limit exists, and they are equal. Which condition fails?',
      steps: [r === 'None: continuous' ? 'The curve passes through without a gap: f(a) equals the limit.' : r === 'Jump' ? 'The left and right pieces head to different heights: a jump.' : r === 'Removable (a hole)' ? 'Both sides head to the same height but the point is missing: a removable hole.' : 'The values blow up near a: an infinite discontinuity.', `Answer: ${r}.`],
      visual: plotV([x0 - 4, x0 + 4, -6, 6], lay),
    });
    return choose(rng, q, r, ['Removable (a hole)', 'Jump', 'Infinite (asymptote)', 'None: continuous']);
  }
}

function avgCostTransfer(rng: Rng): AskStep {
  const a = pick(rng, [3, 4, 5, 8, 12]); const b = pick(rng, [200, 500, 900, 1500]);
  return typed(mkq(S(K1), 'limits at infinity', {
    prompt: `A 3D printer costs $${b} to set up plus $${a} per part. Its average cost per part is C(n) = (${a}n + ${b})/n. What does C(n) approach as n → ∞?`,
    expression: `lim n→∞ (${a}n + ${b})/n = ?`, answer: a, unit: '$ per part',
    hint: 'Split the fraction: the set-up cost is shared by more and more parts.',
    steps: [`Split it: C(n) = ${a} + ${b}/n, the ${lab(a, 'dollars per part')} plus the ${lab(b, 'dollar set-up')} shared by n parts.`, `As n → ∞, the set-up share ${b}/n → 0, so C(n) → ${lab(a, 'dollars per part')}.`],
    visual: card('Average cost', [`C(n) = ${a} + ${b}/n`]), app: 'Economies of scale are limits at infinity.',
  }));
}
function sinLimitChoose(rng: Rng): AskStep {
  const k = pick(rng, [2, 3, 4, 5]);
  const v1 = (Math.sin(0.1 * k) / 0.1).toFixed(4); const v2 = (Math.sin(0.01 * k) / 0.01).toFixed(4);
  const q = mkq(S(K1), 'sin(kx)/x', {
    prompt: `A pendulum sensor reports g(x) = sin(${k}x)/x, which has no value at x = 0. Newton says "sin x/x → 1, so this is 1 too." Is he right?`,
    expression: `lim x→0 sin(${k}x)/x = ?`, answer: k,
    hint: `sin u/u → 1 needs the same u on top and bottom. Here the top has ${k}x but the bottom only x. Check the table.`,
    steps: [`Rewrite: sin(${k}x)/x = ${k}·sin(${k}x)/(${k}x), and sin(${k}x)/(${k}x) → 1, so the limit is ${k}.`, `The table agrees: g(0.1) = ${v1}, g(0.01) = ${v2}.`],
    visual: card(`g(x) = sin(${k}x)/x`, [`x = ±0.1: ${v1}`, `x = ±0.01: ${v2}`, 'x = 0: no value']),
  });
  return choose(rng, q, `${k}`, ['1', '0', `1/${k}`, 'Does not exist: 0/0']);
}
function terminalTransfer(rng: Rng): AskStep {
  const V = pick(rng, [20, 30, 45, 50, 60]); const k = pick(rng, [0.2, 0.5, 2]);
  return typed(mkq(S(K1), 'limits at infinity', {
    prompt: `A skydiving probe falls with speed v(t) = ${V}(1 − e^(−${k}t)) m/s. What speed does it approach after a long time?`,
    expression: 'lim t→∞ v(t) = ?', answer: V, unit: 'm/s',
    hint: 'What does e^(−kt) do as t grows huge?',
    steps: [`As t → ∞, e^(−${k}t) → 0.`, `So v(t) → ${V}(1 − 0) = ${lab(V, 'm/s, terminal speed')}.`],
    visual: plotV([0, 20 / k, 0, V + 10], { fns: [{ fn: { kind: 'exp', a: -V, base: Math.exp(-k), k: V } }], hlines: [{ y: V, label: `${V} m/s` }] }),
    app: 'Terminal velocity, steady-state temperature and a charged capacitor are all limits at infinity.',
  }));
}

/* ================================================================== */
/* 2. The derivative                                                   */
/* ================================================================== */
const K2 = 'derivative';

function secantTypedStep(rng: Rng): AskStep {
  const a = rint(rng, 1, 4); const h = pick(rng, [2, 3]);
  const q = mkq(S(K2), 'secant slope', {
    prompt: `Brick's ore cart has position s(t) = t² metres. Find its average velocity from t = ${a} to t = ${a + h} s.`,
    expression: `[s(${a + h}) − s(${a})]/${h} = ?`, answer: 2 * a + h, unit: 'm/s',
    hint: 'Average velocity is the slope of the secant: change in position over change in time.',
    steps: [`s(${a + h}) = ${lab((a + h) ** 2, 'metres')}, s(${a}) = ${lab(a * a, 'metres')}.`, `(${(a + h) ** 2} − ${a * a}) ÷ ${lab(h, 'seconds')} = ${lab((a + h) ** 2 - a * a, 'm moved')} ÷ ${h} = ${lab(2 * a + h, 'm/s average velocity')}.`],
    visual: plotV([0, a + h + 1, -1, (a + h) ** 2 + 3], { fns: [{ fn: pfn([0, 0, 1]) }], segments: [{ a: [a, a * a], b: [a + h, (a + h) ** 2], color: 'orange' }], points: [{ x: a, y: a * a }, { x: a + h, y: (a + h) ** 2 }] }),
  });
  return typed(q, { aid: { kind: 'secant', fn: pfn([0, 0, 1]), x: a, hs: [1, 0.5, 0.1, 0.01], range: [a - 2, a + 3, -1, (a + 3) ** 2] } });
}

function secantTableStep(rng: Rng): AskStep {
  const k = pick(rng, [1, 2, 3]); const a = pick(rng, [1, 2, 3, -1]);
  const sl = (h: number) => round4(k * (2 * a + h));
  const q = mkq(S(K2), 'secants to tangent', {
    prompt: `f(x) = ${mono(k, 2)}. Secant slopes from x = ${fmt(a)} to x = ${fmt(a)} + h shrink toward the tangent.`,
    expression: `f′(${fmt(a)}) = ?`, answer: 2 * k * a,
    hint: `The secant slope is [f(${fmt(a)} + h) − f(${fmt(a)})]/h. Work h = 1 directly, then watch the pattern as h shrinks.`,
    steps: [`With h = ${lab(1, 'step size h')}: [f(${fmt(a + 1)}) − f(${fmt(a)})]/1 = ${fmt(k * (a + 1) ** 2)} − ${fmt(k * a * a)} = ${lab(fmt(sl(1)), 'secant slope')}.`, `In general the slope is ${fmt(2 * k * a)} + ${k === 1 ? '' : k}h, so as h → 0 it becomes ${lab(fmt(2 * k * a), 'slope of the tangent')}.`],
    visual: plotV([a - 3, a + 3, -2, k * (Math.abs(a) + 3) ** 2], { fns: [{ fn: pfn([0, 0, k]) }], tangent: { fn: pfn([0, 0, k]), x: a } }),
  });
  return model(q, { kind: 'table', cols: ['h', 'secant slope'], rows: [[1, null], [0.1, sl(0.1)], [0.01, sl(0.01)], ['→ 0', null]], label: `f(x) = ${mono(k, 2)} at x = ${fmt(a)}` }, [`${sl(1)},${2 * k * a}`], 'Fill the h = 1 slope, then the value the slopes approach.');
}

function limitDefChoose(rng: Rng): AskStep {
  const a = rint(rng, 1, 5);
  const q = mkq(S(K2), 'limit definition', {
    prompt: `Which expression is f′(${a}), the slope of the tangent at x = ${a}?`, expression: `f′(${a}) = ?`, answer: 0,
    hint: 'A tangent slope is a secant slope (rise over run) with the run shrinking to zero.',
    steps: [`f′(${a}) = lim h→0 [f(${a} + h) − f(${a})]/h: rise over run, with the run h → 0.`, 'With h = 1 it is only an average; without dividing by h it is only a rise.'],
    visual: card('Rise over run', ['secant slope = [f(a + h) − f(a)]/h', 'tangent: let h → 0']),
  });
  return choose(rng, q, `lim h→0 [f(${a} + h) − f(${a})]/h`, [`[f(${a + 1}) − f(${a})]/1`, `lim h→0 [f(${a} + h) − f(${a})]`, `f(${a})/${a}`]);
}

function tangentDrawStep(rng: Rng): AskStep {
  const s = pick(rng, [1, -1]); const d = pick(rng, [-2, -1, 1, 2]); const a = rint(rng, -1, 2); const hh = a - d;
  const fa = rint(rng, -3, 3); const k = fa - s * d * d; const m = 2 * s * d; const b = fa - m * a;
  const c = [s * hh * hh + k, -2 * s * hh, s];
  const range: [number, number, number, number] = [a - 4, a + 4, fa - 7, fa + 7];
  const q = mkq(S(K2), 'tangent line', {
    prompt: `The canyon rim follows f(x) = ${P(c)}. Draw the tangent line at P(${fmt(a)}, ${fmt(fa)}).`,
    expression: `tangent at x = ${fmt(a)}`, answer: m,
    hint: `The tangent's slope is f′(${fmt(a)}). Find it, then step from P.`,
    steps: [`From the definition, (ax² + bx + c)′ = 2ax + b, so f′(x) = ${P(dpoly(c))} and f′(${fmt(a)}) = ${lab(fmt(m), 'slope of the tangent')}.`, `From P step 1 right and ${m >= 0 ? `${m} up` : `${-m} down`}: (${fmt(a + 1)}, ${fmt(fa + m)}).`, `Tangent: y = ${lineStr(m, b)}.`],
    visual: plotV(range, { fns: [{ fn: pfn(c) }], tangent: { fn: pfn(c), x: a } }),
  });
  return model(q, { kind: 'plot', range, count: 2, label: `f(x) = ${P(c)}`, layers: { fns: [{ fn: pfn(c) }], points: [{ x: a, y: fa, label: 'P' }] } }, undefined, `Find f′(${fmt(a)}), then tap two points on the tangent at P.`, { rule: { kind: 'on-line', m, b } });
}

const RATE_FRAMES = [
  { f: 'V', what: 'the tank volume', unit: 'L', per: 'minute', t: 'min', up: 'rising', down: 'falling' },
  { f: 'T', what: 'the reactor temperature', unit: '°C', per: 'minute', t: 'min', up: 'rising', down: 'falling' },
  { f: 'h', what: 'the drone altitude', unit: 'm', per: 'second', t: 's', up: 'climbing', down: 'dropping' },
];
function rateMeaningChoose(rng: Rng): AskStep {
  const fr = pick(rng, RATE_FRAMES); const t0 = rint(rng, 2, 9); let r = rnz(rng, -9, 9); if (Math.abs(r) === t0) r = r > 0 ? t0 - 1 : 1 - t0; // keep the swapped-roles distractor distinct
 const dir = r < 0 ? fr.down : fr.up; const R = Math.abs(r);
  const q = mkq(S(K2), 'rate meaning', {
    prompt: `${fr.f}(t) is ${fr.what} at time t (${fr.t}). The log says ${fr.f}′(${t0}) = ${fmt(r)}. What does that mean?`,
    expression: `${fr.f}′(${t0}) = ${fmt(r)}`, answer: 0,
    hint: `A derivative is a rate at one instant: ${fr.unit} per ${fr.per}, right at t = ${t0}.`,
    steps: [`${fr.f}′(${t0}) = ${lab(fmt(r), 'rate at that instant')} is the instantaneous rate of change at t = ${lab(t0, fr.per === 'second' ? 'seconds' : 'minutes')}.`, `So at t = ${t0}, ${fr.what} is ${dir} at ${R} ${fr.unit} per ${fr.per}.`],
    visual: card(`${fr.f}′(${t0}) = ${fmt(r)}`, [`units: ${fr.unit} per ${fr.per}`]),
  });
  return choose(rng, q, `At t = ${t0}, it is ${dir} at ${R} ${fr.unit} per ${fr.per}`, [`At t = ${t0}, ${fr.f} equals ${fmt(r)} ${fr.unit}`, `Over the first ${t0} ${fr.t} it changed by ${fmt(r)} ${fr.unit}`, `At t = ${R}, ${fr.f} equals ${t0} ${fr.unit}`]);
}

function derivDefQ(rng: Rng): Question {
  const a = rint(rng, -2, 4); const b = rnz(rng, -5, 5); const v = 2 * a + b;
  return mkq(S(K2), 'derivative from the definition', {
    prompt: `Ada's cable sags as f(x) = ${P([0, b, 1])}. Use the definition to find its slope at x = ${fmt(a)}: expand, divide by h, let h → 0.`,
    expression: `f(x) = ${P([0, b, 1])};  f′(${fmt(a)}) = ?`, answer: v,
    hint: `[f(${fmt(a)} + h) − f(${fmt(a)})]/h simplifies to a number plus h.`,
    steps: [`f(${fmt(a)} + h) − f(${fmt(a)}) = ${v === 0 ? '' : `${coefTerm(v, 'h')} + `}h².`, `Divide by h: ${v === 0 ? 'h' : `${fmt(v)} + h`}.`, `Let h → 0: f′(${fmt(a)}) = ${lab(fmt(v), 'slope of the tangent')}.`],
    visual: plotV([a - 3, a + 3, -8, 12], { fns: [{ fn: pfn([0, b, 1]) }], tangent: { fn: pfn([0, b, 1]), x: a } }),
    app: 'Every speedometer is a secant slope over a tiny time step.',
  });
}
const derivDefStep = (rng: Rng) => typed(derivDefQ(rng));

function flatSliderStep(rng: Rng): AskStep {
  const s = pick(rng, [1, -1]); const hh = rint(rng, -3, 3); const k = rint(rng, -3, 3);
  const c = [s * hh * hh + k, -2 * s * hh, s];
  const q = mkq(S(K2), 'horizontal tangent', {
    prompt: `The rim profile is f(x) = ${P(c)}. Slide to the x where the tangent is flat.`,
    expression: 'f′(x) = 0 at x = ?', answer: hh,
    hint: 'A flat tangent has slope 0. Use (ax² + bx + c)′ = 2ax + b, then set it to 0.',
    steps: [`From the definition, (ax² + bx + c)′ = 2ax + b, so f′(x) = ${P(dpoly(c))}.`, `${P(dpoly(c))} = 0 when x = ${fmt(hh)}: the ${s > 0 ? 'bottom' : 'top'} of the curve.`],
    visual: card('Flat tangent', [`f(x) = ${P(c)}`, 'flat ⇔ f′(x) = 0']),
  });
  // No curve on the slider: a drawn parabola shows its vertex, so the player could skip the calculus.
  return model(q, { kind: 'slider', min: -4, max: 4, step: 0.5, label: 'x where the tangent is flat' }, [String(hh)], 'Find f′(x), set it to 0, and slide to that x.');
}

function altimeterTransfer(rng: Rng): AskStep {
  const v = pick(rng, [3, 4, 5, 6, 7, 8, 9, 12]); const base = pick(rng, [20, 35, 40, 55]); const e = pick(rng, [0.01, 0.02, 0.03]);
  const lo = round4(base - 0.1 * v + e); const hi = round4(base + 0.1 * v + e);
  return typed(mkq(S(K2), 'estimate a derivative from data', {
    prompt: `A drone's altimeter logs h(1.9) = ${fmt(lo)} m, h(2) = ${base} m, h(2.1) = ${fmt(hi)} m. Estimate its climb rate h′(2).`,
    expression: 'h′(2) ≈ [h(2.1) − h(1.9)]/0.2 = ?', answer: v, unit: 'm/s',
    hint: 'Use the readings on both sides of t = 2: rise over run across the 0.2 s gap.',
    steps: [`Symmetric difference: [h(2.1) − h(1.9)]/(2.1 − 1.9) = (${lab(fmt(hi), 'metres')} − ${lab(fmt(lo), 'metres')}) ÷ ${lab(0.2, 'seconds')}.`, `= ${lab(fmt(round4(hi - lo)), 'm climbed')} ÷ ${lab(0.2, 'seconds')} = ${lab(v, 'm/s climb rate')}.`],
    visual: card('Altimeter log', [`t = 1.9 s: ${fmt(lo)} m`, `t = 2 s: ${base} m`, `t = 2.1 s: ${fmt(hi)} m`]),
    app: 'Real sensors give samples, not formulas: engineers estimate derivatives from neighbouring readings.',
  }));
}
function coolingRateTransfer(rng: Rng): AskStep {
  const T0 = pick(rng, [88, 90, 92, 95]); const d = pick(rng, [2, 3, 4]); const span = pick(rng, [4, 5]); const T1 = T0 - d * span;
  return typed(mkq(S(K2), 'average rate', {
    prompt: `A mug of tea reads ${T0} °C at t = 0 and ${T1} °C at t = ${span} min. What is the average rate of change?`,
    expression: `[T(${span}) − T(0)]/${span} = ?`, answer: -d, unit: '°C/min',
    hint: 'Average rate = change in temperature ÷ change in time. Cooling is negative.',
    steps: [`Change in temperature: ${lab(T1, 'degrees Celsius at the end')} − ${lab(T0, 'at the start')} = ${lab(fmt(T1 - T0), 'degrees Celsius')}.`, `${fmt(T1 - T0)} ÷ ${lab(span, 'minutes')} = ${lab(fmt(-d), 'degrees Celsius per minute')}.`],
    visual: card('Tea log', [`t = 0: ${T0} °C`, `t = ${span}: ${T1} °C`]),
  }));
}

/* ================================================================== */
/* 3. Derivative rules                                                  */
/* ================================================================== */
const K3 = 'rules';

function powerChoose(rng: Rng): AskStep {
  if (rng.next() < 0.2) {
    const a = pick(rng, [2, 3, 5]);
    const q = mkq(S(K3), 'power rule', {
      prompt: `Volt's field strength falls off as ${a}/x. Rewrite it as a power of x, then use the power rule.`, expression: `d/dx [${a}/x] = ?`, answer: 0,
      hint: `${a}/x = ${a}x⁻¹. Bring the exponent down, then lower it by one.`,
      steps: [`${a}/x = ${a}x⁻¹.`, `d/dx = ${a}·(−1)x⁻² = −${a}/x².`],
      visual: card('Power rule', ['d/dx xⁿ = n·xⁿ⁻¹', 'works for negative n too']),
    });
    return choose(rng, q, `−${a}/x²`, [`${a}/x²`, `−${a}/x`, `${a} ln x`]);
  }
  const a = pick(rng, [2, 3, 4, 5, -2, -3]); const n = rint(rng, 2, 6);
  const q = mkq(S(K3), 'power rule', {
    prompt: `Vector's gearbox load is ${mono(a, n)}. Find its rate with the power rule.`, expression: `d/dx [${mono(a, n)}] = ?`, answer: n * a,
    hint: `d/dx xⁿ = n·xⁿ⁻¹, and the constant ${fmt(a)} just rides along.`,
    steps: [`d/dx [${mono(a, n)}] = ${fmt(a)}·${n}x${sup(n - 1)}.`, `= ${mono(n * a, n - 1)}.`],
    visual: card('Power rule', ['d/dx xⁿ = n·xⁿ⁻¹']),
  });
  return choose(rng, q, mono(n * a, n - 1), [mono(a, n - 1), mono(n * a, n), fcoef(a, n + 1, xp(n + 1))]);
}

function cubic(rng: Rng) {
  const a3 = rnz(rng, -3, 3); const a2 = rint(rng, -4, 4); const a1 = rnz(rng, -6, 6); const a0 = rint(rng, -9, 9);
  return [a0, a1, a2, a3];
}
function coefTableStep(rng: Rng): AskStep {
  const c = cubic(rng); const d = dpoly(c);
  const q = mkq(S(K3), 'power rule term by term', {
    prompt: `The pump curve is f(x) = ${P(c)}. Differentiate it term by term.`, expression: `f′(x) = ?`, answer: d[2],
    hint: 'Each xⁿ term becomes n·xⁿ⁻¹; the constant term disappears.',
    steps: [`${P(c)} → ${P(d)}.`, `Coefficients: x²: ${fmt(d[2])}, x: ${fmt(d[1])}, constant: ${fmt(d[0])}.`],
    visual: card('Term by term', ['(f + g)′ = f′ + g′', '(c·f)′ = c·f′']),
  });
  return model(q, { kind: 'table', cols: ['x²', 'x', '1'], rowLabels: ['f′(x)'], rows: [[null, null, null]], label: `f(x) = ${P(c)}` }, [`${d[2]},${d[1]},${d[0]}`], 'Fill the coefficients of f′(x).');
}

function polyAtQ(rng: Rng): Question {
  const c = cubic(rng); const k = rint(rng, -2, 3); const d = dpoly(c); const v = pev(d, k);
  return mkq(S(K3), 'evaluate a derivative', {
    prompt: `Catalyst's pump curve is f(x) = ${P(c)}. Find its slope at x = ${fmt(k)}.`, expression: `f(x) = ${P(c)};  f′(${fmt(k)}) = ?`, answer: v,
    hint: 'Find f′(x) first; substituting first gives a constant, whose derivative is 0.',
    steps: [`f′(x) = ${P(d)}.`, `f′(${fmt(k)}) = ${fmt(v)}.`],
    visual: card('Differentiate first', [`f′(x) = ?`, `then x = ${fmt(k)}`]),
  });
}
const polyAtStep = (rng: Rng) => typed(polyAtQ(rng));

function productChoose(rng: Rng): AskStep {
  const m = pick(rng, [2, 3]); const n = pick(rng, [2, 3, 4]);
  const right = mono(m + n, m + n - 1); const fg = mono(m * n, m + n - 2);
  const q = mkq(S(K3), 'product rule', {
    prompt: `Ada claims (f·g)′ = f′·g′. Test it: f(x) = x${sup(m)}, g(x) = x${sup(n)}. What is (f·g)′(x)?`, expression: `d/dx [x${sup(m)}·x${sup(n)}] = ?`, answer: m + n,
    hint: 'Rewrite f·g as a single power of x first, or use f′g + fg′.',
    steps: [`(fg)′ = f′g + fg′ = ${mono(m, m - 1)}·x${sup(n)} + x${sup(m)}·${mono(n, n - 1)} = ${right}.`, `Check: fg = x${sup(m + n)}, whose derivative is ${right}. The product of derivatives, ${fg}, is wrong.`],
    visual: card('Product rule', ['(fg)′ = f′g + fg′', 'NOT f′·g′']),
  });
  return choose(rng, q, right, [fg, mono(m * n, m * n - 1), mono(m, m + n - 1), mono(m + n, m + n)]);
}

function productTableStep(rng: Rng): AskStep {
  const x0 = rint(rng, 1, 3); const f = rnz(rng, -5, 5); const g = rnz(rng, -5, 5); const fp = rnz(rng, -4, 4); let gp = rnz(rng, -4, 4);
  if (fp * g + f * gp === fp * gp) gp = gp === 4 ? 3 : gp + 1 || 1;
  const ans = fp * g + f * gp;
  const q = mkq(S(K3), 'product rule from a table', {
    prompt: `Two gears feed one shaft. At x = ${x0}: f = ${fmt(f)}, f′ = ${fmt(fp)}, g = ${fmt(g)}, g′ = ${fmt(gp)}. Find the slope of f·g there.`,
    expression: `(fg)′(${x0}) = ?`, answer: ans,
    hint: '(fg)′ = f′·g + f·g′: each factor takes a turn being differentiated.',
    steps: [`(fg)′ = f′g + fg′ = (${fmt(fp)})(${fmt(g)}) + (${fmt(f)})(${fmt(gp)}).`, `= ${fmt(fp * g)} ${fmtSigned(f * gp)} = ${fmt(ans)}.`],
    visual: card(`At x = ${x0}`, [`f = ${fmt(f)}, f′ = ${fmt(fp)}`, `g = ${fmt(g)}, g′ = ${fmt(gp)}`]),
  });
  return model(q, { kind: 'table', cols: ['value', 'slope'], rowLabels: ['f', 'g', 'f·g'], rows: [[f, fp], [g, gp], [f * g, null]], label: `at x = ${x0}` }, [String(ans)], 'Fill the slope of f·g with the product rule.');
}

function productAtQ(rng: Rng): Question {
  const a = rnz(rng, -3, 3); const b = rnz(rng, -5, 5); const c = rnz(rng, -4, 4); const k = rint(rng, -2, 2);
  const v = a * (k * k + c) + (a * k + b) * 2 * k;
  return mkq(S(K3), 'product rule', {
    prompt: `Brick's winch torque is a product of two factors. Find its rate at x = ${fmt(k)}.`, expression: `h(x) = (${P([b, a])})(${P([c, 0, 1])});  h′(${fmt(k)}) = ?`, answer: v,
    hint: '(fg)′ = f′g + fg′ with f the first bracket and g the second.',
    steps: [`h′(x) = ${fmt(a)}·(${P([c, 0, 1])}) + (${P([b, a])})·2x.`, `At x = ${fmt(k)}: ${fmt(a)}·${par(k * k + c)} + ${par(a * k + b)}·${par(2 * k)} = ${fmt(v)}.`],
    visual: card('Product rule', ['(fg)′ = f′g + fg′']),
  });
}
const productAtStep = (rng: Rng) => typed(productAtQ(rng));

function quotientChoose(rng: Rng): AskStep {
  const qd = rnz(rng, -4, 4); let p = rint(rng, -5, 5); if (p === qd) p = qd + 2;
  const den = P([qd, 1]); const num = p === 0 ? 'x' : `(${P([p, 1])})`;
  const right = `${fmt(qd - p)}/(${den})²`;
  const q = mkq(S(K3), 'quotient rule', {
    prompt: `Volt's divider output is a ratio of two signals. Differentiate it with the quotient rule.`, expression: `d/dx [${num}/(${den})] = ?`, answer: qd - p,
    hint: 'The order matters: the bottom times the derivative of the top comes first.',
    steps: [`[(${den})·1 − ${num}·1]/(${den})².`, `The top simplifies to ${p === 0 ? fmt(qd) : `${fmt(qd)} − ${par(p)} = ${fmt(qd - p)}`}, so the answer is ${right}.`],
    visual: card('Quotient rule', ['(f/g)′ = (f′g − fg′)/g²']),
  });
  return choose(rng, q, right, [`${fmt(p - qd)}/(${den})²`, '1', `${fmt(qd - p)}/(${den})`]);
}

function quotientAtQ(rng: Rng): Question {
  let a = 0; let b = 0; let c = 0; let k = 0; let g = 0;
  do { a = rint(rng, 1, 3); b = rint(rng, -5, 5); c = rnz(rng, -3, 3); k = rint(rng, -2, 3); } while ((k + c === 0 || a * c === b) && g++ < 40);
  if (k + c === 0 || a * c === b) { a = 2; b = 1; c = 1; k = 1; }
  const f = fans(a * c - b, (k + c) ** 2);
  return mkq(S(K3), 'quotient rule', {
    prompt: `Catalyst's yield ratio is f(x) = (${P([b, a])})/(${P([c, 1])}). How fast is it changing at x = ${fmt(k)}?`, expression: `f(x) = (${P([b, a])})/(${P([c, 1])});  f′(${fmt(k)}) = ?`, ...f,
    hint: '(f/g)′ = (f′g − fg′)/g². Keep the order: bottom times derivative of top first.',
    steps: [`f′(x) = [${lead(a)}(${P([c, 1])}) − (${P([b, a])})·1]/(${P([c, 1])})² = ${fmt(a * c - b)}/(${P([c, 1])})².`, `At x = ${fmt(k)}: ${fmt(a * c - b)}/${(k + c) ** 2}${fracStr(a * c - b, (k + c) ** 2) === `${fmt(a * c - b)}/${(k + c) ** 2}` ? '' : ` = ${fracStr(a * c - b, (k + c) ** 2)}`}.`],
    visual: card('Quotient rule', ['(f/g)′ = (f′g − fg′)/g²']),
  });
}
const quotientAtStep = (rng: Rng) => typed(quotientAtQ(rng));

function flatTableStep(rng: Rng): AskStep {
  const p = pick(rng, [1, 2, 3, -1, -2]); const x0 = rnz(rng, -4, 4); const qv = -2 * p * x0; const r = rint(rng, -5, 5);
  const c = [r, qv, p];
  const q = mkq(S(K3), 'critical point', {
    prompt: `Catalyst's yield curve is f(x) = ${P(c)}. Build f′(x), then find the x where the curve levels off.`, expression: 'f′(x) = 0', answer: x0,
    hint: 'Power rule term by term: ax² → 2ax, bx → b, the constant → 0. Then set f′(x) = 0.',
    steps: [`f′(x) = ${P(dpoly(c))}: x-coefficient ${fmt(2 * p)}, constant ${fmt(qv)}.`, `${P(dpoly(c))} = 0 → x = ${fmt(-qv)}/${par(2 * p)} = ${fmt(x0)}.`],
    visual: card('Levels off', [`f(x) = ${P(c)}`, 'flat ⇔ f′(x) = 0']),
  });
  return model(q, { kind: 'table', cols: ['step', 'value'], rows: [['f′(x): coefficient of x', null], ['f′(x): constant term', null], ['x where f′(x) = 0', null]], label: `f(x) = ${P(c)}` }, [`${2 * p},${qv},${x0}`], 'Differentiate term by term, then solve f′(x) = 0.');
}

/** Power rule in action: draw the tangent to x-power curve at x = ±1. */
function powerTangentPlotStep(rng: Rng): AskStep {
  const n = pick(rng, [2, 3, 4]); const a = pick(rng, [1, -1]); const x0 = pick(rng, [1, -1]); const c0 = rint(rng, -2, 2);
  const c = [c0, ...Array(n - 1).fill(0), a]; const m = n * a * x0 ** (n - 1); const fa = a * x0 ** n + c0; const b = fa - m * x0;
  const range: [number, number, number, number] = [x0 - 3, x0 + 3, fa - 6, fa + 6];
  const q = mkq(S(K3), 'power rule tangent', {
    prompt: `Ada's cam follows f(x) = ${P(c)}. Use the power rule to draw its tangent at x = ${fmt(x0)}.`, expression: `tangent at x = ${fmt(x0)}`, answer: m,
    hint: `Power rule: bring the exponent down and lower it by one. Put in x = ${fmt(x0)} for the slope, then step from P.`,
    steps: [`f′(x) = ${mono(n * a, n - 1)}, so f′(${fmt(x0)}) = ${fmt(m)}; the point is (${fmt(x0)}, ${fmt(fa)}).`, `Tangent: y = ${lineStr(m, b)}.`],
    visual: plotV(range, { fns: [{ fn: pfn(c) }] }),
  });
  return model(q, { kind: 'plot', range, count: 2, label: `f(x) = ${P(c)}`, layers: { fns: [{ fn: pfn(c) }], points: [{ x: x0, y: fa, label: 'P' }] } }, undefined, `Find f′(${fmt(x0)}), then tap two points on the tangent at P.`, { rule: { kind: 'on-line', m, b } });
}


function marginalTransfer(rng: Rng): AskStep {
  const A = pick(rng, [100, 120, 200]); const B = pick(rng, [2, 4, 5]); const p0 = pick(rng, [5, 10, 15]);
  return typed(mkq(S(K3), 'marginal revenue', {
    prompt: `A workshop sells ${A} − ${B}p gadgets at price $p, so revenue is R(p) = p(${A} − ${B}p). How fast does revenue change with price at p = ${p0}?`,
    expression: `R′(${p0}) = ?`, answer: A - 2 * B * p0, unit: '$ per $',
    hint: 'Expand first, or use the product rule.',
    steps: [`R(p) = ${A}p − ${B}p², so R′(p) = ${A} − ${2 * B}p.`, `At a price of ${lab(p0, 'dollars')}: R′(${p0}) = ${A} − ${2 * B}·${p0} = ${A} − ${2 * B * p0} = ${lab(fmt(A - 2 * B * p0), 'dollars per dollar of price')}.`],
    visual: card('Revenue', [`R(p) = p(${A} − ${B}p)`]),
  }));
}
function concentrationTransfer(rng: Rng): AskStep {
  const a = pick(rng, [6, 12, 20]); const b = pick(rng, [2, 3, 4]);
  return typed(mkq(S(K3), 'quotient rule', {
    prompt: `A medicine's blood concentration is c(t) = ${a}t/(t + ${b}) mg/L. How fast is it rising at t = 0 hours?`,
    expression: `c′(0) = ?`, ...fans(a, b), unit: 'mg/L per h',
    hint: 'Quotient rule: (f′g − fg′)/g².',
    steps: [`c′(t) = [${a}(t + ${b}) − ${a}t]/(t + ${b})² = ${a * b}/(t + ${b})².`, `c′(0) = ${a * b}/${b * b} = ${lab(fracStr(a, b), 'mg/L per hour')}.`],
    visual: card('Dose curve', [`c(t) = ${a}t/(t + ${b})`]),
  }));
}

/* ================================================================== */
/* 4. Chain rule & implicit differentiation                             */
/* ================================================================== */
const K4 = 'chain';

function chainLinearChoose(rng: Rng): AskStep {
  const a = pick(rng, [2, 3, 4, 5, -2]); const b = rnz(rng, -5, 5); const n = rint(rng, 2, 5); const inner = P([b, a]);
  const right = `${fmt(n * a)}(${inner})${sup(n - 1)}`;
  const q = mkq(S(K4), 'chain rule', {
    prompt: `Brick's drive-shaft torque is (${inner})${sup(n)}. Differentiate it: outer derivative times inner derivative.`, expression: `d/dx (${inner})${sup(n)} = ?`, answer: n * a,
    hint: `Treat (${inner}) as one block u: d/dx u${sup(n)} = ${n}u${sup(n - 1)}·u′. What is u′?`,
    steps: [`Outer: ${n}(${inner})${sup(n - 1)}. Inner derivative: ${fmt(a)}.`, `Multiply: ${right}.`],
    visual: card('Chain rule', ['d/dx f(g(x)) = f′(g(x))·g′(x)']),
  });
  return choose(rng, q, right, [`${n}(${inner})${sup(n - 1)}`, `${fmt(n * a)}(${inner})${sup(n)}`, `${a < 0 ? '−' : ''}(${inner})${sup(n + 1)}/${Math.abs((n + 1) * a)}`]);
}

function chainQuadChoose(rng: Rng): AskStep {
  const c = rnz(rng, -5, 5); const n = rint(rng, 2, 4); const inner = P([c, 0, 1]);
  const right = `${2 * n}x(${inner})${sup(n - 1)}`;
  const q = mkq(S(K4), 'chain rule', {
    prompt: `Newton's cable tension goes as (${inner})${sup(n)}. Differentiate the outside, keep the inside, times the inside's derivative.`, expression: `d/dx (${inner})${sup(n)} = ?`, answer: 2 * n,
    hint: `The inside is ${inner}; its derivative is not 1.`,
    steps: [`Outer: ${n}(${inner})${sup(n - 1)}. Inner: d/dx (${inner}) = 2x.`, `Multiply: ${right}.`],
    visual: card('Chain rule', ['outer′ (inside kept) × inner′']),
  });
  return choose(rng, q, right, [`${n}(${inner})${sup(n - 1)}`, `${2 * n}x(${inner})${sup(n)}`, `${n}(2x)${sup(n - 1)}`]);
}

function chainAtQ(rng: Rng): Question {
  const n = pick(rng, [2, 3]); const a = pick(rng, [2, 3, -2]); const u = pick(rng, [-3, -2, -1, 1, 2, 3]); let k = rint(rng, -1, 2); if (u - a * k === 0) k = k === 2 ? 1 : k + 1; const b = u - a * k;
  const v = n * a * u ** (n - 1); const inner = P([b, a]);
  return mkq(S(K4), 'chain rule', {
    prompt: `Brick's conveyor speed follows f(x) = (${inner})${sup(n)}. Find its rate at x = ${fmt(k)}.`, expression: `f(x) = (${inner})${sup(n)};  f′(${fmt(k)}) = ?`, answer: v,
    hint: 'Outer derivative (inside kept) times the inner derivative.',
    steps: [`f′(x) = ${n}(${inner})${sup(n - 1)}·${par(a)} = ${fmt(n * a)}(${inner})${sup(n - 1)}.`, `At x = ${fmt(k)} the inside is ${fmt(u)}: ${fmt(n * a)}·(${fmt(u)})${sup(n - 1)} = ${fmt(v)}.`],
    visual: card('Chain rule', ['d/dx uⁿ = n·uⁿ⁻¹·u′']),
  });
}
const chainAtStep = (rng: Rng) => typed(chainAtQ(rng));

function chainTableStep(rng: Rng): AskStep {
  const n = pick(rng, [2, 3]); const k = pick(rng, [1, 2, -1]); const u = pick(rng, [-3, -2, -1, 1, 2, 3]); const c = u - k * k;
  const fu = n * u ** (n - 1); const gp = 2 * k; const h = fu * gp; const inner = P([c, 0, 1]);
  const q = mkq(S(K4), 'chain rule link by link', {
    prompt: `Gear train h(x) = (${inner})${sup(n)}: outer f(u) = u${sup(n)}, inner u = ${inner}. Find h′(${fmt(k)}) link by link.`,
    expression: `h′(${fmt(k)}) = ?`, answer: h,
    hint: 'Evaluate the inner function first, then each derivative, then multiply the links.',
    steps: [`u = ${par(k)}²${c ? ` ${fmtSigned(c)}` : ''} = ${fmt(u)}; g′(${fmt(k)}) = 2·${par(k)} = ${fmt(gp)}.`, `f′(u) = ${n}u${sup(n - 1)} = ${n}·${par(u)}${sup(n - 1)} = ${fmt(fu)}.`, `h′(${fmt(k)}) = f′(u)·g′(${fmt(k)}) = ${fmt(fu)}·${par(gp)} = ${fmt(h)}.`],
    visual: card('Links multiply', ['dh/dx = (dh/du)·(du/dx)']),
  });
  return model(q, { kind: 'table', cols: ['link', 'value'], rows: [[`u = g(${fmt(k)})`, null], [`g′(${fmt(k)})`, null], ['f′(u)', null], [`h′(${fmt(k)})`, null]], label: `h(x) = (${inner})${sup(n)}` }, [`${u},${gp},${fu},${h}`], 'Fill each link, then multiply for h′.');
}

function implicitChoose(rng: Rng): AskStep {
  const kind = pick(rng, ['circle', 'hyper', 'parab'] as const);
  let eq: string; let right: string; let wrongs: string[]; let steps: string[];
  const hint = kind === 'hyper' ? 'xy is a product of two things that both depend on x: use the product rule, and y′ comes along.' : 'y is a function of x, so d/dx (y²) = 2y·(dy/dx) by the chain rule.';
  if (kind === 'circle') { const r = pick(rng, [5, 10, 13]); eq = `x² + y² = ${r * r}`; right = '−x/y'; wrongs = ['x/y', '−y/x', '2x + 2y']; steps = ['d/dx: 2x + 2y·(dy/dx) = 0 (the chain rule puts dy/dx on the y term).', 'dy/dx = −2x/(2y) = −x/y.']; }
  else if (kind === 'hyper') { const k = pick(rng, [6, 8, 12]); eq = `xy = ${k}`; right = '−y/x'; wrongs = ['−x/y', 'y/x', '0']; steps = ['Product rule on xy: 1·y + x·(dy/dx) = 0.', 'dy/dx = −y/x.']; }
  else { const k = pick(rng, [4, 8]); eq = `y² = ${k}x`; right = `${k / 2}/y`; wrongs = [`${k}`, `${k}/y`, `2y`]; steps = [`d/dx: 2y·(dy/dx) = ${k}.`, `dy/dx = ${k}/(2y) = ${right}.`]; }
  const q = mkq(S(K4), 'implicit differentiation', {
    prompt: `Ada's survey curve ${eq} is not a function of x. Differentiate both sides; every y term picks up dy/dx.`, expression: `${eq};  dy/dx = ?`, answer: 0,
    hint,
    steps, visual: card('Implicit', [eq, 'd/dx (y²) = 2y·dy/dx']),
  });
  return choose(rng, q, right, wrongs);
}

const TRIPLES: [number, number, number][] = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13]];
function implicitCircleQ(rng: Rng): Question {
  const [x0, y0, r] = pick(rng, TRIPLES); const sx = pick(rng, [1, -1]); const sy = pick(rng, [1, -1]); const x = sx * x0; const y = sy * y0;
  const f = fans(-x, y);
  return mkq(S(K4), 'implicit slope', {
    prompt: `Ada's survey ring is x² + y² = ${r * r}. Find the slope of the ring at (${fmt(x)}, ${fmt(y)}).`,
    expression: `dy/dx at (${fmt(x)}, ${fmt(y)}) = ?`, ...f,
    hint: 'Differentiate implicitly: 2x + 2y·(dy/dx) = 0. Then substitute the point.',
    steps: ['2x + 2y·(dy/dx) = 0, so dy/dx = −x/y.', `dy/dx = −(${fmt(x)})/(${fmt(y)}) = ${fracStr(-x, y)}.`],
    visual: { type: 'geo', items: [{ t: 'circle', c: [0, 0], r }, { t: 'pt', p: [x, y], label: `(${fmt(x)}, ${fmt(y)})` }, { t: 'seg', a: [0, -r], b: [0, r], dashed: true }, { t: 'seg', a: [-r, 0], b: [r, 0], dashed: true }] },
  });
}
const implicitCircleStep = (rng: Rng) => typed(implicitCircleQ(rng));

function hyperbolaPlotStep(rng: Rng): AskStep {
  const p = rint(rng, 1, 3); const qv = rint(rng, 1, 3); const k = p * qv; const m = -qv / p; const b = 2 * qv;
  const range: [number, number, number, number] = [-1, 7, -1, 7];
  const layers: PlotLayers = { fns: [{ fn: { kind: 'rational', num: [k], den: [0, 1] }, from: 0.3 }], points: [{ x: p, y: qv, label: 'P' }] };
  const q = mkq(S(K4), 'implicit tangent', {
    prompt: `The support cable follows xy = ${k}. Draw its tangent at P(${p}, ${qv}).`, expression: `tangent to xy = ${k} at (${p}, ${qv})`, answer: m,
    hint: 'Product rule: y + x·(dy/dx) = 0, so dy/dx = −y/x at P.',
    steps: [`dy/dx = −y/x = −${qv}/${p}${fracStr(qv, p) === `${qv}/${p}` ? '' : ` = ${fracStr(-qv, p)}`}.`, `Through P: y = ${Number.isInteger(m) ? lead(m) : `−(${fracStr(qv, p)})`}(x − ${p}) + ${qv}, which hits (0, ${b}) and (${2 * p}, 0).`],
    visual: plotV(range, layers),
  });
  return model(q, { kind: 'plot', range, count: 2, label: `xy = ${k}`, layers }, undefined, 'Find dy/dx at P implicitly, then tap two points on the tangent.', { rule: { kind: 'on-line', m, b } });
}

function balloonTransfer(rng: Rng): AskStep {
  const a = pick(rng, [1, 2, 3]); const b = pick(rng, [1, 2]); const t0 = pick(rng, [1, 2]); const r0 = a * t0 + b; const v = 4 * r0 * r0 * a;
  return typed(mkq(S(K4), 'rates multiply', {
    prompt: `A test balloon's radius grows as r(t) = ${P([b, a], 't')} cm, and its volume is V = (4/3)πr³. How fast is V growing at t = ${t0} s, as a multiple of π?`,
    expression: `dV/dt at t = ${t0} = ? · π`, answer: v, unit: 'π cm³/s',
    hint: 'V depends on r and r depends on t: dV/dt = (dV/dr)·(dr/dt).',
    steps: [`dV/dr = 4πr², dr/dt = ${lab(a, 'cm/s')}. At t = ${labn(t0, 'second')}, r = ${lab(r0, 'cm')}.`, `dV/dt = 4π·${r0}²·${a} = ${v}π cm³/s.`],
    visual: { type: 'geo', items: [{ t: 'circle', c: [0, 0], r: 3 }, { t: 'circle', c: [0, 0], r: 2, color: 'muted' }, { t: 'seg', a: [0, 0], b: [3, 0], label: 'r(t)' }] },
  }));
}
function lapseTransfer(rng: Rng): AskStep {
  const g = pick(rng, [5, 6, 7]); const v = pick(rng, [2, 3, 4]);
  return typed(mkq(S(K4), 'rates multiply', {
    prompt: `Air cools ${g} °C per km of altitude. A weather balloon rises at ${v} km/h. How fast does its thermometer reading change?`,
    expression: 'dT/dt = (dT/dh)(dh/dt) = ?', answer: -g * v, unit: '°C/h',
    hint: 'dT/dh is negative: higher is colder.',
    steps: [`dT/dh = ${lab(`−${g}`, 'degrees Celsius per km')}, dh/dt = ${lab(v, 'km per hour')}.`, `dT/dt = (−${g})(${v}) = ${lab(`−${g * v}`, 'degrees Celsius per hour')}.`],
    visual: card('Chain of rates', [`dT/dh = −${g}`, `dh/dt = ${v}`]),
  }));
}

/* ================================================================== */
/* 5. Trig, exponential & log derivatives                               */
/* ================================================================== */
const K5 = 'transcend';

const BASICS = [
  { f: 'sin x', right: 'cos x', wrongs: ['−cos x', '−sin x', 'sin x'], hint: 'sin x climbs most steeply at x = 0, with slope 1. Which choice equals 1 at x = 0?', why: 'Check: at x = 0 sin x climbs at slope cos 0 = 1.' },
  { f: 'cos x', right: '−sin x', wrongs: ['sin x', '−cos x', 'cos x'], hint: 'cos x is at its peak at 0 and then falls. Its slope must be negative just after 0.', why: 'Check: just after 0, cos x falls, and −sin x is negative there.' },
  { f: 'eˣ', right: 'eˣ', wrongs: ['xeˣ⁻¹', 'eˣ⁺¹/(x + 1)', 'ln x'], hint: 'The variable is in the exponent, so the power rule does not apply.', why: 'eˣ is its own slope: the height and the slope are equal everywhere.' },
  { f: 'ln x', right: '1/x', wrongs: ['1/ln x', 'eˣ', 'x ln x − x'], hint: 'ln x rises steeply near 0 and flattens as x grows. Which formula behaves like that?', why: 'ln x undoes eˣ, so its slope is 1/x.' },
  { f: 'tan x', right: 'sec²x', wrongs: ['sec x tan x', '−csc²x', 'cot x'], hint: 'tan x = sin x/cos x: use the quotient rule, and sin²x + cos²x = 1.', why: '(cos x·cos x + sin x·sin x)/cos²x = 1/cos²x = sec²x.' },
  { f: '2ˣ', right: '2ˣ ln 2', wrongs: ['x·2ˣ⁻¹', '2ˣ', '2ˣ/ln 2'], hint: 'The variable is in the exponent, so the power rule does not apply.', why: 'aˣ = e^(x ln a), so its slope is aˣ·ln a.' },
];
function basicTransChoose(rng: Rng): AskStep {
  const b = pick(rng, BASICS);
  const q = mkq(S(K5), 'basic derivatives', {
    prompt: 'Volt needs the rate of this signal.', expression: `d/dx [${b.f}] = ?`, answer: 0,
    hint: b.hint,
    steps: [`d/dx [${b.f}] = ${b.right}.`, b.why],
    visual: card('Derivatives to own', ['sin → cos, cos → −sin', 'eˣ → eˣ, ln x → 1/x']),
  });
  return choose(rng, q, b.right, b.wrongs);
}

function expChainChoose(rng: Rng): AskStep {
  const k = pick(rng, [2, 3, 5, -2, -4]);
  const right = `${fmt(k)}${ekx(k)}`;
  const q = mkq(S(K5), 'chain rule with eˣ', {
    prompt: "Catalyst's reaction runs on an exponential. Differentiate it.", expression: `d/dx [${ekx(k)}] = ?`, answer: k,
    hint: 'd/dx e^u = e^u·u′. What is the inner derivative?',
    steps: [`Outer: ${ekx(k)} stays itself. Inner: d/dx (${coefTerm(k, 'x')}) = ${fmt(k)}.`, `Multiply: ${right}.`],
    visual: card('e with an inside', ['d/dx e^u = e^u·u′']),
  });
  return choose(rng, q, right, [ekx(k), k < 0 ? `−${ekx(k)}/${-k}` : `${ekx(k)}/${k}`, `${coefTerm(k, 'x')}${ekx(k)}`]);
}

function trigChainChoose(rng: Rng): AskStep {
  const k = rint(rng, 2, 5); const isSin = rng.next() < 0.5;
  const f = `${isSin ? 'sin' : 'cos'}(${k}x)`;
  const right = isSin ? `${k}cos(${k}x)` : `−${k}sin(${k}x)`;
  const wrongs = isSin ? [`cos(${k}x)`, `−${k}cos(${k}x)`, `${k}sin(${k}x)`] : [`−sin(${k}x)`, `${k}sin(${k}x)`, `−${k}cos(${k}x)`];
  const q = mkq(S(K5), 'chain rule with trig', {
    prompt: 'An oscillator runs at a higher frequency. Differentiate it.', expression: `d/dx [${f}] = ?`, answer: k,
    hint: `The inside is ${k}x. Its derivative must multiply the outer derivative.`,
    steps: [`Outer: ${isSin ? `cos(${k}x)` : `−sin(${k}x)`}. Inner: ${k}.`, `Multiply: ${right}. A faster oscillation has steeper slopes.`],
    visual: card('Chain rule', [isSin ? 'd/dx sin u = cos u·u′' : 'd/dx cos u = −sin u·u′']),
  });
  return choose(rng, q, right, wrongs);
}

function lnChainChoose(rng: Rng): AskStep {
  if (rng.next() < 0.35) {
    const k = rint(rng, 2, 9);
    const q = mkq(S(K5), 'chain rule with ln', {
      prompt: `Catalyst's meter reads ln(${k}x). Differentiate it with the chain rule, then simplify.`, expression: `d/dx [ln(${k}x)] = ?`, answer: 0,
      hint: `d/dx ln u = u′/u with u = ${k}x.`,
      steps: [`(${k})/(${k}x) = 1/x.`, `Also ln(${k}x) = ln ${k} + ln x, and ln ${k} is a constant.`],
      visual: card('ln with an inside', ['d/dx ln u = u′/u']),
    });
    return choose(rng, q, '1/x', [`${k}/x`, `1/(${k}x)`, `1/ln(${k}x)`]);
  }
  const c = rint(rng, 1, 9); const inner = P([c, 0, 1]);
  const q = mkq(S(K5), 'chain rule with ln', {
    prompt: 'A sensor reads on a log scale. Differentiate it.', expression: `d/dx [ln(${inner})] = ?`, answer: 0,
    hint: 'd/dx ln u = u′/u. Do not forget u′.',
    steps: [`u = ${inner}, u′ = 2x.`, `d/dx ln u = u′/u = 2x/(${inner}).`],
    visual: card('ln with an inside', ['d/dx ln u = u′/u']),
  });
  return choose(rng, q, `2x/(${inner})`, [`1/(${inner})`, '1/(2x)', `2x/ln(${inner})`]);
}

function transAtQ(rng: Rng): Question {
  const kind = rint(rng, 0, 3); const A = rint(rng, 2, 5); const k = pick(rng, [2, 3]);
  if (kind === 0) { const B = rint(rng, -5, 5);
    return mkq(S(K5), 'evaluate', { prompt: `Catalyst's culture grows as f(x) = ${A}${ekx(k)}${B ? ` ${fmtSigned(B)}` : ''}. How fast is it growing at x = 0?`, expression: `f(x) = ${A}${ekx(k)}${B ? ` ${fmtSigned(B)}` : ''};  f′(0) = ?`, answer: A * k, hint: 'd/dx e^(kx) = k·e^(kx), and e⁰ = 1.', steps: [`f′(x) = ${A * k}${ekx(k)}.`, `f′(0) = ${A * k}·e⁰ = ${A * k}.`], visual: card('e⁰ = 1', ['d/dx e^(kx) = k·e^(kx)']) }); }
  if (kind === 1) return mkq(S(K5), 'evaluate', { prompt: `Volt's signal is f(x) = ${A}sin(${k}x). Find its rate of change at x = 0.`, expression: `f(x) = ${A}sin(${k}x);  f′(0) = ?`, answer: A * k, hint: 'd/dx sin(kx) = k·cos(kx), and cos 0 = 1.', steps: [`f′(x) = ${A * k}cos(${k}x).`, `f′(0) = ${A * k}·cos 0 = ${A * k}.`], visual: card('cos 0 = 1', ['d/dx sin(kx) = k·cos(kx)']) });
  if (kind === 2) { const c = rint(rng, 2, 5);
    return mkq(S(K5), 'evaluate', { prompt: `A log-scale sensor reads f(x) = ${A} ln x. Find its slope at x = ${c}.`, expression: `f(x) = ${A} ln x;  f′(${c}) = ?`, ...fans(A, c), hint: 'd/dx ln x = 1/x.', steps: [`f′(x) = ${A}/x.`, `f′(${c}) = ${fracStr(A, c)}.`], visual: card('ln x', ['d/dx ln x = 1/x']) }); }
  const at = k === 2 ? 'π/4' : 'π/6';
  return mkq(S(K5), 'evaluate', { prompt: `Newton's spring position is f(x) = ${A}cos(${k}x), x in radians. Find its velocity at x = ${at}.`, expression: `f(x) = ${A}cos(${k}x);  f′(${at}) = ?`, answer: -A * k, hint: `d/dx cos(kx) = −k·sin(kx). At x = ${at}, ${k}x = π/2.`, steps: [`f′(x) = −${A * k}sin(${k}x).`, `f′(${at}) = −${A * k}·sin(π/2) = −${A * k}.`], visual: card('sin(π/2) = 1', ['d/dx cos(kx) = −k·sin(kx)']) });
}
const transAtStep = (rng: Rng) => typed(transAtQ(rng));

const UC_TARGETS = [
  { f: 'sin', slope: '1', ang: [0] }, { f: 'sin', slope: '−1', ang: [180] }, { f: 'sin', slope: '1/2', ang: [60, 300] }, { f: 'sin', slope: '−1/2', ang: [120, 240] }, { f: 'sin', slope: '0', ang: [90, 270] },
  { f: 'cos', slope: '−1', ang: [90] }, { f: 'cos', slope: '1', ang: [270] }, { f: 'cos', slope: '−1/2', ang: [30, 150] }, { f: 'cos', slope: '1/2', ang: [210, 330] }, { f: 'cos', slope: '0', ang: [0, 180] },
];
const RAD: Record<number, string> = { 0: '0', 30: 'π/6', 60: 'π/3', 90: 'π/2', 120: '2π/3', 150: '5π/6', 180: 'π', 210: '7π/6', 240: '4π/3', 270: '3π/2', 300: '5π/3', 330: '11π/6' };
function unitcircleSlopeStep(rng: Rng): AskStep {
  const t = pick(rng, UC_TARGETS); const d = t.f === 'sin' ? 'cos x' : '−sin x';
  const q = mkq(S(K5), 'trig slopes on the unit circle', {
    prompt: `Volt's signal is y = ${t.f} x, with x in radians. Where on [0, 2π) is its slope ${t.slope}?`, expression: `d/dx ${t.f} x = ${t.slope}`, answer: t.ang[0],
    answerText: t.ang.map((a) => `${RAD[a]} (${a}°)`).join(' or '),
    hint: `The slope of ${t.f} x is ${d} (true only in radians). Read that off the circle's coordinates.`,
    steps: [`With x in radians, the slope of ${t.f} x is ${d}. Set ${d} = ${t.slope}.`, `That happens at x = ${t.ang.map((a) => RAD[a]).join(' and ')}.`],
    visual: { type: 'unitcircle', showCoords: true, radians: true },
  });
  return model(q, { kind: 'unitcircle', label: `slope of ${t.f} x is ${d}, x in radians`, showCoords: true }, t.ang.map(String), `Tap an angle x (in radians) where the slope of ${t.f} x is ${t.slope}.`);
}

const TANGENT_POOL: { label: string; fn: Fn; x: number; y: number; m: number; b: number }[] = [
  { label: 'eˣ', fn: { kind: 'exp', a: 1, base: Math.E }, x: 0, y: 1, m: 1, b: 1 },
  { label: 'ln x', fn: { kind: 'log', a: 1, base: 0 }, x: 1, y: 0, m: 1, b: -1 },
  { label: 'sin x', fn: { kind: 'sin' }, x: 0, y: 0, m: 1, b: 0 },
  { label: '2eˣ', fn: { kind: 'exp', a: 2, base: Math.E }, x: 0, y: 2, m: 2, b: 2 },
  { label: 'e²ˣ', fn: { kind: 'exp', a: 1, base: Math.E ** 2 }, x: 0, y: 1, m: 2, b: 1 },
  { label: '3 ln x', fn: { kind: 'log', a: 3, base: 0 }, x: 1, y: 0, m: 3, b: -3 },
];
function tangentTransPlotStep(rng: Rng): AskStep {
  const t = pick(rng, TANGENT_POOL); const range: [number, number, number, number] = [-4, 4, -4, 6];
  const layers: PlotLayers = { fns: [{ fn: t.fn, from: t.fn.kind === 'log' ? 0.02 : -4 }], points: [{ x: t.x, y: t.y, label: 'P' }] };
  const q = mkq(S(K5), 'tangent to a transcendental curve', {
    prompt: `Volt's response curve is y = ${t.label}. Draw its tangent at P(${t.x}, ${t.y}).`, expression: `tangent to y = ${t.label} at x = ${t.x}`, answer: t.m,
    hint: `Find the slope at x = ${t.x} from the derivative, then step from P.`,
    steps: [`Slope at x = ${t.x}: ${t.m}.`, `Tangent: y = ${lineStr(t.m, t.b)}.`],
    visual: plotV(range, layers),
  });
  return model(q, { kind: 'plot', range, count: 2, label: `y = ${t.label}`, layers }, undefined, 'Tap two points on the tangent line at P.', { rule: { kind: 'on-line', m: t.m, b: t.b } });
}

function trigTableStep(rng: Rng): AskStep {
  const A = pick(rng, [1, 2, 3]); const isSin = rng.next() < 0.5;
  const f = `${A === 1 ? '' : A}${isSin ? 'sin' : 'cos'} x`;
  const vals = isSin ? [A, 0, -A] : [0, -A, 0];
  const q = mkq(S(K5), 'trig derivative values', {
    prompt: `Volt's signal is f(x) = ${f}. Fill in its slope at 0, π/2 and π.`, expression: `f′(x) at 0, π/2, π`, answer: vals[0],
    hint: `${isSin ? 'd/dx sin x = cos x' : 'd/dx cos x = −sin x'}. Read the values you need off the unit circle, then scale by the amplitude.`,
    steps: [`f′(x) = ${isSin ? `${A === 1 ? '' : A}cos x` : `−${A === 1 ? '' : A}sin x`}.`, `Values: ${vals.map(fmt).join(', ')}.`],
    visual: plotV([-0.5, 3.5, -A - 1, A + 1], { fns: [{ fn: { kind: isSin ? 'sin' : 'cos', amp: A } }] }),
  });
  return model(q, { kind: 'table', cols: ['0', 'π/2', 'π'], rowLabels: ['f′(x)'], rows: [[null, null, null]], label: `f(x) = ${f}` }, [vals.join(',')], 'Fill f′ at each x.');
}

function lnSliderStep(rng: Rng): AskStep {
  const opt = pick(rng, [{ s: '1/2', x: 2 }, { s: '1/3', x: 3 }, { s: '1/4', x: 4 }, { s: '1/5', x: 5 }, { s: '2', x: 0.5 }, { s: '1', x: 1 }]);
  const range: [number, number, number, number] = [0, 6.5, -2.5, 2.5];
  const q = mkq(S(K5), 'slope of ln x', {
    prompt: `The sensor's response is y = ln x. Slide to the x where its slope is ${opt.s}.`, expression: `slope of ln x = ${opt.s}`, answer: opt.x,
    hint: 'The slope of ln x at x is 1/x.',
    steps: ['d/dx ln x = 1/x.', `1/x = ${opt.s} when x = ${fmt(opt.x)}.`],
    visual: plotV(range, { fns: [{ fn: { kind: 'log', a: 1, base: 0 }, from: 0.05 }] }),
  });
  return model(q, { kind: 'slider', min: 0.5, max: 6, step: 0.5, label: 'x', range, layers: { fns: [{ fn: { kind: 'log', a: 1, base: 0 }, from: 0.05 }] } }, [String(opt.x)], `Slide to where the slope of ln x equals ${opt.s}.`);
}

function coolingTransfer(rng: Rng): AskStep {
  const A = pick(rng, [50, 60, 80]); const k = pick(rng, [0.1, 0.05, 0.2]); const v = round4(-A * k);
  return typed(mkq(S(K5), 'exponential rate', {
    prompt: `A casting cools as T(t) = 20 + ${A}e⁻ᵏᵗ °C with k = ${k}. What is T′(0), its rate of temperature change at t = 0 min?`,
    expression: "T′(0) = ?", answer: v, unit: '°C/min',
    hint: 'd/dt e^(−kt) = −k·e^(−kt), and e⁰ = 1.',
    steps: [`T′(t) = ${A}·(−${k})e⁻ᵏᵗ.`, `${lab(A, 'degrees above the room')} × ${lab(k, 'cooling rate per minute')} = ${lab(fmt(-v), 'degrees lost per minute')}, so T′(0) = ${lab(fmt(v), 'degrees Celsius per minute')}.`],
    visual: card("Newton's cooling", ['T′(t) = −k(T − 20)']),
  }));
}
function springTransfer(rng: Rng): AskStep {
  const A = pick(rng, [2, 3, 5]); const w = pick(rng, [2, 4, 10]);
  return typed(mkq(S(K5), 'trig rate', {
    prompt: `A car spring bounces as x(t) = ${A}cos(${w}t) cm. What is its top speed?`, expression: 'max |x′(t)| = ?', answer: A * w, unit: 'cm/s',
    hint: 'Differentiate: the chain rule brings out the frequency.',
    steps: [`x′(t) = −${A * w}sin(${w}t).`, `|sin| is at most 1, so the top speed is ${lab(A, 'cm amplitude')} × ${lab(w, 'radians per second')} = ${lab(A * w, 'cm/s')}.`],
    visual: plotV([0, 3.2, -A - 1, A + 1], { fns: [{ fn: { kind: 'cos', amp: A, freq: w } }] }),
  }));
}

/* ================================================================== */
/* 6. Tangent lines & motion                                            */
/* ================================================================== */
const K6 = 'motion';

/** A polynomial with a tangent at x = a whose slope and height are small integers. */
function tangentSetup(rng: Rng, avoidZero = false) {
  for (let g = 0; g < 60; g++) {
    const cubicF = rng.next() < 0.4; const qv = rint(rng, -3, 3); const r = rint(rng, -3, 3); const p = pick(rng, [1, -1]);
    const c = cubicF ? [r, qv, 0, 1] : [r, qv, p];
    const a = avoidZero ? pick(rng, [-2, -1, 1, 2]) : rint(rng, -2, 2);
    const m = pev(dpoly(c), a); const fa = pev(c, a);
    if (Math.abs(m) <= 4 && Math.abs(fa) <= 5 && !(avoidZero && m === 0)) return { c, a, m, fa, b: fa - m * a };
  }
  return { c: [1, 0, 1], a: 1, m: 2, fa: 2, b: 0 };
}

function tangentLinePlotStep(rng: Rng): AskStep {
  const t = tangentSetup(rng); const range: [number, number, number, number] = [t.a - 4, t.a + 4, t.fa - 7, t.fa + 7];
  const q = mkq(S(K6), 'tangent line', {
    prompt: `Brick's bridge must touch the rim y = ${P(t.c)} at x = ${fmt(t.a)} and run straight. Draw it.`, expression: `tangent at x = ${fmt(t.a)}`, answer: t.m,
    hint: `Point: (${fmt(t.a)}, f(${fmt(t.a)})). Slope: f′(${fmt(t.a)}).`,
    steps: [`f(${fmt(t.a)}) = ${lab(fmt(t.fa), 'height')} and f′(x) = ${P(dpoly(t.c))}, so f′(${fmt(t.a)}) = ${lab(fmt(t.m), 'slope of the tangent')}.`, `${pointSlope(t.m, t.a, t.fa)} → y = ${lineStr(t.m, t.b)}.`],
    visual: plotV(range, { fns: [{ fn: pfn(t.c) }], tangent: { fn: pfn(t.c), x: t.a } }),
  });
  return model(q, { kind: 'plot', range, count: 2, label: `y = ${P(t.c)}`, layers: { fns: [{ fn: pfn(t.c) }], points: [{ x: t.a, y: t.fa, label: 'touch' }] } }, undefined, 'Tap two points on the tangent line.', { rule: { kind: 'on-line', m: t.m, b: t.b } });
}

function tangentEqChoose(rng: Rng): AskStep {
  const t = tangentSetup(rng, true);
  const right = `y = ${lineStr(t.m, t.b)}`;
  const q = mkq(S(K6), 'tangent line equation', {
    prompt: `Brick's support beam must touch the arch y = ${P(t.c)} at x = ${fmt(t.a)}. Which line is it?`, expression: `tangent at x = ${fmt(t.a)}`, answer: t.m,
    hint: 'You need a point (a, f(a)) AND a slope f′(a). Then y − f(a) = f′(a)(x − a).',
    steps: [`f(${fmt(t.a)}) = ${lab(fmt(t.fa), 'height')}, f′(${fmt(t.a)}) = ${lab(fmt(t.m), 'slope of the tangent')}.`, `${pointSlope(t.m, t.a, t.fa)}, so y = ${lineStr(t.m, t.b)}.`],
    visual: plotV([t.a - 4, t.a + 4, t.fa - 7, t.fa + 7], { fns: [{ fn: pfn(t.c) }], points: [{ x: t.a, y: t.fa }] }),
  });
  // slope through the origin; f(a) as intercept; slope and height swapped; sign slip y = m(x + a) + f(a)
  return choose(rng, q, right, [`y = ${lineStr(t.m, 0)}`, `y = ${lineStr(t.m, t.fa)}`, `y = ${lineStr(t.fa, t.m)}`, `y = ${lineStr(t.m, t.m * t.a + t.fa)}`, `y = ${lineStr(-t.m, t.fa + t.m * t.a)}`]);
}

const MOTION_PQ: [number, number][] = [[1, 3], [1, 5], [2, 4], [3, 5], [2, 6]];
/** s(t) = t³ − 1.5(p+q)t² + 3pq·t, so v(t) = 3(t − p)(t − q). */
function motion(rng: Rng) {
  const [p, q] = pick(rng, MOTION_PQ); const s = [0, 3 * p * q, -1.5 * (p + q), 1];
  return { p, q, s, sS: P(s, 't'), v: (t: number) => 3 * (t - p) * (t - q), a: (t: number) => 6 * t - 3 * (p + q), vS: P(dpoly(s), 't'), aS: P(dpoly(dpoly(s)), 't') };
}

function velocityQ(rng: Rng): Question {
  const M = motion(rng); const k = rint(rng, 0, 7); const v = M.v(k);
  return mkq(S(K6), 'velocity', {
    prompt: `A crane trolley's position is s(t) = ${M.sS} metres. Find its velocity at t = ${k} s.`, expression: `v(${k}) = s′(${k}) = ?`, answer: v, unit: 'm/s',
    hint: 'Velocity is the derivative of position.',
    steps: [`v(t) = s′(t) = ${M.vS}.`, `At t = ${labn(k, 'second')}: v(${k}) = ${lab(fmt(v), 'm/s velocity')}.`],
    visual: plotV([0, 7, -20, 30], { fns: [{ fn: pfn(M.s) }] }),
  });
}
const velocityStep = (rng: Rng) => typed(velocityQ(rng));

function accelStep(rng: Rng): AskStep {
  const M = motion(rng); const k = rint(rng, 0, 6); const a = M.a(k);
  return typed(mkq(S(K6), 'acceleration', {
    prompt: `A trolley's position is s(t) = ${M.sS} metres. Find its acceleration at t = ${k} s.`, expression: `a(${k}) = s″(${k}) = ?`, answer: a, unit: 'm/s²',
    hint: 'Acceleration is the derivative of velocity: differentiate twice.',
    steps: [`v(t) = ${M.vS}, a(t) = ${M.aS}.`, `At t = ${labn(k, 'second')}: a(${k}) = ${lab(fmt(a), 'm/s² acceleration')}.`],
    visual: card('Differentiate twice', ['s → v = s′ → a = v′ = s″']),
  }));
}

function motionTableStep(rng: Rng): AskStep {
  const M = motion(rng); const ts = [0, M.p, M.q + 1]; const vs = ts.map(M.v);
  const q = mkq(S(K6), 'velocity table', {
    prompt: `Launch rail cart: s(t) = ${M.sS}. Fill its velocity at t = ${ts.join(', ')} s.`, expression: 'v(t) = s′(t)', answer: vs[0],
    hint: 'Differentiate s(t) once, then substitute each time.',
    steps: [`v(t) = ${M.vS} = 3(t − ${M.p})(t − ${M.q}).`, `v: ${vs.map(fmt).join(', ')} (m/s). At t = ${lab(M.p, 'seconds')} the cart is momentarily at rest.`],
    visual: card('Velocity', [`s(t) = ${M.sS}`]),
  });
  return model(q, { kind: 'table', cols: ['t (s)', 'v (m/s)'], rows: [[ts[0], null], [ts[1], null], [ts[2], null]], label: `s(t) = ${M.sS}` }, [vs.join(',')], 'Fill each velocity.');
}

function restNumberlineStep(rng: Rng): AskStep {
  const M = motion(rng);
  const q = mkq(S(K6), 'at rest', {
    prompt: `A crane trolley moves with s(t) = ${M.sS}. When is it at rest?`, expression: 'v(t) = 0', answer: M.p,
    hint: 'At rest means velocity 0, not position 0.',
    steps: [`v(t) = ${M.vS} = 3(t − ${M.p})(t − ${M.q}).`, `v = 0 at t = ${lab(M.p, 'seconds')} and t = ${lab(M.q, 'seconds')}.`],
    visual: card('At rest', ['v(t) = 0']),
  });
  return model(q, { kind: 'numberline', start: 0, min: 0, max: 10, label: 'time t (s)' }, [String(M.p), String(M.q)], 'Set v(t) = 0 and tap one time the trolley stops.');
}

function speedingChoose(rng: Rng): AskStep {
  const v = rnz(rng, -9, 9); const a = rnz(rng, -6, 6); const k = rint(rng, 1, 8);
  const dir = v > 0 ? 'Forward' : 'Backward'; const sp = v * a > 0 ? 'speeding up' : 'slowing down';
  const q = mkq(S(K6), 'speeding up or slowing down', {
    prompt: `Newton's test sled at t = ${k} s: v = ${fmt(v)} m/s, a = ${fmt(a)} m/s². How is it moving?`, expression: `v(${k}) = ${fmt(v)}, a(${k}) = ${fmt(a)}`, answer: 0,
    hint: 'Speeding up when v and a have the SAME sign; slowing down when they differ. Negative a alone does not mean slowing.',
    steps: [`v ${v > 0 ? '> 0' : '< 0'}: moving ${dir.toLowerCase()}.`, `v and a have ${v * a > 0 ? 'the same sign' : 'opposite signs'}: ${sp}.`],
    visual: card('Speed', ['same signs → speeding up', 'opposite signs → slowing down']),
  });
  return choose(rng, q, `${dir}, ${sp}`, ['Forward, speeding up', 'Forward, slowing down', 'Backward, speeding up', 'Backward, slowing down'].filter((x) => x !== `${dir}, ${sp}`));
}

function peakTableStep(rng: Rng): AskStep {
  const v0 = pick(rng, [10, 20, 30, 40]); const h0 = pick(rng, [0, 5, 10, 20]); const t = v0 / 10; const H = h0 + 5 * t * t;
  const hc = [h0, v0, -5];
  const q = mkq(S(K6), 'peak height', {
    prompt: `Newton fires a signal flare: h(t) = ${P(hc, 't')} m. Find its velocity law, when it peaks, and how high it gets.`, expression: 'peak: h′(t) = 0', answer: t,
    hint: 'Velocity is h′(t). At the peak the flare stops rising, so h′(t) = 0 there. The height is h at that time.',
    steps: [`h′(t) = ${P(dpoly(hc), 't')}: t-coefficient −10, constant ${lab(v0, 'm/s launch speed')}.`, `${P(dpoly(hc), 't')} = 0 → t = ${v0} ÷ 10 = ${lab(t, 'seconds')}.`, `h(${t}) = ${h0 ? `${lab(h0, 'm start')} + ` : ''}${v0 * t} − ${5 * t * t} = ${lab(H, 'm peak height')}.`],
    visual: card('Flare', [`h(t) = ${P(hc, 't')}`, 'peak ⇔ v = h′ = 0']),
  });
  return model(q, { kind: 'table', cols: ['step', 'value'], rows: [['h′(t): coefficient of t', null], ['h′(t): constant term', null], ['peak time t (s)', null], ['peak height (m)', null]], label: `h(t) = ${P(hc, 't')}` }, [`-10,${v0},${t},${H}`], 'Build h′(t), solve h′(t) = 0, then find the height there.');
}


function linearizeTransfer(rng: Rng): AskStep {
  const n = rint(rng, 2, 5); const e = pick(rng, [0.01, 0.02, 0.05]); const d = round4(2 * n * e); const x = round4(n * n + d);
  return typed(mkq(S(K6), 'linear approximation', {
    prompt: `No calculator on site. Use the tangent line to y = √x at x = ${n * n} to estimate √${fmt(x)}.`, expression: `√${fmt(x)} ≈ ?`, answer: round4(n + e), tolerance: 0.001,
    hint: `Near x = ${n * n}: √x ≈ ${n} + (x − ${n * n})/(2·${n}).`,
    steps: [`f(${n * n}) = ${n}, f′(x) = 1/(2√x) so f′(${n * n}) = 1/${2 * n}.`, `√${fmt(x)} ≈ ${n} + ${fmt(d)}/${2 * n} = ${fmt(n + e)}.`],
    visual: card('Tangent line estimate', ['f(a + Δx) ≈ f(a) + f′(a)·Δx']),
  }));
}
function impactTransfer(rng: Rng): AskStep {
  const v0 = pick(rng, [10, 15, 20, 25]); const T = v0 / 5;
  return typed(mkq(S(K6), 'velocity', {
    prompt: `A juggler tosses a ball: h(t) = ${v0}t − 5t² m. It lands at t = ${fmt(T)} s. What is its velocity then?`, expression: `h′(${fmt(T)}) = ?`, answer: -v0, unit: 'm/s',
    hint: 'Differentiate h, then substitute the landing time. Falling means negative.',
    steps: [`h′(t) = ${v0} − 10t.`, `h′(${fmt(T)}) = ${v0} − 10·${lab(fmt(T), 'seconds')} = ${lab(fmt(-v0), 'm/s, falling')}.`],
    visual: plotV([0, T + 0.5, -2, (v0 * v0) / 20 + 3], { fns: [{ fn: pfn([0, v0, -5]) }] }),
  }));
}

/* ================================================================== */
/* 7. Related rates & optimisation                                      */
/* ================================================================== */
const K7 = 'rates';

function rippleChoose(rng: Rng): AskStep {
  const R = pick(rng, [3, 4, 5, 6, 10]); let rp = rint(rng, 2, 5); if (R === 2 * rp) rp = rp === 5 ? 4 : rp + 1; // πR² would equal the answer
  const q = mkq(S(K7), 'related rates', {
    prompt: `A ripple's radius grows at ${rp} cm/s. How fast is its area growing when r = ${R} cm?`, expression: 'dA/dt = ?', answer: 2 * R * rp,
    hint: 'Differentiate A = πr² with respect to t FIRST. Only then substitute r.',
    steps: ['A = πr², so dA/dt = 2πr·(dr/dt).', `dA/dt = 2π·${lab(R, 'cm radius')}·${lab(rp, 'cm/s')} = ${2 * R * rp}π cm²/s.`],
    visual: { type: 'geo', items: [{ t: 'circle', c: [0, 0], r: 3 }, { t: 'circle', c: [0, 0], r: 2, color: 'muted' }, { t: 'seg', a: [0, 0], b: [3, 0], label: 'r' }] },
  });
  return choose(rng, q, `${2 * R * rp}π cm²/s`, [`${R * R}π cm²/s`, '0 cm²/s', `${2 * R}π cm²/s`, `${R * rp}π cm²/s`]);

}

function ladderQ(rng: Rng) {
  const [x, y, L] = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [4, 3, 5]] as [number, number, number][]); const xp_ = rint(rng, 1, 4);
  return { x, y, L, xp: xp_, n: -x * xp_, d: y };
}
function ladderStep(rng: Rng): AskStep {
  const l = ladderQ(rng);
  return typed(mkq(S(K7), 'ladder', {
    prompt: `A ${l.L} m ladder leans on a wall. Its foot slides out at ${l.xp} m/s. How fast is the top moving when the foot is ${l.x} m out?`,
    expression: 'dy/dt = ? (negative = down)', ...fans(l.n, l.d), unit: 'm/s',
    hint: 'x² + y² = L². Differentiate with respect to t, then substitute.',
    steps: [`2x·dx/dt + 2y·dy/dt = 0.`, `When x = ${lab(l.x, 'm out')}, y = √(${l.L * l.L} − ${l.x * l.x}) = ${lab(l.y, 'm up the wall')}.`, `dy/dt = −x·(dx/dt)/y = −${l.x}·${l.xp}/${l.y} = ${lab(fracStr(l.n, l.d), 'm/s for the top')}.`],
    visual: { type: 'geo', items: [{ t: 'poly', pts: [[0, 0], [l.x, 0], [0, l.y]], labels: [`x = ${l.x}`, `${l.L}`, 'y = ?'] }, { t: 'arc', at: [0, 0], from: [1, 0], to: [0, 1], right: true }] },
  }));
}
function ladderTableStep(rng: Rng): AskStep {
  const l = ladderQ(rng);
  const q = mkq(S(K7), 'ladder', {
    prompt: `A ${l.L} m ladder's foot slides out at ${l.xp} m/s. Fill the height and its rate when the foot is ${l.x} m out.`, expression: 'y and dy/dt', answer: l.y,
    hint: 'Pythagoras gives y. Then 2x·dx/dt + 2y·dy/dt = 0 gives dy/dt.',
    steps: [`y = √(${l.L}² − ${l.x}²) = ${lab(l.y, 'm up the wall')}.`, `dy/dt = −x·(dx/dt)/y = −${l.x}·${l.xp}/${l.y} = ${lab(fracStr(l.n, l.d), 'm/s for the top')}.`],
    visual: card('Ladder', [`x² + y² = ${l.L}²`]),
  });
  return model(q, { kind: 'table', cols: ['quantity', 'value'], rows: [['x (m)', l.x], ['y (m)', null], ['dx/dt (m/s)', l.xp], ['dy/dt (m/s)', null]], label: `Ladder ${lab(l.L, 'metres')}: x² + y² = ${l.L}²` }, joinForms([[String(l.y)], forms(l.n, l.d)]), 'Fill y, then dy/dt (negative means the top slides down).');
}

function sphereStep(rng: Rng): AskStep {
  const r = pick(rng, [1, 2, 3, 5]); const [pn, pd] = pick(rng, [[1, 2], [1, 1], [2, 1], [3, 1]] as [number, number][]); const dV = (4 * r * r * pn) / pd;
  return typed(mkq(S(K7), 'related rates', {
    prompt: `Catalyst inflates a spherical tank at ${dV}π cm³/s. How fast is the radius growing when r = ${r} cm?`, expression: 'dr/dt = ?', ...fans(pn, pd), unit: 'cm/s',
    hint: 'V = (4/3)πr³. Differentiate with respect to t, then solve for dr/dt.',
    steps: ['dV/dt = 4πr²·dr/dt.', `Put in r = ${lab(r, 'cm')}: ${dV}π = 4π·${r * r}·dr/dt = ${4 * r * r}π·dr/dt.`, `dr/dt = ${dV}/${4 * r * r} = ${lab(fracStr(pn, pd), 'cm/s')}.`],
    visual: { type: 'geo', items: [{ t: 'circle', c: [0, 0], r: 3 }, { t: 'seg', a: [0, 0], b: [3, 0], label: `r = ${r}` }] },
  }));
}

function fence(rng: Rng) { const L = pick(rng, [40, 60, 80, 100, 120]); return { L, x: L / 4, A: (L * L) / 8 }; }
const penVisual = (L: string) => ({ type: 'geo', items: [{ t: 'seg', a: [-1, 2], b: [7, 2], label: 'wall' }, { t: 'poly', pts: [[0, 2], [0, 0], [6, 0], [6, 2]], open: true, labels: ['x', L, 'x', ''] }] } as Visual);
/** The whole optimisation: model A(x) from the fence, then A′ = 0, then the best area. */
function fenceTableStep(rng: Rng): AskStep {
  const f = fence(rng);
  const q = mkq(S(K7), 'optimisation', {
    prompt: `Ada has ${f.L} m of fence for three sides of a pen against a wall. The two sides touching the wall are x m each. Find the biggest pen.`, expression: 'A(x), then A′(x) = 0', answer: f.x,

    hint: 'The side opposite the wall gets whatever fence is left after the two x sides. Area = width × length; then set A′(x) = 0.',
    steps: [`Opposite side: ${lab(f.L, 'm of fence')} − 2x, so A(x) = x(${f.L} − 2x) = ${f.L}x − 2x².`, `A′(x) = ${f.L} − 4x = 0 → x = ${f.L} ÷ 4 = ${lab(f.x, 'm per end side')}; A″ = −4 < 0, so it is a maximum.`, `A(${f.x}) = ${lab(f.x, 'metres')} × ${lab(f.L / 2, 'm opposite side')} = ${lab(f.A, 'm² area')}.`],
    visual: penVisual('?'),
  });
  return model(q, { kind: 'table', cols: ['step', 'value'], rows: [['A(x): coefficient of x²', null], ['A(x): coefficient of x', null], ['best x (m)', null], ['largest area (m²)', null]], label: `${lab(f.L, 'metres of fence')}, three sides` }, [`-2,${f.L},${f.x},${f.A}`], 'Write A(x) = __x² + __x, then find the best x and the area.');
}
function objectiveChoose(rng: Rng): AskStep {
  const L = pick(rng, [40, 60, 80, 100, 120]);
  const q = mkq(S(K7), 'set up the objective', {
    prompt: `Ada has ${L} m of fence for three sides of a pen against a wall; the two sides touching the wall are x m each. Which function is the area to maximise?`,
    expression: 'A(x) = ?', answer: 0,
    hint: 'Spend the fence: two sides of x, and the side opposite the wall gets the rest. Area is width × length.',
    steps: [`The opposite side is ${lab(L, 'm of fence')} − 2x, so A(x) = x(${L} − 2x).`, `x(${L} − x) forgets one x side; 2x + (${L} − 2x) is fence length, not area.`],
    visual: penVisual('?'),
  });
  return choose(rng, q, `A(x) = x(${L} − 2x)`, [`A(x) = x(${L} − x)`, `A(x) = 2x + (${L} − 2x)`, `A(x) = x(${L} − 2x)/2`]);
}
/** A conical tank (point down) with radius half the depth: V = πh³/12. */
function coneStep(rng: Rng): AskStep {
  const H = pick(rng, [2, 4, 6]); const qn = pick(rng, [1, 2, 3, 4, 9]); const f = fans(4 * qn, H * H);
  return typed(mkq(S(K7), 'related rates', {
    prompt: `Catalyst fills a cone-shaped tank, point down, whose radius is half its depth, at ${qn}π m³/min. How fast is the water rising when it is ${H} m deep?`,
    expression: 'dh/dt = ?', ...f, unit: 'm/min',
    hint: 'Similar triangles: r = h/2 at every depth. Put that into V = (1/3)πr²h before differentiating.',
    steps: ['r = h/2, so V = (1/3)π(h/2)²h = πh³/12.', `dV/dt = (πh²/4)·dh/dt. Put in h = ${lab(H, 'm deep')}: ${qn}π = (π·${H * H}/4)·dh/dt.`, `dh/dt = ${4 * qn}/${H * H} = ${lab(fracStr(4 * qn, H * H), 'm/min')}.`],
    visual: { type: 'geo', items: [{ t: 'poly', pts: [[-2, 4], [2, 4], [0, 0]] }, { t: 'seg', a: [-1, 2], b: [1, 2], label: 'water' }, { t: 'seg', a: [0, 0], b: [0, 2], dashed: true, label: 'h' }, { t: 'seg', a: [0, 2], b: [1, 2], label: 'r = h/2' }] },
  }));
}
function fenceAreaStep(rng: Rng): AskStep {
  const f = fence(rng);
  return typed(mkq(S(K7), 'optimisation', {
    prompt: `${f.L} m of fence, three sides, a wall for the fourth. A(x) = x(${f.L} − 2x). What is the largest area?`, expression: 'A max = ?', answer: f.A, unit: 'm²',
    hint: 'Find x from A′(x) = 0 first, then compute A at that x.',
    steps: [`A′(x) = ${f.L} − 4x = 0 → x = ${lab(f.x, 'm per end side')}.`, `A(${f.x}) = ${f.x}·(${f.L} − ${2 * f.x}) = ${lab(f.x, 'metres')} × ${lab(f.L / 2, 'm opposite side')} = ${lab(f.A, 'm² area')}.`],
    visual: plotV([0, f.L / 2, 0, f.A * 1.2], { fns: [{ fn: pfn([0, f.L, -2]) }] }),
  }));
}

function boxSliderStep(rng: Rng): AskStep {
  const W = pick(rng, [6, 12, 18, 24]); const dV = [W * W, -8 * W, 12];
  const range: [number, number, number, number] = [0, W / 2, -Math.ceil((W * W) / 3) - 2, W * W + 2];
  const q = mkq(S(K7), 'optimisation', {
    prompt: `Brick folds a ${W} cm square sheet into an open box by cutting x cm squares from the corners: V(x) = x(${W} − 2x)². The graph shows V′(x). Slide to the best cut.`,
    expression: "V′(x) = 0, + to −", answer: W / 6, unit: 'cm',
    hint: 'Expand V, differentiate, and find where V′ changes sign from + to −.',
    steps: [`V′(x) = ${W * W} − ${8 * W}x + 12x² = (${W} − 2x)(${W} − 6x): zeros at x = ${lab(W / 6, 'cm')} and x = ${lab(W / 2, 'cm')}.`, `At x = ${lab(W / 6, 'cm cut')} V′ goes + to −: the maximum. At x = ${lab(W / 2, 'cm cut')} there is no box (V = 0), a minimum.`],
    visual: card('Open box', [`V(x) = x(${W} − 2x)²`, 'max where V′ goes + to −']),
  });
  return model(q, { kind: 'slider', min: 0, max: W / 2, step: 0.5, label: 'cut x (cm)', unit: 'cm', range, layers: { fns: [{ fn: pfn(dV), label: 'V′', color: 'orange' }] } }, [String(W / 6)], 'Slide to the cut where V′ crosses zero from + to −.');
}

function endpointChoose(rng: Rng): AskStep {
  const h = rint(rng, -2, 2); const k = rint(rng, -4, 2); let p = rint(rng, 1, 3); let qv = rint(rng, 1, 3); if (p === qv) { if (qv < 3) qv++; else p--; }
  const c = [h * h + k, -2 * h, 1]; const far = Math.max(p, qv); const near = Math.min(p, qv); const farX = p > qv ? h - p : h + qv;
  const q = mkq(S(K7), 'closed interval extremes', {
    prompt: `Volt's load curve is f(x) = ${P(c)} on [${fmt(h - p)}, ${fmt(h + qv)}]. What is its absolute maximum?`, expression: `max of f on [${fmt(h - p)}, ${fmt(h + qv)}]`, answer: far * far + k,
    hint: 'Check the critical point AND both endpoints. f′ = 0 can be a minimum.',
    steps: [`f′(x) = ${P(dpoly(c))} = 0 at x = ${fmt(h)}: f(${fmt(h)}) = ${fmt(k)}, the minimum.`, `Endpoints: f(${fmt(h - p)}) = ${fmt(p * p + k)}, f(${fmt(h + qv)}) = ${fmt(qv * qv + k)}.`, `Largest: ${fmt(far * far + k)} at x = ${fmt(farX)}.`],
    visual: plotV([h - p - 1, h + qv + 1, k - 2, far * far + k + 2], { fns: [{ fn: pfn(c), from: h - p, to: h + qv }], vlines: [{ x: h - p }, { x: h + qv }] }),
  });
  return choose(rng, q, fmt(far * far + k), [fmt(k), fmt(near * near + k), fmt(farX), fmt(h), fmt(far * far)]);
}

function shadowTransfer(rng: Rng): AskStep {
  const H = pick(rng, [4, 6, 8]); const w = pick(rng, [1.5, 3]); const v = round4((2 / (H - 2)) * w);
  return typed(mkq(S(K7), 'related rates', {
    prompt: `A 2 m tall engineer walks away from a ${H} m lamp post at ${w} m/s. How fast does her shadow grow?`, expression: 'ds/dt = ?', answer: v, unit: 'm/s',
    hint: `Similar triangles: s/2 = (x + s)/${H}. Solve for s in terms of x, then differentiate.`,
    steps: [`With ${lab(2, 'm engineer')} and ${lab(H, 'm lamp')}: ${H}s = 2x + 2s → s = x/${(H - 2) / 2}.`.replace('x/1.', 'x.'), (H - 2) / 2 === 1 ? `ds/dt = dx/dt = ${lab(fmt(v), 'm/s')}.` : `ds/dt = (dx/dt)/${(H - 2) / 2} = ${lab(w, 'm/s walking')} ÷ ${(H - 2) / 2} = ${lab(fmt(v), 'm/s shadow growth')}.`, 'The distance x never needed a value.'],
    visual: { type: 'geo', items: [{ t: 'seg', a: [0, 0], b: [0, H] }, { t: 'seg', a: [3, 0], b: [3, 2], label: '2' }, { t: 'seg', a: [0, H], b: [3 * H / (H - 2), 0], dashed: true }, { t: 'seg', a: [0, 0], b: [3 * H / (H - 2), 0] }, { t: 'text', p: [-0.6, H / 2], text: `${H}` }] },
  }));
}
function productMaxTransfer(rng: Rng): AskStep {
  const Sm = pick(rng, [10, 20, 30, 40]);
  return typed(mkq(S(K7), 'optimisation', {
    prompt: `Brick's rectangular pad must have length + width = ${Sm} m. What is the largest area it can have?`, expression: 'max of A(x) = ?', answer: (Sm * Sm) / 4, unit: 'm²',
    hint: 'Call the width x; the length is what is left. Write A(x), then set A′(x) = 0.',
    steps: [`A(x) = x(${Sm} − x), so A′(x) = ${Sm} − 2x = 0 → x = ${lab(Sm / 2, 'm width')}.`, `A = ${lab(Sm / 2, 'metres')} × ${lab(Sm / 2, 'metres')} = ${lab((Sm * Sm) / 4, 'm² area')}: a square is best.`],

    visual: plotV([0, Sm, 0, (Sm * Sm) / 4 + 5], { fns: [{ fn: pfn([0, Sm, -1]) }] }),
  }));
}

/* ================================================================== */
/* 8. Curve sketching                                                   */
/* ================================================================== */
const K8 = 'sketch';

function signNumberlineStep(rng: Rng): AskStep {
  const r1 = rint(rng, -5, 2); const r2 = r1 + rint(rng, 2, 4); const a = pick(rng, [1, -1, 2, 3, -3]); const wantMax = rng.next() < 0.5;
  const fp = [a * r1 * r2, -a * (r1 + r2), a];
  const ans = (a > 0) === wantMax ? r1 : r2;
  const signs = a > 0 ? '+, −, +' : '−, +, −';
  const q = mkq(S(K8), 'first derivative test', {
    prompt: `Vector's slope logger gives f′(x) = ${P(fp)} for the rim height f. Where does the rim have a local ${wantMax ? 'maximum' : 'minimum'}?`, expression: `local ${wantMax ? 'max' : 'min'} of f`, answer: ans,
    hint: 'Factor f′ to find its zeros, then read the sign of f′ on each side.',
    steps: [`f′(x) = ${factored(a, r1, r2)}: zeros ${fmt(r1)} and ${fmt(r2)}.`, `Signs of f′ on the three stretches: ${signs}.`, `f′ goes ${wantMax ? '+ to −' : '− to +'} at x = ${fmt(ans)}: a local ${wantMax ? 'maximum' : 'minimum'}.`],
    visual: { type: 'numline', min: -6, max: 6, points: [{ x: r1 }, { x: r2 }] },
  });
  return model(q, { kind: 'numberline', start: 0, min: -6, max: 6, label: 'x' }, [String(ans)], `Tap the x of the local ${wantMax ? 'maximum' : 'minimum'}.`);
}

function pickDerivGraph(rng: Rng): AskStep {
  const fam = rint(rng, 0, 2); const h = rnz(rng, -2, 2); const k = rint(rng, -2, 2);
  let fS: string; let right: Fn; let wrongs: Fn[]; let desc: string;
  // wrongs: −f′ (sign slip), a shifted line/curve, and f itself (reading f as if it were f′)
  if (fam === 0) { fS = P([h * h + k, -2 * h, 1]); right = pfn([-2 * h, 2]); wrongs = [pfn([2 * h, -2]), pfn([2 * h, 2]), pfn([h * h + k, -2 * h, 1])]; desc = `f′(x) = 2x ${fmtSigned(-2 * h)}: a rising line crossing zero at x = ${fmt(h)}.`; }
  else if (fam === 1) { fS = P([k, -3, 0, 1]); right = pfn([-3, 0, 3]); wrongs = [pfn([3, 0, -3]), pfn([0, 0, 3]), pfn([k, -3, 0, 1])]; desc = 'f′(x) = 3x² − 3: a parabola crossing zero at x = −1 and x = 1, where f turns.'; }
  else { fS = P([-h * h + k, 2 * h, -1]); right = pfn([2 * h, -2]); wrongs = [pfn([-2 * h, 2]), pfn([-2 * h, -2]), pfn([-h * h + k, 2 * h, -1])]; desc = `f′(x) = −2x ${fmtSigned(2 * h)}: a falling line crossing zero at x = ${fmt(h)}.`; }
  const range: [number, number, number, number] = [-4, 4, -6, 6];
  const q = mkq(S(K8), 'graph of f′', {
    prompt: `Ada's rim profile is f(x) = ${fS}. Which graph is its slope function f′?`, expression: `f(x) = ${fS}`, answer: 0,
    hint: 'f′ is zero where f turns, positive where f rises, negative where f falls.',
    steps: [desc, 'Check: f′ must be positive exactly where f is increasing.'],
    visual: plotV(range, { fns: [{ fn: right }] }),
  });
  return pickLettered(rng, q, [{ visual: plotV(range, { fns: [{ fn: right }] }), right: true }, ...wrongs.map((w) => ({ visual: plotV(range, { fns: [{ fn: w }] }) }))]);
}

function concavityChoose(rng: Rng): AskStep {
  const s = pick(rng, [1, -1]); const p = rnz(rng, -3, 3); const cx = rint(rng, -4, 4);
  const c = [0, cx, -3 * s * p, s]; const up = s > 0 ? `x > ${fmt(p)}` : `x < ${fmt(p)}`; const down = s > 0 ? `x < ${fmt(p)}` : `x > ${fmt(p)}`;
  const q = mkq(S(K8), 'concavity', {
    prompt: `Brick's arch follows f(x) = ${P(c)}. Where does it bend upward (concave up)?`, expression: 'f″(x) > 0 where?', answer: p,
    hint: 'Concave up where f″ > 0. Differentiate twice.',
    steps: [`f′(x) = ${P(dpoly(c))}, f″(x) = ${P(dpoly(dpoly(c)))}.`, `f″(x) > 0 when ${up}.`],
    visual: card('Concavity', ['f″ > 0: concave up (holds water)', 'f″ < 0: concave down']),
  });
  return choose(rng, q, up, [down, s > 0 ? `x > ${fmt(-p)}` : `x < ${fmt(-p)}`, 'x > 0']);
}

function inflectionPlotStep(rng: Rng): AskStep {
  const s = pick(rng, [1, -1]); const h = rint(rng, -2, 2); const k = rint(rng, -2, 2);
  const c = [-s * h ** 3 + 3 * s * h + k, 3 * s * h * h - 3 * s, -3 * s * h, s];
  const range: [number, number, number, number] = [h - 4, h + 4, k - 6, k + 6];
  const q = mkq(S(K8), 'inflection point', {
    prompt: `The rim follows f(x) = ${P(c)}. Tap its inflection point, where the bending flips.`, expression: 'f″ changes sign', answer: h,
    hint: 'Inflection: f″ changes sign. The turning points (f′ = 0) are different points.',
    steps: [`f″(x) = ${P(dpoly(dpoly(c)))} = 0 at x = ${fmt(h)}, and it changes sign there.`, `f(${fmt(h)}) = ${fmt(k)}: the inflection point is (${fmt(h)}, ${fmt(k)}).`],
    visual: plotV(range, { fns: [{ fn: pfn(c) }] }),
  });
  return model(q, { kind: 'plot', range, count: 1, label: `f(x) = ${P(c)}`, layers: { fns: [{ fn: pfn(c) }] } }, [`${h},${k}`], 'Find where f″ changes sign and tap that point on the curve.');
}

function fprimePlotStep(rng: Rng): AskStep {
  const s = pick(rng, [1, -1]); const r1 = rint(rng, -3, 1); const r2 = r1 + pick(rng, [2, 4]); const wantMin = rng.next() < 0.5;
  const fp = [s * r1 * r2, -s * (r1 + r2), s];
  const ans = (s > 0) === wantMin ? r2 : r1;
  const range: [number, number, number, number] = [r1 - 2, r2 + 2, -5, 5];
  const q = mkq(S(K8), "reading f′", {
    prompt: `Newton's sensor plots the slope f′ of a track, not the track f. Where does f have a local ${wantMin ? 'minimum' : 'maximum'}?`, expression: `f′(x) = ${P(fp)}`, answer: ans,
    hint: `f has a local ${wantMin ? 'min where f′ crosses from negative to positive' : 'max where f′ crosses from positive to negative'}. The ${s > 0 ? 'low' : 'high'} point of f′ is not it.`,
    steps: [`f′ crosses zero at ${fmt(r1)} and ${fmt(r2)}.`, `At x = ${fmt(ans)} f′ goes ${wantMin ? '− to +' : '+ to −'}: a local ${wantMin ? 'minimum' : 'maximum'} of f.`],
    visual: plotV(range, { fns: [{ fn: pfn(fp), label: 'f′' }] }),
  });
  return model(q, { kind: 'plot', range, count: 1, label: 'the graph of f′', layers: { fns: [{ fn: pfn(fp), label: 'f′', color: 'orange' }] } }, [`${ans},0`], `Tap the x-axis point where f has a local ${wantMin ? 'minimum' : 'maximum'}.`);
}

function flatNoExtremumChoose(rng: Rng): AskStep {
  const c0 = rint(rng, -3, 3);
  const opt = pick(rng, [
    { c: [c0, 0, 0, 1], ans: 'Neither: f′ does not change sign', why: 'f′(x) = 3x² ≥ 0 on both sides of 0: f keeps rising.' },
    { c: [c0, 0, 0, -1], ans: 'Neither: f′ does not change sign', why: 'f′(x) = −3x² ≤ 0 on both sides of 0: f keeps falling.' },
    { c: [c0, 0, 0, 0, 1], ans: 'A local minimum', why: 'f′(x) = 4x³ goes − to + at 0.' },
    { c: [c0, 0, 0, 0, -1], ans: 'A local maximum', why: 'f′(x) = −4x³ goes + to − at 0.' },
    { c: [c0, 0, 0, 0, 0, 1], ans: 'Neither: f′ does not change sign', why: 'f′(x) = 5x⁴ ≥ 0 on both sides of 0.' },
  ]);
  const q = mkq(S(K8), 'critical point test', {
    prompt: `Vector's cam profile f(x) = ${P(opt.c)} is flat at x = 0: f′(0) = 0. What does f have there?`, expression: `f(x) = ${P(opt.c)}`, answer: 0,
    hint: 'f′ = 0 only makes x = 0 a candidate. Check the sign of f′ just left and right of 0.',
    steps: [opt.why, `So: ${opt.ans}.`],
    visual: plotV([-2, 2, c0 - 4, c0 + 4], { fns: [{ fn: pfn(opt.c) }] }),
  });
  return choose(rng, q, opt.ans, ['A local minimum', 'A local maximum', 'Neither: f′ does not change sign'].filter((x) => x !== opt.ans));
}

/** f′ = 3a(x − r1)(x − r2): where is f increasing? */
function increasingChoose(rng: Rng): AskStep {
  const a = pick(rng, [1, -1]); const r1 = rint(rng, -3, 1); const r2 = r1 + pick(rng, [2, 4]); const c = rint(rng, -4, 4); const mid = (r1 + r2) / 2;
  const f = [c, 3 * a * r1 * r2, (-3 * a * (r1 + r2)) / 2, a];
  const outside = `x < ${fmt(r1)} or x > ${fmt(r2)}`; const inside = `${fmt(r1)} < x < ${fmt(r2)}`;
  const right = a > 0 ? outside : inside;
  const q = mkq(S(K8), 'increasing and decreasing', {
    prompt: `Ada's road profile is f(x) = ${P(f)}. On which stretch does the road climb (f increasing)?`, expression: 'f′(x) > 0 where?', answer: r1,
    hint: 'f climbs where f′ > 0. Differentiate, factor f′, and test the sign of f′ on each stretch between its zeros.',
    steps: [`f′(x) = ${P(dpoly(f))} = ${factored(3 * a, r1, r2)}: zeros ${fmt(r1)} and ${fmt(r2)}.`, `Signs of f′: ${a > 0 ? '+, −, +' : '−, +, −'}. So f is increasing for ${right}.`],
    visual: { type: 'numline', min: -6, max: 6, points: [{ x: r1 }, { x: r2 }] },
  });
  // sign slip (the other stretch), ignoring the second zero, and where f′ itself rises (f″ > 0)
  return choose(rng, q, right, [a > 0 ? inside : outside, `x > ${fmt(r1)}`, a > 0 ? `x > ${fmt(mid)}` : `x < ${fmt(mid)}`]);
}

function localExtremeQ(rng: Rng): Question {

  const p = rint(rng, 1, 3); const c = rint(rng, -5, 20); const wantMin = rng.next() < 0.5; const f = [c, -3 * p * p, 0, 1];
  const x = wantMin ? p : -p; const v = pev(f, x);
  return mkq(S(K8), 'local extreme value', {
    prompt: `Find the local ${wantMin ? 'minimum' : 'maximum'} value of the rim profile.`, expression: `f(x) = ${P(f)}`, answer: v,
    hint: `f′(x) = 3x² − ${3 * p * p}. Use f″ to tell which zero is the ${wantMin ? 'minimum' : 'maximum'}.`,
    steps: [`f′(x) = 0 at x = ±${p}. f″(x) = 6x is ${wantMin ? 'positive' : 'negative'} at x = ${fmt(x)}.`, `f(${fmt(x)}) = ${fmt(v)}.`],
    visual: plotV([-p - 2, p + 2, Math.min(v, c - 2 * p ** 3) - 3, Math.max(v, c + 2 * p ** 3) + 3], { fns: [{ fn: pfn(f) }] }),
  });
}
const localExtremeStep = (rng: Rng) => typed(localExtremeQ(rng));

function pickFGraphTransfer(rng: Rng): AskStep {
  const h = rint(rng, -1, 1); const range: [number, number, number, number] = [h - 3, h + 3, -5, 5];
  const g = [-(h ** 3) + 3 * h, 3 * h * h - 3, -3 * h, 1];
  const q = mkq(S(K8), 'sign chart to graph', {
    prompt: `A sign chart for f′: + for x < ${fmt(h - 1)}, − between ${fmt(h - 1)} and ${fmt(h + 1)}, + for x > ${fmt(h + 1)}. Which graph is f?`, expression: 'f′: + | − | +', answer: 0,
    hint: 'f′ > 0 means f rises, f′ < 0 means f falls.',
    steps: [`f rises, falls, then rises: a peak at x = ${fmt(h - 1)} and a valley at x = ${fmt(h + 1)}.`],
    visual: plotV(range, { fns: [{ fn: pfn(g) }] }),
  });
  return pickLettered(rng, q, [
    { visual: plotV(range, { fns: [{ fn: pfn(g) }] }), right: true },
    { visual: plotV(range, { fns: [{ fn: pfn(g.map((x) => -x)) }] }) },
    { visual: plotV(range, { fns: [{ fn: pfn([h * h - 2, -2 * h, 1]) }] }) },
    { visual: plotV(range, { fns: [{ fn: pfn([-(h ** 3), 3 * h * h, -3 * h, 1]) }] }) },
  ]);
}
function drugPeakTransfer(rng: Rng): AskStep {
  const k = rint(rng, 2, 5);
  return typed(mkq(S(K8), 'maximum', {
    prompt: `A drug's concentration is C(t) = 20t/(t² + ${k * k}). At what time (hours) does it peak?`, expression: "C′(t) = 0 at t = ?", answer: k, unit: 'h',
    hint: 'Quotient rule; only the numerator of C′ can be zero.',
    steps: [`C′(t) = 20(${k * k} − t²)/(t² + ${k * k})².`, `C′ = 0 when t² = ${k * k}, so t = ${lab(k, 'hours')}, where C′ goes + to −.`],
    visual: plotV([0, 3 * k, 0, 10 / k + 1], { fns: [{ fn: { kind: 'rational', num: [0, 20], den: [k * k, 0, 1] } }] }),
  }));
}

/* ================================================================== */
/* 9. Antiderivatives & Riemann sums                                    */
/* ================================================================== */
const K9 = 'antideriv';

function antiPowerChoose(rng: Rng): AskStep {
  const n = rint(rng, 1, 5); const m = pick(rng, [1, 2, 3, -1, -2]); const a = m * (n + 1);
  const right = `${mono(m, n + 1)} + C`;
  const q = mkq(S(K9), 'power rule backwards', {
    prompt: 'Brick needs every antiderivative of the load rate.', expression: `∫ ${mono(a, n)} dx = ?`, answer: m,
    hint: 'Raise the power by one, divide by the new power, and remember the whole family: + C.',
    steps: [`∫ xⁿ dx = xⁿ⁺¹/(n + 1) + C.`, `${fmt(a)}·x${sup(n + 1)}/${n + 1} + C = ${right}. Check: its derivative is ${mono(a, n)}.`],
    visual: card('Antiderivative', ['∫ xⁿ dx = xⁿ⁺¹/(n + 1) + C']),
  });
  return choose(rng, q, right, [`${mono(a, n + 1)} + C`, mono(m, n + 1), `${mono(a * n, n - 1)} + C`]);
}

function antiTableStep(rng: Rng): AskStep {
  const c3 = rnz(rng, -2, 3); const c2 = rint(rng, -3, 3); const c1 = rnz(rng, -6, 6); const f = [c1, 2 * c2, 3 * c3];
  const q = mkq(S(K9), 'antiderivative term by term', {
    prompt: `The flow rate is f(x) = ${P(f)}. Build F(x) = __x³ + __x² + __x + C with F′ = f.`, expression: 'F(x) = ?', answer: c3,
    hint: 'Each term: raise the power by one and divide by the new power.',
    steps: [`∫ (${P(f)}) dx = ${P([0, c1, c2, c3])} + C.`, `Check by differentiating: you get ${P(f)} back.`],
    visual: card('Undo the derivative', ['xⁿ → xⁿ⁺¹/(n + 1)']),
  });
  return model(q, { kind: 'table', cols: ['x³', 'x²', 'x'], rowLabels: ['F(x)'], rows: [[null, null, null]], label: `F′(x) = ${P(f)}` }, [`${c3},${c2},${c1}`], 'Fill the coefficients of F (the + C rides along).');
}

function familyPlotStep(rng: Rng): AskStep {
  const m = rnz(rng, -3, 3); const c0 = rint(rng, -4, 4); const range: [number, number, number, number] = [-4, 4, -8, 8];
  const others = [c0 - 3, c0 + 3].filter((c) => Math.abs(c) <= 8);
  const layers: PlotLayers = { fns: others.map((c) => ({ fn: pfn([c, m]), dashed: true, color: 'muted' as const })), points: [{ x: 0, y: c0, label: `F(0) = ${fmt(c0)}` }] };
  const q = mkq(S(K9), 'initial condition', {
    prompt: `A capacitor ${m > 0 ? 'charges' : 'discharges'} at a steady F′(t) = ${fmt(m)} ${Math.abs(m) === 1 ? 'unit' : 'units'}/s, and F(0) = ${fmt(c0)}. The dashed lines are other members of the + C family. Draw F.`,
    expression: `F′ = ${fmt(m)}, F(0) = ${fmt(c0)}`, answer: m,
    hint: 'Every antiderivative of a constant is a line with that slope. F(0) picks which one.',
    steps: [`F(t) = ${lineStr(m, 0).replace('x', 't')} + C.`, `F(0) = C = ${lab(fmt(c0), 'starting charge')}, so F(t) = ${lineStr(m, c0).replace('x', 't')}.`],
    visual: plotV(range, layers),
  });
  return model(q, { kind: 'plot', range, count: 2, label: 'the + C family', layers }, undefined, 'Tap two points on the one antiderivative with F(0) as given.', { rule: { kind: 'on-line', m, b: c0 } });
}

function initialValueQ(rng: Rng): Question {
  const a = rint(rng, 1, 3); const b = rint(rng, -4, 4); const c0 = rint(rng, -5, 9); const k = rint(rng, 1, 3); const v = a * k * k + b * k + c0;
  return mkq(S(K9), 'initial value problem', {
    prompt: `Volt's capacitor charges at F′(x) = ${P([b, 2 * a])} units per second and holds F(0) = ${fmt(c0)}. Find F(${k}).`, expression: `F(${k}) = ?`, answer: v,
    hint: 'Antidifferentiate, then use F(0) to find C. Forgetting C loses the starting value.',
    steps: [`F(x) = ${P([0, b, a])} + C.`, `F(0) = C = ${lab(fmt(c0), 'starting charge')}.`, `F(${k}) = ${lab(fmt(a * k * k + b * k), 'charge gained')} ${fmtSigned(c0)} = ${lab(fmt(v), 'charge units')}.`],
    visual: card('+ C matters', ['F(x) = ∫F′ dx + C', 'F(0) fixes C']),
  });
}
const initialValueStep = (rng: Rng) => typed(initialValueQ(rng));

/** Positive, monotone on [0, 6], integer heights at the even x (strip width 2). */
const RIEMANN_FNS: { c: number[]; inc: boolean }[] = [
  { c: [0, 0, 0.5], inc: true }, { c: [1, 0, 1], inc: true }, { c: [1, 2], inc: true }, { c: [2, 1], inc: true }, { c: [40, 0, -1], inc: false }, { c: [13, -2], inc: false },
];
const peak = (c: number[], a: number, b: number) => Math.max(pev(c, a), pev(c, b));
function riemannTableStep(rng: Rng): AskStep {
  const F = pick(rng, RIEMANN_FNS); const left = rng.next() < 0.5; const xs = left ? [0, 2, 4] : [2, 4, 6]; const hs = xs.map((x) => pev(F.c, x)); const hsum = hs.reduce((s, x) => s + x, 0); const area = 2 * hsum;
  const q = mkq(S(K9), 'Riemann sum', {
    prompt: `Brick's tower footprint follows f(x) = ${P(F.c)} on [0, 6]. Estimate the area with 3 ${left ? 'left' : 'right'}-endpoint strips, each 2 wide.`, expression: `${left ? 'L' : 'R'}₃ = ?`, answer: area,
    hint: `Each rectangle is 2 wide and as tall as f at its ${left ? 'left' : 'right'} edge. Area of one strip = height × width.`,
    steps: [`Heights: f(${xs.join('), f(')}) = ${hs.join(', ')} (strip heights).`, `Area ≈ ${lab(2, 'strip width')} × (${hs.join(' + ')}) = 2 × ${lab(hsum, 'total height')} = ${lab(area, 'area estimate')}. Adding the heights alone gives ${hsum}, which forgets the width Δx = 2.`],
    visual: plotV([-0.5, 6.5, -1, peak(F.c, 0, 6) + 2], { fns: [{ fn: pfn(F.c) }], rects: { fn: pfn(F.c), a: 0, b: 6, n: 3, rule: left ? 'left' : 'right' } }),
  });
  return model(q, { kind: 'table', cols: ['x', 'height f(x)'], rows: [[xs[0], null], [xs[1], null], [xs[2], null], ['area ≈', null]], label: `f(x) = ${P(F.c)}, ${left ? 'left' : 'right'} endpoints, Δx = 2` }, [[...hs, area].join(',')], 'Fill each height, then the total area (each strip is 2 wide).');
}

/** Riemann sums with a width that is not 1: [0, 4] in 2 strips, [0, 6] in 3, or [0, 2] in 4. */
function riemannSetup(rng: Rng) {
  const F = pick(rng, RIEMANN_FNS); const rule = pick(rng, ['left', 'right'] as const);
  const [b, n] = pick(rng, [[4, 2], [6, 3], [2, 4]] as [number, number][]); const dx = b / n;
  const xs = Array.from({ length: n }, (_, i) => (rule === 'left' ? i : i + 1) * dx); const hs = xs.map((x) => round4(pev(F.c, x)));
  const hsum = round4(hs.reduce((s, x) => s + x, 0)); const sum = round4(dx * hsum);
  return { F, rule, b, n, dx, xs, hs, hsum, sum, range: [-0.5, b + 0.5, -1, peak(F.c, 0, b) + 2] as [number, number, number, number] };
}
function riemannQFrom(r: ReturnType<typeof riemannSetup>): Question {
  return mkq(S(K9), 'Riemann sum', {
    prompt: `Volt's flow meter logs f(x) = ${P(r.F.c)} L/min at x minutes. Estimate the total flow on [0, ${r.b}] with ${r.n} ${r.rule}-endpoint rectangles.`, expression: `${r.rule === 'left' ? 'L' : 'R'}${subS(String(r.n))} = ?`, answer: r.sum, unit: 'L',
    hint: `Δx = ${lab(r.b, 'minutes')} ÷ ${lab(r.n, 'strips')} = ${lab(fmt(r.dx), 'minutes per strip')}. Add f at the ${r.rule} edges, then multiply by the width.`,
    steps: [`Δx = ${lab(fmt(r.dx), 'minutes per strip')}; ${r.rule} edges x = ${r.xs.map(fmt).join(', ')} (minutes); heights ${r.hs.map(fmt).join(', ')} (L/min).`, `Flow ≈ ${fmt(r.dx)}·(${r.hs.map(fmt).join(' + ')}) = ${lab(fmt(r.dx), 'minutes')}·${lab(fmt(r.hsum), 'L/min added up')} = ${lab(fmt(r.sum), 'litres')}.`],
    visual: plotV(r.range, { fns: [{ fn: pfn(r.F.c) }], rects: { fn: pfn(r.F.c), a: 0, b: r.b, n: r.n, rule: r.rule } }),
  });
}
const riemannQ = (rng: Rng) => riemannQFrom(riemannSetup(rng));
/** The aid starts at 2n rectangles: it shows the estimates converging without printing the asked one. */
function riemannStep(rng: Rng): AskStep {
  const r = riemannSetup(rng);
  return typed(riemannQFrom(r), { aid:
 { kind: 'riemann', fn: pfn(r.F.c), a: 0, b: r.b, ns: [2 * r.n, 4 * r.n, 8 * r.n, 16 * r.n], rule: r.rule, range: r.range } });
}

function overUnderChoose(rng: Rng): AskStep {
  const F = pick(rng, RIEMANN_FNS); const rule = pick(rng, ['left', 'right'] as const);
  const under = (F.inc && rule === 'left') || (!F.inc && rule === 'right'); const right = under ? 'An underestimate' : 'An overestimate';
  const q = mkq(S(K9), 'over or under', {
    prompt: `Vector's gauge curve f(x) = ${P(F.c)} is ${F.inc ? 'increasing' : 'decreasing'} on [0, 6]. The ${rule}-endpoint sum with 3 strips is…`, expression: `${rule} sum vs the true area`, answer: under ? 1 : 0,
    hint: `Look at each rectangle's top: does it sit below or above the curve?`,
    steps: [`On ${F.inc ? 'an increasing' : 'a decreasing'} curve the ${rule} edge is the ${under ? 'lowest' : 'highest'} point of each strip.`, `So every rectangle ${under ? 'misses a sliver' : 'pokes above'}: ${right.toLowerCase()}.`],
    visual: plotV([-0.5, 6.5, -1, peak(F.c, 0, 6) + 2], { fns: [{ fn: pfn(F.c) }], rects: { fn: pfn(F.c), a: 0, b: 6, n: 3, rule } }),
  });

  return choose(rng, q, right, [under ? 'An overestimate' : 'An underestimate', 'Exactly the area']);
}

function speedLogTransfer(rng: Rng): AskStep {
  const v0 = rint(rng, 2, 6); const vs = [v0, v0 + rint(rng, 2, 5), 0, 0]; vs[2] = vs[1] + rint(rng, 2, 5); vs[3] = vs[2] + rint(rng, 1, 4);
  const est = 10 * (vs[0] + vs[1] + vs[2]);
  return typed(mkq(S(K9), 'Riemann sum from data', {
    prompt: "A test car's speedometer is read every 10 s. Estimate the distance covered from t = 0 to 30 s with left endpoints.", expression: 'distance ≈ ?', answer: est, unit: 'm',
    hint: 'Distance = speed × time for each 10 s strip, using the reading at the start of the strip.',
    steps: [`Left readings: ${vs[0]}, ${vs[1]}, ${vs[2]} (m/s).`, `${lab(10, 'seconds per strip')} × (${vs[0]} + ${vs[1]} + ${vs[2]}) = ${lab(est, 'metres')}.`],
    visual: card('Speed log', ['t (s): 0, 10, 20, 30', `v (m/s): ${vs.join(', ')}`]),
  }));
}
function accelTransfer(rng: Rng): AskStep {
  const k = rint(rng, 1, 4); const v0 = rint(rng, 0, 9); const c = pick(rng, [2, 4, 6]);
  return typed(mkq(S(K9), 'initial value problem', {
    prompt: `A rocket sled accelerates at a(t) = ${c}t m/s² and starts at ${v0} m/s. What is its velocity at t = ${k} s?`, expression: `v(${k}) = ?`, answer: (c / 2) * k * k + v0, unit: 'm/s',
    hint: 'v is an antiderivative of a; the starting speed fixes + C.',
    steps: [`v(t) = ${mono(c / 2, 2, 't')} + C, and v(0) = C = ${lab(v0, 'm/s at the start')}.`, `v(${k}) = ${lab((c / 2) * k * k, 'm/s gained')} + ${lab(v0, 'm/s start')} = ${lab((c / 2) * k * k + v0, 'm/s')}.`],
    visual: card('Motion backwards', ['v = ∫a dt + C']),
  }));
}

/* ================================================================== */
/* 10. Definite integrals & the Fundamental Theorem                     */
/* ================================================================== */
const K10 = 'ftc';

function ftcQ(rng: Rng): { q: Question; fn: Fn; a: number; b: number; top: number } {
  let c2 = 0; let c1 = 0; let c0 = 0; let g = 0;
  do { c2 = pick(rng, [0, 3]); c1 = pick(rng, [0, 2, 4]); c0 = rint(rng, 0, 4); } while (c2 === 0 && c1 === 0 && g++ < 30);
  if (c2 === 0 && c1 === 0) c1 = 2;
  const a = rint(rng, 0, 1); const b = a + rint(rng, 1, 2); const f = [c0, c1, c2]; const F = [0, c0, c1 / 2, c2 / 3];
  const v = pev(F, b) - pev(F, a);
  const q = mkq(S(K10), 'evaluate a definite integral', {
    prompt: `Volt's current is f(x) = ${P(f)} A at x seconds. How much charge flows from x = ${a} s to x = ${b} s? Use F(b) − F(a).`, expression:
 `${intS(a, b)} (${P(f)}) dx = ?`, answer: v, unit: 'C',
    hint: 'No + C needed here: it cancels in F(b) − F(a).',
    steps: [`F(x) = ${P(F)}.`, `F(${b}) − F(${a}) = ${lab(fmt(pev(F, b)), 'coulombs by the end')} − ${lab(fmt(pev(F, a)), 'coulombs by the start')} = ${lab(fmt(v), 'coulombs')}.`],
    visual: plotV([a - 0.5, b + 0.5, -1, pev(f, b) + 2], { fns: [{ fn: pfn(f) }], shade: { fn: pfn(f), a, b } }),
    app: 'Total flow, total charge, total work: every accumulated quantity is a definite integral.',
  });
  return { q, fn: pfn(f), a, b, top: pev(f, b) + 2 };
}
function ftcStep(rng: Rng): AskStep { const r = ftcQ(rng); return typed(r.q, { aid: { kind: 'riemann', fn: r.fn, a: r.a, b: r.b, ns: [2, 4, 8, 16], rule: 'mid', range: [r.a - 0.5, r.b + 0.5, -1, r.top] } }); }

function ftcOrderChoose(rng: Rng): AskStep {
  const cube = rng.next() < 0.5; const a = rint(rng, 1, 2); const b = a + rint(rng, 1, 2);
  const f = cube ? [0, 0, 3] : [0, 2]; const F = cube ? [0, 0, 0, 1] : [0, 0, 1];
  const v = pev(F, b) - pev(F, a);
  const q = mkq(S(K10), 'FTC order', {
    prompt: 'The Accumulator reads the net total. Which value is right?', expression: `${intS(a, b)} ${P(f)} dx = ?`, answer: v,
    hint: 'Antiderivative first. Then top limit minus bottom limit: F(b) − F(a).',
    steps: [`F(x) = ${P(F)}.`, `F(${b}) − F(${a}) = ${pev(F, b)} − ${pev(F, a)} = ${v}.`],
    visual: plotV([0, b + 1, -1, pev(f, b) + 2], { fns: [{ fn: pfn(f) }], shade: { fn: pfn(f), a, b } }),
  });
  return choose(rng, q, fmt(v), [fmt(-v), fmt(pev(f, b) - pev(f, a)), fmt(pev(F, b))]);
}

function ftcPart1Choose(rng: Rng): AskStep {
  const c = rint(rng, 1, 2); const k = rnz(rng, -5, 5); const cube = rng.next() < 0.5;
  const g = cube ? [k, 0, 0, 1] : [k, 0, 1];
  const G = cube ? `x⁴/4 ${k > 0 ? '+' : '−'} ${coefTerm(Math.abs(k), 'x')}` : `x³/3 ${k > 0 ? '+' : '−'} ${coefTerm(Math.abs(k), 'x')}`;
  const gt = P(g, 't');
  const q = mkq(S(K10), 'FTC part 1', {
    prompt: `The Accumulator's total grows as a moving-edge integral. How fast is it growing at x?`, expression: `d/dx ∫${subS(String(c))}ˣ (${gt}) dt = ?`, answer: 0,
    hint: 'Differentiating undoes the integral; what does the moving edge x do to g(t)?',
    steps: [`FTC: d/dx ∫ from ${c} to x of g(t) dt = g(x).`, `So the answer is ${P(g)}.`],
    visual: card('FTC, part 1', ['d/dx ∫ₐˣ g(t) dt = g(x)']),
  });
  const Gc = cube ? fracStr(c ** 4 + 4 * k * c, 4) : fracStr(c ** 3 + 3 * k * c, 3); const GcN = cube ? c ** 4 + 4 * k * c : c ** 3 + 3 * k * c;
  const GminusGc = GcN === 0 ? G : `${G} ${GcN > 0 ? '−' : '+'} ${Gc.replace(/^[−-]/, '')}`;
  return choose(rng, q, P(g), [P(dpoly(g)), GminusGc, P([k - pev(g, c), 0, ...g.slice(2)]), G]);

}

function gPrimeStep(rng: Rng): AskStep {
  const k = rnz(rng, -5, 5); const a = rint(rng, -3, 4); const g = [k, 0, 1]; const v = pev(g, a);
  return typed(mkq(S(K10), 'FTC part 1', {
    prompt: `The tank total is G(x) = ∫ from 1 to x of (${P(g, 't')}) dt. How fast is it growing at x = ${fmt(a)}?`, expression: `G′(${fmt(a)}) = ?`, answer: v,
    hint: 'G′(x) is the integrand evaluated at x.',
    steps: [`G′(x) = ${P(g)}.`, `G′(${fmt(a)}) = ${fmt(a * a)} ${fmtSigned(k)} = ${fmt(v)}.`],
    visual: card('FTC, part 1', ['G(x) = ∫₁ˣ g(t) dt', 'G′(x) = g(x)']),
  }));
}

function uSubChoose(rng: Rng): AskStep {
  const n = rint(rng, 2, 4); const c = rnz(rng, -5, 5); const inner = P([c, 0, 1]); const half = rng.next() < 0.5;
  const U = `(${inner})${sup(n + 1)}`;
  if (half) {
    // du = 2x dx but only x dx is there: the ½ must come along
    const right = `${U}/${2 * (n + 1)} + C`;
    const q = mkq(S(K10), 'u-substitution', {
      prompt: `Catalyst's reaction rate hides a function inside a function. Let u = the inside, and watch the constant.`, expression: `∫ x(${inner})${sup(n)} dx = ?`, answer: 2 * (n + 1),
      hint: `Let u = ${inner}, so du = 2x dx. The integral only has x dx: that is ½ du.`,
      steps: [`u = ${inner}, du = 2x dx, so x dx = ½ du: ∫ ½u${sup(n)} du = u${sup(n + 1)}/${2 * (n + 1)} + C.`, `Back in x: ${right}. Dropping the ½ gives an answer twice too big.`],
      visual: card('Adjust the constant', ['du = 2x dx', 'x dx = ½ du']),
    });
    return choose(rng, q, right, [`${U}/${n + 1} + C`, `${U}/${2 * (n + 1)}`, `2${U}/${n + 1} + C`, `x²${U}/${2 * (n + 1)} + C`]);
  }
  const right = `${U}/${n + 1} + C`;
  const q = mkq(S(K10), 'u-substitution', {
    prompt: `Catalyst's reaction rate hides a function inside a function. Spot the inside and its derivative: let u = the inside.`, expression: `∫ 2x(${inner})${sup(n)} dx = ?`, answer: n + 1,
    hint: `Let u = ${inner}. Then du = 2x dx, and the integral becomes ∫ u${sup(n)} du.`,
    steps: [`u = ${inner}, du = 2x dx: ∫ u${sup(n)} du = u${sup(n + 1)}/${n + 1} + C.`, `Back in x: ${right}.`],
    visual: card('Substitution', ['u = inside, du = u′ dx']),
  });
  return choose(rng, q, right, [`${U}/${n + 1}`, `x²${U}/${n + 1} + C`, `${U} + C`]);
}

/** Definite u-substitution: the classic slip is putting the x-limits into the u-antiderivative. */
function uSubLimitsChoose(rng: Rng): AskStep {
  const b = rint(rng, 1, 2); const c = rint(rng, 1, 2); const n = rint(rng, 1, 2); const U = b * b + c; const inner = P([c, 0, 1]); const k = n + 1;
  const right = fracStr(U ** k - c ** k, k);
  const q = mkq(S(K10), 'u-substitution with limits', {
    prompt: `Volt's charge integral needs u = ${inner}. Which value is right?`, expression: `${intS(0, b)} 2x(${inner})${sup(n)} dx = ?`, answer: (U ** k - c ** k) / k,
    hint: 'When x changes to u, the limits must change too: put each x-limit into u.',
    steps: [`u = ${inner}, du = 2x dx; x = 0 → u = ${c}, x = ${b} → u = ${U}.`, `[u${sup(k)}/${k}] from ${c} to ${U} = (${U ** k} − ${c ** k})/${k} = ${right}.`, `Using the x-limits 0 and ${b} in u${sup(k)}/${k} gives ${fracStr(b ** k, k)}: the limits were never converted.`],
    visual: card('Change the limits', [`u = ${inner}`, 'x-limits → u-limits']),
  });
  return choose(rng, q, right, [fracStr(b ** k, k), fracStr(U ** k, k), fmt(U ** k - c ** k), fracStr(U ** k - b ** k, k)]);
}

function uSubDefQ(rng: Rng): Question {
  const b = rint(rng, 1, 2); const c = rint(rng, 1, 2); const n = rint(rng, 1, 3); const U = b * b + c;
  const inner = P([c, 0, 1]); const top = U ** (n + 1) - c ** (n + 1);
  return mkq(S(K10), 'u-substitution with limits', {
    prompt: `Newton's work integral hides an inside function. Substitute u = the inside, and change the limits to u-values.`, expression: `${intS(0, b)} 2x(${inner})${sup(n)} dx = ?`, ...fans(top, n + 1),
    hint: `Let u = ${inner}. Put each x-limit into u to get the new limits.`,
    steps: [`u = ${inner}, du = 2x dx; the limits become ${c} to ${U}.`, `∫ from ${c} to ${U} of u${sup(n)} du = [u${sup(n + 1)}/${n + 1}] = (${U ** (n + 1)} − ${c ** (n + 1)})/${n + 1} = ${fracStr(top, n + 1)}.`],
    visual: card('New limits', [`x = 0 → u = ${c}`, `x = ${b} → u = ${U}`]),
  });
}
const uSubDefStep = (rng: Rng) => typed(uSubDefQ(rng));

function uLimitsTable(rng: Rng): AskStep {
  const b = rint(rng, 1, 2); const c = rint(rng, 1, 3); const U = b * b + c; const inner = P([c, 0, 1]);
  const q = mkq(S(K10), 'u-substitution with limits', {
    prompt: `${intS(0, b)} 2x(${inner}) dx with u = ${inner}: the limits must change to u-values.`, expression: `${intS(0, b)} 2x(${inner}) dx`, answer: (U * U - c * c) / 2,
    hint: 'Put each x-limit into u = x² + c. Then ∫ u du = u²/2 between the new limits.',
    steps: [`x = 0 → u = ${c}; x = ${b} → u = ${U}.`, `∫ from ${c} to ${U} of u du = (${U * U} − ${c * c})/2 = ${fracStr(U * U - c * c, 2)}.`],
    visual: card('Change the limits', ['x-limits → u-limits']),
  });
  return model(q, { kind: 'table', cols: ['step', 'value'], rows: [['u when x = 0', null], [`u when x = ${b}`, null], ['the integral', null]], label: `u = ${inner}, du = 2x dx` }, joinForms([[String(c)], [String(U)], forms(U * U - c * c, 2)]), 'Fill the new limits, then the value.');
}

function accumSliderStep(rng: Rng): AskStep {
  const p = pick(rng, [2, 4, 6]); const b = pick(rng, [1, 1.5, 2, 3, 4]); const T = (p * b * b) / 2; const h = p / 2; const hb = `${h === 1 ? '' : h}b²`;
  const range: [number, number, number, number] = [0, 5, 0, p * 5 + 1];
  const q = mkq(S(K10), 'accumulation', {
    prompt: `Current flows as i(t) = ${p}t amps. Slide b until the charge ∫₀ᵇ ${p}t dt reaches ${fmt(T)} coulombs.`, expression: `∫₀ᵇ ${p}t dt = ${fmt(T)}`, answer: b,
    hint: 'Integrate the current from 0 to b, then solve for b.',
    steps: [`∫₀ᵇ ${p}t dt = [${h === 1 ? '' : h}t²] from 0 to b = ${hb}.`, `${hb} = ${lab(fmt(T), 'coulombs')}${h === 1 ? '' : ` → b² = ${fmt(b * b)}`} → b = ${lab(fmt(b), 'seconds')}.`],
    visual: plotV(range, { fns: [{ fn: pfn([0, p]) }] }),
  });
  return model(q, { kind: 'slider', min: 0, max: 5, step: 0.5, label: 'b (s)', unit: 's', range, layers: { fns: [{ fn: pfn([0, p]) }] } }, [String(b)], 'Slide b until the area under i(t) is the target charge.');
}

function constTableStep(rng: Rng): AskStep {
  const m = pick(rng, [2, 4, 6]); const k = rnz(rng, -3, 5); const T = (m * m) / 2 + m * k;
  const q = mkq(S(K10), 'integral with a parameter', {
    prompt: `Volt tunes k so that ${intS(0, m)} (x + k) dx = ${fmt(T)}. Integrate each part, then find k.`, expression: 'k = ?', answer: k,
    hint: 'Split it: ∫ x dx is a number; ∫ k dx is k times the width of the interval.',
    steps: [`${intS(0, m)} x dx = ${m}²/2 = ${m * m / 2}; ${intS(0, m)} k dx = ${m}k.`, `${m * m / 2} + ${m}k = ${fmt(T)} → ${m}k = ${fmt(T - m * m / 2)} → k = ${fmt(k)}.`],
    visual: plotV([-0.5, m + 0.5, Math.min(0, k) - 1, Math.max(0, m + k) + 1], { fns: [{ fn: pfn([k, 1]) }], shade: { fn: pfn([k, 1]), a: 0, b: m } }),
  });
  return model(q, { kind: 'table', cols: ['piece', 'value'], rows: [[`${intS(0, m)} x dx`, null], [`${intS(0, m)} k dx = (?)·k`, null], ['k', null]], label: `${intS(0, m)} (x + k) dx = ${fmt(T)}` }, [`${m * m / 2},${m},${k}`], 'Fill ∫ x dx, the multiplier of k, then k.');
}

function signedChoose(rng: Rng): AskStep {
  const b = pick(rng, [2, 4, 6]); const c = rint(rng, 1, b - 1); const v = (b * b) / 2 - c * b;
  const q = mkq(S(K10), 'signed area', {
    prompt: `Volt's current f(x) = x − ${c} A runs backward for a while. What net charge does the integral give from x = 0 to ${b}?`, expression: `${intS(0, b)} (x − ${c}) dx = ?`, answer: v,
    hint: 'Area below the axis counts as negative in a definite integral.',
    steps: [`F(x) = x²/2 − ${coefTerm(c, 'x')}.`, `F(${b}) − F(0) = ${b * b / 2} − ${c * b} = ${lab(fmt(v), 'net charge')}. The total shaded area, counting both parts as positive, is ${lab(fracStr(c * c + (b - c) ** 2, 2), 'charge moved')}.`],
    visual: plotV([-0.5, b + 0.5, -c - 1, b - c + 1], { fns: [{ fn: pfn([-c, 1]) }], shade: { fn: pfn([-c, 1]), a: 0, b } }),
  });
  return choose(rng, q, fmt(v), [fracStr(c * c + (b - c) ** 2, 2), fmt(b * b / 2), fmt(-v), fmt(b * b / 2 + c * b)]);
}

function tankTransfer(rng: Rng): AskStep {
  const qv = pick(rng, [2, 4, 6]); const b = rint(rng, 2, 5);
  return typed(mkq(S(K10), 'accumulation', {
    prompt: `Water pours into a tank at r(t) = ${qv}t L/min. How much flows in during the first ${b} minutes?`, expression: `${intS(0, b)} ${qv}t dt = ?`, answer: (qv * b * b) / 2, unit: 'L',
    hint: 'Total amount = integral of the rate.',
    steps: [`∫ ${qv}t dt = ${qv / 2 === 1 ? '' : qv / 2}t².`, `At t = ${lab(b, 'minutes')}: ${qv / 2 === 1 ? '' : `${qv / 2}·`}${b}² = ${lab((qv * b * b) / 2, 'litres')}.`],
    visual: plotV([0, b + 1, 0, qv * b + 2], { fns: [{ fn: pfn([0, qv]) }], shade: { fn: pfn([0, qv]), a: 0, b } }),
  }));
}
function springWorkTransfer(rng: Rng): AskStep {
  const k = pick(rng, [100, 200, 400]); const d = pick(rng, [0.1, 0.2, 0.5]); const W = round4((k * d * d) / 2);
  return typed(mkq(S(K10), 'work', {
    prompt: `A spring pushes back with F(x) = ${k}x newtons. How much work stretches it from 0 to ${d} m?`, expression: `W = ∫ from 0 to ${d} of ${k}x dx = ?`, answer: W, unit: 'J',
    hint: 'Work = ∫ force dx. The force grows as you stretch.',
    steps: [`W = [${k / 2}x²] from 0 to ${lab(d, 'm stretch')}.`, `${k / 2}·${fmt(round4(d * d))} = ${lab(fmt(W), 'joules')}.`],
    visual: plotV([0, d * 1.2, 0, k * d * 1.2], { fns: [{ fn: pfn([0, k]) }], shade: { fn: pfn([0, k]), a: 0, b: d } }),
  }));
}

/* ================================================================== */
/* 11. Area & volume                                                    */
/* ================================================================== */
const K11 = 'area';

function regionPair(rng: Rng) {
  if (rng.next() < 0.5) { const k = pick(rng, [1, 2, 3]); return { top: coefTerm(k, 'x'), topFn: pfn([0, k]), a: 0, b: k, integrand: `${coefTerm(k, 'x')} − x²`, wrong: `x² − ${coefTerm(k, 'x')}`, sum: `${coefTerm(k, 'x')} + x²`, area: fans(k ** 3, 6), why: `Meet where ${coefTerm(k, 'x')} = x²: x = 0 and x = ${k}.`, calc: `[${k}x²/2 − x³/3] from 0 to ${k} = ${fracStr(k ** 3, 2)} − ${fracStr(k ** 3, 3)} = ${fracStr(k ** 3, 6)}.`.replace('[1x²', '[x²') }; }
  const s = pick(rng, [1, 2, 3]); const c = s * s;
  return { top: String(c), topFn: pfn([c]), a: -s, b: s, integrand: `${c} − x²`, wrong: `x² − ${c}`, sum: `${c} + x²`, area: fans(4 * s ** 3, 3), why: `Meet where x² = ${c}: x = −${s} and x = ${s}.`, calc: `[${c}x − x³/3] from −${s} to ${s} = ${fracStr(4 * s ** 3, 3)}.`.replace('[1x', '[x') };
}

function areaBetweenQ(rng: Rng): Question {
  const r = regionPair(rng);
  return mkq(S(K11), 'area between curves', {
    prompt: `Brick cuts a channel between the upper curve y = ${r.top} and the lower curve y = x², in metres. Find its area.`, expression: `area = ∫ (${r.integrand}) dx = ?`, ...r.area, unit: 'm²',
    hint: 'Find where the curves meet, then integrate top minus bottom.',
    steps: [r.why, `∫ from ${fmt(r.a)} to ${fmt(r.b)} of (${r.integrand}) dx.`, r.calc.replace(/\.$/, ' (square metres).')],
    visual: plotV([r.a - 1, r.b + 1, -1, r.b * r.b + 2], { fns: [{ fn: r.topFn }, { fn: pfn([0, 0, 1]) }] }),
  });
}
const areaBetweenStep = (rng: Rng) => typed(areaBetweenQ(rng));

function intersectPlotStep(rng: Rng): AskStep {
  const r1 = rint(rng, -2, 0); const r2 = rint(rng, 1, 3); const m = r1 + r2; const b = -r1 * r2;
  const range: [number, number, number, number] = [-3, 4, -2, 10];
  const layers: PlotLayers = { fns: [{ fn: pfn([0, 0, 1]), label: 'x²' }, { fn: pfn([b, m]) }] };
  const q = mkq(S(K11), 'limits from intersections', {
    prompt: `The canal cut runs between y = x² and y = ${lineStr(m, b)}. Where do they meet?`, expression: `x² = ${lineStr(m, b)}`, answer: r1,
    hint: `Set x² = ${lineStr(m, b)} and factor.`,
    steps: [`${P([-b, -m, 1])} = 0 → ${factored(1, r1, r2)} = 0.`, `x = ${fmt(r1)} and x = ${fmt(r2)}: the points (${fmt(r1)}, ${r1 * r1}) and (${fmt(r2)}, ${r2 * r2}).`],
    visual: plotV(range, layers),
  });
  return model(q, { kind: 'plot', range, count: 2, label: `y = x² and y = ${lineStr(m, b)}`, layers }, undefined, 'Tap both points where the curves cross.', { rule: { kind: 'set', items: [`${r1},${r1 * r1}`, `${r2},${r2 * r2}`] } });
}

function topBottomChoose(rng: Rng): AskStep {
  const r = regionPair(rng); const lim = `${subS(String(r.a))}${supS(String(r.b))}`;
  const q = mkq(S(K11), 'top minus bottom', {
    prompt: `Brick's channel is cut between y = ${r.top} and y = x². Which integral gives its area?`, expression: 'area = ?', answer: 0,
    hint: 'Top curve minus bottom curve, between the crossing points. Area comes out positive.',
    steps: [r.why, `Top is y = ${r.top}, so area = ∫${lim} (${r.integrand}) dx.`],
    visual: plotV([r.a - 1, r.b + 1, -1, r.b * r.b + 2], { fns: [{ fn: r.topFn }, { fn: pfn([0, 0, 1]) }] }),
  });
  const wrongLim = r.a === 0 ? `${subS('0')}${supS(String(r.b + 1))}` : `${subS('0')}${supS(String(r.b))}`;
  return choose(rng, q, `∫${lim} (${r.integrand}) dx`, [`∫${lim} (${r.wrong}) dx`, `∫${lim} (${r.sum}) dx`, `∫${wrongLim} (${r.integrand}) dx`]);
}

function diskChoose(rng: Rng): AskStep {
  const b = pick(rng, [1, 4, 9]); const sb = Math.sqrt(b);
  const right = piStr(b * b, 2);
  const q = mkq(S(K11), 'disk method', {
    prompt: `Ada spins y = √x, 0 ≤ x ≤ ${b}, about the x-axis to make a nozzle. What is its volume?`, expression: `V = π${intS(0, b)} (√x)² dx = ?`, answer: (b * b) / 2,
    hint: 'Each slice is a disk of radius √x: area π(√x)² = πx. Do not forget to square the radius.',
    steps: [`V = π∫ (√x)² dx = π∫ x dx from 0 to ${b}.`, `π·${b}²/2 = ${right}.`],
    visual: plotV([0, b + 1, -sb - 1, sb + 1], { fns: [{ fn: { kind: 'sqrt' } }, { fn: { kind: 'sqrt', a: -1 }, dashed: true, color: 'muted' }] }),
  });
  return choose(rng, q, right, [piStr(2 * sb ** 3, 3), fracStr(b * b, 2), piStr(b * b, 1)]);
}

const CONES = [{ fn: 'x', k: 1, h: 3, c: 9 }, { fn: '2x', k: 2, h: 3, c: 36 }, { fn: 'x', k: 1, h: 2, c: 8 / 3 }, { fn: '2x', k: 2, h: 1, c: 4 / 3 }, { fn: 'x²', k: 0, h: 1, c: 1 / 5 }, { fn: 'x²', k: 0, h: 2, c: 32 / 5 }];
function diskQ(rng: Rng): Question {
  const cn = pick(rng, CONES); const [num, den] = cn.fn === 'x²' ? [cn.h ** 5, 5] : [cn.k * cn.k * cn.h ** 3, 3];
  const sq = cn.fn === 'x²' ? 'x⁴' : cn.k === 1 ? 'x²' : '4x²';
  return mkq(S(K11), 'disk method', {
    prompt: `A lathe spins y = ${cn.fn}, 0 ≤ x ≤ ${cn.h}, about the x-axis. Give the volume as a multiple of π.`, expression: `V = π${intS(0, cn.h)} (${cn.fn})² dx = ? · π`, ...fans(num, den),
    hint: 'Disk area is π·radius². Square the function, then integrate.',
    steps: [`(${cn.fn})² = ${sq}.`, `${intS(0, cn.h)} ${sq} dx = ${fracStr(num, den)}, so V = ${piStr(num, den)}.`],
    visual: plotV([0, cn.h + 1, -(cn.fn === 'x²' ? cn.h * cn.h : cn.k * cn.h) - 1, (cn.fn === 'x²' ? cn.h * cn.h : cn.k * cn.h) + 1], { fns: [{ fn: cn.fn === 'x²' ? pfn([0, 0, 1]) : pfn([0, cn.k]), to: cn.h }] }),
  });
}
const diskStep = (rng: Rng) => typed(diskQ(rng));

function diskTableStep(rng: Rng): AskStep {
  const [c, m] = pick(rng, [[0, 1], [1, 1], [2, 1], [0, 2], [1, 2]] as [number, number][]); const f = [c, m];
  const rs = [1, 2, 3].map((x) => pev(f, x));
  const q = mkq(S(K11), 'disk slices', {
    prompt: `Slice the solid made by spinning y = ${P(f)} about the x-axis. Each slice is a disk.`, expression: 'disk area = π·r²', answer: rs[0],
    hint: 'The radius of each disk is the height of the curve, f(x). Its area is π times the radius squared.',
    steps: [`Radii: ${rs.join(', ')}.`, `Areas ÷ π: ${rs.map((r) => r * r).join(', ')}. Integrating these areas along x gives the volume.`],
    visual: plotV([0, 4, -rs[2] - 1, rs[2] + 1], { fns: [{ fn: pfn(f) }, { fn: pfn(f.map((x) => -x)), dashed: true, color: 'muted' }] }),
  });
  return model(q, { kind: 'table', cols: ['x', 'radius', 'area ÷ π'], rows: [[1, null, null], [2, null, null], [3, null, null]], label: `y = ${P(f)}` }, [rs.flatMap((r) => [r, r * r]).join(',')], 'Fill each disk: radius = f(x), then radius².');
}

function signPaintTransfer(rng: Rng): AskStep {
  const s = pick(rng, [1, 2, 3]); const c = s * s;
  return typed(mkq(S(K11), 'area between curves', {
    prompt: `A road sign is the region between y = ${c} and y = x² (metres). How many square metres of paint does it need?`, expression: `∫ from −${s} to ${s} of (${c} − x²) dx = ?`, ...fans(4 * s ** 3, 3), unit: 'm²',
    hint: `The curves meet at x = ±${s}. Integrate top minus bottom.`,
    steps: [`[${c === 1 ? '' : c}x − x³/3] from −${s} to ${s}.`, `= 2(${c * s} − ${fracStr(s ** 3, 3)}) = ${lab(fracStr(4 * s ** 3, 3), 'square metres of paint')}.`],
    visual: plotV([-s - 1, s + 1, -1, c + 2], { fns: [{ fn: pfn([c]) }, { fn: pfn([0, 0, 1]) }] }),
  }));
}
function raceTransfer(rng: Rng): AskStep {
  const k = pick(rng, [3, 6]);
  return typed(mkq(S(K11), 'area between curves', {
    prompt: `Two drones launch together. Drone A flies at ${k}t m/s, drone B at t² m/s. How far ahead is A when B catches up in speed at t = ${k} s?`, expression: `${intS(0, k)} (${k}t − t²) dt = ?`, ...fans(k ** 3, 6), unit: 'm',
    hint: 'The gap between them is the area between the two velocity curves.',
    steps: [`Lead = ∫ (v_A − v_B) dt = [${k}t²/2 − t³/3] from 0 to ${lab(k, 'seconds')}.`, `= ${fracStr(k ** 3, 2)} − ${fracStr(k ** 3, 3)} = ${lab(fracStr(k ** 3, 6), 'm lead')}.`],
    visual: plotV([0, k + 1, 0, k * k + 2], { fns: [{ fn: pfn([0, k]) }, { fn: pfn([0, 0, 1]) }] }),
  }));
}

/* ================================================================== */
/* 12. Infinite series                                                  */
/* ================================================================== */
const K12 = 'series';

const RATIOS: [number, number][] = [[1, 2], [1, 3], [1, 4], [-1, 2], [2, 3], [3, 4]];
function geomSumQ(rng: Rng): Question {
  const [n, d] = pick(rng, RATIOS); const a = pick(rng, [2, 3, 4, 6, 8, 9, 12, 16]);
  const terms = [0, 1, 2].map((i) => fracStr(a * n ** i, d ** i));
  const expr = `${terms[0]} ${n < 0 ? '−' : '+'} ${terms[1].replace('−', '')} + ${terms[2]} ${n < 0 ? '−' : '+'} …`;
  return mkq(S(K12), 'geometric series sum', {
    prompt: n < 0 ? `Brick's crane trolley moves ${a} m right, then each move is ${fracStr(-n, d)} as long as the last and in the opposite direction, starting where the last one ended. How far right of the start does it end up?` : `The Timekeeper's pendulum swings ${a} cm, then each swing is ${fracStr(n, d)} of the last. Total distance?`, expression: `${expr} = ?`, ...fans(a * d, d - n), unit: n < 0 ? 'm' : 'cm',
    hint: 'A geometric series with |r| < 1 sums to a/(1 − r).',
    steps: [`a = ${lab(a, n < 0 ? 'm, first move' : 'cm, first swing')}, r = ${lab(fracStr(n, d), 'ratio to the last')}.`, `Sum = ${a}/(1 − (${fracStr(n, d)})) = ${a} ÷ (${fracStr(d - n, d)}) = ${lab(fracStr(a * d, d - n), n < 0 ? 'm right of the start' : 'cm in total')}.`],
    visual: card('Geometric series', ['a + ar + ar² + … = a/(1 − r)', 'only when |r| < 1']),
  });
}
const geomSumStep = (rng: Rng) => typed(geomSumQ(rng));

function partialSumTable(rng: Rng): AskStep {
  const [a, n, d] = pick(rng, [[8, 1, 2], [16, 1, 2], [32, 1, 2], [27, 1, 3], [54, 1, 3], [16, -1, 2]] as [number, number, number][]);
  const S1 = a; const S2 = a + (a * n) / d; const S3 = S2 + (a * n * n) / (d * d);
  const q = mkq(S(K12), 'partial sums', {
    prompt: `Series ${a} ${n < 0 ? '−' : '+'} ${a / d} + ${a / (d * d)} ${n < 0 ? '−' : '+'} … (ratio ${fracStr(n, d)}). Fill the partial sums and where they head.`, expression: 'S₂, S₃, S∞', answer: S2,
    hint: 'Sₙ adds the first n terms. The limit of the partial sums is a/(1 − r).',
    steps: [`S₂ = ${fmt(S2)}, S₃ = ${fmt(S3)}.`, `S∞ = ${a}/(1 − (${fracStr(n, d)})) = ${fracStr(a * d, d - n)}.`],
    visual: card('Partial sums', ['S₁ = a, S₂ = a + ar, …']),
  });
  return model(q, { kind: 'table', cols: ['sum', 'value'], rows: [['S₁', S1], ['S₂', null], ['S₃', null], ['S∞', null]], label: `ratio r = ${fracStr(n, d)}` }, joinForms([[String(S2)], [String(S3)], forms(a * d, d - n)]), 'Fill S₂, S₃ and the limit S∞.');
}

const CONVERGENT = ['Σ 1/n²', 'Σ (1/2)ⁿ', 'Σ (2/3)ⁿ', 'Σ 1/n³'];
const DIVERGENT = ['Σ 1/n', 'Σ (3/2)ⁿ', 'Σ n/(n + 1)', 'Σ 1/√n', 'Σ 2ⁿ'];
const SERIES_WHY: Record<string, string> = {
  'Σ 1/n²': 'Σ 1/n² is a p-series with p = 2 > 1: converges.', 'Σ 1/n³': 'Σ 1/n³ is a p-series with p = 3 > 1: converges.',
  'Σ (1/2)ⁿ': 'Σ (1/2)ⁿ is geometric with |r| = 1/2 < 1: converges.', 'Σ (2/3)ⁿ': 'Σ (2/3)ⁿ is geometric with |r| = 2/3 < 1: converges.',
  'Σ 1/n': 'Σ 1/n is a p-series with p = 1: diverges.', 'Σ 1/√n': 'Σ 1/√n is a p-series with p = 1/2 ≤ 1: diverges.',
  'Σ (3/2)ⁿ': 'Σ (3/2)ⁿ is geometric with |r| = 3/2 ≥ 1: diverges.', 'Σ 2ⁿ': 'Σ 2ⁿ is geometric with |r| = 2 ≥ 1: diverges.',
  'Σ n/(n + 1)': 'Σ n/(n + 1): the terms head to 1, not 0, so it diverges.',
};
function convergeChoose(rng: Rng): AskStep {
  const right = pick(rng, CONVERGENT); const wrongs = rng.shuffle(DIVERGENT).slice(0, 3);
  const q = mkq(S(K12), 'convergence', {
    prompt: 'Only one of these gears settles to a finite total. Which series converges?', expression: 'Which converges? (n from 1 to ∞)', answer: 0,
    hint: 'Geometric: converges when |r| < 1. p-series Σ 1/nᵖ: converges when p > 1. Terms that do not shrink to 0 always diverge.',
    steps: [SERIES_WHY[right], wrongs.map((w) => SERIES_WHY[w]).join(' ')],
    visual: card('Tests', ['geometric: |r| < 1', 'p-series: p > 1', 'terms must → 0']),
  });
  return choose(rng, q, right, wrongs);
}

function harmonicChoose(rng: Rng): AskStep {
  if (rng.next() < 0.6) {
    const q = mkq(S(K12), 'terms to 0 is not enough', {
      prompt: 'The terms of 1 + 1/2 + 1/3 + 1/4 + … shrink to 0. Does the series converge?', expression: 'Σ 1/n', answer: 0,
      hint: 'Group the terms: 1/3 + 1/4 > 1/2, 1/5 + … + 1/8 > 1/2, and so on forever.',
      steps: ['Grouping gives infinitely many chunks each bigger than 1/2, so the sum grows without bound.', 'Terms → 0 is necessary for convergence, but not enough.'],
      visual: card('Harmonic series', ['1 + 1/2 + (1/3 + 1/4) + (1/5 + … + 1/8) + …', 'each group > 1/2']),
    });
    return choose(rng, q, 'No: the sum grows without bound', ['Yes: its terms go to 0', 'Yes: it adds up to 2', 'Yes: it adds up to 1']);
  }
  const q = mkq(S(K12), 'p-series', {
    prompt: 'The terms of 1 + 1/4 + 1/9 + 1/16 + … shrink fast. Does the series converge?', expression: 'Σ 1/n²', answer: 0,
    hint: 'Σ 1/nᵖ converges exactly when p > 1.',
    steps: ['This is a p-series with p = 2 > 1, so it converges (to π²/6 ≈ 1.64).'],
    visual: card('p-series', ['Σ 1/nᵖ converges when p > 1']),
  });
  return choose(rng, q, 'Yes: it adds up to a finite number', ['No: the sum grows without bound', 'No: only geometric series converge', 'Yes, but only because its terms go to 0']);
}

const TAYLOR = [
  { f: 'e²ˣ', d: [1, 2, 4, 8] }, { f: 'e³ˣ', d: [1, 3, 9, 27] }, { f: 'e⁻ˣ', d: [1, -1, 1, -1] }, { f: 'sin x', d: [0, 1, 0, -1] },
  { f: 'cos x', d: [1, 0, -1, 0] }, { f: '1/(1 − x)', d: [1, 1, 2, 6] }, { f: 'ln(1 + x)', d: [0, 1, -1, 2] },
];
function taylorDerivTable(rng: Rng): AskStep {
  const t = pick(rng, TAYLOR);
  const q = mkq(S(K12), 'Taylor coefficients', {
    prompt: `Build the Taylor recipe for f(x) = ${t.f} at 0: fill f and its first three derivatives at x = 0.`, expression: "f(0), f′(0), f″(0), f‴(0)", answer: t.d[0],
    hint: 'Differentiate repeatedly, then set x = 0 each time.',
    steps: [`Values: ${t.d.map(fmt).join(', ')}.`, 'The Taylor coefficient of xⁿ is f⁽ⁿ⁾(0)/n!.'],
    visual: card('Taylor at 0', ['f(x) ≈ f(0) + f′(0)x + f″(0)x²/2! + f‴(0)x³/3!']),
  });
  return model(q, { kind: 'table', cols: ['f', 'f′', 'f″', 'f‴'], rowLabels: ['at 0'], rows: [[null, null, null, null]], label: `f(x) = ${t.f}` }, [t.d.join(',')], 'Fill each derivative at x = 0.');
}

function taylorCoefQ(rng: Rng): Question {
  const t = pick(rng, TAYLOR); const n = pick(rng, [2, 3]); const fact = n === 2 ? 2 : 6; const val = t.d[n];
  return mkq(S(K12), 'Taylor coefficients', {
    prompt: `The Timekeeper builds a polynomial for f(x) = ${t.f} near 0. What is the coefficient of x${sup(n)}?`, expression: `f${n === 2 ? '″' : '‴'}(0)/${n}! = ?`, ...fans(val, fact),
    hint: `Coefficient of xⁿ is f⁽ⁿ⁾(0)/n!. Do not forget to divide by ${n}! = ${fact}.`,
    steps: [`f${n === 2 ? '″' : '‴'}(0) = ${fmt(val)}.`, `${fmt(val)}/${fact}${fracStr(val, fact) === `${fmt(val)}/${fact}` ? '' : ` = ${fracStr(val, fact)}`}.`],
    visual: card('Taylor coefficient', ['cₙ = f⁽ⁿ⁾(0)/n!']),
  });
}
const taylorCoefStep = (rng: Rng) => typed(taylorCoefQ(rng));

const TAYLOR_POLYS = [
  { f: 'eˣ', deg: 2, right: '1 + x + x²/2', wrongs: ['1 + x + x²', 'x + x²/2', '1 + x + 2x²'] },
  { f: 'cos x', deg: 2, right: '1 − x²/2', wrongs: ['1 + x²/2', '1 − x²', 'x − x²/2'] },
  { f: 'sin x', deg: 3, right: 'x − x³/6', wrongs: ['x − x³/3', 'x + x³/6', '1 − x³/6'] },
  { f: '1/(1 − x)', deg: 2, right: '1 + x + x²', wrongs: ['1 − x + x²', '1 + x + x²/2', 'x + x²'] },
  { f: 'ln(1 + x)', deg: 2, right: 'x − x²/2', wrongs: ['x + x²/2', '1 + x − x²/2', 'x − x²'] },
];
function taylorChoose(rng: Rng): AskStep {
  const t = pick(rng, TAYLOR_POLYS);
  const q = mkq(S(K12), 'Taylor polynomial', {
    prompt: 'The Timekeeper approximates a curve with a polynomial near 0.', expression: `Degree-${t.deg} Taylor polynomial of ${t.f} at 0`, answer: 0,
    hint: 'Coefficient of xⁿ = f⁽ⁿ⁾(0)/n!. Check f(0) first: it is the constant term.',
    steps: [`${t.f} ≈ ${t.right}.`, 'Each coefficient is the derivative at 0 divided by n!.'],
    visual: card('Taylor', ['f(0) + f′(0)x + f″(0)x²/2! + f‴(0)x³/3!']),
  });
  return choose(rng, q, t.right, t.wrongs);
}

const RATIO_TARGETS: { a: number; S: number; r: number }[] = [{ a: 1, S: 2, r: 0.5 }, { a: 1, S: 4, r: 0.75 }, { a: 1, S: 5, r: 0.8 }, { a: 1, S: 10, r: 0.9 }, { a: 3, S: 4, r: 0.25 }, { a: 3, S: 5, r: 0.4 }, { a: 6, S: 4, r: -0.5 }, { a: 4, S: 5, r: 0.2 }, { a: 2, S: 4, r: 0.5 }, { a: 5, S: 4, r: -0.25 }];
function ratioSliderStep(rng: Rng): AskStep {
  const t = pick(rng, RATIO_TARGETS);
  // energy releases cannot be negative, so a negative ratio gets a signed (displacement) story
  const q = mkq(S(K12), 'solve for the ratio', {
    prompt: t.r > 0 ? `A clock spring releases ${t.a} J, then each release is r times the last. Slide r so the total is ${t.S} J.` : `The clock's escapement arm moves ${t.a} mm, then each move is r times the last (r < 0 flips its direction). Slide r so it ends ${t.S} mm from the start.`, expression: `${t.a}/(1 − r) = ${t.S}`, answer: t.r,
    hint: `Sum = a/(1 − r). Solve ${t.a}/(1 − r) = ${t.S} for r.`,
    steps: [`1 − r = ${lab(t.a, t.r > 0 ? 'J first release' : 'mm first move')} ÷ ${lab(t.S, t.r > 0 ? 'J total' : 'mm from the start')} = ${fracStr(t.a, t.S)}.`, `r = 1 − ${fracStr(t.a, t.S)} = ${lab(fmt(t.r), 'ratio')}.`],
    visual: card('Geometric sum', ['a/(1 − r), |r| < 1']),
  });
  return model(q, { kind: 'slider', min: -0.9, max: 0.9, step: 0.05, label: 'ratio r' }, [String(t.r)], `Slide r until ${t.a}/(1 − r) = ${t.S}.`);
}

function bounceTransfer(rng: Rng): AskStep {
  const H = pick(rng, [2, 4, 6, 10]); const [n, d] = pick(rng, [[1, 2], [1, 3], [3, 4]] as [number, number][]);
  const tot = (H * (d + n)) / (d - n);
  return typed(mkq(S(K12), 'geometric series', {
    prompt: `A ball dropped from ${H} m rebounds to ${fracStr(n, d)} of its height each time. Total distance travelled?`, expression: `${H} + 2·(${H}·${fracStr(n, d)} + …) = ?`, answer: tot, unit: 'm',
    hint: 'Down once from the top; every rebound height is travelled twice (up and down).',
    steps: [`Rebounds: ${fracStr(H * n, d)} + ${fracStr(H * n * n, d * d)} + … = (${fracStr(H * n, d)})/(${fracStr(d - n, d)}) = ${lab(fracStr(H * n, d - n), 'm of rebound heights')}.`, `Total = ${lab(H, 'm first drop')} + 2·${fracStr(H * n, d - n)} = ${lab(fracStr(H * (d + n), d - n), 'metres')}.`],

    visual: card('Bounces', ['down, up-down, up-down, …']),
  }));
}
function decimalTransfer(rng: Rng): AskStep {
  if (rng.next() < 0.5) {
    const dg = rint(rng, 1, 8);
    return typed(mkq(S(K12), 'repeating decimal', {
      prompt: `Write 0.${String(dg).repeat(4)}… as a fraction using a geometric series.`, expression: `${dg}/10 + ${dg}/100 + … = ?`, ...fans(dg, 9),
      hint: `a = ${dg}/10, r = 1/10.`,
      steps: [`(${dg}/10)/(1 − 1/10) = (${dg}/10)/(9/10) = ${fracStr(dg, 9)}.`],
      visual: card('Repeating decimal', [`0.${String(dg).repeat(4)}…`]),
    }));
  }
  const ab = pick(rng, [12, 27, 36, 45, 18, 81]); const s = String(ab);
  return typed(mkq(S(K12), 'repeating decimal', {
    prompt: `Write 0.${s.repeat(3)}… as a fraction using a geometric series.`, expression: `${ab}/100 + ${ab}/10000 + … = ?`, ...fans(ab, 99),
    hint: `a = ${ab}/100, r = 1/100.`,
    steps: [`(${ab}/100)/(1 − 1/100) = ${ab}/99 = ${fracStr(ab, 99)}.`],
    visual: card('Repeating decimal', [`0.${s.repeat(3)}…`]),
  }));
}

/* ================================================================== */
/* Chapters                                                             */
/* ================================================================== */
const CHAPTERS: ChapterSpec[] = [
  {
    key: K1, title: 'Limits & Continuity', wing: 'rim', wingName: 'Canyon Rim Gauges',
    goal: 'Read a limit from a table and a graph, simplify 0/0 by factoring, work one-sided limits and limits at infinity, and make a piecewise rail continuous.',
    misconception: 'Thinking the limit is just f(a), so a hole or 0/0 means "no limit" or "the limit is 0".',
    teach: [
      { title: 'Where is it heading?', text: 'You met limits at the Edge of the Map: where f(x) is heading as x closes in on a, not what happens at a. Now the algebra gets harder. f(x) = (x³ − 1)/(x − 1) has no value at 1, yet from both sides its values close in on 3.', steps: ['At x = 1 the formula gives (1 − 1)/(1 − 1) = 0/0: no value at all.', 'Just left: f(0.9) = (0.729 − 1)/(0.9 − 1) = 0.271/0.1 = 2.71', 'Just right: f(1.1) = (1.331 − 1)/(1.1 − 1) = 0.331/0.1 = 3.31', 'Closer still, f(1.01) = 3.0301. Both sides head for 3: the open dot at (1, 3) on the graph.'], next: 'Try x = 0.99 on a calculator. Does the value land just below 3 or just above it?', visual: plotV([-2, 3, -1, 8], { fns: [{ fn: { kind: 'rational', num: [-1, 0, 0, 1], den: [-1, 1] } }], points: [{ x: 1, y: 3, open: true, label: '(1, 3)' }] }) },
      { title: '0/0 is a clue', text: '0/0 means something cancels. Factor a cubic: x³ − 1 = (x − 1)(x² + x + 1), so the limit is 1 + 1 + 1 = 3. With a root, multiply by the conjugate: (√(x + 4) − 2)/x = 1/(√(x + 4) + 2) → 1/4. And sin(kx)/x → k, not 1.', visual: card('Clearing 0/0', ['factor: (x³ − 1)/(x − 1) = x² + x + 1', 'conjugate: (√A − B)(√A + B) = A − B²', 'sin(kx)/x = k·sin(kx)/(kx) → k']) },
      { title: 'Left, right, continuous', text: 'The two-sided limit exists only when the left and right limits agree. f is continuous at a when f(a) exists, the limit exists, and they are equal. A jump fails; a hole fails; an asymptote fails.', steps: ['On the graph, the left piece stays at height 1 up to x = 1: the left limit is 1.', 'The right piece heads to height −2, so the right limit is −2. The filled dot, f(1) = −2, happens to sit on that piece.', 'The gap is 1 − (−2) = 3 units, so left and right disagree.', 'No two-sided limit at 1, so f is not continuous there: a jump.'], next: 'Imagine lowering the left piece to height −2. Which of the three continuity tests would now pass?', visual: plotV([-3, 5, -5, 5], jump({ next: () => 0.6 } as Rng).layers) },
    ],
    quests: [
      { id: 'aq.calc.limits.gauge', name: 'The Canyon Gauge', giver: 'vector', guided: true, hook: 'Vector: "The rim gauge divides by zero at one setting and reads nonsense. The Engine still needs to know where the reading is heading."', change: 'The rim gauges read smoothly through every setting.',
        waves: [wave('Read the table', mixOf([limitTableStep, factorChooseStep, rationalizeLimitStep])), wave('Left and right', mixOf([oneSidedPlotStep, limitExistsChoose, factorLimitStep])), wave('Seal the joint', mixOf([continuityTableStep, discontinuityChoose]))] },
      { id: 'aq.calc.limits.joint', name: 'The Bridge Joint', giver: 'ada', hook: 'Ada: "Two rail pieces meet over the canyon. If their limits disagree, the cart jumps the joint."', change: 'The bridge joint is sealed with no jump.',
        waves: [wave('Cancel the 0/0', mixOf([factorLimitStep, rationalizeLimitStep, sinLimitChoose])), wave('The long run', mixOf([infinityChoose, infinityTypedStep, oneSidedPlotStep])), wave('No jumps', mixOf([continuityTableStep, discontinuityChoose, continuityTableStep]))] },
    ],
    concept: conceptFrom([limitTableStep, oneSidedPlotStep, continuityTableStep, discontinuityChoose]),
    transfer: oneOf([avgCostTransfer, terminalTransfer]),
    practice: (rng) => (rng.next() < 0.5 ? factorLimitQ : rng.next() < 0.5 ? rationalizeLimitQ : infinityTypedQ)(rng),
  },
  {
    key: K2, title: 'The Derivative', wing: 'rim', wingName: 'Secant Bridges',
    goal: 'See the derivative as the limit of secant slopes, compute it from the definition, draw tangent lines and read a derivative as an instantaneous rate with units.',
    misconception: 'Treating an average rate (a secant with h = 1) as the rate at an instant, or confusing the value f(a) with the slope f′(a).',
    teach: [
      { title: 'Secants shrink to a tangent', text: 'A secant slope [f(a + h) − f(a)]/h is an average rate. Shrink h: the secants swing toward the tangent. Its slope is the derivative f′(a).', steps: ['On the model f(x) = x² and a = 1, so f(1) = 1.', 'h is 1 (step size h): (f(2) − f(1)) ÷ 1 = (4 − 1) ÷ 1 = 3 (secant slope)', 'h is 0.5 (step size h): (2.25 − 1) ÷ 0.5 = 2.5 (secant slope)', 'h is 0.1 (step size h): (1.21 − 1) ÷ 0.1 = 2.1 (secant slope)', 'The secant slopes 3, 2.5, 2.1 close in on 2 (slope of the tangent), so f′(1) = 2 at the point (1, 1).'], next: 'Predict the secant slope for h = 0.01 from the pattern, then tap it on the model.', model: { kind: 'secant', fn: pfn([0, 0, 1]), x: 1, hs: [1, 0.5, 0.1, 0.01], range: [-1, 3, -1, 5] } },
      { title: 'The definition, for every x', text: 'f′(x) = lim h→0 [f(x + h) − f(x)]/h. For f(x) = ax² + bx + c the top is a(2xh + h²) + bh, so the ratio is 2ax + b + ah, which heads to 2ax + b. So (x²)′ = 2x, and at x = 3 the slope of x² is 6.', steps: ['For f(x) = x², a = 1 and b = 0, so f′(x) = 2 × 1 × x + 0 = 2x.', 'At x = 3 (x-value): f′(3) = 2 × 3 = 6 (slope of the tangent)', 'Check with a small h, 0.01 (step size h): (3.01² − 3²) ÷ 0.01 = (9.0601 − 9) ÷ 0.01 = 6.01 (secant slope), just above 6.'], visual: card('f(x) = ax² + bx + c', ['f(x + h) − f(x) = 2axh + ah² + bh', '÷ h: 2ax + b + ah', 'h → 0: f′(x) = 2ax + b']) },
      { title: 'A rate at an instant', text: 'V′(5) = −3 (litres per minute) means that right at t = 5 (minutes) the tank is draining at 3 litres per minute. It is a rate, not an amount, and it carries units of output per input.', visual: card('Units', ['f′ units = f units ÷ x units']) },
    ],
    quests: [
      { id: 'aq.calc.derivative.bridges', name: 'The Secant Bridges', giver: 'ada', guided: true, hook: 'Ada: "Each secant bridge spans two points of the rim. Shrink the span and the bridge becomes a tangent: the slope we need."', change: 'The secant bridges fold down into one tangent span.',
        waves: [wave('Average slopes', mixOf([secantTypedStep, secantTableStep, secantTypedStep])), wave('Shrink h', mixOf([limitDefChoose, secantTableStep, derivDefStep])), wave('Touch the rim', mixOf([tangentDrawStep, rateMeaningChoose]))] },
      { id: 'aq.calc.derivative.instant', name: 'Speed at an Instant', giver: 'newton', hook: 'Newton: "A speedometer does not wait an hour. It reads the rate right now. So will you."', change: "Newton's speedometers read instantaneous speed.",
        waves: [wave('Tangents', mixOf([derivDefStep, tangentDrawStep, flatSliderStep])), wave('Rates', mixOf([rateMeaningChoose, secantTableStep, derivDefStep])), wave('Flat spots', mixOf([tangentDrawStep, limitDefChoose, flatSliderStep]))] },
    ],
    concept: conceptFrom([secantTableStep, tangentDrawStep, limitDefChoose, flatSliderStep]),
    transfer: oneOf([coolingRateTransfer, altimeterTransfer]),

    practice: derivDefQ,
  },
  {
    key: K3, title: 'Derivative Rules', wing: 'works', wingName: 'Rate Works Gearbox',
    goal: 'Differentiate with the power, constant multiple and sum rules term by term, and use the product and quotient rules correctly.',
    misconception: 'Believing (fg)′ = f′·g′ and (f/g)′ = f′/g′, or swapping the order in the quotient rule.',
    teach: [
      { title: 'Why the power rule works', text: 'Pascal\'s triangle expands (x + h)³ = x³ + 3x²h + 3xh² + h³. Subtract x³, divide by h: 3x² + 3xh + h², which heads to 3x² as h → 0. The same pattern gives d/dx xⁿ = n·xⁿ⁻¹ for any real n, so √x = x^½ has slope 1/(2√x). Sums split term by term: (3x⁴ − 5x)′ = 12x³ − 5.', visual: card('(x + h)³ − x³, over h', ['= (3x²h + 3xh² + h³)/h', '= 3x² + 3xh + h²', '→ 3x² as h → 0']) },
      { title: 'Why the product rule has two terms', text: 'Picture f·g as a rectangle f wide and g tall. Nudge x by h: the width grows by f′h and the height by g′h. The new area adds a strip f′h·g, a strip f·g′h and a tiny corner f′g′h², which vanishes after dividing by h. So (fg)′ = f′g + fg′, NOT f′·g′ (that is only the corner).', steps: ['Take f(x) = x² and g(x) = x + 1 at x = 2: f = 4 wide, g = 3 tall, with f′ = 4 and g′ = 1, like the picture.', 'Right strip f′g, per h: 4 × 3 = 12 (right strip). Top strip fg′, per h: 4 × 1 = 4 (top strip).', 'Add the strips: (fg)′ at 2 is 12 + 4 = 16 (growth rate of the area).', 'Check: fg = x³ + x², and 3x² + 2x at x = 2 is 3 × 4 + 2 × 2 = 16. The corner alone, f′ × g′ = 4 × 1 = 4, is far off.'], next: 'Try f(x) = x and g(x) = x at x = 3. Add the two strips: does it match the slope of x² at 3?', visual: { type: 'geo', items: [{ t: 'poly', pts: [[0, 0], [4, 0], [4, 3], [0, 3]], labels: ['f', '', '', 'g'] }, { t: 'poly', pts: [[4, 0], [5, 0], [5, 3], [4, 3]], fill: 'rgba(45,212,191,0.25)', labels: ['f′h', '', '', ''] }, { t: 'poly', pts: [[0, 3], [4, 3], [4, 3.8], [0, 3.8]], fill: 'rgba(249,115,22,0.25)', labels: ['', 'g′h', '', ''] }, { t: 'poly', pts: [[4, 3], [5, 3], [5, 3.8], [4, 3.8]] },
 { t: 'text', p: [2, 1.5], text: 'fg' }, { t: 'text', p: [4.5, 1.5], text: 'f′g·h' }, { t: 'text', p: [2, 3.4], text: 'fg′·h' }] } },
      { title: 'Quotient rule', text: '(f/g)′ = (f′g − fg′)/g². Order matters: "low d-high minus high d-low, over low squared". Swapping the order flips the sign.', steps: ['Find the slope of x²/(x + 1) at x = 1.', 'High f = 1, d-high f′ = 2 × 1 = 2; low g = 1 + 1 = 2, d-low g′ = 1.', '(f′g − fg′)/g² = (2 × 2 − 1 × 1)/2² = 3/4', 'Swapped order: (1 × 1 − 2 × 2)/2² = −3/4, the right size with the wrong sign.'], visual: card('Quotient rule', ['(f/g)′ = (f′g − fg′)/g²']) },
    ],
    quests: [
      { id: 'aq.calc.rules.gearbox', name: 'The Gearbox Rules', giver: 'vector', guided: true, hook: 'Vector: "Every gear in this box is a rule. Learn each one and the whole machine turns."', change: 'The gearbox meshes: every rule turns in step.',
        waves: [wave('Power', mixOf([powerChoose, coefTableStep, polyAtStep])), wave('Products', mixOf([productChoose, productTableStep, productAtStep])), wave('Quotients and tangents', mixOf([quotientChoose, flatTableStep, powerTangentPlotStep]))] },
      { id: 'aq.calc.rules.pump', name: 'Pump Curve Tuning', giver: 'catalyst', hook: 'Dr. Catalyst: "My pump curves are products and quotients. I need their slopes to tune the flow."', change: "Catalyst's pumps are tuned to their flat, efficient spots.",
        waves: [wave('Warm up', mixOf([coefTableStep, polyAtStep, powerChoose])), wave('Ratios', mixOf([productTableStep, quotientAtStep, quotientChoose])), wave('Tune', mixOf([flatTableStep, productAtStep, powerTangentPlotStep]))] },
    ],
    concept: conceptFrom([coefTableStep, productTableStep, powerTangentPlotStep, productChoose]),
    transfer: oneOf([marginalTransfer, concentrationTransfer]),
    practice: polyAtQ,
  },
  {
    key: K4, title: 'Chain Rule & Implicit Differentiation', wing: 'works', wingName: 'Gear Train Hall',
    goal: 'Differentiate compositions by multiplying the outer and inner rates, and differentiate curves like circles implicitly to find tangent slopes.',
    misconception: 'Forgetting to multiply by the inner derivative, and forgetting that every y term picks up dy/dx.',
    teach: [
      { title: 'Rates multiply', text: 'If gear A turns 3 times per turn of B, and B turns 2 times per turn of C, then A turns 6 times per turn of C. The chain rule is the same idea: d/dx f(g(x)) = f′(g(x))·g′(x).', steps: ['Gears: 3 (A turns per B turn) × 2 (B turns per C turn) = 6 (A turns per C turn).', 'y = (x² + 1)³ at x = 1: the inside is u = 1² + 1 = 2 (inside value).', 'Outer rate dy/du = 3u² = 3 × 2² = 12 (outer rate); inner rate du/dx = 2x = 2 × 1 = 2 (inner rate).', 'dy/dx = 12 × 2 = 24 (overall rate)'], next: 'Try the same y = (x² + 1)³ at x = 2. What are u, the outer rate and the inner rate?', visual: card('Chain rule', ['dy/dx = (dy/du)·(du/dx)']) },
      { title: 'Outside, then inside', text: 'd/dx (3x + 1)⁵ = 5(3x + 1)⁴·3 = 15(3x + 1)⁴. Keep the inside untouched in the outer derivative, then multiply by the inside\'s derivative.', visual: card('(3x + 1)⁵', ['outer: 5(3x + 1)⁴', 'inner: 3', '= 15(3x + 1)⁴']) },
      { title: 'Implicit curves', text: 'x² + y² = 25 is not y = f(x), but y still depends on x. Differentiate both sides: 2x + 2y·(dy/dx) = 0, so dy/dx = −x/y. At (3, 4) the slope is −3/4.', visual: { type: 'geo', items: [{ t: 'circle', c: [0, 0], r: 5 }, { t: 'pt', p: [3, 4], label: '(3, 4)' }, { t: 'seg', a: [-1, 7], b: [7, 1], dashed: true }] } },
    ],
    quests: [
      { id: 'aq.calc.chain.train', name: 'The Gear Train', giver: 'brick', guided: true, hook: 'Brick: "Motor drives gear, gear drives drum, drum drives cable. How fast is the cable? Multiply the links."', change: 'The gear train runs: every link turns at the right rate.',
        waves: [wave('Outer times inner', mixOf([chainLinearChoose, chainTableStep, chainAtStep])), wave('Deeper inside', mixOf([chainQuadChoose, chainTableStep, chainAtStep])), wave('Curves', mixOf([implicitChoose, hyperbolaPlotStep]))] },
      { id: 'aq.calc.chain.ring', name: 'The Survey Ring', giver: 'ada', hook: 'Ada: "The survey ring is a circle, not a function. I still need the slope at every stake."', change: 'Every stake on the survey ring has its tangent marked.',
        waves: [wave('Implicit', mixOf([implicitChoose, implicitCircleStep, hyperbolaPlotStep])), wave('Chains', mixOf([chainAtStep, chainTableStep, chainQuadChoose])), wave('Stakes', mixOf([hyperbolaPlotStep, implicitCircleStep, chainLinearChoose]))] },
    ],
    concept: conceptFrom([chainTableStep, hyperbolaPlotStep, chainLinearChoose, implicitChoose]),
    transfer: oneOf([balloonTransfer, lapseTransfer]),

    practice: chainAtQ,
  },
  {
    key: K5, title: 'Trig, Exponential & Log Derivatives', wing: 'works', wingName: 'Oscillator Bench',
    goal: 'Differentiate sin, cos, tan, eˣ, aˣ and ln x, with the chain rule inside, and read trig slopes off the unit circle.',
    misconception: 'Using the power rule on eˣ (xeˣ⁻¹), sign slips such as d/dx cos x = sin x, and dropping the inner derivative of e^(kx) or sin(kx).',
    teach: [
      { title: 'Slopes of waves', text: 'With x in radians, the slope of sin x is cos x: steepest (1) at 0, flat at π/2, steepest downward (−1) at π. The slope of cos x is −sin x: cos x starts at its peak and falls. These slopes need radians; in degrees every slope picks up a factor π/180.', steps: ['Secant check at 0: (sin 0.01 − sin 0) ÷ 0.01 ≈ 0.99998, almost exactly cos 0 = 1.', 'At π/2 ≈ 1.57 the slope of sin is cos(π/2) = 0: sin is flat at its peak, just where the dashed cos crosses the axis.', 'At π ≈ 3.14 the slope of sin is cos π = −1: sin falls through the axis as steeply as it can.', 'The slope of cos at π/2 is −sin(π/2) = −1 × 1 = −1: cos is falling fastest there.'], next: 'At x = 3π/2 ≈ 4.71, read the height of the dashed cos curve. What is the slope of sin there?',
 visual: plotV([-0.5, 6.5, -1.5, 1.5], { fns: [{ fn: { kind: 'sin' }, label: 'sin' }, { fn: { kind: 'cos' }, label: 'cos', dashed: true }] }) },
      { title: 'eˣ is its own slope', text: 'd/dx eˣ = eˣ. The power rule does not apply because x is in the exponent. For other bases, d/dx aˣ = aˣ·ln a, and ln x, the inverse, has slope 1/x.', steps: ['The tangent on the graph touches at x = 0, where the height is e⁰ = 1, so its slope is also 1.', 'Secant check: (e^0.01 − e⁰) ÷ 0.01 ≈ (1.01005 − 1) ÷ 0.01 = 1.005 (secant slope), close to 1.', 'At x = 2 the height and the slope are both e² ≈ 7.39.', 'Other bases and ln: slope of 2ˣ at 0 is 2⁰ × ln 2 = ln 2 ≈ 0.693; slope of ln x at 4 is 1/4 = 0.25.'], visual: plotV([-3, 3, -1, 6], { fns: [{ fn: { kind: 'exp', a: 1, base: Math.E } }], tangent: { fn: { kind: 'exp', a: 1, base: Math.E }, x: 0 } }) },
      { title: 'With an inside', text: 'd/dx e³ˣ = 3e³ˣ; d/dx sin(4x) = 4cos(4x); d/dx ln(x² + 1) = 2x/(x² + 1). The inner derivative always multiplies.', visual: card('Chain inside', ['e^u → e^u·u′', 'sin u → cos u·u′', 'ln u → u′/u']) },
    ],
    quests: [
      { id: 'aq.calc.transcend.oscillator', name: 'The Oscillator Bench', giver: 'volt', guided: true, hook: 'Volt: "My signals are sines and exponentials. I need their slopes to size the capacitors."', change: 'The oscillators hum in phase.',
        waves: [wave('The basics', mixOf([basicTransChoose, trigTableStep, basicTransChoose])), wave('Circle slopes', mixOf([unitcircleSlopeStep, trigChainChoose, transAtStep])), wave('Growth', mixOf([expChainChoose, tangentTransPlotStep]))] },
      { id: 'aq.calc.transcend.decay', name: 'Decay and Growth', giver: 'catalyst', hook: 'Dr. Catalyst: "Reactions grow and decay exponentially, and my sensors read in logs. Differentiate them all."', change: "Catalyst's reaction monitors track every rate.",
        waves: [wave('Exponentials', mixOf([expChainChoose, tangentTransPlotStep, transAtStep])), wave('Logs', mixOf([lnChainChoose, lnSliderStep, basicTransChoose])), wave('Waves', mixOf([trigTableStep, unitcircleSlopeStep, transAtStep]))] },
    ],
    concept: conceptFrom([trigTableStep, unitcircleSlopeStep, tangentTransPlotStep, lnSliderStep]),
    transfer: oneOf([coolingTransfer, springTransfer]),
    practice: transAtQ,
  },
  {
    key: K6, title: 'Tangent Lines & Motion', wing: 'yard', wingName: 'Launch Yard Rails',
    goal: 'Write and draw tangent lines, and use position, velocity and acceleration to say when an object is at rest, peaking, speeding up or slowing down.',
    misconception: 'Thinking negative acceleration always means slowing down, or that "at rest" means position zero.',
    teach: [
      { title: 'Tangent line', text: 'At x = a the tangent passes through (a, f(a)) with slope f′(a): y = f(a) + f′(a)(x − a). Near a it is an excellent stand-in for the curve.', steps: ['On the graph f(x) = x² and a = 1: f(1) = 1² = 1 (height) and f′(1) = 2 × 1 = 2 (slope of the tangent).', 'y = 1 + 2(x − 1), which tidies to y = 2x − 1.', 'Stand-in test at 1.1 (x-value): the line gives 2 × 1.1 − 1 = 1.2 (line height), the curve gives 1.1² = 1.21 (curve height).'], next: 'Use the same tangent line to estimate 0.9². How close is it to the true value?', visual: plotV([-2, 3, -2, 6], { fns: [{ fn: pfn([0, 0, 1]) }], tangent: { fn: pfn([0, 0, 1]), x: 1 } }) },
      { title: 'Position, velocity, acceleration', text: 'Velocity is how fast position changes, and acceleration is how fast velocity changes: v(t) = s′(t) and a(t) = v′(t) = s″(t). At rest means v = 0, not s = 0. A launched flare peaks when its velocity reaches 0.', steps: ['A flare: s(t) = 40t − 5t² metres.', 'v(t) = 40 − 10t m/s and a(t) = −10 m/s².', 'At rest: 40 − 10t = 0, so t = 40 (m/s launch speed) ÷ 10 (m/s lost per second) = 4 (seconds).', 'Peak height: s(4) = 40 × 4 − 5 × 4² = 160 − 80 = 80 (m peak height).'], visual: card('Motion', ['s → v = s′ → a = s″', 'at rest: v = 0']) },
      { title: 'Speeding up?', text: 'Speed grows when v and a have the SAME sign, and shrinks when they differ. v = −6 and a = −2 means speeding up backward, even though a is negative.', steps: ['Cart: s(t) = t³ − 6t², so v = 3t² − 12t and a = 6t − 12.', 'v(1) = 3 − 12 = −9 (velocity) and a(1) = 6 − 12 = −6 (acceleration): same sign, so speeding up, backward.', 'v(3) = 27 − 36 = −9 (velocity) and a(3) = 18 − 12 = 6 (acceleration): opposite signs, so slowing down.', 'Speed is 9 both times, but it is growing at t = 1 and shrinking at t = 3.'], next: 'Check this cart at t = 5. What are the signs of v and a, and is it speeding up?', visual: card('Signs', ['v, a same sign → speeding up', 'opposite signs → slowing down']) },
    ],
    quests: [
      { id: 'aq.calc.motion.rail', name: 'The Launch Rail', giver: 'newton', guided: true, hook: 'Newton: "The launch cart runs a cubic law. Tell me when it stops, when it peaks, and when it is speeding up."', change: 'The launch rail runs on schedule.',
        waves: [wave('Velocity', mixOf([velocityStep, motionTableStep, accelStep])), wave('Rest and peak', mixOf([restNumberlineStep, speedingChoose, peakTableStep])), wave('Tangents', mixOf([tangentLinePlotStep, tangentEqChoose]))] },
      { id: 'aq.calc.motion.bridge', name: 'The Tangent Bridge', giver: 'brick', hook: 'Brick: "A straight bridge must kiss the rim at exactly one point. Get the slope wrong and it cuts the rock."', change: 'The tangent bridge rests on the rim, touching at one point.',
        waves: [wave('Kiss the rim', mixOf([tangentLinePlotStep, tangentEqChoose, tangentLinePlotStep])), wave('Carts', mixOf([motionTableStep, velocityStep, speedingChoose])), wave('Flares', mixOf([peakTableStep, restNumberlineStep, accelStep]))] },
    ],
    concept: conceptFrom([motionTableStep, restNumberlineStep, tangentLinePlotStep, speedingChoose]),
    transfer: oneOf([linearizeTransfer, impactTransfer]),
    practice: velocityQ,
  },
  {
    key: K7, title: 'Related Rates & Optimisation', wing: 'yard', wingName: 'Ripple Tank & Design Office',
    goal: 'Link rates through an equation and differentiate with respect to time, and find the best design by setting a derivative to zero and checking endpoints.',
    misconception: 'Substituting the instant\'s values before differentiating (so every rate becomes 0), and assuming f′ = 0 always gives the maximum.',
    teach: [
      { title: 'Differentiate, then substitute', text: 'Related rates: quantities that change together are tied by one equation, so their rates are tied too. Rule: write the equation, differentiate both sides with respect to time, and only then put in the values at the instant.', steps: ['1. A ripple: A = πr²', '2. d/dt both sides: dA/dt = 2πr·dr/dt', '3. Now r = 5 (cm) and dr/dt = 2 (cm/s): dA/dt = 2π × 5 × 2 = 20π ≈ 62.8 (cm² per second)', 'Wrong order: π × 5² = 25π is just a constant area, so its rate comes out 0.'], next: 'Keep dr/dt = 2. Is dA/dt bigger or smaller when r = 10, and by what factor?', visual: card('Related rates', ['1. equation', '2. d/dt both sides', '3. substitute']) },
      { title: 'Best design', text: 'To maximise A(x), solve A′(x) = 0, then check that it is a maximum (A″ < 0 or a sign change) and compare with the endpoints.', steps: ['60 m of fence against a wall, x m for each end: area A(x) = x(60 − 2x) = 60x − 2x².', 'A′(x) = 60 − 4x, and 60 − 4x = 0 gives x = 60 (m of fence) ÷ 4 = 15 (m per end).', 'A″ = −4 < 0, so x = 15 is a maximum, the peak at the A′ = 0 line.', 'A(15) = 60 × 15 − 2 × 15² = 900 − 450 = 450 (square metres). Endpoints: A(0) = A(30) = 0.'], next: 'Try x = 10 and x = 20 in A(x). Are both below 450, and how do they compare?', visual: plotV([0, 30, 0, 500], { fns: [{ fn: pfn([0, 60, -2]) }], vlines: [{ x: 15, label: 'A′ = 0' }] }) },
      { title: 'Endpoints matter', text: 'On a closed interval the absolute max or min can sit at an endpoint, not just where f′ = 0. Rule: find f at every critical point and at both ends, then compare. Example: f(x) = x² on [−1, 3].', steps: ['f′(x) = 2x is 0 only at x = 0, where f(0) = 0² = 0.', 'Endpoints: f(−1) = (−1)² = 1 and f(3) = 3² = 9.', 'Compare 0, 1 and 9: the absolute min is 0 at x = 0, and the absolute max is 9 at the right edge, x = 3.'], visual: plotV([-2, 4, -1, 10], { fns: [{ fn: pfn([0, 0, 1]), from: -1, to: 3 }], vlines: [{ x: -1 }, { x: 3 }] }) },
    ],
    quests: [
      { id: 'aq.calc.rates.ripple', name: 'The Ripple Tank', giver: 'catalyst', guided: true, hook: 'Dr. Catalyst: "Drops hit the tank, ladders slide, tanks inflate. Everything changes together; link the rates."', change: 'The ripple tank gauges track every linked rate.',
        waves: [wave('Linked rates', mixOf([rippleChoose, sphereStep, ladderTableStep])), wave('Ladders and tanks', mixOf([ladderStep, coneStep, rippleChoose])), wave('Best design', mixOf([objectiveChoose, fenceTableStep, boxSliderStep]))] },
      { id: 'aq.calc.rates.design', name: 'The Best Beam', giver: 'ada', hook: 'Ada: "Fixed fence, fixed sheet, fixed budget. Find the design that gets the most out of it."', change: 'The design office pins up the optimal plans.',
        waves: [wave('Fences', mixOf([objectiveChoose, fenceTableStep, endpointChoose])), wave('Boxes', mixOf([boxSliderStep, fenceAreaStep, ladderStep])), wave('Mixed', mixOf([ladderTableStep, coneStep, fenceTableStep]))] },
    ],
    concept: conceptFrom([ladderTableStep, fenceTableStep, boxSliderStep, rippleChoose]),
    transfer: oneOf([shadowTransfer, productMaxTransfer]),
    practice: (rng) => ladderStep(rng).question,
  },
  {
    key: K8, title: 'Curve Sketching', wing: 'yard', wingName: 'Survey Tower',
    goal: 'Use f′ for increasing/decreasing and extrema and f″ for concavity and inflection points, and match graphs of f and f′.',
    misconception: 'Thinking f′ = 0 always means a max or min (x³ at 0), and reading the graph of f′ as if it were f.',
    teach: [
      { title: 'First derivative test', text: 'f′ > 0: f rises. f′ < 0: f falls. A local max is where f′ goes + to −, a local min where it goes − to +. f′ = 0 with no sign change (x³ at 0) is neither.', steps: ['For f(x) = x³ − 3x, f′(x) = 3x² − 3, which is 0 at x = −1 and x = 1.', 'f′(−2) = 3 × 4 − 3 = 9 > 0: rising.', 'f′(0) = 0 − 3 = −3 < 0: falling. f′(2) = 12 − 3 = 9 > 0: rising.', 'So f′ goes + to − at −1 (the max on the line) and − to + at 1 (the min).'], next: 'f(x) = x³ has f′(0) = 0. Test f′ at −1 and at 1: does the sign change?', visual: { type: 'numline', min: -4, max: 4, points: [{ x: -1, label: 'max' }, { x: 1, label: 'min' }] } },
      { title: 'Second derivative', text: 'f″ > 0: concave up, like a cup. f″ < 0: concave down. An inflection point is where f″ changes sign: the bend flips.', steps: ['The graph is f(x) = x³ − 3x, so f′ = 3x² − 3 and f″(x) = 6x.', 'f″(−1) = 6 × (−1) = −6 < 0: concave down at (−1, 2), a max. Height: f(−1) = −1 + 3 = 2.', 'f″(1) = 6 × 1 = 6 > 0: concave up at (1, −2), a min.', 'f″ flips sign at x = 0, and f(0) = 0: the inflection point at (0, 0).'], visual: plotV([-3, 3, -4, 4], { fns: [{ fn: pfn([0, -3, 0, 1]) }], points: [{ x: 0, y: 0, label: 'inflection' }, { x: -1, y: 2, label: 'max' }, { x: 1, y: -2, label: 'min' }] }) },
      { title: 'f and f′ side by side', text: 'Where f turns, f′ crosses zero. Where f is steepest, f′ peaks. The graph of f′ is a different picture: its low point is not f\'s low point.', steps: ['f(x) = x³ − 3x is solid; f′(x) = 3x² − 3 is dashed.', 'f turns at x = 1, and f′(1) = 3 × 1 − 3 = 0: the dashed curve crosses zero right below the turn.', 'The low point of f′ is f′(0) = 3 × 0 − 3 = −3: that is where f falls most steeply, not where f is lowest.'], next: 'The dashed f′ crosses zero at one more x-value. Find it: what does f do there?', visual: plotV([-3, 3, -4, 6], { fns: [{ fn: pfn([0, -3, 0, 1]), label: 'f' }, { fn: pfn([-3, 0, 3]), label: 'f′', dashed: true }] }) },
    ],
    quests: [
      { id: 'aq.calc.sketch.profile', name: 'The Canyon Profile', giver: 'vector', guided: true, hook: 'Vector: "Survey the rim from its derivatives alone: where it climbs, where it peaks, where it bends."', change: 'The canyon profile is charted peak by peak.',
        waves: [wave('Rise and fall', mixOf([signNumberlineStep, increasingChoose, fprimePlotStep])), wave('Bending', mixOf([flatNoExtremumChoose, concavityChoose, inflectionPlotStep])), wave('Match the graphs', mixOf([pickDerivGraph, localExtremeStep]))] },
      { id: 'aq.calc.sketch.survey', name: 'Survey of the Rim', giver: 'ada', hook: 'Ada: "My instruments only log slopes. Rebuild the rim from them."', change: 'The rim survey map is complete.',
        waves: [wave('Graphs', mixOf([pickDerivGraph, inflectionPlotStep, concavityChoose])), wave('Slopes only', mixOf([fprimePlotStep, increasingChoose, localExtremeStep])), wave('Full sketch', mixOf([signNumberlineStep, flatNoExtremumChoose, pickDerivGraph]))] },
    ],
    concept: conceptFrom([signNumberlineStep, pickDerivGraph, inflectionPlotStep, fprimePlotStep, increasingChoose]),
    transfer: oneOf([pickFGraphTransfer, drugPeakTransfer]),
    practice: localExtremeQ,
  },
  {
    key: K9, title: 'Antiderivatives & Riemann Sums', wing: 'towers', wingName: 'Riemann Towers',
    goal: 'Undo differentiation with + C, pin C with an initial value, and estimate areas with left and right Riemann sums.',
    misconception: 'Forgetting + C, integrating xⁿ to xⁿ⁺¹ without dividing, and not knowing whether a Riemann sum over- or underestimates.',
    teach: [
      { title: 'Undo the derivative', text: '∫ xⁿ dx = xⁿ⁺¹/(n + 1) + C. Check by differentiating: you must get the integrand back. ∫ 6x² dx = 2x³ + C.', visual: card('Antiderivative', ['∫ 6x² dx = 2x³ + C', 'check: (2x³)′ = 6x²']) },
      { title: 'The + C family', text: 'An antiderivative is never unique: adding a constant does not change the slope, so the antiderivatives form a family of parallel curves F(x) + C. One known value, like F(0) = 2, picks the one you need.', steps: ['Undo F′(x) = 2x: F(x) = x² + C.', 'Known value F(0) = 2: 0² + C = 2, so C = 2.', 'F(x) = x² + 2 is the solid curve through (0, 2); the dashed ones are C = −2, 0 and 4.', 'Check: F(1) = 1² + 2 = 3.'], next: 'Which curve in the family passes through (1, 5)? Find its C.', visual: plotV([-3, 3, -6, 8], { fns: [0, 2, 4, -2].map((c) => ({ fn: pfn([c, 0, 1]), dashed: c !== 2, color: (c === 2 ? 'teal' : 'muted') as 'teal' | 'muted' })), points: [{ x: 0, y: 2, label: 'F(0) = 2' }] }) },
      { title: 'Rectangles under a curve', text: 'A Riemann sum estimates the area under a curve with thin rectangles. Split [a, b] into n strips of width Δx = (b − a)/n, take each height from a left or right endpoint, and add f(x)·Δx. More rectangles, better estimate.', steps: ['On the model f(x) = 1 + x² on [0, 3]. With 3 strips, Δx = (3 − 0) ÷ 3 = 1 (strip width).', 'Left heights: f(0) = 1, f(1) = 2, f(2) = 5 (strip heights).', 'Area ≈ (1 + 2 + 5) × 1 = 8 (area estimate)', 'The curve rises, so left rectangles sit under it: an underestimate of the true 12 (area under the curve). With 6 strips the sum is 9.875 (area estimate).'], next: 'Tap 12 strips. Is the estimate closer to 12, and is it still below it?', model: { kind: 'riemann', fn: pfn([1, 0, 1]), a: 0, b: 3, ns: [3, 6, 12, 24], rule: 'left', range: [-0.5, 3.5, -1, 11] } },
    ],
    quests: [
      { id: 'aq.calc.antideriv.footprints', name: 'Tower Footprints', giver: 'brick', guided: true, hook: 'Brick: "The towers stand like rectangles under the skyline curve. Estimate the ground they cover, then undo the rates."', change: 'The Riemann Towers light up floor by floor.',
        waves: [wave('Undo it', mixOf([antiPowerChoose, antiTableStep, initialValueStep])), wave('+ C', mixOf([familyPlotStep, antiPowerChoose, riemannTableStep])), wave('Rectangles', mixOf([riemannStep, overUnderChoose]))] },
      { id: 'aq.calc.antideriv.flow', name: 'The Flow Meter Log', giver: 'volt', hook: 'Volt: "The meter logs rates. I need totals, and I need to know if my estimates run high or low."', change: 'The flow meter totals are logged and checked.',
        waves: [wave('Estimate', mixOf([riemannTableStep, overUnderChoose, riemannStep])), wave('Totals', mixOf([familyPlotStep, initialValueStep, antiTableStep])), wave('Mixed', mixOf([antiPowerChoose, riemannTableStep, familyPlotStep]))] },
    ],
    concept: conceptFrom([antiTableStep, familyPlotStep, riemannTableStep, overUnderChoose]),
    transfer: oneOf([speedLogTransfer, accelTransfer]),
    practice: (rng) => (rng.next() < 0.5 ? initialValueQ : riemannQ)(rng),

  },
  {
    key: K10, title: 'The Fundamental Theorem', wing: 'towers', wingName: 'The Accumulator',
    goal: 'Evaluate definite integrals as F(b) − F(a), use the derivative of an accumulation function, treat area below the axis as negative, and integrate by u-substitution with new limits.',
    misconception: 'Computing F(a) − F(b), treating ∫ as total area even below the axis, and forgetting to change the limits (or the du factor) in u-substitution.',
    teach: [
      { title: 'Accumulation', text: 'G(x) = ∫ₐˣ g(t) dt is the shaded area from a up to a moving edge x. Push the edge a tiny step h: the area grows by a strip about g(x) tall and h wide, so G′(x) = g(x). G is an antiderivative of g, so ∫ₐᵇ g = G(b) − G(a) = F(b) − F(a) for any antiderivative F.', steps: ['In the picture g(t) = 1 + 0.25t + 0.2t², a = 0.5 and the edge is at x = 2.5.', 'Edge height: g(2.5) = 1 + 0.625 + 1.25 = 2.875 (edge height), so G′(2.5) = 2.875.', 'Push the edge by h = 0.1 (step size h): new strip ≈ g(2.5) × h = 2.875 × 0.1 = 0.2875 (strip area).', 'Total: with F(t) = t + 0.125t² + t³/15, F(2.5) − F(0.5) ≈ 4.323 − 0.540 ≈ 3.783 (shaded area).'], next: 'Picture the edge x slid back to a = 0.5. What is G(0.5)?', visual: plotV([-0.5, 4, -0.5, 6], { fns: [{ fn: pfn([1, 0.25, 0.2]) }], shade: { fn: pfn([1, 0.25, 0.2]), a: 0.5, b: 2.5 }, vlines: [{ x: 0.5, label: 'a' }, { x: 2.5, label: 'x: G(x) = shaded area' }] }) },
      { title: 'Sums become an antiderivative', text: 'So the Riemann sums, which approach the area, approach F(b) − F(a) where F′ = f. ∫₀² 3x² dx = 2³ − 0³ = 8: watch the rectangles close in on it.', model: { kind: 'riemann', fn: pfn([0, 0, 3]), a: 0, b: 2, ns: [2, 4, 8, 16, 64], rule: 'mid', range: [-0.5, 2.5, -1, 13] } },

      { title: 'u-substitution', text: '∫ 2x(x² + 1)³ dx: let u = x² + 1, du = 2x dx, so it is ∫ u³ du = u⁴/4 + C. If only x dx is there, it is ½ du: carry the ½. With limits, convert them to u-values too; putting x-limits into u⁴/4 is the classic slip.', visual: card('Substitute', ['u = x² + 1, du = 2x dx', 'x: 0 → 1 becomes u: 1 → 2']) },
    ],
    quests: [
      { id: 'aq.calc.ftc.accumulator', name: 'The Accumulator', giver: 'volt', guided: true, hook: 'Volt: "The Accumulator stores every trickle of current. Tell me the total without adding a million rectangles."', change: 'The Accumulator charges and reads its total exactly.',
        waves: [wave('F(b) − F(a)', mixOf([ftcStep, ftcOrderChoose, accumSliderStep])), wave('Moving edge', mixOf([ftcPart1Choose, gPrimeStep, constTableStep])), wave('Below the axis', mixOf([signedChoose, accumSliderStep]))] },
      { id: 'aq.calc.ftc.signal', name: 'The Substitution Signal', giver: 'catalyst', hook: 'Dr. Catalyst: "My reaction integrals hide a function inside a function. Substitute and they fall open."', change: "Catalyst's reaction totals are computed exactly.",
        waves: [wave('Substitute', mixOf([uSubChoose, uLimitsTable, uSubLimitsChoose])), wave('Evaluate', mixOf([ftcStep, constTableStep, uSubDefStep])), wave('Mixed', mixOf([uSubLimitsChoose, signedChoose, uSubChoose]))] },
    ],
    concept: conceptFrom([uLimitsTable, accumSliderStep, constTableStep, ftcOrderChoose]),
    transfer: oneOf([tankTransfer, springWorkTransfer]),
    practice: (rng) => ftcQ(rng).q,
  },
  {
    key: K11, title: 'Area & Volume', wing: 'towers', wingName: 'Canyon Cut & Lathe Room',
    goal: 'Find the area between two curves from their crossing points, and the volume of a solid of revolution by stacking disks.',
    misconception: 'Integrating bottom minus top (or guessing the limits), and forgetting to square the radius in the disk method.',
    teach: [
      { title: 'Top minus bottom', text: 'The area between two curves is the region trapped between them. Rule: area = ∫ (top − bottom) dx, from one crossing point to the next. Example: y = 2x and y = x².', steps: ['Crossings: 2x = x² gives x(2 − x) = 0, so x = 0 and x = 2.', 'Top is 2x: at x = 1, 2 × 1 = 2 is above 1² = 1.', 'An antiderivative of 2x − x² is x² − x³/3.', '∫₀² (2x − x²) dx = (2² − 2³/3) − 0 = 4 − 8/3 = 4/3 (area between the curves)'], next: 'Work it as bottom minus top by mistake. What sign comes out, and what does that tell you?', visual: plotV([-1, 3, -1, 5], { fns: [{ fn: pfn([0, 2]), label: '2x' }, { fn: pfn([0, 0, 1]), label: 'x²' }] }) },
      { title: 'Stack of disks', text: 'Spin y = f(x) about the x-axis. Each slice is a disk of radius f(x) and area π·f(x)². Add the disks: V = π∫ f(x)² dx.', steps: ['Spin y = √x. The disk on the graph has radius √2 (its x is 2), so its area is π × (√2)² = 2π.', 'Squaring removes the root: every disk has area π(√x)² = πx.', 'Add the disks from 0 to 4: V = π∫₀⁴ x dx = π × 4²/2 = 8π ≈ 25.1 (volume)'], next: 'What is the area of the disk at x = 4?', visual: plotV([0, 5, -3, 3], { fns: [{ fn: { kind: 'sqrt' } }, { fn: { kind: 'sqrt', a: -1 }, dashed: true, color: 'muted' }], vlines: [{ x: 2, label: 'disk' }] }) },
    ],
    quests: [
      { id: 'aq.calc.area.cut', name: 'The Canyon Cut', giver: 'brick', guided: true, hook: 'Brick: "We are cutting a channel between two curves of rock. How much do we dig?"', change: 'The channel is cut to the exact area.',
        waves: [wave('Crossings', mixOf([intersectPlotStep, topBottomChoose, areaBetweenStep])), wave('Areas', mixOf([intersectPlotStep, areaBetweenStep, topBottomChoose])), wave('Spin it', mixOf([diskTableStep, diskChoose]))] },
      { id: 'aq.calc.area.lathe', name: 'The Lathe Room', giver: 'ada', hook: 'Ada: "The lathe spins a profile into a nozzle. I need its volume before I pour the metal."', change: 'The lathe turns out nozzles of exact volume.',
        waves: [wave('Disks', mixOf([diskTableStep, diskChoose, diskStep])), wave('Volumes', mixOf([diskTableStep, diskStep, intersectPlotStep])), wave('Areas again', mixOf([areaBetweenStep, topBottomChoose, intersectPlotStep]))] },
    ],
    concept: conceptFrom([intersectPlotStep, diskTableStep, topBottomChoose, diskChoose]),
    transfer: oneOf([signPaintTransfer, raceTransfer]),
    practice: areaBetweenQ,
  },
  {
    key: K12, title: 'Infinite Series', wing: 'clock', wingName: 'The Clock Tower',
    goal: 'Sum geometric series, tell convergent from divergent series at an introductory level, and build Taylor polynomials from derivatives at 0.',
    misconception: 'Believing a series converges just because its terms go to 0 (the harmonic series diverges), and forgetting the n! in Taylor coefficients.',
    teach: [
      { title: 'Partial sums', text: '8 + 4 + 2 + 1 + …: the partial sums 8, 12, 14, 15, … creep toward 16. A geometric series with |r| < 1 sums to a/(1 − r) = 8/(1 − 1/2) = 16.', visual: plotV([0, 7, 0, 18], { points: [1, 2, 3, 4, 5, 6].map((n) => ({ x: n, y: 16 - 16 / 2 ** n })), hlines: [{ y: 16, label: 'sum 16' }] }) },
      { title: 'Terms → 0 is not enough', text: '1 + 1/2 + 1/3 + … has terms shrinking to 0, yet it grows without bound. Σ 1/n² converges (p = 2 > 1); Σ 1/n does not (p = 1).', visual: card('Harmonic series', ['(1/3 + 1/4) > 1/2', '(1/5 + … + 1/8) > 1/2', 'forever → ∞']) },
      { title: 'Taylor polynomials', text: 'Match a function\'s derivatives at 0: the coefficient of xⁿ is f⁽ⁿ⁾(0)/n!. eˣ ≈ 1 + x + x²/2 + x³/6. The Timekeeper computes with these.', steps: ['Every derivative of eˣ at 0 is e⁰ = 1, so the coefficients are 1/0!, 1/1!, 1/2!, 1/3! = 1, 1, 1/2, 1/6.', 'P₂(1) = 1 + 1 + 1/2 = 2.5', 'P₃(1) = 2.5 + 1/6 = 2.667 (to 3 d.p.), close to e ≈ 2.718.', 'On the graph the dashed P₂ hugs eˣ near 0 and drifts below: P₂(2) = 1 + 2 + 2 = 5, but e² ≈ 7.39.'], next: 'Estimate e^0.5 with P₂. Is it a little low or a little high?', visual: plotV([-2, 2, -1, 6], { fns: [{ fn: { kind: 'exp', a: 1, base: Math.E }, label: 'eˣ' }, { fn: pfn([1, 1, 0.5]), dashed: true, label: 'P₂' }] }) },
    ],
    quests: [
      { id: 'aq.calc.series.pendulum', name: "The Timekeeper's Pendulum", giver: 'vector', guided: true, hook: 'Vector: "The pendulum\'s swings shrink by the same ratio forever. Does the total distance stay finite?"', change: "The Timekeeper's pendulum settles and the clock face lights.",
        waves: [wave('Partial sums', mixOf([partialSumTable, geomSumStep, ratioSliderStep])), wave('Converge?', mixOf([harmonicChoose, convergeChoose, geomSumStep])), wave('Taylor', mixOf([taylorDerivTable, taylorChoose]))] },
      { id: 'aq.calc.series.gears', name: 'The Clock Gears', giver: 'newton', hook: 'Newton: "The clock computes sin and eˣ with nothing but adding and multiplying. Build its polynomials."', change: 'The Calculus Timekeeper strikes the hour.',
        waves: [wave('Polynomials', mixOf([taylorDerivTable, taylorCoefStep, taylorChoose])), wave('Ratios', mixOf([ratioSliderStep, partialSumTable, convergeChoose])), wave('Endless sums', mixOf([geomSumStep, harmonicChoose, taylorDerivTable]))] },
    ],
    concept: conceptFrom([partialSumTable, ratioSliderStep, taylorDerivTable, harmonicChoose]),
    transfer: oneOf([bounceTransfer, decimalTransfer]),
    practice: geomSumQ,
  },
  {
    key: 'trial', title: 'Mastery Trial & Graduation', wing: 'clock', wingName: 'The Timekeeper\'s Chamber',
    goal: 'Prove durable command of limits, derivatives, their applications, integrals and series under trial rules. Seat the Calculus Core.',
    misconception: 'One lucky run is mastery; practising derivatives but not integrals and series.',
    teach: [
      { title: 'Trial rules', text: 'Four phases across the whole academy, one helper you may use once. Pass at 80% or better. Every chapter must already be mastered.', visual: card('The Mastery Trial', ['Limits & derivatives', 'Applications', 'Integrals', 'Series & transfer']) },
    ],
    quests: [
      { id: 'aq.calc.trial.rehearsal', name: 'Trial Rehearsal', giver: 'vector', guided: true, hook: 'Vector: "Before the Timekeeper\'s Chamber, a rehearsal. Same shape, no stakes."', change: 'The chamber doors unbar.',
        waves: [wave('Limits & slopes', mixOf([limitTableStep, secantTableStep, powerChoose])), wave('Rules', mixOf([chainTableStep, basicTransChoose, tangentLinePlotStep])), wave('Totals', mixOf([riemannTableStep, ftcOrderChoose, geomSumStep]))] },
      { id: 'aq.calc.trial.keeper', name: 'The Timekeeper', giver: 'newton', hook: 'Newton: "The Timekeeper asks about change and accumulation from any angle. Answer like you own it."', change: 'The Timekeeper steps aside.',
        waves: [wave('Change', mixOf([oneSidedPlotStep, productTableStep, implicitChoose, speedingChoose])), wave('Apply and accumulate', mixOf([fenceTableStep, increasingChoose, uSubLimitsChoose, intersectPlotStep]))] },
    ],
    concept: conceptFrom([secantTableStep, riemannTableStep, pickDerivGraph, taylorDerivTable]),
    transfer: oneOf([avgCostTransfer, linearizeTransfer, shadowTransfer, tankTransfer, raceTransfer, bounceTransfer]),
    practice: (rng) => ftcQ(rng).q,
  },
];

export const CALCULUS = defineAcademy({
  id: ID,
  name: 'Calculus Academy',
  short: 'Calculus',
  tier: 'Advanced',
  blurb: 'Limits, derivatives, applications, integrals and series: the mathematics of change.',
  icon: 'hourglass',
  home: 'calculus-frontier',
  wings: {
    rim: { name: 'Canyon Rim', icon: 'bridge' },
    works: { name: 'Rate Works', icon: 'gear' },
    yard: { name: 'Launch Yard', icon: 'target' },
    towers: { name: 'Riemann Towers', icon: 'factory' },
    clock: { name: 'The Clock Tower', icon: 'hourglass' },
  },
  chapters: CHAPTERS,
  trial: (rng) => [
    { name: 'Limits & derivatives', items: [limitTableStep(rng), factorLimitStep(rng), oneSidedPlotStep(rng), secantTableStep(rng), tangentDrawStep(rng), powerChoose(rng), productTableStep(rng), chainAtStep(rng), implicitChoose(rng), basicTransChoose(rng)] },
    { name: 'Applications', items: [tangentLinePlotStep(rng), speedingChoose(rng), ladderStep(rng), fenceTableStep(rng), signNumberlineStep(rng)
, pickDerivGraph(rng), flatNoExtremumChoose(rng)] },
    { name: 'Integrals', items: [antiPowerChoose(rng), riemannTableStep(rng), ftcOrderChoose(rng), uSubDefStep(rng), intersectPlotStep(rng), diskChoose(rng)] },
    { name: 'Series & transfer', items: [geomSumStep(rng), harmonicChoose(rng), taylorDerivTable(rng), oneOf([linearizeTransfer, shadowTransfer, tankTransfer])(rng)] },
  ],
  trialIntro: 'The Mastery Trial. Four phases from limits to series, one helper, 80% to pass. The Calculus Timekeeper is watching the clock.',
  coreName: 'The Calculus Core',
  coreLine: 'Change and accumulation, mastered. The Calculus Timekeeper strikes, tangent bridges lock onto the canyon rim, the Riemann Towers blaze floor by floor, and the road to the Linear Algebra Academy opens.',
  coreColor: '#22d3ee',
  title: 'Timekeeper',
});
