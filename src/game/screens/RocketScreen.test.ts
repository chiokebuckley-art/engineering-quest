// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { initialState } from '../../engine/state/initialState';
import { startRocket } from '../../engine/state/rocket';
import { RocketScreen } from './RocketScreen';

const mock = vi.hoisted(() => ({ store: {} as Record<string, unknown>, unavailable: vi.fn() }));
vi.mock('../store', () => ({ useGame: () => mock.store }));
vi.mock('../components/Fx', () => ({ Confetti: () => null, Callout: () => null }));
vi.mock('three', async (original) => ({
  ...await original<typeof import('three')>(),
  WebGLRenderer: class { constructor() { mock.unavailable(); throw new Error('WebGL unavailable'); } },
}));

let node: HTMLDivElement;
let root: Root;
let dispatch: ReturnType<typeof vi.fn>;
beforeEach(async () => {
  await import('./RocketScene3D');
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  node = document.createElement('div'); document.body.append(node); root = createRoot(node);
  dispatch = vi.fn(); mock.unavailable.mockClear();
  const state = initialState(); state.rocket = startRocket('r1', {});
  mock.store = { state, dispatch, play: vi.fn() };
});
afterEach(async () => { await act(async () => root.unmount()); node.remove(); });

describe('rocket controls without WebGL', () => {
  it('keeps the fallback craft, answer lanes and BOOST usable after renderer failure', async () => {
    await act(async () => root.render(createElement(RocketScreen)));
    expect(mock.unavailable).toHaveBeenCalled();
    expect(node.querySelector('.flight-deck.world-ready')).toBeNull();
    expect(node.querySelector('.pad svg')).not.toBeNull();
    const lanes = node.querySelectorAll<HTMLButtonElement>('.lane');
    expect(lanes).toHaveLength(3);
    await act(async () => lanes[0].click());
    expect(dispatch).toHaveBeenCalledWith({ type: 'ROCKET_LANE', lane: 0 });
    await act(async () => node.querySelector<HTMLButtonElement>('.ctl.boost')!.click());
    expect(dispatch).toHaveBeenCalledWith({ type: 'ROCKET_BOOST' });
    await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
    expect(dispatch).toHaveBeenCalledWith({ type: 'ROCKET_MOVE', dir: 1 });
  });

  it('does not hijack Enter on a focused Quit button', async () => {
    await act(async () => root.render(createElement(RocketScreen)));
    const quit = [...node.querySelectorAll('button')].find(button => button.textContent === 'Quit')!;
    quit.focus();
    await act(async () => quit.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'ROCKET_BOOST' });
    await act(async () => quit.click());
    expect(dispatch).toHaveBeenCalledWith({ type: 'ROCKET_EXIT' });
  });
});
