/**
 * Visuals for the upper academies: function plots (curves, points, vectors, slope fields, Riemann
 * rectangles, tangents, shaded areas), the unit circle, number lines with negatives, geometry
 * diagrams and matrices. Pure SVG; PlotCanvas also powers the tap-to-plot model.
 */
import { useId, type ReactNode } from 'react';
import type { PlotLayers } from '../../engine/academy/types';
import { evalFn, sampleFn, slopeAt, type Fn } from '../../engine/academy/fn';

export const COL = { label: '#fde68a', muted: '#94a3b8', line: '#e5e7eb', teal: '#2dd4bf', orange: '#f97316', ask: '#f472b6', dark: '#0f172a', grid: 'rgba(148,163,184,0.16)', fill: 'rgba(45,212,191,0.18)' } as const;
type ColorKey = 'teal' | 'orange' | 'ask' | 'label' | 'muted' | 'line';
const col = (c?: string) => (c && c in COL ? COL[c as ColorKey] : c ?? COL.teal);
const MONO = 'var(--font-mono)';
const f2 = (n: number) => { const r = Math.round(n * 100) / 100; return (r < 0 ? '−' : '') + String(Math.abs(r)); };

export function T({ x, y, text, color = COL.label, size = 11, anchor = 'middle', bold = false }: { x: number; y: number; text: string; color?: string; size?: number; anchor?: 'start' | 'middle' | 'end'; bold?: boolean }) {
  return <text x={x} y={y} fontSize={size} fill={color} fontFamily={MONO} textAnchor={anchor} fontWeight={bold ? 700 : 400} stroke={COL.dark} strokeWidth="3" paintOrder="stroke">{text}</text>;
}

/** A readable tick step for a span. */
function niceStep(span: number, target = 10) {
  const raw = span / target; const p = 10 ** Math.floor(Math.log10(raw)); const m = raw / p;
  return (m >= 5 ? 5 : m >= 2 ? 2 : 1) * p;
}

export interface PlotCanvasProps {
  range: [number, number, number, number];
  layers?: PlotLayers;
  w?: number; h?: number;
  /** Tap-to-plot: lattice points become buttons. */
  pick?: { picked: [number, number][]; onPick: (x: number, y: number) => void; arrows?: boolean; disabled?: boolean };
  label?: string;
  children?: ReactNode;
}

/** The shared plotting surface (math coordinates, y up). */
export function PlotCanvas({ range, layers = {}, w = 320, h = 280, pick, label, children }: PlotCanvasProps) {
  const [x0, x1, y0, y1] = range; const pad = 22;
  const X = (x: number) => pad + ((x - x0) / (x1 - x0)) * (w - 2 * pad);
  const Y = (y: number) => h - pad - ((y - y0) / (y1 - y0)) * (h - 2 * pad);
  const clip = useId().replace(/:/g, '');
  const sx = niceStep(x1 - x0); const sy = niceStep(y1 - y0);
  const xs: number[] = []; for (let v = Math.ceil(x0 / sx) * sx; v <= x1 + 1e-9; v += sx) xs.push(Math.round(v * 1e6) / 1e6);
  const ys: number[] = []; for (let v = Math.ceil(y0 / sy) * sy; v <= y1 + 1e-9; v += sy) ys.push(Math.round(v * 1e6) / 1e6);
  const ax = Math.min(Math.max(0, x0), x1); const ay = Math.min(Math.max(0, y0), y1);
  const path = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join(' ');
  const yLim = (y1 - y0) * 20;
  const curve = (fn: Fn, a = x0, b = x1) => sampleFn(fn, a, b, 180, yLim).map(path).join(' ');
  const arrowId = `${clip}-arr`;
  // Riemann rectangles
  const rects: ReactNode[] = [];
  if (layers.rects) {
    const { fn, a, b, n, rule = 'left' } = layers.rects; const dx = (b - a) / n;
    for (let i = 0; i < n; i++) { const xl = a + i * dx; const xs2 = rule === 'left' ? xl : rule === 'right' ? xl + dx : xl + dx / 2; const yv = evalFn(fn, xs2); if (!Number.isFinite(yv)) continue; rects.push(<rect key={i} x={X(xl)} width={Math.max(0.5, X(xl + dx) - X(xl))} y={Math.min(Y(yv), Y(0))} height={Math.abs(Y(yv) - Y(0))} fill="rgba(251,191,36,0.25)" stroke="#fbbf24" strokeWidth="1" />); }
  }
  // Shaded area
  let shade: ReactNode = null;
  if (layers.shade) { const { fn, a, b } = layers.shade; const pts = sampleFn(fn, a, b, 120, yLim)[0] ?? []; if (pts.length) shade = <path d={`M ${X(a)} ${Y(0)} ${pts.map((p) => `L ${X(p[0])} ${Y(p[1])}`).join(' ')} L ${X(b)} ${Y(0)} Z`} fill={COL.fill} stroke="none" />; }
  // Slope field
  const field: ReactNode[] = [];
  if (layers.field) {
    const { a, b, c } = layers.field; const fx = niceStep(x1 - x0, 12); const fy = niceStep(y1 - y0, 10); const L = Math.min((w - 2 * pad) / ((x1 - x0) / fx), (h - 2 * pad) / ((y1 - y0) / fy)) * 0.35;
    for (let x = Math.ceil(x0 / fx) * fx; x <= x1; x += fx) for (let y = Math.ceil(y0 / fy) * fy; y <= y1; y += fy) {
      const m = a * x + b * y + c; const dxp = X(x + 1) - X(x); const dyp = Y(y + m) - Y(y); const len = Math.hypot(dxp, dyp) || 1;
      field.push(<line key={`${x},${y}`} x1={X(x) - (dxp / len) * L} y1={Y(y) - (dyp / len) * L} x2={X(x) + (dxp / len) * L} y2={Y(y) + (dyp / len) * L} stroke={COL.muted} strokeWidth="1.2" strokeLinecap="round" />);
    }
  }
  let tangent: ReactNode = null;
  if (layers.tangent) { const { fn, x } = layers.tangent; const y = evalFn(fn, x); const m = slopeAt(fn, x); if (Number.isFinite(y) && Number.isFinite(m)) tangent = <g><line x1={X(x0)} y1={Y(y + m * (x0 - x))} x2={X(x1)} y2={Y(y + m * (x1 - x))} stroke={COL.orange} strokeWidth="1.8" strokeDasharray="6 4" /><circle cx={X(x)} cy={Y(y)} r="4" fill={COL.orange} /></g>; }
  const lattice: ReactNode[] = [];
  if (pick) {
    for (let x = Math.ceil(x0); x <= x1; x++) for (let y = Math.ceil(y0); y <= y1; y++) {
      const on = pick.picked.some((p) => p[0] === x && p[1] === y);
      lattice.push(<circle key={`${x},${y}`} cx={X(x)} cy={Y(y)} r={on ? 6 : 2.2} fill={on ? COL.ask : 'rgba(229,231,235,0.35)'} />);
    }
  }
  const tapHandler = pick && !pick.disabled ? (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget; const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * w; const py = ((e.clientY - r.top) / r.height) * h;
    const x = Math.round(x0 + ((px - pad) / (w - 2 * pad)) * (x1 - x0)); const y = Math.round(y0 + ((h - pad - py) / (h - 2 * pad)) * (y1 - y0));
    if (x >= x0 && x <= x1 && y >= y0 && y <= y1) pick.onPick(x, y);
  } : undefined;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: Math.max(w, 340), touchAction: 'manipulation', cursor: pick ? 'crosshair' : undefined }} role="img" aria-label={label ?? 'a coordinate plane'} onClick={tapHandler}>
      <defs>
        <clipPath id={clip}><rect x={pad} y={pad} width={w - 2 * pad} height={h - 2 * pad} /></clipPath>
        <marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker>
      </defs>
      <rect x={pad} y={pad} width={w - 2 * pad} height={h - 2 * pad} fill="rgba(0,0,0,0.3)" rx="4" />
      {xs.map((v) => <line key={`gx${v}`} x1={X(v)} x2={X(v)} y1={Y(y0)} y2={Y(y1)} stroke={COL.grid} />)}
      {ys.map((v) => <line key={`gy${v}`} x1={X(x0)} x2={X(x1)} y1={Y(v)} y2={Y(v)} stroke={COL.grid} />)}
      <line x1={X(x0)} x2={X(x1)} y1={Y(ay)} y2={Y(ay)} stroke={COL.muted} strokeWidth="1.3" />
      <line x1={X(ax)} x2={X(ax)} y1={Y(y0)} y2={Y(y1)} stroke={COL.muted} strokeWidth="1.3" />
      {xs.filter((v) => Math.abs(v) > 1e-9).map((v) => <T key={`tx${v}`} x={X(v)} y={Math.min(h - 6, Y(ay) + 12)} text={f2(v)} size={8} color={COL.muted} />)}
      {ys.filter((v) => Math.abs(v) > 1e-9).map((v) => <T key={`ty${v}`} x={Math.max(10, X(ax) - 4)} y={Y(v) + 3} text={f2(v)} size={8} color={COL.muted} anchor="end" />)}
      <g clipPath={`url(#${clip})`}>
        {shade}
        {rects}
        {field}
        {layers.vlines?.map((v, i) => <g key={`v${i}`}><line x1={X(v.x)} x2={X(v.x)} y1={Y(y0)} y2={Y(y1)} stroke={COL.ask} strokeDasharray="4 4" />{v.label && <T x={X(v.x) + 4} y={pad + 12} text={v.label} color={COL.ask} size={10} anchor="start" />}</g>)}
        {layers.hlines?.map((v, i) => <g key={`h${i}`}><line x1={X(x0)} x2={X(x1)} y1={Y(v.y)} y2={Y(v.y)} stroke={COL.ask} strokeDasharray="4 4" />{v.label && <T x={w - pad - 4} y={Y(v.y) - 4} text={v.label} color={COL.ask} size={10} anchor="end" />}</g>)}
        {layers.fns?.map((f, i) => <path key={`f${i}`} d={curve(f.fn, f.from ?? x0, f.to ?? x1)} fill="none" stroke={col(f.color ?? (i ? 'orange' : 'teal'))} strokeWidth="2.2" strokeDasharray={f.dashed ? '6 4' : undefined} strokeLinejoin="round" />)}
        {tangent}
        {layers.segments?.map((sg, i) => <line key={`s${i}`} x1={X(sg.a[0])} y1={Y(sg.a[1])} x2={X(sg.b[0])} y2={Y(sg.b[1])} stroke={col(sg.color ?? 'line')} strokeWidth="2" strokeDasharray={sg.dashed ? '5 4' : undefined} />)}
      </g>
      {layers.fns?.map((f, i) => { if (!f.label) return null; const xl = (f.to ?? x1) - (x1 - x0) * 0.08; const yv = evalFn(f.fn, xl); return Number.isFinite(yv) && yv >= y0 && yv <= y1 ? <T key={`fl${i}`} x={X(xl)} y={Y(yv) - 8} text={f.label} color={col(f.color ?? (i ? 'orange' : 'teal'))} size={10} bold /> : null; })}
      {layers.segments?.map((sg, i) => sg.label ? <T key={`sl${i}`} x={(X(sg.a[0]) + X(sg.b[0])) / 2} y={(Y(sg.a[1]) + Y(sg.b[1])) / 2 - 6} text={sg.label} size={10} /> : null)}
      {layers.vectors?.map((v, i) => { const [fx, fy] = v.from ?? [0, 0]; return <g key={`vec${i}`}><line x1={X(fx)} y1={Y(fy)} x2={X(fx + v.x)} y2={Y(fy + v.y)} stroke={col(v.color ?? 'orange')} strokeWidth="2.6" markerEnd={`url(#${arrowId})`} />{v.label && <T x={X(fx + v.x) + 8} y={Y(fy + v.y) - 6} text={v.label} color={col(v.color ?? 'orange')} size={11} bold anchor="start" />}</g>; })}
      {layers.points?.map((p, i) => <g key={`p${i}`}><circle cx={X(p.x)} cy={Y(p.y)} r="5" fill={p.open ? COL.dark : col(p.color ?? 'label')} stroke={col(p.color ?? 'label')} strokeWidth="2" />{p.label && <T x={X(p.x) + 8} y={Y(p.y) - 7} text={p.label} size={10} bold anchor="start" />}</g>)}
      {lattice}
      {pick?.arrows && pick.picked.map((p, i) => <line key={`pa${i}`} x1={X(0)} y1={Y(0)} x2={X(p[0])} y2={Y(p[1])} stroke={COL.ask} strokeWidth="2.6" markerEnd={`url(#${arrowId})`} />)}
      {pick && !pick.arrows && pick.picked.length === 2 && <line x1={X(pick.picked[0][0])} y1={Y(pick.picked[0][1])} x2={X(pick.picked[1][0])} y2={Y(pick.picked[1][1])} stroke={COL.ask} strokeWidth="2" strokeDasharray="5 4" />}
      {pick?.picked.map((p, i) => <T key={`pl${i}`} x={X(p[0]) + 8} y={Y(p[1]) - 8} text={`(${f2(p[0])}, ${f2(p[1])})`} color={COL.ask} size={10} bold anchor="start" />)}
      {children}
    </svg>
  );
}

export function PlotViz({ range, layers, w, h }: { range: [number, number, number, number]; layers: PlotLayers; w?: number; h?: number }) {
  return <PlotCanvas range={range} layers={layers} w={w} h={h} label="a graph" />;
}

/* ---------------- unit circle ---------------- */
export const SPECIAL_ANGLES = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
const RAD: Record<number, string> = { 0: '0', 30: 'π/6', 45: 'π/4', 60: 'π/3', 90: 'π/2', 120: '2π/3', 135: '3π/4', 150: '5π/6', 180: 'π', 210: '7π/6', 225: '5π/4', 240: '4π/3', 270: '3π/2', 300: '5π/3', 315: '7π/4', 330: '11π/6' };
export const radLabel = (deg: number) => RAD[((deg % 360) + 360) % 360] ?? `${deg}°`;
const COORD: Record<number, [string, string]> = {};
{
  // cos of the reference angle; sin(ref) = cos(90° − ref). Signs come from the quadrant.
  const V: Record<number, string> = { 0: '1', 30: '√3/2', 45: '√2/2', 60: '1/2', 90: '0' };
  for (const d of SPECIAL_ANGLES) {
    const m = d % 180; const ref = m <= 90 ? m : 180 - m;
    const c = Math.cos((d * Math.PI) / 180); const sn = Math.sin((d * Math.PI) / 180);
    const sg = (x: number, t: string) => (Math.abs(x) < 1e-9 ? '0' : (x < 0 ? '−' : '') + t);
    COORD[d] = [sg(c, V[ref]), sg(sn, V[90 - ref])];
  }
}
export const unitCoords = (deg: number) => COORD[((deg % 360) + 360) % 360];

export function UnitCircleCanvas({ angle, showCoords, radians, onPick, picked, disabled }: { angle?: number; showCoords?: boolean; radians?: boolean; onPick?: (deg: number) => void; picked?: number | null; disabled?: boolean }) {
  const W = 300; const H = 300; const cx = 150; const cy = 150; const R = 108;
  const P = (d: number, r = R) => [cx + r * Math.cos((d * Math.PI) / 180), cy - r * Math.sin((d * Math.PI) / 180)] as const;
  const sel = picked ?? angle;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 340 }} role="img" aria-label="the unit circle">
      <circle cx={cx} cy={cy} r={R} fill="rgba(0,0,0,0.3)" stroke={COL.line} strokeWidth="1.5" />
      <line x1={cx - R - 18} x2={cx + R + 18} y1={cy} y2={cy} stroke={COL.muted} /><line x1={cx} x2={cx} y1={cy - R - 18} y2={cy + R + 18} stroke={COL.muted} />
      {sel !== undefined && sel !== null && (() => { const [px, py] = P(sel); const large = sel > 180 ? 1 : 0; const [ax, ay] = P(sel, 26); return <g>
        <path d={`M ${cx + 26} ${cy} A 26 26 0 ${large} 0 ${ax} ${ay}`} fill="none" stroke={COL.orange} strokeWidth="2" />
        <line x1={cx} y1={cy} x2={px} y2={py} stroke={COL.ask} strokeWidth="2.4" />
        {showCoords && <><line x1={px} y1={py} x2={px} y2={cy} stroke={COL.teal} strokeDasharray="4 3" /><line x1={px} y1={py} x2={cx} y2={py} stroke={COL.teal} strokeDasharray="4 3" /></>}
        <T x={cx + 34} y={cy - 8} text={radians ? radLabel(sel) : `${sel}°`} color={COL.orange} size={11} bold anchor="start" />
        {showCoords && unitCoords(sel) && <T x={px + (px > cx ? 6 : -6)} y={py + (py < cy ? -10 : 18)} text={`(${unitCoords(sel)![0]}, ${unitCoords(sel)![1]})`} color={COL.ask} size={11} bold anchor={px > cx ? 'start' : 'end'} />}
      </g>; })()}
      {SPECIAL_ANGLES.map((d) => { const [px, py] = P(d); const on = sel === d; return <g key={d}>
        <circle cx={px} cy={py} r={on ? 7 : 5} fill={on ? COL.ask : COL.label} stroke={COL.dark} strokeWidth="1.5" />
        {onPick && <circle cx={px} cy={py} r="16" fill="transparent" style={{ cursor: disabled ? 'default' : 'pointer' }} onClick={() => !disabled && onPick(d)} role="button" aria-label={`${d} degrees`} />}
      </g>; })}
      <T x={cx + R + 14} y={cy - 6} text="1" size={9} color={COL.muted} /><T x={cx + 8} y={cy - R - 6} text="1" size={9} color={COL.muted} anchor="start" />
    </svg>
  );
}

/* ---------------- number line with negatives ---------------- */
export function NumLineViz({ min, max, step, points = [], ray, segment, jumps = [] }: { min: number; max: number; step?: number; points?: { x: number; label?: string; open?: boolean }[]; ray?: { from: number; dir: 'left' | 'right'; open: boolean }; segment?: { from: number; to: number; openLeft?: boolean; openRight?: boolean }; jumps?: { from: number; to: number }[] }) {
  const W = 360; const H = 96; const pad = 20; const X = (x: number) => pad + ((x - min) / (max - min)) * (W - 2 * pad); const y = 60;
  const st = step ?? niceStep(max - min, 12); const ticks: number[] = []; for (let v = Math.ceil(min / st) * st; v <= max + 1e-9; v += st) ticks.push(Math.round(v * 1e6) / 1e6);
  const dot = (x: number, open?: boolean, key?: string) => <circle key={key} cx={X(x)} cy={y} r="6" fill={open ? COL.dark : COL.ask} stroke={COL.ask} strokeWidth="2.4" />;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 400 }} role="img" aria-label={`a number line from ${min} to ${max}`}>
      <defs><marker id="nlA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={COL.line} /></marker><marker id="nlR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill={COL.ask} /></marker></defs>
      <line x1={pad - 10} x2={W - pad + 10} y1={y} y2={y} stroke={COL.line} strokeWidth="1.6" markerStart="url(#nlA)" markerEnd="url(#nlA)" />
      {ticks.map((v) => <g key={v}><line x1={X(v)} x2={X(v)} y1={y - 6} y2={y + 6} stroke={v === 0 ? COL.label : COL.muted} strokeWidth={v === 0 ? 2 : 1} /><T x={X(v)} y={y + 22} text={f2(v)} size={10} color={v === 0 ? COL.label : COL.muted} /></g>)}
      {segment && <line x1={X(segment.from)} x2={X(segment.to)} y1={y} y2={y} stroke={COL.ask} strokeWidth="5" />}
      {segment && <>{dot(segment.from, segment.openLeft, 'sl')}{dot(segment.to, segment.openRight, 'sr')}</>}
      {ray && <><line x1={X(ray.from)} x2={ray.dir === 'right' ? W - pad + 6 : pad - 6} y1={y} y2={y} stroke={COL.ask} strokeWidth="5" markerEnd="url(#nlR)" />{dot(ray.from, ray.open, 'ray')}</>}
      {jumps.map((j, i) => { const a = X(j.from); const b = X(j.to); const mid = (a + b) / 2; return <g key={i}><path d={`M ${a} ${y - 8} Q ${mid} ${y - 40} ${b} ${y - 8}`} fill="none" stroke={COL.teal} strokeWidth="2" markerEnd="url(#nlR)" /><T x={mid} y={y - 30} text={`${j.to - j.from > 0 ? '+' : '−'}${f2(Math.abs(j.to - j.from))}`} color={COL.teal} size={10} bold /></g>; })}
      {points.map((p, i) => <g key={`p${i}`}>{dot(p.x, p.open)}{p.label && <T x={X(p.x)} y={y - 14} text={p.label} size={11} bold />}</g>)}
    </svg>
  );
}

/* ---------------- geometry diagrams ---------------- */
import type { GeoItem } from '../../engine/academy/types';
export type { GeoItem };

export function GeoViz({ items, w = 320, h = 230 }: { items: GeoItem[]; w?: number; h?: number }) {
  const pts: [number, number][] = [];
  for (const it of items) {
    if (it.t === 'poly') pts.push(...it.pts); else if (it.t === 'seg' || it.t === 'line' || it.t === 'tick') pts.push(it.a, it.b);
    else if (it.t === 'circle') pts.push([it.c[0] - it.r, it.c[1] - it.r], [it.c[0] + it.r, it.c[1] + it.r]);
    else if (it.t === 'arc') pts.push(it.at); else if (it.t === 'pt' || it.t === 'text') pts.push(it.p);
  }
  if (!pts.length) pts.push([0, 0], [1, 1]);
  const minX = Math.min(...pts.map((p) => p[0])); const maxX = Math.max(...pts.map((p) => p[0])); const minY = Math.min(...pts.map((p) => p[1])); const maxY = Math.max(...pts.map((p) => p[1]));
  const pad = 30; const k = Math.min((w - 2 * pad) / Math.max(1e-6, maxX - minX), (h - 2 * pad) / Math.max(1e-6, maxY - minY));
  const ox = (w - (maxX - minX) * k) / 2; const oy = (h - (maxY - minY) * k) / 2;
  const X = (x: number) => ox + (x - minX) * k; const Y = (y: number) => h - oy - (y - minY) * k;
  const out: ReactNode[] = []; const labels: ReactNode[] = [];
  items.forEach((it, i) => {
    const c = col(it.t === 'text' || it.t === 'tick' ? undefined : it.color);
    if (it.t === 'poly') {
      out.push(<polygon key={i} points={it.pts.map((p) => `${X(p[0])},${Y(p[1])}`).join(' ')} fill={it.open ? 'none' : it.fill ?? 'rgba(31,41,55,0.9)'} stroke={it.color ? c : COL.line} strokeWidth="2.2" strokeLinejoin="round" />);
      const cxm = it.pts.reduce((s, p) => s + X(p[0]), 0) / it.pts.length; const cym = it.pts.reduce((s, p) => s + Y(p[1]), 0) / it.pts.length;
      it.labels?.forEach((lb, j) => { if (!lb) return; const a = it.pts[j]; const b = it.pts[(j + 1) % it.pts.length]; const mx = (X(a[0]) + X(b[0])) / 2; const my = (Y(a[1]) + Y(b[1])) / 2; const dx = mx - cxm; const dy = my - cym; const d = Math.hypot(dx, dy) || 1; labels.push(<T key={`${i}-${j}`} x={mx + (dx / d) * 14} y={my + (dy / d) * 14 + 4} text={lb} color={lb.includes('?') ? COL.ask : COL.label} size={11} bold />); });
    } else if (it.t === 'seg') {
      out.push(<line key={i} x1={X(it.a[0])} y1={Y(it.a[1])} x2={X(it.b[0])} y2={Y(it.b[1])} stroke={it.color ? c : COL.line} strokeWidth="2" strokeDasharray={it.dashed ? '5 4' : undefined} markerEnd={it.arrow ? 'url(#geoA)' : undefined} />);
      if (it.label) labels.push(<T key={`l${i}`} x={(X(it.a[0]) + X(it.b[0])) / 2} y={(Y(it.a[1]) + Y(it.b[1])) / 2 - 7} text={it.label} color={it.label.includes('?') ? COL.ask : COL.label} size={11} bold />);
    } else if (it.t === 'line') {
      const dx = it.b[0] - it.a[0]; const dy = it.b[1] - it.a[1]; const L = 1000;
      out.push(<line key={i} x1={X(it.a[0] - dx * L)} y1={Y(it.a[1] - dy * L)} x2={X(it.a[0] + dx * L)} y2={Y(it.a[1] + dy * L)} stroke={it.color ? c : COL.muted} strokeWidth="1.6" />);
      if (it.label) labels.push(<T key={`l${i}`} x={X(it.b[0]) + 8} y={Y(it.b[1]) - 6} text={it.label} size={11} bold anchor="start" />);
    } else if (it.t === 'circle') {
      out.push(<circle key={i} cx={X(it.c[0])} cy={Y(it.c[1])} r={it.r * k} fill={it.fill ?? 'none'} stroke={it.color ? c : COL.line} strokeWidth="2" />);
      if (it.label) labels.push(<T key={`l${i}`} x={X(it.c[0])} y={Y(it.c[1]) - it.r * k - 6} text={it.label} size={11} bold />);
    } else if (it.t === 'arc') {
      const [vx, vy] = [X(it.at[0]), Y(it.at[1])]; const a1 = Math.atan2(Y(it.from[1]) - vy, X(it.from[0]) - vx); const a2 = Math.atan2(Y(it.to[1]) - vy, X(it.to[0]) - vx); const r = 22;
      if (it.right) { const u = [Math.cos(a1), Math.sin(a1)]; const v = [Math.cos(a2), Math.sin(a2)]; const s = 13; out.push(<path key={i} d={`M ${vx + u[0] * s} ${vy + u[1] * s} L ${vx + (u[0] + v[0]) * s} ${vy + (u[1] + v[1]) * s} L ${vx + v[0] * s} ${vy + v[1] * s}`} fill="none" stroke={COL.muted} strokeWidth="1.4" />); }
      else { let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; out.push(<path key={i} d={`M ${vx + r * Math.cos(a1)} ${vy + r * Math.sin(a1)} A ${r} ${r} 0 0 ${d > 0 ? 1 : 0} ${vx + r * Math.cos(a1 + d)} ${vy + r * Math.sin(a1 + d)}`} fill="none" stroke={it.color ? c : COL.orange} strokeWidth="2" />); }
      if (it.label) { let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; const m = a1 + d / 2; labels.push(<T key={`l${i}`} x={vx + (r + 16) * Math.cos(m)} y={vy + (r + 16) * Math.sin(m) + 4} text={it.label} color={it.label.includes('?') ? COL.ask : COL.orange} size={11} bold />); }
    } else if (it.t === 'pt') {
      out.push(<circle key={i} cx={X(it.p[0])} cy={Y(it.p[1])} r="4" fill={it.color ? c : COL.label} />);
      if (it.label) labels.push(<T key={`l${i}`} x={X(it.p[0]) + 8} y={Y(it.p[1]) - 7} text={it.label} size={11} bold anchor="start" />);
    } else if (it.t === 'text') labels.push(<T key={`t${i}`} x={X(it.p[0])} y={Y(it.p[1])} text={it.text} color={col(it.color ?? 'label')} size={it.size ?? 11} bold />);
    else if (it.t === 'tick') { const n = it.n ?? 1; const mx = (X(it.a[0]) + X(it.b[0])) / 2; const my = (Y(it.a[1]) + Y(it.b[1])) / 2; const ang = Math.atan2(Y(it.b[1]) - Y(it.a[1]), X(it.b[0]) - X(it.a[0])); for (let j = 0; j < n; j++) { const off = (j - (n - 1) / 2) * 5; const px = mx + Math.cos(ang) * off; const py = my + Math.sin(ang) * off; out.push(<line key={`${i}-${j}`} x1={px - Math.sin(ang) * 6} y1={py + Math.cos(ang) * 6} x2={px + Math.sin(ang) * 6} y2={py - Math.cos(ang) * 6} stroke={COL.label} strokeWidth="1.6" />); } }
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: Math.max(w, 340) }} role="img" aria-label="a geometry diagram">
      <defs><marker id="geoA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill={COL.line} /></marker></defs>
      {out}{labels}
    </svg>
  );
}

/* ---------------- matrices ---------------- */
export function MatViz({ mats, ops = [] }: { mats: { rows: (number | string)[][]; label?: string }[]; ops?: string[] }) {
  const cw = 34; const rh = 26; const gap = 30;
  const widths = mats.map((m) => Math.max(1, ...m.rows.map((r) => r.length)) * cw + 16);
  const rowsMax = Math.max(...mats.map((m) => m.rows.length)); const H = rowsMax * rh + 44;
  const W = widths.reduce((s, x) => s + x, 0) + gap * (mats.length - 1) + 20;
  let x = 10; const out: ReactNode[] = [];
  mats.forEach((m, i) => {
    const mw = widths[i]; const mh = m.rows.length * rh; const top = 22 + (rowsMax * rh - mh) / 2;
    out.push(<g key={i}>
      {m.label && <T x={x + mw / 2} y={14} text={m.label} size={11} bold />}
      <path d={`M ${x + 6} ${top} L ${x} ${top} L ${x} ${top + mh} L ${x + 6} ${top + mh}`} fill="none" stroke={COL.line} strokeWidth="1.6" />
      <path d={`M ${x + mw - 6} ${top} L ${x + mw} ${top} L ${x + mw} ${top + mh} L ${x + mw - 6} ${top + mh}`} fill="none" stroke={COL.line} strokeWidth="1.6" />
      {m.rows.map((r, ri) => r.map((v, ci) => <T key={`${ri}-${ci}`} x={x + 8 + ci * cw + cw / 2} y={top + ri * rh + 18} text={typeof v === 'number' ? f2(v) : v} color={v === '?' ? COL.ask : COL.label} size={13} />))}
    </g>);
    x += mw;
    if (i < mats.length - 1) { out.push(<T key={`op${i}`} x={x + gap / 2} y={22 + (rowsMax * rh) / 2 + 5} text={ops[i] ?? ''} size={15} bold />); x += gap; }
  });
  return <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: Math.min(W * 1.3, 420) }} role="img" aria-label="matrices">{out}</svg>;
}
