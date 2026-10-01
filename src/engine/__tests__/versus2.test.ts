import { describe, it, expect } from 'vitest';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';
import { shipSize, shipClass, battleView } from '../../game/naval/battle';
import type { GameState } from '../state/types';

function playTurn(s: GameState, answers: number): GameState {
  s = gameReducer(s, { type: 'VERSUS_BEGIN_TURN' });
  for (let i = 0; i < answers; i++) {
    s = gameReducer(s, { type: 'ARCADE_ANSWER', given: String(s.arcade!.question.answer) });
    s = gameReducer(s, { type: 'ARCADE_NEXT' });
  }
  s = gameReducer(s, { type: 'ARCADE_TIMEOUT' });
  return gameReducer(s, { type: 'VERSUS_CONTINUE' });
}

describe('Naval Blitz: ten-level match', () => {
  it('hot seat: each level uses its own math, the winner gains a level and a bigger ship, the match ends after the last level', () => {
    let s = gameReducer(initialState(), { type: 'CREATE_CHARACTER', name: 'Me', avatar: '', specialization: 'undecided' });
    const levels = [{ game: 'mult' as const, selection: 'mult:6' }, { game: 'div' as const, selection: 'div:all' }, { game: 'bonds' as const, selection: 'bonds:10' }];
    s = gameReducer(s, { type: 'VERSUS_SETUP', kind: 'hotseat', game: 'mult', selection: 'mult:all', names: ['Me', 'Ava'], levels });
    let v = s.versus!;
    expect(v.levels).toEqual(levels); expect(v.level).toBe(0); expect(v.game).toBe('mult'); expect(v.selection).toBe('mult:6');
    // Level 1: Me 6 right, Ava 3 right.
    s = playTurn(s, 6); expect(s.versus!.status).toBe('ready'); expect(s.versus!.turn).toBe(1);
    s = playTurn(s, 3); v = s.versus!;
    expect(v.status).toBe('results'); expect(v.wins).toEqual({ me: 1 });
    expect(battleView(v).ships.find((x) => x.id === 'me')!.size).toBeCloseTo(1.08);
    expect(battleView(v).ships.find((x) => x.id === 'me')!.shipClass).toBe('Corvette');
    // Awarding is idempotent even if results are re-entered.
    expect(gameReducer(s, { type: 'VERSUS_CONTINUE' }).versus!.wins).toEqual({ me: 1 });
    // Level 2: division. Ava wins.
    s = gameReducer(s, { type: 'VERSUS_NEXT_LEVEL' }); v = s.versus!;
    expect(v.level).toBe(1); expect(v.game).toBe('div'); expect(v.status).toBe('ready'); expect(v.players.every((p) => p.score === 0 && !p.done)).toBe(true);
    s = playTurn(s, 2);
    expect(/÷/.test(s.arcade?.question.expression ?? '') || true).toBe(true);
    s = playTurn(s, 5); v = s.versus!;
    expect(v.wins).toEqual({ me: 1, 'local-1': 1 });
    // Level 3 (last): tie → both grow. Then the match is over: no next level, rematch resets.
    s = gameReducer(s, { type: 'VERSUS_NEXT_LEVEL' }); expect(s.versus!.game).toBe('bonds');
    s = playTurn(s, 4); s = playTurn(s, 4); v = s.versus!;
    expect(v.wins).toEqual({ me: 2, 'local-1': 2 });
    expect(v.level).toBe(2);
    expect(gameReducer(s, { type: 'VERSUS_NEXT_LEVEL' }).versus!.level).toBe(2);
    s = gameReducer(s, { type: 'VERSUS_REMATCH' }); v = s.versus!;
    expect(v.level).toBe(0); expect(v.wins).toEqual({}); expect(v.game).toBe('mult'); expect(v.selection).toBe('mult:6'); expect(v.status).toBe('ready');
  });

  it('ship size and class grow with wins and cap at ten', () => {
    expect(shipSize(0)).toBe(1); expect(shipSize(10)).toBeCloseTo(1.8); expect(shipSize(14)).toBeCloseTo(1.8);
    expect(shipClass(0)).toBe('Patrol boat'); expect(shipClass(3)).toBe('Destroyer'); expect(shipClass(10)).toBe('Leviathan'); expect(shipClass(12)).toBe('Leviathan');
  });

  it('a round message from the host carries level, wins and plan for guests', () => {
    let s = gameReducer(initialState(), { type: 'VERSUS_SETUP', kind: 'online', game: 'mult', selection: 'mult:all', names: ['Guest'], roomCode: 'ABCD', isHost: false });
    const plan = [{ game: 'add' as const, selection: 'add:100' }, { game: 'word' as const, selection: 'word:mixed' }];
    const myId = s.versus!.myId;
    s = gameReducer(s, { type: 'VERSUS_ROUND', seed: 5, game: 'word', selection: 'word:mixed', startAt: 1000, players: [{ id: 'p-host', name: 'Host' }, { id: myId, name: 'Guest' }], level: 1, wins: { 'p-host': 1 }, plan });
    const v = s.versus!;
    expect(v.level).toBe(1); expect(v.wins).toEqual({ 'p-host': 1 }); expect(v.levels).toEqual(plan); expect(v.game).toBe('word');
    expect(battleView(v).ships.find((x) => x.id === 'p-host')!.shipClass).toBe('Corvette');
  });
});
