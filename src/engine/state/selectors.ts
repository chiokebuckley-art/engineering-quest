import type { GameState } from './types';
import { todayKey } from './initialState';
import { SKILLS, skillById } from '../curriculum/skills';
import { WORLDS } from '../curriculum/worlds';
import { skillMastery, effectiveMastery, skillStats } from '../mastery/MasteryEngine';
import { recommendNextSkill, worldProgress } from '../curriculum';
import { dueItems } from '../srs/SpacedRepetitionEngine';
import { LESSONS } from '../../content/lessons';
import { factLabel } from '../curriculum/facts';

export interface DailyItem {
  id: string;
  label: string;
  minutes: number;
  target: number;
  progress: number;
  done: boolean;
  action: { screen: string; params?: Record<string, string | number> };
}

export function todayStats(s: GameState, now = Date.now()) {
  const key = todayKey(now);
  return s.stats.days[key] ?? { date: key, answered: 0, correct: 0, xp: 0, masteryGained: 0, battles: 0, lessons: 0, reviews: 0, applied: 0, battlesWon: 0, missionStages: 0, skillsImproved: [], timeMs: 0 };
}

/** TODAY'S TRAINING — a 40-minute plan built from the player's current state. */
export function dailyPlan(s: GameState, now = Date.now()): DailyItem[] {
  const t = todayStats(s, now);
  const due = dueItems(s.mastery, now).length;
  const lesson = recommendedLesson(s, now);
  const multAnswers = s.answers.filter((a) => a.at >= new Date(t.date).getTime() && a.skillId.startsWith('mult') && a.correct).length;
  return [
    { id: 'review', label: 'Multiplication review — 15 correct answers', minutes: 5, target: 15, progress: Math.min(15, multAnswers), done: multAnswers >= 15, action: { screen: 'drill', params: { skill: 'mult', count: 15 } } },
    { id: 'lesson', label: lesson ? `Current lesson — ${lesson.title}` : 'Lessons — all complete; review one', minutes: 10, target: 1, progress: t.lessons, done: t.lessons >= 1, action: { screen: 'lessons' } },
    { id: 'battle', label: 'Dungeon battle — win 2 fights', minutes: 10, target: 2, progress: Math.min(2, t.battlesWon), done: t.battlesWon >= 2, action: { screen: 'region', params: { region: 'mines' } } },
    { id: 'mission', label: 'Engineering — 5 applied problems correct', minutes: 10, target: 5, progress: Math.min(5, t.applied), done: t.applied >= 5, action: { screen: 'drill', params: { skill: 'mult.applied', count: 5 } } },
    { id: 'srs', label: due ? `Spaced repetition — ${due} facts due` : 'Spaced repetition — nothing due', minutes: 5, target: Math.max(1, Math.min(due, 10)), progress: due ? Math.min(t.reviews, Math.min(due, 10)) : 1, done: due === 0 || t.reviews >= Math.min(due, 10), action: { screen: 'dungeon' } },
  ];
}

export function recommendedLesson(s: GameState, now = Date.now()) {
  const remaining = LESSONS.filter((l) => !s.stats.lessonsCompleted.includes(l.id));
  const ready = remaining.filter((l) => (l.recommendedAfter ?? []).every((r) => skillMastery(r.skillId, s.mastery, now) >= r.mastery));
  return ready[0] ?? remaining[0];
}

export interface DashboardData {
  overall: number;
  worlds: { id: string; name: string; percent: number; status: string }[];
  totalAnswered: number;
  accuracy: number;
  dayStreak: number;
  level: number;
  xp: number;
  bosses: number;
  projects: number;
  weakest: { id: string; label: string; mastery: number }[];
  strongest: { id: string; label: string; mastery: number }[];
  nextSkill?: { id: string; name: string };
  nextLesson?: { id: string; title: string };
  dueCount: number;
  avgTimeMs: number;
}

export function dashboardData(s: GameState, now = Date.now()): DashboardData {
  const worlds = WORLDS.map((w) => ({ id: w.id, name: w.name, percent: worldProgress(w.id, s.mastery), status: w.status }));
  const implemented = SKILLS.filter((k) => k.implemented);
  const overall = Math.round(worlds.reduce((a, w) => a + w.percent, 0) / worlds.length);
  const seenFacts = Object.values(s.mastery).filter((r) => r.attempts >= 2);
  const ranked = seenFacts.map((r) => ({ id: r.id, label: r.id.startsWith('fact:') ? factLabel(r.id) : skillById(r.id)?.name ?? r.id, mastery: effectiveMastery(r, now) })).sort((a, b) => a.mastery - b.mastery);
  const next = recommendNextSkill(s.mastery);
  const lesson = recommendedLesson(s, now);
  const st = s.stats;
  return {
    overall,
    worlds,
    totalAnswered: st.totalAnswered,
    accuracy: st.totalAnswered ? Math.round((st.totalCorrect / st.totalAnswered) * 100) : 0,
    dayStreak: st.dayStreak,
    level: s.character?.level ?? 1,
    xp: s.character?.xp ?? 0,
    bosses: st.bossesDefeated.length,
    projects: Object.entries(s.quests).filter(([id, q]) => id.startsWith('p.') && q.status === 'completed').length,
    weakest: ranked.slice(0, 5),
    strongest: [...ranked].reverse().slice(0, 5),
    nextSkill: next ? { id: next.id, name: next.name } : undefined,
    nextLesson: lesson ? { id: lesson.id, title: lesson.title } : undefined,
    dueCount: dueItems(s.mastery, now).length,
    avgTimeMs: st.totalCorrect ? Math.round(st.totalTimeMs / st.totalAnswered) : 0,
    ...(void implemented, {}),
  };
}

export function tableSummary(s: GameState, now = Date.now()) {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({ n, ...skillStats(`mult.${n}`, s.mastery, now) }));
}
