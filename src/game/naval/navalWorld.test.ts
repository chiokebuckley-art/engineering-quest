import { describe, expect, it } from 'vitest';
import { Box3, Mesh, Points, Vector3, type BufferGeometry, type Material } from 'three';
import { createNavalWorld } from './navalWorld';
import { battleView } from './battle';
import { initialState } from '../../engine/state/initialState';
import { gameReducer } from '../../engine/state/reducer';

const view = (count: number) => battleView(gameReducer(initialState(), { type: 'VERSUS_SETUP', kind: 'hotseat', game: 'mult', selection: 'mult:all', names: Array.from({ length: count }, (_, i) => `Ship ${i}`), seed: 42 }).versus!);
describe('naval world', () => {
  it('fits all vessels and labels in phone and desktop viewports for two to six players', () => {
    for (let count = 2; count <= 6; count++) {
      const v = view(count); const world = createNavalWorld(v);
      for (const [w, h] of [[300, 175], [390, 220], [800, 420]]) {
        world.resize(w, h); world.update(v, 0);
        for (const ship of v.ships) {
          const bounds = new Box3().setFromObject(world.scene.getObjectByName(ship.id)!);
          for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
            const p = new Vector3(x, y, z).project(world.camera);
            expect(Math.abs(p.x)).toBeLessThan(.98); expect(Math.abs(p.y)).toBeLessThan(.98);
          }
        }
        for (const label of world.labels()) { expect(label.x).toBeGreaterThan(8); expect(label.x).toBeLessThan(92); expect(label.y).toBeGreaterThan(8); expect(label.y).toBeLessThan(90); }
      }
      world.dispose();
    }
  });
  it('animates volleys and sinking with finite transforms and frees every resource on exit', () => {
    const v = { ...view(6), playing: true }; const world = createNavalWorld(v); world.resize(600, 300); world.update(v, 0);
    const fired = { ...v, ships: v.ships.map(s => ({ ...s, score: 50, shells: 5, hull: 50 })) };
    for (let t = .05; t < 2; t += .05) world.update(fired, t);
    const final = { ...fired, final: true, ships: fired.ships.map((s, i) => ({ ...s, sunk: i !== 0, winner: i === 0, hull: i === 0 ? 50 : 0 })) };
    for (let t = 2; t < 8; t += .05) world.update(final, t);
    expect(world.scene.getObjectByName(final.ships[1].id)!.position.y).toBeLessThan(-3.8);
    expect(world.scene.getObjectByName(final.ships[0].id)!.position.y).toBeGreaterThan(-.1);
    world.scene.traverse(o => expect(o.matrixWorld.elements.every(Number.isFinite)).toBe(true));
    const resources = new Set<BufferGeometry | Material>();
    world.scene.traverse(o => { if (o instanceof Mesh || o instanceof Points) { resources.add(o.geometry); for (const m of Array.isArray(o.material) ? o.material : [o.material]) resources.add(m); } });
    const disposed = new Map<object, number>();
    resources.forEach(r => r.addEventListener('dispose', () => disposed.set(r, (disposed.get(r) ?? 0) + 1)));
    world.dispose(); resources.forEach(r => expect(disposed.get(r)).toBe(1)); expect(world.scene.children).toHaveLength(0);
  });
  it('holds water and ships still with reduced motion', () => {
    const v = { ...view(2), reducedMotion: true }; const world = createNavalWorld(v); world.resize(390, 220);
    world.update(v, 1); const before = world.scene.getObjectByName(v.ships[0].id)!.matrixWorld.toArray();
    world.update(v, 15); expect(world.scene.getObjectByName(v.ships[0].id)!.matrixWorld.toArray()).toEqual(before); world.dispose();
  });
});
