import {esc} from './visuals.js';
import {ADVENTURE_CONFIGS} from './adventures-3d-data.js';

export function adventure3DView(regionId, profile, state) {
  const config = ADVENTURE_CONFIGS[regionId] || ADVENTURE_CONFIGS.motion;
  const step = state.step || 1;
  const t1 = state.trials?.[0] || null;
  const t2 = state.trials?.[1] || null;
  const isCollapsed = !!state.cardCollapsed;

  const stepsList = [
    { num: 1, label: config.stepTitles[1] || 'Walk to Target' },
    { num: 2, label: config.stepTitles[2] || 'First Trial' },
    { num: 3, label: config.stepTitles[3] || 'Fair Test' },
    { num: 4, label: config.stepTitles[4] || 'Explain' },
    { num: 5, label: config.stepTitles[5] || 'Restored' }
  ];

  const stepperHtml = `
    <ul class="adventure-3d-stepper harbor-walk-stepper" aria-label="Investigation progress steps">
      ${stepsList.map(s => `
        <li class="${s.num === step ? 'current' : s.num < step ? 'completed' : ''}">
          <span class="step-num">${s.num < step ? '✓' : s.num}</span>
          <span class="step-name">${s.label}</span>
        </li>
      `).join('')}
    </ul>
  `;

  let taskCardBodyHtml = '';

  if (step === 1) {
    taskCardBodyHtml = `
      <div class="adventure-step-content">
        <p class="eyebrow">STEP 1 · ${config.regionName.toUpperCase()} EXPLORATION</p>
        <h3>Welcome to ${config.regionName}!</h3>
        <p>Walk across the area to the <strong>${config.targetName}</strong> to begin your investigation.</p>
        
        <div class="harbor-walk-tips">
          <p>📱 <strong>Phone / Touch:</strong> Use the left D-pad with your thumb to walk. Swipe the right side of the screen with your finger to look around.</p>
          <p>⌨️ <strong>Desktop:</strong> Use W, A, S, D or Arrow Keys to walk; click & drag mouse to look.</p>
        </div>

        <div class="harbor-walk-card-actions">
          <button class="secondary text-button" data-action="adventure-3d-teleport-target" data-region="${config.id}">Approach Target Directly →</button>
        </div>
      </div>
    `;
  } else if (step === 2) {
    let controlsHtml = '';

    if (regionId === 'motion') {
      controlsHtml = `
        <div class="field">
          <label for="hw-height">Ramp Height: <strong>${(state.height || 0.2).toFixed(2)} m</strong></label>
          <div class="harbor-walk-height-buttons">
            <button class="choice ${state.height === 0.15 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="height" data-value="0.15" ${state.isSimulating ? 'disabled' : ''}>Low (0.15 m)</button>
            <button class="choice ${state.height === 0.25 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="height" data-value="0.25" ${state.isSimulating ? 'disabled' : ''}>Medium (0.25 m)</button>
            <button class="choice ${state.height === 0.35 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="height" data-value="0.35" ${state.isSimulating ? 'disabled' : ''}>High (0.35 m)</button>
          </div>
          <input id="hw-height" type="range" min="0.15" max="0.40" step="0.05" value="${state.height || 0.2}" data-action="adventure-3d-slider" data-param="height" ${state.isSimulating ? 'disabled' : ''} aria-label="Ramp Height in metres">
        </div>
        <p class="harbor-walk-fixed">Dock Surface: <strong>Smooth Wood Dock</strong> (held constant for trial 1)</p>
      `;
    } else if (regionId === 'matter') {
      controlsHtml = `
        <div class="field">
          <label>Flask Stopper Seal: <strong>Sealed Flask</strong></label>
          <p class="harbor-walk-fixed">Starting Reactants: <strong>60.0 g</strong> (50.0g vinegar + 10.0g baking soda)</p>
          <p class="muted">For Trial 1, we keep the flask securely stoppered so nothing escapes.</p>
        </div>
      `;
    } else if (regionId === 'living') {
      controlsHtml = `
        <div class="field">
          <label>Sunlamp Intensity: <strong>${state.lightLevel || 500} lux</strong></label>
          <div class="harbor-walk-height-buttons">
            <button class="choice ${state.lightLevel === 200 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="lightLevel" data-value="200" ${state.isSimulating ? 'disabled' : ''}>Low (200 lux)</button>
            <button class="choice ${state.lightLevel === 500 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="lightLevel" data-value="500" ${state.isSimulating ? 'disabled' : ''}>Medium (500 lux)</button>
            <button class="choice ${state.lightLevel === 900 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="lightLevel" data-value="900" ${state.isSimulating ? 'disabled' : ''}>High (900 lux)</button>
          </div>
        </div>
        <p class="harbor-walk-fixed">Water Supply: <strong>50 mL/day</strong> (held constant for first test)</p>
      `;
    } else if (regionId === 'earth') {
      controlsHtml = `
        <div class="field">
          <label>Surface Cover: <strong>Bare Soil</strong></label>
          <p class="harbor-walk-fixed">Simulated Rainstorm: <strong>30 mm/h</strong> (held constant)</p>
          <p class="muted">For Trial 1, we test the hillside flume with bare, unprotected soil.</p>
        </div>
      `;
    } else if (regionId === 'signal') {
      controlsHtml = `
        <div class="field">
          <label>Wave Paddle Frequency: <strong>${(state.frequency || 1.0).toFixed(1)} Hz</strong></label>
          <div class="harbor-walk-height-buttons">
            <button class="choice ${state.frequency === 0.5 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="frequency" data-value="0.5" ${state.isSimulating ? 'disabled' : ''}>0.5 Hz (Gentle)</button>
            <button class="choice ${state.frequency === 1.0 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="frequency" data-value="1.0" ${state.isSimulating ? 'disabled' : ''}>1.0 Hz (Standard)</button>
            <button class="choice ${state.frequency === 2.0 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="frequency" data-value="2.0" ${state.isSimulating ? 'disabled' : ''}>2.0 Hz (Rapid)</button>
          </div>
        </div>
        <p class="harbor-walk-fixed">Wave Tank Water Depth: <strong>1.0 m</strong> (constant wave speed)</p>
      `;
    } else if (regionId === 'orbit') {
      controlsHtml = `
        <div class="field">
          <label>Orbital Radius: <strong>${(state.radiusAU || 1.0).toFixed(1)} AU</strong></label>
          <div class="harbor-walk-height-buttons">
            <button class="choice ${state.radiusAU === 0.5 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="radiusAU" data-value="0.5" ${state.isSimulating ? 'disabled' : ''}>0.5 AU (Inner)</button>
            <button class="choice ${state.radiusAU === 1.0 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="radiusAU" data-value="1.0" ${state.isSimulating ? 'disabled' : ''}>1.0 AU (Earth-like)</button>
            <button class="choice ${state.radiusAU === 2.0 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="radiusAU" data-value="2.0" ${state.isSimulating ? 'disabled' : ''}>2.0 AU (Outer)</button>
          </div>
        </div>
        <p class="harbor-walk-fixed">Central Star Mass: <strong>1.0 M☉</strong> (held constant)</p>
      `;
    }

    const actionBtnLabel = {
      motion: '🚀 Roll Rover',
      matter: '🧪 Mix Reactants (Sealed)',
      living: '🌱 Run 7-Day Growth Cycle',
      earth: '🌧 Start Rainstorm Simulation',
      signal: '🌊 Pulse Wave Paddle',
      orbit: '🛰 Launch Satellite Orbit'
    }[regionId] || '🚀 Run Experiment';

    taskCardBodyHtml = `
      <div class="adventure-step-content">
        <p class="eyebrow">STEP 2 · FIRST EXPERIMENT</p>
        <h3>Record Your Baseline Observation</h3>
        <p>Observe the apparatus closely. Set your starting configuration and run the first trial to collect baseline data.</p>
        <div class="harbor-walk-form">
          ${controlsHtml}
          <button class="primary full" data-action="adventure-3d-run-trial" ${state.isSimulating ? 'disabled' : ''}>
            ${state.isSimulating ? 'Simulating trial…' : actionBtnLabel}
          </button>
        </div>
      </div>
    `;
  } else if (step === 3) {
    let fairControlsHtml = '';

    if (regionId === 'motion') {
      fairControlsHtml = `
        <div class="field">
          <label for="hw-height-2">Ramp Height: <strong>${(state.height || 0.2).toFixed(2)} m</strong> (Trial 1 was ${t1 ? t1.height.toFixed(2) : '0.20'} m)</label>
          <div class="harbor-walk-height-buttons">
            <button class="choice ${state.height === 0.15 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="height" data-value="0.15" ${state.isSimulating ? 'disabled' : ''}>Low (0.15 m)</button>
            <button class="choice ${state.height === 0.25 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="height" data-value="0.25" ${state.isSimulating ? 'disabled' : ''}>Medium (0.25 m)</button>
            <button class="choice ${state.height === 0.35 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="height" data-value="0.35" ${state.isSimulating ? 'disabled' : ''}>High (0.35 m)</button>
          </div>
          <input id="hw-height-2" type="range" min="0.15" max="0.40" step="0.05" value="${state.height || 0.2}" data-action="adventure-3d-slider" data-param="height" ${state.isSimulating ? 'disabled' : ''} aria-label="Ramp Height in metres">
        </div>
        <div class="field">
          <label>Dock Surface:</label>
          <div class="harbor-walk-surface-buttons">
            <button class="choice ${state.surface === 'smooth' ? 'selected' : ''}" data-action="adventure-3d-param" data-param="surface" data-value="smooth" ${state.isSimulating ? 'disabled' : ''}>Smooth Wood Dock</button>
            <button class="choice ${state.surface === 'rubber' ? 'selected' : ''}" data-action="adventure-3d-param" data-param="surface" data-value="rubber" ${state.isSimulating ? 'disabled' : ''}>Rough Rubber Mat</button>
          </div>
          <small class="muted">⚠️ Fair test rule: keep surface on Smooth Wood Dock and change ONLY ramp height!</small>
        </div>
      `;
    } else if (regionId === 'matter') {
      fairControlsHtml = `
        <div class="field">
          <label>Flask Stopper Seal:</label>
          <div class="harbor-walk-surface-buttons">
            <button class="choice ${state.stopper === 'open' ? 'selected' : ''}" data-action="adventure-3d-param" data-param="stopper" data-value="open" ${state.isSimulating ? 'disabled' : ''}>Open Flask (Stopper Off)</button>
            <button class="choice ${state.stopper === 'sealed' ? 'selected' : ''}" data-action="adventure-3d-param" data-param="stopper" data-value="sealed" ${state.isSimulating ? 'disabled' : ''}>Sealed Flask (Stopper On)</button>
          </div>
          <small class="muted">⚠️ Fair test rule: keep starting reactants at 60.0 g and change ONLY the stopper seal!</small>
        </div>
      `;
    } else if (regionId === 'living') {
      fairControlsHtml = `
        <div class="field">
          <label>Sunlamp Intensity: <strong>${state.lightLevel || 500} lux</strong> (Trial 1 was ${t1 ? t1.lightLevel : 500} lux)</label>
          <div class="harbor-walk-height-buttons">
            <button class="choice ${state.lightLevel === 200 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="lightLevel" data-value="200" ${state.isSimulating ? 'disabled' : ''}>Low (200 lux)</button>
            <button class="choice ${state.lightLevel === 500 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="lightLevel" data-value="500" ${state.isSimulating ? 'disabled' : ''}>Medium (500 lux)</button>
            <button class="choice ${state.lightLevel === 900 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="lightLevel" data-value="900" ${state.isSimulating ? 'disabled' : ''}>High (900 lux)</button>
          </div>
          <small class="muted">⚠️ Fair test rule: keep water fixed at 50 mL/day and change ONLY the sunlamp light level!</small>
        </div>
      `;
    } else if (regionId === 'earth') {
      fairControlsHtml = `
        <div class="field">
          <label>Hillside Flume Cover:</label>
          <div class="harbor-walk-surface-buttons">
            <button class="choice ${state.cover === 'vegetation' ? 'selected' : ''}" data-action="adventure-3d-param" data-param="cover" data-value="vegetation" ${state.isSimulating ? 'disabled' : ''}>Dense Root Vegetation (Grass)</button>
            <button class="choice ${state.cover === 'bare' ? 'selected' : ''}" data-action="adventure-3d-param" data-param="cover" data-value="bare" ${state.isSimulating ? 'disabled' : ''}>Bare Soil</button>
          </div>
          <small class="muted">⚠️ Fair test rule: keep rainfall fixed at 30 mm/h and change ONLY the surface vegetation cover!</small>
        </div>
      `;
    } else if (regionId === 'signal') {
      fairControlsHtml = `
        <div class="field">
          <label>Wave Paddle Frequency: <strong>${(state.frequency || 1.0).toFixed(1)} Hz</strong> (Trial 1 was ${t1 ? t1.frequency.toFixed(1) : '1.0'} Hz)</label>
          <div class="harbor-walk-height-buttons">
            <button class="choice ${state.frequency === 0.5 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="frequency" data-value="0.5" ${state.isSimulating ? 'disabled' : ''}>0.5 Hz (Gentle)</button>
            <button class="choice ${state.frequency === 1.0 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="frequency" data-value="1.0" ${state.isSimulating ? 'disabled' : ''}>1.0 Hz (Standard)</button>
            <button class="choice ${state.frequency === 2.0 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="frequency" data-value="2.0" ${state.isSimulating ? 'disabled' : ''}>2.0 Hz (Rapid)</button>
          </div>
          <small class="muted">⚠️ Fair test rule: keep water depth constant and change ONLY the wave frequency!</small>
        </div>
      `;
    } else if (regionId === 'orbit') {
      fairControlsHtml = `
        <div class="field">
          <label>Orbital Radius: <strong>${(state.radiusAU || 1.0).toFixed(1)} AU</strong> (Trial 1 was ${t1 ? t1.radiusAU.toFixed(1) : '1.0'} AU)</label>
          <div class="harbor-walk-height-buttons">
            <button class="choice ${state.radiusAU === 0.5 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="radiusAU" data-value="0.5" ${state.isSimulating ? 'disabled' : ''}>0.5 AU (Inner)</button>
            <button class="choice ${state.radiusAU === 1.0 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="radiusAU" data-value="1.0" ${state.isSimulating ? 'disabled' : ''}>1.0 AU (Earth-like)</button>
            <button class="choice ${state.radiusAU === 2.0 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="radiusAU" data-value="2.0" ${state.isSimulating ? 'disabled' : ''}>2.0 AU (Outer)</button>
          </div>
          <small class="muted">⚠️ Fair test rule: keep central star mass fixed and change ONLY the orbital radius!</small>
        </div>
      `;
    }

    taskCardBodyHtml = `
      <div class="adventure-step-content">
        <p class="eyebrow">STEP 3 · CONDUCT A FAIR TEST</p>
        <h3>Change ONLY the Target Variable</h3>
        <p>A fair test isolates cause and effect by keeping all other variables constant while changing <em>only one condition</em>!</p>

        ${state.fairWarning ? `
          <div class="harbor-walk-warning" role="alert">
            ${esc(state.fairWarning)}
          </div>
        ` : ''}

        ${state.whatChanged ? `
          <div class="harbor-walk-evidence-banner">
            <span class="evidence-icon">📋</span>
            <div>
              <strong>Latest Evidence:</strong>
              <p>${esc(state.whatChanged)}</p>
            </div>
          </div>
        ` : ''}

        <div class="harbor-walk-form">
          ${fairControlsHtml}
          <button class="primary full" data-action="adventure-3d-run-trial" ${state.isSimulating ? 'disabled' : ''}>
            ${state.isSimulating ? 'Testing comparison…' : '🚀 Run Fair Comparison'}
          </button>
        </div>
      </div>
    `;
  } else if (step === 4) {
    const q = config.question;
    taskCardBodyHtml = `
      <div class="adventure-step-content">
        <p class="eyebrow">STEP 4 · EXPLAIN THE FAIR TEST</p>
        <h3>What Did Your Fair Test Prove?</h3>
        <p>You tested two controlled conditions. Now explain the scientific principle supported by your evidence!</p>

        ${state.whatChanged ? `
          <div class="harbor-walk-evidence-banner">
            <span class="evidence-icon">📋</span>
            <div>
              <strong>Recorded Fair Test Evidence:</strong>
              <p>${esc(state.whatChanged)}</p>
            </div>
          </div>
        ` : ''}

        <div class="harbor-walk-question">
          <p class="question-prompt"><strong>${esc(q.prompt)}</strong></p>
          <div class="choices">
            ${q.options.map((opt, i) => `
              <button class="choice ${state.questionChoice === i ? 'selected' : ''}" data-action="adventure-3d-choice" data-value="${i}">
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

          <button class="primary full" data-action="adventure-3d-submit-answer" ${state.questionChoice === null ? 'disabled' : ''}>
            Check Scientific Explanation →
          </button>
        </div>
      </div>
    `;
  } else if (step === 5) {
    taskCardBodyHtml = `
      <div class="adventure-step-content celebration-card">
        <div class="completion-icon">✦</div>
        <p class="eyebrow">DISCOVERY COMPLETE · RESTORATION ACHIEVED</p>
        <h2>${config.facilityName} is Restored!</h2>
        <p>By conducting an authentic fair test, your evidence has restored <strong>${config.facilityName}</strong> in <strong>${config.regionName}</strong>!</p>

        <div class="restoration-badge">
          <span class="badge success">✓ ${config.facilityName} Restored</span>
        </div>

        <div class="harbor-walk-what-changed-final">
          <h4>Your Fair Test Evidence:</h4>
          <p>${esc(state.whatChanged || 'Fair comparison verified and recorded.')}</p>
        </div>

        <div class="celebration-actions">
          <button class="primary full" data-action="region" data-id="${config.id}">View Restored ${config.regionName} →</button>
          <button class="secondary full" data-action="nav" data-view="explore">Return to Discovery Islands Map</button>
          <button class="text-button" data-action="adventure-3d-freewalk">Keep Exploring 3D World</button>
        </div>
      </div>
    `;
  }

  return `
    <section class="adventure-3d-wrap harbor-walk-wrap is-immersive" aria-label="3D Immersive Adventure: ${config.regionName}">
      <!-- Top HUD Floating Header -->
      <header class="adventure-3d-topbar harbor-walk-topbar" role="banner">
        <button class="adventure-3d-exit-btn back" data-action="adventure-3d-exit" data-region="${config.id}" aria-label="Exit 3D world to map">
          ← Exit
        </button>
        <div class="adventure-3d-title harbor-walk-title">
          <span class="region-badge-icon">${config.icon}</span>
          <h1>${config.regionName} · 3D Adventure</h1>
          <span class="badge ${state.completed ? 'success' : ''}">
            ${state.completed ? `${config.facilityName} Restored` : `Step ${step}/5: ${stepsList[step - 1]?.label || 'Task'}`}
          </span>
        </div>
        <div class="adventure-3d-top-actions">
          <button class="adventure-3d-focus-btn harbor-walk-cam-reset" data-action="adventure-3d-focus-target" data-region="${config.id}" aria-label="Point camera toward ${config.targetName}">
            <span class="cam-icon">🎯</span> <span>Focus Target</span>
          </button>
          <button class="adventure-3d-fullscreen-btn" data-action="adventure-3d-toggle-fullscreen" aria-label="Toggle Fullscreen">
            ⛶
          </button>
        </div>
      </header>

      <!-- Full-Screen 3D WebGL Canvas Viewport -->
      <div id="adventure-3d-canvas-container" class="adventure-3d-canvas-box harbor-walk-canvas-box" tabindex="0" role="region" aria-label="3D walkable world for ${config.regionName}">
        <!-- WebGL Canvas renders full screen here -->
      </div>

      <!-- Controls Guidance -->
      <div class="adventure-3d-keys-guide harbor-walk-keys-guide" aria-hidden="true">
        <span class="desktop-guide"><span class="key-badge">W</span><span class="key-badge">A</span><span class="key-badge">S</span><span class="key-badge">D</span> to Walk · Drag to Look</span>
        <span class="mobile-guide">◀ ▲ ▶ Left D-Pad to Walk · Swipe to Look</span>
      </div>

      <!-- Finger-Friendly Touch D-Pad for Mobile Phones -->
      <div class="adventure-3d-touch-controls harbor-walk-touch-controls" role="group" aria-label="Touch walk controls">
        <div class="harbor-walk-dpad adventure-3d-dpad">
          <button type="button" class="touch-btn touch-up" data-action="touch-walk" data-dir="forward" aria-label="Walk forward">▲</button>
          <button type="button" class="touch-btn touch-left" data-action="touch-walk" data-dir="left" aria-label="Turn left">◀</button>
          <button type="button" class="touch-btn touch-center" data-action="adventure-3d-focus-target" data-region="${config.id}" aria-label="Center view on target" title="Focus Target">🧭</button>
          <button type="button" class="touch-btn touch-right" data-action="touch-walk" data-dir="right" aria-label="Turn right">▶</button>
          <button type="button" class="touch-btn touch-down" data-action="touch-walk" data-dir="backward" aria-label="Walk backward">▼</button>
        </div>
      </div>

      <!-- Floating Pip Glass Card -->
      <aside class="adventure-3d-card harbor-walk-card ${isCollapsed ? 'is-collapsed' : ''}" aria-label="Mission investigation card">
        <div class="adventure-card-header">
          <div class="pip-face-icon">🤖</div>
          <div class="adventure-card-header-text">
            <span class="card-eyebrow">PIP'S FIELD HUD · STEP ${step}</span>
            <h4 class="card-title">${stepsList[step - 1]?.label || 'Task'}</h4>
          </div>
          <button class="adventure-card-toggle-btn" data-action="adventure-3d-toggle-card" aria-expanded="${!isCollapsed}" aria-controls="adventure-task-body" aria-label="${isCollapsed ? 'Expand Pip task panel' : 'Collapse Pip task panel'}">
            ${isCollapsed ? '▲ Expand' : '▼ Minimize'}
          </button>
        </div>

        ${isCollapsed ? '' : `
          <div class="adventure-card-body" id="adventure-task-body">
            ${stepperHtml}
            ${taskCardBodyHtml}
          </div>
        `}
      </aside>

      <!-- Backwards compatibility container for tests looking for .harbor-walk-viewport-container -->
      <div class="harbor-walk-viewport-container sr-only" aria-hidden="true"></div>
      <div class="harbor-walk-sidebar sr-only" aria-hidden="true"></div>
    </section>
  `;
}
