import { useState } from 'react';
import { evaluate, formatResult } from '../../engine/calc';
import { useGame } from '../store';
import { Icon } from './ui';

const KEYS = [
  ['sin', 'cos', 'tan', '(', ')'],
  ['sin⁻¹', 'cos⁻¹', 'tan⁻¹', '^', '√'],
  ['7', '8', '9', '÷', 'ln'],
  ['4', '5', '6', '×', 'log'],
  ['1', '2', '3', '−', 'π'],
  ['0', '.', '⌫', '+', 'e'],
];
const FN_KEYS = new Set(['sin', 'cos', 'tan', 'sin⁻¹', 'cos⁻¹', 'tan⁻¹', '√', 'ln', 'log']);

/** A scientific calculator for questions that ask for a rounded answer. Opens under a toggle. */
export function Calculator({ radiansFirst = false }: { radiansFirst?: boolean }) {
  const { play } = useGame();
  const [open, setOpen] = useState(false);
  const [expr, setExpr] = useState('');
  const [rad, setRad] = useState(radiansFirst);
  const [shown, setShown] = useState<string | null>(null);
  const r = evaluate(expr, rad);
  const press = (k: string) => {
    play('tick'); setShown(null);
    if (k === '⌫') setExpr((e) => e.replace(/(sin⁻¹\(|cos⁻¹\(|tan⁻¹\(|sin\(|cos\(|tan\(|ln\(|log\(|√\(|.)$/u, ''));
    else setExpr((e) => (e.length > 60 ? e : e + (FN_KEYS.has(k) ? `${k}(` : k)));
  };
  if (!open) {
    return <button className="btn small ghost calc-toggle" onClick={() => { play('open'); setOpen(true); }}><Icon name="abacus" /> Calculator</button>;
  }
  return (
    <div className="calc" role="group" aria-label="calculator">
      <div className="calc-head">
        <button className={`btn small ${rad ? '' : 'primary'}`} onClick={() => setRad(false)}>DEG</button>
        <button className={`btn small ${rad ? 'primary' : ''}`} onClick={() => setRad(true)}>RAD</button>
        <span className="grow" />
        <button className="btn small ghost" onClick={() => { setExpr(''); setShown(null); }}>C</button>
        <button className="btn small ghost" onClick={() => setOpen(false)} aria-label="close calculator">✕</button>
      </div>
      <div className="calc-screen">
        <div className="calc-expr">{expr || <span className="muted">e.g. 12 tan(60)</span>}</div>
        <div className={`calc-out ${shown !== null ? 'done' : ''}`}>{shown ?? (expr && r.ok ? `= ${formatResult(r.value)}` : expr ? <span className="muted small">{r.ok ? '' : r.error}</span> : '')}</div>
      </div>
      <div className="calc-keys">
        {KEYS.flat().map((k) => <button key={k} className={`btn calc-key ${/^[\d.]$/.test(k) ? 'digit' : ''}`} onClick={() => press(k)}>{k}</button>)}
      </div>
      <button className="btn primary block" disabled={!r.ok} onClick={() => { if (r.ok) { play('click'); setShown(`= ${formatResult(r.value)}`); } }}>=</button>
      <div className="small muted" style={{ marginTop: 4 }}>Angles in {rad ? 'radians' : 'degrees'}. Round the result the way the question asks.</div>
    </div>
  );
}
