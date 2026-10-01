import { useEffect, useState } from 'react';

/** Burst of confetti pieces (CSS-only). Mount with a changing `trigger` to fire. */
export function Confetti({ trigger, count = 36 }: { trigger: number; count?: number }) {
  const [pieces, setPieces] = useState<{ id: number; x: number; d: number; r: number; c: string; s: number }[]>([]);
  useEffect(() => {
    if (!trigger) return;
    const colors = ['#ffb347', '#2dd4bf', '#a78bfa', '#4ade80', '#f0cf62', '#22d3ee'];
    setPieces(Array.from({ length: count }, (_, i) => ({ id: trigger * 100 + i, x: Math.random() * 100, d: 0.6 + Math.random() * 0.9, r: Math.random() * 360, c: colors[i % colors.length], s: 6 + Math.random() * 8 })));
    const t = setTimeout(() => setPieces([]), 1800);
    return () => clearTimeout(t);
  }, [trigger, count]);
  if (!pieces.length) return null;
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p) => <i key={p.id} style={{ left: `${p.x}%`, animationDuration: `${p.d + 0.6}s`, animationDelay: `${Math.random() * 0.2}s`, background: p.c, width: p.s, height: p.s * 0.6, transform: `rotate(${p.r}deg)` }} />)}
    </div>
  );
}

/** Big centred callout text that pops and fades ("COMBO ×3!", "+40 XP"). */
export function Callout({ text, trigger, color = 'var(--amber)' }: { text: string; trigger: number; color?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!trigger) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 1100);
    return () => clearTimeout(t);
  }, [trigger]);
  if (!show) return null;
  return <div className="callout" style={{ color }} key={trigger}>{text}</div>;
}
