import { useGame } from '../store';
import { QUESTS } from '../../engine/quests/questDefs';
import { objectiveDone, objectiveTarget } from '../../engine/quests/QuestEngine';
import { NPCS } from '../../content/npcs';
import { Icon, Panel } from '../components/ui';
import { ACHIEVEMENTS } from '../../engine/progression/achievements';

export function QuestScreen() {
  const { state, dispatch, play } = useGame();
  const order = { active: 0, available: 1, completed: 2, locked: 3 } as const;
  const list = [...QUESTS].filter((q) => state.quests[q.id]?.status !== 'locked').sort((a, b) => order[state.quests[a.id].status] - order[state.quests[b.id].status]);
  return (
    <div className="screen-scroll">
      <div className="container stack">
        <Panel title="Quest Log" icon="quest">
          <p className="small muted">Story quests restore the Engine. Training quests build fluency. Engineering quests build things. Everything feeds the same mastery.</p>
        </Panel>
        <div className="grid-2">
          {true && <button className="btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'countlab', params: { view: 'quest' } })}>♠ Count Lab · Station Analyst path · Parent PIN</button>}
          {list.map((q) => {
            const s = state.quests[q.id];
            const giver = NPCS[q.giver];
            return (
              <div key={q.id} className={`panel quest-card ${q.kind}`}>
                <div className="row" style={{ alignItems: 'flex-start' }}>
                  <img src={giver.portrait} alt="" style={{ width: 44, height: 44, borderRadius: 10, border: `2px solid ${giver.color}` }} />
                  <div style={{ flex: 1 }}>
                    <div className="row wrap"><h3>{q.name}</h3><span className={`chip ${s.status === 'completed' ? 'ok' : s.status === 'active' ? 'warn' : ''}`}>{q.kind} · {s.status}</span></div>
                    <div className="small muted">{giver.name}</div>
                  </div>
                </div>
                <p className="small" style={{ margin: '8px 0' }}>{q.story}</p>
                {q.objectives.map((o) => (
                  <div key={o.id} className={`obj ${objectiveDone(o, s.progress) ? 'done' : ''}`}><span className="box">{objectiveDone(o, s.progress) ? '✓' : ''}</span><span>{o.text}</span><span className="spacer" /><span className="small muted">{Math.min(s.progress[o.id] ?? 0, objectiveTarget(o))}/{objectiveTarget(o)}</span></div>
                ))}
                <div className="row wrap small muted" style={{ marginTop: 8 }}>
                  <span><Icon name="star" /> {q.reward.xp} XP</span>
                  {q.reward.items?.map((i) => <span key={i.itemId}>· {i.qty} × {i.itemId.replace(/-/g, ' ')}</span>)}
                  {q.reward.unlocksRegion && <span>· unlocks region</span>}
                  {q.reward.unlocksLab && <span>· unlocks lab station</span>}
                  <span className="spacer" />
                  {s.status === 'available' && <button className="btn small primary" onClick={() => { play('quest'); dispatch({ type: 'ACCEPT_QUEST', questId: q.id }); }}>Accept</button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AchievementsScreen() {
  const { state } = useGame();
  return (
    <div className="screen-scroll">
      <div className="container stack">
        <Panel title="Achievements" icon="trophy" right={<span className="chip">{Object.keys(state.achievements).length}/{ACHIEVEMENTS.length}</span>}>
          <div className="grid-3">
            {ACHIEVEMENTS.map((a) => {
              const at = state.achievements[a.id];
              return <div key={a.id} className={`item-card ${at ? 'rare' : ''}`} style={{ opacity: at ? 1 : 0.55 }}><Icon name={a.icon} /><div><b>{a.name}</b><div className="small muted">{a.description}</div>{at && <div className="small teal">Unlocked {new Date(at).toLocaleDateString()}</div>}</div></div>;
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

