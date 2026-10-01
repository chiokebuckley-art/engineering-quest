// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { initialState } from '../../engine/state/initialState';
import { gameReducer } from '../../engine/state/reducer';
import { NavalBlitz } from './NavalBlitz';
const mock = vi.hoisted(() => ({ store: {} as Record<string, unknown>, unavailable: vi.fn() }));
vi.mock('../store', () => ({ useGame: () => mock.store }));
vi.mock('three', async original => ({ ...await original<typeof import('three')>(), WebGLRenderer: class { constructor() { mock.unavailable(); throw new Error('No GPU'); } } }));
let node: HTMLDivElement; let root: Root; let dispatch: ReturnType<typeof vi.fn>;
beforeEach(async () => {
  await import('./NavalScene3D'); (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  node = document.createElement('div'); document.body.append(node); root = createRoot(node); dispatch = vi.fn();
  let state = gameReducer(initialState(), { type: 'VERSUS_SETUP', kind: 'hotseat', game: 'bonds', selection: 'bonds:10', names: ['Captain', 'Rival'] });
  state = gameReducer(state, { type: 'VERSUS_BEGIN_TURN' }); mock.store = { state, dispatch, play: vi.fn() };
});
afterEach(async () => { await act(async () => root.unmount()); node.remove(); });
describe('naval controls without WebGL', () => {
  it('keeps ships, hull readouts, keypad, fire and leave usable after renderer failure', async () => {
    await act(async () => root.render(createElement(NavalBlitz, { left: 60000, done: false, notYet: false })));
    expect(mock.unavailable).toHaveBeenCalled(); expect(node.querySelectorAll('.fleet-status')).toHaveLength(2);
    const key = [...node.querySelectorAll<HTMLButtonElement>('.naval-keypad button')].find(b => b.textContent === '7')!;
    await act(async () => key.click()); expect(node.querySelector<HTMLInputElement>('input')!.value).toBe('7');
    await act(async () => node.querySelector<HTMLButtonElement>('.fire-button')!.click());
    expect(dispatch).toHaveBeenCalledWith({ type: 'ARCADE_ANSWER', given: '7' });
    await act(async () => [...node.querySelectorAll<HTMLButtonElement>('button')].find(b => b.textContent === 'Leave')!.click());
    expect(dispatch).toHaveBeenCalledWith({ type: 'VERSUS_EXIT' });
  });
});
