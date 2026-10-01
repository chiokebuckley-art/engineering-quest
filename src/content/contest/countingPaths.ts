import type { LessonDef } from '../lessons';
import type { ContestVisual } from '../../engine/contest/visuals';

/** Counting Paths lessons (Contest Path). Teach-card standard: worked numbers on the picture, then a Try next. */

const HATS = { label: 'Hats', items: [{ name: 'red hat', icon: 'hat', color: 'red' }, { name: 'blue hat', icon: 'hat', color: 'blue' }] } as const;
const SHIRTS = { label: 'Shirts', items: [{ name: 'green shirt', icon: 'shirt', color: 'green' }, { name: 'yellow shirt', icon: 'shirt', color: 'yellow' }, { name: 'purple shirt', icon: 'shirt', color: 'purple' }] } as const;
const SHOES = { label: 'Shoes', items: [{ name: 'orange shoes', icon: 'shoe', color: 'orange' }, { name: 'purple shoes', icon: 'shoe', color: 'purple' }] } as const;
const outfits = (tree: boolean): ContestVisual => ({ type: 'menu', groups: [{ ...HATS, items: [...HATS.items] }, { ...SHIRTS, items: [...SHIRTS.items] }], ...(tree ? { tree } : {}) });
const FRIENDS3 = [{ name: 'Ana', icon: 'person', color: 'red' }, { name: 'Ben', icon: 'person', color: 'blue' }, { name: 'Cy', icon: 'person', color: 'green' }] as const;
const FRIENDS4 = [...FRIENDS3, { name: 'Dot', icon: 'person', color: 'purple' }] as const;
const FIVE = [...FRIENDS4, { name: 'Eli', icon: 'person', color: 'orange' }] as const;
const LUNCH: ContestVisual = {
  type: 'menu', groups: [
    { label: 'Mains', items: [{ name: 'sandwich', icon: 'sandwich' }, { name: 'pizza', icon: 'pizza' }, { name: 'fish', icon: 'fish', color: 'orange' }] },
    { label: 'Drinks', items: [{ name: 'orange juice', icon: 'juice', color: 'orange' }, { name: 'lemonade', icon: 'juice', color: 'yellow' }, { name: 'grape juice', icon: 'juice', color: 'purple' }] },
    { label: 'Snacks', items: [{ name: 'cookie', icon: 'cookie' }, { name: 'red apple', icon: 'apple', color: 'red' }] },
  ],
};

export const PATHS_LESSONS: LessonDef[] = [
  {
    id: 'l.paths-1', title: 'Count the outfits', teacher: 'vector', skillId: 'paths.outfits', minutes: 6, group: 'Counting Paths',
    summary: 'List the outfits hat by hat, so you miss none and count none twice. Each hat makes the same number, so add (or multiply).',
    steps: [
      {
        type: 'say', speaker: 'vector', text: 'Mia has 2 hats and 3 shirts. She wears 1 hat and 1 shirt. How many different outfits can she make? Let us list them, hat by hat.',
        visual: outfits(false), caption: '2 hats, 3 shirts',
      },
      {
        type: 'say', speaker: 'vector', text: 'Red hat with the green, yellow or purple shirt: 3 (outfits). Blue hat: 3 (outfits) too. So 3 (outfits) + 3 (outfits) = 6 (outfits). The tree gives every outfit its own row.',
        visual: outfits(true), caption: 'One branch for each hat, one row for each outfit',
      },
      { type: 'try', speaker: 'vector', intro: 'Take one hat. How many shirts can go with it? Then the next hat.', skillId: 'paths.outfits', difficulty: 1, count: 3 },
      {
        type: 'say', speaker: 'vector', text: 'Every hat makes the same number of outfits, so there is a shortcut: 2 (hats) × 3 (shirts) = 6 (outfits). Add shoes and every outfit splits again: 6 (hat-and-shirt pairs) × 2 (pairs of shoes) = 12 (outfits).',
        visual: { type: 'menu', groups: [{ ...HATS, items: [...HATS.items] }, { ...SHIRTS, items: [...SHIRTS.items] }, { ...SHOES, items: [...SHOES.items] }] }, caption: 'Hats × shirts × shoes',
      },
      { type: 'try', speaker: 'vector', intro: 'Count the hat-and-shirt pairs, then bring in the shoes.', skillId: 'paths.outfits', difficulty: 3, count: 3 },
      { type: 'summary', speaker: 'vector', points: ['List the ways in order: first hat, then the next hat.', 'Each hat makes the same number of outfits.', 'Add the equal groups, or multiply: hats × shirts × shoes.'] },
    ],
  },
  {
    id: 'l.paths-2', title: 'Line-ups, menus and street routes', teacher: 'vector', skillId: 'paths.grid', minutes: 8, group: 'Counting Paths',
    summary: 'Fill a line-up one place at a time. Pick one from each menu group and multiply. On a street grid, add the ways from below and from the left.',
    recommendedAfter: [{ skillId: 'paths.outfits', mastery: 50 }],
    steps: [
      {
        type: 'say', speaker: 'vector', text: 'Ana, Ben and Cy line up for a photo. Who stands first? Any of the 3 (friends). With Ana first, Ben and Cy can swap: Ana, Ben, Cy or Ana, Cy, Ben. That is 2 (orders).',
        visual: { type: 'lineup', items: [...FRIENDS3], mode: 'row', places: ['1st', '2nd', '3rd'] }, caption: 'Fill the places one at a time',
      },
      {
        type: 'say', speaker: 'vector', text: 'Each friend can stand first, and each time the other two make 2 (orders): 2 (orders) + 2 (orders) + 2 (orders) = 6 (orders). Or: 3 (choices for first) × 2 (choices for second) × 1 (choice for last) = 6 (orders).',
        visual: { type: 'lineup', items: [...FRIENDS3], mode: 'row', places: ['1st', '2nd', '3rd'], fixed: [0, 0] }, caption: 'Ana first: the other two can swap',
      },
      { type: 'try', speaker: 'vector', intro: 'Pick who stands first, then list the rest.', skillId: 'paths.orders', difficulty: 3, count: 3 },
      {
        type: 'say', speaker: 'vector', text: 'A lunch is 1 main, 1 drink and 1 snack. Each main goes with each drink: 3 (mains) × 3 (drinks) = 9 (main-and-drink pairs). Each pair goes with each snack: 9 (main-and-drink pairs) × 2 (snacks) = 18 (lunches).',
        visual: LUNCH, caption: 'One from each group',
      },
      { type: 'try', speaker: 'vector', intro: 'One from each group: multiply.', skillId: 'paths.menus', difficulty: 3, count: 3 },
      {
        type: 'say', speaker: 'vector', text: 'Robo drives from Start to Finish, only up or right. Every route makes 2 (moves right) and 2 (moves up), just in a different order. The teal line is one of them.',
        visual: { type: 'gridpath', w: 2, h: 2, path: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]] }, caption: 'One route in teal',
      },
      {
        type: 'say', speaker: 'vector', text: 'Write in each corner how many ways reach it. Robo can only come from below or from the left, so add those: 1 (from below) + 1 (from the left) = 2 (ways). Keep going, and Finish gets 3 (from below) + 3 (from the left) = 6 (routes).',
        visual: { type: 'gridpath', w: 2, h: 2, counts: true }, caption: 'Add from below and from the left',
      },
      { type: 'try', speaker: 'vector', intro: 'List the routes, or add the ways into each corner.', skillId: 'paths.grid', difficulty: 4, count: 3 },
      { type: 'summary', speaker: 'vector', points: ['Line-ups: fill one place at a time; the choices shrink by one each place.', 'Menus: one from each group, so multiply the group sizes.', 'Grid routes: ways into a corner = ways from below + ways from the left.'] },
    ],
  },
  {
    id: 'l.paths-3', title: 'Contest counting: pairs, blocks and rules', teacher: 'newton', skillId: 'paths.pairs', minutes: 10, group: 'Counting Paths',
    summary: 'Halve when every pair is counted twice. Glue friends who stand together into a block. A blocked corner gets 0. Count all, then take away what a rule bans.',
    recommendedAfter: [{ skillId: 'paths.grid', mastery: 50 }],
    steps: [
      {
        type: 'say', speaker: 'newton', text: '5 friends meet, and each shakes hands with every other friend once. Ana shakes 4 (hands). Ben has met Ana already, so 3 (new ones), then Cy 2 (new ones), then Dot 1 (new one): 4 (for Ana) + 3 (new for Ben) + 2 (new for Cy) + 1 (new for Dot) = 10 (handshakes).',
        visual: { type: 'lineup', items: [...FIVE], mode: 'pairs' }, caption: 'Who shakes hands with whom?',
      },
      {
        type: 'say', speaker: 'newton', text: 'The shortcut: 5 (friends) × 4 (others each) = 20 (counted twice), because Ana with Ben and Ben with Ana are the same handshake. So 20 (counted twice) ÷ 2 (times each pair is counted) = 10 (handshakes). Count the lines: 10 (lines).',
        visual: { type: 'lineup', items: [...FIVE], mode: 'pairs', lines: true }, caption: 'Every pair joined once',
      },
      { type: 'try', speaker: 'newton', intro: 'Count from the first person, or multiply and halve.', skillId: 'paths.pairs', difficulty: 5, count: 3 },
      {
        type: 'say', speaker: 'newton', text: 'Ana, Ben, Cy and Dot line up, and Ben and Cy must stand together. Glue them into one block: now 3 (things) line up in 3 (choices for first) × 2 (choices for second) × 1 (choice for last) = 6 (block orders). Inside the block it is Ben then Cy, or Cy then Ben: 2 (ways). 6 (block orders) × 2 (ways inside the block) = 12 (orders).',
        visual: { type: 'lineup', items: [...FRIENDS4], mode: 'row', places: ['1st', '2nd', '3rd', '4th'], together: [1, 2] }, caption: 'Two who must stand together make one block',
      },
      { type: 'try', speaker: 'newton', intro: 'Choices shrink by one each place. Glue a pair into a block.', skillId: 'paths.orders', difficulty: 5, count: 3 },
      {
        type: 'say', speaker: 'newton', text: 'A ✕ corner is closed, so it gets 0 (ways) and passes nothing on. Add from below and from the left as usual, and Finish gets 2 (from below) + 2 (from the left) = 4 (routes), down from 10 (routes) with no ✕.',
        visual: { type: 'gridpath', w: 3, h: 2, blocked: [[1, 1]], counts: true }, caption: 'A closed corner passes on 0 (ways)',
      },
      { type: 'try', speaker: 'newton', intro: 'Write the ways into every corner. A ✕ gets 0 (ways).', skillId: 'paths.grid', difficulty: 5, count: 3 },
      {
        type: 'say', speaker: 'newton', text: 'All lunches: 3 (mains) × 3 (drinks) × 2 (snacks) = 18 (lunches). Now a rule: the café never serves pizza with orange juice. Those lunches are 1 (pizza) × 1 (orange juice) × 2 (snacks) = 2 (lunches). Take them away: 18 (lunches) − 2 (banned lunches) = 16 (lunches).',
        visual: LUNCH, caption: 'Count all, then take away what the rule bans',
      },
      { type: 'try', speaker: 'newton', intro: 'Count everything first, then take away what the rule bans.', skillId: 'paths.menus', difficulty: 5, count: 3 },
      { type: 'summary', speaker: 'newton', points: ['Everyone with everyone: n × (n − 1), then halve, because each pair was counted twice.', 'Two who must stand together: glue them into a block, then × 2 (ways inside the block).', 'A blocked corner gets 0 (ways).', 'With a rule: count all, then take away the banned ones (and add back anything taken away twice).'] },
    ],
  },
];
