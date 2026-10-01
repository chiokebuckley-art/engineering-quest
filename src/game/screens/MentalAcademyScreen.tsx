import { useState } from 'react';
import { useGame } from '../store';
import { Icon, Panel, Bar, MasteryChip } from '../components/ui';
import { MentalTrainer } from './MentalTrainer';
import { MM_WORLDS, MM_SKILLS, skillsInWorld, mmSkill, MM_LESSONS } from '../../engine/mentalmath/curriculum';
import { dashboard, recommend, skillState, worldUnlocked, buildWorkout, workoutMinutes, progressFor, todayKey } from '../../engine/mentalmath/progress';
import { topErrors, ERROR_LABEL, errorAdvice } from '../../engine/mentalmath/errors';
import { skillMastery, bandFor, BAND_COLORS } from '../../engine/mastery/MasteryEngine';
import type { MMMode } from '../../engine/mentalmath/session';

const secs = (ms: number) => (ms ? `${(ms / 1000).toFixed(1)} s` : '—');

/**
 * The Mental Math Academy: a progress map over ten worlds, the learner's dashboard, the daily workout,
 * a placement challenge, free practice and personal records. Training itself happens in MentalTrainer.
 */
export function MentalAcademyScreen() {
  const { state } = useGame();
  if (state.mm) return <MentalTrainer />;
  return <Academy />;
}

function Academy() {
  const { state, dispatch, play } = useGame();
  const now = Date.now();
  const mental = state.stats.mental;
  const d = dashboard(mental, state.mastery);
  const rec = recommend(mental, state.mastery, now);
  const [openWorld, setOpenWorld] = useState<number>(d.world);
  const [tab, setTab] = useState<'map' | 'dash' | 'free'>('map');
  const plan = buildWorkout(mental, state.mastery, now);
  const workoutDone = mental.workoutDate === todayKey(now);
  const errs = topErrors(mental.errors);

  const go = (mode: MMMode, skillId: string) => { play('open'); dispatch({ type: 'MM_START', mode, skillId }); };

  return (
    <div className="screen-scroll" style={{ background: 'url(/assets/environments/workshop-lab.svg) center / cover' }}>
      <div className="container stack">
        <Panel title="Mental Math Academy" icon="brain" right={<button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'region' })}>Back</button>}>
          <p className="small muted">
            Learn to see numbers as parts that can be moved: 347 + 286 becomes 547, then 627, then 633. Ten worlds take you from
            place value to 125 × 24 in your head. See it, understand it, do it with help, do it alone, do it accurately, then do it quickly.
          </p>
          <div className="row wrap">
            <span className="chip">Level {d.level}</span>
            <span className="chip">World {d.world}: {MM_WORLDS[d.world - 1]?.name}</span>
            <span className="chip">{d.mastered}/{d.totalSkills} skills mastered</span>
            <span className="chip">{d.solved} solved</span>
            {mental.workoutStreak > 0 && <span className="chip ok">{mental.workoutStreak}-day workout streak</span>}
          </div>
          <div className="row wrap" style={{ marginTop: 10 }}>
            <button className={`btn small ${tab === 'map' ? 'primary' : 'ghost'}`} onClick={() => setTab('map')}>Progress map</button>
            <button className={`btn small ${tab === 'dash' ? 'primary' : 'ghost'}`} onClick={() => setTab('dash')}>Dashboard</button>
            <button className={`btn small ${tab === 'free' ? 'primary' : 'ghost'}`} onClick={() => setTab('free')}>Free practice</button>
          </div>
        </Panel>

        <Panel title="Today" icon="calendar">
          <div className="row wrap">
            <button className="btn primary big" onClick={() => { play('boss-roar'); dispatch({ type: 'MM_WORKOUT' }); }}>
              <Icon name="hourglass" /> {workoutDone ? 'Workout again' : 'Daily workout'} · ~{workoutMinutes(plan)} min
            </button>
            <button className="btn big" onClick={() => go('guided', rec.skillId)}>
              <Icon name="target" /> Recommended: {mmSkill(rec.skillId)?.short ?? rec.skillId}
            </button>
            {d.solved === 0 && (
              <button className="btn big" onClick={() => { play('open'); dispatch({ type: 'MM_PLACEMENT' }); }}>
                <Icon name="compass" /> Placement challenge
              </button>
            )}
          </div>
          <p className="small muted">{rec.why} {workoutDone ? 'Today’s workout is done — anything more is a bonus.' : `The workout is ${plan.length} short blocks built from your own data.`}</p>
          <ol className="small muted" style={{ margin: '4px 0 0 18px' }}>
            {plan.map((b, i) => <li key={i}>{b.label}: {mmSkill(b.skillId)?.short ?? b.skillId} · {b.count} problems{b.mode === 'speed' ? ' (on the clock)' : ''}</li>)}
          </ol>
        </Panel>

        {tab === 'map' && (
          <>
            <Panel title="The path" icon="map">
              <div className="mm-worlds">
                {MM_WORLDS.map((w) => {
                  const unlocked = worldUnlocked(mental, state.mastery, w.n);
                  const skills = skillsInWorld(w.n);
                  const mastered = skills.filter((sk) => skillMastery(sk.id, state.mastery, now) >= 90).length;
                  return (
                    <button key={w.n} className={`mm-world ${!unlocked ? 'locked' : ''} ${openWorld === w.n ? 'current' : ''}`} onClick={() => { if (unlocked) { play('click'); setOpenWorld(w.n); } }} disabled={!unlocked}>
                      <span className="n">{w.n}</span>
                      <span style={{ flex: 1 }}>
                        <b>{w.name}</b>
                        <div className="small muted">{w.subtitle}</div>
                        <Bar value={mastered} max={skills.length} kind="xp" thin right={`${mastered}/${skills.length}`} />
                      </span>
                      <Icon name={unlocked ? w.icon : 'lock'} />
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel title={`World ${openWorld}: ${MM_WORLDS[openWorld - 1]?.name}`} icon={MM_WORLDS[openWorld - 1]?.icon ?? 'brain'}>
              <p className="small muted">{MM_WORLDS[openWorld - 1]?.blurb}</p>
              <div className="stack">
                {skillsInWorld(openWorld).map((sk) => {
                  const st = skillState(mental, state.mastery, sk.id);
                  const m = skillMastery(sk.id, state.mastery, now);
                  const prog = progressFor(mental, sk.id);
                  const lesson = MM_LESSONS[sk.id];
                  return (
                    <div key={sk.id} className={`mm-skill-row ${st === 'locked' ? 'locked' : ''}`}>
                      <i className={`mm-dot ${st}`} />
                      <span className="nm">
                        <b>{sk.name}</b>
                        <div className="small muted">{lesson?.intro ?? sk.teaches}</div>
                      </span>
                      <MasteryChip value={m} />
                      {prog.attempts > 0 && <span className="chip">{secs(prog.avgMs)}</span>}
                      <span className="row wrap" style={{ gap: 4 }}>
                        <button className="btn small" disabled={st === 'locked'} onClick={() => go('learn', sk.id)}><Icon name="book" /> Learn</button>
                        <button className="btn small" disabled={st === 'locked'} onClick={() => go('guided', sk.id)}>Guided</button>
                        <button className="btn small" disabled={st === 'locked'} onClick={() => go('independent', sk.id)}>Practice</button>
                        <button className="btn small" disabled={st === 'locked' || m < 40} onClick={() => go('speed', sk.id)} title={m < 40 ? 'Accuracy first: practise until this is Developing.' : `Target ${sk.speedLadder[Math.min(prog.speedStep, sk.speedLadder.length - 1)]} s`}>
                          Speed {sk.speedLadder[Math.min(prog.speedStep, sk.speedLadder.length - 1)]}s
                        </button>
                        <button className="btn small" disabled={st === 'locked' || m < 55} onClick={() => go('mastery', sk.id)} title={m < 55 ? 'Practise a little more first.' : 'Ten questions, 90 % to pass'}>Mastery</button>
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="row wrap" style={{ marginTop: 10 }}>
                <button className="btn big" disabled={!worldUnlocked(mental, state.mastery, openWorld)} onClick={() => { play('boss-roar'); dispatch({ type: 'MM_BOSS', world: openWorld }); }}>
                  <Icon name="skull" /> Boss: {MM_WORLDS[openWorld - 1]?.boss.name}
                  {mental.bosses[MM_WORLDS[openWorld - 1]?.id ?? ''] ? <span className="chip ok" style={{ marginLeft: 6 }}>beaten ×{mental.bosses[MM_WORLDS[openWorld - 1].id]}</span> : null}
                </button>
                <button className="btn" onClick={() => go('choose', 'mm.choose')}><Icon name="brain" /> Which way would you solve it?</button>
                <button className="btn" onClick={() => go('visualize', skillsInWorld(openWorld)[0]?.id ?? 'mm.add2.chunks')}><Icon name="telescope" /> Visualisation trainer</button>
              </div>
              <p className="small muted">“{MM_WORLDS[openWorld - 1]?.boss.taunt}”</p>
            </Panel>
          </>
        )}

        {tab === 'dash' && (
          <>
            <Panel title="Your mental math" icon="dashboard">
              <div className="stat-grid">
                <div className="st"><b>{Math.round(d.accuracy * 100)} %</b><span>accuracy</span></div>
                <div className="st"><b>{secs(d.avgMs)}</b><span>average response</span></div>
                <div className="st"><b>{d.solved}</b><span>problems solved</span></div>
                <div className="st"><b>{d.bestStreak}</b><span>longest streak</span></div>
                <div className="st"><b>{d.add} %</b><span>addition mastery</span></div>
                <div className="st"><b>{d.sub} %</b><span>subtraction mastery</span></div>
                <div className="st"><b>{d.mul} %</b><span>multiplication mastery</span></div>
                <div className="st"><b>{d.skillsTouched}/{d.totalSkills}</b><span>skills practised</span></div>
              </div>
              <p className="small">
                Weakest: <b>{d.weakest?.name ?? '—'}</b>{d.weakest && <> ({bandFor(skillMastery(d.weakest.id, state.mastery, now))})</>}. Strongest: <b>{d.strongest?.name ?? '—'}</b>.
              </p>
              {errs.length > 0 && (
                <p className="small muted">
                  Most common mistakes: {errs.map((e) => `${ERROR_LABEL[e.kind]} (${e.count})`).join(', ')}. {errorAdvice(errs[0].kind)}
                </p>
              )}
              {mental.sessions.length >= 2 && (() => {
                const last5 = mental.sessions.slice(-5);
                const acc = last5.reduce((a, x) => a + x.correct, 0) / Math.max(1, last5.reduce((a, x) => a + x.solved, 0));
                const prev5 = mental.sessions.slice(-10, -5);
                const pacc = prev5.length ? prev5.reduce((a, x) => a + x.correct, 0) / Math.max(1, prev5.reduce((a, x) => a + x.solved, 0)) : acc;
                const avg = Math.round(last5.reduce((a, x) => a + x.avgMs, 0) / last5.length);
                return <p className="small">Recent: {Math.round(acc * 100)} % over the last {last5.length} sessions{prev5.length ? ` (was ${Math.round(pacc * 100)} %)` : ''}, averaging {secs(avg)} a problem.</p>;
              })()}
            </Panel>

            <Panel title="Personal records" icon="trophy">
              <div className="stat-grid">
                <div className="st"><b>{mental.records.bestStreak}</b><span>longest streak</span></div>
                <div className="st"><b>{mental.records.fastestTenMs ? secs(mental.records.fastestTenMs) : '—'}</b><span>fastest perfect 10</span></div>
                <div className="st"><b>{mental.records.perfectRounds}</b><span>perfect rounds</span></div>
                <div className="st"><b>{secs(mental.records.bestAddMs)}</b><span>fastest addition</span></div>
                <div className="st"><b>{secs(mental.records.bestSubMs)}</b><span>fastest subtraction</span></div>
                <div className="st"><b>{secs(mental.records.bestMulMs)}</b><span>fastest multiplication</span></div>
              </div>
              <p className="small muted">Records are per learner profile. The opponent worth beating is the one you were last week.</p>
            </Panel>

            <Panel title="Skill report" icon="scroll">
              <div className="sp-table-wrap">
                <table className="sp-table">
                  <thead><tr><th>Skill</th><th>World</th><th>Tries</th><th>Accuracy</th><th>Avg</th><th>Mastery</th></tr></thead>
                  <tbody>
                    {MM_SKILLS.filter((sk) => progressFor(mental, sk.id).attempts > 0).map((sk) => {
                      const p = progressFor(mental, sk.id);
                      const m = skillMastery(sk.id, state.mastery, now);
                      return (
                        <tr key={sk.id}>
                          <td>{sk.name}</td><td>{sk.world}</td><td>{p.attempts}</td>
                          <td>{Math.round((p.correct / Math.max(1, p.attempts)) * 100)} %</td>
                          <td>{secs(p.avgMs)}</td>
                          <td style={{ color: BAND_COLORS[bandFor(m)] }}>{Math.round(m)} % · {bandFor(m)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="small muted">A parent or teacher can read this table top to bottom: attempts, accuracy, speed and mastery band per skill, plus the common-mistake line above.</p>
            </Panel>
          </>
        )}

        {tab === 'free' && <FreePractice />}
      </div>
    </div>
  );
}

/** Free practice: choose operation, size and mode without walking the map. */
function FreePractice() {
  const { state, dispatch, play } = useGame();
  const [op, setOp] = useState<'add' | 'sub' | 'mul'>('add');
  const [size, setSize] = useState<'2' | '3' | 'mixed'>('2');
  const now = Date.now();
  const pick = (): string => {
    if (op === 'mul') return size === '2' ? 'mm.mul.2x2' : size === '3' ? 'mm.mul.3x1' : 'mm.mixed';
    if (size === 'mixed') return 'mm.mixed';
    const world = op === 'add' ? (size === '2' ? 2 : 3) : size === '2' ? 4 : 5;
    const skills = MM_SKILLS.filter((s) => s.world === world);
    return skills[skills.length - 1]?.id ?? 'mm.add2.mixed';
  };
  const skillId = pick();
  const sk = mmSkill(skillId);
  return (
    <Panel title="Free practice" icon="target">
      <div className="row wrap">
        <span className="small muted">Operation:</span>
        {(['add', 'sub', 'mul'] as const).map((o) => <button key={o} className={`btn small ${op === o ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setOp(o); }}>{o === 'add' ? 'Addition' : o === 'sub' ? 'Subtraction' : 'Multiplication'}</button>)}
      </div>
      <div className="row wrap" style={{ marginTop: 6 }}>
        <span className="small muted">Size:</span>
        {(['2', '3', 'mixed'] as const).map((z) => (
          <button key={z} className={`btn small ${size === z ? 'primary' : 'ghost'}`} onClick={() => { play('click'); setSize(z); }}>
            {z === 'mixed' ? 'Mixed' : op === 'mul' ? (z === '2' ? '2-digit × 2-digit' : '3-digit × 1-digit') : `${z} digits`}
          </button>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 8 }}>Selected: <b>{sk?.name}</b> — {sk?.teaches} Mastery {Math.round(skillMastery(skillId, state.mastery, now))} %.</p>
      <div className="row wrap">
        {(['learn', 'guided', 'independent', 'speed'] as MMMode[]).map((m) => (
          <button key={m} className={`btn ${m === 'independent' ? 'primary' : ''}`} onClick={() => { play('open'); dispatch({ type: 'MM_START', mode: m, skillId }); }}>
            {m === 'learn' ? 'Learn' : m === 'guided' ? 'Practice with help' : m === 'independent' ? 'Practice' : 'Speed'}
          </button>
        ))}
        <button className="btn" onClick={() => { play('boss-roar'); dispatch({ type: 'MM_START', mode: 'mastery', skillId }); }}>Challenge</button>
      </div>
      <p className="small muted">For multiplication the sensible mental sizes are offered: two-by-two and three-by-one, plus the friendly three-by-two problems inside World 8.</p>
    </Panel>
  );
}
