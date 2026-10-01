import { initialContest } from '../contest/state';
import { initialCountRecord } from '../countlab/engine';
import { initialReality } from '../reality/progress';
import type { GameState, Stats, WorldState, Settings } from './types';
import { initialQuests } from '../quests/QuestEngine';
import { emptyInventory } from '../inventory/InventorySystem';
import { initialAcademy } from '../academy/types';

export function initialStats(): Stats {
  return {
    totalAnswered: 0, totalCorrect: 0, totalTimeMs: 0, enemiesDefeated: 0, bossesDefeated: [],
    lessonsCompleted: [], missionsCompleted: [], drillsCompleted: 0, answerStreak: 0, bestAnswerStreak: 0,
    days: {}, dayStreak: 0, lastPlayedDate: '', dungeonClears: 0, arcade: { bests: {}, conquered: {}, runs: 0 }, speed: { facts: {}, runs: [] }, ledger: { days: {}, totals: {}, runs: [] }, mental: { skills: {}, errors: {}, records: { bestStreak: 0, fastestTenMs: 0, bestBlitz: 0, perfectRounds: 0, bestAddMs: 0, bestSubMs: 0, bestMulMs: 0, totalSolved: 0, totalCorrect: 0 }, bosses: {}, sessions: [], workoutDate: '', workoutStreak: 0 }, rocket: { points: 0, missions: {} }, millionaire: { best: 0, games: 0, wins: 0, bestRung: 0 }, stud: { gears: 200, hands: 0, wins: 0, best: 0, bestRank: 0, loans: 0 }, gear: { games: 0, wins: 0, bestPot: 0, finals: 0, fullChains: 0 }, plaza: { sessions: 0, equations: 0, wins: 0, bests: {} }, tycoon: { games: 0, wins: 0, bestWorth: 0, right: 0, wrong: 0 },
  };
}

export function initialWorld(): WorldState {
  return {
    unlockedRegions: ['village'], visitedRegions: [], currentRegion: 'village',
    depthCleared: {}, depthWins: {}, labUnlocked: ['workbench'], seenIntro: false,
  };
}

export const defaultSettings: Settings = { sound: true, volume: 0.5, reducedMotion: false, showTimer: true };

export function initialState(): GameState {
  return {
    countLab: initialCountRecord(), countUnlocked: false, countLastResult: '',
    character: null,
    mastery: {},
    adaptive: {},
    quests: initialQuests(),
    inventory: emptyInventory(),
    achievements: {},
    answers: [],
    stats: initialStats(),
    world: initialWorld(),
    settings: { ...defaultSettings },
    screen: 'menu',
    screenParams: {},
    battle: null,
    session: null,
    lesson: null,
    dungeon: null,
    arcade: null,
    versus: null,
    rocket: null,
    millionaire: null,
    stud: null,
    gear: null,
    plaza: null,
    tycoon: null,
    diceTable: null,
    mm: null,
    notebook: [],
    notebookRun: null,
    dialogue: null,
    toasts: [],
    recentFacts: [],
    academy: initialAcademy(),
    visualLibrary: {},
    reality: initialReality(),
    contest: initialContest(),
  };
}

export const todayKey = (now = Date.now()) => {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

