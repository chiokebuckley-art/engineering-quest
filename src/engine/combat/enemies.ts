import type { EnemyDef, EnemyId } from '../types';
import { asset } from '../../assets';

const sprite = (f: string) => asset(`/assets/enemies/${f}.svg`);

export const ENEMIES: EnemyDef[] = [
  {
    id: 'ore-slime', name: 'Ore Slime', title: 'Gallery 1 · the ×2 table', sprite: sprite('ore-slime'),
    hp: 60, hitDamage: 20, attack: 6, skills: ['mult.2', 'mult.1'], difficulty: 1, xp: 30,
    drops: [{ itemId: 'iron-bolt', chance: 0.8, qty: [2, 4] }, { itemId: 'copper-gear', chance: 0.3, qty: [1, 1] }],
    flavor: 'It doubles everything it eats. ×2!', tint: '#2dd4bf',
  },
  {
    id: 'tunnel-goblin', name: 'Tunnel Goblin', title: 'Gallery 2 · ×3 and ×4', sprite: sprite('tunnel-goblin'),
    hp: 100, hitDamage: 20, attack: 8, skills: ['mult.3', 'mult.4'], difficulty: 2, xp: 45,
    drops: [{ itemId: 'iron-bolt', chance: 0.8, qty: [2, 5] }, { itemId: 'timber', chance: 0.5, qty: [1, 2] }, { itemId: 'repair-kit', chance: 0.15, qty: [1, 1] }],
    flavor: 'Steals in threes and fours.', tint: '#4ade80',
  },
  {
    id: 'rust-bat', name: 'Rust Bat', title: 'Gallery 3 · ×5 and ×10', sprite: sprite('rust-bat'),
    hp: 100, hitDamage: 20, attack: 8, skills: ['mult.5', 'mult.10'], difficulty: 2, xp: 50,
    drops: [{ itemId: 'copper-gear', chance: 0.6, qty: [1, 3] }, { itemId: 'energy-cell', chance: 0.2, qty: [1, 1] }],
    flavor: 'Flaps in fives and tens.', tint: '#ffb347',
  },
  {
    id: 'stone-golem', name: 'Stone Golem', title: 'Gallery 4 · the ×6 table', sprite: sprite('stone-golem'),
    hp: 120, hitDamage: 20, attack: 10, skills: ['mult.6'], difficulty: 3, xp: 70,
    drops: [{ itemId: 'ore-crystal', chance: 0.5, qty: [1, 2] }, { itemId: 'iron-bolt', chance: 0.7, qty: [3, 6] }, { itemId: 'miners-gloves', chance: 0.12, qty: [1, 1] }],
    flavor: 'Made of six-sided stones. ×6 is ×5 plus one more.', tint: '#94a3b8',
  },
  {
    id: 'fire-beast', name: 'Fire Beast', title: 'Gallery 5 · the ×7 table', sprite: sprite('fire-beast'),
    hp: 140, hitDamage: 20, attack: 12, skills: ['mult.7'], difficulty: 3, xp: 90,
    drops: [{ itemId: 'ore-crystal', chance: 0.5, qty: [1, 2] }, { itemId: 'brass-plate', chance: 0.4, qty: [1, 2] }, { itemId: 'repair-kit', chance: 0.2, qty: [1, 1] }],
    flavor: 'Seven vents, seven flames. The toughest table.', tint: '#ef4444',
  },
  {
    id: 'shadow-knight', name: 'Shadow Knight', title: 'Gallery 6 · the ×8 table', sprite: sprite('shadow-knight'),
    hp: 140, hitDamage: 20, attack: 12, skills: ['mult.8'], difficulty: 3, xp: 100,
    drops: [{ itemId: 'brass-plate', chance: 0.5, qty: [1, 2] }, { itemId: 'iron-boots', chance: 0.12, qty: [1, 1] }, { itemId: 'focus-tonic', chance: 0.25, qty: [1, 1] }],
    flavor: 'Double, double, double. That\'s ×8.', tint: '#a78bfa',
  },
  {
    id: 'crystal-wraith', name: 'Crystal Wraith', title: 'Gallery 7 · the ×9 table', sprite: sprite('crystal-wraith'),
    hp: 140, hitDamage: 20, attack: 12, skills: ['mult.9'], difficulty: 3, xp: 100,
    drops: [{ itemId: 'ore-crystal', chance: 0.8, qty: [1, 3] }, { itemId: 'focus-tonic', chance: 0.25, qty: [1, 1] }],
    flavor: 'Its digits always add to nine.', tint: '#22d3ee',
  },
  {
    id: 'gear-sentinel', name: 'Gear Sentinel', title: 'Gallery 8 · ×11 and ×12', sprite: sprite('gear-sentinel'),
    hp: 160, hitDamage: 20, attack: 14, skills: ['mult.11', 'mult.12', 'mult.missing'], difficulty: 4, xp: 130,
    drops: [{ itemId: 'copper-gear', chance: 0.9, qty: [2, 4] }, { itemId: 'brass-calipers', chance: 0.15, qty: [1, 1] }, { itemId: 'brass-plate', chance: 0.5, qty: [1, 2] }],
    flavor: 'Twelve teeth per gear. Built in the age of dozens.', tint: '#c9a227',
  },
  {
    id: 'multiplication-dragon', name: 'Multiplication Dragon', title: 'BOSS · all facts ×1–×12', sprite: sprite('multiplication-dragon'),
    hp: 900, hitDamage: 20, attack: 8, skills: ['mult'], difficulty: 3, xp: 500, isBoss: true,
    bossRules: { questions: 50, maxMisses: 5, requiredAccuracy: 0.9 },
    drops: [{ itemId: 'power-core-mult', chance: 1, qty: [1, 1] }, { itemId: 'ore-crystal', chance: 1, qty: [5, 8] }, { itemId: 'scholars-charm', chance: 1, qty: [1, 1] }],
    flavor: 'Fifty facts from every table. Miss more than five and its scales harden.', tint: '#ffb347',
    phases: [
      { at: 1, name: 'The Waking', text: 'Straight facts from every table. Stay steady.' },
      { at: 0.66, name: 'Mirror Scales', text: 'The Dragon swaps factors to confuse you. 7 × 8 and 8 × 7 are the same fact — order never changes a product.', special: 'mirror' },
      { at: 0.33, name: 'Split Breath', text: 'Big facts come apart. 7 × 8 = 7 × 5 + 7 × 3: split a hard fact into two easy ones and add.', special: 'split' },
    ],
  },
  {
    id: 'forgotten-specter', name: 'Forgotten Specter', title: 'a fact you keep forgetting', sprite: sprite('forgotten-specter'),
    hp: 60, hitDamage: 20, attack: 6, skills: ['mult'], difficulty: 2, xp: 40,
    drops: [{ itemId: 'ore-crystal', chance: 0.4, qty: [1, 1] }, { itemId: 'focus-tonic', chance: 0.2, qty: [1, 1] }],
    flavor: 'Made of the facts you forgot. Answer, and it fades.', tint: '#a78bfa',
  },
  {
    id: 'division-imp', name: 'Division Imp', title: 'Division Dungeon · ÷2 to ÷6', sprite: sprite('division-imp'),
    hp: 100, hitDamage: 20, attack: 8, skills: ['div.2', 'div.3', 'div.4', 'div.5', 'div.6'], difficulty: 2, xp: 60,
    drops: [{ itemId: 'iron-bolt', chance: 0.8, qty: [2, 5] }, { itemId: 'copper-gear', chance: 0.4, qty: [1, 2] }],
    flavor: 'Splits everything into equal shares.', tint: '#ef4444',
  },
  {
    id: 'division-imp-2', name: 'Division Imp Elder', title: 'Division Dungeon · ÷7 to ÷12', sprite: sprite('division-imp'),
    hp: 140, hitDamage: 20, attack: 12, skills: ['div.7', 'div.8', 'div.9', 'div.10', 'div.11', 'div.12'], difficulty: 3, xp: 100,
    drops: [{ itemId: 'ore-crystal', chance: 0.6, qty: [1, 2] }, { itemId: 'brass-plate', chance: 0.4, qty: [1, 1] }],
    flavor: 'Divides by the harder numbers.', tint: '#f97316',
  },
  {
    id: 'division-titan', name: 'Division Titan', title: 'BOSS · division facts', sprite: sprite('division-titan'),
    hp: 900, hitDamage: 20, attack: 8, skills: ['div'], difficulty: 3, xp: 600, isBoss: true,
    bossRules: { questions: 50, maxMisses: 5, requiredAccuracy: 0.9 },
    drops: [{ itemId: 'ore-crystal', chance: 1, qty: [6, 10] }, { itemId: 'surveyor-hammer', chance: 1, qty: [1, 1] }],
    flavor: 'Holds the two halves of the world apart.', tint: '#22d3ee',
  },
  /* ---------------- Fraction Forest (World 2) ---------------- */
  {
    id: 'fraction-sprite', name: 'Fraction Sprite', title: 'Halving Glade · adding fractions', sprite: sprite('fraction-sprite'),
    hp: 60, hitDamage: 20, attack: 6, skills: ['precalc.frac.add'], difficulty: 1, xp: 45,
    drops: [{ itemId: 'timber', chance: 0.6, qty: [1, 2] }, { itemId: 'iron-bolt', chance: 0.6, qty: [2, 4] }],
    flavor: 'Made of slices. Same-size slices add; different sizes must be cut to match.', tint: '#bef264',
  },
  {
    id: 'bramble-knight', name: 'Bramble Knight', title: 'Bramble Crossing · unlike denominators', sprite: sprite('shadow-knight'), hue: 95,
    hp: 100, hitDamage: 20, attack: 8, skills: ['precalc.frac.add'], difficulty: 3, xp: 70,
    drops: [{ itemId: 'timber', chance: 0.7, qty: [1, 3] }, { itemId: 'repair-kit', chance: 0.2, qty: [1, 1] }],
    flavor: 'Its armour is cut in thirds and quarters. Find the common denominator to break it.', tint: '#84cc16',
  },
  {
    id: 'spore-weaver', name: 'Spore Weaver', title: 'Mushroom Ring · multiplying and dividing', sprite: sprite('crystal-wraith'), hue: 70,
    hp: 120, hitDamage: 20, attack: 10, skills: ['precalc.frac.mul'], difficulty: 3, xp: 90,
    drops: [{ itemId: 'ore-crystal', chance: 0.5, qty: [1, 2] }, { itemId: 'focus-tonic', chance: 0.25, qty: [1, 1] }],
    flavor: 'Multiplies straight across. Divide it by flipping — keep, change, flip.', tint: '#a3e635',
  },
  {
    id: 'fraction-hydra', name: 'Fraction Hydra', title: 'BOSS · every fraction skill', sprite: sprite('fraction-hydra'),
    hp: 360, hitDamage: 20, attack: 8, skills: ['precalc.frac.add', 'precalc.frac.mul'], difficulty: 3, xp: 450, isBoss: true,
    bossRules: { questions: 20, maxMisses: 4, requiredAccuracy: 0.8 },
    drops: [{ itemId: 'ore-crystal', chance: 1, qty: [4, 6] }, { itemId: 'brass-plate', chance: 1, qty: [2, 3] }],
    flavor: 'Three heads, three kinds of fraction. Beat each head in turn.', tint: '#84cc16',
    phases: [
      { at: 1, name: 'Head of Sums', text: 'Add and subtract fractions: make the bottoms match first.', skills: ['precalc.frac.add'] },
      { at: 0.66, name: 'Head of Products', text: 'Multiply straight across; divide by flipping the second fraction.', skills: ['precalc.frac.mul'] },
      { at: 0.33, name: 'Head of Everything', text: 'All of it at once. Read the sign before you start.', skills: ['precalc.frac.add', 'precalc.frac.mul'] },
    ],
  },
  /* ---------------- scouts: a first taste of every region ahead ---------------- */
  ...([
    ['ratio-river', 'River Otter-Engineer', 'rust-bat', 200, ['rates.ratio', 'rates.speed'], 'Mixing channels and locks run on ratios and rates.'],
    ['unit-factory', 'Conversion Automaton', 'gear-sentinel', 170, ['precalc.units', 'rates.usmetric'], 'Every pipe carries a different unit. Convert or it jams.'],
    ['algebra-city', 'Equation Golem', 'stone-golem', 220, ['precalc.rearrange', 'precalc.func', 'precalc.neg'], 'It speaks in formulas. Undo what is done to the letter.'],
    ['geometry-kingdom', 'Compass Knight', 'shadow-knight', 30, ['geo.angles', 'geo.circle', 'geo.pythag'], 'Angles, circles and right triangles guard the gate.'],
    ['trig-mountains', 'Ridge Wraith', 'crystal-wraith', 300, ['precalc.trig'], 'SOH CAH TOA: name the sides from the angle.'],
    ['calculus-frontier', 'Timekeeper Scout', 'gear-sentinel', 260, ['precalc.graph', 'precalc.func', 'precalc.exp'], 'Slope is the first idea of calculus: how fast one thing changes as another does.'],
    ['linalg-grid', 'Grid Sentinel', 'gear-sentinel', 120, ['prob.vectors'], 'Vectors and matrices: many numbers moving together.'],
    ['ode-reactor', 'Reactor Imp', 'fire-beast', 40, ['rates.flow', 'precalc.scinot'], 'Rates of flow and very big and very small numbers.'],
    ['stats-station', 'Station Analyst', 'forgotten-specter', 200, ['prob.center', 'prob.events', 'prob.algebra'], 'Averages, spread and chance: the research station runs on data.'],
  ] as [string, string, string, number, string[], string][]).map(([region, name, spr, hue, skills, flavor]) => ({
    id: `scout-${region}`, name, title: 'Scouting mission · a preview of what lies ahead', sprite: sprite(spr), hue,
    hp: 60, hitDamage: 20, attack: 4, skills, difficulty: 2 as const, xp: 25, drops: [], flavor, tint: '#94a3b8',
  })),
];

const idx = new Map(ENEMIES.map((e) => [e.id, e]));
export const enemyById = (id: EnemyId) => idx.get(id);

/** Multiplication Mines galleries: depth → enemy and how many wins clear the depth. */
/** An optional objective on a gallery. Completing it rescues someone or recovers something the village can see. */
export interface SideObjective { kind: 'nomiss' | 'streak' | 'fast' | 'nohint'; target: number; text: string; reward: string }
export interface DepthDef { depth: number; enemyId: EnemyId; name: string; clears: number; tables: number[]; side?: SideObjective; skills?: string[] }

export const MINE_DEPTHS: DepthDef[] = [
  { depth: 1, enemyId: 'ore-slime', name: 'The Doubling Gallery', clears: 2, tables: [1, 2], side: { kind: 'nomiss', target: 0, text: 'Rescue Pip the trapped miner: win without a miss', reward: 'Pip joins the village' } },
  { depth: 2, enemyId: 'tunnel-goblin', name: 'Goblin Warrens', clears: 2, tables: [3, 4], side: { kind: 'streak', target: 5, text: 'Collect 5 glowing ore: land 5 hits in a row', reward: 'the ore lights the market stall' } },
  { depth: 3, enemyId: 'rust-bat', name: 'The Belfry Shaft', clears: 2, tables: [5, 10], side: { kind: 'fast', target: 60, text: 'Ring the bell: win in under 60 seconds', reward: 'the village bell rings again' } },
  { depth: 4, enemyId: 'stone-golem', name: 'Hexstone Hall', clears: 2, tables: [6], side: { kind: 'nohint', target: 0, text: 'Find the ledger by lamplight: win with no tips', reward: 'the library window lights' } },
  { depth: 5, enemyId: 'fire-beast', name: 'The Furnace Level', clears: 2, tables: [7], side: { kind: 'nomiss', target: 0, text: 'Rescue the smith: win without a miss', reward: 'the forge chimney smokes again' } },
  { depth: 6, enemyId: 'shadow-knight', name: 'Octagon Crypt', clears: 2, tables: [8], side: { kind: 'streak', target: 6, text: 'Recover the eight keys: 6 hits in a row', reward: 'the crypt gate is fitted with a lock' } },
  { depth: 7, enemyId: 'crystal-wraith', name: 'Ninefold Cavern', clears: 2, tables: [9], side: { kind: 'fast', target: 75, text: 'Catch the crystal light: win in under 75 seconds', reward: 'crystal lamps line the square' } },
  { depth: 8, enemyId: 'gear-sentinel', name: 'The Sentinel Vault', clears: 2, tables: [11, 12], side: { kind: 'nomiss', target: 0, text: 'Rescue the clockmaker: win without a miss', reward: 'the town clock starts ticking' } },
];

export const DIVISION_DEPTHS: DepthDef[] = [
  { depth: 1, enemyId: 'division-imp', name: 'Hall of Halves', clears: 3, tables: [2, 3, 4, 5, 6] },
  { depth: 2, enemyId: 'division-imp-2', name: 'Hall of Sevenths', clears: 3, tables: [7, 8, 9, 10, 11, 12] },
];

/** Fraction Forest groves: the first playable region of World 2. */
export const FOREST_DEPTHS: DepthDef[] = [
  { depth: 1, enemyId: 'fraction-sprite', name: 'Halving Glade', clears: 2, tables: [], skills: ['precalc.frac.add'], side: { kind: 'nomiss', target: 0, text: 'Free the lantern moths: win without a miss', reward: 'moth-lanterns glow at the forest edge' } },
  { depth: 2, enemyId: 'bramble-knight', name: 'Bramble Crossing', clears: 2, tables: [], skills: ['precalc.frac.add'], side: { kind: 'streak', target: 4, text: 'Cut a clean path: 4 hits in a row', reward: 'a path opens through the brambles' } },
  { depth: 3, enemyId: 'spore-weaver', name: 'Mushroom Ring', clears: 2, tables: [], skills: ['precalc.frac.mul'], side: { kind: 'nohint', target: 0, text: 'Read the ring alone: win with no tips', reward: 'the mushroom ring glows for the village' } },
];

/** The gallery / hall / grove list for a region, if it has one. */
export const DEPTHS: Record<string, DepthDef[]> = { mines: MINE_DEPTHS, division: DIVISION_DEPTHS, 'fraction-forest': FOREST_DEPTHS };
export const depthDef = (regionId: string, depth: number) => DEPTHS[regionId]?.find((d) => d.depth === depth);
