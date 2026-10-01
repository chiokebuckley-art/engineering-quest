import type { LessonDef } from '../lessons';

/** Pattern Lab lessons (Contest Path). Teach-card standard: worked numbers on the picture, then a Try next. */
type Sq = [number, number];
/** A row of n squares, and a staircase of n columns (1 to n squares tall), for the worked pictures. */
const row = (n: number): Sq[] => Array.from({ length: n }, (_, c) => [c, 0] as Sq);
const stairs = (n: number): Sq[] => Array.from({ length: n }, (_, c) => Array.from({ length: c + 1 }, (_, r) => [c, r] as Sq)).flat();
export const PATTERN_LESSONS: LessonDef[] = [
  {
    id: 'l.pattern-1', title: 'Find the part that repeats', teacher: 'vector', skillId: 'pattern.shapes', minutes: 6, group: 'Pattern Lab',
    summary: 'Say a pattern out loud to find the part that repeats. Count what each step of a growing shape adds.',
    steps: [
      {
        type: 'say', speaker: 'vector', text: 'A pattern has a part that repeats, again and again. Say this train out loud: red circle, blue square, red circle, blue square…',
        visual: { type: 'pattern', cells: [{ shape: 'circle', color: 'red' }, { shape: 'square', color: 'blue' }, { shape: 'circle', color: 'red' }, { shape: 'square', color: 'blue' }, { shape: 'circle', color: 'red' }, null] },
        caption: 'What comes next?',
      },
      {
        type: 'say', speaker: 'vector', text: 'The part that repeats has 2 (shapes): red circle, blue square. The train ends with a red circle, and a blue square always comes after it. So a blue square comes next!',
        visual: { type: 'pattern', cells: [{ shape: 'circle', color: 'red' }, { shape: 'square', color: 'blue' }, { shape: 'circle', color: 'red' }, { shape: 'square', color: 'blue' }, { shape: 'circle', color: 'red' }, { shape: 'square', color: 'blue' }] },
        caption: 'Red circle, blue square, again and again',
      },
      { type: 'try', speaker: 'vector', intro: 'Say the shapes out loud. Find the part that repeats.', skillId: 'pattern.shapes', difficulty: 1, count: 3 },
      {
        type: 'say', speaker: 'vector', text: 'Shapes can grow, too. Count each step: step 1 has 3 (squares), step 2 has 5 (squares), step 3 has 7 (squares). Each step adds 2 (squares).',
        visual: { type: 'growing', steps: [row(3), row(5), row(7)], ask: 4 },
        caption: 'A row that grows',
      },
      {
        type: 'say', speaker: 'vector', text: 'So step 4 has 7 (squares before) + 2 (new squares) = 9 (squares). The new squares are the bright ones.',
        visual: { type: 'growing', steps: [row(3), row(5), row(7), row(9)], showNew: true },
        caption: 'Two new squares each step',
      },
      { type: 'try', speaker: 'vector', intro: 'Count the squares in each step. How many more each time?', skillId: 'pattern.grow', difficulty: 1, count: 3 },
      {
        type: 'say', speaker: 'vector', text: 'Numbers make patterns too. Each jump adds 2 (jump). So 18 (last number) + 2 (jump) = 20 (next number).',
        visual: { type: 'pattern', cells: [{ num: 12 }, { num: 14 }, { num: 16 }, { num: 18 }, null] },
        caption: 'Count by twos',
      },
      { type: 'try', speaker: 'vector', intro: 'Find the jump, then make one more jump.', skillId: 'pattern.number', difficulty: 2, count: 3 },
      { type: 'summary', speaker: 'vector', points: ['Say the pattern out loud.', 'Find the part that repeats, then keep going.', 'For growing shapes, count what each step adds.', 'For numbers, find the jump.'] },
    ],
  },
  {
    id: 'l.pattern-2', title: 'Rules, jumps and machines', teacher: 'newton', skillId: 'pattern.machine', minutes: 7, group: 'Pattern Lab',
    summary: 'Find a pattern’s rule, use it step by step, and run a function machine forwards or backwards.',
    recommendedAfter: [{ skillId: 'pattern.number', mastery: 30 }],
    steps: [
      {
        type: 'say', speaker: 'newton', text: 'A staircase grows. Step 1 has 1 (square), step 2 has 3 (squares), step 3 has 6 (squares), step 4 has 10 (squares). What does each step add?',
        visual: { type: 'growing', steps: [stairs(1), stairs(2), stairs(3), stairs(4)], ask: 5 },
        caption: 'Each step adds a taller column',
      },
      {
        type: 'say', speaker: 'newton', text: 'Each step adds a column one square taller: 2 (new squares), then 3 (new squares), then 4 (new squares). So step 5 has 10 (squares before) + 5 (new squares) = 15 (squares).',
        visual: { type: 'growing', steps: [stairs(1), stairs(2), stairs(3), stairs(4), stairs(5)], showNew: true },
        caption: 'The new column is the bright one',
      },
      { type: 'try', speaker: 'newton', intro: 'Find what each step adds, then keep adding.', skillId: 'pattern.grow', difficulty: 3, count: 3 },
      {
        type: 'say', speaker: 'newton', text: 'A number is missing. Find the jump first: 150 (second number) − 125 (first number) = 25 (jump). Then 150 (number before the box) + 25 (jump) = 175 (missing number). Check: 175 (missing number) + 25 (jump) = 200 (number after the box).',
        visual: { type: 'pattern', cells: [{ num: 125 }, { num: 150 }, null, { num: 200 }, { num: 225 }] },
        caption: 'Jumps of 25',
      },
      { type: 'try', speaker: 'newton', intro: 'Find the jump. Then check the number after the box.', skillId: 'pattern.number', difficulty: 4, count: 3 },
      {
        type: 'say', speaker: 'newton', text: 'A function machine does the same thing to every number. Here 2 (in) gives 7 (out), 4 (in) gives 9 (out) and 5 (in) gives 10 (out). Each out is its in + 5 (the rule).',
        visual: { type: 'machine', rows: [{ input: 2, output: 7 }, { input: 4, output: 9 }, { input: 5, output: 10 }, { input: 8, output: '?' }] },
        caption: 'Find the rule from the table',
      },
      {
        type: 'say', speaker: 'newton', text: 'Use the rule: 8 (in) + 5 (the rule) = 13 (out). To go backwards, do the opposite: if 20 (out) came out, then 20 (out) − 5 (the rule) = 15 (in) went in.',
        visual: { type: 'machine', rule: '+ 5', rows: [{ input: 2, output: 7 }, { input: 4, output: 9 }, { input: 5, output: 10 }, { input: 8, output: 13 }] },
        caption: 'The rule is + 5',
      },
      { type: 'try', speaker: 'newton', intro: 'Find the rule from the table. Then use it, or undo it to go backwards.', skillId: 'pattern.machine', difficulty: 4, count: 3 },
      { type: 'summary', speaker: 'newton', points: ['Growing shapes: find what each step adds, then add step by step.', 'Missing number: find the jump, fill the box, then check the next number.', 'Function machine: compare each in with its out to find the rule.', 'Backwards: do the opposite of the rule.'] },
    ],
  },
  {
    id: 'l.pattern-3', title: 'Jump to the far term', teacher: 'vector', skillId: 'pattern.term', minutes: 8, group: 'Pattern Lab',
    summary: 'Reach the 40th or 100th term without listing them all: count the jumps, find your place in the repeat, build a far step from its parts.',
    recommendedAfter: [{ skillId: 'pattern.number', mastery: 40 }],
    steps: [
      {
        type: 'say', speaker: 'vector', text: 'The pattern 5, 8, 11, 14, … keeps adding 3 (jump). What is the 40th number? Listing them all is slow, and slow is where mistakes hide.',
        visual: { type: 'pattern', cells: [{ num: 5 }, { num: 8 }, { num: 11 }, { num: 14 }, {}, null], under: ['1st', '2nd', '3rd', '4th', '', '40th'] },
        caption: 'Jumps of 3',
      },
      {
        type: 'say', speaker: 'vector', text: 'From the 1st number to the 40th there are 39 (jumps): one fewer than the place number. So 5 (first number) + 39 (jumps) × 3 (jump) = 122 (fortieth number).',
        visual: { type: 'pattern', cells: [{ num: 5 }, { num: 8 }, { num: 11 }, { num: 14 }, {}, { num: 122 }], under: ['1st', '2nd', '3rd', '4th', '', '40th'] },
        caption: 'First + jumps × jump size',
      },
      { type: 'try', speaker: 'vector', intro: 'Count the jumps: one less than the place number.', skillId: 'pattern.term', difficulty: 5, count: 3 },
      {
        type: 'say', speaker: 'vector', text: 'A train repeats red star, blue circle, green square, yellow heart. What is the 47th shape? The repeat has 4 (shapes), and 47 (place) = 11 (full repeats) × 4 (shapes in the repeat) + 3 (extra shapes). So it is the 3rd shape of the repeat: the green square.',
        visual: { type: 'pattern', cells: [{ shape: 'star', color: 'red' }, { shape: 'circle', color: 'blue' }, { shape: 'square', color: 'green' }, { shape: 'heart', color: 'yellow' }, { shape: 'star', color: 'red' }, { shape: 'circle', color: 'blue' }, {}, null], under: ['1st', '2nd', '3rd', '4th', '5th', '6th', '', '47th'] },
        caption: 'Full repeats, then the leftovers',
      },
      {
        type: 'say', speaker: 'vector', text: 'Growing shapes have rules too. This T-shape has 1 (centre square) and 3 (arms), and in step n each arm has n squares. Check on step 3: 1 (centre square) + 3 (arms) × 3 (squares per arm) = 10 (squares). So step 100 has 1 (centre square) + 3 (arms) × 100 (squares per arm) = 301 (squares).',
        visual: { type: 'growing', steps: [[[3, 3], [2, 3], [4, 3], [3, 2]], [[3, 3], [2, 3], [4, 3], [3, 2], [1, 3], [5, 3], [3, 1]], [[3, 3], [2, 3], [4, 3], [3, 2], [1, 3], [5, 3], [3, 1], [0, 3], [6, 3], [3, 0]]], ask: 100 },
        caption: 'Build step 100 from its parts',
      },
      { type: 'try', speaker: 'vector', intro: 'Find how each step is built, then build the far step.', skillId: 'pattern.grow', difficulty: 5, count: 3 },
      {
        type: 'say', speaker: 'vector', text: 'Two-step machines run backwards in reverse order. The rule is × 2 (multiplier), then + 1 (second step), and 31 (out) came out. Undo the last step first: 31 (out) − 1 (second step) = 30 (before the second step). Then 30 (before the second step) ÷ 2 (multiplier) = 15 (in).',
        visual: { type: 'machine', rule: '× 2, then + 1', rows: [{ input: 4, output: 9 }, { input: 7, output: 15 }, { input: '?', output: 31 }] },
        caption: 'Undo the last step first',
      },
      { type: 'try', speaker: 'vector', intro: 'Forwards: first step, then second. Backwards: undo the second, then the first.', skillId: 'pattern.machine', difficulty: 5, count: 3 },
      { type: 'summary', speaker: 'vector', points: ['The nth number = first + (n − 1) jumps.', 'For a far shape, take away full repeats and look at what is left.', 'Build a far step from its parts, then check the rule on a step you can see.', 'Run a machine backwards: undo the steps in reverse order.'] },
    ],
  },
];
