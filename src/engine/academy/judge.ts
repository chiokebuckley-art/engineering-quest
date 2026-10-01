/**
 * Judging academy answers, plus the checks the tests and the content sampler use: what a right
 * answer looks like for a step, and whether its hands-on model can actually produce it.
 */
import { checkAnswer, answerLabel, parseGiven } from '../questions';
import type { AskStep, ModelSpec, JudgeRule } from './types';

export const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '').replace(/×/g, 'x').replace(/[−–]/g, '-');

const num = (s: string) => parseGiven(s);
const pt = (s: string): [number, number] | null => { const m = /^\(?(-?[\d./]+),(-?[\d./]+)\)?$/.exec(norm(s)); if (!m) return null; const x = num(m[1]); const y = num(m[2]); return x === null || y === null ? null : [x, y]; };

function ruleOk(rule: JudgeRule, given: string): boolean {
  const parts = norm(given).split(';').filter(Boolean);
  if (rule.kind === 'set') {
    const want = rule.items.map(norm).sort(); const got = [...parts].sort();
    return want.length === got.length && want.every((w, i) => w === got[i]);
  }
  // on-line: two distinct lattice points on y = m x + b
  if (parts.length !== 2) return false;
  const p = pt(parts[0]); const q = pt(parts[1]);
  if (!p || !q || (p[0] === q[0] && p[1] === q[1])) return false;
  return [p, q].every(([x, y]) => Math.abs(rule.m * x + rule.b - y) < 1e-9);
}

/** Comma lists of numbers match when every entry is numerically equal (1/2 = 0.5 = .50). */
function sameNumbers(want: string, given: string): boolean {
  const a = norm(want).split(','); const b = norm(given).split(',');
  if (a.length !== b.length || !a.every((v) => /^-?[\d.]+(\/\d+)?$/.test(v)) || !b.every((v) => /^-?(\d+\.?\d*|\.\d+)(\/\d+)?$/.test(v))) return false;
  return a.every((v, i) => { const x = num(v); const y = num(b[i].startsWith('.') ? `0${b[i]}` : b[i].startsWith('-.') ? `-0${b[i].slice(1)}` : b[i]); return x !== null && y !== null && Math.abs(x - y) < 1e-9; });
}
const NUMERIC_ENTRY = new Set(['type', 'table', 'ratiotable', 'slider']);

export function judge(step: AskStep, given: string): boolean {
  if (step.rule) return ruleOk(step.rule, given);
  if (step.accept) return step.accept.map(norm).includes(norm(given)) || (NUMERIC_ENTRY.has(step.verb) && step.accept.some((a) => sameNumbers(a, given)));
  return checkAnswer(step.question, given);
}

/** Lattice points on y = m x + b inside a plot range. */
function linePoints(m: number, b: number, range: [number, number, number, number]): [number, number][] {
  const out: [number, number][] = [];
  for (let x = Math.ceil(range[0]); x <= range[1]; x++) { const y = m * x + b; if (Number.isInteger(Math.round(y * 1e9) / 1e9) && y >= range[2] && y <= range[3]) out.push([x, Math.round(y)]); }
  return out;
}

/** What a player who knows the answer submits for this step. */
export function rightAnswer(step: AskStep): string {
  if (step.rule?.kind === 'on-line' && step.model?.kind === 'plot') { const ps = linePoints(step.rule.m, step.rule.b, step.model.range); return ps.length >= 2 ? `${ps[0][0]},${ps[0][1]};${ps[1][0]},${ps[1][1]}` : 'none'; }
  if (step.rule?.kind === 'set') return step.rule.items.join(';');
  if (step.accept?.length) return step.accept[0];
  return answerLabel(step.question);
}
/** Something clearly wrong for this step. */
export function wrongAnswer(step: AskStep): string {
  if (step.rule || step.accept) return 'zzz';
  return String(step.question.answer + 1);
}

/** Can the step's model produce `answer`? Returns a reason when it cannot, or null when fine. */
export function modelProblem(step: AskStep): string | null {
  const m = step.model; if (!m) return null;
  const answers = step.rule?.kind === 'on-line' ? [] : step.rule?.kind === 'set' ? [step.rule.items.join(';')] : step.accept ?? [answerLabel(step.question)];
  const isInt = (s: string) => /^-?\d+$/.test(norm(s));
  const within = (v: number, lo: number, hi: number) => v >= lo - 1e-9 && v <= hi + 1e-9;
  const every = (f: (a: string) => boolean) => answers.every(f);
  switch (m.kind) {
    case 'counters': return every((a) => isInt(a) && within(Number(a), 1, m.items)) ? null : 'counters can only count 1..items';
    case 'placevalue': return every((a) => isInt(a) && within(Number(a), 1, 99)) ? null : 'place-value plates build 1..99';
    case 'numberline': return every((a) => isInt(a) && within(Number(norm(a)), m.min ?? 0, Math.max(m.max, 10))) ? null : 'answer is off the number line';
    case 'array': { const size = Math.max(5, Math.min(12, Math.max(m.rows, m.cols) + 1)); return every((a) => { const x = /^(\d+)x(\d+)$/.exec(norm(a)); return !!x && Number(x[1]) <= size && Number(x[2]) <= size; }) ? null : 'array answer must be "RxC" within the grid'; }
    case 'fracbar': return every((a) => { const x = /^(\d+)\/(\d+)$/.exec(norm(a)); return !!x && Number(x[2]) === m.pieces && within(Number(x[1]), 1, m.pieces); }) ? null : 'fraction bar answers are "n/pieces"';
    case 'ratiotable': { const blanks = m.rows.flat().filter((v) => v === null).length; return every((a) => norm(a).split(',').length === blanks) ? null : 'one answer per blank cell'; }
    case 'table': { const blanks = m.rows.flat().filter((v) => v === null).length; return every((a) => norm(a).split(',').length === blanks && norm(a).split(',').every((v) => /^-?[\d./]+$/.test(v))) ? null : 'table answers: one number per blank, comma separated'; }
    case 'percent': return every((a) => { const v = num(a); if (v === null) return false; const segs = (v / m.of) * 20; return Math.abs(segs - Math.round(segs)) < 1e-9 && within(Math.round(segs), 1, 20); }) ? null : 'percent dial moves in 5% steps';
    case 'power': return every((a) => { const x = /^(-?\d+)\^(\d+)$/.exec(norm(a)); return !!x && m.bases.includes(Number(x[1])) && m.exps.includes(Number(x[2])); }) ? null : 'power answer must be "base^exp" from the offered buttons';
    case 'root': return every((a) => isInt(a) && within(Number(a), 1, 12) && Number(a) ** (m.cube ? 3 : 2) === m.area) ? null : 'root panel offers sides 1..12 whose square (cube) is the area';
    case 'balance': {
      if (m.a === m.c) return 'balance needs a ≠ c';
      const x = (m.d - m.b) / (m.a - m.c);
      return every((a) => { const v = num(a); return v !== null && Math.abs(v - x) < 1e-9; }) ? null : `balance solves to x = ${x}`;
    }
    case 'plot': {
      const [x0, x1, y0, y1] = m.range;
      if (step.rule?.kind === 'on-line') return linePoints(step.rule.m, step.rule.b, m.range).length >= 2 ? null : 'fewer than two lattice points of the line are on the grid';
      return every((a) => { const ps = norm(a).split(';'); return ps.length === m.count && ps.every((p) => { const q = pt(p); return !!q && Number.isInteger(q[0]) && Number.isInteger(q[1]) && within(q[0], x0, x1) && within(q[1], y0, y1); }); }) ? null : 'plot answers are lattice points "x,y" inside the range';
    }
    case 'angle': return every((a) => isInt(a) && Number(a) % m.step === 0 && within(Number(a), 0, m.max)) ? null : 'angle must be a multiple of step within 0..max';
    case 'unitcircle': return every((a) => isInt(a) && [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330].includes(Number(a))) ? null : 'unit circle answers are special angles 0..330 in degrees';
    case 'slider': return every((a) => { const v = num(a); if (v === null) return false; const k = (v - m.min) / m.step; return within(v, m.min, m.max) && Math.abs(k - Math.round(k)) < 1e-6; }) ? null : 'slider value must be on a step within min..max';
    case 'riemann': case 'secant': return 'riemann and secant are aids, not answer models (use them as `aid`)';
    default: return `unknown model ${(m as ModelSpec).kind}`;
  }
}
