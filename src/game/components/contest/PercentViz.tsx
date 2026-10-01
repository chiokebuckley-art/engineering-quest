import { useId } from 'react';
import type { ContestVisual } from '../../../engine/contest/visuals';
import { Svg, Lbl, AskBox, C, COLOR } from './kit';

/**
 * Multi-step % pictures. Bars: one bar per row, the start (100%) on top, then each step on the bar before it:
 * 'off' hatches the part taken away, 'on' adds a gold piece, 'take' lights up the part kept (the rest goes faint).
 * The amounts after the steps sit in a column on the right as "?" until `reveal`; with `ask: 'pct'` the amounts show
 * and the step percents are the "?". `grid` draws a start of 100 as a 10 × 10 hundred grid with a legend.
 * A step on a narrow part (a percent of a percent) is drawn zoomed: the part fills its row, joined to it by a wedge.
 * Small whole amounts are cut into countable pieces only when the amounts show (a "what percent" or worked picture),
 * so a child can never count the answer off the question picture.
 * `small` = drawn inside a tap-choice button: shapes only, no words.
 */
type V = Extract<ContestVisual, { type: 'pctsteps' }>;
type Step = V['steps'][number];

/** The whole and what is kept: steel, not one of the story colours (a "blue" part must not look like the start). */
const HAVE = '#7d96bf';
const HAVE_EDGE = '#cbd5e1';
const CELL = 'rgba(255, 255, 255, 0.05)';
const CELL_EDGE = '#475569';
const INK = '#0f172a';
const r2 = (n: number) => Math.round(n * 100) / 100;
const range = (n: number) => Array.from({ length: Math.max(0, n) }, (_, i) => i);
/** Width of monospace text at a font size (a little generous). */
const textW = (s: string, size: number) => s.length * size * 0.62;
/** A pattern id that is safe inside url(#…). */
const useSafeId = () => useId().replace(/[^a-zA-Z0-9_-]/g, '');

/** An amount as the picture writes it: $80 / $38.88 for money, 96% for a unit of '%', a plain number otherwise. */
export function pctAmountText(n: number, unit: string): string {
  const x = r2(n);
  if (unit === '$') return Number.isInteger(x) ? `$${x}` : `$${x.toFixed(2)}`;
  if (unit.startsWith('%')) return `${x}%`;
  return String(x);
}
/** The start and the amount after each step. */
export function pctStepAmounts(v: Pick<V, 'start' | 'steps'>): number[] {
  const out = [v.start];
  for (const s of v.steps) {
    const prev = out[out.length - 1]; const part = (prev * s.pct) / 100;
    out.push(s.kind === 'off' ? prev - part : s.kind === 'on' ? prev + part : part);
  }
  return out;
}
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
/** A colour word in a label ("blue", "not green") picks the shading colour; else the fallback (teal). */
function shadeOf(label: string, fallback: string = C.teal): string {
  const w = label.toLowerCase().split(/[^a-z]+/);
  if (w.includes('gold')) return C.gold;
  for (const k of Object.keys(COLOR) as (keyof typeof COLOR)[]) if (w.includes(k)) return COLOR[k];
  return fallback;
}

export function PercentSteps({ v, small }: { v: V; small?: boolean }) {
  return v.grid ? <HundredGrid v={v} small={small} /> : <StepBars v={v} small={small} />;
}

/** What one step row says: "Sale: −25%", "Tariff: +10%", "Kids: 40% of all", "Red helmets: 25% of the kids", "Drums: −40% of the band students". */
function caption(v: V, i: number, showPct: boolean): string {
  const s = v.steps[i]; const p = showPct ? `${s.pct}%` : '?%';
  const name = cap(s.label);
  const before = i > 0 && v.steps[i - 1].kind === 'take' ? v.steps[i - 1].label : '';
  if (s.kind === 'off') return `${name}: −${p}${before ? ` of the ${before}` : ''}`;
  if (s.kind === 'on') return `${name}: +${p}${before ? ` of the ${before}` : ''}`;
  const parent = i > 0 ? v.steps[i - 1].label : '';
  return `${name}: ${p} of ${parent ? `the ${parent}` : 'all'}`;
}
function describe(v: V, showAmounts: boolean, showPct: boolean, am: number[]): string {
  const parts = [`Start: ${pctAmountText(v.start, v.unit)}${v.unit === '$' || v.unit.startsWith('%') ? '' : ` ${v.unit}`}`];
  v.steps.forEach((_s, i) => parts.push(`${caption(v, i, showPct)}, then ${showAmounts ? pctAmountText(am[i + 1], v.unit) : 'an amount to find'}`));
  return `Percent steps. ${parts.join('. ')}.`;
}

/** Layout of the bar picture (exported for the tests). */
export const STEP_BARS = { W: 360, x0: 10, amtW: 76, gutter: 56, rowH: 60, barH: 26, barY: 22, zoom: 24 } as const;

function StepBars({ v, small }: { v: V; small?: boolean }) {
  const id = useSafeId();
  const am = pctStepAmounts(v);
  const showAmounts = !!v.reveal || v.ask === 'pct';
  const showPct = !!v.reveal || v.ask !== 'pct';
  const special = v.unit === '$' || v.unit.startsWith('%');
  const n = v.steps.length;
  const L = STEP_BARS;
  const W = small ? 100 : L.W;
  const headH = small ? 3 : special ? 4 : 18;
  const rowH = small ? 16 : L.rowH;
  const barH = small ? 10 : L.barH;
  const barY = small ? 3 : L.barY;
  const x0 = small ? 4 : L.x0;
  const amtW = small ? 0 : L.amtW;
  const amtX = W - 4 - amtW / 2;
  /** Tags on the bars end before the amount column. */
  const xEnd = small ? W - 4 : amtX - amtW / 2 - 4;
  /** The longest bar leaves a gutter where any tag fits (a 48-wide "?%" box and its gaps), so no step goes untagged. */
  const barMax = xEnd - (small ? 0 : L.gutter) - x0;
  const k = barMax / Math.max(...am, 1e-9);
  // whole units small enough to count are drawn as pieces (3 of 4 parts), but only when the amounts are shown:
  // hidden amounts drawn in pieces could be counted off the picture
  const pieces = showAmounts && !special && Number.isInteger(v.start) && v.start >= 2 && v.start <= 25 && am.every((a) => Math.abs(a - Math.round(a)) < 1e-9);
  // a step on a narrow part (after a 'take') is drawn zoomed: the part fills the row
  const zoomed = v.steps.map((_s, j) => !small && j > 0 && v.steps[j - 1].kind === 'take' && am[j] * k < barMax * 0.5);
  const tops: number[] = []; let yy = headH;
  for (let i = 0; i <= n; i++) { if (i > 0 && zoomed[i - 1]) yy += L.zoom; tops.push(yy); yy += rowH; }
  const H = yy + (small ? 1 : 4);
  // the colour of the amount after each row: the start's steel, a 'take' row's own colour, else the row before;
  // a part of a part never takes its parent's colour ("Apple trees" teal, then "With fruit" gold)
  const have: string[] = [HAVE]; const haveEdge: string[] = [HAVE_EDGE];
  v.steps.forEach((s, j) => {
    const t = s.kind === 'take';
    const own = t ? shadeOf(s.label, j > 0 && have[j] === C.teal ? C.gold : C.teal) : have[j];
    have.push(own); haveEdge.push(t ? C.line : haveEdge[j]);
  });
  /** The scale of each row: a zoomed row fits the part it starts from into the whole width. */
  const kOf = (i: number) => (i > 0 && zoomed[i - 1] ? barMax / am[i - 1] : k);
  const divs = (y: number, len: number, kk: number, on: boolean) => (on ? range(Math.round(len / kk) - 1).map((j) => <line key={`d${j}`} data-div="1" x1={x0 + (j + 1) * kk} y1={y} x2={x0 + (j + 1) * kk} y2={y + barH} stroke={INK} strokeWidth={small ? 1 : 1.6} />) : null);
  /**
   * Where a tag goes: in its segment [a, b] when it fits, else in the faint rest of a 'take' bar [b, rest], else just
   * past the end of the bar (the gutter keeps room for it). On a bar cut into pieces it always goes past the end, so
   * no divider is hidden.
   */
  const place = (a: number, b: number, rest: number, end: number, w: number, onBar: boolean): number | null => {
    if (small) return null;
    if (onBar && b - a >= w + 6) return (a + b) / 2;
    if (onBar && rest - b >= w + 8) return b + 4 + w / 2;
    if (xEnd - end >= w + 4) return end + 4 + w / 2;
    return null;
  };
  /** The step's percent on its bar, on a dark pill so it reads on any fill; a "?" box for a percent to find. */
  const tag = (key: string, a: number, b: number, rest: number, end: number, onBar: boolean, y: number, text: string, color: string, outColor = color) => {
    if (text.startsWith('?')) {
      const cx = place(a, b, rest, end, 48, onBar); if (cx === null) return null;
      return <g data-tag={key}>
        <rect x={cx - 24} y={y + 1} width={48} height={barH - 2} rx={6} fill={C.dark} stroke={C.ask} strokeWidth={2} strokeDasharray="5 3" />
        <Lbl x={cx - 6} y={y + barH / 2 + 6} text="?" size={17} bold color={C.ask} />
        <Lbl x={cx + 10} y={y + barH / 2 + 5} text="%" size={14} bold color={C.ask} />
      </g>;
    }
    const w = textW(text, 13) + 8; const cx = place(a, b, rest, end, w, onBar); if (cx === null) return null;
    const inside = onBar && cx < b;
    return <g data-tag={key}><rect x={cx - w / 2} y={y + 4} width={w} height={barH - 8} rx={4} fill={C.dark} opacity={0.92} /><Lbl x={cx} y={y + barH / 2 + 5} text={text} size={13} bold color={inside ? color : outColor} /></g>;
  };
  const startX = x0 + v.start * k;
  const rx = small ? 2 : 4;
  return (
    <Svg w={W} h={H} label={describe(v, showAmounts, showPct, am)} max={small ? 110 : 440}>
      <defs>
        <pattern id={`${id}h`} width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={8} height={8} fill="rgba(244, 114, 182, 0.12)" />
          <line x1={0} y1={0} x2={0} y2={8} stroke={C.ask} strokeWidth={2.2} opacity={0.55} />
        </pattern>
      </defs>
      {!small && !special && <Lbl x={amtX} y={13} text={v.unit} size={11} color={C.muted} />}
      {range(n + 1).map((i) => {
        const y = tops[i]; const by = y + barY;
        const amount = am[i];
        const amountNode = small ? null : (i === 0 || showAmounts)
          ? <Lbl x={amtX} y={by + barH / 2 + 6} text={pctAmountText(amount, v.unit)} size={16} bold color={i === 0 ? C.label : C.teal} />
          : <AskBox x={amtX - 22} y={by} w={44} h={barH} />;
        if (i === 0) {
          const e = x0 + v.start * k;
          return (
            <g key={i}>
              {!small && <Lbl x={x0} y={y + 14} text="Start" size={13} anchor="start" />}
              <rect x={x0} y={by} width={v.start * k} height={barH} rx={rx} fill={HAVE} stroke={HAVE_EDGE} strokeWidth={1.2} />
              {divs(by, v.start * k, k, pieces)}
              {tag('start', x0, e, e, e, !pieces, by, '100%', '#ffffff', C.label)}
              {amountNode}
            </g>
          );
        }
        const s: Step = v.steps[i - 1]; const prev = am[i - 1];
        const kk = kOf(i); const zoom = zoomed[i - 1];
        // worked pictures mark where the start ends on rows that grow or shrink the amount (a tag stays next to its piece, over the mark)
        const marked = !!v.reveal && !small && !zoom && s.kind !== 'take' && !v.steps.slice(0, i - 1).some((x) => x.kind === 'take');
        const cut = pieces && !zoom;
        const P = showPct ? `${s.pct}%` : '?%';
        const pc = have[i - 1], pe = haveEdge[i - 1];
        let body;
        if (s.kind === 'off') {
          const a = x0 + amount * kk, b = x0 + prev * kk;
          body = <>
            <rect x={x0} y={by} width={amount * kk} height={barH} rx={rx} fill={pc} stroke={pe} strokeWidth={1.2} />
            <rect x={a} y={by} width={(prev - amount) * kk} height={barH} fill={`url(#${id}h)`} stroke={C.ask} strokeWidth={1.4} strokeDasharray="5 3" />
            {divs(by, prev * kk, kk, cut)}
            {tag(`s${i}`, a, b, b, b, !cut, by, `−${P}`, C.ask)}
          </>;
        } else if (s.kind === 'on') {
          const a = x0 + prev * kk, b = x0 + amount * kk;
          body = <>
            <rect x={x0} y={by} width={prev * kk} height={barH} rx={rx} fill={pc} stroke={pe} strokeWidth={1.2} />
            <rect x={a} y={by} width={(amount - prev) * kk} height={barH} fill={C.gold} stroke={C.brass} strokeWidth={1.4} />
            {divs(by, amount * kk, kk, cut)}
            {tag(`s${i}`, a, b, b, b, !cut, by, `+${P}`, C.gold)}
          </>;
        } else {
          const shade = have[i]; const b = x0 + amount * kk, e = x0 + prev * kk;
          body = <>
            <rect x={x0} y={by} width={prev * kk} height={barH} rx={rx} fill={pc} fillOpacity={0.14} stroke={i === 1 ? C.muted : pc} strokeWidth={1.2} strokeDasharray="4 3" />
            <rect x={x0} y={by} width={amount * kk} height={barH} rx={rx} fill={shade} stroke={C.line} strokeWidth={1.2} />
            {divs(by, prev * kk, kk, cut)}
            {tag(`s${i}`, x0, b, e, e, !cut, by, P, '#ffffff', shade)}
          </>;
        }
        // the wedge: the narrow part on the row above, opened up to fill this row
        const wedge = zoom && (() => {
          const pk = kOf(i - 1); const pw = prev * pk; const top = tops[i - 1] + barY + barH + 2; const bot = y - 1;
          return <g data-zoom="1">
            <polygon points={`${x0},${top} ${x0 + pw},${top} ${x0 + barMax},${bot} ${x0},${bot}`} fill={pc} fillOpacity={0.14} />
            <line x1={x0 + pw} y1={top} x2={x0 + barMax} y2={bot} stroke={pc} strokeWidth={1.2} strokeDasharray="4 3" opacity={0.8} />
            <line x1={x0} y1={bot} x2={x0 + barMax} y2={bot} stroke={pc} strokeWidth={1.2} strokeDasharray="4 3" opacity={0.8} />
          </g>;
        })();
        const startMark = marked
          ? <line x1={startX} y1={by - 4} x2={startX} y2={by + barH + 4} stroke={C.gold} strokeWidth={1.4} strokeDasharray="3 4" opacity={0.85} />
          : null;
        return (
          <g key={i}>
            {wedge}
            {!small && <Lbl x={x0} y={y + 14} text={caption(v, i - 1, showPct)} size={13} anchor="start" color={showPct ? C.label : C.ask} />}
            {startMark}
            {body}
            {amountNode}
          </g>
        );
      })}
    </Svg>
  );
}

/** A hundred grid: 100 squares, the first step's share shaded row by row from the top, and a legend. */
function HundredGrid({ v, small }: { v: V; small?: boolean }) {
  const s = v.steps[0];
  const showAmounts = !!v.reveal || v.ask === 'pct';
  const showPct = !!v.reveal || v.ask !== 'pct';
  const am = pctStepAmounts(v);
  const per = v.start / 100;
  // squares coloured: the part taken (take), or the part left (off); none with no step
  const coloured = !s ? 0 : Math.round((s.kind === 'off' ? am[1] : s.kind === 'take' ? am[1] : v.start) / per);
  const shade = s ? shadeOf(s.label) : C.teal;
  const cell = small ? 9 : 19; const g0 = small ? 3 : 10;
  const W = small ? 96 : 360; const H = small ? 96 : 210;
  const grid = range(100).map((i) => {
    const r = Math.floor(i / 10), c = i % 10;
    return <rect key={i} x={g0 + c * cell} y={g0 + r * cell} width={cell} height={cell} fill={i < coloured ? shade : CELL} stroke={i < coloured ? INK : CELL_EDGE} strokeWidth={small ? 0.8 : 1} />;
  });
  const lx = g0 + 10 * cell + 16;
  const unitWord = v.unit.startsWith('%') || v.unit === '$' ? 'squares' : v.unit;
  const label = (() => {
    if (!s) return `A hundred grid of 100 ${unitWord}, none shaded`;
    const a = showAmounts ? `${coloured} of 100` : 'some';
    const p = showPct ? `${s.pct}%` : 'an unknown percent';
    if (s.kind === 'off') return `A hundred grid: ${a} ${unitWord} shaded, ${s.label} is ${p}`;
    return `A hundred grid: ${a} ${unitWord} shaded${s.label === 'shaded' ? '' : ` ${s.label}`}, ${p}`;
  })();
  const pctNode = (x: number, y: number, text: string) => (showPct
    ? <Lbl x={x} y={y} text={text} size={18} bold anchor="start" color={v.reveal && v.ask === 'pct' ? C.teal : C.label} />
    : <g><AskBox x={x} y={y - 20} w={40} h={28} /><Lbl x={x + 46} y={y} text="%" size={18} bold anchor="start" color={C.ask} /></g>);
  const amountNode = (x: number, y: number, n: number) => (showAmounts
    ? <Lbl x={x} y={y} text={`${n} of 100`} size={15} bold anchor="start" color={v.ask === 'pct' ? C.label : C.teal} />
    : <><AskBox x={x} y={y - 18} w={34} h={24} /><Lbl x={x + 40} y={y} text="of 100" size={15} bold anchor="start" /></>);
  return (
    <Svg w={W} h={H} label={label} max={small ? 110 : 440}>
      {grid}
      {!small && (
        <g>
          <Lbl x={lx} y={22} text={`100 ${unitWord}`} size={14} anchor="start" color={C.label} bold />
          {!s && <Lbl x={lx} y={50} text="= 100%" size={18} anchor="start" bold />}
          {s && s.kind !== 'off' && <>
            <rect x={lx} y={40} width={18} height={18} fill={shade} stroke={INK} />
            <Lbl x={lx + 26} y={55} text={s.label} size={15} anchor="start" />
            {amountNode(lx, 88, coloured)}
            {pctNode(lx, 124, `${s.pct}%`)}
          </>}
          {s && s.kind === 'off' && <>
            <rect x={lx} y={40} width={18} height={18} fill={shade} stroke={INK} />
            <Lbl x={lx + 26} y={55} text={s.label.replace(/^not\s+/i, '')} size={15} anchor="start" />
            {amountNode(lx, 84, coloured)}
            <rect x={lx} y={112} width={18} height={18} fill={CELL} stroke={CELL_EDGE} />
            <Lbl x={lx + 26} y={127} text={s.label} size={15} anchor="start" />
            {pctNode(lx, 162, `${s.pct}%`)}
          </>}
        </g>
      )}
    </Svg>
  );
}
