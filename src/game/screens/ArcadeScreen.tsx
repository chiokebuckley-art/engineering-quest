import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ARCADE_ACADEMY_KINDS } from '../../engine/academy/generator';
import { useGame } from '../store';
import { Icon, Panel } from '../components/ui';
import { MathChallenge } from '../components/MathChallenge';
import { labeled, LabelKey } from '../components/Labeled';
import { Confetti, Callout } from '../components/Fx';
import { effectiveMastery, bandFor, BAND_COLORS, skillMastery } from '../../engine/mastery/MasteryEngine';
import { multFactId, factLabel } from '../../engine/curriculum/facts';
import { BOND_TARGETS } from '../../engine/curriculum/skills';
import { parseSelection, blitzStars, BLITZ_MS, BLITZ_OPTIONS_MS, CONQUER_POOL, bestKey } from '../../engine/state/arcade';
import { pausedPlaza } from '../../engine/state/plaza';
import type { ArcadeGame, ArcadeMode } from '../../engine/state/types';
import { VersusSetup, MATCH_LENGTHS } from './VersusScreen';
import { NavalBlitz } from '../naval/NavalBlitz';
import { OP_NAME, type WordKind } from '../../engine/questions/wordproblems';
import { TRICK_KINDS, type TrickKind } from '../../engine/questions/tricks';
import { MENTAL_KINDS, type MentalKind } from '../../engine/questions/mental';
import { VOLUME_KINDS, type VolumeKind } from '../../engine/questions/volume';
import { MEASURE_KINDS, MEASURE_PATH, type MeasureKind } from '../../engine/questions/measure';
import { PICTURE_GAMES } from '../../engine/questions/games';
import { MM_ARCADE_GROUPS } from '../../engine/questions/mentalmath';
import { SPEED_TARGETS_MS, SPEED_SET, SPEED_GOAL_MS, runsFor, passedTarget, nextTarget, summarizeRun, speedLabel } from '../../engine/state/speed';
import { SpeedData } from '../components/SpeedData';
import { ProgressData } from '../components/ProgressData';
import { initialLedger } from '../../engine/state/ledger';
import { ACADEMIES, coreChapters } from '../../engine/academy/registry';
import { academyUnlocked } from '../../engine/academy/AcademyEngine';
import { GRADES, GRADE_ARCADE, GRADE_GAME_DIFFICULTY, CONTEST_DISCLAIMER, arcadeAllowed, gameDifficulty, gradeDifficulty, timedModesAllowed, violatesCaps, type GradeId } from '../../engine/contest/grades';
import { LESSONS } from '../../content/lessons';
import { makeRoomCode, normalizeRoomCode } from '../net/room';
import type { ContestState } from '../../engine/contest/state';
import { CONTEST_GAME_IDS } from '../../engine/questions/games';
import type { GameState } from '../../engine/state/types';

const N = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/* ---------------- Contest Path grade caps ---------------- */

/** The grade whose caps apply right now: null when no grade is set or a grown-up turned the caps off. */
export const capGrade = (c: ContestState | undefined | null): GradeId | null => (c?.grade && c.caps ? c.grade : null);
/** "After a calm streak": this many right answers in a row opens Stud Math, Weakest Gear and Speed for Grade 3. */
export const CALM_STREAK = 10;
export const calmStreakDone = (s: GameState) => (s.stats.bestAnswerStreak ?? 0) >= CALM_STREAK;
const DIVISORS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const RANGES = [20, 100, 1000];
const WORD_KINDS: [WordKind, string][] = [['mixed', 'All kinds'], ['add', 'Addition'], ['sub', 'Subtraction'], ['mult', 'Multiplication'], ['div', 'Division'], ['twostep', 'Two-step']];
const ALG_KINDS = [['all', 'Both'], ['evaluate', 'Evaluate expressions'], ['onestep', 'One-step equations']] as const;
/** Every kind id the lobby offers for a game (the part after "game:"); 'all' means every kind mixed. */
export function lobbyKinds(game: ArcadeGame): string[] {
  if (game === 'mult') return ['all', ...N.map(String)];
  if (game === 'div') return ['all', ...DIVISORS.map(String)];
  if (game === 'add' || game === 'sub') return RANGES.map(String);
  if (game === 'bonds') return BOND_TARGETS.map(String);
  if (game === 'alg') return ALG_KINDS.map(([k]) => k);
  if (game === 'word') return WORD_KINDS.map(([k]) => k);
  if (game === 'tricks') return TRICK_KINDS.map((k) => k.id);
  if (game === 'mental') return MENTAL_KINDS.map((k) => k.id);
  if (game === 'volume') return VOLUME_KINDS.map((k) => k.id);
  if (game === 'measure') return MEASURE_KINDS.map((k) => k.id);
  if (game === 'mm') return MM_ARCADE_GROUPS.map((g) => g.id);
  if (game === 'frac' || game === 'ratio') return ['all', ...ARCADE_ACADEMY_KINDS[game].map((k) => k.id)];
  if (PICTURE_GAMES[game]) return PICTURE_GAMES[game].kinds.map((k) => k.id);
  if (game === 'mixed') return ['all'];
  return [];
}
/**
 * Kinds GRADE_ARCADE allows but whose generator still goes past the grade's caps now and then, so the capped lobby
 * keeps them out until grades.ts drops them or the generator is capped. Grade 3 Mental addition (mm:add) draws a sum
 * over 1,000 about once in 600 questions at every difficulty (529 + 498). The caps test says when a hold is no longer
 * needed.
 */
export const CAP_HOLD: Partial<Record<GradeId, Partial<Record<ArcadeGame, string[]>>>> = { g3: { mm: ['add'] } };
/**
 * May this grade use this kind? With no grade everything is allowed. 'all' (every kind mixed) needs every kind of the
 * game to be allowed; a single times-table fact needs both of its tables.
 */
export function kindOk(grade: GradeId | null, game: ArcadeGame, kind: string): boolean {
  if (!grade) return true;
  const list = GRADE_ARCADE[grade][game];
  if (!list || CAP_HOLD[grade]?.[game]?.includes(kind)) return false;
  if (list.includes('*')) return true;
  if (kind === 'all') return lobbyKinds(game).filter((k) => k !== 'all').every((k) => list.includes(k));
  const fact = /^fact:(\d+)x(\d+)$/.exec(kind);
  if (fact) return list.includes(fact[1]) && list.includes(fact[2]);
  return arcadeAllowed(grade, game, kind);
}
/** Is the game in this grade's lobby at all? (Academy drills and "Everything" never are while caps are on.) */
export const gameOk = (grade: GradeId | null, game: ArcadeGame) => !grade || (!!GRADE_ARCADE[grade][game] && lobbyKinds(game).some((k) => kindOk(grade, game, k)));
/**
 * The key a capped grade plays. Games grades.ts pins to a difficulty for the grade (GRADE_GAME_DIFFICULTY: Grade 1
 * word problems, sums, differences and cube stacks stay within 20 only at difficulty 1) carry that difficulty; other
 * open-ended picture games start at the grade's difficulty: "pattern:grow" → "pattern:grow@d2".
 */
export function cappedKey(grade: GradeId | null, game: ArcadeGame, key: string): string {
  if (!grade) return key;
  if (GRADE_GAME_DIFFICULTY[grade]?.[game]) return `${key}@d${gameDifficulty(grade, game)}`;
  return PICTURE_GAMES[game] ? `${key}@d${gradeDifficulty(grade)}` : key;
}
/** The selection key the lobby builds for one kind of a game. */
const keyFor = (game: ArcadeGame, kind: string) => (game === 'mixed' ? 'mixed:all' : `${game}:${kind}`);
/** Every selection the capped lobby can offer a grade (single tables and divisors; mixes of allowed ones stay allowed). */
export function gradeSelections(grade: GradeId): { game: ArcadeGame; key: string }[] {
  return ARCADE_GAMES.filter((g) => gameOk(grade, g.id)).flatMap((g) => lobbyKinds(g.id).filter((k) => kindOk(grade, g.id, k)).map((k) => ({ game: g.id, key: cappedKey(grade, g.id, keyFor(g.id, k)) })));
}
/** May this grade play this whole selection key ("mult:3,4", "mult:fact:3x4", "word:add@d1")? Kinds only, not size. */
export function selectionOk(grade: GradeId | null, game: ArcadeGame, selection: string): boolean {
  if (!grade) return true;
  const base = selection.replace(/@d[1-6]$/, '');
  const body = base.includes(':') ? base.slice(base.indexOf(':') + 1) : 'all';
  const kinds = (game === 'mult' || game === 'div') && body !== 'all' && !body.startsWith('fact:') ? body.split(',') : [body || 'all'];
  return gameOk(grade, game) && kinds.every((k) => kindOk(grade, game, k));
}
/**
 * Arcade runs started outside the lobby (train after a fight, the world map, a Gear Blitz, "Play again") meet the same
 * caps: a kind the grade may not play, a clock in Grade 1, or a size past the grade's (word:add at difficulty 2 for
 * Grade 1) is caught before the first question. Academy drills follow the academy a grown-up opened, so they pass.
 * Returns null when the run may go on; otherwise the nearest calm Practice the grade may play instead (or null).
 */
export function runCapIssue(grade: GradeId | null, game: ArcadeGame, selection: string, mode: ArcadeMode): { swap: string | null } | null {
  if (!grade || game === 'academy') return null;
  const base = selection.replace(/@d[1-6]$/, '');
  const kindsOk = selectionOk(grade, game, selection);
  const capped = cappedKey(grade, game, base);
  const sizeOk = parseSelection(game, selection).difficulty <= parseSelection(game, capped).difficulty;
  const clockOk = mode === 'practice' || timedModesAllowed(grade);
  if (kindsOk && sizeOk && clockOk) return null;
  const first = gameOk(grade, game) ? lobbyKinds(game).find((k) => kindOk(grade, game, k)) : undefined;
  return { swap: kindsOk ? capped : first ? cappedKey(grade, game, keyFor(game, first)) : null };
}
/** A skill id's Arcade game and kind ("volume.cubes" → volume/cubes, "word" → word/mixed, "trick.11" → tricks/11). */
export function skillKind(skill: string): { game: ArcadeGame; kind: string } | null {
  const dot = skill.indexOf('.');
  const head = dot < 0 ? skill : skill.slice(0, dot);
  const kind = dot < 0 ? '' : skill.slice(dot + 1);
  const named: Record<string, ArcadeGame> = { trick: 'tricks', tricks: 'tricks', prealg: 'alg', word: 'word', mental: 'mental', mm: 'mm', bonds: 'bonds', mult: 'mult', div: 'div', frac: 'frac', ratio: 'ratio' };
  const game = named[head] ?? (Object.keys(PICTURE_GAMES) as ArcadeGame[]).find((g) => PICTURE_GAMES[g].skill === head);
  if (!game) return null;
  return { game, kind: kind || (game === 'word' ? 'mixed' : 'all') };
}
/**
 * May a capped grade open this lesson? The lesson runner plays each practice step at the step's own difficulty, so
 * every step must use a kind the grade may play at no more than the difficulty the grade plays that game at
 * (gameDifficulty: Grade 1 cube stacks stay at difficulty 1, other Grade 1 picture games at 2). The teaching text
 * (what the teacher says, captions, practice intros) must keep within the grade's numbers too: "12 (cubes per layer)
 * × 2 (layers) = 24" is not a Grade 1 lesson.
 */
export function lessonOk(grade: GradeId | null, id: string): boolean {
  if (!grade) return true;
  const lesson = LESSONS.find((l) => l.id === id);
  if (!lesson) return false;
  const tries = lesson.steps.flatMap((s) => (s.type === 'try' ? [s] : []));
  const games = new Set<ArcadeGame>();
  for (const t of tries) {
    const sk = skillKind(t.skillId);
    if (!sk || !kindOk(grade, sk.game, sk.kind) || t.difficulty > gameDifficulty(grade, sk.game)) return false;
    games.add(sk.game);
  }
  const words = [lesson.summary, ...lesson.steps.map((s) => (s.type === 'try' ? s.intro : s.type === 'say' ? `${s.text} ${s.caption ?? ''}` : s.points.join(' ')))].join(' ');
  // A percent is fine in the one game whose kind is percent (violatesCaps knows it by name).
  const game = games.size === 1 ? [...games][0] : undefined;
  return !violatesCaps(grade, { prompt: words, expression: '', hint: '', answer: 0, game });
}
/**
 * Weakest Gear raises the difficulty with the chain (selection difficulty + half the chain, up to 6), so its math must
 * stay within the grade's numbers all the way up. These selections do not: Grade 3 word problems pass 1,000 at
 * difficulty 5 ("Sam had 488 gears. Then Jun brought 662 more."). The caps test says when a hold is no longer needed.
 */
export const RAMP_HOLD: Partial<Record<GradeId, string[]>> = { g3: ['word:mixed'] };
/**
 * A math picker list (Stud Math, Weakest Gear) cut to the kinds a capped grade may play; bonds need every target.
 * `ramp`: the game climbs to difficulty 6 (Weakest Gear), so RAMP_HOLD selections stay out too.
 */
export function capMath<T extends { game: ArcadeGame; selection: string }>(grade: GradeId | null, list: T[], ramp = false): T[] {
  return list.filter((m) => selectionOk(grade, m.game, m.game === 'bonds' ? 'bonds:all' : m.selection) && !(ramp && grade && RAMP_HOLD[grade]?.includes(m.selection)));
}
/** May a capped grade play a Weakest Gear game on this selection (a room someone else hosts, say)? */
export const gearSelectionOk = (grade: GradeId | null, game: ArcadeGame, key: string) => !grade || (selectionOk(grade, game, key) && !RAMP_HOLD[grade]?.includes(key));
/**
 * A friends' round (a Naval Blitz level) while capped. Grade 1 never plays one (it runs on a clock). Grades 3 and 5
 * said yes to the clock, so the level is checked like calm Practice: kinds and size. Levels the lobby sets up always
 * pass; a room someone else hosts plays the host's plan, which may not (Pre-algebra, Math tricks, Everything).
 */
export function versusCapIssue(grade: GradeId | null, game: ArcadeGame, selection: string): boolean {
  if (!grade) return false;
  if (!timedModesAllowed(grade)) return true;
  return game === 'academy' || runCapIssue(grade, game, selection, 'practice') !== null;
}

/**
 * The consent step before any clock while a grade is set (Grades 3 and 5; Grade 1 never sees a clock). Practice was
 * calm; the child says yes or keeps it calm.
 */
export function ClockConsent({ what, onYes, onNo, children }: { what: string; onYes: () => void; onNo: () => void; children?: ReactNode }) {
  const { play } = useGame();
  const ref = useRef<HTMLDivElement>(null);
  // Phones: the card may open below the fold, so bring it on screen.
  useEffect(() => { ref.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }); }, []);
  return (
    <div ref={ref} className="panel tight stack" role="dialog" aria-label="A round with a clock" style={{ marginBottom: 10 }}>
      <b>Practice was calm; this round has a clock. Want to try it?</b>
      <span className="small muted">{what} You can stop any time.</span>
      {children}
      <div className="row wrap">
        <button className="btn primary" onClick={onYes}>Yes, start the clock</button>
        <button className="btn ghost" onClick={() => { play('click'); onNo(); }}>No thanks, keep it calm</button>
      </div>
    </div>
  );
}

/** "Grade 1 Foundation · caps on" with the grown-up switch. Shows nothing when no grade is set. */
export function CapsStrip() {
  const { state, dispatch, play } = useGame();
  const [ask, setAsk] = useState(false);
  const c = state.contest;
  if (!c?.grade) return null;
  const g = GRADES[c.grade];
  return (
    <div className="caps-strip" role="status" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 10, border: '1px solid var(--line-soft)', background: 'rgba(0,0,0,0.3)', fontSize: '0.85rem' }}>
      <Icon name="shield" />
      <b>{g.title} · caps {c.caps ? 'on' : 'off'}</b>
      <span className="muted small">{c.caps ? `${g.track}: calm practice, numbers and games for Grade ${g.grade}.` : 'Every game, kind and clock is showing.'}</span>
      <span className="spacer" style={{ flex: 1 }} />
      {c.caps && !ask && <button className="btn small ghost" onClick={() => { play('click'); setAsk(true); }}>Show everything</button>}
      {c.caps && ask && (
        <span className="row wrap" style={{ gap: 6 }}>
          <span className="small">Grown-ups: show every game, kind and clock?</span>
          <button className="btn small" onClick={() => { play('click'); setAsk(false); dispatch({ type: 'CONTEST_SET_CAPS', on: false }); }}>Yes, show everything</button>
          <button className="btn small ghost" onClick={() => setAsk(false)}>Cancel</button>
        </span>
      )}
      {!c.caps && <button className="btn small primary" onClick={() => { play('click'); dispatch({ type: 'CONTEST_SET_CAPS', on: true }); }}>Turn caps back on</button>}
    </div>
  );
}

/**
 * Entry guard for games outside a grade's caps (Stud Math, Weakest Gear, Count Lab). `streak`: the game opens after a
 * calm streak; otherwise it is not on this grade's path. Returns null when the game may open.
 */
export function capsGateFor(s: GameState, rule: { notFor: GradeId[]; streakFor?: GradeId[] }): 'grade' | 'streak' | null {
  const grade = capGrade(s.contest);
  if (!grade) return null;
  if (rule.notFor.includes(grade)) return 'grade';
  if (rule.streakFor?.includes(grade) && !calmStreakDone(s)) return 'streak';
  return null;
}
export function CapsGate({ title, reason }: { title: string; reason: 'grade' | 'streak' }) {
  const { state, dispatch, play } = useGame();
  const g = state.contest?.grade ? GRADES[state.contest.grade] : null;
  const best = state.stats.bestAnswerStreak ?? 0;
  return (
    <div className="screen-scroll" style={{ background: 'url(/assets/environments/workshop-lab.svg) center / cover' }}>
      <div className="container stack" style={{ maxWidth: 620 }}>
        <CapsStrip />
        <Panel title={title} icon={reason === 'streak' ? 'lock' : 'shield'}>
          {reason === 'grade'
            ? <p>{title} is not on the {g?.title ?? 'grade'} path. Calm practice and picture puzzles are waiting in the Arcade.</p>
            : <p>{title} opens after a calm streak: get {CALM_STREAK} answers right in a row in calm Practice. Your best streak so far is {best}.</p>}
          <div className="row wrap">
            <button className="btn primary" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'arcade' }); }}>Back to the Arcade</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/**
 * A room someone else hosts plays the host's choice. When that choice is outside the grade's path, this calm card
 * takes the place of the game and offers a way out (Naval Blitz levels, Weakest Gear arenas, Tycoon tables).
 */
export function CapsRoomGuard({ title, text, actions, className }: { title: string; text: string; actions: { label: string; primary?: boolean; onClick: () => void }[]; className?: string }) {
  const { play } = useGame();
  return (
    <div className={`screen-scroll ${className ?? ''}`} style={className ? undefined : { background: 'url(/assets/environments/workshop-lab.svg) center / cover' }}>
      <div className="container stack" style={{ maxWidth: 620 }}>
        <CapsStrip />
        <Panel title={title} icon="shield">
          <p>{text}</p>
          <div className="row wrap">
            {actions.map((x) => <button key={x.label} className={`btn ${x.primary ? 'primary' : 'ghost'}`} onClick={() => { play('click'); x.onClick(); }}>{x.label}</button>)}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/**
 * Entry guard for a whole screen that runs on a clock (the Rocket Game). With no grade (or caps off) it shows the
 * screen as before; Grade 1 meets the "not on your path" card; Grades 3 and 5 say yes first. A yes given in the
 * Arcade lobby comes along as screenParams.clock = 'yes', so the child is not asked twice. Usage in RocketScreen:
 * `return <ClockGate title="Rocket Game" what="...">{state.rocket ? <RocketRun /> : <MissionSelect />}</ClockGate>;`
 */
export function ClockGate({ title, what, children }: { title: string; what: string; children: ReactNode }) {
  const { state, dispatch } = useGame();
  const grade = capGrade(state.contest);
  const [yes, setYes] = useState(() => state.screenParams?.clock === 'yes');
  if (!grade) return <>{children}</>;
  if (!timedModesAllowed(grade)) return <CapsGate title={title} reason="grade" />;
  if (yes) return <>{children}</>;
  return (
    <div className="screen-scroll" style={{ background: 'url(/assets/environments/workshop-lab.svg) center / cover' }}>
      <div className="container stack" style={{ maxWidth: 620 }}>
        <CapsStrip />
        <ClockConsent what={what} onYes={() => setYes(true)} onNo={() => dispatch({ type: 'NAVIGATE', screen: 'arcade' })} />
      </div>
    </div>
  );
}
/** What the Rocket Game's clock does, for the consent card (the Arcade lobby and ClockGate say the same). */
export const ROCKET_CLOCK = 'Rocket Game: every question has its own clock, and a wrong answer or an expired clock costs one life.';

export function ArcadeScreen() {
  const { state } = useGame();
  if (state.arcade) {
    const a = state.arcade;
    const grade = capGrade(state.contest);
    // Friends' rounds: a level outside the grade's path (a host's plan when joining a room) is sat out or left.
    if (a.versus) return a.status !== 'finished' && versusCapIssue(grade, a.game, a.selection) ? <CapsVersusGuard /> : <ArcadeRun />;
    const issue = runCapIssue(grade, a.game, a.selection, a.mode);
    return issue ? <CapsRunGuard swap={issue.swap} /> : <ArcadeRun />;
  }
  return <ArcadeLobby />;
}

/** A Naval Blitz level outside the grade's path: sit it out (it scores 0) or leave the match. Grade 1 only leaves. */
function CapsVersusGuard() {
  const { state, dispatch } = useGame();
  const a = state.arcade!;
  const grade = capGrade(state.contest)!;
  const g = GRADES[grade];
  const sel = parseSelection(a.game, a.selection);
  const sitOut = timedModesAllowed(grade);
  // Everyone's round ends at the deadline: sit the level out then, so the match never waits on this phone.
  useEffect(() => {
    if (!sitOut || a.deadlineAt === undefined) return;
    const t = setInterval(() => { if (Date.now() >= (a.deadlineAt ?? 0)) dispatch({ type: 'ARCADE_TIMEOUT' }); }, 500);
    return () => clearInterval(t);
  }, [sitOut, a.deadlineAt, dispatch]);
  return (
    <CapsRoomGuard
      title={`Naval Blitz · ${sel.label}`}
      text={sitOut
        ? `This level of the match is ${sel.label}, which goes past the ${g.title} path. Sit this level out (it scores 0 for you) and you are back in for the next one, or leave the match.`
        : `Friends' rounds run on a clock, so they are not on the ${g.title} path. Calm practice and picture puzzles are waiting in the Arcade.`}
      actions={[
        ...(sitOut ? [{ label: 'Sit this level out', primary: true, onClick: () => dispatch({ type: 'ARCADE_TIMEOUT' }) }] : []),
        { label: 'Leave the match', primary: !sitOut, onClick: () => dispatch({ type: 'VERSUS_EXIT' }) },
      ]}
    />
  );
}

/** A run from outside the lobby that the grade's caps do not cover: offer the nearest calm Practice, or a way back. */
function CapsRunGuard({ swap }: { swap: string | null }) {
  const { state, dispatch, play } = useGame();
  const a = state.arcade!;
  const grade = capGrade(state.contest)!;
  const g = GRADES[grade];
  const sel = parseSelection(a.game, a.selection);
  const alt = swap ? parseSelection(a.game, swap) : null;
  const sameKind = !!swap && swap.replace(/@d[1-6]$/, '') === a.selection.replace(/@d[1-6]$/, '');
  const pt = state.world.pendingTraining;
  const why = a.mode !== 'practice' && !timedModesAllowed(grade) ? `${sel.label} has a clock, and the ${g.title} path stays calm.`
    : sameKind ? `${sel.label} goes past the ${g.title} numbers here.`
    : `${sel.label} is not on the ${g.title} path.`;
  return (
    <div className="screen-scroll" style={{ background: 'url(/assets/environments/workshop-lab.svg) center / cover' }}>
      <div className="container stack" style={{ maxWidth: 620 }}>
        <CapsStrip />
        <Panel title={sel.label} icon="shield">
          <p>{why} {alt ? `Calm practice at ${g.title} size is ready instead.` : 'Calm practice and picture puzzles are waiting in the Arcade.'}</p>
          <div className="row wrap">
            {alt && swap && <button className="btn primary" onClick={() => { play('open'); dispatch({ type: 'ARCADE_START', game: a.game, mode: 'practice', selection: swap }); }}>Practise {alt.label}</button>}
            {pt && <button className="btn" onClick={() => { play('click'); dispatch({ type: 'PLAY_RETURN' }); }}>Return to the fight ▸</button>}
            <button className={`btn ${alt ? 'ghost' : 'primary'}`} onClick={() => { play('click'); dispatch({ type: 'ARCADE_EXIT' }); }}>Back to the Arcade</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export const ARCADE_GAMES: { id: ArcadeGame; label: string; icon: string; blurb: string }[] = [
  { id: 'mult', label: 'Times tables', icon: 'multiply', blurb: 'Pick a table, several, or one fact on the chart.' },
  { id: 'div', label: 'Division', icon: 'divide', blurb: 'Division facts ÷2 to ÷12 — multiplication in reverse.' },
  { id: 'add', label: 'Addition', icon: 'plus', blurb: 'Sums to 20, 100 or 1000.' },
  { id: 'sub', label: 'Subtraction', icon: 'rock', blurb: 'Differences to 20, 100 or 1000.' },
  { id: 'frac', label: 'Fractions', icon: 'fraction', blurb: 'Shaded parts, equal fractions, comparing, adding, and fractions of amounts.' },
  { id: 'ratio', label: 'Ratios', icon: 'ratio', blurb: 'Ratio tables, sharing in a ratio, unit rates, recipes, proportions and scale drawings.' },
  { id: 'bonds', label: 'Number bonds', icon: 'star', blurb: 'What makes 5, 10, 50, 100?' },
  { id: 'alg', label: 'Pre-algebra', icon: 'book', blurb: 'Evaluate expressions and solve one-step equations.' },
  { id: 'word', label: 'Word problems', icon: 'scroll', blurb: 'Read the story, spot the operation, solve it.' },
  { id: 'tricks', label: 'Math tricks', icon: 'brain', blurb: '×11, squares ending in 5, same tens with units that make 10.' },
  { id: 'mental', label: 'Mental + and −', icon: 'abacus', blurb: 'Two-digit sums and differences in your head: tens first, make a ten, round, count the distance.' },
  { id: 'volume', label: 'Volume', icon: 'flask', blurb: 'Measure what a tank, crate or jug holds: count cubes, multiply sides, read the water line.' },
  { id: 'measure', label: 'Measuring', icon: 'ruler', blurb: 'Read rulers, tapes, dials, thermometers and clocks. Estimate, convert units, perimeter vs area.' },
  ...(['geo', 'rates', 'fit', 'phys', 'pipe', 'prob', 'spiral', 'precalc'] as const).map((id) => ({ id, label: PICTURE_GAMES[id].label, icon: PICTURE_GAMES[id].icon, blurb: PICTURE_GAMES[id].blurb })),
  ...(['pattern', 'blocks', 'paths', 'data', 'logic', 'pctmulti', 'grid'] as const).map((id) => ({ id, label: PICTURE_GAMES[id].label, icon: PICTURE_GAMES[id].icon, blurb: PICTURE_GAMES[id].blurb })),
  { id: 'mm', label: 'Mental Math Blitz', icon: 'brain', blurb: 'Academy problems with no paper and no scaffolding: two- and three-digit sums, differences and products.' },
  { id: 'mixed', label: 'Everything', icon: 'gear', blurb: 'All of the above, shuffled.' },
  { id: 'academy', label: 'Academy drills', icon: 'reactor', blurb: 'Practise any chapter of the academies you have opened, from integers to differential equations.' },
];

function ArcadeLobby() {
  const { state, dispatch, play } = useGame();
  // Contest Path caps: with a grade set (and caps on) only that grade's games, kinds and calm modes are offered.
  const grade = capGrade(state.contest);
  const ok = (g: ArcadeGame, k: string | number) => kindOk(grade, g, String(k));
  /** The current pick if the grade allows it, else the first allowed option. */
  const fit = <T extends string | number>(g: ArcadeGame, cur: T, options: readonly T[]): T => (ok(g, cur) ? cur : options.find((o) => ok(g, o)) ?? cur);
  const shown = ARCADE_GAMES.filter((g) => gameOk(grade, g.id));
  // The Library set-up card's "+ more…" and "Who" open the full lobby on its game (params.game) and friends card (params.friends).
  const [chosen, setGame] = useState<ArcadeGame>(() => (ARCADE_GAMES.some((g) => g.id === state.screenParams.game) ? state.screenParams.game as ArcadeGame : 'mult'));
  const game: ArcadeGame = shown.some((g) => g.id === chosen) ? chosen : shown[0]?.id ?? 'mult';
  const [pickedTables, setTables] = useState<number[]>([]);
  const [pickedFact, setFact] = useState<string | null>(null);
  const [pickedDivisors, setDivisors] = useState<number[]>([]);
  const tables = pickedTables.filter((n) => ok('mult', n));
  const fact = pickedFact && ok('mult', `fact:${pickedFact}`) ? pickedFact : null;
  const divisors = pickedDivisors.filter((n) => ok('div', n));
  const [pickedBond, setBond] = useState(10);
  const bond = fit('bonds', pickedBond, BOND_TARGETS);
  const [pickedRange, setRange] = useState(20);
  const range = fit(game === 'sub' ? 'sub' : 'add', pickedRange, RANGES);
  const [pickedAlg, setAlg] = useState<'all' | 'evaluate' | 'onestep'>('all');
  const alg = fit('alg', pickedAlg, ALG_KINDS.map(([k]) => k));
  const [pickedWord, setWord] = useState<WordKind>('mixed');
  const word = fit('word', pickedWord, WORD_KINDS.map(([k]) => k));
  const [pickedTrick, setTrick] = useState<TrickKind>('all');
  const trick = fit('tricks', pickedTrick, TRICK_KINDS.map((k) => k.id));
  const [pickedMental, setMental] = useState<MentalKind>('all');
  const mental = fit('mental', pickedMental, MENTAL_KINDS.map((k) => k.id));
  const [pickedVolume, setVolume] = useState<VolumeKind>('all');
  const volume = fit('volume', pickedVolume, VOLUME_KINDS.map((k) => k.id));
  const [pickedMeasure, setMeasure] = useState<MeasureKind>('all');
  const measure = fit('measure', pickedMeasure, MEASURE_KINDS.map((k) => k.id));
  const [pickedKinds, setKinds] = useState<Record<string, string>>({});
  const kinds: Record<string, string> = { ...pickedKinds, [game]: fit(game, pickedKinds[game] ?? 'all', lobbyKinds(game)) };
  const [pickedMm, setMmGroup] = useState('all');
  const mmGroup = fit('mm', pickedMm, MM_ARCADE_GROUPS.map((g) => g.id));
  /** Grade 1: no clocks at all. Grades 3 and 5: clocks after a consent step. Speed waits for a calm streak in Grade 3. */
  const clocks = !grade || timedModesAllowed(grade);
  const speedLocked = grade === 'g3' && !calmStreakDone(state);
  /** Play with friends is a Naval Blitz on a clock: never in Grade 1, after a yes in Grades 3 and 5. */
  const friendsOk = clocks;
  const inviteCode = typeof state.screenParams.room === 'string' ? state.screenParams.room : '';
  // A friend's invite link opens the friends card straight away with no grade; with one it asks first (Grade 1: never).
  const [consent, setConsent] = useState<ArcadeMode | 'versus' | 'rocket' | null>(() => (grade && (inviteCode || state.screenParams.friends) && friendsOk ? 'versus' : null));
  const openAcademies = ACADEMIES.filter((a) => academyUnlocked(state, a.id) && a.chapters.length);
  const [acad, setAcad] = useState(() => { const a = [...openAcademies].reverse()[0]; const c = a ? coreChapters(a)[0] : undefined; return a && c ? `${a.id}.${c.key}` : 'arithmetic.count'; });
  const [duration, setDuration] = useState(BLITZ_MS);
  const [target, setTarget] = useState(5000);
  const [versus, setVersus] = useState((!!inviteCode || !!state.screenParams.friends) && !grade);
  const versusRef = useRef<HTMLDivElement>(null);
  // Phones: the friends card sits below the chart, so bring it on screen when it opens.
  useEffect(() => { if (versus) setTimeout(() => versusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }, [versus]);
  const rec = state.stats.arcade;
  const now = Date.now();

  const baseSelection =
    game === 'bonds' ? `bonds:${bond}`
    : game === 'div' ? (divisors.length ? `div:${[...divisors].sort((a, b) => a - b).join(',')}` : 'div:all')
    : game === 'add' || game === 'sub' ? `${game}:${range}`
    : game === 'alg' ? `alg:${alg}`
    : game === 'word' ? `word:${word}`
    : game === 'tricks' ? `tricks:${trick}`
    : game === 'mental' ? `mental:${mental}`
    : game === 'volume' ? `volume:${volume}`
    : game === 'measure' ? `measure:${measure}`
    : game === 'mm' ? `mm:${mmGroup}`
    : game === 'frac' || game === 'ratio' ? `${game}:${kinds[game] ?? 'all'}`
    : PICTURE_GAMES[game] ? `${game}:${kinds[game] ?? 'all'}`
    : game === 'mixed' ? 'mixed:all'
    : game === 'academy' ? `academy:${acad}`
    : fact ? `mult:fact:${fact}` : tables.length ? `mult:${[...tables].sort((a, b) => a - b).join(',')}` : 'mult:all';
  const selection = cappedKey(grade, game, baseSelection);
  const sel = parseSelection(game, selection);
  const best = rec.bests[bestKey(sel.key, duration)];
  const stars = (n: number) => blitzStars(n, duration, game);
  const conq = rec.conquered[sel.key];
  const speed = state.stats.speed ?? { facts: {}, runs: [] };
  const lastRun = runsFor(speed, game, sel.key)[0];
  const start = (mode: ArcadeMode) => { play(mode === 'blitz' ? 'boss-roar' : 'open'); dispatch({ type: 'ARCADE_START', game, mode, selection, durationMs: duration, targetMs: target }); };
  /** A clocked mode: straight in with no grade, after a yes with one (Grades 3 and 5). */
  const startClock = (mode: ArcadeMode) => { if (grade) { play('click'); setConsent(mode); } else start(mode); };
  // With a grade the child has just said yes to the clock here, so the Rocket Game does not ask again.
  const openRocket = () => { play('click'); dispatch(grade ? { type: 'NAVIGATE', screen: 'rocket', params: { clock: 'yes' } } : { type: 'NAVIGATE', screen: 'rocket' }); };
  const toggleFriends = () => { play('click'); if (versus) setVersus(false); else if (grade) setConsent('versus'); else setVersus(true); };
  const consentText = consent === 'blitz' ? 'Blitz: answer as many as you can before the time runs out.'
    : consent === 'speed' ? `Speed: ${SPEED_SET} questions, each on its own clock.`
    : consent === 'conquer' ? 'Conquer: each answer has to be quick to count.'
    : consent === 'versus' ? `Play with friends: a Naval Blitz, ${duration / 1000} seconds a level, the same questions for everyone.`
    : ROCKET_CLOCK;
  const consentYes = () => { const m = consent; setConsent(null); if (m === 'versus') { play('click'); setVersus(true); } else if (m === 'rocket') openRocket(); else if (m) start(m); };
  const toggleTable = (n: number) => { if (!ok('mult', n)) return; setFact(null); setTables((t) => (t.includes(n) ? t.filter((x) => x !== n) : [...t, n])); };
  const toggleDiv = (n: number) => setDivisors((t) => (t.includes(n) ? t.filter((x) => x !== n) : [...t, n]));
  const pickFact = (a: number, b: number) => { if (!ok('mult', `fact:${a}x${b}`)) return; setTables([]); const k = `${Math.min(a, b)}x${Math.max(a, b)}`; setFact((f) => (f === k ? null : k)); };
  const conqueredTables = N.filter((n) => rec.conquered[`mult:${n}`]).length;
  const current = ARCADE_GAMES.find((g) => g.id === game)!;

  return (
    <div className="screen-scroll" style={{ background: 'url(/assets/environments/workshop-lab.svg) center / cover' }}>
      <div className="container stack" style={{ maxWidth: 900 }}>
        <div className="row wrap">
          <h2 className="brass">Arcade</h2>
          <button className="btn primary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'visual-library', params: { practice: 'choice' } })}>Name the Image</button>
          <span className="spacer" />
          {grade !== 'g1' && <button className="btn small" onClick={() => { if (grade) { play('click'); setConsent('rocket'); } else openRocket(); }}>🚀 Rocket Game</button>}
          {(!grade || gameOk(grade, 'word')) && <button className="btn small" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'millionaire' }); }}>💰 Millionaire</button>}
          {grade !== 'g1' && <button className="btn small" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'stud' }); }}>🂡 Stud Math{grade === 'g3' && !calmStreakDone(state) ? ' · after a calm streak' : ''}</button>}
          <button className="btn small" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'dice' }); }}>⚄ Dice Workshop</button>
          {grade !== 'g1' && <button className="btn small" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'gear' }); }}>⚙ Weakest Gear{grade === 'g3' && !calmStreakDone(state) ? ' · after a calm streak' : ''}</button>}
          <button className="btn small" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'plaza' }); }}>▦ Equation Plaza{state.plaza && state.plaza.phase !== 'over' || pausedPlaza(state.stats.plaza) ? ' · resume' : ''}</button>
          <button className="btn small" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'tycoon' }); }}>🏙 Engine City Tycoon</button>
          {grade !== 'g1' && grade !== 'g3' && <button className="btn small" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'countlab' })}>♠ Count Lab · Parent PIN</button>}
          <button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'library' })}>Library ›</button>
        </div>
        <CapsStrip />
        {grade && consent === 'rocket' && <ClockConsent what={consentText} onYes={consentYes} onNo={() => setConsent(null)} />}
        {grade && !friendsOk && inviteCode && <p className="small muted" role="note" style={{ margin: 0 }}>A friend sent a room link. Friends' rounds run on a clock, so they are not on the {GRADES[grade].title} path.</p>}
        {(() => {
          const tab = (g: (typeof ARCADE_GAMES)[number]) => (
            <button key={g.id} className={`game-tab ${game === g.id ? 'on' : ''}`} onClick={() => { play('click'); setGame(g.id); setVersus(false); setConsent(null); }}>
              <Icon name={g.icon} /><span>{g.label}</span>
            </button>
          );
          if (!grade) return <div className="game-tabs">{ARCADE_GAMES.map(tab)}</div>;
          // Capped: the grade's games, then the Contest Path games in their own group.
          const contest = shown.filter((g) => (CONTEST_GAME_IDS as readonly string[]).includes(g.id));
          return (
            <>
              <div className="game-tabs">{shown.filter((g) => !contest.includes(g)).map(tab)}</div>
              {contest.length > 0 && (
                <div className="stack" style={{ gap: 4 }}>
                  <div className="row wrap" style={{ gap: 6 }}><b className="brass">Contest Path</b><span className="small muted">Picture puzzles for {GRADES[grade].track}</span></div>
                  <div className="game-tabs">{contest.map(tab)}</div>
                  <p className="small muted" style={{ margin: 0, fontSize: '0.7rem' }}>{CONTEST_DISCLAIMER}</p>
                </div>
              )}
            </>
          );
        })()}

        {game === 'mult' && (
          <Panel title="Pick a table or a fact" icon="abacus" right={<span className="chip">{conqueredTables}/12 tables conquered</span>}>
            <p className="small muted">Tap a <b>×N</b> header to pick a table (tap more to mix). Tap one square to drill just that fact. Colours show how well you know each fact.</p>
            <div className="chart-wrap">
              <table className="chart">
                <thead>
                  <tr>
                    <th className="corner" onClick={() => { setTables([]); setFact(null); }}>×</th>
                    {N.map((c) => <th key={c} className={tables.includes(c) ? 'on' : ''} onClick={() => toggleTable(c)}>{c}{rec.conquered[`mult:${c}`] && <i className="crown">♛</i>}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {N.map((r) => (
                    <tr key={r}>
                      <th className={tables.includes(r) ? 'on' : ''} onClick={() => toggleTable(r)}>{r}{rec.conquered[`mult:${r}`] && <i className="crown">♛</i>}</th>
                      {N.map((c) => {
                        const fid = multFactId(r, c);
                        const m = state.mastery[fid] ? effectiveMastery(state.mastery[fid], now) : -1;
                        const inSel = fact ? fact === `${Math.min(r, c)}x${Math.max(r, c)}` : tables.length ? tables.includes(r) || tables.includes(c) : true;
                        const color = m < 0 ? 'rgba(148,163,184,0.12)' : BAND_COLORS[bandFor(m)];
                        return (
                          <td key={c} className={`${inSel ? 'in' : 'out'} ${fact === `${Math.min(r, c)}x${Math.max(r, c)}` ? 'sel' : ''}`} style={{ ['--c' as string]: color, ['--a' as string]: m < 0 ? 0.15 : 0.25 + (m / 100) * 0.6 }} onClick={() => pickFact(r, c)} title={`${r} × ${c} = ${r * c}${m >= 0 ? ` · ${m}%` : ''}`}>
                            {r * c}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row wrap small" style={{ marginTop: 6 }}>
              {(['Learning', 'Developing', 'Competent', 'Nearly Mastered', 'Mastered'] as const).map((b) => <span key={b} className="chip" style={{ borderColor: BAND_COLORS[b], color: BAND_COLORS[b] }}>{b}</span>)}
              <span className="chip">grey = not seen yet</span>
            </div>
          </Panel>
        )}

        {game === 'div' && (
          <Panel title="Pick divisors" icon="divide">
            <p className="small muted">{current.blurb} Tap one or more. None selected = all of them.</p>
            <div className="table-pick">
              {DIVISORS.filter((d) => ok('div', d)).map((d) => { const m = skillMastery(`div.${d}`, state.mastery, now); return <button key={d} className={divisors.includes(d) ? 'on' : ''} onClick={() => toggleDiv(d)}>÷{d}{rec.conquered[`div:${d}`] ? ' ♛' : ''}<i style={{ width: `${m}%` }} /></button>; })}
            </div>
          </Panel>
        )}

        {(game === 'add' || game === 'sub') && (
          <Panel title={game === 'add' ? 'Addition' : 'Subtraction'} icon={current.icon}>
            <p className="small muted">{grade ? `${game === 'add' ? 'Sums' : 'Differences'} to ${RANGES.filter((r) => ok(game, r)).join(', ')}.` : current.blurb}</p>
            <div className="row wrap">
              {RANGES.filter((r) => ok(game, r)).map((r) => <button key={r} className={`btn big ${range === r ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setRange(r); }}>to {r}</button>)}
            </div>
            <p className="small muted" style={{ marginTop: 8 }}>Mastery: {Math.round(skillMastery(game === 'add' ? 'add.basic' : 'sub.basic', state.mastery, now))}%</p>
          </Panel>
        )}

        {game === 'bonds' && (
          <Panel title="Make the number" icon="star">
            <p className="small muted">{grade === 'g1' ? 'Number bonds are pairs that add up to a total. 3 + ? = 5. 7 + ? = 10. 12 + ? = 20. Pick a target.' : 'Number bonds are pairs that add up to a total. 7 + ? = 10. 8 + ? = 15. 35 + ? = 50. 64 + ? = 100. Pick a target: to 20 every number counts, past 20 the bonds go by fives.'}</p>
            {[{ label: 'Up to 20', targets: BOND_TARGETS.filter((t) => t <= 20 && ok('bonds', t)) }, { label: 'By fives to 100', targets: BOND_TARGETS.filter((t) => t > 20 && ok('bonds', t)) }].filter((g) => g.targets.length).map((g) => (
              <div key={g.label} style={{ marginTop: 6 }}>
                <div className="small muted" style={{ marginBottom: 4 }}>{g.label}</div>
                <div className="bond-grid">
                  {g.targets.map((t) => { const m = Math.round(skillMastery(`bonds.${t}`, state.mastery, now)); return (
                    <button key={t} className={`btn bond ${bond === t ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setBond(t); }} title={`Make ${t}: ${m}% mastered`}>
                      <b>{t}</b><small>{rec.conquered[`bonds:${t}`] ? '♛ ' : ''}{m}%</small>
                    </button>
                  ); })}
                </div>
              </div>
            ))}
          </Panel>
        )}

        {game === 'alg' && (
          <Panel title="Pre-algebra" icon="book">
            <p className="small muted">A letter stands for a number. <b>Evaluate</b>: 2x + 3 when x = 4. <b>Solve</b>: x + 7 = 12, 3x = 21. New to this? Take the lessons "What Is a Variable?" and "Solving Equations" first.</p>
            <div className="row wrap">
              {ALG_KINDS.filter(([k]) => ok('alg', k)).map(([k, l]) => <button key={k} className={`btn ${alg === k ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setAlg(k); }}>{l}</button>)}
              <span className="spacer" />
              <button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'lessons' })}><Icon name="scroll" /> Lessons</button>
            </div>
            <div className="row wrap" style={{ marginTop: 8 }}>
              <span className="chip">Expressions: {Math.round(skillMastery('prealg.expressions', state.mastery, now))}%</span>
              <span className="chip">Equations: {Math.round(skillMastery('prealg.equations', state.mastery, now))}%</span>
            </div>
          </Panel>
        )}

        {game === 'word' && (
          <Panel title="Word problems" icon="scroll" right={<button className="btn small" onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'millionaire' }); }}>💰 Millionaire</button>}>
            <p className="small muted">A story with a math job inside. Pick the kind of job to practise. After each answer you see <b>which operation</b> it was and <b>why</b>.</p>
            <div className="row wrap">
              {WORD_KINDS.filter(([k]) => ok('word', k)).map(([k, l]) => <button key={k} className={`btn ${word === k ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setWord(k); }}>{l}</button>)}
              <span className="spacer" />
              {lessonOk(grade, 'l.word-detective') && <button className="btn small ghost" onClick={() => { play('click'); dispatch({ type: 'START_LESSON', lessonId: 'l.word-detective' }); }}><Icon name="book" /> Detective lesson</button>}
            </div>
            <div className="row wrap" style={{ marginTop: 8 }}>
              {(['add', 'sub', 'mult', 'div', 'twostep'] as const).filter((k) => ok('word', k)).map((k) => <span key={k} className="chip">{k === 'twostep' ? 'Two-step' : OP_NAME[k]}: {Math.round(skillMastery(`word.${k}`, state.mastery, now))}%</span>)}
            </div>
          </Panel>
        )}

        {game === 'tricks' && (
          <Panel title="Mental math tricks" icon="brain">
            <p className="small muted"><b>×11:</b> 43 × 11 → 4 _ 3, put 4 + 3 in the gap → 473. <b>Squares ending in 5:</b> 75² → 7 × 8 = 56, attach 25 → 5625. <b>Same tens, units make 10:</b> 86 × 84 → 8 × 9 = 72 | 6 × 4 = 24 → 7224. Learn each one in its lesson, then drill here.</p>
            <div className="row wrap">
              {TRICK_KINDS.filter((k) => ok('tricks', k.id)).map((k) => <button key={k.id} className={`btn ${trick === k.id ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setTrick(k.id); }}>{k.label}</button>)}
            </div>
            <div className="row wrap" style={{ marginTop: 8 }}>
              {([['l.trick-11', '×11'], ['l.trick-sq5', '…5²'], ['l.trick-same10', 'Same tens']] as const).filter(([id]) => lessonOk(grade, id)).map(([id, l]) => <button key={id} className="btn small ghost" onClick={() => { play('click'); dispatch({ type: 'START_LESSON', lessonId: id }); }}><Icon name="book" /> Lesson: {l}</button>)}
            </div>
            <div className="row wrap" style={{ marginTop: 8 }}>
              {TRICK_KINDS.filter((k) => k.id !== 'all' && ok('tricks', k.id)).map((k) => <span key={k.id} className="chip">{k.short}: {Math.round(skillMastery(`trick.${k.id}`, state.mastery, now))}%</span>)}
            </div>
          </Panel>
        )}

        {game === 'mental' && (
          <Panel title="Mental addition & subtraction" icon="abacus">
            <p className="small muted">See tens and ones, not one big number. <b>Tens first</b> (43 + 25 → 63 → 68). <b>Round & compensate</b> (47 + 38 → 47 + 40 − 2). <b>Make a ten</b> (58 + 27 → 60 + 25). <b>Count the distance</b> (83 − 47: 3 + 30 + 3). Every answer's "Show me how" names the best move and draws it on a number line.</p>
            <div className="row wrap">
              {MENTAL_KINDS.filter((k) => ok('mental', k.id)).map((k) => <button key={k.id} className={`btn ${mental === k.id ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setMental(k.id); }}>{k.label}</button>)}
            </div>
            <div className="row wrap" style={{ marginTop: 8 }}>
              {([['l.mental-tens', '1: Tens first'], ['l.mental-make10', '2: Make a ten'], ['l.mental-distance', '3: Count the distance']] as const).filter(([id]) => lessonOk(grade, id)).map(([id, l]) => <button key={id} className="btn small ghost" onClick={() => { play('click'); dispatch({ type: 'START_LESSON', lessonId: id }); }}><Icon name="book" /> Lesson {l}</button>)}
            </div>
            <div className="row wrap" style={{ marginTop: 8 }}>
              {MENTAL_KINDS.filter((k) => k.id !== 'all' && ok('mental', k.id)).map((k) => <span key={k.id} className="chip">{k.short}: {Math.round(skillMastery(`mental.${k.id}`, state.mastery, now))}%</span>)}
            </div>
          </Panel>
        )}

        {game === 'volume' && (
          <Panel title="Measuring volume" icon="flask">
            <p className="small muted">{grade && !ok('volume', 'prism') ? (grade === 'g1' ? <>Volume is how much space something takes up. <b>Count the cubes</b> in the picture: count one row, then the next, then the layer on top.</> : <>Volume is how much space something takes up. <b>Count the cubes</b>: count one layer, then count the layers (one layer × layers).</>) : <>Volume is how much space something takes up. Every question shows the thing you are measuring. <b>Count the cubes</b> (one layer × layers). <b>Length × width × height</b> for a box, in cm³. <b>Read the jug</b>: work out what one mark is worth first. <b>Water displacement</b>: drop it in, the rise is its volume. 1 cm³ = 1 mL.</>}</p>
            <div className="row wrap">
              {VOLUME_KINDS.filter((k) => ok('volume', k.id)).map((k) => <button key={k.id} className={`btn ${volume === k.id ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setVolume(k.id); }}>{k.label}</button>)}
            </div>
            <div className="row wrap" style={{ marginTop: 8 }}>
              {([['l.volume-cubes', '1: Fill it with cubes'], ['l.volume-jug', '2: Read the jug'], ['l.volume-formula', '3: Sides and missing sides']] as const).filter(([id]) => lessonOk(grade, id)).map(([id, l]) => <button key={id} className="btn small ghost" onClick={() => { play('click'); dispatch({ type: 'START_LESSON', lessonId: id }); }}><Icon name="book" /> Lesson {l}</button>)}
            </div>
            <div className="row wrap" style={{ marginTop: 8 }}>
              {VOLUME_KINDS.filter((k) => k.id !== 'all' && ok('volume', k.id)).map((k) => <span key={k.id} className="chip">{k.short}: {Math.round(skillMastery(`volume.${k.id}`, state.mastery, now))}%</span>)}
            </div>
          </Panel>
        )}

        {game === 'measure' && (
          <Panel title="Measurement" icon="ruler">
            <p className="small muted">{grade === 'g1' ? <><b>Compare</b>: which is longer, taller or heavier? Look at both, line them up from the same start, then answer.</> : <>Ten steps, every time: <b>what</b> are we measuring, in which <b>unit</b>, with which <b>tool</b>, what does each <b>mark</b> mean, <b>estimate</b>, <b>read</b> it with its unit, <b>convert</b> if needed, how <b>accurate</b> must it be, <b>use</b> it, then <b>check</b> it makes sense. Changing the unit changes the description, not the thing: a 12-inch board is a 1-foot board.</>}</p>
            <div className="row wrap">
              {MEASURE_KINDS.filter((k) => ok('measure', k.id)).map((k) => <button key={k.id} className={`btn ${measure === k.id ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setMeasure(k.id); }}>{k.label}</button>)}
            </div>
            <div className="row wrap" style={{ marginTop: 8 }}>
              {([['l.measure-what', '1: What are we measuring?'], ['l.measure-marks', '2: Between the marks'], ['l.measure-zero', '3: Estimate, start at zero'], ['l.measure-convert', '4: Change the unit'], ['l.measure-around', '5: Around or inside'], ['l.measure-timetemp', '6: Time and temperature'], ['l.measure-loop', '7: The engineer\'s loop']] as const).filter(([id]) => lessonOk(grade, id)).map(([id, l]) => <button key={id} className="btn small ghost" onClick={() => { play('click'); dispatch({ type: 'START_LESSON', lessonId: id }); }}><Icon name="book" /> {l}</button>)}
            </div>
            <div className="row wrap" style={{ marginTop: 8 }}>
              {MEASURE_KINDS.filter((k) => k.id !== 'all' && ok('measure', k.id)).map((k) => <span key={k.id} className="chip">{k.short}: {Math.round(skillMastery(`measure.${k.id}`, state.mastery, now))}%</span>)}
            </div>
            {grade !== 'g1' && <details className="measure-path" style={{ marginTop: 10 }}>
              <summary className="small"><b>The measurement path</b> · estimate → measure → calculate → build → check → explain</summary>
              <ol className="small">
                {MEASURE_PATH.map((p) => (
                  <li key={p.stage}><b>{p.stage}</b> <span className="muted">({p.grades})</span> — {p.teach} {p.inGame.length ? <span className="chip">in the game: {p.inGame.join(', ')}</span> : <span className="chip muted">coming</span>}</li>
                ))}
              </ol>
            </details>}
          </Panel>
        )}

        {(game === 'frac' || game === 'ratio') && (() => { const list = ARCADE_ACADEMY_KINDS[game]; const cur = kinds[game] ?? 'all'; return (
          <Panel title={game === 'frac' ? 'Fractions' : 'Ratios'} icon={game === 'frac' ? 'fraction' : 'ratio'}>
            <p className="small muted">{game === 'frac' ? `A fraction is part of a whole: the bottom number says how many equal parts, the top says how many you have. ${ok(game, 'all') ? 'Pick one kind of question, or mix them all.' : 'Pick one kind of question.'}` : 'A ratio compares amounts: 2 : 3 means 2 of one for every 3 of the other. Scale both sides by the same number and the ratio stays the same.'}</p>
            <div className="row wrap">
              {ok(game, 'all') && <button className={`btn ${cur === 'all' ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setKinds((m) => ({ ...m, [game]: 'all' })); }}>Every kind</button>}
              {list.filter((k) => ok(game, k.id)).map((k) => <button key={k.id} className={`btn ${cur === k.id ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setKinds((m) => ({ ...m, [game]: k.id })); }}>{k.label}</button>)}
            </div>
            {cur !== 'all' && <p className="small muted" style={{ marginTop: 6 }}>{list.find((k) => k.id === cur)?.desc}</p>}
            <div className="row wrap" style={{ marginTop: 8 }}><span className="chip">{game === 'frac' ? 'Fractions' : 'Ratios'} mastery: {Math.round(skillMastery(game, state.mastery, now))}%</span></div>
          </Panel>
        ); })()}

        {PICTURE_GAMES[game] && !['volume', 'measure'].includes(game) && (() => { const pg = PICTURE_GAMES[game]; const cur = kinds[game] ?? 'all'; return (
          <Panel title={pg.label} icon={pg.icon}>
            <p className="small muted">{pg.intro}</p>
            <div className="row wrap">
              {pg.kinds.filter((k) => ok(game, k.id)).map((k) => <button key={k.id} className={`btn ${cur === k.id ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setKinds((m) => ({ ...m, [game]: k.id })); }}>{k.label}</button>)}
            </div>
            {cur !== 'all' && <p className="small muted" style={{ marginTop: 6 }}>{pg.kinds.find((k) => k.id === cur)?.desc}</p>}
            {game === 'prob' && <div className="row wrap" style={{ marginTop: 8 }}><button className="btn small primary" onClick={() => { play('open'); dispatch({ type: 'NAVIGATE', screen: 'workshop' }); }}><Icon name="telescope" /> Open the Model Workshop</button></div>}
            <div className="row wrap" style={{ marginTop: 8 }}>
              {pg.lessons.filter(([id]) => lessonOk(grade, id)).map(([id, l]) => <button key={id} className="btn small ghost" onClick={() => { play('click'); dispatch({ type: 'START_LESSON', lessonId: id }); }}><Icon name="book" /> {l}</button>)}
            </div>
            <div className="row wrap" style={{ marginTop: 8 }}>
              {pg.kinds.filter((k) => k.id !== 'all' && ok(game, k.id)).map((k) => <span key={k.id} className="chip">{k.short}: {Math.round(skillMastery(`${pg.skill}.${k.id}`, state.mastery, now))}%</span>)}
            </div>
          </Panel>
        ); })()}

        {game === 'mm' && (
          <Panel title="Mental Math Blitz" icon="brain">
            <p className="small muted">Problems straight from the Mental Math Academy, with nothing shown but the numbers. Every answer here also trains the Academy skill it came from, so blitz progress and Academy mastery are the same progress.</p>
            <div className="row wrap">
              {MM_ARCADE_GROUPS.filter((g) => ok('mm', g.id)).map((g) => <button key={g.id} className={`btn ${mmGroup === g.id ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setMmGroup(g.id); }}>{g.label}</button>)}
            </div>
            <div className="row wrap" style={{ marginTop: 8 }}>
              <button className="btn small primary" onClick={() => { play('open'); dispatch({ type: 'NAVIGATE', screen: 'mental' }); }}><Icon name="brain" /> Open the Academy</button>
              <span className="small muted">Learn the strategies first; blitz them here.</span>
            </div>
          </Panel>
        )}

        {game === 'academy' && (
          <Panel title="Academy drills" icon="reactor">
            <p className="small muted">Every chapter of an open academy can be drilled here. Answers count toward that chapter's fluency gate.</p>
            {openAcademies.map((a) => (
              <div key={a.id} style={{ marginBottom: 8 }}>
                <div className="small brass" style={{ marginBottom: 4 }}>{a.name}</div>
                <div className="row wrap">
                  {coreChapters(a).map((c) => { const k = `${a.id}.${c.key}`; return <button key={k} className={`btn small ${acad === k ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setAcad(k); }}>{c.n}. {c.title}</button>; })}
                </div>
              </div>
            ))}
          </Panel>
        )}

        {game === 'mixed' && (
          <Panel title="Everything mixed" icon="gear">
            <p className="small muted">Times tables, division, addition, subtraction, number bonds and pre-algebra, all shuffled together. The real test.</p>
          </Panel>
        )}

        {versus && friendsOk && <div ref={versusRef} style={{ scrollMarginTop: 8 }}>{grade
          ? <CappedVersus game={game} selection={selection} durationMs={duration} onClose={() => setVersus(false)} initialCode={inviteCode || undefined} />
          : <VersusSetup game={game} selection={selection} durationMs={duration} onClose={() => setVersus(false)} initialCode={inviteCode || undefined} />}</div>}
        {(() => {
          const speedRow = (
            <div className="row wrap" style={{ marginBottom: 6 }}>
              <span className="small muted">Speed clock:</span>
              {SPEED_TARGETS_MS.map((ms) => <button key={ms} className={`btn small ${target === ms ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setTarget(ms); }}>{ms / 1000} s</button>)}
              <span className="small muted">· goal {SPEED_GOAL_MS / 1000} s</span>
            </div>
          );
          const blitzRow = (
            <div className="row wrap" style={{ marginBottom: 10 }}>
              <span className="small muted">Blitz time:</span>
              {BLITZ_OPTIONS_MS.map((ms) => <button key={ms} className={`btn small ${duration === ms ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setDuration(ms); }}>{ms / 1000}s</button>)}
            </div>
          );
          return (
            <Panel title={`Play: ${sel.label}`} icon="target" right={friendsOk ? <button className={`btn small ${versus ? 'primary' : ''}`} onClick={toggleFriends}><Icon name="sword" /> Play with friends</button> : undefined}>
              {!grade && <>{speedRow}{blitzRow}</>}
              {grade && consent && consent !== 'rocket' && (
                <ClockConsent key={consent} what={consentText} onYes={consentYes} onNo={() => setConsent(null)}>
                  {consent === 'speed' && speedRow}
                  {(consent === 'blitz' || consent === 'versus') && blitzRow}
                </ClockConsent>
              )}
              <div className="modes">
                <button className="mode" onClick={() => start('practice')}>
                  <Icon name="book" className="xl" />
                  <b>Practice</b>
                  <small>No timer. Hints and "show me how". Stop any time.</small>
                </button>
                {clocks && <button className="mode blitz" onClick={() => startClock('blitz')}>
                  <Icon name="hourglass" className="xl" />
                  <b>Blitz · {duration / 1000} s</b>
                  <small>{game === 'word' ? 'How many stories can you solve? Read fast, think first.' : game === 'mental' ? 'Timed two-digit sums. See the structure, not the digits.' : game === 'mm' ? 'No paper, no chunks on screen. Hold the number and move it.' : PICTURE_GAMES[game] ? 'Every question is a picture. Read it, measure it, answer in the unit shown.' : game === 'tricks' ? 'Use the trick, not long multiplication. Speed comes with practice.' : 'How many can you get? Combos multiply your score.'}</small>
                  <span className="best">{best ? `Best ${best.score} pts · ${best.correct} right ${'★'.repeat(stars(best.correct))}` : 'No score yet'}</span>
                </button>}
                {clocks && <button className="mode speed" disabled={speedLocked} onClick={() => startClock('speed')}>
                  <Icon name={speedLocked ? 'lock' : 'energy'} className="xl" />
                  <b>Speed · {target / 1000} s</b>
                  <small>{speedLocked ? `Opens after a calm streak: ${CALM_STREAK} right in a row in Practice.` : `${SPEED_SET} questions, each on a ${target / 1000}-second clock. Pass at 90 % right and on time, then tighten the clock.`}</small>
                  <span className="best">{lastRun ? `Last: ${lastRun.onTime}/${lastRun.n} on the ${lastRun.targetMs / 1000} s clock · avg ${(lastRun.avgMs / 1000).toFixed(1)} s` : 'No speed data yet'}</span>
                </button>}
                {clocks && <button className="mode conquer" onClick={() => startClock('conquer')}>
                  <Icon name="medal" className="xl" />
                  <b>Conquer</b>
                  <small>{sel.facts.length ? 'Beat every fact fast. Misses come back until you win.' : `Beat ${CONQUER_POOL} in a row, each one fast. Misses come back.`}</small>
                  <span className="best">{conq ? `♛ Conquered in ${(conq.timeMs / 1000).toFixed(0)} s` : 'Not conquered yet'}</span>
                </button>}
              </div>
            </Panel>
          );
        })()}
        <ProgressData ledger={state.stats.ledger ?? initialLedger()} game={game} selectionKey={sel.key} label={sel.label} />
        {clocks && <SpeedData speed={speed} game={game} selectionKey={sel.key} label={sel.label} />}
      </div>
    </div>
  );
}

/**
 * Play with friends while a grade is set (Grades 3 and 5, after the clock consent): the same Naval Blitz, but every
 * level plays the game and kind picked in the lobby at the grade's size, instead of the ramp through every game.
 * Joining a room plays the host's plan.
 */
function CappedVersus({ game, selection, durationMs, onClose, initialCode }: { game: ArcadeGame; selection: string; durationMs: number; onClose: () => void; initialCode?: string }) {
  const { state, dispatch, play } = useGame();
  const [kind, setKind] = useState<'hotseat' | 'online'>(initialCode ? 'online' : 'hotseat');
  const [names, setNames] = useState<string[]>([state.character?.name ?? 'Me', '']);
  const [code, setCode] = useState(initialCode ?? '');
  const [count, setCount] = useState(3);
  const cleanCode = normalizeRoomCode(code);
  const sel = parseSelection(game, selection);
  const levels = Array.from({ length: count }, () => ({ game, selection }));
  const start = () => {
    play('boss-roar');
    if (kind === 'hotseat') dispatch({ type: 'VERSUS_SETUP', kind, game, selection, names: names.filter((n, i) => i === 0 || n.trim()), durationMs, levels });
    else dispatch({ type: 'VERSUS_SETUP', kind, game, selection, names: [state.character?.name ?? 'Host'], roomCode: makeRoomCode(), isHost: true, durationMs, levels });
  };
  const join = () => {
    if (cleanCode.length < 4) return;
    play('open');
    dispatch({ type: 'VERSUS_SETUP', kind: 'online', game, selection, names: [state.character?.name ?? 'Player'], roomCode: cleanCode, isHost: false, durationMs });
  };
  return (
    <Panel title={`Naval Blitz · ${sel.label}`} icon="sword" right={<button className="btn small ghost" onClick={onClose}>Close</button>}>
      <p className="small muted">Correct answers fire shells. Everyone gets the same questions, {durationMs / 1000} seconds a level, and the highest score wins the level. Every level is <b>{sel.label}</b>.</p>
      <div className="row wrap" style={{ margin: '8px 0' }}>
        <button className={`btn ${kind === 'hotseat' ? 'primary' : 'ghost'}`} onClick={() => setKind('hotseat')}><Icon name="home" /> Pass & Play (one device)</button>
        <button className={`btn ${kind === 'online' ? 'primary' : 'ghost'}`} onClick={() => setKind('online')}><Icon name="circuit" /> Online Room (own phones)</button>
      </div>
      <div className="row wrap" style={{ marginBottom: 8 }}>
        <span className="small muted">Levels:</span>
        {MATCH_LENGTHS.map((n) => <button key={n} className={`btn small ${count === n ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setCount(n); }}>{n}</button>)}
      </div>
      {kind === 'hotseat' && (
        <div className="stack">
          {names.map((n, i) => (
            <div key={i} className="row">
              <span className="chip" style={{ minWidth: 70 }}>Player {i + 1}</span>
              <input className="text" style={{ flex: 1 }} value={n} placeholder={i === 0 ? 'You' : 'Name'} onChange={(e) => setNames((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))} maxLength={16} aria-label={`Player ${i + 1} name`} />
              {i > 1 && <button className="btn small ghost" onClick={() => setNames((arr) => arr.filter((_, j) => j !== i))}>✕</button>}
            </div>
          ))}
          <div className="row wrap">
            {names.length < 6 && <button className="btn small" onClick={() => setNames((arr) => [...arr, ''])}>+ Add player</button>}
            <span className="spacer" />
            <button className="btn primary big" disabled={!names[1]?.trim()} onClick={start}><Icon name="sword" /> Start match</button>
          </div>
        </div>
      )}
      {kind === 'online' && (
        <div className="grid-2">
          <div className="panel tight stack">
            <b>Host a room</b>
            <p className="small muted">You get a 4-letter code. Friends type it on their phones. You pick when to start.</p>
            <button className="btn primary" onClick={start}><Icon name="unlock" /> Create room</button>
          </div>
          <div className="panel tight stack">
            <b>Join a room</b>
            <form className="row" onSubmit={(e) => { e.preventDefault(); join(); }}>
              <input className="text code" type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="CODE" autoCapitalize="characters" autoCorrect="off" autoComplete="off" spellCheck={false} inputMode="text" enterKeyHint="go" aria-label="Room code" />
              <button type="submit" className="btn primary" disabled={cleanCode.length < 4}>Join</button>
            </form>
            <p className="small muted">The host picks the math for a room you join. If a level goes past the {GRADES[capGrade(state.contest) ?? 'g5'].title} path, you sit it out (it scores 0) or leave.</p>
          </div>
        </div>
      )}
    </Panel>
  );
}

function ArcadeRun() {
  const { state } = useGame();
  const a = state.arcade!;
  void a; void state;
  return <ArcadeRunInner />;
}

function ArcadeRunInner() {
  const { state, dispatch, play } = useGame();
  const a = state.arcade!;
  const isVersus = !!a.versus && !!state.versus;
  const [left, setLeft] = useState(a.durationMs);
  const [burst, setBurst] = useState(0);
  const [callout, setCallout] = useState<{ n: number; text: string }>({ n: 0, text: '' });
  const [explain, setExplain] = useState(false);
  useEffect(() => { setExplain(false); }, [a.question.id]);
  const sel = parseSelection(a.game, a.selection);
  const correct = a.results.filter((r) => r.correct).length;
  const done = a.status === 'finished';

  // Speed: per-question clock.
  const [qLeft, setQLeft] = useState(a.targetMs ?? 0);
  useEffect(() => {
    if (a.mode !== 'speed' || done || !a.targetMs) return;
    const t = setInterval(() => setQLeft(a.feedback ? qLeft : (a.targetMs ?? 0) - (Date.now() - a.questionStartedAt)), 100);
    return () => clearInterval(t);
  }, [a.mode, a.targetMs, a.questionStartedAt, a.feedback, done, qLeft]);
  // Blitz countdown.
  useEffect(() => {
    if (a.mode !== 'blitz' || done) return;
    const t = setInterval(() => {
      const l = Math.max(0, (a.deadlineAt ?? 0) - Date.now());
      setLeft(l);
      if (l <= 0) dispatch({ type: 'ARCADE_TIMEOUT' });
    }, 100);
    return () => clearInterval(t);
  }, [a.mode, a.deadlineAt, done, dispatch]);

  // Combo callouts and finish fanfare.
  useEffect(() => {
    if (a.feedback?.correct && a.combo > 0 && a.combo % 5 === 0 && a.attempts === 1) { setCallout({ n: Date.now(), text: `COMBO ×${a.combo}!` }); play('combo'); }
  }, [a.feedback, a.combo, a.attempts, play]);
  useEffect(() => { if (done && !isVersus) { setBurst(Date.now()); play(a.mode === 'conquer' ? 'fanfare' : 'victory'); } }, [done, a.mode, isVersus, play]);
  // Blitz: advance automatically after a short beat so the pace stays high.
  useEffect(() => {
    if ((a.mode !== 'blitz' && a.mode !== 'speed') || !a.feedback || done) return;
    const t = setTimeout(() => dispatch({ type: 'ARCADE_NEXT' }), a.mode === 'speed' ? (a.feedback.correct ? 700 : 1800) : a.game === 'word' ? (a.feedback.correct ? 1600 : 3200) : a.versus ? (a.feedback.correct ? 300 : 900) : a.feedback.correct ? 450 : 1400);
    return () => clearTimeout(t);
  }, [a.feedback, a.mode, done, dispatch]);

  const title = a.mode === 'blitz' ? 'BLITZ' : a.mode === 'conquer' ? 'CONQUER' : a.mode === 'speed' ? `SPEED · ${(a.targetMs ?? 0) / 1000} s` : 'PRACTICE';
  // Online rounds start at a shared moment: hold the board until then.
  const notYet = a.deadlineAt !== undefined && a.startedAt > Date.now();
  if (isVersus) return <NavalBlitz left={left} done={done} notYet={notYet} />;
  return (
    <div className="scene" style={{ backgroundImage: 'url(/assets/environments/workshop-lab.svg)' }}>
      <Confetti trigger={burst} />
      <Callout text={callout.text} trigger={callout.n} />
      <div className="scene-header">
        <div className="loc"><h2>{isVersus ? 'VERSUS BLITZ' : a.reward === 'gears' ? 'GEAR BLITZ' : title} · {sel.label}</h2></div>
        <span className="spacer" />
        {!isVersus && <button className="btn small ghost" onClick={() => dispatch({ type: 'ARCADE_EXIT' })}>{done ? (a.reward === 'gears' ? 'Back to the Stud table' : 'Back') : a.reward === 'gears' ? 'Cash out' : 'Stop'}</button>}
      </div>
      {!isVersus && state.world.pendingTraining && (() => {
        const pt = state.world.pendingTraining;
        const here = pt.game === a.game && pt.selection === a.selection;
        const right = a.results.filter((r) => r.correct).length;
        return (
          <div className={`training-trip ${pt.earned ? 'earned' : ''}`}>
            <Icon name={pt.earned ? 'shield' : 'target'} />
            <span>{pt.earned ? `Shield earned for the fight you left. Go back and use it.` : here ? `Training ${pt.label} for the fight you left: ${Math.min(right, 5)}/5 right to earn a shield.` : `You left a fight to train ${pt.label}.`}</span>
            <button className={`btn small ${pt.earned ? 'primary' : 'ghost'}`} onClick={() => dispatch({ type: 'PLAY_RETURN' })}>Return to the fight ▸</button>
          </div>
        );
      })()}
      <div className="arcade-hud">
        {a.mode === 'blitz' && <div className={`timer-big ${left < 10_000 ? 'hot' : ''}`}>{(left / 1000).toFixed(1)}s</div>}
        {a.mode === 'conquer' && <div className="timer-big">{a.conquered.length}/{a.conquered.length + a.remaining.length}</div>}
        {a.mode === 'practice' && <div className="timer-big">{correct}/{a.results.length}</div>}
        {a.mode === 'speed' && !done && <div className={`timer-big ${qLeft <= 0 ? 'hot' : qLeft < 1500 ? 'warm' : ''}`}>{(Math.max(0, qLeft) / 1000).toFixed(1)}s</div>}
        {a.mode === 'speed' && <div className="score"><b>{a.results.length}/{a.setSize}</b><small>done</small></div>}
        {a.mode === 'speed' && <div className="score"><b>{a.results.filter((r) => r.correct && r.timeMs <= (a.targetMs ?? 0)).length}</b><small>on time</small></div>}
        {a.mode === 'speed' && <div className="bar thick" style={{ flex: 1 }}><i style={{ width: `${Math.max(0, Math.min(100, (qLeft / (a.targetMs ?? 1)) * 100))}%`, background: qLeft <= 0 ? 'var(--red)' : qLeft < 1500 ? 'var(--amber)' : 'var(--teal)' }} /></div>}
        <div className="score"><b>{a.score}</b><small>points</small></div>
        <div className="score"><b>{a.combo}</b><small>combo</small></div>
        {a.mode === 'blitz' && <div className="bar thick" style={{ flex: 1 }}><i style={{ width: `${(left / a.durationMs) * 100}%`, background: left < 10_000 ? 'var(--red)' : 'var(--teal)' }} /></div>}
        {a.mode === 'conquer' && (
          <div className="conq-dots">{[...a.conquered.map((f) => ({ f, ok: true })), ...a.remaining.map((f) => ({ f, ok: false }))].map((x, i) => <i key={i} className={x.ok ? 'ok' : ''} title={factLabel(x.f)} />)}</div>
        )}
      </div>
      <div className="scene-body">
        {!done && notYet && <div className="container center"><h1 className="brass">GO!</h1></div>}
        {!done && !notYet && (
          <div className="container" style={{ width: '100%', maxWidth: 760 }}>
            <MathChallenge
              question={a.question}
              feedback={a.feedback}
              onSubmit={(given) => dispatch({ type: 'ARCADE_ANSWER', given })}
              onNext={() => dispatch({ type: 'ARCADE_NEXT' })}
              hintShown={true}
              showExplanation={explain}
              onToggleExplanation={() => setExplain((v) => !v)}
              nextLabel={a.feedback && !a.feedback.correct && a.attempts < 2 && a.mode !== 'blitz' ? 'Try again' : 'Next'}
              showTimer={a.mode !== 'blitz' && !(capGrade(state.contest) && a.mode === 'practice')}
              compact
            />
            {a.game === 'word' && a.feedback && (a.feedback.correct || a.attempts >= 2) && a.question.word && (
              <div className="why-box">
                <span className="tag">{a.question.word.structure}</span>
                <b>{a.question.word.ops.map((o) => OP_NAME[o]).join(', then ')} → {labeled(`${a.question.word.setup ?? a.question.word.layout} = ${a.question.word.result ?? a.question.answer}`)}</b>
                <p>{a.question.word.why}</p>{a.question.word.setup && <LabelKey />}
              </div>
            )}
          </div>
        )}
        {done && !isVersus && <ArcadeResult />}
        {done && isVersus && (
          <div className="container" style={{ width: '100%', maxWidth: 620 }}>
            <div className="panel center stack">
              <h1 className="brass">TIME'S UP</h1>
              <div className="stat-grid"><div className="st"><b>{a.score}</b><span>points</span></div><div className="st"><b>{correct}</b><span>correct</span></div><div className="st"><b>{a.bestCombo}</b><span>best combo</span></div></div>
              <button className="btn primary big" onClick={() => { play('open'); dispatch({ type: 'VERSUS_CONTINUE' }); }}>{state.versus!.kind === 'hotseat' ? (state.versus!.turn + 1 < state.versus!.players.length ? `Pass to ${state.versus!.players[state.versus!.turn + 1].name}` : 'See results') : 'See results'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ArcadeResult() {
  const { state, dispatch, play } = useGame();
  const a = state.arcade!;
  const correct = a.results.filter((r) => r.correct).length;
  const secs = Math.round(((a.mode === 'blitz' ? a.durationMs : Date.now() - a.startedAt)) / 1000);
  const stars = a.mode === 'blitz' ? blitzStars(correct, a.durationMs, a.game) : a.mode === 'conquer' ? 3 : 0;
  const missed = a.results.filter((r) => !r.correct && r.factId).map((r) => r.factId!);
  const speedSum = a.mode === 'speed' && a.targetMs ? summarizeRun(a.results, a.targetMs) : null;
  const passed = speedSum ? passedTarget(speedSum) : false;
  const nt = a.targetMs ? nextTarget(a.targetMs) : null;
  const slowest = a.mode === 'speed' ? a.results.slice().sort((x, y) => y.timeMs - x.timeMs).slice(0, 5) : [];
  return (
    <div className="container" style={{ width: '100%', maxWidth: 620 }}>
      <div className="panel center">
        <h1 className="brass">{a.mode === 'conquer' ? 'CONQUERED!' : a.mode === 'blitz' ? "TIME'S UP" : a.mode === 'speed' ? (passed ? 'CLOCK BEATEN!' : 'SET DONE') : 'NICE WORK'}</h1>
        {stars > 0 && <div className="stars">{'★'.repeat(stars)}<span className="dim">{'★'.repeat(3 - stars)}</span></div>}
        {a.newBest && a.mode !== 'speed' && <div className="chip ok" style={{ margin: '6px 0' }}>NEW BEST!</div>}
        {speedSum && (
          <div className="stat-grid">
            <div className="st"><b>{speedSum.onTime}/{speedSum.n}</b><span>on the {(a.targetMs ?? 0) / 1000} s clock</span></div>
            <div className="st"><b>{speedSum.correct}/{speedSum.n}</b><span>correct</span></div>
            <div className="st"><b>{(speedSum.avgMs / 1000).toFixed(1)}s</b><span>average</span></div>
            <div className="st"><b>{(speedSum.medianMs / 1000).toFixed(1)}s</b><span>median</span></div>
            <div className="st"><b>{(speedSum.bestMs / 1000).toFixed(1)}s</b><span>fastest</span></div>
          </div>
        )}
        {speedSum && <p className="small muted">{passed ? (nt ? `Passed. Next clock: ${nt / 1000} s.` : 'You are at the 3-second goal. Keep it there.') : `To pass: ${Math.ceil(speedSum.n * 0.9)} right and ${Math.ceil(speedSum.n * 0.9)} on time. Slowest this set: ${slowest.map((r) => `${r.factId ? speedLabel(r.factId) : '?'} ${(r.timeMs / 1000).toFixed(1)}s`).join(' · ')}.`}</p>}
        {a.reward === 'gears' && <div className="chip ok" style={{ margin: '6px 0' }}>⚙ +{correct * 5 + stars * 20} gears for the Stud table</div>}
        {!speedSum && <div className="stat-grid">
          <div className="st"><b>{a.score}</b><span>points</span></div>
          <div className="st"><b>{correct}</b><span>correct</span></div>
          <div className="st"><b>{a.bestCombo}</b><span>best combo</span></div>
          <div className="st"><b>{secs}s</b><span>time</span></div>
        </div>}
        {missed.length > 0 && <p className="small muted">Missed: {Array.from(new Set(missed)).map(factLabel).join(' · ')}. These come back more often now.</p>}
        <div className="row wrap" style={{ justifyContent: 'center' }}>
          {speedSum && passed && nt && <button className="btn primary big" onClick={() => { play('open'); dispatch({ type: 'ARCADE_START', game: a.game, mode: 'speed', selection: a.selection, targetMs: nt }); }}>Try the {nt / 1000} s clock</button>}
          <button className={`btn big ${speedSum && passed && nt ? '' : 'primary'}`} onClick={() => { play('open'); dispatch({ type: 'ARCADE_START', game: a.game, mode: a.mode, selection: a.selection, durationMs: a.durationMs, reward: a.reward, targetMs: a.targetMs }); }}>{speedSum ? `Again at ${(a.targetMs ?? 0) / 1000} s` : 'Play again'}</button>
          <button className="btn" onClick={() => dispatch({ type: 'ARCADE_EXIT' })}>{a.reward === 'gears' ? 'Back to the Stud table' : 'Change table'}</button>
        </div>
      </div>
    </div>
  );
}


