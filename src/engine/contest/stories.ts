import type { Difficulty, Question, QuestionChoice } from '../types';
import type { Rng } from '../rng';
import type { ContestIcon, ContestVisual } from './visuals';
import { contestQuestion, gradeOf, type ContestKind, type KindGrades } from './common';
import { lab, unit } from '../label';

/**
 * Picture stories for the Grade 1 track (Signal Cubes): tiny join, take-away, compare and hidden-part stories drawn
 * with the 'objects' picture, answered with big tap buttons. Difficulty 1 keeps every number to 10, difficulty 2 to
 * 20. The kinds are written for Grade 1 only; any other difficulty plays at the same spot in the Grade 1 band
 * (3 and 5 play like 1, 4 and 6 like 2). Every story is original and every sentence is short.
 */
export type StoryKind = 'join' | 'leave' | 'compare' | 'parts' | 'match';
export const STORY_META = { id: 'stories', label: 'Picture stories', topic: 'Picture stories', skill: 'stories' } as const;
export const STORY_KINDS: ContestKind[] = [
  { id: 'join', label: 'Some more come', short: 'More come', desc: 'Some are there and more come. How many now?' },
  { id: 'leave', label: 'Some go away', short: 'Go away', desc: 'Some are there and some go. How many are left?' },
  { id: 'compare', label: 'How many more', short: 'More', desc: 'Two rows side by side. How many more, or how many fewer?' },
  { id: 'parts', label: 'The hidden part', short: 'Hidden', desc: 'Some are hiding. How many?' },
  { id: 'match', label: 'Pick the picture', short: 'Picture', desc: 'Tap the picture that shows all of them.' },
];
export const STORY_KIND_IDS: StoryKind[] = ['join', 'leave', 'compare', 'parts', 'match'];
export const STORY_KIND_GRADES: KindGrades = { join: ['g1'], leave: ['g1'], compare: ['g1'], parts: ['g1'], match: ['g1'] };

/** Things that move: they sit somewhere, more come, some go. [one, many] verb forms agree with the count. */
interface Mover { icon: ContestIcon; one: string; many: string; place: string; spot: string; sit: [string, string]; come: [string, string]; go: [string, string] }
const MOVERS: Mover[] = [
  { icon: 'frog', one: 'frog', many: 'frogs', place: 'on the log', spot: 'on the log', sit: ['sits', 'sit'], come: ['hops on', 'hop on'], go: ['hops off', 'hop off'] },
  { icon: 'bird', one: 'bird', many: 'birds', place: 'on the wire', spot: 'on the wire', sit: ['sits', 'sit'], come: ['flies in', 'fly in'], go: ['flies away', 'fly away'] },
  { icon: 'fish', one: 'fish', many: 'fish', place: 'in the pond', spot: 'in the pond', sit: ['swims', 'swim'], come: ['swims in', 'swim in'], go: ['swims away', 'swim away'] },
  { icon: 'cat', one: 'cat', many: 'cats', place: 'on the mat', spot: 'on the mat', sit: ['naps', 'nap'], come: ['comes over', 'come over'], go: ['runs off', 'run off'] },
  { icon: 'car', one: 'car', many: 'cars', place: 'in the lot', spot: 'in the lot', sit: ['is parked', 'are parked'], come: ['drives in', 'drive in'], go: ['drives away', 'drive away'] },
  { icon: 'boat', one: 'boat', many: 'boats', place: 'at the dock', spot: 'at the dock', sit: ['floats', 'float'], come: ['sails in', 'sail in'], go: ['sails away', 'sail away'] },
  { icon: 'robot', one: 'robot', many: 'robots', place: 'in the shop', spot: 'in the shop', sit: ['works', 'work'], come: ['rolls in', 'roll in'], go: ['rolls out', 'roll out'] },
  { icon: 'dog', one: 'dog', many: 'dogs', place: 'in the yard', spot: 'in the yard', sit: ['plays', 'play'], come: ['runs in', 'run in'], go: ['runs home', 'run home'] },
];
/** Things to own, see or hide. */
interface Thing { icon: ContestIcon; one: string; many: string; seen: string; hidden: string }
const THINGS: Thing[] = [
  { icon: 'apple', one: 'apple', many: 'apples', seen: 'on the table', hidden: 'in the bag' },
  { icon: 'cookie', one: 'cookie', many: 'cookies', seen: 'on the plate', hidden: 'in the jar' },
  { icon: 'ball', one: 'ball', many: 'balls', seen: 'on the grass', hidden: 'in the box' },
  { icon: 'star', one: 'star', many: 'stars', seen: 'in the sky', hidden: 'behind the cloud' },
  { icon: 'book', one: 'book', many: 'books', seen: 'on the shelf', hidden: 'in the bag' },
  { icon: 'coin', one: 'coin', many: 'coins', seen: 'on the desk', hidden: 'in the bank' },
  { icon: 'flower', one: 'flower', many: 'flowers', seen: 'in the pot', hidden: 'in the basket' },
  { icon: 'kite', one: 'kite', many: 'kites', seen: 'in the sky', hidden: 'in the shed' },
  { icon: 'gear', one: 'gear', many: 'gears', seen: 'on the bench', hidden: 'in the toolbox' },
];
const NAMES = ['Mia', 'Leo', 'Ava', 'Sam', 'Zoe', 'Ben', 'Ivy', 'Max', 'Nia', 'Kai', 'Ana', 'Raj'];

const APP = 'Engineers draw a quick picture of a problem before they work it out. Pictures make the numbers easy to see.';
type Objects = Extract<ContestVisual, { type: 'objects' }>;

/** Tap choices: the right value plus wrong ones from real slips (most likely first, any outside `min`..`max` left out). */
function numberChoices(rng: Rng, right: number, slips: number[], n: number, max: number, min = 0): QuestionChoice[] {
  const wrong: number[] = [];
  for (const v of [...slips, right + 1, right - 1, right + 2, right - 2]) {
    if (wrong.length >= n - 1) break;
    if (Number.isInteger(v) && v >= min && v <= max && v !== right && !wrong.includes(v)) wrong.push(v);
  }
  return rng.shuffle([right, ...wrong]).map((v) => ({ value: v, label: String(v) }));
}

interface Built { prompt: string; expression: string; answer: number; hint: string; steps: string[]; visual: Objects; solution: Objects; choices: QuestionChoice[]; read: string }

function join(rng: Rng, d: 1 | 2): Built {
  const m = rng.pick(MOVERS);
  const [a, b] = d === 1 ? (() => { const a = rng.int(2, 6); return [a, rng.int(1, Math.min(4, 10 - a))]; })() : (() => { const a = rng.int(7, 14); return [a, rng.int(Math.max(2, 11 - a), Math.min(6, 20 - a))]; })();
  const total = a + b;
  const comes = b === 1 ? m.come[0] : m.come[1];
  const story = `${a} ${m.many} ${m.sit[1]} ${m.place}. ${b} more ${comes}.`;
  return {
    prompt: `${story} How many ${m.many} now?`,
    read: `${story} How many ${m.many} are there now?`,
    expression: `${m.many} now = ?`, answer: total,
    hint: `Count the ${m.many} ${m.spot} first. Then count on one for each new ${m.one}.`,
    steps: [`${lab(a, `${m.many} ${m.spot}`)} + ${lab(b, b === 1 ? `new ${m.one}` : `new ${m.many}`)} = ${lab(total, `${m.many} now`)}.`, `So there are ${lab(total, `${m.many} now`)}.`],
    visual: { type: 'objects', groups: [{ icon: m.icon, n: a, label: m.spot }, { icon: m.icon, n: b, arriving: true, label: comes }] },
    solution: { type: 'objects', groups: [{ icon: m.icon, n: a, label: m.spot }, { icon: m.icon, n: b, label: 'new' }], title: `${total} ${m.many} now` },
    // slips: took away instead of adding; forgot the new ones (never 0: you can see some already)
    choices: numberChoices(rng, total, [Math.abs(a - b), a], d === 1 ? 3 : 4, d === 1 ? 10 : 20, 1),
  };
}

function leave(rng: Rng, d: 1 | 2): Built {
  const m = rng.pick(MOVERS);
  const [a, b] = d === 1 ? (() => { const a = rng.int(3, 10); return [a, rng.int(1, Math.min(4, a - 1))]; })() : (() => { const a = rng.int(11, 20); return [a, rng.int(2, Math.min(9, a - 2))]; })();
  const left = a - b;
  const goes = b === 1 ? m.go[0] : m.go[1];
  const story = `${a} ${m.many} ${m.sit[1]} ${m.place}. ${b} ${goes}.`;
  return {
    prompt: `${story} How many ${m.many} are left?`,
    read: `${story} How many ${m.many} are left ${m.place}?`,
    expression: `${m.many} left = ?`, answer: left,
    hint: `Cover the ${m.many} that go with your hand. Count the ones that stay.`,
    steps: [`${lab(a, `${m.many} at the start`)} − ${lab(b, b === 1 ? `${m.one} goes` : `${m.many} go`)} = ${lab(left, `${m.many} left`)}.`, `So ${lab(left, `${m.many} left`)} ${left === 1 ? 'stays' : 'stay'} ${m.place}.`],
    visual: { type: 'objects', groups: [{ icon: m.icon, n: left, label: 'stay' }, { icon: m.icon, n: b, leaving: true, label: goes }] },
    solution: { type: 'objects', groups: [{ icon: m.icon, n: left, label: 'stay' }], title: `${left} ${unit(left, m.one, m.many)} left` },
    // slips: added instead of taking away (when it stays in range); counted the ones that left
    choices: numberChoices(rng, left, [a + b, b], d === 1 ? 3 : 4, d === 1 ? 10 : 20),
  };
}

function compare(rng: Rng, d: 1 | 2): Built {
  const t = rng.pick(THINGS);
  const [n1, n2] = rng.shuffle(NAMES).slice(0, 2);
  const [big, small] = d === 1 ? (() => { const big = rng.int(3, 10); return [big, rng.int(1, big - 1)]; })() : (() => { const big = rng.int(11, 20); return [big, rng.int(5, big - 2)]; })();
  const diff = big - small;
  const fewer = rng.chance(0.4);
  const has = `${n1} has ${big} ${t.many}. ${n2} has ${small} ${unit(small, t.one, t.many)}.`;
  const ask = fewer ? `How many fewer does ${n2} have?` : `How many more does ${n1} have?`;
  return {
    prompt: `${has} ${ask}`, read: `${has} ${ask}`,
    expression: fewer ? `how many fewer = ?` : `how many more = ?`, answer: diff,
    hint: `Match each of ${n2}'s ${t.many} with one of ${n1}'s. Count the ones with no partner.`,
    steps: [`${lab(big, `${n1}'s ${t.many}`)} − ${lab(small, small === 1 ? `${n2}'s ${t.one}` : `${n2}'s ${t.many}`)} = ${lab(diff, fewer ? `fewer ${t.many}` : `more ${t.many}`)}.`, fewer ? `So ${n2} has ${lab(diff, `fewer ${t.many}`)}.` : `So ${n1} has ${lab(diff, `more ${t.many}`)}.`],
    visual: { type: 'objects', groups: [{ icon: t.icon, n: big, label: n1 }, { icon: t.icon, n: small, label: n2 }] },
    solution: { type: 'objects', groups: [{ icon: t.icon, n: small, label: 'partners' }, { icon: t.icon, n: diff, label: 'no partner' }], title: `${diff} more for ${n1}` },
    // slips: added the two rows; counted only the smaller row
    choices: numberChoices(rng, diff, [big + small, small], d === 1 ? 3 : 4, d === 1 ? 10 : 20),
  };
}

function parts(rng: Rng, d: 1 | 2): Built {
  const t = rng.pick(THINGS);
  const [total, seen] = d === 1 ? (() => { const total = rng.int(4, 10); return [total, rng.int(1, total - 1)]; })() : (() => { const total = rng.int(11, 20); return [total, rng.int(5, total - 2)]; })();
  const hidden = total - seen;
  const seenLine = seen === 1 ? `1 is ${t.seen}.` : `${seen} are ${t.seen}.`;
  return {
    prompt: `There are ${total} ${t.many} in all. ${seenLine} How many are ${t.hidden}?`,
    read: `There are ${total} ${t.many} in all. ${seenLine} How many ${t.many} are ${t.hidden}?`,
    expression: `${t.many} ${t.hidden} = ?`, answer: hidden,
    hint: `Count the ${t.many} you can see. Then count on until you reach ${total}.`,
    steps: [`${lab(total, `${t.many} in all`)} − ${lab(seen, seen === 1 ? `${t.one} you can see` : `${t.many} you can see`)} = ${lab(hidden, `${t.many} ${t.hidden}`)}.`, `Check: ${lab(seen, seen === 1 ? `${t.one} you can see` : `${t.many} you can see`)} + ${lab(hidden, `${t.many} ${t.hidden}`)} = ${lab(total, `${t.many} in all`)}.`],
    visual: { type: 'objects', groups: [{ icon: t.icon, n: seen, label: t.seen }, { icon: t.icon, n: hidden, hidden: true, label: t.hidden }], title: `${total} ${t.many} in all` },
    solution: { type: 'objects', groups: [{ icon: t.icon, n: seen, label: t.seen }, { icon: t.icon, n: hidden, label: t.hidden }], title: `${total} ${t.many} in all` },
    // slips: added the numbers; answered with the ones you can see
    choices: numberChoices(rng, hidden, [total + seen, seen], d === 1 ? 3 : 4, d === 1 ? 10 : 20),
  };
}

function match(rng: Rng, d: 1 | 2): Built {
  const t = rng.pick(THINGS);
  const name = rng.pick(NAMES);
  const [a, b] = d === 1 ? (() => { const a = rng.int(1, 5); return [a, rng.int(1, Math.min(4, 9 - a))]; })() : (() => { const a = rng.int(6, 10); return [a, rng.int(Math.max(2, 11 - a), Math.min(6, 16 - a))]; })();
  const total = a + b;
  const wrong: number[] = [];
  for (const v of [a, total + 1, total - 1, Math.abs(a - b), total + 2]) if (wrong.length < (d === 1 ? 2 : 3) && v >= 1 && v !== total && !wrong.includes(v)) wrong.push(v);
  const counts = rng.shuffle([total, ...wrong]);
  const choices: QuestionChoice[] = counts.map((n, i) => ({ value: i + 1, label: `${n} ${unit(n, t.one, t.many)}`, visual: { type: 'objects', groups: [{ icon: t.icon, n }] } }));
  const right = counts.indexOf(total) + 1;
  const story = `${name} has ${a} ${unit(a, t.one, t.many)}. ${name} gets ${b} more.`;
  return {
    prompt: `${story} Which picture shows all of them? Tap it.`,
    read: `${story} Which picture shows all of ${name}'s ${t.many}?`,
    expression: 'the right picture = ?', answer: right,
    hint: `Count ${name}'s ${t.many} first. Then count on for the new ones.`,
    steps: [`${lab(a, a === 1 ? `${t.one} at first` : `${t.many} at first`)} + ${lab(b, b === 1 ? `new ${t.one}` : `new ${t.many}`)} = ${lab(total, `${t.many} in all`)}.`, `So tap the picture with ${lab(total, t.many)}.`],
    visual: { type: 'objects', groups: [{ icon: t.icon, n: a, label: name }, { icon: t.icon, n: b, arriving: true, label: 'more' }] },
    solution: { type: 'objects', groups: [{ icon: t.icon, n: total, label: 'all of them' }], title: `${total} ${t.many}` },
    choices,
  };
}

const BUILD: Record<StoryKind, (rng: Rng, d: 1 | 2) => Built> = { join, leave, compare, parts, match };

/** The Grade 1 spot a difficulty plays at: 1 and 2 as they are, 3 and 5 like 1, 4 and 6 like 2. */
export const storyLevel = (d: Difficulty): 1 | 2 => (gradeOf(d) === 'g1' ? (d as 1 | 2) : (((d - 1) % 2) + 1) as 1 | 2);

/** One picture story. `kind` 'all' picks a kind; the mastery skill is stories.<kind> unless one is given. */
export function storyQuestion(kind: StoryKind | 'all', d: Difficulty, rng: Rng, skillId?: string): Question {
  const k: StoryKind = kind === 'all' ? rng.pick(STORY_KIND_IDS) : kind;
  const b = BUILD[k](rng, storyLevel(d));
  return contestQuestion('story', STORY_META.topic, skillId ?? (kind === 'all' ? STORY_META.skill : `stories.${k}`), STORY_KINDS.find((x) => x.id === k)!.label, {
    prompt: b.prompt, expression: b.expression, answer: b.answer, difficulty: d, hint: b.hint, steps: b.steps,
    visual: b.visual, solutionVisual: b.solution, choices: b.choices, readAloud: b.read, app: APP, prereq: [],
  });
}
export const storyLabel = (kind: string) => STORY_KINDS.find((k) => k.id === kind)?.label ?? 'Picture story';
