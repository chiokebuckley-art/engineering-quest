import { useGame } from '../store';
import { LAB_EQUIPMENT } from '../../content/lab';
import { Icon, Panel } from '../components/ui';
import { skillMastery } from '../../engine/mastery/MasteryEngine';
import { skillById } from '../../engine/curriculum/skills';
import { QUESTS } from '../../engine/quests/questDefs';

export function LabScreen() {
  const { state, dispatch } = useGame();
  const unlocked = LAB_EQUIPMENT.filter((e) => state.world.labUnlocked.includes(e.id));
  const projects = QUESTS.filter((q) => q.kind === 'project');
  return (
    <div className="screen-scroll">
      <div className="container stack">
        <Panel title="Engineering Laboratory" icon="lab" right={<span className="chip">{unlocked.length}/{LAB_EQUIPMENT.length} stations</span>}>
          <p className="small muted">Your lab grows with your mathematics. Each station unlocks when the mathematics behind it is mastered — measurement after multiplication, circuits after algebra, robotics after trigonometry, simulation after calculus.</p>
          <div className="lab-floor">
            {LAB_EQUIPMENT.slice(1, 6).map((e) => {
              const on = state.world.labUnlocked.includes(e.id);
              return <div key={e.id} className={`lab-eq ${on ? '' : 'locked'}`} title={on ? e.description : e.unlocksWith}><img src={e.image} alt="" /><span className="nm">{on ? e.name : '???'}</span></div>;
            })}
          </div>
        </Panel>
        <div className="grid-2">
          <Panel title="Stations" icon="wrench">
            {LAB_EQUIPMENT.map((e) => {
              const on = state.world.labUnlocked.includes(e.id);
              return (
                <div key={e.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <b style={{ color: on ? 'var(--text)' : 'var(--muted)' }}>{on ? '✓ ' : '○ '}{e.name}</b>
                    <div className="small muted">{on ? e.description : e.unlocksWith}</div>
                    {!on && e.requires.map((r) => <span key={r.skillId} className="chip lock small" style={{ marginRight: 4 }}>{skillById(r.skillId)?.name}: {Math.round(skillMastery(r.skillId, state.mastery))}/{r.mastery}%</span>)}
                  </div>
                </div>
              );
            })}
          </Panel>
          <Panel title="Construction Projects" icon="anvil">
            {projects.map((p) => {
              const q = state.quests[p.id];
              return (
                <div key={p.id} className="list-row" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <b>{p.name}</b> <span className={`chip ${q?.status === 'completed' ? 'ok' : q?.status === 'active' ? 'warn' : 'lock'}`}>{q?.status}</span>
                    <div className="small muted">{p.summary}</div>
                  </div>
                  {q?.status === 'available' && <button className="btn small primary" onClick={() => dispatch({ type: 'ACCEPT_QUEST', questId: p.id })}>Begin</button>}
                </div>
              );
            })}
            <h4 style={{ marginTop: 12 }}>Future projects</h4>
            <p className="small muted">II · Water System (division & fractions) — III · Power Generator (ratios & units) — IV · Chemical Processing Plant (algebra) — V · Automated Factory (functions & systems) — VI · Advanced Research Facility (calculus).</p>
            <button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'quests' })}><Icon name="quest" /> Quest log</button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
