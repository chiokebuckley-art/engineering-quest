import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store';
import { Icon, Panel } from '../components/ui';
import { Confetti } from '../components/Fx';
import { parseSelection, blitzStars } from '../../engine/state/arcade';
import { makeRoomCode, normalizeRoomCode, inviteUrl } from '../net/room';
import { useVersusRoom } from '../hooks/useVersusRoom';
import type { ArcadeGame, VersusLevel } from '../../engine/state/types';
import { NavalBattle } from '../naval/NavalBattle';
import { battleWinners, shipClass, shipSize } from '../naval/battle';

/** Math picks a level can use. 'pick' is whatever the Arcade lobby currently has selected. */
const LEVEL_OPTIONS: { key: string; label: string; game: ArcadeGame; selection: string }[] = [
  { key: 'mult:all', label: 'Times tables', game: 'mult', selection: 'mult:all' },
  { key: 'div:all', label: 'Division', game: 'div', selection: 'div:all' },
  { key: 'add:100', label: 'Addition to 100', game: 'add', selection: 'add:100' },
  { key: 'sub:100', label: 'Subtraction to 100', game: 'sub', selection: 'sub:100' },
  { key: 'bonds:100', label: 'Number bonds to 100', game: 'bonds', selection: 'bonds:100' },
  { key: 'alg:all', label: 'Pre-algebra', game: 'alg', selection: 'alg:all' },
  { key: 'word:mixed', label: 'Word problems', game: 'word', selection: 'word:mixed' },
  { key: 'tricks:all', label: 'Math tricks', game: 'tricks', selection: 'tricks:all' },
  { key: 'mental:all', label: 'Mental + and −', game: 'mental', selection: 'mental:all' },
  { key: 'volume:all', label: 'Volume', game: 'volume', selection: 'volume:all' },
  { key: 'measure:all', label: 'Measuring', game: 'measure', selection: 'measure:all' },
  { key: 'geo:all', label: 'Shapes & angles', game: 'geo', selection: 'geo:all' },
  { key: 'rates:all', label: 'Rates', game: 'rates', selection: 'rates:all' },
  { key: 'fit:all', label: 'Precision & fit', game: 'fit', selection: 'fit:all' },
  { key: 'phys:all', label: 'Forces & power', game: 'phys', selection: 'phys:all' },
  { key: 'pipe:all', label: 'Plumbing', game: 'pipe', selection: 'pipe:all' },
  { key: 'prob:all', label: 'Probability', game: 'prob', selection: 'prob:all' },
  { key: 'spiral:all', label: 'Spiral review', game: 'spiral', selection: 'spiral:all' },
  { key: 'precalc:all', label: 'Calculus Prep', game: 'precalc', selection: 'precalc:all' },
  { key: 'mixed:all', label: 'Everything', game: 'mixed', selection: 'mixed:all' },
];
const RAMP = ['pick', 'mult:all', 'div:all', 'add:100', 'sub:100', 'bonds:100', 'word:mixed', 'alg:all', 'tricks:all', 'mixed:all'];
export const MATCH_LENGTHS = [3, 5, 10];

/** Set-up card shown inside the Arcade lobby. */
export function VersusSetup({ game, selection, durationMs, onClose, initialCode }: { game: ArcadeGame; selection: string; durationMs: number; onClose: () => void; initialCode?: string }) {
  const { state, dispatch, play } = useGame();
  const [kind, setKind] = useState<'hotseat' | 'online'>(initialCode ? 'online' : 'hotseat');
  const [names, setNames] = useState<string[]>([state.character?.name ?? 'Me', '']);
  const [code, setCode] = useState(initialCode ?? '');
  const cleanCode = normalizeRoomCode(code);
  const sel = parseSelection(game, selection);
  const [count, setCount] = useState(10);
  const [plan, setPlan] = useState<string[]>(RAMP);
  const options = [{ key: 'pick', label: `Arcade pick: ${sel.label}`, game, selection }, ...LEVEL_OPTIONS];
  const levelFor = (key: string): VersusLevel => { const o = options.find((x) => x.key === key) ?? options[0]; return { game: o.game, selection: o.selection }; };
  const levels: VersusLevel[] = plan.slice(0, count).map(levelFor);
  const preset = (keys: string[]) => { play('click'); setPlan(keys); };
  const start = () => {
    play('boss-roar');
    if (kind === 'hotseat') dispatch({ type: 'VERSUS_SETUP', kind, game, selection, names: names.filter((n, i) => i === 0 || n.trim()), durationMs, levels });
    else dispatch({ type: 'VERSUS_SETUP', kind, game, selection, names: [state.character?.name ?? 'Host'], roomCode: makeRoomCode(), isHost: true, durationMs, levels });
  };
  const join = () => {
    if (cleanCode.length < 4) return;
    play('open');
    dispatch({ type: 'VERSUS_SETUP', kind: 'online', game, selection, names: [state.character?.name ?? 'Player'], roomCode: cleanCode, isHost: false, durationMs });
  };
  return (
    <Panel title={`Naval Blitz · ${sel.label}`} icon="sword" right={<button className="btn small ghost" onClick={onClose}>Close</button>}>
      <p className="small muted">Command a 3D warship against your friends. <b>Correct answers fire shells.</b> Same questions, highest score wins the level. <b>Win a level and your ship grows.</b> Ten levels, each with its own math.</p>
      <div className="row wrap" style={{ margin: '8px 0' }}>
        <button className={`btn ${kind === 'hotseat' ? 'primary' : 'ghost'}`} onClick={() => setKind('hotseat')}><Icon name="home" /> Pass & Play (one device)</button>
        <button className={`btn ${kind === 'online' ? 'primary' : 'ghost'}`} onClick={() => setKind('online')}><Icon name="circuit" /> Online Room (own phones)</button>
      </div>
      {kind === 'hotseat' && (
        <div className="stack">
          {names.map((n, i) => (
            <div key={i} className="row">
              <span className="chip" style={{ minWidth: 70 }}>Player {i + 1}</span>
              <input className="text" style={{ flex: 1 }} value={n} placeholder={i === 0 ? 'You' : 'Name'} onChange={(e) => setNames((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))} maxLength={16} />
              {i > 1 && <button className="btn small ghost" onClick={() => setNames((arr) => arr.filter((_, j) => j !== i))}>✕</button>}
            </div>
          ))}
          <div className="row wrap">
            {names.length < 6 && <button className="btn small" onClick={() => setNames((arr) => [...arr, ''])}>+ Add player</button>}
            <span className="spacer" />
            <button className="btn primary big" disabled={!names[1]?.trim()} onClick={start}><Icon name="sword" /> Start match</button>
          </div>
        </div>
      )}
      {kind === 'online' && (
        <div className="grid-2">
          <div className="panel tight stack">
            <b>Host a room</b>
            <p className="small muted">You get a 4-letter code. Friends type it on their phones. You pick when to start.</p>
            <button className="btn primary" onClick={start}><Icon name="unlock" /> Create room</button>
          </div>
          <div className="panel tight stack">
            <b>Join a room</b>
            <form className="row" onSubmit={(e) => { e.preventDefault(); join(); }}>
              <input className="text code" type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CODE" autoCapitalize="characters" autoCorrect="off" autoComplete="off" spellCheck={false} inputMode="text" enterKeyHint="go" aria-label="Room code" />
              <button type="submit" className="btn primary" disabled={cleanCode.length < 4}>Join</button>
            </form>
            <p className="small muted">Type the 4-character code (capitals don't matter), or tap the host's invite link. Needs internet on both phones.</p>
          </div>
        </div>
      )}
      <p className="small muted" style={{ marginTop: 10 }}>Then pick the math for each level:</p>
      <div className="plan-head">
        <b>Match plan</b>
        <span className="small muted">Levels:</span>
        {MATCH_LENGTHS.map((n) => <button key={n} className={`btn small ${count === n ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setCount(n); }}>{n}</button>)}
        <span className="spacer" />
        <button className="btn small ghost" onClick={() => preset(RAMP)}>Ramp</button>
        <button className="btn small ghost" onClick={() => preset(Array(10).fill('pick'))}>All my pick</button>
        <button className="btn small ghost" onClick={() => preset(Array(10).fill('mixed:all'))}>All mixed</button>
      </div>
      <div className="plan-grid">
        {plan.slice(0, count).map((key, i) => (
          <label key={i} className="plan-row">
            <span className="lv">L{i + 1}</span>
            <select value={key} onChange={(e) => setPlan((p) => p.map((k, j) => (j === i ? e.target.value : k)))} aria-label={`Level ${i + 1} math`}>
              {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </label>
        ))}
      </div>
    </Panel>
  );
}

export function VersusScreen() {
  const { state, dispatch, play } = useGame();
  const v = state.versus!;
  const room = useVersusRoom();
  const sel = parseSelection(v.game, v.selection);
  const ranked = [...v.players].sort((a, b) => b.score - a.score || b.correct - a.correct);
  const winners = battleWinners(v);
  const [count, setCount] = useState<number | null>(null);
  const lastLevel = v.level + 1 >= v.levels.length;
  const nextLv = lastLevel ? null : parseSelection(v.levels[v.level + 1].game, v.levels[v.level + 1].selection);
  const standings = [...v.players].sort((a, b) => (v.wins[b.id] ?? 0) - (v.wins[a.id] ?? 0) || b.score - a.score);
  const champions = standings.filter((p) => (v.wins[p.id] ?? 0) === (v.wins[standings[0]?.id] ?? 0) && (v.wins[p.id] ?? 0) > 0);
  const goNext = () => { play('open'); if (v.kind === 'hotseat') dispatch({ type: 'VERSUS_NEXT_LEVEL' }); else if (v.isHost) room.nextLevel(); else room.requestNext(); };
  const goRematch = () => { play('open'); if (v.kind === 'hotseat') dispatch({ type: 'VERSUS_REMATCH' }); else if (v.isHost) room.rematch(); else room.requestRematch(); };
  const lastTick = useRef<number>(); const celebrated = useRef('');
  const me = v.players.find((p) => p.isMe);

  // Online: when a round is announced, count down to startAt and begin.
  useEffect(() => {
    if (v.kind !== 'online' || v.status !== 'ready' || !v.startAt) return;
    const t = setInterval(() => {
      const left = Math.ceil((v.startAt! - Date.now()) / 1000);
      setCount(Math.max(0, left));
      if (left <= 0) { clearInterval(t); setCount(null); dispatch({ type: 'VERSUS_BEGIN_TURN' }); }
      else if (lastTick.current !== left) { lastTick.current = left; play('tick'); }
    }, 250);
    return () => clearInterval(t);
  }, [v.kind, v.status, v.startAt, dispatch, play]);

  useEffect(() => { const key = `${v.seed}:${v.round}`; if (v.status === 'results' && celebrated.current !== key) { celebrated.current = key; play('fanfare'); } }, [v.status, v.seed, v.round, play]);

  return (
    <div className="naval-screen">
      {v.status === 'results' && <Confetti trigger={1} count={60} />}
      <div className="naval-header">
        <div><span className="naval-overline">Level {v.level + 1} of {v.levels.length} · {v.kind === 'online' ? `Room ${v.roomCode}` : 'Pass & Play'} · {sel.label}</span><h2>NAVAL BLITZ</h2></div>
        <button className="btn small ghost" onClick={() => dispatch({ type: 'VERSUS_EXIT' })}>Leave</button>
      </div>
      {room.error && <p className="naval-connection" role="alert">{room.error}</p>}
      <div className="naval-port">
        <NavalBattle />
        <div className="stack" style={{ minWidth: 0 }}>
          {v.status === 'lobby' && (
            <div className="panel center stack">
              <h1 className="brass">ROOM {v.roomCode}</h1>
              <p className="small">{v.isHost ? 'Tell your friends this code. Press Start when everyone is in.' : 'Waiting for the host to start…'}</p>
              {room.status && <p className="small muted">{room.status}</p>}
              {v.isHost && <ShareInvite code={v.roomCode!} />}
              <MatchPlan levels={v.levels} level={v.level} />
              <Roster players={v.players} live={false} wins={v.wins} />
              {v.isHost && <button className="btn primary big" disabled={v.players.length < 2 || !room.connected} onClick={() => { play('open'); room.startRound(); }}><Icon name="sword" /> Launch battle</button>}
              {v.isHost && v.players.length < 2 && <p className="small muted">Need at least one more player.</p>}
            </div>
          )}
          {v.status === 'ready' && (
            <div className="panel center stack">
              {v.kind === 'hotseat' ? (
                <>
                  <h1 className="brass">{v.players[v.turn].name}, you're up!</h1>
                  <p>Level {v.level + 1} of {v.levels.length}: <b>{sel.label}</b>. Solve fast to fire on the rival fleet.</p>
                  <Roster players={v.players} live={false} highlight={v.turn} wins={v.wins} />
                  <button className="btn primary big" onClick={() => { play('boss-roar'); dispatch({ type: 'VERSUS_BEGIN_TURN' }); }}><Icon name="hourglass" /> Start my 60 seconds</button>
                </>
              ) : (
                <>
                  <h1 className="brass">{count === null ? 'Get ready…' : count === 0 ? 'GO!' : count}</h1>
                  <p>Level {v.level + 1} of {v.levels.length}: <b>{sel.label}</b>. Everyone starts together.</p>
                  <Roster players={v.players} live={false} wins={v.wins} />
                </>
              )}
            </div>
          )}
          {v.status === 'between' && (
            <div className="panel center stack">
              <h1 className="brass">Waiting for the others…</h1>
              <Roster players={v.players} live />
              {me && <p className="small muted">You scored {me.score} points ({me.correct} right).</p>}
            </div>
          )}
          {v.status === 'results' && (
            <div className="panel center stack">
              <h1 className="brass">{lastLevel ? 'MATCH OVER' : winners.length > 1 ? 'SHARED VICTORY' : winners.length ? `${winners[0].name} WINS LEVEL ${v.level + 1}!` : 'BATTLE COMPLETE'}</h1>
              {lastLevel && <p className="champion">{champions.length > 1 ? `${champions.map((p) => p.name).join(' and ')} share the seas with ${v.wins[champions[0].id]} levels each.` : champions.length ? `${champions[0].name} rules the seas with ${v.wins[champions[0].id]} of ${v.levels.length} levels!` : 'Nobody won a level.'}</p>}
              <p>{winners.length > 1 ? `${winners.map(p => p.name).join(' and ')} tied on points and correct answers. Both ships grow.` : winners.length ? `${winners[0].name}'s ship grows to a ${shipClass(v.wins[winners[0].id] ?? 0)}. The rival fleet sinks.` : 'All captains left the battle.'}</p>
              <div className="podium">
                {ranked.slice(0, 3).map((p, i) => (
                  <div key={p.id} className={`podium-step p${i + 1}`} style={{ ['--pc' as string]: p.color }}>
                    <div className="podium-name">{p.name}</div>
                    <div className="podium-score">{p.score}</div>
                    <div className="podium-sub">{p.withdrawn ? 'Disconnected' : `${p.correct} right · ${'★'.repeat(blitzStars(p.correct)) || '—'}`}</div>
                    <div className="podium-block">{winners.some(w => w.id === p.id) ? '★' : '—'}</div>
                  </div>
                ))}
              </div>
              {ranked.length > 3 && <div className="small muted">{ranked.slice(3).map((p, i) => `${i + 4}. ${p.name} — ${p.score}`).join(' · ')}</div>}
              <Standings players={standings} wins={v.wins} total={v.levels.length} />
              <div className="row wrap" style={{ justifyContent: 'center' }}>
                {!lastLevel && <button className="btn primary big" disabled={v.kind === 'online' && (!room.connected || room.asked === 'next')} onClick={goNext}>Next level ▸ L{v.level + 2}: {nextLv!.label}</button>}
                <button className={`btn ${lastLevel ? 'primary big' : ''}`} disabled={v.kind === 'online' && (!room.connected || room.asked === 'rematch')} onClick={goRematch}>{lastLevel ? 'New match' : 'Restart match'}</button>
                <button className="btn" onClick={() => dispatch({ type: 'VERSUS_EXIT' })}>Back to Arcade</button>
              </div>
              {v.kind === 'online' && !v.isHost && room.asked && <p className="small muted">Asked the host to start {room.asked === 'next' ? 'the next level' : 'a new match'}. It begins for everyone when their device answers.</p>}
            </div>
          )}
          <p className="naval-rules">Every 10 points launches a shell. Fast answers and streaks earn more points. Highest score wins the level, then most correct answers breaks a tie. Every level you win makes your ship bigger: patrol boat, corvette, frigate… up to leviathan. Any captain can call the next level or a new match.</p>
        </div>
      </div>
    </div>
  );
}

function MatchPlan({ levels, level }: { levels: VersusLevel[]; level: number }) {
  if (levels.length <= 1) return null;
  return (
    <div className="match-plan">
      {levels.map((l, i) => <span key={i} className={`chip ${i === level ? 'ok' : i < level ? 'done' : ''}`}>{i + 1}. {parseSelection(l.game, l.selection).label}</span>)}
    </div>
  );
}

/** Levels won, ship class and a hull that grows with every win. */
function Standings({ players, wins, total }: { players: import('../../engine/state/types').VersusPlayer[]; wins: Record<string, number>; total: number }) {
  if (total <= 1) return null;
  return (
    <div className="standings">
      {players.map((p) => { const w = wins[p.id] ?? 0; return (
        <div key={p.id} className="standing" style={{ ['--pc' as string]: p.color }}>
          <span className="ship-glyph" style={{ fontSize: `${1.3 * shipSize(w)}rem` }}>🚢</span>
          <span className="nm">{p.name}{p.isMe ? ' (you)' : ''}</span>
          <span className="cls">{shipClass(w)}</span>
          <span className="w">{w}/{total} {w === 1 ? 'level' : 'levels'}</span>
        </div>
      ); })}
    </div>
  );
}

export function Roster({ players, live, highlight, wins }: { players: import('../../engine/state/types').VersusPlayer[]; live: boolean; highlight?: number; wins?: Record<string, number> }) {
  const max = Math.max(1, ...players.map((p) => p.score));
  return (
    <div className="roster">
      {players.map((p, i) => (
        <div key={p.id} className={`roster-row ${highlight === i ? 'hl' : ''}`} style={{ ['--pc' as string]: p.color }}>
          <span className="dot" />
          <span className="nm">{p.name}{p.isMe ? ' (you)' : ''}</span>
          {wins && (wins[p.id] ?? 0) > 0 && <span className="chip small" title={shipClass(wins[p.id])}>{'⚓'.repeat(Math.min(5, wins[p.id]))}{wins[p.id] > 5 ? `×${wins[p.id]}` : ''} {shipClass(wins[p.id])}</span>}
          {live && <span className="bar thin" style={{ flex: 1 }}><i style={{ width: `${(p.score / max) * 100}%`, background: p.color }} /></span>}
          <span className="sc">{p.withdrawn ? 'Left' : live || p.done ? `${p.score}${p.done ? ' ✓' : ''}` : ''}</span>
        </div>
      ))}
    </div>
  );
}

/** Compact live scoreboard shown during a versus blitz. */
export function LiveBoard() {
  const { state } = useGame();
  const v = state.versus;
  if (!v) return null;
  const ranked = [...v.players].sort((a, b) => b.score - a.score);
  return (
    <div className="liveboard">
      {ranked.map((p, i) => <span key={p.id} className={`lb ${p.isMe ? 'me' : ''}`} style={{ ['--pc' as string]: p.color }}>{i + 1}. {p.name} <b>{p.score}</b>{p.done && v.kind === 'online' ? ' ✓' : ''}</span>)}
    </div>
  );
}

/** Host: send friends a link that opens the game straight into this room. */
function ShareInvite({ code }: { code: string }) {
  const { play } = useGame();
  const [msg, setMsg] = useState('');
  const url = inviteUrl(code);
  const share = async () => {
    play('click');
    const nav = navigator as Navigator & { share?: (d: { title?: string; text?: string; url?: string }) => Promise<void> };
    try {
      if (nav.share) { await nav.share({ title: 'Engineering Quest', text: `Join my Naval Blitz room ${code}`, url }); return; }
      await navigator.clipboard.writeText(url); setMsg('Link copied. Paste it to your friends.');
    } catch { setMsg(url); }
  };
  return (
    <div className="stack" style={{ alignItems: 'center', gap: 4 }}>
      <button className="btn small" onClick={share}><Icon name="circuit" /> Share invite link</button>
      {msg && <p className="small muted" style={{ wordBreak: 'break-all' }}>{msg}</p>}
    </div>
  );
}
