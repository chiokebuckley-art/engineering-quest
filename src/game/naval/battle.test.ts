import { describe, expect, it } from 'vitest';
import { gameReducer } from '../../engine/state/reducer';
import { initialState } from '../../engine/state/initialState';
import { arcadeAnswer, startArcade } from '../../engine/state/arcade';
import { battleView, newSalvos } from './battle';
import type { VersusState } from '../../engine/state/types';

function fleet(scores = [0, 0], done = false): VersusState {
  const s = gameReducer(initialState(), { type: 'VERSUS_SETUP', kind: 'hotseat', game: 'mult', selection: 'mult:7', names: scores.map((_, i) => `Captain ${i}`), seed: 42 });
  return { ...s.versus!, status: 'playing', players: s.versus!.players.map((p, i) => ({ ...p, score: scores[i], correct: i + 1, done })) };
}
describe('naval battle outcomes', () => {
  it('launches more total shells for quick answers and no shells for a wrong answer', () => {
    const start = startArcade('mult', 'blitz', 'mult:7', {}, 1000);
    const fast = arcadeAnswer(start, true, 2000).state;
    const slow = arcadeAnswer(start, true, 5000).state;
    expect(fast.score).toBeGreaterThan(slow.score);
    expect(arcadeAnswer(start, false, 2000).state.score).toBe(0);
    expect(battleView(fleet([fast.score * 4, slow.score * 4])).ships.find(s => s.id === 'me')!.shells).toBeGreaterThan(battleView(fleet([fast.score * 4, slow.score * 4])).ships.find(s => s.id === 'local-1')!.shells);
  });
  it('assigns the same colours, targets and damage on clients with different roster order', () => {
    const a = fleet([110, 70, 30, 40, 20, 100]);
    const b = { ...a, players: [...a.players].reverse(), myId: 'local-3' };
    expect(battleView(a).ships).toEqual(battleView(b).ships);
    const view = battleView(a);
    expect(view.ships.reduce((n, s) => n + s.incoming, 0)).toBe(view.ships.reduce((n, s) => n + s.shells, 0));
    const events = newSalvos(battleView(fleet([0, 0, 0, 0, 0, 0])), view);
    expect(events.every(e => e.from !== e.to)).toBe(true);
  });
  it('keeps players afloat for the entire round, then sinks only the losing ships', () => {
    const live = battleView(fleet([1800, 190]));
    expect(live.ships.every(s => s.hull >= 10 && !s.sunk)).toBe(true);
    const final = battleView(fleet([1800, 190], true));
    expect(final.ships.find(s => s.id === 'me')!.winner).toBe(true);
    expect(final.ships.find(s => s.id === 'local-1')!.hull).toBe(0);
  });
  it('breaks score ties by correct answers, shares exact ties, and excludes unfinished departures', () => {
    const v = fleet([100, 100], true);
    expect(battleView(v).ships.filter(s => s.winner).map(s => s.id)).toEqual(['local-1']);
    v.players[0].correct = 2;
    expect(battleView(v).ships.every(s => s.winner && !s.sunk)).toBe(true);
    v.players[1].withdrawn = true;
    expect(battleView(v).ships.filter(s => s.winner).map(s => s.id)).toEqual(['me']);
  });
  it('does not replay duplicate packets, old counters, rematches, or fire received before mounting', () => {
    const before = battleView(fleet([10, 20])); const after = battleView(fleet([40, 40]));
    expect(newSalvos(before, after)).toHaveLength(5);
    expect(newSalvos(after, after)).toHaveLength(0);
    expect(newSalvos(after, before)).toHaveLength(0);
    expect(newSalvos(undefined, after)).toHaveLength(0);
    expect(newSalvos(before, { ...after, key: 'next-round' })).toHaveLength(0);
    expect(newSalvos(before, battleView(fleet([2000, 2000])))).toHaveLength(12);
  });
});
