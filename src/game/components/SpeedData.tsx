import { useState } from 'react';
import { Icon, Panel } from './ui';
import { speedRows, runsFor, speedCsv, SPEED_GOAL_MS, type SpeedStats } from '../../engine/state/speed';
import type { ArcadeGame } from '../../engine/state/types';

const TABLE_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const secs = (ms: number) => (ms ? `${(ms / 1000).toFixed(1)}s` : '–');
const tone = (ms: number) => (!ms ? '' : ms <= SPEED_GOAL_MS ? 'sp-goal' : ms <= 5000 ? 'sp-near' : ms <= 10_000 ? 'sp-mid' : 'sp-slow');

/** The response-time record for the current selection: slowest facts first, a times-table heat grid, and run history. */
export function SpeedData({ speed, game, selectionKey, label }: { speed: SpeedStats; game: ArcadeGame; selectionKey: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState('');
  const rows = speedRows(speed, game, selectionKey);
  const withData = rows.filter((r) => r.n > 0);
  const runs = runsFor(speed, game, selectionKey).slice(0, 12);
  const atGoal = withData.filter((r) => r.recentAvgMs <= SPEED_GOAL_MS).length;
  const grid = game === 'mult' || game === 'div';
  const cell = (a: number, b: number) => speed.facts[game === 'mult' ? `fact:mult:${Math.min(a, b)}x${Math.max(a, b)}` : `fact:div:${a * b}/${b}`];
  const copy = async () => { const csv = speedCsv(speed); try { await navigator.clipboard.writeText(csv); setCopied('Copied'); } catch { setCopied('Copy failed'); } setTimeout(() => setCopied(''), 1500); };
  const download = () => { const blob = new Blob([speedCsv(speed)], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `engineering-quest-speed-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  return (
    <Panel title={`Speed data: ${label}`} icon="dashboard" right={<button className="btn small ghost" onClick={() => setOpen((o) => !o)}>{open ? 'Hide' : 'Show'}</button>}>
      <p className="small muted">{withData.length ? `${withData.length} ${withData.length === 1 ? 'item' : 'items'} timed · ${atGoal} at the ${SPEED_GOAL_MS / 1000} s goal · ${runs.length} speed ${runs.length === 1 ? 'run' : 'runs'} here. Every first answer in the arcade adds a data point.` : 'No times recorded for this selection yet. Practice, Blitz, Conquer and Speed all add data.'}</p>
      {open && (
        <div className="stack">
          {grid && (
            <div className="sp-grid-wrap">
              <table className="sp-grid"><tbody>
                <tr><th /> {TABLE_ORDER.map((n) => <th key={n}>{n}</th>)}</tr>
                {TABLE_ORDER.map((a) => (
                  <tr key={a}><th>{a}</th>{TABLE_ORDER.map((b) => { const f = cell(a, b); const ms = f ? Math.round(f.recent.reduce((x, y) => x + y, 0) / f.recent.length) : 0; return <td key={b} className={tone(ms)} title={f ? `${game === 'mult' ? `${a} × ${b}` : `${a * b} ÷ ${b}`}: avg ${secs(ms)}, best ${secs(f.bestMs)}, ${f.n} tries` : 'no data'}>{ms ? (ms / 1000).toFixed(1) : ''}</td>; })}</tr>
                ))}
              </tbody></table>
              <div className="row wrap small muted" style={{ gap: 10 }}><span><i className="sp-swatch sp-goal" /> ≤ 3 s</span><span><i className="sp-swatch sp-near" /> ≤ 5 s</span><span><i className="sp-swatch sp-mid" /> ≤ 10 s</span><span><i className="sp-swatch sp-slow" /> slower</span><span>recent average, seconds</span></div>
            </div>
          )}
          {withData.length > 0 && (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead><tr><th>{game === 'mult' || game === 'div' || game === 'bonds' ? 'Fact' : 'Skill'}</th><th>Tries</th><th>Right</th><th>Recent avg</th><th>All-time avg</th><th>Best</th><th>Last</th></tr></thead>
                <tbody>
                  {withData.slice(0, 40).map((r) => <tr key={r.key}><td>{r.label}</td><td>{r.n}</td><td>{r.correct}</td><td className={tone(r.recentAvgMs)}>{secs(r.recentAvgMs)}</td><td>{secs(r.avgMs)}</td><td>{secs(r.bestMs)}</td><td>{secs(r.lastMs)}</td></tr>)}
                </tbody>
              </table>
              {rows.length > withData.length && <p className="small muted">Not yet timed: {rows.filter((r) => r.n === 0).slice(0, 20).map((r) => r.label).join(', ')}{rows.filter((r) => r.n === 0).length > 20 ? '…' : ''}</p>}
            </div>
          )}
          {runs.length > 0 && (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead><tr><th>When</th><th>Clock</th><th>On time</th><th>Right</th><th>Avg</th><th>Median</th><th>Best</th></tr></thead>
                <tbody>{runs.map((r) => <tr key={r.at}><td>{new Date(r.at).toLocaleDateString()} {new Date(r.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td><td>{r.targetMs / 1000} s</td><td>{r.onTime}/{r.n}</td><td>{r.correct}/{r.n}</td><td className={tone(r.avgMs)}>{secs(r.avgMs)}</td><td>{secs(r.medianMs)}</td><td>{secs(r.bestMs)}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          <div className="row wrap">
            <button className="btn small" onClick={copy}><Icon name="scroll" /> Copy all speed data (CSV)</button>
            <button className="btn small ghost" onClick={download}>Download CSV</button>
            {copied && <span className="chip ok">{copied}</span>}
          </div>
        </div>
      )}
    </Panel>
  );
}
