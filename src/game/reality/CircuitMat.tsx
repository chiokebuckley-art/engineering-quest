import { useMemo, useRef, useState } from 'react';
import {
  COLS, ROWS, UNO_DIGITAL, UNO_ANALOG, FREE_LEADS, PART_NAME, PIN_LABEL, PART_PINS, footprint, occupied, parseHole, parseRail, isUno, unoPin, describeRef,
  type Circuit, type Part, type Ref, type Wire, type WireColor, type SimResult, type Env, type PartKind, type LedColor,
} from '../../engine/reality/circuit';
import type { ServoState } from '../../engine/reality/runtime';
import type { BuildStep, TrayItem } from '../../engine/reality/recipes';

/* ---------------- geometry ---------------- */
const P = 18;                       // hole pitch
const BX = 36;                      // x of column 1
const BY = 214;                     // top of the breadboard
const W = BX * 2 + (COLS - 1) * P;  // 594
const H = BY + 300;
const colX = (c: number) => BX + (c - 1) * P;
const ROW_Y: Record<string, number> = { a: 60, b: 78, c: 96, d: 114, e: 132, f: 168, g: 186, h: 204, i: 222, j: 240 };
const RAIL_Y = { tp: 14, tn: 32, bn: 268, bp: 286 } as const;
const ROW_IDX: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 6, g: 7, h: 8, i: 9, j: 10 };
const RAIL_IDX = { tp: -3, tn: -2, bn: 12, bp: 13 } as const;
/** UNO header sockets: digital along the top edge, power and analog along the bottom. */
const TOP_PINS = ['GND3', ...UNO_DIGITAL];
const BOTTOM_PINS = ['IOREF', 'RESET', '3V3', '5V', 'GND1', 'GND2', 'VIN'];
const UNO_POS: Record<string, [number, number]> = {};
TOP_PINS.forEach((p, i) => { UNO_POS[p] = [232 + i * 22, 30]; });
BOTTOM_PINS.forEach((p, i) => { UNO_POS[p] = [150 + i * 22, 172]; });
UNO_ANALOG.forEach((p, i) => { UNO_POS[p] = [330 + i * 22, 172]; });
const PIN_TEXT: Record<string, string> = { GND3: 'GND', GND1: 'GND', GND2: 'GND', '3V3': '3.3V', IOREF: 'IOREF', RESET: 'RST', VIN: 'Vin' };
const pinText = (p: string) => PIN_TEXT[p] ?? (p.startsWith('D') ? `${['D3', 'D5', 'D6', 'D9', 'D10', 'D11'].includes(p) ? '~' : ''}${p.slice(1)}` : p);

export function pos(ref: Ref): [number, number] {
  const h = parseHole(ref); if (h) return [colX(h.col), BY + ROW_Y[h.row]];
  const r = parseRail(ref); if (r) return [colX(r.col), BY + RAIL_Y[r.rail]];
  if (isUno(ref)) return UNO_POS[unoPin(ref)] ?? [0, 0];
  return [0, 0];
}
function gridIdx(ref: Ref): [number, number] | null {
  const h = parseHole(ref); if (h) return [h.col, ROW_IDX[h.row]];
  const r = parseRail(ref); if (r) return [r.col, RAIL_IDX[r.rail]];
  return null;
}
/** Every tappable point on the bench. */
const ALL_POINTS: Ref[] = (() => {
  const out: Ref[] = [];
  for (let c = 1; c <= COLS; c++) { for (const r of ROWS) out.push(`h${c}${r}`); for (const rl of ['tp', 'tn', 'bn', 'bp']) out.push(`${rl}${c}`); }
  for (const p of Object.keys(UNO_POS)) if (!['IOREF', 'RESET'].includes(p)) out.push(`u:${p}`);
  return out;
})();

const BAND = ['#1b1b1b', '#7a4a1c', '#d42a2a', '#f07f13', '#f2d21b', '#2b9d3c', '#2c5fd6', '#8a45c7', '#8c8c8c', '#f4f4f4'];
function bands(ohms: number): string[] {
  const exp = Math.floor(Math.log10(Math.max(1, ohms))) - 1; const sig = Math.round(ohms / 10 ** exp);
  return [BAND[Math.floor(sig / 10) % 10], BAND[sig % 10], BAND[Math.max(0, exp)]];
}
export const ohmsLabel = (o: number) => (o >= 1e6 ? `${o / 1e6} MΩ` : o >= 1000 ? `${o / 1000} kΩ` : `${o} Ω`);
const LED_FILL: Record<LedColor, string> = { red: '#ff3b30', yellow: '#ffd23f', green: '#34c759', blue: '#3a86ff', white: '#f5f5f5' };
const WIRE_FILL: Record<WireColor, string> = { red: '#e5383b', black: '#222', yellow: '#f4c430', green: '#2a9d4b', blue: '#2f6fe0', orange: '#f28c28', white: '#eee', brown: '#7b4a2d' };
function autoColor(a: Ref, b: Ref, n: number): WireColor {
  const any = (f: (r: Ref) => boolean) => f(a) || f(b);
  if (any((r) => r === 'u:5V' || r.startsWith('tp') || r.startsWith('bp'))) return 'red';
  if (any((r) => r.startsWith('u:GND') || r.startsWith('tn') || r.startsWith('bn'))) return 'black';
  return (['yellow', 'green', 'blue', 'orange', 'white'] as WireColor[])[n % 5];
}

/* ---------------- component ---------------- */

export interface MatProps {
  circuit: Circuit;
  editable: boolean;
  usb: boolean;
  result: SimResult;
  servo: Record<string, ServoState>;
  env: Env;
  txAgo?: number;
  tray?: TrayItem[];
  /** Guided build: only the current step's placement is accepted; its holes glow. */
  step?: BuildStep | null;
  onChange?: (c: Circuit, note?: string) => void;
  onPress?: (buttonId: string, down: boolean) => void;
  onNeedUnplug?: () => void;
  onUsb?: (on: boolean) => void;
}
type Tool = { t: 'select' } | { t: 'wire' } | { t: 'part'; item: number };

export function CircuitMat(props: MatProps) {
  const { circuit, editable, usb, result, servo, env, tray = [], step } = props;
  const svg = useRef<SVGSVGElement>(null);
  const [tool, setTool] = useState<Tool>({ t: 'select' });
  const [pending, setPending] = useState<Ref | null>(null);
  const [sel, setSel] = useState<{ kind: 'part' | 'wire'; id: string } | null>(null);
  const [msg, setMsg] = useState('');
  const [zoom, setZoom] = useState(() => typeof window !== 'undefined' && window.innerWidth < 700);
  const used = useMemo(() => occupied(circuit), [circuit]);
  const targets: Ref[] = step ? ('wire' in step ? step.wire : Object.values(step.part.pins)) : [];
  // Guided: the tray item or wire tool needed for this step is chosen automatically.
  const guidedTool: Tool | null = step ? ('wire' in step ? { t: 'wire' } : { t: 'part', item: Math.max(0, tray.findIndex((x) => x.kind === step.part.kind && (x.ohms === undefined || x.ohms === step.part.ohms) && (x.color === undefined || x.color === step.part.color))) }) : null;
  const active = guidedTool ?? tool;
  const activeItem = active.t === 'part' ? tray[active.item] : null;
  const leadsNeeded = activeItem ? PART_PINS[activeItem.kind] : [];

  const nearest = (clientX: number, clientY: number): Ref | null => {
    const el = svg.current; if (!el) return null;
    const pt = el.createSVGPoint(); pt.x = clientX; pt.y = clientY;
    const m = el.getScreenCTM(); if (!m) return null;
    const p = pt.matrixTransform(m.inverse());
    let best: Ref | null = null; let bd = 14 * 14;
    for (const r of ALL_POINTS) { const [x, y] = pos(r); const d = (x - p.x) ** 2 + (y - p.y) ** 2; if (d < bd) { bd = d; best = r; } }
    return best;
  };
  const say = (m: string) => setMsg(m);
  const count = (kind: PartKind, item?: TrayItem) => circuit.parts.filter((p) => p.kind === kind && (!item || ((item.ohms === undefined || p.ohms === item.ohms) && (item.color === undefined || p.color === item.color)))).length;
  const newId = (kind: PartKind) => { let i = 1; while (circuit.parts.some((p) => p.id === `${kind}${i}`)) i++; return `${kind}${i}`; };
  const matchesStep = (thing: { wire?: [Ref, Ref]; part?: Part }): boolean => {
    if (!step) return true;
    if ('wire' in step) return !!thing.wire && ((thing.wire[0] === step.wire[0] && thing.wire[1] === step.wire[1]) || (thing.wire[0] === step.wire[1] && thing.wire[1] === step.wire[0]));
    if (!thing.part || thing.part.kind !== step.part.kind) return false;
    const a = thing.part.pins; const b = step.part.pins;
    const same = Object.keys(b).every((k) => a[k] === b[k]);
    const symmetric = ['resistor', 'ldr', 'ntc'].includes(step.part.kind) && a.a === b.b && a.b === b.a;
    return same || symmetric;
  };
  const commit = (next: Circuit, note: string) => { props.onChange?.(next, note); setPending(null); setMsg(step ? '' : `✓ ${note}`); };

  const tap = (clientX: number, clientY: number) => {
    const r = nearest(clientX, clientY); if (!r) return;
    if (!editable) return;
    if (usb) { props.onNeedUnplug?.(); say('Unplug the USB cable before you change the circuit. Real builds too: power off first.'); return; }
    if (active.t === 'select') {
      const part = circuit.parts.find((p) => Object.values(p.pins).includes(r));
      const wire = circuit.wires.find((w) => w.a === r || w.b === r);
      setSel(part ? { kind: 'part', id: part.id } : wire ? { kind: 'wire', id: wire.id } : null);
      if (!part && !wire) say(describeRef(r));
      return;
    }
    if (r.startsWith('u:') && active.t === 'part') { say('Parts go in the breadboard; use a wire to reach the UNO.'); return; }
    if (used.has(r) && r !== pending) { say(`${describeRef(r)} already has something in it. One lead per hole.`); return; }
    if (active.t === 'wire') {
      if (!pending) { setPending(r); say(`Wire from ${describeRef(r)}… now tap where it goes.`); return; }
      if (r === pending) { setPending(null); say(''); return; }
      const wire: Wire = { id: `w${Date.now().toString(36)}`, a: pending, b: r, color: step && 'wire' in step ? step.color : autoColor(pending, r, circuit.wires.length) };
      if (!matchesStep({ wire: [wire.a, wire.b] })) { setPending(null); say(`Not quite. ${step?.text}`); return; }
      commit({ ...circuit, wires: [...circuit.wires, wire] }, `Wire: ${describeRef(wire.a)} → ${describeRef(wire.b)}`);
      return;
    }
    // placing a part
    const item = activeItem!;
    if (!step && count(item.kind, item) >= item.count) { say(`You have used all your ${item.label.toLowerCase()}s.`); return; }
    const kind = item.kind;
    const max = FREE_LEADS[kind];
    let part: Part | null = null;
    if (max) {
      if (!pending) { setPending(r); say(`Now tap the hole for the ${PIN_LABEL[leadsNeeded[1]]}.`); return; }
      if (r === pending) { setPending(null); return; }
      const a = gridIdx(pending); const b = gridIdx(r);
      if (!a || !b || Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) > max) { setPending(null); say(`The ${PART_NAME[kind].toLowerCase()}’s legs can’t stretch that far.`); return; }
      part = { id: step && 'part' in step ? step.part.id : newId(kind), kind, pins: { [leadsNeeded[0]]: pending, [leadsNeeded[1]]: r }, ohms: item.ohms, color: item.color };
    } else {
      const fp = footprint(kind, r);
      if (!fp) { say(kind === 'button' ? 'A button goes across the middle gap: tap a hole in row e.' : `Not enough room here for the ${PART_NAME[kind].toLowerCase()}.`); return; }
      const clash = Object.values(fp).find((x) => used.has(x));
      if (clash) { say(`${describeRef(clash)} is already taken.`); return; }
      part = { id: step && 'part' in step ? step.part.id : newId(kind), kind, pins: fp };
    }
    if (!matchesStep({ part })) { setPending(null); say(`Not quite. ${step?.text}`); return; }
    commit({ ...circuit, parts: [...circuit.parts, part] }, `${PART_NAME[kind]} placed`);
  };

  const remove = () => {
    if (!sel) return;
    if (usb) { props.onNeedUnplug?.(); say('Unplug the USB cable first.'); return; }
    const next = sel.kind === 'part' ? { ...circuit, parts: circuit.parts.filter((p) => p.id !== sel.id) } : { ...circuit, wires: circuit.wires.filter((w) => w.id !== sel.id) };
    commit(next, 'Removed'); setSel(null);
  };
  const selPart = sel?.kind === 'part' ? circuit.parts.find((p) => p.id === sel.id) : null;
  const selWire = sel?.kind === 'wire' ? circuit.wires.find((w) => w.id === sel.id) : null;
  const pinOn = (p: string) => { const d = result.pins[p]?.drive; return !!d && ((d.mode === 'out' && d.high) || d.mode === 'pwm'); };

  return (
    <div className="rl-mat">
      {editable && !step && (
        <div className="rl-tools" role="toolbar" aria-label="Bench tools">
          <button className={`rl-chip ${tool.t === 'select' ? 'on' : ''}`} onClick={() => { setTool({ t: 'select' }); setPending(null); }}>☝ Select</button>
          <button className={`rl-chip ${tool.t === 'wire' ? 'on' : ''}`} onClick={() => { setTool({ t: 'wire' }); setPending(null); setSel(null); }}>〰 Wire</button>
          {tray.map((it, i) => <button key={i} className={`rl-chip ${tool.t === 'part' && tool.item === i ? 'on' : ''}`} onClick={() => { setTool({ t: 'part', item: i }); setPending(null); setSel(null); }}>{it.label} <small>×{Math.max(0, it.count - count(it.kind, it))}</small></button>)}
        </div>
      )}
      {step && <div className="rl-step-tip">{'wire' in step ? '〰 Wire: ' : `${PART_NAME[step.part.kind]}${step.part.ohms ? ` ${ohmsLabel(step.part.ohms)}` : ''}: `}{pending ? `now tap the second point` : `tap the glowing ${targets.length > 1 && !('wire' in step) && FREE_LEADS[step.part.kind] ? 'holes, first one first' : 'hole'}`}.</div>}
      <div className={`rl-mat-scroll ${zoom ? 'zoom' : ''}`}>
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="rl-svg" role="img" aria-label="Breadboard and UNO. Tap holes to place parts and wires."
          onPointerDown={(e) => { if (e.button === 0) tap(e.clientX, e.clientY); }}>
          <defs>
            <radialGradient id="rlGlow"><stop offset="0%" stopColor="#fff" stopOpacity="0.9" /><stop offset="40%" stopColor="#fff" stopOpacity="0.4" /><stop offset="100%" stopColor="#fff" stopOpacity="0" /></radialGradient>
          </defs>
          {/* UNO board */}
          <g className="rl-uno">
            <rect x="60" y="8" width="512" height="182" rx="10" fill="#1d5aa6" stroke="#133e73" strokeWidth="2" />
            <rect x="20" y="36" width="58" height="44" rx="4" fill="#b8bec6" stroke="#6d737b" />
            <rect x="24" y="126" width="46" height="40" rx="6" fill="#222" />
            {usb && <path d="M 20 58 C -10 58 -10 58 -30 58" stroke="#4a6fb0" strokeWidth="10" fill="none" />}
            <text x="300" y="104" className="rl-uno-name">ELEGOO UNO R3</text>
            <rect x="330" y="120" width="120" height="26" rx="2" fill="#1b1b1b" />
            <text x="390" y="137" className="rl-chip-text">ATMEGA328P</text>
            <circle cx="112" cy="104" r="5" fill={usb && result.powered ? '#7dff7a' : '#2d4a2b'} /><text x="122" y="108" className="rl-uno-small">ON</text>
            <circle cx="205" cy="60" r="4.5" fill={usb && result.powered && pinOn('D13') ? '#ffcf3b' : '#5a4a1a'} /><text x="196" y="52" className="rl-uno-small">L</text>
            <circle cx="205" cy="76" r="3.5" fill={usb && (props.txAgo ?? 1e9) < 150 ? '#ffcf3b' : '#5a4a1a'} /><text x="180" y="80" className="rl-uno-small">TX</text>
            {[...TOP_PINS, ...BOTTOM_PINS, ...UNO_ANALOG].map((p) => { const [x, y] = UNO_POS[p]; const target = targets.includes(`u:${p}`); const pend = pending === `u:${p}`; return (
              <g key={p}>
                <rect x={x - 6} y={y - 6} width="12" height="12" fill={target ? '#ffd23f' : pend ? '#7df' : '#111'} stroke="#000" className={target ? 'rl-pulse' : ''} />
                <text x={x} y={y < 100 ? y + 20 : y - 11} className="rl-pin-label">{pinText(p)}</text>
              </g>
            ); })}
            <text x="232" y="62" className="rl-uno-small">DIGITAL (PWM ~)</text>
            <text x="150" y="146" className="rl-uno-small">POWER</text><text x="330" y="160" className="rl-uno-small">ANALOG IN</text>
          </g>
          {/* breadboard */}
          <g className="rl-bb">
            <rect x="10" y={BY - 4} width={W - 20} height="306" rx="8" fill="#f4f1e8" stroke="#cfc8b6" />
            <line x1={BX - 10} x2={W - BX + 10} y1={BY + 6} y2={BY + 6} stroke="#e23b3b" strokeWidth="1.5" />
            <line x1={BX - 10} x2={W - BX + 10} y1={BY + 40} y2={BY + 40} stroke="#2d6fe0" strokeWidth="1.5" />
            <line x1={BX - 10} x2={W - BX + 10} y1={BY + 260} y2={BY + 260} stroke="#2d6fe0" strokeWidth="1.5" />
            <line x1={BX - 10} x2={W - BX + 10} y1={BY + 294} y2={BY + 294} stroke="#e23b3b" strokeWidth="1.5" />
            <text x={BX - 24} y={BY + RAIL_Y.tp + 4} className="rl-rail-lbl plus">+</text><text x={BX - 24} y={BY + RAIL_Y.tn + 4} className="rl-rail-lbl minus">−</text>
            <text x={BX - 24} y={BY + RAIL_Y.bn + 4} className="rl-rail-lbl minus">−</text><text x={BX - 24} y={BY + RAIL_Y.bp + 4} className="rl-rail-lbl plus">+</text>
            <rect x={BX - 8} y={BY + 146} width={W - 2 * BX + 16} height="8" fill="#e2dccb" />
            {ROWS.map((r) => <text key={r} x={BX - 20} y={BY + ROW_Y[r] + 4} className="rl-row-lbl">{r}</text>)}
            {Array.from({ length: COLS }, (_, i) => i + 1).map((c) => (c === 1 || c % 5 === 0 ? <text key={c} x={colX(c)} y={BY + 50} className="rl-col-lbl">{c}</text> : null))}
            {ALL_POINTS.filter((r) => !isUno(r)).map((r) => { const [x, y] = pos(r); const target = targets.includes(r); const pend = pending === r; return (
              <rect key={r} x={x - 3.5} y={y - 3.5} width="7" height="7" rx="1.5" fill={target ? '#ffd23f' : pend ? '#39c' : used.has(r) ? '#555' : '#9a9486'} className={target ? 'rl-pulse' : ''} />
            ); })}
          </g>
          {/* parts */}
          {circuit.parts.map((p) => <PartGlyph key={p.id} p={p} result={result} servo={servo} env={env} selected={sel?.kind === 'part' && sel.id === p.id} usb={usb} onPress={props.onPress} />)}
          {/* wires */}
          {circuit.wires.map((w) => { const [x1, y1] = pos(w.a); const [x2, y2] = pos(w.b); const lift = Math.min(60, 14 + Math.abs(x2 - x1) * 0.12 + Math.abs(y2 - y1) * 0.08); const cx = (x1 + x2) / 2; const cy = Math.min(y1, y2) - lift; const on = sel?.kind === 'wire' && sel.id === w.id; return (
            <g key={w.id}>
              {on && <path d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} stroke="#39f" strokeWidth="8" fill="none" opacity="0.45" />}
              <path d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} stroke="#0006" strokeWidth="5" fill="none" />
              <path d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} stroke={WIRE_FILL[w.color]} strokeWidth="3.4" fill="none" strokeLinecap="round" />
              <circle cx={x1} cy={y1} r="3" fill="#333" /><circle cx={x2} cy={y2} r="3" fill="#333" />
            </g>
          ); })}
        </svg>
      </div>
      <div className="rl-mat-foot">
        {props.onUsb && <button className={`rl-usb ${usb ? 'on' : ''}`} onClick={() => props.onUsb!(!usb)} aria-pressed={usb}>{usb ? '🔌 USB plugged in · tap to unplug' : '🔌 Plug in USB'}</button>}
        <button className="rl-chip" onClick={() => setZoom((z) => !z)}>{zoom ? '⤢ Whole bench' : '🔍 Large holes'}</button>
      </div>
      {(msg || selPart || selWire) && (
        <div className="rl-mat-msg" role="status">
          {msg && <span>{msg}</span>}
          {selPart && <span><b>{PART_NAME[selPart.kind]}{selPart.ohms ? ` ${ohmsLabel(selPart.ohms)}` : ''}{selPart.blown ? ' (burned out)' : ''}</b>: {Object.entries(selPart.pins).map(([k, v]) => `${PIN_LABEL[k] ?? k} ${describeRef(v)}`).join(' · ')}</span>}
          {selWire && <span><b>Wire</b>: {describeRef(selWire.a)} → {describeRef(selWire.b)}</span>}
          {editable && !step && (selPart || selWire) && <button className="rl-chip danger" onClick={remove}>Remove</button>}
        </div>
      )}
    </div>
  );
}

function PartGlyph({ p, result, servo, env, selected, usb, onPress }: { p: Part; result: SimResult; servo: Record<string, ServoState>; env: Env; selected: boolean; usb: boolean; onPress?: (id: string, down: boolean) => void }) {
  const st = result.parts[p.id];
  const pts = Object.fromEntries(Object.entries(p.pins).map(([k, r]) => [k, pos(r)])) as Record<string, [number, number]>;
  const halo = selected ? <circle cx={avg(Object.values(pts))[0]} cy={avg(Object.values(pts))[1] - 8} r="24" fill="#39f" opacity="0.25" /> : null;
  switch (p.kind) {
    case 'resistor': case 'ldr': case 'ntc': {
      const [a, b] = [pts.a, pts.b]; const [mx, my] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 6]; const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
      return <g>{halo}
        <path d={`M ${a[0]} ${a[1]} L ${mx} ${my} L ${b[0]} ${b[1]}`} stroke="#9aa0a6" strokeWidth="1.6" fill="none" />
        {p.kind === 'resistor' && <g transform={`translate(${mx} ${my}) rotate(${ang})`}><rect x="-13" y="-5" width="26" height="10" rx="4" fill="#e8d3a8" stroke="#a88f64" />{bands(p.ohms ?? 220).map((c, i) => <rect key={i} x={-8 + i * 5} y="-5" width="2.6" height="10" fill={c} />)}<rect x="8" y="-5" width="2.6" height="10" fill="#c9a227" /></g>}
        {p.kind === 'ldr' && <g transform={`translate(${mx} ${my})`}><circle r="8" fill="#e9a35b" stroke="#a0662c" /><path d="M -5 -3 h 10 M -5 0 h 10 M -5 3 h 10" stroke="#8a3d12" strokeWidth="1" /></g>}
        {p.kind === 'ntc' && <ellipse cx={mx} cy={my} rx="6" ry="5" fill="#1b1b1b" />}
      </g>;
    }
    case 'led': {
      const a = pts.anode; const c = pts.cathode; const mx = (a[0] + c[0]) / 2; const my = Math.min(a[1], c[1]) - 16; const b = st?.brightness ?? 0; const col = LED_FILL[p.color ?? 'red'];
      return <g>{halo}
        <line x1={a[0]} y1={a[1]} x2={mx - 3} y2={my + 6} stroke="#9aa0a6" strokeWidth="1.8" /><line x1={c[0]} y1={c[1]} x2={mx + 3} y2={my + 6} stroke="#9aa0a6" strokeWidth="1.4" />
        {b > 0.02 && <circle cx={mx} cy={my} r={10 + 14 * b} fill={col} opacity={0.25 + 0.5 * b} style={{ filter: 'blur(2px)' }} />}
        <circle cx={mx} cy={my} r="8" fill={p.blown ? '#3a2a2a' : col} opacity={p.blown ? 1 : 0.55 + 0.45 * b} stroke="#0005" />
        {b > 0.3 && <circle cx={mx} cy={my} r="5" fill="url(#rlGlow)" />}
        {p.blown && <text x={mx} y={my + 4} className="rl-blown">✕</text>}
        <text x={a[0]} y={a[1] + 14} className="rl-lead-lbl">+</text>
      </g>;
    }
    case 'buzzer': case 'pbuzzer': {
      const a = pts.plus; const c = pts.minus; const mx = (a[0] + c[0]) / 2; const my = Math.min(a[1], c[1]) - 18; const on = st?.sounding;
      return <g>{halo}
        <line x1={a[0]} y1={a[1]} x2={mx - 4} y2={my + 8} stroke="#9aa0a6" strokeWidth="1.6" /><line x1={c[0]} y1={c[1]} x2={mx + 4} y2={my + 8} stroke="#9aa0a6" strokeWidth="1.6" />
        {on && [16, 24, 32].map((r) => <circle key={r} cx={mx} cy={my} r={r} fill="none" stroke="#ffb703" strokeWidth="1.5" className="rl-wave" />)}
        <circle cx={mx} cy={my} r="12" fill="#1f1f1f" stroke="#000" /><circle cx={mx} cy={my} r="2.5" fill={p.kind === 'pbuzzer' ? '#2f8f4e' : '#444'} />
        <text x={mx - 8} y={my - 4} className="rl-lead-lbl light">+</text>
      </g>;
    }
    case 'button': {
      const xs = Object.values(pts).map((q) => q[0]); const ys = Object.values(pts).map((q) => q[1]);
      const x0 = Math.min(...xs) - 6; const x1 = Math.max(...xs) + 6; const y0 = Math.min(...ys) - 6; const y1 = Math.max(...ys) + 6; const down = !!env.pressed[p.id];
      const press = (d: boolean) => (e: React.PointerEvent) => { if (usb) { e.stopPropagation(); onPress?.(p.id, d); } };
      return <g>{halo}
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx="3" fill="#2b2b2b" transform={p.rotated ? `rotate(90 ${(x0 + x1) / 2} ${(y0 + y1) / 2})` : undefined} />
        <circle cx={(x0 + x1) / 2} cy={(y0 + y1) / 2} r={down ? 9 : 11} fill={down ? '#555' : '#777'} stroke="#111" style={{ cursor: usb ? 'pointer' : 'default' }}
          onPointerDown={press(true)} onPointerUp={press(false)} onPointerLeave={press(false)} />
      </g>;
    }
    case 'pot': {
      const m = pts.wiper; const pos0 = env.knob[p.id] ?? 0.5; const ang = -135 + 270 * pos0;
      return <g>{halo}
        <rect x={pts.end1[0] - 8} y={m[1] - 26} width={pts.end2[0] - pts.end1[0] + 16} height="22" rx="4" fill="#1f4fa0" />
        {Object.values(pts).map((q, i) => <line key={i} x1={q[0]} y1={q[1]} x2={q[0]} y2={m[1] - 6} stroke="#9aa0a6" strokeWidth="1.6" />)}
        <circle cx={m[0]} cy={m[1] - 15} r="9" fill="#d9d9d9" stroke="#777" />
        <line x1={m[0]} y1={m[1] - 15} x2={m[0] + 8 * Math.sin((ang * Math.PI) / 180)} y2={m[1] - 15 - 8 * Math.cos((ang * Math.PI) / 180)} stroke="#333" strokeWidth="2" />
      </g>;
    }
    case 'ultrasonic': case 'dht11': {
      const ptsArr = Object.values(pts); const x0 = Math.min(...ptsArr.map((q) => q[0])); const x1 = Math.max(...ptsArr.map((q) => q[0])); const y = ptsArr[0][1];
      const wide = p.kind === 'ultrasonic' ? 44 : 14;
      return <g>{halo}
        {ptsArr.map((q, i) => <line key={i} x1={q[0]} y1={q[1]} x2={q[0]} y2={y - 16} stroke="#b9b9b9" strokeWidth="1.6" />)}
        <rect x={x0 - wide} y={y - 52} width={x1 - x0 + 2 * wide} height="38" rx="3" fill={p.kind === 'ultrasonic' ? '#2059b8' : '#2a8ad6'} stroke="#123a78" />
        {p.kind === 'ultrasonic' ? <>{[x0 - wide + 20, x1 + wide - 20].map((cx) => <g key={cx}><circle cx={cx} cy={y - 33} r="15" fill="#c9ccd1" stroke="#555" /><circle cx={cx} cy={y - 33} r="10" fill="#8e9298" /></g>)}{usb && result.powered && <path d={`M ${x0 - wide + 20} ${y - 52} q 10 -12 20 0`} fill="none" stroke="#7df" opacity="0.6" className="rl-wave" />}</>
          : <g>{[0, 1, 2, 3].map((i) => <rect key={i} x={x0 - wide + 4 + i * 11} y={y - 46} width="8" height="26" fill="#e8f1fb" opacity="0.8" />)}</g>}
        {Object.keys(pts).map((k) => <text key={k} x={pts[k][0]} y={y - 18} className="rl-mod-lbl">{k === 'data' ? 'S' : k === 'vcc' ? '+' : k === 'gnd' ? (p.kind === 'dht11' ? '−' : 'GND') : k === 'trig' ? 'Trig' : k === 'echo' ? 'Echo' : 'VCC'}</text>)}
      </g>;
    }
    case 'servo': {
      const g = pts.gnd; const s2 = pts.sig; const cx = (g[0] + s2[0]) / 2; const y = g[1] - 70; const a = servo[p.id]?.angle ?? 90;
      return <g>{halo}
        {([['gnd', '#7b4a2d'], ['vcc', '#e5383b'], ['sig', '#f28c28']] as const).map(([k, c], i) => <path key={k} d={`M ${pts[k][0]} ${pts[k][1]} C ${pts[k][0]} ${y + 30} ${cx - 6 + i * 6} ${y + 30} ${cx - 6 + i * 6} ${y + 16}`} stroke={c} strokeWidth="2.4" fill="none" />)}
        <rect x={cx - 26} y={y - 16} width="52" height="32" rx="4" fill="#2d63b8" stroke="#163b75" />
        <circle cx={cx + 12} cy={y} r="7" fill="#eee" />
        <g transform={`rotate(${a - 90} ${cx + 12} ${y})`}><rect x={cx + 9} y={y - 30} width="6" height="30" rx="3" fill="#f7f7f7" stroke="#aaa" /></g>
        <text x={cx - 12} y={y + 4} className="rl-mod-lbl light">SG90</text>
      </g>;
    }
  }
  return null;
}
const avg = (ps: [number, number][]): [number, number] => [ps.reduce((s, q) => s + q[0], 0) / ps.length, ps.reduce((s, q) => s + q[1], 0) / ps.length];
