import { describe, it, expect } from 'vitest';
import { createRng } from '../rng';
import { checkAnswer } from '../questions';
import { PICTURE_GAMES } from '../questions/games';
import { nCr, nPr, phi, elo, logistic, algebraQuestion, countQuestion, sampleQuestion, eventsQuestion, conditionalQuestion, bayesQuestion, centerQuestion, samplingQuestion, hypothesisQuestion, binomialQuestion, poissonQuestion, normalQuestion, regressQuestion, vectorsQuestion, markovQuestion, decisionQuestion, PROB_KINDS } from '../questions/prob';
import { seriesProb, seriesSim } from '../../game/screens/WorkshopScreen';
import { lessonById } from '../../content/lessons';
import { skillById, componentSkills } from '../curriculum/skills';

const rng = () => createRng(3);

describe('Probability lab', () => {
  it('has the maths right at every stage', () => {
    expect(nCr(8, 3)).toBe(56); expect(nPr(8, 3)).toBe(336);
    expect(phi(1)).toBeCloseTo(0.8413, 3); expect(phi(-2)).toBeCloseTo(0.0228, 3);
    expect(elo(1600, 1400)).toBeCloseTo(0.7597, 3); expect(logistic(1)).toBeCloseTo(0.7311, 3);
    expect(algebraQuestion('oddsToP', 3, 1, 2, rng()).answer).toBe(25);
    expect(algebraQuestion('rearrange', 60, 20, 3, rng()).answer).toBe(12);
    expect(countQuestion('comb', 8, 3, 3, rng()).answer).toBe(56);
    expect(sampleQuestion('dice', 7, 2, rng()).answer).toBe(16.7);
    expect(eventsQuestion('dependent', 0.4, 0, 3, rng()).answer).toBe(13.3);
    expect(eventsQuestion('atleast', 0.2, 3, 3, rng()).answer).toBe(48.8);
    expect(conditionalQuestion({ rows: ['home', 'away'], cols: ['win', 'not win'], n: [[30, 20], [15, 35]] }, 'given', 3).answer).toBe(60);
    expect(bayesQuestion(0.1, 0.9, 0.9, 3, rng()).answer).toBe(50);
    expect(centerQuestion([8, 12, 10, 6, 14], 'variance', 3, rng()).answer).toBe(8);
    expect(centerQuestion([8, 12, 10, 6, 14], 'sd', 3, rng()).answer).toBe(2.83);
    expect(samplingQuestion('se', 0.5, 100, 3).answer).toBe(5);
    expect(hypothesisQuestion(0.5, 100, 60, 'z', 3).answer).toBe(2);
    expect(hypothesisQuestion(0.5, 100, 60, 'sig', 4).answer).toBe(1);
    expect(binomialQuestion(5, 4, 0.7, 'exact', 3, rng()).answer).toBe(36);
    expect(poissonQuestion(2, 3, 'exact', 3, rng()).answer).toBe(18);
    expect(normalQuestion('below', 70, 10, 80, 3, rng()).answer).toBe(84.1);
    expect(normalQuestion('tcrit', 0, 1, 10, 4, rng()).answer).toBe(2.228);
    expect(regressQuestion('predict', 10, 2.5, 12, 2, rng()).answer).toBe(40);
    expect(regressQuestion('logistic', 0, 1, 0, 3, rng()).answer).toBe(73.1);
    expect(vectorsQuestion('dot', [1.2, 0.6, -0.9], [2, 1, 1], 2).answer).toBeCloseTo(2.1, 5);
    expect(vectorsQuestion('eloE', [1600], [1400], 3).answer).toBe(76);
    expect(vectorsQuestion('eloUpdate', [1600, 32], [1400, 1], 4).answer).toBe(1608);
    expect(markovQuestion('twostep', 0.8, 0.6, 0, 3, rng()).answer).toBe(72);
    expect(markovQuestion('steady', 0.8, 0.6, 0, 3, rng()).answer).toBe(66.7);
    expect(decisionQuestion('ev', 0.45, 1.5, 10, 3, rng()).answer).toBe(1.25);
    expect(decisionQuestion('kelly', 0.55, 1, 10, 4, rng()).answer).toBe(10);
    expect(decisionQuestion('ruin', 0.55, 1, 20, 4, rng()).answer).toBe(1.8);
    expect(seriesProb(0.6, 7)).toBeCloseTo(0.7102, 3);
    const sim = seriesSim(0.6, 7, 20000, 42); expect(Math.abs(sim.wins / 20000 - 0.7102)).toBeLessThan(0.02);
  });

  it('generates checkable questions for every kind and is fully wired', () => {
    const g = PICTURE_GAMES.prob; const r = createRng(11);
    for (const k of g.kinds) for (let d = 1; d <= 6; d++) for (let i = 0; i < 8; i++) {
      const q = g.question(k.id, d as 1 | 2 | 3 | 4 | 5 | 6, r);
      expect(q.topic).toBe('Probability'); expect(Number.isFinite(q.answer), `${k.id} ${q.expression}`).toBe(true);
      expect(checkAnswer(q, String(q.answer)), `${k.id} ${q.expression}`).toBe(true); expect(q.visual.type).not.toBe('none');
    }
    expect(skillById('prob')?.generator).toBe('prob'); expect(componentSkills('prob')).toHaveLength(PROB_KINDS.length - 1);
    for (const [id] of g.lessons) expect(lessonById(id), id).toBeTruthy();
    expect(PROB_KINDS.filter((k) => k.stage === 3)).toHaveLength(4);
  });
});
