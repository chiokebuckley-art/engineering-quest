import { describe, it, expect, vi, afterEach } from 'vitest';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';
import type { GameState } from '../state/types';
import { createRng } from '../rng';
import { ACADEMIES, academyById, coreChapters } from '../academy/registry';
import { buildQuest, buildConcept, buildTransfer, buildTrial, judge, feedbackFor, chapterGates, chapterAvailable, graduation, trialReady, academyNext, fluencyFor, criticalFacts, trackOf, academyUnlocked, currentAcademy, ladder, graduated } from '../academy/AcademyEngine';
import type { AskStep, AcademyStep } from '../academy/types';
import { answerLabel, generateQuestion } from '../questions';
import { initialChapter, migrateAcademy } from '../academy/types';
import { parseSelection } from '../state/arcade';
import { addMiss } from '../notebook/notebook';

function newGame(): GameState {
  let s = gameReducer(initialState(), { type: 'NEW_GAME' });
  s = gameReducer(s, { type: 'SEEN_INTRO' });
  s = gameReducer(s, { type: 'CREATE_CHARACTER', name: 'Kid', avatar: '/assets/characters/avatar-01.svg', specialization: 'undecided' });
  while (s.dialogue) s = gameReducer(s, { type: 'DIALOGUE_NEXT' });
  return s;
}
const asks = (steps: AcademyStep[]) => steps.filter((x): x is AskStep => x.kind === 'ask');
import { rightAnswer, wrongAnswer } from '../academy/judge';
const ARITH = academyById('arithmetic')!;
const CH = (key: string) => ARITH.chapters.find((c) => c.key === key)!;
const arith = (s: GameState) => trackOf(s.academy, 'arithmetic');
void answerLabel;
afterEach(() => vi.useRealTimers());

/** Play the current run to the end, answering right or wrong per `plan(i)`. */
function playRun(s: GameState, plan: (i: number, st: AskStep) => boolean = () => true): GameState {
  let i = 0; let guard = 0;
  while (s.academy.run && s.academy.run.status === 'active' && guard++ < 200) {
    const r = s.academy.run; const st = r.steps[r.index];
    if (st.kind !== 'ask') { s = gameReducer(s, { type: 'ACADEMY_NEXT' }); continue; }
    if (!r.feedback) { const ok = plan(i++, st); s = gameReducer(s, { type: 'ACADEMY_ANSWER', given: ok ? rightAnswer(st) : wrongAnswer(st) }); continue; }
    s = gameReducer(s, { type: 'ACADEMY_NEXT' });
    // a retry after a first miss: answer wrong again so the result stays a miss
    const r2 = s.academy.run; if (r2 && r2.status === 'active' && r2.index === r.index && !r2.feedback && r2.attempts === 1) s = gameReducer(s, { type: 'ACADEMY_ANSWER', given: wrongAnswer(st) });
  }
  return s;
}

describe('Arithmetic Academy content', () => {
  it('every quest builds, and the right answer passes its own judge', () => {
    for (const c of ARITH.chapters) for (const q of c.quests) for (const seed of [1, 2, 3, 4, 5]) {
      const run = buildQuest(q.id, createRng(seed))!;
      expect(run, q.id).toBeTruthy();
      expect(run.academyId).toBe('arithmetic');
      expect(run.chapter).toBe(c.key);
      const items = asks(run.steps);
      expect(items.length, q.id).toBeGreaterThanOrEqual(7);
      for (const st of items) {
        expect(judge(st, rightAnswer(st)), `${q.id} ${st.question.expression}`).toBe(true);
        expect(judge(st, wrongAnswer(st)), `${q.id} ${st.question.expression}`).toBe(false);
      }
      if (q.guided) expect(run.steps.filter((x) => x.kind === 'teach').length).toBe(c.teach.length);
    }
  });
  it('concept checks have three model items and transfer sets are the right size', () => {
    for (const c of ARITH.chapters) {
      expect(asks(buildConcept('arithmetic', c.key, createRng(3))!.steps).length).toBe(3);
      expect(asks(buildTransfer('arithmetic', c.key, createRng(3))!.steps).length).toBe(c.transferCount);
    }
  });
  it('the trial has five phases and at least 25 prompts', () => {
    const t = buildTrial('arithmetic', createRng(9))!;
    expect(t.phases?.length).toBe(5);
    expect(asks(t.steps).length).toBeGreaterThanOrEqual(25);
    for (const st of asks(t.steps)) expect(judge(st, rightAnswer(st))).toBe(true);
  });
  it('the umbrella skills generate questions for drills and the skill tree', () => {
    for (const id of ['num.sense', 'frac', 'ratio', 'percent', 'exponents']) {
      const q = generateQuestion(id, {}, { rng: createRng(1) });
      expect(q.masterySkillId).toBe(id);
    }
  });
  it('tips and hints never hand over the answer on a first miss', () => {
    for (const c of ARITH.chapters.slice(0, 8)) {
      const run = buildQuest(c.quests[0].id, createRng(11))!;
      for (const st of asks(run.steps)) {
        const a = String(st.question.answerText ?? st.question.answer).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
        const text = feedbackFor(st, false, true);
        expect(new RegExp(`(=|is|makes?|lands? on|:)\\s*${a}(?![\\d.])`).test(text), `${c.key}: ${text}`).toBe(false);
      }
    }
  });
});

describe('Academy quests through the reducer', () => {
  it('a clean quest clears, ticks the chapter and changes the world', () => {
    vi.useFakeTimers(); vi.setSystemTime(1_700_000_000_000);
    let s = newGame();
    s = gameReducer(s, { type: 'ACADEMY_START', kind: 'quest', questId: 'aq.ch1.counting-yard' });
    expect(s.screen).toBe('academy');
    expect(s.academy.run?.kind).toBe('quest');
    const before = s.character!.xp;
    s = playRun(s);
    expect(s.academy.run?.status).toBe('done');
    expect(s.academy.run?.passed).toBe(true);
    expect(arith(s).chapters.count.quests['aq.ch1.counting-yard']).toBe(1);
    expect(s.character!.xp).toBeGreaterThan(before);
    expect(s.world.lastChange?.text).toContain('Counting Yard');
    expect(s.stats.totalAnswered).toBe(8);
    expect(s.toasts.some((t) => t.text.startsWith('Quest cleared'))).toBe(true);
  });
  it('a first miss gets a hint and a retry; the result counts the first attempt only', () => {
    let s = newGame();
    s = gameReducer(s, { type: 'ACADEMY_START', kind: 'quest', questId: 'aq.ch1.counting-yard' });
    while (s.academy.run!.steps[s.academy.run!.index].kind !== 'ask') s = gameReducer(s, { type: 'ACADEMY_NEXT' });
    const st = s.academy.run!.steps[s.academy.run!.index] as AskStep;
    s = gameReducer(s, { type: 'ACADEMY_ANSWER', given: wrongAnswer(st) });
    expect(s.academy.run!.feedback?.correct).toBe(false);
    expect(s.academy.run!.feedback?.text).not.toContain(`answer was`);
    expect(s.academy.run!.results).toEqual([false]);
    expect(s.notebook.length).toBe(1);
    s = gameReducer(s, { type: 'ACADEMY_NEXT' });
    expect(s.academy.run!.index).toBe(s.academy.run!.index); expect(s.academy.run!.feedback).toBeUndefined(); expect(s.academy.run!.helperOn).toBe(true);
    s = gameReducer(s, { type: 'ACADEMY_ANSWER', given: rightAnswer(st) });
    expect(s.academy.run!.feedback?.correct).toBe(true);
    expect(s.academy.run!.results).toEqual([false]);
    expect(s.stats.totalAnswered).toBe(1);
    s = gameReducer(s, { type: 'ACADEMY_NEXT' });
    expect(s.academy.run!.attempts).toBe(0);
  });
  it('a quest below 70% does not clear', () => {
    let s = newGame();
    s = gameReducer(s, { type: 'ACADEMY_START', kind: 'quest', questId: 'aq.ch1.counting-yard' });
    s = playRun(s, (i) => i % 2 === 0);
    expect(s.academy.run?.passed).toBe(false);
    expect(arith(s).chapters.count?.quests['aq.ch1.counting-yard'] ?? 0).toBe(0);
  });
  it('chapter 2 opens after both chapter 1 quests; Fractions also needs the Division concept pass', () => {
    let s = newGame();
    expect(chapterAvailable(s, 'arithmetic', 'place')).toBe(false);
    expect(gameReducer(s, { type: 'ACADEMY_START', kind: 'quest', questId: 'aq.ch2.number-forge' }).academy.run).toBeNull();
    for (const id of ['aq.ch1.counting-yard', 'aq.ch1.cart-sort']) { s = gameReducer(s, { type: 'ACADEMY_START', kind: 'quest', questId: id }); s = playRun(s); s = gameReducer(s, { type: 'ACADEMY_EXIT' }); }
    expect(chapterAvailable(s, 'arithmetic', 'place')).toBe(true);
    const clear = (key: string) => ({ ...initialChapter(), quests: Object.fromEntries(CH(key).quests.map((q) => [q.id, 1])) });
    const withChapters = (st: GameState, extra: Record<string, ReturnType<typeof clear>>) => ({ ...st, academy: { ...st.academy, tracks: { ...st.academy.tracks, arithmetic: { ...arith(st), chapters: { ...arith(st).chapters, ...extra } } } } });
    let t = withChapters(s, Object.fromEntries(['place', 'add', 'sub', 'mult', 'div', 'props'].map((k) => [k, clear(k)])));
    expect(chapterAvailable(t, 'arithmetic', 'frac')).toBe(false);
    t = withChapters(t, { div: { ...clear('div'), conceptPass: true } });
    expect(chapterAvailable(t, 'arithmetic', 'frac')).toBe(true);
  });
  it('concept check passes at 2 of 3 and transfer at 80%', () => {
    let s = newGame();
    s = gameReducer(s, { type: 'ACADEMY_START', kind: 'concept', academy: 'arithmetic', chapter: 'count' });
    s = playRun(s, (i) => i !== 1);
    expect(arith(s).chapters.count.conceptPass).toBe(true);
    expect(arith(s).chapters.count.conceptBest).toBe(2);
    s = gameReducer(s, { type: 'ACADEMY_EXIT' });
    s = gameReducer(s, { type: 'ACADEMY_START', kind: 'transfer', academy: 'arithmetic', chapter: 'count' });
    s = playRun(s, (i) => i !== 0 && i !== 2);
    expect(arith(s).chapters.count.transferPass).toBe(false);
    s = gameReducer(s, { type: 'ACADEMY_EXIT' });
    s = gameReducer(s, { type: 'ACADEMY_START', kind: 'transfer', academy: 'arithmetic', chapter: 'count' });
    s = playRun(s, (i) => i !== 0);
    expect(arith(s).chapters.count.transferPass).toBe(true);
    expect(arith(s).chapters.count.transferAttempts).toBe(2);
  });
  it('fluency counts answers from anywhere and a chapter masters once every gate holds', () => {
    vi.useFakeTimers(); vi.setSystemTime(1_700_000_000_000);
    let s = newGame();
    const c = CH('count');
    expect(fluencyFor(c, s.answers).band).toBe('none');
    // Arcade practice on number sense feeds chapter 1 fluency.
    for (let i = 0; i < 12; i++) s = { ...s, answers: [...s.answers, { at: Date.now(), skillId: 'num.sense', questionId: `x${i}`, correct: true, timeMs: 3000, given: '1', expected: 1, context: 'drill' }] };
    expect(fluencyFor(c, s.answers).pass).toBe(true);
    for (const id of ['aq.ch1.counting-yard', 'aq.ch1.cart-sort']) { s = gameReducer(s, { type: 'ACADEMY_START', kind: 'quest', questId: id }); s = playRun(s); s = gameReducer(s, { type: 'ACADEMY_EXIT' }); }
    s = gameReducer(s, { type: 'ACADEMY_START', kind: 'concept', academy: 'arithmetic', chapter: 'count' }); s = playRun(s); s = gameReducer(s, { type: 'ACADEMY_EXIT' });
    expect(chapterGates(s, 'arithmetic', 'count').mastered).toBe(false);
    s = gameReducer(s, { type: 'ACADEMY_START', kind: 'transfer', academy: 'arithmetic', chapter: 'count' }); s = playRun(s);
    expect(chapterGates(s, 'arithmetic', 'count').mastered).toBe(true);
    expect(arith(s).chapters.count.masteredAt).toBeTruthy();
    expect(s.toasts.some((t) => t.text.includes('Chapter 1 mastered'))).toBe(true);
    expect(academyNext(s, 'arithmetic').chapter).toBe('place');
  });
});

const forcedMastery = (s: GameState, academyId = 'arithmetic'): GameState => {
  const a = academyById(academyId)!;
  const chapters = Object.fromEntries(coreChapters(a).map((c) => [c.key, { ...initialChapter(), quests: Object.fromEntries(c.quests.map((q) => [q.id, 1])), conceptPass: true, conceptBest: 3, transferPass: true, transferBest: c.transferCount, masteredAt: 1 }]));
  let answers = s.answers;
  for (const c of coreChapters(a)) for (let i = 0; i < c.fluency.n; i++) answers = [...answers, { at: 1, skillId: c.fluency.skills[0], questionId: `f${c.key}-${i}`, correct: true, timeMs: 1000, given: '1', expected: 1, context: 'drill' as const }];
  const t = trackOf(s.academy, academyId);
  return { ...s, answers, academy: { ...s.academy, tracks: { ...s.academy.tracks, [academyId]: { ...t, chapters } } } };
};
const passTrial = (s: GameState, academyId: string, now = 1): GameState => {
  const t = trackOf(s.academy, academyId);
  return { ...s, academy: { ...s.academy, tracks: { ...s.academy.tracks, [academyId]: { ...t, trial: { ...t.trial, passedAt: now } } } } };
};

describe('Graduation', () => {
  it('lists every missing gate, and the trial stays shut until they hold', () => {
    const s = newGame();
    const g = graduation(s, 'arithmetic');
    expect(g.ready).toBe(false);
    expect(g.reasons[0]).toContain('Chapter 1');
    expect(g.reasons.some((r) => r.includes('Mastery Trial'))).toBe(true);
    expect(trialReady(s, 'arithmetic').ready).toBe(false);
    expect(gameReducer(s, { type: 'ACADEMY_START', kind: 'trial', academy: 'arithmetic' }).academy.run).toBeNull();
    expect(arith(gameReducer(s, { type: 'ACADEMY_GRADUATE', academy: 'arithmetic' })).graduatedAt).toBeUndefined();
  });
  it('critical weak facts in the academy families block the trial until repaired', () => {
    let s = forcedMastery(newGame());
    expect(trialReady(s, 'arithmetic').ready).toBe(true);
    const q = generateQuestion('mult.7', {}, { rng: createRng(2) });
    let book = addMiss([], q, String(q.answer + 1), 'drill', 1_000);
    expect(criticalFacts({ ...s, notebook: book }, 'arithmetic').length).toBe(0);
    book = addMiss(book, q, String(q.answer + 2), 'drill', 2_000);
    s = { ...s, notebook: book };
    expect(criticalFacts(s, 'arithmetic').length).toBe(1);
    expect(trialReady(s, 'arithmetic').ready).toBe(false);
    expect(trialReady(s, 'arithmetic').reasons[0]).toContain('critical weak fact');
  });
  it('passing the trial and graduating opens the next academy and its region, with a ceremony', () => {
    vi.useFakeTimers(); vi.setSystemTime(1_700_000_000_000);
    let s = forcedMastery(newGame());
    s = gameReducer(s, { type: 'ACADEMY_START', kind: 'trial', academy: 'arithmetic' });
    expect(s.academy.run?.kind).toBe('trial');
    expect(arith(s).trial.attempts).toBe(1);
    s = gameReducer(s, { type: 'ACADEMY_NEXT' });
    s = gameReducer(s, { type: 'ACADEMY_HELP' });
    expect(s.academy.run?.helperUsed).toBe(true);
    s = playRun(s, (i) => i !== 3 && i !== 10);
    expect(s.academy.run?.passed).toBe(true);
    expect(arith(s).trial.passedAt).toBeTruthy();
    expect(chapterAvailable(s, 'arithmetic', 'trial')).toBe(true);
    expect(graduation(s, 'arithmetic').ready).toBe(true);
    expect(s.world.unlockedRegions).not.toContain('algebra-city');
    s = gameReducer(s, { type: 'ACADEMY_GRADUATE', academy: 'arithmetic' });
    expect(arith(s).graduatedAt).toBeTruthy();
    expect(s.world.unlockedRegions).toContain('algebra-city');
    expect(s.world.ceremony).toBe('academy:arithmetic');
    expect(s.character?.title).toBe('Arithmetic Graduate');
    expect(s.screen).toBe('region');
    expect(s.academy.current).toBe('prealgebra');
    expect(academyNext(s, 'arithmetic').kind).toBe('next-academy');
    expect(academyUnlocked(s, 'prealgebra')).toBe(!academyById('prealgebra')!.draft);
  });
  it('a failed trial records the best score and leaves graduation shut', () => {
    let s = forcedMastery(newGame());
    s = gameReducer(s, { type: 'ACADEMY_START', kind: 'trial', academy: 'arithmetic' });
    s = playRun(s, (i) => i % 3 !== 0);
    expect(s.academy.run?.passed).toBe(false);
    expect(arith(s).trial.passedAt).toBeUndefined();
    expect(arith(s).trial.best).toBeGreaterThan(0);
    expect(arith(gameReducer(s, { type: 'ACADEMY_GRADUATE', academy: 'arithmetic' })).graduatedAt).toBeUndefined();
  });
  it('old saves load with an empty Academy and no run', () => {
    const s = newGame();
    const { academy: _a, ...old } = s;
    const loaded = gameReducer(initialState(), { type: 'LOAD', state: old as unknown as GameState });
    expect(loaded.academy.tracks).toEqual({});
    expect(loaded.academy.run).toBeNull();
  });
  it('v0.30 Arithmetic progress (chapters by number) moves to the arithmetic track by key', () => {
    const legacy = { started: true, chapters: { '1': { ...initialChapter(), quests: { 'aq.ch1.counting-yard': 2 }, conceptPass: true }, '8': { ...initialChapter(), quests: { 'aq.ch8.forest-bridge': 1 } }, '15': { ...initialChapter() } }, trial: { attempts: 2, best: 18 }, run: null, graduatedAt: undefined };
    const m = migrateAcademy(legacy);
    expect(m.tracks.arithmetic.chapters.count.quests['aq.ch1.counting-yard']).toBe(2);
    expect(m.tracks.arithmetic.chapters.count.conceptPass).toBe(true);
    expect(m.tracks.arithmetic.chapters.frac.quests['aq.ch8.forest-bridge']).toBe(1);
    expect(m.tracks.arithmetic.trial).toEqual({ attempts: 2, best: 18, passedAt: undefined });
    const s = gameReducer(initialState(), { type: 'LOAD', state: { ...newGame(), academy: legacy } as unknown as GameState });
    expect(trackOf(s.academy, 'arithmetic').chapters.count.quests['aq.ch1.counting-yard']).toBe(2);
    // A chapter already started stays open even if one before it was inserted later.
    expect(chapterAvailable(s, 'arithmetic', 'frac')).toBe(true);
  });
});

describe('The academy ladder', () => {
  it('opens one academy at a time, in order', () => {
    let s = newGame();
    const live = ACADEMIES.filter((a) => !a.draft && a.chapters.length);
    expect(academyUnlocked(s, 'arithmetic')).toBe(true);
    for (const a of ACADEMIES.slice(1)) expect(academyUnlocked(s, a.id)).toBe(false);
    expect(currentAcademy(s).id).toBe('arithmetic');
    expect(ladder(s)[0].status).toBe('open');
    for (let i = 0; i < live.length - 1; i++) {
      const a = live[i]; const b = ACADEMIES[ACADEMIES.indexOf(a) + 1];
      s = passTrial(forcedMastery(s, a.id), a.id);
      s = gameReducer(s, { type: 'ACADEMY_GRADUATE', academy: a.id });
      expect(graduated(s, a.id)).toBe(true);
      if (b && !b.draft && b.chapters.length) {
        expect(academyUnlocked(s, b.id)).toBe(true);
        expect(currentAcademy(s).id).toBe(b.id);
        if (b.home !== 'village') expect(s.world.unlockedRegions).toContain(b.home);
      }
      s = gameReducer(s, { type: 'CEREMONY_DONE' });
    }
  });
  it('a locked academy refuses to start', () => {
    const s = newGame();
    const locked = ACADEMIES.find((a) => a.id !== 'arithmetic')!;
    const t = gameReducer(s, { type: 'ACADEMY_START', kind: 'concept', academy: locked.id, chapter: locked.chapters[0]?.key ?? 'x' });
    expect(t.academy.run).toBeNull();
  });
  it('the arcade can practise any academy chapter', () => {
    const sel = parseSelection('academy', 'academy:arithmetic.count');
    expect(sel.skillIds).toEqual(['acad.arithmetic.count']);
    expect(sel.label).toBe('Arithmetic: Quantity & Counting');
  });
});
