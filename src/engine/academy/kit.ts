/**
 * Authoring kit for academy content. Content modules (src/engine/academy/content/*.ts) import from
 * here, from '../fn', '../defs' and '../types' — never from '../../questions' (index), which would
 * create an import cycle through the question registry.
 */
import type { Difficulty, Question, Visual } from '../types';
import type { Rng } from '../rng';
import { pictureQuestion } from '../questions/picture';
import type { AcademyVerb, AskStep, JudgeRule, ModelSpec } from './types';
import { academySkill } from './defs';
import type { Fn } from './fn';

export type { Rng, Fn, AskStep, ModelSpec, Visual, Question };
export { academySkill };
export { evalFn, slopeAt, riemann } from './fn';

/* ---------------- random helpers ---------------- */
export const rint = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng.next() * (hi - lo + 1));
export const pick = <T,>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng.next() * arr.length)];
/** A non-zero integer in [lo, hi]. */
export const rnz = (rng: Rng, lo: number, hi: number) => { let v = 0; let g = 0; while (v === 0 && g++ < 50) v = rint(rng, lo, hi); return v || 1; };

/* ---------------- number formatting ---------------- */
/** Display a number: unicode minus, trimmed decimals (max 4 places). */
export const fmt = (n: number): string => { const r = Math.round(n * 1e4) / 1e4; const s = String(Math.abs(r)); return r < 0 ? `−${s}` : s; };
/** Signed term for building expressions: fmtSigned(3) → '+ 3', fmtSigned(-3) → '− 3'. */
export const fmtSigned = (n: number) => (n < 0 ? `− ${fmt(-n)}` : `+ ${fmt(n)}`);
/** Linear term: coefTerm(1,'x') → 'x', coefTerm(-1,'x') → '−x', coefTerm(3,'x') → '3x'. */
export const coefTerm = (c: number, v: string) => (c === 1 ? v : c === -1 ? `−${v}` : `${fmt(c)}${v}`);
/** A polynomial in x from coefficients low→high, e.g. [1, -3, 2] → '2x² − 3x + 1'. */
export function polyStr(c: number[], v = 'x'): string {
  const sup = (k: number) => (k === 1 ? '' : String(k).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]));
  const terms: string[] = [];
  for (let k = c.length - 1; k >= 0; k--) {
    const a = c[k]; if (!a) continue;
    const body = k === 0 ? fmt(Math.abs(a)) : `${Math.abs(a) === 1 ? '' : fmt(Math.abs(a))}${v}${sup(k)}`;
    terms.push(terms.length === 0 ? (a < 0 ? `−${body}` : body) : `${a < 0 ? '− ' : '+ '}${body}`);
  }
  return terms.length ? terms.join(' ') : '0';
}
export const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export const lcm = (a: number, b: number) => Math.abs(a * b) / gcd(a, b);
/** Reduced fraction [n, d] with d > 0. */
export const simplify = (n: number, d: number): [number, number] => { const g = gcd(n, d); const s = d < 0 ? -1 : 1; return [(s * n) / g, (s * d) / g]; };
/** '3/4', '−1/2', or '2' when the denominator is 1. */
export const fracStr = (n: number, d: number) => { const [a, b] = simplify(n, d); return b === 1 ? fmt(a) : `${a < 0 ? '−' : ''}${Math.abs(a)}/${b}`; };

/* ---------------- questions ---------------- */
export interface QSpec {
  prompt: string;
  /** Short line shown big, e.g. '3x + 5 = 20' or 'Find the slope'. */
  expression: string;
  /** Numeric answer (for choose/pickmodel steps this can be an index; set answerText to the right choice). */
  answer: number;
  hint: string;
  /** Worked solution, one step per line; the first line is shown after a final miss. */
  steps: string[];
  visual?: Visual;
  difficulty?: Difficulty;
  /** How to display the answer when it is not a plain number ('x = 4', 'π/3', '(2, −1)'). */
  answerText?: string;
  fraction?: boolean;
  decimal?: boolean;
  negative?: boolean;
  tolerance?: number;
  unit?: string;
  /** One line: where an engineer meets this. */
  app?: string;
}

/**
 * A question recorded under `skill` (use academySkill(academyId, chapterKey)). Typed answers are
 * numeric: fractions like 3/4, decimals, negatives. Symbolic answers must use choose/pickmodel.
 */
export function mkq(skill: string, subtopic: string, o: QSpec): Question {
  return pictureQuestion(`acad-${skill.replace(/\W+/g, '-')}`, 'Academy', skill, subtopic, {
    prompt: o.prompt, expression: o.expression, answer: o.answer, unit: o.unit, difficulty: o.difficulty ?? 3,
    hint: o.hint, steps: o.steps, visual: o.visual ?? { type: 'none' }, tolerance: o.tolerance,
    decimal: o.decimal, fraction: o.fraction, negative: o.negative, answerText: o.answerText,
    app: o.app ?? 'Engineers use this every day.', prereq: [],
  });
}

export function ask(question: Question, verb: AcademyVerb, extra: Partial<AskStep> = {}): AskStep {
  return { kind: 'ask', wave: '', question, verb, ...extra };
}
/** Typed numeric answer. */
export const typed = (q: Question, extra: Partial<AskStep> = {}) => ask(q, 'type', extra);
/**
 * Multiple choice: `right` plus distinct `wrong` options (normalised duplicates of the right answer
 * are dropped), shuffled. Exactly one choice is accepted.
 */
/** Choices that name the same number (0.5, 1/2, .50) count as the same choice. */
function choiceKey(c: string): string {
  const k = normAnswer(c);
  const m = /^(-?)(\d*\.?\d+)(?:\/(\d*\.?\d+))?$/.exec(k);
  if (!m) return k;
  const v = Number(m[2]) / (m[3] ? Number(m[3]) : 1);
  return Number.isFinite(v) ? `n:${Math.round((m[1] ? -v : v) * 1e9) / 1e9}` : k;
}
export function choose(rng: Rng, q: Question, right: string, wrong: string[], extra: Partial<AskStep> = {}): AskStep {
  const seen = new Set([choiceKey(right)]); const opts = [right];
  for (const w of wrong) { const k = choiceKey(w); if (!seen.has(k)) { seen.add(k); opts.push(w); } if (opts.length >= 4) break; }
  return ask({ ...q, answerText: q.answerText ?? right }, 'choose', { choices: rng.shuffle(opts), accept: [right], ...extra });
}
/** Pick the matching picture: `right` is the label of the correct option. */
export function pickModel(rng: Rng, q: Question, options: { visual: Visual; label: string }[], right: string, extra: Partial<AskStep> = {}): AskStep {
  return ask({ ...q, answerText: q.answerText ?? right }, 'pickmodel', { options: rng.shuffle(options), accept: [right], ...extra });
}
/** A hands-on model answer. `accept` lists what the model produces when built right. */
export function model(q: Question, m: ModelSpec, accept: string[] | undefined, askLine: string, extra: Partial<AskStep> & { rule?: JudgeRule } = {}): AskStep {
  return ask(q, m.kind as AcademyVerb, { model: m, accept, ask: askLine, ...extra });
}
/** Distinct numeric wrong answers near `answer` (never equal to it), formatted with fmt. */
export function nearMisses(rng: Rng, answer: number, spread = 3, count = 3, step = 1): string[] {
  const out = new Set<string>(); let g = 0;
  while (out.size < count && g++ < 80) { const d = rint(rng, 1, spread) * step * (rng.next() < 0.5 ? -1 : 1); const v = Math.round((answer + d) * 1e4) / 1e4; if (v !== answer) out.add(fmt(v)); }
  return [...out];
}

/** The same normalisation the judge uses: lower case, no spaces, unicode minus and × folded. */
export const normAnswer = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '').replace(/×/g, 'x').replace(/[−–]/g, '-');

/* ---------------- waves ---------------- */
export const wave = (name: string, build: (rng: Rng) => AskStep[]) => ({ name, build });
export const times = (k: number, f: (rng: Rng) => AskStep) => (rng: Rng) => Array.from({ length: k }, () => f(rng));
export const mixOf = (fs: ((rng: Rng) => AskStep)[]) => (rng: Rng) => fs.map((f) => f(rng));
/** Three concept items drawn from model-based builders. */
export const conceptFrom = (fs: ((rng: Rng) => AskStep)[]) => (rng: Rng): AskStep[] => rng.shuffle(fs).slice(0, 3).map((f) => f(rng));
/** A transfer builder that picks one of several builders. */
export const oneOf = (fs: ((rng: Rng) => AskStep)[]) => (rng: Rng): AskStep => pick(rng, fs)(rng);
