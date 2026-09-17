export const SAVE_KEY='linguistics-quest.family.v1';
export const DAY=86400000;
export const STAGES=[{id:1,name:'First steps',age:'K–2 · read aloud',icon:'🐾'},{id:2,name:'Explorer',age:'Grades 3–5',icon:'🌱'},{id:3,name:'Investigator',age:'Grades 6–8',icon:'🔎'},{id:4,name:'Scholar',age:'Grades 9–12',icon:'🔭'},{id:5,name:'Adult rebuild',age:'All foundations + reference',icon:'🧭'}];
export const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const newProfile=(name='Explorer',level=1)=>({id:uid(),name:name.trim().slice(0,30)||'Explorer',level:Number(level),xp:0,records:{},custom:[],completed:[],speech:false,created:Date.now()});
export const freshSave=()=>{let p=newProfile();return {version:1,active:p.id,profiles:[p]};};
export function validateSave(s){
 if(!s||s.version!==1||!Array.isArray(s.profiles)||s.profiles.length<1||s.profiles.length>30)throw Error('This is not a Linguistics Quest family save.');
 const ids=new Set();for(const p of s.profiles){
 if(!p||typeof p.id!=='string'||ids.has(p.id)||!p.id||typeof p.name!=='string'||p.name.length>30||!Number.isInteger(p.level)||p.level<1||p.level>5||!Number.isFinite(p.xp)||p.xp<0||!p.records||Array.isArray(p.records)||!Array.isArray(p.custom)||p.custom.length>2000||!Array.isArray(p.completed))throw Error('The save has an invalid profile.');
 if(p.academy!==undefined){const a=p.academy;if(!a||a.version!==1||!a.completed||typeof a.completed!=='object'||Array.isArray(a.completed)||Object.keys(a.completed).length>3000)throw Error('Invalid academy progress.');for(const [id,date] of Object.entries(a.completed)){if(!/^a(?:0|[1-9]\d*)$/.test(id)||Number(id.slice(1))>=3000||!Number.isFinite(date)||date<0)throw Error('Invalid academy scene completion.');}if(a.checkpoint!==null){const w=a.checkpoint;if(!w||!Number.isInteger(w.index)||w.index<0||w.index>=3000||!['learn','guided','picture','meaning','done'].includes(w.phase)||(w.feedback!==null&&(!w.feedback||typeof w.feedback.correct!=='boolean')))throw Error('Invalid academy checkpoint.');}}
 if(p.course!==undefined){const c=p.course;if(!c||c.version!==1||typeof c.configured!=='boolean'||!Number.isInteger(c.target)||c.target<0||c.target>12||!c.passed||Array.isArray(c.passed)||!c.work||Array.isArray(c.work))throw Error('Invalid course progress.');for(const [id,w] of Object.entries(c.work)){if(!/^g\d+\.[a-z]+\.\d+$/.test(id)||!w||!Number.isInteger(w.item)||w.item<0||w.item>3||!['teach','guided','check'].includes(w.phase)||!Number.isInteger(w.step)||w.step<0||w.step>2||![0,1].includes(w.checks)||w.feedback&&typeof w.feedback.correct!=='boolean')throw Error('Invalid lesson checkpoint.');}for(const [id,v] of Object.entries(c.passed)){if(!/^g\d+\.[a-z]+\.\d+$/.test(id)||!v||!Number.isFinite(v.at))throw Error('Invalid lesson completion.');}}
 ids.add(p.id);for(const [id,r] of Object.entries(p.records)){if(['__proto__','constructor','prototype'].includes(id)||!r||!['attempts','correct','streak','due','last','lapses'].every(k=>Number.isFinite(r[k])&&r[k]>=0)||!Array.isArray(r.days)||!r.days.every(d=>typeof d==='string')||!Array.isArray(r.forms)||!r.forms.every(f=>['meaning','context','recall'].includes(f)))throw Error('The save has an invalid learning record.');}
 for(const e of p.custom){if(!e||typeof e.id!=='string'||!e.id.startsWith('wn.')||typeof e.term!=='string'||typeof e.meaning!=='string'||!Array.isArray(e.examples)||!e.examples.every(x=>typeof x==='string')||typeof e.trap!=='string')throw Error('The save has an invalid study card.');}
 }if(!ids.has(s.active))throw Error('The active profile is missing.');return JSON.parse(JSON.stringify(s));
}
export function loadSave(storage){try{const raw=storage.getItem(SAVE_KEY);return raw?{save:validateSave(JSON.parse(raw)),error:null}:{save:freshSave(),error:null};}catch{return {save:freshSave(),error:'Your saved data could not be read. It has not been overwritten. Export a backup before choosing to save this new session.'};}}
export const blankRecord=()=>({attempts:0,correct:0,streak:0,days:[],forms:[],due:0,last:0,lapses:0,repair:false});
export function recordAnswer(previous,{correct,form,confidence='unsure',hint=false,now=Date.now()}){
 const r={...blankRecord(),...previous,days:[...(previous?.days||[])],forms:[...(previous?.forms||[])]};
 r.attempts++;r.last=now;const clean=correct&&!hint;const day=new Date(now).toISOString().slice(0,10);
 if(clean){r.correct++;r.streak++;if(!r.days.includes(day))r.days.push(day);if(!r.forms.includes(form))r.forms.push(form);if(r.streak>=2)r.repair=false;const intervals=[1,3,7,14,30,60];r.due=now+intervals[Math.min(r.days.length-1,5)]*DAY;}
 else{r.streak=0;r.lapses++;r.repair=true;r.due=now+10*60000;r.days=[];r.forms=[];}
 r.overconfident=(!correct&&confidence==='sure')||Boolean(r.overconfident&&r.repair);return r;
}
export function mastery(r,entry,now=Date.now()){
 if(!r?.attempts)return {label:'New',score:0,retained:false};
 if(r.repair)return {label:'Repair',score:10,retained:false};
 const forms=['meaning',...(entry.kind==='symbol'?[]:['recall']),...(entry.examples?.length?['context']:[])];
 const qualified=r.streak>=4&&r.days.length>=3&&forms.every(f=>r.forms.includes(f));
 const retained=qualified&&now<=r.due;return {label:qualified?(retained?'Retained':'Review due'):r.streak>=2?'Growing':'Learning',score:qualified?100:Math.min(85,15+r.days.length*15+r.forms.length*10+Math.min(r.streak,4)*5),retained};
}
export function shuffle(list,rng=Math.random){const a=[...list];for(let i=a.length-1;i>0;i--){let j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function buildQuestion(entry,pool,form='meaning',variant=0,rng=Math.random){
 if(form==='context'&&!entry.examples?.length)form='meaning';
 const q={id:entry.id,entry,form,prompt:form==='context'?`What does “${entry.term}” mean in this example?`:form==='recall'?'Which word, word part, or symbol matches this meaning?':`What does “${entry.term}” mean in this use?`,example:form==='recall'?null:entry.examples?.length?entry.examples[(form==='context'?1+variant:0)%entry.examples.length]:null,answer:form==='recall'?entry.term:entry.meaning};
 if(form!=='recall'){
 const same=pool.filter(e=>e.id!==entry.id&&e.world===entry.world&&e.meaning!==entry.meaning&&(entry.examples?.length||e.term!==entry.term));
 const other=pool.filter(e=>e.id!==entry.id&&e.world!==entry.world&&e.meaning!==entry.meaning&&(entry.examples?.length||e.term!==entry.term));
 const distractors=[...new Set([...shuffle(same,rng),...shuffle(other,rng)].map(e=>e.meaning))].slice(0,3);q.choices=shuffle([entry.meaning,...distractors],rng);
 }return q;
}
export function correctAnswer(q,value){
 if(q.form!=='recall')return value===q.answer;
 const norm=s=>String(s).normalize('NFC').toLowerCase().trim().replace(/[“”]/g,'"').replace(/’/g,"'").replace(/\s+/g,' ');
 if(norm(value)===norm(q.answer))return true;
 const aliases={'−':['-'],'×':['*','x'],'÷':['/'],'≠':['!='],'≤':['<='],'≥':['>='],'≈':['~='],'π':['pi'],'∞':['infinity'],'∅':['empty set'],'∑':['sigma','sum'],'√':['sqrt'],'|x|':['absolute value'],'“ ”':['" "','quotation marks'],'( )':['()','parentheses'],'[ ]':['[]','brackets'],'° C':['°c','celsius'],'° F':['°f','fahrenheit']};
 return (aliases[q.answer]||[]).some(x=>norm(value)===norm(x));
}
export function pickEntries(entries,profile,{world=null,review=false,limit=8,now=Date.now()}={}){
 let pool=entries.filter(e=>(profile.level===5||e.level<=profile.level)&&(!world||e.world===world));
 if(review)pool=pool.filter(e=>profile.records[e.id]?.repair||(profile.records[e.id]?.due||Infinity)<=now);
 return shuffle(pool).sort((a,b)=>{
 const priority=e=>{const r=profile.records[e.id];return r?.repair?0:r&&r.due<=now?1:!r?2:3;};return priority(a)-priority(b);
 }).slice(0,limit);
}
export const FORM_CYCLE=['meaning','context','recall'];
