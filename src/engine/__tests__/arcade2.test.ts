import { describe, it, expect } from 'vitest';
import { parseSelection, drawSeeded, startArcade, arcadeAnswer, arcadeNext, blitzStars, bestKey, CONQUER_POOL } from '../state/arcade';
import { createRng } from '../rng';
import { checkAnswer } from '../questions';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';

describe('Arcade: all math types', () => {
  it('parses every game selection', () => {
    expect(parseSelection('div', 'div:6,7').facts.length).toBe(24);
    expect(parseSelection('div', 'div:all').skillIds).toEqual(['div']);
    expect(parseSelection('add', 'add:100').difficulty).toBe(4);
    expect(parseSelection('sub', 'sub:20').skillIds).toEqual(['sub.basic']);
    expect(parseSelection('alg', 'alg:onestep').skillIds).toEqual(['prealg.equations']);
    expect(parseSelection('mixed', 'mixed:all').facts.length).toBe(0);
  });

  it('seeded draws are deterministic and correct for every game', () => {
    for (const [game, key] of [['div', 'div:8'], ['add', 'add:100'], ['sub', 'sub:20'], ['alg', 'alg:all'], ['mixed', 'mixed:all'], ['bonds', 'bonds:50']] as const) {
      const sel = parseSelection(game, key);
      const a = Array.from({ length: 20 }, (_, i) => drawSeeded(sel, 77, i));
      const b = Array.from({ length: 20 }, (_, i) => drawSeeded(sel, 77, i));
      expect(a.map((q) => q.expression)).toEqual(b.map((q) => q.expression));
      for (const q of a) expect(checkAnswer(q, String(q.answer)), `${game} ${q.expression}`).toBe(true);
      if (game === 'div') expect(a.every((q) => /÷ 8 = \?$/.test(q.expression))).toBe(true);
    }
  });

  it('conquer works for open-ended games with a fixed seeded pool', () => {
    let a = startArcade('alg', 'conquer', 'alg:onestep', {}, 0, createRng(4));
    expect(a.remaining.length).toBe(CONQUER_POOL);
    const first = a.question.expression;
    let t = 1000; let guard = 0;
    while (a.status === 'active' && guard++ < 40) {
      const out = arcadeAnswer(a, true, t); t += 1500;
      a = arcadeNext(out.state, {}, t, createRng(guard));
    }
    expect(a.status).toBe('finished');
    expect(a.conquered.length).toBe(CONQUER_POOL);
    // Same seed reproduces the same pool.
    const b = startArcade('alg', 'conquer', 'alg:onestep', {}, 0, createRng(4));
    expect(b.question.expression).toBe(first);
  });

  it('blitz durations are selectable and bests are kept per length', () => {
    let s = gameReducer(initialState(), { type: 'NEW_GAME' });
    s = gameReducer(s, { type: 'SEEN_INTRO' });
    s = gameReducer(s, { type: 'CREATE_CHARACTER', name: 'T', avatar: '', specialization: 'undecided' });
    s = gameReducer(s, { type: 'DIALOGUE_CLOSE' });
    s = gameReducer(s, { type: 'ARCADE_START', game: 'div', mode: 'blitz', selection: 'div:all', durationMs: 30_000 });
    expect(s.arcade!.deadlineAt! - s.arcade!.startedAt).toBe(30_000);
    for (let i = 0; i < 5; i++) { s = gameReducer(s, { type: 'ARCADE_ANSWER', given: String(s.arcade!.question.answer) }); s = gameReducer(s, { type: 'ARCADE_NEXT' }); }
    s = gameReducer(s, { type: 'ARCADE_TIMEOUT' });
    expect(s.stats.arcade.bests[bestKey('div:all', 30_000)].correct).toBe(5);
    expect(s.stats.arcade.bests[bestKey('div:all', 60_000)]).toBeUndefined();
    expect(blitzStars(8, 30_000)).toBe(1);
    expect(blitzStars(70, 120_000)).toBe(3);
    expect(Object.keys(s.mastery).some((k) => k.startsWith('fact:div:'))).toBe(true);
  });
});
