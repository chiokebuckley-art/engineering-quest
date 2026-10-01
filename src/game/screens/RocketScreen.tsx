import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import '../../styles/rocket-expedition.css';
import { useGame } from '../store';
import { ClockGate, ROCKET_CLOCK } from './ArcadeScreen';
import { Confetti, Callout } from '../components/Fx';
import { ROCKET_MISSIONS, missionById, missionUnlocked, rocketStars, LIVES } from '../../engine/state/rocket';

const RocketScene3D = lazy(() => import('./RocketScene3D').then(module => ({ default: module.RocketScene3D })));

class SceneBoundary extends Component<{ children: ReactNode; onFail: (ready: boolean) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail(false); }
  render() { return this.state.failed ? null : this.props.children; }
}

function useReducedMotion(setting: boolean) {
  const [system, setSystem] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return;
    const update = () => setSystem(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return setting || system;
}

const FLIGHT_NOTES = ['Launch tower clearance', 'Climbing through the clouds', 'Leaving the blue sky', 'Satellite flyby', 'Earth falls behind', 'Lunar approach', 'Landing gear deployed'];

export function RocketScreen() {
  const { state } = useGame();
  // Every question has a clock: Grade 1 never plays it, Grades 3 and 5 say yes first (Contest Path caps).
  return <ClockGate title="Rocket Game" what={ROCKET_CLOCK}>{state.rocket ? <RocketRun /> : <MissionSelect />}</ClockGate>;
}

function MissionSelect() {
  const { state, dispatch, play } = useGame();
  const rec = state.stats.rocket;
  const [sceneReady, setSceneReady] = useState(false);
  const reducedMotion = useReducedMotion(state.settings.reducedMotion);
  const nextMission = ROCKET_MISSIONS.find(m => missionUnlocked(m, rec) && !rec.missions[m.id]?.completed) ?? [...ROCKET_MISSIONS].reverse().find(m => missionUnlocked(m, rec))!;
  const done = ROCKET_MISSIONS.filter((m) => rec.missions[m.id]?.completed).length;
  return (
    <div className="screen-scroll rocket-sky expedition-menu">
      <div className="container stack" style={{ maxWidth: 1040 }}>
        <div className="row wrap">
          <h2 className="brass">Rocket Game</h2>
          <span className="chip">{rec.points} points</span>
          <span className="chip">{done}/{ROCKET_MISSIONS.length} missions</span>
          <span className="spacer" />
          <button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'arcade' })}>Arcade</button>
        </div>
        <div className="expedition-briefing">
          <div className="expedition-intro">
            <span className="flight-eyebrow">EARTH → MOON / 07 MISSIONS</span>
            <h1>Moon<br /><span>Expedition</span></h1>
            <p>Your answers power the journey.</p>
            <p className="flight-instructions">Select the right answer, then press <b>BOOST</b>. Use ◀ ▶ to steer. A wrong answer or an expired clock costs one life.</p>
            <button className="btn primary launch-mission" onClick={() => { play('boss-roar'); dispatch({ type: 'ROCKET_START', missionId: nextMission.id }); }}>Launch: {nextMission.name} ↗</button>
            <div className="expedition-route" aria-label="Route: Earth, atmosphere, orbit, Moon">
              <span>Earth</span><span>Atmosphere</span><span>Orbit</span><span>Moon</span>
            </div>
          </div>
          <div className={`expedition-preview ${sceneReady ? 'world-ready' : ''}`}>
            <SceneBoundary onFail={setSceneReady}><Suspense fallback={null}>
              <RocketScene3D order={5} progress={0.6} lane={1} status="active" reducedMotion={reducedMotion} preview onAvailability={setSceneReady} />
            </Suspense></SceneBoundary>
            {!sceneReady && <div className="briefing-rocket"><RocketSvg /></div>}
            <span className="preview-caption">EXPEDITION CRAFT / READY FOR FLIGHT</span>
          </div>
        </div>
        <div className="mission-list-heading"><h2>Choose your mission</h2><span>{done} of 7 reached</span></div>
        <div className="missions">
          {ROCKET_MISSIONS.map((m) => {
            const unlocked = missionUnlocked(m, rec);
            const r = rec.missions[m.id];
            return (
              <button key={m.id} className={`mission ${unlocked ? '' : 'locked'} ${r?.completed ? 'done' : ''}`} disabled={!unlocked} style={{ ['--sky1' as string]: m.sky[0], ['--sky2' as string]: m.sky[1] }} onClick={() => { play('boss-roar'); dispatch({ type: 'ROCKET_START', missionId: m.id }); }}>
                <div className="m-num">{String(m.order).padStart(2, '0')}</div>
                <div className="m-body">
                  <div className="m-name">{m.name} <span className="muted small">· {m.place}</span></div>
                  <div className="m-sub">{m.blurb}</div>
                  <div className="m-meta">{m.questions} questions · {m.seconds}s each · reach {m.target}</div>
                  <div className="m-stat">{unlocked ? (r ? `Best ${r.best} pts · ${'★'.repeat(r.stars)}${'☆'.repeat(3 - r.stars)}` : 'Not flown yet') : `🔒 Needs ${m.pointsToUnlock} points and the mission before it`}</div>
                </div>
                <div className="m-rocket">{r?.completed ? '✓' : unlocked ? '↗' : '🔒'}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RocketRun() {
  const { state, dispatch, play } = useGame();
  const r = state.rocket!;
  const m = missionById(r.missionId)!;
  const [sceneReady, setSceneReady] = useState(false);
  const [use3D, setUse3D] = useState(true);
  const reducedMotion = useReducedMotion(state.settings.reducedMotion);
  const [left, setLeft] = useState(m.seconds * 1000);
  const [burst, setBurst] = useState(0);
  const [callout, setCallout] = useState<{ n: number; text: string }>({ n: 0, text: '' });
  const active = r.status === 'active';
  const finished = r.status === 'won' || r.status === 'lost';

  // Countdown → timeout bomb.
  useEffect(() => {
    if (!active) return;
    setLeft(Math.max(0, r.deadlineAt - Date.now()));
    const t = setInterval(() => {
      const l = Math.max(0, r.deadlineAt - Date.now());
      setLeft(l);
      if (l <= 0) dispatch({ type: 'ROCKET_TIMEOUT' });
    }, 50);
    return () => clearInterval(t);
  }, [active, r.deadlineAt, dispatch]);

  // Animation phases: boost (climb) / hit (explosion) then advance.
  useEffect(() => {
    if (r.status === 'boost') { play('hit'); setCallout({ n: Date.now(), text: `+${r.lastPoints}` }); }
    if (r.status === 'hit') play('defeat');
    if (r.status === 'boost' || r.status === 'hit') {
      const t = setTimeout(() => dispatch({ type: 'ROCKET_NEXT' }), r.status === 'boost' ? 800 : 1300);
      return () => clearTimeout(t);
    }
    if (r.status === 'won') { setBurst(Date.now()); play('fanfare'); }
    if (r.status === 'lost') play('defeat');
  }, [r.status, r.index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: arrows move, space/enter boost.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!active || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if ((e.key === ' ' || e.key === 'Enter') && target instanceof HTMLElement && target.closest('button, a')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); play('tick'); dispatch({ type: 'ROCKET_MOVE', dir: -1 }); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); play('tick'); dispatch({ type: 'ROCKET_MOVE', dir: 1 }); }
      else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') { e.preventDefault(); dispatch({ type: 'ROCKET_BOOST' }); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [active, dispatch, play]);

  const pct = Math.min(1, r.altitude / m.target);
  const hot = left < 2000;
  return (
    <div className={`rocket-scene expedition-run ${reducedMotion ? 'flight-reduced-motion' : ''}`} style={{ ['--sky1' as string]: m.sky[0], ['--sky2' as string]: m.sky[1], ['--alt' as string]: pct }}>
      <div className="stars" aria-hidden="true" />
      <Confetti trigger={burst} />
      <Callout text={callout.text} trigger={callout.n} color="var(--green)" />
      <div className="rocket-top">
        <div className="chip">{m.name} · Q {Math.min(r.index + 1, m.questions)}/{m.questions}</div>
        <div className="lives" aria-label={`${r.lives} of ${LIVES} lives remaining`}>{Array.from({ length: LIVES }, (_, i) => <span key={i} aria-hidden="true" className={i < r.lives ? 'on' : ''}>❤</span>)}</div>
        <div className="chip">{r.score} pts</div>
        <span className="spacer" />
        <button className="btn small ghost view-switch" onClick={() => { setUse3D(!use3D); setSceneReady(false); }}>{use3D ? '2D view' : '3D view'}</button>
        <button className="btn small ghost" onClick={() => dispatch({ type: 'ROCKET_EXIT' })}>{finished ? 'Missions' : 'Quit'}</button>
      </div>
      <div className="flight-telemetry">
        <span><span className="flight-eyebrow">DESTINATION</span> {m.place}</span>
        <span>{r.altitude}/{m.target} correct to reach target</span>
        <div className="flight-progress" role="progressbar" aria-label="Mission progress" aria-valuemin={0} aria-valuemax={m.target} aria-valuenow={Math.min(r.altitude, m.target)}><i style={{ width: `${pct * 100}%` }} /></div>
      </div>

      {!finished && (
        <>
          <div className="rocket-q">
            <div className="flight-eyebrow">SOLVE TO POWER YOUR ROCKET</div>
            <div className="rq-expr">{r.question.expression}</div>
            <div className={`rq-timer ${hot ? 'hot' : ''}`}><i style={{ width: `${(left / (m.seconds * 1000)) * 100}%` }} /></div>
          </div>
          <div className={`flight-deck ${use3D && sceneReady ? 'world-ready' : ''}`}>
            {use3D && <SceneBoundary onFail={setSceneReady}><Suspense fallback={null}>
              <RocketScene3D order={m.order} progress={pct} lane={r.lane} status={r.status} reducedMotion={reducedMotion} onAvailability={setSceneReady} />
            </Suspense></SceneBoundary>}
          <div className="lanes" role="group" aria-label="Answer lanes">
            {r.options.map((o, i) => (
              <button key={i} disabled={!active} aria-pressed={r.lane === i} aria-label={`Lane ${i + 1}: ${o}${r.lane === i ? ', selected' : ''}`} className={`lane ${r.lane === i ? 'target' : ''} ${r.status !== 'active' && o === r.question.answer ? 'right' : ''} ${r.status === 'hit' && r.lane === i ? 'wrong' : ''}`} onClick={() => { if (!active) return; play('tick'); dispatch({ type: 'ROCKET_LANE', lane: i as 0 | 1 | 2 }); }}>
                <span className="lane-label">{r.lane === i ? 'SELECTED' : `LANE ${i + 1}`}</span>
                <span>{o}</span>
                {r.status === 'hit' && r.lane === i && <span className="bomb">💣</span>}
              </button>
            ))}
          </div>
          <div className="pad" aria-hidden="true">
            <div className={`rocket lane-${r.lane} ${r.status}`}>
              <RocketSvg />
              <div className="flame" />
              {r.status === 'hit' && <div className="boom" />}
            </div>
          </div>
            <div className="flight-radio" role="status" aria-live="polite">
              <span className="flight-eyebrow">MISSION CONTROL</span>
              <span>{r.status === 'boost' ? `Correct. +${r.lastPoints} points. Engines firing!` : r.status === 'hit' ? `Correct answer: ${r.question.answer}. Stabilize and try the next one.` : FLIGHT_NOTES[m.order - 1]}</span>
            </div>
          </div>
          <div className="controls">
            <button className="ctl" onClick={() => { play('tick'); dispatch({ type: 'ROCKET_MOVE', dir: -1 }); }} disabled={!active} aria-label="Move left">◀</button>
            <button className="ctl boost" onClick={() => dispatch({ type: 'ROCKET_BOOST' })} disabled={!active}>BOOST</button>
            <button className="ctl" onClick={() => { play('tick'); dispatch({ type: 'ROCKET_MOVE', dir: 1 }); }} disabled={!active} aria-label="Move right">▶</button>
          </div>
        </>
      )}

      {finished && (
        <div className="expedition-finish">
          <div className="finish-viewport">
          {use3D && <SceneBoundary onFail={setSceneReady}><Suspense fallback={null}>
            <RocketScene3D order={m.order} progress={pct} lane={1} status={r.status} reducedMotion={reducedMotion} onAvailability={setSceneReady} />
          </Suspense></SceneBoundary>}
          {(!use3D || !sceneReady) && <div className="briefing-rocket"><RocketSvg /></div>}
          </div>
        <div className="scene-body" style={{ justifyContent: 'center' }}>
          <div className="container" style={{ width: '100%', maxWidth: 560 }}>
            <div className="panel center stack">
              <h1 className={r.status === 'won' ? 'brass' : ''} style={r.status === 'lost' ? { color: 'var(--red)' } : undefined}>{r.status === 'won' ? (m.id === 'r7' ? 'THE EAGLE HAS LANDED' : `${m.name.toUpperCase()} REACHED`) : 'ROCKET DOWN'}</h1>
              {r.status === 'won' && <div className="stars-row">{'★'.repeat(rocketStars(r))}<span className="dim">{'★'.repeat(3 - rocketStars(r))}</span></div>}
              {r.newBest && <span className="chip ok">NEW BEST</span>}
              <div className="stat-grid">
                <div className="st"><b>{r.score}</b><span>points</span></div>
                <div className="st"><b>{r.altitude}/{m.questions}</b><span>correct</span></div>
                <div className="st"><b>{r.bestStreak}</b><span>best streak</span></div>
                <div className="st"><b>{state.stats.rocket.points}</b><span>total points</span></div>
              </div>
              {r.status === 'lost' && <p className="small muted">{r.lives <= 0 ? 'Three bombs. The tables that got you are queued for review.' : `You needed ${m.target} correct to reach the next station.`}</p>}
              <div className="row wrap" style={{ justifyContent: 'center' }}>
                <button className="btn primary big" onClick={() => { play('boss-roar'); dispatch({ type: 'ROCKET_START', missionId: m.id }); }}>Fly again</button>
                {r.status === 'won' && ROCKET_MISSIONS[m.order] && missionUnlocked(ROCKET_MISSIONS[m.order], state.stats.rocket) && (
                  <button className="btn teal big" onClick={() => { play('boss-roar'); dispatch({ type: 'ROCKET_START', missionId: ROCKET_MISSIONS[m.order].id }); }}>Next: {ROCKET_MISSIONS[m.order].name} ▶</button>
                )}
                <button className="btn" onClick={() => dispatch({ type: 'ROCKET_EXIT' })}>Missions</button>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

function RocketSvg() {
  return (
    <svg viewBox="0 0 64 100" width="64" height="100" aria-hidden>
      <defs><linearGradient id="rk-body" x1="0" x2="1"><stop offset="0" stopColor="#e5e7eb" /><stop offset="0.5" stopColor="#f8fafc" /><stop offset="1" stopColor="#94a3b8" /></linearGradient></defs>
      <path d="M32 2 C44 14 48 34 48 60 L16 60 C16 34 20 14 32 2 Z" fill="url(#rk-body)" stroke="#475569" strokeWidth="1.5" />
      <path d="M32 2 C38 10 42 20 44 30 L20 30 C22 20 26 10 32 2 Z" fill="#ef4444" />
      <circle cx="32" cy="42" r="7" fill="#22d3ee" stroke="#0e7490" strokeWidth="2" />
      <path d="M16 46 L4 70 L16 66 Z" fill="#c9a227" stroke="#8a6d1d" /><path d="M48 46 L60 70 L48 66 Z" fill="#c9a227" stroke="#8a6d1d" />
      <rect x="22" y="60" width="20" height="10" fill="#6b7280" stroke="#374151" />
      <path d="M32 58 L32 62" stroke="#0b1020" />
    </svg>
  );
}
