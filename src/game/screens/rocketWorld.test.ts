import { describe, expect, it } from 'vitest';
import { Mesh, Vector3, type BufferGeometry, type Material } from 'three';
import { createRocketWorld, type FlightView } from './rocketWorld';

describe('expedition scene', () => {
  it('keeps all three craft positions aligned with answer lanes in portrait and landscape', () => {
    const world = createRocketWorld();
    for (const [width, height] of [[390, 350], [900, 400], [320, 600]]) {
      world.resize(width, height);
      for (const lane of [0, 1, 2] as const) {
        world.update({ order: 1, progress: 0, lane, status: 'active', reducedMotion: true }, 1);
        world.scene.updateMatrixWorld(true); world.camera.updateMatrixWorld(true);
        const rocket = world.scene.getObjectByName('expedition-rocket')!;
        const screen = rocket.getWorldPosition(new Vector3()).project(world.camera);
        expect(screen.x).toBeCloseTo((lane - 1) * 2 / 3, 4);
        expect(Math.abs(screen.y)).toBeLessThan(1);
      }
    }
    world.dispose();
  });

  it('renders every mission/status combination with finite transforms and deploys lunar landing gear', () => {
    const world = createRocketWorld(); world.resize(390, 350);
    const statuses: FlightView['status'][] = ['active', 'boost', 'hit', 'won', 'lost'];
    let time = 0;
    for (let order = 1; order <= 7; order++) {
      for (const status of statuses) {
        world.update({ order, progress: 0.8, lane: 1, status, reducedMotion: false }, time += 1);
        world.scene.updateMatrixWorld(true);
        world.scene.traverse(object => expect(object.matrixWorld.elements.every(Number.isFinite)).toBe(true));
        expect(world.scene.getObjectByName('landing-gear')!.visible).toBe(order === 7);
      }
    }
    world.dispose();
  });

  it('disposes shared geometry and materials once on exit', () => {
    const world = createRocketWorld();
    const resources = new Set<BufferGeometry | Material>();
    world.scene.traverse(object => {
      if (object instanceof Mesh) {
        resources.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) resources.add(material);
      }
    });
    const counts = new Map<object, number>();
    resources.forEach(resource => resource.addEventListener('dispose', () => counts.set(resource, (counts.get(resource) ?? 0) + 1)));
    world.dispose();
    expect(world.scene.children).toHaveLength(0);
    resources.forEach(resource => expect(counts.get(resource)).toBe(1));
  });
});
