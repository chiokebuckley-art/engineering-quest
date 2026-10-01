import type { Difficulty, Question, Visual } from '../types';
import { nextQuestionId } from './context';

/** Shared builder for picture-first questions (measurement, geometry, rates, fit, forces, plumbing). */
export interface PictureSpec {
  prompt: string; expression: string; answer: number; unit?: string; difficulty: Difficulty; hint: string; steps: string[]; visual: Visual;
  /** Accept ±tolerance (rounded answers, π, unit factors). */
  tolerance?: number;
  /** Show the decimal key. */
  decimal?: boolean;
  /** Accept a fraction (a/b) and show the fraction key. */
  fraction?: boolean;
  /** Show the minus key. */
  negative?: boolean;
  /** How the answer is written when shown. */
  answerText?: string;
  app?: string; prereq?: string[];
}
export function pictureQuestion(prefix: string, topic: string, skillId: string, subtopic: string, o: PictureSpec): Question {
  return {
    id: nextQuestionId(prefix), masterySkillId: skillId, topic, subtopic, difficulty: o.difficulty, mode: 'applied',
    prompt: o.prompt, expression: o.expression, answer: o.answer, unit: o.unit, hint: o.hint, solutionSteps: o.steps, explanation: o.steps,
    visual: o.visual, visualFirst: true, prerequisites: o.prereq ?? ['mult'], tolerance: o.tolerance, allowDecimal: o.decimal || (!o.fraction && !Number.isInteger(o.answer)),
    allowFraction: o.fraction, allowNegative: o.negative || o.answer < 0, answerText: o.answerText,
    engineeringApplication: o.app ?? 'Engineers measure, calculate and check before they build.',
  };
}

/** Round to `places` decimals and give a tolerance of half a unit in the last place or 1.2 %, whichever is larger. */
export function approx(value: number, places = 1): { answer: number; tolerance: number } {
  const f = 10 ** places; const answer = Math.round(value * f) / f;
  return { answer, tolerance: Math.max(0.5 / f, Math.abs(value) * 0.012) };
}
export const r1 = (n: number) => Math.round(n * 10) / 10;
export const r2 = (n: number) => Math.round(n * 100) / 100;
/** Format a number without float noise. */
export const num = (n: number, places = 2) => String(Math.round(n * 10 ** places) / 10 ** places);
export const PI = 3.14;
/** "=" when the shown (rounded) number is exact, "≈" when rounding changed it: for worked steps. */
export const eqSign = (exact: number, shown: number | string) => (Math.abs(exact - Number(shown)) <= 1e-9 * Math.max(1, Math.abs(exact)) ? '=' : '≈');
