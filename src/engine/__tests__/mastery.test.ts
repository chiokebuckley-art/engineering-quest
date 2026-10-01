import { describe, it, expect } from 'vitest';
import { applyAnswer, computeMastery, newRecord, skillMastery, bandFor, weakItems, effectiveMastery } from '../mastery/MasteryEngine';
import { selectionWeight, pickFact, scheduleAfterAnswer, initialSrs, INTERVALS_MS } from '../srs/SpacedRepetitionEngine';
import { createRng } from '../rng';
import { generateQuestion } from '../questions';
import { tableFacts } from '../curriculum/facts';
import type { MasteryRecord } from '../types';

const T = 4000;
function drill(rec: MasteryRecord | undefined, id: string, results: boolean[], timeMs = 3000, start = 1_000_000) {
  let r = rec; let now = start;
  for (const c of results) { r = applyAnswer(r, id, c, timeMs, T, now).record; now += 60_000; }
  return r!;
}

describe('MasteryEngine', () => {
  it('one correct answer is only Developing; a run of correct answers reaches Nearly Mastered; speed unlocks Mastered', () => {
    const one = drill(undefined, 'fact:mult:6x7', [true]);
    expect(bandFor(one.mastery)).toBe('Developing');
    const slow = drill(undefined, 'fact:mult:6x7', Array(10).fill(true), 9000);
    expect(slow.mastery).toBeLessThanOrEqual(89);
    expect(slow.mastery).toBeGreaterThanOrEqual(85);
    const fast = drill(undefined, 'fact:mult:6x7', Array(10).fill(true), 2500);
    expect(fast.mastery).toBeGreaterThanOrEqual(90);
    expect(bandFor(fast.mastery)).toBe('Mastered');
  });

  it('a miss on a mastered fact drops mastery noticeably and reschedules it soon', () => {
    const fast = drill(undefined, 'fact:mult:6x7', Array(12).fill(true), 2500);
    const missed = applyAnswer(fast, 'fact:mult:6x7', false, 5000, T, 2_000_000).record;
    expect(missed.mastery).toBeLessThan(fast.mastery - 10);
    expect(missed.srs.dueAt - 2_000_000).toBe(INTERVALS_MS[0]);
    expect(missed.srs.lapses).toBe(1);
  });

  it('tracks each fact individually and aggregates table mastery', () => {
    let m: Record<string, MasteryRecord> = {};
    m['fact:mult:6x7'] = drill(undefined, 'fact:mult:6x7', [true, true, true, true, true, true], 2500);
    expect(skillMastery('mult.6', m)).toBeGreaterThan(0);
    expect(skillMastery('mult.6', m)).toBeLessThan(15); // 1 of 12 facts
    expect(skillMastery('mult.7', m)).toBeGreaterThan(0); // shared canonical fact 6x7
    expect(skillMastery('mult.8', m)).toBe(0);
  });

  it('weights weak facts far more heavily than mastered ones', () => {
    const weak = drill(undefined, 'fact:mult:7x8', [false, false, true, false], 4000);
    const strong = drill(undefined, 'fact:mult:2x3', Array(12).fill(true), 2000);
    expect(selectionWeight(weak, 2_000_000)).toBeGreaterThan(selectionWeight(strong, 1_000_000 + 60_000 * 12) * 4);
  });

  it('weak facts return more frequently in generated questions', () => {
    const mastery: Record<string, MasteryRecord> = {};
    for (const f of tableFacts(7)) mastery[f] = drill(undefined, f, Array(12).fill(true), 2000);
    mastery['fact:mult:7x8'] = drill(undefined, 'fact:mult:7x8', [false, false, false, true, false], 6000);
    const rng = createRng(5);
    let hits = 0; const N = 600;
    for (let i = 0; i < N; i++) if (generateQuestion('mult.7', mastery, { rng, difficulty: 2, now: 1_000_000 + 13 * 60_000 }).factId === 'fact:mult:7x8') hits++;
    expect(hits / N).toBeGreaterThan(0.2); // far above the uniform 1/12
  });

  it('pickFact avoids immediate repeats', () => {
    const rng = createRng(2);
    const facts = tableFacts(3);
    for (let i = 0; i < 50; i++) expect(pickFact(facts, {}, rng, ['fact:mult:3x3'])).not.toBe('fact:mult:3x3');
  });

  it('spaced repetition climbs the interval ladder on success and drops on failure', () => {
    let srs = initialSrs(0);
    srs = scheduleAfterAnswer(srs, true, 75, 0);
    expect(srs.stage).toBe(1);
    srs = scheduleAfterAnswer(srs, true, 80, 0);
    expect(srs.stage).toBe(2);
    expect(srs.dueAt).toBe(INTERVALS_MS[2]);
    srs = scheduleAfterAnswer(srs, false, 60, 0);
    expect(srs.stage).toBe(0);
  });

  it('mastery decays when review is overdue and weak items surface for the review dungeon', () => {
    const r = drill(undefined, 'fact:mult:9x6', Array(8).fill(true), 2500);
    const later = r.srs.dueAt + 10 * 86_400_000;
    expect(effectiveMastery(r, later)).toBeLessThan(r.mastery);
    const m = { 'fact:mult:9x6': r, 'fact:mult:7x8': drill(undefined, 'fact:mult:7x8', [false, true, false], 5000) };
    const weak = weakItems(m, 2_000_000);
    expect(weak.map((w) => w.id)).toContain('fact:mult:7x8');
  });

  it('computeMastery handles empty records', () => {
    expect(computeMastery(newRecord('x'), T)).toBe(0);
  });
});
