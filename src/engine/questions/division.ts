import type { Difficulty, Question } from '../types';
import type { GenContext, Generator } from './context';
import { nextQuestionId } from './context';
import { divFactId, divisionTableFacts, parseDivFact } from '../curriculum/facts';
import { pickFact } from '../srs/SpacedRepetitionEngine';
import { pickScenario } from './applied';
import { multStrategy, scenarioLabels, type GroupLabels } from './multiplication';
import { lab, labn } from '../label';

export function divExplanation(dividend: number, divisor: number, labels?: GroupLabels): string[] {
  const q = dividend / divisor;
  if (labels) {
    const T = lab(dividend, labels.total); const G = labn(divisor, ...labels.groups); const Q = lab(q, labels.per);
    return [
      `Division shares a total equally: ${T} shared among ${G}. How many does each get?`,
      `Division undoes multiplication. Find the multiplication fact: ${divisor} × ? = ${dividend}.`,
      ...multStrategy(divisor, q).slice(0, 1),
      `${G} × ${Q} = ${T}, so ${T} ÷ ${G} = ${Q}.`,
      `Check: ${q} × ${divisor} = ${dividend}. ✓`,
    ];
  }
  return [
    `Division asks: how many groups of ${divisor} fit inside ${dividend}? Or: if ${dividend} is shared equally among ${divisor}, how many does each get?`,
    `Division undoes multiplication. Find the multiplication fact: ${divisor} × ? = ${dividend}.`,
    ...multStrategy(divisor, q).slice(0, 1),
    `${divisor} × ${q} = ${dividend}, so ${dividend} ÷ ${divisor} = ${q}.`,
    `Check: ${q} × ${divisor} = ${dividend}. ✓`,
  ];
}

export function pureDivQuestion(dividend: number, divisor: number): Question {
  return base(dividend, divisor, `div.${divisor}`, 2);
}

function base(dividend: number, divisor: number, skillId: string, difficulty: Difficulty): Question {
  const answer = dividend / divisor;
  return {
    id: nextQuestionId('div'),
    masterySkillId: skillId,
    factId: divFactId(dividend, divisor),
    topic: 'Division',
    subtopic: `÷${divisor} facts`,
    difficulty,
    mode: 'pure',
    prompt: `Compute ${dividend} ÷ ${divisor}.`,
    expression: `${dividend} ÷ ${divisor} = ?`,
    answer,
    hint: `Think multiplication: ${divisor} × ? = ${dividend}. Skip-count by ${divisor}.`,
    solutionSteps: [`${divisor} × ${lab(answer, 'missing factor')} = ${dividend}.`, `So ${dividend} ÷ ${divisor} = ${answer}.`],
    explanation: divExplanation(dividend, divisor),
    visual: { type: 'share', total: dividend, groups: divisor },
    prerequisites: [`mult.${divisor}`],
    engineeringApplication: 'Splitting a total load evenly across supports, cells or channels.',
  };
}

export function appliedDivision(dividend: number, divisor: number, skillId: string, ctx: GenContext): Question {
  const sc = pickScenario(ctx.rng);
  const answer = dividend / divisor;
  const L = scenarioLabels(sc);
  const T = lab(dividend, L.total); const G = labn(divisor, ...L.groups); const Q = lab(answer, L.per);
  return {
    id: nextQuestionId('div-applied'),
    masterySkillId: /^div\.\d+$/.test(skillId) ? skillId : 'div.applied',
    factId: divFactId(dividend, divisor),
    topic: 'Division', subtopic: 'Applied problem', difficulty: 5, mode: 'applied',
    prompt: sc.share(dividend, divisor),
    expression: `${dividend} ÷ ${divisor} = ?`,
    answer,
    unit: sc.itemNoun.split(' ')[0] === 'metres' || sc.unit.length <= 3 ? sc.unit : sc.itemNoun,
    hint: `A total shared equally among ${divisor} ${sc.groupNoun} → divide: ${T} ÷ ${G}.`,
    solutionSteps: [`Total: ${T}. Groups: ${G}.`, `Per group = total ÷ groups: ${T} ÷ ${G} = ${Q}.`],
    explanation: ['"Shared equally" / "evenly" signals division.', ...divExplanation(dividend, divisor, L)],
    visual: { type: 'share', total: dividend, groups: divisor },
    prerequisites: ['div'],
    engineeringApplication: sc.application,
  };
}

export const genDivTable: Generator = (skillId, params, ctx) => {
  const divisor = Number(params?.divisor ?? 2);
  const facts = divisionTableFacts(divisor);
  const pool = ctx.difficulty <= 1 ? facts.filter((f) => parseDivFact(f)!.dividend / divisor <= 6) : facts;
  const fid = pickFact(pool, ctx.mastery, ctx.rng, ctx.recentFacts, ctx.now);
  const f = parseDivFact(fid)!;
  if (ctx.difficulty >= 5 && ctx.rng.chance(0.4)) return appliedDivision(f.dividend, f.divisor, skillId, ctx);
  return base(f.dividend, f.divisor, skillId, ctx.difficulty);
};

export const genDivMixed: Generator = (skillId, params, ctx) => {
  const divisors = (params?.divisors as number[] | undefined) ?? [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const facts = divisors.flatMap((d) => divisionTableFacts(d));
  const pool = ctx.difficulty <= 1 ? facts.filter((f) => { const p = parseDivFact(f)!; return p.divisor <= 5 && p.dividend / p.divisor <= 10; }) : facts;
  const fid = pickFact(pool, ctx.mastery, ctx.rng, ctx.recentFacts, ctx.now);
  const f = parseDivFact(fid)!;
  if (ctx.difficulty >= 5 && ctx.rng.chance(0.4)) return appliedDivision(f.dividend, f.divisor, skillId, ctx);
  return base(f.dividend, f.divisor, skillId, Math.min(3, ctx.difficulty) as Difficulty);
};

export const genDivApplied: Generator = (skillId, _params, ctx) => {
  const facts = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].flatMap((d) => divisionTableFacts(d));
  const fid = pickFact(facts, ctx.mastery, ctx.rng, ctx.recentFacts, ctx.now);
  const f = parseDivFact(fid)!;
  return appliedDivision(f.dividend, f.divisor, skillId, ctx);
};
