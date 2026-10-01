// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { GearAvatarPicker } from './GearAvatarPicker';
import type { GearAvatarId } from '../../engine/state/gearAvatars';
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined; let host: HTMLDivElement;
afterEach(()=>{if(root)act(()=>root!.unmount());host?.remove();root=undefined;});
describe('Avatar selection controls',()=>{
 it('offers all five named choices without replacing the player name',()=>{
  host=document.createElement('div');document.body.appendChild(host);root=createRoot(host);let selected:GearAvatarId='engineer';
  act(()=>root!.render(createElement(GearAvatarPicker,{value:'engineer',onChange:(id)=>{selected=id;},label:'Choose your studio avatar'})));
  const buttons=[...host.querySelectorAll('button')];expect(buttons.map(b=>b.textContent)).toEqual(['⚙Engineer','Ian','Myla','Ella','Mom','Dad']);
  act(()=>buttons[2].click());expect(selected).toBe('myla');expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
  act(()=>root!.render(createElement(GearAvatarPicker,{value:selected,onChange:()=>{},label:'Choose your studio avatar'})));
  expect(host.querySelectorAll('button')[2].getAttribute('aria-pressed')).toBe('true');
 });
 it('uses a labeled compact selector for pass-and-play friends',()=>{
  host=document.createElement('div');document.body.appendChild(host);root=createRoot(host);let selected:GearAvatarId='engineer';
  act(()=>root!.render(createElement(GearAvatarPicker,{value:'ian',onChange:id=>{selected=id;},label:'Friend 1 avatar',compact:true})));
  const select=host.querySelector('select')!;expect(select.value).toBe('ian');expect(select.closest('label')?.textContent).toContain('Friend 1 avatar');
  act(()=>{select.value='dad';select.dispatchEvent(new Event('change',{bubbles:true}));});expect(selected).toBe('dad');
 });
});
