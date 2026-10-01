import {describe,it,expect} from 'vitest';
import {FACE_NORMALS,topRotation,makeDie,PIPS} from './diceMeshes';
import { Vector3,Mesh } from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {readFileSync} from 'node:fs';
describe('Dice Workshop 3D assets',()=>{
 it('puts the requested value on top for all six orientations and models every pip',()=>{
  for(let v=1;v<=6;v++){const n=FACE_NORMALS[v-1].clone().applyQuaternion(topRotation(v));expect(n.distanceTo(new Vector3(0,1,0))).toBeLessThan(.0001);expect(PIPS[v]).toHaveLength(v);}
  const die=makeDie();let meshes=0;die.traverse(o=>{if(o instanceof Mesh)meshes++;});expect(meshes).toBe(22);
 });
 it('loads the shipped Blender model with named dice, table, and replacement panels',async()=>{
  const bytes=readFileSync(new URL('../../../public/assets/dice-workshop/table.glb',import.meta.url));const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;
  const model=await new GLTFLoader().parseAsync(buffer,'');const names:string[]=[];model.scene.traverse(o=>names.push(o.name));for(const name of ['Die_1','Die_5','Equation','Grouping','Math_screen','Scorecard_panel','Held_label','Score_title'])expect(names).toContain(name);
 });
});
