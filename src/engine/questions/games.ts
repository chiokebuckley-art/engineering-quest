import type { Difficulty, Question } from '../types';
import type { Rng } from '../rng';
import { VOLUME_KINDS, volumeQuestion } from './volume';
import { MEASURE_KINDS, measureQuestion } from './measure';
import { GEO_KINDS, geoQuestion } from './geo';
import { RATES_KINDS, ratesQuestion } from './rates';
import { FIT_KINDS, fitQuestion } from './fit';
import { PHYS_KINDS, physQuestion } from './phys';
import { PIPE_KINDS, pipeQuestion } from './pipe';
import { PROB_KINDS, probQuestion } from './prob';
import { SPIRAL_KINDS, spiralQuestion } from './spiral';
import { PRECALC_KINDS, precalcQuestion } from './precalc';
import { PATTERN_META, PATTERN_KINDS, patternQuestion } from './patterns';
import { BLOCKS_META, BLOCKS_KINDS, blocksQuestion } from './spatialBlocks';
import { PATHS_META, PATHS_KINDS, pathsQuestion } from './countingPaths';
import { DATA_META, DATA_KINDS, dataQuestion } from './dataLite';
import { LOGIC_META, LOGIC_KINDS, logicQuestion } from './logicLite';
import { PCTMULTI_META, PCTMULTI_KINDS, pctmultiQuestion } from './percentMulti';
import { GRID_META, GRID_KINDS, gridQuestion } from './gridShapes';
import { PATTERN_LESSONS } from '../../content/contest/patterns';
import { BLOCKS_LESSONS } from '../../content/contest/spatialBlocks';
import { PATHS_LESSONS } from '../../content/contest/countingPaths';
import { DATA_LESSONS } from '../../content/contest/dataLite';
import { LOGIC_LESSONS } from '../../content/contest/logicLite';
import { PCTMULTI_LESSONS } from '../../content/contest/percentMulti';
import { GRID_LESSONS } from '../../content/contest/gridShapes';
import type { ContestGameMeta } from '../contest/common';

/**
 * Picture-first games: every question shows the thing being measured. Registering a game here wires it into
 * the arcade (selection keys `game:kind`), Blitz stars, Versus, Stud, Weakest Gear, skills and the notebook.
 */
export interface KindDef { id: string; label: string; short: string; desc?: string }
export interface PictureGame {
  id: string; label: string; icon: string; blurb: string; topic: string; skill: string;
  kinds: KindDef[];
  question: (kind: string, difficulty: Difficulty, rng: Rng, skillId?: string) => Question;
  /** Lessons shown on the arcade panel: [lessonId, label]. */
  lessons: [string, string][];
  intro: string;
  /** Skill-tree position of the umbrella skill and the prerequisite skill. */
  tree: { x: number; y: number }; prereq: { skillId: string; mastery: number };
}

export const PICTURE_GAMES: Record<string, PictureGame> = {
  volume: {
    id: 'volume', label: 'Volume', icon: 'flask', blurb: 'Measure what a tank, crate or jug holds: count cubes, multiply sides, read the water line.', topic: 'Volume', skill: 'volume',
    kinds: VOLUME_KINDS, question: (k, d, rng, s) => volumeQuestion(k as never, d, rng, s), tree: { x: 4, y: 6 }, prereq: { skillId: 'mult', mastery: 30 },
    lessons: [['l.volume-cubes', 'Lesson 1: Fill it with cubes'], ['l.volume-jug', 'Lesson 2: Read the jug'], ['l.volume-formula', 'Lesson 3: Sides and missing sides'], ['l.volume-break', 'Lesson 4: Breaking apart a figure']],
    intro: 'Volume is how much space something takes up. Every question shows the thing you are measuring. Count the cubes (one layer × layers). Length × width × height for a box, in cm³. Read the jug: work out what one mark is worth first. Water displacement: drop it in, the rise is its volume. 1 cm³ = 1 mL. Figures that are not boxes get broken apart into prisms and added, or filled in and subtracted — two different ways, one answer.',
  },
  measure: {
    id: 'measure', label: 'Measuring', icon: 'ruler', blurb: 'Read rulers, tapes, dials, thermometers and clocks. Estimate, convert units, perimeter vs area.', topic: 'Measurement', skill: 'measure',
    kinds: MEASURE_KINDS, question: (k, d, rng, s) => measureQuestion(k as never, d, rng, s), tree: { x: 0, y: 5 }, prereq: { skillId: 'add.basic', mastery: 30 },
    lessons: [['l.measure-what', '1: What are we measuring?'], ['l.measure-marks', '2: Between the marks'], ['l.measure-zero', '3: Estimate, start at zero'], ['l.measure-convert', '4: Change the unit'], ['l.measure-around', '5: Around or inside'], ['l.measure-timetemp', '6: Time and temperature'], ['l.measure-loop', "7: The engineer's loop"]],
    intro: 'Ten steps, every time: what are we measuring, in which unit, with which tool, what does each mark mean, estimate, read it with its unit, convert if needed, how accurate must it be, use it, then check it makes sense. Changing the unit changes the description, not the thing: a 12-inch board is a 1-foot board.',
  },
  geo: {
    id: 'geo', label: 'Shapes & angles', icon: 'compass', blurb: 'Protractors, missing angles, circles and wheels, right triangles, slope, surface area, cylinders, scale drawings.', topic: 'Shapes & angles', skill: 'geo',
    kinds: GEO_KINDS, question: (k, d, rng, s) => geoQuestion(k as never, d, rng, s), tree: { x: 1, y: 7 }, prereq: { skillId: 'mult', mastery: 40 },
    lessons: [['l.geo-angles', '1: Angles and the protractor'], ['l.geo-circles', '2: Circles, wheels and cylinders'], ['l.geo-triangles', '3: Right triangles, slope and scale']],
    intro: 'Angles are read from the ray on zero. A line is 180°, a point 360°, a triangle 180°. Circumference ≈ 3.14 (pi) × diameter: that is how far a wheel rolls in one turn. Right triangles obey a² + b² = c². Slope is rise ÷ run. Surface area covers; volume fills. A 1:50 plan means real = drawing × 50.',
  },
  rates: {
    id: 'rates', label: 'Rates & conversions', icon: 'dashboard', blurb: 'Mix ratios, US ↔ metric, speed, flow, density, unit chains that cancel, rpm and travel.', topic: 'Rates & conversions', skill: 'rates',
    kinds: RATES_KINDS, question: (k, d, rng, s) => ratesQuestion(k as never, d, rng, s), tree: { x: 3, y: 8 }, prereq: { skillId: 'div', mastery: 40 },
    lessons: [['l.rates-ratio', '1: Ratios and unit rates'], ['l.rates-chain', '2: Units that cancel'], ['l.rates-flow', '3: Speed, flow and density']],
    intro: 'A rate is one thing per one of another: km per hour, litres per minute, grams per millilitre. Ratios scale every part by the same number. To change units, multiply by a fraction that equals 1 and cross out the units that cancel. 1 in = 25.4 mm exactly.',
  },
  fit: {
    id: 'fit', label: 'Precision & fit', icon: 'calipers', blurb: 'Calipers, micrometers, tolerances, feeler gauges, threads, wrench sizes, stack-up, error, sig figs, dial indicators, calibration.', topic: 'Precision & fit', skill: 'fit',
    kinds: FIT_KINDS, question: (k, d, rng, s) => fitQuestion(k as never, d, rng, s), tree: { x: 4, y: 8 }, prereq: { skillId: 'measure', mastery: 30 },
    lessons: [['l.fit-caliper', '1: Calipers and micrometers'], ['l.fit-tolerance', '2: Tolerance and fit'], ['l.fit-threads', '3: Threads, wrenches and gauges'], ['l.fit-error', '4: Error, sig figs and calibration']],
    intro: 'Precision tools read to a tenth or a hundredth of a millimetre. A tolerance says how far from nominal a part may be and still fit: tight, correct or loose. Bolt thread size and wrench size are different numbers. Errors add up along a stack, and a tool is only as good as its last calibration.',
  },
  phys: {
    id: 'phys', label: 'Forces & power', icon: 'gauge', blurb: 'Weight, torque, levers, pressure, work, power, volts and amps, thermal expansion.', topic: 'Forces & power', skill: 'phys',
    kinds: PHYS_KINDS, question: (k, d, rng, s) => physQuestion(k as never, d, rng, s), tree: { x: 2, y: 9 }, prereq: { skillId: 'rates', mastery: 30 },
    lessons: [['l.phys-torque', '1: Weight, torque and levers'], ['l.phys-pressure', '2: Pressure, work and power'], ['l.phys-electric', '3: Circuits and expansion']],
    intro: 'A kilogram weighs about 10 newtons. Torque is force × arm, and a torque wrench must be read in the units on the spec. Pressure is force ÷ area, so ten metres of water is about one bar. Work is force × distance, power is work ÷ time, and V = I × R on any circuit.',
  },
  pipe: {
    id: 'pipe', label: 'Plumbing', icon: 'pump', blurb: 'Nominal vs actual pipe size, cut lengths, routes, fall, capacity, flow tests, head pressure, 45° offsets.', topic: 'Plumbing', skill: 'pipe',
    kinds: PIPE_KINDS, question: (k, d, rng, s) => pipeQuestion(k as never, d, rng, s), tree: { x: 0, y: 9 }, prereq: { skillId: 'measure', mastery: 30 },
    lessons: [['l.pipe-size', '1: What size is this pipe?'], ['l.pipe-route', '2: Measure a route and cut'], ['l.pipe-flow', '3: Fall, flow and head']],
    intro: 'A "½ inch" pipe is 21.3 mm outside and 15.8 mm inside. Fittings grip the outside; water sees the inside. Measure centre to centre and subtract each fitting\'s take-off. Drains need fall. Flow is litres per minute; pressure comes from height. A 45° offset travels offset × 1.414 (travel per unit of offset).',
  },
};

PICTURE_GAMES.prob = {
  id: 'prob', label: 'Probability lab', icon: 'telescope', blurb: 'Nine stages from odds and counting to Bayes, distributions, regression, Elo, Markov chains and Kelly: build your own probability of an outcome.', topic: 'Probability', skill: 'prob',
  kinds: PROB_KINDS, question: (k, d, rng, s) => probQuestion(k as never, d, rng, s), tree: { x: 3, y: 9 }, prereq: { skillId: 'div', mastery: 40 },
  lessons: [['l.prob-1', '1: Odds and ratios'], ['l.prob-2', '2: Counting'], ['l.prob-3', '3: Probability rules and Bayes'], ['l.prob-4', '4: Statistics'], ['l.prob-5', '5: Distributions'], ['l.prob-6', '6: Regression'], ['l.prob-7', '7: Vectors and Elo'], ['l.prob-8', '8: Chains and Monte Carlo'], ['l.prob-9', '9: EV, Kelly and ruin'], ['l.prob-model', 'Capstone: build your model']],
  intro: 'The path to a predictive model, in order: odds and ratios → counting → sample spaces, event rules, conditional probability and Bayes → mean, spread, sampling error and tests → binomial, Poisson, normal and t → regression and logistic → vectors, matrices and Elo → Markov chains and Monte Carlo → expected value, Kelly and risk of ruin. Pick a stage, or Mixed. The Model Workshop (More menu) is where you put it together.',
};

PICTURE_GAMES.spiral = {
  id: 'spiral', label: 'Spiral review', icon: 'scroll', blurb: 'The weekly review sheet: powers of ten, place value, division area models, which expression equals it, and what the remainder means.', topic: 'Spiral review', skill: 'spiral',
  kinds: SPIRAL_KINDS, question: (k, d, rng, s) => spiralQuestion(k as never, d, rng, s), tree: { x: 1, y: 6 }, prereq: { skillId: 'div', mastery: 30 },
  lessons: [['l.spiral-powers', '1: Powers of ten'], ['l.spiral-place', '2: Ten times and one tenth'], ['l.spiral-area', '3: Division area models'], ['l.spiral-which', '4: Which expression equals it?'], ['l.spiral-remainder', '5: What the remainder means']],
  intro: 'Five skills a review sheet keeps coming back to. 10\u00b3 means 10 \u00d7 10 \u00d7 10, and multiplying by it slides every digit three places left. Each place is 10 times the place on its right and 1/10 of the place on its left. An area model divides by taking off friendly chunks and adding the partial quotients. To pick the right expression, estimate and check the ones digit instead of multiplying all four. And the remainder does not always mean the same thing: sometimes you round up, sometimes down, sometimes the leftover is the answer.',
};

PICTURE_GAMES.precalc = {
  id: 'precalc', label: 'Calculus Prep', icon: 'lab', blurb: 'The algebra beneath calculus: fractions, negatives, exponents and roots, rearranging formulas, scientific notation and units, functions, graphs and trig.', topic: 'Calculus prep', skill: 'precalc',
  kinds: PRECALC_KINDS, question: (k, d, rng, s) => precalcQuestion(k as never, d, rng, s), tree: { x: 4, y: 10 }, prereq: { skillId: 'div', mastery: 40 },
  lessons: [['l.pc-fractions', '1: Fractions'], ['l.pc-negatives', '2: Negative numbers'], ['l.pc-exponents', '3: Exponents and roots'], ['l.pc-rearrange', '4: Rearranging equations'], ['l.pc-scinot', '5: Scientific notation and units'], ['l.pc-functions', '6: Functions, graphs and trig']],
  intro: 'Six things every calculus, chemistry and engineering course assumes you already own. Fractions: make the bottoms match to add; multiply straight across; flip to divide. Negatives: minus a negative is a plus; same signs multiply to a positive. Exponents: add to multiply, subtract to divide, multiply for a power of a power; roots halve them. Rearranging: undo what is done to the letter, on both sides. Scientific notation: one digit in front, the power counts the moves. Units: multiply by a fraction equal to 1 and cancel. Functions are machines, lines are rise over run, and SOH CAH TOA names the sides of a right triangle.',
};

/** The Contest Path games (patterns, blocks, counting, data, logic, multi-step %, grids): picture games built from their own files. */
const contestGame = (meta: ContestGameMeta, kinds: KindDef[], question: PictureGame['question'], lessons: { id: string; title: string }[]): PictureGame => ({ ...meta, kinds, question, lessons: lessons.map((l) => [l.id, l.title]) });
PICTURE_GAMES.pattern = contestGame(PATTERN_META, PATTERN_KINDS, (k, d, rng, s) => patternQuestion(k as never, d, rng, s), PATTERN_LESSONS);
PICTURE_GAMES.blocks = contestGame(BLOCKS_META, BLOCKS_KINDS, (k, d, rng, s) => blocksQuestion(k as never, d, rng, s), BLOCKS_LESSONS);
PICTURE_GAMES.paths = contestGame(PATHS_META, PATHS_KINDS, (k, d, rng, s) => pathsQuestion(k as never, d, rng, s), PATHS_LESSONS);
PICTURE_GAMES.data = contestGame(DATA_META, DATA_KINDS, (k, d, rng, s) => dataQuestion(k as never, d, rng, s), DATA_LESSONS);
PICTURE_GAMES.logic = contestGame(LOGIC_META, LOGIC_KINDS, (k, d, rng, s) => logicQuestion(k as never, d, rng, s), LOGIC_LESSONS);
PICTURE_GAMES.pctmulti = contestGame(PCTMULTI_META, PCTMULTI_KINDS, (k, d, rng, s) => pctmultiQuestion(k as never, d, rng, s), PCTMULTI_LESSONS);
PICTURE_GAMES.grid = contestGame(GRID_META, GRID_KINDS, (k, d, rng, s) => gridQuestion(k as never, d, rng, s), GRID_LESSONS);
/** The Contest Path game ids, in the order the hub lists them. */
export const CONTEST_GAME_IDS = ['pattern', 'blocks', 'paths', 'data', 'logic', 'pctmulti', 'grid'] as const;
export type ContestGameId = typeof CONTEST_GAME_IDS[number];

export const pictureGame = (game: string): PictureGame | undefined => PICTURE_GAMES[game];
export const pictureGameForTopic = (topic: string): PictureGame | undefined => Object.values(PICTURE_GAMES).find((g) => g.topic === topic);
export const PICTURE_GAME_IDS = Object.keys(PICTURE_GAMES);
