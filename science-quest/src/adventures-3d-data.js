import {esc} from './visuals.js';

/**
 * 3D Adventure Definitions for all 6 Science Quest Regions:
 * 1. motion: Motion Harbor (Ramp height vs stopping distance)
 * 2. matter: Matter Workshop (Conservation of mass in sealed vs unsealed reaction)
 * 3. living: Living Valley (Plant growth rate vs light level with controlled water)
 * 4. earth: Earthwatch Ridge (Vegetation cover vs soil runoff and erosion)
 * 5. signal: Signal Coast (Wave frequency vs wavelength at constant speed)
 * 6. orbit: Orbital Station (Orbital radius vs orbital period around star)
 */

export const ADVENTURE_CONFIGS = {
  motion: {
    id: 'motion',
    regionName: 'Motion Harbor',
    icon: '⚙',
    themeColor: '#eeb947',
    skyColor: 0x9ee0ea,
    fogColor: 0x9ee0ea,
    groundColor: 0xbd9f75,
    targetName: 'Science Rover & Ramp',
    facilityName: 'Harbor Lab',
    flagshipMission: 'rover-rescue',
    stepTitles: {
      1: 'Walk to Rover & Ramp',
      2: 'First Ramp Roll',
      3: 'Fair Comparison',
      4: 'Explain Motion',
      5: 'Harbor Lab Restored'
    },
    defaultState: {
      height: 0.20,
      surface: 'smooth',
      isSimulating: false,
      trials: [],
      fairWarning: null,
      whatChanged: null,
      questionChoice: null,
      questionFeedback: null,
      completed: false,
      freeWalk: false,
      avatarNearTarget: false,
      cardCollapsed: false
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
        metricLabel: 'Stopping Distance'
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
    icon: '⚗',
    themeColor: '#b794e7',
    skyColor: 0x937ca8,
    fogColor: 0x937ca8,
    groundColor: 0x5a5464,
    targetName: 'Chemistry Workbench & Scale',
    facilityName: 'Recovery Bench',
    flagshipMission: 'nothing-lost',
    stepTitles: {
      1: 'Walk to Chemistry Bench',
      2: 'First Sealed Reaction',
      3: 'Fair Seal Comparison',
      4: 'Explain Mass Conservation',
      5: 'Matter Workshop Restored'
    },
    defaultState: {
      stopper: 'sealed', // 'sealed' vs 'open'
      reactantsMass: 60.0, // grams
      isSimulating: false,
      trials: [],
      fairWarning: null,
      whatChanged: null,
      questionChoice: null,
      questionFeedback: null,
      completed: false,
      freeWalk: false,
      avatarNearTarget: false,
      cardCollapsed: false
    },
    calculateResult(state) {
      const isSealed = state.stopper === 'sealed';
      // In sealed flask: mass before = 60.0g, mass after = 60.0g (gas trapped)
      // In open flask: CO2 gas escapes, mass drops to 56.8g (-3.2g)
      const massAfter = isSealed ? state.reactantsMass : Math.round((state.reactantsMass - 3.2) * 10) / 10;
      return {
        stopper: state.stopper,
        stopperName: isSealed ? 'Sealed Flask (Stopper On)' : 'Open Flask (Stopper Off)',
        reactantsMass: state.reactantsMass,
        massAfter,
        gasEscaped: isSealed ? 0 : 3.2,
        unit: 'g',
        metricLabel: 'Total Flask Mass'
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
    icon: '♧',
    themeColor: '#85cda2',
    skyColor: 0x8bd5b5,
    fogColor: 0x8bd5b5,
    groundColor: 0x487a55,
    targetName: 'Hydroponic Growth Chambers',
    facilityName: 'Growing Biodome',
    flagshipMission: 'biodome-balance',
    stepTitles: {
      1: 'Walk to Growth Chambers',
      2: 'First Plant Growth Cycle',
      3: 'Fair Light Comparison',
      4: 'Explain Photosynthesis',
      5: 'Living Valley Restored'
    },
    defaultState: {
      lightLevel: 500, // lux (200 = low, 500 = medium, 900 = high)
      waterPerDay: 50, // mL/day fixed
      isSimulating: false,
      trials: [],
      fairWarning: null,
      whatChanged: null,
      questionChoice: null,
      questionFeedback: null,
      completed: false,
      freeWalk: false,
      avatarNearTarget: false,
      cardCollapsed: false
    },
    calculateResult(state) {
      // Plant height after 7 days
      // Low (200 lux) -> 8.5 cm (spindly, pale)
      // Med (500 lux) -> 18.5 cm (healthy, vibrant green)
      // High (900 lux) -> 24.0 cm (robust, thick stem)
      let heightCm = 8.5;
      if (state.lightLevel >= 800) heightCm = 24.0;
      else if (state.lightLevel >= 400) heightCm = 18.5;
      return {
        lightLevel: state.lightLevel,
        lightLabel: state.lightLevel >= 800 ? 'High (900 lux)' : state.lightLevel >= 400 ? 'Medium (500 lux)' : 'Low (200 lux)',
        waterPerDay: state.waterPerDay,
        growthHeight: heightCm,
        unit: 'cm',
        metricLabel: 'Plant Growth (7 Days)'
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
    icon: '△',
    themeColor: '#df9c75',
    skyColor: 0xdfb49b,
    fogColor: 0xdfb49b,
    groundColor: 0x8a5d3f,
    targetName: 'Rainfall Flume & Runoff Basin',
    facilityName: 'Weather Station',
    flagshipMission: 'rain-garden',
    stepTitles: {
      1: 'Walk to Runoff Flume',
      2: 'Test Bare Soil Runoff',
      3: 'Fair Plant Cover Test',
      4: 'Explain Soil Conservation',
      5: 'Earthwatch Ridge Restored'
    },
    defaultState: {
      cover: 'bare', // 'bare' vs 'vegetation'
      rainfallRate: 30, // mm/h fixed
      isSimulating: false,
      trials: [],
      fairWarning: null,
      whatChanged: null,
      questionChoice: null,
      questionFeedback: null,
      completed: false,
      freeWalk: false,
      avatarNearTarget: false,
      cardCollapsed: false
    },
    calculateResult(state) {
      // Bare soil: high runoff (42 mL muddy water + high sediment erosion)
      // Dense vegetation roots: low runoff (6 mL clean water, soil held firmly)
      const isBare = state.cover === 'bare';
      const runoff = isBare ? 42.0 : 6.0;
      return {
        cover: state.cover,
        coverName: isBare ? 'Bare Unprotected Soil' : 'Dense Root Vegetation (Grass & Plants)',
        rainfallRate: state.rainfallRate,
        runoffMl: runoff,
        erosionLevel: isBare ? 'Severe Soil Erosion' : 'Negligible Soil Loss',
        unit: 'mL',
        metricLabel: 'Sediment Runoff Collected'
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
    icon: 'ϟ',
    themeColor: '#72ceda',
    skyColor: 0x76bccc,
    fogColor: 0x76bccc,
    groundColor: 0x3d6b73,
    targetName: 'Ocean Wave Tank & Beacon',
    facilityName: 'Island Link Beacon',
    flagshipMission: 'tune-the-link',
    stepTitles: {
      1: 'Walk to Wave Tank',
      2: 'First Wave Frequency Test',
      3: 'Fair Frequency Comparison',
      4: 'Explain Wave Relationship',
      5: 'Signal Coast Restored'
    },
    defaultState: {
      frequency: 1.0, // Hz (cycles/sec)
      waterDepth: 1.0, // meters fixed
      isSimulating: false,
      trials: [],
      fairWarning: null,
      whatChanged: null,
      questionChoice: null,
      questionFeedback: null,
      completed: false,
      freeWalk: false,
      avatarNearTarget: false,
      cardCollapsed: false
    },
    calculateResult(state) {
      // In wave tank at constant wave speed v = 4.0 m/s:
      // wavelength = speed / frequency
      // f = 1.0 Hz -> lambda = 4.0 m
      // f = 2.0 Hz -> lambda = 2.0 m
      // f = 0.5 Hz -> lambda = 8.0 m
      const speed = 4.0;
      const freq = Math.max(0.5, Math.min(3.0, state.frequency));
      const wavelength = Math.round((speed / freq) * 10) / 10;
      return {
        frequency: state.frequency,
        waterDepth: state.waterDepth,
        wavelength,
        waveSpeed: speed,
        unit: 'm',
        metricLabel: 'Measured Wavelength'
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
    icon: '✦',
    themeColor: '#93a9ed',
    skyColor: 0x080f1d,
    fogColor: 0x0b1626,
    groundColor: 0x222a3d,
    targetName: 'Central Planetary Orrery',
    facilityName: 'Telescope Observatory',
    flagshipMission: 'orbital-patterns',
    stepTitles: {
      1: 'Walk to Orrery Console',
      2: 'First Orbital Radius Run',
      3: 'Fair Distance Comparison',
      4: 'Explain Keplerian Orbit',
      5: 'Orbital Station Restored'
    },
    defaultState: {
      radiusAU: 1.0, // AU (1.0 = inner, 2.0 = outer)
      starMass: 1.0, // solar masses fixed
      isSimulating: false,
      trials: [],
      fairWarning: null,
      whatChanged: null,
      questionChoice: null,
      questionFeedback: null,
      completed: false,
      freeWalk: false,
      avatarNearTarget: false,
      cardCollapsed: false
    },
    calculateResult(state) {
      // Kepler's Third Law: T^2 = R^3 -> T = R^(1.5)
      // R = 1.0 AU -> T = 12.0 seconds (simulated period)
      // R = 2.0 AU -> T = 12.0 * 2^(1.5) = 33.94 ~ 34.0 seconds
      // R = 0.5 AU -> T = 12.0 * 0.5^(1.5) = 4.24 ~ 4.2 seconds
      const r = Math.max(0.5, Math.min(3.0, state.radiusAU));
      const periodSec = Math.round(12.0 * Math.pow(r, 1.5) * 10) / 10;
      return {
        radiusAU: state.radiusAU,
        starMass: state.starMass,
        periodSec,
        unit: 's',
        metricLabel: 'Orbital Period (One Orbit)'
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
    ...structuredClone(config.defaultState)
  };
}
