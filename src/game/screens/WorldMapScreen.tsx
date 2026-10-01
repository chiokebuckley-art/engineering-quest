import { useState } from 'react';
import { useGame } from '../store';
import { AcademyCard } from './AcademyScreen';
import { ACADEMIES, prevAcademy } from '../../engine/academy/registry';
import { academyUnlocked, graduated } from '../../engine/academy/AcademyEngine';
import { REGIONS, MAP_PATHS, regionById } from '../../engine/curriculum/regions';
import { regionReadiness } from '../../engine/curriculum';
import { worldById } from '../../engine/curriculum/worlds';
import { Icon, Ring } from '../components/ui';
import { asset } from '../../assets';
import { road } from '../../engine/state/road';
import { skillById } from '../../engine/curriculum/skills';
import type { ArcadeGame } from '../../engine/state/types';

export function WorldMapScreen() {
  const { state, dispatch, play } = useGame();
  const [sel, setSel] = useState<string>(state.world.currentRegion);
  const completed = new Set(Object.entries(state.quests).filter(([, q]) => q.status === 'completed').map(([id]) => id));
  const region = regionById(sel)!;
  const ready = regionReadiness(region, state.mastery, completed);
  const unlocked = state.world.unlockedRegions.includes(region.id);
  const world = worldById(region.worldId);

  const cls = (id: string) => {
    const r = regionById(id)!;
    if (id === state.world.currentRegion) return 'current';
    if (state.world.unlockedRegions.includes(id)) return 'open';
    if (!r.implemented) return 'future';
    return 'locked';
  };

  return (
    <div className="map-wrap">
      <div className="map-canvas">
        <div className="map-box">
          <img className="bg" src={asset('/assets/environments/world-map.svg')} alt="" />
          <svg className="overlay" viewBox="0 0 1280 720">
            {MAP_PATHS.map(([a, b]) => {
              const ra = regionById(a)!; const rb = regionById(b)!;
              return <line key={`${a}-${b}`} className={`map-path ${rb.implemented ? '' : 'future'}`} x1={ra.map.x * 12.8} y1={ra.map.y * 7.2} x2={rb.map.x * 12.8} y2={rb.map.y * 7.2} />;
            })}
            {REGIONS.map((r) => {
              const x = r.map.x * 12.8; const y = r.map.y * 7.2;
              const c = cls(r.id);
              const rr = c === 'future' ? 15 : 21;
              return (
                <g key={r.id} className={`map-node ${c} ${sel === r.id ? 'selected' : ''}`} transform={`translate(${x},${y})`} onClick={() => { play('click'); setSel(r.id); }}>
                  {c === 'current' && <circle r={rr + 8} fill="none" stroke="#ffb347" strokeOpacity="0.5"><animate attributeName="r" values={`${rr + 4};${rr + 12};${rr + 4}`} dur="2s" repeatCount="indefinite" /></circle>}
                  <circle className="ring" r={rr} />
                  <image href={r.icon} x={-rr * 0.55} y={-rr * 0.55} width={rr * 1.1} height={rr * 1.1} style={{ filter: c === 'future' ? 'invert(0.6)' : 'invert(0.8) sepia(1) saturate(4) hue-rotate(5deg)' }} />
                  <text y={rr + 14}>{r.name}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <aside className="map-side">
        <div className="stack">
          <div className="row"><Icon name={region.icon} className="lg brass" /><div><h3 className="brass">{region.name}</h3><div className="small muted">World {world?.order}: {world?.name} · {world?.subtitle}</div></div></div>
          <p className="small">{region.description}</p>
          {region.id === 'stats-station' && <button className="btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'countlab', params: { view: 'quest' } })}>♠ Count Lab · Station Analyst path · Parent PIN</button>}
          {ACADEMIES.some((a) => a.home === region.id && region.id !== 'village') ? (
            <div className="stack">
              {ACADEMIES.filter((a) => a.home === region.id).map((a) => {
                const open = academyUnlocked(state, a.id); const done = graduated(state, a.id);
                return (
                  <button key={a.id} className="quest-row" disabled={!open} onClick={() => { play('open'); dispatch({ type: 'ACADEMY_OPEN', view: 'hub', academy: a.id }); }}>
                    <Icon name={a.icon} />
                    <span className="pr-body"><b>{a.name}</b><small>{done ? `Graduated · ${a.coreName} seated` : open ? a.blurb : a.draft || !a.chapters.length ? 'Being built' : `Opens when you graduate from ${prevAcademy(a.id)?.name ?? 'the academy before it'}`}</small></span>
                    <span className="qr-clears">{open ? 'Open ▸' : '🔒'}</span>
                  </button>
                );
              })}
              <button className="btn primary block" disabled={!unlocked} onClick={() => { play('open'); dispatch({ type: 'TRAVEL', regionId: region.id }); }}>
                {region.id === state.world.currentRegion ? 'Return to scene' : unlocked ? `Travel to ${region.name}` : 'Graduate to unlock'}
              </button>
            </div>
          ) : region.implemented ? (
            <>
              {ready.requirements.length > 0 && (
                <div>
                  <h4>Required skills</h4>
                  {ready.requirements.map((rq) => <div key={rq.skillId} className={`req ${rq.met ? 'met' : 'unmet'}`}><span>{rq.name}</span><span>{rq.current}% / {rq.required}%</span></div>)}
                </div>
              )}
              {ready.missingQuests.length > 0 && <div className="small muted">Requires quest: {ready.missingQuests.join(', ')}</div>}
              {!unlocked && !ready.ready && <div className="row" style={{ justifyContent: 'center', margin: '8px 0' }}><Ring value={ready.percent} label="readiness" size={110} color="var(--teal)" /></div>}
              <button className="btn primary block" disabled={!(unlocked || ready.ready)} onClick={() => { play('open'); dispatch({ type: 'TRAVEL', regionId: region.id }); }}>
                {region.id === state.world.currentRegion ? 'Return to scene' : unlocked || ready.ready ? `Travel to ${region.name}` : 'Locked'}
              </button>
            </>
          ) : (
            <AheadPanel regionId={region.id} description={world?.description ?? ''} />
          )}
          <RoadToCalculus onPick={(id) => setSel(id)} />
        </div>
      </aside>
    </div>
  );
}

/** A region not built yet: what it will teach, how ready you are, a scouting fight, and where to train for it now. */
function AheadPanel({ regionId, description }: { regionId: string; description: string }) {
  const { state, dispatch, play } = useGame();
  const m = road(state).find((x) => x.regionId === regionId);
  const scoutId = m?.scoutEnemy ?? (`scout-${regionId}`);
  const scouted = (state.world.scouted ?? []).includes(regionId);
  const hasScout = !!m?.scoutEnemy || regionId !== 'advanced-regions';
  return (
    <>
      <div className="row wrap" style={{ gap: 6 }}>
        <span className="chip lock">Not built yet</span>
        {scouted && <span className="chip ok">Scouted ✓</span>}
      </div>
      <p className="small muted">{description}</p>
      {m && (
        <div>
          <h4>What it teaches — train it now</h4>
          {m.skillMastery.map((x) => <div key={x.id} className={`req ${x.mastery >= 60 ? 'met' : 'unmet'}`}><span>{skillById(x.id)?.name ?? x.id}</span><span>{x.mastery}%</span></div>)}
        </div>
      )}
      <div className="stack" style={{ gap: 6, marginTop: 8 }}>
        {hasScout && <button className="btn primary block" onClick={() => { play('open'); dispatch({ type: 'START_BATTLE', enemyId: scoutId, regionId, preview: true }); }}><Icon name="compass" /> {scouted ? 'Scout again' : 'Scout it: a free preview fight'}</button>}
        {m && <button className="btn block" onClick={() => { play('open'); dispatch({ type: 'ARCADE_START', game: m.arcade.game as ArcadeGame, mode: 'practice', selection: m.arcade.selection }); }}><Icon name="hourglass" /> Train for it in the Arcade</button>}
      </div>
    </>
  );
}

/** The whole climb, from the multiplication chart to calculus, with where you are on it. */
function RoadToCalculus({ onPick }: { onPick: (regionId: string) => void }) {
  const { state } = useGame();
  const ms = road(state);
  const done = ms.filter((m) => m.status === 'done').length;
  return (
    <details className="road" open>
      <summary><Icon name="map" /> Road to Calculus · {done}/{ms.length} cores</summary>
      <AcademyCard />
      <ol>
        {ms.map((m) => (
          <li key={m.id} className={`road-m ${m.status}`}>
            <button onClick={() => onPick(m.regionId)}>
              <span className="road-dot">{m.status === 'done' ? '✓' : m.status === 'playable' ? '▶' : m.status === 'locked' ? '🔒' : '◌'}</span>
              <span className="road-body">
                <b>{m.name}</b>
                <small>{m.status === 'done' ? `${m.guardian} defeated` : m.status === 'playable' ? `Playable now · guardian: ${m.guardian}` : m.status === 'locked' ? m.unlockHint : m.scouted ? 'Scouted · train in the Arcade' : 'Scout it · train in the Arcade'}</small>
                <span className="road-bar"><i style={{ width: `${m.mastery}%` }} /></span>
              </span>
              <span className="road-pct">{m.mastery}%</span>
            </button>
          </li>
        ))}
      </ol>
    </details>
  );
}

