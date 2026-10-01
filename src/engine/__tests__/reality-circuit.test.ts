import { describe, it, expect } from 'vitest';
import { solve, defaultEnv, footprint, buildNets, ldrOhms, ntcOhms, type Circuit, type PinDrive } from '../reality/circuit';

const W = (id: string, a: string, b: string) => ({ id, a, b, color: 'yellow' as const });
const env = (patch = {}) => ({ ...defaultEnv(), ...patch });
const none: Record<string, PinDrive> = {};

/** 5 V → rail → resistor → LED → GND rail, the Mission 03 circuit. */
function ledCircuit(ohms: number | null, reversed = false): Circuit {
  const parts: Circuit['parts'] = [{ id: 'led', kind: 'led', color: 'red', pins: reversed ? { anode: 'h14f', cathode: 'h13f' } : { anode: 'h13f', cathode: 'h14f' } }];
  const wires = [W('w1', 'u:5V', 'bp2'), W('w2', 'u:GND1', 'bn2'), W('w4', 'h14j', 'bn14')];
  if (ohms === null) wires.push(W('w3', 'bp9', 'h13j'));
  else { parts.push({ id: 'r', kind: 'resistor', ohms, pins: { a: 'h9f', b: 'h13g' } }); wires.push(W('w3', 'bp9', 'h9j')); }
  return { parts, wires };
}

describe('Reality Lab circuit solver', () => {
  it('breadboard strips: a–e join, f–j join, the gap separates them; rails run the length', () => {
    const net = buildNets({ parts: [], wires: [] });
    expect(net('h5a')).toBe(net('h5e')); expect(net('h5f')).toBe(net('h5j'));
    expect(net('h5e')).not.toBe(net('h5f')); expect(net('h5a')).not.toBe(net('h6a'));
    expect(net('tp1')).toBe(net('tp30')); expect(net('tp1')).not.toBe(net('bp1'));
    expect(net('u:GND1')).toBe(net('u:GND3'));
  });
  it('an LED with 220 Ω from 5 V carries about 13 mA and glows', () => {
    const r = solve(ledCircuit(220), none, env());
    expect(r.powered).toBe(true);
    expect(r.parts.led.i).toBeGreaterThan(12); expect(r.parts.led.i).toBeLessThan(14.5);
    expect(r.parts.led.brightness).toBeGreaterThan(0.8); expect(r.warnings).toEqual([]);
  });
  it('bigger resistors mean less current: 1 kΩ is dim, 10 kΩ barely glows', () => {
    const one = solve(ledCircuit(1000), none, env()).parts.led.i; const ten = solve(ledCircuit(10_000), none, env()).parts.led.i;
    expect(one).toBeGreaterThan(2.5); expect(one).toBeLessThan(3.5); expect(ten).toBeLessThan(0.35);
  });
  it('no resistor: far too much current, the LED would burn out', () => {
    const r = solve(ledCircuit(null), none, env());
    expect(r.parts.led.i).toBeGreaterThan(100); expect(r.warnings.map((w) => w.kind)).toContain('led-overcurrent');
  });
  it('a backwards LED stays dark', () => {
    const r = solve(ledCircuit(220, true), none, env());
    expect(r.parts.led.i).toBe(0); expect(r.parts.led.brightness).toBe(0); expect(r.warnings.map((w) => w.kind)).toContain('reverse-led');
  });
  it('a wire from 5 V straight to GND trips the USB fuse', () => {
    const r = solve({ parts: [], wires: [W('a', 'u:5V', 'tp3'), W('b', 'tp8', 'tn8'), W('c', 'u:GND1', 'tn2')] }, none, env());
    expect(r.powered).toBe(false); expect(r.warnings[0].kind).toBe('short');
  });
  it('an LED straight on a pin overloads the pin', () => {
    const c: Circuit = { parts: [{ id: 'led', kind: 'led', color: 'red', pins: { anode: 'h13f', cathode: 'h14f' } }], wires: [W('a', 'u:D13', 'h13j'), W('b', 'h14j', 'bn14'), W('c', 'u:GND1', 'bn2')] };
    const r = solve(c, { D13: { mode: 'out', high: true } }, env());
    expect(r.warnings.map((w) => w.kind)).toEqual(expect.arrayContaining(['pin-overcurrent', 'led-overcurrent']));
    const off = solve(c, { D13: { mode: 'out', high: false } }, env()); expect(off.parts.led.i).toBe(0);
  });
  it('a button input floats without a pull resistor; INPUT_PULLUP reads 1 released and 0 pressed', () => {
    const btn = footprint('button', 'h10e')!;
    // Both wires on the top half (columns 10 and 12): only the button can join them.
    const c: Circuit = { parts: [{ id: 'b', kind: 'button', pins: btn }], wires: [W('a', 'u:D2', 'h10a'), W('b', 'h12a', 'tn12'), W('c', 'u:GND1', 'tn2')] };
    expect(solve(c, { D2: { mode: 'in' } }, env()).pins.D2.reading).toBe('float');
    expect(solve(c, { D2: { mode: 'pullup' } }, env()).pins.D2.reading).toBe(1);
    expect(solve(c, { D2: { mode: 'pullup' } }, env({ pressed: { b: true } })).pins.D2.reading).toBe(0);
    // Turned 90°: always joined along the row, so the pin reads LOW even when nobody presses.
    const rot: Circuit = { ...c, parts: [{ id: 'b', kind: 'button', pins: btn, rotated: true }] };
    expect(solve(rot, { D2: { mode: 'pullup' } }, env()).pins.D2.reading).toBe(0);
  });
  it('a potentiometer divides 5 V: the wiper reads the knob position as 0–1023', () => {
    const pot = footprint('pot', 'h10e')!;
    const c: Circuit = { parts: [{ id: 'k', kind: 'pot', pins: pot }], wires: [W('a', 'u:5V', 'h10a'), W('b', 'u:GND1', 'h12a'), W('c', 'u:A0', 'h11a')] };
    for (const pos of [0, 0.25, 0.5, 1]) {
      const a = solve(c, { A0: { mode: 'in' } }, env({ knob: { k: pos } })).pins.A0.analog!;
      expect(Math.abs(a - Math.round((1 - pos) * 1023))).toBeLessThanOrEqual(2);
    }
  });
  it('a photoresistor divider reads higher in bright light (LDR on the 5 V side)', () => {
    const c: Circuit = { parts: [{ id: 'ldr', kind: 'ldr', pins: { a: 'h10a', b: 'h12a' } }, { id: 'r', kind: 'resistor', ohms: 10_000, pins: { a: 'h12c', b: 'h15c' } }],
      wires: [W('a', 'u:5V', 'h10b'), W('b', 'u:A0', 'h12b'), W('c', 'h15a', 'tn15'), W('d', 'u:GND1', 'tn2')] };
    const dark = solve(c, { A0: { mode: 'in' } }, env({ light: 5 })).pins.A0.analog!; const bright = solve(c, { A0: { mode: 'in' } }, env({ light: 95 })).pins.A0.analog!;
    expect(bright).toBeGreaterThan(700); expect(dark).toBeLessThan(150);
    expect(ldrOhms(0)).toBeCloseTo(200_000, -2); expect(ntcOhms(25)).toBeCloseTo(10_000, 0); expect(ntcOhms(40)).toBeLessThan(ntcOhms(10));
  });
  it('PWM dims an LED in proportion to duty', () => {
    const c: Circuit = { parts: [{ id: 'led', kind: 'led', color: 'red', pins: { anode: 'h13f', cathode: 'h14f' } }, { id: 'r', kind: 'resistor', ohms: 220, pins: { a: 'h9f', b: 'h13g' } }],
      wires: [W('a', 'u:D9', 'h9j'), W('b', 'h14j', 'bn14'), W('c', 'u:GND1', 'bn2')] };
    const full = solve(c, { D9: { mode: 'pwm', duty: 255 } }, env()).parts.led.i; const quarter = solve(c, { D9: { mode: 'pwm', duty: 64 } }, env()).parts.led.i;
    expect(quarter / full).toBeGreaterThan(0.22); expect(quarter / full).toBeLessThan(0.28);
  });
});
