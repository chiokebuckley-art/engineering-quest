import { useMemo, useState } from 'react';
import { useGame } from '../store';
import { Icon } from '../components/ui';
import { buildRegistry, goTo, libraryPrefs, setupPrefs, itemForSetup, topicById, TOPICS, PLAY_GAMES, KIND_LABEL, type Kind, type LibraryItem, type Topic } from '../library';
import { capGrade, kindOk, lobbyKinds, cappedKey, calmStreakDone } from './ArcadeScreen';
import { parseSelection, BLITZ_MS, bestKey } from '../../engine/state/arcade';
import { PICTURE_GAMES } from '../../engine/questions/games';
import { ARCADE_ACADEMY_KINDS } from '../../engine/academy/generator';
import { TRICK_KINDS } from '../../engine/questions/tricks';
import { MENTAL_KINDS } from '../../engine/questions/mental';
import { VOLUME_KINDS } from '../../engine/questions/volume';
import { MEASURE_KINDS } from '../../engine/questions/measure';
import { MM_ARCADE_GROUPS } from '../../engine/questions/mentalmath';
import { timedModesAllowed } from '../../engine/contest/grades';
import { skillMastery, bandFor } from '../../engine/mastery/MasteryEngine';
import { componentSkills, skillById } from '../../engine/curriculum/skills';
import { activeEntries, dueEntries } from '../../engine/notebook/notebook';
import { academyById } from '../../engine/academy/registry';
import { chapterGates } from '../../engine/academy/AcademyEngine';
import { regionById } from '../../engine/curriculum/regions';
import { pausedPlaza } from '../../engine/state/plaza';
import { normalizeRoomCode } from '../net/room';
import type { ArcadeGame, ArcadeMode, Screen } from '../../engine/state/types';

const str = (v: unknown) => (typeof v === 'string' ? v : '');

/* ================================================================== */
/* 2g Library · All                                                    */
/* ================================================================== */

export function LibraryScreen() {
  const { state, dispatch, play, profiles } = useGame();
  const registry = useMemo(() => buildRegistry(state), [state]);
  const kind = (str(state.screenParams.kind) || 'all') as Kind | 'all';
  const topic = str(state.screenParams.topic);
  const pins = libraryPrefs.get(profiles.active).pinned;
  const set = (k: Kind | 'all', t: string) => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'library', params: { kind: k === 'all' ? undefined : k, topic: t || undefined } as Record<string, string> }); };
  const shelf = registry.filter((i) => i.shelf);
  // Locked things wait at the end, so the grid opens on what can be played now.
  const shown = shelf.filter((i) => (kind === 'all' || i.kind === kind || (kind === 'friends' && !!i.friends)) && (!topic || i.topics.includes(topic as never))).sort((a, b) => Number(!!a.locked) - Number(!!b.locked));
  const pinned = pins.map((id) => registry.find((i) => i.id === id)).filter((i): i is LibraryItem => !!i);
  const open = (i: LibraryItem) => { play('click'); libraryPrefs.touch(profiles.active, i.id); goTo(dispatch, i.go); };
  const t = topic ? topicById(topic) : undefined;

  return (
    <div className="sq">
      <div className="sq-in">
        <h1 className="sq-title">Library</h1>
        <button className="sq-search" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'search' }); }}><Icon name="compass" /> Find anything</button>
        <div className="sq-chips" role="group" aria-label="Kind">
          <button className={`sq-chip k-next ${kind === 'all' ? 'on' : ''}`} onClick={() => set('all', topic)}>All</button>
          {(['learn', 'drill', 'play'] as Kind[]).map((k) => <button key={k} className={`sq-chip k-${k} ${kind === k ? 'on' : ''}`} onClick={() => set(k, topic)}>{KIND_LABEL[k]}</button>)}
          <button className="sq-chip k-friends" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'friends' }); }}>Friends</button>
        </div>
        <div className="sq-chips scroll" role="group" aria-label="Topic">
          {TOPICS.map((x) => <button key={x.id} className={`sq-chip outline ${topic === x.id ? 'on' : ''}`} onClick={() => set(kind, topic === x.id ? '' : x.id)}>{x.label}</button>)}
        </div>

        {t && (
          <button className="sq-next" onClick={() => { play('open'); dispatch({ type: 'NAVIGATE', screen: 'topic', params: { topic: t.id } }); }}>
            <Icon name="skill-tree" /><span><b>Everything about {t.label}</b><small>Mastery, next step, lessons, drills, notebook cards</small></span><span className="go">▸</span>
          </button>
        )}

        {pinned.length > 0 && !topic && kind === 'all' && (
          <section>
            <p className="sq-eyebrow k-next">Pinned</p>
            <div className="sq-grid">{pinned.map((i) => <ItemCard key={i.id} item={i} pinned onOpen={open} />)}</div>
          </section>
        )}

        <section>
          <p className="sq-eyebrow">{kind === 'all' ? 'Everything' : KIND_LABEL[kind]}{t ? ` · ${t.label}` : ''} <span className="sq-count">· {shown.length}</span></p>
          {shown.length ? <div className="sq-grid">{shown.map((i) => <ItemCard key={i.id} item={i} onOpen={open} />)}</div> : <p className="sq-empty">Nothing here yet for this topic.</p>}
        </section>
      </div>
    </div>
  );
}

function ItemCard({ item, pinned, onOpen }: { item: LibraryItem; pinned?: boolean; onOpen: (i: LibraryItem) => void }) {
  return (
    <button className={`sq-item k-${item.kind} ${pinned ? 'pinned' : ''} ${item.locked ? 'locked' : ''}`} onClick={() => onOpen(item)} title={item.locked}>
      <span className="top"><Icon name={item.icon} /><span className="sq-tag">{KIND_LABEL[item.kind]}</span></span>
      <span className="name">{item.name}</span>
      <span className="meta">{item.locked ? `🔒 ${item.locked}` : item.friends ?? item.sub}</span>
    </button>
  );
}

/* ================================================================== */
/* 2h Library · Topic hub                                              */
/* ================================================================== */

/** The Arithmetic Academy chapter that teaches each topic. */
const TOPIC_CHAPTER: Partial<Record<string, [string, string]>> = { counting: ['arithmetic', 'count'], addsub: ['arithmetic', 'add'], mult: ['arithmetic', 'mult'], div: ['arithmetic', 'div'], frac: ['arithmetic', 'frac'], ratio: ['arithmetic', 'ratio'] };

function topicSegments(t: Topic): string[] {
  const parts = t.skills.flatMap((s) => { const c = componentSkills(s); return c.length ? c : [s]; });
  return parts.slice(0, 14);
}

export function TopicHubScreen() {
  const { state, dispatch, play, profiles } = useGame();
  const registry = useMemo(() => buildRegistry(state), [state]);
  const t = topicById(str(state.screenParams.topic)) ?? TOPICS[2];
  const segs = topicSegments(t);
  const vals = segs.map((s) => skillMastery(s, state.mastery));
  const pct = Math.round(vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length));
  const items = registry.filter((i) => i.topics.includes(t.id));
  const lessons = items.filter((i) => i.id.startsWith('lesson:'));
  const lessonsDone = lessons.filter((l) => state.stats.lessonsCompleted.includes(l.id.slice(7))).length;
  const drills = items.filter((i) => i.kind === 'drill');
  const games = items.filter((i) => i.kind === 'play' || i.kind === 'friends');
  const cards = activeEntries(state.notebook ?? []).filter((e) => segs.some((s) => e.question.masterySkillId === s || e.question.masterySkillId.startsWith(`${s}.`)) || t.skills.some((s) => e.question.masterySkillId.split('.')[0] === s.split('.')[0]));
  const dueCards = dueEntries(state.notebook ?? []).filter((e) => cards.includes(e));
  const ch = TOPIC_CHAPTER[t.id];
  const academy = ch ? academyById(ch[0]) : undefined;
  const chapter = academy?.chapters.find((c) => c.key === ch![1]);
  const gates = academy && chapter ? chapterGates(state, academy.id, chapter.key) : undefined;
  const gatesMet = gates ? [gates.questsCleared >= gates.quests.length, gates.concept.pass, gates.fluency.pass, gates.transfer.pass].filter(Boolean).length : 0;
  const region = t.region ? regionById(t.region) : undefined;
  const open = (i: LibraryItem) => { play('click'); libraryPrefs.touch(profiles.active, i.id); goTo(dispatch, i.go); };

  // Next: the first lesson not yet done, else the weakest sub-skill's drill.
  const nextLesson = lessons.find((l) => !state.stats.lessonsCompleted.includes(l.id.slice(7)) && !l.locked);
  const weakest = segs.map((s, i) => ({ s, v: vals[i] })).filter((x) => x.v < 90).sort((a, b) => a.v - b.v)[0];
  const nextDrill = drills[0];
  const next = nextLesson
    ? { label: `Next: ${nextLesson.name}`, sub: `${nextLesson.sub.replace('Lesson · ', 'Lesson ')}, then practise it`, go: () => open(nextLesson) }
    : weakest && nextDrill
      ? { label: `Next: ${skillById(weakest.s)?.shortName ?? skillById(weakest.s)?.name ?? weakest.s}`, sub: `Your weakest part · ${Math.round(weakest.v)}% · drill it`, go: () => open(nextDrill) }
      : nextDrill ? { label: `Keep it sharp: ${nextDrill.name}`, sub: 'Blitz or Conquer', go: () => open(nextDrill) } : null;

  const Row = ({ kind, name, meta, go, locked }: { kind: Kind; name: string; meta: string; go: () => void; locked?: boolean }) => (
    <button className={`sq-row k-${kind} ${locked ? 'locked' : ''}`} onClick={go}>
      <span className="sq-tag fill">{KIND_LABEL[kind]}</span>
      <span className="main"><span className="name">{name}</span></span>
      <span className="end">{meta}</span>
    </button>
  );

  return (
    <div className="sq">
      <div className="sq-in">
        <header className="sq-hub">
          <button className="sq-back" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'library', params: { topic: t.id } }); }}>‹ Library</button>
          <div className="who">
            <span className="tile"><Icon name="skill-tree" /></span>
            <div><h2>{t.label}</h2><small>{t.world} · {t.teacher}</small></div>
          </div>
          <div className="mastery"><span>Mastery</span><span>{pct}% · {bandFor(pct)}</span></div>
          <div className="sq-segs" aria-hidden>{vals.map((v, i) => <i key={i} className={v >= 90 ? 'done' : v > 0 ? 'mid' : ''} />)}</div>
        </header>

        {next && (
          <button className="sq-next" onClick={() => { play('open'); next.go(); }}>
            <Icon name="level-up" /><span><b>{next.label}</b><small>{next.sub}</small></span><span className="go">▸</span>
          </button>
        )}

        <section className="sq-rows">
          <p className="sq-eyebrow">Everything about {t.label.toLowerCase()}</p>
          {academy && chapter && gates && <Row kind="learn" name={`${academy.short} Academy · Chapter ${chapter.n}`} meta={`${gatesMet} / 4 gates`} locked={!gates.available} go={() => { play('open'); dispatch({ type: 'ACADEMY_OPEN', view: 'chapter', academy: academy.id, chapter: chapter.key }); }} />}
          {lessons.length > 0 && <Row kind="learn" name={`${lessons.length} lesson${lessons.length === 1 ? '' : 's'}`} meta={`${lessonsDone} done`} go={() => { play('open'); dispatch({ type: 'NAVIGATE', screen: 'search', params: { q: t.label } }); }} />}
          {drills.map((d) => <Row key={d.id} kind="drill" name={`Arcade · ${d.name}`} meta={bestFor(state, d) ?? 'Practice · Blitz'} go={() => open(d)} />)}
          {cards.length > 0 && <Row kind="fix" name={`Notebook · ${cards.length} card${cards.length === 1 ? '' : 's'}`} meta={dueCards.length ? 'due today' : 'healing'} go={() => { play('open'); dispatch({ type: 'NAVIGATE', screen: 'notebook' }); }} />}
          {region && <Row kind="play" name={`${region.name}${region.implemented ? '' : ' · ahead'}`} meta={state.world.unlockedRegions.includes(region.id) ? 'open' : 'locked'} locked={!state.world.unlockedRegions.includes(region.id)} go={() => { play('open'); dispatch({ type: 'TRAVEL', regionId: region.id }); }} />}
          {games.map((g) => <Row key={g.id} kind={g.friends ? 'friends' : 'play'} name={g.name} meta={g.friends ? 'room' : 'game'} go={() => open(g)} />)}
        </section>
      </div>
    </div>
  );
}

function bestFor(s: ReturnType<typeof useGame>['state'], item: LibraryItem): string | undefined {
  const game = item.id.replace('drill:', '') as ArcadeGame;
  const bests = Object.entries(s.stats.arcade.bests).filter(([k]) => k.startsWith(`${game}:`)).map(([, v]) => v.score);
  return bests.length ? `best ${Math.max(...bests)}` : undefined;
}

/* ================================================================== */
/* 2j Library · the one set-up card                                    */
/* ================================================================== */

/** A chip label for one kind of an Arcade game. */
function kindLabel(game: ArcadeGame, k: string): string {
  if (game === 'mult') return k === 'all' ? 'All tables' : `×${k} table`;
  if (game === 'div') return k === 'all' ? 'All ÷' : `÷${k}`;
  if (game === 'add' || game === 'sub') return `to ${Number(k).toLocaleString()}`;
  if (game === 'bonds') return `Make ${k}`;
  if (game === 'frac' || game === 'ratio') return k === 'all' ? 'Every kind' : ARCADE_ACADEMY_KINDS[game].find((x) => x.id === k)?.label ?? k;
  if (game === 'tricks') return TRICK_KINDS.find((x) => x.id === k)?.short ?? k;
  if (game === 'mental') return MENTAL_KINDS.find((x) => x.id === k)?.short ?? k;
  if (game === 'volume') return VOLUME_KINDS.find((x) => x.id === k)?.short ?? k;
  if (game === 'measure') return MEASURE_KINDS.find((x) => x.id === k)?.short ?? k;
  if (game === 'mm') return MM_ARCADE_GROUPS.find((x) => x.id === k)?.label ?? k;
  if (PICTURE_GAMES[game]) return PICTURE_GAMES[game].kinds.find((x) => x.id === k)?.short ?? k;
  return parseSelection(game, `${game}:${k}`).label;
}

const MODES: { id: ArcadeMode; label: string; timed: boolean }[] = [
  { id: 'practice', label: 'Practice · no clock', timed: false },
  { id: 'blitz', label: `Blitz · ${BLITZ_MS / 1000} s`, timed: true },
  { id: 'conquer', label: 'Conquer · beat each', timed: true },
  { id: 'speed', label: 'Speed · 20 on the clock', timed: true },
];
type Who = 'me' | 'pass' | 'online';

export function SetupScreen() {
  const { state, dispatch, play, profiles } = useGame();
  const registry = useMemo(() => buildRegistry(state), [state]);
  const gameId = str(state.screenParams.game) || 'drill:mult';
  const item = itemForSetup(registry, gameId);
  const [pinned, setPinned] = useState(() => libraryPrefs.get(profiles.active).pinned.includes(item?.id ?? ''));
  const back = () => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'library' }); };
  if (!item) return <div className="sq"><div className="sq-in"><button className="sq-back" onClick={back}>‹ Library</button><p className="sq-empty">That game is not open for this player.</p></div></div>;
  const pin = () => { play('click'); setPinned(libraryPrefs.togglePin(profiles.active, item.id).pinned.includes(item.id)); };
  return (
    <div className="sq">
      <div className="sq-in sq-setup" style={{ minHeight: '100%' }}>
        <div className="sq-head">
          <button className="sq-back" onClick={back}>‹ Library</button>
          <span className="spacer" />
          <button className="sq-pin" onClick={pin} aria-pressed={pinned}>{pinned ? '★ Pinned' : '☆ Pin'}</button>
        </div>
        {gameId.startsWith('drill:') ? <DrillSetup item={item} game={gameId.slice(6) as ArcadeGame} /> : <GameSetup item={item} gameId={gameId} />}
      </div>
    </div>
  );
}

function Ident({ item, line }: { item: LibraryItem; line: string }) {
  return (
    <div className={`ident k-${item.kind}`}>
      <span className="sq-tile lg"><Icon name={item.icon} /></span>
      <div><h2>{item.name}</h2><p className="sq-sub">{line}</p></div>
    </div>
  );
}

function DrillSetup({ item, game }: { item: LibraryItem; game: ArcadeGame }) {
  const { state, dispatch, play } = useGame();
  const grade = capGrade(state.contest);
  const clocks = !grade || timedModesAllowed(grade);
  const speedLocked = grade === 'g3' && !calmStreakDone(state);
  const multi = game === 'mult' || game === 'div';
  const kinds = lobbyKinds(game).filter((k) => kindOk(grade, game, k));
  const saved = setupPrefs.get<{ kinds: string[]; mode: ArcadeMode; who: Who }>(`drill:${game}`);
  const [picked, setPicked] = useState<string[]>(() => (saved.kinds ?? []).filter((k) => kinds.includes(k)));
  const [mode, setMode] = useState<ArcadeMode>(() => (saved.mode && (clocks || saved.mode === 'practice') ? saved.mode : 'practice'));
  const [who, setWho] = useState<Who>(saved.who ?? 'me');
  const [consent, setConsent] = useState(false);
  const chosen = picked.length ? picked : [kinds.includes('all') ? 'all' : kinds[0]].filter(Boolean);
  const toggle = (k: string) => {
    play('click');
    if (!multi || k === 'all') { setPicked([k]); return; }
    setPicked((p) => { const n = p.filter((x) => x !== 'all'); return n.includes(k) ? n.filter((x) => x !== k) : [...n, k]; });
  };
  const body = multi && !chosen.includes('all') ? [...chosen].sort((a, b) => Number(a) - Number(b)).join(',') : chosen[0] ?? 'all';
  const base = game === 'mixed' ? 'mixed:all' : game === 'academy' ? '' : `${game}:${body}`;
  const selection = base ? cappedKey(grade, game, base) : '';
  const sel = selection ? parseSelection(game, selection) : null;
  const best = sel ? state.stats.arcade.bests[bestKey(sel.key, BLITZ_MS)] : undefined;
  const friendsOk = clocks && game !== 'academy';
  const remember = () => setupPrefs.set(`drill:${game}`, { kinds: picked, mode, who });
  const startNow = () => {
    remember();
    if (who !== 'me') { play('open'); dispatch({ type: 'NAVIGATE', screen: 'arcade', params: { game, friends: who } }); return; }
    if (!sel) { play('open'); dispatch({ type: 'NAVIGATE', screen: 'arcade', params: { game } }); return; }
    play(mode === 'blitz' ? 'boss-roar' : 'open');
    dispatch({ type: 'ARCADE_START', game, mode, selection, durationMs: BLITZ_MS, targetMs: 5000 });
  };
  const start = () => { if (grade && (mode !== 'practice' || who !== 'me')) { play('click'); setConsent(true); } else startNow(); };

  return (
    <>
      <Ident item={item} line={best ? `Best Blitz: ${best.score} · ${new Date(best.at).toLocaleDateString(undefined, { weekday: 'short' })}` : 'Difficulty follows your mastery'} />
      {kinds.length > 0 && (
        <section className="k-drill">
          <p className="sq-eyebrow">1 · What math</p>
          <div className="sq-chips">
            {kinds.slice(0, 14).map((k) => <button key={k} className={`sq-chip ${chosen.includes(k) ? 'on' : ''}`} aria-pressed={chosen.includes(k)} onClick={() => toggle(k)}>{kindLabel(game, k)}</button>)}
            <button className="sq-chip outline" onClick={() => { play('click'); remember(); dispatch({ type: 'NAVIGATE', screen: 'arcade', params: { game } }); }}>+ more…</button>
          </div>
        </section>
      )}
      {game === 'academy' && <p className="sq-sub">Academy drills follow the chapters you have opened. <button className="sq-chip outline" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'arcade', params: { game } })}>Pick a chapter…</button></p>}
      <section className="k-learn">
        <p className="sq-eyebrow">2 · How long</p>
        <div className="sq-opts" style={{ gridAutoFlow: 'row', gridTemplateColumns: '1fr 1fr' }}>
          {MODES.filter((m) => clocks || !m.timed).map((m) => {
            const locked = m.id === 'speed' && speedLocked;
            return <button key={m.id} className={`sq-opt ${mode === m.id ? 'on' : ''}`} disabled={locked} onClick={() => { play('click'); setMode(m.id); }}>{m.label}{locked ? ' · after a calm streak' : ''}</button>;
          })}
        </div>
      </section>
      {friendsOk && (
        <section className="k-friends">
          <p className="sq-eyebrow">3 · Who</p>
          <div className="sq-opts">
            {([['me', '🧑', 'Just me'], ['pass', '📱', 'Pass & play'], ['online', '🌐', 'Online room']] as const).map(([id, g, l]) => (
              <button key={id} className={`sq-opt sq-who ${who === id ? 'on' : ''}`} onClick={() => { play('click'); setWho(id); }}><span className="glyph">{g}</span>{l}</button>
            ))}
          </div>
          {who !== 'me' && <p className="sq-sub">With friends it is a Naval Blitz: everyone gets the same questions at the same moment.</p>}
        </section>
      )}
      {sel && <div className="sq-info"><span>Difficulty follows your mastery</span><b>Level {sel.difficulty} · auto</b></div>}
      {consent && (
        <div className="sq-card" role="dialog" aria-label="A clock">
          <p style={{ margin: 0 }}>{who !== 'me' ? 'Play with friends is a race on a clock.' : mode === 'blitz' ? 'Blitz: answer as many as you can before the time runs out.' : mode === 'speed' ? 'Speed: 20 questions, each on its own clock.' : 'Conquer: each answer has to be quick to count.'} Ready for a clock?</p>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="sq-cta sm" onClick={() => { setConsent(false); startNow(); }}>Yes, start</button>
            <button className="sq-btn2" onClick={() => { play('click'); setConsent(false); setMode('practice'); setWho('me'); }}>No clock, please</button>
          </div>
        </div>
      )}
      <div className="sq-dock"><button className="sq-cta" onClick={start}>{who === 'me' ? 'START' : 'SET UP THE ROOM'} ▸</button></div>
    </>
  );
}

/** Games with their own boards: the card is the one front door; the game's own table follows. */
function GameSetup({ item, gameId }: { item: LibraryItem; gameId: string }) {
  const { state, dispatch, play } = useGame();
  const g = PLAY_GAMES.find((x) => x.id === gameId)!;
  const multiplayer = !!g.friends;
  const saved = setupPrefs.get<{ who: Who }>(gameId);
  const [who, setWho] = useState<Who>(saved.who ?? (gameId === 'versus' ? 'pass' : 'me'));
  const resume = gameId === 'plaza' && ((state.plaza && state.plaza.phase !== 'over') || pausedPlaza(state.stats.plaza)) ? 'Your board is waiting' : gameId === 'tycoon' && state.tycoon ? 'Your game is saved' : '';
  const start = () => {
    setupPrefs.set(gameId, { who });
    play('open');
    if (gameId === 'versus') { dispatch({ type: 'NAVIGATE', screen: 'arcade', params: { friends: who === 'online' ? 'online' : 'pass' } }); return; }
    dispatch({ type: 'NAVIGATE', screen: g.screen as Screen, params: multiplayer ? { who } : undefined });
  };
  return (
    <>
      <Ident item={item} line={resume || g.sub} />
      {multiplayer && (
        <section className="k-friends">
          <p className="sq-eyebrow">Who · {g.friends}</p>
          <div className="sq-opts">
            {([['me', '🧑', gameId === 'versus' ? 'Practice' : 'Just me'], ['pass', '📱', 'Pass & play'], ['online', '🌐', 'Online room']] as const).filter(([id]) => !(gameId === 'versus' && id === 'me')).map(([id, gl, l]) => (
              <button key={id} className={`sq-opt sq-who ${who === id ? 'on' : ''}`} onClick={() => { play('click'); setWho(id); }}><span className="glyph">{gl}</span>{l}</button>
            ))}
          </div>
          {who === 'online' && <p className="sq-sub">The next screen makes a room code and an invite link to share.</p>}
        </section>
      )}
      <div className="sq-info"><span>The maths and the length are chosen on the game’s own table next.</span></div>
      <div className="sq-dock"><button className="sq-cta" onClick={start}>{resume ? 'RESUME' : 'OPEN'} ▸</button></div>
    </>
  );
}

/* ================================================================== */
/* 2k Library · Friends                                                */
/* ================================================================== */

const ROOM_GAMES: { id: string; screen: Screen; label: string }[] = [
  { id: 'versus', screen: 'arcade', label: 'Naval Blitz' },
  { id: 'plaza', screen: 'plaza', label: 'Equation Plaza' },
  { id: 'tycoon', screen: 'tycoon', label: 'Engine City Tycoon' },
  { id: 'dice', screen: 'dice', label: 'Dice Workshop' },
  { id: 'gear', screen: 'gear', label: 'Weakest Gear' },
];

export function FriendsScreen() {
  const { state, dispatch, play } = useGame();
  const registry = useMemo(() => buildRegistry(state), [state]);
  const [code, setCode] = useState(['', '', '', '']);
  const [game, setGame] = useState('');
  const full = normalizeRoomCode(code.join(''));
  const ready = full.length === 4 && !!game;
  const allowed = ROOM_GAMES.filter((r) => registry.some((i) => i.id === `game:${r.id}`));
  const join = () => {
    if (!ready) return;
    const r = ROOM_GAMES.find((x) => x.id === game)!;
    play('open');
    dispatch({ type: 'NAVIGATE', screen: r.screen, params: r.id === 'versus' ? { room: full, friends: 'online' } : { room: full } });
  };
  const typeAt = (i: number, v: string) => {
    const ch = normalizeRoomCode(v).slice(-1);
    setCode((c) => { const n = [...c]; n[i] = ch; return n; });
    if (ch) (document.getElementById(`room-${i + 1}`) as HTMLInputElement | null)?.focus();
  };
  const live: { name: string; sub: string; go: () => void }[] = [];
  const paused = pausedPlaza(state.stats.plaza);
  if (state.plaza?.online || paused) live.push({ name: `Equation Plaza${state.plaza?.online ? ` · ${state.plaza.online.code}` : ''}`, sub: 'your seat is kept', go: () => dispatch({ type: 'NAVIGATE', screen: 'plaza' }) });
  if (state.tycoon) live.push({ name: `Engine City Tycoon${state.tycoon.online ? ` · ${state.tycoon.online.code}` : ''}`, sub: state.tycoon.online ? 'room open' : 'saved on this device', go: () => dispatch({ type: 'NAVIGATE', screen: 'tycoon' }) });
  if (state.diceTable?.online) live.push({ name: `Dice Workshop · ${state.diceTable.online.code}`, sub: 'table open', go: () => dispatch({ type: 'NAVIGATE', screen: 'dice' }) });
  if (state.gear?.online) live.push({ name: `Weakest Gear · ${state.gear.online.roomCode}`, sub: 'studio open', go: () => dispatch({ type: 'NAVIGATE', screen: 'gear' }) });
  const together = registry.filter((i) => i.friends);

  return (
    <div className="sq">
      <div className="sq-in">
        <button className="sq-back" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'library' }); }}>‹ Library</button>
        <div><h1 className="sq-title">Play with friends</h1><p className="sq-sub">One code box for every game</p></div>

        <section className="sq-join">
          <p className="sq-eyebrow">Join a room</p>
          <div className="sq-code">
            {code.map((c, i) => <input key={i} id={`room-${i}`} value={c} maxLength={2} inputMode="text" autoCapitalize="characters" aria-label={`Room code letter ${i + 1}`} onChange={(e) => typeAt(i, e.target.value)} onKeyDown={(e) => { if (e.key === 'Backspace' && !c && i > 0) (document.getElementById(`room-${i - 1}`) as HTMLInputElement | null)?.focus(); }} />)}
          </div>
          <div className="sq-chips" role="group" aria-label="Which game">
            {allowed.map((r) => <button key={r.id} className={`sq-chip ${game === r.id ? 'on' : ''}`} style={game === r.id ? { background: 'var(--ink)', color: 'var(--cyan)', borderColor: 'var(--ink)' } : { background: 'rgba(10,13,42,.35)', color: 'var(--ink)', borderColor: 'transparent' }} onClick={() => { play('click'); setGame(r.id); }}>{r.label}</button>)}
          </div>
          <button className="sq-cta dark" disabled={!ready} onClick={join}>{full.length < 4 ? 'TYPE THE CODE' : !game ? 'PICK THE GAME' : 'JOIN ▸'}</button>
        </section>

        <button className="sq-cta" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'library', params: { kind: 'friends' } }); }}>HOST A ROOM ▸</button>

        {live.length > 0 && (
          <section className="sq-rows">
            <p className="sq-eyebrow k-done">Live now</p>
            {live.map((l) => (
              <button key={l.name} className="sq-row k-done" onClick={() => { play('open'); l.go(); }}>
                <span className="sq-live-dot" />
                <span className="main"><span className="name">{l.name}</span><span className="meta">{l.sub}</span></span>
                <span className="end">Rejoin</span>
              </button>
            ))}
          </section>
        )}

        <section>
          <p className="sq-eyebrow k-friends">Games you can play together</p>
          <div className="sq-grid">
            {together.map((i) => (
              <button key={i.id} className="sq-item k-friends" onClick={() => { play('click'); goTo(dispatch, i.go); }}>
                <span className="top"><Icon name={i.icon} /></span>
                <span className="name">{i.name}</span><span className="meta">{i.friends}</span>
              </button>
            ))}
            <div className="sq-item k-friends" style={{ cursor: 'default' }}><span className="top"><Icon name="heart" /></span><span className="name">Pass & play</span><span className="meta">any game, one phone</span></div>
          </div>
        </section>
      </div>
    </div>
  );
}
