import { describe, expect, it } from 'vitest';
import { ALL_ACADEMIES } from '../academy/registry';
import { answerOnly, showsWorking } from '../academy/teachCheck';
import { arithmeticSlips, cardSlips } from '../academy/teachMath';

/** Every academy's teach cards have been through the how-to pass, so every academy is held to it. */
const CHECKED = new Set(ALL_ACADEMIES.map((a) => a.id));
/** The trial chapter's cards are rules, not maths, so they are not checked. */
const offenders = (id: string) => ALL_ACADEMIES.find((a) => a.id === id)!.chapters.filter((c) => c.key !== 'trial').flatMap((c) => c.teach.filter(answerOnly).map((t) => `${c.key}: ${t.title}`));

describe('teach cards show the working, not just the answer', () => {
  it('spots a worked equation and an answer-only card', () => {
    expect(showsWorking({ text: '25% of 40: shade a quarter of 40 on the dial and read 10.' })).toBe(false);
    expect(showsWorking({ text: 'Tariff example.', steps: ['25 ÷ 100 = 0.25', '0.25 × 40 = 10 coins'] })).toBe(true);
    expect(showsWorking({ text: 'The answer = 10.' })).toBe(false);
  });
  for (const id of CHECKED) it(`${id}: every card with a picture or model shows the working`, () => expect(offenders(id)).toEqual([]));
  it('every checked chapter ends its teaching with something to try', () => {
    for (const a of ALL_ACADEMIES.filter((x) => CHECKED.has(x.id))) for (const c of a.chapters) if (c.key !== 'trial') expect(c.teach.some((t) => t.next), `${a.id}/${c.key}`).toBe(true);
  });
  it('the arithmetic worked on every teach card is right', () => {
    expect(arithmeticSlips('7 × 8 = 54')).toHaveLength(1);
    expect([...arithmeticSlips('0.25 × 40 = 10 coins'), ...arithmeticSlips('2/5 = (2 × 20)/(5 × 20) = 40/100'), ...arithmeticSlips('x + 3 = 8'), ...arithmeticSlips('f(2) = 7'), ...arithmeticSlips('(2³)² = 8 × 8 = 64 = 2⁶')]).toEqual([]);
    const slips = ALL_ACADEMIES.flatMap((a) => a.chapters.flatMap((c) => c.teach.flatMap((t) => cardSlips(t).map((s) => `${a.id}/${c.key} ${t.title}: ${s}`))));
    expect(slips).toEqual([]);
  });
});
