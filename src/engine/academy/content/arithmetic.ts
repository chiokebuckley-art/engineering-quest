/**
 * The Arithmetic Academy: counting through roots (with decimals), then fluency and the Mastery Trial.
 * Each chapter teaches in-world first (a model on the stage), then two quests (guided, then challenge)
 * in its wing, with a concept check and a transfer set for mastery. Graduation opens Pre-Algebra.
 */
import type { Rng } from '../../rng';
import type { Visual } from '../../types';
import type { AskStep } from '../types';
import { defineAcademy, type ChapterSpec } from '../defs';
import * as Q from '../questions';
import { DECIMALS_CHAPTER, decimalTrialSteps, decimalMixedStep, decimalTransferStep } from './arithmetic-decimals';

const wave = (name: string, build: (rng: Rng) => AskStep[]) => ({ name, build });
const times = (k: number, f: (rng: Rng) => AskStep) => (rng: Rng) => Array.from({ length: k }, () => f(rng));
const mixOf = (fs: ((rng: Rng) => AskStep)[]) => (rng: Rng) => fs.map((f) => f(rng));

/** Concept items: model-based picks, built from the chapter's own model questions. */
const conceptFrom = (fs: ((rng: Rng) => AskStep)[]) => (rng: Rng): AskStep[] => rng.shuffle(fs).slice(0, 3).map((f) => f(rng));

const CHAPTER_SPECS: ChapterSpec[] = [
  {
    transfer: (r) => Q.transferFor(r, 1), key: 'count', title: 'Quantity & Counting', wing: 'village', wingName: 'Village Counting Yard',
    goal: 'Count a pile one-to-one, know the last number is "how many", see small sets at a glance, and compare two piles.',
    misconception: 'Saying counting words without pointing; thinking the last number is a name, not the amount.',
    teach: [
      { title: 'One tap, one crystal', text: 'Touch every crystal exactly once while you count. The last number you say is how many there are. That number does not change if you count them in a different order.', steps: ['Tap 1, 2, 3, 4, 5, 6, 7: each tap adds 1 (crystal).', '1 + 1 + 1 + 1 + 1 + 1 + 1 = 7 (crystals)', 'The last number you said, 7 (crystals), is how many there are.'], next: 'Tap the crystals again in a different order. Does the last number change?', model: { kind: 'counters', items: 7, label: 'ore crystals' } },
      { title: 'See it at a glance', text: 'Subitizing means seeing how many without counting one by one. Sets up to 5 you can just see, like the dots on a die. A bigger set splits into small sets you can see.', steps: ['This set of 5 dots: you can see a 3 and a 2.', '3 (dots seen at once) + 2 (dots seen at once) = 5 (dots in the set), without counting.', 'Check with a count: 1, 2, 3, 4, 5.'], visual: { type: 'groups', groups: 1, perGroup: 5 } },
      { title: 'More, less, same', text: 'Line two piles up. The longer line has more. If you can pair every crystal in one pile with one in the other, they are the same.', steps: ['Pile A has 7 crystals, pile B has 5 crystals.', 'Pair one from A with one from B: 5 (pairs), and 2 (crystals in A) have no partner.', '7 (crystals in A) − 5 (crystals in B) = 2 (more crystals in A)'], visual: { type: 'bar', bars: [{ label: 'Pile A', parts: [7] }, { label: 'Pile B', parts: [5] }] } },
    ],
    quests: [
      { id: 'aq.ch1.counting-yard', name: 'The Counting Yard', giver: 'vector', guided: true, hook: 'The ore carts arrived unlabelled. Vector: "Count each pile, apprentice. Tap once for each crystal, and the yard board lights."', change: 'The Counting Yard board lights up with the first tallies.',
        waves: [wave('Count the piles', times(3, (r) => Q.countStep(r, 12))), wave('Quick glance', times(3, Q.subitizeStep)), wave('More or less', times(2, (r) => Q.compareStep(r, 12)))] },
      { id: 'aq.ch1.cart-sort', name: 'Cart Sort', giver: 'brick', hook: 'Brick: "Two carts, one rail. Tell me which is heavier before they collide."', change: 'The yard rail switches sort carts by count.',
        waves: [wave('Bigger pile', times(3, (r) => Q.compareStep(r, 20))), wave('Count to 20', times(3, (r) => Q.countStep(r, 20))), wave('Glance and check', times(2, Q.subitizeStep))] },
    ],
    fluency: { label: 'Counting & comparing', skills: ['num.sense'], n: 12, accuracy: 0.9, medianMs: 8000 },
    concept: conceptFrom([(r) => Q.countStep(r, 10), Q.subitizeStep, (r) => Q.compareStep(r, 15)]),
    transferCount: 5, drill: { game: 'bonds', selection: 'bonds:5', label: 'Make 5' },
  },
  {
    transfer: (r) => Q.transferFor(r, 2), key: 'place', title: 'Place Value & Base Ten', wing: 'village', wingName: 'Village Number Forge',
    goal: 'Build any number to 99 with tens and ones plates, bundle ten ones into one ten, and read what each digit is worth.',
    misconception: 'Seeing 14 as a 1 and a 4 that have nothing to do with each other; not believing 10 ones equals 1 ten.',
    teach: [
      { title: 'Tens plates and ones plates', text: 'Every number is built from plates: a tens plate is worth 10, a ones plate is worth 1. 43 is four tens plates and three ones plates.', steps: ['43 is 4 (tens plates) and 3 (ones plates).', '4 (tens plates) × 10 (per tens plate) = 40 (from tens)', '3 (ones plates) × 1 (per ones plate) = 3 (from ones)', '40 (from tens) + 3 (from ones) = 43 (in all)'], next: 'Build 52 with the plates. How many tens plates, and how many ones?', model: { kind: 'placevalue', target: 43 } },
      { title: 'Ten ones is one ten', text: 'Gather ten loose ones and they snap into one tens plate. Same amount, fewer plates. That is bundling.', steps: ['10 (ones plates) × 1 (per ones plate) = 10 (in all): the same as 1 (tens plate).', '14 (loose ones) = 10 (ones to bundle) + 4 (ones left)', 'So 14 is 1 (tens plate) and 4 (ones plates).'], visual: { type: 'pvchart', value: '14' } },
      { title: 'The digit\'s job', text: 'In 27 the 2 does not mean two. It sits in the tens place, so it means twenty. Position gives a digit its value.', steps: ['27 is 2 (tens) and 7 (ones).', '2 (tens) × 10 (per ten) = 20 (from tens)', '20 (from tens) + 7 (ones) = 27, so the 2 (tens digit) is worth 20.'], visual: { type: 'pvchart', value: '27', highlight: 1 }, lessonId: 'l.spiral-place' },
    ],
    quests: [
      { id: 'aq.ch2.number-forge', name: 'The Number Forge', giver: 'vector', guided: true, hook: 'The Engine dial is stuck at 00. Vector: "Seat the right tens and ones plates and the dial turns."', change: 'The Engine dial reads real numbers again.',
        waves: [wave('Seat the plates', times(3, (r) => Q.buildNumberStep(r, 59))), wave('Read the dial', times(3, Q.tensOnesStep)), wave('Bundle up', times(2, Q.bundleStep))] },
      { id: 'aq.ch2.dial-repair', name: 'Dial Repair', giver: 'ada', hook: 'Ada: "Three dials, all wrong. Build each number, then tell me its tens."', change: 'All three village dials agree.',
        waves: [wave('Build to 99', times(3, (r) => Q.buildNumberStep(r, 99))), wave('Tens and ones', times(3, Q.tensOnesStep)), wave('Bundles', times(2, Q.bundleStep))] },
    ],
    fluency: { label: 'Place value', skills: ['num.sense', 'mm.place', 'spiral.pvalue'], n: 12, accuracy: 0.9, medianMs: 8000 },
    concept: conceptFrom([(r) => Q.buildNumberStep(r, 79), Q.tensOnesStep, Q.bundleStep]),
    transferCount: 5, drill: { game: 'mm', selection: 'mm:all', label: 'Mental Math: place value' }, lessonId: 'l.spiral-place',
  },
  {
    transfer: (r) => Q.transferFor(r, 3), key: 'add', title: 'Addition as Joining', wing: 'village', wingName: 'Bridge Beams',
    goal: 'Join two parts into a whole, count on instead of counting all, find a missing part to make 10, and know order does not change a sum.',
    misconception: 'Always counting from 1 instead of counting on; treating +1 and +0 as tricks; the column algorithm before meaning.',
    teach: [
      { title: 'Joining is adding', text: 'Two carts roll together on the rail. Start at the first count and hop on by the second. A cart of 5 joins a cart of 3: start at 5, hop 3, land on 8.', steps: ['Start at 5 (in the first cart) on the line.', 'Hop 3 (in the second cart): 6, 7, 8.', '5 (first cart) + 3 (second cart) = 8 (in both carts)'], next: 'Try 7 (first cart) + 4 (second cart): start at 7 and hop 4. Where do you land?', model: { kind: 'numberline', start: 5, max: 20, label: 'Start at 5 (in the first cart), hop 3 (in the second cart)' } },
      { title: 'Part, part, whole', text: 'A beam needs 10 bolts. 6 bolts are in. The missing part is what joins the 6 bolts in to make 10 bolts. Parts make a whole; a missing part is found by asking "how many more?"', steps: ['6 (bolts in) + ? (bolts missing) = 10 (bolts needed)', '10 (bolts needed) − 6 (bolts in) = 4 (bolts missing)', 'Check: 6 (bolts in) + 4 (bolts missing) = 10 (bolts needed)'], visual: { type: 'bond', total: 10, part: 6 } },
      { title: 'Order does not matter', text: 'A cart of 3 and a cart of 8: 3 + 8 and 8 + 3 join the same carts. Start from the bigger number and hop the smaller: less counting, same answer.', steps: ['3 (small cart) + 8 (big cart) = 11 (in all)', '8 (big cart) + 3 (small cart) = 11 (in all)', 'Easier way: start at 8 (big cart) and hop 3 (small cart): 9, 10, 11.'], visual: { type: 'bar', bars: [{ label: '3 + 8', parts: [3, 8] }, { label: '8 + 3', parts: [8, 3] }] }, lessonId: 'l.mental-make10' },
    ],
    quests: [
      { id: 'aq.ch3.join-beams', name: 'Join the Beams', giver: 'ada', guided: true, hook: 'Ada: "The bridge deck is short. Join two beams at a time and hop along the rail to read the length."', change: 'The first bridge beams are joined.',
        waves: [wave('Hop and join', times(3, (r) => Q.joinStep(r, 15))), wave('Missing bolts', times(3, (r) => Q.partWholeStep(r, 10))), wave('Same either way', times(2, Q.swapAddStep))] },
      { id: 'aq.ch3.bolt-count', name: 'Bolt Count', giver: 'brick', hook: 'Brick: "Fast and right. Twenty bolts a beam, and I want the totals now."', change: 'The bridge deck is fully bolted.',
        waves: [wave('Join to 20', times(3, (r) => Q.joinStep(r, 20))), wave('Make 20', times(3, (r) => Q.partWholeStep(r, 20))), wave('Facts', times(3, (r) => Q.addTypedStep(r, 20)))] },
    ],
    fluency: { label: 'Addition facts', skills: ['add.basic', 'bonds.', 'mental', 'mm.add', 'mm.make10', 'word.add'], n: 20, accuracy: 0.9, medianMs: 4000 },
    concept: conceptFrom([(r) => Q.joinStep(r, 12), (r) => Q.partWholeStep(r, 10), Q.swapAddStep]),
    transferCount: 5, drill: { game: 'add', selection: 'add:20', label: 'Addition to 20' }, lessonId: 'l.mental-make10',
  },
  {
    transfer: (r) => Q.transferFor(r, 4), key: 'sub', title: 'Subtraction as Separating', wing: 'village', wingName: 'Pump House',
    goal: 'Take away, compare two amounts to find the difference, find a missing part, and use addition to check subtraction.',
    misconception: 'Subtracting the smaller from the bigger no matter what the story says; thinking subtraction is only take-away.',
    teach: [
      { title: 'Taking away', text: 'The pump held 9 and 4 drained out. Start at 9 (starting amount) and hop back 4 (drained out): you land on 5 (left in the pump). Subtraction is hopping backwards.', steps: ['Start at 9 (starting amount).', 'Hop back 4 (drained out): 8, 7, 6, 5.', '9 (starting amount) − 4 (drained out) = 5 (left in the pump)'], next: 'Try 12 (starting amount) − 5 (drained out): start at 12 and hop back 5.', model: { kind: 'numberline', start: 9, max: 20, label: 'Start at 9 (starting amount), hop back 4 (drained out)' } },
      { title: 'Comparing', text: 'Cart A weighs 12, cart B weighs 7. Nothing is taken away, yet 12 (cart A weight) − 7 (cart B weight) = 5 (how much heavier A is) tells the difference.', visual: { type: 'bar', bars: [{ label: 'A', parts: [12] }, { label: 'B', parts: [7, '?'] }] } },
      { title: 'Addition checks it', text: '13 (whole) − 8 (known part) = 5 (missing part) because 8 (known part) + 5 (missing part) = 13 (whole). The same three numbers make both facts. If the addition fails, the subtraction was wrong.', visual: { type: 'bond', total: 13, part: 8 }, lessonId: 'l.mental-distance' },
    ],
    quests: [
      { id: 'aq.ch4.pump-drain', name: 'Pump Drain', giver: 'ada', guided: true, hook: 'Ada: "The cistern is draining and I need to know what is left. Hop back on the rail."', change: 'The pump house gauge reads true.',
        waves: [wave('Hop back', times(3, (r) => Q.takeAwayStep(r, 15))), wave('How much heavier', times(3, (r) => Q.differenceStep(r, 15))), wave('Check with addition', times(2, Q.inverseCheckStep))] },
      { id: 'aq.ch4.ore-weights', name: 'Ore Weights', giver: 'brick', hook: 'Brick: "Two carts on the scale. Difference, then prove it with an addition fact."', change: 'The ore scale is calibrated.',
        waves: [wave('Differences', times(3, (r) => Q.differenceStep(r, 20))), wave('Take away', times(3, (r) => Q.takeAwayStep(r, 20))), wave('Facts', times(3, (r) => Q.subTypedStep(r, 20)))] },
    ],
    fluency: { label: 'Subtraction facts', skills: ['sub.basic', 'mental', 'mm.sub', 'mm.complement', 'word.sub'], n: 20, accuracy: 0.9, medianMs: 4000 },
    concept: conceptFrom([(r) => Q.takeAwayStep(r, 12), (r) => Q.differenceStep(r, 12), Q.inverseCheckStep]),
    transferCount: 5, drill: { game: 'sub', selection: 'sub:20', label: 'Subtraction to 20' }, lessonId: 'l.mental-distance',
  },
  {
    transfer: (r) => Q.transferFor(r, 5), key: 'mult', title: 'Multiplication as Equal Groups', wing: 'mines', wingName: 'Multiplication Mines',
    goal: 'Build arrays that match products, explain a × b as a groups of b, skip-count with meaning, and clear the early galleries.',
    misconception: '"Multiplication is just bigger addition"; chanting rows-times-columns without seeing the groups; ×0 and ×1 confusion.',
    teach: [
      { title: 'Equal groups', text: '3 crates with 4 gears in each is 3 groups of 4. Write it 3 × 4. Add the groups (4 + 4 + 4) or skip-count (4, 8, 12): twelve gears.', steps: ['3 groups of 4 is 3 (crates) × 4 (gears per crate).', '4 (gears) + 4 (gears) + 4 (gears) = 12 (gears)', '3 (crates) × 4 (gears per crate) = 12 (gears)'], visual: { type: 'groups', groups: 3, perGroup: 4 } },
      { title: 'Arrays', text: 'Line the groups up and you get an array: 3 rows of 4. Rows are the groups; the total is the whole grid. Build one yourself.', steps: ['3 rows of 4: 4 (squares) + 4 (squares) + 4 (squares) = 12 (squares)', '3 (rows) × 4 (squares per row) = 12 (squares in the grid)'], next: 'Build 2 rows of 6. Is the total the same as 3 rows of 4?', model: { kind: 'array', rows: 3, cols: 4 } },
      { title: 'Area', text: 'A plate 3 wide and 4 long covers 12 cells. Multiplication measures area, which is why the array and the plate agree.', steps: ['3 (cells wide) × 4 (cells long) = 12 (cells)', 'Or count a line of 3 cells, four times: 3 (cells) + 3 (cells) + 3 (cells) + 3 (cells) = 12 (cells)'], visual: { type: 'array', rows: 3, cols: 4 }, lessonId: 'l.mult-intro' },
    ],
    quests: [
      { id: 'aq.ch5.array-bridge', name: 'Array Bridge', giver: 'brick', guided: true, hook: 'The bridge to Gallery 1 is dark. Brick: "Three rows of four glow-crystals, equal groups, or the span won\'t hold."', change: 'The Array Bridge lights and the first cart rolls into Gallery 1.',
        waves: [wave('Build the arrays', times(3, (r) => Q.buildArrayStep(r, [2, 3, 4, 5]))), wave('Ore Slime attack', times(3, (r) => Q.factStep(r, [2, 3, 4, 5], 'choose'))), wave('Area plate', times(2, (r) => Q.areaPlateStep(r, [3, 4, 5])))] },
      { id: 'aq.ch5.first-gallery', name: 'Into the First Gallery', giver: 'brick', hook: 'Brick: "Gallery 1 is crawling. Groups, arrays, plates: use every weapon."', change: 'Gallery 1 is cleared and its lantern lit.',
        waves: [wave('Equal groups', times(3, (r) => Q.groupsStep(r, [2, 3, 4, 5, 10]))), wave('Facts', times(3, (r) => Q.factStep(r, [2, 3, 4, 5, 10]))), wave('Arrays', times(2, (r) => Q.buildArrayStep(r, [3, 4, 6])))] },
    ],
    fluency: { label: 'Multiplication facts', skills: ['mult', 'mm.mul', 'word.mult'], n: 25, accuracy: 0.85, medianMs: 5000 },
    concept: conceptFrom([(r) => Q.buildArrayStep(r, [3, 4, 5]), (r) => Q.groupsStep(r, [2, 3, 4, 5]), (r) => Q.areaPlateStep(r, [3, 4, 5])]),
    transferCount: 5, drill: { game: 'mult', selection: 'mult:2,3,4,5', label: 'Tables ×2 to ×5' }, lessonId: 'l.mult-intro',
  },
  {
    transfer: (r) => Q.transferFor(r, 6), key: 'div', title: 'Division as Sharing & Grouping', wing: 'division', wingName: 'Division Dungeon',
    goal: 'Share a load fairly, measure how many groups fit, name the multiplication fact that checks it, and handle a light remainder.',
    misconception: '"÷ always makes things smaller"; ignoring the remainder; never linking a division to its multiplication fact.',
    teach: [
      { title: 'Fair share', text: '12 crystals into 3 crates, dealt one at a time until they run out: 4 in each crate. That is 12 (crystals) ÷ 3 (crates) = 4 (crystals per crate): sharing.', visual: { type: 'share', total: 12, groups: 3 } },
      { title: 'How many groups', text: '12 crystals, 4 fit a crate. How many crates fill? Skip-count by 4: 4, 8, 12: three crates. That is 12 (crystals) ÷ 4 (crystals per crate) = 3 (crates): grouping. Same numbers as sharing, a different question.', visual: { type: 'groups', groups: 3, perGroup: 4 } },
      { title: 'Division undoes multiplication', text: 'Every division has a multiplication that checks it: 12 (crystals) ÷ 3 (crates) = 4 (crystals per crate) because 3 (crates) × 4 (crystals per crate) = 12 (crystals). If the check fails, so did the division.', next: 'Try 35 (crystals) ÷ 5 (crates): which number makes 5 (crates) × ? (crystals per crate) = 35 (crystals)?', visual: { type: 'array', rows: 3, cols: 4 }, lessonId: 'l.division-link' },
    ],
    quests: [
      { id: 'aq.ch6.halls-of-halves', name: 'The Halls of Halves', giver: 'vector', guided: true, hook: 'The Dungeon gate splits down the middle. Vector: "Everything here is shared or grouped. Deal the crystals and the doors open."', change: 'The first Dungeon hall is lit and its door stands open.',
        waves: [wave('Fair share', mixOf([(r) => Q.shareStep(r, [2, 3, 4, 5]), (r) => Q.divArrayStep(r, [2, 3, 4, 5]), (r) => Q.shareStep(r, [2, 3, 4, 5])])), wave('How many crates', times(3, (r) => Q.groupingStep(r, [2, 3, 4, 5]))), wave('Name the check', times(2, (r) => Q.divCheckStep(r, [2, 3, 4, 5])))] },
      { id: 'aq.ch6.imp-halls', name: 'Imp Halls', giver: 'brick', hook: 'Division Imps hold the second hall. Brick: "They only fall to the right quotient, and a few leave scraps."', change: 'The Imp hall is cleared; the Dungeon bridge lowers.',
        waves: [wave('Quotients', times(3, (r) => Q.divFactStep(r, [2, 3, 4, 5, 6]))), wave('Groups and shares', mixOf([(r) => Q.shareStep(r, [3, 4, 6]), (r) => Q.divArrayStep(r, [3, 4, 6]), (r) => Q.groupingStep(r, [3, 4, 6]), (r) => Q.shareStep(r, [5, 6])])), wave('Left over', times(2, Q.remainderStep))] },
    ],
    fluency: { label: 'Division facts', skills: ['div', 'word.div', 'spiral.areamodel'], n: 25, accuracy: 0.85, medianMs: 6000 },
    concept: conceptFrom([(r) => Q.shareStep(r, [2, 3, 4]), (r) => Q.groupingStep(r, [2, 3, 4]), (r) => Q.divCheckStep(r, [3, 4, 5])]),
    transferCount: 5, drill: { game: 'div', selection: 'div:2,3,4,5', label: 'Division ÷2 to ÷5' }, lessonId: 'l.division-link',
  },
  {
    transfer: (r) => Q.transferFor(r, 7), key: 'props', title: 'Properties & Relationships', wing: 'mines', wingName: 'Gallery Swap Pads',
    goal: 'Use swap pads (order does not change a product) and split attacks (break a hard fact into two easy ones), and link every division to its inverse.',
    misconception: 'Properties as names to memorise; believing a − b = b − a; not seeing why a split gives the same product.',
    teach: [
      { title: 'Swap pads', text: 'Turn a 3 × 7 array on its side and it is 7 × 3. Same crystals, same count. Order never changes a product, so learn 3 × 7 and 7 × 3 as one fact.', steps: ['3 (rows) × 7 (crystals per row) = 21 (crystals)', '7 (rows) × 3 (crystals per row) = 21 (crystals): the same array turned on its side.'], next: 'If 6 × 8 = 48, what is 8 × 6?', visual: { type: 'array', rows: 3, cols: 7 } },
      { title: 'Split attack', text: '7 × 8 is hard. Split the 8 (columns) into 5 (columns) and 3 (columns). 7 (rows) × 5 (columns) = 35 (crystals) and 7 (rows) × 3 (columns) = 21 (crystals). Then 35 (crystals) + 21 (crystals) = 56 (crystals in all). Split a big fact into two easy ones and add. The Dragon telegraphs this move.', visual: { type: 'array', rows: 7, cols: 8, highlightCols: 5 } as Visual },
      { title: 'Inverse pairs', text: 'Adding undoes subtracting; multiplying undoes dividing. 24 (total) ÷ 6 (groups) = 4 (per group) because 6 (groups) × 4 (per group) = 24 (total). The Engine only accepts an expression equal to what it asked for.', visual: { type: 'balance', left: '6 × ?', right: '24', unknown: '?' } as Visual, lessonId: 'l.hard-facts' },
    ],
    quests: [
      { id: 'aq.ch7.swap-pads', name: 'The Swap Pads', giver: 'vector', guided: true, hook: 'Vector: "The gallery pads only accept equal power. Swap, split, or invert, but the product must match."', change: 'The swap pads glow and the gallery cart runs both ways.',
        waves: [wave('Swap', times(3, Q.swapPadStep)), wave('Split', times(3, Q.splitAttackStep)), wave('Which is equal', times(2, Q.whichEqualStep))] },
      { id: 'aq.ch7.equal-power', name: 'Equal Power', giver: 'brick', hook: 'Brick: "Route power through any expression you like, as long as it equals what the gate asks."', change: 'Power routes through the deep galleries.',
        waves: [wave('Inverse', times(3, Q.inverseOpsStep)), wave('Split and swap', mixOf([Q.splitAttackStep, Q.swapPadStep, Q.splitAttackStep])), wave('Any order', times(2, (r) => Q.buildArrayStep(r, [6, 7, 8], true)))] },
    ],
    fluency: { label: 'Related facts', skills: ['mult.missing', 'mult.6', 'mult.7', 'mult.8', 'mult.9'], n: 20, accuracy: 0.85, medianMs: 6000 },
    concept: conceptFrom([Q.swapPadStep, Q.splitAttackStep, Q.whichEqualStep]),
    transferCount: 5, drill: { game: 'mult', selection: 'mult:6,7,8', label: 'Tables ×6 to ×8' }, lessonId: 'l.hard-facts',
  },
  {
    transfer: (r) => Q.transferFor(r, 8), requires: ['div'], key: 'frac', title: 'Fractions from First Principles', wing: 'forest', wingName: 'Fraction Forest',
    goal: 'Build unit fractions and equivalents on the same whole, compare with same-whole reasoning, add same and unlike denominators, and take a fraction "of" an amount.',
    misconception: 'A fraction as two unrelated numbers; "bigger denominator means bigger fraction"; adding tops and bottoms; not linking "of" to multiply.',
    teach: [
      { title: 'Equal parts of one whole', text: 'Cut a plank into 4 equal pieces. One piece is 1/4: one of four equal parts. Three pieces lit is 3/4. The bottom counts the equal parts; the top counts how many you have.', steps: ['4 (equal pieces): each piece is 1/4 (of the plank).', '3 pieces lit: 1/4 (one piece) + 1/4 (one piece) + 1/4 (one piece) = 3/4 (of the plank lit)', '3/4 means 3 (lit pieces) out of 4 (equal pieces).'], next: 'Light 2 of the 4 pieces. What fraction is lit?', model: { kind: 'fracbar', pieces: 4, label: 'plank' } },
      { title: 'Same length, different cuts', text: 'Cut every quarter in half and 3/4 becomes 6/8. Same lit length. Equivalent fractions name the same amount with different cuts.', steps: ['Cut each quarter in half: 4 (quarters) × 2 (halves per quarter) = 8 (pieces).', '3 (lit quarters) × 2 (halves per quarter) = 6 (lit pieces)', '3/4 (of the plank) = 6/8 (of the plank): same lit length, twice as many cuts.'], visual: { type: 'fracbar', fracs: [{ n: 3, d: 4, label: '3/4' }, { n: 6, d: 8, label: '6/8' }] } as Visual },
      { title: 'Adding pieces', text: 'Same-size pieces add by count: add the tops and keep the bottom. Pieces of different sizes are renamed to the same size first.', steps: ['1 (quarter) + 2 (quarters) = 3 (quarters), so 1/4 + 2/4 = 3/4.', '1/2 + 1/4: rename 1/2 as 2/4 (two quarters).', '2 (quarters) + 1 (quarter) = 3 (quarters), so 2/4 + 1/4 = 3/4.'], visual: { type: 'fracbar', fracs: [{ n: 1, d: 4 }, { n: 2, d: 4 }], op: '+' } as Visual },
      { title: 'Taking "of"', text: '"Of" means multiply. To find a fraction of a number, divide by the bottom, then multiply by the top.', steps: ['1/2 of 8: 8 (whole amount) ÷ 2 (equal parts) × 1 (part taken) = 4 (the half)', '3/4 of 8: 8 (whole amount) ÷ 4 (equal parts) = 2 (in each part)', '2 (in each part) × 3 (parts taken) = 6 (three quarters of the whole)', 'So 3/4 of 8 = 6.'], next: 'What is 1/4 of 12?', visual: { type: 'groups', groups: 4, perGroup: 2 }, lessonId: 'l.pc-fractions' },
    ],
    quests: [
      { id: 'aq.ch8.forest-bridge', name: 'Fraction Forest Bridge', giver: 'ada', guided: true, hook: 'Forest bridge planks are missing equal parts. Ada: "Light three-fourths of the span, same whole, equal pieces, or the cart tips into the moss." A Hydra silhouette watches from deeper trees.', change: 'The bridge path opens deeper into Fraction Forest.',
        waves: [wave('Shade the deck', times(3, (r) => Q.shadeFractionStep(r, [2, 3, 4, 6]))), wave('Which deck', times(3, Q.whichFractionStep)), wave('Same amount, new cuts', times(2, Q.equivalentStep))] },
      { id: 'aq.ch8.creek-crossing', name: 'Creek Crossing', giver: 'vector', hook: 'Vector: "Stepping stones in fourths and eighths. Add the pieces, but rename before you add different sizes."', change: 'The creek stones line up and the Hydra grove comes into view.',
        waves: [wave('Bigger piece', times(2, Q.compareFractionsStep)), wave('Add same size', times(3, Q.addSameDenomStep)), wave('Forage "of"', mixOf([Q.fractionOfStep, Q.unlikeDenomStep, Q.fractionOfStep]))] },
    ],
    fluency: { label: 'Fractions', skills: ['frac', 'precalc.frac'], n: 20, accuracy: 0.8, medianMs: 9000 },
    concept: conceptFrom([(r) => Q.shadeFractionStep(r, [3, 4, 6]), Q.whichFractionStep, Q.equivalentStep]),
    transferCount: 5, drill: { game: 'precalc', selection: 'precalc:frac.add', label: 'Fraction sums' }, lessonId: 'l.pc-fractions',
  },
  DECIMALS_CHAPTER,
  {
    transfer: (r) => Q.transferFor(r, 9), key: 'ratio', title: 'Ratios', wing: 'river', wingName: 'Ratio River Locks',
    goal: 'Tell part:part from part:whole, fill a ratio table, and find a unit rate for a mixture or a barge load.',
    misconception: 'A ratio as "just a fraction"; mixing up part:part with part:whole; unit rate as a magic division.',
    teach: [
      { title: 'Part to part', text: 'The lock mixes 2 oil to 3 coolant: 2:3. That compares one part to the other part. The whole mix is 5 cups, so oil is 2/5 of the whole: part to whole.', steps: ['oil : coolant = 2 (cups of oil) : 3 (cups of coolant)', '2 (cups of oil) + 3 (cups of coolant) = 5 (cups in the whole mix)', 'So oil is 2 (cups of oil) out of 5 (cups in all): 2/5 (of the whole mix).'], visual: { type: 'ratio', parts: [{ label: 'oil', n: 2 }, { label: 'coolant', n: 3 }], unit: 'cups', known: { label: 'oil', amount: 2 }, ask: 'coolant' } as Visual },
      { title: 'Ratio tables', text: 'A ratio table keeps the mix the same while the batch grows. Multiply BOTH parts of the first row by the same number to make each new row.', steps: ['First row: 2 (cups of oil) to 3 (cups of coolant).', 'The next row has 4 cups of oil: 4 (cups of oil) ÷ 2 (cups of oil, first row) = 2 (scale factor). The batch is doubled.', 'Double the coolant too: 3 (cups of coolant, first row) × 2 (scale factor) = 6 (cups of coolant).'], next: 'Fill the blank on the table, then make a row with 6 oil.', model: { kind: 'ratiotable', labels: ['oil', 'coolant'], rows: [[2, 3], [4, null]] } },
      { title: 'Unit rate', text: 'A unit rate is the amount for ONE. Find it by dividing the total by how many. From the rate for one you can build any batch.', steps: ['4 barges carry 20 crates.', '20 (crates) ÷ 4 (barges) = 5 (crates per barge)', 'Any batch: 7 (barges) × 5 (crates per barge) = 35 (crates).'], next: 'How many crates do 3 barges carry?', visual: { type: 'share', total: 20, groups: 4 }, lessonId: 'l.rates-ratio' },
    ],
    quests: [
      { id: 'aq.ch9.river-mixture', name: 'River Mixture', giver: 'ada', guided: true, hook: 'A jammed lock needs a 2:3 oil:coolant mix. Ada: "Fill the table so every batch keeps the ratio, and the channel opens."', change: 'The first River lock unjams and the channel opens.',
        waves: [wave('Fill the table', times(3, Q.ratioTableStep)), wave('Part or whole', times(3, Q.partPartWholeStep)), wave('Per barge', times(2, Q.unitRateStep))] },
      { id: 'aq.ch9.barge-loads', name: 'Barge Loads', giver: 'brick', hook: 'Brick: "Barges leave on the hour. Unit rates, tables, and no guessing."', change: 'Barges run the River on schedule.',
        waves: [wave('Unit rates', times(3, Q.unitRateStep)), wave('Tables', times(3, Q.ratioTableStep)), wave('Part or whole', times(2, Q.partPartWholeStep))] },
    ],
    fluency: { label: 'Ratios & rates', skills: ['ratio', 'rates.ratio'], n: 15, accuracy: 0.8, medianMs: 10000 },
    concept: conceptFrom([Q.ratioTableStep, Q.partPartWholeStep, Q.unitRateStep]),
    transferCount: 5, drill: { game: 'rates', selection: 'rates:ratio', label: 'Mixture ratios' }, lessonId: 'l.rates-ratio',
  },
  {
    transfer: (r) => Q.transferFor(r, 10), key: 'prop', title: 'Proportions', wing: 'river', wingName: 'River Scale Locks',
    goal: 'Build chains of equivalent ratios, scale a recipe or drawing by a factor, and justify a cross-product check from equivalence.',
    misconception: 'Cross-multiplying as a chant with no equivalence story; scaling only one part of a ratio.',
    teach: [
      { title: 'Equivalent ratios', text: 'Equivalent ratios are the same mix in a bigger batch. Multiply BOTH parts by the same scale factor and the ratio does not change.', steps: ['Scale 3 : 8 by 2: 3 (resin) × 2 (scale factor) = 6 (resin) and 8 (hardener) × 2 (scale factor) = 16 (hardener), so 6 : 16.', 'Scale 3 : 8 by 3: 3 (resin) × 3 (scale factor) = 9 (resin) and 8 (hardener) × 3 (scale factor) = 24 (hardener), so 9 : 24.'], next: 'The table has 6 resin. What factor turned 3 (resin) into 6 (resin)? Use it on the 8 (hardener).', model: { kind: 'ratiotable', labels: ['resin', 'hardener'], rows: [[3, 8], [6, null]] } },
      { title: 'Scale factor', text: 'A blueprint at 1 : 5 makes every real length 5 times the drawing. 4 cm drawn is 20 cm built. Scale factor is the multiplier for every part.', steps: ['1 : 5 means 1 (cm drawn) stands for 5 (cm built).', 'Real length = drawn length × 5 (scale factor)', '4 (drawn length in cm) × 5 (scale factor) = 20 (real length in cm)'], visual: { type: 'bar', bars: [{ label: 'drawing', parts: [4] }, { label: 'real', parts: [4, 4, 4, 4, 4] }] } },
      { title: 'Why cross products work', text: 'If 2/3 = 4/6, then 2 (first top) × 6 (second bottom) = 3 (first bottom) × 4 (second top) = 12 (each cross product). Equal ratios have equal cross products because both sides carry the same scale factor. It is a check, not a trick.', visual: { type: 'balance', left: '2 × 6', right: '3 × 4', unknown: '=' } as Visual },
    ],
    quests: [
      { id: 'aq.ch10.scale-lock', name: 'The Scale Lock', giver: 'ada', guided: true, hook: 'Ada: "The sealant recipe is for one batch; the lock needs five. Scale every part or the seal fails."', change: 'The scale lock seals and the deep channel opens.',
        waves: [wave('Scale the batch', times(3, Q.scaleRecipeStep)), wave('Blueprints', times(3, Q.scaleDrawingStep)), wave('Cross check', times(2, Q.crossProductStep))] },
      { id: 'aq.ch10.blueprint-table', name: 'The Blueprint Table', giver: 'vector', hook: 'Vector: "Every drawing on this table is a ratio. Find the missing measure and prove it with cross products."', change: 'The village blueprint table is complete.',
        waves: [wave('Cross products', times(3, Q.crossProductStep)), wave('Drawings', times(3, Q.scaleDrawingStep)), wave('Batches', times(2, Q.scaleRecipeStep))] },
    ],
    fluency: { label: 'Proportions', skills: ['ratio', 'rates.ratio', 'prob.algebra'], n: 15, accuracy: 0.8, medianMs: 10000 },
    concept: conceptFrom([Q.scaleRecipeStep, Q.scaleDrawingStep, Q.crossProductStep]),
    transferCount: 5, drill: { game: 'rates', selection: 'rates:ratio', label: 'Mixture ratios' },
  },
  {
    transfer: (r) => Q.transferFor(r, 11), key: 'pct', title: 'Percentages', wing: 'village', wingName: 'Village Market',
    goal: 'Read percent as "out of 100", find a percent of an amount with a model, convert between fractions and percents, and work an increase and a decrease.',
    misconception: 'Percent as a third unrelated number system; ignoring "of"; using the new amount as the base of a change.',
    teach: [
      { title: 'Percent means out of 100', text: 'Percent means "out of 100": 40% is 40 out of 100. Any fraction can be renamed as hundredths. The bottom of 2/5 counts 5 equal pieces; the top counts 2 shaded ones. Keep that shaded amount and cut the whole into 100 pieces.', steps: ['100 (small pieces wanted) ÷ 5 (fifths) = 20 (small pieces per fifth), so cut each fifth into 20 small pieces.', '2 (shaded fifths) × 20 (small pieces per fifth) = 40 (shaded small pieces)', '2/5 = (2 × 20)/(5 × 20) = 40/100', '40/100 = 40% (shaded share)'], next: 'Before the next card: what is 1/5 as a percent?', visual: { type: 'fracbar', fracs: [{ n: 2, d: 5 }] } },
      { title: 'Make the bottom 100', text: 'What changes 5 into 100? 100 (small pieces wanted) ÷ 5 (fifths) = 20 (small pieces per fifth), so 5 (fifths) × 20 (small pieces per fifth) = 100 (small pieces). Cut EACH fifth into 20 equal smaller pieces. There are now 100 pieces in the whole.', visual: { type: 'card', title: 'Find the multiplier', lines: ['5 × ? = 100', '100 ÷ 5 = 20', '5 × 20 = 100'] } },
      { title: 'Same amount, new name', text: 'Each shaded fifth also splits into 20 pieces: 2 (shaded fifths) × 20 (small pieces per fifth) = 40 (shaded small pieces). Multiply top AND bottom by 20 to keep the same fraction value. Now 2/5 = 40/100 = 40% (shaded share). In decimals, this same amount is 0.40 (decimal share).', visual: { type: 'fracbar', fracs: [{ n: 2, d: 5 }], into: 100 } },
      { title: 'Percent of', text: 'Percent means out of 100: 25% is 25 out of every 100. "Of" means take that share of the whole. The whole amount is always 100%.', steps: ['Find 25% (the share to take) of 40 (total coins). The whole, 40 (coins), is 100% (all of it).', 'Quarter shortcut: four shares of 25% make 100%, so 25% is one of four equal shares.', '100% (whole) ÷ 25% (each share) = 4 (equal shares)', '40 (total coins) ÷ 4 (equal shares) = 10 (coins per share), so 25% of 40 coins is 10 (coins).', 'The dial: it is drawn as 20 (equal segments), one box each, standing for all 40 (coins). The 20 is just how many boxes this dial has.', '40 (total coins) ÷ 20 (equal segments) = 2 (coins per segment)', '100% (whole) ÷ 20 (equal segments) = 5% (share per segment)', '25% (share to take) ÷ 5% (share per segment) = 5 (segments to shade)', '5 (shaded segments) × 2 (coins per segment) = 10 (coins): the same answer both ways.'], next: 'New practice question: find 10% of the same 40 (total coins). 10% (share to take) ÷ 5% (share per segment) = 2 (segments to shade). Shade 2 boxes on the “Your turn” dial: how many coins do they stand for?', model: { kind: 'percent', of: 40, label: 'coins', example: 25 } },
      { title: 'Discount, then tariff', text: 'Two percents in a row: the second percent is OF the new amount, not of the start. Take the discount off first, then work out the tariff on the sale price.', steps: ['A cloak costs 80 (coins). The discount is 25% (off), then a tariff of 10% (tariff) is added on the sale price.', '25% (discount) of 80 (coins) = 20 (coins off)', '80 (coins) − 20 (coins off) = 60 (sale price)', '10% (tariff) of 60 (sale price) = 6 (tariff)', '60 (sale price) + 6 (tariff) = 66 (coins to pay)', 'Not the same as 15% (the difference) off: 15% of 80 (coins) = 12 (coins), and 80 (coins) − 12 (coins) = 68 (coins). The tariff was taken on the smaller sale price.'], next: 'Try next: a 40 coin lantern is 50% off, then a 10% tariff is added on the sale price. What do you pay?', visual: { type: 'pctsteps', start: 80, unit: 'coins', steps: [{ label: 'sale', pct: 25, kind: 'off' }, { label: 'tariff', pct: 10, kind: 'on' }], reveal: true } },
      { title: 'Up and down', text: 'A percent change is a percent OF the old amount. Work it out, then add it (up) or take it away (down).', steps: ['A tariff of 50 coins is raised 20%.', '20 (percent number) ÷ 100 (per hundred) = 0.2 (decimal share)', '0.2 (decimal share) × 50 (coins before) = 10 (coins of change)', 'Up: 50 (coins before) + 10 (coins of change) = 60 (coins after)', 'Cut by 20% instead: 50 (coins before) − 10 (coins of change) = 40 (coins after)'], next: 'A 40 coin toll rises 10%. What is 10% of 40, and what is the new toll?', visual: { type: 'bar', bars: [{ label: 'before', parts: [50] }, { label: '+20%', parts: [50, 10] }] } },
    ],
    quests: [
      { id: 'aq.ch11.market-tariff', name: 'The Market Tariff', giver: 'vector', guided: true, hook: 'The market boards show tariffs in percents and nobody can read them. Vector: "Make the bottom 100, keep the same amount, then read the percent."', change: 'The market boards light with readable tariffs.',
        waves: [wave('Make the bottom 100', Q.percentBridgeWave), wave('Try it yourself', Q.percentIndependentWave), wave('Use percent', mixOf([Q.percentOfStep, Q.percentOfStep, Q.percentChangeStep, Q.percentChangeStep]))] },
      { id: 'aq.ch11.plaques', name: 'Forest & River Plaques', giver: 'ada', hook: 'Ada: "The plaques along the Forest and River are marked in percents. Convert, find, raise, cut."', change: 'Every plaque on the Forest and River paths is legible.',
        waves: [wave('Make the bottom 100', Q.percentBridgeWave), wave('Try it yourself', Q.percentIndependentWave), wave('Use percent', mixOf([Q.percentOfStep, Q.percentOfStep, Q.percentChangeStep, Q.percentChangeStep]))] },
    ],
    fluency: { label: 'Percent', skills: ['percent', 'prob.outs', 'acad.arithmetic.pct'], n: 15, accuracy: 0.8, medianMs: 10000 },
    concept: conceptFrom([Q.percentOfStep, Q.fracToPercentStep, Q.percentChangeStep]),
    practice: Q.percentPracticeQuestion,
    transferCount: 5, drill: { game: 'academy', selection: 'academy:arithmetic.pct', label: 'Percentages: fractions, amounts and changes' },
  },
  {
    transfer: (r) => Q.transferFor(r, 12), key: 'exp', title: 'Exponents', wing: 'forge', wingName: 'Forge Scale Room',
    goal: 'Rewrite repeated multiplication as a power, read powers of ten on the gauges, and evaluate simple expressions with exponents.',
    misconception: 'Reading a^n as a × n; "add zeros" without the place-value link; skipping the order of operations.',
    teach: [
      { title: 'Repeated multiplication', text: '2 × 2 × 2 × 2 × 2 is 2 (base) to the power 5 (exponent), written 2^5 = 32. The exponent counts the multiplications. 2^5 is NOT 2 × 5.', model: { kind: 'power', bases: [2, 3, 5, 10], exps: [2, 3, 4, 5] } },
      { title: 'Powers of ten', text: '10^3 = 10 × 10 × 10 = 1000: 10 (base) multiplied 3 (exponent) times, a 1 with three zeros. Each ×10 shifts every digit one place left, which is exactly why the zeros appear.', next: 'What is 10^4? Count the zeros before you check.', visual: { type: 'pvchart', value: '3000', shift: 3 } as Visual, lessonId: 'l.spiral-powers' },
      { title: 'Order on the gauge', text: '3 × 2^2 is 3 × 4 = 12, not 6^2. Powers are worked before multiplying. Engine gauges read orders of magnitude the same way.', visual: { type: 'card', title: '3 × 2^2', lines: ['2^2 = 4 first', '3 × 4 = 12'] } as Visual, lessonId: 'l.pc-exponents' },
    ],
    quests: [
      { id: 'aq.ch12.scale-room', name: 'The Scale Room', giver: 'brick', guided: true, hook: 'Brick: "Forge gauges read in powers. Set each tower right or the furnace under-fires."', change: 'The Forge scale gauges read true.',
        waves: [wave('Set the tower', times(3, Q.writePowerStep)), wave('Read the gauge', times(3, Q.evaluatePowerStep)), wave('Powers of ten', times(2, Q.powerOfTenStep))] },
      { id: 'aq.ch12.magnitude', name: 'Orders of Magnitude', giver: 'vector', hook: 'Vector: "From one to a million in six steps of ten. Read every gauge in the room."', change: 'The furnace runs at full magnitude.',
        waves: [wave('Powers of ten', times(3, Q.powerOfTenStep)), wave('Evaluate', times(3, Q.evaluatePowerStep)), wave('Towers', times(2, Q.writePowerStep))] },
    ],
    fluency: { label: 'Exponents', skills: ['exponents', 'precalc.exp', 'spiral.powers'], n: 15, accuracy: 0.8, medianMs: 8000 },
    concept: conceptFrom([Q.writePowerStep, Q.evaluatePowerStep, Q.powerOfTenStep]),
    transferCount: 5, drill: { game: 'precalc', selection: 'precalc:exp', label: 'Exponent rules' }, lessonId: 'l.pc-exponents',
  },
  {
    transfer: (r) => Q.transferFor(r, 13), key: 'roots', title: 'Roots', wing: 'forge', wingName: 'Forge Panel Vault',
    goal: 'Find a side from a square area, check by squaring, estimate a root between two perfect squares, and meet one cube root.',
    misconception: 'Square root as "divide by 2"; calculator answers with no inverse check; area and side never linked.',
    teach: [
      { title: 'Side from area', text: 'A square panel of area 49 has side 7, because 7 (side) × 7 (side) = 49 (area). The square root undoes squaring: √49 = 7 (side).', model: { kind: 'root', area: 49 } },
      { title: 'Perfect squares first', text: 'A perfect square is a whole number times itself. Know the list and every square root becomes a multiplication you already own.', steps: ['1² = 1, 2² = 4, 3² = 9, 4² = 16, 5² = 25, 6² = 36', '7² = 49, 8² = 64, 9² = 81, 10² = 100, 11² = 121, 12² = 144', 'The 6 by 6 grid: 6 (squares per side) × 6 (squares per side) = 36 (squares), so √36 = 6 (squares per side).', '√49: which number times itself is 49? 7 (side) × 7 (side) = 49 (area), so √49 = 7 (side).'], next: 'Use the list: what is √81?', visual: { type: 'array', rows: 6, cols: 6 } },
      { title: 'Between two perfects', text: '√50 is not whole. 49 < 50 < 64, so √50 sits between 7 and 8, just above 7. Estimate first; then check by squaring.', steps: ['7 × 7 = 49 and 8 × 8 = 64', '49 < 50 < 64, so √50 is between 7 and 8.', '50 is only 1 more than 49, so √50 is just above 7.'], visual: { type: 'card', title: '√50', lines: ['7² = 49', '8² = 64', 'so 7 < √50 < 8'] } as Visual, lessonId: 'l.pc-exponents' },
    ],
    quests: [
      { id: 'aq.ch13.panel-vault', name: 'The Panel Vault', giver: 'brick', guided: true, hook: 'Brick: "Square panels, area stamped on each. I need side lengths, and I need them checked."', change: 'The vault panels fit their frames.',
        waves: [wave('Side from area', times(3, Q.sideFromAreaStep)), wave('Check by squaring', times(3, Q.squareCheckStep)), wave('Between which two', times(2, Q.estimateRootStep))] },
      { id: 'aq.ch13.cube-crate', name: 'The Cube Crate', giver: 'ada', hook: 'Ada: "Estimate, then prove. And one crate is a cube: edge times edge times edge."', change: 'The Forge vault seals with a cube keystone.',
        waves: [wave('Estimate', times(3, Q.estimateRootStep)), wave('Sides', times(3, Q.sideFromAreaStep)), wave('Cube teaser', times(1, Q.cubeTeaserStep))] },
    ],
    fluency: { label: 'Roots', skills: ['exponents', 'precalc.roots', 'trick.sq5'], n: 15, accuracy: 0.8, medianMs: 8000 },
    concept: conceptFrom([Q.sideFromAreaStep, Q.estimateRootStep, Q.squareCheckStep]),
    transferCount: 5, drill: { game: 'precalc', selection: 'precalc:roots', label: 'Square roots' },
  },
  {
    transfer: (r) => Q.transferFor(r, 14), key: 'fluency', title: 'Fluency & Transfer', wing: 'capstone', wingName: 'Workshop Capstone',
    goal: 'Mix every operation across the whole stack on novel engineering problems: whole numbers, fractions, decimals, ratios, percents, powers and roots.',
    misconception: 'Keyword hunting; speed without understanding; freezing on an unfamiliar story; practising only + − × ÷ and ignoring the later families.',
    teach: [
      { title: 'Four detective questions', text: 'What do I know? What am I asked? Is it joining, separating, grouping or sharing, or a part of a whole? What layout shows it? Draw the bar or the table before you compute.', steps: ['12 bolts are shared by 3 crews. Know: 12 bolts, 3 crews. Asked: bolts per crew.', 'Sharing means divide: 12 (bolts) ÷ 3 (crews) = 4 (bolts per crew).'], visual: { type: 'bar', bars: [{ label: 'bolts', parts: ['?', '?', '?'] }], whole: 12 }, lessonId: 'l.word-detective' },
      { title: 'Multi-step repairs', text: 'An Engine repair often takes two steps: find the parts, then combine them. 5 crates hold 8 parts each, and 12 parts get used. Do one step at a time and write the layout: (5 × 8) − 12.', steps: ['Step 1: 5 (crates) × 8 (parts per crate) = 40 (parts)', 'Step 2: 40 (parts) − 12 (parts used) = 28 (parts left)', 'So (5 × 8) − 12 = 28 (parts left)'], visual: { type: 'card', title: 'Two steps', lines: ['5 crates × 8 = 40', '40 − 12 used = 28'] } as Visual, lessonId: 'l.word-twostep' },
      { title: 'The whole stack', text: 'Fractions, decimals, ratios and percents are all "part of a whole" in different clothes. Powers and roots are multiplication and its inverse. Here is one question in three outfits.', steps: ['Fraction: 25% is 1/4 (one of four equal parts).', '1/4 of 40: 40 (whole amount) ÷ 4 (equal parts) = 10 (one part)', 'Decimal: 0.25 (decimal share) × 40 (whole amount) = 10 (the part)', 'Percent: 25 (percent number) ÷ 100 (per hundred) × 40 (whole amount) = 10 (the part)'], next: 'Now find 50% of 60 all three ways.', visual: { type: 'fracbar', fracs: [{ n: 1, d: 4, label: '1/4' }, { n: 25, d: 100, label: '25%' }] } as Visual },
    ],
    quests: [
      { id: 'aq.ch14.workshop-orders', name: 'Workshop Orders', giver: 'ada', guided: true, hook: 'Ada: "Ten orders on the workshop board, every kind of math on them. Read, draw, solve."', change: 'The workshop order board is cleared.',
        waves: [wave('Stories', (r) => [Q.wordStep(r, 'add', 3), Q.wordStep(r, 'sub', 3), Q.wordStep(r, 'mult', 3), Q.wordStep(r, 'div', 3)]), wave('Parts of a whole', mixOf([Q.fractionOfStep, decimalMixedStep, Q.percentOfStep, Q.ratioTableStep])), wave('Powers', mixOf([Q.evaluatePowerStep, Q.sideFromAreaStep]))] },
      { id: 'aq.ch14.engine-repairs', name: 'Engine Repairs', giver: 'vector', hook: 'Vector: "Two-step repairs, mixed families, no keyword hunting. This is what graduation feels like."', change: 'The Engine hums at three-quarter power.',
        waves: [wave('Two steps', times(3, (r) => Q.wordStep(r, 'twostep', 3))), wave('Mixed stack', mixOf([Q.percentOfStep, Q.crossProductStep, Q.ratioTableStep, decimalMixedStep, Q.powerOfTenStep])), wave('Roots and rates', mixOf([Q.estimateRootStep, Q.unitRateStep]))] },
    ],
    fluency: { label: 'Mixed problems', skills: ['word', 'mult.applied', 'div.applied', 'mult.multistep'], n: 15, accuracy: 0.8, medianMs: 15000 },
    concept: conceptFrom([(r) => Q.wordStep(r, 'mixed', 3), Q.fractionOfStep, Q.percentOfStep, Q.ratioTableStep]),
    transferCount: 10, drill: { game: 'word', selection: 'word:mixed', label: 'Mixed word problems' }, lessonId: 'l.word-detective',
  },
  {
    transfer: (r) => Q.transferFor(r, 15), key: 'trial', title: 'Mastery Trial & Graduation', wing: 'capstone', wingName: 'The Engine Chamber',
    goal: 'Prove durable competence under trial rules across the full arithmetic stack. Seat the Arithmetic Power Core and open Algebra City.',
    misconception: 'One lucky run is mastery; skipping weak-fact repair; treating the Dungeon, Forest and River as things to do later.',
    teach: [
      { title: 'Trial rules', text: 'Five phases covering every chapter, from whole numbers to decimals to roots, one helper you may use once. Pass at 80% or better. Every chapter must already be mastered and your critical weak facts cleared.', visual: { type: 'card', title: 'The Mastery Trial', lines: ['Whole numbers · Fractions & decimals', 'Ratios & percent · Powers & roots', 'Transfer'] } as Visual },
    ],
    quests: [
      { id: 'aq.ch15.rehearsal', name: 'Trial Rehearsal', giver: 'vector', guided: true, hook: 'Vector: "Before the Chamber, a rehearsal. Same shape, no stakes."', change: 'The Engine Chamber doors unbar.',
        waves: [wave('Whole numbers', mixOf([(r) => Q.addTypedStep(r, 20), (r) => Q.subTypedStep(r, 20), (r) => Q.factStep(r, [6, 7, 8]), (r) => Q.divFactStep(r, [6, 7, 8])])), wave('Parts of a whole', mixOf([Q.addSameDenomStep, decimalMixedStep, Q.ratioTableStep, Q.percentOfStep])), wave('Powers', mixOf([Q.evaluatePowerStep, Q.sideFromAreaStep]))] },
      { id: 'aq.ch15.keeper', name: 'The Chamber Keeper', giver: 'brick', hook: 'Brick: "The Keeper asks anything from anywhere. Answer like you own it."', change: 'The Keeper steps aside.',
        waves: [wave('Anything', (r) => [Q.transferFor(r, 3), Q.transferFor(r, 6), Q.transferFor(r, 8), decimalTransferStep(r), Q.transferFor(r, 11)]), wave('Anywhere', (r) => [Q.transferFor(r, 9), Q.transferFor(r, 12), Q.transferFor(r, 13), Q.transferFor(r, 14)]), wave('Show me', (r) => [Q.ratioTableStep(r), Q.sideFromAreaStep(r)])] },
    ],
    fluency: { label: 'Whole stack', skills: ['mult', 'div', 'add.basic', 'sub.basic', 'frac', 'acad.arithmetic.dec', 'ratio', 'percent', 'exponents'], n: 20, accuracy: 0.8, medianMs: 10000 },
    concept: conceptFrom([Q.whichEqualStep, Q.whichFractionStep, Q.partPartWholeStep]),
    transferCount: 5, drill: { game: 'mixed', selection: 'mixed:all', label: 'Everything mixed' },
  },
];

export const ARITHMETIC = defineAcademy({
  id: 'arithmetic',
  name: 'Arithmetic Academy',
  short: 'Arithmetic',
  tier: 'Foundational',
  blurb: 'Counting to roots: whole numbers, fractions, decimals, ratios, percents, powers.',
  icon: 'reactor',
  home: 'village',
  wings: {
    village: { name: 'Arithmetic Village', icon: 'home' },
    mines: { name: 'Multiplication Mines', icon: 'pickaxe' },
    division: { name: 'Division Dungeon', icon: 'divide' },
    forest: { name: 'Fraction Forest', icon: 'crystal' },
    river: { name: 'Ratio River', icon: 'compass' },
    forge: { name: "Dragon's Forge", icon: 'dragon' },
    capstone: { name: 'The Engine', icon: 'reactor' },
  },
  chapters: CHAPTER_SPECS,
  trial: (rng) => [
    { name: 'Whole numbers', items: [Q.addTypedStep(rng, 20), Q.subTypedStep(rng, 20), Q.buildArrayStep(rng, [6, 7, 8], true), Q.factStep(rng, [6, 7, 8, 9], 'choose'), Q.divFactStep(rng, [6, 7, 8]), Q.shareStep(rng, [7, 8, 9]), Q.splitAttackStep(rng), Q.inverseOpsStep(rng)] },
    { name: 'Fractions & decimals', items: [Q.shadeFractionStep(rng, [3, 4, 6, 8]), Q.equivalentStep(rng), Q.compareFractionsStep(rng), Q.addSameDenomStep(rng), Q.fractionOfStep(rng), ...decimalTrialSteps(rng)] },
    { name: 'Ratios & percent', items: [Q.ratioTableStep(rng), Q.partPartWholeStep(rng), Q.crossProductStep(rng), Q.percentOfStep(rng), Q.percentChangeStep(rng)] },
    { name: 'Powers & roots', items: [Q.writePowerStep(rng), Q.evaluatePowerStep(rng), Q.powerOfTenStep(rng), Q.sideFromAreaStep(rng), Q.estimateRootStep(rng)] },
    { name: 'Transfer', items: [Q.wordStep(rng, 'twostep', 3), Q.wordStep(rng, 'mixed', 3)] },
  ],
  trialIntro: 'The Mastery Trial. Five phases across the whole stack, one helper, 80% to pass. The Engine is listening.',
  coreName: 'Arithmetic Power Core',
  coreLine: 'Counting to roots, the whole stack. The Engine turns at full arithmetic power, a graduation banner unfurls over the village, and the road to Algebra City lights.',
  coreColor: '#fde68a',
  title: 'Arithmetic Graduate',
});

