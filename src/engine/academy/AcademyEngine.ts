/**
 * Academy engine: builds runs (quests, concept checks, transfer sets, the Mastery Trial), judges
 * answers, and computes each academy's mastery gates from the same data the rest of the game records
 * (answers log, notebook, chapter progress). Academies unlock in ladder order: graduating from one
 * opens the next. Nothing here touches the reducer; it only makes states.
 */
import type { GameState } from '../state/types';
import type { AnswerLogEntry } from '../types';
import { createRng, type Rng } from '../rng';
import { activeEntries } from '../notebook/notebook';
import type { AcademyDef, ChapterDef } from './defs';
import { ACADEMIES, academyById, academyIndex, chapterOf, coreChapters, prevAcademy, questById, nextAcademy } from './registry';
import { judge, norm } from './judge';
import { initialChapter, initialTrack, type AcademyRun, type AcademyState, type AcademyStep, type AskStep, type ChapterProgress, type TrackProgress } from './types';

export const QUEST_PASS = 0.7;
export const CONCEPT_PASS = 2;
export const TRANSFER_PASS = 0.8;
export const TRIAL_PASS = 0.8;

export { judge, norm };

export const trackOf = (a: AcademyState, academyId: string): TrackProgress => a.tracks[academyId] ?? initialTrack();
export const progressFor = (a: AcademyState, academyId: string, key: string): ChapterProgress => trackOf(a, academyId).chapters[key] ?? initialChapter();

/* ---------------- building runs ---------------- */
function label(steps: AskStep[], wave: string): AskStep[] { return steps.map((s) => ({ ...s, wave })); }

function run(kind: AcademyRun['kind'], academyId: string, chapter: string, title: string, steps: AcademyStep[], now: number, extra: Partial<AcademyRun> = {}): AcademyRun {
  return { kind, academyId, chapter, title, steps, index: 0, asked: 0, correct: 0, results: [], attempts: 0, showExplanation: false, helperUsed: false, helperOn: false, questionStartedAt: now, startedAt: now, status: 'active', ...extra };
}

export function buildQuest(questId: string, rng: Rng = createRng(), now = Date.now()): AcademyRun | null {
  const found = questById(questId);
  if (!found) return null;
  const { academy, chapter, quest } = found;
  const steps: AcademyStep[] = [{ kind: 'hook', speaker: quest.giver, text: quest.hook }];
  if (quest.guided) for (const t of chapter.teach) steps.push({ kind: 'teach', title: t.title, text: t.text, steps: t.steps, next: t.next, visual: t.visual, model: t.model, lessonId: t.lessonId, drill: chapter.drill });
  quest.waves.forEach((w, i) => steps.push(...label(w.build(rng), `Wave ${i + 1} · ${w.name}`)));
  return run('quest', academy.id, chapter.key, quest.name, steps, now, { questId, worldText: quest.change });
}

export function buildConcept(academyId: string, key: string, rng: Rng = createRng(), now = Date.now()): AcademyRun | null {
  const c = chapterOf(academyId, key); if (!c) return null;
  const steps: AcademyStep[] = [{ kind: 'hook', speaker: 'vector', text: `Concept check, chapter ${c.n}. Show me with the model, not a guess: two of three and you pass.` }, ...label(c.concept(rng), 'Concept check')];
  return run('concept', academyId, key, `${c.title}: concept check`, steps, now);
}

export function buildTransfer(academyId: string, key: string, rng: Rng = createRng(), now = Date.now()): AcademyRun | null {
  const c = chapterOf(academyId, key); if (!c) return null;
  const items = Array.from({ length: c.transferCount }, () => c.transfer(rng));
  const steps: AcademyStep[] = [{ kind: 'hook', speaker: 'ada', text: `Transfer set: ${c.transferCount} new engineering problems you have not seen in the quests. ${Math.ceil(c.transferCount * TRANSFER_PASS)} right passes.` }, ...label(items, 'Transfer')];
  return run('transfer', academyId, key, `${c.title}: transfer set`, steps, now);
}

export function buildTrial(academyId: string, rng: Rng = createRng(), now = Date.now()): AcademyRun | null {
  const a = academyById(academyId); if (!a) return null;
  const phases = a.trial(rng);
  const steps: AcademyStep[] = [{ kind: 'hook', speaker: 'vector', text: a.trialIntro }];
  const marks: { name: string; from: number }[] = [];
  for (const p of phases) { marks.push({ name: p.name, from: steps.length }); steps.push(...label(p.items, p.name)); }
  return { ...run('trial', academyId, 'trial', `${a.short}: the Mastery Trial`, steps, now), phases: marks };
}

/* ---------------- judging ---------------- */
export const currentStep = (r: AcademyRun): AcademyStep | undefined => r.steps[r.index];
export const askedTotal = (r: AcademyRun) => r.steps.filter((s) => s.kind === 'ask').length;

/** Feedback line; never the bare answer on a first miss in a quest (a retry is coming). */
export function feedbackFor(step: AskStep, correct: boolean, retryComing: boolean): string {
  if (correct) return ['Right.', 'Yes.', 'That holds.', 'Solid.', 'Correct.'][step.question.id.length % 5];
  if (retryComing) return `Not yet. ${safeHint(step)}`;
  const a = step.question.answerText ?? String(step.question.answer);
  return `The answer was ${a}. ${step.question.solutionSteps[0] ?? ''}`.trim();
}

/** A hint for a retry must not carry the answer; some shared generators' hints do. */
export function safeHint(step: AskStep): string {
  const q = step.question; const a = String(q.answerText ?? q.answer);
  const esc = a.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const leaks = new RegExp(`(=|is|makes?|lands? on|:)\\s*${esc}(?![\\d.])`).test(q.hint);
  return leaks ? 'Look at the model and build it once more.' : q.hint;
}

/** A quest allows one retry per ask; checks and the trial are single-attempt. */
export const retryAllowed = (r: AcademyRun) => r.kind === 'quest' && r.attempts === 0;

/** Accuracy so far, first attempts only. */
export const accuracy = (r: AcademyRun) => (r.asked ? r.correct / r.asked : 0);
export function passRule(r: AcademyRun): { need: number; of: number } {
  const of = askedTotal(r);
  if (r.kind === 'concept') return { need: CONCEPT_PASS, of };
  if (r.kind === 'transfer') return { need: Math.ceil(of * TRANSFER_PASS), of };
  if (r.kind === 'trial') return { need: Math.ceil(of * TRIAL_PASS), of };
  return { need: Math.ceil(of * QUEST_PASS), of };
}
export const passed = (r: AcademyRun) => r.correct >= passRule(r).need;

/* ---------------- gates ---------------- */
export interface Fluency { label: string; n: number; have: number; accuracy: number; medianMs: number; pass: boolean; band: 'none' | 'building' | 'easy' | 'target' }

export const inFamily = (skillId: string, prefixes: string[]) => prefixes.some((p) => skillId === p || skillId.startsWith(p.endsWith('.') ? p : `${p}.`));

/** Rolling-window fluency for a chapter's family, counting answers from anywhere in the game. */
export function fluencyFor(c: ChapterDef, answers: AnswerLogEntry[]): Fluency {
  const f = c.fluency;
  const recent = answers.filter((a) => inFamily(a.skillId, f.skills)).slice(-f.n);
  const have = recent.length;
  const right = recent.filter((a) => a.correct).length;
  const times = recent.filter((a) => a.correct).map((a) => a.timeMs).sort((x, y) => x - y);
  const medianMs = times.length ? times[Math.floor(times.length / 2)] : 0;
  const acc = have ? right / have : 0;
  const full = have >= f.n;
  const pass = full && acc >= f.accuracy && medianMs <= f.medianMs;
  const band: Fluency['band'] = !have ? 'none' : !full || acc < f.accuracy ? 'building' : medianMs <= f.medianMs * 0.75 ? 'target' : pass ? 'easy' : 'building';
  return { label: f.label, n: f.n, have, accuracy: acc, medianMs, pass, band };
}

export interface ChapterGates {
  n: number;
  key: string;
  questsCleared: number;
  quests: { id: string; name: string; clears: number }[];
  concept: { best: number; pass: boolean; attempts: number };
  fluency: Fluency;
  transfer: { best: number; of: number; pass: boolean; attempts: number };
  mastered: boolean;
  available: boolean;
  /** Why it is not yet mastered, in order. */
  missing: string[];
  /** Why it is locked, when it is. */
  lockedBecause?: string;
}

export function chapterGates(s: GameState, academyId: string, key: string): ChapterGates {
  const a = academyById(academyId)!;
  const c = a.chapters.find((x) => x.key === key)!;
  const p = progressFor(s.academy, academyId, key);
  const quests = c.quests.map((q) => ({ id: q.id, name: q.name, clears: p.quests[q.id] ?? 0 }));
  const questsCleared = quests.filter((q) => q.clears > 0).length;
  const fluency = fluencyFor(c, s.answers);
  const concept = { best: p.conceptBest, pass: p.conceptPass, attempts: p.conceptAttempts };
  const transfer = { best: p.transferBest, of: c.transferCount, pass: p.transferPass, attempts: p.transferAttempts };
  const missing: string[] = [];
  if (questsCleared < 2) missing.push(questsCleared === 0 ? 'Clear both quests' : 'Clear the second quest');
  if (!concept.pass) missing.push('Pass the concept check (2 of 3)');
  if (!fluency.pass) missing.push(fluency.have < fluency.n ? `Fluency: ${fluency.have}/${fluency.n} recent answers logged` : fluency.accuracy < c.fluency.accuracy ? `Fluency: ${Math.round(fluency.accuracy * 100)}% (need ${Math.round(c.fluency.accuracy * 100)}%)` : `Fluency: median ${(fluency.medianMs / 1000).toFixed(1)}s (need ≤ ${c.fluency.medianMs / 1000}s)`);
  if (!transfer.pass) missing.push(`Pass the transfer set (${Math.ceil(c.transferCount * TRANSFER_PASS)} of ${c.transferCount})`);
  const mastered = key === 'trial' ? !!trackOf(s.academy, academyId).trial.passedAt : missing.length === 0;
  const lock = chapterLock(s, a, c);
  return { n: c.n, key, questsCleared, quests, concept, fluency, transfer, mastered, available: lock === null, missing, lockedBecause: lock ?? undefined };
}

/** Why a chapter is locked, or null when it is open. */
function chapterLock(s: GameState, a: AcademyDef, c: ChapterDef): string | null {
  if (!academyUnlocked(s, a.id)) return `Graduate from the ${prevAcademy(a.id)?.name ?? 'previous academy'} first.`;
  const track = trackOf(s.academy, a.id);
  const own = track.chapters[c.key];
  // Anything already started stays open (saves from before a chapter was inserted keep their place).
  const started = !!own && (Object.values(own.quests).some((v) => v > 0) || own.conceptAttempts > 0 || own.transferAttempts > 0);
  if (c.key === 'trial') return coreChapters(a).every((x) => chapterGates(s, a.id, x.key).mastered) ? null : 'Master every chapter first.';
  if (started) return null;
  const i = a.chapters.indexOf(c);
  if (i > 0) {
    const prev = a.chapters[i - 1];
    const pp = track.chapters[prev.key];
    if (!prev.quests.every((q) => (pp?.quests[q.id] ?? 0) > 0)) return `Clear both quests in chapter ${prev.n} (${prev.title}) first.`;
  }
  for (const r of c.requires ?? []) {
    const rc = a.chapters.find((x) => x.key === r);
    if (rc && !(track.chapters[r]?.conceptPass)) return `Pass the ${rc.title} concept check (chapter ${rc.n}) first.`;
  }
  return null;
}

export function chapterAvailable(s: GameState, academyId: string, key: string): boolean {
  const a = academyById(academyId); const c = a?.chapters.find((x) => x.key === key);
  return !!a && !!c && chapterLock(s, a, c) === null;
}

/* ---------------- academies ---------------- */
/** The first academy is always open; each later one opens when the one before it graduates. */
export function academyUnlocked(s: GameState, academyId: string): boolean {
  const i = academyIndex(academyId); if (i < 0) return false;
  const a = ACADEMIES[i];
  if (a.draft || !a.chapters.length) return false;
  if (i === 0) return true;
  return !!trackOf(s.academy, ACADEMIES[i - 1].id).graduatedAt;
}
export const graduated = (s: GameState, academyId: string) => !!trackOf(s.academy, academyId).graduatedAt;

/** The academy to show by default: the last opened if still sensible, else the first unlocked one not yet graduated. */
export function currentAcademy(s: GameState): AcademyDef {
  const cur = s.academy.current ? academyById(s.academy.current) : undefined;
  if (cur && academyUnlocked(s, cur.id) && !graduated(s, cur.id)) return cur;
  return ACADEMIES.find((a) => academyUnlocked(s, a.id) && !graduated(s, a.id)) ?? [...ACADEMIES].reverse().find((a) => academyUnlocked(s, a.id)) ?? ACADEMIES[0];
}

export type LadderStatus = 'graduated' | 'open' | 'locked' | 'soon';
export function ladder(s: GameState): { academy: AcademyDef; status: LadderStatus; mastered: number; total: number }[] {
  return ACADEMIES.map((a) => {
    const total = coreChapters(a).length;
    const mastered = total ? coreChapters(a).filter((c) => chapterGates(s, a.id, c.key).mastered).length : 0;
    const status: LadderStatus = a.draft || !a.chapters.length ? 'soon' : graduated(s, a.id) ? 'graduated' : academyUnlocked(s, a.id) ? 'open' : 'locked';
    return { academy: a, status, mastered, total };
  });
}

/** Skill families an academy covers, for its weak-fact list. */
export function academyFamilies(a: AcademyDef): string[] {
  return Array.from(new Set(a.chapters.flatMap((c) => c.fluency.skills).concat([`acad.${a.id}`])));
}

/** Critical weak facts for an academy: notebook cards in its families missed more than once and not yet fixed twice. */
export function criticalFacts(s: GameState, academyId = 'arithmetic') {
  const a = academyById(academyId); const fams = a ? academyFamilies(a) : [];
  return activeEntries(s.notebook ?? []).filter((e) => e.lapses >= 1 && e.clean < 2 && inFamily(e.question.masterySkillId, fams));
}

export interface Graduation { ready: boolean; reasons: string[]; chaptersMastered: number; total: number; repairPass: boolean; trialPass: boolean }
export function graduation(s: GameState, academyId = 'arithmetic'): Graduation {
  const a = academyById(academyId)!;
  const gates = coreChapters(a).map((c) => chapterGates(s, academyId, c.key));
  const mastered = gates.filter((g) => g.mastered).length;
  const critical = criticalFacts(s, academyId);
  const track = trackOf(s.academy, academyId);
  const reasons: string[] = [];
  if (!academyUnlocked(s, academyId)) reasons.push(`Graduate from the ${prevAcademy(academyId)?.name ?? 'previous academy'} first`);
  for (const g of gates) if (!g.mastered) reasons.push(`Chapter ${g.n}: ${g.missing[0]}`);
  if (critical.length) reasons.push(`${critical.length} critical weak fact${critical.length === 1 ? '' : 's'} to repair in the Notebook`);
  if (!track.trial.passedAt) reasons.push('Pass the Mastery Trial');
  return { ready: reasons.length === 0, reasons, chaptersMastered: mastered, total: gates.length, repairPass: critical.length === 0, trialPass: !!track.trial.passedAt };
}

/** The Trial opens once every chapter is mastered and the weak-fact list is clear. */
export function trialReady(s: GameState, academyId = 'arithmetic'): { ready: boolean; reasons: string[] } {
  const g = graduation(s, academyId);
  const reasons = g.reasons.filter((r) => r !== 'Pass the Mastery Trial');
  return { ready: reasons.length === 0, reasons };
}

export interface NextStep { label: string; hint: string; chapter: string; questId?: string; kind: 'quest' | 'concept' | 'transfer' | 'fluency' | 'trial' | 'graduate' | 'repair' | 'next-academy' | 'locked' }
/** An academy's own next step: first unfinished thing on the critical path. */
export function academyNext(s: GameState, academyId = 'arithmetic'): NextStep {
  const a = academyById(academyId)!;
  if (graduated(s, academyId)) { const n = nextAcademy(academyId); return n ? { label: `Enter the ${n.name}`, hint: `${a.short} is complete.`, chapter: 'trial', kind: 'next-academy' } : { label: 'Every academy complete', hint: 'The Engine runs on every core.', chapter: 'trial', kind: 'graduate' }; }
  if (!academyUnlocked(s, academyId)) return { label: `${a.short} is locked`, hint: `Graduate from the ${prevAcademy(academyId)?.name ?? 'previous academy'} first.`, chapter: a.chapters[0]?.key ?? 'trial', kind: 'locked' };
  for (const c of coreChapters(a)) {
    const g = chapterGates(s, academyId, c.key);
    if (g.mastered) continue;
    if (!g.available) return { label: `Chapter ${c.n} is locked`, hint: g.lockedBecause ?? '', chapter: c.key, kind: 'locked' };
    const q = g.quests.find((x) => x.clears === 0);
    if (q) return { label: `Quest: ${q.name}`, hint: `Chapter ${c.n} · ${c.wingName}`, chapter: c.key, questId: q.id, kind: 'quest' };
    if (!g.concept.pass) return { label: `Concept check: ${c.title}`, hint: 'Show it with the model. 2 of 3 passes.', chapter: c.key, kind: 'concept' };
    if (!g.transfer.pass) return { label: `Transfer set: ${c.title}`, hint: `${c.transferCount} new problems, ${Math.ceil(c.transferCount * TRANSFER_PASS)} right.`, chapter: c.key, kind: 'transfer' };
    return { label: `Build fluency: ${c.fluency.label}`, hint: `${g.fluency.have}/${g.fluency.n} recent answers. Arcade drills count.`, chapter: c.key, kind: 'fluency' };
  }
  if (criticalFacts(s, academyId).length) return { label: 'Repair critical weak facts', hint: 'Fix each one twice in the Notebook.', chapter: 'trial', kind: 'repair' };
  if (!trackOf(s.academy, academyId).trial.passedAt) return { label: 'The Mastery Trial', hint: 'Every chapter in one run, one helper, 80% to pass.', chapter: 'trial', kind: 'trial' };
  return { label: 'Graduation', hint: `Seat the ${a.coreName}.`, chapter: 'trial', kind: 'graduate' };
}

export { ACADEMIES, academyById };
