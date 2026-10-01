import type { Difficulty, Question, QuestionChoice } from '../types';
import { createRng, type Rng } from '../rng';
import type { Generator } from './context';
import { contestQuestion, choicesFrom, gradeOf, type ContestGameMeta, type ContestKind, type ContestSpec, type KindGrades } from '../contest/common';
import type { ContestVisual } from '../contest/visuals';
import { lab } from '../label';

/**
 * Multi-step % (Contest Path): percent stories in steps. Out of 100 (Grades 3 and 5), then Grade 5 chains: a discount
 * then a tariff, two cuts in a row, a percent of a percent, and up then down.
 * Difficulty 1–2 = Grade 1, 3–4 = Grade 3, 5–6 = Grade 5 (see contest/common.ts). A kind asked at a difficulty outside
 * its grades plays at the nearest difficulty it supports (there is no Grade 1 percent).
 *
 * Every amount is worked in hundredths (cents for money), so each step is exact: results are whole numbers, or money to
 * the cent. The picture (pctsteps) never shows the answer: amounts after the steps are "?" (or, for a "what percent"
 * question, the percent is "?"); the finished picture is the solutionVisual.
 */
export type PctMultiKind = 'all' | 'outof100' | 'discounttax' | 'twosteps' | 'pctofpct' | 'updown';
type Kind = Exclude<PctMultiKind, 'all'>;
type PctV = Extract<ContestVisual, { type: 'pctsteps' }>;
type Step = PctV['steps'][number];

export const PCTMULTI_META: ContestGameMeta = {
  id: 'pctmulti', label: 'Multi-step %', icon: 'coins', topic: 'Multi-step percent', skill: 'pctmulti',
  blurb: 'Percent stories in steps: out of 100, a discount then a tariff, a percent of a percent, up then down, what is left.',
  intro: 'Percent means out of 100: 37% is 37 out of every 100, so 25% of 100 coins is 25 coins. When a story has steps, each percent is a percent OF the amount in front of it: take the discount first, then the tariff is a percent of the sale price. That is why 25% off and then a 10% tariff is not the same as 15% off, and why up 10% then down 10% does not land back at the start. Draw one bar per step and work down the bars.',
  tree: { x: 5, y: 6 }, prereq: { skillId: 'frac', mastery: 30 },
};

export const PCTMULTI_KINDS: ContestKind[] = [
  { id: 'all', label: 'Mixed', short: 'Mixed', desc: 'Percent stories in steps: out of 100, a discount then a tariff, a percent of a percent, up then down, what is left.' },
  { id: 'outof100', label: 'Out of 100', short: 'Out of 100', desc: 'Percent means out of 100: 30 out of 100 is 30%.' },
  { id: 'discounttax', label: 'Discount then tariff', short: 'Discount + tariff', desc: 'Take the discount first, then add the tariff on the new price.' },
  { id: 'twosteps', label: 'Two cuts in a row', short: 'Two cuts', desc: 'The second percent is of what is left, not of the start.' },
  { id: 'pctofpct', label: 'Percent of a percent', short: '% of %', desc: 'Half of 40% is 20%: a percent of a part is a smaller part of the whole.' },
  { id: 'updown', label: 'Up then down', short: 'Up and down', desc: 'Up 10% then down 10% does not get back to the start.' },
];
/** Which grades each kind suits. */
export const PCTMULTI_KIND_GRADES: KindGrades = { outof100: ['g3', 'g5'], discounttax: ['g5'], twosteps: ['g5'], pctofpct: ['g5'], updown: ['g5'] };
/** The difficulties each kind is written for; other difficulties play at the nearest one. */
const BAND: Record<Kind, [number, number]> = { outof100: [3, 6], discounttax: [5, 6], twosteps: [5, 6], pctofpct: [5, 6], updown: [5, 6] };
const KIND_IDS: Kind[] = ['outof100', 'discounttax', 'twosteps', 'pctofpct', 'updown'];

const APP = 'Shops, ports and engineers chain percents every day: a discount then a tax, a load then a toll. Each percent is of the amount in front of it.';

/* ------------------------------------------------------------------ */
/* Exact amounts (hundredths) and how they are written                  */
/* ------------------------------------------------------------------ */

/** Amounts are integers in hundredths: 8000 = 80 coins or $80.00. */
const C = 100;
/** The amount after one step, in hundredths, or null when it is not a whole number of hundredths. */
function stepAfter(c: number, s: Step): number | null {
  const part = (c * s.pct) / 100;
  if (!Number.isInteger(part)) return null;
  return s.kind === 'off' ? c - part : s.kind === 'on' ? c + part : part;
}
/** Start and the amount after each step, in hundredths (null if a step is not exact). */
function chain(start: number, steps: Step[]): number[] | null {
  const out = [start];
  for (const s of steps) { const n = stepAfter(out[out.length - 1], s); if (n === null) return null; out.push(n); }
  return out;
}
const isWhole = (c: number) => c % C === 0;
type Fmt = (c: number) => string;
const money: Fmt = (c) => (c % C === 0 ? `$${c / C}` : `$${(c / C).toFixed(2)}`);
const plain: Fmt = (c) => String(c / C);
const pcts: Fmt = (c) => `${c / C}%`;
const fmtOf = (unit: string): Fmt => (unit === '$' ? money : unit.startsWith('%') ? pcts : plain);
/** The value a player types or taps for an amount in hundredths. */
const val = (c: number) => c / C;
const pc = (p: number) => `${p}%`;

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const NAMED: Record<number, string> = { 50: 'half', 25: 'a quarter', 75: 'three quarters', 20: 'a fifth', 10: 'a tenth' };
/**
 * One worked line for "p% of base", by the friendliest route: a named fraction (a quarter), tenths, tenths and a half,
 * or hundredths. Every number carries its label: "25% (discount) is a quarter, so a quarter of 80 (starting price) is 20 (coins off)."
 */
function pctOfLine(p: number, pLab: string, base: number, baseLab: string, out: number, outLab: string, f: Fmt): string {
  const P = lab(pc(p), pLab), B = lab(f(base), baseLab), O = lab(f(out), outLab);
  if (NAMED[p]) return `${P} is ${NAMED[p]}, so ${NAMED[p]} of ${B} is ${O}.`;
  if (p % 10 === 0 && p < 100 && base % 10 === 0) return `10% of ${B} is ${lab(f(base / 10), 'one tenth')}, so ${P} is ${WORDS[p / 10]} tenths: ${O}.`;
  if (p % 10 === 5 && base % 20 === 0) {
    const t = base / 10;
    if (p === 5) return `10% of ${B} is ${lab(f(t), 'one tenth')}, so ${P} is half of that: ${O}.`;
    return `10% of ${B} is ${lab(f(t), 'one tenth')} and 5% is ${lab(f(t / 2), 'half a tenth')}, so ${P} is ${WORDS[(p - 5) / 10]} and a half tenths: ${O}.`;
  }
  if (p <= 20 && base % 100 === 0) return `1% of ${B} is ${lab(f(base / 100), 'one hundredth')}, so ${P} is ${WORDS[p]} hundredths: ${O}.`;
  return `${P} of ${B} = ${O}.`;
}
/** Words for the speaker button: "$80" → "80 dollars", "25%" → "25 percent", "3/4" → "3 out of 4". */
const spoken = (s: string) => s.replace(/\$(\d+(?:\.\d+)?)/g, '$1 dollars').replace(/(\d+)\/(\d+)/g, '$1 out of $2').replace(/%/g, ' percent').replace(/\s+/g, ' ').trim();
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const article = (w: string) => (/^[aeiou]/.test(w) || /^(8|11%|18%|11$|18$)/.test(w) ? 'an' : 'a');
const sign = (s: 'up' | 'down') => (s === 'up' ? '+' : '−');

const coinsLabel = (x: number) => `${x} coins`;
/**
 * Tap options: the right value, then real mistakes (in the order given), then near misses `pad` apart; all different,
 * all above `min` (0) and at most `max`, at most 2 decimals (whole numbers only with `int`), shown smallest first.
 */
function pickChoices(right: number, wrong: number[], n: number, label: (v: number) => string, o: { pad?: number; min?: number; max?: number; int?: boolean } = {}): QuestionChoice[] {
  const min = o.min ?? 0, max = o.max ?? Infinity, pad = o.pad ?? 1;
  const ok = (w: number) => Number.isFinite(w) && w > min && w <= max && (o.int ? Number.isInteger(w) : Math.abs(Math.round(w * 100) - w * 100) < 1e-6);
  const vals = [right];
  const add = (w0: number) => { const w = Math.round(w0 * 100) / 100; if (vals.length < n && ok(w) && !vals.some((v) => Math.abs(v - w) < 1e-9)) vals.push(w); };
  wrong.forEach(add);
  for (let k = 1; vals.length < n && k < 80; k++) { add(right + k * pad); add(right - k * pad); }
  // "1200 coins" wraps in a phone-width button: with a 4-digit option the buttons show bare numbers (the unit is in the story)
  const lbl = label === coinsLabel && vals.some((v) => v >= 1000) ? String : label;
  return choicesFrom(vals.sort((a, b) => a - b), lbl);
}
const vis = (start: number, unit: string, steps: Step[], extra: Partial<PctV> = {}): PctV => ({ type: 'pctsteps', start, unit, steps, ...extra });
/** Grade 5 contest style is five options; a d6 amount question is sometimes typed instead. */
const typedAt = (d: number, rng: Rng) => d >= 6 && rng.chance(0.35);
const moneyLabel = (x: number) => money(Math.round(x * C));

type Spec = Omit<ContestSpec, 'difficulty'>;

/* ------------------------------------------------------------------ */
/* Out of 100 (Grades 3, 5)                                             */
/* ------------------------------------------------------------------ */

const GRID_THINGS = [{ unit: 'squares', color: 'blue' }, { unit: 'tiles', color: 'green' }, { unit: 'seats', color: 'red' }, { unit: 'stickers', color: 'gold' }, { unit: 'squares', color: 'purple' }];
const BAG_THINGS = [
  { box: 'bag', unit: 'marbles', what: 'red' }, { box: 'chest', unit: 'coins', what: 'gold' }, { box: 'jar', unit: 'beads', what: 'blue' },
  { box: 'crate', unit: 'apples', what: 'green' }, { box: 'box', unit: 'pencils', what: 'yellow' }, { box: 'tray', unit: 'cookies', what: 'iced' },
];
const NAMES = ['Mia', 'Leo', 'Ava', 'Sam', 'Zoe', 'Kai', 'Ivy', 'Max', 'Nia', 'Ben'];
/** short: the picture's tag and the percent's label; part: the label for the count. */
const OF_THINGS = [
  { whole: 'tickets', verb: 'were sold online', short: 'online', part: 'tickets sold online', one: 'ticket sold online' }, { whole: 'robots', verb: 'passed the test', short: 'passed', part: 'robots that passed', one: 'robot that passed' },
  { whole: 'seats', verb: 'are taken', short: 'taken', part: 'seats taken', one: 'seat taken' }, { whole: 'students', verb: 'walk to school', short: 'walking', part: 'students who walk', one: 'student who walks' },
  { whole: 'crates', verb: 'hold apples', short: 'with apples', part: 'crates of apples', one: 'crate of apples' }, { whole: 'plants', verb: 'have flowers', short: 'flowering', part: 'plants in flower', one: 'plant in flower' },
];

/** "37 of the 100 squares are blue. What percent are blue?" A hundred grid; the percent is the "?". */
function whatPct(d: number, rng: Rng): Spec {
  const t = rng.pick(GRID_THINGS);
  let n = d <= 3 ? rng.int(1, 19) * 5 : rng.int(3, 97);
  if (n === 50) n = d <= 3 ? 45 : 53;
  const v = vis(100, t.unit, [{ label: t.color, pct: n, kind: 'take' }], { ask: 'pct', grid: true });
  const prompt = `${n} of the 100 ${t.unit} are ${t.color}. What percent are ${t.color}?`;
  return {
    prompt, expression: `?% = ${n} out of 100`, answer: n, answerText: pc(n), visual: v, solutionVisual: { ...v, reveal: true },
    hint: `Percent means "out of 100". The grid has exactly 100 ${t.unit}.`,
    steps: [
      `Percent means out of 100, and the grid has ${lab(100, `${t.unit} in all`)}.`,
      `${lab(n, `${t.color} ${t.unit}`)} out of ${lab(100, `${t.unit} in all`)} = ${lab(pc(n), t.color)}.`,
    ],
    choices: d <= 3 ? pickChoices(n, [100 - n, n + 10, n - 10, n + 1], 4, pc, { max: 99, int: true }) : undefined,
    readAloud: spoken(prompt),
  };
}
/** "A bag has 100 marbles. 25% of them are red. How many are red?" */
function pctOf100(d: number, rng: Rng): Spec {
  const t = rng.pick(BAG_THINGS);
  const p = d <= 3 ? rng.pick([10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90]) : rng.int(3, 97);
  const v = vis(100, t.unit, [{ label: t.what, pct: p, kind: 'take' }]);
  const prompt = `A ${t.box} has 100 ${t.unit}. ${p}% of them are ${t.what}. How many are ${t.what}?`;
  return {
    prompt, expression: `${p}% of 100 = ?`, answer: p, unit: t.unit, visual: v, solutionVisual: { ...v, reveal: true },
    hint: `Percent means "out of 100". This ${t.box} holds exactly 100 ${t.unit}.`,
    steps: [
      `Percent means out of every hundred, and the ${t.box} holds exactly ${lab(100, t.unit)}.`,
      `So ${lab(pc(p), t.what)} of ${lab(100, t.unit)} = ${lab(p, `${t.what} ${t.unit}`)}.`,
    ],
    choices: d <= 3 ? pickChoices(p, [100 - p, 100 / p, p + 10, p - 10], 4, String, { max: 100, int: true }) : undefined,
    readAloud: spoken(prompt),
  };
}
/** Tap labels name the grid, never its count (a count would let a child match digits without reading a grid). */
const GRID_NAMES = ['Grid A', 'Grid B', 'Grid C'];
/** "Tap the grid that is 30% blue." Three hundred grids to choose from (30, 3 and 70 squares blue). */
function pickGrid(_d: number, rng: Rng): Spec {
  const p = rng.pick([10, 20, 30, 40, 60, 70, 80, 90]);
  const col = rng.pick(GRID_THINGS).color;
  const counts = rng.shuffle([p, p / 10, 100 - p]);
  const grid = (n: number): PctV => vis(100, 'squares', [{ label: col, pct: n, kind: 'take' }], { grid: true, reveal: true });
  const choices: QuestionChoice[] = counts.map((n, i) => ({ value: i + 1, label: GRID_NAMES[i], visual: grid(n) }));
  const prompt = `Tap the grid that is ${p}% ${col}.`;
  const few = p / 10; const at = counts.indexOf(p);
  return {
    prompt, expression: `${p}% of 100 squares`, answer: at + 1, answerText: `${GRID_NAMES[at]}: ${p} of 100 squares ${col}`, visual: vis(100, 'squares', [], { grid: true }), solutionVisual: grid(p),
    hint: 'Each grid has 100 squares. Percent means out of 100.',
    steps: [
      `Each grid has ${lab(100, 'squares')}, and percent means out of 100.`,
      `${lab(pc(p), col)} of ${lab(100, 'squares')} = ${lab(p, `${col} squares`)}.`,
      `The grid with ${lab(few, few === 1 ? `${col} square` : `${col} squares`)} shows only ${lab(pc(few), col)}. The one with ${lab(100 - p, `${col} squares`)} shows ${lab(pc(100 - p), col)}.`,
    ],
    choices, readAloud: spoken(prompt),
  };
}
/** "60 of the 100 tiles are green. What percent are NOT green?" */
function notPct(_d: number, rng: Rng): Spec {
  const t = rng.pick(GRID_THINGS);
  let n = rng.int(4, 96); if (n === 50) n = 62;
  const v = vis(100, t.unit, [{ label: `not ${t.color}`, pct: 100 - n, kind: 'off' }], { ask: 'pct', grid: true });
  const prompt = `${n} of the 100 ${t.unit} are ${t.color}. What percent are NOT ${t.color}?`;
  return {
    prompt, expression: `?% = 100% − ${n}%`, answer: 100 - n, answerText: pc(100 - n), visual: v, solutionVisual: { ...v, reveal: true },
    hint: `All 100 ${t.unit} make 100%. How many are left when the ${t.color} ones are taken out?`,
    steps: [
      `All ${lab(100, t.unit)} make ${lab('100%', 'the whole grid')}.`,
      `${lab(100, t.unit)} − ${lab(n, `${t.color} ${t.unit}`)} = ${lab(100 - n, `${t.unit} not ${t.color}`)}.`,
      `${lab(100 - n, `${t.unit} not ${t.color}`)} out of ${lab(100, `${t.unit} in all`)} = ${lab(pc(100 - n), `not ${t.color}`)}.`,
    ],
    readAloud: spoken(prompt),
  };
}
/** "A dollar is 100 cents. Mia has 45 cents. What percent of a dollar is that?" */
function cents(_d: number, rng: Rng): Spec {
  const name = rng.pick(NAMES); let n = rng.int(5, 95); if (n === 50) n = 55;
  const v = vis(100, 'cents', [{ label: `${name} has`, pct: n, kind: 'take' }], { ask: 'pct' });
  const prompt = `A dollar is 100 cents. ${name} has ${n} cents. What percent of a dollar is that?`;
  return {
    prompt, expression: `?% = ${n} out of 100`, answer: n, answerText: pc(n), visual: v, solutionVisual: { ...v, reveal: true },
    hint: 'A whole dollar is 100 cents, and percent means out of 100.',
    steps: [
      `A whole dollar is ${lab(100, 'cents')}, so it is ${lab('100%', 'one dollar')}.`,
      `${lab(n, 'cents')} out of ${lab(100, 'cents')} = ${lab(pc(n), 'of a dollar')}.`,
    ],
    readAloud: spoken(prompt),
  };
}
/** d5: n of dn equal parts shaded (dn = 2, 4, 5, 10 or 20); d6: a fraction in twentieths, twenty-fifths or friendly ones. */
const FRACS5: [number, number][] = [2, 4, 5, 10, 20].flatMap((dn) => Array.from({ length: dn - 1 }, (_, i): [number, number] => [i + 1, dn]));
const FRACS6: [number, number][] = [[1, 20], [3, 20], [7, 20], [9, 20], [11, 20], [13, 20], [17, 20], [19, 20], [1, 25], [2, 25], [3, 25], [4, 25], [6, 25], [7, 25], [8, 25], [9, 25], [11, 25], [12, 25], [3, 4], [2, 5], [4, 5]];
/** "3 of 4 equal parts are shaded: what percent?" A bar cut into equal parts; the percent is the "?". */
function fracPct(d: number, rng: Rng): Spec | null {
  const [n, dn] = rng.pick(d <= 5 ? FRACS5 : FRACS6);
  const P = (n * 100) / dn; const each = 100 / dn;
  // an answer the prompt already prints ("1 of 10 parts" is 10%, "4 of 20 parts" is 20%) could be copied: draw again
  if (P === dn || P === n) return null;
  const v = vis(dn, 'parts', [{ label: 'shaded', pct: P, kind: 'take' }], { ask: 'pct' });
  const prompt = d <= 5
    ? `A bar is cut into ${dn} equal parts, and ${n} of them ${n === 1 ? 'is' : 'are'} shaded. What percent of the bar is shaded?`
    : `The bar shows ${n}/${dn} shaded. What is ${n}/${dn} as a percent?`;
  return {
    prompt, expression: `?% = ${n}/${dn}`, answer: P, answerText: pc(P), visual: v, solutionVisual: { ...v, reveal: true },
    hint: `Make the bottom 100. How many hundredths is each of the ${dn} parts worth?`,
    steps: [
      `Make the bottom 100: ${lab(100, 'hundredths in the whole')} ÷ ${lab(dn, 'equal parts')} = ${lab(each, 'hundredths in each part')}.`,
      `${lab(n, n === 1 ? 'shaded part' : 'shaded parts')} × ${lab(each, 'hundredths in each part')} = ${lab(P, 'hundredths shaded')}.`,
      `So ${lab(`${n}/${dn}`, 'shaded share')} = ${P}/100 = ${lab(pc(P), 'shaded')}.`,
    ],
    choices: pickChoices(P, [100 - P, Number(`${n}${dn}`) <= 100 ? Number(`${n}${dn}`) : NaN, n * 10, P / 10, dn], 5, pc, { pad: 5, max: 1000 }),
    readAloud: spoken(prompt),
  };
}
const HUNDREDTHS = [5, 8, 12, 15, 24, 35, 45, 62, 85, 7, 36, 55, 4, 6, 9, 14, 18, 22, 28, 32, 48, 64, 72, 95];
/** "0.7 of the bar is shaded: what percent?" Tenths on a bar (d5), hundredths on a grid (d5 and d6). */
function decPct(d: number, rng: Rng): Spec {
  if (d <= 5 && rng.chance(0.6)) {
    // not 0.1: "10 equal parts" would print the answer 10
    const t = rng.int(2, 9); const P = t * 10; const dec = `0.${t}`;
    const parts = t === 1 ? 'shaded part' : 'shaded parts';
    const v = vis(10, 'tenths', [{ label: 'shaded', pct: P, kind: 'take' }], { ask: 'pct' });
    const prompt = `This bar is cut into 10 equal parts, and ${dec} of it is shaded. What percent of the bar is shaded?`;
    return {
      prompt, expression: `?% = ${dec}`, answer: P, answerText: pc(P), visual: v, solutionVisual: { ...v, reveal: true },
      hint: 'Each tenth of the bar is 10 out of every 100.',
      steps: [
        `${lab(dec, 'shaded share')} means ${WORDS[t]} ${t === 1 ? 'tenth' : 'tenths'}: ${lab(t, parts)} of ${lab(10, 'equal parts')}.`,
        `Each part is ${lab('10%', 'one tenth')}, so ${lab(t, parts)} × ${lab('10%', 'each part')} = ${lab(pc(P), 'shaded')}.`,
      ],
      choices: pickChoices(P, [t, 100 - P, P * 10, t / 10], 5, pc, { pad: 5, max: 1000 }),
      readAloud: spoken(prompt),
    };
  }
  const h = rng.pick(HUNDREDTHS); const dec = (h / 100).toFixed(2);
  const v = vis(100, 'squares', [{ label: 'shaded', pct: h, kind: 'take' }], { ask: 'pct', grid: true });
  const prompt = `The grid has 100 equal squares, and ${dec} of it is shaded. What is ${dec} as a percent?`;
  return {
    prompt, expression: `?% = ${dec}`, answer: h, answerText: pc(h), visual: v, solutionVisual: { ...v, reveal: true },
    hint: 'The second place after the point counts hundredths. Percent means hundredths.',
    steps: [
      `${lab(dec, 'shaded share')} means ${lab(h, 'hundredths')}: ${lab(h, 'shaded squares')} of ${lab(100, 'squares')}.`,
      `Percent means out of 100, so ${lab(h, 'shaded squares')} out of ${lab(100, 'squares')} = ${lab(pc(h), 'shaded')}.`,
    ],
    choices: pickChoices(h, [h / 10, h * 10, 100 - h, h / 100], 5, pc, { pad: 5, max: 1000 }),
    readAloud: spoken(prompt),
  };
}
const HUNDREDS = ['', 'one hundred', 'two hundreds', 'three hundreds', 'four hundreds', 'five hundreds', 'six hundreds', 'seven hundreds', 'eight hundreds'];
const TIMES = ['', 'once', 'twice', 'three times', 'four times', 'five times', 'six times', 'seven times', 'eight times'];
/** "There are 200 tickets. 35% of them were sold online. How many?" Percent of 200, 50 or 20 (d5) or other bases (d6). */
function pctOfBase(d: number, rng: Rng): Spec | null {
  const t = rng.pick(OF_THINGS);
  const base = d <= 5 ? rng.pick([200, 50, 20]) : rng.pick([40, 60, 80, 120, 150, 250, 300, 400, 500, 600, 800]);
  const p = d <= 5 ? rng.pick(base === 200 ? [5, 10, 15, 20, 25, 30, 35, 40, 45, 60, 70, 75, 80, 90] : base === 50 ? [10, 14, 18, 20, 24, 30, 36, 40, 60, 70, 80, 90] : [5, 10, 15, 25, 35, 45, 55, 60, 75, 85, 95])
    : rng.pick([5, 6, 8, 12, 15, 24, 35, 36, 45, 65, 85]);
  const ans = (base * p) / 100;
  if (!Number.isInteger(ans) || ans === p) return null;
  const v = vis(base, t.whole, [{ label: t.short, pct: p, kind: 'take' }]);
  const prompt = `There are ${base} ${t.whole}. ${p}% of them ${t.verb}. How many ${t.whole} ${t.verb}?`;
  const all = `${t.whole} in all`, part = ans === 1 ? t.one : t.part;
  const another = base === 50 ? `is half of a hundred, so take half of ${lab(p, 'out of every hundred')}`
    : base === 20 ? `is a fifth of a hundred, so take a fifth of ${lab(p, 'out of every hundred')}`
      : base % 100 === 0 ? `is ${HUNDREDS[base / 100]}, so take ${lab(p, 'out of every hundred')} ${TIMES[base / 100]}` : '';
  const typed = typedAt(d, rng);
  return {
    prompt, expression: `${p}% of ${base} = ?`, answer: ans, unit: ans === 1 ? t.whole.replace(/s$/, '') : t.whole, visual: v, solutionVisual: { ...v, reveal: true },
    hint: 'Find 10% or 1% of the whole first, then build up to the percent you need.',
    steps: [
      pctOfLine(p, t.short, base * C, all, ans * C, part, plain),
      ...(another ? [`Another way: percent means out of every hundred, and ${lab(base, all)} ${another}: ${lab(ans, part)}.`] : []),
    ],
    choices: typed ? undefined : pickChoices(ans, [p, base - ans, ans * 10, ans / 10, base / p], 5, String, { pad: Math.max(1, Math.round(ans / 10)), int: true }),
    readAloud: spoken(prompt),
  };
}
/** "20 of the 50 tickets were sold online. What percent of the tickets is that?" (d6) */
function whatPctOf(_d: number, rng: Rng): Spec | null {
  const t = rng.pick(OF_THINGS);
  const base = rng.pick([20, 25, 40, 50, 200, 300, 400, 500]);
  const p = rng.pick([5, 10, 15, 20, 30, 35, 40, 45, 60, 70, 75, 80, 90]);
  const part = (base * p) / 100;
  // a count of 1 would read "1 of the 20 plants have flowers"; an answer the prompt prints ("4 of the 20" is 20%) could be copied
  if (!Number.isInteger(part) || part < 2 || part === p || p === base || !Number.isInteger(base < 100 ? 100 / base : base / 100)) return null;
  const v = vis(base, t.whole, [{ label: t.short, pct: p, kind: 'take' }], { ask: 'pct' });
  const prompt = `${part} of the ${base} ${t.whole} ${t.verb}. What percent of the ${t.whole} is that?`;
  const scale = base < 100 ? `multiply the top and the bottom by ${100 / base}` : `divide the top and the bottom by ${base / 100}`;
  return {
    prompt, expression: `?% = ${part} out of ${base}`, answer: p, answerText: pc(p), visual: v, solutionVisual: { ...v, reveal: true },
    hint: 'Write it as a fraction, then make the bottom 100.',
    steps: [
      `As a fraction: ${lab(part, t.part)} out of ${lab(base, `${t.whole} in all`)} is ${part}/${base}.`,
      `Make the bottom 100, so ${scale}: ${part}/${base} = ${p}/100.`,
      `So it is ${lab(pc(p), t.short)}.`,
    ],
    choices: pickChoices(p, [part, 100 - p, p * 2, p / 2, p + 10], 5, pc, { pad: 5, max: 100, int: true }),
    readAloud: spoken(prompt),
  };
}
function outOf100(d: number, rng: Rng): Spec | null {
  const sub = d <= 3 ? rng.pick(['what', 'of', 'pick'] as const)
    : d === 4 ? rng.pick(['what', 'of', 'not', 'cents'] as const)
      : d === 5 ? rng.pick(['frac', 'dec', 'base', 'base'] as const) : rng.pick(['frac', 'dec', 'base', 'whatof'] as const);
  switch (sub) {
    case 'what': return whatPct(d, rng);
    case 'of': return pctOf100(d, rng);
    case 'pick': return pickGrid(d, rng);
    case 'not': return notPct(d, rng);
    case 'cents': return cents(d, rng);
    case 'frac': return fracPct(d, rng);
    case 'dec': return decPct(d, rng);
    case 'base': return pctOfBase(d, rng);
    case 'whatof': return whatPctOf(d, rng);
  }
}

/* ------------------------------------------------------------------ */
/* Discount, then tariff (Grade 5)                                      */
/* ------------------------------------------------------------------ */

const ITEMS = ['cloak', 'lantern', 'telescope', 'toolkit', 'compass', 'helmet', 'kite', 'backpack', 'drone kit', 'chess set'];

function discountTax(d: number, rng: Rng): Spec | null {
  const dollars = d >= 6;
  const unit = dollars ? '$' : 'coins'; const f = fmtOf(unit);
  const P = (dollars ? rng.pick([24, 36, 45, 48, 64, 72, 85, 96, 120, 150, 180, 240]) : rng.pick([40, 60, 80, 120, 160, 200, 240, 50, 150, 250, 300])) * C;
  const dp = dollars ? rng.pick([15, 20, 25, 30, 35, 40]) : rng.pick([10, 20, 25, 50]);
  const tp = dollars ? rng.pick([5, 6, 8, 10, 12, 15]) : rng.pick([5, 10, 20, 25]);
  const steps: Step[] = [{ label: 'sale', pct: dp, kind: 'off' }, { label: 'tariff', pct: tp, kind: 'on' }];
  const am = chain(P, steps); if (!am) return null;
  const [, S, F] = am; const off = P - S, tar = F - S;
  if ((!dollars && !(isWhole(S) && isWhole(F))) || F === P) return null;
  const item = rng.pick(ITEMS);
  const prompt = dollars
    ? `${cap(article(item))} ${item} costs ${money(P)}. It is on sale for ${dp}% off. Then ${article(pc(tp))} ${tp}% tariff is charged on the sale price. How much do you pay?`
    : `${cap(article(item))} ${item} costs ${plain(P)} coins. The shop takes ${dp}% off. Then ${article(pc(tp))} ${tp}% tariff is added to the sale price. What is the final price?`;
  const L = dollars
    ? { start: 'starting price', off: 'off', sale: 'sale price', tar: 'tariff', fin: 'to pay', net: 'price' }
    : { start: 'starting price', off: 'coins off', sale: 'sale price', tar: 'coins of tariff', fin: 'coins to pay', net: 'coins' };
  const net = tp - dp; const netC = (P * (100 + net)) / 100;
  const lines = [
    `Sale: ${pctOfLine(dp, 'discount', P, L.start, off, L.off, f)}`,
    `Sale price: ${lab(f(P), L.start)} − ${lab(f(off), L.off)} = ${lab(f(S), L.sale)}.`,
    `Tariff: ${pctOfLine(tp, 'tariff', S, L.sale, tar, L.tar, f)}`,
    `Final price: ${lab(f(S), L.sale)} + ${lab(f(tar), L.tar)} = ${lab(f(F), L.fin)}.`,
  ];
  if (Number.isInteger(netC) && (dollars || isWhole(netC)) && net !== 0) lines.push(`Careful: it is not the same as ${net < 0 ? `${-net}% off` : `a ${net}% rise`}, which would give ${lab(f(netC), L.net)}.`);
  const v = vis(P / C, unit, steps);
  const typed = typedAt(d, rng);
  return {
    prompt, expression: `${f(P)} − ${dp}%, then + ${tp}% = ?`, answer: val(F), unit: dollars ? undefined : 'coins', answerText: dollars ? money(F) : undefined,
    visual: v, solutionVisual: { ...v, reveal: true },
    hint: 'Take the discount off first. The tariff is a percent of the sale price, not of the starting price.',
    steps: lines,
    choices: typed ? undefined : pickChoices(val(F), [val(netC), val(S), val((P * (100 + tp)) / 100), val(S - tar), dollars ? NaN : val(P) - dp + tp], 5, dollars ? moneyLabel : coinsLabel, { pad: dollars ? 1 : 2, int: !dollars }),
    readAloud: spoken(prompt),
  };
}

/* ------------------------------------------------------------------ */
/* Two cuts in a row (Grade 5)                                          */
/* ------------------------------------------------------------------ */

const LOADS = [
  { ship: 'A ship', load: 'crates', short: 'crates', first: 'the first port', second: 'the second port', l1: 'port one', l2: 'port two', where: 'reach home' },
  { ship: 'A wagon', load: 'sacks of grain', short: 'sacks', first: 'the first bridge', second: 'the second bridge', l1: 'bridge one', l2: 'bridge two', where: 'reach the market' },
  { ship: 'A train', load: 'barrels', short: 'barrels', first: 'the first station', second: 'the second station', l1: 'station one', l2: 'station two', where: 'reach the city' },
  { ship: 'A truck', load: 'boxes', short: 'boxes', first: 'the first gate', second: 'the second gate', l1: 'gate one', l2: 'gate two', where: 'reach the depot' },
  { ship: 'A caravan', load: 'bales of cloth', short: 'bales', first: 'the first oasis', second: 'the second oasis', l1: 'oasis one', l2: 'oasis two', where: 'reach the coast' },
];
/** Two cuts whose single cut is a whole percent (p1 × p2 is a whole number of hundreds). */
const PAIRS: [number, number][] = [10, 15, 20, 25, 30, 40, 50, 60].flatMap((a) => [10, 15, 20, 25, 30, 40, 50].filter((b) => a + b < 100 && (a * b) % 100 === 0).map((b): [number, number] => [a, b]));

/** "20% off, then 10% off the new price: what single percent off is that?" Pretend the price is 100. */
function singleCut(rng: Rng): Spec {
  const [p1, p2] = rng.pick(PAIRS);
  const steps: Step[] = [{ label: 'first cut', pct: p1, kind: 'off' }, { label: 'second cut', pct: p2, kind: 'off' }];
  const [S0, S1, S2] = chain(100 * C, steps)!; const total = (S0 - S2) / C;
  const prompt = `A store takes ${p1}% off a price. Then it takes ${p2}% off the new price. What single percent off would give the same final price?`;
  const v = vis(100, '%', steps);
  return {
    prompt, expression: `?% off = −${p1}%, then −${p2}%`, answer: total, answerText: pc(total), visual: v, solutionVisual: { ...v, reveal: true },
    hint: 'Pretend the price is 100. Take both cuts, then see how much came off in all.',
    steps: [
      `Pretend the price is ${lab('100%', 'start')}.`,
      `First cut: ${pctOfLine(p1, 'first cut', S0, 'start', S0 - S1, 'off', pcts)} ${lab(pcts(S0), 'start')} − ${lab(pcts(S0 - S1), 'off')} = ${lab(pcts(S1), 'left')}.`,
      `Second cut: ${pctOfLine(p2, 'second cut', S1, 'left', S1 - S2, 'off', pcts)} ${lab(pcts(S1), 'left')} − ${lab(pcts(S1 - S2), 'off')} = ${lab(pcts(S2), 'left at the end')}.`,
      `In all: ${lab('100%', 'start')} − ${lab(pcts(S2), 'left at the end')} = ${lab(pc(total), 'off in all')}, not ${lab(pc(p1 + p2), 'added up')}.`,
    ],
    choices: pickChoices(total, [p1 + p2, S2 / C, (p1 * p2) / 100, Math.abs(p1 - p2), p1 + p2 + (p1 * p2) / 100], 5, pc, { max: 100 }),
    readAloud: spoken(prompt),
  };
}
/** "A kite costs 200 coins. It is 20% off, then another 10% off the sale price. How much do you pay?" */
function priceCuts(d: number, rng: Rng): Spec | null {
  const dollars = d >= 6; const unit = dollars ? '$' : 'coins'; const f = fmtOf(unit);
  const P = (dollars ? rng.pick([40, 60, 75, 80, 90, 120, 125, 150, 160, 180, 200, 240, 250]) : rng.pick([100, 200, 300, 400, 500, 600, 800, 1000, 120, 160, 240, 320, 360, 480])) * C;
  const p1 = rng.pick([10, 20, 25, 30, 40, 50]); const p2 = rng.pick([10, 20, 25, 30, 50]);
  if (p1 + p2 >= 100) return null;
  const steps: Step[] = [{ label: 'sale', pct: p1, kind: 'off' }, { label: 'extra', pct: p2, kind: 'off' }];
  const am = chain(P, steps); if (!am) return null;
  const [, S1, S2] = am; const o1 = P - S1, o2 = S1 - S2;
  if (!dollars && !(isWhole(S1) && isWhole(S2))) return null;
  const item = rng.pick(ITEMS);
  const prompt = `${cap(article(item))} ${item} costs ${dollars ? money(P) : `${plain(P)} coins`}. It is ${p1}% off. At the till, you get another ${p2}% off the sale price. How much do you pay?`;
  const off = dollars ? 'off' : 'coins off';
  const sumC = (P * (100 - p1 - p2)) / 100;
  const v = vis(P / C, unit, steps);
  const typed = typedAt(d, rng);
  return {
    prompt, expression: `${f(P)} − ${p1}%, then − ${p2}% = ?`, answer: val(S2), unit: dollars ? undefined : 'coins', answerText: dollars ? money(S2) : undefined,
    visual: v, solutionVisual: { ...v, reveal: true },
    hint: 'Work one cut at a time. The second percent is of the sale price, not of the starting price.',
    steps: [
      `First cut: ${pctOfLine(p1, 'sale', P, 'starting price', o1, off, f)}`,
      `Sale price: ${lab(f(P), 'starting price')} − ${lab(f(o1), off)} = ${lab(f(S1), 'sale price')}.`,
      `Second cut: ${pctOfLine(p2, 'extra cut', S1, 'sale price', o2, off, f)}`,
      `You pay: ${lab(f(S1), 'sale price')} − ${lab(f(o2), off)} = ${lab(f(S2), 'to pay')}.`,
      ...(Number.isInteger(sumC) ? [`Careful: it is not ${p1 + p2}% off, which would give ${lab(f(sumC), 'price')}.`] : []),
    ],
    choices: typed ? undefined : pickChoices(val(S2), [val(sumC), val(S1), val(P - S2), dollars ? NaN : val(P) - p1 - p2], 5, dollars ? moneyLabel : coinsLabel, { pad: dollars ? 1 : 2, int: !dollars }),
    readAloud: spoken(prompt),
  };
}
/** "A ship sets off with 500 crates. 20% are taken at the first port, then 10% of what is left at the second." */
function loadCuts(d: number, rng: Rng): Spec | null {
  const t = rng.pick(LOADS);
  const N = rng.pick([200, 300, 400, 500, 600, 700, 800, 900, 1000, 1200]) * C;
  const p1 = rng.pick([10, 20, 25, 30, 40, 50]); const p2 = rng.pick([10, 20, 25, 30, 50]);
  if (p1 + p2 >= 100) return null;
  const steps: Step[] = [{ label: t.l1, pct: p1, kind: 'off' }, { label: t.l2, pct: p2, kind: 'off' }];
  const am = chain(N, steps); if (!am) return null;
  const [, S1, S2] = am; if (!isWhole(S1) || !isWhole(S2)) return null;
  const o1 = N - S1, o2 = S1 - S2; const u = t.short;
  const prompt = `${t.ship} sets off with ${plain(N)} ${t.load}. At ${t.first}, ${p1}% of the ${u} are taken as a tariff. At ${t.second}, ${p2}% of the ${u} that are left are taken. How many ${u} ${t.where}?`;
  const sumC = (N * (100 - p1 - p2)) / 100;
  const v = vis(N / C, u, steps);
  const typed = typedAt(d, rng);
  return {
    prompt, expression: `${plain(N)} − ${p1}%, then − ${p2}% = ?`, answer: val(S2), unit: u, visual: v, solutionVisual: { ...v, reveal: true },
    hint: `The second tariff is a percent of the ${u} that are left, not of the ${u} at the start.`,
    steps: [
      `${cap(t.first)}: ${pctOfLine(p1, 'tariff', N, `${u} at the start`, o1, `${u} taken`, plain)}`,
      `Left: ${lab(plain(N), `${u} at the start`)} − ${lab(plain(o1), `${u} taken`)} = ${lab(plain(S1), `${u} left`)}.`,
      `${cap(t.second)}: ${pctOfLine(p2, 'tariff', S1, `${u} left`, o2, `${u} taken`, plain)}`,
      `Left at the end: ${lab(plain(S1), `${u} left`)} − ${lab(plain(o2), `${u} taken`)} = ${lab(plain(S2), `${u} left at the end`)}.`,
      `Careful: taking ${p1}% + ${p2}% = ${p1 + p2}% of the start would leave ${lab(plain(sumC), u)}, but the second tariff came from fewer ${u}.`,
    ],
    choices: typed ? undefined : pickChoices(val(S2), [val(sumC), val(S1), val(o1 + o2), val(N) - p1 - p2], 5, String, { pad: 10, int: true }),
    readAloud: spoken(prompt),
  };
}
function twoCuts(d: number, rng: Rng): Spec | null {
  const sub = d <= 5 ? rng.pick(['price', 'load'] as const) : rng.pick(['price', 'load', 'single'] as const);
  return sub === 'single' ? singleCut(rng) : sub === 'price' ? priceCuts(d, rng) : loadCuts(d, rng);
}

/* ------------------------------------------------------------------ */
/* Percent of a percent (Grade 5)                                       */
/* ------------------------------------------------------------------ */

/** all: the whole group; aVerb / aNoun: the first part; bVerb / bNot: the second part said of the first; tags for the picture and labels. */
const GROUPS = [
  { all: 'riders', aVerb: 'are kids', aNoun: 'kids', bVerb: 'wear red helmets', bNot: 'do not wear red helmets', bTag: 'red helmets', bNotTag: 'no red helmet', ask: 'kids in red helmets' },
  { all: 'robots', aVerb: 'have wheels', aNoun: 'wheeled robots', bVerb: 'are painted blue', bNot: 'are not blue', bTag: 'blue', bNotTag: 'not blue', ask: 'blue wheeled robots' },
  { all: 'students', aVerb: 'are in the band', aNoun: 'band students', bVerb: 'play drums', bNot: 'do not play drums', bTag: 'drums', bNotTag: 'no drums', ask: 'band students who play drums' },
  { all: 'marbles', aVerb: 'are glass', aNoun: 'glass marbles', bVerb: 'are blue', bNot: 'are not blue', bTag: 'blue', bNotTag: 'not blue', ask: 'blue glass marbles' },
  { all: 'trees', aVerb: 'are apple trees', aNoun: 'apple trees', bVerb: 'have fruit', bNot: 'have no fruit', bTag: 'with fruit', bNotTag: 'no fruit', ask: 'apple trees with fruit' },
];
const PP = [10, 20, 25, 30, 40, 50, 60, 75, 80];

/** "There are 200 riders. 40% are kids. 25% of the kids wear red helmets. How many kids in red helmets?" */
function pctOfPctCount(d: number, rng: Rng): Spec | null {
  const g = rng.pick(GROUPS); const p1 = rng.pick(PP); const p2 = rng.pick(PP);
  const N = rng.pick(d <= 5 ? [40, 50, 80, 100, 200, 300, 400, 500] : [120, 160, 240, 250, 360, 600, 800, 1000, 1200]) * C;
  const steps: Step[] = [{ label: g.aNoun, pct: p1, kind: 'take' }, { label: g.bTag, pct: p2, kind: 'take' }];
  const am = chain(N, steps); if (!am) return null;
  const [, A, B] = am; if (!isWhole(A) || !isWhole(B) || B < 2 * C) return null;
  // an answer equal to a percent in the story could be copied off the page
  if (val(B) === p1 || val(B) === p2) return null;
  const prompt = `There are ${plain(N)} ${g.all}. ${p1}% of them ${g.aVerb}. ${p2}% of the ${g.aNoun} ${g.bVerb}. How many ${g.ask} are there?`;
  const v = vis(N / C, g.all, steps);
  const typed = typedAt(d, rng);
  const oneStep = (N * p2) / 100;
  return {
    prompt, expression: `${p2}% of ${p1}% of ${plain(N)} = ?`, answer: val(B), unit: g.ask, visual: v, solutionVisual: { ...v, reveal: true },
    hint: `First find how many ${g.aNoun} there are. Then take the second percent of them, not of all the ${g.all}.`,
    steps: [
      `First: ${pctOfLine(p1, g.aNoun, N, `${g.all} in all`, A, g.aNoun, plain)}`,
      `Then: ${pctOfLine(p2, g.bTag, A, g.aNoun, B, g.ask, plain)}`,
      `Careful: ${lab(pc(p2), g.bTag)} of all ${lab(plain(N), g.all)} would be ${lab(plain(oneStep), g.all)}, but only the ${g.aNoun} count.`,
    ],
    choices: typed ? undefined : pickChoices(val(B), [val(A), val(oneStep), val((N * (p1 + p2)) / 100), val((N * Math.abs(p1 - p2)) / 100), val(B) * 10], 5, String, { pad: Math.max(1, Math.round(val(B) / 5)), int: true }),
    readAloud: spoken(prompt),
  };
}
/** "40% of the riders are kids. 25% of the kids wear red helmets. What percent of all the riders are kids in red helmets?" */
function pctOfPctSingle(rng: Rng, without: boolean): Spec | null {
  const g = rng.pick(GROUPS); const p1 = rng.pick(PP); const p2 = rng.pick(PP);
  const q2 = without ? 100 - p2 : p2;
  const R = (p1 * q2) / 100;
  // Never an answer the story prints (it could be copied instead of worked out).
  if (!Number.isInteger(R) || R === 0 || R === p1 || R === p2) return null;
  const tag = without ? g.bNotTag : g.bTag;
  const ask = without ? `${g.aNoun} that ${g.bNot}` : g.ask;
  // "do NOT": the picture takes the given part away (−p2% of the first part); the part left over is the "?" to find
  const steps: Step[] = [{ label: g.aNoun, pct: p1, kind: 'take' }, without ? { label: g.bTag, pct: p2, kind: 'off' } : { label: g.bTag, pct: p2, kind: 'take' }];
  const prompt = `${p1}% of the ${g.all} ${g.aVerb}. ${p2}% of the ${g.aNoun} ${g.bVerb}. What percent of all the ${g.all} are ${ask}?`;
  const v = vis(100, '%', steps);
  return {
    prompt, expression: without ? `${p1}%, then −${p2}% of those = ?` : `${p2}% of ${p1}% = ?`, answer: R, answerText: pc(R), visual: v, solutionVisual: { ...v, reveal: true },
    hint: without ? `Pretend there are 100 ${g.all}. Find the ${g.aNoun} first. Then take away the ones that ${g.bVerb}.` : `Pretend there are 100 ${g.all}. Find the ${g.aNoun} first, then take the second percent of them.`,
    steps: [
      `Pretend there are ${lab(100, g.all)}, so each one is ${lab('1%', `one ${g.all.replace(/s$/, '')}`)}.`,
      `First: ${pctOfLine(p1, g.aNoun, 100 * C, g.all, p1 * C, g.aNoun, plain)}`,
      ...(without ? [`${lab(pc(p2), g.bTag)} of the ${g.aNoun} ${g.bVerb}, so ${lab('100%', 'all of them')} − ${lab(pc(p2), g.bTag)} = ${lab(pc(q2), tag)}.`] : []),
      `Then: ${pctOfLine(q2, tag, p1 * C, g.aNoun, R * C, ask, plain)}`,
      `So ${lab(R, `${R === 1 ? g.all.replace(/s$/, '') : g.all} out of every hundred`)} ${R === 1 ? 'is' : 'are'} ${ask}: ${lab(pc(R), 'of all')}. In one line: ${lab(pc(q2), tag)} of ${lab(pc(p1), g.aNoun)} = ${lab(pc(R), 'of all')}.`,
    ],
    choices: pickChoices(R, [p1 + q2, Math.abs(p1 - q2), q2, p1, without ? (p1 * p2) / 100 : 100 - R], 5, pc, { max: 100, int: true }),
    readAloud: spoken(prompt),
  };
}
function pctOfPct(d: number, rng: Rng): Spec | null {
  const sub = d <= 5 ? rng.pick(['count', 'count', 'single'] as const) : rng.pick(['count', 'single', 'without'] as const);
  return sub === 'count' ? pctOfPctCount(d, rng) : pctOfPctSingle(rng, sub === 'without');
}

/* ------------------------------------------------------------------ */
/* Up then down (Grade 5)                                               */
/* ------------------------------------------------------------------ */

const UPDOWN = [
  { what: 'A bike', thing: 'price', verb: 'costs', unit: '$' },
  { what: 'A bridge toll', thing: 'toll', verb: 'is', unit: 'coins' },
  { what: 'A board game', thing: 'price', verb: 'costs', unit: '$' },
  { what: 'A market stall', thing: 'rent', verb: 'pays a rent of', unit: 'coins' },
];

/** "A price goes up 20%, then the new price goes down 20%. Overall?" Pretend the start is 100. Signed answer: −4 = 4% lower. */
const CHANGE_THINGS = ['price', 'bus fare', 'bridge toll', 'shop rent', 'ticket price'];
function upDownChange(x: number, s1: 'up' | 'down', s2: 'up' | 'down', steps: Step[], rng: Rng): Spec {
  const [S0, S1, S2] = chain(100 * C, steps)!; const ch = (S2 - S0) / C;
  const th = rng.pick(CHANGE_THINGS); const newL = `new ${th}`;
  const prompt = `The ${th} goes ${s1} ${x}%. Then the new ${th} goes ${s2} ${x}%. Overall, how did the ${th} change?`;
  const v = vis(100, '%', steps);
  const name = (c: number) => (c === 0 ? 'No change' : c < 0 ? `${-c}% lower` : `${c}% higher`);
  const choices: QuestionChoice[] = [ch, 0, -ch, -x].filter((c, i, a) => a.indexOf(c) === i).sort((a, b) => a - b).map((c) => ({ value: c, label: name(c) }));
  const word = (s: 'up' | 'down') => (s === 'up' ? 'rise' : 'drop');
  const more = (s: 'up' | 'down') => (s === 'up' ? 'more' : 'less');
  return {
    prompt, expression: `${sign(s1)}${x}%, then ${sign(s2)}${x}% = ?`, answer: ch, answerText: name(ch), visual: v, solutionVisual: { ...v, reveal: true },
    hint: `Pretend the ${th} starts at 100. The second ${x}% is of the new ${th}, not of 100.`,
    steps: [
      `Pretend the ${th} is ${lab('100%', 'start')}.`,
      `${cap(s1)}: ${pctOfLine(x, word(s1), S0, 'start', Math.abs(S1 - S0), more(s1), pcts)} ${lab('100%', 'start')} ${sign(s1)} ${lab(pcts(Math.abs(S1 - S0)), more(s1))} = ${lab(pcts(S1), newL)}.`,
      `${cap(s2)}: ${pctOfLine(x, word(s2), S1, newL, Math.abs(S2 - S1), more(s2), pcts)} ${lab(pcts(S1), newL)} ${sign(s2)} ${lab(pcts(Math.abs(S2 - S1)), more(s2))} = ${lab(pcts(S2), 'at the end')}.`,
      `${lab('100%', 'start')} − ${lab(pcts(S2), 'at the end')} = ${lab(pc(-ch), 'lower')}. The ${word(s2)} was ${x}% of a ${s2 === 'down' ? 'bigger' : 'smaller'} amount, so the ${th} does not get back to the start.`,
    ],
    choices, readAloud: spoken(prompt),
  };
}
function upDown(d: number, rng: Rng): Spec | null {
  const sub = rng.pick(['amount', 'amount', 'change'] as const);
  const upFirst = rng.chance(d <= 5 ? 0.7 : 0.5);
  const x = rng.pick(d <= 5 ? [10, 20, 30, 40, 50] : [10, 20, 25, 30, 40, 50]);
  const s1: 'up' | 'down' = upFirst ? 'up' : 'down', s2: 'up' | 'down' = upFirst ? 'down' : 'up';
  const step = (s: 'up' | 'down'): Step => ({ label: s, pct: x, kind: s === 'up' ? 'on' : 'off' });
  const steps = [step(s1), step(s2)];
  if (sub === 'change') return upDownChange(x, s1, s2, steps, rng);
  const t = rng.pick(UPDOWN); const f = fmtOf(t.unit); const dollars = t.unit === '$';
  const P = rng.pick(dollars ? [40, 60, 80, 120, 160, 200, 240, 300, 400, 500] : [100, 200, 400, 500, 800, 1000, 1200, 1600, 2000]) * C;
  const am = chain(P, steps); if (!am) return null;
  const [S0, S1, S2] = am;
  if ((!dollars || d <= 5) && !(isWhole(S1) && isWhole(S2))) return null;
  const prompt = `${t.what} ${t.verb} ${dollars ? money(P) : `${plain(P)} coins`}. The ${t.thing} goes ${s1} ${x}%. Then the new ${t.thing} goes ${s2} ${x}%. What is the ${t.thing} now?`;
  const v = vis(P / C, t.unit, steps);
  const typed = typedAt(d, rng);
  const word = (s: 'up' | 'down') => (s === 'up' ? 'rise' : 'drop');
  const more = (s: 'up' | 'down') => (s === 'up' ? 'more' : 'less');
  const startL = `starting ${t.thing}`, newL = `new ${t.thing}`;
  return {
    prompt, expression: `${f(P)} ${sign(s1)} ${x}%, then ${sign(s2)} ${x}% = ?`, answer: val(S2), unit: dollars ? undefined : 'coins', answerText: dollars ? money(S2) : undefined,
    visual: v, solutionVisual: { ...v, reveal: true },
    hint: `The second ${x}% is of the new ${t.thing}, not of the ${t.thing} at the start.`,
    steps: [
      `${cap(s1)}: ${pctOfLine(x, word(s1), S0, startL, Math.abs(S1 - S0), more(s1), f)}`,
      `New ${t.thing}: ${lab(f(S0), startL)} ${sign(s1)} ${lab(f(Math.abs(S1 - S0)), more(s1))} = ${lab(f(S1), newL)}.`,
      `${cap(s2)}: ${pctOfLine(x, word(s2), S1, newL, Math.abs(S2 - S1), more(s2), f)}`,
      `Now: ${lab(f(S1), newL)} ${sign(s2)} ${lab(f(Math.abs(S2 - S1)), more(s2))} = ${lab(f(S2), `${t.thing} now`)}.`,
      `It does not get back to ${lab(f(S0), startL)}: the second ${x}% was of a ${s2 === 'down' ? 'bigger' : 'smaller'} amount.`,
    ],
    choices: typed ? undefined : pickChoices(val(S2), [val(S0), val(S1), val(2 * S0 - S2), val((S0 * (100 - x)) / 100), val((S0 * (100 + x)) / 100)], 5, dollars ? moneyLabel : coinsLabel, { pad: dollars ? 2 : 10, int: !dollars }),
    readAloud: spoken(prompt),
  };
}

/* ------------------------------------------------------------------ */
/* Dispatch                                                             */
/* ------------------------------------------------------------------ */

const MAKERS: Record<Kind, (d: number, rng: Rng) => Spec | null> = { outof100: outOf100, discounttax: discountTax, twosteps: twoCuts, pctofpct: pctOfPct, updown: upDown };
/** Draw until the numbers come out exact (a few tries at most); then fixed seeds, then a question that is always exact. */
function make(k: Kind, d: number, rng: Rng): Spec {
  for (let t = 0; t < 200; t++) { const s = MAKERS[k](d, rng); if (s) return s; }
  for (let seed = 1; seed < 400; seed++) { const s = MAKERS[k](d, createRng(seed)); if (s) return s; }
  return whatPct(3, createRng(1));
}

export function pctmultiQuestion(kind: PctMultiKind, d: Difficulty, rng: Rng, skillId?: string): Question {
  const known = kind !== 'all' && (KIND_IDS as string[]).includes(kind);
  let k: Kind;
  if (known) k = kind as Kind;
  else {
    const grade = gradeOf(d);
    const fits = KIND_IDS.filter((x) => PCTMULTI_KIND_GRADES[x].includes(grade));
    k = fits.length ? rng.pick(fits) : 'outof100';
  }
  const sid = skillId ?? (known ? `pctmulti.${k}` : 'pctmulti');
  const [lo, hi] = BAND[k];
  const spec = make(k, Math.min(hi, Math.max(lo, d)), rng);
  return contestQuestion('pctmulti', PCTMULTI_META.topic, sid, PCTMULTI_KINDS.find((x) => x.id === k)!.label, { ...spec, difficulty: d, app: APP });
}
export const genPctMulti: Generator = (skillId, params, ctx) => pctmultiQuestion(String(params?.kind ?? 'all') as PctMultiKind, ctx.difficulty, ctx.rng, skillId);
