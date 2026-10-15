import * as THREE from './vendor/three.module.js';
import {walkDirection} from './walk-direction.js';
import {addHarborScenery, cameraObstructionGuard} from './harbor-scenery.js';
import {ADVENTURE_CONFIGS} from './adventures-3d-data.js';

export function initAdventure3D(container, regionId, state, onStateChange = () => {}) {
  let isDestroyed = false;
  let animFrameId = null;

  const config = ADVENTURE_CONFIGS[regionId] || ADVENTURE_CONFIGS.motion;

  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(config.skyColor);
  scene.fog = new THREE.Fog(config.fogColor, 30, 85);

  // Sizing
  const getWidth = () => container.clientWidth || window.innerWidth || 800;
  const getHeight = () => container.clientHeight || window.innerHeight || 500;
  let width = getWidth();
  let height = getHeight();

  // Camera
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 160);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Lighting
  const hemiLight = new THREE.HemisphereLight(0xfff8ee, config.groundColor, 0.85);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfffae8, 1.35);
  sunLight.position.set(18, 28, 16);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 5;
  sunLight.shadow.camera.far = 70;
  sunLight.shadow.camera.left = -22;
  sunLight.shadow.camera.right = 22;
  sunLight.shadow.camera.top = 22;
  sunLight.shadow.camera.bottom = -22;
  sunLight.shadow.bias = -0.001;
  scene.add(sunLight);

  const ambientLight = new THREE.AmbientLight(0xd0e8ed, 0.45);
  scene.add(ambientLight);

  // -------------------------------------------------------------
  // Blocky Kid Scientist Avatar
  // -------------------------------------------------------------
  const avatar = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.7 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.9 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x226b80, roughness: 0.8 }); // School teal sweater
  const collarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x36454f, roughness: 0.8 }); // Slate pants
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const glassesMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });

  // Pelvis / Hips
  const hips = new THREE.Group();
  hips.position.y = 0.65;
  avatar.add(hips);

  // Torso
  const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.26), shirtMat);
  torsoMesh.position.y = 0.32;
  torsoMesh.castShadow = true;
  hips.add(torsoMesh);

  // Collar
  const collarMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.28), collarMat);
  collarMesh.position.set(0, 0.56, 0);
  hips.add(collarMesh);

  // Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.76, 0);
  hips.add(headGroup);

  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), skinMat);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Hair
  const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.36), hairMat);
  hairMesh.position.y = 0.16;
  headGroup.add(hairMesh);

  // Glasses
  const glassesFrame = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.04), glassesMat);
  glassesFrame.position.set(0, 0.02, 0.17);
  headGroup.add(glassesFrame);

  // Limbs
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.28, 0.52, 0);
  const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.44, 0.14), shirtMat);
  leftArmMesh.position.y = -0.18;
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);
  hips.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.28, 0.52, 0);
  const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.44, 0.14), shirtMat);
  rightArmMesh.position.y = -0.18;
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);
  hips.add(rightArm);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.13, 0.06, 0);
  const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.48, 0.16), pantsMat);
  leftLegMesh.position.y = -0.24;
  leftLegMesh.castShadow = true;
  leftLeg.add(leftLegMesh);
  const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.24), shoeMat);
  leftShoe.position.set(0, -0.48, 0.03);
  leftShoe.castShadow = true;
  leftLeg.add(leftShoe);
  hips.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.13, 0.06, 0);
  const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.48, 0.16), pantsMat);
  rightLegMesh.position.y = -0.24;
  rightLegMesh.castShadow = true;
  rightLeg.add(rightLegMesh);
  const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.24), shoeMat);
  rightShoe.position.set(0, -0.48, 0.03);
  rightShoe.castShadow = true;
  rightLeg.add(rightShoe);
  hips.add(rightLeg);

  // Position avatar at spawn
  avatar.position.set(0, 0, 7.5);
  scene.add(avatar);

  // -------------------------------------------------------------
  // World Environment Builders
  // -------------------------------------------------------------
  const cameraObstacles = [];
  const guardCamera = cameraObstructionGuard(cameraObstacles);
  let worldTargetPos = new THREE.Vector3(0, 0, -2.5);
  let interactiveAnimObjects = {};

  if (regionId === 'motion') {
    addHarborScenery(scene);
    scene.fog = new THREE.Fog(config.fogColor, 45, 100);
    // 1. Water
    const waterMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      new THREE.MeshStandardMaterial({ color: 0x1f7b88, roughness: 0.15, transparent: true, opacity: 0.88 })
    );
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -0.55;
    scene.add(waterMesh);

    // 2. Dock Platform
    const dockMesh = new THREE.Mesh(
      new THREE.BoxGeometry(26, 0.7, 24),
      new THREE.MeshStandardMaterial({ color: 0xbd9f75, roughness: 0.85 })
    );
    dockMesh.position.set(0, -0.35, 0);
    dockMesh.receiveShadow = true;
    scene.add(dockMesh);

    // Dock Planks
    for (let i = -12; i <= 12; i += 1.5) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.01, 23.8),
        new THREE.MeshStandardMaterial({ color: 0x9e835b, roughness: 0.9 })
      );
      p.position.set(i, 0.005, 0);
      scene.add(p);
    }

    // 3. Harbor Lab Shed
    const shed = new THREE.Group();
    shed.position.set(-8.5, 0, 5.0);
    const shedWalls = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.2, 4.4), new THREE.MeshStandardMaterial({ color: 0x3d6b73, roughness: 0.8 }));
    shedWalls.position.y = 1.6;
    shedWalls.castShadow = true;
    shed.add(shedWalls);
    const shedRoof = new THREE.Mesh(new THREE.ConeGeometry(4.0, 1.4, 4), new THREE.MeshStandardMaterial({ color: 0xbf533b, roughness: 0.6 }));
    shedRoof.position.y = 3.9;
    shedRoof.rotation.y = Math.PI / 4;
    shed.add(shedRoof);
    scene.add(shed);
    cameraObstacles.push(shed);

    // 4. Cargo Crane
    const crane = new THREE.Group();
    crane.position.set(8.5, 0, -4.5);
    const cranePillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6.5, 0.8), new THREE.MeshStandardMaterial({ color: 0xe5a93b, roughness: 0.5 }));
    cranePillar.position.y = 3.25;
    cranePillar.castShadow = true;
    crane.add(cranePillar);
    const craneJib = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 5.5), new THREE.MeshStandardMaterial({ color: 0xe5a93b, roughness: 0.5 }));
    craneJib.position.set(0, 6.2, -1.2);
    crane.add(craneJib);
    scene.add(crane);

    // 5. Straight Ramp & Rover
    const rampGroup = new THREE.Group();
    rampGroup.position.set(0, 0, -4.0);
    const rampPlane = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 3.2), new THREE.MeshStandardMaterial({ color: 0x8a9ba8, roughness: 0.6 }));
    rampPlane.position.set(0, 0.45, -1.2);
    rampPlane.rotation.x = 0.26;
    rampPlane.castShadow = true;
    rampGroup.add(rampPlane);
    scene.add(rampGroup);

    // Surface Mat
    const matMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 8.5), new THREE.MeshStandardMaterial({ color: 0xc4a375, roughness: 0.8 }));
    matMesh.rotation.x = -Math.PI / 2;
    matMesh.position.set(0, 0.01, 1.5);
    matMesh.receiveShadow = true;
    scene.add(matMesh);

    // Science Rover
    const rover = new THREE.Group();
    rover.position.set(0, 0.22, -2.5);
    const roverBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.32, 1.1), new THREE.MeshStandardMaterial({ color: 0xeb7a34, roughness: 0.5 }));
    roverBody.castShadow = true;
    rover.add(roverBody);
    for (const [wx, wz] of [[-0.4, -0.35], [0.4, -0.35], [-0.4, 0.35], [0.4, 0.35]]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0x222222 }));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, -0.06, wz);
      rover.add(wheel);
    }
    scene.add(rover);

    worldTargetPos.set(0, 0, -2.5);
    interactiveAnimObjects.rover = rover;
    interactiveAnimObjects.matMesh = matMesh;
    interactiveAnimObjects.rampPlane = rampPlane;

  } else if (regionId === 'matter') {
    // Matter Workshop Interior
    // Stone floor
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(26, 0.6, 24),
      new THREE.MeshStandardMaterial({ color: 0x5a5464, roughness: 0.6, metalness: 0.1 })
    );
    floor.position.set(0, -0.3, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // Workshop Back Walls
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(26, 8, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x3d3947, roughness: 0.9 })
    );
    backWall.position.set(0, 3.7, -12);
    scene.add(backWall);

    // Arched Windows on back wall
    for (let x = -8; x <= 8; x += 8) {
      const win = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 4.2, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x7eb0d5, roughness: 0.1, transparent: true, opacity: 0.7 })
      );
      win.position.set(x, 4.5, -11.5);
      scene.add(win);
    }

    // Shelves and Storage Racks
    const rack = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 4.0, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x705238, roughness: 0.8 })
    );
    rack.position.set(-8.5, 2.0, -8.0);
    scene.add(rack);

    // Central Chemistry Bench
    const bench = new THREE.Group();
    bench.position.set(0, 0, -3.0);
    const benchTop = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.18, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x22262b, roughness: 0.3, metalness: 0.4 })
    );
    benchTop.position.y = 1.0;
    benchTop.castShadow = true;
    bench.add(benchTop);

    const benchLegs = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 0.9, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x524b5e, roughness: 0.7 })
    );
    benchLegs.position.y = 0.45;
    bench.add(benchLegs);

    // Digital Precision Scale on Bench
    const scaleBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.12, 1.0),
      new THREE.MeshStandardMaterial({ color: 0xd9dfe2, roughness: 0.4, metalness: 0.5 })
    );
    scaleBase.position.set(0, 1.15, 0);
    scaleBase.castShadow = true;
    bench.add(scaleBase);

    // Reaction Flask
    const flask = new THREE.Group();
    flask.position.set(0, 1.25, 0);
    const flaskGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.35, 0.5, 16),
      new THREE.MeshStandardMaterial({ color: 0x90e0ef, transparent: true, opacity: 0.65, roughness: 0.1 })
    );
    flaskGlass.position.y = 0.25;
    flask.add(flaskGlass);

    // Liquid in Flask
    const flaskLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.33, 0.24, 16),
      new THREE.MeshStandardMaterial({ color: 0x38b000, roughness: 0.2, transparent: true, opacity: 0.85 })
    );
    flaskLiquid.position.y = 0.14;
    flask.add(flaskLiquid);

    // Flask Stopper (Rubber Cork)
    const stopper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.1, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0x6c4228, roughness: 0.8 })
    );
    stopper.position.y = 0.54;
    flask.add(stopper);

    bench.add(flask);
    scene.add(bench);

    worldTargetPos.set(0, 0, -3.0);
    interactiveAnimObjects.flask = flask;
    interactiveAnimObjects.stopper = stopper;
    interactiveAnimObjects.flaskLiquid = flaskLiquid;

  } else if (regionId === 'living') {
    // Living Valley Biodome
    // Grass Ground
    const grass = new THREE.Mesh(
      new THREE.CylinderGeometry(15, 15, 0.6, 32),
      new THREE.MeshStandardMaterial({ color: 0x487a55, roughness: 0.9 })
    );
    grass.position.set(0, -0.3, 0);
    grass.receiveShadow = true;
    scene.add(grass);

    // Geodesic Glass Biodome Canopy
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(14, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
      new THREE.MeshStandardMaterial({
        color: 0xc8f0d8,
        wireframe: true,
        transparent: true,
        opacity: 0.4
      })
    );
    dome.position.y = -0.1;
    scene.add(dome);

    // Wooden Planter Beds
    const beds = new THREE.Group();
    beds.position.set(0, 0, -3.0);

    const bedBox = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 0.5, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.9 })
    );
    bedBox.position.y = 0.25;
    bedBox.castShadow = true;
    beds.add(bedBox);

    const bedSoil = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.05, 2.1),
      new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.95 })
    );
    bedSoil.position.y = 0.51;
    beds.add(bedSoil);

    // Growing Plants
    const plantsGroup = new THREE.Group();
    plantsGroup.position.set(0, 0.52, 0);
    for (let px = -1.6; px <= 1.6; px += 0.8) {
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x40916c })
      );
      stem.position.set(px, 0.2, 0);
      const leaf1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x52b788 })
      );
      leaf1.scale.set(1.5, 0.4, 1);
      leaf1.position.set(px + 0.1, 0.38, 0);
      plantsGroup.add(stem);
      plantsGroup.add(leaf1);
    }
    beds.add(plantsGroup);

    // Overhead Solar Sunlamp Gantry
    const gantry = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.2, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x3d405b, metalness: 0.5 })
    );
    gantry.position.set(0, 2.6, 0);
    beds.add(gantry);

    const lampBulb = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.15, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xffea00, emissive: 0xffea00, emissiveIntensity: 0.6 })
    );
    lampBulb.position.set(0, 2.45, 0);
    beds.add(lampBulb);

    scene.add(beds);

    worldTargetPos.set(0, 0, -3.0);
    interactiveAnimObjects.plantsGroup = plantsGroup;
    interactiveAnimObjects.lampBulb = lampBulb;

  } else if (regionId === 'earth') {
    // Earthwatch Ridge Overlook
    // Mountain Rock Terrain
    const terrain = new THREE.Mesh(
      new THREE.BoxGeometry(26, 0.6, 24),
      new THREE.MeshStandardMaterial({ color: 0x6e523f, roughness: 0.95 })
    );
    terrain.position.set(0, -0.3, 0);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Pine Trees on sides
    for (const [tx, tz] of [[-8, -6], [-9, 3], [8, -7], [9, 2]]) {
      const tree = new THREE.Group();
      tree.position.set(tx, 0, tz);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.2), new THREE.MeshStandardMaterial({ color: 0x4a2e18 }));
      trunk.position.y = 0.6;
      tree.add(trunk);
      const foliage = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.4, 7), new THREE.MeshStandardMaterial({ color: 0x2d4a22 }));
      foliage.position.y = 2.4;
      tree.add(foliage);
      scene.add(tree);
    }

    // Runoff Flume (Slope Tray)
    const flumeGroup = new THREE.Group();
    flumeGroup.position.set(0, 0, -3.0);

    const flumeBed = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.15, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.9 })
    );
    flumeBed.position.set(0, 0.7, -0.5);
    flumeBed.rotation.x = 0.22;
    flumeBed.castShadow = true;
    flumeGroup.add(flumeBed);

    // Catchment Basin at Bottom of Slope
    const basin = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.6, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x264653, roughness: 0.4 })
    );
    basin.position.set(0, 0.3, 2.2);
    flumeGroup.add(basin);

    // Rain Shower Gantry Overhead
    const rainPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x8d99ae, metalness: 0.7 })
    );
    rainPipe.rotation.z = Math.PI / 2;
    rainPipe.position.set(0, 2.6, -1.8);
    flumeGroup.add(rainPipe);

    scene.add(flumeGroup);

    worldTargetPos.set(0, 0, -3.0);
    interactiveAnimObjects.flumeBed = flumeBed;
    interactiveAnimObjects.basin = basin;

  } else if (regionId === 'signal') {
    // Signal Coast Pier & Ocean
    // Ocean Water
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      new THREE.MeshStandardMaterial({ color: 0x1f5c6e, roughness: 0.1, transparent: true, opacity: 0.85 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.5;
    scene.add(water);

    // Stone Pier
    const pier = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.6, 24),
      new THREE.MeshStandardMaterial({ color: 0x485860, roughness: 0.8 })
    );
    pier.position.set(0, -0.3, 0);
    pier.receiveShadow = true;
    scene.add(pier);

    // Lighthouse Tower
    const lighthouse = new THREE.Group();
    lighthouse.position.set(-6, 0, -8);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 9, 16), new THREE.MeshStandardMaterial({ color: 0xe0e1dd, roughness: 0.6 }));
    tower.position.y = 4.5;
    lighthouse.add(tower);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.2, 16), new THREE.MeshStandardMaterial({ color: 0xffea00, emissive: 0xffea00, emissiveIntensity: 0.8 }));
    lamp.position.y = 9.2;
    lighthouse.add(lamp);
    scene.add(lighthouse);

    // Wave Tank on Pier
    const tankGroup = new THREE.Group();
    tankGroup.position.set(0, 0, -3.0);

    const tankGlass = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.9, 6.2),
      new THREE.MeshStandardMaterial({ color: 0xa8dadc, transparent: true, opacity: 0.45, roughness: 0.1 })
    );
    tankGlass.position.y = 0.55;
    tankGroup.add(tankGlass);

    // Wave Water inside tank
    const tankWater = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.5, 5.8),
      new THREE.MeshStandardMaterial({ color: 0x0077b6, transparent: true, opacity: 0.75, roughness: 0.2 })
    );
    tankWater.position.y = 0.35;
    tankGroup.add(tankWater);

    // Wave Paddle at back of tank
    const paddle = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.6, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.5 })
    );
    paddle.position.set(0, 0.4, -2.7);
    tankGroup.add(paddle);

    scene.add(tankGroup);

    worldTargetPos.set(0, 0, -3.0);
    interactiveAnimObjects.paddle = paddle;
    interactiveAnimObjects.tankWater = tankWater;

  } else if (regionId === 'orbit') {
    // Orbital Station Cupola
    // Metal Space Station Deck
    const deck = new THREE.Mesh(
      new THREE.CylinderGeometry(14, 14, 0.6, 32),
      new THREE.MeshStandardMaterial({ color: 0x1d2d44, roughness: 0.4, metalness: 0.6 })
    );
    deck.position.set(0, -0.3, 0);
    deck.receiveShadow = true;
    scene.add(deck);

    // Starfield Background
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 350;
    const starCoords = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starCoords[i] = (Math.random() - 0.5) * 120;
      starCoords[i + 1] = Math.random() * 60 + 5;
      starCoords[i + 2] = (Math.random() - 0.5) * 120;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
    const starPoints = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.6 }));
    scene.add(starPoints);

    // Earth Sphere visible outside cupola
    const earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(18, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x1d70b8, roughness: 0.6 })
    );
    earthMesh.position.set(0, -22, -35);
    scene.add(earthMesh);

    // Central Planetary Orrery
    const orreryGroup = new THREE.Group();
    orreryGroup.position.set(0, 0, -3.0);

    const stand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.2, 0.9, 16),
      new THREE.MeshStandardMaterial({ color: 0x415a77, metalness: 0.7 })
    );
    stand.position.y = 0.45;
    orreryGroup.add(stand);

    // Central Star (Sun)
    const sunSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffaa00, emissiveIntensity: 0.8 })
    );
    sunSphere.position.y = 1.2;
    orreryGroup.add(sunSphere);

    // Orbital Ring
    const orbitRing = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 1.45, 32),
      new THREE.MeshBasicMaterial({ color: 0x4cc9f0, side: THREE.DoubleSide })
    );
    orbitRing.rotation.x = Math.PI / 2;
    orbitRing.position.y = 1.2;
    orreryGroup.add(orbitRing);

    // Orbiting Satellite Probe
    const probe = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xef476f, roughness: 0.3 })
    );
    probe.position.set(1.42, 1.2, 0);
    orreryGroup.add(probe);

    scene.add(orreryGroup);

    worldTargetPos.set(0, 0, -3.0);
    interactiveAnimObjects.sunSphere = sunSphere;
    interactiveAnimObjects.orbitRing = orbitRing;
    interactiveAnimObjects.probe = probe;
    interactiveAnimObjects.probeOrbitAngle = 0;
  }

  // Add hillside vegetation group for Earthwatch Ridge if regionId === 'earth'
  if (regionId === 'earth') {
    const slopeTrees = new THREE.Group();
    slopeTrees.position.set(0, 0.75, -3.5);
    for (const [tx, tz] of [[-0.6, -1.2], [0.6, -1.0], [-0.5, 0.2], [0.5, 0.4], [0, -0.4]]) {
      const miniTree = new THREE.Group();
      miniTree.position.set(tx, 0, tz);
      const tTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.35), new THREE.MeshStandardMaterial({ color: 0x4a2e18 }));
      tTrunk.position.y = 0.17;
      const tCone = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.85, 6), new THREE.MeshStandardMaterial({ color: 0x2d6a4f }));
      tCone.position.y = 0.55;
      miniTree.add(tTrunk, tCone);
      slopeTrees.add(miniTree);
    }
    scene.add(slopeTrees);
    interactiveAnimObjects.slopeTrees = slopeTrees;
  }

  // -------------------------------------------------------------
  // 3D SimCity / Tycoon Buildable Facilities Grid & Raycast Hitboxes
  // -------------------------------------------------------------
  const tycoonBuildingsGroup = new THREE.Group();
  scene.add(tycoonBuildingsGroup);
  const spinningRotors = [];

  // Central Science Machine Interactive Base Ring & Hitbox
  const machineHitMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 2.1, 2.8, 16),
    new THREE.MeshBasicMaterial({ color: 0x54dfc2, transparent: true, opacity: 0.0, depthWrite: false })
  );
  machineHitMesh.position.set(worldTargetPos.x, 1.4, worldTargetPos.z);
  machineHitMesh.userData = { interactType: 'machine' };
  scene.add(machineHitMesh);

  const machineBaseRing = new THREE.Mesh(
    new THREE.RingGeometry(1.85, 2.05, 32),
    new THREE.MeshBasicMaterial({ color: 0x54dfc2, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
  );
  machineBaseRing.rotation.x = Math.PI / 2;
  machineBaseRing.position.set(worldTargetPos.x, 0.04, worldTargetPos.z);
  scene.add(machineBaseRing);

  // Active 3D Selection Ring
  const selectionRing = new THREE.Mesh(
    new THREE.RingGeometry(1.55, 1.85, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd166, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  );
  selectionRing.rotation.x = Math.PI / 2;
  selectionRing.position.set(worldTargetPos.x, 0.06, worldTargetPos.z);
  selectionRing.visible = false;
  scene.add(selectionRing);

  function rebuildTycoonBuildings(currentState = state) {
    while (tycoonBuildingsGroup.children.length > 0) {
      tycoonBuildingsGroup.remove(tycoonBuildingsGroup.children[0]);
    }
    spinningRotors.length = 0;

    const lvls = currentState.buildingLevels || {};
    const bldgs = config.buildings || [];

    for (let i = 0; i < bldgs.length; i++) {
      const b = bldgs[i];
      if (i === 0) continue; // Index 0 is the central apparatus already rendered at worldTargetPos
      const lvl = lvls[b.id] || 0;
      const [bx, bz] = b.pos || [4, 2];
      const plotGroup = new THREE.Group();
      plotGroup.position.set(bx, 0, bz);
      plotGroup.userData = { interactType: 'building', buildingId: b.id, pos: [bx, bz] };

      // Invisible clickable volume for easy finger/mouse picking
      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 3.2, 2.8),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false })
      );
      hitBox.position.y = 1.6;
      hitBox.userData = { interactType: 'building', buildingId: b.id };
      plotGroup.add(hitBox);

      // Foundation Pad
      const padMat = new THREE.MeshStandardMaterial({
        color: lvl > 0 ? 0x2b3d46 : 0x16323b,
        roughness: 0.7,
        metalness: 0.2
      });
      const pad = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 2.6), padMat);
      pad.position.y = 0.08;
      pad.receiveShadow = true;
      pad.userData = { interactType: 'building', buildingId: b.id };
      plotGroup.add(pad);

      if (lvl === 0) {
        // Unbuilt Blueprint Holo-Ring
        const holoRing = new THREE.Mesh(
          new THREE.RingGeometry(0.85, 1.08, 24),
          new THREE.MeshBasicMaterial({ color: 0x54dfc2, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
        );
        holoRing.rotation.x = Math.PI / 2;
        holoRing.position.y = 0.18;
        holoRing.userData = { interactType: 'building', buildingId: b.id };
        plotGroup.add(holoRing);

        // Corner blueprint posts
        for (const [cx, cz] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]]) {
          const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.55, 0.12),
            new THREE.MeshStandardMaterial({ color: 0x54dfc2, emissive: 0x54dfc2, emissiveIntensity: 0.45 })
          );
          post.position.set(cx, 0.32, cz);
          post.userData = { interactType: 'building', buildingId: b.id };
          plotGroup.add(post);
        }
      } else {
        // Built Tycoon Facility (scales with level 1..3)
        const hScale = 1 + (lvl - 1) * 0.35;
        const mainH = 1.6 * hScale;
        const baseMesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.7, mainH, 1.7),
          new THREE.MeshStandardMaterial({ color: b.color || 0x54dfc2, roughness: 0.4, metalness: 0.3 })
        );
        baseMesh.position.y = 0.16 + mainH / 2;
        baseMesh.castShadow = true;
        baseMesh.userData = { interactType: 'building', buildingId: b.id };
        plotGroup.add(baseMesh);

        // Glowing Energy Core Band
        const glowBand = new THREE.Mesh(
          new THREE.CylinderGeometry(0.98, 0.98, 0.22, 16),
          new THREE.MeshStandardMaterial({ color: 0x54dfc2, emissive: 0x54dfc2, emissiveIntensity: 0.7 })
        );
        glowBand.position.y = 0.16 + mainH * 0.65;
        glowBand.userData = { interactType: 'building', buildingId: b.id };
        plotGroup.add(glowBand);

        // Rotating Turbine / Dish / Solar Array on Roof
        const rotorGroup = new THREE.Group();
        rotorGroup.position.y = 0.16 + mainH + 0.35;
        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.25, 0.5, 12),
          new THREE.MeshStandardMaterial({ color: 0xe0e6ed, metalness: 0.6 })
        );
        rotorGroup.add(hub);

        const wing = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 0.08, 0.45),
          new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffaa00, emissiveIntensity: 0.35 })
        );
        wing.position.y = 0.22;
        rotorGroup.add(wing);

        plotGroup.add(rotorGroup);
        spinningRotors.push(rotorGroup);
      }

      tycoonBuildingsGroup.add(plotGroup);
    }

    // Update 3D selection ring placement
    const sel = currentState.selectedObject;
    if (sel?.type === 'machine') {
      selectionRing.position.set(worldTargetPos.x, 0.06, worldTargetPos.z);
      selectionRing.scale.set(1.15, 1.15, 1);
      selectionRing.visible = true;
    } else if (sel?.type === 'building') {
      const targetBldg = bldgs.find(x => x.id === sel.id);
      if (targetBldg) {
        const [bx, bz] = targetBldg.pos || [0, -2.5];
        selectionRing.position.set(bx, 0.06, bz);
        selectionRing.scale.set(1.0, 1.0, 1);
        selectionRing.visible = true;
      } else {
        selectionRing.visible = false;
      }
    } else {
      selectionRing.visible = false;
    }
  }

  function syncWorldToState(currentState = state) {
    if (regionId === 'motion') {
      if (interactiveAnimObjects.rampPlane) {
        const h = currentState.height || 0.2;
        interactiveAnimObjects.rampPlane.rotation.x = 0.12 + h * 0.65;
        interactiveAnimObjects.rampPlane.position.y = 0.25 + h * 0.9;
      }
      if (interactiveAnimObjects.matMesh) {
        const isSmooth = currentState.surface === 'smooth';
        interactiveAnimObjects.matMesh.material.color.setHex(isSmooth ? 0xc4a375 : 0x2b2d32);
      }
    } else if (regionId === 'matter') {
      if (interactiveAnimObjects.stopper) {
        const isSealed = currentState.stopper === 'sealed';
        interactiveAnimObjects.stopper.position.set(isSealed ? 0 : 0.45, isSealed ? 0.54 : 0.08, 0);
      }
    } else if (regionId === 'living') {
      const lux = currentState.lightLevel || 200;
      if (interactiveAnimObjects.lampBulb) {
        interactiveAnimObjects.lampBulb.material.emissiveIntensity = lux >= 800 ? 1.2 : lux >= 400 ? 0.65 : 0.2;
      }
      if (interactiveAnimObjects.plantsGroup && !isSimActive) {
        const res = config.calculateResult(currentState);
        interactiveAnimObjects.plantsGroup.scale.y = Math.max(0.4, res.growthHeight / 14.0);
      }
    } else if (regionId === 'earth') {
      const isVeg = currentState.cover === 'vegetation';
      if (interactiveAnimObjects.slopeTrees) {
        interactiveAnimObjects.slopeTrees.visible = isVeg;
      }
      if (interactiveAnimObjects.flumeBed) {
        interactiveAnimObjects.flumeBed.material.color.setHex(isVeg ? 0x2d6a4f : 0x5c4033);
      }
      if (interactiveAnimObjects.basin) {
        interactiveAnimObjects.basin.material.color.setHex(isVeg ? 0x0096c7 : 0x6b4423);
      }
    } else if (regionId === 'orbit') {
      const r = (currentState.radiusAU || 1.0) * 1.15;
      if (interactiveAnimObjects.orbitRing) {
        const s = r / 1.42;
        interactiveAnimObjects.orbitRing.scale.set(s, s, 1);
      }
      if (interactiveAnimObjects.sunSphere) {
        const mScale = (currentState.starMass || 1.0) >= 1.5 ? 1.35 : 1.0;
        interactiveAnimObjects.sunSphere.scale.set(mScale, mScale, mScale);
      }
    }
    rebuildTycoonBuildings(currentState);
  }

  syncWorldToState(state);

  // -------------------------------------------------------------
  // Controls, 3D Raycasting & Camera Navigation
  // -------------------------------------------------------------
  const keys = { forward: false, backward: false, left: false, right: false };
  let cameraAngle = 0.28; // Slight isometric angle for SimCity view
  let cameraPitch = 0.52; // Elevated SimCity tilt
  let cameraDist = 14.0;
  let walkPhase = 0;
  const avatarHeading = { val: 0 };

  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2();
  let isPointerDown = false;
  let downPointerX = 0;
  let downPointerY = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;

  function onPointerDown(e) {
    if (
      e.target.closest('[data-action]') ||
      e.target.closest('.adventure-3d-card') ||
      e.target.closest('.adventure-3d-topbar') ||
      e.target.closest('.tycoon-title-overlay') ||
      e.target.closest('.tycoon-bottom-hud')
    ) {
      return;
    }
    isPointerDown = true;
    downPointerX = e.clientX;
    downPointerY = e.clientY;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
  }

  function onPointerMove(e) {
    if (!isPointerDown) return;
    const dx = e.clientX - lastPointerX;
    const dy = e.clientY - lastPointerY;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;

    cameraAngle -= dx * 0.006;
    cameraPitch = Math.max(0.24, Math.min(0.78, cameraPitch - dy * 0.005));
  }

  function onPointerUp(e) {
    if (!isPointerDown) return;
    isPointerDown = false;

    const moveDist = Math.hypot(e.clientX - downPointerX, e.clientY - downPointerY);
    if (moveDist < 9 && renderer.domElement && (e.target === renderer.domElement || container.contains(e.target))) {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNDC, camera);
        const hits = raycaster.intersectObjects([machineHitMesh, ...tycoonBuildingsGroup.children], true);
        if (hits.length > 0) {
          let obj = hits[0].object;
          while (obj && !obj.userData?.interactType && obj.parent) {
            obj = obj.parent;
          }
          const uData = obj?.userData;
          if (uData?.interactType === 'machine') {
            state.selectedObject = { type: 'machine' };
            state.activeTab = 'tune';
            state.cardCollapsed = false;
            state.showTitleOverlay = false;
            rebuildTycoonBuildings(state);
            onStateChange({ selectedObject: state.selectedObject, activeTab: 'tune', cardCollapsed: false, showTitleOverlay: false });
            return;
          }
          if (uData?.interactType === 'building' && uData.buildingId) {
            state.selectedObject = { type: 'building', id: uData.buildingId };
            state.activeTab = 'build';
            state.cardCollapsed = false;
            state.showTitleOverlay = false;
            rebuildTycoonBuildings(state);
            onStateChange({ selectedObject: state.selectedObject, activeTab: 'build', cardCollapsed: false, showTitleOverlay: false });
            return;
          }
        }
        // Tapped empty ground/water/sky -> collapse popover to keep 90% screen clear
        if (!state.cardCollapsed) {
          state.selectedObject = null;
          state.cardCollapsed = true;
          rebuildTycoonBuildings(state);
          onStateChange({ selectedObject: null, cardCollapsed: true });
        }
      }
    }
  }

  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', () => { isPointerDown = false; });

  // Keyboard navigation
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

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Resize handler
  function handleResize() {
    if (isDestroyed) return;
    width = getWidth();
    height = getHeight();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', handleResize);

  // Camera focus animation
  let isCameraFocusing = false;
  let focusTargetAngle = 0;

  function lookAtTarget() {
    isCameraFocusing = true;
    const dx = worldTargetPos.x - avatar.position.x;
    const dz = worldTargetPos.z - avatar.position.z;
    focusTargetAngle = Math.atan2(dx, dz) + Math.PI;
  }

  function teleportToTarget() {
    avatar.position.set(worldTargetPos.x, 0, worldTargetPos.z + 2.2);
    avatar.rotation.y = Math.PI;
    lookAtTarget();
    checkTargetProximity();
  }

  function checkTargetProximity() {
    const dist = avatar.position.distanceTo(worldTargetPos);
    if (dist < 4.2 && !state.avatarNearTarget) {
      state.avatarNearTarget = true;
      if (state.step === 1) {
        state.step = 2;
        onStateChange({ step: 2, avatarNearTarget: true });
      }
    }
  }

  // -------------------------------------------------------------
  // Simulation Roll / Run Animations
  // -------------------------------------------------------------
  let rollProgress = 0;
  let isSimActive = false;
  let simResultData = null;

  function runSimulation(resultData, onDone) {
    isSimActive = true;
    simResultData = resultData;
    rollProgress = 0;

    const durationMs = 1800;
    const startTime = performance.now();

    function stepSim(now) {
      if (isDestroyed) return;
      const elapsed = now - startTime;
      const p = Math.min(1.0, elapsed / durationMs);
      rollProgress = p;

      if (regionId === 'motion' && interactiveAnimObjects.rover) {
        const rover = interactiveAnimObjects.rover;
        const totalDist = (resultData.distance || 1.5) * 2.4;
        rover.position.z = -2.5 + p * totalDist;
      } else if (regionId === 'matter') {
        if (interactiveAnimObjects.flaskLiquid) {
          interactiveAnimObjects.flaskLiquid.scale.y = 1.0 + Math.sin(p * 24) * 0.22;
        }
      } else if (regionId === 'living') {
        if (interactiveAnimObjects.plantsGroup) {
          const targetScale = (resultData.growthHeight || 18) / 12.0;
          interactiveAnimObjects.plantsGroup.scale.y = 0.5 + p * (targetScale - 0.5);
        }
      } else if (regionId === 'earth') {
        if (interactiveAnimObjects.basin) {
          interactiveAnimObjects.basin.position.y = 0.3 + Math.sin(p * Math.PI) * 0.12;
        }
      } else if (regionId === 'signal') {
        if (interactiveAnimObjects.paddle) {
          interactiveAnimObjects.paddle.position.z = -2.7 + Math.sin(p * 30) * 0.3;
        }
      } else if (regionId === 'orbit') {
        if (interactiveAnimObjects.probe) {
          interactiveAnimObjects.probeOrbitAngle = p * Math.PI * 4;
          const r = (resultData.radiusAU || 1.0) * 1.15;
          interactiveAnimObjects.probe.position.x = Math.cos(interactiveAnimObjects.probeOrbitAngle) * r;
          interactiveAnimObjects.probe.position.z = Math.sin(interactiveAnimObjects.probeOrbitAngle) * r;
        }
      }

      if (p < 1.0) {
        requestAnimationFrame(stepSim);
      } else {
        isSimActive = false;
        onDone?.();
      }
    }

    requestAnimationFrame(stepSim);
  }

  // -------------------------------------------------------------
  // 3D-to-2D World Marker Projection Helper
  // -------------------------------------------------------------
  const projVec = new THREE.Vector3();

  function updateFloatingMarkers() {
    const wrap = container.parentElement;
    if (!wrap) return;
    const markersBox = wrap.querySelector('#tycoon-3d-markers');
    if (!markersBox) return;

    const projectPoint = (x, y, z, markerId) => {
      const el = markersBox.querySelector(`[data-marker-id="${markerId}"]`);
      if (!el) return;
      projVec.set(x, y, z);
      projVec.project(camera);
      if (projVec.z > 1.0 || projVec.z < -1.0) {
        el.style.display = 'none';
        return;
      }
      const leftPct = (projVec.x * 0.5 + 0.5) * 100;
      const topPct = (-projVec.y * 0.5 + 0.5) * 100;
      if (leftPct < 4 || leftPct > 96 || topPct < 10 || topPct > 88) {
        el.style.display = 'none';
        return;
      }
      el.style.display = 'inline-flex';
      el.style.left = `${leftPct.toFixed(1)}%`;
      el.style.top = `${topPct.toFixed(1)}%`;
    };

    projectPoint(worldTargetPos.x, 2.35, worldTargetPos.z, 'machine');
    const bldgs = config.buildings || [];
    for (let i = 1; i < bldgs.length; i++) {
      const b = bldgs[i];
      const [bx, bz] = b.pos || [4, 2];
      const lvl = (state.buildingLevels || {})[b.id] || 0;
      const topY = lvl > 0 ? 2.4 + (lvl - 1) * 0.5 : 1.35;
      projectPoint(bx, topY, bz, `bldg-${b.id}`);
    }
  }

  // -------------------------------------------------------------
  // Main Animation / Render Loop
  // -------------------------------------------------------------
  let lastTime = performance.now();
  let simClock = 0;

  function animate(now) {
    if (isDestroyed) return;
    animFrameId = requestAnimationFrame(animate);

    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    simClock += dt;

    // Spin built tycoon facility rotors continuously
    for (const rotor of spinningRotors) {
      rotor.rotation.y += dt * 1.8;
    }

    // Pulse 3D rings
    machineBaseRing.material.opacity = 0.4 + Math.sin(simClock * 3.0) * 0.2;
    if (selectionRing.visible) {
      const pulse = 1.0 + Math.sin(simClock * 5.0) * 0.06;
      selectionRing.scale.set(pulse, pulse, 1);
    }

    // Continuous background Sim-Tycoon machine motion when not in burst simulation
    if (!isSimActive) {
      if (regionId === 'motion' && interactiveAnimObjects.rover) {
        const res = config.calculateResult(state);
        const cycle = (simClock * 0.45) % 1;
        const reach = (res.distance || 1.0) * 2.4;
        interactiveAnimObjects.rover.position.z = -2.5 + Math.min(1, cycle * 1.3) * reach;
      } else if (regionId === 'signal' && interactiveAnimObjects.paddle) {
        const freq = state.frequency || 1.0;
        interactiveAnimObjects.paddle.position.z = -2.7 + Math.sin(simClock * freq * 4.5) * 0.2;
      } else if (regionId === 'orbit' && interactiveAnimObjects.probe) {
        const r = (state.radiusAU || 1.0) * 1.15;
        const speed = 2.2 / Math.pow(state.radiusAU || 1.0, 1.5);
        interactiveAnimObjects.probeOrbitAngle = (interactiveAnimObjects.probeOrbitAngle || 0) + dt * speed;
        interactiveAnimObjects.probe.position.x = Math.cos(interactiveAnimObjects.probeOrbitAngle) * r;
        interactiveAnimObjects.probe.position.z = Math.sin(interactiveAnimObjects.probeOrbitAngle) * r;
      }
    }

    // Movement calculation
    let moveX = 0;
    let moveZ = 0;
    if (keys.forward) moveZ -= 1;
    if (keys.backward) moveZ += 1;
    if (keys.left) moveX -= 1;
    if (keys.right) moveX += 1;

    const isMoving = moveX !== 0 || moveZ !== 0;

    if (isMoving) {
      const len = Math.hypot(moveX, moveZ);
      moveX /= len;
      moveZ /= len;

      // Move relative to camera viewing direction
      const direction = walkDirection(Math.sin(cameraAngle), Math.cos(cameraAngle), moveX, -moveZ);
      const worldDx = direction.x * 4.2 * dt;
      const worldDz = direction.z * 4.2 * dt;

      const nextX = avatar.position.x + worldDx, nextZ = avatar.position.z + worldDz;
      // Keep the player outside the solid harbor shed.
      if (regionId !== 'motion' || !(nextX > -11.5 && nextX < -5.5 && nextZ > 2.4 && nextZ < 7.6)) {
        avatar.position.x = nextX;
        avatar.position.z = nextZ;
      }

      // Bounds collision checking (-11 to +11 on X, -10 to +10 on Z)
      avatar.position.x = Math.max(-11, Math.min(11, avatar.position.x));
      avatar.position.z = Math.max(-10, Math.min(10, avatar.position.z));

      // Rotate avatar toward movement direction
      const targetRot = Math.atan2(worldDx, worldDz);
      avatarHeading.val += (targetRot - avatarHeading.val) * 0.15;
      avatar.rotation.y = avatarHeading.val;

      // Walk cycle animation
      walkPhase += dt * 10;
      leftLeg.rotation.x = Math.sin(walkPhase) * 0.55;
      rightLeg.rotation.x = -Math.sin(walkPhase) * 0.55;
      leftArm.rotation.x = -Math.sin(walkPhase) * 0.45;
      rightArm.rotation.x = Math.sin(walkPhase) * 0.45;

      checkTargetProximity();
    } else {
      // Idle pose lerp
      leftLeg.rotation.x *= 0.8;
      rightLeg.rotation.x *= 0.8;
      leftArm.rotation.x *= 0.8;
      rightArm.rotation.x *= 0.8;
    }

    // Camera smoothing
    if (isCameraFocusing) {
      let diff = focusTargetAngle - cameraAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      cameraAngle += diff * 0.08;
      if (Math.abs(diff) < 0.02) isCameraFocusing = false;
    }

    // Camera mode: 'city' (elevated SimCity overview of island) vs 'walk' (third-person avatar follow)
    const isCityMode = (state.cameraMode || 'city') === 'city' && !isMoving;
    const targetDist = isCityMode ? 14.2 : 7.8;
    cameraDist += (targetDist - cameraDist) * 0.08;

    const focusOriginX = isCityMode ? 0 : avatar.position.x;
    const focusOriginY = isCityMode ? 0.8 : avatar.position.y + 1.4;
    const focusOriginZ = isCityMode ? -1.0 : avatar.position.z;

    const camX = focusOriginX + Math.sin(cameraAngle) * Math.cos(cameraPitch) * cameraDist;
    const camY = focusOriginY + Math.sin(cameraPitch) * cameraDist;
    const camZ = focusOriginZ + Math.cos(cameraAngle) * Math.cos(cameraPitch) * cameraDist;

    camera.position.set(camX, camY, camZ);
    if (!isCityMode) {
      guardCamera(camera, avatar.position);
    }
    camera.lookAt(focusOriginX, focusOriginY, focusOriginZ);

    renderer.render(scene, camera);
    updateFloatingMarkers();
  }

  animFrameId = requestAnimationFrame(animate);

  return {
    destroy() {
      isDestroyed = true;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
    setKey(dir, val) {
      if (keys[dir] !== undefined) keys[dir] = !!val;
    },
    onParamChange() {
      syncWorldToState(state);
    },
    syncWorldToState,
    rebuildTycoonBuildings,
    lookAtTarget,
    lookAtRover: lookAtTarget,
    teleportToTarget,
    runSimulation,
    resize: handleResize
  };
}
