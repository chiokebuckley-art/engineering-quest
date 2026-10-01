/**
 * The academy ladder, in unlock order. Graduating from one academy opens the next (and its home region
 * on the World Map). Foundational → High School → Advanced.
 */
import type { AcademyDef, ChapterDef, QuestDef } from './defs';
import { ARITHMETIC } from './content/arithmetic';
import { PREALGEBRA } from './content/prealgebra';
import { ALGEBRA1 } from './content/algebra1';
import { GEOMETRY } from './content/geometry';
import { ALGEBRA2 } from './content/algebra2';
import { TRIG } from './content/trig';
import { PRECALC } from './content/precalc';
import { CALCULUS } from './content/calculus';
import { LINALG } from './content/linalg';
import { DIFFEQ } from './content/diffeq';

/** Drafts hide their draft chapters; an academy that is a draft is listed as coming soon. */
const clean = (a: AcademyDef): AcademyDef => ({ ...a, chapters: a.chapters.filter((c) => !c.draft).map((c, i) => ({ ...c, n: i + 1 })) });

export const ALL_ACADEMIES: AcademyDef[] = [ARITHMETIC, PREALGEBRA, ALGEBRA1, GEOMETRY, ALGEBRA2, TRIG, PRECALC, CALCULUS, LINALG, DIFFEQ];
export const ACADEMIES: AcademyDef[] = ALL_ACADEMIES.map(clean);

const byId = new Map(ACADEMIES.map((a) => [a.id, a]));
export const academyById = (id: string): AcademyDef | undefined => byId.get(id);
export const academyIndex = (id: string) => ACADEMIES.findIndex((a) => a.id === id);
export const nextAcademy = (id: string): AcademyDef | undefined => ACADEMIES[academyIndex(id) + 1];
export const prevAcademy = (id: string): AcademyDef | undefined => { const i = academyIndex(id); return i > 0 ? ACADEMIES[i - 1] : undefined; };

export const chapterOf = (academyId: string, key: string): ChapterDef | undefined => academyById(academyId)?.chapters.find((c) => c.key === key);
/** The chapters that gate graduation (everything except the trial chapter). */
export const coreChapters = (a: AcademyDef) => a.chapters.filter((c) => c.key !== 'trial');
export const trialChapter = (a: AcademyDef) => a.chapters.find((c) => c.key === 'trial');

const questIndex = new Map<string, { academy: AcademyDef; chapter: ChapterDef; quest: QuestDef }>();
for (const academy of ACADEMIES) for (const chapter of academy.chapters) for (const quest of chapter.quests) questIndex.set(quest.id, { academy, chapter, quest });
export const questById = (id: string) => questIndex.get(id);

/** Resolve an `acad.<academy>.<chapter>` skill id. */
export function chapterForSkill(skillId: string): { academy: AcademyDef; chapter: ChapterDef } | undefined {
  const m = /^acad\.([a-z0-9]+)\.([a-z0-9-]+)$/.exec(skillId);
  if (!m) return undefined;
  const academy = academyById(m[1]); const chapter = academy?.chapters.find((c) => c.key === m[2]);
  return academy && chapter ? { academy, chapter } : undefined;
}
