import * as THREE from 'three';
import { newSalvos, type BattleView } from './battle';

export function shipPosition(index: number, count: number) {
  if (count <= 2) return new THREE.Vector3((index * 2 - 1) * 5.6, 0, 0);
  if (count === 3) return new THREE.Vector3((index - 1) * 6, 0, index === 1 ? -3 : 2);
  const columns = Math.ceil(count / 2);
  return new THREE.Vector3((index % columns - (columns - 1) / 2) * 6.5, 0, index < columns ? -4.5 : 4.5);
}

/** Original meshes and a bounded effects pool; no game state is mutated by rendering. */
export function createNavalWorld(initial: BattleView) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x112735);
  scene.fog = new THREE.Fog(0x112735, 35, 90);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 140);
  const geometries = new Set<THREE.BufferGeometry>(); const materials = new Set<THREE.Material>();
  const geometry = <T extends THREE.BufferGeometry>(g: T): T => { geometries.add(g); return g; };
  const material = <T extends THREE.Material>(m: T): T => { materials.add(m); return m; };
  const surface = (color: THREE.ColorRepresentation, metalness = 0.4) => material(new THREE.MeshStandardMaterial({ color, metalness, roughness: 0.55 }));
  const hullMat = surface(0x566b77); const deckMat = surface(0x293945); const railMat = surface(0x9aafb8, 0.65);
  const black = surface(0x111d27); const windowMat = material(new THREE.MeshStandardMaterial({ color: 0x80d8e6, emissive: 0x2586a6, emissiveIntensity: 0.65 }));
  const mesh = (parent: THREE.Object3D, g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
    const object = new THREE.Mesh(geometry(g), m); object.position.set(x, y, z); parent.add(object); return object;
  };
  scene.add(new THREE.HemisphereLight(0xaed8e9, 0x173a4a, 2.2));
  const sun = new THREE.DirectionalLight(0xffc58b, 3.2); sun.position.set(-15, 22, 9); scene.add(sun);
  const fill = new THREE.DirectionalLight(0x73cde6, 2); fill.position.set(10, 8, -16); scene.add(fill);

  const waterGeo = geometry(new THREE.PlaneGeometry(150, 150, 36, 36)); waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeo, material(new THREE.MeshPhongMaterial({ color: 0x155368, specular: 0x9dc9d2, shininess: 85 })));
  water.position.y = -0.12; scene.add(water);
  const wp = waterGeo.getAttribute('position'); let waterFrame = 0;
  for (const x of [-23, 22, -30]) {
    const island = mesh(scene, new THREE.ConeGeometry(7, 6, 6), surface(0x253f47, 0), x, 1.8, -28);
    island.scale.set(1.8, 1, 1); island.rotation.y = x;
  }
  const lightMat = material(new THREE.MeshBasicMaterial({ color: 0xffc675 }));
  mesh(scene, new THREE.SphereGeometry(2.2, 24, 12), lightMat, -22, 12, -55);

  const smokeGeometry = geometry(new THREE.IcosahedronGeometry(0.45, 1));
  const ships = initial.ships.map((ship, index) => {
    const group = new THREE.Group(); group.name = ship.id; scene.add(group);
    const origin = shipPosition(index, initial.ships.length).multiplyScalar(1 + (ship.size - 1) * 0.6); group.position.copy(origin);
    group.scale.setScalar(ship.size);
    const heading = Math.atan2(origin.x, origin.z || 0.001); group.rotation.y = heading;
    const shape = new THREE.Shape();
    shape.moveTo(-0.62, -2.3); shape.lineTo(-0.8, 1.25); shape.lineTo(-0.4, 2.35);
    shape.lineTo(0, 2.95); shape.lineTo(0.4, 2.35); shape.lineTo(0.8, 1.25); shape.lineTo(0.62, -2.3); shape.closePath();
    const hullGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.75, bevelEnabled: true, bevelSize: 0.14, bevelThickness: 0.14, bevelSegments: 1, steps: 1 });
    hullGeo.rotateX(-Math.PI / 2);
    mesh(group, hullGeo, hullMat, 0, -0.35);
    mesh(group, new THREE.BoxGeometry(1.2, 0.13, 4.5), deckMat, 0, 0.49, 0.05);
    mesh(group, new THREE.BoxGeometry(1.05, 0.75, 1.05), hullMat, 0, 0.92, 0);
    mesh(group, new THREE.BoxGeometry(1.22, 0.18, 1.17), deckMat, 0, 1.38, 0);
    mesh(group, new THREE.BoxGeometry(1.07, 0.22, 0.055), windowMat, 0, 1.05, -0.56);
    mesh(group, new THREE.CylinderGeometry(0.22, 0.28, 0.95, 12), black, 0, 1.5, 0.8);
    mesh(group, new THREE.CylinderGeometry(0.04, 0.05, 1.5, 8), railMat, 0, 2, 0.05);
    mesh(group, new THREE.BoxGeometry(0.9, 0.08, 0.1), railMat, 0, 2.42, 0.05);
    const identity = surface(ship.color);
    mesh(group, new THREE.BoxGeometry(0.7, 0.38, 0.04), identity, 0.33, 2.5, 0.05);
    for (const side of [-1, 1]) {
      mesh(group, new THREE.BoxGeometry(0.04, 0.04, 3.5), railMat, side * 0.68, 0.78, 0.1);
      mesh(group, new THREE.BoxGeometry(0.055, 0.2, 1.2), identity, side * 0.87, 0.12, 0.25);
      for (let i = -1; i <= 2; i++) mesh(group, new THREE.BoxGeometry(0.035, 0.27, 0.035), railMat, side * 0.68, 0.67, i - 0.5);
    }
    const turrets: THREE.Group[] = [];
    for (const z of [-1.45, 1.6]) {
      const turret = new THREE.Group(); turret.position.set(0, 0.62, z); group.add(turret); turrets.push(turret);
      mesh(turret, new THREE.CylinderGeometry(0.38, 0.42, 0.28, 12), deckMat);
      mesh(turret, new THREE.BoxGeometry(0.65, 0.28, 0.58), hullMat, 0, 0.2);
      for (const x of [-0.16, 0.16]) mesh(turret, new THREE.CylinderGeometry(0.07, 0.09, 1.05, 8), black, x, 0.23, -0.55).rotation.x = Math.PI / 2;
    }
    const damage = new THREE.Group(); damage.visible = false; group.add(damage);
    const damageMat = material(new THREE.MeshBasicMaterial({ color: 0xff702e, transparent: true, opacity: 0.85 }));
    for (let i = 0; i < 3; i++) mesh(damage, new THREE.ConeGeometry(0.15, 0.6, 6), damageMat, (i - 1) * 0.2, 0.8, 0.65);
    const smokeMat = material(new THREE.MeshBasicMaterial({ color: 0x202b30, transparent: true, opacity: 0.5, depthWrite: false }));
    const smoke = Array.from({ length: 4 }, () => { const puff = new THREE.Mesh(smokeGeometry, smokeMat); group.add(puff); return puff; });
    const wakeMat = material(new THREE.MeshBasicMaterial({ color: 0xb7eced, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
    const wake = mesh(group, new THREE.PlaneGeometry(1.2, 3.8), wakeMat, 0, 0.08, 3.7); wake.rotation.x = -Math.PI / 2;
    const muzzle = mesh(group, new THREE.SphereGeometry(0.4, 8, 6), material(new THREE.MeshBasicMaterial({ color: 0xffe5a0, transparent: true, opacity: 0.85 })), 0, 0.8, -2.6); muzzle.visible = false;
    return { id: ship.id, group, origin, heading, turrets, smoke, smokeMat, damage, damageMat, wake, muzzle, firedAt: -100, hitAt: -100, sink: 0 };
  });

  const shellGeo = geometry(new THREE.SphereGeometry(0.11, 8, 6));
  const shellMat = material(new THREE.MeshBasicMaterial({ color: 0xffd17a }));
  const shells = Array.from({ length: 48 }, () => {
    const object = new THREE.Mesh(shellGeo, shellMat); object.visible = false; scene.add(object);
    const trail = mesh(object, new THREE.ConeGeometry(0.07, 0.9, 6), lightMat, 0, 0, 0); trail.rotation.x = Math.PI / 2;
    return { object, from: new THREE.Vector3(), to: new THREE.Vector3(), start: -100, target: '', active: false };
  });
  const impacts = Array.from({ length: 16 }, () => {
    const group = new THREE.Group(); scene.add(group); group.visible = false;
    const fireMat = material(new THREE.MeshBasicMaterial({ color: 0xff983e, transparent: true, depthWrite: false }));
    const fire = mesh(group, new THREE.IcosahedronGeometry(0.7, 1), fireMat);
    const core = mesh(group, new THREE.IcosahedronGeometry(0.37, 1), lightMat, 0, 0.2);
    const rippleMat = material(new THREE.MeshBasicMaterial({ color: 0xd1eff6, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
    const ripple = mesh(group, new THREE.RingGeometry(0.55, 0.65, 24), rippleMat, 0, 0.05); ripple.rotation.x = -Math.PI / 2;
    const sprayGeo = geometry(new THREE.BufferGeometry());
    const sprayPositions = new Float32Array(16 * 3); sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPositions, 3));
    const sprayMat = material(new THREE.PointsMaterial({ color: 0xffd29b, size: 0.11, transparent: true, depthWrite: false }));
    const spray = new THREE.Points(sprayGeo, sprayMat); group.add(spray);
    return { group, fire, fireMat, core, ripple, rippleMat, sprayPositions, sprayGeo, sprayMat, start: -100 };
  });
  let previous: BattleView | undefined; let shellCursor = 0; let impactCursor = 0;
  let endAt = -1; let last = 0; let now = 0; let stopped = false;
  const resize = (width: number, height: number) => {
    camera.aspect = width / Math.max(1, height);
    const scale = Math.max(1, 1.4 / camera.aspect);
    camera.position.set(0, 17 * scale, 23 * scale); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  };
  const impact = (position: THREE.Vector3, target: string) => {
    const effect = impacts[impactCursor++ % impacts.length]; effect.start = now;
    effect.group.position.set(position.x, 0.2, position.z); effect.group.visible = true;
    const ship = ships.find(s => s.id === target); if (ship) ship.hitAt = now;
  };

  const update = (view: BattleView, seconds: number) => {
    if (stopped) return;
    const dt = Math.min(0.05, Math.max(0, seconds - last)); last = seconds; now = seconds;
    const moving = !view.reducedMotion; const t = moving ? now : 0;
    if (previous?.key !== view.key) { endAt = -1; shells.forEach(s => { s.active = false; s.object.visible = false; }); impacts.forEach(e => { e.start = -100; e.group.visible = false; }); }
    const events = newSalvos(previous, view);
    events.forEach((event, index) => {
      const from = ships.find(s => s.id === event.from); const to = ships.find(s => s.id === event.to);
      if (!from || !to) return;
      const shell = shells[shellCursor++ % shells.length];
      shell.from.copy(from.origin).setY(0.9); shell.to.copy(to.origin).setY(0.6);
      const direction = new THREE.Vector3().subVectors(to.origin, from.origin).normalize();
      shell.from.addScaledVector(direction, 1.9); shell.start = now + (index % 6) * 0.08;
      shell.target = event.to; shell.active = moving;
      from.firedAt = shell.start;
      const aim = Math.atan2(-direction.x, -direction.z) - from.heading;
      from.turrets.forEach(turret => { turret.rotation.y = aim; });
    });
    previous = view;
    if (view.final && endAt < 0) {
      endAt = now;
      if (moving) view.ships.filter(s => s.sunk).forEach(s => { const ship = ships.find(x => x.id === s.id); if (ship) impact(ship.origin, s.id); });
    }
    // Phones: animate the water on alternate frames so touch input never waits on the sea.
    waterFrame = (waterFrame + 1) % 2;
    if (waterFrame === 0) {
      for (let i = 0; i < wp.count; i++) {
        const x = wp.getX(i), z = wp.getZ(i);
        wp.setY(i, Math.sin(x * 0.48 + t * 1.1) * 0.13 + Math.cos(z * 0.67 - t * 0.9) * 0.1);
      }
      wp.needsUpdate = true; waterGeo.computeVertexNormals();
    }
    ships.forEach((ship, index) => {
      const state = view.ships.find(s => s.id === ship.id)!;
      const sink = state.sunk ? (moving ? THREE.MathUtils.clamp((now - endAt - 0.5) / 3, 0, 1) : 1) : 0;
      ship.sink += (sink - ship.sink) * (moving ? 1 - Math.exp(-dt * 6) : 1);
      ship.group.position.y = (moving ? Math.sin(t * 1.2 + index * 2) * 0.08 : 0) - ship.sink * 4.1;
      const hitAge = now - ship.hitAt;
      ship.group.rotation.z = (moving ? Math.sin(t * 1.1 + index) * 0.025 + (hitAge < 0.5 ? Math.sin(hitAge * 24) * 0.08 * (1 - hitAge / 0.5) : 0) : 0) + ship.sink * 0.55;
      ship.group.rotation.x = ship.sink * 0.28;
      ship.damage.visible = state.hull < 65 && ship.sink < 0.7;
      ship.damage.scale.y = 1 + (moving ? Math.sin(t * 12) * 0.12 : 0);
      ship.smokeMat.opacity = state.hull < 65 ? 0.65 : 0.25;
      ship.smoke.forEach((puff, n) => {
        const age = (t * 0.35 + n / 4) % 1;
        puff.position.set(age * 0.8, 1.95 + age * 2, 0.8 + age * 0.4);
        puff.scale.setScalar(0.35 + age * (state.hull < 65 ? 1.7 : 0.6)); puff.visible = ship.sink < 0.9;
      });
      ship.wake.visible = ship.sink < 0.2;
      ship.muzzle.visible = moving && now >= ship.firedAt && now - ship.firedAt < 0.14;
    });
    for (const shell of shells) {
      if (!shell.active) { shell.object.visible = false; continue; }
      const p = (now - shell.start) / 0.85;
      if (p < 0) { shell.object.visible = false; continue; }
      if (p >= 1) { shell.active = false; shell.object.visible = false; impact(shell.to, shell.target); continue; }
      shell.object.visible = moving; shell.object.position.lerpVectors(shell.from, shell.to, p);
      shell.object.position.y += Math.sin(p * Math.PI) * 3.3;
      const ahead = new THREE.Vector3().lerpVectors(shell.from, shell.to, Math.min(1, p + 0.02)); ahead.y += Math.sin((p + 0.02) * Math.PI) * 3.3;
      shell.object.lookAt(ahead);
    }
    for (const effect of impacts) {
      const age = now - effect.start;
      effect.group.visible = moving && age >= 0 && age < 1.4;
      if (!effect.group.visible) continue;
      effect.fire.scale.setScalar(0.2 + age * 2); effect.fire.position.y = age * 0.7;
      effect.fireMat.opacity = Math.max(0, 0.85 - age); effect.core.visible = age < 0.22;
      effect.ripple.scale.setScalar(1 + age * 4); effect.rippleMat.opacity = Math.max(0, 0.5 - age * 0.35);
      effect.sprayMat.opacity = Math.max(0, 1 - age);
      for (let i = 0; i < 16; i++) {
        const angle = i * 2.399;
        effect.sprayPositions[i * 3] = Math.cos(angle) * age * 2.8;
        effect.sprayPositions[i * 3 + 1] = Math.max(0.05, age * (2.5 + i % 3) - 3 * age * age);
        effect.sprayPositions[i * 3 + 2] = Math.sin(angle) * age * 2.8;
      }
      effect.sprayGeo.getAttribute('position').needsUpdate = true;
    }
    scene.updateMatrixWorld(true);
  };
  const labels = () => ships.map(ship => {
    const position = ship.origin.clone(); position.y = 3.4 * (initial.ships.find(s => s.id === ship.id)?.size ?? 1);
    position.project(camera);
    return { id: ship.id, x: (position.x + 1) * 50, y: (1 - position.y) * 50 };
  });
  return { scene, camera, resize, update, labels, dispose() { stopped = true; geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); scene.clear(); } };
}
