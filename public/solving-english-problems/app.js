// Solving English Problems — the hub. Home, placement exam, plan, study menu, progress, learner backup.
// Hash-routed, no build step. The three worlds keep their own saves; this file only reads them and
// stores the learner record under sep.learner.v1.
import { AREAS } from './exam-content.js';
import { newExam, answer as examAnswer, summarize, progress as examProgress, AUDIENCES, LEVEL_NAMES } from './exam.js';
import { MODULES, GROUPS, catalogFor, buildPlan, stepDone } from './skills.js';
import { readAll, readLearner, KEYS, exportBundle, importBundle, SF_TOTALS, LQ_TOTALS, WR_TOTALS, dueSummary } from './progress.js';

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROUTES=['home','exam','plan','study','progress','learner','about'];
let learner=readLearner(localStorage),route='home',group='',exam=null,storageBlocked=false,toastTimer,wrBase=MODULES.wr.path;
const audienceName=id=>AUDIENCES.find(a=>a.id===id)?.title||'';

function persist(){try{localStorage.setItem(KEYS.learner,JSON.stringify(learner));}catch{storageBlocked=true;toast('Saving is unavailable in this browser. Export a backup from Learner before leaving.');}}
function toast(s){$('#toast').textContent=s;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4200);}
function speak(text){if(!('speechSynthesis'in window)){toast('Read aloud is not available in this browser.');return;}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.85;speechSynthesis.speak(u);}
/** Word Raiders lives inside this folder once built; otherwise use the Command Center / GitHub Pages copy at /wordraiders/. */
async function resolveWordRaiders(){try{const r=await fetch(new URL('wordraiders/index.html',location.href),{method:'HEAD',cache:'no-store'});if(!r.ok)wrBase='/wordraiders/';}catch{wrBase='/wordraiders/';}}
const href=(module,hash='')=>(module==='wr'?wrBase:MODULES[module].path)+hash;
const btn=(text,action,extra='',cls='')=>`<button class="btn ${cls}" data-action="${action}" ${extra}>${text}</button>`;
const open=(module,hash,text='Open →',cls='')=>`<a class="btn ${cls}" href="${esc(href(module,hash))}" data-visit="${module}">${text}</a>`;
const badge=m=>`<span class="badge ${m}">${esc(MODULES[m].name)}</span>`;
const pct=(n,d)=>d?Math.round(100*Math.min(n,d)/d):0;
const meter=(n,d)=>`<div class="meter" role="img" aria-label="${n} of ${d}"><i style="width:${pct(n,d)}%"></i></div>`;

/* ---------------------------------------------------------------- shell */
function parseHash(){const [r='',arg='']=decodeURIComponent(location.hash.slice(1)).split('/');return {route:ROUTES.includes(r)?r:'home',arg};}
const hashFor=()=>'#'+route+(route==='study'&&group?'/'+group:'');
function go(r,arg=''){route=r;if(r==='study')group=GROUPS.some(g=>g.id===arg)?arg:(group||GROUPS[0].id);render();window.scrollTo({top:0,behavior:'instant'});}
function shell(body){
 const initial=(learner.name||'?').slice(0,1).toUpperCase();
 return `<header class="topbar"><a class="brand" href="#home"><img src="./icon.svg" alt=""><span><b>Solving English Problems</b><small>Words · sentences · reading · symbols</small></span></a>
 <nav class="main" aria-label="Main">${[['home','Home'],['plan','My plan'],['study','Study'],['progress','Progress'],['about','How it works']].map(([id,l])=>`<a href="#${id}" ${route===id?'aria-current="page"':''}>${l}</a>`).join('')}</nav>
 <a class="learner-chip" href="#learner" aria-label="Learner settings"><span class="avatar">${esc(initial)}</span>${esc(learner.name||'Learner')}</a></header><main id="main">${body}</main><footer>Sentence Forge · Linguistics Quest · Word Raiders — one app, three worlds. Progress stays on this device; back it up under Learner.</footer>`;
}
function render(){
 if(location.hash!==hashFor())history.replaceState(null,'',location.pathname+location.search+hashFor());
 const fn={home,exam:examView,plan,study,progress:progressView,learner:learnerView,about}[route];
 $('#app').innerHTML=shell(fn());
 document.title=(route==='home'?'':{exam:'Placement exam',plan:'My plan',study:'Study',progress:'Progress',learner:'Learner',about:'How it works'}[route]+' · ')+'Solving English Problems';
}

/* ---------------------------------------------------------------- home */
function moduleCard(m,all){
 const d=all[m];const M=MODULES[m];let stats='';
 if(m==='sf')stats=d.found?`<div class="stats"><div class="stat"><b>${d.ordersDone}<small>/${SF_TOTALS.orders}</small></b><span>orders built</span></div><div class="stat"><b>${d.wings}<small>/9</small></b><span>wings restored</span></div><div class="stat"><b>${d.dogsHelped}<small>/24</small></b><span>dogs helped</span></div></div>`:'';
 if(m==='lq')stats=d.found?`<div class="stats"><div class="stat"><b>${d.lessonsPassed}<small>/${LQ_TOTALS.lessons}</small></b><span>lessons passed</span></div><div class="stat"><b>${d.academyScenes}</b><span>academy scenes</span></div><div class="stat"><b>${d.reviewsDue}</b><span>reviews due</span></div></div>`:'';
 if(m==='wr')stats=d.found?`<div class="stats"><div class="stat"><b>${d.chapter}<small>/9</small></b><span>chapter</span></div><div class="stat"><b>${d.stars}<small>/${WR_TOTALS.stars}</small></b><span>stars</span></div><div class="stat"><b>${d.academyLessons}<small>/24</small></b><span>academy lessons</span></div></div>`:'';
 return `<section class="card"><div class="row"><span class="icon" style="color:${M.color}">${M.icon}</span><h2>${esc(M.name)}</h2></div><p>${esc(M.tagline)}</p>${stats||`<p class="tiny">Not started on this device yet.</p>`}${d.found&&d.profileName?`<p class="tiny">Playing as <b>${esc(d.profileName)}</b>${d.profiles?.length>1?` · ${d.profiles.length} profiles`:''}</p>`:''}<div class="spacer"></div>${open(m,'',`Open ${esc(M.name)} →`)}</section>`;
}
function home(){
 const all=readAll(localStorage),due=dueSummary(all),dueTotal=due.sf+due.lq+due.wr;
 const named=!!learner.name;
 const welcome=named?'':`<section class="card accent"><h2>Welcome. Who is learning?</h2><p>A name keeps your plan and backups labelled. Each world still has its own player profiles.</p><form id="learner-form" class="row"><label class="field">Name<input type="text" name="name" maxlength="30" placeholder="Your name" required></label><label class="field">This learner is<select name="audience">${AUDIENCES.map(a=>`<option value="${a.id}">${esc(a.title)}</option>`).join('')}</select></label><button class="btn primary" type="submit">Save</button></form></section>`;
 const last=learner.lastVisited;
 const cont=last&&MODULES[last.module]?`<section class="card"><span class="icon">↻</span><h2>Continue</h2><p>You were in <b>${esc(MODULES[last.module].name)}</b>${last.title?` · ${esc(last.title)}`:''}.</p><div class="spacer"></div><a class="btn" href="${esc(last.module==='wr'?last.href.replace(/^wordraiders\//,wrBase):last.href)}" data-visit="${last.module}">Pick up where I left off →</a></section>`:
  `<section class="card"><span class="icon">↻</span><h2>Reviews due</h2><p>${dueTotal?`${dueTotal} item${dueTotal===1?'':'s'} ready to review across the worlds.`:'Nothing is due right now. Little and often keeps meanings retained.'}</p><div class="spacer"></div><a class="btn" href="#study/review">See what is due →</a></section>`;
 return `<section class="hero"><p class="eyebrow">One app · three worlds</p><h1>${named?`Hello, ${esc(learner.name)}.`:'Let’s solve English problems.'}</h1><p class="lede">Small common words, word parts, sentence structure, building meaning, reading and symbols. Take a short placement exam to get a course of action, or pick exactly what you want to study.</p></section>
 ${welcome}
 <div class="grid three">
  <section class="card accent"><span class="icon">◎</span><h2>${learner.plan?'My plan':'Find my starting point'}</h2><p>${learner.plan?`A ${learner.plan.steps.length}-step course of action from your placement exam on ${esc(new Date(learner.exam?.at||learner.plan.createdAt).toLocaleDateString())}.`:'About 15 short questions, tap-only, read aloud on request. It recommends where to start in each world; it never grades or records mastery.'}</p><div class="spacer"></div><div class="actions">${learner.plan?`<a class="btn primary" href="#plan">Open my plan →</a><a class="btn ghost small" href="#exam">Retake</a>`:`<a class="btn primary" href="#exam">Take the placement exam →</a>`}</div></section>
  <section class="card"><span class="icon">▦</span><h2>Choose what to study</h2><p>Every lesson, trail, factory district, arcade mode, reading adventure and review tool, grouped by skill.</p><div class="spacer"></div><a class="btn" href="#study">Open the study menu →</a></section>
  ${cont}
 </div>
 <h2 style="margin-top:6px">The three worlds</h2>
 <div class="grid three">${['sf','lq','wr'].map(m=>moduleCard(m,all)).join('')}</div>`;
}

/* ---------------------------------------------------------------- exam */
function examView(){
 if(!exam)return `<section class="hero"><p class="eyebrow">Placement exam</p><h1>Where should I start?</h1><p class="lede">Six skill areas, up to three tiers each. Two questions per tier: pass both and you climb; miss one and that area stops. Most people answer 12–20 questions in about 5–10 minutes.</p><p class="lede">Every answer explains itself. Nothing here is a grade, and nothing is written into the worlds’ own progress. You can retake it any time.</p></section>
  <section class="card"><h2>Who is taking it?</h2><div class="grid three">${AUDIENCES.map(a=>`<button class="card" data-action="start-exam" data-audience="${a.id}" style="cursor:pointer;text-align:left"><h3>${esc(a.title)}</h3><p>${esc(a.blurb)}</p><span class="btn small" aria-hidden="true">Start →</span></button>`).join('')}</div><p class="tiny">Grown-ups: for a young beginner, sit together and use “Read aloud” on each question.</p></section>
  <section class="card"><h2>What it covers</h2><div class="list">${AREAS.map(a=>`<div class="item"><div><span class="k">${esc(a.title)}</span><div class="d">${esc(a.blurb)}</div></div></div>`).join('')}</div></section>`;
 const s=exam.state;
 if(s.done){const sum=summarize(s);return `<section class="hero"><p class="eyebrow">Placement result</p><h1>${sum.correct} of ${sum.answered} right.</h1><p class="lede">Levels are the highest tier you passed fully in each area. Your plan starts with the weakest areas and adds the next rung for the rest.</p></section>
  <section class="card"><div class="levels">${sum.perArea.map(a=>`<div class="level"><b>${esc(a.title)}</b><div class="bar"><i style="width:${Math.round(100*a.level/3)}%"></i></div><span class="lbl">${esc(a.label)}${a.partial?' · nearly the next tier':''}</span></div>`).join('')}</div>
  <div class="actions" style="margin-top:14px">${btn('Build my plan →','build-plan','','primary')}${btn('Retake','retake','','ghost')}</div></section>`;}
 const q=s.current,f=exam.feedback,area=AREAS.find(a=>a.id===q.area);
 return `<section class="exam-q" aria-live="polite" data-qid="${esc(q.id)}"><div class="row" style="justify-content:space-between"><span class="badge">${esc(area.title)} · tier ${q.tier}</span><span class="tiny">Question ${s.answers.length+1}${exam.state.answers.length?` · ${s.answers.filter(a=>a.correct).length} right`:''}</span></div>${meter(Math.round(examProgress(s)*100),100)}
  <p class="prompt">${esc(q.prompt)}</p>
  <div class="answers">${q.options.map((o,i)=>`<button class="answer ${f?(o===q.answer?'correct':f.picked===o?'wrong':''):''}" data-action="exam-answer" data-option="${esc(o)}" ${f?'disabled':''}><span class="n">${i+1}</span><span>${esc(o)}</span></button>`).join('')}</div>
  ${f?`<div class="feedback ${f.correct?'good':'miss'}"><b>${f.correct?'That’s right.':'Not this time.'}</b> ${esc(q.why)}<div class="actions" style="margin-top:10px">${btn('Next →','exam-next','','primary')}</div></div>`:''}
  <div class="actions" style="margin-top:14px">${btn('♪ Read aloud','exam-read',`data-text="${esc(q.read+'. '+q.options.map((o,i)=>`${i+1}. ${o}`).join('. '))}"`,'ghost small')}${btn('Stop the exam','retake','','ghost small')}</div></section>`;
}
function startExam(audience){exam={state:newExam({audience,seed:Date.now()}),feedback:null};if(!learner.audience){learner.audience=audience;persist();}render();}
function answerExam(option){if(!exam||exam.feedback||exam.state.done)return;const q=exam.state.current;exam.feedback={picked:option,correct:option===q.answer};exam.next=examAnswer(exam.state,option);render();}
function nextExam(){if(!exam||!exam.next)return;exam.state=exam.next;exam.next=null;exam.feedback=null;render();}
function finishExam(){const s=exam.state,sum=summarize(s);learner.exam={version:1,at:Date.now(),audience:s.audience,seed:s.seed,answers:s.answers,levels:sum.levels,perArea:sum.perArea.map(a=>({id:a.id,level:a.level,partial:a.partial,asked:a.asked,right:a.right}))};learner.plan=buildPlan({levels:sum.levels,audience:s.audience});learner.manual={};persist();exam=null;toast('Your plan is ready.');go('plan');}

/* ---------------------------------------------------------------- plan */
function plan(){
 if(!learner.plan)return `<section class="hero"><p class="eyebrow">My plan</p><h1>No plan yet.</h1><p class="lede">Take the placement exam and a course of action appears here, with each step linked to the right place in the right world.</p><div class="actions"><a class="btn primary" href="#exam">Take the placement exam →</a><a class="btn" href="#study">Or choose what to study →</a></div></section>`;
 const all=readAll(localStorage),p=learner.plan;let firstOpen=true;
 const steps=p.steps.map((s,i)=>{const auto=stepDone(s.id,all),done=auto||!!learner.manual[s.id],start=!done&&firstOpen;if(start)firstOpen=false;
  return `<div class="item ${done?'done':''}" ${start?'data-start="1"':''}><div><span class="k">${esc(s.areaTitle)}</span>${start?' <span class="badge">Start here</span>':''}${done?' <span class="badge done">Done</span>':''}<div class="t"><span class="num">${i+1}</span>${esc(s.title)} ${badge(s.module)}</div><div class="d">${esc(s.detail)}</div></div><div class="actions">${open(s.module,s.hash,'Open →',done?'small':'small primary')}${auto?'':btn(done?'Undo':'I did this','toggle-step',`data-id="${esc(s.id)}"`,'ghost small')}</div></div>`;}).join('');
 const doneCount=p.steps.filter(s=>stepDone(s.id,all)||learner.manual[s.id]).length;
 return `<section class="hero"><p class="eyebrow">My plan · ${esc(audienceName(p.audience))}</p><h1>${doneCount} of ${p.steps.length} steps done.</h1><p class="lede">Weakest areas come first. Steps tick themselves when the worlds record the progress; mark the rest yourself.</p>${meter(doneCount,p.steps.length)}
  <div class="chips" style="margin-top:12px">${AREAS.map(a=>`<span class="chip" aria-pressed="false">${esc(a.short)} · ${esc(LEVEL_NAMES[p.levels[a.id]])}</span>`).join('')}</div>
  <div class="actions" style="margin-top:12px"><a class="btn ghost small" href="#exam">Retake the exam</a>${btn('Clear this plan','clear-plan','','ghost small')}</div></section><div class="list">${steps}</div>`;
}

/* ---------------------------------------------------------------- study */
function study(){
 const g=GROUPS.find(x=>x.id===group)||GROUPS[0];group=g.id;
 const items=catalogFor(g.id);
 return `<section class="hero"><p class="eyebrow">Study menu</p><h1>Choose what to study.</h1><p class="lede">Everything the three worlds can do, grouped by skill. Tap a group, then open anything.</p></section>
 <div class="chips" role="tablist">${GROUPS.map(x=>`<a class="chip" role="tab" href="#study/${x.id}" aria-current="${x.id===g.id}">${x.icon} ${esc(x.title)}</a>`).join('')}</div>
 <section class="card"><h2>${g.icon} ${esc(g.title)}</h2><p>${esc(g.blurb)}</p></section>
 <div class="list">${items.map(c=>`<div class="item"><div><div class="t">${esc(c.title)} ${badge(c.module)}</div><div class="d">${esc(c.detail)}</div></div>${open(c.module,c.hash)}</div>`).join('')}</div>`;
}

/* ---------------------------------------------------------------- progress */
function progressView(){
 const all=readAll(localStorage),{sf,lq,wr}=all,due=dueSummary(all);
 const certs=[[wr.found&&wr.endingSeen,'Lexicon restored','Word Raiders · all 45 crystals gold'],[wr.found&&wr.academyComplete,'Sentence Master','Word Raiders Sentence Academy final exam'],[sf.found&&sf.wings>=9,'Factory foreman','Sentence Forge · all nine wings restored'],[sf.found&&sf.dogsHelped>=24,'Every dog home','Pawprint Trail · 24 dogs helped'],[lq.found&&lq.gradesComplete>=13,'Foundation complete','Linguistics Quest · every grade badge'],[lq.found&&lq.academyScenes>=3000,'Academy graduate','Small Common Word Academy · 3,000 scenes']];
 return `<section class="hero"><p class="eyebrow">Progress</p><h1>All three worlds, one page.</h1><p class="lede">These are the worlds’ own counters gathered together. Completion is not the same as retention: each world keeps spaced review to tell the difference.</p><div class="stats"><div class="stat"><b>${due.sf+due.lq+due.wr}</b><span>reviews due now</span></div><div class="stat"><b>${certs.filter(c=>c[0]).length}<small>/${certs.length}</small></b><span>certificates</span></div></div></section>
 <section class="card"><div class="row"><span class="icon" style="color:${MODULES.sf.color}">⚒</span><h2>Sentence Forge</h2>${sf.found?`<span class="badge sf">${esc(sf.profileName)}</span>`:''}</div>${sf.found?`<div class="stats"><div class="stat"><b>${sf.ordersDone}<small>/93</small></b><span>orders</span></div><div class="stat"><b>${sf.wings}<small>/9</small></b><span>wings</span></div><div class="stat"><b>${sf.lessons.length}<small>/9</small></b><span>lessons</span></div><div class="stat"><b>${sf.repairsDue}</b><span>repairs due</span></div><div class="stat"><b>${sf.dogsHelped}<small>/24</small></b><span>dogs helped</span></div><div class="stat"><b>${sf.highestGrade}</b><span>trail grade open</span></div><div class="stat"><b>${sf.littleStars}<small>/2</small></b><span>beginner stars</span></div><div class="stat"><b>${sf.xp}</b><span>XP</span></div></div>`:'<p>Not started on this device yet.</p>'}<div class="actions">${open('sf','#progress','Full Sentence Forge progress →','small')}${open('sf','#repair','Repair bench →','small ghost')}</div></section>
 <section class="card"><div class="row"><span class="icon" style="color:${MODULES.lq.color}">◈</span><h2>Linguistics Quest</h2>${lq.found?`<span class="badge lq">${esc(lq.profileName)}</span>`:''}</div>${lq.found?`<div class="stats"><div class="stat"><b>${lq.lessonsPassed}<small>/108</small></b><span>course lessons</span></div><div class="stat"><b>${lq.gradesComplete}<small>/13</small></b><span>grade badges</span></div><div class="stat"><b>${lq.meaningsPracticed}</b><span>meanings practiced</span></div><div class="stat"><b>${lq.reviewsDue}</b><span>reviews due</span></div><div class="stat"><b>${lq.academyScenes}<small>/3000</small></b><span>academy scenes</span></div><div class="stat"><b>${lq.trailBadges.length}<small>/12</small></b><span>trail badges</span></div><div class="stat"><b>${lq.xp}</b><span>XP</span></div></div>`:'<p>Not started on this device yet.</p>'}<div class="actions">${open('lq','#progress','Full Linguistics Quest progress →','small')}${open('lq','#repair','Repair notebook →','small ghost')}</div></section>
 <section class="card"><div class="row"><span class="icon" style="color:${MODULES.wr.color}">⬡</span><h2>Word Raiders</h2>${wr.found?`<span class="badge wr">${esc(wr.profileName)}</span>`:''}</div>${wr.found?`<div class="stats"><div class="stat"><b>${wr.chapter}<small>/9</small></b><span>chapter</span></div><div class="stat"><b>${wr.stars}<small>/135</small></b><span>stars</span></div><div class="stat"><b>${wr.collected}<small>/45</small></b><span>word powers</span></div><div class="stat"><b>${wr.mastered}</b><span>mastered</span></div><div class="stat"><b>${wr.raidStreak}</b><span>raid streak</span></div><div class="stat"><b>${wr.academyLessons}<small>/24</small></b><span>academy lessons</span></div><div class="stat"><b>${wr.studyDue}</b><span>study cards due</span></div><div class="stat"><b>${wr.xp}</b><span>XP</span></div></div>`:'<p>Not started on this device yet.</p>'}<div class="actions">${open('wr','#trail','Word quest trail →','small')}${open('wr','#study','Study box →','small ghost')}</div></section>
 <section class="card"><h2>Certificates</h2><div class="list">${certs.map(([ok,t,d])=>`<div class="item ${ok?'done':''}"><div><div class="t">${ok?'★ ':'☆ '}${esc(t)}</div><div class="d">${esc(d)}</div></div>${ok?'<span class="badge done">Earned</span>':''}</div>`).join('')}</div></section>`;
}

/* ---------------------------------------------------------------- learner */
function learnerView(){
 const all=readAll(localStorage);
 const worlds=[['sf','Sentence Forge',all.sf],['lq','Linguistics Quest',all.lq],['wr','Word Raiders',all.wr]];
 return `<section class="hero"><p class="eyebrow">Learner</p><h1>${esc(learner.name||'Learner')}</h1><p class="lede">Your name and audience live here. Each world keeps its own profiles (Sentence Forge builders, Linguistics Quest family profiles, Word Raiders players with PINs); this page shows which one is active and backs them all up together.</p></section>
 <section class="card"><h2>About you</h2><form id="learner-form" class="row"><label class="field">Name<input type="text" name="name" maxlength="30" value="${esc(learner.name)}" required></label><label class="field">This learner is<select name="audience">${AUDIENCES.map(a=>`<option value="${a.id}" ${a.id===learner.audience?'selected':''}>${esc(a.title)}</option>`).join('')}</select></label><button class="btn primary" type="submit">Save</button></form></section>
 <section class="card"><h2>Profiles in each world</h2><div class="list">${worlds.map(([m,n,d])=>`<div class="item"><div><div class="t">${esc(n)} ${badge(m)}</div><div class="d">${d.found?`Active: <b>${esc(d.profileName||'—')}</b>${d.profiles?.length?` · all: ${esc(d.profiles.join(', '))}`:''}`:'No profile on this device yet.'}</div></div>${open(m,m==='wr'?'#settings':'','Manage →','small')}</div>`).join('')}</div><p class="tiny">Sentence Forge and Linguistics Quest open their profiles from their own Profiles buttons; Word Raiders from Settings or the player chip.</p></section>
 <section class="card"><h2>One backup for everything</h2><p>Exports the learner record and every world’s save on this device as one JSON file. Import replaces the same saves on another device, so export there first if it already has progress.</p><div class="actions">${btn('Export everything','export','','primary')}${btn('Import a backup','import')}</div></section>
 <section class="card"><h2>Reset</h2><p>Forgets your name, exam and plan on this device. The worlds’ own saves are not touched.</p><div class="actions">${btn('Forget my hub data','reset-hub','','danger')}</div></section>`;
}

/* ---------------------------------------------------------------- about */
function about(){
 return `<section class="hero"><p class="eyebrow">How it works</p><h1>Three worlds, one path.</h1><p class="lede">Solving English Problems joins three complete learning games without changing how any of them teach. The hub adds a placement exam, a course of action, a study menu and a single backup.</p></section>
 <div class="grid three">
  <section class="card"><h2>Sentence Forge</h2><p>93 sentence-building orders in nine factory districts, nine foreman lessons, a 277-entry parts catalog, eight arcade modes, a repair bench with spaced reviews, the Pawprint Trail (two picture rescues, Word Camp, 24 stories over grades 1–12) and the Read & Rescue Rally.</p><div class="spacer"></div>${open('sf','#learn/core','Foreman’s lessons →','small')}</section>
  <section class="card"><h2>Linguistics Quest</h2><p>A K–12 foundation course of 108 lessons over 294 guided meanings, 12 topic trails, a meaning atlas, six practice modes, a diagnostic, a repair notebook, the adult WordNet dictionary and Unicode symbol index, the Small Common Word Academy (3,000 illustrated scenes) and your Visual Library.</p><div class="spacer"></div>${open('lq','#guide','How its learning works →','small')}</section>
  <section class="card"><h2>Word Raiders</h2><p>Nine chapters of five word powers each (45 prefixes, roots, suffixes and combining forms, 135 words) as a 3D quest with bosses and daily raids; flashcards and a Leitner study box; the Sentence Academy (5 units, 24 lessons, Sentence Master certificate); the Word Arcade with Blitz and Crystal Clash for friends.</p><div class="spacer"></div>${open('wr','#guide','How its mastery model works →','small')}</section>
 </div>
 <section class="card"><h2>The placement exam and the plan</h2><p>Six areas — small common words, word parts, word jobs and sentence parts, building sentences and meaning, reading, punctuation and symbols — each with three tiers of two questions. Passing both questions climbs a tier; a miss stops that area. The level is the highest tier passed fully. The plan lists the weakest areas first, with the next rung for every area, and links each step to the exact lesson, chapter, district or trail. Steps tick themselves when a world records the matching progress. The exam is a starting point, not a grade, and it never writes mastery into the worlds.</p></section>
 <section class="card"><h2>What stays where</h2><p>Every world keeps its own player profiles and browser save, so nothing you had before is lost or merged. The hub reads those saves to show progress and stores only your name, audience, exam and plan. Progress is per browser: use Learner → Export everything to move all of it at once.</p><p class="tiny">Original teaching content throughout. Reference sources are listed inside each world. Fonts: DM Sans and Space Grotesk (SIL Open Font License), bundled with Sentence Forge.</p></section>`;
}

/* ---------------------------------------------------------------- events */
$('#app').addEventListener('click',event=>{
 const visit=event.target.closest('[data-visit]');if(visit){learner.lastVisited={module:visit.dataset.visit,href:visit.getAttribute('href'),title:'',at:Date.now()};persist();return;}
 const b=event.target.closest('[data-action]');if(!b||b.disabled)return;event.preventDefault();const a=b.dataset.action;
 switch(a){
  case 'start-exam':startExam(b.dataset.audience);break;
  case 'exam-answer':answerExam(b.dataset.option);break;
  case 'exam-next':nextExam();break;
  case 'exam-read':speak(b.dataset.text);break;
  case 'retake':exam=null;render();break;
  case 'build-plan':finishExam();break;
  case 'toggle-step':learner.manual[b.dataset.id]=!learner.manual[b.dataset.id];persist();render();break;
  case 'clear-plan':if(confirm('Clear this plan? Your exam result is kept and you can retake any time.')){learner.plan=null;learner.manual={};persist();go('home');}break;
  case 'export':{const bundle=exportBundle(localStorage);const blob=new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`solving-english-problems-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);toast(`Backup ready: ${Object.keys(bundle.saves).length} saved item${Object.keys(bundle.saves).length===1?'':'s'}.`);break;}
  case 'import':$('#import-file').click();break;
  case 'reset-hub':if(confirm('Forget your name, exam and plan on this device? The worlds’ own saves stay.')){learner=readLearner({getItem:()=>null});try{localStorage.removeItem(KEYS.learner);}catch{}toast('Hub data cleared.');go('home');}break;
 }
});
$('#app').addEventListener('submit',e=>{if(e.target.id!=='learner-form')return;e.preventDefault();const f=new FormData(e.target);const name=String(f.get('name')||'').trim().slice(0,30);if(!name)return;learner.name=name;learner.audience=String(f.get('audience')||learner.audience||'student');persist();toast(`Saved. Hello, ${name}.`);render();});
$('#import-file').addEventListener('change',async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>40e6)throw Error('That file is too large to be a backup.');const data=JSON.parse(await file.text());const keys=Object.keys(data?.saves||{});if(!confirm(`Restore ${keys.length} saved item${keys.length===1?'':'s'} from this backup? Matching saves on this device will be replaced.`))return;const written=importBundle(localStorage,data);learner=readLearner(localStorage);toast(`Restored ${written.length} item${written.length===1?'':'s'}. Open a world to continue.`);render();}catch(err){toast(`Import was not applied: ${err.message}`);}});
window.addEventListener('hashchange',()=>{if(location.hash===hashFor())return;const h=parseHash();if(h.route!=='exam')exam=exam&&!exam.state.done?exam:null;go(h.route,h.arg);});
window.addEventListener('storage',e=>{if(e.key===KEYS.learner)learner=readLearner(localStorage);if(['home','plan','progress','learner'].includes(route))render();});

/* ---------------------------------------------------------------- boot */
{const h=parseHash();route=h.route;if(route==='study')group=GROUPS.some(g=>g.id===h.arg)?h.arg:GROUPS[0].id;}
render();
resolveWordRaiders().then(()=>{if(wrBase!==MODULES.wr.path)render();});
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
