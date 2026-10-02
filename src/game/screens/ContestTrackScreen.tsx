import { Fragment, useEffect, useState } from 'react';
import { useGame } from '../store';
import { Icon, Panel } from '../components/ui';
import { MathChallenge } from '../components/MathChallenge';
import { MathVisual } from '../components/MathVisual';
import { labeled, hasLabels, LabelKey } from '../components/Labeled';
import { Confetti } from '../components/Fx';
import { NPCS } from '../../content/npcs';
import { asset } from '../../assets';
import { GRADES, CONTEST_DISCLAIMER } from '../../engine/contest/grades';
import type { GradeId } from '../../engine/contest/common';
import type { ContestRun } from '../../engine/contest/state';
import type { Question } from '../../engine/types';
import { themeForDay, weekSummary, parentView, contestSkillLabel, type WeekSummary } from '../../engine/contest/plan';
import { SESSION_SHAPE, REST_SHAPE, PREVIEW_ITEMS, LOGIC_QUEST_URL, nextGrade, canSkip, currentItem, runSummary, runWaiting, speakable } from '../../engine/contest/track';
import { speak, canSpeak, stopSpeaking } from '../speech';
import { mockBars, MOCK_SIZE, type MockBar } from '../../engine/contest/mock';
import { activeEntries, ERROR_LABELS } from '../../engine/notebook/notebook';
import { DEFAULT_PLAZA, PLAZA_GOALS } from '../../engine/state/plaza';
import './ContestTrackScreen.css';

/**
 * CONTEST PATH: the hub (grade cards, today's plan, the week's lanterns, the parent card, the Logic Quest bridge)
 * and the calm session player (warm-up, a teach card, mixed play, the consent clock, victory and a Notebook glance).
 */
export function ContestTrackScreen() {
  const { state } = useGame();
  const run = state.contest.run;
  if (run && !run.paused) return <RunView run={run} />;
  return <Hub />;
}

const ORDER: GradeId[] = ['g1', 'g3', 'g5'];
const DAY_LETTERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const mins = (ms: number) => (ms / 60_000 < 10 ? (Math.round(ms / 6_000) / 10).toFixed(1) : String(Math.round(ms / 60_000)));

/* ------------------------------------------------------------------ */
/* Hub                                                                 */
/* ------------------------------------------------------------------ */

function Hub() {
  const { state, dispatch, play } = useGame();
  const c = state.contest;
  const grade = c.grade;
  const [confirm, setConfirm] = useState<GradeId | null>(null);
  const today = new Date().getDay();
  const week = weekSummary(c.history);
  const start = (mode: 'session' | 'preview' | 'mock') => { play('open'); dispatch({ type: 'CONTEST_START', mode, day: today }); };
  const pick = (g: GradeId) => { play('click'); setConfirm(null); dispatch({ type: 'CONTEST_SET_GRADE', grade: g }); };
  const paused = c.run?.paused ? c.run : null;
  // While a session waits, nothing on the hub can quietly replace it: Start becomes Resume, previews and grade switches wait.
  const waitingRun = runWaiting(c);
  const waiting = !!waitingRun;
  const resume = () => { play('open'); dispatch({ type: 'CONTEST_RESUME' }); };
  const lastMock = [...c.history].reverse().find((h) => h.mode === 'mock' && h.mock);
  return (
    <div className="screen-scroll">
      <div className="ct-page">
        <header className="ct-head">
          <div className="ct-row" style={{ justifyContent: 'space-between' }}>
            <div>
              <h1>Contest Path</h1>
              <p className="ct-sub">{grade ? `${GRADES[grade].title} · ${GRADES[grade].track}` : 'Calm picture puzzles for Grades 1, 3 and 5. Pick your own grade.'}</p>
            </div>
            <button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'library' })}>‹ Library</button>
          </div>
          <p className="ct-disclaimer">{CONTEST_DISCLAIMER}</p>
        </header>

        {paused && (
          <Panel title="A session is waiting" icon="hourglass" className="ct-resume">
            <p className="small">{runTitle(paused)}: {paused.items.length - paused.queue.length} of {paused.items.length} done.</p>
            <div className="ct-row">
              <button className="btn primary" onClick={resume}>Resume</button>
              <button className="btn ghost" onClick={() => dispatch({ type: 'CONTEST_QUIT' })}>End it for today</button>
            </div>
          </Panel>
        )}

        {grade && (
          <div className="ct-today">
            <TodayCard grade={grade} day={today} onStart={start} waitingRun={waitingRun} onResume={resume} />
            <Panel title="This week" icon="calendar">
              <WeekStrip week={week} today={today} />
              <p className="small">{week.sessions ? `${week.sessions} ${week.sessions === 1 ? 'session' : 'sessions'} · ${week.calmMin} calm min · ${week.timedMin} timed min · ${week.firstTry} right first try` : 'No lanterns yet this week. One calm session lights the first.'}</p>
              {week.streakWeeks > 1 && <p className="small brass">{week.streakWeeks} weeks in a row with practice.</p>}
              {lastMock && grade === 'g5' && <><h4 style={{ marginTop: 10 }}>Last mini-mock</h4><SkillBars bars={mockBars(lastMock)} /></>}
            </Panel>
          </div>
        )}

        <section aria-label="Grades">
          {!grade && <p className="small" style={{ margin: '0 0 8px' }}>Who is practising? Pick your own grade. Each player keeps their own.</p>}
          {grade && <h4 className="ct-grades-head">Grades <span className="muted">· {waiting ? 'finish or end the waiting session to switch or preview' : 'each player keeps their own; moving up is a grown-up decision'}</span></h4>}
          <div className="ct-grades">
            {ORDER.map((g) => {
              const p = GRADES[g];
              const mine = grade === g;
              const up = grade ? ORDER.indexOf(g) > ORDER.indexOf(grade) : false;
              const nextUp = grade ? nextGrade(grade) === g : false;
              return (
                <article key={g} className={`ct-grade ${mine ? 'mine' : ''} ${up ? 'soft' : ''}`} aria-label={p.title}>
                  <span className="ct-track">{p.track}</span>
                  <h3>{p.title}</h3>
                  <p>{p.goal}</p>
                  <p className="small"><Icon name="hourglass" /> {p.minutes[0]}–{p.minutes[1]} minutes a session</p>
                  <p className="ct-not">{p.isNot}</p>
                  <div className="ct-actions">
                    {!grade && <button className="btn small primary" onClick={() => pick(g)}>This is me</button>}
                    {mine && <span className="chip ok">Your track</span>}
                    {grade && !mine && !up && !waiting && <button className="btn small ghost" onClick={() => pick(g)}>Switch to {p.title.replace(/ (Foundation|Bridge|Contest Ramp)$/, '')}</button>}
                    {nextUp && !waiting && <button className="btn small" onClick={() => start('preview')}>Try a {p.title.replace(/ (Foundation|Bridge|Contest Ramp)$/, '')} preview</button>}
                    {up && !nextUp && <span className="chip lock">After the grade below</span>}
                    {up && !waiting && confirm !== g && <button className="ct-link" onClick={() => setConfirm(g)}>Move up</button>}
                  </div>
                  {up && !waiting && confirm === g && (
                    <div className="ct-confirm" role="group" aria-label="Move up a grade">
                      <span>Moving up is a grown-up decision. A preview first is a good idea. Move up to {p.title}?</span>
                      <div className="ct-row"><button className="btn small primary" onClick={() => pick(g)}>Yes, move up</button><button className="btn small ghost" onClick={() => setConfirm(null)}>Not yet</button></div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <a className="ct-bridge" href={LOGIC_QUEST_URL} target="_blank" rel="noopener noreferrer"><Icon name="brain" /> More logic puzzles in Logic Quest ↗</a>

        <ContestParentCard />
      </div>
    </div>
  );
}

function TodayCard({ grade, day, onStart, waitingRun, onResume }: { grade: GradeId; day: number; onStart: (mode: 'session' | 'preview' | 'mock') => void; waitingRun: ContestRun | null; onResume: () => void }) {
  const { state, dispatch, play } = useGame();
  const waiting = !!waitingRun;
  const t = themeForDay(day);
  const shape = SESSION_SHAPE[grade];
  const p = GRADES[grade];
  const name = state.character?.name ?? 'Player';
  // Tycoon Junior and the Dice Workshop count well past 20, so a Grade 1 Saturday offers the Plaza (sums to 20) only.
  const young = grade === 'g1';
  const about = t.id === 'play' && young ? 'Free choice: Equation Plaza (sums to 20), or a calm mixed session.' : t.about;
  // While a run waits, the card names that run (the Resume button below goes back to it), not today's fresh session.
  const plan = waitingRun
    ? <p className="small ct-waiting" aria-label="The waiting session"><b className="brass">Waiting:</b> {runTitle(waitingRun)}, {waitingRun.items.length - waitingRun.queue.length} of {waitingRun.items.length} done. Finish it or end it first; today's session can follow.</p>
    : <div className="ct-steps" aria-label="Today's session"><span>Warm-up · {shape.warm}</span><span>Teach card</span><span>Mixed play · {shape.play}</span><span>Victory + Notebook</span></div>;
  /** Start, or Resume while a session waits (starting would throw the waiting one away). */
  const startBtn = (label = 'Start (Calm)', cls = 'btn primary big ct-start') => (waiting
    ? <button className="btn primary big ct-start" onClick={onResume}>Resume the waiting session</button>
    : <button className={cls} onClick={() => onStart('session')}>{label}</button>);
  return (
    <Panel title={`Today: ${t.name}`} icon="compass">
      <p className="small">{about}</p>
      {t.id === 'rest' && (
        <>
          <p className="small"><b className="brass">Parent peek:</b> rest days help it stick. Ask what puzzle they liked this week, and let them explain one picture.</p>
          {waiting ? <>{plan}{startBtn()}</> : <><p className="small muted">A short one is {REST_SHAPE.warm + REST_SHAPE.play} calm puzzles, no teach card, no clock.</p>{startBtn('Play a short one anyway', 'btn ghost')}</>}
        </>
      )}
      {t.id === 'play' && (
        <>
          <p className="small muted">Tap a game to go straight there, or play a calm mixed session below.</p>
          <div className="ct-playlinks">
            <button className="btn" onClick={() => { play('open'); dispatch({ type: 'PLAZA_START', setup: { mode: 'practice', config: DEFAULT_PLAZA, name, goal: PLAZA_GOALS[0], coach: !state.stats.plaza?.coached } }); }}><b>Equation Plaza</b><small>Solo: build true sums to 20 on the board</small></button>
            {!young && <button className="btn" onClick={() => { play('open'); dispatch({ type: 'NAVIGATE', screen: 'dice' }); }}><b>Dice Workshop</b><small>Roll, score and spot the best move</small></button>}
            {!young && <button className="btn" onClick={() => { play('open'); dispatch({ type: 'TYCOON_START', setup: { level: 'junior', mode: 'quick', players: [{ name, kind: 'human' }, { name: 'Gearbot', kind: 'bot', bot: 'easy' }] } }); }}><b>Tycoon Junior</b><small>Add and subtract to 100 on a board</small></button>}
          </div>
          {plan}
          {startBtn('Calm mixed session')}
        </>
      )}
      {t.id !== 'rest' && t.id !== 'play' && (
        <>
          {plan}
          {!waiting && <p className="small muted">About {p.minutes[0]}–{p.minutes[1]} minutes. No clock{p.timerOffer ? ' unless you choose one near the end' : ''}.</p>}
          <div className="ct-row">{startBtn()}</div>
        </>
      )}
      {t.id === 'logic' && <p className="small" style={{ marginTop: 8 }}><a className="ct-bridge" href={LOGIC_QUEST_URL} target="_blank" rel="noopener noreferrer"><Icon name="brain" /> More logic puzzles in Logic Quest ↗</a></p>}
      {grade === 'g5' && !waiting && (
        <div className="ct-confirm" style={{ marginTop: 10, borderStyle: day === 5 ? 'solid' : 'dashed' }}>
          <b className="brass">{day === 5 ? 'Friday mini-mock' : 'Mini-mock (best on Fridays)'}</b>
          <span>{MOCK_SIZE} original items across the contest skills. Calm, or a 15-minute clock only if you want one. Results show each skill, never a score.</span>
          <div><button className={`btn small ${day === 5 ? 'primary' : ''}`} onClick={() => onStart('mock')}>Start the mini-mock</button></div>
        </div>
      )}
    </Panel>
  );
}

function WeekStrip({ week, today }: { week: WeekSummary; today: number }) {
  const todayIdx = (today + 6) % 7;
  return (
    <div className="ct-week" aria-label="This week's lanterns">
      {DAY_LETTERS.map((d, i) => (
        <div key={d} className={`ct-day ${week.lanterns[i] ? 'lit' : ''} ${i === todayIdx ? 'today' : ''}`} aria-label={`${d}: ${week.lanterns[i] ? 'lantern lit' : 'not yet'}`}>
          <span className="ct-lantern" />{d}
        </div>
      ))}
    </div>
  );
}

function SkillBars({ bars }: { bars: MockBar[] }) {
  return (
    <div className="ct-bars" aria-label="How each skill went">
      {bars.map((b) => (
        <div key={b.skill} className="ct-bar"><span>{b.label}</span><span className="track"><i style={{ width: `${b.of ? (b.right / b.of) * 100 : 0}%` }} /></span><span className="n">{b.right}/{b.of}</span></div>
      ))}
    </div>
  );
}

/** The grown-ups' card: the grade's plan, this week's calm and timed minutes, weak spots and the checklist. Also on Stats. */
export function ContestParentCard({ open }: { open?: boolean }) {
  const { state, dispatch } = useGame();
  const v = parentView(state.contest, state.mastery);
  const g = state.contest.grade;
  return (
    <Panel title="Contest Path: parent plan" icon="scroll" className="ct-parent" right={open ? <button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'contest' })}>Open</button> : undefined}>
      <p className="small">{g ? <><b className="brass">{GRADES[g].title}</b> · {GRADES[g].track}. {GRADES[g].minutes[0]}–{GRADES[g].minutes[1]} minutes, four days a week, Calm by default.</> : 'No grade picked yet. The child picks their own grade on the Contest Path.'}</p>
      <div className="ct-cols">
        <div>
          <h4>This week's plan</h4>
          <div className="ct-plan">{v.plan.map((l) => <Fragment key={l.day}><b>{l.day}</b><span><span className="muted">{l.theme}:</span> {l.what}</span></Fragment>)}</div>
          <h4>This week</h4>
          <div className="ct-stats">
            <div><b>{v.week.sessions}</b><span>sessions</span></div>
            <div><b>{v.week.calmMin}</b><span>calm min</span></div>
            <div><b>{v.week.timedMin}</b><span>timed min</span></div>
          </div>
          <h4 style={{ marginTop: 8 }}>Weak spots</h4>
          {v.weak.length ? <ul className="small" style={{ margin: '4px 0 0 18px', padding: 0 }}>{v.weak.map((w) => <li key={w.id}>{w.label} <span className="muted">· {w.mastery}% after {w.attempts} {w.attempts === 1 ? 'try' : 'tries'}</span></li>)}</ul> : <p className="small muted">Not enough answers yet. Weak spots show after a few sessions.</p>}
        </div>
        <div>
          <h4>Checklist for grown-ups</h4>
          <ol>{v.checklist.map((x) => <li key={x}>{x}</li>)}</ol>
          <p className="ct-disclaimer">{CONTEST_DISCLAIMER}</p>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Session player                                                      */
/* ------------------------------------------------------------------ */

function runTitle(r: ContestRun) {
  if (r.mode === 'mock') return 'Mini-mock';
  if (r.mode === 'preview') return `${GRADES[r.grade].title} preview`;
  return `${GRADES[r.grade].track} · ${themeForDay(r.day).name}`;
}

function RunView({ run }: { run: ContestRun }) {
  const { dispatch } = useGame();
  const done = run.items.length - run.queue.length;
  const item = currentItem(run);
  const section = run.phase === 'teach' ? 'Teach card' : run.phase === 'consent' ? 'Your choice' : run.phase === 'over' ? 'Done' : run.mode === 'mock' ? 'Mini-mock' : run.mode === 'preview' ? 'Preview' : item?.section === 'warm' ? 'Warm-up' : 'Mixed play';
  return (
    <div className="scene ct-scene" style={{ backgroundImage: `url(${asset('/assets/environments/workshop-lab.svg')})` }}>
      <div className="scene-header">
        <div className="loc"><h2>{runTitle(run)}</h2><p>{section}{run.phase === 'play' ? ` · ${Math.min(done + 1, run.items.length)} of ${run.items.length}` : ''}{run.clock.state === 'on' ? ' · clock on' : ' · Calm'}</p></div>
        <span className="spacer" />
        {run.phase !== 'over' && <button className="btn small ghost" onClick={() => dispatch({ type: 'CONTEST_PAUSE' })}>Pause</button>}
      </div>
      <Dots run={run} />
      {run.clock.state === 'on' && run.phase !== 'over' && <ClockBar run={run} />}
      <div className="scene-body">
        {run.phase === 'teach' && run.teach && <TeachView run={run} />}
        {run.phase === 'consent' && <ConsentCard run={run} />}
        {run.phase === 'play' && item && <PlayView run={run} />}
        {run.phase === 'over' && <Victory run={run} />}
      </div>
    </div>
  );
}

function Dots({ run }: { run: ContestRun }) {
  const cur = run.phase === 'play' ? run.queue[0] : -1;
  return (
    <div className="ct-dots" aria-label="Progress">
      {run.items.map((it, i) => {
        const r = run.results[i];
        const answered = r && !run.queue.includes(i);
        const cls = answered ? (r.firstTry ? 'first' : 'done') : i === cur ? 'now' : run.flagged.includes(i) ? 'flag' : '';
        return (
          <span key={i} style={{ display: 'contents' }}>
            {run.teach && i === run.teachAt && i > 0 && <span className="sep" aria-hidden />}
            <i className={cls} title={`${i + 1}: ${it.section === 'warm' ? 'warm-up' : 'play'}${run.flagged.includes(i) ? ', flagged' : ''}`} />
          </span>
        );
      })}
      {run.flagged.length > 0 && run.phase !== 'over' && <span className="lbl">⚑ {run.flagged.length} to come back to</span>}
    </div>
  );
}

/** A thin, calm bar. No ticking numbers, no red, and it never ends the session: when time is up it just says so. */
function ClockBar({ run }: { run: ContestRun }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const left = Math.max(0, run.clock.ms - (now - (run.clock.startedAt ?? now)));
  return (
    <div className="ct-clock" role="timer" aria-label={left > 0 ? 'Clock running' : 'Time is up'}>
      <div className="track"><i style={{ width: `${run.clock.ms ? (left / run.clock.ms) * 100 : 0}%` }} /></div>
      {left <= 0 && <p>Time is up. That is fine: finish these calmly.</p>}
    </div>
  );
}

function TeachView({ run }: { run: ContestRun }) {
  const { dispatch, play } = useGame();
  const t = run.teach!;
  const st = t.steps[Math.min(run.teachStep, t.steps.length - 1)];
  const who = NPCS[st.speaker] ?? NPCS.vector;
  const last = run.teachStep + 1 >= t.steps.length;
  // A Grade 1 child may not read yet: the card is read aloud as each step opens (as their puzzles are), and anyone can
  // tap "Read to me". Speech stops when the card closes (Pause, or on to the puzzles).
  const young = run.home === 'g1';
  const words = speakable(st.text);
  const speaker = canSpeak();
  useEffect(() => { if (young && speaker) speak(words); }, [run.teachStep, young]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopSpeaking(), []);
  return (
    <div className="ct-card" aria-label="Teach card">
      <div className="ct-section"><span className="chip">Teach card</span><span className="small muted">{t.title} · {Math.min(run.teachStep + 1, t.steps.length)} of {t.steps.length}</span></div>
      <div className="ct-teach">
        {who && <img src={who.portrait} alt="" />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="who">{who?.name ?? 'Professor Vector'}</div>
          <div className="txt" key={run.teachStep}>{labeled(st.text)}</div>
          {hasLabels(st.text) && <LabelKey />}
        </div>
      </div>
      {st.visual && <MathVisual visual={st.visual} caption={st.caption} />}
      <div className="ct-row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
        {speaker && <button className="btn small ghost" onClick={() => speak(words)} aria-label="Read the teach card aloud"><Icon name="sound-on" /> Read to me</button>}
        <button className="btn primary" onClick={() => { play('click'); dispatch({ type: 'CONTEST_TEACH_NEXT' }); }}>{last ? 'Let\'s play ▸' : 'Show me ▸'}</button>
      </div>
    </div>
  );
}

function ConsentCard({ run }: { run: ContestRun }) {
  const { dispatch, play } = useGame();
  const minutes = Math.round(run.clock.ms / 60_000);
  return (
    <div className="ct-card" aria-label="Clock choice">
      <h2>{run.mode === 'mock' ? 'Mini-mock' : 'Last few puzzles'}</h2>
      <p>{run.mode === 'mock' ? 'Practice is calm. This round can have a clock if you like.' : 'Practice was calm. This last round can have a clock if you like.'} Want to try it?</p>
      <p className="small muted">The clock is a thin bar ({minutes} minutes for {run.queue.length} puzzles). It never stops you. When time is up, you just finish calmly.</p>
      {/* Calm is the default: "Stay calm" comes first and looks like the main button; the clock is the opt-in. */}
      <div className="ct-row" style={{ marginTop: 8 }}>
        <button className="btn primary" onClick={() => { play('click'); dispatch({ type: 'CONTEST_CLOCK', accept: false }); }}>Stay calm</button>
        <button className="btn ghost" onClick={() => { play('open'); dispatch({ type: 'CONTEST_CLOCK', accept: true }); }}>Yes, try the clock</button>
      </div>
    </div>
  );
}

function PlayView({ run }: { run: ContestRun }) {
  const { dispatch, play } = useGame();
  const item = currentItem(run)!;
  const q = item.question;
  // The player's own grade decides the supports: a Grade 1 child previewing Grade 3 still hears every question.
  const young = run.home === 'g1';
  const retry = !!run.feedback && !run.feedback.correct && run.attempts < (run.mode === 'mock' ? 1 : 2);
  const lastOne = run.queue.length === 1;
  // The mini-mock is test-like: "Show me how" (the worked answer) opens only once the item is answered.
  const lockExplain = run.mode === 'mock' && !run.feedback;
  return (
    <div className={`ct-play${lockExplain ? ' ct-noexplain' : ''}`}>
      {run.flagged.includes(run.queue[0]) && <p className="small" style={{ color: 'var(--amber)', margin: 0 }}>⚑ You flagged this one. Fresh eyes now.</p>}
      <MathChallenge
        question={q}
        feedback={run.feedback}
        onSubmit={(given) => dispatch({ type: 'CONTEST_ANSWER', given })}
        onNext={() => dispatch({ type: 'CONTEST_NEXT' })}
        onHint={run.mode === 'mock' ? undefined : () => dispatch({ type: 'CONTEST_HINT' })}
        hintShown={run.hintShown}
        showExplanation={run.showExplanation}
        onToggleExplanation={() => { if (!lockExplain) dispatch({ type: 'CONTEST_EXPLAIN' }); }}
        explainLocked={lockExplain}
        nextLabel={retry ? 'Try again' : lastOne ? 'Finish' : 'Next'}
        showTimer={false}
        readAloud={young || !!q.readAloud}
        autoRead={young}
        compact
      />
      {canSkip(run) && <div className="ct-row" style={{ justifyContent: 'flex-end' }}><button className="btn small ghost" onClick={() => { play('click'); dispatch({ type: 'CONTEST_SKIP' }); }}>⚑ Skip &amp; come back</button></div>}
    </div>
  );
}

/**
 * A miss on a picture puzzle or a tap choice: the Notebook's error kinds ("Arithmetic slip", "Wrong operation") are
 * about sums, so the glance shows a neutral tag for these instead.
 */
const pictureMiss = (q: Question) => !!q.choices?.length || !!contestSkillLabel(q.masterySkillId ?? '');

function Victory({ run }: { run: ContestRun }) {
  const { state, dispatch, play } = useGame();
  const s = runSummary(run);
  const [burst] = useState(() => Date.now());
  useEffect(() => { play(run.mode === 'preview' ? 'correct' : 'victory'); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const week = weekSummary(state.contest.history);
  const newest = [...activeEntries(state.notebook ?? [])].sort((a, b) => b.createdAt - a.createdAt)[0];
  const close = () => { play('click'); dispatch({ type: 'CONTEST_CLOSE' }); };
  const fix = () => { if (!newest) return; play('open'); dispatch({ type: 'CONTEST_CLOSE' }); dispatch({ type: 'NOTEBOOK_START', entryId: newest.id }); };
  const lit = run.mode !== 'preview';
  return (
    <div className="ct-card ct-victory" aria-label="Session done">
      {lit && <Confetti trigger={burst} />}
      <h1 className="brass">{run.mode === 'preview' ? 'Preview done' : run.mode === 'mock' ? 'Mini-mock done' : 'Lantern lit!'}</h1>
      <p className="small">{run.mode === 'preview' ? `That was a peek at ${GRADES[run.grade].title}. Your track stays ${GRADES[run.home].title}.` : 'You finished today\'s path. Look at your week:'}</p>
      {lit && <WeekStrip week={week} today={new Date().getDay()} />}
      <div className="stat-grid">
        <div className="st"><b>{s.items}</b><span>puzzles done</span></div>
        <div className="st"><b>{s.firstTry}</b><span>right first try</span></div>
        <div className="st"><b>{mins(s.calmMs)}</b><span>calm minutes</span></div>
        <div className="st"><b>{mins(s.timedMs)}</b><span>timed minutes</span></div>
      </div>
      {run.mode === 'mock' && <><h4>How each skill went</h4><SkillBars bars={mockBars(run)} /><p className="small muted">Each bar is one skill. It is not a contest score: it shows where to practise next.</p></>}
      {s.items > s.firstTry && <p className="small">Second tries count too. Fixing a mistake is how brains grow.</p>}
      <div className="ct-glance" aria-label="Notebook glance">
        <h4>Notebook glance</h4>
        {newest ? (
          <>
            <p className="q">{labeled(newest.question.expression)}{newest.question.mode === 'applied' ? <span className="muted"> · {newest.question.prompt.length > 110 ? `${newest.question.prompt.slice(0, 110)}…` : newest.question.prompt}</span> : null}</p>
            <div className="ct-row">{pictureMiss(newest.question) ? <span className="chip">A puzzle to fix</span> : <span className={`chip kind-${newest.kind}`}>{ERROR_LABELS[newest.kind].label}</span>}<button className="btn small primary" onClick={fix}>Fix it now</button></div>
          </>
        ) : <p className="small">No cards to fix. Lovely.</p>}
      </div>
      <div className="ct-row" style={{ justifyContent: 'center', marginTop: 12 }}>
        <button className="btn big" onClick={close}>Back to the Contest Path</button>
      </div>
      {run.mode === 'preview' && <p className="small muted">A preview has {PREVIEW_ITEMS} puzzles and does not change your grade.</p>}
    </div>
  );
}

