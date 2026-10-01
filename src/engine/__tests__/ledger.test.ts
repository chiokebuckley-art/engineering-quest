import { describe, it, expect, vi, afterEach } from 'vitest';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';
import type { GameState } from '../state/types';
import { initialLedger, recordLedger, recordLedgerRun, ledgerSeries, ledgerByNumber, ledgerByTable, ledgerByGame, ledgerByMode, ledgerSummary, ledgerRuns, ledgerCsv, ledgerDay, selectionKeys, troubleSpots, LEDGER_DAYS_KEPT } from '../state/ledger';
import { pureMultQuestion } from '../questions/multiplication';
import { createRng } from '../rng';
import { activeEntries } from '../notebook/notebook';

const fresh = (): GameState => ({ ...initialState(), character: { name: 'T', avatar: 'avatar-01', level: 1, xp: 0, hp: 100, maxHp: 100, energy: 50, maxEnergy: 50, specialization: 'mechanical', intelligence: 1, engineeringSkill: 1, createdAt: 0, title: 'Apprentice' } as unknown as GameState['character'], screen: 'arcade' });
const at = (ms: number) => vi.setSystemTime(ms);
afterEach(() => vi.useRealTimers());
const DAY = 86_400_000;
const noon = (dayOffset: number) => { const d = new Date(2026, 8, 17, 12, 0, 0); return d.getTime() + dayOffset * DAY; };

describe('Arcade ledger', () => {
  it('files every answer by day, game, mode and number, and keeps lifetime totals', () => {
    const q67 = pureMultQuestion(6, 7, createRng(1)); const q88 = pureMultQuestion(8, 8, createRng(2));
    let st = initialLedger();
    st = recordLedger(st, q67, 'mult', 'practice', true, 3000, noon(0));
    st = recordLedger(st, q67, 'mult', 'blitz', false, 5000, noon(0));
    st = recordLedger(st, q67, 'mult', 'blitz', false, 4000, noon(1));
    st = recordLedger(st, q88, 'mult', 'speed', true, 2000, noon(1));
    const d0 = ledgerDay(noon(0)); const d1 = ledgerDay(noon(1));
    expect(st.days[d0]['mult|practice|fact:mult:6x7']).toEqual({ n: 1, right: 1, ms: 3000 });
    expect(st.days[d0]['mult|blitz|fact:mult:6x7']).toEqual({ n: 1, right: 0, ms: 5000 });
    expect(st.days[d1]['mult|blitz|fact:mult:6x7']).toEqual({ n: 1, right: 0, ms: 4000 });
    expect(st.totals['mult|fact:mult:6x7']).toMatchObject({ n: 3, right: 1, ms: 12000, wrongStreak: 2 });
    expect(st.totals['mult|fact:mult:8x8']).toMatchObject({ n: 1, right: 1, wrongStreak: 0 });

    // The series has one point per day, zeros included, and honours the mode and number filters.
    const series = ledgerSeries(st, { game: 'mult' }, 3, noon(1));
    expect(series.map((p) => [p.day, p.right, p.wrong])).toEqual([[ledgerDay(noon(-1)), 0, 0], [d0, 1, 1], [d1, 1, 1]]);
    expect(ledgerSeries(st, { game: 'mult', mode: 'blitz' }, 2, noon(1)).map((p) => p.wrong)).toEqual([1, 1]);
    expect(ledgerSeries(st, { game: 'mult', keys: new Set(['fact:mult:8x8']) }, 2, noon(1)).map((p) => p.right)).toEqual([0, 1]);
    expect(ledgerSeries(st, { game: 'div' }, 2, noon(1)).every((p) => p.right + p.wrong === 0)).toBe(true);

    // Broken down by the number, weakest first; by table, 6 × 7 counts for the 6s and the 7s.
    const rows = ledgerByNumber(st, { game: 'mult' }, 30, noon(1));
    expect(rows.map((r) => [r.label, r.accuracy, r.wrong])).toEqual([['6 × 7', 33, 2], ['8 × 8', 100, 0]]);
    const tables = ledgerByTable(st, { game: 'mult' }, 30, noon(1));
    expect(tables.map((t) => [t.label, t.n])).toEqual([['× 6', 3], ['× 7', 3], ['× 8', 1]]);
    expect(ledgerByMode(st, { game: 'mult' }, 30, noon(1)).map((m) => [m.key, m.n])).toEqual([['practice', 1], ['blitz', 2], ['speed', 1]]);
    expect(ledgerSummary(st, { game: 'mult' }, 30, noon(1))).toMatchObject({ n: 4, right: 2, wrong: 2, accuracy: 50, avgMs: 3500 });
    expect(ledgerByGame(st, {}, 30, noon(1), (g) => g.toUpperCase())[0]).toMatchObject({ label: 'MULT', n: 4 });
    expect(troubleSpots(st).map((t) => t.label)).toEqual(['6 × 7']);
    const csv = ledgerCsv(st);
    expect(csv).toContain(`"${d0}","mult","blitz","fact:mult:6x7","6 × 7",1,0,1,5000`);
    expect(csv).toContain('"mult","fact:mult:6x7","6 × 7",3,1,2,4000,2,');
  });

  it('keeps the ledger bounded: old days are pruned, runs are capped, empty runs are dropped', () => {
    const q = pureMultQuestion(3, 4, createRng(1));
    let st = recordLedger(initialLedger(), q, 'mult', 'practice', true, 1000, noon(0));
    st = recordLedger(st, q, 'mult', 'practice', true, 1000, noon(LEDGER_DAYS_KEPT + 5));
    expect(Object.keys(st.days)).toEqual([ledgerDay(noon(LEDGER_DAYS_KEPT + 5))]);
    expect(st.totals['mult|fact:mult:3x4'].n).toBe(2); // totals survive pruning
    const run = { at: 1, game: 'mult' as const, mode: 'blitz' as const, selection: 'mult:3', clockMs: 60000, n: 5, right: 4, wrong: 1, score: 100, durationMs: 60000 };
    expect(recordLedgerRun(st, { ...run, n: 0 }).runs).toHaveLength(0);
    for (let i = 0; i < 450; i++) st = recordLedgerRun(st, { ...run, at: i });
    expect(st.runs).toHaveLength(400); expect(st.runs[0].at).toBe(50);
    expect(selectionKeys('mult', 'mult:6').keys?.size).toBe(12);
    expect(selectionKeys('volume', 'volume:all')).toEqual({ keys: new Set(), skillPrefixes: ['volume'] });
    expect(selectionKeys('mixed', 'mixed:all')).toEqual({});
  });

  it('logs Blitz, Practice and Speed through the reducer, with the clock, and sends every miss to the notebook', () => {
    vi.useFakeTimers(); let s = fresh(); let now = noon(0); at(now);
    // Blitz on the 7s for 60 s: two right, one wrong, then the clock runs out.
    s = gameReducer(s, { type: 'ARCADE_START', game: 'mult', mode: 'blitz', selection: 'mult:7', durationMs: 60_000 });
    const answers = [true, false, true];
    for (const right of answers) {
      now += 2000; at(now);
      const q = s.arcade!.question;
      s = gameReducer(s, { type: 'ARCADE_ANSWER', given: right ? String(q.answer) : String(Number(q.answer) + 1) });
      now += 300; at(now); s = gameReducer(s, { type: 'ARCADE_NEXT' });
    }
    now += 60_000; at(now); s = gameReducer(s, { type: 'ARCADE_TIMEOUT' });
    expect(s.arcade!.status).toBe('finished');
    const runs = ledgerRuns(s.stats.ledger, 'mult', 'mult:7');
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({ mode: 'blitz', clockMs: 60_000, n: 3, right: 2, wrong: 1 });
    expect(ledgerRuns(s.stats.ledger, 'mult', 'mult:7', 'speed')).toHaveLength(0);
    expect(ledgerSummary(s.stats.ledger, { game: 'mult', mode: 'blitz' }, 7, now)).toMatchObject({ n: 3, right: 2, wrong: 1 });
    // The miss is in the wrong-answer notebook.
    expect(activeEntries(s.notebook)).toHaveLength(1);
    expect(activeEntries(s.notebook)[0].context).toBe('drill');

    // Practice: one wrong answer, then stop. It is logged and filed, and joins the notebook.
    s = gameReducer(s, { type: 'ARCADE_START', game: 'div', mode: 'practice', selection: 'div:6' });
    now += 4000; at(now);
    s = gameReducer(s, { type: 'ARCADE_ANSWER', given: String(Number(s.arcade!.question.answer) + 1) });
    s = gameReducer(s, { type: 'ARCADE_TIMEOUT' });
    expect(ledgerRuns(s.stats.ledger, 'div', 'div:6')[0]).toMatchObject({ mode: 'practice', clockMs: 0, n: 1, wrong: 1 });
    expect(ledgerByNumber(s.stats.ledger, { game: 'div' }, 7, now)[0]).toMatchObject({ accuracy: 0, wrong: 1 });
    expect(activeEntries(s.notebook)).toHaveLength(2);

    // Speed: a full set on the 5 s clock is logged with its clock and pass flag.
    s = gameReducer(s, { type: 'ARCADE_START', game: 'mult', mode: 'speed', selection: 'mult:7', targetMs: 5000 });
    for (let i = 0; i < 20; i++) {
      now += 2500; at(now); s = gameReducer(s, { type: 'ARCADE_ANSWER', given: String(s.arcade!.question.answer) });
      if (i < 19) { now += 300; at(now); s = gameReducer(s, { type: 'ARCADE_NEXT' }); }
    }
    const speedRun = ledgerRuns(s.stats.ledger, 'mult', 'mult:7', 'speed')[0];
    expect(speedRun).toMatchObject({ clockMs: 5000, n: 20, right: 20, wrong: 0, passed: true });
    expect(ledgerByMode(s.stats.ledger, { game: 'mult' }, 7, now).map((m) => [m.key, m.n])).toEqual([['blitz', 3], ['speed', 20]]);

    // Stopping early still logs the run (with the clock), even though it earns no best.
    s = gameReducer(s, { type: 'ARCADE_START', game: 'mult', mode: 'blitz', selection: 'mult:8', durationMs: 30_000 });
    now += 2000; at(now); s = gameReducer(s, { type: 'ARCADE_ANSWER', given: String(s.arcade!.question.answer) });
    now += 300; at(now); s = gameReducer(s, { type: 'ARCADE_EXIT' });
    expect(s.arcade).toBeNull(); expect(s.screen).toBe('arcade');
    expect(ledgerRuns(s.stats.ledger, 'mult', 'mult:8')[0]).toMatchObject({ mode: 'blitz', clockMs: 30_000, n: 1, right: 1, wrong: 0 });
    expect(s.stats.arcade.bests['mult:8@30']).toBeUndefined();
    // ...but an empty run (started and stopped) is not logged.
    s = gameReducer(s, { type: 'ARCADE_START', game: 'mult', mode: 'practice', selection: 'mult:9' });
    s = gameReducer(s, { type: 'ARCADE_EXIT' });
    expect(ledgerRuns(s.stats.ledger, 'mult', 'mult:9')).toHaveLength(0);

    // Old saves load with an empty ledger.
    const legacy = gameReducer(fresh(), { type: 'LOAD', state: { ...fresh(), stats: { ...fresh().stats, ledger: undefined as never } } });
    expect(legacy.stats.ledger).toEqual({ days: {}, totals: {}, runs: [] });
  });
});
