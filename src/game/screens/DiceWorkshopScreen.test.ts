// @vitest-environment jsdom
import {afterEach,it,expect,vi} from 'vitest';
import {act,createElement,useReducer} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {DiceWorkshopScreen} from './DiceWorkshopScreen';
import {applyDiceEvent,emptyDiceData,total,groupFact,CATEGORIES,type DiceData,type DiceEvent} from '../../engine/state/diceWorkshop';
let latest:DiceData;let destination='';
vi.mock('../store',()=>({useGame:()=>{const [data,dispatch]=useReducer((d:DiceData,a:{type:string;event:DiceEvent;screen?:string})=>{if(a.type==='NAVIGATE'){destination=a.screen!;return d;}return applyDiceEvent(d,a.event,()=>.4);},emptyDiceData());latest=data;return {state:{diceWorkshop:data,character:{name:'Ella'},settings:{reducedMotion:true}},dispatch,play:()=>{}};}}));
vi.mock('../components/DiceWorkshopScene',()=>({default:()=>createElement('div',{'data-scene':'true'},'3D table')}));
(globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
let root:Root|undefined;let host:HTMLDivElement;
afterEach(()=>{if(root)act(()=>root!.unmount());host?.remove();root=undefined;});
async function mount(){host=document.createElement('div');document.body.appendChild(host);root=createRoot(host);await act(async()=>root!.render(createElement(DiceWorkshopScreen)));}
function button(text:string){const b=[...host.querySelectorAll('button')].find(b=>b.textContent===text);expect(b,`button ${text}`).toBeTruthy();return b!;}
async function click(text:string){await act(async()=>button(text).click());}
function input(label:string,value:string){const el=host.querySelector(`input[aria-label="${label}"]`)!;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));}
async function solve(){await act(async()=>{input('Total of all five dice',String(total(latest.run!.dice)));input('Equal groups answer',String(groupFact(latest.run!.dice).answer));});await act(async()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));}
it('plays all thirteen turns through the actual controls and displays final results',async()=>{
 await mount();await click('Mom');await click('Start game');expect(latest.avatar).toBe('mom');expect(host.querySelector('[data-scene]')).toBeTruthy();
 for(const cat of CATEGORIES){await click('Roll five dice');const score=host.querySelector(`button[aria-label^="Score ${cat==='ones'?'Ones':cat==='twos'?'Twos':'Chance'}"]`) as HTMLButtonElement|null;if(score)expect(score.disabled).toBe(true);await solve();expect(latest.run!.checked).toBe(true);const labels:Record<string,string>={ones:'Ones',twos:'Twos',threes:'Threes',fours:'Fours',fives:'Fives',sixes:'Sixes',three:'3 of a kind',four:'4 of a kind',house:'Full house',small:'Small straight',large:'Large straight',five:'Five of a kind',chance:'Chance'};await act(async()=>{(host.querySelector(`button[aria-label^="Score ${labels[cat]}:"]`) as HTMLButtonElement).click();});if(host.querySelector('.dice-confirm'))await click('Record zero');}
 expect(latest.run!.finished).toBe(true);expect(latest.games).toBe(1);expect(host.querySelector('.dice-finish')?.textContent).toContain(`${latest.best} points`);await click('Play again');expect(latest.run).toBeNull();expect(host.textContent).toContain('Games completed: 1');
});
it('supports holds, retries, help, a simple view, leaving, and explicit restart',async()=>{
 await mount();await click('Start game');await click('Use simple view');expect(host.querySelector('[data-scene]')).toBeNull();await click('Roll five dice');await act(async()=>{(host.querySelector('[aria-label="Die 1: 3, not held"]') as HTMLButtonElement).click();});expect(latest.run!.held[0]).toBe(true);
 await act(async()=>{input('Total of all five dice','1');input('Equal groups answer','1');});await act(async()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));expect(host.querySelector('[role="status"]')?.textContent).toContain('Try adding');expect(latest.correct).toBe(0);
 await click('Show the steps');expect(host.querySelector('.dice-steps')?.textContent).toContain('Total: 15');expect(latest.run!.checked).toBe(true);await click('Roll unheld dice');expect(latest.run!.checked).toBe(false);
 await click('Save & leave');expect(destination).toBe('arcade');expect(latest.run!.rolls).toBe(2);await click('Start over');await click('Keep playing');expect(latest.run).not.toBeNull();await click('Start over');await click('Discard scorecard');expect(latest.run).toBeNull();
});
