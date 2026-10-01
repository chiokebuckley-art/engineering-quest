import { genAcademy } from '../academy/generator';
import type { Difficulty, MasteryRecord, Question, SkillId, FactId } from '../types';
import type { GenContext, Generator } from './context';
import { skillById } from '../curriculum/skills';
import { createRng, type Rng } from '../rng';
import { genMultApplied, genMultMissing, genMultMixed, genMultMultistep, genMultTable } from './multiplication';
import { genDivApplied, genDivMixed, genDivTable } from './division';
import { genAdd, genSub } from './arithmetic';
import { genBonds } from './bonds';
import { genOneStep, genEvaluate } from './algebra';
import { genWord } from './wordproblems';
import { genTricks } from './tricks';
import { genMental } from './mental';
import { genOdds } from './odds';
import { genVolume } from './volume';
import { genMeasure } from './measure';
import { genGeo } from './geo';
import { genRates } from './rates';
import { genFit } from './fit';
import { genPhys } from './phys';
import { genPipe } from './pipe';
import { genProb } from './prob';
import { genSpiral } from './spiral';
import { genPrecalc } from './precalc';
import { genMentalMath } from './mentalmath';
import { genPattern } from './patterns';
import { genBlocks } from './spatialBlocks';
import { genPaths } from './countingPaths';
import { genData } from './dataLite';
import { genLogic } from './logicLite';
import { genPctMulti } from './percentMulti';
import { genGrid } from './gridShapes';

export type { GenContext } from './context';

const REGISTRY: Record<string, Generator> = {
  academy: genAcademy,
  'mult.table': genMultTable,
  'mult.mixed': genMultMixed,
  'mult.missing': genMultMissing,
  'mult.applied': genMultApplied,
  'mult.multistep': genMultMultistep,
  'div.table': genDivTable,
  'div.mixed': genDivMixed,
  'div.applied': genDivApplied,
  bonds: genBonds,
  'alg.onestep': genOneStep,
  'alg.evaluate': genEvaluate,
  word: genWord,
  tricks: genTricks,
  mental: genMental,
  volume: genVolume,
  measure: genMeasure,
  geo: genGeo,
  rates: genRates,
  fit: genFit,
  phys: genPhys,
  pipe: genPipe,
  prob: genProb,
  spiral: genSpiral,
  precalc: genPrecalc,
  mentalmath: genMentalMath,
  odds: genOdds,
  'add.basic': genAdd,
  'sub.basic': genSub,
  pattern: genPattern,
  blocks: genBlocks,
  paths: genPaths,
  data: genData,
  logic: genLogic,
  pctmulti: genPctMulti,
  grid: genGrid,
};

export interface GenerateOptions {
  difficulty?: Difficulty;
  rng?: Rng;
  recentFacts?: FactId[];
  now?: number;
  applied?: boolean;
}

/**
 * QuestionGenerator entry point. Produces an essentially unlimited stream of
 * questions for any implemented skill, weighted toward the player's weak facts.
 */
export function generateQuestion(skillId: SkillId, mastery: Record<string, MasteryRecord>, opts: GenerateOptions = {}): Question {
  const skill = skillById(skillId);
  if (!skill) throw new Error(`Unknown skill ${skillId}`);
  const gen = REGISTRY[skill.generator];
  if (!gen) throw new Error(`Skill ${skillId} has no generator yet`);
  const ctx: GenContext = {
    rng: opts.rng ?? createRng(),
    difficulty: opts.difficulty ?? 2,
    mastery,
    recentFacts: opts.recentFacts ?? [],
    now: opts.now ?? Date.now(),
    applied: opts.applied,
  };
  return gen(skillId, skill.generatorParams, ctx);
}

/** Generate a question from one of several skills (e.g. an enemy that draws from ×3 and ×4). */
export function generateFromSkills(skillIds: SkillId[], mastery: Record<string, MasteryRecord>, opts: GenerateOptions = {}): Question {
  const rng = opts.rng ?? createRng();
  const usable = skillIds.filter((s) => { const sk = skillById(s); return sk && REGISTRY[sk.generator]; });
  const pick = usable.length ? rng.pick(usable) : 'mult';
  return generateQuestion(pick, mastery, { ...opts, rng });
}

/** Regenerate a question that tests a specific fact id (used by the review dungeon). */
export function questionForFact(factId: FactId, mastery: Record<string, MasteryRecord>, opts: GenerateOptions = {}): Question | undefined {
  const m = /^fact:mult:(\d+)x(\d+)$/.exec(factId);
  if (m) {
    const t = Number(m[1]);
    // Ask repeatedly until the weighted picker lands on this fact (bounded), else force it.
    for (let i = 0; i < 20; i++) {
      const q = generateQuestion(`mult.${t}`, mastery, { ...opts, difficulty: opts.difficulty ?? 2 });
      if (q.factId === factId) return q;
    }
    const forced: Record<string, MasteryRecord> = { ...mastery };
    for (const k of Object.keys(forced)) if (k !== factId && k.startsWith('fact:mult:')) forced[k] = { ...forced[k], mastery: 100, attempts: 50, history: [1, 1, 1, 1, 1, 1], srs: { ...forced[k].srs, dueAt: Number.MAX_SAFE_INTEGER } };
    for (let i = 0; i < 40; i++) {
      const q = generateQuestion(`mult.${t}`, forced, { ...opts, difficulty: 2 });
      if (q.factId === factId) return q;
    }
  }
  const bd = /^fact:bond:(\d+):(\d+)$/.exec(factId);
  if (bd) {
    const t = Number(bd[1]);
    for (let i = 0; i < 40; i++) {
      const q = generateQuestion(`bonds.${t}`, mastery, { ...opts, difficulty: 2 });
      if (q.factId === factId) return q;
    }
  }
  const d = /^fact:div:(\d+)\/(\d+)$/.exec(factId);
  if (d) {
    const divisor = Number(d[2]);
    for (let i = 0; i < 40; i++) {
      const q = generateQuestion(`div.${divisor}`, mastery, { ...opts, difficulty: 2 });
      if (q.factId === factId) return q;
    }
  }
  return undefined;
}

/** Numeric answer checking: accepts "56", " 56 ", "56 bolts", "1,200". */
/** The answer as it should be shown: 5/6 rather than 0.8333, −3 rather than -3. */
export const answerLabel = (q: Pick<Question, 'answer' | 'answerText'>): string => q.answerText ?? String(q.answer);

/** Parse what was typed: a number, or a fraction `a/b` (also `-a/b`, `1 1/2`). */
export function parseGiven(given: string): number | null {
  const g = given.replace(/,/g, '').replace(/[−–]/g, '-').trim();
  const frac = /^(-)?\s*(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/.exec(g);
  if (frac) { const d = Number(frac[4]); if (!d) return null; const v = Number(frac[2] ?? 0) + Number(frac[3]) / d; return frac[1] ? -v : v; }
  const m = g.match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const v = Number(m[0]);
  return Number.isFinite(v) ? v : null;
}

export function checkAnswer(question: Question, given: string): boolean {
  const value = parseGiven(given);
  if (value === null) return false;
  if (question.allowFraction && Math.abs(value - question.answer) < 1e-6) return true;
  if (Math.abs(value - question.answer) < 1e-9) return true;
  if (question.tolerance && Math.abs(value - question.answer) <= question.tolerance + 1e-9) return true;
  return (question.acceptable ?? []).some((a) => Math.abs(value - a) < 1e-9);
}

export function hasGenerator(skillId: SkillId): boolean {
  const s = skillById(skillId);
  return !!s && !!REGISTRY[s.generator];
}
