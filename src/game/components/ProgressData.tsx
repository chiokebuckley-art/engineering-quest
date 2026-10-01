import { useState } from 'react';
import { Icon, Panel } from './ui';
import { ledgerSeries, ledgerByNumber, ledgerByTable, ledgerByGame, ledgerByMode, ledgerSummary, ledgerRuns, ledgerCsv, selectionKeys, troubleSpots, type LedgerStats, type LedgerFilter, type DayPoint, type LedgerRow } from '../../engine/state/ledger';
import type { ArcadeGame, ArcadeMode } from '../../engine/state/types';

/* Validated for the dark surface (#0f172a): right and wrong stay apart under every colour-vision type. */
const RIGHT = '#0d9488';
const WRONG = '#dc2626';
const INK = '#e5e7eb'; const INK2 = '#94a3b8'; const GRID = 'rgba(148,163,184,0.16)';
const MONO = 'var(--font-mono)';

const MODES: { id: ArcadeMode | 'all'; label: string }[] = [{ id: 'all', label: 'All modes' }, { id: 'practice', label: 'Practice' }, { id: 'blitz', label: 'Blitz' }, { id: 'speed', label: 'Speed' }, { id: 'conquer', label: 'Conquer' }];
const RANGES: { days: number; label: string }[] = [{ days: 7, label: '7 days' }, { days: 30, label: '30 days' }, { days: 90, label: '90 days' }, { days: 0, label: 'All' }];
const secs = (ms: number) => (ms ? `${(ms / 1000).toFixed(1)}s` : '–');
const when = (t: number) => `${new Date(t).toLocaleDateString()} ${new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
const modeName = (m: ArcadeMode) => ({ practice: 'Practice', blitz: 'Blitz', speed: 'Speed', conquer: 'Conquer' })[m];

/** A column with a 4px rounded top and a square base. */
const column = (x: number, y: number, w: number, h: number, r = 4): string => {
  if (h <= 0) return '';
  const rr = Math.min(r, h, w / 2);
  return `M ${x} ${y + h} L ${x} ${y + rr} Q ${x} ${y} ${x + rr} ${y} L ${x + w - rr} ${y} Q ${x + w} ${y} ${x + w} ${y + rr} L ${x + w} ${y + h} Z`;
};

/** Right and wrong answers per day as stacked columns: right grows from the baseline, wrong sits on top with a 2px surface gap. */
export function DayChart({ points, title }: { points: DayPoint[]; title: string }) {
  const W = 640; const H = 170; const left = 34; const right = 8; const top = 14; const bottom = 30;
  const plotW = W - left - right; const plotH = H - top - bottom;
  const max = Math.max(1, ...points.map((p) => p.right + p.wrong));
  const step = max <= 5 ? 1 : max <= 10 ? 2 : max <= 25 ? 5 : max <= 50 ? 10 : max <= 100 ? 20 : max <= 250 ? 50 : 100;
  const yMax = Math.ceil(max / step) * step;
  const y = (v: number) => top + plotH - (v / yMax) * plotH;
  const slot = plotW / points.length; const bw = Math.max(2, Math.min(24, slot - 4));
  const ticks: number[] = []; for (let v = 0; v <= yMax; v += step) ticks.push(v);
  const labelEvery = points.length <= 7 ? 1 : points.length <= 31 ? 7 : Math.ceil(points.length / 6);
  const total = points.reduce((a, p) => a + p.right + p.wrong, 0);
  const last = [...points].reverse().find((p) => p.right + p.wrong > 0);
  const dayLabel = (d: string) => { const [, m, dd] = d.split('-'); return `${Number(m)}/${Number(dd)}`; };
  return (
    <figure className="pg-fig">
      <figcaption className="pg-cap"><span>{title}</span>
        <span className="pg-legend"><i style={{ background: RIGHT }} /> right <i style={{ background: WRONG }} /> wrong</span>
      </figcaption>
      {total === 0 ? <p className="small muted">Nothing answered in this range yet.</p> : (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${title}: right and wrong answers per day`} style={{ display: 'block' }}>
          {ticks.map((v) => <g key={v}><line x1={left} x2={W - right} y1={y(v)} y2={y(v)} stroke={GRID} strokeWidth="1" /><text x={left - 6} y={y(v) + 3} fontSize="9" fill={INK2} textAnchor="end" fontFamily={MONO}>{v}</text></g>)}
          {points.map((p, i) => {
            const x = left + i * slot + (slot - bw) / 2;
            const hr = (p.right / yMax) * plotH; const hw = (p.wrong / yMax) * plotH;
            const gap = p.right && p.wrong ? 2 : 0;
            const acc = p.right + p.wrong ? Math.round((p.right / (p.right + p.wrong)) * 100) : 0;
            return (
              <g key={p.day}>
                <rect x={left + i * slot} y={top} width={slot} height={plotH + 18} fill="transparent"><title>{`${p.day}: ${p.right} right, ${p.wrong} wrong (${acc}%)${p.right + p.wrong ? ` · avg ${secs(p.ms / (p.right + p.wrong))}` : ''}`}</title></rect>
                {hr > 0 && <path d={column(x, y(p.right), bw, hr, p.wrong ? 0 : 4)} fill={RIGHT} pointerEvents="none" />}
                {hw > 0 && <path d={column(x, y(p.right + p.wrong) - 0, bw, Math.max(0, hw - gap), 4)} fill={WRONG} pointerEvents="none" />}
                {i % labelEvery === 0 && <text x={left + i * slot + slot / 2} y={H - 10} fontSize="9" fill={INK2} textAnchor="middle" fontFamily={MONO}>{dayLabel(p.day)}</text>}
                {last === p && <text x={x + bw / 2} y={y(p.right + p.wrong) - 4} fontSize="10" fill={INK} textAnchor="middle" fontFamily={MONO}>{p.right}/{p.right + p.wrong}</text>}
              </g>
            );
          })}
          <line x1={left} x2={W - right} y1={y(0)} y2={y(0)} stroke={INK2} strokeOpacity="0.5" strokeWidth="1" />
        </svg>
      )}
    </figure>
  );
}

/** One row per number (or game): a bar for accuracy on a track of the same hue, and the counts beside it. This is both the chart and its table. */
export function AccuracyRows({ rows, head, limit = 24 }: { rows: LedgerRow[]; head: string; limit?: number }) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, limit);
  if (!rows.length) return null;
  return (
    <div className="sp-table-wrap">
      <table className="sp-table pg-rows">
        <thead><tr><th>{head}</th><th>Accuracy</th><th>Right</th><th>Wrong</th><th>Avg time</th></tr></thead>
        <tbody>
          {shown.map((r) => (
            <tr key={r.key}>
              <td>{r.label}</td>
              <td><div className="pg-bar" title={`${r.accuracy}% · ${r.right} of ${r.n}`}><i style={{ width: `${r.accuracy}%`, background: RIGHT }} /><span>{r.accuracy}%</span></div></td>
              <td>{r.right}</td><td className={r.wrong ? 'pg-wrong' : ''}>{r.wrong}</td><td>{secs(r.avgMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > limit && <button className="btn small ghost" onClick={() => setAll((a) => !a)}>{all ? 'Show fewer' : `Show all ${rows.length}`}</button>}
    </div>
  );
}

function Tiles({ s }: { s: LedgerRow }) {
  return (
    <div className="stat-grid pg-tiles">
      <div className="st"><b>{s.n}</b><span>answered</span></div>
      <div className="st ok"><b>{s.right}</b><span>right</span></div>
      <div className="st"><b style={{ color: s.wrong ? '#fca5a5' : undefined }}>{s.wrong}</b><span>wrong</span></div>
      <div className="st"><b>{s.n ? `${s.accuracy}%` : '–'}</b><span>accuracy</span></div>
      <div className="st"><b>{secs(s.avgMs)}</b><span>avg time</span></div>
    </div>
  );
}

function Filters({ mode, setMode, days, setDays }: { mode: ArcadeMode | 'all'; setMode: (m: ArcadeMode | 'all') => void; days: number; setDays: (d: number) => void }) {
  return (
    <div className="stack pg-filters" style={{ gap: 4 }}>
      <div className="row wrap">{MODES.map((m) => <button key={m.id} className={`btn small ${mode === m.id ? 'primary' : 'ghost'}`} onClick={() => setMode(m.id)}>{m.label}</button>)}</div>
      <div className="row wrap">{RANGES.map((r) => <button key={r.days} className={`btn small ${days === r.days ? 'primary' : 'ghost'}`} onClick={() => setDays(r.days)}>{r.label}</button>)}</div>
    </div>
  );
}

function Export({ ledger }: { ledger: LedgerStats }) {
  const [copied, setCopied] = useState('');
  const copy = async () => { try { await navigator.clipboard.writeText(ledgerCsv(ledger)); setCopied('Copied'); } catch { setCopied('Copy failed'); } setTimeout(() => setCopied(''), 1500); };
  const download = () => { const blob = new Blob([ledgerCsv(ledger)], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `engineering-quest-progress-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  return (
    <div className="row wrap">
      <button className="btn small" onClick={copy}><Icon name="scroll" /> Copy all progress data (CSV)</button>
      <button className="btn small ghost" onClick={download}>Download CSV</button>
      {copied && <span className="chip ok">{copied}</span>}
    </div>
  );
}

/** The arcade panel: right and wrong by day for the current selection, broken down by number, with every run and its clock. */
export function ProgressData({ ledger, game, selectionKey, label }: { ledger: LedgerStats; game: ArcadeGame; selectionKey: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ArcadeMode | 'all'>('all');
  const [days, setDays] = useState(30);
  const now = Date.now();
  const f: LedgerFilter = { game: game === 'mixed' ? undefined : game, mode, ...selectionKeys(game, selectionKey) };
  const summary = ledgerSummary(ledger, f, days, now);
  const runs = ledgerRuns(ledger, game, selectionKey, mode);
  return (
    <Panel title={`Progress: ${label}`} icon="dashboard" right={<button className="btn small ghost" onClick={() => setOpen((o) => !o)}>{open ? 'Hide' : 'Show'}</button>}>
      <p className="small muted">{summary.n ? `${summary.n} answered in the last ${days || 'all'} days: ${summary.right} right, ${summary.wrong} wrong (${summary.accuracy}%). ${runs.length} ${runs.length === 1 ? 'run' : 'runs'} logged here.` : 'Nothing logged for this selection yet. Practice, Blitz, Speed and Conquer all count, and every miss goes into the notebook.'}</p>
      {open && (
        <div className="stack">
          <Filters mode={mode} setMode={setMode} days={days} setDays={setDays} />
          <Tiles s={summary} />
          <DayChart points={ledgerSeries(ledger, f, days, now)} title="Right and wrong by day" />
          {(game === 'mult' || game === 'div') && <AccuracyRows rows={ledgerByTable(ledger, f, days, now)} head={game === 'mult' ? 'Table' : 'Divisor'} limit={12} />}
          <AccuracyRows rows={ledgerByNumber(ledger, f, days, now)} head={game === 'mult' || game === 'div' || game === 'bonds' ? 'Fact (weakest first)' : 'Skill (weakest first)'} />
          {mode === 'all' && <AccuracyRows rows={ledgerByMode(ledger, f, days, now).map((r) => ({ ...r, label: modeName(r.key as ArcadeMode) }))} head="Mode" />}
          {runs.length > 0 && (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead><tr><th>When</th><th>Mode</th><th>Clock</th><th>Right</th><th>Wrong</th><th>Score</th><th>Took</th></tr></thead>
                <tbody>{runs.slice(0, 15).map((r) => <tr key={r.at}><td>{when(r.at)}</td><td>{modeName(r.mode)}{r.passed ? ' ✓' : ''}</td><td>{r.clockMs ? `${r.clockMs / 1000} s` : '–'}</td><td>{r.right}</td><td className={r.wrong ? 'pg-wrong' : ''}>{r.wrong}</td><td>{r.mode === 'blitz' ? `${r.score} pts` : '–'}</td><td>{secs(r.durationMs)}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          <Export ledger={ledger} />
        </div>
      )}
    </Panel>
  );
}

/** The dashboard view: everything in the arcade, broken down by the math, with the numbers that keep going wrong. */
export function LedgerOverview({ ledger, gameLabel }: { ledger: LedgerStats; gameLabel: (g: ArcadeGame) => string }) {
  const [mode, setMode] = useState<ArcadeMode | 'all'>('all');
  const [days, setDays] = useState(30);
  const now = Date.now();
  const f: LedgerFilter = { mode };
  const summary = ledgerSummary(ledger, f, days, now);
  const trouble = troubleSpots(ledger);
  return (
    <div className="stack">
      <Filters mode={mode} setMode={setMode} days={days} setDays={setDays} />
      <Tiles s={summary} />
      <DayChart points={ledgerSeries(ledger, f, days, now)} title="Right and wrong by day, all arcade games" />
      <AccuracyRows rows={ledgerByGame(ledger, f, days, now, gameLabel)} head="Game" />
      {trouble.length > 0 && (
        <div>
          <h4>Numbers that keep going wrong</h4>
          <div className="row wrap">{trouble.map((t) => <span key={`${t.game}|${t.key}`} className="chip warn" title={`${gameLabel(t.game)} · ${t.right} of ${t.n} right`}>{t.label} · {t.accuracy}%{t.wrongStreak >= 2 ? ` · ${t.wrongStreak} misses in a row` : ''}</span>)}</div>
        </div>
      )}
      <Export ledger={ledger} />
    </div>
  );
}
