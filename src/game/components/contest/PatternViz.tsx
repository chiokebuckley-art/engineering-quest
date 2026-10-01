import type { ContestVisual, PatternCell } from '../../../engine/contest/visuals';
import { Svg, Lbl, AskBox, ShapeGlyph, IconGlyph, C } from './kit';

/**
 * Pattern Lab pictures: a pattern train (shapes and/or numbers in slots, "?" boxes, "…" gaps, captions under the
 * cells), a growing figure (steps of unit squares side by side, the asked step as a "?" box) and a function machine
 * (the machine with its rule, or "?" when the rule is hidden, over an in → out table). `small` = inside a tap choice.
 */

type TrainV = Extract<ContestVisual, { type: 'pattern' }>;
type GrowV = Extract<ContestVisual, { type: 'growing' }>;
type MachineV = Extract<ContestVisual, { type: 'machine' }>;

// Up to 8 shape slots stay on one row (about 0.83 scale on a 412 px phone); longer trains wrap into rows of equal length.
const SLOT = 44; const SLOT_H = 50; const GAP = 5; const GAP_CELL = 24; const MAX_ROW = 400; const ONE_ROW = 430;
/** Place captions under the cells ("1st", "47th"): big enough to read at phone scale. */
const CAP = 13; const CAP_ASK = 16;
const R = { s: 11, m: 17, l: 21 } as const;
const isGap = (c: PatternCell | null): boolean => !!c && c.shape === undefined && c.num === undefined;
const isNum = (c: PatternCell | null) => !!c && c.num !== undefined && !c.shape;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const DIR: Record<number, string> = { 0: 'up', 90: 'right', 180: 'down', 270: 'left' };
/** Spoken name of a cell for screen readers: "big red star", "orange triangle pointing right", or the number. */
const say = (c: PatternCell) => {
  if (c.num !== undefined && !c.shape) return String(c.num);
  const words = [c.size === 'l' ? 'big' : c.size === 's' ? 'small' : '', c.color ?? '', c.shape ?? '', c.num !== undefined ? String(c.num) : ''].filter(Boolean).join(' ');
  return c.rot !== undefined ? `${words} pointing ${DIR[c.rot]}` : words;
};

function CellBody({ c, cx, cy, scale = 1, numSize = 18 }: { c: PatternCell; cx: number; cy: number; scale?: number; numSize?: number }) {
  return (
    <g>
      {c.shape && <ShapeGlyph shape={c.shape} color={c.color} cx={cx} cy={cy} r={R[c.size ?? 'm'] * scale} rot={c.rot ?? 0} />}
      {c.num !== undefined && <Lbl x={cx} y={cy + numSize * 0.36} text={c.num} size={c.shape ? numSize * 0.8 : numSize} bold color={c.shape ? '#0f172a' : C.label} />}
    </g>
  );
}

/** A train of cells in slots, wrapping onto a second row on narrow screens. */
export function PatternTrain({ v, small }: { v: TrainV; small?: boolean }) {
  const cells = v.cells;
  if (small && cells.length === 1) {
    const c = cells[0];
    return (
      <Svg w={60} h={56} label={c ? say(c) : 'blank'} max={70}>
        {c ? <CellBody c={c} cx={30} cy={28} scale={1.35} numSize={24} /> : <AskBox x={8} y={6} w={44} h={44} />}
      </Svg>
    );
  }
  const digits = Math.max(1, ...cells.filter(isNum).map((c) => String(c!.num).length));
  const numW = Math.max(SLOT, 16 + digits * 11.5);
  const anyNum = cells.some(isNum);
  const width = (c: PatternCell | null) => (isGap(c) ? GAP_CELL : c === null ? (anyNum ? numW : SLOT) : isNum(c) ? numW : SLOT);
  // One row when it fits (it scales down a little on a phone); otherwise rows of equal length, so no cell is left alone.
  const rowWidth = (r: number[]) => r.reduce((s, i, k) => s + width(cells[i]) + (k ? GAP : 0), 0);
  const all = cells.map((_, i) => i);
  const nRows = rowWidth(all) <= ONE_ROW ? 1 : Math.ceil(rowWidth(all) / MAX_ROW);
  const per = Math.ceil(cells.length / nRows);
  const rows: number[][] = range(nRows).map((r) => all.slice(r * per, (r + 1) * per)).filter((r) => r.length);
  const W = Math.max(...rows.map(rowWidth)) + 12;
  const under = v.under?.some(Boolean);
  const rowH = SLOT_H + (under ? 20 : 0) + 10;
  const H = rows.length * rowH + 2;
  const named = cells.map((c, i) => { const cap = v.under?.[i]; const name = c === null ? '?' : isGap(c) ? '…' : say(c); return cap && !isGap(c) ? `${cap} ${name}` : name; }).join(', ');
  return (
    <Svg w={W} h={H} label={`pattern: ${named}`} max={small ? 110 : 440}>
      {rows.map((r, ri) => {
        let x = (W - rowWidth(r)) / 2; const y = 4 + ri * rowH;
        return r.map((i) => {
          const c = cells[i]; const w = width(c); const x0 = x; x += w + GAP;
          const cap = v.under?.[i];
          return (
            <g key={i}>
              {isGap(c) ? <Lbl x={x0 + w / 2} y={y + SLOT_H / 2 + 7} text="…" size={22} color={C.muted} bold />
                : <>
                  <rect x={x0} y={y} width={w} height={SLOT_H} rx={8} fill={C.panel} stroke="rgba(240,215,140,0.28)" strokeWidth={1.2} />
                  {c === null ? <AskBox x={x0 + 4} y={y + 4} w={w - 8} h={SLOT_H - 8} /> : <CellBody c={c} cx={x0 + w / 2} cy={y + SLOT_H / 2} />}
                </>}
              {cap && (c === null || cap === '?'
                ? <Lbl x={x0 + w / 2} y={y + SLOT_H + 17} text={cap} size={CAP_ASK} color={C.ask} bold />
                : <Lbl x={x0 + w / 2} y={y + SLOT_H + 15} text={cap} size={CAP} color={C.muted} />)}
            </g>
          );
        });
      })}
    </Svg>
  );
}

/** Steps of a growing figure side by side, labelled "Step 1", …; the asked step is a "?" box (after "…" when it is further on). */
export function GrowingFigure({ v, small }: { v: GrowV; small?: boolean }) {
  const boxes = v.steps.map((sq) => {
    const cs = sq.map((s) => s[0]); const rs = sq.map((s) => s[1]);
    const minC = Math.min(...cs); const minR = Math.min(...rs);
    return { minC, minR, w: Math.max(...cs) - minC + 1, h: Math.max(...rs) - minR + 1 };
  });
  const n = v.steps.length; const ask = v.ask;
  const nums = v.steps.map((_, i) => v.nums?.[i] ?? i + 1);
  /** A "…" goes before step i when the step numbers jump (and before the asked step when it is further on). */
  const jumpBefore = nums.map((k, i) => i > 0 && k > nums[i - 1] + 1);
  const dots = ask !== undefined && ask > nums[n - 1] + 1;
  const G = 16; const D = 22; const DOTS = (dots ? D : 0) + D * jumpBefore.filter(Boolean).length;
  const ASK_W = ask !== undefined ? 54 : 0; const LABEL_W = 46;
  const maxRows = Math.max(1, ...boxes.map((b) => b.h));
  const gaps = G * (n - 1 + (ask !== undefined ? 1 : 0)) + DOTS;
  // Each step takes its own width or the width of its "Step n" label, whichever is more; pick the biggest square size that fits.
  const slot = (w: number, uu: number) => Math.max(w * uu, LABEL_W);
  let u = Math.min(30, Math.floor(150 / maxRows));
  while (u > 5 && 16 + boxes.reduce((s, b) => s + slot(b.w, u), 0) + gaps + ASK_W > MAX_ROW) u--;
  const figH = Math.max(maxRows * u, ask !== undefined ? 56 : 0);
  const W = 16 + boxes.reduce((s, b) => s + slot(b.w, u), 0) + gaps + ASK_W; const base = 10 + figH; const H = base + 26;
  let x = 8;
  const midY = base - figH / 2 + 7;
  const parts = v.steps.map((sq, i) => {
    const gapDots = jumpBefore[i] ? <Lbl x={x + D / 2 - G / 2} y={midY} text="…" size={22} color={C.muted} bold /> : null;
    if (jumpBefore[i]) x += D;
    const b = boxes[i]; const sw = slot(b.w, u); const x0 = x + (sw - b.w * u) / 2; x += sw + G;
    const prev = i > 0 ? new Set(v.steps[i - 1].map(([c, r]) => `${c},${r}`)) : null;
    return (
      <g key={i}>
        {gapDots}
        {sq.map(([c, r], k) => {
          const fresh = !!v.showNew && !!prev && !prev.has(`${c},${r}`);
          return <rect key={k} x={x0 + (c - b.minC) * u} y={base - (r - b.minR + 1) * u} width={u} height={u} fill={fresh ? C.teal : C.brass} stroke={C.dark} strokeWidth={Math.max(1, u / 14)} rx={Math.min(3, u / 8)} />;
        })}
        <Lbl x={x0 + (b.w * u) / 2} y={base + 18} text={`Step ${nums[i]}`} size={12} color={C.label} />
      </g>
    );
  });
  const askX = x + (dots ? D : 0);
  return (
    <Svg w={W} h={H} label={`growing figure: ${v.steps.map((s, i) => `step ${nums[i]} has ${s.length} ${s.length === 1 ? 'square' : 'squares'}`).join(', ')}${ask !== undefined ? `, step ${ask} is asked` : ''}`} max={small ? 110 : 440}>
      {parts}
      {dots && <Lbl x={x + D / 2 - G / 2} y={midY} text="…" size={22} color={C.muted} bold />}
      {ask !== undefined && <>
        <AskBox x={askX} y={base - figH} w={ASK_W - 4} h={figH} />
        <Lbl x={askX + (ASK_W - 4) / 2} y={base + 18} text={`Step ${ask}`} size={12} color={C.ask} bold />
      </>}
    </Svg>
  );
}

/** A function machine (rule shown only when given) above its in → out table; "?" cells are blank boxes. */
export function MachineTable({ v, small }: { v: MachineV; small?: boolean }) {
  const W = 300; const top = 92; const head = 24; const rowH = 34; const colW = 84; const x0 = W / 2 - colW;
  const H = top + head + v.rows.length * rowH + 8;
  const rule = v.rule; const long = !!rule && rule.length > 7;
  const arrow = (x1: number, x2: number, y: number) => <g><line x1={x1} y1={y} x2={x2 - 8} y2={y} stroke={C.teal} strokeWidth={3} /><polygon points={`${x2},${y} ${x2 - 10},${y - 6} ${x2 - 10},${y + 6}`} fill={C.teal} /></g>;
  const cell = (val: number | '?', x: number, y: number) => (val === '?'
    ? <AskBox x={x + 12} y={y + 4} w={colW - 24} h={rowH - 8} />
    : <Lbl x={x + colW / 2} y={y + rowH / 2 + 6} text={val} size={17} bold color={C.label} />);
  return (
    <Svg w={W} h={H} label={`function machine, rule ${rule ?? 'hidden'}: ${v.rows.map((r) => `${r.input} in, ${r.output} out`).join('; ')}`} max={small ? 110 : 440}>
      {arrow(12, 78, 44)}
      <Lbl x={44} y={34} text="in" size={13} color={C.muted} />
      <rect x={80} y={12} width={140} height={64} rx={12} fill={C.navy} stroke={C.brass} strokeWidth={2.5} />
      <IconGlyph icon="gear" x={84} y={16} size={16} />
      <IconGlyph icon="gear" x={200} y={56} size={16} />
      {rule ? <Lbl x={150} y={44 + (long ? 5 : 7)} text={rule} size={long ? 14 : 20} bold color={C.gold} />
        : <Lbl x={150} y={47} text="?" size={28} bold color={C.ask} />}
      {!rule && <Lbl x={150} y={68} text="rule hidden" size={12} color={C.label} />}
      {arrow(222, 290, 44)}
      <Lbl x={256} y={34} text="out" size={13} color={C.muted} />
      <rect x={x0} y={top} width={colW * 2} height={head + v.rows.length * rowH} rx={8} fill={C.panel} stroke="rgba(240,215,140,0.35)" strokeWidth={1.2} />
      <line x1={x0 + colW} y1={top} x2={x0 + colW} y2={top + head + v.rows.length * rowH} stroke="rgba(240,215,140,0.35)" />
      <Lbl x={x0 + colW / 2} y={top + 17} text="In" size={13} bold color={C.teal} />
      <Lbl x={x0 + colW * 1.5} y={top + 17} text="Out" size={13} bold color={C.teal} />
      {v.rows.map((r, i) => {
        const y = top + head + i * rowH;
        return (
          <g key={i}>
            <line x1={x0} y1={y} x2={x0 + colW * 2} y2={y} stroke="rgba(240,215,140,0.25)" />
            {cell(r.input, x0, y)}
            {cell(r.output, x0 + colW, y)}
          </g>
        );
      })}
    </Svg>
  );
}
