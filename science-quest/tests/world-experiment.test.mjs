import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.module.js';
import {simulate,adapters} from '../src/models.js';
import {WORLD_MODELS,sampleExperiment,experimentObservation,routeExperiment} from '../src/world-experiment.js';
import {routeModel} from '../src/route-capstone.js';
import {createExperimentStation} from '../src/world-experiment-3d.js';

test('3D poses finish at the same measured positions as saved lesson models',()=>{
 for(const model of WORLD_MODELS)for(const input of [adapters[model].min,adapters[model].max]){
  const result=simulate(model,input),last=sampleExperiment(result,1);
  assert.ok(Math.abs(last.x-result.series.at(-1).x)<1e-8,model);
  assert.ok(Math.abs(last.y)<1e-8);
  for(let i=0;i<=100;i++)assert.ok(Number.isFinite(sampleExperiment(result,i/100).x));
 }
 const ramp=simulate('ramp',.3);assert.equal(sampleExperiment(ramp,0).y,.3);
 assert.match(experimentObservation(simulate('push',2)),/not a stopping distance/);
});
test('station completes once, preserves final pose through UI renders, and cancels safely',()=>{
 const scene=new THREE.Scene(),rover=new THREE.Group();rover.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshBasicMaterial()));
 const station=createExperimentStation(scene,rover),result=simulate('push',4),config={model:'push',input:4,result};
 station.configure(config);let finished=0;station.play(result,()=>finished++);
 station.tick(.5);station.pause(true);station.tick(10);assert.equal(finished,0);
 station.pause(false);station.tick(10);assert.equal(finished,1);
 const cart=scene.children[0].children.find(o=>o.type==='Group');assert.equal(cart.position.x,result.value*2.4);
 station.configure(config);assert.equal(cart.position.x,result.value*2.4);
 station.tick(10);assert.equal(finished,1);
 station.play(result,()=>finished++);station.cancel();station.tick(10);assert.equal(finished,1);
 station.configure(null);assert.equal(station.active(),false);station.destroy();assert.equal(scene.children.length,0);
});
test('connected route stops before the cushion or within its modeled stopping length',()=>{
 for(const config of [{height:.1,resistance:.4,cushion:.1},{height:.3,resistance:.1,cushion:.2}]){
  const trial={...routeModel(config),config},animation=routeExperiment(trial),pose=sampleExperiment(animation,1);
  assert.ok(Math.abs(pose.x-(trial.reaches?trial.distance+config.cushion:trial.freeStop))<1e-8);
  assert.ok(Math.abs(pose.v)<1e-8);
 }
});
