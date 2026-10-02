import type { GameState, Screen, ArcadeGame } from '../engine/state/types';
import type { Action } from '../engine/state/actions';
import { ARCADE_GAMES, capGrade, gameOk } from './screens/ArcadeScreen';
import { ACADEMIES } from '../engine/academy/registry';
import { academyUnlocked } from '../engine/academy/AcademyEngine';
import { LESSONS } from '../content/lessons';
import { NPCS } from '../content/npcs';
import { REGIONS } from '../engine/curriculum/regions';
import { PICTURE_GAMES } from '../engine/questions/games';
import { dueEntries } from '../engine/notebook/notebook';

/** What kind of thing an item is. Colour = kind, everywhere. */
export type Kind = 'learn' | 'drill' | 'play' | 'friends' | 'quest' | 'fix' | 'me';
export const KIND_LABEL: Record<Kind, string> = { learn: 'Learn', drill: 'Drill', play: 'Play', friends: 'Friends', quest: 'Quest', fix: 'Fix', me: 'Me' };
/** Kinds that live in the Library grid. */
export const LIBRARY_KINDS: Kind[] = ['learn', 'drill', 'play', 'friends'];

/** Where tapping an item goes: a screen, or an action that starts something. */
export type Go = { screen: Screen; params?: Record<string, string> } | { action: Action };

export interface LibraryItem {
  id: string;
  name: string;
  kind: Kind;
  sub: string;
  icon: string;
  topics: TopicId[];
  go: Go;
  /** Shown in the Library grid (false: only found by search). */
  shelf: boolean;
  /** Played together: Friends shows it, and its set-up card offers rooms. */
  friends?: string;
  /** Why it can't be opened yet. */
  locked?: string;
  /** Extra words search matches. */
  words?: string;
}

/* ---------- topics ---------- */

export type TopicId = 'counting' | 'addsub' | 'mult' | 'div' | 'frac' | 'ratio' | 'measure' | 'geometry' | 'algebra' | 'word' | 'mental' | 'prob' | 'logic' | 'physics' | 'calc';

export interface Topic {
  id: TopicId;
  label: string;
  /** Skills whose mastery is this topic's mastery (sub-skills come from their components). */
  skills: string[];
  /** Region the topic's boss lives in, if any. */
  region?: string;
  teacher: string;
  world: string;
}

export const TOPICS: Topic[] = [
  { id: 'counting', label: 'Counting', skills: ['num.sense', 'bonds'], teacher: 'Professor Vector', world: 'Arithmetic' },
  { id: 'addsub', label: '+ −', skills: ['add.basic', 'sub.basic', 'mental'], teacher: 'Professor Vector', world: 'Arithmetic' },
  { id: 'mult', label: '× tables', skills: ['mult'], region: 'mines', teacher: 'Foreman Brick', world: 'Arithmetic' },
  { id: 'div', label: 'Division', skills: ['div'], region: 'division', teacher: 'Foreman Brick', world: 'Arithmetic' },
  { id: 'frac', label: 'Fractions', skills: ['frac'], region: 'fraction-forest', teacher: 'Professor Vector', world: 'Arithmetic' },
  { id: 'ratio', label: 'Ratios & %', skills: ['ratio', 'rates', 'pctmulti'], region: 'ratio-river', teacher: 'Dr. Catalyst', world: 'Arithmetic' },
  { id: 'measure', label: 'Measuring', skills: ['measure', 'volume', 'fit'], region: 'unit-factory', teacher: 'Mechanic Ada', world: 'Arithmetic' },
  { id: 'geometry', label: 'Geometry', skills: ['geo', 'grid', 'blocks'], region: 'geometry-kingdom', teacher: 'Professor Vector', world: 'Geometry' },
  { id: 'algebra', label: 'Algebra', skills: ['prealg.expressions', 'prealg.equations'], region: 'algebra-city', teacher: 'Professor Vector', world: 'Algebra' },
  { id: 'word', label: 'Word problems', skills: ['word'], teacher: 'Professor Vector', world: 'Arithmetic' },
  { id: 'mental', label: 'Mental math', skills: ['mm', 'mental', 'tricks'], teacher: 'Mechanic Ada', world: 'Arithmetic' },
  { id: 'prob', label: 'Probability', skills: ['prob', 'paths', 'data'], region: 'stats-station', teacher: 'Professor Newton', world: 'Statistics' },
  { id: 'logic', label: 'Patterns & logic', skills: ['pattern', 'logic'], teacher: 'Professor Vector', world: 'Arithmetic' },
  { id: 'physics', label: 'Forces & power', skills: ['phys', 'pipe'], teacher: 'Professor Newton', world: 'Engineering' },
  { id: 'calc', label: 'Calculus', skills: ['precalc'], region: 'calculus-frontier', teacher: 'Professor Newton', world: 'Calculus' },
];
export const topicById = (id: string) => TOPICS.find((t) => t.id === id);

/** Which topics each Arcade game feeds. */
const GAME_TOPICS: Record<ArcadeGame, TopicId[]> = {
  mult: ['mult'], div: ['div'], add: ['addsub'], sub: ['addsub'], bonds: ['counting', 'addsub'], alg: ['algebra'], word: ['word'], tricks: ['mental', 'mult'],
  mental: ['mental', 'addsub'], volume: ['measure', 'geometry'], measure: ['measure'], geo: ['geometry'], rates: ['ratio', 'measure'], fit: ['measure'], phys: ['physics'],
  pipe: ['physics', 'measure'], prob: ['prob'], spiral: ['mult', 'div'], precalc: ['calc', 'algebra'], mm: ['mental'], mixed: ['mult', 'div', 'addsub'], academy: [],
  frac: ['frac'], ratio: ['ratio'], pattern: ['logic', 'counting'], blocks: ['geometry'], paths: ['prob', 'counting'], data: ['prob'], logic: ['logic'], pctmulti: ['ratio'], grid: ['geometry'],
};

const ACADEMY_TOPICS: Record<string, TopicId[]> = {
  arithmetic: ['counting', 'addsub', 'mult', 'div', 'frac', 'ratio'], prealgebra: ['algebra'], algebra1: ['algebra'], geometry: ['geometry'], algebra2: ['algebra'],
  trig: ['geometry', 'calc'], precalc: ['calc'], calculus: ['calc'], linalg: ['algebra'], diffeq: ['calc', 'physics'],
};

/** A lesson's topics, from the skill it teaches. */
function skillTopics(skill: string): TopicId[] {
  const head = skill.split('.')[0];
  const t = TOPICS.filter((x) => x.skills.some((s) => s === skill || s.split('.')[0] === head)).map((x) => x.id);
  if (t.length) return t;
  if (head === 'trick') return ['mental'];
  if (head === 'prealg' || head === 'alg') return ['algebra'];
  if (head === 'add' || head === 'sub') return ['addsub'];
  return [];
}

/* ---------- the registry ---------- */

const nav = (screen: Screen, params?: Record<string, string>): Go => ({ screen, params });
const setup = (gameId: string): Go => ({ screen: 'setup', params: { game: gameId } });

/** Games that are not Arcade drills, with their set-up card ids. */
export const PLAY_GAMES: { id: string; name: string; sub: string; icon: string; screen: Screen; topics: TopicId[]; friends?: string; notFor?: ('g1' | 'g3')[] }[] = [
  { id: 'rocket', name: 'Rocket Game', sub: 'Steer to the answer, Earth to the Moon', icon: 'energy', screen: 'rocket', topics: ['mult', 'addsub'], notFor: ['g1'] },
  { id: 'versus', name: 'Naval Blitz', sub: 'Same questions, same moment', icon: 'target', screen: 'arcade', topics: ['mult', 'div', 'addsub'], friends: '2–6 · same moment', notFor: ['g1'] },
  { id: 'plaza', name: 'Equation Plaza', sub: 'Build connected equations', icon: 'abacus', screen: 'plaza', topics: ['addsub', 'mult', 'div'], friends: '2–4 · turns' },
  { id: 'tycoon', name: 'Engine City Tycoon', sub: 'Buy streets with maths', icon: 'factory', screen: 'tycoon', topics: ['addsub', 'mult', 'ratio'], friends: '2–6 · board' },
  { id: 'dice', name: 'Dice Workshop', sub: 'Roll, group and score', icon: 'gear', screen: 'dice', topics: ['addsub', 'mult', 'frac', 'ratio'], friends: '2–4 · one table' },
  { id: 'gear', name: 'Weakest Gear', sub: 'Studio quiz: bank, vote, survive', icon: 'cog', screen: 'gear', topics: ['mult', 'div', 'addsub', 'word'], friends: '3–8 · studio', notFor: ['g1'] },
  { id: 'stud', name: 'Stud Math', sub: 'Odds, raises and payouts', icon: 'chest', screen: 'stud', topics: ['prob'], notFor: ['g1'] },
  { id: 'millionaire', name: 'Math Millionaire', sub: 'Pick the set-up, climb to $1,000,000', icon: 'coins', screen: 'millionaire', topics: ['word'] },
  { id: 'workshop', name: 'Model Workshop', sub: 'Build your own probability', icon: 'telescope', screen: 'workshop', topics: ['prob'] },
];

export function buildRegistry(s: GameState): LibraryItem[] {
  const grade = capGrade(s.contest);
  const items: LibraryItem[] = [];

  // LEARN: the academies, every lesson, and the other teaching places.
  for (const a of ACADEMIES) {
    if (!a.chapters.length) continue;
    const open = academyUnlocked(s, a.id);
    items.push({ id: `academy:${a.id}`, name: a.name, kind: 'learn', sub: `${a.tier} · ${a.chapters.length} chapters`, icon: a.icon, topics: ACADEMY_TOPICS[a.id] ?? [], go: { action: { type: 'ACADEMY_OPEN', view: 'hub', academy: a.id } }, shelf: true, locked: open ? undefined : 'Graduate the academy before it', words: `${a.short} academy ${a.coreName}` });
  }
  items.push(
    { id: 'lessons', name: 'All lessons', kind: 'learn', sub: `${LESSONS.length} short lessons`, icon: 'scroll', topics: [], go: nav('lessons'), shelf: true, words: 'lecture hall teach' },
    { id: 'mental', name: 'Mental Math Academy', kind: 'learn', sub: 'Ten worlds, all in your head', icon: 'brain', topics: ['mental'], go: nav('mental'), shelf: true },
    { id: 'contest', name: 'Contest Path', kind: 'learn', sub: 'Calm puzzles for Grades 1, 3, 5', icon: 'medal', topics: ['logic', 'counting'], go: nav('contest'), shelf: true, words: 'amc grade' },
    { id: 'reality', name: 'Reality Lab', kind: 'learn', sub: 'Electronics kit · 10 missions', icon: 'circuit', topics: ['physics'], go: nav('reality'), shelf: true, words: 'arduino electronics lab circuit' },
    { id: 'visual-library', name: 'Name the Image', kind: 'learn', sub: 'Visual library of shapes and parts', icon: 'telescope', topics: ['geometry'], go: nav('visual-library', { practice: 'choice' }), shelf: true, words: 'visual library pictures' },
  );
  if (grade !== 'g1' && grade !== 'g3') items.push({ id: 'countlab', name: 'Count Lab', kind: 'learn', sub: 'Card maths · grown-up PIN', icon: 'chest', topics: ['prob'], go: nav('countlab'), shelf: true, words: 'cards blackjack probability parent' });
  for (const l of LESSONS) {
    items.push({ id: `lesson:${l.id}`, name: l.title, kind: 'learn', sub: `Lesson · ${l.minutes} min${s.stats.lessonsCompleted.includes(l.id) ? ' · done' : ''}`, icon: 'scroll', topics: skillTopics(l.skillId), go: { action: { type: 'START_LESSON', lessonId: l.id } }, shelf: false, words: `${l.summary ?? ''} ${NPCS[l.teacher]?.name ?? ''}` });
  }

  // DRILL: every Arcade game, through the one set-up card.
  for (const g of ARCADE_GAMES) {
    if (!gameOk(grade, g.id)) continue;
    items.push({ id: `drill:${g.id}`, name: g.label, kind: 'drill', sub: g.id === 'mult' ? '1–12 · heat grid' : 'Practice · Blitz · Conquer · Speed', icon: g.icon, topics: GAME_TOPICS[g.id] ?? [], go: setup(`drill:${g.id}`), shelf: true, words: `arcade ${g.blurb}` });
  }
  items.push({ id: 'drill', name: 'Training Grounds', kind: 'drill', sub: 'Drills and the diagnostic', icon: 'target', topics: ['mult'], go: nav('drill'), shelf: true, words: 'diagnostic training' });

  // PLAY and FRIENDS: the games, each through the set-up card.
  for (const g of PLAY_GAMES) {
    if (grade && g.notFor?.includes(grade as 'g1' | 'g3')) continue;
    items.push({ id: `game:${g.id}`, name: g.name, kind: g.id === 'versus' || g.id === 'gear' ? 'friends' : 'play', sub: g.sub, icon: g.icon, topics: g.topics, go: setup(g.id), shelf: true, friends: g.friends });
  }

  // QUEST and ME pages: found by search, reached from their tabs.
  items.push(
    { id: 'map', name: 'World map', kind: 'quest', sub: '10 regions · the road to Calculus', icon: 'map', topics: [], go: nav('map'), shelf: false, words: 'regions travel road' },
    { id: 'skilltree', name: 'Skill tree', kind: 'quest', sub: 'Mastery of every table and fact', icon: 'skill-tree', topics: [], go: nav('skilltree'), shelf: false, words: 'skills' },
    { id: 'quests', name: 'Quest log', kind: 'quest', sub: 'Story, missions and side goals', icon: 'quest', topics: [], go: nav('quests'), shelf: false },
    { id: 'lab', name: 'Engineering missions & projects', kind: 'quest', sub: 'Lab stations and construction', icon: 'lab', topics: [], go: nav('lab'), shelf: false, words: 'projects stations' },
    { id: 'dungeon', name: 'Dungeon of Forgotten Knowledge', kind: 'quest', sub: 'Facts that are fading', icon: 'skull', topics: ['mult'], go: { action: { type: 'START_DUNGEON' } as Action }, shelf: false, words: 'forgotten review specter' },
  );
  for (const r of REGIONS) {
    if (r.id === 'village' || r.id === 'advanced-regions') continue;
    items.push({ id: `region:${r.id}`, name: r.name, kind: 'quest', sub: r.implemented ? 'Region' : 'Region · ahead', icon: 'map', topics: TOPICS.filter((t) => t.region === r.id).map((t) => t.id), go: { action: { type: 'TRAVEL', regionId: r.id } }, shelf: false, words: r.description });
  }
  const due = dueEntries(s.notebook ?? []).length;
  items.push(
    { id: 'notebook', name: 'Notebook', kind: 'fix', sub: due ? `${due} due today` : 'Every miss, until you fix it', icon: 'book', topics: [], go: nav('notebook'), shelf: false, words: 'mistakes wrong answers fix' },
    { id: 'dashboard', name: 'Progress & stats', kind: 'me', sub: '7 / 30 / 90 days', icon: 'dashboard', topics: [], go: nav('dashboard'), shelf: false, words: 'stats ledger speed data' },
    { id: 'achievements', name: 'Badges & titles', kind: 'me', sub: 'Achievements', icon: 'trophy', topics: [], go: nav('achievements'), shelf: false, words: 'trophies' },
    { id: 'inventory', name: 'Gear & inventory', kind: 'me', sub: 'Goggles, calipers…', icon: 'backpack', topics: [], go: nav('inventory'), shelf: false, words: 'items loot' },
    { id: 'settings', name: 'Settings', kind: 'me', sub: 'Sound, motion, voice, save', icon: 'settings', topics: [], go: nav('settings'), shelf: false, words: 'sound volume music motion voice timer profiles sync export import' },
    { id: 'grownups', name: 'Grown-ups', kind: 'me', sub: 'Plan, diagnostic, profiles, sync', icon: 'lock', topics: [], go: nav('grownups'), shelf: false, words: 'parent' },
  );
  return items;
}

/** Library set-up card ids → the game they set up. */
export function itemForSetup(items: LibraryItem[], gameId: string): LibraryItem | undefined {
  return items.find((i) => i.id === (gameId.startsWith('drill:') ? gameId : `game:${gameId}`));
}

/* ---------- pins and recents (per profile, on this device) ---------- */

const KEY = 'engineering-quest.library';
type Saved = { pinned: string[]; recent: string[]; searches: string[] };
function load(who: string): Saved {
  try { const raw = JSON.parse(localStorage.getItem(`${KEY}.${who}`) ?? '{}'); return { pinned: raw.pinned ?? [], recent: raw.recent ?? [], searches: raw.searches ?? [] }; } catch { return { pinned: [], recent: [], searches: [] }; }
}
function save(who: string, v: Saved) { try { localStorage.setItem(`${KEY}.${who}`, JSON.stringify(v)); } catch { /* a convenience */ } }
export const libraryPrefs = {
  get: load,
  togglePin(who: string, id: string) { const v = load(who); v.pinned = v.pinned.includes(id) ? v.pinned.filter((x) => x !== id) : [id, ...v.pinned].slice(0, 8); save(who, v); return v; },
  touch(who: string, id: string) { const v = load(who); v.recent = [id, ...v.recent.filter((x) => x !== id)].slice(0, 8); save(who, v); },
  searched(who: string, q: string) { const t = q.trim(); if (!t) return; const v = load(who); v.searches = [t, ...v.searches.filter((x) => x !== t)].slice(0, 6); save(who, v); },
};

/** The set-up card remembers the last choices per game. */
export const setupPrefs = {
  get<T extends object>(gameId: string): Partial<T> { try { return JSON.parse(localStorage.getItem(`engineering-quest.setup.${gameId}`) ?? '{}'); } catch { return {}; } },
  set(gameId: string, v: object) { try { localStorage.setItem(`engineering-quest.setup.${gameId}`, JSON.stringify(v)); } catch { /* a convenience */ } },
};

/** Run an item's destination. */
export function goTo(dispatch: (a: Action) => void, go: Go) {
  if ('action' in go) dispatch(go.action); else dispatch({ type: 'NAVIGATE', screen: go.screen, params: go.params });
}

/** Picture-game kind labels for the set-up card. */
export const pictureKinds = (game: string) => PICTURE_GAMES[game]?.kinds ?? [];
