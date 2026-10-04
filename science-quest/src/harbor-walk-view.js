import {esc} from './visuals.js';
import {DOCK_SURFACES} from './harbor-walk-3d.js';

export function harborWalkView(profile, state) {
  const step = state.step;
  const t1 = state.trials[0] || null;
  const t2 = state.trials[1] || null;

  const stepsList = [
    { num: 1, label: 'Walk to Rover' },
    { num: 2, label: 'Set Height' },
    { num: 3, label: 'Fair Test' },
    { num: 4, label: 'Explain' },
    { num: 5, label: 'Restored' }
  ];

  const stepperHtml = `
    <ul class="harbor-walk-stepper" aria-label="Harbor Walk investigation steps">
      ${stepsList.map(s => `
        <li class="${s.num === step ? 'current' : s.num < step ? 'completed' : ''}">
          <span class="step-num">${s.num < step ? '✓' : s.num}</span>
          <span class="step-name">${s.label}</span>
        </li>
      `).join('')}
    </ul>
  `;

  let taskCardHtml = '';

  if (step === 1) {
    taskCardHtml = `
      <div class="harbor-walk-card">
        <div class="harbor-walk-pip">
          <div class="pip-face-icon">🤖</div>
          <div>
            <p class="eyebrow">STEP 1 · HARBOR EXPLORATION</p>
            <h3>Welcome to Motion Harbor!</h3>
            <p>Walk across the wooden dock to the <strong>science rover</strong> and notice the <strong>straight ramp</strong> behind it.</p>
          </div>
        </div>
        <div class="harbor-walk-tips">
          <p>📱 <strong>Phone / Touch:</strong> Use the left D-pad with your thumb to walk, swipe the dock with your finger to look.</p>
          <p>⌨️ <strong>Desktop:</strong> Use W, A, S, D or Arrow Keys to walk, drag mouse to look.</p>
        </div>
        <div class="harbor-walk-card-actions">
          <button class="secondary text-button" data-action="harbor-walk-teleport-rover">Approach Rover Directly →</button>
        </div>
      </div>
    `;
  } else if (step === 2) {
    taskCardHtml = `
      <div class="harbor-walk-card">
        <div class="harbor-walk-pip">
          <div class="pip-face-icon">🤖</div>
          <div>
            <p class="eyebrow">STEP 2 · FIRST TRIAL</p>
            <h3>Test the Ramp</h3>
            <p>Notice the straight ramp behind the rover! Choose a starting height for the ramp, then roll the rover to see how far it rolls along the dock.</p>
          </div>
        </div>

        <div class="harbor-walk-form">
          <div class="field">
            <label for="hw-height">Ramp Height: <strong>${state.height.toFixed(2)} m</strong></label>
            <div class="harbor-walk-height-buttons">
              <button class="choice ${state.height === 0.15 ? 'selected' : ''}" data-action="harbor-walk-height" data-value="0.15" ${state.isRolling ? 'disabled' : ''}>Low (0.15 m)</button>
              <button class="choice ${state.height === 0.25 ? 'selected' : ''}" data-action="harbor-walk-height" data-value="0.25" ${state.isRolling ? 'disabled' : ''}>Medium (0.25 m)</button>
              <button class="choice ${state.height === 0.35 ? 'selected' : ''}" data-action="harbor-walk-height" data-value="0.35" ${state.isRolling ? 'disabled' : ''}>High (0.35 m)</button>
            </div>
            <input id="hw-height" type="range" min="0.15" max="0.40" step="0.05" value="${state.height}" data-action="harbor-walk-height-slider" ${state.isRolling ? 'disabled' : ''} aria-label="Ramp Height in metres">
          </div>

          <p class="harbor-walk-fixed">Dock Surface: <strong>${DOCK_SURFACES[state.surface]?.name || 'Smooth Wood Dock'}</strong> (held constant for first roll)</p>

          <button class="primary full" data-action="harbor-walk-roll" ${state.isRolling ? 'disabled' : ''}>
            ${state.isRolling ? 'Rolling down ramp…' : '🚀 Roll Rover'}
          </button>
        </div>
      </div>
    `;
  } else if (step === 3) {
    taskCardHtml = `
      <div class="harbor-walk-card">
        <div class="harbor-walk-pip">
          <div class="pip-face-icon">🤖</div>
          <div>
            <p class="eyebrow">STEP 3 · MAKE A FAIR COMPARISON</p>
            <h3>Change ONLY the Ramp Height</h3>
            <p>To find out how ramp height affects motion, your second test must be a <strong>fair test</strong>: change <em>only</em> the height, keeping the surface identical!</p>
          </div>
        </div>

        ${state.fairWarning ? `
          <div class="harbor-walk-warning" role="alert">
            ${esc(state.fairWarning)}
          </div>
        ` : ''}

        ${state.whatChanged ? `
          <div class="harbor-walk-evidence-banner">
            <span class="evidence-icon">📋</span>
            <div>
              <strong>Latest Roll:</strong>
              <p>${esc(state.whatChanged)}</p>
            </div>
          </div>
        ` : ''}

        <div class="harbor-walk-form">
          <div class="field">
            <label for="hw-height-2">Ramp Height: <strong>${state.height.toFixed(2)} m</strong> (Trial 1 was ${t1 ? t1.height.toFixed(2) : '0.20'} m)</label>
            <div class="harbor-walk-height-buttons">
              <button class="choice ${state.height === 0.15 ? 'selected' : ''}" data-action="harbor-walk-height" data-value="0.15" ${state.isRolling ? 'disabled' : ''}>Low (0.15 m)</button>
              <button class="choice ${state.height === 0.25 ? 'selected' : ''}" data-action="harbor-walk-height" data-value="0.25" ${state.isRolling ? 'disabled' : ''}>Medium (0.25 m)</button>
              <button class="choice ${state.height === 0.35 ? 'selected' : ''}" data-action="harbor-walk-height" data-value="0.35" ${state.isRolling ? 'disabled' : ''}>High (0.35 m)</button>
            </div>
            <input id="hw-height-2" type="range" min="0.15" max="0.40" step="0.05" value="${state.height}" data-action="harbor-walk-height-slider" ${state.isRolling ? 'disabled' : ''} aria-label="Ramp Height in metres">
          </div>

          <div class="field">
            <label>Dock Surface:</label>
            <div class="harbor-walk-surface-buttons">
              <button class="choice ${state.surface === 'smooth' ? 'selected' : ''}" data-action="harbor-walk-surface" data-value="smooth" ${state.isRolling ? 'disabled' : ''}>Smooth Wood Dock</button>
              <button class="choice ${state.surface === 'rubber' ? 'selected' : ''}" data-action="harbor-walk-surface" data-value="rubber" ${state.isRolling ? 'disabled' : ''}>Rough Rubber Mat</button>
            </div>
            <small class="muted">⚠️ Warning: If you change both height and surface together, the test is not fair and will not count!</small>
          </div>

          <button class="primary full" data-action="harbor-walk-roll" ${state.isRolling ? 'disabled' : ''}>
            ${state.isRolling ? 'Testing…' : '🚀 Roll Rover (Compare)'}
          </button>
        </div>

        <div class="harbor-walk-trial-summary">
          <h4>Your Recorded Evidence</h4>
          <div class="harbor-walk-trials">
            <div class="trial-row">
              <span>Trial 1:</span>
              <strong>Height ${t1 ? t1.height.toFixed(2) : '-'} m</strong> ·
              <span>${t1 ? t1.surfaceName : '-'}</span> →
              <em>Distance: ${t1 ? t1.distance.toFixed(1) + ' m' : '-'}</em>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (step === 4) {
    const q = {
      prompt: 'What did your fair test show about ramp height and rover motion?',
      options: [
        'A higher ramp gives the rover more gravitational energy, so it rolls farther on the same surface.',
        'Changing the ramp height makes no difference to how far the rover rolls.',
        'A lower ramp makes the rover roll much farther because it is lighter.'
      ],
      correct: 0
    };

    taskCardHtml = `
      <div class="harbor-walk-card">
        <div class="harbor-walk-pip">
          <div class="pip-face-icon">🤖</div>
          <div>
            <p class="eyebrow">STEP 4 · EXPLAIN THE FAIR TEST</p>
            <h3>What Did Your Fair Test Prove?</h3>
            <p>You tested two different heights on the identical surface. Now conclude your investigation!</p>
          </div>
        </div>

        <div class="harbor-walk-evidence-banner">
          <span class="evidence-icon">📋</span>
          <div>
            <strong>Evidence Summary:</strong>
            <p>Trial 1: Height ${t1?.height.toFixed(2)} m on ${t1?.surfaceName} → Rolled ${t1?.distance.toFixed(1)} m.<br>
            Trial 2: Height ${t2?.height.toFixed(2)} m on ${t2?.surfaceName} → Rolled ${t2?.distance.toFixed(1)} m.</p>
          </div>
        </div>

        <div class="harbor-walk-question">
          <p class="question-prompt"><strong>${esc(q.prompt)}</strong></p>
          <div class="choices">
            ${q.options.map((opt, i) => `
              <button class="choice ${state.questionChoice === i ? 'selected' : ''}" data-action="harbor-walk-choice" data-value="${i}">
                <span class="choice-dot">${state.questionChoice === i ? '●' : '○'}</span>
                <span>${esc(opt)}</span>
              </button>
            `).join('')}
          </div>

          ${state.questionFeedback ? `
            <div class="feedback ${state.questionFeedback.ok ? 'good' : 'try'}">
              ${esc(state.questionFeedback.text)}
            </div>
          ` : ''}

          <button class="primary full" data-action="harbor-walk-submit-answer" ${state.questionChoice === null ? 'disabled' : ''}>
            Check Explanation →
          </button>
        </div>
      </div>
    `;
  } else if (step === 5) {
    taskCardHtml = `
      <div class="harbor-walk-card celebration-card">
        <div class="completion-icon">✦</div>
        <p class="eyebrow">DISCOVERY COMPLETE · RESTORATION ACHIEVED</p>
        <h2>Harbor Lab is Restored!</h2>
        <p>By conducting a fair test, you discovered how starting height transfers gravitational energy into motion. Your discovery has restored <strong>Harbor Lab</strong>!</p>
        
        <div class="restoration-badge">
          <span class="badge success">✓ Harbor Lab Restored</span>
          <p class="muted">Cargo Crane and Supply Network remain safely locked until their own discoveries.</p>
        </div>

        <div class="harbor-walk-what-changed-final">
          <h4>Your Fair Test Evidence:</h4>
          <p>• Trial 1: Height ${t1?.height.toFixed(2)} m → Rolled ${t1?.distance.toFixed(1)} m<br>
             • Trial 2: Height ${t2?.height.toFixed(2)} m → Rolled ${t2?.distance.toFixed(1)} m<br>
             • <strong>Conclusion:</strong> Higher start = more energy = rolls farther on the same dock!</p>
        </div>

        <div class="celebration-actions">
          <button class="primary full" data-action="region" data-id="motion">Explore Restored Harbor (2D Board) →</button>
          <button class="secondary full" data-action="nav" data-view="explore">Return to Discovery Islands Map</button>
          <button class="text-button" data-action="harbor-walk-freewalk">Keep Exploring 3D Dock</button>
        </div>
      </div>
    `;
  }

  return `
    <section class="harbor-walk-wrap" aria-label="3D Walkable Motion Harbor">
      <div class="harbor-walk-topbar">
        <button class="back" data-action="region" data-id="motion" aria-label="Return to Motion Harbor">← Exit to Harbor</button>
        <div class="harbor-walk-title">
          <h1>Motion Harbor · 3D Dock Walk</h1>
          <span class="badge ${state.completed ? 'success' : ''}">${state.completed ? 'Harbor Lab Restored' : 'Fair Test Investigation'}</span>
        </div>
      </div>

      <div class="harbor-walk-main-layout">
        <div class="harbor-walk-viewport-container">
          <div id="harbor-walk-canvas-container" class="harbor-walk-canvas-box" tabindex="0" role="region" aria-label="Walkable 3D Harbor Dock viewport. Use WASD or on-screen D-pad to walk, drag to look.">
            <!-- Three.js Canvas mounts here -->
          </div>

          <!-- Camera focus chip -->
          <button class="harbor-walk-cam-reset" data-action="harbor-walk-focus-rover" aria-label="Point camera toward rover">
            <span class="cam-icon">🎯</span> <span>Find Rover</span>
          </button>

          <!-- Input guidance -->
          <div class="harbor-walk-keys-guide" aria-hidden="true">
            <span class="desktop-guide"><span class="key-badge">W</span><span class="key-badge">A</span><span class="key-badge">S</span><span class="key-badge">D</span> to Walk · Drag to Look</span>
            <span class="mobile-guide">◀ ▲ ▶ Left D-Pad to Walk · Swipe to Look</span>
          </div>

          <!-- Ergonomic Touch D-Pad for Finger Controls on Phones -->
          <div class="harbor-walk-touch-controls" role="group" aria-label="Touch walk controls">
            <div class="harbor-walk-dpad">
              <button type="button" class="touch-btn touch-up" data-action="touch-walk" data-dir="forward" aria-label="Walk forward">▲</button>
              <button type="button" class="touch-btn touch-left" data-action="touch-walk" data-dir="left" aria-label="Turn left">◀</button>
              <button type="button" class="touch-btn touch-center" data-action="harbor-walk-focus-rover" aria-label="Point camera toward rover" title="Center view on rover">🧭</button>
              <button type="button" class="touch-btn touch-right" data-action="touch-walk" data-dir="right" aria-label="Turn right">▶</button>
              <button type="button" class="touch-btn touch-down" data-action="touch-walk" data-dir="backward" aria-label="Walk backward">▼</button>
            </div>
          </div>
        </div>

        <aside class="harbor-walk-sidebar" aria-label="Investigation task panel">
          ${stepperHtml}
          ${taskCardHtml}
        </aside>
      </div>
    </section>
  `;
}
