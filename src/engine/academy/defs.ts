/**
 * Academy definitions. Every academy (Arithmetic, Pre-Algebra, …, Differential Equations) is an
 * AcademyDef: chapters in order, each with teach cards, two quests (guided, then challenge), a concept
 * check, a transfer set and a fluency family, ending in a chapter keyed 'trial' that holds the
 * Mastery Trial. Academies unlock one after another in registry order.
 */
import type { Rng } from '../rng';
import type { Question, Visual } from '../types';
import type { AskStep, ModelSpec } from './types';

/**
 * A teach card. A card that shows a picture or a model must also show the working: a worked equation in `text`
 * or in `steps` (one line each). `next` is one thing to try on the model or in your head.
 */
export interface TeachCard { title: string; text: string; steps?: string[]; next?: string; visual?: Visual; model?: ModelSpec; lessonId?: string }
export interface WaveDef { name: string; build: (rng: Rng) => AskStep[] }
export interface QuestDef {
  /** Globally unique, e.g. 'aq.prealg.integers.number-line'. */
  id: string;
  name: string;
  /** NPC id: vector, ada, brick, catalyst, volt, newton. */
  giver: string;
  /** One line hook: the world problem in the wing. */
  hook: string;
  /** What changes in the wing when the quest is won. */
  change: string;
  /** Three waves; each builds its asks fresh from the rng. */
  waves: WaveDef[];
  /** Guided quests carry the chapter's teach cards; challenges go straight to the waves. */
  guided?: boolean;
}
export interface FluencySpec { label: string; skills: string[]; n: number; accuracy: number; medianMs: number }
export interface ChapterDef {
  /** 1-based position, assigned by defineAcademy. */
  n: number;
  /** Stable id within the academy; progress is saved under it. The last chapter must be 'trial'. */
  key: string;
  title: string;
  /** Key into the academy's wings. */
  wing: string;
  wingName: string;
  goal: string;
  misconception: string;
  teach: TeachCard[];
  quests: [QuestDef, QuestDef];
  fluency: FluencySpec;
  /** Three model-based concept items. */
  concept: (rng: Rng) => AskStep[];
  /** One fresh transfer item (a new situation, not a quest clone). */
  transfer: (rng: Rng) => AskStep;
  transferCount: number;
  /** A typed-answer practice question for the Arcade, drills and review (numeric answer). */
  practice?: (rng: Rng) => Question;
  drill: { game: string; selection: string; label: string };
  lessonId?: string;
  /** Extra gates: this chapter also needs these chapters' concept checks passed. */
  requires?: string[];
  /** Scaffolding only: a placeholder not yet written. Hidden from play; tests fail while any remain. */
  draft?: boolean;
}

export interface AcademyDef {
  id: string;
  name: string;
  /** Short name for chips: 'Algebra 1'. */
  short: string;
  tier: 'Foundational' | 'High School' | 'Advanced';
  blurb: string;
  icon: string;
  /** Region that hosts it on the World Map (unlocked when the academy opens). */
  home: string;
  wings: Record<string, { name: string; icon: string }>;
  chapters: ChapterDef[];
  /** Mastery Trial phases, 20–30 asks in all across the whole academy. */
  trial: (rng: Rng) => { name: string; items: AskStep[] }[];
  trialIntro: string;
  coreName: string;
  coreLine: string;
  coreColor: string;
  /** Title awarded at graduation. */
  title: string;
  /** Scaffolding only: not yet written. Shown as 'coming soon'; tests fail while any remain. */
  draft?: boolean;
}

export type ChapterSpec = Omit<ChapterDef, 'n' | 'fluency' | 'drill' | 'transferCount'> & {
  fluency?: Partial<FluencySpec>;
  drill?: ChapterDef['drill'];
  transferCount?: number;
};
export type AcademySpec = Omit<AcademyDef, 'chapters'> & { chapters: ChapterSpec[] };

/** The skill id every question in an academy chapter records under (Arithmetic keeps its own ids). */
export const academySkill = (academyId: string, key: string) => `acad.${academyId}.${key}`;

/**
 * Fill defaults: chapter numbers, a fluency family on the chapter's own skill id, and an Arcade drill
 * that practises the chapter (game 'academy').
 */
export function defineAcademy(spec: AcademySpec): AcademyDef {
  const chapters: ChapterDef[] = spec.chapters.map((c, i) => {
    const skill = academySkill(spec.id, c.key);
    return {
      ...c,
      n: i + 1,
      transferCount: c.transferCount ?? 5,
      fluency: { label: c.title, skills: [skill], n: 12, accuracy: 0.8, medianMs: 30_000, ...c.fluency },
      drill: c.drill ?? { game: 'academy', selection: `academy:${spec.id}.${c.key}`, label: `Practice: ${c.title}` },
    };
  });
  return { ...spec, chapters };
}
