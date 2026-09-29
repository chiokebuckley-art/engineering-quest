import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {Window} from 'happy-dom';import {searchCapstone,bestCapstone} from '../src/energy-capstone.js';
const win=new Window({url:'http://localhost:5187/?activity=energy-capstone',settings:{disableCSSFileLoading:true,disableJavaScriptFileLoading:true}});win.document.write(await fs.readFile(new URL('../index.html',import.meta.url),'utf8'));
for(const [k,v]of Object.entries({window:win,document:win.document,localStorage:win.localStorage,navigator:win.navigator,location:win.location,matchMedia:()=>({matches:true}),requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{}}))Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});
const tick=()=>new Promise(r=>setTimeout(r,10));await import('../src/app.js');await tick();await tick();const $=s=>document.querySelector(s),click=async s=>{assert.ok($(s),s);assert.equal($(s).disabled,false,s);$(s).click();await tick();},save=()=>JSON.parse(localStorage.getItem('science-quest.v1')).snapshot,active=()=>save().profiles.find(p=>p.id===save().active);
const fill=async values=>{for(const [key,value]of Object.entries(values)){const el=$(`[data-energy-cap="${key}"]`);el.value=String(value);el.dispatchEvent(new win.Event('change',{bubbles:true}));await tick();}};
test('Capstone opens by link, preserves drafts and records both revised design briefs',async()=>{
 assert.match($('h1').textContent,/Power an Island Outpost/);assert.equal($('[data-action=energy-cap-search]').disabled,true);
 await fill({storage:1400});await click('[data-action=energy-cap-exit]');await click('[data-action=energy-cap-open]');assert.equal(active().energyCapstone.draft.storage,1400);
 for(let stage=0;stage<2;stage++){
 const good=searchCapstone(stage).filter(r=>r.feasible);
 for(const design of [{storage:800,power:80,converter:'standard',schedule:'together'},good[0].design,good[1].design]){await fill(design);await click('[data-action=energy-cap-test]');}
 await fill(good[1].design);await click('[data-action=energy-cap-search]');assert.equal(active().energyCapstone.searches[stage].rows.length,80);assert.match($('#main').textContent,/Show every evaluated plan/);assert.ok(document.querySelector('svg[aria-label^="All 80 designs"]'));
 const chosen=good.find(r=>r.cost===bestCapstone(stage));await fill({...good[1].design,choice:chosen.key,reason:'joint',limits:'bounded',notes:'I compared the power, reserve and mass limits before minimizing cost.'});await click('[data-action=energy-cap-finish]');assert.equal(active().energyCapstone.stage,stage+1);
 }
 assert.equal(active().energyCapstone.complete,true);assert.deepEqual(active().runs,{});assert.match($('#main').textContent,/Both design briefs recorded/);await click('[data-action=nav][data-view=journal]');assert.match($('#main').textContent,/Energy design capstone/);assert.match($('#main').textContent,/I compared the power/);
});
test('Another profile starts independently and worked help remains saved on reopening',async()=>{
 await click('[data-action=nav][data-view=settings]');$('#profile-name').value='Outpost designer';$('#new-profile').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));await tick();await click('[data-action=nav][data-view=explore]');await click('[data-action=nav][data-view=courses]');await click('[data-action=energy-cap-open]');assert.equal(active().energyCapstone.trials.length,0);await click('[data-action=energy-cap-help]');assert.equal(active().energyCapstone.assisted,true);await click('[data-action=energy-cap-exit]');await click('[data-action=energy-cap-open]');assert.match($('#main').textContent,/Worked help used/);assert.equal(save().profiles[0].energyCapstone.complete,true);
});
