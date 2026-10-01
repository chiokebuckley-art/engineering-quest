import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useGame } from '../store';
import { useDiceRoom } from '../hooks/useDiceRoom';
import { avatarLabel, gearAsset } from '../components/GearAvatarPicker';
import { inviteUrl, makeRoomCode, normalizeRoomCode } from '../net/room';
import { CATEGORIES, LABELS, RULES, allowedCategories, groupFact, fractionFact, needsSum, needsGroup, scoreFor, totals, diceSteps, type Category, type Mode } from '../../engine/state/diceWorkshop';
import { currentPlayer, playerTotal, standingsOf, winners, type DiceAction, type DicePlayer, type DiceTable } from '../../engine/state/diceTable';
import type { GearAvatarId } from '../../engine/state/gearAvatars';
import { labeled, LabelKey } from '../components/Labeled';
import { labn } from '../../engine/label';
import './diceWorkshop.css';

const Scene = lazy(() => import('../components/DiceWorkshopScene'));
const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const newId = () => `p-${Math.random().toString(36).slice(2, 12)}`;
const MODE_LABEL: Record<Mode, string> = { sum: 'Addition', groups: 'Multiplication (equal groups)', both: 'Addition and multiplication', fractions: 'Fractions', ratios: 'Ratios' };

function Face({ avatar }: { avatar: GearAvatarId }) {
  return avatar === 'engineer' ? <span className="dice-av" aria-hidden="true">⚙</span> : <img className="dice-av" src={gearAsset(`${avatar}.jpg`)} alt="" />;
}

/** The "play online" box on the Dice Workshop start screen. */
export function DiceOnlineBox({ mode, avatar }: { mode: Mode; avatar: GearAvatarId }) {
  const { state, dispatch, play } = useGame();
  const invite = typeof state.screenParams?.room === 'string' ? normalizeRoomCode(state.screenParams.room) : '';
  const [code, setCode] = useState(invite);
  return (
    <div className="dice-setup dice-online">
      <span className="dice-eyebrow">PLAY WITH FRIENDS ONLINE</span>
      <p className="dice-muted">Two to four players, each on their own device, taking turns on one table. Everyone sees the dice; each player keeps their own scorecard. The host picks the maths ({MODE_LABEL[mode].toLowerCase()}).</p>
      <div className="dice-actions">
        <button className="btn primary" onClick={() => { play('open'); dispatch({ type: 'DICE_HOST', mode, code: makeRoomCode(), myId: newId(), avatar }); }}>Create a room</button>
        <form className="dice-join" onSubmit={(e) => { e.preventDefault(); if (normalizeRoomCode(code).length === 4) { play('open'); dispatch({ type: 'DICE_JOIN', code: normalizeRoomCode(code), myId: newId(), avatar }); } }}>
          <input value={code} onChange={(e) => setCode(normalizeRoomCode(e.target.value))} placeholder="ABCD" maxLength={4} autoCapitalize="characters" autoComplete="off" spellCheck={false} aria-label="Room code" />
          <button className="btn" disabled={normalizeRoomCode(code).length !== 4}>Join a room</button>
        </form>
      </div>
    </div>
  );
}

/** The online table: lobby, live game and final standings. */
export function DiceTableScreen({ t }: { t: DiceTable }) {
  const { dispatch } = useGame();
  const room = useDiceRoom();
  const [leaving, setLeaving] = useState(false);
  return (
    <div className="screen-scroll">
      <section className="dice-workshop" aria-labelledby="dice-title">
        <header className="dice-header">
          <div><span className="dice-eyebrow">DICE WORKSHOP · ONLINE · ROOM {t.online.code}</span><h1 id="dice-title">Dice Workshop</h1></div>
          <button className="btn small" onClick={() => (t.phase === 'over' ? dispatch({ type: 'DICE_TABLE_EXIT' }) : setLeaving(true))}>{t.phase === 'over' ? 'Back to Dice Workshop' : 'Leave'}</button>
        </header>
        {leaving && (
          <div className="dice-confirm" role="alert">
            <p>{t.online.host ? 'Your device runs this table. If you leave, the game ends for everyone.' : 'Leave the table? Your scorecard stays, and your turns are skipped.'}</p>
            <button className="btn" onClick={() => dispatch({ type: 'DICE_TABLE_EXIT' })}>Leave the table</button>
            <button className="btn" onClick={() => setLeaving(false)}>Keep playing</button>
          </div>
        )}
        <p className="dice-status" role="status" aria-live="polite">{room.error ? <span className="dice-error">{room.error}</span> : room.status || (t.online.host ? 'Opening the room…' : 'Connecting…')}</p>
        {t.phase === 'lobby' ? <Lobby t={t} /> : t.phase === 'over' ? <Standings t={t} /> : <Table t={t} />}
      </section>
    </div>
  );
}

function Lobby({ t }: { t: DiceTable }) {
  const { dispatch } = useGame();
  const room = useDiceRoom();
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(`${inviteUrl(t.online.code)}&game=dice`); setCopied(true); } catch { setCopied(false); } };
  return (
    <div className="dice-setup">
      <span className="dice-eyebrow">ROOM CODE</span>
      <strong className="dice-code">{t.online.code}</strong>
      <p className="dice-muted">{t.online.host ? `Share the code or the invite link. Maths: ${MODE_LABEL[t.mode].toLowerCase()}. Keep this screen open: your device runs the table.` : 'The host starts the game when everyone is here.'}</p>
      <ul className="dice-seats">
        {t.online.lobby.length ? t.online.lobby.map((s, k) => <li key={s.id}><Face avatar={s.avatar} /><b>{s.name}</b>{s.id === t.online.myId && <span className="dice-muted"> · you</span>}{k === 0 && <span className="dice-muted"> · host</span>}</li>) : <li className="dice-muted">Waiting for the host…</li>}
      </ul>
      {t.online.host && (
        <div className="dice-actions">
          <button className="btn" onClick={copy}>{copied ? 'Invite link copied' : 'Copy invite link'}</button>
          <button className="btn primary" disabled={!room.connected || t.online.lobby.length < 2} onClick={() => dispatch({ type: 'DICE_LAUNCH' })}>Start together</button>
        </div>
      )}
      {t.online.host && t.online.lobby.length < 2 && <p className="dice-muted">Waiting for at least one friend to join.</p>}
    </div>
  );
}

function Table({ t }: { t: DiceTable }) {
  const { state, dispatch, play } = useGame();
  const room = useDiceRoom();
  const cur = currentPlayer(t)!;
  const mine = cur.id === t.online.myId;
  const me = t.players.find((p) => p.id === t.online.myId);
  const [viewId, setViewId] = useState<string | null>(null);
  const [flat, setFlat] = useState(false);
  const [sum, setSum] = useState(''), [group, setGroup] = useState('');
  const [zero, setZero] = useState<Category | null>(null);
  const r = cur.run;
  const act = (a: DiceAction) => { if (!mine) return; if (t.online.host) dispatch({ type: 'DICE_ACT', action: a }); else room.sendAction(a); };
  // Fresh inputs for every roll and turn; sounds for this device's own checks.
  useEffect(() => { setSum(''); setGroup(''); setZero(null); }, [r.revision, r.rolls, t.turn]);
  const prev = useRef(me ? { a: me.attempts, c: me.correct } : null);
  useEffect(() => {
    if (!me || !prev.current) return;
    if (me.attempts > prev.current.a) play(me.correct > prev.current.c ? 'correct' : 'wrong');
    prev.current = { a: me.attempts, c: me.correct };
  }, [me?.attempts, me?.correct]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (mine) play('open'); }, [t.turn]); // eslint-disable-line react-hooks/exhaustive-deps
  const view = t.players.find((p) => p.id === (viewId ?? cur.id)) ?? cur;
  const fact = groupFact(r.dice);
  const ready = mine && !!r.rolls && !r.finished;
  const open = allowedCategories(r);
  return (
    <>
      <div className="dice-players" role="list" aria-label="Players">
        {t.players.map((p) => (
          <button key={p.id} role="listitem" className={`dice-pl ${p.id === cur.id ? 'turn' : ''} ${p.id === view.id ? 'viewing' : ''} ${p.left ? 'left' : ''}`} onClick={() => setViewId(p.id)} aria-pressed={p.id === view.id} title={`Show ${p.name}'s scorecard`}>
            <Face avatar={p.avatar} /><span><b>{p.name}{p.id === t.online.myId ? ' (you)' : ''}</b><small>{playerTotal(p)} pts · {Object.keys(p.run.card).length}/13{p.left ? ' · left' : ''}</small></span>
          </button>
        ))}
      </div>
      <div className="dice-summary"><strong>{mine ? 'Your turn' : `${cur.name}’s turn`}</strong><span>{3 - r.rolls} rolls left</span><button className="dice-link" aria-pressed={flat} onClick={() => setFlat(!flat)}>{flat ? 'Show 3D table' : 'Use simple view'}</button></div>
      {!flat && <Suspense fallback={<div className="dice-scene-placeholder">Loading the table…</div>}><Scene run={r} reducedMotion={state.settings.reducedMotion} /></Suspense>}
      <div className="dice-turn">
        <div className="dice-dice" role="group" aria-label={mine ? 'Your five dice: tap to hold or release' : `${cur.name}’s dice`}>
          {r.dice.map((value, i) => (
            <button key={i} className={`dice-die ${r.held[i] ? 'held' : ''}`} aria-label={`Die ${i + 1}: ${r.rolls ? value : 'not rolled'}, ${r.held[i] ? 'held' : 'not held'}`} aria-pressed={r.held[i]} disabled={!mine || !r.rolls || r.rolls >= 3} onClick={() => { play('click'); act({ kind: 'hold', index: i }); }}>
              <span className="dice-face" aria-hidden="true">{r.rolls ? Array.from({ length: 9 }, (_, n) => <i key={n} className={PIPS[value].includes(n) ? 'pip' : ''} />) : <b>?</b>}</span><span>{r.held[i] ? 'HELD' : 'HOLD'}</span>
            </button>
          ))}
        </div>
        {mine ? (
          <div className="dice-roll-controls"><button className="btn primary" disabled={r.rolls >= 3 || r.held.every(Boolean)} onClick={() => { play('build'); act({ kind: 'roll' }); }}>{!r.rolls ? 'Roll five dice' : 'Roll unheld dice'}</button><span>{3 - r.rolls} rolls left</span></div>
        ) : <p className="dice-muted dice-center">{!r.rolls ? `Waiting for ${cur.name} to roll…` : r.checked ? `${cur.name} is choosing a category…` : `${cur.name} is working out the maths…`}</p>}
        {mine && <p className="dice-muted">{r.rolls === 3 ? 'All rolls used. Check your math, then pick a score.' : 'You may score after any roll. Held dice stay; the others roll again.'}</p>}
      </div>
      {ready && (
        <form className="dice-math" onSubmit={(e) => { e.preventDefault(); act({ kind: 'check', sum, group }); }}>
          <span className="dice-eyebrow">BUILD YOUR MATH</span>
          {r.mode === 'fractions' && <label className="dice-equation"><span>What fraction of the dice show {fractionFact(r.dice).value}?</span><input aria-label="Fraction of the dice" inputMode="text" placeholder="?/5" required value={sum} disabled={r.checked} onChange={(e) => setSum(e.target.value)} autoComplete="off" /></label>}
          {r.mode === 'ratios' && <label className="dice-equation"><span>Even dice : odd dice =</span><input aria-label="Ratio of even to odd dice" inputMode="text" placeholder="? : ?" required value={sum} disabled={r.checked} onChange={(e) => setSum(e.target.value)} autoComplete="off" /></label>}
          {needsSum(r.mode) && <label className="dice-equation">Dice faces: {r.dice.join(' + ')} = <input aria-label="Total of all five dice" inputMode="numeric" pattern="[0-9]*" required value={sum} disabled={r.checked} onChange={(e) => setSum(e.target.value)} autoComplete="off" /> <span className="qty-label">(dice total)</span></label>}
          {needsGroup(r.mode) && <label className="dice-equation"><span>{fact.count} {fact.count === 1 ? 'die' : 'dice'} showing {fact.value}: {labeled(`${labn(fact.count, 'matching die', 'matching dice')} × ${fact.value} (face value)`)} = </span><input aria-label="Equal groups answer" inputMode="numeric" pattern="[0-9]*" required value={group} disabled={r.checked} onChange={(e) => setGroup(e.target.value)} autoComplete="off" /> <span className="qty-label">(group total)</span></label>}
          {!r.checked && <div className="dice-actions"><button className="btn primary" type="submit">Check my math</button><button className="btn" type="button" onClick={() => act({ kind: 'reveal' })}>Show the steps</button></div>}
          {r.checked && <div className="dice-steps"><strong>{r.assisted ? 'Let’s work it out:' : 'You’ve got it!'}</strong>{diceSteps(r).map((line, i) => <p key={i}>{labeled(line)}</p>)}<LabelKey /><p>Choose one open category on your scorecard.</p></div>}
        </form>
      )}
      <p className="dice-status" aria-live="polite">{r.last && <span>{r.last} </span>}{mine ? r.message : ''}</p>
      <div className="dice-scorecard">
        <div className="dice-score-heading"><h2>{view.id === t.online.myId ? 'Your scorecard' : `${view.name}’s scorecard`}</h2><span>{Object.keys(view.run.card).length}/13 filled</span></div>
        <table><thead><tr><th scope="col">Category</th><th scope="col">Points</th><th scope="col">This turn</th></tr></thead>
          <tbody>{CATEGORIES.map((cat) => {
            const filled = view.run.card[cat] !== undefined;
            const canScore = ready && r.checked && view.id === cur.id && open.includes(cat);
            const points = scoreFor(r.dice, cat, r.card);
            return (
              <tr key={cat} className={filled ? 'filled' : ''}>
                <th scope="row">{LABELS[cat]}<small>{RULES[cat]}</small></th>
                <td>{filled ? view.run.card[cat] : '—'}</td>
                <td>{filled ? <span aria-label="Recorded">✓</span> : view.id === cur.id && mine ? <button className="btn small" disabled={!canScore} aria-label={`Score ${LABELS[cat]}${canScore ? `: ${points} points` : ''}`} onClick={() => (points === 0 ? setZero(cat) : act({ kind: 'score', category: cat }))}>{ready && r.checked ? `Take ${points}` : '—'}</button> : '—'}</td>
              </tr>
            );
          })}</tbody></table>
        {zero && <div className="dice-confirm" role="alert"><p>Record 0 in {LABELS[zero]}? This uses that category for the rest of this game.</p><button className="btn" onClick={() => { act({ kind: 'score', category: zero }); setZero(null); }}>Record zero</button><button className="btn" onClick={() => setZero(null)}>Keep choosing</button></div>}
        <TotalsRow p={view} />
      </div>
      <details className="dice-rules" open><summary>Table log</summary><ul className="dice-log">{t.log.slice(-8).reverse().map((l, i) => <li key={`${t.log.length}-${i}`}>{l}</li>)}</ul></details>
    </>
  );
}

function TotalsRow({ p }: { p: DicePlayer }) {
  const s = totals(p.run.card, p.run.bonus);
  return <div className="dice-totals"><span>Upper section: {s.upper}/63</span><span>Upper bonus: {s.upperBonus}</span><span>Five-of-a-kind bonuses: {p.run.bonus}</span><strong>Total: {s.total}</strong></div>;
}

function Standings({ t }: { t: DiceTable }) {
  const { dispatch } = useGame();
  const win = winners(t);
  const rows = standingsOf(t);
  const iWon = win.includes(t.online.myId);
  return (
    <div className="dice-finish">
      <span className="dice-eyebrow">GAME OVER</span>
      <h2>{win.length > 1 ? 'A tie!' : iWon ? 'You win!' : `${rows[0]?.p.name} wins!`}</h2>
      <ol className="dice-standings">{rows.map(({ p, total: tot }) => (
        <li key={p.id} className={win.includes(p.id) ? 'win' : ''}><Face avatar={p.avatar} /><b>{p.name}{p.id === t.online.myId ? ' (you)' : ''}</b><span>{tot} points</span><small>maths checks right {p.correct}/{p.attempts}{p.left ? ' · left early' : ''}</small></li>
      ))}</ol>
      <button className="btn primary" onClick={() => dispatch({ type: 'DICE_TABLE_EXIT' })}>Back to Dice Workshop</button>
    </div>
  );
}

export { avatarLabel };
