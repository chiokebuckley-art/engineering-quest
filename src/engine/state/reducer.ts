import { studyVisual, answerVisual, migrateVisualProgress } from '../visual-library/progress';
import { applyDiceEvent, emptyDiceData, parseDiceData, totals as diceTotals } from './diceWorkshop';
import { hostTable, joinTable, setTableRoster, launchTable, actAtTable, leaveTable, type DiceTable } from './diceTable';
import { COUNT_LAB_ENABLED, migrateCountRecord, recordResult as recordCountResult } from '../countlab/engine';
import type { Action } from './actions';
import { buildQuest, buildConcept, buildTransfer, buildTrial, judge, feedbackFor, retryAllowed, passed as runPassed, passRule, chapterGates, chapterAvailable, trialReady, graduation, trackOf, academyUnlocked, currentAcademy } from '../academy/AcademyEngine';
import { academyById, chapterOf, nextAcademy, questById as academyQuestById } from '../academy/registry';
import { initialChapter, initialTrack, migrateAcademy, type AcademyRun } from '../academy/types';
import type { GameState, LessonProgress, SessionState, Toast } from './types';
import { initialState, todayKey } from './initialState';
import type { AnswerContext, Difficulty, GameEvent, Question, RegionId } from '../types';
import { applyAnswer, effectiveMastery, skillMastery, weakItems } from '../mastery/MasteryEngine';
import { skillById, TABLE_ORDER } from '../curriculum/skills';
import { regionById, REGIONS } from '../curriculum/regions';
import { regionReadiness } from '../curriculum';
import { multFactId, parseMultFact, parseDivFact } from '../curriculum/facts';
import { generateQuestion, generateFromSkills, checkAnswer, answerLabel } from '../questions';
import { PICTURE_GAMES } from '../questions/games';
import { migrateContest } from '../contest/state';
import { startContest, runAnswer as contestAnswer, contestReduce, contestSetGrade } from '../contest/track';
import { recordSpeed, addRun, summarizeRun, passedTarget, nextTarget, initialSpeed, SPEED_GOAL_MS, SPEED_SET } from './speed';
import { nextStep } from './guide';
import { recordLedger, recordLedgerRun, initialLedger } from './ledger';
import { createRng } from '../rng';
import { xpForAnswer, levelFromXp, titleForLevel } from '../progression/xp';
import { ACHIEVEMENTS } from '../progression/achievements';
import { addItem, removeItem, equip, unequip, hasItem, bonus, flat } from '../inventory/InventorySystem';
import { itemById } from '../inventory/items';
import { enemyById, MINE_DEPTHS, depthDef } from '../combat/enemies';
import { startBattle, submitAnswer, advance, useHint, flee, battleAccuracy, recover, askTip, powerStrike, type CombatConfig } from '../combat/CombatEngine';
import { acceptQuest, applyEvent, refreshAvailability } from '../quests/QuestEngine';
import { questById, QUESTS } from '../quests/questDefs';
import { adaptiveLevel, recordResult } from '../adaptive/DifficultyEngine';
import { lessonById } from '../../content/lessons';
import { missionById, stageQuestion } from '../../content/missions';
import { npcDialogue } from '../../content/dialogue';
import { LAB_EQUIPMENT } from '../../content/lab';
import { isDue } from '../srs/SpacedRepetitionEngine';
import * as MM from '../mentalmath/session';
import { questionFromProblem } from '../questions/mentalmath';
import { applyResult as mmApplyResult, applySession as mmApplySession, buildWorkout, initialMental, progressFor, todayKey as mmToday, placementResult } from '../mentalmath/progress';
import { mmSkill, MM_SKILLS, MM_WORLDS } from '../mentalmath/curriculum';
import { startArcade, arcadeAnswer, arcadeNext, blitzStars, parseSelection, bestKey, selectionTitle, GEARS_PER_CORRECT, GEARS_PER_STAR } from './arcade';
import { startRocket, moveRocket, setLane, boost, rocketNext, rocketStars, missionById as rocketMissionById, ROCKET_MISSIONS } from './rocket';
import { startMillionaire, pickOption, nextRung, walkAway, useLifeline, LADDER, fmtMoney } from './millionaire';
import { startGear, gearBank, gearAnswer, gearNext, gearTimeout, gearVote, gearTiebreak, gearContinue, gearLaunch, gearLeft, adoptRemote, botTurn, initialGear, byId as gearById, CHAIN } from './gear';
import { addMiss, startRun, runAnswer, runNext, applyRun, activeEntries } from '../notebook/notebook';
import { startStud, studChoose, studAnswer, studReveal, studCollect, payoutQuestion, studNet, initialStud, HAND_NAMES, ANTE, STREET_BONUS } from './stud';
import { migrateReality, applyStageResult, missionComplete } from '../reality/progress';
import { missionById as realityMission } from '../reality/missions';
import { startTycoon, roll as tycoonRoll, answer as tycoonAnswer, ack as tycoonAck, passBuy as tycoonPass, jailChoice as tycoonJail, startBuild as tycoonBuild, cancelBuild as tycoonCancelBuild, toggleMortgage as tycoonMortgage, endTurn as tycoonEndTurn, botStep as tycoonBot, finish as tycoonFinish, current as tycoonCurrent, type TycoonGame } from '../tycoon/game';
import { initialTycoon, recordTycoon } from '../tycoon/record';
import { hostLobby, guestLobby, setRoster as tycoonRoster, launchOnline as tycoonLaunch, leaveOnline as tycoonLeave, applyGuest as tycoonGuest } from '../tycoon/online';
import { startPlaza, playPlaza, passPlaza, botPlaza, launchPlaza, seatsPlaza, sitOutPlaza, endPlazaEarly, plazaResumable, pausedPlaza, restorePlaza, isPlazaState, initialPlaza, recordPlaza, undoPlaza, type PlazaState, type PlazaRecord } from './plaza';
import { asset } from '../../assets';

let toastId = 1;
const PRAISE = ['Correct!', 'Nice!', 'Yes!', 'Exactly.', 'Boom!', 'Right on.', 'Nailed it!'];
const rng = createRng();

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function toast(s: GameState, kind: Toast['kind'], text: string, icon?: string): GameState {
  // never reuse an id still on screen (hot reloads reset the counter)
  const id = Math.max(toastId, ...s.toasts.map((t) => t.id + 1)); toastId = id + 1;
  return { ...s, toasts: [...s.toasts.slice(-3), { id, kind, text, icon }] };
}

function grantXp(s: GameState, amount: number, now: number): GameState {
  if (!s.character || amount <= 0) return s;
  const boosted = Math.round(amount * (1 + bonus(s.inventory, 'xp-bonus') / 100));
  const xp = s.character.xp + boosted;
  const before = s.character.level;
  const { level } = levelFromXp(xp);
  let next: GameState = { ...s, character: { ...s.character, xp, level } };
  next = bumpDay(next, now, (d) => ({ ...d, xp: d.xp + boosted }));
  if (level > before) {
    const maxHp = 100 + (level - 1) * 10;
    const maxEnergy = 50 + (level - 1) * 5;
    next = { ...next, character: { ...next.character!, level, maxHp, maxEnergy, hp: maxHp, energy: maxEnergy, title: titleForLevel(level) } };
    next = toast(next, 'level', `Level ${level} — ${titleForLevel(level)}! Health and energy restored.`, asset('/assets/icons/level-up.svg'));
    next = emit(next, { type: 'level-up', level }, now);
  }
  return next;
}

function bumpDay(s: GameState, now: number, fn: (d: import('../types').DayStats) => import('../types').DayStats): GameState {
  const key = todayKey(now);
  const cur = s.stats.days[key] ?? { date: key, answered: 0, correct: 0, xp: 0, masteryGained: 0, battles: 0, lessons: 0, reviews: 0, applied: 0, battlesWon: 0, missionStages: 0, skillsImproved: [], timeMs: 0 };
  let dayStreak = s.stats.dayStreak;
  let lastPlayedDate = s.stats.lastPlayedDate;
  if (lastPlayedDate !== key) {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    dayStreak = lastPlayedDate === todayKey(y.getTime()) ? dayStreak + 1 : 1;
    lastPlayedDate = key;
  }
  return { ...s, stats: { ...s.stats, dayStreak, lastPlayedDate, days: { ...s.stats.days, [key]: fn(cur) } } };
}

function unlockRegion(s: GameState, regionId: RegionId, now: number): GameState {
  if (s.world.unlockedRegions.includes(regionId)) return s;
  const r = regionById(regionId);
  let next: GameState = { ...s, world: { ...s.world, unlockedRegions: [...s.world.unlockedRegions, regionId] } };
  next = toast(next, 'unlock', `New region: ${r?.name ?? regionId}`, r?.icon);
  void now;
  return next;
}

function unlockLab(s: GameState, id: string): GameState {
  if (s.world.labUnlocked.includes(id)) return s;
  const eq = LAB_EQUIPMENT.find((e) => e.id === id);
  let next: GameState = { ...s, world: { ...s.world, labUnlocked: [...s.world.labUnlocked, id] } };
  next = toast(next, 'unlock', `Laboratory upgrade: ${eq?.name ?? id}`, asset('/assets/icons/lab.svg'));
  return next;
}

/** Regions and lab equipment whose requirements are now satisfied. */
function refreshUnlocks(s: GameState, now: number): GameState {
  let next = s;
  const completed = new Set(Object.entries(next.quests).filter(([, q]) => q.status === 'completed').map(([id]) => id));
  for (const r of REGIONS) {
    if (!r.implemented || next.world.unlockedRegions.includes(r.id)) continue;
    if (regionReadiness(r, next.mastery, completed).ready) next = unlockRegion(next, r.id, now);
  }
  for (const eq of LAB_EQUIPMENT) {
    if (next.world.labUnlocked.includes(eq.id)) continue;
    const ok = eq.requires.every((q) => skillMastery(q.skillId, next.mastery, now) >= q.mastery) && (!eq.requiresQuest || completed.has(eq.requiresQuest));
    if (ok) next = unlockLab(next, eq.id);
  }
  return next;
}

function completeQuest(s: GameState, questId: string, now: number): GameState {
  const def = questById(questId);
  if (!def) return s;
  let next = toast(s, 'quest', `Quest complete: ${def.name}`, asset('/assets/icons/quest.svg'));
  next = grantXp(next, def.reward.xp, now);
  for (const it of def.reward.items ?? []) {
    next = { ...next, inventory: addItem(next.inventory, it.itemId, it.qty) };
    next = toast(next, 'item', `Received ${it.qty} × ${itemById(it.itemId)?.name ?? it.itemId}`, itemById(it.itemId)?.icon);
  }
  if (def.reward.unlocksRegion) next = unlockRegion(next, def.reward.unlocksRegion, now);
  if (def.reward.unlocksLab) next = unlockLab(next, def.reward.unlocksLab);
  if (def.reward.title && next.character) next = { ...next, character: { ...next.character, title: def.reward.title } };
  next = emit(next, { type: 'quest-completed', questId }, now);
  return next;
}

function checkAchievements(s: GameState, now: number): GameState {
  let next = s;
  const has = (id: string) => !!next.achievements[id];
  const unlock = (id: string) => {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a || has(id)) return;
    next = { ...next, achievements: { ...next.achievements, [id]: now } };
    next = toast(next, 'achievement', `Achievement: ${a.name}`, a.icon);
    next = grantXp(next, a.xp, now);
  };
  const st = next.stats;
  if (st.totalCorrect >= 1) unlock('first-answer');
  if (st.enemiesDefeated >= 1) unlock('first-battle');
  if (st.bestAnswerStreak >= 10) unlock('streak-10');
  if (st.bestAnswerStreak >= 25) unlock('streak-25');
  if (st.totalAnswered >= 100) unlock('answers-100');
  if (st.totalAnswered >= 500) unlock('answers-500');
  if (st.totalAnswered >= 1000) unlock('answers-1000');
  if (TABLE_ORDER.some((n) => skillMastery(`mult.${n}`, next.mastery, now) >= 90)) unlock('table-mastered');
  const hard = [[6, 7], [7, 8], [6, 8], [7, 9], [8, 9]];
  if (hard.every(([a, b]) => effectiveMastery(next.mastery[multFactId(a, b)], now) >= 90)) unlock('hard-facts');
  if (skillMastery('mult', next.mastery, now) >= 90) unlock('mult-mastered');
  if (st.bossesDefeated.includes('multiplication-dragon')) unlock('dragon');
  if ((next.character?.level ?? 1) >= 5) unlock('level-5');
  if ((next.character?.level ?? 1) >= 10) unlock('level-10');
  if (st.lessonsCompleted.length >= 3) unlock('lessons-3');
  if (st.dungeonClears >= 1) unlock('review-dungeon');
  if (st.missionsCompleted.includes('m.bridge')) unlock('bridge');
  if (st.dayStreak >= 3) unlock('streak-days-3');
  if (st.dayStreak >= 7) unlock('streak-days-7');
  if ((next.world.depthCleared['mines'] ?? 0) >= 8) unlock('depth-8');
  if (next.quests['p.workshop']?.status === 'completed') unlock('project-workshop');
  return next;
}

/** Route a game event through quests (and rewards) and achievements. */
const AUTO_ACCEPT_KINDS = new Set(['story', 'boss', 'engineering', 'rescue']);

/** Story-line quests start on their own so the player never hunts for an Accept button. */
function autoAccept(s: GameState, now: number): GameState {
  let quests = s.quests;
  for (const q of QUESTS) {
    if (AUTO_ACCEPT_KINDS.has(q.kind) && quests[q.id]?.status === 'available') quests = acceptQuest(quests, q.id, now);
  }
  return quests === s.quests ? s : { ...s, quests };
}

function emit(s: GameState, ev: GameEvent, now: number): GameState {
  const { quests, completed } = applyEvent(s.quests, ev, { mastery: s.mastery, inventory: s.inventory, now });
  let next: GameState = autoAccept({ ...s, quests }, now);
  for (const id of completed) next = completeQuest(next, id, now);
  if (ev.type !== 'quest-completed') next = refreshUnlocks(next, now);
  return next;
}

export interface AnswerResult { state: GameState; xp: number; masteryDelta: number }

/**
 * The single path every answered question flows through: mastery, spaced repetition,
 * adaptive difficulty, answer log, statistics, XP, quests and achievements.
 */
function recordAnswer(s: GameState, q: Question, given: string, correct: boolean, timeMs: number, context: AnswerContext, now: number): AnswerResult {
  const skill = skillById(q.masterySkillId);
  const target = skill?.targetTimeMs ?? 5000;
  let mastery = { ...s.mastery };
  let masteryDelta = 0;
  let crossed = false;
  let firstCorrect = false;
  let factBefore = 0;
  let wasDue = false;
  const improved: string[] = [];

  if (q.factId) {
    wasDue = isDue(mastery[q.factId], now);
    factBefore = effectiveMastery(mastery[q.factId], now);
    const u = applyAnswer(mastery[q.factId], q.factId, correct, timeMs, target, now);
    mastery[q.factId] = u.record;
    masteryDelta += u.after - u.before;
    crossed = crossed || u.crossedMastered;
    firstCorrect = firstCorrect || u.firstCorrect;
    if (u.after > u.before) improved.push(q.masterySkillId);
  }
  if (!skill?.facts?.length) {
    // Non-fact skill (applied, missing factor, addition…): keep its own record too.
    if (!q.factId) { wasDue = isDue(mastery[q.masterySkillId], now); factBefore = effectiveMastery(mastery[q.masterySkillId], now); }
    const u = applyAnswer(mastery[q.masterySkillId], q.masterySkillId, correct, timeMs, target, now);
    mastery[q.masterySkillId] = u.record;
    if (!q.factId) { masteryDelta += u.after - u.before; crossed = crossed || u.crossedMastered; firstCorrect = firstCorrect || u.firstCorrect; }
    if (u.after > u.before && !improved.includes(q.masterySkillId)) improved.push(q.masterySkillId);
  }

  const adaptiveKey = /^mult\.\d+$/.test(q.masterySkillId) || q.masterySkillId.startsWith('mult') ? 'mult' : q.masterySkillId.startsWith('div') ? 'div' : q.masterySkillId;
  const adaptive = recordResult(s.adaptive, adaptiveKey, correct);

  const entry = { at: now, skillId: q.masterySkillId, factId: q.factId, questionId: q.id, correct, timeMs, given, expected: q.answer, context };
  const answers = [...s.answers, entry].slice(-2000);
  const answerStreak = correct ? s.stats.answerStreak + 1 : 0;
  const stats = {
    ...s.stats,
    totalAnswered: s.stats.totalAnswered + 1,
    totalCorrect: s.stats.totalCorrect + (correct ? 1 : 0),
    totalTimeMs: s.stats.totalTimeMs + timeMs,
    answerStreak,
    bestAnswerStreak: Math.max(s.stats.bestAnswerStreak, answerStreak),
  };
  let next: GameState = { ...s, mastery, adaptive, answers, stats, recentFacts: [...s.recentFacts, q.factId ?? ''].filter(Boolean).slice(-6) };
  // Every miss goes into the wrong-answer notebook (notebook runs judge themselves).
  if (!correct && !s.notebookRun) next = { ...next, notebook: addMiss(next.notebook ?? [], q, given, context, now, given === '' && (context === 'drill' || context === 'battle')) };
  next = bumpDay(next, now, (d) => ({
    ...d,
    answered: d.answered + 1,
    correct: d.correct + (correct ? 1 : 0),
    timeMs: d.timeMs + timeMs,
    masteryGained: d.masteryGained + Math.max(0, masteryDelta),
    reviews: d.reviews + (wasDue && correct ? 1 : 0),
    applied: d.applied + (q.mode === 'applied' && correct ? 1 : 0),
    skillsImproved: Array.from(new Set([...d.skillsImproved, ...improved])),
  }));
  let xp = 0;
  if (correct) {
    xp = xpForAnswer(q.difficulty, factBefore, context, crossed, firstCorrect);
    next = grantXp(next, xp, now);
    if (crossed) next = toast(next, 'mastery', `Mastered: ${q.expression.replace(' = ?', '')}`, asset('/assets/icons/medal.svg'));
  }
  next = emit(next, { type: 'answer', skillId: q.masterySkillId, factId: q.factId, correct, timeMs, context, difficulty: q.difficulty }, now);
  next = checkAchievements(next, now);
  return { state: next, xp, masteryDelta };
}

/** Apply a finished Academy run to chapter progress, then check whether the chapter is now mastered. */
function finishAcademyRun(s: GameState, run: AcademyRun, now: number): GameState {
  const ok = runPassed(run);
  const rule = passRule(run);
  const key = run.chapter; const aid = run.academyId;
  const track = trackOf(s.academy, aid);
  const prev = track.chapters[key] ?? initialChapter();
  let chapter = prev;
  let next: GameState = s;
  const finished: AcademyRun = { ...run, passed: ok };
  const def = chapterOf(aid, key);
  if (run.kind === 'quest' && run.questId) {
    if (ok) {
      chapter = { ...prev, quests: { ...prev.quests, [run.questId]: (prev.quests[run.questId] ?? 0) + 1 } };
      next = grantXp(next, 120, now);
      if (finished.worldText) next = changed(next, finished.worldText, now);
      next = toast(next, 'quest', `Quest cleared: ${run.title}`, asset('/assets/icons/quest.svg'));
    } else next = toast(next, 'info', `${run.correct} of ${rule.of}. Clear it with ${rule.need} right.`);
  } else if (run.kind === 'concept') {
    chapter = { ...prev, conceptAttempts: prev.conceptAttempts + 1, conceptBest: Math.max(prev.conceptBest, run.correct), conceptPass: prev.conceptPass || ok };
  } else if (run.kind === 'transfer') {
    chapter = { ...prev, transferAttempts: prev.transferAttempts + 1, transferBest: Math.max(prev.transferBest, run.correct), transferPass: prev.transferPass || ok };
  }
  let t = { ...track, chapters: { ...track.chapters, [key]: chapter } };
  if (run.kind === 'trial') {
    t = { ...t, trial: { ...t.trial, best: Math.max(t.trial.best, run.correct), passedAt: t.trial.passedAt ?? (ok ? now : undefined) } };
    if (ok) next = toast(next, 'achievement', `${academyById(aid)?.short ?? 'Academy'}: Mastery Trial passed`, asset('/assets/icons/trophy.svg'));
  }
  next = { ...next, academy: { ...next.academy, tracks: { ...next.academy.tracks, [aid]: t }, run: finished } };
  if (def && key !== 'trial' && !chapter.masteredAt && chapterGates(next, aid, key).mastered) {
    const t2 = trackOf(next.academy, aid);
    next = { ...next, academy: { ...next.academy, tracks: { ...next.academy.tracks, [aid]: { ...t2, chapters: { ...t2.chapters, [key]: { ...chapter, masteredAt: now } } } } } };
    next = grantXp(next, 200, now);
    next = toast(next, 'achievement', `Chapter ${def.n} mastered: ${def.title}`, asset('/assets/icons/medal.svg'));
    next = changed(next, `${def.wingName}: chapter ${def.n} mastered.`, now);
  }
  return next;
}

function combatConfig(s: GameState, difficulty: Difficulty, factId?: string) {
  return {
    damageBonusPercent: bonus(s.inventory, 'damage-bonus'),
    hintCharges: 1 + flat(s.inventory, 'hint-charges'),
    shield: flat(s.inventory, 'shield'),
    difficulty,
    factId,
  };
}

/**
 * Bosses are pure mastery exams: fixed difficulty, no adaptation. Regular enemies adapt to the
 * player, but never more than two levels above their gallery's base difficulty.
 */
function battleDifficulty(s: GameState, enemyId: string, route?: 'quiet' | 'loud', preview?: boolean): Difficulty {
  const e = enemyById(enemyId)!;
  if (e.isBoss) return e.difficulty;
  if (preview) return 2;
  const key = `enemy:${enemyId}`;
  const lvl = s.adaptive[key]?.level ?? e.difficulty;
  const base = Math.max(1, Math.min(lvl, e.difficulty + 2));
  // Quiet tunnels ask fewer, harder facts; loud shafts more, easier ones.
  return Math.max(1, Math.min(6, base + (route === 'quiet' ? 1 : route === 'loud' ? -1 : 0))) as Difficulty;
}

/** The config for the battle in progress (routes, previews and review facts included). */
function battleCfg(s: GameState): CombatConfig {
  const b = s.battle!;
  const factId = s.dungeon ? s.dungeon.facts[s.dungeon.index] : undefined;
  return { ...combatConfig(s, battleDifficulty(s, b.enemyId, b.route, b.preview), factId), preview: b.preview };
}

/** Where to practise the fact or skill a question was about, in the Arcade. */
export function trainingFor(q: Question): { game: import('./types').ArcadeGame; selection: string; label: string } | null {
  const m = q.factId ? parseMultFact(q.factId) : null;
  if (m) return { game: 'mult', selection: `mult:fact:${m.a}x${m.b}`, label: `${m.a} × ${m.b}` };
  const d = q.factId ? parseDivFact(q.factId) : null;
  if (d) return { game: 'div', selection: `div:${d.divisor}`, label: `÷${d.divisor}` };
  const t = /^mult\.(\d+)$/.exec(q.masterySkillId);
  if (t) return { game: 'mult', selection: `mult:${t[1]}`, label: `×${t[1]}` };
  const [prefix, ...rest] = q.masterySkillId.split('.');
  if (PICTURE_GAMES[prefix]) { const kind = rest.join('.') || 'all'; const k = PICTURE_GAMES[prefix].kinds.find((x) => x.id === kind); return { game: prefix as import('./types').ArcadeGame, selection: `${prefix}:${kind}`, label: k?.label ?? PICTURE_GAMES[prefix].label }; }
  return null;
}

/** An Arcade run that shows real skill (≥ 80 % and enough right answers) earns a shield for the next Play fight. */
function maybeEarnShield(s: GameState, now: number): GameState {
  void now;
  const ar = s.arcade;
  if (!ar || ar.versus || ar.shieldEarned || ar.game === 'mixed') return s;
  const right = ar.results.filter((r) => r.correct).length;
  const pt = s.world.pendingTraining;
  const trip = !!pt && pt.game === ar.game && pt.selection === ar.selection;
  if (right < (trip ? 5 : 10) || right / ar.results.length < 0.8) return s;
  const shield = trip ? 20 : 12;
  const label = `Training shield (${trip ? pt!.label : selectionTitle(ar.game, ar.selection)})`;
  const buff = s.world.buff && s.world.buff.shield > shield ? s.world.buff : { shield, label };
  let next: GameState = { ...s, arcade: { ...ar, shieldEarned: true }, world: { ...s.world, buff, pendingTraining: trip ? { ...pt!, earned: true } : pt } };
  next = toast(next, 'unlock', trip ? `Shield earned! Return to the fight — you start with a ${shield}-point shield.` : `Training medal: your next Play fight starts with a ${shield}-point shield.`, asset('/assets/icons/shield.svg'));
  return next;
}

/** Sets the line the village shows about the latest thing that changed in the world (two changes in one moment are both kept). */
const changed = (s: GameState, text: string, now: number): GameState => {
  const prev = s.world.lastChange;
  const joined = prev && prev.at === now ? `${prev.text} ${text}` : text;
  return { ...s, world: { ...s.world, lastChange: { text: joined, at: now } } };
};

/** What clearing a gallery / grove / hall changes in the village. */
export const clearedWhere = (regionId: string, depth: number) => regionId === 'mines' ? `lantern ${depth} on Main Street is lit` : regionId === 'fraction-forest' ? 'a forest lantern glows at the village gate' : 'another hall lamp is burning';

/* ------------------------------------------------------------------ */
/* reducer                                                             */
/* ------------------------------------------------------------------ */

/** Which part of the app an action takes the player to, for the "what do they open first" record. */
export function visitTab(a: Action): string | null {
  switch (a.type) {
    case 'NAVIGATE':
      if (['arcade', 'stud', 'gear', 'plaza', 'countlab', 'rocket', 'millionaire', 'versus'].includes(a.screen)) return 'arcade';
      if (a.screen === 'lessons' || a.screen === 'lesson') return 'learn';
      if (a.screen === 'mental') return 'academy';
      if (a.screen === 'map' || a.screen === 'region' || a.screen === 'quests') return 'play';
      return null;
    case 'TRAVEL': case 'START_BATTLE': case 'START_MISSION': case 'START_DUNGEON': case 'ACADEMY_OPEN': case 'ACADEMY_START': return 'play';
    case 'PLAZA_START': case 'TYCOON_START': case 'ARCADE_START': case 'STUD_START': case 'ROCKET_START': case 'MILL_START': case 'VERSUS_SETUP': return 'arcade';
    case 'START_LESSON': return 'learn';
    case 'MM_START': case 'MM_WORKOUT': case 'MM_PLACEMENT': case 'MM_BOSS': return 'academy';
    default: return null;
  }
}

/**
 * The reducer, plus one piece of bookkeeping: the first place each visit goes (Play, Arcade, Learn, Academy)
 * is logged once, so it is visible over time whether Play is the part of the app they reach for.
 */
export function gameReducer(s: GameState, a: Action): GameState {
  const next = reduce(s, a);
  if (next.visitLogged || !next.character || a.type === 'LOAD') return next;
  const tab = visitTab(a);
  if (!tab) return next;
  return { ...next, visitLogged: true, stats: { ...next.stats, opens: [...(next.stats.opens ?? []), { at: Date.now(), tab }].slice(-200) } };
}

function reduce(s: GameState, a: Action): GameState {
  const now = Date.now();
  switch (a.type) {
    case 'DICE_EVENT': return { ...s, diceWorkshop: applyDiceEvent(s.diceWorkshop ?? emptyDiceData(), a.event, () => rng.next()) };
    case 'DICE_HOST': return { ...s, screen: 'dice', diceWorkshop: { ...(s.diceWorkshop ?? emptyDiceData()), avatar: a.avatar }, diceTable: hostTable(a.mode, a.code, { id: a.myId, name: s.character?.name ?? 'Host', avatar: a.avatar }) };
    case 'DICE_JOIN': return { ...s, screen: 'dice', diceWorkshop: { ...(s.diceWorkshop ?? emptyDiceData()), avatar: a.avatar }, diceTable: joinTable(a.code, { id: a.myId, name: s.character?.name ?? 'Guest', avatar: a.avatar }) };
    case 'DICE_ROSTER': return s.diceTable ? { ...s, diceTable: setTableRoster(s.diceTable, a.seats) } : s;
    case 'DICE_LAUNCH': return s.diceTable ? withDiceTable(s, launchTable(s.diceTable)) : s;
    case 'DICE_ACT': return s.diceTable?.online.host ? withDiceTable(s, actAtTable(s.diceTable, s.diceTable.online.myId, a.action, () => rng.next())) : s;
    case 'DICE_GUEST': return s.diceTable?.online.host ? withDiceTable(s, actAtTable(s.diceTable, a.id, a.action, () => rng.next())) : s;
    case 'DICE_LEFT': return s.diceTable?.online.host ? withDiceTable(s, leaveTable(s.diceTable, a.id)) : s;
    case 'DICE_REMOTE': return s.diceTable && !s.diceTable.online.host && a.table.rev > s.diceTable.rev ? withDiceTable(s, a.table) : s;
    case 'DICE_TABLE_EXIT': return { ...s, diceTable: null, screen: 'dice' };
    case 'COUNT_AUTH': {
      if (!COUNT_LAB_ENABLED || !/^[a-f0-9]{64}$/.test(a.digest)) return s;
      const r = migrateCountRecord(s.countLab);
      if (r.pinHash) return a.digest === r.pinHash ? { ...s, countUnlocked: true } : s;
      return a.salt && /^[a-f0-9]{32}$/.test(a.salt) ? { ...s, countLab: { ...r, pinHash: a.digest, salt: a.salt }, countUnlocked: true } : s;
    }
    case 'COUNT_LOCK': return { ...s, countUnlocked: false };
    case 'COUNT_CONTROLS': return s.countUnlocked ? { ...s, countLab: { ...s.countLab, maxDecks: Math.max(1, Math.min(9, Math.round(a.maxDecks) || 1)), timers: a.timers, coach: a.coach } } : s;
    case 'COUNT_RESULT': return s.countUnlocked && a.result.id !== s.countLastResult ? { ...s, countLab: recordCountResult(s.countLab, a.result), countLastResult: a.result.id } : s;
    case 'VISUAL_STUDY': return { ...s, visualLibrary: studyVisual(s.visualLibrary ?? {}, a.id) };
    case 'VISUAL_ANSWER': return { ...s, visualLibrary: answerVisual(s.visualLibrary ?? {}, a.id, a.mode, a.correct) };
    case 'LOAD': {
      // An unfinished Plaza game saved on this device comes back (an online one reconnects to its room).
      const loaded = { ...initialState(), ...a.state, visualLibrary: migrateVisualProgress(a.state.visualLibrary), diceWorkshop: parseDiceData(a.state.diceWorkshop), diceTable: null, countLab: migrateCountRecord(a.state.countLab), countUnlocked: false, countLastResult: '', toasts: [], dialogue: null, battle: null, session: null, dungeon: null, arcade: null, versus: null, rocket: null, millionaire: null, stud: null, gear: null, plaza: a.keepPlaza ? s.plaza : restorePlaza(a.state.plaza), tycoon: a.state.tycoon && a.state.tycoon.v === 1 && !a.state.tycoon.online ? a.state.tycoon : null, notebookRun: null, notebook: Array.isArray(a.state.notebook) ? a.state.notebook : [], academy: migrateAcademy(a.state.academy), reality: migrateReality(a.state.reality), contest: migrateContest(a.state.contest), stats: { ...initialState().stats, ...a.state.stats, arcade: a.state.stats?.arcade ?? { bests: {}, conquered: {}, runs: 0 }, rocket: a.state.stats?.rocket ?? { points: 0, missions: {} }, millionaire: a.state.stats?.millionaire ?? { best: 0, games: 0, wins: 0, bestRung: 0 }, stud: a.state.stats?.stud ?? initialStud(), gear: a.state.stats?.gear ?? initialGear(), plaza: a.keepPlaza ? { ...loadPlazaRecord(a.state.stats?.plaza), paused: s.stats.plaza?.paused } : loadPlazaRecord(a.state.stats?.plaza), tycoon: a.state.stats?.tycoon ?? initialTycoon(), speed: a.state.stats?.speed ?? initialSpeed(), ledger: a.state.stats?.ledger ?? initialLedger(), mental: a.state.stats?.mental ?? initialMental() } };
      // Never resume into a transient screen.
      const transient = ['battle', 'drill', 'mission', 'lesson', 'dungeon', 'intro', 'create', 'versus'];
      if (loaded.screen === 'arcade') loaded.screen = 'arcade';
      const screen = loaded.character ? (transient.includes(loaded.screen) ? 'region' : loaded.screen === 'menu' ? 'region' : loaded.screen) : 'menu';
      return refreshUnlocks(autoAccept({ ...loaded, screen, visitLogged: false, quests: refreshAvailability(loaded.quests) }, now), now);
    }
    case 'NEW_GAME':
      return { ...initialState(), settings: s.settings, screen: 'intro' };
    case 'RESET_PROGRESS':
      return { ...initialState(), settings: s.settings, screen: 'menu' };
    case 'SEEN_INTRO':
      return { ...s, world: { ...s.world, seenIntro: true }, screen: 'create' };
    case 'CREATE_CHARACTER': {
      const character = {
        name: a.name.trim() || 'Apprentice', avatar: a.avatar, specialization: a.specialization, level: 1, xp: 0,
        hp: 100, maxHp: 100, energy: 50, maxEnergy: 50, intelligence: 1, engineeringSkill: 1, createdAt: now, title: titleForLevel(1),
      };
      let next: GameState = { ...s, character, screen: 'region', world: { ...s.world, currentRegion: 'village', visitedRegions: ['village'] } };
      next = { ...next, inventory: addItem(next.inventory, 'repair-kit', 1) };
      next = autoAccept(next, now);
      next = emit(next, { type: 'region-visited', regionId: 'village' }, now);
      return gameReducer(next, { type: 'TALK', npcId: 'vector' });
    }
    case 'SET_SPECIALIZATION':
      return s.character ? { ...s, character: { ...s.character, specialization: a.specialization } } : s;
    case 'NAVIGATE':
      return { ...s, screen: a.screen, screenParams: a.params ?? {}, dialogue: null };
    case 'TRAVEL': {
      const r = regionById(a.regionId);
      if (!r) return s;
      const completed = new Set(Object.entries(s.quests).filter(([, q]) => q.status === 'completed').map(([id]) => id));
      const readiness = regionReadiness(r, s.mastery, completed);
      const ready = s.world.unlockedRegions.includes(a.regionId) || readiness.ready;
      if (!ready) return toast(s, 'info', r.implemented ? `${r.name} is locked — readiness ${readiness.percent}%. See the world map for what it requires.` : `${r.name} lies ahead in a future expansion.`);
      let next: GameState = { ...s, screen: 'region', world: { ...s.world, currentRegion: a.regionId, unlockedRegions: s.world.unlockedRegions.includes(a.regionId) ? s.world.unlockedRegions : [...s.world.unlockedRegions, a.regionId], visitedRegions: s.world.visitedRegions.includes(a.regionId) ? s.world.visitedRegions : [...s.world.visitedRegions, a.regionId] } };
      next = emit(next, { type: 'region-visited', regionId: a.regionId }, now);
      return next;
    }
    case 'TALK': {
      const view = {
        playerName: s.character?.name ?? 'Apprentice',
        quest: (id: string) => s.quests[id]?.status ?? 'locked',
        mastery: (id: string) => skillMastery(id, s.mastery, now),
        level: s.character?.level ?? 1,
        hasItem: (id: string) => hasItem(s.inventory, id),
      };
      return { ...s, dialogue: { npcId: a.npcId, lines: npcDialogue(a.npcId, view), index: 0 } };
    }
    case 'DIALOGUE_NEXT': {
      if (!s.dialogue) return s;
      if (s.dialogue.index + 1 < s.dialogue.lines.length) return { ...s, dialogue: { ...s.dialogue, index: s.dialogue.index + 1 } };
      const npcId = s.dialogue.npcId;
      let next: GameState = { ...s, dialogue: null };
      next = emit(next, { type: 'npc-talked', npcId }, now);
      return next;
    }
    case 'DIALOGUE_CLOSE': {
      if (!s.dialogue) return s;
      const npcId = s.dialogue.npcId;
      return emit({ ...s, dialogue: null }, { type: 'npc-talked', npcId }, now);
    }
    case 'ACCEPT_QUEST': {
      const def = questById(a.questId);
      if (!def) return s;
      const quests = acceptQuest(s.quests, a.questId, now);
      if (quests === s.quests) return s;
      let next: GameState = { ...s, quests };
      next = toast(next, 'quest', `Quest accepted: ${def.name}`, asset('/assets/icons/quest.svg'));
      // Passive objectives may already be satisfied.
      next = emit(next, { type: 'region-visited', regionId: s.world.currentRegion }, now);
      return next;
    }

    /* ---------------- lessons ---------------- */
    case 'START_LESSON': {
      const def = lessonById(a.lessonId);
      if (!def) return s;
      const lesson: LessonProgress = { lessonId: a.lessonId, step: 0, questionStartedAt: now, tryIndex: 0, tryResults: [], attempts: 0, showExplanation: false };
      return { ...s, lesson: prepareLessonStep(s, lesson, now), screen: 'lesson' };
    }
    case 'LESSON_NEXT': {
      if (!s.lesson) return s;
      // Past the completion card: close the lesson.
      if (s.lesson.done) return { ...s, lesson: null, screen: 'lessons' };
      const def = lessonById(s.lesson.lessonId)!;
      const step = def.steps[s.lesson.step];
      // Inside a 'try' step after feedback: next question or advance.
      if (step.type === 'try' && s.lesson.feedback) {
        const done = s.lesson.tryIndex + 1 >= step.count;
        if (!done && s.lesson.feedback.correct === false && s.lesson.attempts < 2) {
          return { ...s, lesson: { ...s.lesson, feedback: undefined, questionStartedAt: now, showExplanation: false } };
        }
        if (!done) {
          const l = { ...s.lesson, tryIndex: s.lesson.tryIndex + 1, feedback: undefined, attempts: 0, showExplanation: false };
          return { ...s, lesson: prepareLessonStep(s, l, now) };
        }
      }
      const nextStep = s.lesson.step + 1;
      if (nextStep >= def.steps.length) {
        // Lesson complete: stay on a completion card whose main button carries on with the quest.
        let next: GameState = { ...s, lesson: { ...s.lesson, done: true, feedback: undefined, question: undefined }, screen: 'lesson' };
        if (!next.stats.lessonsCompleted.includes(def.id)) {
          next = { ...next, stats: { ...next.stats, lessonsCompleted: [...next.stats.lessonsCompleted, def.id] } };
          next = { ...next, character: next.character ? { ...next.character, intelligence: next.character.intelligence + 1 } : null };
          next = bumpDay(next, now, (d) => ({ ...d, lessons: d.lessons + 1 }));
          next = grantXp(next, 60, now);
          next = toast(next, 'info', `Lesson complete: ${def.title} (+60 XP)`, asset('/assets/icons/scroll.svg'));
        }
        next = emit(next, { type: 'lesson-completed', lessonId: def.id }, now);
        return checkAchievements(next, now);
      }
      const l: LessonProgress = { ...s.lesson, step: nextStep, tryIndex: 0, tryResults: [], attempts: 0, feedback: undefined, showExplanation: false, question: undefined };
      return { ...s, lesson: prepareLessonStep(s, l, now) };
    }
    case 'LESSON_ANSWER': {
      if (!s.lesson?.question || s.lesson.feedback) return s;
      const q = s.lesson.question;
      const correct = checkAnswer(q, a.given);
      const timeMs = Math.max(200, now - s.lesson.questionStartedAt);
      const first = s.lesson.attempts === 0;
      let next = s;
      if (first) next = recordAnswer(s, q, a.given, correct, timeMs, 'lesson', now).state;
      const text = correct ? (first ? PRAISE[Math.abs(Math.round(q.answer)) % PRAISE.length] : 'Got it on the retry!') : (first ? `Not yet. Hint: ${q.hint}` : `The answer is ${answerLabel(q)}. ${q.solutionSteps.join(' ')}`);
      return { ...next, lesson: { ...next.lesson!, attempts: s.lesson.attempts + 1, feedback: { correct, text }, tryResults: first ? [...s.lesson.tryResults, correct] : s.lesson.tryResults, showExplanation: !correct && !first } };
    }
    case 'LESSON_TOGGLE_EXPLAIN':
      return s.lesson ? { ...s, lesson: { ...s.lesson, showExplanation: !s.lesson.showExplanation } } : s;
    case 'LESSON_EXIT':
      return { ...s, lesson: null, screen: 'lessons' };
    case 'LESSON_CONTINUE': {
      // One tap from a finished lesson back into the adventure: whatever the guide says is next.
      const base: GameState = { ...s, lesson: null, screen: 'region' };
      return gameReducer(base, nextStep(base).action);
    }

    /* ---------------- battle ---------------- */
    case 'START_BATTLE': {
      const enemy = enemyById(a.enemyId);
      if (!enemy || !s.character) return s;
      const free = !!a.factId || !!a.preview;
      if (s.character.energy < 5 && !free) return toast(s, 'info', 'Not enough energy. Rest in the village or use an Energy Cell.');
      if (s.character.hp <= 0) return toast(s, 'info', 'You are too hurt to fight. Rest at the inn or use a Repair Kit.');
      const adaptive = s.adaptive[`enemy:${enemy.id}`] ? s.adaptive : { ...s.adaptive, [`enemy:${enemy.id}`]: { level: enemy.difficulty, recent: [] } };
      const route = enemy.isBoss || a.preview ? undefined : a.route;
      const difficulty = battleDifficulty({ ...s, adaptive }, enemy.id, route, a.preview);
      // A training shield earned in the Arcade is spent on the next real fight.
      const buff = !a.preview && s.world.buff ? s.world.buff : null;
      const base = combatConfig(s, difficulty, a.factId);
      const cfg: CombatConfig = { ...base, shield: base.shield + (buff?.shield ?? 0), buffLabel: buff?.label, hpScale: route === 'quiet' ? 0.6 : route === 'loud' ? 1.4 : 1, preview: a.preview };
      const battle = { ...startBattle(enemy, a.regionId, s.mastery, s.character.hp, rng, cfg, a.depth, now), route, preview: a.preview || undefined, buffUsed: buff?.label };
      const energy = free ? s.character.energy : Math.max(0, s.character.energy - 5);
      let next: GameState = { ...s, adaptive, battle, screen: 'battle', character: { ...s.character, energy }, world: buff ? { ...s.world, buff: null } : s.world };
      next = bumpDay(next, now, (d) => ({ ...d, battles: d.battles + 1 }));
      return next;
    }
    case 'BATTLE_ANSWER': {
      if (!s.battle || s.battle.status !== 'active' || s.battle.feedback || !s.character) return s;
      const enemy = enemyById(s.battle.enemyId)!;
      const out = submitAnswer(s.battle, enemy, a.given, s.mastery, battleCfg(s), s.character.hp, now);
      let next: GameState = { ...s, battle: out.battle, character: { ...s.character, hp: Math.max(0, s.character.hp - out.playerDamage) } };
      if (out.countsForMastery) {
        next = recordAnswer(next, s.battle.question, a.given, out.correct, out.timeMs, s.battle.isBoss ? 'boss' : s.dungeon ? 'review' : 'battle', now).state;
        if (!enemy.isBoss) next = { ...next, adaptive: recordResult(next.adaptive, `enemy:${enemy.id}`, out.correct) };
      }
      if (out.enemyDefeated) next = resolveVictory(next, now);
      else if (out.playerDefeated || out.bossFailed) next = resolveDefeat(next, now);
      return next;
    }
    case 'BATTLE_HINT':
      return s.battle ? { ...s, battle: useHint(s.battle) } : s;
    case 'BATTLE_NEXT': {
      if (!s.battle) return s;
      const enemy = enemyById(s.battle.enemyId)!;
      return { ...s, battle: advance(s.battle, enemy, s.mastery, rng, battleCfg(s), now) };
    }
    case 'BATTLE_RECOVER': {
      const b = s.battle;
      if (!b || b.status !== 'active' || b.recovery !== 'choose') return s;
      if (a.choice !== 'train') return { ...s, battle: recover(b, a.choice, now) };
      // Leave the fight to practise this exact fact, with a shield waiting for the return.
      const t = trainingFor(b.question);
      if (!t) return s;
      return gameReducer({ ...s, battle: flee(b) }, { type: 'PLAY_TRAIN', ...t });
    }
    case 'BATTLE_TIP':
      return s.battle ? { ...s, battle: askTip(s.battle, a.npc) } : s;
    case 'BATTLE_POWER': {
      const b = s.battle;
      if (!b || !s.character || b.status !== 'active' || b.feedback) return s;
      const enemy = enemyById(b.enemyId)!;
      if (enemy.isBoss) return s;
      if (s.character.energy < 10) return toast(s, 'info', 'A Power Strike needs 10 energy.');
      const battle = powerStrike(b, enemy);
      let next: GameState = { ...s, battle, character: { ...s.character, energy: s.character.energy - 10 } };
      if (battle.status === 'victory') next = resolveVictory(next, now);
      return next;
    }
    case 'PLAY_TRAIN': {
      // From a fight (or its end card) to the Arcade: practise, earn a shield, come back.
      const b = s.battle;
      const pendingTraining = { game: a.game, selection: a.selection, label: a.label, regionId: b?.regionId ?? s.world.currentRegion, depth: b?.depth, enemyId: b?.enemyId ?? MINE_DEPTHS[0].enemyId };
      const base: GameState = { ...s, battle: null, world: { ...s.world, pendingTraining, currentRegion: b && !b.preview ? b.regionId : s.world.currentRegion } };
      return gameReducer(base, { type: 'ARCADE_START', game: a.game, mode: 'practice', selection: a.selection });
    }
    case 'PLAY_RETURN': {
      const pt = s.world.pendingTraining;
      if (!pt) return s;
      let base: GameState = { ...s, world: { ...s.world, pendingTraining: null } };
      if (base.arcade) base = gameReducer(base, { type: 'ARCADE_EXIT' });
      if (pt.depth !== undefined) return gameReducer(base, { type: 'START_BATTLE', enemyId: pt.enemyId, regionId: pt.regionId, depth: pt.depth });
      return gameReducer(base, { type: 'TRAVEL', regionId: pt.regionId });
    }
    case 'CEREMONY_DONE': {
      const id = s.world.ceremony;
      if (!id) return s;
      const text = id === 'multiplication-dragon' ? 'Power Core I is seated. The Engine turns over for the first time in a year.' : id === 'division-titan' ? 'The Division Core is seated. Two cores hum in the Engine.' : id === 'fraction-hydra' ? 'The Fraction Core is seated. Green light runs through the Engine.' : id.startsWith('academy:') ? `The ${academyById(id.slice(8))?.coreName ?? 'new core'} hums in the Engine.` : 'A new core hums in the Engine.';
      return changed({ ...s, world: { ...s.world, ceremony: null } }, text, now);
    }
    case 'BATTLE_FLEE':
      return s.battle ? { ...s, battle: flee(s.battle) } : s;
    case 'BATTLE_CLOSE': {
      if (!s.battle) return s;
      const wasDungeon = !!s.dungeon;
      const regionId = s.battle.regionId;
      let next: GameState = { ...s, battle: null };
      if (next.character && next.character.hp <= 0) {
        next = { ...next, character: { ...next.character, hp: Math.round(next.character.maxHp * 0.5) }, screen: 'region', world: { ...next.world, currentRegion: 'village' }, dungeon: null };
        return toast(next, 'info', 'You wake in the village infirmary with half your health.');
      }
      if (wasDungeon && next.dungeon) {
        if (next.dungeon.status === 'cleared' || next.dungeon.index >= next.dungeon.facts.length) return { ...next, screen: 'dungeon' };
        return { ...next, screen: 'dungeon' };
      }
      // A scouting fight never moves you into a region you have not unlocked.
      if (s.battle.preview) return { ...next, screen: 'map' };
      // A boss core is carried home and seated in the Engine.
      if (s.battle.isBoss && s.battle.status === 'victory') return { ...next, screen: 'region', world: { ...next.world, currentRegion: 'village', ceremony: s.battle.enemyId } };
      return { ...next, screen: 'region', world: { ...next.world, currentRegion: regionId } };
    }

    /* ---------------- drills / missions ---------------- */
    case 'START_DRILL': {
      const skillIds = a.skillIds.length ? a.skillIds : ['mult'];
      const key = skillIds.length === 1 ? skillIds[0] : 'mult';
      const difficulty = a.diagnostic ? 2 : adaptiveLevel(s.adaptive, key.startsWith('mult') ? 'mult' : key.startsWith('div') ? 'div' : key);
      const question = generateFromSkills(skillIds, s.mastery, { rng, difficulty, recentFacts: s.recentFacts });
      const session: SessionState = {
        kind: a.diagnostic ? 'diagnostic' : 'drill', skillIds, count: a.count, index: 0, question, questionStartedAt: now, attempts: 0, results: [],
        showExplanation: false, hintShown: false, status: 'active', timed: !!a.timed, startedAt: now, context: a.diagnostic ? 'diagnostic' : 'drill', stage: 0,
      };
      return { ...s, session, screen: 'drill' };
    }
    case 'START_MISSION': {
      const m = missionById(a.missionId);
      if (!m) return s;
      const question = stageQuestion(m, 0, rng);
      const session: SessionState = {
        kind: 'mission', skillIds: [], missionId: m.id, count: m.stages.length, index: 0, question, questionStartedAt: now, attempts: 0, results: [],
        showExplanation: false, hintShown: false, status: 'active', timed: false, startedAt: now, context: 'mission', stage: 0,
      };
      return { ...s, session, screen: 'mission' };
    }
    case 'SESSION_ANSWER': {
      const ss = s.session;
      if (!ss || ss.status !== 'active' || ss.feedback) return s;
      const q = ss.question;
      const correct = checkAnswer(q, a.given);
      const timeMs = Math.max(200, now - ss.questionStartedAt);
      const first = ss.attempts === 0;
      let next = s;
      if (first) next = recordAnswer(s, q, a.given, correct, timeMs, ss.context, now).state;
      const text = correct ? (first ? PRAISE[Math.abs(Math.round(q.answer)) % PRAISE.length] : 'Got it on the retry!') : (first ? `Not yet. ${q.hint}` : `The answer is ${answerLabel(q)}${q.unit ? ' ' + q.unit : ''}. ${q.solutionSteps.join(' ')}`);
      const results = first ? [...ss.results, { question: q, correct, timeMs, given: a.given }] : ss.results;
      let session: SessionState = { ...next.session!, attempts: ss.attempts + 1, feedback: { correct, text }, results, showExplanation: !correct && !first };
      if (correct && ss.kind === 'mission') {
        session = { ...session, stage: ss.stage + 1 };
        next = bumpDay(next, now, (d) => ({ ...d, missionStages: d.missionStages + 1 }));
      }
      return { ...next, session };
    }
    case 'SESSION_HINT':
      return s.session ? { ...s, session: { ...s.session, hintShown: true } } : s;
    case 'SESSION_TOGGLE_EXPLAIN':
      return s.session ? { ...s, session: { ...s.session, showExplanation: !s.session.showExplanation } } : s;
    case 'SESSION_NEXT': {
      const ss = s.session;
      if (!ss || !ss.feedback) return s;
      // Retry once after a miss.
      if (!ss.feedback.correct && ss.attempts < 2) return { ...s, session: { ...ss, feedback: undefined, questionStartedAt: now, showExplanation: false } };
      if (ss.kind === 'mission') {
        const m = missionById(ss.missionId!)!;
        // A stage only completes on a correct answer; after two misses, re-ask a fresh version of the same stage.
        const stage = ss.feedback.correct ? ss.stage : ss.stage;
        if (stage >= m.stages.length) {
          let next: GameState = { ...s, session: { ...ss, status: 'finished', feedback: undefined } };
          if (!next.stats.missionsCompleted.includes(m.id)) {
            next = { ...next, stats: { ...next.stats, missionsCompleted: [...next.stats.missionsCompleted, m.id] }, character: next.character ? { ...next.character, engineeringSkill: next.character.engineeringSkill + 1 } : null };
            next = grantXp(next, 100, now);
          }
          next = emit(next, { type: 'mission-completed', missionId: m.id }, now);
          return checkAchievements(next, now);
        }
        const question = stageQuestion(m, stage, rng);
        return { ...s, session: { ...ss, question, index: ss.index + 1, attempts: 0, feedback: undefined, showExplanation: false, hintShown: false, questionStartedAt: now } };
      }
      const asked = ss.results.length;
      if (asked >= ss.count) {
        const correct = ss.results.filter((r) => r.correct).length;
        const accuracy = asked ? correct / asked : 0;
        let next: GameState = { ...s, session: { ...ss, status: 'finished', feedback: undefined }, stats: { ...s.stats, drillsCompleted: s.stats.drillsCompleted + 1 } };
        const prefix = ss.skillIds.length === 1 ? ss.skillIds[0] : 'mult';
        next = emit(next, { type: 'drill-finished', skillPrefix: prefix, count: asked, accuracy }, now);
        if (ss.kind === 'drill') next = grantXp(next, Math.round(20 + 60 * accuracy), now);
        return next;
      }
      const key = ss.skillIds.length === 1 ? ss.skillIds[0] : 'mult';
      const difficulty = ss.kind === 'diagnostic' ? 2 : adaptiveLevel(s.adaptive, key.startsWith('mult') ? 'mult' : key.startsWith('div') ? 'div' : key);
      const question = generateFromSkills(ss.skillIds, s.mastery, { rng, difficulty, recentFacts: s.recentFacts });
      return { ...s, session: { ...ss, question, index: ss.index + 1, attempts: 0, feedback: undefined, showExplanation: false, hintShown: false, questionStartedAt: now } };
    }
    case 'SESSION_EXIT':
      return { ...s, session: null, screen: 'region' };

    /* ---------------- review dungeon ---------------- */
    case 'START_DUNGEON': {
      const facts = weakItems(s.mastery, now, 8).map((r) => r.id).filter((id) => id.startsWith('fact:'));
      if (!facts.length) return toast({ ...s, screen: 'dungeon' }, 'info', 'The dungeon is quiet — you have no weak facts right now. Come back after more battles.');
      return { ...s, dungeon: { facts, index: 0, defeated: 0, status: 'active' }, screen: 'dungeon' };
    }
    case 'DUNGEON_EXIT':
      return { ...s, dungeon: null, screen: 'region', world: { ...s.world, currentRegion: 'village' } };

    /* ---------------- arcade ---------------- */
    case 'ARCADE_START':
      return { ...s, arcade: startArcade(a.game, a.mode, a.selection, s.mastery, now, rng, { durationMs: a.durationMs, reward: a.reward, targetMs: a.targetMs }), screen: 'arcade' };
    case 'ARCADE_ANSWER': {
      const ar = s.arcade;
      if (!ar || ar.status !== 'active' || ar.feedback || now < ar.startedAt) return s;
      if (ar.mode === 'blitz' && ar.deadlineAt && now >= ar.deadlineAt) return finishArcade({ ...s, arcade: { ...ar, status: 'finished' } }, now);
      const correct = checkAnswer(ar.question, a.given);
      const out = arcadeAnswer(ar, correct, now);
      let next: GameState = { ...s, arcade: out.state };
      // In a versus match only the device owner's own turn trains their mastery.
      const trains = !ar.versus || (s.versus?.players[s.versus.turn]?.isMe ?? false);
      if (out.countsForMastery && trains) next = recordAnswer(next, ar.question, a.given, correct, out.timeMs, 'drill', now).state;
      // Every first attempt in the arcade adds a data point to the per-fact speed record.
      if (out.countsForMastery && trains) next = { ...next, stats: { ...next.stats, speed: recordSpeed(next.stats.speed ?? initialSpeed(), ar.question, out.timeMs, correct, now) } };
      // ...and to the ledger, filed by day, game, mode and number, for the progress graphs.
      if (out.countsForMastery && trains) next = { ...next, stats: { ...next.stats, ledger: recordLedger(next.stats.ledger ?? initialLedger(), ar.question, ar.game, ar.mode, correct, out.timeMs, now) } };
      if (ar.versus && next.versus) next = syncVersusScore(next);
      if (out.countsForMastery && trains) next = maybeEarnShield(next, now);
      if (out.state.status === 'finished') next = finishArcade(next, now);
      return next;
    }
    case 'ARCADE_NEXT': {
      if (!s.arcade) return s;
      const nx = arcadeNext(s.arcade, s.mastery, now, rng);
      const next: GameState = { ...s, arcade: nx };
      return nx.status === 'finished' && s.arcade.status !== 'finished' ? finishArcade(next, now) : next;
    }
    case 'ARCADE_TIMEOUT': {
      if (!s.arcade || s.arcade.status !== 'active') return s;
      return finishArcade({ ...s, arcade: { ...s.arcade, status: 'finished', feedback: undefined } }, now);
    }
    /* ---------------- Mental Math Academy ---------------- */
    case 'MM_START': {
      const sk = mmSkill(a.skillId);
      const lvl = a.level ?? Math.min(5, Math.max(1, Math.round((skillMastery(a.skillId, s.mastery, now) / 22) + 1))) as 1 | 2 | 3 | 4 | 5 | 6;
      const saved = progressFor(s.stats.mental ?? initialMental(), a.skillId);
      const scaffold = a.scaffold ?? (a.mode === 'guided' ? saved.scaffold : undefined);
      const targetMs = a.targetMs ?? (a.mode === 'speed' && sk ? (sk.speedLadder[Math.min(saved.speedStep, sk.speedLadder.length - 1)] ?? 10) * 1000 : undefined);
      const mm = MM.startSession({ mode: a.mode, skillId: a.skillId, scaffold, level: lvl, targetMs, count: a.count, now }, rng);
      return { ...s, mm, screen: 'mental' };
    }
    case 'MM_WORKOUT': {
      const mental = s.stats.mental ?? initialMental();
      const plan = buildWorkout(mental, s.mastery, now);
      if (!plan.length) return toast(s, 'info', 'Practise a skill or two first, then the workout can be built around you.');
      const mm = MM.startSession({ mode: 'workout', skillId: plan[0].skillId, plan, level: 3, now }, rng);
      return { ...s, mm, screen: 'mental' };
    }
    case 'MM_PLACEMENT':
      return { ...s, mm: MM.startSession({ mode: 'placement', skillId: 'mm.make10', level: 2, now }, rng), screen: 'mental' };
    case 'MM_BOSS': {
      const w = MM_WORLDS.find((x) => x.n === a.world);
      if (!w) return s;
      const anchor = MM_SKILLS.filter((x) => x.world === a.world).slice(-1)[0]?.id ?? 'mm.mixed';
      return { ...s, mm: MM.startSession({ mode: 'boss', skillId: anchor, level: 4, now }, rng), screen: 'mental' };
    }
    case 'MM_BEGIN':
      return s.mm ? { ...s, mm: MM.beginAsk(s.mm, now) } : s;
    case 'MM_CHOOSE':
      return s.mm ? { ...s, mm: MM.chooseStrategy(s.mm, a.strategy, now) } : s;
    case 'MM_HINT':
      return s.mm ? { ...s, mm: MM.showHint(s.mm) } : s;
    case 'MM_ANOTHER':
      return s.mm ? { ...s, mm: MM.anotherWay(s.mm) } : s;
    case 'MM_VISUAL':
      return s.mm ? { ...s, mm: MM.toggleVisual(s.mm) } : s;
    case 'MM_SCAFFOLD':
      return s.mm ? { ...s, mm: MM.setScaffold(s.mm, a.scaffold) } : s;
    case 'MM_REVEAL':
      return s.mm ? { ...s, mm: MM.revealMore(s.mm) } : s;
    case 'MM_ANSWER': {
      if (!s.mm || s.mm.status !== 'active') return s;
      const problem = MM.current(s.mm);
      const out = MM.answer(s.mm, a.given, now);
      let next: GameState = { ...s, mm: out.session };
      if (out.finishedProblem && problem) {
        // One mental answer feeds the core mastery engine, the notebook, XP and the academy record.
        const q = questionFromProblem(problem);
        next = recordAnswer(next, q, a.given, out.correct, out.finishedProblem.timeMs, 'drill', now).state;
        next = { ...next, mm: out.session, stats: { ...next.stats, mental: mmApplyResult(next.stats.mental ?? initialMental(), out.finishedProblem, now) } };
        next = mmCheckAchievements(next, now);
      }
      return next;
    }
    case 'MM_NEXT': {
      if (!s.mm || s.mm.status !== 'active') return s;
      const nx = MM.next(s.mm, rng, now);
      if (nx.status === 'finished') return finishMental({ ...s, mm: nx }, now);
      return { ...s, mm: nx };
    }
    case 'MM_EXIT': {
      if (!s.mm) return { ...s, screen: 'mental' };
      const finished = s.mm.results.length >= 3 && s.mm.status === 'active'
        ? finishMental({ ...s, mm: { ...s.mm, status: 'finished' as const, phase: 'done' as const } }, now)
        : s;
      return { ...finished, mm: null, screen: 'mental' };
    }
    case 'ARCADE_EXIT':
      // Stopping a Gear Blitz early cashes out what was earned so far instead of discarding the run.
      if (s.arcade?.status === 'active' && s.arcade.reward === 'gears' && !s.arcade.versus) return finishArcade({ ...s, arcade: { ...s.arcade, status: 'finished', feedback: undefined } }, now);
      // A run stopped early still goes on the ledger (no best, no XP), so the record is complete.
      if (s.arcade?.status === 'active' && !s.arcade.versus) s = logArcadeRun(s, now);
      return { ...s, arcade: null, screen: s.versus ? 'versus' : s.arcade?.reward === 'gears' ? 'stud' : 'arcade' };

    /* ---------------- versus ---------------- */
    case 'VERSUS_SETUP': {
      const colors = ['#ffb347', '#2dd4bf', '#a78bfa', '#4ade80', '#f472b6', '#22d3ee'];
      const myId = a.kind === 'online' ? (s.versus?.myId ?? `p-${Math.random().toString(36).slice(2, 8)}`) : 'me';
      const players = a.names.map((name, i) => ({ id: i === 0 ? myId : `local-${i}`, name: name.trim() || `Player ${i + 1}`, isMe: i === 0, score: 0, correct: 0, done: false, color: colors[i % colors.length] }));
      const levels = a.levels?.length ? a.levels.slice(0, 10) : [{ game: a.game, selection: a.selection }];
      return { ...s, screen: 'versus', versus: { kind: a.kind, game: levels[0].game, selection: levels[0].selection, seed: a.seed ?? Math.floor(Math.random() * 1e9), players, turn: 0, status: a.kind === 'hotseat' ? 'ready' : 'lobby', roomCode: a.roomCode, isHost: a.isHost, myId, round: 1, durationMs: a.durationMs ?? 60_000, levels, level: 0, wins: {} } };
    }
    case 'VERSUS_SET_PLAYERS':
      return s.versus ? { ...s, versus: { ...s.versus, players: a.players.map((p) => ({ ...p, isMe: p.id === s.versus!.myId })) } } : s;
    case 'VERSUS_ROUND': {
      if (!s.versus) return s;
      if (s.versus.startAt && a.startAt <= s.versus.startAt) return s;
      const roster = a.players ?? s.versus.players.filter(p => !p.withdrawn);
      const players = roster.slice(0, 6).map((p, i) => ({ id: p.id, name: p.name, color: ['#ffb347', '#2dd4bf', '#a78bfa', '#4ade80', '#f472b6', '#22d3ee'][i], isMe: p.id === s.versus!.myId, score: 0, correct: 0, done: false }));
      if (!players.some(p => p.isMe)) return s;
      return { ...s, arcade: null, screen: 'versus', versus: { ...s.versus, round: s.versus.startAt ? s.versus.round + 1 : s.versus.round, seed: a.seed, game: a.game, selection: a.selection, startAt: a.startAt, players, status: 'ready', turn: Math.max(0, players.findIndex((p) => p.isMe)), durationMs: a.durationMs ?? s.versus.durationMs, level: a.level ?? s.versus.level, wins: a.wins ?? s.versus.wins, levels: a.plan?.length ? a.plan.slice(0, 10) : s.versus.levels, awarded: undefined } };
    }
    case 'VERSUS_BEGIN_TURN': {
      const v = s.versus;
      if (!v || v.status !== 'ready') return s;
      const startAt = v.kind === 'online' && v.startAt ? v.startAt : now;
      const arcade = startArcade(v.game, 'blitz', v.selection, s.mastery, now, rng, { seed: v.seed, versus: true, startAt, durationMs: v.durationMs });
      return { ...s, arcade, screen: 'arcade', versus: { ...v, status: 'playing' } };
    }
    case 'VERSUS_REMOTE': {
      const v = s.versus;
      if (!v || a.playerId === v.myId) return s;
      if (a.roundId !== undefined && a.roundId !== `${v.seed}:${v.startAt}`) return s;
      if (!Number.isInteger(a.score) || !Number.isInteger(a.correct) || a.score < 0 || a.score > 10000 || a.correct < 0 || a.correct > 1000) return s;
      const previous = v.players.find(p => p.id === a.playerId);
      if (previous && (previous.done || a.score < previous.score || a.correct < previous.correct)) return s;
      const exists = v.players.some((p) => p.id === a.playerId);
      if (!exists && (v.status !== 'lobby' || v.players.length >= 6)) return s;
      const players = exists
        ? v.players.map((p) => (p.id === a.playerId ? { ...p, score: a.score, correct: a.correct, done: a.done, name: a.name ?? p.name } : p))
        : [...v.players, { id: a.playerId, name: a.name ?? 'Player', isMe: false, score: a.score, correct: a.correct, done: a.done, color: ['#ffb347', '#2dd4bf', '#a78bfa', '#4ade80', '#f472b6', '#22d3ee'][v.players.length % 6] }];
      const allDone = players.every((p) => p.done);
      return { ...s, versus: allDone && v.status !== 'playing' ? toResults({ ...v, players }) : { ...v, players } };
    }
    case 'VERSUS_LEFT': {
      const v = s.versus; if (!v || a.playerId === v.myId) return s;
      const players = v.status === 'lobby' ? v.players.filter(p => p.id !== a.playerId) : v.players.map(p => p.id === a.playerId && !p.done ? { ...p, done: true, withdrawn: true } : p);
      return { ...s, versus: players.length >= 2 && players.every(p => p.done) && v.status === 'between' ? toResults({ ...v, players }) : { ...v, players } };
    }
    case 'VERSUS_CONTINUE': {
      const v = s.versus;
      if (!v) return s;
      if (v.kind === 'hotseat') {
        const nextTurn = v.turn + 1;
        if (nextTurn >= v.players.length) return { ...s, arcade: null, screen: 'versus', versus: toResults(v) };
        return { ...s, arcade: null, screen: 'versus', versus: { ...v, turn: nextTurn, status: 'ready' } };
      }
      const allDone = v.players.every((p) => p.done);
      return { ...s, arcade: null, screen: 'versus', versus: allDone ? toResults(v) : { ...v, status: 'between' } };
    }
    case 'VERSUS_REMATCH': {
      const v = s.versus;
      if (!v) return s;
      const players = v.players.filter(p => !p.withdrawn).map((p) => ({ ...p, score: 0, correct: 0, done: false }));
      const first = v.levels[0] ?? { game: v.game, selection: v.selection };
      return { ...s, arcade: null, screen: 'versus', versus: { ...v, players, turn: 0, status: v.kind === 'hotseat' ? 'ready' : 'lobby', seed: Math.floor(Math.random() * 1e9), round: v.round + 1, startAt: undefined, level: 0, wins: {}, awarded: undefined, game: first.game, selection: first.selection } };
    }
    case 'VERSUS_NEXT_LEVEL': {
      // Hot seat (and a host without a room): move the match on to the next level.
      const v = s.versus;
      if (!v || v.status !== 'results' || v.level + 1 >= v.levels.length) return s;
      const level = v.level + 1; const lv = v.levels[level];
      const players = v.players.filter(p => !p.withdrawn).map((p) => ({ ...p, score: 0, correct: 0, done: false }));
      return { ...s, arcade: null, screen: 'versus', versus: { ...v, players, turn: 0, status: v.kind === 'hotseat' ? 'ready' : 'lobby', seed: Math.floor(Math.random() * 1e9), round: v.round + 1, startAt: undefined, level, game: lv.game, selection: lv.selection, awarded: undefined } };
    }
    case 'VERSUS_EXIT':
      return { ...s, versus: null, arcade: null, screen: 'arcade' };

    /* ---------------- rocket game ---------------- */
    case 'ROCKET_START':
      if (!rocketMissionById(a.missionId)) return s;
      return { ...s, rocket: startRocket(a.missionId, s.mastery, now, rng), screen: 'rocket' };
    case 'ROCKET_MOVE':
      return s.rocket ? { ...s, rocket: moveRocket(s.rocket, a.dir) } : s;
    case 'ROCKET_LANE':
      return s.rocket ? { ...s, rocket: setLane(s.rocket, a.lane) } : s;
    case 'ROCKET_BOOST':
    case 'ROCKET_TIMEOUT': {
      const r = s.rocket;
      if (!r || r.status !== 'active') return s;
      const timedOut = a.type === 'ROCKET_TIMEOUT';
      const out = boost(r, now, timedOut);
      let next: GameState = { ...s, rocket: out.state };
      next = recordAnswer(next, r.question, timedOut ? '' : String(r.options[r.lane]), out.correct, out.timeMs, 'drill', now).state;
      return next;
    }
    case 'ROCKET_NEXT': {
      const r = s.rocket;
      if (!r) return s;
      const nx = rocketNext(r, s.mastery, now, rng);
      if (nx.status === 'won' || nx.status === 'lost') return finishRocket({ ...s, rocket: nx }, now);
      return { ...s, rocket: nx };
    }
    case 'ROCKET_EXIT':
      return { ...s, rocket: null, screen: 'rocket' };

    /* ---------------- math millionaire ---------------- */
    case 'MILL_START':
      return { ...s, millionaire: startMillionaire(a.kind, now), screen: 'millionaire' };
    case 'MILL_PICK': {
      const m = s.millionaire;
      if (!m || m.status !== 'asking') return s;
      const nx = pickOption(m, a.index, now);
      if (nx === m) return s;
      const correct = nx.status !== 'lost';
      let next: GameState = { ...s, millionaire: nx };
      next = recordAnswer(next, m.question, m.options[a.index], correct, Math.max(200, now - m.questionStartedAt), 'drill', now).state;
      if (nx.status === 'won' || nx.status === 'lost') next = finishMillionaire(next, now);
      return next;
    }
    case 'MILL_NEXT':
      return s.millionaire ? { ...s, millionaire: nextRung(s.millionaire, now) } : s;
    case 'MILL_LIFELINE':
      return s.millionaire ? { ...s, millionaire: useLifeline(s.millionaire, a.kind, now) } : s;
    case 'MILL_WALK': {
      const m = s.millionaire;
      if (!m || m.status !== 'asking') return s;
      return finishMillionaire({ ...s, millionaire: walkAway(m) }, now);
    }
    case 'MILL_EXIT':
      return { ...s, millionaire: null, screen: 'millionaire' };

    /* ---------------- stud math ---------------- */
    case 'STUD_START': {
      let rec = s.stats.stud ?? initialStud();
      if (rec.gears < ANTE) return toast({ ...s, screen: 'stud', stud: null }, 'info', `Not enough gears for the ${ANTE}-gear ante. Run a Gear Blitz to earn more.`);
      const st = startStud(a.selection, rec.gears, rng);
      rec = { ...rec, gears: rec.gears - ANTE };
      return { ...s, stats: { ...s.stats, stud: rec }, stud: st, screen: 'stud' };
    }
    case 'STUD_CHOOSE': {
      const st = s.stud; if (!st || st.status !== 'decide') return s;
      const rec = s.stats.stud;
      if (a.choice !== 'fold' && rec.gears < a.choice * ANTE) return toast(s, 'info', `Not enough gears for a ${a.choice}× raise.`);
      const nx = studChoose(st, a.choice, s.mastery, rng);
      if (nx.status === 'done') return finishStud({ ...s, stud: nx }, now);
      return { ...s, stud: nx };
    }
    case 'STUD_ANSWER': {
      const st = s.stud; if (!st || st.status !== 'question' || !st.pending) return s;
      const correct = checkAnswer(st.pending.question, a.given);
      const nx = studAnswer(st, correct, a.given);
      const bet = nx.bets[nx.bets.length - 1];
      const bonus = correct ? STREET_BONUS * st.pending.mult : 0;
      let next: GameState = { ...s, stud: nx, stats: { ...s.stats, stud: { ...s.stats.stud, gears: s.stats.stud.gears - bet + bonus } } };
      next = recordAnswer(next, st.pending.question, a.given, correct, Math.max(200, 3000), 'drill', now).state;
      return next;
    }
    case 'STUD_REVEAL': {
      const st = s.stud; if (!st || st.status !== 'reveal') return s;
      const nx = studReveal(st);
      if (nx.status === 'done') return finishStud({ ...s, stud: nx }, now);
      return { ...s, stud: nx };
    }
    case 'STUD_COLLECT': {
      const st = s.stud; if (!st || st.status !== 'collect') return s;
      const correct = checkAnswer(payoutQuestion(st), a.given);
      return finishStud({ ...s, stud: studCollect(st, correct, a.given) }, now);
    }
    case 'STUD_EXIT':
      return { ...s, stud: null, screen: 'stud' };

    /* ---------------- engine city tycoon ---------------- */
    case 'TYCOON_START': return { ...s, screen: 'tycoon', tycoon: startTycoon(a.setup, now) };
    case 'TYCOON_EXIT': return { ...s, tycoon: null, screen: 'tycoon' };
    case 'TYCOON_HOST': return { ...s, screen: 'tycoon', tycoon: hostLobby(a.level, a.mode, a.code, { id: a.myId, name: s.character?.name ?? 'Host' }, now) };
    case 'TYCOON_JOIN': return { ...s, screen: 'tycoon', tycoon: guestLobby(a.code, { id: a.myId, name: s.character?.name ?? 'Guest' }, now) };
    case 'TYCOON_ROSTER': return s.tycoon ? { ...s, tycoon: tycoonRoster(s.tycoon, a.players) } : s;
    case 'TYCOON_LAUNCH': return s.tycoon ? withTycoon(s, tycoonLaunch(s.tycoon, a.bots, now), now) : s;
    case 'TYCOON_LEFT': return s.tycoon?.online?.host ? withTycoon(s, tycoonLeave(s.tycoon, a.id), now) : s;
    case 'TYCOON_GUEST': return s.tycoon?.online?.host ? withTycoon(s, tycoonGuest(s.tycoon, a.id, a.action), now) : s;
    case 'TYCOON_REMOTE': {
      const g = s.tycoon; if (!g?.online || g.online.host || a.state.rev <= g.rev) return s;
      let next = withTycoon(s, a.state, now);
      // This device's own answers, judged by the host, feed mastery and the Notebook here.
      const r = a.state.review; const pd = g.pending;
      const still = a.state.pending && 'q' in a.state.pending && pd && 'q' in pd && a.state.pending.q?.id === pd.q?.id;
      if (r && r.player === g.online.myId && pd && 'q' in pd && pd.q && !still && current0(g)?.id === g.online.myId) next = recordAnswer(next, pd.q, r.given, r.correct, 6000, 'drill', now).state;
      return next;
    }
    case 'TYCOON_ROLL': return s.tycoon && tycoonMine(s) ? withTycoon(s, tycoonRoll(s.tycoon), now) : s;
    case 'TYCOON_PASS': return s.tycoon && tycoonMine(s) ? withTycoon(s, tycoonPass(s.tycoon), now) : s;
    case 'TYCOON_ACK': return s.tycoon ? withTycoon(s, tycoonAck(s.tycoon), now) : s;
    case 'TYCOON_BUILD': return s.tycoon && tycoonMine(s) ? withTycoon(s, tycoonBuild(s.tycoon, a.space), now) : s;
    case 'TYCOON_BUILD_CANCEL': return s.tycoon && tycoonMine(s) ? withTycoon(s, tycoonCancelBuild(s.tycoon), now) : s;
    case 'TYCOON_MORTGAGE': return s.tycoon && tycoonMine(s) ? withTycoon(s, tycoonMortgage(s.tycoon, a.space), now) : s;
    case 'TYCOON_END_TURN': return s.tycoon && tycoonMine(s) ? withTycoon(s, tycoonEndTurn(s.tycoon), now) : s;
    case 'TYCOON_BOT': return s.tycoon && tycoonCurrent(s.tycoon).kind === 'bot' && (!s.tycoon.online || s.tycoon.online.host) ? withTycoon(s, tycoonBot(s.tycoon), now) : s;
    case 'TYCOON_FINISH': return s.tycoon && s.tycoon.phase !== 'over' && (!s.tycoon.online || s.tycoon.online.host) ? withTycoon(s, tycoonFinish(s.tycoon, now), now) : s;
    case 'TYCOON_JAIL': {
      if (!s.tycoon || !tycoonMine(s)) return s;
      // Fixing a mistake means answering one from your own Notebook, when there is one.
      const fix = a.choice === 'fix' && tycoonIsMe(s) ? activeEntries(s.notebook ?? [])[0]?.question : undefined;
      return withTycoon(s, tycoonJail(s.tycoon, a.choice, fix), now);
    }
    case 'TYCOON_ANSWER': {
      const g = s.tycoon; if (!g || !g.pending || !tycoonMine(s)) return s;
      const pd = g.pending;
      let next = withTycoon(s, tycoonAnswer(g, a.given), now);
      // The profile's own answers feed mastery and the Notebook like any practice.
      if (tycoonIsMe(s) && 'q' in pd && pd.q && next.tycoon?.review) next = recordAnswer(next, pd.q, a.given, next.tycoon.review.correct, 6000, 'drill', now).state;
      return next;
    }

    /* ---------------- equation plaza ---------------- */
    case 'PLAZA_START': return { ...s, screen: 'plaza', plaza: startPlaza(a.setup) };
    case 'PLAZA_EXIT': {
      // An unfinished match is kept, so a player who left by accident can go back (online: to the same seat, no code needed).
      const paused = s.plaza && plazaResumable(s.plaza) ? { game: s.plaza, at: Date.now() } : s.stats.plaza?.paused;
      return { ...s, plaza: null, screen: 'plaza', stats: { ...s.stats, plaza: { ...(s.stats.plaza ?? initialPlaza()), paused } } };
    }
    case 'PLAZA_RESUME': {
      const game = s.plaza ? null : pausedPlaza(s.stats.plaza);
      return game ? { ...s, screen: 'plaza', plaza: game, stats: { ...s.stats, plaza: { ...s.stats.plaza, paused: undefined } } } : s;
    }
    case 'PLAZA_FORGET': return { ...s, stats: { ...s.stats, plaza: { ...(s.stats.plaza ?? initialPlaza()), paused: undefined } } };
    case 'PLAZA_ROSTER': return s.plaza?.online?.host && s.plaza.phase === 'lobby' ? { ...s, plaza: { ...s.plaza, rev: s.plaza.rev + 1, online: { ...s.plaza.online, lobby: a.players.slice(0, 4) } } } : s;
    case 'PLAZA_LAUNCH': return s.plaza ? withPlaza(s, launchPlaza(s.plaza)) : s;
    case 'PLAZA_SEATS': return s.plaza ? withPlaza(s, seatsPlaza(s.plaza, a.here)) : s;
    case 'PLAZA_SIT_OUT': return s.plaza ? withPlaza(s, sitOutPlaza(s.plaza, a.id)) : s;
    case 'PLAZA_END_EARLY': return s.plaza ? withPlaza(s, endPlazaEarly(s.plaza)) : s;
    case 'PLAZA_REMOTE': return s.plaza?.online && !s.plaza.online.host && a.state.online?.code === s.plaza.online.code && a.state.online.myId === s.plaza.online.myId && (a.resync || a.state.rev > s.plaza.rev) ? withPlaza(s, a.state) : s;
    case 'PLAZA_PLAY': {
      if (!s.plaza || (s.plaza.online && !s.plaza.online.host)) return s;
      const next = withPlaza(s, playPlaza(s.plaza, a.move));
      // A Place made during the guided first move counts as having done the guide.
      return s.plaza.coach && next.plaza !== s.plaza ? { ...next, stats: { ...next.stats, plaza: { ...next.stats.plaza, coached: true } } } : next;
    }
    case 'PLAZA_SWAP': return s.plaza && (!s.plaza.online || s.plaza.online.host) ? withPlaza(s, passPlaza(s.plaza)) : s;
    case 'PLAZA_BOT': return s.plaza && (!s.plaza.online || s.plaza.online.host) ? withPlaza(s, botPlaza(s.plaza)) : s;
    /* ---------------- reality lab ---------------- */
    case 'REALITY_RESULT': return { ...s, reality: applyStageResult(s.reality, a.result, now) };
    case 'REALITY_STAGE': {
      const m = s.reality.missions[a.mission] ?? { stage: 0, passed: [], done: false, startedAt: now };
      return { ...s, reality: { ...s.reality, missions: { ...s.reality.missions, [a.mission]: { ...m, stage: Math.max(0, a.stage) } } } };
    }
    case 'REALITY_DONE': {
      if (s.reality.missions[a.mission]?.done) return s;
      const m = realityMission(a.mission);
      const next = { ...s, reality: missionComplete(s.reality, a.mission, now) };
      const xp = a.mission === 'boss' ? 250 : 80;
      return toast(grantXp(next, xp, now), 'quest', `Lab mission complete: ${m?.title ?? a.mission} · +${xp} XP`, 'circuit');
    }
    case 'REALITY_NOTE': return { ...s, reality: { ...s.reality, notes: { ...s.reality.notes, [a.key]: a.text.slice(0, 4000) } } };
    case 'REALITY_KIT': {
      const kit = { ...s.reality.kit };
      if (a.status) kit[a.component] = { status: a.status, note: a.note?.slice(0, 300), at: now }; else delete kit[a.component];
      return { ...s, reality: { ...s.reality, kit } };
    }
    case 'REALITY_INVENTION': return { ...s, reality: { ...s.reality, inventions: [a.invention, ...s.reality.inventions].slice(0, 20) } };
    case 'CONTEST_SET_GRADE': return { ...s, contest: contestSetGrade(s.contest, a.grade) };
    case 'CONTEST_SET_CAPS': return { ...s, contest: { ...s.contest, caps: a.on } };
    /* ---------------- Contest Path track ---------------- */
    case 'CONTEST_START': {
      const contest = startContest(s.contest, a.mode, a.day ?? new Date(now).getDay(), s.mastery, now, a.seed ?? Math.floor(rng.next() * 1e9), a.replace);
      return contest === s.contest ? s : { ...s, contest, screen: 'contest', screenParams: {} };
    }
    case 'CONTEST_ANSWER': {
      const r = s.contest.run;
      if (!r || r.phase !== 'play' || r.feedback || r.paused || !r.queue.length) return s;
      const q = r.items[r.queue[0]].question;
      const correct = checkAnswer(q, a.given);
      const out = contestAnswer(r, correct, now);
      const next: GameState = { ...s, contest: { ...s.contest, run: out.run } };
      // Like the Arcade: the first try trains mastery, logs the answer and files a miss in the Notebook.
      return out.first ? recordAnswer(next, q, a.given, correct, out.timeMs, 'drill', now).state : next;
    }
    case 'CONTEST_NEXT': case 'CONTEST_HINT': case 'CONTEST_EXPLAIN': case 'CONTEST_SKIP': case 'CONTEST_CLOCK': case 'CONTEST_TEACH_NEXT':
    case 'CONTEST_PAUSE': case 'CONTEST_RESUME': case 'CONTEST_QUIT': case 'CONTEST_CLOSE':
      return { ...s, contest: contestReduce(s.contest, a, now) };
    case 'REALITY_SEEN': return { ...s, reality: { ...s.reality, seen: { ...s.reality.seen, [a.key]: (s.reality.seen[a.key] ?? 0) + 1 } } };
    case 'PLAZA_UNDO': return s.plaza ? withPlaza(s, undoPlaza(s.plaza)) : s;
    case 'PLAZA_COACH_DONE': return { ...s, plaza: s.plaza ? { ...s.plaza, coach: false } : s.plaza, stats: { ...s.stats, plaza: { ...(s.stats.plaza ?? initialPlaza()), coached: true } } };
    case 'PLAZA_END': return s.plaza?.mode === 'practice' && s.plaza.phase === 'playing' ? withPlaza(s, { ...s.plaza, phase: 'over', rev: s.plaza.rev + 1, endedAt: Date.now(), undo: undefined }) : s;

    /* ---------------- weakest gear ---------------- */
    case 'GEAR_START':
      return { ...s, gear: startGear(a.setup, s.mastery, now, rng), screen: 'gear' };
    case 'GEAR_BANK': {
      const g = s.gear; if (!g) return s;
      const nx = gearBank(g);
      let next: GameState = { ...s, gear: nx };
      if (nx !== g && nx.bankedThisTurn === CHAIN[CHAIN.length - 1]) next = unlockAchievement(next, 'gear-chain', now);
      return next;
    }
    case 'GEAR_ANSWER': {
      const g = s.gear; if (!g || (g.phase !== 'question' && g.phase !== 'final')) return s;
      const who = g.phase === 'final' ? gearById(g, g.final!.current) : g.contestants[g.turn];
      if (who.bot) return s;
      const correct = checkAnswer(g.question, a.given);
      const nx = gearAnswer(g, correct);
      let next: GameState = { ...s, gear: nx };
      if (who.isMe) next = recordAnswer(next, g.question, a.given, correct, Math.max(200, now - g.questionStartedAt), 'drill', now).state;
      if (g.phase === 'question' && correct && g.chain + 1 === CHAIN.length) next = unlockAchievement(next, 'gear-chain', now);
      if (nx.phase === 'over') next = finishGear(next, now);
      return next;
    }
    case 'GEAR_BOT': {
      const g = s.gear; if (!g || (g.phase !== 'question' && g.phase !== 'final')) return s;
      const who = g.phase === 'final' ? gearById(g, g.final!.current) : g.contestants[g.turn];
      if (!who.bot) return s;
      const d = botTurn(g, rng);
      let nx = d.bank ? gearBank(g) : g;
      nx = gearAnswer(nx, d.correct);
      const next: GameState = { ...s, gear: nx };
      return nx.phase === 'over' ? finishGear(next, now) : next;
    }
    case 'GEAR_NEXT':
      return s.gear ? { ...s, gear: gearNext(s.gear, s.mastery, now, rng) } : s;
    case 'GEAR_TIMEOUT':
      return s.gear ? { ...s, gear: gearTimeout(s.gear) } : s;
    case 'GEAR_VOTE':
      return s.gear ? { ...s, gear: gearVote(s.gear, a.voterId, a.targetId) } : s;
    case 'GEAR_TIEBREAK':
      return s.gear ? { ...s, gear: gearTiebreak(s.gear, a.targetId) } : s;
    case 'GEAR_CONTINUE': {
      const g = s.gear; if (!g) return s;
      const nx = gearContinue(g, s.mastery, now, rng);
      let next: GameState = { ...s, gear: nx };
      if (nx.phase === 'final' && nx.final!.players.includes('me')) { next = { ...next, stats: { ...next.stats, gear: { ...next.stats.gear, finals: next.stats.gear.finals + 1 } } }; next = unlockAchievement(next, 'gear-final', now); }
      return next;
    }
    case 'GEAR_EXIT':
      return { ...s, gear: null, screen: 'gear' };
    case 'GEAR_LAUNCH':
      return s.gear ? { ...s, gear: gearLaunch(s.gear, s.mastery, now, rng) } : s;
    case 'GEAR_LOBBY_ROSTER':
      return s.gear?.online && s.gear.phase === 'lobby' ? { ...s, gear: { ...s.gear, online: { ...s.gear.online, lobby: a.players.slice(0, 8) } } } : s;
    case 'GEAR_REMOTE_STATE': {
      const g = s.gear; if (!g?.online || g.online.isHost) return s;
      const nx = adoptRemote(g, a.state);
      const next: GameState = { ...s, gear: nx };
      return nx.phase === 'over' && g.phase !== 'over' && nx.winnerId ? finishGear(next, now) : next;
    }
    case 'GEAR_LOCAL_ANSWER': {
      // Guest phones record their own answers for mastery; the host decides the game.
      const g = s.gear; if (!g?.online || g.online.isHost || !g.question) return s;
      const cur = g.phase === 'final' ? g.final?.current : g.contestants[g.turn]?.id;
      if (cur !== g.online.myId) return s;
      const correct = checkAnswer(g.question, a.given);
      return recordAnswer(s, g.question, a.given, correct, Math.max(200, now - g.questionStartedAt), 'drill', now).state;
    }
    /* ---------------- wrong-answer notebook ---------------- */
    case 'NOTEBOOK_START': {
      const entry = (s.notebook ?? []).find((e) => e.id === a.entryId && !e.clearedAt);
      if (!entry) return s;
      return { ...s, notebookRun: startRun(entry, now, rng), screen: 'notebook' };
    }
    case 'NOTEBOOK_ANSWER': {
      const r = s.notebookRun; if (!r || r.status !== 'active' || r.feedback) return s;
      const q = r.questions[r.index];
      const correct = checkAnswer(q, a.given);
      const first = r.attempts === 0;
      let next: GameState = { ...s, notebookRun: runAnswer(r, correct) };
      if (first) next = recordAnswer(next, q, a.given, correct, Math.max(200, now - r.questionStartedAt), 'review', now).state;
      return next;
    }
    case 'NOTEBOOK_NEXT': {
      const r = s.notebookRun; if (!r) return s;
      const nx = runNext(r, now);
      if (nx.status !== 'finished') return { ...s, notebookRun: nx };
      const { book, outcome } = applyRun(s.notebook ?? [], nx, now);
      let next: GameState = { ...s, notebook: book, notebookRun: { ...nx, outcome } };
      const xp = outcome.cleared ? 40 : outcome.clean ? 15 : 5;
      next = grantXp(next, xp, now);
      next = toast(next, outcome.cleared ? 'unlock' : 'xp', outcome.cleared ? `Card cleared! Three clean fixes. (+${xp} XP)` : outcome.clean ? `Clean fix. Back in ${outcome.nextDueAt - now > 86_400_000 ? Math.round((outcome.nextDueAt - now) / 86_400_000) + ' days' : '10 minutes'}. (+${xp} XP)` : `Not clean yet. Try again in 10 minutes. (+${xp} XP)`, '/assets/icons/book.svg');
      if (outcome.cleared) { const cleared = book.filter((e) => e.clearedAt).length; if (cleared >= 1) next = unlockAchievement(next, 'notebook-1', now); if (cleared >= 10) next = unlockAchievement(next, 'notebook-10', now); if (activeEntries(book).length === 0) next = unlockAchievement(next, 'notebook-empty', now); }
      return next;
    }
    case 'NOTEBOOK_EXIT':
      return { ...s, notebookRun: null, screen: 'notebook' };
    case 'NOTEBOOK_DROP':
      return { ...s, notebook: (s.notebook ?? []).filter((e) => e.id !== a.entryId) };
    case 'GEAR_LEFT': {
      const g = s.gear; if (!g) return s;
      const nx = gearLeft(g, a.id);
      const next: GameState = { ...s, gear: nx };
      return nx.phase === 'over' && g.phase !== 'over' ? finishGear(next, now) : next;
    }

    /* ---------------- inventory ---------------- */
    case 'USE_ITEM': {
      const def = itemById(a.itemId);
      if (!def || def.kind !== 'consumable' || !hasItem(s.inventory, a.itemId) || !s.character) return s;
      let c = { ...s.character };
      let next: GameState = s;
      for (const e of def.effects ?? []) {
        if (e.type === 'heal') c.hp = Math.min(c.maxHp, c.hp + e.amount);
        if (e.type === 'energy') c.energy = Math.min(c.maxEnergy, c.energy + e.amount);
        if (e.type === 'hint-charges' && next.battle) next = { ...next, battle: { ...next.battle, hintCharges: next.battle.hintCharges + e.amount } };
      }
      next = { ...next, character: c, inventory: removeItem(next.inventory, a.itemId, 1) };
      return toast(next, 'item', `Used ${def.name}.`, def.icon);
    }
    case 'EQUIP':
      return { ...s, inventory: equip(s.inventory, a.itemId) };
    case 'UNEQUIP':
      return { ...s, inventory: unequip(s.inventory, a.slot) };
    case 'REST':
      if (!s.character) return s;
      return toast({ ...s, character: { ...s.character, hp: s.character.maxHp, energy: s.character.maxEnergy } }, 'info', 'You rest at the village. Health and energy restored.');
    case 'TICK': {
      if (!s.character || s.character.energy >= s.character.maxEnergy) return s;
      return { ...s, character: { ...s.character, energy: Math.min(s.character.maxEnergy, s.character.energy + 1) } };
    }
    case 'SET_SETTINGS':
      return { ...s, settings: { ...s.settings, ...a.settings } };
    case 'DISMISS_TOAST':
      return { ...s, toasts: s.toasts.filter((t) => t.id !== a.id) };
    case 'NOTICE':
      return toast(s, 'info', a.text, a.icon);
    /* ---------------- Arithmetic Academy ---------------- */
    case 'ACADEMY_OPEN': {
      const aid = a.academy && academyById(a.academy) ? a.academy : currentAcademy(s).id;
      return { ...s, academy: { ...s.academy, started: true, current: aid }, screen: 'academy', screenParams: { view: a.view ?? 'hub', academy: aid, chapter: a.chapter } };
    }
    case 'ACADEMY_START': {
      const found = a.kind === 'quest' && a.questId ? academyQuestById(a.questId) : undefined;
      const aid = found?.academy.id ?? (a.academy && academyById(a.academy) ? a.academy : currentAcademy(s).id);
      if (!academyUnlocked(s, aid)) return toast(s, 'info', `${academyById(aid)?.name ?? 'That academy'} is still locked.`);
      if (found && !chapterAvailable(s, aid, found.chapter.key)) return toast(s, 'info', `Chapter ${found.chapter.n} is still locked.`);
      if (a.kind === 'trial' && !trialReady(s, aid).ready) return toast(s, 'info', 'The Trial opens once every chapter is mastered and your weak facts are repaired.');
      const key = found?.chapter.key ?? a.chapter ?? 'trial';
      const run = a.kind === 'quest' ? buildQuest(a.questId ?? '', rng, now) : a.kind === 'concept' ? buildConcept(aid, key, rng, now) : a.kind === 'transfer' ? buildTransfer(aid, key, rng, now) : buildTrial(aid, rng, now);
      if (!run) return s;
      const track = trackOf(s.academy, aid);
      const tracks = a.kind === 'trial' ? { ...s.academy.tracks, [aid]: { ...track, trial: { ...track.trial, attempts: track.trial.attempts + 1 } } } : s.academy.tracks;
      return { ...s, academy: { ...s.academy, started: true, current: aid, run, tracks }, screen: 'academy', screenParams: { view: 'run', academy: aid, chapter: run.chapter } };
    }
    case 'ACADEMY_ANSWER': {
      const r = s.academy.run; const step = r?.steps[r.index];
      if (!r || r.status !== 'active' || !step || step.kind !== 'ask' || r.feedback) return s;
      const correct = judge(step, a.given);
      const first = r.attempts === 0;
      const timeMs = Math.max(300, now - r.questionStartedAt);
      let next = s;
      if (first) next = recordAnswer(s, step.question, a.given, correct, timeMs, r.kind === 'trial' ? 'boss' : r.kind === 'quest' ? 'mission' : 'diagnostic', now).state;
      const run: AcademyRun = { ...r, attempts: r.attempts + 1, asked: r.asked + (first ? 1 : 0), correct: r.correct + (first && correct ? 1 : 0), results: first ? [...r.results, correct] : r.results, feedback: { correct, text: feedbackFor(step, correct, !correct && retryAllowed(r)) } };
      return { ...next, academy: { ...next.academy, run } };
    }
    case 'ACADEMY_NEXT': {
      const r = s.academy.run; if (!r || r.status !== 'active') return s;
      const step = r.steps[r.index];
      // A first miss in a quest gets one retry of the same question.
      if (step?.kind === 'ask' && r.feedback && !r.feedback.correct && retryAllowed({ ...r, attempts: r.attempts - 1 }) && r.attempts === 1) {
        return { ...s, academy: { ...s.academy, run: { ...r, feedback: undefined, helperOn: true, questionStartedAt: now } } };
      }
      if (step?.kind === 'ask' && !r.feedback) return s;
      const index = r.index + 1;
      if (index >= r.steps.length) return finishAcademyRun(s, { ...r, index, status: 'done', feedback: undefined }, now);
      return { ...s, academy: { ...s.academy, run: { ...r, index, attempts: 0, feedback: undefined, showExplanation: false, helperOn: false, questionStartedAt: now } } };
    }
    case 'ACADEMY_HELP': {
      const r = s.academy.run; if (!r || r.status !== 'active') return s;
      if (r.kind === 'trial' && r.helperUsed) return s;
      return { ...s, academy: { ...s.academy, run: { ...r, helperOn: true, helperUsed: true } } };
    }
    case 'ACADEMY_TOGGLE_EXPLAIN': {
      const r = s.academy.run; if (!r) return s;
      return { ...s, academy: { ...s.academy, run: { ...r, showExplanation: !r.showExplanation } } };
    }
    case 'ACADEMY_EXIT': {
      const r = s.academy.run;
      return { ...s, academy: { ...s.academy, run: null }, screen: 'academy', screenParams: { view: r ? 'chapter' : 'hub', academy: r?.academyId ?? s.academy.current, chapter: r?.chapter } };
    }
    case 'ACADEMY_GRADUATE': {
      const aid = a.academy && academyById(a.academy) ? a.academy : currentAcademy(s).id;
      const def = academyById(aid)!;
      const track = trackOf(s.academy, aid);
      if (track.graduatedAt) return s;
      const g = graduation(s, aid);
      if (!g.ready) return toast(s, 'info', `Not yet: ${g.reasons[0]}`);
      let next: GameState = { ...s, academy: { ...s.academy, tracks: { ...s.academy.tracks, [aid]: { ...track, graduatedAt: now } } } };
      next = grantXp(next, 1000, now);
      if (next.character) next = { ...next, character: { ...next.character, title: def.title } };
      const nxt = nextAcademy(aid);
      if (nxt && nxt.home && nxt.home !== 'village') next = unlockRegion(next, nxt.home, now);
      if (nxt) next = { ...next, academy: { ...next.academy, current: nxt.id, tracks: { ...next.academy.tracks, [nxt.id]: next.academy.tracks[nxt.id] ?? initialTrack() } } };
      next = changed(next, `The ${def.coreName} is seated.${nxt ? ` The ${nxt.name} is open.` : ' Every core is home.'}`, now);
      next = toast(next, 'achievement', `${def.name}: graduated`, asset('/assets/icons/trophy.svg'));
      return { ...next, world: { ...next.world, currentRegion: 'village', ceremony: `academy:${aid}` }, screen: 'region', screenParams: {} };
    }
    default:
      return s;
  }
}

/* ------------------------------------------------------------------ */
/* rocket resolution                                                   */
/* ------------------------------------------------------------------ */

function finishRocket(s: GameState, now: number): GameState {
  const r = s.rocket!;
  const m = rocketMissionById(r.missionId)!;
  const rec = s.stats.rocket;
  const prev = rec.missions[m.id] ?? { best: 0, stars: 0, completed: false, attempts: 0 };
  const won = r.status === 'won';
  const stars = rocketStars(r);
  const newBest = r.score > prev.best;
  const missions = { ...rec.missions, [m.id]: { best: Math.max(prev.best, r.score), stars: Math.max(prev.stars, stars), completed: prev.completed || won, attempts: prev.attempts + 1 } };
  let next: GameState = { ...s, stats: { ...s.stats, rocket: { points: rec.points + r.score, missions } }, rocket: { ...r, newBest } };
  const xp = Math.round(r.score / 4) + (won ? 40 + stars * 20 : 0);
  next = grantXp(next, xp, now);
  next = toast(next, won ? 'unlock' : 'xp', won ? `${m.name} complete! ${'★'.repeat(stars)} (+${xp} XP)` : `Rocket down. ${r.score} points banked (+${xp} XP)`, '/assets/icons/energy.svg');
  if (won && m.id === 'r1') next = unlockAchievement(next, 'rocket-liftoff', now);
  if (won && m.order >= 4) next = unlockAchievement(next, 'rocket-orbit', now);
  if (won && m.id === 'r7') next = unlockAchievement(next, 'rocket-moon', now);
  if (won && stars === 3) next = unlockAchievement(next, 'rocket-perfect', now);
  const nextMission = ROCKET_MISSIONS[m.order];
  if (won && nextMission && next.stats.rocket.points >= nextMission.pointsToUnlock && !(rec.points >= nextMission.pointsToUnlock && prev.completed)) {
    next = toast(next, 'unlock', `New mission unlocked: ${nextMission.name}`, '/assets/icons/unlock.svg');
  }
  return next;
}

/* ------------------------------------------------------------------ */
/* versus resolution                                                   */
/* ------------------------------------------------------------------ */

/** Round over: show results and, once per round, hand a level win (bigger ship) to the winner(s). */
function toResults(v: import('./types').VersusState): import('./types').VersusState {
  const key = `${v.seed}:${v.startAt ?? v.round}`;
  if (v.awarded === key) return { ...v, status: 'results' };
  const eligible = v.players.filter((p) => !p.withdrawn);
  const best = [...eligible].sort((a, b) => b.score - a.score || b.correct - a.correct)[0];
  const wins = { ...(v.wins ?? {}) };
  if (best && v.players.length >= 2) for (const p of eligible) if (p.score === best.score && p.correct === best.correct) wins[p.id] = (wins[p.id] ?? 0) + 1;
  return { ...v, status: 'results', wins, awarded: key };
}

/* ------------------------------------------------------------------ */
/* weakest gear resolution                                             */
/* ------------------------------------------------------------------ */

function finishGear(s: GameState, now: number): GameState {
  const g = s.gear!; const rec = s.stats.gear ?? initialGear();
  const me = g.contestants.find((c) => c.isMe)!;
  const won = g.winnerId === me.id;
  const fullChains = rec.fullChains + (me.total.banked >= CHAIN[CHAIN.length - 1] ? 1 : 0);
  const record = { ...rec, games: rec.games + 1, wins: rec.wins + (won ? 1 : 0), bestPot: Math.max(rec.bestPot, won ? g.pot : 0), fullChains };
  let next: GameState = { ...s, stats: { ...s.stats, gear: record }, gear: { ...g, newBest: won && g.pot > rec.bestPot } };
  const xp = me.total.right * 3 + (won ? 60 + Math.round(g.pot / 20) : me.out === undefined ? 25 : 8);
  next = grantXp(next, xp, now);
  next = toast(next, won ? 'unlock' : 'xp', won ? `You are the strongest gear! ${g.pot} gears (+${xp} XP)` : `${gearById(g, g.winnerId!).name} takes the pot of ${g.pot} (+${xp} XP)`, '/assets/icons/trophy.svg');
  if (won) next = unlockAchievement(next, 'gear-win', now);
  if (won && g.pot >= 2000) next = unlockAchievement(next, 'gear-pot', now);
  return next;
}

/* ------------------------------------------------------------------ */
/* stud resolution                                                     */
/* ------------------------------------------------------------------ */

function finishStud(s: GameState, now: number): GameState {
  const st = s.stud!; const r = st.result!;
  const rec = s.stats.stud ?? initialStud();
  const collected = r.collected ?? 0;
  const net = studNet(st);
  const won = !st.folded && net > 0;
  const newBest = net > rec.best;
  const record = { ...rec, gears: rec.gears + collected, hands: rec.hands + 1, wins: rec.wins + (won ? 1 : 0), best: Math.max(rec.best, net), bestRank: Math.max(rec.bestRank, st.folded ? 0 : r.rank) };
  let next: GameState = { ...s, stats: { ...s.stats, stud: record }, stud: { ...st, newBest } };
  const xp = st.folded ? 2 : won ? 8 + r.pays * 2 : 4;
  next = grantXp(next, xp, now);
  next = toast(next, won ? 'unlock' : 'xp', st.folded ? `Folded. −${r.stake} gears (+${xp} XP)` : won ? `${HAND_NAMES[r.rank]}: +${net} gears (+${xp} XP)` : net === 0 ? `Push. Stake returned (+${xp} XP)` : `${HAND_NAMES[r.rank]}: −${-net} gears (+${xp} XP)`, '/assets/icons/coins.svg');
  if (won) next = unlockAchievement(next, 'stud-win', now);
  if (won && r.rank >= 7) next = unlockAchievement(next, 'stud-flush', now);
  if (won && r.rank >= 8) next = unlockAchievement(next, 'stud-fullhouse', now);
  if (won && r.rank >= 10) next = unlockAchievement(next, 'stud-royal', now);
  if (record.gears >= 500) next = unlockAchievement(next, 'stud-500', now);
  if (won && r.guessRight && r.pays >= 2) next = unlockAchievement(next, 'stud-cashier', now);
  return next;
}

/* ------------------------------------------------------------------ */
/* millionaire resolution                                              */
/* ------------------------------------------------------------------ */

function finishMillionaire(s: GameState, now: number): GameState {
  const m = s.millionaire!;
  const rec = s.stats.millionaire ?? { best: 0, games: 0, wins: 0, bestRung: 0 };
  const won = m.status === 'won';
  const rung = m.correct; // rungs cleared
  const newBest = m.winnings > rec.best;
  const record = { best: Math.max(rec.best, m.winnings), games: rec.games + 1, wins: rec.wins + (won ? 1 : 0), bestRung: Math.max(rec.bestRung, rung) };
  let next: GameState = { ...s, stats: { ...s.stats, millionaire: record }, millionaire: { ...m, newBest } };
  const xp = rung * 8 + (won ? 150 : 0) + (m.winnings >= LADDER[9] ? 40 : m.winnings >= LADDER[4] ? 15 : 0);
  next = grantXp(next, xp, now);
  next = toast(next, won ? 'unlock' : 'xp', won ? `MILLIONAIRE! ${fmtMoney(m.winnings)} (+${xp} XP)` : `${m.status === 'walked' ? 'Walked away with' : 'Left with'} ${fmtMoney(m.winnings)} (+${xp} XP)`, '/assets/icons/coins.svg');
  if (m.winnings >= LADDER[4]) next = unlockAchievement(next, 'mill-1000', now);
  if (m.winnings >= LADDER[9]) next = unlockAchievement(next, 'mill-32000', now);
  if (won) next = unlockAchievement(next, 'mill-million', now);
  if (rung >= 5 && m.lifelines.fifty && m.lifelines.ask && m.lifelines.swap) next = unlockAchievement(next, 'mill-solo', now);
  return next;
}

/* ------------------------------------------------------------------ */
/* arcade resolution                                                   */
/* ------------------------------------------------------------------ */

/** Mirror the live arcade score into the current versus player's row. */
function syncVersusScore(s: GameState): GameState {
  const v = s.versus; const ar = s.arcade;
  if (!v || !ar) return s;
  const correct = ar.results.filter((r) => r.correct).length;
  const players = v.players.map((p, i) => (i === v.turn ? { ...p, score: ar.score, correct, done: ar.status === 'finished' } : p));
  return { ...s, versus: { ...v, players } };
}

/** Every run, finished or stopped early, goes on the ledger with its clock, so Blitz and Speed history can be graphed. */
function logArcadeRun(s: GameState, now: number): GameState {
  const ar = s.arcade!;
  if (ar.versus) return s;
  const correct = ar.results.filter((r) => r.correct).length;
  const clockMs = ar.mode === 'blitz' ? ar.durationMs : ar.mode === 'speed' ? (ar.targetMs ?? 0) : 0;
  const passed = ar.mode === 'speed' && ar.targetMs ? ar.results.length >= (ar.setSize ?? SPEED_SET) && passedTarget(summarizeRun(ar.results, ar.targetMs)) : ar.mode === 'conquer' ? ar.remaining.length === 0 && ar.conquered.length > 0 : undefined;
  const run = { at: now, game: ar.game, mode: ar.mode, selection: ar.selection, clockMs, n: ar.results.length, right: correct, wrong: ar.results.length - correct, score: ar.score, durationMs: Math.max(0, now - ar.startedAt), passed };
  return { ...s, stats: { ...s.stats, ledger: recordLedgerRun(s.stats.ledger ?? initialLedger(), run) } };
}

function finishArcade(s: GameState, now: number): GameState {
  const ar = s.arcade!;
  const correct = ar.results.filter((r) => r.correct).length;
  if (ar.versus && s.versus) {
    // Versus rounds: no personal bests; small XP for the device owner only.
    let next = syncVersusScore({ ...s, arcade: { ...ar, status: 'finished', feedback: undefined } });
    if (s.versus.players[s.versus.turn]?.isMe) next = grantXp(next, Math.min(60, correct * 2), now);
    return next;
  }
  const rec = s.stats.arcade;
  let next: GameState = { ...s, stats: { ...s.stats, arcade: { ...rec, runs: rec.runs + 1 } } };
  let newBest = false;
  next = logArcadeRun(next, now);
  if (ar.mode === 'blitz') {
    const bk = bestKey(ar.selection, ar.durationMs);
    const prev = rec.bests[bk];
    if (!prev || ar.score > prev.score) { newBest = true; next = { ...next, stats: { ...next.stats, arcade: { ...next.stats.arcade, bests: { ...next.stats.arcade.bests, [bk]: { score: ar.score, correct, at: now } } } } }; }
    const xp = Math.round(correct * (ar.game === 'word' ? 8 : PICTURE_GAMES[ar.game] ? 8 : ar.game === 'tricks' ? 5 : ar.game === 'mental' ? 4 : 3) + blitzStars(correct, ar.durationMs, ar.game) * 20);
    next = grantXp(next, xp, now);
    next = toast(next, 'xp', `Blitz: ${correct} correct · ${ar.score} pts (+${xp} XP)`, '/assets/icons/hourglass.svg');
    const per60 = correct * (60_000 / ar.durationMs);
    const slow = ar.game === 'word' || ar.game === 'tricks' || ar.game === 'mental' || !!PICTURE_GAMES[ar.game];
    if (!slow && per60 >= 20) next = unlockAchievement(next, 'blitz-20', now);
    if (!slow && per60 >= 35) next = unlockAchievement(next, 'blitz-35', now);
    if (ar.game === 'tricks' && correct >= 12) next = unlockAchievement(next, 'trick-blitz', now);
    if (ar.game === 'mental' && correct >= 20) next = unlockAchievement(next, 'mental-blitz', now);
    if (ar.game === 'word' && correct >= 8) next = unlockAchievement(next, 'word-blitz', now);
    if (ar.game === 'volume' && correct >= 7) next = unlockAchievement(next, 'volume-blitz', now);
    if (PICTURE_GAMES[ar.game] && !['volume', 'measure'].includes(ar.game) && correct >= 7) next = unlockAchievement(next, `${ar.game}-blitz`, now);
    if (ar.game === 'measure' && correct >= 7) next = unlockAchievement(next, 'measure-blitz', now);
    if (ar.reward === 'gears') {
      const gears = correct * GEARS_PER_CORRECT + blitzStars(correct, ar.durationMs, ar.game) * GEARS_PER_STAR;
      next = { ...next, stats: { ...next.stats, stud: { ...(next.stats.stud ?? initialStud()), gears: (next.stats.stud?.gears ?? 0) + gears } } };
      next = toast(next, 'unlock', `Gear Blitz: +${gears} gears for the Stud table`, '/assets/icons/coins.svg');
    }
  } else if (ar.mode === 'conquer') {
    const timeMs = now - ar.startedAt;
    const prev = rec.conquered[ar.selection];
    if (!prev || timeMs < prev.timeMs) { newBest = true; next = { ...next, stats: { ...next.stats, arcade: { ...next.stats.arcade, conquered: { ...next.stats.arcade.conquered, [ar.selection]: { timeMs, at: now } } } } }; }
    const xp = prev ? 30 : 80;
    next = grantXp(next, xp, now);
    next = toast(next, 'unlock', `${parseSelection(ar.game, ar.selection).label} conquered! (+${xp} XP)`, '/assets/icons/medal.svg');
    const conq = next.stats.arcade.conquered;
    if (/^mult:\d+$/.test(ar.selection)) next = unlockAchievement(next, 'conquer-1', now);
    if (TABLE_ORDER.every((n) => conq[`mult:${n}`])) next = unlockAchievement(next, 'conquer-all', now);
    if (conq['bonds:10']) next = unlockAchievement(next, 'bonds-10', now);
    if (conq['bonds:100']) next = unlockAchievement(next, 'bonds-100', now);
    if (ar.game === 'word') next = unlockAchievement(next, 'word-conquer', now);
    if (ar.game === 'tricks') next = unlockAchievement(next, 'trick-conquer', now);
    if (ar.game === 'mental') next = unlockAchievement(next, 'mental-conquer', now);
    if (ar.game === 'volume') next = unlockAchievement(next, 'volume-conquer', now);
    if (ar.game === 'measure') next = unlockAchievement(next, 'measure-conquer', now);
    if (PICTURE_GAMES[ar.game] && !['volume', 'measure'].includes(ar.game)) next = unlockAchievement(next, `${ar.game}-conquer`, now);
  } else if (ar.mode === 'speed' && ar.targetMs) {
    const sum = summarizeRun(ar.results, ar.targetMs);
    const run = { at: now, game: ar.game, selection: ar.selection, targetMs: ar.targetMs, ...sum };
    next = { ...next, stats: { ...next.stats, speed: addRun(next.stats.speed ?? initialSpeed(), run) } };
    const passed = passedTarget(sum);
    const xp = sum.correct * 3 + sum.onTime * 2 + (passed ? 30 : 0);
    next = grantXp(next, xp, now);
    const nt = nextTarget(ar.targetMs);
    next = toast(next, 'xp', passed ? (nt ? `Speed: ${sum.onTime}/${sum.n} on the ${ar.targetMs / 1000} s clock. Ready for ${nt / 1000} s! (+${xp} XP)` : `Speed: ${sum.onTime}/${sum.n} at the 3-second goal! (+${xp} XP)`) : `Speed: ${sum.onTime}/${sum.n} on the clock · avg ${(sum.avgMs / 1000).toFixed(1)} s (+${xp} XP)`, '/assets/icons/hourglass.svg');
    if (passed) next = unlockAchievement(next, 'speed-pass', now);
    if (passed && ar.targetMs <= SPEED_GOAL_MS) next = unlockAchievement(next, 'speed-3', now);
    newBest = passed;
  } else {
    next = grantXp(next, Math.min(40, correct * 2), now);
  }
  return { ...next, arcade: { ...next.arcade!, status: 'finished', feedback: undefined, newBest } };
}

/** Academy achievements, checked after every mental answer and at the end of a session. */
function mmCheckAchievements(s: GameState, now: number): GameState {
  const m = s.stats.mental ?? initialMental();
  let next = s;
  const solved = m.records.totalSolved;
  if (solved >= 100) next = unlockAchievement(next, 'mm-100', now);
  if (solved >= 500) next = unlockAchievement(next, 'mm-500', now);
  if (solved >= 1000) next = unlockAchievement(next, 'mm-1000', now);
  if (m.records.bestStreak >= 25 || s.stats.answerStreak >= 25) next = unlockAchievement(next, 'mm-streak25', now);
  if (m.records.bestStreak >= 50 || s.stats.answerStreak >= 50) next = unlockAchievement(next, 'mm-streak50', now);
  if (skillMastery('mm.make10', next.mastery, now) >= 90) next = unlockAchievement(next, 'mm-make10', now);
  if (skillMastery('mm.make100', next.mastery, now) >= 90) next = unlockAchievement(next, 'mm-make100', now);
  const comp = Math.min(skillMastery('mm.add2.comp', next.mastery, now), skillMastery('mm.sub2.comp', next.mastery, now));
  if (comp >= 85) next = unlockAchievement(next, 'mm-compensate', now);
  if (MM_WORLDS.every((w) => MM_SKILLS.filter((x) => x.world === w.n).every((x) => skillMastery(x.id, next.mastery, now) >= 85))) next = unlockAchievement(next, 'mm-master', now);
  if (m.workoutStreak >= 7) next = unlockAchievement(next, 'mm-workout', now);
  return next;
}

/** End of a mental-math session: records, mastery passes, achievements, XP and the report. */
function finishMental(s: GameState, now: number): GameState {
  const sess = s.mm!;
  const rep = MM.report(sess);
  const passed = MM.passedMastery(sess) && (sess.mode === 'mastery' || sess.mode === 'boss');
  const beat = MM.bossBeaten(sess);
  const world = MM_WORLDS.find((w) => w.n === sess.world);
  let mental = mmApplySession(s.stats.mental ?? initialMental(), {
    skillId: sess.skillId, mode: sess.mode, results: sess.results, bestStreak: sess.bestStreak,
    passedMastery: passed, targetMs: sess.targetMs, bossWorld: beat && world ? world.id : undefined, now,
  });
  if (sess.mode === 'workout' && rep.solved >= 6) {
    const day = mmToday(now);
    if (mental.workoutDate !== day) {
      const yesterday = new Date(now - 86_400_000).toISOString().slice(0, 10);
      mental = { ...mental, workoutDate: day, workoutStreak: mental.workoutDate === yesterday ? mental.workoutStreak + 1 : 1 };
    }
  }
  if (sess.mode === 'placement') {
    const pr = placementResult(sess.placement?.passed ?? []);
    // Placement opens the worlds the learner demonstrably already owns.
    mental = { ...mental, placement: { at: now, level: pr.level, startSkill: pr.startSkill }, placedWorld: Math.max(mental.placedWorld ?? 0, pr.worlds) };
  }
  let next: GameState = { ...s, stats: { ...s.stats, mental } };
  const xp = Math.round(rep.correct * 4 + (passed ? 40 : 0) + (beat ? 80 : 0) + (rep.accuracy === 1 && rep.solved >= 8 ? 20 : 0));
  if (xp > 0) next = grantXp(next, xp, now);
  if (rep.solved >= 8 && rep.accuracy === 1) next = unlockAchievement(next, 'mm-perfect', now);
  if (beat) next = unlockAchievement(next, 'mm-boss', now);
  if (passed) {
    const sk = mmSkill(sess.skillId);
    if (sk?.world === 2 && sk.op === 'add') next = unlockAchievement(next, 'mm-add2', now);
    if (sk?.world === 3) next = unlockAchievement(next, 'mm-add3', now);
    if (sk?.op === 'sub' && sk.world >= 5) next = unlockAchievement(next, 'mm-sub', now);
    if (sk?.op === 'mul' && sk.world >= 7) next = unlockAchievement(next, 'mm-mul', now);
  }
  if (sess.mode === 'speed' && sess.targetMs) {
    const sk = mmSkill(sess.skillId);
    const onTime = sess.results.filter((r) => r.correct && r.timeMs <= sess.targetMs!).length;
    const clean = rep.solved >= 8 && rep.correct >= Math.ceil(rep.solved * 0.9) && onTime >= Math.ceil(rep.solved * 0.9);
    if (clean && sk && sess.targetMs <= (sk.speedLadder[sk.speedLadder.length - 1] ?? 3) * 1000) next = unlockAchievement(next, 'mm-speed', now);
  }
  next = mmCheckAchievements(next, now);
  const msg = beat ? `${world?.boss.name ?? 'The boss'} defeated!` : passed ? `Mastery passed: ${mmSkill(sess.skillId)?.name ?? 'skill'}` : `${rep.correct}/${rep.solved} correct · ${(rep.avgMs / 1000).toFixed(1)} s average`;
  next = toast(next, beat || passed ? 'unlock' : 'xp', `Mental math: ${msg}${xp ? ` (+${xp} XP)` : ''}`, asset('/assets/icons/brain.svg'));
  return next;
}

function unlockAchievement(s: GameState, id: string, now: number): GameState {
  if (s.achievements[id]) return s;
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) return s;
  let next: GameState = { ...s, achievements: { ...s.achievements, [id]: now } };
  next = toast(next, 'achievement', `Achievement: ${a.name}`, a.icon);
  return grantXp(next, a.xp, now);
}

/* ------------------------------------------------------------------ */
/* battle resolution                                                   */
/* ------------------------------------------------------------------ */

function resolveVictory(s: GameState, now: number): GameState {
  const b = s.battle!;
  const enemy = enemyById(b.enemyId)!;
  let next: GameState = { ...s, stats: { ...s.stats, enemiesDefeated: s.stats.enemiesDefeated + 1 } };
  next = bumpDay(next, now, (d) => ({ ...d, battlesWon: d.battlesWon + 1 }));
  const acc = battleAccuracy(b);
  const xp = Math.round(enemy.xp * (0.6 + 0.4 * acc) * (b.route === 'loud' ? 1.3 : 1));
  next = grantXp(next, xp, now);
  next = toast(next, 'xp', `${enemy.name} defeated: +${xp} XP`, asset('/assets/icons/sword.svg'));
  for (const d of enemy.drops) {
    if (rng.chance(d.chance)) {
      const qty = rng.int(d.qty[0], d.qty[1]);
      next = { ...next, inventory: addItem(next.inventory, d.itemId, qty) };
      next = toast(next, 'item', `Found ${qty} × ${itemById(d.itemId)?.name ?? d.itemId}`, itemById(d.itemId)?.icon);
      next = emit(next, { type: 'item-collected', itemId: d.itemId, qty }, now);
    }
  }
  // Scouting: the region ahead is marked on the map.
  if (b.preview) {
    const scouted = Array.from(new Set([...(next.world.scouted ?? []), b.regionId]));
    next = { ...next, world: { ...next.world, scouted } };
    next = toast(next, 'unlock', `Scouted ${regionById(b.regionId)?.name ?? 'the region'}. Now you know what's waiting.`, asset('/assets/icons/compass.svg'));
  }
  // Depth progression.
  if (b.depth !== undefined && !b.preview) {
    const key = `${b.regionId}:${b.depth}`;
    const wins = (next.world.depthWins[key] ?? 0) + 1;
    const def = depthDef(b.regionId, b.depth);
    const clearedBefore = next.world.depthCleared[b.regionId] ?? 0;
    next = { ...next, world: { ...next.world, depthWins: { ...next.world.depthWins, [key]: wins } } };
    if (def && wins >= def.clears && clearedBefore < b.depth) {
      next = { ...next, world: { ...next.world, depthCleared: { ...next.world.depthCleared, [b.regionId]: b.depth } } };
      const where = clearedWhere(b.regionId, b.depth);
      next = toast(next, 'unlock', `${def.name} cleared! ${where[0].toUpperCase()}${where.slice(1)}.`, asset('/assets/icons/pickaxe.svg'));
      next = changed(next, `${def.name} cleared — ${where}.`, now);
      next = emit(next, { type: 'depth-cleared', regionId: b.regionId, depth: b.depth }, now);
    }
    // Side objective: done once, and it shows up in the village.
    const side = def?.side;
    const sideKey = `${b.regionId}:${b.depth}`;
    if (side && !(next.world.sideDone ?? []).includes(sideKey)) {
      const secs = (now - b.startedAt) / 1000;
      const met = side.kind === 'nomiss' ? b.wrongCount === 0 : side.kind === 'streak' ? (b.bestStreak ?? 0) >= side.target : side.kind === 'fast' ? secs <= side.target : (b.hintsUsed ?? 0) === 0;
      if (met) {
        next = { ...next, world: { ...next.world, sideDone: [...(next.world.sideDone ?? []), sideKey] }, inventory: addItem(addItem(next.inventory, 'repair-kit', 1), 'ore-crystal', 1) };
        next = grantXp(next, 40, now);
        next = toast(next, 'quest', `Side objective complete: ${side.text.split(':')[0]}. ${side.reward[0].toUpperCase()}${side.reward.slice(1)}. (+40 XP, Repair Kit, Ore Crystal)`, asset('/assets/icons/star.svg'));
        next = changed(next, `${side.text.split(':')[0]} — ${side.reward}.`, now);
      }
    }
  }
  if (enemy.isBoss) {
    next = { ...next, stats: { ...next.stats, bossesDefeated: Array.from(new Set([...next.stats.bossesDefeated, enemy.id])) } };
    next = emit(next, { type: 'boss-defeated', enemyId: enemy.id }, now);
  }
  next = emit(next, { type: 'enemy-defeated', enemyId: enemy.id, regionId: b.regionId, depth: b.depth }, now);
  // Review dungeon progression.
  if (next.dungeon) {
    const index = next.dungeon.index + 1;
    const cleared = index >= next.dungeon.facts.length;
    next = { ...next, dungeon: { ...next.dungeon, index, defeated: next.dungeon.defeated + 1, status: cleared ? 'cleared' : 'active' } };
    if (cleared) {
      next = { ...next, stats: { ...next.stats, dungeonClears: next.stats.dungeonClears + 1 } };
      next = grantXp(next, 120, now);
      next = toast(next, 'unlock', 'Dungeon of Forgotten Knowledge cleared! (+120 XP)', asset('/assets/icons/skull.svg'));
    }
  }
  return checkAchievements(next, now);
}

function resolveDefeat(s: GameState, now: number): GameState {
  void now;
  return s;
}

/* ------------------------------------------------------------------ */
/* lesson helpers                                                      */
/* ------------------------------------------------------------------ */

function prepareLessonStep(s: GameState, l: LessonProgress, now: number): LessonProgress {
  const def = lessonById(l.lessonId)!;
  const step = def.steps[l.step];
  if (step?.type === 'try') {
    const question = generateQuestion(step.skillId, s.mastery, { rng, difficulty: step.difficulty, recentFacts: s.recentFacts });
    return { ...l, question, questionStartedAt: now };
  }
  return { ...l, question: undefined };
}


/** Local games: player 1 is the profile. Online: the player with this device's id. */
const tycoonMeId = (g: TycoonGame) => g.online?.myId ?? 'p1';
/** Whose turn it is can be acted on from this device: a local human, or this device's own online seat. */
function tycoonMine(s: GameState): boolean {
  const g = s.tycoon; if (!g) return false;
  const p = tycoonCurrent(g);
  if (g.online) return g.online.host && p.id === g.online.myId;
  return p.kind === 'human';
}
const current0 = (g: TycoonGame) => g.players[g.turn];
const tycoonIsMe = (s: GameState) => !!s.tycoon && tycoonCurrent(s.tycoon).id === tycoonMeId(s.tycoon);
function withTycoon(s: GameState, g: TycoonGame, now: number): GameState {
  if (s.tycoon === g) return s;
  let next: GameState = { ...s, tycoon: g };
  if (g.phase === 'over' && s.tycoon?.phase !== 'over') {
    const me = tycoonMeId(g);
    const mine = g.players.find((p) => p.id === me);
    next = { ...next, stats: { ...next.stats, tycoon: recordTycoon(next.stats.tycoon ?? initialTycoon(), g, me) } };
    if (mine) {
      const won = g.winner === me;
      const xp = Math.min(80, 10 + mine.stats.right * 2 + (won ? 20 : 0));
      next = grantXp(next, xp, now);
      next = toast(next, won ? 'unlock' : 'xp', `Engine City Tycoon: ${won ? 'you win!' : 'game over.'} +${xp} XP`, '/assets/icons/coins.svg');
    }
  }
  return next;
}

/** Online Dice Workshop: when the table finishes, this device's own checks and score join the solo record. */
function withDiceTable(s: GameState, t: DiceTable): GameState {
  if (s.diceTable === t) return s;
  let next: GameState = { ...s, diceTable: t };
  if (t.phase === 'over' && s.diceTable?.phase !== 'over') {
    const me = t.players.find((p) => p.id === t.online.myId);
    if (me) {
      const d = next.diceWorkshop ?? emptyDiceData();
      const score = diceTotals(me.run.card, me.run.bonus).total;
      next = { ...next, diceWorkshop: { ...d, attempts: d.attempts + me.attempts, correct: d.correct + me.correct, games: d.games + (me.run.finished ? 1 : 0), best: me.run.finished ? Math.max(d.best, score) : d.best } };
    }
  }
  return next;
}

/** Saved Plaza records. A match kept after Leave must still be a well-formed game. */
function loadPlazaRecord(r: PlazaRecord | undefined): PlazaRecord {
  const rec = r ?? initialPlaza();
  return rec.paused && (!isPlazaState(rec.paused.game) || !Number.isFinite(rec.paused.at)) ? { ...rec, paused: undefined } : rec;
}
function withPlaza(s: GameState, plaza: PlazaState): GameState {
  if (s.plaza === plaza) return s;
  return { ...s, plaza, stats: { ...s.stats, plaza: recordPlaza(s.stats.plaza ?? initialPlaza(), plaza) } };
}

