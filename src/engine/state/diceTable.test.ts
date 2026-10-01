import { describe, it, expect } from 'vitest';
import { hostTable, joinTable, setTableRoster, launchTable, actAtTable, leaveTable, currentPlayer, winners, tableViewFor, validTable, type DiceTable } from './diceTable';
import { total, groupFact, allowedCategories, CATEGORIES } from './diceWorkshop';

const seats = [{ id: 'p-a', name: 'Ella', avatar: 'engineer' as const }, { id: 'p-b', name: 'Sam', avatar: 'engineer' as const }];
const start = (mode: 'sum' | 'groups' | 'both' = 'both') => launchTable(setTableRoster(hostTable(mode, 'ABCD', seats[0]), seats));
let seed = 1; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function playTurn(t: DiceTable): DiceTable {
  const p = currentPlayer(t)!;
  let x = actAtTable(t, p.id, { kind: 'roll' }, rnd);
  const r = currentPlayer(x)!.run;
  x = actAtTable(x, p.id, { kind: 'check', sum: String(total(r.dice)), group: String(groupFact(r.dice).answer) });
  const cat = allowedCategories(currentPlayer(x)!.run)[0];
  return actAtTable(x, p.id, { kind: 'score', category: cat });
}

describe('Dice Workshop online table', () => {
  it('needs two players to launch, and gives each a fresh scorecard', () => {
    expect(launchTable(hostTable('both', 'ABCD', seats[0])).phase).toBe('lobby');
    const t = start();
    expect(t.phase).toBe('playing');
    expect(t.players.map((p) => p.name)).toEqual(['Ella', 'Sam']);
    expect(t.players.every((p) => Object.keys(p.run.card).length === 0)).toBe(true);
  });
  it('only the player whose turn it is can move, and scoring passes the turn', () => {
    let t = start();
    expect(actAtTable(t, 'p-b', { kind: 'roll' })).toBe(t);
    t = playTurn(t);
    expect(currentPlayer(t)!.id).toBe('p-b');
    expect(Object.keys(t.players[0].run.card)).toHaveLength(1);
    expect(t.players[0].correct).toBe(1);
  });
  it('a wrong check is recorded and the turn waits until the maths is right', () => {
    let t = actAtTable(start('sum'), 'p-a', { kind: 'roll' }, rnd);
    t = actAtTable(t, 'p-a', { kind: 'check', sum: '999', group: '' });
    expect(t.players[0].run.checked).toBe(false);
    expect(t.players[0].attempts).toBe(1);
    expect(actAtTable(t, 'p-a', { kind: 'score', category: 'chance' })).toBe(t);
  });
  it('plays 13 rounds each and ends with winners', () => {
    let t = start();
    for (let k = 0; k < 26; k++) t = playTurn(t);
    expect(t.phase).toBe('over');
    expect(t.players.every((p) => Object.keys(p.run.card).length === CATEGORIES.length)).toBe(true);
    expect(winners(t).length).toBeGreaterThanOrEqual(1);
  });
  it('a player who leaves is skipped; the game ends when the rest finish', () => {
    let t = leaveTable(start(), 'p-a');
    expect(currentPlayer(t)!.id).toBe('p-b');
    for (let k = 0; k < 13; k++) t = playTurn(t);
    expect(t.phase).toBe('over');
    expect(leaveTable(setTableRoster(hostTable('both', 'ABCD', seats[0]), seats), 'p-b').online.lobby).toHaveLength(1);
  });
  it('views are addressed to one guest and validated', () => {
    const v = tableViewFor(start(), 'p-b');
    expect(validTable(JSON.parse(JSON.stringify(v)), 'ABCD', 'p-b')).toBe(true);
    expect(validTable(v, 'ABCD', 'p-x')).toBe(false);
    expect(validTable({ ...v, players: [{ ...v.players[0], run: { ...v.players[0].run, dice: [7, 1, 1, 1, 1] } }] }, 'ABCD', 'p-b')).toBe(false);
    expect(joinTable('ABCD', seats[1]).online).toMatchObject({ host: false, myId: 'p-b' });
  });
});
