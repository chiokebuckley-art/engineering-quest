import { useState, type ReactNode } from 'react';
import type { ColorName, ContestIcon, ContestVisual } from '../../../engine/contest/visuals';
import { COLORS, CONTEST_ICONS } from '../../../engine/contest/visuals';
import { Svg, Lbl, IconGlyph, C, MONO } from './kit';

/**
 * Logic Lite pictures. A logic grid is names down the side and things (or places) across the top, with a picture over
 * each thing when its name is a picture ("cat", "red hat"); ✓ and ✗ only in a worked picture. A question grid starts
 * empty, and the child can mark it: tap a box once for ✗, twice for ✓, a third time to clear it.
 * Speakers are robots (or people) in a column, each with a speech bubble. A scene is either one row of things standing
 * on the ground, left to right (every item n = 1, all different), or one band of pictures per group with its label;
 * a `hidden` item is a shut box with "?" on it. `small` = inside a tap choice.
 */

type GridV = Extract<ContestVisual, { type: 'logicgrid' }>;
type SpeakV = Extract<ContestVisual, { type: 'speakers' }>;
type SceneV = Extract<ContestVisual, { type: 'scene' }>;

const NAME = '#e2e8f0';
const CELL = '#10264f';
const EDGE = 'rgba(240,215,140,0.35)';
const NO = '#f87171';
const TINT: ColorName[] = ['blue', 'red', 'green', 'purple', 'orange', 'yellow'];
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** "red hat" → a hat tinted red, "cats" → a cat, "1st" → no picture. */
function iconOf(label: string): { icon: ContestIcon; color?: ColorName } | null {
  const words = label.toLowerCase().split(/\s+/); const last = words[words.length - 1];
  const known = CONTEST_ICONS as string[];
  const icon = known.includes(last) ? last : known.includes(last.replace(/s$/, '')) ? last.replace(/s$/, '') : null;
  if (!icon) return null;
  return { icon: icon as ContestIcon, color: words.find((w) => (COLORS as string[]).includes(w)) as ColorName | undefined };
}
/** Split words into lines of at most `max` characters. */
function wrap(text: string, max: number): string[] {
  const out: string[] = []; let cur = '';
  for (const w of text.split(/\s+/)) {
    if (cur && (cur + ' ' + w).length > max) { out.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) out.push(cur);
  return out;
}
function Tick({ x, y, s }: { x: number; y: number; s: number }) {
  return <path d={`M ${x - s * 0.55} ${y} L ${x - s * 0.15} ${y + s * 0.42} L ${x + s * 0.6} ${y - s * 0.48}`} fill="none" stroke={C.teal} strokeWidth={Math.max(2, s * 0.22)} strokeLinecap="round" strokeLinejoin="round" />;
}
/**
 * Grey, uncoloured pictures: the people beside a grid and the thing drawn on a shut box carry no colour, so a red shirt
 * never hints at a red hat and a box never hints at the colour inside it.
 */
const GREY = 'logic-grey';
const GreyDef = () => <defs><filter id={GREY}><feColorMatrix type="saturate" values="0" /></filter></defs>;
function Cross({ x, y, s }: { x: number; y: number; s: number }) {
  const r = s * 0.38;
  return <path d={`M ${x - r} ${y - r} L ${x + r} ${y + r} M ${x + r} ${y - r} L ${x - r} ${y + r}`} stroke={NO} strokeWidth={Math.max(1.6, s * 0.14)} strokeLinecap="round" opacity={0.85} />;
}

/* ------------------------------------------------------------------ */
/* Logic grid                                                          */
/* ------------------------------------------------------------------ */

type Mark = 'yes' | 'no' | null;
/** One tap: empty → ✗ → ✓ → empty. */
const NEXT = (m: Mark | undefined): Mark => (m === 'no' ? 'yes' : m === 'yes' ? null : 'no');

export function LogicGrid({ v, small }: { v: GridV; small?: boolean }) {
  // The child's own marks on a question grid. They belong to this grid only: a grid with other names or things
  // (the next question) starts empty again.
  const key = `${v.rows.join('|')}/${v.cols.join('|')}`;
  const [own, setOwn] = useState<{ key: string; m: Record<string, Mark> }>({ key, m: {} });
  const nr = v.rows.length, nc = v.cols.length;
  const pics = v.cols.map(iconOf); const hasPic = pics.some(Boolean);
  // "red hat", "blue hat", …: the picture already shows a hat, so the header says just the colour (bigger words).
  const lastWords = v.cols.map((c) => c.split(' ').at(-1)); const shared = nc > 1 && v.cols.every((c) => c.includes(' ')) && new Set(lastWords).size === 1 && pics.every(Boolean);
  const heads = shared ? v.cols.map((c) => c.split(' ').slice(0, -1).join(' ')) : v.cols;
  const named = `grid: ${v.rows.join(', ')} by ${v.cols.join(', ')}${v.marks ? `; ${v.rows.map((r, i) => `${r}: ${v.cols.filter((_, j) => v.marks![i]?.[j] === 'yes').join(' ') || '?'}`).join(', ')}` : ''}`;
  if (small) {
    const S = Math.min(16, Math.floor(84 / (nc + 1)));
    const W = (nc + 1) * S + 4, H = (nr + 1) * S + 4;
    return (
      <Svg w={W} h={H} label={named} max={96}>
        {v.cols.map((c, j) => { const p = pics[j]; return p ? <IconGlyph key={j} icon={p.icon} color={p.color} x={2 + (j + 1) * S + 1} y={3} size={S - 2} /> : <Lbl key={j} x={2 + (j + 1.5) * S} y={S - 3} text={c.slice(0, 1)} size={S * 0.6} />; })}
        {v.rows.map((r, i) => <Lbl key={i} x={2 + S / 2} y={2 + (i + 1.7) * S} text={r.slice(0, 1)} size={S * 0.62} bold color={C.gold} />)}
        {v.rows.map((_, i) => v.cols.map((__, j) => {
          const x = 2 + (j + 1) * S, y = 2 + (i + 1) * S; const m = v.marks?.[i]?.[j];
          return <g key={`${i}-${j}`}><rect x={x} y={y} width={S} height={S} fill={CELL} stroke={EDGE} />{m === 'yes' && <Tick x={x + S / 2} y={y + S / 2} s={S * 0.8} />}{m === 'no' && <Cross x={x + S / 2} y={y + S / 2} s={S * 0.8} />}</g>;
        }))}
      </Svg>
    );
  }
  // Columns as wide as their words, but the whole grid stays phone-sized (about 380 wide). Every header is the full
  // word the worked steps use ("Put ✓ in Tia's tallest box"): when equal columns would squeeze a word below MIN (five
  // places: "tallest", "middle", "shortest"), each column gets the width its own word needs instead.
  const RW = Math.max(70, Math.max(...v.rows.map((r) => r.length)) * 9 + 40);
  const avail = 380 - RW - 6; const room = Math.floor(avail / nc);
  const CHAR = 0.62, MIN = 12;
  const fitIn = (w: number, c: string) => Math.min(12.5, (w - 8) / (c.length * CHAR));
  const longest = Math.max(...heads.map((c) => c.length));
  const base = Math.min(Math.max(nc >= 5 ? 52 : 58, Math.min(112, longest * 7 + 12)), room);
  let CWs = heads.map(() => base);
  if (heads.some((c) => fitIn(base, c) < MIN)) {
    const need = heads.map((c) => Math.max(46, Math.ceil(c.length * CHAR * MIN + 8)));
    const most = Math.max(...need); const spare = avail - sum(need);
    if (most <= room) CWs = heads.map(() => most);
    else if (spare >= 0) CWs = need.map((w) => w + Math.min(8, Math.floor(spare / nc)));
  }
  const xs = CWs.map((_, j) => RW + sum(CWs.slice(0, j)));
  const CH = 46, HH = hasPic ? 70 : 36;
  // The rows are robots in a truth-teller / fibber grid, people everywhere else.
  const rowIcon: ContestIcon = v.cols.includes('fibber') ? 'robot' : 'person';
  const tappable = !v.marks;
  const mine = own.key === key ? own.m : {};
  const tap = (i: number, j: number) => setOwn((o) => {
    const m = o.key === key ? { ...o.m } : {}; m[`${i}-${j}`] = NEXT(m[`${i}-${j}`]); return { key, m };
  });
  const TIP = tappable ? 24 : 0;
  const W = RW + sum(CWs) + 6, H = HH + nr * CH + 4 + TIP;
  const body: ReactNode = (
    <>
      <GreyDef />
      {heads.map((c, j) => {
        const x = xs[j], CW = CWs[j]; const p = pics[j];
        return (
          <g key={j}>
            <rect x={x + 2} y={2} width={CW - 4} height={HH - 6} rx={8} fill={C.navy} stroke={EDGE} />
            {p && <IconGlyph icon={p.icon} color={p.color} x={x + CW / 2 - 16} y={8} size={32} />}
            <Lbl x={x + CW / 2} y={hasPic ? HH - 12 : HH / 2 + 3} text={c} size={fitIn(CW, c)} color={NAME} />
          </g>
        );
      })}
      {v.rows.map((r, i) => {
        const y = HH + i * CH;
        return (
          <g key={i}>
            <rect x={2} y={y + 2} width={RW - 6} height={CH - 4} rx={8} fill={C.navy} stroke={EDGE} />
            <g filter={`url(#${GREY})`}><IconGlyph icon={rowIcon} x={7} y={y + CH / 2 - 12} size={24} /></g>
            <Lbl x={34} y={y + CH / 2 + 5} text={r} anchor="start" size={14} bold color={C.gold} />
          </g>
        );
      })}
      {v.rows.map((r, i) => v.cols.map((c, j) => {
        const x = xs[j], CW = CWs[j], y = HH + i * CH; const m = tappable ? mine[`${i}-${j}`] : v.marks?.[i]?.[j];
        const cell = (
          <>
            <rect x={x + 2} y={y + 2} width={CW - 4} height={CH - 4} rx={6} fill={m === 'yes' ? 'rgba(45,212,191,0.16)' : CELL} stroke={EDGE} />
            {m === 'yes' && <Tick x={x + CW / 2} y={y + CH / 2} s={26} />}
            {m === 'no' && <Cross x={x + CW / 2} y={y + CH / 2} s={22} />}
          </>
        );
        if (!tappable) return <g key={`${i}-${j}`}>{cell}</g>;
        return (
          <g key={`${i}-${j}`} role="button" tabIndex={0} style={{ cursor: 'pointer' }}
            aria-label={`${r}, ${c}: ${m === 'yes' ? 'tick' : m === 'no' ? 'cross' : 'empty'}`}
            onClick={() => tap(i, j)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(i, j); } }}>
            {cell}
          </g>
        );
      }))}
      {tappable && <Lbl x={W / 2} y={H - 7} text="Tap a box: once for ✗, twice for ✓" size={12} color={C.muted} />}
    </>
  );
  if (!tappable) return <Svg w={W} h={H} label={named} max={420}>{body}</Svg>;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={Math.min(W, 420)} role="group" aria-label={`${named}. Tap a box to mark it.`}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}>
      {body}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Speakers                                                            */
/* ------------------------------------------------------------------ */

export function Speakers({ v, small }: { v: SpeakV; small?: boolean }) {
  const named = v.people.map((p) => `${p.name} says: ${p.says}`).join(' ');
  if (small) {
    const W = 96, RH = 26;
    return (
      <Svg w={W} h={v.people.length * RH + 4} label={named} max={100}>
        {v.people.map((p, i) => (
          <g key={i}>
            <IconGlyph icon={p.icon ?? 'person'} color={TINT[i % TINT.length]} x={2} y={4 + i * RH} size={20} />
            <rect x={26} y={4 + i * RH} width={W - 28} height={RH - 6} rx={6} fill={CELL} stroke={C.gold} strokeWidth={1} />
            <Lbl x={30} y={4 + i * RH + 14} text={p.name} anchor="start" size={10} color={C.gold} bold />
          </g>
        ))}
      </Svg>
    );
  }
  const W = 360, BX = 76, BW = W - BX - 4, FS = 14, LH = 18;
  const lines = v.people.map((p) => wrap(`“${p.says}”`, 30));
  const hs = lines.map((l) => Math.max(76, l.length * LH + 28));
  const tops = hs.map((_, i) => 4 + hs.slice(0, i).reduce((a, b) => a + b + 8, 0));
  const H = tops[tops.length - 1] + hs[hs.length - 1] + 4;
  return (
    <Svg w={W} h={H} label={named} max={420}>
      {v.people.map((p, i) => {
        const y = tops[i], h = hs[i], mid = y + Math.min(32, h / 2);
        return (
          <g key={i}>
            <IconGlyph icon={p.icon ?? 'person'} color={TINT[i % TINT.length]} x={12} y={y + 6} size={44} />
            <Lbl x={34} y={y + 68} text={p.name} size={13} bold color={C.gold} />
            <rect x={BX} y={y + 4} width={BW} height={h - 8} rx={14} fill={CELL} stroke={C.gold} strokeWidth={1.5} />
            <path d={`M ${BX + 1} ${mid - 8} L ${BX - 12} ${mid} L ${BX + 1} ${mid + 8}`} fill={CELL} stroke={C.gold} strokeWidth={1.5} strokeLinejoin="round" />
            <rect x={BX + 1} y={mid - 7} width={3} height={14} fill={CELL} />
            {lines[i].map((l, k) => (
              <text key={k} x={BX + 14} y={y + 4 + (h - 8) / 2 - ((lines[i].length - 1) * LH) / 2 + k * LH + 5} fontSize={FS} fill="#f8fafc" fontFamily={MONO}>{l}</text>
            ))}
          </g>
        );
      })}
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

/** A shut box: you cannot see inside. A small picture on the side says what kind of thing may be in it. */
function ShutBox({ x, y, w, h, icon }: { x: number; y: number; w: number; h: number; icon: ContestIcon }) {
  return (
    <g>
      <rect x={x} y={y + h * 0.22} width={w} height={h * 0.78} rx={4} fill="#8a5a2b" stroke={C.dark} strokeWidth={1.5} />
      <rect x={x - 3} y={y + h * 0.08} width={w + 6} height={h * 0.2} rx={3} fill="#a86f38" stroke={C.dark} strokeWidth={1.5} />
      <g filter={`url(#${GREY})`} opacity={0.85}><IconGlyph icon={icon} x={x + 4} y={y + h * 0.36} size={Math.min(h * 0.42, w * 0.34)} /></g>
      <Lbl x={x + w * 0.7} y={y + h * 0.82} text="?" size={h * 0.5} bold color={C.ask} />
    </g>
  );
}

export function Scene({ v, small }: { v: SceneV; small?: boolean }) {
  const items = v.items;
  const row = items.length > 0 && items.every((x) => x.n === 1 && !x.hidden) && new Set(items.map((x) => x.icon)).size === items.length;
  const named = `${v.title ? `${v.title}: ` : ''}${items.map((x) => (x.hidden ? `a shut box that may hold ${x.icon}s` : `${x.n} ${x.color ?? ''} ${x.icon}`.replace(/\s+/g, ' '))).join(', ')}`;
  const TT = v.title ? 26 : 0;
  if (small) {
    const S = 13, PER = 6;
    const bands = items.map((x) => (x.hidden ? 1 : Math.max(1, Math.ceil(x.n / PER))));
    const W = PER * S + 8, H = sum(bands) * S + items.length * 3 + 4;
    let y = 3;
    return (
      <Svg w={W} h={H} label={named} max={92}>
        {items.map((x, i) => {
          const y0 = y; y += bands[i] * S + 3;
          if (x.hidden) return <rect key={i} x={4} y={y0} width={S * 1.6} height={S - 1} rx={2} fill="#8a5a2b" stroke={C.dark} />;
          return <g key={i}>{range(x.n).map((k) => <IconGlyph key={k} icon={x.icon} color={x.color} x={4 + (k % PER) * S} y={y0 + Math.floor(k / PER) * S} size={S - 1} />)}</g>;
        })}
      </Svg>
    );
  }
  if (row) {
    const SL = 70, IC = 48; const W = Math.max(260, items.length * SL + 20); const H = TT + IC + 50;
    const x0 = (W - items.length * SL) / 2;
    return (
      <Svg w={W} h={H} label={`left to right: ${items.map((x) => x.label ?? x.icon).join(', ')}`} max={420}>
        {v.title && <Lbl x={W / 2} y={18} text={v.title} size={14} bold color={C.gold} />}
        <rect x={2} y={TT + IC + 10} width={W - 4} height={6} rx={3} fill="#3f6212" opacity={0.7} />
        {items.map((x, i) => {
          const cx = x0 + i * SL + SL / 2;
          return (
            <g key={i}>
              <IconGlyph icon={x.icon} color={x.color} x={cx - IC / 2} y={TT + 12} size={IC} />
              {x.label && <Lbl x={cx} y={TT + IC + 36} text={x.label} size={13} color={NAME} />}
            </g>
          );
        })}
      </Svg>
    );
  }
  // Bigger pictures when the groups are small: at most 10 in a line, up to 38 px a step. Short labels sit on the left,
  // long ones ("purple kites", "shut box of hats") sit on top of their band.
  const most = Math.max(1, ...items.map((x) => (x.hidden ? 1 : x.n)));
  const top = items.some((x) => (x.label ?? '').length > 8);
  const PER = Math.min(10, most), LABW = top ? 6 : 74, ST = Math.min(38, Math.floor((top ? 330 : 270) / Math.max(PER, 7))), IC = ST - 4;
  const W = Math.max(LABW + PER * ST + 16, top ? 240 : 200);
  const LT = top ? 20 : 0;
  const bandH = (x: SceneV['items'][number]) => LT + (x.hidden ? 66 : Math.max(1, Math.ceil(x.n / PER)) * ST + 12);
  const tops: number[] = []; let y = TT + 2;
  for (const x of items) { tops.push(y); y += bandH(x) + 6; }
  const H = y;
  return (
    <Svg w={W} h={H} label={named} max={420}>
      <GreyDef />
      {v.title && <Lbl x={W / 2} y={18} text={v.title} size={14} bold color={C.gold} />}
      {items.map((x, i) => {
        const y0 = tops[i], h = bandH(x);
        return (
          <g key={i}>
            <rect x={2} y={y0} width={W - 4} height={h} rx={10} fill={C.navy} stroke={EDGE} />
            {x.label && (top
              ? <Lbl x={12} y={y0 + 16} text={x.label} anchor="start" size={12.5} color={NAME} bold />
              : <Lbl x={10} y={y0 + h / 2 + 5} text={x.label} anchor="start" size={13} color={NAME} bold />)}
            {x.hidden
              ? <ShutBox x={LABW + 14} y={y0 + LT + 4} w={92} h={58} icon={x.icon} />
              : range(x.n).map((k) => <IconGlyph key={k} icon={x.icon} color={x.color} x={LABW + 4 + (k % PER) * ST + 2} y={y0 + LT + 6 + Math.floor(k / PER) * ST} size={IC} />)}
          </g>
        );
      })}
    </Svg>
  );
}
