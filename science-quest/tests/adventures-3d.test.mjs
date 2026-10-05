import test from 'node:test';
import assert from 'node:assert/strict';
import { GlobalWindow } from 'happy-dom';
import { ADVENTURE_CONFIGS, createAdventureState } from '../src/adventures-3d-data.js';
import { adventure3DView } from '../src/adventures-3d-view.js';
import { makeProfile, createRun } from '../src/learning.js';
import { byId } from '../src/content.js';
import { reconcileWorld } from '../src/world.js';

test('ADVENTURE_CONFIGS contains all 6 regions with valid scientific fair-test configurations', () => {
  const expectedRegions = ['motion', 'matter', 'living', 'earth', 'signal', 'orbit'];
  for (const reg of expectedRegions) {
    const config = ADVENTURE_CONFIGS[reg];
    assert.ok(config, `Config for ${reg} exists`);
    assert.equal(config.id, reg);
    assert.ok(config.regionName, `Config has a display name`);
    assert.ok(config.targetName, `Config has a target object`);
    assert.ok(config.flagshipMission, `Config connects to a flagship mission`);
    assert.ok(config.facilityName, `Config connects to a restorable facility`);
    assert.equal(typeof config.calculateResult, 'function', `calculateResult is a function`);
    assert.equal(typeof config.validateFair, 'function', `validateFair is a function`);
    assert.equal(typeof config.formatWhatChanged, 'function', `formatWhatChanged is a function`);
    assert.ok(config.question, `Config has a reflection question`);
    assert.ok(Array.isArray(config.question.options), `Options are an array`);
    assert.equal(typeof config.question.correct, 'number', `Correct choice index is numeric`);
  }
});

test('Motion Harbor fair test calculation and validation', () => {
  const cfg = ADVENTURE_CONFIGS.motion;
  const s1 = { height: 0.2, surface: 'smooth' };
  const r1 = cfg.calculateResult(s1);
  assert.equal(r1.distance, 1.0);

  const s2Fair = { height: 0.35, surface: 'smooth' };
  const checkFair = cfg.validateFair(r1, s2Fair);
  assert.equal(checkFair.fair, true);

  const s2UnfairBoth = { height: 0.35, surface: 'rubber' };
  const checkUnfairBoth = cfg.validateFair(r1, s2UnfairBoth);
  assert.equal(checkUnfairBoth.fair, false);
  assert.match(checkUnfairBoth.message, /not fair and does not count/i);

  const s2Same = { height: 0.2, surface: 'smooth' };
  const checkSame = cfg.validateFair(r1, s2Same);
  assert.equal(checkSame.fair, false);
});

test('Matter Workshop conservation of mass fair test calculation and validation', () => {
  const cfg = ADVENTURE_CONFIGS.matter;
  // Closed container: total mass conserved
  const sSealed1 = { stopper: 'sealed', reactantsMass: 60.0 };
  const r1 = cfg.calculateResult(sSealed1);
  assert.equal(r1.reactantsMass, 60.0);
  assert.equal(r1.massAfter, 60.0);
  assert.equal(r1.gasEscaped, 0);

  // Compare fair test: keep reactants mass identical (60.0g), test open container
  const sOpen2 = { stopper: 'open', reactantsMass: 60.0 };
  const checkFair = cfg.validateFair(r1, sOpen2);
  assert.equal(checkFair.fair, true);

  const r2 = cfg.calculateResult(sOpen2);
  assert.equal(r2.reactantsMass, 60.0);
  assert.equal(r2.gasEscaped, 3.2);
  assert.equal(r2.massAfter, 56.8);

  // Unfair: changing both container seal and reactants mass
  const sUnfair = { stopper: 'open', reactantsMass: 80.0 };
  const checkUnfair = cfg.validateFair(r1, sUnfair);
  assert.equal(checkUnfair.fair, false);
  assert.match(checkUnfair.message, /fair/i);
});

test('Living Valley plant growth fair test calculation and validation', () => {
  const cfg = ADVENTURE_CONFIGS.living;
  const s1 = { lightLevel: 500, waterPerDay: 50 };
  const r1 = cfg.calculateResult(s1);
  assert.equal(r1.growthHeight, 18.5);

  // Fair test: change light level to 900 while keeping water fixed at 50
  const s2Fair = { lightLevel: 900, waterPerDay: 50 };
  const checkFair = cfg.validateFair(r1, s2Fair);
  assert.equal(checkFair.fair, true);
  const r2 = cfg.calculateResult(s2Fair);
  assert.equal(r2.growthHeight, 24.0);

  // Unfair: changing light AND water together
  const s2Unfair = { lightLevel: 900, waterPerDay: 100 };
  const checkUnfair = cfg.validateFair(r1, s2Unfair);
  assert.equal(checkUnfair.fair, false);
});

test('Earthwatch Ridge soil runoff fair test calculation and validation', () => {
  const cfg = ADVENTURE_CONFIGS.earth;
  const s1 = { cover: 'bare', rainfallRate: 30 };
  const r1 = cfg.calculateResult(s1);
  assert.equal(r1.runoffMl, 42.0);

  // Fair test: change cover to dense vegetation while keeping rainfall fixed at 30
  const s2Fair = { cover: 'vegetation', rainfallRate: 30 };
  const checkFair = cfg.validateFair(r1, s2Fair);
  assert.equal(checkFair.fair, true);
  const r2 = cfg.calculateResult(s2Fair);
  assert.equal(r2.runoffMl, 6.0);

  // Unfair: changing both cover and rainfall
  const s2Unfair = { cover: 'vegetation', rainfallRate: 60 };
  const checkUnfair = cfg.validateFair(r1, s2Unfair);
  assert.equal(checkUnfair.fair, false);
});

test('Signal Coast wave frequency vs wavelength fair test', () => {
  const cfg = ADVENTURE_CONFIGS.signal;
  const s1 = { frequency: 1.0, waterDepth: 1.0 };
  const r1 = cfg.calculateResult(s1);
  assert.equal(r1.wavelength, 4.0); // v / f = 4.0 / 1.0 = 4.0

  // Fair test: change frequency to 2.0 at constant water depth
  const s2Fair = { frequency: 2.0, waterDepth: 1.0 };
  const checkFair = cfg.validateFair(r1, s2Fair);
  assert.equal(checkFair.fair, true);
  const r2 = cfg.calculateResult(s2Fair);
  assert.equal(r2.wavelength, 2.0); // v / f = 4.0 / 2.0 = 2.0 (shorter wavelength)

  // Unfair: changing both frequency and water depth
  const s2Unfair = { frequency: 2.0, waterDepth: 2.5 };
  const checkUnfair = cfg.validateFair(r1, s2Unfair);
  assert.equal(checkUnfair.fair, false);
});

test('Orbital Station radius vs orbital period fair test (Kepler Law)', () => {
  const cfg = ADVENTURE_CONFIGS.orbit;
  const s1 = { radiusAU: 1.0, starMass: 1.0 };
  const r1 = cfg.calculateResult(s1);
  assert.equal(r1.periodSec, 12.0); // 12 * 1^1.5 = 12.0

  // Fair test: change radius to 2.0 AU
  const s2Fair = { radiusAU: 2.0, starMass: 1.0 };
  const checkFair = cfg.validateFair(r1, s2Fair);
  assert.equal(checkFair.fair, true);
  const r2 = cfg.calculateResult(s2Fair);
  assert.ok(r2.periodSec > r1.periodSec);

  // Unfair: changing radius and central star mass together
  const s2Unfair = { radiusAU: 2.0, starMass: 2.0 };
  const checkUnfair = cfg.validateFair(r1, s2Unfair);
  assert.equal(checkUnfair.fair, false);
});

test('adventure3DView renders full-screen immersive HUD and controls for all 6 regions', () => {
  const profile = makeProfile('Aria');

  for (const reg of ['motion', 'matter', 'living', 'earth', 'signal', 'orbit']) {
    const state = createAdventureState(reg);
    const html = adventure3DView(reg, profile, state);

    // Fullscreen canvas container
    assert.ok(html.includes('id="adventure-3d-canvas-container"'), `${reg} has 3D canvas container`);
    assert.ok(html.includes('class="adventure-3d-wrap'), `${reg} has full viewport wrapper`);

    // Floating top bar
    assert.ok(html.includes('adventure-3d-topbar'), `${reg} has floating topbar`);
    assert.ok(html.includes('data-action="adventure-3d-exit"'), `${reg} has exit button`);
    assert.ok(html.includes('data-action="adventure-3d-toggle-fullscreen"'), `${reg} has fullscreen toggle`);
    assert.ok(html.includes('data-action="adventure-3d-focus-target"'), `${reg} has focus target button`);

    // Touch D-Pad for fingers / mobile
    assert.ok(html.includes('adventure-3d-dpad'), `${reg} has touch D-Pad`);
    assert.ok(html.includes('data-dir="forward"'), `${reg} D-pad has forward`);
    assert.ok(html.includes('data-dir="backward"'), `${reg} D-pad has backward`);
    assert.ok(html.includes('data-dir="left"'), `${reg} D-pad has left`);
    assert.ok(html.includes('data-dir="right"'), `${reg} D-pad has right`);

    // Collapsible Pip Card
    assert.ok(html.includes('adventure-3d-card'), `${reg} has Pip dialogue card`);
    assert.ok(html.includes('data-action="adventure-3d-toggle-card"'), `${reg} has collapse/expand toggle`);

    // Step progression renders cleanly
    for (let step = 1; step <= 5; step++) {
      state.step = step;
      if (step >= 3) {
        state.trials = [
          ADVENTURE_CONFIGS[reg].calculateResult(state),
          ADVENTURE_CONFIGS[reg].calculateResult(state)
        ];
        state.whatChanged = 'Test comparison recorded';
      }
      const stepHtml = adventure3DView(reg, profile, state);
      assert.ok(stepHtml.includes(`Step ${step}`), `${reg} renders Step ${step}`);
    }
  }
});

test('styles.css contains full-screen immersive styles for 3D adventures', async () => {
  const fs = await import('node:fs/promises');
  const css = await fs.readFile(new URL('../styles.css', import.meta.url), 'utf-8');

  // Immersive full-screen CSS
  assert.ok(css.includes('body.is-immersive-3d'), 'Body class is-immersive-3d styled');
  assert.ok(css.includes('body.is-immersive-3d header.topbar'), 'Topbar hidden in immersive 3D');
  assert.ok(css.includes('body.is-immersive-3d nav.bottom-nav'), 'Bottom nav hidden in immersive 3D');
  assert.ok(css.includes('.adventure-3d-wrap'), '.adventure-3d-wrap styled');
  assert.ok(css.includes('width: 100vw !important'), 'Viewport width is 100vw');
  assert.ok(css.includes('z-index: 1001 !important'), 'Viewport elevated above standard layout');
  assert.ok(css.includes('.adventure-3d-dpad'), '3D touch D-pad styled');
  assert.ok(css.includes('.adventure-3d-card.is-collapsed'), 'Collapsible card style supported');
});
