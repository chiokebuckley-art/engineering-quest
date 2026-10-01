import { useEffect, useRef, useState } from 'react';
import { useGame } from '../store';
import { MathVisual } from './MathVisual';
import { placeParts, type Strategy } from '../../engine/mentalmath/strategies';

/**
 * The Mental Workspace: what the brain should be doing, drawn as a chain of chunks rather than as a
 * vertical sum. Each step appears in turn with the amount being moved on the arrow and the number to
 * hold in the box, which is the picture a learner eventually runs without the screen.
 */
export function MentalWorkspace({ strategy, revealed, showNotes = true, compact = false, animate = true, onDone }: {
  strategy: Strategy; revealed?: number; showNotes?: boolean; compact?: boolean; animate?: boolean; onDone?: () => void;
}) {
  const { state } = useGame();
  const reduced = state.settings.reducedMotion;
  const steps = strategy.steps.filter((s) => s.delta !== 0 || s.to !== s.from || s.note);
  const total = steps.length;
  const [shown, setShown] = useState(revealed ?? (animate && !reduced ? 0 : total));
  const doneRef = useRef(false);

  useEffect(() => { if (revealed !== undefined) setShown(revealed); }, [revealed]);
  useEffect(() => {
    if (revealed !== undefined || !animate || reduced) { setShown(total); return; }
    setShown(0); doneRef.current = false;
    const timers = steps.map((_, i) => window.setTimeout(() => setShown(i + 1), 550 * (i + 1)));
    const end = window.setTimeout(() => { if (!doneRef.current) { doneRef.current = true; onDone?.(); } }, 550 * (total + 1));
    return () => { timers.forEach(clearTimeout); clearTimeout(end); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategy.steps.map((s) => s.label).join('|'), animate, reduced, revealed]);

  const start = steps[0]?.from ?? strategy.answer;
  return (
    <div className={`mw ${compact ? 'compact' : ''}`} aria-label={`${strategy.name}: ${strategy.steps.map((s) => `${s.label} equals ${s.to}`).join(', ')}`}>
      <div className="mw-chain">
        <div className="mw-node start">{start}</div>
        {steps.map((s, i) => {
          const on = i < shown;
          const isLast = i === total - 1;
          return (
            <div key={i} className={`mw-step ${on ? 'on' : ''}`}>
              <div className="mw-arrow">
                <span className={`mw-delta ${s.delta !== undefined && s.delta < 0 ? 'down' : 'up'}`}>
                  {s.delta !== undefined && s.delta !== 0 ? `${s.delta > 0 ? '+' : '−'}${Math.abs(s.delta)}` : s.label}
                </span>
              </div>
              <div className={`mw-node ${isLast ? 'final' : ''}`}>{s.to}</div>
              {showNotes && s.note && <div className="mw-note">{s.note}</div>}
            </div>
          );
        })}
      </div>
      {!compact && strategy.visual.type !== 'none' && shown >= total && <MathVisual visual={strategy.visual} />}
    </div>
  );
}

/** Place-value blocks for World 1: hundreds flats, tens rods and ones cubes. */
export function PlaceBlocks({ n, highlight }: { n: number; highlight?: number }) {
  const parts = placeParts(n);
  return (
    <div className="pv-blocks" aria-label={`${n} as ${parts.join(' plus ')}`}>
      {parts.map((p) => {
        const mag = 10 ** (String(p).length - 1);
        const count = p / mag;
        const kind = mag >= 100 ? 'hundred' : mag === 10 ? 'ten' : 'one';
        return (
          <div key={p} className={`pv-group ${highlight === p ? 'hl' : ''}`}>
            <div className="pv-row">
              {Array.from({ length: Math.min(count, 9) }, (_, i) => <i key={i} className={`pv ${kind}`} />)}
            </div>
            <span className="pv-label">{p}</span>
          </div>
        );
      })}
    </div>
  );
}

/** A decomposition card: 347 = 300 + 40 + 7, with one part optionally blanked. */
export function DecompCard({ n, blank }: { n: number; blank?: number }) {
  const parts = placeParts(n);
  return (
    <div className="decomp" aria-label={`${n} equals ${parts.join(' plus ')}`}>
      <b>{n}</b>
      <span>=</span>
      {parts.map((p, i) => (
        <span key={p} className="decomp-part">
          {i > 0 && <em>+</em>}
          <i className={blank === p ? 'blank' : ''}>{blank === p ? '?' : p}</i>
        </span>
      ))}
    </div>
  );
}
