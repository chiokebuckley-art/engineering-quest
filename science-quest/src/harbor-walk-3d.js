import * as THREE from './vendor/three.module.js';
import {walkDirection} from './walk-direction.js';
import {addHarborScenery, cameraObstructionGuard} from './harbor-scenery.js';

/**
 * Physical stopping distance model matching Science Quest:
 * Ep = m * g * h
 * Fr = mu * m * g
 * d = Ep / Fr = h / mu
 */
export const DOCK_SURFACES = {
  smooth: { id: 'smooth', name: 'Smooth Wood Dock', friction: 0.20, color: 0xc4a375 },
  rubber: { id: 'rubber', name: 'Rough Rubber Mat', friction: 0.40, color: 0x30373d }
};

export function calculateRollDistance(height, surface = 'smooth') {
  const s = DOCK_SURFACES[surface] || DOCK_SURFACES.smooth;
  const h = Math.max(0.10, Math.min(0.50, height));
  const d = h / s.friction;
  return Math.round(d * 100) / 100;
}

export function validateFairTest(trial1, newHeight, newSurface) {
  if (!trial1) return { fair: true };
  const sameSurface = newSurface === trial1.surface;
  const heightDiff = Math.abs(newHeight - trial1.height);
  const changedHeight = heightDiff >= 0.01;

  if (!sameSurface && changedHeight) {
    return {
      fair: false,
      reason: 'both_changed',
      message: `⚠️ That test is not fair and does not count! You changed both height (${newHeight.toFixed(2)} m) and surface (${DOCK_SURFACES[newSurface]?.name || newSurface}) together. In a fair test, keep the surface on ${trial1.surfaceName} and change only the height!`
    };
  }

  if (!sameSurface && !changedHeight) {
    return {
      fair: false,
      reason: 'surface_changed_not_height',
      message: `⚠️ That test is not fair! You kept the ramp height identical (${newHeight.toFixed(2)} m) and changed the surface. To test how height affects motion, keep the surface on ${trial1.surfaceName} and choose a different ramp height!`
    };
  }

  if (sameSurface && !changedHeight) {
    return {
      fair: false,
      reason: 'no_change',
      message: `Choose a different ramp height to compare with your first roll of ${trial1.height.toFixed(2)} m.`
    };
  }

  return { fair: true };
}

export function createHarborWalkState() {
  return {
    step: 1, // 1: Walk to rover, 2: First roll, 3: Fair second roll, 4: Question, 5: Restored
    height: 0.20,
    surface: 'smooth',
    isRolling: false,
    trials: [],
    fairWarning: null,
    whatChanged: null,
    questionChoice: null,
    questionFeedback: null,
    completed: false,
    cardCollapsed: false,
    freeWalk: false,
    avatarNearRover: false
  };
}

export function initHarborWalk3D(container, state, onStateChange = () => {}) {
  let isDestroyed = false;
  let animFrameId = null;

  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9ee0ea);
  scene.fog = new THREE.Fog(0x9ee0ea, 45, 100);
  addHarborScenery(scene);

  // Camera setup
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 500;
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 120);

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Lighting
  const hemiLight = new THREE.HemisphereLight(0xfff8ee, 0x3d646b, 0.85);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfffae8, 1.35);
  sunLight.position.set(16, 26, 14);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 5;
  sunLight.shadow.camera.far = 60;
  sunLight.shadow.camera.left = -20;
  sunLight.shadow.camera.right = 20;
  sunLight.shadow.camera.top = 20;
  sunLight.shadow.camera.bottom = -20;
  sunLight.shadow.bias = -0.001;
  scene.add(sunLight);

  const ambientLight = new THREE.AmbientLight(0xa5d5e2, 0.4);
  scene.add(ambientLight);

  // -------------------------------------------------------------
  // World Elements
  // -------------------------------------------------------------

  // 1. Water Plane
  const waterGeo = new THREE.PlaneGeometry(140, 140, 32, 32);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x1f7b88,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.88
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = -0.55;
  scene.add(waterMesh);

  // 2. Wooden Dock Platform
  // Dock Bounds: X from -14 to +14 (28m), Z from -12 to +12 (24m). Top at Y = 0.
  const dockGeo = new THREE.BoxGeometry(28, 0.7, 24);
  const dockMat = new THREE.MeshStandardMaterial({
    color: 0xbd9f75,
    roughness: 0.85,
    metalness: 0.05
  });
  const dockMesh = new THREE.Mesh(dockGeo, dockMat);
  dockMesh.position.set(0, -0.35, 0);
  dockMesh.receiveShadow = true;
  scene.add(dockMesh);

  // Dock plank grooves / surface planks
  const plankGroup = new THREE.Group();
  const plankCount = 28;
  const plankMat = new THREE.MeshStandardMaterial({ color: 0xa88c63, roughness: 0.9 });
  for (let i = 0; i <= plankCount; i++) {
    const x = -14 + i * (28 / plankCount);
    const lineGeo = new THREE.BoxGeometry(0.04, 0.01, 23.9);
    const lineMesh = new THREE.Mesh(lineGeo, plankMat);
    lineMesh.position.set(x, 0.005, 0);
    plankGroup.add(lineMesh);
  }
  scene.add(plankGroup);

  // Dock Perimeter Edge Trim
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x8a6e46, roughness: 0.8 });
  const northEdge = new THREE.Mesh(new THREE.BoxGeometry(28.2, 0.25, 0.35), edgeMat);
  northEdge.position.set(0, 0.05, -12);
  const southEdge = new THREE.Mesh(new THREE.BoxGeometry(28.2, 0.25, 0.35), edgeMat);
  southEdge.position.set(0, 0.05, 12);
  const eastEdge = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 24), edgeMat);
  eastEdge.position.set(14, 0.05, 0);
  const westEdge = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 24), edgeMat);
  westEdge.position.set(-14, 0.05, 0);
  scene.add(northEdge, southEdge, eastEdge, westEdge);

  // Dock Pilings (Vertical round posts going into water)
  const pilingGeo = new THREE.CylinderGeometry(0.28, 0.32, 3.2, 10);
  const pilingMat = new THREE.MeshStandardMaterial({ color: 0x5a432d, roughness: 0.95 });
  const pilings = new THREE.Group();
  for (let x = -13.5; x <= 13.5; x += 3.8) {
    const p1 = new THREE.Mesh(pilingGeo, pilingMat);
    p1.position.set(x, -1.2, -12.1);
    const p2 = new THREE.Mesh(pilingGeo, pilingMat);
    p2.position.set(x, -1.2, 12.1);
    pilings.add(p1, p2);
  }
  for (let z = -10; z <= 10; z += 4) {
    const p3 = new THREE.Mesh(pilingGeo, pilingMat);
    p3.position.set(-14.1, -1.2, z);
    const p4 = new THREE.Mesh(pilingGeo, pilingMat);
    p4.position.set(14.1, -1.2, z);
    pilings.add(p3, p4);
  }
  scene.add(pilings);

  // Mooring Bollards along water edge
  const bollardGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.5, 8);
  const bollardMat = new THREE.MeshStandardMaterial({ color: 0x3d4b4f, metalness: 0.6, roughness: 0.4 });
  for (let x of [-11, -3, 5, 12]) {
    const b = new THREE.Mesh(bollardGeo, bollardMat);
    b.position.set(x, 0.25, -11.6);
    scene.add(b);
  }

  // 3. Harbor Lab Shed
  // Located at X: -8, Z: -6. Dimensions: W 6, D 5, H 3.6.
  const shedGroup = new THREE.Group();
  shedGroup.position.set(-8, 0, -6);

  // Shed Walls
  const shedWalls = new THREE.Mesh(
    new THREE.BoxGeometry(6, 3.4, 5),
    new THREE.MeshStandardMaterial({ color: 0x3d6466, roughness: 0.7 })
  );
  shedWalls.position.set(0, 1.7, 0);
  shedWalls.castShadow = true;
  shedWalls.receiveShadow = true;
  shedGroup.add(shedWalls);

  // Shed Pitched Roof
  const roofSlab1 = new THREE.Mesh(
    new THREE.BoxGeometry(6.6, 0.18, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x243d40, roughness: 0.8 })
  );
  roofSlab1.position.set(0, 3.95, -1.2);
  roofSlab1.rotation.x = 0.42;
  roofSlab1.castShadow = true;

  const roofSlab2 = new THREE.Mesh(
    new THREE.BoxGeometry(6.6, 0.18, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x243d40, roughness: 0.8 })
  );
  roofSlab2.position.set(0, 3.95, 1.2);
  roofSlab2.rotation.x = -0.42;
  roofSlab2.castShadow = true;
  shedGroup.add(roofSlab1, roofSlab2);

  // Shed Door (facing front +Z towards dock path)
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 2.4, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x966838, roughness: 0.7 })
  );
  door.position.set(0, 1.2, 2.52);
  const doorknob = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xdfb448, metalness: 0.8, roughness: 0.2 })
  );
  doorknob.position.set(0.48, 1.15, 2.6);
  shedGroup.add(door, doorknob);

  // Shed Windows
  const winMat = new THREE.MeshStandardMaterial({ color: 0xdff4f7, roughness: 0.2, metalness: 0.3 });
  const win1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.08), winMat);
  win1.position.set(-1.8, 1.8, 2.52);
  const win2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.08), winMat);
  win2.position.set(1.8, 1.8, 2.52);
  shedGroup.add(win1, win2);

  // Porch Lantern
  const lantern = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.45, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xf5df98, emissive: 0xf0cf60, emissiveIntensity: 0.4 })
  );
  lantern.position.set(1.1, 2.5, 2.65);
  shedGroup.add(lantern);

  scene.add(shedGroup);

  // 4. Path from Shed to Ramp
  // Boardwalk path curving/connecting from Shed door (-8, 0, -3.5) to Ramp area (-3, 0, 3.5)
  const pathMat = new THREE.MeshStandardMaterial({ color: 0xd0b487, roughness: 0.85 });
  const path1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.03, 4.5), pathMat);
  path1.position.set(-8, 0.015, -1.3);
  path1.receiveShadow = true;

  const path2 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.03, 2.2), pathMat);
  path2.position.set(-5.6, 0.015, 1.4);
  path2.receiveShadow = true;

  const path3 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.03, 2.6), pathMat);
  path3.position.set(-2.8, 0.015, 2.4);
  path3.receiveShadow = true;

  scene.add(path1, path2, path3);

  // 5. Cargo Crane
  // Located at X: 9, Z: -5 (by water)
  const craneGroup = new THREE.Group();
  craneGroup.position.set(9, 0, -5);

  // Crane base platform
  const craneBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.6, 2.8),
    new THREE.MeshStandardMaterial({ color: 0x5a6566, roughness: 0.9 })
  );
  craneBase.position.set(0, 0.3, 0);
  craneBase.castShadow = true;
  craneGroup.add(craneBase);

  // Crane vertical mast (tower)
  const mastMat = new THREE.MeshStandardMaterial({ color: 0xebb434, metalness: 0.2, roughness: 0.6 });
  const mast = new THREE.Mesh(new THREE.BoxGeometry(0.8, 9.5, 0.8), mastMat);
  mast.position.set(0, 5.0, 0);
  mast.castShadow = true;
  craneGroup.add(mast);

  // Crane operator cabin
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.5, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x364f52, roughness: 0.5 })
  );
  cabin.position.set(0.4, 7.5, 0);
  craneGroup.add(cabin);

  // Horizontal Jib Boom (out towards water, -Z direction)
  const jib = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 8.5), mastMat);
  jib.position.set(0, 9.8, -2.5);
  jib.castShadow = true;
  craneGroup.add(jib);

  // Counterweight (back side +Z)
  const counterweight = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.0, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x485254, roughness: 0.9 })
  );
  counterweight.position.set(0, 9.8, 2.4);
  counterweight.castShadow = true;
  craneGroup.add(counterweight);

  // Cable and Cargo Hook
  const cableMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4.2), cableMat);
  cable.position.set(0, 7.7, -5.2);
  craneGroup.add(cable);

  const hook = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.06, 8, 16, Math.PI * 1.5),
    new THREE.MeshStandardMaterial({ color: 0x242424, metalness: 0.8, roughness: 0.3 })
  );
  hook.position.set(0, 5.5, -5.2);
  craneGroup.add(hook);

  // Wooden Cargo Crate near crane
  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 1.4, 1.4),
    new THREE.MeshStandardMaterial({ color: 0xa47444, roughness: 0.85 })
  );
  crate.position.set(-1.8, 0.7, 1.2);
  crate.castShadow = true;
  craneGroup.add(crate);

  scene.add(craneGroup);

  // -------------------------------------------------------------
  // 6. Straight Ramp & Dock Stopping Lane
  // -------------------------------------------------------------
  // Direction: Straight along +X.
  // Ramp incline: starts at X = -3.8, finishes at X = 0.2 (transition to dock floor at Y = 0).
  // Stopping lane: runs from X = 0.2 to X = 11.2 (Z = 3.5).
  const rampGroup = new THREE.Group();
  rampGroup.position.set(0, 0, 3.5);

  // Ramp side wooden supports / truss
  const rampTrussMat = new THREE.MeshStandardMaterial({ color: 0x6e5233, roughness: 0.9 });
  const rampTrussLeft = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.8, 0.12), rampTrussMat);
  rampTrussLeft.position.set(-1.8, 0.4, -0.9);
  const rampTrussRight = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.8, 0.12), rampTrussMat);
  rampTrussRight.position.set(-1.8, 0.4, 0.9);
  rampGroup.add(rampTrussLeft, rampTrussRight);

  // Dynamic Incline Ramp Mesh
  // Plane width: 1.6m, length: ~4.1m
  const rampInclineGeo = new THREE.BoxGeometry(4.0, 0.08, 1.6);
  const rampInclineMat = new THREE.MeshStandardMaterial({ color: 0x9c7a4e, roughness: 0.8 });
  const rampInclineMesh = new THREE.Mesh(rampInclineGeo, rampInclineMat);
  rampInclineMesh.castShadow = true;
  rampInclineMesh.receiveShadow = true;
  rampGroup.add(rampInclineMesh);

  // Starting Platform at top of ramp
  const startPlatform = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.08, 1.8),
    new THREE.MeshStandardMaterial({ color: 0x82643c, roughness: 0.85 })
  );
  startPlatform.castShadow = true;
  rampGroup.add(startPlatform);

  // Stopping Lane Mesh on dock (from X = 0.2 to X = 11.2)
  const laneGeo = new THREE.BoxGeometry(11.0, 0.02, 1.7);
  const laneMat = new THREE.MeshStandardMaterial({
    color: DOCK_SURFACES[state.surface]?.color || DOCK_SURFACES.smooth.color,
    roughness: 0.85
  });
  const laneMesh = new THREE.Mesh(laneGeo, laneMat);
  laneMesh.position.set(5.7, 0.01, 0);
  laneMesh.receiveShadow = true;
  rampGroup.add(laneMesh);

  // Distance Markers along stopping lane (0.5m, 1.0m, 1.5m, 2.0m, 2.5m)
  // Visual scale: 1 science meter = 3.6 3D world units along X.
  // X = 0.2 + (distance * 3.6).
  const markerGroup = new THREE.Group();
  const meterScale = 3.6; // 3.6 units in 3D world = 1.0 m in science model
  const markerPostGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8);
  const markerPostMat = new THREE.MeshStandardMaterial({ color: 0x485f61, metalness: 0.3 });
  const markerFlagGeo = new THREE.BoxGeometry(0.24, 0.16, 0.02);

  const markerDistances = [0.5, 1.0, 1.5, 2.0, 2.5];
  for (const m of markerDistances) {
    const mx = 0.2 + m * meterScale;

    // Measurement stripe across the lane
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.03, 1.6),
      new THREE.MeshBasicMaterial({ color: m === 1.0 || m === 1.5 || m === 2.0 ? 0xfff0aa : 0xd8e8e3 })
    );
    stripe.position.set(mx, 0.02, 0);
    markerGroup.add(stripe);

    // Side measurement post & flag
    const post = new THREE.Mesh(markerPostGeo, markerPostMat);
    post.position.set(mx, 0.25, 1.0);

    const flagColor = m === 1.0 ? 0x4caf50 : m === 1.5 ? 0x2196f3 : m === 2.0 ? 0xff9800 : 0x7e9e99;
    const flag = new THREE.Mesh(markerFlagGeo, new THREE.MeshStandardMaterial({ color: flagColor }));
    flag.position.set(mx + 0.12, 0.42, 1.0);

    markerGroup.add(post, flag);
  }
  rampGroup.add(markerGroup);

  scene.add(rampGroup);

  // -------------------------------------------------------------
  // 7. Science Rover
  // -------------------------------------------------------------
  const roverGroup = new THREE.Group();

  // Chassis Body
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0xebb234, metalness: 0.3, roughness: 0.5 });
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.32, 0.65), chassisMat);
  chassis.position.set(0, 0.28, 0);
  chassis.castShadow = true;
  roverGroup.add(chassis);

  // Cockpit / Sensor Glass
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.2, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x21545e, roughness: 0.2, metalness: 0.4 })
  );
  glass.position.set(0.2, 0.42, 0);
  roverGroup.add(glass);

  // Solar Panel on top
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.04, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x1b374d, metalness: 0.7, roughness: 0.3 })
  );
  panel.position.set(-0.2, 0.46, 0);
  roverGroup.add(panel);

  // Sensor Mast & Head
  const mastPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x88989e })
  );
  mastPole.position.set(0.3, 0.6, 0.2);
  const camHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.08, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x3d4b52 })
  );
  camHead.position.set(0.3, 0.8, 0.2);
  roverGroup.add(mastPole, camHead);

  // 4 Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.14, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
  const hubMat = new THREE.MeshStandardMaterial({ color: 0xdde6e8, metalness: 0.8, roughness: 0.2 });

  const wheels = [];
  const wheelPositions = [
    [0.32, 0.18, 0.38],
    [0.32, 0.18, -0.38],
    [-0.32, 0.18, 0.38],
    [-0.32, 0.18, -0.38]
  ];

  for (const [wx, wy, wz] of wheelPositions) {
    const wGroup = new THREE.Group();
    wGroup.position.set(wx, wy, wz);

    const tire = new THREE.Mesh(wheelGeo, wheelMat);
    tire.castShadow = true;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8), hubMat);
    hub.rotateZ(Math.PI / 2);

    wGroup.add(tire, hub);
    roverGroup.add(wGroup);
    wheels.push(wGroup);
  }

  scene.add(roverGroup);

  // -------------------------------------------------------------
  // 8. Kid Scientist Avatar (Blocky, readable, school clothes)
  // -------------------------------------------------------------
  const avatarGroup = new THREE.Group();
  avatarGroup.position.set(-4, 0, 7); // Open dock: rover ahead, scenery visible.

  // Torso (School sweater over collared shirt)
  const sweaterMat = new THREE.MeshStandardMaterial({ color: 0x20455e, roughness: 0.8 }); // Navy sweater
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.54, 0.32), sweaterMat);
  torso.position.set(0, 0.78, 0);
  torso.castShadow = true;
  avatarGroup.add(torso);

  // White Shirt Collar
  const collar = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.08, 0.33),
    new THREE.MeshStandardMaterial({ color: 0xf5f8f9, roughness: 0.9 })
  );
  collar.position.set(0, 1.04, 0);
  avatarGroup.add(collar);

  // Head (Cute, blocky kid scientist head)
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd6996e, roughness: 0.8 });
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.4), skinMat);
  head.position.set(0, 1.28, 0);
  head.castShadow = true;
  avatarGroup.add(head);

  // Stylized Hair Cap
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x2b1e17, roughness: 0.9 });
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.2, 0.44), hairMat);
  hair.position.set(0, 1.45, -0.02);
  avatarGroup.add(hair);

  // Science Goggles / Stylized Friendly Eyes (Non-realistic, readable silhouette)
  const goggleFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.12, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x1f3438, roughness: 0.4 })
  );
  goggleFrame.position.set(0, 1.3, 0.22);
  const lensLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.08, 0.09),
    new THREE.MeshStandardMaterial({ color: 0x58d6c8, emissive: 0x2da89b, emissiveIntensity: 0.3 })
  );
  lensLeft.position.set(-0.09, 1.3, 0.22);
  const lensRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.08, 0.09),
    new THREE.MeshStandardMaterial({ color: 0x58d6c8, emissive: 0x2da89b, emissiveIntensity: 0.3 })
  );
  lensRight.position.set(0.09, 1.3, 0.22);
  avatarGroup.add(goggleFrame, lensLeft, lensRight);

  // Limbs with Hip/Shoulder Pivots for Walking Animation
  const armMat = new THREE.MeshStandardMaterial({ color: 0x20455e, roughness: 0.8 });
  const handMat = skinMat;
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0xb89f78, roughness: 0.85 }); // Khakis
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x3d281a, roughness: 0.7 });

  // Left Arm Pivot
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.31, 0.98, 0);
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.14), armMat);
  leftArm.position.set(0, -0.21, 0);
  leftArm.castShadow = true;
  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.12), handMat);
  leftHand.position.set(0, -0.44, 0);
  leftArmPivot.add(leftArm, leftHand);
  avatarGroup.add(leftArmPivot);

  // Right Arm Pivot
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.31, 0.98, 0);
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.14), armMat);
  rightArm.position.set(0, -0.21, 0);
  rightArm.castShadow = true;
  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.12), handMat);
  rightHand.position.set(0, -0.44, 0);
  rightArmPivot.add(rightArm, rightHand);
  avatarGroup.add(rightArmPivot);

  // Left Leg Pivot
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.14, 0.51, 0);
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.16), pantsMat);
  leftLeg.position.set(0, -0.22, 0);
  leftLeg.castShadow = true;
  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.1, 0.22), shoeMat);
  leftShoe.position.set(0, -0.46, 0.03);
  leftLegPivot.add(leftLeg, leftShoe);
  avatarGroup.add(leftLegPivot);

  // Right Leg Pivot
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.14, 0.51, 0);
  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.16), pantsMat);
  rightLeg.position.set(0, -0.22, 0);
  rightLeg.castShadow = true;
  const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.1, 0.22), shoeMat);
  rightShoe.position.set(0, -0.46, 0.03);
  rightLegPivot.add(rightLeg, rightShoe);
  avatarGroup.add(rightLegPivot);

  scene.add(avatarGroup);

  // Celebratory particles group
  const confettiGroup = new THREE.Group();
  scene.add(confettiGroup);

  // -------------------------------------------------------------
  // Ramp Height & Surface Updater
  // -------------------------------------------------------------
  function updateRampVisuals(h, surf) {
    // 3D height scale: 1 science metre height = 4.0 3D world units
    const visualH = Math.max(0.4, h * 4.0);
    const startX = -3.8;
    const endX = 0.2;
    const rampLength = endX - startX; // 4.0

    // Adjust incline slab
    const angle = Math.atan2(visualH, rampLength);
    rampInclineMesh.position.set(startX + rampLength / 2, visualH / 2, 0);
    rampInclineMesh.rotation.z = -angle;

    // Adjust starting platform
    startPlatform.position.set(startX - 0.6, visualH, 0);

    // Adjust truss
    rampTrussLeft.scale.y = visualH / 0.8;
    rampTrussLeft.position.y = visualH / 2;
    rampTrussRight.scale.y = visualH / 0.8;
    rampTrussRight.position.y = visualH / 2;

    // Adjust lane surface
    laneMat.color.setHex(DOCK_SURFACES[surf]?.color || DOCK_SURFACES.smooth.color);

    // Place rover at top of ramp if not currently rolling
    if (!state.isRolling) {
      roverGroup.position.set(startX - 0.4, visualH + 0.05, 3.5);
      roverGroup.rotation.set(0, 0, -angle * 0.7);
    }
  }

  updateRampVisuals(state.height, state.surface);

  // -------------------------------------------------------------
  // Input & Third-Person Camera Controls
  // -------------------------------------------------------------
  const keys = { forward: false, backward: false, left: false, right: false };
  let isDragging = false;
  let prevMouseX = 0;
  let prevMouseY = 0;
  const guardCamera = cameraObstructionGuard([shedGroup, craneGroup]);
  let cameraYaw = Math.PI * 0.75; // Horizontal orbit angle
  let cameraPitch = 0.42;       // Vertical orbit angle (radians above ground)
  const cameraDistance = 8;
  // Start above the dock, not inside the scenery while the first frames converge.
  camera.position.set(
    avatarGroup.position.x - Math.sin(cameraYaw) * Math.cos(cameraPitch) * cameraDistance,
    avatarGroup.position.y + 1.2 + Math.sin(cameraPitch) * cameraDistance,
    avatarGroup.position.z - Math.cos(cameraYaw) * Math.cos(cameraPitch) * cameraDistance
  );
  camera.lookAt(avatarGroup.position.x, avatarGroup.position.y + 1.1, avatarGroup.position.z);

  function onKeyDown(e) {
    if (e.target?.closest?.('input,textarea,select,button,[contenteditable="true"]')) return;
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') keys.forward = true;
    if (k === 's' || k === 'arrowdown') keys.backward = true;
    if (k === 'a' || k === 'arrowleft') keys.left = true;
    if (k === 'd' || k === 'arrowright') keys.right = true;
  }

  function onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') keys.forward = false;
    if (k === 's' || k === 'arrowdown') keys.backward = false;
    if (k === 'a' || k === 'arrowleft') keys.left = false;
    if (k === 'd' || k === 'arrowright') keys.right = false;
  }

  const canvas = renderer.domElement;
  function onMouseDown(e) {
    isDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  }
  function onMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - prevMouseX;
    const dy = e.clientY - prevMouseY;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;

    cameraYaw -= dx * 0.007;
    cameraPitch = Math.max(0.22, Math.min(0.72, cameraPitch + dy * 0.006));
  }
  function onMouseUp() {
    isDragging = false;
  }

  // Multi-Touch Camera Orbit Support
  let touchCameraId = null;
  let prevTouchX = 0;
  let prevTouchY = 0;

  function onTouchStart(e) {
    if (touchCameraId === null && e.changedTouches.length > 0) {
      const t = e.changedTouches[0];
      touchCameraId = t.identifier;
      prevTouchX = t.clientX;
      prevTouchY = t.clientY;
      if (e.cancelable) e.preventDefault();
    }
  }

  function onTouchMove(e) {
    if (touchCameraId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchCameraId) {
        if (e.cancelable) e.preventDefault();
        const dx = t.clientX - prevTouchX;
        const dy = t.clientY - prevTouchY;
        prevTouchX = t.clientX;
        prevTouchY = t.clientY;

        cameraYaw -= dx * 0.007;
        cameraPitch = Math.max(0.22, Math.min(0.72, cameraPitch + dy * 0.006));
        break;
      }
    }
  }

  function onTouchEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchCameraId) {
        touchCameraId = null;
        break;
      }
    }
  }

  function onTouchCancel(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchCameraId) {
        touchCameraId = null;
        break;
      }
    }
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd);
  window.addEventListener('touchcancel', onTouchCancel);

  // -------------------------------------------------------------
  // Collision Detection
  // -------------------------------------------------------------
  // Dock Bounds: feet must stay on the dock, no falling into water!
  const DOCK_MIN_X = -13.2;
  const DOCK_MAX_X = 13.2;
  const DOCK_MIN_Z = -11.2;
  const DOCK_MAX_Z = 11.2;

  // Obstacle AABB boxes [minX, maxX, minZ, maxZ]
  const OBSTACLES = [
    [-11.2, -4.8, -8.8, -3.4], // Harbor Lab Shed
    [7.4, 10.6, -6.6, -3.4],   // Cargo Crane Base
    [-4.6, 0.4, 2.3, 4.7]      // Ramp structure
  ];

  function checkCollision(x, z) {
    // Dock perimeter check
    if (x < DOCK_MIN_X || x > DOCK_MAX_X || z < DOCK_MIN_Z || z > DOCK_MAX_Z) {
      return true;
    }
    // Obstacle check with avatar radius (0.35m)
    const r = 0.35;
    for (const [minX, maxX, minZ, maxZ] of OBSTACLES) {
      if (x + r > minX && x - r < maxX && z + r > minZ && z - r < maxZ) {
        return true;
      }
    }
    return false;
  }

  // -------------------------------------------------------------
  // Rover Roll Animation
  // -------------------------------------------------------------
  let rollAnim = null; // { startTime, duration, startX, visualH, distanceM, callback }

  function triggerRoverRoll(distM, onComplete = () => {}) {
    state.isRolling = true;
    const visualH = Math.max(0.4, state.height * 4.0);
    const startX = -3.8 - 0.4;
    const exitX = 0.2;
    const targetX = exitX + distM * meterScale;
    const rampDist = exitX - startX;
    const flatDist = targetX - exitX;

    // Physical acceleration down incline:
    // v_bottom = sqrt(2 * g * h)
    // t_ramp ~ 1.2s, t_flat ~ 1.5s
    const totalDuration = 2800; // ms

    rollAnim = {
      startTime: performance.now(),
      duration: totalDuration,
      startX,
      exitX,
      targetX,
      visualH,
      distM,
      onComplete
    };
  }

  // -------------------------------------------------------------
  // Celebration Confetti
  // -------------------------------------------------------------
  const confettiParticles = [];
  function launchCelebration() {
    const colors = [0xf1c40f, 0x2ecc71, 0x3498db, 0xe74c3c, 0x9b59b6, 0xffffff];
    const confGeo = new THREE.PlaneGeometry(0.18, 0.18);
    for (let i = 0; i < 90; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        side: THREE.DoubleSide
      });
      const p = new THREE.Mesh(confGeo, mat);
      p.position.set(
        avatarGroup.position.x + (Math.random() - 0.5) * 6,
        1.5 + Math.random() * 4,
        avatarGroup.position.z + (Math.random() - 0.5) * 6
      );
      p.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        2.5 + Math.random() * 3,
        (Math.random() - 0.5) * 3
      );
      p.rotSpeed = new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      confettiParticles.push(p);
      confettiGroup.add(p);
    }
  }

  // -------------------------------------------------------------
  // Main Animation Loop
  // -------------------------------------------------------------
  let lastTime = performance.now();
  let walkCycle = 0;

  function tick(now) {
    if (isDestroyed) return;
    const delta = Math.min(0.06, (now - lastTime) / 1000);
    lastTime = now;

    // 1. Water animation
    waterMesh.position.y = -0.55 + Math.sin(now * 0.0015) * 0.04;

    // 2. Avatar Movement (WASD / Arrows)
    let moveX = 0;
    let moveZ = 0;

    // Camera facing ground vectors
    const offsetX = camera.position.x - avatarGroup.position.x;
    const offsetZ = camera.position.z - avatarGroup.position.z;
    const forward = walkDirection(offsetX, offsetZ, 0, 1);
    const right = walkDirection(offsetX, offsetZ, 1, 0);
    const forwardX = forward.x, forwardZ = forward.z;
    const rightX = right.x, rightZ = right.z;

    if (keys.forward) {
      moveX += forwardX;
      moveZ += forwardZ;
    }
    if (keys.backward) {
      moveX -= forwardX;
      moveZ -= forwardZ;
    }
    if (keys.left) {
      moveX -= rightX;
      moveZ -= rightZ;
    }
    if (keys.right) {
      moveX += rightX;
      moveZ += rightZ;
    }

    const moveLen = Math.hypot(moveX, moveZ);
    const isMoving = moveLen > 0.01;

    if (isMoving) {
      moveX /= moveLen;
      moveZ /= moveLen;
      const speed = 4.2; // metres per second
      const targetAngle = Math.atan2(moveX, moveZ);

      // Smooth avatar rotation
      let diff = targetAngle - avatarGroup.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      avatarGroup.rotation.y += diff * Math.min(1, delta * 12);

      // Collision checks with sliding
      const nextX = avatarGroup.position.x + moveX * speed * delta;
      const nextZ = avatarGroup.position.z + moveZ * speed * delta;

      if (!checkCollision(nextX, avatarGroup.position.z)) {
        avatarGroup.position.x = nextX;
      }
      if (!checkCollision(avatarGroup.position.x, nextZ)) {
        avatarGroup.position.z = nextZ;
      }

      // Procedural walking animation
      walkCycle += delta * 12;
      leftLegPivot.rotation.x = Math.sin(walkCycle) * 0.65;
      rightLegPivot.rotation.x = -Math.sin(walkCycle) * 0.65;
      leftArmPivot.rotation.x = -Math.sin(walkCycle) * 0.55;
      rightArmPivot.rotation.x = Math.sin(walkCycle) * 0.55;
      torso.position.y = 0.78 + Math.abs(Math.sin(walkCycle * 2)) * 0.03;
    } else {
      // Idle pose lerp
      leftLegPivot.rotation.x *= Math.max(0, 1 - delta * 10);
      rightLegPivot.rotation.x *= Math.max(0, 1 - delta * 10);
      leftArmPivot.rotation.x *= Math.max(0, 1 - delta * 10);
      rightArmPivot.rotation.x *= Math.max(0, 1 - delta * 10);
      torso.position.y = 0.78;
    }

    // 3. Proximity Check: Walk to Rover (Step 1)
    const roverPos = new THREE.Vector3(-3.5, 0, 3.5);
    const distToRover = avatarGroup.position.distanceTo(roverPos);
    const nearRover = distToRover < 3.8;

    if (nearRover !== state.avatarNearRover) {
      state.avatarNearRover = nearRover;
      if (state.step === 1 && nearRover) {
        state.step = 2; // Advanced to Step 2!
        onStateChange(state);
      }
    }

    // 4. Rover Physics Roll Animation
    if (rollAnim) {
      const elapsed = now - rollAnim.startTime;
      const progress = Math.min(1, elapsed / rollAnim.duration);

      // Phase 1: Ramp incline (0 to 0.45)
      // Phase 2: Decelerating flat dock lane (0.45 to 1.0)
      if (progress < 0.45) {
        const rampT = progress / 0.45;
        const rampEase = rampT * rampT; // accelerating down
        const rx = rollAnim.startX + (rollAnim.exitX - rollAnim.startX) * rampEase;
        const ry = rollAnim.visualH * (1 - rampEase) + 0.05;
        const angle = -Math.atan2(rollAnim.visualH, rollAnim.exitX - rollAnim.startX) * (1 - rampEase * 0.5);

        roverGroup.position.set(rx, ry, 3.5);
        roverGroup.rotation.set(0, 0, angle);

        // Spin wheels
        const wheelRot = rx * 4.5;
        for (const w of wheels) w.rotation.x = wheelRot;
      } else {
        const flatT = (progress - 0.45) / 0.55;
        // Ease out quadratic deceleration: 1 - (1 - t)^2
        const flatEase = 1 - Math.pow(1 - flatT, 2);
        const rx = rollAnim.exitX + (rollAnim.targetX - rollAnim.exitX) * flatEase;

        roverGroup.position.set(rx, 0.05, 3.5);
        roverGroup.rotation.set(0, 0, 0);

        // Spin wheels
        const wheelRot = rx * 4.5;
        for (const w of wheels) w.rotation.x = wheelRot;
      }

      if (progress >= 1) {
        const cb = rollAnim.onComplete;
        rollAnim = null;
        state.isRolling = false;
        cb();
      }
    }

    // 5. Confetti animation
    for (let i = confettiParticles.length - 1; i >= 0; i--) {
      const p = confettiParticles[i];
      p.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= 5.0 * delta; // gravity
      p.rotation.x += p.rotSpeed.x * delta;
      p.rotation.y += p.rotSpeed.y * delta;
      if (p.position.y < 0.05) {
        p.position.y = 0.05;
        p.velocity.set(0, 0, 0);
      }
    }

    // 6. Camera Follow (Smooth third person trailing)
    const targetCamX = avatarGroup.position.x - Math.sin(cameraYaw) * Math.cos(cameraPitch) * cameraDistance;
    const targetCamY = avatarGroup.position.y + 1.2 + Math.sin(cameraPitch) * cameraDistance;
    const targetCamZ = avatarGroup.position.z - Math.cos(cameraYaw) * Math.cos(cameraPitch) * cameraDistance;

    camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), delta * 8);
    guardCamera(camera, avatarGroup.position);
    camera.lookAt(avatarGroup.position.x, avatarGroup.position.y + 1.4, avatarGroup.position.z);

    renderer.render(scene, camera);
    animFrameId = requestAnimationFrame(tick);
  }

  animFrameId = requestAnimationFrame(tick);

  function resize() {
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 500;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener('resize', resize);

  // Return Controller API
  return {
    destroy() {
      isDestroyed = true;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
    setRampHeight(h) {
      state.height = h;
      updateRampVisuals(state.height, state.surface);
    },
    setSurface(surf) {
      state.surface = surf;
      updateRampVisuals(state.height, state.surface);
    },
    rollRover(distM, onDone) {
      triggerRoverRoll(distM, onDone);
    },
    resetRover() {
      updateRampVisuals(state.height, state.surface);
    },
    celebrate() {
      launchCelebration();
    },
    setKey(dir, pressed) {
      if (dir in keys) keys[dir] = !!pressed;
    },
    teleportToRover() {
      avatarGroup.position.set(-3.5, 0, 1.2);
      avatarGroup.rotation.y = 0;
    },
    resetCamera() {
      cameraYaw = Math.PI * 0.75;
      cameraPitch = 0.42;
    },
    lookAtRover() {
      const dx = -0.4 - avatarGroup.position.x;
      const dz = 3.5 - avatarGroup.position.z;
      cameraYaw = Math.atan2(dx, dz);
      cameraPitch = 0.38;
    },
    resize,
    getState() {
      return state;
    }
  };
}
