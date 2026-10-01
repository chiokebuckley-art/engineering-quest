import { describe, expect, it } from 'vitest';
import { VISUAL_CARDS, answerVisual, studyVisual, visualPool, visualChoices, matchesVisualName, migrateVisualProgress } from './progress';
import { initialState } from '../state/initialState';
import { gameReducer } from '../state/reducer';
import { serialize, deserialize } from '../save/SaveSystem';
import type { GameState } from '../state/types';

describe('Visual Library content and practice', () => {
  it('includes every card, separates subjects and defaults to studied cards', () => {
    expect(VISUAL_CARDS).toHaveLength(265);
    expect(new Set(VISUAL_CARDS.map(c => c.id)).size).toBe(265);
    expect(['k12','phys','ee'].map(d => VISUAL_CARDS.filter(c => c.domain === d).length)).toEqual([45,110,110]);
    expect(visualPool('k12', {})).toEqual([]);
    const p = studyVisual({}, VISUAL_CARDS[0].id);
    expect(visualPool('k12',p)).toEqual([VISUAL_CARDS[0]]);
    expect(visualPool('phys',p)).toEqual([]);
    expect(visualPool('ee',p,true)).toHaveLength(110);
    const exploredMiss = answerVisual({}, VISUAL_CARDS[0].id, 'choice', false);
    expect(visualPool('k12',exploredMiss,false,true)).toEqual([VISUAL_CARDS[0]]);
  });
  it('makes unique same-subject choices, including every correct card', () => {
    for (const card of VISUAL_CARDS) {
      const choices = visualChoices(card, () => .31);
      expect(choices).toHaveLength(4);
      expect(choices).toContain(card);
      expect(new Set(choices.map(c => c.name.toLowerCase())).size).toBe(4);
      expect(choices.every(c => c.domain === card.domain)).toBe(true);
      expect(matchesVisualName(card, `  ${card.name.toUpperCase()}  `)).toBe(true);
      expect(matchesVisualName(card, '')).toBe(false);
      expect(matchesVisualName(card, 'incorrect answer')).toBe(false);
      expect(card.lessonArt).not.toEqual(card.quizArt);
      expect(card.features.length).toBeGreaterThan(0);
    }
    expect(matchesVisualName(VISUAL_CARDS[17], 'cuboid')).toBe(true);
    expect(matchesVisualName(VISUAL_CARDS[22], 'prism')).toBe(false);
  });
  it('persists studies and misses through save/load and navigation', () => {
    let state = initialState(); const id = VISUAL_CARDS[22].id;
    state = gameReducer(state, { type: 'VISUAL_STUDY', id });
    state = gameReducer(state, { type: 'VISUAL_ANSWER', id, mode: 'recall', correct: false });
    for (let i=0;i<5;i++) state = gameReducer(state, { type: 'NAVIGATE', screen: i%2 ? 'academy' : 'visual-library' });
    const saved = deserialize<GameState>(serialize(state))!;
    state = gameReducer(initialState(), { type: 'LOAD', state: saved });
    expect(state.visualLibrary[id]).toMatchObject({ studied:true, missed:true, attempts:1, correct:0 });
    expect(visualPool('k12', state.visualLibrary, false,true)).toEqual([VISUAL_CARDS[22]]);
    state = gameReducer(state, { type: 'VISUAL_ANSWER', id, mode:'choice', correct:true });
    expect(state.visualLibrary[id].missed).toBe(true);
    state = gameReducer(state, { type:'VISUAL_ANSWER', id, mode:'recall', correct:true });
    expect(state.visualLibrary[id].missed).toBe(true);
    state = gameReducer(state, { type:'VISUAL_ANSWER', id, mode:'recall', correct:true });
    expect(state.visualLibrary[id]).toMatchObject({ missed:false, attempts:4, correct:3, choiceCorrect:1, recallCorrect:2 });
  });
  it('migrates old and malformed saves, ignores unknown ids and resets failed recall streaks', () => {
    const old = initialState(); delete (old as Partial<GameState>).visualLibrary;
    expect(gameReducer(initialState(), { type:'LOAD', state:old }).visualLibrary).toEqual({});
    const id = VISUAL_CARDS[0].id;
    expect(migrateVisualProgress({ unknown:{ studied:true }, [id]:{ attempts:-10, correct:999, studied:true } })[id]).toMatchObject({ attempts:0, correct:0, studied:true });
    let p = answerVisual({},id,'recall',false); p = answerVisual(p,id,'recall',true); p = answerVisual(p,id,'recall',false);
    expect(p[id].reviewStreak).toBe(0);
    expect(studyVisual(p,'invalid')).toBe(p);
  });
});
