import * as THREE from './vendor/three.module.js';

export function cameraObstructionGuard(obstacles) {
  const ray=new THREE.Raycaster(), target=new THREE.Vector3(), direction=new THREE.Vector3();
  return (camera, player) => {
    target.copy(player).y+=1.4;
    direction.subVectors(camera.position,target);
    const distance=direction.length();
    if(distance<.01)return;
    ray.set(target,direction.normalize());ray.far=distance;
    for(const obstacle of obstacles)obstacle.updateWorldMatrix(true,true);
    const hit=ray.intersectObjects(obstacles,true)[0];
    if(hit)camera.position.copy(target).addScaledVector(direction,Math.max(.35,hit.distance-.4));
  };
}

// Real geometry, visible from every angle. Kept outside the walking/test area.
export function addHarborScenery(scene) {
  const root = new THREE.Group();
  root.name = 'Harbor landscape';
  const material = color => new THREE.MeshStandardMaterial({color, roughness:0.85});
  const sand=material(0xe6cd99), grass=material(0x68a76e), leaf=material(0x347e62);
  const stone=material(0x819f98), bark=material(0x71523b), cream=material(0xfff4dc);
  const coral=material(0xdc7050), teal=material(0x277884);
  function mesh(geometry,mat,x,y,z,sx=1,sy=1,sz=1) {
    const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);
    m.castShadow=true;m.receiveShadow=true;root.add(m);return m;
  }
  const sphere=new THREE.IcosahedronGeometry(1,1);
  const cylinder=new THREE.CylinderGeometry(1,1,1,10);
  for (const [x,z,size] of [[-24,-24,10],[22,-32,13],[34,13,9],[-33,12,8]]) {
    mesh(sphere,sand,x,-.1,z,size,2.2,size*.7);
    mesh(sphere,grass,x,1.1,z,size*.87,2,size*.6);
    mesh(sphere,stone,x+size*.2,3,z-2,size*.35,4,size*.28);
    for(let i=0;i<5;i++) {
      const tx=x+Math.cos(i*2.4)*size*.6,tz=z+Math.sin(i*2.4)*size*.4;
      mesh(cylinder,bark,tx,3,tz,.2,3,.2);
      mesh(sphere,i%2?grass:leaf,tx,5,tz,1.7,2.4,1.6);
    }
  }
  // Striped lighthouse and lantern on the northwestern island.
  for(let i=0;i<5;i++) mesh(new THREE.CylinderGeometry(1.5-i*.1,1.6-i*.1,1.5,12),i%2?coral:cream,-25,3+i*1.5,-26);
  mesh(cylinder,teal,-25,10.2,-26,1.8,.4,1.8);
  const glass=new THREE.MeshStandardMaterial({color:0xffdd88,emissive:0xffb83e,emissiveIntensity:.6});
  mesh(cylinder,glass,-25,11,-26,1,1.3,1);
  mesh(new THREE.ConeGeometry(1.9,1.5,12),coral,-25,12.3,-26);
  // Two boats, with broad cloth sails and low hulls.
  for(const [x,z,a] of [[18,8,.4],[-19,-5,-.4]]) {
    const boat=new THREE.Group();boat.position.set(x,-.1,z);boat.rotation.y=a;root.add(boat);
    const hull=new THREE.Mesh(new THREE.SphereGeometry(1,12,6),coral);hull.scale.set(1.1,.55,3);boat.add(hull);
    const mast=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,6,8),bark);mast.position.y=3;boat.add(mast);
    const sailGeo=new THREE.BufferGeometry();sailGeo.setAttribute('position',new THREE.Float32BufferAttribute([.12,1,0,.12,5.8,0,2.7,1,0],3));sailGeo.computeVertexNormals();
    const sail=new THREE.Mesh(sailGeo,new THREE.MeshStandardMaterial({color:0xfff8e7,side:THREE.DoubleSide,roughness:1}));boat.add(sail);
  }
  const cloud=material(0xfffcf0);
  for(let i=0;i<8;i++) for(let j=0;j<3;j++) {
    const a=i*Math.PI/4;mesh(sphere,cloud,Math.cos(a)*43+j*2.5,15+(i%3)*2,Math.sin(a)*43,4,1.3+j*.25,2);
  }
  // Mooring bollards and warm harbor lamps give the dock a human scale.
  for(const x of [-12,12]) for(const z of [-10,-3,4,10]) {
    mesh(cylinder,teal,x,.4,z,.22,.8,.22);
    mesh(cylinder,cream,x,.85,z,.4,.14,.4);
    if(z===-10||z===10){mesh(cylinder,teal,x,2,z,.07,4,.07);mesh(sphere,glass,x,4.2,z,.32,.45,.32);}
  }
  scene.add(root);
  return root;
}
