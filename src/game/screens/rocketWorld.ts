import * as THREE from 'three';

/** Rendering-only inputs. No timers, random questions or game actions live here. */
export interface FlightView {
  order: number;
  progress: number;
  lane: 0 | 1 | 2;
  status: 'active' | 'boost' | 'hit' | 'won' | 'lost';
  reducedMotion: boolean;
  preview?: boolean;
}

export function createRocketWorld() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 180);
  camera.position.set(0, 0, 24);
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const geometry = <T extends THREE.BufferGeometry>(g: T): T => { geometries.add(g); return g; };
  const material = <T extends THREE.Material>(m: T): T => { materials.add(m); return m; };
  const surface = (color: number, metalness = 0.25) => material(new THREE.MeshStandardMaterial({ color, metalness, roughness: 0.48 }));
  const silver = surface(0xdce7f0, 0.65);
  const dark = surface(0x23344b, 0.7);
  const copper = surface(0xf1a646, 0.5);
  const blue = surface(0x2479c0, 0.6);
  const glass = material(new THREE.MeshStandardMaterial({ color: 0x3be9ff, emissive: 0x087cad, emissiveIntensity: 0.65, metalness: 0.8, roughness: 0.14 }));
  const mesh = (parent: THREE.Object3D, g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
    const object = new THREE.Mesh(geometry(g), m);
    object.position.set(x, y, z); parent.add(object); return object;
  };
  scene.add(new THREE.HemisphereLight(0xbdeaff, 0x1c2341, 2.2));
  const sun = new THREE.DirectionalLight(0xffedce, 3.8);
  sun.position.set(-9, 12, 18); scene.add(sun);
  const rim = new THREE.DirectionalLight(0x3098ff, 2.8);
  rim.position.set(8, 0, -6); scene.add(rim);

  // A compact, original expedition craft, with side boosters and landing gear.
  const rocket = new THREE.Group(); rocket.name = 'expedition-rocket'; scene.add(rocket);
  mesh(rocket, new THREE.CylinderGeometry(0.45, 0.56, 2.2, 24), silver, 0, 0.2);
  mesh(rocket, new THREE.ConeGeometry(0.45, 1, 24), blue, 0, 1.8);
  mesh(rocket, new THREE.CylinderGeometry(0.57, 0.57, 0.16, 24), copper, 0, -0.7);
  mesh(rocket, new THREE.CylinderGeometry(0.34, 0.44, 0.38, 20), dark, 0, -1.06);
  const windowRim = mesh(rocket, new THREE.TorusGeometry(0.25, 0.055, 8, 24), copper, 0, 0.75, 0.44);
  windowRim.rotation.x = -0.12;
  mesh(rocket, new THREE.SphereGeometry(0.22, 16, 12), glass, 0, 0.75, 0.47).scale.z = 0.25;
  mesh(rocket, new THREE.BoxGeometry(0.14, 0.48, 0.025), blue, 0, -0.12, 0.56);
  const legs = new THREE.Group(); legs.name = 'landing-gear'; rocket.add(legs);
  for (const side of [-1, 1]) {
    mesh(rocket, new THREE.CylinderGeometry(0.2, 0.24, 1.5, 16), silver, side * 0.66, -0.15);
    mesh(rocket, new THREE.ConeGeometry(0.2, 0.45, 16), copper, side * 0.66, 0.82);
    mesh(rocket, new THREE.CylinderGeometry(0.18, 0.22, 0.28, 16), dark, side * 0.66, -1);
    const fin = mesh(rocket, new THREE.BoxGeometry(0.12, 0.92, 0.55), blue, side * 0.67, -0.6);
    fin.rotation.z = -side * 0.4;
    const strut = mesh(legs, new THREE.CylinderGeometry(0.045, 0.045, 1.25, 8), copper, side * 0.65, -1.15, 0.08);
    strut.rotation.z = -side * 0.6;
    mesh(legs, new THREE.CylinderGeometry(0.22, 0.24, 0.08, 12), dark, side, -1.65, 0.08);
  }
  const flameMat = material(new THREE.MeshBasicMaterial({ color: 0x5be8ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  const flame = mesh(rocket, new THREE.ConeGeometry(0.3, 1.9, 16), flameMat, 0, -2.1);
  flame.rotation.z = Math.PI;
  const core = mesh(flame, new THREE.ConeGeometry(0.13, 1.35, 12), material(new THREE.MeshBasicMaterial({ color: 0xf3fdff })), 0, -0.22);
  core.rotation.z = 0;

  // Stable procedural variation keeps scenes reproducible and needs no external assets.
  let seed = 2037;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const starPositions = new Float32Array(540 * 3);
  for (let i = 0; i < starPositions.length; i += 3) {
    starPositions[i] = (random() - 0.5) * 95;
    starPositions[i + 1] = (random() - 0.5) * 80;
    starPositions[i + 2] = -8 - random() * 65;
  }
  const starsGeo = geometry(new THREE.BufferGeometry());
  starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starsMat = material(new THREE.PointsMaterial({ color: 0xd5edff, size: 0.1, transparent: true, opacity: 0.85, depthWrite: false }));
  const stars = new THREE.Points(starsGeo, starsMat); scene.add(stars);

  // Vertex-coloured Earth: oceans, stylised land and polar ice, without texture downloads.
  const earthGeo = new THREE.SphereGeometry(1, 64, 40);
  const ep = earthGeo.getAttribute('position'); const colors: number[] = [];
  const land = new THREE.Color(0x469d80); const ocean = new THREE.Color(0x146aa5); const ice = new THREE.Color(0xc5e9ed);
  for (let i = 0; i < ep.count; i++) {
    const x = ep.getX(i), y = ep.getY(i), z = ep.getZ(i);
    const n = Math.sin(x * 8 + z * 3) + Math.cos(z * 9 - y * 4) * 0.65 + Math.sin(y * 11 + x * 5) * 0.45;
    const c = Math.abs(y) > 0.91 ? ice : n > 0.65 ? land : ocean;
    colors.push(c.r, c.g, c.b);
  }
  earthGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const earth = mesh(scene, earthGeo, material(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })));
  const haloMat = material(new THREE.MeshBasicMaterial({ color: 0x48bcff, transparent: true, opacity: 0.13, side: THREE.BackSide, depthWrite: false }));
  mesh(earth, new THREE.SphereGeometry(1.045, 48, 24), haloMat);

  const moonGeo = new THREE.SphereGeometry(1, 88, 56);
  const mp = moonGeo.getAttribute('position');
  const craters = Array.from({ length: 32 }, () => ({
    direction: new THREE.Vector3(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1).normalize(),
    size: 0.07 + random() * 0.17,
  }));
  const mc: number[] = []; const p = new THREE.Vector3();
  for (let i = 0; i < mp.count; i++) {
    p.fromBufferAttribute(mp, i).normalize();
    let height = 1 + 0.006 * Math.sin(p.x * 71) * Math.cos(p.y * 63);
    let shade = 0.62;
    for (const crater of craters) {
      const d = p.distanceTo(crater.direction) / crater.size;
      if (d < 1) { height -= 0.036 * (1 - d * d); shade -= 0.17 * (1 - d); }
      else if (d < 1.24) height += 0.017 * Math.sin((d - 1) / 0.24 * Math.PI);
    }
    mp.setXYZ(i, p.x * height, p.y * height, p.z * height);
    mc.push(shade, shade * 1.02, shade * 1.08);
  }
  moonGeo.setAttribute('color', new THREE.Float32BufferAttribute(mc, 3)); moonGeo.computeVertexNormals();
  const moon = mesh(scene, moonGeo, material(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })));

  // Launch complex slides below the craft as answers power the ascent.
  const launch = new THREE.Group(); scene.add(launch);
  mesh(launch, new THREE.CylinderGeometry(2.5, 2.75, 0.35, 40), dark);
  mesh(launch, new THREE.TorusGeometry(2.05, 0.065, 6, 48), copper, 0, 0.19).rotation.x = Math.PI / 2;
  for (const x of [-2.7, 2.7]) {
    mesh(launch, new THREE.BoxGeometry(0.17, 5.5, 0.17), dark, x, 2.6, -0.5);
    for (let y = 0.4; y < 5.4; y += 0.8) {
      const beam = mesh(launch, new THREE.BoxGeometry(0.12, 1, 0.12), copper, x + 0.35, y, -0.5);
      beam.rotation.z = 0.72;
    }
    mesh(launch, new THREE.BoxGeometry(0.17, 5.5, 0.17), dark, x + 0.7, 2.6, -0.5);
  }
  mesh(launch, new THREE.BoxGeometry(7, 0.12, 0.35), dark, 0.35, 5.3, -0.5);

  const clouds = new THREE.Group(); scene.add(clouds);
  const cloudGeometry = geometry(new THREE.SphereGeometry(1, 12, 8));
  const cloudMaterial = material(new THREE.MeshStandardMaterial({ color: 0xe6f5ff, transparent: true, opacity: 0.5, depthWrite: false, roughness: 1 }));
  const cloudPuffs = new THREE.InstancedMesh(cloudGeometry, cloudMaterial, 30);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 30; i++) {
    const side = i % 2 ? -1 : 1;
    dummy.position.set(side * (4.5 + random() * 8), random() * 25 - 12, -5 - random() * 5);
    dummy.scale.set(1.8 + random() * 2, 0.5 + random() * 0.6, 1);
    dummy.updateMatrix(); cloudPuffs.setMatrixAt(i, dummy.matrix);
  }
  clouds.add(cloudPuffs);

  const satellite = new THREE.Group(); scene.add(satellite);
  mesh(satellite, new THREE.BoxGeometry(0.8, 0.65, 0.65), copper);
  mesh(satellite, new THREE.CylinderGeometry(0.07, 0.07, 4.4, 8), silver).rotation.z = Math.PI / 2;
  for (const x of [-1.6, 1.6]) {
    mesh(satellite, new THREE.BoxGeometry(1.8, 1, 0.06), blue, x, 0, 0.1);
    for (let i = -2; i <= 2; i++) mesh(satellite, new THREE.BoxGeometry(0.022, 1, 0.02), silver, x + i * 0.3, 0, 0.15);
    mesh(satellite, new THREE.BoxGeometry(1.8, 0.022, 0.02), silver, x, 0, 0.15);
  }
  const dish = mesh(satellite, new THREE.SphereGeometry(0.36, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), silver, 0, 0.6);
  dish.rotation.x = -0.5;

  const rocks = new THREE.Group(); scene.add(rocks);
  const rockGeometry = geometry(new THREE.IcosahedronGeometry(0.5, 1));
  const rockMaterial = surface(0x798296, 0.1);
  for (let i = 0; i < 7; i++) {
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set((i % 2 ? -1 : 1) * (5 + random() * 6), random() * 22 - 11, -7 - random() * 8);
    rock.scale.setScalar(0.4 + random()); rocks.add(rock);
  }

  const dustPositions = new Float32Array(90 * 3);
  const dustGeo = geometry(new THREE.BufferGeometry());
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = material(new THREE.PointsMaterial({ color: 0x88eaff, size: 0.085, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  const dust = new THREE.Points(dustGeo, dustMat); scene.add(dust);
  const shieldMat = material(new THREE.MeshBasicMaterial({ color: 0xff9751, transparent: true, opacity: 0.2, wireframe: true, depthWrite: false }));
  const shield = mesh(rocket, new THREE.SphereGeometry(1.6, 16, 12), shieldMat, 0, 0.15);

  let span = 10; let previousStatus = ''; let phaseStarted = 0; let lastTime = 0;
  const resize = (width: number, height: number) => {
    camera.aspect = width / Math.max(1, height); camera.updateProjectionMatrix();
    span = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 24 * camera.aspect;
  };
  const update = (view: FlightView, seconds: number) => {
    const dt = Math.min(0.05, Math.max(0, seconds - lastTime)); lastTime = seconds;
    if (view.status !== previousStatus) { previousStatus = view.status; phaseStarted = seconds; }
    const phase = seconds - phaseStarted;
    const moving = !view.reducedMotion;
    const t = moving ? seconds : 0;
    const progress = THREE.MathUtils.clamp(view.progress, 0, 1);
    const stage = view.order - 1 + progress;
    const landing = view.order === 7;
    const landed = landing && view.status === 'won';
    const boost = view.status === 'boost';
    const hit = view.status === 'hit';
    const x = (view.lane - 1) * span * 2 / 3;
    const blend = moving ? 1 - Math.exp(-dt * 12) : 1;
    rocket.position.x += (x - rocket.position.x) * blend;
    rocket.position.y = view.preview ? -0.1 : landed ? -3.1 + (moving ? 0.7 * Math.max(0, 1 - phase / 1.5) : 0) : landing ? -2.4 : -3.1;
    if (moving) rocket.position.y += Math.sin(t * 2.2) * 0.08 + (boost ? Math.sin(Math.min(1, phase / 0.8) * Math.PI) * 1.1 : 0);
    rocket.rotation.set(0.07, Math.sin(t * 0.4) * 0.12, moving ? (rocket.position.x - x) * 0.065 + (hit ? Math.sin(phase * 19) * Math.exp(-phase * 3) * 0.2 : 0) : 0);
    rocket.scale.setScalar(view.preview ? 1.25 : 1);
    legs.visible = landing;
    flame.visible = !landed && view.status !== 'lost';
    flame.scale.y = (boost ? 1.65 : landing ? 0.55 : 0.85) * (1 + Math.sin(t * 28) * 0.08);
    shield.visible = hit;
    shield.scale.setScalar(1 + (moving ? phase * 0.8 : 0));
    shieldMat.opacity = moving ? Math.max(0, 0.35 - phase * 0.25) : 0.2;
    starsMat.opacity = THREE.MathUtils.clamp(stage / 3, 0.12, 0.9);
    stars.rotation.z = t * 0.002;
    earth.position.set(-span * 0.28, -14 + Math.min(stage, 4) * 1.5, -15);
    earth.scale.setScalar(Math.max(1.3, 12 - stage * 2));
    earth.rotation.y = t * 0.018;
    moon.position.set(landing ? 0 : span * 0.7, landing ? -21.85 : 5.5 - Math.max(0, stage - 4), landing ? 0 : -12);
    moon.scale.setScalar(landing ? 17.1 : 0.8 + Math.max(0, stage - 2) * 0.8);
    moon.rotation.y = 0.3 + (landing ? 0 : t * 0.01);
    launch.visible = view.order === 1 && progress < 0.7;
    launch.position.set(0, -5.9 - progress * 12, -1.5);
    launch.rotation.x = 0.2;
    clouds.visible = stage < 3;
    clouds.position.y = moving ? -(t * (boost ? 1.5 : 0.25) % 8) : 0;
    cloudMaterial.opacity = Math.max(0, 0.48 - stage * 0.12);
    satellite.visible = view.order >= 3 && view.order <= 5;
    satellite.position.set(-span * 0.88 + Math.sin(t * 0.12) * 1.4, 1.6 + Math.cos(t * 0.14), -6);
    satellite.rotation.set(0.2, t * 0.12, -0.3);
    satellite.scale.setScalar(0.6);
    rocks.visible = view.order >= 5;
    rocks.rotation.z = Math.sin(t * 0.07) * 0.08;
    rocks.children.forEach((rock, i) => { rock.rotation.set(t * 0.08, t * 0.05 + i, 0); });
    dust.visible = moving && !landed && view.status !== 'lost';
    for (let i = 0; i < 90; i++) {
      const age = (t * (boost ? 2 : 0.65) + i / 90) % 1;
      dustPositions[i * 3] = rocket.position.x + Math.sin(i * 9.73) * age * 0.65;
      dustPositions[i * 3 + 1] = rocket.position.y - 1.3 - age * (boost ? 5 : 3);
      dustPositions[i * 3 + 2] = Math.cos(i * 4.2) * age * 0.4;
    }
    dustGeo.getAttribute('position').needsUpdate = true;
  };
  return { scene, camera, resize, update, dispose() {
    cloudPuffs.dispose();
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); scene.clear();
  } };
}
