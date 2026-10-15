import {esc} from './visuals.js';
import {ADVENTURE_CONFIGS} from './adventures-3d-data.js';

export function adventure3DView(regionId, profile, state) {
  const config = ADVENTURE_CONFIGS[regionId] || ADVENTURE_CONFIGS.motion;
  const step = state.step || 1;
  const isCollapsed = !!state.cardCollapsed;
  const activeTab = state.activeTab || 'tune';
  const funds = Math.floor(state.funds ?? 220);
  const metrics = config.calculateTycoonMetrics(state);

  const stepsList = [
    { num: 1, label: config.stepTitles[1] || 'Inspect' },
    { num: 2, label: config.stepTitles[2] || 'Tune' },
    { num: 3, label: config.stepTitles[3] || 'Optimize' },
    { num: 4, label: config.stepTitles[4] || 'Expand' },
    { num: 5, label: config.stepTitles[5] || 'Thriving' }
  ];

  // Region switcher pills so player can manage all 6 islands like SimCity
  const regionTabsHtml = Object.values(ADVENTURE_CONFIGS).map(r => `
    <button type="button" class="tycoon-sector-pill ${r.id === config.id ? 'active' : ''}" data-action="open-3d-adventure" data-region="${r.id}" title="Switch to ${esc(r.regionName)}">
      <span>${r.icon}</span>
      <span class="sector-pill-name">${esc(r.regionName.split(' ')[0])}</span>
    </button>
  `).join('');

  // Region-specific live tuning controls (No quizzes—pure live physics & science tuning!)
  let tunerControlsHtml = '';

  if (regionId === 'motion') {
    tunerControlsHtml = `
      <div class="tycoon-control-group">
        <div class="tycoon-control-header">
          <label for="hw-height">📐 Ramp Elevation (Potential Energy)</label>
          <strong id="adv-slider-val" class="tycoon-val-pill">${(state.height || 0.2).toFixed(2)} m</strong>
        </div>
        <div class="harbor-walk-height-buttons">
          <button class="choice ${Math.abs((state.height || 0.2) - 0.15) < 0.02 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="height" data-value="0.15">Low (0.15 m)</button>
          <button class="choice ${Math.abs((state.height || 0.2) - 0.25) < 0.02 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="height" data-value="0.25">Med (0.25 m)</button>
          <button class="choice ${Math.abs((state.height || 0.2) - 0.35) < 0.02 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="height" data-value="0.35">High (0.35 m)</button>
        </div>
        <input id="hw-height" type="range" min="0.15" max="0.40" step="0.05" value="${state.height || 0.2}" data-action="adventure-3d-slider" data-param="height" data-unit="m" aria-label="Ramp Height in metres">
      </div>

      <div class="tycoon-control-group">
        <div class="tycoon-control-header">
          <label>🛞 Pier Deck Surface (Rolling Friction)</label>
        </div>
        <div class="harbor-walk-surface-buttons">
          <button class="choice ${state.surface === 'smooth' ? 'selected' : ''}" data-action="adventure-3d-param" data-param="surface" data-value="smooth">🪵 Smooth Wood (Low Friction)</button>
          <button class="choice ${state.surface === 'rubber' ? 'selected' : ''}" data-action="adventure-3d-param" data-param="surface" data-value="rubber">🧽 Rough Rubber (High Friction)</button>
        </div>
      </div>
    `;
  } else if (regionId === 'matter') {
    tunerControlsHtml = `
      <div class="tycoon-control-group">
        <div class="tycoon-control-header">
          <label>🔒 Reactor Vessel Containment (System Boundary)</label>
        </div>
        <div class="harbor-walk-surface-buttons">
          <button class="choice ${state.stopper === 'sealed' ? 'selected' : ''}" data-action="adventure-3d-param" data-param="stopper" data-value="sealed">🔒 Sealed Pressure Dome (Closed)</button>
          <button class="choice ${state.stopper === 'open' ? 'selected' : ''}" data-action="adventure-3d-param" data-param="stopper" data-value="open">💨 Open Vent (Unsealed)</button>
        </div>
      </div>

      <div class="tycoon-control-group">
        <div class="tycoon-control-header">
          <label>⚖️ Reactant Batch Feed Mass</label>
          <strong class="tycoon-val-pill">${(state.reactantsMass || 60).toFixed(0)} g</strong>
        </div>
        <div class="harbor-walk-height-buttons">
          <button class="choice ${state.reactantsMass === 40 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="reactantsMass" data-value="40">40 g (Under)</button>
          <button class="choice ${state.reactantsMass === 60 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="reactantsMass" data-value="60">60 g (Optimal)</button>
          <button class="choice ${state.reactantsMass === 80 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="reactantsMass" data-value="80">80 g (Over)</button>
        </div>
      </div>
    `;
  } else if (regionId === 'living') {
    tunerControlsHtml = `
      <div class="tycoon-control-group">
        <div class="tycoon-control-header">
          <label>☀️ Solar Grow-Lamp Intensity (Photosynthesis)</label>
          <strong class="tycoon-val-pill">${state.lightLevel || 200} lux</strong>
        </div>
        <div class="harbor-walk-height-buttons">
          <button class="choice ${state.lightLevel === 200 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="lightLevel" data-value="200">200 lux (Dim)</button>
          <button class="choice ${state.lightLevel === 500 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="lightLevel" data-value="500">500 lux (Med)</button>
          <button class="choice ${state.lightLevel === 900 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="lightLevel" data-value="900">900 lux (Peak)</button>
        </div>
      </div>

      <div class="tycoon-control-group">
        <div class="tycoon-control-header">
          <label>💧 Automated Root Irrigation</label>
          <strong class="tycoon-val-pill">${state.waterPerDay || 50} mL/day</strong>
        </div>
        <div class="harbor-walk-height-buttons">
          <button class="choice ${state.waterPerDay === 20 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="waterPerDay" data-value="20">20 mL (Dry)</button>
          <button class="choice ${state.waterPerDay === 50 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="waterPerDay" data-value="50">50 mL (Ideal)</button>
          <button class="choice ${state.waterPerDay === 90 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="waterPerDay" data-value="90">90 mL (Flood)</button>
        </div>
      </div>
    `;
  } else if (regionId === 'earth') {
    tunerControlsHtml = `
      <div class="tycoon-control-group">
        <div class="tycoon-control-header">
          <label>🌲 Hillside Slope Cover (Erosion Control)</label>
        </div>
        <div class="harbor-walk-surface-buttons">
          <button class="choice ${state.cover === 'bare' ? 'selected' : ''}" data-action="adventure-3d-param" data-param="cover" data-value="bare">🟫 Bare Soil (Unprotected)</button>
          <button class="choice ${state.cover === 'vegetation' ? 'selected' : ''}" data-action="adventure-3d-param" data-param="cover" data-value="vegetation">🌲 Dense Root Forest (Anchored)</button>
        </div>
      </div>

      <div class="tycoon-control-group">
        <div class="tycoon-control-header">
          <label>🌧️ Reservoir Stormflow Gate</label>
          <strong class="tycoon-val-pill">${state.rainfallRate || 30} mm/h</strong>
        </div>
        <div class="harbor-walk-height-buttons">
          <button class="choice ${state.rainfallRate === 15 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="rainfallRate" data-value="15">15 mm/h (Low)</button>
          <button class="choice ${state.rainfallRate === 30 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="rainfallRate" data-value="30">30 mm/h (Optimal)</button>
          <button class="choice ${state.rainfallRate === 50 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="rainfallRate" data-value="50">50 mm/h (Surge)</button>
        </div>
      </div>
    `;
  } else if (regionId === 'signal') {
    tunerControlsHtml = `
      <div class="tycoon-control-group">
        <div class="tycoon-control-header">
          <label>🌊 Wave Oscillator Frequency (f)</label>
          <strong class="tycoon-val-pill">${(state.frequency || 1.0).toFixed(1)} Hz</strong>
        </div>
        <div class="harbor-walk-height-buttons">
          <button class="choice ${state.frequency === 0.5 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="frequency" data-value="0.5">0.5 Hz (λ=8m)</button>
          <button class="choice ${state.frequency === 1.0 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="frequency" data-value="1.0">1.0 Hz (λ=4m)</button>
          <button class="choice ${state.frequency === 2.0 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="frequency" data-value="2.0">2.0 Hz (λ=2m Sync)</button>
        </div>
      </div>

      <div class="tycoon-control-group">
        <div class="tycoon-control-header">
          <label>⚓ Channel Water Depth (Wave Speed Medium)</label>
          <strong class="tycoon-val-pill">${(state.waterDepth || 1.0).toFixed(1)} m</strong>
        </div>
        <div class="harbor-walk-surface-buttons">
          <button class="choice ${state.waterDepth === 1.0 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="waterDepth" data-value="1.0">1.0 m (Calibrated v=4m/s)</button>
          <button class="choice ${state.waterDepth === 2.5 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="waterDepth" data-value="2.5">2.5 m (Deep Drift)</button>
        </div>
      </div>
    `;
  } else if (regionId === 'orbit') {
    tunerControlsHtml = `
      <div class="tycoon-control-group">
        <div class="tycoon-control-header">
          <label>🪐 Satellite Orbital Radius (Kepler Distance)</label>
          <strong class="tycoon-val-pill">${(state.radiusAU || 1.0).toFixed(1)} AU</strong>
        </div>
        <div class="harbor-walk-height-buttons">
          <button class="choice ${state.radiusAU === 0.5 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="radiusAU" data-value="0.5">0.5 AU (4.2s Fast)</button>
          <button class="choice ${state.radiusAU === 1.0 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="radiusAU" data-value="1.0">1.0 AU (12s Mid)</button>
          <button class="choice ${state.radiusAU === 2.0 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="radiusAU" data-value="2.0">2.0 AU (33.9s Sync)</button>
        </div>
      </div>

      <div class="tycoon-control-group">
        <div class="tycoon-control-header">
          <label>☀️ Central Star Mass Lock (Gravity Source)</label>
          <strong class="tycoon-val-pill">${(state.starMass || 1.0).toFixed(1)} M☉</strong>
        </div>
        <div class="harbor-walk-surface-buttons">
          <button class="choice ${state.starMass === 1.0 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="starMass" data-value="1.0">1.0 M☉ (Solar Standard)</button>
          <button class="choice ${state.starMass === 2.0 ? 'selected' : ''}" data-action="adventure-3d-param" data-param="starMass" data-value="2.0">2.0 M☉ (Heavy Star)</button>
        </div>
      </div>
    `;
  }

  // Buildings grid for the "Build & Upgrade" tab
  const lvls = state.buildingLevels || {};
  const buildingsHtml = (config.buildings || []).map(b => {
    const lvl = lvls[b.id] || 0;
    const cost = Math.round(b.baseCost * Math.pow(1.5, lvl));
    const currentInc = lvl > 0 ? Math.round(b.baseIncome * (1 + (lvl - 1) * 0.6)) : 0;
    const nextInc = Math.round(b.baseIncome * (1 + lvl * 0.6));
    const canAfford = funds >= cost && lvl < 3;
    return `
      <div class="tycoon-bldg-card ${lvl > 0 ? 'is-built' : 'is-unbuilt'}">
        <div class="tycoon-bldg-icon">${b.icon}</div>
        <div class="tycoon-bldg-info">
          <div class="tycoon-bldg-title-row">
            <strong>${esc(b.name)}</strong>
            <span class="tycoon-lvl-badge ${lvl > 0 ? 'built' : ''}">${lvl === 0 ? 'Unbuilt' : `Lv.${lvl}`}</span>
          </div>
          <p class="tycoon-bldg-desc">${esc(b.desc)}</p>
          <div class="tycoon-bldg-stats">
            <span>Income: <b>+$${currentInc}/s</b> → <b class="next-inc">+$${nextInc}/s</b></span>
          </div>
        </div>
        <button type="button" class="tycoon-build-btn ${canAfford ? 'can-afford' : ''}" data-action="tycoon-build" data-bldg="${b.id}" ${lvl >= 3 ? 'disabled' : ''}>
          ${lvl >= 3 ? '✓ MAX' : lvl === 0 ? `🔨 Build $${cost}` : `⬆️ Upgr $${cost}`}
        </button>
      </div>
    `;
  }).join('');

  return `
    <section class="adventure-3d-wrap harbor-walk-wrap is-immersive" aria-label="3D Island Tycoon: ${config.regionName}">
      <!-- Top HUD Floating SimCity / Tycoon Bar -->
      <header class="adventure-3d-topbar harbor-walk-topbar tycoon-topbar" role="banner">
        <div class="tycoon-topbar-left">
          <button class="adventure-3d-exit-btn back" data-action="adventure-3d-exit" data-region="${config.id}" aria-label="Exit 3D world to map">
            ← Map
          </button>
          <div class="tycoon-sector-switcher" role="navigation" aria-label="Switch Island Sector">
            ${regionTabsHtml}
          </div>
        </div>

        <div class="tycoon-economy-strip" aria-live="polite">
          <div class="econ-pill econ-funds" title="Island Treasury & Income Rate">
            <span class="econ-icon">💰</span>
            <div>
              <strong id="tycoon-funds-val">$${funds}</strong>
              <small id="tycoon-income-val">+$${metrics.totalIncome}/s</small>
            </div>
          </div>
          <div class="econ-pill econ-efficiency ${metrics.isOptimal ? 'optimal' : 'suboptimal'}" title="Science Machine Efficiency">
            <span class="econ-icon">⚙️</span>
            <div>
              <strong id="tycoon-eff-val">${metrics.efficiency}%</strong>
              <small>Efficiency</small>
            </div>
          </div>
          <div class="econ-pill econ-power" title="Grid Power Output">
            <span class="econ-icon">⚡</span>
            <div>
              <strong id="tycoon-power-val">${metrics.powerMW} MW</strong>
              <small>Eco ${metrics.ecoScore}%</small>
            </div>
          </div>
          <div class="econ-pill econ-prosperity" title="Sector Prosperity & Restoration">
            <span class="econ-icon">🏆</span>
            <div>
              <strong id="tycoon-prosperity-val">${metrics.prosperity}%</strong>
              <small>${state.completed ? 'Restored' : `Step ${step}/5`}</small>
            </div>
          </div>
        </div>

        <div class="adventure-3d-top-actions">
          <div class="adventure-3d-title harbor-walk-title sr-only">
            <h1>${config.regionName} · Step ${step} of 5</h1>
          </div>
          <button class="adventure-3d-focus-btn harbor-walk-cam-reset" data-action="adventure-3d-focus-target" data-region="${config.id}" aria-label="Point camera toward ${config.targetName}">
            <span class="cam-icon">🎯</span> <span>Center</span>
          </button>
          <button class="adventure-3d-fullscreen-btn" data-action="adventure-3d-toggle-fullscreen" aria-label="Toggle Fullscreen">
            ⛶
          </button>
        </div>
      </header>

      <!-- Full-Screen 3D WebGL Canvas Viewport -->
      <div id="adventure-3d-canvas-container" class="adventure-3d-canvas-box harbor-walk-canvas-box" tabindex="0" role="region" aria-label="3D Sim-Tycoon world for ${config.regionName}">
        <!-- WebGL Canvas renders full screen here -->
      </div>

      <!-- Controls Guidance -->
      <div class="adventure-3d-keys-guide harbor-walk-keys-guide" aria-hidden="true">
        <span class="desktop-guide"><span class="key-badge">W</span><span class="key-badge">A</span><span class="key-badge">S</span><span class="key-badge">D</span> Walk · Drag to Orbit · Tune & Build on Right</span>
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

      <!-- Floating Sim-Tycoon Command Dock -->
      <aside class="adventure-3d-card harbor-walk-card tycoon-dock ${isCollapsed ? 'is-collapsed' : ''}" aria-label="Tycoon Command Dock">
        <div class="adventure-card-header">
          <div class="pip-face-icon">${config.icon}</div>
          <div class="adventure-card-header-text">
            <span class="card-eyebrow">${esc(config.tycoonTitle.toUpperCase())} · +$${metrics.totalIncome}/SEC · STEP ${step}</span>
            <h4 class="card-title">${state.completed ? `✓ ${config.facilityName} Thriving!` : `${config.regionName} Director`}</h4>
          </div>
          <button class="adventure-card-toggle-btn" data-action="adventure-3d-toggle-card" aria-expanded="${!isCollapsed}" aria-controls="adventure-task-body" aria-label="${isCollapsed ? 'Expand Tycoon Dock' : 'Minimize Tycoon Dock'}">
            ${isCollapsed ? '▲ Expand' : '▼ Hide'}
          </button>
        </div>

        ${isCollapsed ? '' : `
          <div class="adventure-card-body" id="adventure-task-body">
            <!-- Prosperity Progress Bar -->
            <div class="tycoon-prosperity-bar-wrap">
              <div class="tycoon-prosperity-labels">
                <span>🏙️ Sector Prosperity: <strong>${metrics.prosperity}%</strong></span>
                <span class="prosperity-goal">${state.completed ? '🏆 Facility Restored!' : 'Goal: Tune to 100% + Build'}</span>
              </div>
              <div class="tycoon-progress-track">
                <div class="tycoon-progress-fill ${metrics.isOptimal ? 'optimal' : ''}" style="width: ${metrics.prosperity}%"></div>
              </div>
            </div>

            <!-- Mode Tabs: Tune Science vs Build City -->
            <div class="tycoon-mode-tabs" role="tablist">
              <button type="button" class="tycoon-tab-btn ${activeTab === 'tune' ? 'active' : ''}" data-action="tycoon-tab" data-tab="tune">
                🎛️ Tune Science (${metrics.efficiency}%)
              </button>
              <button type="button" class="tycoon-tab-btn ${activeTab === 'build' ? 'active' : ''}" data-action="tycoon-tab" data-tab="build">
                🏗️ Build City (${Object.values(lvls).reduce((a, b) => a + b, 0)})
              </button>
            </div>

            ${activeTab === 'tune' ? `
              <div class="tycoon-tune-panel">
                <!-- Live Telemetry Readout -->
                <div class="tycoon-telemetry-box ${metrics.isOptimal ? 'is-optimal' : 'needs-tuning'}">
                  <div class="telemetry-top-row">
                    <span class="telemetry-label">${esc(metrics.metricLabel)}: <strong>${esc(metrics.metricValue)}</strong></span>
                    <span class="telemetry-target">Target: ${esc(metrics.metricTarget)}</span>
                  </div>
                  <p class="telemetry-status">${esc(metrics.statusText)}</p>
                  <p class="telemetry-science">🔬 ${esc(metrics.scienceInsight)}</p>
                </div>

                <!-- Interactive Sliders & Switches -->
                ${tunerControlsHtml}

                <!-- Action Row: Pulse 3D Simulation & Collect Grant -->
                <div class="tycoon-action-row">
                  <button type="button" class="primary full tycoon-pulse-btn" data-action="adventure-3d-run-trial" ${state.isSimulating ? 'disabled' : ''}>
                    ${state.isSimulating ? '⚙️ Simulating in 3D...' : `⚡ Test & Collect Shipment (+$${metrics.isOptimal ? 90 : 35})`}
                  </button>
                </div>
              </div>
            ` : `
              <div class="tycoon-build-panel">
                <p class="tycoon-build-intro">Construct and upgrade 3D facilities on your island! Higher science efficiency (${metrics.efficiency}%) multiplies all building profits.</p>
                <div class="tycoon-bldg-list">
                  ${buildingsHtml}
                </div>
              </div>
            `}
          </div>
        `}
      </aside>

      <!-- Backwards compatibility hooks for existing tests -->
      <div class="harbor-walk-viewport-container sr-only" aria-hidden="true">Step ${step} of 5</div>
      <div class="harbor-walk-sidebar sr-only" aria-hidden="true"></div>
    </section>
  `;
}
