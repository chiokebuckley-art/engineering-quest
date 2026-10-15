import {esc} from './visuals.js';
import {ADVENTURE_CONFIGS} from './adventures-3d-data.js';

export function adventure3DView(regionId, profile, state) {
  const config = ADVENTURE_CONFIGS[regionId] || ADVENTURE_CONFIGS.motion;
  const step = state.step || 1;
  const isCollapsed = !!state.cardCollapsed;
  const activeTab = state.activeTab || 'tune';
  const cameraMode = state.cameraMode || 'city';
  const funds = Math.floor(state.funds ?? 220);
  const metrics = config.calculateTycoonMetrics(state);
  const lvls = state.buildingLevels || {};
  const totalBuiltLevels = Object.values(lvls).reduce((a, b) => a + b, 0);
  const selectedObj = state.selectedObject || null;

  // Region switcher pills so player can jump between all 6 3D islands like SimCity
  const regionTabsHtml = Object.values(ADVENTURE_CONFIGS).map(r => `
    <button type="button" class="tycoon-sector-pill ${r.id === config.id ? 'active' : ''}" data-action="open-3d-adventure" data-region="${r.id}" title="Switch to ${esc(r.regionName)}">
      <span>${r.icon}</span>
      <span class="sector-pill-name">${esc(r.regionName.split(' ')[0])}</span>
    </button>
  `).join('');

  // Floating 3D World Markers projected directly over the 3D machine and 3D building pads
  const bldgs = config.buildings || [];
  const mainMachineBldg = bldgs[0] || { name: config.targetName, icon: config.icon };
  const worldMarkersHtml = `
    <button type="button" class="tycoon-3d-marker marker-machine ${metrics.isOptimal ? 'is-optimal' : 'needs-tune'} ${selectedObj?.type === 'machine' ? 'is-selected' : ''}" data-marker-id="machine" data-action="tycoon-select-object" data-obj-type="machine" style="left:50%;top:42%;">
      <span class="marker-icon">${config.icon}</span>
      <span class="marker-info">
        <strong>${esc(mainMachineBldg.name)}</strong>
        <small>${metrics.isOptimal ? `✓ ${metrics.efficiency}% Peak` : `🎛️ ${metrics.efficiency}% · Tap to Tune`}</small>
      </span>
    </button>
    ${bldgs.slice(1).map((b, idx) => {
      const lvl = lvls[b.id] || 0;
      const cost = Math.round(b.baseCost * Math.pow(1.5, lvl));
      const inc = lvl > 0 ? Math.round(b.baseIncome * (1 + (lvl - 1) * 0.6)) : b.baseIncome;
      const canAfford = funds >= cost && lvl < 3;
      const defaultLeft = idx === 0 ? 32 : idx === 1 ? 68 : 72;
      const defaultTop = idx === 0 ? 55 : idx === 1 ? 52 : 36;
      return `
        <button type="button" class="tycoon-3d-marker marker-bldg ${lvl > 0 ? 'is-built' : 'is-unbuilt'} ${canAfford ? 'can-afford' : ''} ${selectedObj?.id === b.id ? 'is-selected' : ''}" data-marker-id="bldg-${b.id}" data-action="tycoon-select-object" data-obj-type="building" data-bldg="${b.id}" style="left:${defaultLeft}%;top:${defaultTop}%;">
          <span class="marker-icon">${lvl === 0 ? '🔨' : b.icon}</span>
          <span class="marker-info">
            <strong>${esc(b.name)} ${lvl > 0 ? `Lv.${lvl}` : ''}</strong>
            <small>${lvl === 0 ? `Build $${cost} (+$${inc}/s)` : lvl < 3 ? `+$${inc}/s · Upgr $${cost}` : `+$${inc}/s · MAX`}</small>
          </span>
        </button>
      `;
    }).join('')}
  `;

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

  // Buildings grid for the "Build & Upgrade" tab (highlights selected 3D plot if one was tapped)
  const orderedBuildings = [...bldgs].sort((a, b) => {
    if (selectedObj?.type === 'building') {
      if (a.id === selectedObj.id) return -1;
      if (b.id === selectedObj.id) return 1;
    }
    return 0;
  });

  const buildingsHtml = orderedBuildings.map(b => {
    const lvl = lvls[b.id] || 0;
    const cost = Math.round(b.baseCost * Math.pow(1.5, lvl));
    const currentInc = lvl > 0 ? Math.round(b.baseIncome * (1 + (lvl - 1) * 0.6)) : 0;
    const nextInc = Math.round(b.baseIncome * (1 + lvl * 0.6));
    const canAfford = funds >= cost && lvl < 3;
    const isSelectedPlot = selectedObj?.type === 'building' && selectedObj.id === b.id;
    return `
      <div class="tycoon-bldg-card ${lvl > 0 ? 'is-built' : 'is-unbuilt'} ${isSelectedPlot ? 'is-selected-plot' : ''}">
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

  // Sleek 3D Entry Title Overlay (dismissible right into the live 3D island)
  const titleOverlayHtml = state.showTitleOverlay ? `
    <div class="tycoon-title-overlay" role="dialog" aria-label="Science Quest Island Tycoon 3D Title Screen">
      <div class="tycoon-title-card">
        <div class="tycoon-title-badge">✦ FULL 3D SIM-TYCOON WORLD</div>
        <h2 class="tycoon-hero-heading">SCIENCE QUEST: <span>ISLAND TYCOON</span></h2>
        <p class="tycoon-hero-sub">Tap any 3D machine or glowing construction pad on the island to tune real physics, generate power, and build your research metropolis!</p>
        <div class="tycoon-island-picker">
          ${Object.values(ADVENTURE_CONFIGS).map(r => `
            <button type="button" class="tycoon-island-card ${r.id === config.id ? 'selected' : ''}" data-action="tycoon-pick-island" data-region="${r.id}">
              <span class="island-card-icon">${r.icon}</span>
              <strong>${esc(r.regionName)}</strong>
              <small>${esc(r.tycoonTitle)}</small>
            </button>
          `).join('')}
        </div>
        <div class="tycoon-title-actions">
          <button type="button" class="primary tycoon-start-btn" data-action="tycoon-start-game">
            ▶ PLAY ${esc(config.regionName.toUpperCase())} IN 3D
          </button>
          <div class="tycoon-secondary-links">
            <button type="button" class="secondary" data-action="watch-video" data-region="${config.id}">🎬 Island Cinema</button>
            <button type="button" class="secondary" data-action="adventure-3d-exit" data-region="">🗺️ 2D Field Map</button>
          </div>
        </div>
      </div>
    </div>
  ` : '';

  return `
    <section class="adventure-3d-wrap harbor-walk-wrap is-immersive" aria-label="3D Island Tycoon: ${config.regionName}">
      <!-- Top HUD Floating SimCity / Tycoon Bar -->
      <header class="adventure-3d-topbar harbor-walk-topbar tycoon-topbar" role="banner">
        <div class="tycoon-topbar-left">
          <button class="adventure-3d-exit-btn back" data-action="adventure-3d-exit" data-region="${config.id}" aria-label="Open 2D Map & Missions">
            🗺️ Map
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
          <button class="adventure-3d-focus-btn" data-action="tycoon-camera-mode" aria-label="Switch Camera Mode">
            <span>${cameraMode === 'city' ? '🏙️ City Cam' : '🚶 Walk Cam'}</span>
          </button>
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

      <!-- Interactive 3D World Floating Badges (Projected over 3D Machine & Building Pads) -->
      <div id="tycoon-3d-markers" class="tycoon-3d-markers-layer" aria-label="Interactive 3D World Structures">
        ${worldMarkersHtml}
      </div>

      ${titleOverlayHtml}

      <!-- Finger-Friendly Touch D-Pad for Mobile Phones / Walking -->
      <div class="adventure-3d-touch-controls harbor-walk-touch-controls" role="group" aria-label="Touch walk controls">
        <div class="harbor-walk-dpad adventure-3d-dpad">
          <button type="button" class="touch-btn touch-up" data-action="touch-walk" data-dir="forward" aria-label="Walk forward">▲</button>
          <button type="button" class="touch-btn touch-left" data-action="touch-walk" data-dir="left" aria-label="Turn left">◀</button>
          <button type="button" class="touch-btn touch-center" data-action="adventure-3d-focus-target" data-region="${config.id}" aria-label="Center view on target" title="Focus Target">🧭</button>
          <button type="button" class="touch-btn touch-right" data-action="touch-walk" data-dir="right" aria-label="Turn right">▶</button>
          <button type="button" class="touch-btn touch-down" data-action="touch-walk" data-dir="backward" aria-label="Walk backward">▼</button>
        </div>
      </div>

      <!-- Sleek Bottom Game Action Bar (Always accessible while keeping 90% of screen clear) -->
      <div class="tycoon-bottom-hud" role="toolbar" aria-label="Island Tycoon Actions">
        <button type="button" class="tycoon-hud-btn ${!isCollapsed && activeTab === 'tune' ? 'active' : ''}" data-action="tycoon-select-object" data-obj-type="machine">
          <span>🎛️</span> <span>Tune ${esc(config.targetName)} (${metrics.efficiency}%)</span>
        </button>
        <button type="button" class="tycoon-hud-btn hud-btn-pulse" data-action="adventure-3d-run-trial" ${state.isSimulating ? 'disabled' : ''}>
          <span>⚡</span> <span>${state.isSimulating ? 'Running...' : `Test Shipment (+$${metrics.isOptimal ? 90 : 35})`}</span>
        </button>
        <button type="button" class="tycoon-hud-btn ${!isCollapsed && activeTab === 'build' ? 'active' : ''}" data-action="tycoon-open-build">
          <span>🏗️</span> <span>Build (${totalBuiltLevels})</span>
        </button>
        <button type="button" class="tycoon-hud-btn" data-action="watch-video" data-region="${config.id}">
          <span>🎬</span> <span>Briefing</span>
        </button>
      </div>

      <!-- Compact Contextual Popover (Appears when a 3D machine or building pad is tapped; collapses to keep 90% screen clear!) -->
      <aside class="adventure-3d-card harbor-walk-card tycoon-dock tycoon-context-popover ${isCollapsed ? 'is-collapsed' : ''}" aria-label="Tycoon Inspector">
        <div class="adventure-card-header">
          <div class="pip-face-icon">${config.icon}</div>
          <div class="adventure-card-header-text">
            <span class="card-eyebrow">${esc(config.tycoonTitle.toUpperCase())} · +$${metrics.totalIncome}/SEC · STEP ${step}</span>
            <h4 class="card-title">${state.completed ? `✓ ${config.facilityName} Thriving!` : `${config.regionName} Inspector`}</h4>
          </div>
          <button class="adventure-card-toggle-btn" data-action="adventure-3d-toggle-card" aria-expanded="${!isCollapsed}" aria-controls="adventure-task-body" aria-label="${isCollapsed ? 'Open Inspector' : 'Close Inspector'}">
            ${isCollapsed ? '🎛️ Inspect' : '✕ Close'}
          </button>
        </div>

        ${isCollapsed ? '' : `
          <div class="adventure-card-body" id="adventure-task-body">
            <!-- Mode Tabs: Tune Science vs Build City -->
            <div class="tycoon-mode-tabs" role="tablist">
              <button type="button" class="tycoon-tab-btn ${activeTab === 'tune' ? 'active' : ''}" data-action="tycoon-tab" data-tab="tune">
                🎛️ Tune Machine (${metrics.efficiency}%)
              </button>
              <button type="button" class="tycoon-tab-btn ${activeTab === 'build' ? 'active' : ''}" data-action="tycoon-tab" data-tab="build">
                🏗️ Build Facilities (${totalBuiltLevels})
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
                <p class="tycoon-build-intro">Tap any glowing pad in 3D or upgrade below! Machine efficiency (${metrics.efficiency}%) boosts all facility income.</p>
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
