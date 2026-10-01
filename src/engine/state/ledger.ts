import type { Question } from '../types';
import type { ArcadeGame, ArcadeMode } from './types';
import { parseDivFact, parseMultFact } from '../curriculum/facts';
import { parseSelection } from './arcade';
import { speedKey, speedLabel } from './speed';

/**
 * The arcade ledger: every first answer in Practice, Blitz, Speed and Conquer, filed by day, by game
 * (the kind of math), by mode and by the number it was about (6 × 7, 42 ÷ 7, or a skill for open-ended
 * games), plus every completed run with its clock. It is what the progress graphs read from.
 */
export interface LedgerCell { n: number; right: number; ms: number }
export interface LedgerTotal extends LedgerCell { lastAt: number; /** consecutive misses, reset by a right answer */ wrongStreak: number }
export interface LedgerRun {
  at: number; game: ArcadeGame; mode: ArcadeMode; selection: string;
  /** Blitz: the clock length. Speed: the per-question clock. Otherwise 0. */
  clockMs: number;
  n: number; right: number; wrong: number; score: number;
  /** How long the run took, ms. */
  durationMs: number;
  /** Speed: passed the clock. Conquer: finished. */
  passed?: boolean;
}
export interface LedgerStats {
  /** day (YYYY-MM-DD, local) → `${game}|${mode}|${key}` → cell */
  days: Record<string, Record<string, LedgerCell>>;
  /** `${game}|${key}` → lifetime totals */
  totals: Record<string, LedgerTotal>;
  runs: LedgerRun[];
}

export const LEDGER_DAYS_KEPT = 180;
export const LEDGER_RUNS_KEPT = 400;
export const initialLedger = (): LedgerStats => ({ days: {}, totals: {}, runs: [] });

/** Local calendar day, so a late-night session lands on the day the learner thinks it is. */
export const ledgerDay = (t: number): string => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dayStart = (t: number): number => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const cellKey = (game: ArcadeGame, mode: ArcadeMode, key: string) => `${game}|${mode}|${key}`;
const splitCell = (k: string): { game: ArcadeGame; mode: ArcadeMode; key: string } => { const i = k.indexOf('|'); const j = k.indexOf('|', i + 1); return { game: k.slice(0, i) as ArcadeGame, mode: k.slice(i + 1, j) as ArcadeMode, key: k.slice(j + 1) }; };
const add = (c: LedgerCell | undefined, correct: boolean, ms: number): LedgerCell => ({ n: (c?.n ?? 0) + 1, right: (c?.right ?? 0) + (correct ? 1 : 0), ms: (c?.ms ?? 0) + ms });

export function recordLedger(st: LedgerStats, q: Question, game: ArcadeGame, mode: ArcadeMode, correct: boolean, ms: number, now: number): LedgerStats {
  const key = speedKey(q);
  const day = ledgerDay(now);
  const ck = cellKey(game, mode, key);
  const dayCells = { ...(st.days[day] ?? {}), [ck]: add(st.days[day]?.[ck], correct, ms) };
  const tk = `${game}|${key}`;
  const prev = st.totals[tk];
  const total: LedgerTotal = { ...add(prev, correct, ms), lastAt: now, wrongStreak: correct ? 0 : (prev?.wrongStreak ?? 0) + 1 };
  let days = { ...st.days, [day]: dayCells };
  // Prune days that have aged out, so the ledger stays a bounded size.
  const cutoff = ledgerDay(now - LEDGER_DAYS_KEPT * 86_400_000);
  if (Object.keys(days).some((d) => d < cutoff)) days = Object.fromEntries(Object.entries(days).filter(([d]) => d >= cutoff));
  return { ...st, days, totals: { ...st.totals, [tk]: total } };
}

export function recordLedgerRun(st: LedgerStats, run: LedgerRun): LedgerStats {
  if (run.n <= 0) return st;
  return { ...st, runs: [...st.runs, run].slice(-LEDGER_RUNS_KEPT) };
}

/* ---------------------------------------------------------------- */
/* Queries                                                           */
/* ---------------------------------------------------------------- */

export interface LedgerFilter {
  game?: ArcadeGame;
  mode?: ArcadeMode | 'all';
  /** Only these number keys (fact ids or `skill:` keys); undefined = everything. */
  keys?: Set<string>;
  /** Only keys with this prefix (for open-ended games: `skill:volume`). */
  skillPrefixes?: string[];
}
const matches = (f: LedgerFilter, c: { game: ArcadeGame; mode: ArcadeMode; key: string }): boolean => {
  if (f.game && c.game !== f.game) return false;
  if (f.mode && f.mode !== 'all' && c.mode !== f.mode) return false;
  if (f.keys && !f.keys.has(c.key)) {
    if (!f.skillPrefixes?.length) return false;
    if (!f.skillPrefixes.some((p) => c.key === `skill:${p}` || c.key.startsWith(`skill:${p}.`))) return false;
  }
  return true;
};

/** The number keys a selection covers: its fact pool, or skill prefixes for open-ended games. */
export function selectionKeys(game: ArcadeGame, selectionKey: string): { keys?: Set<string>; skillPrefixes?: string[] } {
  const sel = parseSelection(game, selectionKey);
  if (sel.facts.length) return { keys: new Set(sel.facts), skillPrefixes: sel.skillIds };
  if (game === 'mixed') return {};
  return { keys: new Set(), skillPrefixes: sel.skillIds };
}

export interface DayPoint { day: string; right: number; wrong: number; ms: number }
/** One point per calendar day for the last `days` days (zeros included), oldest first. `days` = 0 means every day on record. */
export function ledgerSeries(st: LedgerStats, f: LedgerFilter, days: number, now: number): DayPoint[] {
  const out: DayPoint[] = [];
  const have = Object.keys(st.days).sort();
  let first: number;
  if (days > 0) first = dayStart(now) - (days - 1) * 86_400_000;
  else if (have.length) { const [y, m, d] = have[0].split('-').map(Number); first = new Date(y, m - 1, d).getTime(); }
  else first = dayStart(now);
  for (let t = first; t <= now; t += 86_400_000) {
    const day = ledgerDay(t);
    const cells = st.days[day];
    let right = 0; let wrong = 0; let ms = 0;
    if (cells) for (const [k, c] of Object.entries(cells)) if (matches(f, splitCell(k))) { right += c.right; wrong += c.n - c.right; ms += c.ms; }
    out.push({ day, right, wrong, ms });
  }
  return out;
}

export interface LedgerRow { key: string; label: string; n: number; right: number; wrong: number; accuracy: number; avgMs: number }
const toRow = (key: string, label: string, c: LedgerCell): LedgerRow => ({ key, label, n: c.n, right: c.right, wrong: c.n - c.right, accuracy: c.n ? Math.round((c.right / c.n) * 100) : 0, avgMs: c.n ? Math.round(c.ms / c.n) : 0 });
/** Weakest first: lowest accuracy, then most misses. Ties broken so the list is stable. */
const weakestFirst = (a: LedgerRow, b: LedgerRow) => a.accuracy - b.accuracy || b.wrong - a.wrong || b.n - a.n || a.label.localeCompare(b.label);

/** Totals within the last `days` days (0 = all time), summed from the day cells. */
function sumCells(st: LedgerStats, f: LedgerFilter, days: number, now: number, by: (c: { game: ArcadeGame; mode: ArcadeMode; key: string }) => string | null): Record<string, LedgerCell> {
  const cutoff = days > 0 ? ledgerDay(dayStart(now) - (days - 1) * 86_400_000) : '';
  const acc: Record<string, LedgerCell> = {};
  for (const [day, cells] of Object.entries(st.days)) {
    if (day < cutoff) continue;
    for (const [k, c] of Object.entries(cells)) {
      const parts = splitCell(k);
      if (!matches(f, parts)) continue;
      const g = by(parts); if (g === null) continue;
      const p = acc[g]; acc[g] = { n: (p?.n ?? 0) + c.n, right: (p?.right ?? 0) + c.right, ms: (p?.ms ?? 0) + c.ms };
    }
  }
  return acc;
}

/** Broken down by the number: one row per fact (or skill), weakest first. */
export function ledgerByNumber(st: LedgerStats, f: LedgerFilter, days: number, now: number): LedgerRow[] {
  const cells = sumCells(st, f, days, now, (c) => c.key);
  return Object.entries(cells).map(([k, c]) => toRow(k, speedLabel(k), c)).sort(weakestFirst);
}

/** Broken down by the math: one row per arcade game. */
export function ledgerByGame(st: LedgerStats, f: LedgerFilter, days: number, now: number, label: (g: ArcadeGame) => string): LedgerRow[] {
  const cells = sumCells(st, f, days, now, (c) => c.game);
  return Object.entries(cells).map(([g, c]) => toRow(g, label(g as ArcadeGame), c)).sort((a, b) => b.n - a.n);
}

/** Broken down by mode: Practice, Blitz, Speed, Conquer. */
export function ledgerByMode(st: LedgerStats, f: LedgerFilter, days: number, now: number): LedgerRow[] {
  const cells = sumCells(st, f, days, now, (c) => c.mode);
  const order: ArcadeMode[] = ['practice', 'blitz', 'speed', 'conquer'];
  return order.filter((m) => cells[m]).map((m) => toRow(m, m, cells[m]));
}

/** Times tables 1–12 (multiplication) or divisors 2–12 (division): 6 × 7 counts for the 6s and the 7s. */
export function ledgerByTable(st: LedgerStats, f: LedgerFilter, days: number, now: number): LedgerRow[] {
  const cells: Record<string, LedgerCell> = {};
  const bump = (t: number, c: LedgerCell) => { const p = cells[t]; cells[t] = { n: (p?.n ?? 0) + c.n, right: (p?.right ?? 0) + c.right, ms: (p?.ms ?? 0) + c.ms }; };
  const cutoff = days > 0 ? ledgerDay(dayStart(now) - (days - 1) * 86_400_000) : '';
  for (const [day, dc] of Object.entries(st.days)) {
    if (day < cutoff) continue;
    for (const [k, c] of Object.entries(dc)) {
      const parts = splitCell(k); if (!matches(f, parts)) continue;
      const m = parseMultFact(parts.key); const d = parseDivFact(parts.key);
      if (m) { bump(m.a, c); if (m.b !== m.a) bump(m.b, c); } else if (d) bump(d.divisor, c);
    }
  }
  return Object.entries(cells).map(([t, c]) => toRow(`table:${t}`, f.game === 'div' ? `÷ ${t}` : `× ${t}`, c)).sort((a, b) => Number(a.key.slice(6)) - Number(b.key.slice(6)));
}

export function ledgerSummary(st: LedgerStats, f: LedgerFilter, days: number, now: number): LedgerRow {
  const cells = sumCells(st, f, days, now, () => 'all');
  return toRow('all', 'all', cells.all ?? { n: 0, right: 0, ms: 0 });
}

/** Runs for a game and selection (any mode, or one), newest first. */
export const ledgerRuns = (st: LedgerStats, game: ArcadeGame, selectionKey: string, mode: ArcadeMode | 'all' = 'all'): LedgerRun[] =>
  st.runs.filter((r) => r.game === game && r.selection === selectionKey && (mode === 'all' || r.mode === mode)).slice().reverse();

/** Numbers that keep going wrong: three or more misses in a row, most recent first. */
export function troubleSpots(st: LedgerStats, game?: ArcadeGame, limit = 8): (LedgerRow & { game: ArcadeGame; wrongStreak: number })[] {
  return Object.entries(st.totals)
    .map(([k, t]) => { const i = k.indexOf('|'); const g = k.slice(0, i) as ArcadeGame; const key = k.slice(i + 1); return { ...toRow(key, speedLabel(key), t), game: g, wrongStreak: t.wrongStreak, lastAt: t.lastAt }; })
    .filter((r) => (!game || r.game === game) && (r.wrongStreak >= 2 || (r.n >= 4 && r.accuracy < 60)))
    .sort((a, b) => b.wrongStreak - a.wrongStreak || a.accuracy - b.accuracy || b.lastAt - a.lastAt)
    .slice(0, limit);
}

/** Everything as CSV: daily cells, lifetime totals, and runs. */
export function ledgerCsv(st: LedgerStats): string {
  const esc = (v: string | number) => (typeof v === 'number' ? String(v) : `"${v.replace(/"/g, '""')}"`);
  const lines: string[] = ['days', 'day,game,mode,key,label,answered,right,wrong,avg_ms'];
  for (const day of Object.keys(st.days).sort()) for (const [k, c] of Object.entries(st.days[day])) { const p = splitCell(k); lines.push([day, p.game, p.mode, p.key, speedLabel(p.key), c.n, c.right, c.n - c.right, Math.round(c.ms / c.n)].map(esc).join(',')); }
  lines.push('', 'totals', 'game,key,label,answered,right,wrong,avg_ms,wrong_streak,last_at');
  for (const [k, t] of Object.entries(st.totals)) { const i = k.indexOf('|'); lines.push([k.slice(0, i), k.slice(i + 1), speedLabel(k.slice(i + 1)), t.n, t.right, t.n - t.right, Math.round(t.ms / t.n), t.wrongStreak, new Date(t.lastAt).toISOString()].map(esc).join(',')); }
  lines.push('', 'runs', 'at,game,mode,selection,clock_ms,questions,right,wrong,score,duration_ms,passed');
  for (const r of st.runs) lines.push([new Date(r.at).toISOString(), r.game, r.mode, r.selection, r.clockMs, r.n, r.right, r.wrong, r.score, r.durationMs, r.passed ? 'yes' : ''].map(esc).join(','));
  return lines.join('\n');
}

