import { describe, it, expect } from 'vitest';
import { normalizeRoomCode, inviteUrl } from '../../game/net/room';
import { drawSeeded, parseSelection } from '../state/arcade';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';

describe('Versus', () => {
  it('seeded draws are identical for every player and differ between seeds', () => {
    const sel = parseSelection('mult', 'mult:7');
    const a = Array.from({ length: 30 }, (_, i) => drawSeeded(sel, 12345, i).expression);
    const b = Array.from({ length: 30 }, (_, i) => drawSeeded(sel, 12345, i).expression);
    const c = Array.from({ length: 30 }, (_, i) => drawSeeded(sel, 999, i).expression);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(a.every((e) => /(^7 × \d+|× 7 )/.test(e))).toBe(true);
    const bonds = parseSelection('bonds', 'bonds:100');
    const q = drawSeeded(bonds, 5, 3);
    expect(q.answer + Number(/(\d+)/.exec(q.expression)![1]) === 100 || q.expression.startsWith('100 −')).toBe(true);
  });

  it('hot-seat: players take turns on the same seed, only the owner trains mastery, podium at the end', () => {
    let s = gameReducer(initialState(), { type: 'NEW_GAME' });
    s = gameReducer(s, { type: 'SEEN_INTRO' });
    s = gameReducer(s, { type: 'CREATE_CHARACTER', name: 'Me', avatar: '', specialization: 'undecided' });
    s = gameReducer(s, { type: 'DIALOGUE_CLOSE' });
    s = gameReducer(s, { type: 'VERSUS_SETUP', kind: 'hotseat', game: 'mult', selection: 'mult:6', names: ['Me', 'Ava', 'Sam'] });
    expect(s.versus?.status).toBe('ready');
    expect(s.versus?.players.length).toBe(3);
    const seed = s.versus!.seed;
    const firstQuestions: string[] = [];
    for (let turn = 0; turn < 3; turn++) {
      s = gameReducer(s, { type: 'VERSUS_BEGIN_TURN' });
      expect(s.screen).toBe('arcade');
      expect(s.arcade?.seed).toBe(seed);
      firstQuestions.push(s.arcade!.question.expression);
      const answers = turn === 1 ? 3 : 6; // Ava scores less
      for (let i = 0; i < answers; i++) {
        s = gameReducer(s, { type: 'ARCADE_ANSWER', given: String(s.arcade!.question.answer) });
        s = gameReducer(s, { type: 'ARCADE_NEXT' });
      }
      s = gameReducer(s, { type: 'ARCADE_TIMEOUT' });
      expect(s.arcade?.status).toBe('finished');
      expect(s.versus!.players[turn].correct).toBe(answers);
      expect(s.versus!.players[turn].done).toBe(true);
      s = gameReducer(s, { type: 'VERSUS_CONTINUE' });
    }
    expect(new Set(firstQuestions).size).toBe(1); // same first question for everyone
    expect(s.versus?.status).toBe('results');
    const ranked = [...s.versus!.players].sort((a, b) => b.score - a.score);
    expect(ranked[2].name).toBe('Ava');
    // Only "Me" trained mastery: 6 answers recorded, not 15.
    expect(s.stats.totalAnswered).toBe(6);
    s = gameReducer(s, { type: 'VERSUS_REMATCH' });
    expect(s.versus?.round).toBe(2);
    expect(s.versus?.players.every((p) => p.score === 0)).toBe(true);
  });

  it('online: remote progress updates the roster and results appear when all are done', () => {
    let s = gameReducer(initialState(), { type: 'NEW_GAME' });
    s = gameReducer(s, { type: 'SEEN_INTRO' });
    s = gameReducer(s, { type: 'CREATE_CHARACTER', name: 'Host', avatar: '', specialization: 'undecided' });
    s = gameReducer(s, { type: 'DIALOGUE_CLOSE' });
    s = gameReducer(s, { type: 'VERSUS_SETUP', kind: 'online', game: 'bonds', selection: 'bonds:10', names: ['Host'], roomCode: 'ABCD', isHost: true });
    s = gameReducer(s, { type: 'VERSUS_REMOTE', playerId: 'p-guest', name: 'Guest', score: 0, correct: 0, done: false });
    expect(s.versus?.players.length).toBe(2);
    s = gameReducer(s, { type: 'VERSUS_ROUND', seed: 42, game: 'bonds', selection: 'bonds:10', startAt: Date.now() });
    s = gameReducer(s, { type: 'VERSUS_BEGIN_TURN' });
    s = gameReducer(s, { type: 'ARCADE_ANSWER', given: String(s.arcade!.question.answer) });
    s = gameReducer(s, { type: 'VERSUS_REMOTE', playerId: 'p-guest', score: 40, correct: 3, done: true });
    s = gameReducer(s, { type: 'ARCADE_TIMEOUT' });
    s = gameReducer(s, { type: 'VERSUS_CONTINUE' });
    expect(s.versus?.status).toBe('results');
    expect(s.versus?.players.find((p) => p.id === 'p-guest')?.score).toBe(40);
  });
});

describe('Room codes from phone keyboards', () => {
  it('normalizes case, spaces, autocorrect junk and look-alike letters', () => {
    expect(normalizeRoomCode('kq zp')).toBe('KQZP');
    expect(normalizeRoomCode('Kqzp.')).toBe('KQZP');
    expect(normalizeRoomCode('ab7o')).toBe('AB7O');
    expect(normalizeRoomCode('abcdef')).toBe('ABCD');
    expect(normalizeRoomCode('')).toBe('');
    expect(inviteUrl('KQZP', 'https://x.test/engineering-quest/')).toBe('https://x.test/engineering-quest/?room=KQZP');
  });
});
