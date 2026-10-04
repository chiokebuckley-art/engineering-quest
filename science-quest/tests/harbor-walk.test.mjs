import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRollDistance,
  validateFairTest,
  createHarborWalkState,
  DOCK_SURFACES
} from '../src/harbor-walk-3d.js';
import {harborWalkView} from '../src/harbor-walk-view.js';
import {harborStatus, harborSites} from '../src/harbor.js';
import {makeProfile, createRun} from '../src/learning.js';
import {byId} from '../src/content.js';
import {reconcileWorld} from '../src/world.js';

test('Harbor Walk physical stopping distance model: d = h / mu', () => {
  // Smooth dock friction: 0.20
  assert.equal(calculateRollDistance(0.20, 'smooth'), 1.0);
  assert.equal(calculateRollDistance(0.30, 'smooth'), 1.5);
  assert.equal(calculateRollDistance(0.40, 'smooth'), 2.0);

  // Rough rubber mat friction: 0.40
  assert.equal(calculateRollDistance(0.20, 'rubber'), 0.5);
  assert.equal(calculateRollDistance(0.40, 'rubber'), 1.0);
});

test('Harbor Walk enforces strict fair testing rules', () => {
  const trial1 = {
    trial: 1,
    height: 0.20,
    surface: 'smooth',
    surfaceName: 'Smooth Wood Dock',
    distance: 1.0
  };

  // 1. Changing height AND surface together is an UNFAIR TEST and does not count
  const unfairBoth = validateFairTest(trial1, 0.35, 'rubber');
  assert.equal(unfairBoth.fair, false);
  assert.equal(unfairBoth.reason, 'both_changed');
  assert.match(unfairBoth.message, /not fair and does not count/i);
  assert.match(unfairBoth.message, /keep the surface on Smooth Wood Dock/i);

  // 2. Changing surface while keeping height identical is NOT a fair height test
  const unfairSurfaceOnly = validateFairTest(trial1, 0.20, 'rubber');
  assert.equal(unfairSurfaceOnly.fair, false);
  assert.equal(unfairSurfaceOnly.reason, 'surface_changed_not_height');

  // 3. Changing neither height nor surface asks for a comparison setting
  const noChange = validateFairTest(trial1, 0.20, 'smooth');
  assert.equal(noChange.fair, false);
  assert.equal(noChange.reason, 'no_change');

  // 4. Changing ONLY height and keeping surface on smooth is a VALID FAIR TEST
  const fairTest = validateFairTest(trial1, 0.30, 'smooth');
  assert.equal(fairTest.fair, true);
});

test('Harbor Walk state machine and completion restores Harbor Lab while keeping others locked', () => {
  const profile = makeProfile('Test Explorer');
  const labSite = harborSites.find(s => s.id === 'lab');
  const craneSite = harborSites.find(s => s.id === 'crane');
  const routeSite = harborSites.find(s => s.id === 'route');

  // Initially: nothing is restored
  assert.equal(harborStatus(profile, labSite), 'Needs discovery');
  assert.equal(harborStatus(profile, craneSite), 'Needs discovery');
  assert.equal(harborStatus(profile, routeSite), 'Needs discovery');

  // Walk state progression
  const walkState = createHarborWalkState();
  assert.equal(walkState.step, 1);

  // Step 1: Walk to rover
  walkState.step = 2;

  // Step 2: First roll at 0.20m
  const d1 = calculateRollDistance(0.20, 'smooth');
  walkState.trials.push({
    trial: 1,
    height: 0.20,
    surface: 'smooth',
    surfaceName: DOCK_SURFACES.smooth.name,
    distance: d1
  });
  walkState.whatChanged = 'Trial 1: Height was 0.20 m on Smooth Wood Dock. The rover rolled 1.0 m down the dock.';
  walkState.step = 3;

  // Step 3: Fair second roll at 0.30m
  const fairCheck = validateFairTest(walkState.trials[0], 0.30, 'smooth');
  assert.equal(fairCheck.fair, true);
  const d2 = calculateRollDistance(0.30, 'smooth');
  walkState.trials.push({
    trial: 2,
    height: 0.30,
    surface: 'smooth',
    surfaceName: DOCK_SURFACES.smooth.name,
    distance: d2
  });
  walkState.whatChanged = 'Trial 2: Kept surface on Smooth Wood Dock and changed height from 0.20 m to 0.30 m. Rover rolled 1.5 m (0.5 m farther).';
  walkState.step = 4;

  // Step 4: Correct explanation choice
  walkState.questionChoice = 0; // "A higher ramp gives the rover more gravitational energy, so it rolls farther on the same surface."
  walkState.step = 5;
  walkState.completed = true;

  // Completion hook: marks rover-rescue completed and reconciles world
  profile.runs['rover-rescue'] = {
    ...createRun(byId['rover-rescue']),
    completed: true,
    completedAt: Date.now(),
    stage: 'done'
  };
  reconcileWorld(profile);

  // Verification: Harbor Lab is Restored! Crane and Route stay locked!
  assert.equal(harborStatus(profile, labSite), 'Restored');
  assert.equal(harborStatus(profile, craneSite), 'Needs discovery');
  assert.equal(harborStatus(profile, routeSite), 'Needs discovery');
});

test('harborWalkView renders HTML for each step without throwing', () => {
  const profile = makeProfile('Alex');
  const state = createHarborWalkState();

  // Test render on each step
  for (let s = 1; s <= 5; s++) {
    state.step = s;
    if (s >= 3) {
      state.trials = [
        { trial: 1, height: 0.20, surface: 'smooth', surfaceName: 'Smooth Wood Dock', distance: 1.0 },
        { trial: 2, height: 0.30, surface: 'smooth', surfaceName: 'Smooth Wood Dock', distance: 1.5 }
      ];
      state.whatChanged = 'Trial 2: Rolled farther';
    }
    const html = harborWalkView(profile, state);
    assert.ok(html.includes('harbor-walk-viewport-container'));
    assert.ok(html.includes('harbor-walk-canvas-box'));
    assert.ok(html.includes('harbor-walk-stepper'));
  }
});

test('harborWalkView includes touch D-pad, camera reset chip, and mobile instructions', () => {
  const profile = makeProfile('Maya');
  const state = createHarborWalkState();
  const html = harborWalkView(profile, state);

  // Ergonomic Touch D-Pad
  assert.ok(html.includes('harbor-walk-dpad'), 'D-Pad element exists');
  assert.ok(html.includes('data-dir="forward"'), 'Forward button exists');
  assert.ok(html.includes('data-dir="backward"'), 'Backward button exists');
  assert.ok(html.includes('data-dir="left"'), 'Left button exists');
  assert.ok(html.includes('data-dir="right"'), 'Right button exists');
  assert.ok(html.includes('touch-center'), 'Compass center button exists');

  // Camera Reset / Focus Rover Chip
  assert.ok(html.includes('harbor-walk-cam-reset'), 'Camera reset button exists');
  assert.ok(html.includes('data-action="harbor-walk-focus-rover"'), 'Focus rover action hooked up');

  // Mobile Guidance
  assert.ok(html.includes('mobile-guide'), 'Mobile guide text present');
  assert.ok(html.includes('Phone / Touch:'), 'Step 1 instructs phone players');
});

test('styles.css contains mobile phone responsive styles for Harbor Walk', async () => {
  const fs = await import('node:fs/promises');
  const css = await fs.readFile(new URL('../styles.css', import.meta.url), 'utf-8');

  // Viewport and touch prevention
  assert.ok(css.includes('touch-action:none'), 'Canvas touch-action is set to none');
  assert.ok(css.includes('.harbor-walk-dpad'), 'CSS rules for .harbor-walk-dpad exist');
  assert.ok(css.includes('.harbor-walk-cam-reset'), 'CSS rules for .harbor-walk-cam-reset exist');

  // Media query for mobile phones
  assert.ok(css.includes('@media(max-width:768px)'), 'Mobile 768px media query exists');
  assert.ok(css.includes('height:210px'), 'Phone viewport height 210px exists to fit phone screen');
  assert.ok(css.includes('min-height:48px'), 'Accessible 48px touch targets are styled');

  // Landscape phone orientation
  assert.ok(css.includes('orientation:landscape'), 'Landscape phone optimization exists');

  // Cinema subtitles positioned below video without blocking animation
  assert.ok(css.includes('.cinema-caption-bar'), 'Cinema caption bar exists');
  assert.ok(css.includes('.cinema-caption-box{display:none!important}'), 'Floating caption overlay on video is removed');
});

