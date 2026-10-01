import type { Region, RegionId } from '../types';
import { asset } from '../../assets';

const env = (f: string) => asset(`/assets/environments/${f}.svg`);
const icon = (f: string) => asset(`/assets/icons/${f}.svg`);

/**
 * World map regions. Coordinates are percentages of the map image.
 * The map reads bottom-left (pastoral arithmetic) to top-right (futuristic mathematics).
 */
export const REGIONS: Region[] = [
  {
    id: 'village', worldId: 'w1', name: 'Arithmetic Village', kind: 'town',
    description: 'Home base. Teachers, lessons, training and your lab.',
    map: { x: 11, y: 84 }, environment: env('arithmetic-village'), requirements: [], implemented: true, icon: icon('home'),
  },
  {
    id: 'mines', worldId: 'w1', name: 'Multiplication Mines', kind: 'dungeon',
    description: 'Eight galleries. Each one is guarded by a creature bound to a times table.',
    map: { x: 29, y: 72 }, environment: env('multiplication-mines'),
    requirements: [], requiredQuests: ['q.awakening'], implemented: true, icon: icon('pickaxe'),
  },
  {
    id: 'forge', worldId: 'w1', name: "Dragon's Forge", kind: 'lair',
    description: 'The boss lair. The Multiplication Dragon guards the first power core.',
    map: { x: 39, y: 58 }, environment: env('dragon-forge'),
    requirements: [{ skillId: 'mult', mastery: 75 }], requiredQuests: ['q.into-the-mines'], implemented: true, icon: icon('dragon'),
  },
  {
    id: 'forgotten', worldId: 'w1', name: 'Dungeon of Forgotten Knowledge', kind: 'dungeon',
    description: 'Specters made from the facts you keep missing. Beat them to remember.',
    map: { x: 19, y: 62 }, environment: env('forgotten-dungeon'),
    requirements: [], requiredQuests: ['q.into-the-mines'], implemented: true, icon: icon('skull'),
  },
  {
    id: 'division', worldId: 'w1', name: 'Division Dungeon', kind: 'dungeon',
    description: 'Halls split down the middle. Everything here is shared and divided.',
    map: { x: 46, y: 78 }, environment: env('division-dungeon'),
    requirements: [{ skillId: 'mult', mastery: 85 }], requiredQuests: ['q.power-core-1'], implemented: true, icon: icon('divide'),
  },
  {
    id: 'fraction-forest', worldId: 'w2', name: 'Fraction Forest', kind: 'wilds',
    description: 'Trees split into equal parts. Three groves of fraction creatures, and the three-headed Fraction Hydra at the heart.',
    map: { x: 56, y: 66 }, environment: env('fraction-forest'),
    requirements: [{ skillId: 'mult', mastery: 50 }], requiredQuests: ['q.into-the-mines'], implemented: true, icon: icon('crystal'),
  },
  {
    id: 'ratio-river', worldId: 'w2', name: 'Ratio River', kind: 'wilds',
    description: 'Mixing channels and locks. Ratios and rates.',
    map: { x: 66, y: 74 }, environment: env('multiplication-mines'),
    requirements: [{ skillId: 'frac', mastery: 85 }], implemented: false, icon: icon('compass'),
  },
  {
    id: 'unit-factory', worldId: 'w2', name: 'Unit Conversion Factory', kind: 'facility',
    description: 'Every pipe carries a different unit. Convert or explode.',
    map: { x: 73, y: 58 }, environment: env('multiplication-mines'),
    requirements: [{ skillId: 'ratio', mastery: 85 }, { skillId: 'sci.notation', mastery: 80 }], implemented: false, icon: icon('factory'),
  },
  {
    id: 'algebra-city', worldId: 'w4', name: 'Algebra City', kind: 'town',
    description: 'A city of unknowns. The Algebra Sorcerer rules the tower.',
    map: { x: 58, y: 46 }, environment: env('algebra-city'),
    requirements: [{ skillId: 'prealg.equations', mastery: 85 }, { skillId: 'units', mastery: 80 }], implemented: false, icon: icon('book'),
  },
  {
    id: 'geometry-kingdom', worldId: 'w5', name: 'Geometry Kingdom', kind: 'town',
    description: 'Build tanks, pipes and towers. The Geometry Colossus waits.',
    map: { x: 72, y: 42 }, environment: env('geometry-kingdom'),
    requirements: [{ skillId: 'alg1.linear', mastery: 85 }], implemented: false, icon: icon('anvil'),
  },
  {
    id: 'trig-mountains', worldId: 'w7', name: 'Trigonometry Mountains', kind: 'wilds',
    description: 'Angles, turrets and cranes. The Trigonometry Guardian.',
    map: { x: 60, y: 28 }, environment: env('trig-mountains'),
    requirements: [{ skillId: 'geo.pythagoras', mastery: 88 }, { skillId: 'alg2.functions', mastery: 85 }], implemented: false, icon: icon('target'),
  },
  {
    id: 'calculus-frontier', worldId: 'w9', name: 'Calculus Frontier', kind: 'frontier',
    description: 'Where everything changes. The Calculus Timekeeper.',
    map: { x: 75, y: 24 }, environment: env('calculus-frontier'),
    requirements: [{ skillId: 'precalc.functions', mastery: 92 }, { skillId: 'alg1.functions', mastery: 88 }, { skillId: 'trig.unit.circle', mastery: 91 }], implemented: false, icon: icon('hourglass'),
  },
  {
    id: 'linalg-grid', worldId: 'w12', name: 'Linear Algebra Grid', kind: 'facility',
    description: 'A glowing grid that bends and stretches.',
    map: { x: 87, y: 40 }, environment: env('linalg-grid'),
    requirements: [{ skillId: 'calc2.integration', mastery: 85 }, { skillId: 'alg2.matrices', mastery: 85 }], implemented: false, icon: icon('circuit'),
  },
  {
    id: 'ode-reactor', worldId: 'w13', name: 'Differential Equation Reactor', kind: 'facility',
    description: 'Systems that change over time: reactions, tanks, circuits.',
    map: { x: 88, y: 20 }, environment: env('ode-reactor'),
    requirements: [{ skillId: 'calc2.integration', mastery: 90 }, { skillId: 'linalg.eigen', mastery: 80 }], implemented: false, icon: icon('reactor'),
  },
  {
    id: 'stats-station', worldId: 'w14', name: 'Probability Research Station', kind: 'facility',
    description: 'Chance, data and reliability.',
    map: { x: 76, y: 10 }, environment: env('multiplication-mines'),
    requirements: [{ skillId: 'calc1.integration', mastery: 85 }, { skillId: 'percent', mastery: 90 }], implemented: false, icon: icon('telescope'),
  },
  {
    id: 'advanced-regions', worldId: 'w16', name: 'The Distant Regions', kind: 'frontier',
    description: 'Barely visible through the fog.',
    map: { x: 93, y: 7 }, environment: env('multiplication-mines'),
    requirements: [{ skillId: 'ode.systems', mastery: 90 }, { skillId: 'calc3.fields', mastery: 90 }], implemented: false, icon: icon('robot'),
  },
];

const idx = new Map(REGIONS.map((r) => [r.id, r]));
export const regionById = (id: RegionId) => idx.get(id);

/** Map paths drawn between regions (for the world map overlay). */
export const MAP_PATHS: [RegionId, RegionId][] = [
  ['village', 'mines'], ['mines', 'forge'], ['village', 'forgotten'], ['mines', 'division'],
  ['division', 'fraction-forest'], ['fraction-forest', 'ratio-river'], ['ratio-river', 'unit-factory'],
  ['fraction-forest', 'algebra-city'], ['algebra-city', 'geometry-kingdom'], ['algebra-city', 'trig-mountains'],
  ['trig-mountains', 'calculus-frontier'], ['geometry-kingdom', 'linalg-grid'], ['calculus-frontier', 'ode-reactor'],
  ['calculus-frontier', 'stats-station'], ['linalg-grid', 'ode-reactor'], ['ode-reactor', 'advanced-regions'],
];
