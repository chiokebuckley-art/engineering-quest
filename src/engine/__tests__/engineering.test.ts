import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';
import { checkAnswer, generateQuestion } from '../questions';
import { PICTURE_GAMES, PICTURE_GAME_IDS } from '../questions/games';
import { protractorQuestion, anglesQuestion, circleQuestion, pythagQuestion, slopeQuestion, surfaceQuestion, cylinderQuestion, scaleQuestion } from '../questions/geo';
import { usMetricQuestion, US_METRIC, chainQuestion, densityQuestion, MATERIALS, flowQuestion } from '../questions/rates';
import { caliperQuestion, micrometerQuestion, toleranceQuestion, feelerQuestion, wrenchQuestion, BOLTS, stackupQuestion, sigfigQuestion, runoutQuestion, calibrateQuestion } from '../questions/fit';
import { torqueQuestion, leverQuestion, pressureQuestion, electricQuestion, expansionQuestion, ALPHA } from '../questions/phys';
import { nominalQuestion, PIPES, cutQuestion, capacityQuestion, headQuestion, offsetQuestion } from '../questions/pipe';
import { parseSelection, drawSeeded, blitzStars } from '../state/arcade';
import { lessonById, LESSONS } from '../../content/lessons';
import { skillById, componentSkills } from '../curriculum/skills';
import { variantsFor } from '../notebook/notebook';
import { ACHIEVEMENTS } from '../progression/achievements';

const rng = () => createRng(7);

describe('Shapes & angles', () => {
  it('reads angles, finds missing ones, and handles circles and triangles', () => {
    expect(protractorQuestion(65, 2).answer).toBe(65);
    expect(anglesQuestion('line', [110], 2).answer).toBe(70);
    expect(anglesQuestion('triangle', [50, 60], 3).answer).toBe(70);
    expect(anglesQuestion('point', [100, 120], 3).answer).toBe(140);
    const c = circleQuestion(10, 'c', 3, rng());
    expect(c.answer).toBe(62.8); expect(checkAnswer(c, '62.9')).toBe(true); expect(checkAnswer(c, '60')).toBe(false); expect(c.allowDecimal).toBe(true);
    expect(pythagQuestion([3, 4, 5], 'c', 3, rng()).answer).toBe(5);
    expect([5, 12]).toContain(pythagQuestion([5, 12, 13], 'a', 4, rng()).answer);
    expect(slopeQuestion(1, 12, 'percent', 3, rng()).answer).toBe(8.3);
    expect(surfaceQuestion(6, 4, 3, false, 3, rng()).answer).toBe(108);
    expect(surfaceQuestion(6, 4, 3, true, 4, rng()).answer).toBe(84);
    expect(cylinderQuestion(5, 10, 'volume', 3, rng()).answer).toBe(785);
    expect(scaleQuestion(50, 8, 'real', 3, rng()).answer).toBe(4);
  });
});

describe('Rates & conversions', () => {
  it('converts, chains and rates', () => {
    const inmm = usMetricQuestion(US_METRIC[0], 3, true, 2);
    expect(inmm.answer).toBe(76.2); expect(checkAnswer(inmm, '76')).toBe(true);
    const ch = chainQuestion({ start: 'ft', steps: [['12 in', '1 ft'], ['2.54 cm', '1 in']], result: 'cm', value: (n) => n * 12 * 2.54, min: 2, places: 1 }, 2, 3);
    expect(ch.answer).toBe(61); expect(checkAnswer(ch, '60.96')).toBe(true);
    expect(densityQuestion(MATERIALS.find((m) => m.name === 'steel')!, 50, 'mass', 3).answer).toBe(390);
    expect(flowQuestion(200, 8, 'time', 3, rng()).answer).toBe(25);
  });
});

describe('Precision & fit', () => {
  it('reads precision tools and applies tolerances', () => {
    const cal = caliperQuestion(23.4, 3, rng()); expect(cal.answer).toBe(23.4); expect(cal.explanation.join(' ')).toContain('line 4');
    const mic = micrometerQuestion(6.78, 3, rng()); expect(mic.answer).toBe(6.78); expect(mic.explanation.join(' ')).toContain('6.5');
    expect(toleranceQuestion(25, 0.05, null, 'max', 2, rng()).answer).toBe(25.05);
    expect(toleranceQuestion(25, 0.05, 25.07, 'out', 3, rng()).answer).toBe(0.02);
    expect(toleranceQuestion(25, 0.05, 25.02, 'out', 3, rng()).answer).toBe(0);
    expect(feelerQuestion([0.1, 0.25], 2, rng()).answer).toBe(0.35);
    const m8 = BOLTS.find((b) => b.size === 'M8')!; expect(wrenchQuestion(m8, 'flats', 2).answer).toBe(13); expect(wrenchQuestion(m8, 'thread', 3).answer).toBe(8);
    expect(stackupQuestion([{ nominal: 10, tol: 0.1 }, { nominal: 10, tol: 0.1 }, { nominal: 10, tol: 0.1 }, { nominal: 10, tol: 0.1 }], 'tol', 3).answer).toBe(0.4);
    expect(sigfigQuestion('round', 3.14159, 3, 3).answer).toBe(3.14);
    expect(sigfigQuestion('count', 0.0045, 0, 3).answer).toBe(2);
    expect(sigfigQuestion('sci', 45000, 0, 3).answer).toBe(4);
    expect(sigfigQuestion('unsci', 4.5, 4, 3).answer).toBe(45000);
    expect(runoutQuestion('runout', [0.12, 0.2, 0.15, 0.08], 3, rng()).answer).toBe(0.12);
    expect(calibrateQuestion('correct', 20, [20.06, 31.3], 'mm', 3, rng()).answer).toBe(31.24);
  });
});

describe('Forces & power', () => {
  it('computes torque, levers, pressure, circuits and expansion', () => {
    expect(torqueQuestion(100, 0.3, 'torque', 2, rng()).answer).toBe(30);
    expect(leverQuestion(400, 0.25, 100, 1, 'f2', 3, rng()).answer).toBe(100);
    expect(pressureQuestion('fa', 500, 0.25, 2, rng()).answer).toBe(2000);
    const head = pressureQuestion('head', 10, 0, 3, rng()); expect(head.answer).toBe(98); expect(checkAnswer(head, '98.1')).toBe(true);
    expect(electricQuestion(12, 3, 4, 'i', 2).answer).toBe(3);
    expect(electricQuestion(12, 3, 4, 'p', 2).answer).toBe(36);
    expect(expansionQuestion(ALPHA[0], 20, 30, 'um', 2, rng()).answer).toBe(7200);
    expect(expansionQuestion(ALPHA[0], 20, 30, 'mm', 3, rng()).answer).toBe(7.2);
  });
});

describe('Plumbing', () => {
  it('knows nominal vs actual, cuts, capacity, head and offsets', () => {
    const half = PIPES[0];
    expect(nominalQuestion(half, 'wall', 3).answer).toBe(2.75);
    expect(cutQuestion(600, [16, 16], 2, rng()).answer).toBe(568);
    const cap = capacityQuestion(half, 10, 3); expect(cap.answer).toBe(1.96); expect(checkAnswer(cap, '1.97')).toBe(true);
    expect(headQuestion('kpa', 4, 2).answer).toBe(39);
    expect(offsetQuestion(300, 'travel', 2).answer).toBe(424);
  });
});

describe('Picture games registry', () => {
  it('generates consistent, checkable questions for every game and kind', () => {
    for (const id of PICTURE_GAME_IDS) {
      const g = PICTURE_GAMES[id]; const r = createRng(id.length * 31);
      for (const k of g.kinds) for (let d = 1; d <= 6; d++) for (let i = 0; i < 6; i++) {
        const q = g.question(k.id, d as 1 | 2 | 3 | 4 | 5 | 6, r);
        expect(q.topic, `${id}:${k.id}`).toBe(g.topic); expect(q.visualFirst).toBe(true); expect(q.visual.type).not.toBe('none');
        expect(Number.isFinite(q.answer), `${id}:${k.id} answer`).toBe(true); expect(q.answer).toBeGreaterThanOrEqual(-1000);
        expect(checkAnswer(q, String(q.answer)), `${id}:${k.id} self-check ${q.expression}`).toBe(true);
        if (k.id !== 'all') expect(q.masterySkillId).toBe(`${g.skill}.${k.id}`);
        expect(q.explanation.length).toBeGreaterThan(0);
      }
    }
  });

  it('is wired into skills, the arcade, blitz stars, achievements, lessons and the notebook', () => {
    for (const id of ['geo', 'rates', 'fit', 'phys', 'pipe', 'spiral', 'precalc']) {
      const g = PICTURE_GAMES[id];
      expect(skillById(g.skill)?.generator).toBe(id);
      expect(componentSkills(g.skill)).toHaveLength(g.kinds.length - 1);
      for (const k of g.kinds.filter((x) => x.id !== 'all')) expect(skillById(`${g.skill}.${k.id}`)?.parent).toBe(g.skill);
      const kind = g.kinds[1].id; const sel = parseSelection(id as never, `${id}:${kind}`);
      expect(sel.skillIds).toEqual([`${g.skill}.${kind}`]);
      expect(drawSeeded(sel, 3, 0).masterySkillId).toBe(`${g.skill}.${kind}`);
      expect(drawSeeded(sel, 3, 0).prompt).toBe(drawSeeded(sel, 3, 0).prompt);
      expect(parseSelection(id as never, `${id}:nope`).key).toBe(`${id}:all`);
      expect(blitzStars(10, 60_000, id as never)).toBe(3);
      expect(ACHIEVEMENTS.some((a) => a.id === `${id}-blitz`)).toBe(true); expect(ACHIEVEMENTS.some((a) => a.id === `${id}-conquer`)).toBe(true);
      for (const [lid] of g.lessons) expect(lessonById(lid), lid).toBeTruthy();
      const q = generateQuestion(`${g.skill}.${kind}`, {}, { rng: createRng(5), difficulty: 3 });
      const { variations, twist } = variantsFor(q, createRng(9));
      expect(variations.length, `${id} variations`).toBeGreaterThan(0);
      for (const v of variations) expect(v.masterySkillId).toBe(q.masterySkillId);
      expect(twist.topic).toBe(g.topic);
    }
    for (const l of LESSONS) for (const st of l.steps) if (st.type === 'try') expect(skillById(st.skillId), `${l.id} → ${st.skillId}`).toBeTruthy();
    expect(LESSONS.filter((l) => l.group === 'Build projects')).toHaveLength(10);
  });
});

describe('Arcade selection difficulty suffix', () => {
  it('fixes the difficulty of open-ended games and keeps the kind', () => {
    const sel = parseSelection('volume' as never, 'volume:cubes@d1');
    expect(sel.difficulty).toBe(1); expect(sel.key).toBe('volume:cubes@d1'); expect(sel.skillIds).toEqual(['volume.cubes']);
    const q = drawSeeded(sel, 4, 0);
    expect(q.masterySkillId).toBe('volume.cubes'); expect(q.difficulty).toBe(1);
    expect(parseSelection('add' as never, 'add:20@d2').difficulty).toBe(2);
    expect(parseSelection('pattern' as never, 'pattern:shapes').key).toBe('pattern:shapes');
  });
});

describe('Arcade draws for every game', () => {
  it('Mental Math Blitz groups and seeded fraction/ratio rounds draw their own questions', async () => {
    const { startArcade } = await import('../state/arcade');
    for (const g of ['add', 'sub', 'mul', 'bonds', 'all']) expect(() => startArcade('mm' as never, 'practice', `mm:${g}`, {}, 0, createRng(3))).not.toThrow();
    for (const [game, key] of [['frac', 'frac:shade'], ['ratio', 'ratio:table']] as const) {
      const sel = parseSelection(game as never, key);
      // The academy generator files these under the umbrella skill; before the fix they fell through to the mixed games.
      for (let i = 0; i < 5; i++) expect(drawSeeded(sel, 9, i).topic).toBe('Arithmetic Academy');
    }
  });
});
