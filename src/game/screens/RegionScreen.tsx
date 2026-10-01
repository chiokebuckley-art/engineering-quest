import { useGame } from '../store';
import { regionById } from '../../engine/curriculum/regions';
import { NPCS } from '../../content/npcs';
import { Icon } from '../components/ui';
import { useState } from 'react';
import { MINE_DEPTHS, DIVISION_DEPTHS, FOREST_DEPTHS, enemyById, type DepthDef } from '../../engine/combat/enemies';
import { VillageScene, VillageBoard, MineLamps, CoreCeremony, saveEngineCard } from '../components/World';
import { AcademyCard } from './AcademyScreen';
import { ACADEMIES, prevAcademy } from '../../engine/academy/registry';
import { academyUnlocked, graduated, academyNext } from '../../engine/academy/AcademyEngine';
import { skillMastery, weakItems } from '../../engine/mastery/MasteryEngine';
import { hasItem } from '../../engine/inventory/InventorySystem';
import { regionReadiness } from '../../engine/curriculum';
import { QUESTS } from '../../engine/quests/questDefs';
import { MISSIONS } from '../../content/missions';
import { recommendedLesson } from '../../engine/state/selectors';
import { GuideBar } from '../components/GuideBar';
import { nextStep, villageStage } from '../../engine/state/guide';
import { asset } from '../../assets';

export function RegionScreen() {
  const { state, dispatch, play } = useGame();
  const region = regionById(state.world.currentRegion) ?? regionById('village')!;
  const questGiverHasSomething = (npcId: string) =>
    QUESTS.some((q) => q.giver === npcId && state.quests[q.id]?.status === 'available') || QUESTS.some((q) => q.giver === npcId && state.quests[q.id]?.status === 'active' && q.objectives.some((o) => o.type === 'talk' && o.npcId === npcId));

  const stage = villageStage(state);
  const step = nextStep(state);
  const hl = (id: string) => (step.hotspot === id ? 'hotspot glow' : 'hotspot');
  // Progressive disclosure: the village starts with Professor Vector alone and opens up as the story advances.
  const npcs = Object.values(NPCS).filter((n) => n.region === region.id && (region.id !== 'village' || stage >= 2 || n.id === 'vector' || (stage >= 1 && n.id === 'ada' && state.quests['q.bridge']?.status === 'active')));
  const activeMissions = MISSIONS.filter((m) => m.region === region.id && QUESTS.some((q) => state.quests[q.id]?.status === 'active' && q.objectives.some((o) => o.type === 'mission' && o.missionId === m.id)));
  const nextLesson = recommendedLesson(state);

  return (
    <div className="scene" style={{ backgroundImage: `url(${region.environment})` }}>
      <div className="scene-header">
        <div className="loc">
          <h2>{region.name}</h2>
          <p>{region.description}</p>
        </div>
        <span className="spacer" />
        <button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'map' })}><Icon name="map" /> World Map</button>
      </div>
      {region.id === 'village' && state.quests['p.workshop']?.status === 'completed' && (
        <img src={asset('/assets/machines/workshop-building.svg')} alt="Your workshop" title="Your workshop — Project I complete" style={{ position: 'absolute', right: '6%', top: '38%', width: 'min(26vw, 260px)', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.6))', pointerEvents: 'none' }} />
      )}
      {region.id === 'mines' && state.stats.missionsCompleted.includes('m.bridge') && (
        <img src={asset('/assets/machines/bridge-stage-3.svg')} alt="The repaired bridge" style={{ position: 'absolute', left: '50%', top: '30%', transform: 'translateX(-50%)', width: 'min(40vw, 420px)', opacity: 0.9, pointerEvents: 'none' }} />
      )}
      <GuideBar />
          {region.id === 'stats-station' && <button className="btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'countlab', params: { view: 'quest' } })}>♠ Count Lab · Station Analyst path · Parent PIN</button>}
      <CoreCeremony />
      <div className="scene-body">
        {region.id === 'village' && stage >= 1 && <VillageScene />}
        {region.id === 'village' && stage >= 1 && <AcademyCard />}
        {region.id !== 'village' && ACADEMIES.filter((a) => a.home === region.id).map((a) => {
          const open = academyUnlocked(state, a.id); const done = graduated(state, a.id);
          return (
            <button key={a.id} className="academy-card" disabled={!open} onClick={() => { play('open'); dispatch({ type: 'ACADEMY_OPEN', view: 'hub', academy: a.id }); }}>
              <Icon name={a.icon} />
              <span className="pr-body"><b>{a.name}</b><small>{done ? `Graduated · ${a.coreName} seated` : open ? `Next: ${academyNext(state, a.id).label}` : `Opens when you graduate from ${prevAcademy(a.id)?.name ?? 'the academy before it'}`}</small></span>
              <span className="pr-go">{open ? 'Enter ▸' : '🔒'}</span>
            </button>
          );
        })}
        {region.id === 'village' && stage >= 1 && <VillageBoard />}
        {region.id === 'village' && stage >= 2 && <VillageStatus />}
        {activeMissions.length > 0 && (
          <div className="hotspots">
            {activeMissions.map((m) => (
              <button key={m.id} className={hl(`mission-${m.id}`)} onClick={() => { play('build'); dispatch({ type: 'START_MISSION', missionId: m.id }); }}>
                <Icon name="anvil" />
                <div><div className="h-name">{m.name}</div><div className="h-sub">Engineering mission · {m.stages.length} stages</div></div>
                <span className="pip" />
              </button>
            ))}
          </div>
        )}
        <div className="hotspots">
          {npcs.map((n) => (
            <button key={n.id} className={hl(n.id)} onClick={() => { play('click'); dispatch({ type: 'TALK', npcId: n.id }); }}>
              <img className="portrait" src={n.portrait} alt="" style={{ borderColor: n.color }} />
              <div><div className="h-name">{n.name}</div><div className="h-sub">{n.role}</div></div>
              {questGiverHasSomething(n.id) && <span className="pip" />}
            </button>
          ))}
          {region.id === 'village' && stage >= 1 && (
            <>
              <button className={hl('lessons')} onClick={() => dispatch({ type: 'NAVIGATE', screen: 'lessons' })}>
                <Icon name="scroll" />
                <div><div className="h-name">Lessons</div><div className="h-sub">{nextLesson ? nextLesson.title : 'All done!'}</div></div>
              </button>
              {(state.world.unlockedRegions.includes('mines')) && (
                <button className={hl('mines')} onClick={() => dispatch({ type: 'TRAVEL', regionId: 'mines' })}>
                  <Icon name="pickaxe" />
                  <div><div className="h-name">The Mines</div><div className="h-sub">Fight for facts</div></div>
                </button>
              )}
              <button className="hotspot" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'notebook' })}>
                <Icon name="book" />
                <div><div className="h-name">Notebook</div><div className="h-sub">{(state.notebook ?? []).filter((e) => !e.clearedAt && e.dueAt <= Date.now()).length || 'No'} mistakes to fix</div></div>
              </button>
              <button className={hl('arcade')} onClick={() => dispatch({ type: 'NAVIGATE', screen: 'arcade' })}>
                <Icon name="hourglass" />
                <div><div className="h-name">Arcade</div><div className="h-sub">Facts · Word problems · Blitz</div></div>
              </button>
              <button className="hotspot" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'rocket' })}>
                <Icon name="energy" />
                <div><div className="h-name">Rocket Game</div><div className="h-sub">Earth to the Moon</div></div>
              </button>
              <button className="hotspot" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'millionaire' })}>
                <Icon name="coins" />
                <div><div className="h-name">Math Millionaire</div><div className="h-sub">Word problems, big money</div></div>
              </button>
              <button className="hotspot" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'stud' })}>
                <Icon name="chest" />
                <div><div className="h-name">Stud Math</div><div className="h-sub">Cards, odds and payouts</div></div>
              </button>
              <button className="hotspot" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'gear' })}>
                <Icon name="cog" />
                <div><div className="h-name">Weakest Gear</div><div className="h-sub">Studio quiz · bank · vote</div></div>
              </button>
              {stage >= 2 && (
                <button className={hl('training')} onClick={() => dispatch({ type: 'NAVIGATE', screen: 'drill' })}>
                  <Icon name="target" />
                  <div><div className="h-name">Training</div><div className="h-sub">Quick drills</div></div>
                </button>
              )}
              {stage >= 2 && (
                <button className="hotspot" onClick={() => { play('open'); dispatch({ type: 'REST' }); }}>
                  <Icon name="home" />
                  <div><div className="h-name">Inn</div><div className="h-sub">Rest and heal</div></div>
                </button>
              )}
              {stage >= 2 && (
                <button className="hotspot" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'lab' })}>
                  <Icon name="lab" />
                  <div><div className="h-name">Your Lab</div><div className="h-sub">{state.world.labUnlocked.length} station{state.world.labUnlocked.length === 1 ? '' : 's'}</div></div>
                </button>
              )}
              {stage >= 2 && state.world.unlockedRegions.includes('forgotten') && (
                <button className="hotspot" onClick={() => dispatch({ type: 'TRAVEL', regionId: 'forgotten' })}>
                  <Icon name="skull" />
                  <div><div className="h-name">Crypt</div><div className="h-sub">{weakItems(state.mastery).length} facts to fix</div></div>
                </button>
              )}
            </>
          )}
        </div>
        {region.id === 'mines' && <MineGalleries />}
        {region.id === 'fraction-forest' && <FractionGroves />}
        {region.id === 'division' && <DivisionHalls />}
        {region.id === 'forge' && <ForgeGate />}
        {region.id === 'forgotten' && <ForgottenEntrance />}
      </div>
    </div>
  );
}

function VillageStatus() {
  const { state } = useGame();
  const [shared, setShared] = useState('');
  const core = state.stats.bossesDefeated.includes('multiplication-dragon');
  return (
    <div className="row wrap" style={{ alignItems: 'center', gap: 8 }}>
      <div className="panel tight row" style={{ gap: 12, flex: 1 }}>
        <img src={core ? asset('/assets/machines/power-core-multiplication.svg') : asset('/assets/machines/mathematical-engine.svg')} alt="" style={{ width: 56, height: 44, objectFit: 'contain', filter: core ? 'drop-shadow(0 0 12px rgba(255,179,71,0.6))' : 'grayscale(0.4) brightness(0.7)' }} />
        <div style={{ flex: 1 }}>
          <div className="small muted">THE MATHEMATICAL ENGINE</div>
          <div className="small">Multiplication mastery {Math.round(skillMastery('mult', state.mastery))}%</div>
        </div>
        <button className="btn small ghost" onClick={async () => { const r = await saveEngineCard(state); setShared(r === 'shared' ? 'Shared!' : r === 'downloaded' ? 'Saved!' : 'Could not save'); setTimeout(() => setShared(''), 2000); }}><Icon name="scroll" /> {shared || 'Share my Engine'}</button>
      </div>
    </div>
  );
}

function MineGalleries() {
  const { state, dispatch, play } = useGame();
  const step = nextStep(state);
  const cleared = state.world.depthCleared['mines'] ?? 0;
  const forgeOpen = state.world.unlockedRegions.includes('forge');
  const completed = new Set(Object.entries(state.quests).filter(([, q]) => q.status === 'completed').map(([id]) => id));
  const forgeReady = regionReadiness(regionById('forge')!, state.mastery, completed);
  return (
    <div className="stack">
      <div className="row wrap">
        <h3 className="brass">Galleries</h3>
        <span className="chip">Cleared {cleared} / {MINE_DEPTHS.length}</span>
        <span className="spacer" />
        <button className="btn small ghost" onClick={() => dispatch({ type: 'TRAVEL', regionId: 'village' })}><Icon name="home" /> Back to village</button>
      </div>
      <MineLamps />
      <RouteChooser regionId="mines" depths={MINE_DEPTHS} />
      <div className="depth-list">
        {MINE_DEPTHS.map((d) => {
          const e = enemyById(d.enemyId)!;
          const locked = d.depth > cleared + 1;
          const wins = state.world.depthWins[`mines:${d.depth}`] ?? 0;
          const m = Math.round(d.tables.reduce((a, t) => a + skillMastery(`mult.${t}`, state.mastery), 0) / d.tables.length);
          const sideDone = (state.world.sideDone ?? []).includes(`mines:${d.depth}`);
          return (
            <button key={d.depth} className={`depth ${locked ? 'locked' : ''} ${d.depth <= cleared ? 'cleared' : ''} ${step.hotspot === `depth-${d.depth}` ? 'glow' : ''}`} disabled={locked} onClick={() => { play('open'); dispatch({ type: 'START_BATTLE', enemyId: d.enemyId, regionId: 'mines', depth: d.depth }); }}>
              <img src={e.sprite} alt="" style={{ filter: locked ? 'grayscale(1) brightness(0.4)' : undefined }} />
              <div>
                <div className="dn">{d.depth}. {d.name}</div>
                <div className="ds">{e.name} · {d.tables.map((t) => `×${t}`).join(', ')}</div>
                <div className="ds">{locked ? 'Locked' : d.depth <= cleared ? `Cleared ✓ · ${m}%` : `${wins}/${d.clears} wins · ${m}%`}</div>
                {d.side && !locked && <div className={`dside ${sideDone ? 'done' : ''}`}>★ {sideDone ? `Done: ${d.side.reward}` : d.side.text}</div>}
              </div>
            </button>
          );
        })}
        <button className={`depth ${forgeOpen ? '' : 'locked'}`} disabled={!forgeOpen} onClick={() => dispatch({ type: 'TRAVEL', regionId: 'forge' })}>
          <img src={asset('/assets/enemies/multiplication-dragon.svg')} alt="" style={{ filter: forgeOpen ? undefined : 'grayscale(1) brightness(0.4)' }} />
          <div>
            <div className="dn">The Dragon's Forge</div>
            <div className="ds">Boss · 50 facts from all tables</div>
            <div className="ds">{forgeOpen ? 'Gate open — the Forge Key hums.' : `Readiness ${forgeReady.percent}% · needs Forge Key & 75% mastery`}</div>
          </div>
        </button>
      </div>
    </div>
  );
}

function DivisionHalls() {
  const { state, dispatch, play } = useGame();
  const cleared = state.world.depthCleared['division'] ?? 0;
  return (
    <div className="stack">
      <div className="row wrap"><h3 className="brass">Halls</h3><span className="spacer" /><button className="btn small ghost" onClick={() => dispatch({ type: 'TRAVEL', regionId: 'village' })}><Icon name="home" /> Village</button></div>
      <div className="depth-list">
        {DIVISION_DEPTHS.map((d) => {
          const e = enemyById(d.enemyId)!;
          const locked = d.depth > cleared + 1;
          const wins = state.world.depthWins[`division:${d.depth}`] ?? 0;
          return (
            <button key={d.depth} className={`depth ${locked ? 'locked' : ''} ${d.depth <= cleared ? 'cleared' : ''}`} disabled={locked} onClick={() => { play('open'); dispatch({ type: 'START_BATTLE', enemyId: d.enemyId, regionId: 'division', depth: d.depth }); }}>
              <img src={e.sprite} alt="" />
              <div><div className="dn">{d.depth}. {d.name}</div><div className="ds">{e.name} · {e.title}</div><div className="ds">{d.depth <= cleared ? `Cleared · ${wins} wins` : `${wins}/${d.clears} wins to clear`}</div></div>
            </button>
          );
        })}
        {(() => {
          const open = cleared >= DIVISION_DEPTHS.length;
          const beaten = state.stats.bossesDefeated.includes('division-titan');
          return (
            <button className={`depth ${open ? '' : 'locked'}`} disabled={!open} onClick={() => { play('boss-roar'); dispatch({ type: 'START_BATTLE', enemyId: 'division-titan', regionId: 'division' }); }}>
              <img src={asset('/assets/enemies/division-titan.svg')} alt="" style={{ filter: open ? undefined : 'grayscale(1) brightness(0.4)' }} />
              <div><div className="dn">The Division Titan</div><div className="ds">Boss · 50 division facts, 5 misses allowed</div><div className="ds">{beaten ? 'Defeated ✓ — rematch for XP' : open ? `Awake · division mastery ${Math.round(skillMastery('div', state.mastery))}%` : 'Clear both halls to wake it'}</div></div>
            </button>
          );
        })()}
      </div>
    </div>
  );
}

function ForgeGate() {
  const { state, dispatch, play } = useGame();
  const m = Math.round(skillMastery('mult', state.mastery));
  const key = hasItem(state.inventory, 'forge-key');
  const beaten = state.stats.bossesDefeated.includes('multiplication-dragon');
  return (
    <div className="row wrap" style={{ alignItems: 'flex-end' }}>
      <div className="panel" style={{ maxWidth: 520 }}>
        <div className="panel-title"><Icon name="dragon" className="lg brass" /><h3>The Multiplication Dragon</h3></div>
        <p className="small">Mastery exam: 50 facts drawn from every table ×1 to ×12. Accuracy first — more than 5 misses and the Dragon's scales harden. Speed earns bonus damage only on facts you have nearly mastered.</p>
        <div className="row wrap" style={{ margin: '8px 0' }}>
          <span className={`chip ${m >= 75 ? 'ok' : 'warn'}`}>Multiplication {m}% {m >= 75 ? '✓' : '(need 75%)'}</span>
          <span className={`chip ${key ? 'ok' : 'lock'}`}>{key ? 'Forge Key ✓' : 'Forge Key missing'}</span>
          {beaten && <span className="chip ok">Defeated ✓ (rematch for XP)</span>}
        </div>
        <div className="row">
          <button className="btn primary big" disabled={!key || m < 75} onClick={() => { play('boss-roar'); dispatch({ type: 'START_BATTLE', enemyId: 'multiplication-dragon', regionId: 'forge' }); }}><Icon name="dragon" /> Challenge the Dragon</button>
          <button className="btn ghost" onClick={() => dispatch({ type: 'TRAVEL', regionId: 'mines' })}>Back</button>
        </div>
      </div>
    </div>
  );
}

function ForgottenEntrance() {
  const { state, dispatch, play } = useGame();
  const weak = weakItems(state.mastery, Date.now(), 8);
  return (
    <div className="row wrap" style={{ alignItems: 'flex-end' }}>
      <div className="panel" style={{ maxWidth: 560 }}>
        <div className="panel-title"><Icon name="skull" className="lg brass" /><h3>Dungeon of Forgotten Knowledge</h3></div>
        <p className="small">The crypt assembles itself from your own mistakes. Each specter carries one fact you keep missing or one that is due for review. Clear them all to strengthen the weak facts.</p>
        <p className="small muted">{weak.length ? `${weak.length} specters wait below.` : 'No weak facts right now — the crypt is silent. Come back after more battles.'}</p>
        <div className="row">
          <button className="btn primary big" disabled={!weak.length} onClick={() => { play('open'); dispatch({ type: 'START_DUNGEON' }); }}><Icon name="skull" /> Descend</button>
          <button className="btn ghost" onClick={() => dispatch({ type: 'TRAVEL', regionId: 'village' })}>Back</button>
        </div>
      </div>
    </div>
  );
}

/** The fork before a gallery: the main passage, a quiet tunnel (fewer, harder facts) or a loud shaft (more, easier ones, more XP). */
function RouteChooser({ regionId, depths }: { regionId: string; depths: DepthDef[] }) {
  const { state, dispatch, play } = useGame();
  const cleared = state.world.depthCleared[regionId] ?? 0;
  const d = depths[Math.min(cleared, depths.length - 1)];
  if (!d || cleared >= depths.length) return null;
  const go = (route?: 'quiet' | 'loud') => { play('open'); dispatch({ type: 'START_BATTLE', enemyId: d.enemyId, regionId, depth: d.depth, route }); };
  return (
    <div className="route-row">
      <span className="small muted">Into {d.name}:</span>
      <button className="btn small primary" onClick={() => go()}>Main passage</button>
      <button className="btn small" onClick={() => go('quiet')} title="Fewer facts, a level harder">Quiet tunnel · fewer, harder</button>
      <button className="btn small" onClick={() => go('loud')} title="More facts, a level easier, +30% XP">Loud shaft · more, easier</button>
    </div>
  );
}

/** Fraction Forest: three groves, then the three-headed Hydra. */
function FractionGroves() {
  const { state, dispatch, play } = useGame();
  const cleared = state.world.depthCleared['fraction-forest'] ?? 0;
  const hydraOpen = cleared >= FOREST_DEPTHS.length;
  const beaten = state.stats.bossesDefeated.includes('fraction-hydra');
  const m = (id: string) => Math.round(skillMastery(id, state.mastery));
  return (
    <div className="stack">
      <div className="row wrap">
        <h3 className="brass">Groves</h3>
        <span className="chip">Cleared {cleared} / {FOREST_DEPTHS.length}</span>
        <span className="chip">Adding {m('precalc.frac.add')}% · Multiplying {m('precalc.frac.mul')}%</span>
        <span className="spacer" />
        <button className="btn small ghost" onClick={() => dispatch({ type: 'START_LESSON', lessonId: 'l.pc-fractions' })}><Icon name="scroll" /> Fractions lesson</button>
        <button className="btn small ghost" onClick={() => dispatch({ type: 'TRAVEL', regionId: 'village' })}><Icon name="home" /> Village</button>
      </div>
      <RouteChooser regionId="fraction-forest" depths={FOREST_DEPTHS} />
      <div className="depth-list">
        {FOREST_DEPTHS.map((d) => {
          const e = enemyById(d.enemyId)!;
          const locked = d.depth > cleared + 1;
          const wins = state.world.depthWins[`fraction-forest:${d.depth}`] ?? 0;
          const sideDone = (state.world.sideDone ?? []).includes(`fraction-forest:${d.depth}`);
          return (
            <button key={d.depth} className={`depth ${locked ? 'locked' : ''} ${d.depth <= cleared ? 'cleared' : ''}`} disabled={locked} onClick={() => { play('open'); dispatch({ type: 'START_BATTLE', enemyId: d.enemyId, regionId: 'fraction-forest', depth: d.depth }); }}>
              <img src={e.sprite} alt="" style={{ filter: locked ? 'grayscale(1) brightness(0.4)' : e.hue ? `hue-rotate(${e.hue}deg)` : undefined }} />
              <div>
                <div className="dn">{d.depth}. {d.name}</div>
                <div className="ds">{e.name} · {e.title.split(' · ')[1]}</div>
                <div className="ds">{locked ? 'Locked' : d.depth <= cleared ? 'Cleared ✓' : `${wins}/${d.clears} wins to clear`}</div>
                {d.side && !locked && <div className={`dside ${sideDone ? 'done' : ''}`}>★ {sideDone ? `Done: ${d.side.reward}` : d.side.text}</div>}
              </div>
            </button>
          );
        })}
        <button className={`depth ${hydraOpen ? '' : 'locked'}`} disabled={!hydraOpen} onClick={() => { play('boss-roar'); dispatch({ type: 'START_BATTLE', enemyId: 'fraction-hydra', regionId: 'fraction-forest' }); }}>
          <img src={asset('/assets/enemies/fraction-hydra.svg')} alt="" style={{ filter: hydraOpen ? undefined : 'grayscale(1) brightness(0.4)' }} />
          <div>
            <div className="dn">The Fraction Hydra</div>
            <div className="ds">Boss · three heads: sums, products, everything</div>
            <div className="ds">{beaten ? 'Defeated ✓ — rematch for XP' : hydraOpen ? 'Awake. 4 misses allowed.' : `Clear all ${FOREST_DEPTHS.length} groves to wake it`}</div>
          </div>
        </button>
      </div>
    </div>
  );
}

