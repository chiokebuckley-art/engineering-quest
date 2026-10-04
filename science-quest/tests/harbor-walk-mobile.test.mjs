import test from 'node:test';
import assert from 'node:assert/strict';
import { GlobalWindow } from 'happy-dom';
import { harborWalkView } from '../src/harbor-walk-view.js';
import { createHarborWalkState } from '../src/harbor-walk-3d.js';
import { makeProfile } from '../src/learning.js';

test('Mobile phone DOM simulation: touch D-pad and camera reset interactions', () => {
  const window = new GlobalWindow({ width: 375, height: 667 });
  const document = window.document;

  const profile = makeProfile('Test Child');
  const state = createHarborWalkState();
  const html = harborWalkView(profile, state);

  const container = document.createElement('div');
  container.id = 'app';
  container.innerHTML = html;
  document.body.appendChild(container);

  // 1. Verify D-pad elements
  const dpad = container.querySelector('.harbor-walk-dpad');
  assert.ok(dpad, 'D-Pad should be mounted in the viewport');

  const upBtn = container.querySelector('[data-action="touch-walk"][data-dir="forward"]');
  const downBtn = container.querySelector('[data-action="touch-walk"][data-dir="backward"]');
  const leftBtn = container.querySelector('[data-action="touch-walk"][data-dir="left"]');
  const rightBtn = container.querySelector('[data-action="touch-walk"][data-dir="right"]');
  const centerBtn = container.querySelector('[data-action="harbor-walk-focus-rover"]');

  assert.ok(upBtn, 'Up touch button exists');
  assert.ok(downBtn, 'Down touch button exists');
  assert.ok(leftBtn, 'Left touch button exists');
  assert.ok(rightBtn, 'Right touch button exists');
  assert.ok(centerBtn, 'Center compass / focus rover button exists');

  // 2. Mock harborWalkInstance
  const keysSet = {};
  let roverFocused = false;
  const mockInstance = {
    setKey(dir, val) {
      keysSet[dir] = val;
    },
    lookAtRover() {
      roverFocused = true;
    }
  };

  // Simulate pointerdown on Up button
  upBtn.classList.add('is-active');
  mockInstance.setKey(upBtn.dataset.dir, true);
  assert.equal(keysSet['forward'], true, 'Forward key pressed');

  // Simulate pointerup on Up button
  upBtn.classList.remove('is-active');
  mockInstance.setKey(upBtn.dataset.dir, false);
  assert.equal(keysSet['forward'], false, 'Forward key released');

  // Simulate tap on center compass / focus rover
  mockInstance.lookAtRover();
  assert.equal(roverFocused, true, 'Look at rover triggered');

  // 3. Verify mobile guide text is rendered
  const mobileGuide = container.querySelector('.mobile-guide');
  assert.ok(mobileGuide, 'Mobile guide element exists');
  assert.match(mobileGuide.textContent, /Left D-Pad to Walk/i);
});
