import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import { stripLabels } from '../label';
import { fracToPercentStep, percentBridgeWave, percentIndependentWave, percentOfStep, percentChangeStep } from '../academy/questions';
import { buildQuest, fluencyFor } from '../academy/AcademyEngine';
import { chapterOf } from '../academy/registry';
import { judge, modelProblem, rightAnswer } from '../academy/judge';
import { MathVisual } from '../../game/components/MathVisual';
import { Explanation } from '../../game/components/MathChallenge';
import { generateQuestion } from '../questions';
import { gameReducer } from '../state/reducer';
import { initialState } from '../state/initialState';
import { initialChapter, initialTrack, type AskStep } from '../academy/types';

describe('Percentage learning gradient', () => {
  it('shows only the source fraction until a worked solution is opened', () => {
    for (const pair of [[1, 2, 50], [1, 4, 25], [3, 4, 75], [1, 5, 20], [2, 5, 40], [1, 10, 10], [3, 10, 30]] as const) {
      const [n, d, p] = pair;
      const q = fracToPercentStep(createRng(1), pair).question;
      const prompt = renderToStaticMarkup(createElement(MathVisual, { visual: q.visual }));
      expect(prompt).toContain(`>${n}/${d}</text>`);
      expect(prompt).not.toContain(`${p}/100`);
      expect(prompt).not.toContain(`>${n}/${d}${n}/${d}</text>`);
      const worked = renderToStaticMarkup(createElement(Explanation, { q }));
      expect(worked).toContain(`= ${p}/100`);
      expect(stripLabels(q.solutionSteps.join(' '))).toContain(`100 ÷ ${d} = ${100 / d}`);
      expect(stripLabels(q.solutionSteps.join(' '))).toContain(`${n} × ${100 / d} = ${p}`);
    }
  });

  it('renders fraction labels once and preserves an explicit label', () => {
    const html = renderToStaticMarkup(createElement(MathVisual, { visual: { type: 'fracbar', fracs: [{ n: 2, d: 5, label: '2/5' }, { n: 25, d: 100, label: '25%' }, { n: 1, d: 4, label: '' }] } }));
    expect(html).toContain('>2/5</text>');
    expect(html).toContain('>25%</text>');
    expect(html).toContain('>1/4</text>');
    expect(html).not.toContain('2/52/5');
  });

  it('builds the denominator, then the numerator, then reads percent before fresh conversions', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const bridge = percentBridgeWave(createRng(seed));
      expect(bridge.map(s => s.question.subtopic)).toEqual(['make-hundred', 'same-factor', 'read-hundredths']);
      expect(bridge[1].model?.kind).toBe('table');
      expect(modelProblem(bridge[1])).toBeNull();
      for (const step of bridge) expect(judge(step, rightAnswer(step))).toBe(true);
      const practice = percentIndependentWave(createRng(seed));
      expect(new Set(practice.map(s => s.question.expression)).size).toBe(3);
      const start = bridge[0].question.visual;
      if (start.type !== 'fracbar') throw new Error('Missing source fraction');
      for (const step of practice) {
        expect(step.question.expression.startsWith(`${start.fracs[0].n}/${start.fracs[0].d} =`)).toBe(false);
        expect(step.choices!.filter(c => judge(step, c))).toHaveLength(1);
      }
    }
    for (const id of ['aq.ch11.market-tariff', 'aq.ch11.plaques']) {
      const run = buildQuest(id, createRng(7))!;
      const asks = run.steps.filter((s): s is AskStep => s.kind === 'ask');
      expect(asks).toHaveLength(10);
      expect(asks[0].wave).toContain('Make the bottom 100');
      expect(asks.slice(0, 3).map(s => s.question.subtopic)).toEqual(['make-hundred', 'same-factor', 'read-hundredths']);
      expect(asks.slice(3, 6).every(s => s.question.subtopic === 'convert')).toBe(true);
      expect(asks.slice(6, 8).every(s => s.question.subtopic === 'percent-of')).toBe(true);
    }
  });

  it('keeps computed amounts out of percent-of and tariff prompt models', () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const step of [percentOfStep(createRng(seed)), percentChangeStep(createRng(seed))]) {
        expect(step.question.visual.type).toBe('card');
        expect(step.question.solutionVisual?.type).toBe('bar');
        expect(renderToStaticMarkup(createElement(MathVisual, { visual: step.question.visual }))).toContain('? coins');
      }
    }
  });

  it('routes percentage training to its own numeric practice and records its fluency', () => {
    const chapter = chapterOf('arithmetic', 'pct')!;
    expect(chapter.drill.selection).toBe('academy:arithmetic.pct');
    const topics = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const q = generateQuestion('acad.arithmetic.pct', {}, { rng: createRng(seed) });
      topics.add(q.subtopic);
      expect(q.prompt).not.toContain('on the dial');
      expect(q.masterySkillId).toBe('acad.arithmetic.pct');
    }
    expect(topics).toEqual(new Set(['convert', 'percent-of', 'increase', 'decrease']));
    expect(chapter.fluency.skills).toContain('acad.arithmetic.pct');
    // Existing progress IDs survive a save/load cycle; no reset or chapter rename.
    const state = initialState();
    state.academy.tracks.arithmetic = { ...initialTrack(), chapters: { pct: { ...initialChapter(), quests: { 'aq.ch11.market-tariff': 1, 'aq.ch11.plaques': 1 }, conceptPass: true } } };
    const loaded = gameReducer(initialState(), { type: 'LOAD', state: JSON.parse(JSON.stringify(state)) });
    expect(loaded.academy.tracks.arithmetic.chapters.pct).toEqual(state.academy.tracks.arithmetic.chapters.pct);
    const practiceAnswers = Array.from({ length: chapter.fluency.n }, (_, i) => ({ at: i, skillId: 'acad.arithmetic.pct', questionId: `practice-${i}`, correct: true, timeMs: 2000, given: '40', expected: 40, context: 'drill' as const }));
    expect(fluencyFor(chapter, practiceAnswers).pass).toBe(true);
  });
});
