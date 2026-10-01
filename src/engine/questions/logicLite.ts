import type { Difficulty, Question, QuestionChoice, Visual } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { contestQuestion, choicesFrom, gradeOf, type ContestGameMeta, type ContestKind, type GradeId, type KindGrades } from '../contest/common';
import type { ColorName, ContestIcon, ContestVisual } from '../contest/visuals';
import { lab, labn } from '../label';

/**
 * Logic Lite (Contest Path): reason only from what you know for sure. Difficulty 1–2 = Grade 1, 3–4 = Grade 3,
 * 5–6 = Grade 5 (see contest/common.ts). Every puzzle is original and generated here.
 *
 *  truefalse (G1, G3) a picture and a sentence: True, False or Can't tell (the picture does not say, or a shut box hides it)
 *  grid      (G3, G5) who has what, 3 × 3 or 4 × 4, 2–4 clues with exactly one answer (checked by brute force)
 *  order     (G3, G5) taller / shorter, in front / behind, between, right behind: who is tallest, what place is Zoe
 *  mustmight (G3, G5) a bag with known colours: must, might or can't; Grade 5 also "how many to be sure" (pigeonholes)
 *  liar      (G5)     truth-tellers and fibbers: exactly one world fits what they say (checked by brute force)
 *
 * Grids, line-ups and fibber puzzles are only kept when (1) brute force finds exactly one answer and (2) a step-by-step
 * solver that uses only child-sized moves (one clue at a time, the last empty box, try one case) reaches it, so the
 * worked steps always show a real path to the answer.
 */
export type LogicKind = 'all' | "truefalse" | "grid" | "order" | "mustmight" | "liar";

export const LOGIC_META: ContestGameMeta = {
  id: "logic", label: "Logic Lite", icon: "brain", topic: "Logic", skill: "logic",
  blurb: "True, false or can't tell; who has which pet; who is tallest; must, might or can't; who is telling the truth.",
  intro: "Logic means using only what you know for sure. A sentence about a picture is true, false, or the picture does not say, and then you can't tell. In who-has-what puzzles, every ✗ you mark leaves fewer places to go, and the last empty box in a row or column gets the ✓. With truth-tellers and fibbers, pretend one person tells the truth and follow the story: if it breaks, that person must be a fibber.",
  tree: { x: 5, y: 5 }, prereq: { skillId: "add.basic", mastery: 0 },
};

export const LOGIC_KINDS: ContestKind[] = [
  { id: 'all', label: 'Mixed', short: 'Mixed', desc: "True, false or can't tell; who has which pet; who is tallest; must, might or can't; who is telling the truth." },
  { id: "truefalse", label: "True, false or can't tell", short: "True/false", desc: "Check the picture: is it true, false, or does the picture not say?" },
  { id: "grid", label: "Who has what", short: "Grids", desc: "Each person has exactly one. A ✗ in a row or column leaves the last ✓." },
  { id: "order", label: "Who is first", short: "Order", desc: "Put the clues on a line: taller than, shorter than, between." },
  { id: "mustmight", label: "Must, might or can't", short: "Must/might", desc: "Must = every time. Might = sometimes. Can't = never." },
  { id: "liar", label: "Truth-tellers and fibbers", short: "Fibbers", desc: "Try each person as the truth-teller and see which story holds together." },
];
/** Which grades each kind suits. */
export const LOGIC_KIND_GRADES: KindGrades = { truefalse: ["g1", "g3"], grid: ["g3", "g5"], order: ["g3", "g5"], mustmight: ["g3", "g5"], liar: ["g5"] };

type K = Exclude<LogicKind, 'all'>;
type SceneV = Extract<ContestVisual, { type: 'scene' }>;
type SceneItem = SceneV['items'][number];
type GridV = Extract<ContestVisual, { type: 'logicgrid' }>;

const APP = 'Engineers reason the same way: rule out what cannot be, test each case, and trust only what they can check.';
const BANDS: Record<GradeId, [Difficulty, Difficulty]> = { g1: [1, 2], g3: [3, 4], g5: [5, 6] };
const NEAREST: Record<GradeId, GradeId[]> = { g1: ['g1', 'g3', 'g5'], g3: ['g3', 'g1', 'g5'], g5: ['g5', 'g3', 'g1'] };
/** The difficulty a kind is played at: d itself when the kind suits that grade, else the same spot in the nearest band it suits. */
export function logicDifficulty(kind: K, d: Difficulty): Difficulty {
  const ok = LOGIC_KIND_GRADES[kind]; const g = NEAREST[gradeOf(d)].find((x) => ok.includes(x)) ?? 'g3';
  return g === gradeOf(d) ? d : BANDS[g][(d - 1) % 2];
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const listAnd = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const listOr = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} or ${xs[xs.length - 1]}`);
const an = (w: string) => (/^[aeiou]/i.test(w) ? 'an' : 'a');
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const PLACE = ['1st', '2nd', '3rd', '4th', '5th'];
const KIDS = ['Mia', 'Leo', 'Zoe', 'Sam', 'Ivy', 'Max', 'Nia', 'Kai', 'Ava', 'Ben', 'Eva', 'Raj', 'Tia', 'Finn', 'Lily', 'Omar'];
const ROBOTS = ['Pip', 'Zap', 'Bolt', 'Cog', 'Dot', 'Nova', 'Gizmo', 'Rivet'];
const PET_NAMES = ['Rex', 'Sunny', 'Coco', 'Ziggy', 'Biscuit', 'Pepper'];

/** Numeric tap choices: the answer plus real-mistake distractors, topped up with near misses, shuffled. */
function numChoices(rng: Rng, answer: number, wrong: number[], n: number, min = 0, max = Infinity): QuestionChoice[] {
  const vals = [answer];
  const ok = (v: number) => Number.isInteger(v) && v >= min && v <= max && !vals.includes(v);
  for (const v of wrong) if (vals.length < n && ok(v)) vals.push(v);
  for (let k = 1; vals.length < n && k < 60; k++) for (const v of [answer + k, answer - k]) if (vals.length < n && ok(v)) vals.push(v);
  return choicesFrom(rng.shuffle(vals));
}
/** Tap choices that are words (names, places): values 1..n in a fixed order, labelled. */
const wordChoices = (labels: string[]): QuestionChoice[] => labels.map((label, i) => ({ value: i + 1, label }));

interface Q { prompt: string; expression: string; answer: number; hint: string; steps: string[]; visual: ContestVisual; solution?: ContestVisual; choices?: QuestionChoice[]; read?: string }
function make(k: K, d: Difficulty, sid: string, q: Q): Question {
  return contestQuestion('logic', LOGIC_META.topic, sid, LOGIC_KINDS.find((x) => x.id === k)!.label, {
    prompt: q.prompt, expression: q.expression, answer: q.answer, difficulty: d, hint: q.hint, steps: q.steps,
    visual: q.visual as Visual, solutionVisual: q.solution as Visual | undefined, choices: q.choices,
    readAloud: q.read ?? q.prompt, app: APP,
  });
}

/* ------------------------------------------------------------------ */
/* True, false or can't tell                                           */
/* ------------------------------------------------------------------ */

type Verdict = 1 | 2 | 3;
const VERDICT_END: Record<Verdict, string> = { 1: 'So the sentence is true.', 2: 'So the sentence is false.', 3: "So we can't tell." };
const TF_LABELS = ['True', 'False', "Can't tell"];
/** `subj` = what a counting sentence is about (a thing and its colours; `all` = every colour of it), so an "and" never joins two parts about the same colour of the same thing. */
interface Subj { t: string; cs: ColorName[]; all?: boolean }
interface Cand { form: string; text: string; verdict: Verdict; hint: string; work: string[]; subj?: Subj }
interface Thing { icon: ContestIcon; one: string; many: string; colors: ColorName[] }
interface Grp { t: Thing; c: ColorName; n: number }

/** Things that come in colours, for counting pictures. Red and orange never share a picture. */
const COUNT_THINGS: Thing[] = [
  { icon: 'apple', one: 'apple', many: 'apples', colors: ['red', 'green', 'yellow'] },
  { icon: 'frog', one: 'frog', many: 'frogs', colors: ['green', 'yellow', 'blue'] },
  { icon: 'ball', one: 'ball', many: 'balls', colors: ['red', 'blue', 'yellow', 'green', 'purple'] },
  { icon: 'fish', one: 'fish', many: 'fish', colors: ['orange', 'blue', 'purple', 'green'] },
  { icon: 'bird', one: 'bird', many: 'birds', colors: ['blue', 'red', 'yellow'] },
  { icon: 'car', one: 'car', many: 'cars', colors: ['red', 'blue', 'yellow', 'green'] },
  { icon: 'kite', one: 'kite', many: 'kites', colors: ['purple', 'red', 'green', 'blue'] },
  { icon: 'hat', one: 'hat', many: 'hats', colors: ['red', 'blue', 'green', 'purple', 'yellow'] },
  { icon: 'flower', one: 'flower', many: 'flowers', colors: ['red', 'purple', 'yellow', 'blue'] },
];
/** Things that stand in a row, for next to / between / left of. */
const ROW_THINGS: { icon: ContestIcon; name: string; animal?: boolean; hides?: boolean }[] = [
  { icon: 'cat', name: 'cat', animal: true }, { icon: 'dog', name: 'dog', animal: true }, { icon: 'frog', name: 'frog', animal: true },
  { icon: 'bird', name: 'bird', animal: true }, { icon: 'tree', name: 'tree', hides: true }, { icon: 'house', name: 'house', hides: true },
  { icon: 'car', name: 'car' }, { icon: 'robot', name: 'robot' }, { icon: 'ball', name: 'ball' }, { icon: 'flower', name: 'flower' },
];

const nm = (t: Thing, k: number, c?: ColorName) => `${c ? `${c} ` : ''}${k === 1 ? t.one : t.many}`;
const L = (k: number, t: Thing, c?: ColorName) => lab(k, nm(t, k, c));
/** "4 (red apples) is more than 2 (green apples)." */
const cmpLine = (a: number, b: number, A: string, B: string) => `${A} is ${a > b ? 'more than' : a < b ? 'less than' : 'the same as'} ${B}.`;

function countScene(g: GradeId, d: Difficulty, rng: Rng): Grp[] {
  const [A, B] = rng.shuffle(COUNT_THINGS).slice(0, 2);
  const max = g === 'g1' ? (d === 1 ? 6 : 8) : d === 3 ? 9 : 12;
  // Grade 3 sometimes shows one colour only ("Every frog is green", and a shut box that may hold another colour).
  const nA = g === 'g1' && d === 1 ? 2 : g === 'g3' && rng.chance(0.2) ? 1 : rng.int(2, 3);
  const groups: Grp[] = rng.shuffle(A.colors).slice(0, nA).map((c) => ({ t: A, c, n: rng.int(1, max) }));
  if (groups[0].n < 2) groups[0].n = 2;
  if (nA > 1 && g === 'g3' && rng.chance(0.35)) { const half = rng.int(1, Math.floor(max / 2)); groups[0].n = 2 * half; groups[1].n = half; }
  if (nA > 1 && g === 'g1' && rng.chance(0.3)) groups[1].n = groups[0].n;
  const second = g === 'g1' ? rng.chance(d === 1 ? 0.4 : 0.6) : rng.chance(0.7);
  if (second) for (const c of rng.shuffle(B.colors).slice(0, g === 'g1' ? 1 : rng.int(1, 2))) groups.push({ t: B, c, n: rng.int(1, g === 'g1' ? 5 : 6) });
  return groups;
}

/** Every sentence this counting picture can test, each with its verdict and its working. `box` = a shut box of that thing. */
function countCands(groups: Grp[], box: Thing | null, g: GradeId, d: Difficulty, rng: Rng): Cand[] {
  const out: Cand[] = [];
  const g3 = g === 'g3';
  const things = [...new Set(groups.map((x) => x.t))];
  const cnt = (t: Thing, c?: ColorName) => sum(groups.filter((x) => x.t === t && (!c || x.c === c)).map((x) => x.n));
  const push = (form: string, text: string, verdict: Verdict, hint: string, work: string[], subj?: Subj) => out.push({ form, text, verdict, hint, work, subj });
  for (const t of things) {
    const hid = box === t;
    const cs = groups.filter((x) => x.t === t).map((x) => x.c);
    const absent = t.colors.filter((c) => !cs.includes(c));
    const see = hid ? ' you can see' : '';
    // Every hint about the boxed thing asks about the box, whatever the answer, so the box question is no giveaway.
    const boxQ = hid ? ' What could be in the shut box?' : '';
    const boxMore = (c: ColorName) => `The shut box might hold more ${c} ${t.many}, or none.`;
    for (const c1 of cs) for (const c2 of cs) {
      if (c1 === c2) continue;
      const a = cnt(t, c1), b = cnt(t, c2), A = L(a, t, c1), B = L(b, t, c2);
      const hint = `Count the ${c1} ${t.many}. Then count the ${c2} ${t.many}.`;
      const counts = [`Count the ${c1} ${t.many}${see}: ${A}.`, `Count the ${c2} ${t.many}${see}: ${B}.`];
      const two: Subj = { t: t.one, cs: [c1, c2] };
      if (hid) {
        push('box-more', `There are more ${c1} ${t.many} than ${c2} ${t.many}.`, 3, `${hint}${boxQ}`, [...counts, `The shut box might hold many ${c1} ${t.many}, or many ${c2} ${t.many}.`], two);
        continue;
      }
      push('more', `There are more ${c1} ${t.many} than ${c2} ${t.many}.`, a > b ? 1 : 2, hint, [...counts, cmpLine(a, b, A, B)], two);
      if (d >= 2) push('fewer', `There are fewer ${c1} ${t.many} than ${c2} ${t.many}.`, a < b ? 1 : 2, hint, [...counts, cmpLine(a, b, A, B)], two);
      if (d >= 2 && cs.indexOf(c1) < cs.indexOf(c2)) push('same', `There are as many ${c1} ${t.many} as ${c2} ${t.many}.`, a === b ? 1 : 2, hint, [...counts, cmpLine(a, b, A, B)], two);
      if (g3 && a > b) {
        const diff = a - b;
        for (const k of [diff, diff + 1, diff - 1].filter((x) => x >= 1)) {
          const text = k === 1 ? `There is 1 more ${c1} ${t.one} than ${c2} ${t.many}.` : `There are ${k} more ${c1} ${t.many} than ${c2} ${t.many}.`;
          push('kmore', text, k === diff ? 1 : 2, hint, [...counts, `${A} − ${B} = ${lab(diff, `more ${c1} ${diff === 1 ? t.one : t.many}`)}.`, ...(k === diff ? [] : [`The sentence says ${lab(k, `more ${c1} ${k === 1 ? t.one : t.many}`)}.`])], two);
        }
      }
      if (g3 && b >= 1 && a > b && (a === 2 * b || Math.abs(a - 2 * b) === 1)) {
        push('twice', `There are twice as many ${c1} ${t.many} as ${c2} ${t.many}.`, a === 2 * b ? 1 : 2, hint,
          [...counts, `Twice as many: ${B} + ${B} = ${lab(2 * b, t.many)}.`, a === 2 * b ? `There are ${A}: the same.` : `There are ${A}, not ${lab(2 * b, t.many)}.`], two);
      }
    }
    const allOf: Subj = { t: t.one, cs: [], all: true };
    for (const c of cs) {
      const a = cnt(t, c), A = L(a, t, c); const one: Subj = { t: t.one, cs: [c] };
      const countHint = `Count the ${c} ${t.many}${see}.${boxQ}`;
      if (!g3 && !hid) for (const k of [a, a + 1, a - 1].filter((x) => x >= 1)) {
        const text = k === 1 ? `There is 1 ${c} ${t.one}.` : `There are ${k} ${c} ${t.many}.`;
        push('exact', text, k === a ? 1 : 2, countHint, [`Count the ${c} ${t.many}: ${A}.`, `The sentence says ${L(k, t, c)}${k === a ? ' too' : ''}.`], one);
      }
      if (hid) {
        for (const k of [a, a - 1, a + 1, a + 2].filter((x) => x >= 2)) {
          push('box-atleast', `There are at least ${k} ${c} ${t.many}.`, a >= k ? 1 : 3, countHint,
            a >= k ? [`You can see ${A} already.`, 'The shut box can only add more, never take any away.'] : [`You can see ${A}.`, `The sentence needs ${L(k, t, c)}.`, boxMore(c)], one);
          push('box-fewer', `There are fewer than ${k} ${c} ${t.many}.`, a >= k ? 2 : 3, countHint,
            a >= k ? [`You can see ${A} already.`, `${A} is not fewer than ${L(k, t, c)}.`] : [`You can see ${A}.`, boxMore(c)], one);
          push('box-exact', `There are exactly ${k} ${c} ${t.many}.`, a > k ? 2 : 3, countHint,
            a > k ? [`You can see ${A} already.`, `That is more than ${L(k, t, c)}.`] : [`You can see ${A}.`, boxMore(c)], one);
        }
      }
      const seeOne = `Look for ${an(c)} ${c} ${t.one}. Can you see one?${boxQ}`;
      push('exists', `There is ${an(c)} ${c} ${t.one}.`, 1, seeOne, [`Look for ${an(c)} ${c} ${t.one}: there ${a === 1 ? 'is' : 'are'} ${A}.`], one);
      const everyHint = `Look at every ${t.one}. Can you see one that is not ${c}?${boxQ}`;
      if (cs.length === 1) {
        const all = cnt(t);
        push('every', `Every ${t.one} is ${c}.`, hid ? 3 : 1, everyHint, hid
          ? [`Every ${t.one} you can see is ${c}.`, `${cap(an(t.one))} ${t.one} in the shut box might not be ${c}.`]
          : [all === 1 ? `There is only ${L(1, t)}, and it is ${c}.` : `Look at every ${t.one}: all ${L(all, t)} are ${c}.`], allOf);
      } else {
        const other = cs.find((x) => x !== c)!; const o = cnt(t, other);
        push('every', `Every ${t.one} is ${c}.`, 2, everyHint, [`Look at every ${t.one}.`, `${L(o, t, other)} ${o === 1 ? 'is' : 'are'} not ${c}.`], allOf);
      }
      if (g3) push('none', `No ${t.one} is ${c}.`, 2, seeOne, [`There ${a === 1 ? 'is' : 'are'} ${A}.`], one);
      if (g3 && !hid && cs.length >= 2 && cnt(t) % 2 === 0) {
        const all = cnt(t); const parts = cs.map((x) => L(cnt(t, x), t, x));
        push('half', `Half of the ${t.many} are ${c}.`, 2 * a === all ? 1 : 2, `Count all the ${t.many}. Then count the ${c} ones.`,
          [`${parts.join(' + ')} = ${lab(all, t.many)}.`, `Half of them is ${lab(all, t.many)} ÷ ${lab(2, 'halves')} = ${labn(all / 2, t.one, t.many)}.`, `There ${a === 1 ? 'is' : 'are'} ${A}.`], allOf);
      }
    }
    for (const c of absent) {
      const seeOne = `Look for ${an(c)} ${c} ${t.one}. Can you see one?${boxQ}`; const one: Subj = { t: t.one, cs: [c] };
      push('exists', `There is ${an(c)} ${c} ${t.one}.`, hid ? 3 : 2, seeOne, hid
        ? [`None of the ${t.many} you can see is ${c}.`, `The shut box might hold ${an(c)} ${c} ${t.one}.`]
        : [`Look at every ${t.one}: none is ${c}.`], one);
      if (g3) push('none', `No ${t.one} is ${c}.`, hid ? 3 : 1, seeOne, hid
        ? [`None of the ${t.many} you can see is ${c}.`, `The shut box might hold ${an(c)} ${c} ${t.one}.`]
        : [`Look at every ${t.one}: none is ${c}.`], one);
    }
    if (g3 && !hid && cs.length >= 2) {
      const all = cnt(t); const parts = cs.map((x) => L(cnt(t, x), t, x));
      // A count of 1 would read "There are 1 birds in all": only counts of 2 or more.
      for (const k of [all, all + 1, all - 1, all + 2].filter((x) => x >= 2)) {
        push('total', `There are ${k} ${t.many} in all.`, k === all ? 1 : 2, `Count every ${t.one}, whatever its colour.`,
          [`${parts.join(' + ')} = ${lab(all, t.many)}.`, `The sentence says ${lab(k, t.many)}${k === all ? ' too' : ''}.`], allOf);
      }
    }
    // Things a picture cannot show. Each hint asks "Can you see …?", as the hints for true and false sentences do.
    const c = rng.pick(cs); const one = cnt(t, c) === 1; const who = rng.pick(KIDS);
    const the = `the ${c} ${one ? t.one : t.many}`; const it = one ? 'it' : 'they';
    const v = (s: string, p: string) => (one ? s : p);
    const trivia: [string, string, string][] = [
      [`${who} has ${an(t.one)} ${t.one} at home.`, `The picture does not show ${who}'s home.`, `Look for ${who}'s home. Can you see it in the picture?`],
      [`${cap(the)} ${v('belongs', 'belong')} to ${who}.`, `A picture does not show who owns ${an(t.one)} ${t.one}.`, `Find ${the}. Can you see who owns ${one ? 'it' : 'them'}?`],
    ];
    if (t.icon === 'apple') trivia.push([`${cap(the)} ${v('tastes', 'taste')} sweet.`, 'A picture cannot show how something tastes.', `Find ${the}. Can you see how ${it} ${v('tastes', 'taste')}?`]);
    if (['frog', 'fish', 'bird'].includes(t.icon)) trivia.push([`${cap(the)} ${v('is', 'are')} hungry.`, `A picture cannot show if ${an(t.one)} ${t.one} is hungry.`, `Find ${the}. Can you see if ${it} ${v('is', 'are')} hungry?`]);
    if (t.icon === 'car') trivia.push([one ? `The ${c} car is the fastest.` : `The ${c} cars go fast.`, 'A picture that stands still cannot show how fast a car goes.', `Find ${the}. Can you see how fast ${it} ${v('goes', 'go')}?`]);
    if (t.icon === 'flower') trivia.push([`${cap(the)} ${v('smells', 'smell')} sweet.`, 'A picture cannot show a smell.', `Find ${the}. Can you see how ${it} ${v('smells', 'smell')}?`]);
    if (t.icon === 'ball') trivia.push([one ? `The ${c} ball is the heaviest.` : `The ${c} balls are heavy.`, 'A picture cannot show how heavy a ball is.', `Find ${the}. Can you see how heavy ${it} ${v('is', 'are')}?`]);
    if (t.icon === 'kite') trivia.push([`${cap(the)} can fly high.`, 'The picture does not show the kites flying.', `Find ${the}. Can you see ${one ? 'it' : 'them'} fly?`]);
    const [text, why, hint] = rng.pick(trivia);
    push('trivia', text, 3, hint, [why]);
  }
  // Grade 3, harder: two plain parts joined by "and"
  if (g3 && d === 4 && !box) {
    const simple = out.filter((x) => ['more', 'every', 'exists', 'none', 'kmore'].includes(x.form) && x.verdict !== 3);
    // Two parts about the same colour of the same thing would repeat or contradict each other ("There is a blue frog,
    // and no frog is blue"): each part talks about something different.
    const clash = (a: Subj, b: Subj) => a.t === b.t && (!!a.all || !!b.all || a.cs.some((x) => b.cs.includes(x)));
    for (let i = 0; i < 6 && simple.length > 1; i++) {
      const [p1, p2] = rng.shuffle(simple).slice(0, 2);
      if (clash(p1.subj!, p2.subj!)) continue;
      const text = `${p1.text.slice(0, -1)}, and ${p2.text.charAt(0).toLowerCase()}${p2.text.slice(1)}`;
      const both = p1.verdict === 1 && p2.verdict === 1;
      push('and', text, both ? 1 : 2, 'Check each part on its own. An "and" sentence needs both parts.', [
        `First part: “${p1.text}”`, ...p1.work, `That part is ${p1.verdict === 1 ? 'true' : 'false'}.`,
        `Second part: “${p2.text}”`, ...p2.work, `That part is ${p2.verdict === 1 ? 'true' : 'false'}.`,
        'An "and" sentence is true only when both parts are true.',
      ]);
    }
  }
  return out;
}

function lineCands(row: typeof ROW_THINGS, g: GradeId, rng: Rng): Cand[] {
  const out: Cand[] = [];
  const the = (i: number) => `the ${row[i].name}`;
  const n = row.length;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const [a, b] = rng.chance(0.5) ? [i, j] : [j, i];
    const mid = range(n).filter((x) => x > i && x < j);
    out.push({
      form: 'nextto', text: `${cap(the(a))} is next to ${the(b)}.`, verdict: j - i === 1 ? 1 : 2, hint: `Find ${the(a)}. What stands on each side of it?`,
      work: [`Find ${the(a)} and ${the(b)}.`, mid.length ? `${cap(listAnd(mid.map(the)))} ${mid.length === 1 ? 'is' : 'are'} between them.` : 'They stand side by side.'],
    });
  }
  if (g === 'g3') {
    for (let m = 1; m < n - 1; m++) {
      const [b, c] = rng.chance(0.5) ? [m - 1, m + 1] : [m + 1, m - 1];
      out.push({ form: 'between', text: `${cap(the(m))} is between ${the(b)} and ${the(c)}.`, verdict: 1, hint: `Find ${the(m)}. What is on its left and on its right?`, work: [`${cap(the(m - 1))} is on its left, and ${the(m + 1)} is on its right.`] });
    }
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) for (let c = b + 1; c < n; c++) {
      if (a === b || a === c || (a > b && a < c)) continue;
      out.push({ form: 'between', text: `${cap(the(a))} is between ${the(b)} and ${the(c)}.`, verdict: 2, hint: `Find ${the(a)}. What is on its left and on its right?`, work: [`${cap(the(b))} and ${the(c)} are both on the ${b > a ? 'right' : 'left'} of ${the(a)}.`] });
    }
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
      if (a === b || (a < b && b - a > 1)) continue;
      out.push({ form: 'leftof', text: `${cap(the(a))} is to the left of ${the(b)}.`, verdict: a < b ? 1 : 2, hint: `Find ${the(b)}. What is on its left?`, work: [a < b ? `${cap(the(a))} stands just left of ${the(b)}.` : `${cap(the(a))} is on the right side of ${the(b)}.`] });
    }
  }
  const hideAt = row.filter((x) => x.hides);
  const away = ROW_THINGS.filter((x) => x.animal && !row.includes(x));
  if (hideAt.length && away.length) {
    const h = rng.pick(hideAt); const a = rng.pick(away);
    out.push({ form: 'hiding', text: `${cap(an(a.name))} ${a.name} is hiding behind the ${h.name}.`, verdict: 3, hint: `Find the ${h.name}. Can you see behind it?`, work: [`We cannot see behind the ${h.name}.`] });
  }
  const pets = row.filter((x) => x.animal);
  if (pets.length) {
    const p = rng.pick(pets);
    out.push({ form: 'called', text: `The ${p.name} is called ${rng.pick(PET_NAMES)}.`, verdict: 3, hint: `Find the ${p.name}. Can you see its name?`, work: ['A picture does not show names.'] });
  }
  return out;
}

const TF_FORMS: Record<GradeId, string[]> = {
  g1: ['more', 'fewer', 'same', 'exact', 'exists', 'every', 'trivia', 'nextto', 'hiding', 'called', 'box-more'],
  g3: ['more', 'fewer', 'kmore', 'twice', 'total', 'every', 'none', 'half', 'exists', 'and', 'nextto', 'between', 'leftof', 'trivia', 'hiding',
    'box-more', 'box-atleast', 'box-fewer', 'box-exact'],
  g5: [],
};

function truefalseQ(d: Difficulty, rng: Rng, sid: string): Question {
  const g = gradeOf(d) === 'g1' ? 'g1' : 'g3';
  const target = rng.int(1, 3) as Verdict;
  for (let tries = 0; ; tries++) {
    // A row picture's can't-tells all hang on words ("hiding", "called"), so a wanted can't-tell rarely gets one.
    const line = tries < 40 && rng.chance(g === 'g1' ? (target === 3 ? 0.12 : 0.3) : target === 3 ? 0.1 : 0.25);
    let cands: Cand[]; let visual: SceneV; let solution: SceneV | undefined; let box: Thing | null = null;
    if (line) {
      const row = rng.shuffle(ROW_THINGS).slice(0, g === 'g1' ? rng.int(3, 4) : rng.int(4, 5));
      cands = lineCands(row, g, rng);
      visual = { type: 'scene', items: row.map((x) => ({ icon: x.icon, n: 1, label: x.name })) };
    } else {
      const groups = countScene(g, d, rng);
      // Grade 1 counts to 20: never more than 20 things in the picture.
      if (g === 'g1' && sum(groups.map((x) => x.n)) > 20) continue;
      // A shut box: Grade 3 and Grade 1 alike, so most can't-tells come from the picture (what might be in the box), not
      // from words like "at home" that a child could spot without looking. The box turns up with true and false
      // sentences as well (about a third of the time), so it is no giveaway either.
      const boxOdds = g === 'g3' ? (target === 3 ? 0.75 : 0.3) : d === 1 ? (target === 3 ? 0.72 : 0.32) : (target === 3 ? 0.78 : 0.35);
      const useBox = rng.chance(boxOdds);
      box = useBox ? groups[0].t : null;
      cands = countCands(groups, box, g, d, rng);
      // Name the thing as well as the colour when two kinds of thing share the picture.
      const two = new Set(groups.map((x) => x.t)).size > 1;
      const name = (x: Grp) => (two ? `${x.c} ${nm(x.t, x.n)}` : x.c);
      const items: SceneItem[] = groups.map((x) => ({ icon: x.t.icon, color: x.c, n: x.n, label: name(x) }));
      const shut: SceneItem[] = box ? [{ icon: box.icon, n: 0, hidden: true, label: `shut box of ${box.many}` }] : [];
      visual = { type: 'scene', items: [...items, ...shut] };
      solution = { type: 'scene', items: [...groups.map((x) => ({ icon: x.t.icon, color: x.c, n: x.n, label: `${x.n} ${name(x)}` })), ...shut] };
    }
    // With a shut box, a can't-tell comes from the box (what might be inside), not from a word like "taste".
    const fit = cands.filter((c) => c.verdict === target && TF_FORMS[g].includes(c.form) && !(box && c.form === 'trivia'));
    if (!fit.length) continue;
    const forms = [...new Set(fit.map((c) => c.form))];
    const form = rng.pick(forms);
    const c = rng.pick(fit.filter((x) => x.form === form));
    const shutNote = box ? ` The box is shut, so you cannot see inside. It may hold more ${box.many}, or none.` : '';
    return make('truefalse', d, sid, {
      prompt: `Look at the picture.${shutNote} Is this true, false, or can't you tell?`,
      expression: `“${c.text}”`, answer: c.verdict, hint: c.hint,
      steps: [...c.work, VERDICT_END[c.verdict]], visual, solution,
      choices: wordChoices(TF_LABELS),
      read: `${box ? 'The box is shut. ' : ''}${c.text} Is that true, false, or can't you tell?`,
    });
  }
}

/* ------------------------------------------------------------------ */
/* Permutation puzzles (grids and line-ups)                            */
/* ------------------------------------------------------------------ */

/**
 * A clue about people 0..n-1 each in a different slot 0..n-1 (a thing, a place). `vars` are the people it talks about.
 * `facts` = the single boxes it rules out ("2:1" = person 2 does not have thing 1): two clues never share one.
 */
interface Con { vars: number[]; ok: (vals: number[]) => boolean; text: string; facts?: string[] }
const PERMS: Record<number, number[][]> = {};
function permsOf(n: number): number[][] {
  if (!PERMS[n]) {
    const out: number[][] = [];
    const go = (pre: number[]) => { if (pre.length === n) { out.push(pre); return; } for (let s = 0; s < n; s++) if (!pre.includes(s)) go([...pre, s]); };
    go([]); PERMS[n] = out;
  }
  return PERMS[n];
}
const holds = (c: Con, pm: number[]) => c.ok(c.vars.map((v) => pm[v]));
const solutions = (n: number, cons: Con[]) => permsOf(n).filter((pm) => cons.every((c) => holds(c, pm)));

/** Random clues until exactly one arrangement is left, then drop any clue the others make unneeded. */
function pickClues<T extends Con>(rng: Rng, n: number, pool: T[], min: number, max: number): T[] | null {
  let live = permsOf(n); const chosen: T[] = []; const used = new Set<string>();
  for (const c of rng.shuffle(pool)) {
    if (c.facts?.some((f) => used.has(f))) continue;
    const next = live.filter((pm) => holds(c, pm));
    if (next.length < live.length) { chosen.push(c); c.facts?.forEach((f) => used.add(f)); live = next; if (live.length === 1) break; }
  }
  if (live.length !== 1) return null;
  for (let i = chosen.length - 1; i >= 0; i--) if (solutions(n, chosen.filter((_, j) => j !== i)).length === 1) chosen.splice(i, 1);
  return chosen.length >= min && chosen.length <= max ? chosen : null;
}

/**
 * What one clue rules out on its own, given what is still open for each person: [person, slots ruled out]. It reads
 * the clue alone (no "two people cannot share a box" pairs), so every ✗ it adds is one a child can see from that clue.
 */
function pruneBy(c: Con, cand: Set<number>[]): [number, number[]][] {
  const keep = c.vars.map(() => new Set<number>()); const vals: number[] = [];
  const go = (i: number) => {
    if (i === c.vars.length) { if (c.ok(vals)) vals.forEach((v, j) => keep[j].add(v)); return; }
    for (const s of cand[c.vars[i]]) { vals.push(s); go(i + 1); vals.pop(); }
  };
  go(0);
  return c.vars.map((p, j) => [p, [...cand[p]].filter((s) => !keep[j].has(s))] as [number, number[]]).filter(([, r]) => r.length > 0);
}

interface Settle { p: number; s: number; cleared: number[] }
interface Lang { prune(ci: number, removed: [number, number[]][], settled: Settle[]): string; naked(st: Settle): string; hidden(st: Settle, lost: number[]): string }
/**
 * Solve the way a child does on a grid: use one clue at a time to rule things out, fill a row with one empty box
 * left, fill a column with one empty box left. Returns the lines, or null if those moves are not enough.
 */
function narrate(n: number, cons: Con[], lang: Lang): { lines: string[]; sol: number[] } | null {
  const cand = range(n).map(() => new Set(range(n)));
  const done = new Set<number>(); const lines: string[] = [];
  const settle = (p: number): Settle => {
    const s = [...cand[p]][0]; const cleared: number[] = [];
    for (let q = 0; q < n; q++) if (q !== p && cand[q].delete(s)) cleared.push(q);
    done.add(p); return { p, s, cleared };
  };
  for (let guard = 0; guard < 80 && done.size < n; guard++) {
    if (cand.some((c) => c.size === 0) || range(n).some((s) => !cand.some((c) => c.has(s)))) return null;
    const p = range(n).find((x) => !done.has(x) && cand[x].size === 1);
    if (p !== undefined) { lines.push(lang.naked(settle(p))); continue; }
    let moved = false;
    for (let s = 0; s < n && !moved; s++) {
      const who = range(n).filter((x) => cand[x].has(s));
      if (who.length === 1 && !done.has(who[0])) {
        const q = who[0]; const lost = [...cand[q]].filter((x) => x !== s); cand[q] = new Set([s]);
        lines.push(lang.hidden(settle(q), lost)); moved = true;
      }
    }
    for (let ci = 0; ci < cons.length && !moved; ci++) {
      const removed = pruneBy(cons[ci], cand);
      if (!removed.length) continue;
      for (const [q, rs] of removed) rs.forEach((s) => cand[q].delete(s));
      if (cand.some((c) => c.size === 0)) return null;
      const settled = removed.map(([q]) => q).filter((q) => !done.has(q) && cand[q].size === 1).map(settle);
      lines.push(lang.prune(ci, removed, settled)); moved = true;
    }
    if (!moved) return null;
  }
  return done.size === n ? { lines, sol: cand.map((c) => [...c][0]) } : null;
}
/** The question grid can be marked on screen (LogicViz): one tap for ✗, two for ✓. */
const TAP_GRID = 'Tap a grid box once for ✗, twice for ✓.';
const gridMarks = (n: number, sol: number[]): GridV['marks'] => range(n).map((p) => range(n).map((s) => (sol[p] === s ? 'yes' : 'no')));

/* ---------- who has what ---------- */

interface GItem { name: string; icon: ContestIcon; color?: ColorName }
const GRID_SETS: { what: string; items: GItem[] }[] = [
  { what: 'pet', items: [{ name: 'cat', icon: 'cat' }, { name: 'dog', icon: 'dog' }, { name: 'fish', icon: 'fish' }, { name: 'bird', icon: 'bird' }, { name: 'frog', icon: 'frog' }] },
  { what: 'snack', items: [{ name: 'apple', icon: 'apple' }, { name: 'cookie', icon: 'cookie' }, { name: 'pizza', icon: 'pizza' }, { name: 'sandwich', icon: 'sandwich' }, { name: 'juice', icon: 'juice' }] },
  { what: 'toy', items: [{ name: 'ball', icon: 'ball' }, { name: 'kite', icon: 'kite' }, { name: 'robot', icon: 'robot' }, { name: 'car', icon: 'car' }, { name: 'boat', icon: 'boat' }] },
  { what: 'hat', items: (['red', 'blue', 'green', 'yellow', 'purple'] as ColorName[]).map((c) => ({ name: `${c} hat`, icon: 'hat' as const, color: c })) },
];
interface GClue extends Con { kind: 'neg1' | 'neg2' | 'either' | 'negboth' | 'pos'; p: number; x: number; q?: number }

function gridPool(N: string[], I: string[], own: number[], kinds: GClue['kind'][]): GClue[] {
  const n = N.length; const out: GClue[] = []; const all = range(n);
  const f = (p: number, x: number) => `${p}:${x}`;
  for (const p of all) for (const x of all) {
    if (own[p] !== x) {
      if (kinds.includes('neg1')) out.push({ kind: 'neg1', p, x, vars: [p], ok: (v) => v[0] !== x, text: `${N[p]} does not have the ${I[x]}.`, facts: [f(p, x)] });
      if (kinds.includes('neg2')) for (const y of all) if (y > x && own[p] !== y) out.push({ kind: 'neg2', p, x, vars: [p], ok: (v) => v[0] !== x && v[0] !== y, text: `${N[p]} does not have the ${I[x]} or the ${I[y]}.`, facts: [f(p, x), f(p, y)] });
      if (kinds.includes('negboth')) for (const q of all) if (q > p && own[q] !== x) out.push({ kind: 'negboth', p, x, vars: [p, q], ok: (v) => v[0] !== x && v[1] !== x, text: `${N[p]} and ${N[q]} do not have the ${I[x]}.`, facts: [f(p, x), f(q, x)] });
    } else {
      if (kinds.includes('pos')) out.push({ kind: 'pos', p, x, vars: [p], ok: (v) => v[0] === x, text: `${N[p]} has the ${I[x]}.`, facts: all.map((y) => f(p, y)) });
      // "The kite belongs to Ava or Tia" is the same as "nobody else has the kite": one ✗ for each of the others.
      if (kinds.includes('either')) for (const q of all) if (q !== p) {
        const [a, b] = p < q ? [p, q] : [q, p]; const rest = all.filter((r) => r !== a && r !== b);
        out.push({ kind: 'either', p: a, q: b, x, vars: rest, ok: (v) => v.every((s) => s !== x), text: `The ${I[x]} belongs to ${N[a]} or ${N[b]}.`, facts: rest.map((r) => f(r, x)) });
      }
    }
  }
  return out;
}
function gridLang(N: string[], I: string[], clues: GClue[]): Lang {
  const boxes = (p: number, ss: number[]) => `${N[p]}'s ${listAnd(ss.map((s) => I[s]))} ${ss.length === 1 ? 'box' : 'boxes'}`;
  const col = (st: Settle) => (st.cleared.length ? ` Put ✗ in the rest of the ${I[st.s]} column.` : '');
  return {
    prune: (ci, removed, settled) => {
      const c = clues[ci];
      if (c.kind === 'either') return `Clue ${ci + 1}: “${c.text}” So nobody else has the ${I[c.x]}: put ✗ in ${listAnd(removed.map(([p, ss]) => boxes(p, ss)))}.`
        + settled.map((st) => ` That leaves one empty box in ${N[st.p]}'s row: ${N[st.p]} has the ${I[st.s]} ✓.${col(st)}`).join('');
      let line = c.kind === 'pos'
        ? `Clue ${ci + 1}: “${c.text}” Put ✓ in ${N[c.p]}'s ${I[c.x]} box, and ✗ in the rest of ${N[c.p]}'s row.`
        : `Clue ${ci + 1}: “${c.text}” Put ✗ in ${listAnd(removed.map(([p, ss]) => boxes(p, ss)))}.`;
      for (const st of settled) line += c.kind === 'pos' && st.p === c.p ? col(st) : ` That leaves one empty box in ${N[st.p]}'s row: ${N[st.p]} has the ${I[st.s]} ✓.${col(st)}`;
      return line;
    },
    naked: (st) => `${N[st.p]}'s row has one empty box left: ${N[st.p]} has the ${I[st.s]} ✓.${col(st)}`,
    hidden: (st, lost) => `The ${I[st.s]} column has one empty box left: ${N[st.p]} has the ${I[st.s]} ✓.${lost.length ? ` Put ✗ in the rest of ${N[st.p]}'s row.` : ''}`,
  };
}

function gridQ(d: Difficulty, rng: Rng, sid: string): Question {
  const g5 = d >= 5; const n = g5 ? 4 : 3;
  const kinds: GClue['kind'][] = d === 3 ? ['neg1', 'neg2'] : d === 4 ? ['neg1', 'neg2', 'either', 'negboth'] : ['neg1', 'neg2', 'either', 'negboth', 'pos'];
  for (let tries = 0; tries < 400; tries++) {
    const set = rng.pick(GRID_SETS);
    const items = rng.shuffle(set.items).slice(0, n); const I = items.map((x) => x.name);
    const N = rng.shuffle(KIDS).slice(0, n);
    const own = rng.shuffle(range(n));
    const pool = gridPool(N, I, own, kinds).filter((c) => c.kind !== 'pos' || rng.chance(0.3));
    const clues = pickClues(rng, n, pool, 2, 4);
    if (!clues || clues.filter((c) => c.kind === 'pos').length > 1) continue;
    const solved = narrate(n, clues, gridLang(N, I, clues));
    if (!solved || solved.sol.some((s, p) => s !== own[p]) || solved.lines.length > n + 3) continue;
    const told = new Set(clues.filter((c) => c.kind === 'pos').map((c) => c.p));
    const free = range(n).filter((p) => !told.has(p));
    const p = rng.pick(free); const x = own[p];
    const byThing = rng.chance(0.5);
    const setup = `${listAnd(N)} each have a different ${set.what}.`;
    const clueText = clues.map((c, i) => `Clue ${i + 1}: ${c.text}`).join(' ');
    const ask = byThing ? `Who has the ${I[x]}?` : `What does ${N[p]} have?`;
    const tap = byThing ? 'Tap a name.' : `Tap the ${set.what}.`;
    const visual: GridV = { type: 'logicgrid', rows: N, cols: I };
    return make('grid', d, sid, {
      prompt: `${setup} ${clueText} ${ask} ${tap}`,
      expression: byThing ? `owner of the ${I[x]} = ?` : `${N[p]}'s ${set.what} = ?`,
      answer: (byThing ? p : x) + 1,
      hint: `${TAP_GRID} Put a ✗ in each box a clue rules out. A row or column with one empty box left gets the ✓.`,
      steps: [`Use the grid: names down the side, ${set.what}s across the top.`, ...solved.lines, `So ${N[p]} has the ${I[x]}.`],
      visual, solution: { ...visual, marks: gridMarks(n, own) },
      choices: wordChoices(byThing ? N : I),
      read: `${setup} ${clues.map((c, i) => `Clue ${i + 1}. ${c.text}`).join(' ')} ${ask}`,
    });
  }
  throw new Error('logic grid: no puzzle found');
}

/* ---------- line-ups ---------- */

type OMode = 'height' | 'queue';
interface OClue extends Con { kind: string; fix?: [number, number] }
function orderPool(N: string[], own: number[], mode: OMode, g5: boolean, d: Difficulty): OClue[] {
  const n = N.length; const out: OClue[] = []; const all = range(n);
  const last = n - 1;
  for (const a of all) for (const b of all) {
    if (a === b) continue;
    if (own[a] < own[b]) {
      if (mode === 'height') {
        out.push({ kind: 'taller', vars: [a, b], ok: (v) => v[0] < v[1], text: `${N[a]} is taller than ${N[b]}.` });
        out.push({ kind: 'shorter', vars: [b, a], ok: (v) => v[0] > v[1], text: `${N[b]} is shorter than ${N[a]}.` });
      } else {
        out.push({ kind: 'ahead', vars: [a, b], ok: (v) => v[0] < v[1], text: `${N[a]} is somewhere in front of ${N[b]}.` });
        out.push({ kind: 'behind', vars: [b, a], ok: (v) => v[0] > v[1], text: `${N[b]} is somewhere behind ${N[a]}.` });
      }
    }
    if (g5 && mode === 'queue' && own[a] === own[b] + 1) out.push({ kind: 'rightbehind', vars: [a, b], ok: (v) => v[0] === v[1] + 1, text: `${N[a]} is right behind ${N[b]}.` });
    if (g5 && mode === 'queue' && a < b && Math.abs(own[a] - own[b]) === 1) out.push({ kind: 'nextto', vars: [a, b], ok: (v) => Math.abs(v[0] - v[1]) === 1, text: `${N[a]} stands next to ${N[b]}.` });
    if (g5) for (const c of all) {
      if (c === a || c === b) continue;
      if (mode === 'height' && own[c] < own[a] && own[a] < own[b]) out.push({ kind: 'tbs', vars: [a, b, c], ok: (v) => v[2] < v[0] && v[0] < v[1], text: `${N[a]} is taller than ${N[b]} but shorter than ${N[c]}.` });
      if (mode === 'queue' && b < c && Math.min(own[b], own[c]) < own[a] && own[a] < Math.max(own[b], own[c])) out.push({ kind: 'between', vars: [a, b, c], ok: (v) => Math.min(v[1], v[2]) < v[0] && v[0] < Math.max(v[1], v[2]), text: `${N[a]} is somewhere between ${N[b]} and ${N[c]}.` });
    }
  }
  for (const a of all) {
    if ((g5 || (mode === 'queue' && d === 4)) && (own[a] === 0 || own[a] === last)) {
      const s = own[a];
      const text = mode === 'height' ? `${N[a]} is the ${s === 0 ? 'tallest' : 'shortest'}.` : `${N[a]} is ${s === 0 ? 'first' : 'last'} in line.`;
      out.push({ kind: 'end', fix: [a, s], vars: [a], ok: (v) => v[0] === s, text });
    }
    if (g5 && own[a] !== 0 && own[a] !== last) out.push({ kind: 'notends', vars: [a], ok: (v) => v[0] !== 0 && v[0] !== last, text: mode === 'height' ? `${N[a]} is not the tallest or the shortest.` : `${N[a]} is not first or last.` });
  }
  return out;
}
/** How each place is said in a sentence, and its column header in the grid. */
function placeWords(n: number, mode: OMode): { say: string[]; head: string[] } {
  if (mode === 'queue') return { say: PLACE.slice(0, n), head: PLACE.slice(0, n) };
  const mid = (s: number) => n % 2 === 1 && s === (n - 1) / 2;
  const say = range(n).map((s) => (s === 0 ? 'the tallest' : s === n - 1 ? 'the shortest' : mid(s) ? 'in the middle' : `${PLACE[s]} tallest`));
  const head = range(n).map((s) => (s === 0 ? 'tallest' : s === n - 1 ? 'shortest' : mid(s) ? 'middle' : PLACE[s]));
  return { say, head };
}
function orderLang(N: string[], P: string[], H: string[], clues: OClue[]): Lang {
  return {
    prune: (ci, removed, settled) => {
      const c = clues[ci];
      // A clue about one person reads straight onto the grid: a ✓ for a place it names, a ✗ for each place it rules out.
      if (c.fix) return `Clue ${ci + 1}: “${c.text}” Put ✓ in ${N[c.fix[0]]}'s ${H[c.fix[1]]} box.`;
      if (c.vars.length === 1 && removed.length === 1) {
        const [p, ss] = removed[0]; const st = settled.find((x) => x.p === p);
        return `Clue ${ci + 1}: “${c.text}” Put ✗ in ${N[p]}'s ${listAnd(ss.map((s) => H[s]))} ${ss.length === 1 ? 'box' : 'boxes'}.${st ? ` That leaves one empty box in ${N[p]}'s row: ${N[p]} is ${P[st.s]}.` : ''}`;
      }
      const parts = removed.map(([p, ss]) => { const st = settled.find((x) => x.p === p); return st ? `${N[p]} is ${P[st.s]}` : `${N[p]} is not ${listOr(ss.map((s) => P[s]))}`; });
      return `Clue ${ci + 1}: “${clues[ci].text}” So ${parts.join(', and ')}.`;
    },
    naked: (st) => `Every other place is ruled out, so ${N[st.p]} is ${P[st.s]}.`,
    hidden: (st) => `Nobody else can be ${P[st.s]}, so ${N[st.p]} is ${P[st.s]}.`,
  };
}

function orderQ(d: Difficulty, rng: Rng, sid: string): Question {
  const g5 = d >= 5; const n = d === 3 ? 3 : d === 6 ? 5 : 4;
  const max = g5 ? Math.min(5, n) : n;
  for (let tries = 0; tries < 600; tries++) {
    const mode: OMode = rng.chance(0.5) ? 'height' : 'queue';
    const N = rng.shuffle(KIDS).slice(0, n);
    const own = rng.shuffle(range(n));
    const clues = pickClues(rng, n, orderPool(N, own, mode, g5, d), 2, max);
    if (!clues) continue;
    const { say, head } = placeWords(n, mode);
    const solved = narrate(n, clues, orderLang(N, say, head, clues));
    if (!solved || solved.sol.some((s, p) => s !== own[p]) || solved.lines.length > n + (g5 ? 3 : 2)) continue;
    const at = (s: number) => own.indexOf(s);
    const fixed = clues.filter((c) => c.fix).map((c) => c.fix!);
    /** A clue already says who is in this place, or where this person is. */
    const told = (p: number, s: number) => fixed.some(([fp, fs]) => fp === p || fs === s);
    // What to ask, never something a clue says outright
    type Ask = { q: string; expr: string; answer: number; choices: string[]; end: string };
    const asks: Ask[] = [];
    const line = range(n).map((s) => N[at(s)]);
    if (mode === 'height') {
      const whoAt = (s: number, q: string, expr: string) => { if (!told(at(s), s)) asks.push({ q, expr, answer: at(s) + 1, choices: N, end: `So ${N[at(s)]} is ${say[s]}.` }); };
      whoAt(0, 'Who is the tallest?', 'tallest = ?');
      whoAt(n - 1, 'Who is the shortest?', 'shortest = ?');
      if (n % 2 === 1) whoAt((n - 1) / 2, 'Who is in the middle?', 'middle = ?');
      if (g5) whoAt(1, 'Who is the 2nd tallest?', '2nd tallest = ?');
    } else {
      const whoAt = (s: number, q: string, expr: string) => { if (!told(at(s), s)) asks.push({ q, expr, answer: at(s) + 1, choices: N, end: `So ${N[at(s)]} is ${PLACE[s]} in line.` }); };
      whoAt(0, 'Who is first in line?', 'first in line = ?');
      whoAt(n - 1, 'Who is last in line?', 'last in line = ?');
      for (const p of range(n)) if (!told(p, -1)) asks.push({ q: `What place in line is ${N[p]}?`, expr: `${N[p]}'s place = ?`, answer: own[p] + 1, choices: PLACE.slice(0, n), end: `So ${N[p]} is ${PLACE[own[p]]} in line.` });
      if (g5) for (const p of range(n)) {
        if (own[p] === n - 1 || clues.some((c) => c.kind === 'rightbehind' && c.vars[1] === p)) continue;
        const b = at(own[p] + 1);
        asks.push({ q: `Who is right behind ${N[p]}?`, expr: `right behind ${N[p]} = ?`, answer: b + 1, choices: N, end: `So ${N[b]} is right behind ${N[p]}.` });
      }
    }
    if (!asks.length) continue;
    const a = rng.pick(asks);
    const setup = mode === 'height' ? `${listAnd(N)} are all different heights.` : `${listAnd(N)} stand in a line, one behind the other. 1st is at the front.`;
    const clueText = clues.map((c, i) => `Clue ${i + 1}: ${c.text}`).join(' ');
    const tap = a.choices === N ? 'Tap a name.' : 'Tap the place.';
    const visual: GridV = { type: 'logicgrid', rows: N, cols: head };
    return make('order', d, sid, {
      prompt: `${setup} ${clueText} ${a.q} ${tap}`, expression: a.expr, answer: a.answer,
      hint: `${mode === 'height' ? 'Line them up from tallest to shortest. Use one clue at a time to rule places out.' : 'Picture the line from front to back. Start with a clue that names a place, if there is one.'} ${TAP_GRID}`,
      steps: [`Use the grid: names down the side, places across the top.`, ...solved.lines, `${mode === 'height' ? 'From tallest to shortest' : 'From front to back'}: ${line.join(', ')}.`, a.end],
      visual, solution: { ...visual, marks: gridMarks(n, own) },
      choices: wordChoices(a.choices),
      read: `${setup} ${clues.map((c, i) => `Clue ${i + 1}. ${c.text}`).join(' ')} ${a.q}`,
    });
  }
  throw new Error('logic order: no puzzle found');
}

/* ------------------------------------------------------------------ */
/* Must, might or can't, and pigeonholes                               */
/* ------------------------------------------------------------------ */

interface Bag { icon: ContestIcon; one: string; many: string; box: string }
const BAGS: Bag[] = [
  { icon: 'ball', one: 'marble', many: 'marbles', box: 'bag' },
  { icon: 'shirt', one: 'shirt', many: 'shirts', box: 'drawer' },
  { icon: 'hat', one: 'hat', many: 'hats', box: 'box' },
];
const BAG_COLORS: ColorName[] = ['red', 'blue', 'yellow', 'green', 'purple'];
type Ev = { k: 'is'; c: ColorName } | { k: 'isor'; c: ColorName; c2: ColorName } | { k: 'atleast1'; c: ColorName } | { k: 'allc'; c: ColorName } | { k: 'twosame' } | { k: 'oneeach' } | { k: 'alldiff' };
const MM_LABELS = ['Must', 'Might', "Can't"];

/** Every handful of k from the bag, as counts per colour. */
function handfuls(counts: number[], k: number): number[][] {
  const out: number[][] = []; const cur: number[] = [];
  const go = (i: number, left: number) => {
    if (i === counts.length) { if (left === 0) out.push([...cur]); return; }
    for (let a = 0; a <= Math.min(counts[i], left); a++) { cur.push(a); go(i + 1, left - a); cur.pop(); }
  };
  go(0, k); return out;
}
function evHolds(ev: Ev, cols: ColorName[], h: number[]): boolean {
  const of = (c: ColorName) => (cols.includes(c) ? h[cols.indexOf(c)] : 0);
  const k = sum(h);
  switch (ev.k) {
    case 'is': return of(ev.c) === 1;
    case 'isor': return of(ev.c) + of(ev.c2) === 1;
    case 'atleast1': return of(ev.c) >= 1;
    case 'allc': return of(ev.c) === k;
    case 'twosame': return Math.max(...h) >= 2;
    case 'oneeach': return h.every((x) => x >= 1);
    case 'alldiff': return Math.max(...h) <= 1;
  }
}
/** "Mia ___ get a red marble." with ___ = must, might or can't. */
function evText(ev: Ev, who: string, bag: Bag, w: string): string {
  switch (ev.k) {
    case 'is': return `${who} ${w} get ${an(ev.c)} ${ev.c} ${bag.one}.`;
    case 'isor': return `${who} ${w} get ${an(ev.c)} ${ev.c} or ${ev.c2} ${bag.one}.`;
    case 'atleast1': return `${who} ${w} get at least one ${ev.c} ${bag.one}.`;
    case 'allc': return `${who} ${w} get only ${ev.c} ${bag.many}.`;
    case 'twosame': return `${who} ${w} get two ${bag.many} of the same colour.`;
    case 'oneeach': return `${who} ${w} get one ${bag.one} of each colour.`;
    case 'alldiff': return `${who} ${w} get ${bag.many} that are all different colours.`;
  }
}

function mustmightQ(d: Difficulty, rng: Rng, sid: string): Question {
  if (d >= 5 && rng.chance(0.5)) return pigeonQ(d, rng, sid);
  const target = rng.int(1, 3) as Verdict;
  const bag = rng.pick(BAGS); const who = rng.pick(KIDS);
  for (let tries = 0; ; tries++) {
    const g5 = d >= 5;
    const ncol = g5 ? rng.int(3, 4) : d === 3 && rng.chance(0.15) ? 1 : rng.int(2, 3);
    const cols = rng.shuffle(BAG_COLORS).slice(0, ncol);
    const counts = cols.map(() => rng.int(1, g5 ? (rng.chance(0.3) ? 1 : 6) : 6));
    const others = BAG_COLORS.filter((c) => !cols.includes(c));
    const total = sum(counts);
    const k = d === 3 ? 1 : d === 4 ? (rng.chance(0.3) ? 1 : rng.int(2, 3)) : rng.int(2, 5);
    // Taking every one out is no puzzle; and a colour that is not there at all is kept for the easier one-pick questions.
    if (k >= total) continue;
    const anyC = () => (rng.chance(k === 1 ? 0.75 : 0.9) || !others.length ? rng.pick(cols) : rng.pick(others));
    let ev: Ev;
    if (k === 1) {
      ev = rng.chance(0.6) ? { k: 'is', c: anyC() } : (() => { const [c, c2] = rng.shuffle(rng.chance(0.6) ? cols : [...cols, ...others]).slice(0, 2); return c2 ? { k: 'isor' as const, c, c2 } : { k: 'is' as const, c }; })();
    } else {
      const opts: Ev['k'][] = g5 ? ['atleast1', 'allc', 'twosame', 'oneeach', 'alldiff'] : ['atleast1', 'allc', 'twosame'];
      const kk = rng.pick(opts);
      ev = kk === 'atleast1' || kk === 'allc' ? { k: kk, c: anyC() } : { k: kk } as Ev;
    }
    if ((ev.k === 'allc' || ev.k === 'atleast1' || ev.k === 'twosame') && ncol === 1) continue;
    if ((ev.k === 'oneeach' || ev.k === 'alldiff') && ncol < 3) continue;
    const hs = handfuls(counts, k);
    const yes = hs.filter((h) => evHolds(ev, cols, h)); const no = hs.filter((h) => !evHolds(ev, cols, h));
    const verdict: Verdict = !no.length ? 1 : yes.length ? 2 : 3;
    if (verdict !== target && tries < 300) continue;
    const many = (c: ColorName, x: number) => `${c} ${x === 1 ? bag.one : bag.many}`;
    const pick = (h: number[]) => listAnd(cols.map((c, i) => (h[i] ? lab(h[i], many(c, h[i])) : '')).filter(Boolean));
    const of = (c: ColorName) => (cols.includes(c) ? counts[cols.indexOf(c)] : 0);
    const inBag = `in the ${bag.box}`;
    // Why: a must or a can't has a reason; a might has one handful that does and one that does not.
    let why: string[];
    if (verdict === 2) why = [`${who} could get ${pick(rng.pick(yes))}: that fits.`, `Or ${who} could get ${pick(rng.pick(no))}: that does not.`];
    else switch (ev.k) {
      case 'is': why = [verdict === 1 ? `Every ${bag.one} ${inBag} is ${ev.c}.` : `There are no ${ev.c} ${bag.many} ${inBag}.`]; break;
      case 'isor': why = [verdict === 1 ? `Every ${bag.one} ${inBag} is ${ev.c} or ${ev.c2}.` : `There are no ${ev.c} or ${ev.c2} ${bag.many} ${inBag}.`]; break;
      case 'atleast1': {
        if (verdict === 3) { why = [`There are no ${ev.c} ${bag.many} ${inBag}.`]; break; }
        const rest = cols.map((c, i) => [c, counts[i]] as const).filter(([c]) => c !== ev.c);
        const left = sum(rest.map(([, x]) => x));
        why = [rest.length > 1 ? `The ${bag.many} that are not ${ev.c}: ${rest.map(([c, x]) => lab(x, many(c, x))).join(' + ')} = ${lab(left, bag.many)}.` : `The only ${bag.many} that are not ${ev.c}: ${lab(left, many(rest[0][0], left))}.`,
          `${who} takes ${lab(k, bag.many)}, more than that, so they cannot all miss ${ev.c}.`];
        break;
      }
      case 'allc': why = verdict === 3 ? [of(ev.c) ? `There ${of(ev.c) === 1 ? 'is' : 'are'} only ${lab(of(ev.c), many(ev.c, of(ev.c)))}, not enough for ${lab(k, bag.many)}.` : `There are no ${ev.c} ${bag.many} ${inBag}.`] : [`Every ${bag.one} ${inBag} is ${ev.c}.`]; break;
      case 'twosame': why = verdict === 1 ? [`There are only ${labn(ncol, 'colour')}.`, `With ${lab(k, bag.many)}, at least two must share a colour.`] : [`Each colour has only ${lab(1, bag.one)}, so no two can match.`]; break;
      case 'oneeach': why = verdict === 3 ? [`There are ${labn(ncol, 'colour')}, but only ${lab(k, bag.many)} are taken.`]
        : [`Leave out every ${bag.one} of one colour, and at most ${lab(total - Math.min(...counts), bag.many)} are left.`, `${who} takes ${lab(k, bag.many)}, more than that, so no colour can be missed.`]; break;
      case 'alldiff': why = verdict === 3 ? [`There are only ${labn(ncol, 'colour')}, so ${lab(k, bag.many)} cannot all be different.`] : [`Each colour has only ${lab(1, bag.one)}, so no two can match.`]; break;
    }
    const word = ['must', 'might', "can't"][verdict - 1];
    const takes = k === 1 ? `picks 1 ${bag.one}` : `takes ${k} ${bag.many}`;
    const setup = `${who} ${takes} from the ${bag.box} without looking.`;
    const ask = evText(ev, who, bag, '___');
    const scene: SceneV = { type: 'scene', title: `${who}'s ${bag.box}`, items: cols.map((c, i) => ({ icon: bag.icon, color: c, n: counts[i], label: c })) };
    return make('mustmight', d, sid, {
      prompt: `${setup} ${ask} Tap Must, Might or Can't.`, expression: 'must, might or can’t?', answer: verdict,
      hint: k === 1 ? `Look at every colour in the ${bag.box}.` : 'Think of the unluckiest handful. Could it miss? Could it fit?',
      steps: [`Look at the ${bag.box}: ${cols.map((c, i) => lab(counts[i], many(c, counts[i]))).join(', ')}.`, ...why, `So ${evText(ev, who, bag, word)}`],
      visual: scene, choices: wordChoices(MM_LABELS),
      read: `${setup} ${evText(ev, who, bag, "must, might, or can't")} Which is it?`,
    });
  }
}

type PH = 'pair' | 'triple' | 'each' | 'one' | 'two' | 'diff';
function pigeonQ(d: Difficulty, rng: Rng, sid: string): Question {
  const bag = rng.pick(BAGS); const who = rng.pick(KIDS);
  const kind: PH = rng.pick(d === 5 ? ['pair', 'one', 'diff'] : ['triple', 'each', 'two']);
  for (;;) {
    const ncol = rng.int(3, 4); const cols = rng.shuffle(BAG_COLORS).slice(0, ncol);
    const counts = cols.map(() => rng.int(kind === 'triple' ? 1 : 2, 9));
    if (kind === 'triple' && (Math.max(...counts) < 3 || (Math.min(...counts) >= 2 && rng.chance(0.6)))) continue;
    const ci = rng.int(0, ncol - 1); const c = cols[ci]; const cc = counts[ci];
    if (kind === 'two' && cc < 2) continue;
    const total = sum(counts); const mx = Math.max(...counts); const mn = Math.min(...counts);
    const many = (col: ColorName, x: number) => `${col} ${x === 1 ? bag.one : bag.many}`;
    const L2 = (col: ColorName, x: number) => lab(x, many(col, x));
    let answer: number; let goal: string; let steps: string[]; let wrong: number[];
    const worst = 'Think of the unluckiest picks: how many could come out and still miss?';
    switch (kind) {
      case 'pair': {
        answer = ncol + 1; goal = `2 ${bag.many} of the same colour`; wrong = [ncol, ncol + 2, total, 2];
        steps = [`${worst}`, `${who} could take ${listAnd(cols.map((x) => L2(x, 1)))} with no two the same.`, `That is ${lab(ncol, bag.many)}, one of each colour.`, `The next one must match one of them: ${lab(ncol, bag.many)} + ${lab(1, bag.one)} = ${lab(answer, bag.many)}.`];
        break;
      }
      case 'triple': {
        const takes = counts.map((x) => Math.min(x, 2)); const w = sum(takes); answer = w + 1;
        goal = `3 ${bag.many} of the same colour`; wrong = [2 * ncol + 1, answer - 1, answer + 1, 3 * ncol, ncol + 1];
        const ones = cols.filter((_, i) => counts[i] < 2);
        steps = [`${worst}`, `${who} could take ${listAnd(cols.map((x, i) => L2(x, takes[i])))} with no three the same.`, ...(ones.length ? [`Only ${listAnd(ones.map((x) => L2(x, 1)))} ${ones.length === 1 ? 'is' : 'are'} in the ${bag.box}, so ${ones.length === 1 ? 'that colour gives' : 'those colours give'} just one.`] : []),
          `${cols.map((x, i) => L2(x, takes[i])).join(' + ')} = ${lab(w, bag.many)}.`, `The next one makes ${lab(3, bag.many)} of one colour: ${lab(w, bag.many)} + ${lab(1, bag.one)} = ${lab(answer, bag.many)}.`];
        break;
      }
      case 'each': {
        const skip = counts.indexOf(mn); const rest = cols.filter((_, i) => i !== skip); const w = total - mn; answer = w + 1;
        goal = `at least one ${bag.one} of each colour`; wrong = [ncol, total - mx + 1, total, answer - 1];
        steps = [`${worst}`, `The worst luck takes every ${bag.one} of the other colours first and no ${cols[skip]} at all.`, `${rest.map((x) => L2(x, counts[cols.indexOf(x)])).join(' + ')} = ${lab(w, bag.many)}, and still no ${cols[skip]} ${bag.one}.`,
          `The next one must be ${cols[skip]}: ${lab(w, bag.many)} + ${lab(1, bag.one)} = ${lab(answer, bag.many)}.`];
        break;
      }
      case 'one': {
        const rest = cols.filter((x) => x !== c); const w = total - cc; answer = w + 1;
        goal = `at least one ${c} ${bag.one}`; wrong = [cc, w, answer + 1, total, 2];
        steps = [`${worst}`, `${who} could take every ${bag.one} that is not ${c}: ${rest.map((x) => L2(x, counts[cols.indexOf(x)])).join(' + ')} = ${lab(w, bag.many)}.`, `The next one must be ${c}: ${lab(w, bag.many)} + ${lab(1, bag.one)} = ${lab(answer, bag.many)}.`];
        break;
      }
      case 'two': {
        const rest = cols.filter((x) => x !== c); const w = total - cc; answer = w + 2;
        goal = `2 ${c} ${bag.many}`; wrong = [w + 1, 2, answer - 2, total, cc];
        steps = [`${worst}`, `${who} could take every ${bag.one} that is not ${c}: ${rest.map((x) => L2(x, counts[cols.indexOf(x)])).join(' + ')} = ${lab(w, bag.many)}.`, `After that, every one is ${c}, and ${who} needs ${lab(2, many(c, 2))}: ${lab(w, bag.many)} + ${lab(2, many(c, 2))} = ${lab(answer, bag.many)}.`];
        break;
      }
      case 'diff': {
        const big = cols[counts.indexOf(mx)]; answer = mx + 1;
        goal = `2 ${bag.many} of different colours`; wrong = [2, mx, ncol + 1, answer + 1, total];
        steps = [`${worst}`, `${who} could take all ${L2(big, mx)} first, every one the same colour.`, `The next one must be a different colour: ${L2(big, mx)} + ${lab(1, bag.one)} = ${lab(answer, bag.many)}.`];
        break;
      }
    }
    // "2 purple, 6 blue and 2 red shirts"; with a count of 1, each count gets its own noun ("… and 1 blue hat").
    const desc = counts.includes(1) ? listAnd(cols.map((x, i) => `${counts[i]} ${many(x, counts[i])}`)) : `${listAnd(cols.map((x, i) => `${counts[i]} ${x}`))} ${bag.many}`;
    // The unluckiest picks, as the steps tell them (one colour for "different colours", the first biggest when two tie).
    const solCounts = kind === 'pair' ? counts.map(() => 1) : kind === 'triple' ? counts.map((x) => Math.min(x, 2)) : kind === 'diff' ? counts.map((x, i) => (i === counts.indexOf(mx) ? x : 0)) : kind === 'each' ? counts.map((x, i) => (i === counts.indexOf(mn) ? 0 : x)) : counts.map((x, i) => (i === ci ? 0 : x));
    const solItems = cols.map((x, i) => ({ icon: bag.icon, color: x, n: solCounts[i], label: `${solCounts[i]} ${x}` })).filter((x) => x.n > 0);
    return make('mustmight', d, sid, {
      prompt: `${who}'s ${bag.box} has ${desc}. ${who} takes ${bag.many} out without looking. How many must ${who} take to be sure of getting ${goal}?`,
      expression: `${bag.many} to take = ?`, answer,
      hint: 'Imagine the worst luck. How many could come out and still not give you what you want?',
      steps, visual: { type: 'scene', title: `${who}'s ${bag.box}`, items: cols.map((x, i) => ({ icon: bag.icon, color: x, n: counts[i], label: `${counts[i]} ${x}` })) },
      solution: { type: 'scene', title: 'The unluckiest picks', items: solItems },
      // Never more than the bag holds: taking more than all of them is no real mistake.
      choices: numChoices(rng, answer, wrong, 5, 1, total),
    });
  }
}

/* ------------------------------------------------------------------ */
/* Truth-tellers and fibbers                                           */
/* ------------------------------------------------------------------ */

interface Says { text: string; refs: number[]; val: (w: boolean[]) => boolean; same?: boolean }
const kindOf = (b: boolean) => (b ? 'a truth-teller' : 'a fibber');

function saysFor(s: number, n: number, N: string[], d: Difficulty): Says[] {
  const others = range(n).filter((x) => x !== s); const all = range(n);
  const out: Says[] = [];
  for (const b of others) {
    out.push({ text: `${N[b]} is a fibber.`, refs: [b], val: (w) => !w[b] });
    out.push({ text: `${N[b]} tells the truth.`, refs: [b], val: (w) => w[b] });
    out.push({ text: `${N[b]} and I both tell the truth.`, refs: [s, b], val: (w) => w[s] && w[b] });
    out.push({ text: `${N[b]} and I are both fibbers.`, refs: [s, b], val: (w) => !w[s] && !w[b] });
    out.push({ text: `${N[b]} and I are the same kind.`, refs: [s, b], val: (w) => w[s] === w[b], same: true });
    out.push({ text: `${N[b]} and I are different kinds.`, refs: [s, b], val: (w) => w[s] !== w[b], same: true });
  }
  out.push({ text: 'Exactly one of us is a fibber.', refs: all, val: (w) => w.filter((x) => !x).length === 1 });
  out.push({ text: 'At least one of us is a fibber.', refs: all, val: (w) => w.some((x) => !x) });
  out.push({ text: 'We all tell the truth.', refs: all, val: (w) => w.every(Boolean) });
  if (n === 3 && d === 6) {
    const [b, c] = others;
    out.push({ text: `${N[b]} and ${N[c]} are both fibbers.`, refs: [b, c], val: (w) => !w[b] && !w[c] });
    out.push({ text: `${N[b]} and ${N[c]} are the same kind.`, refs: [b, c], val: (w) => w[b] === w[c], same: true });
    out.push({ text: 'Exactly one of us tells the truth.', refs: all, val: (w) => w.filter(Boolean).length === 1 });
    out.push({ text: 'I tell the truth.', refs: [s], val: (w) => w[s] });
  }
  return out;
}

interface Run { lines: string[]; status: 'contra' | 'done' | 'stuck'; known: (boolean | null)[] }
/** Follow what the speakers say from what is known, one speaker at a time, until it is all known, breaks, or stalls. */
function follow(N: string[], said: Says[], start: (boolean | null)[]): Run {
  const n = N.length; const known = [...start]; const lines: string[] = [];
  const q = (s: number) => `“${said[s].text.replace(/\.$/, '')}”`;
  for (let guard = 0; guard < 30; guard++) {
    let moved = false;
    for (let s = 0; s < n && !moved; s++) {
      const inv = [...new Set([s, ...said[s].refs])];
      const unk = inv.filter((p) => known[p] === null);
      const worlds: boolean[][] = [];
      for (let m = 0; m < 1 << unk.length; m++) {
        const w = known.map((x) => x ?? false); unk.forEach((p, j) => { w[p] = !!(m & (1 << j)); });
        if (said[s].val(w) === w[s]) worlds.push(w);
      }
      if (!worlds.length) {
        lines.push(known[s] !== null ? `But ${N[s]} is ${kindOf(known[s]!)}, and ${q(s)} would be ${known[s] ? 'false' : 'true'}. That cannot happen.`
          : `If ${N[s]} told the truth, ${q(s)} would be false. If ${N[s]} fibbed, it would be true. Either way, that cannot happen.`);
        return { lines, status: 'contra', known };
      }
      if (!unk.length) continue;
      if (known[s] !== null) {
        const det = unk.filter((p) => worlds.every((w) => w[p] === worlds[0][p]));
        if (!det.length) continue;
        det.forEach((p) => { known[p] = worlds[0][p]; });
        lines.push(`${N[s]} is ${kindOf(known[s]!)}, so ${q(s)} is ${known[s] ? 'true' : 'false'}. So ${listAnd(det.map((p) => `${N[p]} is ${kindOf(known[p]!)}`))}.`);
        moved = true;
      } else {
        const can = [true, false].filter((v) => worlds.some((w) => w[s] === v));
        if (can.length !== 1) continue;
        known[s] = can[0];
        lines.push(`If ${N[s]} were ${kindOf(!can[0])}, ${q(s)} would be ${can[0] ? 'true' : 'false'}. So ${N[s]} is ${kindOf(can[0])}.`);
        moved = true;
      }
    }
    if (!moved) break;
  }
  return { lines, status: known.every((x) => x !== null) ? 'done' : 'stuck', known };
}
/** The worked steps: follow the clues; if that stalls, try one speaker both ways (one way breaks, one way works). */
function liarSteps(N: string[], said: Says[]): { lines: string[]; world: boolean[]; focus: number } | null {
  const n = N.length;
  const top = follow(N, said, range(n).map(() => null));
  if (top.status === 'done') return { lines: top.lines, world: top.known as boolean[], focus: N.findIndex((x) => top.lines[0]?.startsWith(`If ${x} `)) };
  if (top.status === 'contra') return null;
  for (const a of range(n).filter((p) => top.known[p] === null)) {
    const withA = (v: boolean) => top.known.map((x, p) => (p === a ? v : x));
    const t = follow(N, said, withA(true)); const f = follow(N, said, withA(false));
    let bad: Run, good: Run, badV: boolean;
    if (t.status === 'contra' && f.status === 'done') { bad = t; good = f; badV = true; } else if (f.status === 'contra' && t.status === 'done') { bad = f; good = t; badV = false; } else continue;
    return {
      lines: [...top.lines, `Try ${N[a]} as ${kindOf(badV)}.`, ...bad.lines, `So ${N[a]} is not ${kindOf(badV)}: ${N[a]} is ${kindOf(!badV)}.`, ...good.lines],
      world: good.known as boolean[], focus: a,
    };
  }
  return null;
}

/**
 * The hint starts where the worked steps start (one robot's own words, or one robot to try) but never says which case
 * breaks: it always names both cases, truth first, so the hint alone cannot give the answer away.
 */
function liarHint(first: string, fallback: string): string {
  const own = /^If (\w+) were (?:a truth-teller|a fibber),/.exec(first);
  if (own) return `Start with ${own[1]}'s own words. Could a truth-teller say them? Could a fibber?`;
  const x = /^Try (\w+) as /.exec(first)?.[1] ?? fallback;
  return `Start with ${x}. Pretend ${x} tells the truth, then pretend ${x} fibs. Which story holds together?`;
}

function liarQ(d: Difficulty, rng: Rng, sid: string): Question {
  const n = d >= 6 ? 3 : 2;
  for (let tries = 0; tries < 2000; tries++) {
    const N = rng.shuffle(ROBOTS).slice(0, n);
    const world = range(n).map(() => rng.chance(0.5));
    const said = range(n).map((s) => { const ok = saysFor(s, n, N, d).filter((x) => x.val(world) === world[s]); return ok.length ? rng.pick(ok) : null; });
    if (said.some((x) => !x)) continue;
    const S = said as Says[];
    if (n === 3 && S.filter((x) => x.refs.length === n).length > 1) continue;
    const fits = range(1 << n).map((m) => range(n).map((p) => !!(m & (1 << p)))).filter((w) => S.every((x, s) => x.val(w) === w[s]));
    if (fits.length !== 1) continue;
    const worked = liarSteps(N, S);
    if (!worked || worked.world.some((x, p) => x !== world[p])) continue;
    const T = range(n).filter((p) => world[p]); const F = range(n).filter((p) => !world[p]);
    type Ask = { q: string; expr: string; answer: number; choices: QuestionChoice[]; end: string };
    const asks: Ask[] = [];
    if (F.length === 1) asks.push({ q: 'Who is the fibber?', expr: 'fibber = ?', answer: F[0] + 1, choices: wordChoices(N), end: `The fibber is ${N[F[0]]}.` });
    if (T.length === 1 && n === 3) asks.push({ q: 'Who is the only truth-teller?', expr: 'truth-teller = ?', answer: T[0] + 1, choices: wordChoices(N), end: `The only truth-teller is ${N[T[0]]}.` });
    asks.push({ q: 'How many of them tell the truth?', expr: 'truth-tellers = ?', answer: T.length, choices: choicesFrom(range(n + 1)), end: `That makes ${labn(T.length, 'truth-teller')}.` });
    const pAsk = rng.pick(range(n));
    asks.push({ q: `Is ${N[pAsk]} a truth-teller or a fibber?`, expr: `${N[pAsk]} = ?`, answer: world[pAsk] ? 1 : 2, choices: wordChoices(['Truth-teller', 'Fibber']), end: `${N[pAsk]} is ${kindOf(world[pAsk])}.` });
    const a = rng.pick(asks);
    const everyone = n === 2 ? 'both robots' : `all ${lab(n, 'robots')}`;
    const summary = !F.length ? `So ${everyone} tell the truth.` : !T.length ? `So ${everyone} are fibbers.`
      : `So ${listAnd(T.map((p) => N[p]))} ${T.length === 1 ? 'tells' : 'tell'} the truth, and ${listAnd(F.map((p) => N[p]))} ${F.length === 1 ? 'is a fibber' : 'are fibbers'}.`;
    const sameNote = S.some((x) => x.same) ? ' Same kind means both truth-tellers or both fibbers.' : '';
    const setup = `Each robot on Gear Island is a truth-teller or a fibber. Truth-tellers always tell the truth. Fibbers always fib.${sameNote}`;
    const talk = S.map((x, s) => `${N[s]} says, “${x.text}”`).join(' ');
    return make('liar', d, sid, {
      prompt: `${setup} ${talk} ${a.q}`, expression: a.expr, answer: a.answer,
      hint: liarHint(worked.lines[0], N[Math.max(0, worked.focus)]),
      steps: [...worked.lines, summary, a.end],
      visual: { type: 'speakers', people: S.map((x, s) => ({ name: N[s], says: x.text, icon: 'robot' as const })) },
      solution: { type: 'logicgrid', rows: N, cols: ['truth-teller', 'fibber'], marks: range(n).map((p) => [world[p] ? 'yes' : 'no', world[p] ? 'no' : 'yes']) },
      choices: a.choices,
    });
  }
  throw new Error('logic liar: no puzzle found');
}

/* ------------------------------------------------------------------ */
/* Entry points                                                        */
/* ------------------------------------------------------------------ */

const GEN: Record<K, (d: Difficulty, rng: Rng, sid: string) => Question> = { truefalse: truefalseQ, grid: gridQ, order: orderQ, mustmight: mustmightQ, liar: liarQ };

export function logicQuestion(kind: LogicKind, d: Difficulty, rng: Rng, skillId?: string): Question {
  const g = gradeOf(d);
  const fits = (Object.keys(LOGIC_KIND_GRADES) as K[]).filter((k) => LOGIC_KIND_GRADES[k].includes(g));
  const k: K = kind !== 'all' && GEN[kind as K] ? (kind as K) : rng.pick(fits);
  const sid = skillId ?? (kind !== 'all' && GEN[kind as K] ? `logic.${k}` : 'logic');
  return { ...GEN[k](logicDifficulty(k, d), rng, sid), difficulty: d };
}
export const genLogic: Generator = (skillId, params, ctx) => logicQuestion(String(params?.kind ?? 'all') as LogicKind, ctx.difficulty, ctx.rng, skillId);
