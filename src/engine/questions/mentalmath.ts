import type { Difficulty, Question } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { nextQuestionId } from './context';
import { MM_SKILLS, mmSkill } from '../mentalmath/curriculum';
import { generateForSkill, type MMLevel, type MMProblem } from '../mentalmath/generator';
import { OP_SIGN, stepText } from '../mentalmath/strategies';

/**
 * Bridge from the Mental Math Academy into the rest of the game: an academy problem expressed as a
 * standard `Question`, so the arcade, versus rounds, the Stud and Weakest Gear tables, the notebook,
 * mastery and spaced repetition all work with mental-math problems without special cases.
 */
export function questionFromProblem(p: MMProblem): Question {
  const expr = p.op === 'none' ? `${p.prompt} = ?` : `${p.prompt} = ?`;
  // A number-sense fact ("what is the 3 worth in 4382?") explains itself in its note; a strategy shows each step.
  const steps = p.op === 'none' ? p.strategy.steps.map((s) => s.note ?? `${s.label}: ${s.to}`) : p.strategy.steps.map((s, i, all) => stepText(s, i === all.length - 1));
  return {
    id: nextQuestionId('mm'), masterySkillId: p.skillId, topic: 'Mental math', subtopic: p.strategy.name,
    difficulty: Math.min(6, Math.max(1, p.size + (p.op === 'mul' ? 2 : 0))) as Difficulty,
    mode: p.ask ? 'applied' : 'pure',
    prompt: p.ask ?? '', expression: expr, answer: p.answer,
    hint: p.strategy.steps[0] ? `${p.strategy.name}: start with ${p.strategy.steps[0].label}.` : p.strategy.when,
    solutionSteps: steps, explanation: p.op === 'none' ? [`${p.strategy.name}.`, ...steps, `So the answer is ${p.answer}.`] : [`${p.strategy.name}: ${p.strategy.why}`, ...steps, `So ${p.prompt} = ${p.answer}.`],
    visual: p.strategy.visual, prerequisites: [],
    engineeringApplication: 'Engineers estimate and check in their heads all day; paper is for the record, not the thinking.',
  };
}

/** Generator entry: params.skill selects the academy skill, otherwise a mixed mental problem. */
export const genMentalMath: Generator = (skillId, params, ctx) => {
  const id = String(params?.skill ?? skillId ?? 'mm.add2.chunks');
  const sk = mmSkill(id) ? id : 'mm.mixed';
  const level = Math.min(6, Math.max(1, ctx.difficulty)) as MMLevel;
  return questionFromProblem(generateForSkill(sk, level, ctx.rng));
};

/** A mental-math question for an arcade selection such as `mm:add2` or `mm:all`. */
export function mentalArcadeQuestion(group: string, difficulty: Difficulty, rng: Rng): Question {
  const pool = MM_SKILLS.filter((s) => {
    if (group === 'all') return s.world >= 2 && s.world <= 8;
    if (group === 'add') return s.op === 'add' && s.world >= 2;
    if (group === 'sub') return s.op === 'sub';
    if (group === 'mul') return s.op === 'mul' && s.world >= 6;
    if (group === 'bonds') return s.world === 1;
    return s.id === group;
  });
  const list = pool.length ? pool : MM_SKILLS.filter((s) => s.world === 2);
  const sk = list[Math.floor(rng.next() * list.length)] ?? list[0];
  return questionFromProblem(generateForSkill(sk.id, Math.min(6, Math.max(1, difficulty)) as MMLevel, rng));
}

export const MM_ARCADE_GROUPS: { id: string; label: string; short: string }[] = [
  { id: 'all', label: 'Everything mental', short: 'All' },
  { id: 'add', label: 'Mental addition', short: 'Add' },
  { id: 'sub', label: 'Mental subtraction', short: 'Sub' },
  { id: 'mul', label: 'Mental multiplication', short: 'Mul' },
  { id: 'bonds', label: 'Number building', short: 'Bonds' },
];
export { OP_SIGN };
