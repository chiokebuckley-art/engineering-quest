import { useId } from 'react';
import type { ContestVisual } from '../../../engine/contest/visuals';
import { Svg, Lbl, AskBox, IconGlyph, C, COLOR } from './kit';

/**
 * Charts & Venn pictures. `Pictograph` draws a picture chart (rows of icons, half icons for half a key, a key line), a
 * tally chart (bundles of five) or, with `bar`, a bar chart with a grid line every `bar` units. `PieChart` draws
 * labelled slices with optional guide lines (`parts`) and percents (`showPct`). `VennDiagram` draws two or three
 * circles with a count in each region and "?" for the one to find. `small` = drawn inside a tap-choice button.
 */

type PictoV = Extract<ContestVisual, { type: 'picto' }>;
type PieV = Extract<ContestVisual, { type: 'pie' }>;
type VennV = Extract<ContestVisual, { type: 'venn' }>;

/** Width of monospace text at a font size (a little generous). */
const textW = (s: string, size: number) => s.length * size * 0.62;
const range = (n: number) => Array.from({ length: Math.max(0, n) }, (_, i) => i);
const fmt = (n: number) => String(Math.round(n * 100) / 100);
const ROW_HL = 'rgba(45, 212, 191, 0.14)';
/** A clip-path id that is safe inside url(#…). */
const useSafeId = () => useId().replace(/[^a-zA-Z0-9_-]/g, '');

export function Pictograph({ v, small }: { v: PictoV; small?: boolean }) {
  if (v.bar) return <BarChart v={v} small={small} />;
  if (v.tally) return <TallyChart v={v} small={small} />;
  return <PictoRows v={v} small={small} />;
}

/** Row labels down the left, a thin line, then the row's icons or marks. */
function rowFrame(v: PictoV, labelSize: number) {
  const hasLabels = v.rows.some((r) => r.label);
  const labelW = hasLabels ? Math.max(...v.rows.map((r) => textW(r.label, labelSize))) + 18 : 0;
  return { hasLabels, labelW };
}

function PictoRows({ v, small }: { v: PictoV; small?: boolean }) {
  const id = useSafeId();
  const LS = 14;
  const { hasLabels, labelW } = rowFrame(v, LS);
  const icons = v.rows.map((r, i) => (i === v.ask ? 0 : r.n / v.key));
  const maxIcons = Math.max(2, ...icons.map((n) => Math.ceil(n - 1e-9)));
  const valW = v.values ? 56 : 0;
  const GAP = 5;
  const S = Math.max(16, Math.min(28, Math.floor((400 - 20 - labelW - valW) / maxIcons) - GAP));
  const step = S + GAP;
  const titleH = v.title ? 32 : 6;
  const rowH = S + 16;
  const keyH = 36;
  const x0 = 10 + labelW;
  const W = Math.max(small ? 60 : 300, x0 + maxIcons * step + valW + 10);
  const H = titleH + v.rows.length * rowH + keyH;
  const say = v.rows.map((r, i) => `${r.label || 'row'}: ${i === v.ask ? 'unknown' : `${fmt(icons[i])} pictures`}`).join(', ');
  return (
    <Svg w={W} h={H} label={`${v.title} picture chart, each picture stands for ${v.key}. ${say}`} max={small ? 110 : 440}>
      {v.title && <Lbl x={W / 2} y={21} text={v.title} size={15} bold color={C.gold} />}
      {v.rows.map((r, i) => {
        const y = titleH + i * rowH;
        const n = icons[i]; const whole = Math.floor(n + 1e-9); const half = n - whole > 1e-9;
        const iy = y + (rowH - S) / 2 - 2;
        return (
          <g key={i}>
            {v.highlight?.includes(i) && <rect x={3} y={y} width={W - 6} height={rowH - 4} rx={8} fill={ROW_HL} stroke={C.teal} strokeWidth={1.5} />}
            {hasLabels && <Lbl x={x0 - 12} y={y + rowH / 2 + 3} text={r.label} size={LS} anchor="end" bold />}
            {hasLabels && <line x1={x0 - 5} x2={x0 - 5} y1={y + 3} y2={y + rowH - 7} stroke={C.muted} strokeOpacity={0.5} />}
            {i === v.ask ? <AskBox x={x0} y={y + 4} w={52} h={rowH - 12} /> : (
              <g>
                {range(whole).map((j) => <IconGlyph key={j} icon={v.icon} x={x0 + j * step} y={iy} size={S} />)}
                {half && (
                  <g>
                    <clipPath id={`${id}-h${i}`}><rect x={x0 + whole * step - 1} y={iy - 2} width={S / 2 + 1} height={S + 4} /></clipPath>
                    <g clipPath={`url(#${id}-h${i})`}><IconGlyph icon={v.icon} x={x0 + whole * step} y={iy} size={S} /></g>
                    <line x1={x0 + whole * step + S / 2} x2={x0 + whole * step + S / 2} y1={iy} y2={iy + S} stroke={C.muted} strokeDasharray="2 2" />
                  </g>
                )}
              </g>
            )}
            {v.values && i !== v.ask && <Lbl x={W - 10} y={y + rowH / 2 + 4} text={`= ${fmt(r.n)}`} size={14} bold anchor="end" color={v.highlight?.includes(i) ? '#99f6e4' : C.label} />}
          </g>
        );
      })}
      <g>
        <Lbl x={10} y={H - 12} text="Key:" size={13} anchor="start" color={C.muted} />
        <IconGlyph icon={v.icon} x={56} y={H - 30} size={22} />
        <Lbl x={84} y={H - 12} text={`= ${v.key}`} size={14} bold anchor="start" />
        {Number.isInteger(v.key / 2) && v.rows.some((r, i) => i !== v.ask && (r.n / v.key) % 1) && (
          <g>
            <clipPath id={`${id}-k`}><rect x={150} y={H - 32} width={11} height={26} /></clipPath>
            <g clipPath={`url(#${id}-k)`}><IconGlyph icon={v.icon} x={150} y={H - 30} size={22} /></g>
            <Lbl x={170} y={H - 12} text={`= ${v.key / 2}`} size={14} bold anchor="start" />
          </g>
        )}
      </g>
    </Svg>
  );
}

const MARK = 10; const BUNDLE = 4 * MARK + 16;
const tallyW = (n: number, m = MARK, bundle = BUNDLE) => Math.floor(n / 5) * bundle + (n % 5) * m;
/** A bare tally (a tap choice) is drawn a little tighter, in one frame wide enough for 12 marks, so every choice is the same scale. */
const BARE_MARK = 8; const BARE_BUNDLE = 4 * BARE_MARK + 10;
/** Tally marks for n starting at (x, y), height h: four strokes and a slash across each bundle of five. */
function Marks({ n, x, y, h, m = MARK, bundle = BUNDLE }: { n: number; x: number; y: number; h: number; m?: number; bundle?: number }) {
  return (
    <g stroke={C.label} strokeWidth={3.5} strokeLinecap="round">
      {range(n).map((k) => {
        const g = Math.floor(k / 5), r = k % 5, gx = x + g * bundle;
        return r < 4
          ? <line key={k} x1={gx + r * m + 3} x2={gx + r * m + 3} y1={y} y2={y + h} />
          : <line key={k} x1={gx - 3} y1={y + h - 4} x2={gx + 3 * m + 9} y2={y + 4} stroke="#fb923c" strokeWidth={3} />;
      })}
    </g>
  );
}

function TallyChart({ v, small }: { v: PictoV; small?: boolean }) {
  const bare = v.rows.length === 1 && !v.rows[0].label && !v.title;
  if (bare) {
    const n = v.rows[0].n;
    const W = tallyW(Math.max(12, n), BARE_MARK, BARE_BUNDLE) + 16;
    // the same frame for every count, marks from the left, so the choices line up and fit inside their buttons
    return <Svg w={W} h={46} label={`a tally of ${n} marks`} max={small ? 84 : 200}><Marks n={n} x={8} y={7} h={32} m={BARE_MARK} bundle={BARE_BUNDLE} /></Svg>;
  }
  const LS = 14;
  const { hasLabels, labelW } = rowFrame(v, LS);
  const maxN = Math.max(1, ...v.rows.map((r) => r.n));
  const valW = v.values ? 56 : 0;
  const titleH = v.title ? 32 : 6;
  const rowH = 50;
  const x0 = 14 + labelW;
  const W = Math.max(small ? 60 : 300, x0 + tallyW(maxN) + 20 + valW);
  const H = titleH + v.rows.length * rowH + 6;
  return (
    <Svg w={W} h={H} label={`${v.title} tally chart. ${v.rows.map((r) => `${r.label}: ${r.n} marks`).join(', ')}`} max={small ? 110 : 440}>
      {v.title && <Lbl x={W / 2} y={21} text={v.title} size={15} bold color={C.gold} />}
      {v.rows.map((r, i) => {
        const y = titleH + i * rowH;
        return (
          <g key={i}>
            {v.highlight?.includes(i) && <rect x={3} y={y} width={W - 6} height={rowH - 4} rx={8} fill={ROW_HL} stroke={C.teal} strokeWidth={1.5} />}
            {hasLabels && <Lbl x={x0 - 14} y={y + rowH / 2 + 3} text={r.label} size={LS} anchor="end" bold />}
            {hasLabels && <line x1={x0 - 7} x2={x0 - 7} y1={y + 3} y2={y + rowH - 7} stroke={C.muted} strokeOpacity={0.5} />}
            {i === v.ask ? <AskBox x={x0} y={y + 4} w={52} h={rowH - 12} /> : <Marks n={r.n} x={x0} y={y + 8} h={rowH - 20} />}
            {v.values && i !== v.ask && <Lbl x={W - 10} y={y + rowH / 2 + 4} text={`= ${r.n}`} size={14} bold anchor="end" color={v.highlight?.includes(i) ? '#99f6e4' : C.label} />}
          </g>
        );
      })}
    </Svg>
  );
}

function BarChart({ v, small }: { v: PictoV; small?: boolean }) {
  const step = v.bar!;
  const vals = v.rows.map((r, i) => (i === v.ask ? 0 : r.n));
  const maxV = Math.max(step, ...vals, v.line ?? 0);
  // at least half a step of room above the tallest bar for its number
  const top = Math.ceil((maxV + 0.6 * step) / step) * step;
  const lines = Math.round(top / step);
  const every = lines > 12 ? 2 : 1;
  const W = 360; const x0 = 50; const x1 = W - 10;
  const legend = v.line !== undefined;
  const titleH = v.title ? 34 : 10;
  const plotH = 200; const yTop = titleH + 6; const yB = yTop + plotH;
  const H = yB + 28;
  const Y = (n: number) => yB - (n / top) * plotH;
  const yLine = legend ? Y(v.line!) : 0;
  const k = v.rows.length; const slot = (x1 - x0) / k; const bw = Math.min(46, slot * 0.62);
  const catSize = slot < 58 ? 11 : 12;
  const say = v.rows.map((r, i) => `${r.label}: ${i === v.ask ? 'unknown' : v.values ? r.n : 'a bar'}`).join(', ');
  return (
    <Svg w={W} h={H} label={`${v.title} bar chart, grid lines every ${step}. ${say}`} max={small ? 110 : 440}>
      {v.title && <Lbl x={legend ? 12 : W / 2} y={22} text={v.title} size={15} bold color={C.gold} anchor={legend ? 'start' : 'middle'} />}
      {legend && (
        <g>
          <line x1={W - 118} x2={W - 92} y1={17} y2={17} stroke={C.teal} strokeWidth={2.5} strokeDasharray="6 4" />
          <Lbl x={W - 86} y={22} text={`mean ${fmt(v.line!)}`} size={13} bold anchor="start" color={C.teal} />
        </g>
      )}
      {range(lines + 1).map((j) => {
        const n = j * step; const y = Y(n);
        return (
          <g key={j}>
            <line x1={x0} x2={x1} y1={y} y2={y} stroke={j ? '#334155' : C.muted} strokeWidth={j ? 1 : 1.8} />
            {j % every === 0 && <Lbl x={x0 - 7} y={y + 4} text={fmt(n)} size={11} anchor="end" color={C.muted} />}
          </g>
        );
      })}
      <line x1={x0} x2={x0} y1={yTop - 4} y2={yB} stroke={C.muted} strokeWidth={1.8} />
      {v.rows.map((r, i) => {
        const x = x0 + slot * i + (slot - bw) / 2; const on = v.highlight?.includes(i);
        // the bar to find is an empty dashed column the full height of the grid, so its outline says nothing about its value
        return i === v.ask
          ? <AskBox key={i} x={x} y={yTop + 2} w={bw} h={yB - yTop - 4} />
          : <rect key={i} x={x} y={Y(r.n)} width={bw} height={yB - Y(r.n)} rx={2} fill={on ? C.teal : C.brass} stroke={C.dark} strokeWidth={1.2} />;
      })}
      {legend && <line x1={x0} x2={x1} y1={yLine} y2={yLine} stroke={C.teal} strokeWidth={2.5} strokeDasharray="6 4" />}
      {v.rows.map((r, i) => {
        const x = x0 + slot * i + (slot - bw) / 2; const on = v.highlight?.includes(i);
        // a value printed where the mean line runs would be struck through: lift it just above the line
        let yL = Y(r.n) - 6;
        if (legend && yLine > yL - 14 && yLine < yL + 4) yL = yLine - 4;
        return (
          <g key={i}>
            {v.values && i !== v.ask && <Lbl x={x + bw / 2} y={yL} text={fmt(r.n)} size={13} bold color={on ? '#99f6e4' : C.label} />}
            <Lbl x={x + bw / 2} y={yB + 18} text={r.label} size={catSize} bold />
          </g>
        );
      })}
    </Svg>
  );
}

const PIE_FILL = [COLOR.blue, COLOR.orange, COLOR.green, COLOR.purple, COLOR.yellow, COLOR.red];

/** Label size and the push-out of a highlighted slice in a pie. */
const PIE_LS = 13; const PIE_OFF = 7;

export function PieChart({ v, small }: { v: PieV; small?: boolean }) {
  const total = v.slices.reduce((s, x) => s + x.v, 0) || 1;
  const W = small ? 96 : 350;
  const cx = W / 2;
  let a = -Math.PI / 2;
  const parts = v.slices.map((s, i) => { const a0 = a; a += (s.v / total) * 2 * Math.PI; return { s, i, a0, a1: a, mid: (a0 + a) / 2, share: s.v / total, off: i === v.highlight ? PIE_OFF : 0, w: textW(s.label, PIE_LS) }; });
  // the pie shrinks a little when a long label (a worked "Grapes 12") would not fit beside it
  let r = small ? 40 : 90;
  if (!small) for (const p of parts) { const c = Math.abs(Math.cos(p.mid)); if (c > 0.3) r = Math.min(r, (cx - 6 - p.w) / c - 14 - p.off); }
  r = Math.max(60, Math.floor(r));
  // label boxes around a centre at (0, 0): the anchor x is kept inside the picture, then the height is fitted to them
  const labels = small ? [] : parts.map(({ mid, off, w }) => {
    const c = Math.cos(mid), sn = Math.sin(mid);
    const anchor: 'start' | 'end' | 'middle' = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
    let x = cx + (r + 14 + off) * c;
    if (anchor === 'end') x = Math.max(x, 6 + w); else if (anchor === 'start') x = Math.min(x, W - 6 - w); else x = Math.min(Math.max(x, 6 + w / 2), W - 6 - w / 2);
    const y = (r + 14 + off) * sn + 5 + (sn > 0.6 ? 5 : sn < -0.6 ? -3 : 0);
    return { x, y, anchor };
  });
  const lift = v.highlight !== undefined ? PIE_OFF : 0;
  const titleH = !small && v.title ? 30 : 0;
  const minY = Math.min(-r - lift, ...labels.map((l) => l.y - 12));
  const maxY = Math.max(r + lift, ...labels.map((l) => l.y + 4));
  const pad = small ? 8 : 6;
  const cy = titleH + pad - minY;
  const H = cy + maxY + pad;
  const pt = (ang: number, rr: number, ox = 0, oy = 0) => [cx + ox + rr * Math.cos(ang), cy + oy + rr * Math.sin(ang)] as const;
  const say = v.slices.map((s, i) => `${s.label}${i === v.ask ? ' unknown' : v.showPct ? ` ${fmt((s.v / total) * 100)} percent` : ''}`).join(', ');
  return (
    <Svg w={W} h={H} label={`${v.title ?? 'pie chart'}: ${say}${v.parts ? `, guide lines cut it into ${v.parts} equal parts` : ''}`} max={small ? 110 : 440}>
      {titleH > 0 && <Lbl x={W / 2} y={21} text={v.title!} size={15} bold color={C.gold} />}
      {parts.map(({ i, a0, a1, mid, share, off }) => {
        const ox = off * Math.cos(mid), oy = off * Math.sin(mid);
        const fill = PIE_FILL[i % PIE_FILL.length];
        const style = { fill, fillOpacity: 0.85, stroke: i === v.highlight ? C.gold : C.dark, strokeWidth: i === v.highlight ? 3 : 2 };
        if (share >= 0.9999) return <circle key={i} cx={cx} cy={cy} r={r} {...style} />;
        const [sx, sy] = pt(a0, r, ox, oy); const [ex, ey] = pt(a1, r, ox, oy);
        return <path key={i} d={`M ${cx + ox} ${cy + oy} L ${sx} ${sy} A ${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${ex} ${ey} Z`} {...style} />;
      })}
      {v.parts && range(v.parts).map((j) => {
        const ang = -Math.PI / 2 + (j * 2 * Math.PI) / v.parts!; const [ex, ey] = pt(ang, r);
        return <line key={j} x1={cx} y1={cy} x2={ex} y2={ey} stroke={C.dark} strokeWidth={small ? 1 : 1.5} strokeDasharray="4 3" strokeOpacity={0.85} />;
      })}
      {!small && parts.map(({ s, i, mid, share, off }) => {
        const l = labels[i];
        const [px, py] = pt(mid, r * (share < 0.15 ? 0.7 : 0.6) + off);
        return (
          <g key={i}>
            <Lbl x={l.x} y={cy + l.y} text={s.label} size={PIE_LS} bold anchor={l.anchor} />
            {i === v.ask
              ? <Lbl x={px} y={py + 7} text="?" size={22} bold color={C.ask} />
              : v.showPct && share >= 0.07 && <Lbl x={px} y={py + 5} text={`${fmt(share * 100)}%`} size={share < 0.15 ? 12 : 14} bold color="#ffffff" />}
          </g>
        );
      })}
    </Svg>
  );
}

const SET_STROKE = [COLOR.blue, COLOR.orange, COLOR.green];
const SET_TEXT = ['#93c5fd', '#fdba74', '#86efac'];

export function VennDiagram({ v, small }: { v: VennV; small?: boolean }) {
  const three = v.sets.length >= 3;
  const W = 340;
  const head = v.total !== undefined ? 26 : 6;
  const sized = !three && !!v.sizes;
  const top = head + (sized ? 14 : 0); // circles move down to make room for the circle counts
  const H = top + (three ? 290 : 228);
  const circles = three
    ? [{ x: 132, y: top + 104, r: 64 }, { x: 208, y: top + 104, r: 64 }, { x: 170, y: top + 170, r: 64 }]
    : [{ x: 130, y: top + 128, r: 76 }, { x: 210, y: top + 128, r: 76 }];
  const at: Record<string, [number, number]> = three
    ? { A: [104, top + 92], B: [236, top + 92], C: [170, top + 206], AB: [170, top + 80], AC: [130, top + 150], BC: [210, top + 150], ABC: [170, top + 126], none: [304, top + 262] }
    : { A: [92, top + 132], AB: [170, top + 132], B: [248, top + 132], none: [304, top + 196] };
  // three circles: the overlap regions are thin, so their "?" is a smaller box set where the region is widest
  const ask3: Record<string, [number, number, number, number]> = { AB: [170, top + 88, 28, 24], AC: [134, top + 150, 28, 24], BC: [206, top + 150, 28, 24], ABC: [170, top + 124, 26, 22] };
  const names = three
    ? [{ x: 64, y: top + 30 }, { x: 276, y: top + 30 }, { x: 170, y: top + 270 }]
    : [{ x: 98, y: top + (sized ? 14 : 30) }, { x: 242, y: top + (sized ? 14 : 30) }];
  const say = Object.entries(v.counts).map(([k, n]) => `${k}: ${n}`).join(', ');
  return (
    <Svg w={W} h={H} label={`Venn diagram of ${v.sets.join(', ')}. ${say}${v.sizes ? `, circle totals ${v.sizes.join(' and ')}` : ''}${v.total !== undefined ? `, ${v.total} in all` : ''}`} max={small ? 110 : 440}>
      {v.total !== undefined && <Lbl x={W / 2} y={18} text={`${v.total} in all`} size={15} bold color={v.total === '?' ? C.ask : C.label} />}
      <rect x={4} y={head} width={W - 8} height={H - head - 4} rx={10} fill="rgba(12, 31, 68, 0.55)" stroke={C.muted} strokeWidth={1.5} />
      {circles.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={SET_STROKE[i]} fillOpacity={0.16} stroke={SET_STROKE[i]} strokeWidth={2.5} />)}
      {v.sets.map((s, i) => {
        const size = v.sizes?.[i];
        return (
          <g key={i}>
            <Lbl x={names[i].x} y={names[i].y} text={s} size={14} bold color={SET_TEXT[i]} />
            {size !== undefined && <Lbl x={names[i].x} y={names[i].y + 18} text={`${size} in this circle`} size={12} bold color={size === '?' ? C.ask : C.label} />}
          </g>
        );
      })}
      {Object.entries(v.counts).map(([k, n]) => {
        const p = at[k]; if (!p) return null;
        if (n !== '?') return <Lbl key={k} x={p[0]} y={p[1] + 7} text={n} size={20} bold />;
        const [ax, ay, aw, ah] = (three && ask3[k]) || [p[0], p[1] - 1, 44, 36];
        return <AskBox key={k} x={ax - aw / 2} y={ay - ah / 2} w={aw} h={ah} />;
      })}
      {'none' in v.counts && <Lbl x={at.none[0]} y={at.none[1] - 24} text="outside" size={11} color={C.muted} />}
    </Svg>
  );
}
