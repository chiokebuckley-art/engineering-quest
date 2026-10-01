import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../store';
import { createRng } from '../../engine/rng';
import { COUNT_LAB_ENABLED, RANKS, hiLo, runningCount, trueCount, halfCount, signed, makeShoe, total, newTable, dealTable, insureTable, moveTable, legalMoves, shoeFinished, baseline, unlockedDecks, calcQuestions, chicagoDay, dailySeed, examScore, spreadUnits, DEFAULT_RULES, type Card, type CountRecord, type LabResult, type ResultKind, type Rules, type Move } from '../../engine/countlab/engine';
import { STAGES, GLOSSARY, EV_QUESTIONS } from '../../engine/countlab/content';
import { labeled, hasLabels, LabelKey } from '../components/Labeled';
import '../../styles/countlab.css';
import { CapsGate, capsGateFor } from './ArcadeScreen';

type Finish = (r: LabResult) => void;
const id = () => `cl-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const actionNames: Record<Move, string> = { hit: 'Hit · take a card', stand: 'Stand · finish hand', double: 'Double · one last card', split: 'Split · two hands', surrender: 'Surrender · return half' };
const suitNames = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
function PlayingCard({ card, hidden = false }: { card?: Card; hidden?: boolean }) {
  if (hidden || !card) return <div className="cl-card cl-back" aria-label="Face-down card"><span>⚙</span></div>;
  return <div className={`cl-card ${['♥', '♦'].includes(card.suit) ? 'cl-red' : ''}`} aria-label={`${card.rank} of ${suitNames[card.suit]}`}><b>{card.rank}</b><span>{card.suit}</span><small>{card.rank}</small></div>;
}
function Legend() { return <div className="cl-legend"><span>▲ 2–6 <b>+1</b></span><span>● 7–9 <b>0</b></span><span>▼ 10–A <b>−1</b></span></div>; }
function NumberAnswer({ onAnswer, label = 'Your answer', disabled = false }: { onAnswer: (n: number) => void; label?: string; disabled?: boolean }) {
  const [input, setInput] = useState('');
  return <form className="cl-answer" onSubmit={e => { e.preventDefault(); if (input.trim() !== '' && Number.isFinite(Number(input))) { onAnswer(Number(input)); setInput(''); } }}>
    <label>{label}<input aria-label={label} type="text" inputMode="decimal" autoComplete="off" value={input} disabled={disabled} onChange={e => setInput(e.target.value)} placeholder="e.g. −2 or 1.5" /></label>
    <button className="btn primary" disabled={disabled || !input.trim() || !Number.isFinite(Number(input))}>Check answer</button>
    <div className="cl-keypad"><button type="button" disabled={disabled} onClick={() => setInput(s => s.startsWith('-') ? s.slice(1) : '-' + s)}>+/−</button><small>Use the sign button for negative answers.</small></div>
  </form>;
}
async function hashPin(pin: string, salt: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${pin}`));
  return Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');
}
function PinGate({ record, onPassed, setup = false }: { record: CountRecord; onPassed: (digest: string, salt: string) => void; setup?: boolean }) {
  const [pin, setPin] = useState(''), [confirm, setConfirm] = useState(''), [adult, setAdult] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  return <section className="cl-panel cl-gate"><div className="cl-seal">⚙</div><h2>{setup ? 'Grown-ups Math' : 'Parent PIN'}</h2>
    <p>{setup ? 'A parent or adult learner sets a PIN for this profile. Count Lab teaches arithmetic and probability using cards and pretend chips.' : 'Enter this profile’s PIN to open Count Lab.'}</p>
    <form className="stack" onSubmit={async e => { e.preventDefault(); setError(''); if (!/^\d{4,8}$/.test(pin) || (setup && (pin !== confirm || !adult))) { setError('Use 4–8 digits. Confirm the same PIN and the adult approval box.'); return; } setBusy(true); try { const salt = record.salt || Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2,'0')).join(''); const digest = await hashPin(pin, salt); if (!setup && digest !== record.pinHash) setError('That PIN did not match. Try again.'); else onPassed(digest, salt); } catch { setError('PIN protection needs a secure browser connection. Open the published HTTPS game.'); } finally { setBusy(false); } }}>
      <label>{setup ? 'Create PIN' : 'PIN'}<input aria-label="PIN" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={pin} onChange={e => setPin(e.target.value)} /></label>
      {setup && <><label>Confirm PIN<input aria-label="Confirm PIN" type="password" inputMode="numeric" autoComplete="off" maxLength={8} value={confirm} onChange={e => setConfirm(e.target.value)} /></label><label className="cl-check"><input type="checkbox" checked={adult} onChange={e => setAdult(e.target.checked)} /> I am the parent or adult learner and approve Count Lab for this profile.</label></>}
      <button className="btn primary" disabled={busy}>{busy ? 'Checking…' : setup ? 'Enable Grown-ups Math' : 'Unlock Count Lab'}</button>{error && <p role="alert">{error}</p>}
    </form><small>PIN protection applies to this saved profile. Keep your PIN: there is no in-app bypass or PIN recovery.</small>
  </section>;
}
function Tray({ decks, left, discard, showNumber = true }: { decks: number; left: number; discard?: number; showNumber?: boolean }) {
  return <div className="cl-tray"><div className="cl-tray-top"><b>{showNumber ? `${(left / 52).toFixed(2)} decks remaining` : 'Estimate the filled decks'}</b><span>{decks} deck shoe</span></div><div className="cl-meter" role="img" aria-label={showNumber ? `${left} cards undealt` : `Shoe meter with ${decks} deck segments; estimate the remaining amount visually`}>
    {Array.from({ length: decks }, (_, i) => <span key={i}><i style={{ width: `${Math.max(0, Math.min(1, left / 52 - i)) * 100}%` }} /></span>)}
  </div>{discard !== undefined && <div className="cl-discard"><span aria-hidden="true">▱ ▱ ▱</span> Discard tray · {discard} used cards</div>}</div>;
}
interface DrillProps { kind: ResultKind; seed: number; onFinish: Finish; record: CountRecord; duration?: number; length?: number; perCard?: boolean; exam?: boolean }
function Drill({ kind, seed, onFinish, record, duration = 0, length = 15, perCard = true, exam = false }: DrillProps) {
  const cards = useMemo(() => makeShoe(kind === 'flash' ? 9 : 1, seed), [seed, kind]);
  const calculators = useMemo(() => calcQuestions(seed), [seed]);
  const estimates = useMemo(() => { const rng = createRng(seed); return Array.from({ length: 5 }, () => { const decks = rng.int(1, Math.min(2, record.maxDecks)); return { decks, left: rng.int(1, decks * 2) * 26 }; }); }, [seed, record.maxDecks]);
  const [index, setIndex] = useState(0), [correct, setCorrect] = useState(0), [attempts, setAttempts] = useState(0), [streak, setStreak] = useState(0), [best, setBest] = useState(0), [feedback, setFeedback] = useState<string | null>(null), [done, setDone] = useState(false), [remaining, setRemaining] = useState(duration), [help, setHelp] = useState(false);
  const started = useRef(Date.now()), shown = useRef(Date.now()), reaction = useRef(0), assisted = useRef(false), finished = useRef(false);
  const flash = kind === 'warmup' || kind === 'flash';
  const count = kind === 'warmup' ? 10 : kind === 'flash' ? exam ? 10 : duration ? cards.length : 20 : kind === 'running' ? length : kind === 'estimate' ? 5 : kind === 'true' ? 9 : 4;
  const end = () => { if (finished.current) return; finished.current = true; setDone(true); };
  useEffect(() => {
    if (!duration || done) return;
    const timer = window.setInterval(() => { const rem = Math.max(0, duration - Math.floor((Date.now() - started.current) / 1000)); setRemaining(rem); if (!rem) end(); }, 200);
    return () => clearInterval(timer);
  }, [duration, done]);
  const expected = flash ? hiLo(cards[index]) : kind === 'running' ? runningCount(cards.slice(0, index + 1)) : kind === 'true' ? calculators[index].answer : kind === 'estimate' ? estimates[index].left / 52 : EV_QUESTIONS[index].answer;
  const answer = (n: number) => {
    if (feedback !== null || done || (duration > 0 && Date.now() - started.current >= duration * 1000)) return;
    const right = Math.abs(n - expected) <= (kind === 'estimate' ? 0.5 : kind === 'true' ? 0.05 : 0.001);
    reaction.current += Date.now() - shown.current;
    const c = correct + (right && !assisted.current ? 1 : 0), a = attempts + 1, s = right && !assisted.current ? streak + 1 : 0;
    setCorrect(c); setAttempts(a); setStreak(s); setBest(Math.max(best, s));
    let explanation = flash ? `${cards[index].rank} is ${expected === 1 ? 'low: add 1' : expected === 0 ? 'middle: add 0' : 'high: subtract 1'}.` : kind === 'running' ? `Running count: ${signed(expected)}. ${perCard ? `${signed(runningCount(cards.slice(0, index)))} (previous count) ${hiLo(cards[index]) < 0 ? '− 1' : hiLo(cards[index]) > 0 ? '+ 1' : '+ 0'} (count value) = ${signed(expected)} (running count).` : `Count values card by card: ${cards.slice(0, index + 1).map(c => `${c.rank} → ${signed(hiLo(c))}`).join(', ')}. Their sum is the running count.`}` : kind === 'true' ? `${signed(calculators[index].running)} (running count) ÷ ${calculators[index].left / 52} (decks remaining) = ${Number(expected.toFixed(3))} (true count).` : kind === 'estimate' ? `${estimates[index].left} (cards remaining) ÷ 52 (cards per deck) = ${expected} (decks remaining).` : EV_QUESTIONS[index].explanation;
    setFeedback(exam ? 'Answer recorded. Continue to the next item.' : `${assisted.current ? 'Assisted practice — not scored for mastery. ' : right ? 'Correct. ' : 'Let’s check it. '}${explanation}`);
    assisted.current = false; setHelp(false);
  };
  const next = () => { if (index + 1 >= count) end(); else { setIndex(index + 1); setFeedback(null); shown.current = Date.now(); } };
  if (done) return <section className="cl-panel cl-result"><div className="cl-seal">{correct === attempts && attempts > 0 ? '✓' : '⚙'}</div><h2>{exam ? 'Block complete' : 'Practice report'}</h2><p className="cl-score">{attempts ? Math.round(correct / attempts * 100) : 0}%</p><p>{correct} correct / {attempts} checked{flash ? ` · best streak ${best}` : ''}</p>{flash && <p>Average response: {attempts ? Math.round(reaction.current / attempts) : 0} ms</p>}<p>{exam ? 'Your block score contributes one quarter of the final exam.' : 'Unlocks use clean, independent rounds. You can repeat this skill anytime.'}</p><button className="btn primary" onClick={() => onFinish({ id: id(), kind, correct, attempts, length: count, perCard, streak: best, meanReactionMs: flash && attempts ? Math.round(reaction.current / attempts) : undefined })}>{exam ? 'Next exam block' : 'Save report & return'}</button></section>;
  const e = estimates[index], q = calculators[index];
  return <section className="cl-panel cl-drill"><div className="cl-tray-top"><span>{kind === 'running' ? `Card ${index + 1} / ${count}` : `Question ${index + 1}${duration ? '' : ` / ${count}`}`}</span><b>{duration ? `${remaining}s` : 'Untimed'}</b></div>
    <h2>{flash ? 'What is this card’s Hi-Lo value?' : kind === 'running' ? 'Keep the running count' : kind === 'true' ? 'Calculate the true count' : kind === 'estimate' ? 'How many decks remain?' : 'Expected-value experiment'}</h2>
    {(flash || kind === 'running') && <div className="cl-cards"><PlayingCard card={cards[index]} /></div>}
    {kind === 'running' && <p>{index === 0 ? 'Start at zero. Count this card.' : 'Add this card’s value to your previous total.'}{!perCard && ' Keep the total in your head; submit after the final card.'}</p>}
    {kind === 'true' && <><div className="cl-gauges"><div>Starting shoe<b>{q.decks} decks</b></div><div>Running count<b>{signed(q.running)}</b></div><div>Decks remaining<b>{q.left / 52}</b></div></div><p>True count = running count ÷ decks remaining. Give a decimal within 0.05 of the exact answer.</p></>}
    {kind === 'estimate' && <><Tray decks={e.decks} left={e.left} showNumber={false} /><p>Each segment is one deck. Give your estimate in decks.</p><details><summary>Text alternative for the visual estimate</summary><p>{e.left} cards remain. Divide by 52. Opening this alternative is allowed.</p></details></>}
    {kind === 'ev' && <p className="cl-question">{EV_QUESTIONS[index].prompt}</p>}
    {feedback !== null ? <div className="cl-feedback" role="status"><p>{labeled(feedback)}</p>{hasLabels(feedback) && <LabelKey />}<button className="btn primary" onClick={next}>{index + 1 >= count ? 'See report' : 'Next card / question'}</button></div> : flash ? <div className="cl-values">{[1, 0, -1].map(n => <button key={n} onClick={() => answer(n)}>{n > 0 ? '▲' : n === 0 ? '●' : '▼'}<b>{signed(n)}</b><small>{n > 0 ? 'Low' : n === 0 ? 'Middle' : 'High'}</small></button>)}</div> : kind === 'running' && !perCard && index + 1 < count ? <button className="btn primary" onClick={() => { setIndex(index + 1); shown.current = Date.now(); }}>Next visible card</button> : <NumberAnswer key={index} onAnswer={answer} label={kind === 'running' ? 'Running count' : kind === 'estimate' ? 'Decks remaining' : 'Your answer'} />}
    {!exam && (flash || kind === 'running') && feedback === null && <><button className="btn ghost small" onClick={() => { assisted.current = true; setHelp(!help); }}>Open Hi-Lo help (assisted)</button>{help && <Legend />}</>}
  </section>;
}

function Strategy() {
  const columns = ['2','3','4','5','6','7','8','9','10','A'];
  const fake = (r: string): Card => ({ rank: r as Card['rank'], suit: '♠', id: r });
  const hard = Array.from({ length: 14 }, (_, i) => i + 5).map(v => ({ label: `Hard ${v}`, cards: v <= 11 ? [fake('2'), fake(String(v - 2))] : [fake('10'), fake(String(v - 10))] }));
  const soft = Array.from({ length: 8 }, (_, i) => ({ label: `A + ${i + 2}`, cards: [fake('A'), fake(String(i + 2))] }));
  const pairs = RANKS.filter(r => !['J','Q','K'].includes(r)).map(r => ({ label: `${r} + ${r}`, cards: [fake(r), fake(r)] }));
  return <details className="cl-panel"><summary>Basic-strategy reference chart</summary><p>4–8 deck baseline · dealer stands on soft 17 · double after split · late surrender · US peek. Approximate for 1–3 and 9 decks. No count adjustments. The table never plays for you.</p><p>H = hit, S = stand, D = double (otherwise hit; soft 18 otherwise stand), P = split, R = surrender (otherwise hit). If splitting is unavailable, use your hand’s hard/soft row. Split Aces receive one card only.</p><div className="cl-chart-scroll"><table><thead><tr><th>Your hand ↓ / Dealer →</th>{columns.map(d => <th key={d}>{d}</th>)}</tr></thead><tbody>{[...hard,...soft,...pairs].map((row,i) => <tr key={i}><th>{row.label}</th>{columns.map(d => { const b = baseline(row.cards, fake(d), row.label.startsWith('Hard') || row.label.startsWith('A +') && row.label !== 'A + A' ? ['hit','stand','double','surrender'] : undefined); return <td key={d}>{({ hit:'H', stand:'S', double:'D', split:'P', surrender:'R' })[b]}</td>; })}</tr>)}</tbody></table></div><p>Hard 19–21 always stand. With H17, the multi-deck baseline additionally doubles 11 vs A, soft 18 vs 2 and soft 19 vs 6; surrenders hard 15, 17 and paired 8s vs A. Post-hand comparisons use the active H17/DAS settings.</p></details>;
}

function TableGame({ seed, rules, hud, record, onFinish, targetHands = 0, exam = false, kind = 'open' }: { seed: number; rules: Rules; hud: 'always' | 'after' | 'never'; record: CountRecord; onFinish: Finish; targetHands?: number; exam?: boolean; kind?: 'open' | 'hidden' }) {
  const [t, setT] = useState(() => newTable(rules, seed));
  const tableRef = useRef<HTMLElement>(null);
  useEffect(() => { if (t.pos) tableRef.current?.scrollIntoView({ block: 'start' }); }, [t.pos, t.phase]);
  const [bet, setBet] = useState(1), [checks, setChecks] = useState<{ round: number; correct: boolean; actual: number; given: number }[]>([]), [report, setReport] = useState(false), [reportChecked, setReportChecked] = useState(false), [finishEarly, setFinishEarly] = useState(false);
  const rc = runningCount(t.seen), left = t.shoe.length - t.pos, tc = trueCount(rc, left), lastCheck = checks.find(c => c.round === t.rounds);
  const checkpoint = t.phase === 'resolved' && targetHands > 0 && !lastCheck;
  const finished = t.phase === 'resolved' && (shoeFinished(t) || (targetHands > 0 && t.rounds >= targetHands) || finishEarly);
  const showCounts = !exam && !checkpoint && !report && (hud === 'always' || (hud === 'after' && t.phase === 'resolved'));
  const feedbackAllowed = !exam && hud !== 'never';
  const counts = <div className="cl-gauges" data-testid="count-hud"><div>Running count<b>{signed(rc)}</b></div><div>True count<b>{signed(halfCount(tc))}</b><small>Nearest half</small></div></div>;
  const submitCheck = (given: number) => setChecks([...checks, { round: t.rounds, correct: given === rc, actual: rc, given }]);
  const endShoe = () => { setReport(true); setReportChecked(targetHands > 0); };
  if (report) return <section className="cl-panel cl-result"><h2>{exam ? 'Table block complete' : 'Shoe report'}</h2><p>{t.rounds} hands · {t.pos} cards dealt · {signed(t.chips - t.startChips)} practice chips</p>
    {!reportChecked ? <><p>Before revealing the count, enter your final running total.</p><NumberAnswer label="Final running count" onAnswer={n => { submitCheck(n); setReportChecked(true); }} /></> : <><p className="cl-score">{checks.length ? Math.round(100 * checks.filter(c => c.correct).length / checks.length) : 0}%</p><p>{checks.filter(c => c.correct).length} / {checks.length} correct count checks. Chips do not affect your grade.</p><details><summary>Review submitted counts</summary><ul>{checks.map(c => <li key={c.round}>Hand {c.round}: you entered {signed(c.given)}; count was {signed(c.actual)}. {c.correct ? '✓' : 'Try a running-count track for more practice.'}</li>)}</ul></details><button className="btn primary" onClick={() => onFinish({ id: id(), kind, correct: checks.filter(c => c.correct).length, attempts: checks.length })}>{exam ? 'Finish exam' : 'Save report & return'}</button></>}
  </section>;
  return <div className="stack"><section className="cl-table" ref={tableRef}>
    <div className="cl-tray-top"><div><b>Observation table</b><small>{rules.decks} decks · {rules.h17 ? 'H17' : 'S17'} · {Math.round(rules.penetration * 100)}% cut</small></div><div className="cl-chip">⚙ {t.chips}<small>practice chips</small></div></div>
    <div className="cl-dealer"><span className="cl-seat">⚙ House researcher</span><div className="cl-cards">{t.dealer.length ? t.dealer.map((c, i) => <PlayingCard key={i} card={i === 1 && !t.revealed ? undefined : c} hidden={i === 1 && !t.revealed} />) : <><PlayingCard hidden /><PlayingCard hidden /></>}</div><p>{t.dealer.length > 0 && (t.revealed ? `Dealer total: ${total(t.dealer).value}` : 'One card remains hidden — do not count it.')}</p></div>
    <div className="cl-table-mark" aria-hidden="true">COUNT LAB <span>PROBABILITY RESEARCH STATION</span></div>
    <div className="cl-hands">{t.hands.length ? t.hands.map((h, i) => <div key={i} className={`cl-hand ${t.phase === 'player' && i === t.active ? 'active' : ''}`}><span className="cl-seat">You {t.hands.length > 1 ? `· Hand ${i + 1}` : ''} · {h.bet} units</span><div className="cl-cards">{h.cards.map(c => <PlayingCard key={c.id} card={c} />)}</div><b>{total(h.cards).soft ? 'Soft' : 'Hard'} {total(h.cards).value}</b>{h.result && <p className="cl-outcome">{h.result}</p>}</div>) : <div className="cl-empty">Your observation seat<br /><small>Select practice units, then deal.</small></div>}</div>
    {showCounts ? counts : <div className="cl-hidden-count">Count display hidden{checkpoint ? ' · submit your total below' : ''}</div>}
    <Tray decks={rules.decks} left={left} discard={t.phase === 'resolved' ? t.pos : Math.max(0, t.pos - t.dealer.length - t.hands.reduce((s,h) => s + h.cards.length, 0))} />
  </section>
  <section className="cl-panel cl-controls"><div className="cl-steps"><span className={['ready','resolved'].includes(t.phase) ? 'active' : ''}>1 · Choose & deal</span><span className={['player','insurance'].includes(t.phase) ? 'active' : ''}>2 · Decide</span><span className={checkpoint ? 'active' : ''}>3 · Check count</span></div>
    {t.phase === 'insurance' && <><h3>Dealer Ace · insurance experiment</h3><p>Risk {t.hands[0].bet / 2} more practice units. If the hidden card is worth ten, insurance earns twice its stake; otherwise that stake is lost. The baseline declines insurance.</p><div className="row wrap"><button className="btn" onClick={() => setT(insureTable(t, false))}>Decline insurance</button><button className="btn" disabled={t.chips < t.hands[0].bet / 2} onClick={() => setT(insureTable(t, true))}>Take practice insurance</button></div></>}
    {t.phase === 'player' && <><h3>Choose for hand {t.active + 1}</h3><div className="cl-actions">{(['hit','stand','double','split','surrender'] as Move[]).map(m => <button className="btn" disabled={!legalMoves(t).includes(m)} key={m} onClick={() => setT(moveTable(t, m))}>{actionNames[m]}</button>)}</div><p className="small">Double and split need another matching stake. A split Ace gets one card. Surrender is only for an unsplit first decision.</p></>}
    {checkpoint && <><h3>What is the running count now?</h3><p>Count all newly visible cards. Keep the total from earlier hands.</p><NumberAnswer key={t.rounds} label="Running count after this hand" onAnswer={submitCheck} /></>}
    {lastCheck && !checkpoint && <p role="status">{feedbackAllowed ? `${lastCheck.correct ? 'Correct' : 'Count corrected'}: ${signed(lastCheck.actual)}. Carry this total into the next hand.` : 'Count submitted. Your results appear at the end.'}</p>}
    {(t.phase === 'ready' || t.phase === 'resolved' && !checkpoint) && (finished ? <button className="btn primary" onClick={endShoe}>View shoe report</button> : <><label>Practice units<select aria-label="Practice units" value={bet} onChange={e => setBet(Number(e.target.value))}>{[1,2,4,6].map(n => <option key={n} value={n}>{n} unit{n > 1 ? 's' : ''}</option>)}</select></label><button className="btn primary" disabled={bet > t.chips} onClick={() => setT(dealTable(t, bet))}>{t.phase === 'ready' ? 'Deal first hand' : 'Deal next hand'}</button>{targetHands === 0 && t.rounds > 0 && <button className="btn ghost" onClick={() => { setFinishEarly(true); endShoe(); }}>End observation & check count</button>}</>)}
    {targetHands > 0 && <p>Hands observed: {t.rounds} / {targetHands}. Your grade measures the count, not wins.</p>}
    {record.coach && !exam && hud === 'always' && t.phase === 'ready' && <p>Optional classroom spread: true count {signed(halfCount(tc))} → {spreadUnits(tc)} practice units. This is a sizing experiment, not a profit prediction.</p>}
  </section>
  {!exam && t.phase === 'resolved' && !checkpoint && <details className="cl-panel"><summary>Review this hand’s decisions</summary><ul>{t.notes.map((n,i) => <li key={i}>{n}</li>)}</ul><p>These are multi-deck reference comparisons, not a grade. Small shoes can have different optimal plays.</p></details>}
  {!exam && <Strategy />}
  </div>;
}

function Exam({ record, onFinish }: { record: CountRecord; onFinish: Finish }) {
  const [day] = useState(chicagoDay), [block, setBlock] = useState(0), [scores, setScores] = useState<number[]>([]);
  const seed = dailySeed(day);
  const blockFinish: Finish = r => { setScores([...scores, r.attempts ? r.correct / r.attempts : 0]); setBlock(block + 1); };
  if (block === 4) { const score = examScore(scores[0],scores[1],scores[2],scores[3]); return <section className="cl-panel cl-result"><div className="cl-seal">{score >= 85 ? '★' : '⚙'}</div><h2>{score >= 85 ? 'Station Analyst certified' : 'Your next experiment awaits'}</h2><p className="cl-score">{score}%</p><p>Each block is worth 25%.</p><ul>{['Card values','Running count','True-count division','Table count checks'].map((n,i) => <li key={n}>{n}: {Math.round(scores[i] * 100)}%</li>)}</ul><p>{score >= 85 ? 'Badge earned. Keep practicing for consistent accuracy.' : '85% earns the badge. Use the practice modes to strengthen your lowest block.'}</p><button className="btn primary" onClick={() => onFinish({ id: id(), kind: 'exam', correct: score, attempts: 100, day, examScore: score })}>Save daily result</button></section>; }
  return <div className="stack"><div className="cl-panel"><h2>Daily exam · block {block + 1} / 4</h2><p>{day} · America/Chicago · no timer · answers reviewed after submission.</p></div>{block === 0 ? <Drill key="flash" kind="flash" seed={seed} record={record} exam onFinish={blockFinish} /> : block === 1 ? <Drill key="running" kind="running" seed={seed + 1} record={record} exam length={15} perCard={false} onFinish={blockFinish} /> : block === 2 ? <Drill key="true" kind="true" seed={seed + 2} record={record} exam onFinish={blockFinish} /> : <TableGame seed={seed + 3} rules={{ ...DEFAULT_RULES, decks: 9 }} hud="never" record={record} exam targetHands={3} onFinish={blockFinish} kind="hidden" />}</div>;
}

function ParentControls({ record, onClose }: { record: CountRecord; onClose: () => void }) {
  const { dispatch } = useGame(); const [verified, setVerified] = useState(false), [max, setMax] = useState(record.maxDecks), [timers, setTimers] = useState(record.timers), [coach, setCoach] = useState(record.coach);
  if (!verified) return <PinGate record={record} onPassed={() => setVerified(true)} />;
  return <section className="cl-panel"><h2>Parent controls</h2><label>Maximum shoe size<select aria-label="Maximum shoe size" value={max} onChange={e => setMax(Number(e.target.value))}>{Array.from({length:9},(_,i) => <option key={i} value={i + 1}>{i + 1} decks</option>)}</select></label><label className="cl-check"><input type="checkbox" checked={timers} onChange={e => setTimers(e.target.checked)} /> Allow timed flash drills</label><label className="cl-check"><input type="checkbox" checked={coach} onChange={e => setCoach(e.target.checked)} /> Show classroom unit-spread reference</label><p>Deck limits restrict table shoes. Division lessons still include numerical examples from 1–9 decks. The nine-deck exam requires a nine-deck limit.</p><button className="btn primary" onClick={() => { dispatch({type:'COUNT_CONTROLS',maxDecks:max,timers,coach}); onClose(); }}>Save controls</button></section>;
}
export function CountLabScreen() {
  const { state } = useGame();
  // Contest Path caps: not listed for Grades 1 and 3 (everyone else still meets the parent PIN gate).
  const gate = capsGateFor(state, { notFor: ['g1', 'g3'] });
  return gate ? <CapsGate title="Count Lab" reason={gate} /> : <CountLabMain />;
}

function CountLabMain() {
  const { state, dispatch, profiles } = useGame();
  const record = state.countLab;
  const [tab, setTab] = useState(state.screenParams.view === 'quest' ? 'quest' : 'hub'), [lesson, setLesson] = useState<number | null>(null), [run, setRun] = useState<{ kind: ResultKind; seed: number; quest: boolean } | null>(null), [notice, setNotice] = useState(''), [leaving, setLeaving] = useState(false);
  const [duration, setDuration] = useState(0), [length, setLength] = useState(15), [perCard, setPerCard] = useState(true), [rules, setRules] = useState<Rules>({...DEFAULT_RULES}), [hud, setHud] = useState<'always'|'after'|'never'>('always');
  const profile = useRef(profiles.active);
  useEffect(() => { if (profile.current !== profiles.active) { setRun(null); setLesson(null); profile.current = profiles.active; } }, [profiles.active]);
  useEffect(() => { document.querySelector('.cl-screen')?.scrollTo(0, 0); }, [run?.seed, tab, lesson]);
  const maxDecks = unlockedDecks(record);
  const start = (kind: ResultKind, quest = false) => { setRun({ kind, quest, seed: Math.floor(Math.random() * 2 ** 31) }); setLesson(null); setNotice(''); };
  const finish: Finish = result => { const old = record.stage; dispatch({type:'COUNT_RESULT', result}); setRun(null); setNotice(result.kind === 'exam' ? 'Daily result saved.' : `Report saved. ${old < 8 ? 'Check your path for the next step.' : 'Keep experimenting.'}`); };
  const exit = () => { dispatch({type:'COUNT_LOCK'}); dispatch({type:'NAVIGATE',screen:'arcade'}); };
  const safeRules = { ...rules, decks: Math.min(maxDecks, rules.decks) };
  const menuButton = (name: string, kind: ResultKind, stage: number, description: string) => <button className="cl-mode" disabled={record.stage < stage || (kind === 'exam' && record.maxDecks < 9)} onClick={() => start(kind)}><span className="cl-mode-icon">{kind === 'exam' ? '★' : kind === 'open' ? '♠' : '⚙'}</span><b>{name}</b><p>{description}</p><small>{record.stage < stage ? `Unlock at stage ${stage}` : kind === 'exam' && record.maxDecks < 9 ? 'Parent deck limit must allow 9' : 'Open →'}</small></button>;
  return <div className="screen-scroll cl-screen"><div className="cl-container"><header className="cl-header"><div><small>PROBABILITY RESEARCH STATION</small><h1>⚙ Count Lab</h1></div><button className="btn small" onClick={() => run ? setLeaving(true) : exit()}>← Arcade</button></header><p className="cl-ethics">Practice chips only. This is a probability lab — not real gambling. We study expected value and arithmetic.</p>
    {!COUNT_LAB_ENABLED ? <p>Count Lab is not enabled in this build.</p> : !state.countUnlocked ? <PinGate record={record} setup={!record.pinHash} onPassed={(digest,salt) => dispatch({type:'COUNT_AUTH',digest,salt})} /> : <>
      {leaving && <section className="cl-panel" role="alertdialog" aria-label="Leave Count Lab"><p>Leave this unfinished session? Completed reports are saved; this session will not count.</p><button className="btn" onClick={exit}>Leave session</button><button className="btn" onClick={() => setLeaving(false)}>Keep playing</button></section>}
      {run ? <><button className="btn ghost small" onClick={() => { if (leaving) {setRun(null);setLeaving(false);} else setLeaving(true); }}>{leaving ? 'Discard session & return to lab' : 'Return to lab…'}</button>{run.kind === 'exam' ? <Exam record={record} onFinish={finish} /> : run.kind === 'open' || run.kind === 'hidden' ? <TableGame key={run.seed} seed={run.seed} record={record} rules={run.quest ? {...DEFAULT_RULES, decks: run.kind === 'hidden' ? Math.min(6,maxDecks) : Math.min(2,maxDecks)} : safeRules} hud={run.quest ? run.kind === 'open' ? 'always' : 'never' : hud} kind={run.kind} targetHands={run.quest ? 3 : 0} onFinish={finish} /> : <Drill key={run.seed} kind={run.kind} seed={run.seed} record={record} onFinish={finish} duration={run.kind === 'flash' && record.timers ? duration : 0} length={run.quest ? 15 : length} perCard={run.quest ? true : perCard} />}</> : <>
      <nav className="cl-tabs" aria-label="Count Lab sections">{[['hub','Lab hub'],['quest','Learning path'],['arcade','Practice gym'],['glossary','Glossary'],['controls','Parent controls']].map(([key,label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => {setTab(key);setLesson(null);setNotice('');}}>{label}</button>)}</nav>
      {notice && <p role="status" className="cl-notice">{notice}</p>}
      {tab === 'controls' ? <ParentControls record={record} onClose={() => setTab('hub')} /> : tab === 'glossary' ? <section className="cl-panel"><h2>Lab dictionary</h2>{Object.entries(GLOSSARY).map(([term,definition]) => <details key={term}><summary>{term}</summary><p>{definition}</p></details>)}</section> : tab === 'quest' || lesson !== null ? <>
        <section className="cl-panel"><h2>Your Station Analyst path</h2><p>Start with card values and build one skill at a time. Current stage: {record.stage}. {record.badge ? '★ Station Analyst badge earned.' : ''}</p><progress max={9} value={record.badge ? 9 : record.stage} /><p>Clean running tracks: {record.cleanTracks} / 3 · Practice reports: {record.sessions}</p></section>
        {lesson !== null ? <section className="cl-panel"><small>{STAGES[lesson].subtitle}</small><h2>{STAGES[lesson].name}</h2>{STAGES[lesson].lesson.map((p,i) => <p key={i}>{labeled(p)}</p>)}{STAGES[lesson].lesson.some(hasLabels) && <LabelKey />}{lesson <= 1 && <Legend />}{lesson === 5 && <Strategy />}<p><b>Your mission:</b> {STAGES[lesson].goal}</p><button className="btn primary" disabled={lesson === 8 && record.maxDecks < 9} onClick={() => start(STAGES[lesson].kind,true)}>{lesson === 8 ? 'Start daily exam' : 'Start this mission'}</button><button className="btn ghost" onClick={() => setLesson(null)}>Back to path</button></section> : <div className="cl-path">{STAGES.map((stage,i) => <button key={i} className={`cl-stage ${record.stage === i ? 'current' : ''}`} disabled={i > record.stage} onClick={() => setLesson(i)}><span>{i < record.stage ? '✓' : i}</span><div><small>{stage.subtitle}</small><b>{stage.name}</b><p>{stage.goal}</p></div><span>{i > record.stage ? '🔒' : '→'}</span></button>)}</div>}
      </> : <>
        {tab === 'hub' && <section className="cl-welcome"><div className="cl-seal">⚛</div><div><small>OBSERVE · COUNT · EXPLAIN</small><h2>Learn the math beneath the cards.</h2><p>Add and subtract. Estimate decks. Divide to find a true count. Then test your thinking at the observation table.</p><button className="btn primary" onClick={() => {setTab('quest');setLesson(record.stage);}}>Continue stage {record.stage} →</button>{record.badge && <p>★ Station Analyst certified</p>}</div></section>}
        <section className="cl-panel"><h2>Practice setup</h2><div className="cl-settings"><label>Flash round<select aria-label="Flash round" value={record.timers ? duration : 0} disabled={!record.timers} onChange={e => setDuration(Number(e.target.value))}><option value={0}>Untimed · 20 cards</option>{[30,60,90].map(n => <option key={n} value={n}>{n} seconds</option>)}</select></label><label>Running track<select aria-label="Running track" value={length} onChange={e => setLength(Number(e.target.value))}>{[10,15,20,30].map(n => <option key={n} value={n}>{n} cards</option>)}</select></label><label>Check running count<select aria-label="Check running count" value={perCard ? 'card' : 'end'} onChange={e => setPerCard(e.target.value === 'card')}><option value="card">After each card</option><option value="end">At end of track</option></select></label></div></section>
        <div className="cl-modes">{menuButton('Card warm-up','warmup',0,'Learn the three Hi-Lo groups. Accuracy first.')}{menuButton('Flash drills','flash',1,'Build accurate, quick recognition.')}{menuButton('Running tracks','running',2,'Keep a total across a stream of cards.')}{menuButton('Deck estimation','estimate',3,'Read the shoe meter in whole and half decks.')}{menuButton('True-count calculator','true',4,'Divide the running count by decks left.')}{menuButton('EV experiments','ev',5,'Calculate weighted averages and compare outcomes.')}{menuButton('Observation table','open',6,'Play a full shoe against the house researcher.')}{menuButton('Station Analyst exam','exam',8,'Four blocks. One daily seed. Pass at 85%.')}</div>
        <details className="cl-panel"><summary>Observation table settings · {maxDecks} deck{maxDecks === 1 ? '' : 's'} unlocked</summary><div className="cl-settings"><label>Shoe size<select aria-label="Shoe size" value={safeRules.decks} onChange={e => setRules({...rules,decks:Number(e.target.value)})}>{Array.from({length:9},(_,i) => <option key={i} disabled={i + 1 > maxDecks} value={i + 1}>{i + 1} decks{i + 1 > maxDecks ? ' · locked' : ''}</option>)}</select></label><label>Count display<select aria-label="Count display" value={record.stage < 7 ? 'always' : hud} onChange={e => setHud(e.target.value as typeof hud)}><option value="always">Always show</option><option disabled={record.stage < 7} value="after">After hand only</option><option disabled={record.stage < 7} value="never">Never · check at shoe end</option></select></label><label>Shuffle point<select aria-label="Shuffle point" value={rules.penetration} onChange={e => setRules({...rules,penetration:Number(e.target.value)})}>{[.5,.65,.75,.85].map(n => <option key={n} value={n}>{n * 100}% dealt</option>)}</select></label><label>Dealer soft 17<select aria-label="Dealer soft 17" value={rules.h17 ? 'hit' : 'stand'} onChange={e => setRules({...rules,h17:e.target.value === 'hit'})}><option value="stand">Stand (S17)</option><option value="hit">Hit (H17)</option></select></label></div><label className="cl-check"><input type="checkbox" checked={rules.das} onChange={e => setRules({...rules,das:e.target.checked})} /> Double after split (DAS)</label><label className="cl-check"><input type="checkbox" checked={rules.rsa} onChange={e => setRules({...rules,rsa:e.target.checked})} /> Re-split Aces, up to four hands (RSA)</label><label className="cl-check"><input type="checkbox" checked={rules.surrender} onChange={e => setRules({...rules,surrender:e.target.checked})} /> Late surrender</label><p>Blackjack pays 3:2. Dealer peeks with Ace/ten upcard. Ordinary pairs split once into two hands. The cut card ends the shoe after the current hand. If an unusually long hand exhausts the cards, that round is void and all its stakes return.</p></details>
        {record.coach && <section className="cl-panel"><h3>Classroom unit-spread experiment</h3><p>True count below +1 → 1 unit; +1 to below +3 → 2; +3 to below +5 → 4; +5 or more → 6. The cap is 6 units. This is a heuristic, not a Kelly formula or real-money advice.</p></section>}
      </>}
      {record.reports.length > 0 && <details className="cl-panel"><summary>Recent practice reports · {record.sessions} total</summary><ul>{record.reports.slice().reverse().map(r => <li key={r.id}>{r.kind}: {r.correct}/{r.attempts} correct{r.meanReactionMs !== undefined ? ` · ${r.meanReactionMs} ms average` : ''}{r.kind === 'exam' ? ` · ${r.day}` : ''}</li>)}</ul></details>}
      </>}
    </>}
  </div></div>;
}
