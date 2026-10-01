import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';
import { MISSIONS, requiredChecks, stageMastery, SKILLS, type Quiz } from '../reality/missions';
import { KIT01, componentById } from '../reality/kit01';
import { RECIPES, recipeCircuit, recipeSlots, faultOf, inventTest, INVENT_SENSORS, type InventSensor, type InventOutput } from '../reality/recipes';
import { SKETCHES } from '../reality/sketches';
import { PART_INTRO, GLOSSARY_RE, termFor } from '../reality/intro';
import { initialReality, migrateReality } from '../reality/progress';

function quizProblems(q: Quiz, ctx: string): string[] {
  const out: string[] = [];
  if (q.choices.length < 3) out.push(`${ctx}: fewer than 3 choices`);
  if (new Set(q.choices).size !== q.choices.length) out.push(`${ctx}: duplicate choices ${q.choices.join(' | ')}`);
  if (q.answer < 0 || q.answer >= q.choices.length) out.push(`${ctx}: answer index out of range`);
  if (!q.why.trim()) out.push(`${ctx}: no explanation`);
  q.choices.forEach((_, i) => { if (i !== q.answer && (!q.wrong[i]?.why || !q.wrong[i]?.tag)) out.push(`${ctx}: wrong choice ${i} has no targeted feedback`); });
  if (/undefined|NaN/.test(JSON.stringify(q))) out.push(`${ctx}: undefined/NaN in text`);
  return out;
}

describe('Reality Lab kit manifest', () => {
  it('35 printed tiles, each with a card and an on-image hotspot', () => {
    expect(KIT01.components).toHaveLength(35);
    expect(Object.keys(KIT01.hotspots)).toHaveLength(35);
    for (const c of KIT01.components) {
      const h = KIT01.hotspots[c.tile]; expect(h, c.tile).toBeDefined();
      expect(h[0]).toBeGreaterThanOrEqual(0); expect(h[2]).toBeLessThanOrEqual(1); expect(h[0]).toBeLessThan(h[2]); expect(h[1]).toBeLessThan(h[3]);
      for (const k of ['name', 'what', 'principle', 'safety'] as const) expect(c[k].trim().length, `${c.id}.${k}`).toBeGreaterThan(5);
    }
  });
});

describe('Reality Lab missions', () => {
  it('ten missions plus the boss, in order, with known prerequisites and skills', () => {
    expect(MISSIONS.map((m) => m.id)).toEqual(['m01', 'm02', 'm03', 'm04', 'm05', 'm06', 'm07', 'm08', 'm09', 'm10', 'boss']);
    for (const m of MISSIONS) {
      for (const p of m.prereq) expect(MISSIONS.some((x) => x.id === p), `${m.id} prereq ${p}`).toBe(true);
      for (const s of m.skills) expect(SKILLS[s], `${m.id} skill ${s}`).toBeDefined();
      for (const c of m.components) expect(componentById(c), `${m.id} component ${c}`).toBeDefined();
    }
  });
  it('every question variant has exactly one right answer and targeted feedback', () => {
    const problems: string[] = [];
    for (const m of MISSIONS) m.stages.forEach((s, i) => {
      for (let seed = 1; seed <= 40; seed++) {
        const rng = createRng(seed);
        if (s.kind === 'quiz' || s.kind === 'observe') problems.push(...quizProblems(s.gen(rng), `${m.id}#${i}`));
        if (s.kind === 'hunt') { const h = s.gen(rng); for (const t of h.targets) if (!componentById(t)) problems.push(`${m.id}#${i}: hunt target ${t} not in kit`); if (!h.prompt || !h.why) problems.push(`${m.id}#${i}: empty hunt`); }
      }
      if (s.kind === 'sort') for (const it2 of s.items) if (!componentById(it2)) problems.push(`${m.id}#${i}: sort item ${it2}`);
      if ((s.kind === 'build' || s.kind === 'observe' || s.kind === 'code' || s.kind === 'debug') && !RECIPES[s.recipe]) problems.push(`${m.id}#${i}: unknown recipe ${s.recipe}`);
      if (s.kind === 'debug') for (const f of s.faults) if (!faultOf(`${s.recipe}:${f}`)) problems.push(`${m.id}#${i}: unknown fault ${f}`);
    });
    expect(problems).toEqual([]);
  });
  it('code tasks start unsolved, and a solution passes both the task and the build check', () => {
    const solutions: Record<string, Record<string, string | number>> = {
      'm03': { on: 400, off: 400 }, 'm06': { cmp: '>', threshold: 700 }, 'm08': { on: 120, off: 120 }, 'm09': { a1: 0, a2: 180 }, 'm10': { near: 50 },
    };
    for (const m of MISSIONS) for (const s of m.stages) if (s.kind === 'code') {
      const r = RECIPES[s.recipe]; const start = recipeSlots(r);
      expect(s.check(start), `${m.id}: default slots should not already solve the task`).not.toBeNull();
      const sol = { ...start, ...solutions[m.id] }; expect(s.check(sol), m.id).toBeNull();
      if (m.id !== 'm06') expect(r.check(recipeCircuit(r), sol).ok, `${m.id} build still works with the solution`).toBe(true);
      expect(SKETCHES[r.sketch!]).toBeDefined();
    }
  });
  it('observe goals are reachable on the reference build', async () => {
    const { Bench, runFor } = await import('../reality/runtime');
    const { defaultEnv } = await import('../reality/circuit');
    const envFor: Record<string, Partial<ReturnType<typeof defaultEnv>>> = { button: { pressed: { btn1: true } }, knob: { knob: { pot1: 0.95 } }, light: { light: 5 }, temp: { tempC: 31 }, distance: { distanceCm: 12 } };
    for (const m of MISSIONS) for (const s of m.stages) if (s.kind === 'observe') {
      const r = RECIPES[s.recipe]; const env = { ...defaultEnv(), ...envFor[s.control] };
      const b = new Bench(recipeCircuit(r), env, r.sketch ? SKETCHES[r.sketch] : null, recipeSlots(r)); b.plug(true);
      let reached = false; runFor(b, 5000, 50, (res) => { if (s.goal(res, env, b.serial)) reached = true; });
      expect(reached, `${m.id} observe goal`).toBe(true);
      expect(s.seen(b.last, env, b.serial)).not.toMatch(/undefined|NaN/);
    }
  });
  it('mastery: every skill needs more than recognition, and every stage maps to a check', () => {
    const req = requiredChecks();
    for (const [skill, stages] of Object.entries(req)) {
      expect(SKILLS[skill], skill).toBeDefined();
      expect(stages.some((s) => s !== 'recognize'), `${skill} needs more than recognition`).toBe(true);
    }
    for (const m of MISSIONS) for (const s of m.stages) if (s.kind !== 'teach' && s.kind !== 'tour') expect(stageMastery(s), `${m.id} ${s.kind}`).not.toBeNull();
  });
  it('the boss quest: each sensor/output pair alerts at one test condition and not the other with its suggested threshold', () => {
    for (const sensor of Object.keys(INVENT_SENSORS) as InventSensor[]) for (const output of ['buzzer', 'led', 'servo'] as InventOutput[]) {
      const cfg = INVENT_SENSORS[sensor]; const slots = { cmp: cfg.suggest.cmp, threshold: cfg.suggest.threshold };
      const a = inventTest(sensor, output, slots, cfg.tests[0]); const b = inventTest(sensor, output, slots, cfg.tests[1]);
      expect(a.alert, `${sensor}/${output} should alert at ${cfg.testLabel(cfg.tests[0])} (${a.reading})`).toBe(true);
      expect(b.alert, `${sensor}/${output} should be quiet at ${cfg.testLabel(cfg.tests[1])} (${b.reading})`).toBe(false);
    }
  });
});

describe('Reality Lab teaches before it tests', () => {
  it('every part a question, sort or build uses was introduced in a parts tour first (this mission or an earlier one)', () => {
    const met = new Set<string>();
    const problems: string[] = [];
    for (const m of MISSIONS) {
      m.stages.forEach((s, i) => {
        const where = `${m.id} stage ${i}`;
        if (s.kind === 'tour') { for (const id of s.parts) { if (!componentById(id)) problems.push(`${where}: unknown part ${id}`); if (!PART_INTRO[id]) problems.push(`${where}: ${id} has no plain intro`); met.add(id); } }
        if (s.kind === 'hunt') for (let k = 0; k < 40; k++) { const h = s.gen(createRng(k)); if (!h.targets.some((t) => met.has(t))) problems.push(`${where}: asks to find ${h.targets} before meeting it`); }
        if (s.kind === 'sort') for (const id of s.items) if (!met.has(id)) problems.push(`${where}: sorts ${id} before meeting it`);
        if (s.kind === 'build' || s.kind === 'code' || s.kind === 'observe' || s.kind === 'debug') for (const id of RECIPES[s.recipe].parts) if (!met.has(id) && id !== 'uno') problems.push(`${where}: builds with ${id} before meeting it`);
      });
      const firstAsk = m.stages.findIndex((s) => !['teach', 'tour'].includes(s.kind));
      if (firstAsk === 0) problems.push(`${m.id}: opens with a question before any lesson`);
    }
    expect(problems).toEqual([]);
  });

  it('every technical word in the lessons and questions has a plain-words definition', () => {
    const texts: string[] = [];
    for (const m of MISSIONS) for (const s of m.stages) {
      if (s.kind === 'teach' || s.kind === 'tour') texts.push(s.text);
      if (s.kind === 'quiz' || s.kind === 'observe') for (let k = 0; k < 40; k++) { const q = s.gen(createRng(k)); texts.push(q.prompt, q.why, ...Object.values(q.wrong).map((w) => w.why)); }
      if (s.kind === 'hunt') for (let k = 0; k < 40; k++) texts.push(s.gen(createRng(k)).prompt);
      if (s.kind === 'observe' || s.kind === 'code') texts.push(s.task);
      if (s.kind === 'build') texts.push(s.intro);
    }
    for (const r of Object.values(RECIPES)) for (const f of r.faults) texts.push(f.symptom, f.fix);
    const plain = new Set(['AND', 'NOT', 'WHILE', 'BRIGHT', 'DECISION', 'ON', 'OFF', 'OR', 'INPUT', 'OUTPUT', 'CONTROLLER', 'SUPPORT', 'R3', 'I', 'LEGO', 'buttonPin']);
    const missing = new Set<string>();
    const all = texts.join('\n');
    for (const re of [/\b[a-z]+[A-Z]\w*(\(\))?/g, /\b[A-Z][A-Z0-9_]{1,}\b/g, /\b\w+\(\)/g]) for (const m of all.matchAll(re)) if (!plain.has(m[0]) && !termFor(m[0])) missing.add(m[0]);
    for (const w of ['wiper', 'anode', 'cathode', 'rail', 'divider', 'threshold', 'floating', 'pull-up', 'PWM', 'voltage', 'resistance', 'oscillator', 'Serial Monitor']) if (all.includes(w) && !termFor(w)) missing.add(w);
    expect([...missing]).toEqual([]);
  });

  it('the glossary finds its terms in running text, with case rules', () => {
    const found = (t: string) => [...t.matchAll(GLOSSARY_RE)].map((m) => termFor(m[0])?.key).filter(Boolean);
    expect(found('Use INPUT_PULLUP so the pin reads HIGH.')).toEqual(['INPUT_PULLUP', 'pin', 'HIGH']);
    expect(found('The resistor gets 3 V and 14 mA flows.')).toEqual(['V', 'mA']);
    expect(found('A low hum')).toEqual([]);
    expect(found('analogRead gives 0–1023 on A0')).toEqual(['analogRead', 'A0']);
  });

  it('saved progress from before the tours keeps pointing at the same stages', () => {
    const old = { ...initialReality(), content: undefined, missions: { m01: { stage: 3, passed: [1, 2], done: false }, m04: { stage: 5, passed: [2, 3], done: false } },
      errors: [{ id: 'm01:4:role-confusion', mission: 'm01', stage: 4, skill: 'roles', tag: 'role-confusion', prompt: '', chosen: '', correct: '', why: '', at: 0, fixes: 0 }], seen: { 'm04:3': 2 } };
    const p = migrateReality(old);
    expect(p.content).toBe(2);
    expect(p.missions.m01).toMatchObject({ stage: 5, passed: [3, 4] });
    expect(MISSIONS[0].stages[5].kind).toBe('hunt');
    expect(p.missions.m04).toMatchObject({ stage: 6, passed: [3, 4] });
    expect(p.errors[0]).toMatchObject({ stage: 6, id: 'm01:6:role-confusion' });
    expect(MISSIONS[0].stages[6].kind).toBe('sort');
    expect(p.seen).toEqual({ 'm04:4': 2 });
    expect(migrateReality(p)).toEqual(p);
  });
});
