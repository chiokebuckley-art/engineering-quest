import * as THREE from './vendor/three.module.js';
import {sampleExperiment} from './world-experiment.js';

export function createExperimentStation(scene,roverTemplate){
  const root=new THREE.Group();root.position.z=3.5;root.visible=false;scene.add(root);
  const scale=2.4;
  const mat=color=>new THREE.MeshStandardMaterial({color,roughness:.8});
  function box(x,y,z,color){const o=new THREE.Mesh(new THREE.BoxGeometry(x,y,z),mat(color));o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
  const lane=box(13,.08,1.5,0xd5bd90);lane.position.set(2,.06,0);
  const ramp=box(4.8,.1,1.5,0xd5aa62);
  const barrier=box(.35,1.0,1.6,0xeb8b6f);barrier.position.set(0,.54,0);
  const cart=roverTemplate.clone(true);cart.scale.setScalar(.8);root.add(cart);
  const arrow=new THREE.ArrowHelper(new THREE.Vector3(1,0,0),new THREE.Vector3(),1,0xe66b35,.3,.18);root.add(arrow);
  const leftArrow=new THREE.ArrowHelper(new THREE.Vector3(-1,0,0),new THREE.Vector3(),1,0x3879a1,.3,.18);root.add(leftArrow);
  const target=box(.08,.04,1.55,0x328c71);target.visible=false;
  for(let i=-1;i<=3;i++){const stripe=box(.025,.015,1.45,i===0?0xffeeaa:0xf7f3df);stripe.position.set(i*scale,.11,0);}
  let setting=null,animation=null,lastSignature='';
  function pose(result,p){
    const sample=sampleExperiment(result,p);
    // Collision's series describes motion while the barrier slows the cart.
    const offset=result.model==='collision'?-result.series.at(-1).x:0;
    cart.position.set((sample.x+offset)*scale,.13+sample.y*scale,0);
    cart.rotation.set(0,0,sample.phase==='ramp'?-Math.atan(result.input/2):0);
    cart.children.filter(o=>o.type==='Group').forEach(o=>o.rotation.z=-sample.x*scale/.18);
    arrow.position.set(cart.position.x,.95+sample.y*scale,0);
    leftArrow.position.set(cart.position.x,1.3+sample.y*scale,0);
    arrow.visible=['push','direction','force'].includes(result.model)&&p<1;
    leftArrow.visible=result.model==='force'&&p<1;
  }
  function configure(config){
    if(!config){root.visible=false;animation=null;setting=null;lastSignature='';return;}
    root.visible=true;
    const signature=JSON.stringify(config);
    if(signature===lastSignature)return;
    animation=null;setting=config;lastSignature=signature;
    const {model,input,result,options={},target:bay}=config;
    ramp.visible=model==='ramp';barrier.visible=model==='collision'||!!config.route;
    barrier.scale.x=config.route?config.cushion*scale/.35:1;
    barrier.position.x=config.route?(config.distance+config.cushion/2)*scale:.175;
    if(ramp.visible){const h=input*scale;ramp.scale.x=Math.hypot(4.8,h)/4.8;ramp.position.set(-2.4,h/2+.1,0);ramp.rotation.z=-Math.atan(input/2);}
    lane.material.color.setHex(model==='resistance'||config.route?((config.route?options.resistance:input)>=.3?0x8f9f86:0xc5d7ce):0xd5bd90);
    lane.material.roughness=model==='resistance'?Math.min(1,.4+input):.8;
    target.visible=!!bay;if(bay)target.position.set((bay[0]+bay[1])/2*scale,.12,0);
    arrow.setDirection(new THREE.Vector3(model==='direction'&&input<0?-1:1,0,0));
    arrow.setLength(.7+(model==='push'||model==='force'?input*.22:.6),.3,.18);
    leftArrow.setLength(1.58,.3,.18);
    pose(result,0);
  }
  return {configure,
    play(result,onDone,{reduced=false}={}){
      if(!setting)return false;
      if(reduced){pose(result,1);onDone();return true;}
      animation={result,onDone,elapsed:0,duration:Math.max(1.6,Math.min(6,result.duration)),paused:false};
      pose(result,0);return true;
    },
    tick(delta){if(!animation||animation.paused)return;const a=animation;a.elapsed+=delta;const p=Math.min(1,a.elapsed/a.duration);pose(a.result,p);if(p===1){animation=null;a.onDone();}},
    pause(value){if(animation)animation.paused=value;},
    cancel(){animation=null;},
    active:()=>root.visible,
    destroy(){scene.remove(root);const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o===cart||cart.getObjectById(o.id))return;if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
  };
}
