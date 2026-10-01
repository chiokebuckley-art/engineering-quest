import { describe, it, expect } from 'vitest';
import { startRocket, moveRocket, boost, rocketNext, distractors, ROCKET_MISSIONS, missionUnlocked, LIVES } from '../state/rocket';
import { createRng } from '../rng';
import { generateQuestion } from '../questions';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';

describe('Rocket game', () => {
  it('always offers three distinct non-negative options including the answer', () => {
    const rng = createRng(3);
    for (let i = 0; i < 200; i++) {
      const q = generateQuestion(i % 2 ? 'mult.7' : 'bonds.10', {}, { rng, difficulty: 2 });
      const d = distractors(q, rng);
      expect(d.length).toBe(2);
      expect(new Set([q.answer, ...d]).size).toBe(3);
      expect(d.every((x) => x >= 0 && Number.isInteger(x))).toBe(true);
    }
  });

  it('moves between lanes, boosts, loses lives on misses and timeouts, and wins at the target', () => {
    let r = startRocket('r1', {}, 0, createRng(1));
    expect(r.lane).toBe(1);
    r = moveRocket(r, -1); expect(r.lane).toBe(0);
    r = moveRocket(r, -1); expect(r.lane).toBe(0);
    r = moveRocket(r, 1); r = moveRocket(r, 1); expect(r.lane).toBe(2);
    // Timeout = bomb.
    let out = boost(r, 8000, true);
    expect(out.correct).toBe(false);
    expect(out.state.lives).toBe(LIVES - 1);
    expect(out.state.status).toBe('hit');
    r = rocketNext(out.state, {}, 8500, createRng(2));
    expect(r.status).toBe('active'); expect(r.index).toBe(1);
    // Answer correctly for the rest.
    let t = 9000;
    while (r.status === 'active') {
      const lane = r.options.indexOf(r.question.answer) as 0 | 1 | 2;
      while (r.lane !== lane) r = moveRocket(r, r.lane < lane ? 1 : -1);
      out = boost(r, t + 1500); t += 2000;
      expect(out.correct).toBe(true);
      expect(out.points).toBeGreaterThan(10);
      r = rocketNext(out.state, {}, t, createRng(t));
    }
    expect(r.status).toBe('won');
    expect(r.altitude).toBe(9);
    expect(r.lives).toBe(LIVES - 1);
  });

  it('three bombs end the mission', () => {
    let r = startRocket('r2', {}, 0, createRng(5));
    for (let i = 0; i < 3; i++) {
      const wrong = r.options.findIndex((o) => o !== r.question.answer) as 0 | 1 | 2;
      while (r.lane !== wrong) r = moveRocket(r, r.lane < wrong ? 1 : -1);
      const out = boost(r, 1000 * (i + 1));
      expect(out.correct).toBe(false);
      r = rocketNext(out.state, {}, 1000 * (i + 1) + 500, createRng(i));
    }
    expect(r.status).toBe('lost');
  });

  it('banks points, unlocks missions and trains mastery through the reducer', () => {
    let s = gameReducer(initialState(), { type: 'NEW_GAME' });
    s = gameReducer(s, { type: 'SEEN_INTRO' });
    s = gameReducer(s, { type: 'CREATE_CHARACTER', name: 'T', avatar: '', specialization: 'undecided' });
    s = gameReducer(s, { type: 'DIALOGUE_CLOSE' });
    expect(missionUnlocked(ROCKET_MISSIONS[1], s.stats.rocket)).toBe(false);
    s = gameReducer(s, { type: 'ROCKET_START', missionId: 'r1' });
    let guard = 0;
    while (s.rocket && s.rocket.status !== 'won' && s.rocket.status !== 'lost' && guard++ < 40) {
      const lane = s.rocket.options.indexOf(s.rocket.question.answer) as 0 | 1 | 2;
      s = gameReducer(s, { type: 'ROCKET_LANE', lane });
      s = gameReducer(s, { type: 'ROCKET_BOOST' });
      s = gameReducer(s, { type: 'ROCKET_NEXT' });
    }
    expect(s.rocket?.status).toBe('won');
    expect(s.stats.rocket.points).toBeGreaterThan(200);
    expect(s.stats.rocket.missions['r1'].completed).toBe(true);
    expect(s.stats.rocket.missions['r1'].stars).toBe(3);
    expect(s.achievements['rocket-liftoff']).toBeTruthy();
    expect(s.achievements['rocket-perfect']).toBeTruthy();
    expect(s.stats.totalAnswered).toBe(10);
    expect(missionUnlocked(ROCKET_MISSIONS[1], s.stats.rocket)).toBe(s.stats.rocket.points >= 250);
  });
});
