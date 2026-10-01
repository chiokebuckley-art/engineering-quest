import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {worlds,skillNames} from '../content.js';
import {fresh,question,rng} from '../engine.js';
import {decisions} from '../advanced-content.js';
const require=createRequire(import.meta.url),root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const mime={'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.html':'text/html'};
const server=createServer(async(req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\/forex-quest\//,'');const file=path.resolve(root,name||'index.html');if(!file.startsWith(root)){res.writeHead(403).end();return;}const bytes=await readFile(file);res.setHeader('Content-Type',mime[path.extname(file)]||'text/plain');res.end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/forex-quest/`;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
const qa=process.env.QA_DIR||'/tmp/forex-qa';await mkdir(qa,{recursive:true});
try{
// Render repository-owned vector icons to standalone PNGs; no external image assets.
const icon=await browser.newPage();const svg=await readFile(path.join(root,'icon.svg'),'utf8');
for(const size of [192,512]){await icon.setViewportSize({width:size,height:size});await icon.setContent(`<style>body{margin:0}svg{width:100vw;height:100vh;display:block}</style>${svg}`);await icon.screenshot({path:path.join(root,`icon-${size}.png`)});}await icon.close();
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto(base);
await page.screenshot({path:path.join(qa,'desktop.png'),fullPage:true});
assert.equal(await page.locator('[data-world]').count(),12);
await page.getByRole('button',{name:'Continue expedition'}).click();await page.getByRole('button',{name:/Two currencies/}).click();await page.getByRole('button',{name:'Mark explored & try it'}).click();
await page.locator('#answer').fill('-10');await page.getByRole('button',{name:'Check answer'}).click();
await page.getByRole('button',{name:/Mistake notebook/}).click();assert.equal(await page.locator('[data-repair]').count(),1);
await page.locator('[data-repair]').click();const answer=await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('forex-quest.profiles.v1'));return Object.values(p.players.find(x=>x.id===p.active).progress.notebook)[0].answer;});
await page.locator('#answer').fill(String(answer));await page.getByRole('button',{name:'Check answer'}).click();await page.locator('#next').click();assert.ok((await page.locator('main').innerText()).toLowerCase().includes('2 of 5'));
await page.getByRole('button',{name:/Practice arcade/}).click();assert.equal(await page.locator('[data-skill]').count(),27);
await page.locator('[data-skill="parityjudgment"]').click();await page.locator('input[type=radio]').first().check();await page.getByRole('button',{name:'Check answer'}).click();await page.locator('#next').waitFor();
await page.getByRole('button',{name:/Trading desk/}).click();await page.locator('#reason').fill('Practice a long entry with a defined stop.');await page.getByRole('button',{name:'Open simulated position'}).click();await page.getByRole('heading',{name:'Open position'}).waitFor();
for(let i=0;i<6;i++)await page.locator('#advance').click();await page.getByText(/Stop filled at next available quote/).waitFor();assert.ok((await page.locator('main').innerText()).includes('$9973.00'));
await page.screenshot({path:path.join(qa,'desk.png'),fullPage:true});
await page.locator('#scenario').selectOption('range');assert.ok((await page.locator('main').innerText()).includes('$10000.00'));
await page.getByRole('button',{name:/Research labs/}).click();await page.getByRole('button',{name:'Build the hedge',exact:true}).click();await page.getByText(/Contract rate:/).waitFor();
await page.getByRole('button',{name:'FX option workshop',exact:true}).click();await page.getByRole('button',{name:'Price and stress the option'}).click();await page.getByText(/Spot call delta:/).waitFor();
await page.getByRole('button',{name:'Strategy test bench',exact:true}).click();await page.getByRole('button',{name:'Evaluate training & freeze'}).click();assert.ok(await page.locator('#lookback').isDisabled());await page.getByRole('button',{name:'Reveal later holdout'}).click();await page.getByRole('rowheader',{name:'Later holdout'}).waitFor();
await page.screenshot({path:path.join(qa,'research.png'),fullPage:true});
await page.getByRole('button',{name:'Order-flow observatory',exact:true}).click();await page.getByRole('button',{name:'Inspect the buckets'}).click();await page.getByText(/Mean absolute bucket imbalance:/).waitFor();
// Populate only prior mastery to exercise every lesson route and challenge UI without thousands of preliminary repetitions.
const mastered=fresh();for(const k of Object.keys(skillNames))mastered.records[k]={history:Array(12).fill(true),examples:Array.from({length:6},(_,i)=>`${k}-${i}`),due:Date.now()+86400000};for(const w of worlds)mastered.exams[w.id]={passed:true,best:12};
await page.evaluate(s=>{const p=JSON.parse(localStorage.getItem('forex-quest.profiles.v1'));p.players.find(x=>x.id===p.active).progress=s;localStorage.setItem('forex-quest.profiles.v1',JSON.stringify(p));},mastered);await page.reload();
for(const w of worlds)for(const l of w.lessons){await page.locator(`[data-world="${w.id}"]`).click();assert.equal(await page.locator('[data-lesson]').count(),3);await page.locator(`[data-lesson="${l.id}"]`).click();await page.getByRole('button',{name:'Mark explored & try it'}).waitFor();await page.getByRole('button',{name:/Academy/}).click();}
// Run a whole challenge with genuinely wrong first answers; previously passed result must not be erased.
await page.locator('[data-world="funding"]').click();await page.locator('#world-exam').click();
for(let i=0;i<12;i++){if(await page.locator('#answer').count())await page.locator('#answer').fill('-999999');else {const prompt=await page.locator('section h2').innerText();const row=Object.values(decisions).flat().find(r=>r[0]===prompt);const labels=page.locator('.choices label');let chosen=false;for(let j=0;j<await labels.count();j++){if(!(await labels.nth(j).innerText()).includes(row[1])){await labels.nth(j).locator('input').check();chosen=true;break;}}assert.ok(chosen);}await page.getByRole('button',{name:'Check answer'}).click();await page.locator('#next').click();}
await page.getByRole('heading',{name:'0 / 12'}).waitFor();assert.ok((await page.locator('main').innerText()).includes('not yet cleared'));
await page.getByRole('button',{name:'Return to academy'}).click();
// Complete the integrated capstone with independently generated answer lookup values.
const numeric=new Map();for(const k of Object.keys(skillNames).filter(k=>!decisions[k])){const random=rng(999);for(let i=0;i<10000;i++){const q=question(k,random);numeric.set(q.prompt,q.answer);}}
await page.locator('[data-world="capstone"]').click();await page.locator('#world-exam').click();
for(let i=0;i<54;i++){const prompt=await page.locator('section h2').innerText();if(await page.locator('#answer').count()){assert.ok(numeric.has(prompt),prompt);await page.locator('#answer').fill(String(numeric.get(prompt)));}else{const row=Object.values(decisions).flat().find(r=>r[0]===prompt);assert.ok(row);const labels=page.locator('.choices label');for(let j=0;j<await labels.count();j++){if((await labels.nth(j).innerText()).trim()===row[1]){await labels.nth(j).locator('input').check();break;}}}await page.getByRole('button',{name:'Check answer'}).click();await page.locator('#next').click();}
await page.getByRole('heading',{name:'54 / 54'}).waitFor();await page.getByText('World restored. Continue the expedition.').waitFor();await page.getByRole('button',{name:'Return to academy'}).click();
await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(qa,'mobile.png'),fullPage:true});
for(const name of ['Trading desk','Research labs','Mistake notebook','Field guide']){await page.getByRole('button',{name:new RegExp(name)}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' overflow');}
await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
await context.setOffline(true);await page.reload();await page.getByRole('heading',{name:/Understand the market/}).waitFor();await page.getByRole('button',{name:/Research labs/}).click();await page.getByRole('button',{name:'Build the hedge',exact:true}).click();await page.getByText(/Contract rate:/).waitFor();await context.setOffline(false);
assert.deepEqual(errors,[]);console.log('PASS browser: 12 worlds, 36 lesson routes, 27 skills, repair flow, 12-question failure and 54-question capstone success, three-scenario desk, all four labs, save migration, mobile overflow, offline reload, no uncaught errors.');
}finally{await browser.close();server.close();}

