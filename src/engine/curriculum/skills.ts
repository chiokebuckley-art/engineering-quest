import { PICTURE_GAMES } from '../questions/games';
import { MM_SKILLS } from '../mentalmath/curriculum';
import type { Skill, SkillId } from '../types';
import { bondFacts, divisionTableFacts, tableFacts } from './facts';

const T = (n: number) => n * 1000;

/** Multiplication table skills (×1 … ×12), each tracking 12 canonical facts. */
const tableSkills: Skill[] = Array.from({ length: 12 }, (_, i) => i + 1).map((n) => ({
  id: `mult.${n}`,
  name: `×${n} Table`,
  shortName: `×${n}`,
  description: `Multiplying by ${n}: ${n}×1 through ${n}×12.`,
  worldId: 'w1',
  prerequisites: n <= 2 ? [{ skillId: 'add.basic', mastery: 60 }] : [{ skillId: `mult.${tablePrereq(n)}`, mastery: 70 }],
  facts: tableFacts(n),
  generator: 'mult.table',
  generatorParams: { table: n },
  targetTimeMs: T(4),
  tree: { x: 0, y: 0 },
  parent: 'mult',
  whyItMatters: `Every table is a set of tools. The ×${n} facts appear inside fractions, ratios, unit conversions and algebra — you will use them thousands of times.`,
  implemented: true,
}));

/** Sensible teaching order: 1,2,10,5,3,4,6,9,7,8,11,12. */
function tablePrereq(n: number): number {
  const order = [1, 2, 10, 5, 3, 4, 6, 9, 7, 8, 11, 12];
  const i = order.indexOf(n);
  return order[Math.max(0, i - 1)];
}
export const TABLE_ORDER = [1, 2, 10, 5, 3, 4, 6, 9, 7, 8, 11, 12];

const divTableSkills: Skill[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({
  id: `div.${n}`,
  name: `÷${n} Facts`,
  shortName: `÷${n}`,
  description: `Dividing by ${n}: from ${n}÷${n} to ${n * 12}÷${n}. The inverse of the ×${n} table.`,
  worldId: 'w1',
  prerequisites: [{ skillId: `mult.${n}`, mastery: 75 }],
  facts: divisionTableFacts(n),
  generator: 'div.table',
  generatorParams: { divisor: n },
  targetTimeMs: T(5),
  tree: { x: 0, y: 0 },
  parent: 'div',
  whyItMatters: `Division undoes multiplication. Splitting loads, finding rates and simplifying fractions all use the ÷${n} facts.`,
  implemented: true,
}));

/** Make 5 and 10, then every five up to 100: the second-grade ladder. */
export const BOND_TARGETS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
const bondSkills: Skill[] = BOND_TARGETS.map((t) => ({
  id: `bonds.${t}`,
  name: `Make ${t}`,
  shortName: `Make ${t}`,
  description: `Number bonds to ${t}: pairs of numbers that add up to ${t}.`,
  worldId: 'w1',
  prerequisites: t <= 10 ? [] : t <= 20 ? [{ skillId: 'bonds.10', mastery: 50 }] : [{ skillId: 'bonds.20', mastery: 50 }],
  facts: bondFacts(t),
  generator: 'bonds',
  generatorParams: { target: t },
  targetTimeMs: t <= 10 ? 3000 : t <= 20 ? 3500 : 4000,
  tree: { x: 0, y: 0 },
  parent: 'add.basic',
  whyItMatters: `Knowing what makes ${t} instantly is how engineers do mental arithmetic: fill the gap, then add the rest.`,
  implemented: true,
}));

const prealg: Skill[] = [
  {
    id: 'prealg.expressions', name: 'Variables & Expressions', shortName: 'Expressions',
    description: 'A letter stands for a number. Evaluate expressions like 2x + 3 when x = 4.',
    worldId: 'w3', prerequisites: [{ skillId: 'mult', mastery: 60 }], generator: 'alg.evaluate', targetTimeMs: T(8), tree: { x: 0, y: 0 },
    whyItMatters: 'Formulas are expressions. Plugging in measured values is the daily work of engineering.', implemented: true,
  },
  {
    id: 'prealg.equations', name: 'One-step Equations', shortName: 'Equations',
    description: 'Solve x + 7 = 12, x − 4 = 9, 3x = 21 and x ÷ 4 = 5 by doing the same thing to both sides.',
    worldId: 'w3', prerequisites: [{ skillId: 'prealg.expressions', mastery: 50 }, { skillId: 'div', mastery: 50 }], generator: 'alg.onestep', targetTimeMs: T(8), tree: { x: 0, y: 0 },
    whyItMatters: 'Solving for the unknown is how every formula is rearranged: V = IR becomes I = V ÷ R.', implemented: true,
  },
];

const WORD_KINDS: [string, string, string, string, { skillId: SkillId; mastery: number }[]][] = [
  ['add', 'Word Problems: Add', 'Put together, add to. Spot "altogether", "in all", "more".', 'add.basic', [{ skillId: 'add.basic', mastery: 40 }]],
  ['sub', 'Word Problems: Subtract', 'Take away, compare, missing part. Spot "left", "how many more", "still needs".', 'sub.basic', [{ skillId: 'sub.basic', mastery: 40 }]],
  ['mult', 'Word Problems: Multiply', 'Equal groups, times as many, rows, rates. Spot "each", "every", "per".', 'mult', [{ skillId: 'mult', mastery: 40 }]],
  ['div', 'Word Problems: Divide', 'Fair share and how-many-groups. Spot "shared equally", "each gets".', 'div', [{ skillId: 'div', mastery: 40 }]],
  ['twostep', 'Two-step Word Problems', 'Find the hidden first question, then finish the job.', 'word', [{ skillId: 'word.mult', mastery: 50 }, { skillId: 'word.sub', mastery: 50 }]],
];
const wordSkills: Skill[] = [
  {
    id: 'word', name: 'Word Problem Detective', shortName: 'Word problems',
    description: 'Read a story, decide which operation it needs and why, set it up, solve it.',
    worldId: 'w1', prerequisites: [{ skillId: 'add.basic', mastery: 40 }], generator: 'word', generatorParams: { op: 'mixed' }, targetTimeMs: T(20), tree: { x: 4, y: 4 },
    whyItMatters: 'Real problems never arrive as "7 × 8". Turning a situation into the right setup is the first skill of every engineer.', implemented: true,
  },
  ...WORD_KINDS.map(([k, name, description, parent, prerequisites]) => ({
    id: `word.${k}`, name, shortName: name.replace('Word Problems: ', 'Words: '), description, worldId: 'w1', prerequisites,
    generator: 'word' as const, generatorParams: { op: k }, targetTimeMs: T(k === 'twostep' ? 30 : 20), tree: { x: 0, y: 0 }, parent: parent === 'word' ? 'word' : 'word',
    whyItMatters: 'Choosing the operation is the thinking part. The arithmetic is the easy part.', implemented: true,
  })),
];

const trickSkills: Skill[] = [
  {
    id: 'tricks', name: 'Mental Math Tricks', shortName: 'Tricks',
    description: 'Fast ways to multiply in your head: ×11, squares ending in 5, same tens with units that make 10.',
    worldId: 'w1', prerequisites: [{ skillId: 'mult', mastery: 50 }], generator: 'tricks', generatorParams: { kind: 'all' }, targetTimeMs: T(10), tree: { x: 4, y: 5 },
    whyItMatters: 'Engineers check numbers in their heads all day. A trick that turns 86 × 84 into "72 and 24" is a superpower.', implemented: true,
  },
  { id: 'trick.11', name: 'Trick: Multiply by 11', shortName: '×11 trick', description: 'Split the digits and put their sums in the middle. Carry when a sum is 10 or more.', worldId: 'w1', prerequisites: [{ skillId: 'add.basic', mastery: 50 }], generator: 'tricks', generatorParams: { kind: '11' }, targetTimeMs: T(8), tree: { x: 0, y: 0 }, parent: 'tricks', whyItMatters: '×11 shows up in percentages (10% + 1%) and quick scaling.', implemented: true },
  { id: 'trick.sq5', name: 'Trick: Squares Ending in 5', shortName: '…5² trick', description: 'n × (n + 1), then attach 25. 75² = 56|25.', worldId: 'w1', prerequisites: [{ skillId: 'mult', mastery: 50 }], generator: 'tricks', generatorParams: { kind: 'sq5' }, targetTimeMs: T(8), tree: { x: 0, y: 0 }, parent: 'tricks', whyItMatters: 'Squares are everywhere: area, energy, the Pythagorean theorem.', implemented: true },
  { id: 'trick.same10', name: 'Trick: Same Tens, Units Make 10', shortName: 'Same-tens trick', description: 'Same first digit, last digits add to 10: t × (t + 1) on the left, units × units (two digits) on the right.', worldId: 'w1', prerequisites: [{ skillId: 'trick.sq5', mastery: 40 }], generator: 'tricks', generatorParams: { kind: 'same10' }, targetTimeMs: T(10), tree: { x: 0, y: 0 }, parent: 'tricks', whyItMatters: 'This is the difference of squares in disguise: (t5)² − d². Algebra hiding inside arithmetic.', implemented: true },
];

const MENTAL: [string, string, string][] = [
  ['tens', 'Add & Subtract Tens', 'Add or subtract 10 and multiples of 10 instantly: only the tens digit changes.'],
  ['next10', 'Distance to the Next Ten', '58 needs 2 to reach 60. The complements to 10, applied to any two-digit number.'],
  ['split', 'Break Apart', '43 + 25 → 43 + 20 + 5. Tens first, then ones.'],
  ['round', 'Round & Compensate', '47 + 38 → 47 + 40 − 2. 68 − 29 → 68 − 30 + 1.'],
  ['make10', 'Make a Ten', '58 + 27 → 60 + 25. Move what the first number needs.'],
  ['distance', 'Count the Distance', '83 − 47: 47 → 50 is 3, 50 → 80 is 30, 80 → 83 is 3. 36.'],
];
const mentalSkills: Skill[] = [
  {
    id: 'mental', name: 'Mental Addition & Subtraction', shortName: 'Mental + −',
    description: 'Two-digit sums and differences in your head by seeing tens, ones and the distance to the next ten.',
    worldId: 'w1', prerequisites: [{ skillId: 'add.basic', mastery: 40 }, { skillId: 'bonds.10', mastery: 40 }], generator: 'mental', generatorParams: { kind: 'all' }, targetTimeMs: T(6), tree: { x: 0, y: 1 },
    whyItMatters: 'Money, measurements, estimates and every algebra step lean on fast, structural addition and subtraction.', implemented: true,
  },
  ...MENTAL.map(([k, name, description]) => ({
    id: `mental.${k}`, name, shortName: name, description, worldId: 'w1', prerequisites: [{ skillId: 'add.basic', mastery: 40 }],
    generator: 'mental' as const, generatorParams: { kind: k }, targetTimeMs: T(6), tree: { x: 0, y: 0 }, parent: 'mental',
    whyItMatters: 'Seeing the structure of a number beats redoing the written algorithm in your head.', implemented: true,
  })),
];

const VOLUME: [string, string, string][] = [
  ['cubes', 'Count the Cubes', 'Cubes in one layer × number of layers.'],
  ['prism', 'Length × Width × Height', 'A box: multiply the three sides. Answer in cm³.'],
  ['liquid', 'Read the Jug', 'Work out what one mark is worth, then read the water line.'],
  ['displace', 'Water Displacement', 'Drop it in: the water rises by exactly its volume. after − before.'],
  ['missing', 'Find the Missing Side', 'Volume ÷ (the two sides you know).'],
  ['composite', 'Break Apart a Figure', 'Split an L-shaped solid into rectangular prisms, find each, add them.'],
  ['subtract', 'Fill In and Subtract', 'Enclose the figure in one box, then take away the piece that is missing.'],
  ['stairs', 'Staircase Figures', 'One upright slab under each step, then add.'],
]
const volumeSkills: Skill[] = [
  {
    id: 'volume', name: 'Measuring Volume', shortName: 'Volume',
    description: 'How much space something takes up: count cubes, multiply sides, read a jug, or measure by displacement.',
    worldId: 'w1', prerequisites: [{ skillId: 'mult', mastery: 30 }], generator: 'volume', generatorParams: { kind: 'all' }, targetTimeMs: T(12), tree: { x: 4, y: 6 },
    whyItMatters: 'Tanks, engines, concrete pours and packing crates are all volume problems. cm³ and mL are the same thing.', implemented: true,
  },
  ...VOLUME.map(([k, name, description]) => ({
    id: `volume.${k}`, name, shortName: name, description, worldId: 'w1', prerequisites: [{ skillId: 'mult', mastery: 30 }],
    generator: 'volume' as const, generatorParams: { kind: k }, targetTimeMs: T(12), tree: { x: 1, y: 0 }, parent: 'volume',
    whyItMatters: 'Reading a scale and multiplying dimensions are the two ways engineers measure how much fits.', implemented: true,
  })),
];

const MEASURE: [string, string, string][] = [
  ['compare', 'Longer or Shorter?', 'Compare and count equal units laid end to end, starting at zero.'],
  ['ruler', 'Read the Ruler', 'Numbered marks are cm, small marks are mm. Start at zero, or subtract the start.'],
  ['inches', 'Fractions of an Inch', 'Halves, quarters, eighths, sixteenths: count the marks past the inch number.'],
  ['dial', 'Read the Dial', 'Scales and gauges: work out one mark, count from the label below the needle.'],
  ['temp', 'Thermometer', 'Read the temperature; a change in temperature is a difference.'],
  ['time', 'Elapsed Time', 'Two clocks: count up to the next hour, then on to the end.'],
  ['estimate', 'Estimate It', 'A door is about 2 m. Judge a length against something you know.'],
  ['convert', 'Change the Unit', '1 ft = 12 in, 1 ft² = 144 in², 1 ft³ = 1728 in³. The thing does not change.'],
  ['shape', 'Around or Inside?', 'Perimeter is metres of fence; area is squares of tile.'],
];
const measureSkills: Skill[] = [
  {
    id: 'measure', name: 'Measurement', shortName: 'Measuring',
    description: 'What are we measuring, in which unit, with which tool, and what does each mark mean? Estimate, read, convert, check.',
    worldId: 'w1', prerequisites: [{ skillId: 'add.basic', mastery: 30 }], generator: 'measure', generatorParams: { kind: 'all' }, targetTimeMs: T(12), tree: { x: 0, y: 5 },
    whyItMatters: 'Every part that fits, every tank that fills and every pipe that reaches was measured first.', implemented: true,
  },
  ...MEASURE.map(([k, name, description]) => ({
    id: `measure.${k}`, name, shortName: name, description, worldId: 'w1', prerequisites: [{ skillId: 'add.basic', mastery: 30 }],
    generator: 'measure' as const, generatorParams: { kind: k }, targetTimeMs: T(12), tree: { x: 0, y: 0 }, parent: 'measure',
    whyItMatters: 'Reading a scale correctly is the difference between a part that fits and one that does not.', implemented: true,
  })),
];

/** Umbrella + one child skill per kind for the picture games that are not defined by hand above. */
const pictureSkills: Skill[] = ['geo', 'rates', 'fit', 'phys', 'pipe', 'prob', 'spiral', 'precalc', 'pattern', 'blocks', 'paths', 'data', 'logic', 'pctmulti', 'grid'].flatMap((id) => {
  const g = PICTURE_GAMES[id];
  const kinds = g.kinds.filter((k) => k.id !== 'all');
  return [
    {
      id: g.skill, name: g.label, shortName: g.label, description: g.kinds[0].desc ?? g.blurb, worldId: 'w1', prerequisites: [g.prereq],
      generator: g.id as Skill['generator'], generatorParams: { kind: 'all' }, targetTimeMs: T(15), tree: g.tree, whyItMatters: g.blurb, implemented: true,
    },
    ...kinds.map((k) => ({
      id: `${g.skill}.${k.id}`, name: k.label, shortName: k.short, description: k.desc ?? k.label, worldId: 'w1', prerequisites: [g.prereq],
      generator: g.id as Skill['generator'], generatorParams: { kind: k.id }, targetTimeMs: T(15), tree: { x: 0, y: 0 }, parent: g.skill, whyItMatters: g.blurb, implemented: true,
    })),
  ];
});

/** The Mental Math Academy, registered as real skills so mastery, spaced review and the notebook apply. */
const mentalAcademySkills: Skill[] = [
  {
    id: 'mm', name: 'Mental Math Academy', shortName: 'Mental math',
    description: 'Ten worlds of mental strategies: decompose, round, compensate, double, halve and distribute, from 47 + 36 to 125 × 24.',
    worldId: 'w1', prerequisites: [{ skillId: 'add.basic', mastery: 30 }], generator: 'mentalmath', generatorParams: { skill: 'mm.mixed' },
    targetTimeMs: T(8), tree: { x: 2, y: 10 }, whyItMatters: 'Numbers you can hold and move in your head become numbers you can reason with anywhere.', implemented: true,
  },
  ...MM_SKILLS.map((s) => ({
    id: s.id, name: s.name, shortName: s.short, description: s.teaches, worldId: 'w1',
    prerequisites: s.prereq.length ? s.prereq.map((q) => ({ skillId: q, mastery: 50 })) : [{ skillId: 'add.basic', mastery: 20 }],
    generator: 'mentalmath' as const, generatorParams: { skill: s.id }, targetTimeMs: s.targetMs,
    tree: { x: 0, y: 0 }, parent: 'mm', whyItMatters: s.teaches, implemented: true,
  })),
];

const probSkills: Skill[] = [
  {
    id: 'prob.outs', name: 'Chances: Counting Outs', shortName: 'Outs',
    description: 'How many cards help you, out of how many could come? Turn that fraction into a percent.',
    worldId: 'w1', prerequisites: [{ skillId: 'div', mastery: 40 }], generator: 'odds', targetTimeMs: T(12), tree: { x: 3, y: 7 },
    whyItMatters: 'Reliability engineering is exactly this: the cases that fail, divided by all the cases.', implemented: true,
  },
];

const core: Skill[] = [
  {
    id: 'num.sense', name: 'Number Sense & Place Value', shortName: 'Numbers',
    description: 'Reading numbers, place value, comparing and rounding.',
    worldId: 'w1', prerequisites: [], generator: 'academy', targetTimeMs: T(6), tree: { x: 2, y: 0 },
    whyItMatters: 'Every measurement an engineer reads is a number with a place value and a precision.', implemented: true,
  },
  {
    id: 'add.basic', name: 'Addition', shortName: 'Add',
    description: 'Adding whole numbers, including mental strategies and carrying.',
    worldId: 'w1', prerequisites: [], generator: 'add.basic', targetTimeMs: T(5), tree: { x: 1, y: 1 },
    whyItMatters: 'Totals, sums of forces, combined flows: addition is the first operation of engineering.', implemented: true,
  },
  {
    id: 'sub.basic', name: 'Subtraction', shortName: 'Subtract',
    description: 'Subtracting whole numbers; differences and remaining quantities.',
    worldId: 'w1', prerequisites: [{ skillId: 'add.basic', mastery: 60 }], generator: 'sub.basic', targetTimeMs: T(5), tree: { x: 3, y: 1 },
    whyItMatters: 'Differences measure change — temperature drops, pressure losses, remaining stock.', implemented: true,
  },
  {
    id: 'mult', name: 'Multiplication', shortName: 'Multiply',
    description: 'Multiplication as equal groups and arrays; facts 1–12; missing factors; word problems; multi-step problems.',
    worldId: 'w1', prerequisites: [{ skillId: 'add.basic', mastery: 60 }],
    generator: 'mult.mixed', targetTimeMs: T(4), tree: { x: 2, y: 2 },
    whyItMatters: 'Scaling, area, repeated processes, unit conversion and every formula in physics rely on multiplication fluency.', implemented: true,
  },
  {
    id: 'mult.missing', name: 'Missing Factors', shortName: '? × n',
    description: 'Solve ? × 7 = 56. The bridge between multiplication and division — and your first algebra.',
    worldId: 'w1', prerequisites: [{ skillId: 'mult', mastery: 60 }], generator: 'mult.missing', targetTimeMs: T(6), tree: { x: 1, y: 3 }, parent: 'mult',
    whyItMatters: 'Finding an unknown factor is exactly what solving an equation means.', implemented: true,
  },
  {
    id: 'mult.applied', name: 'Applied Multiplication', shortName: 'Applied ×',
    description: 'Multiplication inside engineering situations: bolts per assembly, parts per crate, watts per panel.',
    worldId: 'w1', prerequisites: [{ skillId: 'mult', mastery: 50 }], generator: 'mult.applied', targetTimeMs: T(15), tree: { x: 3, y: 3 }, parent: 'mult',
    whyItMatters: 'Real problems never say "7 × 8". They say "seven assemblies, eight bolts each".', implemented: true,
  },
  {
    id: 'mult.multistep', name: 'Multi-step Problems', shortName: 'Multi-step',
    description: 'Problems that need two operations, e.g. total bolts minus bolts already in stock.',
    worldId: 'w1', prerequisites: [{ skillId: 'mult.applied', mastery: 70 }, { skillId: 'sub.basic', mastery: 60 }], generator: 'mult.multistep', targetTimeMs: T(25), tree: { x: 2, y: 4 }, parent: 'mult',
    whyItMatters: 'Engineering calculations chain several steps; you must hold intermediate results.', implemented: true,
  },
  {
    id: 'div', name: 'Division', shortName: 'Divide',
    description: 'Division as sharing and grouping; division facts; remainders; the inverse of multiplication.',
    worldId: 'w1', prerequisites: [{ skillId: 'mult', mastery: 80 }], generator: 'div.mixed', targetTimeMs: T(5), tree: { x: 2, y: 5 },
    whyItMatters: 'Rates (per second, per metre), averages, unit prices and fractions are all division.', implemented: true,
  },
  {
    id: 'div.applied', name: 'Applied Division', shortName: 'Applied ÷',
    description: 'Splitting loads across supports, sharing power across circuits, working out how many crates are needed.',
    worldId: 'w1', prerequisites: [{ skillId: 'div', mastery: 60 }], generator: 'div.applied', targetTimeMs: T(15), tree: { x: 3, y: 6 }, parent: 'div',
    whyItMatters: 'Distributing a quantity evenly is a daily engineering task.', implemented: true,
  },
  {
    id: 'neg.numbers', name: 'Negative Numbers & Absolute Value', shortName: 'Negatives',
    description: 'Integers below zero on the number line; adding, subtracting, multiplying signed numbers; absolute value.',
    worldId: 'w1', prerequisites: [{ skillId: 'sub.basic', mastery: 70 }, { skillId: 'mult', mastery: 70 }], generator: 'none', targetTimeMs: T(6), tree: { x: 1, y: 6 },
    whyItMatters: 'Temperatures below zero, charge, direction, debt — sign carries meaning in every physical quantity.', implemented: false,
  },
  {
    id: 'order.ops', name: 'Order of Operations', shortName: 'Order of Ops',
    description: 'Parentheses, exponents, multiplication/division, addition/subtraction — the grammar of expressions.',
    worldId: 'w1', prerequisites: [{ skillId: 'mult', mastery: 75 }, { skillId: 'div', mastery: 60 }], generator: 'none', targetTimeMs: T(10), tree: { x: 2, y: 7 },
    whyItMatters: 'Every formula is read with these rules. Get them wrong and F = ma becomes nonsense.', implemented: false,
  },
];

/** Future worlds — high-level skills so the tree, map and readiness meters work today. */
const futureSpec: [string, string, string, string, SkillId[]][] = [
  ['frac', 'Fractions', 'w2', 'Equivalent, simplifying, adding, subtracting, multiplying and dividing fractions.', ['div', 'mult']],
  ['decimals', 'Decimals', 'w2', 'Decimal place value and operations.', ['frac']],
  ['percent', 'Percentages', 'w2', 'Percent as a fraction of 100; percent change.', ['decimals']],
  ['ratio', 'Ratios, Proportions & Rates', 'w2', 'Comparing quantities; unit rates; mixture ratios.', ['frac']],
  ['exponents', 'Powers, Exponents & Roots', 'w2', 'Repeated multiplication, square roots.', ['mult']],
  ['sci.notation', 'Scientific Notation & Sig Figs', 'w2', 'Very large and small numbers; precision.', ['exponents', 'decimals']],
  ['units', 'SI Units & Dimensional Analysis', 'w2', 'Unit conversions using conversion factors — used constantly in engineering.', ['ratio', 'sci.notation']],

  ['prealg.coordinates', 'Coordinate Plane & Patterns', 'w3', 'Plotting points, sequences.', ['neg.numbers']],
  ['alg1.linear', 'Linear Equations & Slope', 'w4', 'Slope, intercepts, graphing lines.', ['prealg.equations', 'prealg.coordinates']],
  ['alg1.systems', 'Systems of Equations', 'w4', 'Solving two equations at once — circuits!', ['alg1.linear']],
  ['alg1.functions', 'Functions', 'w4', 'Function notation, domain and range.', ['alg1.linear']],
  ['alg1.quadratics', 'Polynomials & Quadratics', 'w4', 'Factoring and solving quadratics; radicals.', ['alg1.functions', 'exponents']],
  ['geo.shapes', 'Points, Lines, Angles & Polygons', 'w5', 'The vocabulary of shape.', ['prealg.coordinates']],
  ['geo.area', 'Perimeter & Area', 'w5', 'Including circles: why A = πr².', ['geo.shapes', 'frac']],
  ['geo.volume', 'Surface Area & Volume', 'w5', 'Tanks, pipes, storage.', ['geo.area']],
  ['geo.pythagoras', 'Pythagorean Theorem & Similarity', 'w5', 'Right triangles, congruence, transformations.', ['geo.area', 'exponents']],
  ['alg2.functions', 'Polynomial & Rational Functions', 'w6', 'Behaviour of advanced functions.', ['alg1.quadratics']],
  ['alg2.exp.log', 'Exponential & Logarithmic Functions', 'w6', 'Growth, decay, pH, decibels.', ['alg2.functions']],
  ['alg2.complex', 'Complex Numbers', 'w6', 'i, the complex plane.', ['alg1.quadratics']],
  ['alg2.matrices', 'Sequences, Series & Matrices Intro', 'w6', 'Patterns and arrays of numbers.', ['alg2.functions']],
  ['trig.ratios', 'Sine, Cosine, Tangent', 'w7', 'Ratios in right triangles.', ['geo.pythagoras']],
  ['trig.unit.circle', 'Unit Circle & Identities', 'w7', 'Radians, inverse trig, identities.', ['trig.ratios']],
  ['trig.vectors', 'Vectors & Components', 'w7', 'Forces, navigation, robotics.', ['trig.ratios']],
  ['precalc.functions', 'Function Transformations & Models', 'w8', 'Exponential, log and trig models.', ['alg2.exp.log', 'trig.unit.circle']],
  ['precalc.parametric', 'Parametric Equations & Vectors', 'w8', 'Motion described by parameters.', ['trig.vectors']],
  ['precalc.limits', 'Introduction to Limits', 'w8', 'What happens as we approach.', ['precalc.functions']],
  ['calc1.limits', 'Limits & Continuity', 'w9', 'Formal limits.', ['precalc.limits']],
  ['calc1.derivatives', 'Derivatives & Rules', 'w9', 'Slopes of curves; chain rule; implicit.', ['calc1.limits']],
  ['calc1.applications', 'Related Rates & Optimisation', 'w9', 'Applied derivatives.', ['calc1.derivatives']],
  ['calc1.integration', 'Basic Integration', 'w9', 'Accumulated area.', ['calc1.derivatives']],
  ['calc2.integration', 'Integration Techniques & Applications', 'w10', 'Volumes, work.', ['calc1.integration']],
  ['calc2.series', 'Infinite Series & Taylor Series', 'w10', 'Approximating functions.', ['calc2.integration']],
  ['calc2.polar', 'Parametric & Polar', 'w10', 'Curves in other coordinates.', ['calc2.integration', 'precalc.parametric']],
  ['calc3.vectors', '3-D Coordinates & Vector Functions', 'w11', 'Space curves.', ['calc2.polar']],
  ['calc3.partials', 'Partial Derivatives & Gradients', 'w11', 'Surfaces and directional change.', ['calc3.vectors']],
  ['calc3.multiple', 'Multiple Integrals', 'w11', 'Mass and volume over regions.', ['calc3.partials']],
  ['calc3.fields', 'Vector Fields, Line & Surface Integrals', 'w11', 'Flux and circulation.', ['calc3.multiple']],
  ['linalg.matrices', 'Matrices & Determinants', 'w12', 'Solving systems at scale.', ['alg2.matrices', 'alg1.systems']],
  ['linalg.transforms', 'Vector Spaces & Linear Transformations', 'w12', 'Rotations, projections.', ['linalg.matrices']],
  ['linalg.eigen', 'Eigenvalues & Eigenvectors', 'w12', 'Modes, stability, control.', ['linalg.transforms']],
  ['ode.first', 'First-Order ODEs', 'w13', 'Growth, decay, tanks, RC circuits.', ['calc2.integration']],
  ['ode.second', 'Second-Order ODEs', 'w13', 'Oscillation: springs and RLC circuits.', ['ode.first', 'alg2.complex']],
  ['ode.systems', 'Coupled Systems & Modelling', 'w13', 'Reaction networks, multi-tank systems.', ['ode.second', 'linalg.eigen']],
  ['stats.probability', 'Probability & Random Variables', 'w14', 'Chance and expectation.', ['frac', 'percent']],
  ['stats.distributions', 'Distributions', 'w14', 'Normal distribution, variance.', ['stats.probability', 'calc1.integration']],
  ['stats.inference', 'Inference & Regression', 'w14', 'Confidence intervals, hypothesis tests, reliability.', ['stats.distributions']],
  ['num.roots', 'Root Finding', 'w15', 'Bisection, Newton\'s method.', ['calc1.derivatives']],
  ['num.integration', 'Numerical Integration & Differentiation', 'w15', 'Trapezoid, Simpson.', ['calc2.integration']],
  ['num.ode', 'Numerical ODEs & Error Analysis', 'w15', 'Euler, Runge–Kutta; computational modelling.', ['ode.first', 'num.integration']],
  ['adv.vector.calc', 'Vector Calculus', 'w16', 'Divergence, curl, Stokes.', ['calc3.fields']],
  ['adv.pde', 'Partial Differential Equations', 'w16', 'Heat, wave, diffusion.', ['ode.systems', 'calc3.partials']],
  ['adv.fourier', 'Fourier Analysis', 'w16', 'Signals as sums of waves.', ['calc2.series', 'trig.unit.circle']],
  ['adv.laplace', 'Laplace Transforms', 'w16', 'Circuits and control in the s-domain.', ['ode.second']],
  ['adv.tensors', 'Tensors & Mathematical Physics', 'w16', 'Stress, strain, fields.', ['linalg.eigen', 'adv.vector.calc']],
];

/** Umbrella skills the Arithmetic Academy teaches with its own model-based generator. */
const ACADEMY_SKILLS = new Set(['frac', 'ratio', 'percent', 'exponents']);
const futureSkills: Skill[] = futureSpec.map(([id, name, worldId, description, prereqs]) => ({
  id, name, description, worldId,
  prerequisites: prereqs.map((p) => ({ skillId: p, mastery: 85 })),
  generator: ACADEMY_SKILLS.has(id) ? 'academy' : 'none', targetTimeMs: ACADEMY_SKILLS.has(id) ? T(10) : T(20), tree: { x: 0, y: 0 },
  whyItMatters: 'Required on the road to chemical engineering, electrical engineering and physics.',
  implemented: ACADEMY_SKILLS.has(id),
}));

export const SKILLS: Skill[] = [...core, ...bondSkills, ...tableSkills, ...divTableSkills, ...prealg, ...wordSkills, ...trickSkills, ...mentalSkills, ...volumeSkills, ...measureSkills, ...pictureSkills, ...mentalAcademySkills, ...probSkills, ...futureSkills];

const index = new Map(SKILLS.map((s) => [s.id, s]));
const ACADEMY_NAMES: Record<string, string> = { arithmetic: 'Arithmetic', prealgebra: 'Pre-Algebra', algebra1: 'Algebra 1', geometry: 'Geometry', algebra2: 'Algebra 2', trig: 'Trigonometry', precalc: 'Pre-Calculus', calculus: 'Calculus', linalg: 'Linear Algebra', diffeq: 'Differential Equations' };
const academySkills = new Map<string, Skill>();
/** Academy chapter skills (acad.<academy>.<chapter>) are made on first use; the academy generator asks them. */
function academySkill(id: string): Skill | undefined {
  const m = /^acad\.([a-z0-9]+)\.([a-z0-9-]+)$/.exec(id); if (!m) return undefined;
  let s = academySkills.get(id);
  if (!s) {
    const chapter = m[2].replace(/-/g, ' ');
    s = { id, name: `${ACADEMY_NAMES[m[1]] ?? m[1]}: ${chapter}`, shortName: chapter, description: `Academy chapter practice (${ACADEMY_NAMES[m[1]] ?? m[1]}).`, worldId: 'academy', prerequisites: [], generator: 'academy', generatorParams: { skill: id }, targetTimeMs: T(20), tree: { x: 0, y: 0 }, whyItMatters: 'Part of the Academy ladder toward engineering mathematics.', implemented: true };
    academySkills.set(id, s);
  }
  return s;
}
/** Arcade question types for fractions and ratios (frac.of, ratio.table …) borrow their umbrella skill. */
function kindSkill(id: string): Skill | undefined {
  const m = /^(frac|ratio)\.[a-z]+$/.exec(id); if (!m) return undefined;
  const base = index.get(m[1]); return base ? { ...base, id } : undefined;
}
export const skillById = (id: SkillId): Skill | undefined => index.get(id) ?? academySkill(id) ?? kindSkill(id);
export const skillsInWorld = (worldId: string) => SKILLS.filter((s) => s.worldId === worldId);
export const childSkills = (parentId: SkillId) => SKILLS.filter((s) => s.parent === parentId);

/** Skill ids whose mastery feeds an umbrella skill. */
export function componentSkills(id: SkillId): SkillId[] {
  if (id === 'mult') return [...TABLE_ORDER.map((n) => `mult.${n}`), 'mult.missing', 'mult.applied'];
  if (id === 'div') return [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => `div.${n}`);
  if (id === 'word') return ['word.add', 'word.sub', 'word.mult', 'word.div', 'word.twostep'];
  if (id === 'tricks') return ['trick.11', 'trick.sq5', 'trick.same10'];
  if (id === 'mm') return MM_SKILLS.map((s) => s.id);
  const pg = PICTURE_GAMES[id];
  if (pg && !['volume', 'measure'].includes(id)) return pg.kinds.filter((k) => k.id !== 'all').map((k) => `${pg.skill}.${k.id}`);
  if (id === 'measure') return ['measure.compare', 'measure.ruler', 'measure.inches', 'measure.dial', 'measure.temp', 'measure.time', 'measure.estimate', 'measure.convert', 'measure.shape'];
  if (id === 'volume') return ['volume.cubes', 'volume.prism', 'volume.liquid', 'volume.displace', 'volume.missing', 'volume.composite', 'volume.subtract', 'volume.stairs'];
  if (id === 'mental') return ['mental.tens', 'mental.next10', 'mental.split', 'mental.round', 'mental.make10', 'mental.distance'];
  return [];
}
