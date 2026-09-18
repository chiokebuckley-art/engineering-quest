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

const tap=async action=>{if(action==='start'&&await page.locator('.trail-full-map').count())await page.locator('.trail-full-map').evaluate(el=>el.open=true);await page.locator(`[data-trail="${action}"]`).first().click();if(action==='home'&&await page.locator('.trail-full-map').count())await page.locator('.trail-full-map').evaluate(el=>el.open=true);};
async function quiz(wrong=0){for(let i=0;i<5;i++)await page.locator(`[data-trail="answer"][data-index="${i<wrong?1:0}"]`).click();}
async function read(ms=60000){await tap('read');await page.clock.fastForward(ms);await tap('finish');assert.equal(await page.locator('.trail-passage').count(),0);}
try{
 await page.clock.install();await page.goto(base+'#adventure');await page.locator('.trail-full-map>summary').click();await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.trail-chapter').count(),12);assert.equal(await page.locator('[data-trail="start"]:not(:disabled)').count(),2);
 await page.screenshot({path:qaDir+'/trail-desktop.png',fullPage:true});
 await tap('camp');await tap('camp-answer');assert.equal(await page.locator('.trail-sounds').innerText(),'d\no\ng');await tap('home');
 await tap('start');await read();await tap('review');await tap('quiz');await quiz();assert.match(await page.locator('.trail-score').innerText(),/Supported practice/);await tap('home');
 assert.equal(await page.locator('[data-trail="start"]:not(:disabled)').count(),2);
 await tap('start');await read(600000);await quiz();await tap('home');
 await page.locator('[data-trail="start"][data-id="trail-1-2"]').click();await read();await quiz();await tap('home');
 assert.equal(await page.locator('[data-trail="start"]:not(:disabled)').count(),4);await page.reload();assert.equal(await page.locator('[data-trail="start"]:not(:disabled)').count(),4);
 console.log('PASS: supported rescue, independent rescue, grade unlock, persisted reload, hidden passage');
 await nav('reading');await tap('start');await read();await quiz(2);assert.match(await page.locator('.trail-score').innerText(),/Needs 4/);await tap('home');
 assert.equal((await saved()).profiles[0].trail.bests['trail-1-1'],undefined);
 await page.check('#trail-duel');await tap('start');await read(60000);await quiz();assert.match(await page.locator('h1').innerText(),/Player 2/);assert.equal(await page.locator('details').count(),0);
 await tap('handoff');await read(30000);await quiz(2);assert.match(await page.locator('h1').innerText(),/Player 1 wins/);
 await page.screenshot({path:qaDir+'/reading-result.png',fullPage:true});await tap('home');
 await page.uncheck('#trail-duel');await tap('start');await tap('read');await page.clock.runFor(5000);await click('profiles');await click('close-modal');assert.match(await page.locator('h1').innerText(),/Take a breath/);await tap('resume');await page.clock.runFor(5000);await tap('finish');await quiz();assert.match(await page.locator('.trail-score').innerText(),/Supported practice/);await tap('home');
 console.log('PASS: comprehension threshold, two-player winner, no answer leak at handoff, interrupted run excluded');
 await page.selectOption('#trail-grade','12');assert.equal(await page.locator('.trail-chapter').count(),2);await tap('start');await tap('read');assert.ok((await page.locator('.trail-passage').innerText()).length>2000);await nav('adventure');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:qaDir+'/trail-mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await tap('start');await tap('read');await page.screenshot({path:qaDir+'/trail-story-mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await context.setOffline(true);await page.reload();assert.equal(await page.locator('.trail-chapter').count(),12);assert.deepEqual(errors,[]);console.log('PASS: advanced passage, mobile layout, offline reading content, no runtime errors');
}finally{await browser.close();server.close();}
