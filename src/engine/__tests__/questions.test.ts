import { describe, it, expect } from 'vitest';
import { generateQuestion, checkAnswer, questionForFact, generateFromSkills } from '../questions';
import { createRng } from '../rng';
import { parseMultFact, multFactId } from '../curriculum/facts';

describe('QuestionGenerator', () => {
  it('generates correct multiplication table questions for every table', () => {
    const rng = createRng(42);
    for (let t = 1; t <= 12; t++) {
      for (let i = 0; i < 40; i++) {
        const q = generateQuestion(`mult.${t}`, {}, { rng, difficulty: 2 });
        const m = /^(\d+) × (\d+) = \?$/.exec(q.expression);
        expect(m, q.expression).toBeTruthy();
        const a = Number(m![1]); const b = Number(m![2]);
        expect(a === t || b === t).toBe(true);
        expect(q.answer).toBe(a * b);
        expect(q.factId).toBe(multFactId(a, b));
        expect(q.explanation.length).toBeGreaterThan(2);
        expect(q.hint.length).toBeGreaterThan(0);
      }
    }
  });

  it('produces missing-factor, applied and multi-step problems at higher difficulty with correct answers', () => {
    const rng = createRng(7);
    const kinds = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const q = generateQuestion('mult', {}, { rng, difficulty: 6 });
      kinds.add(q.subtopic);
      if (q.subtopic === 'Missing factor') {
        const m = /^(\d+) × \? = (\d+)$|^\? × (\d+) = (\d+)$/.exec(q.expression)!;
        const known = Number(m[1] ?? m[3]); const product = Number(m[2] ?? m[4]);
        expect(known * q.answer).toBe(product);
      }
      if (q.subtopic === 'Applied problem') {
        const f = parseMultFact(q.factId!)!;
        expect(q.answer).toBe(f.a * f.b);
        expect(q.mode).toBe('applied');
        expect(q.unit).toBeTruthy();
      }
    }
    expect(kinds.has('Missing factor')).toBe(true);
    expect(kinds.has('Applied problem')).toBe(true);
    expect(kinds.has('Multi-step')).toBe(true);
  });

  it('generates correct division questions', () => {
    const rng = createRng(3);
    for (let d = 2; d <= 12; d++) {
      for (let i = 0; i < 20; i++) {
        const q = generateQuestion(`div.${d}`, {}, { rng, difficulty: 3 });
        const m = /^(\d+) ÷ (\d+) = \?$/.exec(q.expression)!;
        expect(Number(m[2])).toBe(d);
        expect(q.answer * d).toBe(Number(m[1]));
      }
    }
  });

  it('checks answers leniently but correctly', () => {
    const q = generateQuestion('mult.7', {}, { rng: createRng(1), difficulty: 2 });
    expect(checkAnswer(q, String(q.answer))).toBe(true);
    expect(checkAnswer(q, ` ${q.answer} bolts `)).toBe(true);
    expect(checkAnswer(q, String(q.answer + 1))).toBe(false);
    expect(checkAnswer(q, '')).toBe(false);
    expect(checkAnswer(q, 'abc')).toBe(false);
  });

  it('can target a specific fact for review', () => {
    const q = questionForFact('fact:mult:6x7', {}, { rng: createRng(9) });
    expect(q?.factId).toBe('fact:mult:6x7');
    expect(q?.answer).toBe(42);
  });

  it('draws from multiple skills', () => {
    const rng = createRng(11);
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) seen.add(generateFromSkills(['mult.3', 'mult.4'], {}, { rng, difficulty: 2 }).masterySkillId);
    expect(seen.has('mult.3') && seen.has('mult.4')).toBe(true);
  });
});
