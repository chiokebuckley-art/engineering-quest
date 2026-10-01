import { useState } from 'react';
import { asset } from '../../assets';
import { useGame } from '../store';
import { KIT01, componentById } from '../../engine/reality/kit01';
import { MISSIONS, SKILLS, missionById, requiredChecks, type Mission } from '../../engine/reality/missions';
import { labSummary, nextMission, openErrors, type SkillStatus } from '../../engine/reality/progress';
import { MASTERY_STAGES, type KitComponent } from '../../engine/reality/types';
import { RECIPES, FULL_TRAY, recipeCircuit, recipeSlots } from '../../engine/reality/recipes';
import { SKETCHES } from '../../engine/reality/sketches';
import { defaultEnv, emptyCircuit, type Circuit, type Env } from '../../engine/reality/circuit';
import { defaultSlots, type SketchDef, type Slots } from '../../engine/reality/runtime';
import type { Control } from '../../engine/reality/missions';
import { PhotoBench, ComponentCard, cropStyle } from './Kit';
import { MissionPlayer } from './MissionPlayer';
import { CircuitMat } from './CircuitMat';
import { TestStation, SerialMonitor, CodeCard } from './LabPanels';
import { useBench } from './useBench';
import './reality.css';

type View = 'missions' | 'kit' | 'notebook' | 'mastery' | 'bench';
const VIEWS: [View, string][] = [['missions', '🧭 Missions'], ['kit', '🧰 My kit'], ['bench', '🔌 Free bench'], ['notebook', '📓 Notebook'], ['mastery', '📈 Mastery']];
const STATUS_LABEL: Record<SkillStatus, string> = { learned: 'Learned', 'in-progress': 'In progress', 'needs-review': 'Needs review', 'not-started': 'Not started' };
const tag = (m: Mission) => (m.id === 'boss' ? '★' : `M${String(m.n).padStart(2, '0')}`);

/**
 * Reality Quest: the learner's real kit photo becomes the lab. Missions teach through a simulated bench
 * that behaves like the real parts, so the first real build feels familiar.
 */
export function RealityScreen() {
  const { state, play } = useGame();
  const p = state.reality;
  const [view, setView] = useState<View>('missions');
  const [playing, setPlaying] = useState<{ id: string; only?: number; fixes?: string } | null>(null);
  const [card, setCard] = useState<KitComponent | null>(null);
  const unlocked = (m: Mission) => m.prereq.every((x) => p.missions[x]?.done);
  const open = (id: string, only?: number, fixes?: string) => {
    const m = missionById(id); if (!m) return;
    play('click'); setCard(null); setPlaying({ id, only, fixes }); window.scrollTo({ top: 0 });
  };

  if (playing) {
    const m = missionById(playing.id)!;
    return <div className="screen-scroll rl-root"><div className="container"><MissionPlayer key={`${playing.id}:${playing.only ?? ''}:${playing.fixes ?? ''}`} mission={m} only={playing.only} fixes={playing.fixes} onExit={() => setPlaying(null)} /></div></div>;
  }
  return (
    <div className="screen-scroll rl-root">
      <div className="container stack">
        <div className="rl-hero">
          <div>
            <div className="small muted">REALITY QUEST</div>
            <h1>{KIT01.title}</h1>
            <p className="small">Your ELEGOO UNO R3 kit, on a virtual bench that behaves like the real parts: wires, power, code and all. When the real kit comes out, you’ll already know it.</p>
          </div>
          <span className="rl-hero-photo" style={{ backgroundImage: `url("${asset(KIT01.image)}")` }} role="img" aria-label="Your kit lid" />
        </div>
        <div className="rl-tabs" role="tablist">
          {VIEWS.map(([k, l]) => <button key={k} role="tab" aria-selected={view === k} className={`rl-tab ${view === k ? 'on' : ''}`} onClick={() => { play('click'); setView(k); }}>{l}</button>)}
        </div>
        {view === 'missions' && <MissionsView onOpen={open} unlocked={unlocked} />}
        {view === 'kit' && <KitView onPick={setCard} />}
        {view === 'bench' && <FreeBench />}
        {view === 'notebook' && <NotebookView onRetry={open} />}
        {view === 'mastery' && <MasteryView />}
      </div>
      {card && <div className="rl-overlay" onClick={(e) => { if (e.target === e.currentTarget) setCard(null); }}><ComponentCard c={card} onClose={() => setCard(null)} onMission={(id) => { const m = missionById(id); if (m && unlocked(m)) open(id); }} /></div>}
    </div>
  );
}

/* ---------------- missions + dashboard ---------------- */

function MissionsView({ onOpen, unlocked }: { onOpen: (id: string) => void; unlocked: (m: Mission) => boolean }) {
  const { state } = useGame();
  const p = state.reality;
  const sum = labSummary(p);
  const nextId = nextMission(p);
  const errs = openErrors(p).length;
  return (
    <>
      <div className="rl-dash">
        <div><b>{sum.missionsDone}</b><small>of {MISSIONS.length} missions</small></div>
        <div className="ok"><b>{sum.learned}</b><small>skills learned</small></div>
        <div><b>{sum.inProgress}</b><small>in progress</small></div>
        <div className="warn"><b>{sum.review}</b><small>need review</small></div>
        <div className="muted"><b>{sum.notStarted}</b><small>not started</small></div>
      </div>
      {errs > 0 && <p className="small">📓 {errs} question{errs === 1 ? '' : 's'} waiting in your error book (Notebook tab).</p>}
      <div className="rl-path">
        {MISSIONS.map((m) => {
          const mp = p.missions[m.id];
          const on = unlocked(m);
          const status = mp?.done ? 'done' : !on ? 'locked' : mp?.passed.length ? 'started' : 'open';
          return (
            <button key={m.id} className={`rl-mcard ${status} ${m.id === nextId ? 'next' : ''} ${m.id === 'boss' ? 'boss' : ''}`} disabled={!on} onClick={() => onOpen(m.id)}>
              <span className="rl-mnum">{mp?.done ? '✓' : tag(m)}</span>
              <span className="rl-mbody">
                <b>{m.title}</b>
                <small>{m.goal}</small>
                <span className="rl-mmeta">
                  {status === 'locked' ? `🔒 After ${m.prereq.map((x) => tag(missionById(x)!)).join(', ')}` : status === 'started' ? `In progress · ${mp!.passed.length} checks passed` : status === 'done' ? 'Complete · replay for a fresh variant' : m.id === nextId ? 'Up next' : 'Open'}
                </span>
                <span className="rl-mparts">{m.components.slice(0, 6).map((id) => { const c = componentById(id); return c ? <span key={id} className="rl-crop tiny" style={cropStyle(c.tile)} title={c.name} /> : null; })}</span>
              </span>
            </button>
          );
        })}
        <div className="rl-mcard later" aria-disabled="true">
          <span className="rl-mnum">＋</span>
          <span className="rl-mbody"><b>Create a new lab</b><small>Photograph another kit or object and turn it into a lab. Coming later.</small></span>
        </div>
      </div>
    </>
  );
}

/* ---------------- kit: photo bench + parts drawer ---------------- */

function KitView({ onPick }: { onPick: (c: KitComponent) => void }) {
  const { state } = useGame();
  const marks = Object.keys(state.reality.kit).length;
  const sim = KIT01.components.filter((c) => c.simulated).length;
  return (
    <>
      <p className="small">This is the lid of your kit. Tap a tile to open its card: what it does, how it works inside, its pins, safety and the missions that use it. {KIT01.components.length} parts; {sim} can go on the virtual bench today.</p>
      <PhotoBench onPick={onPick} />
      <p className="small muted">Every card is <b>label-confirmed</b>: named from the printed lid. When you open the real kit, tap “Doesn’t match my kit?” on any card that looks different{marks ? ` (you’ve marked ${marks})` : ''}.</p>
    </>
  );
}

/* ---------------- free bench: build anything, run any sketch ---------------- */

function FreeBench() {
  const [circuit, setCircuit] = useState<Circuit>(emptyCircuit());
  const [usb, setUsb] = useState(false);
  const [env, setEnv] = useState<Env>(defaultEnv());
  const [sketch, setSketch] = useState<SketchDef>(SKETCHES.blink);
  const [slots, setSlots] = useState<Slots>(defaultSlots(SKETCHES.blink));
  const [msg, setMsg] = useState('');
  const bench = useBench(circuit, env, usb, null, (ids) => setCircuit((c) => ({ ...c, parts: c.parts.map((x) => (ids.includes(x.id) ? { ...x, blown: true } : x)) })));
  const kinds = new Set(circuit.parts.map((x) => x.kind));
  const controls: Control[] = [
    ...(kinds.has('button') ? ['button' as const] : []), ...(kinds.has('pot') ? ['knob' as const] : []), ...(kinds.has('ldr') ? ['light' as const] : []),
    ...(kinds.has('ntc') || kinds.has('dht11') ? ['temp' as const] : []), ...(kinds.has('ultrasonic') ? ['distance' as const] : []),
  ];
  const pickSketch = (id: string) => { const s = SKETCHES[id]; setSketch(s); setSlots(defaultSlots(s)); };
  const load = (rid: string) => {
    const r = RECIPES[rid];
    setUsb(false); setCircuit(recipeCircuit(r)); setEnv(defaultEnv());
    if (r.sketch) { setSketch(SKETCHES[r.sketch]); setSlots(recipeSlots(r)); }
    setMsg(`Loaded “${r.title}”. ${r.sketch ? 'Plug in, then Upload its sketch.' : 'Plug in to power it.'}`);
  };
  return (
    <div className="rl-free">
      <p className="small">Your own bench: place parts, run wires, plug in and upload. Anything goes, including mistakes: an LED with no resistor will burn out, just like the real one. Unplug before you change the wiring.</p>
      <div className="rl-row">
        <label className="rl-select"><span>Start from a build</span>
          <select value="" onChange={(e) => e.target.value && load(e.target.value)}>
            <option value="">Choose…</option>
            {Object.values(RECIPES).map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </label>
        <button className="rl-chip" onClick={() => { setUsb(false); setCircuit(emptyCircuit()); setMsg('Bench cleared.'); }}>Clear bench</button>
      </div>
      {msg && <p className="small muted">{msg}</p>}
      <CircuitMat circuit={circuit} editable usb={usb} result={bench.result} servo={bench.servo} env={env} txAgo={bench.txAgo} tray={FULL_TRAY}
        onChange={(c) => setCircuit(c)} onUsb={setUsb} onNeedUnplug={() => undefined} onPress={(id, d) => setEnv({ ...env, pressed: { ...env.pressed, [id]: d } })} />
      <TestStation circuit={circuit} env={env} setEnv={setEnv} result={bench.result} controls={controls} usb={usb} />
      <div className="rl-row"><span className="small"><b>Sketch:</b></span>{Object.values(SKETCHES).map((s) => <button key={s.id} className={`rl-chip ${sketch.id === s.id ? 'on' : ''}`} onClick={() => pickSketch(s.id)}>{s.title}</button>)}</div>
      <p className="small muted">{sketch.summary} {bench.sketchId ? `Running now: ${SKETCHES[bench.sketchId]?.title ?? bench.sketchId}.` : 'The board is blank.'}</p>
      <CodeCard sketch={sketch} slots={slots} setSlots={setSlots} onUpload={() => bench.upload(sketch, slots)} usb={usb} running={!!bench.sketchId} />
      <SerialMonitor lines={bench.serial} usb={usb} />
    </div>
  );
}

/* ---------------- notebook: notes, error book, predictions, inventions ---------------- */

function NotebookView({ onRetry }: { onRetry: (id: string, only?: number, fixes?: string) => void }) {
  const { state, dispatch } = useGame();
  const p = state.reality;
  const errs = openErrors(p);
  const fixed = p.errors.filter((e) => e.fixes >= 1);
  const started = MISSIONS.filter((m) => p.missions[m.id]);
  return (
    <div className="rl-notebook">
      <section>
        <h3>Error book</h3>
        <p className="small muted">Every miss lands here with why. Retry it with a fresh variant; one right retry clears it.</p>
        {errs.length === 0 ? <p className="small">Nothing waiting. 🎉</p> : errs.map((e) => {
          const m = missionById(e.mission);
          return (
            <div key={e.id} className="rl-err">
              <div className="small muted">{m ? `${tag(m)} ${m.title}` : e.mission} · {SKILLS[e.skill]?.name ?? e.skill}</div>
              <div><b>{e.prompt}</b></div>
              <div className="small">You: {e.chosen} · Right: {e.correct}</div>
              <div className="small muted">{e.why}</div>
              {m && <button className="rl-chip primary" onClick={() => onRetry(e.mission, e.stage, e.id)}>Retry with a fresh variant</button>}
            </div>
          );
        })}
        {fixed.length > 0 && <p className="small muted">Fixed: {fixed.length}</p>}
      </section>
      <section>
        <h3>Predict, then observe</h3>
        {p.predictions.length === 0 ? <p className="small muted">Predictions you make before a test show up here next to what really happened.</p> : p.predictions.slice(0, 12).map((x, i) => (
          <div key={i} className={`rl-pred ${x.matched ? 'ok' : 'bad'}`}><div className="small">{x.prompt}</div><div className="small">Predicted: <b>{x.predicted}</b> · Observed: <b>{x.observed}</b> {x.matched ? '✓' : '✗'}</div></div>
        ))}
      </section>
      <section>
        <h3>Inventions</h3>
        {p.inventions.length === 0 ? <p className="small muted">Your boss-quest designs are saved here.</p> : p.inventions.map((v, i) => (
          <div key={i} className="rl-inv">
            <div><b>{v.sensor} → UNO → {v.output}</b> {v.passed ? '★' : '(draft)'}</div>
            <div className="small">Alert when reading {v.cmp} {v.threshold}. {v.mechanism}</div>
            <div className="small">Tests: {v.tests.map((t) => `${t.label}: ${t.alert ? 'alert' : 'quiet'}`).join('; ')}</div>
            <div className="small">Failure: {v.failure} · Fix: {v.fix}</div>
            <div className="small muted">Limitation: {v.limitation}</div>
          </div>
        ))}
      </section>
      <section>
        <h3>Lab notes</h3>
        {started.length === 0 ? <p className="small muted">Start a mission to keep notes on it.</p> : started.map((m) => (
          <label key={m.id} className="rl-text"><span>{tag(m)} {m.title}</span>
            <textarea rows={2} defaultValue={p.notes[m.id] ?? ''} placeholder="What did you notice? What would you try with the real kit?" onBlur={(e) => dispatch({ type: 'REALITY_NOTE', key: m.id, text: e.target.value })} />
          </label>
        ))}
      </section>
    </div>
  );
}

/* ---------------- mastery ---------------- */

function MasteryView() {
  const { state } = useGame();
  const p = state.reality;
  const sum = labSummary(p);
  const need = requiredChecks();
  const comps = KIT01.components.filter((c) => c.missions.length > 0);
  return (
    <div className="rl-mastery">
      <p className="small">A skill counts as <b>learned</b> only at 100%: every check it needs passed. Recognizing a part is never enough on its own; you also explain, predict, build, debug or design with it.</p>
      {sum.skills.map((s) => (
        <div key={s.id} className={`rl-skill ${s.status}`}>
          <div className="rl-skill-h"><b>{SKILLS[s.id]?.name ?? s.id}</b><span className={`rl-tag st-${s.status}`}>{STATUS_LABEL[s.status]} · {s.have}/{s.need}</span></div>
          <div className="small muted">{SKILLS[s.id]?.about}</div>
          <div className="rl-checks">{MASTERY_STAGES.filter((st) => need[s.id]?.includes(st)).map((st) => <span key={st} className={`rl-check ${p.skills[s.id]?.[st]?.ok ? 'ok' : p.skills[s.id]?.[st] ? 'tried' : ''}`}>{st}</span>)}</div>
        </div>
      ))}
      <h3>Parts</h3>
      <div className="rl-comp-grid">
        {comps.map((c) => {
          const r = p.components[c.id] ?? {};
          const got = MASTERY_STAGES.filter((st) => r[st]?.ok);
          return (
            <div key={c.id} className="rl-comp">
              <span className="rl-crop" style={cropStyle(c.tile)} aria-hidden="true" />
              <span><b>{c.name}</b><small>{got.length ? got.join(' · ') : 'not checked yet'}</small></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
