import { useGame } from '../store';
import { useVersusRoom } from '../hooks/useVersusRoom';
import { NavalBattle } from './NavalBattle';
import { NavalConsole } from './NavalConsole';
import { battleWinners } from './battle';

export function NavalBlitz({ left, done, notYet }: { left: number; done: boolean; notYet: boolean }) {
  const { state, dispatch } = useGame(); const a = state.arcade!; const v = state.versus!;
  const room = useVersusRoom();
  const captain = v.players[v.turn]; const winners = battleWinners(v);
  const next = v.kind === 'hotseat' ? v.players[v.turn + 1] : undefined;
  return <div className="naval-screen naval-match">
    <header className="naval-header">
      <div><span className="naval-overline">{v.kind === 'online' ? `ROOM ${v.roomCode}` : 'PASS & PLAY'} / LEVEL {v.level + 1} OF {v.levels.length}</span><h2>NAVAL BLITZ</h2></div>
      <div className={`naval-clock ${left < 10000 && !done ? 'urgent' : ''}`} aria-label={`${done ? 0 : Math.ceil(left / 1000)} seconds left`}>{done ? '00' : String(Math.ceil(left / 1000)).padStart(2, '0')}<small>SEC</small></div>
      <button className="btn small ghost" onClick={() => dispatch({ type: 'VERSUS_EXIT' })}>Leave</button>
    </header>
    <div className="naval-time-track"><i style={{ width: `${done ? 0 : Math.min(100, left / 600)}%` }} /></div>
    {room.error && <p className="naval-connection" role="alert">{room.error}</p>}
    <div className="naval-combat-layout">
      <NavalBattle />
      {done ? <div className="naval-console naval-summary">
        <div className="naval-overline">CEASE FIRE</div>
        <h2>{winners.length ? winners.length > 1 ? 'SHARED VICTORY' : `${winners[0].name} WINS` : 'ROUND COMPLETE'}</h2>
        <p>{captain.name}: <b>{a.score} points</b> · {a.results.filter(r => r.correct).length} correct</p>
        <p>{next ? 'Pass the device to the next captain. Each player gets the same questions.' : winners.length ? 'The fleet has its final orders.' : 'Waiting for the rest of the fleet to finish.'}</p>
        <button className="btn primary big" onClick={() => dispatch({ type: 'VERSUS_CONTINUE' })}>{next ? `Pass to ${next.name}` : 'Battle results'}</button>
      </div> : notYet ? <div className="naval-console naval-summary"><h2>GUNS READY</h2><p>Waiting for the starting signal…</p></div> : <NavalConsole />}
    </div>
  </div>;
}
