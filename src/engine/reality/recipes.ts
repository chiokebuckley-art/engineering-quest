/**
 * Reviewed wiring cards: one reference build per mission. Each has ordered build steps (the same order a
 * real build would use), the sketch it runs, a behaviour check (any correct circuit passes, not only this
 * exact layout), and faults for the debug stages. All builds are USB-powered, 5 V, low current.
 */
import { emptyCircuit, type Circuit, type Part, type PartKind, type Ref, type WireColor, type LedColor, type Env, defaultEnv, type SimResult } from './circuit';
import { Bench, runFor, defaultSlots, type Slots, type SketchDef } from './runtime';
import { SKETCHES } from './sketches';

export type BuildStep =
  | { text: string; wire: [Ref, Ref]; color: WireColor }
  | { text: string; part: { id: string; kind: PartKind; pins: Record<string, Ref>; ohms?: number; color?: LedColor } };

export interface CheckResult { ok: boolean; message: string; observed?: string }
export interface Fault {
  id: string;
  /** What is actually wrong (the right diagnosis). */
  cause: string;
  /** What the learner sees when it runs. */
  symptom: string;
  /** Wrong diagnoses that fit the symptom at first glance. */
  decoys: string[];
  /** How to fix it (shown after the diagnosis). */
  fix: string;
  tag: string;
  apply(c: Circuit, s: Slots): { circuit: Circuit; slots: Slots };
}
export interface Recipe {
  id: string;
  title: string;
  /** Kit component ids needed (for the parts tray and "check your kit"). */
  parts: string[];
  /** Tray items for the mat, e.g. resistor values and LED colours on offer. */
  tray: TrayItem[];
  steps: BuildStep[];
  sketch?: string;
  slots?: Partial<Slots>;
  /** Sentence for the build card's power note. */
  power: string;
  check(c: Circuit, s: Slots): CheckResult;
  faults: Fault[];
}
export interface TrayItem { kind: PartKind; ohms?: number; color?: LedColor; count: number; label: string }

const W = (text: string, a: Ref, b: Ref, color: WireColor): BuildStep => ({ text, wire: [a, b], color });
const P = (text: string, id: string, kind: PartKind, pins: Record<string, Ref>, extra: { ohms?: number; color?: LedColor } = {}): BuildStep => ({ text, part: { id, kind, pins, ...extra } });

/** The finished reference circuit for a recipe. */
export function recipeCircuit(r: Recipe, upTo = r.steps.length): Circuit {
  const c = emptyCircuit();
  r.steps.slice(0, upTo).forEach((s, i) => {
    if ('wire' in s) c.wires.push({ id: `w${i}`, a: s.wire[0], b: s.wire[1], color: s.color });
    else c.parts.push({ ...s.part, pins: { ...s.part.pins } });
  });
  return c;
}
export const recipeSlots = (r: Recipe): Slots => (r.sketch ? { ...defaultSlots(SKETCHES[r.sketch]), ...(r.slots as Slots) } : {});
const clone = (c: Circuit): Circuit => ({ parts: c.parts.map((p) => ({ ...p, pins: { ...p.pins } })), wires: c.wires.map((w) => ({ ...w })) });

/* ---------------- probing helpers ---------------- */

/** Run the circuit (with a sketch or none) in an environment and return the steady result plus serial output. */
export function probe(c: Circuit, sketch: SketchDef | null, slots: Slots, env: Partial<Env> = {}, ms = 1200): { r: SimResult; serial: string[]; bench: Bench; samples: SimResult[] } {
  const bench = new Bench(clone(c), { ...defaultEnv(), ...env }, sketch, slots);
  bench.plug(true);
  const samples: SimResult[] = [];
  const r = runFor(bench, ms, 50, (x) => samples.push(x));
  return { r, serial: bench.serial, bench, samples };
}
const leds = (c: Circuit) => c.parts.filter((p) => p.kind === 'led');
const brightest = (c: Circuit, r: SimResult) => Math.max(0, ...leds(c).map((p) => r.parts[p.id]?.brightness ?? 0));
const litFraction = (c: Circuit, samples: SimResult[]) => samples.filter((r) => brightest(c, r) > 0.2).length / Math.max(1, samples.length);
function problems(r: SimResult): string | null {
  const bad = r.warnings.find((w) => w.kind !== 'floating-input');
  return !r.powered ? r.warnings[0]?.text ?? 'The board has no power.' : bad ? bad.text : null;
}
const fail = (message: string, observed?: string): CheckResult => ({ ok: false, message, observed });
const pass = (message: string, observed?: string): CheckResult => ({ ok: true, message, observed });
const moveWire = (c: Circuit, from: Ref, to: Ref) => { const w = c.wires.find((x) => x.a === from || x.b === from); if (w) { if (w.a === from) w.a = to; else w.b = to; } };
const partOf = (c: Circuit, id: string) => c.parts.find((p) => p.id === id) as Part;

/* ---------------- the ten builds ---------------- */

const RAILS = [W('Power first: a red wire from the UNO’s 5V pin to the top + rail.', 'u:5V', 'tp1', 'red'), W('A black wire from a UNO GND pin to the top − rail.', 'u:GND1', 'tn2', 'black')];
const LED_BRANCH = (feed: BuildStep): BuildStep[] => [
  feed,
  P('Resistor, 220 Ω (red-red-brown): one lead in c8, the other in c12.', 'r1', 'resistor', { a: 'h8c', b: 'h12c' }, { ohms: 220 }),
  P('Red LED: long leg (+) in e12, short leg (−) in e13.', 'led1', 'led', { anode: 'h12e', cathode: 'h13e' }, { color: 'red' }),
  W('A black wire from a13 to the − rail: the path back to ground.', 'h13a', 'tn13', 'black'),
];
const STD_TRAY: TrayItem[] = [
  { kind: 'resistor', ohms: 220, count: 3, label: '220 Ω resistor' }, { kind: 'resistor', ohms: 10_000, count: 2, label: '10 kΩ resistor' },
  { kind: 'resistor', ohms: 1_000, count: 2, label: '1 kΩ resistor' }, { kind: 'resistor', ohms: 10, count: 1, label: '10 Ω resistor' },
  { kind: 'led', color: 'red', count: 3, label: 'Red LED' }, { kind: 'led', color: 'green', count: 2, label: 'Green LED' },
];

/** Everything the virtual kit can put on the free bench. */
export const FULL_TRAY: TrayItem[] = [
  ...STD_TRAY, { kind: 'led', color: 'yellow', count: 2, label: 'Yellow LED' }, { kind: 'led', color: 'blue', count: 2, label: 'Blue LED' },
  { kind: 'button', count: 2, label: 'Button' }, { kind: 'pot', count: 1, label: '10k potentiometer' }, { kind: 'ldr', count: 2, label: 'Photoresistor' },
  { kind: 'ntc', count: 1, label: 'Thermistor' }, { kind: 'buzzer', count: 1, label: 'Active buzzer' }, { kind: 'pbuzzer', count: 1, label: 'Passive buzzer' },
  { kind: 'ultrasonic', count: 1, label: 'Ultrasonic sensor' }, { kind: 'dht11', count: 1, label: 'DHT11 module' }, { kind: 'servo', count: 1, label: 'Servo' },
];

/** LED lit safely from the 5 V rail. */
function ledSafe(c: Circuit): CheckResult {
  const { r } = probe(c, null, {}, {}, 300);
  const pr = problems(r); if (pr) return fail(pr);
  const led = leds(c).map((p) => ({ p, s: r.parts[p.id] })).sort((a, b) => b.s.i - a.s.i)[0];
  if (!led || led.s.i < 1) return fail('The LED is dark: current is not flowing all the way round. Follow the path: + rail → resistor → LED long leg → LED short leg → − rail.');
  if (led.s.i < 5) return fail(`The LED glows only faintly (${led.s.i.toFixed(1)} mA). The resistor is too big for a clear light: try 220 Ω.`, `${led.s.i.toFixed(1)} mA`);
  if (led.s.i > 25) return fail(`${Math.round(led.s.i)} mA is too much for the LED.`);
  return pass(`Your LED is lit: about ${led.s.i.toFixed(0)} mA flows round the loop. The resistor keeps it safe.`, `${led.s.i.toFixed(1)} mA`);
}

export const RECIPES: Record<string, Recipe> = {};
function add(r: Recipe) { RECIPES[r.id] = r; return r; }

add({
  id: 'path', title: 'Close the loop', parts: ['uno', 'breadboard', 'jumpers', 'resistor', 'led', 'usb-cable'], tray: STD_TRAY,
  steps: [...RAILS, ...LED_BRANCH(W('A red wire from the + rail into column 8 (hole a8).', 'tp8', 'h8a', 'red'))],
  power: 'USB power only: the UNO gives the rails 5 V.',
  check: (c) => ledSafe(c),
  faults: [
    { id: 'gap', tag: 'open-circuit', cause: 'The return wire to the − rail is missing, so the loop is open.', symptom: 'The LED stays dark and no current flows.',
      decoys: ['The LED is burned out.', 'The resistor is too small.', 'The UNO needs code first.'], fix: 'Add a wire from the LED’s short-leg column back to the − rail.',
      apply: (c, s) => { const x = clone(c); x.wires = x.wires.filter((w) => !(w.a === 'h13a' && w.b === 'tn13')); return { circuit: x, slots: s }; } },
    { id: 'gapjump', tag: 'breadboard-gap', cause: 'The LED’s legs are across the middle gap from the resistor, so they are not in the same strip.', symptom: 'The LED stays dark.',
      decoys: ['The rails are not powered.', 'The LED needs a bigger resistor.', 'The wire colours are wrong.'], fix: 'Put the LED’s long leg in the same column half (a–e) as the resistor’s lead.',
      apply: (c, s) => { const x = clone(c); partOf(x, 'led1').pins = { anode: 'h12f', cathode: 'h13f' }; return { circuit: x, slots: s }; } },
  ],
});

add({
  id: 'led', title: 'A safe LED', parts: ['uno', 'breadboard', 'jumpers', 'resistor', 'led', 'usb-cable'], tray: STD_TRAY,
  steps: [...RAILS, ...LED_BRANCH(W('A red wire from the + rail into hole a8.', 'tp8', 'h8a', 'red'))],
  power: 'USB power only. Unplug before you change anything.',
  check: (c) => ledSafe(c),
  faults: [
    { id: 'reversed', tag: 'led-polarity', cause: 'The LED is in backwards: the long leg is on the ground side.', symptom: 'The LED stays dark, but nothing is hot and the board is fine.',
      decoys: ['The resistor blocks all current.', 'The USB cable is broken.', 'The LED needs code to turn on.'], fix: 'Turn the LED round: long leg (+) toward the resistor, short leg (−) toward ground.',
      apply: (c, s) => { const x = clone(c); partOf(x, 'led1').pins = { anode: 'h13e', cathode: 'h12e' }; return { circuit: x, slots: s }; } },
    { id: 'bypass', tag: 'current-limit', cause: 'A wire jumps past the resistor, so nothing limits the current.', symptom: 'The LED flashes very bright, then goes dark for good.',
      decoys: ['The LED is the wrong colour.', 'The − rail is not connected.', 'Too little voltage reaches the LED.'], fix: 'Remove the jumper around the resistor and use a new LED; the resistor must be in the path.',
      apply: (c, s) => { const x = clone(c); x.wires.push({ id: 'bypass', a: 'h8d', b: 'h12d', color: 'yellow' }); return { circuit: x, slots: s }; } },
    { id: 'bigR', tag: 'current-limit', cause: 'The resistor is 10 kΩ instead of 220 Ω, so only a tiny current flows.', symptom: 'The LED is so dim you can hardly see it.',
      decoys: ['The LED is backwards.', 'The rails are swapped.', 'The loop is open.'], fix: 'Swap in the 220 Ω resistor (red-red-brown).',
      apply: (c, s) => { const x = clone(c); partOf(x, 'r1').ohms = 10_000; return { circuit: x, slots: s }; } },
  ],
});

add({
  id: 'blink', title: 'Blink from pin 13', parts: ['uno', 'breadboard', 'jumpers', 'resistor', 'led', 'usb-cable'], tray: STD_TRAY,
  steps: [W('A black wire from a UNO GND pin to the top − rail.', 'u:GND1', 'tn2', 'black'), ...LED_BRANCH(W('A yellow wire from UNO pin 13 into hole a8.', 'u:D13', 'h8a', 'yellow'))],
  sketch: 'blink', power: 'USB power; the code decides when pin 13 gives 5 V.',
  check: (c, s) => {
    const { samples, r } = probe(c, SKETCHES.blink, s, {}, 2400);
    const pr = problems(r); if (pr) return fail(pr);
    const f = litFraction(c, samples);
    if (f < 0.1) return fail('The LED never lights. Is the wire on the same pin the code uses?');
    if (f > 0.9) return fail('The LED is always on: it is not blinking.');
    return pass('It blinks: the code switches pin 13 between 5 V and 0 V.');
  },
  faults: [
    { id: 'wrongpin', tag: 'pin-mismatch', cause: 'The wire is on pin 12 but the code blinks pin 13.', symptom: 'The UNO’s own L LED blinks, but your LED stays dark.',
      decoys: ['The LED is burned out.', 'The code did not upload.', 'The resistor is too big.'], fix: 'Move the wire to pin 13, or change the code to pin 12.',
      apply: (c, s) => { const x = clone(c); moveWire(x, 'u:D13', 'u:D12'); return { circuit: x, slots: s }; } },
  ],
});

add({
  id: 'button', title: 'Button lamp', parts: ['uno', 'breadboard', 'jumpers', 'resistor', 'led', 'button', 'usb-cable'],
  tray: [...STD_TRAY, { kind: 'button', count: 2, label: 'Button' }],
  steps: [
    W('A black wire from a UNO GND pin to the top − rail.', 'u:GND1', 'tn2', 'black'),
    ...LED_BRANCH(W('A yellow wire from UNO pin 13 into hole a8.', 'u:D13', 'h8a', 'yellow')),
    P('Button across the middle gap: legs in e20, e22, f20, f22.', 'btn1', 'button', { a1: 'h20e', a2: 'h20f', b1: 'h22e', b2: 'h22f' }),
    W('A green wire from UNO pin 2 to a20 (one side of the button).', 'u:D2', 'h20a', 'green'),
    W('A black wire from a22 (the other side) to the − rail.', 'h22a', 'tn22', 'black'),
  ],
  sketch: 'button-led', power: 'USB power; INPUT_PULLUP holds pin 2 HIGH until the button joins it to ground.',
  check: (c, s) => {
    const up = probe(c, SKETCHES['button-led'], s, { pressed: {} }, 900); const pr = problems(up.r); if (pr) return fail(pr);
    const btn = c.parts.find((p) => p.kind === 'button'); if (!btn) return fail('Place a button first.');
    const down = probe(c, SKETCHES['button-led'], s, { pressed: { [btn.id]: true } }, 900);
    const offWhenUp = litFraction(c, up.samples) < 0.1; const onWhenDown = litFraction(c, down.samples) > 0.9;
    if (!onWhenDown && !offWhenUp) return fail('The LED does not follow the button at all.');
    if (!offWhenUp) return fail(litFraction(c, up.samples) > 0.9 ? 'The LED is on even when nobody presses: the button is joining the pin to ground all the time.' : 'The LED flickers by itself: the input is floating.');
    if (!onWhenDown) return fail('Pressing does not light the LED.');
    return pass('Pressed: LED on. Released: LED off. Your input is steady.');
  },
  faults: [
    { id: 'floating', tag: 'floating-input', cause: 'The pin is set to INPUT with no pull-up or pull-down resistor, so when the button is open the pin floats.', symptom: 'The LED flickers on and off by itself, even when nobody touches the button.',
      decoys: ['The button is broken.', 'The LED is loose.', 'The code is too slow.'], fix: 'Use INPUT_PULLUP (or add a 10 kΩ pull-down) so the pin always has a definite level.',
      apply: (c, s) => ({ circuit: clone(c), slots: { ...s, mode: 'INPUT' } }) },
    { id: 'rotated', tag: 'button-orientation', cause: 'The button is turned 90°, so its always-joined legs connect pin 2 to ground all the time.', symptom: 'The LED is always on, pressed or not.',
      decoys: ['The code says HIGH instead of LOW.', 'The LED is backwards.', 'Pin 2 is broken.'], fix: 'Turn the button so it straddles the middle gap the other way.',
      apply: (c, s) => { const x = clone(c); partOf(x, 'btn1').rotated = true; return { circuit: x, slots: s }; } },
    { id: 'pin3', tag: 'pin-mismatch', cause: 'The button wire is on pin 3 but the code reads pin 2.', symptom: 'Pressing does nothing: the LED stays dark.',
      decoys: ['The button needs to be pressed harder.', 'The LED needs a bigger resistor.', 'INPUT_PULLUP is the wrong mode.'], fix: 'Move the wire to pin 2, or change buttonPin to 3.',
      apply: (c, s) => { const x = clone(c); moveWire(x, 'u:D2', 'u:D3'); return { circuit: x, slots: s }; } },
  ],
});

add({
  id: 'knob', title: 'Knob dimmer', parts: ['uno', 'breadboard', 'jumpers', 'potentiometer', 'resistor', 'led', 'usb-cable'],
  tray: [...STD_TRAY, { kind: 'pot', count: 1, label: '10k potentiometer' }],
  steps: [
    ...RAILS,
    ...LED_BRANCH(W('A yellow wire from UNO pin 9 (a ~ PWM pin) into hole a8.', 'u:D9', 'h8a', 'yellow')),
    P('Potentiometer: its three legs in c20, c21, c22.', 'pot1', 'pot', { end1: 'h20c', wiper: 'h21c', end2: 'h22c' }),
    W('A black wire from a20 (left leg) to the − rail.', 'h20a', 'tn20', 'black'),
    W('A red wire from a22 (right leg) to the + rail.', 'h22a', 'tp22', 'red'),
    W('A green wire from a21 (the middle wiper) to UNO A0.', 'h21a', 'u:A0', 'green'),
  ],
  sketch: 'knob', power: 'USB power; the knob divides 5 V, A0 measures it.',
  check: (c, s) => {
    const pot = c.parts.find((p) => p.kind === 'pot'); if (!pot) return fail('Place the potentiometer.');
    const lo = probe(c, SKETCHES.knob, s, { knob: { [pot.id]: 0.05 } }, 400); const hi = probe(c, SKETCHES.knob, s, { knob: { [pot.id]: 0.95 } }, 400);
    const pr = problems(hi.r); if (pr) return fail(pr);
    const a = (x: typeof lo) => x.r.pins[String(s.ain)]?.analog ?? -1;
    if (a(lo) < 0 || Math.abs(a(hi) - a(lo)) < 500) return fail('Turning the knob barely changes the A0 reading. Is the middle leg (wiper) wired to A0, and the outer legs to 5 V and GND?');
    const bLo = brightest(c, lo.r); const bHi = brightest(c, hi.r);
    if (Math.abs(bHi - bLo) < 0.3) return fail('The reading changes, but the LED brightness does not follow. Is the LED on a PWM (~) pin?');
    // Turning the knob one way should change the brightness one way, smoothly (no wrapping round).
    const steps = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((k) => brightest(c, probe(c, SKETCHES.knob, s, { knob: { [pot.id]: k } }, 250).r));
    const dir = Math.sign(bHi - bLo);
    if (steps.some((b, i) => i > 0 && (b - steps[i - 1]) * dir < -0.05)) return fail('As you turn the knob, the LED gets brighter, then suddenly dark, then brighter again. analogWrite only takes 0–255: check how the reading is scaled.');
    return pass(`The knob reads ${a(lo)} at one end and ${a(hi)} at the other, and the LED follows.`);
  },
  faults: [
    { id: 'wiper', tag: 'divider-wiring', cause: 'A0 is wired to an outer leg, not the middle wiper, so it always reads one end of the track.', symptom: 'The Serial Monitor shows the same number whatever you do; the LED never changes.',
      decoys: ['The potentiometer is broken.', 'analogRead only works on A5.', 'The LED needs a smaller resistor.'], fix: 'Move the A0 wire to the middle leg.',
      apply: (c, s) => { const x = clone(c); moveWire(x, 'h21a', 'h20b'); return { circuit: x, slots: s }; } },
    { id: 'div1', tag: 'value-range', cause: 'The code divides by 1, but analogWrite only takes 0–255, so values above 255 wrap round.', symptom: 'Turning the knob up makes the LED brighten, go dark, brighten again … four times.',
      decoys: ['The knob is noisy.', 'The LED is overheating.', 'Pin 9 cannot do PWM.'], fix: 'Divide by 4: 1023 (top reading) ÷ 4 ≈ 255 (top brightness).',
      apply: (c, s) => ({ circuit: clone(c), slots: { ...s, div: 1 } }) },
  ],
});

add({
  id: 'light', title: 'Dusk light', parts: ['uno', 'breadboard', 'jumpers', 'photoresistor', 'resistor', 'led', 'usb-cable'],
  tray: [...STD_TRAY, { kind: 'ldr', count: 2, label: 'Photoresistor' }],
  steps: [
    ...RAILS,
    ...LED_BRANCH(W('A yellow wire from UNO pin 13 into hole a8.', 'u:D13', 'h8a', 'yellow')),
    P('Photoresistor: one lead in c18, the other in c20.', 'ldr1', 'ldr', { a: 'h18c', b: 'h20c' }),
    W('A red wire from a18 to the + rail.', 'h18a', 'tp18', 'red'),
    P('Resistor, 10 kΩ (brown-black-orange): e20 to e24.', 'r2', 'resistor', { a: 'h20e', b: 'h24e' }, { ohms: 10_000 }),
    W('A black wire from a24 to the − rail.', 'h24a', 'tn24', 'black'),
    W('A green wire from a20 (the middle of the divider) to UNO A0.', 'h20a', 'u:A0', 'green'),
  ],
  sketch: 'light', power: 'USB power; the photoresistor and 10 kΩ share the 5 V.',
  check: (c, s) => {
    const dark = probe(c, SKETCHES.light, s, { light: 5 }, 600); const bright = probe(c, SKETCHES.light, s, { light: 90 }, 600);
    const pr = problems(bright.r); if (pr) return fail(pr);
    const onDark = brightest(c, dark.r) > 0.2; const onBright = brightest(c, bright.r) > 0.2;
    if (onDark && !onBright) return pass('Dark: LED on. Bright: LED off. A dusk light!');
    if (!onDark && onBright) return fail('It works backwards: the LED is on in the light and off in the dark.');
    return fail(onDark ? 'The LED stays on whatever the light.' : 'The LED stays off whatever the light.');
  },
  faults: [
    { id: 'swap', tag: 'divider-order', cause: 'The photoresistor and the 10 kΩ resistor have swapped places, so the reading goes down in bright light.', symptom: 'The LED comes on in bright light and goes off in the dark.',
      decoys: ['The threshold is too low.', 'The LED is backwards.', 'The sensor needs more light.'], fix: 'Swap them back (photoresistor to 5 V), or flip the comparison to >.',
      apply: (c, s) => { const x = clone(c); moveWire(x, 'tp18', 'tn18'); moveWire(x, 'tn24', 'tp24'); return { circuit: x, slots: s }; } },
    { id: 'nodivider', tag: 'voltage-divider', cause: 'The 10 kΩ resistor to ground is missing, so A0 is pulled up to 5 V and always reads near 1023.', symptom: 'The Serial Monitor shows about 1020 in any light; the LED never comes on.',
      decoys: ['The photoresistor is broken.', 'The room is too bright.', 'The threshold should be 1023.'], fix: 'Put the 10 kΩ resistor back between the A0 point and ground.',
      apply: (c, s) => { const x = clone(c); x.parts = x.parts.filter((p) => p.id !== 'r2'); return { circuit: x, slots: s }; } },
  ],
});

add({
  id: 'temp', title: 'Temperature reporter', parts: ['uno', 'breadboard', 'jumpers', 'dht11', 'thermistor', 'resistor', 'fm-wires', 'usb-cable'],
  tray: [...STD_TRAY, { kind: 'dht11', count: 1, label: 'DHT11 module' }, { kind: 'ntc', count: 1, label: 'Thermistor' }],
  steps: [
    ...RAILS,
    P('DHT11 module: its S, +, − pins in c16, c17, c18.', 'dht1', 'dht11', { data: 'h16c', vcc: 'h17c', gnd: 'h18c' }),
    W('A green wire from a16 (S, data) to UNO pin 2.', 'h16a', 'u:D2', 'green'),
    W('A red wire from a17 (+) to the + rail.', 'h17a', 'tp17', 'red'),
    W('A black wire from a18 (−) to the − rail.', 'h18a', 'tn18', 'black'),
    P('Thermistor: leads in c24 and c26.', 'ntc1', 'ntc', { a: 'h24c', b: 'h26c' }),
    W('A red wire from a24 to the + rail.', 'h24a', 'tp24', 'red'),
    P('Resistor, 10 kΩ: e26 to e29.', 'r3', 'resistor', { a: 'h26e', b: 'h29e' }, { ohms: 10_000 }),
    W('A black wire from a29 to the − rail.', 'h29a', 'tn29', 'black'),
    W('A blue wire from a26 (the divider middle) to UNO A1.', 'h26a', 'u:A1', 'blue'),
  ],
  sketch: 'temperature', power: 'USB power; both sensors run from 5 V.',
  check: (c, s) => {
    const cold = probe(c, SKETCHES.temperature, s, { tempC: 12 }, 4500); const warm = probe(c, SKETCHES.temperature, s, { tempC: 32 }, 4500);
    const pr = problems(warm.r); if (pr) return fail(pr);
    const tLine = (x: typeof cold) => x.serial.filter((l) => l.startsWith('Temp') || l.startsWith('Failed')).pop() ?? '';
    if (!/Temp: 32 C/.test(tLine(warm))) return fail(tLine(warm).startsWith('Failed') ? 'The Serial Monitor says “Failed to read from DHT sensor!”. Check the data wire and the pin number in the code.' : 'No temperature is printed yet.');
    const th = (x: typeof cold) => Number((x.serial.filter((l) => l.startsWith('Thermistor')).pop() ?? '').split(': ')[1]);
    if (!(th(warm) > th(cold) + 50)) return fail('The DHT11 works, but the thermistor reading does not change with temperature. Check its divider and the A1 wire.');
    return pass(`The DHT11 reports 12 °C then 32 °C, and the thermistor reading rises from ${th(cold)} to ${th(warm)}.`);
  },
  faults: [
    { id: 'datapin', tag: 'pin-mismatch', cause: 'The DHT11 data wire is on pin 3, but the code asks pin 2.', symptom: 'Every two seconds: “Failed to read from DHT sensor!”',
      decoys: ['The room is too hot.', 'The DHT11 needs 9 V.', 'The thermistor is interfering.'], fix: 'Move the data wire to pin 2 (or change DHT dht(3, DHT11)).',
      apply: (c, s) => { const x = clone(c); moveWire(x, 'u:D2', 'u:D3'); return { circuit: x, slots: s }; } },
    { id: 'nognd', tag: 'module-power', cause: 'The DHT11’s − pin is not connected to ground, so the module has no power.', symptom: '“Failed to read from DHT sensor!” while the thermistor still reports.',
      decoys: ['The data wire is on the wrong pin.', 'The code reads too often.', 'The humidity is too high.'], fix: 'Wire the module’s − pin to the − rail.',
      apply: (c, s) => { const x = clone(c); x.wires = x.wires.filter((w) => !(w.a === 'h18a' && w.b === 'tn18')); return { circuit: x, slots: s }; } },
  ],
});

add({
  id: 'buzz', title: 'Alarm buzzer', parts: ['uno', 'breadboard', 'jumpers', 'active-buzzer', 'passive-buzzer', 'usb-cable'],
  tray: [{ kind: 'buzzer', count: 1, label: 'Active buzzer (sealed)' }, { kind: 'pbuzzer', count: 1, label: 'Passive buzzer (open back)' }],
  steps: [
    W('A black wire from a UNO GND pin to the top − rail.', 'u:GND1', 'tn2', 'black'),
    P('Active buzzer: its + (longer) leg in c20, − leg in c22.', 'bz1', 'buzzer', { plus: 'h20c', minus: 'h22c' }),
    W('A yellow wire from UNO pin 8 to a20.', 'u:D8', 'h20a', 'yellow'),
    W('A black wire from a22 to the − rail.', 'h22a', 'tn22', 'black'),
  ],
  sketch: 'buzzer', power: 'USB power; pin 8 switches the buzzer.',
  check: (c, s) => {
    const { samples, r } = probe(c, SKETCHES.buzzer, s, {}, 2000);
    const pr = problems(r); if (pr) return fail(pr);
    const sounding = samples.filter((x) => Object.values(x.parts).some((p) => p.sounding)).length / samples.length;
    if (sounding < 0.05) return fail('Silence. Is it the right kind of buzzer for the way the code drives it, the right way round, on the right pin?');
    if (sounding > 0.95) return fail('It never stops. The pattern should beep and pause.');
    return pass('Beep … pause … beep: the alarm pattern works.');
  },
  faults: [
    { id: 'passive-dc', tag: 'buzzer-types', cause: 'This is the passive buzzer; plain digitalWrite gives it steady 5 V, which only makes a click.', symptom: 'A faint click each second, but no beep.',
      decoys: ['The buzzer is backwards.', 'Pin 8 is broken.', 'The delay is too short.'], fix: 'Use tone(pin, 880) for a passive buzzer, or swap in the active buzzer.',
      apply: (c, s) => { const x = clone(c); partOf(x, 'bz1').kind = 'pbuzzer'; return { circuit: x, slots: { ...s, how: 'digitalWrite' } }; } },
    { id: 'reversed', tag: 'polarity', cause: 'The active buzzer is in backwards (its + leg is on the ground side).', symptom: 'Complete silence.',
      decoys: ['It needs tone().', 'The pattern is too fast.', 'The buzzer needs a resistor.'], fix: 'Turn it round: + (longer leg, + mark) toward pin 8.',
      apply: (c, s) => { const x = clone(c); partOf(x, 'bz1').pins = { plus: 'h22c', minus: 'h20c' }; return { circuit: x, slots: s }; } },
  ],
});

add({
  id: 'servo', title: 'Servo swing', parts: ['uno', 'breadboard', 'jumpers', 'servo', 'usb-cable'],
  tray: [{ kind: 'servo', count: 1, label: 'SG90 servo' }],
  steps: [
    ...RAILS,
    P('Servo plug into three male jumper pins in c20, c21, c22: brown (GND) c20, red (5V) c21, orange (signal) c22.', 'sv1', 'servo', { gnd: 'h20c', vcc: 'h21c', sig: 'h22c' }),
    W('A black wire from a20 (brown) to the − rail.', 'h20a', 'tn20', 'black'),
    W('A red wire from a21 (red) to the + rail.', 'h21a', 'tp21', 'red'),
    W('An orange wire from a22 (signal) to UNO pin 9.', 'h22a', 'u:D9', 'orange'),
  ],
  sketch: 'servo', power: 'USB power is fine for one small servo that is not pushing anything.',
  check: (c, s) => {
    const sv = c.parts.find((p) => p.kind === 'servo'); if (!sv) return fail('Place the servo.');
    const seen = new Set<number>(); const bench = new Bench(clone(c), defaultEnv(), SKETCHES.servo, s); bench.plug(true);
    const r = runFor(bench, 2400, 50, () => seen.add(Math.round(bench.servo[sv.id]?.angle ?? 90)));
    const pr = problems(r); if (pr) return fail(pr);
    const a1 = Number(s.a1); const a2 = Number(s.a2);
    if (!seen.has(a1) || !seen.has(a2)) return fail('The servo arm does not reach both angles. Check its signal wire, its 5 V and its ground.');
    return pass(`The arm swings between ${a1}° and ${a2}°.`);
  },
  faults: [
    { id: 'powerpin', tag: 'motor-power', cause: 'The servo’s red wire is on a signal pin instead of 5 V.', symptom: 'The arm twitches or does nothing, and a warning appears about pin current.',
      decoys: ['The angles are too big.', 'The servo needs tone().', 'The ground wire is fine, so it must be the code.'], fix: 'Red goes to the 5 V rail; only the orange wire goes to a pin.',
      apply: (c, s) => { const x = clone(c); moveWire(x, 'tp21', 'u:D7'); return { circuit: x, slots: s }; } },
    { id: 'sigpin', tag: 'pin-mismatch', cause: 'The signal wire is on pin 10 but the code attaches pin 9.', symptom: 'The servo is powered but never moves.',
      decoys: ['The servo is broken.', 'It needs more current.', 'write() needs radians.'], fix: 'Move the orange wire to pin 9, or attach(10).',
      apply: (c, s) => { const x = clone(c); moveWire(x, 'u:D9', 'u:D10'); return { circuit: x, slots: s }; } },
  ],
});

add({
  id: 'echo', title: 'Echo ranger', parts: ['uno', 'breadboard', 'jumpers', 'ultrasonic', 'active-buzzer', 'usb-cable'],
  tray: [{ kind: 'ultrasonic', count: 1, label: 'Ultrasonic sensor' }, { kind: 'buzzer', count: 1, label: 'Active buzzer' }],
  steps: [
    ...RAILS,
    P('Ultrasonic sensor: VCC, Trig, Echo, GND pins in c16, c17, c18, c19.', 'us1', 'ultrasonic', { vcc: 'h16c', trig: 'h17c', echo: 'h18c', gnd: 'h19c' }),
    W('A red wire from a16 (VCC) to the + rail.', 'h16a', 'tp16', 'red'),
    W('A yellow wire from a17 (Trig) to UNO pin 12.', 'h17a', 'u:D12', 'yellow'),
    W('A green wire from a18 (Echo) to UNO pin 11.', 'h18a', 'u:D11', 'green'),
    W('A black wire from a19 (GND) to the − rail.', 'h19a', 'tn19', 'black'),
    P('Active buzzer: + leg in c25, − leg in c27.', 'bz2', 'buzzer', { plus: 'h25c', minus: 'h27c' }),
    W('A yellow wire from UNO pin 8 to a25.', 'u:D8', 'h25a', 'yellow'),
    W('A black wire from a27 to the − rail.', 'h27a', 'tn27', 'black'),
  ],
  sketch: 'echo', power: 'USB power; the sensor needs 5 V.',
  check: (c, s) => {
    const near = probe(c, SKETCHES.echo, s, { distanceCm: 15 }, 700); const far = probe(c, SKETCHES.echo, s, { distanceCm: 120 }, 700);
    const pr = problems(far.r); if (pr) return fail(pr);
    const sounding = (x: typeof near) => Object.values(x.r.parts).some((p) => p.sounding);
    const cm = (x: typeof near) => Number((x.serial.pop() ?? '').replace(/\D+/g, ' ').trim().split(' ')[0]);
    if (cm(far) === 0) return fail('The Serial Monitor shows 0 cm: no echo is being timed. Check Trig and Echo.');
    if (Math.abs(cm(far) - 120) > 3) return fail(`It reports ${cm(far)} cm for an object 120 cm away. Check the maths in the code.`);
    if (!sounding(near) || sounding(far)) return fail('The distance is right, but the alarm does not match: it should sound when something is closer than the threshold.');
    return pass(`It measures ${cm(far)} cm correctly and alarms when something comes within ${s.near} cm.`);
  },
  faults: [
    { id: 'swap', tag: 'pin-mismatch', cause: 'Trig and Echo are swapped, so the ping never goes out on the pin the code triggers.', symptom: 'The Serial Monitor shows “Distance: 0 cm” whatever you do.',
      decoys: ['The object is too far away.', 'Sound is too slow indoors.', 'The buzzer is interfering.'], fix: 'Trig to pin 12, Echo to pin 11 (or swap the numbers in the code).',
      apply: (c, s) => { const x = clone(c); moveWire(x, 'u:D12', 'u:D10'); moveWire(x, 'u:D11', 'u:D12'); moveWire(x, 'u:D10', 'u:D11'); return { circuit: x, slots: s }; } },
    { id: 'nohalf', tag: 'round-trip', cause: 'The code forgot to divide by 2: the echo time covers the trip out AND back.', symptom: 'Everything reads twice as far as it really is, so the alarm only goes off very late.',
      decoys: ['The sensor needs calibrating to the room.', 'The speed of sound is wrong.', 'The Trig pulse is too short.'], fix: 'Divide by 2.',
      apply: (c, s) => ({ circuit: clone(c), slots: { ...s, div: 1 } }) },
    { id: 'threshold', tag: 'threshold', cause: 'The alarm threshold is 200 cm, so almost anything in the room sets it off.', symptom: 'The buzzer sounds even when nobody is near.',
      decoys: ['The sensor sees its own echo.', 'The buzzer is stuck.', 'Echo is on the wrong pin.'], fix: 'Set a sensible threshold, such as 30 cm.',
      apply: (c, s) => ({ circuit: clone(c), slots: { ...s, near: 200 } }) },
  ],
});

/** Faults, looked up by `recipe:fault`. */
export function faultOf(key: string): { recipe: Recipe; fault: Fault } | null {
  const [rid, fid] = key.split(':'); const recipe = RECIPES[rid]; const fault = recipe?.faults.find((f) => f.id === fid);
  return recipe && fault ? { recipe, fault } : null;
}

/* ---------------- boss quest: an invention from the learner's choices ---------------- */

export type InventSensor = 'ultrasonic' | 'light' | 'temperature';
export type InventOutput = 'buzzer' | 'led' | 'servo';
export const INVENT_SENSORS: Record<InventSensor, { label: string; part: string; unit: string; tests: [Partial<Env>, Partial<Env>]; testLabel: (e: Partial<Env>) => string; suggest: { cmp: '<' | '>'; threshold: number } }> = {
  ultrasonic: { label: 'Ultrasonic sensor (distance)', part: 'ultrasonic', unit: 'cm', tests: [{ distanceCm: 25 }, { distanceCm: 150 }], testLabel: (e) => `someone ${e.distanceCm} cm away`, suggest: { cmp: '<', threshold: 50 } },
  light: { label: 'Photoresistor (a shadow falls)', part: 'photoresistor', unit: '0–1023', tests: [{ light: 10 }, { light: 85 }], testLabel: (e) => `light at ${e.light} %`, suggest: { cmp: '<', threshold: 400 } },
  temperature: { label: 'Thermistor (body warmth)', part: 'thermistor', unit: '0–1023', tests: [{ tempC: 34 }, { tempC: 20 }], testLabel: (e) => `${e.tempC} °C`, suggest: { cmp: '>', threshold: 600 } },
};
export const INVENT_OUTPUTS: Record<InventOutput, { label: string; part: string }> = {
  buzzer: { label: 'Active buzzer (a beep)', part: 'active-buzzer' }, led: { label: 'LED (a light)', part: 'led' }, servo: { label: 'Servo (a waving flag)', part: 'servo' },
};

/** Wire the chosen sensor and output the way the reviewed builds do; rails are linked top to bottom. */
export function inventCircuit(sensor: InventSensor, output: InventOutput): Circuit {
  const steps: BuildStep[] = [...RAILS, W('Link the rails: + to +', 'tp30', 'bp30', 'red'), W('Link the rails: − to −', 'tn29', 'bn29', 'black')];
  if (sensor === 'ultrasonic') steps.push(
    P('Ultrasonic sensor', 'us1', 'ultrasonic', { vcc: 'h16c', trig: 'h17c', echo: 'h18c', gnd: 'h19c' }),
    W('VCC to +', 'h16a', 'tp16', 'red'), W('Trig to pin 12', 'h17a', 'u:D12', 'yellow'), W('Echo to pin 11', 'h18a', 'u:D11', 'green'), W('GND to −', 'h19a', 'tn19', 'black'));
  else if (sensor === 'light') steps.push(
    P('Photoresistor', 'ldr1', 'ldr', { a: 'h18c', b: 'h20c' }), W('to +', 'h18a', 'tp18', 'red'),
    P('10 kΩ', 'r2', 'resistor', { a: 'h20e', b: 'h24e' }, { ohms: 10_000 }), W('to −', 'h24a', 'tn24', 'black'), W('divider to A0', 'h20a', 'u:A0', 'green'));
  else steps.push(
    P('Thermistor', 'ntc1', 'ntc', { a: 'h18c', b: 'h20c' }), W('to +', 'h18a', 'tp18', 'red'),
    P('10 kΩ', 'r3', 'resistor', { a: 'h20e', b: 'h24e' }, { ohms: 10_000 }), W('to −', 'h24a', 'tn24', 'black'), W('divider to A0', 'h20a', 'u:A0', 'green'));
  if (output === 'buzzer') steps.push(P('Active buzzer', 'bz1', 'buzzer', { plus: 'h6h', minus: 'h8h' }), W('pin 8 to buzzer +', 'u:D8', 'h6j', 'yellow'), W('buzzer − to −', 'h8j', 'bn8', 'black'));
  else if (output === 'led') steps.push(W('pin 8 to the resistor', 'u:D8', 'h4j', 'yellow'), P('220 Ω', 'r1', 'resistor', { a: 'h4h', b: 'h8h' }, { ohms: 220 }), P('LED', 'led1', 'led', { anode: 'h8f', cathode: 'h9f' }, { color: 'red' }), W('LED − to −', 'h9j', 'bn9', 'black'));
  else steps.push(P('Servo', 'sv1', 'servo', { gnd: 'h6h', vcc: 'h7h', sig: 'h8h' }), W('brown to −', 'h6j', 'bn6', 'black'), W('red to +', 'h7j', 'bp7', 'red'), W('orange to pin 9', 'h8j', 'u:D9', 'orange'));
  return recipeCircuit({ steps } as Recipe);
}
/** Is the output alerting in this result? */
export function isAlerting(c: Circuit, r: SimResult, bench: Bench): boolean {
  return c.parts.some((p) => (p.kind === 'buzzer' && r.parts[p.id]?.sounding) || (p.kind === 'led' && (r.parts[p.id]?.brightness ?? 0) > 0.5) || (p.kind === 'servo' && (bench.servo[p.id]?.angle ?? 90) > 120));
}
/** Run the invention at one test condition. */
export function inventTest(sensor: InventSensor, output: InventOutput, slots: Slots, env: Partial<Env>): { alert: boolean; reading: string } {
  const c = inventCircuit(sensor, output);
  const out = probe(c, SKETCHES.invent, { ...slots, sensor, output }, env, 900);
  return { alert: isAlerting(out.bench.circuit, out.r, out.bench), reading: out.serial[out.serial.length - 1] ?? '' };
}
