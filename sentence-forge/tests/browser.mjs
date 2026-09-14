// Run with PLAYWRIGHT_MODULE and CHROME_PATH when the browser is not in the standard cache.
import {createRequire} from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {MISSIONS,BY_ID} from '../content.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const PREFIX='/engineering-quest/sentence-forge/';
const qaDir=process.env.QA_DIR||fs.mkdtempSync(path.join(os.tmpdir(),'sentence-forge-qa-'));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.ttf':'font/ttf','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{let name=decodeURIComponent(req.url.split('?')[0]);if(!name.startsWith(PREFIX)){res.writeHead(404);res.end();return;}name=name.slice(PREFIX.length)||'index.html';try{let filename=path.join(root,name);res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream'});res.end(fs.readFileSync(filename));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}${PREFIX}`;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();page.setDefaultTimeout(5000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
const click=async action=>page.locator(`[data-action="${action}"]`).first().click();
const nav=async name=>page.locator(`button[data-action="nav"][data-view="${name}"]`).first().click();
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sentence-forge.save.v1')));
async function solve({advance=true}={}){let id=await page.locator('.order-panel').getAttribute('data-qid'),q=BY_ID[id];assert.ok(q,id);if(q.type!=='choice'){for(let i=0;i<q.tokens.length;i++)await page.locator(`[data-action="add-token"][data-index="${i}"]`).click();await click('run');}await page.locator(`[data-action="answer"][data-index="${q.answer}"]`).click();if(advance&&await page.locator('[data-action="next"]').count())await click('next');return id;}
try{
 await page.clock.install();await page.goto(base);await page.evaluate(()=>document.fonts.ready);assert.equal(await page.locator('.district-card').count(),9);
 await page.screenshot({path:qaDir+'/factory-desktop.png',fullPage:true});
 await click('campaign');await click('run');assert.match(await page.locator('.feedback').innerText(),/does not match/);await solve({advance:false});let first=await saved();assert.equal(first.profiles[0].notebook.length,1);assert.equal(first.profiles[0].records['core.action'].correct,0);assert.equal(first.profiles[0].completed.length,1);
 await page.reload();assert.equal((await saved()).profiles[0].completed.length,1);await nav('repair');await click('repair-start');for(let i=0;i<5;i++)await solve();assert.match(await page.locator('.finish-card').innerText(),/Clean repair/);assert.equal((await saved()).profiles[0].notebook[0].clean,1);console.log('PASS: failed attempt, assisted completion, reload, and five-order repair');
 await click('finish-home');await page.locator('[data-action="district"][data-id="paragraph"]').click();await solve({advance:false});assert.match(await page.locator('.feedback').innerText(),/setup/);await page.screenshot({path:qaDir+'/paragraph-desktop.png',fullPage:true});await click('exit');await click('confirm-exit');
 await nav('learn');await page.locator('[data-action="lesson"][data-id="connect"]').click();await click('lesson-done');assert.ok((await saved()).profiles[0].lessons.includes('connect'));
 await nav('catalog');await page.fill('#word-search','unless');assert.ok(await page.locator('.word-card').count()>0);assert.match(await page.locator('.word-grid').innerText(),/if not/);
 await click('profiles');await page.fill('#new-profile-form input','Myla');await page.locator('#new-profile-form button').click();assert.equal((await saved()).profiles.length,2);assert.equal((await saved()).profiles[1].completed.length,0);console.log('PASS: paragraph, lesson, catalog, and profile isolation');
 for(const mode of ['conquer','duel','millionaire','rocket','switch','practice','rush','blitz']){
  await nav('arcade');await page.locator(`[data-mode="${mode}"]`).click();let rounds={conquer:10,duel:5,millionaire:10,rocket:7,switch:2,practice:2,rush:1,blitz:1}[mode];for(let i=0;i<rounds;i++)await solve();
  if(mode==='duel'){assert.ok(await page.locator('[data-action="duel-next"]').count());let before=await saved();await click('duel-next');for(let i=0;i<5;i++)await solve();let after=await saved();assert.equal(after.profiles[1].xp,before.profiles[1].xp);assert.match(await page.locator('.finish-card').innerText(),/shared victory/);}
  if(['conquer','duel','millionaire','rocket'].includes(mode)){assert.equal(await page.locator('.finish-card').count(),1);await click('finish-arcade');}else{await click('exit');await click('confirm-exit');}
  console.log('PASS:',mode);
 }
 await nav('arcade');await page.selectOption('#arcade-duration','30');await page.locator('[data-mode="blitz"]').click();await click('pause');await page.clock.fastForward(35000);assert.equal(await page.locator('.finish-card').count(),0);await page.locator('.pause-cover [data-action="pause"]').click();await page.clock.fastForward(31000);assert.equal(await page.locator('.finish-card').count(),1);console.log('PASS: clock expiration and paused deadline');await click('finish-home');
 await page.setViewportSize({width:390,height:844});for(const name of ['factory','arcade','learn','catalog','repair','progress']){await nav(name);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${name}`);}await nav('assembly');await page.screenshot({path:qaDir+'/assembly-phone.png',fullPage:true});await solve({advance:false});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await click('exit');await click('confirm-exit');console.log('PASS: mobile navigation, assembly, and no horizontal overflow');
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();await context.setOffline(true);await page.reload();assert.ok(await page.locator('.district-card').count()===9);await nav('arcade');await page.locator('[data-mode="practice"]').click();await solve({advance:false});console.log('PASS: cached offline launch and gameplay');
 assert.deepEqual(errors,[]);console.log('PASS: no browser errors');
}finally{await browser.close();server.close();}
