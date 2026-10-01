import type { Difficulty, Question, QuestionChoice, Visual } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import type { ContestIcon } from '../contest/visuals';
import { contestQuestion, choicesFrom, gradeOf, type ContestGameMeta, type ContestKind, type ContestSpec, type KindGrades } from '../contest/common';
import { lab, labn, unit } from '../label';

/**
 * Charts & Venn (Contest Path): pictographs and tally charts, bar charts, pie charts, Venn diagrams, mean and median.
 * Difficulty 1–2 = Grade 1, 3–4 = Grade 3, 5–6 = Grade 5 (see contest/common.ts). A kind asked at a difficulty outside
 * its grades plays at the nearest difficulty it supports.
 *
 * Pictures: `picto` draws a pictograph (each icon worth `key`), a tally chart (`tally`) or a bar chart (`bar` = the
 * value of one grid step); `pie` draws slices (with `parts` guide lines or printed percents); `venn` draws two or three
 * circles with a count in each region. The question picture never shows the answer; the worked picture goes in
 * `solutionVisual`.
 */
export type DataKind = 'all' | 'picto' | 'bar' | 'pie' | 'venn' | 'mean';
type Kind = Exclude<DataKind, 'all'>;
type Picto = Extract<Visual, { type: 'picto' }>;
type Pie = Extract<Visual, { type: 'pie' }>;
type Venn = Extract<Visual, { type: 'venn' }>;

export const DATA_META: ContestGameMeta = {
  id: 'data', label: 'Charts & Venn', icon: 'dashboard', topic: 'Data', skill: 'data',
  blurb: 'Read pictographs, tally charts, bar charts, pie charts and Venn diagrams; find the mean and the middle.',
  intro: 'A chart is a picture of counting, so read its title and its key before anything else. In a pictograph one picture can stand for 2, 5 or 10, and on a bar chart each grid line has a value: go from the top of the bar straight across to the scale. A whole pie is all of them (100%), so a quarter of the pie is a quarter of the total. In a Venn diagram the middle belongs to both circles, so count it once; the mean shares the total out equally, and the median is the middle number once the numbers are in order.',
  tree: { x: 5, y: 4 }, prereq: { skillId: 'add.basic', mastery: 0 },
};

export const DATA_KINDS: ContestKind[] = [
  { id: 'all', label: 'Mixed', short: 'Mixed', desc: 'Read pictographs, tally charts, bar charts, pie charts and Venn diagrams; find the mean and the middle.' },
  { id: 'picto', label: 'Pictographs and tallies', short: 'Pictures', desc: 'Each picture can stand for more than one: check the key first.' },
  { id: 'bar', label: 'Bar charts', short: 'Bars', desc: 'Read each bar against the scale, then compare: how many more, how many in all.' },
  { id: 'pie', label: 'Pie charts', short: 'Pies', desc: 'A whole pie is 100% (or all of them). A half, a quarter, a tenth of the total.' },
  { id: 'venn', label: 'Venn diagrams', short: 'Venn', desc: 'The middle belongs to both circles: count it once.' },
  { id: 'mean', label: 'Mean and middle', short: 'Mean', desc: 'Mean: share the total equally. Median: the middle number once they are in order.' },
];
/** Which grades each kind suits. */
export const DATA_KIND_GRADES: KindGrades = { picto: ['g1', 'g3'], bar: ['g3', 'g5'], pie: ['g5'], venn: ['g3', 'g5'], mean: ['g5'] };
/** The difficulties each kind is written for; other difficulties play at the nearest one. */
const BAND: Record<Kind, [number, number]> = { picto: [1, 4], bar: [3, 6], pie: [5, 6], venn: [3, 6], mean: [5, 6] };
const KINDS: Kind[] = ['picto', 'bar', 'pie', 'venn', 'mean'];

const APP = 'Engineers and scientists read charts every day: what is most, what is least, how much more, and what share of the whole.';

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
const sumOf = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const lc = (s: string) => s.toLowerCase();
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const LETTERS = ['A', 'B', 'C', 'D'];

/** Number choices in order: the right value plus mistakes a child really makes (all positive, all different, at most `max`). */
function numberChoices(right: number, wrong: number[], n: number, max = Infinity): QuestionChoice[] {
  const vals = [right];
  for (const w of wrong) if (vals.length < n && Number.isInteger(w) && w > 0 && w <= max && !vals.includes(w)) vals.push(w);
  for (let k = 1; vals.length < n && k < 60; k++) for (const w of [right + k, right - k]) if (vals.length < n && w > 0 && w <= max && !vals.includes(w)) vals.push(w);
  return choicesFrom(vals.sort((a, b) => a - b));
}
/** k different whole numbers from lo to hi (in random order). */
const distinct = (rng: Rng, k: number, lo: number, hi: number) => rng.shuffle(range(lo, hi)).slice(0, k);
/** Two different indices below k. */
function twoOf(rng: Rng, k: number): [number, number] { const [i, j] = rng.shuffle(range(0, k - 1)); return [i, j]; }
const argMax = (xs: number[]) => xs.indexOf(Math.max(...xs));
const argMin = (xs: number[]) => xs.indexOf(Math.min(...xs));

/* ------------------------------------------------------------------ */
/* Chart stories                                                       */
/* ------------------------------------------------------------------ */

/** who: rows are children ("How many apples did Mia pick?"); day: rows are days; vote: rows are choices, counted in votes. */
type Mode = 'who' | 'day' | 'vote';
interface Ctx { title: string; icon: ContestIcon; one: string; many: string; mode: Mode; verb: string; past: string; what: string; rows: string[] }
const KIDS = ['Mia', 'Leo', 'Ava', 'Sam', 'Zoe', 'Max', 'Ivy', 'Ben', 'Kai', 'Nia'];
const DAYS = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday'];
const who = (title: string, icon: ContestIcon, one: string, many: string, verb: string, past: string): Ctx => ({ title, icon, one, many, mode: 'who', verb, past, what: 'friend', rows: KIDS });
const day = (title: string, icon: ContestIcon, one: string, many: string, verb: string, past: string): Ctx => ({ title, icon, one, many, mode: 'day', verb, past, what: 'day', rows: DAYS });
const vote = (title: string, what: string, rows: string[]): Ctx => ({ title, icon: 'person', one: 'vote', many: 'votes', mode: 'vote', verb: 'get', past: 'got', what, rows });

const PICTO_CTX: Ctx[] = [
  who('Apples picked', 'apple', 'apple', 'apples', 'pick', 'picked'),
  who('Books read', 'book', 'book', 'books', 'read', 'read'),
  who('Fish caught', 'fish', 'fish', 'fish', 'catch', 'caught'),
  who('Flowers planted', 'flower', 'flower', 'flowers', 'plant', 'planted'),
  who('Stars earned', 'star', 'star', 'stars', 'earn', 'earned'),
  day('Cookies baked', 'cookie', 'cookie', 'cookies', 'bake', 'baked'),
  day('Kites sold', 'kite', 'kite', 'kites', 'sell', 'sold'),
  day('Cars seen', 'car', 'car', 'cars', 'see', 'seen'),
  vote('Favorite pet', 'pet', ['Cats', 'Dogs', 'Fish', 'Birds', 'Frogs']),
  vote('Favorite fruit', 'fruit', ['Apples', 'Pears', 'Grapes', 'Plums', 'Kiwis']),
  vote('Favorite color', 'color', ['Red', 'Blue', 'Green', 'Yellow', 'Purple']),
];
/** Bar charts: short row names so five bars fit side by side on a phone. */
const BAR_CTX: Ctx[] = [
  who('Cans collected', 'juice', 'can', 'cans', 'collect', 'collected'),
  who('Laps run', 'shoe', 'lap', 'laps', 'run', 'ran'),
  who('Tickets sold', 'star', 'ticket', 'tickets', 'sell', 'sold'),
  who('Points scored', 'ball', 'point', 'points', 'score', 'scored'),
  vote('Favorite sport', 'sport', ['Soccer', 'Tennis', 'Chess', 'Hockey', 'Dance']),
  vote('Favorite snack', 'snack', ['Apples', 'Popcorn', 'Grapes', 'Carrots', 'Nuts']),
  vote('Favorite color', 'color', ['Red', 'Blue', 'Green', 'Yellow', 'Purple']),
];

const things = (c: Ctx, n: number) => unit(n, c.one, c.many);
/** How a row is named inside a sentence. */
const nm = (c: Ctx, r: string) => (c.mode === 'vote' ? lc(r) : r);
/** "apples Mia picked", "cookies baked on Monday", "votes for dogs". */
const rowLab = (c: Ctx, r: string, n: number) => (c.mode === 'who' ? `${things(c, n)} ${r} ${c.past}` : c.mode === 'day' ? `${things(c, n)} ${c.past} on ${r}` : `${things(c, n)} for ${lc(r)}`);
const rowName = (c: Ctx, r: string) => (c.mode === 'who' ? `${r}'s row` : `the ${nm(c, r)} row`);
const barName = (c: Ctx, r: string) => (c.mode === 'who' ? `${r}'s bar` : `the ${nm(c, r)} bar`);
/** "did Mia pick", "did dogs get". */
const did = (c: Ctx, r: string) => `did ${nm(c, r)} ${c.verb}`;
const didPair = (c: Ctx, a: string, b: string) => `did ${nm(c, a)} and ${nm(c, b)} ${c.verb}`;

const Q = {
  howMany: (c: Ctx, r: string) => (c.mode === 'day' ? `How many ${c.many} were ${c.past} on ${r}?` : `How many ${c.many} ${did(c, r)}?`),
  most: (c: Ctx, most: boolean) => {
    const w = most ? 'most' : 'fewest';
    return c.mode === 'who' ? `Who ${c.past} the ${w} ${c.many}?` : c.mode === 'day' ? `On which day were the ${w} ${c.many} ${c.past}?` : `Which ${c.what} got the ${w} votes?`;
  },
  more: (c: Ctx, a: string, b: string) => (c.mode === 'day' ? `How many more ${c.many} were ${c.past} on ${a} than on ${b}?` : `How many more ${c.many} ${did(c, a)} than ${nm(c, b)}?`),
  both: (c: Ctx, a: string, b: string) => (c.mode === 'day' ? `How many ${c.many} were ${c.past} on ${a} and ${b} in all?` : `How many ${c.many} ${didPair(c, a, b)} in all?`),
  all: (c: Ctx) => (c.mode === 'who' ? `How many ${c.many} did they ${c.verb} in all?` : c.mode === 'day' ? `How many ${c.many} were ${c.past} in all?` : 'How many votes were there in all?'),
  twoStep: (c: Ctx, a: string, b: string, l: string) => (c.mode === 'day' ? `How many more ${c.many} were ${c.past} on ${a} and ${b} together than on ${l}?` : `How many more ${c.many} ${didPair(c, a, b)} together than ${nm(c, l)}?`),
  pictures: (c: Ctx, r: string, n: number) => (c.mode === 'who' ? `${r} ${c.past} ${n} ${c.many}.` : c.mode === 'day' ? `On ${r}, ${n} ${c.many} were ${c.past}.` : `${r} got ${n} votes.`),
  fraction: (c: Ctx, r: string) => `What fraction of all the ${c.many} ${did(c, r)}?`,
  percent: (c: Ctx, r: string) => `What percent of all the ${c.many} ${did(c, r)}?`,
  times: (c: Ctx, a: string, b: string) => `How many times as many ${c.many} ${did(c, a)} as ${nm(c, b)}?`,
  pair: (c: Ctx, n: number) => (c.mode === 'vote' ? `Which two ${c.what}s got ${n} votes together?` : `Which two friends ${c.past} ${n} ${c.many} together?`),
};

/** Rows for a chart: days stay in order, other rows are shuffled. */
function pickRows(c: Ctx, k: number, rng: Rng): string[] {
  if (c.mode === 'day') { const s = rng.int(0, c.rows.length - k); return c.rows.slice(s, s + k); }
  return rng.shuffle(c.rows).slice(0, k);
}
const chart = (c: Ctx, names: string[], counts: number[], key: number, extra: Partial<Picto> = {}): Picto => ({ type: 'picto', title: c.title, icon: c.icon, key, rows: names.map((label, i) => ({ label, n: counts[i] })), ...extra });

/** A tally row read aloud: "Mia's row: 5 (marks) + 2 (marks) = 7 (apples Mia picked)." */
function tallyRead(whoText: string, n: number, label: string): string {
  const b = Math.floor(n / 5), r = n % 5;
  if (!b) return `${whoText}: count the marks one by one, ${lab(n, label)}.`;
  if (b === 1 && !r) return `${whoText}: one bundle of five marks is ${lab(n, label)}.`;
  const terms = [...Array.from({ length: b }, () => lab(5, 'marks')), ...(r ? [labn(r, 'mark')] : [])];
  return `${whoText}: ${terms.join(' + ')} = ${lab(n, label)}.`;
}

/* ------------------------------------------------------------------ */
/* Pictographs and tallies (Grades 1, 3)                               */
/* ------------------------------------------------------------------ */

function pictoQ(d: number, rng: Rng): ContestSpec {
  return d <= 2 ? pictoG1(d, rng) : pictoG3(d, rng);
}

/** Grade 1: one picture is one thing, or a tally chart; numbers to 20, tap answers. */
function pictoG1(d: number, rng: Rng): ContestSpec {
  const type = rng.pick(d === 1 ? ['count', 'count', 'most', 'fewest', 'match'] : ['count', 'more', 'more', 'both', 'most', 'fewest', 'match']);
  if (type === 'match') return matchQ(d, rng);
  const c = rng.pick(PICTO_CTX);
  const tally = rng.chance(d === 1 ? 0.25 : 0.45);
  const k = d === 1 ? rng.int(2, 3) : rng.int(3, 4);
  const names = pickRows(c, k, rng);
  const hi = type === 'both' ? 10 : tally ? (d === 1 ? 9 : 14) : d === 1 ? 8 : 10;
  const counts = distinct(rng, k, d === 1 ? 1 : 2, hi);
  const v = chart(c, names, counts, 1, tally ? { tally: true } : {});
  const kindOf = tally ? 'tally chart' : 'picture chart';
  const read = (i: number) => (tally ? tallyRead(cap(rowName(c, names[i])), counts[i], rowLab(c, names[i], counts[i])) : `Count the pictures in ${rowName(c, names[i])}: ${lab(counts[i], rowLab(c, names[i], counts[i]))}.`);
  const nChoices = d === 1 ? 3 : 4;

  if (type === 'most' || type === 'fewest') {
    const most = type === 'most';
    const t = most ? argMax(counts) : argMin(counts);
    const prompt = Q.most(c, most);
    return {
      prompt, readAloud: `Look at the ${kindOf}. ${prompt} Tap the answer.`, expression: `the ${most ? 'most' : 'fewest'} ${c.many} = ?`, answer: t + 1, difficulty: d as Difficulty,
      hint: tally ? 'Count the marks in each row. A bundle with a line across is five.' : `All the pictures are the same size. Look for the ${most ? 'longest' : 'shortest'} row.`,
      steps: [
        `Count each row: ${names.map((r, j) => `${r} ${lab(counts[j], things(c, counts[j]))}`).join(', ')}.`,
        `${lab(counts[t], things(c, counts[t]))} is the ${most ? 'most' : 'fewest'}, so the answer is ${names[t]}.`,
      ],
      visual: v, solutionVisual: { ...v, values: true, highlight: [t] },
      choices: names.map((r, j) => ({ value: j + 1, label: r })),
    };
  }
  if (type === 'more') {
    const [x, y] = twoOf(rng, k); const [i, j] = counts[x] > counts[y] ? [x, y] : [y, x];
    const diff = counts[i] - counts[j];
    const prompt = Q.more(c, names[i], names[j]);
    return {
      prompt, readAloud: `Look at the ${kindOf}. ${prompt}`, expression: `more ${c.many} = ?`, answer: diff, difficulty: d as Difficulty,
      hint: tally ? 'Count both rows. Then count up from the smaller number to the bigger one.' : 'Line up the two rows. Count the extra pictures in the longer row.',
      steps: [read(i), read(j), `${lab(counts[i], things(c, counts[i]))} − ${lab(counts[j], things(c, counts[j]))} = ${lab(diff, `more ${things(c, diff)}`)}.`],
      visual: v, solutionVisual: { ...v, values: true, highlight: [i, j] },
      choices: numberChoices(diff, [counts[i], counts[i] + counts[j], diff + 1, diff - 1], nChoices, 20),
    };
  }
  if (type === 'both') {
    const [i, j] = twoOf(rng, k); const s = counts[i] + counts[j];
    const prompt = Q.both(c, names[i], names[j]);
    return {
      prompt, readAloud: `Look at the ${kindOf}. ${prompt}`, expression: `${c.many} in all = ?`, answer: s, difficulty: d as Difficulty,
      hint: 'Count both rows, then put them together.',
      steps: [read(i), read(j), `${lab(counts[i], things(c, counts[i]))} + ${lab(counts[j], things(c, counts[j]))} = ${lab(s, `${things(c, s)} in all`)}.`],
      visual: v, solutionVisual: { ...v, values: true, highlight: [i, j] },
      choices: numberChoices(s, [s - 1, s + 1, Math.max(counts[i], counts[j]), Math.abs(counts[i] - counts[j])], nChoices, 20),
    };
  }
  const i = rng.int(0, k - 1); const n = counts[i];
  const prompt = Q.howMany(c, names[i]);
  return {
    prompt, readAloud: `Look at the ${kindOf}. ${prompt}`, expression: `${rowLab(c, names[i], 2)} = ?`, answer: n, difficulty: d as Difficulty,
    hint: tally ? 'A bundle of marks with a line across is five. Count by fives, then count on.' : `Find the row for ${names[i]}. Touch each picture once as you count.`,
    steps: tally ? [read(i)] : [`Each picture is ${lab(1, c.one)}.`, read(i)],
    visual: v, solutionVisual: { ...v, values: true, highlight: [i] },
    choices: numberChoices(n, [n - 1, n + 1, ...counts.filter((x) => x !== n)], nChoices, 20),
  };
}

/** Grade 1: count the pictures, then tap the tally that shows the same number. */
function matchQ(d: number, rng: Rng): ContestSpec {
  const c = rng.pick(PICTO_CTX.filter((x) => x.mode === 'who'));
  const r = rng.pick(KIDS);
  const n = d === 1 ? rng.int(3, 8) : rng.int(6, 10);
  const wrong = rng.shuffle([n - 2, n - 1, n + 1, n + 2].filter((x) => x >= 1)).slice(0, 2);
  const opts = rng.shuffle([n, ...wrong]);
  const right = opts.indexOf(n);
  const tallyPic = (m: number): Picto => ({ type: 'picto', title: '', icon: c.icon, key: 1, rows: [{ label: '', n: m }], tally: true });
  const v = chart(c, [r], [n], 1);
  return {
    prompt: `${r} ${c.past} these ${c.many}. Which tally shows how many?`,
    readAloud: `${r} ${c.past} these ${c.many}. Count them. Which tally shows the same number? Tap it.`,
    expression: 'the matching tally = ?', answer: right + 1, difficulty: d as Difficulty,
    hint: 'Count the pictures first. Then count the marks in each tally. A bundle is five.',
    steps: [`Count the pictures: ${lab(n, rowLab(c, r, n))}.`, tallyRead(`Tally ${LETTERS[right]}`, n, 'marks'), `So tally ${LETTERS[right]} matches.`],
    visual: v, solutionVisual: chart(c, [r], [n], 1, { tally: true, values: true }),
    choices: opts.map((m, j) => ({ value: j + 1, label: `Tally ${LETTERS[j]}`, visual: tallyPic(m) })),
  };
}

/** Grade 3: a key of 2, 4, 5 or 10, with half pictures for half a key. */
function pictoG3(d: number, rng: Rng): ContestSpec {
  const c = rng.pick(PICTO_CTX);
  const key = d === 3 ? rng.pick([2, 2, 5, 5, 10]) : rng.pick([2, 4, 5, 10]);
  const halves = key % 2 === 0 && (d === 4 || rng.chance(0.5));
  const stepAmt = halves ? key / 2 : key;
  const k = d === 3 ? rng.int(3, 4) : rng.int(4, 5);
  const names = pickRows(c, k, rng);
  // at least one whole picture and at most nine pictures in a row
  const counts = distinct(rng, k, key / stepAmt, Math.floor((9 * key) / stepAmt)).map((u) => u * stepAmt);
  const type = rng.pick(d === 3 ? ['count', 'count', 'more', 'both', 'all', 'pictures'] : ['all', 'more', 'twoStep', 'pictures', 'count']);
  const choices = d === 3 && rng.chance(0.5);
  const keyLine = `The key: each picture stands for ${lab(key, c.many)}${halves ? `, so a half picture stands for ${lab(key / 2, things(c, key / 2))}` : ''}.`;
  const rowCalc = (i: number) => {
    const n = counts[i], whole = Math.floor(n / key), rest = n - whole * key;
    const lhs = `${labn(whole, 'picture')} × ${lab(key, `${c.many} each`)}`;
    return `${cap(rowName(c, names[i]))}: ${lhs}${rest ? ` + ${lab(rest, 'for the half picture')}` : ''} = ${lab(n, rowLab(c, names[i], n))}.`;
  };
  const pics = (n: number) => Math.ceil(n / key);
  const v = chart(c, names, counts, key);
  const base = { difficulty: d as Difficulty, visual: v };

  if (type === 'pictures') {
    const i = rng.int(0, k - 1);
    const others = new Set(counts.filter((_, j) => j !== i));
    const u = rng.pick(range(2, 8).filter((x) => !others.has(x * key)));
    counts[i] = u * key;
    const n = counts[i];
    const pv = chart(c, names, counts, key, { ask: i });
    return {
      ...base, visual: pv,
      prompt: `${Q.pictures(c, names[i], n)} How many pictures go in ${rowName(c, names[i])}?`,
      expression: 'pictures in the row = ?', answer: u,
      hint: 'Each picture stands for the key amount. How many of those make the whole amount?',
      steps: [
        `The key: each picture stands for ${lab(key, c.many)}.`,
        `${lab(n, rowLab(c, names[i], n))} ÷ ${lab(key, `${c.many} in each picture`)} = ${lab(u, 'pictures')}.`,
        `Check: ${lab(u, 'pictures')} × ${lab(key, `${c.many} each`)} = ${lab(n, c.many)}.`,
      ],
      solutionVisual: { ...pv, ask: undefined, values: true, highlight: [i] },
      choices: choices ? numberChoices(u, [n, u + 1, u - 1, u * 2], 4) : undefined,
    };
  }
  if (type === 'more' || type === 'twoStep') {
    if (type === 'twoStep') {
      let [i, j, l] = rng.shuffle(range(0, k - 1));
      if (counts[i] + counts[j] <= counts[l]) { const tri = [i, j, l].sort((a, b) => counts[a] - counts[b]); [l, i, j] = tri; }
      const ans = counts[i] + counts[j] - counts[l];
      const s = counts[i] + counts[j];
      return {
        ...base,
        prompt: `Use the key. ${Q.twoStep(c, names[i], names[j], names[l])}`, expression: `more ${c.many} = ?`, answer: ans,
        hint: 'Read each row with the key. Add the two rows, then take away the third.',
        steps: [keyLine, rowCalc(i), rowCalc(j), rowCalc(l), `${lab(counts[i], c.many)} + ${lab(counts[j], c.many)} = ${lab(s, `${c.many} together`)}.`, `${lab(s, `${c.many} together`)} − ${lab(counts[l], things(c, counts[l]))} = ${lab(ans, `more ${things(c, ans)}`)}.`],
        solutionVisual: { ...v, values: true, highlight: [i, j, l] },
      };
    }
    const [x, y] = twoOf(rng, k); const [i, j] = counts[x] > counts[y] ? [x, y] : [y, x];
    const diff = counts[i] - counts[j];
    const extra = diff / key;
    const steps = [keyLine, rowCalc(i), rowCalc(j), `${lab(counts[i], c.many)} − ${lab(counts[j], things(c, counts[j]))} = ${lab(diff, `more ${things(c, diff)}`)}.`];
    if (Number.isInteger(extra)) steps.push(`Quick check: ${rowName(c, names[i])} has ${lab(extra, unit(extra, 'more picture', 'more pictures'))}, and ${labn(extra, 'picture')} × ${lab(key, `${c.many} each`)} = ${lab(diff, `more ${things(c, diff)}`)}.`);
    return {
      ...base,
      prompt: `Use the key. ${Q.more(c, names[i], names[j])}`, expression: `more ${c.many} = ?`, answer: diff,
      hint: 'Read both rows with the key, then subtract. Or count the extra pictures and use the key.',
      steps, solutionVisual: { ...v, values: true, highlight: [i, j] },
      choices: choices ? numberChoices(diff, [pics(counts[i]) - pics(counts[j]), counts[i] + counts[j], diff + stepAmt, diff - stepAmt], 4) : undefined,
    };
  }
  if (type === 'both' || type === 'all') {
    const idx = type === 'both' ? twoOf(rng, k) : range(0, k - 1);
    const s = sumOf(idx.map((i) => counts[i]));
    const steps = [keyLine, ...idx.map(rowCalc), `${idx.map((i) => lab(counts[i], things(c, counts[i]))).join(' + ')} = ${lab(s, `${c.many} in all`)}.`];
    const totPics = s / key;
    if (type === 'all' && Number.isInteger(totPics)) {
      const anyHalf = counts.some((n) => n % key);
      steps.push(`Quick check: there are ${lab(totPics, 'pictures')} in all${anyHalf ? ', counting two half pictures as one' : ''}, and ${lab(totPics, 'pictures')} × ${lab(key, `${c.many} each`)} = ${lab(s, `${c.many} in all`)}.`);
    }
    return {
      ...base,
      prompt: `Use the key. ${type === 'both' ? Q.both(c, names[idx[0]], names[idx[1]]) : Q.all(c)}`, expression: `${c.many} in all = ?`, answer: s,
      hint: type === 'both' ? 'Read the two rows with the key, then add.' : 'Read every row with the key, then add. Or count all the pictures and use the key.',
      steps, solutionVisual: { ...v, values: true, highlight: idx },
      choices: choices ? numberChoices(s, [sumOf(idx.map((i) => pics(counts[i]))), s + stepAmt, s - stepAmt, s + key], 4) : undefined,
    };
  }
  // count one row; prefer a row that ends in a half picture
  const withHalf = range(0, k - 1).filter((i) => counts[i] % key);
  const i = withHalf.length && rng.chance(0.7) ? rng.pick(withHalf) : rng.int(0, k - 1);
  const n = counts[i]; const whole = Math.floor(n / key);
  return {
    ...base,
    prompt: `Use the key. ${Q.howMany(c, names[i])}`, expression: `${rowLab(c, names[i], 2)} = ?`, answer: n,
    hint: halves ? 'Check the key first. A half picture stands for half as many.' : 'Check the key first: one picture can stand for more than one.',
    steps: [keyLine, rowCalc(i)], solutionVisual: { ...v, values: true, highlight: [i] },
    choices: choices ? numberChoices(n, [pics(n), whole * key, (whole + 1) * key, n + key], 4) : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Bar charts (Grades 3, 5)                                            */
/* ------------------------------------------------------------------ */

const BAR_SCALE: Record<number, { steps: number[]; half: number; rows: [number, number]; top: number }> = {
  3: { steps: [2, 5, 10], half: 0, rows: [3, 4], top: 10 },
  4: { steps: [2, 5, 10, 10, 20], half: 0.7, rows: [4, 4], top: 10 },
  5: { steps: [20, 25, 50], half: 0.6, rows: [4, 5], top: 8 },
  6: { steps: [25, 50, 100], half: 0.7, rows: [5, 5], top: 8 },
};
interface BarSet { c: Ctx; names: string[]; counts: number[]; step: number; halves: boolean }
function barSet(d: number, rng: Rng): BarSet {
  const s = BAR_SCALE[d];
  const c = rng.pick(BAR_CTX);
  const step = rng.pick(s.steps);
  const halves = step % 2 === 0 && rng.chance(s.half);
  const unitAmt = halves ? step / 2 : step;
  const k = rng.int(s.rows[0], s.rows[1]);
  const names = pickRows(c, k, rng);
  const counts = distinct(rng, k, step / unitAmt, (s.top * step) / unitAmt).map((u) => u * unitAmt);
  return { c, names, counts, step, halves };
}
/** A whole fraction a/b in lowest terms, as text. */
const lowest = (a: number, b: number) => { const g = gcd(a, b); return `${a / g}/${b / g}`; };

function barQ(d: number, rng: Rng): ContestSpec {
  const type = rng.pick(d === 3 ? ['read', 'read', 'more', 'both'] : d === 4 ? ['all', 'more', 'twoStep', 'read'] : d === 5 ? ['fraction', 'pair', 'all', 'more'] : ['fraction', 'pair', 'times', 'percent']);
  let set = barSet(d, rng);
  let target = 0;
  // the grade 5 questions need tidy numbers: a small fraction, a whole percent, one pair, a whole "times"
  if (type === 'fraction' || type === 'percent') {
    for (let t = 0; t < 300; t++) {
      const T = sumOf(set.counts);
      const ok = set.counts.map((n, i) => ({ n, i })).filter(({ n }) => (type === 'fraction' ? T / gcd(n, T) <= 12 : (n * 100) % T === 0 && n * 100 >= 5 * T));
      if (ok.length) { target = rng.pick(ok).i; break; }
      set = barSet(d, rng);
      if (t === 299) { set.counts = (set.counts.length === 5 ? [2, 3, 5, 4, 6] : [3, 4, 5, 8]).map((x) => x * set.step); target = 2; }
    }
  }
  let pairIdx: [number, number] = [0, 1];
  if (type === 'pair') {
    for (let t = 0; t < 300; t++) {
      const [i, j] = twoOf(rng, set.counts.length); const N = set.counts[i] + set.counts[j];
      let same = 0;
      for (let a = 0; a < set.counts.length; a++) for (let b = a + 1; b < set.counts.length; b++) if (set.counts[a] + set.counts[b] === N) same++;
      if (same === 1) { pairIdx = [i, j]; break; }
      set = barSet(d, rng);
      if (t === 299) { set.counts = [1, 2, 4, 7, 8].slice(0, set.counts.length).map((x) => x * set.step); pairIdx = [0, 1]; }
    }
  }
  if (type === 'times') {
    const { counts, step } = set; const top = BAR_SCALE[d].top;
    const unitAmt = set.halves ? step / 2 : step;
    const [i, j] = twoOf(rng, counts.length);
    const kTimes = rng.int(2, 4);
    counts[j] = step * rng.int(1, Math.floor(top / kTimes)); counts[i] = counts[j] * kTimes;
    const used = new Set([counts[i], counts[j]]);
    counts.forEach((val, x) => {
      if (x === i || x === j) return;
      while (used.has(val)) val = unitAmt * rng.int(step / unitAmt, (top * step) / unitAmt);
      counts[x] = val; used.add(val);
    });
    pairIdx = [i, j];
  }
  const { c, names, counts, step, halves } = set;
  const k = names.length;
  const v = chart(c, names, counts, 1, { bar: step });
  const scaleLine = `The scale goes up by ${lab(step, c.many)} at each grid line.`;
  const readBar = (i: number) => {
    const n = counts[i], lo = Math.floor(n / step) * step;
    const who = cap(barName(c, names[i]));
    return n === lo ? `${who} ends on the line for ${lab(n, rowLab(c, names[i], n))}.` : `${who} ends halfway between ${lab(lo, 'the line below')} and ${lab(lo + step, 'the line above')}: ${lab(lo, 'the line below')} + ${lab(step / 2, 'half a step')} = ${lab(n, rowLab(c, names[i], n))}.`;
  };
  const listAll = `Read each bar: ${names.map((r, j) => `${r} ${lab(counts[j], things(c, counts[j]))}`).join(', ')}.`;
  const T = sumOf(counts);
  const totalLine = `In all: ${counts.map((n) => lab(n, things(c, n))).join(' + ')} = ${lab(T, `${c.many} in all`)}.`;
  const hintRead = `Go from the top of each bar straight across to the scale. Check what each grid line is worth${halves ? '; a bar can end halfway between two lines' : ''}.`;
  const base = { difficulty: d as Difficulty, visual: v };
  const choices = d === 3 && rng.chance(0.5);

  if (type === 'fraction') {
    const i = target; const n = counts[i];
    const g = gcd(n, T);
    const steps = [scaleLine, listAll, totalLine, `${cap(barName(c, names[i]))} shows ${lab(n, rowLab(c, names[i], n))} out of ${lab(T, `${c.many} in all`)}: that is ${n}/${T} (of all the ${c.many}).`];
    if (g > 1) steps.push(`Divide the top and the bottom by ${lab(g, 'the biggest shared factor')}: ${n}/${T} (of all the ${c.many}) = ${lowest(n, T)} (in lowest terms).`);
    return {
      ...base, prompt: `${Q.fraction(c, names[i])} Give the fraction in lowest terms.`, expression: `${rowLab(c, names[i], 2)} ÷ all ${c.many} = ?`,
      answer: n / T, fraction: true, answerText: lowest(n, T),
      hint: `${hintRead} Then compare one bar with the total of all the bars.`, steps, solutionVisual: { ...v, values: true, highlight: [i] },
    };
  }
  if (type === 'percent') {
    const i = target; const n = counts[i]; const p = (n * 100) / T;
    return {
      ...base, prompt: Q.percent(c, names[i]), expression: `${rowLab(c, names[i], 2)} ÷ all ${c.many} × 100 = ?`, answer: p, unit: '%',
      hint: `${hintRead} Then find what part of the total that bar is, out of a hundred.`,
      steps: [scaleLine, listAll, totalLine, `${lab(n, rowLab(c, names[i], n))} ÷ ${lab(T, `${c.many} in all`)} = ${lowest(n, T)} (of all the ${c.many}).`, `A percent is out of a hundred: ${lowest(n, T)} (of all the ${c.many}) = ${p}/100 (of all the ${c.many}) = ${p}% (of all the ${c.many}).`],
      solutionVisual: { ...v, values: true, highlight: [i] },
    };
  }
  if (type === 'pair') {
    const [i, j] = pairIdx; const N = counts[i] + counts[j];
    const allPairs: [number, number][] = [];
    for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) allPairs.push([a, b]);
    const wrong = allPairs.filter(([a, b]) => counts[a] + counts[b] !== N).sort((p1, p2) => Math.abs(counts[p1[0]] + counts[p1[1]] - N) - Math.abs(counts[p2[0]] + counts[p2[1]] - N)).slice(0, 3);
    const opts = rng.shuffle([[Math.min(i, j), Math.max(i, j)] as [number, number], ...wrong]);
    const right = opts.findIndex(([a, b]) => counts[a] + counts[b] === N);
    const near = wrong[0];
    const steps = [scaleLine, listAll, `${names[i]} and ${names[j]}: ${lab(counts[i], things(c, counts[i]))} + ${lab(counts[j], things(c, counts[j]))} = ${lab(N, `${c.many} together`)}.`];
    if (near) steps.push(`Close, but not it: ${names[near[0]]} and ${names[near[1]]} make ${lab(counts[near[0]] + counts[near[1]], c.many)}.`);
    return {
      ...base, prompt: Q.pair(c, N), expression: `two bars = ${N}`, answer: right + 1,
      hint: `${hintRead} Then try pairs: which two add up exactly?`,
      steps, solutionVisual: { ...v, values: true, highlight: [i, j] },
      choices: opts.map(([a, b], x) => ({ value: x + 1, label: `${names[a]} and ${names[b]}` })),
    };
  }
  if (type === 'times') {
    const [i, j] = pairIdx; const r = counts[i] / counts[j];
    return {
      ...base, prompt: Q.times(c, names[i], names[j]), expression: `${nm(c, names[i])} ÷ ${nm(c, names[j])} = ?`, answer: r,
      hint: `${hintRead} Then ask how many of the shorter bar fit into the taller bar.`,
      steps: [scaleLine, readBar(i), readBar(j), `${lab(counts[i], c.many)} ÷ ${lab(counts[j], c.many)} = ${lab(r, 'times as many')}.`],
      solutionVisual: { ...v, values: true, highlight: [i, j] },
    };
  }
  if (type === 'more' || type === 'twoStep') {
    if (type === 'twoStep') {
      let [i, j, l] = rng.shuffle(range(0, k - 1));
      if (counts[i] + counts[j] <= counts[l]) { const tri = [i, j, l].sort((a, b) => counts[a] - counts[b]); [l, i, j] = tri; }
      const s = counts[i] + counts[j]; const ans = s - counts[l];
      return {
        ...base, prompt: Q.twoStep(c, names[i], names[j], names[l]), expression: `more ${c.many} = ?`, answer: ans,
        hint: `${hintRead} Add the two bars, then take away the third.`,
        steps: [scaleLine, readBar(i), readBar(j), readBar(l), `${lab(counts[i], c.many)} + ${lab(counts[j], c.many)} = ${lab(s, `${c.many} together`)}.`, `${lab(s, `${c.many} together`)} − ${lab(counts[l], c.many)} = ${lab(ans, `more ${things(c, ans)}`)}.`],
        solutionVisual: { ...v, values: true, highlight: [i, j, l] },
      };
    }
    const [x, y] = twoOf(rng, k); const [i, j] = counts[x] > counts[y] ? [x, y] : [y, x];
    const diff = counts[i] - counts[j];
    return {
      ...base, prompt: Q.more(c, names[i], names[j]), expression: `more ${c.many} = ?`, answer: diff,
      hint: `${hintRead} Then subtract the shorter bar from the taller one.`,
      steps: [scaleLine, readBar(i), readBar(j), `${lab(counts[i], c.many)} − ${lab(counts[j], c.many)} = ${lab(diff, `more ${things(c, diff)}`)}.`],
      solutionVisual: { ...v, values: true, highlight: [i, j] },
      choices: choices ? numberChoices(diff, [counts[i], counts[i] + counts[j], diff + step, diff - step], 4) : undefined,
    };
  }
  if (type === 'both' || type === 'all') {
    const idx = type === 'both' ? twoOf(rng, k) : range(0, k - 1);
    const s = sumOf(idx.map((i) => counts[i]));
    return {
      ...base, prompt: type === 'both' ? Q.both(c, names[idx[0]], names[idx[1]]) : Q.all(c), expression: `${c.many} in all = ?`, answer: s,
      hint: `${hintRead} Then add.`,
      steps: [scaleLine, ...idx.map(readBar), `${idx.map((i) => lab(counts[i], things(c, counts[i]))).join(' + ')} = ${lab(s, `${c.many} in all`)}.`],
      solutionVisual: { ...v, values: true, highlight: idx },
      choices: choices ? numberChoices(s, [s - step, s + step, Math.max(...idx.map((i) => counts[i]))], 4) : undefined,
    };
  }
  // read one bar; prefer a bar that ends halfway
  const mid = range(0, k - 1).filter((i) => counts[i] % step);
  const i = mid.length && rng.chance(0.7) ? rng.pick(mid) : rng.int(0, k - 1);
  const n = counts[i];
  return {
    ...base, prompt: Q.howMany(c, names[i]), expression: `${rowLab(c, names[i], 2)} = ?`, answer: n,
    hint: hintRead, steps: [scaleLine, readBar(i)], solutionVisual: { ...v, values: true, highlight: [i] },
    choices: choices ? numberChoices(n, [n - step, n + step, n / step], 4) : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Pie charts (Grade 5)                                                */
/* ------------------------------------------------------------------ */

interface PieCtx { title: string; who: string; one: string; intro: (n?: number) => string; slices: [string, string][] }
const PIE_CTX: PieCtx[] = [
  { title: 'How we get to school', who: 'students', one: 'student', intro: (n) => (n ? `The pie chart shows how ${n} students get to school.` : 'The pie chart shows how a class gets to school.'), slices: [['Walk', 'walk to school'], ['Bus', 'take the bus'], ['Car', 'come by car'], ['Bike', 'ride a bike']] },
  { title: 'Favorite fruit', who: 'children', one: 'child', intro: (n) => (n ? `The pie chart shows the favorite fruit of ${n} children.` : 'The pie chart shows the favorite fruit of a class.'), slices: [['Apples', 'chose apples'], ['Grapes', 'chose grapes'], ['Pears', 'chose pears'], ['Plums', 'chose plums'], ['Kiwis', 'chose kiwis']] },
  { title: 'Favorite sport', who: 'students', one: 'student', intro: (n) => (n ? `The pie chart shows the favorite sport of ${n} students.` : 'The pie chart shows the favorite sport of a school.'), slices: [['Soccer', 'chose soccer'], ['Tennis', 'chose tennis'], ['Chess', 'chose chess'], ['Hockey', 'chose hockey'], ['Dance', 'chose dance']] },
  { title: 'Lunch order', who: 'children', one: 'child', intro: (n) => (n ? `The pie chart shows the lunch order of ${n} children.` : 'The pie chart shows the lunch order of a class.'), slices: [['Pizza', 'chose pizza'], ['Pasta', 'chose pasta'], ['Salad', 'chose salad'], ['Soup', 'chose soup']] },
];
/** Split `whole` into `n` positive whole parts (random sizes). */
function split(rng: Rng, whole: number, n: number, min = 1): number[] {
  const cuts = rng.shuffle(range(1, whole / min - 1)).slice(0, n - 1).sort((a, b) => a - b).map((x) => x * min);
  const marks = [0, ...cuts, whole];
  return marks.slice(1).map((m, i) => m - marks[i]);
}
const pct = (p: number) => `${p}%`;

function pieQ(d: number, rng: Rng): ContestSpec {
  const type = rng.pick(d === 5 ? ['parts', 'parts', 'pctRead', 'pctCount'] : ['reverse', 'missing', 'diff', 'parts', 'pctRead']);
  const c = rng.pick(PIE_CTX);
  const pctPie = type === 'pctCount' || type === 'missing' || type === 'diff';
  const den = pctPie ? 100 : type === 'pctRead' ? rng.pick([4, 5, 10]) : rng.pick(d === 5 ? [4, 8, 8, 10] : [5, 8, 10, 10]);
  const nSlices = pctPie ? rng.int(3, 4) : den === 4 ? rng.int(2, 3) : den === 5 ? 3 : rng.int(3, 4);
  const chosen = rng.shuffle(c.slices).slice(0, nSlices);
  let sizes = pctPie ? split(rng, 100, nSlices, 5) : split(rng, den, nSlices);
  // percents of at least 10 so every slice can be labelled, and (for "how many more") two different slices
  for (let t = 0; pctPie && t < 100 && (sizes.some((x) => x < 10) || new Set(sizes).size < 2); t++) sizes = split(rng, 100, nSlices, 5);
  if (pctPie && sizes.some((x) => x < 10)) sizes = rng.shuffle(nSlices === 3 ? [45, 35, 20] : [35, 30, 20, 15]);
  const labels = chosen.map(([l]) => l);
  const t = rng.int(0, nSlices - 1);
  const [tl, tp] = chosen[t];
  const pie = (extra: Partial<Pie> = {}): Pie => ({ type: 'pie', title: c.title, slices: labels.map((label, i) => ({ label, v: sizes[i] })), ...extra });
  const base = { difficulty: d as Difficulty };
  const W = c.who;

  if (type === 'parts' || type === 'reverse') {
    const m = d === 5 ? rng.int(2, 10) : rng.int(3, 12);
    const T = den * m; const k = sizes[t]; const cnt = k * m;
    const v = pie({ parts: den });
    const sol = pie({ parts: den, highlight: t, slices: labels.map((label, i) => ({ label: `${label} ${sizes[i] * m}`, v: sizes[i] })) });
    if (type === 'reverse') {
      return {
        ...base, visual: v, solutionVisual: sol,
        prompt: `${c.intro()} The ${tl} slice stands for ${cnt} ${W}. How many ${W} are there in all?`, expression: `${W} in all = ?`, answer: T,
        hint: 'Count the equal parts in the slice and in the whole pie. Find one part first.',
        steps: [
          `The guide lines cut the pie into ${lab(den, 'equal parts')}, and the ${tl} slice covers ${labn(k, 'part')}.`,
          `One part: ${lab(cnt, W)} ÷ ${labn(k, 'part')} = ${lab(m, `${W} in each part`)}.`,
          `The whole pie: ${lab(m, `${W} each`)} × ${lab(den, 'parts')} = ${lab(T, `${W} in all`)}.`,
        ],
      };
    }
    return {
      ...base, visual: v, solutionVisual: sol,
      prompt: `${c.intro(T)} How many ${W} ${tp}?`, expression: `${W} who ${tp} = ?`, answer: cnt,
      hint: 'Count the equal parts in the whole pie. How many are in one part? Then count the parts in the slice.',
      steps: [
        `The guide lines cut the pie into ${lab(den, 'equal parts')}, and the ${tl} slice covers ${labn(k, 'part')}: ${k}/${den} (of the pie).`,
        `One part: ${lab(T, W)} ÷ ${lab(den, 'parts')} = ${lab(m, `${W} in each part`)}.`,
        `${labn(k, 'part')} × ${lab(m, `${W} each`)} = ${lab(cnt, `${W} who ${tp}`)}.`,
      ],
    };
  }
  if (type === 'pctRead') {
    const k = sizes[t]; const one = 100 / den; const p = k * one;
    return {
      ...base, visual: pie({ parts: den }), solutionVisual: pie({ parts: den, showPct: true, highlight: t }),
      prompt: `${c.intro()} What percent of the ${W} ${tp}?`, expression: `${W} who ${tp} = ? %`, answer: p, unit: '%',
      hint: 'The whole pie is one hundred percent. Count the equal parts, find what one part is worth, then count the slice.',
      steps: [
        `The whole pie is 100% (all the ${W}), cut into ${lab(den, 'equal parts')}.`,
        `One part: 100% (the whole pie) ÷ ${lab(den, 'parts')} = ${pct(one)} (one part).`,
        `The ${tl} slice covers ${labn(k, 'part')}: ${labn(k, 'part')} × ${pct(one)} (each part) = ${pct(p)} (of the ${W}).`,
      ],
    };
  }
  const m = rng.int(1, d === 5 ? 6 : 10); const T = 20 * m;
  const count = (p: number) => (T * p) / 100;
  if (type === 'diff') {
    const pairs = range(0, nSlices - 1).flatMap((x) => range(0, nSlices - 1).filter((y) => sizes[x] > sizes[y]).map((y) => [x, y]));
    const [i, j] = rng.pick(pairs);
    const pd = sizes[i] - sizes[j]; const ans = count(pd);
    return {
      ...base, visual: pie({ showPct: true }), solutionVisual: pie({ showPct: true, highlight: i }),
      prompt: `${c.intro(T)} How many more ${W} ${chosen[i][1]} than ${chosen[j][1]}?`, expression: `more ${W} = ?`, answer: ans,
      hint: 'Find the difference of the two percents first. Then take that percent of everyone.',
      steps: [
        `The two slices: ${pct(sizes[i])} (${lc(labels[i])}) and ${pct(sizes[j])} (${lc(labels[j])}).`,
        `${pct(sizes[i])} (${lc(labels[i])}) − ${pct(sizes[j])} (${lc(labels[j])}) = ${pct(pd)} (more of the ${W}).`,
        `${lab(T, W)} × ${pd}/100 (the difference) = ${labn(ans, `more ${c.one}`, `more ${W}`)}.`,
      ],
    };
  }
  if (type === 'missing') {
    const known = range(0, nSlices - 1).filter((i) => i !== t);
    const ks = sumOf(known.map((i) => sizes[i]));
    const ans = count(sizes[t]);
    return {
      ...base, visual: pie({ showPct: true, ask: t }), solutionVisual: pie({ showPct: true, highlight: t }),
      prompt: `${c.intro(T)} How many ${W} ${tp}?`, expression: `${W} who ${tp} = ?`, answer: ans,
      hint: 'The whole pie is one hundred percent. Find the missing percent first, then take that percent of everyone.',
      steps: [
        `The other slices: ${known.map((i) => `${pct(sizes[i])} (${lc(labels[i])})`).join(' + ')} = ${pct(ks)} (of the pie).`,
        `The ${tl} slice: 100% (the whole pie) − ${pct(ks)} (the other slices) = ${pct(sizes[t])} (${lc(tl)}).`,
        `${lab(T, W)} × ${sizes[t]}/100 (the ${lc(tl)} share) = ${lab(ans, `${W} who ${tp}`)}.`,
      ],
    };
  }
  // pctCount: the pie prints the percents; how many is that?
  const ans = count(sizes[t]);
  return {
    ...base, visual: pie({ showPct: true }), solutionVisual: pie({ showPct: true, highlight: t, slices: labels.map((label, i) => ({ label: `${label} ${count(sizes[i])}`, v: sizes[i] })) }),
    prompt: `${c.intro(T)} How many ${W} ${tp}?`, expression: `${W} who ${tp} = ?`, answer: ans,
    hint: 'A percent is a number out of a hundred. Find one tenth of everyone first if that helps, then build up.',
    steps: [
      `The ${tl} slice is ${pct(sizes[t])} (of the pie), so it is ${sizes[t]}/100 (of all the ${W}).`,
      `${lab(T, W)} × ${sizes[t]}/100 (the ${lc(tl)} share) = ${lab(ans, `${W} who ${tp}`)}.`,
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Venn diagrams (Grades 3, 5)                                         */
/* ------------------------------------------------------------------ */

interface VennCtx { sets: [string, string]; a: string; b: string; both: string; onlyA: string; onlyB: string; notA: string; notB: string; none: string }
const VENN_CTX: VennCtx[] = [
  { sets: ['Soccer', 'Chess'], a: 'play soccer', b: 'play chess', both: 'play both', onlyA: 'play only soccer', onlyB: 'play only chess', notA: 'do not play soccer', notB: 'do not play chess', none: 'play neither' },
  { sets: ['Dog', 'Cat'], a: 'have a dog', b: 'have a cat', both: 'have both', onlyA: 'have a dog but no cat', onlyB: 'have a cat but no dog', notA: 'do not have a dog', notB: 'do not have a cat', none: 'have neither' },
  { sets: ['Swim', 'Bike'], a: 'can swim', b: 'can ride a bike', both: 'can do both', onlyA: 'can swim but not ride a bike', onlyB: 'can ride a bike but not swim', notA: 'cannot swim', notB: 'cannot ride a bike', none: 'can do neither' },
  { sets: ['Apples', 'Pears'], a: 'like apples', b: 'like pears', both: 'like both', onlyA: 'like apples but not pears', onlyB: 'like pears but not apples', notA: 'do not like apples', notB: 'do not like pears', none: 'like neither' },
  { sets: ['Piano', 'Drums'], a: 'play piano', b: 'play drums', both: 'play both', onlyA: 'play piano but not drums', onlyB: 'play drums but not piano', notA: 'do not play piano', notB: 'do not play drums', none: 'play neither' },
  { sets: ['Art', 'Music'], a: 'take art', b: 'take music', both: 'take both', onlyA: 'take art but not music', onlyB: 'take music but not art', notA: 'do not take art', notB: 'do not take music', none: 'take neither' },
];
const CLUBS: [string, string, string][] = [['Art', 'Music', 'Drama'], ['Chess', 'Robots', 'Garden'], ['Choir', 'Soccer', 'Coding']];
/** Swap the two sets so either circle can be the one asked about. */
const flip = (c: VennCtx): VennCtx => ({ sets: [c.sets[1], c.sets[0]], a: c.b, b: c.a, both: c.both, onlyA: c.onlyB, onlyB: c.onlyA, notA: c.notB, notB: c.notA, none: c.none });

function vennQ(d: number, rng: Rng): ContestSpec {
  if (d === 6 && rng.chance(0.35)) return venn3Q(rng);
  const c0 = rng.pick(VENN_CTX); const c = rng.chance(0.5) ? flip(c0) : c0;
  const [A, B] = c.sets; const la = lc(A), lb = lc(B);
  const g3 = d <= 4;
  const hi = d === 3 ? 12 : d === 4 ? 40 : 30;
  let a = rng.int(1, hi), b = rng.int(1, hi);
  // Grade 5 prompts say "N play both" and "N take neither": keep those at 2 or more so the verb agrees with the number
  const ab = rng.int(g3 ? 1 : 2, d === 3 ? 9 : d === 4 ? 25 : 20), none = rng.int(g3 ? 0 : 2, d === 3 ? 6 : 15);
  if (a === b) a = a === hi ? a - 1 : a + 1;
  if (a < b) [a, b] = [b, a];
  const sA = a + ab, sB = b + ab, T = a + b + ab + none;
  const full: Record<string, number> = { A: a, B: b, AB: ab, none };
  const venn = (counts: Record<string, number | '?'>, extra: Partial<Venn> = {}): Venn => ({ type: 'venn', sets: [A, B], counts, ...extra });
  const intro = `The Venn diagram shows which children ${c.a} and which ${c.b}.`;
  const L = { A: `${la} only`, B: `${lb} only`, AB: 'both', none: 'neither' };
  const base = { difficulty: d as Difficulty };

  if (g3) {
    const type = rng.pick(d === 3 ? ['both', 'onlyA', 'inA', 'all', 'all'] : ['inA', 'all', 'onlyOne', 'moreA', 'notB']);
    const choices = d === 3 && rng.chance(0.6);
    const v = venn({ ...full });
    const sol = (hl: Partial<Venn> = {}) => ({ ...venn({ ...full }), ...hl });
    if (type === 'both') return {
      ...base, visual: v, solutionVisual: sol(), prompt: `${intro} How many children ${c.both}?`, expression: 'children in both = ?', answer: ab,
      hint: 'Find the part that is inside both circles at once.',
      steps: [`The middle, where the circles overlap, is for children who ${c.both}.`, `The middle shows ${lab(ab, 'both')}.`],
      choices: choices ? numberChoices(ab, [sA, sB, a, b], 4) : undefined,
    };
    if (type === 'onlyA') return {
      ...base, visual: v, solutionVisual: sol(), prompt: `${intro} How many children ${c.onlyA}?`, expression: `${la} only = ?`, answer: a,
      hint: `Find the part of the ${A} circle that is outside the ${B} circle.`,
      steps: [`Only ${la}: inside the ${A} circle but outside the ${B} circle.`, `That part shows ${lab(a, L.A)}.`],
      choices: choices ? numberChoices(a, [sA, ab, b], 4) : undefined,
    };
    if (type === 'inA') return {
      ...base, visual: v, solutionVisual: sol(), prompt: `${intro} How many children ${c.a}?`, expression: `children who ${c.a} = ?`, answer: sA,
      hint: `Everyone inside the ${A} circle counts, and the middle is inside it too.`,
      steps: [`The children inside the ${A} circle ${c.a}, and that includes the middle.`, `${lab(a, L.A)} + ${lab(ab, L.AB)} = ${lab(sA, `children who ${c.a}`)}.`],
      choices: choices ? numberChoices(sA, [a, sA + b, ab], 4) : undefined,
    };
    if (type === 'onlyOne') return {
      ...base, visual: v, solutionVisual: sol(), prompt: `${intro} How many children ${c.a} or ${c.b}, but not both?`, expression: 'children in just one circle = ?', answer: a + b,
      hint: 'Use the two parts that are in one circle only. Leave out the middle and the outside.',
      steps: [`Just one of the two means ${la} only or ${lb} only, not the middle.`, `${lab(a, L.A)} + ${lab(b, L.B)} = ${lab(a + b, 'children in just one circle')}.`],
    };
    if (type === 'moreA') return {
      ...base, visual: v, solutionVisual: sol(), prompt: `${intro} How many more children ${c.a} than ${c.b}?`, expression: 'more children = ?', answer: a - b,
      hint: 'Count each whole circle, middle included. Then subtract.',
      steps: [
        `${A} circle: ${lab(a, L.A)} + ${lab(ab, L.AB)} = ${lab(sA, `children who ${c.a}`)}.`,
        `${B} circle: ${lab(b, L.B)} + ${lab(ab, L.AB)} = ${lab(sB, `children who ${c.b}`)}.`,
        `${lab(sA, `children who ${c.a}`)} − ${lab(sB, `children who ${c.b}`)} = ${labn(a - b, 'more child', 'more children')}.`,
        `Quick check: the middle is in both circles, so the difference is ${lab(a, L.A)} − ${lab(b, L.B)} = ${labn(a - b, 'more child', 'more children')}.`,
      ],
    };
    if (type === 'notB') return {
      ...base, visual: v, solutionVisual: sol(), prompt: `${intro} How many children ${c.notB}?`, expression: `children outside the ${B} circle = ?`, answer: a + none,
      hint: `Count everyone who is outside the ${B} circle, even outside both circles.`,
      steps: [`Outside the ${B} circle: the ${la} only part and the outside part.`, `${lab(a, L.A)} + ${lab(none, L.none)} = ${lab(a + none, `children who ${c.notB}`)}.`],
    };
    return {
      ...base, visual: v, solutionVisual: sol(), prompt: `${intro} How many children are there in all?`, expression: 'children in all = ?', answer: T,
      hint: 'Add every part of the picture once, and do not forget the outside.',
      steps: [`Add each part once: ${la} only, both, ${lb} only and outside the circles.`, `${lab(a, L.A)} + ${lab(ab, L.AB)} + ${lab(b, L.B)} + ${lab(none, L.none)} = ${lab(T, 'children in all')}.`],
      choices: choices ? numberChoices(T, [T - none, T + ab, a + b + ab], 4) : undefined,
    };
  }

  // Grade 5: something is missing; find it from the totals
  const type = rng.pick(d === 5 ? ['missing', 'missing', 'fromSize', 'neither'] : ['neither', 'incExc', 'incExc', 'missing']);
  const sol = venn({ ...full }, { total: T, sizes: type === 'missing' ? undefined : [sA, sB] });
  if (type === 'missing') {
    const r = rng.pick(['A', 'B', 'AB', 'none'] as const);
    const counts: Record<string, number | '?'> = { ...full, [r]: '?' };
    const known = (['A', 'AB', 'B', 'none'] as const).filter((x) => x !== r);
    const ks = sumOf(known.map((x) => full[x]));
    const ask = r === 'A' ? c.onlyA : r === 'B' ? c.onlyB : r === 'AB' ? c.both : c.none;
    return {
      ...base, visual: venn(counts, { total: T }), solutionVisual: { ...sol, sizes: undefined },
      prompt: `${intro} There are ${T} children in all. How many children ${ask}?`, expression: `${L[r]} = ?`, answer: full[r],
      hint: 'Every child is in exactly one part of the picture. The parts add up to the total.',
      steps: [`The parts must add up to ${lab(T, 'children in all')}.`, `The parts we know: ${known.map((x) => lab(full[x], L[x])).join(' + ')} = ${lab(ks, 'children')}.`, `${lab(T, 'children in all')} − ${lab(ks, 'children we know')} = ${lab(full[r], L[r])}.`],
    };
  }
  if (type === 'fromSize') return {
    ...base, visual: venn({ A: '?', AB: ab }, { sizes: [sA, sB] }), solutionVisual: venn({ A: a, AB: ab, B: b }, { sizes: [sA, sB] }),
    prompt: `In a class, ${sA} children ${c.a}, ${sB} ${c.b} and ${ab} ${c.both}. How many children ${c.onlyA}?`, expression: `${la} only = ?`, answer: a,
    hint: `The whole ${A} circle includes the middle. Take the middle away.`,
    steps: [`The ${A} circle holds ${lab(sA, `children who ${c.a}`)}, and the middle is part of it.`, `${lab(sA, `children who ${c.a}`)} − ${lab(ab, L.AB)} = ${lab(a, L.A)}.`],
  };
  const inC = a + b + ab;
  if (type === 'neither') return {
    ...base, visual: venn({ AB: ab, none: '?' }, { total: T, sizes: [sA, sB] }), solutionVisual: sol,
    prompt: `In a class of ${T} children, ${sA} ${c.a}, ${sB} ${c.b} and ${ab} ${c.both}. How many children ${c.none}?`, expression: 'neither = ?', answer: none,
    hint: 'Adding the two circles counts the middle twice. Find how many are in a circle, then compare with the class.',
    steps: [
      `Adding the circles counts the middle twice, so take it away once: ${lab(sA, `${la} circle`)} + ${lab(sB, `${lb} circle`)} − ${lab(ab, L.AB)} = ${lab(inC, 'children in a circle')}.`,
      `${lab(T, 'children in all')} − ${lab(inC, 'children in a circle')} = ${lab(none, L.none)}.`,
    ],
  };
  // incExc: find the middle
  return {
    ...base, visual: venn({ AB: '?', none }, { total: T, sizes: [sA, sB] }), solutionVisual: sol,
    prompt: `In a class of ${T} children, ${sA} ${c.a}, ${sB} ${c.b} and ${none} ${c.none}. How many children ${c.both}?`, expression: 'both = ?', answer: ab,
    hint: 'Find how many children are inside the circles. The two circle counts add to more than that: the extra is the middle, counted twice.',
    steps: [
      `Inside the circles: ${lab(T, 'children in all')} − ${lab(none, L.none)} = ${lab(inC, 'children in a circle')}.`,
      `The two circles add to ${lab(sA, `${la} circle`)} + ${lab(sB, `${lb} circle`)} = ${lab(sA + sB, 'children counted')}.`,
      `That is more than the children in a circle because the middle was counted twice: ${lab(sA + sB, 'children counted')} − ${lab(inC, 'children in a circle')} = ${lab(ab, L.AB)}.`,
    ],
  };
}

/** Grade 5 stretch: three club circles. */
function venn3Q(rng: Rng): ContestSpec {
  const sets = rng.pick(CLUBS);
  const [A, B, C] = sets;
  const keys = ['A', 'B', 'C', 'AB', 'AC', 'BC', 'ABC', 'none'] as const;
  const full: Record<string, number> = { A: rng.int(3, 15), B: rng.int(3, 15), C: rng.int(3, 15), AB: rng.int(1, 8), AC: rng.int(1, 8), BC: rng.int(1, 8), ABC: rng.int(1, 6), none: rng.int(1, 9) };
  const name: Record<string, string> = { A: `${lc(A)} only`, B: `${lc(B)} only`, C: `${lc(C)} only`, AB: `${lc(A)} and ${lc(B)} only`, AC: `${lc(A)} and ${lc(C)} only`, BC: `${lc(B)} and ${lc(C)} only`, ABC: 'all three', none: 'no club' };
  const intro = `The Venn diagram shows the children in the ${A}, ${B} and ${C} clubs.`;
  const type = rng.pick(['two', 'atLeast', 'one', 'missing']);
  const T = sumOf(keys.map((k) => full[k]));
  const v = { type: 'venn' as const, sets: [A, B, C], counts: { ...full } as Record<string, number | '?'> };
  const sum = (ks: readonly string[], label: string) => `${ks.map((k) => lab(full[k], name[k])).join(' + ')} = ${lab(sumOf(ks.map((k) => full[k])), label)}.`;
  const base = { difficulty: 6 as Difficulty, solutionVisual: { ...v, total: T } };
  if (type === 'missing') {
    const r = rng.pick(['AB', 'AC', 'BC', 'ABC'] as const);
    const known = keys.filter((k) => k !== r);
    const ks = sumOf(known.map((k) => full[k]));
    return {
      ...base, visual: { ...v, counts: { ...full, [r]: '?' }, total: T },
      prompt: `${intro} There are ${T} children in all. How many children are in ${r === 'ABC' ? 'all three clubs' : `the ${lc(sets['ABC'.indexOf(r[0])])} and ${lc(sets['ABC'.indexOf(r[1])])} clubs only`}?`,
      expression: `${name[r]} = ?`, answer: full[r],
      hint: 'Every child is in exactly one part. All the parts add up to the total.',
      steps: [`The parts we know: ${sum(known, 'children')}`, `${lab(T, 'children in all')} − ${lab(ks, 'children we know')} = ${lab(full[r], name[r])}.`],
    };
  }
  const pick = type === 'two' ? ['AB', 'AC', 'BC'] : type === 'atLeast' ? ['AB', 'AC', 'BC', 'ABC'] : ['A', 'B', 'C'];
  const label = type === 'two' ? 'children in exactly two clubs' : type === 'atLeast' ? 'children in two or more clubs' : 'children in exactly one club';
  const what = type === 'two' ? 'exactly two clubs' : type === 'atLeast' ? 'at least two clubs' : 'exactly one club';
  const how = type === 'two' ? 'the three parts where just two circles overlap, not the very middle' : type === 'atLeast' ? 'the three parts where two circles overlap, plus the very middle' : 'the three outer parts of the circles, where they do not overlap';
  return {
    ...base, visual: v,
    prompt: `${intro} How many children are in ${what}?`, expression: `${what} = ?`, answer: sumOf(pick.map((k) => full[k])),
    hint: 'Find the parts of the picture that fit the words exactly. Then add them.',
    steps: [`${cap(what)} means ${how}.`, sum(pick, label)],
  };
}

/* ------------------------------------------------------------------ */
/* Mean, median and range (Grade 5)                                    */
/* ------------------------------------------------------------------ */

const MEAN_CTX: Ctx[] = [
  who('Books read', 'book', 'book', 'books', 'read', 'read'),
  who('Goals scored', 'ball', 'goal', 'goals', 'score', 'scored'),
  who('Laps swum', 'fish', 'lap', 'laps', 'swim', 'swam'),
  who('Shells found', 'star', 'shell', 'shells', 'find', 'found'),
  who('Points scored', 'star', 'point', 'points', 'score', 'scored'),
];
/** A grid step that keeps a bar chart to about ten lines. */
const niceStep = (max: number) => (max <= 10 ? 2 : max <= 25 ? 5 : max <= 50 ? 10 : max <= 100 ? 20 : 50);
const ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** n values with a whole-number mean `mean`, between lo and hi, not all the same. */
function withMean(rng: Rng, n: number, mean: number, lo: number, hi: number): number[] {
  for (let t = 0; t < 400; t++) {
    const xs = Array.from({ length: n - 1 }, () => rng.int(lo, hi));
    const last = n * mean - sumOf(xs);
    if (last >= lo && last <= hi && new Set([...xs, last]).size >= Math.min(n, 3)) return rng.shuffle([...xs, last]);
  }
  return Array.from({ length: n }, (_, i) => mean + (i % 2 ? 1 : -1) * (i === n - 1 && n % 2 ? 0 : 1));
}

function meanQ(d: number, rng: Rng): ContestSpec {
  const type = rng.pick(d === 5 ? ['mean', 'mean', 'median', 'range', 'missing'] : ['mean', 'medianEven', 'missing', 'join', 'gap']);
  const c = rng.pick(MEAN_CTX);
  const big = d === 6;
  const n = type === 'median' || type === 'gap' ? 5 : type === 'medianEven' ? rng.pick([4, 6]) : big ? rng.int(4, 6) : rng.int(3, 5);
  const names = rng.shuffle(KIDS).slice(0, n);
  const lo = big ? 4 : 1, hi = big ? 40 : 18;
  let vals: number[];
  let m = 0;
  if (type === 'median' || type === 'medianEven' || type === 'range') vals = distinct(rng, n, lo, hi);
  else { m = rng.int(big ? 10 : 4, big ? 30 : 12); vals = withMean(rng, n, m, lo, hi); }
  const step = niceStep(Math.max(...vals));
  const v = chart(c, names, vals, 1, { bar: step, values: true });
  const intro = `The chart shows how many ${c.many} ${n} friends ${c.past}.`;
  const S = sumOf(vals);
  const addLine = (xs: number[], label: string) => `${xs.map((x) => lab(x, things(c, x))).join(' + ')} = ${lab(sumOf(xs), label)}`;
  const shareLine = (total: number, count: number, mean: number) => `Share them equally among ${lab(count, 'friends')}: ${lab(total, `${c.many} in all`)} ÷ ${lab(count, 'friends')} = ${lab(mean, `${things(c, mean)} each`)}.`;
  const sortedList = () => { const order = range(0, n - 1).sort((a, b) => vals[a] - vals[b]); return { order, text: `In order: ${order.map((i) => `${names[i]} ${lab(vals[i], things(c, vals[i]))}`).join(', ')}.` }; };
  /** The chart redrawn smallest to biggest with the middle bar (or the two middle bars) lit. */
  const sortedChart = (order: number[], extra: Partial<Picto> = {}) => chart(c, order.map((i) => names[i]), order.map((i) => vals[i]), 1, { bar: step, values: true, highlight: n % 2 ? [n >> 1] : [n / 2 - 1, n / 2], ...extra });
  const base = { difficulty: d as Difficulty, visual: v };

  if (type === 'median' || type === 'medianEven') {
    const { order, text } = sortedList(); const med = median(vals);
    const sorted = sortedChart(order);
    const steps = [text];
    if (n % 2) steps.push(`With ${lab(n, 'friends')} the middle one is the ${ORDINAL[n >> 1]} in the list, so the median is ${lab(med, c.many)}.`);
    else {
      const x = vals[order[n / 2 - 1]], y = vals[order[n / 2]];
      steps.push(`With ${lab(n, 'friends')} there are two middle numbers: ${lab(x, c.many)} and ${lab(y, c.many)}.`, `The median is halfway between them: (${lab(x, c.many)} + ${lab(y, c.many)}) ÷ ${lab(2, 'middle numbers')} = ${lab(med, c.many)}.`);
    }
    return {
      ...base, prompt: `${intro} What is the median number of ${c.many}?`, expression: 'median = ?', answer: med, decimal: !Number.isInteger(med),
      hint: n % 2 ? 'Put the numbers in order from smallest to biggest. The median is the one in the middle.' : 'Put the numbers in order. With an even count there are two in the middle: the median is halfway between them.',
      steps, solutionVisual: sorted,
    };
  }
  if (type === 'range') {
    const i = argMax(vals), j = argMin(vals); const r = vals[i] - vals[j];
    return {
      ...base, prompt: `${intro} What is the range: the most minus the fewest?`, expression: 'range = ?', answer: r,
      hint: 'Find the tallest bar and the shortest bar. The range is how far apart they are.',
      steps: [`Most: ${names[i]} with ${lab(vals[i], things(c, vals[i]))}. Fewest: ${names[j]} with ${lab(vals[j], things(c, vals[j]))}.`, `${lab(vals[i], c.many)} − ${lab(vals[j], things(c, vals[j]))} = ${lab(r, `${things(c, r)} apart`)}.`],
      solutionVisual: { ...v, highlight: [i, j] },
    };
  }
  if (type === 'missing') {
    const i = rng.int(0, n - 1);
    const known = vals.filter((_, j) => j !== i); const ks = sumOf(known);
    // the question's grid comes from the bars you can see, so its scale says nothing about the hidden one
    const pv = chart(c, names, vals, 1, { bar: niceStep(Math.max(...known)), values: true, ask: i });
    return {
      ...base, visual: pv,
      prompt: `The mean of all ${n} friends is ${m} ${c.many}. How many ${c.many} did ${names[i]} ${c.verb}?`, expression: `${rowLab(c, names[i], 2)} = ?`, answer: vals[i],
      hint: 'Mean times the number of friends gives the total. Then take away the amounts you know.',
      steps: [
        `Mean × how many = total: ${lab(m, `${c.many} each`)} × ${lab(n, 'friends')} = ${lab(m * n, `${c.many} in all`)}.`,
        `The others: ${addLine(known, `${c.many} for the others`)}.`,
        `${lab(m * n, `${c.many} in all`)} − ${lab(ks, `${c.many} for the others`)} = ${lab(vals[i], rowLab(c, names[i], vals[i]))}.`,
      ],
      solutionVisual: { ...v, line: m, highlight: [i] },
    };
  }
  if (type === 'join') {
    // a new friend joins; the new mean is a whole number
    const newName = KIDS.find((x) => !names.includes(x)) ?? 'Ben';
    let x = 0, m2 = 0;
    for (let t = 0; t < 60 && !x; t++) { const cand = rng.int(Math.ceil((S + lo) / (n + 1)), Math.floor((S + hi) / (n + 1))); const xx = cand * (n + 1) - S; if (xx >= lo && xx <= hi) { x = xx; m2 = cand; } }
    if (!x) { m2 = Math.ceil((S + 1) / (n + 1)); x = m2 * (n + 1) - S; }
    return {
      ...base,
      prompt: `${intro} ${newName} also ${c.past} ${x} ${c.many} but is not on the chart. What is the mean for all ${n + 1} friends?`, expression: 'new mean = ?', answer: m2,
      hint: 'Add the new amount to the old total, then share among one more friend.',
      steps: [`The ${lab(n, 'friends')}: ${addLine(vals, `${c.many} in all`)}.`, `With ${newName}: ${lab(S, c.many)} + ${lab(x, things(c, x))} = ${lab(S + x, `${c.many} in all`)}.`, shareLine(S + x, n + 1, m2)],
      solutionVisual: chart(c, [...names, newName], [...vals, x], 1, { bar: niceStep(Math.max(...vals, x)), values: true, line: m2, highlight: [n] }),
    };
  }
  if (type === 'gap') {
    const med = median(vals);
    if (med === m) return meanQ(d, rng);
    const { order, text } = sortedList();
    const bigger = m > med ? 'mean' : 'median'; const smaller = m > med ? 'median' : 'mean';
    const gap = Math.abs(m - med);
    return {
      ...base, prompt: `${intro} How much bigger is the ${bigger} than the ${smaller}?`, expression: `${bigger} − ${smaller} = ?`, answer: gap,
      hint: 'Find the mean (share the total equally) and the median (the middle in order). Then subtract.',
      steps: [`Mean: ${addLine(vals, `${c.many} in all`)}.`, shareLine(S, n, m), text, `The median is the middle one: ${lab(med, c.many)}.`, `${lab(Math.max(m, med), `${c.many}, the ${bigger}`)} − ${lab(Math.min(m, med), `${c.many}, the ${smaller}`)} = ${lab(gap, things(c, gap))}.`],
      solutionVisual: sortedChart(order, { line: m }),
    };
  }
  return {
    ...base, prompt: `${intro} What is the mean number of ${c.many} per friend?`, expression: 'mean = ?', answer: m,
    hint: 'Add all the amounts. Then share the total equally among the friends.',
    steps: [`Add them all: ${addLine(vals, `${c.many} in all`)}.`, shareLine(S, n, m)],
    solutionVisual: { ...v, line: m },
  };
}

/* ------------------------------------------------------------------ */
/* Dispatch                                                            */
/* ------------------------------------------------------------------ */

const GEN: Record<Kind, (d: number, rng: Rng) => ContestSpec> = { picto: pictoQ, bar: barQ, pie: pieQ, venn: vennQ, mean: meanQ };

export function dataQuestion(kind: DataKind, d: Difficulty, rng: Rng, skillId?: string): Question {
  const grade = gradeOf(d);
  const k: Kind = kind !== 'all' && GEN[kind as Kind] ? (kind as Kind) : rng.pick(KINDS.filter((x) => DATA_KIND_GRADES[x].includes(grade)));
  const sid = skillId ?? (kind === 'all' || !GEN[kind as Kind] ? 'data' : `data.${k}`);
  const band = Math.min(BAND[k][1], Math.max(BAND[k][0], d));
  const spec = GEN[k](band, rng);
  return contestQuestion('data', DATA_META.topic, sid, DATA_KINDS.find((x) => x.id === k)!.label, { ...spec, difficulty: d, app: APP });
}
export const genData: Generator = (skillId, params, ctx) => dataQuestion(String(params?.kind ?? 'all') as DataKind, ctx.difficulty, ctx.rng, skillId);
