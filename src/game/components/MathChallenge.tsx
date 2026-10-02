import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent } from 'react';
import type { Question } from '../../engine/types';
import { labeled, hasLabels, LabelKey } from './Labeled';
import { MathVisual } from './MathVisual';
import { Icon } from './ui';
import { useGame } from '../store';
import { ContestVisualView } from './contest/ContestVisual';
import { isContestVisual } from '../../engine/contest/visuals';
import { speak, canSpeak, stopSpeaking } from '../speech';

interface Props {
  question: Question;
  feedback?: { correct: boolean; text: string };
  onSubmit: (given: string) => void;
  onNext: () => void;
  onHint?: () => void;
  hintShown?: boolean;
  hintCharges?: number;
  showExplanation: boolean;
  onToggleExplanation: () => void;
  nextLabel?: string;
  showTimer?: boolean;
  compact?: boolean;
  disabled?: boolean;
  /** Battle plays its own hit sounds. */
  silent?: boolean;
  /** Show the speaker button (young players; questions with `readAloud`). */
  readAloud?: boolean;
  /** Read each new question aloud as it appears (Grade 1 track default). */
  autoRead?: boolean;
  /** The answer button's word: FIRE in battles, ANSWER everywhere else. */
  submitLabel?: string;
  /** More help for the ? Help sheet (battle NPC tips, Power Strike). */
  helpExtra?: ReactNode;
  /** A short line from a guide, shown left of ? Help. */
  guideLine?: ReactNode;
}

/** What the speaker button reads: the question's own words, else its prompt and expression. */
const readText = (q: Question) => q.readAloud ?? [q.mode === 'applied' ? q.prompt : '', q.expression].filter(Boolean).join('. ');

/**
 * The math challenge widget used by battles, lessons, drills and missions.
 * Numeric input with an on-screen keypad (touch friendly), hint, "Explain This",
 * and an integrated visual model.
 */
export function MathChallenge(p: Props) {
  const { state, play } = useGame();
  const [value, setValue] = useState('');
  const [picked, setPicked] = useState<number | null>(null);
  const [help, setHelp] = useState(false);
  useEffect(() => { setHelp(false); }, [p.question.id]);
  const lastFb = useRef<unknown>(null);
  useEffect(() => {
    if (!p.feedback || p.feedback === lastFb.current) return;
    lastFb.current = p.feedback;
    if (!p.silent) play(p.feedback.correct ? 'correct' : 'wrong');
  }, [p.feedback, p.silent, play]);
  const [elapsed, setElapsed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const startRef = useRef(Date.now());
  const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  useEffect(() => {
    setValue('');
    if (!p.feedback) setPicked(null);
    startRef.current = Date.now();
    setElapsed(0);
    if (!isTouch) inputRef.current?.focus();
  }, [p.question.id, p.feedback, isTouch]);

  useEffect(() => {
    if (p.feedback) return;
    const t = setInterval(() => setElapsed(Date.now() - startRef.current), 250);
    return () => clearInterval(t);
  }, [p.feedback, p.question.id]);

  // Keyboard: Enter advances after feedback.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && p.feedback) { e.preventDefault(); p.onNext(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [p.feedback, p.onNext]);

  const speaker = !!(p.readAloud || p.question.readAloud) && canSpeak();
  useEffect(() => { if (p.autoRead && canSpeak()) speak(readText(p.question)); return () => { if (p.autoRead) stopSpeaking(); }; }, [p.question.id, p.autoRead]); // eslint-disable-line react-hooks/exhaustive-deps
  const choices = p.question.choices?.length ? p.question.choices : null;
  const inline = !choices && p.question.mode !== 'applied' && /=\s*\?\s*$/.test(p.question.expression);
  const choose = (v: number) => { if (p.feedback || p.disabled) return; play('tick'); setPicked(v); p.onSubmit(String(v)); };

  const submit = () => {
    if (p.feedback || p.disabled) return;
    if (!value.trim()) return;
    p.onSubmit(value);
  };
  const key = (k: string) => {
    if (p.feedback) return;
    play('tick');
    if (k === '⌫') setValue((v) => v.slice(0, -1));
    else if (k === 'C') setValue('');
    else if (k === '.') setValue((v) => (v.includes('.') || v.length >= 8 ? v : (v || '0') + '.'));
    else if (k === '/') setValue((v) => (v.includes('/') || !v || v.length >= 8 ? v : v + '/'));
    else if (k === '−') setValue((v) => (v.startsWith('-') ? v.slice(1) : '-' + v));
    else setValue((v) => (v.length < 8 ? v + k : v));
  };
  const showVisualAlways = p.question.visualFirst || (p.question.difficulty <= 1 && !p.compact);
  const frac = !!p.question.allowFraction; const neg = !!p.question.allowNegative;
  // a fraction answer is judged by value, so its decimal form must be typeable too (1/5 or 0.2)
  const dec = !!p.question.allowDecimal || frac;
  const extra = [...(dec ? ['.'] : []), ...(frac ? ['/'] : []), ...(neg ? ['−'] : [])];
  // One keypad everywhere: 7 8 9 · 4 5 6 · 1 2 3 · ⌫ 0 and the extra keys this question needs.
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '⌫', '0', ...extra];
  // '-' is escaped: a bare '-' after '.' or '/' made the class an invalid range, so typing threw
  const allowed = `0-9${dec ? '.' : ''}${frac ? '/' : ''}\\-`;
  const tap = (k: string) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); key(k); },
    onClick: (e: ReactMouseEvent<HTMLButtonElement>) => { if (e.detail === 0) key(k); },
  });

  return (
    <div className="challenge">
      {p.question.mode === 'applied' && <div className="prompt">{labeled(p.question.prompt)}</div>}
      {/* Typed digits land in the question itself, in gold, where the ? was. */}
      {inline ? (
        <div className="expr" aria-live="polite">{p.question.expression.replace(/\?\s*$/, '')}<span className={`typed ${p.feedback ? (p.feedback.correct ? 'correct' : 'wrong') : ''}`}>{value || (p.feedback ? (p.feedback.correct && Number.isInteger(p.question.answer) ? String(p.question.answer) : '') : '?')}{!p.feedback && <i className="caret" />}</span></div>
      ) : (
        <div className={`expr ${p.question.mode === 'applied' ? 'applied' : ''}`}>{p.question.expression}</div>
      )}
      {showVisualAlways && !p.feedback && <MathVisual visual={p.question.visual} />}
      {choices ? (
        <div className="choice-area">
          <div className={`choice-row n${choices.length}`} role="group" aria-label="Tap your answer">
            {choices.map((c) => {
              const state = p.feedback && picked === c.value ? (p.feedback.correct ? 'correct' : 'wrong') : '';
              return (
                <button key={c.value} type="button" className={`choice-btn ${state} ${c.visual ? 'has-pic' : ''}`} disabled={!!p.feedback || p.disabled} onClick={() => choose(c.value)} aria-label={c.label}>
                  {c.visual && <span className="choice-pic">{isContestVisual(c.visual) ? <ContestVisualView visual={c.visual} small /> : <MathVisual visual={c.visual} />}</span>}
                  <span className="choice-label">{c.label}</span>
                </button>
              );
            })}
          </div>
          {p.feedback && <div className="answer-row"><button type="button" className="btn teal" onClick={p.onNext} autoFocus>{p.nextLabel ?? (p.feedback.correct ? 'Continue' : 'Try again')} ⏎</button></div>}
        </div>
      ) : (
        <form className={`answer-row ${inline && isTouch ? 'keypad-only' : ''}`} onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <input
            ref={inputRef}
            className={`answer-input ${p.feedback ? (p.feedback.correct ? 'correct' : 'wrong') : ''}`}
            inputMode={dec || frac ? 'decimal' : neg ? 'text' : 'numeric'}
            pattern={frac ? '-?[0-9]*[\\/.,]?[0-9]*' : dec ? '-?[0-9]*[.,]?[0-9]*' : '-?[0-9]*'}
            placeholder={p.question.unit ? p.question.unit : '?'}
            value={value}
            disabled={!!p.feedback || p.disabled}
            onChange={(e) => setValue(e.target.value.replace(/,/g, dec ? '.' : '').replace(/[−–]/g, '-').replace(new RegExp(`[^${allowed}]`, 'g'), ''))}
            aria-label="Your answer"
            autoComplete="off"
          />
          {!p.feedback ? (
            <button type="submit" className="btn primary big-answer" disabled={!value.trim() || p.disabled}>{p.submitLabel ?? 'ANSWER'} ▸</button>
          ) : (
            <button type="button" className="btn teal" onClick={p.onNext} autoFocus>{p.nextLabel ?? (p.feedback.correct ? 'Continue' : 'Try again')} ⏎</button>
          )}
        </form>
      )}
      {isTouch && !p.feedback && !choices && (
        <div className="keypad" onContextMenu={(e) => e.preventDefault()}>
          {keys.map((k) => (
            <button key={k} type="button" className={k === '⌫' ? 'edit' : k === '0' && !extra.length ? 'zero2' : ''} {...tap(k)} aria-label={k === '⌫' ? 'Delete' : k === 'C' ? 'Clear' : k === '/' ? 'Fraction bar' : k === '−' ? 'Minus' : k}>{k}</button>
          ))}
        </div>
      )}
      {p.feedback && <div className={`feedback ${p.feedback.correct ? 'correct' : 'wrong'}`}>{labeled(p.feedback.text)}</div>}
      {!p.feedback && p.hintShown && <div className="feedback" style={{ borderColor: 'var(--teal)', color: '#99f6e4', background: 'rgba(45,212,191,0.08)' }}>Hint: {labeled(p.question.hint)}</div>}
      <div className="tools">
        {p.guideLine && <span className="guide-line">{p.guideLine}</span>}
        {/* Young players hear the question without opening Help. */}
        {speaker && <button className="btn small ghost" onClick={() => speak(readText(p.question))} aria-label="Read the question aloud"><Icon name="sound-on" /> Read to me</button>}
        {p.showTimer !== false && state.settings.showTimer && <span className="timer">{p.feedback ? '' : `${(elapsed / 1000).toFixed(1)}s`}</span>}
        <button type="button" className={`help-pill ${help ? 'on' : ''}`} aria-expanded={help} onClick={() => { play('click'); setHelp((v) => !v); }}>? Help</button>
      </div>
      {help && (
        <div className="help-sheet" role="group" aria-label="Help">
          {p.helpExtra}
          <div className="help-row">
            {p.onHint && !p.hintShown && !p.feedback && (
              <button className="btn small ghost" onClick={p.onHint} disabled={(p.hintCharges ?? 1) <= 0}><Icon name="lantern" /> Hint{p.hintCharges !== undefined ? ` (${p.hintCharges})` : ''}</button>
            )}
            <button className="btn small ghost" onClick={p.onToggleExplanation}><Icon name="book" /> {p.showExplanation ? 'Hide' : 'Explain this'}</button>
          </div>
        </div>
      )}
      {p.showExplanation && <Explanation q={p.question} />}
    </div>
  );
}

export function Explanation({ q }: { q: Question }) {
  return (
    <div className="explain">
      <h4>Explain: {q.expression.replace(' = ?', '')}</h4>
      <MathVisual visual={q.solutionVisual ?? q.visual} />
      <ol>{q.explanation.map((line, i) => <li key={i}>{labeled(line)}</li>)}</ol>
      {q.explanation.some(hasLabels) && <LabelKey />}
      {q.engineeringApplication && <div className="eng-app"><Icon name="gear" /> Engineering: {q.engineeringApplication}</div>}
    </div>
  );
}
