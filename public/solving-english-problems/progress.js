// Read-only views of the three modules' browser saves, plus a whole-app backup bundle.
// Everything takes a Storage-like object so tests can pass a plain map. Nothing here is a grade or
// a certified level: these are the same game counters the modules show, gathered in one place.
export const KEYS={
 learner:'sep.learner.v1',
 sf:'sentence-forge.save.v1',
 lq:'linguistics-quest.family.v1',
 wrRegistry:'wordraiders.players.v1',
 wrLegacy:'wordraiders.expedition.v2',
 wrSave:'wordraiders.save.',
};
const read=(storage,key)=>{try{const raw=storage.getItem(key);return raw?JSON.parse(raw):null;}catch{return null;}};
const num=v=>Number.isFinite(Number(v))?Number(v):0;
export const SF_TOTALS={orders:93,districts:9,stories:24,little:2,lessons:9};
export const SF_DISTRICT_ORDERS={core:12,identify:9,relation:13,verbs:9,connect:10,precision:16,reference:8,paragraph:8,evidence:8};
export const LQ_TOTALS={lessons:108,meanings:294,academy:3000,gradeLessons:[7,10,17,15,9,11,13,6,3,6,3,6,2]};
export const WR_TOTALS={stars:135,crystals:45,chapters:9,academyLessons:24,academyUnits:5};
const districtOf=id=>id==='jar-paragraph'?'paragraph':String(id).split('-')[0];

export function readSentenceForge(storage,now=Date.now()){
 const save=read(storage,KEYS.sf);if(!save||!Array.isArray(save.profiles))return {found:false};
 const p=save.profiles.find(x=>x.id===save.active)||save.profiles[0];if(!p)return {found:false};
 const completed=Array.isArray(p.completed)?p.completed:[],notebook=Array.isArray(p.notebook)?p.notebook:[],trail=p.trail||{};
 const districtDone={};for(const d of Object.keys(SF_DISTRICT_ORDERS))districtDone[d]=completed.filter(id=>districtOf(id)===d).length;
 const passed=Array.isArray(trail.passed)?trail.passed:[];
 let highestGrade=1;while(highestGrade<12&&[1,2].every(n=>passed.includes(`trail-${highestGrade}-${n}`)))highestGrade++;
 return {found:true,profileName:p.name,profiles:save.profiles.map(x=>x.name),xp:num(p.xp),ordersDone:completed.length,districtDone,
  wings:Object.values(districtDone).filter(n=>n>=3).length,lessons:Array.isArray(p.lessons)?p.lessons:[],
  repairsOpen:notebook.filter(e=>!e.clearedAt).length,repairsDue:notebook.filter(e=>!e.clearedAt&&num(e.dueAt)<=now).length,
  dogsHelped:Array.isArray(trail.rescued)?trail.rescued.length:0,storiesPassed:passed.length,highestGrade,
  littleStars:Array.isArray(trail.little)?trail.little.length:0,rallyStories:Object.keys(trail.bests||{}).length,arcadeBests:Object.keys(p.bests||{}).length};
}
export function readLinguisticsQuest(storage,now=Date.now()){
 const save=read(storage,KEYS.lq);if(!save||!Array.isArray(save.profiles))return {found:false};
 const p=save.profiles.find(x=>x.id===save.active)||save.profiles[0];if(!p)return {found:false};
 const course=p.course||{},passed=Object.keys(course.passed||{}),records=p.records&&typeof p.records==='object'?p.records:{};
 const perGrade=LQ_TOTALS.gradeLessons.map((total,g)=>passed.filter(id=>id.startsWith(`g${g}.`)).length>=total);
 let gradesComplete=0;while(gradesComplete<perGrade.length&&perGrade[gradesComplete])gradesComplete++;
 const entries=Object.entries(records);
 return {found:true,profileName:p.name,profiles:save.profiles.map(x=>x.name),level:num(p.level),xp:num(p.xp),courseConfigured:course.configured===true,target:num(course.target),
  lessonsPassed:passed.length,gradesComplete,meaningsPracticed:entries.filter(([k])=>!k.startsWith('academy.')).length,
  reviewsDue:entries.filter(([,r])=>r&&(r.repair||num(r.due)<=now)).length,repairs:entries.filter(([,r])=>r&&r.repair).length,
  academyScenes:Object.keys(p.academy?.completed||{}).length,academyResume:p.academy?.checkpoint?.index??null,
  trailBadges:Array.isArray(p.completed)?p.completed:[],customCards:Array.isArray(p.custom)?p.custom.length:0};
}
export function readWordRaiders(storage,now=Date.now()){
 const reg=read(storage,KEYS.wrRegistry);let save=null,profileName='',profiles=[];
 if(reg&&Array.isArray(reg.profiles)&&reg.profiles.length){profiles=reg.profiles.map(x=>x.name);const active=reg.profiles.find(x=>x.id===reg.active)||reg.profiles[0];save=read(storage,KEYS.wrSave+active.id);profileName=active.name;}
 if(!save){save=read(storage,KEYS.wrLegacy);if(save)profileName=save.name||'Explorer';}
 if(!save||typeof save!=='object')return {found:false};
 const stars=Object.values(save.quest?.stars||{}).reduce((a,b)=>a+num(b),0),academy=save.academy||{},lessons=academy.lessons||{};
 const academyPassed=Object.values(lessons).filter(l=>num(l?.star)>=1).length;
 const cards=Object.values(save.study?.cards||{});
 return {found:true,profileName,profiles,xp:num(save.xp),chapter:Math.min(WR_TOTALS.chapters,num(save.quest?.chapter))+1,stars,bossWins:num(save.quest?.bossWins),
  raidStreak:num(save.quest?.raidStreak),raidsDone:num(save.quest?.raidsDone),endingSeen:save.quest?.endingSeen===true,collected:Array.isArray(save.collected)?save.collected.length:0,
  mastered:Object.values(save.memory||{}).filter(m=>m?.status==='MASTERED').length,academyLessons:academyPassed,academyUnit:num(academy.unit),academyTests:num(academy.tests),
  academyComplete:num(academy.tests)>=WR_TOTALS.academyUnits,studySessions:num(save.study?.sessions),studyDue:cards.filter(c=>num(c?.due)<=now).length,arcadeRuns:num(save.arcade?.runs)};
}
export function readLearner(storage){
 const l=read(storage,KEYS.learner);
 if(!l||l.version!==1)return {version:1,name:'',audience:'',exam:null,plan:null,manual:{},lastVisited:null};
 return {version:1,name:typeof l.name==='string'?l.name.slice(0,30):'',audience:['child','student','adult'].includes(l.audience)?l.audience:'',exam:l.exam&&typeof l.exam==='object'?l.exam:null,plan:l.plan&&typeof l.plan==='object'&&Array.isArray(l.plan.steps)?l.plan:null,manual:l.manual&&typeof l.manual==='object'?l.manual:{},lastVisited:l.lastVisited&&typeof l.lastVisited==='object'?l.lastVisited:null};
}
export function readAll(storage,now=Date.now()){return {learner:readLearner(storage),sf:readSentenceForge(storage,now),lq:readLinguisticsQuest(storage,now),wr:readWordRaiders(storage,now)};}
/** Reviews due right now across all three worlds. */
export function dueSummary(all){return {sf:all.sf.found?all.sf.repairsDue:0,lq:all.lq.found?all.lq.reviewsDue:0,wr:all.wr.found?all.wr.studyDue:0};}

/* ---------------------------------------------------------------- one backup for everything */
export const BACKUP_FORMAT='solving-english-problems-backup';
const ownKey=k=>k===KEYS.learner||k===KEYS.sf||k===KEYS.lq||k===KEYS.wrRegistry||k===KEYS.wrLegacy||k.startsWith(KEYS.wrSave);
export function exportBundle(storage,now=Date.now()){
 const saves={};
 for(let i=0;i<storage.length;i++){const k=storage.key(i);if(ownKey(k)){const v=storage.getItem(k);if(typeof v==='string')saves[k]=v;}}
 return {format:BACKUP_FORMAT,version:1,exportedAt:new Date(now).toISOString(),saves};
}
export function validateBundle(data){
 if(!data||data.format!==BACKUP_FORMAT||data.version!==1||!data.saves||typeof data.saves!=='object'||Array.isArray(data.saves))throw Error('This is not a Solving English Problems backup.');
 const keys=Object.keys(data.saves);if(!keys.length||keys.length>200)throw Error('The backup is empty or too large.');
 for(const k of keys){if(!ownKey(k)||typeof data.saves[k]!=='string'||data.saves[k].length>8e6)throw Error(`The backup holds an unexpected entry: ${k}`);try{const v=JSON.parse(data.saves[k]);if(!v||typeof v!=='object')throw 0;}catch{throw Error(`The saved data for ${k} is not readable.`);}}
 return data;
}
/** Restores every key in a validated bundle, replacing the same keys on this device. Returns the keys written. */
export function importBundle(storage,data){const b=validateBundle(data);for(const [k,v] of Object.entries(b.saves))storage.setItem(k,v);return Object.keys(b.saves);}
