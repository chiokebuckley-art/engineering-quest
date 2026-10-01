import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';
import { checkAnswer } from '../questions';
import { SPACES, GROUPS, streetRent, railRent, utilRent, tollTax, DICE_WAYS, type Level, type GroupId } from '../tycoon/board';
import { streetQuestion } from '../tycoon/questions';
import { startTycoon, botStep, roll, answer, ack, passBuy, endTurn, netWorth, rentFor, startBuild, canBuild, jailChoice, current, deedsOf, type TycoonGame } from '../tycoon/game';

const LEVELS: Level[] = ['junior', 'explorer', 'tycoon'];
const bots = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `Bot${i}`, kind: 'bot' as const, bot: (['easy', 'normal', 'hard'] as const)[i % 3] }));

function playOut(g: TycoonGame, cap = 20000): TycoonGame {
  let s = g;
  for (let k = 0; k < cap && s.phase !== 'over'; k++) {
    const before = s.rev;
    s = botStep(s);
    if (s.rev === before && s.phase !== 'over') throw new Error(`stuck: phase ${s.phase}, pending ${s.pending?.kind}, review ${!!s.review}, player ${current(s).name}`);
  }
  return s;
}

describe('Engine City Tycoon board', () => {
  it('40 spaces: 22 streets in 8 colour groups, 4 rails, 2 utilities, rising prices', () => {
    expect(SPACES).toHaveLength(40);
    expect(SPACES.filter((s) => s.kind === 'prop')).toHaveLength(22);
    expect(SPACES.filter((s) => s.kind === 'rail')).toHaveLength(4);
    expect(SPACES.filter((s) => s.kind === 'util')).toHaveLength(2);
    const prices = SPACES.filter((s) => s.kind === 'prop').map((s) => s.price!);
    for (let i = 1; i < prices.length; i++) expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    expect(Object.values(DICE_WAYS).reduce((a, b) => a + b, 0)).toBe(36);
    expect(DICE_WAYS[7]).toBe(6);
  });
  it('rent rules match their worked sums', () => {
    expect(streetRent('explorer', 180, 0, false).amount).toBe(14);
    expect(streetRent('explorer', 180, 2, true)).toMatchObject({ amount: 126, expr: '14 (base rent) × (2 (workshops) + 1 (street))²' });
    expect(streetRent('explorer', 320, 2, true).amount).toBe(29 * 9);
    expect(streetRent('explorer', 180, 0, true).amount).toBe(28);
    expect(streetRent('junior', 180, 3, true)).toMatchObject({ amount: 18 + 30, expr: '18 (base rent) + 10 (gears per workshop) × 3 (workshops)' });
    expect([1, 2, 3, 4].map((n) => railRent(n).amount)).toEqual([25, 50, 100, 200]);
    expect(utilRent(9, false).amount).toBe(36);
    expect(utilRent(9, true).amount).toBe(90);
    expect(tollTax('explorer', 640).amount).toBe(60);
    expect(tollTax('explorer', 1449).amount).toBe(140);
    expect(tollTax('junior', 900).amount).toBe(50);
  });
});

describe('Engine City Tycoon questions', () => {
  it('every group at every level makes answerable questions whose stated answer checks as right', () => {
    const problems: string[] = [];
    for (const level of LEVELS) for (const g of Object.keys(GROUPS) as GroupId[]) for (const hard of [false, true]) for (let k = 0; k < 60; k++) {
      const q = streetQuestion(level, g, createRng(k * 31 + 7), hard, 'x');
      const where = `${level}/${g}/${hard ? 'hard' : 'easy'}#${k}: ${q.expression}`;
      if (!Number.isFinite(q.answer)) problems.push(`${where} answer not finite`);
      if (/undefined|NaN/.test(q.expression + q.prompt + q.solutionSteps.join(' '))) problems.push(`${where} undefined/NaN in text`);
      if (!checkAnswer(q, q.answerText ?? String(q.answer))) problems.push(`${where} own answer ${q.answerText ?? q.answer} fails`);
      if (q.answer < 0 && !q.allowNegative) problems.push(`${where} negative answer without a minus key`);
      if (!Number.isInteger(q.answer) && !q.allowDecimal && !q.allowFraction) problems.push(`${where} non-integer answer ${q.answer} without decimal/fraction keys`);
      if (!q.solutionSteps.length) problems.push(`${where} no worked steps`);
      if (level === 'junior' && (q.answer > 200 || q.answer < 0)) problems.push(`${where} too big for Junior`);
    }
    expect(problems.slice(0, 20)).toEqual([]);
  });
});

describe('Engine City Tycoon rules', () => {
  it('computer-only games finish at every level, with sane money and deeds', () => {
    for (const level of LEVELS) for (const seed of [1, 2, 3, 4, 5, 6]) for (const mode of ['quick', 'classic'] as const) {
      const g = playOut(startTycoon({ level, mode, players: bots(seed % 3 + 2), seed }));
      expect(g.phase).toBe('over');
      expect(g.winner).toBeTruthy();
      for (const p of g.players) {
        expect(Number.isFinite(p.gears)).toBe(true);
        if (!p.out) expect(p.gears).toBeGreaterThanOrEqual(0);
        expect(p.worth.every(Number.isFinite)).toBe(true);
      }
      for (const [k, d] of Object.entries(g.deeds)) {
        expect(g.players.find((p) => p.id === d.owner && !p.out), `deed ${k} owner`).toBeTruthy();
        expect(d.workshops).toBeGreaterThanOrEqual(0); expect(d.workshops).toBeLessThanOrEqual(4);
      }
      if (mode === 'quick') expect(g.round).toBeLessThanOrEqual(15);
      expect(JSON.stringify(g)).not.toMatch(/NaN|undefined/);
    }
  });

  it('buying: a right answer buys the street, a wrong one leaves it for sale', () => {
    let g = startTycoon({ level: 'explorer', mode: 'quick', players: [{ name: 'Ella', kind: 'human' }, { name: 'Bot', kind: 'bot', bot: 'normal' }], seed: 9 });
    g = roll(g, [1, 2]); // to Place-Value Row (3)
    expect(g.pending?.kind).toBe('buy');
    const q = (g.pending as { q: { answer: number; answerText?: string } }).q;
    const right = answer(g, q.answerText ?? String(q.answer));
    expect(right.deeds[3]?.owner).toBe('p1');
    expect(right.players[0].gears).toBe(1500 - 60);
    expect(right.review?.correct).toBe(true);
    const wrong = answer(g, String(q.answer + 1));
    expect(wrong.deeds[3]).toBeUndefined();
    expect(wrong.review?.correct).toBe(false);
    expect(passBuy(g).deeds[3]).toBeUndefined();
  });

  it('rent: the payer works it out; right earns a Sharp Mind token, wrong still pays the right amount', () => {
    let g = startTycoon({ level: 'explorer', mode: 'quick', players: [{ name: 'Ella', kind: 'human' }, { name: 'Owner', kind: 'human' }], seed: 3 });
    g = { ...g, deeds: { 16: { owner: 'p2', workshops: 0, mortgaged: false }, 18: { owner: 'p2', workshops: 2, mortgaged: false }, 19: { owner: 'p2', workshops: 0, mortgaged: false } } };
    g = roll(g, [6, 12]); // lands on 18
    expect(g.pending?.kind).toBe('pay');
    expect((g.pending as { amount: number }).amount).toBe(126);
    const ok = answer(g, '126');
    expect(ok.players[0].gears).toBe(1500 - 126);
    expect(ok.players[1].gears).toBe(1500 + 126);
    expect(ok.players[0].sharp).toBe(1);
    const bad = answer(g, '100');
    expect(bad.players[0].gears).toBe(1500 - 126);
    expect(bad.players[0].sharp).toBe(0);
    // a Sharp Mind token takes 10% off the next rent
    const withToken = { ...g, players: g.players.map((p, i) => (i === 0 ? { ...p, sharp: 1 } : p)) };
    const paid = answer(withToken, '126');
    expect(paid.players[0].gears).toBe(1500 - 113);
    expect(paid.players[0].sharp).toBe(1);
  });

  it('building needs the whole set and a right answer to the harder question', () => {
    let g = startTycoon({ level: 'explorer', mode: 'quick', players: [{ name: 'Ella', kind: 'human' }, { name: 'Bot', kind: 'bot' }], seed: 5 });
    g = { ...g, deeds: { 1: { owner: 'p1', workshops: 0, mortgaged: false } } };
    expect(canBuild(g, 1)).toMatch(/whole/);
    g = { ...g, deeds: { ...g.deeds, 3: { owner: 'p1', workshops: 0, mortgaged: false } } };
    expect(canBuild(g, 1)).toBeNull();
    const b = startBuild(g, 1);
    expect(b.pending?.kind).toBe('build');
    const q = (b.pending as { q: { answer: number; answerText?: string } }).q;
    const built = answer(b, q.answerText ?? String(q.answer));
    expect(built.deeds[1].workshops).toBe(1);
    expect(built.players[0].gears).toBe(1500 - 50);
    expect(built.phase).toBe('roll');
    expect(answer(b, String(q.answer + 7)).deeds[1].workshops).toBe(0);
  });

  it('the Error Book Cell: go-to space sends you there; fix, pay or roll to leave', () => {
    let g = startTycoon({ level: 'junior', mode: 'quick', players: [{ name: 'Ella', kind: 'human' }, { name: 'Bot', kind: 'bot' }], seed: 11 });
    g = { ...g, players: g.players.map((p, i) => (i === 0 ? { ...p, pos: 25 } : p)) };
    g = roll(g, [2, 3]); // 30: go to cell
    expect(g.players[0]).toMatchObject({ pos: 10, jail: 0 });
    g = endTurn(g); g = { ...g, turn: 0, phase: 'roll' };
    const fix = jailChoice(g, 'fix');
    expect(fix.pending?.kind).toBe('jailfix');
    const q = (fix.pending as { q: { answer: number; answerText?: string } }).q;
    const freed = answer(fix, q.answerText ?? String(q.answer));
    expect(freed.players[0].jail).toBe(-1);
    expect(freed.phase).toBe('roll');
    const paid = jailChoice(g, 'pay');
    expect(paid.players[0]).toMatchObject({ jail: -1, gears: 1000 - 50 });
    expect(paid.jar).toEqual([50]);
    const stay = roll(g, [1, 2]);
    expect(stay.players[0].jail).toBe(1);
  });

  it('three doubles in a row go to the cell; doubles otherwise roll again', () => {
    let g = startTycoon({ level: 'junior', mode: 'quick', players: [{ name: 'Ella', kind: 'human' }, { name: 'Bot', kind: 'bot' }], seed: 2 });
    const clear = (s: TycoonGame) => { let x = s; if (x.pending?.kind === 'buy') x = passBuy(x); else if (x.pending) { const pq = (x.pending as { q?: { answer: number; answerText?: string }; answer?: number }); x = answer(x, pq.q ? pq.q.answerText ?? String(pq.q.answer) : String(pq.answer)); } return x.review ? ack(x) : x; };
    g = clear(roll(g, [1, 1])); expect(g.phase).toBe('roll');
    g = clear(roll(g, [2, 2])); expect(g.phase).toBe('roll');
    g = roll(g, [3, 3]);
    expect(g.players[0]).toMatchObject({ pos: 10, jail: 0 });
    expect(g.phase).toBe('done');
  });

  it('net worth counts gears, deeds (half if mortgaged) and workshops', () => {
    let g = startTycoon({ level: 'explorer', mode: 'quick', players: [{ name: 'A', kind: 'human' }, { name: 'B', kind: 'human' }], seed: 1 });
    g = { ...g, deeds: { 1: { owner: 'p1', workshops: 2, mortgaged: false }, 5: { owner: 'p1', workshops: 0, mortgaged: true } } };
    expect(netWorth(g, 'p1')).toBe(1500 + 60 + 100 + 100);
    expect(deedsOf(g, 'p1')).toEqual([1, 5]);
    expect(rentFor(g, 5, 7)).toBeNull();
  });
});

import { hostLobby, guestLobby, setRoster, launchOnline, applyGuest, leaveOnline, viewFor, validView } from '../tycoon/online';

describe('Engine City Tycoon online', () => {
  const lobby = () => setRoster(hostLobby('explorer', 'quick', 'ABCD', { id: 'p-host', name: 'Ella' }), [{ id: 'p-host', name: 'Ella' }, { id: 'p-sam', name: 'Sam' }]);
  it('the host launches with everyone in the lobby plus computer players', () => {
    const g = launchOnline(lobby(), ['hard']);
    expect(g.phase).toBe('roll');
    expect(g.players.map((p) => [p.id, p.kind])).toEqual([['p-host', 'human'], ['p-sam', 'remote'], ['bot-1', 'bot']]);
    expect(g.online).toMatchObject({ code: 'ABCD', host: true, myId: 'p-host' });
    expect(launchOnline(setRoster(hostLobby('junior', 'quick', 'ABCD', { id: 'p-host', name: 'E' }), [{ id: 'p-host', name: 'E' }]), []).phase).toBe('lobby');
  });
  it('guests can act only on their own turn', () => {
    let g = launchOnline(lobby(), []);
    expect(applyGuest(g, 'p-sam', { kind: 'roll' })).toBe(g);
    g = { ...g, turn: 1 };
    const rolled = applyGuest(g, 'p-sam', { kind: 'roll' });
    expect(rolled.dice).not.toBeNull();
    expect(rolled.rev).toBeGreaterThan(g.rev);
  });
  it('a guest who leaves mid-game is replaced by a computer player', () => {
    const g = leaveOnline(launchOnline(lobby(), []), 'p-sam');
    expect(g.players[1]).toMatchObject({ kind: 'bot', bot: 'normal' });
    expect(leaveOnline(lobby(), 'p-sam').online?.lobby).toEqual([{ id: 'p-host', name: 'Ella' }]);
  });
  it('views are addressed to one guest and validated', () => {
    const g = launchOnline(lobby(), []);
    const v = viewFor(g, 'p-sam');
    expect(validView(JSON.parse(JSON.stringify(v)), 'ABCD', 'p-sam')).toBe(true);
    expect(validView(v, 'ABCD', 'p-other')).toBe(false);
    expect(validView({ ...v, players: [] }, 'ABCD', 'p-sam')).toBe(false);
    expect(guestLobby('ABCD', { id: 'p-sam', name: 'Sam' }).online).toMatchObject({ host: false, myId: 'p-sam' });
  });
});
