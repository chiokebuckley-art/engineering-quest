import { useGame } from '../store';
import { dashboardData, dailyPlan, todayStats } from '../../engine/state/selectors';
import { Icon, Panel, Ring, Bar, fmtTime } from '../components/ui';
import { BAND_COLORS, bandFor } from '../../engine/mastery/MasteryEngine';
import { ACHIEVEMENTS } from '../../engine/progression/achievements';
import { STORY } from '../../content/story';
import { levelFromXp } from '../../engine/progression/xp';
import { LedgerOverview } from '../components/ProgressData';
import { ARCADE_GAMES } from './ArcadeScreen';
import { initialLedger } from '../../engine/state/ledger';
import { ContestParentCard } from './ContestTrackScreen';

export function DashboardScreen() {
  const { state, dispatch, play } = useGame();
  const d = dashboardData(state);
  const plan = dailyPlan(state);
  const t = todayStats(state);
  const lv = levelFromXp(d.xp);
  const go = (item: (typeof plan)[number]) => {
    play('click');
    const a = item.action;
    if (a.screen === 'drill' && a.params) dispatch({ type: 'START_DRILL', skillIds: [String(a.params.skill)], count: Number(a.params.count) });
    else if (a.screen === 'region' && a.params?.region) dispatch({ type: 'TRAVEL', regionId: String(a.params.region) });
    else if (a.screen === 'dungeon') dispatch({ type: 'START_DUNGEON' });
    else dispatch({ type: 'NAVIGATE', screen: a.screen as never });
  };
  return (
    <div className="screen-scroll">
      <div className="container stack">
        <div className="grid-3">
          <Panel title="Engineering Math Level" icon="dashboard">
            <div className="row" style={{ gap: 16 }}>
              <div className="stack" style={{ alignItems: 'center', gap: 2 }}><Ring value={d.worlds[0].percent} label="World 1" /><span className="small muted">Overall {d.overall}%</span></div>
              <div className="stack" style={{ gap: 4, flex: 1 }}>
                <div className="list-row"><span>Level</span><b>{d.level}</b></div>
                <div className="list-row"><span>XP</span><b>{d.xp} <span className="muted small">({lv.into}/{lv.needed})</span></b></div>
                <div className="list-row"><span>Questions</span><b>{d.totalAnswered}</b></div>
                <div className="list-row"><span>Lifetime accuracy</span><b>{d.accuracy}%</b></div>
                <div className="list-row"><span>Avg response</span><b>{fmtTime(d.avgTimeMs)}</b></div>
                <div className="list-row"><span>Day streak</span><b>{d.dayStreak} 🔥</b></div>
                <div className="list-row"><span>Bosses</span><b>{d.bosses}</b></div>
                <div className="list-row"><span>Projects</span><b>{d.projects}</b></div>
              </div>
            </div>
          </Panel>
          <Panel title="Today's Training" icon="calendar" right={<span className="chip">{t.xp} XP today</span>}>
            {plan.map((p) => (
              <div key={p.id} className={`daily-item ${p.done ? 'done' : ''}`}>
                <span className="min">{p.minutes} min</span>
                <span className="lbl">{p.label}<Bar value={p.progress} max={p.target} kind="mastery" thin /></span>
                <button className="btn small ghost" onClick={() => go(p)}>{p.done ? '✓' : 'Go'}</button>
              </div>
            ))}
            <div className="row wrap small muted" style={{ marginTop: 8 }}>
              <span>Answered {t.answered}</span><span>· Accuracy {t.answered ? Math.round((t.correct / t.answered) * 100) : 0}%</span><span>· Mastery +{Math.round(t.masteryGained)}</span><span>· Skills improved {t.skillsImproved.length}</span>
            </div>
          </Panel>
          <Panel title="Recommended" icon="compass">
            {d.nextSkill && <p className="small">Next skill: <b className="brass">{d.nextSkill.name}</b></p>}
            {d.nextLesson && <p className="small">Next lesson: <b className="teal">{d.nextLesson.title}</b></p>}
            <p className="small muted">{d.dueCount} facts due for spaced review.</p>
            <div className="row wrap">
              {d.nextLesson && <button className="btn small primary" onClick={() => dispatch({ type: 'START_LESSON', lessonId: d.nextLesson!.id })}><Icon name="scroll" /> Lesson</button>}
              {d.nextSkill && <button className="btn small" onClick={() => dispatch({ type: 'START_DRILL', skillIds: [d.nextSkill!.id], count: 15 })}><Icon name="target" /> Drill</button>}
              <button className="btn small" disabled={!d.dueCount} onClick={() => dispatch({ type: 'START_DUNGEON' })}><Icon name="skull" /> Review dungeon</button>
            </div>
          </Panel>
        </div>
        <div className="grid-3">
          <Panel title="Curriculum" icon="skill-tree">
            {d.worlds.map((w) => (
              <div key={w.id} style={{ marginBottom: 6 }}>
                <Bar value={w.percent} max={100} kind="mastery" label={w.name} right={`${w.percent}%${w.status !== 'playable' ? ' · ' + w.status : ''}`} thin />
              </div>
            ))}
          </Panel>
          <Panel title="Weakest 5" icon="skull">
            {d.weakest.length ? d.weakest.map((w) => <div key={w.id} className="list-row"><span>{w.label}</span><b style={{ color: BAND_COLORS[bandFor(w.mastery)] }}>{w.mastery}%</b></div>) : <p className="small muted">Answer a few questions and your weak points will show here.</p>}
            <h4 style={{ marginTop: 12 }}>Strongest 5</h4>
            {d.strongest.map((w) => <div key={w.id} className="list-row"><span>{w.label}</span><b style={{ color: BAND_COLORS[bandFor(w.mastery)] }}>{w.mastery}%</b></div>)}
          </Panel>
          <Panel title="Achievements" icon="trophy" right={<button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'achievements' })}>All</button>}>
            <div className="row wrap">
              {ACHIEVEMENTS.map((a) => <span key={a.id} className={`chip ${state.achievements[a.id] ? 'ok' : 'lock'}`} title={a.description}><Icon name={a.icon} />{a.name}</span>)}
            </div>
          </Panel>
        </div>
        <VisitPanel />
        <ContestParentCard open />
        <Panel title="Arcade progress" icon="dashboard" right={<button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'arcade' })}>Arcade</button>}>
          <LedgerOverview ledger={state.stats.ledger ?? initialLedger()} gameLabel={(g) => ARCADE_GAMES.find((x) => x.id === g)?.label ?? g} />
        </Panel>
        <Panel title="Why this matters" icon="gear">
          <div className="row wrap small">{STORY.connections.map((c) => <span key={c} className="chip">{c}</span>)}</div>
        </Panel>
      </div>
    </div>
  );
}

/** Where each visit went first. The goal of the Play redesign: Play becomes the place they reach for. */
function VisitPanel() {
  const { state } = useGame();
  const opens = (state.stats.opens ?? []).slice(-20);
  if (!opens.length) return null;
  const names: Record<string, string> = { play: 'Play', arcade: 'Arcade', learn: 'Learn', academy: 'Mental Math', notebook: 'Notebook' };
  const counts = opens.reduce<Record<string, number>>((m, o) => ({ ...m, [o.tab]: (m[o.tab] ?? 0) + 1 }), {});
  const order = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (
    <Panel title="Where each visit starts" icon="map">
      <p className="small muted">The first place you went on each of your last {opens.length} visits.</p>
      <div className="row wrap" style={{ gap: 6 }}>{order.map(([tab, n]) => <span key={tab} className={`chip ${tab === 'play' ? 'ok' : ''}`}>{names[tab] ?? tab}: {n}</span>)}</div>
      <div className="visit-strip" aria-label="Most recent visit on the right">{opens.map((o, i) => <i key={i} className={`v-${o.tab}`} title={`${new Date(o.at).toLocaleString()}: ${names[o.tab] ?? o.tab}`} />)}</div>
      <div className="row wrap small muted" style={{ gap: 10 }}><span><i className="v-play vs-key" /> Play</span><span><i className="v-arcade vs-key" /> Arcade</span><span><i className="v-learn vs-key" /> Learn</span><span><i className="v-academy vs-key" /> Mental Math</span></div>
    </Panel>
  );
}
