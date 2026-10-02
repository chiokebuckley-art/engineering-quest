import { useState } from 'react';
import { useGame } from '../store';
import { Icon } from '../components/ui';
import { WorldMapScreen } from './WorldMapScreen';
import { regionById } from '../../engine/curriculum/regions';
import { regionReadiness } from '../../engine/curriculum';
import { road } from '../../engine/state/road';
import { enemyById } from '../../engine/combat/enemies';
import { ACADEMIES } from '../../engine/academy/registry';
import { asset } from '../../assets';
import type { ArcadeGame } from '../../engine/state/types';

/** The ten rows of the map, each a region (or a family of places) with its colour. */
const ROWS: { id: string; places: string[]; colour: string; glow: string; milestone?: string }[] = [
  { id: 'village', places: ['mines', 'fraction-forest', 'division', 'forge', 'ratio-river', 'unit-factory', 'forgotten'], colour: 'var(--gold)', glow: 'rgba(255,201,60,.4)' },
  { id: 'algebra-city', places: [], colour: 'var(--cyan)', glow: 'rgba(34,230,255,.4)', milestone: 'alg' },
  { id: 'geometry-kingdom', places: [], colour: 'var(--violet)', glow: 'rgba(157,107,255,.4)', milestone: 'geo' },
  { id: 'trig-mountains', places: [], colour: 'var(--magenta)', glow: 'rgba(255,61,138,.4)', milestone: 'trig' },
  { id: 'calculus-frontier', places: [], colour: 'var(--lime)', glow: 'rgba(163,255,60,.4)', milestone: 'calc' },
  { id: 'stats-station', places: [], colour: 'var(--mint)', glow: 'rgba(60,255,157,.35)' },
  { id: 'linalg-grid', places: ['ode-reactor'], colour: 'var(--muted)', glow: 'transparent' },
];

export function QuestMapScreen() {
  const { state, dispatch, play } = useGame();
  const [view, setView] = useState<'regions' | 'map'>('regions');
  if (view === 'map') return <div className="sq-mapview"><button className="sq-chip on k-next sq-mapback" onClick={() => { play('click'); setView('regions'); }}>‹ Regions</button><WorldMapScreen /></div>;

  const completed = new Set(Object.entries(state.quests).filter(([, q]) => q.status === 'completed').map(([id]) => id));
  const ms = road(state);
  const seated = ms.filter((m) => m.status === 'done').length;
  const engine = Math.round(ms.reduce((n, m) => n + m.mastery, 0) / Math.max(1, ms.length));
  let lockedSeen = 0;

  return (
    <div className="sq">
      <div className="sq-qhero" style={{ backgroundImage: `url(${asset('/assets/environments/world-map.svg')})` }}>
        <div><h1 className="sq-title">The Road to Calculus</h1><p className="gold">{seated} of {ms.length} cores seated · Engine at {engine}%</p></div>
      </div>
      <div className="sq-in" style={{ paddingTop: 10 }}>
        <div className="sq-chips" role="tablist">
          <button className="sq-chip k-next on" role="tab" aria-selected>Regions</button>
          <button className="sq-chip" role="tab" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'skilltree' }); }}>Skill tree</button>
          <button className="sq-chip" role="tab" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'lab' }); }}>Engineering missions</button>
          <button className="sq-chip" role="tab" onClick={() => { play('click'); setView('map'); }}><Icon name="map" style={{ width: 14, height: 14 }} /> Map</button>
        </div>

        <section className="sq-rows">
          {ROWS.map((row) => {
            const r = regionById(row.id)!;
            const ids = [row.id, ...row.places];
            const open = ids.some((id) => state.world.unlockedRegions.includes(id));
            const ready = regionReadiness(r, state.mastery, completed);
            const m = row.milestone ? ms.find((x) => x.id === row.milestone) : undefined;
            const academies = ACADEMIES.filter((a) => ids.includes(a.home) && a.chapters.length);
            const percent = open && row.id === 'village' ? Math.round(ms.filter((x) => ['mult', 'div', 'frac'].includes(x.id)).reduce((n, x) => n + x.mastery, 0) / 3) : m?.mastery ?? ready.percent;
            const scout = m?.scoutEnemy ?? (enemyById(`scout-${row.id}`) ? `scout-${row.id}` : undefined);
            const playable = open || m?.status === 'playable' || m?.status === 'done' || ready.ready;
            const fade = playable ? 1 : Math.max(0.4, 0.75 - 0.12 * lockedSeen++);
            const sub = row.id === 'village'
              ? row.places.slice(0, 4).map((id) => regionById(id)!.name.replace('Multiplication ', '').replace('Dungeon of Forgotten Knowledge', 'Forgotten').replace(' Dungeon', ' Dungeon')).join(' · ')
              : academies.length ? `${academies.map((a) => a.short).join(' · ')} · ${percent}% ready` : r.implemented ? `${percent}% ready` : row.places.length ? 'Advanced · locked' : `${percent}% ready`;
            const cta = playable
              ? { label: 'Enter ▸', go: () => dispatch({ type: 'TRAVEL', regionId: row.id === 'village' && state.world.currentRegion !== 'village' && row.places.includes(state.world.currentRegion) ? state.world.currentRegion : row.id }) }
              : scout ? { label: 'Scout', go: () => dispatch({ type: 'START_BATTLE', enemyId: scout, regionId: row.id, preview: true }) }
              : m ? { label: 'Train', go: () => dispatch({ type: 'ARCADE_START', game: m.arcade.game as ArcadeGame, mode: 'practice', selection: m.arcade.selection }) }
              : null;
            return (
              <div key={row.id} className="sq-region" style={{ opacity: fade, ['--rc' as string]: row.colour, ['--rg' as string]: row.glow }}>
                <span className="sq-tile" style={{ color: row.colour, boxShadow: `0 0 14px ${row.glow}`, borderColor: row.colour }}><img src={r.icon} alt="" style={{ width: 24, height: 24, filter: 'invert(1)' }} /></span>
                <span className="main">
                  <span className="name">{r.name}{row.places.length && row.id !== 'village' ? ` · ${regionById(row.places[0])!.name.replace('Differential Equation ', 'ODE ')}` : ''}</span>
                  <span className="meta">{sub}</span>
                  <span className="rbar"><i style={{ width: `${Math.max(3, percent)}%` }} /></span>
                </span>
                {cta ? <button className="cta" onClick={() => { play('open'); cta.go(); }}>{cta.label}</button> : <span className="lock">🔒</span>}
              </div>
            );
          })}
        </section>
        <p className="sq-sub" style={{ textAlign: 'center' }}>Locked regions keep Scout (a free preview fight) and Train (the drill that gets you ready).</p>
      </div>
    </div>
  );
}
