import { describe, it, expect, vi, afterEach } from 'vitest';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';
import type { GameState } from '../state/types';
import { recordSpeed, summarizeRun, passedTarget, nextTarget, speedRows, runsFor, speedCsv, initialSpeed, speedKey, SPEED_TARGETS_MS } from '../state/speed';
import { pureMultQuestion } from '../questions/multiplication';
import { createRng } from '../rng';

const fresh = (): GameState => ({ ...initialState(), character: { name: 'T', avatar: 'avatar-01', level: 1, xp: 0, hp: 100, maxHp: 100, energy: 50, maxEnergy: 50, specialization: 'mechanical', intelligence: 1, engineeringSkill: 1, createdAt: 0, title: 'Apprentice' } as unknown as GameState['character'], screen: 'arcade' });
const at = (ms: number) => vi.setSystemTime(ms);
afterEach(() => vi.useRealTimers());

describe('Speed practice', () => {
  it('files times per fact and summarises a run', () => {
    const q = pureMultQuestion(6, 7, createRng(1));
    expect(speedKey(q)).toBe('fact:mult:6x7');
    let st = recordSpeed(initialSpeed(), q, 4200, true, 1000);
    st = recordSpeed(st, q, 2800, true, 2000);
    st = recordSpeed(st, q, 9000, false, 3000);
    const f = st.facts['fact:mult:6x7'];
    expect(f.n).toBe(3); expect(f.correct).toBe(2); expect(f.bestMs).toBe(2800); expect(f.lastMs).toBe(9000); expect(f.recent).toEqual([4200, 2800, 9000]);
    const sum = summarizeRun([{ correct: true, timeMs: 2000 }, { correct: true, timeMs: 4000 }, { correct: false, timeMs: 3000 }, { correct: true, timeMs: 6000 }], 5000);
    expect(sum).toEqual({ n: 4, correct: 3, onTime: 2, avgMs: 3750, medianMs: 3500, bestMs: 2000 });
    expect(passedTarget({ n: 20, correct: 18, onTime: 18 })).toBe(true);
    expect(passedTarget({ n: 20, correct: 18, onTime: 17 })).toBe(false);
    expect(nextTarget(15_000)).toBe(10_000); expect(nextTarget(3000)).toBeNull(); expect(SPEED_TARGETS_MS.at(-1)).toBe(3000);
    const rows = speedRows(st, 'mult', 'mult:6');
    expect(rows[0].label).toBe('6 × 7'); expect(rows[0].n).toBe(3); expect(rows[0].recentAvgMs).toBe(5333);
    expect(rows.filter((r) => r.n === 0).length).toBeGreaterThan(5);
    expect(speedCsv(st)).toContain('"fact:mult:6x7","6 × 7",3,2,5333,2800,9000,5333');
  });

  it('runs a speed set through the reducer: per-question clock, data recorded, pass suggests the next clock', () => {
    vi.useFakeTimers(); let s = fresh(); let now = 10_000; at(now);
    s = gameReducer(s, { type: 'ARCADE_START', game: 'mult', mode: 'speed', selection: 'mult:7', targetMs: 5000 });
    expect(s.arcade!.mode).toBe('speed'); expect(s.arcade!.targetMs).toBe(5000); expect(s.arcade!.setSize).toBe(20);
    for (let i = 0; i < 20; i++) {
      now += i === 0 ? 7000 : 2500; at(now); // first one slow, the rest on time
      s = gameReducer(s, { type: 'ARCADE_ANSWER', given: String(s.arcade!.question.answer) });
      if (i === 0) expect(s.arcade!.feedback!.text).toContain('over by 2.0 s');
      if (i === 1) expect(s.arcade!.feedback!.text).toContain('on the clock');
      if (i < 19) { now += 500; at(now); s = gameReducer(s, { type: 'ARCADE_NEXT' }); }
    }
    expect(s.arcade!.status).toBe('finished');
    const runs = runsFor(s.stats.speed, 'mult', 'mult:7');
    expect(runs).toHaveLength(1); expect(runs[0].n).toBe(20); expect(runs[0].correct).toBe(20); expect(runs[0].onTime).toBe(19); expect(runs[0].targetMs).toBe(5000);
    expect(passedTarget(runs[0])).toBe(true); expect(s.arcade!.newBest).toBe(true);
    expect(s.toasts.some((t) => t.text.includes('Ready for 3 s'))).toBe(true);
    expect(Object.keys(s.stats.speed.facts).length).toBeGreaterThan(3);
    expect(Object.values(s.stats.speed.facts).reduce((a, f) => a + f.n, 0)).toBe(20);
    expect(s.achievements['speed-pass']).toBeTruthy(); expect(s.achievements['speed-3']).toBeFalsy();
    // Practice answers add data points too, and old saves load with an empty speed record.
    s = gameReducer(s, { type: 'ARCADE_START', game: 'mult', mode: 'practice', selection: 'mult:7' });
    at(now + 3000); s = gameReducer(s, { type: 'ARCADE_ANSWER', given: String(s.arcade!.question.answer) });
    expect(Object.values(s.stats.speed.facts).reduce((a, f) => a + f.n, 0)).toBe(21);
    const legacy = gameReducer(fresh(), { type: 'LOAD', state: { ...fresh(), stats: { ...fresh().stats, speed: undefined as never } } });
    expect(legacy.stats.speed).toEqual({ facts: {}, runs: [] });
  });
});
