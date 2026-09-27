import {USES,OBJECTS,sceneAt} from './content.js';
import {sentence,sceneIndex,TRANSFER} from './arcade-bank.js';
export const LANES=['Place words','Path words','Word pointers','Connections','Groups & amounts','Time & relationships','Mixed','Journey drills','Spiral review'];
export const MODES=['Practice','Blitz','Speed','Conquer'];
const kinds=['picture','meaning','odd','swap','recall'];
export const freshArcade=()=>({version:1,uses:{},bests:{},crowns:{},checks:{},conquer:{},speed:20});
export const state=p=>{p.academy||={version:1,completed:{},checkpoint:null};return p.academy.arcade||(p.academy.arcade=freshArcade());};
export const useState=(p,id)=>state(p).uses[id]||(state(p).uses[id]={cursor:0,evidence:{},recent:[]});
export function validateArcade(raw){
 if(raw===undefined)return freshArcade();
 if(!raw||raw.version!==1||typeof raw.uses!=='object'||!raw.uses||Array.isArray(raw.uses))throw Error('Invalid Arcade save.');
 const out=freshArcade();out.speed=Math.max(6,Math.min(20,Number(raw.speed)||20));
 for(const u of USES){const r=raw.uses[u.id];if(!r)continue;if(!Number.isSafeInteger(r.cursor)||r.cursor<0||!r.evidence||typeof r.evidence!=='object'||Array.isArray(r.evidence))throw Error('Invalid Arcade evidence.');const evidence={};for(const [key,v] of Object.entries(r.evidence)){if(!/^(picture|meaning|odd|swap|recall|transfer)\.(\d|[1-4]\d)\.[0-5]$/.test(key)||!Array.isArray(v)||v.length!==2||!Number.isFinite(v[0])||v[0]<0||![0,1].includes(v[1]))throw Error('Invalid Arcade answer.');evidence[key]=v;}
  if(Object.keys(evidence).length>1600)throw Error('Too many Arcade answers.');
  const recent=Array.isArray(r.recent)?r.recent.filter(v=>Array.isArray(v)&&Object.hasOwn(evidence,v[0])&&Number.isFinite(v[1])&&[0,1].includes(v[2])).slice(-20):[];
  out.uses[u.id]={cursor:r.cursor,evidence,recent};
 }
 for(const key of ['bests','crowns','checks','conquer']){const values=raw[key]||{};if(typeof values!=='object'||Array.isArray(values)||Object.keys(values).length>500)throw Error('Invalid Arcade results.');for(const [id,v] of Object.entries(values)){if(!/^[a-zA-Z0-9:-]{1,90}$/.test(id)||!v||typeof v!=='object'||!Number.isFinite(v.at)||v.at<0)throw Error('Invalid Arcade result.');if(key==='conquer'){if(!Array.isArray(v.cleared)||v.cleared.some(n=>!Number.isInteger(n)||n<0||n>=50))throw Error('Invalid Conquer set.');out[key][id]={at:v.at,cleared:[...new Set(v.cleared)],elapsed:Math.max(0,Number(v.elapsed)||0)};}else out[key][id]={at:v.at,score:Math.max(0,Number(v.score)||0),total:Math.max(0,Number(v.total)||0),seconds:Math.max(0,Number(v.seconds)||0),pass:v.pass===true};}}
 return out;
}
export function mergeArcade(a,b){a=validateArcade(a);b=validateArcade(b);const out=freshArcade();out.speed=Math.min(a.speed,b.speed);
 for(const u of USES){const x=a.uses[u.id],y=b.uses[u.id];if(!x&&!y)continue;if(!x||!y){out.uses[u.id]=structuredClone(x||y);continue;}const evidence={...x.evidence};for(const [key,v] of Object.entries(y.evidence))if(!evidence[key]||v[0]>evidence[key][0]||(v[0]===evidence[key][0]&&v[1]<evidence[key][1]))evidence[key]=v;
 const events=new Map([...x.recent,...y.recent].map(v=>[v[0]+':'+v[1],v]));out.uses[u.id]={cursor:Math.max(x.cursor,y.cursor),evidence,recent:[...events.values()].sort((a,b)=>a[1]-b[1]).slice(-20)};}
 for(const key of ['bests','crowns','checks']){out[key]={...a[key]};for(const [id,v] of Object.entries(b[key])){const old=out[key][id];if(!old||(key==='bests'?v.score>old.score:v.at>old.at))out[key][id]=v;}}
 out.conquer={...a.conquer};for(const [id,v] of Object.entries(b.conquer)){const old=out.conquer[id];out.conquer[id]=old?{at:Math.max(old.at,v.at),cleared:[...new Set([...old.cleared,...v.cleared])],elapsed:Math.max(old.elapsed,v.elapsed)}:v;}
 return validateArcade(out);
}
export function taught(p,index){return !!p.academy?.completed?.['a'+index];}
export function useUnlocked(p,u){return Array.from({length:5},(_,o)=>taught(p,sceneIndex(u,o))).every(Boolean);}
export function unlocked(p,lane,now=Date.now()){
 const allowed=USES.map((u,i)=>i).filter(i=>useUnlocked(p,i));
 if(lane<6)return allowed.filter(i=>USES[i].unit===lane);
 if(lane===7)return USES.map((u,i)=>i).filter(i=>OBJECTS.some(o=>taught(p,sceneIndex(i,o.id))));
 if(lane===8)return allowed.filter(i=>{const r=p.records['academy.'+USES[i].id];const a=state(p).uses[USES[i].id];return r?.repair||r?.due<=now||a?.recent.some(v=>!v[2])||(a&&Math.max(0,...Object.values(a.evidence).map(v=>v[0]))+86400000<=now);});
 return allowed;
}
export function shuffle(items,seed){const a=[...items];let n=seed>>>0;for(let i=a.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function question(u,o,pattern,kind,seed=Date.now()){
 const s=sceneAt(sceneIndex(u,o)),text=sentence(u,o,pattern),key=`${kind}.${o}.${pattern}`;
 const q={id:s.use.id+':'+key,key,u,o,pattern,kind,scene:s,text,explanation:s.use.meaning+' '+s.use.contrast};
 if(kind==='transfer'){const t=TRANSFER[s.use.id][o%2];return {...q,key:`transfer.${o%2}.0`,id:s.use.id+':transfer.'+(o%2)+'.0',prompt:t.prompt,choices:shuffle([{label:t.answer,correct:true},{label:t.wrong,correct:false}],seed)};}
 if(kind==='picture')return {...q,prompt:'Which picture matches this sentence?',choices:shuffle([{draw:s.use.scene,correct:true},{draw:s.use.wrong,correct:false}],seed)};
 if(kind==='meaning'){const match=seed%2===0;return {...q,draw:match?s.use.scene:s.use.wrong,prompt:'Does this picture match the sentence?',choices:shuffle([{label:'Yes, it matches.',correct:match},{label:'No, it shows a different relationship.',correct:!match}],seed)};}
 if(kind==='odd'){const offset=seed%4;return {...q,prompt:'Three pictures match the sentence. Which one does not?',choices:Array.from({length:4},(_,i)=>({draw:i===offset?s.use.wrong:s.use.scene,correct:i===offset}))};}
 if(kind==='swap')return {...q,draw:s.use.wrong,prompt:'The picture below does not match the sentence. Choose the repaired picture.',choices:shuffle([{draw:s.use.scene,correct:true},{draw:s.use.wrong,correct:false}],seed)};
 // Retrieval of a relationship from a sentence, without a visible choice list.
 return {...q,prompt:'Type the small word or phrase for this meaning.',text:'',draw:s.use.scene,recall:true,clue:({ofContents:'container contents',ofPicture:'the thing represented in an image'}[s.use.id]||s.use.use),answer:s.use.word,aliases:({under:['below','beneath','underneath'],below:['under','beneath'],beside:['next to','alongside'],near:['close to'],outside:['out of'],in:['inside'],above:['over']}[s.use.id]||[])};
}
export function nextQuestion(p,lane,serial,{use=null,object=null,assessment=false,kind=null}={}){
 const pool=use===null?unlocked(p,lane):[use];if(!pool.length)return null;
 const u=pool[serial%pool.length],r=useState(p,USES[u].id),count=r.cursor++;
 let o,pat,k;
 if(assessment){const deck=shuffle(Array.from({length:50},(_,i)=>i),8191+u);o=deck[count%50];pat=5;k=kinds[count%kinds.length];}
 else {const size=1252,n=(count*977+u*37)%size;if(n>=1250){o=n-1250;pat=0;k='transfer';}else{o=n%50;pat=Math.floor(n/50)%5;k=kinds[Math.floor(n/250)%5];}}
 if(lane===7){const objs=OBJECTS.filter(o=>taught(p,sceneIndex(u,o.id)));o=objs[count%objs.length].id;if(k==='transfer')k='picture';}
 if(object!==null)o=object;
 if(kind){k=kind;if(object===null&&lane!==7){const v=(count*137)%250;o=kind==='transfer'?count%2:v%50;pat=kind==='transfer'?0:Math.floor(v/50);}}
 return question(u,o,pat,k,Math.floor(Math.random()*2147483647));
}
export function record(p,q,{correct,hinted=false,now=Date.now()}){
 const r=useState(p,USES[q.u].id),clean=correct&&!hinted;r.evidence[q.key]=[now,clean?1:0];r.recent=[...r.recent,[q.key,now,clean?1:0]].slice(-20);return clean;
}
export function mastery(p,u){const a=state(p),r=useState(p,USES[u].id),good=Object.entries(r.evidence).filter(([,v])=>v[1]),objects=new Set(),patterns=new Set(),types=new Set(),days=new Set();
 for(const [key,v] of good){const [kind,o,pattern]=key.split('.');if(kind!=='transfer'){objects.add(Number(o));if(Number(pattern)<5)patterns.add(Number(pattern));types.add(kind);}days.add(new Date(v[0]).toISOString().slice(0,10));}
 const transfers=good.filter(([k])=>k.startsWith('transfer.')).length,check=a.checks[USES[u].id];const recent=r.recent.length===20&&r.recent.every(v=>v[2])&&new Set(r.recent.map(v=>v[0])).size===20;
 const gates=[objects.size===50,patterns.size===5,types.size===5,days.size>=3,transfers>=2,!!check?.pass&&check.score===20&&recent];
 return {objects:objects.size,patterns:patterns.size,types:types.size,days:days.size,transfers,ready:gates.slice(0,5).every(Boolean),mastered:gates.every(Boolean),percent:Math.floor(gates.filter(Boolean).length/6*100),check};
}
