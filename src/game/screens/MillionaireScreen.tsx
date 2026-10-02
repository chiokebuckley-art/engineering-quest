import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store';
import { Icon, Panel } from '../components/ui';
import { Confetti, Callout } from '../components/Fx';
import { MathVisual } from '../components/MathVisual';
import { LADDER, SAFE, MILL_KINDS, correctIndex, askAdvice, fmtMoney, safeAmount } from '../../engine/state/millionaire';
import { OP_NAME } from '../../engine/questions/wordproblems';
import { labeled, LabelKey } from '../components/Labeled';
import type { WordKind } from '../../engine/questions/wordproblems';
import { CapsGate, CapsStrip, capGrade, kindOk, lessonOk } from './ArcadeScreen';
import { GRADES, type GradeId } from '../../engine/contest/grades';

const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Contest Path caps: the last rung (0-based) each grade climbs to. Rungs 1–3 are difficulty-1 one-step stories (within
 * 20), 4–6 difficulty 2, 7–12 grow to three-digit numbers and two-step stories, 13–15 are the hardest. Grade 1 stops
 * after the three difficulty-1 rungs ($300), Grade 3 after the early and mid rungs ($16,000), Grade 5 at the end of
 * the mid rungs ($125,000).
 */
export const MILL_TOP: Record<GradeId, number> = { g1: 2, g3: 8, g5: 11 };
/** Story kinds a grade may pick (the Arcade word-problem caps). */
export const millKindsFor = (grade: GradeId | null) => MILL_KINDS.filter((k) => kindOk(grade, 'word', k.id));
const millTop = (grade: GradeId | null) => (grade ? MILL_TOP[grade] : LADDER.length - 1);
const millNote = (grade: GradeId) => `${GRADES[grade].title}: ${grade === 'g1' ? 'adding and taking-away stories, ' : ''}rungs 1 to ${MILL_TOP[grade] + 1}, up to ${fmtMoney(LADDER[MILL_TOP[grade]])}.`;
/** Safe havens on a grade's ladder (Grade 1's three rungs have none). */
const safeOn = (grade: GradeId | null) => SAFE.filter((i) => i <= millTop(grade));
/**
 * Grade 1 meets only + and − stories, so setups with × or ÷ are left off its options (the right setup is never one).
 * 50:50 is not offered there: two options are already showing.
 */
export const millOptionShown = (grade: GradeId | null, option: string, isRight: boolean) => isRight || grade !== 'g1' || !/[×÷]/.test(option);
/**
 * The rung the header names. Banking at the top of a capped ladder sends MILL_NEXT first, so the run ends one rung
 * past the top: name the top rung, not the one that was never asked.
 */
export const millHeaderLevel = (grade: GradeId | null, level: number, ended: boolean) => (grade && ended ? Math.min(level, millTop(grade)) : level);

export function MillionaireScreen() {
  const { state } = useGame();
  if (state.millionaire) return <MillRun />;
  // Entry guard: a grade with no word-problem kinds does not get the game.
  if (!millKindsFor(capGrade(state.contest)).length) return <CapsGate title="Math Millionaire" reason="grade" />;
  return <MillMenu />;
}

function MillMenu() {
  const { state, dispatch, play } = useGame();
  const rec = state.stats.millionaire ?? { best: 0, games: 0, wins: 0, bestRung: 0 };
  const grade = capGrade(state.contest);
  const kinds = millKindsFor(grade);
  const [picked, setKind] = useState<WordKind>('mixed');
  const kind: WordKind = kinds.some((k) => k.id === picked) ? picked : kinds[0].id;
  return (
    <div className="screen-scroll mill-bg">
      <div className="container stack" style={{ maxWidth: 820 }}>
        <div className="row wrap">
          <h2 className="brass">Math Millionaire</h2>
          <span className="chip">Best {fmtMoney(rec.best)}</span>
          {rec.wins > 0 && <span className="chip ok">{rec.wins} × millionaire</span>}
          <span className="spacer" />
          <button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'library' })}>‹ Library</button>
        </div>
        <CapsStrip />
        <div className="mill-hero">
          <div className="mill-logo"><span>MATH</span><b>MILLIONAIRE</b></div>
          <p>{grade ? `Read the story. Pick the setup that solves it. ${MILL_TOP[grade] + 1} questions to the top of your ladder.` : 'Read the story. Pick the setup that solves it. Fifteen questions to the million.'}</p>
          {grade && <p className="small muted">{millNote(grade)}</p>}
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            {kinds.map((k) => <button key={k.id} className={`btn ${kind === k.id ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setKind(k.id); }}>{k.label}</button>)}
          </div>
          <button className="btn primary big mill-start" onClick={() => { play('boss-roar'); dispatch({ type: 'MILL_START', kind }); }}><Icon name="coins" /> {grade ? `Play for ${fmtMoney(LADDER[MILL_TOP[grade]])}` : 'Play for the million'}</button>
        </div>
        <div className="mill-rules">
          {grade !== 'g1' && <div><b>50:50</b><span>Removes two wrong setups.</span></div>}
          <div><b>Ask Ada</b><span>She points at the clue words and asks the right question.</span></div>
          <div><b>Swap</b><span>Trade the question for a new one on the same rung.</span></div>
          <div><b>Safe havens</b><span>{safeOn(grade).length ? `${safeOn(grade).map((i) => fmtMoney(LADDER[i])).join(' and ')} ${safeOn(grade).length > 1 ? 'are' : 'is'} yours to keep. Or walk away any time.` : 'Walk away any time and keep what you have won.'}</span></div>
        </div>
        {lessonOk(grade, 'l.word-detective') && <Panel title="Not sure how to spot the operation?" icon="scroll">
          <p className="small muted">Take the lesson <b>Word Problem Detective</b>: four questions that tell you whether to add, subtract, multiply or divide, and why.</p>
          <button className="btn small" onClick={() => { play('click'); dispatch({ type: 'START_LESSON', lessonId: 'l.word-detective' }); }}><Icon name="book" /> Start the lesson</button>
        </Panel>}
      </div>
    </div>
  );
}

function MillRun() {
  const { state, dispatch, play } = useGame();
  const m = state.millionaire!;
  const [shown, setShown] = useState(false);
  const [burst, setBurst] = useState(0);
  const [callout, setCallout] = useState<{ n: number; text: string }>({ n: 0, text: '' });
  const q = m.question; const w = q.word!;
  const ci = correctIndex(m);
  const ended = m.status === 'won' || m.status === 'lost' || m.status === 'walked';
  const grade = capGrade(state.contest);
  const top = millTop(grade);
  /** Capped: the grade's last rung is cleared, so bank it (the next rung is drawn but never shown). */
  const atTop = m.status === 'reveal' && m.level >= top;
  const ladderRef = useRef<HTMLElement>(null);
  // Phones show the ladder as a strip: keep the current rung in view.
  useEffect(() => { ladderRef.current?.querySelector('.rung.now')?.scrollIntoView({ inline: 'center', block: 'nearest' }); }, [m.level]);

  // Dramatic pause: lock the answer in, then reveal.
  useEffect(() => {
    if (m.picked === undefined) { setShown(false); return; }
    play('tick');
    const t = setTimeout(() => {
      setShown(true);
      if (m.status === 'lost') play('defeat');
      else if (m.status === 'won') { play('fanfare'); setBurst(Date.now()); }
      else { play(SAFE.includes(m.level) ? 'level-up' : 'correct'); setCallout({ n: Date.now(), text: fmtMoney(LADDER[m.level]) }); }
    }, 900);
    return () => clearTimeout(t);
  }, [m.picked, m.level, m.status, play]);

  const optClass = (i: number) => {
    const c = ['mill-opt'];
    if (m.removed.includes(i)) c.push('removed');
    if (m.picked === i && !shown) c.push('locked');
    if (shown && i === ci) c.push('right');
    if (shown && m.picked === i && i !== ci) c.push('wrong');
    return c.join(' ');
  };

  return (
    <div className="scene mill-bg">
      <Confetti trigger={burst} />
      <Callout text={callout.text} trigger={callout.n} />
      <div className="scene-header">
        <div className="loc"><h2>MILLIONAIRE · Q{millHeaderLevel(grade, m.level, ended) + 1} for {fmtMoney(LADDER[millHeaderLevel(grade, m.level, ended)])}</h2></div>
        <span className="spacer" />
        {m.status === 'asking' && m.level > 0 && <button className="btn small" onClick={() => { play('open'); dispatch({ type: 'MILL_WALK' }); }}>Walk away with {fmtMoney(LADDER[m.level - 1])}</button>}
        <button className="btn small ghost" onClick={() => dispatch({ type: 'MILL_EXIT' })}>{ended ? 'Back' : 'Quit'}</button>
      </div>
      <div className="scene-body">
        <div className="mill-layout">
          <div className="mill-main">
            {(m.status === 'walked' || (ended && shown)) ? <MillResult /> : (
              <>
                <div className="mill-q">
                  <div className="story">{q.prompt}</div>
                  <div className="ask">{q.expression}</div>
                  {m.askShown && <div className="advice"><Icon name="lantern" /> <span><b>Ada:</b> {askAdvice(q)}</span></div>}
                </div>
                <div className="mill-opts">
                  {m.options.map((o, i) => ({ o, i })).filter(({ o, i }) => millOptionShown(grade, o, i === ci)).map(({ o, i }, n) => (
                    <button key={i} className={optClass(i)} disabled={m.status !== 'asking' || m.removed.includes(i)} onClick={() => { play('click'); dispatch({ type: 'MILL_PICK', index: i }); }}>
                      <span className="letter">{LETTERS[n]}</span><span className="txt">{m.removed.includes(i) ? '' : o}</span>
                    </button>
                  ))}
                </div>
                {m.status === 'asking' && (
                  <div className="mill-lifelines">
                    {grade !== 'g1' && <button className="btn small" disabled={!m.lifelines.fifty} onClick={() => { play('open'); dispatch({ type: 'MILL_LIFELINE', kind: 'fifty' }); }}>50:50</button>}
                    <button className="btn small" disabled={!m.lifelines.ask} onClick={() => { play('open'); dispatch({ type: 'MILL_LIFELINE', kind: 'ask' }); }}><Icon name="lantern" /> Ask Ada</button>
                    <button className="btn small" disabled={!m.lifelines.swap} onClick={() => { play('open'); dispatch({ type: 'MILL_LIFELINE', kind: 'swap' }); }}><Icon name="repair" /> Swap</button>
                    <span className="spacer" />
                    {safeOn(grade).length > 0 && <span className="small muted">Safe: {fmtMoney(safeAmount(m.level))}</span>}
                  </div>
                )}
                {shown && m.status === 'reveal' && (
                  <div className="feedback correct mill-why">
                    <b>{w.structure} → {w.ops.map((o) => OP_NAME[o]).join(', then ')}.</b> {labeled(`${w.setup ?? w.layout} = ${w.result ?? `${q.answer} ${q.unit}`}`)}. {w.why}{w.setup && <LabelKey />}
                    {atTop
                      ? <div className="row wrap" style={{ marginTop: 8 }}><span className="small">Top of the {grade ? GRADES[grade].title : ''} ladder!</span><button className="btn primary" autoFocus onClick={() => { play('fanfare'); dispatch({ type: 'MILL_NEXT' }); dispatch({ type: 'MILL_WALK' }); }}>Bank {fmtMoney(LADDER[m.level])} ▸</button></div>
                      : <div className="row" style={{ marginTop: 8 }}><button className="btn primary" autoFocus onClick={() => { play('click'); dispatch({ type: 'MILL_NEXT' }); }}>Next question · {fmtMoney(LADDER[m.level + 1])} ▸</button></div>}
                  </div>
                )}
              </>
            )}
          </div>
          <aside className="mill-ladder" aria-label="Prize ladder" ref={ladderRef}>
            {LADDER.map((_, i) => i).filter((i) => i <= (grade && ended ? top : Math.max(top, m.level))).reverse().map((i) => (
              <div key={i} className={`rung ${i === m.level && !ended ? 'now' : ''} ${i < m.level || (ended && i < m.correct) ? 'won' : ''} ${SAFE.includes(i) ? 'safe' : ''}`}>
                <span className="n">{i + 1}</span><span className="v">{fmtMoney(LADDER[i])}</span>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}

function MillResult() {
  const { state, dispatch, play } = useGame();
  const m = state.millionaire!;
  const q = m.question; const w = q.word!;
  const grade = capGrade(state.contest);
  const topped = !!grade && m.status === 'walked' && m.level === MILL_TOP[grade] + 1 && m.correct === m.level;
  const title = m.status === 'won' ? 'MILLIONAIRE!' : topped ? 'TOP OF YOUR LADDER!' : m.status === 'walked' ? 'YOU WALKED AWAY' : 'WRONG SETUP';
  return (
    <div className="panel center stack mill-result">
      <h1 className="brass">{title}</h1>
      <div className="mill-money">{fmtMoney(m.winnings)}</div>
      {m.newBest && m.winnings > 0 && <div className="chip ok">NEW BEST!</div>}
      {m.status === 'lost' && (
        <div className="feedback wrong" style={{ textAlign: 'left' }}>
          <b>It was {labeled(`${w.setup ?? w.layout} = ${w.result ?? `${q.answer} ${q.unit}`}`)}.</b> {w.structure} → {w.ops.map((o) => OP_NAME[o]).join(', then ')}. {w.why}{w.setup && <LabelKey />}
          <MathVisual visual={q.visual} />
        </div>
      )}
      <div className="stat-grid">
        <div className="st"><b>{m.correct}</b><span>rungs cleared</span></div>
        <div className="st"><b>{m.results.filter((r) => !r.correct).length}</b><span>wrong</span></div>
        <div className="st"><b>{Object.values(m.lifelines).filter((x) => !x).length}</b><span>lifelines used</span></div>
      </div>
      <div className="row wrap" style={{ justifyContent: 'center' }}>
        <button className="btn primary big" onClick={() => { play('boss-roar'); dispatch({ type: 'MILL_START', kind: m.kind }); }}>Play again</button>
        <button className="btn" onClick={() => dispatch({ type: 'MILL_EXIT' })}>Back</button>
      </div>
    </div>
  );
}
