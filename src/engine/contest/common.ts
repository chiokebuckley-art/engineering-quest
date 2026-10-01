import type { Difficulty, Question, QuestionChoice, Visual } from '../types';
import type { KindDef } from '../questions/games';
import { pictureQuestion, type PictureSpec } from '../questions/picture';

/**
 * Shared pieces for the Contest Path games. Difficulty bands map to grades:
 *   1–2 → Grade 1 (numbers to 20, pictures first, no %, short sentences, tap answers),
 *   3–4 → Grade 3 (whole numbers to 1,000, unit fractions, two-step stories, no multi-step %),
 *   5–6 → Grade 5 (contest ramp: fractions, decimals, %, ratio, multi-step, composites).
 */
export type GradeId = 'g1' | 'g3' | 'g5';
export const GRADE_IDS: GradeId[] = ['g1', 'g3', 'g5'];
export const gradeOf = (d: Difficulty): GradeId => (d <= 2 ? 'g1' : d <= 4 ? 'g3' : 'g5');
export const GRADE_DIFFICULTY: Record<GradeId, [Difficulty, Difficulty]> = { g1: [1, 2], g3: [3, 4], g5: [5, 6] };

/** Everything a game file exports about itself; games.ts turns it into a picture game. */
export interface ContestGameMeta {
  id: string; label: string; icon: string; blurb: string; topic: string; skill: string; intro: string;
  tree: { x: number; y: number }; prereq: { skillId: string; mastery: number };
}
/** A game's kinds plus the grades each kind suits (the track playlists and the Arcade caps read this). */
export type KindGrades = Record<string, GradeId[]>;
export type ContestKind = KindDef;

export interface ContestSpec extends PictureSpec {
  choices?: QuestionChoice[];
  readAloud?: string;
  /** The finished picture for "Show me how" (it may show the answer; the question picture must not). */
  solutionVisual?: Visual;
}
/** A Contest Path question: a picture-first question with optional tap choices and read-aloud words. */
export function contestQuestion(prefix: string, topic: string, skillId: string, subtopic: string, o: ContestSpec): Question {
  const q = pictureQuestion(prefix, topic, skillId, subtopic, { ...o, prereq: o.prereq ?? [] });
  return { ...q, choices: o.choices, readAloud: o.readAloud, solutionVisual: o.solutionVisual, engineeringApplication: o.app };
}

/** Shuffle choice values into tap options; the right value must be among them. Labels default to the value. */
export function choicesFrom(values: number[], label: (v: number) => string = String, visual?: (v: number) => Visual | undefined): QuestionChoice[] {
  return values.map((v) => ({ value: v, label: label(v), visual: visual?.(v) }));
}
