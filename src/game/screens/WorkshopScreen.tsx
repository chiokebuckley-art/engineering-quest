import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../store';
import { Icon, Panel } from '../components/ui';
import { MathVisual } from '../components/MathVisual';
import { elo, logistic, nCr } from '../../engine/questions/prob';

/**
 * Model Workshop: build a probability of an outcome from scratch and carry it through to a decision.
 *   1 define the outcome and its base rate
 *   2 add factors with weights → logistic model
 *   3 blend with an Elo rating gap
 *   4 Monte Carlo a series (and check it against the exact binomial)
 *   5 turn the probability into a decision: fair odds, EV, Kelly, risk of ruin
 *   6 score your past predictions (Brier)
 */
interface Factor { name: string; weight: number; value: number }
interface Model { outcome: string; base: number; factors: Factor[]; eloA: number; eloB: number; eloWeight: number; series: number; b: number; bankroll: number; log: { p: number; result: 0 | 1 }[] }
const KEY = 'engineering-quest.workshop';
const DEFAULT: Model = {
  outcome: 'Home team wins', base: 50,
  factors: [{ name: 'Form (last 5)', weight: 0.8, value: 1 }, { name: 'Rest days', weight: 0.4, value: 0 }, { name: 'Key player out', weight: -1.2, value: 0 }, { name: 'Home crowd', weight: 0.3, value: 1 }],
  eloA: 1600, eloB: 1550, eloWeight: 50, series: 1, b: 1.2, bankroll: 100, log: [],
};
const load = (): Model => { try { const raw = localStorage.getItem(KEY); return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT; } catch { return DEFAULT; } };
const f1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
const pc = (p: number) => `${(p * 100).toFixed(1)} %`;
const ln = Math.log;

/** Probability of winning a best-of-n series with per-game probability p: exact binomial. */
export function seriesProb(p: number, n: number): number { const need = Math.ceil(n / 2); let s = 0; for (let k = need; k <= n; k++) s += nCr(n, k) * p ** k * (1 - p) ** (n - k); return s; }
/** Monte Carlo of the same series: seeded so the number is stable for a given model. */
export function seriesSim(p: number, n: number, runs: number, seed: number): { wins: number; dist: number[] } {
  let s = seed >>> 0 || 1; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const dist = Array(n + 1).fill(0); let wins = 0;
  for (let r = 0; r < runs; r++) { let w = 0; for (let g = 0; g < n; g++) if (rnd() < p) w++; dist[w]++; if (w > n / 2) wins++; }
  return { wins, dist };
}

export function WorkshopScreen() {
  const { dispatch, play } = useGame();
  const [m, setM] = useState<Model>(load);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* ignore */ } }, [m]);
  const set = (patch: Partial<Model>) => setM((x) => ({ ...x, ...patch }));
  const setF = (i: number, patch: Partial<Factor>) => setM((x) => ({ ...x, factors: x.factors.map((f, j) => (j === i ? { ...f, ...patch } : f)) }));

  const base = Math.min(0.99, Math.max(0.01, m.base / 100));
  const z0 = ln(base / (1 - base));
  const zf = m.factors.reduce((a, f) => a + f.weight * f.value, 0);
  const z = z0 + zf; const pModel = logistic(z);
  const pElo = elo(m.eloA, m.eloB);
  const w = m.eloWeight / 100; const p = (1 - w) * pModel + w * pElo;
  const exact = seriesProb(p, m.series);
  const sim = useMemo(() => seriesSim(p, m.series, 10_000, Math.round(p * 1e6) + m.series * 7919), [p, m.series]);
  const pSeries = exact; const q = 1 - pSeries; const b = m.b;
  const ev = pSeries * b - q; const fair = q / pSeries; const kelly = Math.max(0, (b * pSeries - q) / b);
  const decimalOdds = b + 1; const impliedP = 1 / decimalOdds;
  const brier = m.log.length ? m.log.reduce((a, r) => a + (r.p - r.result) ** 2, 0) / m.log.length : null;
  const [newP, setNewP] = useState(50);

  const summary = () => `${m.outcome}\nbase rate ${m.base}% → z0 = ${f1(z0)}\n${m.factors.map((f) => `${f.name}: ${f.weight} × ${f.value} = ${f1(f.weight * f.value)}`).join('\n')}\nz = ${f1(z)} → model p = ${pc(pModel)}\nElo ${m.eloA} vs ${m.eloB} → ${pc(pElo)}, weight ${m.eloWeight}%\nblended p = ${pc(p)}\nbest of ${m.series}: exact ${pc(exact)}, simulated ${pc(sim.wins / 10_000)}\noffered b = ${b} (decimal ${f1(decimalOdds)}, implied ${pc(impliedP)}); fair b = ${f1(fair)}; EV/unit = ${f1(ev)}; Kelly = ${pc(kelly)} of bankroll (${f1(kelly * m.bankroll)})`;

  return (
    <div className="screen-scroll" style={{ background: 'url(/assets/environments/workshop-lab.svg) center / cover' }}>
      <div className="container stack">
        <Panel title="Model Workshop" icon="telescope" right={<button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'region' })}>Back</button>}>
          <p className="small muted">Build a probability of an outcome the way the Probability lab teaches it: base rate → factors → logistic → blend with ratings → simulate → price it → decide → score yourself. Everything updates as you change a number; your model is saved on this device.</p>
        </Panel>

        <Panel title="1 · The outcome and its base rate" icon="target">
          <div className="row wrap">
            <input className="text" value={m.outcome} onChange={(e) => set({ outcome: e.target.value })} style={{ flex: 1, minWidth: 180 }} />
            <label className="small muted">Base rate {m.base} %<input type="range" min={1} max={99} value={m.base} onChange={(e) => set({ base: +e.target.value })} /></label>
          </div>
          <p className="small muted">How often does this happen with no other information? That is the prior. In logit form z₀ = ln(p ÷ (1 − p)) = <b>{f1(z0)}</b>. Factors push z up or down from here.</p>
          <MathVisual visual={{ type: 'oddsbar', a: 100 - m.base, b: m.base }} />
        </Panel>

        <Panel title="2 · Factors → logistic model" icon="dashboard">
          <p className="small muted">Each factor has a <b>weight</b> (how much one unit matters, in log-odds) and today's <b>value</b> (−2 to +2, standardised: 0 is typical). Score z = z₀ + Σ weight × value, then p = 1 ÷ (1 + e^−z). A weight of 0.7 roughly doubles the odds per unit.</p>
          <div className="stack">
            {m.factors.map((f, i) => (
              <div key={i} className="row wrap ws-factor">
                <input className="text" value={f.name} onChange={(e) => setF(i, { name: e.target.value })} style={{ flex: 1, minWidth: 120 }} />
                <label className="small muted">weight {f1(f.weight)}<input type="range" min={-3} max={3} step={0.1} value={f.weight} onChange={(e) => setF(i, { weight: +e.target.value })} /></label>
                <label className="small muted">value {f1(f.value)}<input type="range" min={-2} max={2} step={0.5} value={f.value} onChange={(e) => setF(i, { value: +e.target.value })} /></label>
                <span className={`chip ${f.weight * f.value > 0 ? 'ok' : f.weight * f.value < 0 ? 'warn' : ''}`}>{f.weight * f.value >= 0 ? '+' : ''}{f1(f.weight * f.value)}</span>
                <button className="btn small ghost" onClick={() => set({ factors: m.factors.filter((_, j) => j !== i) })} aria-label="remove">×</button>
              </div>
            ))}
            <div className="row wrap"><button className="btn small" disabled={m.factors.length >= 6} onClick={() => set({ factors: [...m.factors, { name: `Factor ${m.factors.length + 1}`, weight: 0.5, value: 0 }] })}>+ Add factor</button><span className="small muted">z = {f1(z0)} + {f1(zf)} = <b>{f1(z)}</b> → model p = <b>{pc(pModel)}</b></span></div>
          </div>
          <MathVisual visual={{ type: 'logistic', z: Math.round(z * 10) / 10 }} />
          <p className="small muted">Where do weights come from? From data: logistic regression fits them so past outcomes are predicted best. Until you have data, set them by judgement, then check them in step 6.</p>
        </Panel>

        <Panel title="3 · Blend with a rating (Elo)" icon="medal">
          <div className="row wrap">
            <label className="small muted">A rating <input className="text" type="number" value={m.eloA} onChange={(e) => set({ eloA: +e.target.value })} style={{ width: 90 }} /></label>
            <label className="small muted">B rating <input className="text" type="number" value={m.eloB} onChange={(e) => set({ eloB: +e.target.value })} style={{ width: 90 }} /></label>
            <label className="small muted">Elo weight {m.eloWeight} %<input type="range" min={0} max={100} value={m.eloWeight} onChange={(e) => set({ eloWeight: +e.target.value })} /></label>
          </div>
          <p className="small muted">Elo expected score E = 1 ÷ (1 + 10^((R_B − R_A) ÷ 400)) = <b>{pc(pElo)}</b>. Blended: {100 - m.eloWeight} % model + {m.eloWeight} % Elo = <b>p = {pc(p)}</b> per game. Ratings summarise long history; your factors capture today.</p>
          <MathVisual visual={{ type: 'elo', diff: m.eloA - m.eloB }} />
        </Panel>

        <Panel title="4 · Simulate a series" icon="hourglass">
          <div className="row wrap">
            <span className="small muted">Best of</span>
            {[1, 3, 5, 7].map((n) => <button key={n} className={`btn small ${m.series === n ? 'primary' : 'ghost'}`} onClick={() => { play('click'); set({ series: n }); }}>{n}</button>)}
          </div>
          <p className="small muted">10 000 simulated series at p = {pc(p)} per game: A wins <b>{pc(sim.wins / 10_000)}</b>. Exact binomial (at least {Math.ceil(m.series / 2)} of {m.series}): <b>{pc(exact)}</b>. The difference is Monte Carlo noise, about ±{(100 * Math.sqrt((exact * (1 - exact)) / 10_000)).toFixed(1)} points. A longer series favours the better side.</p>
          <MathVisual visual={{ type: 'bars', title: `Games won by A in ${sim.dist.length - 1 > 1 ? 'a best-of-' + m.series : 'one game'} (10 000 runs)`, values: sim.dist.map((c, k) => ({ label: String(k), v: c / 10_000 })), highlightFrom: Math.ceil(m.series / 2) }} />
        </Panel>

        <Panel title="5 · Price it and decide" icon="coins">
          <div className="row wrap">
            <label className="small muted">Offered payout b (gain per unit risked) {f1(b)}<input type="range" min={0.2} max={5} step={0.1} value={b} onChange={(e) => set({ b: +e.target.value })} /></label>
            <label className="small muted">Bankroll <input className="text" type="number" value={m.bankroll} onChange={(e) => set({ bankroll: +e.target.value })} style={{ width: 90 }} /></label>
          </div>
          <div className="stat-grid">
            <div className="st"><b>{pc(pSeries)}</b><span>your probability</span></div>
            <div className="st"><b>{pc(impliedP)}</b><span>implied by the offer (1 ÷ {f1(decimalOdds)})</span></div>
            <div className="st"><b>{f1(fair)}</b><span>fair b = q ÷ p</span></div>
            <div className={`st ${ev > 0 ? 'ok' : ''}`}><b>{ev >= 0 ? '+' : ''}{f1(ev)}</b><span>EV per unit risked</span></div>
            <div className="st"><b>{pc(kelly)}</b><span>Kelly fraction ({f1(kelly * m.bankroll)} of {m.bankroll})</span></div>
            <div className="st"><b>{pc(kelly / 2)}</b><span>half Kelly (safer)</span></div>
          </div>
          <p className="small muted">{ev > 0 ? `Your probability beats the offer's implied probability by ${((pSeries - impliedP) * 100).toFixed(1)} points: positive expected value. Kelly says risk at most ${pc(kelly)} of the bankroll; most people use half.` : `The offer implies ${pc(impliedP)} and you only make it ${pc(pSeries)}: negative expected value. Decline, whatever the story says.`} Utility matters too: a bet that could end you is a bad bet even at positive EV.</p>
          <MathVisual visual={{ type: 'kelly', p: pSeries, b }} />
        </Panel>

        <Panel title="6 · Score yourself (Brier)" icon="book">
          <p className="small muted">A model is only as good as its record. Log each prediction and what happened. Brier score = average of (p − outcome)²: 0 is perfect, 0.25 is coin-flipping, worse than 0.25 means your probabilities point the wrong way.</p>
          <div className="row wrap">
            <label className="small muted">Predicted {newP} %<input type="range" min={1} max={99} value={newP} onChange={(e) => setNewP(+e.target.value)} /></label>
            <button className="btn small" onClick={() => { play('click'); set({ log: [...m.log, { p: newP / 100, result: 1 }] }); }}>It happened</button>
            <button className="btn small ghost" onClick={() => { play('click'); set({ log: [...m.log, { p: newP / 100, result: 0 }] }); }}>It did not</button>
            <button className="btn small ghost" onClick={() => setNewP(Math.round(pSeries * 100))}>Use model p</button>
          </div>
          {m.log.length > 0 && (
            <div className="sp-table-wrap"><table className="sp-table"><thead><tr><th>#</th><th>Predicted</th><th>Outcome</th><th>(p − o)²</th></tr></thead><tbody>
              {m.log.slice(-12).map((r, i) => <tr key={i}><td>{m.log.length - Math.min(12, m.log.length) + i + 1}</td><td>{pc(r.p)}</td><td>{r.result ? 'yes' : 'no'}</td><td>{((r.p - r.result) ** 2).toFixed(3)}</td></tr>)}
            </tbody></table></div>
          )}
          {brier !== null && <p className="small"><b>Brier {brier.toFixed(3)}</b> over {m.log.length} prediction{m.log.length === 1 ? '' : 's'} · {brier < 0.2 ? 'sharp and calibrated so far' : brier <= 0.25 ? 'about coin-flip quality: tune the weights' : 'worse than guessing: your factors point the wrong way'}. {m.log.length < 20 && 'Twenty or more predictions before trusting this.'}</p>}
          <div className="row wrap">
            <button className="btn small" onClick={async () => { try { await navigator.clipboard.writeText(summary()); play('click'); } catch { /* ignore */ } }}><Icon name="scroll" /> Copy model summary</button>
            <button className="btn small ghost" onClick={() => { if (window.confirm('Reset the workshop to the example model?')) setM(DEFAULT); }}>Reset example</button>
            <button className="btn small ghost" onClick={() => dispatch({ type: 'START_LESSON', lessonId: 'l.prob-model' })}><Icon name="book" /> Capstone lesson</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
