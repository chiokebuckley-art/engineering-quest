import { SPACES, GROUPS, MAX_WORKSHOPS, type Space } from '../../engine/tycoon/board';
import type { TycoonGame } from '../../engine/tycoon/game';

const C = 132;
const E = (1000 - 2 * C) / 9;
type Side = 'top' | 'right' | 'bottom' | 'left' | null;
export function cellRect(i: number): [number, number, number, number, Side] {
  if (i === 0) return [1000 - C, 1000 - C, C, C, null];
  if (i < 10) return [1000 - C - i * E, 1000 - C, E, C, 'top'];
  if (i === 10) return [0, 1000 - C, C, C, null];
  if (i < 20) return [0, 1000 - C - (i - 10) * E, C, E, 'right'];
  if (i === 20) return [0, 0, C, C, null];
  if (i < 30) return [C + (i - 21) * E, 0, E, C, 'bottom'];
  if (i === 30) return [1000 - C, 0, C, C, null];
  return [1000 - C, C + (i - 31) * E, C, E, 'left'];
}
const wrap = (s: string, n: number) => { const out: string[] = []; let line = ''; for (const w of s.split(' ')) { if ((line + ' ' + w).trim().length > n && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); } if (line) out.push(line); return out; };
const ICON: Partial<Record<Space['kind'], string>> = { puzzle: '?', chest: '⚙', rail: '⇆', tax: '%', start: '➜', park: '⛲', cell: '▦', gocell: '↩' };

/** The board: colour bands, owners, workshops, mortgages and the players' pieces. */
export function Board({ g, selected, onSelect }: { g: TycoonGame; selected: number | null; onSelect: (i: number) => void }) {
  const cur = g.players[g.turn];
  return (
    <svg viewBox="0 0 1000 1000" className="ty-board" role="group" aria-label="Engine City Tycoon board">
      <rect x="0" y="0" width="1000" height="1000" fill="#efe6cf" />
      <rect x={C} y={C} width={1000 - 2 * C} height={1000 - 2 * C} fill="#e6dcc0" />
      <text x="500" y="420" textAnchor="middle" className="ty-title1">ENGINE CITY</text>
      <text x="500" y="468" textAnchor="middle" className="ty-title2">TYCOON</text>
      <text x="500" y="505" textAnchor="middle" className="ty-sub">Round {Math.min(g.round, g.rounds)}{g.mode === 'quick' ? ` of ${g.rounds}` : ''}</text>
      {g.dice && (
        <g transform="translate(440 560)" aria-label={`Last roll ${g.dice[0]} and ${g.dice[1]}`}>
          {g.dice.map((d, k) => <Die key={k} x={k * 80} n={d} />)}
        </g>
      )}
      {g.jar.length > 0 && <text x="500" y="700" textAnchor="middle" className="ty-sub">Park jar: {g.jar.length} deposit{g.jar.length > 1 ? 's' : ''}</text>}
      {SPACES.map((s) => {
        const [x, y, w, h, side] = cellRect(s.i);
        const d = g.deeds[s.i];
        const owner = d ? g.players.find((p) => p.id === d.owner) : null;
        const band = s.group ? GROUPS[s.group].color : null;
        const sideways = side === 'left' || side === 'right';
        let tx = x + w / 2; let ty = y + 24;
        const bw = 24;
        let bandRect: [number, number, number, number] | null = null;
        if (band) {
          if (side === 'top') { bandRect = [x, y, w, bw]; ty = y + bw + 20; }
          if (side === 'bottom') { bandRect = [x, y + h - bw, w, bw]; ty = y + 22; }
          if (side === 'right') { bandRect = [x + w - bw, y, bw, h]; tx = x + (w - bw) / 2; }
          if (side === 'left') { bandRect = [x, y, bw, h]; tx = x + bw + (w - bw) / 2; }
        }
        const corner = !side;
        const icon = ICON[s.kind] ?? (s.kind === 'util' ? (s.name === 'Power Plant' ? 'ϟ' : '≈') : null);
        const lines = wrap(s.name, corner ? 11 : sideways ? 13 : 9);
        const base = corner ? y + h / 2 + 8 - (lines.length - 1) * 9 : icon && !corner ? (sideways ? y + 58 : ty + 48) : ty;
        const landed = cur && cur.pos === s.i;
        return (
          <g key={s.i} className={`ty-cell ${selected === s.i ? 'sel' : ''} ${landed ? 'here' : ''}`} tabIndex={0} role="button" aria-label={`${s.name}${owner ? `, owned by ${owner.name}` : ''}`}
            onClick={() => onSelect(s.i)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(s.i); } }}>
            <rect className="bg" x={x} y={y} width={w} height={h} fill={d?.mortgaged ? '#d9d2bf' : '#f7f0dc'} stroke="#1d2433" strokeWidth="1.5" />
            {bandRect && <rect x={bandRect[0]} y={bandRect[1]} width={bandRect[2]} height={bandRect[3]} fill={band!} stroke="#1d2433" strokeWidth="1.5" />}
            {bandRect && d && d.workshops > 0 && Array.from({ length: d.workshops }, (_, k) => {
              const hall = d.workshops === MAX_WORKSHOPS;
              if (hall && k > 0) return null;
              const cx = sideways ? bandRect![0] + bw / 2 : bandRect![0] + 12 + k * 18 + (hall ? w / 2 - 12 : 0);
              const cy = sideways ? bandRect![1] + 12 + k * 18 + (hall ? h / 2 - 12 : 0) : bandRect![1] + bw / 2;
              return hall ? <rect key={k} x={cx - 9} y={cy - 8} width="18" height="16" rx="2" fill="#c62828" stroke="#1d2433" strokeWidth="1.5" /> : <rect key={k} x={cx - 6} y={cy - 6} width="12" height="12" rx="2" fill="#2e7d32" stroke="#1d2433" strokeWidth="1.5" />;
            })}
            {icon && <text x={corner ? x + w / 2 : tx} y={corner ? y + 42 : sideways ? y + 34 : ty + 26} textAnchor="middle" className={corner ? 'ty-icon big' : 'ty-icon'}>{icon}</text>}
            {lines.map((ln, k) => <text key={k} x={corner ? x + w / 2 : tx} y={base + k * 16 + (corner && icon ? 18 : 0)} textAnchor="middle" className={corner ? 'ty-name corner' : 'ty-name'}>{ln}</text>)}
            {s.price && !(icon && sideways) && <text x={tx} y={side === 'bottom' ? y + h - 32 : y + h - 10} textAnchor="middle" className="ty-price">{s.price}</text>}
            {owner && <circle cx={side === 'top' ? x + w - 12 : side === 'bottom' ? x + w - 12 : side === 'left' ? x + w - 12 : x + 12} cy={side === 'top' ? y + h - 12 : side === 'bottom' ? y + 12 : y + h - 12} r="9" fill={owner.color} stroke="#1d2433" strokeWidth="2" />}
            {d?.mortgaged && <text x={x + w / 2} y={y + h / 2 + 6} textAnchor="middle" className="ty-mort">MORTGAGED</text>}
          </g>
        );
      })}
      {g.players.filter((p) => !p.out).map((p, k) => {
        const [x, y, w, h] = cellRect(p.pos);
        const inCell = p.pos === 10 && p.jail >= 0;
        const cx = x + w / 2 + ((k % 2) * 2 - 1) * 16 + (inCell ? 18 : 0);
        const cy = y + h / 2 + (k < 2 ? -6 : 22) + (inCell ? -24 : 0);
        return (
          <g key={p.id} className={`ty-piece ${p.id === cur?.id ? 'turn' : ''}`} pointerEvents="none">
            <circle cx={cx} cy={cy} r="17" fill={p.color} stroke="#1d2433" strokeWidth="3" />
            <text x={cx} y={cy + 6} textAnchor="middle" className="ty-piece-t">{p.name.slice(0, 1).toUpperCase()}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Die({ x, n }: { x: number; n: number }) {
  const P: Record<number, [number, number][]> = { 1: [[32, 32]], 2: [[18, 18], [46, 46]], 3: [[16, 16], [32, 32], [48, 48]], 4: [[18, 18], [46, 18], [18, 46], [46, 46]], 5: [[16, 16], [48, 16], [32, 32], [16, 48], [48, 48]], 6: [[18, 16], [46, 16], [18, 32], [46, 32], [18, 48], [46, 48]] };
  return (
    <g transform={`translate(${x} 0)`}>
      <rect width="64" height="64" rx="12" fill="#fff" stroke="#1d2433" strokeWidth="3" />
      {P[n].map(([a, b], k) => <circle key={k} cx={a} cy={b} r="6" fill="#1d2433" />)}
    </g>
  );
}
