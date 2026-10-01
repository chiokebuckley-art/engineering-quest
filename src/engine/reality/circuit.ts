/**
 * The virtual bench: an 830-point breadboard (the first 30 columns are on screen), an UNO R3, and the parts
 * from Electronics Kit 01, each with a simple, honest electrical model. `solve` finds every net's voltage
 * with nodal analysis (resistors, sources, diodes); the runtime (runtime.ts) runs a sketch against it.
 */

export const COLS = 30;
export const ROWS_TOP = ['a', 'b', 'c', 'd', 'e'] as const;
export const ROWS_BOTTOM = ['f', 'g', 'h', 'i', 'j'] as const;
export const ROWS = [...ROWS_TOP, ...ROWS_BOTTOM] as const;
export type Row = (typeof ROWS)[number];

/** UNO header pins, left→right as printed on the board edges. GND1–3 are the three ground sockets. */
export const UNO_DIGITAL = ['D13', 'D12', 'D11', 'D10', 'D9', 'D8', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0'] as const;
export const UNO_POWER = ['IOREF', 'RESET', '3V3', '5V', 'GND1', 'GND2', 'VIN'] as const;
export const UNO_ANALOG = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'] as const;
export const PWM_PINS = new Set(['D3', 'D5', 'D6', 'D9', 'D10', 'D11']);
export const PIN_LIMIT_MA = 40;        // absolute maximum per I/O pin
export const PIN_SAFE_MA = 20;         // comfortable per-pin current
export const USB_FUSE_MA = 500;        // the UNO's resettable USB fuse

/**
 * Point references:
 *  'h12e'   breadboard hole column 12 row e
 *  'tp7' 'tn7' 'bp7' 'bn7'  top +/−, bottom +/− rail at column 7
 *  'u:D13', 'u:5V', 'u:GND1', 'u:A0' … UNO header sockets (GND3 sits on the digital header)
 */
export type Ref = string;
export const hole = (col: number, row: Row): Ref => `h${col}${row}`;
export function parseHole(ref: Ref): { col: number; row: Row } | null {
  const m = /^h(\d+)([a-j])$/.exec(ref);
  return m ? { col: Number(m[1]), row: m[2] as Row } : null;
}
export function parseRail(ref: Ref): { rail: 'tp' | 'tn' | 'bp' | 'bn'; col: number } | null {
  const m = /^(tp|tn|bp|bn)(\d+)$/.exec(ref);
  return m ? { rail: m[1] as 'tp', col: Number(m[2]) } : null;
}
export const isUno = (ref: Ref) => ref.startsWith('u:');
export const unoPin = (ref: Ref) => ref.slice(2);

/** Which net a point belongs to before wires are considered (the breadboard's own metal strips). */
export function baseNet(ref: Ref): string {
  const h = parseHole(ref);
  if (h) return `col${h.col}${(ROWS_TOP as readonly string[]).includes(h.row) ? 'T' : 'B'}`;
  const r = parseRail(ref);
  if (r) return `rail-${r.rail}`;
  if (isUno(ref)) { const p = unoPin(ref); return p.startsWith('GND') ? 'GND' : `pin-${p}`; }
  return `x-${ref}`;
}

/** Human description: 'column 12, row e', 'the top + rail', 'UNO pin 13'. */
export function describeRef(ref: Ref): string {
  const h = parseHole(ref); if (h) return `hole ${h.row}${h.col}`;
  const r = parseRail(ref); if (r) return `the ${r.rail[0] === 't' ? 'top' : 'bottom'} ${r.rail[1] === 'p' ? '+ (red)' : '− (blue)'} rail`;
  if (isUno(ref)) { const p = unoPin(ref); return p.startsWith('D') ? `UNO pin ${p.slice(1)}` : p.startsWith('GND') ? 'UNO GND' : `UNO ${p}`; }
  return ref;
}

/* ---------------- parts ---------------- */

export type LedColor = 'red' | 'yellow' | 'green' | 'blue' | 'white';
export type PartKind = 'resistor' | 'led' | 'button' | 'pot' | 'ldr' | 'ntc' | 'buzzer' | 'pbuzzer' | 'ultrasonic' | 'dht11' | 'servo';
export interface Part {
  id: string;
  kind: PartKind;
  /** pin name → point it is plugged into */
  pins: Record<string, Ref>;
  ohms?: number;          // resistor value
  color?: LedColor;
  blown?: boolean;        // an LED that has been over-driven stays dark until replaced
  rotated?: boolean;      // a button turned 90°: its always-joined legs run along the row
}
export interface Wire { id: string; a: Ref; b: Ref; color: WireColor }
export type WireColor = 'red' | 'black' | 'yellow' | 'green' | 'blue' | 'orange' | 'white' | 'brown';
export interface Circuit { parts: Part[]; wires: Wire[] }
export const emptyCircuit = (): Circuit => ({ parts: [], wires: [] });

export const PART_PINS: Record<PartKind, string[]> = {
  resistor: ['a', 'b'], led: ['anode', 'cathode'], ldr: ['a', 'b'], ntc: ['a', 'b'],
  button: ['a1', 'a2', 'b1', 'b2'], pot: ['end1', 'wiper', 'end2'],
  buzzer: ['plus', 'minus'], pbuzzer: ['plus', 'minus'],
  ultrasonic: ['vcc', 'trig', 'echo', 'gnd'], dht11: ['data', 'vcc', 'gnd'], servo: ['gnd', 'vcc', 'sig'],
};
export const PIN_LABEL: Record<string, string> = {
  a: 'lead', b: 'lead', anode: 'long leg (+, anode)', cathode: 'short leg (−, cathode)', a1: 'leg', a2: 'leg', b1: 'leg', b2: 'leg',
  end1: 'left leg', wiper: 'middle leg (wiper)', end2: 'right leg', plus: '+ leg', minus: '− leg',
  vcc: 'VCC', trig: 'Trig', echo: 'Echo', gnd: 'GND', data: 'S (data)', sig: 'signal',
};
export const PART_NAME: Record<PartKind, string> = {
  resistor: 'Resistor', led: 'LED', button: 'Button', pot: '10k potentiometer', ldr: 'Photoresistor', ntc: 'Thermistor',
  buzzer: 'Active buzzer', pbuzzer: 'Passive buzzer', ultrasonic: 'Ultrasonic sensor', dht11: 'DHT11 module', servo: 'SG90 servo',
};
/** Parts whose legs the player places one by one (up to this many holes apart); the rest have a fixed footprint. */
export const FREE_LEADS: Partial<Record<PartKind, number>> = { resistor: 8, led: 3, ldr: 6, ntc: 6, buzzer: 4, pbuzzer: 4 };

/**
 * Fixed footprints from one anchor hole: a button straddles the middle gap (anchor in row e), modules and the
 * servo connector plug into consecutive columns of one row.
 */
export function footprint(kind: PartKind, anchor: Ref, rotated = false): Record<string, Ref> | null {
  const h = parseHole(anchor); if (!h) return null;
  const c = h.col;
  const at = (col: number, row: Row) => (col >= 1 && col <= COLS ? hole(col, row) : null);
  let pins: Record<string, Ref | null> = {};
  if (kind === 'button') {
    if (h.row !== 'e') return null;
    pins = { a1: at(c, 'e'), a2: at(c, 'f'), b1: at(c + 2, 'e'), b2: at(c + 2, 'f') };
    void rotated;
  } else if (kind === 'pot') pins = { end1: at(c, h.row), wiper: at(c + 1, h.row), end2: at(c + 2, h.row) };
  else if (kind === 'ultrasonic') pins = { vcc: at(c, h.row), trig: at(c + 1, h.row), echo: at(c + 2, h.row), gnd: at(c + 3, h.row) };
  else if (kind === 'dht11') pins = { data: at(c, h.row), vcc: at(c + 1, h.row), gnd: at(c + 2, h.row) };
  else if (kind === 'servo') pins = { gnd: at(c, h.row), vcc: at(c + 1, h.row), sig: at(c + 2, h.row) };
  else return null;
  if (Object.values(pins).some((p) => !p)) return null;
  return pins as Record<string, Ref>;
}

/** Points already holding a lead or wire end (one per hole, like the real board). */
export function occupied(c: Circuit): Set<Ref> {
  const s = new Set<Ref>();
  for (const p of c.parts) for (const r of Object.values(p.pins)) s.add(r);
  for (const w of c.wires) { s.add(w.a); s.add(w.b); }
  return s;
}

/* ---------------- nets ---------------- */

class UnionFind {
  parent = new Map<string, string>();
  find(x: string): string { let p = this.parent.get(x) ?? x; if (p !== x) { p = this.find(p); this.parent.set(x, p); } return p; }
  union(a: string, b: string) { const ra = this.find(a); const rb = this.find(b); if (ra !== rb) this.parent.set(ra, rb); }
}

/** Nets after wires and always-joined part legs; returns a lookup from any point to its net id. */
export function buildNets(c: Circuit): (ref: Ref) => string {
  const uf = new UnionFind();
  for (const w of c.wires) uf.union(baseNet(w.a), baseNet(w.b));
  for (const p of c.parts) if (p.kind === 'button') {
    // Legs across the gap are one metal piece; a rotated button joins along the row instead.
    if (!p.rotated) { uf.union(baseNet(p.pins.a1), baseNet(p.pins.a2)); uf.union(baseNet(p.pins.b1), baseNet(p.pins.b2)); }
    else { uf.union(baseNet(p.pins.a1), baseNet(p.pins.b1)); uf.union(baseNet(p.pins.a2), baseNet(p.pins.b2)); }
  }
  // Whatever joins the UNO's ground is the reference net 'GND'.
  const gnd = uf.find('GND');
  return (ref: Ref) => { const r = uf.find(baseNet(ref)); return r === gnd ? 'GND' : r; };
}

/* ---------------- environment ---------------- */

export interface Env {
  light: number;               // 0 (dark) … 100 (bright)
  tempC: number;               // room temperature
  humidity: number;            // %
  distanceCm: number;          // object in front of the ultrasonic sensor
  knob: Record<string, number>;      // pot id → 0…1
  pressed: Record<string, boolean>;  // button id → held
}
export const defaultEnv = (): Env => ({ light: 60, tempC: 22, humidity: 45, distanceCm: 80, knob: {}, pressed: {} });

export const LED_VF: Record<LedColor, number> = { red: 1.9, yellow: 2.0, green: 2.1, blue: 3.0, white: 3.0 };
export const ldrOhms = (light: number) => 10 ** (Math.log10(200_000) - (Math.max(0, Math.min(100, light)) / 100) * (Math.log10(200_000) - Math.log10(1_000)));
export const ntcOhms = (tempC: number) => 10_000 * Math.exp(3950 * (1 / (tempC + 273.15) - 1 / 298.15));

/* ---------------- solving ---------------- */

/** What the UNO is doing with each pin this instant (set by the running sketch). */
export type PinDrive = { mode: 'out'; high: boolean } | { mode: 'pwm'; duty: number } | { mode: 'tone'; freq: number } | { mode: 'in' } | { mode: 'pullup' };

type Elem =
  | { k: 'R'; a: string; b: string; ohms: number; part?: string; tag?: string }
  | { k: 'S'; a: string; volts: number; rint: number; pin: string }
  | { k: 'D'; a: string; c: string; vf: number; rs: number; part: string; tag?: string };

export type WarningKind = 'short' | 'led-overcurrent' | 'pin-overcurrent' | 'reverse-led' | 'floating-input' | 'motor-on-pin' | 'module-power' | 'blown';
export interface SimWarning { kind: WarningKind; text: string; part?: string; pin?: string }
export interface PartState { i: number; v: number; brightness?: number; sounding?: boolean; freq?: number; over?: boolean }
export interface PinState { drive: PinDrive; v: number; ma: number; reading?: 0 | 1 | 'float'; analog?: number }
export interface SimResult {
  powered: boolean;              // false when the USB fuse has tripped (a short)
  net: (ref: Ref) => string;
  v: Record<string, number>;
  parts: Record<string, PartState>;
  pins: Record<string, PinState>;
  warnings: SimWarning[];
  usbMa: number;
}

const HEADER_PINS = [...UNO_DIGITAL, ...UNO_ANALOG];
const pinName = (p: string) => (p.startsWith('D') ? `pin ${p.slice(1)}` : p);

/**
 * Solve the DC state of the bench. `drives` holds each UNO pin's mode from the sketch; PWM and tone pins are
 * solved HIGH and LOW and their parts' results are averaged by duty (brightness follows average current).
 */
export function solve(c: Circuit, drives: Record<string, PinDrive>, env: Env, usb = true): SimResult {
  const net = buildNets(c);
  const pwmPins = Object.entries(drives).filter(([, d]) => d.mode === 'pwm' || d.mode === 'tone').map(([p]) => p);
  if (!pwmPins.length) return solveOnce(c, drives, env, usb, net);
  // Solve with every PWM/tone pin HIGH, then LOW, and blend by duty.
  const duty = (p: string) => { const d = drives[p]; return d.mode === 'pwm' ? d.duty / 255 : 0.5; };
  const hi: Record<string, PinDrive> = { ...drives }; const lo: Record<string, PinDrive> = { ...drives };
  for (const p of pwmPins) { hi[p] = { mode: 'out', high: true }; lo[p] = { mode: 'out', high: false }; }
  const H = solveOnce(c, hi, env, usb, net); const L = solveOnce(c, lo, env, usb, net);
  const w = pwmPins.length ? duty(pwmPins[0]) : 1;
  const mix = (a: number, b: number) => a * w + b * (1 - w);
  const out: SimResult = { ...H, v: {}, parts: {}, pins: {} };
  for (const k of Object.keys(H.v)) out.v[k] = mix(H.v[k], L.v[k] ?? 0);
  for (const k of Object.keys(H.parts)) {
    const a = H.parts[k]; const b = L.parts[k] ?? a;
    out.parts[k] = { ...a, i: mix(a.i, b.i), v: mix(a.v, b.v), brightness: a.brightness === undefined ? undefined : mix(a.brightness, b.brightness ?? 0), over: a.over || b.over };
  }
  for (const k of Object.keys(H.pins)) out.pins[k] = { ...H.pins[k], drive: drives[k] ?? H.pins[k].drive, v: mix(H.pins[k].v, L.pins[k]?.v ?? 0), ma: Math.max(H.pins[k].ma, L.pins[k]?.ma ?? 0) };
  // Sound: a passive buzzer on a tone pin sings at that pitch.
  for (const p of c.parts) if (p.kind === 'pbuzzer') {
    const toneP = pwmPins.find((pin) => drives[pin].mode === 'tone' && (net(p.pins.plus) === net(`u:${pin}`) || net(p.pins.minus) === net(`u:${pin}`)));
    const other = toneP ? (net(p.pins.plus) === net(`u:${toneP}`) ? p.pins.minus : p.pins.plus) : null;
    if (toneP && other && net(other) === 'GND' && H.powered) out.parts[p.id] = { ...out.parts[p.id], sounding: true, freq: (drives[toneP] as { freq: number }).freq };
  }
  out.warnings = dedupeWarnings([...H.warnings, ...L.warnings]);
  return out;
}

function dedupeWarnings(ws: SimWarning[]): SimWarning[] {
  const seen = new Set<string>(); return ws.filter((w) => { const k = `${w.kind}|${w.part ?? ''}|${w.pin ?? ''}`; if (seen.has(k)) return false; seen.add(k); return true; });
}

function solveOnce(c: Circuit, drives: Record<string, PinDrive>, env: Env, usb: boolean, net: (r: Ref) => string): SimResult {
  const warnings: SimWarning[] = [];
  const elems: Elem[] = [];
  // Sources: the UNO's supply pins and every output pin, each with a small internal resistance.
  if (usb) {
    elems.push({ k: 'S', a: net('u:5V'), volts: 5, rint: 0.05, pin: '5V' });
    elems.push({ k: 'S', a: net('u:3V3'), volts: 3.3, rint: 0.5, pin: '3V3' });
    elems.push({ k: 'S', a: net('u:VIN'), volts: 4.7, rint: 0.2, pin: 'VIN' });
    for (const p of HEADER_PINS) {
      const d = drives[p]; if (!d) continue;
      if (d.mode === 'out') elems.push({ k: 'S', a: net(`u:${p}`), volts: d.high ? 5 : 0, rint: 25, pin: p });
      else if (d.mode === 'pullup') elems.push({ k: 'R', a: net(`u:${p}`), b: net('u:5V'), ohms: 35_000, tag: `pullup-${p}` });
    }
  }
  for (const p of c.parts) {
    const n = (pin: string) => net(p.pins[pin]);
    switch (p.kind) {
      case 'resistor': elems.push({ k: 'R', a: n('a'), b: n('b'), ohms: Math.max(0.01, p.ohms ?? 220), part: p.id }); break;
      case 'ldr': elems.push({ k: 'R', a: n('a'), b: n('b'), ohms: ldrOhms(env.light), part: p.id }); break;
      case 'ntc': elems.push({ k: 'R', a: n('a'), b: n('b'), ohms: ntcOhms(env.tempC), part: p.id }); break;
      case 'pot': {
        const pos = Math.max(0, Math.min(1, env.knob[p.id] ?? 0.5));
        elems.push({ k: 'R', a: n('end1'), b: n('wiper'), ohms: Math.max(1, pos * 10_000), part: p.id, tag: 'track1' });
        elems.push({ k: 'R', a: n('wiper'), b: n('end2'), ohms: Math.max(1, (1 - pos) * 10_000), part: p.id, tag: 'track2' });
        break;
      }
      case 'led': if (!p.blown) elems.push({ k: 'D', a: n('anode'), c: n('cathode'), vf: LED_VF[p.color ?? 'red'], rs: 15, part: p.id }); break;
      case 'buzzer': elems.push({ k: 'D', a: n('plus'), c: n('minus'), vf: 0.05, rs: 160, part: p.id }); break;
      case 'pbuzzer': elems.push({ k: 'R', a: n('plus'), b: n('minus'), ohms: 1_000, part: p.id }); break;
      case 'button': {
        const pressed = !!env.pressed[p.id];
        if (pressed) elems.push({ k: 'R', a: p.rotated ? n('a1') : n('a1'), b: p.rotated ? n('a2') : n('b1'), ohms: 0.05, part: p.id });
        break;
      }
      case 'ultrasonic': elems.push({ k: 'R', a: n('vcc'), b: n('gnd'), ohms: 330, part: p.id }); break;
      case 'dht11': elems.push({ k: 'R', a: n('vcc'), b: n('gnd'), ohms: 5_000, part: p.id }); elems.push({ k: 'R', a: n('data'), b: n('vcc'), ohms: 10_000, part: p.id, tag: 'pullup' }); break;
      case 'servo': elems.push({ k: 'R', a: n('vcc'), b: n('gnd'), ohms: 500, part: p.id }); break;
    }
  }
  // Node list (GND is the reference).
  const nodes = new Set<string>();
  for (const e of elems) { if (e.k === 'R') { nodes.add(e.a); nodes.add(e.b); } else if (e.k === 'S') nodes.add(e.a); else { nodes.add(e.a); nodes.add(e.c); } }
  for (const r of allRefs(c)) nodes.add(net(r));
  for (const p of HEADER_PINS) nodes.add(net(`u:${p}`));
  nodes.delete('GND');
  const ids = [...nodes]; const idx = new Map(ids.map((x, i) => [x, i]));
  const diodeOn = new Map<Elem, boolean>();
  let V: number[] = ids.map(() => 0);
  for (let iter = 0; iter < 30; iter++) {
    V = linearSolve(ids.length, (G, I) => {
      const at = (x: string) => (x === 'GND' ? -1 : idx.get(x)!);
      const g2 = (a: number, b: number, g: number) => { if (a >= 0) G[a][a] += g; if (b >= 0) G[b][b] += g; if (a >= 0 && b >= 0) { G[a][b] -= g; G[b][a] -= g; } };
      for (let i = 0; i < ids.length; i++) G[i][i] += 1e-9;
      for (const e of elems) {
        if (e.k === 'R') g2(at(e.a), at(e.b), 1 / e.ohms);
        else if (e.k === 'S') { const a = at(e.a); if (a >= 0) { G[a][a] += 1 / e.rint; I[a] += e.volts / e.rint; } }
        else if (diodeOn.get(e)) { const a = at(e.a); const cc = at(e.c); const g = 1 / e.rs; g2(a, cc, g); if (a >= 0) I[a] += g * e.vf; if (cc >= 0) I[cc] -= g * e.vf; }
      }
    });
    let changed = false;
    const volt = (x: string) => (x === 'GND' ? 0 : V[idx.get(x)!]);
    for (const e of elems) if (e.k === 'D') {
      const on = diodeOn.get(e) ?? false; const vd = volt(e.a) - volt(e.c);
      if (!on && vd > e.vf + 1e-6) { diodeOn.set(e, true); changed = true; }
      else if (on && (vd - e.vf) / e.rs < -1e-9) { diodeOn.set(e, false); changed = true; }
    }
    if (!changed) break;
  }
  const volt = (x: string) => (x === 'GND' ? 0 : V[idx.get(x)!] ?? 0);
  const v: Record<string, number> = { GND: 0 }; for (const x of ids) v[x] = volt(x);

  // Source currents (mA): current leaving each source into the circuit.
  const srcMa = (pin: string) => { const e = elems.find((x) => x.k === 'S' && x.pin === pin) as Extract<Elem, { k: 'S' }> | undefined; return e ? ((e.volts - volt(e.a)) / e.rint) * 1000 : 0; };
  const usbMa = srcMa('5V') + srcMa('3V3') + srcMa('VIN') + HEADER_PINS.reduce((s, p) => s + Math.max(0, drives[p]?.mode === 'out' && (drives[p] as { high: boolean }).high ? srcMa(p) : 0), 0);
  const powered = usb && usbMa < USB_FUSE_MA;
  if (usb && !powered) warnings.push({ kind: 'short', text: 'Short circuit! The 5 V supply is connected straight to ground, so a huge current flows. The UNO’s USB fuse cut the power to protect your computer. Unplug, find the wire that joins + to −, then plug in again.' });

  const parts: Record<string, PartState> = {};
  for (const p of c.parts) {
    const mine = elems.filter((e) => (e.k === 'R' || e.k === 'D') && e.part === p.id);
    let i = 0; let vAcross = 0;
    for (const e of mine) {
      if (e.k === 'R' && e.tag !== 'pullup') { const d = volt(e.a) - volt(e.b); i = Math.max(i, Math.abs(d / e.ohms)); vAcross = Math.max(vAcross, Math.abs(d)); }
      if (e.k === 'D') { const d = volt(e.a) - volt(e.c); vAcross = d; i = diodeOn.get(e) ? Math.max(0, (d - e.vf) / e.rs) : 0; }
    }
    if (!powered) i = 0;
    const st: PartState = { i: i * 1000, v: vAcross };
    if (p.kind === 'led') {
      if (p.blown) { st.brightness = 0; warnings.push({ kind: 'blown', part: p.id, text: 'This LED burned out earlier. Replace it: remove it and place a new one.' }); }
      else {
        st.brightness = Math.min(1, st.i / 15);
        if (st.i > 30) { st.over = true; warnings.push({ kind: 'led-overcurrent', part: p.id, text: `About ${Math.round(st.i)} mA is flowing through the LED. It is only made for about 20 mA, so it would burn out. It needs a resistor in series to limit the current.` }); }
        if (powered && vAcross < -1.5) warnings.push({ kind: 'reverse-led', part: p.id, text: 'The LED is in backwards: current can only flow from its long leg (+) to its short leg (−).' });
      }
    }
    if (p.kind === 'buzzer') st.sounding = powered && vAcross > 3.0;
    if (p.kind === 'ultrasonic' || p.kind === 'dht11' || p.kind === 'servo') {
      const supply = volt(net(p.pins.vcc)) - volt(net(p.pins.gnd));
      if (powered && supply < 4.3 && supply > 0.2) warnings.push({ kind: 'module-power', part: p.id, text: `${PART_NAME[p.kind]} gets only ${supply.toFixed(1)} V. It needs 5 V between VCC and GND.` });
    }
    parts[p.id] = st;
  }
  // Pin states and readings.
  const pins: Record<string, PinState> = {};
  const driven = drivenNets(elems, diodeOn, net);
  for (const p of HEADER_PINS) {
    const d = drives[p] ?? { mode: 'in' as const };
    const nv = powered ? volt(net(`u:${p}`)) : 0;
    const ma = d.mode === 'out' ? Math.abs(srcMa(p)) : 0;
    const st: PinState = { drive: d, v: nv, ma: powered ? ma : 0 };
    if (d.mode === 'in' || d.mode === 'pullup') {
      const floating = !driven.has(net(`u:${p}`));
      st.reading = floating ? 'float' : nv > 2.5 ? 1 : 0;
      st.analog = floating ? undefined : Math.max(0, Math.min(1023, Math.round((nv / 5) * 1023)));
    }
    if (powered && d.mode === 'out' && ma > PIN_LIMIT_MA) warnings.push({ kind: 'pin-overcurrent', pin: p, text: `${pinName(p)} is being asked for about ${Math.round(ma)} mA. A pin can safely give about 20 mA (40 mA at the very most), so this could damage the UNO. Add a resistor, or use a driver for motors.` });
    pins[p] = st;
  }
  for (const p of c.parts) if (p.kind === 'servo') {
    const vccNet = net(p.pins.vcc);
    const pinPower = HEADER_PINS.find((x) => x.startsWith('D') && net(`u:${x}`) === vccNet);
    if (pinPower) warnings.push({ kind: 'motor-on-pin', part: p.id, pin: pinPower, text: 'The servo’s red power wire is on a signal pin. A motor needs the 5 V supply pin; a signal pin can only give about 20 mA.' });
  }
  return { powered, net, v, parts, pins, warnings: dedupeWarnings(warnings), usbMa };
}

/** Nets that have a real DC path to a source or ground (so inputs on them read a definite value). */
function drivenNets(elems: Elem[], diodeOn: Map<Elem, boolean>, net: (r: Ref) => string): Set<string> {
  const adj = new Map<string, string[]>();
  const link = (a: string, b: string) => { (adj.get(a) ?? adj.set(a, []).get(a)!).push(b); (adj.get(b) ?? adj.set(b, []).get(b)!).push(a); };
  const seeds = new Set<string>(['GND']);
  for (const e of elems) {
    if (e.k === 'S') seeds.add(e.a);
    else if (e.k === 'R' && e.ohms < 1e7) link(e.a, e.b);
    else if (e.k === 'D' && diodeOn.get(e)) link(e.a, e.c);
  }
  void net;
  const seen = new Set<string>(seeds); const q = [...seeds];
  while (q.length) { const x = q.pop()!; for (const y of adj.get(x) ?? []) if (!seen.has(y)) { seen.add(y); q.push(y); } }
  return seen;
}

function allRefs(c: Circuit): Ref[] { return [...c.parts.flatMap((p) => Object.values(p.pins)), ...c.wires.flatMap((w) => [w.a, w.b])]; }

/** Dense Gaussian elimination with partial pivoting; fill G (n×n) and I (n) through `stamp`. */
function linearSolve(n: number, stamp: (G: number[][], I: number[]) => void): number[] {
  const G = Array.from({ length: n }, () => new Array(n).fill(0)); const I = new Array(n).fill(0);
  stamp(G, I);
  for (let col = 0; col < n; col++) {
    let piv = col; for (let r = col + 1; r < n; r++) if (Math.abs(G[r][col]) > Math.abs(G[piv][col])) piv = r;
    if (Math.abs(G[piv][col]) < 1e-15) continue;
    [G[col], G[piv]] = [G[piv], G[col]]; [I[col], I[piv]] = [I[piv], I[col]];
    for (let r = col + 1; r < n; r++) {
      const f = G[r][col] / G[col][col]; if (!f) continue;
      for (let k = col; k < n; k++) G[r][k] -= f * G[col][k];
      I[r] -= f * I[col];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = I[r]; for (let k = r + 1; k < n; k++) s -= G[r][k] * x[k];
    x[r] = Math.abs(G[r][r]) < 1e-15 ? 0 : s / G[r][r];
  }
  return x;
}
