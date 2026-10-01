import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { makeDie, topRotation } from './diceMeshes';
import { CATEGORIES, LABELS, scoreFor, mathLine, type DiceRun } from '../../engine/state/diceWorkshop';
export const diceAsset=(file:string)=>`${import.meta.env.BASE_URL}assets/dice-workshop/${file}`;
function dispose(root:THREE.Object3D){root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
export default function DiceWorkshopScene({run,reducedMotion}:{run:DiceRun|null;reducedMotion:boolean}){
 const host=useRef<HTMLDivElement>(null),latest=useRef({run,reducedMotion}),refresh=useRef<()=>void>(()=>{});latest.current={run,reducedMotion};
 const [status,setStatus]=useState<'loading'|'ready'|'failed'>('loading');
 useEffect(()=>{
  const el=host.current!;let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{setStatus('failed');return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x091322,1);el.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(37,1,.1,100);camera.position.set(10,14,14);camera.lookAt(0,1,-.2);
  scene.add(new THREE.HemisphereLight(0xc7f5ff,0x334059,2.3));const key=new THREE.DirectionalLight(0xfff0cf,3.3);key.position.set(-4,12,7);scene.add(key);
  const fill=new THREE.DirectionalLight(0x6ef8ed,1.8);fill.position.set(8,8,-6);scene.add(fill);
  const positions=[[-3.65,1.43,-.45],[-1.95,1.43,-.45],[-.25,1.43,-.45],[-2.8,1.43,1.1],[-1,1.43,1.1]];
  const dice=positions.map(p=>{const die=makeDie();die.position.fromArray(p);scene.add(die);return die;});
  const ringGeo=new THREE.TorusGeometry(.62,.027,6,40),ringMat=new THREE.MeshBasicMaterial({color:0x54f6ce});
  const rings=positions.map(p=>{const ring=new THREE.Mesh(ringGeo,ringMat);ring.rotation.x=-Math.PI/2;ring.position.set(p[0],1.02,p[2]);scene.add(ring);return ring;});
  // A live screen and scorecard replace the concept's baked example answers.
  const mathCanvas=document.createElement('canvas');mathCanvas.width=1024;mathCanvas.height=256;const mathTexture=new THREE.CanvasTexture(mathCanvas);mathTexture.colorSpace=THREE.SRGBColorSpace;
  const mathPanel=new THREE.Mesh(new THREE.PlaneGeometry(5.9,1.4),new THREE.MeshBasicMaterial({map:mathTexture}));mathPanel.position.set(-1.7,1.78,-2.73);scene.add(mathPanel);
  const scoreCanvas=document.createElement('canvas');scoreCanvas.width=512;scoreCanvas.height=1024;const scoreTexture=new THREE.CanvasTexture(scoreCanvas);scoreTexture.colorSpace=THREE.SRGBColorSpace;
  const scorePanel=new THREE.Mesh(new THREE.PlaneGeometry(2.93,5.8),new THREE.MeshBasicMaterial({map:scoreTexture}));scorePanel.rotation.x=-Math.PI/2;scorePanel.position.set(3.62,1.115,.12);scene.add(scorePanel);
  let dead=false,frame=0,revision=-1,model:THREE.Object3D|undefined;
  function render(){if(!dead)renderer.render(scene,camera);}
  function resize(){const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.position.set(10,14,14).multiplyScalar(Math.max(1,1.45/camera.aspect));camera.lookAt(0,1,-.2);camera.updateProjectionMatrix();render();}
  const observer=new ResizeObserver(resize);observer.observe(el);
  function update(){
   cancelAnimationFrame(frame);const {run:r,reducedMotion:quiet}=latest.current;const values=r?.rolls?r.dice:[1,2,3,4,5];const targets=values.map(topRotation);
   const animate=!!r?.rolls&&revision>=0&&revision!==r.revision&&!quiet;revision=r?.revision??0;
   rings.forEach((o,i)=>{o.visible=!!r?.held[i]&&!!r.rolls;});
   const ctx=mathCanvas.getContext('2d')!;ctx.fillStyle='#102337';ctx.fillRect(0,0,1024,256);ctx.textAlign='center';ctx.fillStyle='#76f9dd';ctx.font='bold 32px sans-serif';ctx.fillText(r?.finished?'SCORECARD COMPLETE':'ROLL • HOLD • SOLVE • SCORE',512,66);ctx.fillStyle='#fff5d6';const line=r?.rolls?mathLine(r):'Your next math adventure';let px=49;ctx.font=`bold ${px}px sans-serif`;while(px>26&&ctx.measureText(line).width>980){px-=2;ctx.font=`bold ${px}px sans-serif`;}ctx.fillText(line,512,142);ctx.font='28px sans-serif';ctx.fillText(r?.finished?'Great work!':`${3-(r?.rolls??0)} rolls left · use the controls below`,512,207);mathTexture.needsUpdate=true;
   const c=scoreCanvas.getContext('2d')!;c.fillStyle='#102337';c.fillRect(0,0,512,1024);c.fillStyle='#76f9dd';c.font='bold 34px sans-serif';c.fillText('YOUR SCORECARD',30,65);CATEGORIES.forEach((cat,i)=>{const y=135+i*62;c.fillStyle='#fff5d6';c.font='25px sans-serif';c.fillText(LABELS[cat],26,y);c.fillStyle='#76f9dd';c.fillText(String(r?.card[cat]??(r?.checked?scoreFor(r.dice,cat,r.card):'—')),442,y);});scoreTexture.needsUpdate=true;
   const started=performance.now();function tick(now:number){const t=animate?Math.min(1,(now-started)/650):1;dice.forEach((d,i)=>{d.position.fromArray(positions[i]);d.quaternion.copy(targets[i]);if(t<1&&!r?.held[i]){const phase=Math.sin(t*Math.PI);d.position.y+=phase*.65;d.rotateX((1-t)*Math.PI*4);d.rotateZ((1-t)*Math.PI*2);}});render();if(t<1&&!dead)frame=requestAnimationFrame(tick);}
   tick(started);
  }
  refresh.current=update;resize();update();
  const onLost=(e:Event)=>{e.preventDefault();setStatus('failed');};renderer.domElement.addEventListener('webglcontextlost',onLost);
  new GLTFLoader().load(diceAsset('table.glb'),g=>{if(dead){dispose(g.scene);return;}model=g.scene;model.traverse(o=>{if(/^(Die_|Hold_|Held_label|Prompt$|Equation$|Grouping$|Score[0-9]*$|Score\.|Category|Score_title|Bonus_label|Rolls_Remaining_label|Roll_Button_label|Check_Button_label)/.test(o.name))o.visible=false;});scene.add(model);setStatus('ready');update();},undefined,()=>{if(!dead)setStatus('failed');});
  return ()=>{dead=true;cancelAnimationFrame(frame);refresh.current=()=>{};observer.disconnect();renderer.domElement.removeEventListener('webglcontextlost',onLost);dispose(scene);mathTexture.dispose();scoreTexture.dispose();renderer.dispose();renderer.domElement.remove();};
 },[]);
 useEffect(()=>refresh.current(),[run,reducedMotion]);
 return <div className="dice-scene-wrap" aria-hidden="true"><div ref={host} className="dice-scene" style={{visibility:status==='failed'?'hidden':'visible'}} />{status==='loading'&&<span className="dice-scene-note">Setting up your table…</span>}{status==='failed'&&<div className="dice-scene-fallback">⚄<p>3D preview unavailable. All game controls work below.</p></div>}</div>;
}
