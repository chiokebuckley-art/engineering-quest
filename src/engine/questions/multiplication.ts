import type { Difficulty, Question } from '../types';
import type { GenContext, Generator } from './context';
import { nextQuestionId } from './context';
import { multFactId, parseMultFact, tableFacts } from '../curriculum/facts';
import { pickFact } from '../srs/SpacedRepetitionEngine';
import { pickScenario, type Scenario } from './applied';
import { lab, labn, unit } from '../label';

const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
/** How many of the repeated number a partial product holds: 7 × 5 → '35 (five sevens)', 7 × 1 → '7 (one seven)'. */
const groupsOf = (count: number, of: number) => {
  const c = NUM_WORDS[count]; const w = NUM_WORDS[of];
  if (!c || !w) return 'groups';
  return count === 1 ? `${c} ${w}` : `${c} ${w === 'six' ? 'sixes' : `${w}s`}`;
};

/** Fluency strategies, chosen per fact, used in hints and explanations. Partial products carry how many groups they hold. */
export function multStrategy(a: number, b: number): string[] {
  const [s, l] = a <= b ? [a, b] : [b, a];
  const out: string[] = [];
  const g = (n: number, count: number) => lab(n, groupsOf(count, l));
  if (s === 1) out.push(`Anything × 1 is itself: ${l} × 1 = ${l}.`);
  else if (s === 2) out.push(`×2 means double: ${l} + ${l} = ${2 * l}.`);
  else if (s === 10) out.push(`×10 shifts the digit one place left: ${l} → ${l}0.`);
  else if (s === 5) out.push(`×5 is half of ×10: ${l} × 10 = ${g(l * 10, 10)}, half of that is ${g(l * 5, 5)}.`);
  else if (s === 4) out.push(`×4 is double-double: ${l} → ${g(2 * l, 2)} → ${g(4 * l, 4)}.`);
  else if (s === 8) out.push(`×8 is double three times: ${l} → ${g(2 * l, 2)} → ${g(4 * l, 4)} → ${g(8 * l, 8)}.`);
  else if (s === 9) out.push(`×9 is ×10 minus one group: ${l} × 10 = ${g(l * 10, 10)}, minus ${g(l, 1)} = ${g(9 * l, 9)}.`);
  else if (s === 3) out.push(`×3 is double plus one more group: ${g(2 * l, 2)} + ${g(l, 1)} = ${g(3 * l, 3)}.`);
  else if (s === 6) out.push(`×6 is ×5 plus one more group: ${g(5 * l, 5)} + ${g(l, 1)} = ${g(6 * l, 6)}. Or double ×3: ${g(3 * l, 3)} × 2.`);
  else if (s === 7) out.push(`×7 is ×5 plus ×2: ${g(5 * l, 5)} + ${g(2 * l, 2)} = ${g(7 * l, 7)}.`);
  else if (s === 11) out.push(l <= 9 ? `×11 repeats the digit: ${l} × 11 = ${l}${l}.` : `×11 is ×10 plus one group: ${g(l * 10, 10)} + ${g(l, 1)} = ${g(11 * l, 11)}.`);
  else if (s === 12) out.push(`×12 is ×10 plus ×2: ${g(l * 10, 10)} + ${g(2 * l, 2)} = ${g(12 * l, 12)}.`);
  if (s !== l) out.push(`Order doesn't matter: ${s} × ${l} = ${l} × ${s}: turn the array on its side.`);
  return out;
}

/** Labels for a story's numbers: how many groups, how much in each, and the total. */
export interface GroupLabels { groups: [string, string]; per: string; total: string }
/** 'support assemblies' → 'support assembly'. */
export const singular = (noun: string) => noun.replace(/ies$/, 'y').replace(/s$/, '');
/** The labels for a multiplication/division scenario: 6 (support assemblies) × 8 (bolts per support assembly) = 48 (total bolts). */
export const scenarioLabels = (sc: Scenario): GroupLabels => ({ groups: [singular(sc.groupNoun), sc.groupNoun], per: `${sc.itemNoun} per ${singular(sc.groupNoun)}`, total: `total ${sc.itemNoun}` });

export function multExplanation(a: number, b: number, labels?: GroupLabels): string[] {
  const groups = Array.from({ length: a }, () => String(b)).join(' + ');
  if (labels) {
    const A = labn(a, ...labels.groups); const B = lab(b, labels.per); const T = lab(a * b, labels.total);
    return [
      `Multiplication counts equal groups: ${A} with ${B}.`,
      a <= 6 ? `Add the groups: ${groups} = ${T}.` : `Skip-count by ${B}: ${Array.from({ length: a }, (_, i) => (i + 1) * b).join(', ')}.`,
      `Picture an array with ${a} rows of ${b} dots. The total number of dots is the product.`,
      ...multStrategy(a, b),
      `So ${A} × ${B} = ${T}.`,
    ];
  }
  return [
    `Multiplication counts equal groups. ${a} × ${b} means ${a} groups with ${b} in each group.`,
    a <= 6 ? `Add the groups: ${groups} = ${a * b}.` : `Adding ${a} groups of ${b} gives ${a * b}. Skip-counting by ${b}: ${Array.from({ length: a }, (_, i) => (i + 1) * b).join(', ')}.`,
    `Picture an array with ${a} rows of ${b} dots. The total number of dots is the product: ${a * b}.`,
    ...multStrategy(a, b),
    `So ${a} × ${b} = ${a * b}.`,
  ];
}

function baseQuestion(a: number, b: number, skillId: string, difficulty: Difficulty, ctx: GenContext): Question {
  const answer = a * b;
  return {
    id: nextQuestionId('mult'),
    masterySkillId: skillId,
    factId: multFactId(a, b),
    topic: 'Multiplication',
    subtopic: `×${Math.min(a, b)} facts`,
    difficulty,
    mode: 'pure',
    prompt: `Compute ${a} × ${b}.`,
    expression: `${a} × ${b} = ?`,
    answer,
    hint: multStrategy(a, b)[0] ?? `Think of ${a} rows of ${b}.`,
    solutionSteps: [`${a} × ${b} means ${a} groups of ${b}.`, `${a} × ${b} = ${answer}.`],
    explanation: multExplanation(a, b),
    visual: { type: 'array', rows: a, cols: b },
    prerequisites: ['add.basic'],
    engineeringApplication: ctx.rng.pick([
      'Counting identical parts across identical assemblies.',
      'Scaling a recipe, a load or a batch by a whole number.',
      'Area of a rectangular plate: rows × columns of unit squares.',
    ]),
  };
}

/** A plain fact question, deterministic for a given rng (used by seeded versus rounds). */
export function pureMultQuestion(a: number, b: number, rng: GenContext['rng']): Question {
  const [x, y] = rng.chance(0.5) ? [a, b] : [b, a];
  const ctx: GenContext = { rng, difficulty: 2, mastery: {}, recentFacts: [], now: 0 };
  return baseQuestion(x, y, `mult.${Math.min(a, b)}`, 2, ctx);
}

/** Ask a fact from a table; orientation varies so both 6×7 and 7×6 are seen. */
function orient(fid: string, rng: GenContext['rng'], table?: number): [number, number] {
  const f = parseMultFact(fid)!;
  if (table !== undefined && (f.a === table || f.b === table)) {
    const other = f.a === table ? f.b : f.a;
    return rng.chance(0.6) ? [table, other] : [other, table];
  }
  return rng.chance(0.5) ? [f.a, f.b] : [f.b, f.a];
}

export const genMultTable: Generator = (skillId, params, ctx) => {
  const table = Number(params?.table ?? 2);
  const facts = tableFacts(table);
  // Difficulty 1: small factors only; 2+: full table.
  const pool = ctx.difficulty <= 1 ? facts.filter((f) => parseMultFact(f)!.b <= 6) : facts;
  const fid = pickFact(pool, ctx.mastery, ctx.rng, ctx.recentFacts, ctx.now);
  const [a, b] = orient(fid, ctx.rng, table);
  if (ctx.difficulty >= 4 && ctx.rng.chance(0.35)) return missingFactor(a, b, skillId, ctx);
  if (ctx.difficulty >= 5 && ctx.rng.chance(0.4)) return appliedProblem(a, b, skillId, ctx);
  return baseQuestion(a, b, skillId, ctx.difficulty, ctx);
}

export const genMultMixed: Generator = (skillId, params, ctx) => {
  const tables = (params?.tables as number[] | undefined) ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const facts = Array.from(new Set(tables.flatMap((t) => tableFacts(t))));
  const pool = ctx.difficulty <= 1 ? facts.filter((f) => { const p = parseMultFact(f)!; return p.a <= 5 && p.b <= 10; }) : facts;
  const fid = pickFact(pool, ctx.mastery, ctx.rng, ctx.recentFacts, ctx.now);
  const [a, b] = orient(fid, ctx.rng);
  if (ctx.difficulty >= 4 && ctx.rng.chance(0.3)) return missingFactor(a, b, skillId, ctx);
  if (ctx.difficulty >= 5 && ctx.rng.chance(0.35)) return appliedProblem(a, b, skillId, ctx);
  if (ctx.difficulty >= 6 && ctx.rng.chance(0.3)) return multiStep(a, b, skillId, ctx);
  return baseQuestion(a, b, skillId, Math.min(3, ctx.difficulty) as Difficulty, ctx);
};

export function missingFactor(a: number, b: number, skillId: string, ctx: GenContext): Question {
  const product = a * b;
  const knownFirst = ctx.rng.chance(0.5);
  const expression = knownFirst ? `${a} × ? = ${product}` : `? × ${b} = ${product}`;
  const answer = knownFirst ? b : a;
  const known = knownFirst ? a : b;
  return {
    id: nextQuestionId('mult-missing'),
    masterySkillId: skillId === 'mult.missing' ? skillId : 'mult.missing',
    factId: multFactId(a, b),
    topic: 'Multiplication',
    subtopic: 'Missing factor',
    difficulty: 4,
    mode: 'pure',
    prompt: `Find the missing factor: ${expression}`,
    expression,
    answer,
    hint: `Ask: ${known} times WHAT gives ${product}? Skip-count by ${known}: ${Array.from({ length: Math.min(answer, 12) }, (_, i) => (i + 1) * known).join(', ')}.`,
    solutionSteps: [
      `A missing factor is a division in disguise: ${product} ÷ ${known} = ?`,
      `${known} × ${lab(answer, 'missing factor')} = ${product}, so the missing factor is ${answer}.`,
    ],
    explanation: [
      `The equation ${expression} asks how many groups of ${known} make ${product}.`,
      `That is exactly what division means: ${lab(product, 'product')} ÷ ${lab(known, 'known factor')} = ${lab(answer, 'missing factor')}.`,
      `Check by multiplying back: ${known} × ${answer} = ${product}. ✓`,
      'Later, in algebra, this "?" becomes a letter like x — and you are already solving equations.',
    ],
    visual: { type: 'array', rows: knownFirst ? a : answer, cols: knownFirst ? answer : b },
    prerequisites: ['mult'],
    engineeringApplication: 'Working backwards from a total to a per-unit value — e.g. how many panels are needed for a target power.',
  };
}

export function appliedProblem(a: number, b: number, skillId: string, ctx: GenContext): Question {
  const sc = pickScenario(ctx.rng);
  const groups = a;
  const per = b;
  const answer = groups * per;
  const L = scenarioLabels(sc);
  const G = labn(groups, ...L.groups); const P = lab(per, L.per); const T = lab(answer, L.total);
  return {
    id: nextQuestionId('mult-applied'),
    masterySkillId: skillId === 'mult.applied' || skillId.startsWith('mult.') ? (skillId.startsWith('mult.') && /^mult\.\d+$/.test(skillId) ? skillId : 'mult.applied') : 'mult.applied',
    factId: multFactId(a, b),
    topic: 'Multiplication',
    subtopic: 'Applied problem',
    difficulty: 5,
    mode: 'applied',
    prompt: sc.build(groups, per),
    expression: `${groups} × ${per} = ?`,
    answer,
    unit: sc.unit,
    hint: `${groups} ${unit(groups, ...L.groups)}, ${per} ${sc.itemNoun} each → multiply: ${G} × ${P}.`,
    solutionSteps: [
      `Identify the groups: ${G}.`,
      `Identify the size of each group: ${P}.`,
      `Total = groups × size: ${G} × ${P} = ${T}.`,
    ],
    explanation: [
      `"Each" is the signal word for multiplication: the same amount repeated for every group.`,
      ...multExplanation(groups, per, L),
      `Answer: ${answer} ${sc.unit}. ${sc.verb}`,
    ],
    visual: { type: 'groups', groups, perGroup: per },
    prerequisites: ['mult'],
    engineeringApplication: sc.application,
  };
}

export function multiStep(a: number, b: number, _skillId: string, ctx: GenContext): Question {
  const sc = pickScenario(ctx.rng);
  const total = a * b;
  const variant = ctx.rng.int(0, 2);
  const L = scenarioLabels(sc);
  const A = labn(a, ...L.groups); const B = lab(b, L.per);
  const item = sc.itemNoun;
  if (variant === 0) {
    const have = ctx.rng.int(1, Math.max(1, total - 1));
    const answer = total - have;
    return {
      id: nextQuestionId('mult-multi'),
      masterySkillId: 'mult.multistep',
      factId: multFactId(a, b),
      topic: 'Multiplication', subtopic: 'Multi-step', difficulty: 6, mode: 'applied',
      prompt: `${sc.build(a, b)} You already have ${have} ${sc.itemNoun} in stock. How many more do you need?`,
      expression: `${a} × ${b} − ${have} = ?`,
      answer, unit: sc.unit,
      hint: `First find the total needed: ${A} × ${B}. Then subtract the ${have} ${item} you already have.`,
      solutionSteps: [`Total needed: ${A} × ${B} = ${lab(total, `${item} needed`)}.`, `Already in stock: ${lab(have, `${item} in stock`)}.`, `Still needed: ${lab(total, `${item} needed`)} − ${lab(have, `${item} in stock`)} = ${lab(answer, `${item} still to get`)}.`],
      explanation: ['Multi-step problems chain operations. Hold the intermediate result.', `Step 1 — multiply: ${A} × ${B} = ${lab(total, `${item} needed`)}.`, `Step 2 — subtract stock: ${lab(total, `${item} needed`)} − ${lab(have, `${item} in stock`)} = ${lab(answer, `${item} still to get`)}.`],
      visual: { type: 'groups', groups: a, perGroup: b },
      prerequisites: ['mult.applied', 'sub.basic'],
      engineeringApplication: 'Procurement: requirement minus inventory equals the purchase order.',
    };
  }
  if (variant === 1) {
    const extra = ctx.rng.int(2, 12);
    const answer = total + extra;
    return {
      id: nextQuestionId('mult-multi'),
      masterySkillId: 'mult.multistep',
      factId: multFactId(a, b),
      topic: 'Multiplication', subtopic: 'Multi-step', difficulty: 6, mode: 'applied',
      prompt: `${sc.build(a, b)} The foreman also wants ${extra} spare ${sc.itemNoun}. How many in total?`,
      expression: `${a} × ${b} + ${extra} = ?`,
      answer, unit: sc.unit,
      hint: `Multiply first: ${A} × ${B}. Then add the ${extra} spares.`,
      solutionSteps: [`${A} × ${B} = ${lab(total, `${item} for the job`)}.`, `${lab(total, `${item} for the job`)} + ${lab(extra, `spare ${item}`)} = ${lab(answer, `total ${item}`)}.`],
      explanation: ['Order of operations: multiplication before addition.', `${A} × ${B} = ${lab(total, `${item} for the job`)}, then ${lab(total, `${item} for the job`)} + ${lab(extra, `spare ${item}`)} = ${lab(answer, `total ${item}`)}.`],
      visual: { type: 'groups', groups: a, perGroup: b },
      prerequisites: ['mult.applied', 'add.basic'],
      engineeringApplication: 'Engineers always add a safety margin of spares.',
    };
  }
  const c = ctx.rng.int(2, 9);
  const d = ctx.rng.int(2, 9);
  const answer = total + c * d;
  return {
    id: nextQuestionId('mult-multi'),
    masterySkillId: 'mult.multistep',
    factId: multFactId(a, b),
    topic: 'Multiplication', subtopic: 'Multi-step', difficulty: 6, mode: 'applied',
    prompt: `Two deliveries arrive at ${sc.site}: ${a} ${unit(a, ...L.groups)} with ${b} ${sc.itemNoun} each, and ${c} more with ${d} each. How many ${sc.itemNoun} arrived in total?`,
    expression: `${a} × ${b} + ${c} × ${d} = ?`,
    answer, unit: sc.unit,
    hint: `Work out each delivery separately, then add: (${a} × ${b}) + (${c} × ${d}).`,
    solutionSteps: [`First delivery: ${A} × ${B} = ${lab(total, `${item} in the first delivery`)}.`, `Second delivery: ${labn(c, ...L.groups)} × ${lab(d, L.per)} = ${lab(c * d, `${item} in the second delivery`)}.`, `Total: ${lab(total, 'first delivery')} + ${lab(c * d, 'second delivery')} = ${lab(answer, `total ${item}`)}.`],
    explanation: ['Each multiplication is a separate group count; the sum combines them.', `${lab(total, 'first delivery')} + ${lab(c * d, 'second delivery')} = ${lab(answer, `total ${item}`)}.`],
    visual: { type: 'none' },
    prerequisites: ['mult.applied', 'add.basic'],
    engineeringApplication: 'Bills of materials sum several product lines.',
  };
}

export const genMultMissing: Generator = (skillId, _params, ctx) => {
  const facts = Array.from(new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].flatMap((t) => tableFacts(t))));
  const fid = pickFact(facts, ctx.mastery, ctx.rng, ctx.recentFacts, ctx.now);
  const f = parseMultFact(fid)!;
  return missingFactor(f.a, f.b, skillId, ctx);
};

export const genMultApplied: Generator = (skillId, _params, ctx) => {
  const facts = Array.from(new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].flatMap((t) => tableFacts(t))));
  const fid = pickFact(facts, ctx.mastery, ctx.rng, ctx.recentFacts, ctx.now);
  const f = parseMultFact(fid)!;
  const [a, b] = ctx.rng.chance(0.5) ? [f.a, f.b] : [f.b, f.a];
  return appliedProblem(a, b, skillId, ctx);
};

export const genMultMultistep: Generator = (skillId, _params, ctx) => {
  const facts = Array.from(new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].flatMap((t) => tableFacts(t))));
  const fid = pickFact(facts, ctx.mastery, ctx.rng, ctx.recentFacts, ctx.now);
  const f = parseMultFact(fid)!;
  return multiStep(f.a, f.b, skillId, ctx);
};
