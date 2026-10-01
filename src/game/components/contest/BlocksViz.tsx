import type { ReactNode } from 'react';
import type { ContestVisual } from '../../../engine/contest/visuals';
import { blocksRowName, blocksSmallEdge, paintedCount, seenCubes } from '../../../engine/questions/spatialBlocks';
import { C, Svg, Lbl } from './kit';

/**
 * Spatial Blocks pictures. A true isometric view from the front-right: a cube at (row, col, z) shows its top (light),
 * its front, the +row side (mid), and its right, the +col side (dark). Row 0 is at the back. Cubes are drawn back to
 * front (row + col + z ascending), so nearer cubes cover farther ones exactly as they would in real life.
 */
type Iso = Extract<ContestVisual, { type: 'iso' }>;
type Paint = Extract<ContestVisual, { type: 'paintcube' }>;
type Pt = [number, number];
type Pal = { top: string; front: string; side: string };

const SQ3 = Math.sqrt(3) / 2;
const GOLD: Pal = { top: '#fde68a', front: '#d9a92b', side: '#8a6d17' };
const TEAL: Pal = { top: '#99f6e4', front: '#2dd4bf', side: '#0f8a7e' };
const PINK: Pal = { top: '#fbcfe8', front: '#f472b6', side: '#be185d' };
const pts = (p: Pt[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/** Screen projection with cube edge s for a stack `rows` deep and `top` cubes tall whose picture starts at (x0, y0). */
function projectorAt(rows: number, top: number, s: number, x0: number, y0: number) {
  const a = s * SQ3, b = s / 2;
  const ox = x0 + rows * a, oy = y0 + top * s;
  return (r: number, c: number, z: number): Pt => [ox + (c - r) * a, oy + (c + r) * b - z * s];
}
/** Screen projection for a grid `rows` deep and `top` cubes tall, with cube edge s, and the picture's size. */
function projector(rows: number, cols: number, top: number, s: number, pad: number) {
  return { P: projectorAt(rows, top, s, pad, pad), w: (rows + cols) * s * SQ3 + 2 * pad, h: ((rows + cols) / 2 + top) * s + 2 * pad };
}
/** The three faces the viewer sees of the cube at (r, c, z). */
const faces = (P: (r: number, c: number, z: number) => Pt, r: number, c: number, z: number) => ({
  top: [P(r, c, z + 1), P(r, c + 1, z + 1), P(r + 1, c + 1, z + 1), P(r + 1, c, z + 1)],
  front: [P(r + 1, c, z), P(r + 1, c + 1, z), P(r + 1, c + 1, z + 1), P(r + 1, c, z + 1)],
  side: [P(r, c + 1, z), P(r + 1, c + 1, z), P(r + 1, c + 1, z + 1), P(r, c + 1, z + 1)],
});
/** One solid cube: its three faces, light top, mid front, dark side. */
function solid(out: ReactNode[], key: string, P: (r: number, c: number, z: number) => Pt, r: number, c: number, z: number, pal: Pal, sw: number) {
  const f = faces(P, r, c, z);
  (['top', 'front', 'side'] as const).forEach((n) => out.push(<polygon key={`${key}${n}`} points={pts(f[n])} fill={pal[n]} stroke={C.dark} strokeWidth={sw} strokeLinejoin="round" />));
}
/** The floor square under (r, c). */
const floorSq = (key: string, P: (r: number, c: number, z: number) => Pt, r: number, c: number, sw: number) =>
  <polygon key={key} points={pts([P(r, c, 0), P(r, c + 1, 0), P(r + 1, c + 1, 0), P(r + 1, c, 0)])} fill="#1e293b" stroke="#475569" strokeWidth={sw * 0.8} />;

/**
 * An isometric stack. `ghost` makes a worked picture: the towers are lined up in one row (back row first, a gap between
 * rows) so every cube shows, the cubes that were hidden in the real stack are pink, and each tower's height is written
 * on its top. With `box`, ghost instead draws the cubes still needed to fill the box as see-through pink cubes.
 * `layers` adds the layers pulled apart (see Layered). Small pictures (tap choices) share one cube size.
 */
export function IsoStack({ v, small }: { v: Iso; small?: boolean }) {
  const heights = v.heights.map((row) => row.map((h) => Math.max(0, Math.round(h) || 0)));
  const box = v.box && v.box > 0 ? Math.round(v.box) : 0;
  if (v.layers && !box && !small) return <Layered heights={heights} worked={!!v.ghost} />;
  if (v.ghost && !box) return <LinedUp heights={heights} small={small} />;
  const rows = Math.max(1, heights.length), cols = Math.max(1, ...heights.map((r) => r.length));
  const top = Math.max(1, box, ...heights.flat());
  const s = small ? blocksSmallEdge(heights, box) : Math.min(56, 330 / ((rows + cols) * SQ3), 290 / ((rows + cols) / 2 + top));
  const pad = small ? 3 : 12;
  const { P, w, h } = projector(rows, cols, top, s, pad);
  const sw = small ? 0.9 : 1.4;
  const at = (r: number, c: number) => heights[r]?.[c] ?? 0;
  const out: ReactNode[] = [];

  // the floor under every square
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(floorSq(`f${r}-${c}`, P, r, c, sw));
  // the box's far walls, with a line at every cube
  if (box) {
    out.push(<polygon key="wb" points={pts([P(0, 0, 0), P(0, cols, 0), P(0, cols, box), P(0, 0, box)])} fill="#334155" fillOpacity={0.35} stroke="#64748b" strokeWidth={sw} />);
    out.push(<polygon key="wl" points={pts([P(0, 0, 0), P(rows, 0, 0), P(rows, 0, box), P(0, 0, box)])} fill="#334155" fillOpacity={0.5} stroke="#64748b" strokeWidth={sw} />);
    const grid: [Pt, Pt][] = [];
    for (let c = 1; c < cols; c++) grid.push([P(0, c, 0), P(0, c, box)]);
    for (let r = 1; r < rows; r++) grid.push([P(r, 0, 0), P(r, 0, box)]);
    for (let z = 1; z < box; z++) grid.push([P(0, 0, z), P(0, cols, z)], [P(0, 0, z), P(rows, 0, z)]);
    grid.forEach(([p, q], i) => out.push(<line key={`g${i}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#64748b" strokeWidth={sw * 0.7} />));
  }

  // cubes, back to front (row + col + z ascending); a worked box adds the cubes still needed, see-through and pink
  const cubes: { r: number; c: number; z: number; missing: boolean }[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const hh = at(r, c);
    for (let z = 0; z < Math.max(hh, v.ghost ? box : 0); z++) cubes.push({ r, c, z, missing: z >= hh });
  }
  cubes.sort((p, q) => p.r + p.c + p.z - (q.r + q.c + q.z) || p.z - q.z);
  for (const q of cubes) {
    const key = `${q.r}-${q.c}-${q.z}`;
    if (q.missing) {
      const f = faces(P, q.r, q.c, q.z);
      const op = { top: 0.22, front: 0.16, side: 0.12 };
      (['top', 'front', 'side'] as const).forEach((n) => out.push(<polygon key={`${key}${n}`} points={pts(f[n])} fill={C.ask} fillOpacity={op[n]} stroke={C.ask} strokeWidth={sw * 1.1} strokeDasharray={small ? '2 2' : '5 3'} strokeLinejoin="round" />));
    } else if (v.highlight) {
      const f = faces(P, q.r, q.c, q.z);
      (['top', 'front', 'side'] as const).forEach((n) => out.push(<polygon key={`${key}${n}`} points={pts(f[n])} fill={(v.highlight === n ? TEAL : GOLD)[n]} stroke={C.dark} strokeWidth={sw} strokeLinejoin="round" />));
    } else solid(out, key, P, q.r, q.c, q.z, GOLD, sw);
  }

  // the box's frame, drawn last: these edges are never behind a cube (the back corner is part of the walls above).
  // Edges that pass in front of the cubes are faint and dashed, like glass.
  if (box) {
    const edges: [Pt, Pt, boolean][] = [
      [P(0, 0, box), P(0, cols, box), false], [P(rows, 0, box), P(0, 0, box), false],
      [P(0, cols, 0), P(0, cols, box), false], [P(rows, 0, 0), P(rows, 0, box), false],
      [P(rows, 0, 0), P(rows, cols, 0), false], [P(rows, cols, 0), P(0, cols, 0), false],
      [P(0, cols, box), P(rows, cols, box), true], [P(rows, cols, box), P(rows, 0, box), true], [P(rows, cols, 0), P(rows, cols, box), true],
    ];
    edges.forEach(([p, q, near], i) => out.push(<line key={`rim${i}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#cbd5e1" strokeOpacity={near ? 0.55 : 0.95} strokeWidth={sw * (near ? 1.1 : 1.4)} strokeDasharray={near ? '6 4' : undefined} strokeLinecap="round" />));
  }
  return <Svg w={Math.round(w)} h={Math.round(h)} label={small ? 'A small stack of cubes' : box ? 'A box partly filled with cubes' : 'A stack of cubes'}>{out}</Svg>;
}

/**
 * The worked picture of a stack: its towers stood side by side, back row first, so no tower hides another. Cubes that
 * were hidden in the real stack are pink and each tower's height is on its top. Long line-ups wrap, a row or two per
 * line, and each line is only as tall as its own tallest tower.
 */
function LinedUp({ heights, small }: { heights: number[][]; small?: boolean }) {
  const rows = heights.length;
  const hidden = new Set(seenCubes(heights).filter((q) => q.shown === 0).map((q) => `${q.r},${q.c},${q.z}`));
  const groups = heights.map((row, r) => ({ r, towers: row.map((h, c) => ({ c, h })).filter((t) => t.h > 0) })).filter((g) => g.towers.length);
  const caption = !small && groups.length > 1 ? 18 : 0;
  type Line = typeof groups;
  // widths in units of the cube edge: a tower is √3 wide, 0.35 between towers, 1 between rows
  const unitsW = (gs: Line) => gs.reduce((t, g) => t + g.towers.length * (2 * SQ3 + 0.35) - 0.35, 0) + (gs.length - 1);
  const lineTop = (gs: Line) => Math.max(1, ...gs.flatMap((g) => g.towers.map((t) => t.h)));
  const maxW = small ? 92 : 340, maxH = small ? 92 : 330;
  let best = { s: 0, lines: [groups] };
  for (const per of [groups.length, Math.ceil(groups.length / 2), 1]) {
    const lines = Array.from({ length: Math.ceil(groups.length / per) }, (_, i) => groups.slice(i * per, i * per + per));
    const tall = lines.reduce((t, l) => t + lineTop(l) + 1.2, 0);
    const sz = Math.min(small ? 22 : 40, maxW / Math.max(...lines.map(unitsW)), (maxH - lines.length * caption) / tall);
    if (sz > best.s + 0.5) best = { s: sz, lines };
  }
  const s = best.s, a = s * SQ3, b = s / 2, pad = small ? 3 : 10, sw = small ? 0.9 : 1.3;
  const out: ReactNode[] = [];
  let W = 0, y = pad;
  best.lines.forEach((line) => {
    y += (lineTop(line) + 1.2) * s;
    const by = y;
    let x = pad;
    line.forEach((g) => {
      const x0 = x;
      g.towers.forEach((t) => {
        const cx = x + a;
        const P = (r: number, c: number, z: number): Pt => [cx + (c - r) * a, by + (c + r - 2) * b - z * s];
        out.push(floorSq(`f${g.r}-${t.c}`, P, 0, 0, sw));
        for (let z = 0; z < t.h; z++) solid(out, `${g.r}-${t.c}-${z}`, P, 0, 0, z, hidden.has(`${g.r},${t.c},${z}`) ? PINK : GOLD, sw);
        if (!small) { const fs = Math.max(11, Math.min(17, s * 0.55)); const [lx, ly] = P(0.5, 0.5, t.h); out.push(<Lbl key={`n${g.r}-${t.c}`} x={lx} y={ly + fs * 0.36} text={t.h} size={fs} color="#ffffff" bold />); }
        x += 2 * a + 0.35 * s;
      });
      if (caption) out.push(<Lbl key={`row${g.r}`} x={(x0 + x - 0.35 * s) / 2} y={by + 15} text={blocksRowName(g.r, rows)} size={12} color={C.muted} />);
      x += s - 0.35 * s;
    });
    W = Math.max(W, x - s + pad);
    y += caption;
  });
  return <Svg w={Math.round(W)} h={Math.round(y + 4)} label="The towers stood side by side, hidden cubes in pink, each tower's height on top">{out}</Svg>;
}

/** Layer colours, from the top layer down, so each pulled-apart layer matches its stripe in the whole stack. */
const LAYER_PAL = [GOLD, TEAL];
const LAYER_NAME = ['top', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

/**
 * A stack and its layers pulled apart: the whole stack on top, striped layer by layer, then each layer as a flat slab,
 * top layer first, named under it. Every cube of a slab shows, so each layer can be counted. `worked` draws only the
 * slabs, each with its number of cubes under it. Long rows of slabs wrap.
 */
function Layered({ heights, worked }: { heights: number[][]; worked: boolean }) {
  const rows = Math.max(1, heights.length), cols = Math.max(1, ...heights.map((r) => r.length));
  const K = Math.max(1, ...heights.flat());
  // layer j from the top (j = 0 is the top layer) holds the squares whose towers reach level K - j
  const slabs = Array.from({ length: K }, (_, j) => {
    const cells: [number, number][] = [];
    heights.forEach((row, r) => row.forEach((h, c) => { if (h >= K - j) cells.push([r, c]); }));
    cells.sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
    const R = Math.max(1, ...cells.map(([r]) => r + 1)), Cn = Math.max(1, ...cells.map(([, c]) => c + 1));
    return { j, cells, R, wU: (R + Cn) * SQ3, hU: (R + Cn) / 2 + 1 };
  });
  type Slab = (typeof slabs)[number];
  const capH = 18, titleH = worked ? 0 : 24, gap = 0.8, pad = 10, sw = 1.3;
  const stackW = (rows + cols) * SQ3, stackH = (rows + cols) / 2 + K;
  const maxW = 330, maxH = worked ? 340 : 420;
  const lineW = (l: Slab[]) => l.reduce((t, x) => t + x.wU, 0) + gap * (l.length - 1);
  const lineH = (l: Slab[]) => Math.max(...l.map((x) => x.hU));
  let best = { s: 0, lines: [slabs] };
  for (let per = K; per >= 1; per--) {
    const lines = Array.from({ length: Math.ceil(K / per) }, (_, i) => slabs.slice(i * per, i * per + per));
    const wU = Math.max(worked ? 0 : stackW, ...lines.map(lineW));
    const hU = (worked ? 0 : stackH + 0.5) + lines.reduce((t, l) => t + lineH(l), 0);
    const sz = Math.min(36, maxW / wU, (maxH - titleH - lines.length * capH) / hU);
    if (sz > best.s + 0.5) best = { s: sz, lines };
  }
  const s = best.s;
  const inner = Math.max(worked ? 0 : stackW * s, ...best.lines.map((l) => lineW(l) * s));
  const W = inner + 2 * pad;
  const out: ReactNode[] = [];
  let y = pad;
  if (!worked) {
    // the whole stack, striped layer by layer
    const P = projectorAt(rows, K, s, pad + (inner - stackW * s) / 2, y);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(floorSq(`f${r}-${c}`, P, r, c, sw));
    const cubes: [number, number, number][] = [];
    heights.forEach((row, r) => row.forEach((h, c) => { for (let z = 0; z < h; z++) cubes.push([r, c, z]); }));
    cubes.sort((p, q) => p[0] + p[1] + p[2] - (q[0] + q[1] + q[2]) || p[2] - q[2]);
    for (const [r, c, z] of cubes) solid(out, `s${r}-${c}-${z}`, P, r, c, z, LAYER_PAL[(K - 1 - z) % 2], sw);
    y += (stackH + 0.5) * s;
    out.push(<Lbl key="title" x={W / 2} y={y + 15} text="its layers, pulled apart:" size={13} color={C.muted} />);
    y += titleH;
  }
  best.lines.forEach((line, li) => {
    const lh = lineH(line) * s;
    let x = pad + (inner - lineW(line) * s) / 2;
    for (const slab of line) {
      const P = projectorAt(slab.R, 1, s, x, y + lh - slab.hU * s);
      slab.cells.forEach(([r, c]) => solid(out, `l${slab.j}-${r}-${c}`, P, r, c, 0, LAYER_PAL[slab.j % 2], sw));
      const n = slab.cells.length;
      const text = worked ? `${n} ${n === 1 ? 'cube' : 'cubes'}` : slab.j === K - 1 && K > 1 ? 'bottom' : LAYER_NAME[slab.j] ?? `${slab.j + 1}th`;
      out.push(<Lbl key={`c${li}-${slab.j}`} x={x + (slab.wU * s) / 2} y={y + lh + 14} text={text} size={12} color={worked ? C.label : C.muted} />);
      x += (slab.wU + gap) * s;
    }
    y += lh + capH;
  });
  return <Svg w={Math.round(W)} h={Math.round(y + 4)} label={worked ? 'The layers of the stack pulled apart, each with its number of cubes' : 'A stack of cubes, and its layers pulled apart'}>{out}</Svg>;
}

/* ------------------------------------------------------------------ */

const PAINT: Pal = { top: '#93c5fd', front: '#3b82f6', side: '#1d4ed8' };
/** Worked colours by painted faces: 3 corners, 2 edges, 1 face middles, 0 inside. Each a different hue and lightness. */
const BY_FACES: Record<number, Pal & { name: string }> = {
  3: { top: '#fca5a5', front: '#ef4444', side: '#991b1b', name: '3 painted faces' },
  2: { top: '#fef08a', front: '#facc15', side: '#a16207', name: '2 painted faces' },
  1: { top: '#99f6e4', front: '#2dd4bf', side: '#0f766e', name: '1 painted face' },
  0: { top: '#e2e8f0', front: '#94a3b8', side: '#475569', name: 'no paint, inside' },
};

/**
 * A big cube painted on the outside. `cut` shows it cut into small cubes: each square coloured by how many painted
 * faces its small cube has, the unpainted inside block lifted out beside it, and a key with the counts.
 */
export function PaintCube({ v, small }: { v: Paint; small?: boolean }) {
  const n = Math.max(1, Math.min(8, Math.round(v.n) || 1));
  const cut = !!v.cut && !small;
  const s = (small ? 92 : cut ? 200 : 230) / (2 * n * SQ3);
  const pad = small ? 3 : 12;
  const { P, w, h } = projector(n, n, n, s, pad);
  const sw = small ? 0.8 : 1.3;
  const edge = (x: number) => x === 0 || x === n - 1;
  const painted = (r: number, c: number, z: number) => (n === 1 ? 3 : [r, c, z].filter(edge).length);
  const out: ReactNode[] = [];
  const square = (key: string, p: Pt[], fill: string) => {
    if (cut) {
      // pull each square in a little so the small cubes look cut apart
      const cx = p.reduce((t, q) => t + q[0], 0) / 4, cy = p.reduce((t, q) => t + q[1], 0) / 4;
      p = p.map(([x, y]) => [cx + (x - cx) * 0.84, cy + (y - cy) * 0.84]);
    }
    out.push(<polygon key={key} points={pts(p)} fill={fill} stroke={C.dark} strokeWidth={sw} strokeLinejoin="round" />);
  };
  /** The three outside faces of a k × k × k block, square by square; colour(r, c, z, face) picks each square's fill. */
  const block = (id: string, Q: (r: number, c: number, z: number) => Pt, k: number, colour: (r: number, c: number, z: number, f: keyof Pal) => string) => {
    if (cut) out.push(<polygon key={`${id}seam`} points={pts([Q(0, 0, k), Q(0, k, k), Q(0, k, 0), Q(k, k, 0), Q(k, 0, 0), Q(k, 0, k)])} fill="#0b1220" />);
    for (let r = 0; r < k; r++) for (let c = 0; c < k; c++) square(`${id}t${r}-${c}`, [Q(r, c, k), Q(r, c + 1, k), Q(r + 1, c + 1, k), Q(r + 1, c, k)], colour(r, c, k - 1, 'top'));
    for (let c = 0; c < k; c++) for (let z = 0; z < k; z++) square(`${id}f${c}-${z}`, [Q(k, c, z), Q(k, c + 1, z), Q(k, c + 1, z + 1), Q(k, c, z + 1)], colour(k - 1, c, z, 'front'));
    for (let r = 0; r < k; r++) for (let z = 0; z < k; z++) square(`${id}s${r}-${z}`, [Q(r, k, z), Q(r + 1, k, z), Q(r + 1, k, z + 1), Q(r, k, z + 1)], colour(r, k - 1, z, 'side'));
  };
  block('b', P, n, (r, c, z, f) => (cut ? BY_FACES[painted(r, c, z)][f] : PAINT[f]));
  if (small) return <Svg w={Math.round(w)} h={Math.round(h)} label="A painted cube">{out}</Svg>;

  const fs = 13; const lineH = 24;
  if (!cut) {
    out.push(<Lbl key="cap" x={w / 2} y={h + 4} text={`${n} small cubes along each edge`} color={C.muted} size={fs} />);
    return <Svg w={Math.round(w)} h={Math.round(h + 14)} label={`A big cube, ${n} small cubes along each edge, painted on the outside, even the bottom`}>{out}</Svg>;
  }
  // the inside block, lifted out to the right: (n − 2) small cubes along each edge, no paint at all
  const m = n - 2;
  let W = w;
  if (m >= 1) {
    const si = Math.min(s, 100 / (2 * m * SQ3));
    const x0 = w - pad + 16, y0 = pad + (2 * n * s - 2 * m * si) / 2;
    block('i', projectorAt(m, m, si, x0, y0), m, (_r, _c, _z, f) => BY_FACES[0][f]);
    out.push(<Lbl key="incap" x={x0 + m * si * SQ3} y={y0 + 2 * m * si + 16} text="inside" color={C.muted} size={12} />);
    W = x0 + 2 * m * si * SQ3 + pad;
  }
  // the key: a small cube in each colour, and how many small cubes have that many painted faces
  const legend = [3, 2, 1, 0].map((k) => ({ k, cnt: paintedCount(n, k as 0 | 1 | 2 | 3) }));
  const y0 = h + 6;
  legend.forEach(({ k, cnt }, i) => {
    const y = y0 + i * lineH;
    solid(out, `lg${k}`, projectorAt(1, 1, 10, pad + 4, y + 1), 0, 0, 0, BY_FACES[k], 1);
    out.push(<Lbl key={`lt${k}`} x={pad + 30} y={y + 15} text={`${BY_FACES[k].name}: ${cnt}`} anchor="start" size={fs} color={C.label} />);
  });
  return <Svg w={Math.round(W)} h={Math.round(y0 + legend.length * lineH + 4)} label="The big cube cut into small cubes, coloured by how many painted faces each has, with the unpainted inside block lifted out">{out}</Svg>;
}
