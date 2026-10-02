import { useGame } from '../store';
import { regionById } from '../../engine/curriculum/regions';
import { NPCS } from '../../content/npcs';
import { Icon } from '../components/ui';
import { useState } from 'react';
import { MINE_DEPTHS, DIVISION_DEPTHS, FOREST_DEPTHS, enemyById, type DepthDef } from '../../engine/combat/enemies';
import { VillageScene, VillageBoard, CoreCeremony, saveEngineCard } from '../components/World';
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
import type { Action } from '../../engine/state/actions';
import type { ArcadeGame } from '../../engine/state/types';

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
  const { state } = useGame();
  const completed = new Set(Object.entries(state.quests).filter(([, q]) => q.status === 'completed').map(([id]) => id));
  const forgeOpen = state.world.unlockedRegions.includes('forge');
  const forgeReady = regionReadiness(regionById('forge')!, state.mastery, completed);
  const beaten = state.stats.bossesDefeated.includes('multiplication-dragon');
  return (
    <DepthRows regionId="mines" depths={MINE_DEPTHS} unit="Gallery" lit="galleries lit" keeper="Foreman Brick" tableSkill={(t) => `mult.${t}`} tableLabel={(t) => `×${t}`}
      boss={{ name: "Dragon's Forge · Boss", art: asset('/assets/enemies/multiplication-dragon.svg'), open: forgeOpen, line: beaten ? 'Defeated ✓ — rematch for XP' : forgeOpen ? 'The gate is open. 50 facts, 5 misses allowed.' : `Light ${MINE_DEPTHS.length} lanterns to open · readiness ${forgeReady.percent}%`, go: { type: 'TRAVEL', regionId: 'forge' } }} />
  );
}

function DivisionHalls() {
  const { state } = useGame();
  const cleared = state.world.depthCleared['division'] ?? 0;
  const open = cleared >= DIVISION_DEPTHS.length;
  const beaten = state.stats.bossesDefeated.includes('division-titan');
  return (
    <DepthRows regionId="division" depths={DIVISION_DEPTHS} unit="Hall" lit="halls lit" keeper="Foreman Brick" tableSkill={(t) => `div.${t}`} tableLabel={(t) => `÷${t}`}
      boss={{ name: 'Division Titan · Boss', art: asset('/assets/enemies/division-titan.svg'), open, line: beaten ? 'Defeated ✓ — rematch for XP' : open ? `Awake · 50 division facts, 5 misses · mastery ${Math.round(skillMastery('div', state.mastery))}%` : `Clear all ${DIVISION_DEPTHS.length} halls to wake it`, go: { type: 'START_BATTLE', enemyId: 'division-titan', regionId: 'division' } }} />
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

/** Fraction Forest: three groves, then the three-headed Hydra. */
function FractionGroves() {
  const { state, dispatch } = useGame();
  const cleared = state.world.depthCleared['fraction-forest'] ?? 0;
  const hydraOpen = cleared >= FOREST_DEPTHS.length;
  const beaten = state.stats.bossesDefeated.includes('fraction-hydra');
  return (
    <>
      <DepthRows regionId="fraction-forest" depths={FOREST_DEPTHS} unit="Grove" lit="groves lit" keeper="Professor Vector"
        boss={{ name: 'Fraction Hydra · Boss', art: asset('/assets/enemies/fraction-hydra.svg'), open: hydraOpen, line: beaten ? 'Defeated ✓ — rematch for XP' : hydraOpen ? 'Awake. Three heads: sums, products, everything. 4 misses allowed.' : `Clear all ${FOREST_DEPTHS.length} groves to wake it`, go: { type: 'START_BATTLE', enemyId: 'fraction-hydra', regionId: 'fraction-forest' } }} />
      <button className="sq-btn2 k-learn" onClick={() => dispatch({ type: 'START_LESSON', lessonId: 'l.pc-fractions' })}><Icon name="scroll" style={{ width: 16, height: 16, verticalAlign: '-3px' }} /> Fractions lesson</button>
    </>
  );
}

/**
 * 2d: a region's galleries / halls / groves as rows. Lamp circle (mint lit, gold the one to fight, dim locked),
 * the route choice on the current one, side goals left open, and the boss banner at the end.
 */
function DepthRows({ regionId, depths, unit, lit, keeper, tableSkill, tableLabel, boss }: {
  regionId: string; depths: DepthDef[]; unit: string; lit: string; keeper: string;
  tableSkill?: (t: number) => string; tableLabel?: (t: number) => string;
  boss: { name: string; art: string; open: boolean; line: string; go: Action };
}) {
  const { state, dispatch, play } = useGame();
  const cleared = state.world.depthCleared[regionId] ?? 0;
  const sideDone = (d: DepthDef) => (state.world.sideDone ?? []).includes(`${regionId}:${d.depth}`);
  const sidesOpen = depths.filter((d) => d.side && d.depth <= cleared + 1 && !sideDone(d)).length;
  const tables = [...new Set(depths.flatMap((d) => d.tables))].filter((t) => t !== 1);
  const skills = [...new Set(depths.flatMap((d) => d.skills ?? []))];
  const weakest = tableSkill && tableLabel && tables.length
    ? (() => { const t = [...tables].sort((a, b) => skillMastery(tableSkill(a), state.mastery) - skillMastery(tableSkill(b), state.mastery))[0]; return { label: tableLabel(t), go: { type: 'PLAY_TRAIN' as const, game: (regionId === 'division' ? 'div' : 'mult') as ArcadeGame, selection: `${regionId === 'division' ? 'div' : 'mult'}:${t}`, label: tableLabel(t) } }; })()
    : skills.length ? { label: `${Math.round(Math.min(...skills.map((k) => skillMastery(k, state.mastery))))}%`, go: null } : null;
  const fight = (d: DepthDef, route?: 'quiet' | 'loud') => { play('open'); dispatch({ type: 'START_BATTLE', enemyId: d.enemyId, regionId, depth: d.depth, route }); };
  const current = depths.find((d) => d.depth === cleared + 1);

  return (
    <div className="sq-depths">
      <p className="sq-sub" style={{ margin: 0 }}>{keeper} · {cleared} of {depths.length} {lit}</p>
      <div className="sq-stats">
        <div className="sq-stat k-done"><b>{cleared}/{depths.length}</b><small>lanterns</small></div>
        <button className="sq-stat k-fix" disabled={!weakest?.go} onClick={() => { if (weakest?.go) { play('open'); dispatch(weakest.go); } }} style={{ cursor: weakest?.go ? 'pointer' : 'default', font: 'inherit', color: 'inherit' }}><b>{weakest?.label ?? '–'}</b><small>weakest{weakest?.go ? ' · train' : ''}</small></button>
        <div className="sq-stat k-next"><b>{sidesOpen}</b><small>side goals</small></div>
      </div>
      <div className="sq-rows">
        {depths.map((d) => {
          const e = enemyById(d.enemyId)!;
          const done = d.depth <= cleared;
          const now = d.depth === cleared + 1;
          const locked = d.depth > cleared + 1;
          const wins = state.world.depthWins[`${regionId}:${d.depth}`] ?? 0;
          const what = d.tables.length && tableLabel ? d.tables.map(tableLabel).join(' ') : e.title.split(' · ')[1] ?? e.title;
          const side = d.side && !sideDone(d) && !locked;
          return (
            <div key={d.depth} className={`sq-depth ${done ? 'lit' : now ? 'now' : 'locked'}`}>
              <span className="lamp">{d.depth}</span>
              <span className="main">
                <span className="name">{e.name} · {what}</span>
                <span className="meta">{locked ? `Beat ${unit.toLowerCase()} ${d.depth - 1}` : now ? `${d.name} · ${wins}/${d.clears} wins` : `${d.name} · lit${d.side && sideDone(d) ? ' · side goal done' : ''}`}</span>
                {side && <span className="side">★ {d.side!.text}</span>}
                {now && (
                  <span className="routes">
                    <button onClick={() => fight(d, 'quiet')} title="Fewer facts, a level harder">Quiet · fewer, harder</button>
                    <button onClick={() => fight(d, 'loud')} title="More facts, a level easier, +30% XP">Loud · more ×1.3 XP</button>
                  </span>
                )}
              </span>
              {locked ? <span className="end">🔒</span>
                : now ? <button className="go now" onClick={() => fight(d)}>Fight ▸</button>
                : side ? <button className="go side" onClick={() => fight(d)}>Side goal</button>
                : <button className="go" onClick={() => fight(d)}>Replay</button>}
            </div>
          );
        })}
      </div>
      <button className={`sq-boss ${boss.open ? '' : 'shut'}`} disabled={!boss.open} onClick={() => { play('boss-roar'); dispatch(boss.go); }}>
        <img src={boss.art} alt="" />
        <span><b>{boss.name}</b><small>{boss.line}</small></span>
        {boss.open && <span className="go">▸</span>}
      </button>
      {!current && <p className="sq-sub" style={{ textAlign: 'center', margin: 0 }}>Every {unit.toLowerCase()} is lit.</p>}
    </div>
  );
}


