/**
 * Function specs: plain data (so they survive saving and syncing) that the plot visual, the secant and
 * Riemann aids and question builders can all evaluate. Keep them simple and serialisable.
 */
export type Fn =
  /** c[0] + c[1]·x + c[2]·x² + … */
  | { kind: 'poly'; c: number[] }
  /** a · base^x + k */
  | { kind: 'exp'; a: number; base: number; k?: number }
  /** a · log_base(x − h) + k  (base e when base is 0) */
  | { kind: 'log'; a: number; base: number; h?: number; k?: number }
  /** amp · sin(freq·x + phase) + shift, x in radians (or degrees when deg is true) */
  | { kind: 'sin' | 'cos' | 'tan'; amp?: number; freq?: number; phase?: number; shift?: number; deg?: boolean }
  /** (num polynomial) / (den polynomial) */
  | { kind: 'rational'; num: number[]; den: number[] }
  /** a · |x − h| + k */
  | { kind: 'abs'; a?: number; h?: number; k?: number }
  /** a · √(x − h) + k */
  | { kind: 'sqrt'; a?: number; h?: number; k?: number }
  /** piecewise by x-intervals: [from, to) → fn */
  | { kind: 'piece'; parts: { from: number; to: number; fn: Fn }[] };

const polyAt = (c: number[], x: number) => c.reduceRight((acc, k) => acc * x + k, 0);

/** Evaluate a function spec; NaN where it is undefined. */
export function evalFn(f: Fn, x: number): number {
  switch (f.kind) {
    case 'poly': return polyAt(f.c, x);
    case 'exp': return f.a * f.base ** x + (f.k ?? 0);
    case 'log': { const u = x - (f.h ?? 0); if (u <= 0) return NaN; const ln = Math.log(u); return f.a * (f.base ? ln / Math.log(f.base) : ln) + (f.k ?? 0); }
    case 'sin': case 'cos': case 'tan': {
      const t = (f.freq ?? 1) * x + (f.phase ?? 0); const r = f.deg ? (t * Math.PI) / 180 : t;
      const v = f.kind === 'sin' ? Math.sin(r) : f.kind === 'cos' ? Math.cos(r) : Math.tan(r);
      return (f.amp ?? 1) * v + (f.shift ?? 0);
    }
    case 'rational': { const d = polyAt(f.den, x); return Math.abs(d) < 1e-12 ? NaN : polyAt(f.num, x) / d; }
    case 'abs': return (f.a ?? 1) * Math.abs(x - (f.h ?? 0)) + (f.k ?? 0);
    case 'sqrt': { const u = x - (f.h ?? 0); return u < 0 ? NaN : (f.a ?? 1) * Math.sqrt(u) + (f.k ?? 0); }
    case 'piece': { const p = f.parts.find((q) => x >= q.from && x < q.to) ?? (f.parts.length && x === f.parts[f.parts.length - 1].to ? f.parts[f.parts.length - 1] : undefined); return p ? evalFn(p.fn, x) : NaN; }
  }
}

/** Numerical derivative (central difference). */
export const slopeAt = (f: Fn, x: number, h = 1e-4) => (evalFn(f, x + h) - evalFn(f, x - h)) / (2 * h);

/** Riemann sum with n rectangles on [a, b]. */
export function riemann(f: Fn, a: number, b: number, n: number, rule: 'left' | 'right' | 'mid' = 'left'): number {
  const dx = (b - a) / n; let s = 0;
  for (let i = 0; i < n; i++) { const x = a + dx * (rule === 'left' ? i : rule === 'right' ? i + 1 : i + 0.5); s += evalFn(f, x) * dx; }
  return s;
}

/** Sample points for drawing, splitting at breaks (asymptotes, undefined stretches). */
export function sampleFn(f: Fn, x0: number, x1: number, n = 160, yLimit = 1e6): [number, number][][] {
  const out: [number, number][][] = []; let cur: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n; const y = evalFn(f, x);
    if (!Number.isFinite(y) || Math.abs(y) > yLimit) { if (cur.length > 1) out.push(cur); cur = []; continue; }
    if (cur.length && Math.abs(y - cur[cur.length - 1][1]) > yLimit / 10) { if (cur.length > 1) out.push(cur); cur = []; }
    cur.push([x, y]);
  }
  if (cur.length > 1) out.push(cur);
  return out;
}
