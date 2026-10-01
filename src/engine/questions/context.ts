import type { Difficulty, FactId, MasteryRecord, Question, SkillId } from '../types';
import type { Rng } from '../rng';

export interface GenContext {
  rng: Rng;
  difficulty: Difficulty;
  mastery: Record<string, MasteryRecord>;
  /** Facts asked recently in this session, to avoid immediate repeats. */
  recentFacts: FactId[];
  now: number;
  /** Prefer applied (word) problems? */
  applied?: boolean;
}

export type Generator = (skillId: SkillId, params: Record<string, number | string | number[]> | undefined, ctx: GenContext) => Question;

let counter = 0;
export const nextQuestionId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export const fmt = (n: number) => n.toLocaleString('en-US');
