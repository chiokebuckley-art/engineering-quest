// The study catalog: every function of Sentence Forge, Linguistics Quest and Word Raiders, grouped by
// what a learner wants to work on, each with a deep link. Also the plan builder that turns placement
// levels into an ordered course of action. Pure data and functions; app.js renders them.
import { AREAS } from './exam-content.js';
export const MODULES={
 sf:{id:'sf',name:'Sentence Forge',path:'sentence-forge/',tagline:'Build sentences on the factory line, read with Scout the dog, and race for meaning.',color:'#70d4c4',icon:'⚒'},
 lq:{id:'lq',name:'Linguistics Quest',path:'linguistics-quest/',tagline:'Small words, meanings and symbols from kindergarten to grade 12, plus the adult reference.',color:'#9be07c',icon:'◈'},
 wr:{id:'wr',name:'Word Raiders',path:'wordraiders/',tagline:'Prefixes, roots and suffixes in a 3D word quest, with the Sentence Academy and the Word Arcade.',color:'#bfff73',icon:'⬡'},
};
export const link=(module,hash='')=>MODULES[module].path+hash;
export const GROUPS=[
 ...AREAS.map(a=>({id:a.id,title:a.title,icon:a.icon,blurb:a.blurb})),
 {id:'library',title:'Dictionary & library',icon:'▤',blurb:'Look things up: the meaning atlas, the adult dictionary and symbol index, and your visual library.'},
 {id:'friends',title:'Play with friends',icon:'⚑',blurb:'Two or more players on one device, or online rooms with a code.'},
 {id:'review',title:'Review what is due',icon:'⌁',blurb:'Spaced repair and review across all three worlds. Little and often beats cramming.'},
 {id:'tools',title:'Progress, certificates & settings',icon:'◷',blurb:'Each world keeps its own profiles, backups, sound and read-aloud settings.'},
];
const C=(id,group,module,hash,title,detail,kind='course')=>({id,group,module,hash,title,detail,kind});
const SF_DISTRICTS=[['core','Word Workshop','Who or what? What happens?'],['identify','Identification Station','Which one? How many?'],['relation','Relationship Works','Connect things in space and meaning'],['verbs','Verb Engine Room','Action, time and possibility'],['connect','Connector Junction','Join ideas with the right relationship'],['precision','Precision Lab','Small changes, different claims'],['reference','Reference Network','Trace words back to their meaning'],['paragraph','Paragraph Plant','Build a connected explanation'],['evidence','Evidence Bureau','What is stated, supported or unknown?']];
const LQ_TRAILS=[['little','Little words, big meaning'],['everyday','Everyday explorers'],['connections','Connection canyon'],['senses','Many-meaning marsh'],['parts','Word workshop'],['precision','Precision peaks'],['academic','Knowledge observatory'],['language','Language laboratory'],['punctuation','Punctuation port'],['math','Number constellation'],['advanced','Symbol summit'],['digital','Signals & systems']];
export const WR_CHAPTERS=['Academy Meadow','Builder’s Bridge','Carry Canyon','Mirror Marsh','Between Peaks','Twin Towers','Root Ruins','Science Station','Signal Summit'];
export const CATALOG=[
 // ---- small common words
 C('lq.course','words','lq','#home','Foundation course (K–12)','108 sequential lessons over 294 guided meanings. Pick a finish-line grade; every course starts at kindergarten.'),
 C('lq.course.continue','words','lq','#course','Continue my current lesson','Jumps straight to the lesson you are on.'),
 C('lq.explore','words','lq','#explore','Explore the trails & Find my starting point','The expedition map of all 12 trails, with the short diagnostic that recommends a trail without grading you.','practice'),
 C('lq.academy','words','lq','academy/','Small Common Word Academy','3,000 illustrated scenes: 60 uses of little words × 50 objects. Teach, guided practice, two independent checks.'),
 C('lq.trail.little','words','lq','#world/little','Trail: Little words, big meaning','the, of, in, on… with examples and a misconception note per word.','practice'),
 C('lq.trail.everyday','words','lq','#world/everyday','Trail: Everyday explorers','Everyday words and simple messages.','practice'),
 C('lq.trail.connections','words','lq','#world/connections','Trail: Connection canyon','because, unless, although — the connectors.','practice'),
 C('lq.trail.senses','words','lq','#world/senses','Trail: Many-meaning marsh','One word, several jobs and meanings.','practice'),
 C('sf.catalog','words','sf','#catalog','Parts catalog (277 entries)','Function words, connectors and contractions, each with its job and an example, with read-aloud.','reference'),
 C('lq.arcade.practice','words','lq','#arcade/practice','Meaning expedition','An untimed mix of definitions, examples and word retrieval.','practice'),
 C('lq.arcade.detective','words','lq','#arcade/detective','Context detective','Choose the meaning that fits the sentence.','practice'),
 C('lq.arcade.conquer','words','lq','#arcade/conquer','Conquer the confusion','A 12-question mixed challenge; ten correct earns a round badge.','play'),
 // ---- word parts
 C('wr.trail','parts','wr','#trail','Word quest trail','Learn a crystal (about a minute each), battle the chapter boss, and turn crystals gold in daily raids.'),
 ...WR_CHAPTERS.map((n,i)=>C(`wr.chapter.${i+1}`,'parts','wr',`#chapter/${i+1}`,`Chapter ${i+1} · ${n}`,['Your first five word powers: re-, un-, -ful, -less, -ness.','Who, where and when: -er, sub-, mis-, pre-, trans-.','Roots and tiny things: port, in-, micro-, scope, im-.','NOT and UNDO: il-, ir-, un-, dis-.','Between, within, after, too much: inter-, intra-, post-, non-, over-.','Together, many, two and three: under-, co-, multi-, bi-, tri-.','Ancient roots: spect, struct, aud, dict, -ly.','Life, earth, heat and light: -able, bio-, geo-, therm-, photo-.','Sound, distance, water and measuring: phon, tele-, hydro-, meter, -logy.'][i])),
 C('wr.study','parts','wr','#study','Flashcards & study box','Tap to flip, then Got it / Not yet. A three-box Leitner study box brings missed cards back in 10 minutes, 2 days and a week.','review'),
 C('wr.collection','parts','wr','#collection','Word power collection','Every recovered word part with its meaning, words and notes.','reference'),
 C('wr.arcade','parts','wr','#arcade','Word Arcade: Practice & Blitz','Fast rounds over the chapters you have reached. Untimed practice with explanations, or 30–120 second Blitz.','play'),
 C('lq.trail.parts','parts','lq','#world/parts','Trail: Word workshop','Word parts inside the meaning atlas.','practice'),
 // ---- word jobs & sentence parts
 C('wr.academy','jobs','wr','#academy','Sentence Academy','5 units, 24 lessons and unit tests: the eight word jobs, subjects and predicates, fragments, objects, compound and complex sentences, paragraphs and close reading. Earns the Sentence Master certificate.'),
 ...SF_DISTRICTS.map(([id,name,t])=>C(`sf.learn.${id}`,'jobs','sf',`#learn/${id}`,`Lesson: ${name}`,t+'. Field notes, an example to read aloud, then try it on the line.')),
 C('lq.trail.language','jobs','lq','#world/language','Trail: Language laboratory','How words and sounds work.','practice'),
 // ---- building sentences & meaning
 C('sf.factory','build','sf','#factory','The factory (93 orders in 9 districts)','Tap word tiles onto the belt, run the line, pass the meaning inspection. Restore a wing with three orders.'),
 C('sf.assembly','build','sf','#assembly','Next production order','Straight to the next order on your line.'),
 ...SF_DISTRICTS.map(([id,name,t])=>C(`sf.district.${id}`,'build','sf',`#factory/${id}`,`District: ${name}`,t+'.')),
 C('sf.arcade.practice','build','sf','#arcade/practice','Open workshop (untimed practice)','Build, inspect, ask for a hint, try again. Weaker skills come up more often.','practice'),
 C('sf.arcade.blitz','build','sf','#arcade/blitz','Conveyor Blitz','As many meaning orders as you can against the clock.','play'),
 C('sf.arcade.conquer','build','sf','#arcade/conquer','Conquer (10-order contract)','Pass 8 of 10 fresh orders on the first try.','play'),
 C('sf.arcade.switch','build','sf','#arcade/switch','Meaning Switch','Pick the interpretation that keeps the sentence’s meaning.','play'),
 C('sf.arcade.rush','build','sf','#arcade/rush','Repair Rush','A 60-second inspection; mistakes go to your repair bench.','play'),
 C('sf.arcade.rocket','build','sf','#arcade/rocket','Rocket Routes','Reach the Moon with 7 clean answers before 3 misses.','play'),
 C('sf.arcade.millionaire','build','sf','#arcade/millionaire','Meaning Millionaire','Climb 10 rungs with one hint and one swap.','play'),
 C('lq.trail.precision','build','lq','#world/precision','Trail: Precision peaks','Reading with precision: small changes, different claims.','practice'),
 // ---- reading
 C('sf.little','reading','sf','#adventure','Start here: help Buddy and Dot','Two picture-led rescues for first readers: one word to a short sentence, spoken directions, two pictures.'),
 C('sf.trail','reading','sf','#adventure','Pawprint Trail (grades 1–12)','24 original stories with five evidence-backed questions each. Word Camp warms up blending and word parts.'),
 C('sf.reading','reading','sf','#reading','Read & Rescue Rally','Self-timed reading with words-per-minute and untimed questions. Solo or two players.','play'),
 C('lq.trail.academic','reading','lq','#world/academic','Trail: Knowledge observatory','The language of learning.','practice'),
 // ---- punctuation & symbols
 C('lq.trail.punctuation','symbols','lq','#world/punctuation','Trail: Punctuation port','End marks, commas, apostrophes and quotation marks.'),
 C('lq.arcade.symbols','symbols','lq','#arcade/symbols','Symbol decoder','Translate notation into plain language at your level.','practice'),
 C('lq.arcade.blitz','symbols','lq','#arcade/blitz','60-second signal sprint','An optional quick symbol round that pauses when hidden.','play'),
 C('lq.trail.math','symbols','lq','#world/math','Trail: Number constellation','Relationships in mathematics: =, <, ×, %…','practice'),
 C('lq.trail.advanced','symbols','lq','#world/advanced','Trail: Symbol summit','Sets, arguments and advanced notation.','practice'),
 C('lq.trail.digital','symbols','lq','#world/digital','Trail: Signals & systems','Symbols of the digital world.','practice'),
 C('wr.academy.marks','symbols','wr','#academy','Sentence Academy: four jobs, four end marks','Unit 2 covers statements, questions, commands and exclamations.'),
 // ---- dictionary & library
 C('lq.library','library','lq','#library','Meaning atlas','Search all 294 guided meanings at your level; open a card to learn, hear it and practice.','reference'),
 C('lq.reference','library','lq','#reference','Adult dictionary & symbol index','WordNet 3.0 (147,318 headwords) and 8,612 Unicode symbols. Adult profiles only; add any sense to your collection.','reference'),
 C('lq.arcade.collection','library','lq','#arcade/collection','My word collection quiz','Practice dictionary senses you added (adult profiles).','practice'),
 C('lq.visual','library','lq','#visual-library','My Visual Library','Your scanned picture dictionary: browse pages, look up words, study cards, and unlock the bundled book with your code.','reference'),
 C('lq.academy.library','library','lq','academy/#library','Academy picture library','Browse and download any of the 3,000 scenes as SVG.','reference'),
 // ---- friends
 C('wr.clash','friends','wr','#arcade','Crystal Clash','2–6 explorers by pass & play, or an online room with a 4-letter code, all on the same seeded questions.','play'),
 C('sf.duel','friends','sf','#arcade/duel','Factory Duel','Two players, one device, the same five seeded orders.','play'),
 C('sf.rally2','friends','sf','#reading','Read & Rescue Rally (two players)','Tick “two players” for a pass-and-play reading race.','play'),
 // ---- review
 C('sf.repair','review','sf','#repair','Repair bench','Missed orders return as a five-item repair run, spaced now, 3 days and 7 days later.','review'),
 C('lq.repair','review','lq','#repair','Repair notebook','Missed meanings and due reviews; two clean answers clear a repair.','review'),
 C('lq.academy.review','review','lq','academy/#review','Academy review notebook','Practice dates and due reviews for the 60 word uses.','review'),
 C('wr.raid','review','wr','#trail','Daily Raid','Eight quick questions over silver crystals; a correct answer on a later day turns them gold and builds a streak.','review'),
 C('wr.study.due','review','wr','#study','Study box (due cards)','Cards that are due in your Leitner boxes.','review'),
 // ---- tools
 C('sf.progress','tools','sf','#progress','Sentence Forge progress','Orders, XP, lessons and per-skill mastery.','tool'),
 C('lq.progress','tools','lq','#progress','Linguistics Quest progress','Retention, badges and per-trail progress.','tool'),
 C('lq.guide','tools','lq','#guide','How Linguistics Quest learning works','Rules, sources and the four-step method.','tool'),
 C('wr.settings','tools','wr','#settings','Word Raiders players & settings','Players with PINs, sound, speech, export and import.','tool'),
 C('wr.guide','tools','wr','#guide','How Word Raiders works','The mastery model and how stars are earned.','tool'),
];
export const catalogById=Object.fromEntries(CATALOG.map(c=>[c.id,c]));
export const catalogFor=group=>CATALOG.filter(c=>c.group===group);

/* ---------------------------------------------------------------- plan builder */
const S=(id,module,hash,title,detail,done)=>({id,module,hash,title,detail,done});
const has=(p,k)=>p&&p.found?p[k]:0;
/** Steps per area and level. `done` reads the progress summary from progress.js. */
const STEPS={
 words:{
  0:[S('words.course.k','lq','#home','Enrol in the foundation course at kindergarten','Choose your finish-line grade; the course still starts with the first small words.',p=>has(p.lq,'gradesComplete')>=1),
     S('words.academy.1','lq','academy/','Small Common Word Academy, expedition 1','Fifty picture scenes: in, on, under, above, beside…',p=>has(p.lq,'academyScenes')>=50)],
  1:[S('words.course.go','lq','#course','Continue the foundation course','Work through your current grade, one lesson at a time.',p=>has(p.lq,'gradesComplete')>=3),
     S('words.academy.2','lq','academy/','Academy expedition 2 and beyond','Revisit each word use with new objects.',p=>has(p.lq,'academyScenes')>=300)],
  2:[S('words.trails','lq','#explore','Explore the trails','Complete the eight-question mission on Connection canyon and Many-meaning marsh.',p=>(p.lq?.trailBadges||[]).length>=2),
     S('words.catalog','sf','#catalog','Read the Parts catalog','Look up connectors and contractions you are unsure of.',()=>false)],
  3:[S('words.repair','lq','#repair','Keep meanings retained','Clear your repair notebook and answer due reviews.',p=>has(p.lq,'reviewsDue')===0&&has(p.lq,'meaningsPracticed')>20),
     {...S('words.reference','lq','#reference','Adult dictionary & collection','Add senses you meet in real reading and quiz yourself on them.',p=>has(p.lq,'customCards')>=5),adultOnly:true}],
 },
 parts:{
  0:[S('parts.ch1','wr','#chapter/1','Word Raiders chapter 1: Academy Meadow','Learn re-, un-, -ful, -less and -ness, then beat the Glitch Slime.',p=>has(p.wr,'chapter')>=2)],
  1:[S('parts.ch2','wr','#chapter/2','Chapters 2–3: Builder’s Bridge and Carry Canyon','Who, where, when, and the roots that carry.',p=>has(p.wr,'chapter')>=4),
     S('parts.study','wr','#study','Study box every few days','Flip the flashcards for the chapters you have learned.',p=>has(p.wr,'studySessions')>=3)],
  2:[S('parts.ch4','wr','#chapter/4','Chapters 4–6','NOT and UNDO, between and within, together and many.',p=>has(p.wr,'chapter')>=7),
     S('parts.arcade','wr','#arcade','Word Arcade practice','Untimed practice over the chapters you have reached.',p=>has(p.wr,'arcadeRuns')>=3)],
  3:[S('parts.ch7','wr','#chapter/7','Chapters 7–9 and the Sentinel','Ancient roots, science and signals. Restore the Lexicon.',p=>has(p.wr,'endingSeen')),
     S('parts.raid','wr','#trail','Daily Raids to gold','Answer raids on later days until all 45 crystals are gold.',p=>has(p.wr,'stars')>=135)],
 },
 jobs:{
  0:[S('jobs.academy.1','wr','#academy','Sentence Academy unit 1: the eight word jobs','Nouns, verbs, adjectives, adverbs, pronouns, prepositions, conjunctions, interjections.',p=>has(p.wr,'academyUnit')>=1)],
  1:[S('jobs.academy.2','wr','#academy','Sentence Academy unit 2: subjects, predicates and complete sentences','Fragments, end marks and the four sentence jobs.',p=>has(p.wr,'academyUnit')>=2),
     S('jobs.learn.core','sf','#learn/core','Foreman’s lesson: Word Workshop','Who or what? What happens?',p=>(p.sf?.lessons||[]).includes('core'))],
  2:[S('jobs.academy.3','wr','#academy','Sentence Academy units 3–4','Objects, compound and complex sentences, run-ons and variety.',p=>has(p.wr,'academyUnit')>=4),
     S('jobs.learn.verbs','sf','#learn/verbs','Lessons: Verb Engine Room and Connector Junction','Action, time, possibility and joining ideas.',p=>['verbs','connect'].every(x=>(p.sf?.lessons||[]).includes(x)))],
  3:[S('jobs.academy.5','wr','#academy','Sentence Academy unit 5 and the final exam','Paragraphs, chapters and close reading. Earn Sentence Master.',p=>has(p.wr,'academyComplete')),
     S('jobs.learn.precision','sf','#learn/precision','Lessons: Precision Lab and Reference Network','Small changes, different claims; tracing references.',p=>['precision','reference'].every(x=>(p.sf?.lessons||[]).includes(x)))],
 },
 build:{
  0:[S('build.core','sf','#factory/core','Factory: Word Workshop orders','Put who and what happens on the belt.',p=>has(p.sf,'districtDone')?.core>=3)],
  1:[S('build.identify','sf','#factory/identify','Factory: Identification Station and Relationship Works','Which one, how many, and where things are.',p=>['identify','relation'].every(d=>(p.sf?.districtDone||{})[d]>=3)),
     S('build.practice','sf','#arcade/practice','Open workshop practice','Untimed practice with hints and explanations.',()=>false)],
  2:[S('build.verbs','sf','#factory/verbs','Factory: Verb Engine Room, Connector Junction, Precision Lab','Action, connectors and small changes that alter claims.',p=>['verbs','connect','precision'].every(d=>(p.sf?.districtDone||{})[d]>=3)),
     S('build.switch','sf','#arcade/switch','Meaning Switch','Read closely for the interpretation that keeps the meaning.',()=>false)],
  3:[S('build.paragraph','sf','#factory/paragraph','Factory: Reference Network, Paragraph Plant, Evidence Bureau','Trace references, build paragraphs, judge evidence. Restore all nine wings.',p=>has(p.sf,'wings')>=9),
     S('build.conquer','sf','#arcade/conquer','Conquer contracts','Pass 8 of 10 fresh orders first try.',()=>false)],
 },
 reading:{
  0:[S('reading.little','sf','#adventure','Help Buddy and Dot','Two gentle picture rescues with spoken directions.',p=>has(p.sf,'littleStars')>=2),
     S('reading.camp','sf','#adventure','Word Camp','Twelve blending and word-part examples, read aloud.',()=>false)],
  1:[S('reading.g1','sf','#adventure','Pawprint Trail grades 1–3','Six stories; four of five correct helps a dog.',p=>has(p.sf,'highestGrade')>=4)],
  2:[S('reading.g4','sf','#adventure','Pawprint Trail grades 4–8','Inference, theme, evidence and reliability.',p=>has(p.sf,'highestGrade')>=9),
     S('reading.rally','sf','#reading','Read & Rescue Rally','Time a reading, then answer untimed questions.',p=>has(p.sf,'rallyStories')>=1)],
  3:[S('reading.g9','sf','#adventure','Pawprint Trail grades 9–12','Structure, rhetoric, nuance and complex argument.',p=>has(p.sf,'storiesPassed')>=24),
     S('reading.evidence','sf','#factory/evidence','Evidence Bureau orders','What is stated, supported or unknown?',p=>(p.sf?.districtDone||{}).evidence>=3)],
 },
 symbols:{
  0:[S('symbols.port','lq','#world/punctuation','Trail: Punctuation port','End marks and commas with examples.',p=>(p.lq?.trailBadges||[]).includes('punctuation'))],
  1:[S('symbols.marks','wr','#academy','Sentence Academy: four jobs, four end marks','Unit 2 lessons on statements, questions, commands and exclamations.',p=>has(p.wr,'academyUnit')>=2),
     S('symbols.decoder','lq','#arcade/symbols','Symbol decoder','Ten signals at your level.',()=>false)],
  2:[S('symbols.math','lq','#world/math','Trail: Number constellation','=, <, ×, % and friends.',p=>(p.lq?.trailBadges||[]).includes('math'))],
  3:[S('symbols.advanced','lq','#world/advanced','Trails: Symbol summit and Signals & systems','Sets, arguments and digital notation.',p=>['advanced','digital'].every(x=>(p.lq?.trailBadges||[]).includes(x)))],
 },
};
const AREA_ORDER=AREAS.map(a=>a.id);
/** From placement levels (0–3 per area) to an ordered plan: weakest areas first, then the next rung for the rest. */
export function buildPlan({levels,audience='student'}){
 const areas=AREA_ORDER.map(id=>({id,level:Math.max(0,Math.min(3,Number(levels?.[id])||0))}));
 const ordered=[...areas].sort((a,b)=>a.level-b.level||AREA_ORDER.indexOf(a.id)-AREA_ORDER.indexOf(b.id));
 const steps=[];
 for(const a of ordered){
  const area=AREAS.find(x=>x.id===a.id);
  // A weak area gets its level's steps plus the next rung; a strong area gets the next rung only.
  const rungs=a.level<=1?[a.level,Math.min(3,a.level+1)]:[a.level];
  for(const r of rungs)for(const s of STEPS[a.id][r]){if(s.adultOnly&&audience!=='adult')continue;if(!steps.some(x=>x.id===s.id))steps.push({...s,area:a.id,areaTitle:area.title,level:r});}
 }
 if(audience==='child'){const i=steps.findIndex(s=>s.id==='reading.little');if(i>0){const [s]=steps.splice(i,1);steps.unshift(s);}}
 steps.push({id:'keep.review',module:'lq',hash:'#repair',area:'review',areaTitle:'Keep it fresh',level:0,title:'Little and often: clear what is due',detail:'Sentence Forge repair bench, Linguistics Quest repair notebook, Word Raiders daily raid and study box.',done:()=>false});
 return {createdAt:Date.now(),audience,levels:Object.fromEntries(areas.map(a=>[a.id,a.level])),steps:steps.map(s=>({id:s.id,area:s.area,areaTitle:s.areaTitle,level:s.level,module:s.module,hash:s.hash,title:s.title,detail:s.detail}))};
}
/** Whether a plan step is done, from the progress summary; unknown steps are never auto-done. */
export function stepDone(stepId,progress){for(const area of Object.values(STEPS))for(const rung of Object.values(area))for(const s of rung)if(s.id===stepId){try{return !!s.done(progress||{});}catch{return false;}}return false;}
export const allStepIds=()=>Object.values(STEPS).flatMap(a=>Object.values(a).flat()).map(s=>s.id);
