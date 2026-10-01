import type { AnswerContext, Difficulty, Question } from '../types';
import { createRng, type Rng } from '../rng';
import { generateQuestion, hasGenerator, answerLabel } from '../questions';
import { pureMultQuestion } from '../questions/multiplication';
import { pureDivQuestion } from '../questions/division';
import { bondQuestion } from '../questions/bonds';
import { wordProblem, type WordKind } from '../questions/wordproblems';
import { mentalQuestion, type MentalKind } from '../questions/mental';
import { volumeQuestion, VOLUME_KINDS, type VolumeKind } from '../questions/volume';
import { measureQuestion, MEASURE_KINDS, type MeasureKind } from '../questions/measure';
import { pictureGameForTopic } from '../questions/games';
import { trickQuestion, type TrickKind } from '../questions/tricks';
import { parseMultFact, parseDivFact, parseBondFact } from '../curriculum/facts';

/**
 * THE WRONG-ANSWER NOTEBOOK (错题本).
 * Every miss becomes a card: the question, what you answered, what kind of mistake it
 * was. Fixing a card means re-solving it plus three variations of the same structure and
 * one twist. Three clean fixes, spaced out (now, 3 days, 7 days), clear the card.
 */
export type ErrorKind = 'operation' | 'arithmetic' | 'timeout' | 'blank' | 'unknown';
export const ERROR_LABELS: Record<ErrorKind, { label: string; advice: string }> = {
  operation: { label: 'Wrong operation', advice: 'You used the wrong operation. Read the structure first: put together, take away, equal groups, or sharing?' },
  arithmetic: { label: 'Arithmetic slip', advice: 'Right idea, wrong number. Slow down one notch and check the last step.' },
  timeout: { label: 'Ran out of time', advice: 'The clock beat you. Accuracy first; speed follows.' },
  blank: { label: 'Left blank', advice: 'No answer at all. Next time write your best guess: a guess teaches more than a blank.' },
  unknown: { label: 'Off track', advice: 'Not sure what went wrong. Read the worked steps, then do the variations.' },
};

export interface NotebookEntry {
  id: string;
  createdAt: number;
  question: Question;
  given: string;
  context: AnswerContext;
  kind: ErrorKind;
  /** Clean fixes so far (0..CLEAN_TO_CLEAR). */
  clean: number;
  dueAt: number;
  lapses: number;
  lastAt: number;
  clearedAt?: number;
  fixes: number;
}

export interface NotebookRun {
  entryId: string;
  questions: Question[];
  /** 0 = the original, 1..3 variations, last = the twist. */
  index: number;
  attempts: number;
  results: boolean[];
  feedback?: { correct: boolean; text: string };
  questionStartedAt: number;
  status: 'active' | 'finished';
  outcome?: { clean: boolean; cleared: boolean; nextDueAt: number };
}

export const CLEAN_TO_CLEAR = 3;
export const REVIEW_LADDER_MS = [10 * 60_000, 3 * 86_400_000, 7 * 86_400_000];
export const MAX_ACTIVE = 60;
export const VARIATIONS = 3;

/* ---------- safe evaluation of "(5 × 8) − 12" style layouts (no eval) ---------- */
export function evalLayout(layout: string): number | undefined {
  const s = layout.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\s+/g, '');
  if (!s || !/^[\d+\-*/().]+$/.test(s)) return undefined;
  let i = 0;
  const peek = () => s[i]; const next = () => s[i++];
  const num = (): number => { const j = i; while (i < s.length && /[\d.]/.test(s[i])) i++; return Number(s.slice(j, i)); };
  const factor = (): number => { if (peek() === '(') { next(); const v = expr(); if (peek() === ')') next(); return v; } if (peek() === '-') { next(); return -factor(); } return num(); };
  const term = (): number => { let v = factor(); while (peek() === '*' || peek() === '/') { const op = next(); const r = factor(); v = op === '*' ? v * r : v / r; } return v; };
  const expr = (): number => { let v = term(); while (peek() === '+' || peek() === '-') { const op = next(); const r = term(); v = op === '+' ? v + r : v - r; } return v; };
  const v = expr();
  return i === s.length && Number.isFinite(v) ? v : undefined;
}

/** What kind of mistake was this? Compares the given answer with the right one and with common wrong routes. */
export function classify(q: Question, given: string, timedOut = false): ErrorKind {
  const g = given.trim();
  if (timedOut) return 'timeout';
  if (!g) return 'blank';
  const n = Number(g.replace(/,/g, '').match(/-?\d+(\.\d+)?/)?.[0]);
  if (q.word) {
    if (q.word.distractors.some((d) => d === g)) return 'operation';
    if (Number.isFinite(n) && q.word.distractors.some((d) => evalLayout(d) === n)) return 'operation';
  }
  if (!Number.isFinite(n)) return 'unknown';
  const m = /^(\d+) ([×÷+−]) (\d+) = \?$/.exec(q.expression);
  if (m) {
    const a = Number(m[1]); const b = Number(m[3]); const op = m[2];
    const others: Record<string, number[]> = { '×': [a + b, a - b, b - a], '÷': [a * b, a - b, a + b], '+': [a * b, a - b, b - a], '−': [a + b, a * b, b - a] };
    if ((others[op] ?? []).includes(n) && n !== q.answer) return 'operation';
    if (op === '×' && [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b].includes(n)) return 'arithmetic';
  }
  const diff = Math.abs(n - q.answer);
  if (diff > 0 && (diff <= 2 || diff === 10 || diff === 100 || String(n).split('').sort().join('') === String(q.answer).split('').sort().join(''))) return 'arithmetic';
  return 'unknown';
}

const key = (q: Question) => `${q.masterySkillId}|${q.expression}|${q.prompt}`;

/** Record a miss. A repeat of an active card becomes a lapse instead of a new card. */
export function addMiss(book: NotebookEntry[], q: Question, given: string, context: AnswerContext, now: number, timedOut = false): NotebookEntry[] {
  const k = key(q);
  const existing = book.find((e) => !e.clearedAt && key(e.question) === k);
  if (existing) return book.map((e) => (e === existing ? { ...e, given, kind: classify(q, given, timedOut), clean: 0, lapses: e.lapses + 1, dueAt: now, lastAt: now } : e));
  const entry: NotebookEntry = { id: `nb-${now.toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`, createdAt: now, question: q, given, context, kind: classify(q, given, timedOut), clean: 0, dueAt: now, lapses: 0, lastAt: now, fixes: 0 };
  const active = book.filter((e) => !e.clearedAt).sort((a, b) => a.lastAt - b.lastAt).slice(-(MAX_ACTIVE - 1));
  const cleared = book.filter((e) => e.clearedAt).slice(-40);
  return [...active, ...cleared, entry];
}

export const activeEntries = (book: NotebookEntry[]) => book.filter((e) => !e.clearedAt).sort((a, b) => a.dueAt - b.dueAt);
export const dueEntries = (book: NotebookEntry[], now = Date.now()) => activeEntries(book).filter((e) => e.dueAt <= now);

const MENTAL_KIND: Record<string, MentalKind> = { 'Tens first': 'tens', 'Next ten': 'next10', 'Break apart': 'split', 'Round & compensate': 'round', 'Make a ten': 'make10', 'Count the distance': 'distance' };
const TRICK_KIND: Record<string, TrickKind> = { 'Multiply by 11': '11', 'Squares ending in 5': 'sq5', 'Same tens, units make 10': 'same10' };

/** Same structure, different surface: three variations. Then a twist that changes the structure. */
export function variantsFor(q: Question, rng: Rng = createRng()): { variations: Question[]; twist: Question } {
  const d = q.difficulty;
  const mult = q.factId ? parseMultFact(q.factId) : null;
  const div = q.factId ? parseDivFact(q.factId) : null;
  const bond = q.factId ? parseBondFact(q.factId) : null;
  const take = (make: () => Question, n: number) => {
    // Picture questions (volume) can share their wording and differ only in the picture, so the picture is part of the key.
    const keyOf = (c: Question) => c.expression + c.prompt + (c.visualFirst ? JSON.stringify(c.visual) : '');
    const out: Question[] = []; const seen = new Set<string>([keyOf(q)]);
    for (let i = 0; i < n * 8 && out.length < n; i++) { const c = make(); const k = keyOf(c); if (seen.has(k)) continue; seen.add(k); out.push(c); }
    return out;
  };

  if (mult) {
    const { a, b } = mult;
    const neighbours = [[a, b + 1], [a, b - 1], [a + 1, b], [a - 1, b], [a, b + 2], [a + 2, b]].filter(([x, y]) => x >= 1 && y >= 1 && x <= 12 && y <= 12 && !(x === a && y === b) && !(x === b && y === a));
    const variations = take(() => { const [x, y] = rng.pick(neighbours); return pureMultQuestion(x, y, rng); }, VARIATIONS);
    return { variations, twist: pureDivQuestion(a * b, rng.chance(0.5) ? a : b) };
  }
  if (div) {
    const { dividend, divisor } = div; const qn = dividend / divisor;
    const neighbours = [qn + 1, qn - 1, qn + 2, qn - 2, qn + 3].filter((x) => x >= 1 && x <= 12).map((x) => pureDivQuestion(x * divisor, divisor));
    return { variations: rng.shuffle(neighbours).slice(0, VARIATIONS), twist: pureMultQuestion(divisor, qn, rng) };
  }
  if (bond) {
    const t = bond.total;
    const parts = rng.shuffle(Array.from({ length: t - 1 }, (_, i) => i + 1).filter((p) => p !== bond.part && p !== t - bond.part)).slice(0, VARIATIONS);
    return { variations: parts.map((p) => bondQuestion(p, t, q.masterySkillId, rng.int(0, 2) as 0 | 1 | 2, true)), twist: bondQuestion(bond.part, t, q.masterySkillId, 2, true) };
  }
  if (q.word) {
    const kind = (q.word.ops.length > 1 ? 'twostep' : q.word.op) as WordKind;
    const same = () => { for (let i = 0; i < 25; i++) { const c = wordProblem(kind, d, rng); if (c.subtopic === q.subtopic) return c; } return wordProblem(kind, d, rng); };
    const variations = take(same, VARIATIONS);
    const twistKind: WordKind = q.word.ops.length > 1 ? q.word.op : d >= 3 ? 'twostep' : ({ add: 'sub', sub: 'add', mult: 'div', div: 'mult' } as Record<string, WordKind>)[q.word.op];
    return { variations, twist: wordProblem(twistKind, d, rng) };
  }
  if (q.topic === 'Mental addition & subtraction') {
    const kind = MENTAL_KIND[q.subtopic] ?? 'all';
    return { variations: take(() => mentalQuestion(kind, d, rng), VARIATIONS), twist: mentalQuestion('all', Math.min(6, d + 1) as Difficulty, rng) };
  }
  if (q.topic === 'Volume') {
    const kind = (VOLUME_KINDS.find((k) => k.label === q.subtopic)?.id ?? 'all') as VolumeKind;
    return { variations: take(() => volumeQuestion(kind, d, rng), VARIATIONS), twist: volumeQuestion('all', Math.min(6, d + 1) as Difficulty, rng) };
  }
  if (q.topic === 'Measurement') {
    const kind = (MEASURE_KINDS.find((k) => k.label === q.subtopic)?.id ?? MEASURE_KINDS.find((k) => q.masterySkillId === `measure.${k.id}`)?.id ?? 'all') as MeasureKind;
    return { variations: take(() => measureQuestion(kind, d, rng), VARIATIONS), twist: measureQuestion('all', Math.min(6, d + 1) as Difficulty, rng) };
  }
  const pg = pictureGameForTopic(q.topic);
  if (pg) {
    const kind = pg.kinds.find((k) => k.label === q.subtopic)?.id ?? pg.kinds.find((k) => q.masterySkillId === `${pg.skill}.${k.id}`)?.id ?? 'all';
    return { variations: take(() => pg.question(kind, d, rng), VARIATIONS), twist: pg.question('all', Math.min(6, d + 1) as Difficulty, rng) };
  }
  if (q.topic === 'Math tricks') {
    const kind = TRICK_KIND[q.subtopic] ?? 'all';
    return { variations: take(() => trickQuestion(kind, d, rng), VARIATIONS), twist: trickQuestion('all', Math.min(6, d + 1) as Difficulty, rng) };
  }
  if (hasGenerator(q.masterySkillId)) {
    const gen = () => generateQuestion(q.masterySkillId, {}, { rng, difficulty: d });
    return { variations: take(gen, VARIATIONS), twist: generateQuestion(q.masterySkillId, {}, { rng, difficulty: Math.min(6, d + 1) as Difficulty }) };
  }
  return { variations: [], twist: q };
}

/** Start fixing a card: the original, three variations, one twist. */
export function startRun(entry: NotebookEntry, now = Date.now(), rng: Rng = createRng()): NotebookRun {
  const { variations, twist } = variantsFor(entry.question, rng);
  return { entryId: entry.id, questions: [entry.question, ...variations, twist], index: 0, attempts: 0, results: [], questionStartedAt: now, status: 'active' };
}

export function runAnswer(r: NotebookRun, correct: boolean): NotebookRun {
  if (r.status !== 'active' || r.feedback) return r;
  const q = r.questions[r.index];
  const first = r.attempts === 0;
  const results = first ? [...r.results, correct] : r.results;
  const text = correct ? (first ? 'Clean.' : 'Got it this time.') : first ? `Not yet. ${q.hint}` : `Answer: ${answerLabel(q)}. ${q.solutionSteps.join(' ')}`;
  return { ...r, attempts: r.attempts + 1, results, feedback: { correct, text } };
}

export function runNext(r: NotebookRun, now = Date.now()): NotebookRun {
  if (r.status !== 'active') return r;
  if (r.feedback && !r.feedback.correct && r.attempts < 2) return { ...r, feedback: undefined, questionStartedAt: now };
  if (r.index + 1 >= r.questions.length) return { ...r, status: 'finished', feedback: undefined };
  return { ...r, index: r.index + 1, attempts: 0, feedback: undefined, questionStartedAt: now };
}

/** A fix is clean when the original and all its variations were right first time (the twist may be wrong). */
export function isCleanFix(r: NotebookRun): boolean {
  const core = r.results.slice(0, r.questions.length - 1);
  return core.length > 0 && core.every(Boolean);
}

/** Apply a finished run to the notebook card. */
export function applyRun(book: NotebookEntry[], r: NotebookRun, now = Date.now()): { book: NotebookEntry[]; outcome: NonNullable<NotebookRun['outcome']> } {
  const clean = isCleanFix(r);
  let outcome: NonNullable<NotebookRun['outcome']> = { clean, cleared: false, nextDueAt: now + REVIEW_LADDER_MS[0] };
  const next = book.map((e) => {
    if (e.id !== r.entryId) return e;
    if (!clean) { outcome = { clean: false, cleared: false, nextDueAt: now + REVIEW_LADDER_MS[0] }; return { ...e, clean: 0, lapses: e.lapses + 1, fixes: e.fixes + 1, dueAt: now + REVIEW_LADDER_MS[0], lastAt: now }; }
    const cleanCount = e.clean + 1;
    if (cleanCount >= CLEAN_TO_CLEAR) { outcome = { clean: true, cleared: true, nextDueAt: 0 }; return { ...e, clean: cleanCount, fixes: e.fixes + 1, clearedAt: now, lastAt: now }; }
    const dueAt = now + REVIEW_LADDER_MS[Math.min(REVIEW_LADDER_MS.length - 1, cleanCount)];
    outcome = { clean: true, cleared: false, nextDueAt: dueAt };
    return { ...e, clean: cleanCount, fixes: e.fixes + 1, dueAt, lastAt: now };
  });
  return { book: next, outcome };
}
