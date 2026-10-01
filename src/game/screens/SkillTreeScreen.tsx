import { useMemo, useState } from 'react';
import { useGame } from '../store';
import { SKILLS, skillById, TABLE_ORDER } from '../../engine/curriculum/skills';
import { WORLDS } from '../../engine/curriculum/worlds';
import { skillStats, skillMastery, bandFor, BAND_COLORS, effectiveMastery } from '../../engine/mastery/MasteryEngine';
import { skillReadiness } from '../../engine/curriculum';
import { LESSONS } from '../../content/lessons';
import { MasteryChip, fmtAgo, fmtTime, Icon } from '../components/ui';
import { describeDue } from '../../engine/srs/SpacedRepetitionEngine';
import { factLabel } from '../../engine/curriculum/facts';

/** Visual spine of the curriculum: one column of worlds, each fanning into its skills. */
const SPINE: string[] = ['add.basic', 'sub.basic', 'mult', 'mult.missing', 'mult.applied', 'mult.multistep', 'div', 'div.applied', 'neg.numbers', 'order.ops',
  'frac', 'decimals', 'percent', 'ratio', 'exponents', 'sci.notation', 'units',
  'prealg.expressions', 'prealg.equations', 'prealg.coordinates',
  'alg1.linear', 'alg1.systems', 'alg1.functions', 'alg1.quadratics',
  'geo.shapes', 'geo.area', 'geo.volume', 'geo.pythagoras',
  'alg2.functions', 'alg2.exp.log', 'alg2.complex', 'alg2.matrices',
  'trig.ratios', 'trig.unit.circle', 'trig.vectors',
  'precalc.functions', 'precalc.parametric', 'precalc.limits',
  'calc1.limits', 'calc1.derivatives', 'calc1.applications', 'calc1.integration',
  'calc2.integration', 'calc2.series', 'calc2.polar',
  'calc3.vectors', 'calc3.partials', 'calc3.multiple', 'calc3.fields'];
const BRANCHES: Record<string, string[]> = {
  'Linear Algebra': ['linalg.matrices', 'linalg.transforms', 'linalg.eigen'],
  'Differential Equations': ['ode.first', 'ode.second', 'ode.systems'],
  'Probability & Statistics': ['stats.probability', 'stats.distributions', 'stats.inference'],
  'Numerical Methods': ['num.roots', 'num.integration', 'num.ode'],
  'Advanced Engineering Math': ['adv.vector.calc', 'adv.pde', 'adv.fourier', 'adv.laplace', 'adv.tensors'],
};

export function SkillTreeScreen() {
  const { state, dispatch } = useGame();
  const [sel, setSel] = useState<string>('mult');
  const now = Date.now();
  const W = 150, H = 46, GX = 26, GY = 16;

  const layout = useMemo(() => {
    const nodes: { id: string; x: number; y: number; world: string }[] = [];
    let y = 20;
    let lastWorld = '';
    const byWorld = new Map<string, string[]>();
    for (const id of SPINE) { const w = skillById(id)!.worldId; byWorld.set(w, [...(byWorld.get(w) ?? []), id]); }
    for (const w of WORLDS) {
      const ids = byWorld.get(w.id); if (!ids) continue;
      if (lastWorld) y += 14;
      lastWorld = w.id;
      const perRow = 4;
      ids.forEach((id, i) => nodes.push({ id, x: 40 + (i % perRow) * (W + GX), y: y + Math.floor(i / perRow) * (H + GY), world: w.id }));
      y += Math.ceil(ids.length / perRow) * (H + GY) + 20;
    }
    const branchTop = y + 10;
    let bx = 40;
    let maxY = branchTop;
    for (const [name, ids] of Object.entries(BRANCHES)) {
      ids.forEach((id, i) => nodes.push({ id, x: bx, y: branchTop + 26 + i * (H + GY), world: name }));
      maxY = Math.max(maxY, branchTop + 26 + ids.length * (H + GY));
      bx += W + GX;
    }
    return { nodes, width: Math.max(4 * (W + GX) + 60, bx + 20), height: maxY + 30, branchTop };
  }, []);

  const pos = new Map(layout.nodes.map((n) => [n.id, n]));
  const edges: { a: string; b: string; done: boolean }[] = [];
  for (const n of layout.nodes) {
    const s = skillById(n.id)!;
    for (const p of s.prerequisites) {
      if (!pos.has(p.skillId)) continue;
      // Keep the picture readable: only draw links that span at most one world.
      const wa = skillById(p.skillId)!.worldId; const wb = s.worldId;
      const oa = Number(wa.slice(1)); const ob = Number(wb.slice(1));
      if (Math.abs(oa - ob) > 1 && !(n.world in BRANCHES)) continue;
      edges.push({ a: p.skillId, b: n.id, done: skillMastery(p.skillId, state.mastery, now) >= p.mastery });
    }
  }
  const skill = skillById(sel)!;
  const stats = skillStats(sel, state.mastery, now);
  const readiness = skillReadiness(skill, state.mastery);
  const lesson = LESSONS.find((l) => l.skillId === sel || (sel === 'mult' && l.id === 'l.mult-intro'));
  const lessonsFor = LESSONS.filter((l) => l.skillId === sel || l.skillId.startsWith(sel + '.') || (sel === 'mult' && l.skillId.startsWith('mult')) || (sel === 'div' && l.skillId.startsWith('div')));
  const isTable = /^mult\.\d+$/.test(sel) || /^div\.\d+$/.test(sel);

  return (
    <div className="tree-wrap">
      <div className="tree-canvas">
        <svg width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`}>
          {edges.map((e, i) => { const a = pos.get(e.a)!; const b = pos.get(e.b)!; return <path key={i} className={`tedge ${e.done ? 'done' : ''}`} d={`M${a.x + W / 2},${a.y + H} C${a.x + W / 2},${a.y + H + 20} ${b.x + W / 2},${b.y - 20} ${b.x + W / 2},${b.y}`} />; })}
          {WORLDS.filter((w) => layout.nodes.some((n) => n.world === w.id)).map((w) => { const first = layout.nodes.find((n) => n.world === w.id)!; return <text key={w.id} x={20} y={first.y - 6} fontSize="11" fill="#c9a227" fontFamily="Orbitron, sans-serif" letterSpacing="1">WORLD {w.order} · {w.name.toUpperCase()}</text>; })}
          {Object.keys(BRANCHES).map((name, i) => <text key={name} x={40 + i * (W + GX)} y={layout.branchTop + 14} fontSize="10" fill="#a78bfa" fontFamily="Orbitron, sans-serif">{name.toUpperCase()}</text>)}
          {layout.nodes.map((n) => {
            const s = skillById(n.id)!;
            const m = skillMastery(n.id, state.mastery, now);
            const band = bandFor(m);
            const ready = skillReadiness(s, state.mastery).ready;
            return (
              <g key={n.id} className={`tnode ${s.implemented ? 'implemented' : ''} ${sel === n.id ? 'selected' : ''} ${!ready && !s.implemented ? 'locked' : ''}`} transform={`translate(${n.x},${n.y})`} onClick={() => setSel(n.id)}>
                <rect width={W} height={H} />
                <text x={8} y={16}>{trunc(s.shortName ?? s.name, 21)}</text>
                <text x={8} y={30} fontSize="9" fill={s.implemented ? BAND_COLORS[band] : '#64748b'}>{s.implemented ? band : 'planned'}</text>
                <text x={W - 8} y={30} className="pct" textAnchor="end" fill={BAND_COLORS[band]}>{Math.round(m)}%</text>
                <rect className="meter" x={8} y={H - 9} width={W - 16} height={4} fill="rgba(255,255,255,0.08)" />
                <rect className="meter" x={8} y={H - 9} width={(W - 16) * (m / 100)} height={4} fill={BAND_COLORS[band]} />
              </g>
            );
          })}
        </svg>
      </div>
      <aside className="map-side">
        <div className="stack">
          <h3 className="brass">{skill.name}</h3>
          <MasteryChip value={stats.mastery} />
          <p className="small">{skill.description}</p>
          <p className="small muted"><Icon name="gear" /> {skill.whyItMatters}</p>
          <div className="list-row"><span>Questions answered</span><b>{stats.attempts}</b></div>
          <div className="list-row"><span>Accuracy</span><b>{stats.accuracy}%</b></div>
          <div className="list-row"><span>Average response</span><b>{fmtTime(stats.avgTimeMs)}</b></div>
          <div className="list-row"><span>Mistakes</span><b>{stats.attempts - stats.correct}</b></div>
          <div className="list-row"><span>Last practised</span><b>{fmtAgo(stats.lastPracticedAt, now)}</b></div>
          <div className="list-row"><span>Next review</span><b>{stats.attempts ? describeDue(stats.nextReviewAt, now) : '—'}</b></div>
          <div className="list-row"><span>Lessons</span><b>{lessonsFor.filter((l) => state.stats.lessonsCompleted.includes(l.id)).length}/{lessonsFor.length}</b></div>
          {skill.prerequisites.length > 0 && (
            <div><h4>Prerequisites</h4>{readiness.requirements.map((r) => <div key={r.skillId} className={`req ${r.met ? 'met' : 'unmet'}`}><span onClick={() => setSel(r.skillId)} style={{ cursor: 'pointer' }}>{r.name}</span><span>{r.current}% / {r.required}%</span></div>)}</div>
          )}
          {sel === 'mult' && (
            <div><h4>Tables</h4><div className="facts-grid">{TABLE_ORDER.map((n) => { const m = skillMastery(`mult.${n}`, state.mastery, now); return <div key={n} className="f" style={{ color: BAND_COLORS[bandFor(m)], cursor: 'pointer' }} onClick={() => setSel(`mult.${n}`)}>×{n}<br />{Math.round(m)}%</div>; })}</div></div>
          )}
          {isTable && skill.facts && (
            <div><h4>Individual facts</h4><div className="facts-grid">{skill.facts.map((f) => { const m = effectiveMastery(state.mastery[f], now); const seen = !!state.mastery[f]; return <div key={f} className="f" style={{ color: seen ? BAND_COLORS[bandFor(m)] : '#475569' }} title={`${factLabel(f)}: ${m}%`}>{factLabel(f)}<br />{seen ? `${m}%` : '·'}</div>; })}</div></div>
          )}
          {stats.weakestFacts.length > 0 && !isTable && <div><h4>Weakest</h4>{stats.weakestFacts.map((w) => <div key={w.id} className="list-row"><span>{factLabel(w.id)}</span><b style={{ color: BAND_COLORS[bandFor(w.mastery)] }}>{w.mastery}%</b></div>)}</div>}
          {skill.implemented && skill.generator !== 'none' && <button className="btn primary block" onClick={() => dispatch({ type: 'START_DRILL', skillIds: [sel], count: 15 })}><Icon name="target" /> Practise {skill.shortName ?? skill.name}</button>}
          {lesson && <button className="btn block" onClick={() => dispatch({ type: 'START_LESSON', lessonId: lesson.id })}><Icon name="scroll" /> Lesson: {lesson.title}</button>}
          {!skill.implemented && <div className="chip lock">Arrives in a future expansion — the road leads here.</div>}
        </div>
      </aside>
    </div>
  );
}

export const ALL_SKILLS_COUNT = SKILLS.length;
const trunc = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1) + '…' : t);
