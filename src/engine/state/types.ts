import type {
  AnswerContext, AnswerLogEntry, BattleState, Character, DayStats, FactId, InventoryState,
  MasteryRecord, Question, RegionId, SkillId,
} from '../types';
import type { AdaptiveMap } from '../adaptive/DifficultyEngine';
import type { AcademyState } from '../academy/types';
import type { QuestMap } from '../quests/QuestEngine';

export type Screen =
  | 'menu' | 'intro' | 'create' | 'map' | 'region' | 'battle' | 'lesson' | 'lessons' | 'skilltree'
  | 'dice' | 'dashboard' | 'inventory' | 'lab' | 'quests' | 'drill' | 'mission' | 'dungeon' | 'settings' | 'achievements' | 'arcade' | 'versus' | 'rocket' | 'millionaire' | 'stud' | 'gear' | 'plaza' | 'countlab' | 'notebook' | 'workshop' | 'mental' | 'academy' | 'reality' | 'tycoon' | 'contest' | 'visual-library';

export type ArcadeGame = 'mult' | 'div' | 'add' | 'sub' | 'bonds' | 'alg' | 'word' | 'tricks' | 'mental' | 'volume' | 'measure' | 'geo' | 'rates' | 'fit' | 'phys' | 'pipe' | 'prob' | 'spiral' | 'precalc' | 'mm' | 'mixed' | 'academy' | 'frac' | 'ratio' | 'pattern' | 'blocks' | 'paths' | 'data' | 'logic' | 'pctmulti' | 'grid';
export type ArcadeMode = 'practice' | 'blitz' | 'conquer' | 'speed';

/**
 * Arcade: fast fact practice. `selection` names the pool —
 *  mult:all | mult:6 | mult:6,7,8 | mult:fact:6x7 | bonds:10
 */
export interface ArcadeState {
  game: ArcadeGame;
  mode: ArcadeMode;
  selection: string;
  question: Question;
  questionStartedAt: number;
  startedAt: number;
  /** Blitz: when time runs out. */
  deadlineAt?: number;
  /** Speed: the per-question clock, and how many questions make a set. */
  targetMs?: number;
  setSize?: number;
  attempts: number;
  results: { factId?: FactId; correct: boolean; timeMs: number }[];
  /** Conquer: facts still to beat, in order. */
  remaining: FactId[];
  conquered: FactId[];
  score: number;
  combo: number;
  bestCombo: number;
  feedback?: { correct: boolean; text: string };
  showExplanation: boolean;
  status: 'active' | 'finished';
  /** Set on finish: did this run beat the saved best? */
  newBest?: boolean;
  /** A Play training shield was earned during this run. */
  shieldEarned?: boolean;
  /** Seeded, uniformly-drawn questions (versus rounds). */
  seed?: number;
  questionIndex: number;
  /** This run belongs to a versus match. */
  versus?: boolean;
  /** Blitz length in ms. */
  durationMs: number;
  /** Seed for conquer pools that are not fact lists (add/sub/algebra). */
  runSeed: number;
  /** 'gears': this Blitz pays Stud Math gears (5 per correct + 20 per star). */
  reward?: 'gears';
}

export interface VersusPlayer {
  /** A disconnected player cannot win the round. */
  withdrawn?: boolean;
  id: string;
  name: string;
  /** The device owner's character — the only player whose answers feed mastery. */
  isMe: boolean;
  score: number;
  correct: number;
  done: boolean;
  color: string;
}

export interface VersusState {
  kind: 'hotseat' | 'online';
  game: ArcadeGame;
  selection: string;
  seed: number;
  players: VersusPlayer[];
  /** Hot seat: whose turn it is. */
  turn: number;
  status: 'lobby' | 'ready' | 'playing' | 'between' | 'results';
  /** Online: room code, and whether this device hosts the room. */
  roomCode?: string;
  isHost?: boolean;
  myId: string;
  /** Online: epoch ms when the round starts (host broadcasts). */
  startAt?: number;
  round: number;
  durationMs: number;
  /** The match plan: one math pick per level (10 by default). */
  levels: VersusLevel[];
  /** 0-based index of the level being played. */
  level: number;
  /** Levels won per player id; a bigger ship for every win. */
  wins: Record<string, number>;
  /** Round key whose result has already been added to `wins`. */
  awarded?: string;
}

export interface VersusLevel { game: ArcadeGame; selection: string }

export interface ArcadeRecord {
  /** Best blitz score per selection. */
  bests: Record<string, { score: number; correct: number; at: number }>;
  /** Conquered selections: best time in ms. */
  conquered: Record<string, { timeMs: number; at: number }>;
  runs: number;
}

export interface Toast {
  id: number;
  kind: 'xp' | 'level' | 'quest' | 'achievement' | 'item' | 'unlock' | 'info' | 'mastery';
  text: string;
  icon?: string;
}

export interface DialogueState {
  npcId: string;
  lines: { speaker: string; text: string }[];
  index: number;
}

export interface LessonProgress {
  lessonId: string;
  step: number;
  /** For 'try' steps: current question and results so far. */
  question?: Question;
  questionStartedAt: number;
  tryIndex: number;
  tryResults: boolean[];
  attempts: number;
  feedback?: { correct: boolean; text: string };
  showExplanation: boolean;
  /** The lesson is finished and showing its completion card (Continue the quest / more lessons). */
  done?: boolean;
}

export type SessionKind = 'drill' | 'mission' | 'diagnostic';

export interface SessionState {
  kind: SessionKind;
  /** Drill / diagnostic: skills to draw from. */
  skillIds: SkillId[];
  /** Mission id when kind === 'mission'. */
  missionId?: string;
  count: number;
  index: number; // questions asked so far
  question: Question;
  questionStartedAt: number;
  attempts: number;
  results: { question: Question; correct: boolean; timeMs: number; given: string }[];
  feedback?: { correct: boolean; text: string };
  showExplanation: boolean;
  hintShown: boolean;
  status: 'active' | 'finished';
  timed: boolean;
  startedAt: number;
  context: AnswerContext;
  /** Mission stage reached (0..stages) */
  stage: number;
}

export interface DungeonRun {
  facts: FactId[];
  index: number;
  defeated: number;
  status: 'active' | 'cleared';
}

export interface Stats {
  totalAnswered: number;
  totalCorrect: number;
  totalTimeMs: number;
  enemiesDefeated: number;
  bossesDefeated: string[];
  lessonsCompleted: string[];
  missionsCompleted: string[];
  drillsCompleted: number;
  answerStreak: number;
  bestAnswerStreak: number;
  days: Record<string, DayStats>;
  dayStreak: number;
  lastPlayedDate: string;
  dungeonClears: number;
  arcade: ArcadeRecord;
  /** Speed practice: response times per fact and every speed run. */
  speed: import('./speed').SpeedStats;
  /** Which part of the app each visit went to first: play, arcade, learn, academy. */
  opens?: { at: number; tab: string }[];
  /** The arcade ledger: right and wrong by day, game, mode and number, plus every run and its clock. */
  ledger: import('./ledger').LedgerStats;
  /** Mental Math Academy: scaffolding, error profile, records and workout streak. */
  mental: import('../mentalmath/progress').MentalStats;
  rocket: import('./rocket').RocketRecord;
  millionaire: import('./millionaire').MillionaireRecord;
  stud: import('./stud').StudRecord;
  gear: import('./gear').GearRecord;
  plaza: import('./plaza').PlazaRecord;
  /** Engine City Tycoon: games, wins and best net worth. */
  tycoon?: import('../tycoon/record').TycoonRecord;
}

export interface WorldState {
  unlockedRegions: RegionId[];
  visitedRegions: RegionId[];
  currentRegion: RegionId;
  /** Highest gallery cleared per dungeon region. */
  depthCleared: Record<string, number>;
  /** Wins per depth key `${region}:${depth}`. */
  depthWins: Record<string, number>;
  labUnlocked: string[];
  seenIntro: boolean;
  /** Side objectives completed, e.g. 'mines:1'. */
  sideDone?: string[];
  /** A shield earned in the Arcade, spent at the start of the next Play fight. */
  buff?: { shield: number; label: string } | null;
  /** A "go train this, then come back" trip from a battle or gallery. */
  pendingTraining?: { game: ArcadeGame; selection: string; label: string; regionId: string; depth?: number; enemyId: string; earned?: boolean } | null;
  /** A power core waiting to be seated in the Engine (the village ceremony). */
  ceremony?: string | null;
  /** Regions scouted with a preview mission. */
  scouted?: string[];
  /** The most recent visible change to the world, shown in the village. */
  lastChange?: { text: string; at: number } | null;
}

export interface Settings {
  sound: boolean;
  volume: number;
  reducedMotion: boolean;
  showTimer: boolean;
}

export interface GameState {
  countLab: import('../countlab/engine').CountRecord;
  countUnlocked: boolean;
  countLastResult: string;
  character: Character | null;
  mastery: Record<string, MasteryRecord>;
  adaptive: AdaptiveMap;
  quests: QuestMap;
  inventory: InventoryState;
  achievements: Record<string, number>;
  answers: AnswerLogEntry[];
  stats: Stats;
  world: WorldState;
  settings: Settings;
  /** Saved solo Dice Workshop scorecard and learning totals. */
  diceWorkshop?: import('./diceWorkshop').DiceData;
  /** An online Dice Workshop table (never saved: rooms end when the host leaves). */
  diceTable?: import('./diceTable').DiceTable | null;
  // --- transient-ish (persisted but reset sensibly on load) ---
  screen: Screen;
  screenParams: Record<string, string | number | undefined>;
  battle: BattleState | null;
  session: SessionState | null;
  lesson: LessonProgress | null;
  dungeon: DungeonRun | null;
  arcade: ArcadeState | null;
  versus: VersusState | null;
  rocket: import('./rocket').RocketState | null;
  millionaire: import('./millionaire').MillionaireState | null;
  stud: import('./stud').StudState | null;
  gear: import('./gear').GearState | null;
  plaza: import('./plaza').PlazaState | null;
  /** The Engine City Tycoon game in progress (kept across reloads unless it is online). */
  tycoon: import('../tycoon/game').TycoonGame | null;
  /** The active Mental Math Academy session. */
  mm: import('../mentalmath/session').MMSession | null;
  /** The wrong-answer notebook: every miss, until fixed three times. */
  notebook: import('../notebook/notebook').NotebookEntry[];
  notebookRun: import('../notebook/notebook').NotebookRun | null;
  dialogue: DialogueState | null;
  toasts: Toast[];
  /** Facts asked recently (for avoiding repeats). */
  recentFacts: FactId[];
  /** The Arithmetic Academy campaign. */
  academy: AcademyState;
  /** Illustrated lesson and naming progress, saved with this profile. */
  visualLibrary: import('../visual-library/progress').VisualProgress;
  /** Reality Quest: the Electronics Lab progress. */
  reality: import('../reality/progress').RealityProgress;
  /** Contest Path: this profile's grade track, caps and practice history. */
  contest: import('../contest/state').ContestState;
  /** Transient: this visit's first destination has been logged (reset on load). */
  visitLogged?: boolean;
}


