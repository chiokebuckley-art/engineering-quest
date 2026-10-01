import type { LessonDef } from '../lessons';

/** Spatial Blocks lessons (Contest Path). Teach-card standard: worked numbers on the picture, then a Try next. */
const GROUP = 'Spatial Blocks';
const STAIR3 = [[3, 2, 1], [2, 1, 0], [1, 0, 0]];
const STAIR4 = [[4, 3, 2, 1], [3, 2, 1, 0], [2, 1, 0, 0], [1, 0, 0, 0]];

export const BLOCKS_LESSONS: LessonDef[] = [
  {
    id: 'l.blocks-1', title: 'Count every cube', teacher: 'vector', skillId: 'blocks.count', minutes: 6, group: GROUP,
    summary: 'Count a stack tower by tower, and find the cubes hiding underneath.',
    steps: [
      { type: 'say', speaker: 'vector', text: 'Here is a staircase of cubes. Count one tower at a time, from the top down to the floor.', visual: { type: 'iso', heights: [[3, 2, 1]] }, caption: 'Three towers in a row' },
      { type: 'say', speaker: 'vector', text: 'Tower by tower: 3 (cubes) + 2 (cubes) + 1 (cube) = 6 (cubes in all). Touch each cube once, so none is counted twice.', visual: { type: 'iso', heights: [[3, 2, 1]], ghost: true }, caption: 'Each number is how tall that tower is' },
      { type: 'say', speaker: 'vector', text: 'Tall does not always mean more. The tower has 5 (cubes). The low wall has 2 (cubes) + 2 (cubes) + 2 (cubes) = 6 (cubes). The wall wins!', visual: { type: 'iso', heights: [[5, 0, 2, 2, 2]] }, caption: 'A tall tower and a low wall' },
      { type: 'try', speaker: 'vector', intro: 'Count each tower. Touch each cube once.', skillId: 'blocks.count', difficulty: 1, count: 4 },
      { type: 'say', speaker: 'vector', text: 'Some cubes hide. Every cube sits on the floor or on another cube, so the top cube of the tall tower must stand on a cube you cannot see.', visual: { type: 'iso', heights: [[2, 1], [1, 1]] }, caption: 'Where is the hidden cube?' },
      { type: 'say', speaker: 'vector', text: 'You can see 4 (cubes). The back tower is 2 (cubes) tall, so 1 (cube) hides under its top. 4 (cubes you can see) + 1 (hidden cube) = 5 (cubes in all).', visual: { type: 'iso', heights: [[2, 1], [1, 1]], ghost: true }, caption: 'Towers lined up: the pink cube was hidden' },
      { type: 'try', speaker: 'vector', intro: 'Find each tower\'s top, then count down to the floor.', skillId: 'blocks.hidden', difficulty: 3, count: 3 },
      { type: 'summary', speaker: 'vector', points: ['Count tower by tower, top to floor.', 'Touch each cube once.', 'Tall does not always mean more.', 'A cube on top always has cubes under it, even hidden ones.'] },
    ],
  },
  {
    id: 'l.blocks-2', title: 'Layers and boxes', teacher: 'vector', skillId: 'blocks.layers', minutes: 7, group: GROUP,
    summary: 'Count a stack layer by layer, and find how many cubes a box still needs.',
    recommendedAfter: [{ skillId: 'blocks.count', mastery: 40 }],
    steps: [
      { type: 'say', speaker: 'vector', text: 'Count by layers. The bottom layer has one cube under every tower, even the ones you cannot see.', visual: { type: 'iso', heights: [[3, 2], [2, 1]] }, caption: 'Four towers in a corner' },
      { type: 'say', speaker: 'vector', text: 'Bottom layer: 4 (cubes), one per tower. Second layer: 3 (cubes), from the towers 2 or more tall. Third layer: 1 (cube). 4 (cubes) + 3 (cubes) + 1 (cube) = 8 (cubes in all).', visual: { type: 'iso', heights: [[1, 1], [1, 1]] }, caption: 'The bottom layer on its own' },
      { type: 'say', speaker: 'vector', text: 'Check tower by tower: 3 (cubes) + 2 (cubes) + 2 (cubes) + 1 (cube) = 8 (cubes). 2 (cubes) of the tall back tower are hidden behind its neighbours. Two ways, one answer.', visual: { type: 'iso', heights: [[3, 2], [2, 1]], ghost: true }, caption: 'Tower heights, with the 2 hidden cubes in pink' },
      { type: 'try', speaker: 'vector', intro: 'One cube per tower in the bottom layer.', skillId: 'blocks.layers', difficulty: 3, count: 3 },
      { type: 'say', speaker: 'vector', text: 'Now a box. It is 3 (cubes long), 2 (cubes wide) and 3 (cubes tall). One layer is already in it.', visual: { type: 'iso', heights: [[1, 1, 1], [1, 1, 1]], box: 3 }, caption: 'A box with one layer in it' },
      { type: 'say', speaker: 'vector', text: 'A full box holds 3 (cubes long) × 2 (cubes wide) × 3 (layers) = 18 (cubes). It has 6 (cubes) now. 18 (cubes when full) − 6 (cubes in the box) = 12 (more cubes).', visual: { type: 'iso', heights: [[1, 1, 1], [1, 1, 1]], box: 3, ghost: true }, caption: 'The pink cubes are still needed' },
      { type: 'try', speaker: 'vector', intro: 'Full box first, then take away what is there.', skillId: 'blocks.fill', difficulty: 3, count: 3 },
      { type: 'summary', speaker: 'vector', points: ['Bottom layer = one cube per tower.', 'Add the layers, or add the towers: same total.', 'Full box = long × wide × tall.', 'Still needed = full box − cubes already in.'] },
    ],
  },
  {
    id: 'l.blocks-3', title: 'Painted cubes and growing stacks', teacher: 'newton', skillId: 'blocks.painted', minutes: 8, group: GROUP,
    summary: 'Sort the small cubes of a painted cube by where they sit, and keep a stack pattern growing.',
    recommendedAfter: [{ skillId: 'blocks.layers', mastery: 40 }],
    steps: [
      { type: 'say', speaker: 'newton', text: 'A big cube is built from small cubes, 3 (cubes) along each edge: 3 (cubes) × 3 (cubes) × 3 (cubes) = 27 (small cubes). We paint its whole outside, even the bottom, then take it apart.', visual: { type: 'paintcube', n: 3 }, caption: 'Painted on the outside' },
      { type: 'say', speaker: 'newton', text: 'Where a cube sits tells you its paint. Corners: 3 painted faces, and a cube has 8 (corners). Edges without their corners: 2 painted faces, 12 (edges) × 1 (cube on each edge) = 12 (cubes). Face middles: 1 painted face, 6 (faces) × 1 (cube on each face) = 6 (cubes). The middle: 1 (cube) with no paint.', visual: { type: 'paintcube', n: 3, cut: true }, caption: 'Red 3 faces, yellow 2, teal 1, grey none' },
      { type: 'say', speaker: 'newton', text: 'With 4 (cubes) on each edge: each edge has 4 (cubes) − 2 (corners) = 2 (edge cubes), so 12 (edges) × 2 (edge cubes) = 24 (cubes with two painted faces). Each face has a middle of 2 (cubes) × 2 (cubes) = 4 (cubes), so 6 (faces) × 4 (middle cubes) = 24 (cubes with one painted face). Inside: 2 (cubes) × 2 (cubes) × 2 (cubes) = 8 (cubes). Check: 8 (corners) + 24 (edge cubes) + 24 (face cubes) + 8 (inside cubes) = 64 (small cubes).', visual: { type: 'paintcube', n: 4, cut: true }, caption: 'The same sorting on a bigger cube' },
      { type: 'try', speaker: 'newton', intro: 'Corner, edge, face or inside?', skillId: 'blocks.painted', difficulty: 5, count: 4 },
      { type: 'say', speaker: 'newton', text: 'A growing stack. In the stack, some cubes hide under the layer above, so pull the layers apart. From the top: 1 (cube), 3 (cubes), 6 (cubes). Each layer is a triangle with one more row, so the next layer holds 6 (cubes) + 4 (cubes in the new row) = 10 (cubes).', visual: { type: 'iso', heights: STAIR3, layers: true }, caption: 'A corner staircase, and its three layers pulled apart' },
      { type: 'say', speaker: 'newton', text: 'So a staircase with 4 (layers) needs 1 (cube) + 3 (cubes) + 6 (cubes) + 10 (cubes) = 20 (cubes). Count the pulled-apart layers, find the rule, then keep it going.', visual: { type: 'iso', heights: STAIR4, layers: true, ghost: true }, caption: 'Four layers: 1, 3, 6 and 10 cubes' },
      { type: 'try', speaker: 'newton', intro: 'Count each pulled-apart layer, find the rule, keep it going.', skillId: 'blocks.layers', difficulty: 5, count: 3 },
      { type: 'summary', speaker: 'newton', points: ['Corners always: 8 cubes with 3 painted faces.', 'Edges: 12 × (n − 2) cubes with 2.', 'Faces: 6 × (n − 2) × (n − 2) cubes with 1.', 'Inside: (n − 2) × (n − 2) × (n − 2) with none.', 'Growing stacks: count each layer, find the rule, keep going.'] },
    ],
  },
];
