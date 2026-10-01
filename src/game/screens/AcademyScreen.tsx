/**
 * The Academies: the campus ladder (Arithmetic → … → Differential Equations), each academy's hub
 * (chapter map + core gauge), chapter detail (quests, teach cards, gates), the quest stage (hook →
 * teach-in-world → waves → post-quest card), the mastery dashboard, the Mastery Trial and
 * graduation. One screen, routed by screenParams.view and screenParams.academy.
 */
import { useEffect, useState } from 'react';
import { labeled, hasLabels, LabelKey } from '../components/Labeled';
import { useGame } from '../store';
import { Icon, Panel, Bar } from '../components/ui';
import { MathChallenge, Explanation } from '../components/MathChallenge';
import { MathVisual } from '../components/MathVisual';
import { AcademyModel, ChoiceButtons, PickModel } from '../components/AcademyModels';
import { Callout, Confetti } from '../components/Fx';
import { ACADEMIES, academyById, chapterOf, coreChapters, nextAcademy, prevAcademy } from '../../engine/academy/registry';
import type { AcademyDef } from '../../engine/academy/defs';
import { chapterGates, graduation, trialReady, academyNext, criticalFacts, passRule, judge, currentAcademy, ladder, trackOf, graduated, type ChapterGates } from '../../engine/academy/AcademyEngine';
import { showVisualOnModel } from '../../engine/academy/visualPolicy';
import { Calculator } from '../components/Calculator';
import type { AskStep } from '../../engine/academy/types';
import { NPCS } from '../../content/npcs';
import { lessonById } from '../../content/lessons';
import type { ArcadeGame } from '../../engine/state/types';
import { regionById } from '../../engine/curriculum/regions';

const npcName = (id: string) => NPCS[id]?.name ?? 'Professor Vector';
const npcPortrait = (id: string) => NPCS[id]?.portrait;

export function AcademyScreen() {
  const { state } = useGame();
  const view = String(state.screenParams.view ?? 'hub');
  if (state.academy.run) return <AcademyStage />;
  if (view === 'campus') return <Campus />;
  const a = academyById(String(state.screenParams.academy ?? '')) ?? currentAcademy(state);
  if (view === 'chapter') { const key = String(state.screenParams.chapter ?? a.chapters[0]?.key ?? 'trial'); return chapterOf(a.id, key) ? <ChapterScreen a={a} k={key} /> : <AcademyHub a={a} />; }
  if (view === 'dashboard') return <MasteryDashboard a={a} />;
  return <AcademyHub a={a} />;
}

/* ---------------- campus: the ladder of academies ---------------- */
function Campus() {
  const { state, dispatch, play } = useGame();
  const rows = ladder(state);
  const tiers = ['Foundational', 'High School', 'Advanced'] as const;
  return (
    <div className="screen-scroll">
      <div className="container stack academy" style={{ maxWidth: 720 }}>
        <div className="academy-head">
          <div>
            <div className="small muted">ENGINEERING QUEST · PLAY</div>
            <h1>The Academies</h1>
            <p className="small muted">Ten academies, one ladder: from counting to differential equations. Graduate from one and the next opens, with a new power core for the Engine.</p>
          </div>
          <button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'region' })}>Village</button>
        </div>
        <button className="btn primary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'visual-library' })}>Visual Library · Learn and name 265 images</button>
        <CoreRack />
        {tiers.map((tier) => (
          <div key={tier} className="wing">
            <div className="wing-head"><Icon name={tier === 'Foundational' ? 'home' : tier === 'High School' ? 'book' : 'reactor'} /> <b>{tier}</b></div>
            <div className="chapter-nodes">
              {rows.filter((r) => r.academy.tier === tier).map((r, i) => {
                const a = r.academy; const n = ACADEMIES.indexOf(a) + 1;
                const sub = r.status === 'graduated' ? `Graduated · ${a.coreName} seated` : r.status === 'open' ? `${r.mastered}/${r.total} chapters mastered` : r.status === 'soon' ? 'Being built' : `Graduate from ${prevAcademy(a.id)?.short ?? 'the previous academy'} to open`;
                return (
                  <button key={a.id} className={`chapter-node academy-rung ${r.status === 'graduated' ? 'mastered' : r.status === 'open' ? 'active' : 'locked'}`} disabled={r.status === 'locked' || r.status === 'soon'} onClick={() => { play('open'); dispatch({ type: 'ACADEMY_OPEN', view: 'hub', academy: a.id }); }} aria-label={a.name} data-i={i}>
                    <span className="cn-num" style={{ borderColor: a.coreColor }}>{r.status === 'graduated' ? '✓' : r.status === 'locked' || r.status === 'soon' ? <Icon name="lock" /> : n}</span>
                    <span className="cn-body"><b>{a.name}</b><small>{a.blurb}</small><small>{sub}</small></span>
                    {r.status === 'open' && <span className="pr-go">▸</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The Engine's rack of cores, one per academy. */
function CoreRack() {
  const { state } = useGame();
  return (
    <div className="core-rack" aria-label="power cores">
      {ACADEMIES.map((a) => { const g = graduated(state, a.id); return <span key={a.id} className={`core-slot ${g ? 'on' : ''}`} style={g ? { background: a.coreColor, boxShadow: `0 0 10px ${a.coreColor}` } : undefined} title={`${a.coreName}${g ? ' · seated' : ''}`} />; })}
    </div>
  );
}

/* ---------------- hub ---------------- */
function AcademyHub({ a }: { a: AcademyDef }) {
  const { state, dispatch, play } = useGame();
  const core = coreChapters(a);
  const gates = new Map(a.chapters.map((c) => [c.key, chapterGates(state, a.id, c.key)]));
  const mastered = core.filter((c) => gates.get(c.key)!.mastered).length;
  const next = academyNext(state, a.id);
  const grad = graduation(state, a.id);
  const done = graduated(state, a.id);
  const nxt = nextAcademy(a.id);
  const open = (key: string) => { play('open'); dispatch({ type: 'ACADEMY_OPEN', view: 'chapter', academy: a.id, chapter: key }); };
  const go = () => {
    play('open');
    if (next.kind === 'quest' && next.questId) dispatch({ type: 'ACADEMY_START', kind: 'quest', questId: next.questId });
    else if (next.kind === 'concept' || next.kind === 'transfer') dispatch({ type: 'ACADEMY_START', kind: next.kind, academy: a.id, chapter: next.chapter });
    else if (next.kind === 'trial') dispatch({ type: 'ACADEMY_START', kind: 'trial', academy: a.id });
    else if (next.kind === 'repair') dispatch({ type: 'NAVIGATE', screen: 'notebook' });
    else if (next.kind === 'next-academy' && nxt) dispatch({ type: 'ACADEMY_OPEN', view: 'hub', academy: nxt.id });
    else if (next.kind === 'graduate' && !done) dispatch({ type: 'ACADEMY_GRADUATE', academy: a.id });
    else if (next.kind === 'locked') dispatch({ type: 'ACADEMY_OPEN', view: 'campus' });
    else dispatch({ type: 'ACADEMY_OPEN', view: 'chapter', academy: a.id, chapter: next.chapter });
  };
  const wings = Object.keys(a.wings);
  return (
    <div className="screen-scroll">
      <div className="container stack academy" style={{ maxWidth: 720 }}>
        <div className="academy-head">
          <div>
            <div className="small muted">{a.tier.toUpperCase()} · ACADEMY {ACADEMIES.indexOf(a) + 1} OF {ACADEMIES.length}</div>
            <h1>{a.name}</h1>
            <p className="small muted">{a.blurb} Master {core.length} chapters and the Mastery Trial to seat the {a.coreName}{nxt ? ` and open the ${nxt.name}` : ''}.</p>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <button className="btn small ghost" onClick={() => dispatch({ type: 'ACADEMY_OPEN', view: 'campus' })}>All academies</button>
            <button className="btn small ghost" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'region' })}>Village</button>
          </div>
        </div>
        <EngineGauge a={a} mastered={mastered} total={core.length} graduated={done} />
        <button className="academy-next" onClick={go}>
          <Icon name={next.kind === 'trial' ? 'reactor' : next.kind === 'graduate' || next.kind === 'next-academy' ? 'trophy' : next.kind === 'repair' ? 'book' : next.kind === 'locked' ? 'lock' : 'sword'} />
          <span><small>NEXT</small><b>{next.label}</b><em>{next.hint}</em></span>
          <span className="pr-go">▸</span>
        </button>
        {wings.map((w) => {
          const cs = a.chapters.filter((c) => c.wing === w); if (!cs.length) return null;
          return (
            <div key={w} className="wing">
              <div className="wing-head"><Icon name={a.wings[w].icon} /> <b>{a.wings[w].name}</b> <small className="muted">{cs.filter((c) => gates.get(c.key)!.mastered).length}/{cs.length} mastered</small></div>
              <div className="chapter-nodes">
                {cs.map((c) => { const g = gates.get(c.key)!; const status = g.mastered ? 'mastered' : !g.available ? 'locked' : g.questsCleared > 0 || g.concept.attempts > 0 ? 'active' : 'open'; return (
                  <button key={c.key} className={`chapter-node ${status}`} disabled={status === 'locked'} onClick={() => open(c.key)} aria-label={`Chapter ${c.n}: ${c.title}`}>
                    <span className="cn-num">{status === 'mastered' ? '✓' : status === 'locked' ? <Icon name="lock" /> : c.n}</span>
                    <span className="cn-body"><b>{c.title}</b><small>{status === 'locked' ? g.lockedBecause : status === 'mastered' ? 'Mastered' : c.key === 'trial' ? 'The Mastery Trial' : `${g.questsCleared}/2 quests · ${[g.concept.pass, g.fluency.pass, g.transfer.pass].filter(Boolean).length}/3 gates`}</small></span>
                  </button>
                ); })}
              </div>
            </div>
          );
        })}
        <Panel title="Graduation" icon="trophy">
          {done ? (
            <div className="stack">
              <p className="small">The {a.coreName} is seated.{nxt ? ` The ${nxt.name} is open: ${nxt.blurb}` : ' Every academy is complete.'}</p>
              {nxt && <button className="btn primary big block" onClick={() => { play('open'); dispatch({ type: 'ACADEMY_OPEN', view: 'hub', academy: nxt.id }); }}>Enter the {nxt.name} ▸</button>}
            </div>
          ) : (
            <div className="stack">
              <div className="small muted">{grad.chaptersMastered}/{grad.total} chapters mastered · weak facts {grad.repairPass ? 'clear' : `${criticalFacts(state, a.id).length} to repair`} · trial {grad.trialPass ? 'passed' : 'not yet'}</div>
              <ul className="reasons">{grad.reasons.slice(0, 4).map((r) => <li key={r}>{r}</li>)}{grad.reasons.length > 4 && <li>…and {grad.reasons.length - 4} more</li>}</ul>
              <div className="row wrap">
                <button className="btn primary" disabled={!grad.ready} onClick={() => { play('open'); dispatch({ type: 'ACADEMY_GRADUATE', academy: a.id }); }}><Icon name="reactor" /> Seat the {a.coreName}</button>
                <button className="btn ghost" onClick={() => dispatch({ type: 'ACADEMY_OPEN', view: 'dashboard', academy: a.id })}><Icon name="dashboard" /> Mastery dashboard</button>
              </div>
            </div>
          )}
        </Panel>
        <div className="row wrap">
          <button className="btn ghost small" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'visual-library' })}>Visual Library</button>
          <button className="btn ghost small" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'arcade' })}><Icon name="hourglass" /> Arcade gym</button>
          <button className="btn ghost small" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'notebook' })}><Icon name="book" /> Wrong-answer Notebook</button>
          <button className="btn ghost small" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'map' })}><Icon name="map" /> World map</button>
        </div>
      </div>
    </div>
  );
}

function EngineGauge({ a, mastered, total, graduated: done }: { a: AcademyDef; mastered: number; total: number; graduated: boolean }) {
  const pct = done ? 100 : total ? Math.round((mastered / total) * 100) : 0;
  const gid = `eg-${a.id}`;
  return (
    <div className="engine-gauge" aria-label={`${a.coreName} ${pct}% charged`}>
      <svg viewBox="0 0 320 84" width="100%" height="84">
        <defs><linearGradient id={gid} x1="0" x2="1"><stop offset="0" stopColor="#fbbf24" /><stop offset="1" stopColor={a.coreColor} /></linearGradient></defs>
        <rect x="10" y="30" width="300" height="24" rx="12" fill="#0b1020" stroke="#334155" />
        <rect x="12" y="32" width={Math.max(0, 296 * pct / 100)} height="20" rx="10" fill={`url(#${gid})`} opacity="0.9" />
        {Array.from({ length: total }, (_, i) => <circle key={i} cx={12 + (296 / total) * (i + 0.5)} cy="42" r="4" fill={i < mastered ? '#0b1020' : '#1f2937'} stroke={i < mastered ? '#fde68a' : '#475569'} />)}
        <text x="160" y="18" textAnchor="middle" fill="#fde68a" fontSize="11" fontFamily="var(--font-display)" letterSpacing="2">{a.coreName.toUpperCase()}</text>
        <text x="160" y="74" textAnchor="middle" fill="#94a3b8" fontSize="10">{done ? 'SEATED' : `${mastered} of ${total} chapters · ${pct}% charged`}</text>
      </svg>
    </div>
  );
}

/* ---------------- chapter ---------------- */
function ChapterScreen({ a, k }: { a: AcademyDef; k: string }) {
  const { state, dispatch, play } = useGame();
  const c = chapterOf(a.id, k)!;
  const g = chapterGates(state, a.id, k);
  const canPlay = g.available;
  const isTrial = k === 'trial';
  const tr = isTrial ? trialReady(state, a.id) : null;
  const track = trackOf(state.academy, a.id);
  const start = (kind: 'quest' | 'concept' | 'transfer' | 'trial', questId?: string) => { play('open'); dispatch({ type: 'ACADEMY_START', kind, academy: a.id, chapter: k, questId }); };
  return (
    <div className="screen-scroll">
      <div className="container stack academy" style={{ maxWidth: 720 }}>
        <div className="academy-head">
          <div>
            <div className="small muted"><Icon name={a.wings[c.wing]?.icon ?? a.icon} /> {c.wingName} · {a.short.toUpperCase()} · CHAPTER {c.n}</div>
            <h1>{c.title}</h1>
            {a.id === 'geometry' && ['triangles','polygons','circles','solids'].includes(k) && <button className="btn primary" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'visual-library', params: { domain: 'k12', chapter: k } })}>Visual Library · {c.title}</button>}
            <p className="small">{c.goal}</p>
          </div>
          <button className="btn small ghost" onClick={() => dispatch({ type: 'ACADEMY_OPEN', view: 'hub', academy: a.id })}>{a.short}</button>
        </div>
        {!canPlay && <div className="end-story">Locked. {g.lockedBecause}</div>}
        {!isTrial && <Meters g={g} />}
        <Panel title={isTrial ? 'The Trial' : 'Quests'} icon="sword">
          <div className="stack">
            {c.quests.map((q, i) => (
              <button key={q.id} className="quest-row" disabled={!canPlay && !isTrial} onClick={() => start('quest', q.id)}>
                <img src={npcPortrait(q.giver)} alt="" />
                <span className="pr-body"><b>{i === 0 ? 'Guided' : 'Challenge'}: {q.name}</b><small>{q.hook}</small></span>
                <span className="qr-clears">{(g.quests[i]?.clears ?? 0) > 0 ? `✓ ×${g.quests[i].clears}` : 'Play ▸'}</span>
              </button>
            ))}
            {isTrial && (
              <div className="stack">
                {tr && !tr.ready && <ul className="reasons">{tr.reasons.slice(0, 5).map((r) => <li key={r}>{r}</li>)}</ul>}
                <button className="btn primary big" disabled={!tr?.ready} onClick={() => start('trial')}><Icon name="reactor" /> Begin the Mastery Trial{track.trial.attempts ? ` (best ${track.trial.best})` : ''}</button>
              </div>
            )}
          </div>
        </Panel>
        {!isTrial && (
          <Panel title="Mastery checks" icon="target">
            <div className="stack">
              <div className="check-row"><span><b>Concept check</b><small>3 model items · 2 right passes · best {g.concept.best}/3</small></span><button className="btn small primary" disabled={!canPlay} onClick={() => start('concept')}>{g.concept.pass ? 'Again' : 'Start'}</button></div>
              <div className="check-row"><span><b>Transfer set</b><small>{c.transferCount} new engineering problems · best {g.transfer.best}/{c.transferCount}</small></span><button className="btn small primary" disabled={!canPlay} onClick={() => start('transfer')}>{g.transfer.pass ? 'Again' : 'Start'}</button></div>
              <div className="check-row"><span><b>Fluency: {c.fluency.label}</b><small>{g.fluency.have}/{g.fluency.n} recent · {Math.round(g.fluency.accuracy * 100)}% · median {(g.fluency.medianMs / 1000).toFixed(1)}s (need {Math.round(c.fluency.accuracy * 100)}%, ≤ {c.fluency.medianMs / 1000}s)</small></span><button className="btn small" onClick={() => { play('open'); dispatch({ type: 'ARCADE_START', game: c.drill.game as ArcadeGame, mode: 'practice', selection: c.drill.selection }); }}><Icon name="hourglass" /> {c.drill.label}</button></div>
            </div>
          </Panel>
        )}
        <Panel title="Teach-in-world" icon="scroll">
          <p className="small muted"><b>Watch for:</b> {c.misconception}</p>
          <div className="stack">
            {c.teach.map((t) => (
              <div key={t.title} className="teach-card">
                <b>{t.title}</b>
                <p className="small">{labeled(t.text)}</p>
                {t.visual && <MathVisual visual={t.visual} />}
                {t.model && <AcademyModel model={t.model} />}
                {t.lessonId && lessonById(t.lessonId) && <button className="btn small ghost" onClick={() => { play('open'); dispatch({ type: 'START_LESSON', lessonId: t.lessonId! }); }}><Icon name="scroll" /> Ask Vector: {lessonById(t.lessonId)!.title}</button>}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Meters({ g }: { g: ChapterGates }) {
  const dot = (ok: boolean, partial?: boolean) => <i className={`gate-dot ${ok ? 'ok' : partial ? 'part' : ''}`} />;
  return (
    <div className="gates">
      <span>{dot(g.questsCleared === 2, g.questsCleared === 1)} Quests {g.questsCleared}/2</span>
      <span>{dot(g.concept.pass, g.concept.attempts > 0)} Concept</span>
      <span>{dot(g.fluency.pass, g.fluency.have > 0)} Fluency</span>
      <span>{dot(g.transfer.pass, g.transfer.attempts > 0)} Transfer</span>
      <span className={g.mastered ? 'mastered' : ''}>{g.mastered ? '★ Mastered' : `${g.missing.length} to go`}</span>
    </div>
  );
}

/* ---------------- stage ---------------- */
function AcademyStage() {
  const { state, dispatch, play } = useGame();
  const r = state.academy.run!;
  const step = r.steps[r.index];
  const c = chapterOf(r.academyId, r.chapter)!;
  const total = r.steps.filter((s) => s.kind === 'ask').length;
  const [callout, setCallout] = useState(0);
  const [calloutText, setCalloutText] = useState('');
  useEffect(() => { if (r.feedback?.correct) { setCalloutText(['Yes!', 'Built!', 'Solid!', 'Right!'][r.asked % 4]); setCallout((x) => x + 1); } }, [r.feedback, r.asked]);
  if (r.status === 'done') return <RunEnd />;
  const phase = r.phases ? [...r.phases].reverse().find((p) => r.index >= p.from) : undefined;
  const submit = (given: string) => { if (r.feedback) return; dispatch({ type: 'ACADEMY_ANSWER', given }); };
  const next = () => { play('click'); dispatch({ type: 'ACADEMY_NEXT' }); };
  return (
    <div className="academy-stage">
      <Callout text={calloutText} trigger={callout} color="var(--teal)" />
      <div className="stage-hud">
        <button className="btn small ghost" onClick={() => { if (confirm('Leave this run? Progress on it is lost.')) dispatch({ type: 'ACADEMY_EXIT' }); }}>✕</button>
        <div className="stage-title"><b>{r.title}</b><small>{c.wingName} · {step.kind === 'ask' ? step.wave : step.kind === 'teach' ? 'Teach-in-world' : 'Hook'}{phase ? ` · ${phase.name}` : ''}</small></div>
        <div className="stage-score"><b>{r.correct}</b>/{r.asked} <small>of {total}</small></div>
      </div>
      <Bar value={r.asked} max={total} thin kind="xp" />
      <div className="stage-body">
        {step.kind === 'hook' && (
          <div className="hook-card">
            <img src={npcPortrait(step.speaker)} alt="" className="hook-face" />
            <div><div className="small muted">{npcName(step.speaker)}</div><p>{step.text}</p></div>
            <button className="btn primary big block" onClick={next} autoFocus>Let's go ▸</button>
          </div>
        )}
        {step.kind === 'teach' && (
          <div className="teach-stage">
            <div className="small muted">TEACH-IN-WORLD</div>
            <h2>{step.title}</h2>
            <p>{labeled(step.text)}</p>
            {!!step.steps?.length && <ol className="teach-steps" aria-label="Worked example">{step.steps.map((l, i) => <li key={i}>{labeled(l)}</li>)}</ol>}
            {[step.text, ...(step.steps ?? [])].some(hasLabels) && <LabelKey />}
            {step.visual && <MathVisual visual={step.visual} />}
            {step.model && <AcademyModel model={step.model} resetKey={String(r.index)} />}
            {step.next && <p className="teach-next"><b>Try next:</b> {labeled(step.next)}</p>}
            <div className="row wrap" style={{ justifyContent: 'center' }}>
              {step.lessonId && lessonById(step.lessonId) && <button className="btn small ghost" onClick={() => { play('open'); dispatch({ type: 'START_LESSON', lessonId: step.lessonId! }); }}><Icon name="scroll" /> Ask Vector</button>}
              <button className="btn primary big" onClick={next}>Got it ▸</button>
            </div>
          </div>
        )}
        {step.kind === 'ask' && <AskPanel step={step} onSubmit={submit} onNext={next} />}
      </div>
    </div>
  );
}

/** The expression line repeats nothing new when the prompt already contains it. */
const squash = (t: string) => t.toLowerCase().replace(/[\s.,:?!]/g, '').replace(/[−–]/g, '-');
const sameText = (prompt: string, expr: string) => !expr.trim() || squash(prompt).includes(squash(expr));

function AskPanel({ step, onSubmit, onNext }: { step: AskStep; onSubmit: (g: string) => void; onNext: () => void }) {
  const { state, dispatch, play } = useGame();
  const r = state.academy.run!;
  const fb = r.feedback;
  const q = step.question;
  const judged = (v: string) => judge(step, v);
  const helper = r.helperOn || (step.verb !== 'type' && q.visualFirst && step.verb !== 'pickmodel' && !step.model);
  const trialHelper = r.kind === 'trial';
  return (
    <div className="ask-panel">
      {step.aid && !fb && <AcademyModel model={step.aid} resetKey={`${r.index}`} />}
      {step.verb === 'type' ? (
        <MathChallenge question={q} feedback={fb} onSubmit={onSubmit} onNext={onNext} showExplanation={r.showExplanation} onToggleExplanation={() => dispatch({ type: 'ACADEMY_TOGGLE_EXPLAIN' })} nextLabel={fb?.correct ? 'Next' : r.attempts === 1 && r.kind === 'quest' ? 'Try again' : 'Next'} compact={!r.helperOn} onHint={trialHelper && !r.helperUsed ? () => dispatch({ type: 'ACADEMY_HELP' }) : !trialHelper ? () => dispatch({ type: 'ACADEMY_HELP' }) : undefined} hintShown={r.helperOn} hintCharges={trialHelper ? (r.helperUsed ? 0 : 1) : undefined} />
      ) : (
        <div className="challenge">
          <div className="prompt">{labeled(q.prompt)}</div>
          {step.ask && <div className="verb-ask">{labeled(step.ask)}</div>}
          {!step.ask && <div className="expr applied">{q.expression}</div>}
          {step.ask && !sameText(q.prompt, q.expression) && <div className="expr applied expr-small">{q.expression}</div>}
          {helper && !step.model && !fb && <MathVisual visual={q.visual} />}
          {step.model && showVisualOnModel(r.academyId, step) && <MathVisual visual={q.visual} />}
          {step.model && <AcademyModel model={step.model} onSubmit={onSubmit} disabled={!!fb} resetKey={`${r.index}-${r.attempts}`} ask={`${q.prompt} ${step.ask ?? ''}`} />}
          {step.verb === 'choose' && <ChoiceButtons step={step} onSubmit={onSubmit} disabled={!!fb} judged={judged} />}
          {step.verb === 'pickmodel' && <PickModel step={step} onSubmit={onSubmit} disabled={!!fb} judged={judged} />}
          {fb && <div className={`feedback ${fb.correct ? 'correct' : 'wrong'}`}>{labeled(fb.text)}</div>}
          {!fb && r.helperOn && <div className="feedback" style={{ borderColor: 'var(--teal)', color: '#99f6e4', background: 'rgba(45,212,191,0.08)' }}>Hint: {labeled(q.hint)}</div>}
          <div className="tools">
            {!fb && !r.helperOn && (!trialHelper || !r.helperUsed) && <button className="btn small ghost" onClick={() => dispatch({ type: 'ACADEMY_HELP' })}><Icon name="lantern" /> {trialHelper ? 'Use helper (1)' : 'Hint'}</button>}
            {fb && <button className="btn small ghost" onClick={() => dispatch({ type: 'ACADEMY_TOGGLE_EXPLAIN' })}><Icon name="book" /> {r.showExplanation ? 'Hide' : 'Show me how'}</button>}
            {fb && <button className="btn teal" onClick={onNext} autoFocus>{fb.correct ? 'Next' : r.attempts === 1 && r.kind === 'quest' ? 'Try again' : 'Next'} ⏎</button>}
          </div>
          {r.showExplanation && fb && <Explanation q={q} />}
        </div>
      )}
      {/* rounded answers (a sine, a log, e^x) need a calculator, as they would in class */}
      {!fb && !!q.tolerance && <Calculator key={r.index} radiansFirst={/radian|π/i.test(`${q.prompt} ${q.expression}`)} />}
      {!fb && r.kind === 'quest' && (
        <div className="row wrap small muted" style={{ justifyContent: 'center', marginTop: 6 }}>
          <button className="btn small ghost" onClick={() => { play('open'); const c = chapterOf(r.academyId, r.chapter)!; dispatch({ type: 'PLAY_TRAIN', game: c.drill.game as ArcadeGame, selection: c.drill.selection, label: c.drill.label }); }}><Icon name="hourglass" /> Train in the Arcade, come back with a shield</button>
        </div>
      )}
    </div>
  );
}

function RunEnd() {
  const { state, dispatch, play } = useGame();
  const r = state.academy.run!;
  const c = chapterOf(r.academyId, r.chapter)!;
  const a = academyById(r.academyId)!;
  const g = chapterGates(state, r.academyId, r.chapter);
  const rule = passRule(r);
  const grad = graduation(state, r.academyId);
  const [boom, setBoom] = useState(0);
  useEffect(() => { if (r.passed) { setBoom(1); play('victory'); } }, [r.passed, play]);
  const title = r.kind === 'trial' ? (r.passed ? 'TRIAL PASSED' : 'TRIAL NOT PASSED') : r.kind === 'quest' ? (r.passed ? 'QUEST CLEARED' : 'NOT YET') : r.passed ? 'CHECK PASSED' : 'NOT YET';
  return (
    <div className="academy-stage">
      <Confetti trigger={boom} />
      <div className="stage-body">
        <div className="battle-end academy-end">
          <div className="small muted">{c.wingName}</div>
          <h1 className={r.passed ? 'win' : 'lose'}>{title}</h1>
          <div className="end-score">{r.correct} of {rule.of} right · needed {rule.need}</div>
          {r.passed && r.worldText && <div className="end-story"><Icon name="lantern" /> {r.worldText}</div>}
          {r.kind === 'quest' && (
            <div className="end-side done">Chapter {c.n}: quests {g.questsCleared}/2 · concept {g.concept.pass ? '✓' : '·'} · fluency {g.fluency.pass ? '✓' : `${g.fluency.have}/${g.fluency.n}`} · transfer {g.transfer.pass ? '✓' : '·'}{g.mastered ? ' · ★ mastered' : ''}</div>
          )}
          {r.kind === 'trial' && r.passed && <div className="end-story">The Engine is ready. {grad.ready ? `Seat the ${a.coreName}.` : grad.reasons[0]}</div>}
          <div className="end-actions">
            {r.kind === 'trial' && r.passed && grad.ready && <button className="btn primary big" onClick={() => { play('open'); dispatch({ type: 'ACADEMY_GRADUATE', academy: r.academyId }); }}><Icon name="reactor" /> Seat the core</button>}
            <button className="btn primary" onClick={() => { play('open'); dispatch({ type: 'ACADEMY_EXIT' }); }}>Continue ▸</button>
            {r.kind === 'quest' && r.questId && <button className="btn ghost" onClick={() => { play('open'); dispatch({ type: 'ACADEMY_START', kind: 'quest', questId: r.questId }); }}>Play again</button>}
          </div>
          {!g.fluency.pass && r.kind === 'quest' && (
            <button className="end-train" onClick={() => { play('open'); dispatch({ type: 'ARCADE_START', game: c.drill.game as ArcadeGame, mode: 'practice', selection: c.drill.selection }); }}>
              <Icon name="hourglass" /><span><b>Sharpen in the Arcade: {c.drill.label}</b><small>Fluency counts every answer, from anywhere. {g.fluency.have}/{g.fluency.n} logged.</small></span><span className="pr-go">▸</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- dashboard ---------------- */
function MasteryDashboard({ a }: { a: AcademyDef }) {
  const { state, dispatch } = useGame();
  const grad = graduation(state, a.id);
  const critical = criticalFacts(state, a.id);
  const track = trackOf(state.academy, a.id);
  const bandColor = { none: '#475569', building: '#f59e0b', easy: '#4ade80', target: '#2dd4bf' } as const;
  const nxt = nextAcademy(a.id);
  return (
    <div className="screen-scroll">
      <div className="container stack academy" style={{ maxWidth: 720 }}>
        <div className="academy-head"><div><div className="small muted">{a.name.toUpperCase()}</div><h1>Mastery dashboard</h1></div><button className="btn small ghost" onClick={() => dispatch({ type: 'ACADEMY_OPEN', view: 'hub', academy: a.id })}>{a.short}</button></div>
        <Panel title="Trial readiness" icon="reactor">
          <div className="small">{grad.chaptersMastered}/{grad.total} chapters mastered · weak facts {critical.length ? `${critical.length} critical` : 'clear'} · trial {grad.trialPass ? 'passed' : track.trial.attempts ? `best ${track.trial.best}` : 'not attempted'}</div>
          {grad.reasons.length > 0 && <ul className="reasons">{grad.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
          {critical.length > 0 && <button className="btn small" onClick={() => dispatch({ type: 'NAVIGATE', screen: 'notebook' })}><Icon name="book" /> Repair in the Notebook</button>}
        </Panel>
        <Panel title="Chapter gates" icon="dashboard">
          <table className="gate-table"><thead><tr><th>Ch</th><th>Quests</th><th>Concept</th><th>Fluency</th><th>Transfer</th><th></th></tr></thead>
            <tbody>{coreChapters(a).map((c) => { const g = chapterGates(state, a.id, c.key); return (
              <tr key={c.key} className={g.mastered ? 'mastered' : ''}>
                <td><button className="link" onClick={() => dispatch({ type: 'ACADEMY_OPEN', view: 'chapter', academy: a.id, chapter: c.key })}>{c.n}. {c.title}</button></td>
                <td>{g.questsCleared}/2</td>
                <td>{g.concept.pass ? '✓' : g.concept.attempts ? `${g.concept.best}/3` : '·'}</td>
                <td><span className="band" style={{ background: bandColor[g.fluency.band] }} title={g.fluency.band} /> {g.fluency.have ? `${Math.round(g.fluency.accuracy * 100)}%` : '·'}</td>
                <td>{g.transfer.pass ? '✓' : g.transfer.attempts ? `${g.transfer.best}/${c.transferCount}` : '·'}</td>
                <td>{g.mastered ? '★' : ''}</td>
              </tr>
            ); })}</tbody></table>
          <p className="small muted">Fluency bands: grey none · amber building · green easy · teal target. Every answer counts: Academy, Arcade, battles.</p>
        </Panel>
        <Panel title="Where it leads" icon="map">
          <p className="small">{nxt ? `Graduation seats the ${a.coreName} and opens the ${nxt.name}${regionById(nxt.home) && nxt.home !== a.home ? ` in ${regionById(nxt.home)!.name}` : ''}.` : `Graduation seats the ${a.coreName}: the last core of the Engine.`}</p>
        </Panel>
      </div>
    </div>
  );
}

/** Compact entry card for the village and the map: the academy you are working on. */
export function AcademyCard() {
  const { state, dispatch, play } = useGame();
  const a = currentAcademy(state);
  const next = academyNext(state, a.id);
  const core = coreChapters(a);
  const mastered = core.filter((c) => chapterGates(state, a.id, c.key).mastered).length;
  const rung = ACADEMIES.indexOf(a) + 1;
  return (
    <button className="academy-card" onClick={() => { play('open'); dispatch({ type: 'ACADEMY_OPEN', view: 'hub', academy: a.id }); }}>
      <Icon name={a.icon} />
      <span className="pr-body"><b>{a.name}</b><small>{graduated(state, a.id) ? `Graduated · ${a.coreName} seated` : state.academy.started ? `Academy ${rung} of ${ACADEMIES.length} · ${mastered}/${core.length} mastered · next: ${next.label}` : 'The Academies: a ladder from counting to differential equations.'}</small></span>
      <span className="pr-go">{state.academy.started ? 'Continue ▸' : 'Start ▸'}</span>
    </button>
  );
}
