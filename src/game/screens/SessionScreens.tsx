import { useState } from 'react';
import { useGame } from '../store';
import { MathChallenge } from '../components/MathChallenge';
import { Icon, Panel, MasteryChip } from '../components/ui';
import { skillMastery } from '../../engine/mastery/MasteryEngine';
import { TABLE_ORDER } from '../../engine/curriculum/skills';
import { missionById } from '../../content/missions';
import { NPCS } from '../../content/npcs';
import { Confetti } from '../components/Fx';
import { useEffect, useState as useLocalState } from 'react';
import { asset } from '../../assets';
import { labeled } from '../components/Labeled';

/** Training Grounds: configure and run drills / diagnostics. */
export function DrillScreen() {
  const { state, dispatch, play } = useGame();
  const s = state.session;
  const [tables, setTables] = useState<number[]>([]);
  const [mode, setMode] = useState<'tables' | 'mixed' | 'missing' | 'applied' | 'division'>('mixed');
  const [count, setCount] = useState(20);

  if (s && (s.kind === 'drill' || s.kind === 'diagnostic')) return <SessionRunner />;

  const start = (diagnostic = false) => {
    play('open');
    let skillIds: string[] = ['mult'];
    if (diagnostic) skillIds = TABLE_ORDER.map((n) => `mult.${n}`);
    else if (mode === 'tables') skillIds = tables.length ? tables.map((n) => `mult.${n}`) : ['mult'];
    else if (mode === 'missing') skillIds = ['mult.missing'];
    else if (mode === 'applied') skillIds = ['mult.applied', 'mult.multistep'];
    else if (mode === 'division') skillIds = ['div'];
    dispatch({ type: 'START_DRILL', skillIds, count: diagnostic ? 36 : count, diagnostic });
  };
  const toggle = (n: number) => setTables((t) => (t.includes(n) ? t.filter((x) => x !== n) : [...t, n]));

  return (
    <div className="screen-scroll" style={{ background: 'url(/assets/environments/arithmetic-village.svg) center / cover' }}>
      <div className="container stack" style={{ maxWidth: 820 }}>
        <Panel title="Training Grounds" icon="target" right={<button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'region' })}>Back</button>}>
          <p className="small muted">Quick practice. Facts you miss come back more often.</p>
          <div className="stack">
            <div className="row wrap">
              {([['mixed', 'Mixed ×1–12'], ['tables', 'Specific tables'], ['missing', 'Missing factors'], ['applied', 'Applied & multi-step'], ['division', 'Division']] as const).map(([m, label]) => (
                <button key={m} className={`btn small ${mode === m ? 'primary' : 'ghost'}`} onClick={() => setMode(m)}>{label}</button>
              ))}
            </div>
            {mode === 'tables' && (
              <div className="table-pick">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => {
                  const m = skillMastery(`mult.${n}`, state.mastery);
                  return <button key={n} className={tables.includes(n) ? 'on' : ''} onClick={() => toggle(n)}>×{n}<i style={{ width: `${m}%` }} /></button>;
                })}
              </div>
            )}
            <div className="row wrap">
              <span className="small muted">Problems:</span>
              {[10, 20, 30, 50].map((n) => <button key={n} className={`btn small ${count === n ? 'primary' : 'ghost'}`} onClick={() => setCount(n)}>{n}</button>)}
              <span className="spacer" />
              <button className="btn primary" onClick={() => start(false)}><Icon name="target" /> Start drill</button>
            </div>
          </div>
        </Panel>
        <Panel title="Diagnostic" icon="gauge">
          <p className="small muted">36 mixed facts. Shows what you know and where to start.</p>
          <button className="btn" onClick={() => start(true)}><Icon name="gauge" /> Run diagnostic (36 problems)</button>
        </Panel>
        <Panel title="Your tables" icon="abacus">
          <div className="table-pick">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => <div key={n} style={{ textAlign: 'center' }}><div className="small mono">×{n}</div><MasteryChip value={skillMastery(`mult.${n}`, state.mastery)} /></div>)}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function MissionScreen() {
  const { state } = useGame();
  const s = state.session;
  if (!s || s.kind !== 'mission') return null;
  return <SessionRunner />;
}

function SessionRunner() {
  const { state, dispatch, play } = useGame();
  const s = state.session!;
  const mission = s.missionId ? missionById(s.missionId) : undefined;
  const giver = mission ? NPCS[mission.giver] : undefined;
  const bg = mission?.environment ?? asset('/assets/environments/arithmetic-village.svg');
  const done = s.status === 'finished';
  const [burst, setBurst] = useLocalState(0);
  useEffect(() => { if (done) { setBurst(Date.now()); play('fanfare'); } }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  const correct = s.results.filter((r) => r.correct).length;
  const acc = s.results.length ? Math.round((correct / s.results.length) * 100) : 0;
  const avg = s.results.length ? Math.round(s.results.reduce((a, r) => a + r.timeMs, 0) / s.results.length / 100) / 10 : 0;

  return (
    <div className="scene" style={{ backgroundImage: `url(${bg})` }}>
      <Confetti trigger={burst} />
      <div className="scene-header">
        <div className="loc">
          <h2>{mission ? mission.name : s.kind === 'diagnostic' ? 'Diagnostic' : 'Training Drill'}</h2>
          <p>{mission ? `Stage ${Math.min(s.stage + 1, mission.stages.length)} of ${mission.stages.length}` : `Problem ${Math.min(s.results.length + 1, s.count)} of ${s.count} · ${correct} correct`}</p>
        </div>
        <span className="spacer" />
        <button className="btn small ghost" onClick={() => dispatch({ type: 'SESSION_EXIT' })}>{done ? 'Leave' : 'Abandon'}</button>
      </div>
      <div className="scene-body">
        {mission && (
          <div className="mission-stage">
            <img key={s.stage} src={mission.images[Math.min(s.stage, mission.images.length - 1)]} alt="" style={{ animation: 'rise 0.5s ease' }} />
          </div>
        )}
        {!done && (
          <div className="container" style={{ width: '100%', maxWidth: 860 }}>
            {mission && giver && s.index === 0 && !s.feedback && (
              <div className="row" style={{ marginBottom: 8 }}><img src={giver.portrait} alt="" style={{ width: 48, height: 48, borderRadius: 10, border: `2px solid ${giver.color}` }} /><div className="small panel tight" style={{ flex: 1 }}>{mission.intro}</div></div>
            )}
            <MathChallenge
              question={s.question}
              feedback={s.feedback ? { correct: s.feedback.correct, text: s.feedback.correct && mission ? `${s.feedback.text} ${mission.stages[Math.max(0, s.stage - 1)].success.replace('{answer}', String(s.question.answer))}` : s.feedback.text } : undefined}
              onSubmit={(given) => dispatch({ type: 'SESSION_ANSWER', given })}
              onNext={() => { play('click'); dispatch({ type: 'SESSION_NEXT' }); }}
              onHint={() => dispatch({ type: 'SESSION_HINT' })}
              hintShown={s.hintShown}
              showExplanation={s.showExplanation}
              onToggleExplanation={() => dispatch({ type: 'SESSION_TOGGLE_EXPLAIN' })}
              nextLabel={s.feedback && !s.feedback.correct && s.attempts < 2 ? 'Try again' : mission && s.stage >= mission.stages.length ? 'Finish' : 'Next'}
              showTimer={!mission}
            />
          </div>
        )}
        {done && (
          <div className="container" style={{ width: '100%', maxWidth: 720 }}>
            <div className="panel center">
              <h1 className="brass">{mission ? 'MISSION COMPLETE' : s.kind === 'diagnostic' ? 'DIAGNOSTIC RESULTS' : 'DRILL COMPLETE'}</h1>
              {mission && <p>{mission.outro}</p>}
              <div className="stat-grid">
                <div className="st"><b>{correct}/{s.results.length}</b><span>correct</span></div>
                <div className="st"><b>{acc}%</b><span>accuracy</span></div>
                <div className="st"><b>{avg}s</b><span>avg time</span></div>
              </div>
              {s.kind === 'diagnostic' && <DiagnosticSummary />}
              {!mission && s.results.some((r) => !r.correct) && <p className="small muted">Missed: {labeled(s.results.filter((r) => !r.correct).map((r) => `${r.question.expression.replace(' = ?', '')} = ${r.question.answer}`).join(' · '))}</p>}
              <button className="btn primary big" onClick={() => { play('quest'); dispatch({ type: 'SESSION_EXIT' }); }}>Continue</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DiagnosticSummary() {
  const { state } = useGame();
  const s = state.session!;
  const byTable = new Map<number, { c: number; n: number }>();
  for (const r of s.results) {
    const m = /^(\d+) × (\d+)/.exec(r.question.expression);
    if (!m) continue;
    const t = Number(r.question.masterySkillId.split('.')[1] ?? m[1]);
    const e = byTable.get(t) ?? { c: 0, n: 0 };
    e.n++; if (r.correct) e.c++;
    byTable.set(t, e);
  }
  const rows = [...byTable.entries()].sort((a, b) => a[0] - b[0]);
  const known = rows.filter(([, v]) => v.c === v.n).map(([t]) => `×${t}`);
  const almost = rows.filter(([, v]) => v.c < v.n && v.c >= v.n - 1 && v.n > 1).map(([t]) => `×${t}`);
  const weak = rows.filter(([, v]) => v.c < v.n - 1 || (v.n === 1 && v.c === 0)).map(([t]) => `×${t}`);
  const first = TABLE_ORDER.find((t) => weak.includes(`×${t}`) || almost.includes(`×${t}`));
  return (
    <div className="stack" style={{ textAlign: 'left', margin: '8px 0' }}>
      <div className="list-row"><span className="teal">Solid</span><span>{known.join(', ') || '—'}</span></div>
      <div className="list-row"><span style={{ color: 'var(--amber)' }}>Almost</span><span>{almost.join(', ') || '—'}</span></div>
      <div className="list-row"><span style={{ color: 'var(--red)' }}>Needs work</span><span>{weak.join(', ') || '—'}</span></div>
      <p className="small">Recommended starting point: <b className="brass">{first ? `the ×${first} table` : 'mixed practice — all tables look solid'}</b>. Foundations stay in cumulative review either way.</p>
    </div>
  );
}
