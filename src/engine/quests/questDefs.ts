import type { QuestDef } from '../types';

/**
 * Version 1 quest line. Story quests advance the Mathematical Engine plot; training,
 * engineering, rescue and exploration quests branch off it. Daily quests are generated.
 */
export const QUESTS: QuestDef[] = [
  {
    id: 'q.awakening', kind: 'story', name: 'The Silent Engine', giver: 'vector',
    summary: 'Speak with Professor Vector in Arithmetic Village.',
    story: 'The Engine has stopped. Professor Vector thinks you can fix it — one piece at a time.',
    objectives: [{ id: 'talk', type: 'talk', npcId: 'vector', text: 'Talk to Professor Vector' }],
    reward: { xp: 40, items: [{ itemId: 'repair-kit', qty: 2 }], unlocksRegion: 'mines' },
  },
  {
    id: 'q.first-principles', kind: 'story', name: 'First Principles (optional)', giver: 'vector',
    summary: 'Any time: take Vector\'s short lesson "What Multiplication Is".',
    story: 'What IS multiplication? Equal groups. Vector explains it in five minutes — whenever you want to know why the tricks work.',
    objectives: [{ id: 'lesson', type: 'lesson', lessonId: 'l.mult-intro', text: 'Complete "What Multiplication Is"' }],
    reward: { xp: 80, items: [{ itemId: 'apprentice-goggles', qty: 1 }] },
    after: ['q.awakening'],
  },
  {
    id: 'q.into-the-mines', kind: 'story', name: 'Into the Mines', giver: 'brick',
    summary: 'Defeat 3 creatures in the Multiplication Mines.',
    story: 'Slimes and goblins took the upper galleries. Clear three of them.',
    objectives: [{ id: 'defeat', type: 'defeat', count: 3, text: 'Defeat 3 mine creatures' }],
    reward: { xp: 120, items: [{ itemId: 'iron-bolt', qty: 10 }] },
    after: ['q.awakening'],
  },
  {
    id: 'q.bridge', kind: 'engineering', name: 'Repair the Bridge', giver: 'ada',
    summary: 'Rebuild the bridge to the deep galleries using applied multiplication.',
    story: 'The bridge is down. Every stage of the repair is a multiplication problem.',
    objectives: [{ id: 'mission', type: 'mission', missionId: 'm.bridge', text: 'Complete the bridge construction mission' }],
    reward: { xp: 150, items: [{ itemId: 'copper-gear', qty: 5 }] },
    after: ['q.into-the-mines'],
  },
  {
    id: 'q.foreman-drill', kind: 'training', name: "Foreman's Drill", giver: 'brick',
    summary: 'Complete a 30-problem mixed multiplication drill with 90% accuracy.',
    story: '"Fast AND right," says Brick. Thirty mixed facts at the Training Grounds.',
    objectives: [{ id: 'drill', type: 'drill', skillPrefix: 'mult', count: 30, accuracy: 0.9, text: '30 mixed multiplication problems at 90%+' }],
    reward: { xp: 150, items: [{ itemId: 'focus-tonic', qty: 2 }] },
    after: ['q.into-the-mines'],
  },
  {
    id: 'q.hard-facts', kind: 'training', name: 'The Hard Facts', giver: 'vector',
    summary: 'Complete the lesson on 6, 7 and 8 and bring the ×7 table to 70%.',
    story: '6×7, 7×8, 6×8. Vector has a trick for each.',
    objectives: [
      { id: 'lesson', type: 'lesson', lessonId: 'l.hard-facts', text: 'Complete "The Hard Facts"' },
      { id: 'mastery', type: 'mastery', skillId: 'mult.7', mastery: 70, text: '×7 table to 70% mastery' },
    ],
    reward: { xp: 200, items: [{ itemId: 'ore-crystal', qty: 3 }] },
    after: ['q.into-the-mines'],
  },
  {
    id: 'q.lost-ledger', kind: 'exploration', name: 'The Lost Ledger', giver: 'vector',
    summary: 'Reach the fourth gallery of the mines and recover the Lost Ledger.',
    story: 'An old counting book is lost in Hexstone Hall. Bring it back.',
    objectives: [{ id: 'depth', type: 'depth', regionId: 'mines', depth: 4, text: 'Clear Gallery 4 (Hexstone Hall)' }],
    reward: { xp: 120, items: [{ itemId: 'lost-ledger', qty: 1 }] },
    after: ['q.into-the-mines'],
  },
  {
    id: 'q.pump', kind: 'rescue', name: 'Pump Failure', giver: 'ada',
    summary: 'Repair the village water pump — a division emergency.',
    story: "The village pump has failed and the cisterns must be shared out fairly. Ada needs quick division: multiplication run backwards.",
    objectives: [
      { id: 'lesson', type: 'lesson', lessonId: 'l.division-link', text: 'Complete "Multiplication in Reverse"' },
      { id: 'mission', type: 'mission', missionId: 'm.pump', text: 'Complete the pump repair mission' },
    ],
    reward: { xp: 160, items: [{ itemId: 'energy-cell', qty: 2 }] },
    after: ['q.bridge'],
  },
  {
    id: 'q.forge-key', kind: 'story', name: 'The Forge Key', giver: 'brick',
    summary: 'Clear the eighth gallery and bring multiplication mastery to 75%.',
    story: 'Clear Gallery 8 and reach 75% mastery. Then the Forge opens.',
    objectives: [
      { id: 'depth', type: 'depth', regionId: 'mines', depth: 8, text: 'Clear Gallery 8 (The Sentinel Vault)' },
      { id: 'mastery', type: 'mastery', skillId: 'mult', mastery: 75, text: 'Overall multiplication mastery 75%' },
    ],
    reward: { xp: 250, items: [{ itemId: 'forge-key', qty: 1 }], unlocksRegion: 'forge' },
    after: ['q.into-the-mines'],
  },
  {
    id: 'q.power-core-1', kind: 'boss', name: 'Power Core I: Multiplication', giver: 'vector',
    summary: 'Defeat the Multiplication Dragon and recover the first power core.',
    story: '50 facts. 5 misses allowed. Win to restore the first power core.',
    objectives: [{ id: 'boss', type: 'boss', enemyId: 'multiplication-dragon', text: 'Defeat the Multiplication Dragon' }],
    reward: { xp: 500, unlocksRegion: 'division', unlocksLab: 'measurement-bench', title: 'Core Bearer' },
    after: ['q.forge-key'],
  },
  {
    id: 'q.forgotten', kind: 'training', name: 'Nothing Forgotten', giver: 'vector',
    summary: 'Clear the Dungeon of Forgotten Knowledge once.',
    story: 'Your mistakes gather in a crypt under the village. Go face them.',
    objectives: [{ id: 'defeat', type: 'defeat', enemyId: 'forgotten-specter', count: 5, text: 'Defeat 5 Forgotten Specters' }],
    reward: { xp: 150, items: [{ itemId: 'focus-tonic', qty: 1 }] },
    after: ['q.into-the-mines'],
  },
  {
    id: 'q.division-dungeon', kind: 'story', name: 'The Halls of Halves', giver: 'vector',
    summary: 'Defeat 6 Division Imps in the Division Dungeon.',
    story: 'The first core is back. Now every fact runs backwards.',
    objectives: [{ id: 'defeat', type: 'defeat', enemyId: 'division-imp', count: 6, text: 'Defeat 6 Division Imps' }],
    reward: { xp: 250, items: [{ itemId: 'brass-plate', qty: 3 }] },
    after: ['q.power-core-1'],
  },
  {
    id: 'q.fraction-forest', kind: 'story', name: 'The Fraction Hydra', giver: 'ada',
    summary: 'Clear the three groves of Fraction Forest, then defeat the Fraction Hydra.',
    story: 'Past the mines the trees grow in equal parts. Every creature there is a fraction — and a three-headed Hydra guards the Fraction Core.',
    objectives: [
      { id: 'depth', type: 'depth', regionId: 'fraction-forest', depth: 3, text: 'Clear the three groves' },
      { id: 'boss', type: 'boss', enemyId: 'fraction-hydra', text: 'Defeat the Fraction Hydra' },
    ],
    reward: { xp: 400, items: [{ itemId: 'focus-tonic', qty: 2 }], title: 'Fraction Tamer' },
    after: ['q.into-the-mines'],
    sequential: true,
  },
  {
    id: 'p.workshop', kind: 'project', name: 'Project I: Build a Workshop', giver: 'ada',
    summary: 'Gather materials and complete the construction problems to raise your workshop.',
    story: 'A real engineer needs a real workshop. Gather bolts and beams, then build.',
    objectives: [
      { id: 'bolts', type: 'collect', itemId: 'iron-bolt', count: 24, text: 'Collect 24 Iron Bolts' },
      { id: 'timber', type: 'collect', itemId: 'timber', count: 4, text: 'Collect 4 Timber Beams' },
      { id: 'mission', type: 'mission', missionId: 'm.workshop', text: 'Complete the workshop construction mission' },
    ],
    reward: { xp: 300, unlocksLab: 'workshop', items: [{ itemId: 'brass-calipers', qty: 1 }] },
    after: ['q.bridge'],
  },
];

export const questById = (id: string) => QUESTS.find((q) => q.id === id);
