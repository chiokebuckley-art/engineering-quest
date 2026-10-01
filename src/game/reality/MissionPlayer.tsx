import { useEffect, useMemo, useState } from 'react';
import { createRng } from '../../engine/rng';
import { useGame } from '../store';
import { MISSIONS, stageMastery, type Mission, type Stage, type Quiz, type TeachShow, type Control } from '../../engine/reality/missions';
import { KIT01, componentById } from '../../engine/reality/kit01';
import { RECIPES, recipeCircuit, recipeSlots, faultOf, type Recipe } from '../../engine/reality/recipes';
import { SKETCHES } from '../../engine/reality/sketches';
import { defaultEnv, emptyCircuit, buildNets, parseHole, parseRail, ROWS, COLS, type Circuit, type Env, type Ref } from '../../engine/reality/circuit';
import type { Slots } from '../../engine/reality/runtime';
import type { StageResult } from '../../engine/reality/progress';
import { CircuitMat } from './CircuitMat';
import { TestStation, SerialMonitor, CodeCard, Meters } from './LabPanels';
import { PhotoBench, IoStrip, cropStyle } from './Kit';
import { useBench } from './useBench';
import { InventStage } from './Invent';
import { Glossed } from './Glossed';
import { labeled, hasLabels, LabelKey } from '../components/Labeled';
import { PART_INTRO, JOB_LABEL } from '../../engine/reality/intro';
import { asset } from '../../assets';

type Done = (ok: boolean, extra?: Partial<StageResult>) => void;
const seedOf = (k: string, n: number) => { let h = 2166136261; for (const ch of `${k}:${n}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/**
 * Plays a mission from its saved stage, or a single stage (an error-book retry). Each stage reports once:
 * right or wrong on the first try (a wrong try gets feedback and a fresh variant), then Continue.
 */
export function MissionPlayer({ mission, only, fixes, onExit }: { mission: Mission; only?: number; fixes?: string; onExit: () => void }) {
  const { state, dispatch, play } = useGame();
  const saved = state.reality.missions[mission.id];
  const [idx, setIdx] = useState(only ?? Math.min(saved?.stage ?? 0, mission.stages.length - 1));
  const [passed, setPassed] = useState<Record<number, boolean>>({});
  const [finished, setFinished] = useState(false);
  const stage = mission.stages[idx];
  const attemptBase = (state.reality.seen[`${mission.id}:${idx}`] ?? 0) + (fixes ? 7 : 0);
  const [attempt, setAttempt] = useState(0);
  const seed = seedOf(`${state.character?.name ?? ''}:${mission.id}:${idx}`, attemptBase + attempt);
  const report: Done = (ok, extra = {}) => {
    const m = stageMastery(stage);
    const component = extra.component ?? ((stage.kind === 'hunt' || stage.kind === 'quiz') && 'component' in stage ? (stage as { component?: string }).component : undefined);
    dispatch({ type: 'REALITY_RESULT', result: { mission: mission.id, stage: idx, ok, skill: m?.skill, mstage: m?.stage, ...extra, component, fixes: ok ? fixes : undefined } });
    play(ok ? 'correct' : 'wrong');
    // A finished observation counts even when the prediction missed (the miss goes to the error book).
    if (ok || extra.prediction) setPassed((p) => ({ ...p, [idx]: true }));
  };
  const retry = () => { dispatch({ type: 'REALITY_SEEN', key: `${mission.id}:${idx}` }); setAttempt((a) => a + 1); };
  const next = () => {
    if (only !== undefined) { onExit(); return; }
    if (idx + 1 >= mission.stages.length) {
      dispatch({ type: 'REALITY_DONE', mission: mission.id }); dispatch({ type: 'REALITY_STAGE', mission: mission.id, stage: 0 }); setFinished(true); return;
    }
    dispatch({ type: 'REALITY_STAGE', mission: mission.id, stage: idx + 1 }); setIdx(idx + 1); setAttempt(0); setHelp(false);
    window.scrollTo({ top: 0 });
  };
  const back = () => { if (idx > 0 && only === undefined) { setIdx(idx - 1); setAttempt(0); } };
  const canContinue = stage.kind === 'teach' || passed[idx];
  const markDone = () => setPassed((p) => (p[idx] ? p : { ...p, [idx]: true }));
  const [help, setHelp] = useState(false);
  const hasLessons = mission.stages.slice(0, idx).some((x) => x.kind === 'teach' || x.kind === 'tour');
  const asks = !['teach', 'tour', 'invent'].includes(stage.kind);

  if (finished) return <MissionDone mission={mission} onExit={onExit} />;
  return (
    <div className="rl-mission">
      <div className="rl-mission-head">
        <button className="rl-chip" onClick={onExit}>← Lab</button>
        <div><div className="small muted">{mission.id === 'boss' ? 'BOSS QUEST' : `MISSION ${String(mission.n).padStart(2, '0')}`}{only !== undefined ? ' · RETRY' : ''}</div><b>{mission.title}</b></div>
        <span className="small muted">{idx + 1}/{mission.stages.length}</span>
      </div>
      <div className="rl-progress" aria-hidden="true">{mission.stages.map((_, i) => <i key={i} className={i < idx ? 'done' : i === idx ? 'now' : ''} />)}</div>
      {asks && hasLessons && (
        <div className="rl-help">
          <button className={`rl-chip ${help ? 'on' : ''}`} onClick={() => setHelp((h) => !h)} aria-expanded={help}>💡 {help ? 'Hide the lesson' : 'Not sure? See the lesson again'}</button>
          {help && <LessonRecap mission={mission} upTo={idx} />}
        </div>
      )}
      <div className="rl-stage" key={`${idx}-${attempt}`}>
        <StageView stage={stage} seed={seed} mission={mission} report={report} retry={retry} passed={!!passed[idx]} onSeen={markDone} />
      </div>
      <div className="rl-stage-foot">
        {only === undefined && idx > 0 && <button className="rl-chip" onClick={back}>← Back</button>}
        <span className="grow" />
        <button className="rl-next" disabled={!canContinue} onClick={next}>{idx + 1 >= mission.stages.length || only !== undefined ? 'Finish ✓' : 'Continue →'}</button>
      </div>
    </div>
  );
}

function MissionDone({ mission, onExit }: { mission: Mission; onExit: () => void }) {
  const nextM = MISSIONS.find((m) => m.n === mission.n + 1);
  return (
    <div className="rl-done">
      <div className="rl-done-badge">✓</div>
      <h2>{mission.title}: complete</h2>
      <p><b>Exit evidence:</b> {mission.exit}</p>
      {mission.maths?.length ? <p className="small">The maths you used: {labeled(mission.maths.map((m) => m.label).join(' · '))}</p> : null}
      <p className="small muted">Missed questions wait in your error book with a fresh variant to retry.</p>
      <div className="rl-actions"><button className="rl-next" onClick={onExit}>Back to the lab{nextM ? ` · next: ${nextM.title}` : ''}</button></div>
    </div>
  );
}

function StageView({ stage, seed, mission, report, retry, passed, onSeen }: { stage: Stage; seed: number; mission: Mission; report: Done; retry: () => void; passed: boolean; onSeen: () => void }) {
  switch (stage.kind) {
    case 'teach': return <TeachStage stage={stage} />;
    case 'tour': return <TourStage stage={stage} onSeen={onSeen} />;
    case 'hunt': return <HuntStage stage={stage} seed={seed} report={report} passed={passed} />;
    case 'quiz': return <QuizStage quiz={stage.gen(createRng(seed))} report={report} retry={retry} passed={passed} />;
    case 'sort': return <SortStage items={stage.items} report={report} passed={passed} />;
    case 'strips': return <StripsStage seed={seed} report={report} retry={retry} passed={passed} />;
    case 'build': return <BuildStage recipe={RECIPES[stage.recipe]} intro={stage.intro} report={report} passed={passed} />;
    case 'observe': return <ObserveStage stage={stage} seed={seed} report={report} passed={passed} mission={mission.id} />;
    case 'code': return <CodeStage stage={stage} report={report} passed={passed} />;
    case 'debug': return <DebugStage stage={stage} seed={seed} report={report} retry={retry} passed={passed} />;
    case 'invent': return <InventStage report={report} passed={passed} />;
  }
}

/* ---------------- teach ---------------- */

export function TeachVisual({ show }: { show: TeachShow }) {
  if (show.kind === 'io') { const c = componentById(show.component); return c ? <IoStrip c={c} /> : null; }
  if (show.kind === 'jobs') return (
    <div className="rl-jobs" aria-label="Input, then controller, then output: a night light">
      <div className="rl-job-box input"><small>INPUT</small><b>Light sensor</b><span>notices “it’s dark”</span></div><span className="rl-arrow" aria-hidden="true">→</span>
      <div className="rl-job-box controller"><small>CONTROLLER</small><b>UNO</b><span>decides “turn on”</span></div><span className="rl-arrow" aria-hidden="true">→</span>
      <div className="rl-job-box output"><small>OUTPUT</small><b>LED</b><span>glows</span></div>
      <div className="rl-job-box support"><small>SUPPORT</small><b>Wires, breadboard, USB</b><span>connect it all and bring power</span></div>
    </div>
  );
  if (show.kind === 'photo') return <span className="rl-crop big center" style={cropStyle(show.tile)} role="img" aria-label="A tile from your kit photo" />;
  if (show.kind === 'formula') return <div className="rl-formula">{show.lines.map((l, i) => <div key={i}>{labeled(l)}</div>)}{show.lines.some(hasLabels) && <LabelKey />}</div>;
  if (show.kind === 'loop') return (
    <svg viewBox="0 0 320 120" className="rl-diagram" role="img" aria-label="A loop: 5 V to resistor to LED back to ground">
      <rect x="10" y="40" width="50" height="40" rx="6" fill="#1d5aa6" /><text x="35" y="58" className="rl-dg-t">5V</text><text x="35" y="72" className="rl-dg-t">GND</text>
      <path d="M 60 50 H 140" stroke="#e5383b" strokeWidth="3" /><rect x="140" y="42" width="40" height="16" rx="5" fill="#e8d3a8" /><path d="M 180 50 H 240" stroke="#f4c430" strokeWidth="3" />
      <circle cx="252" cy="50" r="12" fill="#ff3b30" /><path d="M 264 50 H 300 V 100 H 30 V 80" stroke="#222" strokeWidth="3" fill="none" />
      <text x="160" y="30" className="rl-dg-l">resistor</text><text x="252" y="30" className="rl-dg-l">LED</text><text x="160" y="116" className="rl-dg-l">back to ground: the loop closes</text>
      <circle r="4" fill="#ffd23f"><animateMotion dur="3s" repeatCount="indefinite" path="M 60 50 H 300 V 100 H 30 V 80" /></circle>
    </svg>
  );
  if (show.kind === 'strips') return (
    <svg viewBox="0 0 320 150" className="rl-diagram" role="img" aria-label="Breadboard strips: each column's a to e are joined, f to j are joined, rails run along the edges">
      <rect x="5" y="5" width="310" height="140" rx="8" fill="#f4f1e8" stroke="#cfc8b6" />
      <line x1="20" x2="300" y1="16" y2="16" stroke="#e23b3b" strokeWidth="5" opacity="0.5" /><line x1="20" x2="300" y1="30" y2="30" stroke="#2d6fe0" strokeWidth="5" opacity="0.5" />
      {Array.from({ length: 14 }, (_, i) => <g key={i}><rect x={24 + i * 20} y="44" width="6" height="40" rx="3" fill={i === 5 ? '#ffd23f' : '#d8d2c2'} /><rect x={24 + i * 20} y="96" width="6" height="40" rx="3" fill={i === 5 ? '#7fd1ff' : '#d8d2c2'} /></g>)}
      <rect x="14" y="87" width="292" height="6" fill="#e2dccb" /><text x="160" y="92" className="rl-dg-l">middle gap</text>
      <text x="160" y="12" className="rl-dg-l">+ rail and − rail run the whole length</text>
    </svg>
  );
  if (show.kind === 'recipe') { const r = RECIPES[show.recipe]; return r ? <ol className="rl-steps">{r.steps.map((s, i) => <li key={i}>{s.text}</li>)}</ol> : null; }
  return null;
}
function TeachStage({ stage }: { stage: Extract<Stage, { kind: 'teach' }> }) {
  return <div className="rl-teach"><h2>{stage.title}</h2>{stage.show && <TeachVisual show={stage.show} />}<Glossed as="p" text={stage.text} />{hasLabels(stage.text) && !(stage.show?.kind === 'formula' && stage.show.lines.some(hasLabels)) && <LabelKey />}<p className="rl-tip small muted">Tip: tap an underlined word to see what it means.</p></div>;
}

/* ---------------- meet the parts ---------------- */

/** Where a part sits on the lid photo: the whole lid, with that tile outlined. */
function KitLocator({ tile }: { tile: string }) {
  const [x0, y0, x1, y1] = KIT01.hotspots[tile];
  return (
    <div className="rl-locator" aria-label={`Tile ${tile} on your kit lid`}>
      <img src={asset(KIT01.image)} alt="" draggable={false} />
      <i style={{ left: `${x0 * 100}%`, top: `${y0 * 100}%`, width: `${(x1 - x0) * 100}%`, height: `${(y1 - y0) * 100}%` }} />
    </div>
  );
}

function TourStage({ stage, onSeen }: { stage: Extract<Stage, { kind: 'tour' }>; onSeen: () => void }) {
  const [i, setI] = useState(0);
  const last = stage.parts.length - 1;
  useEffect(() => { if (i >= last) onSeen(); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const c = componentById(stage.parts[i])!;
  const intro = PART_INTRO[c.id];
  const go = (n: number) => { setI(Math.max(0, Math.min(last, n))); };
  return (
    <div className="rl-tour">
      <h2>{stage.title}</h2>
      <p className="small">{stage.text}</p>
      <div className="rl-tour-dots" role="tablist" aria-label="Parts">
        {stage.parts.map((id, k) => { const p = componentById(id)!; return <button key={id} role="tab" aria-selected={k === i} className={`rl-tour-dot ${k === i ? 'on' : k < i ? 'seen' : ''}`} onClick={() => go(k)} title={p.name}><span className="rl-crop tiny" style={cropStyle(p.tile)} aria-hidden="true" /></button>; })}
      </div>
      <div className="rl-tour-card" key={c.id}>
        <div className="rl-tour-head">
          <span className="rl-crop big" style={cropStyle(c.tile)} role="img" aria-label={`Photo of the ${c.name}`} />
          <div>
            <small className="muted">Part {i + 1} of {stage.parts.length}</small>
            <h3>{c.name}</h3>
            {intro && <span className={`rl-jobtag job-${intro.job}`}>{JOB_LABEL[intro.job].name}: {JOB_LABEL[intro.job].does}</span>}
          </div>
        </div>
        <Glossed as="p" className="rl-plain" text={intro?.plain ?? c.what} />
        {intro && <p className="rl-like">💭 {intro.like}</p>}
        {intro && <p className="small">👀 <b>How to spot it:</b> {intro.look}</p>}
        <div className="small muted">Here it is on your kit:</div>
        <KitLocator tile={c.tile} />
      </div>
      <div className="rl-actions">
        <button className="rl-chip" disabled={i === 0} onClick={() => go(i - 1)}>← Previous</button>
        <span className="grow" />
        {i < last ? <button className="rl-chip primary" onClick={() => go(i + 1)}>Next part →</button> : <span className="small">That’s all of them. Tap <b>Continue</b> when you’re ready.</span>}
      </div>
    </div>
  );
}

/** The lessons so far in this mission, to look back at without losing the question. */
function LessonRecap({ mission, upTo }: { mission: Mission; upTo: number }) {
  const lessons = mission.stages.slice(0, upTo).filter((x): x is Extract<Stage, { kind: 'teach' | 'tour' }> => x.kind === 'teach' || x.kind === 'tour');
  return (
    <div className="rl-recap">
      {lessons.map((l, k) => l.kind === 'teach' ? (
        <div key={k} className="rl-recap-item"><b>{l.title}</b>{l.show && l.show.kind !== 'photo' && <TeachVisual show={l.show} />}<Glossed as="p" text={l.text} /></div>
      ) : (
        <div key={k} className="rl-recap-item"><b>{l.title}</b>
          {l.parts.map((id) => { const c = componentById(id)!; const it = PART_INTRO[id]; return (
            <div key={id} className="rl-recap-part"><span className="rl-crop" style={cropStyle(c.tile)} aria-hidden="true" /><span><b>{c.name}</b>{it && <em> · {JOB_LABEL[it.job].name}</em>}<br /><small>{it?.plain ?? c.what}</small></span></div>
          ); })}
        </div>
      ))}
    </div>
  );
}

/* ---------------- quiz ---------------- */

function QuizStage({ quiz, report, retry, passed, onAnswer }: { quiz: Quiz; report: Done; retry: () => void; passed: boolean; onAnswer?: (i: number, ok: boolean) => void }) {
  const [pick, setPick] = useState<number | null>(null);
  const ok = pick === quiz.answer;
  const choose = (i: number) => {
    if (pick !== null) return;
    setPick(i); const good = i === quiz.answer;
    onAnswer?.(i, good);
    if (!onAnswer) report(good, good ? {} : { error: { tag: quiz.wrong[i]?.tag ?? 'misread', prompt: quiz.prompt, chosen: quiz.choices[i], correct: quiz.choices[quiz.answer], why: quiz.why } });
  };
  return (
    <div className="rl-quiz">
      {quiz.show && <TeachVisual show={quiz.show} />}
      <Glossed as="p" className="rl-q" text={quiz.prompt} />
      <div className="rl-choices">{quiz.choices.map((c, i) => <button key={i} className={`rl-choice ${pick === null ? '' : i === quiz.answer ? 'right' : i === pick ? 'wrong' : 'dim'}`} onClick={() => choose(i)} disabled={pick !== null}>{c}</button>)}</div>
      {pick !== null && (
        <div className={`rl-feedback ${ok ? 'ok' : 'bad'}`} role="status">
          {ok ? <><b>Yes.</b> <Glossed text={quiz.why} /></> : <><b>Not quite.</b> <Glossed text={quiz.wrong[pick]?.why ?? ''} /> <span className="muted"><Glossed text={quiz.why} /></span></>}{hasLabels(quiz.why) && <LabelKey />}
          {!ok && !passed && !onAnswer && <div><button className="rl-chip primary" onClick={retry}>Try a fresh question</button></div>}
        </div>
      )}
    </div>
  );
}

/* ---------------- hunt on the photo ---------------- */

function HuntStage({ stage, seed, report, passed }: { stage: Extract<Stage, { kind: 'hunt' }>; seed: number; report: Done; passed: boolean }) {
  const h = useMemo(() => stage.gen(createRng(seed)), [stage, seed]);
  const [flash, setFlash] = useState<{ tile: string; ok: boolean } | null>(null);
  const [said, setSaid] = useState('');
  const [missed, setMissed] = useState(false);
  const [found, setFound] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  return (
    <div className="rl-hunt">
      <p className="rl-q">🔎 <Glossed text={h.prompt} /></p>
      <PhotoBench hint="Tap the tile on your kit." reveal={found || showAnswer ? h.targets : []} flash={flash} onPick={(c) => {
        if (found) return;
        const ok = h.targets.includes(c.id);
        setFlash({ tile: c.tile, ok });
        if (ok) { setFound(true); setSaid(`Yes: ${c.name}. ${h.why}`); report(true, { component: c.id }); }
        else {
          setSaid(`That’s the ${c.name}: ${c.what} Look again.`);
          if (!missed) { setMissed(true); report(false, { error: { tag: 'identify', prompt: h.prompt, chosen: c.name, correct: h.targets.map((t) => componentById(t)?.name).join(' / '), why: h.why } }); }
        }
      }} />
      {said && <div className={`rl-feedback ${found ? 'ok' : 'bad'}`} role="status">{said}</div>}
      {!found && missed && <p className="small">💡 Hint: you’re looking for the <b>{h.targets.map((t) => componentById(t)?.name).filter(Boolean).join(' or ')}</b>. {PART_INTRO[h.targets[0]]?.look ?? ''}</p>}
      {!found && missed && !passed && <button className="rl-chip" onClick={() => setShowAnswer(true)}>Show me where</button>}
    </div>
  );
}

/* ---------------- sort by role ---------------- */

const BUCKETS = [['input', 'Input (senses)'], ['controller', 'Controller (decides)'], ['output', 'Output (acts)'], ['support', 'Support / power']] as const;
function SortStage({ items, report, passed }: { items: string[]; report: Done; passed: boolean }) {
  const [pick, setPick] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const want = (id: string) => { const r = componentById(id)!.role; return r === 'power' || r === 'support' ? 'support' : r === 'driver' ? 'output' : r; };
  const wrong = items.filter((id) => pick[id] !== want(id));
  const check = () => {
    setChecked(true); setFlagged(new Set(wrong));
    const ok = wrong.length === 0;
    report(ok, ok ? {} : { error: { tag: 'role-confusion', prompt: 'Sort the parts by role', chosen: wrong.map((id) => `${componentById(id)!.name} → ${pick[id] ?? '—'}`).join('; '), correct: wrong.map((id) => `${componentById(id)!.name} → ${want(id)}`).join('; '), why: 'Inputs sense, the controller decides, outputs act, support parts connect and power.' } });
  };
  return (
    <div className="rl-sort">
      <p className="rl-q">Sort each part by the job it does.</p>
      {items.map((id) => { const c = componentById(id)!; const bad = flagged.has(id); return (
        <div key={id} className={`rl-sort-row ${bad ? 'bad' : checked || (flagged.size > 0 && pick[id]) ? 'ok' : ''}`}>
          <span className="rl-crop" style={cropStyle(c.tile)} aria-hidden="true" /><b>{c.name}</b>
          <span className="rl-sort-opts">{BUCKETS.map(([k, l]) => <button key={k} className={`rl-chip ${pick[id] === k ? 'on' : ''}`} disabled={checked && !bad && passed} onClick={() => { setPick({ ...pick, [id]: k }); setChecked(false); setFlagged((f) => { const n = new Set(f); n.delete(id); return n; }); }}>{l.split(' ')[0]}</button>)}</span>
          {bad && <small>{c.what}</small>}
        </div>
      ); })}
      <button className="rl-next" disabled={items.some((id) => !pick[id])} onClick={check}>Check my sorting</button>
      {checked && <div className={`rl-feedback ${wrong.length ? 'bad' : 'ok'}`} role="status">{wrong.length ? `${wrong.length} to fix (outlined). Read each one’s job, then check again.` : 'All sorted. Every device you build will have these jobs.'}</div>}
    </div>
  );
}

/* ---------------- breadboard strips ---------------- */

function StripsStage({ seed, report, retry, passed }: { seed: number; report: Done; retry: () => void; passed: boolean }) {
  const rng = createRng(seed);
  const col = rng.int(4, 26); const kind = rng.pick(['top', 'bottom', 'rail'] as const);
  const start: Ref = kind === 'rail' ? `tp${col}` : `h${col}${kind === 'top' ? 'c' : 'h'}`;
  const net = buildNets(emptyCircuit());
  const view = { c0: Math.max(1, col - 5), c1: Math.min(COLS, col + 5) };
  const pts: Ref[] = []; for (let c = view.c0; c <= view.c1; c++) { for (const r of ROWS) pts.push(`h${c}${r}`); pts.push(`tp${c}`, `tn${c}`); }
  const want = new Set(pts.filter((p) => net(p) === net(start)));
  const [sel, setSel] = useState<Set<Ref>>(new Set([start]));
  const [done, setDone] = useState<null | boolean>(null);
  const toggle = (r: Ref) => { if (r === start || done !== null) return; const s = new Set(sel); if (s.has(r)) s.delete(r); else s.add(r); setSel(s); };
  const check = () => { const ok = want.size === sel.size && [...want].every((x) => sel.has(x)); setDone(ok); report(ok, ok ? {} : { error: { tag: kind === 'rail' ? 'breadboard-rails' : 'breadboard-rows', prompt: `Tap every hole joined to ${start}`, chosen: `${sel.size} holes`, correct: `${want.size} holes`, why: kind === 'rail' ? 'A rail is one long strip along the edge.' : 'Holes a–e (or f–j) of one column share a strip; the gap separates the halves.' } }); };
  const x = (c: number) => 20 + (c - view.c0) * 26; const Y: Record<string, number> = { tp: 16, tn: 36, a: 64, b: 84, c: 104, d: 124, e: 144, f: 176, g: 196, h: 216, i: 236, j: 256 };
  const yOf = (r: Ref) => { const h = parseHole(r); if (h) return Y[h.row]; const rl = parseRail(r)!; return Y[rl.rail]; };
  const xOf = (r: Ref) => { const h = parseHole(r); if (h) return x(h.col); return x(parseRail(r)!.col); };
  return (
    <div>
      <p className="rl-q">Tap every hole that is joined to the <b>highlighted</b> one ({kind === 'rail' ? 'on the top + rail' : `hole ${start.slice(1).replace(/^(\d+)(\w)$/, '$2$1')}`}). Then check.</p>
      <svg viewBox={`0 0 ${x(view.c1) + 20} 272`} className="rl-diagram strips" role="group" aria-label="A section of the breadboard">
        <rect x="4" y="4" width={x(view.c1) + 12} height="264" rx="8" fill="#f4f1e8" stroke="#cfc8b6" />
        <rect x="8" y="156" width={x(view.c1) + 4} height="6" fill="#e2dccb" />
        {pts.map((r) => { const on = sel.has(r); const miss = done === false && want.has(r) && !on; const extra = done === false && on && !want.has(r); return (
          <rect key={r} x={xOf(r) - 8} y={yOf(r) - 8} width="16" height="16" rx="3" fill={r === start ? '#ffd23f' : on ? (extra ? '#ff7b7b' : '#7fd1ff') : miss ? '#ffd2a0' : '#bdb6a6'} stroke={miss ? '#e07b00' : 'none'} onClick={() => toggle(r)} style={{ cursor: 'pointer' }} />
        ); })}
      </svg>
      <div className="rl-actions"><button className="rl-next" disabled={done !== null} onClick={check}>Check</button>{done === false && !passed && <button className="rl-chip primary" onClick={retry}>Try another hole</button>}</div>
      {done !== null && <div className={`rl-feedback ${done ? 'ok' : 'bad'}`} role="status">{done ? `Right: ${want.size} holes share that strip.` : `${want.size} holes are joined (missed ones are outlined in orange; extra ones in red). ${kind === 'rail' ? 'A rail runs the whole length.' : 'A strip is five holes in one column, on one side of the gap.'}`}</div>}
    </div>
  );
}

/* ---------------- builds ---------------- */

function useBlowout(setCircuit: (f: (c: Circuit) => Circuit) => void) {
  return (ids: string[]) => setCircuit((c) => ({ ...c, parts: c.parts.map((p) => (ids.includes(p.id) ? { ...p, blown: true } : p)) }));
}

function BuildStage({ recipe, intro, report, passed }: { recipe: Recipe; intro: string; report: Done; passed: boolean }) {
  const [circuit, setCircuit] = useState<Circuit>(emptyCircuit());
  const [usb, setUsb] = useState(false);
  const [env, setEnv] = useState<Env>(defaultEnv());
  const [n, setN] = useState(0);
  const [verdict, setVerdict] = useState<{ ok: boolean; message: string } | null>(null);
  const slots = recipeSlots(recipe);
  const sketch = recipe.sketch ? SKETCHES[recipe.sketch] : null;
  const bench = useBench(circuit, env, usb, sketch ? { sketch, slots } : null, useBlowout(setCircuit));
  const all = n >= recipe.steps.length;
  const plug = (on: boolean) => {
    setUsb(on);
    if (on && all && !passed) window.setTimeout(() => { const v = recipe.check(circuit, slots); setVerdict(v); report(v.ok, v.ok ? {} : { error: { tag: 'build', prompt: `Build: ${recipe.title}`, chosen: 'build did not work', correct: 'the reviewed wiring card', why: v.message } }); }, 900);
  };
  const assist = () => {
    const s = recipe.steps[n]; if (!s) return;
    setCircuit((c) => ('wire' in s ? { ...c, wires: [...c.wires, { id: `w${n}`, a: s.wire[0], b: s.wire[1], color: s.color }] } : { ...c, parts: [...c.parts, { ...s.part, pins: { ...s.part.pins } }] }));
    setN(n + 1);
  };
  return (
    <div className="rl-build">
      <Glossed as="p" className="rl-q" text={intro} />
      <div className="small muted">Parts: {recipe.parts.map((id) => componentById(id)?.name).filter(Boolean).join(', ')} · {recipe.power}</div>
      <ol className="rl-steps">{recipe.steps.map((s, i) => <li key={i} className={i < n ? 'done' : i === n ? 'now' : ''}>{s.text}</li>)}{all && <li className={usb ? 'done' : 'now'}>Plug in the USB cable and watch.</li>}</ol>
      <CircuitMat circuit={circuit} editable={!all} usb={usb} result={bench.result} servo={bench.servo} env={env} txAgo={bench.txAgo} tray={recipe.tray} step={all ? null : recipe.steps[n]}
        onChange={(c) => { setCircuit(c); setN(n + 1); }} onUsb={all ? plug : undefined} onNeedUnplug={() => setUsb(false)}
        onPress={(id, d) => setEnv({ ...env, pressed: { ...env.pressed, [id]: d } })} />
      {!all && <button className="rl-chip" onClick={assist}>Do this step for me</button>}
      {all && usb && <Meters circuit={circuit} result={bench.result} usb={usb} />}
      {all && usb && sketch && <SerialMonitor lines={bench.serial} usb={usb} />}
      {verdict && <div className={`rl-feedback ${verdict.ok ? 'ok' : 'bad'}`} role="status">{verdict.ok ? '✓ ' : ''}{verdict.message}</div>}
    </div>
  );
}

function ObserveStage({ stage, seed, report, passed, mission }: { stage: Extract<Stage, { kind: 'observe' }>; seed: number; report: Done; passed: boolean; mission: string }) {
  const recipe = RECIPES[stage.recipe];
  const quiz = useMemo(() => stage.gen(createRng(seed)), [stage, seed]);
  const [circuit, setCircuit] = useState<Circuit>(() => recipeCircuit(recipe));
  const [usb, setUsb] = useState(true);
  const [env, setEnv] = useState<Env>(() => ({ ...defaultEnv(), ...(stage.control === 'distance' ? { distanceCm: 120 } : stage.control === 'light' ? { light: 80 } : stage.control === 'temp' ? { tempC: 21 } : {}) }));
  const [predicted, setPredicted] = useState<{ i: number; ok: boolean } | null>(null);
  const [observed, setObserved] = useState('');
  const sketch = recipe.sketch ? SKETCHES[recipe.sketch] : null;
  const bench = useBench(circuit, env, usb, sketch ? { sketch, slots: recipeSlots(recipe) } : null, useBlowout(setCircuit));
  const reached = predicted !== null && !observed && stage.goal(bench.result, env, bench.serial);
  if (reached) {
    const seen = stage.seen(bench.result, env, bench.serial);
    window.setTimeout(() => {
      setObserved(seen);
      report(predicted!.ok, { prediction: { mission, prompt: quiz.prompt, predicted: quiz.choices[predicted!.i], right: quiz.choices[quiz.answer], observed: seen, matched: predicted!.ok },
        ...(predicted!.ok ? {} : { error: { tag: quiz.wrong[predicted!.i]?.tag ?? 'predict', prompt: quiz.prompt, chosen: quiz.choices[predicted!.i], correct: quiz.choices[quiz.answer], why: quiz.why } }) });
    }, 0);
  }
  const controls: Control[] = [stage.control];
  return (
    <div className="rl-observe">
      <div className="rl-phase">1 · Predict</div>
      <QuizStage quiz={quiz} report={report} retry={() => undefined} passed={passed} onAnswer={(i, ok) => setPredicted({ i, ok })} />
      {predicted !== null && <>
        <div className="rl-phase">2 · Test it</div>
        <Glossed as="p" className="rl-q" text={stage.task} />
        <CircuitMat circuit={circuit} editable={false} usb={usb} result={bench.result} servo={bench.servo} env={env} txAgo={bench.txAgo} onUsb={setUsb} onPress={(id, d) => setEnv({ ...env, pressed: { ...env.pressed, [id]: d } })} />
        <TestStation circuit={circuit} env={env} setEnv={setEnv} result={bench.result} controls={controls} usb={usb} />
        {sketch && <SerialMonitor lines={bench.serial} usb={usb} />}
        {observed && <div className={`rl-feedback ${predicted.ok ? 'ok' : 'bad'}`} role="status"><b>Observed:</b> {observed}. {predicted.ok ? 'Your prediction matched.' : <>You predicted “{quiz.choices[predicted.i]}”. {labeled(quiz.why)}</>} {!predicted.ok && 'It still counts as done; the miss is in your error book.'}</div>}
      </>}
    </div>
  );
}

function CodeStage({ stage, report, passed }: { stage: Extract<Stage, { kind: 'code' }>; report: Done; passed: boolean }) {
  const recipe = RECIPES[stage.recipe];
  const sketch = SKETCHES[recipe.sketch!];
  const [circuit, setCircuit] = useState<Circuit>(() => recipeCircuit(recipe));
  const [usb, setUsb] = useState(true);
  const [env, setEnv] = useState<Env>(defaultEnv());
  const [slots, setSlots] = useState<Slots>(() => recipeSlots(recipe));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const bench = useBench(circuit, env, usb, { sketch, slots: recipeSlots(recipe) }, useBlowout(setCircuit));
  const onUpload = () => {
    bench.upload(sketch, slots);
    const problem = stage.check(slots);
    if (passed) { setMsg({ ok: !problem, text: problem ?? 'Uploaded.' }); return; }
    setMsg({ ok: !problem, text: problem ?? 'Uploaded and running: that’s it.' });
    report(!problem, problem ? { error: { tag: 'code', prompt: stage.task, chosen: 'uploaded values', correct: stage.hint, why: problem } } : {});
  };
  const controls: Control[] = circuit.parts.some((p) => p.kind === 'ultrasonic') ? ['distance'] : circuit.parts.some((p) => p.kind === 'ldr') ? ['light'] : [];
  return (
    <div className="rl-codestage">
      <Glossed as="p" className="rl-q" text={stage.task} />
      <CodeCard sketch={sketch} slots={slots} setSlots={setSlots} onUpload={onUpload} usb={usb} running={!!bench.sketchId} />
      <CircuitMat circuit={circuit} editable={false} usb={usb} result={bench.result} servo={bench.servo} env={env} txAgo={bench.txAgo} onUsb={setUsb} onPress={(id, d) => setEnv({ ...env, pressed: { ...env.pressed, [id]: d } })} />
      {controls.length > 0 && <TestStation circuit={circuit} env={env} setEnv={setEnv} result={bench.result} controls={controls} usb={usb} />}
      <SerialMonitor lines={bench.serial} usb={usb} />
      {msg && <div className={`rl-feedback ${msg.ok ? 'ok' : 'bad'}`} role="status">{msg.text}{!msg.ok && <span className="muted"> Hint: {labeled(stage.hint)}</span>}</div>}
    </div>
  );
}

function DebugStage({ stage, seed, report, retry, passed }: { stage: Extract<Stage, { kind: 'debug' }>; seed: number; report: Done; retry: () => void; passed: boolean }) {
  const rng = createRng(seed);
  const key = `${stage.recipe}:${rng.pick(stage.faults)}`;
  const { recipe, fault } = faultOf(key)!;
  const broken = useMemo(() => fault.apply(recipeCircuit(recipe), recipeSlots(recipe)), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const [circuit, setCircuit] = useState<Circuit>(broken.circuit);
  const [slots, setSlots] = useState<Slots>(broken.slots);
  const [uploaded, setUploaded] = useState<Slots>(broken.slots);
  const [usb, setUsb] = useState(true);
  const [env, setEnv] = useState<Env>(() => ({ ...defaultEnv(), distanceCm: 100 }));
  const [diag, setDiag] = useState<{ i: number; ok: boolean } | null>(null);
  const [verdict, setVerdict] = useState<{ ok: boolean; message: string } | null>(null);
  const sketch = recipe.sketch ? SKETCHES[recipe.sketch] : null;
  const bench = useBench(circuit, env, usb, sketch ? { sketch, slots: broken.slots } : null, useBlowout(setCircuit));
  const quiz = useMemo(() => {
    const choices = createRng(seed + 1).shuffle([fault.cause, ...fault.decoys.slice(0, 3)]);
    return { prompt: `Symptom: ${fault.symptom} What is wrong?`, choices, answer: choices.indexOf(fault.cause), why: fault.cause, wrong: Object.fromEntries(choices.map((_c, i) => [i, { why: 'That would give a different symptom. Look at what the circuit and the meters show.', tag: fault.tag }]).filter(([i]) => i !== choices.indexOf(fault.cause))) } as Quiz;
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const check = () => {
    const v = recipe.check(circuit, uploaded);
    setVerdict(v);
    const ok = v.ok && !!diag?.ok;
    if (v.ok) report(ok, ok ? {} : { error: { tag: fault.tag, prompt: `Debug: ${fault.symptom}`, chosen: diag ? quiz.choices[diag.i] : '—', correct: fault.cause, why: fault.fix } });
  };
  const controls: Control[] = circuit.parts.some((p) => p.kind === 'button') ? ['button'] : circuit.parts.some((p) => p.kind === 'pot') ? ['knob'] : circuit.parts.some((p) => p.kind === 'ldr') ? ['light'] : circuit.parts.some((p) => p.kind === 'ultrasonic') ? ['distance'] : circuit.parts.some((p) => p.kind === 'dht11') ? ['temp'] : [];
  return (
    <div className="rl-debug">
      <div className="rl-phase">1 · Something’s wrong. Watch it run.</div>
      <p className="rl-q">🐞 <Glossed text={fault.symptom} /></p>
      <CircuitMat circuit={circuit} editable={!!diag} usb={usb} result={bench.result} servo={bench.servo} env={env} txAgo={bench.txAgo} tray={recipe.tray}
        onChange={(c) => { setCircuit(c); setVerdict(null); }} onUsb={setUsb} onNeedUnplug={() => undefined} onPress={(id, d) => setEnv({ ...env, pressed: { ...env.pressed, [id]: d } })} />
      {controls.length > 0 && <TestStation circuit={circuit} env={env} setEnv={setEnv} result={bench.result} controls={controls} usb={usb} />}
      {sketch && <SerialMonitor lines={bench.serial} usb={usb} />}
      <div className="rl-phase">2 · Diagnose</div>
      <QuizStage quiz={quiz} report={report} retry={retry} passed={passed} onAnswer={(i, ok) => setDiag({ i, ok })} />
      {diag && <>
        <div className="rl-phase">3 · Fix it</div>
        <p className="small">{diag.ok ? 'Right diagnosis.' : `Not that. The real cause: ${fault.cause}`} <b>Fix:</b> <Glossed text={fault.fix} /> {sketch ? 'Change the wiring (unplug first) or the code (then Upload), then check.' : 'Unplug, change the wiring, plug back in, then check.'}</p>
        {sketch && <CodeCard sketch={sketch} slots={slots} setSlots={setSlots} onUpload={() => { bench.upload(sketch, slots); setUploaded(slots); setVerdict(null); }} usb={usb} running />}
        <div className="rl-actions"><button className="rl-next" onClick={check}>Check my fix</button>{!passed && verdict && !verdict.ok && <button className="rl-chip" onClick={retry}>Try a different fault</button>}</div>
        {verdict && <div className={`rl-feedback ${verdict.ok ? 'ok' : 'bad'}`} role="status">{verdict.ok ? `✓ Fixed. ${verdict.message}` : verdict.message}</div>}
      </>}
    </div>
  );
}

export { KIT01 };
