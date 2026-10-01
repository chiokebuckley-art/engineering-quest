import type { ContestVisual } from '../../../engine/contest/visuals';
import { Svg, Lbl, IconGlyph, C } from './kit';

type V = Extract<ContestVisual, { type: 'objects' }>;
type G = V['groups'][number];

/** An arrow from (x1, y) to (x2, y), head at x2. */
function Arrow({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  const dir = x2 > x1 ? 1 : -1;
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - dir * 8} y2={y} stroke={C.teal} strokeWidth={3} strokeDasharray="6 4" strokeLinecap="round" />
      <polygon points={`${x2},${y} ${x2 - dir * 11},${y - 7} ${x2 - dir * 11},${y + 7}`} fill={C.teal} />
    </g>
  );
}
/** A closed box: some are hiding in it, nobody can see how many. */
function HiddenBox({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y + 8} width={w} height={h - 8} rx={8} fill={C.panel} stroke={C.line} strokeWidth={1.5} />
      <rect x={x - 4} y={y} width={w + 8} height={12} rx={4} fill="#334155" stroke={C.line} strokeWidth={1.5} />
      <Lbl x={x + w / 2} y={y + h / 2 + 15} text="?" color={C.ask} size={Math.min(w, h) * 0.55} bold />
    </g>
  );
}
/** n icons in rows of `cols`, a little gap after every five so fives can be seen at a glance. */
function IconBlock({ g, x, y, size, step, cols }: { g: G; x: number; y: number; size: number; step: number; cols: number }) {
  return (
    <g opacity={g.leaving ? 0.62 : 1}>
      {Array.from({ length: g.n }, (_, i) => {
        const c = i % cols; const r = Math.floor(i / cols);
        const gap = cols > 5 && c >= 5 ? step * 0.4 : 0;
        return <IconGlyph key={i} icon={g.icon} color={g.color} x={x + c * step + gap} y={y + r * step} size={size} />;
      })}
    </g>
  );
}

/**
 * Small-number stories: groups of pictures. Stories with movement (some arrive, some leave, some hide) are drawn
 * left to right with arrows: arrivals point in, leavers walk off to the right, a hidden part is a closed box with "?".
 * Plain groups (comparing two people's things) are drawn as rows, ten to a line, so each can be matched one to one.
 * `small` (inside a tap choice) draws just the pictures, five to a row.
 */
export function Objects({ v, small }: { v: V; small?: boolean }) {
  const groups = v.groups;
  if (small) {
    const shown = groups.filter((g) => !g.hidden);
    const total = shown.reduce((s, g) => s + g.n, 0);
    const cols = Math.min(5, Math.max(1, total)); const rows = Math.max(1, Math.ceil(total / 5));
    const step = 17; const w = cols * step + 8; const h = rows * step + 8;
    let i = 0;
    return (
      <Svg w={w} h={h} label="picture of things to count" max={110}>
        {shown.flatMap((g) => Array.from({ length: g.n }, () => { const k = i++; return <IconGlyph key={k} icon={g.icon} color={g.color} x={4 + (k % 5) * step} y={4 + Math.floor(k / 5) * step} size={15} />; }))}
      </Svg>
    );
  }
  const pad = 10; const titleH = v.title ? 24 : 0;
  const flow = groups.some((g) => g.arriving || g.leaving || g.hidden);
  if (!flow) {
    // Rows: label, then up to ten pictures a line, columns lined up from row to row.
    // The label column fits the longest label (12 px monospace is about 7.3 px a character).
    const longest = Math.max(0, ...groups.map((g) => g.label?.length ?? 0));
    const labelW = longest ? Math.min(150, Math.max(48, Math.ceil(longest * 7.3) + 12)) : 0; const step = 25; const size = 21;
    const lines = groups.map((g) => Math.max(1, Math.ceil(g.n / 10)));
    const w = pad * 2 + labelW + 10 * step + step * 0.4; const h = pad * 2 + titleH + lines.reduce((s, l) => s + l * step + 10, 0);
    let y = pad + titleH;
    return (
      <Svg w={w} h={h} label="picture of the story" max={460}>
        {v.title && <Lbl x={w / 2} y={pad + 14} text={v.title} size={13} color={C.gold} bold />}
        {groups.map((g, gi) => {
          const top = y; y += lines[gi] * step + 10;
          return (
            <g key={gi}>
              {gi > 0 && <line x1={pad} x2={w - pad} y1={top - 5} y2={top - 5} stroke={C.muted} strokeOpacity={0.25} />}
              {g.label && <Lbl x={pad} y={top + step / 2 + 4} text={g.label} anchor="start" size={12} />}
              <IconBlock g={g} x={pad + labelW} y={top} size={size} step={step} cols={10} />
            </g>
          );
        })}
      </Svg>
    );
  }
  // Flow: groups side by side, five to a row.
  const step = 27; const size = 23; const arrowW = 44; const boxW = 74; const boxH = 60;
  const dims = groups.map((g) => (g.hidden ? { w: boxW, h: boxH } : { w: Math.min(5, Math.max(1, g.n)) * step, h: Math.max(1, Math.ceil(g.n / 5)) * step }));
  const blockH = Math.max(...dims.map((d) => d.h));
  const top = pad + titleH; const labelY = top + blockH + 18;
  let x = pad;
  const parts = groups.map((g, gi) => {
    // Each group sits centred in a slot at least as wide as its label, so labels never run into each other or off the edge.
    const slot = Math.max(dims[gi].w, g.label ? Math.ceil(g.label.length * 7.3) + 8 : 0);
    const before = gi > 0 ? (g.arriving ? arrowW : 22) : 0;
    const sx = x + before; const gx = sx + (slot - dims[gi].w) / 2;
    x = sx + slot + (g.leaving ? Math.max(0, arrowW - (slot - dims[gi].w) / 2) : 0);
    return { g, gi, gx, before: before + (gx - sx) };
  });
  const w = x + pad; const h = labelY + pad + 6;
  const midY = top + blockH / 2;
  return (
    <Svg w={Math.max(w, 120)} h={h} label="picture of the story" max={460}>
      {v.title && <Lbl x={Math.max(w, 120) / 2} y={pad + 14} text={v.title} size={13} color={C.gold} bold />}
      {parts.map(({ g, gi, gx, before }) => {
        const d = dims[gi]; const gy = top + (blockH - d.h) / 2;
        return (
          <g key={gi}>
            {g.arriving && <Arrow x1={gx - 6} x2={gx - before + 6} y={midY} />}
            {g.hidden ? <HiddenBox x={gx} y={gy} w={d.w} h={d.h} /> : <IconBlock g={g} x={gx} y={gy} size={size} step={step} cols={5} />}
            {g.leaving && <rect x={gx - 4} y={gy - 4} width={d.w + 6} height={d.h + 6} rx={8} fill="none" stroke={C.teal} strokeOpacity={0.6} strokeDasharray="5 4" />}
            {g.leaving && <Arrow x1={gx + d.w + 8} x2={gx + d.w + arrowW - 4} y={midY} />}
            {g.label && <Lbl x={gx + d.w / 2} y={labelY} text={g.label} size={12} color={g.arriving || g.leaving ? C.teal : C.label} />}
          </g>
        );
      })}
    </Svg>
  );
}
