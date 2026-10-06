import test from 'node:test';
import assert from 'node:assert/strict';
import {walkDirection} from '../src/walk-direction.js';
test('all arrows follow the screen after every camera rotation',()=>{
  for(let i=0;i<32;i++) {
    const a=i*Math.PI/16,x=Math.sin(a),z=Math.cos(a);
    for(const [side,forward] of [[0,1],[0,-1],[-1,0],[1,0]]) {
      const v=walkDirection(x,z,side,forward);
      assert.ok(Math.abs(v.x*z-v.z*x-side)<1e-10);
      assert.ok(Math.abs(-v.x*x-v.z*z-forward)<1e-10);
    }
    const diagonal=walkDirection(x,z,1,1);
    assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.z)-1)<1e-10);
  }
});
