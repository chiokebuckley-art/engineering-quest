import type { Question, Visual } from '../types';
import type { Fn } from './fn';

/**
 * How the player answers. Every verb except `type` and `choose` is a hands-on model: the answer comes
 * from what they built, shaded, filled, placed or turned.
 */
export type AcademyVerb =
  | 'type' | 'choose' | 'pickmodel'
  | 'counters' | 'placevalue' | 'numberline' | 'array' | 'fracbar' | 'ratiotable' | 'percent' | 'power' | 'root'
  | 'balance' | 'plot' | 'angle' | 'unitcircle' | 'table' | 'slider';

/** Overlays the plot model and visual can draw. All coordinates are math coordinates. */
export interface PlotLayers {
  fns?: { fn: Fn; label?: string; color?: 'teal' | 'orange' | 'ask' | 'label' | 'muted'; dashed?: boolean; from?: number; to?: number }[];
  points?: { x: number; y: number; label?: string; open?: boolean; color?: 'teal' | 'orange' | 'ask' | 'label' }[];
  /** Arrows from `from` (default origin) to (x, y). */
  vectors?: { x: number; y: number; from?: [number, number]; label?: string; color?: 'teal' | 'orange' | 'ask' | 'label' }[];
  segments?: { a: [number, number]; b: [number, number]; dashed?: boolean; label?: string; color?: 'teal' | 'orange' | 'ask' | 'label' | 'muted' }[];
  /** Shade the area between fn and the x-axis from a to b. */
  shade?: { fn: Fn; a: number; b: number };
  /** Riemann rectangles. */
  rects?: { fn: Fn; a: number; b: number; n: number; rule?: 'left' | 'right' | 'mid' };
  /** Tangent line to fn at x. */
  tangent?: { fn: Fn; x: number };
  /** Slope field for dy/dx = a·x + b·y + c. */
  field?: { a: number; b: number; c: number };
  vlines?: { x: number; label?: string }[];
  hlines?: { y: number; label?: string }[];
}

/** Geometry diagram items (abstract coordinates, y up; the diagram scales to fit). */
export type GeoItem =
  | { t: 'poly'; pts: [number, number][]; fill?: string; labels?: (string | null)[]; color?: string; open?: boolean }
  | { t: 'seg'; a: [number, number]; b: [number, number]; label?: string; dashed?: boolean; arrow?: boolean; color?: string }
  | { t: 'line'; a: [number, number]; b: [number, number]; label?: string; color?: string }
  | { t: 'circle'; c: [number, number]; r: number; label?: string; fill?: string; color?: string }
  | { t: 'arc'; at: [number, number]; from: [number, number]; to: [number, number]; label?: string; right?: boolean; color?: string }
  | { t: 'pt'; p: [number, number]; label?: string; color?: string }
  | { t: 'text'; p: [number, number]; text: string; color?: string; size?: number }
  | { t: 'tick'; a: [number, number]; b: [number, number]; n?: number };

export type ModelSpec =
  | { kind: 'counters'; items: number; label: string }
  | { kind: 'placevalue'; target: number }
  /** Integer number line from `min` (default 0) to `max`; tap where you land. */
  | { kind: 'numberline'; start: number; max: number; min?: number; label: string }
  | { kind: 'array'; rows: number; cols: number; anyOrder?: boolean }
  | { kind: 'fracbar'; pieces: number; label: string }
  | { kind: 'ratiotable'; labels: [string, string]; rows: [number | null, number | null][] }
  /** `example`: a percent shown as a finished worked example on its own dial, apart from the player's dial. */
  | { kind: 'percent'; of: number; label: string; example?: number }
  | { kind: 'power'; bases: number[]; exps: number[] }
  | { kind: 'root'; area: number; cube?: boolean }
  /**
   * Balance scale for a·x + b = c·x + d (integers, a ≠ c). The player applies inverse operations to BOTH
   * sides (buttons offered by the model) until x stands alone; the lock-in value is x.
   */
  | { kind: 'balance'; a: number; b: number; c: number; d: number; label?: string; variable?: string }
  /**
   * Coordinate grid: tap integer lattice points. count 1 → answer "x,y"; count 2 → "x1,y1;x2,y2".
   * `layers` draws what is given (curves, vectors, points) underneath.
   */
  | { kind: 'plot'; range: [number, number, number, number]; count: 1 | 2; label: string; layers?: PlotLayers; arrows?: boolean }
  /** Angle dial 0..max in `step` degrees; answer is the angle in degrees. */
  | { kind: 'angle'; max: 180 | 360; step: number; label: string }
  /** Unit circle with the 16 special angles; tap one; answer is its angle in degrees (0–330). */
  | { kind: 'unitcircle'; label: string; showCoords?: boolean }
  /**
   * General table (or matrix when `bracket`): null cells are inputs. Answer = the blanks in reading
   * order joined with commas, e.g. "5,-2,1/2".
   */
  | { kind: 'table'; cols?: string[]; rowLabels?: string[]; rows: (number | string | null)[][]; label?: string; bracket?: boolean }
  /** Slider from min to max in step; answer is the chosen value. Optional plot above it. */
  | { kind: 'slider'; min: number; max: number; step: number; label: string; unit?: string; layers?: PlotLayers; range?: [number, number, number, number] }
  /** Aid only (no lock-in): Riemann rectangles with a choice of n; shows the running sum. */
  | { kind: 'riemann'; fn: Fn; a: number; b: number; ns: number[]; rule?: 'left' | 'right' | 'mid'; range: [number, number, number, number] }
  /** Aid only (no lock-in): secant lines through (x, f(x)) shrinking toward the tangent. */
  | { kind: 'secant'; fn: Fn; x: number; hs: number[]; range: [number, number, number, number] };

/** Custom judging when a list of exact answers is not enough. */
export type JudgeRule =
  /** Plot count 2: both points lie on y = m·x + b and are different. */
  | { kind: 'on-line'; m: number; b: number }
  /** Plot count 2 (or any ';'-separated answer): the same set of items in any order. */
  | { kind: 'set'; items: string[] };

export interface HookStep { kind: 'hook'; speaker: string; text: string }
export interface TeachStep { kind: 'teach'; title: string; text: string; steps?: string[]; next?: string; visual?: Visual; model?: ModelSpec; lessonId?: string; drill?: { game: string; selection: string; label: string } }
export interface AskStep {
  kind: 'ask';
  /** Wave label shown in the HUD, e.g. "Wave 2 · Ore Slime". */
  wave: string;
  question: Question;
  verb: AcademyVerb;
  model?: ModelSpec;
  choices?: string[];
  options?: { visual: Visual; label: string }[];
  /** Exact answers to accept (normalised); when absent the question's own answer is checked. */
  accept?: string[];
  rule?: JudgeRule;
  /** Model verbs judge the build, so the prompt tells the player what to build. */
  ask?: string;
  /** An interactive helper shown above a typed or chosen answer (no lock-in of its own). */
  aid?: ModelSpec;
}
export type AcademyStep = HookStep | TeachStep | AskStep;

export type RunKind = 'quest' | 'concept' | 'transfer' | 'trial';

export interface AcademyRun {
  kind: RunKind;
  /** Which academy this run belongs to. */
  academyId: string;
  /** Chapter key within that academy. */
  chapter: string;
  questId?: string;
  title: string;
  steps: AcademyStep[];
  index: number;
  asked: number;
  correct: number;
  results: boolean[];
  attempts: number;
  feedback?: { correct: boolean; text: string };
  showExplanation: boolean;
  helperUsed: boolean;
  helperOn: boolean;
  questionStartedAt: number;
  startedAt: number;
  status: 'active' | 'done';
  passed?: boolean;
  /** What changed in the world when the run was won. */
  worldText?: string;
  /** Trial phases, for the phase indicator. */
  phases?: { name: string; from: number }[];
}

export interface ChapterProgress {
  quests: Record<string, number>;
  conceptBest: number;
  conceptAttempts: number;
  conceptPass: boolean;
  transferBest: number;
  transferAttempts: number;
  transferPass: boolean;
  masteredAt?: number;
}

/** One academy's progress, keyed by chapter key. */
export interface TrackProgress {
  chapters: Record<string, ChapterProgress>;
  trial: { attempts: number; best: number; passedAt?: number };
  graduatedAt?: number;
}

export interface AcademyState {
  started: boolean;
  /** Progress per academy id. */
  tracks: Record<string, TrackProgress>;
  run: AcademyRun | null;
  /** The academy the player last opened. */
  current?: string;
}

export const initialChapter = (): ChapterProgress => ({ quests: {}, conceptBest: 0, conceptAttempts: 0, conceptPass: false, transferBest: 0, transferAttempts: 0, transferPass: false });
export const initialTrack = (): TrackProgress => ({ chapters: {}, trial: { attempts: 0, best: 0 } });
export const initialAcademy = (): AcademyState => ({ started: false, tracks: {}, run: null });

/** Chapter keys of the first Arithmetic Academy (v0.30), which stored progress by chapter number. */
const LEGACY_ARITHMETIC = ['count', 'place', 'add', 'sub', 'mult', 'div', 'props', 'frac', 'ratio', 'prop', 'pct', 'exp', 'roots', 'fluency', 'trial'];

/** Bring any saved academy slice (v0.30 single academy, or current) to the current shape. Never throws. */
export function migrateAcademy(raw: unknown): AcademyState {
  const base = initialAcademy();
  if (!raw || typeof raw !== 'object') return base;
  const a = raw as Record<string, unknown>;
  const tracks: Record<string, TrackProgress> = a.tracks && typeof a.tracks === 'object' ? { ...(a.tracks as Record<string, TrackProgress>) } : {};
  // v0.30: { chapters: { '1': … }, trial, graduatedAt } → tracks.arithmetic keyed by chapter key.
  if (a.chapters && typeof a.chapters === 'object' && !tracks.arithmetic) {
    const chapters: Record<string, ChapterProgress> = {};
    for (const [k, v] of Object.entries(a.chapters as Record<string, ChapterProgress>)) {
      const key = /^\d+$/.test(k) ? LEGACY_ARITHMETIC[Number(k) - 1] : k;
      if (key && v) chapters[key] = { ...initialChapter(), ...v };
    }
    const trial = (a.trial as TrackProgress['trial']) ?? { attempts: 0, best: 0 };
    tracks.arithmetic = { chapters, trial: { attempts: trial.attempts ?? 0, best: trial.best ?? 0, passedAt: trial.passedAt }, graduatedAt: a.graduatedAt as number | undefined };
  }
  return { started: !!a.started, tracks, run: null, current: typeof a.current === 'string' ? a.current : undefined };
}
