import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useGame } from '../store';
import { battleView, newSalvos, type BattleView } from './battle';
import '../../styles/naval-battle.css';

const NavalScene3D = lazy(() => import('./NavalScene3D').then(m => ({ default: m.NavalScene3D })));
class SeaBoundary extends Component<{ children: ReactNode; onFail: (ready: boolean) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail(false); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function NavalBattle() {
  const { state, play } = useGame(); const v = state.versus!;
  const [ready, setReady] = useState(false); const [flat, setFlat] = useState(false);
  const [systemMotion, setSystemMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const view = useMemo(() => battleView(v, state.settings.reducedMotion || systemMotion), [v, state.settings.reducedMotion, systemMotion]);
  const previous = useRef<BattleView>(); const lastSound = useRef(0);
  const [radio, setRadio] = useState('Correct answers load your guns. Every 10 points launches a shell.');
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)'); if (!query) return;
    const change = () => setSystemMotion(query.matches); query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    const events = newSalvos(previous.current, view);
    if (previous.current?.key !== view.key) setRadio('Correct answers load your guns. Every 10 points launches a shell.');
    previous.current = view;
    if (!events.length) return;
    const local = events.filter(e => e.from === view.activeId);
    const event = local[0] ?? events[0];
    const attacker = view.ships.find(s => s.id === event.from)!;
    const target = view.ships.find(s => s.id === event.to)!;
    setRadio(local.length ? `${attacker.name} fires ${local.length} shell${local.length === 1 ? '' : 's'}!` : `${attacker.name} fires on ${target.name}!`);
    if (Date.now() - lastSound.current > 240) { play(local.length ? 'naval-fire' : 'naval-impact'); lastSound.current = Date.now(); }
  }, [view, play]);
  const winners = view.ships.filter(s => s.winner);
  const message = view.final ? winners.length > 1 ? `Draw: ${winners.map(s => s.name).join(' and ')} stay afloat.` : winners.length ? `${winners[0].name} wins. Rival ships are sinking.` : 'Round ended.' : radio;
  return <section className={`naval-battle ${ready && !flat ? 'naval-ready' : ''} ${view.reducedMotion ? 'naval-reduced' : ''}`} aria-label="Naval battle">
    <div className="naval-scene-toolbar"><span>BLITZ / OPEN WATER</span><button type="button" onClick={() => { setReady(false); setFlat(!flat); }}>{flat ? '3D view' : 'Simple view'}</button></div>
    <div className="naval-waterline">
      {!flat && <SeaBoundary key={view.key} onFail={setReady}><Suspense fallback={null}><NavalScene3D view={view} onAvailability={setReady} /></Suspense></SeaBoundary>}
      {(!ready || flat) && <div className="fleet-fallback">{view.ships.map(ship => <div className={`fleet-status ${ship.sunk ? 'sunk' : ''}`} key={ship.id} style={{ ['--ship-color' as string]: ship.color }}>
        <span aria-hidden="true" className="fallback-vessel" style={{ fontSize: Math.round(44 * ship.size) }}>🚢</span><b>{ship.name}</b><span>{ship.sunk ? 'Sunk' : ship.winner ? 'Victory' : `${ship.hull}% hull`}</span><small>{ship.shipClass}</small>
      </div>)}</div>}
    </div>
    <div className="naval-radio" role="status" aria-live="polite"><b>{view.final ? 'FINAL SIGNAL' : 'BATTLE RADIO'}</b><span>{message}</span></div>
    <div className="fleet-readout" aria-label="Fleet hull and ammunition">
      {view.ships.map(ship => <div key={ship.id} className={`fleet-card ${ship.id === view.activeId ? 'active' : ''}`} style={{ ['--ship-color' as string]: ship.color }}>
        <div><b title={ship.name}>{ship.name}</b><strong>{ship.withdrawn ? 'Left' : ship.sunk ? 'Sunk' : `${ship.hull}%`}</strong></div>
        <meter min={0} max={100} value={ship.hull} aria-label={`${ship.name} hull`} />
        <small>{ship.shells} shells · {ship.score} pts · {ship.shipClass}{ship.wins ? ` (${ship.wins} ${ship.wins === 1 ? 'level' : 'levels'})` : ''}</small>
      </div>)}
    </div>
  </section>;
}
