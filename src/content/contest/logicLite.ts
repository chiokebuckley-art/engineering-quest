import type { LessonDef } from '../lessons';

/** Logic Lite lessons (Contest Path). Teach-card standard: worked numbers on the picture, then a Try next. */
export const LOGIC_LESSONS: LessonDef[] = [
  {
    id: 'l.logic-1', title: "True, false or can't tell", teacher: 'vector', skillId: 'logic.truefalse', minutes: 6, group: 'Logic Lite',
    summary: "Check a sentence against a picture: true, false, or the picture does not say (a shut box, a taste), so you can't tell.",
    steps: [
      {
        type: 'say', speaker: 'vector', text: 'Logic means using only what you know for sure. "There are more red apples than green apples." Count them: 3 (red apples) is more than 2 (green apples). So it is TRUE. "Every apple is red." But 2 (green apples) are not red. So it is FALSE: one apple that breaks the rule is enough.',
        visual: { type: 'scene', items: [{ icon: 'apple', color: 'red', n: 3, label: 'red' }, { icon: 'apple', color: 'green', n: 2, label: 'green' }] },
        caption: 'Count first, then decide',
      },
      {
        type: 'say', speaker: 'vector', text: 'Now the box is shut, and it might hold more apples. "There are more red apples than green apples." The box might hold lots of green apples, so we CAN\'T TELL. "The red apples taste sweet." A picture cannot show a taste, so we CAN\'T TELL. That is a real answer, not a guess!',
        visual: { type: 'scene', items: [{ icon: 'apple', color: 'red', n: 3, label: 'red' }, { icon: 'apple', color: 'green', n: 2, label: 'green' }, { icon: 'apple', n: 0, hidden: true, label: 'shut box' }] },
        caption: 'What can the picture not show?',
      },
      { type: 'try', speaker: 'vector', intro: 'True, false, or can\'t tell? Look before you tap.', skillId: 'logic.truefalse', difficulty: 1, count: 3 },
      {
        type: 'say', speaker: 'vector', text: 'Things in a row, left to right: cat, dog, tree, house. "The dog is next to the cat": nothing stands between them, so it is TRUE. "The cat is next to the tree": the dog is between them, so it is FALSE.',
        visual: { type: 'scene', items: [{ icon: 'cat', n: 1, label: 'cat' }, { icon: 'dog', n: 1, label: 'dog' }, { icon: 'tree', n: 1, label: 'tree' }, { icon: 'house', n: 1, label: 'house' }] },
        caption: 'Next to means side by side',
      },
      {
        type: 'say', speaker: 'vector', text: 'A shut box hides things. You can see 4 (red balls), and the box might hold more balls, or none. "There are at least 3 (red balls)": TRUE, because the box can only add more. "There are exactly 4 (red balls)": CAN\'T TELL, because the box might hold another red ball.',
        visual: { type: 'scene', items: [{ icon: 'ball', color: 'red', n: 4, label: 'red' }, { icon: 'ball', color: 'blue', n: 2, label: 'blue' }, { icon: 'ball', n: 0, hidden: true, label: 'shut box' }] },
        caption: 'What could be in the box?',
      },
      { type: 'try', speaker: 'vector', intro: 'Watch for shut boxes and words like every, no and at least.', skillId: 'logic.truefalse', difficulty: 3, count: 3 },
      { type: 'summary', speaker: 'vector', points: ['Count or look first, then decide.', 'Every means all of them: one that breaks the rule makes it false.', "If the picture does not say (a taste, a name, inside a shut box), you can't tell.", 'At least is safe with a shut box; exactly is not.'] },
    ],
  },
  {
    id: 'l.logic-2', title: 'Grids, lines and must or might', teacher: 'newton', skillId: 'logic.grid', minutes: 8, group: 'Logic Lite',
    summary: 'Solve who-has-what with ✗ and ✓, line people up from clues, and decide must, might or can\'t.',
    recommendedAfter: [{ skillId: 'logic.truefalse', mastery: 30 }],
    steps: [
      {
        type: 'say', speaker: 'newton', text: 'Mia, Leo and Zoe each have a different pet: a cat, a dog and a fish. Clue 1: Mia does not have the cat or the dog. Clue 2: Leo does not have the cat. Draw a grid: names down the side, pets across the top.',
        visual: { type: 'logicgrid', rows: ['Mia', 'Leo', 'Zoe'], cols: ['cat', 'dog', 'fish'] },
        caption: 'One ✓ in every row and every column',
      },
      {
        type: 'say', speaker: 'newton', text: 'Clue 1: ✗ in Mia\'s cat and dog boxes. Mia\'s row has one empty box left, so Mia has the fish ✓, and nobody else does. Clue 2: ✗ in Leo\'s cat box. Leo\'s row has one empty box left: the dog ✓. So Zoe has the cat.',
        visual: { type: 'logicgrid', rows: ['Mia', 'Leo', 'Zoe'], cols: ['cat', 'dog', 'fish'], marks: [['no', 'no', 'yes'], ['no', 'yes', 'no'], ['yes', 'no', 'no']] },
        caption: 'The last empty box gets the ✓',
      },
      { type: 'try', speaker: 'newton', intro: 'Mark every clue with ✗. Look for a row or column with one empty box.', skillId: 'logic.grid', difficulty: 3, count: 3 },
      {
        type: 'say', speaker: 'newton', text: 'Clue 1: Kai is taller than Ava. Clue 2: Ava is taller than Ben. Put them on a line from tallest to shortest: Kai, then Ava, then Ben. Nobody is taller than Kai, so Kai is the tallest.',
        visual: { type: 'logicgrid', rows: ['Kai', 'Ava', 'Ben'], cols: ['tallest', 'middle', 'shortest'], marks: [['yes', 'no', 'no'], ['no', 'yes', 'no'], ['no', 'no', 'yes']] },
        caption: 'Places across the top',
      },
      { type: 'try', speaker: 'newton', intro: 'Line them up, one clue at a time.', skillId: 'logic.order', difficulty: 3, count: 3 },
      {
        type: 'say', speaker: 'newton', text: 'Mia\'s bag has 3 (red marbles) and 2 (blue marbles). She picks one without looking. She MIGHT get a red marble: it could be red or blue. She CAN\'T get a green marble: there are none. She MUST get a red or blue marble: every marble is one of those.',
        visual: { type: 'scene', title: "Mia's bag", items: [{ icon: 'ball', color: 'red', n: 3, label: 'red' }, { icon: 'ball', color: 'blue', n: 2, label: 'blue' }] },
        caption: 'Must = every time. Might = sometimes. Can\'t = never.',
      },
      { type: 'try', speaker: 'newton', intro: 'Must, might or can\'t? Look at every colour in the bag.', skillId: 'logic.mustmight', difficulty: 3, count: 3 },
      { type: 'summary', speaker: 'newton', points: ['Grids: a ✗ for every clue; the last empty box in a row or column gets the ✓.', 'Line-ups: put two names from one clue on the line, then fit in the rest.', "Must = every time, might = sometimes, can't = never."] },
    ],
  },
  {
    id: 'l.logic-3', title: 'Fibbers and the worst luck', teacher: 'vector', skillId: 'logic.liar', minutes: 9, group: 'Logic Lite',
    summary: 'Try one case and follow it until it works or breaks; plan for the worst luck to be sure.',
    recommendedAfter: [{ skillId: 'logic.grid', mastery: 40 }],
    steps: [
      {
        type: 'say', speaker: 'vector', text: 'On Gear Island every robot is a truth-teller, who always tells the truth, or a fibber, who always fibs. Pip says, "Zap is a fibber." Zap says, "Pip and I are both fibbers." Who is telling the truth?',
        visual: { type: 'speakers', people: [{ name: 'Pip', says: 'Zap is a fibber.', icon: 'robot' }, { name: 'Zap', says: 'Pip and I are both fibbers.', icon: 'robot' }] },
        caption: 'Try one robot as a truth-teller',
      },
      {
        type: 'say', speaker: 'vector', text: 'Try Zap as a truth-teller: then Zap\'s words are true, so Zap is a fibber. That breaks! So Zap is a fibber, and Zap\'s words are false: they are not both fibbers, so Pip tells the truth. Check: Pip says Zap is a fibber. True, so it fits.',
        visual: { type: 'logicgrid', rows: ['Pip', 'Zap'], cols: ['truth-teller', 'fibber'], marks: [['yes', 'no'], ['no', 'yes']] },
        caption: 'One case breaks, one case fits',
      },
      { type: 'try', speaker: 'vector', intro: 'Pretend one robot tells the truth. Does the story hold together?', skillId: 'logic.liar', difficulty: 5, count: 3 },
      {
        type: 'say', speaker: 'vector', text: 'Leo\'s drawer has 5 (red shirts), 4 (blue shirts) and 3 (green shirts). How many must he take, without looking, to be sure of 2 (shirts) of the same colour? Think of the worst luck.',
        visual: { type: 'scene', title: "Leo's drawer", items: [{ icon: 'shirt', color: 'red', n: 5, label: '5 red' }, { icon: 'shirt', color: 'blue', n: 4, label: '4 blue' }, { icon: 'shirt', color: 'green', n: 3, label: '3 green' }] },
        caption: 'Be sure, even with the worst luck',
      },
      {
        type: 'say', speaker: 'vector', text: 'The unluckiest start is 1 (red shirt), 1 (blue shirt) and 1 (green shirt): 3 (shirts), all different. There are only 3 (colours), so the next shirt must match one of them: 3 (shirts) + 1 (shirt) = 4 (shirts).',
        visual: { type: 'scene', title: 'The unluckiest picks', items: [{ icon: 'shirt', color: 'red', n: 1, label: '1 red' }, { icon: 'shirt', color: 'blue', n: 1, label: '1 blue' }, { icon: 'shirt', color: 'green', n: 1, label: '1 green' }] },
        caption: 'One of each, then one more',
      },
      { type: 'try', speaker: 'vector', intro: 'Must, might, can\'t, or how many to be sure? Picture the worst luck.', skillId: 'logic.mustmight', difficulty: 5, count: 3 },
      {
        type: 'say', speaker: 'vector', text: 'Bigger grids and longer lines work the same way. Clue: "The kite belongs to Ben or Lily." So nobody else has the kite: put ✗ in Ava\'s and Raj\'s kite boxes. Then take the next clue, one at a time.',
        visual: { type: 'logicgrid', rows: ['Ben', 'Lily', 'Ava', 'Raj'], cols: ['ball', 'kite', 'robot', 'boat'], marks: [[null, null, null, null], [null, null, null, null], [null, 'no', null, null], [null, 'no', null, null]] },
        caption: '"Or" means nobody else has it',
      },
      { type: 'try', speaker: 'vector', intro: 'Four names, four things: one clue at a time.', skillId: 'logic.grid', difficulty: 5, count: 3 },
      { type: 'summary', speaker: 'vector', points: ['Fibbers: try one case and follow it. If it breaks, the other case is true. Then check every robot.', 'To be sure, plan for the worst luck, then add one more.', 'Grids and line-ups: one clue at a time, and the last empty box gets the ✓.', 'More logic puzzles live in Logic Quest.'] },
    ],
  },
];
