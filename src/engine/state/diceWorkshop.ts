import {normalizeGearAvatar,type GearAvatarId} from './gearAvatars';
import {labn} from '../label';
export const CATEGORIES=['ones','twos','threes','fours','fives','sixes','three','four','house','small','large','five','chance'] as const;
export type Category=typeof CATEGORIES[number];
export const LABELS:Record<Category,string>={ones:'Ones',twos:'Twos',threes:'Threes',fours:'Fours',fives:'Fives',sixes:'Sixes',three:'3 of a kind',four:'4 of a kind',house:'Full house',small:'Small straight',large:'Large straight',five:'Five of a kind',chance:'Chance'};
export const RULES:Record<Category,string>={ones:'Add only the 1s',twos:'Add only the 2s',threes:'Add only the 3s',fours:'Add only the 4s',fives:'Add only the 5s',sixes:'Add only the 6s',three:'At least 3 matching: add all dice',four:'At least 4 matching: add all dice',house:'A pair and a triple: 25 points',small:'Four consecutive values: 30 points',large:'Five consecutive values: 40 points',five:'All five matching: 50 points',chance:'Add all five dice'};
export type Mode='sum'|'groups'|'both'|'fractions'|'ratios';
export const MODES:Mode[]=['sum','groups','both','fractions','ratios'];
/** Which answer boxes a practice mode asks for. The fraction and ratio answers travel in the first box. */
export const needsSum=(m:Mode)=>m==='sum'||m==='both';
export const needsGroup=(m:Mode)=>m==='groups'||m==='both';
export type Card=Partial<Record<Category,number>>;
export interface DiceRun {dice:number[];held:boolean[];rolls:number;card:Card;bonus:number;mode:Mode;checked:boolean;assisted:boolean;tries:number;finished:boolean;message:string;last:string;revision:number}
export interface DiceData {avatar:GearAvatarId;best:number;games:number;attempts:number;correct:number;run:DiceRun|null}
export type DiceEvent={kind:'start';mode:Mode;avatar:GearAvatarId}|{kind:'roll'}|{kind:'hold';index:number}|{kind:'check';sum:string;group:string}|{kind:'reveal'}|{kind:'score';category:Category}|{kind:'clear'};
export const emptyDiceData=():DiceData=>({avatar:'engineer',best:0,games:0,attempts:0,correct:0,run:null});
export const total=(dice:number[])=>dice.reduce((a,b)=>a+b,0);
export function counts(dice:number[]){return Array.from({length:6},(_,i)=>dice.filter(d=>d===i+1).length);}
export function groupFact(dice:number[]){const c=counts(dice);const count=Math.max(...c);const value=c.lastIndexOf(count)+1;return {value,count,answer:value*count};}
/** Fractions: what fraction of the five dice show the most common value? */
export function fractionFact(dice:number[]){const {value,count}=groupFact(dice);return {value,count,text:`${count}/5`};}
/** Ratios: even dice to odd dice. */
export function ratioFact(dice:number[]){const evens=dice.filter(d=>d%2===0).length;return {evens,odds:dice.length-evens,text:`${evens}:${dice.length-evens}`};}
/** A fraction answer: "2/5", an equal fraction like "4/10", or a decimal like "0.4". */
export function fractionRight(given:string,count:number,of=5):boolean{
 const g=given.trim();const m=/^(\d+)\s*\/\s*(\d+)$/.exec(g);
 if(m){const n=Number(m[1]),d=Number(m[2]);return d>0&&n*of===count*d;}
 if(/^\d*\.?\d+$/.test(g))return Math.abs(Number(g)-count/of)<1e-9;
 return false;
}
/** A ratio answer: "3:2" or an equal ratio like "6:4" (0:0 is never right). */
export function ratioRight(given:string,a:number,b:number):boolean{
 const m=/^(\d+)\s*[:：]\s*(\d+)$/.exec(given.trim());if(!m)return false;
 const x=Number(m[1]),y=Number(m[2]);return (x>0||y>0)&&x*b===y*a;
}
/** Is this turn's maths right? `sum` holds the total, the fraction or the ratio; `group` the equal-groups answer. */
export function mathRight(r:{mode:Mode;dice:number[]},sum:string,group:string){
 const parse=(v:string)=>/^\d+$/.test(v.trim())?Number(v):NaN;
 if(r.mode==='fractions'){const f=fractionFact(r.dice);const ok=fractionRight(sum,f.count);return {right:ok,sumOK:ok,groupOK:true};}
 if(r.mode==='ratios'){const f=ratioFact(r.dice);const ok=ratioRight(sum,f.evens,f.odds);return {right:ok,sumOK:ok,groupOK:true};}
 const sumOK=!needsSum(r.mode)||parse(sum)===total(r.dice),groupOK=!needsGroup(r.mode)||parse(group)===groupFact(r.dice).answer;
 return {right:sumOK&&groupOK,sumOK,groupOK};
}
/** The one-line prompt shown on the table's screen. Each number carries a label saying what it is. */
export function mathLine(r:{mode:Mode;dice:number[];checked:boolean}):string{
 if(r.mode==='fractions'){const f=fractionFact(r.dice);return `Showing ${f.value}: ${r.checked?labn(f.count,'matching die','matching dice'):'? (matching dice)'} of 5 (dice) = ${r.checked?f.text:'?/5'}`;}
 if(r.mode==='ratios'){const f=ratioFact(r.dice);return r.checked?`${labn(f.evens,'even die','even dice')} : ${labn(f.odds,'odd die','odd dice')} = ${f.text}`:'? (even dice) : ? (odd dice)';}
 if(r.mode==='groups'){const f=groupFact(r.dice);return `${labn(f.count,'matching die','matching dice')} × ${f.value} (face value) = ${r.checked?f.answer:'?'} (group total)`;}
 return 'Dice faces: '+r.dice.join(' + ')+` = ${r.checked?total(r.dice):'?'} (dice total)`;
}
/** The worked steps shown after a check or Show the steps, one line each, with every number labelled. */
export function diceSteps(r:{mode:Mode;dice:number[]}):string[]{
 const out:string[]=[];
 if(r.mode==='fractions'){const f=fractionFact(r.dice);out.push(`${f.count} of the 5 dice ${f.count===1?'shows':'show'} a ${f.value}.`,`${labn(f.count,'matching die','matching dice')} on top, 5 (dice) on the bottom: ${f.text}.`);}
 if(r.mode==='ratios'){const f=ratioFact(r.dice);out.push(`Even dice (2, 4, 6): ${f.evens}. Odd dice (1, 3, 5): ${f.odds}.`,`${labn(f.evens,'even die','even dice')} : ${labn(f.odds,'odd die','odd dice')} = ${f.text}.`);}
 if(needsSum(r.mode)){const d=r.dice;for(let i=1;i<d.length;i++)out.push(`${total(d.slice(0,i))} (${i===1?'first die':'running total'}) + ${d[i]} (next die) = ${total(d.slice(0,i+1))} (running total)`);out.push(`Total: ${total(d)} (dice total)`);}
 if(needsGroup(r.mode)){const f=groupFact(r.dice);out.push(`${Array.from({length:f.count},()=>f.value).join(' + ')} = ${f.answer} (group total): the ${f.value} (face value) added once per matching die.`,`That’s ${labn(f.count,'matching die','matching dice')} × ${f.value} (face value) = ${f.answer} (group total).`);}
 return out;
}
export function totals(card:Card,bonus=0){const upper=CATEGORIES.slice(0,6).reduce((n,c)=>n+(card[c]??0),0);const upperBonus=upper>=63?35:0;return {upper,upperBonus,total:CATEGORIES.reduce((n,c)=>n+(card[c]??0),0)+upperBonus+bonus};}
export const isFive=(dice:number[])=>dice.length===5&&new Set(dice).size===1;
export function allowedCategories(r:DiceRun):Category[]{const open=CATEGORIES.filter(c=>r.card[c]===undefined);if(!isFive(r.dice)||r.card.five===undefined)return open;const upper=CATEGORIES[r.dice[0]-1];if(open.includes(upper))return [upper];const lower=open.filter(c=>CATEGORIES.indexOf(c)>=6);return lower.length?lower:open;}
export function scoreFor(dice:number[],category:Category,card:Card={}):number{
 const ix=CATEGORIES.indexOf(category),c=counts(dice),sum=total(dice);if(ix<6)return c[ix]*(ix+1);
 const joker=isFive(dice)&&card.five!==undefined&&card[CATEGORIES[dice[0]-1]]!==undefined;
 switch(category){case 'three':return Math.max(...c)>=3?sum:0;case 'four':return Math.max(...c)>=4?sum:0;case 'house':return joker||(c.includes(2)&&c.includes(3))?25:0;case 'small':return joker||[1,2,3].some(start=>[0,1,2,3].every(i=>dice.includes(start+i)))?30:0;case 'large':return joker||[1,2].some(start=>[0,1,2,3,4].every(i=>dice.includes(start+i)))?40:0;case 'five':return isFive(dice)?50:0;case 'chance':return sum;default:return 0;}
}
export function applyDiceEvent(data:DiceData,event:DiceEvent,random:()=>number=Math.random):DiceData {
 if(event.kind==='start')return {...data,avatar:normalizeGearAvatar(event.avatar),run:{dice:[1,1,1,1,1],held:[false,false,false,false,false],rolls:0,card:{},bonus:0,mode:event.mode,checked:false,assisted:false,tries:0,finished:false,message:'Roll the dice to begin.',last:'',revision:0}};
 if(event.kind==='clear')return {...data,run:null};const r=data.run;if(!r||r.finished)return data;
 if(event.kind==='roll'){
  if(r.rolls>=3||r.held.every(Boolean))return data;
  return {...data,run:{...r,dice:r.dice.map((v,i)=>r.held[i]?v:1+Math.min(5,Math.max(0,Math.floor(random()*6)))),rolls:r.rolls+1,checked:false,assisted:false,tries:0,message:'Hold dice, roll again, or check your math to score.',revision:r.revision+1}};
 }
 if(event.kind==='hold'){if(!r.rolls||r.rolls>=3||!Number.isInteger(event.index)||event.index<0||event.index>4)return data;return {...data,run:{...r,held:r.held.map((v,i)=>i===event.index?!v:v)}};}
 if(event.kind==='check'){
  if(!r.rolls||r.checked)return data;
  const {right,sumOK}=mathRight(r,String(event.sum??''),String(event.group??''));
  const hint=r.mode==='fractions'?'Try again: count the matching dice. That count goes on top, and the 5 dice go on the bottom.':r.mode==='ratios'?'Try again: count the even dice (2, 4, 6), then the odd dice (1, 3, 5), and write even : odd.':!sumOK?'Try adding the five dice again. You can use Show the steps for help.':'Try the equal-groups fact again. Count how many matching dice you have.';
  return {...data,attempts:data.attempts+1,correct:data.correct+Number(right),run:{...r,tries:r.tries+1,checked:right,message:right?'Correct! Choose an open category to record this turn.':hint}};
 }
 if(event.kind==='reveal'){if(!r.rolls||r.checked)return data;return {...data,run:{...r,assisted:true,checked:true,message:'Steps shown. Choose a score, then try the next turn on your own.'}};}
 if(event.kind==='score'){
  if(!r.rolls||!r.checked||!allowedCategories(r).includes(event.category))return data;
  const points=scoreFor(r.dice,event.category,r.card),extra=isFive(r.dice)&&r.card.five===50?100:0;
  const card={...r.card,[event.category]:points},bonus=r.bonus+extra,finished=Object.keys(card).length===13;
  const last=`${LABELS[event.category]}: ${points} points${extra?' + 100 five-of-a-kind bonus':''}.`;
  return {...data,best:finished?Math.max(data.best,totals(card,bonus).total):data.best,games:data.games+Number(finished),run:{...r,card,bonus,finished,last,dice:finished?r.dice:[1,1,1,1,1],held:[false,false,false,false,false],rolls:finished?r.rolls:0,checked:finished,assisted:false,tries:0,message:finished?'Scorecard complete!':'Next turn: roll five dice.'}};
 }
 return data;
}
/** Accept only complete valid run shapes; legacy saves keep their existing progress. */
export function parseDiceData(raw:unknown):DiceData{
 const x=(raw&&typeof raw==='object'?raw:{}) as Partial<DiceData>;const num=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
 const data:DiceData={avatar:normalizeGearAvatar(x.avatar),best:num(x.best),games:num(x.games),attempts:num(x.attempts),correct:Math.min(num(x.correct),num(x.attempts)),run:null};
 const r=x.run;if(!r||!Array.isArray(r.dice)||r.dice.length!==5||!r.dice.every(d=>Number.isInteger(d)&&d>=1&&d<=6)||!Array.isArray(r.held)||r.held.length!==5||!r.held.every(h=>typeof h==='boolean')||!Number.isInteger(r.rolls)||r.rolls<0||r.rolls>3||!r.card||typeof r.card!=='object'||!MODES.includes(r.mode))return data;
 const caps=[5,10,15,20,25,30,30,30,25,30,40,50,30];const card:Card={};for(const [key,v] of Object.entries(r.card)){const i=CATEGORIES.indexOf(key as Category);if(i<0||!Number.isInteger(v)||v<0||v>caps[i])return data;card[key as Category]=v;}
 data.run={dice:[...r.dice],held:[...r.held],rolls:r.rolls,card,bonus:Math.min(1200,Math.floor(num(r.bonus)/100)*100),mode:r.mode,checked:!!r.checked&&r.rolls>0,assisted:!!r.assisted,tries:num(r.tries),finished:Object.keys(card).length===13,message:typeof r.message==='string'?r.message.slice(0,300):'',last:typeof r.last==='string'?r.last.slice(0,200):'',revision:num(r.revision)};return data;
}
