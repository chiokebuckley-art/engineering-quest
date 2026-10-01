import { describe, it, expect } from 'vitest';
import { applyDiceEvent, emptyDiceData, fractionFact, ratioFact, fractionRight, ratioRight, mathRight, mathLine, parseDiceData } from './diceWorkshop';

describe('Dice Workshop fractions and ratios', () => {
  it('fraction of the dice showing the most common value', () => {
    expect(fractionFact([4, 4, 2, 6, 1])).toMatchObject({ value: 4, count: 2, text: '2/5' });
    expect(fractionRight('2/5', 2)).toBe(true);
    expect(fractionRight('4/10', 2)).toBe(true);
    expect(fractionRight(' 2 / 5 ', 2)).toBe(true);
    expect(fractionRight('0.4', 2)).toBe(true);
    expect(fractionRight('2/6', 2)).toBe(false);
    expect(fractionRight('2', 2)).toBe(false);
    expect(fractionRight('2/0', 2)).toBe(false);
  });
  it('ratio of even dice to odd dice', () => {
    expect(ratioFact([4, 4, 2, 6, 1])).toMatchObject({ evens: 4, odds: 1, text: '4:1' });
    expect(ratioRight('4:1', 4, 1)).toBe(true);
    expect(ratioRight('8 : 2', 4, 1)).toBe(true);
    expect(ratioRight('1:4', 4, 1)).toBe(false);
    expect(ratioRight('5:0', 5, 0)).toBe(true);
    expect(ratioRight('0:0', 0, 5)).toBe(false);
    expect(ratioRight('4/1', 4, 1)).toBe(false);
  });
  it('checking a turn in each new mode', () => {
    for (const mode of ['fractions', 'ratios'] as const) {
      let d = applyDiceEvent(emptyDiceData(), { kind: 'start', mode, avatar: 'engineer' });
      d = applyDiceEvent(d, { kind: 'roll' }, () => 0.5);
      const r = d.run!;
      const right = mode === 'fractions' ? fractionFact(r.dice).text : ratioFact(r.dice).text;
      expect(mathRight(r, right, '').right).toBe(true);
      const wrong = applyDiceEvent(d, { kind: 'check', sum: mode === 'fractions' ? '1/7' : '9:9', group: '' });
      expect(wrong.run!.checked).toBe(false);
      expect(wrong.run!.message).toMatch(/Try again/);
      const ok = applyDiceEvent(d, { kind: 'check', sum: right, group: '' });
      expect(ok.run!.checked).toBe(true);
      expect(ok.correct).toBe(1);
      expect(mathLine(ok.run!)).toContain(right);
      expect(parseDiceData(JSON.parse(JSON.stringify(ok))).run?.mode).toBe(mode);
    }
  });
});
