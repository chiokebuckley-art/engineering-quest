import {decisions} from './advanced-content.js';
import {advancedQuestion} from './advanced-engine.js';
export const KEY='forex-quest.v1';
export const round=(x,d=2)=>Number(x.toFixed(d));
export function fresh(){return {version:1,records:{},notebook:{},lessons:[],journal:[],exams:{},labs:{},reviewHistory:[]};}
const knownSkills=new Set(['quote','inverse','pip','spread','risk','margin','returns','surprise','forward','expectancy','stress','optionpayoff','imbalance','rmse','portfolio',...Object.keys(decisions)]);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export function valid(s){
 if(!object(s)||s.version!==1||!object(s.records)||!object(s.notebook)||!Array.isArray(s.lessons)||!Array.isArray(s.journal))return false;
 if(!Object.entries(s.records).every(([k,r])=>knownSkills.has(k)&&object(r)&&Array.isArray(r.history)&&r.history.length<=12&&r.history.every(x=>typeof x==='boolean')&&Array.isArray(r.examples)&&r.examples.length<=100&&r.examples.every(x=>typeof x==='string')&&Number.isFinite(r.due)))return false;
 if(!Object.entries(s.notebook).every(([k,q])=>object(q)&&knownSkills.has(q.skill)&&q.id===k&&typeof q.prompt==='string'&&typeof q.explanation==='string'&&Number.isFinite(q.answer)&&(!q.choices||(Array.isArray(q.choices)&&q.choices.length===3&&q.choices.every(x=>typeof x==='string')&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<3))&&(q.clean===undefined||(Number.isInteger(q.clean)&&q.clean>=0&&q.clean<3))&&(q.due===undefined||Number.isFinite(q.due))))return false;
 if(!s.lessons.every(x=>typeof x==='string')||s.lessons.length>100||s.journal.length>100||!s.journal.every(x=>object(x)&&typeof x.summary==='string'))return false;
 if(s.exams!==undefined&&(!object(s.exams)||!Object.values(s.exams).every(x=>object(x)&&typeof x.passed==='boolean'&&Number.isFinite(x.best))))return false;
 if(s.labs!==undefined&&(!object(s.labs)||!Object.values(s.labs).every(x=>typeof x==='boolean'||Number.isFinite(x))))return false;
 if(s.reviewHistory!==undefined&&(!Array.isArray(s.reviewHistory)||s.reviewHistory.length>200))return false;
 return true;
}
export function mastery(r){if(!r?.history.length)return 0;let weights=0,hits=0;r.history.forEach((x,i)=>{const w=.85**(r.history.length-1-i);weights+=w;hits+=w*Number(x);});return Math.round(hits/weights*Math.min(100,40+r.examples.length*10,r.history.length*15));}
export function record(s,q,correct,now=Date.now()) {
 const next=structuredClone(s),r=next.records[q.skill]??{history:[],examples:[],due:0,step:0};
 r.history=[...r.history,correct].slice(-12);r.examples=[...new Set([...r.examples,q.id])].slice(-100);
 const ladder=[600000,86400000,3*86400000,7*86400000,14*86400000,30*86400000,60*86400000];
 r.step=correct?Math.min(6,(r.step??0)+(mastery(r)>=70?1:0)):Math.max(0,(r.step??0)-2);
 r.due=now+(correct?ladder[r.step]:600000);next.records[q.skill]=r;
 if(!correct){const old=next.notebook[q.id];next.notebook[q.id]={...q,clean:0,due:now,lapses:(old?.lapses??0)+1};}
 return next;
}
export function repairResult(s,id,clean,now=Date.now()){
 const n=structuredClone(s),card=n.notebook[id];if(!card)return n;
 if(!clean){card.clean=0;card.due=now;return n;}
 if(now<(card.due??0))return n;
 card.clean=(card.clean??0)+1;
 if(card.clean>=3){delete n.notebook[id];n.reviewHistory=[...(n.reviewHistory??[]),{id,at:now}].slice(-200);}
 else card.due=now+(card.clean===1?3:7)*86400000;
 return n;
}
export function variations(q,random=Math.random){const out=[q];let tries=0;while(out.length<4&&tries++<1000){const next=question(q.skill,random);if(!out.some(x=>x.id===next.id))out.push(next);}return out;}
export function migrate(s){if(!valid(s))throw Error('Invalid progress');return {...fresh(),...s,exams:s.exams??{},labs:s.labs??{},reviewHistory:s.reviewHistory??[]};}
export function grade(q,raw){if(String(raw).trim()==='')return false;const value=Number(raw);if(q.choices)return Number.isInteger(value)&&value===q.answer;return Number.isFinite(value)&&Math.abs(value-q.answer)<(q.tolerance??.011);}
export function rng(seed){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
export function question(skill,random=Math.random){const advanced=advancedQuestion(skill,random);if(advanced)return advanced;const pick=a=>a[Math.floor(random()*a.length)];const units=pick([1000,2000,5000,10000,20000]);const rate=pick([1.05,1.08,1.1,1.12,1.2,1.25]);let prompt,answer,explanation;
if(skill==='quote'){prompt=`EUR/USD is ${rate.toFixed(4)}. How many USD buy €${units.toLocaleString('en-US')}? Ignore costs.`;answer=round(units*rate);explanation=`The quote is USD per EUR. ${units} EUR × ${rate} USD/EUR = ${answer} USD.`;}
if(skill==='inverse'){const usd=round(units*rate);prompt=`EUR/USD is ${rate.toFixed(4)}. Convert $${usd.toLocaleString('en-US')} to euros, ignoring costs.`;answer=units;explanation=`Divide dollars by dollars per euro: ${usd} ÷ ${rate} = ${units} EUR.`;}
if(skill==='pip'){const pips=pick([2,5,8,12,20,35,50]);prompt=`EUR/USD rises from ${rate.toFixed(4)} to ${(rate+pips*.0001).toFixed(4)}. How many pips is that?`;answer=pips;explanation=`For EUR/USD one pip = 0.0001. (New rate − old rate) ÷ 0.0001 = ${pips}. Fractional-pip quotes also exist.`;}
if(skill==='spread'){const spread=pick([1,2,3,4,5]);prompt=`Buy ${units} EUR at ask ${rate.toFixed(4)}, then immediately sell at bid ${(rate-spread*.0001).toFixed(4)}. What is the USD loss, entered as a positive number?`;answer=round(units*spread*.0001);explanation=`Buy at ask, sell at bid. ${units} × ${spread} × 0.0001 = $${answer} lost to spread. No other fees in this exercise.`;}
if(skill==='risk'){const equity=pick([1000,2500,5000,10000]);const stop=pick([10,20,25,40,50]);const budget=equity*.01;prompt=`Exercise rule: risk at most 1% of $${equity}. EUR/USD stop distance is ${stop} pips from entry fill. Ignoring costs and gaps, what maximum whole number of EUR units fits?`;answer=Math.floor(budget/(stop*.0001)+1e-8);explanation=`Budget = ${equity} × 0.01 = $${budget}. Each EUR unit risks ${stop} × 0.0001 USD. Units = floor(${budget} ÷ ${stop*.0001}) = ${answer}. Stops do not guarantee this loss limit.`;}
if(skill==='margin'){const leverage=pick([10,20,25]);prompt=`At an illustrative ${leverage}:1 leverage limit, how much USD initial margin supports ${units} EUR at EUR/USD ${rate.toFixed(4)}?`;answer=round(units*rate/leverage);explanation=`USD notional = ${units} × ${rate}. Margin = notional ÷ ${leverage} = $${answer}. This is collateral, not maximum possible loss. Broker rules vary.`;}
if(answer===undefined)throw Error('Unknown skill');return {skill,prompt,answer,explanation,id:skill+':'+prompt};}
export function chooseSkill(records,skills,now=Date.now()){return [...skills].sort((a,b)=>{const score=id=>mastery(records[id])-(records[id]?.due<=now?25:0);return score(a)-score(b);})[0];}
// EUR/USD only, USD account. Synthetic quote ticks; no inference of intratick prices.
export const tape=[1.1000,1.1006,1.1002,1.1010,1.1005,1.0998,1.0980,1.0975,1.0982,1.0993,1.1001,1.1008];
export const scenarios={harbor:{name:'Harbor liquidity gap',description:'A quiet market meets a widening spread.',prices:tape},trend:{name:'Policy repricing',description:'Directional pressure with a reversal; synthetic, not a historical reconstruction.',prices:[1.1,1.1008,1.1012,1.1006,1.102,1.1031,1.1025,1.104,1.1037,1.1029,1.1018,1.1025]},range:{name:'Range and whipsaw',description:'Alternating moves challenge a directional narrative.',prices:[1.1,1.1008,1.0994,1.1009,1.0992,1.101,1.0988,1.1005,1.099,1.1007,1.0996,1.1]}};
export function desk(scenario='harbor'){if(!scenarios[scenario])throw Error('Unknown scenario');return {balance:10000,tick:0,position:null,logs:[],finished:false,scenario};}
export function quoteAt(tick,scenario='harbor'){const mid=scenarios[scenario].prices[tick];const spread=tick===6&&scenario==='harbor'?.0012:.0002;return {bid:round(mid-spread/2,5),ask:round(mid+spread/2,5)};}
export function pnl(p,q){return p?round(p.units*(p.side==='buy'?q.bid-p.entry:p.entry-q.ask)):0;}
export function openTrade(d,{side,units,stopPips,reason}){if(d.finished||d.position)throw Error('Finish the open position or start a new scenario.');if(!['buy','sell'].includes(side)||!Number.isInteger(units)||units<=0||units>1000000||!Number.isFinite(stopPips)||stopPips<1||stopPips>1000||typeof reason!=='string'||reason.trim().length<10)throw Error('Enter positive whole units, a stop of 1–1000 pips, and a plan of at least 10 characters.');const q=quoteAt(d.tick,d.scenario),entry=side==='buy'?q.ask:q.bid;const margin=units*entry/20;if(margin>d.balance)throw Error('Insufficient initial margin under this scenario’s 20:1 rule.');const planned=units*stopPips*.0001;if(planned>d.balance*.01+.00001)throw Error('This training desk limits planned stop risk to 1% of balance. Reduce units.');const p={side,units,entry,stop:entry+(side==='buy'?-1:1)*stopPips*.0001,margin,reason:reason.trim(),planned};return {...d,position:p};}
export function closeTrade(d,why='Manual close'){if(!d.position)return d;const profit=pnl(d.position,quoteAt(d.tick,d.scenario));return {...d,balance:round(d.balance+profit),position:null,logs:[...d.logs,{summary:`${why}: ${d.position.side} ${d.position.units} EUR. P/L $${profit.toFixed(2)}. Planned stop risk $${d.position.planned.toFixed(2)}. Plan: ${d.position.reason}`,profit}]};}
export function advance(d){if(d.finished)return d;let n={...d,tick:Math.min(tape.length-1,d.tick+1)};const p=n.position,q=quoteAt(n.tick,n.scenario);if(p){const equity=n.balance+pnl(p,q);if(equity<=p.margin*.5)n=closeTrade(n,'Illustrative margin liquidation');else if(p.side==='buy'?q.bid<=p.stop:q.ask>=p.stop)n=closeTrade(n,'Stop filled at next available quote (may gap)');}if(n.tick===tape.length-1){n=closeTrade(n,'Scenario end');n.finished=true;}return n;}
