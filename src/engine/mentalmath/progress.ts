import type { Rng } from '../rng';
import { MM_SKILLS, MM_WORLDS, mmSkill, skillsInWorld } from './curriculum';
import type { MMPlanItem, MMResult, MMScaffold } from './session';
import type { ErrorKind } from './errors';

/**
 * Mental-math progress that the core mastery engine does not already hold: the scaffolding level a
 * learner has earned per skill, their error profile, personal records, and the schedule that decides
 * what to practise next.
 */
export interface MMSkillProgress {
  /** Highest scaffold level cleared (lower number = more help), and the one to resume at. */
  scaffold: MMScaffold;
  attempts: number;
  correct: number;
  /** Rolling average response time in ms. */
  avgMs: number;
  bestMs: number;
  /** Index into the skill's speed ladder that has been passed. */
  speedStep: number;
  /** Mastery rounds passed. */
  masteryPasses: number;
  lastAt: number;
  /** Next spaced review, ms since epoch. */
  reviewAt: number;
}

export interface MMRecords {
  bestStreak: number;
  fastestTenMs: number;
  bestBlitz: number;
  perfectRounds: number;
  bestAddMs: number;
  bestSubMs: number;
  bestMulMs: number;
  totalSolved: number;
  totalCorrect: number;
}

export interface MentalStats {
  skills: Record<string, MMSkillProgress>;
  errors: Partial<Record<ErrorKind, number>>;
  records: MMRecords;
  /** Bosses beaten, by world id. */
  bosses: Record<string, number>;
  /** The last few sessions, for the dashboard trend. */
  sessions: { at: number; mode: string; skillId: string; solved: number; correct: number; avgMs: number }[];
  /** ISO date of the last completed daily workout. */
  workoutDate: string;
  workoutStreak: number;
  placement?: { at: number; level: string; startSkill: string };
  /** Worlds opened by a placement challenge, so a learner who already knows this material can skip ahead. */
  placedWorld?: number;
}

export const initialMental = (): MentalStats => ({
  skills: {}, errors: {},
  records: { bestStreak: 0, fastestTenMs: 0, bestBlitz: 0, perfectRounds: 0, bestAddMs: 0, bestSubMs: 0, bestMulMs: 0, totalSolved: 0, totalCorrect: 0 },
  bosses: {}, sessions: [], workoutDate: '', workoutStreak: 0,
});

export const blankProgress = (): MMSkillProgress => ({ scaffold: 1, attempts: 0, correct: 0, avgMs: 0, bestMs: 0, speedStep: 0, masteryPasses: 0, lastAt: 0, reviewAt: 0 });
export const progressFor = (m: MentalStats, id: string): MMSkillProgress => m.skills[id] ?? blankProgress();

const REVIEW_MS = [10 * 60_000, 24 * 3600_000, 3 * 24 * 3600_000, 7 * 24 * 3600_000, 21 * 24 * 3600_000];

/** Fold one answer into the learner's mental-math record. */
export function applyResult(m: MentalStats, r: MMResult, now: number): MentalStats {
  const prev = progressFor(m, r.skillId);
  const attempts = prev.attempts + 1;
  const correct = prev.correct + (r.correct ? 1 : 0);
  const avgMs = Math.round((prev.avgMs * prev.attempts + r.timeMs) / attempts);
  const bestMs = r.correct ? (prev.bestMs === 0 ? r.timeMs : Math.min(prev.bestMs, r.timeMs)) : prev.bestMs;
  const passes = prev.masteryPasses;
  const reviewAt = r.correct ? now + REVIEW_MS[Math.min(REVIEW_MS.length - 1, passes)] : now + REVIEW_MS[0];
  const skills = { ...m.skills, [r.skillId]: { ...prev, attempts, correct, avgMs, bestMs, scaffold: r.scaffold, lastAt: now, reviewAt } };
  const errors = r.error ? { ...m.errors, [r.error]: (m.errors[r.error] ?? 0) + 1 } : m.errors;
  const op = mmSkill(r.skillId)?.op;
  const records: MMRecords = {
    ...m.records,
    totalSolved: m.records.totalSolved + 1,
    totalCorrect: m.records.totalCorrect + (r.correct ? 1 : 0),
    bestAddMs: r.correct && op === 'add' && (m.records.bestAddMs === 0 || r.timeMs < m.records.bestAddMs) ? r.timeMs : m.records.bestAddMs,
    bestSubMs: r.correct && op === 'sub' && (m.records.bestSubMs === 0 || r.timeMs < m.records.bestSubMs) ? r.timeMs : m.records.bestSubMs,
    bestMulMs: r.correct && op === 'mul' && (m.records.bestMulMs === 0 || r.timeMs < m.records.bestMulMs) ? r.timeMs : m.records.bestMulMs,
  };
  return { ...m, skills, errors, records };
}

/** Fold a finished session in: records, mastery passes, speed ladder, session log. */
export function applySession(m: MentalStats, o: { skillId: string; mode: string; results: MMResult[]; bestStreak: number; passedMastery: boolean; targetMs?: number; bossWorld?: string; now: number }): MentalStats {
  const solved = o.results.length;
  const correct = o.results.filter((r) => r.correct).length;
  const avgMs = solved ? Math.round(o.results.reduce((a, r) => a + r.timeMs, 0) / solved) : 0;
  const prev = progressFor(m, o.skillId);
  const sk = mmSkill(o.skillId);
  let speedStep = prev.speedStep;
  if (o.mode === 'speed' && o.targetMs && sk) {
    const onTime = o.results.filter((r) => r.correct && r.timeMs <= o.targetMs!).length;
    const passed = solved >= 8 && correct >= Math.ceil(solved * 0.9) && onTime >= Math.ceil(solved * 0.9);
    const idx = sk.speedLadder.findIndex((t) => t * 1000 === o.targetMs);
    if (passed && idx >= 0) speedStep = Math.max(speedStep, idx + 1);
  }
  const masteryPasses = prev.masteryPasses + (o.passedMastery ? 1 : 0);
  const skills = { ...m.skills, [o.skillId]: { ...prev, speedStep, masteryPasses, lastAt: o.now, reviewAt: o.now + REVIEW_MS[Math.min(REVIEW_MS.length - 1, masteryPasses)] } };
  const fastestTen = solved >= 10 && correct === solved ? o.results.slice(0, 10).reduce((a, r) => a + r.timeMs, 0) : 0;
  const records: MMRecords = {
    ...m.records,
    bestStreak: Math.max(m.records.bestStreak, o.bestStreak),
    perfectRounds: m.records.perfectRounds + (solved >= 8 && correct === solved ? 1 : 0),
    fastestTenMs: fastestTen && (m.records.fastestTenMs === 0 || fastestTen < m.records.fastestTenMs) ? fastestTen : m.records.fastestTenMs,
  };
  const bosses = o.bossWorld ? { ...m.bosses, [o.bossWorld]: (m.bosses[o.bossWorld] ?? 0) + 1 } : m.bosses;
  const sessions = [...m.sessions, { at: o.now, mode: o.mode, skillId: o.skillId, solved, correct, avgMs }].slice(-40);
  return { ...m, skills, records, bosses, sessions };
}

/* ------------------------------------------------------------------ */
/* unlocking and recommendation                                        */
/* ------------------------------------------------------------------ */

/** A skill counts as ready once it has been practised accurately, not merely attempted. */
export function skillState(m: MentalStats, mastery: Record<string, { mastery?: number } | undefined>, id: string): 'locked' | 'open' | 'practised' | 'mastered' {
  const sk = mmSkill(id);
  if (!sk) return 'locked';
  if (sk.world <= (m.placedWorld ?? 0) && (m.skills[id]?.attempts ?? 0) === 0) return 'open';
  const own = mastery[id]?.mastery ?? 0;
  const p = progressFor(m, id);
  if (own >= 90 && p.masteryPasses > 0) return 'mastered';
  const ready = sk.prereq.every((q) => (mastery[q]?.mastery ?? 0) >= 55 || (m.skills[q]?.masteryPasses ?? 0) > 0);
  if (!ready) return 'locked';
  return p.attempts > 0 ? 'practised' : 'open';
}

export function worldUnlocked(m: MentalStats, mastery: Record<string, { mastery?: number } | undefined>, world: number): boolean {
  if (world <= 1) return true;
  if (world <= (m.placedWorld ?? 0)) return true;
  const prev = skillsInWorld(world - 1);
  const done = prev.filter((s) => (mastery[s.id]?.mastery ?? 0) >= 55 || (m.skills[s.id]?.masteryPasses ?? 0) > 0).length;
  return done >= Math.ceil(prev.length * 0.6);
}

/** The next thing worth practising: an overdue review, then the weakest open skill, then the frontier. */
export function recommend(m: MentalStats, mastery: Record<string, { mastery?: number } | undefined>, now: number): { skillId: string; why: string } {
  const open = MM_SKILLS.filter((s) => skillState(m, mastery, s.id) !== 'locked');
  const due = open.filter((s) => { const p = m.skills[s.id]; return p && p.attempts > 0 && p.reviewAt && p.reviewAt <= now; });
  if (due.length) {
    const s = due.sort((a, b) => (m.skills[a.id]!.reviewAt) - (m.skills[b.id]!.reviewAt))[0];
    return { skillId: s.id, why: 'Due for review — a quick pass keeps it sharp.' };
  }
  const weak = open
    .filter((s) => (m.skills[s.id]?.attempts ?? 0) >= 4 && (mastery[s.id]?.mastery ?? 0) < 70)
    .sort((a, b) => (mastery[a.id]?.mastery ?? 0) - (mastery[b.id]?.mastery ?? 0))[0];
  if (weak) return { skillId: weak.id, why: 'Your weakest open skill. Accuracy first, speed later.' };
  const fresh = open.find((s) => (m.skills[s.id]?.attempts ?? 0) === 0);
  if (fresh) return { skillId: fresh.id, why: 'New ground: learn the move, then practise it.' };
  const lowest = open.sort((a, b) => (mastery[a.id]?.mastery ?? 0) - (mastery[b.id]?.mastery ?? 0))[0];
  return { skillId: lowest?.id ?? 'mm.add2.chunks', why: 'Keep the whole ladder warm.' };
}

/* ------------------------------------------------------------------ */
/* daily workout                                                       */
/* ------------------------------------------------------------------ */

export const todayKey = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

/**
 * A personalised 5–15 minute workout: bonds to warm up, one block per operation weighted toward the
 * learner's weakest area, and a short speed finisher on something already accurate.
 */
export function buildWorkout(m: MentalStats, mastery: Record<string, { mastery?: number } | undefined>, now: number): MMPlanItem[] {
  const open = MM_SKILLS.filter((s) => skillState(m, mastery, s.id) !== 'locked');
  const pickOp = (op: 'add' | 'sub' | 'mul'): string | undefined => {
    const inOp = open.filter((s) => s.op === op && s.world > 1);
    if (!inOp.length) return undefined;
    return inOp.sort((a, b) => (mastery[a.id]?.mastery ?? 0) - (mastery[b.id]?.mastery ?? 0))[0].id;
  };
  const plan: MMPlanItem[] = [];
  const warm = open.find((s) => s.world === 1 && (mastery[s.id]?.mastery ?? 0) < 95) ?? open[0];
  if (warm) plan.push({ skillId: warm.id, label: 'Warm up: number building', count: 6 });
  const add = pickOp('add'); if (add) plan.push({ skillId: add, label: 'Addition', count: 6 });
  const sub = pickOp('sub'); if (sub) plan.push({ skillId: sub, label: 'Subtraction', count: 6 });
  const mul = pickOp('mul'); if (mul) plan.push({ skillId: mul, label: 'Multiplication', count: 6 });
  const rec = recommend(m, mastery, now);
  if (!plan.some((p) => p.skillId === rec.skillId)) plan.push({ skillId: rec.skillId, label: 'Weak-area training', count: 6 });
  const strong = open.filter((s) => (mastery[s.id]?.mastery ?? 0) >= 70).sort((a, b) => (mastery[b.id]?.mastery ?? 0) - (mastery[a.id]?.mastery ?? 0))[0];
  if (strong) plan.push({ skillId: strong.id, label: 'Speed finisher', count: 6, mode: 'speed' });
  return plan;
}

/** Rough minutes for a plan, from each skill's target time plus reading time. */
export const workoutMinutes = (plan: MMPlanItem[]) =>
  Math.max(4, Math.round(plan.reduce((a, p) => a + p.count * ((mmSkill(p.skillId)?.targetMs ?? 6000) + 2500), 0) / 60_000));

/* ------------------------------------------------------------------ */
/* placement                                                           */
/* ------------------------------------------------------------------ */

/** Where a placement run says the learner should start. */
export function placementResult(passed: string[]): { startSkill: string; level: string; worlds: number } {
  const order = ['mm.make10', 'mm.add2.chunks', 'mm.add2.mixed', 'mm.sub2.mixed', 'mm.add3.chunks', 'mm.sub3.mixed', 'mm.mul.facts', 'mm.mul.2x1', 'mm.mul.2x2'];
  const last = order.filter((id) => passed.includes(id)).pop();
  if (!last) return { startSkill: 'mm.make10', level: 'Starting at the beginning', worlds: 1 };
  const idx = order.indexOf(last);
  const next = order[idx + 1] ?? 'mm.mul.3x1';
  const world = mmSkill(next)?.world ?? 1;
  return { startSkill: next, level: `Ready for ${MM_WORLDS[world - 1]?.name ?? 'the next world'}`, worlds: world };
}

/** Summary numbers for the dashboard. */
export function dashboard(m: MentalStats, mastery: Record<string, { mastery?: number } | undefined>) {
  const rows = MM_SKILLS.map((s) => ({ skill: s, mastery: mastery[s.id]?.mastery ?? 0, p: progressFor(m, s.id) }));
  const touched = rows.filter((r) => r.p.attempts > 0);
  const byOp = (op: 'add' | 'sub' | 'mul') => {
    const list = rows.filter((r) => r.skill.op === op && r.p.attempts > 0);
    return list.length ? Math.round(list.reduce((a, r) => a + r.mastery, 0) / list.length) : 0;
  };
  const acc = m.records.totalSolved ? m.records.totalCorrect / m.records.totalSolved : 0;
  const avgMs = touched.length ? Math.round(touched.reduce((a, r) => a + r.p.avgMs * r.p.attempts, 0) / touched.reduce((a, r) => a + r.p.attempts, 0)) : 0;
  const sorted = [...touched].sort((a, b) => a.mastery - b.mastery);
  const level = Math.max(1, Math.min(10, 1 + Math.floor(touched.filter((r) => r.mastery >= 70).length / 4)));
  const world = MM_WORLDS.filter((w) => rows.some((r) => r.skill.world === w.n && r.p.attempts > 0)).pop()?.n ?? 1;
  return {
    level, world,
    mastered: rows.filter((r) => r.mastery >= 90).length,
    skillsTouched: touched.length, totalSkills: MM_SKILLS.length,
    accuracy: acc, avgMs,
    add: byOp('add'), sub: byOp('sub'), mul: byOp('mul'),
    weakest: sorted[0]?.skill, strongest: sorted[sorted.length - 1]?.skill,
    solved: m.records.totalSolved, bestStreak: m.records.bestStreak,
  };
}

/** Picks a skill for a quick mixed round, weighted toward what needs work. */
export function pickReviewSkill(m: MentalStats, mastery: Record<string, { mastery?: number } | undefined>, rng: Rng, now: number): string {
  const open = MM_SKILLS.filter((s) => skillState(m, mastery, s.id) !== 'locked' && (m.skills[s.id]?.attempts ?? 0) > 0);
  if (!open.length) return 'mm.add2.chunks';
  const weights = open.map((s) => {
    const p = m.skills[s.id]!;
    const due = p.reviewAt && p.reviewAt <= now ? 3 : 1;
    const weak = Math.max(0.5, (100 - (mastery[s.id]?.mastery ?? 0)) / 50);
    return due * weak;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng.next() * total;
  for (let i = 0; i < open.length; i++) { r -= weights[i]; if (r <= 0) return open[i].id; }
  return open[open.length - 1].id;
}
