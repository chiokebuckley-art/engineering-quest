/**
 * ENGINEERING QUEST — shared domain types.
 * Pure data definitions; no React, no DOM.
 */

export type SkillId = string;
export type FactId = string;
export type WorldId = string;
export type RegionId = string;
export type QuestId = string;
export type ItemId = string;
export type EnemyId = string;
export type LessonId = string;
export type NpcId = string;
export type AchievementId = string;

/** Mastery band labels as specified by the curriculum design. */
export type MasteryBand = 'Learning' | 'Developing' | 'Competent' | 'Nearly Mastered' | 'Mastered';

export type Difficulty = 1 | 2 | 3 | 4 | 5 | 6;

export type WorldStatus = 'playable' | 'preview' | 'distant';

export interface World {
  id: WorldId;
  order: number;
  name: string;
  subtitle: string;
  description: string;
  /** Visual era — drives the theme of the world's regions. */
  era: 'wood' | 'stone' | 'metal' | 'machines' | 'electric' | 'automation' | 'laboratory' | 'future';
  status: WorldStatus;
  skills: SkillId[];
}

export interface SkillRequirement {
  skillId: SkillId;
  mastery: number; // 0-100
}

export type GeneratorId =
  | 'mult.table'
  | 'mult.mixed'
  | 'mult.missing'
  | 'mult.applied'
  | 'mult.multistep'
  | 'div.table'
  | 'div.mixed'
  | 'div.applied'
  | 'bonds'
  | 'alg.onestep'
  | 'alg.evaluate'
  | 'word'
  | 'tricks'
  | 'mental'
  | 'volume'
  | 'measure'
  | 'geo'
  | 'rates'
  | 'fit'
  | 'phys'
  | 'pipe'
  | 'prob'
  | 'spiral'
  | 'precalc'
  | 'mentalmath'
  | 'odds'
  | 'add.basic'
  | 'sub.basic'
  | 'academy'
  | 'pattern' | 'blocks' | 'paths' | 'data' | 'logic' | 'pctmulti' | 'grid'
  | 'none';

export interface Skill {
  id: SkillId;
  name: string;
  shortName?: string;
  description: string;
  worldId: WorldId;
  /** Skill(s) that must be developed before this skill is recommended. */
  prerequisites: SkillRequirement[];
  /** Atomic facts tracked individually for this skill (e.g. 6×1 … 6×12). */
  facts?: FactId[];
  generator: GeneratorId;
  generatorParams?: Record<string, number | string | number[]>;
  /** Suggested response time (ms) for a fluent answer; used for speed scoring once accuracy is high. */
  targetTimeMs: number;
  /** Position in the skill tree (column, row). */
  tree: { x: number; y: number };
  /** Skill this hangs under visually in the tree. */
  parent?: SkillId;
  /** Engineering reason this skill matters. */
  whyItMatters: string;
  implemented: boolean;
}

export type RegionKind = 'town' | 'dungeon' | 'lair' | 'lab' | 'wilds' | 'facility' | 'frontier';

export interface Region {
  id: RegionId;
  worldId: WorldId;
  name: string;
  kind: RegionKind;
  description: string;
  /** Position on the world map, in percent of map width/height. */
  map: { x: number; y: number };
  environment: string; // asset path
  requirements: SkillRequirement[];
  /** Quests that must be complete before entry (in addition to skill requirements). */
  requiredQuests?: QuestId[];
  implemented: boolean;
  icon: string;
}

/* ------------------------------------------------------------------ */
/* Questions                                                           */
/* ------------------------------------------------------------------ */

export type Visual =
  /** `highlightRows` / `highlightCols` shade the first rows / columns to show a split, e.g. 8 columns = 5 + 3. */
  | { type: 'array'; rows: number; cols: number; highlightRows?: number; highlightCols?: number }
  | { type: 'groups'; groups: number; perGroup: number }
  | { type: 'numberline'; step: number; count: number; max: number }
  | { type: 'share'; total: number; groups: number }
  | { type: 'bond'; total: number; part: number }
  | { type: 'balance'; left: string; right: string; unknown: string }
  | { type: 'bar'; bars: { label?: string; parts: (number | '?')[] }[]; whole?: number | '?' }
  | { type: 'jumps'; from: number; jumps: number[] }
  /** Volume: a stack of unit cubes l × w × h. */
  | { type: 'cubes'; l: number; w: number; h: number }
  /** Volume: a labelled box; `hide` blanks one dimension with a '?'. */
  | { type: 'box'; l: number; w: number; h: number; unit: string; hide?: 'l' | 'w' | 'h' }
  /** Volume: a measuring jug with labels every `major`, `divisions` spaces between labels, filled to `level`. */
  | { type: 'beaker'; capacity: number; major: number; divisions: number; level: number; unit: string }
  /** Volume: two jugs, before and after an object is dropped in. */
  | { type: 'displace'; capacity: number; major: number; divisions: number; before: number; after: number; unit: string }
  /** Measurement: a ruler (cm with mm marks, or inches split into `divisions`) with an object from `start` to `end` in the smallest unit. */
  | { type: 'ruler'; unit: 'cm' | 'in'; length: number; start: number; end: number; divisions?: 8 | 16; label?: string }
  /** Measurement: a round dial (scale, gauge) reading `value`. */
  | { type: 'dial'; max: number; major: number; divisions: number; value: number; unit: string }
  /** Measurement: a thermometer. */
  | { type: 'thermometer'; min: number; max: number; major: number; divisions: number; value: number; unit: string }
  /** Measurement: two clock faces, times in minutes after midnight. */
  | { type: 'clocks'; start: number; end: number }
  /** Measurement: a labelled reference bar and an unlabelled target bar, for estimating. */
  | { type: 'refbar'; ref: number; refLabel: string; target: number; targetLabel: string; unit: string }
  /** Measurement: one big unit drawn as n small units: a line (dims 1), a tiled square (2) or a cube (3). */
  | { type: 'units'; big: string; small: string; n: number; dims: 1 | 2 | 3 }
  /** Measurement: a rectangle; `ask` highlights the fence around it or the tiles inside it. */
  | { type: 'rect'; w: number; h: number; unit: string; ask: 'perimeter' | 'area'; grid?: boolean }
  /** Measurement: two objects to compare; `units` draws unit blocks under the first. */
  | { type: 'compare'; a: { label: string; len: number }; b: { label: string; len: number }; unit: string; units?: boolean }
  /* ---- shapes & angles ---- */
  | { type: 'protractor'; angle: number }
  | { type: 'angles'; shape: 'line' | 'point' | 'triangle' | 'right'; known: number[] }
  | { type: 'circle'; r: number; unit: string; show: 'r' | 'd'; wheel?: boolean }
  | { type: 'rtri'; a: number; b: number; c: number; hide: 'a' | 'b' | 'c'; unit: string; context: 'ramp' | 'brace' | 'ladder' }
  | { type: 'slope'; rise: number; run: number; unit: string; hide?: 'rise' | 'run' }
  | { type: 'cylinder'; r: number; h: number; unit: string; label?: string }
  | { type: 'plan'; w: number; h: number; scale: number; unit: string; hide?: boolean }
  /* ---- rates ---- */
  | { type: 'ratio'; parts: { label: string; n: number }[]; unit: string; known: { label: string; amount: number }; ask: string }
  | { type: 'pairrule'; a: { unit: string; n: number }; b: { unit: string; n: number } }
  | { type: 'ftri'; top: string; left: string; right: string; known: Record<string, string>; ask: string }
  | { type: 'flowtank'; capacity: number; rate: number; minutes: number; ask: 'time' | 'volume' | 'rate' }
  | { type: 'chain'; start: string; factors: [string, string][]; result: string }
  /* ---- precision & fit ---- */
  | { type: 'caliper'; value: number }
  | { type: 'micrometer'; value: number }
  | { type: 'fit'; nominal: number; tol: number; measured?: number; unit: string }
  | { type: 'feeler'; blades: number[] }
  | { type: 'thread'; pitch: number; length: number; unit: string }
  | { type: 'bolt'; thread: number; flats: number; hide: 'thread' | 'flats' }
  | { type: 'stack'; parts: { nominal: number; tol: number }[] }
  | { type: 'card'; title: string; lines: string[] }
  | { type: 'digits'; value: string; sig: number }
  /* ---- forces & power ---- */
  | { type: 'hang'; mass: number; unit: string; show: 'mass' | 'weight' }
  | { type: 'torque'; force: number; arm: number; unit: string; hide?: 'force' | 'arm' }
  | { type: 'lever'; f1: number; d1: number; f2: number; d2: number; hide: 'f1' | 'd1' | 'f2' | 'd2' }
  | { type: 'piston'; force: number; area: number }
  | { type: 'head'; height: number; unit: string; hide?: boolean }
  | { type: 'push'; force: number; distance: number; hide?: 'force' | 'distance' }
  | { type: 'circuit'; v: number; i: number; r: number; ask: 'v' | 'i' | 'r' | 'p' }
  | { type: 'expand'; length: number; dT: number; material: string; growth: number }
  /* ---- plumbing ---- */
  | { type: 'pipesection'; od: number; id: number; nominal: string; ask: 'wall' | 'od' | 'id' }
  | { type: 'piperoute'; cc: number; takeoffs: [number, number] }
  | { type: 'route'; segs: number[] }
  | { type: 'offset'; offset: number; angle: number; hide?: 'run' }
  /* ---- probability ---- */
  | { type: 'oddsbar'; a: number; b: number }
  | { type: 'counttree'; levels: number[] }
  | { type: 'dicegrid'; total: number }
  | { type: 'tree'; root: string; branches: { label: string; p: number; children?: { label: string; p: number }[] }[] }
  | { type: 'table2'; rows: [string, string]; cols: [string, string]; n: [[number, number], [number, number]]; highlightRow?: number; highlightCol?: number }
  | { type: 'dots'; values: number[]; mean: number; sd?: number }
  | { type: 'lln'; p: number; n: number }
  | { type: 'bell'; z: number; shade: 'none' | 'below' | 'above' | 'tails'; mu?: number; sigma?: number }
  | { type: 'bars'; title: string; values: { label: string; v: number }[]; highlight?: number; highlightFrom?: number; highlightTo?: number }
  | { type: 'scatter'; a: number; b: number; x: number; x2?: number }
  | { type: 'logistic'; z: number }
  | { type: 'matrix'; rows: number[][]; vec: number[]; label: string }
  | { type: 'elo'; diff: number }
  | { type: 'markov'; states: string[]; p: number; q: number }
  | { type: 'walk'; p: number; steps: number }
  | { type: 'hist'; p: number; sims: number }
  | { type: 'kelly'; p: number; b: number }
  /* ---- composite solids ---- */
  /** A solid built from axis-aligned boxes on a grid; `ghost` is the piece cut away in the subtract method. */
  | { type: 'solid'; parts: { x: number; y: number; z: number; l: number; w: number; h: number; label?: string }[]; ghost?: { x: number; y: number; z: number; l: number; w: number; h: number; label?: string }; unit: string; showLabels?: boolean }
  /* ---- spiral review ---- */
  /** A place-value chart with one number placed in it, optionally showing a shift of `shift` places. */
  | { type: 'pvchart'; value: string; shift?: number; highlight?: number }
  /** A partial-quotients area model: rows of (partial quotient, product), with one optionally blank. */
  | { type: 'areamodel'; divisor: number; rows: { q: number; product: number }[]; blank?: number; total?: number }
  /** Numbered options a learner picks between, with an optional estimate line. */
  | { type: 'options'; items: string[]; note?: string }
  /* ---- calculus prep ---- */
  /** Fraction bars: each fraction drawn as a strip cut into `d` parts with `n` shaded, optionally re-cut into `into` parts. */
  | { type: 'fracbar'; fracs: { n: number; d: number; label?: string }[]; into?: number; op?: string }
  /** A coordinate grid with a line through two points (and optionally a marked x). */
  | { type: 'grid'; points: [number, number][]; line?: { m: number; b: number }; markX?: number; range?: number }
  /** A right triangle with the angle θ marked, sides named opposite / adjacent / hypotenuse. */
  | { type: 'trirat'; opp: number | '?'; adj: number | '?'; hyp: number | '?'; theta?: number | '?'; unit?: string }
  // Academies: graphs, the unit circle, signed number lines, geometry diagrams, matrices
  | { type: 'plot'; range: [number, number, number, number]; layers: import('./academy/types').PlotLayers; w?: number; h?: number }
  | { type: 'unitcircle'; angle?: number; showCoords?: boolean; radians?: boolean }
  | { type: 'numline'; min: number; max: number; step?: number; points?: { x: number; label?: string; open?: boolean }[]; ray?: { from: number; dir: 'left' | 'right'; open: boolean }; segment?: { from: number; to: number; openLeft?: boolean; openRight?: boolean }; jumps?: { from: number; to: number }[] }
  | { type: 'geo'; items: import('./academy/types').GeoItem[]; w?: number; h?: number }
  | { type: 'mat'; mats: { rows: (number | string)[][]; label?: string }[]; ops?: string[] }
  /** Contest Path pictures (patterns, blocks, counting, data, logic, multi-step %, grids): see engine/contest/visuals.ts. */
  | import('./contest/visuals').ContestVisual
  | { type: 'none' };

/** A tap-to-answer option. Its `value` is what is submitted and checked, so a typed answer still works anywhere choices are not drawn. */
export interface QuestionChoice { value: number; label: string; visual?: Visual }

export interface Question {
  id: string;
  /** The skill whose mastery record this question feeds. */
  masterySkillId: SkillId;
  /** The atomic fact (if any) this question tests, e.g. fact:mult:6x7 */
  factId?: FactId;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  mode: 'pure' | 'applied';
  /** Long-form prompt (word problem or instruction). */
  prompt: string;
  /** Short symbolic form shown large, e.g. "7 × 8 = ?" */
  expression: string;
  answer: number;
  acceptable?: number[];
  /** Estimates: any answer within ±tolerance of `answer` is correct. */
  tolerance?: number;
  /** Show a decimal point on the keypad and accept decimal input (calipers, π, unit conversions). */
  allowDecimal?: boolean;
  /** Show a fraction bar on the keypad and accept `a/b`; any fraction equal in value is right. */
  allowFraction?: boolean;
  /** Show a minus key on the keypad. */
  allowNegative?: boolean;
  /** How the answer is written when shown (5/6, −3, x⁵), when the number alone would mislead. */
  answerText?: string;
  unit?: string;
  hint: string;
  solutionSteps: string[];
  explanation: string[];
  visual: Visual;
  /** Completed model for an explicitly opened worked solution; never the unanswered prompt. */
  solutionVisual?: Visual;
  /** Show the visual before answering, even in compact layouts: the picture is the problem. */
  visualFirst?: boolean;
  prerequisites: SkillId[];
  engineeringApplication?: string;
  /**
   * Tap-to-answer options (2 to 5). When present, MathChallenge shows big buttons instead of the keypad; the answer is
   * still `answer` (one choice's value). The prompt must say what the buttons mean ("Which shape comes next?").
   */
  choices?: QuestionChoice[];
  /** Words to read aloud for young players (the speaker button). Defaults to the prompt and expression. */
  readAloud?: string;
  /** Word problems: the structure, operation, layout and decoys. */
  word?: import('./questions/wordproblems').WordInfo;
}

/* ------------------------------------------------------------------ */
/* Mastery / spaced repetition                                         */
/* ------------------------------------------------------------------ */

export interface SrsState {
  /** Index into the interval ladder. */
  stage: number;
  /** Epoch ms when the item should next be reviewed. */
  dueAt: number;
  lastReviewAt: number;
  lapses: number;
}

export interface MasteryRecord {
  id: string; // FactId or SkillId
  attempts: number;
  correct: number;
  streak: number;
  bestStreak: number;
  /** Most recent results, oldest first, capped. 1 = correct, 0 = wrong. */
  history: number[];
  /** Recent response times (ms) for correct answers, capped. */
  times: number[];
  avgTimeMs: number;
  mastery: number; // 0-100
  lastPracticedAt: number;
  firstPracticedAt: number;
  srs: SrsState;
}

export interface AnswerLogEntry {
  at: number;
  skillId: SkillId;
  factId?: FactId;
  questionId: string;
  correct: boolean;
  timeMs: number;
  given: string;
  expected: number;
  context: AnswerContext;
}

export type AnswerContext = 'battle' | 'boss' | 'lesson' | 'drill' | 'mission' | 'review' | 'diagnostic';

/* ------------------------------------------------------------------ */
/* Character / progression                                             */
/* ------------------------------------------------------------------ */

export type Specialization = 'undecided' | 'chemical' | 'electrical' | 'physics' | 'automation' | 'materials';

export interface Character {
  name: string;
  avatar: string; // asset path
  specialization: Specialization;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  /** Derived-ish stats persisted for display. */
  intelligence: number;
  engineeringSkill: number;
  createdAt: number;
  title: string;
}

export type EquipSlot = 'tool' | 'head' | 'hands' | 'feet' | 'charm';

export interface ItemDef {
  id: ItemId;
  name: string;
  description: string;
  icon: string;
  kind: 'consumable' | 'material' | 'equipment' | 'artifact' | 'key';
  slot?: EquipSlot;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  effects?: ItemEffect[];
  value: number;
}

export type ItemEffect =
  | { type: 'heal'; amount: number }
  | { type: 'energy'; amount: number }
  | { type: 'damage-bonus'; percent: number }
  | { type: 'hint-charges'; amount: number }
  | { type: 'time-bonus'; ms: number }
  | { type: 'xp-bonus'; percent: number }
  | { type: 'shield'; amount: number };

export interface InventoryState {
  items: Record<ItemId, number>;
  equipped: Partial<Record<EquipSlot, ItemId>>;
}

/* ------------------------------------------------------------------ */
/* Enemies / combat                                                    */
/* ------------------------------------------------------------------ */

export interface EnemyDef {
  id: EnemyId;
  name: string;
  title: string;
  sprite: string;
  hp: number;
  /** Damage the player deals per correct answer. */
  hitDamage: number;
  /** Damage taken by the player on a wrong answer. */
  attack: number;
  /** Skills this enemy draws questions from. */
  skills: SkillId[];
  difficulty: Difficulty;
  xp: number;
  drops: { itemId: ItemId; chance: number; qty: [number, number] }[];
  flavor: string;
  isBoss?: boolean;
  /** Boss rules: fixed number of questions and max misses allowed. */
  bossRules?: { questions: number; maxMisses: number; requiredAccuracy: number };
  tint: string;
  /** Hue shift (degrees) so one sprite can dress several creatures. */
  hue?: number;
  /**
   * Multi-phase fights. A phase starts when the enemy's HP fraction drops to `at` or below.
   * `special` changes how questions are asked (and teaches a property); `skills` swaps the question pool.
   */
  phases?: { at: number; name: string; text: string; special?: 'mirror' | 'split'; skills?: SkillId[] }[];
}

export type BattleStatus = 'active' | 'victory' | 'defeat' | 'fled';

export interface BattleLogEntry {
  id: number;
  kind: 'info' | 'hit' | 'miss' | 'enemy' | 'hint' | 'solution' | 'victory' | 'defeat';
  text: string;
}

export interface BattleState {
  enemyId: EnemyId;
  regionId: RegionId;
  depth?: number;
  enemyHp: number;
  enemyMaxHp: number;
  playerHpAtStart: number;
  question: Question;
  questionStartedAt: number;
  attemptsOnCurrent: number;
  hintShown: boolean;
  solutionShown: boolean;
  /** Set when an answer has been submitted and the UI is showing feedback. */
  feedback?: { correct: boolean; damage: number; text: string; enemyDamage: number };
  log: BattleLogEntry[];
  correctCount: number;
  wrongCount: number;
  questionsAsked: number;
  streak: number;
  status: BattleStatus;
  isBoss: boolean;
  startedAt: number;
  hintCharges: number;
  /** Questions answered incorrectly that will be re-asked before the battle ends. */
  retryQueue: Question[];
  shield: number;
  /** How this question is answered: typed, picked from attacks, built as an array, or matched to a plate. */
  verb?: BattleVerb;
  /** Options for the 'choose' (numbers) and 'plate' (expressions) verbs. */
  choices?: string[];
  /** After a first miss: waiting for the player to choose how to recover, or the chosen recovery. */
  recovery?: 'choose' | 'retry' | 'helper';
  /** Current phase index for multi-phase bosses, and the special on the current question. */
  phase?: number;
  special?: { kind: 'mirror' | 'split'; text: string };
  /** A tip the player asked an NPC for on this question. */
  tip?: { npc: 'vector' | 'ada' | 'brick'; text: string };
  hintsUsed?: number;
  bestStreak?: number;
  /** Route chosen into a gallery: fewer-but-harder or more-but-easier. */
  route?: 'quiet' | 'loud';
  /** A scouting fight in a region you have not reached yet: no energy cost, returns to the map. */
  preview?: boolean;
  /** Label of a training shield that was spent at the start of this fight. */
  buffUsed?: string;
}

export type BattleVerb = 'type' | 'choose' | 'array' | 'plate';

/* ------------------------------------------------------------------ */
/* Quests                                                              */
/* ------------------------------------------------------------------ */

export type QuestKind = 'story' | 'training' | 'engineering' | 'rescue' | 'exploration' | 'boss' | 'daily' | 'project';

export type ObjectiveDef =
  | { id: string; type: 'talk'; npcId: NpcId; text: string }
  | { id: string; type: 'visit'; regionId: RegionId; text: string }
  | { id: string; type: 'lesson'; lessonId: LessonId; text: string }
  | { id: string; type: 'answers'; skillPrefix: string; count: number; context?: AnswerContext; text: string }
  | { id: string; type: 'defeat'; enemyId?: EnemyId; count: number; text: string }
  | { id: string; type: 'mastery'; skillId: SkillId; mastery: number; text: string }
  | { id: string; type: 'drill'; skillPrefix: string; count: number; accuracy: number; text: string }
  | { id: string; type: 'mission'; missionId: string; text: string }
  | { id: string; type: 'collect'; itemId: ItemId; count: number; text: string }
  | { id: string; type: 'depth'; regionId: RegionId; depth: number; text: string }
  | { id: string; type: 'boss'; enemyId: EnemyId; text: string };

export interface QuestReward {
  xp: number;
  items?: { itemId: ItemId; qty: number }[];
  unlocksRegion?: RegionId;
  unlocksLab?: string;
  title?: string;
}

export interface QuestDef {
  id: QuestId;
  kind: QuestKind;
  name: string;
  giver: NpcId;
  summary: string;
  story: string;
  objectives: ObjectiveDef[];
  reward: QuestReward;
  /** Quests that must be completed before this one becomes available. */
  after?: QuestId[];
  /** Mastery requirements to accept. */
  requires?: SkillRequirement[];
  /** Order matters for objectives (must be done sequentially)? */
  sequential?: boolean;
}

export type QuestStatus = 'locked' | 'available' | 'active' | 'completed';

export interface QuestState {
  status: QuestStatus;
  progress: Record<string, number>;
  startedAt?: number;
  completedAt?: number;
}

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

export type GameEvent =
  | { type: 'answer'; skillId: SkillId; factId?: FactId; correct: boolean; timeMs: number; context: AnswerContext; difficulty: Difficulty }
  | { type: 'drill-finished'; skillPrefix: string; count: number; accuracy: number }
  | { type: 'enemy-defeated'; enemyId: EnemyId; regionId: RegionId; depth?: number }
  | { type: 'boss-defeated'; enemyId: EnemyId }
  | { type: 'lesson-completed'; lessonId: LessonId }
  | { type: 'region-visited'; regionId: RegionId }
  | { type: 'depth-cleared'; regionId: RegionId; depth: number }
  | { type: 'npc-talked'; npcId: NpcId }
  | { type: 'item-collected'; itemId: ItemId; qty: number }
  | { type: 'mission-completed'; missionId: string }
  | { type: 'quest-completed'; questId: QuestId }
  | { type: 'level-up'; level: number };

/* ------------------------------------------------------------------ */
/* Achievements                                                        */
/* ------------------------------------------------------------------ */

export interface AchievementDef {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  xp: number;
}

/* ------------------------------------------------------------------ */
/* Daily stats                                                         */
/* ------------------------------------------------------------------ */

export interface DayStats {
  date: string; // YYYY-MM-DD
  answered: number;
  correct: number;
  xp: number;
  masteryGained: number;
  battles: number;
  lessons: number;
  reviews: number;
  applied: number;
  battlesWon: number;
  missionStages: number;
  skillsImproved: string[];
  timeMs: number;
}
