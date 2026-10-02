import { useEffect, useState } from 'react';
import { useGame } from '../store';
import { labeled } from '../components/Labeled';
import { Icon, Panel } from '../components/ui';
import { MathChallenge } from '../components/MathChallenge';
import { Confetti, Callout } from '../components/Fx';
import { cardLabel, evaluate, HAND_NAMES, PAYS, ANTE, outs, known, stake, payoutQuestion, studNet, type Card } from '../../engine/state/stud';
import { parseSelection } from '../../engine/state/arcade';
import type { ArcadeGame } from '../../engine/state/types';
import { BondPicker } from '../components/BondPicker';
import { CapsGate, CapsStrip, ClockConsent, capGrade, capsGateFor, capMath, lessonOk } from './ArcadeScreen';

const MATH: { key: string; label: string; game: ArcadeGame; selection: string }[] = [
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

export function StudScreen() {
  const { state } = useGame();
  if (state.stud) return <StudTable />;
  // Contest Path caps: not on the Grade 1 path; Grade 3 after a calm streak.
  const gate = capsGateFor(state, { notFor: ['g1'], streakFor: ['g3'] });
  return gate ? <CapsGate title="Stud Math" reason={gate} /> : <StudMenu />;
}

function Paytable({ highlight }: { highlight?: number }) {
  return (
    <table className="paytable">
      <tbody>
        {[11, 10, 9, 8, 7, 6, 5, 4, 3, 2].map((r) => (
          <tr key={r} className={highlight === r ? 'hl' : ''}><td>{HAND_NAMES[r]}</td><td>{r === 2 ? 'push' : `${PAYS[r]} to 1`}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function StudMenu() {
  const { state, dispatch, play } = useGame();
  const rec = state.stats.stud;
  // Contest Path caps: only the math the grade may play; counting outs (a chance as a percent) waits for Grade 5.
  const grade = capGrade(state.contest);
  const math = capMath(grade, MATH);
  const oddsOk = !grade || grade === 'g5';
  const [picked, setPick] = useState<string>('mixed:all');
  const pick = (picked === 'odds' && oddsOk) || math.some((m) => m.key === picked) ? picked : math[0]?.key ?? 'odds';
  const [bond, setBond] = useState(10);
  const [consent, setConsent] = useState(false);
  const selOf = (m: (typeof MATH)[number]) => (m.game === 'bonds' ? `bonds:${bond}` : m.selection);
  const start = () => {
    play('open');
    if (pick === 'odds') dispatch({ type: 'STUD_START', selection: 'odds' });
    else { const m = math.find((x) => x.key === pick)!; dispatch({ type: 'STUD_START', selection: { game: m.game, key: selOf(m) } }); }
  };
  const broke = rec.gears < ANTE;
  const blitz = () => { const m = math.find((x) => x.key === pick) ?? math[0]; if (!m) return; play('boss-roar'); dispatch({ type: 'ARCADE_START', game: m.game, mode: 'blitz', selection: selOf(m), durationMs: 60_000, reward: 'gears' }); };
  /** The Gear Blitz is a 60-second clock: straight in with no grade, after a yes with one. */
  const earn = () => { if (grade) { play('click'); setConsent(true); } else blitz(); };
  return (
    <div className="screen-scroll stud-bg">
      <div className="container stack" style={{ maxWidth: 860 }}>
        <div className="row wrap">
          <h2 className="brass">Stud Math</h2>
          <span className="chip">⚙ {rec.gears} gears</span>
          <span className="chip">{rec.wins}/{rec.hands} hands won</span>
          {rec.bestRank > 0 && <span className="chip">Best hand: {HAND_NAMES[rec.bestRank]}</span>}
          <span className="spacer" />
          <button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'library' })}>‹ Library</button>
        </div>
        <CapsStrip />
        <div className="stud-hero">
          <div className="stud-logo"><span>MISSISSIPPI</span><b>STUD MATH</b></div>
          <p>Two cards for you, three on the table flipped one at a time. Before every flip: fold, or raise 1×, 2× or 3× the {ANTE}-gear ante. A bigger raise means a harder question. Get it right and your raise stands. At the end, you compute your own payout.</p>
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            {math.map((m) => <button key={m.key} className={`btn small ${pick === m.key ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setPick(m.key); }}>{m.label}</button>)}
            {oddsOk && <button className={`btn small ${pick === 'odds' ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setPick('odds'); }}>Odds: count the outs</button>}
          </div>
          {pick.startsWith('bonds:') && <div style={{ maxWidth: 520, margin: '0 auto', width: '100%' }}><BondPicker value={bond} onChange={setBond} /></div>}
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            <button className={`btn big ${broke ? '' : 'primary'}`} disabled={broke} onClick={start}><Icon name="coins" /> Deal ({ANTE} gears)</button>
            {math.length > 0 && <button className={`btn big ${broke ? 'primary' : ''}`} onClick={earn}><Icon name="hourglass" /> Gear Blitz: earn gears</button>}
          </div>
          {consent && <ClockConsent what="Gear Blitz: 60 seconds, 5 gears for every right answer." onYes={() => { setConsent(false); blitz(); }} onNo={() => setConsent(false)} />}
          {broke ? <p className="small" style={{ color: '#fde68a' }}>You're out of gears. Run a 60-second Gear Blitz: every right answer pays 5 gears, plus 20 per star.</p> : <p className="small muted">Every correct question at the table pays 5 gears per 1× raised. Low on gears? A 60-second Gear Blitz pays 5 per right answer, plus 20 per star.</p>}
        </div>
        <div className="grid-2">
          <Panel title="Paytable" icon="scroll"><Paytable /><p className="small muted">Pays on your whole stake: ante plus every raise.</p></Panel>
          <Panel title="Learn the odds" icon="book">
            {/* Contest Path caps: the odds lessons count outs as a percent, so they open where the odds questions do (Grade 5). */}
            {(() => { const ls = ([['l.stud-outs', 'Reading the Deck'], ['l.stud-ev', 'Is the Raise Worth It?']] as const).filter(([id]) => oddsOk || lessonOk(grade, id)); return <>
              <p className="small muted">"Outs" are the unseen cards that improve your hand. Outs ÷ unseen cards is your chance.{ls.length ? ' Two lessons teach it and when a raise is worth it.' : ''}</p>
              {ls.length > 0 && <div className="row wrap">
                {ls.map(([id, l]) => <button key={id} className="btn small" onClick={() => { play('click'); dispatch({ type: 'START_LESSON', lessonId: id }); }}><Icon name="book" /> {l}</button>)}
              </div>}
            </>; })()}
            <p className="small muted" style={{ marginTop: 8 }}>Gears are workshop tokens, not money. You earn them by answering: at the table and in the Gear Blitz.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function CardView({ c, down, flip }: { c?: Card; down?: boolean; flip?: boolean }) {
  if (down || !c) return <div className="pcard down" aria-label="face-down card"><span>⚙</span></div>;
  const red = c.s === 1 || c.s === 2;
  return <div className={`pcard ${red ? 'red' : ''} ${flip ? 'flip' : ''}`} aria-label={cardLabel(c)}><b>{cardLabel(c).slice(0, -1)}</b><i>{cardLabel(c).slice(-1)}</i></div>;
}

function StudTable() {
  const { state, dispatch, play } = useGame();
  const st = state.stud!; const rec = state.stats.stud;
  const [explain, setExplain] = useState(false);
  const [showOuts, setShowOuts] = useState(true);
  const [burst, setBurst] = useState(0);
  const [callout, setCallout] = useState<{ n: number; text: string }>({ n: 0, text: '' });
  const kn = known(st); const cur = evaluate(kn);
  const o = st.status === 'decide' ? outs(kn) : null;
  const net = st.status === 'done' ? studNet(st) : 0;
  const streetName = ['3rd Street', '4th Street', '5th Street'][st.revealed] ?? 'Showdown';
  const label = st.selection === 'odds' ? 'Odds' : parseSelection(st.selection.game, st.selection.key).label;
  useEffect(() => { setExplain(false); }, [st.pending?.question.id, st.status]);
  useEffect(() => {
    if (st.status === 'reveal') play(st.pending?.correct ? 'correct' : 'wrong');
    if (st.status === 'collect') { play('fanfare'); setCallout({ n: Date.now(), text: HAND_NAMES[st.result!.rank].toUpperCase() }); }
    if (st.status === 'done' && !st.folded) { if (net > 0) { play('coin'); setBurst(Date.now()); } else if (net < 0) play('defeat'); }
  }, [st.status]); // eslint-disable-line react-hooks/exhaustive-deps
  const mults: (1 | 2 | 3)[] = [1, 2, 3];
  const feedbackFor = st.pending?.correct !== undefined ? { correct: !!st.pending.correct, text: st.lastFeedback ?? '' } : undefined;
  const payoutQ = st.status === 'collect' || (st.status === 'done' && st.result?.guess !== undefined) ? payoutQuestion(st) : null;

  return (
    <div className="scene stud-bg">
      <Confetti trigger={burst} />
      <Callout text={callout.text} trigger={callout.n} />
      <div className="scene-header">
        <div className="loc"><h2>STUD MATH · {streetName} · {label}</h2></div>
        <span className="spacer" />
        <span className="chip">⚙ {rec.gears}</span>
        <span className="chip">Stake {stake(st)}</span>
        <button className="btn small ghost" onClick={() => dispatch({ type: 'STUD_EXIT' })}>{st.status === 'done' ? 'Back' : 'Leave'}</button>
      </div>
      <div className="scene-body">
        <div className="stud-layout">
          <div className="felt">
            <div className="card-row community">
              {st.community.map((c, i) => <CardView key={i} c={c} down={i >= st.revealed} flip={i === st.revealed - 1} />)}
            </div>
            <div className="hand-name">{kn.length >= 2 ? HAND_NAMES[cur] : ''}{st.status === 'done' && st.folded ? ' · folded' : ''}</div>
            <div className="card-row hole">{st.hole.map((c, i) => <CardView key={i} c={c} />)}</div>
            <div className="bets">
              <span className="chip">Ante {st.ante}</span>
              {st.bets.map((b, i) => <span key={i} className={`chip ${b > st.ante ? 'ok' : ''}`}>{['3rd', '4th', '5th'][i]}: {b}</span>)}
            </div>
          </div>

          <div className="stud-side">
            {st.status === 'decide' && o && (
              <>
                <div className="outs-box">
                  <div className="row"><b>Your chances</b><span className="spacer" /><button className="btn small ghost" onClick={() => setShowOuts((v) => !v)}>{showOuts ? 'Hide' : 'Show'}</button></div>
                  {showOuts && <p className="small">{o.outs} of the {o.unseen} unseen cards improve your hand: <b>{labeled(`${o.outs} (outs) ÷ ${o.unseen} (unseen cards) ≈ ${o.percent}% (chance to improve)`)}</b>.{o.examples.length ? ` For example ${o.examples.join(' ')}.` : ' Nothing can improve it now.'}</p>}
                </div>
                <div className="stud-actions">
                  <p className="small muted">Raise to flip the next card. Bigger raise, harder question.</p>
                  <div className="row wrap">
                    {mults.map((m) => <button key={m} className={`btn ${m === 3 ? 'primary' : ''}`} disabled={rec.gears < m * st.ante} onClick={() => { play('click'); dispatch({ type: 'STUD_CHOOSE', choice: m }); }}>Raise {m}× · {m * st.ante}</button>)}
                    <button className="btn ghost" onClick={() => { play('wrong'); dispatch({ type: 'STUD_CHOOSE', choice: 'fold' }); }}>Fold</button>
                  </div>
                </div>
              </>
            )}
            {(st.status === 'question' || st.status === 'reveal') && st.pending && (
              <div className="stud-q">
                <div className="small muted">Raise {st.pending.mult}× · answer to flip the card</div>
                <MathChallenge question={st.pending.question} feedback={feedbackFor} onSubmit={(given) => dispatch({ type: 'STUD_ANSWER', given })} onNext={() => { play('open'); dispatch({ type: 'STUD_REVEAL' }); }} hintShown={st.selection === 'odds'} showExplanation={explain} onToggleExplanation={() => setExplain((v) => !v)} nextLabel="Flip the card" showTimer={false} compact />
              </div>
            )}
            {st.status === 'collect' && payoutQ && (
              <div className="stud-q">
                <div className="small muted">You won! Work out your payout to collect it.</div>
                <MathChallenge question={payoutQ} onSubmit={(given) => dispatch({ type: 'STUD_COLLECT', given })} onNext={() => {}} showExplanation={explain} onToggleExplanation={() => setExplain((v) => !v)} showTimer={false} compact />
              </div>
            )}
            {st.status === 'done' && (
              <div className="panel center stack stud-result">
                <h1 className="brass">{st.folded ? 'FOLDED' : net > 0 ? 'YOU WIN' : net === 0 ? 'PUSH' : 'HOUSE WINS'}</h1>
                {st.earned > 0 && <p className="small ok">Question bonuses this hand: +{st.earned} gears.</p>}
                {!st.folded && <p>{HAND_NAMES[st.result!.rank]}{st.result!.pays > 0 ? ` pays ${st.result!.pays} to 1 on a stake of ${st.result!.stake}.` : st.result!.rank === 2 ? '. Your stake comes back.' : '. No pay on this hand.'}</p>}
                {st.result?.guess !== undefined && <p className={`small ${st.result.guessRight ? 'ok' : 'muted'}`}>{st.result.guessRight ? labeled(`Payout right: ${st.result.stake} (gears staked) × ${st.result.pays} (profit per gear) = ${st.result.profit} (gears of profit). Full winnings collected.`) : labeled(`Payout was ${st.result.stake} (gears staked) × ${st.result.pays} (profit per gear) = ${st.result.profit} (gears of profit), you said ${st.result.guess}. The cashier paid only the ante's share.`)}</p>}
                <div className={`stud-net ${net > 0 ? 'up' : net < 0 ? 'down' : ''}`}>{net > 0 ? `+${net}` : net} gears</div>
                {st.newBest && net > 0 && <div className="chip ok">BIGGEST WIN YET</div>}
                <Paytable highlight={st.folded ? undefined : st.result?.rank} />
                <div className="row wrap" style={{ justifyContent: 'center' }}>
                  <button className="btn primary big" onClick={() => { play('open'); dispatch({ type: 'STUD_START', selection: st.selection }); }}>Deal again</button>
                  <button className="btn" onClick={() => dispatch({ type: 'STUD_EXIT' })}>Back</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
