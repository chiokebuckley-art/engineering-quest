import type { Difficulty, Question, QuestionChoice, Visual } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { contestQuestion, choicesFrom, gradeOf, type ContestGameMeta, type ContestKind, type GradeId, type KindGrades } from '../contest/common';
import type { ColorName, ContestIcon, ContestVisual } from '../contest/visuals';
import { lab, labn, unit } from '../label';

/**
 * Counting Paths (Contest Path): outfits, menus, line-ups, routes on a street grid and handshakes. Every question
 * lists a few ways first and only then multiplies, adds or takes away. Difficulty 1–2 = Grade 1, 3–4 = Grade 3,
 * 5–6 = Grade 5 (see contest/common.ts). Every question is original.
 *
 *  outfits (G1, G3) hats × shirts (× shoes); which closet makes as many; one more item; the missing group
 *  menus   (G3, G5) one from each group; a drink or a snack; a rule to take away; "but not", "or", two different scoops
 *  orders  (G3, G5) 3 friends in a row; someone fixed; medals; 4–5 in a row, two together (a block), two apart, the ends
 *  grid    (G3, G5) routes only up or right: list them, then add the ways into each corner; blocked corners
 *  pairs   (G5) handshakes, round robins, teams of 2, lines between dots; twice, one skipped, a late arrival
 */
export type PathsKind = 'all' | "outfits" | "menus" | "orders" | "grid" | "pairs";

export const PATHS_META: ContestGameMeta = {
  id: "paths", label: "Counting Paths", icon: "map", topic: "Counting", skill: "paths",
  blurb: "How many ways? Outfits, menus, line-ups, routes on a grid and handshakes, listed before any formula.",
  intro: "To count the ways, start by listing a few in order, so you miss none and count none twice. When every choice from one group goes with every choice from the next, the lists come in equal groups, so you multiply: 2 hats × 3 shirts = 6 outfits. In a line-up the choices shrink by one for each place filled. On a street grid, the ways into a corner are the ways from below plus the ways from the left. When everyone pairs with everyone, each pair gets counted twice, so halve.",
  tree: { x: 5, y: 3 }, prereq: { skillId: "add.basic", mastery: 0 },
};

export const PATHS_KINDS: ContestKind[] = [
  { id: 'all', label: 'Mixed', short: 'Mixed', desc: "How many ways? Outfits, menus, line-ups, routes on a grid and handshakes, listed before any formula." },
  { id: "outfits", label: "Outfits", short: "Outfits", desc: "Each hat goes with each shirt: list them, or hats × shirts." },
  { id: "menus", label: "Menus", short: "Menus", desc: "One from each group: multiply the choices in each group." },
  { id: "orders", label: "Line-ups", short: "Line-ups", desc: "Who goes first, second, third? Choices shrink by one each place." },
  { id: "grid", label: "Grid routes", short: "Routes", desc: "Only up or right: add the ways into each corner from below and from the left." },
  { id: "pairs", label: "Handshakes and pairs", short: "Pairs", desc: "Everyone pairs with everyone once: count without counting a pair twice." },
];
/** Which grades each kind suits. */
export const PATHS_KIND_GRADES: KindGrades = { outfits: ["g1", "g3"], menus: ["g3", "g5"], orders: ["g3", "g5"], grid: ["g3", "g5"], pairs: ["g5"] };

type K = Exclude<PathsKind, 'all'>;
interface Item { name: string; icon: ContestIcon; color?: ColorName }
interface Group { label: string; items: Item[] }
type MenuV = Extract<ContestVisual, { type: 'menu' }>;

const APP = 'Engineers count the ways a design can be put together (every part, every order, every route) before they test them all.';
const BANDS: Record<GradeId, [Difficulty, Difficulty]> = { g1: [1, 2], g3: [3, 4], g5: [5, 6] };
const NEAREST: Record<GradeId, GradeId[]> = { g1: ['g1', 'g3', 'g5'], g3: ['g3', 'g1', 'g5'], g5: ['g5', 'g3', 'g1'] };
/** The difficulty a kind is played at: d itself when the kind suits that grade, else the same spot in the nearest band it suits. */
export function pathsDifficulty(kind: K, d: Difficulty): Difficulty {
  const ok = PATHS_KIND_GRADES[kind]; const g = NEAREST[gradeOf(d)].find((x) => ok.includes(x)) ?? 'g3';
  return g === gradeOf(d) ? d : BANDS[g][(d - 1) % 2];
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const prod = (xs: number[]) => xs.reduce((a, b) => a * b, 1);
const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
const choose2 = (n: number) => (n * (n - 1)) / 2;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const listAnd = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const listOr = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} or ${xs[xs.length - 1]}`);
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];
const PLACE = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'];
/** Every order of the list (the first item changes slowest). */
function perms<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

/** How a set of number choices was built: the generator's real mistakes, the ones picked, and any near-miss fillers. */
export interface PathsChoiceBuild { answer: number; signature?: number; real: number[]; picked: number[]; fillers: number[] }
let choiceWatch: ((b: PathsChoiceBuild) => void) | undefined;
/** Tests listen here to check that the wrong options come from real mistakes (pass nothing to stop listening). */
export function watchPathsChoices(f?: (b: PathsChoiceBuild) => void): void { choiceWatch = f; }

/** Shortcuts a child could use to pick an answer without counting: the options each one points at. */
const SHORTCUTS: ((V: Set<number>) => number[])[] = [
  (V) => [...V].filter((v) => V.has(2 * v)), // the one whose double is offered
  (V) => [...V].filter((v) => v % 2 === 0 && V.has(v / 2)), // the double of an offered one
  (V) => [...V].filter((v) => V.has(v - 1) || V.has(v + 1)), // one next to another (an off-by-one is offered)
  (V) => [...V].filter((v) => V.has(v - 1) && V.has(v + 1)), // the middle of three in a row
];
/** The longest run of consecutive whole numbers in a set. */
function longestRun(vs: Set<number>): number {
  let best = 0;
  for (const v of vs) if (!vs.has(v - 1)) { let len = 1; while (vs.has(v + len)) len++; best = Math.max(best, len); }
  return best;
}
/** Every way to choose k of the values (in list order). */
function subsetsOf(xs: number[], k: number): number[][] {
  const out: number[][] = [];
  const go = (from: number, cur: number[]) => {
    if (cur.length === k) { out.push(cur); return; }
    for (let i = from; i <= xs.length - (k - cur.length); i++) go(i + 1, [...cur, xs[i]]);
  };
  go(0, []);
  return out;
}

/**
 * Number choices: the answer and n − 1 wrong options, all from real mistakes. `wrong` lists the mistakes the question
 * invites, the kind's signature mistake first; an off-by-one (missed one, counted one twice) is always a real slip too.
 * Near misses (±2, ±3, …) only fill in when there are too few real mistakes, which the tests keep from happening.
 *
 * Every possible set of wrong options is looked at. Sets with a run of 4 numbers in a row (with 3 choices, all 3 in a row)
 * are dropped. Then:
 *  1. where the answer sits by size is drawn evenly over the places the sets allow, so "tap the biggest" or "tap the
 *     2nd" never works;
 *  2. the signature mistake goes in most of the time, unless every set with it has a shortcut and another set does not;
 *  3. the set is drawn by weight: an off-by-one is a weaker mistake, and a shortcut that points at the answer (the only
 *     number whose double is offered, the only double of an offered number, the only number next to another, the middle
 *     of three in a row) makes a set much less likely. When a decoy shares the shortcut, it points at the answer less.
 */
function numChoices(rng: Rng, answer: number, wrong: number[], n: number, max = Infinity, min = 1): QuestionChoice[] {
  const ok = (v: number) => Number.isInteger(v) && v >= min && v <= max && v !== answer;
  const signature = wrong.find(ok);
  const real = [...new Set([...wrong, answer - 1, answer + 1].filter(ok))].slice(0, 11);
  const k = n - 1;
  const fillers: number[] = [];
  for (let s = 2; real.length + fillers.length < k && s < 60; s++) for (const v of [answer - s, answer + s]) if (ok(v) && real.length + fillers.length < k) fillers.push(v);
  const pool = [...real, ...fillers];
  const slip = (v: number) => Math.abs(v - answer) === 1 && v !== signature;
  const distinct = (v: number) => !slip(v) && !fillers.includes(v);
  /** How good a set is: an off-by-one is a weaker mistake, and a shortcut that points at the answer makes it much worse. */
  const weigh = (S: number[]) => {
    const V = new Set([answer, ...S]);
    let w = 1;
    for (const v of S) if (slip(v)) w *= 0.6;
    for (const spot of SHORTCUTS) { const hit = spot(V); if (hit.includes(answer)) w *= Math.max(0.08, 1 - 1.2 / hit.length); }
    return w;
  };
  let sets = subsetsOf(pool, Math.min(k, pool.length));
  const fewest = Math.min(...sets.map((S) => S.filter((v) => fillers.includes(v)).length));
  sets = sets.filter((S) => S.filter((v) => fillers.includes(v)).length === fewest);
  if (sets.some((S) => S.some(distinct))) sets = sets.filter((S) => S.some(distinct));
  // No run of 4 numbers in a row (or of all 3 when there are only 3 choices): a run like 3, 4, 5, 6 needs no counting.
  const tooLong = Math.min(4, n);
  if (sets.some((S) => longestRun(new Set([answer, ...S])) < tooLong)) sets = sets.filter((S) => longestRun(new Set([answer, ...S])) < tooLong);
  const weighted = <T>(xs: T[], wt: (x: T) => number): T => {
    const total = xs.reduce((s, x) => s + wt(x), 0); let roll = rng.next() * total;
    for (const x of xs) { roll -= wt(x); if (roll < 0) return x; }
    return xs[xs.length - 1];
  };
  const best = (g: { w: number }[]) => Math.max(0, ...g.map((x) => x.w));
  // 1. Where the answer sits by size: evenly over the places some set allows.
  const byRank = new Map<number, { S: number[]; w: number }[]>();
  for (const S of sets) { const r = S.filter((v) => v < answer).length; if (!byRank.has(r)) byRank.set(r, []); byRank.get(r)!.push({ S, w: weigh(S) }); }
  const group = rng.pick([...byRank.keys()].sort((a, b) => a - b).map((r) => byRank.get(r)!));
  // 2. With the signature mistake or without: mostly with, unless every such set has a shortcut and another does not.
  const withSig = group.filter((x) => signature !== undefined && x.S.includes(signature)); const without = group.filter((x) => !withSig.includes(x));
  const side = !withSig.length ? without : !without.length ? withSig : weighted([withSig, without], (g) => (g === withSig ? 0.85 : 0.15) * best(g));
  // 3. The set itself: the better a set, the likelier.
  const picked = weighted(side, (x) => x.w).S;
  choiceWatch?.({ answer, signature, real, picked, fillers: picked.filter((v) => fillers.includes(v)) });
  return choicesFrom(rng.shuffle([answer, ...picked]));
}
/** Tap choices by grade: always in Grade 1 (3 or 4 big buttons), half the time in Grade 3 (4), mostly in Grade 5 (5, contest style). */
function gradeChoices(rng: Rng, d: Difficulty, answer: number, wrong: number[]): QuestionChoice[] | undefined {
  const g = gradeOf(d);
  if (g === 'g1') return numChoices(rng, answer, wrong, d === 1 ? 3 : 4, 20);
  if (g === 'g3') return rng.chance(0.5) ? numChoices(rng, answer, wrong, 4, 1000) : undefined;
  return rng.chance(0.6) ? numChoices(rng, answer, wrong, 5) : undefined;
}

interface Q { prompt: string; expression: string; answer: number; hint: string; steps: string[]; visual: ContestVisual; solution?: ContestVisual; choices?: QuestionChoice[]; read?: string }
function make(k: K, d: Difficulty, sid: string, q: Q): Question {
  return contestQuestion('paths', PATHS_META.topic, sid, PATHS_KINDS.find((x) => x.id === k)!.label, {
    prompt: q.prompt, expression: q.expression, answer: q.answer, difficulty: d, hint: q.hint, steps: q.steps,
    visual: q.visual as Visual, solutionVisual: q.solution as Visual | undefined, choices: q.choices,
    readAloud: q.read ?? q.prompt.replace(/✕/g, 'X'), app: APP,
  });
}
const menu = (groups: Group[], tree = false): MenuV => (tree ? { type: 'menu', groups, tree } : { type: 'menu', groups });

/* ------------------------------------------------------------------ */
/* outfits                                                             */
/* ------------------------------------------------------------------ */

const KIDS = ['Mia', 'Leo', 'Zoe', 'Sam', 'Ivy', 'Max', 'Nia', 'Kai', 'Ava', 'Tom'];
const CLOTH_COLORS: ColorName[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];
type Cloth = 'hat' | 'shirt' | 'shoe';
const CLOTH: Record<Cloth, { label: string; one: string; many: string }> = {
  hat: { label: 'Hats', one: 'hat', many: 'hats' },
  shirt: { label: 'Shirts', one: 'shirt', many: 'shirts' },
  shoe: { label: 'Shoes', one: 'pair of shoes', many: 'pairs of shoes' },
};
function clothes(rng: Rng, icon: Cloth, n: number, avoid: ColorName[] = []): Group {
  const cs = rng.shuffle(CLOTH_COLORS.filter((c) => !avoid.includes(c))).slice(0, n);
  return { label: CLOTH[icon].label, items: cs.map((c) => ({ name: icon === 'shoe' ? `${c} shoes` : `${c} ${icon}`, icon, color: c })) };
}
const colorsOf = (g: Group) => g.items.map((x) => x.color!);
const lc = (c: Cloth, n: number) => labn(n, CLOTH[c].one, CLOTH[c].many);

/** Grade 1: hats × shirts (2 × 2, 2 × 3, 3 × 2), listed hat by hat and added. */
function outfitsG1(d: Difficulty, rng: Rng, sid: string): Question {
  if (d === 2 && rng.chance(0.35)) return outfitsSame(rng, sid);
  // 2 × 2 is the one closet where adding (2 + 2) happens to give the right count, so it is the rarer one.
  const [a, b] = rng.pick(d === 1 ? [[2, 2], [2, 3], [3, 2]] : [[2, 3], [3, 2], [3, 2], [2, 3], [2, 2]]);
  const name = rng.pick(KIDS);
  const hats = clothes(rng, 'hat', a); const shirts = clothes(rng, 'shirt', b, colorsOf(hats));
  const ans = a * b;
  const shirtWords = `the ${listOr(colorsOf(shirts))} shirt`;
  const steps = [
    ...hats.items.map((h) => `${cap(h.name)} with ${shirtWords}: ${labn(b, 'outfit')}.`),
    `${range(a).map(() => lab(b, 'outfits')).join(' + ')} = ${lab(ans, 'outfits')}.`,
    `So ${name} can make ${lab(ans, 'outfits')}.`,
  ];
  return make('outfits', d, sid, {
    prompt: `${name} picks 1 hat and 1 shirt. How many different outfits can ${name} make?`,
    expression: 'outfits = ?', answer: ans,
    hint: `Take the ${hats.items[0].name}. How many shirts can go with it?`, steps,
    visual: menu([hats, shirts]), solution: menu([hats, shirts], true),
    // Real Grade 1 slips: added hats and shirts; counted one hat's outfits only; counted every outfit twice (once from
    // the hat, once from the shirt); counted the hats only; also counted each hat alone and each shirt alone (or just the
    // hats alone, or just the shirts alone). Missed one and counted one twice are always offered as slips too.
    choices: numChoices(rng, ans, [a + b, b, 2 * ans, a, ans + a + b, ans + a, ans + b], d === 1 ? 3 : 4, 20),
    read: `${name} picks one hat and one shirt. How many different outfits can ${name} make?`,
  });
}

/** Grade 1 picture choices: which closet makes the same number of outfits? (Swapping hats and shirts keeps the count.) */
function outfitsSame(rng: Rng, sid: string): Question {
  const [a, b] = rng.pick([[2, 3], [3, 2], [2, 2]]);
  const ans = a * b; const name = rng.pick(KIDS);
  const right: [number, number] = a !== b ? [b, a] : rng.pick([[1, 4], [4, 1]] as [number, number][]);
  // "Same number of things" is the real mistake: 1 hat + 4 shirts is 5 things, like 2 + 3, but only 4 outfits.
  const sameThings: [number, number] = a === 2 && b === 2 ? rng.pick([[1, 3], [3, 1]] as [number, number][]) : rng.pick([[1, 4], [4, 1]] as [number, number][]);
  const pool: [number, number][] = [sameThings, ...rng.shuffle([[2, 2], [3, 3], [1, 2], [2, 1]] as [number, number][])];
  const opts: [number, number][] = [right];
  for (const p of pool) if (opts.length < 3 && p[0] * p[1] !== ans && !opts.some((o) => o[0] === p[0] && o[1] === p[1])) opts.push(p);
  const order = rng.shuffle(opts);
  const closet = ([h, s]: [number, number]) => menu([clothes(rng, 'hat', h), clothes(rng, 'shirt', s)]);
  const label = ([h, s]: [number, number]) => `${h} ${unit(h, 'hat')}, ${s} ${unit(s, 'shirt')}`;
  const choices = order.map((o, i) => ({ value: i + 1, label: label(o), visual: closet(o) as Visual }));
  const answer = order.findIndex((o) => o === right) + 1;
  const hats = clothes(rng, 'hat', a); const shirts = clothes(rng, 'shirt', b);
  const sumOf = (h: number, s: number) => (h === 1 ? `${labn(1, 'hat')} makes ${labn(s, 'outfit')}.` : `${range(h).map(() => labn(s, 'outfit')).join(' + ')} = ${labn(h * s, 'outfit')}.`);
  const steps = [
    `${name} has ${lc('hat', a)} and ${lc('shirt', b)}.`,
    `Each hat makes ${labn(b, 'outfit')}.`,
    `${range(a).map(() => labn(b, 'outfit')).join(' + ')} = ${lab(ans, 'outfits')}.`,
    `Now the closet with ${lc('hat', right[0])} and ${lc('shirt', right[1])}.`,
    `${sumOf(right[0], right[1])} The same!`,
  ];
  if (order.some((o) => o === sameThings)) steps.push(`The closet with ${lc('hat', sameThings[0])} and ${lc('shirt', sameThings[1])} also has ${lab(a + b, 'things')}.`, `But it makes only ${labn(sameThings[0] * sameThings[1], 'outfit')}.`);
  steps.push(`So tap the closet with ${lc('hat', right[0])} and ${lc('shirt', right[1])}.`);
  return make('outfits', 2, sid, {
    prompt: `Look at ${name}'s hats and shirts. Which closet makes the same number of outfits? Tap it.`,
    expression: 'same number of outfits', answer, choices,
    hint: `Count ${name}'s outfits first. Then count the outfits for each closet.`, steps,
    visual: menu([hats, shirts]), solution: menu([hats, shirts], true),
    read: `Look at ${name}'s hats and shirts. Which closet below makes the same number of outfits?`,
  });
}

/** Grade 3: hats × shirts × shoes; one more item (how many more?); the missing group (work backwards). */
function outfitsG3(d: Difficulty, rng: Rng, sid: string): Question {
  const v = rng.pick(d === 3 ? ['three', 'three', 'three', 'extra'] : ['three', 'three', 'extra', 'missing']);
  const name = rng.pick(KIDS);
  if (v === 'missing') {
    const a = rng.int(2, 4); const b = rng.int(2, 4); const c = rng.int(2, 3); const total = a * b * c;
    const hats = clothes(rng, 'hat', a); const shirts = clothes(rng, 'shirt', b);
    const ab = a * b;
    return make('outfits', d, sid, {
      prompt: `${name} can make ${total} different outfits, each with 1 hat, 1 shirt and 1 pair of shoes. The hats and shirts are in the picture. How many pairs of shoes does ${name} have?`,
      expression: 'pairs of shoes = ?', answer: c,
      hint: 'How many outfits does one pair of shoes make? Then see how many of those fit in all the outfits.',
      steps: [
        `Hats and shirts: ${lc('hat', a)} × ${lc('shirt', b)} = ${lab(ab, 'hat-and-shirt pairs')}.`,
        `Each pair of shoes goes with every one of them, so each pair of shoes makes ${lab(ab, 'outfits')}.`,
        `${lab(total, 'outfits')} ÷ ${lab(ab, 'outfits per pair of shoes')} = ${lc('shoe', c)}.`,
        `Check: ${lab(ab, 'hat-and-shirt pairs')} × ${lc('shoe', c)} = ${lab(total, 'outfits')}.`,
      ],
      visual: menu([hats, shirts, { label: 'Shoes', items: [] }]),
      // Divided by hats and shirts added; divided by the hats only or the shirts only; gave the hat-and-shirt pairs;
      // took the pairs away instead of dividing; gave the outfits; added the hats and shirts.
      choices: gradeChoices(rng, d, c, [...(total % (a + b) === 0 ? [total / (a + b)] : []), b * c, a * c, ab, total - ab, total, a + b]),
    });
  }
  const a = rng.int(2, d === 3 ? 3 : 4); const b = rng.int(2, d === 3 ? 3 : 4); const c = rng.int(2, 3);
  const g = [clothes(rng, 'hat', a), clothes(rng, 'shirt', b), clothes(rng, 'shoe', c)];
  const total = a * b * c;
  const before = `${lc('hat', a)} × ${lc('shirt', b)} × ${lc('shoe', c)} = ${lab(total, 'outfits')}`;
  if (v === 'extra') {
    const which = rng.pick(['hat', 'shirt', 'shoe'] as Cloth[]);
    const n2 = { hat: a + (which === 'hat' ? 1 : 0), shirt: b + (which === 'shirt' ? 1 : 0), shoe: c + (which === 'shoe' ? 1 : 0) };
    const after = n2.hat * n2.shirt * n2.shoe;
    const others = (['hat', 'shirt', 'shoe'] as Cloth[]).filter((x) => x !== which);
    const size = { hat: a, shirt: b, shoe: c };
    const ans = size[others[0]] * size[others[1]];
    return make('outfits', d, sid, {
      prompt: `An outfit is 1 hat, 1 shirt and 1 pair of shoes. ${name} gets 1 more ${CLOTH[which].one}. How many more outfits can ${name} make now?`,
      expression: 'more outfits = ?', answer: ans,
      hint: `The new ${CLOTH[which].one} can go with every ${CLOTH[others[0]].one} and every ${CLOTH[others[1]].one}.`,
      steps: [
        `Before: ${before}.`,
        `After: ${lc('hat', n2.hat)} × ${lc('shirt', n2.shirt)} × ${lc('shoe', n2.shoe)} = ${lab(after, 'outfits')}.`,
        `${lab(after, 'outfits now')} − ${lab(total, 'outfits before')} = ${lab(ans, 'more outfits')}.`,
        `Quicker: the new ${CLOTH[which].one} goes with each ${CLOTH[others[0]].one} and each ${CLOTH[others[1]].one}: ${lc(others[0], size[others[0]])} × ${lc(others[1], size[others[1]])} = ${lab(ans, 'new outfits')}.`,
      ],
      visual: menu(g),
      // Gave the new total; thought 1 more item makes 1 more outfit; gave the old total; added the other groups; one group only.
      choices: gradeChoices(rng, d, ans, [after, 1, total, size[others[0]] + size[others[1]], size[others[0]], size[others[1]]]),
    });
  }
  const [h0, s0] = [g[0].items[0].name, g[1].items[0].name];
  return make('outfits', d, sid, {
    prompt: `An outfit is 1 hat, 1 shirt and 1 pair of shoes. How many different outfits can ${name} make?`,
    expression: 'outfits = ?', answer: total,
    hint: 'Count the hat-and-shirt pairs first. Each pair can go with every pair of shoes.',
    steps: [
      `Start a list with the ${h0}: ${h0}, ${s0}, ${g[2].items[0].name}; ${h0}, ${s0}, ${g[2].items[1].name}; and so on.`,
      `Each hat goes with each shirt: ${lc('hat', a)} × ${lc('shirt', b)} = ${lab(a * b, 'hat-and-shirt pairs')}.`,
      `Each pair goes with every pair of shoes: ${lab(a * b, 'hat-and-shirt pairs')} × ${lc('shoe', c)} = ${lab(total, 'outfits')}.`,
    ],
    visual: menu(g), solution: total <= 12 ? menu(g, true) : undefined,
    // Added the groups; forgot the shoes; added the shoes on; added hats and shirts, then times shoes; hats or shirts left
    // out; multiplied shirts and shoes, then added the hats; listed every outfit twice; counted the hat-and-shirt
    // branches of the tree as outfits too (and the hat branches).
    choices: gradeChoices(rng, d, total, [a + b + c, a * b, a * b + c, (a + b) * c, b * c, a * c, a + b * c, 2 * total, total + a * b, total + a * b + a]),
  });
}

/* ------------------------------------------------------------------ */
/* menus                                                               */
/* ------------------------------------------------------------------ */

interface MGroup { label: string; word: string; words: string; items: Item[] }
interface Theme { thing: string; things: string; intro: string; verb: string; place: string; groups: MGroup[] }
const LUNCH: Theme = {
  thing: 'lunch', things: 'lunches', intro: 'A lunch is', verb: 'choose', place: 'The café', groups: [
    { label: 'Mains', word: 'main', words: 'mains', items: [{ name: 'sandwich', icon: 'sandwich' }, { name: 'pizza', icon: 'pizza' }, { name: 'fish', icon: 'fish', color: 'orange' }] },
    { label: 'Drinks', word: 'drink', words: 'drinks', items: [{ name: 'orange juice', icon: 'juice', color: 'orange' }, { name: 'lemonade', icon: 'juice', color: 'yellow' }, { name: 'grape juice', icon: 'juice', color: 'purple' }, { name: 'lime fizz', icon: 'juice', color: 'green' }, { name: 'cherry fizz', icon: 'juice', color: 'red' }] },
    { label: 'Snacks', word: 'snack', words: 'snacks', items: [{ name: 'cookie', icon: 'cookie' }, { name: 'red apple', icon: 'apple', color: 'red' }, { name: 'green apple', icon: 'apple', color: 'green' }, { name: 'ice cream', icon: 'cone' }] },
  ],
};
const ROBOT: Theme = {
  thing: 'robot', things: 'robots', intro: 'Each robot gets', verb: 'build', place: 'The workshop', groups: [
    { label: 'Bodies', word: 'body', words: 'bodies', items: (['red', 'blue', 'green', 'yellow', 'purple'] as ColorName[]).map((c) => ({ name: `${c} body`, icon: 'robot' as const, color: c })) },
    { label: 'Gears', word: 'gear', words: 'gears', items: [{ name: 'brass gear', icon: 'gear' }, ...(['orange', 'blue', 'green'] as ColorName[]).map((c) => ({ name: `${c} gear`, icon: 'gear' as const, color: c }))] },
    { label: 'Power', word: 'power source', words: 'power sources', items: [{ name: 'battery', icon: 'bolt' }, { name: 'solar panel', icon: 'sun' }, { name: 'wind-up key', icon: 'key' }] },
  ],
};
const ICE: Theme = {
  thing: 'sundae', things: 'sundaes', intro: 'A sundae has', verb: 'make', place: 'The shop', groups: [
    { label: 'Scoops', word: 'scoop', words: 'scoops', items: ([['cherry', 'red'], ['lemon', 'yellow'], ['mint', 'green'], ['grape', 'purple'], ['mango', 'orange'], ['berry', 'blue']] as [string, ColorName][]).map(([name, color]) => ({ name, icon: 'scoop' as const, color })) },
    { label: 'Toppings', word: 'topping', words: 'toppings', items: [{ name: 'sprinkles', icon: 'star' }, { name: 'candy heart', icon: 'heart' }, { name: 'cookie bits', icon: 'cookie' }] },
  ],
};
/** Take `n` items from a theme group (in a shuffled order, then back in menu order so the picture stays tidy). */
function takeItems(rng: Rng, g: MGroup, n: number): MGroup {
  const keep = new Set(rng.shuffle(range(g.items.length)).slice(0, n));
  return { ...g, items: g.items.filter((_, i) => keep.has(i)) };
}
const toGroups = (gs: MGroup[]): Group[] => gs.map((g) => ({ label: g.label, items: g.items }));
const ones = (gs: MGroup[]) => listAnd(gs.map((g) => `1 ${g.word}`));
const sizeLab = (g: MGroup) => labn(g.items.length, g.word, g.words);
/** "3 (mains) × 1 (orange juice) × 4 (snacks)": the chosen items fixed at 1, the other groups at their size. */
const fixedProduct = (gs: MGroup[], fixed: Record<number, string>) => gs.map((g, i) => (fixed[i] !== undefined ? lab(1, fixed[i]) : sizeLab(g))).join(' × ');

function menusQuestion(d: Difficulty, rng: Rng, sid: string): Question {
  const g = gradeOf(d) === 'g5' ? 'g5' : 'g3';
  if (g === 'g3') {
    const v = rng.pick(d === 3 ? ['one2', 'one2', 'one3'] : ['one3', 'one3', 'either']);
    if (v === 'either') {
      const [m, dk, s] = [rng.int(2, 3), rng.int(2, 4), rng.int(2, 3)];
      const gs = [takeItems(rng, LUNCH.groups[0], m), takeItems(rng, LUNCH.groups[1], dk), takeItems(rng, LUNCH.groups[2], s)];
      const ans = m * (dk + s);
      return make('menus', d, sid, {
        prompt: 'A lunch deal is 1 main and then either 1 drink or 1 snack, not both. How many different lunch deals are there?',
        expression: 'lunch deals = ?', answer: ans,
        hint: 'Count the deals with a drink. Then count the deals with a snack. Then put them together.',
        steps: [
          `Start a list: ${gs[0].items[0].name} and ${gs[1].items[0].name}; ${gs[0].items[0].name} and ${gs[1].items[1].name}; … then ${gs[0].items[0].name} and ${gs[2].items[0].name}; …`,
          `Main and drink: ${sizeLab(gs[0])} × ${sizeLab(gs[1])} = ${lab(m * dk, 'deals')}.`,
          `Main and snack: ${sizeLab(gs[0])} × ${sizeLab(gs[2])} = ${lab(m * s, 'deals')}.`,
          `Add the two kinds: ${lab(m * dk, 'deals with a drink')} + ${lab(m * s, 'deals with a snack')} = ${lab(ans, 'lunch deals')}.`,
        ],
        visual: menu(toGroups(gs)),
        // Took a drink and a snack; added the groups; drinks only; snacks only; forgot the main; forgot the main with a snack.
        choices: gradeChoices(rng, d, ans, [m * dk * s, m + dk + s, m * dk, m * s, dk + s, m * dk + s, m * s + dk]),
      });
    }
    const theme = rng.pick([LUNCH, ROBOT, ICE]);
    const three = v === 'one3' && theme !== ICE;
    const base = three ? theme.groups : theme === ICE ? theme.groups : theme.groups.slice(0, 2);
    const hi = d === 3 ? 3 : 5;
    let want = base.map((x) => rng.int(2, Math.min(hi, x.items.length)));
    // 2 × 2 is the one two-group menu where adding (2 + 2) gives the right count, so it is rare.
    if (want.length === 2 && want[0] === 2 && want[1] === 2 && rng.chance(0.75)) want = rng.pick([[2, 3], [3, 2], [3, 3]]);
    const gs = base.map((x, q) => takeItems(rng, x, want[q]));
    const sizes = gs.map((x) => x.items.length); const ans = prod(sizes);
    const steps = [`Start a list: ${gs.map((x) => x.items[0].name).join(', ')}; ${[gs[0].items[0].name, gs[1].items[1].name, ...gs.slice(2).map((x) => x.items[0].name)].join(', ')}; and so on.`];
    if (gs.length === 2) steps.push(`Each ${gs[0].word} goes with each ${gs[1].word}: ${sizeLab(gs[0])} × ${sizeLab(gs[1])} = ${lab(ans, theme.things)}.`);
    else {
      const pair = `${gs[0].word}-and-${gs[1].word} pairs`;
      steps.push(`Each ${gs[0].word} goes with each ${gs[1].word}: ${sizeLab(gs[0])} × ${sizeLab(gs[1])} = ${lab(sizes[0] * sizes[1], pair)}.`);
      steps.push(`Each pair goes with each ${gs[2].word}: ${lab(sizes[0] * sizes[1], pair)} × ${sizeLab(gs[2])} = ${lab(ans, theme.things)}.`);
    }
    return make('menus', d, sid, {
      prompt: `${theme.intro} ${ones(gs)}. How many different ${theme.things} can you ${theme.verb}?`,
      expression: `${theme.things} = ?`, answer: ans,
      hint: `Pick the first ${gs[0].word}. How many ways can you finish the ${theme.thing}? Every ${gs[0].word} has the same number.`,
      steps, visual: menu(toGroups(gs)), solution: ans <= 12 ? menu(toGroups(gs), true) : undefined,
      // Added the groups; left a group out (or added it on); listed every one twice; one row too many in the list; used the
      // bigger group twice; counted the branches of the tree as answers too, not just the ends.
      choices: gradeChoices(rng, d, ans, sizes.length === 3
        ? [sizes[0] + sizes[1] + sizes[2], sizes[0] * sizes[1], sizes[0] * sizes[1] + sizes[2], sizes[1] * sizes[2], sizes[0] * sizes[2], 2 * ans, sizes[0] * sizes[1] * (sizes[2] + 1), ans + sizes[0] * sizes[1], ans + sizes[0] * sizes[1] + sizes[0]]
        : [sizes[0] + sizes[1], sizes[0], sizes[1], 2 * ans, (sizes[0] + 1) * sizes[1], sizes[0] * (sizes[1] + 1), Math.max(...sizes) ** 2, ans + sizes[0], ans + sizes[0] + sizes[1]]),
    });
  }

  // Grade 5
  const v = rng.pick(d === 5 ? ['rule', 'rule', 'not', 'more', 'double'] : ['rule', 'rule2', 'rule2', 'or', 'double']);
  if (v === 'double') {
    const s = rng.int(4, d === 5 ? 5 : 6); const t = rng.int(2, 3);
    const gs = [takeItems(rng, ICE.groups[0], s), takeItems(rng, ICE.groups[1], t)];
    const ordered = s * (s - 1); const pairs = ordered / 2; const ans = pairs * t;
    const [f1, f2] = [gs[0].items[0].name, gs[0].items[1].name];
    return make('menus', d, sid, {
      prompt: 'A double sundae has 2 different scoops and 1 topping. The order of the 2 scoops does not matter. How many different double sundaes can you make?',
      expression: 'double sundaes = ?', answer: ans,
      hint: `Count the pairs of different scoops first. Is ${f1} with ${f2} different from ${f2} with ${f1}?`,
      steps: [
        `Pick the scoops one at a time: ${lab(s, 'flavours')} × ${lab(s - 1, 'flavours left')} = ${lab(ordered, 'picks in order')}.`,
        `Each pair got picked twice (${f1} then ${f2}, or ${f2} then ${f1}), so ${lab(ordered, 'picks in order')} ÷ ${lab(2, 'orders of each pair')} = ${lab(pairs, 'scoop pairs')}.`,
        `Each scoop pair goes with every topping: ${lab(pairs, 'scoop pairs')} × ${sizeLab(gs[1])} = ${lab(ans, 'double sundaes')}.`,
      ],
      visual: menu(toGroups(gs)),
      // Counted both orders; let a scoop pair with itself (in both orders, or once); forgot the toppings (with and without
      // the orders); added the toppings; one scoop only.
      choices: gradeChoices(rng, d, ans, [ordered * t, s * s * t, (pairs + s) * t, pairs, ordered, pairs + t, s * t]),
    });
  }
  const theme = rng.pick([LUNCH, ROBOT]);
  const want = theme.groups.map((x) => rng.int(2, Math.min(d === 5 ? 4 : 5, x.items.length)));
  // At least 12 in all: a 2 × 2 × 2 menu is too small for Grade 5 (its mistakes all land on the same few numbers).
  if (prod(want) < 12) want[rng.int(0, 2)] = 3;
  const gs = theme.groups.map((x, q) => takeItems(rng, x, want[q]));
  const sizes = gs.map((x) => x.items.length); const total = prod(sizes);
  const T = theme.things;
  const allLine = `All ${T}: ${gs.map(sizeLab).join(' × ')} = ${lab(total, T)}.`;
  const intro = `${theme.intro} ${ones(gs)}.`;
  const ask = `How many different ${T} can you ${theme.verb}?`;
  const [i, j, k] = rng.shuffle([0, 1, 2]);
  const x = rng.pick(gs[i].items).name; const y = rng.pick(gs[j].items).name;
  const nx = total / sizes[i]; const ny = total / sizes[j]; const nxy = total / (sizes[i] * sizes[j]);
  if (v === 'rule') {
    const ans = total - nxy;
    return make('menus', d, sid, {
      prompt: `${intro} But the ${x} never goes with the ${y}. ${ask}`,
      expression: `${T} = ?`, answer: ans,
      hint: `Count all the ${T} first. Then count the ones with the ${x} and the ${y}, and take them away.`,
      steps: [
        allLine,
        `${cap(T)} with the ${x} and the ${y}: ${fixedProduct(gs, { [i]: x, [j]: y })} = ${lab(nxy, T)}.`,
        `Take those away: ${lab(total, T)} − ${lab(nxy, 'with both')} = ${lab(ans, T)}.`,
      ],
      visual: { ...menu(toGroups(gs)), bans: [[x, y]] },
      // Forgot the rule; took away only 1; took away everything with one of the two; struck both off the menu; gave the
      // banned count; took the banned ones away twice.
      choices: gradeChoices(rng, d, ans, [total, total - 1, total - nx, total - ny, (sizes[i] - 1) * (sizes[j] - 1) * sizes[k], nxy, total - 2 * nxy]),
    });
  }
  if (v === 'rule2') {
    // Two rules share the item y: the one choice with x, y and z breaks both, so it is taken away twice.
    const z = rng.pick(gs[k].items).name;
    const bad1 = total / (sizes[i] * sizes[j]); const bad2 = total / (sizes[j] * sizes[k]);
    const ans = total - bad1 - bad2 + 1;
    return make('menus', d, sid, {
      prompt: `${intro} But the ${x} never goes with the ${y}, and the ${y} never goes with the ${z}. ${ask}`,
      expression: `${T} = ?`, answer: ans,
      hint: `Count all the ${T}, take away each rule's ${T}, and watch for one ${theme.thing} that breaks both rules.`,
      steps: [
        allLine,
        `Rule one, the ${x} with the ${y}: ${fixedProduct(gs, { [i]: x, [j]: y })} = ${lab(bad1, T)}.`,
        `Rule two, the ${y} with the ${z}: ${fixedProduct(gs, { [j]: y, [k]: z })} = ${lab(bad2, T)}.`,
        `The ${theme.thing} with the ${x}, the ${y} and the ${z} is in both lists, so it got taken away twice. Add it back once.`,
        `${lab(total, T)} − ${lab(bad1, 'banned by rule one')} − ${lab(bad2, 'banned by rule two')} + ${lab(1, 'banned twice')} = ${lab(ans, T)}.`,
      ],
      visual: { ...menu(toGroups(gs)), bans: [[x, y], [y, z]] },
      // Forgot to add the one back; used only one rule; forgot both; gave the banned count (or one rule's, or both added);
      // took away 1 per rule.
      choices: gradeChoices(rng, d, ans, [ans - 1, total - bad1, total - bad2, total, bad1 + bad2 - 1, bad1 + bad2, bad1, bad2, total - 2]),
    });
  }
  if (v === 'not') {
    const ans = nx - nxy;
    return make('menus', d, sid, {
      prompt: `${intro} How many different ${T} have the ${x} but not the ${y}?`,
      expression: `${T} = ?`, answer: ans,
      hint: `Count the ${T} with the ${x}. Then take away the ones that also have the ${y}.`,
      steps: [
        `${cap(T)} with the ${x}: ${fixedProduct(gs, { [i]: x })} = ${lab(nx, T)}.`,
        `Of those, the ones with the ${y} too: ${fixedProduct(gs, { [i]: x, [j]: y })} = ${lab(nxy, T)}.`,
        `${lab(nx, `with the ${x}`)} − ${lab(nxy, 'with both')} = ${lab(ans, T)}.`,
      ],
      visual: { ...menu(toGroups(gs)), marks: [x], crossed: [y] },
      // Forgot to take away; all without the y; all without the pair; gave the ones with both; all without the x.
      choices: gradeChoices(rng, d, ans, [nx, total - ny, total - nxy, nxy, total - nx]),
    });
  }
  if (v === 'or') {
    const ans = nx + ny - nxy;
    return make('menus', d, sid, {
      prompt: `${intro} How many different ${T} have the ${x} or the ${y}, or both?`,
      expression: `${T} = ?`, answer: ans,
      hint: `Count the ${T} with the ${x}, then the ones with the ${y}. Did any get counted twice?`,
      steps: [
        `With the ${x}: ${fixedProduct(gs, { [i]: x })} = ${lab(nx, T)}.`,
        `With the ${y}: ${fixedProduct(gs, { [j]: y })} = ${lab(ny, T)}.`,
        `With both: ${fixedProduct(gs, { [i]: x, [j]: y })} = ${lab(nxy, T)}. Those are in both counts.`,
        `${lab(nx, `with the ${x}`)} + ${lab(ny, `with the ${y}`)} − ${lab(nxy, 'counted twice')} = ${lab(ans, T)}.`,
      ],
      visual: { ...menu(toGroups(gs)), marks: [x, y] },
      // Counted the both-ones twice; one of the two only; both only; left out the both-ones; the ones with neither; all.
      choices: gradeChoices(rng, d, ans, [nx + ny, nx, ny, nxy, nx + ny - 2 * nxy, total - ans, total]),
    });
  }
  // more: one more item in one group
  const gi = rng.int(0, 2); const rest = [0, 1, 2].filter((q) => q !== gi);
  const ans = sizes[rest[0]] * sizes[rest[1]];
  const after = total + ans;
  return make('menus', d, sid, {
    prompt: `${intro} ${theme.place} adds 1 more ${gs[gi].word}. How many more ${T} can you ${theme.verb} now?`,
    expression: `more ${T} = ?`, answer: ans,
    hint: `The new ${gs[gi].word} can go with every ${gs[rest[0]].word} and every ${gs[rest[1]].word}.`,
    steps: [
      `The new ${gs[gi].word} goes with each ${gs[rest[0]].word} and each ${gs[rest[1]].word}: ${sizeLab(gs[rest[0]])} × ${sizeLab(gs[rest[1]])} = ${lab(ans, `new ${T}`)}.`,
      `Check: before, ${gs.map(sizeLab).join(' × ')} = ${lab(total, T)}.`,
      `After: ${gs.map((g2, q) => (q === gi ? labn(sizes[q] + 1, g2.word, g2.words) : sizeLab(g2))).join(' × ')} = ${lab(after, T)}.`,
      `${lab(after, `${T} after`)} − ${lab(total, `${T} before`)} = ${lab(ans, `more ${T}`)}.`,
    ],
    visual: menu(toGroups(gs)),
    // Gave the new total; gave the old total; 1 more item makes 1 more; added the other groups; one group only.
    choices: gradeChoices(rng, d, ans, [after, total, 1, sizes[rest[0]] + sizes[rest[1]], sizes[rest[0]], sizes[rest[1]]]),
  });
}

/* ------------------------------------------------------------------ */
/* orders (line-ups)                                                   */
/* ------------------------------------------------------------------ */

const FRIENDS = ['Ana', 'Ben', 'Cy', 'Dot', 'Eli', 'Flo', 'Gus'];
const BOTS = ['Bolt', 'Cog', 'Dash', 'Echo', 'Fizz', 'Gizmo', 'Hex'];
const PEOPLE_COLORS: ColorName[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];
/** People (up to 5) or robots (up to 7) for a row. Every one looks different: a 7th robot keeps its plain grey body. */
function crowd(rng: Rng, n: number, bots = false): Item[] {
  const names = rng.shuffle(bots ? BOTS : FRIENDS).slice(0, n).sort();
  const cs = rng.shuffle(PEOPLE_COLORS);
  return names.map((name, i) => (i < cs.length ? { name, icon: bots ? 'robot' : 'person', color: cs[i] } : { name, icon: 'robot' }));
}
/** "5 (choices for first) × 4 (choices for second) × … × 1 (choice for last)" for m places to fill out of `from` people; `free` = the spots left open around someone already placed. */
function chain(from: number, m: number, free = false): string {
  return range(m).map((i) => {
    const c = from - i; const spot = i === m - 1 && c === 1 ? 'last' : ORD[i];
    return lab(c, `${unit(c, 'choice')} for ${free ? `the ${spot} free spot` : spot}`);
  }).join(' × ');
}
const PLACE_WORDS = (n: number) => [['first', 0], ['last', n - 1], ...(n % 2 ? [['in the middle', (n - 1) / 2]] : []), ...(n >= 4 ? [['second', 1]] : [])] as [string, number][];

function ordersQuestion(d: Difficulty, rng: Rng, sid: string): Question {
  const g = gradeOf(d) === 'g5' ? 'g5' : 'g3';
  const v = g === 'g3'
    ? rng.pick(d === 3 ? ['three', 'three', 'fixed'] : ['three', 'fixed', 'medal', 'four'])
    : rng.pick(d === 5 ? ['row', 'fixed', 'together', 'together'] : ['together', 'apart', 'ends', 'podium', 'fixed']);
  const ask = 'How many different orders are there?';

  if (v === 'medal' || v === 'podium') {
    const n = v === 'medal' ? rng.int(3, 5) : rng.int(5, 7); const m = v === 'medal' ? 2 : 3;
    const items = crowd(rng, n, true);
    const places = ['Gold', 'Silver', 'Bronze'].slice(0, m);
    const ans = prod(range(m).map((i) => n - i));
    // Let a robot win twice; order did not matter; added the choices; gold only; forgot to shrink once; 3 medals × robots.
    const wrong = m === 2 ? [n * n, ans / 2, 2 * n - 1, n, (n - 1) * (n - 1)] : [n * n * n, ans / 6, n * (n - 1), 3 * n - 3, n * n * (n - 1), n * (n - 1) * (n - 1), 3 * n];
    return make('orders', d, sid, {
      prompt: m === 2
        ? `${n} robots race. One wins gold and another wins silver. How many different ways can the medals go?`
        : `${n} robots race for gold, silver and bronze. How many different ways can the 3 medals go?`,
      expression: 'ways = ?', answer: ans,
      hint: `How many robots could win gold? Once gold is taken, how many are left for silver?${m === 3 ? ' And then for bronze?' : ''}`,
      steps: [
        m === 2
          ? `List a few: gold ${items[0].name}, silver ${items[1].name}; gold ${items[1].name}, silver ${items[0].name}. Those are different!`
          : `List a few: gold ${items[0].name}, silver ${items[1].name}, bronze ${items[2].name}; gold ${items[0].name}, silver ${items[2].name}, bronze ${items[1].name}; gold ${items[1].name}, silver ${items[0].name}, bronze ${items[2].name}. Each one is a different way!`,
        `Gold: any of the ${lab(n, 'robots')}. Silver: any of the ${lab(n - 1, 'robots left')}.${m === 3 ? ` Bronze: any of the ${lab(n - 2, 'robots left')}.` : ''}`,
        `${range(m).map((i) => lab(n - i, `choices for ${places[i].toLowerCase()}`)).join(' × ')} = ${lab(ans, 'ways')}.`,
      ],
      visual: { type: 'lineup', items, mode: 'row', places },
      choices: gradeChoices(rng, d, ans, wrong),
    });
  }

  const n = v === 'three' ? 3 : v === 'fixed' ? (g === 'g3' ? (d === 3 ? 3 : 4) : rng.int(4, 5)) : v === 'four' ? 4 : rng.int(4, 5);
  let items = crowd(rng, n);
  const names = items.map((x) => x.name);
  const places = PLACE.slice(0, n);
  const who = `${listAnd(names)}`;

  if (v === 'three' || v === 'four') {
    const ans = fact(n);
    const [A, B, C] = names;
    const steps = n === 3
      ? [
        `With ${A} first: ${A}, ${B}, ${C} or ${A}, ${C}, ${B}. That is ${lab(2, 'orders')}.`,
        `With ${B} first: ${B}, ${A}, ${C} or ${B}, ${C}, ${A}. Also ${lab(2, 'orders')}.`,
        `With ${C} first: ${C}, ${A}, ${B} or ${C}, ${B}, ${A}. Also ${lab(2, 'orders')}.`,
        `${lab(2, 'orders')} + ${lab(2, 'orders')} + ${lab(2, 'orders')} = ${lab(6, 'orders')}.`,
        `Shortcut: ${chain(3, 3)} = ${lab(6, 'orders')}.`,
      ]
      : [
        `Put ${A} first. The other ${lab(3, 'friends')} can stand in ${lab(6, 'orders')}, just like ${lab(3, 'friends')} in a row: ${perms(names.slice(1)).map((p) => [A, ...p].join(' ')).slice(0, 2).join('; ')}; and so on.`,
        `Each of the ${lab(4, 'friends')} can stand first, and each time the rest make ${lab(6, 'orders')}.`,
        `${lab(4, 'friends who can be first')} × ${lab(6, 'orders of the rest')} = ${lab(24, 'orders')}.`,
      ];
    return make('orders', d, sid, {
      prompt: `${who} stand in a row for a photo. ${ask}`,
      expression: 'orders = ?', answer: ans,
      hint: n === 3 ? `Pick who stands first. Then list the ways for the other two.` : `Put ${A} first and count the orders of the rest. Then the same for each friend.`,
      steps, visual: { type: 'lineup', items, mode: 'row', places },
      // Forgot that the choices shrink (3 × 3, 3 × 3 × 3, 4 × 4, 4 × 4 × 4 × 4); only who stands first; one friend first only;
      // only two places (4 × 3); started shrinking one place late (4 × 4 × 3 × 2); added 4 + 3 + 2 + 1.
      choices: gradeChoices(rng, d, ans, n === 3 ? [9, 3, 27, 2] : [16, 12, 6, 96, 256, 10, 4]),
    });
  }

  if (v === 'fixed') {
    const [word, at] = rng.pick(PLACE_WORDS(n));
    const xi = rng.int(0, n - 1); const X = names[xi];
    const others = names.filter((_, q) => q !== xi);
    const ans = fact(n - 1);
    const steps = [`${X} stays ${word}, so only the other ${lab(n - 1, 'friends')} move.`];
    if (n === 3) {
      const orders = perms(others).map((p) => { const row = [...p]; row.splice(at, 0, X); return row.join(', '); });
      steps.push(`The orders: ${orders.join(' or ')}.`, `That is ${lab(ans, 'orders')}.`);
    } else steps.push(`They fill the free spots: ${chain(n - 1, n - 1, true)} = ${lab(ans, 'orders')}.`);
    return make('orders', d, sid, {
      prompt: `${who} line up at the door. ${X} must stand ${word}. ${ask}`,
      expression: 'orders = ?', answer: ans,
      hint: `${X}'s place is set. Count the orders of the others.`,
      steps, visual: { type: 'lineup', items, mode: 'row', places, fixed: [xi, at] },
      // Forgot the rule; gave the number of friends, or 1 way; forgot that the choices shrink; one friend too few; only two
      // places; took away the orders with the friend in that place.
      choices: gradeChoices(rng, d, ans, n === 3 ? [6, 3, 1, 4] : [fact(n), (n - 1) ** (n - 1), fact(n - 2), n * (n - 1), (n - 1) * (n - 2), fact(n) - fact(n - 1)]),
    });
  }

  if (v === 'row') {
    const ans = fact(n);
    return make('orders', d, sid, {
      prompt: `${who} stand in a row for a team photo. ${ask}`,
      expression: 'orders = ?', answer: ans,
      hint: 'How many friends could stand first? Once that place is filled, how many could stand second?',
      steps: [
        `List a few: ${perms(names).slice(0, 2).map((p) => p.join(' ')).join('; ')}; …`,
        `The choices shrink by one for each place: ${chain(n, n)} = ${lab(ans, 'orders')}.`,
      ],
      visual: { type: 'lineup', items, mode: 'row', places },
      // Forgot that the choices shrink; started shrinking one place late; added; only two places (n × n or n × (n − 1));
      // one friend too few or too many; 2 ways per place; thought an order and its mirror are the same.
      choices: gradeChoices(rng, d, ans, [n ** n, n * fact(n), (n * (n + 1)) / 2, n * n, n * (n - 1), fact(n - 1), fact(n + 1), 2 ** n, fact(n) / 2]),
    });
  }

  // Two named friends: together (a block), apart (all − together) or at the two ends.
  const [pi, pj] = rng.shuffle(range(n)).slice(0, 2).sort((p, q) => p - q);
  const X = names[pi]; const Y = names[pj];
  const block = 2 * fact(n - 1);
  if (v === 'together') {
    // Draw the two friends side by side, holding hands.
    const rest = items.filter((_, q) => q !== pi && q !== pj);
    const at = rng.int(0, rest.length);
    items = [...rest.slice(0, at), items[pi], items[pj], ...rest.slice(at)];
    return make('orders', d, sid, {
      prompt: `${who} line up for the bus. ${X} and ${Y} must stand next to each other. ${ask}`,
      expression: 'orders = ?', answer: block,
      hint: `Tie ${X} and ${Y} together into one block. How many things are there to line up now?`,
      steps: [
        `Glue ${X} and ${Y} into one block. Now there are ${lab(n - 1, 'things to line up')}: the block and the other ${labn(n - 2, 'friend')}.`,
        `${chain(n - 1, n - 1)} = ${lab(fact(n - 1), 'block orders')}.`,
        `Inside the block, ${X} can stand on the left or on the right of ${Y}: ${lab(2, 'ways')}.`,
        `${lab(fact(n - 1), 'block orders')} × ${lab(2, 'ways inside the block')} = ${lab(block, 'orders')}.`,
      ],
      visual: { type: 'lineup', items, mode: 'row', places, together: [at, at + 1] },
      // Forgot the 2 inside the block; forgot the rule; lined up only the others (with or without the 2); added the 2;
      // counted the orders where they are apart; forgot to glue but still doubled; counted only the block's places × 2.
      choices: gradeChoices(rng, d, block, [fact(n - 1), fact(n), 2 * fact(n - 2), fact(n - 2), fact(n - 1) + 2, fact(n) - block, 2 * fact(n), 2 * (n - 1)]),
    });
  }
  if (v === 'apart') {
    // Draw the two apart (never side by side, so the picture does not look like the "together" one), with a red ✕ arc.
    const rest = items.filter((_, q) => q !== pi && q !== pj);
    const spots = range(n).flatMap((p) => range(n).filter((q) => q - p >= 2).map((q) => [p, q] as [number, number]));
    const [p, q] = rng.pick(spots);
    const row: Item[] = []; let r = 0;
    for (let s = 0; s < n; s++) row.push(s === p ? items[pi] : s === q ? items[pj] : rest[r++]);
    items = row;
    const ans = fact(n) - block;
    return make('orders', d, sid, {
      prompt: `${who} line up for the bus. ${X} and ${Y} must not stand next to each other. ${ask}`,
      expression: 'orders = ?', answer: ans,
      hint: `Count all the orders. Then count the orders with ${X} and ${Y} side by side, and take them away.`,
      steps: [
        `All orders: ${chain(n, n)} = ${lab(fact(n), 'orders')}.`,
        `With ${X} and ${Y} side by side: glue them into a block, ${lab(fact(n - 1), 'block orders')} × ${lab(2, 'ways inside the block')} = ${lab(block, 'orders')}.`,
        `Take those away: ${lab(fact(n), 'all orders')} − ${lab(block, 'orders side by side')} = ${lab(ans, 'orders')}.`,
      ],
      visual: { type: 'lineup', items, mode: 'row', places, apart: [p, q], mark: [p, q] },
      // Gave the side-by-side count; forgot the rule; forgot the 2 inside the block; the block count without the 2; took away
      // the others' orders; took away only 2.
      choices: gradeChoices(rng, d, ans, [block, fact(n), fact(n) - fact(n - 1), fact(n - 1), fact(n) - 2 * fact(n - 2), fact(n) - 2]),
    });
  }
  // ends
  const mid = fact(n - 2); const ans = 2 * mid;
  return make('orders', d, sid, {
    prompt: `${who} line up for the bus. ${X} and ${Y} must stand at the two ends of the line. ${ask}`,
    expression: 'orders = ?', answer: ans,
    hint: `First place ${X} and ${Y} at the ends. Then fill the middle.`,
    steps: [
      `The ends: ${X} on the left and ${Y} on the right, or the other way round: ${lab(2, 'ways')}.`,
      `The middle: the other ${labn(n - 2, 'friend')} fill it, ${chain(n - 2, n - 2, true)} = ${lab(mid, 'orders')}.`,
      `${lab(2, 'ways for the ends')} × ${lab(mid, 'orders for the middle')} = ${lab(ans, 'orders')}.`,
    ],
    visual: { type: 'lineup', items, mode: 'row', places, mark: [pi, pj] },
    // Forgot to swap the ends; forgot the rule; counted them side by side; fixed only one; added the 2; forgot the middle orders.
    choices: gradeChoices(rng, d, ans, [mid, fact(n), block, fact(n - 1), mid + 2, 2 * (n - 2)]),
  });
}

/* ------------------------------------------------------------------ */
/* grid routes                                                         */
/* ------------------------------------------------------------------ */

/** Ways into each corner [y][x] moving only up or right; blocked corners get 0. */
export function routeCounts(w: number, h: number, blocked: [number, number][] = []): number[][] {
  const isB = (x: number, y: number) => blocked.some(([bx, by]) => bx === x && by === y);
  const c: number[][] = range(h + 1).map(() => range(w + 1).map(() => 0));
  for (let y = 0; y <= h; y++) for (let x = 0; x <= w; x++) {
    if (isB(x, y)) c[y][x] = 0;
    else if (x === 0 && y === 0) c[y][x] = 1;
    else c[y][x] = (y > 0 ? c[y - 1][x] : 0) + (x > 0 ? c[y][x - 1] : 0);
  }
  return c;
}
/** The corner adding done with a common slip: a ✕ corner written as 1 instead of 0. */
function routesXAsOne(w: number, h: number, blocked: [number, number][]): number {
  const isB = (x: number, y: number) => blocked.some(([bx, by]) => bx === x && by === y);
  const c: number[][] = range(h + 1).map(() => range(w + 1).map(() => 0));
  for (let y = 0; y <= h; y++) for (let x = 0; x <= w; x++) c[y][x] = isB(x, y) || (x === 0 && y === 0) ? 1 : (y > 0 ? c[y - 1][x] : 0) + (x > 0 ? c[y][x - 1] : 0);
  return c[h][w];
}
const STREET = ['Bottom street', 'Street 1 up', 'Street 2 up', 'Street 3 up', 'Street 4 up'];

function gridQuestion(d: Difficulty, rng: Rng, sid: string): Question {
  const g = gradeOf(d) === 'g5' ? 'g5' : 'g3';
  let w: number; let h: number; let blocked: [number, number][] = [];
  if (g === 'g3') [w, h] = rng.pick(d === 3 ? [[1, 2], [2, 1], [1, 2], [1, 3], [3, 1]] : [[2, 2], [2, 2], [2, 3], [3, 2]]);
  else {
    const nb = d === 5 ? (rng.chance(0.4) ? 1 : 0) : (rng.chance(0.65) ? 1 : 2);
    [w, h] = nb === 0 ? rng.pick([[3, 2], [2, 3], [3, 3], [4, 2], [4, 3]]) : nb === 1 ? rng.pick(d === 5 ? [[3, 2], [3, 3], [4, 2]] : [[4, 3], [3, 3], [4, 2], [4, 3]]) : [4, 3];
    // Never Start, Finish or the two far corners (top-left, bottom-right): a ✕ there only takes away 1 route, so the
    // answer would just be "all routes − 1" with no corner-by-corner adding.
    const far = (x: number, y: number) => (x === 0 && y === 0) || (x === w && y === h) || (x === 0 && y === h) || (x === w && y === 0);
    const free = range(w + 1).flatMap((x) => range(h + 1).map((y) => [x, y] as [number, number])).filter(([x, y]) => !far(x, y));
    for (let tries = 0; tries < 80; tries++) {
      const pick = rng.shuffle(free).slice(0, nb);
      const ans = routeCounts(w, h, pick)[h][w];
      // Keep it worth working: some routes left, and each block really removes routes (at least 2, given the others).
      if (ans >= 3 && pick.every((p) => routeCounts(w, h, pick.filter((q) => q !== p))[h][w] - ans >= 2)) { blocked = pick.sort((a, b) => a[1] - b[1] || a[0] - b[0]); break; }
    }
  }
  const counts = routeCounts(w, h, blocked); const ans = counts[h][w]; const open = routeCounts(w, h)[h][w];
  const isB = (x: number, y: number) => blocked.some(([bx, by]) => bx === x && by === y);
  const steps: string[] = [];
  if (g === 'g3') {
    const moves = (rs: string[]): string[] => (rs[0].length === w + h ? rs : moves(rs.flatMap((r) => {
      const ups = [...r].filter((m) => m === '↑').length; const rights = r.length - ups;
      return [...(ups < h ? [`${r}↑`] : []), ...(rights < w ? [`${r}→`] : [])];
    })));
    const all = moves(['']);
    steps.push(`Every route makes ${labn(w, 'move right', 'moves right')} and ${labn(h, 'move up', 'moves up')}, in some order.`);
    if (all.length <= 6) steps.push(`List them: ${all.join(', ')}. That is ${lab(all.length, 'routes')}.`);
  }
  steps.push(`Write in each corner how many ways reach it. Start has ${lab(1, 'way')}. Each corner on the bottom street or the left side has ${lab(1, 'way')}: go straight${blocked.some(([x, y]) => x === 0 || y === 0) ? `, but after a ✕ on that edge each corner has ${lab(0, 'ways')}` : ''}.`);
  if (blocked.length) steps.push(`A ✕ corner has ${lab(0, 'ways')}: no route may use it.`);
  for (let y = 1; y <= h; y++) {
    const terms: string[] = [];
    for (let x = 1; x <= w; x++) {
      const b = counts[y - 1][x]; const l = counts[y][x - 1]; const v = counts[y][x];
      const last = x === w && y === h;
      if (isB(x, y)) { terms.push(`✕ gets ${lab(0, 'ways')}`); continue; }
      terms.push(`${lab(b, 'from below')} + ${lab(l, 'from the left')} = ${last ? labn(v, 'route') : labn(v, 'way')}`);
    }
    steps.push(`${STREET[y]}: ${terms.join('; ')}.`);
  }
  steps.push(`So ${labn(ans, 'route')} ${ans === 1 ? 'reaches' : 'reach'} Finish.`);
  let path: [number, number][] | undefined;
  if (d === 3) {
    const seq = rng.shuffle([...range(w).map(() => 'R'), ...range(h).map(() => 'U')]);
    let x = 0; let y = 0; path = [[0, 0]];
    for (const m of seq) { if (m === 'R') x++; else y++; path.push([x, y]); }
  }
  const nb = blocked.length;
  const prompt = g === 'g3'
    ? `Robo drives on the streets from Start to Finish. Robo only goes up or right.${path ? ' The teal line is one route.' : ''} How many different routes are there?`
    : `A delivery robot drives along the streets from Start to Finish, only up or right.${nb ? ` It cannot pass through the ✕ ${nb === 1 ? 'corner' : 'corners'}.` : ''} How many different routes can it take?`;
  // The corners one step before Finish (stopped one corner early), and those two multiplied instead of added.
  const [left, below] = [counts[h][w - 1], counts[h - 1][w]];
  const wrong = g === 'g3'
    // Counted the moves; only the two straight routes; counted the squares or the corners; stopped one corner early;
    // 2 ways at every move; counted every route twice.
    ? [w + h, 2, w * h, (w + 1) * (h + 1), left, below, 2 ** (w + h), 2 * ans]
    : nb
      // Forgot the ✕; forgot one of the two ✕; took away 1 route per ✕; gave the routes through a ✕; wrote 1 in a ✕
      // corner; stopped one corner early; counted the squares.
      ? [open, ...(nb === 2 ? blocked.map((b) => routeCounts(w, h, blocked.filter((q) => q !== b))[h][w]) : []), open - nb, open - ans, routesXAsOne(w, h, blocked), left, below, w * h]
      // Counted the squares or the corners; multiplied the last two corners; counted the moves; stopped one corner early.
      : [w * h, (w + 1) * (h + 1), left * below, w + h, left, below, 2 ** (w + h)];
  return make('grid', d, sid, {
    prompt, expression: 'routes = ?', answer: ans,
    hint: g === 'g3'
      ? 'Every route uses the same moves, just in a different order. List them, or write the ways to reach each corner.'
      : `Write in each corner how many ways reach it: the ways from below plus the ways from the left.${nb ? ' A ✕ corner gets 0.' : ''}`,
    steps,
    visual: { type: 'gridpath', w, h, ...(nb ? { blocked } : {}), ...(path ? { path } : {}) },
    solution: { type: 'gridpath', w, h, ...(nb ? { blocked } : {}), counts: true },
    choices: gradeChoices(rng, d, ans, wrong),
  });
}

/* ------------------------------------------------------------------ */
/* pairs (handshakes)                                                  */
/* ------------------------------------------------------------------ */

const CIRCLE_NAMES = ['Ana', 'Ben', 'Cy', 'Dot', 'Eli', 'Flo', 'Gus', 'Hal', 'Ivy', 'Jo', 'Kit', 'Lu', 'Mo'];
const LETTERS = 'ABCDEFGHIJKLM'.split('');
interface PairTheme { who: string; act: string; one: string; many: string; items: (n: number, ring?: number) => Item[]; prompt: (n: number) => string; call?: (name: string) => string }
/**
 * Colours for people round a circle. There are only 6 colours, so from 7 people on some repeat: each repeat goes to the
 * least-used colour whose other wearers sit farthest round the circle (never side by side). The picture also adds a
 * letter badge whenever a colour repeats. Anyone after the first `ring` (a late arrival) gets the least-used colour.
 */
export function circleColors(total: number, ring = total): ColorName[] {
  const out: ColorName[] = [];
  const uses = (c: ColorName) => out.filter((x) => x === c).length;
  for (let i = 0; i < total; i++) {
    if (i < PEOPLE_COLORS.length) { out.push(PEOPLE_COLORS[i]); continue; }
    const gap = (c: ColorName) => (i >= ring ? 0 : Math.min(...out.map((x, j) => (x === c && j < ring ? Math.min(i - j, ring - (i - j)) : Infinity))));
    const best = [...PEOPLE_COLORS].sort((a, b) => uses(a) - uses(b) || gap(b) - gap(a))[0];
    out.push(best);
  }
  return out;
}
const PAIR_THEMES: Record<'hand' | 'league' | 'team' | 'dots' | 'twice', PairTheme> = {
  hand: {
    who: 'friends', act: 'shakes hands with', one: 'handshake', many: 'handshakes',
    items: (n, ring) => { const cs = circleColors(n, ring); return CIRCLE_NAMES.slice(0, n).map((name, i) => ({ name, icon: 'person', color: cs[i] })); },
    prompt: (n) => `${n} friends meet at the robot club. Each friend shakes hands with every other friend once. How many handshakes are there?`,
  },
  league: {
    who: 'teams', act: 'plays', one: 'game', many: 'games',
    items: (n) => { const cs = circleColors(n); return LETTERS.slice(0, n).map((l, i) => ({ name: `Team ${l}`, icon: 'shirt', color: cs[i] })); },
    prompt: (n) => `${n} teams play in a robot football league. Each team plays every other team once. How many games are played?`,
  },
  twice: {
    who: 'teams', act: 'pairs up with', one: 'pair', many: 'pairs of teams',
    items: (n) => { const cs = circleColors(n); return LETTERS.slice(0, n).map((l, i) => ({ name: `Team ${l}`, icon: 'shirt', color: cs[i] })); },
    prompt: (n) => `${n} teams play in a robot football league. Each team plays every other team twice: once at home and once away. How many games are played?`,
  },
  team: {
    who: 'robots', act: 'can pair with', one: 'pair', many: 'pairs',
    items: (n) => { const cs = circleColors(n); return LETTERS.slice(0, n).map((l, i) => ({ name: l, icon: 'robot', color: cs[i] })); },
    prompt: (n) => `Coach Vee picks 2 of these ${n} robots to work as a team. How many different teams of 2 can she pick?`,
    call: (name) => `Robot ${name}`,
  },
  dots: {
    who: 'stars', act: 'joins to', one: 'line', many: 'lines',
    items: (n) => LETTERS.slice(0, n).map((l) => ({ name: l, icon: 'star', color: 'yellow' as ColorName })),
    prompt: (n) => `Draw a straight line between every two of these ${n} stars. How many lines do you draw?`,
    call: (name) => `Star ${name}`,
  },
};
/** "5 (for Ana) + 4 (new for Ben) + … + 1 (new for Eli)": what each one adds, counting down (shortened when long). */
function downSum(who: string[]): string {
  const top = who.length;
  const term = (i: number) => lab(top - i, i === 0 ? `for ${who[0]}` : `new for ${who[i]}`);
  return top <= 7 ? range(top).map(term).join(' + ') : `${term(0)} + ${term(1)} + ${term(2)} + … + ${term(top - 1)}`;
}

function pairsQuestion(d: Difficulty, rng: Rng, sid: string): Question {
  const v = d <= 5 ? rng.pick(['hand', 'league', 'team', 'dots'] as const) : rng.pick(['hand', 'league', 'team', 'dots', 'twice', 'skip', 'late'] as const);
  const n = d <= 5 ? rng.int(4, 8) : rng.int(6, v === 'late' ? 11 : 12);
  const th = PAIR_THEMES[v === 'skip' || v === 'late' ? 'hand' : v];
  const people = n + (v === 'late' ? 1 : 0);
  const items = th.items(people, n);
  const base = choose2(n); const twice = n * (n - 1);
  const call = th.call ?? ((name: string) => name);
  const [P0, P1] = [call(items[0].name), call(items[1].name)];
  const listing = [
    `${P0} ${th.act} the other ${lab(n - 1, th.who)}.`,
    `${P1} ${th.act} ${lab(n - 2, `new ${th.who}`)}: the ${th.one} with ${P0} is already counted.`,
    `Keep going and add: ${downSum(items.slice(0, n - 1).map((x) => call(x.name)))} = ${lab(base, th.many)}.`,
    `Shortcut: ${lab(n, th.who)} × ${lab(n - 1, 'others each')} = ${lab(twice, 'counted twice')}, then ${lab(twice, 'counted twice')} ÷ ${lab(2, 'times each pair is counted')} = ${lab(base, th.many)}.`,
  ];
  if (v === 'twice') {
    const ans = twice;
    return make('pairs', d, sid, {
      prompt: th.prompt(n), expression: 'games = ?', answer: ans,
      hint: 'First count the pairs of teams, each pair once. Then think about how many games each pair plays.',
      steps: [...listing, `Each pair plays twice: ${lab(base, 'pairs of teams')} × ${lab(2, 'games per pair')} = ${lab(ans, 'games')}.`],
      visual: { type: 'lineup', items, mode: 'pairs' }, solution: { type: 'lineup', items, mode: 'pairs', lines: true },
      // Each pair once; doubled twice; played themselves too; one team too many or too few (twice each, or once each).
      choices: gradeChoices(rng, d, ans, [base, 2 * twice, n * n, n * (n + 1), (n - 1) * (n - 2), choose2(n + 1), choose2(n - 1)]),
    });
  }
  if (v === 'skip') {
    // The question is only about the club: the one pair that met this morning skips each other there.
    const [xi, yi] = rng.shuffle(range(n)).slice(0, 2).sort((a, b) => a - b);
    const [X, Y] = [items[xi].name, items[yi].name];
    const ans = base - 1;
    return make('pairs', d, sid, {
      prompt: `${n} friends meet at the robot club. ${X} and ${Y} already shook hands this morning, so they skip each other. Every other pair shakes hands once at the club. How many handshakes happen at the club?`,
      expression: 'handshakes at the club = ?', answer: ans,
      hint: 'Count the handshakes as if every pair shook hands at the club. Then take away the one pair that skips.',
      steps: [...listing, `${X} and ${Y} skip theirs at the club: ${lab(base, 'handshakes if every pair shook')} − ${lab(1, 'skipped handshake')} = ${lab(ans, 'handshakes at the club')}.`],
      visual: { type: 'lineup', items, mode: 'pairs', skip: [xi, yi] }, solution: { type: 'lineup', items, mode: 'pairs', lines: true, skip: [xi, yi] },
      // Forgot the skip; took away one for each of the two; forgot to halve; read it as the two shaking no hands at all;
      // left one of the two out altogether; one too many in the count-down; only the first friend's.
      choices: gradeChoices(rng, d, ans, [base, base - 2, twice - 1, base - (2 * n - 3), twice - 2, choose2(n - 1), choose2(n + 1) - 1, n - 1]),
    });
  }
  if (v === 'late') {
    const Z = items[n].name; const ans = base + n;
    return make('pairs', d, sid, {
      prompt: `${n} friends meet at the robot club and each pair shakes hands once. Then ${Z} arrives late and shakes hands with each of them. How many handshakes are there in all?`,
      expression: 'handshakes = ?', answer: ans,
      hint: `Count the handshakes before ${Z} comes. Then add ${Z}'s handshakes.`,
      steps: [
        `Before ${Z} comes: ${lab(n, 'friends')} × ${lab(n - 1, 'others each')} = ${lab(twice, 'counted twice')}, and ${lab(twice, 'counted twice')} ÷ ${lab(2, 'times each pair is counted')} = ${lab(base, 'handshakes')}.`,
        `${Z} shakes hands with each of the ${lab(n, 'friends')}: ${lab(n, 'more handshakes')}.`,
        `${lab(base, 'handshakes before')} + ${lab(n, 'handshakes with the late friend')} = ${lab(ans, 'handshakes')}.`,
      ],
      visual: { type: 'lineup', items, mode: 'pairs', late: n }, solution: { type: 'lineup', items, mode: 'pairs', lines: true, late: n },
      // Forgot the latecomer; only the latecomer's; the latecomer shook 1 hand; forgot to halve (before, or with everyone,
      // or and forgot the latecomer too); counted the latecomer's handshakes twice.
      choices: gradeChoices(rng, d, ans, [base, n, base + 1, twice + n, (n + 1) * n, twice, base + 2 * n]),
    });
  }
  return make('pairs', d, sid, {
    prompt: th.prompt(n), expression: `${th.many} = ?`, answer: base,
    hint: `Start with ${P0}: how many ${th.many}? Then ${P1}: how many new ones?`,
    steps: listing,
    visual: { type: 'lineup', items, mode: 'pairs' }, solution: { type: 'lineup', items, mode: 'pairs', lines: true },
    // Forgot to halve; one too many in the count-down, or one too few (and forgot to halve as well); shook their own hand
    // too (and halved); only the first friend's; only the first two friends' (or with their own handshake counted twice);
    // one each.
    choices: gradeChoices(rng, d, base, [twice, choose2(n + 1), choose2(n - 1), n * n, n * (n + 1), (n - 1) * (n - 2), ...(n % 2 ? [] : [(n * n) / 2]), n - 1, 2 * n - 3, 2 * (n - 1), n]),
  });
}

/* ------------------------------------------------------------------ */
/* dispatch                                                            */
/* ------------------------------------------------------------------ */

export function pathsQuestion(kind: PathsKind, d: Difficulty, rng: Rng, skillId?: string): Question {
  const fits = (PATHS_KINDS.map((x) => x.id).filter((x) => x !== 'all') as K[]).filter((x) => PATHS_KIND_GRADES[x].includes(gradeOf(d)));
  const k: K = kind === 'all' ? rng.pick(fits) : kind;
  const sid = skillId ?? (kind === 'all' ? "paths" : `paths.${k}`);
  const e = pathsDifficulty(k, d);
  const q = k === 'outfits' ? (gradeOf(e) === 'g1' ? outfitsG1(e, rng, sid) : outfitsG3(e, rng, sid))
    : k === 'menus' ? menusQuestion(e, rng, sid)
      : k === 'orders' ? ordersQuestion(e, rng, sid)
        : k === 'grid' ? gridQuestion(e, rng, sid)
          : pairsQuestion(e, rng, sid);
  return e === d ? q : { ...q, difficulty: d };
}
export const genPaths: Generator = (skillId, params, ctx) => pathsQuestion(String(params?.kind ?? 'all') as PathsKind, ctx.difficulty, ctx.rng, skillId);
