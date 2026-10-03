import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fresh} from '../engine.js';
const require=createRequire(import.meta.url),root=fileURLToPath(new URL('../',import.meta.url));
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const mime={'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.html':'text/html','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\/forex-quest\//,'');const file=path.resolve(root,name||'index.html');if(!file.startsWith(root)){res.writeHead(403).end();return;}const bytes=await readFile(file);res.setHeader('Content-Type',mime[path.extname(file)]||'text/plain');res.end(bytes);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/forex-quest/`;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
const qa=process.env.QA_DIR||'/tmp/forex-qa';await mkdir(qa,{recursive:true});
const KEY='forex-quest.profiles.v1';
const progress=page=>page.evaluate(k=>{const p=JSON.parse(localStorage.getItem(k));return p.players.find(x=>x.id===p.active).progress;},KEY);
const seed=(page,players,active)=>page.evaluate(([k,players,active])=>localStorage.setItem(k,JSON.stringify({active,players})),[KEY,players,active]);
const step=async page=>Number((await page.locator('.desk-head .up-eyebrow').innerText()).match(/STEP (\d+) OF 11/)[1]);
const plan='I expect drift up into the decision; wrong if price breaks 1.0990. Spread cost counted.';
try{
 const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);

 // v1 save migrates to v2 and records stay untouched.
 const legacy={version:1,records:{quote:{history:[true,false,true],examples:['a','b','c'],due:0}},notebook:{},lessons:['base'],journal:[{summary:'Earlier desk note'}],exams:{}};
 await seed(page,[{id:'a',name:'Jo',progress:legacy}],'a');await page.reload();
 await page.locator('nav').getByRole('button',{name:/Trading desk/}).click();
 let saved=await progress(page);assert.equal(saved.version,2);assert.deepEqual(saved.records,legacy.records);assert.equal(saved.day.n,1);assert.deepEqual(saved.plans,[]);

 // Plan score 0–4 updates live from the ticket; Fix size is a suggestion.
 await page.getByRole('button',{name:'Pause'}).click();
 const score=async()=>(await page.locator('#plan-score').innerText()).trim();
 await page.locator('#units').fill('');assert.equal(await score(),'0/4');
 await page.locator('#units').fill('10000');assert.equal(await score(),'1/4');
 await page.locator('#reason').fill('I expect a drift higher before the gap.');assert.equal(await score(),'2/4');
 await page.locator('#reason').fill('I expect a drift higher; wrong if price breaks 1.0990.');assert.equal(await score(),'3/4');
 await page.locator('#ack-cost').check();assert.equal(await score(),'4/4');
 await page.locator('#units').fill('40000');assert.equal(await score(),'3/4');
 await page.getByRole('button',{name:'Fix size'}).click();assert.equal(await page.locator('#units').inputValue(),'30000');assert.equal(await score(),'4/4');
 await page.locator('#units').fill('40000');assert.equal(await score(),'3/4');
 await page.getByRole('button',{name:/Approve & open/}).click();await page.getByRole('heading',{name:'Open position'}).waitFor();
 saved=await progress(page);assert.equal(saved.plans.length,1);assert.equal(saved.plans[0].score,3);assert.deepEqual(saved.records,legacy.records,'plan approval never writes records');
 await page.screenshot({path:path.join(qa,'floor-desk.png'),fullPage:true});

 // Clock: paused desk does not move; 3× resumes advance(); pause stops it again.
 assert.equal(await step(page),0);await page.waitForTimeout(1800);assert.equal(await step(page),0);
 await page.getByRole('button',{name:'Play at 3×'}).click();await page.waitForFunction(()=>/STEP [1-9]/.test(document.querySelector('.desk-head .up-eyebrow').textContent),null,{timeout:5000});
 await page.getByRole('button',{name:'Pause'}).click();const held=await step(page);await page.waitForTimeout(1800);assert.equal(await step(page),held);
 assert.match(await page.locator('#clock-now').innerText(),/LONDON SESSION · \d\d:\d\d · ⏸ paused/);
 await page.locator('nav').getByRole('button',{name:/The floor/}).click();await page.locator('nav').getByRole('button',{name:/Trading desk/}).click();assert.equal(await step(page),held,'the clock only runs on the desk');
 if(await page.locator('#close').count())await page.locator('#close').click();

 // Streak: close with nothing due → 1; next day closed clean → 2. P&L ledger is shown, not rewarded.
 await page.locator('nav').getByRole('button',{name:/Close of day/}).click();await page.getByRole('heading',{name:'Desk closed. Here’s the day.'}).waitFor();
 assert.match(await page.locator('main').innerText(),/PRACTICE P&L LEDGER/i);
 saved=await progress(page);assert.deepEqual(saved.streak,{current:1,best:1,lastClearedDay:1});assert.equal(saved.day.session,'closed');
 if(await page.locator('[data-value=plan]').count()){await page.locator('[data-value=plan]').first().click();saved=await progress(page);assert.ok(saved.journal.some(l=>l.reflection==='plan'));}
 await page.getByRole('button',{name:'Start Day 2'}).click();await page.locator('#up-next').waitFor();
 saved=await progress(page);assert.equal(saved.day.n,2);assert.equal(saved.day.session,'asia');assert.equal(saved.loop.desk,false);
 await page.locator('nav').getByRole('button',{name:/Close of day/}).click();assert.equal((await progress(page)).streak.current,2);
 assert.equal((await page.locator('.scorecard').innerText()).includes('2\nday streak'),true);
 // A due card left at close breaks the streak on the next Start Day.
 await page.getByRole('button',{name:'Start Day 3'}).click();
 await page.locator('nav').getByRole('button',{name:/Desk calls/}).click();await page.locator('[data-skill="quote"]').click();await page.locator('#answer').fill('-1');await page.getByRole('button',{name:'Check',exact:true}).click();
 await page.locator('nav').getByRole('button',{name:/Close of day/}).click();assert.equal((await progress(page)).streak.current,2);
 await page.getByRole('button',{name:'Start Day 4'}).click();saved=await progress(page);assert.equal(saved.streak.current,0);assert.equal(saved.streak.best,2);

 // Licence tiers: passed challenges (only) set the desk account and title.
 const passed=n=>Object.fromEntries(['harbor','execution','risk'].slice(0,n).map(k=>[k,{passed:true,best:12,total:12,at:1}]));
 await seed(page,[{id:'a',name:'Jo',progress:{...fresh(),exams:passed(1)}}],'a');await page.reload();
 await page.locator('nav').getByRole('button',{name:/Trading desk/}).click();assert.ok((await page.locator('.desk-head').innerText()).includes('$10,000.00'));
 await seed(page,[{id:'a',name:'Jo',progress:{...fresh(),exams:passed(2)}}],'a');await page.reload();
 await page.locator('nav').getByRole('button',{name:/Trading desk/}).click();assert.ok((await page.locator('.desk-head').innerText()).includes('$25,000.00'));assert.ok((await page.locator('.desk-head').innerText()).includes('$250'));
 await page.locator('nav').getByRole('button',{name:/Licences & league/}).click();assert.equal(await page.locator('.career .on').innerText(),'Junior trader');
 assert.equal(await page.locator('.licence').nth(1).locator('.panel-head span').nth(1).innerText(),'PASSED');
 await seed(page,[{id:'a',name:'Jo',progress:{...fresh(),exams:passed(3)}}],'a');await page.reload();
 await page.locator('nav').getByRole('button',{name:/Licences & league/}).click();assert.equal(await page.locator('.career .on').innerText(),'Trader');
 await page.screenshot({path:path.join(qa,'floor-licences.png'),fullPage:true});

 // League: two local profiles ranked on process; P&L tab is unranked.
 const sam={...fresh(),exams:passed(3),plans:[{at:1,day:1,score:4,checks:[true,true,true,true],tradeIndex:null}],streak:{current:5,best:5,lastClearedDay:1},journal:[{summary:'x',profit:-40,day:1}]};
 const jo={...fresh(),exams:passed(1),journal:[{summary:'y',profit:900,day:1}]};
 await seed(page,[{id:'a',name:'Jo',progress:jo},{id:'b',name:'Sam',progress:sam}],'a');await page.reload();
 await page.locator('nav').getByRole('button',{name:/Licences & league/}).click();await page.getByRole('button',{name:'Desk league'}).click();
 const rows=page.locator('table.league tbody tr');assert.equal(await rows.count(),2);
 assert.match(await rows.nth(0).innerText(),/Sam/);assert.match(await rows.nth(0).innerText(),/60/);assert.match(await rows.nth(1).innerText(),/Jo \(you\)/);
 await page.getByRole('button',{name:/Practice P&L/}).click();assert.equal(await page.locator('table.league thead th').first().innerText(),'PLAYER');assert.match(await page.locator('main').innerText(),/Unranked/);
 await page.screenshot({path:path.join(qa,'floor-league.png'),fullPage:true});
 const all=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);assert.deepEqual(all.players.find(p=>p.id==='b').progress.records,{},'league is read-only');

 await page.setViewportSize({width:390,height:844});
 for(const name of [/The floor/,/Briefing/,/Desk calls/,/Trading desk/,/Strategy lab/,/Risk review/,/Close of day/,/Licences & league/]){await page.locator('nav').getByRole('button',{name}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),String(name)+' overflow');}
 assert.deepEqual(errors,[]);
 console.log('PASS floor: v1→v2 migration, plan score 0–4 with Fix size, clock pause/resume on the desk only, streak increment and break, licence tier account/title unlocks, two-profile read-only league with unranked P&L, mobile overflow.');
}finally{await browser.close();server.close();}
