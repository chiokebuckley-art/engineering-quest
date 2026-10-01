import { GearAvatarPicker, gearAsset } from '../components/GearAvatarPicker';
import { normalizeGearAvatar, suggestedGearAvatar, gearSpotlightId, type GearAvatarId } from '../../engine/state/gearAvatars';
import '../../styles/gear-studio.css';
const GearStudio = lazy(() => import('../components/GearStudio'));
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useGame } from '../store';
import { Icon, Panel } from '../components/ui';
import { MathChallenge } from '../components/MathChallenge';
import { Confetti, Callout } from '../components/Fx';
import { CHAIN, BOT_LEVELS, active, byId, chainValue, currentId, strength, roundMsFor, FINAL_QUESTIONS, type GearSetup, type Contestant } from '../../engine/state/gear';
import { parseSelection } from '../../engine/state/arcade';
import { makeRoomCode, normalizeRoomCode, inviteUrl } from '../net/room';
import { useGearRoom } from '../hooks/useGearRoom';
import { BondPicker } from '../components/BondPicker';
import type { ArcadeGame } from '../../engine/state/types';
import { CapsGate, CapsRoomGuard, CapsStrip, ClockConsent, capGrade, capsGateFor, capMath, gearSelectionOk } from './ArcadeScreen';
import { GRADES } from '../../engine/contest/grades';

/** The math a Weakest Gear game can be played on (exported for the grade caps test). */
export const GEAR_MATH: { key: string; label: string; game: ArcadeGame; selection: string }[] = [
  { key: 'mixed:all', label: 'Everything mixed', game: 'mixed', selection: 'mixed:all' },
  { key: 'mult:all', label: 'Times tables', game: 'mult', selection: 'mult:all' },
  { key: 'div:all', label: 'Division', game: 'div', selection: 'div:all' },
  { key: 'mental:all', label: 'Mental + and −', game: 'mental', selection: 'mental:all' },
  { key: 'bonds:100', label: 'Number bonds', game: 'bonds', selection: 'bonds:100' },
  { key: 'word:mixed', label: 'Word problems', game: 'word', selection: 'word:mixed' },
  { key: 'tricks:all', label: 'Math tricks', game: 'tricks', selection: 'tricks:all' },
  { key: 'alg:all', label: 'Pre-algebra', game: 'alg', selection: 'alg:all' },
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
];

export function WeakestGearScreen() {
  const { state } = useGame();
  if (state.gear) return <Arena />;
  // Contest Path caps: not on the Grade 1 path; Grade 3 after a calm streak.
  const gate = capsGateFor(state, { notFor: ['g1'], streakFor: ['g3'] });
  return gate ? <CapsGate title="Weakest Gear" reason={gate} /> : <GearSetupScreen />;
}

function GearSetupScreen() {
  const { state, dispatch, play } = useGame();
  const rec = state.stats.gear;
  const [friends, setFriends] = useState<string[]>([]);
  const [avatarId, setAvatarId] = useState<GearAvatarId>(() => suggestedGearAvatar(state.character?.name));
  const [friendAvatars, setFriendAvatars] = useState<GearAvatarId[]>([]);
  const [bots, setBots] = useState(3);
  const [level, setLevel] = useState<'easy' | 'medium' | 'hard'>('medium');
  // Contest Path caps: only the math the grade may play all the way up the chain, and the round clock after a yes.
  const grade = capGrade(state.contest);
  const math = capMath(grade, GEAR_MATH, true);
  const [picked, setPick] = useState('mixed:all');
  const pick = math.some((m) => m.key === picked) ? picked : math[0]?.key ?? 'mixed:all';
  const [consent, setConsent] = useState<'start' | 'join' | null>(null);
  const [bond, setBond] = useState(10);
  const [roundS, setRoundS] = useState(90);
  const inviteCode = typeof state.screenParams.room === 'string' ? state.screenParams.room : '';
  const [mode, setMode] = useState<'local' | 'online'>(inviteCode ? 'online' : 'local');
  const [code, setCode] = useState(inviteCode);
  const cleanCode = normalizeRoomCode(code);
  const total = mode === 'online' ? 1 + bots : 1 + friends.filter((f) => f.trim()).length + bots;
  const myId = () => `p-${Math.random().toString(36).slice(2, 8)}`;
  const start = () => {
    play('boss-roar');
    const m = math.find((x) => x.key === pick) ?? GEAR_MATH[0];
    const setup: GearSetup = { selection: { game: m.game, key: m.game === 'bonds' ? `bonds:${bond}` : m.selection }, me: state.character?.name ?? 'You', avatarId, friendAvatars: friends.map((_,i) => friendAvatars[i] ?? 'engineer').filter((_,i) => friends[i].trim()), friends: mode === 'online' ? [] : friends.filter((f) => f.trim()), bots: Array.from({ length: bots }, () => ({ level })), roundMs: roundS * 1000 };
    if (mode === 'online') setup.online = { roomCode: makeRoomCode(), isHost: true, myId: myId() };
    dispatch({ type: 'GEAR_START', setup });
  };
  const join = () => {
    if (cleanCode.length < 4) return;
    play('open');
    dispatch({ type: 'GEAR_START', setup: { selection: { game: 'mixed', key: 'mixed:all' }, me: state.character?.name ?? 'Player', avatarId, friends: [], bots: [], online: { roomCode: cleanCode, isHost: false, myId: myId() } } });
  };
  return (
    <div className="screen-scroll gear-bg">
      <div className="container stack" style={{ maxWidth: 860 }}>
        <div className="row wrap">
          <h2 className="brass">Weakest Gear</h2>
          <span className="chip">{rec.wins}/{rec.games} won</span>
          {rec.bestPot > 0 && <span className="chip">Best pot {rec.bestPot}</span>}
          <span className="spacer" />
          <button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'arcade' })}>Arcade</button>
        </div>
        <div className="gear-hero">
          <div className="gear-logo"><span>THE STUDIO</span><b>WEAKEST GEAR</b></div>
          <p>Questions go round the podiums. Every right answer climbs the chain. <b>BANK</b> to lock gears into the pot. A miss drops the chain to zero. When the clock runs out, vote off the weakest gear. The last two fight for the pot.</p>
        </div>
        <CapsStrip />
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          <button className={`btn ${mode === 'local' ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setMode('local'); }}><Icon name="home" /> Same phone (pass & play)</button>
          <button className={`btn ${mode === 'online' ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setMode('online'); }}><Icon name="circuit" /> Online room (own phones)</button>
        </div>
        {mode === 'online' && (
          <Panel title="Join a friend's arena" icon="unlock">
            <form className="row" onSubmit={(e) => { e.preventDefault(); if (grade) { if (cleanCode.length >= 4) setConsent('join'); } else join(); }}>
              <input className="text code" type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CODE" autoCapitalize="characters" autoCorrect="off" autoComplete="off" spellCheck={false} inputMode="text" enterKeyHint="go" aria-label="Room code" />
              <button type="submit" className="btn primary" disabled={cleanCode.length < 4}>Join</button>
            </form>
            <p className="small muted">Or create your own arena below: you pick the computer players, the math and the clock, then share the code or invite link.</p>
          </Panel>
        )}
        <GearAvatarPicker value={avatarId} onChange={setAvatarId} label="Choose your studio avatar" />
        <div className="grid-2">
          <Panel title="Contestants" icon="skill-tree" right={<span className="chip">{mode === 'online' ? `you + ${bots} computer + friends who join` : `${total} podiums`}</span>}>
            <p className="small muted">You: <b>{state.character?.name}</b>. {mode === 'online' ? 'Friends join on their own phones with the room code.' : 'Add friends who pass the phone around, and computer contestants.'}</p>
            <div className="stack">
              {mode === 'local' && friends.map((f, i) => <div key={i} className="gear-friend-row"><span className="chip">Friend {i + 1}</span><input className="text" aria-label={`Friend ${i+1} name`} value={f} placeholder="Name" maxLength={14} onChange={(e) => setFriends((a) => a.map((x, j) => (j === i ? e.target.value : x)))} /><GearAvatarPicker compact label={`Friend ${i+1} avatar`} value={friendAvatars[i] ?? 'engineer'} onChange={id => setFriendAvatars(a => friends.map((_,j) => j===i?id:(a[j]??'engineer')))} /><button aria-label={`Remove friend ${i+1}`} className="btn small ghost" onClick={() => {setFriends(a => a.filter((_,j)=>j!==i));setFriendAvatars(a=>a.filter((_,j)=>j!==i));}}>✕</button></div>)}
              {mode === 'local' && friends.length < 3 && <button className="btn small" onClick={() => { play('click'); setFriends((a) => [...a, '']); setFriendAvatars(a => [...a, 'engineer']); }}>+ Add a friend</button>}
            </div>
            <div className="row wrap" style={{ marginTop: 10 }}>
              <span className="small muted">Computer players:</span>
              {[0, 1, 2, 3, 4, 5].map((n) => <button key={n} className={`btn small ${bots === n ? 'primary' : 'ghost'}`} disabled={mode === 'local' && (1 + friends.length + n < 3 || 1 + friends.length + n > 8)} onClick={() => { play('click'); setBots(n); }}>{n}</button>)}
            </div>
            <div className="row wrap" style={{ marginTop: 6 }}>
              <span className="small muted">Their skill:</span>
              {BOT_LEVELS.map((l) => <button key={l.id} className={`btn small ${level === l.id ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setLevel(l.id); }}>{l.label}</button>)}
            </div>
          </Panel>
          <Panel title="The questions" icon="book">
            <div className="row wrap">
              {math.map((m) => <button key={m.key} className={`btn small ${pick === m.key ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setPick(m.key); }}>{m.label}</button>)}
            </div>
            {pick.startsWith('bonds:') && <BondPicker value={bond} onChange={setBond} />}
            <div className="row wrap" style={{ marginTop: 10 }}>
              <span className="small muted">Round clock:</span>
              {[60, 90, 120].map((s) => <button key={s} className={`btn small ${roundS === s ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setRoundS(s); }}>{s}s</button>)}
            </div>
            <p className="small muted" style={{ marginTop: 8 }}>The chain: {CHAIN.join(' → ')} gears. Harder questions higher up. Each later round is 10 seconds shorter.</p>
          </Panel>
        </div>
        {consent && <ClockConsent what={`Weakest Gear: rounds of ${roundS} seconds, each later round 10 seconds shorter.`} onYes={() => { const c = consent; setConsent(null); if (c === 'join') join(); else start(); }} onNo={() => setConsent(null)} />}
        <button className="btn primary big" disabled={mode === 'local' && (total < 3 || total > 8)} onClick={() => { if (grade) { play('click'); setConsent('start'); } else start(); }}><Icon name="cog" /> {mode === 'online' ? 'Create arena room' : 'Enter the arena'}</button>
        {mode === 'local' && total < 3 && <p className="small muted">Need at least three contestants.</p>}
      </div>
    </div>
  );
}

function Podium({ c, activeNow, out, votes, me }: { c: Contestant; activeNow: boolean; out: boolean; votes?: number; me: boolean }) {
  return (
    <div className={`podium ${activeNow ? 'lit' : ''} ${out ? 'out' : ''} ${me ? 'me' : ''}`} style={{ ['--pc' as string]: c.color }}>
      <div className="ring">{normalizeGearAvatar(c.avatarId) === 'engineer' ? <Icon name={c.bot ? 'robot' : 'helmet'} /> : <img className="gear-portrait" src={gearAsset(`${normalizeGearAvatar(c.avatarId)}.jpg`)} alt={`${normalizeGearAvatar(c.avatarId)} avatar`} />}</div>
      <div className="pname">{c.name}{me ? ' (you)' : ''}</div>
      <div className="pstat">{out ? 'OUT' : `${c.round.right}✓ ${c.round.wrong}✗${c.round.banked ? ` · ${c.round.banked}` : ''}`}{votes !== undefined && votes > 0 ? ` · ${votes} vote${votes === 1 ? '' : 's'}` : ''}</div>
    </div>
  );
}

function Lobby() {
  const { state, dispatch, play } = useGame();
  const g = state.gear!; const o = g.online!; const room = useGearRoom();
  const total = o.lobby.length + g.setup.bots.length;
  const [msg, setMsg] = useState('');
  const url = `${inviteUrl(o.roomCode)}&game=gear`;
  const share = async () => {
    play('click');
    const nav = navigator as Navigator & { share?: (d: { title?: string; text?: string; url?: string }) => Promise<void> };
    try { if (nav.share) { await nav.share({ title: 'Weakest Gear', text: `Join my arena ${o.roomCode}`, url }); return; } await navigator.clipboard.writeText(url); setMsg('Link copied.'); } catch { setMsg(url); }
  };
  return (
    <div className="screen-scroll gear-bg">
      <div className="container stack" style={{ maxWidth: 680 }}>
        <div className="row wrap"><h2 className="brass">Weakest Gear</h2><span className="spacer" /><button className="btn small ghost" onClick={() => dispatch({ type: 'GEAR_EXIT' })}>Leave</button></div>
        {room.error && <p className="naval-connection" role="alert">{room.error}</p>}
        <div className="panel center stack">
          <h1 className="brass">ARENA {o.roomCode}</h1>
          <p className="small">{o.isHost ? 'Friends join with this code or the invite link. Press Start when everyone is in.' : 'Waiting for the host to start…'}</p>
          {room.status && <p className="small muted">{room.status}</p>}
          {o.isHost && <div className="stack" style={{ alignItems: 'center', gap: 4 }}><button className="btn small" onClick={share}><Icon name="circuit" /> Share invite link</button>{msg && <p className="small muted" style={{ wordBreak: 'break-all' }}>{msg}</p>}</div>}
          <div className="lobby-roster">
            {o.lobby.map((p) => <span key={p.id} className="chip">{p.name}{p.id === o.myId ? ' (you)' : ''}</span>)}
            {o.isHost && g.setup.bots.map((b, i) => <span key={i} className="chip muted"><Icon name="robot" /> {BOT_LEVELS.find((l) => l.id === b.level)?.label}</span>)}
          </div>
          {o.isHost ? <p className="small muted">{total} podium{total === 1 ? '' : 's'} · {parseSelection(g.selection.game, g.selection.key).label} · {(g.roundMs / 1000).toFixed(0)}s rounds</p> : <p className="small muted">The host picks the math, the clock and the computer players.</p>}
          {o.isHost && <button className="btn primary big" disabled={total < 3 || total > 8 || !room.connected} onClick={() => { play('boss-roar'); dispatch({ type: 'GEAR_LAUNCH' }); }}><Icon name="cog" /> Start the show</button>}
          {o.isHost && total < 3 && <p className="small muted">Need at least three podiums: add friends or computer players.</p>}
        </div>
      </div>
    </div>
  );
}

function Arena() {
  const { state, dispatch } = useGame();
  const g = state.gear!;
  const room = useGearRoom();
  const online = g.online; const isHost = !online || online.isHost; const myId = online?.myId ?? 'me';
  /** Guests send actions to the host; the host (and pass-and-play) applies them directly. */
  const actAnswer = (given: string) => { if (isHost) dispatch({ type: 'GEAR_ANSWER', given }); else { dispatch({ type: 'GEAR_LOCAL_ANSWER', given }); room.sendAction({ action: 'answer', given }); } };
  const actBank = () => { if (isHost) dispatch({ type: 'GEAR_BANK' }); else room.sendAction({ action: 'bank' }); };
  const actVote = (voterId: string, targetId: string) => { if (isHost) dispatch({ type: 'GEAR_VOTE', voterId, targetId }); else room.sendAction({ action: 'vote', targetId }); };
  const actTiebreak = (targetId: string) => { if (isHost) dispatch({ type: 'GEAR_TIEBREAK', targetId }); else room.sendAction({ action: 'tiebreak', targetId }); };
  if (g.phase === 'lobby') return <Lobby />;
  // Contest Path caps: an arena someone else hosts plays the host's math; outside the grade's path, say so and leave.
  const grade = capGrade(state.contest);
  if (online && !online.isHost && grade && !gearSelectionOk(grade, g.selection.game, g.selection.key)) {
    const label = parseSelection(g.selection.game, g.selection.key).label;
    return <CapsRoomGuard className="gear-bg" title="Weakest Gear" text={`The host picked ${label} for this arena, which goes past the ${GRADES[grade].title} path. Leave the arena, then host your own with the math on your path.`} actions={[{ label: 'Leave the arena', primary: true, onClick: () => dispatch({ type: 'GEAR_EXIT' }) }]} />;
  }
  return <ArenaInner g={g} isHost={isHost} myId={myId} online={!!online} roomError={room.error} actAnswer={actAnswer} actBank={actBank} actVote={actVote} actTiebreak={actTiebreak} />;
}

function ArenaInner({ g, isHost, myId, online, roomError, actAnswer, actBank, actVote, actTiebreak }: { g: import('../../engine/state/gear').GearState; isHost: boolean; myId: string; online: boolean; roomError: string; actAnswer: (s: string) => void; actBank: () => void; actVote: (v: string, t: string) => void; actTiebreak: (t: string) => void }) {
  const { state, dispatch, play } = useGame();
  const [left, setLeft] = useState(g.roundMs);
  const [ready, setReady] = useState('');
  const [explain, setExplain] = useState(false);
  const [burst, setBurst] = useState(0);
  const [callout, setCallout] = useState<{ n: number; text: string }>({ n: 0, text: '' });
  const lastTick = useRef(0);
  const cur = currentId(g); const who = cur ? byId(g, cur) : undefined;
  const humans = online ? 1 : g.contestants.filter((c) => !c.bot).length;
  const inRound = g.phase === 'question' || g.phase === 'feedback';
  const sel = parseSelection(g.selection.game, g.selection.key);
  const me = g.contestants.find((c) => c.isMe) ?? g.contestants[0];
  const myTurn = !online || cur === myId;
  const meActive = g.contestants.some((c) => c.id === myId && c.out === undefined);
  const votesFor: Record<string, number> = {};
  for (const t of Object.values(g.votes)) votesFor[t] = (votesFor[t] ?? 0) + 1;
  const turnKey = `${g.round}:${g.phase}:${cur}:${g.question?.id}`;
  const needsHandoff = humans > 1 && who && !who.bot && (g.phase === 'question' || g.phase === 'final') && ready !== turnKey;
  const voterNeedsHandoff = humans > 1 && g.phase === 'vote' && g.voter && ready !== `vote:${g.round}:${g.voter}`;

  // Round clock.
  useEffect(() => {
    if (!inRound) return;
    const t = setInterval(() => {
      const l = Math.max(0, g.deadlineAt - Date.now());
      setLeft(l);
      const s = Math.ceil(l / 1000);
      if (l > 0 && s <= 10 && lastTick.current !== s) { lastTick.current = s; play('tick'); }
      if (l <= 0 && isHost) dispatch({ type: 'GEAR_TIMEOUT' });
    }, 250);
    return () => clearInterval(t);
  }, [inRound, g.deadlineAt, dispatch, play, isHost]);
  // Host only: computer contestants think and answer; online, human feedback also moves on by itself.
  useEffect(() => {
    if (!isHost || !who) return;
    if (who.bot && (g.phase === 'question' || g.phase === 'final')) { const t = setTimeout(() => dispatch({ type: 'GEAR_BOT' }), 1300); return () => clearTimeout(t); }
    if ((who.bot || online) && (g.phase === 'feedback' || g.phase === 'finalFeedback')) { const t = setTimeout(() => dispatch({ type: 'GEAR_NEXT' }), who.bot ? 1500 : 2200); return () => clearTimeout(t); }
  }, [who?.bot, who?.id, g.phase, g.question?.id, dispatch, isHost, online]);
  useEffect(() => { setExplain(false); }, [g.question?.id]);
  useEffect(() => {
    if (g.phase === 'feedback' || g.phase === 'finalFeedback') play(g.feedback?.correct ? 'correct' : 'wrong');
    if (g.phase === 'eliminated') play('defeat');
    if (g.phase === 'over') { play(g.winnerId === me.id ? 'fanfare' : 'victory'); setBurst(Date.now()); }
    if (g.phase === 'vote') play('boss-roar');
  }, [g.phase]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (g.bankedThisTurn) { play('coin'); setCallout({ n: Date.now(), text: `BANK ${g.bankedThisTurn}` }); } }, [g.bankedThisTurn, play]);

  const title = g.phase === 'final' || g.phase === 'finalFeedback' ? 'THE FINAL' : g.phase === 'over' ? 'RESULT' : `ROUND ${g.round}`;
  return (
    <div className="scene gear-bg arena">
      <Confetti trigger={burst} />
      <Callout text={callout.text} trigger={callout.n} color="var(--green)" />
      <div className="scene-header">
        <div className="loc"><h2>WEAKEST GEAR · {title} · {sel.label}</h2></div>
        <span className="spacer" />
        {inRound && <span className={`chip ${left < 10_000 ? 'hot' : ''}`}>⏱ {(left / 1000).toFixed(0)}s</span>}
        <span className="chip ok">POT {g.pot}</span>
        <button className="btn small ghost" onClick={() => dispatch({ type: 'GEAR_EXIT' })}>{g.phase === 'over' ? 'Back' : 'Leave'}</button>
      </div>
      <div className="scene-body">
        {roomError && <p className="naval-connection" role="alert">{roomError}</p>}
        <div className="gear-layout">
          <div className="stage">
            <Suspense fallback={<p className="small muted">Loading studio…</p>}><GearStudio game={g} reducedMotion={state.settings.reducedMotion} /></Suspense>
            <div className="podiums">
              {g.contestants.map((c) => <Podium key={c.id} c={c} activeNow={c.id === gearSpotlightId(g)} out={c.out !== undefined} votes={g.phase === 'vote' || g.phase === 'tiebreak' || g.phase === 'eliminated' ? votesFor[c.id] : undefined} me={c.isMe} />)}
            </div>
            {inRound && (
              <div className="chain">
                {CHAIN.map((v, i) => <span key={v} className={`step ${i < g.chain ? 'on' : ''} ${i === g.chain - 1 ? 'top' : ''}`}>{v}</span>)}
                <span className="chain-now">{chainValue(g.chain)}</span>
              </div>
            )}
            {(g.phase === 'final' || g.phase === 'finalFeedback' || g.phase === 'over') && g.final && (
              <div className="final-board">
                {g.final.players.map((id) => (
                  <div key={id} className={`fb ${id === g.final!.current && g.phase === 'final' ? 'now' : ''}`} style={{ ['--pc' as string]: byId(g, id).color }}>
                    <b>{byId(g, id).name}</b>
                    <span className="dots">{Array.from({ length: Math.max(FINAL_QUESTIONS, g.final!.asked[id]) }, (_, i) => { const h = g.final!.history.filter((x) => x.id === id)[i]; return <i key={i} className={h ? (h.correct ? 'ok' : 'bad') : ''} />; })}</span>
                    <span className="sc">{g.final!.score[id]}</span>
                  </div>
                ))}
                {g.final!.suddenDeath && g.phase !== 'over' && <div className="chip hot">SUDDEN DEATH</div>}
              </div>
            )}
          </div>

          <div className="gear-side">
            {(g.phase === 'question' || g.phase === 'feedback' || g.phase === 'final' || g.phase === 'finalFeedback') && who && (
              who.bot ? (
                <div className="panel center stack">
                  <h3 className="brass">{who.name} <span className="small muted">({who.bot.level})</span></h3>
                  <div className="expr-big">{g.question.expression}</div>
                  {g.feedback ? <div className={`feedback ${g.feedback.correct ? 'correct' : 'wrong'}`}>{g.bankedThisTurn ? `${who.name} banks ${g.bankedThisTurn}! ` : ''}{g.feedback.text}</div> : <p className="small muted">{who.name} is thinking…</p>}
                </div>
              ) : online && !myTurn ? (
                <div className="panel center stack">
                  <h3 className="brass">{who.name} is answering</h3>
                  <div className="expr-big">{g.question.expression}</div>
                  {g.feedback ? <div className={`feedback ${g.feedback.correct ? 'correct' : 'wrong'}`}>{g.bankedThisTurn ? `${who.name} banks ${g.bankedThisTurn}! ` : ''}{g.feedback.text}</div> : <p className="small muted">Chain at {chainValue(g.chain)}. Waiting…</p>}
                </div>
              ) : needsHandoff ? (
                <div className="panel center stack">
                  <h3 className="brass">Pass the phone to {who.name}</h3>
                  <p className="small muted">The next question is theirs. Chain at {chainValue(g.chain)}.</p>
                  <button className="btn primary big" onClick={() => { play('open'); setReady(turnKey); }}>{who.name}, I'm ready</button>
                </div>
              ) : (
                <div className="stud-q">
                  <div className="row wrap">
                    <span className="chip" style={{ borderColor: who.color, color: who.color }}>{who.name}</span>
                    {g.phase === 'question' && <button className="btn bank" disabled={g.chain === 0 || g.bankedThisTurn !== undefined || !!g.feedback} onClick={actBank}><Icon name="coins" /> BANK {chainValue(g.chain) || ''}</button>}
                    {g.bankedThisTurn && <span className="chip ok">Banked {g.bankedThisTurn}</span>}
                  </div>
                  <MathChallenge question={g.question} feedback={g.feedback} onSubmit={actAnswer} onNext={() => { if (!online) { play('click'); dispatch({ type: 'GEAR_NEXT' }); } }} showExplanation={explain} onToggleExplanation={() => setExplain((v) => !v)} nextLabel={online ? 'Next…' : 'Next'} showTimer={false} compact />
                </div>
              )
            )}

            {(g.phase === 'vote' || g.phase === 'tiebreak') && (
              <div className="panel stack">
                <h3 className="brass center">{g.phase === 'tiebreak' ? 'TIE. The strongest gear decides.' : 'TIME. Who is the weakest gear?'}</h3>
                <table className="vote-table"><thead><tr><th>Contestant</th><th>✓</th><th>✗</th><th>Banked</th><th>Lost</th></tr></thead><tbody>
                  {[...active(g)].sort((a, b) => strength(b) - strength(a)).map((c, i) => <tr key={c.id} className={i === 0 ? 'strong' : ''}><td>{i === 0 ? '★ ' : ''}{c.name}</td><td>{c.round.right}</td><td>{c.round.wrong}</td><td>{c.round.banked}</td><td>{c.round.lost}</td></tr>)}
                </tbody></table>
                {g.phase === 'vote' && online && (
                  meActive && !g.votes[myId] ? (
                    <>
                      <p className="small muted center">Vote off one contestant:</p>
                      <div className="row wrap" style={{ justifyContent: 'center' }}>
                        {active(g).filter((c) => c.id !== myId).map((c) => <button key={c.id} className="btn" style={{ borderColor: c.color }} onClick={() => { play('click'); actVote(myId, c.id); }}>{c.name}</button>)}
                      </div>
                    </>
                  ) : <p className="small muted center">Votes in: {Object.keys(g.votes).length} of {active(g).filter((c) => !c.bot).length}. Waiting for the others…</p>
                )}
                {g.phase === 'vote' && !online && g.voter && (voterNeedsHandoff ? (
                  <div className="center stack"><p className="small muted">Pass the phone to <b>{byId(g, g.voter).name}</b> to vote in private.</p><button className="btn primary" onClick={() => { play('open'); setReady(`vote:${g.round}:${g.voter}`); }}>{byId(g, g.voter).name}, I'm ready</button></div>
                ) : (
                  <>
                    <p className="small muted center">{byId(g, g.voter).name}, vote off one contestant:</p>
                    <div className="row wrap" style={{ justifyContent: 'center' }}>
                      {active(g).filter((c) => c.id !== g.voter).map((c) => <button key={c.id} className="btn" style={{ borderColor: c.color }} onClick={() => { play('click'); actVote(g.voter!, c.id); }}>{c.name}</button>)}
                    </div>
                  </>
                ))}
                {g.phase === 'tiebreak' && g.tie && (
                  (!online || g.tie.strongest === myId) ? (
                    <>
                      <p className="small muted center"><b>{byId(g, g.tie.strongest).name}</b>, the votes are tied. Choose who leaves:</p>
                      <div className="row wrap" style={{ justifyContent: 'center' }}>
                        {g.tie.candidates.map((id) => <button key={id} className="btn" onClick={() => { play('click'); actTiebreak(id); }}>{byId(g, id).name}</button>)}
                      </div>
                    </>
                  ) : <p className="small muted center">Tied vote. <b>{byId(g, g.tie.strongest).name}</b>, the strongest gear, is deciding…</p>
                )}
              </div>
            )}

            {g.phase === 'eliminated' && g.eliminated && (
              <div className="panel center stack sendoff">
                <h2 className="red">{byId(g, g.eliminated.id).name}</h2>
                <p>{g.eliminated.byTie ? 'Tied vote, decided by the strongest gear. ' : `${g.eliminated.votes} vote${g.eliminated.votes === 1 ? '' : 's'}. `}{g.eliminated.sendOff}</p>
                {isHost ? <button className="btn primary big" onClick={() => { play('open'); dispatch({ type: 'GEAR_CONTINUE' }); }}>{active(g).length <= 2 ? 'To the final ▸' : `Round ${g.round + 1} ▸ ${(roundMsFor(g.round + 1) / 1000).toFixed(0)}s`}</button> : <p className="small muted">The host starts the {active(g).length <= 2 ? 'final' : 'next round'}.</p>}
              </div>
            )}

            {g.phase === 'over' && g.winnerId && (
              <div className="panel center stack">
                <h1 className="brass">{g.winnerId === me.id ? 'YOU ARE THE STRONGEST GEAR' : `${byId(g, g.winnerId).name.toUpperCase()} WINS`}</h1>
                <div className="stud-net up">{g.pot} gears</div>
                {g.newBest && <div className="chip ok">BEST POT YET</div>}
                <p className="small muted">You answered {me.total.right} right and {me.total.wrong} wrong{me.out !== undefined ? `, voted off in round ${me.out}` : ''}.</p>
                <div className="row wrap" style={{ justifyContent: 'center' }}>
                  {isHost && <button className="btn primary big" onClick={() => { play('boss-roar'); if (online) dispatch({ type: 'GEAR_LAUNCH' }); else dispatch({ type: 'GEAR_START', setup: g.setup }); }}>Play again</button>}
                  <button className="btn" onClick={() => dispatch({ type: 'GEAR_EXIT' })}>Back</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

