import type { LessonDef } from '../lessons';
import type { Visual } from '../../engine/types';

/** Multi-step % lessons (Contest Path). Teach-card standard: worked numbers on the picture, then a Try next. */
const GROUP = 'Multi-step %';
type Step = { label: string; pct: number; kind: 'off' | 'on' | 'take' };
const bars = (start: number, unit: string, steps: Step[], extra: { reveal?: boolean; ask?: 'pct'; grid?: boolean } = {}): Visual => ({ type: 'pctsteps', start, unit, steps, ...extra });
const CLOAK: Step[] = [{ label: 'sale', pct: 25, kind: 'off' }, { label: 'tariff', pct: 10, kind: 'on' }];
const RIDERS: Step[] = [{ label: 'kids', pct: 40, kind: 'take' }, { label: 'red helmets', pct: 25, kind: 'take' }];

export const PCTMULTI_LESSONS: LessonDef[] = [
  {
    id: 'l.pctmulti-1', title: 'Percent means out of 100', teacher: 'vector', skillId: 'pctmulti.outof100', minutes: 6, group: GROUP,
    summary: 'Read a hundred grid as a percent, find the part that is left, and take a percent of 100 things.',
    steps: [
      { type: 'say', speaker: 'vector', text: 'This grid has 100 (squares). Percent means out of 100, so each square is 1% (one square) of the grid.', visual: bars(100, 'squares', [], { grid: true }), caption: '100 (squares) make 100% (the whole grid)' },
      { type: 'say', speaker: 'vector', text: 'Some squares are blue. Count the full rows of ten first: 3 (rows of ten) make 30 (squares), and 7 (more squares) make 37 (blue squares). 37 (blue squares) out of 100 (squares) = 37% (blue).', visual: bars(100, 'squares', [{ label: 'blue', pct: 37, kind: 'take' }], { grid: true, ask: 'pct', reveal: true }), caption: '37 (blue squares) out of 100 (squares) is 37% (blue)' },
      { type: 'say', speaker: 'vector', text: 'What part is NOT blue? 100 (squares) − 37 (blue squares) = 63 (squares not blue), so 63% (not blue). The two parts always make 100% (the whole grid).', visual: bars(100, 'squares', [{ label: 'not blue', pct: 63, kind: 'off' }], { grid: true, ask: 'pct', reveal: true }), caption: '37% (blue) and 63% (not blue) make 100% (the whole grid)' },
      { type: 'say', speaker: 'vector', text: 'Now the other way. A chest holds 100 (coins), and 25% (gold) of them are gold. With exactly 100 things, 25% (gold) of 100 (coins) = 25 (gold coins).', visual: bars(100, 'coins', [{ label: 'gold', pct: 25, kind: 'take' }], { reveal: true }), caption: 'The gold part is 25% (gold coins) of the bar' },
      { type: 'try', speaker: 'vector', intro: 'Percent means out of 100. Count the rows of ten.', skillId: 'pctmulti.outof100', difficulty: 3, count: 4 },
      { type: 'summary', speaker: 'vector', points: ['Percent means out of 100.', '37 (squares) out of 100 (squares) is 37% (blue).', 'The part and the rest make 100%.', 'With exactly 100 things, 25% (gold) of them is 25 (gold coins).'] },
    ],
  },
  {
    id: 'l.pctmulti-2', title: 'Discount, then tariff', teacher: 'newton', skillId: 'pctmulti.discounttax', minutes: 8, group: GROUP,
    summary: 'Work a percent story one bar at a time: the second percent is of the new amount.',
    recommendedAfter: [{ skillId: 'pctmulti.outof100', mastery: 40 }],
    steps: [
      { type: 'say', speaker: 'newton', text: 'A cloak costs 80 (coins). The shop takes 25% (discount) off. Then a tariff of 10% (tariff) is added on the sale price. Draw one bar for each step.', visual: bars(80, 'coins', CLOAK), caption: 'Start, then the sale, then the tariff' },
      { type: 'say', speaker: 'newton', text: 'Sale first. 25% (discount) is a quarter, so a quarter of 80 (starting price) is 20 (coins off). 80 (starting price) − 20 (coins off) = 60 (sale price).', visual: bars(80, 'coins', [CLOAK[0]], { reveal: true }), caption: 'The pink part comes off' },
      { type: 'say', speaker: 'newton', text: 'Now the tariff. It is a percent of the SALE price. 10% (tariff) is a tenth, so a tenth of 60 (sale price) is 6 (coins of tariff). 60 (sale price) + 6 (coins of tariff) = 66 (coins to pay).', visual: bars(80, 'coins', CLOAK, { reveal: true }), caption: 'The gold part is added on' },
      { type: 'say', speaker: 'newton', text: 'Careful: this is NOT the same as 15% (the difference) off. That would give 68 (coins). The tariff was taken on the smaller sale price, so you pay 66 (coins).' },
      { type: 'try', speaker: 'newton', intro: 'Discount first, then the tariff on the sale price.', skillId: 'pctmulti.discounttax', difficulty: 5, count: 3 },
      { type: 'say', speaker: 'newton', text: 'Two cuts in a row work the same way. 20% (first cut) off 200 (coins) takes 40 (coins), leaving 160 (coins). Then 10% (second cut) of 160 (coins) is 16 (coins), so you pay 144 (coins), not 140 (coins).', visual: bars(200, 'coins', [{ label: 'sale', pct: 20, kind: 'off' }, { label: 'extra', pct: 10, kind: 'off' }], { reveal: true }), caption: 'The second cut is of what is left' },
      { type: 'try', speaker: 'newton', intro: 'One cut at a time. The second is of what is left.', skillId: 'pctmulti.twosteps', difficulty: 5, count: 3 },
      { type: 'summary', speaker: 'newton', points: ['One bar per step.', 'Take the discount first, then the tariff on the sale price.', 'The second percent is of the new amount, never of the start.', '25% (discount) off then 10% (tariff) on is not 15% (the difference) off.'] },
    ],
  },
  {
    id: 'l.pctmulti-3', title: 'A percent of a percent; up then down', teacher: 'vector', skillId: 'pctmulti.pctofpct', minutes: 8, group: GROUP,
    summary: 'Take a percent of a part, turn two steps into one percent, and see why up then down misses the start.',
    recommendedAfter: [{ skillId: 'pctmulti.discounttax', mastery: 40 }],
    steps: [
      { type: 'say', speaker: 'vector', text: 'There are 200 (riders). 40% (kids) of them are kids, and 25% (red helmets) of the kids wear red helmets. How many kids wear red helmets?', visual: bars(200, 'riders', RIDERS), caption: 'All riders, then the kids, then the red helmets' },
      { type: 'say', speaker: 'vector', text: '10% of 200 (riders) is 20 (one tenth), so 40% (kids) is four tenths: 80 (kids). Then 25% (red helmets) is a quarter of the kids: a quarter of 80 (kids) is 20 (kids in red helmets).', visual: bars(200, 'riders', RIDERS, { reveal: true }), caption: 'The kids bar opens up: the red part is a quarter of the kids' },
      { type: 'say', speaker: 'vector', text: 'As one percent: pretend there are 100% (all riders). 25% (red helmets) of 40% (kids) = 10% (of all riders). Check: 10% (of all riders) of 200 (riders) = 20 (kids in red helmets).', visual: bars(100, '%', RIDERS, { reveal: true }), caption: 'A quarter of 40% (kids) is 10% (of all riders)' },
      { type: 'try', speaker: 'vector', intro: 'Find the first part, then take the second percent of that part.', skillId: 'pctmulti.pctofpct', difficulty: 5, count: 3 },
      { type: 'say', speaker: 'vector', text: 'Up then down. A toll of 100 (coins) goes up 20% (rise): 100 (coins) + 20 (coins) = 120 (coins). Then it goes down 20% (drop) of 120 (coins), which is 24 (coins): 120 (coins) − 24 (coins) = 96 (coins). That is 4% (lower) than the start, not back where it began.', visual: bars(100, 'coins', [{ label: 'up', pct: 20, kind: 'on' }, { label: 'down', pct: 20, kind: 'off' }], { reveal: true }), caption: 'The little gold tick marks the start: 96 (coins) ends short of it' },
      { type: 'try', speaker: 'vector', intro: 'The second percent is of the new amount.', skillId: 'pctmulti.updown', difficulty: 5, count: 3 },
      { type: 'summary', speaker: 'vector', points: ['A percent of a part is a part of a part: work down the bars.', '25% (red helmets) of 40% (kids) is 10% (of all riders).', 'Pretend the start is 100.', 'Up 20% (rise) then down 20% (drop) ends 4% (lower), not at the start.'] },
    ],
  },
];
