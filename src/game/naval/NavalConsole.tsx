import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { useGame } from '../store';
import { Explanation } from '../components/MathChallenge';

/** A stable keypad keeps the battle visible on phones, including during answer feedback. */
export function NavalConsole() {
  const { state, dispatch, play } = useGame(); const a = state.arcade!;
  const [answer, setAnswer] = useState(''); const [explain, setExplain] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const touch = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const locked = !!a.feedback || a.status !== 'active';
  useEffect(() => { setAnswer(''); setExplain(false); if (!touch) input.current?.focus(); }, [a.question.id, touch]);
  const fire = () => { if (!locked && answer.trim()) dispatch({ type: 'ARCADE_ANSWER', given: answer }); };
  const key = (value: string) => {
    if (locked) return; play('tick');
    setAnswer(old => value === '⌫' ? old.slice(0, -1) : value === 'C' ? '' : (old + value).slice(0, 8));
  };
  // Taps register on pointer-down (no click delay, no double fire, no text selection); keyboards still use click.
  const tap = (value: string) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); key(value); },
    onClick: (e: ReactMouseEvent<HTMLButtonElement>) => { if (e.detail === 0) key(value); },
  });
  const noMenu = (e: ReactMouseEvent) => e.preventDefault();
  return <div className="naval-console" onContextMenu={noMenu}>
    <div className="naval-overline">GUNNERY CONTROL</div>
    <div className="naval-expression">{a.question.expression}</div>
    <form className="naval-answer" onSubmit={event => { event.preventDefault(); fire(); }}>
      {touch
        ? <div className={`naval-readout ${locked ? 'locked' : ''} ${answer ? '' : 'empty'}`} role="textbox" aria-readonly="true" aria-label="Your answer">{answer || '?'}</div>
        : <input ref={input} aria-label="Your answer" value={answer} inputMode="numeric" autoComplete="off" placeholder="?" disabled={locked}
          onChange={event => setAnswer(event.target.value.replace(/[^0-9-]/g, '').slice(0, 8))} />}
      <button className="fire-button" type="submit" disabled={locked || !answer.trim()}>FIRE</button>
    </form>
    <div className={`naval-feedback ${a.feedback ? a.feedback.correct ? 'correct' : 'miss' : ''}`} role="status" aria-live="polite">
      {a.feedback ? a.feedback.correct ? `${a.feedback.text} · Guns firing!` : `Misfire. Answer: ${a.question.answer}` : 'Solve the question to fire. Speed and combos add shells.'}
    </div>
    <div className="naval-keypad" aria-label="Answer keypad">
      {['7', '8', '9', '⌫', '4', '5', '6', 'C', '1', '2', '3', '0'].map(value => <button key={value} type="button" className={locked ? 'locked' : ''} aria-disabled={locked} {...tap(value)} aria-label={value === '⌫' ? 'Delete digit' : value === 'C' ? 'Clear answer' : value}>{value}</button>)}
    </div>
    <div className="naval-console-tools"><span>{a.combo} hit streak</span><button type="button" onClick={() => setExplain(!explain)}>{explain ? 'Hide explanation' : 'Show me how'}</button></div>
    {explain && <Explanation q={a.question} />}
  </div>;
}
