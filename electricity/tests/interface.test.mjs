import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {JSDOM} from 'jsdom';import {lessons} from '../curriculum.js';import {STORE_KEY,parseStore} from '../engine.js';
const dom=new JSDOM(await readFile(new URL('../index.html',import.meta.url),'utf8'),{url:'https://electricity.test/',pretendToBeVisual:true});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,location:dom.window.location,FormData:dom.window.FormData});window.scrollTo=()=>{};
const interval=globalThis.setInterval;globalThis.setInterval=(...args)=>{const t=interval(...args);t.unref();return t;};
await import('../app.js');
const go=async hash=>{window.location.hash=hash;await new Promise(r=>setTimeout(r,15));};
const click=selector=>{const el=document.querySelector(selector);assert.ok(el,'Missing '+selector);el.click();};
const input=(selector,value)=>{const el=document.querySelector(selector);assert.ok(el);el.value=value;el.dispatchEvent(new window.Event('input',{bubbles:true}));};
const change=(selector,value)=>{const el=document.querySelector(selector);assert.ok(el);el.value=value;el.dispatchEvent(new window.Event('change',{bubbles:true}));};
const saved=()=>parseStore(window.localStorage.getItem(STORE_KEY));
test('Learning journey, notes, independent checks, hints after reload, labs and profiles',async()=>{
 assert.match(document.querySelector('h1').textContent,/make it click/);
 await go('lesson/L01.01');assert.match(document.querySelector('h1').textContent,/light turn on/);
 assert.equal(document.querySelector('[data-step="4"]').disabled,true);
 click('[data-action="next-step"]');assert.equal(document.querySelector('[data-action="next-step"]').disabled,true);
 click('[data-predict="0"]');click('[data-action="next-step"]');assert.match(document.body.textContent,/Prediction saved/);
 click('[data-action="next-step"]');click('[data-lab="switch"]');assert.match(document.querySelector('#lab-stage').textContent,/6.82/);
 click('[data-action="next-step"]');click('[data-action="next-step"]');assert.ok(document.querySelector('#reflection'),'Empty explanation must not advance');
 input('#reflection','The charge needs a complete path. Energy changes into light and heat.');
 input('#lesson-note','I need a return path.');
 click('[data-action="next-step"]');
 for(let i=0;i<5;i++){click(`[data-answer="${lessons[0].questions[i].answer}"]`);click('[data-action="check-answer"]');click('[data-action="next-question"]');}
 assert.match(document.body.textContent,/5 of 5 checks/);click('[data-action="finish"]');await new Promise(r=>setTimeout(r,15));
 let s=saved();assert.deepEqual(s.profiles[0].lessons,['L01.01']);assert.equal(s.profiles[0].notes['L01.01'],'I need a return path.');
 await go('lesson/L01.01');click('[data-answer="0"]');click('[data-action="check-answer"]');assert.equal(saved().profiles[0].progress['L01.01'].events.at(-1).assisted,true);
 await go('lesson/L01.02');click('[data-action="next-step"]');click('[data-predict="0"]');click('[data-action="next-step"]');click('[data-action="next-step"]');click('[data-action="next-step"]');input('#reflection','The hidden strip connects a to e in the same row.');click('[data-action="next-step"]');click('[data-action="hint"]');
 await go('home');await go('lesson/L01.02');click('[data-answer="0"]');click('[data-action="check-answer"]');assert.equal(saved().profiles[0].progress['L01.02'].events.at(-1).assisted,true,'Revealed answer remains assisted after re-entering');
 await go('lab');for(const l of lessons){change('#lab-select',l.lab);assert.ok(document.querySelector('#lab-stage').textContent.length>40);assert.ok(!/undefined|NaN/.test(document.querySelector('#lab-stage').textContent));}
 change('#lab-select','voltage');change('[data-field="red"]','0');change('[data-field="black"]','3.3');assert.match(document.querySelector('#lab-stage').textContent,/-3.30 V/);
 change('#lab-select','atoms');click('[data-lab="electron-right"]');assert.match(document.querySelector('#lab-stage').textContent,/Net: \+1e/);assert.match(document.querySelector('#lab-stage').textContent,/Net: -1e/);
 await go('notebook');input('#glossary-search','resolution');assert.equal(document.querySelectorAll('.term-card').length,1);assert.match(document.body.textContent,/I need a return path/);
 await go('path');assert.equal(document.querySelectorAll('.lesson-card').length,12);assert.match(document.body.textContent,/remaining 208/);
 await go('profile');input('#new-profile-form input','Second learner');document.querySelector('#new-profile-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));s=saved();assert.equal(s.profiles.length,2);assert.deepEqual(s.profiles[1].lessons,[]);assert.deepEqual(s.profiles[0].lessons,['L01.01']);
 assert.ok(document.querySelector('[data-action="sync-create"]'));assert.match(document.body.textContent,/beginning EL/);
 change('#profile-select',s.profiles[0].id);assert.equal(saved().active,s.profiles[0].id);
 await go('lesson/DOES-NOT-EXIST');assert.match(document.querySelector('h1').textContent,/not found/);
});
test.after(()=>{dom.window.close();globalThis.setInterval=interval;});
