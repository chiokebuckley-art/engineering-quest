import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { GearState } from '../../engine/state/gear';
import { normalizeGearAvatar, gearSpotlightId } from '../../engine/state/gearAvatars';
import { gearAsset, avatarLabel } from './GearAvatarPicker';

function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(); const materials = new Set<THREE.Material>();
  root.traverse(o => { if (o instanceof THREE.Mesh || o instanceof THREE.Sprite) { if (o instanceof THREE.Mesh) geometries.add(o.geometry); for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m); } });
  geometries.forEach(g => g.dispose()); materials.forEach(m => { if (m instanceof THREE.SpriteMaterial) m.map?.dispose(); m.dispose(); });
}

export default function GearStudio({ game, reducedMotion }: { game: GearState; reducedMotion: boolean }) {
  const host = useRef<HTMLDivElement>(null); const current = useRef({ game, reducedMotion }); current.current = { game, reducedMotion };
  const [status, setStatus] = useState('Loading studio…');
  const roster = game.contestants.map(c => `${c.id}:${normalizeGearAvatar(c.avatarId)}`).join('|');
  useEffect(() => {
    const container = host.current; if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }); }
    catch { setStatus('3D studio unavailable. Use the player podiums below.'); return; }
    let disposed = false, frame = 0; const assets: THREE.Object3D[] = [];
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement); renderer.domElement.setAttribute('aria-hidden', 'true');
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#050a18');
    scene.add(new THREE.HemisphereLight(0xb3dcff, 0x15233d, 2.3));
    const key = new THREE.DirectionalLight(0xafd9ff, 3); key.position.set(3,9,8); scene.add(key);
    const camera = new THREE.PerspectiveCamera(43, 1, .1, 100); camera.position.set(0,8.5,19); camera.lookAt(0,2,-.7);
    const spotlight = new THREE.SpotLight(0xffe7b5, 220, 25, .24, .65, 1.2); spotlight.position.set(0,7,3); scene.add(spotlight, spotlight.target);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1,1,32,1,true),new THREE.MeshBasicMaterial({ color: 0xffe4ac, transparent:true,opacity:.055,depthWrite:false,side:THREE.DoubleSide }));scene.add(cone);
    // A separate portrait scene keeps the host, podiums and other players out of the shot.
    const portraitScene = new THREE.Scene(); portraitScene.background = new THREE.Color('#050a18');
    portraitScene.add(new THREE.HemisphereLight(0xe0eeff, 0x26334b, 2.6));
    const portraitKey = new THREE.DirectionalLight(0xffeedb, 3); portraitKey.position.set(2,4,5); portraitScene.add(portraitKey);
    const portraitCamera = new THREE.PerspectiveCamera(35, 1, .01, 100);
    let portrait: THREE.Object3D | undefined; let portraitId: string | undefined;
    const portraitBounds = new THREE.Box3(); const portraitCenter = new THREE.Vector3();
    const stations: { id:string; root:THREE.Object3D; avatar?:THREE.Object3D; strips:THREE.MeshStandardMaterial[] }[] = [];
    const loader = new GLTFLoader(); const startRoster = [...current.current.game.contestants];
    const fit = () => { const w=container.clientWidth,h=container.clientHeight; if (!w || !h) return; renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=camera.aspect<1.4?25:19;camera.fov=camera.aspect<1?58:43;camera.updateProjectionMatrix(); };
    const resize = new ResizeObserver(fit); resize.observe(container);fit();
    const contextLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame);setStatus('3D paused. Use the player podiums below.'); };
    renderer.domElement.addEventListener('webglcontextlost',contextLost);
    async function load() {
      try {
        const studio = (await loader.loadAsync(gearAsset('studio.glb'))).scene;
        if (disposed) { disposeObject(studio); return; } assets.push(studio);scene.add(studio);
        // Runtime labels below carry current names, timer and values instead of baked placeholders.
        studio.traverse(o => { if (/^P\d+_(name|number)$/.test(o.name) || o.name==='Round display') o.visible=false; });
        for (let i=0;i<8;i++) {
          const root=studio.getObjectByName(`Podium_${String(i+1).padStart(2,'0')}`); if (!root) continue;
          const c=startRoster[i]; if (!c) {root.visible=false;continue;}
          const strips:THREE.MeshStandardMaterial[]=[];
          root.traverse(o=>{if(o instanceof THREE.Mesh && o.name.includes('status_strip')){const material=(o.material as THREE.MeshStandardMaterial).clone();o.material=material;strips.push(material);}});
          const station={id:c.id,root,strips,avatar:undefined as THREE.Object3D|undefined};stations.push(station);
          const id=normalizeGearAvatar(c.avatarId);
          if(id==='engineer') {
            const bot=new THREE.Group();const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.23,.55,4,10),new THREE.MeshStandardMaterial({color:c.color,metalness:.4,roughness:.6}));torso.position.y=1.5;bot.add(torso);
            const head=new THREE.Mesh(new THREE.SphereGeometry(.29,16,12),new THREE.MeshStandardMaterial({color:0xb3c9d9,metalness:.6,roughness:.3}));head.position.y=2.13;bot.add(head);station.avatar=bot;
          } else {
            const group=new THREE.Group();
            const texture=new THREE.TextureLoader().load(gearAsset(`${id}.jpg`));texture.colorSpace=THREE.SRGBColorSpace;
            const card=new THREE.Sprite(new THREE.SpriteMaterial({map:texture}));card.position.y=1.65;card.scale.set(1.1,1.65,1);group.add(card);station.avatar=group;

          }
          station.avatar.position.set(0,0,-.64);root.add(station.avatar);
        }
        if (!disposed) setStatus('');
      } catch { if (!disposed) setStatus('3D studio unavailable. Use the player podiums below.'); }
    }
    void load();
    const destination=new THREE.Vector3();const target=new THREE.Vector3();const top=new THREE.Vector3(0,1,0);const direction=new THREE.Vector3();let previous=0;
    const draw=(now:number)=>{
      if(disposed)return;const dt=Math.min((now-previous)/1000,.1);previous=now;
      const {game:g,reducedMotion:still}=current.current;const lit=gearSpotlightId(g);let found=false;
      for(const s of stations){const c=g.contestants.find(c=>c.id===s.id);const out=c?.out!==undefined;s.avatar && (s.avatar.visible=!out);for(const m of s.strips){m.emissive.set(out?0x090d17:s.id===lit?0xffc56d:0x147fbd);m.emissiveIntensity=out?0:s.id===lit?3: .6;}
        if(s.id===lit&&!out){s.root.updateWorldMatrix(true,false);destination.set(0,2,-.64).applyMatrix4(s.root.matrixWorld);found=true;}}
      spotlight.visible=cone.visible=found;
      if(found){if(still||target.lengthSq()===0)target.copy(destination);else target.lerp(destination,1-Math.exp(-dt*7));spotlight.target.position.copy(target);direction.copy(spotlight.position).sub(target);cone.position.copy(target).add(spotlight.position).multiplyScalar(.5);cone.quaternion.setFromUnitVectors(top,direction.clone().normalize());cone.scale.set(.8,direction.length(),.8);}
      const active = found ? stations.find(s => s.id === lit && s.avatar) : undefined;
      if (active?.avatar) {
        if (portraitId !== active.id) {
          if (portrait) portraitScene.remove(portrait);
          // Clone the hierarchy only; geometry and materials remain owned by the loaded asset.
          portrait = active.avatar.clone(true); portrait.position.set(0,0,0); portrait.visible = true;
          portraitScene.add(portrait); portraitId = active.id;
          portraitBounds.setFromObject(portrait); portraitBounds.getCenter(portraitCenter);
        }
        const height = portraitBounds.max.y - portraitBounds.min.y;
        const width = portraitBounds.max.x - portraitBounds.min.x;
        const halfHeight = Math.max(height * .25, width * .55 / camera.aspect);
        const distance = halfHeight / Math.tan(THREE.MathUtils.degToRad(portraitCamera.fov / 2));
        const faceY = portraitBounds.max.y - height * .22;
        portraitCamera.aspect = camera.aspect; portraitCamera.updateProjectionMatrix();
        portraitCamera.position.set(portraitCenter.x, faceY, portraitBounds.max.z + distance);
        portraitCamera.lookAt(portraitCenter.x, faceY, portraitCenter.z);
        renderer.render(portraitScene,portraitCamera);
      } else {
        renderer.render(scene,camera);
      }
      frame=requestAnimationFrame(draw);
    }; frame=requestAnimationFrame(draw);
    return ()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();renderer.domElement.removeEventListener('webglcontextlost',contextLost);disposeObject(scene);assets.forEach(disposeObject);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[roster]);
  const lit=gearSpotlightId(game);const contestant=game.contestants.find(c=>c.id===lit);const name=contestant?.name;const chosen=normalizeGearAvatar(contestant?.avatarId);const photo=!!lit&&chosen!=='engineer';
  return <section className="gear-studio-wrap" aria-label="Weakest Gear 3D studio"><div ref={host} className="gear-studio" style={{display:photo?'none':undefined}} />{photo&&<div className="gear-photo-closeup"><img src={gearAsset(`${chosen}.jpg`)} alt={`${avatarLabel(chosen)} portrait, chosen by ${name}`} /><span className="gear-portrait-label">{avatarLabel(chosen)}</span></div>}{status && !photo && <p className="gear-studio-status" role="status">{status}</p>}<p className="gear-studio-caption" aria-live="polite">{name ? `${name} ${game.phase==='over'?'wins the show':'is in the spotlight'}` : 'Studio lights · voting and round break'}</p></section>;
}
