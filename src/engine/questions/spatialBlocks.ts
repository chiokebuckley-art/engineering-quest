import type { Difficulty, Question, QuestionChoice, Visual } from '../types';
import type { Rng } from '../rng';
import type { Generator } from './context';
import { contestQuestion, choicesFrom, gradeOf, type ContestGameMeta, type ContestKind, type ContestSpec, type KindGrades } from '../contest/common';
import { lab, labn } from '../label';

/**
 * Spatial Blocks (Contest Path): count cubes in isometric stacks, hidden cubes, layers, boxes to fill and painted cubes.
 * Difficulty 1–2 = Grade 1, 3–4 = Grade 3, 5–6 = Grade 5 (see contest/common.ts). A kind asked at a difficulty
 * outside its grades plays at the nearest difficulty it supports.
 *
 * The picture: heights[row][col] cubes stand on each square, row 0 at the back. The drawing is a true isometric view
 * from the front-right, so a cube shows its top, its front (the +row side) and its right side (the +col side).
 */
export type BlocksKind = 'all' | 'count' | 'hidden' | 'layers' | 'fill' | 'painted';
type Kind = Exclude<BlocksKind, 'all'>;
type Grid = number[][];
type Iso = Extract<Visual, { type: 'iso' }>;

export const BLOCKS_META: ContestGameMeta = {
  id: 'blocks', label: 'Spatial Blocks', icon: 'crystal', topic: 'Spatial blocks', skill: 'blocks',
  blurb: 'How many cubes? Count stacks you can see, cubes hidden underneath, layers, painted faces and cubes still missing.',
  intro: 'Every cube sits on the floor or on another cube, so a cube you see on top stands on a whole tower, even the cubes you cannot see. Count tower by tower or layer by layer, then add. A full box holds length × width × height cubes, so the cubes still missing are the full box minus what is there. A painted cube cut into small cubes has 3 painted faces on its 8 corners, 2 along its edges, 1 in the middle of each face and none inside.',
  tree: { x: 5, y: 2 }, prereq: { skillId: 'add.basic', mastery: 0 },
};

export const BLOCKS_KINDS: ContestKind[] = [
  { id: 'all', label: 'Mixed', short: 'Mixed', desc: 'How many cubes? Count stacks you can see, cubes hidden underneath, layers, painted faces and cubes still missing.' },
  { id: 'count', label: 'Count the cubes', short: 'Count', desc: 'Count every cube in a small stack; touch each one once.' },
  { id: 'hidden', label: 'Hidden cubes', short: 'Hidden', desc: 'A cube on top needs a cube under it. Count the ones you cannot see.' },
  { id: 'layers', label: 'Layer by layer', short: 'Layers', desc: 'Count one layer, then add the layers (or count each column\'s height).' },
  { id: 'fill', label: 'Fill the box', short: 'Fill', desc: 'How many more cubes make the full box? Full box minus what is there.' },
  { id: 'painted', label: 'Painted cubes', short: 'Painted', desc: 'A painted cube cut up: corners have 3 painted faces, edges 2, faces 1, the inside 0.' },
];
/** Which grades each kind suits. */
export const BLOCKS_KIND_GRADES: KindGrades = { count: ['g1', 'g3'], hidden: ['g3', 'g5'], layers: ['g3', 'g5'], fill: ['g3', 'g5'], painted: ['g5'] };
/** The difficulties each kind is written for; other difficulties play at the nearest one. */
const BAND: Record<Kind, [number, number]> = { count: [1, 4], hidden: [3, 6], layers: [3, 6], fill: [3, 6], painted: [5, 6] };

const APP = 'Builders and engineers read 3D drawings and count the parts they cannot see before they order materials.';
/** The rule every stack follows, said in the prompt whenever cubes are hidden. */
const RULE = 'Every cube sits on the floor or on another cube. The stack is solid where it looks solid.';

/* ------------------------------------------------------------------ */
/* Geometry: which cubes show in the drawing                            */
/* ------------------------------------------------------------------ */

/**
 * Each cube's outline in the drawing is a hexagon made of six triangles: two for the top, two for the front, two for the
 * right side. On the screen lattice (X = col − row, Y = col + row − 2 × z) the triangles' centres, times 3, sit at
 * these offsets from the hexagon's centre.
 */
const TRIS: readonly [number, number][] = [[-1, -3], [1, -3], [-2, 0], [-1, 3], [2, 0], [1, 3]];
export interface CubeSeen { r: number; c: number; z: number; /** How many of its six triangles show (0 = hidden). */ shown: number; /** A whole face (top, front or side) shows. */ face: boolean }
/**
 * Every cube of a stack and how much of it shows. A triangle of the drawing belongs to the cube nearest the viewer
 * (largest row + col + z) among those that cover it, which also hides faces glued to a neighbour.
 */
export function seenCubes(heights: Grid): CubeSeen[] {
  const cubes: { r: number; c: number; z: number }[] = [];
  heights.forEach((row, r) => row.forEach((h, c) => { for (let z = 0; z < h; z++) cubes.push({ r, c, z }); }));
  const keys = (q: { r: number; c: number; z: number }) => { const X = q.c - q.r, Y = q.c + q.r - 2 * q.z; return TRIS.map(([dx, dy]) => `${3 * X + dx},${3 * Y + dy}`); };
  const depth = (q: { r: number; c: number; z: number }) => q.r + q.c + q.z;
  const owner = new Map<string, number>();
  cubes.forEach((q, i) => keys(q).forEach((k) => { const o = owner.get(k); if (o === undefined || depth(cubes[o]) < depth(q)) owner.set(k, i); }));
  return cubes.map((q, i) => {
    const mine = keys(q).map((k) => owner.get(k) === i);
    return { ...q, shown: mine.filter(Boolean).length, face: (mine[0] && mine[1]) || (mine[2] && mine[3]) || (mine[4] && mine[5]) };
  });
}

/** What the drawing shows, triangle by triangle: one face of a cube at a spot on the screen, or a floor square. */
function pictureKey(h: Grid): string {
  const rows = h.length, cols = Math.max(0, ...h.map((row) => row.length));
  const seen = new Map<string, { d: number; id: string }>();
  const put = (X: number, Y: number, i: number, d: number, id: string) => {
    const k = `${3 * X + TRIS[i][0]},${3 * Y + TRIS[i][1]}`; const o = seen.get(k);
    if (!o || o.d < d) seen.set(k, { d, id });
  };
  // a floor square is the top of a cube one level under the floor, behind every cube
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) for (const i of [0, 1]) put(c - r, c + r + 2, i, -1, `floor ${r},${c}`);
  h.forEach((row, r) => row.forEach((n, c) => {
    for (let z = 0; z < n; z++) for (let i = 0; i < 6; i++) put(c - r, c + r - 2 * z, i, r + c + z, `${'ttffss'[i]} ${c - r},${c + r - 2 * z}`);
  }));
  return [...seen].map(([k, o]) => `${k}:${o.id}`).sort().join(' ');
}
/**
 * The picture fixes the stack: making any one tower taller or shorter (or standing a new tower on an empty square)
 * changes the drawing, so no cube can hide out of sight. In a true isometric view a cube can sit exactly behind a
 * cube one row nearer, one column to the right and one level higher, so this is not automatic.
 */
export function pictureFixesStack(h: Grid): boolean {
  const key = pictureKey(h); const top = Math.max(0, ...h.flat()) + h.length + 1;
  return h.every((row, r) => row.every((n, c) => {
    for (let x = 0; x <= top; x++) if (x !== n && pictureKey(h.map((rw, rr) => rw.map((v, cc) => (rr === r && cc === c ? x : v)))) === key) return false;
    return true;
  }));
}

const SQ3 = Math.sqrt(3) / 2;
/** Tap-choice pictures of stacks share one cube edge (px), so a bigger-looking button always means a bigger stack. */
export const BLOCKS_SMALL_EDGE = 16;
/** The room a tap-choice picture has, in px (inside its padding). */
const SMALL_BOX = 144;
/** The cube edge for a stack drawn small (in a tap choice): the shared edge, smaller only for a stack too big for a button. */
export function blocksSmallEdge(heights: Grid, box = 0): number {
  const rows = Math.max(1, heights.length), cols = Math.max(1, ...heights.map((r) => r.length)), top = Math.max(1, box, ...heights.flat());
  return Math.min(BLOCKS_SMALL_EDGE, SMALL_BOX / ((rows + cols) * SQ3), SMALL_BOX / ((rows + cols) / 2 + top));
}

const rowSum = (row: number[]) => row.reduce((a, b) => a + b, 0);
const total = (h: Grid) => h.reduce((s, row) => s + rowSum(row), 0);
const hiddenOf = (h: Grid) => seenCubes(h).filter((q) => q.shown === 0).length;
const iso = (heights: Grid, extra: Partial<Iso> = {}): Iso => ({ type: 'iso', heights, ...extra });

/** Stacks the lessons (content/contest/spatialBlocks.ts) work out in full: the tries right after them never show the same stack. */
const LESSON_STACKS = new Set(['[[3,2,1]]', '[[3,2],[2,1]]']);
const lessonStack = (h: Grid) => LESSON_STACKS.has(JSON.stringify(h));

/** A corner stack: towers never get taller toward the front or toward the right, so every tower's top shows. */
function cornerStack(rng: Rng, rows: number, cols: number, maxH: number): Grid {
  const h: Grid = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      const ub = Math.min(maxH, r ? h[r - 1][c] : maxH, c ? row[c - 1] : maxH);
      row.push(Math.max(1, ub - rng.pick([0, 0, 0, 1, 1, 2])));
    }
    h.push(row);
  }
  return h;
}
/** Draw corner stacks until one fits (total, hidden cubes); the last try is kept if none does. */
function fitStack(rng: Rng, o: { rows: number[]; cols: number[]; maxH: number; tot: [number, number]; hid: [number, number] }): Grid {
  let h: Grid = [[1]];
  for (let t = 0; t < 300; t++) {
    h = cornerStack(rng, rng.pick(o.rows), rng.pick(o.cols), o.maxH);
    const n = total(h), hid = hiddenOf(h);
    if (n >= o.tot[0] && n <= o.tot[1] && hid >= o.hid[0] && hid <= o.hid[1]) return h;
  }
  return h;
}

/* ------------------------------------------------------------------ */
/* Words                                                                */
/* ------------------------------------------------------------------ */

const ORD = ['bottom', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
/** "back row", "middle row", "front row"… for row r of a stack `rows` deep (row 0 at the back). */
export const blocksRowName = (r: number, rows: number): string => (r === 0 ? 'back row' : r === rows - 1 ? 'front row' : rows === 3 ? 'middle row' : `${ORD[r]} row`);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
/** "3 (cubes) + 2 (cubes) + 1 (cube)" for the towers of a row. */
const towerTerms = (row: number[]) => row.filter((v) => v > 0).map((v) => labn(v, 'cube')).join(' + ');
/** One line per row that has cubes ("Back row: 3 (cubes) + 2 (cubes) = 5 (cubes)."), then the total. */
function byRows(h: Grid, totalLabel = 'cubes in all'): string[] {
  const used = h.map((row, r) => ({ r, row, s: rowSum(row) })).filter((x) => x.s > 0);
  if (used.length === 1) {
    const t = used[0].row.filter((v) => v > 0);
    return [t.length > 1 ? `Tower by tower: ${towerTerms(used[0].row)} = ${lab(used[0].s, totalLabel)}.` : `One tower of ${lab(used[0].s, totalLabel)}.`];
  }
  const name = (r: number) => blocksRowName(r, h.length);
  const lines = used.map(({ r, row, s }) => {
    const t = row.filter((v) => v > 0);
    return t.length > 1 ? `${cap(name(r))}: ${towerTerms(row)} = ${lab(s, 'cubes')}.` : `${cap(name(r))}: one tower of ${labn(s, 'cube')}.`;
  });
  lines.push(`${used.map(({ r, s }) => lab(s, `${unitWord(s)} in the ${name(r)}`)).join(' + ')} = ${lab(total(h), totalLabel)}.`);
  return lines;
}
const unitWord = (n: number) => (n === 1 ? 'cube' : 'cubes');

/**
 * Number buttons, smallest first: a window of n answers from one family, f(j) for n whole numbers j in a row, where
 * f(j0) is the right answer and its neighbours are the real slips of this question: a cube too few or too many
 * (f(j) = j), a layer too few or too many (f = the total of j layers), a row of the box miscounted (f(j) = j × a row).
 *
 * Fair buttons: the answer's place in the window is drawn evenly (as far as every button stays a positive number), so
 * the buttons look the same wherever the answer sits. No place, gap or pattern of the numbers points to it.
 */
function windowChoices(rng: Rng, f: (j: number) => number, j0: number, n: number): QuestionChoice[] {
  const at = (t: number) => Array.from({ length: n }, (_, i) => f(j0 - t + i));
  const ok = (t: number) => at(t).every((v, i, a) => Number.isInteger(v) && v > 0 && (!i || v > a[i - 1]));
  const ts = Array.from({ length: n }, (_, t) => t).filter(ok);
  return choicesFrom(at(ts.length ? rng.pick(ts) : 0));
}
/** A run of numbers in a row with the answer anywhere in it: one, two or three too few or too many. */
const runChoices = (rng: Rng, right: number, n: number) => windowChoices(rng, (j) => j, right, n);

/* ------------------------------------------------------------------ */
/* Count the cubes (Grades 1, 3): every cube shows                      */
/* ------------------------------------------------------------------ */

/** Every cube shows a whole face. */
const countable = (h: Grid) => seenCubes(h).every((q) => q.face);
/**
 * Single rows of towers, or a back row and a front row with an empty row between them. The front row is lower than
 * every back tower (and only its first tower may be taller than 1 cube: a taller front tower could hide a cube standing
 * in the empty row). Every cube shows a whole face, and the picture fixes the stack.
 */
function countLayout(rng: Rng, d: number): Grid {
  const spec = [
    { one: 1, cols: [2, 3], back: 3, front: 1, tot: [3, 6] },
    { one: 0.6, cols: [3, 4], back: 4, front: 1, tot: [5, 10] },
    { one: 0.4, cols: [3, 4, 5], back: 4, front: 2, tot: [8, 14] },
    { one: 0.3, cols: [4, 5], back: 5, front: 3, tot: [12, 20] },
  ][Math.min(4, Math.max(1, d)) - 1];
  for (let t = 0; t < 600; t++) {
    const single = rng.chance(spec.one); const cols = single ? rng.pick(spec.cols) : rng.pick(spec.cols.map((c) => Math.min(c, 4)));
    const back = Array.from({ length: cols }, () => rng.int(single ? 1 : 2, spec.back));
    const low = Math.min(...back) - 1;
    const h: Grid = single ? [back] : [back, Array(cols).fill(0), Array.from({ length: cols }, (_, c) => rng.int(0, Math.min(low, c === 0 ? spec.front : 1)))];
    const n = total(h);
    if (n < spec.tot[0] || n > spec.tot[1]) continue;
    if ((!single && rowSum(h[2]) === 0) || lessonStack(h)) continue;
    if (countable(h) && pictureFixesStack(h)) return h;
  }
  return [[3, 2, 1].slice(0, Math.min(3, d + 1))];
}
/** A single row of 1 to 3 towers holding n cubes. */
function rowStack(rng: Rng, n: number): Grid {
  const cols = rng.pick([1, 2, 3].filter((c) => c <= n && n <= 3 * c));
  const row: number[] = Array(cols).fill(1);
  for (let left = n - cols; left > 0; left--) { const open = row.map((v, i) => (v < 3 ? i : -1)).filter((i) => i >= 0); row[open.length ? rng.pick(open) : 0]++; }
  return [row];
}

function countQ(d: number, rng: Rng): ContestSpec {
  if (d === 1 && rng.chance(0.4)) return pickStackQ(rng);
  if (d === 2 && rng.chance(0.35)) return moreQ(rng);
  const g1 = d <= 2;
  const h = countLayout(rng, d); const n = total(h);
  const steps = [g1 ? 'Start at the left. Count each tower from the top down.' : 'Count each tower from its top down to the floor, row by row.', ...byRows(h)];
  return {
    prompt: g1 ? 'Every cube shows. How many cubes are in this stack?' : 'Every cube shows in this picture. How many cubes are in the stack?',
    readAloud: g1 ? 'Every cube shows. How many cubes are in this stack? Touch each cube once.' : undefined,
    expression: 'cubes in the stack = ?', answer: n, difficulty: d as Difficulty,
    hint: g1 ? 'Count one tower at a time. Touch each cube once.' : 'Count each tower from the top down to the floor, then add the towers.',
    steps, visual: iso(h), solutionVisual: iso(h, { ghost: true }),
    choices: d <= 3 ? runChoices(rng, n, d === 1 ? 3 : 4) : undefined,
  };
}
/** Grade 1: three small stacks; tap the one with n cubes (a line of n cubes shows how many). */
function pickStackQ(rng: Rng): ContestSpec {
  const n = rng.int(3, 6);
  const others = rng.shuffle([n - 2, n - 1, n + 1, n + 2].filter((v) => v >= 2 && v <= 8)).slice(0, 2);
  const totals = rng.shuffle([n, ...others]);
  const stacks = totals.map((t) => rowStack(rng, t));
  const names = ['A', 'B', 'C'];
  const right = totals.indexOf(n);
  return {
    prompt: `Which stack has ${n} cubes, like this line?`,
    readAloud: `Here are ${n} cubes in a line. Tap the stack that has ${n} cubes too.`,
    expression: `the stack with ${n} cubes = ?`, answer: right + 1, difficulty: 1,
    hint: 'Count the cubes in the line. Then count each stack, one cube at a time.',
    steps: [
      `The line has ${lab(n, 'cubes')}.`,
      ...stacks.map((h, i) => (h[0].length > 1 ? `Stack ${names[i]}: ${towerTerms(h[0])} = ${lab(totals[i], 'cubes')}.` : `Stack ${names[i]}: one tower of ${labn(totals[i], 'cube')}.`)),
      `Stack ${names[right]} has ${lab(n, 'cubes')}, the same as the line.`,
    ],
    visual: iso([Array(n).fill(1)]), solutionVisual: iso(stacks[right], { ghost: true }),
    choices: stacks.map((h, i) => ({ value: i + 1, label: `Stack ${names[i]}`, visual: iso(h) })),
  };
}
/**
 * Grade 1: a tall tower and a long low wall: which has more cubes? Tall does not always mean more. The tower stands
 * on the left or on the right at random, and both tap pictures share one cube size.
 */
function moreQ(rng: Rng): ContestSpec {
  // mostly the long, low stack wins: the tower looks bigger but has fewer cubes
  const wideWins = rng.chance(0.65);
  let tall = 5, k = 3, low = 2;
  for (let t = 0; t < 80; t++) {
    tall = rng.int(4, 8); low = rng.pick([1, 2]); k = rng.int(3, low === 1 ? 9 : 5);
    const wide = k * low;
    if (wide <= 10 && wide - tall >= (wideWins ? 1 : -3) && wide - tall <= (wideWins ? 3 : -1)) break;
  }
  if (k * low === tall || k * low > 10) { tall = 4; k = 3; low = 2; }
  const wide = k * low; const wall = Array(k).fill(low);
  const towerLeft = rng.chance(0.5);
  const both: Grid = [towerLeft ? [tall, 0, ...wall] : [...wall, 0, tall]];
  const side = (tower: boolean) => (tower === towerLeft ? 'left' : 'right');
  const right = (tall > wide) === towerLeft ? 1 : 2;
  const towerLine = `${cap(side(true))} stack: one tower of ${lab(tall, 'cubes')}.`;
  const wallLine = low === 1 ? `${cap(side(false))} stack: a line of ${lab(wide, 'cubes')}.` : `${cap(side(false))} stack: ${wall.map(() => lab(2, 'cubes')).join(' + ')} = ${lab(wide, 'cubes')}.`;
  const pics = [iso([[tall]]), iso([wall])];
  return {
    prompt: 'Which stack has more cubes?',
    readAloud: 'Look at the tall tower and the long stack. Which one has more cubes? Tap it.',
    expression: 'the stack with more cubes = ?', answer: right, difficulty: 2,
    hint: 'Count each stack. Tall does not always mean more.',
    steps: [
      ...(towerLeft ? [towerLine, wallLine] : [wallLine, towerLine]),
      `${lab(Math.max(tall, wide), 'cubes')} is more than ${lab(Math.min(tall, wide), 'cubes')}, so the ${right === 1 ? 'left' : 'right'} stack has more.`,
      wide > tall ? 'Tall does not always mean more!' : 'This time the tall tower wins. Count to be sure.',
    ],
    visual: iso(both), solutionVisual: iso(both, { ghost: true }),
    choices: [{ value: 1, label: 'Left stack', visual: towerLeft ? pics[0] : pics[1] }, { value: 2, label: 'Right stack', visual: towerLeft ? pics[1] : pics[0] }],
  };
}

/* ------------------------------------------------------------------ */
/* Hidden cubes (Grades 3, 5)                                           */
/* ------------------------------------------------------------------ */

function hiddenQ(d: number, rng: Rng): ContestSpec {
  const spec = {
    3: { rows: [2], cols: [2, 3], maxH: 3, tot: [6, 14], hid: [1, 3] },
    4: { rows: [2, 3], cols: [3], maxH: 4, tot: [10, 24], hid: [2, 6] },
    5: { rows: [3], cols: [3], maxH: 4, tot: [14, 30], hid: [5, 10] },
    6: { rows: [3, 4], cols: [3, 4], maxH: 5, tot: [20, 50], hid: [5, 14] },
  }[d as 3 | 4 | 5 | 6] as { rows: number[]; cols: number[]; maxH: number; tot: [number, number]; hid: [number, number] };
  const h = fitStack(rng, spec);
  const n = total(h), hid = hiddenOf(h), vis = n - hid;
  const askHidden = d === 5 || (d === 6 && rng.chance(0.5));
  const totalSteps = ['Each tower goes straight down to the floor, so read each tower\'s height from its top cube.', ...byRows(h)];
  const pulled = 'The worked picture lines the towers up, back row first: each number is a tower\'s height, and the pink cubes are the hidden ones.';
  if (!askHidden) {
    return {
      prompt: `${RULE} How many cubes are in the stack?`,
      expression: 'cubes in the stack = ?', answer: n, difficulty: d as Difficulty,
      hint: 'Find the top of each tower. Each tower goes all the way down to the floor, even where you cannot see it.',
      steps: [...totalSteps, `You can see ${lab(vis, 'cubes')}, so ${labn(hid, 'cube')} ${hid === 1 ? 'is' : 'are'} hidden under and behind the others.`, pulled],
      visual: iso(h), solutionVisual: iso(h, { ghost: true }),
      choices: d === 3 ? runChoices(rng, n, 4) : undefined,
    };
  }
  return {
    prompt: `${RULE} How many cubes can you NOT see?`,
    expression: 'hidden cubes = ?', answer: hid, difficulty: d as Difficulty,
    hint: 'First find how many cubes there are in all, tower by tower. Then take away the cubes you can see.',
    steps: [
      ...totalSteps,
      `You can see ${lab(vis, 'cubes')}: the top cube of every tower, and the cubes that show a front or a right side.`,
      `${lab(n, 'cubes in all')} − ${lab(vis, 'cubes you can see')} = ${lab(hid, unitWord(hid) + ' you cannot see')}.`,
      'A cube is hidden when it has a cube on top, a cube in front and a cube to its right.',
      pulled,
    ],
    visual: iso(h), solutionVisual: iso(h, { ghost: true }),
    choices: d === 5 ? runChoices(rng, hid, 5) : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Layer by layer (Grades 3, 5)                                         */
/* ------------------------------------------------------------------ */

const layerSize = (h: Grid, k: number) => h.flat().filter((v) => v >= k).length;
const layerOnly = (h: Grid, k: number): Grid => h.map((row) => row.map((v) => (v >= k ? 1 : 0)));
const NTH = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
/**
 * Stacks built by a rule, for the Grade 5 "what if it had more layers" questions. Layer i from the top holds size(i)
 * cubes; first(r, c) is the layer (from the top) where square (r, c) first gets a cube, so each layer sits on the one
 * under it and every tower's top shows. grow(i) works out layer i from the layer above it.
 */
interface Family { what: string; kind: string; size: (i: number) => number; first: (r: number, c: number) => number; grow: (i: number) => string }
const FAMILIES: Record<'square' | 'stair' | 'rect' | 'ell', Family> = {
  square: {
    what: 'Each layer is a square of cubes, one cube longer on each side than the layer above it.', kind: 'square numbers',
    size: (i) => i * i, first: (r, c) => Math.max(r, c) + 1,
    grow: (i) => `${lab(i, 'cubes long')} × ${lab(i, 'cubes wide')} = ${lab(i * i, 'cubes')}`,
  },
  stair: {
    what: 'Each layer is a triangle of cubes with one more row than the layer above it.', kind: 'triangle numbers',
    size: (i) => (i * (i + 1)) / 2, first: (r, c) => r + c + 1,
    grow: (i) => `${lab(((i - 1) * i) / 2, 'cubes in the layer above')} + ${lab(i, 'cubes in the new row')} = ${lab((i * (i + 1)) / 2, 'cubes')}`,
  },
  rect: {
    what: 'Each layer is a rectangle of cubes, one row and one column bigger than the layer above it.', kind: 'each layer one row and one column bigger',
    size: (i) => i * (i + 1), first: (r, c) => Math.max(r + 1, c),
    grow: (i) => `${lab(i, 'rows')} × ${lab(i + 1, 'columns')} = ${lab(i * (i + 1), 'cubes')}`,
  },
  ell: {
    what: 'Each layer is an L of cubes, with each arm one cube longer than in the layer above it.', kind: 'odd numbers',
    size: (i) => 2 * i - 1, first: (r, c) => (r === 0 || c === 0 ? Math.max(r, c) + 1 : Infinity),
    grow: (i) => `${lab(2 * i - 3, 'cubes in the layer above')} + ${lab(2, 'cubes, one on each arm')} = ${lab(2 * i - 1, 'cubes')}`,
  },
};
/** The stack of k layers built by a family's rule (heights grid, row 0 at the back). */
function familyStack(fam: Family, k: number): Grid {
  const g = Array.from({ length: k }, (_, r) => Array.from({ length: k + 1 }, (_, c) => { const f = fam.first(r, c); return f <= k ? k + 1 - f : 0; }));
  return g.some((row) => row[k]) ? g : g.map((row) => row.slice(0, k));
}

function layersQ(d: number, rng: Rng): ContestSpec {
  if (d === 3) {
    let h = fitStack(rng, { rows: [2, 3], cols: [2, 3], maxH: 3, tot: [7, 16], hid: [1, 4] });
    for (let t = 0; t < 20 && lessonStack(h); t++) h = fitStack(rng, { rows: [2, 3], cols: [2, 3], maxH: 3, tot: [7, 16], hid: [1, 4] });
    // the second layer only when it has 4 or more cubes, so the answer can sit on any of the 4 buttons
    const k = layerSize(h, 2) >= 4 && rng.chance(0.4) ? 2 : 1;
    const L = layerSize(h, k);
    const where = k === 1 ? 'bottom layer' : 'second layer from the bottom';
    const perRow = h.map((row, r) => ({ r, n: row.filter((v) => v >= k).length })).filter((x) => x.n > 0);
    return {
      prompt: `Every cube sits on the floor or on another cube. How many cubes are in the ${where}?`,
      expression: `cubes in the ${where} = ?`, answer: L, difficulty: 3,
      hint: k === 1 ? 'Every tower has one cube on the floor, even if you cannot see it. Count the towers.' : 'A tower has a cube in the second layer when it is at least 2 cubes tall. Count those towers.',
      steps: [
        k === 1 ? 'Every tower has exactly one cube in the bottom layer, even when it is hidden.' : 'A tower has one cube in the second layer when it is 2 or more cubes tall.',
        ...perRow.map(({ r, n }) => `${cap(blocksRowName(r, h.length))}: ${labn(n, 'tower')}.`),
        `${perRow.length > 1 ? `${perRow.map(({ n }) => labn(n, 'cube')).join(' + ')} =` : 'That makes'} ${lab(L, `${unitWord(L)} in the ${k === 1 ? 'bottom' : 'second'} layer`)}.`,
        'The worked picture shows that layer on its own.',
      ],
      visual: iso(h), solutionVisual: iso(layerOnly(h, k)),
      choices: runChoices(rng, L, 4),
    };
  }
  if (d === 4 || (d === 6 && rng.chance(0.4))) {
    const h = d === 4 ? fitStack(rng, { rows: [2, 3], cols: [3], maxH: 4, tot: [10, 26], hid: [1, 8] }) : fitStack(rng, { rows: [3, 4], cols: [4], maxH: 5, tot: [24, 60], hid: [4, 20] });
    const H = Math.max(...h.flat()); const sizes = Array.from({ length: H }, (_, i) => layerSize(h, i + 1)); const n = total(h);
    return {
      prompt: `${RULE} Count layer by layer. How many cubes are in the stack?`,
      expression: 'cubes in the stack = ?', answer: n, difficulty: d as Difficulty,
      hint: 'The bottom layer has one cube under every tower. Then count the towers that reach each layer above it.',
      steps: [
        'A tower has a cube in a layer when it is tall enough to reach it.',
        ...sizes.map((s, i) => `${cap(ORD[i])} layer: ${labn(s, 'cube')}.`),
        `${sizes.map((s, i) => lab(s, `${unitWord(s)} in the ${ORD[i]} layer`)).join(' + ')} = ${lab(n, 'cubes in all')}.`,
        `Check tower by tower: ${byRows(h)[byRows(h).length - 1]}`,
      ],
      visual: iso(h), solutionVisual: iso(h, { ghost: true }),
    };
  }
  // Grade 5: a stack built by a rule, drawn whole and pulled apart into its layers; how many cubes with more layers?
  const fam = FAMILIES[rng.pick(['square', 'stair', 'rect', 'ell'] as const)];
  const k = rng.pick([3, 4]);
  // a 3-layer staircase grown to 4 layers is the lesson's worked example (l.blocks-3), so the tries go further
  const m = d === 5 ? k + (fam === FAMILIES.stair && k === 3 ? rng.int(2, 3) : rng.int(1, 3)) : rng.int(k + 2, 8);
  const S = (j: number) => Array.from({ length: j }, (_, i) => fam.size(i + 1)).reduce((a, b) => a + b, 0);
  const terms = (j: number) => Array.from({ length: j }, (_, i) => labn(fam.size(i + 1), 'cube'));
  const ans = S(m); const shown = Math.min(m, 6);
  return {
    prompt: `Every cube sits on the floor or on another cube. This stack has ${k} layers, and under it the same layers are pulled apart. ${fam.what} How many cubes would a stack built the same way with ${m} layers need?`,
    expression: `cubes for ${m} layers = ?`, answer: ans, difficulty: d as Difficulty,
    hint: 'Count the cubes in each pulled-apart layer, from the top; in the stack, some of them hide under the layer above. Find the pattern, then keep it going.',
    steps: [
      `From the top, the layers hold ${terms(k).join(', ')}: ${fam.kind}.`,
      ...Array.from({ length: m - k }, (_, j) => `The ${NTH[k + j]} layer: ${fam.grow(k + j + 1)}.`),
      `${terms(m).join(' + ')} = ${lab(ans, 'cubes in all')}.`,
      ...(shown < m ? [`The worked picture shows the first ${lab(shown, 'layers')}, pulled apart.`] : []),
    ],
    visual: iso(familyStack(fam, k), { layers: true }), solutionVisual: iso(familyStack(fam, shown), { layers: true, ghost: true }),
    // a layer or two too few or too many: the totals for other numbers of layers
    choices: d === 5 ? windowChoices(rng, S, m, 5) : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Fill the box (Grades 3, 5)                                           */
/* ------------------------------------------------------------------ */

function fillQ(d: number, rng: Rng): ContestSpec {
  if (d === 6 && rng.chance(0.4)) {
    // make a solid cube: a block already sits in the corner of the frame
    const n = rng.pick([3, 4, 5]);
    const draw = () => [rng.int(2, n), rng.int(2, n), rng.int(1, n)];
    let [a, b, c] = draw();
    for (let t = 0; t < 20 && a === n && b === n && c === n; t++) [a, b, c] = draw();
    if (a === n && b === n && c === n) c = n - 1;
    const h: Grid = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, col) => (r < b && col < a ? c : 0)));
    const full = n ** 3, ex = a * b * c, ans = full - ex;
    return {
      prompt: `You want a solid cube, ${n} cubes long, ${n} wide and ${n} tall. This block sits in the corner of the frame. How many more cubes do you need?`,
      expression: 'more cubes = ?', answer: ans, difficulty: 6,
      hint: 'How many cubes make the whole big cube? How many are in the block already?',
      steps: [
        `The solid cube needs ${lab(n, 'cubes long')} × ${lab(n, 'cubes wide')} × ${lab(n, 'cubes tall')} = ${lab(full, 'cubes')}.`,
        `The block is ${lab(a, a === 1 ? 'cube long' : 'cubes long')} × ${lab(b, b === 1 ? 'cube wide' : 'cubes wide')} × ${lab(c, c === 1 ? 'cube tall' : 'cubes tall')} = ${lab(ex, 'cubes')}.`,
        `${lab(full, 'cubes in the big cube')} − ${lab(ex, 'cubes in the block')} = ${lab(ans, 'more cubes')}.`,
      ],
      visual: iso(h, { box: n }), solutionVisual: iso(h, { box: n, ghost: true }),
    };
  }
  const dims = {
    3: { L: [2, 5], W: [2, 3], H: [2, 4] }, 4: { L: [3, 5], W: [2, 4], H: [3, 4] },
    5: { L: [3, 5], W: [3, 4], H: [3, 4] }, 6: { L: [4, 6], W: [3, 5], H: [3, 5] },
  }[d as 3 | 4 | 5 | 6];
  // whole layers (k), then whole rows from the back (j), then cubes from the left of the next row (i). Grade 3: at least
  // 4 rows still missing, so the answer can sit on any of the 4 buttons (a row apart), and never the box lesson
  // l.blocks-2 works out (3 long, 2 wide, 3 tall, one layer in)
  let L = 0, W = 0, H = 0, k = 0, j = 0, i = 0;
  for (let t = 0; t < 60; t++) {
    L = rng.int(dims.L[0], dims.L[1]); W = rng.int(dims.W[0], dims.W[1]); H = rng.int(dims.H[0], dims.H[1]);
    k = d === 3 ? rng.int(1, H - 1) : rng.int(1, H - (d === 4 ? 1 : 2));
    j = rng.int(d === 4 ? 1 : 0, W - 1);
    i = d >= 5 ? rng.int(1, L - 1) : 0;
    if (d !== 3 || (W * (H - k) - j >= 4 && !(L === 3 && W === 2 && H === 3 && k === 1 && j === 0))) break;
  }
  const h: Grid = Array.from({ length: W }, (_, r) => Array.from({ length: L }, (_, c) => k + (r < j ? 1 : 0) + (r === j && c < i ? 1 : 0)));
  const layer = L * W, full = layer * H, ex = total(h), ans = full - ex;
  const parts = [k === 1 ? lab(layer, 'cubes in the full layer') : `${lab(k, 'full layers')} × ${lab(layer, 'cubes in a layer')}`];
  if (j) parts.push(j === 1 ? lab(L, 'cubes in the full row') : `${lab(j, 'full rows')} × ${lab(L, 'cubes in a row')}`);
  if (i) parts.push(labn(i, 'more cube', 'more cubes'));
  return {
    prompt: `The box is ${L} cubes long, ${W} cubes wide and ${H} cubes tall. How many more cubes will fill it?`,
    expression: 'more cubes = ?', answer: ans, difficulty: d as Difficulty,
    hint: 'How many cubes does a full box hold? Take away the cubes that are already in it.',
    steps: [
      `One layer is ${lab(L, 'cubes long')} × ${lab(W, 'cubes wide')} = ${lab(layer, 'cubes')}.`,
      `A full box holds ${lab(layer, 'cubes in a layer')} × ${lab(H, 'layers')} = ${lab(full, 'cubes')}.`,
      `In the box now: ${parts.length > 1 || k > 1 ? `${parts.join(' + ')} = ` : ''}${lab(ex, 'cubes')}.`,
      `${lab(full, 'cubes when full')} − ${lab(ex, 'cubes in the box')} = ${lab(ans, 'more cubes')}.`,
    ],
    visual: iso(h, { box: H }), solutionVisual: iso(h, { box: H, ghost: true }),
    // a row of the box (or two) miscounted, one way or the other
    choices: d === 3 || d === 5 ? windowChoices(rng, (x) => ans + (x * L), 0, d === 3 ? 4 : 5) : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Painted cubes (Grade 5)                                              */
/* ------------------------------------------------------------------ */

/** How many small cubes of an n × n × n cube have exactly `faces` painted faces; 'some' = at least one, 'two+' = at least two. */
export const paintedCount = (n: number, faces: 0 | 1 | 2 | 3 | 'some' | 'two+') =>
  faces === 3 ? 8 : faces === 2 ? 12 * (n - 2) : faces === 1 ? 6 * (n - 2) ** 2 : faces === 0 ? (n - 2) ** 3 : faces === 'two+' ? 8 + 12 * (n - 2) : n ** 3 - (n - 2) ** 3;

/**
 * Buttons for "exactly 3 / 2 / 1 / 0 painted faces": the four counts (corners, edges, faces, inside), so the child must
 * know which small cubes the question means, and one slip in working out a count, drawn from any of the four kinds (not
 * from the asked one), so no button stands out: the corners counted face by face (6 × 4) or on one face (4), the
 * corners left in an edge (12 × n or 12 × (n − 1)), whole faces or faces short by a row (6 × n × n, 6 × (n − 1) × (n − 1))
 * or with the bottom left out (5 × (n − 2) × (n − 2)), one side peeled off ((n − 1)³), (n − 2) + (n − 2) + (n − 2)
 * instead of (n − 2) × (n − 2) × (n − 2), every small cube (n³).
 */
function paintChoices(rng: Rng, n: number): QuestionChoice[] {
  const m = n - 2; const kinds = ([3, 2, 1, 0] as const).map((f) => paintedCount(n, f));
  const slips = rng.pick([[24, 4], [12 * n, 12 * (n - 1)], [6 * n * n, 6 * (n - 1) ** 2, 5 * m * m], [(n - 1) ** 3, 3 * m, n ** 3]]);
  const extra = rng.pick(slips.filter((v) => !kinds.includes(v)));
  return choicesFrom([...new Set(kinds), extra].sort((a, b) => a - b));
}

function paintedQ(d: number, rng: Rng): ContestSpec {
  // Grade 5 tap play uses bigger cubes than the lessons work out (3 and 4), each with four different counts
  const n = d === 5 ? rng.pick([5, 6, 7]) : rng.pick([3, 4, 5, 6]);
  const ask = d === 5 ? rng.pick([3, 2, 1, 0] as const) : rng.pick([2, 1, 0, 'some', 'two+'] as const);
  const m = n - 2; const ans = paintedCount(n, ask);
  const [c3, c2, c1, c0] = [paintedCount(n, 3), paintedCount(n, 2), paintedCount(n, 1), paintedCount(n, 0)];
  const question = ask === 'some' ? 'How many small cubes have paint on at least one face?'
    : ask === 'two+' ? 'How many small cubes have paint on at least two faces?'
      : ask === 0 ? 'How many small cubes have no paint at all?' : `How many small cubes have paint on exactly ${ask} ${ask === 1 ? 'face' : 'faces'}?`;
  const cu = (v: number) => labn(v, 'cube');
  const edges = [`Each edge has ${lab(n, 'cubes')} − ${lab(2, 'corner cubes')} = ${labn(m, 'edge cube')}.`, `A cube has ${lab(12, 'edges')}: ${lab(12, 'edges')} × ${labn(m, 'cube on each edge', 'cubes on each edge')} = ${lab(c2, 'small cubes')}.`];
  const why: Record<string, string[]> = {
    3: ['Only a corner cube touches 3 painted faces.', `A cube has ${lab(8, 'corners')}, so ${lab(8, 'small cubes')} have 3 painted faces, whatever the size.`],
    2: ['A cube with 2 painted faces sits on an edge, but not at a corner.', ...edges],
    1: ['A cube with 1 painted face sits in the middle of a face, away from the edges.', `Each face has a middle square of ${cu(m)} × ${cu(m)} = ${labn(m * m, 'cube on each face', 'cubes on each face')}.`, `A cube has ${lab(6, 'faces')}: ${lab(6, 'faces')} × ${labn(m * m, 'cube on each face', 'cubes on each face')} = ${lab(c1, 'small cubes')}.`],
    0: ['The cubes with no paint are inside, away from every face.', `Peel off the outside layer. What is left is a cube with ${cu(m)} along each edge: ${cu(m)} × ${cu(m)} × ${cu(m)} = ${labn(c0, 'inside cube')}.`],
    some: [`All the small cubes: ${cu(n)} × ${cu(n)} × ${cu(n)} = ${lab(n ** 3, 'small cubes')}.`, `The unpainted ones are inside: ${cu(m)} × ${cu(m)} × ${cu(m)} = ${labn(c0, 'inside cube')}.`, `${lab(n ** 3, 'small cubes')} − ${labn(c0, 'inside cube')} = ${lab(ans, 'cubes with paint')}.`],
    'two+': ['A cube with 2 or 3 painted faces sits on an edge of the big cube: the corner cubes have 3 painted faces, and the cubes between two corners have 2.', `Corners: ${lab(8, 'small cubes')}.`, ...edges, `${lab(8, 'corner cubes')} + ${lab(c2, 'edge cubes')} = ${lab(ans, 'small cubes')}.`],
  };
  return {
    prompt: `A big cube is built from small cubes, ${n} along each edge. Its whole outside is painted, even the bottom. Then it is taken apart into the small cubes. ${question}`,
    expression: 'small cubes = ?', answer: ans, difficulty: d as Difficulty,
    hint: ask === 'some' ? 'Which small cubes get no paint at all? Count all the cubes and take those away.' : 'Think about where such a cube sits: on a corner, along an edge, in the middle of a face, or hidden inside.',
    steps: [...why[String(ask)], `Check: ${lab(c3, 'corner cubes')} + ${lab(c2, 'edge cubes')} + ${lab(c1, 'face cubes')} + ${labn(c0, 'inside cube')} = ${lab(n ** 3, 'small cubes')}, every small cube once.`],
    visual: { type: 'paintcube', n }, solutionVisual: { type: 'paintcube', n, cut: true },
    choices: d === 5 ? paintChoices(rng, n) : undefined,
  };
}

/* ------------------------------------------------------------------ */

const MAKERS: Record<Kind, (d: number, rng: Rng) => ContestSpec> = { count: countQ, hidden: hiddenQ, layers: layersQ, fill: fillQ, painted: paintedQ };

export function blocksQuestion(kind: BlocksKind, d: Difficulty, rng: Rng, skillId?: string): Question {
  const grade = gradeOf(d);
  const fits = BLOCKS_KINDS.filter((x) => x.id !== 'all' && BLOCKS_KIND_GRADES[x.id]?.includes(grade)).map((x) => x.id as Kind);
  const k: Kind = kind === 'all' || !MAKERS[kind as Kind] ? rng.pick(fits.length ? fits : ['count']) : (kind as Kind);
  const sid = skillId ?? (kind === 'all' ? 'blocks' : `blocks.${k}`);
  const [lo, hi] = BAND[k];
  const spec = MAKERS[k](Math.min(hi, Math.max(lo, d)), rng);
  return contestQuestion('blocks', BLOCKS_META.topic, sid, BLOCKS_KINDS.find((x) => x.id === k)?.label ?? 'Mixed', { ...spec, difficulty: d, app: APP });
}
export const genBlocks: Generator = (skillId, params, ctx) => blocksQuestion(String(params?.kind ?? 'all') as BlocksKind, ctx.difficulty, ctx.rng, skillId);
