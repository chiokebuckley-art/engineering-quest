import { useRef, useState } from 'react';
import { useGame } from '../store';
import { Icon } from '../components/ui';
import { levelFromXp } from '../../engine/progression/xp';
import { ACHIEVEMENTS } from '../../engine/progression/achievements';
import { effectiveMastery } from '../../engine/mastery/MasteryEngine';
import { dueEntries, activeEntries } from '../../engine/notebook/notebook';
import { dueItems } from '../../engine/srs/SpacedRepetitionEngine';
import { worldView } from '../../engine/state/world';
import { saveEngineCard } from '../components/World';
import { parentView, weekStart } from '../../engine/contest/plan';
import { GRADES } from '../../engine/contest/grades';
import { TABLE_ORDER } from '../../engine/curriculum/skills';
import { COUNT_LAB_ENABLED } from '../../engine/countlab/engine';
import type { Screen } from '../../engine/state/types';

/** Hold for this long to open the grown-ups page (a child tapping through will not land there by accident). */
const HOLD_MS = 600;

function MeRow({ icon, name, meta, k, onClick, chev = true, hold }: { icon: string; name: string; meta?: string; k?: string; onClick?: () => void; chev?: boolean; hold?: () => void }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);
  const holdProps = hold ? {
    onPointerDown: () => { setHolding(true); timer.current = setTimeout(() => { setHolding(false); hold(); }, HOLD_MS); },
    onPointerUp: () => { setHolding(false); if (timer.current) clearTimeout(timer.current); },
    onPointerLeave: () => { setHolding(false); if (timer.current) clearTimeout(timer.current); },
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hold(); } },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  } : {};
  return (
    <button className={`sq-row ${k ? `k-${k}` : ''}`} onClick={hold ? undefined : onClick} {...holdProps} style={holding ? { borderColor: 'var(--violet)', background: '#2a1a5c' } : undefined}>
      <span className="sq-tile sm" style={k ? undefined : { color: 'var(--text-2)', boxShadow: 'none' }}><Icon name={icon} /></span>
      <span className="main"><span className="name">{name}</span></span>
      {meta && <span className="end">{meta}</span>}
      {chev && <span className="chev">›</span>}
    </button>
  );
}

/* ================================================================== */
/* 2l Me                                                               */
/* ================================================================== */

export function MeScreen() {
  const { state, dispatch, play } = useGame();
  const [shared, setShared] = useState('');
  const c = state.character;
  if (!c) return null;
  const lv = levelFromXp(c.xp);
  const go = (screen: Screen) => { play('click'); dispatch({ type: 'NAVIGATE', screen }); };
  const v = worldView(state);
  const cores = [v.cores.mult, v.cores.div, v.cores.frac].filter(Boolean).length;
  const facts = Object.values(state.mastery).filter((r) => r.id.startsWith('fact:') && effectiveMastery(r) >= 90).length;
  const badges = Object.keys(state.achievements).length;
  const fix = dueEntries(state.notebook ?? []).length;
  const srs = dueItems(state.mastery).length;
  const streak = state.stats.dayStreak ?? 0;
  const items = Object.values(state.inventory.items).reduce((n, x) => n + (x ?? 0), 0);

  return (
    <div className="sq">
      <div className="sq-in">
        <section className="sq-me-hero">
          <img src={c.avatar} alt="" />
          <h2>{c.name}</h2>
          <span className="line">Lv {lv.level} · {c.title}{streak > 0 ? ` · 🔥 ${streak}-day streak` : ''}</span>
          <div className="sq-chips" style={{ justifyContent: 'center', marginTop: 4 }}>
            <button className="sq-chip" onClick={() => go('menu')}>Switch player</button>
            <button className="sq-chip" onClick={async () => { const r = await saveEngineCard(state); setShared(r === 'shared' ? 'Shared!' : r === 'downloaded' ? 'Saved!' : 'Could not save'); setTimeout(() => setShared(''), 2000); }}>{shared || 'Share my Engine'}</button>
          </div>
        </section>

        <div className="sq-stats">
          <div className="sq-stat k-drill"><b>{cores}</b><small>cores</small></div>
          <div className="sq-stat k-learn"><b>{facts}</b><small>facts mastered</small></div>
          <div className="sq-stat k-play"><b>{badges}</b><small>badges</small></div>
        </div>

        <section className="sq-rows">
          <MeRow icon="book" k={fix ? 'fix' : 'done'} name="Notebook" meta={fix ? `${fix} due` : 'all fixed'} onClick={() => go('notebook')} />
          <MeRow icon="dashboard" name="Progress & stats" meta={srs ? `${srs} to review` : '7 / 30 / 90 days'} onClick={() => go('dashboard')} />
          <MeRow icon="hourglass" name="Speed data" meta={`${TABLE_ORDER.length}×12 heat grid`} onClick={() => { play('click'); dispatch({ type: 'NAVIGATE', screen: 'arcade', params: { game: 'mult' } }); }} />
          <MeRow icon="skill-tree" name="Skill tree" meta={`${facts} mastered`} onClick={() => go('skilltree')} />
          <MeRow icon="trophy" name="Badges & titles" meta={`${badges} / ${ACHIEVEMENTS.length}`} onClick={() => go('achievements')} />
          <MeRow icon="backpack" name="Gear & inventory" meta={items ? `${items} items` : 'goggles, calipers…'} onClick={() => go('inventory')} />
          <MeRow icon="quest" name="Quest log" meta={`${Object.values(state.quests).filter((q) => q.status === 'active').length} active`} onClick={() => go('quests')} />
          <MeRow icon="lock" k="friends" name="Grown-ups" meta="hold to open" hold={() => { play('open'); dispatch({ type: 'NAVIGATE', screen: 'grownups' }); }} />
          <MeRow icon="settings" name="Settings" meta="sound, motion, voice" onClick={() => go('settings')} />
        </section>
      </div>
    </div>
  );
}

/* ================================================================== */
/* 2n Me · Grown-ups                                                   */
/* ================================================================== */

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function GrownupsScreen() {
  const { state, dispatch, play, profiles, sync } = useGame();
  const c = state.character;
  if (!c) return null;
  const go = (screen: Screen, params?: Record<string, string>) => { play('click'); dispatch({ type: 'NAVIGATE', screen, params }); };
  const grade = state.contest.grade;
  const pv = parentView(state.contest, state.mastery);
  const start = weekStart(Date.now());
  // Seven bars, Monday first: contest minutes (calm lime, timed orange) with a grade; answers per day without one.
  const bars = DAYS.map((_, i) => {
    const from = start + i * 86_400_000; const to = from + 86_400_000;
    if (grade) {
      const day = state.contest.history.filter((h) => h.mode !== 'preview' && h.at >= from && h.at < to);
      return { calm: day.reduce((n, h) => n + h.calmMs, 0) / 60_000, timed: day.reduce((n, h) => n + h.timedMs, 0) / 60_000 };
    }
    const d = new Date(from); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { calm: state.stats.days?.[key]?.answered ?? 0, timed: 0 };
  });
  const top = Math.max(1, ...bars.map((b) => b.calm + b.timed));
  const weak = grade ? pv.weak.map((w) => w.label) : [];
  const notebookCards = activeEntries(state.notebook ?? []).length;

  return (
    <div className="sq">
      <div className="sq-in">
        <button className="sq-back" onClick={() => go('me')}>‹ Me</button>
        <div><h1 className="sq-title">Grown-ups</h1><p className="sq-sub">Everything a parent needs, nothing a kid has to see</p></div>

        <section className="sq-card k-learn">
          <p className="sq-eyebrow">This week · {c.name}<span className="right" style={{ color: 'var(--text-2)' }}>{grade ? `${GRADES[grade].title.replace(/ Foundation| Bridge| Contest Ramp/, '')} · ${GRADES[grade].track}` : 'No contest grade set'}</span></p>
          <div className="sq-week" style={{ marginTop: 10 }} aria-label="This week, Monday to Sunday">
            {bars.map((b, i) => (
              <div className="day" key={i}>
                <div className="bar2" style={{ height: `${Math.max(6, ((b.calm + b.timed) / top) * 60)}px` }}>
                  {b.calm > 0 && <i className="calm" style={{ flex: b.calm }} />}
                  {b.timed > 0 && <i className="timed" style={{ flex: b.timed }} />}
                </div>
                <small>{DAYS[i]}</small>
              </div>
            ))}
          </div>
          <p className="sq-sub" style={{ marginTop: 8 }}>
            {grade
              ? <><b style={{ color: 'var(--lime)' }}>{pv.week.calmMin} min calm</b> · <b style={{ color: 'var(--orange)' }}>{pv.week.timedMin} min timed</b> · {pv.week.sessions} session{pv.week.sessions === 1 ? '' : 's'}{pv.week.items ? ` · ${pv.week.right}/${pv.week.items} right` : ''}</>
              : <>Answers per day this week · {state.stats.dayStreak ?? 0}-day streak</>}
          </p>
          {weak.length > 0 && <p className="sq-sub">Weak spots: {weak.join(', ')}</p>}
          {notebookCards > 0 && <p className="sq-sub">{notebookCards} notebook card{notebookCards === 1 ? '' : 's'} still healing</p>}
        </section>

        <section className="sq-rows">
          <MeRow icon="medal" k="learn" name="Contest Path plan" meta={grade ? GRADES[grade].title : 'pick a grade'} onClick={() => go('contest')} />
          <MeRow icon="dashboard" name="Parent dashboard" meta="plan, minutes, weak spots" onClick={() => go('dashboard')} />
          <MeRow icon="target" name="Diagnostic" meta="36 facts · ~6 min" onClick={() => { play('open'); dispatch({ type: 'START_DRILL', skillIds: TABLE_ORDER.map((n) => `mult.${n}`), count: 36, diagnostic: true }); }} />
          {COUNT_LAB_ENABLED && <MeRow icon="lock" name="Count Lab access" meta={state.countUnlocked ? 'unlocked' : 'PIN'} onClick={() => go('countlab')} />}
          <MeRow icon="helmet" name="Profiles" meta={profiles.profiles.map((p) => p.name).join(', ')} onClick={() => go('settings')} />
          <MeRow icon="cloud-sync" name="Sync across devices" meta={sync.link ? sync.link.code : sync.available ? 'off' : 'not available'} onClick={() => go('settings')} />
          <MeRow icon="scroll" name="Export / import save" meta="JSON" onClick={() => go('settings')} />
        </section>
      </div>
    </div>
  );
}
