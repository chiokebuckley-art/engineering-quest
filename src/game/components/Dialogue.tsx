import { useGame } from '../store';
import { NPCS } from '../../content/npcs';

export function DialogueOverlay() {
  const { state, dispatch, play } = useGame();
  const d = state.dialogue;
  if (!d) return null;
  const line = d.lines[d.index];
  const npc = NPCS[line.speaker] ?? NPCS[d.npcId];
  const last = d.index + 1 >= d.lines.length;
  return (
    <div className="dialogue-overlay" onClick={() => { play('click'); dispatch({ type: 'DIALOGUE_NEXT' }); }}>
      <div className="dialogue" onClick={(e) => e.stopPropagation()}>
        <img src={npc.portrait} alt={npc.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="who">{npc.name}</div>
          <div className="role">{npc.role}</div>
          <div className="text" key={d.index} style={{ animation: 'rise 0.25s ease' }}>{line.text}</div>
          <div className="actions">
            <span className="count">{d.index + 1} / {d.lines.length}</span>
            <button className="btn small ghost" onClick={() => dispatch({ type: 'DIALOGUE_CLOSE' })}>Skip</button>
            <button className="btn small primary" onClick={() => { play('click'); dispatch({ type: 'DIALOGUE_NEXT' }); }}>{last ? 'Done' : 'Next ▸'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
