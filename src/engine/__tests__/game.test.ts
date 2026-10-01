import { describe, it, expect } from 'vitest';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';
import type { GameState } from '../state/types';
import { serialize, deserialize } from '../save/SaveSystem';
import { levelFromXp, xpForLevel } from '../progression/xp';
import { enemyById } from '../combat/enemies';
import { startBattle, submitAnswer, advance } from '../combat/CombatEngine';
import { createRng } from '../rng';
import { skillMastery } from '../mastery/MasteryEngine';

function newGame(): GameState {
  let s = gameReducer(initialState(), { type: 'NEW_GAME' });
  s = gameReducer(s, { type: 'SEEN_INTRO' });
  return gameReducer(s, { type: 'CREATE_CHARACTER', name: 'Test', avatar: '/assets/characters/avatar-01.svg', specialization: 'undecided' });
}

const cfg = { damageBonusPercent: 0, hintCharges: 1, shield: 0, difficulty: 2 as const };

describe('XP and levels', () => {
  it('levels scale and are computed from total xp', () => {
    expect(xpForLevel(1)).toBe(100);
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(100 + xpForLevel(2)).level).toBe(3);
  });
});

describe('Game flow', () => {
  it('creates a character and starts in the village with the first quest available', () => {
    const s = newGame();
    expect(s.character?.name).toBe('Test');
    expect(s.screen).toBe('region');
    expect(s.quests['q.awakening'].status).toBe('active'); // story quests auto-accept
    expect(s.quests['q.first-principles'].status).toBe('locked');
    expect(s.dialogue?.npcId).toBe('vector'); // Vector greets the new apprentice
  });

  it('completes the talk quest through dialogue and unlocks the next one', () => {
    let s = newGame();
    while (s.dialogue) s = gameReducer(s, { type: 'DIALOGUE_NEXT' });
    expect(s.quests['q.awakening'].status).toBe('completed');
    expect(s.quests['q.first-principles'].status).toBe('active');
    expect(s.character!.xp).toBeGreaterThanOrEqual(40);
    expect(s.inventory.items['repair-kit']).toBe(3);
  });

  it('lesson flow records answers, awards XP and unlocks the mines', () => {
    let s = newGame();
    s = gameReducer(s, { type: 'DIALOGUE_CLOSE' });
    s = gameReducer(s, { type: 'START_LESSON', lessonId: 'l.mult-intro' });
    expect(s.screen).toBe('lesson');
    let guard = 0;
    while (s.lesson && guard++ < 100) {
      if (s.lesson.question && !s.lesson.feedback) s = gameReducer(s, { type: 'LESSON_ANSWER', given: String(s.lesson.question.answer) });
      else s = gameReducer(s, { type: 'LESSON_NEXT' });
    }
    expect(s.lesson).toBeNull();
    expect(s.stats.lessonsCompleted).toContain('l.mult-intro');
    expect(s.stats.totalAnswered).toBe(4);
    expect(s.stats.totalCorrect).toBe(4);
    expect(s.quests['q.first-principles'].status).toBe('completed');
    expect(s.world.unlockedRegions).toContain('mines');
    expect(skillMastery('mult.2', s.mastery)).toBeGreaterThan(0);
  });

  it('battle: correct answers damage the enemy, wrong answers hurt the player and re-ask; victory grants XP and drops', () => {
    let s = newGame();
    s = gameReducer(s, { type: 'START_BATTLE', enemyId: 'ore-slime', regionId: 'mines', depth: 1 });
    expect(s.battle?.status).toBe('active');
    const hpBefore = s.character!.hp;
    s = gameReducer(s, { type: 'BATTLE_ANSWER', given: String(s.battle!.question.answer + 1) });
    expect(s.battle!.wrongCount).toBe(1);
    expect(s.battle!.recovery).toBe('choose'); // a miss asks how to come back instead of forcing a hint
    expect(s.character!.hp).toBeLessThan(hpBefore);
    s = gameReducer(s, { type: 'BATTLE_NEXT' });
    expect(s.battle!.attemptsOnCurrent).toBe(1); // same question retried
    expect(s.battle!.recovery).toBe('retry'); // skipping the choice is a clean retry
    s = gameReducer(s, { type: 'BATTLE_ANSWER', given: String(s.battle!.question.answer) });
    expect(s.battle!.enemyHp).toBe(40); // a clean retry lands a full blow (no streak, no mastery credit)
    let guard = 0;
    while (s.battle && s.battle.status === 'active' && guard++ < 30) {
      s = gameReducer(s, { type: 'BATTLE_NEXT' });
      s = gameReducer(s, { type: 'BATTLE_ANSWER', given: String(s.battle!.question.answer) });
    }
    expect(s.battle!.status).toBe('victory');
    expect(s.stats.enemiesDefeated).toBe(1);
    expect(s.character!.xp).toBeGreaterThan(0);
    expect(s.world.depthWins['mines:1']).toBe(1);
    s = gameReducer(s, { type: 'BATTLE_CLOSE' });
    expect(s.screen).toBe('region');
    expect(s.battle).toBeNull();
  });

  it('boss battle fails after too many misses and succeeds at 50 correct-ish answers', () => {
    const dragon = enemyById('multiplication-dragon')!;
    let b = startBattle(dragon, 'forge', {}, 100, createRng(1), cfg);
    for (let i = 0; i < 6; i++) {
      b = submitAnswer(b, dragon, '-1', {}, cfg, 100).battle;
      if (b.status === 'active') b = advance({ ...b, solutionShown: true }, dragon, {}, createRng(i), cfg);
    }
    expect(b.status).toBe('defeat');
    let w = startBattle(dragon, 'forge', {}, 100, createRng(2), cfg);
    let n = 0;
    while (w.status === 'active' && n++ < 80) {
      w = submitAnswer(w, dragon, String(w.question.answer), {}, cfg, 100).battle;
      if (w.status === 'active') w = advance(w, dragon, {}, createRng(n), cfg);
    }
    expect(w.status).toBe('victory');
    expect(w.correctCount).toBeLessThanOrEqual(45);
  });

  it('drill completes the foreman quest at 90% accuracy', () => {
    let s = newGame();
    s = { ...s, quests: { ...s.quests, 'q.foreman-drill': { status: 'active', progress: {} } } };
    s = gameReducer(s, { type: 'START_DRILL', skillIds: ['mult'], count: 30 });
    let guard = 0;
    while (s.session && s.session.status === 'active' && guard++ < 200) {
      const wrong = s.session.results.length === 3 && s.session.attempts === 0;
      s = gameReducer(s, { type: 'SESSION_ANSWER', given: wrong ? '-5' : String(s.session.question.answer) });
      if (s.session!.feedback && !s.session!.feedback.correct) { s = gameReducer(s, { type: 'SESSION_NEXT' }); s = gameReducer(s, { type: 'SESSION_ANSWER', given: String(s.session!.question.answer) }); }
      s = gameReducer(s, { type: 'SESSION_NEXT' });
    }
    expect(s.session?.status).toBe('finished');
    expect(s.session?.results.length).toBe(30);
    expect(s.quests['q.foreman-drill'].status).toBe('completed');
  });

  it('mission stages build up and complete the bridge quest', () => {
    let s = newGame();
    s = { ...s, quests: { ...s.quests, 'q.bridge': { status: 'active', progress: {} } } };
    s = gameReducer(s, { type: 'START_MISSION', missionId: 'm.bridge' });
    let guard = 0;
    while (s.session && s.session.status === 'active' && guard++ < 50) {
      s = gameReducer(s, { type: 'SESSION_ANSWER', given: String(s.session.question.answer) });
      s = gameReducer(s, { type: 'SESSION_NEXT' });
    }
    expect(s.session?.status).toBe('finished');
    expect(s.stats.missionsCompleted).toContain('m.bridge');
    expect(s.quests['q.bridge'].status).toBe('completed');
    expect(s.achievements['bridge']).toBeTruthy();
  });

  it('inventory: use, equip and unequip', () => {
    let s = newGame();
    s = { ...s, character: { ...s.character!, hp: 10 }, inventory: { items: { 'repair-kit': 1, 'brass-calipers': 1 }, equipped: {} } };
    s = gameReducer(s, { type: 'USE_ITEM', itemId: 'repair-kit' });
    expect(s.character!.hp).toBe(50);
    expect(s.inventory.items['repair-kit']).toBeUndefined();
    s = gameReducer(s, { type: 'EQUIP', itemId: 'brass-calipers' });
    expect(s.inventory.equipped.tool).toBe('brass-calipers');
    s = gameReducer(s, { type: 'UNEQUIP', slot: 'tool' });
    expect(s.inventory.equipped.tool).toBeUndefined();
  });

  it('save/load round-trips state and never resumes into a transient screen', () => {
    let s = newGame();
    // Gallery 3 opens with a typed question (Gallery 1 opens by building an array, which does not count as recall).
    s = gameReducer(s, { type: 'START_BATTLE', enemyId: 'rust-bat', regionId: 'mines', depth: 3 });
    expect(s.battle!.verb).toBe('type');
    s = gameReducer(s, { type: 'BATTLE_ANSWER', given: String(s.battle!.question.answer) });
    const raw = serialize(s);
    const back = deserialize<GameState>(raw)!;
    expect(back.character?.name).toBe('Test');
    expect(back.stats.totalAnswered).toBe(1);
    const loaded = gameReducer(initialState(), { type: 'LOAD', state: back });
    expect(loaded.screen).toBe('region');
    expect(loaded.battle).toBeNull();
    expect(Object.keys(loaded.mastery).length).toBe(1);
  });

  it('travel is refused to regions whose requirements are not met', () => {
    let s = newGame();
    s = gameReducer(s, { type: 'TRAVEL', regionId: 'forge' });
    expect(s.world.currentRegion).toBe('village');
    s = gameReducer(s, { type: 'TRAVEL', regionId: 'village' });
    expect(s.world.currentRegion).toBe('village');
  });
});

describe('Review dungeon', () => {
  it('builds specters from weak facts and clears them one battle at a time', () => {
    let s = newGame();
    // Make 6×7 and 7×8 weak.
    s = { ...s, quests: { ...s.quests, 'q.forgotten': { status: 'active', progress: {} } }, character: { ...s.character!, hp: 1000, maxHp: 1000 } };
    for (const enemy of ['stone-golem', 'fire-beast']) {
      s = gameReducer(s, { type: 'START_BATTLE', enemyId: enemy, regionId: 'mines', depth: 4 });
      for (let i = 0; i < 6 && s.battle?.status === 'active'; i++) {
        s = gameReducer(s, { type: 'BATTLE_ANSWER', given: '-1' });
        s = gameReducer(s, { type: 'BATTLE_NEXT' });
        s = gameReducer(s, { type: 'BATTLE_ANSWER', given: String(s.battle!.question.answer) });
        s = gameReducer(s, { type: 'BATTLE_NEXT' });
      }
      s = gameReducer(s, { type: 'BATTLE_FLEE' });
      s = gameReducer(s, { type: 'BATTLE_CLOSE' });
    }
    s = gameReducer(s, { type: 'START_DUNGEON' });
    expect(s.dungeon).not.toBeNull();
    expect(s.dungeon!.facts.length).toBeGreaterThan(0);
    const n = s.dungeon!.facts.length;
    for (let k = 0; k < n; k++) {
      const fact = s.dungeon!.facts[k];
      s = gameReducer(s, { type: 'START_BATTLE', enemyId: 'forgotten-specter', regionId: 'forgotten', factId: fact });
      expect(s.battle!.question.factId).toBe(fact);
      let guard = 0;
      while (s.battle && s.battle.status === 'active' && guard++ < 20) {
        s = gameReducer(s, { type: 'BATTLE_ANSWER', given: String(s.battle!.question.answer) });
        if (s.battle!.status === 'active') s = gameReducer(s, { type: 'BATTLE_NEXT' });
      }
      expect(s.battle!.status).toBe('victory');
      s = gameReducer(s, { type: 'BATTLE_CLOSE' });
      expect(s.screen).toBe('dungeon');
    }
    expect(s.dungeon!.status).toBe('cleared');
    expect(s.stats.dungeonClears).toBe(1);
    expect(s.achievements['review-dungeon']).toBeTruthy();
  });
});
