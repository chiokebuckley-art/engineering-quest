/**
 * The virtual UNO running a sketch. Each sketch is real Arduino C++ (shown to the learner, with editable
 * blanks) plus a behaviour model that runs every tick against the circuit solver. Timing uses millis(), so
 * a `delay()` in the C++ becomes a phase of time here; the Serial Monitor shows what `Serial.println` prints.
 */
import { solve, defaultEnv, PWM_PINS, type Circuit, type Env, type PinDrive, type SimResult, type Part } from './circuit';

export type SlotValue = number | string;
export type Slots = Record<string, SlotValue>;
export interface Slot {
  key: string;
  label: string;
  kind: 'pin' | 'number' | 'choice';
  options?: SlotValue[];     // for pins and choices
  min?: number; max?: number; step?: number;
  default: SlotValue;
  hint?: string;
}

export interface Io {
  millis: number;
  pinMode(pin: string, mode: 'OUTPUT' | 'INPUT' | 'INPUT_PULLUP'): void;
  digitalWrite(pin: string, high: boolean | 0 | 1): void;
  analogWrite(pin: string, duty: number): void;
  tone(pin: string, freq: number): void;
  noTone(pin: string): void;
  digitalRead(pin: string): 0 | 1;
  analogRead(pin: string): number;
  servo(pin: string, angle: number): void;
  pulseIn(trig: string, echo: string): number;
  readDHT(pin: string): { t: number; h: number } | null;
  println(text: string): void;
}
export type Mem = Record<string, number | string | boolean | null>;

export interface SketchDef {
  id: string;
  title: string;
  summary: string;
  /** Libraries the real sketch needs (shown as a note). */
  libraries?: string[];
  slots: Slot[];
  /** Arduino C++; `{{key}}` marks an editable blank. A function picks the code's structure from the choices. */
  source: string | ((s: Slots) => string);
  setup(io: Io, s: Slots, mem: Mem): void;
  loop(io: Io, s: Slots, mem: Mem): void;
}

/** C++ spelling of a slot value: pins 'D13' → 13, 'A0' stays A0. */
export const cpp = (v: SlotValue) => (typeof v === 'string' && /^D\d+$/.test(v) ? v.slice(1) : String(v));
export function sourceTemplate(sk: SketchDef, s: Slots): string {
  return typeof sk.source === 'function' ? sk.source({ ...defaultSlots(sk), ...s }) : sk.source;
}
export function renderSource(sk: SketchDef, s: Slots): string {
  return sourceTemplate(sk, s).replace(/\{\{(\w+)\}\}/g, (_, k) => cpp(s[k] ?? sk.slots.find((x) => x.key === k)?.default ?? '?'));
}
export const defaultSlots = (sk: SketchDef): Slots => Object.fromEntries(sk.slots.map((x) => [x.key, x.default]));

export interface ServoState { angle: number; target: number }
export interface TickEvents { blown: string[]; serial: string[] }

/**
 * A bench: a circuit, the environment, the USB cable and the sketch on the board. Call `tick(ms)` to advance
 * time; it returns the solved state. The circuit object is owned by the caller; burned-out LEDs are reported
 * in the events so the caller can mark them.
 */
export class Bench {
  circuit: Circuit;
  env: Env;
  usb = false;
  sketch: SketchDef | null = null;
  slots: Slots = {};
  t = 0;
  tickNo = 0;
  drives: Record<string, PinDrive> = {};
  mem: Mem = {};
  serial: string[] = [];
  servo: Record<string, ServoState> = {};
  last: SimResult;
  private overSince: Record<string, number> = {};
  private started = false;

  constructor(circuit: Circuit, env: Env = defaultEnv(), sketch: SketchDef | null = null, slots?: Slots) {
    this.circuit = circuit; this.env = env; this.sketch = sketch; this.slots = slots ?? (sketch ? defaultSlots(sketch) : {});
    this.last = solve(circuit, {}, env, false);
  }
  /** Load a sketch and restart the board (like pressing RESET after an upload). */
  upload(sketch: SketchDef | null, slots?: Slots) {
    this.sketch = sketch; this.slots = slots ?? (sketch ? defaultSlots(sketch) : {});
    this.reset();
  }
  reset() { this.t = 0; this.drives = {}; this.mem = {}; this.started = false; this.serial = []; }
  plug(on: boolean) { if (on !== this.usb) { this.usb = on; this.reset(); } }

  private io(events: TickEvents): Io {
    const last = this.last; const net = last.net;
    const self = this;
    const rnd = () => ((((this.tickNo + 7) * 2654435761) >>> 0) >> 13) & 1;
    return {
      millis: this.t,
      pinMode(pin, mode) { self.drives[pin] = mode === 'OUTPUT' ? { mode: 'out', high: false } : mode === 'INPUT_PULLUP' ? { mode: 'pullup' } : { mode: 'in' }; },
      digitalWrite(pin, high) { const d = self.drives[pin]; if (!d || d.mode === 'out' || d.mode === 'pwm' || d.mode === 'tone') self.drives[pin] = { mode: 'out', high: !!high }; else if (d.mode === 'in' && high) self.drives[pin] = { mode: 'pullup' }; },
      analogWrite(pin, duty) { const x = Math.max(0, Math.min(255, Math.round(duty))); self.drives[pin] = !PWM_PINS.has(pin) ? { mode: 'out', high: x >= 128 } : x === 0 ? { mode: 'out', high: false } : x === 255 ? { mode: 'out', high: true } : { mode: 'pwm', duty: x }; },
      tone(pin, freq) { self.drives[pin] = { mode: 'tone', freq }; },
      noTone(pin) { self.drives[pin] = { mode: 'out', high: false }; },
      digitalRead(pin) { const p = last.pins[pin]; if (!p || p.reading === undefined) return 0; return p.reading === 'float' ? (rnd() as 0 | 1) : p.reading; },
      analogRead(pin) { const p = last.pins[pin]; if (!p) return 0; return p.analog ?? 300 + ((self.tickNo * 97) % 400); },  // a floating analog pin drifts
      servo(pin, angle) {
        for (const part of self.circuit.parts) if (part.kind === 'servo' && net(part.pins.sig) === net(`u:${pin}`)) {
          const s = self.servo[part.id] ?? { angle: 90, target: 90 }; s.target = Math.max(0, Math.min(180, angle)); self.servo[part.id] = s;
        }
      },
      pulseIn(trig, echo) {
        const us = self.circuit.parts.find((p) => p.kind === 'ultrasonic' && moduleOk(p, last) && net(p.pins.trig) === net(`u:${trig}`) && net(p.pins.echo) === net(`u:${echo}`));
        if (!us) return 0;
        const d = self.env.distanceCm;
        return d < 2 || d > 400 ? 0 : Math.round((d * 2) / 0.0343);
      },
      readDHT(pin) {
        const m = self.circuit.parts.find((p) => p.kind === 'dht11' && moduleOk(p, last) && net(p.pins.data) === net(`u:${pin}`));
        return m ? { t: Math.round(self.env.tempC), h: Math.round(self.env.humidity) } : null;
      },
      println(text) { events.serial.push(text); },
    };
  }

  tick(ms: number): { result: SimResult; events: TickEvents } {
    const events: TickEvents = { blown: [], serial: [] };
    this.tickNo++;
    if (!this.usb) { this.last = solve(this.circuit, {}, this.env, false); return { result: this.last, events }; }
    // The board runs only while it has power (a short trips the fuse and it resets).
    if (this.last.powered !== false && this.sketch) {
      const io = this.io(events);
      if (!this.started) { this.started = true; this.sketch.setup(io, this.slots, this.mem); }
      this.sketch.loop(io, this.slots, this.mem);
    }
    this.last = solve(this.circuit, this.drives, this.env, true);
    if (!this.last.powered) { this.reset(); this.started = true; }
    // Servos move toward their target at about 60° per 0.1 s (slower and shaky without a full 5 V).
    for (const part of this.circuit.parts) if (part.kind === 'servo') {
      const s = this.servo[part.id] ?? { angle: 90, target: 90 }; this.servo[part.id] = s;
      if (!moduleOk(part, this.last)) continue;
      const rate = (600 * ms) / 1000; const d = s.target - s.angle;
      s.angle += Math.abs(d) <= rate ? d : Math.sign(d) * rate;
    }
    // An LED over its limit for more than a moment burns out, like the real one.
    for (const part of this.circuit.parts) if (part.kind === 'led' && !part.blown) {
      if (this.last.parts[part.id]?.over) { this.overSince[part.id] ??= this.t; if (this.t - this.overSince[part.id] >= 300) events.blown.push(part.id); }
      else delete this.overSince[part.id];
    }
    this.serial.push(...events.serial);
    if (this.serial.length > 200) this.serial = this.serial.slice(-200);
    this.t += ms;
    return { result: this.last, events };
  }
}

/** A module works when it has about 5 V between VCC and GND. */
export function moduleOk(p: Part, r: SimResult): boolean {
  if (!r.powered) return false;
  const v = (ref: string) => r.v[r.net(ref)] ?? 0;
  return v(p.pins.vcc) - v(p.pins.gnd) > 4.3;
}

/** Run a bench for `ms` of simulated time in `step` increments, returning every result (for checks and tests). */
export function runFor(bench: Bench, ms: number, step = 50, each?: (r: SimResult, t: number) => void): SimResult {
  let r = bench.last;
  for (let t = 0; t < ms; t += step) { const out = bench.tick(step); r = out.result; for (const id of out.events.blown) { const p = bench.circuit.parts.find((x) => x.id === id); if (p) p.blown = true; } each?.(r, bench.t); }
  return r;
}
