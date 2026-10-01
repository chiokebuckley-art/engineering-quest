/**
 * Arithmetic Academy · Decimals. Tenths and hundredths as place value, decimals as fractions over 10 and
 * 100, comparing and ordering (the "longer is bigger" and "more zeros" traps), adding and subtracting by
 * lining up the point, ×/÷ 10, 100, 1000 as digits shifting place, rounding, and a first look at
 * decimal × whole number. Sits between Fractions and Ratios in the Village Market. See ../CONTENT_GUIDE.md.
 */
import type { ChapterSpec } from '../defs';
import { lab, labn } from '../../label';
import { academySkill, mkq, ask, typed, choose, model, wave, mixOf, oneOf, rint, pick, fmt, type Rng, type AskStep, type Visual, type Question } from '../kit';

const S = academySkill('arithmetic', 'dec');

/* ---------------- number helpers (integers only, so no float noise) ---------------- */
/** A count of hundredths as a trimmed decimal: 47 → '0.47', 250 → '2.5'. */
const h2 = (h: number) => fmt(h / 100);
/** A count of hundredths with both places shown: 250 → '2.50', 7 → '0.07'. */
const p2 = (h: number) => `${Math.floor(h / 100)}.${String(h % 100).padStart(2, '0')}`;
/** A count of cents as money: 365 → '$3.65'. */
const cash = (c: number) => `$${p2(c)}`;
/** A count with its place word, singular for 1: pl(1, 'tenth') → '1 tenth', pl(7, 'hundredth') → '7 hundredths'. */
const pl = (k: number, w: string) => `${k} ${w}${k === 1 ? '' : 's'}`;
/** A non-multiple of 10 in [lo, hi]: a number whose last decimal place is really used. */
const notTen = (rng: Rng, lo: number, hi: number) => { let v = rint(rng, lo, hi); let g = 0; while (v % 10 === 0 && g++ < 40) v = rint(rng, lo, hi); return v % 10 === 0 ? v + 1 : v; };
/** Ways a player might type a decimal into a table cell: '0.45' and '.45'. */
const forms = (s: string) => (s.startsWith('0.') ? [s, s.slice(1)] : [s]);
/** Every accepted fill of several blanks, joined with commas (first entry is the canonical one). */
const combos = (vals: string[]): string[] => (vals.length <= 1 ? forms(vals[0] ?? '') : forms(vals[0]).flatMap((f) => combos(vals.slice(1)).map((rest) => `${f},${rest}`)));
const card = (title: string, lines: string[]): Visual => ({ type: 'card', title, lines });
const line01 = (points: { x: number; label?: string }[] = []): Visual => ({ type: 'numline', min: 0, max: 1, step: 0.1, points });
const pv = (value: string): Visual => ({ type: 'pvchart', value });
/** The number a choice shows ('$3.65', '6.50 kg', '.45'), or null when it is not a single number. */
const valOf = (s: string): number | null => { const m = /^\$?(\d+(?:\.\d+)?|\.\d+)(?:\s*[a-zA-Z°]+)?$/.exec(s.trim()); return m ? Number(m[1]) : null; };
/**
 * choose() drops only string-equal duplicates, so '6.50 kg' would sit next to a right '6.5 kg' and be
 * marked wrong. Drop every wrong that has the same VALUE as the right answer before choosing.
 */
const chooseV = (rng: Rng, q: Question, right: string, wrongs: string[]) => {
  const rv = valOf(right);
  return choose(rng, q, right, rv === null ? wrongs : wrongs.filter((w) => { const v = valOf(w); return v === null || Math.abs(v - rv) > 1e-9; }));
};

const APP_MARKET = 'Scales, meters and price tags all read in tenths and hundredths.';
const APP_BUILD = 'Engineers measure to the hundredth: a pipe 0.05 m short leaks.';

/* =============== 1. Tenths and hundredths are places =============== */

/** Light n tenths of a bar for a decimal reading. */
function tenthsBarStep(rng: Rng): AskStep {
  const n = rint(rng, 1, 9); const d = fmt(n / 10);
  const frame = pick(rng, [
    { prompt: `The market oil tank gauge reads ${d} full. Light that much of the tank.`, ask: `Light ${lab(d, 'of the tank')}.`, label: 'tank' },
    { prompt: `Ada has painted ${d} of a 1 m beam. Light the painted part.`, ask: `Light ${lab(d, 'of the beam')}.`, label: 'beam' },
    { prompt: `The grain hopper is ${d} full. Light that much of the hopper.`, ask: `Light ${lab(d, 'of the hopper')}.`, label: 'hopper' },
  ]);
  const q = mkq(S, 'tenths', {
    prompt: frame.prompt, expression: `${d} = ?/10`, answer: n / 10, answerText: `${n}/10`,
    hint: 'The first digit after the point counts tenths.',
    steps: [`One whole cut into 10 equal pieces: each piece is one tenth, 0.1.`, `${lab(d, `of the ${frame.label}`)} is ${labn(n, 'tenth')}, so light ${labn(n, 'piece')}: ${n}/10.`],
    visual: line01(), app: APP_MARKET,
  });
  return model(q, { kind: 'fracbar', pieces: 10, label: frame.label }, [`${n}/10`], frame.ask);
}

/**
 * Rebuild a two-place decimal as hundredths in a tenths | hundredths table. (The 'placevalue' plates
 * model is hard-labelled TENS / ONES, which would call tenths "tens", so this uses the table model.)
 */
function hundredthsBuildStep(rng: Rng): AskStep {
  const n = notTen(rng, 11, 99); const t = Math.floor(n / 10); const o = n % 10;
  const q = mkq(S, 'hundredths', {
    prompt: `A scale pan reads ${h2(n)} kg. Split the reading into tenths and hundredths, then count it all in hundredths.`,
    expression: `${h2(n)} = ? hundredths`, answer: n, answerText: `${pl(t, 'tenth')}, ${pl(o, 'hundredth')} = ${n} hundredths`,
    hint: 'The first digit after the point counts tenths. One tenth is 10 hundredths.',
    steps: [`In ${lab(h2(n), 'kg')}, ${lab(t, 'tenths digit')} is in the tenths place and ${lab(o, 'hundredths digit')} is in the hundredths place.`, `${labn(t, 'tenth')} × ${lab(10, 'hundredths per tenth')} = ${lab(t * 10, 'hundredths')}`, `${lab(t * 10, 'hundredths')} + ${labn(o, 'hundredth')} = ${lab(n, 'hundredths in all')}`],
    visual: pv(h2(n)), app: APP_MARKET,
  });
  return model(q, { kind: 'table', cols: ['tenths (0.1)', 'hundredths (0.01)', 'all in hundredths'], rowLabels: [h2(n)], rows: [[null, null, null]], label: '10 hundredths make 1 tenth.' },
    [`${t},${o},${n}`], `Fill the row: the tenths digit, the hundredths digit, then ${lab(h2(n), 'kilograms')} counted in hundredths.`);
}

/** Decimal → fraction over 10 or 100, with place-name slips as distractors. */
function decToFracStep(rng: Rng): AskStep {
  const kind = pick(rng, ['tenths', 'hund', 'hund', 'small'] as const);
  let dec: string; let right: string; let wrongs: string[]; let words: string; let value: number;
  if (kind === 'tenths') {
    const t = rint(rng, 2, 9); dec = fmt(t / 10); value = t / 10; right = `${t}/10`; words = `${t} tenths`;
    wrongs = [`${t}/100`, `1/${t}`, `10/${t}`];
  } else if (kind === 'hund') {
    const n = notTen(rng, 11, 99); dec = h2(n); value = n / 100; right = `${n}/100`; words = `${n} hundredths`;
    const digits = `${Math.floor(n / 10)}/${n % 10}`;
    wrongs = [`${n}/10`, ...(Math.floor(n / 10) < n % 10 ? [digits] : []), `${n}/1000`];
  } else {
    const h = rint(rng, 2, 9); dec = h2(h); value = h / 100; right = `${h}/100`; words = `${h} hundredths`;
    wrongs = [`${h}/10`, `${h}/1000`, `1/${h}`];
  }
  const q = mkq(S, 'dec-to-frac', {
    prompt: `Vector's blueprint lists a shim ${dec} cm thick. Which fraction is the same?`,
    expression: `${dec} = ?`, answer: value, answerText: right,
    hint: 'Say it in words: how many tenths or hundredths?',
    steps: [`The last digit's place names the bottom: tenths → 10, hundredths → 100.`, `${lab(dec, 'cm')} is ${words}, so ${dec} = ${lab(right, 'cm')}.`],
    visual: pv(dec), app: APP_BUILD,
  });
  return chooseV(rng, q, right, wrongs);
}

/** The friendly fractions and their decimals. */
const BENCH = [
  { f: '1/2', n: 1, d: 2, k: 5, dec: '0.5', v: 0.5, over: '5/10', wrongs: ['0.12', '1.2', '0.2'] },
  { f: '1/4', n: 1, d: 4, k: 25, dec: '0.25', v: 0.25, over: '25/100', wrongs: ['0.14', '1.4', '0.4'] },
  { f: '3/4', n: 3, d: 4, k: 25, dec: '0.75', v: 0.75, over: '75/100', wrongs: ['0.34', '3.4', '0.25'] },
  { f: '1/5', n: 1, d: 5, k: 2, dec: '0.2', v: 0.2, over: '2/10', wrongs: ['0.15', '1.5', '0.5'] },
  { f: '2/5', n: 2, d: 5, k: 2, dec: '0.4', v: 0.4, over: '4/10', wrongs: ['0.25', '2.5', '0.2'] },
  { f: '3/5', n: 3, d: 5, k: 2, dec: '0.6', v: 0.6, over: '6/10', wrongs: ['0.35', '3.5', '0.3'] },
];
type Bench = (typeof BENCH)[number];
/** The renaming that makes a benchmark true: 3/4 = (3×25)/(4×25) = 75/100. */
const renameStep = (b: Bench) => `Make the bottom ${b.d * b.k}: ${lab(b.d, 'equal parts')} × ${lab(b.k, 'multiplier')} = ${lab(b.d * b.k, 'smaller parts')}. Multiply the top by ${b.k} too: ${b.f} = (${b.n}×${b.k})/(${b.d}×${b.k}) = ${b.over}.`;

/** Benchmark fraction → decimal; distractors read the digits as the decimal. */
function benchmarkStep(rng: Rng): AskStep {
  const b = pick(rng, BENCH);
  const q = mkq(S, 'benchmarks', {
    prompt: `The sluice gate is open ${b.f} of the way. The panel shows decimals. What should it read?`,
    expression: `${b.f} = ?`, answer: b.v, answerText: b.dec,
    hint: 'Rename the fraction with a bottom of 10 or 100 first.',
    steps: [renameStep(b), `${b.over} is written ${lab(b.dec, 'of the way open')}.`],
    visual: { type: 'fracbar', fracs: [{ n: b.n, d: b.d }, { n: b.n * b.k, d: b.d * b.k }] }, app: APP_BUILD,
  });
  return chooseV(rng, q, b.dec, b.wrongs);
}

/** Set a valve on a 0–1 slider from hundredths, place words or a friendly fraction. */
function sliderFracStep(rng: Rng, only?: 'hund' | 'words' | 'bench'): AskStep {
  const kind = only ?? pick(rng, ['hund', 'words', 'bench'] as const);
  let h: number; let label: string; let steps: string[];
  if (kind === 'hund') {
    h = notTen(rng, 5, 95); label = `${h}/100`;
    steps = [`${h}/100 is ${h} hundredths.`, `${h} hundredths is written ${lab(h2(h), 'open')}.`];
  } else if (kind === 'words') {
    const t = rint(rng, 1, 9); const u = rint(rng, 1, 9); h = t * 10 + u; label = `${pl(t, 'tenth')} and ${pl(u, 'hundredth')}`;
    steps = [`Tenths go in the first place after the point, hundredths in the second.`, `${label} is ${lab(h2(h), 'open')}.`];
  } else {
    const b = pick(rng, BENCH); h = Math.round(b.v * 100); label = b.f;
    steps = [renameStep(b), `That is ${lab(b.dec, 'open')}.`];
  }
  const q = mkq(S, kind === 'bench' ? 'benchmarks' : 'place-on-line', {
    prompt: `Volt's coolant valve must be set to ${label} open. Slide it there.`,
    expression: `${label} = ?`, answer: h / 100,
    hint: 'Write it as a decimal first: how many tenths, how many hundredths?',
    steps, visual: line01(), app: APP_BUILD,
  });
  return model(q, { kind: 'slider', min: 0, max: 1, step: 0.01, label: 'valve (0 shut → 1 open)' }, [String(h / 100)], `Slide the valve to ${kind === 'words' ? `${label} open` : lab(label, 'open')}.`);
}

/** A benchmark fraction set on the valve slider (always a friendly fraction). */
const benchSliderStep = (rng: Rng) => sliderFracStep(rng, 'bench');

/** What is one digit worth? Face value and tens/tenths slips as distractors. */
function digitValueStep(rng: Rng): AskStep {
  const ds = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3); const [w, t, h] = ds;
  const num = `${w}.${t}${h}`;
  const which = rng.next() < 0.5 ? 'tenths' : 'hundredths';
  const d = which === 'tenths' ? t : h;
  const right = which === 'tenths' ? fmt(t / 10) : fmt(h / 100);
  const wrongs = which === 'tenths' ? [String(t), fmt(t / 100), String(t * 10)] : [fmt(h / 10), String(h), String(h * 100)];
  const q = mkq(S, 'digit-value', {
    prompt: `The pressure gauge reads ${num}. What is the ${d} worth?`,
    expression: `the ${d} in ${num}`, answer: which === 'tenths' ? t / 10 : h / 100, answerText: right,
    hint: 'Name the place first: ones, tenths or hundredths?',
    steps: [`In ${num}, ${w} is in the ones place, ${t} in the tenths, ${h} in the hundredths.`, `So the ${lab(d, `${which} digit`)} is worth ${labn(d, which.slice(0, -1), which)} × ${lab(which === 'tenths' ? '0.1' : '0.01', `per ${which.slice(0, -1)}`)} = ${right}.`],
    visual: card('Pressure gauge', [num]), app: APP_MARKET,
  });
  return chooseV(rng, q, right, wrongs);
}

/* =============== 2. Comparing and ordering =============== */

/** Which pan is heavier: the "longer is bigger" trap, the "more zeros" trap, or a fair longer-is-bigger case. */
function compareStep(rng: Rng, only?: 'trap' | 'zeros' | 'longer'): AskStep {
  const w = rint(rng, 0, 3); const r = rng.next();
  const kind = only ?? (r < 0.5 ? 'trap' : r < 0.72 ? 'zeros' : 'longer');
  let a: string; let b: string; let right: string; let steps: string[]; let answer: number;
  if (kind === 'trap') {
    const t = rint(rng, 2, 9); const t2 = rint(rng, 0, t - 1); const h = rint(rng, 1, 9);
    const short = h2(w * 100 + t * 10); const long = h2(w * 100 + t2 * 10 + h);
    [a, b] = rng.next() < 0.5 ? [short, long] : [long, short]; right = `${short} kg`; answer = w + t / 10;
    steps = [`Line up the points and compare from the left: ${p2(w * 100 + t * 10)} vs ${p2(w * 100 + t2 * 10 + h)}.`, `${lab(short, 'kg')} has ${lab(t, 'tenths')}; ${lab(long, 'kg')} has only ${labn(t2, 'tenth')}.`, `So ${short} kg is heavier, even though ${long} has more digits.`];
  } else if (kind === 'zeros') {
    const t = rint(rng, 1, 9); const s1 = `${w}.${t}`; const s2 = `${w}.${t}0`;
    [a, b] = rng.next() < 0.5 ? [s1, s2] : [s2, s1]; right = 'Same mass'; answer = w + t / 10;
    steps = [`A zero on the end adds 0 hundredths: nothing.`, `${lab(s1, 'kg')} and ${lab(s2, 'kg')} are both ${labn(w, 'one')} and ${labn(t, 'tenth')}, the same mass.`];
  } else {
    const t = rint(rng, 1, 8); const h = rint(rng, 1, 9);
    const short = h2(w * 100 + t * 10); const long = h2(w * 100 + t * 10 + h);
    [a, b] = rng.next() < 0.5 ? [short, long] : [long, short]; right = `${long} kg`; answer = (w * 100 + t * 10 + h) / 100;
    steps = [`The tenths match, ${labn(t, 'tenth')} each, so compare hundredths: ${lab(p2(w * 100 + t * 10), 'kg')} vs ${lab(long, 'kg')}.`, `${lab(0, 'hundredths')} is less than ${labn(h, 'hundredth')}, so ${long} kg is heavier.`];
  }
  const choices = [`${a} kg`, `${b} kg`, 'Same mass'];
  const q = mkq(S, 'compare', {
    prompt: `Two parcels sit on the market scale: ${a} kg and ${b} kg. Which is heavier?`,
    expression: `${a} ? ${b}`, answer, answerText: right,
    hint: 'Line up the points and compare tenths first. An empty place is a 0.',
    steps, visual: card('Market scale', [`Pan A: ${a} kg`, `Pan B: ${b} kg`]), app: APP_MARKET,
  });
  return choose(rng, q, right, choices.filter((c) => c !== right));
}
/** Always one of the chapter's named traps: "longer is bigger" (2 in 3) or "more zeros" (1 in 3). */
const compareTrapStep = (rng: Rng) => compareStep(rng, rng.next() < 2 / 3 ? 'trap' : 'zeros');

/** Order three rods: one tenths, two hundredths, chosen so reading digits as whole numbers gives the wrong order. */
function orderStep(rng: Rng): AskStep {
  const read = (x: number) => (x % 10 === 0 ? x / 10 : x);
  let vals: number[] = [];
  for (let g = 0; g < 60; g++) {
    const a = rint(rng, 2, 9) * 10; const b = notTen(rng, 11, 99); const c = notTen(rng, 11, 99);
    if (new Set([a, b, c]).size < 3) continue;
    const trueOrder = [a, b, c].sort((x, y) => x - y).join();
    const readOrder = [a, b, c].sort((x, y) => read(x) - read(y)).join();
    if (trueOrder !== readOrder) { vals = rng.shuffle([a, b, c]); break; }
  }
  if (!vals.length) vals = rng.shuffle([50, 45, 62]);
  const asc = [...vals].sort((x, y) => x - y);
  const byRead = [...vals].sort((x, y) => read(x) - read(y));
  const show = (xs: number[]) => xs.map(h2).join(' < ');
  const right = show(asc);
  const q = mkq(S, 'order', {
    prompt: `Ada lays out rods of ${vals.map(h2).join(' m, ')} m. Order them shortest to longest.`,
    expression: 'shortest → longest', answer: asc[0] / 100, answerText: right,
    hint: 'Give every number two decimal places, then compare.',
    steps: [`Write each with two places: ${vals.map((v) => lab(p2(v), 'metres')).join(', ')}.`, `Now they compare like whole hundredths: ${asc.map(p2).join(' < ')}.`, `So the order is ${right}.`],
    visual: card('Rods (m)', vals.map(h2)), app: APP_BUILD,
  });
  return choose(rng, q, right, [show(byRead), show([...asc].reverse()), show([...byRead].reverse())]);
}

/** Place a decimal that lives between two tenths on a 0–1 slider. */
function sliderBetweenStep(rng: Rng): AskStep {
  const half = rng.next() < 0.5;
  let h: number; let prompt: string; let steps: string[]; let pts: { x: number; label?: string }[];
  if (half) {
    const t = rint(rng, 1, 8); h = t * 10 + 5;
    prompt = `The needle must sit exactly halfway between ${fmt(t / 10)} and ${fmt((t + 1) / 10)}. Set it.`;
    steps = [`Cut the gap into hundredths: ${p2(t * 10)}, ${p2(t * 10 + 1)} … ${p2(t * 10 + 10)}. That is 10 hundredths.`, `Halfway is ${lab(5, 'hundredths')} along: ${lab(p2(h), 'needle setting')}.`];
    pts = [{ x: t / 10 }, { x: (t + 1) / 10 }];
  } else {
    const t = rint(rng, 2, 9); h = t * 10 - 1;
    prompt = `Set the gauge one hundredth below ${fmt(t / 10)}.`;
    steps = [`Rename in hundredths: ${fmt(t / 10)} = ${p2(t * 10)}, which is ${t * 10} hundredths.`, `One hundredth less is ${h} hundredths: ${lab(h2(h), 'gauge setting')}.`];
    pts = [{ x: t / 10 }];
  }
  const q = mkq(S, 'between', {
    prompt, expression: half ? `halfway: ${fmt((h - 5) / 100)} ↔ ${fmt((h + 5) / 100)}` : `${fmt((h + 1) / 100)} − 0.01 = ?`, answer: h / 100,
    hint: 'Rename the tenths as hundredths so you can see the gaps between them.',
    steps, visual: line01(pts), app: APP_BUILD,
  });
  return model(q, { kind: 'slider', min: 0, max: 1, step: 0.01, label: 'pressure gauge' }, [String(h / 100)], half ? 'Slide the needle to the halfway point.' : 'Slide the needle one hundredth below the mark.');
}

/** Add one tenth or one hundredth across a regroup. */
function tenthMoreStep(rng: Rng): AskStep {
  const w = rint(rng, 1, 9);
  const tenth = rng.next() < 0.5;
  let x: number; let res: number; let right: string; let wrongs: string[]; let steps: string[]; let add: string;
  if (tenth) {
    const h = rint(rng, 1, 9); x = w * 100 + 90 + h; res = x + 10; add = '0.1';
    right = h2(res);
    wrongs = [`${w}.10${h}`, ...(h < 9 ? [`${w}.9${h + 1}`] : []), h2(x + 100)];
    steps = [`0.1 adds 1 to the tenths digit.`, `${h2(x)} has 9 tenths: ${lab(9, 'tenths')} + ${lab(1, 'tenth')} = ${lab(10, 'tenths')}, which make ${lab(1, 'whole')}. The ones go up and tenths become 0.`, `${lab(h2(x), 'old reading')} + ${lab('0.1', 'tick')} = ${lab(right, 'new reading')}`];
  } else {
    const t = rint(rng, 1, 8); x = w * 100 + t * 10 + 9; res = x + 1; add = '0.01';
    right = h2(res);
    wrongs = [`${w}.${t}10`, h2(x + 10), h2(x + 100)];
    steps = [`0.01 adds 1 to the hundredths digit.`, `${h2(x)} has 9 hundredths: ${lab(9, 'hundredths')} + ${lab(1, 'hundredth')} = ${lab(10, 'hundredths')}, which make ${lab(1, 'tenth')}. The tenths go up and hundredths become 0.`, `${lab(h2(x), 'old reading')} + ${lab('0.01', 'tick')} = ${lab(right, 'new reading')}`];
  }
  const q = mkq(S, 'regroup', {
    prompt: `The water meter reads ${h2(x)}. It ticks up by ${add}. What does it read now?`,
    expression: `${h2(x)} + ${add} = ?`, answer: res / 100, answerText: right,
    hint: `Which place does ${add} land in? Ten of a place make one of the place to its left.`,
    steps, visual: pv(h2(x)), app: APP_MARKET,
  });
  return choose(rng, q, right, wrongs);
}

/** Which number line shows the decimal? Distractors: digits reversed, last digit read as tenths. */
function numlinePickStep(rng: Rng): AskStep {
  // The lines carry tenth ticks only (320 units wide, dots of radius 6), so the right dot must sit at
  // least 5 hundredths from each wrong one (redraw (8,9) → 0.89 vs 0.9 and the like), and the two wrong
  // dots at least 3 apart (reversed digits vs last digit as tenths differ by t hundredths).
  const far = (t: number, u: number) => t !== u && t >= 3 && Math.abs(10 * t - 9 * u) >= 5;
  let t = rint(rng, 1, 9); let u = rint(rng, 1, 9); let g = 0;
  while (!far(t, u) && g++ < 60) { t = rint(rng, 1, 9); u = rint(rng, 1, 9); }
  if (!far(t, u)) { t = 3; u = 7; }
  const h = t * 10 + u;
  const opts = rng.shuffle([h / 100, (u * 10 + t) / 100, u / 10]);
  const labels = ['Line A', 'Line B', 'Line C'];
  const options = opts.map((x, i) => ({ visual: line01([{ x }]), label: labels[i] }));
  const right = labels[opts.indexOf(h / 100)];
  const q = mkq(S, 'numline', {
    prompt: `Three gauges, three dots. Which one shows ${h2(h)}?`,
    expression: `Find ${h2(h)}`, answer: h / 100, answerText: right,
    hint: 'Find the right pair of tenths first, then step in hundredths.',
    steps: [`${h2(h)} is ${pl(t, 'tenth')} and ${pl(u, 'hundredth')}: past ${fmt(t / 10)}, before ${fmt((t + 1) / 10)}.`, `Its dot sits ${pl(u, 'hundredth')} past ${fmt(t / 10)}: that is ${right}.`],
    visual: { type: 'none' }, app: APP_MARKET,
  });
  return ask(q, 'pickmodel', { options, accept: [right] });
}

/* =============== 3. Adding and subtracting: line up the point =============== */

/** Column add or subtract in a ones | tenths | hundredths table. */
function columnTableStep(rng: Rng): AskStep {
  const add = rng.next() < 0.55;
  let a: number; let b: number; let res: number;
  if (add) { a = rint(rng, 1, 6) * 100 + rint(rng, 1, 9) * 10; b = notTen(rng, 101, 999 - a); res = a + b; }
  else { a = rint(rng, 3, 9) * 100 + rint(rng, 1, 9) * 10; b = notTen(rng, 101, a - 11); res = a - b; }
  const dig = (x: number) => [Math.floor(x / 100), Math.floor(x / 10) % 10, x % 10];
  const op = add ? '+' : '−';
  const q = mkq(S, add ? 'add' : 'subtract', {
    prompt: add ? `Two pipe pieces, ${h2(a)} m and ${h2(b)} m, are joined. Add them column by column.` : `A ${h2(a)} m pipe has ${h2(b)} m cut off. Find what is left, column by column.`,
    expression: `${h2(a)} ${op} ${h2(b)} = ?`, answer: res / 100,
    hint: add ? 'Hundredths add to hundredths, tenths to tenths. 10 hundredths make 1 tenth.' : 'Hundredths from hundredths. Short? Trade 1 tenth for 10 hundredths.',
    steps: [`Line up the points so each column holds one place. ${h2(a)} is ${p2(a)}.`, `${lab(p2(a), add ? 'first piece in metres' : 'pipe in metres')} ${op} ${lab(p2(b), add ? 'second piece in metres' : 'cut off in metres')} = ${lab(p2(res), add ? 'total in metres' : 'left in metres')}`, `So the ${add ? 'total' : 'piece left'} is ${h2(res)} m.`],
    visual: card('Line up the point', [p2(a), `${op} ${p2(b)}`]), app: APP_BUILD,
  });
  return model(q, { kind: 'table', cols: ['ones', 'tenths', 'hundredths'], rowLabels: add ? ['A', '+ B', '= total'] : ['pipe', '− cut', '= left'], rows: [dig(a), dig(b), [null, null, null]], label: 'The point sits between ones and tenths.' },
    [dig(res).join(',')], add ? 'Fill the total row: one digit per column.' : 'Fill the bottom row: one digit per column.');
}

/** Add a tenths number to a hundredths number: right-aligned and "decimal parts as whole numbers" slips. */
function alignChoiceStep(rng: Rng): AskStep {
  let a10 = 0; let B = 0; let t = 0; let n = 0;
  for (let g = 0; g < 40; g++) { t = rint(rng, 1, 9); a10 = rint(rng, 1, 8) * 10 + t; n = notTen(rng, 11, 99); B = rint(rng, 1, 8) * 100 + n; if (t + n < 100) break; }
  const a = fmt(a10 / 10); const b = h2(B); const res = a10 * 10 + B; const right = `${h2(res)} kg`;
  const wrongs = [`${h2(a10 + B)} kg`, ...(t + n < 100 ? [`${Math.floor(a10 / 10) + Math.floor(B / 100)}.${String(t + n).padStart(2, '0')} kg`] : []), `${h2(a10 * 100 + B)} kg`];
  const q = mkq(S, 'align', {
    prompt: `Brick joins ${/^(8|11|18)(\.|$)/.test(a) ? 'an' : 'a'} ${a} kg bracket and ${/^(8|11|18)(\.|$)/.test(b) ? 'an' : 'a'} ${b} kg hinge. What is the total mass?`,
    expression: `${a} + ${b} = ?`, answer: res / 100, answerText: right,
    hint: 'Line up the decimal points, not the last digits.',
    steps: [`Line up the points: ${a} is ${p2(a10 * 10)}.`, `${lab(p2(a10 * 10), 'bracket in kg')} + ${lab(p2(B), 'hinge in kg')} = ${lab(p2(res), 'total in kg')}`, `The total is ${right}.`],
    visual: card('Brick\'s parts', [`bracket ${a} kg`, `hinge ${b} kg`]), app: APP_BUILD,
  });
  return choose(rng, q, right, wrongs);
}

/** Change from a note: write the whole dollars with .00 and subtract. */
function moneyChangeStep(rng: Rng): AskStep {
  const P = pick(rng, [5, 10, 20]); let c = rint(rng, 101, P * 100 - 5); if (c % 100 === 0) c += 15;
  const ch = P * 100 - c;
  const q = mkq(S, 'change', {
    prompt: `Ada pays with a $${P} note for a gauge costing ${cash(c)}. How much change, in dollars?`,
    expression: `$${P}.00 − ${cash(c)} = ?`, answer: ch / 100, decimal: true,
    hint: `Write $${P} as $${P}.00 so the points line up.`,
    steps: [`Line up the points: ${P}.00 − ${p2(c)}.`, `${lab(`$${P}.00`, 'paid')} − ${lab(cash(c), 'gauge price')} = ${lab(cash(ch), 'change')}`, `The change is ${cash(ch)}.`],
    visual: card('Receipt', [`gauge ${cash(c)}`, `paid $${P}.00`, 'change ?']), app: 'Every till in the market lines up the point.',
  });
  return typed(q);
}

/** Typed add or subtract with lengths. */
function addSubTypedStep(rng: Rng): AskStep {
  const add = rng.next() < 0.5;
  const a = add ? rint(rng, 1, 5) * 100 + rint(rng, 1, 9) * 10 : rint(rng, 3, 9) * 100 + notTen(rng, 11, 99);
  const b = add ? notTen(rng, 11, 399) : rint(rng, 1, Math.floor(a / 100) - 1) * 100 + rint(rng, 1, 9) * 10;
  const res = add ? a + b : a - b; const op = add ? '+' : '−';
  const q = mkq(S, add ? 'add' : 'subtract', {
    prompt: add ? `A cable run needs ${h2(a)} m and then ${h2(b)} m more. How long is it in all, in metres?` : `A ${h2(a)} m board has ${h2(b)} m sawn off. How much is left, in metres?`,
    expression: `${h2(a)} ${op} ${h2(b)} = ?`, answer: res / 100, decimal: true,
    hint: 'Line up the points. An empty place is a 0.',
    steps: [`Line up the points: ${p2(a)} ${op} ${p2(b)}.`, `${lab(p2(a), add ? 'first run in metres' : 'board in metres')} ${op} ${lab(p2(b), add ? 'more cable in metres' : 'sawn off in metres')} = ${lab(p2(res), add ? 'total in metres' : 'left in metres')}`],
    visual: card('Line up the point', [p2(a), `${op} ${p2(b)}`]), app: APP_BUILD,
  });
  return typed(q);
}

/* =============== 4. × and ÷ by 10, 100, 1000: digits shift place =============== */

interface Shift { mul: boolean; a: string; f: number; k: number; res: string; resV: number; wrongs: string[] }
/** Numbers for a ×/÷ power-of-ten item, computed in whole ten-thousandths (u) so the text is exact. */
function shiftNums(rng: Rng): Shift {
  const mul = rng.next() < 0.55; const f = pick(rng, [10, 100, 1000]); const k = Math.log10(f);
  const U = (u: number) => fmt(u / 1e4);
  if (mul) {
    const form = pick(rng, ['tenths', 'hund', 'small'] as const);
    const vh = form === 'tenths' ? notTen(rng, 11, 99) * 10 : form === 'hund' ? notTen(rng, 101, 999) : notTen(rng, 11, 99);
    const a = h2(vh); const u = vh * 100; const res = U(u * f);
    const wrongs = [`${a}${'0'.repeat(k)}`, ...((u % f === 0) ? [U(u / f)] : []), U(u * f * 10), ...(f >= 100 ? [U((u * f) / 10)] : [])];
    return { mul, a, f, k, res, resV: (u * f) / 1e4, wrongs };
  }
  const whole = rng.next() < 0.5;
  const Nt = whole ? notTen(rng, 12, 99) * 10 : notTen(rng, 11, 999);
  if (!whole && f === 1000) return shiftNums(rng); // keep answers to thousandths at most
  const a = fmt(Nt / 10); const u = Nt * 1000; const res = U(u / f);
  // Slips: wrong direction, one place too far, and (÷100, ÷1000) one place too few. For ÷10 "one place
  // too few" would be the unchanged input, so it is replaced by a second "too far".
  const wrongs = [U(u * f), ...(Number.isInteger(u / (f * 10)) ? [U(u / (f * 10))] : []), ...(f >= 100 ? [U((u * 10) / f)] : Number.isInteger(u / (f * 100)) ? [U(u / (f * 100))] : [])];
  return { mul, a, f, k, res, resV: u / f / 1e4, wrongs };
}
/** Decimal places a number string shows. */
const places = (x: string) => (x.includes('.') ? x.split('.')[1].length : 0);
/** `names` labels the start, the factor and the result: ['kg of seed', 'sacks', 'kg per sack']. */
const shiftSteps = (s: Shift, names: [string, string, string]) => [
  `${s.mul ? '×' : '÷'} ${s.f} moves every digit ${s.k} place${s.k === 1 ? '' : 's'} ${s.mul ? 'left (bigger)' : 'right (smaller)'}.`,
  ...(places(s.res) === 3 ? [`The third place after the point is thousandths (0.001): a hundredth cut into 10.`] : []),
  `${lab(s.a, names[0])} ${s.mul ? '×' : '÷'} ${lab(s.f, names[1])} = ${lab(s.res, names[2])}`,
];

/** ×/÷ by a power of ten; "just add a zero" and wrong-direction slips as distractors. */
function shiftStep(rng: Rng): AskStep {
  const s = shiftNums(rng);
  const q = mkq(S, 'shift', {
    prompt: s.mul ? `The model part is ${s.a} cm. The real part is ${s.f} times as long. How long is it?` : `${s.a} kg of seed is shared into ${s.f} equal sacks. How much in each sack?`,
    expression: `${s.a} ${s.mul ? '×' : '÷'} ${s.f} = ?`, answer: s.resV, answerText: s.res, unit: s.mul ? 'cm' : 'kg',
    hint: s.mul ? '×10 moves every digit one place to the left.' : '÷10 moves every digit one place to the right.',
    steps: shiftSteps(s, s.mul ? ['model part in cm', 'times as long', 'real part in cm'] : ['kg of seed', 'sacks', 'kg per sack']), visual: pv(s.a), app: 'Scale drawings and unit changes are all ×/÷ by 10, 100 or 1000.',
  });
  return chooseV(rng, q, s.res, s.wrongs);
}

/** Typed ×/÷ by a power of ten. */
function shiftTypedStep(rng: Rng): AskStep {
  const s = shiftNums(rng);
  const q = mkq(S, 'shift', {
    prompt: s.mul ? `A crate of ${s.f} bolts. Each bolt weighs ${s.a} g. How many grams in all?` : `${s.a} litres of oil fills ${s.f} equal cans. How many litres per can?`,
    expression: `${s.a} ${s.mul ? '×' : '÷'} ${s.f} = ?`, answer: s.resV, unit: s.mul ? 'g' : 'L',
    hint: s.mul ? 'Each ×10 moves every digit one place left.' : 'Each ÷10 moves every digit one place right.',
    steps: shiftSteps(s, s.mul ? ['grams per bolt', 'bolts', 'grams in all'] : ['litres of oil', 'cans', 'litres per can']), visual: pv(s.a), app: 'Scale drawings and unit changes are all ×/÷ by 10, 100 or 1000.',
  });
  return typed(q);
}

/** Fill a row ×1, ×10, ×100, ×1000 (or ÷). */
function shiftTableStep(rng: Rng): AskStep {
  const mul = rng.next() < 0.5;
  let a: string; let vals: string[];
  if (mul) { const vh = notTen(rng, 11, 99); a = h2(vh); vals = [h2(vh * 10), String(vh), String(vh * 10)]; }
  else { const N = notTen(rng, 101, 999); a = String(N); vals = [fmt(N / 10), fmt(N / 100), fmt(N / 1000)]; }
  const cols = mul ? ['× 1', '× 10', '× 100', '× 1000'] : ['÷ 1', '÷ 10', '÷ 100', '÷ 1000'];
  const q = mkq(S, 'shift-table', {
    prompt: mul ? `Scale the ${a} m test beam up by 10, then 100, then 1000.` : `Split ${a} kg of sand into 10, then 100, then 1000 equal bags.`,
    expression: `${a} ${mul ? '×' : '÷'} 10, 100, 1000`, answer: Number(vals[2]), answerText: vals.join(', '),
    hint: mul ? 'Each column moves every digit one more place left.' : 'Each column moves every digit one more place right.',
    steps: [`Each step ${mul ? 'multiplies' : 'divides'} by 10 again: every digit moves one more place ${mul ? 'left' : 'right'}.`, ...(mul ? [] : [`${a} ÷ 1000 reaches the thousandths place (0.001).`]), mul ? `${lab(a, 'metres')} → ${vals.map((v) => lab(v, 'metres')).join(' → ')}` : `${lab(a, 'kg of sand')} → ${vals.map((v) => lab(v, 'kg per bag')).join(' → ')}`],
    visual: pv(a), app: 'Unit ladders (mm, cm, m, km) are steps of 10.',
  });
  return model(q, { kind: 'table', cols, rows: [[a, null, null, null]], label: mul ? 'Each column is 10 times the one before.' : 'Each column is one tenth of the one before.' }, combos(vals), 'Fill the row, one number per box.');
}

/** Why ×10 is a shift, not "add a zero". */
function whyShiftStep(rng: Rng): AskStep {
  const t = rint(rng, 2, 9); const v = fmt(t / 10);
  const right = 'Digits move 1 place left';
  const q = mkq(S, 'why-shift', {
    prompt: `Vector: "${v} × 10 = ${t}, not ${v}0." Which reason is right?`,
    expression: `${v} × 10 = ${t}`, answer: t, answerText: right,
    hint: 'What is 10 tenths? What is 10 lots of one tenth?',
    steps: [`10 tenths make 1 one, so every digit moves one place left: ${lab(t, 'tenths')} × 10 = ${lab(t * 10, 'tenths')}, which make ${lab(t, 'ones')}.`, `${v}0 is still ${t} tenths: adding a zero on the end changes nothing.`, `Moving right would make it smaller (${fmt(t / 100)}), and ${v}0 is not ${t}.`],
    visual: { type: 'pvchart', value: v, shift: 1 }, app: 'Unit changes are shifts: 0.4 m × 100 = 40 cm.',
  });
  return choose(rng, q, right, ['×10 adds a zero on the end', 'Digits move 1 place right', `${v}0 and ${t} are equal`]);
}

/* =============== 5. Rounding =============== */

/**
 * Round to the nearest whole number on a slider from w to w + 1 (in tenths, or in hundredths when x has
 * two places): the player can slide to x first (the readout shows it) and then to the nearer whole end. (The integer 'numberline' model has no
 * tenths and shows a hop readout, so it cannot place x at all.)
 */
function roundLineStep(rng: Rng): AskStep {
  const w = rint(rng, 1, 14); const twoPlaces = rng.next() < 0.4;
  const t = rint(rng, 1, 9); const frac = twoPlaces ? t * 10 + rint(rng, 1, 9) : t * 10;
  const x = h2(w * 100 + frac); const r = t >= 5 ? w + 1 : w;
  const q = mkq(S, 'round-whole', {
    prompt: `Volt's cable run measures ${x} m. The supplier cuts whole metres. Round to the nearest one.`,
    expression: `${x} ≈ ?`, answer: r,
    hint: 'Only the tenths digit decides: 5 or more rounds up.',
    steps: [`${lab(x, 'metres')} is between ${labn(w, 'metre')} and ${lab(w + 1, 'metres')}; halfway is ${lab(`${w}.5`, 'metres')}.`, `The tenths digit is ${t}, so ${x} is ${t >= 5 ? 'at or past' : 'before'} ${w}.5 and rounds to ${labn(r, 'whole metre')}.`],
    visual: { type: 'numline', min: w, max: w + 1, step: 0.1, points: [{ x: (w * 100 + frac) / 100, label: x }, { x: w + 0.5, open: true }] }, app: 'Suppliers cut cable to whole metres.',
  });
  return model(q, { kind: 'slider', min: w, max: w + 1, step: twoPlaces ? 0.01 : 0.1, label: 'cut length', unit: 'm' }, [String(r)], `Find ${lab(x, 'metres')}, then slide to the whole metre nearest it.`);
}

/** Round to the nearest tenth on a slider. */
function roundTenthSliderStep(rng: Rng): AskStep {
  const w = rint(rng, 1, 8); const t = rint(rng, 1, 8); const u = rint(rng, 1, 9);
  const xh = w * 100 + t * 10 + u; const rt = u >= 5 ? t + 1 : t; const ans = fmt((w * 10 + rt) / 10);
  const q = mkq(S, 'round-tenth', {
    prompt: `Dr. Catalyst's sample weighs ${h2(xh)} g. The label shows tenths. Slide to ${h2(xh)} rounded to the nearest tenth.`,
    expression: `${h2(xh)} ≈ ? (nearest 0.1)`, answer: (w * 10 + rt) / 10,
    hint: 'Which two tenths is it between? The hundredths digit decides.',
    steps: [`${lab(h2(xh), 'grams')} is between ${lab(`${w}.${t}`, 'grams')} and ${lab(fmt((w * 10 + t + 1) / 10), 'grams')}.`, `The hundredths digit is ${u}: ${u >= 5 ? '5 or more, so round up' : 'less than 5, so round down'}.`, `${lab(h2(xh), 'grams')} ≈ ${lab(ans, 'grams, to the nearest tenth')}`],
    visual: { type: 'numline', min: w, max: w + 1, step: 0.1, points: [{ x: xh / 100 }] }, app: 'Lab labels round to the precision of the scale.',
  });
  return model(q, { kind: 'slider', min: w, max: w + 1, step: 0.1, label: 'label value', unit: 'g' }, [ans], 'Slide to the nearest tenth.');
}

/** Rounding traps: rounding twice, reading the last digit, and a carry that ripples. */
function roundChooseStep(rng: Rng): AskStep {
  const kind = pick(rng, ['chain', 'last', 'carry'] as const);
  const w = rint(rng, 1, 19);
  let x: string; let right: string; let wrongs: string[]; let steps: string[]; let to: string; let v: number;
  if (kind === 'chain') {
    const u = rint(rng, 5, 9); x = `${w}.4${u}`; right = String(w); v = w; to = 'whole tonne';
    wrongs = [String(w + 1), `${w}.5`, `${w}.4`];
    steps = [`To round to a whole number, look only at the tenths digit: 4.`, `4 is less than 5, so ${lab(x, 'tonnes')} rounds down to ${labn(w, 'tonne')}. Rounding twice (${x} → ${w}.5 → ${w + 1}) is the trap.`];
  } else if (kind === 'last') {
    const t = rint(rng, 5, 9); const u = rint(rng, 1, 4); x = `${w}.${t}${u}`; right = String(w + 1); v = w + 1; to = 'whole tonne';
    wrongs = [String(w), `${w}.${t}`];
    steps = [`Look at the tenths digit, not the last digit: ${t}.`, `${t} is 5 or more, so ${lab(x, 'tonnes')} rounds up to ${lab(w + 1, 'tonnes')}.`];
  } else {
    const u = rint(rng, 5, 9); x = `${w}.9${u}`; right = `${w + 1}.0`; v = w + 1; to = 'tenth of a tonne';
    wrongs = [`${w}.9`, `${w}.10`, `${w}.0`];
    steps = [`${lab(x, 'tonnes')} is between ${lab(`${w}.9`, 'tonnes')} and ${lab(`${w + 1}.0`, 'tonnes')}.`, `The hundredths digit ${u} is 5 or more, so round up: ${lab(`${w}.9`, 'tonnes')} + ${lab('0.1', 'tonne')} = ${lab(`${w + 1}.0`, 'tonnes')}.`];
  }
  const q = mkq(S, 'round-trap', {
    prompt: `The crane's load cell reads ${x} t. Round it to the nearest ${to}.`,
    expression: `${x} ≈ ?`, answer: v, answerText: right,
    hint: kind === 'carry' ? 'Which two tenths is it between? The hundredths digit decides.' : 'Which two whole numbers is it between? One digit decides.',
    steps, visual: { type: 'numline', min: w, max: w + 1, step: 0.1, points: [{ x: Number(x), label: x }] }, app: 'Crane limits are posted rounded; read them right.',
  });
  return chooseV(rng, q, right, wrongs);
}

/** Typed rounding to a whole number (practice). */
function roundTypedStep(rng: Rng): AskStep {
  // never t = u = 0: that would ask to round a number that is already whole
  const w = rint(rng, 2, 49); const t = rint(rng, 0, 9); const u = t === 0 ? rint(rng, 1, 9) : rint(rng, 0, 9);
  const x = h2(w * 100 + t * 10 + u); const r = t >= 5 ? w + 1 : w;
  const q = mkq(S, 'round-whole', {
    prompt: `The tank holds ${x} litres. Round to the nearest whole litre.`,
    expression: `${x} ≈ ?`, answer: r,
    hint: 'Only the tenths digit decides.',
    steps: [`The tenths digit is ${t}: ${t >= 5 ? '5 or more, round up' : 'less than 5, round down'}.`, `${lab(x, 'litres')} ≈ ${labn(r, 'whole litre')}`],
    app: 'Estimates start with sensible rounding.',
  });
  return typed(q);
}

/* =============== 6. Decimal × whole number =============== */

/** n scoops of t tenths on a 10-piece plank. */
function multFracbarStep(rng: Rng): AskStep {
  const n = rint(rng, 2, 4); const t = rint(rng, 1, Math.floor(9 / n)); const v = fmt(t / 10);
  const q = mkq(S, 'times-whole', {
    prompt: `Each ore scoop fills ${v} of the hopper. Brick tips in ${n} scoops. Light the hopper.`,
    expression: `${n} × ${v} = ?`, answer: (n * t) / 10, answerText: `${fmt((n * t) / 10)} (${n * t}/10)`,
    hint: 'Count in tenths: how many tenths in one scoop?',
    steps: [`${lab(v, 'of the hopper per scoop')} is ${labn(t, 'tenth')}.`, `${lab(n, 'scoops')} × ${labn(t, 'tenth per scoop', 'tenths per scoop')} = ${lab(n * t, 'tenths')}, which is ${lab(fmt((n * t) / 10), 'of the hopper')}.`],
    visual: { type: 'fracbar', fracs: [{ n: t, d: 10 }] }, app: 'Batching: the same measure, many times.',
  });
  return model(q, { kind: 'fracbar', pieces: 10, label: 'hopper' }, [`${n * t}/10`], `Light ${lab(n, 'scoops')}, each ${lab(v, 'of the hopper')}.`);
}

/** n × a decimal; "multiply the parts separately", dropped point and place slips as distractors. */
function multChooseStep(rng: Rng): AskStep {
  const n = rint(rng, 2, 9); const two = rng.next() < 0.4;
  const w = rint(rng, 1, two ? 3 : 4);
  const scale = two ? 100 : 10;
  // The decimal part must carry (n × frac ≥ scale): without a carry "multiply the parts separately"
  // gives the right value (2 × 1.3 → 2.6, or 2 × 3.25 → '6.50'), so it would not be a wrong choice.
  const lo = Math.ceil(scale / n);
  const frac = two ? notTen(rng, Math.max(11, lo), 99) : rint(rng, Math.max(1, lo), 9);
  const whole = w * scale + frac; const prod = n * whole;
  const v = fmt(whole / scale); const right = fmt(prod / scale);
  const parts = `${n * w}.${n * frac}`;
  const q = mkq(S, 'times-whole', {
    prompt: `A shelf bracket weighs ${v} kg. How much do ${n} brackets weigh?`,
    expression: `${n} × ${v} = ?`, answer: prod / scale, answerText: `${right} kg`,
    hint: 'Estimate first: round the bracket to a whole number of kg.',
    steps: [`Estimate: ${lab(n, 'brackets')} × ${lab(Math.round(whole / scale), 'kg each, rounded')} = ${lab(n * Math.round(whole / scale), 'kg')}, so the answer is near that.`, `${lab(v, 'kg')} is ${lab(whole, `${two ? 'hundredths' : 'tenths'} of a kg`)}.`, `${lab(n, 'brackets')} × ${lab(whole, `${two ? 'hundredths' : 'tenths'} of a kg each`)} = ${lab(prod, `${two ? 'hundredths' : 'tenths'} of a kg`)}, which is ${lab(right, 'kg')}.`],
    visual: card('Bracket', [`${v} kg each`, `${n} brackets`]), app: 'Load totals: one part\'s mass times the count.',
  });
  return chooseV(rng, q, `${right} kg`, [`${parts} kg`, `${prod} kg`, `${fmt(prod / scale / 10)} kg`]);
}

/** Money: n items at a price. */
function multTypedStep(rng: Rng): AskStep {
  const n = rint(rng, 2, 6); let c = rint(rng, 11, 99) * 5; if (c % 100 === 0) c += 5; // a price with cents
  const q = mkq(S, 'times-whole', {
    prompt: `Volt buys ${n} fuses at ${cash(c)} each. What is the total, in dollars?`,
    expression: `${n} × ${cash(c)} = ?`, answer: (n * c) / 100, decimal: true,
    hint: 'Think in cents, then turn cents back into dollars.',
    steps: [`${cash(c)} is ${c} cents.`, `${lab(n, 'fuses')} × ${lab(c, 'cents each')} = ${lab(n * c, 'cents')}, which is ${lab(cash(n * c), 'total')}.`],
    visual: card('Price tag', [`fuse ${cash(c)}`, `× ${n}`]), app: 'Parts lists are priced to the cent.',
  });
  return typed(q);
}

/** Fraction over 10 or 100 → decimal, typed (practice). */
function fracToDecTypedStep(rng: Rng): AskStep {
  const kind = pick(rng, ['tenths', 'hund', 'bench'] as const);
  let f: string; let v: number; let steps: string[];
  if (kind === 'tenths') { const t = rint(rng, 1, 9); f = `${t}/10`; v = t / 10; steps = [`${f} is ${pl(t, 'tenth')}.`, `${pl(t, 'tenth')} is ${lab(fmt(v), 'of the field drained')}.`]; }
  else if (kind === 'hund') { const h = notTen(rng, 1, 99); f = `${h}/100`; v = h / 100; steps = [`${f} is ${pl(h, 'hundredth')}.`, `${pl(h, 'hundredth')} is ${lab(h2(h), 'of the field drained')}.`]; }
  else { const b = pick(rng, BENCH); f = b.f; v = b.v; steps = [renameStep(b), `That is ${lab(b.dec, 'of the field drained')}.`]; }
  const q = mkq(S, 'frac-to-dec', {
    prompt: `The survey sheet says ${f} of the field is drained. Write it as a decimal.`,
    expression: `${f} = ?`, answer: v, decimal: true,
    hint: 'Make the bottom 10 or 100, then read the top as tenths or hundredths.',
    steps, app: APP_BUILD,
  });
  return typed(q);
}

/* =============== transfer: new frames and representations =============== */

/** Read an incubator thermometer marked in 0.2 °C steps. */
function thermometerStep(rng: Rng): AskStep {
  let k = rint(rng, 1, 24); if (k % 5 === 0) k += 1;
  const below = 35 + Math.floor(k / 5); const m = k % 5; const v = (350 + 2 * k) / 10;
  const q = mkq(S, 't-thermometer', {
    prompt: `Dr. Catalyst's incubator thermometer. What temperature does it show?`,
    expression: '? °C', answer: v, unit: '°C', decimal: true,
    hint: 'Labels go up by 1 with 5 spaces between. What is one mark worth?',
    steps: [`${lab(1, 'degree between labels')} ÷ ${lab(5, 'spaces')} = ${lab('0.2', 'degrees per mark')}`, `The line is ${m} mark${m === 1 ? '' : 's'} above ${below} °C: ${lab(below, 'degrees at the label')} + ${labn(m, 'mark')} × ${lab('0.2', 'degrees per mark')} = ${lab(fmt(v), 'degrees Celsius')}.`],
    visual: { type: 'thermometer', min: 35, max: 40, major: 1, divisions: 5, value: v, unit: '°C' }, app: 'Lab instruments are read to a tenth.',
  });
  return typed(q);
}

/** Metric conversions are shifts of the digits. */
function unitConvertStep(rng: Rng): AskStep {
  const kind = pick(rng, ['m-cm', 'cm-m', 'kg-g', 'g-kg'] as const);
  let prompt: string; let expr: string; let ans: number; let unit: string; let steps: string[];
  if (kind === 'm-cm') { const vh = notTen(rng, 101, 999); prompt = `The survey pole is ${h2(vh)} m tall. How many centimetres is that?`; expr = `${h2(vh)} m = ? cm`; ans = vh; unit = 'cm'; steps = [`1 m = 100 cm, so multiply by 100: every digit moves 2 places left.`, `${lab(h2(vh), 'metres')} × ${lab(100, 'cm per metre')} = ${lab(vh, 'cm')}`]; }
  else if (kind === 'cm-m') { const c = notTen(rng, 11, 99); prompt = `Ada's pipe offcut is ${c} cm. How many metres is that?`; expr = `${c} cm = ? m`; ans = c / 100; unit = 'm'; steps = [`100 cm = 1 m, so divide by 100: every digit moves 2 places right.`, `${lab(c, 'cm')} ÷ ${lab(100, 'cm per metre')} = ${lab(h2(c), 'metres')}`]; }
  else if (kind === 'kg-g') { const vt = notTen(rng, 11, 99); prompt = `Dr. Catalyst needs ${fmt(vt / 10)} kg of salt. How many grams is that?`; expr = `${fmt(vt / 10)} kg = ? g`; ans = vt * 100; unit = 'g'; steps = [`1 kg = 1000 g, so multiply by 1000: every digit moves 3 places left.`, `${lab(fmt(vt / 10), 'kg')} × ${lab(1000, 'grams per kg')} = ${lab(vt * 100, 'grams')}`]; }
  else { const g = notTen(rng, 11, 99) * 10; prompt = `A sample jar holds ${g} g. How many kilograms is that?`; expr = `${g} g = ? kg`; ans = g / 1000; unit = 'kg'; steps = [`1000 g = 1 kg, so divide by 1000: every digit moves 3 places right.`, `${lab(g, 'grams')} ÷ ${lab(1000, 'grams per kg')} = ${lab(fmt(g / 1000), 'kg')}`]; }
  const q = mkq(S, 't-units', { prompt, expression: expr, answer: ans, unit, hint: 'How many of the small unit make one big unit? Shift the digits that many places.', steps, visual: pv(expr.split(' ')[0]), app: 'Metric units are built on 10, so conversions are digit shifts.' });
  return typed(q);
}

/** Fastest cart: least time, with the "longer is bigger" trap in the times. */
function raceTimeStep(rng: Rng): AskStep {
  const w = rint(rng, 11, 15); const t = rint(rng, 3, 8);
  const short = w * 100 + t * 10; const fast = w * 100 + (t - 1) * 10 + rint(rng, 1, 9); const slow = w * 100 + t * 10 + rint(rng, 1, 9);
  const times = rng.shuffle([short, fast, slow]);
  const right = `${h2(fast)} s`;
  const q = mkq(S, 't-race', {
    prompt: `Newton times three test carts: ${times.map(h2).join(' s, ')} s. Which cart was fastest?`,
    expression: 'least time wins', answer: fast / 100, answerText: right,
    hint: 'Fastest means the least time. Line up the points and compare tenths first.',
    steps: [`With two places each: ${times.map((x) => lab(p2(x), 'seconds')).join(', ')}.`, `The least is ${p2(fast)}, so the ${right} cart was fastest.`],
    visual: card('Stopwatch', times.map((x) => `${h2(x)} s`)), app: 'Test engineers compare run times to the hundredth.',
  });
  return choose(rng, q, right, [`${h2(short)} s`, `${h2(slow)} s`]);
}

/** A fuel log: three runs in mixed places (one of them a whole number) added down a column. */
function fuelLogStep(rng: Rng): AskStep {
  const a = notTen(rng, 105, 395); const b = rint(rng, 2, 9) * 10; const c = rint(rng, 1, 4) * 100;
  const runs = rng.shuffle([a, b, c]); const tot = a + b + c;
  const q = mkq(S, 't-fuel-log', {
    prompt: `Newton's fuel log for the test cart lists three runs. How many litres did the cart burn in all?`,
    expression: `${runs.map(h2).join(' + ')} = ?`, answer: tot / 100, unit: 'L', decimal: true,
    hint: 'Line up the points. A whole number has its point at the end: 3 = 3.00.',
    steps: [`Give each two places: ${runs.map(p2).join(' + ')}.`, `Add down the columns: ${runs.map((x, i) => lab(p2(x), `litres, run ${['one', 'two', 'three'][i]}`)).join(' + ')} = ${lab(p2(tot), 'litres in all')}`, `The cart burned ${h2(tot)} L.`],
    visual: card('Fuel log', [...runs.map((x, i) => `run ${i + 1}: ${h2(x)} L`), 'total: ? L']), app: 'Fuel and batch logs are summed with the points lined up.',
  });
  return typed(q);
}

/** Read a 0–1 kg dial whose needle sits halfway between two tenth marks. */
function dialStep(rng: Rng): AskStep {
  const t = rint(rng, 1, 8); const h = t * 10 + 5;
  const q = mkq(S, 't-dial', {
    prompt: `Ada's parcel scale is marked in tenths of a kilogram. The needle stops exactly halfway between two marks. What does it read, in kilograms?`,
    expression: '? kg', answer: h / 100, unit: 'kg', decimal: true,
    hint: 'Name the two marks it sits between. Rename them in hundredths to find the middle.',
    steps: [`The needle is between ${lab(fmt(t / 10), 'kg')} and ${lab(fmt((t + 1) / 10), 'kg')}, that is between ${lab(p2(t * 10), 'kg')} and ${lab(p2(t * 10 + 10), 'kg')}.`, `Halfway is ${lab(5, 'hundredths')} past ${p2(t * 10)}: ${lab(h2(h), 'kg')}.`],
    visual: line01([{ x: h / 100 }]), app: 'Analogue gauges are read between the marks.',
  });
  return typed(q);
}

/** Read a millimetre ruler in centimetres. */
function rulerStep(rng: Rng): AskStep {
  const mm = notTen(rng, 12, 98);
  const q = mkq(S, 't-ruler', {
    prompt: 'Ada measures a washer. How long is it, in centimetres?',
    expression: '? cm', answer: mm / 10, unit: 'cm', decimal: true,
    hint: 'The numbered marks are whole cm. There are 10 small marks in each cm.',
    steps: [`Each small mark is 1 mm = 0.1 cm.`, `It ends ${mm % 10} small mark${mm % 10 === 1 ? '' : 's'} past ${Math.floor(mm / 10)} cm.`, `${lab(Math.floor(mm / 10), 'cm')} + ${labn(mm % 10, 'small mark')} × ${lab('0.1', 'cm per mark')} = ${lab(fmt(mm / 10), 'cm')}`],
    visual: { type: 'ruler', unit: 'cm', length: 10, start: 0, end: mm, label: 'washer' }, app: 'Workshop rulers read tenths of a centimetre.',
  });
  return typed(q);
}

/* =============== the chapter =============== */

export const DECIMALS_CHAPTER: ChapterSpec = {
  key: 'dec', title: 'Decimals from Place Value', wing: 'village', wingName: 'Village Market Scales',
  goal: 'Read tenths, hundredths and thousandths as places, link decimals to fractions over 10 and 100 (including 1/2, 1/4, 3/4 and fifths), compare and order them, add and subtract by lining up the point, shift digits for ×/÷ 10, 100, 1000, round to a whole number or a tenth, and multiply a decimal by a whole number.',
  misconception: '"Longer is bigger" (0.45 > 0.5 because 45 > 5); a zero on the end changes the value (0.50 > 0.5); lining up last digits instead of the point; "×10 adds a zero" (3.5 × 10 = 3.50); rounding by the last digit or rounding twice.',
  teach: [
    { title: 'Cut one into tenths', text: 'Cut one whole plank into 10 equal pieces. Each piece is one tenth: 1/10 = 0.1. Light 3 pieces and you have 3/10 = 0.3. Cut every tenth into 10 again and you get hundredths: 3 (lit tenths) × 10 (hundredths per tenth) = 30 (lit hundredths) out of 100 (hundredths), so 0.3 = 30/100 = 0.30.', model: { kind: 'fracbar', pieces: 10, label: 'plank' }, visual: { type: 'fracbar', fracs: [{ n: 3, d: 10 }, { n: 30, d: 100 }] } },
    { title: 'Friendly fractions', text: 'To write a fraction as a decimal, make the bottom 10 or 100. 1/4: 100 (hundredths) ÷ 4 (equal parts) = 25 (hundredths per part), so multiply top and bottom by 25: 1/4 = 25/100 = 0.25. The same way 1/2 = 5/10 = 0.5, 3/4 = 75/100 = 0.75 and 1/5 = 2/10 = 0.2.', visual: { type: 'fracbar', fracs: [{ n: 1, d: 4 }, { n: 25, d: 100 }] } },
    { title: 'Places after the point', text: '2.47 is 2 ones, 4 tenths and 7 hundredths. Each place is worth 10 of the place to its right. To compare, line up the points and read from the left: 0.5 has 5 tenths, 0.45 has only 4, so 0.5 is bigger. A zero on the end (0.50) adds nothing.', steps: ['2.47 = 2 (two ones) + 0.4 (four tenths) + 0.07 (seven hundredths)', '0.5 = 0.50. Compare hundredths: 50 (hundredths) > 45 (hundredths), so 0.5 > 0.45.'], next: 'Which is bigger, 0.3 or 0.28? Line up the points first.', visual: { type: 'pvchart', value: '2.47' } },
    { title: 'Line up the point, shift the digits', text: 'Add tenths to tenths: 2.75 + 1.4 is 2.75 + 1.40 = 4.15. ×10 moves every digit one place left, because 10 tenths make 1 one: 3.5 × 10 = 35, not 3.50. ÷10 moves every digit one place right. Cut a hundredth into 10 and you get thousandths (0.001): 45 ÷ 1000 = 0.045.', visual: { type: 'pvchart', value: '45', shift: -3 } },
    { title: 'Round, then repeat', text: 'To round 10.7 to a whole number, find the two wholes around it (10 and 11) and the halfway mark 10.5. 10.7 is past halfway, so it rounds to 11. Only the next digit decides. Repeating a decimal counts pieces: 0.4 is 4 (tenths), so 3 (repeats) × 4 (tenths) = 12 (tenths), which is 1.2.', visual: { type: 'numline', min: 10, max: 11, step: 0.1, points: [{ x: 10.7, label: '10.7' }, { x: 10.5, open: true }] } },
  ],
  quests: [
    { id: 'aq.arith.dec.market-scales', name: 'The Market Scales', giver: 'ada', guided: true,
      hook: 'The market scales read in tenths and hundredths, and traders swear 0.45 kg beats 0.5 kg. Ada: "Cut the kilogram into tenths and settle it for good."',
      change: 'The market scales read true and the traders stop arguing.',
      waves: [
        wave('Tenths on the plank', mixOf([tenthsBarStep, hundredthsBuildStep, decToFracStep, digitValueStep])),
        wave('Friendly fractions', mixOf([benchmarkStep, benchSliderStep, oneOf([(rng) => sliderFracStep(rng, 'hund'), (rng) => sliderFracStep(rng, 'words')]), numlinePickStep])),
        wave('Heavier pan', mixOf([compareStep, orderStep, sliderBetweenStep, tenthMoreStep])),
      ] },
    { id: 'aq.arith.dec.supply-counter', name: 'The Supply Counter', giver: 'brick',
      hook: 'Brick: "Parts are priced to the cent and cut to the centimetre. Line up the point, or the bill and the pipe both come out wrong."',
      change: 'The supply counter balances its books and every pipe fits.',
      waves: [
        wave('Line up the point', mixOf([columnTableStep, alignChoiceStep, oneOf([moneyChangeStep, addSubTypedStep])])),
        wave('Shift the digits', mixOf([oneOf([shiftStep, shiftTypedStep]), shiftTableStep, whyShiftStep])),
        wave('Round and repeat', mixOf([roundLineStep, roundTenthSliderStep, roundChooseStep, multFracbarStep, oneOf([multChooseStep, multTypedStep])])),
      ] },
  ],
  // Deterministic spread: always a named trap (longer-is-bigger, more zeros, or ordering), one place-value
  // model (tenths, hundredths, halfway, a benchmark fraction, the number line) and one operation model
  // (why ×10 shifts, rounding to a tenth, a decimal times a whole number).
  concept: (rng) => [
    oneOf([compareTrapStep, compareTrapStep, orderStep])(rng),
    oneOf([tenthsBarStep, hundredthsBuildStep, sliderBetweenStep, benchSliderStep, numlinePickStep])(rng),
    oneOf([whyShiftStep, roundTenthSliderStep, roundLineStep, multFracbarStep])(rng),
  ],
  transfer: oneOf([thermometerStep, unitConvertStep, raceTimeStep, fuelLogStep, rulerStep, dialStep]),
  practice: (rng) => oneOf([fracToDecTypedStep, moneyChangeStep, addSubTypedStep, shiftTypedStep, roundTypedStep, multTypedStep])(rng).question,
};

/** Two decimal items for the Arithmetic Mastery Trial: one comparison/ordering, one operation. */
export const decimalTrialSteps = (rng: Rng): AskStep[] => [
  oneOf([compareTrapStep, orderStep, benchmarkStep])(rng),
  oneOf([alignChoiceStep, shiftStep, columnTableStep, roundChooseStep, multChooseStep])(rng),
];

/**
 * Decimal items for chapters and phases outside this file (the Fluency & Transfer capstone, the Trial
 * Rehearsal, the Keeper): a mixed decimal item and a decimal transfer item. Not quest clones.
 */
export const decimalMixedStep = (rng: Rng): AskStep => oneOf([alignChoiceStep, raceTimeStep, multChooseStep, roundChooseStep])(rng);
export const decimalTransferStep = (rng: Rng): AskStep => oneOf([fuelLogStep, dialStep, unitConvertStep, thermometerStep])(rng);
