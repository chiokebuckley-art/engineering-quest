import { describe, it, expect } from 'vitest';
import { RECIPES, recipeCircuit, recipeSlots, probe } from '../reality/recipes';
import { SKETCHES } from '../reality/sketches';
import { renderSource } from '../reality/runtime';
import { occupied, parseHole, parseRail, isUno } from '../reality/circuit';

describe('Reality Lab reviewed builds', () => {
  for (const r of Object.values(RECIPES)) {
    it(`${r.id}: the reference build passes its own check`, () => {
      const res = r.check(recipeCircuit(r), recipeSlots(r));
      expect(res.message).toBeTruthy(); expect(res.ok, res.message).toBe(true);
    });
    it(`${r.id}: every fault is caught by the check`, () => {
      for (const f of r.faults) {
        const { circuit, slots } = f.apply(recipeCircuit(r), recipeSlots(r));
        const res = r.check(circuit, slots);
        expect(res.ok, `${f.id}: ${res.message}`).toBe(false);
        expect(f.decoys.length).toBeGreaterThanOrEqual(3); expect(f.decoys).not.toContain(f.cause);
      }
    });
    it(`${r.id}: steps use one point per hole, on the board`, () => {
      const c = recipeCircuit(r); const pts = [...c.parts.flatMap((p) => Object.values(p.pins)), ...c.wires.flatMap((w) => [w.a, w.b])];
      expect(new Set(pts).size).toBe(pts.length); expect(occupied(c).size).toBe(pts.length);
      for (const p of pts) expect(!!parseHole(p) || !!parseRail(p) || isUno(p), p).toBe(true);
    });
  }
  it('every sketch renders C++ with no unfilled blanks, for every choice', () => {
    for (const sk of Object.values(SKETCHES)) {
      const choices = sk.slots.filter((x) => x.kind === 'choice');
      const combos: Record<string, string | number>[] = [{}];
      for (const ch of choices) { const next: typeof combos = []; for (const c of combos) for (const o of ch.options ?? []) next.push({ ...c, [ch.key]: o }); combos.splice(0, combos.length, ...next); }
      for (const combo of combos) {
        const src = renderSource(sk, combo);
        expect(src, sk.id).not.toMatch(/\{\{|\}\}|undefined|NaN/);
        expect(src).toMatch(/void setup\(\)/); expect(src).toMatch(/void loop\(\)/);
        expect(src.split('{').length, `${sk.id} braces`).toBe(src.split('}').length);
      }
    }
  });
  it('an LED that is over-driven burns out and stays dark', () => {
    const r = RECIPES.led; const f = r.faults.find((x) => x.id === 'bypass')!;
    const { circuit } = f.apply(recipeCircuit(r), {});
    const { bench } = probe(circuit, null, {}, {}, 1000);
    expect(bench.circuit.parts.find((p) => p.id === 'led1')!.blown).toBe(true);
  });
  it('the echo ranger turns echo time into centimetres', () => {
    const r = RECIPES.echo; const out = probe(recipeCircuit(r), SKETCHES.echo, recipeSlots(r), { distanceCm: 57 }, 600);
    expect(out.serial.pop()).toBe('Distance: 57 cm');
  });
});
