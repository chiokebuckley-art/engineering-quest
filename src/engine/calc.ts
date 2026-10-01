/**
 * The scientific calculator behind the in-game Calculator panel: a small recursive-descent parser (no eval).
 * Supports + − × ÷ ^, brackets, implied multiplication (2π, 3(4), 2sin 30), sin cos tan and their inverses,
 * ln, log (base 10), √, π and e. Angles are in degrees unless `radians` is set.
 */
export type CalcResult = { ok: true; value: number } | { ok: false; error: string };

const FUNCS = ['asin', 'acos', 'atan', 'sin', 'cos', 'tan', 'ln', 'log', 'sqrt'] as const;
type Fn = (typeof FUNCS)[number];
type Tok = { t: 'num'; v: number } | { t: 'op'; v: string } | { t: 'fn'; v: Fn } | { t: '(' } | { t: ')' };

/** Normalise display symbols to parser tokens. */
function clean(src: string): string {
  return src
    .replace(/sin⁻¹/g, 'asin').replace(/cos⁻¹/g, 'acos').replace(/tan⁻¹/g, 'atan')
    .replace(/√/g, 'sqrt').replace(/π/g, '(pi)').replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-')
    .replace(/\s+/g, '').toLowerCase();
}

function tokenize(src: string): Tok[] | string {
  const s = clean(src); const out: Tok[] = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[\d.]/.test(c)) {
      let j = i; while (j < s.length && /[\d.]/.test(s[j])) j++;
      const txt = s.slice(i, j); if ((txt.match(/\./g) ?? []).length > 1 || txt === '.') return `Bad number "${txt}"`;
      out.push({ t: 'num', v: Number(txt) }); i = j; continue;
    }
    if ('+-*/^'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue; }
    if (c === '(') { out.push({ t: '(' }); i++; continue; }
    if (c === ')') { out.push({ t: ')' }); i++; continue; }
    if (s.startsWith('pi', i)) { out.push({ t: 'num', v: Math.PI }); i += 2; continue; }
    const fn = FUNCS.find((f) => s.startsWith(f, i));
    if (fn) { out.push({ t: 'fn', v: fn }); i += fn.length; continue; }
    if (c === 'e') { out.push({ t: 'num', v: Math.E }); i++; continue; }
    return `Unknown symbol "${c}"`;
  }
  // implied multiplication: 2π, 2(3), (2)(3), 2sin30, )4
  const withMul: Tok[] = [];
  for (const tk of out) {
    const prev = withMul[withMul.length - 1];
    const prevEnds = prev && (prev.t === 'num' || prev.t === ')');
    const startsValue = tk.t === 'num' || tk.t === '(' || tk.t === 'fn';
    if (prevEnds && startsValue) withMul.push({ t: 'op', v: '*' });
    withMul.push(tk);
  }
  return withMul;
}

export function evaluate(src: string, radians = false): CalcResult {
  if (!src.trim()) return { ok: false, error: 'Type a calculation' };
  const toks = tokenize(src);
  if (typeof toks === 'string') return { ok: false, error: toks };
  let p = 0;
  const peek = () => toks[p];
  const toRad = (x: number) => (radians ? x : (x * Math.PI) / 180);
  const fromRad = (x: number) => (radians ? x : (x * 180) / Math.PI);
  const apply = (f: Fn, x: number): number => {
    switch (f) {
      case 'sin': return Math.sin(toRad(x));
      case 'cos': return Math.cos(toRad(x));
      case 'tan': return Math.tan(toRad(x));
      case 'asin': return fromRad(Math.asin(x));
      case 'acos': return fromRad(Math.acos(x));
      case 'atan': return fromRad(Math.atan(x));
      case 'ln': return Math.log(x);
      case 'log': return Math.log10(x);
      case 'sqrt': return Math.sqrt(x);
    }
  };
  // expr := term (('+'|'-') term)*  ; term := unary (('*'|'/') unary)* ; unary := '-' unary | power
  // power := atom ('^' unary)?      ; atom := num | '(' expr ')' | fn atom-or-unary
  function expr(): number {
    let v = term();
    for (let t = peek(); t && t.t === 'op' && (t.v === '+' || t.v === '-'); t = peek()) { p++; const r = term(); v = t.v === '+' ? v + r : v - r; }
    return v;
  }
  function term(): number {
    let v = unary();
    for (let t = peek(); t && t.t === 'op' && (t.v === '*' || t.v === '/'); t = peek()) { p++; const r = unary(); v = t.v === '*' ? v * r : v / r; }
    return v;
  }
  function unary(): number {
    const t = peek();
    if (t && t.t === 'op' && (t.v === '-' || t.v === '+')) { p++; const v = unary(); return t.v === '-' ? -v : v; }
    return power();
  }
  function power(): number {
    const base = atom();
    const t = peek();
    if (t && t.t === 'op' && t.v === '^') { p++; return base ** unary(); }
    return base;
  }
  function atom(): number {
    const t = peek();
    if (!t) throw new Error('Unfinished calculation');
    if (t.t === 'num') { p++; return t.v; }
    if (t.t === '(') { p++; const v = expr(); if (peek()?.t !== ')') throw new Error('Missing )'); p++; return v; }
    if (t.t === 'fn') { p++; return apply(t.v, unary()); }
    throw new Error(t.t === ')' ? 'Unexpected )' : `Unexpected ${t.v}`);
  }
  try {
    const v = expr();
    if (p < toks.length) return { ok: false, error: 'Check the brackets' };
    if (!Number.isFinite(v)) return { ok: false, error: 'Not a real number' };
    return { ok: true, value: v };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** A readable result: up to 8 significant digits, no float noise. */
export function formatResult(v: number): string {
  if (Math.abs(v) < 1e-12) return '0';
  const r = Number(v.toPrecision(10));
  const s = Math.abs(r) >= 1e9 || Math.abs(r) < 1e-6 ? r.toExponential(6) : String(Number(r.toPrecision(8)));
  return s.replace('-', '−');
}
