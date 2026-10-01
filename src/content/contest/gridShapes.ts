import type { LessonDef } from '../lessons';
import type { Visual } from '../../engine/types';

/** Mirror & Grid lessons (Contest Path). Teach-card standard: worked numbers on the picture, then a Try next. */
const GROUP = 'Mirror & Grid';
type Cell = [number, number];
type Spec = ['tri-s' | 'tri-m' | 'tri-l' | 'square' | 'para', number, number, 0 | 90 | 180 | 270];

/** Lesson 1: half a picture beside a mirror line (5 squares on the left; Grade 1 practice halves have at most 4, so a try never repeats it). */
const HALF: Cell[] = [[0, 3], [1, 3], [2, 3], [2, 2], [2, 1]];
const TWINS: Cell[] = [[5, 3], [4, 3], [3, 3], [3, 2], [3, 1]];
/** Lesson 1: a shape to count row by row: 3 + 4 + 2 = 9 squares. */
const NINE: Cell[] = [[1, 3], [2, 3], [3, 3], [0, 2], [1, 2], [2, 2], [3, 2], [1, 1], [2, 1]];
/**
 * Lesson 1: a tree of pieces: two large triangles for the top and two squares for the trunk (4 + 4 + 2 + 2 = 12 small
 * triangles). The practice pictures (house, rocket, cat, boat, arrow, fish) never draw it, so a try never repeats it.
 */
const TREE: Spec[] = [['tri-l', 0, 1, 90], ['tri-l', 2, 1, 0], ['square', 1, 0, 0], ['square', 2, 0, 0]];
const tan = (specs: Spec[], extra: Partial<Extract<Visual, { type: 'tangram' }>> = {}): Visual => ({
  type: 'tangram', pieces: specs.map(([kind, x, y, rot], i) => ({ kind, x, y, rot, color: (['blue', 'green', 'red', 'purple'] as const)[i % 4] })), ...extra,
});
const rect = (x: number, y: number, w: number, h: number): Cell[] => { const out: Cell[] = []; for (let r = y; r < y + h; r++) for (let c = x; c < x + w; c++) out.push([c, r]); return out; };
const minus = (a: Cell[], b: Cell[]) => a.filter(([c, r]) => !b.some(([x, y]) => x === c && y === r));

/**
 * Lesson 2: an L-shape, 7 squares wide and 4 tall with a 2 by 2 corner cut away: perimeter 22, area 24. Grade 3
 * practice shapes are at most 6 squares wide, so a try never repeats it.
 */
const L7 = minus(rect(0, 0, 7, 4), rect(5, 2, 2, 2));
const L7_SIDES = [
  { a: [0, 0], b: [7, 0], text: '7' }, { a: [7, 0], b: [7, 2], text: '2' }, { a: [7, 2], b: [5, 2], text: '2' },
  { a: [5, 2], b: [5, 4], text: '2' }, { a: [5, 4], b: [0, 4], text: '5' }, { a: [0, 4], b: [0, 0], text: '4' },
] as { a: [number, number]; b: [number, number]; text: string }[];
/** Lesson 2: an arrow pointing up, 5 squares wide and 5 tall (bigger than any Grade 3 practice shape, so a try never repeats it). */
const ARROW: Cell[] = [[3, 5], [2, 4], [3, 4], [4, 4], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [3, 2], [3, 1]];

/** Lesson 3: a 12 m by 8 m floor with a 5 m by 3 m corner cut away (area 81, perimeter 40). */
const FLOOR = minus(rect(0, 0, 12, 8), rect(7, 5, 5, 3));
const FLOOR_SIDES = (top: string, inner: string) => [
  { a: [0, 0], b: [12, 0], text: '12 m' }, { a: [12, 0], b: [12, 5], text: '5 m' }, { a: [12, 5], b: [7, 5], text: inner },
  { a: [7, 5], b: [7, 8], text: '3 m' }, { a: [7, 8], b: [0, 8], text: top }, { a: [0, 8], b: [0, 0], text: '8 m' },
] as { a: [number, number]; b: [number, number]; text: string }[];
/** Lesson 3: a triangle with its bottom side along its box and its top corner on the box's top: half of the 6 by 4 box. */
const TRI: [number, number][] = [[1, 1], [7, 1], [3, 5]];
const TRI_BOX: [[number, number], [number, number]][] = [[[1, 1], [7, 1]], [[7, 1], [7, 5]], [[7, 5], [1, 5]], [[1, 5], [1, 1]], [[3, 1], [3, 5]]];
const HEX: [number, number][] = [[5.4, 2.5], [4.2, 4.5785], [1.8, 4.5785], [0.6, 2.5], [1.8, 0.4215], [4.2, 0.4215]];

export const GRID_LESSONS: LessonDef[] = [
  {
    id: 'l.grid-1', title: 'Mirrors, squares and pieces', teacher: 'vector', skillId: 'grid.mirror', minutes: 7, group: GROUP,
    summary: 'Finish a mirror picture, count the squares that cover a shape, and see small triangles inside bigger pieces.',
    steps: [
      { type: 'say', speaker: 'vector', text: 'This dashed line is a mirror. Each gold square has a twin on the other side. The twin is just as far from the line.', visual: { type: 'gridshape', w: 6, h: 5, cells: HALF, axis: { dir: 'v', at: 3 }, ask: 'mirror' }, caption: 'Half a picture and a mirror line' },
      { type: 'say', speaker: 'vector', text: 'Count the gold squares: 5 (squares). So we shade 5 (twins). A square next to the line has a twin next to it too. A square two steps away has a twin two steps away.', visual: { type: 'gridshape', w: 6, h: 5, cells: HALF, axis: { dir: 'v', at: 3 }, ghost: TWINS }, caption: 'The pink squares are the twins' },
      { type: 'try', speaker: 'vector', intro: 'Find each square\'s twin across the line.', skillId: 'grid.mirror', difficulty: 1, count: 3 },
      { type: 'say', speaker: 'vector', text: 'Area is how many squares cover a shape. Count one row at a time: 3 (squares) + 4 (squares) + 2 (squares) = 9 (squares).', visual: { type: 'gridshape', w: 5, h: 5, cells: NINE, count: true }, caption: 'Each square counted once' },
      { type: 'try', speaker: 'vector', intro: 'Count row by row. Touch each square once.', skillId: 'grid.area', difficulty: 2, count: 3 },
      { type: 'say', speaker: 'vector', text: 'This tree has 4 (pieces). Each piece is made of small triangles. A square is 2 (small triangles). A large triangle is 4 (small triangles). The tree is 4 (small triangles) + 4 (small triangles) + 2 (small triangles) + 2 (small triangles) = 12 (small triangles).', visual: tan(TREE, { marks: 'area' }), caption: 'Each number is a piece in small triangles' },
      { type: 'try', speaker: 'vector', intro: 'Count each piece once. To fill a gap, match its shape and its size.', skillId: 'grid.tangram', difficulty: 1, count: 3 },
      { type: 'summary', speaker: 'vector', points: ['A mirror twin is just as far from the line.', 'Area: count the squares, one row at a time.', 'Two small triangles make a square; four make a large triangle.'] },
    ],
  },
  {
    id: 'l.grid-2', title: 'Around the edge and folding in half', teacher: 'vector', skillId: 'grid.perimeter', minutes: 7, group: GROUP,
    summary: 'Walk around a shape to find its perimeter, and fold shapes in your head to find lines of symmetry.',
    recommendedAfter: [{ skillId: 'grid.area', mastery: 40 }],
    steps: [
      { type: 'say', speaker: 'vector', text: 'Perimeter is the walk around the outside. Each square is 1 cm on a side. Start at the bottom-left corner and count the edges along each straight side.', visual: { type: 'gridshape', w: 7, h: 4, cells: L7, ask: 'perimeter' }, caption: 'Walk along the bold edge' },
      { type: 'say', speaker: 'vector', text: 'Going round: 7 (cm) + 2 (cm) + 2 (cm) + 2 (cm) + 5 (cm) + 4 (cm) = 22 (cm). Edges between two gold squares are inside, so they do not count. The area is different: 24 (squares).', visual: { type: 'gridshape', w: 7, h: 4, cells: L7, ask: 'perimeter', sides: L7_SIDES }, caption: 'Each side labelled with its length' },
      { type: 'try', speaker: 'vector', intro: 'Walk around and count each outside edge once.', skillId: 'grid.perimeter', difficulty: 3, count: 3 },
      { type: 'say', speaker: 'vector', text: 'A line of symmetry is a fold that lands one half exactly on the other. Fold this arrow on the up-and-down line: the halves match. Try the side-to-side line: the point lands on the stem, so that fold misses. The slanted folds miss too. That makes 1 (line of symmetry).', visual: { type: 'gridshape', w: 7, h: 7, cells: ARROW, ask: 'lines', lines: [[[3.5, 0.4], [3.5, 6.6]]] }, caption: 'The dashed line is the fold that works' },
      { type: 'try', speaker: 'vector', intro: 'Try the up-and-down line, the side-to-side line and both diagonals.', skillId: 'grid.lines', difficulty: 3, count: 3 },
      { type: 'summary', speaker: 'vector', points: ['Perimeter: walk around once, count every outside edge.', 'Area and perimeter are different numbers.', 'A line of symmetry folds a shape onto itself.'] },
    ],
  },
  {
    id: 'l.grid-3', title: 'Composite shapes and missing sides', teacher: 'newton', skillId: 'grid.area', minutes: 8, group: GROUP,
    summary: 'Find the area of cut shapes, stairs and triangles on the grid, find missing sides from the opposite edges, and count the lines of a regular shape.',
    recommendedAfter: [{ skillId: 'grid.perimeter', mastery: 40 }],
    steps: [
      { type: 'say', speaker: 'newton', text: 'A floor plan: every corner is a square corner, lengths in metres. Fill in the cut-out corner to make one big rectangle: 12 (metres) × 8 (metres) = 96 (square metres).', visual: { type: 'gridshape', w: 12, h: 8, cells: FLOOR, plain: true, sides: FLOOR_SIDES('7 m', '5 m'), ask: 'area' }, caption: 'A rectangle with a corner cut away' },
      { type: 'say', speaker: 'newton', text: 'The cut-out is 5 (metres) × 3 (metres) = 15 (square metres). So the floor is 96 (square metres) − 15 (square metres) = 81 (square metres). Check by adding two rectangles: 12 (metres) × 5 (metres) + 7 (metres) × 3 (metres) = 81 (square metres).', visual: { type: 'gridshape', w: 12, h: 8, cells: FLOOR, plain: true, sides: FLOOR_SIDES('7 m', '5 m'), ghost: rect(7, 5, 5, 3) }, caption: 'The pink part is the cut-out' },
      { type: 'say', speaker: 'newton', text: 'Stairs: cut the shape into rectangles, one for each step, and add their areas. A triangle on the grid: draw its box, 6 (squares wide) × 4 (squares tall) = 24 (squares). The dashed line down from the top corner cuts the box into two rectangles, and the triangle is exactly half of each one. So the triangle is half the box: 24 (squares) ÷ 2 = 12 (squares).', visual: { type: 'gridshape', w: 8, h: 6, cells: [], poly: TRI, lines: TRI_BOX }, caption: 'A triangle is half of its box' },
      { type: 'try', speaker: 'newton', intro: 'Fill in and take away, cut into rectangles and add, or take half of a triangle\'s box.', skillId: 'grid.area', difficulty: 5, count: 3 },
      { type: 'say', speaker: 'newton', text: 'Missing sides. Seen from above, the top edges cover the bottom exactly: 12 (metres) − 5 (metres) = 7 (metres). So the perimeter is the same as the box around it: 2 × (12 (metres) + 8 (metres)) = 40 (metres).', visual: { type: 'gridshape', w: 12, h: 8, cells: FLOOR, plain: true, sides: FLOOR_SIDES('?', '5 m'), ask: 'perimeter' }, caption: 'Find the "?" before you walk around' },
      { type: 'try', speaker: 'newton', intro: 'Find the missing sides first.', skillId: 'grid.perimeter', difficulty: 5, count: 3 },
      { type: 'say', speaker: 'newton', text: 'A regular hexagon has 6 (equal sides). Lines from a corner to the opposite corner: 3 (lines). Lines from the middle of a side to the middle of the opposite side: 3 (lines). 3 (lines) + 3 (lines) = 6 (lines of symmetry).', visual: { type: 'gridshape', w: 6, h: 5, cells: [], poly: HEX, plain: true, lines: [[[0.06, 2.5], [5.94, 2.5]], [[1.53, -0.04], [4.47, 5.04]], [[4.47, -0.04], [1.53, 5.04]], [[3, -0.05], [3, 5.05]], [[0.45, 1.03], [5.55, 3.97]], [[0.45, 3.97], [5.55, 1.03]]] }, caption: 'Six folds that work' },
      { type: 'try', speaker: 'newton', intro: 'Fold through corners and through the middles of sides.', skillId: 'grid.lines', difficulty: 5, count: 3 },
      { type: 'summary', speaker: 'newton', points: ['Area of a cut shape: fill in the box and take away the cut-out, or cut it into rectangles and add.', 'A triangle with one side along its box is half of the box.', 'Missing sides: the top edges add up to the bottom edge.', 'A box-like shape has the perimeter of its box; a notch adds its two walls.', 'A regular shape has as many lines of symmetry as sides.'] },
    ],
  },
];
