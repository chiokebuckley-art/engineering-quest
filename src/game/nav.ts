import type { Screen } from '../engine/state/types';

/** The four bottom tabs. There is no "More": every screen belongs to one of these, or is reached from search. */
export type Tab = 'home' | 'quest' | 'library' | 'me';

export const TABS: { tab: Tab; screen: Screen; label: string; icon: string }[] = [
  { tab: 'home', screen: 'home', label: 'Home', icon: 'star' },
  { tab: 'quest', screen: 'map', label: 'Quest', icon: 'sword' },
  { tab: 'library', screen: 'library', label: 'Library', icon: 'book' },
  { tab: 'me', screen: 'me', label: 'Me', icon: 'dashboard' },
];

/**
 * Redirect table: where each screen lives now. Old More / Arcade / Learn / LAB destinations
 * still open the same screen; this only decides which tab lights up and where "back" goes.
 */
const TAB_OF: Record<Screen, Tab> = {
  menu: 'home', intro: 'home', create: 'home', home: 'home', search: 'home',
  // Quest: the story campaign.
  map: 'quest', region: 'quest', battle: 'quest', mission: 'quest', dungeon: 'quest', quests: 'quest', skilltree: 'quest', lab: 'quest',
  // Library: learn · drill · play · friends.
  library: 'library', topic: 'library', setup: 'library', friends: 'library',
  academy: 'library', lessons: 'library', lesson: 'library', mental: 'library', contest: 'library', reality: 'library', countlab: 'library', 'visual-library': 'library',
  arcade: 'library', drill: 'library', versus: 'library',
  rocket: 'library', millionaire: 'library', stud: 'library', gear: 'library', plaza: 'library', tycoon: 'library', dice: 'library', workshop: 'library',
  // Me: progress and people.
  me: 'me', notebook: 'me', dashboard: 'me', inventory: 'me', achievements: 'me', settings: 'me', grownups: 'me',
};

export const tabFor = (screen: Screen): Tab => TAB_OF[screen] ?? 'home';

/** The page a tab opens on. */
export const tabHome = (tab: Tab): Screen => TABS.find((t) => t.tab === tab)!.screen;

/** Where a screen's "back" goes: the hub page of its tab. */
export function backFor(screen: Screen): { screen: Screen; label: string } {
  const tab = tabFor(screen);
  if (tab === 'quest') return { screen: 'map', label: 'World map' };
  if (tab === 'library') return { screen: 'library', label: 'Library' };
  if (tab === 'me') return { screen: 'me', label: 'Me' };
  return { screen: 'home', label: 'Home' };
}

/* ---------- hash routes (#/library?kind=drill) so links and reloads land on the same page ---------- */

const PATH_OF: Partial<Record<Screen, string>> = {
  home: '/home', map: '/quest', region: '/quest/region', library: '/library', topic: '/library/topic', setup: '/library/setup', friends: '/library/friends',
  academy: '/library/academy', me: '/me', notebook: '/me/notebook', grownups: '/me/grownups', search: '/search',
};

/** Old addresses (the More menu and the old tabs) and where they open now. */
export const LEGACY: Record<string, { screen: Screen; params?: Record<string, string> }> = {
  '/play': { screen: 'map' }, '/world-map': { screen: 'map' }, '/arcade': { screen: 'library', params: { kind: 'drill' } },
  '/learn': { screen: 'library', params: { kind: 'learn' } }, '/lab': { screen: 'reality' }, '/projects': { screen: 'lab' },
  '/stats': { screen: 'dashboard' }, '/items': { screen: 'inventory' }, '/trophies': { screen: 'achievements' }, '/skills': { screen: 'skilltree' },
  '/training': { screen: 'drill' }, '/more': { screen: 'me' },
};

const SCREENS = new Set<string>(Object.keys(TAB_OF));
/** Screens that only make sense mid-run or before a character exists, and Grown-ups (opened only by holding its row): a reload there lands on the tab instead. */
const NOT_LINKABLE = new Set<Screen>(['menu', 'intro', 'create', 'battle', 'mission', 'lesson', 'versus', 'grownups']);

export function hashFor(screen: Screen, params: Record<string, string | number | undefined> = {}): string {
  if (NOT_LINKABLE.has(screen)) screen = tabHome(tabFor(screen));
  const path = PATH_OF[screen] ?? `/${screen}`;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '' && typeof v !== 'object') q.set(k, String(v));
  const qs = q.toString();
  return `#${path}${qs ? `?${qs}` : ''}`;
}

export function parseHash(hash: string): { screen: Screen; params: Record<string, string> } | null {
  const raw = hash.replace(/^#/, '');
  if (!raw.startsWith('/')) return null;
  const [path, qs = ''] = raw.split('?');
  const params = Object.fromEntries(new URLSearchParams(qs));
  const legacy = LEGACY[path];
  if (legacy) return { screen: legacy.screen, params: { ...legacy.params, ...params } };
  const found = (Object.entries(PATH_OF) as [Screen, string][]).find(([, p]) => p === path);
  if (found) return NOT_LINKABLE.has(found[0]) ? { screen: tabHome(tabFor(found[0])), params: {} } : { screen: found[0], params };
  const id = path.slice(1);
  if (SCREENS.has(id) && !NOT_LINKABLE.has(id as Screen)) return { screen: id as Screen, params };
  return null;
}
