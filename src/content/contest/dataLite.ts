import type { LessonDef } from '../lessons';
import type { Visual } from '../../engine/types';

/** Charts & Venn lessons (Contest Path). Teach-card standard: worked numbers on the picture, then a Try next. */
const GROUP = 'Charts & Venn';
type Picto = Extract<Visual, { type: 'picto' }>;

const APPLES: Picto = { type: 'picto', title: 'Apples picked', icon: 'apple', key: 1, rows: [{ label: 'Mia', n: 5 }, { label: 'Leo', n: 3 }, { label: 'Ava', n: 7 }] };
const COLORS_TALLY: Picto = { type: 'picto', title: 'Favorite color', icon: 'person', key: 1, tally: true, rows: [{ label: 'Red', n: 8 }, { label: 'Blue', n: 6 }, { label: 'Green', n: 11 }] };
const APPLES2: Picto = { type: 'picto', title: 'Apples picked', icon: 'apple', key: 2, rows: [{ label: 'Mia', n: 6 }, { label: 'Leo', n: 7 }, { label: 'Ava', n: 10 }] };
const SPORT: Picto = { type: 'picto', title: 'Favorite sport', icon: 'person', key: 1, bar: 10, rows: [{ label: 'Soccer', n: 40 }, { label: 'Tennis', n: 25 }, { label: 'Chess', n: 30 }, { label: 'Dance', n: 15 }] };
const BOOKS: Picto = { type: 'picto', title: 'Books read', icon: 'book', key: 1, bar: 2, values: true, rows: [{ label: 'Mia', n: 4 }, { label: 'Leo', n: 9 }, { label: 'Ava', n: 6 }, { label: 'Sam', n: 3 }, { label: 'Zoe', n: 8 }] };
const BOOKS_SORTED: Picto = { ...BOOKS, rows: [{ label: 'Sam', n: 3 }, { label: 'Mia', n: 4 }, { label: 'Ava', n: 6 }, { label: 'Zoe', n: 8 }, { label: 'Leo', n: 9 }], highlight: [2] };
const BOOKS_MISSING: Picto = { type: 'picto', title: 'Books read', icon: 'book', key: 1, bar: 2, values: true, ask: 3, rows: [{ label: 'Ivy', n: 5 }, { label: 'Ben', n: 9 }, { label: 'Kai', n: 6 }, { label: 'Nia', n: 8 }] };

export const DATA_LESSONS: LessonDef[] = [
  {
    id: 'l.data-1', title: 'Picture charts and tallies', teacher: 'vector', skillId: 'data.picto', minutes: 6, group: GROUP,
    summary: 'Count a picture chart row by row, read tally bundles of five, and use a key where one picture stands for 2.',
    steps: [
      { type: 'say', speaker: 'vector', text: 'This picture chart shows apples picked. Each apple picture is 1 (apple). Count Mia\'s row, touching each picture once: 5 (apples).', visual: APPLES, caption: 'One picture is one apple' },
      { type: 'say', speaker: 'vector', text: 'Who picked the most? The pictures are all the same size, so the longest row wins: Ava, with 7 (apples). How many more than Leo? 7 (apples) − 3 (apples) = 4 (more apples).', visual: { ...APPLES, values: true, highlight: [1, 2] }, caption: 'Ava\'s row is the longest' },
      { type: 'say', speaker: 'vector', text: 'A tally chart uses marks. Four marks and a line across make a bundle of 5 (marks). Red: 5 (marks) + 3 (marks) = 8 (votes for red). Count by fives, then count on.', visual: { ...COLORS_TALLY, values: true, highlight: [0] }, caption: 'A bundle of marks is five' },
      { type: 'try', speaker: 'vector', intro: 'Count each row once. Bundles are five.', skillId: 'data.picto', difficulty: 1, count: 4 },
      { type: 'say', speaker: 'vector', text: 'Now each picture stands for 2 (apples). Check the key first! A half picture stands for 1 (apple). Leo: 3 (pictures) × 2 (apples each) + 1 (for the half picture) = 7 (apples Leo picked).', visual: APPLES2, caption: 'The key: one apple picture is 2 apples' },
      { type: 'say', speaker: 'vector', text: 'A quick trick for how many more: Ava\'s row has 2 (more pictures) than Mia\'s, and 2 (pictures) × 2 (apples each) = 4 (more apples). Check: 10 (apples) − 6 (apples) = 4 (more apples).', visual: { ...APPLES2, values: true, highlight: [0, 2] }, caption: 'Count the extra pictures, then use the key' },
      { type: 'try', speaker: 'vector', intro: 'Read the key, then each row.', skillId: 'data.picto', difficulty: 3, count: 3 },
      { type: 'summary', speaker: 'vector', points: ['Read the title and the key first.', 'Count each row once; the longest row has the most.', 'A tally bundle is five: count by fives, then on.', 'Pictures × key = how many. A half picture is half the key.', 'How many more: subtract, or count the extra pictures.'] },
    ],
  },
  {
    id: 'l.data-2', title: 'Bar charts and Venn diagrams', teacher: 'vector', skillId: 'data.bar', minutes: 7, group: GROUP,
    summary: 'Read a bar against its scale, even halfway between lines, and count each part of a Venn diagram once.',
    recommendedAfter: [{ skillId: 'data.picto', mastery: 40 }],
    steps: [
      { type: 'say', speaker: 'vector', text: 'A bar chart has a scale. Here each grid line goes up by 10 (votes). Go from the top of the soccer bar straight across: it ends on the line for 40 (votes for soccer).', visual: SPORT, caption: 'Each grid line is worth 10' },
      { type: 'say', speaker: 'vector', text: 'The tennis bar ends halfway between 20 (the line below) and 30 (the line above): 20 (the line below) + 5 (half a step) = 25 (votes for tennis).', visual: { ...SPORT, values: true, highlight: [1] }, caption: 'Halfway between two lines' },
      { type: 'say', speaker: 'vector', text: 'How many more chose soccer than chess? 40 (votes for soccer) − 30 (votes for chess) = 10 (more votes). How many in all? 40 (votes) + 25 (votes) + 30 (votes) + 15 (votes) = 110 (votes in all).', visual: { ...SPORT, values: true, highlight: [0, 2] }, caption: 'Read each bar, then compare' },
      { type: 'try', speaker: 'vector', intro: 'Check what each grid line is worth first.', skillId: 'data.bar', difficulty: 3, count: 3 },
      { type: 'say', speaker: 'vector', text: 'This Venn diagram shows who plays soccer and who plays chess. The middle, where the circles overlap, is for children who play both: 4 (both). The 3 (children) outside play neither.', visual: { type: 'venn', sets: ['Soccer', 'Chess'], counts: { A: 7, AB: 4, B: 5, none: 3 } }, caption: 'The middle belongs to both circles' },
      { type: 'say', speaker: 'vector', text: 'How many play soccer? The whole soccer circle, middle too: 7 (soccer only) + 4 (both) = 11 (children who play soccer). How many in all? Count each part once: 7 (soccer only) + 4 (both) + 5 (chess only) + 3 (neither) = 19 (children in all).', visual: { type: 'venn', sets: ['Soccer', 'Chess'], counts: { A: 7, AB: 4, B: 5, none: 3 }, total: 19 }, caption: 'Each part counted once' },
      { type: 'try', speaker: 'vector', intro: 'Find the part the question asks about. The middle is in both circles.', skillId: 'data.venn', difficulty: 3, count: 3 },
      { type: 'summary', speaker: 'vector', points: ['Find what each grid line is worth.', 'Go from the top of the bar straight across.', 'Halfway between two lines is half a step more.', 'In a Venn diagram, the middle is in both circles: count it once.'] },
    ],
  },
  {
    id: 'l.data-3', title: 'Pie charts and Venn puzzles', teacher: 'newton', skillId: 'data.pie', minutes: 8, group: GROUP,
    summary: 'Turn a slice of a pie into a number of people, and find the hidden middle of a Venn diagram from the totals.',
    recommendedAfter: [{ skillId: 'data.bar', mastery: 40 }],
    steps: [
      { type: 'say', speaker: 'newton', text: 'A whole pie is all of them: 100% (everyone). This pie shows how 40 (students) get to school. The guide lines cut it into 8 (equal parts), and the bus slice covers 3 (parts): 3/8 (of the pie).', visual: { type: 'pie', title: 'How we get to school', slices: [{ label: 'Bus', v: 3 }, { label: 'Walk', v: 4 }, { label: 'Car', v: 1 }], parts: 8 }, caption: 'Count the equal parts' },
      { type: 'say', speaker: 'newton', text: 'One part: 40 (students) ÷ 8 (parts) = 5 (students in each part). The bus: 3 (parts) × 5 (students each) = 15 (students who take the bus). Check the whole pie: 15 (bus) + 20 (walk) + 5 (car) = 40 (students).', visual: { type: 'pie', title: 'How we get to school', slices: [{ label: 'Bus 15', v: 3 }, { label: 'Walk 20', v: 4 }, { label: 'Car 5', v: 1 }], parts: 8, highlight: 0 }, caption: 'One part is 5 students' },
      { type: 'say', speaker: 'newton', text: 'A new pie, with percents printed: the lunch order of 60 (children). A percent is out of a hundred. Pizza is 25% (of the pie), so 60 (children) × 25/100 (the pizza share) = 15 (children who chose pizza). A missing slice? The slices always add up to 100% (the whole pie).', visual: { type: 'pie', title: 'Lunch order', slices: [{ label: 'Pizza', v: 25 }, { label: 'Pasta', v: 45 }, { label: 'Salad', v: 30 }], showPct: true, highlight: 0 }, caption: 'A new pie: percents are out of a hundred' },
      { type: 'try', speaker: 'newton', intro: 'Find one part (or 10%) first, then build up.', skillId: 'data.pie', difficulty: 5, count: 3 },
      { type: 'say', speaker: 'newton', text: 'A Venn puzzle. In a class of 30 (children), 18 (play soccer), 15 (play chess) and 4 (play neither). How many play both? The middle is hidden.', visual: { type: 'venn', sets: ['Soccer', 'Chess'], counts: { AB: '?', none: 4 }, sizes: [18, 15], total: 30 }, caption: 'Circle totals, but no middle' },
      { type: 'say', speaker: 'newton', text: 'Inside the circles: 30 (children in all) − 4 (neither) = 26 (children in a circle). The two circles add to 18 (soccer circle) + 15 (chess circle) = 33 (children counted). The middle was counted twice: 33 (children counted) − 26 (children in a circle) = 7 (both).', visual: { type: 'venn', sets: ['Soccer', 'Chess'], counts: { A: 11, AB: 7, B: 8, none: 4 }, sizes: [18, 15], total: 30 }, caption: 'The extra is the middle, counted twice' },
      { type: 'try', speaker: 'newton', intro: 'Every child is in exactly one part. Use the totals.', skillId: 'data.venn', difficulty: 5, count: 3 },
      { type: 'summary', speaker: 'newton', points: ['A whole pie is everyone: 100%.', 'Find one equal part first, then count the parts in the slice.', 'Percent of a total: total × percent ÷ 100.', 'Circle A + circle B counts the middle twice.', 'In a circle = total − neither.'] },
    ],
  },
  {
    id: 'l.data-4', title: 'Mean, median and range', teacher: 'newton', skillId: 'data.mean', minutes: 7, group: GROUP,
    summary: 'Share a total equally to find the mean, find the middle number, the spread, and a missing value from the mean.',
    recommendedAfter: [{ skillId: 'data.bar', mastery: 40 }],
    steps: [
      { type: 'say', speaker: 'newton', text: 'Five friends read 4 (books), 9 (books), 6 (books), 3 (books) and 8 (books). The mean is what each would read if they shared the books out equally.', visual: BOOKS, caption: 'Five bars, five friends' },
      { type: 'say', speaker: 'newton', text: 'Add them: 4 (books) + 9 (books) + 6 (books) + 3 (books) + 8 (books) = 30 (books in all). Share among 5 (friends): 30 (books in all) ÷ 5 (friends) = 6 (books each). The dashed line is the mean: the tall bars could fill up the short ones to exactly that level.', visual: { ...BOOKS, line: 6 }, caption: 'Level the bars: the mean is 6' },
      { type: 'say', speaker: 'newton', text: 'The median is the middle number once they are in order: Sam 3 (books), Mia 4 (books), Ava 6 (books), Zoe 8 (books), Leo 9 (books). The middle one is 6 (books). The range is the most minus the fewest: 9 (books) − 3 (books) = 6 (books apart).', visual: BOOKS_SORTED, caption: 'In order, the middle bar is the median' },
      { type: 'try', speaker: 'newton', intro: 'Mean: add, then share. Median: put them in order first.', skillId: 'data.mean', difficulty: 5, count: 4 },
      { type: 'say', speaker: 'newton', text: 'A missing value. The mean of 4 (friends) is 7 (books each), so together they read 7 (books each) × 4 (friends) = 28 (books in all). The three we can see read 5 (books) + 9 (books) + 6 (books) = 20 (books). Nia read 28 (books in all) − 20 (books) = 8 (books).', visual: BOOKS_MISSING, caption: 'Mean × how many = the total' },
      { type: 'try', speaker: 'newton', intro: 'Mean × how many gives the total. Then take away what you know.', skillId: 'data.mean', difficulty: 6, count: 3 },
      { type: 'summary', speaker: 'newton', points: ['Mean = total ÷ how many.', 'Total = mean × how many.', 'Median = the middle number in order (or halfway between the two middle ones).', 'Range = most − fewest.'] },
    ],
  },
];
