import { describe,it,expect } from 'vitest';
import { CATEGORIES,applyDiceEvent,emptyDiceData,scoreFor,totals,allowedCategories,parseDiceData,total,groupFact,type DiceData,type Card } from './diceWorkshop';
import { gameReducer } from './reducer';
import { initialState } from './initialState';
import { serialize,deserialize } from '../save/SaveSystem';
import type { GameState } from './types';
const start=()=>applyDiceEvent(emptyDiceData(),{kind:'start',mode:'both',avatar:'ella'});
const roll=(d:DiceData,values=[3,3,3,4,5])=>{let i=0;return applyDiceEvent(d,{kind:'roll'},()=>(values[i++]-1)/6+.001);};
const solve=(d:DiceData)=>applyDiceEvent(d,{kind:'check',sum:String(total(d.run!.dice)),group:String(groupFact(d.run!.dice).answer)});
describe('Dice Workshop rules',()=>{
 it('scores all 7,776 possible rolls against independent category definitions',()=>{
  for(let seed=0;seed<7776;seed++){let n=seed;const dice=Array.from({length:5},()=>{const v=n%6+1;n=Math.floor(n/6);return v;});const sum=dice.reduce((a,b)=>a+b,0),freq=new Map<number,number>();for(const v of dice)freq.set(v,(freq.get(v)??0)+1);const sorted=[...freq.values()].sort().join(','),unique=[...freq.keys()].sort().join('');
   CATEGORIES.slice(0,6).forEach((c,i)=>expect(scoreFor(dice,c)).toBe((freq.get(i+1)??0)*(i+1)));
   expect(scoreFor(dice,'three')).toBe([...freq.values()].some(v=>v>=3)?sum:0);
   expect(scoreFor(dice,'four')).toBe([...freq.values()].some(v=>v>=4)?sum:0);
   expect(scoreFor(dice,'house')).toBe(sorted==='2,3'?25:0);
   expect(scoreFor(dice,'small')).toBe(/1234|2345|3456/.test(unique)?30:0);
   expect(scoreFor(dice,'large')).toBe(['12345','23456'].includes(unique)?40:0);
   expect(scoreFor(dice,'five')).toBe(freq.size===1?50:0);expect(scoreFor(dice,'chance')).toBe(sum);
  }
 });
 it('holds dice and enforces three rolls without spending a roll on all-held dice',()=>{
  let d=roll(start());d=applyDiceEvent(d,{kind:'hold',index:0});d=roll(d,[6,6,6,6]);expect(d.run!.dice).toEqual([3,6,6,6,6]);expect(d.run!.rolls).toBe(2);
  for(let i=1;i<5;i++)d=applyDiceEvent(d,{kind:'hold',index:i});expect(roll(d)).toBe(d);
  d=applyDiceEvent(d,{kind:'hold',index:4});d=roll(d,[2]);expect(d.run!.dice).toEqual([3,6,6,6,2]);expect(roll(d)).toBe(d);expect(applyDiceEvent(d,{kind:'hold',index:0})).toBe(d);
 });
 it('requires a roll and checked math before scoring; wrong answers may retry',()=>{
  const s=start();expect(applyDiceEvent(s,{kind:'score',category:'chance'})).toBe(s);expect(applyDiceEvent(s,{kind:'hold',index:0})).toBe(s);
  let d=roll(s);expect(applyDiceEvent(d,{kind:'score',category:'chance'})).toBe(d);d=applyDiceEvent(d,{kind:'check',sum:'17',group:'9'});expect(d.run!.checked).toBe(false);expect(d.attempts).toBe(1);
  d=solve(d);expect(d.run!.checked).toBe(true);expect(d.correct).toBe(1);expect(d.attempts).toBe(2);d=roll(d);expect(d.run!.checked).toBe(false);
  d=solve(d);d=applyDiceEvent(d,{kind:'score',category:'chance'});expect(d.run!.card.chance).toBe(18);expect(d.run!.rolls).toBe(0);d=solve(roll(d));expect(applyDiceEvent(d,{kind:'score',category:'chance'})).toBe(d);
 });
 it('supports both practice modes and explains answers without awarding independent credit',()=>{
  for(const mode of ['sum','groups'] as const){let d=roll(applyDiceEvent(emptyDiceData(),{kind:'start',mode,avatar:'dad'}));d=applyDiceEvent(d,{kind:'check',sum:mode==='sum'?'18':'',group:mode==='groups'?'9':''});expect(d.run!.checked).toBe(true);}
  let d=roll(start());d=applyDiceEvent(d,{kind:'reveal'});expect(d.run!.checked).toBe(true);expect(d.run!.assisted).toBe(true);expect(d.correct).toBe(0);expect(d.attempts).toBe(0);
 });
 it('applies upper and repeat-five bonuses and forced Joker categories',()=>{
  expect(totals({ones:3,twos:6,threes:9,fours:12,fives:15,sixes:18})).toEqual({upper:63,upperBonus:35,total:98});expect(totals({sixes:30,fives:25,fours:4,threes:3}).upperBonus).toBe(0);
  for(const initial of [0,50]){let d=roll(start(),[6,6,6,6,6]);d.run!.card={five:initial};d=solve(d);expect(allowedCategories(d.run!)).toEqual(['sixes']);expect(applyDiceEvent(d,{kind:'score',category:'house'})).toBe(d);d=applyDiceEvent(d,{kind:'score',category:'sixes'});expect(d.run!.bonus).toBe(initial?100:0);d=solve(roll(d,[6,6,6,6,6]));expect(allowedCategories(d.run!)).not.toContain('ones');expect(scoreFor(d.run!.dice,'house',d.run!.card)).toBe(25);d=applyDiceEvent(d,{kind:'score',category:'house'});expect(d.run!.bonus).toBe(initial?200:0);}
 });
 it('ends after thirteen entries, counts one game, saves best, and can start again',()=>{
  let d=start();for(const category of CATEGORIES){d=solve(roll(d));d=applyDiceEvent(d,{kind:'score',category});}expect(d.run!.finished).toBe(true);expect(d.games).toBe(1);expect(d.best).toBe(totals(d.run!.card,d.run!.bonus).total);expect(roll(d)).toBe(d);expect(applyDiceEvent(d,{kind:'score',category:'chance'})).toBe(d);d=applyDiceEvent(d,{kind:'clear'});expect(d.run).toBeNull();expect(d.games).toBe(1);
 });
 it('allows zero upper Joker entries after the lower section is full',()=>{
  const d=solve(roll(start(),[6,6,6,6,6]));d.run!.card=Object.fromEntries(CATEGORIES.slice(6).map(c=>[c,c==='five'?50:0])) as Card;d.run!.card.sixes=30;expect(allowedCategories(d.run!)).toEqual(['ones','twos','threes','fours','fives']);expect(scoreFor(d.run!.dice,'ones',d.run!.card)).toBe(0);
 });
 it('resumes a real serialized game through LOAD without losing the profile',()=>{
  let state=gameReducer(initialState(),{type:'CREATE_CHARACTER',name:'Ella',avatar:'engineer',specialization:'undecided'});
  state=gameReducer(state,{type:'DICE_EVENT',event:{kind:'start',mode:'both',avatar:'mom'}});state=gameReducer(state,{type:'NAVIGATE',screen:'dice'});state=gameReducer(state,{type:'DICE_EVENT',event:{kind:'roll'}});state=gameReducer(state,{type:'DICE_EVENT',event:{kind:'hold',index:1}});
  const restored=gameReducer(initialState(),{type:'LOAD',state:deserialize<GameState>(serialize(state))!});expect(restored.diceWorkshop).toEqual(state.diceWorkshop);expect(restored.character!.name).toBe('Ella');expect(restored.screen).toBe('dice');
 });
 it('migrates old saves and rejects malformed dice/card data',()=>{
  expect(parseDiceData(undefined)).toEqual(emptyDiceData());const d=roll(start());expect(parseDiceData(d)).toEqual(d);
  for(const bad of [{...d,run:{...d.run,dice:[7,1,1,1,1]}},{...d,run:{...d.run,card:{chance:900}}},{...d,run:{...d.run,held:[]}}])expect(parseDiceData(bad).run).toBeNull();
 });
});
