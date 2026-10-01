import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
// Opposite faces sum to seven. Each normal points out of the numbered face.
export const FACE_NORMALS = [new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,0),new THREE.Vector3(-1,0,0),new THREE.Vector3(0,0,-1),new THREE.Vector3(0,-1,0)];
export const topRotation = (value:number) => new THREE.Quaternion().setFromUnitVectors(FACE_NORMALS[value-1],new THREE.Vector3(0,1,0));
export const PIPS: Record<number,number[][]> = {1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[-1,1],[1,-1],[1,1]],5:[[-1,-1],[-1,1],[0,0],[1,-1],[1,1]],6:[[-1,-1],[-1,0],[-1,1],[1,-1],[1,0],[1,1]]};
export function makeDie(){
 const group=new THREE.Group();
 group.add(new THREE.Mesh(new RoundedBoxGeometry(.84,.84,.84,3,.09),new THREE.MeshStandardMaterial({color:0xfff6db,roughness:.34})));
 const ink=new THREE.MeshStandardMaterial({color:0x10283b,roughness:.65});const geo=new THREE.SphereGeometry(.057,10,6);
 FACE_NORMALS.forEach((normal,index)=>{const face=new THREE.Group();face.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);for(const [x,y] of PIPS[index+1]){const pip=new THREE.Mesh(geo,ink);pip.position.set(x*.21,y*.21,.419);pip.scale.z=.18;face.add(pip);}group.add(face);});
 return group;
}
