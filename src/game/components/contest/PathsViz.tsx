import type { ContestVisual } from '../../../engine/contest/visuals';
import { Svg, Lbl, AskBox, IconGlyph, C } from './kit';

/**
 * Counting Paths pictures. A menu is one labelled row of pictures per group (hats, shirts, drinks…); a group with no
 * items is drawn as a "?" box (the group to find). `tree` draws the worked tree instead: one branch per choice, one
 * numbered row per finished outfit. A street grid has Start (bottom-left), Finish (top-right), ✕ on blocked corners,
 * an optional example route in teal and, worked, the number of ways into each corner. A line-up is people in a row with
 * the places to fill drawn as slots under them (someone already placed stands in their slot; two who must stand
 * together hold hands), or people round a circle to pair up (worked: every pair joined). `small` = inside a tap choice.
 */

type MenuV = Extract<ContestVisual, { type: 'menu' }>;
type GridV = Extract<ContestVisual, { type: 'gridpath' }>;
type LineV = Extract<ContestVisual, { type: 'lineup' }>;
type Item = MenuV['groups'][number]['items'][number];

const NAME = '#cbd5e1';
const range = (n: number) => Array.from({ length: n }, (_, i) => i);
/** A name on one line, or two when it is long ("orange" / "juice"). */
function nameLines(name: string, wrap = false): string[] {
  if ((name.length <= 8 && !wrap) || !name.includes(' ')) return [name];
  const words = name.split(' '); let best = 1; let diff = Infinity;
  for (let k = 1; k < words.length; k++) { const d = Math.abs(words.slice(0, k).join(' ').length - words.slice(k).join(' ').length); if (d < diff) { diff = d; best = k; } }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}
function Name({ x, y, name, size = 11, wrap = false }: { x: number; y: number; name: string; size?: number; wrap?: boolean }) {
  const lines = nameLines(name, wrap);
  return <g>{lines.map((l, i) => <Lbl key={i} x={x} y={y + i * (size + 1)} text={l} size={size} color={NAME} />)}</g>;
}

/* ------------------------------------------------------------------ */
/* Menu groups                                                         */
/* ------------------------------------------------------------------ */

const RED = '#f87171'; const RED_DARK = '#7f1d1d';
/** Name font that fits a slot `room` wide (never above 12). */
const nameSize = (name: string, room: number, wrap: boolean) => Math.min(12, (room - 4) / (0.62 * Math.max(...nameLines(name, wrap).map((l) => l.length))));
/** A small red ✕ badge. */
function Cross({ x, y, r = 8 }: { x: number; y: number; r?: number }) {
  const k = r * 0.5;
  return <g><circle cx={x} cy={y} r={r} fill={RED_DARK} stroke={RED} strokeWidth={1.5} /><path d={`M ${x - k} ${y - k} L ${x + k} ${y + k} M ${x + k} ${y - k} L ${x - k} ${y + k}`} stroke="#fecaca" strokeWidth={2} strokeLinecap="round" /></g>;
}

export function MenuGroups({ v, small }: { v: MenuV; small?: boolean }) {
  if (v.tree && !small) return <MenuTree v={v} />;
  const groups = v.groups;
  const maxItems = Math.max(1, ...groups.map((g) => g.items.length || 1));
  const named = groups.map((g) => `${g.label}: ${g.items.length ? g.items.map((i) => i.name).join(', ') : '?'}`).join('; ');
  if (small) {
    // Inside a tap button: 4 or more in a group wrap onto two lines, so each picture stays big enough to see.
    const cols = maxItems > 3 ? Math.ceil(maxItems / 2) : maxItems;
    const ST = Math.min(30, Math.floor(80 / cols)); const IC = ST - 3; const LH = IC + 2;
    const lines = groups.map((g) => Math.max(1, Math.ceil(g.items.length / cols)));
    const RH = lines.map((l) => l * LH + 4); const GAP = 3;
    const W = cols * ST + 8; const H = RH.reduce((a, b) => a + b + GAP, 0) + 1;
    let y = 2;
    return (
      <Svg w={W} h={H} label={named} max={88}>
        {groups.map((g, gi) => {
          const top = y; y += RH[gi] + GAP;
          return (
            <g key={gi}>
              <rect x={1} y={top} width={W - 2} height={RH[gi]} rx={6} fill={C.navy} stroke="rgba(240,215,140,0.3)" />
              {g.items.map((it, ii) => {
                const li = Math.floor(ii / cols); const inLine = Math.min(cols, g.items.length - li * cols);
                const x0 = (W - inLine * ST) / 2;
                return <IconGlyph key={ii} icon={it.icon} color={it.color} x={x0 + (ii % cols) * ST + (ST - IC) / 2} y={top + 2 + li * LH} size={IC} />;
              })}
            </g>
          );
        })}
      </Svg>
    );
  }
  // Up to 4 in a group: the group name sits on the left. 5 or more: it sits above the row, so the pictures get the
  // whole width and the names stay readable on a phone.
  const above = maxItems >= 5; const PAD = 8; const LABW = above ? 0 : 84;
  const W = above ? 330 : Math.max(330, LABW + maxItems * (maxItems >= 4 ? 58 : 66) + PAD * 2);
  const avail = W - LABW - PAD * 2 - 4;
  const ST = Math.min(66, avail / maxItems); const IC = Math.min(44, ST - 14);
  const twoLine = groups.some((g) => g.items.some((i) => nameLines(i.name).length > 1));
  // A row whose names would get too small spreads out into the spare room.
  const rowST = groups.map((g) => (g.items.some((i) => nameSize(i.name, ST, twoLine) < 11) ? Math.min(avail / Math.max(1, g.items.length), ST * 1.6) : ST));
  const HEAD = above ? 20 : 0; const RH = HEAD + IC + (twoLine ? 42 : 30); const GAP = 8;
  const marks = new Set(v.marks ?? []); const crossed = new Set(v.crossed ?? []); const bans = v.bans ?? [];
  const banned = new Set(bans.flat());
  const byName = new Map(groups.flatMap((g) => g.items.map((i) => [i.name, i] as const)));
  const CARD_W = 124, CARD_H = 64;
  const rulesY = groups.length * (RH + GAP) + 2;
  const H = rulesY + (bans.length ? CARD_H + 6 : 0);
  const rules = bans.length ? `; never together: ${bans.map(([a, b]) => `${a} with ${b}`).join(', ')}` : '';
  const ask = `${marks.size ? `; named: ${[...marks].join(', ')}` : ''}${crossed.size ? `; ruled out: ${[...crossed].join(', ')}` : ''}`;
  return (
    <Svg w={W} h={H} label={`${named}${rules}${ask}`} max={420}>
      {groups.map((g, gi) => {
        const y = 2 + gi * (RH + GAP); const st = rowST[gi];
        const iy = y + HEAD + 6;
        const x0 = above ? (W - g.items.length * st) / 2 : LABW + PAD;
        return (
          <g key={gi}>
            <rect x={2} y={y} width={W - 4} height={RH} rx={10} fill={C.navy} stroke="rgba(240,215,140,0.35)" />
            {above
              ? <Lbl x={12} y={y + 16} text={g.label} anchor="start" size={13} bold color={C.gold} />
              : <Lbl x={12} y={y + RH / 2 + 5} text={g.label} anchor="start" size={14} bold color={C.gold} />}
            {g.items.length === 0 && <AskBox x={above ? W / 2 - ST / 2 : LABW + PAD + 4} y={iy + 2} w={ST - 4} h={RH - HEAD - 16} />}
            {g.items.map((it, ii) => {
              const cx = x0 + ii * st + st / 2; const cy = iy + IC / 2;
              const ring = marks.has(it.name) ? 'mark' : crossed.has(it.name) || banned.has(it.name) ? 'no' : null;
              return (
                <g key={ii}>
                  {ring === 'mark' && <circle cx={cx} cy={cy} r={IC / 2 + 4} fill="rgba(240,215,140,0.14)" stroke={C.gold} strokeWidth={2.5} />}
                  {ring === 'no' && <circle cx={cx} cy={cy} r={IC / 2 + 4} fill="rgba(248,113,113,0.12)" stroke={RED} strokeWidth={2.5} strokeDasharray="5 3" />}
                  <IconGlyph icon={it.icon} color={it.color} x={cx - IC / 2} y={iy} size={IC} />
                  {crossed.has(it.name) && <Cross x={cx + IC / 2 - 1} y={iy + 3} />}
                  <Name x={cx} y={iy + IC + 15} name={it.name} wrap={twoLine} size={nameSize(it.name, st, twoLine)} />
                </g>
              );
            })}
          </g>
        );
      })}
      {bans.map(([a, b], bi) => {
        // A "never together" card: the two pictures side by side, struck through in red.
        const x = (W - bans.length * CARD_W - (bans.length - 1) * 10) / 2 + bi * (CARD_W + 10); const y = rulesY;
        const A = byName.get(a); const B = byName.get(b); const S = 30; const mx = x + CARD_W / 2;
        return (
          <g key={`ban${bi}`}>
            <rect x={x} y={y} width={CARD_W} height={CARD_H} rx={10} fill="rgba(127,29,29,0.35)" stroke={RED} strokeWidth={1.5} />
            {A && <IconGlyph icon={A.icon} color={A.color} x={mx - S - 8} y={y + 5} size={S} />}
            <Lbl x={mx} y={y + 25} text="+" size={14} bold color={NAME} />
            {B && <IconGlyph icon={B.icon} color={B.color} x={mx + 8} y={y + 5} size={S} />}
            <line x1={mx - S - 12} y1={y + 37} x2={mx + S + 12} y2={y + 3} stroke={RED} strokeWidth={3} strokeLinecap="round" />
            <Lbl x={mx} y={y + CARD_H - 9} text="never together" size={11} bold color="#fecaca" />
          </g>
        );
      })}
    </Svg>
  );
}

/** The worked tree: a column per group, a branch per choice, a numbered row per finished combination. */
function MenuTree({ v }: { v: MenuV }) {
  const groups = v.groups.filter((g) => g.items.length);
  const sizes = groups.map((g) => g.items.length);
  const total = sizes.reduce((a, b) => a * b, 1);
  // Big trees: draw the branch of the first choice in full, then say the rest repeat it.
  const cut = total > 18 && groups.length > 1;
  const firstSizes = cut ? [1, ...sizes.slice(1)] : sizes;
  const leaves: number[][] = [[]];
  for (const n of firstSizes) { const next: number[][] = []; for (const p of leaves) for (let i = 0; i < n; i++) next.push([...p, i]); leaves.splice(0, leaves.length, ...next); }
  const IC = 30, RH = 36, COL = 90, X0 = 34, TOP = 28;
  const W = X0 + groups.length * COL + 44; const H = TOP + leaves.length * RH + (cut ? 26 : 6);
  const colX = (lv: number) => X0 + 22 + lv * COL;
  const rowY = (i: number) => TOP + i * RH + RH / 2;
  // Each node at level lv is the run of leaves sharing the first lv + 1 picks; it sits at the middle of that run.
  const nodes: { lv: number; idx: number; y: number; parentY: number }[] = [];
  for (let lv = 0; lv < groups.length; lv++) {
    let start = 0;
    while (start < leaves.length) {
      const key = leaves[start].slice(0, lv + 1).join(',');
      let end = start; while (end + 1 < leaves.length && leaves[end + 1].slice(0, lv + 1).join(',') === key) end++;
      const pkey = leaves[start].slice(0, lv).join(',');
      let ps = start; while (ps > 0 && leaves[ps - 1].slice(0, lv).join(',') === pkey) ps--;
      let pe = end; while (pe + 1 < leaves.length && leaves[pe + 1].slice(0, lv).join(',') === pkey) pe++;
      nodes.push({ lv, idx: leaves[start][lv], y: (rowY(start) + rowY(end)) / 2, parentY: (rowY(ps) + rowY(pe)) / 2 });
      start = end + 1;
    }
  }
  return (
    <Svg w={W} h={H} label={`tree of all ${total} choices`} max={380}>
      {groups.map((g, lv) => <Lbl key={lv} x={colX(lv)} y={17} text={g.label} size={13} bold color={C.gold} />)}
      <Lbl x={W - 20} y={17} text="#" size={13} bold color={C.gold} />
      <circle cx={X0 - 16} cy={rowY(0) + ((leaves.length - 1) * RH) / 2} r={5} fill={C.teal} />
      {nodes.map((n, i) => {
        const x = colX(n.lv); const px = n.lv === 0 ? X0 - 16 : colX(n.lv - 1) + IC / 2 + 2;
        return <line key={`l${i}`} x1={px} y1={n.parentY} x2={x - IC / 2 - 2} y2={n.y} stroke={C.teal} strokeWidth={1.6} opacity={0.75} />;
      })}
      {nodes.map((n, i) => { const it: Item = groups[n.lv].items[n.idx]; return <IconGlyph key={`n${i}`} icon={it.icon} color={it.color} x={colX(n.lv) - IC / 2} y={n.y - IC / 2} size={IC} />; })}
      {leaves.map((_, i) => <Lbl key={`k${i}`} x={W - 20} y={rowY(i) + 5} text={i + 1} size={14} bold color={C.label} />)}
      {cut && <Lbl x={W / 2} y={H - 8} text={`… the same again for each of the other ${sizes[0] - 1} ${groups[0].label.toLowerCase()}`} size={11} color={NAME} />}
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Street grid                                                         */
/* ------------------------------------------------------------------ */

function waysInto(w: number, h: number, blocked: [number, number][]): number[][] {
  const isB = (x: number, y: number) => blocked.some(([bx, by]) => bx === x && by === y);
  const c = range(h + 1).map(() => range(w + 1).map(() => 0));
  for (let y = 0; y <= h; y++) for (let x = 0; x <= w; x++) c[y][x] = isB(x, y) ? 0 : x === 0 && y === 0 ? 1 : (y ? c[y - 1][x] : 0) + (x ? c[y][x - 1] : 0);
  return c;
}

export function GridPaths({ v, small }: { v: GridV; small?: boolean }) {
  const { w, h } = v; const blocked = v.blocked ?? [];
  const isB = (x: number, y: number) => blocked.some(([bx, by]) => bx === x && by === y);
  const S = small ? Math.min(24, 80 / w, 60 / h) : Math.min(72, 288 / w, 216 / h);
  const ML = small ? 10 : 48, MR = small ? 10 : v.counts ? 60 : 48, MT = small ? 10 : 36, MB = small ? 10 : 38;
  const W = Math.max(small ? 0 : 200, ML + w * S + MR); const ox = (W - w * S - ML - MR) / 2 + ML;
  const H = MT + h * S + MB;
  const px = (x: number) => ox + x * S; const py = (y: number) => MT + (h - y) * S;
  const road = small ? 5 : 10;
  const segs: [number, number, number, number][] = [];
  for (let y = 0; y <= h; y++) for (let x = 0; x < w; x++) segs.push([x, y, x + 1, y]);
  for (let x = 0; x <= w; x++) for (let y = 0; y < h; y++) segs.push([x, y, x, y + 1]);
  const counts = v.counts ? waysInto(w, h, blocked) : null;
  const pts = (v.path ?? []).map(([x, y]) => `${px(x)},${py(y)}`).join(' ');
  const label = `street grid ${w} blocks across and ${h} up, start bottom left, finish top right${blocked.length ? `, ${blocked.length} blocked ${blocked.length === 1 ? 'corner' : 'corners'}` : ''}`;
  return (
    <Svg w={W} h={H} label={label} max={small ? 88 : 400}>
      {segs.map(([x1, y1, x2, y2], i) => <line key={`r${i}`} x1={px(x1)} y1={py(y1)} x2={px(x2)} y2={py(y2)} stroke="#334155" strokeWidth={road} strokeLinecap="round" />)}
      {!small && segs.map(([x1, y1, x2, y2], i) => <line key={`c${i}`} x1={px(x1)} y1={py(y1)} x2={px(x2)} y2={py(y2)} stroke="#94a3b8" strokeWidth={1.2} strokeDasharray="4 5" />)}
      {pts && <polyline points={pts} fill="none" stroke={C.teal} strokeWidth={small ? 3 : 5} strokeLinejoin="round" strokeLinecap="round" />}
      {range(w + 1).flatMap((x) => range(h + 1).map((y) => (isB(x, y) || (x === 0 && y === 0) || (x === w && y === h) ? null : <circle key={`n${x}-${y}`} cx={px(x)} cy={py(y)} r={small ? 2 : 4} fill={C.line} />)))}
      {blocked.map(([x, y], i) => {
        const r = small ? 6 : 13; const k = r * 0.55;
        return (
          <g key={`b${i}`}>
            <circle cx={px(x)} cy={py(y)} r={r} fill="#7f1d1d" stroke="#f87171" strokeWidth={small ? 1 : 2} />
            <path d={`M ${px(x) - k} ${py(y) - k} L ${px(x) + k} ${py(y) + k} M ${px(x) + k} ${py(y) - k} L ${px(x) - k} ${py(y) + k}`} stroke="#fecaca" strokeWidth={small ? 1.5 : 3} strokeLinecap="round" />
          </g>
        );
      })}
      <circle cx={px(0)} cy={py(0)} r={small ? 4 : 9} fill="#22c55e" stroke={C.dark} strokeWidth={1.5} />
      <IconGlyph icon="star" x={px(w) - (small ? 7 : 13)} y={py(h) - (small ? 7 : 13)} size={small ? 14 : 26} />
      {!small && <>
        <Lbl x={px(0)} y={py(0) + 28} text="Start" size={13} bold color="#86efac" />
        <Lbl x={px(w)} y={py(h) - 18} text="Finish" size={13} bold color={C.gold} />
        <Lbl x={W - 6} y={H - 10} text="only ↑ or →" size={12} anchor="end" color={NAME} />
      </>}
      {counts && !small && range(w + 1).flatMap((x) => range(h + 1).map((y) => {
        const n = counts[y][x]; const fin = x === w && y === h;
        if (fin) return (
          <g key={`k${x}-${y}`}>
            <rect x={px(x) + 15} y={py(y) - 13} width={14 + String(n).length * 9} height={26} rx={6} fill={C.navy} stroke={C.gold} strokeWidth={2.5} />
            <Lbl x={px(x) + 22 + String(n).length * 4.5} y={py(y) + 5.5} text={n} size={16} bold color={C.gold} />
          </g>
        );
        const bw = 8 + String(n).length * 8;
        return (
          <g key={`k${x}-${y}`}>
            <rect x={px(x) + 5} y={py(y) - 24} width={bw} height={18} rx={5} fill={isB(x, y) ? '#7f1d1d' : C.navy} stroke={isB(x, y) ? '#f87171' : C.teal} />
            <Lbl x={px(x) + 5 + bw / 2} y={py(y) - 10.5} text={n} size={12} bold color={isB(x, y) ? '#fecaca' : C.label} />
          </g>
        );
      }))}
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Line-ups                                                            */
/* ------------------------------------------------------------------ */

const MEDAL: Record<string, string> = { Gold: C.gold, Silver: '#cbd5e1', Bronze: '#d97706' };

/** Only 6 colours: when a colour repeats (7 or more people), each picture also gets a letter badge. */
const colourRepeats = (items: Item[]) => { const cs = items.map((i) => i.color ?? ''); return new Set(cs).size < cs.length && new Set(cs).size > 1; };
const initial = (name: string) => (name.split(' ').pop() ?? name).charAt(0).toUpperCase();
function Badge({ x, y, name }: { x: number; y: number; name: string }) {
  return <g><circle cx={x} cy={y} r={9} fill={C.dark} stroke={C.gold} strokeWidth={1.3} /><Lbl x={x} y={y + 4} text={initial(name)} size={11} bold color={C.line} /></g>;
}

export function LineUp({ v, small }: { v: LineV; small?: boolean }) {
  return v.mode === 'pairs' ? <PairCircle v={v} small={small} /> : <Row v={v} small={small} />;
}

function Row({ v, small }: { v: LineV; small?: boolean }) {
  const n = v.items.length; const places = small ? [] : v.places ?? [];
  const ST = small ? 24 : n >= 6 ? 54 : 62; const IC = small ? 20 : 40;
  const k = places.length;
  const W = Math.max(n, k) * ST + (small ? 6 : 20); const x0 = (W - n * ST) / 2; const s0 = (W - k * ST) / 2;
  const ix = (i: number) => x0 + i * ST + ST / 2; const sx = (j: number) => s0 + j * ST + ST / 2;
  const rowH = small ? 26 : 74; const SLOT_Y = rowH + 14; const SLOT_H = 58;
  const fixed = v.fixed; const tog = v.together; const apart = v.apart; const mark = new Set(v.mark ?? []);
  const H = small ? rowH : k ? SLOT_Y + SLOT_H + 24 : rowH + (apart || tog ? 18 : 4);
  const badges = !small && colourRepeats(v.items);
  const nm = (i: number) => v.items[i]?.name;
  const label = `${v.items.map((i) => i.name).join(', ')}${k ? `; places: ${places.join(', ')}` : ''}${fixed ? `; ${nm(fixed[0])} is already in place ${places[fixed[1]] ?? fixed[1] + 1}` : ''}${tog ? `; ${nm(tog[0])} and ${nm(tog[1])} stand together` : ''}${apart ? `; ${nm(apart[0])} and ${nm(apart[1])} must not stand side by side` : ''}${mark.size && !apart ? `; named: ${[...mark].map(nm).join(', ')}` : ''}`;
  const cy = (small ? 3 : 6) + IC / 2;
  return (
    <Svg w={W} h={H} label={label} max={small ? 88 : 400}>
      {tog && !small && (() => {
        const [a, b] = [Math.min(...tog), Math.max(...tog)];
        const adjacent = b - a === 1;
        return adjacent
          ? <g><rect x={ix(a) - ST / 2 + 3} y={1} width={2 * ST - 6} height={rowH - 2} rx={14} fill="rgba(240,215,140,0.12)" stroke={C.gold} strokeWidth={2} strokeDasharray="6 4" />
            <path d={`M ${ix(a) + 12} 34 Q ${(ix(a) + ix(b)) / 2} 44 ${ix(b) - 12} 34`} fill="none" stroke="#f2c79c" strokeWidth={4} strokeLinecap="round" /></g>
          : <path d={`M ${ix(a)} ${rowH - 4} Q ${(ix(a) + ix(b)) / 2} ${rowH + 10} ${ix(b)} ${rowH - 4}`} fill="none" stroke={C.gold} strokeWidth={2.5} strokeDasharray="6 4" />;
      })()}
      {apart && !small && (() => {
        // Must not stand side by side: a red dashed arc under their names, with a ✕ in the middle.
        const [a, b] = [Math.min(...apart), Math.max(...apart)]; const mx = (ix(a) + ix(b)) / 2;
        return <g><path d={`M ${ix(a)} ${rowH - 4} Q ${mx} ${rowH + 10} ${ix(b)} ${rowH - 4}`} fill="none" stroke={RED} strokeWidth={2.5} strokeDasharray="6 4" /><Cross x={mx} y={rowH + 3} r={7} /></g>;
      })()}
      {v.items.map((it, i) => {
        const placed = !!fixed && fixed[0] === i;
        return (
          <g key={i}>
            {!small && mark.has(i) && <circle cx={ix(i)} cy={cy} r={IC / 2 + 5} fill="rgba(240,215,140,0.14)" stroke={C.gold} strokeWidth={2.5} />}
            {!small && placed && <circle cx={ix(i)} cy={cy} r={IC / 2 + 5} fill="rgba(45,212,191,0.12)" stroke={C.teal} strokeWidth={2} strokeDasharray="5 3" />}
            <IconGlyph icon={it.icon} color={it.color} x={ix(i) - IC / 2} y={small ? 3 : 6} size={IC} />
            {badges && <Badge x={ix(i) + IC / 2 - 3} y={6 + IC - 5} name={it.name} />}
            {!small && <Lbl x={ix(i)} y={IC + 24} text={it.name} size={12} color={placed ? C.teal : mark.has(i) ? C.gold : NAME} bold={placed || mark.has(i)} />}
          </g>
        );
      })}
      {fixed && k > 0 && (() => {
        // The friend who is already placed: an arrow from them down to their slot.
        const x1 = ix(fixed[0]); const y1 = rowH - 2; const x2 = sx(fixed[1]); const y2 = SLOT_Y - 2;
        const len = Math.hypot(x2 - x1, y2 - y1) || 1; const ux = (x2 - x1) / len; const uy = (y2 - y1) / len;
        const head = `${x2},${y2} ${x2 - 7 * ux - 4 * uy},${y2 - 7 * uy + 4 * ux} ${x2 - 7 * ux + 4 * uy},${y2 - 7 * uy - 4 * ux}`;
        return <g><line x1={x1} y1={y1} x2={x2 - 5 * ux} y2={y2 - 5 * uy} stroke={C.teal} strokeWidth={2} strokeDasharray="4 3" /><polygon points={head} fill={C.teal} /></g>;
      })()}
      {places.map((p, j) => {
        const col = MEDAL[p] ?? C.gold; const who = fixed && fixed[1] === j ? v.items[fixed[0]] : undefined;
        return (
          <g key={`s${j}`}>
            <rect x={sx(j) - ST / 2 + 5} y={SLOT_Y} width={ST - 10} height={SLOT_H} rx={8} fill={who ? 'rgba(45,212,191,0.14)' : 'none'} stroke={who ? C.teal : col} strokeWidth={2} strokeDasharray={who ? undefined : '5 4'} />
            {who
              ? <><IconGlyph icon={who.icon} color={who.color} x={sx(j) - 15} y={SLOT_Y + 5} size={30} /><Lbl x={sx(j)} y={SLOT_Y + SLOT_H - 7} text={who.name} size={11} color={C.teal} bold /></>
              : <Lbl x={sx(j)} y={SLOT_Y + SLOT_H / 2 + 6} text="?" size={18} bold color={C.ask} />}
            <Lbl x={sx(j)} y={SLOT_Y + SLOT_H + 17} text={p} size={12} bold color={col} />
          </g>
        );
      })}
    </Svg>
  );
}

function PairCircle({ v, small }: { v: LineV; small?: boolean }) {
  // Everyone stands round the circle, except a late arrival, who waits below it.
  const late = v.late !== undefined && v.late >= 0 && v.late < v.items.length ? v.late : undefined;
  const ring = range(v.items.length).filter((i) => i !== late);
  const n = ring.length; const pos = new Map(ring.map((i, k) => [i, k]));
  const R = small ? 34 : n <= 5 ? 82 : n <= 8 ? 104 : 122; const IC = small ? 14 : n <= 8 ? 32 : 28;
  // Names sit just outside each picture: to the right on the right side, to the left on the left, above or below at the top and bottom.
  const nameW = small ? 0 : Math.max(...v.items.map((i) => i.name.length)) * 7.4;
  const gap = IC / 2 + 9;
  const W = 2 * (R + (small ? IC / 2 + 4 : gap + nameW + 6)); const H0 = 2 * (R + (small ? IC / 2 + 4 : gap + 18));
  const H = H0 + (late !== undefined && !small ? 64 : 0);
  const cx = W / 2; const cy = H0 / 2;
  const dir = (k: number) => { const a = -Math.PI / 2 + (2 * Math.PI * k) / n; return { c: Math.cos(a), s: Math.sin(a) }; };
  const at = (i: number) => { if (i === late) return { x: cx, y: H0 + 26 }; const d = dir(pos.get(i)!); return { x: cx + R * d.c, y: cy + R * d.s }; };
  const skip = v.skip; const isSkip = (i: number, j: number) => !!skip && ((skip[0] === i && skip[1] === j) || (skip[0] === j && skip[1] === i));
  const pairs = v.lines ? ring.flatMap((i, a) => ring.slice(a + 1).map((j) => [i, j] as const)).filter(([i, j]) => !isSkip(i, j)) : [];
  const lateLines = v.lines && late !== undefined ? ring.map((i) => [late, i] as const) : [];
  const badges = !small && colourRepeats(v.items);
  const nm = (i: number) => v.items[i]?.name;
  const label = `${n} round a circle: ${ring.map(nm).join(', ')}${late !== undefined ? `; ${nm(late)} arrives late` : ''}${skip ? `; ${nm(skip[0])} and ${nm(skip[1])} skip each other` : ''}${v.lines ? ', every pair joined' : ''}`;
  const crossLine = (i: number, j: number) => { const p = at(i); const q = at(j); return <g key={`x${i}-${j}`}><line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={RED} strokeWidth={2.5} strokeDasharray="6 4" /><Cross x={(p.x + q.x) / 2} y={(p.y + q.y) / 2} /></g>; };
  return (
    <Svg w={W} h={H} label={label} max={small ? 88 : 380}>
      {pairs.map(([i, j]) => { const p = at(i); const q = at(j); return <line key={`${i}-${j}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={C.teal} strokeWidth={small ? 0.8 : 1.6} opacity={0.6} />; })}
      {lateLines.map(([i, j]) => { const p = at(i); const q = at(j); return <line key={`L${j}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={C.gold} strokeWidth={small ? 0.8 : 1.6} opacity={0.75} />; })}
      {!small && skip && crossLine(skip[0], skip[1])}
      {!v.lines && !skip && n > 1 && !small && (() => { const p = at(ring[0]); const q = at(ring[1]); return <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={C.gold} strokeWidth={2} strokeDasharray="5 5" />; })()}
      {v.items.map((it, i) => {
        const p = at(i);
        if (i === late) {
          if (small) return null;
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={IC / 2 + 6} fill={C.navy} stroke={C.ask} strokeWidth={2} strokeDasharray="5 3" />
              <IconGlyph icon={it.icon} color={it.color} x={p.x - IC / 2} y={p.y - IC / 2} size={IC} />
              {badges && <Badge x={p.x + IC / 2 - 2} y={p.y + IC / 2 - 4} name={it.name} />}
              <Lbl x={p.x + IC / 2 + 14} y={p.y - 2} text={it.name} size={12} color={NAME} anchor="start" bold />
              <Lbl x={p.x + IC / 2 + 14} y={p.y + 13} text="arrives late" size={11} color={C.ask} anchor="start" />
            </g>
          );
        }
        const d = dir(pos.get(i)!);
        const side = d.c > 0.35 ? 'start' : d.c < -0.35 ? 'end' : 'middle';
        const tx = p.x + d.c * gap + (side === 'start' ? 2 : side === 'end' ? -2 : 0);
        const ty = side === 'middle' ? p.y + d.s * (gap + 6) + (d.s > 0 ? 8 : 0) : p.y + d.s * gap + 4;
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={IC / 2 + 3} fill={C.navy} stroke="rgba(240,215,140,0.4)" />
            <IconGlyph icon={it.icon} color={it.color} x={p.x - IC / 2} y={p.y - IC / 2} size={IC} />
            {/* The badge sits on the side away from the name, so the two never touch. */}
            {badges && <Badge x={side === 'start' ? p.x - IC / 2 + 2 : p.x + IC / 2 - 2} y={p.y + IC / 2 - 4} name={it.name} />}
            {!small && <Lbl x={tx} y={ty} text={it.name} size={12} color={NAME} anchor={side} />}
          </g>
        );
      })}
    </Svg>
  );
}
