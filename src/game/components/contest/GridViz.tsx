import type { ReactNode } from 'react';
import type { ContestVisual } from '../../../engine/contest/visuals';
import { countOrder, tanPoints, TAN_SMALL } from '../../../engine/questions/gridShapes';
import { C, COLOR, Svg, Lbl } from './kit';

/**
 * Mirror & Grid pictures. A grid shape is gold squares on a thin-lined grid (row 0 at the bottom): a dashed teal mirror
 * line, dashed pink "ghost" squares (the twins or the cut-out, in worked pictures), half squares, length labels written
 * outside the outline ("?" in pink = still to find), a polygon (named shapes, triangles on the grid) and dashed teal
 * worked lines (lines of symmetry, cuts, the box around a triangle). `plain` drops the grid lines: a figure drawn to
 * scale, read by its labels. A tangram is pieces on a 4 × 4 board, each its own colour; `outline` paints them all gold
 * and hides the cuts (the grid shows on top, so whole and half squares can be counted). `small` = inside a tap choice.
 */
type GridV = Extract<ContestVisual, { type: 'gridshape' }>;
type TanV = Extract<ContestVisual, { type: 'tangram' }>;
type Pt = [number, number];

const GOLD = '#f0d78c', GOLD_EDGE = '#8a6d17', GRID = '#475569', BOARD = '#13284f', PINK = '#f472b6', AMBER = '#fbbf24';
const pts = (p: Pt[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const K = (c: number, r: number) => `${c},${r}`;

/** The separate shapes in a set of squares (squares joined edge to edge), left to right. */
function shapesOf(cells: readonly Pt[]): Pt[][] {
  const left = new Map(cells.map((p) => [K(p[0], p[1]), p] as const)); const out: Pt[][] = [];
  while (left.size) {
    const first = left.values().next().value as Pt; left.delete(K(first[0], first[1]));
    const shape: Pt[] = [first]; const stack: Pt[] = [first];
    while (stack.length) {
      const [c, r] = stack.pop()!;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = K(c + dc, r + dr); const p = left.get(k); if (p) { left.delete(k); shape.push(p); stack.push(p); } }
    }
    out.push(shape);
  }
  return out.sort((a, b) => Math.min(...a.map((p) => p[0])) - Math.min(...b.map((p) => p[0])));
}

/** The corners of half square [col, row, corner]: the triangle whose square corner sits at that corner of the cell. */
function halfPts(c: number, r: number, k: number): Pt[] {
  const corners: Pt[] = [[c, r], [c + 1, r], [c + 1, r + 1], [c, r + 1]];
  return [corners[(k + 3) % 4], corners[k], corners[(k + 1) % 4]];
}

/* ------------------------------------------------------------------ */
/* Layout: the square size, the margins and where each length label goes */
/* ------------------------------------------------------------------ */

/** A label's box in SVG units (its dark outline included). */
export interface LabelBox { x0: number; x1: number; y0: number; y1: number }
export interface PlacedLabel { x: number; y: number; anchor: 'start' | 'middle' | 'end'; size: number; ask: boolean; text: string; box: LabelBox; side: number }
export interface GridLayout { s: number; w: number; h: number; padL: number; padR: number; padT: number; padB: number; W: number; H: number; labels: PlacedLabel[] }

/** One monospace character is about 0.6 of the font size wide (a little more, to be safe). */
const CH = 0.62;
/** Half the width of the dark outline drawn round every label. */
const STROKE = 1.5;
/** Space between a label and the edge it names. */
const OFF = 5.5;
/** Space kept between two labels. */
const GAP = 4;

export function labelBox(x: number, y: number, anchor: PlacedLabel['anchor'], size: number, text: string): LabelBox {
  const tw = text.length * CH * size; const x0 = anchor === 'start' ? x : anchor === 'end' ? x - tw : x - tw / 2;
  return { x0: x0 - STROKE, x1: x0 + tw + STROKE, y0: y - 0.75 * size - STROKE, y1: y + STROKE };
}
/** Do two boxes come closer than `gap` (a negative gap = overlap by more than that)? */
export const boxesMeet = (a: LabelBox, b: LabelBox, gap: number) => a.x0 - gap < b.x1 && b.x0 - gap < a.x1 && a.y0 - gap < b.y1 && b.y0 - gap < a.y1;

/**
 * Where everything goes. Each length label sits just outside the stretch it names. Labels of short stretches are placed
 * first; a label that would touch one already placed, or cover a shaded square, slides along its own stretch (or a
 * little further out) until it is clear. The margins then grow to fit the widest labels, so none is ever cut off.
 */
export function gridLayout(v: GridV, small?: boolean): GridLayout {
  const w = Math.max(1, Math.round(v.w)), h = Math.max(1, Math.round(v.h));
  const sides = small ? [] : v.sides ?? [];
  const maxW = small ? 96 : 330, maxH = small ? 84 : 290;
  const s = Math.min(small ? 22 : 46, maxW / w, maxH / h);
  const gy = (y: number) => (h - y) * s;
  const set = new Set((v.cells ?? []).map(([c, r]) => K(c, r)));
  const cellBoxes: LabelBox[] = (v.cells ?? []).map(([c, r]) => ({ x0: c * s, x1: (c + 1) * s, y0: gy(r + 1), y1: gy(r) }));
  const lenOf = (i: number) => Math.abs(sides[i].b[0] - sides[i].a[0]) + Math.abs(sides[i].b[1] - sides[i].a[1]);
  const order = sides.map((_, i) => i).sort((i, j) => lenOf(i) - lenOf(j) || i - j);
  // every place each label may go, best first (cells it would cover are already left out)
  const options = order.map((i): PlacedLabel[] => {
    const sd = sides[i]; const text = sd.text; const ask = text.trim() === '?'; const size = ask ? 15 : 13;
    const [ax, ay] = sd.a, [bx, by] = sd.b; const across = ay === by; const len = lenOf(i);
    const lo = across ? Math.min(ax, bx) : Math.min(ay, by); const mid = lo + len / 2;
    const ts = len >= 2 ? [0.5, 0.65, 0.35, 0.8, 0.2] : [0.5, 0.35, 0.65];
    const out: PlacedLabel[] = [];
    for (const far of [0, 7, 14]) for (const t of ts) {
      const at = lo + t * len; let x: number, y: number, anchor: PlacedLabel['anchor'] = 'middle';
      if (across) {
        const under = set.has(K(Math.floor(mid), ay)); // the shape is above this edge, so the label goes under it
        x = at * s; y = under ? gy(ay) + OFF + 0.75 * size + STROKE + far : gy(ay) - OFF - STROKE - far;
      } else {
        const left = set.has(K(ax, Math.floor(mid))); // the shape is to the right of this edge, so the label goes on its left
        x = left ? ax * s - OFF - STROKE - far : ax * s + OFF + STROKE + far; y = gy(at) + 0.375 * size; anchor = left ? 'end' : 'start';
      }
      const box = labelBox(x, y, anchor, size, text);
      if (!cellBoxes.some((cb) => boxesMeet(box, cb, -0.5))) out.push({ x, y, anchor, size, ask, text, box, side: i });
    }
    return out.length ? out : [];
  });
  // a short search: each label takes its best place that keeps clear of the labels already placed, and steps back when a later label has nowhere to go
  const pick: PlacedLabel[] = []; let best: PlacedLabel[] = []; let budget = 4000;
  const search = (k: number): boolean => {
    if (k === options.length) return true;
    if (--budget < 0) return false;
    for (const c of options[k]) {
      if (pick.some((l) => boxesMeet(c.box, l.box, GAP))) continue;
      pick.push(c); if (pick.length > best.length) best = [...pick];
      if (search(k + 1)) return true;
      pick.pop();
    }
    return false;
  };
  // if no layout keeps every label clear, the labels that could not be placed go in their first place anyway
  const labels: PlacedLabel[] = search(0) ? pick : [...best, ...options.slice(best.length).flatMap((o, j) => (o.length ? [o[0]] : fallback(order[best.length + j])))];
  function fallback(i: number): PlacedLabel[] {
    const sd = sides[i]; const size = sd.text.trim() === '?' ? 15 : 13; const [ax, ay] = sd.a, [bx, by] = sd.b;
    const x = ((ax + bx) / 2) * s, y = gy((ay + by) / 2) + 0.375 * size;
    return [{ x, y, anchor: 'middle', size, ask: size === 15, text: sd.text, box: labelBox(x, y, 'middle', size, sd.text), side: i }];
  }
  // margins: room for the labels, the worked lines and the mirror line
  const base = small ? 4 : v.axis || v.lines?.length ? 18 : 10;
  const xs = [0, w * s, ...labels.flatMap((l) => [l.box.x0, l.box.x1]), ...(v.lines ?? []).flatMap(([a, b]) => [a[0] * s - 3, a[0] * s + 3, b[0] * s - 3, b[0] * s + 3])];
  const ys = [0, h * s, ...labels.flatMap((l) => [l.box.y0, l.box.y1]), ...(v.lines ?? []).flatMap(([a, b]) => [gy(a[1]) - 3, gy(a[1]) + 3, gy(b[1]) - 3, gy(b[1]) + 3])];
  const padL = Math.max(base, Math.ceil(-Math.min(...xs)) + 3), padR = Math.max(base, Math.ceil(Math.max(...xs) - w * s) + 3);
  const padT = Math.max(base, Math.ceil(-Math.min(...ys)) + 3), padB = Math.max(base, Math.ceil(Math.max(...ys) - h * s) + 3);
  const moved = labels.map((l) => ({ ...l, x: l.x + padL, y: l.y + padT, box: { x0: l.box.x0 + padL, x1: l.box.x1 + padL, y0: l.box.y0 + padT, y1: l.box.y1 + padT } }));
  return { s, w, h, padL, padR, padT, padB, W: w * s + padL + padR, H: h * s + padT + padB, labels: moved.sort((a, b) => a.side - b.side) };
}

export function GridShape({ v, small }: { v: GridV; small?: boolean }) {
  const L = gridLayout(v, small); const { s, w, h, W, H } = L;
  const X = (x: number) => L.padL + x * s, Y = (y: number) => L.padT + (h - y) * s;
  const P = ([x, y]: Pt): Pt => [X(x), Y(y)];
  const cells = v.cells ?? [];
  const set = new Set(cells.map(([c, r]) => K(c, r)));
  const sw = small ? 0.7 : 1;
  const out: ReactNode[] = [];

  out.push(<rect key="bg" x={X(0)} y={Y(h)} width={w * s} height={h * s} rx={small ? 2 : 4} fill={v.plain ? 'none' : BOARD} />);
  if (!v.plain) {
    for (let x = 0; x <= w; x++) out.push(<line key={`gx${x}`} x1={X(x)} y1={Y(0)} x2={X(x)} y2={Y(h)} stroke={GRID} strokeWidth={sw} />);
    for (let y = 0; y <= h; y++) out.push(<line key={`gy${y}`} x1={X(0)} y1={Y(y)} x2={X(w)} y2={Y(y)} stroke={GRID} strokeWidth={sw} />);
  }
  // shaded squares and half squares (a plain figure is one smooth gold shape: no lines between its squares)
  // (a thin gold stroke closes the hairline seams the browser leaves between the squares)
  if (v.plain) { if (cells.length) out.push(<path key="cells" d={cells.map(([c, r]) => `M${X(c)} ${Y(r + 1)}h${s}v${s}h${-s}Z`).join('')} fill={GOLD} stroke={GOLD} strokeWidth={0.8} strokeLinejoin="miter" />); }
  else for (const [c, r] of cells) out.push(<rect key={`c${c}-${r}`} x={X(c)} y={Y(r + 1)} width={s} height={s} fill={GOLD} stroke={GOLD_EDGE} strokeWidth={sw} />);
  for (const [c, r, k] of v.halves ?? []) out.push(<polygon key={`h${c}-${r}`} points={pts(halfPts(c, r, k).map(P))} fill={GOLD} stroke={GOLD_EDGE} strokeWidth={sw} strokeLinejoin="round" />);
  if (v.poly?.length) out.push(<polygon key="poly" points={pts(v.poly.map(P))} fill={GOLD} stroke={GOLD_EDGE} strokeWidth={small ? 1.2 : 2} strokeLinejoin="round" />);
  // the outline: drawn bold when the question walks around it, or when the figure has no grid
  if (v.ask === 'perimeter' || v.plain) {
    const edges: [Pt, Pt][] = [];
    for (const [c, r] of cells) {
      if (!set.has(K(c, r - 1))) edges.push([[c, r], [c + 1, r]]);
      if (!set.has(K(c, r + 1))) edges.push([[c, r + 1], [c + 1, r + 1]]);
      if (!set.has(K(c - 1, r))) edges.push([[c, r], [c, r + 1]]);
      if (!set.has(K(c + 1, r))) edges.push([[c + 1, r], [c + 1, r + 1]]);
    }
    const col = v.ask === 'perimeter' ? AMBER : GOLD_EDGE;
    edges.forEach(([a, b], i) => out.push(<line key={`e${i}`} x1={X(a[0])} y1={Y(a[1])} x2={X(b[0])} y2={Y(b[1])} stroke={col} strokeWidth={small ? 1.6 : v.ask === 'perimeter' ? 3 : 2.2} strokeLinecap="round" />));
  }
  // ghost squares: the twins to shade, or the cut-out filled in
  if (v.plain) {
    // a figure drawn to scale: the cut-out is one pink piece with one dashed outline (no grid squares inside it)
    const gset = new Set((v.ghost ?? []).map(([c, r]) => K(c, r)));
    if (v.ghost?.length) out.push(<path key="ghost" d={v.ghost.map(([c, r]) => `M${X(c)} ${Y(r + 1)}h${s}v${s}h${-s}Z`).join('')} fill={PINK} fillOpacity={0.3} />);
    const ge: [Pt, Pt][] = [];
    for (const [c, r] of v.ghost ?? []) {
      if (!gset.has(K(c, r - 1))) ge.push([[c, r], [c + 1, r]]);
      if (!gset.has(K(c, r + 1))) ge.push([[c, r + 1], [c + 1, r + 1]]);
      if (!gset.has(K(c - 1, r))) ge.push([[c, r], [c, r + 1]]);
      if (!gset.has(K(c + 1, r))) ge.push([[c + 1, r], [c + 1, r + 1]]);
    }
    ge.forEach(([a, b], i) => out.push(<line key={`ge${i}`} x1={X(a[0])} y1={Y(a[1])} x2={X(b[0])} y2={Y(b[1])} stroke={PINK} strokeWidth={small ? 1 : 1.8} strokeDasharray="5 4" />));
  } else {
    for (const [c, r] of v.ghost ?? []) out.push(<rect key={`g${c}-${r}`} x={X(c) + 1.5} y={Y(r + 1) + 1.5} width={s - 3} height={s - 3} rx={2} fill={PINK} fillOpacity={0.22} stroke={PINK} strokeWidth={small ? 1 : 1.6} strokeDasharray={small ? '2 2' : '4 3'} />);
  }
  // the mirror line
  if (v.axis) {
    const e = small ? 3 : 10;
    const [x1, y1, x2, y2] = v.axis.dir === 'v' ? [X(v.axis.at), Y(0) + e, X(v.axis.at), Y(h) - e] : [X(0) - e, Y(v.axis.at), X(w) + e, Y(v.axis.at)];
    out.push(<line key="axis" x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.teal} strokeWidth={small ? 2 : 3.5} strokeDasharray={small ? '4 3' : '9 6'} strokeLinecap="round" />);
  }
  // worked lines: lines of symmetry, cuts, a box
  (v.lines ?? []).forEach(([a, b], i) => out.push(<line key={`l${i}`} x1={X(a[0])} y1={Y(a[1])} x2={X(b[0])} y2={Y(b[1])} stroke={C.teal} strokeWidth={small ? 1.6 : 2.6} strokeDasharray={small ? '3 3' : '7 5'} strokeLinecap="round" />));
  // numbers in the squares (worked pictures: count each square once; two separate shapes are each counted from 1)
  if (v.count && !small) {
    const fs = Math.max(8, Math.min(14, s * 0.42));
    shapesOf(cells).flatMap((shape) => countOrder(shape).map((p, i) => [p, i + 1] as const)).forEach(([[c, r], n]) => out.push(<text key={`n${c}-${r}`} x={X(c) + s / 2} y={Y(r) - s / 2 + fs * 0.36} fontSize={fs} fill={C.dark} fontFamily="var(--font-mono)" fontWeight={700} textAnchor="middle">{n}</text>));
    // each half square says "½", so the halves can be paired up
    for (const [c, r, k] of v.halves ?? []) {
      const t = halfPts(c, r, k); const cx = (t[0][0] + t[1][0] + t[2][0]) / 3, cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
      out.push(<text key={`hn${c}-${r}`} x={X(cx)} y={Y(cy) + fs * 0.3} fontSize={fs * 0.85} fill={C.dark} fontFamily="var(--font-mono)" fontWeight={700} textAnchor="middle">½</text>);
    }
  }
  // length labels outside the outline (placed by gridLayout so they never crowd each other or get cut off)
  L.labels.forEach((l) => out.push(<Lbl key={`s${l.side}`} x={l.x} y={l.y} text={l.text} color={l.ask ? PINK : C.label} size={l.size} bold={l.ask} anchor={l.anchor} />));

  const what = v.poly?.length ? 'a shape' : `${cells.length} shaded squares${v.halves?.length ? ` and ${v.halves.length} half squares` : ''}`;
  return <Svg w={W} h={H} label={`${what} on a ${w} by ${h} grid${v.axis ? ' with a dashed mirror line' : ''}`} max={small ? 100 : 420}>{out}</Svg>;
}

/* ------------------------------------------------------------------ */
/* Tangram                                                              */
/* ------------------------------------------------------------------ */

const AUTO = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'] as const;

export function Tangram({ v, small }: { v: TanV; small?: boolean }) {
  const N = 4; const s = small ? 21 : 68; const pad = small ? 3 : 10;
  const W = N * s + 2 * pad;
  const X = (x: number) => pad + x * s, Y = (y: number) => pad + (N - y) * s;
  const placed = v.pieces.map((p, i) => ({ p, i, at: tanPoints(p).map(([x, y]): Pt => [X(x), Y(y)]) }));
  const solid = placed.filter((q) => !q.p.ghost); const ghosts = placed.filter((q) => q.p.ghost);
  const grid = (key: string, stroke: string, width: number) => (
    <g key={key}>
      {Array.from({ length: N + 1 }, (_, k) => <line key={`x${k}`} x1={X(k)} y1={Y(0)} x2={X(k)} y2={Y(N)} stroke={stroke} strokeWidth={width} />)}
      {Array.from({ length: N + 1 }, (_, k) => <line key={`y${k}`} x1={X(0)} y1={Y(k)} x2={X(N)} y2={Y(k)} stroke={stroke} strokeWidth={width} />)}
    </g>
  );
  const centre = (at: Pt[]): Pt => [at.reduce((a, q) => a + q[0], 0) / at.length, at.reduce((a, q) => a + q[1], 0) / at.length];
  const out: ReactNode[] = [<rect key="bg" x={X(0)} y={Y(N)} width={N * s} height={N * s} rx={small ? 2 : 6} fill={BOARD} />];
  if (v.outline) {
    // one gold shape: a brass rim drawn under every piece, then the pieces painted over it with no cuts
    out.push(<g key="rim">{solid.map((q) => <polygon key={q.i} points={pts(q.at)} fill={GOLD} stroke={C.brass} strokeWidth={small ? 3 : 7} strokeLinejoin="round" />)}</g>);
    out.push(<g key="fill">{solid.map((q) => <polygon key={q.i} points={pts(q.at)} fill={GOLD} stroke={GOLD} strokeWidth={small ? 0.8 : 1.6} strokeLinejoin="round" />)}</g>);
    out.push(grid('grid', 'rgba(15,23,42,0.45)', small ? 0.6 : 1.2));
  } else {
    out.push(grid('grid', GRID, small ? 0.5 : 1));
    // a dim piece (left out of a count) is faded, so the pieces that count stand out
    out.push(<g key="pieces">{solid.map((q) => <polygon key={q.i} points={pts(q.at)} fill={COLOR[q.p.color ?? AUTO[q.i % AUTO.length]]} fillOpacity={q.p.dim ? 0.22 : 1} stroke={q.p.dim ? C.muted : C.dark} strokeWidth={small ? 1.2 : 2.6} strokeDasharray={q.p.dim ? (small ? '3 2' : '6 4') : undefined} strokeLinejoin="round" />)}</g>);
  }
  ghosts.forEach((q) => {
    const [cx, cy] = centre(q.at);
    out.push(<g key={`gh${q.i}`}><polygon points={pts(q.at)} fill={PINK} fillOpacity={0.12} stroke={PINK} strokeWidth={small ? 1.2 : 2.4} strokeDasharray={small ? '3 2' : '7 5'} strokeLinejoin="round" /><Lbl x={cx} y={cy + (small ? 4 : 8)} text="?" color={PINK} size={small ? 11 : 24} bold /></g>);
  });
  if (v.marks && !small) {
    // numbered in reading order (top row first, then left to right), the way a child counts
    const order = solid.filter((q) => !q.p.dim).sort((a, b) => { const [ax, ay] = centre(a.at), [bx, by] = centre(b.at); return Math.abs(ay - by) > s * 0.3 ? ay - by : ax - bx; });
    order.forEach((q, k) => {
      const [cx, cy] = centre(q.at);
      out.push(<Lbl key={`m${q.i}`} x={cx} y={cy + 6} text={v.marks === 'count' ? k + 1 : TAN_SMALL[q.p.kind]} color="#ffffff" size={17} bold />);
    });
  }
  const dim = solid.filter((q) => q.p.dim).length;
  const label = `${solid.length} tangram ${solid.length === 1 ? 'piece' : 'pieces'}${dim ? ` (${dim} faded)` : ''}${ghosts.length ? ' and a gap' : ''}${v.outline ? ', outline only' : ''}`;
  return <Svg w={W} h={W} label={label} max={small ? 92 : 300}>{out}</Svg>;
}
