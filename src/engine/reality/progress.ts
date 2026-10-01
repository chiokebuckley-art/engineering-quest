/**
 * Reality Lab progress, saved with the profile (and synced like the rest of the save): mission state,
 * mastery checks per skill and per component, the error book, predictions vs observations, notes,
 * inventions and the learner's kit corrections.
 */
import type { MasteryStage } from './types';
import { MISSIONS, requiredChecks, SKILLS } from './missions';

export interface StageRecord { ok: boolean; at: number; attempts: number }
export interface MissionProgress { stage: number; passed: number[]; done: boolean; completedAt?: number; startedAt?: number }
export interface ErrorEntry { id: string; mission: string; stage: number; skill: string; tag: string; prompt: string; chosen: string; correct: string; why: string; at: number; fixes: number }
export interface Prediction { mission: string; prompt: string; predicted: string; right: string; observed: string; matched: boolean; at: number }
export interface Invention {
  at: number; sensor: string; output: string; cmp: string; threshold: number;
  mechanism: string; prediction: string; tests: { label: string; alert: boolean; reading: string }[];
  failure: string; fix: string; limitation: string; passed: boolean;
}
export type KitMark = 'missing' | 'misidentified' | 'different';
export interface RealityProgress {
  lab: string;
  /** Mission content layout version; stage indices are rewritten when stages are inserted. */
  content?: number;
  missions: Record<string, MissionProgress>;
  skills: Record<string, Partial<Record<MasteryStage, StageRecord>>>;
  components: Record<string, Partial<Record<MasteryStage, StageRecord>>>;
  errors: ErrorEntry[];
  notes: Record<string, string>;
  predictions: Prediction[];
  inventions: Invention[];
  kit: Record<string, { status: KitMark; note?: string; at: number }>;
  /** How many times each question variant family was served (avoid repeats). */
  seen: Record<string, number>;
  lastPracticed: Record<string, number>;
}
export const initialReality = (): RealityProgress => ({
  lab: 'electronics-kit-01', content: CONTENT_VERSION, missions: {}, skills: {}, components: {}, errors: [], notes: {}, predictions: [], inventions: [], kit: {}, seen: {}, lastPracticed: {},
});
/** Older saves (or corrupted fields) load as a fresh lab. */
export function migrateReality(raw: unknown): RealityProgress {
  const base = initialReality();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<RealityProgress>;
  const obj = <T>(v: T | undefined, d: T): T => (v && typeof v === 'object' ? v : d);
  const out: RealityProgress = { ...base, missions: obj(r.missions, {}), skills: obj(r.skills, {}), components: obj(r.components, {}), errors: Array.isArray(r.errors) ? r.errors : [], notes: obj(r.notes, {}),
    predictions: Array.isArray(r.predictions) ? r.predictions : [], inventions: Array.isArray(r.inventions) ? r.inventions : [], kit: obj(r.kit, {}), seen: obj(r.seen, {}), lastPracticed: obj(r.lastPracticed, {}) };
  return (r.content ?? 1) < 2 ? shiftForTours(out) : out;
}

export const CONTENT_VERSION = 2;
/**
 * Content v2 put a “meet the parts” tour before the questions: M01 gained two stages after its first
 * (a lesson and the tour), M02–M10 gained a tour at the start. Saved stage numbers move with their stages.
 */
function shiftForTours(p: RealityProgress): RealityProgress {
  const shift = (mission: string, i: number) => (mission === 'm01' ? (i >= 1 ? i + 2 : i) : /^m(0[2-9]|10)$/.test(mission) ? (i >= 1 ? i + 1 : i) : i);
  const missions = Object.fromEntries(Object.entries(p.missions).map(([id, m]) => [id, { ...m, stage: m.done ? m.stage : shift(id, m.stage), passed: m.passed.map((i) => shift(id, i)) }]));
  const errors = p.errors.map((e) => { const stage = shift(e.mission, e.stage); return { ...e, stage, id: `${e.mission}:${stage}:${e.tag}` }; });
  const seen = Object.fromEntries(Object.entries(p.seen).map(([k, v]) => { const [m, i] = k.split(':'); return [/^\d+$/.test(i ?? '') ? `${m}:${shift(m, Number(i))}` : k, v]; }));
  return { ...p, content: CONTENT_VERSION, missions, errors, seen };
}

export interface StageResult {
  mission: string; stage: number; ok: boolean;
  skill?: string; mstage?: MasteryStage; component?: string;
  error?: { tag: string; prompt: string; chosen: string; correct: string; why: string };
  prediction?: Omit<Prediction, 'at'>;
  /** Answering an error-book retry correctly counts as a fix. */
  fixes?: string;
}

const rec = (prev: StageRecord | undefined, ok: boolean, now: number): StageRecord => ({ ok: ok || !!prev?.ok, at: now, attempts: (prev?.attempts ?? 0) + 1 });

export function applyStageResult(p: RealityProgress, r: StageResult, now = Date.now()): RealityProgress {
  const next: RealityProgress = { ...p, missions: { ...p.missions }, skills: { ...p.skills }, components: { ...p.components }, lastPracticed: { ...p.lastPracticed } };
  const m = next.missions[r.mission] ?? { stage: 0, passed: [], done: false, startedAt: now };
  if (r.ok && !m.passed.includes(r.stage)) next.missions[r.mission] = { ...m, passed: [...m.passed, r.stage].sort((a, b) => a - b) };
  else if (!next.missions[r.mission]) next.missions[r.mission] = m;
  if (r.skill && r.mstage) {
    next.skills[r.skill] = { ...next.skills[r.skill], [r.mstage]: rec(next.skills[r.skill]?.[r.mstage], r.ok, now) };
    next.lastPracticed[r.skill] = now;
  }
  if (r.component && r.mstage) next.components[r.component] = { ...next.components[r.component], [r.mstage]: rec(next.components[r.component]?.[r.mstage], r.ok, now) };
  if (!r.ok && r.error && r.skill) {
    // One open entry per question family: a repeat miss refreshes it instead of piling up.
    const id = `${r.mission}:${r.stage}:${r.error.tag}`;
    const others = p.errors.filter((e) => e.id !== id);
    next.errors = [{ id, mission: r.mission, stage: r.stage, skill: r.skill, ...r.error, at: now, fixes: 0 }, ...others].slice(0, 80);
  }
  if (r.ok && r.fixes) next.errors = next.errors.map((e) => (e.id === r.fixes ? { ...e, fixes: e.fixes + 1 } : e));
  if (r.prediction) next.predictions = [{ ...r.prediction, at: now }, ...p.predictions].slice(0, 60);
  return next;
}

export function missionComplete(p: RealityProgress, missionId: string, now = Date.now()): RealityProgress {
  const m = p.missions[missionId] ?? { stage: 0, passed: [], done: false };
  return { ...p, missions: { ...p.missions, [missionId]: { ...m, done: true, completedAt: m.completedAt ?? now } } };
}
export const openErrors = (p: RealityProgress) => p.errors.filter((e) => e.fixes < 1);

export type SkillStatus = 'learned' | 'in-progress' | 'needs-review' | 'not-started';
/** 100% mastery: every required check for the skill passed. A skill with only recognition never counts. */
export function skillStatus(p: RealityProgress, skill: string): { status: SkillStatus; have: number; need: number; missing: MasteryStage[] } {
  const need = requiredChecks()[skill] ?? [];
  const got = p.skills[skill] ?? {};
  const missing = need.filter((st) => !got[st]?.ok);
  const have = need.length - missing.length;
  const review = openErrors(p).some((e) => e.skill === skill);
  const status: SkillStatus = review ? 'needs-review' : have === 0 ? (Object.keys(got).length ? 'in-progress' : 'not-started') : missing.length === 0 && need.some((s) => s !== 'recognize') ? 'learned' : 'in-progress';
  return { status, have, need: need.length, missing };
}
export function labSummary(p: RealityProgress) {
  const skills = Object.keys(SKILLS).map((k) => ({ id: k, ...skillStatus(p, k) }));
  const count = (s: SkillStatus) => skills.filter((x) => x.status === s).length;
  return { skills, learned: count('learned'), inProgress: count('in-progress'), review: count('needs-review'), notStarted: count('not-started'), missionsDone: MISSIONS.filter((m) => p.missions[m.id]?.done).length };
}
/** Recommended next mission: the first not done whose prerequisites are done (or the first not done). */
export function nextMission(p: RealityProgress): string | null {
  const open = MISSIONS.filter((m) => !p.missions[m.id]?.done);
  return (open.find((m) => m.prereq.every((x) => p.missions[x]?.done)) ?? open[0])?.id ?? null;
}
