import type { Difficulty, MasteryRecord, Question } from '../types';
import { createRng, type Rng } from '../rng';
import type { ArcadeGame } from '../state/types';
import type { Action } from '../state/actions';
import { PICTURE_GAMES, CONTEST_GAME_IDS } from '../questions/games';
import { parseSelection } from '../state/arcade';
import { generateQuestion, generateFromSkills, answerLabel } from '../questions';
import { GRADE_DIFFICULTY, gradeOf, type GradeId } from './common';
import { CONTEST_KIND_GRADES, arcadeAllowed, violatesCaps } from './grades';
import { CONTEST_LESSONS } from '../../content/contest';
import { LABELED } from '../label';
import { STORY_KIND_GRADES, STORY_KIND_IDS, storyQuestion, type StoryKind } from './stories';
import { FOCUS, themeForDay } from './plan';
import { buildMock, mockTally, MOCK_MS } from './mock';
import type { ContestHistoryEntry, ContestRun, ContestState, ItemResult, RunItem, RunMode, TeachCard, ThemeId } from './state';

/**
 * THE CONTEST PATH TRACK: the daily session (Warm → Teach → Mixed play → Victory + a Notebook glance), the 3-item
 * preview of the next grade, and the run engine (answers, retries, Skip & come back, the consent clock, calm and
 * timed minutes). Pure functions over ContestState; the reducer only adds mastery recording.
 *
 * Every item is drawn from a (game, kind, difficulty) the grade may use (CONTEST_KIND_GRADES, GRADE_ARCADE) and
 * redrawn until violatesCaps(grade, …) is null, so Grade 1 never meets a percent or a number over 20.
 */

/* ------------------------------------------------------------------ */
/* Session shape                                                       */
/* ------------------------------------------------------------------ */

export const SESSION_SHAPE: Record<GradeId, { warm: number; play: number }> = { g1: { warm: 2, play: 5 }, g3: { warm: 3, play: 7 }, g5: { warm: 3, play: 8 } };
/** Sunday is a rest day: "Play a short one anyway" is one warm-up and three puzzles, no teach card and no clock. */
export const REST_SHAPE = { warm: 1, play: 3 };
/** Variety: one (game, kind) at most twice a session, and no game more than this many times (while others can be drawn). */
export const KIND_CAP = 2;
export const GAME_CAP: Record<GradeId, number> = { g1: 3, g3: 4, g5: 4 };
export const PREVIEW_ITEMS = 3;
/** Grade 3: the clock is offered (never imposed) before the last 4 items, about 90 seconds each. */
export const G3_CLOCK_ITEMS = 4;
export const G3_CLOCK_MS = 6 * 60_000;
/** Time away from the screen beyond this between two taps is not counted as practice. */
const IDLE_CAP_MS = 120_000;
export const nextGrade = (g: GradeId): GradeId | null => (g === 'g1' ? 'g3' : g === 'g3' ? 'g5' : null);
export const LOGIC_QUEST_URL = 'https://chiokebuckley-art.github.io/logic-quest/';

export type Pick = [game: string, kind: string];
const P = (s: string): Pick[] => s.split(' ').map((x) => x.split(':') as Pick);
/** What each day's theme draws from (each pick is filtered by the grade's allow lists). */
export const THEME_POOLS: Record<'number' | 'picture' | 'stories' | 'logic', Pick[]> = {
  number: P('pattern:number pattern:machine pattern:term pattern:grow pctmulti:outof100 pctmulti:discounttax pctmulti:twosteps pctmulti:pctofpct pctmulti:updown stories:join stories:leave stories:match add:20 sub:20 bonds:10 bonds:20 mental:all word:twostep frac:equiv frac:addsame ratio:table data:pie rates:ratio'),
  picture: P('blocks:count blocks:hidden blocks:layers blocks:fill blocks:painted grid:mirror grid:lines grid:area grid:perimeter grid:tangram pattern:shapes pattern:grow stories:match volume:cubes geo:angles'),
  stories: P('stories:join stories:leave stories:compare stories:parts paths:outfits paths:menus paths:orders data:picto pctmulti:twosteps pctmulti:discounttax word:twostep word:mult word:div ratio:ppw rates:ratio'),
  logic: P('logic:truefalse logic:grid logic:order logic:mustmight logic:liar paths:outfits paths:grid paths:orders paths:pairs data:venn stories:compare prob:count blocks:count data:picto stories:parts'),
};
const ALL_CONTEST: Pick[] = [
  ...CONTEST_GAME_IDS.flatMap((g) => Object.keys(CONTEST_KIND_GRADES[g] ?? {}).map((k) => [g, k] as Pick)),
  ...STORY_KIND_IDS.map((k) => ['stories', k] as Pick),
];
export function poolFor(theme: ThemeId): Pick[] {
  return theme === 'number' || theme === 'picture' || theme === 'stories' || theme === 'logic' ? THEME_POOLS[theme] : ALL_CONTEST;
}
/** Grade 1 meets only these existing Arcade games in the track (short, whole-number, tap-friendly). */
const G1_ARCADE = new Set(['add', 'sub', 'bonds', 'volume']);
/**
 * Arcade picks that only make sense for some grades: sums to 20 are too small a step for Grades 3 and 5, and the
 * fraction and ratio generators play one fixed level (Grade 3), whatever difficulty is asked for.
 */
const ONLY_FOR: Record<string, GradeId[]> = {
  'add:20': ['g1'], 'sub:20': ['g1'], 'bonds:10': ['g1'], 'bonds:20': ['g1'], 'volume:cubes': ['g1', 'g3'],
  'frac:equiv': ['g3'], 'frac:addsame': ['g3'], 'ratio:table': ['g3'], 'ratio:ppw': ['g3'],
};
const isContestGame = (game: string) => (CONTEST_GAME_IDS as readonly string[]).includes(game) || game === 'stories';

/** May this grade's track use this (game, kind)? */
export function kindAllowed(grade: GradeId, game: string, kind: string): boolean {
  if (game === 'stories') return STORY_KIND_GRADES[kind]?.includes(grade) ?? false;
  const kg = CONTEST_KIND_GRADES[game];
  if (kg) return kg[kind]?.includes(grade) ?? false;
  if (grade === 'g1' && !G1_ARCADE.has(game)) return false;
  if (ONLY_FOR[`${game}:${kind}`] && !ONLY_FOR[`${game}:${kind}`].includes(grade)) return false;
  return arcadeAllowed(grade, game as ArcadeGame, kind);
}

/* ------------------------------------------------------------------ */
/* Drawing one item                                                    */
/* ------------------------------------------------------------------ */

/** A question for (game, kind) at difficulty d, from the game's own generator. May throw for an unknown kind. */
export function drawItem(game: string, kind: string, d: Difficulty, rng: Rng): Question {
  if (game === 'stories') return storyQuestion(kind as StoryKind, d, rng);
  const pg = PICTURE_GAMES[game];
  if (pg && pg.kinds.some((k) => k.id === kind)) return pg.question(kind, d, rng);
  const sel = parseSelection(game as ArcadeGame, `${game}:${kind}`);
  const opts = { rng, difficulty: d, recentFacts: [], now: 0 };
  return sel.facts.length || sel.skillIds.length !== 1 ? generateFromSkills(sel.skillIds, {}, opts) : generateQuestion(sel.skillIds[0], {}, opts);
}

const NUMBERS = /\d[\d,]*(?:\.\d+)?/g;
const GRADE_INDEX: Record<GradeId, number> = { g1: 0, g3: 1, g5: 2 };
const texts = (q: Question) => [q.prompt, q.expression, q.hint, ...q.solutionSteps, ...q.explanation, q.readAloud ?? '', ...(q.choices ?? []).map((c) => c.label)];
const wordsPerSentence = (s: string) => s.split(/[.?!]/).map((x) => x.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length);

/** Why this question does not fit the grade's track (null = it fits). */
export function fitsGrade(grade: GradeId, game: string, q: Question): string | null {
  if (!Number.isFinite(q.answer)) return 'answer is not a number';
  if (texts(q).some((t) => /undefined|NaN|\bAMC\b/.test(t))) return 'broken text';
  if (q.choices) {
    const vals = q.choices.map((c) => c.value);
    if (vals.length < 2 || vals.length > 5 || new Set(vals).size !== vals.length || !vals.some((v) => Math.abs(v - q.answer) < 1e-9)) return 'bad choices';
  }
  const caps = violatesCaps(grade, { ...q, game });
  if (caps) return caps;
  // Some generators ignore the difficulty asked for: an item pitched below the grade's band does not count as practice.
  if (GRADE_INDEX[gradeOf(q.difficulty)] < GRADE_INDEX[grade]) return 'below the grade band';
  if (grade === 'g1') {
    // Grade 1: numbers to 20 and no percent everywhere a child can read, whole-number answers, short sentences.
    const all = texts(q).join(' ');
    if (/%|percent/i.test(all)) return 'percent in the working';
    const big = [...all.matchAll(NUMBERS)].map((m) => Number(m[0].replace(/,/g, ''))).find((n) => n > 20);
    if (big !== undefined) return `number ${big} in the working`;
    if (!Number.isInteger(q.answer) || q.answer < 0) return 'not a whole number';
    if (game === 'bonds' && q.answer === 0) return 'an empty bond';
    if (!isContestGame(game) && Math.max(...wordsPerSentence(q.prompt)) > 14) return 'sentence too long';
  }
  return null;
}

/** Sum symbols as spoken words ("9 − 3" → "9 minus 3"). */
const sayOps = (s: string) => s.replace(/\s*\+\s*/g, ' plus ').replace(/\s*[−-]\s*/g, ' minus ').replace(/\s*×\s*/g, ' times ').replace(/\s*÷\s*/g, ' divided by ').replace(/\s+/g, ' ').trim();
/**
 * The plain spoken question for the speaker button: the generator's own words when it has them, the story for a
 * word question, and a sum said in words ("What is 9 minus 3?", "What number plus 5 makes 12?") for a bare sum.
 */
export function spokenQuestion(q: Question): string {
  if (q.readAloud) return q.readAloud;
  if (q.mode === 'applied') return q.prompt;
  const lead = /^(compute|work out|solve|find)\b/i.test(q.prompt.trim()) ? '' : `${q.prompt.trim()} `;
  const m = /^(.*?)\s*=\s*\?\s*$/.exec(q.expression);
  if (m && !m[1].includes('?')) return `${lead}What is ${sayOps(m[1])}?`;
  const blank = /^(.*?)\s*=\s*(.+)$/.exec(q.expression);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  if (blank && blank[1].includes('?') && !blank[2].includes('?')) return `${lead}${cap(sayOps(blank[1].replace('?', 'what number')))} makes ${sayOps(blank[2])}?`;
  return `${lead}${sayOps(q.expression.replace(/\?/g, 'what'))}`.trim();
}

/**
 * A teach card's words as the speaker should say them: a number's label is said as plain words after it ("3 (red
 * apples)" → "3 red apples"), and capitals used for stress ("CAN'T TELL") are said as ordinary words.
 */
export function speakable(text: string): string {
  return text
    .replace(new RegExp(LABELED.source, 'g'), '$1 $2')
    .replace(/\b[A-Z]{2,}(?:'[A-Z]+)?\b/g, (w) => w.toLowerCase())
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Young-player extras: tap choices where a whole-number answer has none (the answer, one either side, then two up or
 * down; 0 is a fair answer too), and the question in plain spoken words.
 */
function forYoung(q: Question, rng: Rng, max: number): Question {
  let choices = q.choices;
  if (!choices?.length && Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= max) {
    const wrong = [q.answer + 1, q.answer - 1, q.answer + 2, q.answer - 2].filter((v) => v >= 0 && v <= max && v !== q.answer).slice(0, 2);
    choices = rng.shuffle([q.answer, ...wrong]).map((v) => ({ value: v, label: String(v) }));
  }
  return { ...q, choices, readAloud: spokenQuestion(q) };
}
/** A Grade 1 child peeking at Grade 3: no percent at all, and numbers to 100. */
export const YOUNG_PREVIEW_MAX = 100;
function fitsYoungPreview(q: Question): string | null {
  const all = texts(q).join(' ');
  if (/%|percent/i.test(all)) return 'percent in a Grade 1 preview';
  if ([...all.matchAll(NUMBERS)].some((m) => Number(m[0].replace(/,/g, '')) > YOUNG_PREVIEW_MAX)) return 'number over 100 in a Grade 1 preview';
  return null;
}

const keyOf = (q: Question) => `${q.prompt}|${q.expression}|${JSON.stringify(q.visual)}`;

/**
 * A question for (game, kind, d) that fits the grade, redrawn up to `tries` times (null if none fits). `seen` keeps
 * a session from asking the same question twice. `home` is the player's own grade when it differs (a preview): a
 * Grade 1 child previewing Grade 3 gets no percent, numbers to 100, tap choices and read-aloud words.
 */
export function drawCapped(grade: GradeId, game: string, kind: string, d: Difficulty, rng: Rng, seen?: Set<string>, tries = 12, home: GradeId = grade): Question | null {
  const young = home === 'g1' && grade !== 'g1';
  for (let t = 0; t < tries; t++) {
    let q: Question;
    try { q = drawItem(game, kind, d, rng); } catch { return null; }
    if (grade === 'g1') q = forYoung(q, rng, 20);
    else if (young) q = forYoung(q, rng, YOUNG_PREVIEW_MAX);
    if (fitsGrade(grade, game, q) || (young && fitsYoungPreview(q))) continue;
    const k = keyOf(q);
    if (seen?.has(k)) continue;
    seen?.add(k);
    return q;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Building a session                                                  */
/* ------------------------------------------------------------------ */

function weightedPick<T>(rng: Rng, items: T[], w: (t: T) => number): T {
  const ws = items.map((x) => Math.max(0.01, w(x)));
  let x = rng.next() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) { x -= ws[i]; if (x < 0) return items[i]; }
  return items[items.length - 1];
}
/** The mastery record a pick feeds (game.kind for the contest games and stories, the Arcade skill otherwise). */
function skillOf(game: string, kind: string): string {
  if (isContestGame(game)) return `${game}.${kind}`;
  try { return parseSelection(game as ArcadeGame, `${game}:${kind}`).skillIds[0] ?? game; } catch { return game; }
}

/**
 * The teach card: the worked 'say' steps (with pictures) of the focus game's lesson that sit just before the first
 * Try pitched at this grade (or the nearest grade). No lesson yet: one picture puzzle, solved step by step.
 */
export function teachCard(grade: GradeId, focus: string, rng: Rng): TeachCard | null {
  // Every worked example whose try suits the grade best; one is picked, so a grade does not always get the same card.
  let ties: { id: string; title: string; says: TeachCard['steps']; dist: number }[] = [];
  for (const l of CONTEST_LESSONS.filter((x) => x.id.startsWith(`l.${focus}-`))) {
    let says: TeachCard['steps'] = [];
    for (const st of l.steps) {
      if (st.type === 'say') { if (st.visual) says.push({ speaker: st.speaker, text: st.text, visual: st.visual, caption: st.caption }); continue; }
      if (st.type === 'try' && says.length) {
        const dist = Math.abs(GRADE_INDEX[gradeOf(st.difficulty)] - GRADE_INDEX[grade]);
        const cand = { id: l.id, title: l.title, says: says.slice(-2), dist };
        if (!ties.length || dist < ties[0].dist) ties = [cand]; else if (dist === ties[0].dist) ties.push(cand);
      }
      says = [];
    }
  }
  const best = ties.length ? rng.pick(ties) : null;
  if (best) return { lessonId: best.id, title: best.title, game: focus, steps: best.says };
  const kinds = Object.keys(CONTEST_KIND_GRADES[focus] ?? {}).filter((k) => kindAllowed(grade, focus, k));
  for (const k of kinds) {
    const q = drawCapped(grade, focus, k, GRADE_DIFFICULTY[grade][0], rng);
    if (!q) continue;
    return {
      title: 'A picture puzzle', game: focus,
      steps: [
        { speaker: 'vector', text: `Let's solve one together. ${q.prompt}`, visual: q.visual, caption: q.expression },
        { speaker: 'vector', text: q.solutionSteps.join(' '), visual: q.solutionVisual ?? q.visual, caption: 'Worked out' },
      ],
    };
  }
  return null;
}

export interface SessionPlan { grade: GradeId; day: number; theme: ThemeId; focus: string; warm: RunItem[]; teach: TeachCard | null; play: RunItem[] }

/**
 * Today's session for a grade: Warm (2–3 items at the easy end of the band, not yet the focus game) → one teach card
 * for the day's focus game → Mixed play (5–8 items, easy half first, at least two from the focus game, a picture story
 * for Grade 1). Variety: a (game, kind) comes up at most KIND_CAP times and a game at most GAME_CAP times while
 * anything else can be drawn; a thin day pool is topped up from the grade's other contest kinds. Sunday (rest) is a
 * short one: REST_SHAPE, no teach card. Weaker and newer kinds are drawn a little more often when `mastery` is given.
 * Deterministic for a given rng.
 */
export function buildSession(grade: GradeId, day: number, rng: Rng, mastery: Record<string, MasteryRecord> = {}): SessionPlan {
  const dayTheme = themeForDay(day).id;
  const rest = dayTheme === 'rest';
  const theme: ThemeId = dayTheme === 'play' || rest ? 'mix' : dayTheme;
  const focus = FOCUS[theme][grade];
  const [lo, hi] = GRADE_DIFFICULTY[grade];
  const allowed = ([g, k]: Pick) => kindAllowed(grade, g, k);
  const pool = poolFor(theme).filter(allowed);
  const wide = ALL_CONTEST.filter(allowed);
  const seen = new Set<string>();
  const kindN: Record<string, number> = {};
  const gameN: Record<string, number> = {};
  const failed = new Set<string>();
  const id = ([g, k]: Pick) => `${g}:${k}`;
  const weight = (p: Pick) => {
    const rec = mastery[skillOf(p[0], p[1])];
    const base = rec ? 1 + (100 - Math.min(100, rec.mastery)) / 50 : 2;
    return (base * (p[0] === focus ? 2 : 1) * (isContestGame(p[0]) ? 1.5 : 1)) / (1 + 2 * (kindN[id(p)] ?? 0));
  };
  const underKind = (p: Pick) => (kindN[id(p)] ?? 0) < KIND_CAP;
  const underGame = (p: Pick) => (gameN[p[0]] ?? 0) < GAME_CAP[grade];
  /** Candidates, most varied first: the day's pool within both caps, then within the kind cap, then the wider pool. */
  const candidates = (only?: (p: Pick) => boolean): Pick[] => {
    const ok = (p: Pick) => !failed.has(id(p)) && (!only || only(p));
    const tiers: Pick[][] = [
      pool.filter((p) => ok(p) && underKind(p) && underGame(p)),
      pool.filter((p) => ok(p) && underKind(p)),
      ...(only ? [] : [wide.filter((p) => ok(p) && underKind(p) && underGame(p)), wide.filter((p) => ok(p) && underKind(p)), pool.filter(ok), wide.filter(ok)]),
    ];
    return tiers.find((t) => t.length) ?? [];
  };
  const one = (section: RunItem['section'], d: Difficulty, only?: (p: Pick) => boolean): RunItem | null => {
    for (let t = 0; t < 10; t++) {
      const from = candidates(only);
      if (!from.length) return null;
      const p = weightedPick(rng, from, weight);
      const q = drawCapped(grade, p[0], p[1], d, rng, seen);
      if (!q) { failed.add(id(p)); continue; }
      kindN[id(p)] = (kindN[id(p)] ?? 0) + 1;
      gameN[p[0]] = (gameN[p[0]] ?? 0) + 1;
      return { key: `${p[0]}:${p[1]}@d${d}`, game: p[0], kind: p[1], section, question: q };
    }
    return null;
  };
  const shape = rest ? REST_SHAPE : SESSION_SHAPE[grade];
  const focusPick = ([g]: Pick) => g === focus;
  const warm: RunItem[] = [];
  for (let i = 0; i < shape.warm; i++) {
    // Grade 1 number day warms up with a quick sum; everyone else with the day's pictures. The focus game waits for its teach card.
    const it = (grade === 'g1' && theme === 'number' && i === 0 ? one('warm', lo, ([g]) => !isContestGame(g)) : null) ?? one('warm', lo, (p) => !focusPick(p)) ?? one('warm', lo);
    if (it) warm.push(it);
  }
  const play: RunItem[] = [];
  /** The play slots kept for the focus game (none on a rest day: no teach card to follow up). */
  const forced = rest ? [] : [0, 2];
  for (let i = 0; i < shape.play; i++) {
    const d = i < Math.ceil(shape.play / 2) ? lo : hi;
    const it = (forced.includes(i) ? one('play', d, focusPick) : null) ?? one('play', d);
    if (it) play.push(it);
  }
  if (grade === 'g1' && ![...warm, ...play].some((x) => x.game === 'stories')) {
    const story = one('play', lo, ([g]) => g === 'stories') ?? (() => { const q = drawCapped('g1', 'stories', 'join', 1, rng, seen); return q ? { key: 'stories:join@d1', game: 'stories', kind: 'join', section: 'play' as const, question: q } : null; })();
    if (story) {
      // The story takes the place of a free play slot (a repeated kind first), so the session keeps its size.
      const free = play.map((_, i) => i).filter((i) => !forced.includes(i) && play[i].game !== focus);
      const repeat = free.filter((i) => play.filter((x) => x.game === play[i].game && x.kind === play[i].kind).length > 1);
      const at = repeat.length ? repeat[repeat.length - 1] : free.length ? free[free.length - 1] : play.length - 1;
      if (at >= 0) play[at] = story; else play.push(story);
    }
  }
  return { grade, day, theme: dayTheme, focus, warm, teach: rest ? null : teachCard(grade, focus, rng), play };
}

/**
 * A 3-item peek at the next grade up (contest games only, the easy end of that grade's band). `home` is the player's
 * own grade: a Grade 1 child gets no percent game, numbers to 100, tap choices and read-aloud words.
 */
export function buildPreview(grade: GradeId, rng: Rng, home?: GradeId): RunItem[] {
  const young = home === 'g1';
  const pool = ALL_CONTEST.filter(([g, k]) => kindAllowed(grade, g, k) && !(young && g === 'pctmulti'));
  const seen = new Set<string>(); const out: RunItem[] = []; const games = new Set<string>();
  const d = GRADE_DIFFICULTY[grade][0];
  for (let t = 0; t < 40 && out.length < PREVIEW_ITEMS; t++) {
    const [g, k] = rng.pick(pool);
    if (games.has(g)) continue;
    const q = drawCapped(grade, g, k, d, rng, seen, 12, home ?? grade);
    if (q) { games.add(g); out.push({ key: `${g}:${k}@d${d}`, game: g, kind: k, section: 'play', question: q }); }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* The run engine                                                      */
/* ------------------------------------------------------------------ */

const tick = (r: ContestRun, now: number): ContestRun => {
  const dt = Math.min(Math.max(0, now - r.lastAt), IDLE_CAP_MS);
  return r.clock.state === 'on' ? { ...r, timedMs: r.timedMs + dt, lastAt: now } : { ...r, calmMs: r.calmMs + dt, lastAt: now };
};
/** Where the run goes once an item or the teach card is done. */
function settle(r: ContestRun, now: number): ContestRun {
  if (!r.queue.length) return { ...r, phase: 'over', finishedAt: r.finishedAt ?? now };
  const done = r.items.length - r.queue.length;
  if (r.teach && !r.teachSeen && done >= r.teachAt) return { ...r, phase: 'teach' };
  if (r.clock.state === 'off' && r.clock.offerAt > 0 && r.queue.length <= r.clock.offerAt) return { ...r, phase: 'consent', clock: { ...r.clock, state: 'offered' } };
  return { ...r, phase: 'play' };
}

export function newRun(o: { mode: RunMode; grade: GradeId; home: GradeId; day: number; date: string; theme: ThemeId; focus: string; items: RunItem[]; teach: TeachCard | null; teachAt: number; clock: { offerAt: number; ms: number } }, now: number): ContestRun {
  return settle({
    v: 1, id: `ct-${now.toString(36)}`, mode: o.mode, grade: o.grade, home: o.home, day: o.day, date: o.date, theme: o.theme, focus: o.focus,
    items: o.items, teach: o.teach, teachAt: o.teachAt, teachSeen: false, teachStep: 0,
    queue: o.items.map((_, i) => i), flagged: [], results: {}, phase: 'play', attempts: 0, hintShown: false, showExplanation: false,
    questionStartedAt: now, startedAt: now, lastAt: now, clock: { state: 'off', ms: o.clock.ms, offerAt: o.clock.offerAt }, calmMs: 0, timedMs: 0,
  }, now);
}

const dateKey = (now: number) => { const d = new Date(now); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** A run that is still going (paused or not): starting something new would throw it away. */
export const runWaiting = (c: ContestState): ContestRun | null => (c.run && c.run.phase !== 'over' ? c.run : null);

/**
 * Start a session, a preview of the next grade, or the Grade 5 mini-mock. Nothing happens without a grade, and an
 * unfinished run is never quietly replaced: the player resumes it or ends it first (`replace` overrides).
 */
export function startContest(c: ContestState, mode: RunMode, day: number, mastery: Record<string, MasteryRecord>, now: number, seed: number, replace = false): ContestState {
  const grade = c.grade;
  if (!grade) return c;
  if (runWaiting(c) && !replace) return c;
  const rng = createRng(seed >>> 0);
  const date = dateKey(now);
  if (mode === 'preview') {
    const g = nextGrade(grade);
    if (!g) return c;
    const items = buildPreview(g, rng, grade);
    if (!items.length) return c;
    return { ...c, run: newRun({ mode, grade: g, home: grade, day, date, theme: themeForDay(day).id, focus: items[0].game, items, teach: null, teachAt: 0, clock: { offerAt: 0, ms: 0 } }, now) };
  }
  if (mode === 'mock') {
    if (grade !== 'g5') return c;
    const items = buildMock(rng, (g, k, d, r, seen) => drawCapped('g5', g, k, d, r, seen));
    if (!items.length) return c;
    return { ...c, run: newRun({ mode, grade, home: grade, day, date, theme: themeForDay(day).id, focus: 'mock', items, teach: null, teachAt: 0, clock: { offerAt: items.length, ms: MOCK_MS } }, now) };
  }
  const p = buildSession(grade, day, rng, mastery);
  const items = [...p.warm, ...p.play];
  if (!items.length) return c;
  // The clock is offered only in a full Grade 3 session (never on the short rest-day one).
  const clock = grade === 'g3' && p.theme !== 'rest' ? { offerAt: G3_CLOCK_ITEMS, ms: G3_CLOCK_MS } : { offerAt: 0, ms: 0 };
  return { ...c, run: newRun({ mode, grade, home: grade, day, date, theme: p.theme, focus: p.focus, items, teach: p.teach, teachAt: p.warm.length, clock }, now) };
}

/** A new grade for this profile. A run from another grade is dropped, so a Grade 1 player never resumes a Grade 5 mock. */
export function contestSetGrade(c: ContestState, grade: GradeId | null): ContestState {
  return { ...c, grade, run: c.run && c.run.home !== grade ? null : c.run };
}

export const currentItem = (r: ContestRun): RunItem | undefined => r.items[r.queue[0]];
export const maxTries = (r: ContestRun) => (r.mode === 'mock' ? 1 : 2);
/** The right answer as a child reads it: a choice's label, else the number. */
export const answerText = (q: Question) => q.choices?.find((c) => Math.abs(c.value - q.answer) < 1e-9)?.label ?? answerLabel(q);
const PRAISE = ['Yes! Nice thinking.', 'Right! Good looking.', 'Got it. Calm and careful.', 'Yes! The picture helped.', 'Spot on.', 'Lovely working.'];

/** An answer to the current item: feedback, the item's result, and whether it was the first try (that one trains mastery). */
export function runAnswer(r: ContestRun, correct: boolean, now: number): { run: ContestRun; first: boolean; timeMs: number } {
  const i = r.queue[0]; const q = r.items[i].question;
  const timeMs = Math.max(200, now - r.questionStartedAt);
  const first = r.attempts === 0;
  const prev = r.results[i];
  const res: ItemResult = first || !prev ? { correct, firstTry: correct, tries: 1, timeMs, timed: r.clock.state === 'on' } : { ...prev, correct, tries: prev.tries + 1, timeMs: prev.timeMs + timeMs };
  const out = r.attempts + 1 >= maxTries(r);
  const text = correct
    ? (first ? PRAISE[i % PRAISE.length] : 'You fixed it. That is how it is done.')
    : out ? `${r.mode === 'mock' ? 'Not this one.' : 'Good try.'} The answer is ${answerText(q)}. Tap Show me how to see why.` : `Not yet. ${q.hint}`;
  return { run: tick({ ...r, attempts: r.attempts + 1, results: { ...r.results, [i]: res }, feedback: { correct, text } }, now), first, timeMs };
}

/** Next: try again after a first miss, else on to the next item (or the teach card, the clock offer, the end). */
export function runNext(r: ContestRun, now: number): ContestRun {
  if (r.phase !== 'play' || !r.feedback) return r;
  if (!r.feedback.correct && r.attempts < maxTries(r)) return tick({ ...r, feedback: undefined, showExplanation: false, hintShown: true, questionStartedAt: now }, now);
  const i = r.queue[0];
  return settle(tick({ ...r, queue: r.queue.slice(1), flagged: r.flagged.filter((x) => x !== i), attempts: 0, feedback: undefined, hintShown: false, showExplanation: false, questionStartedAt: now }, now), now);
}
/** Skip & come back (Grade 5 only, before answering): the item waits at the end of the queue with a flag. */
export function canSkip(r: ContestRun) { return (r.home === 'g5' || r.grade === 'g5') && r.mode !== 'preview' && r.phase === 'play' && !r.feedback && r.attempts === 0 && r.queue.length > 1; }
export function runSkip(r: ContestRun, now: number): ContestRun {
  if (!canSkip(r)) return r;
  const [i, ...rest] = r.queue;
  return tick({ ...r, queue: [...rest, i], flagged: r.flagged.includes(i) ? r.flagged : [...r.flagged, i], hintShown: false, showExplanation: false, questionStartedAt: now }, now);
}

export function runSummary(r: ContestRun) {
  const res = Object.values(r.results);
  const skills = Array.from(new Set(r.items.filter((_, i) => r.results[i]).map((it) => it.question.masterySkillId)));
  return { items: res.length, right: res.filter((x) => x.correct).length, firstTry: res.filter((x) => x.firstTry).length, calmMs: r.calmMs, timedMs: r.timedMs, skills };
}
function historyEntry(r: ContestRun, now: number): ContestHistoryEntry {
  const s = runSummary(r);
  return { at: r.finishedAt ?? now, date: r.date, grade: r.home, mode: r.mode, theme: r.theme, ...s, mock: r.mode === 'mock' ? mockTally(r) : undefined };
}

export type ContestAction = Extract<Action, { type: 'CONTEST_NEXT' | 'CONTEST_HINT' | 'CONTEST_EXPLAIN' | 'CONTEST_SKIP' | 'CONTEST_CLOCK' | 'CONTEST_TEACH_NEXT' | 'CONTEST_PAUSE' | 'CONTEST_RESUME' | 'CONTEST_QUIT' | 'CONTEST_CLOSE' }>;
/** Every run action except starting and answering. A run that just finished is written to history once. */
export function contestReduce(c: ContestState, a: ContestAction, now: number): ContestState {
  const r = c.run;
  if (!r) return c;
  let nr: ContestRun | null = r;
  switch (a.type) {
    case 'CONTEST_NEXT': nr = r.paused ? r : runNext(r, now); break;
    case 'CONTEST_HINT': nr = r.phase === 'play' && !r.feedback && r.mode !== 'mock' ? { ...r, hintShown: true } : r; break;
    // The mini-mock is test-like (one try, no hints): its worked answer opens only after the item is answered.
    case 'CONTEST_EXPLAIN': nr = r.mode === 'mock' && !r.feedback ? r : { ...r, showExplanation: !r.showExplanation }; break;
    case 'CONTEST_SKIP': nr = runSkip(r, now); break;
    case 'CONTEST_CLOCK':
      if (r.phase === 'consent') nr = settle({ ...tick(r, now), clock: { ...r.clock, state: a.accept ? 'on' : 'declined', startedAt: a.accept ? now : undefined }, questionStartedAt: now }, now);
      break;
    case 'CONTEST_TEACH_NEXT':
      if (r.phase !== 'teach' || !r.teach) break;
      nr = r.teachStep + 1 < r.teach.steps.length ? { ...tick(r, now), teachStep: r.teachStep + 1 } : settle({ ...tick(r, now), teachSeen: true, questionStartedAt: now }, now);
      break;
    case 'CONTEST_PAUSE': nr = { ...tick(r, now), paused: true }; break;
    case 'CONTEST_RESUME': {
      // A run from another grade (an old save) is not resumed on this one.
      if (r.home !== c.grade) { nr = null; break; }
      // The consent clock waits while the run is paused: its start moves on by the time away.
      const away = Math.max(0, now - r.lastAt);
      const clock = r.clock.state === 'on' && r.clock.startedAt !== undefined ? { ...r.clock, startedAt: r.clock.startedAt + away } : r.clock;
      nr = { ...r, paused: false, lastAt: now, clock, questionStartedAt: r.feedback ? r.questionStartedAt : now };
      break;
    }
    case 'CONTEST_QUIT': nr = null; break;
    case 'CONTEST_CLOSE': nr = r.phase === 'over' ? null : r; break;
  }
  if (nr && nr.phase === 'over' && r.phase !== 'over') return { ...c, run: nr, history: [...c.history, historyEntry(nr, now)].slice(-300) };
  return { ...c, run: nr };
}
