import type { Op, StrategyId } from './strategies';

/**
 * The Mental Math Academy curriculum: ten worlds, each a short ladder of skills.
 *
 * A skill names the mental move being trained, the shape of the numbers that make that move worth
 * using, and a target time for fluency. Worlds unlock in order; a world opens when its predecessor's
 * skills are at least Competent, so nobody is stuck behind a single stubborn skill.
 */
export type MMTag =
  | 'place-value' | 'expanded' | 'make-ten' | 'make-hundred' | 'complement' | 'double' | 'near-double' | 'halve' | 'times-ten' | 'unit-relations'
  | 'add2-chunks' | 'add2-left' | 'add2-make10' | 'add2-compensate' | 'add2-double' | 'add2-friendly' | 'add2-mixed'
  | 'add3-chunks' | 'add3-compensate' | 'add3-friendly' | 'add3-mixed'
  | 'sub2-chunks' | 'sub2-compensate' | 'sub2-countup' | 'sub2-constant' | 'sub2-mixed'
  | 'sub3-chunks' | 'sub3-compensate' | 'sub3-countup' | 'sub3-mixed'
  | 'mul-facts' | 'mul-distributive' | 'mul-by5' | 'mul-by25' | 'mul-doubling'
  | 'mul21' | 'mul2x1' | 'mul2x2' | 'mul-compensate' | 'mul-doublehalf' | 'mul-eleven' | 'mul-squares'
  | 'mul3x1' | 'mul3x2'
  | 'mixed-all' | 'strategy-choice';

export interface MMSkill {
  id: string;
  world: number;
  name: string;
  short: string;
  /** What the learner is being taught to do, in one sentence. */
  teaches: string;
  tag: MMTag;
  op: Op | 'none';
  /** The strategy a demonstration should show for this skill. */
  strategy?: StrategyId;
  /** Fluent response time in ms once mastered. Drives mastery and the speed ladder. */
  targetMs: number;
  /** Speed-ladder targets in seconds, easiest first, ending at the skill's goal. */
  speedLadder: number[];
  prereq: string[];
}

export interface MMWorld {
  n: number;
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  blurb: string;
  /** The boss that guards the end of the world. */
  boss: { name: string; taunt: string; phases: { name: string; tags: MMTag[]; questions: number }[] };
}

const L = (...v: number[]) => v;

export const MM_WORLDS: MMWorld[] = [
  {
    n: 1, id: 'w1', name: 'Number Building', subtitle: 'See numbers as parts', icon: 'abacus',
    blurb: 'Before any hard arithmetic: split numbers apart, make tens and hundreds, double, halve, and learn the relationships that make later multiplication easy.',
    boss: { name: 'The Gatekeeper of Parts', taunt: 'Show me a number and I will show you its pieces. Can you?', phases: [
      { name: 'Split it', tags: ['place-value', 'expanded'], questions: 5 },
      { name: 'Make it whole', tags: ['make-ten', 'make-hundred', 'complement'], questions: 5 },
      { name: 'Double and halve', tags: ['double', 'halve', 'unit-relations'], questions: 6 },
    ] },
  },
  {
    n: 2, id: 'w2', name: '2-Digit Addition', subtitle: 'Five ways to add', icon: 'plus',
    blurb: 'Chunking, left to right, making a ten, rounding and compensating, doubles and friendly pairs. Learn each, then learn when to use which.',
    boss: { name: 'The Addition Titan', taunt: 'Two digits. No paper. Let us see what you have learned.', phases: [
      { name: 'Chunks', tags: ['add2-chunks', 'add2-left'], questions: 5 },
      { name: 'Friendly moves', tags: ['add2-make10', 'add2-compensate'], questions: 5 },
      { name: 'Anything goes', tags: ['add2-mixed', 'add2-double', 'add2-friendly'], questions: 6 },
    ] },
  },
  {
    n: 3, id: 'w3', name: '3-Digit Addition', subtitle: 'Hundreds, tens, ones', icon: 'bridge',
    blurb: 'The same moves, one place bigger. 347 + 286 becomes 547, 627, 633 — three easy hops instead of one hard sum.',
    boss: { name: 'The Hundreds Colossus', taunt: 'Three digits will break your memory. Prove me wrong.', phases: [
      { name: 'Hop by place', tags: ['add3-chunks'], questions: 5 },
      { name: 'Round and fix', tags: ['add3-compensate', 'add3-friendly'], questions: 5 },
      { name: 'Free choice', tags: ['add3-mixed'], questions: 6 },
    ] },
  },
  {
    n: 4, id: 'w4', name: '2-Digit Subtraction', subtitle: 'More than borrowing', icon: 'rock',
    blurb: 'Count down in chunks, round and adjust, count up across the gap, or slide both numbers. Borrowing is the slowest of the four.',
    boss: { name: 'The Borrower', taunt: 'You will need to borrow. Or will you?', phases: [
      { name: 'Down in chunks', tags: ['sub2-chunks'], questions: 5 },
      { name: 'Round and adjust', tags: ['sub2-compensate', 'sub2-constant'], questions: 5 },
      { name: 'Mind the gap', tags: ['sub2-countup', 'sub2-mixed'], questions: 6 },
    ] },
  },
  {
    n: 5, id: 'w5', name: '3-Digit Subtraction', subtitle: 'Distance and compensation', icon: 'mine',
    blurb: '623 − 287 in your head: take 300 and give back 13. Or count up from 287. Both beat three borrows.',
    boss: { name: 'The Void Warden', taunt: 'Six hundred and twenty-three, minus two hundred and eighty-seven. Go.', phases: [
      { name: 'Chunks', tags: ['sub3-chunks'], questions: 5 },
      { name: 'Compensate', tags: ['sub3-compensate'], questions: 5 },
      { name: 'Count up', tags: ['sub3-countup', 'sub3-mixed'], questions: 6 },
    ] },
  },
  {
    n: 6, id: 'w6', name: 'Multiplication Foundations', subtitle: 'Why breaking apart works', icon: 'multiply',
    blurb: 'Facts, the distributive property seen as area, ×5 as half of ×10, ×25 as a quarter of ×100, and doubling as a tool.',
    boss: { name: 'The Distributor', taunt: 'Seventeen sixes. Do not reach for a pencil.', phases: [
      { name: 'Facts', tags: ['mul-facts'], questions: 6 },
      { name: 'Break it apart', tags: ['mul-distributive', 'mul2x1'], questions: 5 },
      { name: 'Friendly factors', tags: ['mul-by5', 'mul-by25', 'mul-doubling'], questions: 5 },
    ] },
  },
  {
    n: 7, id: 'w7', name: '2-Digit Multiplication', subtitle: 'Split, round, double, halve', icon: 'gear',
    blurb: '23 × 17 as 230 + 161. 19 × 24 as 480 − 24. 16 × 25 as 8 × 50 as 4 × 100. Several routes, one answer.',
    boss: { name: 'The Product Forge', taunt: 'Two digits by two digits. In your head. Now.', phases: [
      { name: 'Split both', tags: ['mul2x2'], questions: 5 },
      { name: 'Round and take back', tags: ['mul-compensate'], questions: 5 },
      { name: 'Clever routes', tags: ['mul-doublehalf', 'mul-eleven', 'mul-squares'], questions: 6 },
    ] },
  },
  {
    n: 8, id: 'w8', name: '3-Digit Multiplication', subtitle: 'Chunking the big ones', icon: 'factory',
    blurb: '326 × 4 = 1200 + 80 + 24. 125 × 24 = 2500 + 500. Not every big product belongs in your head — the sensible ones do.',
    boss: { name: 'The Thousand Engine', taunt: 'Three digits. Chunk them or drown.', phases: [
      { name: 'Three by one', tags: ['mul3x1'], questions: 6 },
      { name: 'Friendly three by two', tags: ['mul3x2'], questions: 5 },
      { name: 'Mixed forge', tags: ['mul3x1', 'mul3x2', 'mul2x2'], questions: 5 },
    ] },
  },
  {
    n: 9, id: 'w9', name: 'Strategy Mastery', subtitle: 'Which way would you solve it?', icon: 'brain',
    blurb: 'Every operation, every strategy, and the judgement of picking the easiest route before you start calculating.',
    boss: { name: 'The Chooser', taunt: 'I do not care that you can calculate. I care that you choose well.', phases: [
      { name: 'Pick the route', tags: ['strategy-choice'], questions: 6 },
      { name: 'Everything', tags: ['mixed-all'], questions: 6 },
      { name: 'Everything, faster', tags: ['mixed-all'], questions: 6 },
    ] },
  },
  {
    n: 10, id: 'w10', name: 'Mental Math Arena', subtitle: 'Automatic', icon: 'trophy',
    blurb: 'Blitz, duels, daily workouts and personal records. The arithmetic is no longer the challenge; the clock is.',
    boss: { name: 'Your Own Record', taunt: 'The only opponent left is the one you were yesterday.', phases: [
      { name: 'Addition sprint', tags: ['add2-mixed', 'add3-mixed'], questions: 6 },
      { name: 'Subtraction sprint', tags: ['sub2-mixed', 'sub3-mixed'], questions: 6 },
      { name: 'Multiplication sprint', tags: ['mul2x2', 'mul3x1'], questions: 6 },
    ] },
  },
];

const S = (id: string, world: number, name: string, short: string, teaches: string, tag: MMTag, op: Op | 'none', targetMs: number, speedLadder: number[], prereq: string[], strategy?: StrategyId): MMSkill =>
  ({ id, world, name, short, teaches, tag, op, targetMs, speedLadder, prereq, strategy });

export const MM_SKILLS: MMSkill[] = [
  // --- World 1: number building ---
  S('mm.place', 1, 'Place Value', 'Place value', 'Read what each digit is worth: the 4 in 347 is 40.', 'place-value', 'none', 4000, L(15, 10, 6, 4), []),
  S('mm.expand', 1, 'Expanded Form', 'Expanded', 'Split any number into hundreds, tens and ones: 347 = 300 + 40 + 7.', 'expanded', 'none', 4000, L(15, 10, 6, 4), ['mm.place']),
  S('mm.make10', 1, 'Make a Ten', 'Make 10', 'Know instantly what any digit needs to reach 10.', 'make-ten', 'add', 2500, L(10, 6, 4, 3), []),
  S('mm.make100', 1, 'Make a Hundred', 'Make 100', 'Know what any round ten needs to reach 100.', 'make-hundred', 'add', 3000, L(10, 6, 4, 3), ['mm.make10']),
  S('mm.complement', 1, 'Complements to 100', 'Complements', '100 − 37 without borrowing: 63, because 37 + 63 = 100.', 'complement', 'sub', 4000, L(15, 10, 6, 4), ['mm.make100']),
  S('mm.double', 1, 'Doubles', 'Doubles', 'Double anything up to 500 without thinking.', 'double', 'add', 3000, L(10, 6, 5, 4), []),
  S('mm.halve', 1, 'Halving', 'Halving', 'Halve round numbers and even two-digit numbers instantly.', 'halve', 'none', 3500, L(10, 6, 5, 4), ['mm.double']),
  S('mm.times10', 1, 'Times 10, 100, 1000', '×10', 'Multiplying by ten shifts every digit one place left.', 'times-ten', 'mul', 2500, L(10, 6, 4, 3), []),
  S('mm.units', 1, 'Number Relationships', 'Relations', '×5 is half of ×10; ×50 is half of ×100; ×25 is a quarter of ×100.', 'unit-relations', 'mul', 5000, L(15, 10, 8, 6), ['mm.halve', 'mm.times10']),
  // --- World 2: two-digit addition ---
  S('mm.add2.chunks', 2, 'Add in Chunks', 'Chunks', 'Add the tens, then the ones: 47 + 36 → 77 → 83.', 'add2-chunks', 'add', 5000, L(15, 10, 7, 5), ['mm.expand'], 'place-chunks'),
  S('mm.add2.left', 2, 'Left to Right', 'Left→right', 'Add the tens together and the ones together, then combine.', 'add2-left', 'add', 5000, L(15, 10, 7, 5), ['mm.add2.chunks'], 'left-to-right'),
  S('mm.add2.make10', 2, 'Make a Ten to Add', 'Make 10', 'Slide up to the round number first: 48 + 27 → 50 + 25.', 'add2-make10', 'add', 5000, L(15, 10, 7, 5), ['mm.make10', 'mm.add2.chunks'], 'make-ten'),
  S('mm.add2.comp', 2, 'Round and Compensate', 'Compensate', '58 + 39 → 58 + 40 − 1. Round up, then give one back.', 'add2-compensate', 'add', 5000, L(15, 10, 7, 5), ['mm.add2.chunks'], 'compensate'),
  S('mm.add2.double', 2, 'Near Doubles', 'Near doubles', '48 + 49 → 48 + 48 + 1.', 'add2-double', 'add', 4500, L(12, 8, 6, 4), ['mm.double'], 'near-double'),
  S('mm.add2.friendly', 2, 'Friendly Pairs', 'Friendly', 'Reorder to pair numbers that make 100: 25 + 38 + 75.', 'add2-friendly', 'add', 6000, L(20, 12, 9, 7), ['mm.make100']),
  S('mm.add2.mixed', 2, 'Two-Digit Addition', 'Add 2-digit', 'Any two-digit sum, your choice of route.', 'add2-mixed', 'add', 4500, L(15, 10, 7, 5, 4), ['mm.add2.make10', 'mm.add2.comp']),
  // --- World 3: three-digit addition ---
  S('mm.add3.chunks', 3, 'Three-Digit Chunks', 'Chunks', '347 + 286 → 547 → 627 → 633.', 'add3-chunks', 'add', 8000, L(20, 15, 10, 8), ['mm.add2.mixed'], 'place-chunks'),
  S('mm.add3.comp', 3, 'Round the Hundreds', 'Compensate', '398 + 247 → 400 + 247 − 2.', 'add3-compensate', 'add', 8000, L(20, 15, 10, 8), ['mm.add3.chunks'], 'compensate'),
  S('mm.add3.friendly', 3, 'Friendly Hundreds', 'Friendly', '125 + 275 + 48: pair the hundreds first.', 'add3-friendly', 'add', 9000, L(25, 18, 12, 10), ['mm.add3.chunks']),
  S('mm.add3.mixed', 3, 'Three-Digit Addition', 'Add 3-digit', 'Any three-digit sum, your choice of route.', 'add3-mixed', 'add', 7000, L(20, 15, 10, 8, 6), ['mm.add3.comp']),
  // --- World 4: two-digit subtraction ---
  S('mm.sub2.chunks', 4, 'Count Down in Chunks', 'Chunks', '74 − 32 → 44 → 42.', 'sub2-chunks', 'sub', 5000, L(15, 10, 7, 5), ['mm.add2.chunks'], 'count-down'),
  S('mm.sub2.comp', 4, 'Round and Adjust', 'Compensate', '74 − 29 → 74 − 30 + 1.', 'sub2-compensate', 'sub', 5000, L(15, 10, 7, 5), ['mm.sub2.chunks'], 'sub-compensate'),
  S('mm.sub2.countup', 4, 'Count Up', 'Count up', '72 − 68: how far from 68 to 72? Four.', 'sub2-countup', 'sub', 5000, L(15, 10, 7, 5), ['mm.sub2.chunks'], 'count-up'),
  S('mm.sub2.constant', 4, 'Constant Difference', 'Same gap', '83 − 48 → 85 − 50. Move both, keep the gap.', 'sub2-constant', 'sub', 5500, L(15, 10, 8, 6), ['mm.sub2.comp'], 'constant-difference'),
  S('mm.sub2.mixed', 4, 'Two-Digit Subtraction', 'Sub 2-digit', 'Any two-digit difference, your choice of route.', 'sub2-mixed', 'sub', 4500, L(15, 10, 7, 5, 4), ['mm.sub2.comp', 'mm.sub2.countup']),
  // --- World 5: three-digit subtraction ---
  S('mm.sub3.chunks', 5, 'Three-Digit Count Down', 'Chunks', '532 − 211 → 332 → 322 → 321.', 'sub3-chunks', 'sub', 9000, L(25, 18, 12, 9), ['mm.sub2.mixed'], 'count-down'),
  S('mm.sub3.comp', 5, 'Compensate in Hundreds', 'Compensate', '623 − 287 → 623 − 300 + 13.', 'sub3-compensate', 'sub', 9000, L(25, 18, 12, 9), ['mm.sub3.chunks'], 'sub-compensate'),
  S('mm.sub3.countup', 5, 'Count Up the Gap', 'Count up', '503 − 487 → 13 + 3 = 16.', 'sub3-countup', 'sub', 9000, L(25, 18, 12, 9), ['mm.sub2.countup'], 'count-up'),
  S('mm.sub3.mixed', 5, 'Three-Digit Subtraction', 'Sub 3-digit', 'Any three-digit difference, your choice of route.', 'sub3-mixed', 'sub', 8000, L(25, 18, 12, 9, 7), ['mm.sub3.comp', 'mm.sub3.countup']),
  // --- World 6: multiplication foundations ---
  S('mm.mul.facts', 6, 'Multiplication Facts', 'Facts', 'The table facts, instantly, both ways round.', 'mul-facts', 'mul', 3000, L(10, 6, 4, 3), ['mm.times10']),
  S('mm.mul.dist', 6, 'Break Apart to Multiply', 'Distributive', '17 × 6 = (10 × 6) + (7 × 6) = 60 + 42.', 'mul-distributive', 'mul', 7000, L(20, 15, 10, 8), ['mm.mul.facts'], 'distribute'),
  S('mm.mul.by5', 6, 'Multiply by 5', '×5', '×5 is half of ×10: 38 × 5 = 380 ÷ 2 = 190.', 'mul-by5', 'mul', 6000, L(15, 10, 8, 6), ['mm.units'], 'factor-split'),
  S('mm.mul.by25', 6, 'Multiply by 25 and 50', '×25 ×50', '×25 is a quarter of ×100; ×50 is half of ×100.', 'mul-by25', 'mul', 7000, L(20, 15, 10, 8), ['mm.mul.by5'], 'factor-split'),
  S('mm.mul.doubling', 6, 'Doubling to Multiply', 'Doubling', '×4 is double-double; ×8 is double three times.', 'mul-doubling', 'mul', 6000, L(15, 10, 8, 6), ['mm.double']),
  S('mm.mul.2x1', 6, 'Two-Digit × One-Digit', '2×1', '23 × 7 as 140 + 21.', 'mul2x1', 'mul', 7000, L(20, 15, 10, 8, 6), ['mm.mul.dist'], 'distribute'),
  // --- World 7: two-digit multiplication ---
  S('mm.mul.2x2', 7, 'Two-Digit × Two-Digit', '2×2', '23 × 17 as 230 + 161.', 'mul2x2', 'mul', 14000, L(40, 30, 20, 15, 12), ['mm.mul.2x1'], 'distribute-tens'),
  S('mm.mul.comp', 7, 'Round and Take Back', 'Compensate', '19 × 24 → 20 × 24 − 24.', 'mul-compensate', 'mul', 12000, L(35, 25, 18, 12), ['mm.mul.2x1'], 'mul-compensate'),
  S('mm.mul.dh', 7, 'Double and Halve', 'Double/halve', '16 × 25 → 8 × 50 → 4 × 100.', 'mul-doublehalf', 'mul', 10000, L(30, 20, 15, 10), ['mm.mul.by25'], 'double-half'),
  S('mm.mul.11', 7, 'Multiply by 11', '×11', '32 × 11 = 352, and why the middle digit is the sum.', 'mul-eleven', 'mul', 6000, L(15, 10, 7, 5), ['mm.mul.dist'], 'times-eleven'),
  S('mm.mul.squares', 7, 'Difference of Squares', 'Squares', '49 × 51 = 50² − 1² = 2499.', 'mul-squares', 'mul', 12000, L(30, 20, 15, 12), ['mm.mul.2x2'], 'diff-squares'),
  // --- World 8: three-digit multiplication ---
  S('mm.mul.3x1', 8, 'Three-Digit × One-Digit', '3×1', '326 × 4 = 1200 + 80 + 24.', 'mul3x1', 'mul', 14000, L(40, 30, 20, 15, 12), ['mm.mul.2x1'], 'distribute'),
  S('mm.mul.3x2', 8, 'Friendly Three × Two', '3×2', '125 × 24 = 2500 + 500.', 'mul3x2', 'mul', 20000, L(60, 45, 30, 25, 20), ['mm.mul.3x1', 'mm.mul.2x2'], 'distribute-tens'),
  // --- World 9 & 10 ---
  S('mm.choose', 9, 'Which Way Would You Solve It?', 'Choose', 'Pick the cheapest mental route before you calculate.', 'strategy-choice', 'none', 9000, L(25, 18, 12, 10), ['mm.add3.mixed', 'mm.sub3.mixed']),
  S('mm.mixed', 9, 'Mixed Mental Arithmetic', 'Mixed', 'Every operation, shuffled, your choice of route.', 'mixed-all', 'none', 8000, L(25, 18, 12, 9, 7), ['mm.choose']),
  S('mm.arena', 10, 'Arena', 'Arena', 'Everything, against the clock and against your own records.', 'mixed-all', 'none', 6000, L(20, 12, 8, 6, 4), ['mm.mixed']),
];

export const mmSkill = (id: string) => MM_SKILLS.find((s) => s.id === id);
export const skillsInWorld = (n: number) => MM_SKILLS.filter((s) => s.world === n);
export const mmWorld = (n: number) => MM_WORLDS.find((w) => w.n === n);

/** Every skill id the academy owns, for wiring into the main skill registry. */
export const MM_SKILL_IDS = MM_SKILLS.map((s) => s.id);

/** The lesson text for a skill: what it is, why it works, and the worked example shape. */
export interface MMLesson { title: string; intro: string; why: string; examples: [number, number][]; watchOut?: string }
export const MM_LESSONS: Record<string, MMLesson> = {
  'mm.place': { title: 'Every digit has a job', intro: 'A digit means different things depending on where it sits. In 347 the 3 is three hundreds, the 4 is four tens, the 7 is seven ones.', why: 'Our number system is built in powers of ten, so each step left multiplies the digit\'s value by ten. Mental arithmetic works by moving these parts around, so you must see them first.', examples: [[347, 0], [582, 0], [906, 0]] },
  'mm.expand': { title: 'Take numbers apart', intro: '347 = 300 (hundreds part) + 40 (tens part) + 7 (ones part). Anything you can split, you can add or subtract one piece at a time.', why: 'Addition and multiplication both distribute over these parts, so splitting never changes the answer. This single idea powers every strategy in the Academy.', examples: [[347, 0], [286, 0], [1204, 0]] },
  'mm.make10': { title: 'What does it need?', intro: '8 needs 2 (partner to make ten), 7 needs 3, 6 needs 4. These pairs must be instant, because every "make a ten" move depends on them.', why: 'Ten is where our number system rolls over, so landing on a ten makes the next step trivial.', examples: [[8, 2], [7, 3], [6, 4]] },
  'mm.make100': { title: 'Up to a hundred', intro: '80 needs 20 (partner to make a hundred), 70 needs 30, 45 needs 55. The same complement idea, one place bigger.', why: 'A round hundred is the easiest number to hold and to add to, so getting there first pays for itself.', examples: [[80, 20], [45, 55], [62, 38]] },
  'mm.complement': { title: 'Subtract from 100 without borrowing', intro: '100 − 37: take the tens digit from 9 and the ones from 10. 9 − 3 (tens digit) = 6 (new tens digit), 10 − 7 (ones digit) = 3 (new ones digit) → 63.', why: '100 = 99 + 1, and subtracting from 99 never needs a borrow. Adding the 1 back at the end lands you on the right answer.', examples: [[100, 37], [100, 68], [100, 15]] },
  'mm.double': { title: 'Doubling is your fastest move', intro: '6 + 6, 12 + 12, 25 + 25, 125 + 125. Doubles come out faster than any other sum.', why: 'Doubles are stored as single facts rather than computed, which is why near-doubles and the double-and-halve trick are worth learning.', examples: [[6, 6], [25, 25], [125, 125]] },
  'mm.halve': { title: 'Halving', intro: '100 → 50, 80 → 40, 36 → 18, 250 → 125. Halve the tens, halve the ones, put them together.', why: 'Halving is doubling run backwards, and it turns ×5, ×25 and ×50 into easy problems.', examples: [[36, 0], [250, 0], [86, 0]] },
  'mm.times10': { title: 'Times ten shifts the digits', intro: '37 × 10 = 370. 37 × 100 = 3700. Nothing is calculated; the digits slide.', why: 'Each place is worth ten times the one to its right, so multiplying by ten moves every digit one place left.', examples: [[37, 10], [46, 100], [8, 1000]] },
  'mm.units': { title: 'Five, twenty-five, fifty', intro: '×5 is half of ×10. ×50 is half of ×100. ×25 is a quarter of ×100.', why: '5 = 10 ÷ 2, so multiplying by 5 is multiplying by 10 and halving. The same trick works for 50 and 25, and turns awkward products into digit shifts.', examples: [[38, 5], [24, 25], [18, 50]] },
  'mm.add2.chunks': { title: 'Add the big part first', intro: '47 + 36: add 30 (tens part) to get 77 (running total), then 6 (ones part) to get 83. Two easy hops instead of one hard sum.', why: '36 is 30 + 6, and addition lets you add the parts in any order, so the total is unchanged.', examples: [[47, 36], [58, 24], [63, 29]] },
  'mm.add2.left': { title: 'Left to right', intro: '47 + 36: 40 + 30 = 70 (tens total), 7 + 6 = 13 (ones total), then 70 + 13 = 83. Same answer, different bookkeeping.', why: 'Both numbers split by place, and the places can be added separately before recombining.', examples: [[47, 36], [52, 39], [64, 28]] },
  'mm.add2.make10': { title: 'Slide to the round number', intro: '48 + 27: 48 needs 2 (partner to make ten), so take 2 from 27. Now it is 50 (round ten) + 25 (left to add) = 75.', why: 'Moving an amount from one addend to the other leaves the total unchanged, and round numbers are easier to add.', examples: [[48, 27], [37, 25], [69, 23]], watchOut: 'Only worth it when the ones digits cross a ten.' },
  'mm.add2.comp': { title: 'Round up, then give one back', intro: '58 + 39: 39 is nearly 40. 58 + 40 = 98 (running total), then take back the extra 1 → 97.', why: '39 = 40 − 1, so adding 39 is adding 40 and subtracting 1.', examples: [[58, 39], [46, 29], [73, 19]], watchOut: 'Watch the direction: you added too much, so you take back.' },
  'mm.add2.double': { title: 'Near doubles', intro: '48 + 49: 48 + 48 = 96 (the double), plus 1 more → 97.', why: 'The second number is the first plus a tiny amount, so the sum is the double plus that amount.', examples: [[48, 49], [24, 25], [36, 37]] },
  'mm.add2.friendly': { title: 'Pair the friendly numbers', intro: '25 + 38 + 75: spot that 25 + 75 = 100 (friendly pair), then add 38 → 138.', why: 'Addition can be reordered freely, so hunt for pairs that make a round hundred before adding anything else.', examples: [[25, 75], [62, 38], [45, 55]] },
  'mm.add3.chunks': { title: 'Three hops', intro: '347 + 286: +200 (hundreds part) → 547, +80 (tens part) → 627, +6 (ones part) → 633.', why: '286 = 200 + 80 + 6, and each hop lands on a number you can hold.', examples: [[347, 286], [234, 123], [518, 264]] },
  'mm.add3.comp': { title: 'Round the hundreds', intro: '398 + 247: 400 + 247 = 647 (running total), then take back 2 (extra) → 645.', why: '398 = 400 − 2. Rounding to the hundred turns three hops into one.', examples: [[398, 247], [497, 316], [289, 154]] },
  'mm.add3.friendly': { title: 'Look for the hundred', intro: '125 + 275 + 48: 125 + 275 = 400 (friendly pair), then 448.', why: 'Reordering is free, and a pair that makes a round hundred removes almost all the work.', examples: [[125, 275], [340, 160], [275, 425]] },
  'mm.sub2.chunks': { title: 'Take away the big part first', intro: '74 − 32: −30 (tens part) → 44, −2 (ones part) → 42.', why: '32 = 30 + 2, and taking away the parts in turn removes exactly the same amount.', examples: [[74, 32], [86, 41], [95, 63]] },
  'mm.sub2.comp': { title: 'Round and give back', intro: '74 − 29: take 30 → 44 (running total), but you took 1 (extra) too many, so give it back → 45.', why: '29 = 30 − 1, so subtracting 29 is subtracting 30 and adding 1.', examples: [[74, 29], [63, 19], [82, 38]], watchOut: 'Subtracting too much means you must add back, not subtract again.' },
  'mm.sub2.countup': { title: 'Mind the gap', intro: '72 − 68: from 68 to 70 is 2 (first hop), from 70 to 72 is 2 (second hop). Four.', why: 'A difference is a distance, and you can walk it from either end.', examples: [[72, 68], [53, 47], [61, 58]] },
  'mm.sub2.constant': { title: 'Move both, keep the gap', intro: '83 − 48: add 2 to each → 85 − 50 (round number) = 35.', why: 'Sliding both numbers the same distance along the line leaves the space between them unchanged.', examples: [[83, 48], [71, 39], [92, 58]] },
  'mm.sub3.chunks': { title: 'Down in three hops', intro: '532 − 211: −200 (hundreds part) → 332, −10 (tens part) → 322, −1 (ones part) → 321.', why: '211 = 200 + 10 + 1, taken away one piece at a time.', examples: [[532, 211], [874, 342], [645, 123]] },
  'mm.sub3.comp': { title: 'Take a hundred, give back the rest', intro: '623 − 287: −300 → 323 (running total), then +13 (give-back) → 336, because 287 is 13 short of 300.', why: '287 = 300 − 13, so subtracting it is subtracting 300 and adding 13 back.', examples: [[623, 287], [512, 198], [734, 296]], watchOut: 'The give-back amount is 300 minus the number, not the ones digit.' },
  'mm.sub3.countup': { title: 'Walk the gap', intro: '503 − 487: 487 → 500 is 13 (first hop), 500 → 503 is 3 (second hop). Sixteen.', why: 'When the numbers are close, counting up is far less work than three borrows.', examples: [[503, 487], [612, 588], [800, 764]] },
  'mm.mul.facts': { title: 'Facts are the alphabet', intro: 'Every mental multiplication ends in facts you already know. 7 × 8 must arrive without thought.', why: 'Working memory is small. If a fact costs you three seconds, the bigger problem falls apart while you fetch it.', examples: [[7, 8], [6, 9], [12, 7]] },
  'mm.mul.dist': { title: 'Break apart to multiply', intro: '17 × 6: 10 × 6 = 60 (tens part), 7 × 6 = 42 (ones part), together 102.', why: 'The distributive property: (10 + 7) × 6 = 10 × 6 + 7 × 6. Picture a rectangle cut into two strips; the area does not change.', examples: [[17, 6], [23, 7], [34, 5]] },
  'mm.mul.by5': { title: 'Times five', intro: '38 × 5: 38 × 10 = 380 (ten groups), halve it → 190 (five groups).', why: '5 = 10 ÷ 2. Multiplying by ten is a digit shift, and halving is fast, so the pair beats multiplying by 5 directly.', examples: [[38, 5], [46, 5], [124, 5]] },
  'mm.mul.by25': { title: 'Times twenty-five and fifty', intro: '24 × 25: 24 × 100 = 2400 (a hundred groups), quarter of it → 600 (twenty-five groups).', why: '25 = 100 ÷ 4 and 50 = 100 ÷ 2, so both become a digit shift plus a halving or two.', examples: [[24, 25], [18, 50], [36, 25]] },
  'mm.mul.doubling': { title: 'Doubling as a tool', intro: '×4 is double twice. ×8 is double three times. 23 × 4 → 46 (two groups) → 92 (four groups).', why: '4 = 2 × 2 and 8 = 2 × 2 × 2, and the associative property lets you apply the doublings one after another.', examples: [[23, 4], [17, 8], [35, 4]] },
  'mm.mul.2x1': { title: 'Two digits by one', intro: '23 × 7: 20 × 7 = 140 (tens part), 3 × 7 = 21 (ones part), together 161.', why: 'Split the two-digit number by place and multiply each piece, then add.', examples: [[23, 7], [46, 8], [58, 6]] },
  'mm.mul.2x2': { title: 'Two digits by two digits', intro: '23 × 17: 23 × 10 = 230 (tens part), 23 × 7 = 161 (ones part), together 391.', why: 'Split the second number into tens and ones; each piece is a two-by-one problem you already own.', examples: [[23, 17], [34, 12], [26, 15]], watchOut: 'Hold the first part while you compute the second; say it aloud if you must.' },
  'mm.mul.comp': { title: 'Round and take back', intro: '19 × 24: 20 × 24 = 480 (twenty groups), then subtract one 24 → 456 (nineteen groups).', why: '19 = 20 − 1, so 19 × 24 = 20 × 24 − 1 × 24. The take-back is a whole group, not a single unit.', examples: [[19, 24], [29, 13], [98, 7]], watchOut: 'Take back one group of the other number, not 1.' },
  'mm.mul.dh': { title: 'Double and halve', intro: '16 × 25 → 8 × 50 → 4 × 100 = 400.', why: 'Halving one factor and doubling the other cancels out, so the product is unchanged. Repeat until one factor is round.', examples: [[16, 25], [14, 50], [18, 25]] },
  'mm.mul.11': { title: 'Times eleven', intro: '32 × 11: 3 _ 2 with 3 + 2 = 5 (middle digit) in the gap → 352.', why: '× 11 is × 10 plus × 1, so the digits are added to themselves shifted one place. The middle digit is that sum. When it passes 9, the extra ten carries left.', examples: [[32, 11], [57, 11], [68, 11]], watchOut: 'When the digit sum is 10 or more, carry into the left digit.' },
  'mm.mul.squares': { title: 'Difference of squares', intro: '49 × 51 = (50 − 1)(50 + 1) = 2500 (middle squared) − 1 (gap squared) = 2499.', why: 'The cross terms +50 and −50 cancel, leaving the square of the middle minus the square of the gap.', examples: [[49, 51], [48, 52], [45, 55]], watchOut: 'Only works when both numbers sit the same distance from a round middle.' },
  'mm.mul.3x1': { title: 'Three digits by one', intro: '326 × 4: 1200 (hundreds part) + 80 (tens part) + 24 (ones part) = 1304.', why: 'Split by place and multiply each part. The hundreds part is the anchor you hold.', examples: [[326, 4], [418, 3], [275, 6]] },
  'mm.mul.3x2': { title: 'Friendly three by two', intro: '125 × 24: 125 × 20 = 2500 (tens part), 125 × 4 = 500 (ones part), together 3000.', why: 'Split the two-digit number into tens and ones. Choose this only when the three-digit number is friendly, like 125, 250 or 200.', examples: [[125, 24], [250, 12], [200, 34]], watchOut: 'Not every three-by-two belongs in your head. Pick the friendly ones.' },
  'mm.add2.mixed': { title: 'Now choose for yourself', intro: 'Any two-digit sum, with no hint about which move to use. Look at the numbers before you start: is one nearly a ten? Do the ones cross ten? Are they nearly equal?', why: 'Every route gives the same answer, but the cheapest one depends on the numbers in front of you. Recognising the shape is the skill.', examples: [[47, 36], [48, 27], [58, 39]] },
  'mm.add3.mixed': { title: 'Three digits, your call', intro: 'Chunk it, round it, or pair it. 347 + 286 in three hops; 398 + 247 in one hop and a fix.', why: 'The bigger the numbers, the more a good choice saves. A round hundred is worth hunting for.', examples: [[347, 286], [398, 247], [518, 264]] },
  'mm.sub2.mixed': { title: 'Four ways down', intro: 'Chunks, round and adjust, count up, or slide both numbers. Pick before you calculate.', why: 'Subtraction has more good routes than addition, and borrowing is the worst of them.', examples: [[74, 32], [74, 29], [72, 68]] },
  'mm.sub3.mixed': { title: 'Three digits, four routes', intro: '623 − 287 by compensation; 503 − 487 by counting up; 532 − 211 in chunks.', why: 'When the numbers are close, count up. When the subtracted number is near a hundred, round and give back. Otherwise chunk.', examples: [[623, 287], [503, 487], [532, 211]] },
  'mm.arena': { title: 'The arena', intro: 'No scaffolding, no warnings. Accuracy first, then speed, then records.', why: 'Automaticity comes from repeated correct retrieval under mild pressure, not from grinding under heavy pressure.', examples: [[47, 26], [503, 487], [16, 25]] },
  'mm.choose': { title: 'Choose before you calculate', intro: '99 + 47 has three valid routes. Rounding to 100 and taking back 1 is the cheapest. Spotting that is a skill of its own.', why: 'Every route gives the same answer, but they cost different amounts of working memory. The cheapest route is the one that lands on round numbers soonest.', examples: [[99, 47], [48, 27], [623, 287]] },
  'mm.mixed': { title: 'All of it, shuffled', intro: 'Addition, subtraction and multiplication together, so you must recognise the shape of a problem before you solve it.', why: 'Real arithmetic never announces which strategy it wants. Mixing is what turns a practised move into an automatic one.', examples: [[347, 286], [623, 287], [23, 17]] },
};
