// @vitest-environment jsdom
import { act, createElement, useReducer } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initialState } from '../../engine/state/initialState';
import { gameReducer } from '../../engine/state/reducer';
import type { GameState } from '../../engine/state/types';
import { VisualLibraryScreen } from './VisualLibraryScreen';

let latest: GameState; let seed: GameState;
vi.mock('../store', () => ({ useGame: () => {
  const [state, dispatch] = useReducer(gameReducer, seed); latest = state;
  return { state, dispatch };
} }));
let host: HTMLDivElement; let root: Root;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  seed = initialState(); seed.screenParams = { card: 't1_k12_tri_prism' };
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
const mount = async () => { await act(async () => root.render(createElement(VisualLibraryScreen))); };
function button(name: string) { const b = [...host.querySelectorAll('button')].find(b => b.textContent === name); expect(b, name).toBeTruthy(); return b!; }
const click = async (name: string) => { await act(async () => button(name).click()); };
const loadImage = async () => { await act(async () => host.querySelector('img')!.dispatchEvent(new Event('load'))); };
async function typeAnswer(value: string) {
  await loadImage();
  await act(async () => { const input = host.querySelector('#vl-answer')!; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,value); input.dispatchEvent(new Event('input',{bubbles:true})); });
}
async function submit(twice = false) {
  await act(async () => { const form = host.querySelector('form')!; form.dispatchEvent(new Event('submit',{ bubbles:true,cancelable:true })); if (twice) form.dispatchEvent(new Event('submit',{ bubbles:true,cancelable:true })); });
}
describe('Visual Library controls', () => {
  it('replaces labelled and previous quiz bitmaps immediately and gates answers across rapid navigation', async () => {
    await mount(); await loadImage(); const lesson = host.querySelector('img')!;
    expect(lesson.style.visibility).toBe('visible');
    await click('Try choosing the name →'); const first = host.querySelector('img')!;
    expect(first).not.toBe(lesson); expect(first.src).toContain('022-quiz.webp');
    expect(first.style.visibility).toBe('hidden');
    expect([...host.querySelectorAll<HTMLButtonElement>('.vl-answer')].every(b => b.disabled)).toBe(true);
    await act(async () => lesson.dispatchEvent(new Event('load')));
    expect(button('Check answer').disabled).toBe(true);
    await loadImage(); expect([...host.querySelectorAll<HTMLButtonElement>('.vl-answer')].every(b => !b.disabled)).toBe(true);
    await click('Next →'); const second = host.querySelector('img')!;
    expect(second).not.toBe(first); expect(second.style.visibility).toBe('hidden');
    await click('← Previous'); const third = host.querySelector('img')!;
    expect(third).not.toBe(first); expect(third.style.visibility).toBe('hidden');
    await act(async () => first.dispatchEvent(new Event('load')));
    expect([...host.querySelectorAll<HTMLButtonElement>('.vl-answer')].every(b => b.disabled)).toBe(true);
    await act(async () => [...host.querySelectorAll('button')].find(b => b.textContent?.startsWith('Physics'))!.click());
    await click('Explore all cards');
    expect(host.querySelector('img')!.style.visibility).toBe('hidden');
    await loadImage(); expect([...host.querySelectorAll<HTMLButtonElement>('.vl-answer')].every(b => !b.disabled)).toBe(true);
    for (const index of [46,47,48]) {
      const previous = host.querySelector('img')!; await click('Next →');
      expect(host.querySelector('img')!.src).toContain(`${String(index).padStart(3,'0')}-quiz.webp`);
      expect(host.querySelector('img')!.style.visibility).toBe('hidden');
      await act(async () => previous.dispatchEvent(new Event('load')));
      expect([...host.querySelectorAll<HTMLButtonElement>('.vl-answer')].every(b => b.disabled)).toBe(true);
      await loadImage();
    }
  });
  it('blocks submission after image failure and retries with a fresh image element', async () => {
    await mount(); await click('Try typing the name'); await typeAnswer('triangular prism');
    await act(async () => host.querySelector('img')!.dispatchEvent(new Event('error')));
    expect(host.textContent).toContain('Image could not load');
    expect(host.querySelector<HTMLInputElement>('#vl-answer')!.disabled).toBe(true);
    await submit(); expect(latest.visualLibrary.t1_k12_tri_prism.attempts).toBe(0);
    const failed=host.querySelector('img')!; await click('Retry image');
    expect(host.querySelector('img')).not.toBe(failed);
    expect(button('Check answer').disabled).toBe(true);
    await typeAnswer('triangular prism'); await submit();
    expect(latest.visualLibrary.t1_k12_tri_prism.attempts).toBe(1);
  });
  it('hides names, definitions and selectors during recall, counts only one submission and resets the same-card retry', async () => {
    await mount(); await click('Try typing the name');
    expect(host.textContent).not.toContain('Triangular prism');
    expect(host.textContent).not.toContain('Two triangle ends');
    expect(host.querySelector('#vl-browse')).toBeNull();
    expect(host.querySelector('img')!.alt).toBe('Unlabelled image to identify');
    expect(host.querySelector('img')!.src).toContain('022-quiz.webp');
    await typeAnswer('TRIANGULAR PRISM'); await submit(true);
    expect(latest.visualLibrary.t1_k12_tri_prism.attempts).toBe(1);
    expect(host.textContent).toContain('Correct!');
    await click('Next image →');
    expect(host.querySelector('#vl-answer')!.getAttribute('value')).toBe('');
    expect(host.textContent).not.toContain('Triangular prism');
  });
  it('reviews missed names, keeps the final feedback visible and then shows an empty review', async () => {
    await mount(); await click('Try typing the name'); await typeAnswer('square pyramid'); await submit();
    expect(latest.visualLibrary.t1_k12_tri_prism.missed).toBe(true);
    await act(async () => host.querySelector<HTMLInputElement>('input[type=checkbox]')!.click());
    for (let i=0;i<2;i++) {
      await typeAnswer('triangular prism'); await submit();
      expect(host.textContent).toContain('Correct!');
      await click('Next image →');
    }
    expect(latest.visualLibrary.t1_k12_tri_prism.missed).toBe(false);
    expect(host.textContent).toContain('No missed names in this set');
  });
  it('starts Arcade practice with studied cards and keeps advanced pools separate', async () => {
    seed.screenParams = { practice:'choice' }; await mount();
    expect(host.textContent).toContain('Learn a card first');
    expect(host.querySelectorAll('.vl-answer')).toHaveLength(0);
    await click('Explore all cards'); expect(host.querySelectorAll('.vl-answer')).toHaveLength(4);
    await act(async () => [...host.querySelectorAll('button')].find(b => b.textContent?.startsWith('Electrical'))!.click());
    expect(host.querySelector('#vl-chapter')).toBeNull();
    expect(host.textContent).toContain('110 cards in this set');
    expect(host.querySelector('img')!.src).toContain('155-quiz.webp');
  });
});
