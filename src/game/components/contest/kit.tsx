import type { ReactNode } from 'react';
import type { ColorName, ContestIcon, ShapeName } from '../../../engine/contest/visuals';

/** Shared drawing kit for the Contest Path pictures: palette, an SVG frame, labels, shapes and icons. */
export const C = { label: '#fde68a', muted: '#94a3b8', line: '#e5e7eb', teal: '#2dd4bf', gold: '#f0d78c', brass: '#c9a227', ask: '#f472b6', dark: '#0f172a', panel: '#1f2937', navy: '#0c1f44' };
/** Bright, colour-blind-friendlier fills (each also differs in lightness). */
export const COLOR: Record<ColorName, string> = { red: '#ef4444', blue: '#3b82f6', yellow: '#facc15', green: '#22c55e', purple: '#a855f7', orange: '#fb923c' };
export const MONO = 'var(--font-mono)';

export function Svg({ w, h, label, children, max = 440 }: { w: number; h: number; label: string; children: ReactNode; max?: number }) {
  return <svg viewBox={`0 0 ${w} ${h}`} width={Math.min(w, max)} role="img" aria-label={label}>{children}</svg>;
}
export function Lbl({ x, y, text, color = C.label, size = 12, anchor = 'middle', bold = false }: { x: number; y: number; text: string | number; color?: string; size?: number; anchor?: 'start' | 'middle' | 'end'; bold?: boolean }) {
  return <text x={x} y={y} fontSize={size} fill={color} fontFamily={MONO} textAnchor={anchor} fontWeight={bold ? 700 : 400} stroke={C.dark} strokeWidth="3" paintOrder="stroke">{text}</text>;
}
/** A "?" box: the thing to find. */
export function AskBox({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return <g><rect x={x} y={y} width={w} height={h} rx={6} fill="none" stroke={C.ask} strokeWidth={2} strokeDasharray="5 4" /><Lbl x={x + w / 2} y={y + h / 2 + 6} text="?" color={C.ask} size={Math.min(w, h) * 0.55} bold /></g>;
}

const star = (cx: number, cy: number, r: number, n = 5, inner = 0.45) => Array.from({ length: n * 2 }, (_, i) => { const a = (Math.PI * i) / n - Math.PI / 2; const rr = i % 2 ? r * inner : r; return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`; }).join(' ');

/** A coloured shape centred at (cx, cy), radius r. Shapes differ in outline as well as colour. */
export function ShapeGlyph({ shape, color = 'blue', cx, cy, r, rot = 0 }: { shape: ShapeName; color?: ColorName; cx: number; cy: number; r: number; rot?: number }) {
  const fill = COLOR[color]; const s = { fill, stroke: C.dark, strokeWidth: 1.5 } as const;
  const body = (() => {
    switch (shape) {
      case 'circle': return <circle cx={cx} cy={cy} r={r} {...s} />;
      case 'square': return <rect x={cx - r * 0.85} y={cy - r * 0.85} width={r * 1.7} height={r * 1.7} rx={2} {...s} />;
      case 'triangle': return <polygon points={`${cx},${cy - r} ${cx + r * 0.95},${cy + r * 0.75} ${cx - r * 0.95},${cy + r * 0.75}`} {...s} />;
      case 'star': return <polygon points={star(cx, cy, r)} {...s} />;
      case 'diamond': return <polygon points={`${cx},${cy - r} ${cx + r * 0.75},${cy} ${cx},${cy + r} ${cx - r * 0.75},${cy}`} {...s} />;
      case 'hexagon': return <polygon points={Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(' ')} {...s} />;
      case 'heart': return <path d={`M ${cx} ${cy + r * 0.8} C ${cx - r * 1.4} ${cy - r * 0.2}, ${cx - r * 0.5} ${cy - r * 1.2}, ${cx} ${cy - r * 0.35} C ${cx + r * 0.5} ${cy - r * 1.2}, ${cx + r * 1.4} ${cy - r * 0.2}, ${cx} ${cy + r * 0.8} Z`} {...s} />;
      case 'moon': return <path d={`M ${cx + r * 0.3} ${cy - r} A ${r} ${r} 0 1 0 ${cx + r * 0.3} ${cy + r} A ${r * 1.3} ${r * 1.3} 0 0 1 ${cx + r * 0.3} ${cy - r} Z`} {...s} />;
    }
  })();
  return rot ? <g transform={`rotate(${rot} ${cx} ${cy})`}>{body}</g> : body;
}

/** A simple flat picture in a 24 × 24 box at (x, y), scaled to `size`. `color` tints the main part where it makes sense. */
export function IconGlyph({ icon, x, y, size = 24, color }: { icon: ContestIcon; x: number; y: number; size?: number; color?: ColorName }) {
  const k = size / 24; const c = color ? COLOR[color] : undefined; const o = { stroke: C.dark, strokeWidth: 1.2 / k };
  const g = (() => {
    switch (icon) {
      case 'frog': return <><ellipse cx={12} cy={15} rx={9} ry={6} fill={c ?? '#22c55e'} {...o} /><circle cx={7.5} cy={8.5} r={3} fill={c ?? '#22c55e'} {...o} /><circle cx={16.5} cy={8.5} r={3} fill={c ?? '#22c55e'} {...o} /><circle cx={7.5} cy={8.5} r={1.2} fill={C.dark} /><circle cx={16.5} cy={8.5} r={1.2} fill={C.dark} /><path d="M8 16 Q12 19 16 16" fill="none" stroke={C.dark} strokeWidth={1} /></>;
      case 'apple': return <><circle cx={12} cy={14} r={8} fill={c ?? '#ef4444'} {...o} /><path d="M12 6 Q13 3 15 2" stroke="#7c4a1e" strokeWidth={1.6} fill="none" /><ellipse cx={15.5} cy={4.5} rx={2.4} ry={1.2} fill="#22c55e" /></>;
      case 'star': return <polygon points={star(12, 12.5, 10)} fill={c ?? '#facc15'} {...o} />;
      case 'fish': return <><ellipse cx={11} cy={12} rx={8} ry={5} fill={c ?? '#fb923c'} {...o} /><polygon points="18,12 23,7 23,17" fill={c ?? '#fb923c'} {...o} /><circle cx={7} cy={11} r={1.1} fill={C.dark} /></>;
      case 'bird': return <><ellipse cx={11} cy={14} rx={8} ry={6} fill={c ?? '#3b82f6'} {...o} /><circle cx={16} cy={9} r={4} fill={c ?? '#3b82f6'} {...o} /><polygon points="20,9 24,10 20,11" fill="#f59e0b" /><circle cx={17} cy={8.5} r={0.9} fill={C.dark} /></>;
      case 'car': return <><rect x={2} y={11} width={20} height={6} rx={2} fill={c ?? '#ef4444'} {...o} /><path d="M6 11 L8 6 H16 L18 11 Z" fill={c ?? '#ef4444'} {...o} /><circle cx={7} cy={18} r={2.4} fill={C.dark} /><circle cx={17} cy={18} r={2.4} fill={C.dark} /></>;
      case 'cube': return <><polygon points="12,3 21,7.5 12,12 3,7.5" fill="#fde68a" {...o} /><polygon points="3,7.5 12,12 12,22 3,17.5" fill={c ?? '#c9a227'} {...o} /><polygon points="21,7.5 12,12 12,22 21,17.5" fill="#8a6d17" {...o} /></>;
      case 'coin': return <><circle cx={12} cy={12} r={9} fill={c ?? '#facc15'} {...o} /><circle cx={12} cy={12} r={6} fill="none" stroke="#a16207" strokeWidth={1} /></>;
      case 'hat': return <><rect x={7} y={5} width={10} height={11} rx={1} fill={c ?? '#3b82f6'} {...o} /><rect x={3} y={15} width={18} height={3} rx={1} fill={c ?? '#3b82f6'} {...o} /></>;
      case 'shirt': return <path d="M8 3 L4 6 L2 11 L6 12 L6 21 H18 L18 12 L22 11 L20 6 L16 3 Q12 6 8 3 Z" fill={c ?? '#22c55e'} {...o} />;
      case 'shoe': return <path d="M3 9 H9 L12 13 H19 Q22 14 22 17 V19 H3 Z" fill={c ?? '#a855f7'} {...o} />;
      case 'cone': return <><polygon points="7,10 17,10 12,23" fill="#d97706" {...o} /><circle cx={12} cy={8} r={5.5} fill={c ?? '#f9a8d4'} {...o} /></>;
      case 'scoop': return <circle cx={12} cy={12} r={8} fill={c ?? '#f9a8d4'} {...o} />;
      case 'cookie': return <><circle cx={12} cy={12} r={9} fill="#d6a15a" {...o} /><circle cx={9} cy={9} r={1.3} fill="#3f2a14" /><circle cx={15} cy={11} r={1.3} fill="#3f2a14" /><circle cx={11} cy={15} r={1.3} fill="#3f2a14" /></>;
      case 'ball': return <><circle cx={12} cy={12} r={9} fill={c ?? '#fb923c'} {...o} /><path d="M3 12 H21 M12 3 V21" stroke={C.dark} strokeWidth={0.9} /></>;
      case 'book': return <><rect x={4} y={3} width={16} height={18} rx={1.5} fill={c ?? '#3b82f6'} {...o} /><rect x={7} y={6} width={10} height={3} fill="#e5e7eb" /></>;
      case 'flower': return <>{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={12 + 5 * Math.cos((a * Math.PI) / 180)} cy={10 + 5 * Math.sin((a * Math.PI) / 180)} r={3.4} fill={c ?? '#f472b6'} {...o} />)}<circle cx={12} cy={10} r={2.6} fill="#facc15" /><path d="M12 15 V23" stroke="#16a34a" strokeWidth={1.8} /></>;
      case 'cat': return <><polygon points="5,9 7,2 11,7" fill={c ?? '#fb923c'} {...o} /><polygon points="19,9 17,2 13,7" fill={c ?? '#fb923c'} {...o} /><circle cx={12} cy={13} r={8} fill={c ?? '#fb923c'} {...o} /><circle cx={9} cy={12} r={1.1} fill={C.dark} /><circle cx={15} cy={12} r={1.1} fill={C.dark} /></>;
      case 'dog': return <><circle cx={12} cy={13} r={8} fill={c ?? '#d6a15a'} {...o} /><ellipse cx={4.5} cy={11} rx={2.5} ry={5} fill="#7c4a1e" /><ellipse cx={19.5} cy={11} rx={2.5} ry={5} fill="#7c4a1e" /><circle cx={9} cy={12} r={1.1} fill={C.dark} /><circle cx={15} cy={12} r={1.1} fill={C.dark} /><ellipse cx={12} cy={16} rx={2} ry={1.4} fill={C.dark} /></>;
      case 'robot': return <><rect x={5} y={6} width={14} height={13} rx={2} fill={c ?? '#94a3b8'} {...o} /><circle cx={9.5} cy={11} r={1.6} fill="#2dd4bf" /><circle cx={14.5} cy={11} r={1.6} fill="#2dd4bf" /><path d="M12 6 V2" stroke={C.dark} strokeWidth={1.2} /><circle cx={12} cy={2} r={1.2} fill="#f472b6" /><rect x={9} y={15} width={6} height={1.6} fill={C.dark} /></>;
      case 'gear': return <><polygon points={star(12, 12, 10, 8, 0.75)} fill={c ?? '#c9a227'} {...o} /><circle cx={12} cy={12} r={3} fill={C.dark} /></>;
      case 'person': return <><circle cx={12} cy={6} r={4} fill="#f2c79c" {...o} /><path d="M5 22 Q5 12 12 12 Q19 12 19 22 Z" fill={c ?? '#3b82f6'} {...o} /></>;
      case 'pizza': return <><polygon points="12,22 3,4 21,4" fill="#facc15" {...o} /><path d="M3 4 Q12 1 21 4" stroke="#d97706" strokeWidth={2.2} fill="none" /><circle cx={11} cy={9} r={1.5} fill="#ef4444" /><circle cx={14} cy={13} r={1.5} fill="#ef4444" /></>;
      case 'juice': return <><rect x={7} y={6} width={10} height={16} rx={1.5} fill={c ?? '#fb923c'} {...o} /><path d="M13 6 L15 1" stroke={C.dark} strokeWidth={1.4} /></>;
      case 'sandwich': return <><polygon points="2,16 12,5 22,16" fill="#fde68a" {...o} /><rect x={2} y={16} width={20} height={3} fill="#22c55e" /><rect x={2} y={19} width={20} height={3} fill="#fde68a" {...o} /></>;
      case 'tree': return <><rect x={10.5} y={14} width={3} height={8} fill="#7c4a1e" /><circle cx={12} cy={10} r={7.5} fill={c ?? '#16a34a'} {...o} /></>;
      case 'house': return <><polygon points="12,3 22,11 2,11" fill={c ?? '#ef4444'} {...o} /><rect x={5} y={11} width={14} height={11} fill="#fde68a" {...o} /><rect x={10} y={15} width={4} height={7} fill="#7c4a1e" /></>;
      case 'heart': return <path d="M12 21 C 0 13, 5 2, 12 8 C 19 2, 24 13, 12 21 Z" fill={c ?? '#ef4444'} {...o} />;
      case 'sun': return <><circle cx={12} cy={12} r={6} fill="#facc15" {...o} />{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <line key={a} x1={12 + 8 * Math.cos((a * Math.PI) / 180)} y1={12 + 8 * Math.sin((a * Math.PI) / 180)} x2={12 + 11 * Math.cos((a * Math.PI) / 180)} y2={12 + 11 * Math.sin((a * Math.PI) / 180)} stroke="#facc15" strokeWidth={1.8} />)}</>;
      case 'moon': return <path d="M15 2 A10 10 0 1 0 15 22 A7.5 7.5 0 1 1 15 2 Z" fill={c ?? '#fde68a'} {...o} />;
      case 'bolt': return <polygon points="13,1 4,14 11,14 9,23 20,9 13,9" fill={c ?? '#facc15'} {...o} />;
      case 'key': return <><circle cx={7} cy={12} r={5} fill="none" stroke={c ?? '#facc15'} strokeWidth={3} /><path d="M12 12 H22 M18 12 V16 M21 12 V15" stroke={c ?? '#facc15'} strokeWidth={3} /></>;
      case 'bell': return <><path d="M5 18 Q6 6 12 5 Q18 6 19 18 Z" fill={c ?? '#facc15'} {...o} /><circle cx={12} cy={20} r={2} fill="#a16207" /></>;
      case 'kite': return <><polygon points="12,1 20,10 12,19 4,10" fill={c ?? '#a855f7'} {...o} /><path d="M12 19 Q10 22 13 23" stroke={C.line} fill="none" /></>;
      case 'boat': return <><polygon points="2,15 22,15 18,21 6,21" fill={c ?? '#7c4a1e'} {...o} /><polygon points="12,2 12,14 19,14" fill="#e5e7eb" {...o} /><path d="M12 2 V15" stroke={C.dark} strokeWidth={1.2} /></>;
    }
  })();
  return <g transform={`translate(${x} ${y}) scale(${k})`}>{g}</g>;
}
