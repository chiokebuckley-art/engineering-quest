import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useGame } from '../store';
import { Icon, Panel, Bar } from '../components/ui';
import { Confetti, Callout } from '../components/Fx';
import { MentalWorkspace, PlaceBlocks, DecompCard } from '../components/MentalWorkspace';
import * as MM from '../../engine/mentalmath/session';
import { SCAFFOLD_NAMES, SCAFFOLD_BLURB, type MMScaffold } from '../../engine/mentalmath/session';
import { mmSkill, MM_LESSONS, mmWorld } from '../../engine/mentalmath/curriculum';
import { coachChoice, strategiesFor, STRATEGY_NAMES, type StrategyId } from '../../engine/mentalmath/strategies';
import { ERROR_LABEL, errorAdvice } from '../../engine/mentalmath/errors';
import { progressFor } from '../../engine/mentalmath/progress';
import { labeled, hasLabels, LabelKey } from '../components/Labeled';

const secs = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

/** Speak a problem aloud with the browser's own voice: no key, no network, off by default. */
function speak(text: string, on: boolean) {
  if (!on || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/×/g, ' times ').replace(/−/g, ' minus ').replace(/\+/g, ' plus '));
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch { /* speech is a bonus, never a requirement */ }
}

/** Large touch keypad plus a real input, so phones and keyboards are both fast. */
function Entry({ value, onChange, onSubmit, disabled, unit }: { value: string; onChange: (v: string) => void; onSubmit: () => void; disabled?: boolean; unit?: string }) {
  const { play } = useGame();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const key = (k: string) => {
    if (disabled) return;
    play('tick');
    if (k === '⌫') onChange(value.slice(0, -1));
    else if (k === 'C') onChange('');
    else onChange(value.length < 9 ? value + k : value);
  };
  const tap = (k: string) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); key(k); },
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => { if (e.detail === 0) key(k); },
  });
  return (
    <div>
      <form className="answer-row" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        <input
          ref={ref} className="answer-input" inputMode="numeric" pattern="-?[0-9]*" value={value} disabled={disabled}
          placeholder={unit ?? '?'} autoComplete="off" aria-label="Your answer"
          onChange={(e) => onChange(e.target.value.replace(/[^0-9-]/g, ''))}
          onKeyDown={(e: ReactKeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); onSubmit(); } }}
        />
        <button type="submit" className="btn primary big-answer" disabled={!value.trim() || disabled}><Icon name="energy" /> Go</button>
      </form>
      <div className="keypad" onContextMenu={(e) => e.preventDefault()}>
        {['7', '8', '9', '⌫', '4', '5', '6', '1', '2', '3', 'C', '0'].map((k) => (
          <button key={k} type="button" className={k === '⌫' || k === 'C' ? 'edit' : k === '0' ? 'zero' : ''} {...tap(k)} aria-label={k === '⌫' ? 'Delete' : k === 'C' ? 'Clear' : k}>{k}</button>
        ))}
      </div>
    </div>
  );
}

export function MentalTrainer() {
  const { state, dispatch, play } = useGame();
  const s = state.mm!;
  const [value, setValue] = useState('');
  const [burst, setBurst] = useState(0);
  const [callout, setCallout] = useState({ n: 0, text: '' });
  const [audio, setAudio] = useState(false);
  const [left, setLeft] = useState(s.targetMs ?? 0);
  const p = MM.current(s);
  const strategy = MM.activeStrategy(s);
  const ask = MM.currentAsk(s);
  const steps = useMemo(() => MM.stepsOf(s), [s.index, s.chosen, s.scaffold]);
  const sk = mmSkill(s.skillId);
  const world = mmWorld(s.world);
  const done = s.status === 'finished';
  const rep = useMemo(() => MM.report(s), [s.results.length, done]);

  useEffect(() => { setValue(''); }, [s.index, s.stepIndex, s.phase]);
  useEffect(() => { if (p && s.phase === 'ask' && audio) speak(p.prompt, audio); }, [s.index, s.phase, audio, p]);
  useEffect(() => { if (done) { setBurst(Date.now()); play(rep.accuracy >= 0.9 ? 'fanfare' : 'victory'); } }, [done]);
  useEffect(() => {
    if (s.feedback?.correct && s.streak > 0 && s.streak % 5 === 0) { setCallout({ n: Date.now(), text: `${s.streak} IN A ROW!` }); play('combo'); }
  }, [s.feedback, s.streak, play]);
  // Per-question clock in speed mode.
  useEffect(() => {
    if (!s.targetMs || s.phase !== 'ask' || done) return;
    const t = setInterval(() => setLeft(Math.max(0, (s.targetMs ?? 0) - (Date.now() - s.questionStartedAt))), 100);
    return () => clearInterval(t);
  }, [s.targetMs, s.questionStartedAt, s.phase, done]);

  const submit = () => {
    if (!value.trim()) return;
    const beforeIndex = s.results.length;
    dispatch({ type: 'MM_ANSWER', given: value });
    setValue('');
    // Sound is chosen from what the answer will be, which the session has already decided.
    const correct = Number(value) === ask.expect;
    play(correct ? 'correct' : 'wrong');
    void beforeIndex;
  };

  if (done) return <Report />;

  const hold = MM.asksSteps(s) ? steps.slice(0, s.stepIndex).map((x) => x.expect) : [];
  const lesson = sk ? MM_LESSONS[sk.id] : undefined;
  const alts = p && p.op !== 'none' ? strategiesFor(p.op, p.a, p.b) : [strategy];
  const altShown = alts[(s.altIndex) % Math.max(1, alts.length)];

  return (
    <div className="screen-scroll" style={{ background: 'url(/assets/environments/workshop-lab.svg) center / cover' }}>
      <Confetti trigger={burst} />
      <Callout text={callout.text} trigger={callout.n} />
      <div className="container stack">
        <Panel
          title={`${world?.name ?? 'Mental math'} · ${sk?.name ?? ''}`}
          icon="brain"
          right={<button className="btn small ghost" onClick={() => dispatch({ type: 'MM_EXIT' })}>Leave</button>}
        >
          <div className="row wrap" style={{ gap: 8 }}>
            <span className="chip">Level {s.scaffold}: {SCAFFOLD_NAMES[s.scaffold]}</span>
            <span className="chip">{s.mode === 'boss' ? 'Boss' : s.mode === 'workout' ? 'Daily workout' : s.mode === 'placement' ? 'Placement' : s.mode}</span>
            <span className="chip">{Math.min(s.index + 1, s.problems.length)} / {s.problems.length}</span>
            {s.streak >= 3 && <span className="chip ok">{s.streak} streak</span>}
            {s.targetMs && s.phase === 'ask' && <span className={`chip ${left <= 0 ? 'warn' : ''}`}>{(Math.max(0, left) / 1000).toFixed(1)} s</span>}
            <span className="spacer" />
            <button className="btn small ghost" onClick={() => setAudio((a) => !a)} aria-pressed={audio} title="Read problems aloud">
              <Icon name={audio ? 'sound-on' : 'sound-off'} /> {audio ? 'Voice on' : 'Voice'}
            </button>
            <button className="btn small ghost" onClick={() => dispatch({ type: 'MM_VISUAL' })} aria-pressed={s.visualOn}>
              {s.visualOn ? 'Hide visuals' : 'Show visuals'}
            </button>
          </div>
          {s.boss && (
            <div className="mm-boss" style={{ marginTop: 8 }}>
              <Icon name="skull" className="xl" />
              <div className="hp">
                <Bar value={s.boss.maxHp - s.boss.hp} max={s.boss.maxHp} kind="hp" label={`${s.boss.name} — ${s.boss.phaseName}`} right={`${s.boss.maxHp - s.boss.hp}/${s.boss.maxHp}`} thick />
              </div>
            </div>
          )}
          <div className="mm-scaff" style={{ marginTop: 8 }}>
            <span className="small muted" style={{ marginRight: 4 }}>Help:</span>
            {([1, 2, 3, 4, 5, 6] as MMScaffold[]).map((n) => (
              <button key={n} className={`btn small ${s.scaffold === n ? 'primary' : 'ghost'}`} onClick={() => { play('click'); dispatch({ type: 'MM_SCAFFOLD', scaffold: n }); }} title={SCAFFOLD_BLURB[n]}>{n}</button>
            ))}
            <span className="small muted">{SCAFFOLD_BLURB[s.scaffold]}</span>
          </div>
        </Panel>

        {s.phase === 'demo' && p && (
          <Panel title="Watch it worked through" icon="telescope">
            {lesson && <p className="small">{labeled(lesson.intro)}</p>}
            <div className="mm-ask">{p.prompt}{p.ask ? <small>{labeled(p.ask)}</small> : null}</div>
            <MentalWorkspace strategy={strategy} animate />
            <p className="small muted"><b>{strategy.name}.</b> {labeled(strategy.why)}</p>
            {(hasLabels(lesson?.intro) || hasLabels(strategy.why)) && <LabelKey />}
            {lesson?.watchOut && <p className="small" style={{ color: 'var(--amber)' }}>Watch out: {lesson.watchOut}</p>}
            <div className="row wrap" style={{ justifyContent: 'center' }}>
              <button className="btn primary big" onClick={() => { play('open'); dispatch({ type: 'MM_BEGIN' }); }}>I am ready — my turn</button>
            </div>
          </Panel>
        )}

        {s.phase === 'choose' && p && (
          <Panel title="Which way would you solve it?" icon="brain">
            <div className="mm-ask">{p.prompt}</div>
            <p className="small muted">More than one route is valid. Pick the one you think costs your head the least.</p>
            <div className="mm-choice">
              {alts.map((a) => (
                <button key={a.id} className="btn" onClick={() => { play('click'); dispatch({ type: 'MM_CHOOSE', strategy: a.id }); }}>
                  <b>{a.name}</b>
                  <div className="small muted">{a.steps.map((x) => x.label).join(' → ')}</div>
                </button>
              ))}
            </div>
          </Panel>
        )}

        {s.phase === 'ask' && p && (
          <Panel title={MM.asksSteps(s) ? `Step ${s.stepIndex + 1} of ${steps.length}` : 'Your turn'} icon="target">
            {p.ask && <p className="small">{labeled(p.ask)}</p>}
            <div className="mm-ask">{MM.asksSteps(s) ? ask.question : p.prompt}{MM.asksSteps(s) && <small>from {p.prompt}</small>}</div>
            {hold.length > 0 && <div className="mm-hold">{hold.map((h, i) => <i key={i}>holding {h}</i>)}</div>}
            {s.scaffold <= 2 && s.visualOn && <MentalWorkspace strategy={strategy} revealed={MM.asksSteps(s) ? s.stepIndex : 0} compact showNotes={false} />}
            {s.visualOn && p.tag === 'expanded' && p.a > 0 && <DecompCard n={p.a} blank={p.answer} />}
            {s.visualOn && (p.tag === 'place-value' || p.tag === 'double' || p.tag === 'halve') && p.a > 0 && <PlaceBlocks n={p.a} />}
            {s.feedback && !s.feedback.correct && s.feedback.stepOk === false && <div className="feedback wrong">{labeled(s.feedback.text)}</div>}
            {s.feedback?.stepOk && <div className="feedback correct">{labeled(s.feedback.text)}</div>}
            {s.hintShown && <div className="feedback" style={{ borderColor: 'var(--teal)', color: '#99f6e4', background: 'rgba(45,212,191,0.08)' }}>Hint: {strategy.name} — {strategy.steps[0]?.label ?? strategy.when}. {strategy.when}</div>}
            <Entry value={value} onChange={setValue} onSubmit={submit} />
            <div className="tools">
              {!s.hintShown && s.scaffold >= 3 && <button className="btn small" onClick={() => { play('click'); dispatch({ type: 'MM_HINT' }); }}><Icon name="lantern" /> Hint</button>}
              <button className="btn small ghost" onClick={() => speak(p.prompt, true)}><Icon name="sound-on" /> Read it aloud</button>
              {s.mode === 'visualize' && <button className="btn small ghost" onClick={() => dispatch({ type: 'MM_REVEAL' })}>Show the next chunk</button>}
            </div>
          </Panel>
        )}

        {s.phase === 'feedback' && p && (
          <Panel title={s.feedback?.correct ? 'Right' : 'Not yet'} icon={s.feedback?.correct ? 'star' : 'book'}>
            <div className={`feedback ${s.feedback?.correct ? 'correct' : 'wrong'}`}>{labeled(s.feedback?.text)}</div>
            {!s.feedback?.correct && s.feedback?.diag && (
              <p className="small muted"><b>{ERROR_LABEL[s.feedback.diag.kind]}.</b> {errorAdvice(s.feedback.diag.kind)}</p>
            )}
            <div className="mm-ask">{p.prompt} = {p.answer}</div>
            <MentalWorkspace strategy={altShown} animate={!s.feedback?.correct} />
            <p className="small muted"><b>{altShown.name}.</b> {labeled(altShown.why)}</p>
            {(hasLabels(s.feedback?.text) || hasLabels(altShown.why)) && <LabelKey />}
            <div className="row wrap" style={{ justifyContent: 'center' }}>
              {alts.length > 1 && <button className="btn" onClick={() => { play('open'); dispatch({ type: 'MM_ANOTHER' }); }}><Icon name="telescope" /> Show me another way</button>}
              <button className="btn primary big" autoFocus onClick={() => { play('click'); dispatch({ type: 'MM_NEXT' }); }}>
                {s.index + 1 >= s.problems.length ? 'See the report' : 'Next'} ⏎
              </button>
            </div>
            {alts.length > 1 && <p className="small muted" style={{ textAlign: 'center' }}>{coachChoice(p.op === 'none' ? 'add' : p.op, p.a, p.b).reason}</p>}
          </Panel>
        )}
      </div>
    </div>
  );
}

/** End-of-session report: encouraging, factual, and pointed at the next thing to do. */
function Report() {
  const { state, dispatch, play } = useGame();
  const s = state.mm!;
  const rep = MM.report(s);
  const sk = mmSkill(s.skillId);
  const prog = progressFor(state.stats.mental, s.skillId);
  const passed = MM.passedMastery(s);
  const beat = MM.bossBeaten(s);
  const placement = s.mode === 'placement' ? state.stats.mental.placement : undefined;
  const slowest = [...s.results].sort((a, b) => b.timeMs - a.timeMs)[0];
  return (
    <div className="screen-scroll" style={{ background: 'url(/assets/environments/workshop-lab.svg) center / cover' }}>
      <div className="container stack">
        <Panel title={beat ? 'Boss defeated' : passed ? 'Mastery passed' : 'Session report'} icon="medal">
          <h1 className="brass" style={{ textAlign: 'center' }}>{beat ? 'VICTORY' : passed ? 'MASTERED' : 'GOOD WORK'}</h1>
          <div className="stat-grid">
            <div className="st"><b>{rep.correct}/{rep.solved}</b><span>correct</span></div>
            <div className="st"><b>{Math.round(rep.accuracy * 100)} %</b><span>accuracy</span></div>
            <div className="st"><b>{secs(rep.avgMs)}</b><span>average time</span></div>
            <div className="st"><b>{rep.bestStreak}</b><span>best streak</span></div>
            {rep.onTime !== undefined && <div className="st"><b>{rep.onTime}/{rep.solved}</b><span>on the clock</span></div>}
            <div className="st"><b>{rep.hints}</b><span>hints used</span></div>
          </div>
          <p className="small">Practised: <b>{sk?.name ?? s.skillId}</b>. {rep.improvement ?? ''}</p>
          {rep.commonError && <p className="small muted">Most common slip: <b>{ERROR_LABEL[rep.commonError]}</b>. {errorAdvice(rep.commonError)}</p>}
          {slowest && !slowest.correct && <p className="small muted">The one that cost most time: {slowest.prompt} ({secs(slowest.timeMs)}).</p>}
          {placement && <p className="small"><b>Placement:</b> {placement.level}. Start at {mmSkill(placement.startSkill)?.name ?? placement.startSkill}.</p>}
          {!passed && s.mode === 'mastery' && <p className="small muted">A mastery round needs 90 % with at most one hint. Another guided round first will get you there.</p>}
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            <button className="btn primary big" onClick={() => { play('open'); dispatch({ type: 'MM_START', mode: s.mode === 'placement' ? 'guided' : s.mode, skillId: placement?.startSkill ?? s.skillId }); }}>
              {s.mode === 'placement' ? 'Start training there' : 'Go again'}
            </button>
            {prog.speedStep >= 0 && s.mode !== 'speed' && rep.accuracy >= 0.9 && sk && (
              <button className="btn" onClick={() => { play('boss-roar'); dispatch({ type: 'MM_START', mode: 'speed', skillId: s.skillId }); }}>
                <Icon name="hourglass" /> Now for speed
              </button>
            )}
            <button className="btn" onClick={() => dispatch({ type: 'MM_EXIT' })}>Back to the Academy</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export { STRATEGY_NAMES };
export type { StrategyId };
