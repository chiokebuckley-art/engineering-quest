import type { Difficulty, Question, Visual } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { nextQuestionId } from './context';
import { lab, labn } from '../label';

/**
 * Word problems that know WHY they are solved the way they are.
 * Every problem carries its structure (put together, compare, equal groups…),
 * the operation it needs, the layout ("24 + 18"), a plain-language reason,
 * the clue words, and three decoy layouts for the Millionaire game.
 */
export type WordOp = 'add' | 'sub' | 'mult' | 'div';
export type WordKind = WordOp | 'twostep' | 'mixed';

export interface WordInfo {
  /** The operation that finishes the problem (for two-step: the last one). */
  op: WordOp;
  ops: WordOp[];
  layout: string;
  /** Short structure name, e.g. "Put together". */
  structure: string;
  why: string;
  clues: string[];
  /** Three wrong layouts, plausible but incorrect. */
  distractors: string[];
  /** The layout with a label on every number, for display: "12 (Maya's bolts) + 8 (Leo's bolts)". */
  setup?: string;
  /** The answer with its label, for display: "20 (bolts altogether)". */
  result?: string;
}

export const OP_SYMBOL: Record<WordOp, string> = { add: '+', sub: '−', mult: '×', div: '÷' };
export const OP_NAME: Record<WordOp, string> = { add: 'Add', sub: 'Subtract', mult: 'Multiply', div: 'Divide' };

/** The detective questions, in the order a player should ask them. */
export const DETECTIVE: { op: WordOp; ask: string; clues: string[] }[] = [
  { op: 'add', ask: 'Are different amounts being put together, or does an amount grow?', clues: ['altogether', 'in all', 'total', 'more', 'combined', 'both'] },
  { op: 'sub', ask: 'Is something taken away, is something left over, or are two amounts being compared?', clues: ['left', 'how many more', 'fewer', 'difference', 'used', 'still needs'] },
  { op: 'mult', ask: 'Are there EQUAL groups and you want the total?', clues: ['each', 'every', 'per', 'times as many', 'rows of'] },
  { op: 'div', ask: 'Do you have a total that is split into EQUAL groups?', clues: ['shared equally', 'split', 'each gets', 'how many groups', 'per'] },
];

const NAMES = ['Maya', 'Leo', 'Zoe', 'Kai', 'Priya', 'Sam', 'Nia', 'Omar', 'Ada', 'Volt', 'Brick', 'Jun'];
/** item/box are plural; itemOne/boxOne are the singular forms, so labels read "1 (crate)", never "1 (crates)" or "crat". */
interface Theme { item: string; itemOne: string; box: string; boxOne: string; place: string; machine: string }
const THEMES: Theme[] = [
  { item: 'bolts', itemOne: 'bolt', box: 'boxes', boxOne: 'box', place: 'the workshop', machine: 'pump' },
  { item: 'gears', itemOne: 'gear', box: 'crates', boxOne: 'crate', place: 'the mine depot', machine: 'conveyor' },
  { item: 'batteries', itemOne: 'battery', box: 'packs', boxOne: 'pack', place: 'the power room', machine: 'lamp' },
  { item: 'LED lights', itemOne: 'LED light', box: 'strips', boxOne: 'strip', place: 'the lab', machine: 'sign' },
  { item: 'robot parts', itemOne: 'robot part', box: 'kits', boxOne: 'kit', place: 'the robotics bay', machine: 'robot arm' },
  { item: 'solar cells', itemOne: 'solar cell', box: 'panels', boxOne: 'panel', place: 'the roof array', machine: 'charger' },
  { item: 'wheels', itemOne: 'wheel', box: 'carts', boxOne: 'cart', place: 'the rail yard', machine: 'wagon' },
  { item: 'wires', itemOne: 'wire', box: 'spools', boxOne: 'spool', place: 'the electrical shop', machine: 'motor' },
  { item: 'bricks', itemOne: 'brick', box: 'pallets', boxOne: 'pallet', place: 'the bridge site', machine: 'wall' },
  { item: 'rivets', itemOne: 'rivet', box: 'bags', boxOne: 'bag', place: 'the shipyard', machine: 'hull' },
  { item: 'test tubes', itemOne: 'test tube', box: 'racks', boxOne: 'rack', place: 'the chemistry lab', machine: 'experiment' },
  { item: 'drones', itemOne: 'drone', box: 'hangars', boxOne: 'hangar', place: 'the airfield', machine: 'survey' },
];

interface Built {
  text: string; question: string; layout: string; answer: number; unit: string;
  structure: string; why: string; clues: string[]; visual: Visual; ops: WordOp[]; distractors: string[];
  /** The layout with every number labelled (display only; `layout` stays plain for the maths checks). */
  setup: string;
  /** Labelled working, one line per step, the last line ending in the labelled answer. */
  work: string[];
  /** The answer with its label. */
  result: string;
}

/* ---------- number ranges ---------- */
function addPair(rng: Rng, d: Difficulty): [number, number] {
  // Difficulty 1 is Grade 1: both numbers and the total stay within 20.
  if (d === 1) { const a = rng.int(3, 12); return [a, rng.int(2, Math.min(12, 20 - a))]; }
  if (d <= 2) return [rng.int(5, 45), rng.int(5, 45)];
  if (d <= 4) return [rng.int(20, 480), rng.int(15, 400)];
  return [rng.int(120, 880), rng.int(105, 870)];
}
function subPair(rng: Rng, d: Difficulty): [number, number] {
  if (d === 1) { const t = rng.int(9, 20); return [t, rng.int(2, t - 3)]; }
  const [a, b] = addPair(rng, d);
  const t = Math.max(a, b) + (d <= 2 ? rng.int(3, 20) : rng.int(10, 120));
  return [t, Math.min(a, b)];
}
function multPair(rng: Rng, d: Difficulty): [number, number] {
  const pair: [number, number] = d <= 2 ? [rng.int(2, 6), rng.pick([2, 3, 4, 5, 10])] : d <= 4 ? [rng.int(2, 12), rng.int(3, 12)] : [rng.int(3, 9), rng.int(12, 35)];
  // 2 × 2 = 2 + 2 and 4 ÷ 2 = 4 − 2: the only pairs where a decoy would give the right answer.
  if (pair[0] === 2 && pair[1] === 2) pair[1] = 3;
  return pair;
}
function divPair(rng: Rng, d: Difficulty): [number, number, number] {
  const [g, p] = multPair(rng, d);
  return [g * p, g, p]; // total, groups, per
}

/* ---------- decoys ---------- */
function single(op: WordOp, x: number, y: number): { layout: string; distractors: string[] } {
  const big = Math.max(x, y); const small = Math.min(x, y);
  const forms: Record<WordOp, string> = {
    add: `${x} + ${y}`, sub: `${big} − ${small}`, mult: `${x} × ${y}`, div: `${big} ÷ ${small}`,
  };
  return { layout: forms[op], distractors: (['add', 'sub', 'mult', 'div'] as WordOp[]).filter((o) => o !== op).map((o) => forms[o]) };
}

/* ---------- templates ---------- */
const bar = (parts: (number | '?')[], whole?: number | '?', labels?: string[]): Visual => ({ type: 'bar', bars: [{ parts, label: labels?.[0] }], whole });

function build(kind: WordKind, d: Difficulty, rng: Rng): Built {
  const th = rng.pick(THEMES);
  const [A, B] = rng.shuffle(NAMES).slice(0, 2);
  const it = th.item; const one = th.itemOne;
  const Place = th.place[0].toUpperCase() + th.place.slice(1);
  const items = (n: number, label: string) => labn(n, label.replace('#', one), label.replace('#', it));
  const boxes = (n: number) => labn(n, th.boxOne, th.box);
  const perBox = (n: number) => items(n, `# per ${th.boxOne}`);
  /** A single-step problem: the labelled setup and one line of working. */
  const one1 = (setup: string, result: string) => ({ setup, result, work: [`${setup} = ${result}`] });
  const op: WordKind = kind === 'mixed' ? (d >= 4 && rng.chance(0.25) ? 'twostep' : rng.pick(['add', 'sub', 'mult', 'div'] as const)) : kind;

  if (op === 'add') {
    const v = rng.int(0, d >= 3 ? 2 : 1);
    if (v === 0) {
      const [a, b] = addPair(rng, d); const s = single('add', a, b);
      return { text: `${A} has ${a} ${it}. ${B} has ${b} ${it}.`, question: `How many ${it} do they have altogether?`, ...s, answer: a + b, unit: it,
        ...one1(`${items(a, `${A}'s #`)} + ${items(b, `${B}'s #`)}`, items(a + b, '# altogether')),
        structure: 'Put together', why: `Two different amounts are put together to make one total. Putting together means ADD.`, clues: ['altogether'], visual: bar([a, b], '?'), ops: ['add'] };
    }
    if (v === 1) {
      const [a, b] = addPair(rng, d); const s = single('add', a, b);
      return { text: `${A} had ${a} ${it}. Then ${B} brought ${b} more.`, question: `How many ${it} does ${A} have now?`, ...s, answer: a + b, unit: it,
        ...one1(`${items(a, 'starting #')} + ${items(b, `# ${B} brought`)}`, items(a + b, `# ${A} has now`)),
        structure: 'Add to', why: `Start with an amount, then more is added. The amount grows, so ADD.`, clues: ['more', 'now'], visual: bar([a, b], '?'), ops: ['add'] };
    }
    const [a, b] = addPair(rng, d); const c = rng.int(10, d >= 5 ? 300 : 90);
    return { text: `${Place} used ${a} ${it} on Monday, ${b} on Tuesday and ${c} on Wednesday.`, question: `How many ${it} were used in all?`,
      layout: `${a} + ${b} + ${c}`, distractors: [`${a} + ${b} − ${c}`, `${a} × ${b} + ${c}`, `${a} − ${b} − ${c}`], answer: a + b + c, unit: it,
      ...one1(`${items(a, '# on Monday')} + ${items(b, '# on Tuesday')} + ${items(c, '# on Wednesday')}`, items(a + b + c, '# used in all')),
      structure: 'Put together', why: `Three amounts are put together into one total. Putting together means ADD (all three).`, clues: ['in all'], visual: bar([a, b, c], '?'), ops: ['add'] };
  }

  if (op === 'sub') {
    const v = rng.int(0, 2);
    if (v === 0) {
      const [t, b] = subPair(rng, d); const s = single('sub', t, b);
      return { text: `${A} had ${t} ${it}. ${A} used ${b} of them to work on the ${th.machine}.`, question: `How many ${it} are left?`, ...s, answer: t - b, unit: it,
        ...one1(`${items(t, 'starting #')} − ${items(b, '# used')}`, items(t - b, '# left')),
        structure: 'Take away', why: `Start with an amount and some is used up. What is LEFT means SUBTRACT.`, clues: ['used', 'left'], visual: bar([b, '?'], t), ops: ['sub'] };
    }
    if (v === 1) {
      const [t, b] = subPair(rng, d); const s = single('sub', t, b);
      return { text: `${A} collected ${t} ${it}. ${B} collected ${b} ${it}.`, question: `How many more ${it} did ${A} collect than ${B}?`, ...s, answer: t - b, unit: it,
        ...one1(`${items(t, `${A}'s #`)} − ${items(b, `${B}'s #`)}`, labn(t - b, `more ${one} for ${A}`, `more ${it} for ${A}`)),
        structure: 'Compare', why: `Two amounts are compared. The DIFFERENCE between them means SUBTRACT. Careful: "more" here is a comparison, not adding.`, clues: ['how many more', 'than'],
        visual: { type: 'bar', bars: [{ label: A, parts: [t] }, { label: B, parts: [b, '?'] }] }, ops: ['sub'] };
    }
    const [t, b] = subPair(rng, d); const s = single('sub', t, b);
    return { text: `The ${th.machine} needs ${t} ${it}. ${Place} has only ${b}.`, question: `How many more ${it} are still needed?`, ...s, answer: t - b, unit: it,
      ...one1(`${items(t, '# needed')} − ${items(b, '# on hand')}`, items(t - b, '# still needed')),
      structure: 'Missing part', why: `You know the total needed and one part. The missing part is total minus the part, so SUBTRACT.`, clues: ['needs', 'only', 'still needed'], visual: bar([b, '?'], t), ops: ['sub'] };
  }

  if (op === 'mult') {
    const v = rng.int(0, 3);
    const [g, p] = multPair(rng, d);
    if (v === 0) {
      const s = single('mult', g, p);
      return { text: `There are ${g} ${th.box} of ${it} in ${th.place}. Each ${th.boxOne} holds ${p} ${it}.`, question: `How many ${it} are there in all?`, ...s, answer: g * p, unit: it,
        ...one1(`${boxes(g)} × ${perBox(p)}`, items(g * p, '# in all')),
        structure: 'Equal groups', why: `Every ${th.boxOne} holds the SAME number. Equal groups × size of group = total, so MULTIPLY.`, clues: ['each', 'in all'], visual: { type: 'groups', groups: Math.min(g, 12), perGroup: Math.min(p, 12) }, ops: ['mult'] };
    }
    if (v === 1) {
      const s = single('mult', g, p);
      return { text: `${B} has ${p} ${it}. ${A} has ${g} times as many.`, question: `How many ${it} does ${A} have?`, ...s, answer: g * p, unit: it,
        ...one1(`${lab(g, 'times as many')} × ${items(p, `${B}'s #`)}`, items(g * p, `${A}'s #`)),
        structure: 'Times as many', why: `"${g} times as many" means ${lab(g, 'equal groups')} of ${items(p, `${B}'s #`)}. Equal groups means MULTIPLY.`, clues: ['times as many'], visual: { type: 'bar', bars: [{ label: B, parts: [p] }, { label: A, parts: Array(Math.min(g, 12)).fill(p) }] }, ops: ['mult'] };
    }
    if (v === 2) {
      const s = single('mult', g, p);
      return { text: `The solar array has ${g} rows. Every row has ${p} panels.`, question: `How many panels are in the array?`, ...s, answer: g * p, unit: 'panels',
        ...one1(`${labn(g, 'row')} × ${labn(p, 'panel per row', 'panels per row')}`, labn(g * p, 'panel in the array', 'panels in the array')),
        structure: 'Rows (array)', why: `Rows are equal groups: ${labn(g, 'row')} of ${labn(p, 'panel', 'panels')}. Equal groups means MULTIPLY.`, clues: ['rows', 'every'], visual: { type: 'array', rows: Math.min(g, 12), cols: Math.min(p, 12) }, ops: ['mult'] };
    }
    const s = single('mult', g, p);
    return { text: `A drone flies ${p} metres every second.`, question: `How far does it fly in ${g} seconds?`, ...s, answer: g * p, unit: 'metres',
      ...one1(`${labn(g, 'second')} × ${labn(p, 'metre per second', 'metres per second')}`, labn(g * p, 'metre flown', 'metres flown')),
      structure: 'Rate (per)', why: `${labn(p, 'metre per second', 'metres per second')} for ${labn(g, 'second')} is ${lab(g, 'equal groups')} of ${labn(p, 'metre', 'metres')}. Equal groups means MULTIPLY.`, clues: ['every second'], visual: { type: 'numberline', step: p, count: g, max: g * p }, ops: ['mult'] };
  }

  if (op === 'div') {
    const v = rng.int(0, 2);
    const [t, g, p] = divPair(rng, d);
    if (v === 0) {
      const s = single('div', t, g);
      return { text: `${t} ${it} are shared equally among ${g} ${th.box}.`, question: `How many ${it} go in each ${th.boxOne}?`, ...s, answer: p, unit: it,
        ...one1(`${items(t, 'total #')} ÷ ${boxes(g)}`, perBox(p)),
        structure: 'Fair share', why: `A total is split into ${lab(g, 'equal groups')}. Total ÷ number of groups = size of each group, so DIVIDE.`, clues: ['shared equally', 'each'], visual: { type: 'share', total: Math.min(t, 60), groups: Math.min(g, 12) }, ops: ['div'] };
    }
    if (v === 1) {
      const s = single('div', t, p);
      const mach = (n: number) => labn(n, th.machine, `${th.machine}s`);
      return { text: `${A} has ${t} ${it}. Each ${th.machine} needs ${p} ${it}.`, question: `How many ${th.machine}s can ${A} finish?`, ...s, answer: g, unit: `${th.machine}s`,
        ...one1(`${items(t, 'total #')} ÷ ${items(p, `# per ${th.machine}`)}`, mach(g)),
        structure: 'How many groups', why: `You have a total and make equal groups of ${items(p, `# per ${th.machine}`)}. Total ÷ size of group = number of groups, so DIVIDE.`, clues: ['each needs', 'how many'], visual: { type: 'share', total: Math.min(t, 60), groups: Math.min(g, 12) }, ops: ['div'] };
    }
    const s = single('div', t, g);
    return { text: `A cart travels ${t} metres in ${g} seconds at a steady speed.`, question: `How many metres does it travel each second?`, ...s, answer: p, unit: 'metres',
      ...one1(`${labn(t, 'metre travelled', 'metres travelled')} ÷ ${labn(g, 'second')}`, labn(p, 'metre per second', 'metres per second')),
      structure: 'Rate (per)', why: `"Each second" asks for the amount PER second: total ÷ seconds. Splitting a total equally means DIVIDE.`, clues: ['each second', 'per'], visual: { type: 'numberline', step: p, count: g, max: t }, ops: ['div'] };
  }

  // two-step
  const v = rng.int(0, 3);
  if (v === 0) {
    const [g, p] = multPair(rng, Math.min(4, d) as Difficulty); const c = rng.int(2, Math.max(3, g * p - 2));
    const bought = items(g * p, '# bought'); const result = items(g * p - c, '# left');
    return { text: `${A} bought ${g} ${th.box} of ${it} with ${p} in each. Then ${A} used ${c} of them.`, question: `How many ${it} are left?`,
      layout: `(${g} × ${p}) − ${c}`, distractors: [`(${g} × ${p}) + ${c}`, `(${g} + ${p}) − ${c}`, `${g} × ${p}`], answer: g * p - c, unit: it,
      setup: `(${boxes(g)} × ${perBox(p)}) − ${items(c, '# used')}`, result,
      work: [`${boxes(g)} × ${perBox(p)} = ${bought}`, `${bought} − ${items(c, '# used')} = ${result}`],
      structure: 'Equal groups, then take away', why: `First find the total: ${boxes(g)} of ${perBox(p)} are equal groups, so MULTIPLY. Then some are used, so SUBTRACT. Two steps.`, clues: ['each', 'used', 'left'], visual: bar([c, '?'], g * p), ops: ['mult', 'sub'] };
  }
  if (v === 1) {
    const [g, p] = multPair(rng, Math.min(4, d) as Difficulty); const c = rng.int(5, 60);
    const bought = items(g * p, 'new #'); const result = items(c + g * p, `# ${A} has now`);
    return { text: `${A} had ${c} ${it}. Then ${A} bought ${g} ${th.box} with ${p} ${it} in each.`, question: `How many ${it} does ${A} have now?`,
      layout: `${c} + (${g} × ${p})`, distractors: [`${c} − (${g} × ${p})`, `(${c} + ${g}) × ${p}`, `${c} + ${g} + ${p}`], answer: c + g * p, unit: it,
      setup: `${items(c, 'starting #')} + (${boxes(g)} × ${perBox(p)})`, result,
      work: [`${boxes(g)} × ${perBox(p)} = ${bought}`, `${items(c, 'starting #')} + ${bought} = ${result}`],
      structure: 'Equal groups, then add', why: `First the new ${it}: ${boxes(g)} of ${perBox(p)} are equal groups, so MULTIPLY. Then join them to what ${A} already had, so ADD.`, clues: ['each', 'now'], visual: bar([c, g * p], '?'), ops: ['mult', 'add'] };
  }
  if (v === 2) {
    const [t, g, p] = divPair(rng, Math.min(4, d) as Difficulty); const c = rng.int(2, 9);
    const share = items(p, '# per robot from sharing'); const result = items(p + c, '# per robot now');
    return { text: `${t} ${it} are shared equally among ${g} robots. Then each robot gets ${c} more.`, question: `How many ${it} does each robot have?`,
      layout: `(${t} ÷ ${g}) + ${c}`, distractors: [`(${t} ÷ ${g}) − ${c}`, `(${t} + ${c}) ÷ ${g}`, `${t} ÷ ${g}`], answer: p + c, unit: it,
      setup: `(${items(t, 'total #')} ÷ ${labn(g, 'robot')}) + ${items(c, 'extra # per robot')}`, result,
      work: [`${items(t, 'total #')} ÷ ${labn(g, 'robot')} = ${share}`, `${share} + ${items(c, 'extra # per robot')} = ${result}`],
      structure: 'Fair share, then add', why: `First share equally: total ÷ groups means DIVIDE. Then each gets more, so ADD.`, clues: ['shared equally', 'more'], visual: bar([p, c], '?'), ops: ['div', 'add'] };
  }
  const [g1, p1] = multPair(rng, Math.min(4, d) as Difficulty); const [g2, p2] = multPair(rng, Math.min(4, d) as Difficulty);
  // The second set is always bags; when the theme's containers are bags too, call them the other bags.
  const bagOne = th.box === 'bags' ? 'other bag' : 'bag'; const bagMany = th.box === 'bags' ? 'other bags' : 'bags';
  const inBoxes = items(g1 * p1, `# in the ${th.box}`); const inBags = items(g2 * p2, `# in the ${bagMany}`); const result = items(g1 * p1 + g2 * p2, '# altogether');
  const set1 = `${boxes(g1)} × ${perBox(p1)}`; const set2 = `${labn(g2, bagOne, bagMany)} × ${items(p2, `# per ${bagOne}`)}`;
  return { text: `${Place} has ${g1} ${th.box} with ${p1} ${it} in each, and ${g2} ${th.box === 'bags' ? 'more bags' : 'bags'} with ${p2} ${it} in each.`, question: `How many ${it} altogether?`,
    layout: `(${g1} × ${p1}) + (${g2} × ${p2})`, distractors: [`(${g1} + ${p1}) × (${g2} + ${p2})`, `(${g1} × ${p1}) − (${g2} × ${p2})`, `${g1} × ${p1} × ${g2} × ${p2}`], answer: g1 * p1 + g2 * p2, unit: it,
    setup: `(${set1}) + (${set2})`, result,
    work: [`${set1} = ${inBoxes}`, `${set2} = ${inBags}`, `${inBoxes} + ${inBags} = ${result}`],
    structure: 'Two sets of groups, then put together', why: `Each set is equal groups, so MULTIPLY twice. Then put the two totals together, so ADD.`, clues: ['each', 'altogether'], visual: bar([g1 * p1, g2 * p2], '?'), ops: ['mult', 'mult', 'add'] };
}

export function skillForKind(kind: WordKind): string {
  return kind === 'mixed' ? 'word' : `word.${kind}`;
}

/** Build a word problem Question. Deterministic for a given rng. */
export function wordProblem(kind: WordKind, difficulty: Difficulty, rng: Rng, skillId?: string): Question {
  const b = build(kind, difficulty, rng);
  const op = b.ops[b.ops.length - 1];
  const two = b.ops.length > 1;
  const opWord = two ? b.ops.map((o) => OP_NAME[o]).join(', then ') : OP_NAME[op];
  const clueList = b.clues.map((c) => `"${c}"`).join(', ');
  return {
    id: nextQuestionId('word'),
    masterySkillId: skillId ?? (two ? 'word.twostep' : `word.${op}`),
    topic: 'Word problems',
    subtopic: b.structure,
    difficulty,
    mode: 'applied',
    prompt: b.text,
    expression: b.question,
    answer: b.answer,
    unit: b.unit,
    hint: `Clue words: ${clueList}. Structure: ${b.structure.toLowerCase()} → ${opWord.toLowerCase()}.`,
    solutionSteps: [`${b.structure} → ${opWord}.`, ...b.work.map((w) => `${w}.`)],
    explanation: [b.why, `Set it up: ${b.setup}`, ...b.work.map((w, i) => (i === 0 ? `Work it out: ${w}` : w))],
    visual: b.visual,
    prerequisites: two ? ['mult', 'add.basic', 'sub.basic', 'div'] : op === 'add' ? ['add.basic'] : op === 'sub' ? ['sub.basic'] : op === 'mult' ? ['mult'] : ['div'],
    engineeringApplication: 'Engineers turn real situations into math setups before they calculate anything.',
    word: { op, ops: b.ops, layout: b.layout, structure: b.structure, why: b.why, clues: b.clues, distractors: b.distractors, setup: b.setup, result: b.result },
  };
}

/** Generator: params.op = add | sub | mult | div | twostep | mixed. */
export const genWord: Generator = (skillId, params, ctx) => {
  const kind = (params?.op as WordKind | undefined) ?? 'mixed';
  const d = kind === 'twostep' ? (Math.max(3, ctx.difficulty) as Difficulty) : ctx.difficulty;
  return wordProblem(kind, d, ctx.rng, skillId);
};
