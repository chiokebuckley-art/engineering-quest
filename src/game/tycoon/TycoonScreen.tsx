import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../store';
import { MathChallenge } from '../components/MathChallenge';
import { labeled, hasLabels, LabelKey } from '../components/Labeled';
import { SPACES, GROUPS, LEVELS, DICE_WAYS, MAX_WORKSHOPS, streetRent, mortgageValue, unmortgageCost, type Level } from '../../engine/tycoon/board';
import { current, deedsOf, netWorth, rentFor, canBuild, ownsSet, standings, playerById, JAIL_FEE, QUICK_ROUNDS, BOT_NAMES, type TycoonGame, type TPlayer, type TycoonSetup, type BotLevel } from '../../engine/tycoon/game';
import { Board } from './Board';
import { useTycoonRoom } from '../hooks/useTycoonRoom';
import { inviteUrl, makeRoomCode, normalizeRoomCode } from '../net/room';
import type { TycoonGuestAction } from '../../engine/tycoon/online';
import './tycoon.css';
import { CapsRoomGuard, capGrade } from '../screens/ArcadeScreen';
import { GRADES, type GradeId } from '../../engine/contest/grades';

/**
 * Contest Path caps: the Tycoon levels a grade sees. Grade 1: Junior only (Explorer brings percentages); Grade 3:
 * Junior and Explorer; Grade 5: all three. With no grade (or caps off) every level shows, as before.
 */
export const tycoonLevels = (grade: GradeId | null): Level[] => (Object.keys(LEVELS) as Level[]).filter((l) => !grade || grade === 'g5' || (grade === 'g3' ? l !== 'tycoon' : l === 'junior'));
/**
 * A table someone else hosts plays the host's level. A guest learns it from the host's first update (rev above 0, or
 * the game under way); when that level is not one the grade sees, the guest gets a calm card instead of the table.
 */
export const tycoonGuestBlocked = (grade: GradeId | null, g: Pick<TycoonGame, 'online' | 'rev' | 'phase' | 'level'>): boolean =>
  !!grade && !!g.online && !g.online.host && (g.rev > 0 || g.phase !== 'lobby') && !tycoonLevels(grade).includes(g.level);

export function TycoonScreen() {
  const { state, dispatch } = useGame();
  if (!state.tycoon) return <TycoonSetupView />;
  const grade = capGrade(state.contest);
  if (grade && tycoonGuestBlocked(grade, state.tycoon)) {
    const yours = tycoonLevels(grade).map((l) => LEVELS[l].name).join(' or ');
    return <CapsRoomGuard className="ty-root" title="Engine City Tycoon" text={`This table plays the ${LEVELS[state.tycoon.level].name} level, which goes past the ${GRADES[grade].title} path (${yours} is yours). Leave the room, then host your own table.`} actions={[{ label: 'Leave room', primary: true, onClick: () => dispatch({ type: 'TYCOON_EXIT' }) }]} />;
  }
  return state.tycoon.phase === 'lobby' ? <Lobby g={state.tycoon} /> : <TycoonTable g={state.tycoon} />;
}

/** Local games: every human seat plays on this device. Online: only this device's seat. */
const myTurn = (g: TycoonGame) => (g.online ? current(g).id === g.online.myId : current(g).kind === 'human');
const myReview = (g: TycoonGame) => !!g.review && (g.online ? g.review.player === g.online.myId : playerById(g, g.review.player)?.kind === 'human');
/** Moves go straight to the game here, or to the host when this device is a guest. */
function useAct(g: TycoonGame) {
  const { dispatch } = useGame(); const room = useTycoonRoom();
  const guest = !!g.online && !g.online.host;
  return (a: TycoonGuestAction) => {
    if (guest) { room.sendAction(a); return; }
    switch (a.kind) {
      case 'roll': dispatch({ type: 'TYCOON_ROLL' }); break;
      case 'answer': dispatch({ type: 'TYCOON_ANSWER', given: a.given }); break;
      case 'pass': dispatch({ type: 'TYCOON_PASS' }); break;
      case 'ack': dispatch({ type: 'TYCOON_ACK' }); break;
      case 'jail': dispatch({ type: 'TYCOON_JAIL', choice: a.choice }); break;
      case 'build': dispatch({ type: 'TYCOON_BUILD', space: a.space }); break;
      case 'buildCancel': dispatch({ type: 'TYCOON_BUILD_CANCEL' }); break;
      case 'mortgage': dispatch({ type: 'TYCOON_MORTGAGE', space: a.space }); break;
      case 'end': dispatch({ type: 'TYCOON_END_TURN' }); break;
    }
  };
}

/* ---------------- setup ---------------- */

type Seat = { kind: 'off' | 'bot' | 'human'; bot: BotLevel; name: string };
function TycoonSetupView() {
  const { state, dispatch, play } = useGame();
  const rec = state.stats.tycoon;
  const me = state.character?.name ?? 'You';
  // Contest Path caps: Junior for Grades 1 and 3, Explorer for Grade 5 (see tycoonLevels).
  const grade = capGrade(state.contest);
  const levels = tycoonLevels(grade);
  const [level, setLevel] = useState<Level>(() => (grade ? (grade === 'g5' ? 'explorer' : 'junior') : (rec?.lastLevel as Level) ?? 'explorer'));
  const [mode, setMode] = useState<'quick' | 'classic'>('quick');
  const [seats, setSeats] = useState<Seat[]>([{ kind: 'bot', bot: 'normal', name: '' }, { kind: 'off', bot: 'easy', name: '' }, { kind: 'off', bot: 'hard', name: '' }]);
  const setSeat = (i: number, patch: Partial<Seat>) => setSeats(seats.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const others = seats.filter((s) => s.kind !== 'off');
  const start = () => {
    let bi = 0; let hi = 2;
    const players: TycoonSetup['players'] = [{ name: me, kind: 'human' }, ...others.map((s) => (s.kind === 'bot' ? { name: BOT_NAMES[bi++] ?? 'Gearbot', kind: 'bot' as const, bot: s.bot } : { name: s.name.trim() || `Player ${hi++}`, kind: 'human' as const }))];
    play('open');
    dispatch({ type: 'TYCOON_START', setup: { level, mode, players } });
  };
  return (
    <div className="screen-scroll ty-root">
      <div className="container stack ty-setup">
        <div className="ty-hero">
          <div>
            <div className="ty-eyebrow">ARCADE · BOARD GAME</div>
            <h1>Engine City Tycoon</h1>
            <p>Buy streets by solving their maths, work out the rent you owe, and build workshops to make your streets earn more. The colour groups follow the world map, from Arithmetic Village to Trig Mountains.</p>
            {rec && rec.games > 0 && <p className="small muted">Your record: {rec.games} game{rec.games === 1 ? '' : 's'}, {rec.wins} win{rec.wins === 1 ? '' : 's'}, best net worth {rec.bestWorth} gears.</p>}
          </div>
        </div>

        <section className="ty-card">
          <h3>Level</h3>
          <div className="ty-options">
            {levels.map((l) => (
              <button key={l} className={`ty-option ${level === l ? 'on' : ''}`} onClick={() => setLevel(l)} aria-pressed={level === l}>
                <b>{LEVELS[l].name}</b><small>{LEVELS[l].about}</small><small className="muted">Start with {LEVELS[l].start} gears</small>
              </button>
            ))}
          </div>
        </section>

        <section className="ty-card">
          <h3>Game length</h3>
          <div className="ty-options two">
            <button className={`ty-option ${mode === 'quick' ? 'on' : ''}`} onClick={() => setMode('quick')} aria-pressed={mode === 'quick'}><b>Quick</b><small>{QUICK_ROUNDS} rounds, then the richest player wins. About 20–30 minutes.</small></button>
            <button className={`ty-option ${mode === 'classic' ? 'on' : ''}`} onClick={() => setMode('classic')} aria-pressed={mode === 'classic'}><b>Classic</b><small>Play until one tycoon is left (or the richest after 60 rounds).</small></button>
          </div>
        </section>

        <section className="ty-card">
          <h3>Players</h3>
          <div className="ty-seat"><span className="ty-dot" style={{ background: '#2dd4bf' }} /><b>{me}</b><span className="muted small">you</span></div>
          {seats.map((s, i) => (
            <div key={i} className="ty-seat">
              <span className="ty-dot" style={{ background: ['#a78bfa', '#f59e0b', '#f472b6'][i], opacity: s.kind === 'off' ? 0.3 : 1 }} />
              <select value={s.kind} onChange={(e) => setSeat(i, { kind: e.target.value as Seat['kind'] })} aria-label={`Seat ${i + 2}`}>
                <option value="off">Empty seat</option>
                <option value="bot">Computer</option>
                <option value="human">Another player on this device</option>
              </select>
              {s.kind === 'bot' && <select value={s.bot} onChange={(e) => setSeat(i, { bot: e.target.value as BotLevel })} aria-label="Computer strength"><option value="easy">Easy</option><option value="normal">Normal</option><option value="hard">Hard</option></select>}
              {s.kind === 'human' && <input value={s.name} onChange={(e) => setSeat(i, { name: e.target.value })} placeholder={`Player ${i + 2}`} maxLength={14} aria-label="Player name" />}
            </div>
          ))}
          <p className="small muted">Players on this device take turns passing it round. Only your own answers count towards your mastery and Notebook.</p>
        </section>

        <OnlineBox level={level} mode={mode} />

        <div className="ty-actions">
          <button className="btn primary" disabled={!others.length} onClick={start}>Start the game</button>
          <button className="btn ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'library' })}>‹ Library</button>
        </div>
        {!others.length && <p className="small muted">Add at least one other player.</p>}

        <details className="ty-card ty-rules">
          <summary><b>How to play</b></summary>
          <ul>
            <li><b>Roll and move.</b> The chart beside the dice shows how likely each total is: 7 is the most common.</li>
            <li><b>Buy a street</b> by answering a question from its colour group. Wrong? You see the working, and the street stays for sale.</li>
            <li><b>Pay rent</b> by working it out yourself. Right first time earns a Sharp Mind token: 10% off your next rent. Wrong? You pay the right amount and see how.</li>
            <li><b>Own a whole colour set</b> to double its rent and build workshops. Each workshop needs a harder question. The fourth is an Engine Hall.</li>
            <li><b>Error Book Cell:</b> to get out, fix one of your saved mistakes, pay {JAIL_FEE}, or roll doubles.</li>
            <li><b>Ledger Park:</b> taxes go in the jar. Land there and add up the jar exactly to take it all.</li>
          </ul>
        </details>
      </div>
    </div>
  );
}

/* ---------------- the table ---------------- */

function TycoonTable({ g }: { g: TycoonGame }) {
  const { dispatch, play } = useGame();
  const [sel, setSel] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const p = current(g);
  const botTurn = p.kind === 'bot' && g.phase !== 'over' && (!g.online || g.online.host);

  // Computer players think out loud at a readable pace.
  useEffect(() => {
    if (!botTurn) return;
    const id = window.setTimeout(() => dispatch({ type: 'TYCOON_BOT' }), g.review ? 1500 : g.pending ? 900 : 700);
    return () => window.clearTimeout(id);
  }, [g.rev, botTurn]); // eslint-disable-line react-hooks/exhaustive-deps

  // Follow the current player's piece.
  useEffect(() => { setSel(null); }, [g.turn]);
  useEffect(() => { if (g.review && myReview(g)) play(g.review.correct ? 'correct' : 'wrong'); }, [g.review]); // eslint-disable-line react-hooks/exhaustive-deps

  if (g.phase === 'over') return <Ledger g={g} />;
  const focus = sel ?? p.pos;
  return (
    <div className="screen-scroll ty-root">
      <div className="ty-table">
        <div className="ty-top">
          <button className="btn small ghost" onClick={() => setLeaving(true)}>⟵ Leave</button>
          <div className="ty-players">
            {g.players.map((x) => (
              <div key={x.id} className={`ty-pl ${x.id === p.id ? 'turn' : ''} ${x.out ? 'out' : ''}`} title={`${x.name}: net worth ${netWorth(g, x.id)}`}>
                <span className="ty-dot" style={{ background: x.color }} />
                <b>{x.name}</b>
                <span className="ty-gears">{x.out ? 'out' : `⚙ ${x.gears}`}</span>
                {x.sharp > 0 && <span className="ty-sharp" title="Sharp Mind tokens: 10% off the next rent">✦{x.sharp}</span>}
                {x.jail >= 0 && <span title="In the Error Book Cell">▦</span>}
              </div>
            ))}
          </div>
          <span className="small muted">Round {g.round}{g.mode === 'quick' ? `/${g.rounds}` : ''}{g.online ? ` · room ${g.online.code}` : ''}</span>
        </div>
        {leaving && (
          <div className="ty-card ty-leave" role="dialog" aria-label="Leave the game">
            <b>Leave the table?</b>
            <p className="small">{g.online ? (g.online.host ? 'Your device runs this table: if you leave, the game ends for everyone.' : 'A computer player will take your seat.') : 'Your game is saved: come back from the Arcade any time.'}</p>
            <div className="ty-actions">
              {!g.online && <button className="btn" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'library' })}>Save and leave</button>}
              {(!g.online || g.online.host) && <button className="btn" onClick={() => { dispatch({ type: 'TYCOON_FINISH' }); setLeaving(false); }}>End the game now and count up</button>}
              <button className="btn ghost" onClick={() => dispatch({ type: 'TYCOON_EXIT' })}>{g.online ? (g.online.host ? 'Close the table for everyone' : 'Leave the table') : 'Quit without scoring'}</button>
              <button className="btn ghost" onClick={() => setLeaving(false)}>Keep playing</button>
            </div>
          </div>
        )}
        <div className="ty-main">
          <div className="ty-board-wrap"><Board g={g} selected={sel} onSelect={(i) => setSel(sel === i ? null : i)} /></div>
          <div className="ty-side">
            <TurnPanel g={g} />
            <SpaceInfo g={g} i={focus} onClose={sel !== null ? () => setSel(null) : undefined} />
            <Log g={g} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TurnPanel({ g }: { g: TycoonGame }) {
  const { play } = useGame();
  const act = useAct(g);
  const room = useTycoonRoom();
  const [explain, setExplain] = useState(false);
  const p = current(g);
  const bot = !myTurn(g);
  const multiHuman = g.players.filter((x) => x.kind === 'human' && !x.out).length > 1;
  const head = <div className="ty-turn-head" style={{ borderColor: p.color }}><span className="ty-dot" style={{ background: p.color }} /><b>{bot ? `${p.name} is playing` : multiHuman && !g.online ? `${p.name}’s turn` : 'Your turn'}</b>{g.dice && <span className="muted small">rolled {labeled(`${g.dice[0]} + ${g.dice[1]} = ${g.dice[0] + g.dice[1]} (dice total)`)}</span>}</div>;

  if (g.review) {
    const r = g.review; const who = playerById(g, r.player);
    return (
      <div className="ty-card ty-turn">
        {head}
        <div className={`ty-review ${r.correct ? 'ok' : 'bad'}`} role="status">
          <div className="small muted">{r.title}{who && !myReview(g) ? ` · ${who.name} answered ${r.given}` : ` · you answered ${r.given}`}</div>
          <b>{labeled(r.text)}</b>
          {r.steps.length > 0 && <ol className="ty-steps">{r.steps.map((s, k) => <li key={k}>{labeled(s)}</li>)}</ol>}
          {[r.text, ...r.steps].some(hasLabels) && <LabelKey />}
        </div>
        {myReview(g) ? <button className="btn primary" onClick={() => { play('click'); act({ kind: 'ack' }); }}>Continue</button> : <p className="small muted">Waiting for {who?.name ?? 'them'} to continue…</p>}
      </div>
    );
  }
  if (bot) return <div className="ty-card ty-turn">{head}<p className="small muted">{p.kind === 'bot' ? (g.pending ? 'Thinking…' : 'Taking a turn…') : `Waiting for ${p.name}…`}</p>{room.error && <p className="small ty-warn">{room.error}</p>}</div>;

  const pd = g.pending;
  if (pd) {
    if (pd.kind === 'choice') return (
      <div className="ty-card ty-turn">{head}
        <div className="ty-cardface puzzle"><small>PUZZLE CARD</small><b>{pd.title}</b><p>{pd.prompt}</p><p className="small">Right: {pd.winText}</p></div>
        <div className="ty-choices">{pd.choices.map((c, k) => <button key={k} className="btn" onClick={() => act({ kind: 'answer', given: String(k) })}>{c}</button>)}</div>
      </div>
    );
    const s = pd.kind === 'buy' || pd.kind === 'build' ? SPACES[pd.space] : null;
    const title = pd.kind === 'buy' ? `Buy ${s!.name} for ${s!.price} gears?` : pd.kind === 'build' ? `Build on ${s!.name}` : pd.kind === 'pay' ? pd.title : pd.kind === 'collect' ? pd.title : pd.kind === 'park' ? 'Ledger Park' : 'Fix a mistake';
    return (
      <div className="ty-card ty-turn">
        {head}
        <b className="ty-ask">{title}</b>
        {pd.kind === 'buy' && s && <DeedCard g={g} i={s.i} />}
        {pd.kind === 'buy' && p.gears < s!.price! && <p className="small ty-warn">You have {p.gears} gears. Mortgage a street first, or pass.</p>}
        {pd.kind === 'build' && s && <p className="small">A {GROUPS[s.group!].workshop}-gear workshop, if you get this harder {GROUPS[s.group!].topic[g.level].toLowerCase()} question right.</p>}
        <MathChallenge key={pd.q.id} question={pd.q} onSubmit={(given) => act({ kind: 'answer', given })} onNext={() => undefined} showExplanation={explain} onToggleExplanation={() => setExplain((v) => !v)} showTimer={false} compact silent />
        {pd.kind === 'buy' && <button className="btn ghost small" onClick={() => act({ kind: 'pass' })}>Not now: leave it for sale</button>}
        {pd.kind === 'build' && <button className="btn ghost small" onClick={() => act({ kind: 'buildCancel' })}>Cancel</button>}
      </div>
    );
  }
  if (g.phase === 'roll' && p.jail >= 0) return (
    <div className="ty-card ty-turn">{head}
      <p><b>You’re in the Error Book Cell.</b> Try {3 - p.jail} more time{3 - p.jail === 1 ? '' : 's'} for doubles, or leave another way.</p>
      <div className="ty-choices col">
        <button className="btn primary" onClick={() => act({ kind: 'jail', choice: 'fix' })}>📓 Fix a mistake (free)</button>
        <button className="btn" disabled={p.gears < JAIL_FEE} onClick={() => act({ kind: 'jail', choice: 'pay' })}>Pay {JAIL_FEE} gears</button>
        <button className="btn" onClick={() => { play('click'); act({ kind: 'jail', choice: 'roll' }); }}>🎲 Roll for doubles</button>
      </div>
      <MyStreets g={g} />
    </div>
  );
  return (
    <div className="ty-card ty-turn">
      {head}
      {g.phase === 'roll' ? (
        <>
          {g.doubles > 0 && <p className="small">Doubles! Roll again.</p>}
          <button className="btn primary ty-roll" onClick={() => { play('click'); act({ kind: 'roll' }); }}>🎲 Roll the dice</button>
          <DiceOdds last={g.dice ? g.dice[0] + g.dice[1] : null} />
        </>
      ) : (
        <button className="btn primary ty-roll" onClick={() => { play('click'); act({ kind: 'end' }); }}>End turn</button>
      )}
      <MyStreets g={g} />
    </div>
  );
}

/** Build and mortgage, for the player whose turn it is. */
function MyStreets({ g }: { g: TycoonGame }) {
  const act = useAct(g);
  const p = current(g);
  const mine = deedsOf(g, p.id);
  if (!mine.length) return <p className="small muted">You don’t own any streets yet.</p>;
  return (
    <details className="ty-streets">
      <summary>Your streets ({mine.length}) · build or mortgage</summary>
      {mine.map((i) => {
        const s = SPACES[i]; const d = g.deeds[i];
        const why = s.kind === 'prop' ? canBuild(g, i) : 'n/a';
        const shopBlock = s.group && Object.entries(g.deeds).some(([k, x]) => SPACES[Number(k)].group === s.group && x.workshops > 0);
        return (
          <div key={i} className="ty-street">
            <span className="ty-swatch" style={{ background: s.group ? GROUPS[s.group].color : '#94a3b8' }} />
            <span className="grow"><b>{s.name}</b><small>{d.mortgaged ? 'mortgaged' : s.kind === 'prop' ? `${d.workshops === MAX_WORKSHOPS ? 'Engine Hall' : `${d.workshops} workshop${d.workshops === 1 ? '' : 's'}`}${ownsSet(g, p.id, s.group!) ? ' · full set' : ''}` : s.kind === 'rail' ? 'rail line' : 'utility'}</small></span>
            {s.kind === 'prop' && !d.mortgaged && <button className="btn small" disabled={!!why} title={why ?? `Costs ${GROUPS[s.group!].workshop}`} onClick={() => act({ kind: 'build', space: i })}>Build {GROUPS[s.group!].workshop}</button>}
            <button className="btn small ghost" disabled={(!d.mortgaged && !!shopBlock) || (d.mortgaged && p.gears < unmortgageCost(s.price!)) || !!g.pending || !!g.review} onClick={() => act({ kind: 'mortgage', space: i })}>
              {d.mortgaged ? `Buy back ${unmortgageCost(s.price!)}` : `Mortgage +${mortgageValue(s.price!)}`}
            </button>
          </div>
        );
      })}
    </details>
  );
}

function DeedCard({ g, i }: { g: TycoonGame; i: number }) {
  const s = SPACES[i];
  if (s.kind !== 'prop') return <div className="ty-deed"><div className="ty-deed-top" style={{ background: '#cbd5e1' }}><b>{s.name}</b></div><p className="small">{s.kind === 'rail' ? 'Rent doubles for each Rail line the owner has: 25, 50, 100 or 200 gears.' : 'Rent is 4 gears for each point on the dice, or 10 gears per point if one player owns both utilities.'}</p></div>;
  const gr = GROUPS[s.group!];
  return (
    <div className="ty-deed">
      <div className="ty-deed-top" style={{ background: gr.color }}><small>{gr.name.toUpperCase()}</small><b>{s.name}</b></div>
      <table><tbody>
        {[0, 1, 2, 3, 4].map((w) => { const r = streetRent(g.level, s.price!, w, false); return <tr key={w}><td>{w === 0 ? 'Rent' : w === MAX_WORKSHOPS ? 'Engine Hall' : `${w} workshop${w > 1 ? 's' : ''}`}{w ? <> · {labeled(r.expr)}</> : ''}</td><td>{r.amount}</td></tr>; })}
      </tbody></table>
      <p className="small">Teaches: {gr.topic[g.level]} · workshops cost {gr.workshop} gears</p>
    </div>
  );
}

function SpaceInfo({ g, i, onClose }: { g: TycoonGame; i: number; onClose?: () => void }) {
  const s = SPACES[i]; const d = g.deeds[i]; const owner = d ? playerById(g, d.owner) : null;
  const rent = d ? rentFor(g, i, 7) : null;
  return (
    <div className="ty-card ty-info">
      <div className="ty-info-h">{s.group && <span className="ty-swatch" style={{ background: GROUPS[s.group].color }} />}<b>{s.name}</b>{onClose && <button className="btn small ghost" onClick={onClose} aria-label="Close">✕</button>}</div>
      {s.group && <p className="small">{GROUPS[s.group].name}: {GROUPS[s.group].topic[g.level]}</p>}
      {s.text && <p className="small">{s.text}</p>}
      {s.price && <p className="small">Price {s.price} gears · {owner ? <>owned by <b style={{ color: owner.color }}>{owner.name}</b>{d?.mortgaged ? ' (mortgaged)' : ''}</> : 'for sale'}</p>}
      {rent && <p className="small">Rent now{s.kind === 'util' ? ', if the dice show 7' : ''}: {labeled(`${rent.expr} = ${rent.amount} (rent in gears)`)}</p>}
      {s.kind === 'park' && g.jar.length > 0 && <p className="small">The jar has {g.jar.length} deposit{g.jar.length > 1 ? 's' : ''}. Land here and add them up to win them.</p>}
    </div>
  );
}

function Log({ g }: { g: TycoonGame }) {
  const lines = g.log.slice(-6).reverse();
  return (
    <details className="ty-card ty-log" open>
      <summary className="small muted">What happened</summary>
      <ul>{lines.map((l, k) => { const who = l.who ? playerById(g, l.who) : null; return <li key={g.log.length - k}>{who && <span className="ty-dot sm" style={{ background: who.color }} />}{labeled(l.text)}</li>; })}</ul>
    </details>
  );
}

/** Ways to roll each total, out of 36, with the last roll marked. */
function DiceOdds({ last }: { last: number | null }) {
  const W = 260, H = 84;
  const bw = W / 11;
  return (
    <figure className="ty-odds">
      <svg viewBox={`0 0 ${W} ${H + 16}`} role="img" aria-label="Ways to roll each total with two dice, out of 36">
        {Object.entries(DICE_WAYS).map(([t, w], k) => {
          const h = (w / 6) * H; const x = k * bw + 3;
          return (
            <g key={t}>
              <title>{`Total ${t}: ${w} of 36 ways`}</title>
              <rect x={x} y={H - h} width={bw - 6} height={h} rx="3" className={Number(t) === last ? 'last' : ''} />
              <text x={x + (bw - 6) / 2} y={H + 13} textAnchor="middle">{t}</text>
            </g>
          );
        })}
      </svg>
      <figcaption className="small muted">Ways to roll each total, out of 36. 7 is most likely (6 ways){last ? `; you last rolled ${last} (${DICE_WAYS[last]} way${DICE_WAYS[last] === 1 ? '' : 's'})` : ''}.</figcaption>
    </figure>
  );
}

/* ---------------- the Ledger (end of game) ---------------- */

function Ledger({ g }: { g: TycoonGame }) {
  const { dispatch, play } = useGame();
  const rows = standings(g);
  const winner = playerById(g, g.winner ?? '');
  const me = playerById(g, g.online?.myId ?? 'p1') ?? g.players[0];
  const acc = me.stats.right + me.stats.wrong ? Math.round((me.stats.right / (me.stats.right + me.stats.wrong)) * 100) : 0;
  const again = () => { play('open'); dispatch({ type: 'TYCOON_START', setup: { level: g.level, mode: g.mode, players: g.players.map((p) => ({ name: p.name, kind: p.kind, bot: p.bot })) } }); };
  return (
    <div className="screen-scroll ty-root">
      <div className="container stack ty-ledger">
        <div className="ty-hero center">
          <div className="ty-eyebrow">THE LEDGER</div>
          <h1>{winner ? `${winner.id === me.id ? 'You win' : `${winner.name} wins`}!` : 'Game over'}</h1>
          <p className="muted">{g.round >= g.rounds ? `${g.rounds} rounds played.` : `After ${g.round} rounds.`} Net worth = gears + streets (half if mortgaged) + workshops.</p>
        </div>
        <section className="ty-card">
          <h3>Final standings</h3>
          <table className="ty-stand"><thead><tr><th scope="col">Player</th><th scope="col">Net worth</th><th scope="col">Streets</th><th scope="col">Rent paid</th><th scope="col">Rent earned</th><th scope="col">Right answers</th></tr></thead>
            <tbody>{rows.map(({ p, worth }, k) => (
              <tr key={p.id}><th scope="row"><span className="ty-dot sm" style={{ background: p.color }} /> {k + 1}. {p.name}{p.out ? ' (out)' : ''}</th><td>{worth}</td><td>{deedsOf(g, p.id).length}</td><td>{p.stats.rentPaid}</td><td>{p.stats.rentEarned}</td><td>{p.stats.right}/{p.stats.right + p.stats.wrong}</td></tr>
            ))}</tbody></table>
        </section>
        <section className="ty-card">
          <h3>Net worth over the game</h3>
          <WorthChart players={g.players} />
        </section>
        <section className="ty-card">
          <h3>Your maths this game</h3>
          <p>{me.stats.right} right out of {me.stats.right + me.stats.wrong} ({acc}%). Missed questions are in your Notebook to practise.</p>
          {me.stats.rentEarned > 0 && <p className="small">Your streets earned {me.stats.rentEarned} gears in rent{me.stats.bought ? ` from ${me.stats.bought} purchase${me.stats.bought > 1 ? 's' : ''}` : ''}.</p>}
        </section>
        <div className="ty-actions">
          {!g.online && <button className="btn primary" onClick={again}>Play again</button>}
          <button className="btn" onClick={() => dispatch({ type: 'TYCOON_EXIT' })}>New game setup</button>
          <button className="btn ghost" onClick={() => { dispatch({ type: 'TYCOON_EXIT' }); dispatch({ type: 'NAVIGATE', screen: 'library' }); }}>‹ Library</button>
        </div>
      </div>
    </div>
  );
}

function WorthChart({ players }: { players: TPlayer[] }) {
  const W = 560, H = 220, L = 44, R = 70, T = 12, B = 26;
  const n = Math.max(2, ...players.map((p) => p.worth.length));
  const all = players.flatMap((p) => p.worth);
  const lo = Math.max(0, Math.floor((Math.min(...all) - 100) / 250) * 250);
  const hi = Math.max(lo + 500, Math.ceil((Math.max(...all) + 50) / 250) * 250);
  const x = (k: number) => L + (k / (n - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const ticks = useMemo(() => Array.from({ length: 5 }, (_, k) => Math.round(lo + ((hi - lo) / 4) * k)), [lo, hi]);
  // End labels: keep them at least 13px apart so close finishes stay readable.
  const ends = [...players].map((p) => ({ id: p.id, y: y(p.worth[p.worth.length - 1]) })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 13) ends[k].y = ends[k - 1].y + 13;
  const labelY = Object.fromEntries(ends.map((e) => [e.id, e.y]));
  return (
    <div className="ty-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Net worth of each player after each round">
        {ticks.map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="grid" /><text x={L - 6} y={y(v) + 4} textAnchor="end">{v}</text></g>)}
        <text x={L} y={H - 6}>start</text><text x={W - R} y={H - 6} textAnchor="end">round {n - 1}</text>
        {players.map((p) => (
          <g key={p.id}>
            <polyline points={p.worth.map((v, k) => `${x(k)},${y(v)}`).join(' ')} fill="none" stroke={p.color} strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx={x(p.worth.length - 1)} cy={y(p.worth[p.worth.length - 1])} r="4" fill={p.color} />
            <text x={x(p.worth.length - 1) + 8} y={labelY[p.id] + 4} className="end">{p.name}</text>
          </g>
        ))}
      </svg>
      <div className="ty-legend">{players.map((p) => <span key={p.id}><span className="ty-dot sm" style={{ background: p.color }} />{p.name}</span>)}</div>
    </div>
  );
}

/* ---------------- online ---------------- */

const newId = () => `p-${Math.random().toString(36).slice(2, 12)}`;
function OnlineBox({ level, mode }: { level: Level; mode: 'quick' | 'classic' }) {
  const { state, dispatch, play } = useGame();
  const invite = typeof state.screenParams?.room === 'string' ? normalizeRoomCode(state.screenParams.room) : '';
  const [code, setCode] = useState(invite);
  return (
    <section className="ty-card" id="online">
      <h3>Play with friends online</h3>
      <p className="small">Each player uses their own device. The host picks the level and length above; friends join with the room code.</p>
      <div className="ty-actions">
        <button className="btn" onClick={() => { play('open'); dispatch({ type: 'TYCOON_HOST', level, mode, code: makeRoomCode(), myId: newId() }); }}>Create a room</button>
        <form className="ty-join" onSubmit={(e) => { e.preventDefault(); if (normalizeRoomCode(code).length === 4) { play('open'); dispatch({ type: 'TYCOON_JOIN', code: normalizeRoomCode(code), myId: newId() }); } }}>
          <input value={code} onChange={(e) => setCode(normalizeRoomCode(e.target.value))} placeholder="ABCD" maxLength={4} autoCapitalize="characters" autoComplete="off" spellCheck={false} aria-label="Room code" />
          <button className="btn" disabled={normalizeRoomCode(code).length !== 4}>Join</button>
        </form>
      </div>
    </section>
  );
}

function Lobby({ g }: { g: TycoonGame }) {
  const { dispatch } = useGame();
  const room = useTycoonRoom();
  const [bots, setBots] = useState<BotLevel[]>([]);
  const [copied, setCopied] = useState(false);
  const host = !!g.online?.host;
  const lobby = g.online?.lobby ?? [];
  const copy = async () => { try { await navigator.clipboard.writeText(`${inviteUrl(g.online!.code)}&game=tycoon`); setCopied(true); } catch { setCopied(false); } };
  const seats = lobby.length + bots.length;
  return (
    <div className="screen-scroll ty-root">
      <div className="container stack ty-setup">
        <div className="ty-hero">
          <div className="ty-eyebrow">ENGINE CITY TYCOON · ONLINE</div>
          <h1>Room {g.online?.code}</h1>
          <p className="small" aria-live="polite">{room.status || (host ? 'Opening the room…' : 'Connecting…')}</p>
          {room.error && <p className="small ty-warn" role="alert">{room.error}</p>}
        </div>
        <section className="ty-card">
          <h3>At the table</h3>
          {lobby.length ? lobby.map((p, k) => <div key={p.id} className="ty-seat"><span className="ty-dot" style={{ background: ['#2dd4bf', '#a78bfa', '#f59e0b', '#f472b6'][k] }} /><b>{p.name}</b>{p.id === g.online?.myId && <span className="small muted">you</span>}{k === 0 && <span className="small muted">host</span>}</div>) : <p className="small muted">Waiting for the host…</p>}
          {host && bots.map((b, k) => <div key={`b${k}`} className="ty-seat"><span className="ty-dot" style={{ background: '#94a3b8' }} /><b>Computer ({b})</b><button className="btn small ghost" onClick={() => setBots(bots.filter((_, i) => i !== k))}>Remove</button></div>)}
          {host && seats < 4 && <div className="ty-actions">{(['easy', 'normal', 'hard'] as BotLevel[]).map((b) => <button key={b} className="btn small" onClick={() => setBots([...bots, b])}>+ Computer ({b})</button>)}</div>}
          {host && <p className="small muted">{LEVELS[g.level].name} level · {g.mode === 'quick' ? `${g.rounds} rounds` : 'classic'}. Keep this screen open on your device: it runs the game.</p>}
        </section>
        <div className="ty-actions">
          {host && <button className="btn" onClick={copy}>{copied ? 'Invite link copied' : 'Copy invite link'}</button>}
          {host && <button className="btn primary" disabled={!room.connected || seats < 2} onClick={() => dispatch({ type: 'TYCOON_LAUNCH', bots })}>Start together</button>}
          {!host && <p className="small">The host starts the game when everyone is here.</p>}
          <button className="btn ghost" onClick={() => dispatch({ type: 'TYCOON_EXIT' })}>Leave room</button>
        </div>
      </div>
    </div>
  );
}
