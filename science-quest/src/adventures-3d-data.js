import {esc} from './visuals.js';

/**
 * 3D Sim-Tycoon & Adventure Definitions for all 6 Science Quest Regions:
 * 1. motion: Motion Harbor — Cargo Port Tycoon (Ramp potential/kinetic energy & friction)
 * 2. matter: Matter Workshop — Chemical Refinery Tycoon (Conservation of mass in closed systems)
 * 3. living: Living Valley — Bio-Dome Farm Tycoon (Photosynthesis light & irrigation balance)
 * 4. earth: Earthwatch Ridge — Watershed & Hydro Tycoon (Root erosion control & clean hydro power)
 * 5. signal: Signal Coast — Wave Power & Telecom Tycoon (Wave frequency, wavelength & resonance)
 * 6. orbit: Orbital Station — Spaceport & Satellite Tycoon (Keplerian orbital radius & period)
 */

export const ADVENTURE_CONFIGS = {
  motion: {
    id: 'motion',
    regionName: 'Motion Harbor',
    tycoonTitle: 'Harbor Cargo Port',
    tycoonRole: 'Port Logistics & Physics Director',
    icon: '⚙',
    themeColor: '#eeb947',
    skyColor: 0x8fd8e8,
    fogColor: 0x9ee0ea,
    groundColor: 0xbd9f75,
    targetName: 'Gravity Cargo Ramp & Rover Pier',
    facilityName: 'Harbor Lab',
    flagshipMission: 'rover-rescue',
    stepTitles: {
      1: 'Inspect Port & Build',
      2: 'Tune Ramp Physics',
      3: 'Optimize Fleet Output',
      4: 'Expand Port Grid',
      5: 'Harbor Metropolis'
    },
    buildings: [
      { id: 'ramp_core', name: 'Gravity Launch Ramp', icon: '📐', baseCost: 80, baseIncome: 15, desc: 'Converts gravitational potential energy into rover speed.', pos: [0, -2.5], color: 0xeeb947 },
      { id: 'cargo_crane', name: 'Automated Cargo Crane', icon: '🏗️', baseCost: 120, baseIncome: 25, desc: 'Loads arriving rovers onto ocean freighters.', pos: [4.2, -1.5], color: 0xe06d3b },
      { id: 'solar_depot', name: 'Rover Solar Depot', icon: '☀️', baseCost: 180, baseIncome: 40, desc: 'Clean solar charging bays for continuous rover dispatch.', pos: [-4.5, 1.5], color: 0x3b9ae0 },
      { id: 'port_tower', name: 'Harbor Control Tower', icon: '📡', baseCost: 260, baseIncome: 65, desc: 'AI telemetry tower that doubles port shipping capacity.', pos: [4.5, 3.8], color: 0x54dfc2 }
    ],
    defaultState: {
      height: 0.20,
      surface: 'smooth',
      funds: 220,
      prosperity: 20,
      buildingLevels: { ramp_core: 1, cargo_crane: 0, solar_depot: 0, port_tower: 0 },
      isSimulating: false,
      trials: [],
      fairWarning: null,
      whatChanged: null,
      questionChoice: null,
      questionFeedback: null,
      completed: false,
      freeWalk: false,
      avatarNearTarget: true,
      cardCollapsed: false,
      activeTab: 'tune' // 'tune' | 'build'
    },
    surfaces: {
      smooth: { id: 'smooth', name: 'Smooth Wood Dock', friction: 0.20 },
      rubber: { id: 'rubber', name: 'Rough Rubber Mat', friction: 0.40 }
    },
    calculateResult(state) {
      const s = this.surfaces[state.surface] || this.surfaces.smooth;
      const h = Math.max(0.10, Math.min(0.50, state.height));
      const dist = Math.round((h / s.friction) * 100) / 100;
      return {
        height: state.height,
        surface: state.surface,
        surfaceName: s.name,
        distance: dist,
        unit: 'm',
        metricLabel: 'Rover Reach Distance'
      };
    },
    calculateTycoonMetrics(state) {
      const res = this.calculateResult(state);
      // Target ship loading bay is at 1.50m - 2.00m (height 0.30 - 0.40m on smooth dock)
      const isSmooth = state.surface === 'smooth';
      const dist = res.distance;
      let efficiency = 40;
      let statusText = '';
      let scienceInsight = '';

      if (!isSmooth) {
        efficiency = Math.min(55, Math.round((dist / 1.75) * 60));
        statusText = `⚠️ High Friction Alert! The Rough Rubber Mat (μ=0.40) turns rover motion into heat. Rovers stop at ${dist.toFixed(1)}m before reaching the ship!`;
        scienceInsight = `Friction opposes motion: d = h / μ = ${state.height.toFixed(2)}m / 0.40 = ${dist.toFixed(1)}m (Too short!)`;
      } else if (state.height < 0.30) {
        efficiency = Math.round(45 + (state.height / 0.35) * 40);
        statusText = `📉 Low Potential Energy! At ${state.height.toFixed(2)}m height, rovers only roll ${dist.toFixed(1)}m and stall short of the 1.75m ship loading zone.`;
        scienceInsight = `Raise ramp height (h) to increase gravitational potential energy (PE = m·g·h)!`;
      } else {
        efficiency = 100;
        statusText = `🚀 Peak Shipping Flow! High ramp (${state.height.toFixed(2)}m) + Smooth Wood Dock gives rovers enough kinetic energy to coast ${dist.toFixed(1)}m right into the ship bay!`;
        scienceInsight = `Optimal Energy Transfer: High PE (h=${state.height.toFixed(2)}m) + Low Friction (μ=0.20) = ${dist.toFixed(1)}m direct delivery!`;
      }

      const lvls = state.buildingLevels || { ramp_core: 1 };
      let rawBldgIncome = 0;
      let totalLevels = 0;
      for (const b of this.buildings) {
        const lvl = lvls[b.id] || 0;
        totalLevels += lvl;
        if (lvl > 0) rawBldgIncome += b.baseIncome * (1 + (lvl - 1) * 0.6);
      }

      const machineIncome = Math.round(25 * (efficiency / 100));
      const buildingIncome = Math.round(rawBldgIncome * (0.4 + 0.6 * (efficiency / 100)));
      const totalIncome = machineIncome + buildingIncome;
      const isOptimal = efficiency >= 95;
      const bldgScore = Math.min(50, totalLevels * 12.5);
      const tuneScore = (efficiency / 100) * 50;
      const prosperity = Math.min(100, Math.round(bldgScore + tuneScore));

      return {
        efficiency,
        machineIncome,
        buildingIncome,
        totalIncome,
        powerMW: 12 + totalLevels * 8,
        ecoScore: isSmooth ? 94 : 78,
        statusText,
        scienceInsight,
        isOptimal,
        prosperity,
        metricValue: `${dist.toFixed(1)} m`,
        metricTarget: '1.5 – 2.0 m Ship Zone',
        metricLabel: 'Rover Delivery Reach'
      };
    },
    validateFair(trial1, newState) {
      if (!trial1) return { fair: true };
      const sameSurface = newState.surface === trial1.surface;
      const heightDiff = Math.abs(newState.height - trial1.height);
      const changedHeight = heightDiff >= 0.01;

      if (!sameSurface && changedHeight) {
        return {
          fair: false,
          reason: 'both_changed',
          message: `⚠️ That test is not fair and does not count! You changed both ramp height (${newState.height.toFixed(2)} m) and dock surface (${this.surfaces[newState.surface]?.name || newState.surface}) together. In a fair test, keep the surface on ${trial1.surfaceName} and change only the ramp height!`
        };
      }
      if (!sameSurface && !changedHeight) {
        return {
          fair: false,
          reason: 'surface_changed_not_height',
          message: `⚠️ That test is not fair! You kept ramp height identical (${newState.height.toFixed(2)} m) and changed the surface. To test how height affects motion, keep the surface on ${trial1.surfaceName} and choose a different ramp height!`
        };
      }
      if (sameSurface && !changedHeight) {
        return {
          fair: false,
          reason: 'no_change',
          message: `Choose a different ramp height to compare with your first roll of ${trial1.height.toFixed(2)} m.`
        };
      }
      return { fair: true };
    },
    formatWhatChanged(t1, t2) {
      if (!t2) {
        return `Trial 1: Height ${t1.height.toFixed(2)} m on ${t1.surfaceName} → Rover rolled ${t1.distance.toFixed(1)} m.`;
      }
      const diff = t2.distance - t1.distance;
      const comp = diff > 0 ? `${diff.toFixed(1)} m farther` : diff < 0 ? `${Math.abs(diff).toFixed(1)} m shorter` : 'the exact same distance';
      return `Trial 2: Kept surface fixed on ${t2.surfaceName} and changed ramp height from ${t1.height.toFixed(2)} m to ${t2.height.toFixed(2)} m. The rover rolled ${t2.distance.toFixed(1)} m (${comp})!`;
    },
    question: {
      prompt: 'What did your fair test show about ramp height and rover motion?',
      options: [
        'A higher ramp gives the rover more gravitational energy, so it rolls farther on the same surface.',
        'Changing the ramp height makes no difference to how far the rover rolls.',
        'A lower ramp makes the rover roll much farther because it is lighter.'
      ],
      correct: 0,
      goodFeedback: 'Spot on! Starting higher gives more gravitational potential energy, which converts to more kinetic motion energy down the ramp. On the same dock surface, the rover rolls farther!',
      tryFeedback: 'Take another look at your two fair trials: when the ramp started higher, did the rover go farther or shorter on the same dock surface? Think about the energy it got from height.'
    }
  },

  matter: {
    id: 'matter',
    regionName: 'Matter Workshop',
    tycoonTitle: 'Chemical Synthesis Plant',
    tycoonRole: 'Chief Chemical Process Engineer',
    icon: '⚗',
    themeColor: '#b794e7',
    skyColor: 0x937ca8,
    fogColor: 0x937ca8,
    groundColor: 0x5a5464,
    targetName: 'Reaction Vessel & Mass Balance',
    facilityName: 'Recovery Bench',
    flagshipMission: 'nothing-lost',
    stepTitles: {
      1: 'Inspect Refinery',
      2: 'Seal Reaction Vat',
      3: 'Conserve 100% Mass',
      4: 'Expand Refinery',
      5: 'Matter Plant Restored'
    },
    buildings: [
      { id: 'reactor_core', name: 'Primary Reaction Vat', icon: '⚗️', baseCost: 80, baseIncome: 18, desc: 'Mixes reactants to synthesize industrial compounds.', pos: [0, -2.0], color: 0xb794e7 },
      { id: 'gas_condenser', name: 'Gas Recovery Condenser', icon: '🫧', baseCost: 130, baseIncome: 28, desc: 'Captures CO₂ gas from sealed reactions for carbon products.', pos: [4.0, -1.5], color: 0x5bc0be },
      { id: 'mass_silo', name: 'Precision Reactant Silo', icon: '🛢️', baseCost: 190, baseIncome: 42, desc: 'Automated stoichiometric feeder for zero-waste batches.', pos: [-4.2, 1.5], color: 0xf4a261 },
      { id: 'crystal_synth', name: 'Molecular Crystal Lab', icon: '💎', baseCost: 270, baseIncome: 68, desc: 'Turns conserved reaction matter into high-grade optics.', pos: [4.2, 3.5], color: 0x9b5de5 }
    ],
    defaultState: {
      stopper: 'open', // Start 'open' so player discovers sealing it boosts profit!
      reactantsMass: 60.0,
      funds: 220,
      prosperity: 20,
      buildingLevels: { reactor_core: 1, gas_condenser: 0, mass_silo: 0, crystal_synth: 0 },
      isSimulating: false,
      trials: [],
      fairWarning: null,
      whatChanged: null,
      questionChoice: null,
      questionFeedback: null,
      completed: false,
      freeWalk: false,
      avatarNearTarget: true,
      cardCollapsed: false,
      activeTab: 'tune'
    },
    calculateResult(state) {
      const isSealed = state.stopper === 'sealed';
      const massAfter = isSealed ? state.reactantsMass : Math.round((state.reactantsMass - 3.2) * 10) / 10;
      return {
        stopper: state.stopper,
        stopperName: isSealed ? 'Sealed Flask (Stopper On)' : 'Open Flask (Stopper Off)',
        reactantsMass: state.reactantsMass,
        massAfter,
        gasEscaped: isSealed ? 0 : 3.2,
        unit: 'g',
        metricLabel: 'Recovered Product Mass'
      };
    },
    calculateTycoonMetrics(state) {
      const res = this.calculateResult(state);
      const isSealed = state.stopper === 'sealed';
      const optimalMass = Math.abs(state.reactantsMass - 60.0) < 5;
      let efficiency = 42;
      let statusText = '';
      let scienceInsight = '';

      if (!isSealed) {
        efficiency = 45;
        statusText = `💨 Gas Leak Losing Profit! With an Open Flask, ${res.gasEscaped}g of CO₂ gas escapes into the air every batch! Mass drops from ${res.reactantsMass.toFixed(1)}g to ${res.massAfter.toFixed(1)}g.`;
        scienceInsight = `Open System: ${res.reactantsMass.toFixed(1)}g reactants → ${res.massAfter.toFixed(1)}g liquid + 3.2g escaped gas. Seal the vessel!`;
      } else if (!optimalMass) {
        efficiency = 78;
        statusText = `⚖️ Vessel Sealed (0g lost!), but reactant feed (${state.reactantsMass.toFixed(0)}g) is off the 60g stoichiometric sweet spot for our condensers.`;
        scienceInsight = `Closed System conserves 100% mass (${res.massAfter.toFixed(1)}g = ${res.reactantsMass.toFixed(1)}g). Set feed to 60g for peak throughput!`;
      } else {
        efficiency = 100;
        statusText = `✨ 100% Mass Conserved! The Sealed Vessel traps all evolved gas (${res.massAfter.toFixed(1)}g before = ${res.massAfter.toFixed(1)}g after), maximizing chemical sales!`;
        scienceInsight = `Law of Conservation of Mass: In a closed system, total mass never changes during a chemical reaction (60.0g → 60.0g)!`;
      }

      const lvls = state.buildingLevels || { reactor_core: 1 };
      let rawBldgIncome = 0;
      let totalLevels = 0;
      for (const b of this.buildings) {
        const lvl = lvls[b.id] || 0;
        totalLevels += lvl;
        if (lvl > 0) rawBldgIncome += b.baseIncome * (1 + (lvl - 1) * 0.6);
      }

      const machineIncome = Math.round(28 * (efficiency / 100));
      const buildingIncome = Math.round(rawBldgIncome * (0.4 + 0.6 * (efficiency / 100)));
      const totalIncome = machineIncome + buildingIncome;
      const isOptimal = efficiency >= 95;
      const bldgScore = Math.min(50, totalLevels * 12.5);
      const tuneScore = (efficiency / 100) * 50;
      const prosperity = Math.min(100, Math.round(bldgScore + tuneScore));

      return {
        efficiency,
        machineIncome,
        buildingIncome,
        totalIncome,
        powerMW: 15 + totalLevels * 9,
        ecoScore: isSealed ? 98 : 65,
        statusText,
        scienceInsight,
        isOptimal,
        prosperity,
        metricValue: `${res.massAfter.toFixed(1)} / ${res.reactantsMass.toFixed(1)} g`,
        metricTarget: '100% Mass Retained (0g lost)',
        metricLabel: 'Mass Conservation'
      };
    },
    validateFair(trial1, newState) {
      if (!trial1) return { fair: true };
      const sameReactants = Math.abs(newState.reactantsMass - trial1.reactantsMass) < 0.1;
      const changedStopper = newState.stopper !== trial1.stopper;

      if (!sameReactants && changedStopper) {
        return {
          fair: false,
          reason: 'both_changed',
          message: `⚠️ That test is not fair and does not count! You changed both reactant mass (${newState.reactantsMass.toFixed(1)} g) and the flask stopper seal together. Keep the starting reactants at ${trial1.reactantsMass.toFixed(1)} g and change only the stopper seal!`
        };
      }
      if (!sameReactants && !changedStopper) {
        return {
          fair: false,
          reason: 'mass_changed_not_stopper',
          message: `⚠️ That test is not fair! To test whether gas escaping changes the measured mass, keep the reactants identical (${trial1.reactantsMass.toFixed(1)} g) and compare Sealed vs Open stopper!`
        };
      }
      if (sameReactants && !changedStopper) {
        return {
          fair: false,
          reason: 'no_change',
          message: `Choose a different flask seal (${trial1.stopper === 'sealed' ? 'Open Flask' : 'Sealed Flask'}) to compare with Trial 1.`
        };
      }
      return { fair: true };
    },
    formatWhatChanged(t1, t2) {
      if (!t2) {
        return `Trial 1: Mixed 60.0 g reactants in a ${t1.stopperName}. Gas bubbled inside! Final mass remained exactly ${t1.massAfter.toFixed(1)} g.`;
      }
      if (t2.stopper === 'open') {
        return `Trial 2: Kept reactants at 60.0 g and removed the stopper (${t2.stopperName}). Carbon dioxide gas escaped into the room! Final mass dropped to ${t2.massAfter.toFixed(1)} g (lost ${t2.gasEscaped.toFixed(1)} g of gas).`;
      }
      return `Trial 2: Kept reactants at 60.0 g and sealed the flask. All gas was trapped inside; final mass remained ${t2.massAfter.toFixed(1)} g.`;
    },
    question: {
      prompt: 'What did your fair test show about matter during a chemical reaction?',
      options: [
        'Total mass is conserved in a closed system; the open flask only lost mass because gas escaped into the air.',
        'Chemical reactions always destroy matter and make atoms disappear.',
        'Baking soda and vinegar turn into pure energy with zero mass.'
      ],
      correct: 0,
      goodFeedback: 'Brilliant science! Atoms rearrange during chemical reactions, but no matter is created or destroyed (Conservation of Mass). In the sealed flask, all gas molecules stayed inside, preserving the exact 60.0 grams!',
      tryFeedback: 'Look at the comparison: in the sealed flask, did any mass disappear? What escaped into the air when the stopper was left off?'
    }
  },

  living: {
    id: 'living',
    regionName: 'Living Valley',
    tycoonTitle: 'Bio-Dome Agri-Tycoon',
    tycoonRole: 'Chief Botanist & Life-Support Director',
    icon: '♧',
    themeColor: '#85cda2',
    skyColor: 0x8bd5b5,
    fogColor: 0x8bd5b5,
    groundColor: 0x487a55,
    targetName: 'Hydroponic Growth Chambers',
    facilityName: 'Growing Biodome',
    flagshipMission: 'biodome-balance',
    stepTitles: {
      1: 'Inspect Bio-Dome',
      2: 'Tune Sunlamps & Water',
      3: 'Maximize Crop Yield',
      4: 'Expand Agri-Network',
      5: 'Living Valley Restored'
    },
    buildings: [
      { id: 'hydro_pod', name: 'Hydroponic Growth Dome', icon: '🌱', baseCost: 80, baseIncome: 18, desc: 'Climate-controlled greenhouse for rapid crop growth.', pos: [0, -2.0], color: 0x62b677 },
      { id: 'drip_tower', name: 'Automated Irrigation Tower', icon: '💧', baseCost: 125, baseIncome: 28, desc: 'Recycles water vapour and delivers exact root moisture.', pos: [4.2, -1.5], color: 0x4ea8de },
      { id: 'bee_hive', name: 'Pollinator Bio-Conservatory', icon: '🐝', baseCost: 185, baseIncome: 44, desc: 'Bumblebee colonies that triple fruit and seed harvests.', pos: [-4.2, 1.5], color: 0xf4be37 },
      { id: 'oxygen_spire', name: 'Atmospheric O₂ Scrubber', icon: '🌬️', baseCost: 265, baseIncome: 70, desc: 'Captures plant oxygen output to supply the island network.', pos: [4.2, 3.6], color: 0x80ed99 }
    ],
    defaultState: {
      lightLevel: 200, // Start low (200 lux) so player tunes it up to 900 lux!
      waterPerDay: 50,
      funds: 220,
      prosperity: 20,
      buildingLevels: { hydro_pod: 1, drip_tower: 0, bee_hive: 0, oxygen_spire: 0 },
      isSimulating: false,
      trials: [],
      fairWarning: null,
      whatChanged: null,
      questionChoice: null,
      questionFeedback: null,
      completed: false,
      freeWalk: false,
      avatarNearTarget: true,
      cardCollapsed: false,
      activeTab: 'tune'
    },
    calculateResult(state) {
      let heightCm = 8.5;
      if (state.lightLevel >= 800) heightCm = 24.0;
      else if (state.lightLevel >= 400) heightCm = 18.5;
      if (state.waterPerDay && Math.abs(state.waterPerDay - 50) > 15) {
        heightCm = Math.round(heightCm * 0.65 * 10) / 10;
      }
      return {
        lightLevel: state.lightLevel,
        lightLabel: state.lightLevel >= 800 ? 'High (900 lux)' : state.lightLevel >= 400 ? 'Medium (500 lux)' : 'Low (200 lux)',
        waterPerDay: state.waterPerDay,
        growthHeight: heightCm,
        unit: 'cm',
        metricLabel: 'Crop Harvest Height'
      };
    },
    calculateTycoonMetrics(state) {
      const res = this.calculateResult(state);
      const goodWater = Math.abs((state.waterPerDay || 50) - 50) <= 10;
      const highLight = state.lightLevel >= 800;
      const medLight = state.lightLevel >= 400 && state.lightLevel < 800;

      let efficiency = 38;
      let statusText = '';
      let scienceInsight = '';

      if (!goodWater) {
        efficiency = 45;
        statusText = `💧 Irrigation Imbalance! At ${state.waterPerDay} mL/day, roots are ${state.waterPerDay < 50 ? 'parched' : 'waterlogged'}. Set water to 50 mL/day so light can drive healthy growth!`;
        scienceInsight = `Photosynthesis requires both balanced water (50 mL/day) and solar energy!`;
      } else if (!highLight && !medLight) {
        efficiency = 42;
        statusText = `🌥️ Dim Sunlamps (200 lux)! Seedlings are pale and spindly (${res.growthHeight.toFixed(1)} cm). Boost sunlamp intensity to accelerate photosynthesis!`;
        scienceInsight = `Light energy powers chlorophyll to convert CO₂ + H₂O into plant sugars and biomass!`;
      } else if (medLight) {
        efficiency = 76;
        statusText = `🌿 Good Harvest (${res.growthHeight.toFixed(1)} cm at 500 lux). Increase sunlamps to High (900 lux) with 50 mL/day water for maximum bio-dome yield!`;
        scienceInsight = `More photons absorbed by leaves = faster sugar synthesis (up to saturation at 900 lux)!`;
      } else {
        efficiency = 100;
        statusText = `🌺 Bumper Bio-Dome Harvest! High sunlamps (900 lux) + balanced 50 mL/day water grew ${res.growthHeight.toFixed(1)} cm lush crops and peak O₂ output!`;
        scienceInsight = `Optimal Photosynthesis: 900 lux Light + 50 mL Water + CO₂ → Maximum Biomass (24.0 cm) & Oxygen!`;
      }

      const lvls = state.buildingLevels || { hydro_pod: 1 };
      let rawBldgIncome = 0;
      let totalLevels = 0;
      for (const b of this.buildings) {
        const lvl = lvls[b.id] || 0;
        totalLevels += lvl;
        if (lvl > 0) rawBldgIncome += b.baseIncome * (1 + (lvl - 1) * 0.6);
      }

      const machineIncome = Math.round(28 * (efficiency / 100));
      const buildingIncome = Math.round(rawBldgIncome * (0.4 + 0.6 * (efficiency / 100)));
      const totalIncome = machineIncome + buildingIncome;
      const isOptimal = efficiency >= 95;
      const bldgScore = Math.min(50, totalLevels * 12.5);
      const tuneScore = (efficiency / 100) * 50;
      const prosperity = Math.min(100, Math.round(bldgScore + tuneScore));

      return {
        efficiency,
        machineIncome,
        buildingIncome,
        totalIncome,
        powerMW: 14 + totalLevels * 7,
        ecoScore: efficiency >= 75 ? 99 : 80,
        statusText,
        scienceInsight,
        isOptimal,
        prosperity,
        metricValue: `${res.growthHeight.toFixed(1)} cm`,
        metricTarget: '24.0 cm Peak Canopy',
        metricLabel: '7-Day Crop Growth'
      };
    },
    validateFair(trial1, newState) {
      if (!trial1) return { fair: true };
      const sameWater = Math.abs(newState.waterPerDay - trial1.waterPerDay) < 1;
      const changedLight = Math.abs(newState.lightLevel - trial1.lightLevel) > 50;

      if (!sameWater && changedLight) {
        return {
          fair: false,
          reason: 'both_changed',
          message: `⚠️ That test is not fair! You changed both light level (${newState.lightLevel} lux) and water amount (${newState.waterPerDay} mL/day). Keep water fixed at ${trial1.waterPerDay} mL/day and change only the light intensity!`
        };
      }
      if (!sameWater && !changedLight) {
        return {
          fair: false,
          reason: 'water_changed_not_light',
          message: `⚠️ That test is not fair! You kept the light fixed and changed the water. To test how light affects plant growth, keep water at ${trial1.waterPerDay} mL/day and choose a different light level!`
        };
      }
      if (sameWater && !changedLight) {
        return {
          fair: false,
          reason: 'no_change',
          message: `Choose a different light level to compare with your first trial of ${trial1.lightLevel} lux.`
        };
      }
      return { fair: true };
    },
    formatWhatChanged(t1, t2) {
      if (!t2) {
        return `Trial 1: Light set to ${t1.lightLabel} with ${t1.waterPerDay} mL water/day. Plants grew to ${t1.growthHeight.toFixed(1)} cm in 7 days.`;
      }
      const diff = t2.growthHeight - t1.growthHeight;
      const comp = diff > 0 ? `${diff.toFixed(1)} cm taller` : diff < 0 ? `${Math.abs(diff).toFixed(1)} cm shorter` : 'the exact same height';
      return `Trial 2: Kept water fixed at ${t2.waterPerDay} mL/day and changed light from ${t1.lightLabel} to ${t2.lightLabel}. Plants grew to ${t2.growthHeight.toFixed(1)} cm (${comp})!`;
    },
    question: {
      prompt: 'What did your fair test show about light and plant growth?',
      options: [
        'Plants use light energy for photosynthesis to produce biomass, growing taller and healthier when given adequate light.',
        'Light has zero effect on plants because they only need darkness.',
        'Plants grow best in total darkness because light burns away their leaves.'
      ],
      correct: 0,
      goodFeedback: 'Excellent discovery! Plants use chlorophyll to absorb light energy, combining carbon dioxide and water to produce sugars and cell structures. Controlled light testing proves its direct effect on growth!',
      tryFeedback: 'Look back at your two trials: when the sunlamps provided more light, did the seedlings grow taller or shorter? What do plant leaves use sunlight for?'
    }
  },

  earth: {
    id: 'earth',
    regionName: 'Earthwatch Ridge',
    tycoonTitle: 'Watershed & Hydro Tycoon',
    tycoonRole: 'Chief Geo-Hydrologist & Dam Engineer',
    icon: '△',
    themeColor: '#df9c75',
    skyColor: 0xdfb49b,
    fogColor: 0xdfb49b,
    groundColor: 0x8a5d3f,
    targetName: 'Hillside Watershed & Hydro Basin',
    facilityName: 'Weather Station',
    flagshipMission: 'rain-garden',
    stepTitles: {
      1: 'Inspect Watershed',
      2: 'Plant Root Armor',
      3: 'Stop Silt Runoff',
      4: 'Build Hydro Grid',
      5: 'Earthwatch Restored'
    },
    buildings: [
      { id: 'flume_basin', name: 'Watershed Retention Basin', icon: '🌊', baseCost: 80, baseIncome: 18, desc: 'Captures mountain rainfall and monitors sediment runoff.', pos: [0, -1.5], color: 0x4ea8de },
      { id: 'pine_terrace', name: 'Deep-Root Forest Terrace', icon: '🌲', baseCost: 130, baseIncome: 30, desc: 'Living root networks that lock hillside soil against erosion.', pos: [-4.2, -1.5], color: 0x40916c },
      { id: 'hydro_dam', name: 'Clean Hydro-Turbine', icon: '⚡', baseCost: 195, baseIncome: 48, desc: 'Generates clean electricity when fed silt-free mountain water.', pos: [4.2, -0.5], color: 0xf4a261 },
      { id: 'weather_radar', name: 'Doppler Weather Dome', icon: '🛰️', baseCost: 275, baseIncome: 72, desc: 'Forecasts island storms and optimizes reservoir release.', pos: [4.2, 3.6], color: 0xe76f51 }
    ],
    defaultState: {
      cover: 'bare',
      rainfallRate: 30,
      funds: 220,
      prosperity: 20,
      buildingLevels: { flume_basin: 1, pine_terrace: 0, hydro_dam: 0, weather_radar: 0 },
      isSimulating: false,
      trials: [],
      fairWarning: null,
      whatChanged: null,
      questionChoice: null,
      questionFeedback: null,
      completed: false,
      freeWalk: false,
      avatarNearTarget: true,
      cardCollapsed: false,
      activeTab: 'tune'
    },
    calculateResult(state) {
      const isBare = state.cover === 'bare';
      const rainRatio = (state.rainfallRate || 30) / 30;
      const runoff = Math.round((isBare ? 42.0 : 6.0) * rainRatio * 10) / 10;
      return {
        cover: state.cover,
        coverName: isBare ? 'Bare Unprotected Soil' : 'Dense Root Vegetation (Grass & Trees)',
        rainfallRate: state.rainfallRate,
        runoffMl: runoff,
        erosionLevel: isBare ? 'Severe Soil Erosion' : 'Negligible Soil Loss',
        unit: 'mL',
        metricLabel: 'Muddy Sediment Runoff'
      };
    },
    calculateTycoonMetrics(state) {
      const res = this.calculateResult(state);
      const isVegetated = state.cover === 'vegetation';
      const goodRain = Math.abs((state.rainfallRate || 30) - 30) <= 5;
      let efficiency = 35;
      let statusText = '';
      let scienceInsight = '';

      if (!isVegetated) {
        efficiency = 38;
        statusText = `⚠️ Mudslide & Turbine Clog! Bare soil washes ${res.runoffMl.toFixed(1)} mL of muddy silt into the reservoir, choking hydro-turbines! Plant Dense Root Vegetation!`;
        scienceInsight = `Without plant roots to bind soil particles, raindrops dislodge sediment and cause severe erosion!`;
      } else if (!goodRain) {
        efficiency = 78;
        statusText = `🌲 Roots are holding the hillside firm (${res.runoffMl.toFixed(1)} mL runoff), but storm gate flow (${state.rainfallRate} mm/h) is ${state.rainfallRate > 30 ? 'overloading spillways' : 'too low for peak hydro'}! Set flow to 30 mm/h.`;
        scienceInsight = `Vegetation canopy cushions raindrop impact while root mats increase water infiltration!`;
      } else {
        efficiency = 100;
        statusText = `🌲 Crystal-Clear Hydro Power! Dense Root Vegetation cut sediment runoff from 42.0 mL down to just ${res.runoffMl.toFixed(1)} mL—turbines spinning at 100% capacity!`;
        scienceInsight = `Root Networks + Canopy Interception = 86% less erosion & clean groundwater recharge!`;
      }

      const lvls = state.buildingLevels || { flume_basin: 1 };
      let rawBldgIncome = 0;
      let totalLevels = 0;
      for (const b of this.buildings) {
        const lvl = lvls[b.id] || 0;
        totalLevels += lvl;
        if (lvl > 0) rawBldgIncome += b.baseIncome * (1 + (lvl - 1) * 0.6);
      }

      const machineIncome = Math.round(30 * (efficiency / 100));
      const buildingIncome = Math.round(rawBldgIncome * (0.4 + 0.6 * (efficiency / 100)));
      const totalIncome = machineIncome + buildingIncome;
      const isOptimal = efficiency >= 95;
      const bldgScore = Math.min(50, totalLevels * 12.5);
      const tuneScore = (efficiency / 100) * 50;
      const prosperity = Math.min(100, Math.round(bldgScore + tuneScore));

      return {
        efficiency,
        machineIncome,
        buildingIncome,
        totalIncome,
        powerMW: 20 + totalLevels * 12,
        ecoScore: isVegetated ? 99 : 52,
        statusText,
        scienceInsight,
        isOptimal,
        prosperity,
        metricValue: `${res.runoffMl.toFixed(1)} mL silt`,
        metricTarget: '≤ 6.0 mL Clean Water',
        metricLabel: 'Erosion Runoff'
      };
    },
    validateFair(trial1, newState) {
      if (!trial1) return { fair: true };
      const sameRain = Math.abs(newState.rainfallRate - trial1.rainfallRate) < 1;
      const changedCover = newState.cover !== trial1.cover;

      if (!sameRain && changedCover) {
        return {
          fair: false,
          reason: 'both_changed',
          message: `⚠️ That test is not fair! You changed both rainfall rate (${newState.rainfallRate} mm/h) and ground cover together. Keep rainfall at ${trial1.rainfallRate} mm/h and change only the ground cover!`
        };
      }
      if (!sameRain && !changedCover) {
        return {
          fair: false,
          reason: 'rain_changed_not_cover',
          message: `⚠️ That test is not fair! To find how plant roots protect the hillside, keep rainfall at ${trial1.rainfallRate} mm/h and compare Bare Soil vs Dense Vegetation!`
        };
      }
      if (sameRain && !changedCover) {
        return {
          fair: false,
          reason: 'no_change',
          message: `Choose a different surface cover (${trial1.cover === 'bare' ? 'Dense Root Vegetation' : 'Bare Soil'}) to compare with Trial 1.`
        };
      }
      return { fair: true };
    },
    formatWhatChanged(t1, t2) {
      if (!t2) {
        return `Trial 1: Tested ${t1.coverName} under ${t1.rainfallRate} mm/h rain. Rapid runoff washed 42.0 mL of muddy sediment into the collection basin.`;
      }
      if (t2.cover === 'vegetation') {
        return `Trial 2: Kept rain fixed at 30 mm/h and added ${t2.coverName}. Plant roots bound the soil and leaves cushioned raindrops—runoff plunged from 42.0 mL to just 6.0 mL!`;
      }
      return `Trial 2: Kept rain fixed and removed vegetation. Runoff jumped back up to 42.0 mL with severe sediment erosion.`;
    },
    question: {
      prompt: 'What did your fair test show about plant cover and hillside erosion?',
      options: [
        'Plant roots anchor the soil and foliage intercepts raindrops, drastically reducing runoff and preventing erosion.',
        'Plants make water flow much faster and wash all the soil away.',
        'Bare soil absorbs 100% of rainwater with zero runoff.'
      ],
      correct: 0,
      goodFeedback: 'Outstanding science! Root systems create underground networks that lock soil grains in place, while surface leaves reduce the impact energy of falling raindrops. Controlled testing proves vegetation is nature’s armor against erosion!',
      tryFeedback: 'Examine your two trials: under the exact same rainstorm, which surface had dramatically less sediment washed into the basin?'
    }
  },

  signal: {
    id: 'signal',
    regionName: 'Signal Coast',
    tycoonTitle: 'Wave Power & Telecom Hub',
    tycoonRole: 'Coastal Wave & Communications Director',
    icon: 'ϟ',
    themeColor: '#72ceda',
    skyColor: 0x76bccc,
    fogColor: 0x76bccc,
    groundColor: 0x3d6b73,
    targetName: 'Ocean Wave Generator & Beacon',
    facilityName: 'Island Link Beacon',
    flagshipMission: 'tune-the-link',
    stepTitles: {
      1: 'Inspect Wave Coast',
      2: 'Tune Wave Frequency',
      3: 'Match 2.0m Resonance',
      4: 'Expand Comms Grid',
      5: 'Signal Coast Restored'
    },
    buildings: [
      { id: 'wave_flume', name: 'Resonant Wave Generator', icon: '🌊', baseCost: 85, baseIncome: 20, desc: 'Converts oscillating ocean waves into clean coastal power.', pos: [0, -2.0], color: 0x00b4d8 },
      { id: 'buoy_array', name: 'Offshore Power Buoys', icon: '⚓', baseCost: 135, baseIncome: 32, desc: 'Bobbing induction buoys tuned to 2.0m wavelengths.', pos: [-4.5, -1.5], color: 0xffb703 },
      { id: 'relay_dish', name: 'High-Gain Microwave Dish', icon: '📡', baseCost: 200, baseIncome: 50, desc: 'Beams high-frequency telemetry to neighboring islands.', pos: [4.5, 1.5], color: 0x72ceda },
      { id: 'beacon_core', name: 'Quantum Lighthouse Link', icon: '🗼', baseCost: 285, baseIncome: 75, desc: 'Synchronizes all 6 island data networks at light speed.', pos: [4.5, -3.5], color: 0x54dfc2 }
    ],
    defaultState: {
      frequency: 1.0, // Start at 1.0 Hz (wavelength 4.0m); optimal buoy resonance is 2.0 Hz (wavelength 2.0m)!
      waterDepth: 1.0,
      funds: 220,
      prosperity: 20,
      buildingLevels: { wave_flume: 1, buoy_array: 0, relay_dish: 0, beacon_core: 0 },
      isSimulating: false,
      trials: [],
      fairWarning: null,
      whatChanged: null,
      questionChoice: null,
      questionFeedback: null,
      completed: false,
      freeWalk: false,
      avatarNearTarget: true,
      cardCollapsed: false,
      activeTab: 'tune'
    },
    calculateResult(state) {
      const speed = 4.0;
      const freq = Math.max(0.5, Math.min(3.0, state.frequency));
      const wavelength = Math.round((speed / freq) * 10) / 10;
      return {
        frequency: state.frequency,
        waterDepth: state.waterDepth,
        wavelength,
        waveSpeed: speed,
        unit: 'm',
        metricLabel: 'Measured Wavelength (λ)'
      };
    },
    calculateTycoonMetrics(state) {
      const res = this.calculateResult(state);
      const sameDepth = Math.abs((state.waterDepth || 1.0) - 1.0) < 0.2;
      const isResonant = Math.abs(res.wavelength - 2.0) <= 0.2; // f = 2.0 Hz -> lambda = 2.0 m
      let efficiency = 45;
      let statusText = '';
      let scienceInsight = '';

      if (!sameDepth) {
        efficiency = 50;
        statusText = `🌊 Channel Depth Mismatch (${state.waterDepth.toFixed(1)}m)! Changing water depth alters wave speed (v). Lock depth at 1.0m (v = 4.0 m/s) to calibrate the buoys!`;
        scienceInsight = `Wave speed depends on the medium (water depth). Keep depth fixed at 1.0m!`;
      } else if (!isResonant) {
        efficiency = state.frequency < 1.0 ? 38 : 65;
        statusText = `📻 Wavelength Out of Sync! At f = ${state.frequency.toFixed(1)} Hz, wavelength is ${res.wavelength.toFixed(1)}m. Our coastal power buoys are spaced 2.0m apart—increase frequency to 2.0 Hz!`;
        scienceInsight = `Wave Equation: λ = v / f = 4.0 m/s ÷ ${state.frequency.toFixed(1)} Hz = ${res.wavelength.toFixed(1)}m (Target: 2.0m)`;
      } else {
        efficiency = 100;
        statusText = `⚡ 100% Wave Resonance Locked! Doubling frequency to 2.0 Hz halved wavelength to exactly 2.0m—every wave crest hits our power buoys in sync!`;
        scienceInsight = `Universal Wave Law (v = f · λ): At fixed speed (4.0 m/s), higher frequency (2.0 Hz) = shorter wavelength (2.0m)!`;
      }

      const lvls = state.buildingLevels || { wave_flume: 1 };
      let rawBldgIncome = 0;
      let totalLevels = 0;
      for (const b of this.buildings) {
        const lvl = lvls[b.id] || 0;
        totalLevels += lvl;
        if (lvl > 0) rawBldgIncome += b.baseIncome * (1 + (lvl - 1) * 0.6);
      }

      const machineIncome = Math.round(30 * (efficiency / 100));
      const buildingIncome = Math.round(rawBldgIncome * (0.4 + 0.6 * (efficiency / 100)));
      const totalIncome = machineIncome + buildingIncome;
      const isOptimal = efficiency >= 95;
      const bldgScore = Math.min(50, totalLevels * 12.5);
      const tuneScore = (efficiency / 100) * 50;
      const prosperity = Math.min(100, Math.round(bldgScore + tuneScore));

      return {
        efficiency,
        machineIncome,
        buildingIncome,
        totalIncome,
        powerMW: 24 + totalLevels * 11,
        ecoScore: 97,
        statusText,
        scienceInsight,
        isOptimal,
        prosperity,
        metricValue: `λ = ${res.wavelength.toFixed(1)} m`,
        metricTarget: 'λ = 2.0 m Buoy Spacing',
        metricLabel: 'Wave Resonance'
      };
    },
    validateFair(trial1, newState) {
      if (!trial1) return { fair: true };
      const sameDepth = Math.abs(newState.waterDepth - trial1.waterDepth) < 0.1;
      const changedFreq = Math.abs(newState.frequency - trial1.frequency) >= 0.1;

      if (!sameDepth && changedFreq) {
        return {
          fair: false,
          reason: 'both_changed',
          message: `⚠️ That test is not fair! You changed both paddle frequency (${newState.frequency.toFixed(1)} Hz) and water depth. Keep water depth at ${trial1.waterDepth.toFixed(1)} m and change only the wave frequency!`
        };
      }
      if (!sameDepth && !changedFreq) {
        return {
          fair: false,
          reason: 'depth_changed_not_freq',
          message: `⚠️ That test is not fair! Keep water depth at ${trial1.waterDepth.toFixed(1)} m and change the wave frequency to test how frequency affects wavelength!`
        };
      }
      if (sameDepth && !changedFreq) {
        return {
          fair: false,
          reason: 'no_change',
          message: `Choose a different wave frequency to compare with your first trial of ${trial1.frequency.toFixed(1)} Hz.`
        };
      }
      return { fair: true };
    },
    formatWhatChanged(t1, t2) {
      if (!t2) {
        return `Trial 1: Wave paddle pulsed at ${t1.frequency.toFixed(1)} Hz. Waves traveled down the tank with a measured wavelength of ${t1.wavelength.toFixed(1)} m.`;
      }
      const comp = t2.wavelength < t1.wavelength ? `shorter (crest-to-crest distance halved)` : `longer`;
      return `Trial 2: Kept water depth fixed and changed frequency from ${t1.frequency.toFixed(1)} Hz to ${t2.frequency.toFixed(1)} Hz. The wavelength became ${t2.wavelength.toFixed(1)} m (${comp})!`;
    },
    question: {
      prompt: 'What did your fair test show about wave frequency and wavelength at a constant wave speed?',
      options: [
        'Higher frequency produces shorter wavelengths because wave cycles are generated closer together in the same time.',
        'Higher frequency always makes wavelength infinitely longer.',
        'Frequency has no connection to wavelength in any wave medium.'
      ],
      correct: 0,
      goodFeedback: 'Spot on! The universal wave equation states speed = frequency × wavelength (v = f × λ). When wave speed is fixed by the medium, doubling the frequency packs twice as many wave crests into the same distance, halving the wavelength!',
      tryFeedback: 'Look at the wave tank ruler: when the paddle pulsed faster (higher frequency), did the crests move closer together or farther apart?'
    }
  },

  orbit: {
    id: 'orbit',
    regionName: 'Orbital Station',
    tycoonTitle: 'Spaceport & Orbital Grid',
    tycoonRole: 'Flight Dynamics & Orbital Commander',
    icon: '✦',
    themeColor: '#93a9ed',
    skyColor: 0x080f1d,
    fogColor: 0x0b1626,
    groundColor: 0x222a3d,
    targetName: 'Central Planetary Orrery',
    facilityName: 'Telescope Observatory',
    flagshipMission: 'orbital-patterns',
    stepTitles: {
      1: 'Inspect Spaceport',
      2: 'Tune Orbital Radius',
      3: 'Lock 34s Sync Orbit',
      4: 'Expand Star Array',
      5: 'Orbital Station Restored'
    },
    buildings: [
      { id: 'orrery_core', name: 'Gravity Orrery Command', icon: '🪐', baseCost: 90, baseIncome: 22, desc: 'Tracks satellite trajectories and Keplerian periods.', pos: [0, -1.5], color: 0x93a9ed },
      { id: 'solar_wings', name: 'Orbital Solar Wing Array', icon: '☀️', baseCost: 145, baseIncome: 35, desc: 'Zero-atmosphere solar collectors generating 24/7 power.', pos: [-4.5, -1.5], color: 0xffbe0b },
      { id: 'comms_ring', name: 'Deep-Space Telemetry Ring', icon: '🛰️', baseCost: 215, baseIncome: 55, desc: 'High-orbit relay satellites linking all research domes.', pos: [4.5, 1.5], color: 0x4cc9f0 },
      { id: 'star_beamer', name: 'Microwave Power Beamer', icon: '✨', baseCost: 310, baseIncome: 85, desc: 'Beams clean orbital energy down to the island grid.', pos: [0, -5.2], color: 0x7209b7 }
    ],
    defaultState: {
      radiusAU: 1.0, // Start at 1.0 AU (12s period); target outer sync ring is 2.0 AU (33.9s period)!
      starMass: 1.0,
      funds: 240,
      prosperity: 20,
      buildingLevels: { orrery_core: 1, solar_wings: 0, comms_ring: 0, star_beamer: 0 },
      isSimulating: false,
      trials: [],
      fairWarning: null,
      whatChanged: null,
      questionChoice: null,
      questionFeedback: null,
      completed: false,
      freeWalk: false,
      avatarNearTarget: true,
      cardCollapsed: false,
      activeTab: 'tune'
    },
    calculateResult(state) {
      const r = Math.max(0.5, Math.min(3.0, state.radiusAU));
      const starM = state.starMass || 1.0;
      const periodSec = Math.round(12.0 * Math.pow(r, 1.5) / Math.sqrt(starM) * 10) / 10;
      return {
        radiusAU: state.radiusAU,
        starMass: state.starMass,
        periodSec,
        unit: 's',
        metricLabel: 'Orbital Period (T)'
      };
    },
    calculateTycoonMetrics(state) {
      const res = this.calculateResult(state);
      const sameStar = Math.abs((state.starMass || 1.0) - 1.0) < 0.1;
      const isOuterSync = Math.abs(state.radiusAU - 2.0) <= 0.15;
      let efficiency = 48;
      let statusText = '';
      let scienceInsight = '';

      if (!sameStar) {
        efficiency = 52;
        statusText = `🌟 Star Mass Altered (${state.starMass.toFixed(1)} M☉)! Changing central mass alters gravity across the whole system. Keep Star Mass at 1.0 M☉ (Sun-like) to calibrate our satellites!`;
        scienceInsight = `Gravitational pull depends on star mass (M) and distance (R). Lock Star Mass at 1.0 M☉!`;
      } else if (!isOuterSync) {
        efficiency = state.radiusAU < 1.0 ? 40 : 68;
        statusText = `🛰️ Orbit Too Fast (${res.periodSec.toFixed(1)}s at ${state.radiusAU.toFixed(1)} AU)! The satellite zips past the island before data uploads finish. Move to the 2.0 AU High-Orbit Ring (~33.9s period)!`;
        scienceInsight = `Kepler's Law (T² ∝ R³): Larger orbital radius (R) = longer orbital period (T)!`;
      } else {
        efficiency = 100;
        statusText = `🌌 100% Deep-Space Sync Locked! At R = 2.0 AU, the wider orbit and weaker gravity produce a steady ${res.periodSec.toFixed(1)}s period—continuous island coverage!`;
        scienceInsight = `Kepler's Third Law: Doubling radius from 1.0 to 2.0 AU increases period by 2^1.5 = 2.83× (12.0s → 33.9s)!`;
      }

      const lvls = state.buildingLevels || { orrery_core: 1 };
      let rawBldgIncome = 0;
      let totalLevels = 0;
      for (const b of this.buildings) {
        const lvl = lvls[b.id] || 0;
        totalLevels += lvl;
        if (lvl > 0) rawBldgIncome += b.baseIncome * (1 + (lvl - 1) * 0.6);
      }

      const machineIncome = Math.round(35 * (efficiency / 100));
      const buildingIncome = Math.round(rawBldgIncome * (0.4 + 0.6 * (efficiency / 100)));
      const totalIncome = machineIncome + buildingIncome;
      const isOptimal = efficiency >= 95;
      const bldgScore = Math.min(50, totalLevels * 12.5);
      const tuneScore = (efficiency / 100) * 50;
      const prosperity = Math.min(100, Math.round(bldgScore + tuneScore));

      return {
        efficiency,
        machineIncome,
        buildingIncome,
        totalIncome,
        powerMW: 35 + totalLevels * 15,
        ecoScore: 100,
        statusText,
        scienceInsight,
        isOptimal,
        prosperity,
        metricValue: `T = ${res.periodSec.toFixed(1)} s`,
        metricTarget: 'T = 33.9 s (2.0 AU Sync)',
        metricLabel: 'Satellite Orbit Time'
      };
    },
    validateFair(trial1, newState) {
      if (!trial1) return { fair: true };
      const sameStar = Math.abs(newState.starMass - trial1.starMass) < 0.1;
      const changedRadius = Math.abs(newState.radiusAU - trial1.radiusAU) >= 0.1;

      if (!sameStar && changedRadius) {
        return {
          fair: false,
          reason: 'both_changed',
          message: `⚠️ That test is not fair! You changed both orbital radius (${newState.radiusAU.toFixed(1)} AU) and star mass together. Keep star mass at ${trial1.starMass.toFixed(1)} M☉ and change only the orbital distance!`
        };
      }
      if (!sameStar && !changedRadius) {
        return {
          fair: false,
          reason: 'star_changed_not_radius',
          message: `⚠️ That test is not fair! Keep the central star mass fixed and change the orbital radius to discover how distance affects the orbit time!`
        };
      }
      if (sameStar && !changedRadius) {
        return {
          fair: false,
          reason: 'no_change',
          message: `Choose a different orbital radius to compare with your first trial of ${trial1.radiusAU.toFixed(1)} AU.`
        };
      }
      return { fair: true };
    },
    formatWhatChanged(t1, t2) {
      if (!t2) {
        return `Trial 1: Satellite placed at orbital radius ${t1.radiusAU.toFixed(1)} AU. It completed one full orbit in ${t1.periodSec.toFixed(1)} seconds.`;
      }
      const comp = t2.periodSec > t1.periodSec ? `longer (${(t2.periodSec - t1.periodSec).toFixed(1)}s slower)` : `shorter`;
      return `Trial 2: Kept central star mass fixed and moved satellite from ${t1.radiusAU.toFixed(1)} AU to ${t2.radiusAU.toFixed(1)} AU. The orbit period became ${t2.periodSec.toFixed(1)} seconds (${comp})!`;
    },
    question: {
      prompt: 'What did your fair test show about orbital distance and the time to complete an orbit?',
      options: [
        'Satellites farther from the central star travel along larger orbits and experience weaker gravitational pull, taking significantly longer to complete an orbit.',
        'Every object in the universe orbits in the exact same time regardless of distance.',
        'Farther planets orbit much faster because there is less gravity to slow them down.'
      ],
      correct: 0,
      goodFeedback: 'Masterful astronomy! As Johannes Kepler discovered, orbital period increases with distance (T² ∝ R³). Farther out, the gravitational tug is weaker and the orbital perimeter is wider, meaning planets take much longer to circle their star!',
      tryFeedback: 'Review your orrery measurements: when the probe was positioned at 2.0 AU instead of 1.0 AU, did it take more seconds or fewer seconds to complete one lap?'
    }
  }
};

export function createAdventureState(regionId = 'motion') {
  const config = ADVENTURE_CONFIGS[regionId] || ADVENTURE_CONFIGS.motion;
  return {
    regionId: config.id,
    step: 1,
    cameraMode: 'city',
    selectedObject: null,
    ...structuredClone(config.defaultState)
  };
}
