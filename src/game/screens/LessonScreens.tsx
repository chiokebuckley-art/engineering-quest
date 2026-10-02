import { useGame } from '../store';
import { LESSONS, lessonById } from '../../content/lessons';
import { NPCS } from '../../content/npcs';
import { Icon, MasteryChip, Panel } from '../components/ui';
import { MathVisual } from '../components/MathVisual';
import { MathChallenge } from '../components/MathChallenge';
import { skillMastery } from '../../engine/mastery/MasteryEngine';
import { recommendedLesson } from '../../engine/state/selectors';
import { nextStep } from '../../engine/state/guide';
import { labeled, hasLabels, LabelKey } from '../components/Labeled';
import { useState } from 'react';
import { lessonOk } from './ArcadeScreen';
import { GRADES } from '../../engine/contest/grades';

const GROUPS = Array.from(new Set(LESSONS.map((l) => l.group ?? 'Arithmetic')));

export function LessonsScreen() {
  const { state, dispatch, play } = useGame();
  const rec = recommendedLesson(state);
  // Contest Path caps: a child on a grade track sees the lessons on their path; everything else is one tap away.
  const grade = state.contest?.caps ? state.contest.grade : null;
  const [all, setAll] = useState(false);
  const shown = (id: string) => all || lessonOk(grade, id);
  const onPath = grade ? LESSONS.filter((l) => lessonOk(grade, l.id)).length : LESSONS.length;
  return (
    <div className="screen-scroll" style={{ background: 'url(/assets/environments/arithmetic-village.svg) center / cover' }}>
      <div className="container stack">
        <Panel title="Lecture Hall" icon="scroll" right={<button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'library' })}>‹ Library</button>}>
          <p className="small muted">Short lessons: see it, understand it, try it.</p>
          {grade && <p className="small muted">{GRADES[grade].title} · caps on: {all ? `showing all ${LESSONS.length} lessons` : `${onPath} lessons on your path`}. <button className="btn small ghost" onClick={() => setAll((v) => !v)}>{all ? 'Only my path' : 'Show all lessons'}</button></p>}
        </Panel>
        {GROUPS.filter((g) => LESSONS.some((l) => (l.group ?? 'Arithmetic') === g && shown(l.id))).map((g) => (
        <div key={g}>
        <h2 className="brass" style={{ margin: '10px 0 6px' }}>{g}</h2>
        <div className="grid-2">
          {LESSONS.filter((l) => (l.group ?? 'Arithmetic') === g && shown(l.id)).map((l) => {
            const done = state.stats.lessonsCompleted.includes(l.id);
            const teacher = NPCS[l.teacher];
            const ready = (l.recommendedAfter ?? []).every((r) => skillMastery(r.skillId, state.mastery) >= r.mastery);
            return (
              <div key={l.id} className="panel" style={{ display: 'flex', gap: 12 }}>
                <img src={teacher.portrait} alt="" style={{ width: 72, height: 72, borderRadius: 12, border: `2px solid ${teacher.color}`, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="row wrap"><h3>{l.title}</h3>{done && <span className="chip ok">Completed</span>}{rec?.id === l.id && !done && <span className="chip warn">Recommended</span>}{!ready && !done && <span className="chip lock">Best after {l.recommendedAfter?.map((r) => `${r.skillId} ${r.mastery}%`).join(', ')}</span>}</div>
                  <div className="small muted">{teacher.name} · ~{l.minutes} min · trains {l.skillId}</div>
                  <p className="small">{labeled(l.summary)}</p>
                  <div className="row"><MasteryChip value={skillMastery(l.skillId, state.mastery)} /><span className="spacer" /><button className={`btn small ${done ? '' : 'primary'}`} onClick={() => { play('open'); dispatch({ type: 'START_LESSON', lessonId: l.id }); }}>{done ? 'Review' : 'Start'}</button></div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
        ))}
      </div>
    </div>
  );
}

export function LessonScreen() {
  const { state, dispatch, play } = useGame();
  const l = state.lesson;
  if (!l) return null;
  const def = lessonById(l.lessonId)!;
  const step = def.steps[l.step];
  const teacher = NPCS[def.teacher];
  const speakerId = step.type === 'summary' ? step.speaker : step.speaker;
  const speaker = NPCS[speakerId] ?? teacher;
  const progress = Math.round(((l.step) / def.steps.length) * 100);
  if (l.done) return <LessonDone />;

  return (
    <div className="scene" style={{ backgroundImage: 'url(/assets/environments/workshop-lab.svg)' }}>
      <div className="scene-header">
        <div className="loc"><h2>{def.title}</h2><p>Step {l.step + 1} of {def.steps.length} · {teacher.name}</p></div>
        <span className="spacer" />
        <button className="btn small ghost" onClick={() => dispatch({ type: 'LESSON_EXIT' })}>Exit lesson</button>
      </div>
      <div className="scene-body">
        <div className="container" style={{ width: '100%', maxWidth: 860, margin: 'auto' }}>
          <div className="bar thin" style={{ marginBottom: 10 }}><i style={{ width: `${progress}%`, background: 'var(--teal)' }} /></div>
          <div className="dialogue" style={{ width: '100%' }}>
            <img src={speaker.portrait} alt="" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="who">{speaker.name}</div>
              <div className="role">{speaker.role}</div>
              {step.type === 'say' && (
                <>
                  <div className="text" key={l.step} style={{ animation: 'rise 0.25s ease' }}>{labeled(step.text)}</div>
                  {hasLabels(step.text) && <LabelKey />}
                  {step.visual && <MathVisual visual={step.visual} caption={step.caption} />}
                  <div className="actions"><button className="btn primary" onClick={() => { play('click'); dispatch({ type: 'LESSON_NEXT' }); }}>Continue ▸</button></div>
                </>
              )}
              {step.type === 'summary' && (
                <>
                  <div className="text"><b className="brass">Summary</b><ul style={{ margin: '6px 0 0 18px', padding: 0 }}>{step.points.map((pt, i) => <li key={i}>{labeled(pt)}</li>)}</ul></div>
                  {step.points.some(hasLabels) && <LabelKey />}
                  <div className="actions"><button className="btn primary" onClick={() => { play('quest'); dispatch({ type: 'LESSON_NEXT' }); }}>Finish lesson ✓</button></div>
                </>
              )}
              {step.type === 'try' && l.question && (
                <>
                  <div className="text small">{labeled(step.intro)} <span className="muted">({l.tryIndex + 1} of {step.count})</span></div>
                  <MathChallenge
                    question={l.question}
                    feedback={l.feedback}
                    onSubmit={(given) => dispatch({ type: 'LESSON_ANSWER', given })}
                    onNext={() => dispatch({ type: 'LESSON_NEXT' })}
                    showExplanation={l.showExplanation}
                    onToggleExplanation={() => dispatch({ type: 'LESSON_TOGGLE_EXPLAIN' })}
                    nextLabel={l.feedback && !l.feedback.correct && l.attempts < 2 ? 'Try again' : 'Next'}
                    showTimer={false}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'none' }}><Icon name="book" /></div>
    </div>
  );
}

/** The end of a lesson: one big button back into the adventure, so learning never strands you in the Lecture Hall. */
function LessonDone() {
  const { state, dispatch, play } = useGame();
  const l = state.lesson!;
  const def = lessonById(l.lessonId)!;
  const teacher = NPCS[def.teacher];
  const step = nextStep({ ...state, lesson: null });
  const right = l.tryResults.filter(Boolean).length;
  return (
    <div className="scene" style={{ backgroundImage: 'url(/assets/environments/workshop-lab.svg)' }}>
      <div className="scene-body">
        <div className="container" style={{ width: '100%', maxWidth: 640, margin: 'auto' }}>
          <div className="panel lesson-done">
            <img src={teacher.portrait} alt="" className="ld-portrait" style={{ borderColor: teacher.color }} />
            <div className="small muted">LESSON COMPLETE</div>
            <h2 className="brass">{def.title}</h2>
            {l.tryResults.length > 0 && <p className="small">{right} of {l.tryResults.length} practice problems right · +60 XP the first time</p>}
            <p className="small muted">{teacher.name}: "Now go use it."</p>
            <button className="btn primary big block ld-go" onClick={() => { play('open'); dispatch({ type: 'LESSON_CONTINUE' }); }}>
              <Icon name={step.icon} /> Continue the quest: {step.label} ▸
            </button>
            <div className="row wrap" style={{ justifyContent: 'center', marginTop: 8 }}>
              <button className="btn small ghost" onClick={() => dispatch({ type: 'LESSON_NEXT' })}>More lessons</button>
              <button className="btn small ghost" onClick={() => dispatch({ type: 'START_LESSON', lessonId: def.id })}>Review this one</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
