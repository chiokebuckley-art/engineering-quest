import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {Window} from 'happy-dom';
import {glossary} from '../src/content.js';import {clips,clipFor,clipFrame,linkTerms,dictionaryView,missionWords,defaultWords,units} from '../src/dictionary.js';import {cinemaView} from '../src/cinema-view.js';import {validateWordsMet} from '../src/learning.js';

test('Dictionary entries reuse glossary lines and the five Motion Harbor clips link from their words',()=>{
 assert.deepEqual(clips.map(c=>c.title),['Force','Fair test','Variable','Distance','Energy on a ramp']);
 for(const c of clips){assert.ok(glossary[c.term]);assert.ok(c.duration>=8&&c.duration<=20);assert.equal(clipFor(c.term),c);for(const t of [0,c.duration/2,c.duration])assert.match(clipFrame(c,t),/<svg[\s\S]*<\/svg>/);}
 assert.match(clipFrame(clips[0],clips[0].duration),/A push or pull from an interaction\./);
 assert.equal(clipFor('ramp').id,'clip-energy-ramp');
 for(const t of Object.keys(units))assert.ok(glossary[t],'unit for unknown word '+t);
 const html=dictionaryView({met:{force:1}});assert.match(html,/1 of \d+ met/);for(const t of Object.keys(glossary))assert.ok(html.includes(`data-term="${t}"`));assert.doesNotMatch(html,/data-action="(check|choice)"/);
 assert.deepEqual(missionWords({}),defaultWords);
});

test('linkTerms wraps the first use of each word without touching markup or entities',()=>{
 const out=linkTerms('A force acts. Another force &amp; <b class="energy">energy</b>.');
 assert.equal((out.match(/data-term="force"/g)||[]).length,1);assert.match(out,/class="energy"/);assert.match(out,/&amp;/);assert.match(out,/data-term="energy"/);
 assert.match(linkTerms('Make it fair.',{fair:1}),/word-link met/);
 assert.doesNotMatch(linkTerms('Forceful words'),/data-term/);
});

test('Region films stay locked and formula-free until the words and mission are done',()=>{
 const locked=cinemaView({activeId:'motion',unlocked:false,formulas:false,lockWords:defaultWords,met:{},missionTitle:'Rover Rescue'});
 assert.match(locked,/Meet the words first/);assert.doesNotMatch(locked,/PE = m/);assert.doesNotMatch(locked,/PE \(mgh\)/);assert.match(locked,/Stored by height/);assert.match(locked,/id="cinema-play-btn"[^>]*disabled/);
 const open=cinemaView({activeId:'motion',unlocked:true,formulas:true});assert.match(open,/PE = m/);assert.doesNotMatch(open,/Meet the words first/);
 validateWordsMet({force:1});assert.throws(()=>validateWordsMet({force:'x'}));assert.throws(()=>validateWordsMet([]));
});

test('In the app, tapping a mission word opens the Dictionary card, marks it met and unlocks the film once all words are met',async()=>{
 const win=new Window({url:'http://localhost:5187/?mission=first-move',settings:{disableCSSFileLoading:true,disableJavaScriptFileLoading:true}});win.document.write(await fs.readFile(new URL('../index.html',import.meta.url),'utf8'));
 for(const [k,v]of Object.entries({window:win,document:win.document,localStorage:win.localStorage,navigator:win.navigator,location:win.location,CSS:{escape:s=>s},matchMedia:()=>({matches:true}),requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{}}))Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});
 await import('../src/app.js?dictionary');const tick=()=>new Promise(r=>setTimeout(r,20));await tick();await tick();const $=s=>win.document.querySelector(s);
 const met=()=>{const raw=JSON.parse(localStorage.getItem('science-quest.v1'));const d=raw.snapshot||raw;return d.profiles.find(p=>p.id===d.active).wordsMet||{};};
 assert.equal(win.document.querySelectorAll('.stepper li').length,9);assert.match($('.stepper').textContent,/Apply again/);
 $('.mission-words [data-term="force"]').click();await tick();
 assert.match($('.word-dialog').textContent,/A push or pull from an interaction\./);assert.match($('.word-dialog').textContent,/newton/);assert.ok(met().force);
 $('[data-action="clip-open"]').click();await tick();assert.match($('#clip-caption').textContent,/A push or pull/);
 $('[data-action="term-close"].text-button').click();await tick();assert.equal($('.word-dialog'),null);
 $('.bottom-nav [data-view="cinema"]').click();await tick();assert.match($('#main').textContent,/Meet the words first/);
 for(const t of defaultWords){$(`.cinema-lock [data-term="${t}"]`).click();await tick();$('[data-action="term-close"].text-button').click();await tick();}
 assert.equal($('.cinema-lock'),null);assert.ok($('.cinema-big-play'));assert.doesNotMatch($('#main').textContent,/PE = m/);
 $('[data-action="nav"][data-view="dictionary"]').click();await tick();assert.match($('h1').textContent,/Dictionary/);assert.match($('#main').textContent,/6 of \d+ met/);
 await win.happyDOM.abort();
});
