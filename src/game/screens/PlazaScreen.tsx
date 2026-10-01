import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../store';
import { inviteUrl, makeRoomCode, normalizeRoomCode } from '../net/room';
import { usePlazaRoom } from '../hooks/usePlazaRoom';
import { DEFAULT_PLAZA, PLAZA_GOALS, PLAZA_MATH, PREMIUM_INFO, findPlazaMoves, goalLabel, pausedPlaza, plazaGoalProgress, type PlazaGoal, checkPlazaEquation, checkPlazaMove, currentPlazaPlayer, moveIndices, plazaBestKey, plazaLabel, plazaOps, plazaPlacements, plazaPremium, rackSize, tokenPoints, type PlazaConfig, type PlazaMode, type PlazaMove, type PlazaOp, type PlazaState } from '../../engine/state/plaza';
import { Confetti } from '../components/Fx';
import { labeled, LabelKey } from '../components/Labeled';
import '../../styles/plaza.css';
import { capGrade } from './ArcadeScreen';
import type { GradeId } from '../../engine/contest/grades';

type DraftTile = { token: string; rackIndex?: number; boardCell?: number };
const MODE_NAMES: Record<PlazaMode, string> = { practice: 'Solo practice', computer: 'Against a computer', local: 'Pass & play', online: 'Online friends' };
const MODE_DESCRIPTIONS: Record<PlazaMode, string> = { practice: 'Take your time. Build, explore, and correct.', computer: 'Take turns with Plaza Bot. Pick its skill.', local: '2–4 players sharing one device.', online: '2–4 players on their own devices.' };
const ops: PlazaOp[] = ['+', '−', '×', '÷'];
/** Contest Path grade defaults (the player can still change them): Grade 1 adds to 10, Grade 3 adds and subtracts, Grade 5 mixes all four. */
export const PLAZA_GRADE_DEFAULTS: Record<GradeId, Partial<PlazaConfig>> = {
  g1: { math: 'add', range: 10 },
  g3: { math: 'mixed', ops: ['+', '−'], range: 100 },
  g5: { math: 'mixed', ops: ['+', '−', '×', '÷'], range: 100, tables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
};

export function PlazaScreen() {
  const { state } = useGame();
  return state.plaza ? <PlazaGame /> : <PlazaSetup />;
}

function PlazaSetup() {
  const { state, dispatch, play } = useGame();
  const invite = typeof state.screenParams.room === 'string' ? state.screenParams.room : '';
  const [mode, setMode] = useState<PlazaMode>(invite ? 'online' : 'practice');
  const [c, setConfig] = useState<PlazaConfig>(() => { const g = capGrade(state.contest); return { ...DEFAULT_PLAZA, ...(g ? PLAZA_GRADE_DEFAULTS[g] : {}) }; });
  const [friends, setFriends] = useState(['Player 2']), [code, setCode] = useState(invite);
  const [goal, setGoal] = useState<PlazaGoal | null>(PLAZA_GOALS[0]);
  // An invite may arrive after the saved setup screen has already mounted.
  useEffect(() => { if (invite) { setMode('online'); setCode(invite); } }, [invite]);
  const patch = (p: Partial<PlazaConfig>) => setConfig(x => ({ ...x, ...p }));
  const rec = state.stats.plaza;
  const paused = pausedPlaza(rec);
  const resume = () => { play('open'); dispatch({ type: 'PLAZA_RESUME' }); };
  // The guided first game runs automatically on a player's first Solo practice, and on request.
  const start = (join = false, coach = mode === 'practice' && !rec?.coached) => {
    // Joining the room of a match this player left (typed code or invite link) puts them back in their own seat.
    if (join && paused?.online?.code === normalizeRoomCode(code)) { resume(); return; }
    play('open');
    dispatch({ type: 'PLAZA_START', setup: { mode, config: c, name: state.character?.name ?? 'Player', friends, goal: mode === 'practice' ? goal : null, coach: mode === 'practice' && coach,
      online: mode === 'online' ? { code: join ? normalizeRoomCode(code) : makeRoomCode(), host: !join, myId: `p-${Math.random().toString(36).slice(2, 12)}` } : undefined } });
  };
  const useTables = c.math === 'mult' || c.math === 'div' || c.math === 'mixed' && c.ops.some(o => o === '×' || o === '÷');
  return <div className="screen-scroll plaza-page"><div className="plaza-container">
    <header className="plaza-heading"><div><span className="plaza-eyebrow">THE ARCADE · BUILD SOMETHING TRUE</span><h1>Equation Plaza</h1><p>Your numbers. Your next move.</p></div><button className="plaza-button quiet" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'arcade' })}>← Arcade</button></header>
    {paused && <ResumeCard game={paused} onResume={resume} onForget={() => dispatch({ type: 'PLAZA_FORGET' })} />}
    <div className="plaza-intro"><div className="plaza-sample" aria-label="Example: three plus four equals seven">{[...'3+4=7'].map((t, i) => <span key={i} className={t === '=' ? 'equals' : ''}>{t}</span>)}</div><p>Build true equations with your tiles. Connect them on the board and find a good place to score.</p></div>
    <section className="plaza-card"><h2>1. How do you want to play?</h2><div className="plaza-mode-grid">{(Object.keys(MODE_NAMES) as PlazaMode[]).map(m => <button key={m} className={`plaza-mode ${mode === m ? 'selected' : ''}`} aria-pressed={mode === m} onClick={() => setMode(m)}><b>{MODE_NAMES[m]}</b><span>{MODE_DESCRIPTIONS[m]}</span></button>)}</div>
      {mode === 'online' && <form className="plaza-join" onSubmit={e => { e.preventDefault(); if (normalizeRoomCode(code).length === 4) start(true); }}><label>Have a room code?<input value={code} onChange={e => setCode(normalizeRoomCode(e.target.value))} placeholder="ABCD" maxLength={4} autoCapitalize="characters" autoComplete="off" spellCheck={false} /></label><button className="plaza-button" disabled={normalizeRoomCode(code).length !== 4}>Join room</button><p>The host chooses the math. Keep the host’s game open while you play.</p></form>}
      {mode === 'local' && <div className="plaza-friends"><p>You: <b>{state.character?.name}</b></p>{friends.map((n, i) => <label key={i}>Player {i + 2}<input value={n} maxLength={20} onChange={e => setFriends(f => f.map((v, j) => j === i ? e.target.value : v))} /></label>)}<div className="plaza-actions">{friends.length < 3 && <button className="plaza-button quiet" onClick={() => setFriends(f => [...f, `Player ${f.length + 2}`])}>+ Add player</button>}{friends.length > 1 && <button className="plaza-button quiet" onClick={() => setFriends(f => f.slice(0, -1))}>Remove player</button>}</div></div>}
      {mode === 'computer' && <fieldset><legend>Computer skill</legend><div className="plaza-choices">{(['easy', 'medium', 'hard'] as const).map((l, i) => <button className="plaza-button" key={l} aria-pressed={c.botLevel === l} onClick={() => patch({ botLevel: l })}>{['Apprentice', 'Technician', 'Engineer'][i]}</button>)}</div><p>The computer uses the same tiles and rules. Higher levels look for stronger scoring moves.</p></fieldset>}
    </section>
    <section className="plaza-card"><h2>2. Pick your math</h2><div className="plaza-choices">{PLAZA_MATH.map(m => <button className="plaza-button" key={m.id} aria-pressed={c.math === m.id} onClick={() => patch({ math: m.id })}>{m.label}</button>)}</div>
      {c.math === 'bonds' ? <fieldset><legend>What total are you making?</legend><div className="plaza-choices">{[5, 10, 20, 50, 100].map(t => <button className="plaza-button" aria-pressed={c.target === t} key={t} onClick={() => patch({ target: t })}>Make {t}</button>)}</div><p>Build two parts that make {c.target}, or subtract one part from {c.target} to find the other.</p></fieldset> : (c.math === 'add' || c.math === 'sub' || c.math === 'mixed') && <fieldset><legend>Number range for addition and subtraction</legend><div className="plaza-choices">{[10, 20, 100].map(r => <button className="plaza-button" aria-pressed={c.range === r} key={r} onClick={() => patch({ range: r })}>Up to {r}</button>)}</div><p>Every number stays in this range. Subtraction answers stay at zero or above.</p></fieldset>}
      {c.math === 'mixed' && <fieldset><legend>Include these operations</legend><div className="plaza-choices">{ops.map(o => <button className="plaza-button symbol" key={o} aria-label={`${{ '+': 'Addition', '−': 'Subtraction', '×': 'Multiplication', '÷': 'Division' }[o]} in mixed math`} aria-pressed={c.ops.includes(o)} disabled={c.ops.length === 1 && c.ops.includes(o)} onClick={() => patch({ ops: c.ops.includes(o) ? c.ops.filter(x => x !== o) : [...c.ops, o] })}>{o}</button>)}</div><p>Each equation uses one of your selected operations.</p></fieldset>}
      {useTables && <fieldset><legend>{c.math === 'div' ? 'Choose divisors' : 'Choose times tables / divisors'}</legend><div className="plaza-choices">{Array.from({ length: 12 }, (_, i) => i + 1).map(n => <button className="plaza-button" key={n} aria-pressed={c.tables.includes(n)} disabled={c.tables.length === 1 && c.tables.includes(n)} onClick={() => patch({ tables: c.tables.includes(n) ? c.tables.filter(t => t !== n) : [...c.tables, n].sort((a, b) => a - b) })}>{n}</button>)}</div><p>Multiplication partners and division answers run from 0 to 12. Division gives whole numbers.</p></fieldset>}
    </section>
    <section className="plaza-card"><h2>3. Set up the board</h2><fieldset><legend>Bonus squares</legend><div className="plaza-choices">{(['off', 'simple', 'classic'] as const).map((b, i) => <button className="plaza-button" key={b} aria-pressed={c.bonuses === b} onClick={() => patch({ bonuses: b })}>{['No bonuses', 'Simple bonuses', 'Full board'][i]}</button>)}</div><p>{c.bonuses === 'off' ? 'Focus on building equations. Tiles keep their normal points.' : c.bonuses === 'simple' ? 'Double digit and double equation squares. A gentle place to start.' : 'Double and triple bonuses for digits, operations, and equations.'}</p></fieldset>
      {mode === 'practice' && <fieldset><legend>Your goal</legend><div className="plaza-choices">{PLAZA_GOALS.map(gl => <button className="plaza-button" key={goalLabel(gl)} aria-pressed={goalLabel(goal) === goalLabel(gl)} onClick={() => setGoal(gl)}>{goalLabel(gl)}</button>)}</div><p>{goal ? 'The practice ends with a summary when you reach it (you can keep going).' : 'No target: play until you tap Finish practice.'}</p></fieldset>}
      {mode !== 'practice' && <fieldset><legend>Turns for each player</legend><div className="plaza-choices">{[5, 8, 10].map(r => <button className="plaza-button" key={r} aria-pressed={c.rounds === r} onClick={() => patch({ rounds: r })}>{r} turns</button>)}</div><p>Everyone gets the same number of turns. Highest score wins; equal scores share the win.</p></fieldset>}
      <p>{rackSize(c)} tiles per rack · No timer · {mode === 'practice' ? goalLabel(goal) : `${c.rounds} turns each`}{mode === 'practice' && !rec?.coached ? ' · starts with a guided first move' : ''}</p>
      <button className="plaza-button primary plaza-start" onClick={() => start()}>{mode === 'online' ? 'Create a room' : mode === 'practice' ? 'Start practicing' : 'Start game'} →</button>
      {mode === 'practice' && !!rec?.coached && <button className="plaza-button quiet plaza-start" onClick={() => start(false, true)}>Play the guided first move again</button>}
    </section>
    <PlazaHelp config={c} />
    {!!rec?.sessions && <p className="plaza-record">Your Plaza record: {rec.equations} equations · {rec.sessions} sessions · {rec.wins} outright wins</p>}
  </div></div>;
}

/** A match left with Leave (by accident or not): one tap goes back. Online, that is the same room and seat, with no code to remember. */
function ResumeCard({ game: g, onResume, onForget }: { game: PlazaState; onResume: () => void; onForget: () => void }) {
  const mine = g.online?.myId ?? 'me', others = g.players.filter(p => p.id !== mine && !p.bot).map(p => p.name);
  const friends = others.length > 1 ? `${others.slice(0, -1).join(', ')} and ${others[others.length - 1]}` : others[0] ?? 'your friends';
  const round = Math.min(g.config.rounds, Math.min(...g.players.map(p => p.turns)) + 1);
  const title = g.online ? `${g.online.host ? 'Reopen' : 'Back to'} room ${g.online.code}?` : g.mode === 'computer' ? 'Finish your match against Plaza Bot?' : 'Finish your pass & play match?';
  const about = g.phase === 'lobby'
    ? g.online?.host ? 'Your friends were in the lobby. Reopen the room and they can join again with the same code.' : 'You were waiting for the host to start. This takes you back to the same lobby.'
    : g.online?.host ? `You were hosting ${friends}. The board and scores are saved, and everyone reconnects on their own when you reopen.`
    : g.online ? `You left a match with ${friends}. Your seat, tiles and score are saved. No code needed.`
    : 'The board, tiles and scores are just as you left them.';
  return <section className="plaza-card plaza-resume" aria-labelledby="plaza-resume-title">
    <span className="plaza-eyebrow">UNFINISHED MATCH</span>
    <h2 id="plaza-resume-title">{title}</h2>
    <p>{about}</p>
    {g.phase === 'playing' && <p className="plaza-resume-scores">{g.players.map(p => `${p.name} ${p.score}`).join(' · ')} · turn {round} of {g.config.rounds}</p>}
    <div className="plaza-actions"><button className="plaza-button primary" onClick={onResume}>{g.online ? g.online.host ? 'Reopen the room' : 'Rejoin the room' : 'Resume match'} →</button><button className="plaza-button quiet" onClick={onForget}>Forget it</button></div>
  </section>;
}

function PlazaHelp({ config: c, open = false }: { config: PlazaConfig; open?: boolean }) {
  const demo = c.math === 'bonds' ? `${c.target}−2=${c.target - 2}` : c.math === 'sub' ? '7−3=4' : c.math === 'mult' ? `${c.tables[0]}×2=${c.tables[0] * 2}` : c.math === 'div' ? `${c.tables[0] * 2}÷${c.tables[0]}=2` : c.math === 'mixed' ? c.ops[0] === '+' ? '3+4=7' : c.ops[0] === '−' ? '7−3=4' : c.ops[0] === '×' ? `${c.tables[0]}×2=${c.tables[0] * 2}` : `${c.tables[0] * 2}÷${c.tables[0]}=2` : '3+4=7';
  return <details className="plaza-help plaza-card" open={open || undefined}><summary>How to play · full rules</summary>
    <p><b>Equals means balance:</b> the amount on the left is the same as the amount on the right.</p><p className="plaza-demo"><span>Worked example</span><strong>{demo}</strong><small>{c.math === 'bonds' ? `Take 2 from ${c.target}. The other part is ${c.target - 2}. Those two parts make ${c.target}.` : 'Read each side of the equals sign. Both describe the same amount.'}</small></p>
    <ol><li><b>Build:</b> tap rack tiles to put an equation in your tray. Adjacent digits make a larger number, so 1 then 2 makes 12. Use one operation and one equals sign.</li><li><b>Connect:</b> after the first move, tap a tile on the board to reuse it in your tray. It stays in the same square. Your new equation must share at least one old tile.</li><li><b>Check:</b> check your equation, then choose a legal position. The first equals sign sits in the gold center. Every crossing must also be a complete, true equation.</li><li><b>Place:</b> place your tiles to score. Tap a tray tile to remove it. You can drag rack tiles into the tray too.</li></ol>
    <p><b>Scoring:</b> small numbers and +/− are 1 point; 4–6 and × are 2 points; 7–9 and ÷ are 3 points; = is 0 points. Only newly placed tiles score. Bonuses apply once when covered. Using your whole rack adds 10 points once.</p>
    <p><b>A useful hand:</b> racks are built for your selected math. If your remaining tiles cannot connect, a playable rack is dealt for free. A full board opens a fresh plaza with scores and turns kept. Choosing to swap a playable rack uses your turn.</p>
    <p>Board points measure this game’s strategy. They do not change your Academy mastery score.</p>
  </details>;
}

function PlazaGame() {
  const { state, dispatch, play } = useGame(); const g = state.plaza!;
  const room = usePlazaRoom();
  const player = currentPlazaPlayer(g), mine = g.online?.myId ?? 'me', hosting = !!g.online?.host;
  // Out of the room (a reload, lost signal, the host stepping away): the play area says so, with the way back.
  const offline = !!g.online && g.phase === 'playing' && !room.connected;
  const canPlay = g.phase === 'playing' && !player.bot && (!g.online || player.id === mine && room.connected);
  const [draft, setDraft] = useState<DraftTile[]>([]), [choices, setChoices] = useState<PlazaMove[]>([]), [choice, setChoice] = useState(0);
  const [error, setError] = useState(''), [swapConfirm, setSwapConfirm] = useState(false), [exitConfirm, setExitConfirm] = useState(false);
  const [readyRev, setReadyRev] = useState(-1), [copied, setCopied] = useState(false), [touched, setTouched] = useState(false), [boom, setBoom] = useState(0);
  const phone = usePhoneLayout(), [sheet, setSheet] = useState(false), [zoom, setZoom] = useState(false);
  const boardWrap = useRef<HTMLDivElement>(null);
  // Zoomed in on a phone: keep the green preview in view as the position changes.
  useEffect(() => { if (zoom && choices.length) boardWrap.current?.querySelector('.plaza-cell.preview, .plaza-cell.anchor')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [zoom, choices, choice]);
  const rec = state.stats.plaza;
  const placeButton = useRef<HTMLButtonElement>(null);
  const handoff = g.mode === 'local' && readyRev !== g.rev;
  const bench = useRef<HTMLDivElement>(null), boardArea = useRef<HTMLDivElement>(null), resultPanel = useRef<HTMLElement>(null), handoffPanel = useRef<HTMLElement>(null);
  const priorRev = useRef(g.rev);
  const send = useRef(dispatch); send.current = dispatch;
  useEffect(() => {
    setDraft([]); setChoices([]); setChoice(0); setError(''); setSwapConfirm(false);
    if (g.phase === 'over') resultPanel.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
    else if (g.mode === 'local') handoffPanel.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
    if (priorRev.current !== g.rev && canPlay && g.mode !== 'local') bench.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
    priorRev.current = g.rev;
  }, [g.id, g.rev]); // A new turn clears only this device's draft.
  useEffect(() => {
    if (g.phase !== 'playing' || !player.bot || g.online && !g.online.host) return;
    const timer = setTimeout(() => send.current({ type: 'PLAZA_BOT' }), 1100);
    return () => clearTimeout(timer);
  }, [g.id, g.rev, g.phase, player.bot, g.online?.host]);
  const tokens = draft.map(t => t.token), preview = choices[choice];
  const checked = useMemo(() => preview ? checkPlazaMove(g.board, player.rack, preview, g.config) : null, [preview, g.board, player.rack, g.config]);
  const edit = (tiles: DraftTile[]) => { setDraft(tiles); setChoices([]); setChoice(0); setError(''); setTouched(false); room.clearError(); };
  const addRack = (i: number) => { if (canPlay && !handoff && draft.length < 11 && i >= 0 && i < player.rack.length && !draft.some(t => t.rackIndex === i)) { play('click'); edit([...draft, { token: player.rack[i], rackIndex: i }]); } };
  const addBoard = (cell: number) => { if (canPlay && !handoff && g.board[cell] && draft.length < 11 && !draft.some(t => t.boardCell === cell)) { play('click'); edit([...draft, { token: g.board[cell]!, boardCell: cell }]); bench.current?.scrollIntoView({ block: 'start', behavior: 'auto' }); } };
  const check = () => {
    const err = checkPlazaEquation(tokens, g.config); if (err) { setError(err); return; }
    const candidates = plazaPlacements(g.board, tokens, g.config, player.rack, draft.flatMap((t, offset) => t.boardCell === undefined ? [] : [{ offset, cell: t.boardCell }]));
    if (!candidates.length) { setError('Your equation is true, but it does not fit here. Reuse a board tile in its original square, leave space beside other equations, or try another equation.'); return; }
    setError(''); setChoices(candidates); setChoice(0); setTouched(false); boardArea.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
  };
  // Check unlocks Place: move focus there so the next step is one tap (or Enter) away.
  useEffect(() => { if (choices.length) placeButton.current?.focus({ preventScroll: true }); }, [choices]);

  /* ---- guided first move (Solo practice), first-move affordance, goal ---- */
  const coachOn = g.mode === 'practice' && !!g.coach && g.phase === 'playing' && canPlay;
  const coachTarget = useMemo(() => {
    if (!coachOn || g.board.some(Boolean)) return null;
    const moves = findPlazaMoves(g, player.rack, g.seed, 16);
    return moves.length ? [...moves].sort((a, b) => a.tokens.length - b.tokens.length)[0].tokens : null;
  }, [coachOn, g.id, g.boardNumber, player.rack.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  const said = tokens.join('');
  const coachStage: null | 'build' | 'fix' | 'check' | 'place' | 'done' = !coachOn ? null : g.log.some(l => l.points > 0) ? 'done' : !coachTarget ? null
    : choices.length ? 'place' : said === coachTarget.join('') ? 'check' : coachTarget.slice(0, tokens.length).join('') === said ? 'build' : 'fix';
  const coachNext = coachStage === 'build' ? coachTarget![tokens.length] : null;
  const coachRack = coachNext ? player.rack.findIndex((t, i) => t === coachNext && !draft.some(d => d.rackIndex === i)) : -1;
  const coaching = coachStage !== null && coachStage !== 'done';
  const firstMove = canPlay && !handoff && !coaching && !g.log.length && !draft.length;
  const goal = plazaGoalProgress(g);
  const goalWasDone = useRef(!!goal?.done);
  useEffect(() => { if (goal?.done && !goalWasDone.current) { setBoom(b => b + 1); play('level-up'); } goalWasDone.current = !!goal?.done; }, [goal?.done]); // eslint-disable-line react-hooks/exhaustive-deps
  const step = choices.length ? (choices.length > 1 && !touched && coachStage !== 'place' ? 3 : 4) : draft.length >= 5 ? 2 : 1;
  const me = g.players.find(p => p.id === mine) ?? g.players[0];
  const mins = (ms: number) => { const t = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
  const commit = () => { if (!canPlay || !preview || checked?.error) return; play('correct'); if (g.online && !g.online.host) room.sendAction({ kind: 'play', move: preview }); else dispatch({ type: 'PLAZA_PLAY', move: preview }); };
  const swap = () => { if (g.online && !g.online.host) room.sendAction({ kind: 'swap' }); else dispatch({ type: 'PLAZA_SWAP' }); };
  const copy = async () => { if (!g.online) return; try { await navigator.clipboard.writeText(`${inviteUrl(g.online.code)}&game=plaza`); setCopied(true); } catch { setCopied(false); } };
  if (g.phase === 'lobby') return <div className="screen-scroll plaza-page"><div className="plaza-container">
    <header className="plaza-heading"><div><span className="plaza-eyebrow">EQUATION PLAZA</span><h1>{g.online?.host ? 'Your table is open' : 'Joining the table'}</h1></div></header>
    <section className="plaza-card plaza-lobby"><p>Room code</p><strong className="plaza-code">{g.online?.code}</strong><p aria-live="polite">{room.status || 'Opening room…'}</p>{room.error && <p className="plaza-error" role="alert">{room.error}</p>}{room.error && !room.connected && g.rev > 0 && <button className="plaza-button" onClick={room.retry}>Try again</button>}
      <ul>{g.online?.lobby.map(p => <li key={p.id}>{p.name}{p.id === mine ? ' (you)' : ''}</li>)}</ul>
      <p>{plazaLabel(g.config)} · {g.config.rounds} turns each · {g.config.bonuses} bonuses</p>
      {g.online?.host ? <><p>Invite up to three friends. Keep this game open on your device.</p><div className="plaza-actions"><button className="plaza-button" onClick={copy}>{copied ? 'Invite copied' : 'Copy invite link'}</button><button className="plaza-button primary" disabled={!room.connected || g.online.lobby.length < 2} onClick={() => dispatch({ type: 'PLAZA_LAUNCH' })}>Start together</button></div></> : <p>The host starts when everyone is ready.</p>}
      <button className="plaza-button quiet" onClick={() => dispatch({ type: 'PLAZA_EXIT' })}>Leave room</button>
    </section></div></div>;
  const top = Math.max(...g.players.map(p => p.score)), winners = g.players.filter(p => p.score === top);
  const leaveSheet = exitConfirm && <div className="pp-overlay" onClick={() => setExitConfirm(false)}><section className="pp-sheet" role="alertdialog" aria-modal="true" aria-label="Leave the match" onClick={e => e.stopPropagation()}>
    <p>{g.mode === 'practice' ? 'Finish and save this practice session?' : hosting ? `Leave for now? The match is saved on this device. Reopen room ${g.online!.code} from Equation Plaza and everyone reconnects on their own.` : g.online ? 'Leave this match? Your seat is saved. Go back in from Equation Plaza, with no code to remember.' : 'Leave this match? It stays saved: pick it up again from Equation Plaza.'}</p>
    <div className="plaza-actions"><button className="plaza-button primary" onClick={() => { setExitConfirm(false); dispatch({ type: g.mode === 'practice' ? 'PLAZA_END' : 'PLAZA_EXIT' }); }}>{g.mode === 'practice' ? 'Finish practice' : hosting ? 'Leave for now' : 'Leave match'}</button>{hosting && <button className="plaza-button" onClick={() => { setExitConfirm(false); dispatch({ type: 'PLAZA_END_EARLY' }); }}>End the match for everyone</button>}<button className="plaza-button" autoFocus onClick={() => setExitConfirm(false)}>Keep playing</button></div>
  </section></div>;
  if (phone && g.phase === 'playing') {
    // Phone, board first: slim top bar, one status line, the whole board, then tray, rack and one adaptive button.
    const solo = g.mode === 'practice';
    const rackOwner = canPlay ? player : g.mode === 'local' ? null : me;
    const skip = () => dispatch({ type: 'PLAZA_SIT_OUT', id: player.id });
    const status = error ? <p className="pp-msg bad" role="alert">{error}</p>
      : room.error && !offline ? <p className="pp-msg bad" role="alert">{room.error}</p>
      : offline ? <p className="pp-msg warn" role="status">{room.error ? <span>{room.error}</span> : <span><b>{room.reconnecting ? room.status : hosting ? `Opening room ${g.online!.code}…` : `Connecting to room ${g.online!.code}…`}</b> {hosting ? 'Everyone’s seats are saved.' : 'Your seat is saved.'}</span>}{room.error && g.rev > 0 && <button className="plaza-button" onClick={room.retry}>Try again</button>}</p>
      : coachStage ? <CoachLine stage={coachStage} target={coachTarget} next={coachNext} last={g.log[0]} onDone={() => dispatch({ type: 'PLAZA_COACH_DONE' })} />
      : player.away && !canPlay ? <p className="pp-msg warn" role="status"><span><b>{player.name} is away.</b> {hosting ? 'Their seat is saved for them.' : 'Waiting for them to come back…'}</span>{hosting && <button className="plaza-button" onClick={skip}>Skip their turns until they’re back</button>}</p>
      : goal?.done ? <p className="pp-msg good" role="status"><span><b>Goal reached!</b> Keep building, or</span><button className="plaza-button" onClick={() => dispatch({ type: 'PLAZA_END' })}>See my summary</button></p>
      : handoff ? <p className="pp-msg" role="status"><span>Pass the device to <b>{player.name}</b>. Their tiles stay hidden until they’re ready.</span></p>
      : !canPlay ? <p className="pp-msg" role="status"><span>{player.bot ? 'Plaza Bot is finding a connection…' : `Waiting for ${player.name}’s move…`}</span></p>
      : preview ? <p className="pp-msg" role="status"><span><b>{preview.direction === 'across' ? '→ Across' : '↓ Down'}</b>, row {Math.floor(preview.start / 11) + 1}, column {preview.start % 11 + 1}. {labeled(checked?.detail)}</span></p>
      : g.notice ? <p className="pp-msg" role="status"><span>{g.notice}</span></p>
      : g.log[0] ? <p className="pp-msg" role="status"><span><b>{g.log[0].player}</b>: {g.log[0].text} · <b>+{g.log[0].points}</b>{g.log[0].points > 0 && <small> ({labeled(g.log[0].detail)})</small>}</span></p>
      : <p className="pp-msg" role="status"><span>{g.board.some(Boolean) ? 'Tap a board tile to reuse it, then add rack tiles around it.' : 'Tap tiles in equation order. Your = goes on the gold START square.'}</span></p>;
    return <div className="plaza-phone">
      <header className="pp-top">
        <button className="pp-icon" aria-label="Leave" onClick={() => setExitConfirm(true)}>←</button>
        <div className="pp-scores" aria-label="Scores">{solo
          ? <><span className="pp-chip current"><b>{me.score}</b> pts</span>{goal ? <span className={`pp-chip ${goal.done ? 'done' : ''}`}>{goal.done ? '✓ ' : ''}{Math.min(goal.have, goal.need)}/{goal.need} {g.goal?.kind === 'points' ? 'pts goal' : 'equations'}</span> : <span className="pp-chip">{me.equations} equations</span>}</>
          : g.players.map((p, i) => <span key={p.id} className={`pp-chip ${g.turn === i ? 'current' : ''} ${p.away ? 'away' : ''}`} aria-current={g.turn === i ? 'true' : undefined}>{p.id === mine ? 'You' : p.name}{p.bot ? ' ⚙' : ''} <b>{p.score}</b><small>{p.away ? 'away' : `${p.turns}/${g.config.rounds}`}</small></span>)}</div>
        <button className="pp-icon" aria-label="Help, bonus squares and moves" onClick={() => setSheet(true)}>ⓘ</button>
      </header>
      <Confetti trigger={boom} />
      {status}
      <div ref={boardWrap} className={`pp-board-wrap ${zoom ? 'zoom' : ''} ${firstMove || coachStage === 'build' || coachStage === 'fix' || coachStage === 'check' ? 'dim' : ''}`}>
        <BoardGrid className="pp-board" g={g} preview={preview} choices={choices} interactive={canPlay && !handoff} onReuse={addBoard} onChoose={(i) => { setTouched(true); setChoice(i); }} />
      </div>
      <div className="pp-dock">
        {handoff ? <button className="plaza-button primary pp-ready" onClick={() => setReadyRev(g.rev)}>I’m {player.name}, ready</button> : <>
          {canPlay && <div className="pp-tray" aria-label="Equation tray" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const raw = e.dataTransfer.getData('application/plaza-rack'); if (/^\d+$/.test(raw)) addRack(Number(raw)); }}>
            {draft.length ? draft.map((t, i) => <button key={i} className={`plaza-tile ${t.boardCell !== undefined ? 'reused' : ''}`} aria-label={`Remove ${t.token} from tray position ${i + 1}`} onClick={() => edit(draft.filter((_, j) => j !== i))}>{t.token}{t.boardCell !== undefined && <small>board</small>}</button>) : <span className="pp-tray-hint">{firstMove ? '👇 Tap a rack tile to start' : 'Your equation goes here'}</span>}
            <button className="pp-back" aria-label="Remove the last tile" disabled={!draft.length} onClick={() => edit(draft.slice(0, -1))}>⌫</button>
          </div>}
          {rackOwner && <div className={`plaza-rack pp-rack ${canPlay ? '' : 'idle'} ${firstMove ? 'pulse' : ''}`} aria-label={canPlay ? 'Your rack' : 'Your rack (waiting for your turn)'}>{rackOwner.rack.map((t, i) => { const used = canPlay && draft.some(d => d.rackIndex === i); return <button key={i} className={`plaza-tile ${canPlay && i === coachRack ? 'coach-glow' : ''}`} data-rack-index={i} data-token={t} disabled={!canPlay || used} aria-label={`Rack tile ${t}, ${tokenPoints(t)} points, position ${i + 1}`} draggable={canPlay && !used} onDragStart={e => e.dataTransfer.setData('application/plaza-rack', String(i))} onClick={() => addRack(i)}>{t}<small>{tokenPoints(t)}</small></button>; })}</div>}
          {canPlay && (swapConfirm ? <div className="pp-actions"><span className="pp-ask">{solo ? 'Deal a different rack?' : 'Swapping uses this turn.'}</span><button className="plaza-button" onClick={swap}>Swap now</button><button className="plaza-button quiet" onClick={() => setSwapConfirm(false)}>Keep</button></div>
            : <div className="pp-actions">
              {!coaching && !firstMove && !choices.length && <button className="plaza-button quiet" onClick={() => setSwapConfirm(true)}>Swap</button>}
              {solo && g.undo && !draft.length && !coaching && <button className="plaza-button quiet" onClick={() => { play('click'); dispatch({ type: 'PLAZA_UNDO' }); }}>↶ Undo</button>}
              {choices.length > 1 && <div className="pp-stepper"><button className="plaza-button" aria-label="Previous position" onClick={() => { setTouched(true); setChoice(i => (i + choices.length - 1) % choices.length); }}>‹</button><span aria-live="polite">{choice + 1}/{choices.length}</span><button className="plaza-button" aria-label="Next position" onClick={() => { setTouched(true); setChoice(i => (i + 1) % choices.length); }}>›</button></div>}
              {choices.length ? <button ref={placeButton} className={`plaza-button primary pp-main ${coachStage === 'place' ? 'coach-glow' : ''}`} disabled={!!checked?.error} onClick={commit}>Place · {checked?.points} pts</button>
                : <button className={`plaza-button primary pp-main ${coachStage === 'check' ? 'coach-glow' : ''}`} disabled={draft.length < 5} onClick={check}>Check equation</button>}
            </div>)}
        </>}
      </div>
      {sheet && <div className="pp-overlay" onClick={() => setSheet(false)}><section className="pp-sheet" role="dialog" aria-modal="true" aria-label="Equation Plaza help" onClick={e => e.stopPropagation()}>
        <header className="pp-sheet-head"><div><span className="plaza-eyebrow">{MODE_NAMES[g.mode]}{g.online ? ` · ROOM ${g.online.code}` : ''}</span><h2>Equation Plaza</h2><p>{plazaLabel(g.config)} · {solo ? goalLabel(g.goal) : `${g.config.rounds} turns each`} · board {g.boardNumber}</p></div><button className="pp-icon" autoFocus aria-label="Close" onClick={() => setSheet(false)}>✕</button></header>
        <h3>Each play</h3>
        <ol className="pp-steps"><li><b>Build:</b> tap rack tiles in order. Tap a tile on the board to reuse it.</li><li><b>Check equation:</b> both sides must be equal.</li><li><b>Choose position:</b> use ‹ › or tap an outlined square.</li><li><b>Place</b> to score.</li></ol>
        <div className="plaza-actions"><button className="plaza-button" aria-pressed={zoom} onClick={() => { setZoom(z => !z); setSheet(false); }}>{zoom ? 'Fit the whole board' : 'Large tiles (scroll the board)'}</button>{solo && <button className="plaza-button" onClick={() => { setSheet(false); dispatch({ type: 'PLAZA_END' }); }}>Finish practice</button>}</div>
        <h3>Bonus squares</h3>
        <BonusGlossary config={g.config} />
        {!!g.log.length && <><h3>Recent moves</h3><ol className="pp-moves">{g.log.slice(0, 8).map((l, i) => <li key={`${g.rev}-${i}`}><span><b>{l.player}</b> {l.text}</span><strong>+{l.points}</strong>{l.points > 0 && <small>{labeled(l.detail)}</small>}</li>)}</ol></>}
        <PlazaHelp config={g.config} />
      </section></div>}
      {leaveSheet}
    </div>;
  }
  return <div className="screen-scroll plaza-page"><div className="plaza-container">
    <header className="plaza-heading compact"><div><span className="plaza-eyebrow">{MODE_NAMES[g.mode]}{g.online ? ` · ROOM ${g.online.code}` : ''}</span><h1>Equation Plaza</h1><p>{plazaLabel(g.config)}</p></div><button className="plaza-button quiet" onClick={() => g.phase === 'over' ? dispatch({ type: 'PLAZA_EXIT' }) : setExitConfirm(true)}>{g.phase === 'over' ? 'Setup' : 'Leave'}</button></header>
    <div className="plaza-scores">{g.players.map((p, i) => <div key={p.id} className={`plaza-score ${g.phase === 'playing' && g.turn === i ? 'current' : ''}`}><span>{p.name}{p.bot ? ' ⚙' : ''}{p.away ? p.sitOut ? ' · away, turns skipped' : ' · away' : ''}</span><b>{p.score}<small> pts</small></b><small>{g.mode === 'practice' ? `${p.equations} equations` : `${p.turns}/${g.config.rounds} turns`}</small></div>)}</div>
    <Confetti trigger={boom} />
    {g.mode === 'practice' && g.phase === 'playing' && (goal ? <div className={`plaza-goal ${goal.done ? 'done' : ''}`} role="status">
      <div className="plaza-goal-head"><b>{goal.done ? 'Goal reached!' : 'Your goal'}</b><span>{goalLabel(g.goal)} · {Math.min(goal.have, goal.need)}/{goal.need}</span></div>
      <div className="plaza-goal-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, (goal.have / goal.need) * 100)}%` }} /></div>
      {goal.done && <div className="plaza-actions"><button className="plaza-button primary" onClick={() => dispatch({ type: 'PLAZA_END' })}>See my summary</button><span>or keep building for a bigger score</span></div>}
    </div> : <div className="plaza-goal"><div className="plaza-goal-head"><b>Free play</b><span>Tap Finish practice whenever you like for your summary.</span></div></div>)}
    {exitConfirm && <div className="plaza-card" role="alert"><p>{g.mode === 'practice' ? 'Finish and save this practice session?' : hosting ? `Leave for now? The match is saved on this device. Reopen room ${g.online!.code} from Equation Plaza and everyone reconnects on their own.` : g.online ? 'Leave this match? Your seat is saved. Go back in from Equation Plaza, with no code to remember.' : 'Leave this match? It stays saved: pick it up again from Equation Plaza.'}</p><div className="plaza-actions"><button className="plaza-button primary" onClick={() => { setExitConfirm(false); dispatch({ type: g.mode === 'practice' ? 'PLAZA_END' : 'PLAZA_EXIT' }); }}>{g.mode === 'practice' ? 'Finish practice' : hosting ? 'Leave for now' : 'Leave match'}</button>{hosting && <button className="plaza-button" onClick={() => { setExitConfirm(false); dispatch({ type: 'PLAZA_END_EARLY' }); }}>End the match for everyone</button>}<button className="plaza-button" onClick={() => setExitConfirm(false)}>Keep playing</button></div></div>}
    {room.error && !offline && <p className="plaza-error" role="alert">{room.error}</p>}
    {g.notice && <p className="plaza-notice" role="status">{g.notice}</p>}
    {g.phase === 'over' ? <section className="plaza-card plaza-results" ref={resultPanel}><span className="plaza-eyebrow">{g.endedEarly ? 'ROOM CLOSED' : 'WELL BUILT'}</span><h2>{g.endedEarly ? 'The match ended early' : g.mode === 'practice' ? 'Practice complete' : winners.length > 1 ? `Shared win: ${winners.map(p => p.name).join(' & ')}` : `${winners[0].name} wins!`}</h2>{g.mode === 'practice' && !g.endedEarly ? <div className="plaza-summary">
        <div><b>{me.equations}</b><span>equations placed</span></div><div><b>{me.score}</b><span>points</span></div><div><b>{mins((g.endedAt ?? Date.now()) - (g.startedAt ?? Date.now()))}</b><span>time</span></div>
        {me.best && <p>Best play: <b>{me.best.text}</b> for {me.best.points} points.</p>}
        {g.goal && <p>Goal · {goalLabel(g.goal)}: {goal?.done ? <b>reached ✓</b> : `${goal?.have ?? 0} of ${g.goal.n}. Try again to reach it.`}</p>}
      </div> : <p>{g.endedEarly ? 'The host ended this match early, so it was not added to anyone’s record.' : `${g.players.reduce((n, p) => n + p.equations, 0)} true equations built on ${g.boardNumber === 1 ? 'one board' : `${g.boardNumber} boards`}.`}</p>}{!g.endedEarly && <p>Your best with these settings: <b>{state.stats.plaza.bests[plazaBestKey(g)] ?? 0} points</b></p>}<div className="plaza-actions"><button className="plaza-button primary" onClick={() => dispatch({ type: 'PLAZA_EXIT' })}>Play again / choose math</button><button className="plaza-button" onClick={() => { dispatch({ type: 'PLAZA_EXIT' }); dispatch({ type: 'NAVIGATE', screen: 'arcade' }); }}>Back to Arcade</button></div></section> : <>
      {g.mode === 'local' && handoff ? <section className="plaza-card plaza-handoff" ref={handoffPanel}><span className="plaza-eyebrow">PASS THE DEVICE</span><h2>{player.name}’s turn</h2><p>The rack stays hidden until they are ready.</p><button className="plaza-button primary" onClick={() => setReadyRev(g.rev)}>I’m {player.name} — ready</button></section> : canPlay ? <div className="plaza-card plaza-workbench" ref={bench}>
        {coachStage && <CoachCard stage={coachStage} target={coachTarget} next={coachNext} last={g.log[0]} goal={g.goal} onDone={() => dispatch({ type: 'PLAZA_COACH_DONE' })} />}
        {g.log[0] && coachStage !== 'done' && <div className="plaza-last-play" role="status"><p><b>{g.log[0].player}</b>: {g.log[0].text} · <b>+{g.log[0].points} points</b></p>{g.log[0].points > 0 && <small>{labeled(g.log[0].detail)}</small>}{g.mode === 'practice' && g.undo && <button className="plaza-button quiet" onClick={() => { play('click'); dispatch({ type: 'PLAZA_UNDO' }); }}>↶ Undo last Place</button>}</div>}
        <div className="plaza-section-title"><h2>Build your equation</h2><button className="plaza-button quiet" disabled={!draft.length} onClick={() => edit([])}>Clear tray</button></div>
        <p className="plaza-instruction">{g.board.some(Boolean) ? 'Tap a board tile to reuse it, and rack tiles to build around it.' : 'Tap tiles in equation order. We’ll put your equals sign on the gold center.'}</p>
        <div className="plaza-tray" aria-label="Equation tray" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const raw = e.dataTransfer.getData('application/plaza-rack'); if (/^\d+$/.test(raw)) addRack(Number(raw)); }}>
          {draft.length ? draft.map((t, i) => <button key={i} className={`plaza-tile ${t.boardCell !== undefined ? 'reused' : ''}`} aria-label={`Remove ${t.token} from tray position ${i + 1}`} onClick={() => edit(draft.filter((_, j) => j !== i))}>{t.token}{t.boardCell !== undefined && <small>board</small>}</button>) : <span className="plaza-tray-empty">{firstMove ? '👇 Tap a rack tile to start' : 'Tap a rack tile to start'}</span>}
        </div>
        <ol className="plaza-steps" aria-label="Steps for each play">{['Build', 'Check equation', 'Choose position', 'Place'].map((l, i) => <li key={l} className={i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''} aria-current={i + 1 === step ? 'step' : undefined}><span>{i + 1 < step ? '✓' : i + 1}</span>{l}</li>)}</ol>
        <div className="plaza-section-title"><h3>Your rack</h3><span>{player.rack.length} tiles · {plazaOps(g.config).join(' ')}</span></div>
        <div className={`plaza-rack ${firstMove ? 'pulse' : ''}`} aria-label="Your rack">{player.rack.map((t, i) => { const used = draft.some(d => d.rackIndex === i); return <button key={i} className={`plaza-tile ${i === coachRack ? 'coach-glow' : ''}`} data-rack-index={i} data-token={t} disabled={used} aria-label={`Rack tile ${t}, ${tokenPoints(t)} points, position ${i + 1}`} draggable={!used} onDragStart={e => e.dataTransfer.setData('application/plaza-rack', String(i))} onClick={() => addRack(i)}>{t}<small>{tokenPoints(t)}</small></button>; })}</div>
        {error && <p className="plaza-error" role="alert">{error}</p>}
        <div className="plaza-actions"><button className={`plaza-button primary ${coachStage === 'check' ? 'coach-glow' : ''}`} disabled={draft.length < 5} onClick={check}>Check equation</button>{!firstMove && !coaching && <button className="plaza-button quiet" onClick={() => setSwapConfirm(true)}>Swap rack{g.mode === 'practice' ? '' : ' · use turn'}</button>}{g.mode === 'practice' && !coaching && <button className="plaza-button quiet" onClick={() => dispatch({ type: 'PLAZA_END' })}>Finish practice</button>}</div>
        {swapConfirm && <div className="plaza-swap"><p>{g.mode === 'practice' ? 'Deal a different rack?' : 'A voluntary swap uses this turn. Keep looking, or swap your rack?'}</p><div className="plaza-actions"><button className="plaza-button" onClick={swap}>Swap now</button><button className="plaza-button quiet" onClick={() => setSwapConfirm(false)}>Keep rack</button></div></div>}
      </div> : offline ? <div className="plaza-reconnect" role="status" aria-live="polite">
        {room.error ? <p className="plaza-error">{room.error}</p> : <p><b>{room.reconnecting ? room.status : hosting ? `Opening room ${g.online!.code}…` : `Connecting to room ${g.online!.code}…`}</b> {hosting ? 'Everyone’s seats and scores are saved.' : 'Your seat and score are saved.'}</p>}
        {room.error && g.rev > 0 && <button className="plaza-button" onClick={room.retry}>Try again</button>}
      </div> : player.away ? <div className="plaza-card plaza-away" role="status"><p><b>{player.name} is away.</b> {hosting ? 'Their seat, tiles and score are saved, and they can come back from Equation Plaza.' : 'Waiting for them to come back…'}</p>{hosting && <div className="plaza-actions"><button className="plaza-button" onClick={() => dispatch({ type: 'PLAZA_SIT_OUT', id: player.id })}>Skip {player.name}’s turns until they’re back</button></div>}</div>
      : <p className="plaza-wait" role="status">{player.bot ? 'Plaza Bot is finding a connection…' : `Waiting for ${player.name}’s move…`}</p>}
    </>}
    <div ref={boardArea} className="plaza-board-area">
      {preview && canPlay && !handoff && <div className="plaza-placement-controls"><div><b>Choose your position</b><span>{preview.direction === 'across' ? '→ Across' : '↓ Down'} · row {Math.floor(preview.start / 11) + 1}, column {preview.start % 11 + 1}</span></div><div className="plaza-actions"><button className="plaza-button" aria-label="Previous position" disabled={choices.length < 2} onClick={() => { setTouched(true); setChoice(i => (i + choices.length - 1) % choices.length); }}>←</button><span>{choice + 1}/{choices.length}</span><button className="plaza-button" aria-label="Next position" disabled={choices.length < 2} onClick={() => { setTouched(true); setChoice(i => (i + 1) % choices.length); }}>→</button><button ref={placeButton} className={`plaza-button primary ${coachStage === 'place' ? 'coach-glow' : ''}`} onClick={commit}>Place · {checked?.points} points</button></div><small className="plaza-breakdown">Score: {checked?.detail}. Highlighted tiles are your preview.</small></div>}
      <PlazaBoard g={g} preview={preview} choices={choices} interactive={canPlay && !handoff} onReuse={addBoard} onChoose={(i) => { setTouched(true); setChoice(i); }} dim={firstMove || coachStage === 'build' || coachStage === 'fix' || coachStage === 'check'} legendOpen={!rec?.sessions && !coaching} />
    </div>
    {!!g.log.length && <section className="plaza-card plaza-history"><h2>Recent moves</h2><ol>{g.log.slice(0, 6).map((l, i) => <li key={`${g.rev}-${i}`}><span><b>{l.player}</b><span>{l.text}</span></span><strong>+{l.points}<small>{labeled(l.detail)}</small></strong></li>)}</ol></section>}
    <PlazaHelp config={g.config} />
  </div></div>;
}

const PREMIUM_MEANING: Record<string, string> = {
  CE: ' Your first equals sign goes here. With bonuses on, that first equation scores double.',
  DD: ' A number tile placed here scores 2× its points.',
  TD: ' A number tile placed here scores 3× its points.',
  DO: ' An operation tile (+ − × ÷) placed here scores 2×.',
  TO: ' An operation tile placed here scores 3×.',
  DE: ' The whole new equation through this square scores 2×.',
  TE: ' The whole new equation through this square scores 3×.',
};

/** Phone layout only: follow the width of the screen, so the layout switches if a phone turns sideways. */
function usePhoneLayout() {
  const query = '(max-width: 640px)';
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const m = window.matchMedia?.(query); if (!m) return;
    const on = () => setPhone(m.matches); on();
    m.addEventListener?.('change', on); return () => m.removeEventListener?.('change', on);
  }, []);
  return phone;
}

/** The guided first move in one line above the board (phones). */
function CoachLine({ stage, target, next, last, onDone }: { stage: 'build' | 'fix' | 'check' | 'place' | 'done'; target: string[] | null; next: string | null; last?: { text: string; points: number; detail: string }; onDone: () => void }) {
  const eq = target?.join(' ') ?? '';
  return <p className="pp-msg coach" role="status" aria-live="polite">
    {stage === 'done' ? <span><b>You placed {last?.text} for {last?.points} points</b> ({labeled(last?.detail)}). Now build your own: tap a board tile to reuse it. Tap ⓘ for bonus squares.</span>
      : stage === 'build' ? <span>Guided move: build <b className="plaza-coach-eq">{eq}</b>. Tap the glowing <b>{next}</b>.</span>
      : stage === 'fix' ? <span>That tile isn’t next in <b className="plaza-coach-eq">{eq}</b>. Tap it in the tray to send it back.</span>
      : stage === 'check' ? <span><b>Now tap Check equation.</b> It checks both sides are equal.</span>
      : <span><b>True! Tap Place.</b> The green squares show where it goes.</span>}
    <button className="plaza-button" onClick={onDone}>{stage === 'done' ? 'Got it' : 'Skip'}</button>
  </p>;
}

/** The guided first move: which tile next, then Check, then Place, then what the score meant. */
function CoachCard({ stage, target, next, last, goal, onDone }: { stage: 'build' | 'fix' | 'check' | 'place' | 'done'; target: string[] | null; next: string | null; last?: { text: string; points: number; detail: string }; goal?: PlazaGoal | null; onDone: () => void }) {
  const eq = target?.join(' ') ?? '';
  const n = stage === 'build' || stage === 'fix' ? 1 : stage === 'check' ? 2 : 3;
  return <div className={`plaza-coach ${stage}`} role="status" aria-live="polite">
    {stage === 'done' ? <>
      <span className="plaza-eyebrow">GUIDED FIRST MOVE · DONE</span>
      <p><b>You placed {last?.text} for {last?.points} points.</b></p>
      <p className="plaza-coach-score">How it scored: {labeled(last?.detail)}. Face points come from each tile (the small number in its corner). Bonus squares multiply them.</p><LabelKey />
      <p>Now build your own. Reuse a tile on the board (tap it) and add rack tiles to make a new true equation that crosses it. {goal ? `Your goal: ${goalLabel(goal).toLowerCase()}.` : ''}</p>
      <button className="plaza-button primary" onClick={onDone}>Start building on my own</button>
    </> : <>
      <div className="plaza-coach-head"><span className="plaza-eyebrow">GUIDED FIRST MOVE · STEP {n} OF 3</span><button className="plaza-button quiet" onClick={onDone}>Skip the guide</button></div>
      {stage === 'build' && <p>Let’s build <b className="plaza-coach-eq">{eq}</b>. Tap the glowing tile{next ? <> (<b>{next}</b>)</> : ''} in your rack. Tiles go from the rack into the tray, in order.</p>}
      {stage === 'fix' && <p>That tile isn’t next in <b className="plaza-coach-eq">{eq}</b>. Tap it in the tray to send it back, or tap Clear tray.</p>}
      {stage === 'check' && <p><b>Now tap Check equation.</b> It checks that both sides of the equals sign are the same amount.</p>}
      {stage === 'place' && <p><b>True! Now tap Place.</b> The glowing squares show where it goes: the equals sign sits on the gold START square in the middle of the board.</p>}
    </>}
  </div>;
}

const premiumsFor = (c: PlazaConfig) => c.bonuses === 'off' ? [] : c.bonuses === 'simple' ? ['DD', 'DE'] : ['DD', 'TD', 'DO', 'TO', 'DE', 'TE'];

/** What each bonus square does, for the legend and the help sheet. */
function BonusGlossary({ config }: { config: PlazaConfig }) {
  return <ul className="plaza-glossary">{['CE', ...premiumsFor(config)].map(p => <li key={p}><i className={`premium-${p}`}>{PREMIUM_INFO[p].shape}</i><span><b>{p === 'CE' ? 'START · Center equals' : `${p} · ${PREMIUM_INFO[p].name}`}</b>{PREMIUM_MEANING[p]}{p === 'CE' && config.bonuses === 'off' ? ' (Bonus squares are off in this game, so it does not double.)' : ''}</span></li>)}
    <li className="plaza-glossary-note">Bonuses count once: only for tiles you place on them, not for tiles already there.</li></ul>;
}

/** The 11×11 squares: placed tiles, the green preview, outlined starting squares, and bonus shapes. */
function BoardGrid({ g, preview, choices, interactive, onReuse, onChoose, className = 'plaza-board' }: { g: PlazaState; preview?: PlazaMove; choices: PlazaMove[]; interactive: boolean; onReuse: (i: number) => void; onChoose: (i: number) => void; className?: string }) {
  const indexes = preview ? moveIndices(preview) : [];
  return <div className={className} role="group" aria-label="Equation Plaza board, 11 rows by 11 columns">
    {g.board.map((tile, i) => {
      const p = plazaPremium(i, g.config), offset = indexes.indexOf(i), ghost = !tile && offset >= 0 ? preview!.tokens[offset] : null;
      const candidate = choices.findIndex(m => m.start === i), value = tile || ghost;
      return <button key={i} type="button" data-cell={i} data-board-token={tile ?? ''} className={`plaza-cell premium-${p} ${tile ? 'occupied' : ''} ${ghost ? 'preview' : ''} ${candidate >= 0 ? 'candidate' : ''} ${offset >= 0 && tile ? 'anchor' : ''}`} disabled={!interactive || (preview ? candidate < 0 : !tile)} aria-label={`Row ${Math.floor(i / 11) + 1}, column ${i % 11 + 1}: ${value ?? (p === '.' ? 'empty' : PREMIUM_INFO[p]?.name)}${candidate >= 0 ? ', choose position' : tile ? ', reuse tile' : ''}`} onClick={() => preview ? candidate >= 0 && onChoose(candidate) : onReuse(i)}>
        {value ? <><b>{value}</b><small>{tokenPoints(value)}</small></> : p !== '.' && <><span>{PREMIUM_INFO[p]?.shape}</span><small className="prem">{p === 'CE' ? 'START' : p}</small></>}
      </button>;
    })}
  </div>;
}

function PlazaBoard({ g, preview, choices, interactive, onReuse, onChoose, dim = false, legendOpen = false }: { g: PlazaState; preview?: PlazaMove; choices: PlazaMove[]; interactive: boolean; onReuse: (i: number) => void; onChoose: (i: number) => void; dim?: boolean; legendOpen?: boolean }) {
  const [fit, setFit] = useState(false), scroll = useRef<HTMLDivElement>(null);
  const [glossary, setGlossary] = useState(legendOpen);
  // First session: the meanings open once, when the guided move is over (not while it needs the board in view).
  useEffect(() => { if (legendOpen) setGlossary(true); }, [legendOpen]);
  const indexes = preview ? moveIndices(preview) : [];
  useEffect(() => { const el = scroll.current; if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2; }, [fit, g.boardNumber]);
  useEffect(() => {
    if (!preview || fit) return;
    const el = scroll.current; if (!el) return;
    const centerCol = indexes.reduce((sum, i) => sum + i % 11, 0) / indexes.length;
    el.scrollLeft = Math.max(0, centerCol * 51 - el.clientWidth / 2 + 36);
  }, [preview, fit]);
  const premiums = premiumsFor(g.config);
  return <section className={`plaza-board-panel ${dim ? 'dim' : ''}`}><div className="plaza-section-title"><h2>The plaza <small>· board {g.boardNumber}</small></h2><button className="plaza-button quiet" aria-pressed={fit} onClick={() => setFit(x => !x)}>{fit ? 'Large tiles' : 'See whole board'}</button></div><p>{preview ? 'Use the position arrows or tap an outlined starting square.' : g.board.some(Boolean) ? 'Tap an existing tile to reuse it in your equation.' : 'Your first equals sign belongs in the center.'} {!fit && <span>Swipe the board sideways to see the edges.</span>}</p>
    <div className="plaza-legend" aria-label="Bonus squares">
      {['CE', ...premiums].map(p => <span key={p}><i className={`premium-${p}`}>{PREMIUM_INFO[p].shape}</i><b>{p === 'CE' ? 'START' : p}</b> {p === 'CE' ? 'center' : PREMIUM_INFO[p].name}</span>)}
      <button className="plaza-button quiet plaza-legend-toggle" aria-expanded={glossary} onClick={() => setGlossary(x => !x)}>ⓘ {glossary ? 'Hide' : 'What do these mean?'}</button>
    </div>
    {glossary && <BonusGlossary config={g.config} />}
    <div className={`plaza-board-scroll ${fit ? 'fit' : ''}`} ref={scroll}><BoardGrid g={g} preview={preview} choices={choices} interactive={interactive} onReuse={onReuse} onChoose={onChoose} /></div>
  </section>;
}
