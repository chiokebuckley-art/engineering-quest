import type { BattleLogEntry, BattleState, BattleVerb, EnemyDef, MasteryRecord, Question, RegionId, SkillId } from '../types';
import { checkAnswer, generateFromSkills, questionForFact } from '../questions';
import type { Rng } from '../rng';
import { effectiveMastery } from '../mastery/MasteryEngine';
import { tipFor, type TipNpc } from './tips';

let logId = 1;
const article = (name: string) => (/^[aeiou]/i.test(name) ? 'An' : 'A');
const log = (kind: BattleLogEntry['kind'], text: string): BattleLogEntry => ({ id: logId++, kind, text });

export interface CombatConfig {
  damageBonusPercent: number;
  hintCharges: number;
  shield: number;
  difficulty: 1 | 2 | 3 | 4 | 5 | 6;
  /** For the review dungeon: a specific fact this enemy carries. */
  factId?: string;
  /** Route into a gallery changes the enemy's HP (quiet: fewer facts, loud: more). */
  hpScale?: number;
  /** A training shield from the Arcade, spent on this fight. */
  buffLabel?: string;
  /** Scouting fights and bosses are always typed. */
  preview?: boolean;
}

function nextQuestion(enemy: EnemyDef, mastery: Record<string, MasteryRecord>, rng: Rng, recent: string[], difficulty: CombatConfig['difficulty'], factId?: string, skills?: SkillId[]): Question {
  if (factId) {
    const q = questionForFact(factId, mastery, { rng, recentFacts: [] });
    if (q) return q;
  }
  return generateFromSkills(skills ?? enemy.skills, mastery, { rng, recentFacts: recent, difficulty });
}

/* ------------------------------------------------------------------ */
/* Verbs: typing is one weapon, not the only one                        */
/* ------------------------------------------------------------------ */

const PRODUCT = /^(\d+) × (\d+) = \?$/;
const shuffle = <T,>(xs: T[], rng: Rng): T[] => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = rng.int(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Which verb this question is answered with. Early galleries lean on building and choosing; bosses are exams and always typed. */
export function verbFor(questionsAsked: number, depth: number | undefined, q: Question, typedOnly: boolean): BattleVerb {
  if (typedOnly) return 'type';
  const mult = !!q.factId?.startsWith('fact:mult:') && PRODUCT.test(q.expression);
  if (mult) {
    const seq: BattleVerb[] = (depth ?? 1) <= 2 ? ['array', 'type', 'choose', 'type', 'plate'] : ['type', 'choose', 'type', 'plate', 'type', 'array'];
    return seq[(questionsAsked - 1) % seq.length];
  }
  if (q.factId?.startsWith('fact:div:')) return questionsAsked % 3 === 2 ? 'choose' : 'type';
  return 'type';
}

/** Four numbers to pick from: the answer and near-misses a learner actually makes (one group too many or too few). */
export function numberChoices(q: Question, rng: Rng): string[] {
  const ans = q.answer;
  const m = PRODUCT.exec(q.expression);
  const pool: number[] = [];
  if (m) { const a = Number(m[1]); const b = Number(m[2]); pool.push(a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, a + b, ans + 10, ans - 10); }
  else pool.push(ans + 1, ans - 1, ans + 2, ans - 2, ans + 10);
  const wrong = shuffle(Array.from(new Set(pool.filter((n) => Number.isInteger(n) && n > 0 && n !== ans))), rng).slice(0, 3);
  while (wrong.length < 3) wrong.push(ans + wrong.length + 3);
  return shuffle([ans, ...wrong], rng).map(String);
}

/** Four power plates, each a multiplication: exactly one of them makes the target. */
export function plateChoices(q: Question, rng: Rng): string[] {
  const m = PRODUCT.exec(q.expression)!;
  const a = Number(m[1]); const b = Number(m[2]); const ans = a * b;
  // Near-miss plates first (one group off), then wider ones so even 1 × 1 has three wrong plates.
  const cands: [number, number][] = [[a, b + 1], [a + 1, b], [a - 1, b + 1], [a + 1, b - 1], [a, b - 1], [a - 1, b], [a + 2, b - 1], [a + 1, b + 1], [a, b + 2], [a + 2, b], [a + 2, b + 1]];
  const seen = new Set<string>();
  const wrong: string[] = [];
  for (const [x, y] of [...shuffle(cands.slice(0, 7), rng), ...cands.slice(7)]) {
    if (x < 1 || y < 1 || x * y === ans) continue;
    const k = `${Math.min(x, y)}x${Math.max(x, y)}`; if (seen.has(k)) continue; seen.add(k);
    wrong.push(`${x} × ${y}`); if (wrong.length === 3) break;
  }
  return shuffle([`${a} × ${b}`, ...wrong], rng);
}

/** The given string a verb submits: builds and plates are turned into the number they make. */
export const plateValue = (expr: string): number => { const m = /^(\d+) × (\d+)$/.exec(expr); return m ? Number(m[1]) * Number(m[2]) : NaN; };
export function arrayGiven(q: Question, rows: number, cols: number): string {
  const m = PRODUCT.exec(q.expression);
  if (!m) return String(rows * cols);
  const a = Number(m[1]); const b = Number(m[2]);
  const ok = (rows === a && cols === b) || (rows === b && cols === a);
  // The right shape is a hit; the wrong shape is a miss even if it happens to hold the same number of dots.
  return ok ? String(q.answer) : rows * cols === q.answer ? '-1' : String(rows * cols);
}

function withVerb(b: BattleState, q: Question, rng: Rng, typedOnly: boolean): Pick<BattleState, 'verb' | 'choices'> {
  const verb = verbFor(b.questionsAsked, b.depth, q, typedOnly);
  return { verb, choices: verb === 'choose' ? numberChoices(q, rng) : verb === 'plate' ? plateChoices(q, rng) : undefined };
}

/* ------------------------------------------------------------------ */
/* Phases: bosses that change shape and teach a property               */
/* ------------------------------------------------------------------ */

export function phaseIndex(enemy: EnemyDef, hp: number, maxHp: number): number {
  if (!enemy.phases?.length) return 0;
  const frac = hp / maxHp;
  let i = 0;
  enemy.phases.forEach((p, k) => { if (frac <= p.at + 1e-9) i = k; });
  return i;
}

/** Mirror Scales swaps the factors (the order never changes a product); Split Breath breaks a fact into two easy ones. */
export function applySpecial(q: Question, kind: 'mirror' | 'split'): { q: Question; text: string } | null {
  const m = PRODUCT.exec(q.expression);
  if (!m) return null;
  const a = Number(m[1]); const b = Number(m[2]);
  if (kind === 'mirror') {
    if (a === b) return null;
    return { q: { ...q, id: `${q.id}-m`, expression: `${b} × ${a} = ?` }, text: `MIRROR SCALES — the factors swapped sides. ${b} × ${a} makes the same as ${a} × ${b}: order never changes a product.` };
  }
  const big = Math.max(a, b); const small = Math.min(a, b);
  if (big < 6 || small < 2) return null;
  const s = big > 10 ? 10 : 5;
  return { q, text: `SPLIT BREATH — break it: ${small} × ${big} = ${small} × ${s} + ${small} × ${big - s}. Solve both parts, then add.` };
}

export function startBattle(enemy: EnemyDef, regionId: RegionId, mastery: Record<string, MasteryRecord>, playerHp: number, rng: Rng, cfg: CombatConfig, depth?: number, now = Date.now()): BattleState {
  const skills = enemy.phases?.[0]?.skills;
  const question = nextQuestion(enemy, mastery, rng, [], cfg.difficulty, cfg.factId, skills);
  // Quiet routes are shorter fights, loud ones longer; HP stays a whole number of hits.
  const hits = Math.max(1, Math.round((enemy.hp * (cfg.hpScale ?? 1)) / enemy.hitDamage));
  const hp = enemy.hitDamage * hits;
  const logs = [log('info', enemy.isBoss ? `${enemy.name} rises. ${enemy.flavor}` : `${article(enemy.name)} ${enemy.name} blocks the way. ${enemy.flavor}`)];
  if (cfg.buffLabel) logs.push(log('info', `${cfg.buffLabel}: a shield of ${cfg.shield} absorbs the first blows.`));
  if (enemy.phases?.length) logs.push(log('info', `Phase 1 — ${enemy.phases[0].name}. ${enemy.phases[0].text}`));
  const b: BattleState = {
    enemyId: enemy.id, regionId, depth,
    enemyHp: hp, enemyMaxHp: hp,
    playerHpAtStart: playerHp,
    question, questionStartedAt: now, attemptsOnCurrent: 0, hintShown: false, solutionShown: false,
    log: logs,
    correctCount: 0, wrongCount: 0, questionsAsked: 1, streak: 0, bestStreak: 0, hintsUsed: 0,
    status: 'active', isBoss: !!enemy.isBoss, startedAt: now, hintCharges: cfg.hintCharges, retryQueue: [], shield: cfg.shield,
    phase: enemy.phases?.length ? 0 : undefined,
  };
  return { ...b, ...withVerb(b, question, rng, !!enemy.isBoss || !!cfg.preview || !!cfg.factId) };
}

export interface AnswerOutcome {
  battle: BattleState;
  correct: boolean;
  /** Whether this attempt should feed the mastery engine (only first attempts count). */
  countsForMastery: boolean;
  damage: number;
  playerDamage: number;
  timeMs: number;
  enemyDefeated: boolean;
  playerDefeated: boolean;
  bossFailed: boolean;
}

/**
 * Resolve an answer. Damage = enemy.hitDamage × streak multiplier × equipment bonus (+ speed bonus once the
 * fact is at least Nearly Mastered). Wrong answers let the enemy strike, show a hint and allow a retry.
 */
export function submitAnswer(b: BattleState, enemy: EnemyDef, given: string, mastery: Record<string, MasteryRecord>, cfg: CombatConfig, playerHp: number, now = Date.now()): AnswerOutcome {
  const timeMs = Math.max(200, now - b.questionStartedAt);
  const correct = checkAnswer(b.question, given);
  const firstAttempt = b.attemptsOnCurrent === 0;
  const next: BattleState = { ...b, log: [...b.log], retryQueue: [...b.retryQueue], attemptsOnCurrent: b.attemptsOnCurrent + 1 };
  let damage = 0;
  let playerDamage = 0;

  if (correct) {
    if (firstAttempt) {
      next.correctCount += 1;
      next.streak += 1;
      next.bestStreak = Math.max(b.bestStreak ?? 0, next.streak);
      // Bosses are exams: every correct answer counts the same, so the fight lasts the full set of facts.
      const streakMult = enemy.isBoss ? 1 : next.streak >= 5 ? 1.5 : next.streak >= 3 ? 1.25 : 1;
      const factM = b.question.factId ? effectiveMastery(mastery[b.question.factId], now) : 0;
      const target = 4000;
      const speedBonus = factM >= 85 && timeMs < target ? 5 : 0;
      damage = Math.round(enemy.hitDamage * streakMult * (1 + cfg.damageBonusPercent / 100)) + speedBonus;
      next.enemyHp = Math.max(0, b.enemyHp - damage);
      next.log.push(log('hit', `${b.question.expression.replace(' = ?', '')} = ${b.question.answer}. Energy blast hits ${enemy.name} for ${damage} damage.${speedBonus ? ' Speed bonus!' : ''}${streakMult > 1 ? ` ×${streakMult} streak!` : ''}`));
    } else if (!enemy.isBoss && (b.recovery === 'retry' || b.recovery === 'helper')) {
      // The player chose how to recover: a clean retry lands a full blow, a helped one half. No streak, no mastery credit.
      damage = b.recovery === 'retry' ? enemy.hitDamage : Math.round(enemy.hitDamage / 2);
      next.enemyHp = Math.max(0, b.enemyHp - damage);
      next.log.push(log('hit', `${b.question.expression.replace(' = ?', '')} = ${b.question.answer}. ${b.recovery === 'retry' ? 'Clean retry' : 'Array-guided strike'} hits ${enemy.name} for ${damage} damage.`));
    } else {
      // Bosses are exams: a corrected answer moves on but deals no damage.
      next.log.push(log('info', `Correct on the retry: ${b.question.answer}. The attack is weakened — no damage, but you may continue.`));
    }
    next.feedback = { correct: true, damage, text: firstAttempt ? (next.streak >= 5 ? 'HUGE HIT!' : next.streak >= 3 ? 'Combo hit!' : 'Direct hit!') : damage ? (b.recovery === 'retry' ? 'Clean retry — full hit!' : 'Guided hit — half damage') : 'Right — but no damage on a retry', enemyDamage: 0 };
  } else {
    if (firstAttempt) {
      next.wrongCount += 1;
      next.streak = 0;
      next.retryQueue.push(b.question);
    }
    const raw = enemy.attack;
    const absorbed = Math.min(next.shield, raw);
    next.shield -= absorbed;
    playerDamage = raw - absorbed;
    next.log.push(log('miss', `Your attack misses. ${enemy.name} strikes for ${playerDamage} damage${absorbed ? ` (${absorbed} absorbed)` : ''}.`));
    if (firstAttempt && !enemy.isBoss) {
      // Not an automatic hint: the player decides how to come back from the miss.
      next.recovery = 'choose';
    } else if (firstAttempt) {
      next.hintShown = true;
      next.log.push(log('hint', `Hint: ${b.question.hint}`));
    } else {
      next.solutionShown = true;
      next.log.push(log('solution', `Solution: ${b.question.solutionSteps.join(' ')}`));
    }
    next.feedback = { correct: false, damage: 0, text: firstAttempt ? (enemy.isBoss ? 'Miss! Try again' : 'Miss! How do you want to come back?') : 'Miss! Here is how it works', enemyDamage: playerDamage };
  }

  const hpAfter = playerHp - playerDamage;
  const enemyDefeated = next.enemyHp <= 0;
  const playerDefeated = playerDamage > 0 && hpAfter <= 0;
  const bossFailed = !!enemy.bossRules && next.wrongCount > enemy.bossRules.maxMisses;

  if (enemyDefeated) {
    next.status = 'victory';
    next.log.push(log('victory', `${enemy.name} is defeated!`));
  } else if (bossFailed) {
    next.status = 'defeat';
    next.log.push(log('defeat', `${enemy.name}'s scales harden. Too many misses — return when your mastery is stronger.`));
  } else if (playerDefeated) {
    next.status = 'defeat';
    next.log.push(log('defeat', 'You retreat to the village to recover. Your missed facts have been added to review.'));
  }

  // Building an array shows the dots, so it trains the idea, not recall: it lands blows but does not move mastery.
  return { battle: next, correct, countsForMastery: firstAttempt && b.verb !== 'array', damage, playerDamage, timeMs, enemyDefeated, playerDefeated, bossFailed };
}

/** After a first miss, the player picks: a clean retry (full damage) or the array helper (half damage). */
export function recover(b: BattleState, choice: 'retry' | 'helper', now = Date.now()): BattleState {
  if (b.status !== 'active' || b.recovery !== 'choose' || !b.feedback || b.feedback.correct) return b;
  if (choice === 'retry') return { ...b, feedback: undefined, recovery: 'retry', questionStartedAt: now, log: [...b.log, log('info', 'You steady yourself for a clean retry — a right answer lands a full blow.')] };
  return {
    ...b, feedback: undefined, recovery: 'helper', hintShown: true, questionStartedAt: now,
    // The helper is the picture: show it with the question, and answer by typing.
    question: { ...b.question, visualFirst: true }, verb: 'type', choices: undefined,
    log: [...b.log, log('hint', `Helper: ${b.question.hint}`)],
  };
}

/** Ask an NPC for a tip on this question. Costs a hint charge; three teachers, three kinds of help. */
export function askTip(b: BattleState, npc: TipNpc): BattleState {
  if (b.status !== 'active' || b.feedback || b.hintCharges <= 0 || b.tip) return b;
  const text = tipFor(npc, b.question);
  return { ...b, tip: { npc, text }, hintShown: true, hintCharges: b.hintCharges - 1, hintsUsed: (b.hintsUsed ?? 0) + 1, log: [...b.log, log('hint', text)] };
}

/**
 * Power Strike: spend energy and the answer is shown and the blow lands. It earns no mastery and the
 * fact is queued to come back, so the learner still has to answer it themselves before the fight ends.
 */
export function powerStrike(b: BattleState, enemy: EnemyDef): BattleState {
  if (b.status !== 'active' || b.feedback || enemy.isBoss) return b;
  const damage = enemy.hitDamage;
  const next: BattleState = {
    ...b, enemyHp: Math.max(0, b.enemyHp - damage), retryQueue: [...b.retryQueue, b.question], attemptsOnCurrent: b.attemptsOnCurrent + 1,
    question: { ...b.question, visualFirst: true },
    feedback: { correct: true, damage, text: `Power Strike! ${b.question.expression.replace(' = ?', '')} = ${b.question.answer}. It will come back for you to answer.`, enemyDamage: 0 },
    log: [...b.log, log('hit', `Power Strike: ${b.question.expression.replace(' = ?', '')} = ${b.question.answer} hits ${enemy.name} for ${damage} damage. This fact returns later.`)],
  };
  if (next.enemyHp <= 0) { next.status = 'victory'; next.log.push(log('victory', `${enemy.name} is defeated!`)); }
  return next;
}

/** Advance to the next question after feedback. Wrong first-attempts are re-asked before the battle ends. */
export function advance(b: BattleState, enemy: EnemyDef, mastery: Record<string, MasteryRecord>, rng: Rng, cfg: CombatConfig, now = Date.now()): BattleState {
  if (b.status !== 'active') return b;
  const solvedOrGaveUp = b.feedback?.correct || b.solutionShown;
  if (!solvedOrGaveUp) {
    // Retry the same question. Skipping the recovery choice is a clean retry.
    return { ...b, feedback: undefined, questionStartedAt: now, recovery: b.recovery === 'choose' ? 'retry' : b.recovery };
  }
  const fresh = { attemptsOnCurrent: 0, hintShown: false, solutionShown: false, feedback: undefined, recovery: undefined, tip: undefined, special: undefined } as const;
  const typedOnly = !!enemy.isBoss || !!cfg.preview || !!cfg.factId;
  // Phase changes are announced in the log; the new phase decides the question pool and any special.
  const phase = phaseIndex(enemy, b.enemyHp, b.enemyMaxHp);
  const logs = [...b.log];
  if (enemy.phases?.length && phase !== (b.phase ?? 0)) { const p = enemy.phases[phase]; logs.push(log('info', `Phase ${phase + 1} — ${p.name}! ${p.text}`)); }
  const ph = enemy.phases?.[phase];
  const recent = [b.question.factId ?? ''].filter(Boolean);
  let question: Question;
  // Every 4th question, pull a missed one back from the retry queue (spaced re-ask within the battle).
  if (b.retryQueue.length && b.questionsAsked % 4 === 3) {
    const [retry, ...rest] = b.retryQueue;
    question = { ...retry, id: retry.id + '-r' };
    const nb: BattleState = { ...b, ...fresh, log: logs, phase: enemy.phases?.length ? phase : undefined, question, retryQueue: rest, questionStartedAt: now, questionsAsked: b.questionsAsked + 1 };
    return { ...nb, ...withVerb(nb, question, rng, typedOnly) };
  }
  question = nextQuestion(enemy, mastery, rng, recent, cfg.difficulty, cfg.factId, ph?.skills);
  let special: BattleState['special'];
  // Specials land on every other question of their phase, telegraphed one question ahead.
  if (ph?.special) {
    const due = (b.questionsAsked + 1) % 2 === 0;
    if (due) { const sp = applySpecial(question, ph.special); if (sp) { question = sp.q; special = { kind: ph.special, text: sp.text }; } }
    else logs.push(log('info', ph.special === 'mirror' ? `${enemy.name} ripples — Mirror Scales on the next fact.` : `${enemy.name} draws breath — Split Breath on the next fact.`));
  }
  const nb: BattleState = { ...b, ...fresh, log: logs, phase: enemy.phases?.length ? phase : undefined, special, question, questionStartedAt: now, questionsAsked: b.questionsAsked + 1 };
  return { ...nb, ...withVerb(nb, question, rng, typedOnly) };
}

export function useHint(b: BattleState): BattleState {
  if (b.hintShown || b.hintCharges <= 0) return b;
  return { ...b, hintShown: true, hintCharges: b.hintCharges - 1, hintsUsed: (b.hintsUsed ?? 0) + 1, log: [...b.log, log('hint', `Hint: ${b.question.hint}`)] };
}

export function flee(b: BattleState): BattleState {
  if (b.status !== 'active') return b;
  return { ...b, status: 'fled', log: [...b.log, log('info', 'You withdraw from the fight.')] };
}

export function battleAccuracy(b: BattleState): number {
  const total = b.correctCount + b.wrongCount;
  return total ? b.correctCount / total : 0;
}
