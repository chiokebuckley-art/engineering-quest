import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../store';
import { Icon } from '../components/ui';
import { buildRegistry, goTo, libraryPrefs, KIND_LABEL, type Kind, type LibraryItem } from '../library';
import { NPCS } from '../../content/npcs';
import { capGrade, selectionOk } from './ArcadeScreen';
import { tabHome, tabFor } from '../nav';

const ORDER: Kind[] = ['drill', 'learn', 'play', 'friends', 'fix', 'quest', 'me'];

/** "6x7", "6 × 7", "÷7", "7 times": a fact or a table, straight into Practice. */
function factItems(q: string, grade: ReturnType<typeof capGrade>): LibraryItem[] {
  const out: LibraryItem[] = [];
  const m = /^(\d{1,2})\s*[x×*]\s*(\d{1,2})$/.exec(q);
  if (m) {
    const a = Number(m[1]), b = Number(m[2]);
    if (a >= 1 && a <= 12 && b >= 1 && b <= 12) {
      const key = `mult:fact:${Math.min(a, b)}x${Math.max(a, b)}`;
      if (selectionOk(grade, 'mult', key)) out.push({ id: `fact:${key}`, name: `${a} × ${b}`, kind: 'drill', sub: 'Practise this fact', icon: 'multiply', topics: ['mult'], shelf: false, go: { action: { type: 'ARCADE_START', game: 'mult', mode: 'practice', selection: key } } });
    }
  }
  const t = /^(?:[x×*]\s*(\d{1,2})|(\d{1,2})\s*(?:times|x|×)(?:\s*table)?)$/.exec(q);
  const n = t ? Number(t[1] ?? t[2]) : 0;
  if (n >= 1 && n <= 12 && selectionOk(grade, 'mult', `mult:${n}`)) out.push({ id: `fact:mult:${n}`, name: `×${n} table`, kind: 'drill', sub: 'Practise the table', icon: 'multiply', topics: ['mult'], shelf: false, go: { action: { type: 'ARCADE_START', game: 'mult', mode: 'practice', selection: `mult:${n}` } } });
  const d = /^(?:÷|\/|div(?:ide)?(?:d by)?)\s*(\d{1,2})$/.exec(q);
  const dn = d ? Number(d[1]) : 0;
  if (dn >= 2 && dn <= 12 && selectionOk(grade, 'div', `div:${dn}`)) out.push({ id: `fact:div:${dn}`, name: `÷${dn}`, kind: 'drill', sub: 'Practise dividing by it', icon: 'divide', topics: ['div'], shelf: false, go: { action: { type: 'ARCADE_START', game: 'div', mode: 'practice', selection: `div:${dn}` } } });
  return out;
}

/** Fuzzy prefix match: every word of the query starts a word of the item (name scores higher than its other words). */
function score(item: LibraryItem, words: string[]): number {
  const name = item.name.toLowerCase();
  const nameWords = name.split(/[^a-z0-9×÷%]+/).filter(Boolean);
  const extra = `${item.sub} ${item.words ?? ''} ${KIND_LABEL[item.kind]}`.toLowerCase().split(/[^a-z0-9×÷%]+/).filter(Boolean);
  let s = 0;
  for (const w of words) {
    if (name.startsWith(w)) s += 6;
    else if (nameWords.some((x) => x.startsWith(w))) s += 4;
    else if (name.includes(w)) s += 2;
    else if (extra.some((x) => x.startsWith(w))) s += 1;
    else return 0;
  }
  return s + (item.shelf ? 1 : 0) - (item.locked ? 2 : 0);
}

export function SearchScreen() {
  const { state, dispatch, play, profiles } = useGame();
  const [q, setQ] = useState(typeof state.screenParams.q === 'string' ? state.screenParams.q : '');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); }, []);
  const grade = capGrade(state.contest);
  const index = useMemo(() => {
    const items = buildRegistry(state);
    for (const n of Object.values(NPCS)) items.push({ id: `npc:${n.id}`, name: n.name, kind: 'quest', sub: n.role, icon: 'helmet', topics: [], shelf: false, go: { action: { type: 'TRAVEL', regionId: n.region } }, words: n.id });
    return items;
  }, [state]);
  const cancel = () => { play('click'); dispatch({ type: 'NAVIGATE', screen: tabHome(tabFor('home')) }); };
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') cancel(); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const query = q.trim().toLowerCase();
  const words = query.split(/\s+/).filter(Boolean);
  const hits = query ? [...factItems(query.replace(/\s+/g, ' '), grade), ...index.map((i) => ({ i, s: score(i, words) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.i)].slice(0, 40) : [];
  const top = hits[0];
  const rest = hits.slice(1);
  const prefs = libraryPrefs.get(profiles.active);
  const recentItems = prefs.recent.map((id) => index.find((i) => i.id === id)).filter((i): i is LibraryItem => !!i).slice(0, 5);
  const open = (i: LibraryItem) => { play('open'); libraryPrefs.searched(profiles.active, q); libraryPrefs.touch(profiles.active, i.id); goTo(dispatch, i.go); };

  return (
    <div className="sq">
      <div className="sq-in sq-search-sheet">
        <div className="top">
          <label className="sq-search live">
            <Icon name="compass" />
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find anything: a game, a lesson, 6×7, Ada, sound…" aria-label="Find anything" onKeyDown={(e) => { if (e.key === 'Enter' && top) open(top); }} />
          </label>
          <button className="cancel" onClick={cancel}>Cancel</button>
        </div>

        {!query && (
          <>
            {prefs.searches.length > 0 && (
              <section>
                <p className="sq-eyebrow">Recent searches</p>
                <div className="sq-chips">{prefs.searches.map((s) => <button key={s} className="sq-chip" onClick={() => setQ(s)}>{s}</button>)}</div>
              </section>
            )}
            {recentItems.length > 0 && (
              <section className="sq-rows">
                <p className="sq-eyebrow">Recently opened</p>
                {recentItems.map((i) => <HitRow key={i.id} item={i} onOpen={open} />)}
              </section>
            )}
            <p className="sq-empty">Finds games, drills, lessons, academies, regions, people (“Ada”), facts (“6×7”, “÷7”) and settings (“sound”).</p>
          </>
        )}

        {query && !top && <p className="sq-empty">Nothing called “{q}”. Try a topic like “fractions”, a fact like “6×7”, or a name like “Vector”.</p>}

        {top && (
          <button className={`sq-hit k-${top.kind}`} onClick={() => open(top)}>
            <Icon name={top.icon} />
            <span className="main"><b>{top.name}</b><small>{top.locked ? `🔒 ${top.locked}` : top.friends ?? top.sub}</small></span>
            <span className="go">{top.kind === 'play' || top.kind === 'friends' || top.kind === 'drill' ? 'PLAY' : 'OPEN'}</span>
          </button>
        )}

        {ORDER.map((k) => {
          const group = rest.filter((i) => i.kind === k);
          if (!group.length) return null;
          return (
            <section key={k} className={`sq-rows k-${k}`}>
              <p className="sq-eyebrow">{KIND_LABEL[k]}</p>
              {group.slice(0, 8).map((i) => <HitRow key={i.id} item={i} onOpen={open} />)}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function HitRow({ item, onOpen }: { item: LibraryItem; onOpen: (i: LibraryItem) => void }) {
  return (
    <button className={`sq-row k-${item.kind} ${item.locked ? 'locked' : ''}`} style={{ minHeight: 46 }} onClick={() => onOpen(item)}>
      <span className="sq-tile sm"><Icon name={item.icon} /></span>
      <span className="main"><span className="name">{item.name}</span><span className="meta">{item.locked ? `🔒 ${item.locked}` : item.friends ?? item.sub}</span></span>
      <span className="end">{KIND_LABEL[item.kind]}</span>
    </button>
  );
}
